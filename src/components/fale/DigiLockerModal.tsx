import { useState, useEffect } from "react";
import { HiCheck, HiLockClosed, HiXMark } from "react-icons/hi2";
import { RiShieldKeyholeFill } from "react-icons/ri";
import { ImSpinner2 } from "react-icons/im";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

interface DigiLockerModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (fileName: string) => void;
  candidateName?: string;
  candidateMobile?: string;
}

export function DigiLockerModal({
  open,
  onClose,
  onSuccess,
  candidateName = "Candidate",
  candidateMobile = "",
}: DigiLockerModalProps) {
  const [step, setStep] = useState<"aadhaar" | "otp" | "loading" | "success">("aadhaar");
  const [aadhaar, setAadhaar] = useState("4892 7391 2045");
  const [otp, setOtp] = useState("");
  const [consent, setConsent] = useState(true);
  const [resendTimer, setResendTimer] = useState(30);

  useEffect(() => {
    if (!open) {
      setStep("aadhaar");
      setOtp("");
    }
  }, [open]);

  useEffect(() => {
    if (step === "otp" && resendTimer > 0) {
      const t = setTimeout(() => setResendTimer((r) => r - 1), 1000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [step, resendTimer]);

  if (!open) return null;

  const handleAadhaarChange = (v: string) => {
    const raw = v.replace(/\D/g, "").slice(0, 12);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
    setAadhaar(formatted);
  };

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (aadhaar.replace(/\s/g, "").length < 12) {
      toast.error("Please enter a valid 12-digit Aadhaar number");
      return;
    }
    if (!consent) {
      toast.error("Please provide consent to verify with DigiLocker");
      return;
    }
    setStep("otp");
    setResendTimer(30);
    toast.success("OTP sent to Aadhaar-registered mobile");
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      toast.error("Please enter the 6-digit OTP");
      return;
    }
    setStep("loading");
    setTimeout(() => {
      setStep("success");
    }, 1200);
  };

  const fillDemoOtp = () => {
    setOtp("123456");
  };

  const complete = () => {
    onSuccess("Aadhaar-DigiLocker-Verified.pdf");
    toast.success("Identity proof verified via DigiLocker!");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-[490px] overflow-hidden rounded-3xl bg-white shadow-2xl border border-slate-200/90 dark:border-border dark:bg-card">
        {/* Tricolor National Identity Ribbon */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

        {/* DigiLocker Official Header */}
        <div className="bg-[#002B66] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-inner">
              <RiShieldKeyholeFill className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white">DigiLocker</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded text-white">
                  Govt. of India
                </span>
              </div>
              <p className="text-xs text-blue-100/90 font-medium mt-0.5">
                Digital India · National Informatics Centre
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-white/70 hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
            aria-label="Close dialog"
          >
            <HiXMark className="h-5 w-5" />
          </button>
        </div>

        {/* Security & Authenticity Trust Bar */}
        <div className="bg-slate-50/90 px-6 py-2.5 text-xs text-slate-600 flex items-center justify-between border-b border-slate-100 dark:bg-muted/40 dark:border-border dark:text-muted-foreground">
          <span className="flex items-center gap-2 font-medium">
            <HiLockClosed className="h-3.5 w-3.5 text-emerald-600" />
            256-bit Encrypted UIDAI Gateway
          </span>
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            OFFICIAL PORTAL
          </span>
        </div>

        {/* Modal Main Body */}
        <div className="p-6 sm:p-7">
          {step === "aadhaar" && (
            <form onSubmit={sendOtp} className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-foreground">
                  Verify Aadhaar via DigiLocker
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Fetch your authentic, cryptographically verified e-Aadhaar directly from UIDAI in seconds.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  12-digit Aadhaar Number <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={aadhaar}
                    onChange={(e) => handleAadhaarChange(e.target.value)}
                    placeholder="Enter 12-digit Aadhaar number"
                    maxLength={14}
                    className="h-12 w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 font-mono text-base font-bold tracking-[0.18em] text-slate-900 placeholder:tracking-normal placeholder:font-sans placeholder:text-slate-400 focus:border-[#0047AB] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-border dark:bg-card dark:text-foreground transition-all"
                  />
                  <RiShieldKeyholeFill className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#0047AB]/50" />
                </div>
                <p className="text-xs text-slate-500 pt-0.5">
                  An OTP will be sent to your UIDAI registered mobile {candidateMobile ? `(ending in •••• ${candidateMobile.slice(-4)})` : ""}.
                </p>
              </div>

              {/* Consent Card */}
              <label className="flex items-start gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 text-xs text-slate-600 dark:border-border dark:bg-muted/30 dark:text-slate-300 cursor-pointer transition-colors hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-[#0047AB] rounded cursor-pointer"
                />
                <span className="leading-relaxed">
                  I consent to authenticating via DigiLocker (UIDAI) and sharing my digital identity proof with <strong>FALE Healthcare</strong> for credential verification.
                </span>
              </label>

              {/* Bottom Actions Bar */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onClose}
                  className="h-11 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-[#0047AB] text-xs font-bold text-white shadow-md shadow-blue-900/15 hover:bg-[#00388A] active:scale-[0.98] transition-all cursor-pointer"
                >
                  Send OTP via UIDAI
                </Button>
              </div>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={verifyOtp} className="space-y-5">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-foreground">
                  Enter 6-Digit OTP
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Security verification code sent to UIDAI registered mobile ending in •••• {candidateMobile ? candidateMobile.slice(-4) : "2045"}.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  One Time Password (OTP)
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="• • • • • •"
                  className="h-13 w-full text-center rounded-2xl border border-slate-200 bg-slate-50/50 text-2xl font-bold tracking-[0.5em] text-slate-900 focus:border-[#0047AB] focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/10 dark:border-border dark:bg-card dark:text-foreground transition-all"
                />
              </div>

              <div className="flex items-center justify-between text-xs px-1">
                <button
                  type="button"
                  onClick={fillDemoOtp}
                  className="font-bold text-[#0047AB] hover:underline cursor-pointer"
                >
                  Use Demo OTP: 123456
                </button>
                <span className="text-slate-500 font-medium">
                  {resendTimer > 0 ? (
                    `Resend in ${resendTimer}s`
                  ) : (
                    <button
                      type="button"
                      onClick={() => setResendTimer(30)}
                      className="font-bold text-primary hover:underline cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  )}
                </span>
              </div>

              {/* Bottom Actions Bar */}
              <div className="pt-2 flex items-center justify-end gap-3 border-t border-border">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setStep("aadhaar")}
                  className="h-11 px-4 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="h-11 px-6 rounded-xl bg-primary text-xs font-bold text-white shadow-brand hover:bg-primary-hover active:scale-[0.98] transition-all cursor-pointer"
                >
                  Verify & Fetch Aadhaar
                </Button>
              </div>
            </form>
          )}

          {step === "loading" && (
            <div className="py-10 text-center space-y-4">
              <div className="relative mx-auto h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping" />
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary dark:bg-primary-soft shadow-inner">
                  <ImSpinner2 className="h-8 w-8 animate-spin" />
                </div>
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-foreground">
                  Connecting to DigiLocker UIDAI Gateway…
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                  Retrieving cryptographically signed electronic Aadhaar XML certificate
                </p>
              </div>
            </div>
          )}

          {step === "success" && (
            <div className="space-y-5 text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 shadow-sm">
                <HiCheck className="h-9 w-9 stroke-[3]" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-foreground">
                  Aadhaar Verified Successfully!
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Official government identity authenticated via UIDAI DigiLocker Gateway.
                </p>
              </div>

              {/* Verified Certificate Card */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-left dark:border-emerald-900/50 dark:bg-emerald-950/20 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-emerald-200/60 dark:border-emerald-900/40">
                  <div className="text-xs font-bold text-emerald-950 dark:text-emerald-200">
                    UIDAI e-Aadhaar Certificate
                  </div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-200/90 text-emerald-900 px-2.5 py-0.5 rounded-full dark:bg-emerald-900 dark:text-emerald-300">
                    AUTHENTICATED
                  </span>
                </div>
                <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Candidate Name:</span>
                    <span className="font-bold text-slate-900 dark:text-foreground">{candidateName || "Verified Citizen"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Masked Aadhaar:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-foreground">XXXX XXXX 2045</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 font-medium">Issuing Authority:</span>
                    <span className="font-semibold text-slate-800 dark:text-foreground">UIDAI · Govt. of India</span>
                  </div>
                </div>
              </div>

              <Button
                type="button"
                onClick={complete}
                className="w-full h-12 rounded-2xl bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-700/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                Attach Verified Document to Application
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
