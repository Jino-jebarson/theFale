import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { FcGoogle } from "react-icons/fc";
import { FaLinkedin } from "react-icons/fa";
import { HiArrowLeft, HiArrowRight, HiOutlineDevicePhoneMobile, HiOutlineEnvelope } from "react-icons/hi2";
import { toast } from "sonner";
import { AuthLayout } from "@/components/fale/AuthLayout";
import { Button } from "@/components/ui/button";
import { Field, PhoneField } from "@/components/fale/fields";
import { setState, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — FALE" },
      { name: "description", content: "Sign in to FALE with Google, LinkedIn, mobile number or email." },
      { property: "og:title", content: "Sign in — FALE" },
      { property: "og:description", content: "Sign in to FALE with Google, LinkedIn, mobile or email." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const s = useApp();
  const f = s.portal === "facility";
  const navigate = useNavigate();
  const initialMode = s.contact?.includes("@") ? "email" : f ? "email" : "mobile";
  const [mode, setMode] = useState<"mobile" | "email">(initialMode);
  const [contact, setContact] = useState(
    s.contact ? s.contact.replace(/^\+91\s*/, "") : ""
  );

  const social = (provider: string) => {
    toast.success(`Signed in with ${provider}`, { description: "Preview mode — no real account is connected." });
    setState({ signedIn: true, contact: `${provider.toLowerCase()}@account` });
    navigate({ to: s.onboarded ? (f ? "/employer" : "/home") : "/onboarding" });
  };

  return (
    <AuthLayout
      variant={f ? "facility" : "candidate"}
      bannerEyebrow={null}
      bannerTitle={
        f ? (
          <span className="block text-[28px] sm:text-[32px] lg:text-[36px] xl:text-[40px]">
            Better teams. Better care.
          </span>
        ) : (
          <>
            <span className="block text-[26px] sm:text-[30px] lg:text-[34px] xl:text-[38px] whitespace-nowrap">
              Meaningful work, close to
            </span>
            <span className="block text-[26px] sm:text-[30px] lg:text-[34px] xl:text-[38px]">
              home.
            </span>
          </>
        )
      }
      bannerSubtitle={
        f
          ? "Reach verified nurses, doctors and allied health professionals across India."
          : "Over 2,000 verified roles from leading hospitals and clinics."
      }
      bannerPoints={[]}
    >
      <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
        <HiArrowLeft className="h-4 w-4" /> Choose a different portal
      </Link>
      <p className="eyebrow mt-6">{f ? "Employer login" : "Candidate login"}</p>
      <h1 className="mt-2 text-[30px] font-extrabold leading-tight tracking-tight">
        {f ? "Your next great hire starts here." : "A career that cares for you."}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">Sign in or create your account in a few moments.</p>

      <div className="mt-7 space-y-3">
        <Button variant="social" size="lg" className="w-full" onClick={() => social("Google")}>
          <FcGoogle className="!h-5 !w-5" /> Continue with Google
        </Button>
        <Button variant="social" size="lg" className="w-full" onClick={() => social("LinkedIn")}>
          <FaLinkedin className="!h-5 !w-5 text-linkedin" /> Continue with LinkedIn
        </Button>
      </div>

      <div className="my-6 flex items-center gap-3 text-xs font-medium text-muted-foreground">
        <span className="h-px flex-1 bg-border" /> or continue with {mode === "mobile" ? "mobile" : "email"} <span className="h-px flex-1 bg-border" />
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-full bg-muted p-1">
        {(["mobile", "email"] as const).map((m) => (
          <button key={m} type="button" onClick={() => { setMode(m); setContact(""); }} className={cn("rounded-full py-2 text-sm font-semibold transition-all", mode === m ? "bg-card text-primary shadow-sm" : "text-muted-foreground")}>
            {m === "mobile" ? "Mobile number" : "Email"}
          </button>
        ))}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setState({ contact: mode === "mobile" ? `+91 ${contact}` : contact });
          navigate({ to: "/verify" });
        }}
        className="space-y-4"
      >
        {mode === "mobile" ? (
          <PhoneField
            value={contact}
            onChange={(e) => setContact(e.target.value.replace(/\D/g, ""))}
            hint="We'll send a 6-digit code by SMS"
          />
        ) : (
          <Field label={f ? "Work email" : "Email address"} required type="email" icon={<HiOutlineEnvelope />} placeholder={f ? "hr@yourhospital.com" : "you@example.com"} value={contact} onChange={(e) => setContact(e.target.value)} autoComplete="email" />
        )}
        <Button size="lg" className="w-full">
          Send verification code <HiArrowRight />
        </Button>
      </form>
      <p className="mt-6 text-center text-xs leading-relaxed text-muted-foreground">
        <HiOutlineDevicePhoneMobile className="mr-1 inline h-4 w-4" />
        By continuing, you agree to FALE's <span className="font-semibold text-primary">Terms</span> and <span className="font-semibold text-primary">Privacy notice</span>.
      </p>
    </AuthLayout>
  );
}
