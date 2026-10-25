import type { ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  HiOutlineSquares2X2,
  HiSquares2X2,
  HiOutlineIdentification,
  HiIdentification,
  HiOutlineBuildingOffice2,
  HiBuildingOffice2,
  HiOutlineDocumentCheck,
  HiDocumentCheck,
  HiOutlineUserGroup,
  HiUserGroup,
  HiOutlineShieldCheck,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowRightOnRectangle,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineComputerDesktop,
  HiCheck,
  HiOutlineBell,
} from "react-icons/hi2";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { useApp, setState, Portal } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminLayoutProps {
  children: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  badge?: ReactNode;
  actions?: ReactNode;
}

export function AdminLayout({
  children,
  title,
  subtitle,
  badge,
  actions,
}: AdminLayoutProps) {
  const s = useApp();
  const { theme, setTheme } = useTheme();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  const pendingCandidateKYC = s.candidateKYC.filter((c) => c.status === "pending").length;
  const pendingFacilityKYC = s.facilityKYC.filter((f) => f.status === "pending").length;
  const pendingJobApprovals = s.jobApprovals.filter((j) => j.status === "pending").length;
  const pendingShortlisting = s.adminApplications.filter((a) => a.status === "pending_admin").length;

  const adminNav = [
    {
      to: "/admin",
      label: "Overview",
      shortLabel: "Overview",
      icon: HiOutlineSquares2X2,
      active: HiSquares2X2,
      badge: 0,
    },
    {
      to: "/admin/candidates",
      label: "Candidate KYC",
      shortLabel: "KYC",
      icon: HiOutlineIdentification,
      active: HiIdentification,
      badge: pendingCandidateKYC,
    },
    {
      to: "/admin/facilities",
      label: "Hospital Verification",
      shortLabel: "Hospitals",
      icon: HiOutlineBuildingOffice2,
      active: HiBuildingOffice2,
      badge: pendingFacilityKYC,
    },
    {
      to: "/admin/postings",
      label: "Job Approvals",
      shortLabel: "Postings",
      icon: HiOutlineDocumentCheck,
      active: HiDocumentCheck,
      badge: pendingJobApprovals,
    },
    {
      to: "/admin/applications",
      label: "Shortlisting",
      shortLabel: "Shortlist",
      icon: HiOutlineUserGroup,
      active: HiUserGroup,
      badge: pendingShortlisting,
    },
  ] as const;

  const switchPortal = (p: Portal) => {
    setState({ portal: p });
    if (p === "admin") navigate({ to: "/admin" });
    else if (p === "facility") navigate({ to: "/employer" });
    else navigate({ to: "/home" });
  };

  return (
    <div className="min-h-screen pb-20 md:pb-0 w-full max-w-full overflow-x-clip bg-background text-foreground">
      {/* Top Header Navigation (Identical to Candidate & Hospital Portals) */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/85 shadow-xs">
        <div className="flex h-16 w-full items-center gap-4 px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Link to="/admin">
              <Logo />
            </Link>
          </div>

          {/* Quick Search Bar */}
          <div className="relative hidden max-w-xs flex-1 lg:block">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder="Search candidate, council reg, hospital…"
              className="h-10 w-full rounded-full border-0 bg-muted pl-10 pr-4 text-xs outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Top Horizontal Navigation Menu */}
          <nav className="ml-auto hidden h-16 items-center md:flex">
            {adminNav.map((n) => {
              const on =
                path === n.to ||
                (n.to !== "/admin" && path.startsWith(n.to + "/"));
              const Icon = on ? n.active : n.icon;

              return (
                <Link
                  key={n.to}
                  to={n.to}
                  preload="intent"
                  className={cn(
                    "relative flex h-16 min-w-[88px] px-3 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors whitespace-nowrap",
                    on
                      ? "text-primary font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="relative">
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-transform group-hover:scale-105",
                        on ? "text-primary" : "text-muted-foreground"
                      )}
                    />
                    {n.badge > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold text-white shadow-xs">
                        {n.badge}
                      </span>
                    )}
                  </div>
                  <span className="leading-none">{n.label}</span>
                  {on && (
                    <span className="absolute bottom-0 inset-x-2 h-0.5 rounded-t-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Notifications Icon */}
          <Link
            to="/notifications"
            preload="intent"
            className="relative ml-auto rounded-full p-2 text-muted-foreground hover:bg-muted md:ml-0"
            aria-label="Notifications"
          >
            <HiOutlineBell className="h-5 w-5" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-card bg-destructive" />
          </Link>

          {/* Theme Switcher */}
          <ThemeToggle />

          {/* Admin User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-primary cursor-pointer">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-amber-600 text-xs font-black text-white shadow-xs">
                AD
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center gap-1.5 font-bold text-foreground">
                  <span>Clinical Ops Admin</span>
                  <span className="rounded bg-amber-500/15 px-1.5 py-0.2 text-[10px] font-bold text-amber-600">
                    Master
                  </span>
                </div>
                <div className="text-xs font-normal text-muted-foreground">
                  Verification & Operations Board
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Switch Portal
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => switchPortal("candidate")}
                className="cursor-pointer text-xs"
              >
                🩺 Candidate Portal (Jobs & Shifts)
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => switchPortal("facility")}
                className="cursor-pointer text-xs"
              >
                🏥 Hospital / Facility Portal
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => {
                  setState({ signedIn: false });
                  navigate({ to: "/" });
                }}
                className="text-destructive text-xs cursor-pointer"
              >
                <HiOutlineArrowRightOnRectangle className="h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Sub-Header Strip with Title, Badge & Action Buttons */}
      <div className="border-b border-border/80 bg-card/75 backdrop-blur px-4 sm:px-6 lg:px-8 py-5 sm:py-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 w-full">
          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                {title}
              </h1>
              {badge}
            </div>
            {subtitle && (
              <div className="text-xs text-muted-foreground leading-relaxed max-w-4xl">
                {subtitle}
              </div>
            )}
          </div>
          {actions && <div className="w-full sm:w-auto shrink-0 pt-1 sm:pt-0">{actions}</div>}
        </div>
      </div>

      {/* Main Viewport */}
      <main className="px-4 sm:px-6 lg:px-8 py-5 sm:py-6 space-y-6 w-full min-w-0">
        {children}
      </main>

      {/* Mobile Sticky Bottom Navigation Dock (Exact match with Candidate & Hospital) */}
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-border bg-card/98 backdrop-blur md:hidden">
        {adminNav.map((n) => {
          const on =
            path === n.to ||
            (n.to !== "/admin" && path.startsWith(n.to + "/"));
          const Icon = on ? n.active : n.icon;

          return (
            <Link
              key={n.to}
              to={n.to}
              preload="intent"
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-all active:scale-95 min-w-0 px-0.5 whitespace-nowrap",
                on
                  ? "text-primary font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5 shrink-0" />
                {n.badge > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-amber-500 px-0.5 text-[8px] font-bold text-white">
                    {n.badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-full text-center">{n.shortLabel}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
