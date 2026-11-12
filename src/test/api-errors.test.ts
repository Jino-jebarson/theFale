import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, getAccessToken, setAccessToken } from "@/lib/api";
import { errorMessage } from "@/lib/errorMessage";

const json = (data: unknown, status = 200, headers: HeadersInit = {}) => new Response(JSON.stringify(data), { status, headers });

describe("API failures and request recovery", () => {
  beforeEach(() => { setAccessToken(null); vi.stubGlobal("fetch", vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

  it("retries a transient read once", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(json({}, 503)).mockResolvedValueOnce(json({ success: true, data: [1] }));
    await expect(apiFetch("/jobs")).resolves.toEqual([1]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("never automatically retries a failed mutation", async () => {
    vi.mocked(fetch).mockResolvedValue(json({}, 503));
    await expect(apiFetch("/facility/jobs", { method: "POST", body: "{}" })).rejects.toMatchObject({ status: 503 });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("rejects a logical failure even if HTTP status is 200", async () => {
    vi.mocked(fetch).mockResolvedValue(json({ success: false, message: "Cannot save" }));
    await expect(apiFetch("/profile", { method: "PUT" })).rejects.toMatchObject({ status: 422, message: "Cannot save" });
  });

  it("rejects an HTML success response instead of returning it as data", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("<html>Proxy error</html>"));
    await expect(apiFetch("/profile", { retry: false })).rejects.toMatchObject({ status: 502 });
  });

  it("preserves field validation errors", async () => {
    vi.mocked(fetch).mockResolvedValue(json({ message: "Invalid fields", validationErrors: { title: "Required" } }, 400));
    await expect(apiFetch("/facility/jobs", { method: "POST" })).rejects.toMatchObject({ validationErrors: { title: "Required" } });
  });

  it("rejects a response with the wrong data shape", async () => {
    vi.mocked(fetch).mockResolvedValue(json({ success: true, data: {} }));
    await expect(apiFetch("/jobs", { validate: Array.isArray, retry: false })).rejects.toMatchObject({ status: 502 });
  });

  it("rejects primitive JSON masquerading as a successful API payload", async () => {
    vi.mocked(fetch).mockResolvedValue(json("Unexpected response"));
    await expect(apiFetch("/jobs", { retry: false })).rejects.toMatchObject({ status: 502 });
  });

  it("surfaces rate limits without immediately retrying", async () => {
    vi.mocked(fetch).mockResolvedValue(json({}, 429, { "Retry-After": "45" }));
    const error = await apiFetch("/jobs").catch((cause: unknown) => cause);
    expect(errorMessage(error)).toContain("45 seconds");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("does not refresh an unsuccessful public login", async () => {
    vi.mocked(fetch).mockResolvedValue(json({ message: "Invalid credentials" }, 401));
    await expect(apiFetch("/auth/admin/login", { method: "POST", skipAuth: true })).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("does not expire a session when the refresh server is unavailable", async () => {
    setAccessToken("existing-token");
    const expired = vi.fn();
    window.addEventListener("fale:auth-expired", expired);
    vi.mocked(fetch).mockImplementation(async (url) => String(url).endsWith("/auth/refresh") ? json({}, 503) : json({}, 401));
    await expect(apiFetch("/profile", { retry: false })).rejects.toMatchObject({ status: 503 });
    expect(getAccessToken()).toBe("existing-token");
    expect(expired).not.toHaveBeenCalled();
    window.removeEventListener("fale:auth-expired", expired);
  });

  it("expires a session only when refresh credentials are rejected", async () => {
    setAccessToken("existing-token");
    vi.mocked(fetch).mockImplementation(async () => json({}, 401));
    await expect(apiFetch("/profile", { retry: false })).rejects.toMatchObject({ status: 401 });
    expect(getAccessToken()).toBeNull();
  });

  it("keeps the replayed mutation's actual error and idempotency key", async () => {
    setAccessToken("old-token");
    const keys: Array<string | null> = [];
    vi.mocked(fetch).mockImplementation(async (url, options) => {
      if (String(url).endsWith("/auth/refresh")) return json({ success: true, data: { accessToken: "new-token" } });
      const headers = new Headers(options?.headers);
      keys.push(headers.get("Idempotency-Key"));
      return headers.get("Authorization") === "Bearer new-token" ? json({}, 503) : json({}, 401);
    });
    await expect(apiFetch("/employer/wallet/topup", { method: "POST", body: "{}" })).rejects.toMatchObject({ status: 503 });
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBeTruthy();
    expect(keys[1]).toBe(keys[0]);
    expect(getAccessToken()).toBe("new-token");
  });

  it("shares one refresh request across concurrent unauthorized reads", async () => {
    setAccessToken("old-token");
    let refreshes = 0;
    vi.mocked(fetch).mockImplementation(async (url, options) => {
      if (String(url).endsWith("/auth/refresh")) {
        refreshes++;
        await new Promise((resolve) => setTimeout(resolve, 10));
        return json({ success: true, data: { accessToken: "new-token" } });
      }
      return new Headers(options?.headers).get("Authorization") === "Bearer new-token" ? json({ success: true, data: [] }) : json({}, 401);
    });
    await expect(Promise.all([apiFetch("/profile"), apiFetch("/applications")])).resolves.toEqual([[], []]);
    expect(refreshes).toBe(1);
  });

  it("also shares explicit session restoration requests", async () => {
    vi.mocked(fetch).mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 10));
      return json({ success: true, data: { accessToken: "restored-token", role: "ROLE_CANDIDATE" } });
    });
    const restore = () => apiFetch("/auth/refresh", { method: "POST", skipAuth: true, skipRefresh: true });
    const [first, second] = await Promise.all([restore(), restore()]);
    expect(first).toEqual(second);
    expect(getAccessToken()).toBe("restored-token");
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("aborts slow requests with a retryable user message", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation((_url, options) => new Promise((_resolve, reject) => {
      options?.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    }));
    const result = apiFetch("/jobs", { timeoutMs: 100, retry: false });
    const assertion = expect(result).rejects.toMatchObject({ status: 408 });
    await vi.advanceTimersByTimeAsync(101);
    await assertion;
    expect(fetch).toHaveBeenCalledOnce();
  });
});
