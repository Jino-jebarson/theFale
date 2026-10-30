import { useState, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import {
  HiOutlineQuestionMarkCircle,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineChatBubbleLeftRight,
  HiOutlineXMark,
  HiArrowRight,
  HiOutlineShieldCheck,
  HiOutlineClock,
} from "react-icons/hi2";
import { RiCustomerService2Fill } from "react-icons/ri";
import { cn } from "@/lib/utils";

interface ClinicalConciergeWidgetProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

function ConciergeContent({ onClose }: { onClose: () => void }) {
  return (
    <>
      {/* Mobile Grab Handle */}
      <div className="mx-auto -mt-1.5 mb-3.5 h-1.5 w-12 rounded-full bg-muted-foreground/30 sm:hidden" />

      {/* Header */}
      <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-border/60">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary shadow-2xs">
            <RiCustomerService2Fill className="h-5 w-5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">Clinical Concierge</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              24/7 Priority Clinician Helpline
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          title="Close Concierge"
        >
          <HiOutlineXMark className="h-5 w-5" />
        </button>
      </div>

      {/* Purpose note */}
      <div className="mt-3 rounded-2xl bg-muted/30 p-2.5 px-3 border border-border/50 text-[11px] text-muted-foreground leading-relaxed flex items-center gap-2">
        <HiOutlineShieldCheck className="h-4 w-4 text-primary shrink-0" />
        <span>
          Immediate help for <strong>DigiLocker KYC</strong>, <strong>24-hr shift payouts</strong>, or hospital verification.
        </span>
      </div>

      {/* Contact Options List */}
      <div className="mt-3.5 space-y-2.5">
        {/* 1-Tap Call */}
        <a
          href="tel:+917338367726"
          className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary-soft/40 p-3 hover:bg-primary-soft/70 transition-colors group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white shadow-2xs group-hover:scale-105 transition-transform">
              <HiOutlinePhone className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">+91 73383 67726</p>
              <p className="text-[10px] text-muted-foreground">Direct phone call · Available 24/7</p>
            </div>
          </div>
          <span className="rounded-xl bg-card border border-border/60 px-3 py-1.5 text-[11px] font-bold text-primary shrink-0 group-hover:border-primary/50 transition-colors shadow-2xs">
            Call Now
          </span>
        </a>

        {/* 1-Tap WhatsApp */}
        <a
          href="https://wa.me/917338367726?text=Hello%20FALE%20Clinical%20Concierge,%20I%20need%20assistance%20with%20my%20candidate%20profile."
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-3 hover:bg-muted/40 transition-colors group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-600 text-white shadow-2xs group-hover:scale-105 transition-transform">
              <HiOutlineChatBubbleLeftRight className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">WhatsApp Chat</p>
              <p className="text-[10px] text-muted-foreground">Instant messaging support</p>
            </div>
          </div>
          <span className="rounded-xl bg-muted/60 px-3 py-1.5 text-[11px] font-bold text-muted-foreground group-hover:text-foreground shrink-0 transition-colors">
            Open Chat
          </span>
        </a>

        {/* 1-Tap Email */}
        <a
          href="mailto:contact@thefale.com?subject=Clinician%20Concierge%20Support%20Request"
          className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card p-3 hover:bg-muted/40 transition-colors group active:scale-[0.99]"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-muted text-foreground group-hover:scale-105 transition-transform">
              <HiOutlineEnvelope className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold text-foreground truncate">contact@thefale.com</p>
              <p className="text-[10px] text-muted-foreground">Official support & escalations</p>
            </div>
          </div>
          <span className="rounded-xl bg-muted/60 px-3 py-1.5 text-[11px] font-bold text-muted-foreground group-hover:text-foreground shrink-0 transition-colors">
            Email Desk
          </span>
        </a>
      </div>

      {/* Help Center Link */}
      <div className="mt-4 pt-3.5 border-t border-border/60 flex items-center justify-between text-xs">
        <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
          <HiOutlineClock className="h-3.5 w-3.5 text-primary" />
          <span>Avg response &lt; 2 mins</span>
        </span>
        <Link
          to="/support"
          onClick={onClose}
          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline"
        >
          <span>Help Center & FAQs</span>
          <HiArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </>
  );
}

export function ClinicalConciergeWidget({
  isOpen: controlledIsOpen,
  onOpenChange,
  className,
}: ClinicalConciergeWidgetProps) {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const setIsOpen = (open: boolean) => {
    if (onOpenChange) {
      onOpenChange(open);
    } else {
      setInternalIsOpen(open);
    }
  };

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Support global open event
  useEffect(() => {
    const handleGlobalOpen = () => setIsOpen(true);
    window.addEventListener("fale-open-concierge", handleGlobalOpen);
    return () => window.removeEventListener("fale-open-concierge", handleGlobalOpen);
  }, []);

  return (
    <>
      {/* ========================================================================= */}
      {/* MOBILE BOTTOM DRAWER / SHEET                                              */}
      {/* ========================================================================= */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs sm:hidden z-50 animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Mobile Bottom Sheet Drawer */}
          <div
            role="dialog"
            aria-modal="true"
            aria-label="24/7 Clinical Concierge Support"
            className="fixed inset-x-0 bottom-0 z-50 w-full rounded-t-3xl rounded-b-none border-t border-border/80 bg-card p-5 pb-[calc(1.75rem+env(safe-area-inset-bottom,0px))] shadow-2xl max-h-[88vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 text-foreground sm:hidden"
          >
            <ConciergeContent onClose={() => setIsOpen(false)} />
          </div>
        </>
      )}

      {/* ========================================================================= */}
      {/* DESKTOP POPOVER & FLOATING TRIGGER PILL                                   */}
      {/* ========================================================================= */}
      <div
        className={cn(
          "fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 sm:z-50 flex flex-col items-end pointer-events-auto",
          className
        )}
      >
        {/* Desktop Popover */}
        {isOpen && (
          <div
            role="dialog"
            aria-label="24/7 Clinical Concierge Support"
            className="hidden sm:block relative z-50 mb-3 w-[380px] max-w-[420px] rounded-3xl border border-border/80 bg-card/95 backdrop-blur-xl p-5 shadow-2xl animate-in slide-in-from-bottom-3 zoom-in-95 duration-200 text-foreground"
          >
            <ConciergeContent onClose={() => setIsOpen(false)} />
          </div>
        )}

        {/* Trigger Floating Pill */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Toggle 24/7 Clinical Concierge"
          className={cn(
            "group flex items-center gap-2.5 rounded-full border border-border/80 bg-card/95 backdrop-blur-md px-3.5 py-2.5 shadow-lg hover:shadow-xl transition-all duration-200 cursor-pointer hover:border-primary/50 active:scale-95",
            isOpen ? "ring-2 ring-primary border-primary bg-primary-soft text-primary" : "text-foreground"
          )}
        >
          <div className="relative">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary-soft text-primary group-hover:bg-primary group-hover:text-white transition-colors">
              <HiOutlineQuestionMarkCircle className="h-4 w-4" />
            </span>
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
          </div>

          <div className="flex flex-col text-left leading-tight pr-1">
            <span className="text-[11px] font-extrabold tracking-tight">24/7 Concierge</span>
            <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
              Online · Fast Help
            </span>
          </div>
        </button>
      </div>
    </>
  );
}

export function triggerConcierge() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("fale-open-concierge"));
  }
}
