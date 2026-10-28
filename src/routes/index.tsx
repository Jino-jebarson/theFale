import { useState, useEffect, useMemo, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { HiArrowLeft } from "react-icons/hi2";
import { FaLinkedin } from "react-icons/fa6";
import { openCookieSettings } from "@/components/fale/CookieConsent";
import { setState, useApp } from "@/lib/store";
import heroHandsVideo from "@/assets/hero-hands.mp4";
import "@/styles/fale-signin.css";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sign in · The Fale" },
      {
        name: "description",
        content: "Sign in to The Fale as a healthcare professional or as a hospital that's hiring.",
      },
      { property: "og:title", content: "Sign in · The Fale" },
      {
        property: "og:description",
        content: "Sign in to The Fale as a healthcare professional or as a hospital that's hiring.",
      },
    ],
  }),
  component: SignInPage,
});

const WHATSAPP_NUMBER = "917338367726";

const ROLES: string[] = [
  "healthcare workforce.",
  "doctors.",
  "nurses.",
  "physiotherapists.",
  "lab technicians.",
  "radiographers.",
  "pharmacists.",
  "dialysis technicians.",
  "OT technicians.",
  "anaesthesia technicians.",
  "paramedics.",
  "cardiac care technicians.",
  "respiratory therapists.",
  "occupational therapists.",
  "speech therapists.",
  "optometrists.",
  "dietitians.",
  "phlebotomists.",
  "audiologists.",
  "dental hygienists.",
  "medical coders.",
];

