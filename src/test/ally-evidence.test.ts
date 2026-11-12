import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { apiFetch, setAccessToken } from "@/lib/api";
import { auditFacilityWithAi, getDailyMorningBriefWithAi, screenApplicationWithAi, streamChatWithAlly, suggestShiftPayWithAi } from "@/lib/adapters/aiAdapter";
import { formatConfidencePercent, readSessionAuditCache, writeSessionAuditCache } from "@/lib/allyAuditUtils";

vi.mock("@/lib/api", async original => ({ ...await original<typeof import("@/lib/api")>(), apiFetch: vi.fn() }));
const result = (extra = {}) => ({ success: true, task: "chat", provider: "claude", response: "Review the supplied details.", ...extra });
const request = () => JSON.parse(String(vi.mocked(apiFetch).mock.calls.at(-1)?.[1]?.body));
const stream = (text: string) => new Response(text, { headers: { "Content-Type": "text/event-stream" } });
beforeEach(() => { vi.clearAllMocks(); setAccessToken(null); vi.stubGlobal("fetch", vi.fn()); });
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("Ally evidence boundaries", () => {
  it("does not invent match scores, credentials or queue counts", async () => {
    vi.mocked(apiFetch).mockResolvedValue(result());
    await screenApplicationWithAi("QA", "Nurse", "ICU Nurse", "QA Hospital");
    expect(request().prompt).toContain("Match Score: Not provided");
    expect(request().prompt).toContain("RegNo: Not provided");
    await getDailyMorningBriefWithAi();
    expect(request().prompt).toContain("Pending Candidate KYC = Not provided");
    await getDailyMorningBriefWithAi({ pendingKyc: 0 });
    expect(request().prompt).toContain("Pending Candidate KYC = 0");
  });

  it("preserves zero capacity and reports missing capacity explicitly", async () => {
    vi.mocked(apiFetch).mockResolvedValue(result());
    await auditFacilityWithAi("QA", "", "", undefined, { beds: 0 });
    expect(request().prompt).toContain("Beds: 0");
    expect(request().prompt).toContain("ICU Beds: Not provided");
  });

  it("does not manufacture confidence and ignores old stored audits", () => {
    expect(formatConfidencePercent(undefined)).toBeNull();
    expect(formatConfidencePercent(Infinity)).toBeNull();
    expect(formatConfidencePercent(0)).toBe(0);
    sessionStorage.setItem("audit", JSON.stringify({ candidate: { status: "VERIFIED" } }));
    setAccessToken("account-a");
    expect(readSessionAuditCache("audit")).toEqual({});
    writeSessionAuditCache("audit", { candidate: { status: "REVIEW" } });
    expect(readSessionAuditCache("audit")).toHaveProperty("candidate");
    setAccessToken("account-b");
    expect(readSessionAuditCache("audit")).toEqual({});
    sessionStorage.removeItem("audit");
  });

  it("grounds pay suggestions in comparable published shifts", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce([
      { title: "ICU Nurse", city: "Pune", ratePerHourPaise: 10000 },
      { title: "ICU Nurse", city: "Pune", ratePerHourPaise: 20000 },
      { title: "Doctor", city: "Pune", ratePerHourPaise: 90000 },
    ]).mockResolvedValueOnce(result({ structuredData: { recommendedHourlyRate: 150, minHourlyRate: 100, maxHourlyRate: 200 } }));
    const response = await suggestShiftPayWithAi("Nurse", "Pune", { roleTitle: "Nurse" });
    expect(request().metadata.observedRates).toEqual([100, 200]);
    expect(response.benchmark.recommendedHourlyRate).toBe(150);
    expect(response.benchmark.fillTimeEstimateMinutes).toBeUndefined();
  });

  it("does not call a paid AI task when no comparable rates exist", async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce([]);
    await expect(suggestShiftPayWithAi("Nurse", "Pune")).rejects.toThrow("No comparable published shift rates");
    expect(apiFetch).toHaveBeenCalledOnce();
  });
});

describe("Ally streaming confirmation", () => {
  const chat = (onChunk = vi.fn()) => streamChatWithAlly("Help", "clinician", "en", undefined, undefined, onChunk);
  it("preserves the actual provider and waits for a valid completion event", async () => {
    vi.mocked(fetch).mockResolvedValue(stream('event: chunk\ndata: {"text":"Hello"}\n\nevent: done\ndata: ' + JSON.stringify(result({ response: "Hello" })) + '\n\n'));
    const onChunk = vi.fn();
    expect((await chat(onChunk)).provider).toBe("claude");
    expect(onChunk).toHaveBeenCalledWith("Hello");
  });

  it("rejects a partial stream instead of inventing a successful answer", async () => {
    vi.mocked(fetch).mockResolvedValue(stream('event: chunk\ndata: {"text":"Partial"}\n\n'));
    await expect(chat()).rejects.toThrow("interrupted");
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("does not replay provider failures or rate limits", async () => {
    for (const status of [429, 503]) {
      vi.mocked(fetch).mockResolvedValue(new Response("Unavailable", { status }));
      await expect(chat()).rejects.toMatchObject({ status });
    }
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it("rejects malformed completion data", async () => {
    vi.mocked(fetch).mockResolvedValue(stream('event: done\ndata: {"success":false}\n\n'));
    await expect(chat()).rejects.toThrow("incomplete");
  });

  it("uses the standard endpoint once when streaming is unsupported", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response("Not found", { status: 404 }));
    vi.mocked(apiFetch).mockResolvedValue(result());
    expect((await chat()).response).toBe("Review the supplied details.");
    expect(fetch).toHaveBeenCalledOnce();
    expect(apiFetch).toHaveBeenCalledOnce();
  });
});
