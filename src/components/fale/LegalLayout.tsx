import { useState, useEffect, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  HiOutlineArrowLeft,
  HiOutlineEnvelope,
  HiOutlinePhone,
} from "react-icons/hi2";
import { ThemeToggle } from "./ThemeToggle";
import { openCookieSettings } from "./CookieConsent";
import { cn } from "@/lib/utils";

export interface LegalSectionItem {
  id: string;
  title: string;
}

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  lastUpdated: string;
  effectiveDate: string;
  activeDoc: "privacy" | "terms";
  sections: LegalSectionItem[];
  children: ReactNode;
}

export function LegalLayout({
  title,
  subtitle,
  lastUpdated,
  effectiveDate,
  activeDoc,
  sections,
  children,
}: LegalLayoutProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0]?.id || "");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140;
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el && el.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [sections]);

  const scrollTo = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -80;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased selection:bg-primary/20">
      {/* Hero / Document Header Area */}
      <section className="border-b border-border/60 bg-gradient-to-b from-muted/30 to-background pt-8 pb-10 sm:pt-10 sm:pb-14">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <HiOutlineArrowLeft className="w-4 h-4" />
              <span>Back to The Fale</span>
            </Link>
            <ThemeToggle />
          </div>

          <div className="max-w-3xl">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
              {title}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground leading-relaxed mb-5">
              {subtitle}
            </p>
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-muted-foreground">
              <span>
                <strong>Effective:</strong> {effectiveDate}
              </span>
              <span className="text-border">·</span>
              <span>
                <strong>Last Updated:</strong> {lastUpdated}
              </span>
              <span className="text-border">·</span>
              <span>
                <strong>Jurisdiction:</strong> Republic of India
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Document Layout: Sidebar (desktop) + Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Sticky Table of Contents (Desktop) */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-24 space-y-4">
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-3 shadow-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                  Contents
                </span>
                <nav className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
                  {sections.map((item, idx) => {
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => scrollTo(item.id)}
                        className={cn(
                          "w-full text-left flex items-start gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer leading-snug",
                          isActive
                            ? "bg-primary/10 text-primary font-semibold"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        <span className="font-mono text-[11px] opacity-60 shrink-0">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="line-clamp-2">{item.title.replace(/^[0-9]+\.\s*/, "")}</span>
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Quick Contact Box */}
              <div className="rounded-2xl border border-border/70 bg-muted/20 p-4 space-y-2 text-xs">
                <span className="font-semibold text-foreground block">Legal & Compliance Inquiries</span>
                <p className="text-muted-foreground leading-relaxed">
                  Questions regarding this document may be directed to our Bengaluru legal desk:
                </p>
                <div className="pt-1 space-y-1.5">
                  <a
                    href="mailto:legal@thefale.com"
                    className="flex items-center gap-2 text-primary font-medium hover:underline"
                  >
                    <HiOutlineEnvelope className="w-3.5 h-3.5 shrink-0" />
                    <span>legal@thefale.com</span>
                  </a>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <HiOutlinePhone className="w-3.5 h-3.5 shrink-0" />
                    <span>+91 73383 67726</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Legal Content Column */}
          <main className="lg:col-span-8 min-w-0 max-w-3xl space-y-12 leading-relaxed">
            {children}
          </main>
        </div>
      </div>

      {/* Clean Legal Footer */}
      <footer className="border-t border-border/60 bg-muted/20 py-10 mt-16 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} The Fale Healthcare Technologies Pvt. Ltd. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <span className="text-border">·</span>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <span className="text-border">·</span>
            <button
              type="button"
              onClick={openCookieSettings}
              className="hover:text-foreground transition-colors cursor-pointer"
            >
              Cookie Preferences
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
