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
  HiOutlineUser,
  HiOutlineKey,
  HiOutlineXMark,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { toast } from "sonner";
import { Logo } from "@/components/fale/Logo";
import { ThemeToggle } from "@/components/fale/ThemeToggle";
import { Button } from "@/components/ui/button";
import { adminLogin, adminSignup, adminForgotPassword, ADMIN_STATIC_PASSCODE } from "@/lib/adapters/authAdapter";
import { setState } from "@/lib/store";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [
      { title: "Admin Portal Sign In & Registration — FALE Healthcare" },
      {
        name: "description",
        content: "Secure administrator sign-in and registration console for FALE Healthcare platform operations, KYC verification, and hospital duty coordination.",
      },
    ],
  }),
  component: AdminLoginPage,
});

function AdminLoginPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">("signin");

  // Sign In States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberTerminal, setRememberTerminal] = useState(true);

  // Sign Up States
  const [signupUsername, setSignupUsername] = useState("");
  const [signupEmail, setSignupEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [signupPasscode, setSignupPasscode] = useState("");

  // Forgot Password Modal States
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPasscode, setForgotPasscode] = useState("");
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState<string | null>(null);

  // Shared status
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sign In Handler
  const handleSignIn = async (e: FormEvent) => {
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
      const dbUsername = auth.user?.username || cleanEmail.split("@")[0] || "Admin";

      setState((prev) => ({
        ...prev,
        portal: "admin",
        signedIn: true,
        onboarded: true,
        user: auth.user,
        profile: {
          ...prev.profile,
          adminName: dbUsername,
          username: dbUsername,
          email: auth.user?.email || cleanEmail,
        },
      }));

      toast.success("Authentication successful!", {
        description: `Welcome to the FALE Admin Cockpit, ${dbUsername}.`,
      });

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

  // Sign Up Handler
  const handleSignUp = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanUsername = signupUsername.trim();
    const cleanEmail = signupEmail.trim();
    const cleanPasscode = signupPasscode.trim();

    if (!cleanUsername) {
      setErrorMsg("Administrator username is required.");
      return;
    }
    if (!cleanEmail) {
      setErrorMsg("Working email address is required.");
      return;
    }
    if (!signupPassword || signupPassword.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }
    if (!cleanPasscode) {
      setErrorMsg("Secured platform authorization passcode is required.");
      return;
    }

    setLoading(true);
    try {
      const auth = await adminSignup({
        username: cleanUsername,
        workingmailid: cleanEmail,
        password: signupPassword,
        passcode: cleanPasscode,
      });

      const dbUsername = auth.user?.username || cleanUsername;

      setState((prev) => ({
        ...prev,
        portal: "admin",
        signedIn: true,
        onboarded: true,
        user: auth.user,
        profile: {
          ...prev.profile,
          adminName: dbUsername,
          username: dbUsername,
          email: auth.user?.email || cleanEmail,
        },
      }));

      toast.success("Administrator Account Created!", {
        description: `Welcome aboard, ${dbUsername}. You have full operational clearance.`,
      });

      navigate({ to: "/admin" });
    } catch (err: any) {
      console.error("Admin signup error:", err);
      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to register administrator account. Please verify the passcode.";
      setErrorMsg(message);
      toast.error("Sign-up failed", { description: message });
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Handler
  const handleForgotPassword = async (e: FormEvent) => {
    e.preventDefault();
    setForgotError(null);

    const cleanEmail = forgotEmail.trim();
    const cleanPasscode = forgotPasscode.trim();

    if (!cleanEmail) {
      setForgotError("Working email address is required.");
      return;
    }
    if (!cleanPasscode) {
      setForgotError("Secured platform authorization passcode is required.");
      return;
    }
    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError("New password must be at least 6 characters.");
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("New passwords do not match.");
      return;
    }

    setForgotLoading(true);
    try {
      await adminForgotPassword({
        workingmailid: cleanEmail,
        passcode: cleanPasscode,
        newPassword: forgotNewPassword,
      });

      toast.success("Password Reset Successfully!", {
        description: "Your administrator password has been updated. Please sign in now.",
      });

      setShowForgotModal(false);
      setEmail(cleanEmail);
      setPassword("");
      setTab("signin");
      setErrorMsg(null);
    } catch (err: any) {
      console.error("Admin forgot password error:", err);
      const message =
        err?.message ||
        err?.response?.data?.message ||
        "Failed to reset password. Please check the passcode and email.";
      setForgotError(message);
      toast.error("Reset failed", { description: message });
    } finally {
      setForgotLoading(false);
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
      <header className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 sm:py-5 flex items-center justify-between gap-3 relative z-10">
        <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
          <Logo />
          <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold uppercase tracking-wider">
            <HiOutlineShieldCheck className="h-3 w-3" />
            <span>Admin Console</span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <ThemeToggle />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors px-2.5 sm:px-3 py-1.5 rounded-xl border border-border/70 hover:bg-muted/40 shrink-0 whitespace-nowrap"
          >
            <HiOutlineArrowLeft className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Back to Main Portal</span>
            <span className="sm:hidden">Back</span>
          </Link>
        </div>
      </header>

      {/* Centered Auth Card */}
      <main className="flex-1 flex items-center justify-center p-3.5 sm:p-6 relative z-10">
        <div className="w-full max-w-md">
          <div className="rounded-3xl border border-border/80 bg-card/90 backdrop-blur-md p-5 sm:p-8 shadow-xl space-y-6">

            {/* Header info */}
            <div className="space-y-2 text-center">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-xs">
                <HiOutlineShieldCheck className="h-6 w-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight pt-1">
                Super Admin Console
              </h1>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
                Restricted access. Sign in or register with verified organization credentials and security passcode.
              </p>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="grid grid-cols-2 p-1 bg-muted/50 rounded-2xl border border-border/60">
              <button
                type="button"
                onClick={() => {
                  setTab("signin");
                  setErrorMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${tab === "signin"
                    ? "bg-card text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("signup");
                  setErrorMsg(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${tab === "signup"
                    ? "bg-card text-foreground shadow-xs border border-border/80"
                    : "text-muted-foreground hover:text-foreground"
                  }`}
              >
                Register Admin
              </button>
            </div>

            {/* Error Alert if any */}
            {errorMsg && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3.5 flex items-start gap-2.5 text-destructive text-xs animate-in fade-in">
                <HiOutlineExclamationCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-snug font-medium">{errorMsg}</span>
              </div>
            )}

            {/* SIGN IN FORM */}
            {tab === "signin" && (
              <form onSubmit={handleSignIn} className="space-y-4">
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
                      placeholder="Enter administrator email"
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
                      onClick={() => {
                        setForgotEmail(email || "");
                        setForgotError(null);
                        setShowForgotModal(true);
                      }}
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
            )}

            {/* SIGN UP FORM */}
            {tab === "signup" && (
              <form onSubmit={handleSignUp} className="space-y-4">
                {/* Username */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
                    Admin Username
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-muted-foreground pointer-events-none">
                      <HiOutlineUser className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={signupUsername}
                      onChange={(e) => setSignupUsername(e.target.value)}
                      placeholder="Enter administrator username"
                      autoComplete="username"
                      required
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/80 bg-muted/30 focus:bg-card text-foreground placeholder:text-muted-foreground text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Work Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
                    Working Email ID
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-muted-foreground pointer-events-none">
                      <HiOutlineEnvelope className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      value={signupEmail}
                      onChange={(e) => setSignupEmail(e.target.value)}
                      placeholder="Enter official work email"
                      autoComplete="email"
                      required
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/80 bg-muted/30 focus:bg-card text-foreground placeholder:text-muted-foreground text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-muted-foreground pointer-events-none">
                      <HiOutlineLockClosed className="h-4 w-4" />
                    </span>
                    <input
                      type={showSignupPassword ? "text" : "password"}
                      value={signupPassword}
                      onChange={(e) => setSignupPassword(e.target.value)}
                      placeholder="Min. 6 characters"
                      autoComplete="new-password"
                      required
                      className="w-full h-11 pl-10 pr-11 rounded-xl border border-border/80 bg-muted/30 focus:bg-card text-foreground placeholder:text-muted-foreground text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignupPassword(!showSignupPassword)}
                      className="absolute right-3.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                      title={showSignupPassword ? "Hide password" : "Show password"}
                    >
                      {showSignupPassword ? (
                        <HiOutlineEyeSlash className="h-4 w-4" />
                      ) : (
                        <HiOutlineEye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Platform Passcode */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground block uppercase tracking-wider">
                      Authorization Passcode
                    </label>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">
                      Required
                    </span>
                  </div>
                  <div className="relative flex items-center">
                    <span className="absolute left-3.5 text-muted-foreground pointer-events-none">
                      <HiOutlineKey className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      value={signupPasscode}
                      onChange={(e) => setSignupPasscode(e.target.value)}
                      placeholder="Enter secured platform passcode"
                      required
                      className="w-full h-11 pl-10 pr-4 rounded-xl border border-border/80 bg-muted/30 focus:bg-card text-foreground placeholder:text-muted-foreground text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all tracking-wider"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-tight">
                    Strict master authorization gate. Contact system administration if you do not have the passcode.
                  </p>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-xl font-bold text-sm bg-primary text-primary-foreground hover:bg-primary/95 shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all mt-3"
                >
                  {loading ? (
                    <>
                      <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
                      <span>Registering Administrator...</span>
                    </>
                  ) : (
                    <>
                      <span>Create Administrator Account</span>
                      <HiOutlineShieldCheck className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </form>
            )}

            {/* Quick Demo Pill */}
            {tab === "signin" && (
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
            )}
          </div>

          {/* Security Banner */}
          <div className="mt-4 text-center px-4">
            <p className="text-[11px] text-muted-foreground/80 leading-relaxed max-w-sm mx-auto">
              <HiOutlineLockClosed className="inline-block h-3.5 w-3.5 text-primary mr-1 align-[-2px]" />
              <strong className="text-foreground/90 font-semibold">Strict Auditing Enabled:</strong> All administrative sign-in attempts, registrations, and IP origins are cryptographically logged for statutory compliance.
            </p>
          </div>
        </div>
      </main>

      {/* FORGOT PASSWORD MODAL */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-card border border-border rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5">
            {/* Close button */}
            <button
              type="button"
              onClick={() => setShowForgotModal(false)}
              className="absolute top-5 right-5 p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <HiOutlineXMark className="h-5 w-5" />
            </button>

            {/* Header */}
            <div className="space-y-1.5 text-center pr-6">
              <div className="mx-auto w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
                <HiOutlineKey className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-foreground tracking-tight">
                Reset Administrator Password
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Provide your registered work email and the master platform passcode to set a new password.
              </p>
            </div>

            {/* Error in modal */}
            {forgotError && (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 flex items-start gap-2 text-destructive text-xs">
                <HiOutlineExclamationCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span className="leading-snug font-medium">{forgotError}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleForgotPassword} className="space-y-3.5">
              {/* Working Email */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground block uppercase tracking-wider">
                  Working Email ID
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground pointer-events-none">
                    <HiOutlineEnvelope className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="Enter registered work email"
                    required
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-muted/30 focus:bg-card text-foreground text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Master Passcode */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground block uppercase tracking-wider">
                  Master Platform Passcode
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground pointer-events-none">
                    <HiOutlineKey className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    value={forgotPasscode}
                    onChange={(e) => setForgotPasscode(e.target.value)}
                    placeholder="Enter platform passcode"
                    required
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-muted/30 focus:bg-card text-foreground text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all tracking-wider"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground block uppercase tracking-wider">
                  New Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground pointer-events-none">
                    <HiOutlineLockClosed className="h-4 w-4" />
                  </span>
                  <input
                    type={showForgotNewPassword ? "text" : "password"}
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    placeholder="Enter new password (min. 6 characters)"
                    required
                    className="w-full h-10 pl-9 pr-9 rounded-xl border border-border bg-muted/30 focus:bg-card text-foreground text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                    className="absolute right-3 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                  >
                    {showForgotNewPassword ? (
                      <HiOutlineEyeSlash className="h-4 w-4" />
                    ) : (
                      <HiOutlineEye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-foreground block uppercase tracking-wider">
                  Confirm New Password
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-muted-foreground pointer-events-none">
                    <HiOutlineCheckCircle className="h-4 w-4" />
                  </span>
                  <input
                    type="password"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    placeholder="Re-enter new password to confirm"
                    required
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-muted/30 focus:bg-card text-foreground text-xs font-medium outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex items-center gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForgotModal(false)}
                  className="flex-1 h-10 rounded-xl text-xs font-bold border-border"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={forgotLoading}
                  className="flex-1 h-10 rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary/95 flex items-center justify-center gap-1.5"
                >
                  {forgotLoading ? (
                    <>
                      <HiOutlineArrowPath className="h-3.5 w-3.5 animate-spin" />
                      <span>Updating...</span>
                    </>
                  ) : (
                    <span>Update Password</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-[11px] text-muted-foreground relative z-10">
        <p>© 2026 FALE Healthcare Infrastructure Inc. All rights reserved.</p>
      </footer>
    </div>
  );
}
