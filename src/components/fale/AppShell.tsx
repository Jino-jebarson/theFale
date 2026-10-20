import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  HiOutlineHome, HiHome, HiOutlineBriefcase, HiBriefcase, HiOutlineClock, HiClock,
  HiOutlineClipboardDocumentList, HiClipboardDocumentList, HiOutlineAcademicCap, HiAcademicCap,
  HiOutlineBell, HiOutlineMagnifyingGlass, HiMagnifyingGlass, HiOutlineSquares2X2, HiSquares2X2, HiOutlinePlusCircle,
  HiPlusCircle, HiOutlineUserGroup, HiUserGroup, HiOutlineArrowRightOnRectangle,
  HiOutlineSun, HiOutlineMoon, HiOutlineComputerDesktop, HiCheck, HiOutlineQuestionMarkCircle,
  HiOutlineIdentification, HiIdentification, HiOutlineBuildingOffice2, HiBuildingOffice2,
  HiOutlineDocumentCheck, HiDocumentCheck, HiOutlineShieldCheck,
} from "react-icons/hi2";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useApp, setState, Portal } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const candidateNav = [
  { to: "/home", label: "Home", icon: HiOutlineHome, active: HiHome, badge: 0 },
  { to: "/jobs", label: "Jobs", icon: HiOutlineBriefcase, active: HiBriefcase, badge: 0 },
  { to: "/shifts", label: "Shifts", icon: HiOutlineClock, active: HiClock, badge: 0 },
  { to: "/applications", label: "Applications", icon: HiOutlineClipboardDocumentList, active: HiClipboardDocumentList, badge: 0 },
  { to: "/learning", label: "Learning", icon: HiOutlineAcademicCap, active: HiAcademicCap, badge: 0 },
] as const;

const facilityNav = [
  { to: "/employer", label: "Dashboard", icon: HiOutlineSquares2X2, active: HiSquares2X2, badge: 0 },
  { to: "/employer/post", label: "Post a job", icon: HiOutlinePlusCircle, active: HiPlusCircle, badge: 0 },
  { to: "/employer/post-shift", label: "Post a shift", icon: HiOutlineClock, active: HiClock, badge: 0 },
  { to: "/employer/applicants", label: "Applicants", icon: HiOutlineUserGroup, active: HiUserGroup, badge: 0 },
  { to: "/employer/candidates", label: "Candidates", icon: HiOutlineMagnifyingGlass, active: HiMagnifyingGlass, badge: 0 },
] as const;

export function initials(name?: string) {
  return (name || "FALE User").split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
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

  return (
    <div className="min-h-screen pb-20 md:pb-0 w-full max-w-full overflow-x-hidden">
      <header className="sticky top-0 z-40 border-b bg-card/95 backdrop-blur">
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
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
              <span className={cn(
                "grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-primary-foreground",
                s.portal === "admin" ? "bg-amber-600 text-white" : "bg-gradient-brand"
              )}>
                {s.portal === "admin" ? "AD" : initials(name)}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="font-semibold flex items-center gap-1.5">
                  {name}
                  {s.portal === "admin" && (
                    <span className="rounded bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-bold text-amber-600">Master</span>
                  )}
                </div>
                <div className="text-xs font-normal text-muted-foreground">
                  {s.portal === "admin"
                    ? "Clinical Verification Board"
                    : s.portal === "facility"
                    ? String(s.profile["org"] || "Your organization")
                    : String(s.profile["role"] || "Healthcare professional")}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Switch Active Portal
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => switchPortal("admin")} className={cn("cursor-pointer text-xs", s.portal === "admin" && "font-bold text-amber-600")}>
                🛡️ Admin Operations Console
                {s.portal === "admin" && <HiCheck className="ml-auto h-4 w-4 text-amber-600" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchPortal("candidate")} className={cn("cursor-pointer text-xs", s.portal === "candidate" && "font-bold text-primary")}>
                🩺 Candidate Portal (Jobs & Shifts)
                {s.portal === "candidate" && <HiCheck className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => switchPortal("facility")} className={cn("cursor-pointer text-xs", s.portal === "facility" && "font-bold text-primary")}>
                🏥 Hospital / Facility Portal
                {s.portal === "facility" && <HiCheck className="ml-auto h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {s.portal === "candidate" && <DropdownMenuItem onClick={() => navigate({ to: "/profile" })}>View profile</DropdownMenuItem>}
              {s.portal === "facility" && <DropdownMenuItem onClick={() => navigate({ to: "/employer/profile" })}>Hospital Profile</DropdownMenuItem>}
              {s.portal === "admin" && <DropdownMenuItem onClick={() => navigate({ to: "/admin/candidates" })}>Pending Document Approvals</DropdownMenuItem>}
              <DropdownMenuItem onClick={() => navigate({ to: "/support" })} className="cursor-pointer">
                <HiOutlineQuestionMarkCircle className="h-4 w-4 text-primary" />
                <span>Help & Support</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Appearance
              </DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setTheme("light")} className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2 text-xs">
                  <HiOutlineSun className="h-4 w-4 text-amber-500" /> Light
                </span>
                {theme === "light" && <HiCheck className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2 text-xs">
                  <HiOutlineMoon className="h-4 w-4 text-sky-400" /> Dark
                </span>
                {theme === "dark" && <HiCheck className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className="flex items-center justify-between cursor-pointer">
                <span className="flex items-center gap-2 text-xs">
                  <HiOutlineComputerDesktop className="h-4 w-4 text-muted-foreground" /> System
                </span>
                {theme === "system" && <HiCheck className="h-4 w-4 text-primary" />}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { setState({ signedIn: false }); navigate({ to: "/" }); }}>
                <HiOutlineArrowRightOnRectangle className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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
