import type { ComponentType, ReactNode } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ post: vi.fn(), navigate: vi.fn(), success: vi.fn(), error: vi.fn(), setState: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: state.success, error: state.error, info: vi.fn(), loading: vi.fn() } }));
vi.mock("@/components/fale/AppShell", () => ({ AppShell: ({ children }: { children: ReactNode }) => <>{children}</>, PageHead: () => null }));
vi.mock("@/components/fale/JobCard", () => ({ OrgMark: () => null }));
vi.mock("@/lib/store", () => ({ useApp: () => ({ contact: "+910000000001", profile: { hospitalName: "Test Facility", city: "Pune" } }), setState: state.setState }));
vi.mock("@/lib/adapters/facilityAdapter", () => ({ postFacilityJob: state.post }));
vi.mock("@tanstack/react-router", async (original) => ({
  ...await original<typeof import("@tanstack/react-router")>(),
  useNavigate: () => state.navigate,
  Link: ({ children }: { children: ReactNode }) => <span>{children}</span>,
}));

import { Route } from "@/routes/employer.post";
const Post = Route.options.component as ComponentType;

describe("job submission confirmation", () => {
  beforeEach(() => {
    vi.clearAllMocks(); sessionStorage.clear();
    vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
  });
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  function submit() {
    const title = screen.getByRole("textbox", { name: /Job title/i });
    fireEvent.change(title, { target: { value: "ICU Nurse" } });
    fireEvent.submit(title.closest("form")!);
    return title;
  }

  it("keeps entered values and stays on the form if the backend fails", async () => {
    state.post.mockRejectedValue(new Error("Server failed"));
    render(<Post />);
    const title = submit();
    await waitFor(() => expect(state.error).toHaveBeenCalled());
    expect(title).toHaveValue("ICU Nurse");
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(state.success).not.toHaveBeenCalled();
    expect(state.navigate).not.toHaveBeenCalled();
    expect(state.setState).not.toHaveBeenCalled();
  });

  it("blocks repeated submission and reports success only after confirmation", async () => {
    let resolve!: (value: unknown) => void;
    state.post.mockImplementation(() => new Promise((done) => { resolve = done; }));
    render(<Post />);
    const title = submit();
    fireEvent.submit(title.closest("form")!);
    expect(state.post).toHaveBeenCalledOnce();
    expect(state.success).not.toHaveBeenCalled();
    for (const button of screen.getAllByRole("button", { name: /Publish job/i })) expect(button).toBeDisabled();
    await act(async () => { resolve({ id: "server-job-id" }); });
    expect(state.success).toHaveBeenCalledOnce();
    expect(state.navigate).toHaveBeenCalledWith({ to: "/employer" });
  });

  it("labels and saves a local draft without publishing it", async () => {
    render(<Post />);
    fireEvent.change(screen.getByRole("textbox", { name: /Job title/i }), { target: { value: "Draft role" } });
    fireEvent.click(screen.getAllByRole("button", { name: /Save.*draft/i })[0]!);
    expect(state.post).not.toHaveBeenCalled();
    expect(state.navigate).not.toHaveBeenCalled();
    expect(state.success).toHaveBeenCalledWith("Local draft saved", expect.objectContaining({ description: expect.stringContaining("browser tab only") }));
    cleanup();
    render(<Post />);
    expect(screen.getByRole("textbox", { name: /Job title/i })).toHaveValue("Draft role");
  });
});
