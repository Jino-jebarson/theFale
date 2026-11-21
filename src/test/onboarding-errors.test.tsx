import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const qa = vi.hoisted(() => ({ onboard: vi.fn(), facility: vi.fn(), sendOtp: vi.fn(), navigate: vi.fn(), setState: vi.fn() }));
vi.mock("@/lib/store", () => ({ useApp: () => ({ signedIn: true, onboarded: false, portal: "candidate", contact: "+919876543210", profile: {}, docs: {} }), setState: qa.setState }));
vi.mock("@/lib/adapters/candidateAdapter", () => ({ onboardCandidate: qa.onboard }));
vi.mock("@/lib/adapters/facilityAdapter", () => ({ onboardFacility: qa.facility }));
vi.mock("@/lib/adapters/authAdapter", () => ({ sendOtp: qa.sendOtp }));
vi.mock("@/components/fale/Logo", () => ({ Logo: () => null }));
vi.mock("@/components/fale/ResumeParserModal", () => ({ ResumeParserModal: ({ open, onApplyData }: any) => open ? <button onClick={() => onApplyData({ role: "Nurse", exp: "3 Years", city: "Jayanagar", skills: ["ICU"] }, "cv.pdf", "data:application/pdf;base64,dGVzdA==")}>Use Ally result</button> : null }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => qa.navigate, Link: ({ children }: any) => <a>{children}</a>, createFileRoute: () => (options: any) => ({ ...options, useSearch: () => ({}) }) }));
vi.mock("@/components/fale/fields", () => ({
  Field: ({ label, value, onChange, type = "text" }: any) => <label>{label}<input type={type} value={value || ""} onChange={onChange} /></label>,
  SelectField: ({ label, value, onChange, options }: any) => <label>{label}<select value={value || ""} onChange={(e) => onChange(e.target.value)}><option value="">Choose</option>{options.map((o: string) => <option key={o}>{o}</option>)}</select></label>,
  DateField: ({ label, value, onChange }: any) => <label>{label}<input type="month" value={value || ""} onChange={(e) => onChange(e.target.value)} /></label>,
  SegmentedControl: ({ label, options, onChange }: any) => <div aria-label={label}>{options.map((o: string) => <button type="button" key={o} onClick={() => onChange(o)}>{o}</button>)}</div>,
  UploadBox: ({ label, onFile }: any) => <button type="button" onClick={() => onFile("proof.pdf", "data:application/pdf;base64,dGVzdA==")}>Upload {label}</button>,
}));
import { QuickCandidateOnboarding, QuickFacilityOnboarding } from "@/routes/onboarding";
afterEach(cleanup);
beforeEach(() => vi.clearAllMocks());
const fill = (label: RegExp, value: string) => fireEvent.change(screen.getByLabelText(label), { target: { value } });
function studentDetails() {
  render(<QuickCandidateOnboarding />);
  fireEvent.click(screen.getByRole("button", { name: /Yes, I.?m a student/i }));
  fill(/full name/i, "QA Student");
  fireEvent.click(screen.getByRole("button", { name: /Save & continue/i }));

  fill(/^Course$/i, "B.Sc Nursing");
  fill(/^Area$/i, "Jayanagar");
  fill(/^College$/i, "Sample Nursing College");
  fill(/year of study/i, "2nd year");
  fill(/expected graduation month/i, "2028-05");
  fireEvent.click(screen.getByRole("button", { name: /Save & continue/i }));
  fireEvent.click(screen.getByRole("button", { name: /Upload College ID card/i }));
  fireEvent.click(screen.getByRole("checkbox"));
}
describe("quick student onboarding", () => {
  it("keeps the form and never marks onboarding complete when the API fails", async () => {
    qa.onboard.mockRejectedValue(new Error("Save failed"));
    studentDetails(); fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Save failed");
    expect(qa.setState).not.toHaveBeenCalled();
    expect(qa.navigate).not.toHaveBeenCalled();
  });
  it("saves the student path and prevents duplicate submissions", async () => {
    let complete!: (value: unknown) => void;
    qa.onboard.mockImplementation(() => new Promise((resolve) => { complete = resolve; }));
    studentDetails(); fireEvent.click(screen.getByRole("button", { name: "Done" }));
    fireEvent.click(screen.getByRole("button", { name: /Please wait/ }));
    expect(qa.onboard).toHaveBeenCalledTimes(1);
    expect(qa.onboard).toHaveBeenCalledWith(expect.objectContaining({ candidateLevel: "STUDENT", course: "B.Sc Nursing", city: "Jayanagar", openToWork: false }));
    expect(qa.navigate).not.toHaveBeenCalled();
    await act(async () => { complete({ id: "candidate-id" }); });
    expect(qa.navigate).toHaveBeenCalledWith({ to: "/huddle" });
  });
  it("reviews and submits Ally's resume details with the uploaded file", async () => {
    qa.onboard.mockResolvedValue({ id: "candidate-id" });
    render(<QuickCandidateOnboarding />);
    fireEvent.click(screen.getByRole("button", { name: /No, I.?ve graduated/i }));
    fill(/full name/i, "QA Nurse");
    fireEvent.click(screen.getByRole("button", { name: /Save & continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /Upload your resume/i }));
    fireEvent.click(screen.getByRole("button", { name: /Use Ally result/i }));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(qa.onboard).toHaveBeenCalledWith(expect.objectContaining({ candidateLevel: "PROFESSIONAL", profession: "Nurse", experienceYears: "3", skills: ["ICU"], resumeFileName: "cv.pdf", resumeUrl: "data:application/pdf;base64,dGVzdA==" })));
  });
  it("lets a fresher complete the manual flow without an uploaded document", async () => {
    qa.onboard.mockResolvedValue({ id: "candidate-id" });
    render(<QuickCandidateOnboarding />);
    fireEvent.click(screen.getByRole("button", { name: /No, I.?ve graduated/i }));
    fill(/full name/i, "QA Fresher");
    fireEvent.click(screen.getByRole("button", { name: /Save & continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /Fill in myself/i }));
    fireEvent.click(screen.getByRole("button", { name: "Fresher" }));
    fill(/^Profession/i, "Nurse"); fill(/^Area/i, "Jayanagar");
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(qa.onboard).toHaveBeenCalledWith(expect.objectContaining({ candidateLevel: "FRESHER", profession: "Nurse", openToWork: true })));
  });
});
describe("quick facility agreement", () => {
  it("requires a successfully sent code and does not submit when delivery fails", async () => {
    qa.sendOtp.mockRejectedValue(new Error("SMS delivery is not configured"));
    render(<QuickFacilityOnboarding />);
    fill(/^Facility name/i, "Test Hospital"); fill(/^Type$/i, "Clinic"); fill(/^Area$/i, "Jayanagar");
    fireEvent.click(screen.getByRole("button", { name: /Save & continue/i }));
    fill(/^Your name/i, "Test Recruiter"); fill(/^Work email/i, "hr@example.com");
    fireEvent.click(screen.getByRole("button", { name: /Save & continue/i }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Send signing code/i }));
    await waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent("SMS delivery is not configured"));
    expect(qa.facility).not.toHaveBeenCalled();
  });
  it("submits the entered recruiter and signing code after delivery", async () => {
    qa.sendOtp.mockResolvedValue({}); qa.facility.mockResolvedValue({ id: "facility-id" });
    render(<QuickFacilityOnboarding />);
    fill(/^Facility name/i, "Test Hospital"); fill(/^Type$/i, "Clinic"); fill(/^Area$/i, "Jayanagar");
    fireEvent.click(screen.getByRole("button", { name: /Save & continue/i }));
    fill(/^Your name/i, "Test Recruiter"); fill(/^Work email/i, "hr@example.com");
    fireEvent.click(screen.getByRole("button", { name: /Save & continue/i }));
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: /Send signing code/i }));
    await screen.findByLabelText(/6-digit signing code/i);
    fill(/6-digit signing code/i, "123456");
    fireEvent.click(screen.getByRole("button", { name: /Open my dashboard/i }));
    await waitFor(() => expect(qa.facility).toHaveBeenCalledWith(expect.objectContaining({ contactPerson: "Test Recruiter", agreementAccepted: true, agreementOtp: "123456", beds: 0 })));
    expect(qa.navigate).toHaveBeenCalledWith({ to: "/employer" });
  });
});
