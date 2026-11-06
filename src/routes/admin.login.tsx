import { useState, type FormEvent } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  HiOutlineShieldCheck,
  HiOutlineLockClosed,
  HiOutlineEnvelope,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineArrowRight,
  HiOutlineArrowPath,
  HiOutlineExclamationCircle,
  HiOutlineBolt,
  HiOutlineArrowLeft,
} from "react-icons/hi2";
import { toast } from "sonner";
import { Logo } from "@/components/fale/Logo";
import { ThemeToggle } from "@/components/fale/ThemeToggle";
import { Button } from "@/components/ui/button";
import { adminLogin } from "@/lib/adapters/authAdapter";
import { setState } from "@/lib/store";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Portal Sign In — FALE Healthcare" },
      {
        name: "description",
        content: "Secure administrator sign-in console for FALE Healthcare platform operations, KYC verification, and hospital duty coordination.",
      },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberTerminal, setRememberTerminal] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg("Administrator email is required.");
      return;
    }
    if (!password) {
      setErrorMsg("Password is required.");
      return;
    }

    setLoading(true);
    try {
      const auth = await adminLogin(cleanEmail, password);
      // Switch portal to admin in store
      setState(() => ({
        portal: "admin",
        signedIn: true,
        onboarded: true,
      }));

      toast.success("Authentication successful!", {
        description: `Welcome to the FALE Admin Cockpit, ${auth.user?.phone || "Administrator"}.`,
      });

      // Redirect to admin cockpit
      navigate({ to: "/admin" });
    } catch (err: any) {
      console.error("Admin login error:", err);
      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Invalid admin credentials. Please verify your email and password.";
      setErrorMsg(message);
      toast.error("Sign-in failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickFill = () => {
    setEmail("admin@thefale.com");
    setPassword("admin123");
    setErrorMsg(null);
    toast.info("Demo administrator credentials applied", {
      description: "admin@thefale.com / admin123",
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-between selection:bg-primary/20 selection:text-primary relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-primary/10 dark:bg-primary/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 right-10 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold uppercase tracking-wider">
            <HiOutlineShieldCheck className="h-3 w-3" />
            <span>Admin Console</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-xl border border-border/70 hover:bg-muted/40"
          >
            <HiOutlineArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Main Portal</span>
          </Link>
        </div>
      </header>

      {/* Centered Login Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-6 sm:p-8 shadow-xl space-y-6">
            
            {/* Header info */}
            <div className="space-y-2 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
                <HiOutlineShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight pt-1">
                Super Admin Console
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Restricted access. Sign in with authorized platform credentials to manage healthcare operations.
              </p>
            </div>

            {/* Error Alert if any */}
            {errorMsg && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 flex items-start gap-2.5 text-destructive text-xs animate-in fade-in">
                <HiOutlineExclamationCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-snug font-medium">{errorMsg}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
                  Administrator Email
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-muted-foreground pointer-events-none">
                    <HiOutlineEnvelope className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@thefale.com"
                    autoComplete="email"
                    autoFocus
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/80 bg-muted/30 focus:bg-card text-foreground placeholder:text-muted-foreground text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => toast.info("Please contact the Lead Systems Officer to reset administrator credentials.")}
                    className="text-[11px] font-bold text-primary hover:underline cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-muted-foreground pointer-events-none">
                    <HiOutlineLockClosed className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    autoComplete="current-password"
                    required
                    className="w-full h-11 pl-10 pr-11 rounded-xl border border-border/80 bg-muted/30 focus:bg-card text-foreground placeholder:text-muted-foreground text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                    title={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <HiOutlineEyeSlash className="h-4 w-4" />
                    ) : (
                      <HiOutlineEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Options */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberTerminal}
                    onChange={(e) => setRememberTerminal(e.target.checked)}
                    className="rounded border-border text-primary focus:ring-primary/30 h-4 w-4 accent-primary"
                  />
                  <span className="text-xs text-muted-foreground font-medium">
                    Remember this terminal
                  </span>
                </label>

                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold">
                  256-bit TLS
                </span>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/95 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all mt-2"
              >
                {loading ? (
                  <>
                    <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
                    <span>Authorizing Session...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Admin Cockpit</span>
                    <HiOutlineArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Quick Demo Pill */}
            <div className="pt-2 border-t border-border/60 text-center space-y-2">
              <button
                type="button"
                onClick={handleQuickFill}
                className="inline-flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground hover:text-primary transition-colors cursor-pointer"
              >
                <HiOutlineBolt className="h-3.5 w-3.5 text-primary" />
                <span>Fill Demo Admin Credentials</span>
              </button>
            </div>
          </div>

          {/* Security Banner */}
          <div className="mt-4 text-center space-y-1 text-[11px] text-muted-foreground/80 leading-relaxed px-4">
            <p>
              🔒 <strong>Strict Auditing Enabled:</strong> All administrative sign-in attempts, timestamp tokens, and geographic IP origins are cryptographically logged for compliance.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-[11px] text-muted-foreground relative z-10">
        <p>© 2026 FALE Healthcare Infrastructure Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}

