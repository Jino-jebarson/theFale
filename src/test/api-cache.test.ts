import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, setAccessToken } from "@/lib/api";

const response = (data: unknown, status = 200) => new Response(JSON.stringify({ success: status < 400, data }), { status });
beforeEach(() => { setAccessToken(null); vi.stubGlobal("fetch", vi.fn()); });
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals(); });

describe("shared API reads", () => {
  it("shares concurrent reads and returns independent values to callers", async () => {
    vi.mocked(fetch).mockResolvedValue(response([{ id: 1 }]));
    const [layout, page] = await Promise.all([apiFetch<any[]>("/profile"), apiFetch<any[]>("/profile")]);
    expect(fetch).toHaveBeenCalledOnce();
    layout[0].id = 99;
    expect(page[0].id).toBe(1);
    expect(await apiFetch("/profile")).toEqual([{ id: 1 }]);
    expect(fetch).toHaveBeenCalledOnce();
  });

  it("reuses fresh data across page mounts and fetches again after expiry", async () => {
    vi.useFakeTimers();
    vi.mocked(fetch).mockImplementation(async () => response([]));
    await apiFetch("/jobs"); await apiFetch("/jobs");
    expect(fetch).toHaveBeenCalledOnce();
    await vi.advanceTimersByTimeAsync(10001);
    await apiFetch("/jobs");
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("invalidates related reads after a write", async () => {
    vi.mocked(fetch).mockImplementation(async () => response([]));
    await apiFetch("/jobs");
    await apiFetch("/applications", { method: "POST", body: "{}" });
    await apiFetch("/jobs");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("never deduplicates writes", async () => {
    vi.mocked(fetch).mockImplementation(async () => response({}));
    await Promise.all([apiFetch("/profile", { method: "PUT" }), apiFetch("/profile", { method: "PUT" })]);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it("does not retain failed reads or invalid shapes", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(response({}, 503)).mockResolvedValueOnce(response({})).mockResolvedValueOnce(response([]));
    await expect(apiFetch("/jobs", { retry: false })).rejects.toMatchObject({ status: 503 });
    await expect(apiFetch("/jobs", { retry: false, validate: Array.isArray })).rejects.toMatchObject({ status: 502 });
    expect(await apiFetch("/jobs", { retry: false, validate: Array.isArray })).toEqual([]);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("clears cached data on account changes and logout", async () => {
    vi.mocked(fetch).mockImplementation(async () => response([]));
    setAccessToken("account-one"); await apiFetch("/profile");
    setAccessToken("account-one"); await apiFetch("/profile");
    expect(fetch).toHaveBeenCalledOnce();
    setAccessToken("account-two"); await apiFetch("/profile");
    setAccessToken(null); await apiFetch("/profile");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("does not let a read started before a write repopulate the cache", async () => {
    let finish!: (value: Response) => void;
    vi.mocked(fetch).mockImplementationOnce(() => new Promise(resolve => { finish = resolve; }))
      .mockResolvedValueOnce(response({})).mockResolvedValueOnce(response(["fresh"]));
    const oldRead = apiFetch("/jobs");
    await apiFetch("/applications", { method: "POST" });
    finish(response(["old"])); await oldRead;
    expect(await apiFetch("/jobs")).toEqual(["fresh"]);
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("allows fresh reads and keeps query parameters separate", async () => {
    vi.mocked(fetch).mockImplementation(async () => response([]));
    await apiFetch("/jobs?role=nurse"); await apiFetch("/jobs?role=doctor");
    await apiFetch("/jobs?role=nurse", { cacheMs: 0 });
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("never reuses public verification records", async () => {
    vi.mocked(fetch).mockImplementation(async () => response({}));
    await apiFetch("/verifications/id"); await apiFetch("/verifications/id");
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
