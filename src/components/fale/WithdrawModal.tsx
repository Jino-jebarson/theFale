import { useState } from "react";
import { HiXMark, HiOutlineArrowUturnLeft, HiOutlineExclamationTriangle } from "react-icons/hi2";
import { Button } from "@/components/ui/button";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string, notes: string) => void;
  jobTitle: string;
  orgName: string;
}

const reasons = [
  "Accepted another job offer",
  "Shift timing or location mismatch",
  "Applied by mistake",
  "Compensation expectations differ",
  "Personal or family reasons",
  "Other",
];

export function WithdrawModal({ isOpen, onClose, onConfirm, jobTitle, orgName }: WithdrawModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>(reasons[0] ?? "Other");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirm(selectedReason, notes.trim());
      setIsSubmitting(false);
      onClose();
    }, 250);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="withdraw-dialog-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative flex flex-col w-full max-w-lg max-h-[min(90vh,680px)] rounded-3xl border border-border/80 bg-card shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Sticky Header */}
        <div className="relative shrink-0 border-b border-border/70 bg-card/95 px-5 py-4 sm:px-6 sm:py-5 backdrop-blur-md">
          <div className="flex items-start gap-3.5 pr-8">
            <div className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600 ring-4 ring-rose-50/50 dark:bg-rose-950/50 dark:text-rose-400 dark:ring-rose-950/30">
              <HiOutlineArrowUturnLeft className="h-5 w-5 sm:h-5.5 sm:w-5.5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <h2 id="withdraw-dialog-title" className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground">
                Withdraw application?
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-snug line-clamp-2">
                Withdrawing for <span className="font-semibold text-foreground">{jobTitle}</span> at{" "}
                <span className="font-semibold text-foreground">{orgName}</span>
              </p>
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            type="button"
            aria-label="Close dialog"
            className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground cursor-pointer"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Body Content */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6 sm:py-5 space-y-4">
          {/* Notice alert */}
          <div className="flex items-start gap-2.5 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3 sm:p-3.5 text-xs text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            <HiOutlineExclamationTriangle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <span className="leading-relaxed">
              The hospital hiring team will be notified immediately. You can re-apply anytime from your <strong>Closed</strong> applications tab.
            </span>
          </div>

          {/* Reason selector */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Reason for withdrawal <span className="text-rose-500">*</span>
            </label>
            <div className="grid gap-2 sm:grid-cols-2">
              {reasons.map((r) => {
                const checked = selectedReason === r;
                return (
                  <button
                    type="button"
                    key={r}
                    onClick={() => setSelectedReason(r)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 sm:py-3 text-left text-xs font-semibold transition-all cursor-pointer ${
                      checked
                        ? "border-primary bg-primary-soft text-primary shadow-xs ring-1 ring-primary"
                        : "border-border/80 bg-muted/30 text-muted-foreground hover:border-input hover:bg-card hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`grid h-4 w-4 shrink-0 place-items-center rounded-full border ${
                        checked ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50 bg-background"
                      }`}
                    >
                      {checked && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="truncate">{r}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Notes (optional) */}
          <div className="space-y-1.5">
            <label htmlFor="withdraw-notes" className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Additional notes <span className="font-normal text-muted-foreground/70">(Optional)</span>
            </label>
            <textarea
              id="withdraw-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Share any context or feedback with the facility..."
              className="w-full resize-none rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        {/* Sticky Footer with Action buttons */}
        <div className="shrink-0 border-t border-border/70 bg-card/95 px-5 py-3.5 sm:px-6 sm:py-4 backdrop-blur-md">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="w-full sm:w-auto rounded-xl border-border/80 font-semibold h-10 text-xs sm:text-sm"
            >
              Keep application
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isSubmitting}
              className="w-full sm:w-auto gap-2 rounded-xl bg-rose-600 font-semibold text-white hover:bg-rose-700 shadow-sm transition-colors active:scale-[0.98] h-10 text-xs sm:text-sm"
            >
              <HiOutlineArrowUturnLeft className="h-4 w-4" />
              {isSubmitting ? "Withdrawing..." : "Confirm withdrawal"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
