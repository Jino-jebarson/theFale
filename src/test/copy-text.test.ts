import { afterEach, describe, expect, it, vi } from "vitest";
import { copyText } from "@/lib/copyText";

const mocks = vi.hoisted(() => ({ error: vi.fn() }));
vi.mock("sonner", () => ({ toast: { error: mocks.error } }));
afterEach(() => { vi.unstubAllGlobals(); vi.clearAllMocks(); });

describe("clipboard confirmation", () => {
  it("returns success only after the browser confirms the copy", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    expect(await copyText("QA text")).toBe(true);
    expect(writeText).toHaveBeenCalledWith("QA text");
    expect(mocks.error).not.toHaveBeenCalled();
  });

  it("reports rejected clipboard access without a false success", async () => {
    vi.stubGlobal("navigator", { clipboard: { writeText: vi.fn().mockRejectedValue(new Error("Denied")) } });
    expect(await copyText("QA text")).toBe(false);
    expect(mocks.error).toHaveBeenCalledOnce();
  });
});
