import { useState, useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  HiOutlineHome, HiHome, HiOutlineBriefcase, HiBriefcase, HiOutlineClock, HiClock,
  HiOutlineClipboardDocumentList, HiClipboardDocumentList, HiOutlineAcademicCap, HiAcademicCap,
  HiOutlineBell, HiOutlineMagnifyingGlass, HiMagnifyingGlass, HiOutlineSquares2X2, HiSquares2X2, HiOutlinePlusCircle,
  HiPlusCircle, HiOutlineUserGroup, HiUserGroup, HiOutlineArrowRightOnRectangle,
  HiOutlineSun, HiOutlineMoon, HiOutlineComputerDesktop, HiCheck, HiOutlineQuestionMarkCircle,
  HiOutlineIdentification, HiIdentification, HiOutlineBuildingOffice2, HiBuildingOffice2,
  HiOutlineDocumentCheck, HiDocumentCheck, HiOutlineShieldCheck, HiOutlineUser,
  HiOutlineBanknotes, HiBanknotes,
} from "react-icons/hi2";
import { RiBuilding4Line, RiStethoscopeLine, RiVerifiedBadgeFill } from "react-icons/ri";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useApp, setState, Portal } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";

const candidateNav = [
  { to: "/home", label: "Home", icon: HiOutlineHome, active: HiHome, badge: 0 },
  { to: "/jobs", label: "Jobs", icon: HiOutlineBriefcase, active: HiBriefcase, badge: 0 },
  { to: "/shifts", label: "Shifts", icon: HiOutlineClock, active: HiClock, badge: 0 },
  { to: "/earnings", label: "Earnings", icon: HiOutlineBanknotes, active: HiBanknotes, badge: 0 },
  { to: "/applications", label: "Applications", icon: HiOutlineClipboardDocumentList, active: HiClipboardDocumentList, badge: 0 },
  { to: "/learning", label: "Learning", icon: HiOutlineAcademicCap, active: HiAcademicCap, badge: 0 },
] as const;

const facilityNav = [
  { to: "/employer", label: "Dashboard", icon: HiOutlineSquares2X2, active: HiSquares2X2, badge: 0 },
  { to: "/employer/post", label: "Post a job", icon: HiOutlinePlusCircle, active: HiPlusCircle, badge: 0 },
  { to: "/employer/post-shift", label: "Post a shift", icon: HiOutlineClock, active: HiClock, badge: 0 },
  { to: "/employer/applicants", label: "Shortlisted", icon: HiOutlineUserGroup, active: HiUserGroup, badge: 0 },
  { to: "/employer/candidates", label: "Candidates", icon: HiOutlineMagnifyingGlass, active: HiMagnifyingGlass, badge: 0 },
  { to: "/employer/wallet", label: "Wallet & Escrow", icon: HiOutlineBanknotes, active: HiBanknotes, badge: 0 },
] as const;

export function initials(name?: string) {
  return (name || "FALE User").split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
}

