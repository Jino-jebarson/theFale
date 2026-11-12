import { Button } from "@/components/ui/button";

interface DigiLockerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (fileName: string) => void;
  candidateName?: string;
  candidateMobile?: string;
}

export function DigiLockerModal({ open, onClose }: DigiLockerModalProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <section role="dialog" aria-modal="true" aria-labelledby="digilocker-title" aria-describedby="digilocker-description" className="w-full max-w-md rounded-3xl border border-border bg-card p-6 shadow-xl">
        <h2 id="digilocker-title" className="text-lg font-bold">DigiLocker verification unavailable</h2>
        <p id="digilocker-description" className="mt-3 text-sm text-muted-foreground">
          DigiLocker verification is not connected yet. Upload your identity document directly to submit it for review.
        </p>
        <Button type="button" autoFocus onClick={onClose} className="mt-6">Back to document upload</Button>
      </section>
    </div>
  );
}
