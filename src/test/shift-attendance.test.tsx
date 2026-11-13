import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShiftCheckIn } from "@/components/fale/ShiftCheckIn";
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
const stop = vi.fn();
beforeEach(() => {
  vi.clearAllMocks(); vi.useFakeTimers();
  Object.defineProperty(navigator, "geolocation", { configurable: true, value: {
    getCurrentPosition: vi.fn((success: PositionCallback) => success({ coords: { latitude: 12.9, longitude: 77.6, accuracy: 12 }, timestamp: Date.now() } as GeolocationPosition)),
  } });
  Object.defineProperty(navigator, "mediaDevices", { configurable: true, value: { getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [{ stop }] }) } });
  vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  Object.defineProperty(HTMLVideoElement.prototype, "videoWidth", { configurable: true, value: 640 });
  Object.defineProperty(HTMLVideoElement.prototype, "videoHeight", { configurable: true, value: 480 });
  Object.defineProperty(HTMLVideoElement.prototype, "readyState", { configurable: true, value: 2 });
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({ drawImage: vi.fn() } as any);
  vi.spyOn(HTMLCanvasElement.prototype, "toDataURL").mockReturnValue("data:image/jpeg;base64,QA_CAMERA_CAPTURE");
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
const enterPin = (value = "123456") => fireEvent.change(screen.getByLabelText("Six-digit hospital PIN"), { target: { value } });
const advance = async (ms = 3200) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };

describe("automatic shift check-in", () => {
  it("starts only after six digits, automatically captures fresh evidence and submits exactly once", async () => {
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<ShiftCheckIn claimId="claim-1" onSubmit={submit} onCancel={vi.fn()} />);
    enterPin("12345");
    expect(navigator.geolocation.getCurrentPosition).not.toHaveBeenCalled();
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled();
    enterPin(); await advance(100);
    expect(screen.getByRole("status")).toHaveTextContent("Taking your selfie in 3");
    expect(submit).not.toHaveBeenCalled();
    enterPin("654321"); // Even synthetic duplicate input cannot start a second flow.
    await advance();
    expect(submit).toHaveBeenCalledOnce();
    expect(submit.mock.calls[0]?.[0]).toMatchObject({ latitude: 12.9, longitude: 77.6, accuracy: 12, method: "PIN", pin: "123456", selfieDataUrl: "data:image/jpeg;base64,QA_CAMERA_CAPTURE" });
    expect(stop).toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: "Confirm check-in" })).not.toBeInTheDocument();
  });

  it("does not open the camera or submit when location permission is denied", async () => {
    navigator.geolocation.getCurrentPosition = (_success, failure) => failure?.({ code: 1 } as GeolocationPositionError);
    const submit = vi.fn();
    render(<ShiftCheckIn claimId="claim-1" onSubmit={submit} onCancel={vi.fn()} />);
    enterPin(); await advance();
    expect(screen.getByRole("alert")).toHaveTextContent("Location permission is required");
    expect(navigator.mediaDevices.getUserMedia).not.toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Retry check-in" })).toBeEnabled();
  });

  it("does not submit without camera permission", async () => {
    vi.mocked(navigator.mediaDevices.getUserMedia).mockRejectedValue(new Error("Denied"));
    const submit = vi.fn();
    render(<ShiftCheckIn claimId="claim-1" onSubmit={submit} onCancel={vi.fn()} />);
    enterPin(); await advance();
    expect(screen.getByRole("alert")).toHaveTextContent("Camera permission is required");
    expect(submit).not.toHaveBeenCalled();
  });

  it("recaptures both records on retry after a rejected server check-in", async () => {
    const submit = vi.fn().mockRejectedValueOnce(new Error("Rejected")).mockResolvedValue(undefined);
    render(<ShiftCheckIn claimId="claim-1" onSubmit={submit} onCancel={vi.fn()} />);
    enterPin(); await advance();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByAltText("Your attendance selfie preview")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Retry check-in" })); await advance();
    expect(submit).toHaveBeenCalledTimes(2);
    expect(navigator.geolocation.getCurrentPosition).toHaveBeenCalledTimes(2);
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenCalledTimes(2);
    expect(submit.mock.calls[0]?.[0].selfieCapturedAt).not.toEqual(submit.mock.calls[1]?.[0].selfieCapturedAt);
  });

  it("cancels during the countdown without submitting", async () => {
    const submit = vi.fn(); const cancel = vi.fn();
    render(<ShiftCheckIn claimId="claim-1" onSubmit={submit} onCancel={cancel} />);
    enterPin(); await advance(100);
    fireEvent.click(screen.getByRole("button", { name: "Cancel" })); await advance();
    expect(cancel).toHaveBeenCalledOnce(); expect(stop).toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled();
  });

  it("stops a camera granted after the dialog unmounts without submitting", async () => {
    let grant!: (stream: MediaStream) => void;
    vi.mocked(navigator.mediaDevices.getUserMedia).mockImplementation(() => new Promise(resolve => { grant = resolve; }));
    const submit = vi.fn();
    const view = render(<ShiftCheckIn claimId="claim-1" onSubmit={submit} onCancel={vi.fn()} />);
    enterPin(); await advance(100); view.unmount();
    await act(async () => { grant({ getTracks: () => [{ stop }] } as unknown as MediaStream); });
    await advance(); expect(stop).toHaveBeenCalled(); expect(submit).not.toHaveBeenCalled();
  });

  it("automatically captures attendance after scanning the matching booking QR", async () => {
    vi.stubGlobal("BarcodeDetector", class {
      async detect() { return [{ rawValue: JSON.stringify({ type: "FALE_SHIFT_CHECKIN", claimId: "claim-1", token: "booking-secret" }) }]; }
    });
    const submit = vi.fn().mockResolvedValue(undefined);
    render(<ShiftCheckIn claimId="claim-1" onSubmit={submit} onCancel={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Scan booking QR" })); await advance(100); await advance();
    expect(submit).toHaveBeenCalledOnce();
    expect(submit.mock.calls[0]?.[0]).toMatchObject({ method: "QR", qrToken: "booking-secret", latitude: 12.9, selfieDataUrl: "data:image/jpeg;base64,QA_CAMERA_CAPTURE" });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenNthCalledWith(1, { video: { facingMode: "environment" }, audio: false });
    expect(navigator.mediaDevices.getUserMedia).toHaveBeenNthCalledWith(2, { video: { facingMode: "user" }, audio: false });
  });
});
