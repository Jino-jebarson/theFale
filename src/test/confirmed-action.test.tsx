import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useConfirmedAction } from "@/hooks/use-confirmed-action";

vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
afterEach(cleanup);

describe("confirmed actions", () => {
  it("blocks duplicate submissions until the first finishes", async () => {
    let finish!: () => void;
    const save = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const { result } = renderHook(useConfirmedAction);
    let first!: Promise<boolean>;
    act(() => { first = result.current.run(save); });
    await act(async () => { await expect(result.current.run(save)).resolves.toBe(false); });
    expect(save).toHaveBeenCalledOnce();
    expect(result.current.isPending).toBe(true);
    await act(async () => { finish(); await first; });
    expect(result.current.isPending).toBe(false);
  });

  it("retains an error and allows a failed action to be retried", async () => {
    const { result } = renderHook(useConfirmedAction);
    await act(async () => { await expect(result.current.run(async () => { throw new Error("Failure"); })).resolves.toBe(false); });
    expect(result.current.error).toBeTruthy();
    expect(result.current.isPending).toBe(false);
    await act(async () => { await expect(result.current.run(async () => {})).resolves.toBe(true); });
    expect(result.current.error).toBeNull();
  });
});
