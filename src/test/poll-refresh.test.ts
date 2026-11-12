import { afterEach, describe, expect, it, vi } from "vitest";
import { attachFocusAndPollRefresh } from "@/lib/adapters/facilityAdapter";

afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
describe("focus and poll refresh", () => {
  it("coalesces focus and visibility events and cleans up on unmount", () => {
    vi.useFakeTimers();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    const refresh = vi.fn(); const detach = attachFocusAndPollRefresh(refresh, 15000);
    vi.advanceTimersByTime(6000);
    window.dispatchEvent(new Event("focus"));
    document.dispatchEvent(new Event("visibilitychange"));
    expect(refresh).toHaveBeenCalledOnce();
    vi.advanceTimersByTime(9000);
    expect(refresh).toHaveBeenCalledTimes(2);
    detach();
    vi.advanceTimersByTime(30000); window.dispatchEvent(new Event("focus"));
    expect(refresh).toHaveBeenCalledTimes(2);
  });

  it("does not poll while the tab is hidden", () => {
    vi.useFakeTimers();
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("hidden");
    const refresh = vi.fn(); const detach = attachFocusAndPollRefresh(refresh, 15000);
    vi.advanceTimersByTime(60000);
    window.dispatchEvent(new Event("focus"));
    expect(refresh).not.toHaveBeenCalled(); detach();
  });
});
