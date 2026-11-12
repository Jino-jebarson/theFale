import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const qa = vi.hoisted(() => ({ stream: vi.fn(), update: vi.fn(), setState: vi.fn(), clear: vi.fn(), success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast: { success: qa.success, error: qa.error, info: vi.fn() } }));
vi.mock("@/lib/store", () => ({ useApp: () => ({ signedIn: true, portal: "candidate", contact: "qa", candidateLevel: "professional", profile: { name: "QA", openToWork: false } }), setState: qa.setState }));
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => vi.fn(), useRouterState: () => "/home" }));
vi.mock("@/lib/adapters/aiAdapter", () => ({ streamChatWithAlly: qa.stream, getAllyChatHistory: () => Promise.resolve([]), clearAllyChatHistory: qa.clear, attachTicketToAllyMessage: vi.fn() }));
vi.mock("@/lib/adapters/candidateAdapter", () => ({ updateOpenToWork: qa.update }));
vi.mock("@/lib/adapters/supportAdapter", () => ({ createSupportTicket: vi.fn() }));
import { FlowAIFloatingButton } from "@/components/fale/FlowAIFloatingButton";
beforeEach(() => {
  vi.clearAllMocks(); localStorage.clear();
  Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: vi.fn() });
});
afterEach(cleanup);
function openAndSend() {
  render(<FlowAIFloatingButton />);
  fireEvent.click(screen.getByRole("button", { name: "Toggle Ally AI" }));
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "I want to be open to work" } });
  fireEvent.click(screen.getByRole("button", { name: "Send" }));
}
const reply = { success: true, response: "Click to confirm your availability change.", provider: "qa", action: "open_to_work", actionData: { label: "Confirm availability" } };
describe("Ally user confirmation", () => {
  it("waits for the action button and server before changing availability", async () => {
    qa.stream.mockResolvedValue(reply);
    let complete!: () => void;
    qa.update.mockImplementation(() => new Promise<void>(resolve => { complete = resolve; }));
    openAndSend();
    const button = await screen.findByRole("button", { name: "Confirm availability" });
    expect(qa.update).not.toHaveBeenCalled();
    fireEvent.click(button); fireEvent.click(button);
    expect(qa.update).toHaveBeenCalledOnce();
    expect(qa.setState).not.toHaveBeenCalled();
    await act(async () => { complete(); });
    expect(qa.setState).toHaveBeenCalledOnce();
    expect(qa.success).toHaveBeenCalledWith("Open to Work updated");
  });

  it("keeps availability unchanged after a rejected save", async () => {
    qa.stream.mockResolvedValue(reply); qa.update.mockRejectedValue(new Error("Unavailable"));
    openAndSend();
    fireEvent.click(await screen.findByRole("button", { name: "Confirm availability" }));
    await waitFor(() => expect(qa.error).toHaveBeenCalled());
    expect(qa.setState).not.toHaveBeenCalled();
    expect(qa.success).not.toHaveBeenCalled();
  });

  it("uses the existing rotating-arrow spinner while waiting for Ally", async () => {
    let complete!: (value: unknown) => void;
    qa.stream.mockImplementation(() => new Promise(resolve => { complete = resolve; }));
    openAndSend();
    const pending = screen.getByText("Ally is thinking...").parentElement!;
    expect(pending.querySelector("svg.animate-spin")).toBeInTheDocument();
    expect(pending.querySelector(".animate-bounce")).toBeNull();
    await act(async () => { complete(reply); });
  });
});
