import { HiOutlineKey, HiOutlineQrCode, HiOutlineShieldCheck } from "react-icons/hi2";
import { useEffect, useState } from "react";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { RequestError } from "@/components/fale/RequestError";
import { apiFetch } from "@/lib/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function ShiftAttendancePanel({
  claimId,
  pin,
  qrToken,
  recorded,
  primary = false,
}: {
  claimId: string;
  pin?: string | undefined;
  qrToken?: string | undefined;
  recorded?: boolean | undefined;
  primary?: boolean;
}) {
  const action = useConfirmedAction();
  const [open, setOpen] = useState(false);
  const [qr, setQr] = useState("");
  const [qrError, setQrError] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<{
    latitude: number;
    longitude: number;
    accuracy: number;
    selfieDataUrl: string;
    checkedInAt: string;
    method: string;
  } | null>(null);

  useEffect(() => {
    let active = true;
    setQr("");
    setQrError(null);
    if (open && qrToken)
      import("qrcode")
        .then((module) =>
          module.toDataURL(
            JSON.stringify({ type: "FALE_SHIFT_CHECKIN", claimId, token: qrToken }),
            { width: 180, margin: 2 },
          ),
        )
        .then((value) => {
          if (active) setQr(value);
        })
        .catch(() => {
          if (active)
            setQrError(
              "Could not generate the booking QR. Use the six-digit PIN or reopen to retry.",
            );
        });
    return () => {
      active = false;
    };
  }, [open, qrToken, claimId]);

  if (!pin && !recorded) return null;

  return (
    <>
      <Button
        type="button"
        size="sm"
        variant={primary ? "default" : "outline"}
        className="rounded-xl text-xs font-semibold cursor-pointer"
        isLoading={action.isPending}
        onClick={(event) => {
          event.stopPropagation();
          if (recorded)
            void action.run(async () => {
              setEvidence(
                await apiFetch(`/shifts/claims/${claimId}/attendance`, { cache: "no-store" }),
              );
              setOpen(true);
            });
          else setOpen((value) => !value);
        }}
      >
        {recorded ? "View Attendance" : "Show Check-in PIN / QR"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md p-0 rounded-2xl border-border/80 bg-background shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="px-5 py-4 pr-12 border-b border-border/60 bg-muted/20 shrink-0 text-left">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                {recorded ? (
                  <HiOutlineShieldCheck className="h-4.5 w-4.5" />
                ) : (
                  <HiOutlineKey className="h-4.5 w-4.5" />
                )}
              </span>
              <DialogTitle className="text-sm font-extrabold text-foreground">
                {recorded ? "Verified Shift Attendance" : "Clinician Check-in PIN / QR"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed pt-1">
              {recorded
                ? "Recorded location and selfie from the clinician's check-in."
                : "Share with the clinician upon physical arrival at the hospital."}
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto min-h-0 p-5 space-y-4">
            {pin && (
              <>
                <div className="flex items-start gap-2.5 rounded-xl border border-primary/15 bg-primary-soft/30 px-3.5 py-3 text-[11px] text-muted-foreground leading-relaxed">
                  <HiOutlineShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p>Share the PIN or QR only when the clinician arrives to take the shift.</p>
                </div>
                <div className="rounded-2xl border border-primary/20 bg-primary-soft/30 p-4 text-center space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Six-digit check-in PIN
                  </p>
                  <p
                    className="font-mono text-3xl font-black tracking-[0.2em] text-primary pl-[0.2em]"
                    aria-label="Six-digit check-in PIN"
                  >
                    {pin}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Enter this PIN in the clinician's check-in screen.
                  </p>
                </div>
                {qrToken && (
                  <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 text-center space-y-3">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-foreground">
                      <HiOutlineQrCode className="h-4 w-4 text-primary" />
                      <span>Scan booking QR</span>
                    </div>
                    {qr && (
                      <div className="mx-auto w-fit rounded-2xl border border-border/70 bg-white p-3 shadow-2xs">
                        <img
                          src={qr}
                          alt="Booking check-in QR"
                          width={180}
                          height={180}
                          className="block h-auto w-[180px] max-w-full"
                        />
                      </div>
                    )}
                    {!qr && !qrError && (
                      <span
                        role="status"
                        className="inline-flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground"
                      >
                        <ButtonSpinner className="text-primary" />
                        Generating booking QR...
                      </span>
                    )}
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      The clinician can scan this QR instead of entering the PIN.
                    </p>
                  </div>
                )}
              </>
            )}

            {evidence && (
              <div className="space-y-3 py-2 text-xs">
                <div className="rounded-xl bg-muted/40 border border-border/60 p-3 space-y-1.5">
                  <p>
                    <strong className="text-foreground">Checked in:</strong>{" "}
                    {new Date(evidence.checkedInAt).toLocaleString("en-IN")} via {evidence.method}
                  </p>
                  <p>
                    <strong className="text-foreground">GPS Coordinates:</strong>{" "}
                    {evidence.latitude.toFixed(6)}, {evidence.longitude.toFixed(6)}
                  </p>
                  <p title="The browser estimates the precision of the captured coordinates.">
                    <strong className="text-foreground">Location Accuracy:</strong> ±
                    {Math.round(evidence.accuracy)} m
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    GPS precision, not distance from the hospital.
                  </p>
                </div>
                {evidence.selfieDataUrl && (
                  <div className="text-center pt-1">
                    <img
                      src={evidence.selfieDataUrl}
                      alt="Clinician attendance selfie"
                      className="h-44 w-44 mx-auto rounded-2xl object-cover border border-border shadow-2xs"
                    />
                  </div>
                )}
              </div>
            )}

            <RequestError message={action.error} />
            {qrError && <RequestError message={qrError} />}
          </div>
          <div className="px-5 py-3.5 border-t border-border/60 bg-muted/20 shrink-0 flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-9 rounded-xl px-5 text-xs font-bold"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
