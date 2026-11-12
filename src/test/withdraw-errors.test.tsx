import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { WithdrawModal } from "@/components/fale/WithdrawModal";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
afterEach(cleanup);

describe("withdrawal confirmation", () => {
  it("keeps the dialog open when saving fails", async () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn().mockResolvedValue(false);
    render(<WithdrawModal isOpen onClose={onClose} onConfirm={onConfirm} jobTitle="Nurse" orgName="Facility" />);
    await act(async () => { fireEvent.click(screen.getByRole("button", { name: "Confirm withdrawal" })); });
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("waits for backend confirmation and blocks repeated clicks", async () => {
    const onClose = vi.fn();
    let complete!: (value: boolean) => void;
    const onConfirm = vi.fn(() => new Promise<boolean>((resolve) => { complete = resolve; }));
    render(<WithdrawModal isOpen onClose={onClose} onConfirm={onConfirm} jobTitle="Nurse" orgName="Facility" />);
    const button = screen.getByRole("button", { name: "Confirm withdrawal" });
    fireEvent.click(button); fireEvent.click(button);
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(onClose).not.toHaveBeenCalled();
    await act(async () => { complete(true); });
    expect(onClose).toHaveBeenCalledOnce();
  });
});
