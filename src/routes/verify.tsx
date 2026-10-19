import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { HiArrowLeft, HiOutlineShieldCheck, HiOutlinePencilSquare } from "react-icons/hi2";
import { toast } from "sonner";
import { AuthLayout } from "@/components/fale/AuthLayout";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { setState, useApp } from "@/lib/store";

export const Route = createFileRoute("/verify")({
  head: () => ({
    meta: [
      { title: "Verify your account — FALE" },
      { name: "description", content: "Enter the 6-digit code to verify your FALE account." },
      { property: "og:title", content: "Verify your account — FALE" },
      { property: "og:description", content: "Enter the 6-digit code to verify your FALE account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Verify,
});

function Verify() {
  const s = useApp();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [timer, setTimer] = useState(30);

  useEffect(() => {
    if (timer <= 0) return;
    const t = setTimeout(() => setTimer(timer - 1), 1000);
    return () => clearTimeout(t);
  }, [timer]);

  const submit = (value = code) => {
    if (value !== "123456") { toast.error("That code doesn't match. Try 123456 in this preview."); return; }
    setState({ signedIn: true });
    navigate({ to: s.onboarded ? (s.portal === "facility" ? "/employer" : "/home") : "/onboarding" });
  };

  return (
    <AuthLayout variant={s.portal}>
      <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
        <HiArrowLeft className="h-4 w-4" /> Back
      </Link>
      <span className="mt-6 grid h-14 w-14 place-items-center rounded-2xl bg-primary-soft text-primary"><HiOutlineShieldCheck className="h-7 w-7" /></span>
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
      <div className="mt-7">
        <InputOTP maxLength={6} value={code} onChange={setCode} onComplete={(value) => submit(value)}>
          <InputOTPGroup className="gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <InputOTPSlot key={i} index={i} className="h-14 w-12 rounded-lg border text-lg font-bold first:rounded-lg last:rounded-lg" />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Preview code: <b className="text-primary">123456</b></p>
      <Button size="lg" className="mt-6 w-full" onClick={() => submit()} disabled={code.length < 6}>Verify & continue</Button>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Didn't get it?{" "}
        {timer > 0 ? <span>Resend in 0:{String(timer).padStart(2, "0")}</span> : (
          <button className="font-semibold text-primary" onClick={() => { setTimer(30); toast.success("New code sent"); }}>Resend code</button>
        )}
      </p>
    </AuthLayout>
  );
}
