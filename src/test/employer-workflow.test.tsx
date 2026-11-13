import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { parseApplicationScope, matchesApplicationStage, formatDutySchedule, shiftInHistory } from "@/lib/employerWorkflow";
const qa = vi.hoisted(() => ({ scope: {} as Record<string, string>, applicants: [] as any[], jobs: [] as any[], shifts: [] as any[], navigate: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: any) => ({ options, useSearch: () => qa.scope }),
  useNavigate: () => qa.navigate,
  Link: ({ to, search, children, ...props }: any) => <a {...props} href={to + (search && Object.keys(search).length ? "?" + new URLSearchParams(search).toString() : "")}>{children}</a>,
}));
vi.mock("@/lib/store", () => ({ useApp: () => ({ adminApplications: [], postedJobs: [] }) }));
vi.mock("@/components/fale/AppShell", () => ({ AppShell: ({ children }: { children: ReactNode }) => <main>{children}</main>, StatusBadge: ({ status }: any) => <span>{status}</span>, initials: () => "QA" }));
vi.mock("@/components/fale/LottieAnimation", () => ({ LottieAnimation: () => null }));
vi.mock("@/components/fale/EmptyEarningsGraphic", () => ({ EmptyEarningsGraphic: () => null }));
vi.mock("@/lib/adapters/facilityAdapter", async original => ({
  ...await original<typeof import("@/lib/adapters/facilityAdapter")>(),
  getFacilityApplicants: async () => qa.applicants, getFacilityJobs: async () => qa.jobs,
  attachFocusAndPollRefresh: () => () => {}, updateApplicantStatus: vi.fn(),
}));
vi.mock("@/lib/adapters/shiftAdapter", async original => ({ ...await original<typeof import("@/lib/adapters/shiftAdapter")>(), getFacilityShifts: async () => qa.shifts }));
import { Route as ApplicationsRoute } from "@/routes/employer.applicants";
import { Route as PostingsRoute } from "@/routes/employer.postings";
const Applications = ApplicationsRoute.options.component as any;
const Postings = PostingsRoute.options.component as any;
beforeEach(() => {
  vi.clearAllMocks(); qa.scope = {}; localStorage.clear();
  qa.applicants = [
    { id: "new-a", jobId: "shift-a", shiftId: "shift-a", jobTitle: "ICU Night", candidateName: "New Nurse", candidateRole: "Nurse", candidateExperience: "3 years", status: "CLAIMED", councilVerified: true, matchScore: 80, shiftStartAt: "2026-12-01T14:00:00Z", shiftEndAt: "2026-12-02T02:00:00Z" },
    { id: "confirmed-a", jobId: "shift-a", shiftId: "shift-a", jobTitle: "ICU Night", candidateName: "Upcoming Nurse", candidateRole: "Nurse", status: "CONFIRMED", checkInPin: "123456", councilVerified: true, matchScore: 80 },
    { id: "done-b", jobId: "shift-b", shiftId: "shift-b", jobTitle: "Completed Ward Duty", candidateName: "Done Nurse", candidateRole: "Nurse", status: "COMPLETED", councilVerified: true, matchScore: 80 },
    { id: "job-app", jobId: "job-a", jobTitle: "Night Shift Permanent Nurse", candidateName: "Job Nurse", candidateRole: "Nurse", status: "SHORTLISTED", matchScore: 80 },
  ];
  qa.jobs = [{ id: "job-a", title: "Permanent Nurse", department: "ICU", status: "OPEN", openings: 1 }];
  qa.shifts = [
    { id: "shift-a", title: "ICU Night", status: "OPEN", slots: 2, slotsClaimed: 1, date: "1 Dec 2026", time: "19:30 - 07:30", rate: 500, hours: 12, city: "Bengaluru" },
    { id: "shift-c", title: "Old Cancelled Shift", status: "CANCELLED", slots: 1, slotsClaimed: 0 },
  ];
});
afterEach(cleanup);

describe("employer workflow", () => {
  it("defaults to actionable applications, groups by opening and collapses candidate insights", async () => {
    render(<Applications />);
    await screen.findByText("New Nurse");
    expect(screen.getByRole("button", { name: /Permanent Jobs/ })).toHaveTextContent("1");
    expect(screen.queryByText("Done Nurse")).not.toBeInTheDocument();
    expect(screen.queryByText("Upcoming Nurse")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ICU Night" })).toBeInTheDocument();
    expect(screen.getAllByText(/Candidate Insights/)[0]?.closest("details")).not.toHaveAttribute("open");
    expect(screen.getAllByText(/1 Dec 2026/).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /Locum Shifts/ }));
    fireEvent.click(screen.getByRole("button", { name: /^Confirmed/ }));
    expect(await screen.findByText("Upcoming Nurse")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Show Check-in PIN / QR" })).toBeInTheDocument();
    expect(screen.queryByText(/PIN 123456/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^History/ }));
    expect(await screen.findByText("Done Nurse")).toBeInTheDocument();
    expect(screen.queryByText("Upcoming Nurse")).not.toBeInTheDocument();
  });
  it("opens a linked shift's applications without mixing in other openings", async () => {
    qa.scope = { openingId: "shift-b", type: "shifts" };
    render(<Applications />);
    await screen.findByText("Done Nurse");
    expect(screen.queryByText("New Nurse")).not.toBeInTheDocument();
    expect(screen.queryByText("Job Nurse")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Clear opening filter" })).toHaveAttribute("href", "/employer/applicants");
    expect(screen.getByRole("button", { name: "View Summary" })).toBeInTheDocument();
  });
  it("shows a contextual post action, links each opening precisely and keeps closed shifts in History", async () => {
    render(<Postings />);
    await screen.findByText("Permanent Nurse");
    expect(screen.getByRole("link", { name: "Post Job" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Post Shift" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Applications/ })).toHaveAttribute("href", "/employer/applicants?openingId=job-a&type=jobs");
    fireEvent.click(screen.getByRole("button", { name: /Locum Shifts/ }));
    expect(await screen.findByText("ICU Night")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Post Shift" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View Applications/ })).toHaveAttribute("href", "/employer/applicants?openingId=shift-a&type=shifts");
    expect(screen.getByText(/1 of 2 clinicians confirmed - 2 applications/)).toBeInTheDocument();
    expect(screen.queryByText("Old Cancelled Shift")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^History/ }));
    await waitFor(() => expect(screen.getByText("Old Cancelled Shift")).toBeInTheDocument());
    expect(screen.queryByText("ICU Night")).not.toBeInTheDocument();
  });
  it("keeps stage membership and search scopes explicit", () => {
    expect(matchesApplicationStage("Completed", "Needs Action")).toBe(false);
    expect(matchesApplicationStage("Timesheet Submitted", "Timesheet Review")).toBe(true);
    expect(matchesApplicationStage("Checked In", "On Duty")).toBe(true);
    expect(matchesApplicationStage("Withdrawn", "History")).toBe(true);
    expect(matchesApplicationStage("Claimed", "New Applications")).toBe(true);
    expect(parseApplicationScope({ openingId: ["wrong"], type: "unknown" })).toEqual({});
    expect(parseApplicationScope({ openingId: "shift-a", type: "shifts" })).toEqual({ openingId: "shift-a", type: "shifts" });
    expect(shiftInHistory("CANCELLED")).toBe(true); expect(shiftInHistory("FILLED")).toBe(false);
    expect(formatDutySchedule("2026-12-01T14:00:00Z", "2026-12-02T02:00:00Z")).toContain("2 Dec 2026");
    expect(formatDutySchedule()).toBe("Schedule not available");
  });
});
