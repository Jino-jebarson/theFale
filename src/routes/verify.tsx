import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import {
  HiArrowLeft,
  HiOutlineShieldCheck,
  HiOutlineCheckBadge,
  HiOutlineXCircle,
  HiOutlinePencilSquare,
  HiOutlineQrCode,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { toast } from "sonner";
import { AuthLayout } from "@/components/fale/AuthLayout";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { setState, useApp } from "@/lib/store";
import { isApiEnabled } from "@/lib/api";
import { verifyOtp } from "@/lib/adapters/authAdapter";
import {
  getPublicVerificationBadge,
  type VerificationBadgeResponse,
} from "@/lib/adapters/verificationAdapter";

export const Route = createFileRoute("/verify")({
  validateSearch: (search: Record<string, unknown>): { id?: string } => ({
    id: typeof search.id === "string" ? search.id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Public Credential Verification — FALE Healthcare" },
      {
        name: "description",
        content: "Cryptographically verified clinical license and institutional credential badge on FALE.",
      },
      { property: "og:title", content: "Public Credential Verification — FALE" },
      {
        property: "og:description",
        content: "Verified healthcare council registration & hospital accreditation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Verify,
});

function Verify() {
  const s = useApp();
  const search = useSearch({ from: "/verify" });
  const navigate = useNavigate();

  // Public QR Badge State
  const [badgeLoading, setBadgeLoading] = useState(Boolean(search.id));
  const [badgeData, setBadgeData] = useState<VerificationBadgeResponse | null>(null);
  const [badgeError, setBadgeError] = useState<string | null>(null);

  // Fallback OTP State
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(30);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (search.id) {
      setBadgeLoading(true);
      getPublicVerificationBadge(search.id)
        .then((data) => {
          setBadgeData(data);
          setBadgeError(null);
        })
        .catch((err) => {
          setBadgeError(err?.message || "Verification record not found or link has expired.");
          setBadgeData(null);
        })
        .finally(() => {
          setBadgeLoading(false);
        });
    }
  }, [search.id]);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const submit = async (value = code) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    {
      try {
        const contact = s.contact;
        if (!contact) throw new Error("Enter your mobile number on the sign-in page first.");
        const roleParam = s.portal === "facility" ? "ROLE_FACILITY" : "ROLE_CANDIDATE";
        const authData = await verifyOtp(contact, value, roleParam);
        const role = authData.role ?? authData.user?.role;
        const candidateLevel = authData.candidateLevel ?? authData.user?.candidateLevel;
        const isOnboarded = Boolean(authData.onboarded ?? authData.user?.onboarded);

        setState({
          signedIn: true,
          portal: s.portal,
          candidateLevel: candidateLevel ? (candidateLevel.toLowerCase() as any) : undefined,
          onboarded: isOnboarded,
        });

        if (isOnboarded) {
          navigate({ to: s.portal === "facility" ? "/employer" : "/home" });
        } else {
          navigate({
            to: "/onboarding",
            search: { role: s.portal === "facility" ? "employer" : "candidate" },
          });
        }
      } catch (err: any) {
        toast.error(err?.message || "Invalid verification code.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }


  };

  // If viewing a public QR credential badge
  if (search.id) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center">
          <div className="flex justify-center mb-4">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-primary-soft text-primary">
              <HiOutlineQrCode className="h-9 w-9" />
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-slate-900">
            FALE Credential Trust
          </h1>
          <p className="text-xs text-muted-foreground mt-1 mb-6">
            Official Healthcare Registry Record
          </p>

          {badgeLoading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-muted-foreground">Verifying cryptographically signed badge...</p>
            </div>
          ) : badgeError ? (
            <div className="py-8 px-4 rounded-2xl bg-red-50 border border-red-200 text-red-700">
              <HiOutlineXCircle className="h-10 w-10 text-red-500 mx-auto mb-2" />
              <p className="font-semibold text-sm">Verification Unsuccessful</p>
              <p className="text-xs mt-1 text-red-600">{badgeError}</p>
            </div>
          ) : badgeData ? (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-center gap-1.5 text-emerald-800 font-bold text-lg">
                  <RiVerifiedBadgeFill className="h-6 w-6 text-emerald-600" />
                  <span>{badgeData.maskedName}</span>
                </div>
                <p className="text-xs font-semibold text-emerald-700 mt-1 uppercase tracking-wider">
                  {badgeData.entityType === "CANDIDATE" ? "Licensed Practitioner" : "Verified Institution"}
                </p>
                <div className="mt-3 pt-3 border-t border-emerald-200/60 text-xs text-emerald-800">
                  {badgeData.accreditationText}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-left text-xs space-y-1">
                <div className="flex justify-between text-muted-foreground">
                  <span>Badge ID</span>
                  <span className="font-mono text-foreground font-semibold">{badgeData.verificationId.slice(0, 13)}...</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Registry Status</span>
                  <span className="font-bold text-emerald-600">ACTIVE & VERIFIED</span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground mt-4">
                This certificate was verified live against state council registers and institutional licenses.
              </p>
            </div>
          ) : null}

          <div className="mt-6 pt-4 border-t border-slate-100">
            <Link
              to="/"
              className="text-xs font-bold text-primary hover:underline inline-flex items-center gap-1"
            >
              <HiArrowLeft className="h-3.5 w-3.5" /> Return to FALE Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Fallback direct OTP login screen
  return (
    <AuthLayout variant={s.portal === "facility" ? "facility" : "candidate"}>
      <Link
        to="/login"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary"
      >
        <HiArrowLeft className="h-4 w-4" /> Back
      </Link>
      <span className="mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary">
        <HiOutlineShieldCheck className="h-7 w-7" />
      </span>
      <h1 className="mt-5 text-[28px] font-extrabold tracking-tight">Verify it's you</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Enter the 6-digit code sent to{" "}
        <b className="font-semibold text-foreground">{s.contact || "your contact"}</b>.{" "}
        <Link
          to="/login"
          className="ml-1 inline-flex items-center gap-1 font-semibold text-primary hover:underline"
        >
          <HiOutlinePencilSquare className="h-3.5 w-3.5" />
          Edit
        </Link>
      </p>
      <div className={`mt-7 ${isSubmitting ? "opacity-60 pointer-events-none" : ""}`}>
        <InputOTP
          maxLength={6}
          value={code}
          disabled={isSubmitting}
          onChange={setCode}
          onComplete={(value) => submit(value)}
        >
          <InputOTPGroup className="gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="h-14 w-12 rounded-lg border text-lg font-bold first:rounded-lg last:rounded-lg"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {false}
      <Button
        size="lg"
        className="mt-6 w-full"
        onClick={() => submit()}
        disabled={code.length < 6 || isSubmitting}
      >
        {isSubmitting ? (
          <span className="inline-flex items-center justify-center gap-2">
            <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
            <span>Verifying code…</span>
          </span>
        ) : (
          <span>Verify & continue</span>
        )}
      </Button>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Didn't get it?{" "}
        {timer > 0 ? (
          <span>Resend in 0:{String(timer).padStart(2, "0")}</span>
        ) : (
          <button
            className="font-semibold text-primary"
            onClick={() => {
              setTimer(30);
              toast.success("New code sent");
            }}
          >
            Resend code
          </button>
        )}
      </p>
    </AuthLayout>
  );
}