function AccountMenuContent({
  name,
  portal,
  profile,
  theme,
  setTheme,
  switchPortal,
  onNavigate,
  onSignOut,
}: {
  name: string;
  portal: Portal;
  profile: Record<string, any>;
  theme: string;
  setTheme: (t: "light" | "dark" | "system") => void;
  switchPortal: (p: Portal) => void;
  onNavigate: (path: string) => void;
  onSignOut: () => void;
}) {
  return (
    <div className="w-full space-y-2">
      {/* Profile Card Header */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60">
        <div className="relative shrink-0">
          <span
            className={cn(
              "grid h-11 w-11 place-items-center rounded-2xl text-xs font-black shadow-xs",
              portal === "admin"
                ? "bg-amber-600 text-white"
                : portal === "facility"
                  ? "bg-primary text-white"
                  : "bg-gradient-brand text-white"
            )}
          >
            {portal === "admin" ? "AD" : initials(name)}
          </span>
          <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card bg-emerald-500 shadow-2xs" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-extrabold text-sm text-foreground truncate">{name}</span>
            {portal === "admin" ? (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-black uppercase text-amber-700 dark:text-amber-400">
                Master
              </span>
            ) : (
              <RiVerifiedBadgeFill className="h-4 w-4 text-primary shrink-0" />
            )}
          </div>
          <p className="text-[11px] font-medium text-muted-foreground truncate mt-0.5">
            {portal === "admin"
              ? "Clinical Verification Board"
              : portal === "facility"
                ? String(profile["org"] || "Your Organization")
                : String(profile["role"] || "Verified Clinician")}
          </p>
        </div>
      </div>

      {/* Quick Navigation Profile Link */}
      <div className="space-y-0.5">
        {portal === "facility" && (
          <button
            type="button"
            onClick={() => onNavigate("/employer/profile")}
            className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-xs font-bold cursor-pointer hover:bg-muted/60 transition-colors text-left"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
              <HiOutlineBuildingOffice2 className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">Hospital Profile & Verification</p>
              <p className="text-[10px] text-muted-foreground">Manage accreditation & campus info</p>
            </div>
          </button>
        )}

        {portal === "candidate" && (
          <button
            type="button"
            onClick={() => onNavigate("/profile")}
            className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-xs font-bold cursor-pointer hover:bg-muted/60 transition-colors text-left"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
              <HiOutlineUser className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">Doctor Profile & Verified CV</p>
              <p className="text-[10px] text-muted-foreground">Council registrations & DigiLocker KYC</p>
            </div>
          </button>
        )}

        {portal === "admin" && (
          <button
            type="button"
            onClick={() => onNavigate("/admin/candidates")}
            className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-xs font-bold cursor-pointer hover:bg-muted/60 transition-colors text-left"
          >
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
              <HiOutlineDocumentCheck className="h-4 w-4" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-foreground">Pending Document Approvals</p>
              <p className="text-[10px] text-muted-foreground">Review doctor KYC queue</p>
            </div>
          </button>
        )}

        <button
          type="button"
          onClick={() => onNavigate("/support")}
          className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-xs font-bold cursor-pointer hover:bg-muted/60 transition-colors text-left"
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-muted text-muted-foreground shrink-0">
            <HiOutlineQuestionMarkCircle className="h-4 w-4 text-primary" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-foreground">Help Center & Escrow Support</p>
            <p className="text-[10px] text-muted-foreground">24/7 hospital concierge & FAQ</p>
          </div>
        </button>
      </div>

      <div className="h-px bg-border/60 my-1" />

      {/* Portal Switcher Header */}
      <div className="px-2.5 py-1 flex items-center justify-between">
        <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
          Switch Active Portal
        </span>
        <span className="text-[9px] font-bold text-primary bg-primary-soft px-1.5 py-0.2 rounded-full">
          Multi-Role
        </span>
      </div>

      {/* Portal Items */}
      <div className="space-y-1">
        {/* Hospital / Facility */}
        <button
          type="button"
          onClick={() => switchPortal("facility")}
          className={cn(
            "w-full flex items-center gap-2.5 rounded-2xl p-2.5 text-xs cursor-pointer transition-all border text-left",
            portal === "facility"
              ? "bg-primary-soft/60 border-primary/30 text-foreground font-bold shadow-2xs"
              : "border-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground"
          )}
        >
          <span
            className={cn(
              "grid h-8 w-8 place-items-center rounded-xl shrink-0 transition-colors",
              portal === "facility" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
            )}
          >
            <RiBuilding4Line className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold">Hospital / Facility</span>
              {portal === "facility" && (
                <span className="text-[9px] font-extrabold text-primary uppercase tracking-wider">Active</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">Post openings & verify clinicians</p>
          </div>
          {portal === "facility" && <HiCheck className="h-4 w-4 text-primary shrink-0" />}
        </button>

        {/* Candidate Portal */}
        <button
          type="button"
          onClick={() => switchPortal("candidate")}
          className={cn(
            "w-full flex items-center gap-2.5 rounded-2xl p-2.5 text-xs cursor-pointer transition-all border text-left",
            portal === "candidate"
              ? "bg-sky-500/10 border-sky-500/30 text-foreground font-bold shadow-2xs"
              : "border-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground"
          )}
        >
          <span
            className={cn(
              "grid h-8 w-8 place-items-center rounded-xl shrink-0 transition-colors",
              portal === "candidate" ? "bg-sky-500 text-white" : "bg-muted text-muted-foreground"
            )}
          >
            <RiStethoscopeLine className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold">Candidate Portal</span>
              {portal === "candidate" && (
                <span className="text-[9px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-wider">Active</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">Apply for jobs & instant shifts</p>
          </div>
          {portal === "candidate" && <HiCheck className="h-4 w-4 text-sky-600 dark:text-sky-400 shrink-0" />}
        </button>

        {/* Admin Operations */}
        <button
          type="button"
          onClick={() => switchPortal("admin")}
          className={cn(
            "w-full flex items-center gap-2.5 rounded-2xl p-2.5 text-xs cursor-pointer transition-all border text-left",
            portal === "admin"
              ? "bg-amber-500/10 border-amber-500/30 text-foreground font-bold shadow-2xs"
              : "border-transparent hover:bg-muted/60 text-muted-foreground hover:text-foreground"
          )}
        >
          <span
            className={cn(
              "grid h-8 w-8 place-items-center rounded-xl shrink-0 transition-colors",
              portal === "admin" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"
            )}
          >
            <HiOutlineShieldCheck className="h-4 w-4" />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-bold">Admin Operations</span>
              {portal === "admin" && (
                <span className="text-[9px] font-extrabold text-amber-600 uppercase tracking-wider">Active</span>
              )}
            </div>
            <p className="text-[10px] text-muted-foreground truncate">Credentialing, KYC & escrow</p>
          </div>
          {portal === "admin" && <HiCheck className="h-4 w-4 text-amber-600 shrink-0" />}
        </button>
      </div>

      <div className="h-px bg-border/60 my-1" />

      {/* Appearance / Theme Segmented Selector */}
      <div className="px-1.5 py-1">
        <div className="flex items-center justify-between px-1 mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
            Appearance
          </span>
        </div>
        <div className="grid grid-cols-3 gap-1 rounded-2xl bg-muted/50 p-1 border border-border/40">
          <button
            type="button"
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer",
              theme === "light"
                ? "bg-card text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <HiOutlineSun className="h-3.5 w-3.5 text-amber-500" />
            <span>Light</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer",
              theme === "dark"
                ? "bg-card text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <HiOutlineMoon className="h-3.5 w-3.5 text-sky-400" />
            <span>Dark</span>
          </button>
          <button
            type="button"
            onClick={() => setTheme("system")}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-bold transition-all cursor-pointer",
              theme === "system"
                ? "bg-card text-foreground shadow-xs border border-border/50"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <HiOutlineComputerDesktop className="h-3.5 w-3.5" />
            <span>System</span>
          </button>
        </div>
      </div>

      <div className="h-px bg-border/60 my-1" />

      {/* Sign out */}
      <button
        type="button"
        onClick={onSignOut}
        className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-xs font-bold text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer transition-colors text-left"
      >
        <span className="grid h-8 w-8 place-items-center rounded-xl bg-destructive/10 text-destructive shrink-0">
          <HiOutlineArrowRightOnRectangle className="h-4 w-4" />
        </span>
        <span>Sign out of session</span>
      </button>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const s = useApp();
  const { theme, setTheme } = useTheme();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  const pendingCandidateKYC = s.candidateKYC.filter((c) => c.status === "pending").length;
  const pendingFacilityKYC = s.facilityKYC.filter((f) => f.status === "pending").length;
  const pendingJobApprovals = s.jobApprovals.filter((j) => j.status === "pending").length;
  const pendingShortlisting = s.adminApplications.filter((a) => a.status === "pending_admin").length;

  const adminNav = [
    { to: "/admin", label: "Overview", icon: HiOutlineSquares2X2, active: HiSquares2X2, badge: 0 },
    { to: "/admin/candidates", label: "Candidate KYC", icon: HiOutlineIdentification, active: HiIdentification, badge: pendingCandidateKYC },
    { to: "/admin/facilities", label: "Hospital Verification", icon: HiOutlineBuildingOffice2, active: HiBuildingOffice2, badge: pendingFacilityKYC },
    { to: "/admin/postings", label: "Job Approvals", icon: HiOutlineDocumentCheck, active: HiDocumentCheck, badge: pendingJobApprovals },
    { to: "/admin/applications", label: "Shortlisting", icon: HiOutlineUserGroup, active: HiUserGroup, badge: pendingShortlisting },
  ] as const;

  const isAdminPath = path.startsWith("/admin");
  const isFacilityPath = path.startsWith("/employer");
  const activePortal = isAdminPath ? "admin" : isFacilityPath ? "facility" : s.portal;

  const nav = activePortal === "admin" ? adminNav : activePortal === "facility" ? facilityNav : candidateNav;

  const name = activePortal === "admin"
    ? "Admin Console"
    : String(activePortal === "facility" ? s.profile["recruiter"] || "Recruiter" : s.profile["name"] || "Guest");

  const homeLink = activePortal === "admin" ? "/admin" : activePortal === "facility" ? "/employer" : "/home";

  const switchPortal = (p: Portal) => {
    setState({ portal: p });
    if (p === "admin") navigate({ to: "/admin" });
    else if (p === "facility") navigate({ to: "/employer" });
    else navigate({ to: "/home" });
  };

  const [headerVisible, setHeaderVisible] = useState(true);
  const [desktopMenuOpen, setDesktopMenuOpen] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  const closeMenus = () => {
    setDesktopMenuOpen(false);
    setMobileDrawerOpen(false);
  };

  const handleNavigate = (to: string) => {
    closeMenus();
    navigate({ to });
  };

  const handleSwitchPortal = (p: Portal) => {
    closeMenus();
    switchPortal(p);
  };

  const handleSignOut = () => {
    closeMenus();
    setState({ signedIn: false });
    navigate({ to: "/" });
  };

  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          const diff = currentScrollY - lastScrollY;

          if (currentScrollY < 20) {
            setHeaderVisible(true);
          } else if (diff > 8 && currentScrollY > 70) {
            // Scrolling down -> hide header
            setHeaderVisible(false);
          } else if (diff < -8) {
            // Scrolling up -> show header
            setHeaderVisible(true);
          }

          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className="min-h-screen pb-20 md:pb-0 w-full max-w-full overflow-x-clip"
      style={{ "--header-offset": headerVisible ? "4rem" : "0rem" } as React.CSSProperties}
    >
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b border-border/80 bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/85 shadow-xs transition-transform duration-300 ease-in-out",
          headerVisible ? "translate-y-0" : "-translate-y-full pointer-events-none"
        )}
      >
        <div className="flex h-16 w-full items-center gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link to={homeLink}><Logo /></Link>
          </div>
          <div className="relative hidden max-w-sm flex-1 lg:block">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder={
                s.portal === "admin"
                  ? "Search KYC docs, registrations, hospitals…"
                  : s.portal === "facility"
                    ? "Search candidates, roles…"
                    : "Search jobs, hospitals, skills…"
              }
              onKeyDown={(e) => e.key === "Enter" && s.portal === "candidate" && navigate({ to: "/jobs", search: { q: (e.target as HTMLInputElement).value } })}
              className="h-10 w-full rounded-full border-0 bg-muted pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <nav className="ml-auto hidden h-16 items-center md:flex">
            {nav.map((n) => {
              const on = path === n.to || (n.to !== "/employer" && n.to !== "/admin" && path.startsWith(n.to + "/"));
              const Icon = on ? n.active : n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  preload="intent"
                  className={cn(
                    "relative flex h-16 min-w-[84px] px-3 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors whitespace-nowrap",
                    on ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="relative">
                    <Icon className={cn("h-6 w-6 shrink-0", on ? "text-primary" : "text-muted-foreground")} />
                    {"badge" in n && Number(n.badge) > 0 && (
                      <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white shadow-xs">
                        {n.badge}
                      </span>
                    )}
                  </div>
                  <span className="leading-none">{n.label}</span>
                  {on && <span className="absolute bottom-0 inset-x-2 h-0.5 rounded-t-full bg-primary" />}
                </Link>
              );
            })}
          </nav>
          <Link to="/notifications" preload="intent" className="relative ml-auto rounded-full p-2 text-muted-foreground hover:bg-muted md:ml-0" aria-label="Notifications">
            <HiOutlineBell className="h-6 w-6" />
            <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-card bg-destructive" />
          </Link>
          <ThemeToggle />
          {/* Desktop User Menu Dropdown */}
          <div className="hidden md:block">
            <DropdownMenu open={desktopMenuOpen} onOpenChange={setDesktopMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="Open profile menu"
                  className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  <span className={cn(
                    "grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-primary-foreground",
                    s.portal === "admin" ? "bg-amber-600 text-white" : "bg-gradient-brand"
                  )}>
                    {s.portal === "admin" ? "AD" : initials(name)}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="w-80 rounded-3xl border border-border/80 bg-card/98 backdrop-blur-xl p-3 shadow-2xl">
                <AccountMenuContent
                  name={name}
                  portal={activePortal}
                  profile={s.profile}
                  theme={theme}
                  setTheme={setTheme}
                  switchPortal={handleSwitchPortal}
                  onNavigate={handleNavigate}
                  onSignOut={handleSignOut}
                />
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile User Menu Bottom Sheet */}
          <div className="block md:hidden">
            <Sheet open={mobileDrawerOpen} onOpenChange={setMobileDrawerOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  aria-label="Open profile menu"
                  className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  <span className={cn(
                    "grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-primary-foreground",
                    s.portal === "admin" ? "bg-amber-600 text-white" : "bg-gradient-brand"
                  )}>
                    {s.portal === "admin" ? "AD" : initials(name)}
                  </span>
                </button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-3xl border-t border-border/80 bg-card max-h-[85vh] overflow-y-auto px-4 pb-6 pt-3 shadow-2xl focus:outline-none">
                <div className="mx-auto mb-2.5 h-1.5 w-12 rounded-full bg-muted-foreground/30" />
                <SheetTitle className="sr-only">Account & Portal Menu</SheetTitle>
                <SheetDescription className="sr-only">Switch active portal, review profile, and adjust theme</SheetDescription>
                <AccountMenuContent
                  name={name}
                  portal={activePortal}
                  profile={s.profile}
                  theme={theme}
                  setTheme={setTheme}
                  switchPortal={handleSwitchPortal}
                  onNavigate={handleNavigate}
                  onSignOut={handleSignOut}
                />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="px-4 sm:px-6 lg:px-8 py-5 sm:py-8 animate-in fade-in duration-300 w-full min-w-0">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card/98 backdrop-blur md:hidden">
        {nav.map((n) => {
          const on = path === n.to || (n.to !== "/employer" && n.to !== "/admin" && path.startsWith(n.to + "/"));
          const Icon = on ? n.active : n.icon;
          return (
            <Link
              key={n.to}
              to={n.to}
              preload="intent"
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-all active:scale-95 min-w-0 px-1 whitespace-nowrap",
                on ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5 shrink-0" />
                {"badge" in n && Number(n.badge) > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-amber-500 px-0.5 text-[8px] font-bold text-white">
                    {n.badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-full text-center">{n.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function PageHead({ title, sub, action }: { title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px]">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "Withdrawn" ? "bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50"
      : ["Interview", "Shortlisted", "Open", "Confirmed", "Offer"].includes(status) ? "bg-primary-soft text-primary"
        : ["Hired", "Verified", "Approved", "Paid"].includes(status) ? "bg-success-soft text-success"
          : ["Under review", "New", "Applied", "Pending", "Draft"].includes(status) ? "bg-warning-soft text-warning"
            : "bg-muted text-muted-foreground";
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", tone)}>{status}</span>;
}
