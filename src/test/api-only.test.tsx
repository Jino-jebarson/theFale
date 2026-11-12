import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { DigiLockerModal } from "@/components/fale/DigiLockerModal";

describe("API-only data and authentication", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VITE_USE_API", "false");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
    localStorage.clear();
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("keeps API mode enabled even with the retired switch set to false", async () => {
    const { isApiEnabled } = await import("@/lib/api");
    expect(isApiEnabled).toBe(true);
  });

  it.each(["login", "signup", "reset"])("does not fabricate admin %s success during an outage", async (operation) => {
    const auth = await import("@/lib/adapters/authAdapter");
    const request = operation === "login"
      ? auth.adminLogin("admin@example.com", "incorrect-password")
      : operation === "signup"
        ? auth.adminSignup({ username: "Admin", workingmailid: "admin@example.com", password: "password", passcode: "passcode" })
        : auth.adminForgotPassword({ workingmailid: "admin@example.com", newPassword: "password", passcode: "passcode" });
    await expect(request).rejects.toMatchObject({ status: 0 });
    const { getAccessToken } = await import("@/lib/api");
    expect(getAccessToken()).toBeNull();
  });

  it("does not supply local AI results when the backend is unavailable", async () => {
    const { executeAiTask } = await import("@/lib/adapters/aiAdapter");
    await expect(executeAiTask({ task: "doc_verify", prompt: "Verify credentials" })).rejects.toMatchObject({ status: 0 });
  });

  it.each(["parser", "summary", "pay"])("does not fabricate a %s response during an AI outage", async (task) => {
    const ai = await import("@/lib/adapters/aiAdapter");
    const response = task === "parser" ? ai.parseWhatsAppJobMessage("Need a nurse tomorrow")
      : task === "summary" ? ai.summarizeCandidateWithAi("Candidate", "Nurse", 2)
        : ai.suggestShiftPayWithAi("Nurse", "Pune");
    await expect(response).rejects.toMatchObject({ status: 0 });
  });

  it("does not invent course credentials or an instructor when metadata is absent", async () => {
    const { mapCourseDtoToCourse } = await import("@/lib/adapters/learningAdapter");
    const course = mapCourseDtoToCourse({ id: "unknown-course", title: "Course", category: "Learning", duration: "", cmePoints: 0, summary: "", progressPercent: 0 });
    expect(course.instructor.name).toBe("Not provided");
    expect(course.cmeCredits).toBe(0);
    expect(course.accreditedBy).toBe("");
    expect(course.certificateDetails.credentialCode).toBe("");
    expect(course.modules).toEqual([]);
  });

  it("does not turn bundled curriculum into a catalog during an outage", async () => {
    const { getCourseById } = await import("@/lib/adapters/learningAdapter");
    await expect(getCourseById("cme-ecg-101")).rejects.toMatchObject({ status: 0 });
  });

  it("returns no course for an empty backend catalog", async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ success: true, data: [] }), { status: 200 }));
    const { getCourseById } = await import("@/lib/adapters/learningAdapter");
    await expect(getCourseById("cme-ecg-101")).resolves.toBeNull();
  });

  it("contains no sample business records while preserving reference lists", async () => {
    const data = await import("@/lib/data");
    for (const records of [data.jobs, data.shifts, data.applicants, data.courses, data.initialHuddlePosts, data.initialHuddleQuestions, data.initialHuddleSessions, data.clinicalMentors]) {
      expect(records).toEqual([]);
    }
    expect(data.professions.length).toBeGreaterThan(0);
    expect(data.indianStates.length).toBeGreaterThan(0);
  });

  it("discards the retired demo store without deleting preferences", async () => {
    localStorage.setItem("fale-pro-v2", JSON.stringify({ signedIn: true, candidateCredits: 1000 }));
    localStorage.setItem("fale-theme", "dark");
    await import("@/lib/store");
    expect(localStorage.getItem("fale-pro-v2")).toBeNull();
    expect(localStorage.getItem("fale-theme")).toBe("dark");
  });

  it("shows DigiLocker as unavailable without accepting identity data or reporting success", () => {
    const onSuccess = vi.fn();
    const onClose = vi.fn();
    render(<DigiLockerModal open onSuccess={onSuccess} onClose={onClose} />);
    expect(screen.getByRole("dialog")).toHaveTextContent("DigiLocker verification unavailable");
    expect(screen.queryByRole("textbox")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Back to document upload" }));
    expect(onClose).toHaveBeenCalledOnce();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
