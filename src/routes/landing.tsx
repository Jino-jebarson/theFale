import { useState, useEffect, useMemo, useRef } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { setState, useApp } from "@/lib/store";
import { jobs as allJobs } from "@/lib/data";
import heroHandsVideo from "@/assets/hero-hands.mp4";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FooterParticleLogo } from "@/components/FooterParticleLogo";
import "@/styles/fale-landing.css";

export const Route = createFileRoute("/landing")({
  head: () => ({
    meta: [
      { title: "The Fale — India's Healthcare Workforce. Verified." },
      {
        name: "description",
        content:
          "The Fale connects hospitals with verified healthcare professionals in Bengaluru. Free for professionals. Hospitals pay only when they hire.",
      },
      { property: "og:title", content: "The Fale — India's Healthcare Workforce. Verified." },
      {
        property: "og:description",
        content:
          "Verified doctors, nurses and allied health professionals matched with hospitals in Bengaluru.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LandingPage,
});

const WHATSAPP_NUMBER = "917338367726";

const ROLES: [string, string][] = [
  ["Doctor", "doctors."],
  ["Nurse", "nurses."],
  ["Physiotherapist", "physiotherapists."],
  ["Lab Technician", "lab technicians."],
  ["Radiographer", "radiographers."],
  ["Pharmacist", "pharmacists."],
  ["Dialysis Technician", "dialysis technicians."],
  ["OT Technician", "OT technicians."],
  ["Anaesthesia Technician", "anaesthesia technicians."],
  ["Paramedic", "paramedics."],
  ["Cardiac Care Technician", "cardiac care technicians."],
  ["Respiratory Therapist", "respiratory therapists."],
  ["Occupational Therapist", "occupational therapists."],
  ["Speech Therapist", "speech therapists."],
  ["Optometrist", "optometrists."],
  ["Dietitian", "dietitians."],
  ["Phlebotomist", "phlebotomists."],
  ["Audiologist", "audiologists."],
  ["Dental Hygienist", "dental hygienists."],
  ["Medical Coder", "medical coders."],
];

function RollLink({
  href,
  label,
  onClick,
  isExternal = false,
  showArrow = false,
}: {
  href?: string;
  label: string;
  onClick?: (e: React.MouseEvent<any>) => void;
  isExternal?: boolean;
  showArrow?: boolean;
}) {
  const inner = (
    <>
      <span className="uc-roll-wrap">
        <span className="uc-roll-top">{label}</span>
        <span className="uc-roll-bottom" aria-hidden="true">
          {label}
        </span>
      </span>
      {showArrow && (
        <span className="uc-roll-arrow" aria-hidden="true">
          <svg
            className="arrow-top"
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="2.5" y1="9.5" x2="9.5" y2="2.5" />
            <polyline points="4.5 2.5 9.5 2.5 9.5 7.5" />
          </svg>
          <svg
            className="arrow-bot"
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="2.5" y1="9.5" x2="9.5" y2="2.5" />
            <polyline points="4.5 2.5 9.5 2.5 9.5 7.5" />
          </svg>
        </span>
      )}
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="uc-roll-link"
        onClick={onClick}
        {...(isExternal ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {inner}
      </a>
    );
  }

  return (
    <button type="button" className="uc-roll-link" onClick={onClick}>
      {inner}
    </button>
  );
}

function LandingPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"work" | "hire">("work");
  const [howStep, setHowStep] = useState<"pro" | "hosp">("pro");
  const [menuOpen, setMenuOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Search Filter State
  const [role, setRole] = useState("any");
  const [location, setLocation] = useState("Bengaluru");
  const [experience, setExperience] = useState("any");
  const [hasSearched, setHasSearched] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Rotating Headline
  const [rotatorIndex, setRotatorIndex] = useState(0);
  const rotatorWords = useMemo(
    () => ["healthcare workforce.", ...ROLES.map((r) => r[1])],
    []
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setRotatorIndex((prev) => (prev + 1) % rotatorWords.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [rotatorWords.length]);

  // Dark mode toggle
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

  // Auth routing helper
  const goToAuth = (portal: "candidate" | "facility") => {
    setState({ portal });
    navigate({ to: "/" });
  };

  // Search handler
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setHasSearched(true);
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  // Filtered jobs from mock dataset
  const searchResults = useMemo(() => {
    if (!hasSearched) return [];
    return allJobs.filter((j) => {
      const matchRole =
        role === "any" ||
        j.title.toLowerCase().includes(role.toLowerCase()) ||
        (j.dept && j.dept.toLowerCase().includes(role.toLowerCase()));
      const matchLoc =
        location === "any" ||
        j.city.toLowerCase() === location.toLowerCase();
      return matchRole && matchLoc;
    });
  }, [hasSearched, role, location]);

  const copyToClipboard = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 1800);
    }
  };

  const getAlertWhatsAppUrl = () => {
    const who = role === "any" ? "a healthcare professional" : `a ${role}`;
    const where = location === "any" ? "anywhere" : `in ${location}`;
    const expText = experience === "any" ? "" : ` (${experience} yrs exp)`;
    const msg = `Hi The Fale, I'm ${who} looking for jobs ${where}${expText}. Please send me job alerts.`;
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  // Smooth scroll to target section with sticky header offset
  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setMenuOpen(false);
    const target = document.getElementById(id);
    if (target) {
      const navHeight = 74;
      const topPos = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
      window.scrollTo({
        top: Math.max(0, topPos),
        behavior: "smooth",
      });
      window.history.pushState(null, "", `#${id}`);
    }
  };

  // Auto-scroll on initial load if hash is present
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.hash) {
      const hashId = window.location.hash.replace("#", "");
      const timer = setTimeout(() => {
        const el = document.getElementById(hashId);
        if (el) {
          const navHeight = 74;
          const topPos = el.getBoundingClientRect().top + window.pageYOffset - navHeight;
          window.scrollTo({ top: Math.max(0, topPos), behavior: "smooth" });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, []);

  // Prevent background scroll and support Escape key when mobile menu modal is open
  useEffect(() => {
    if (menuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          setMenuOpen(false);
        }
      };
      window.addEventListener("keydown", handleKeyDown);
      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [menuOpen]);

  return (
    <div className="fale-landing min-h-screen">
      {/* ═══ STICKY GLASS NAV ═══ */}
      <header className="nav" id="nav">
        <div className="wrap nav-inner">
          <a className="logo" href="#top" onClick={(e) => scrollToSection(e, "top")} aria-label="The Fale, back to top">
            <span className="logo-mark" aria-hidden="true">
              <span>f</span>
            </span>
            <span className="logo-word" aria-hidden="true">
              <span className="the">the</span>
              <span className="fale">fale</span>
            </span>
          </a>

          <ul className="nav-links">
            <li><a href="#how" onClick={(e) => scrollToSection(e, "how")}>How it works</a></li>
            <li><a href="#hospitals" onClick={(e) => scrollToSection(e, "hospitals")}>For hospitals</a></li>
            <li><a href="#about" onClick={(e) => scrollToSection(e, "about")}>About</a></li>
            <li><a href="#faq" onClick={(e) => scrollToSection(e, "faq")}>FAQ</a></li>
            <li><a href="#contact" onClick={(e) => scrollToSection(e, "contact")}>Contact</a></li>
          </ul>

          <div className="nav-actions">
            <button
              className={`theme-btn ${isDark ? "is-dark" : ""}`}
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
            >
              <span className="knob"></span>
              <span className="opt sun" aria-hidden="true">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round">
                  <circle cx="12" cy="12" r="4.5" />
                  <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
                </svg>
              </span>
              <span className="opt moon" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
                </svg>
              </span>
            </button>

            <button
              className="fl-btn fl-btn-ghost hide-sm"
              type="button"
              onClick={() => goToAuth("candidate")}
            >
              Sign in
            </button>
            <button
              className="fl-btn fl-btn-primary hide-sm"
              type="button"
              onClick={() => goToAuth("facility")}
            >
              I'm hiring
            </button>

            <button
              className={`menu-btn ${menuOpen ? "is-open" : ""}`}
              type="button"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              <span className="line line-1" aria-hidden="true" />
              <span className="line line-2" aria-hidden="true" />
            </button>
          </div>
        </div>
      </header>

      {/* ═══ MOBILE NAV MODAL (Smooth Right-side Drawer) ═══ */}
      <div
        className={`menu-modal ${menuOpen ? "is-open" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
            <div
              className="menu-backdrop"
              onClick={() => setMenuOpen(false)}
              aria-hidden="true"
            />
            <div className="menu-card">
              <div className="menu-header">
                <a
                  className="logo"
                  href="#top"
                  onClick={(e) => scrollToSection(e, "top")}
                  aria-label="The Fale"
                >
                  <span className="logo-mark" aria-hidden="true">
                    <span>f</span>
                  </span>
                  <span className="logo-word" aria-hidden="true">
                    <span className="the">the</span>
                    <span className="fale">fale</span>
                  </span>
                </a>
                <button
                  className="menu-close-btn"
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              <nav className="menu-nav">
                <ul>
                  <li>
                    <a href="#how" onClick={(e) => scrollToSection(e, "how")}>
                      <span>How it works</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a href="#hospitals" onClick={(e) => scrollToSection(e, "hospitals")}>
                      <span>For hospitals</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a href="#about" onClick={(e) => scrollToSection(e, "about")}>
                      <span>About</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a href="#faq" onClick={(e) => scrollToSection(e, "faq")}>
                      <span>FAQ</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </a>
                  </li>
                  <li>
                    <a href="#contact" onClick={(e) => scrollToSection(e, "contact")}>
                      <span>Contact</span>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </a>
                  </li>
                </ul>
              </nav>

              <div className="menu-footer">
                <button
                  className="fl-btn fl-btn-ghost"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    goToAuth("candidate");
                  }}
                >
                  Sign in
                </button>
                <button
                  className="fl-btn fl-btn-primary"
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    goToAuth("facility");
                  }}
                >
                  I'm hiring
                </button>
              </div>
            </div>
          </div>

      <main>
        {/* ═══ HERO ═══ */}
        <section className="hero" id="top">
          <div className="hero-media" aria-hidden="true">
            <video
              id="heroVideo"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
            >
              <source src={heroHandsVideo} type="video/mp4" />
              <source src="/videos/hero-hands.mp4" type="video/mp4" />
            </video>
            <div className="hero-wash"></div>
          </div>
          <div className="wrap hero-inner">
            <p className="eyebrow">
              <span className="pulse"></span>Healthcare hiring · Bengaluru
            </p>
            <h1 className="headline">
              <span className="line-1">
                <span className="h-line">India's</span>
                <span className="role-line">
                  <span className="rotator">
                    <span className="word in" key={rotatorIndex}>
                      {rotatorWords[rotatorIndex]}
                    </span>
                  </span>
                </span>
              </span>
              <em>Verified.</em>
            </h1>
            <p className="lede">
              Verified doctors, nurses and allied health professionals, matched with the hospitals that need them. Free for professionals. Hospitals pay only when they hire.
            </p>

            {/* DUAL ROLE FINDER CARD */}
            <div className="finder">
              <div className={`tabs ${activeTab === "hire" ? "second" : ""}`}>
                <span className="tab-knob"></span>
                <button
                  className="tab"
                  type="button"
                  aria-selected={activeTab === "work"}
                  onClick={() => setActiveTab("work")}
                >
                  Find work
                </button>
                <button
                  className="tab"
                  type="button"
                  aria-selected={activeTab === "hire"}
                  onClick={() => setActiveTab("hire")}
                >
                  Hire staff
                </button>
              </div>

              {activeTab === "work" ? (
                <form className="search-form" onSubmit={handleSearch}>
                  <div className="field">
                    <label>Role</label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger className="field-trigger" aria-label="Select role">
                        <SelectValue placeholder="Any role" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        <SelectItem value="any">Any role</SelectItem>
                        {ROLES.map(([r]) => (
                          <SelectItem key={r} value={r}>
                            {r}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="field">
                    <label>Location</label>
                    <Select value={location} onValueChange={setLocation}>
                      <SelectTrigger className="field-trigger" aria-label="Select location">
                        <SelectValue placeholder="Any location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any location</SelectItem>
                        <SelectItem value="Bengaluru">Bengaluru</SelectItem>
                        <SelectItem value="Chennai">Chennai</SelectItem>
                        <SelectItem value="Mumbai">Mumbai</SelectItem>
                        <SelectItem value="Mysuru">Mysuru</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="field">
                    <label>Experience</label>
                    <Select value={experience} onValueChange={setExperience}>
                      <SelectTrigger className="field-trigger" aria-label="Select experience">
                        <SelectValue placeholder="Any level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any level</SelectItem>
                        <SelectItem value="0-1">Fresher (0–1 yr)</SelectItem>
                        <SelectItem value="1-3">1–3 years</SelectItem>
                        <SelectItem value="3-5">3–5 years</SelectItem>
                        <SelectItem value="5-99">5+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <button className="fl-btn fl-btn-primary" type="submit">
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
                      <circle cx="11" cy="11" r="7" />
                      <path d="M21 21l-4.3-4.3" />
                    </svg>
                    Search jobs
                  </button>
                </form>
              ) : (
                <div className="hire-panel">
                  <p>
                    <strong>Tell us the role you need.</strong> We send a shortlist of screened, verified professionals. You pay only when someone joins.
                  </p>
                  <div className="row">
                    <button
                      className="fl-btn fl-btn-primary"
                      type="button"
                      onClick={() => goToAuth("facility")}
                    >
                      Post a requirement
                    </button>
                    <a
                      className="fl-btn fl-btn-ghost"
                      href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi The Fale, we're hiring and would like to know more.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WhatsApp us
                    </a>
                  </div>
                </div>
              )}
            </div>

            <ul className="trust">
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Free for professionals
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Credentials checked
              </li>
              <li>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
                Hospitals pay only when they hire
              </li>
            </ul>
          </div>
        </section>

        {/* ═══ LIVE SEARCH RESULTS SECTION ═══ */}
        {hasSearched && (
          <section className="results" ref={resultsRef} aria-live="polite">
            <div className="wrap">
              <div className="results-head">
                <div>
                  <p className="label">Search results</p>
                  <h2>
                    {role === "any" ? "All healthcare" : role} jobs {location === "any" ? "across India" : `in ${location}`}
                  </h2>
                </div>
                <button
                  className="link-btn"
                  type="button"
                  onClick={() => setHasSearched(false)}
                >
                  Clear search
                </button>
              </div>

              {searchResults.length > 0 ? (
                <div className="job-list">
                  {searchResults.map((j) => (
                    <article className="job" key={j.id}>
                      <div>
                        <h3>{j.title}</h3>
                        <p className="org">{j.org}</p>
                      </div>
                      <div className="meta">
                        <span>{j.city}</span>
                        <span>{j.type}</span>
                        <span>{j.exp}</span>
                        {j.dept && <span>{j.dept}</span>}
                      </div>
                      <div className="foot">
                        <span className="pay">{j.salary}</span>
                        <button
                          className="fl-btn fl-btn-primary"
                          type="button"
                          onClick={() => goToAuth("candidate")}
                        >
                          Apply now
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty">
                  <div className="ico" aria-hidden="true">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
                    </svg>
                  </div>
                  <div>
                    <h3>No open {role === "any" ? "" : role} roles in {location} right now</h3>
                    <p>
                      We add new roles as hospitals share them. Get them on WhatsApp the day they open, or create your free profile so hospitals can find you.
                    </p>
                    <div className="row">
                      <a
                        className="fl-btn fl-btn-primary"
                        href={getAlertWhatsAppUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35m-5.43 7.4h-.01a9.87 9.87 0 0 1-5.03-1.37l-.36-.22-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41" />
                        </svg>
                        Get alerts on WhatsApp
                      </a>
                      <button
                        className="fl-btn fl-btn-ghost"
                        type="button"
                        onClick={() => goToAuth("candidate")}
                      >
                        Create free profile
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══ ROLE STRIP MARQUEE ═══ */}
        <section className="strip" aria-label="Roles we cover">
          <div className="strip-track">
            <div className="strip-set">
              {ROLES.map(([name]) => (
                <span key={name}>{name}</span>
              ))}
            </div>
            <div className="strip-set" aria-hidden="true">
              {ROLES.map(([name]) => (
                <span key={`dup-${name}`}>{name}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ HOW IT WORKS ═══ */}
        <section className="sec" id="how">
          <div className="wrap">
            <div className="sec-head">
              <div>
                <p className="label">How it works</p>
                <h2>Three steps, whichever side <em>you're on.</em></h2>
              </div>
              <div className={`switch ${howStep === "hosp" ? "second" : ""}`}>
                <span className="knob" aria-hidden="true"></span>
                <button
                  type="button"
                  aria-selected={howStep === "pro"}
                  onClick={() => setHowStep("pro")}
                >
                  Professionals
                </button>
                <button
                  type="button"
                  aria-selected={howStep === "hosp"}
                  onClick={() => setHowStep("hosp")}
                >
                  Hospitals
                </button>
              </div>
            </div>

            {howStep === "pro" ? (
              <ol className="steps">
                <li>
                  <span className="n">1</span>
                  <h3>Create your free profile</h3>
                  <p>Sign in with your phone number and add your qualification, experience and where you want to work. It takes about two minutes.</p>
                </li>
                <li>
                  <span className="n">2</span>
                  <h3>Get verified</h3>
                  <p>We check your qualification certificates and council registration, so hospitals can trust your profile from the first look.</p>
                </li>
                <li>
                  <span className="n">3</span>
                  <h3>Get matched and hired</h3>
                  <p>We message you on WhatsApp when a role fits your skills, salary and location. You choose which interviews to take.</p>
                </li>
              </ol>
            ) : (
              <ol className="steps">
                <li>
                  <span className="n">1</span>
                  <h3>Share what you need</h3>
                  <p>Tell us the role, how many openings, the salary range and how soon you need people. A call or WhatsApp message is enough.</p>
                </li>
                <li>
                  <span className="n">2</span>
                  <h3>Get a verified shortlist</h3>
                  <p>Within days we send a short list of screened, credential-checked professionals who match the role, not a pile of CVs.</p>
                </li>
                <li>
                  <span className="n">3</span>
                  <h3>Interview and hire</h3>
                  <p>You interview and choose. You pay a placement fee only when someone joins your team.</p>
                </li>
              </ol>
            )}
          </div>
        </section>

        {/* ═══ FOR HOSPITALS (DARK ESPRESSO BAND) ═══ */}
        <section className="sec hosp" id="hospitals">
          <div className="wrap hosp-grid">
            <div className="hosp-copy">
              <p className="label">For hospitals and clinics</p>
              <h2>
                Hire verified healthcare professionals. <em>Pay only when you hire.</em>
              </h2>
              <p>
                Hiring nurses, technicians and therapists takes weeks of screening calls. Tell us who you need and we do the checking, so you only meet people who fit.
              </p>
              <div className="row">
                <button
                  className="fl-btn fl-btn-primary"
                  type="button"
                  onClick={() => goToAuth("facility")}
                >
                  Post a requirement
                </button>
                <a
                  className="fl-btn fl-btn-band"
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi The Fale, we're hiring and would like to know more.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  WhatsApp us
                </a>
              </div>
            </div>

            <ul className="points">
              <li>
                <span className="ic" aria-hidden="true">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    <path d="M9 12l2 2 4-4" />
                  </svg>
                </span>
                <div>
                  <h3>Credentials checked first</h3>
                  <p>Every qualification and council registration is verified before you see a profile.</p>
                </div>
              </li>
              <li>
                <span className="ic" aria-hidden="true">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </span>
                <div>
                  <h3>A shortlist, not a CV pile</h3>
                  <p>Screened candidates who match the role, the salary and the shift you need.</p>
                </div>
              </li>
              <li>
                <span className="ic" aria-hidden="true">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="6" width="20" height="13" rx="2" />
                    <path d="M2 10h20M6 15h4" />
                  </svg>
                </span>
                <div>
                  <h3>No upfront fee</h3>
                  <p>You pay a placement fee only when a candidate joins. Nothing before that.</p>
                </div>
              </li>
              <li>
                <span className="ic" aria-hidden="true">
                  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </span>
                <div>
                  <h3>One person to talk to</h3>
                  <p>A named contact from our team handles your hiring from the first call to the joining date.</p>
                </div>
              </li>
            </ul>
          </div>
        </section>

        {/* ═══ PHILOSOPHY (ORANGE BAND) ═══ */}
        <section className="sec about" id="about">
          <div className="wrap about-grid">
            <div>
              <p className="label">Our philosophy</p>
              <h2 className="fale-word">
                FA.LE <em>Failures = Learnings.</em>
              </h2>
              <p className="big">The healthcare workforce India built but forgot.</p>
            </div>
            <div>
              <blockquote>
                “Every setback was preparation. <strong>Not the end.</strong>”
              </blockquote>
              <ul className="for-list">
                <li>For the physiotherapy graduate working part-time for ₹18,000 a month.</li>
                <li>For the lab technician doing 12-hour shifts with no insurance.</li>
                <li>For the radiographer told her degree wasn't enough.</li>
                <li>For the hospital that interviewed 30 people and still didn't find the right one.</li>
              </ul>
              <p className="closing">We're building the platform they've been waiting for.</p>
            </div>
          </div>
        </section>

        {/* ═══ FAQ ═══ */}
        <section className="sec" id="faq">
          <div className="wrap faq-grid">
            <div className="faq-side">
              <p className="label">FAQ</p>
              <div className="sec-head" style={{ marginBottom: 0 }}>
                <h2>Questions we <em>get asked.</em></h2>
              </div>
              <p>Can't find your answer? Message us on WhatsApp and a real person replies.</p>
              <a className="fl-btn fl-btn-ghost" href="#contact" onClick={(e) => scrollToSection(e, "contact")}>
                Contact us
              </a>
            </div>

            <div className="qs">
              <details open>
                <summary>
                  Is The Fale free for healthcare professionals?
                  <span className="pm" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="a">
                  Yes. Creating a profile, getting verified and being matched with jobs is completely free. Hospitals pay us only when they hire.
                </p>
              </details>

              <details>
                <summary>
                  How do you verify professionals?
                  <span className="pm" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="a">
                  We check each person's qualification certificates and their council registration where it applies, before we share their profile with any hospital.
                </p>
              </details>

              <details>
                <summary>
                  How do hospitals pay?
                  <span className="pm" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="a">
                  There is no upfront fee. You pay a placement fee only when a candidate joins, and we agree on the fee with you before we start.
                </p>
              </details>

              <details>
                <summary>
                  Which roles do you cover?
                  <span className="pm" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="a">
                  Doctors, nurses and allied health professionals, including physiotherapists, lab technicians, radiographers, pharmacists, dialysis and OT technicians, paramedics and therapists. If a role needs a healthcare qualification, we cover it.
                </p>
              </details>

              <details>
                <summary>
                  Which cities are you in?
                  <span className="pm" aria-hidden="true">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </summary>
                <p className="a">
                  We're starting in Bengaluru, with Mysuru and Chennai next. You can register from anywhere in India, and we'll notify you as roles open in your city.
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* ═══ CONTACT ═══ */}
        <section className="sec contact" id="contact">
          <div className="wrap contact-grid">
            <div className="contact-copy">
              <p className="label">Contact</p>
              <h2>Let's talk about <em>your next step.</em></h2>
              <p>Whether you're looking for your next role or building a team, message us. A real person from our Bengaluru team replies.</p>
              <a
                className="fl-btn fl-btn-primary"
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi The Fale")}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35m-5.43 7.4h-.01a9.87 9.87 0 0 1-5.03-1.37l-.36-.22-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41" />
                </svg>
                Message us on WhatsApp
              </a>
            </div>

            <ul className="contact-list">
              <li>
                <span className="ic" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="M22 7l-10 7L2 7" />
                  </svg>
                </span>
                <div>
                  <div className="k">Email</div>
                  <div className="v">contact@thefale.com</div>
                </div>
                <button
                  className={`copy-btn ${copiedKey === "email" ? "done" : ""}`}
                  type="button"
                  onClick={() => copyToClipboard("contact@thefale.com", "email")}
                >
                  {copiedKey === "email" ? "Copied" : "Copy"}
                </button>
              </li>

              <li>
                <span className="ic" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
                  </svg>
                </span>
                <div>
                  <div className="k">Phone &amp; WhatsApp</div>
                  <div className="v">+91 73383 67726</div>
                </div>
                <button
                  className={`copy-btn ${copiedKey === "phone" ? "done" : ""}`}
                  type="button"
                  onClick={() => copyToClipboard("+91 73383 67726", "phone")}
                >
                  {copiedKey === "phone" ? "Copied" : "Copy"}
                </button>
              </li>

              <li>
                <span className="ic" aria-hidden="true">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 22s8-6 8-13a8 8 0 1 0-16 0c0 7 8 13 8 13z" />
                    <circle cx="12" cy="9" r="3" />
                  </svg>
                </span>
                <div>
                  <div className="k">Office</div>
                  <div className="v">Bengaluru, Karnataka</div>
                </div>
              </li>
            </ul>
          </div>
        </section>
      </main>

      {/* ═══ UNITED CARRIERS STYLE ARCHITECTURAL FOOTER ═══ */}
      <footer className="uc-footer">
        <div className="wrap">
          {/* Header Statement + Socials */}
          <div className="uc-foot-header">
            <div className="uc-foot-statement">
              <a
                className="logo"
                href="#top"
                onClick={(e) => scrollToSection(e, "top")}
                aria-label="The Fale, back to top"
                style={{ marginBottom: "22px", display: "inline-flex" }}
              >
                <span className="logo-mark" aria-hidden="true">
                  <span>f</span>
                </span>
                <span className="logo-word" aria-hidden="true">
                  <span className="the">the</span>
                  <span className="fale">fale</span>
                </span>
              </a>
              <h2>
                India's healthcare workforce.{" "}
                <span className="uc-accent">Verified.</span>
              </h2>
              <p>
                Connecting premier hospitals, diagnostics, and specialty centres across
                India with credential-verified doctors, nurses, and allied healthcare professionals.
                One accountable platform, zero hiring guesswork.
              </p>
            </div>

            <div className="uc-foot-socials-wrap">
              <span className="uc-foot-label">Socials &amp; Connect</span>
              <div className="uc-foot-socials">
                <a
                  href="https://www.linkedin.com/company/thefale"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="uc-social-btn"
                  aria-label="The Fale on LinkedIn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi The Fale, I'm reaching out from your website.")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="uc-social-btn"
                  aria-label="The Fale on WhatsApp"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981z"/>
                  </svg>
                </a>
                <a
                  href="mailto:contact@thefale.com"
                  className="uc-social-btn"
                  aria-label="Email The Fale"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>

          <div className="uc-foot-line" />

          {/* 4-Column Grid: Company, Healthcare Roles, Hospital Solutions, Direct Contact */}
          <div className="uc-foot-grid">
            {/* Col 1: Company */}
            <div className="uc-foot-col">
              <span className="uc-foot-label">Company</span>
              <ul className="uc-foot-list">
                <li><RollLink href="#top" label="Home" onClick={(e) => scrollToSection(e, "top")} showArrow /></li>
                <li><RollLink href="#how" label="How it works" onClick={(e) => scrollToSection(e, "how")} showArrow /></li>
                <li><RollLink href="#hospitals" label="For hospitals" onClick={(e) => scrollToSection(e, "hospitals")} showArrow /></li>
                <li><RollLink href="#about" label="About us" onClick={(e) => scrollToSection(e, "about")} showArrow /></li>
                <li><RollLink href="#faq" label="FAQ" onClick={(e) => scrollToSection(e, "faq")} showArrow /></li>
                <li><RollLink href="#contact" label="Contact us" onClick={(e) => scrollToSection(e, "contact")} showArrow /></li>
                <li><RollLink label="Sign in (Candidate)" onClick={() => goToAuth("candidate")} showArrow /></li>
                <li><RollLink label="Employer Portal" onClick={() => goToAuth("facility")} showArrow /></li>
              </ul>
            </div>

            {/* Col 2: Healthcare Roles */}
            <div className="uc-foot-col">
              <span className="uc-foot-label">Healthcare Roles</span>
              <ul className="uc-foot-list">
                <li><RollLink href="#roles" label="Doctors &amp; Physicians" onClick={(e) => scrollToSection(e, "roles")} /></li>
                <li><RollLink href="#roles" label="Registered Nurses (GNM / BSc)" onClick={(e) => scrollToSection(e, "roles")} /></li>
                <li><RollLink href="#roles" label="Physiotherapists (BPT / MPT)" onClick={(e) => scrollToSection(e, "roles")} /></li>
                <li><RollLink href="#roles" label="Medical Lab Technicians (MLT)" onClick={(e) => scrollToSection(e, "roles")} /></li>
                <li><RollLink href="#roles" label="Radiographers &amp; Imaging Techs" onClick={(e) => scrollToSection(e, "roles")} /></li>
                <li><RollLink href="#roles" label="Hospital Pharmacists" onClick={(e) => scrollToSection(e, "roles")} /></li>
                <li><RollLink href="#roles" label="Dialysis Technicians" onClick={(e) => scrollToSection(e, "roles")} /></li>
                <li><RollLink href="#roles" label="OT &amp; Anaesthesia Techs" onClick={(e) => scrollToSection(e, "roles")} /></li>
                <li><RollLink href="#roles" label="Emergency Paramedics" onClick={(e) => scrollToSection(e, "roles")} /></li>
                <li><RollLink href="#roles" label="Cardiac Care Technicians" onClick={(e) => scrollToSection(e, "roles")} /></li>
              </ul>
            </div>

            {/* Col 3: Solutions for Hospitals */}
            <div className="uc-foot-col">
              <span className="uc-foot-label">Hospital Solutions</span>
              <ul className="uc-foot-list">
                <li><RollLink href="#hospitals" label="100% Pre-Verified Talent Pool" onClick={(e) => scrollToSection(e, "hospitals")} /></li>
                <li><RollLink href="#hospitals" label="Rapid Shift &amp; Locum Coverage" onClick={(e) => scrollToSection(e, "hospitals")} /></li>
                <li><RollLink href="#hospitals" label="Permanent Staffing Placement" onClick={(e) => scrollToSection(e, "hospitals")} /></li>
                <li><RollLink href="#hospitals" label="Automated Credential Verification" onClick={(e) => scrollToSection(e, "hospitals")} /></li>
                <li><RollLink href="#hospitals" label="NABH-Aligned Background Checks" onClick={(e) => scrollToSection(e, "hospitals")} /></li>
                <li><RollLink href="#hospitals" label="Dedicated Hospital Account Lead" onClick={(e) => scrollToSection(e, "hospitals")} /></li>
                <li><RollLink href="#hospitals" label="Zero Upfront Fees — Pay On Hire" onClick={(e) => scrollToSection(e, "hospitals")} /></li>
              </ul>
            </div>

            {/* Col 4: Head Office & Operating Regions */}
            <div className="uc-foot-col">
              <div className="uc-foot-office">
                <div className="uc-office-item">
                  <span className="uc-foot-label">Headquarters</span>
                  <div className="uc-office-val">
                    Bengaluru, Karnataka 560001, India.
                  </div>
                  <RollLink
                    href="https://maps.google.com/?q=Bengaluru+Karnataka+India"
                    label="Directions on Google Maps"
                    isExternal
                    showArrow
                  />
                </div>

                <div className="uc-office-item" style={{ marginTop: "6px" }}>
                  <span className="uc-foot-label">Operating Across</span>
                  <div className="uc-live-pill">
                    <span className="uc-live-dot" />
                    <span>Bengaluru · Karnataka · Pan-India</span>
                  </div>
                </div>

                <div className="uc-office-item" style={{ marginTop: "6px" }}>
                  <span className="uc-foot-label">Email Support</span>
                  <RollLink href="mailto:support@thefale.com" label="support@thefale.com" showArrow />
                </div>

                <div className="uc-office-item">
                  <span className="uc-foot-label">Direct WhatsApp</span>
                  <RollLink
                    href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi The Fale Support")}`}
                    label="+91 73383 67726"
                    isExternal
                    showArrow
                  />
                </div>

                <div className="uc-office-item">
                  <span className="uc-foot-label">Operating Hours</span>
                  <div className="uc-office-val" style={{ color: "var(--band-muted)", fontSize: "13.5px" }}>
                    Monday – Saturday / 8:30 AM – 8:00 PM IST
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Healthcare Trust & Security Bar (United Carriers style PCI strip) */}
          <div className="uc-foot-trust-strip">
            <div className="uc-trust-info">
              <span className="uc-foot-label" style={{ color: "var(--orange)" }}>
                Verified Healthcare Standard
              </span>
              <p style={{ margin: 0, fontSize: "13.5px", color: "var(--band-muted)", lineHeight: 1.5 }}>
                Every professional on The Fale is pre-authenticated against MCI / KMC and State Nursing
                Council registries. Powered by encrypted KYC, Aadhaar identity verification, and DPDP Act 2023 compliance.
              </p>
            </div>
            <div className="uc-trust-badges">
              <span className="uc-trust-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
                <span>Council Verified</span>
              </span>
              <span className="uc-trust-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <span>DPDP 2023 Compliant</span>
              </span>
              <span className="uc-trust-badge">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="m9 12 2 2 4-4"/>
                </svg>
                <span>NABH Aligned</span>
              </span>
            </div>
          </div>

          {/* Monumental Architectural Watermark (United Carriers interactive particle canvas) */}
          <FooterParticleLogo />

          <div className="uc-foot-line" style={{ marginBlock: "24px 28px" }} />

          {/* Legal & Meta Bottom Row */}
          <div className="uc-foot-bottom">
            <div>
              <span>© {new Date().getFullYear()} The Fale Technologies Pvt. Ltd. · All rights reserved.</span>
            </div>
            <div className="uc-foot-phil">
              <span>FA.LE = Failures = Learnings</span>
            </div>
            <ul className="uc-foot-legal-links">
              <li><a href="#about" onClick={(e) => scrollToSection(e, "about")} className="uc-hover-un">Privacy Policy</a></li>
              <li><a href="#about" onClick={(e) => scrollToSection(e, "about")} className="uc-hover-un">Terms &amp; Conditions</a></li>
              <li><a href="#about" onClick={(e) => scrollToSection(e, "about")} className="uc-hover-un">Verification Standards</a></li>
              <li><a href="#about" onClick={(e) => scrollToSection(e, "about")} className="uc-hover-un">Grievance Officer</a></li>
              <li><a href="#about" onClick={(e) => scrollToSection(e, "about")} className="uc-hover-un">Cookie Settings</a></li>
            </ul>
          </div>
        </div>
      </footer>

      {/* ═══ FLOATING WHATSAPP BUTTON ═══ */}
      <a
        className="fl-wa"
        href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hi The Fale")}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Message The Fale on WhatsApp"
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
          <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.47-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.88 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.29.18-1.41-.08-.13-.28-.2-.57-.35m-5.43 7.4h-.01a9.87 9.87 0 0 1-5.03-1.37l-.36-.22-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.83 9.83 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.3A11.8 11.8 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41" />
        </svg>
      </a>
    </div>
  );
}