function SignInPage() {
  const navigate = useNavigate();
  const s = useApp();

  // Mode: "pro" (candidate) vs "hire" (facility)
  const [mode, setMode] = useState<"pro" | "hire">(() => {
    return s.portal === "facility" ? "hire" : "pro";
  });

  // Views: "choices" | "phone" | "otp" | "email" | "done"
  const [view, setView] = useState<"choices" | "phone" | "otp" | "email" | "done">("choices");
  const [isSignUp, setIsSignUp] = useState(false);
  const [phone, setPhone] = useState("");
  const [phoneErr, setPhoneErr] = useState("");
  const [email, setEmail] = useState("");
  const [emailErr, setEmailErr] = useState("");
  const [otpValues, setOtpValues] = useState<string[]>(["", "", "", "", "", ""]);
  const [doneTitle, setDoneTitle] = useState("You're in.");
  const [doneText, setDoneText] = useState("Welcome to The Fale.");
  const [shakeField, setShakeField] = useState(false);

  const otpInputs = useRef<(HTMLInputElement | null)[]>([]);
  const cursorGlowRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Ensure background video plays reliably and scroll is unlocked
  useEffect(() => {
    document.body.removeAttribute("data-scroll-locked");
    document.body.style.removeProperty("overflow");
    document.documentElement.style.removeProperty("overflow");

    const v = videoRef.current;
    if (v) {
      v.muted = true;
      v.defaultMuted = true;
      const playPromise = v.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          const handleInteract = () => {
            v.play();
            window.removeEventListener("pointerdown", handleInteract);
            window.removeEventListener("touchstart", handleInteract);
          };
          window.addEventListener("pointerdown", handleInteract);
          window.addEventListener("touchstart", handleInteract);
        });
      }
    }
  }, []);

  // Rotating headline
  const [rotatorIdx, setRotatorIdx] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setRotatorIdx((prev) => (prev + 1) % ROLES.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  // Theme state
  const [isDark, setIsDark] = useState(() => {
    if (typeof document !== "undefined") {
      return (
        document.documentElement.classList.contains("dark") ||
        document.documentElement.getAttribute("data-theme") === "dark"
      );
    }
    return false;
  });

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("fale-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
      localStorage.setItem("fale-theme", "light");
    }
  };

  // Switch between Professional and Hiring
  const handleModeChange = (newMode: "pro" | "hire") => {
    setMode(newMode);
    setView("choices");
    setIsSignUp(false);
    setPhoneErr("");
    setEmailErr("");
  };

  // Complete sign in and redirect
  const completeSignIn = (userContact: string) => {
    const isHire = mode === "hire";
    const targetPortal = isHire ? "facility" : "candidate";

    setDoneTitle(isSignUp ? "Verified!" : "You're in.");
    setDoneText(
      isSignUp
        ? (isHire
          ? "Mobile verified. Redirecting to employer onboarding…"
          : "Mobile verified. Redirecting to candidate onboarding…")
        : (isHire
          ? "Welcome to The Fale. Let's find your next hire."
          : "Welcome to The Fale. Let's find your next opportunity.")
    );
    setView("done");

    if (isSignUp) {
      // Create Account flow -> Onboarding
      setState({
        signedIn: true,
        portal: targetPortal,
        contact: userContact,
        onboarded: false,
      });

      setTimeout(() => {
        navigate({
          to: "/onboarding",
          search: { role: isHire ? "employer" : "candidate" },
        });
      }, 1200);
    } else {
      // Login flow -> Directly to Home / Employer Dashboard
      setState({
        signedIn: true,
        portal: targetPortal,
        contact: userContact,
        onboarded: true,
      });

      setTimeout(() => {
        navigate({
          to: isHire ? "/employer" : "/home",
        });
      }, 1200);
    }
  };

  // Directly trigger dynamic mobile OTP registration flow for employer vs candidate
  const handleCreateAccount = () => {
    setIsSignUp(true);
    setPhone("");
    setPhoneErr("");
    setOtpValues(["", "", "", "", "", ""]);
    setView("phone");
  };

  // Phone flow
  const handleSendOtp = () => {
    const digits = phone.replace(/\D/g, "");
    if (!/^[6-9]\d{9}$/.test(digits)) {
      setPhoneErr("Enter a valid 10-digit Indian mobile number.");
      setShakeField(true);
      setTimeout(() => setShakeField(false), 400);
      return;
    }
    setPhoneErr("");
    setOtpValues(["", "", "", "", "", ""]);
    setView("otp");
    setTimeout(() => {
      otpInputs.current[0]?.focus();
    }, 60);
  };

  const handleOtpChange = (idx: number, val: string) => {
    const clean = val.replace(/\D/g, "").slice(-1);
    const updated = [...otpValues];
    updated[idx] = clean;
    setOtpValues(updated);

    if (clean && idx < 5) {
      otpInputs.current[idx + 1]?.focus();
    }

    if (updated.every((v) => v.length > 0)) {
      setTimeout(() => {
        const clean = phone.replace(/\D/g, "");
        completeSignIn(`+91 ${clean}`);
      }, 300);
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpValues[idx] && idx > 0) {
      otpInputs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasteData) return;
    const updated = [...otpValues];
    for (let i = 0; i < 6; i++) {
      updated[i] = pasteData[i] || "";
    }
    setOtpValues(updated);
    const lastIndex = Math.min(pasteData.length - 1, 5);
    otpInputs.current[lastIndex]?.focus();

    if (updated.every((v) => v.length > 0)) {
      setTimeout(() => {
        const clean = phone.replace(/\D/g, "");
        completeSignIn(`+91 ${clean}`);
      }, 300);
    }
  };

  // Email flow
  const handleSendEmailLink = () => {
    const v = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      setEmailErr("Enter a valid email address.");
      setShakeField(true);
      setTimeout(() => setShakeField(false), 400);
      return;
    }
    setEmailErr("");
    completeSignIn(v);
  };

  const isFreeEmailInHireMode = useMemo(() => {
    if (mode !== "hire") return false;
    const dom = (email.split("@")[1] || "").toLowerCase().trim();
    return ["gmail.com", "yahoo.com", "yahoo.co.in", "outlook.com", "hotmail.com"].includes(dom);
  }, [mode, email]);

  // Social sign in
  const handleSocial = (provider: string) => {
    completeSignIn(`${provider.toLowerCase()}@user`);
  };

  return (
    <div className="fale-signin-root">
      {/* Background Hands Video */}
      <div className="bg-video" aria-hidden="true">
        <video
          ref={videoRef}
          id="bgVideo"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        >
          <source src={heroHandsVideo} type="video/mp4" />
          <source src="/videos/hero-hands.mp4" type="video/mp4" />
        </video>
      </div>

      <div className="bg-overlay"></div>
      <div className="aurora" aria-hidden="true">
        <span className="a1"></span>
        <span className="a2"></span>
      </div>


      <button
        className={`theme-btn ${isDark ? "is-dark" : ""}`}
        type="button"
        onClick={toggleTheme}
        aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      >
        <span className="knob"></span>
        <span className="opt sun" aria-hidden="true">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
          </svg>
        </span>
        <span className="opt moon" aria-hidden="true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
          </svg>
        </span>
      </button>

      {/* Corner Badges */}
      <div className="corner bl" aria-hidden="true">
        <span className="tick"></span>
        <br />Skills<br />validated<br />careers<br />enabled
      </div>
      <div className="corner br" aria-hidden="true">
        <span className="tick"></span>
        <br />From<br />aspiration<br />to<br />opportunity
      </div>

      {/* Main Centered Sign-In Panel */}
      <main className="panel" id="panel">
        <Link to="/landing" className="logo" aria-label="The Fale home">
          <span className="logo-mark" aria-hidden="true">
            <span>f</span>
          </span>
          <span className="logo-word" aria-hidden="true">
            <span className="the">the</span>
            <span className="fale">fale</span>
          </span>
        </Link>

        {/* Role Toggle Switch */}
        <div>
          <div className={`mode ${mode === "hire" ? "hire" : ""}`} role="tablist" aria-label="Sign in as">
            <span className="knob" aria-hidden="true"></span>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "pro"}
              onClick={() => handleModeChange("pro")}
            >
              I'm a professional
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === "hire"}
              onClick={() => handleModeChange("hire")}
            >
              I'm hiring
            </button>
          </div>
        </div>

        {/* Rotating Headline */}
        <h1 className="headline">
          <span className="h-line">{mode === "hire" ? "Hire India's" : "India's"}</span>
          <span className="role-line">
            <span className="rotator">
              <span className="word in" key={`${mode}-${rotatorIdx}`}>
                {ROLES[rotatorIdx]}
              </span>
            </span>
          </span>
          <em>Verified.</em>
        </h1>

        <p className="tagline">
          {mode === "hire"
            ? "Verified shortlists. Pay only when you hire."
            : "The hands behind care."}
        </p>

        {/* Auth Flow Container */}
        <div className="auth" role="tabpanel">
          {/* Default Choices */}
          {view === "choices" && (
            <div className="flow">
              {mode === "pro" ? (
                <>
                  <button
                    type="button"
                    className="s-btn primary"
                    onClick={() => setView("phone")}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="2" width="12" height="20" rx="3" />
                      <path d="M11 18h2" />
                    </svg>
                    <span>Continue with phone number</span>
                    <span className="tag">Fastest</span>
                  </button>

                  <button
                    type="button"
                    className="s-btn"
                    onClick={() => setView("email")}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 7l-10 7L2 7" />
                    </svg>
                    <span>Continue with email</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="s-btn primary"
                    onClick={() => setView("email")}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                      <rect x="2" y="4" width="20" height="16" rx="2" />
                      <path d="M22 7l-10 7L2 7" />
                    </svg>
                    <span>Continue with work email</span>
                    <span className="tag">Recommended</span>
                  </button>

                  <button
                    type="button"
                    className="s-btn"
                    onClick={() => setView("phone")}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="6" y="2" width="12" height="20" rx="3" />
                      <path d="M11 18h2" />
                    </svg>
                    <span>Continue with phone number</span>
                  </button>
                </>
              )}

              <div className="or">or</div>

              <button
                type="button"
                className="s-btn"
                onClick={() => handleSocial("Google")}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38z" />
                </svg>
                <span>Continue with Google</span>
              </button>

              <button
                type="button"
                className="s-btn"
                onClick={() => handleSocial("LinkedIn")}
              >
                <FaLinkedin className="h-[18px] w-[18px] text-[#0A66C2] shrink-0" />
                <span>Continue with LinkedIn</span>
              </button>

              {mode === "pro" && (
                <button
                  type="button"
                  className="s-btn"
                  onClick={() => handleSocial("Apple")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 1.5c-.9 0-2.2.6-3 1.5-.7.8-1.3 2-1.1 3.2 1 .1 2.1-.5 2.8-1.3.7-.8 1.2-2 1.3-3.4zm3.3 11c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.9-1.5-.1-2.8.8-3.5.8s-1.9-.8-3.1-.8c-1.6 0-3 .9-3.9 2.4-1.6 2.9-.4 7.1 1.2 9.5.8 1.1 1.7 2.4 2.9 2.3 1.2-.1 1.6-.8 3-.8s1.8.8 3.1.7c1.3 0 2.1-1.1 2.9-2.3.9-1.3 1.3-2.6 1.3-2.6s-2.5-1-2.5-3.5z" />
                  </svg>
                  Continue with Apple
                </button>
              )}
            </div>
          )}

          {/* Phone Input View */}
          {view === "phone" && (
            <div className="flow">
              {isSignUp && (
                <div style={{ textAlign: "center", marginBottom: "8px" }}>
                  <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text)", margin: "0 0 3px" }}>
                    {mode === "hire" ? "Employer Account Registration" : "Candidate Registration"}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--muted)", margin: 0 }}>
                    {mode === "hire"
                      ? "Enter your mobile number to verify and begin facility onboarding"
                      : "Enter your mobile number to verify and begin profile onboarding"}
                  </p>
                </div>
              )}
              <label className={`input-row ${shakeField ? "shake" : ""}`}>
                <span className="pre">🇮🇳 +91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={11}
                  placeholder="98765 43210"
                  value={phone}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setPhone(raw.length > 5 ? `${raw.slice(0, 5)} ${raw.slice(5)}` : raw);
                    setPhoneErr("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendOtp()}
                  autoFocus
                />
              </label>
              {phoneErr && <div className="err">{phoneErr}</div>}
              <button
                type="button"
                className="s-btn primary"
                onClick={handleSendOtp}
              >
                {isSignUp ? "Send Verification OTP" : "Send OTP"}
              </button>
            </div>
          )}

          {/* OTP Verification View */}
          {view === "otp" && (
            <div className="flow" style={{ alignItems: "center" }}>
              <p className="note">
                {isSignUp ? "Verify your number to start onboarding: " : "Enter the 6-digit code sent to "}
                <strong>+91 {phone}</strong>
              </p>
              <div className="otp-row" onPaste={handleOtpPaste}>
                {otpValues.map((v, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      otpInputs.current[i] = el;
                    }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={v}
                    className={v ? "filled" : ""}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                  />
                ))}
              </div>
              <p className="note">
                Didn't get it?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setOtpValues(["", "", "", "", "", ""]);
                    otpInputs.current[0]?.focus();
                  }}
                >
                  Resend code
                </button>
              </p>
            </div>
          )}

          {/* Email View */}
          {view === "email" && (
            <div className="flow">
              <label className={`input-row ${shakeField ? "shake" : ""}`}>
                <span className="ic" aria-hidden="true">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 7L2 7" />
                  </svg>
                </span>
                <input
                  type="email"
                  placeholder={mode === "hire" ? "you@yourhospital.com" : "you@email.com"}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailErr("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSendEmailLink()}
                  autoFocus
                />
              </label>
              {emailErr && <div className="err">{emailErr}</div>}
              {isFreeEmailInHireMode && (
                <div className="hint">
                  Tip: Use your hospital or clinic email so we can verify your organization faster.
                </div>
              )}
              <button
                type="button"
                className="s-btn primary"
                onClick={handleSendEmailLink}
              >
                Send sign-in link
              </button>
            </div>
          )}

          {/* Done / Success State */}
          {view === "done" && (
            <div className="done">
              <div className="check">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2>{doneTitle}</h2>
              <p>{doneText}</p>
            </div>
          )}

          {/* Back button */}
          {view !== "choices" && view !== "done" && (
            <button
              type="button"
              className="back-btn group inline-flex items-center justify-center gap-1.5 cursor-pointer"
              onClick={() => {
                setView("choices");
                setIsSignUp(false);
              }}
            >
              <HiArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
              <span>{isSignUp ? "Back to options" : "Other ways to sign in"}</span>
            </button>
          )}
        </div>

        {/* Footer Notes */}
        <p className="foot-line">
          {mode === "hire" ? (
            <>
              New employer?{" "}
              <button type="button" onClick={handleCreateAccount}>
                Create an account
              </button>{" "}
              — start hiring verified talent.{" "}
              <span style={{ opacity: 0.5, margin: "0 6px" }}>·</span>{" "}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi The Fale, we're hiring and would like to get started.")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Talk on WhatsApp
              </a>
            </>
          ) : (
            <>
              New here?{" "}
              <button type="button" onClick={handleCreateAccount}>
                Create an account
              </button>{" "}
              — free for healthcare professionals.
            </>
          )}
        </p>

        <p className="legal">
          By continuing, you agree to The Fale's <Link to="/landing">Terms</Link> and{" "}
          <Link to="/landing">Privacy Policy</Link> ·{" "}
          <button
            type="button"
            onClick={openCookieSettings}
            className="cursor-pointer bg-transparent border-0 p-0 text-inherit font-inherit underline hover:text-[var(--text)] transition-colors"
          >
            Cookie Preferences
          </button>
        </p>
      </main>
    </div>
  );
}
