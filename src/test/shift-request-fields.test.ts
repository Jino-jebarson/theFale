import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setAccessToken } from "@/lib/api";
import { postShift, checkInShift } from "@/lib/adapters/shiftAdapter";
beforeEach(() => { setAccessToken(null); vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true, data: { id: "shift-1" } })))); });
afterEach(() => vi.unstubAllGlobals());
describe("shift request contracts", () => {
  it("sends the structured requirements and arrival instructions to the server", async () => {
    const details = { profession: "Nurse", city: "Pune", blsRequired: true, minimumExperienceYears: 2, reportTo: "ICU supervisor", reportLocation: "Block B", dressRequirement: "Own scrubs", itemsToBring: "Council ID card", reportingNotes: "Staff entrance" };
    await postShift({ title: "ICU Nurse", department: "Critical Care", startAt: "2026-12-01T00:00:00Z", endAt: "2026-12-01T08:00:00Z", ratePerHourPaise: 50000, openings: 1, details });
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body)).details).toEqual(details);
  });
  it("sends QR evidence through the same authenticated check-in endpoint", async () => {
    const evidence = { method: "QR" as const, qrToken: "booking-token", latitude: 12.9, longitude: 77.6, accuracy: 12, locationCapturedAt: new Date().toISOString(), selfieDataUrl: "data:image/jpeg;base64,QA", selfieCapturedAt: new Date().toISOString() };
    await checkInShift("claim-1", evidence);
    expect(JSON.parse(String(vi.mocked(fetch).mock.calls[0]?.[1]?.body))).toEqual(evidence);
  });
});
