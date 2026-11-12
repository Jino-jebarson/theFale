import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { usePageLoad } from "@/hooks/use-page-load";
import { ApiError } from "@/lib/api";

afterEach(cleanup);
describe("page load failures", () => {
  it("keeps failure distinct from successful empty data and retries explicitly", () => {
    const { result } = renderHook(usePageLoad);
    expect(result.current.error).toBeNull();
    act(() => result.current.fail(new ApiError("Unavailable", 503)));
    expect(result.current.error).toContain("unavailable");
    expect(result.current.retryKey).toBe(0);
    act(() => result.current.retry());
    expect(result.current.error).toBeNull();
    expect(result.current.retryKey).toBe(1);
  });
});
