import { useState, useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import {
  HiOutlineShieldCheck,
  HiOutlineXMark,
  HiOutlineAdjustmentsHorizontal,
  HiCheck,
} from "react-icons/hi2";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

const STORAGE_KEY = "fale_cookie_consent";

export interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  personalization: boolean;
  updatedAt: string;
}

export function openCookieSettings() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("fale-open-cookie-settings"));
  }
}

export function CookieConsent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [hasConsented, setHasConsented] = useState<boolean>(true); // start true to prevent SSR/mount flash
  const [showBanner, setShowBanner] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  const [preferences, setPreferences] = useState<{
    analytics: boolean;
    personalization: boolean;
  }>({
    analytics: true,
    personalization: true,
  });

  useEffect(() => {
    // Check localStorage on client mount
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        setHasConsented(false);
        // Subtle delay for smooth entrance
        const timer = setTimeout(() => setShowBanner(true), 700);
        return () => clearTimeout(timer);
      } else {
        const parsed = JSON.parse(stored) as CookiePreferences;
        setPreferences({
          analytics: parsed.analytics ?? true,
          personalization: parsed.personalization ?? true,
        });
      }
    } catch {
      setHasConsented(false);
      setShowBanner(true);
    }
  }, []);

  useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettingsModal(true);
    };

    window.addEventListener("fale-open-cookie-settings", handleOpenSettings);
    return () => {
      window.removeEventListener("fale-open-cookie-settings", handleOpenSettings);
    };
  }, []);

  const saveConsent = (analytics: boolean, personalization: boolean, message?: string) => {
    const data: CookiePreferences = {
      necessary: true,
      analytics,
      personalization,
      updatedAt: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
    setHasConsented(true);
    setShowBanner(false);
    setShowSettingsModal(false);
    if (message) {
      toast.success(message);
    }
  };

  const handleAcceptAll = () => {
    setPreferences({ analytics: true, personalization: true });
    saveConsent(true, true, "All cookies accepted");
  };

  const handleNecessaryOnly = () => {
    setPreferences({ analytics: false, personalization: false });
    saveConsent(false, false, "Only necessary cookies saved");
  };

  const handleSaveCustom = () => {
    saveConsent(preferences.analytics, preferences.personalization, "Preferences saved successfully");
  };

  // Do not disturb candidate or facility onboarding
  if (pathname.startsWith("/onboarding")) {
    return null;
  }

  return (
    <>
      {/* Mobile Backdrop for drawer */}
      {!hasConsented && showBanner && !showSettingsModal && (
        <div
          className="fixed inset-0 bg-slate-950/20 backdrop-blur-[1px] z-40 sm:hidden animate-in fade-in duration-200"
          onClick={() => setShowBanner(false)}
        />
      )}

      {/* Cookie Banner: Bottom Drawer on Mobile, Floating Card on Desktop */}
      {!hasConsented && showBanner && !showSettingsModal && (
        <div
          role="region"
          aria-label="Cookie consent banner"
          className="fixed inset-x-0 bottom-0 z-50 sm:inset-x-auto sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-md animate-in slide-in-from-bottom duration-300 fade-in"
        >
          <div className="rounded-t-3xl rounded-b-none border-t border-x-0 border-b-0 sm:rounded-3xl sm:border border-border/80 bg-card/95 backdrop-blur-xl p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] sm:p-5 shadow-2xl shadow-slate-950/20 text-foreground transition-all">
            {/* Mobile Drag / Grab Handle */}
            <div className="mx-auto mb-3.5 h-1.5 w-11 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />

            <div className="flex items-start gap-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary border border-primary/20">
                <HiOutlineShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold tracking-tight text-foreground">
                    Cookie & Privacy Notice
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowBanner(false)}
                    className="p-1 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted/60 transition-colors cursor-pointer"
                    title="Dismiss"
                  >
                    <HiOutlineXMark className="h-4 w-4" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The Fale uses essential cookies to authenticate your account and securely verify regulatory credentials. Optional cookies help us personalize shifts and job recommendations.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 pt-3.5 border-t border-border/60 flex flex-row items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={() => setShowSettingsModal(true)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover hover:underline cursor-pointer"
              >
                <HiOutlineAdjustmentsHorizontal className="h-4 w-4" />
                Customize
              </button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleNecessaryOnly}
                  className="rounded-xl text-xs font-semibold h-9 sm:h-8 px-3 border-border/80 cursor-pointer"
                >
                  Essential only
                </Button>
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAcceptAll}
                  className="rounded-xl text-xs font-semibold h-9 sm:h-8 px-4 bg-primary text-white shadow-xs hover:bg-primary/95 cursor-pointer"
                >
                  Accept all
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comprehensive Cookie Preferences: Bottom Drawer on Mobile, Centered Modal on Desktop */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-t-3xl rounded-b-none border-t border-x-0 border-b-0 sm:rounded-3xl sm:border border-border/80 bg-card p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:p-7 shadow-2xl space-y-5 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200 text-foreground"
            role="dialog"
            aria-modal="true"
            aria-labelledby="cookie-settings-title"
          >
            {/* Mobile Sheet Grab Handle */}
            <div className="mx-auto -mt-1 mb-2 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700 sm:hidden" />

            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="absolute right-5 top-5 rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
              title="Close"
            >
              <HiOutlineXMark className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-start gap-3.5 pr-8">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary border border-primary/20">
                <HiOutlineShieldCheck className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h2 id="cookie-settings-title" className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                  Cookie & Privacy Preferences
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Customize the data and cookies stored on your device. Essential healthcare authentication cookies cannot be disabled.
                </p>
              </div>
            </div>

            {/* Cookie Categories */}
            <div className="space-y-3 pt-2">
              {/* Category 1: Strictly Necessary */}
              <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">
                    Strictly Necessary
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                    <HiCheck className="h-3 w-3 stroke-[2.5]" />
                    Always Active
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Required for logging in, DigiLocker verification sessions, council registration checks, and platform security.
                </p>
              </div>

              {/* Category 2: Analytics & Performance */}
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="analytics-toggle" className="text-sm font-bold text-foreground cursor-pointer select-none">
                    Analytics & Performance
                  </label>
                  <Switch
                    id="analytics-toggle"
                    checked={preferences.analytics}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({ ...prev, analytics: checked }))
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Collects anonymous usage data to help us monitor page load times, detect bugs, and understand hiring trends.
                </p>
              </div>

              {/* Category 3: Personalization & Job Recommendations */}
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="personalization-toggle" className="text-sm font-bold text-foreground cursor-pointer select-none">
                    Personalized Shift & Job Alerts
                  </label>
                  <Switch
                    id="personalization-toggle"
                    checked={preferences.personalization}
                    onCheckedChange={(checked) =>
                      setPreferences((prev) => ({ ...prev, personalization: checked }))
                    }
                  />
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Remembers your preferred hospital locations, clinical specialties, and salary filters for quick matching.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-border flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={handleNecessaryOnly}
                className="w-full sm:w-auto rounded-xl text-xs font-semibold h-9 px-4"
              >
                Reject optional
              </Button>

              <div className="flex w-full sm:w-auto items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSaveCustom}
                  className="w-1/2 sm:w-auto rounded-xl text-xs font-semibold h-9 px-4 border-primary/30 text-primary hover:bg-primary-soft hover:text-primary"
                >
                  Save preferences
                </Button>
                <Button
                  type="button"
                  onClick={handleAcceptAll}
                  className="w-1/2 sm:w-auto rounded-xl text-xs font-semibold h-9 px-4 bg-primary text-white hover:bg-primary/95 shadow-xs"
                >
                  Accept all
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
