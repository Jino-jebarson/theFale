import type { ComponentType, ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const qa = vi.hoisted(() => ({ onboard: vi.fn(), navigate: vi.fn(), setState: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: qa.success, error: qa.error, info: vi.fn() } }));
vi.mock("@/lib/store", () => ({ useApp: () => ({ signedIn: true, onboarded: false, portal: "candidate", contact: "+910000000001", profile: {}, docs: {} }), setState: qa.setState }));
vi.mock("@/lib/adapters/candidateAdapter", () => ({ onboardCandidate: qa.onboard }));
vi.mock("@/components/fale/AppShell", () => ({ initials: () => "QA" }));
vi.mock("@/components/fale/Logo", () => ({ Logo: () => null }));
vi.mock("@/components/fale/ResumeParserModal", () => ({ ResumeParserModal: () => null }));
vi.mock("@/lib/theme", () => ({ applyTheme: vi.fn(), getEffectiveTheme: () => "light" }));
vi.mock("@tanstack/react-router", async (original) => ({
  ...await original<typeof import("@tanstack/react-router")>(), useNavigate: () => qa.navigate,
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
  createFileRoute: () => (options: unknown) => ({ options, useSearch: () => ({ role: "candidate" }) }),
}));
vi.mock("@/components/fale/fields", () => {
  const Field = ({ label, value, onChange, type = "text", placeholder }: any) => <label>{label}<input type={type} value={value || ""} onChange={onChange} placeholder={placeholder} /></label>;
  return {
    Field, PhoneField: Field,
    SelectField: ({ label, value, onChange, options }: any) => <label>{label}<select value={value || ""} onChange={(event) => onChange(event.target.value)}><option value="">Choose</option>{options.map((option: string) => <option key={option}>{option}</option>)}</select></label>,
    DateField: ({ label, value, onChange }: any) => <label>{label}<input type="date" value={value || ""} onChange={(event) => onChange(event.target.value)} /></label>,
    AddressField: () => null, ChipGroup: () => null, MultiSelectField: () => null, SegmentedControl: () => null, Toggle: () => null,
    UploadBox: ({ label }: any) => <label>{label}<input type="file" /></label>,
  };
});

import { Route } from "@/routes/onboarding";
const Onboarding = Route.options.component as ComponentType;
afterEach(cleanup);
beforeEach(() => { vi.clearAllMocks(); });

function next() { fireEvent.submit(document.querySelector("form")!); }
function fill(label: RegExp, value: string) { fireEvent.change(screen.getByLabelText(label), { target: { value } }); }
function reachStudentReview() {
  render(<Onboarding />);
  fireEvent.click(screen.getByRole("button", { name: /Yes.*student/i }));
  fill(/^Full name/i, "QA Student"); fill(/^City$/i, "Pune"); fill(/^Email address/i, "qa@example.invalid");
  next();
  fill(/^Course$/i, "B.Sc Nursing"); fill(/^College$/i, "QA College"); fill(/^Year of study/i, "3rd year"); fill(/^Expected to graduate/i, "2027-06-01");
  next();
  expect(screen.getByLabelText("Upload a photo or PDF")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: /University registration number/i }));
  fill(/^Registration number$/i, "QA-2027-1234");
  next();
  const consent = screen.getByRole("checkbox");
  expect(consent).not.toBeChecked();
  fireEvent.click(consent);
}

describe("student onboarding saves", () => {
  it("keeps the review form and does not mark the account onboarded after a failed save", async () => {
    qa.onboard.mockRejectedValue(new Error("Save failed"));
    reachStudentReview(); next();
    await waitFor(() => expect(qa.error).toHaveBeenCalled());
    expect(qa.onboard).toHaveBeenCalledOnce();
    expect(qa.success).not.toHaveBeenCalled();
    expect(qa.navigate).not.toHaveBeenCalled();
    expect(qa.setState.mock.calls.some(([patch]) => patch?.onboarded === true)).toBe(false);
    expect(screen.getByRole("button", { name: "Create my account" })).toBeInTheDocument();
  });

  it("waits for confirmation and prevents duplicate account submissions", async () => {
    let complete!: (value: unknown) => void;
    qa.onboard.mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
    reachStudentReview(); next(); next();
    expect(qa.onboard).toHaveBeenCalledOnce();
    expect(qa.navigate).not.toHaveBeenCalled();
    await act(async () => { complete({ id: "candidate-id" }); });
    expect(qa.success).toHaveBeenCalledOnce();
    expect(qa.navigate).toHaveBeenCalledWith({ to: "/huddle" });
  });
});

