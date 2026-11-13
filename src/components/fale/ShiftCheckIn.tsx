import { useEffect, useRef, useState } from "react";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { RequestError } from "@/components/fale/RequestError";
import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import type { ShiftCheckInPayload } from "@/lib/adapters/shiftAdapter";

export function ShiftCheckIn({ claimId, onSubmit, onCancel }: {
  claimId: string; onSubmit: (payload: ShiftCheckInPayload) => Promise<void>; onCancel: () => void;
}) {
  const action = useConfirmedAction();
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number; longitude: number; accuracy: number; locationCapturedAt: string } | null>(null);
  const [locating, setLocating] = useState(false);
  const [photo, setPhoto] = useState<{ selfieDataUrl: string; selfieCapturedAt: string } | null>(null);
  const [camera, setCamera] = useState(false);
  const [method, setMethod] = useState<"PIN" | "QR">("PIN");
  const [pin, setPin] = useState("");
  const [qrToken, setQrToken] = useState("");
  const [stage, setStage] = useState("");
  const video = useRef<HTMLVideoElement>(null);
  const media = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const alive = useRef(true);
  const cameraGeneration = useRef(0);
  const flowGeneration = useRef(0);
  const completed = useRef(false);
  const stop = () => {
    cameraGeneration.current++;
    media.current?.getTracks().forEach(track => track.stop()); media.current = null;
    if (timer.current) clearTimeout(timer.current);
    setCamera(false);
  };
  useEffect(() => { alive.current = true; return () => {
    alive.current = false; flowGeneration.current++; cameraGeneration.current++; media.current?.getTracks().forEach(track => track.stop());
    if (timer.current) clearTimeout(timer.current);
  }; }, []);

  const captureLocation = () => new Promise<NonNullable<typeof location>>((resolve, reject) => {
    setError(null);
    if (!navigator.geolocation) { setError("Location capture is unavailable in this browser."); reject(new Error("Location unavailable")); return; }
    setLocating(true); setLocation(null);
    navigator.geolocation.getCurrentPosition(position => {
      const value = { latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy,
        locationCapturedAt: new Date(position.timestamp).toISOString() };
      if (alive.current) { setLocation(value); setLocating(false); }
      resolve(value);
    }, failure => { if (alive.current) { setLocating(false); setError(failure.code === 1 ? "Location permission is required. Allow location access and retry check-in." : "Could not capture location. Check location services and retry check-in."); } reject(new Error("Location capture failed")); },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
  });
  const startCamera = async (scan: boolean) => {
    stop(); setError(null);
    const generation = cameraGeneration.current;
    if (!scan) setPhoto(null);
    if (!navigator.mediaDevices?.getUserMedia) { setError("Camera access requires HTTPS or localhost and a supported browser."); return; }
    const Detector = (window as any).BarcodeDetector;
    if (scan && !Detector) { setError("QR scanning is unavailable in this browser. Use the six-digit PIN instead."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: scan ? "environment" : "user" }, audio: false });
      if (!alive.current || generation !== cameraGeneration.current) { stream.getTracks().forEach(track => track.stop()); return; }
      media.current = stream; setCamera(true);
      if (!video.current) { stop(); return; }
      video.current.srcObject = stream; await video.current.play();
      if (!alive.current || generation !== cameraGeneration.current) return;
      if (scan) {
        const detector = new Detector({ formats: ["qr_code"] });
        const poll = async () => {
          if (!alive.current || !media.current || !video.current) return;
          try {
            const codes = await detector.detect(video.current);
            if (!alive.current || generation !== cameraGeneration.current) return;
            for (const code of codes) {
              let value; try { value = JSON.parse(code.rawValue); } catch { continue; }
              if (value.type === "FALE_SHIFT_CHECKIN" && value.claimId === claimId && typeof value.token === "string") {
                setQrToken(value.token); stop(); return;
              }
              setError("That QR belongs to a different booking. Ask the hospital for your check-in QR.");
            }
          } catch { /* Frames may not be ready yet. */ }
          timer.current = setTimeout(poll, 250);
        };
        void poll();
      }
      return video.current;
    } catch { if (alive.current && generation === cameraGeneration.current) { stop(); setError("Camera permission is required. Allow camera access and try again."); } }
    return undefined;
  };
  const captureSelfie = () => {
    const source = video.current;
    if (!source?.videoWidth || !source.videoHeight) { setError("Wait for the camera preview, then take your selfie."); return; }
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 640 / Math.max(source.videoWidth, source.videoHeight));
    canvas.width = Math.round(source.videoWidth * scale); canvas.height = Math.round(source.videoHeight * scale);
    const context = canvas.getContext("2d"); if (!context) { setError("Could not capture your selfie. Please retry check-in."); return; }
    context.drawImage(source, 0, 0, canvas.width, canvas.height);
    const selfieDataUrl = canvas.toDataURL("image/jpeg", 0.7);
    if (!selfieDataUrl.startsWith("data:image/jpeg;base64,") || selfieDataUrl.length > 400000) { setError("Could not capture a suitable selfie. Please retry check-in."); return; }
    const value = { selfieDataUrl, selfieCapturedAt: new Date().toISOString() };
    setPhoto(value); stop(); return value;
  };
  const submit = (credential: { method: "PIN"; pin: string } | { method: "QR"; qrToken: string }) => action.run(async () => {
    if (completed.current) return;
    const generation = ++flowGeneration.current;
    const active = () => alive.current && generation === flowGeneration.current;
    setError(null); setPhoto(null); setStage("Capturing current location...");
    try {
      let current = await captureLocation();
      if (!active()) return;
      setStage("Opening selfie camera. Look at the camera...");
      const source = await startCamera(false);
      if (!source || !active()) return;
      const deadline = Date.now() + 10000;
      while (active() && (!source.videoWidth || !source.videoHeight || source.readyState < 2)) {
        if (Date.now() > deadline) { setError("The camera did not become ready. Please retry check-in."); return; }
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      for (let count = 3; count > 0; count--) {
        if (!active()) return;
        setStage(`Look at the camera. Taking your selfie in ${count}...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (!active()) return;
      // Refresh GPS if a long camera permission prompt made it stale.
      if (Date.now() - Date.parse(current.locationCapturedAt) > 90000) {
        setStage("Refreshing current location..."); current = await captureLocation();
      }
      if (!active()) return;
      const selfie = captureSelfie();
      if (!selfie) return;
      setStage("Submitting check-in...");
      await onSubmit({ ...current, ...selfie, ...credential });
      completed.current = true;
    } catch (cause) {
      if (active()) throw cause;
    } finally {
      stop();
      if (active()) { setStage(""); setLocating(false); }
    }
  });
  useEffect(() => {
    if (qrToken) void submit({ method: "QR", qrToken });
  }, [qrToken]);
  return <div className="space-y-4 text-sm">
    <p className="text-xs text-muted-foreground">Enter the supervisor's six-digit PIN or scan your booking QR. We will automatically capture your location, open the selfie camera, take a photo after a three-second countdown and submit check-in. Allow camera and location access when prompted. These attendance records are shared with the hospital.</p>
    <RequestError message={error || action.error} />
    <fieldset disabled={action.isPending || completed.current} className="space-y-4">
      <div className="flex gap-2">
        <Button type="button" variant={method === "PIN" ? "default" : "outline"} onClick={() => { stop(); setMethod("PIN"); }}>Enter PIN</Button>
        <Button type="button" variant={method === "QR" ? "default" : "outline"} onClick={() => { setMethod("QR"); setQrToken(""); void startCamera(true); }}>Scan booking QR</Button>
      </div>
      {method === "PIN" ? <label className="block">Six-digit hospital PIN
        <input aria-label="Six-digit hospital PIN" inputMode="numeric" autoComplete="off" maxLength={6} value={pin} disabled={action.isPending || completed.current}
          onChange={event => { const value = event.target.value.replace(/\D/g, "").slice(0, 6); setPin(value); if (value.length === 6) void submit({ method: "PIN", pin: value }); }} className="mt-1 w-full rounded-xl border bg-background p-3 font-mono tracking-widest" />
      </label> : <p>{qrToken ? "Booking QR captured." : "Scan the QR shown by the hospital supervisor."}</p>}
    </fieldset>
    {(action.isPending || locating) && <p role="status" className="flex items-center gap-2"><ButtonSpinner />{stage}</p>}
    <video ref={video} autoPlay playsInline muted className={camera ? "w-full max-h-56 rounded-xl bg-black" : "hidden"} />
    {location && <p className="text-xs">Location captured (accuracy approximately {Math.round(location.accuracy)} m).</p>}
    {photo && <img src={photo.selfieDataUrl} alt="Your attendance selfie preview" className="h-32 w-32 rounded-xl object-cover" />}
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={stage === "Submitting check-in..."} onClick={() => { flowGeneration.current++; stop(); onCancel(); }}>Cancel</Button>
      {(error || action.error) && !action.isPending && method === "PIN" && pin.length === 6 && <Button type="button" onClick={() => void submit({ method: "PIN", pin })}>Retry check-in</Button>}
    </div>
  </div>;
}
