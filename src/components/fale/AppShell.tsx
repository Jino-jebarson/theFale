import { usePageLoad } from "@/hooks/use-page-load";
import { RequestError } from "@/components/fale/RequestError";
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
  HiOutlineChatBubbleLeftRight, HiChatBubbleLeftRight,
  HiOutlineBookmark,
  HiOutlineTicket, HiTicket,
  HiOutlineLifebuoy,
} from "react-icons/hi2";
import { RiStethoscopeLine, RiVerifiedBadgeFill } from "react-icons/ri";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { FlowAIFloatingButton } from "./FlowAIFloatingButton";
import { useApp, setState, Portal, setUnreadNotificationCount } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet, SheetTrigger, SheetContent, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { isApiEnabled } from "@/lib/api";
import { logout } from "@/lib/adapters/authAdapter";
import { getCandidateProfile } from "@/lib/adapters/candidateAdapter";
import {
  attachFocusAndPollRefresh,
  getFacilityApplicants,
  getFacilityProfile,
} from "@/lib/adapters/facilityAdapter";
import { getAdminDashboardMetrics, getAdminSupportTickets, type AdminDashboardMetricsDto } from "@/lib/adapters/adminAdapter";
import { getNotifications } from "@/lib/adapters/notificationAdapter";
import {
  getUnseenCount,
  readAdminSeenCounts,
  syncAdminSeenCounts,
  type AdminRouteCounts,
} from "@/lib/adminSeenCounts";

const candidateNav = [
  { to: "/home", label: "Home", icon: HiOutlineHome, active: HiHome, badge: 0 },
  { to: "/jobs", label: "Jobs", icon: HiOutlineBriefcase, active: HiBriefcase, badge: 0 },
  { to: "/shifts", label: "Shifts", icon: HiOutlineClock, active: HiClock, badge: 0 },
  { to: "/applications", label: "Applications", icon: HiOutlineClipboardDocumentList, active: HiClipboardDocumentList, badge: 0 },
  { to: "/earnings", label: "Earnings", icon: HiOutlineBanknotes, active: HiBanknotes, badge: 0 },
  { to: "/learning", label: "Learning", icon: HiOutlineAcademicCap, active: HiAcademicCap, badge: 0 },
  { to: "/huddle", label: "Huddle", icon: HiOutlineChatBubbleLeftRight, active: HiChatBubbleLeftRight, badge: 0 },
] as const;

const facilityNav = [
  { to: "/employer", label: "Dashboard", icon: HiOutlineSquares2X2, active: HiSquares2X2, badge: 0 },
  { to: "/employer/postings", label: "Active Roles", icon: HiOutlineClipboardDocumentList, active: HiClipboardDocumentList, badge: 0 },
  { to: "/employer/candidates", label: "Candidates", icon: HiOutlineMagnifyingGlass, active: HiMagnifyingGlass, badge: 0 },
  { to: "/employer/post", label: "Post Opening", icon: HiOutlinePlusCircle, active: HiPlusCircle, badge: 0 },
  { to: "/employer/applicants", label: "Shortlisted", icon: HiOutlineUserGroup, active: HiUserGroup, badge: 0 },
  { to: "/employer/wallet", label: "Wallet & Escrow", shortLabel: "Wallet", icon: HiOutlineBanknotes, active: HiBanknotes, badge: 0 },
  { to: "/huddle", label: "Huddle", icon: HiOutlineChatBubbleLeftRight, active: HiChatBubbleLeftRight, badge: 0 },
] as const;

export function initials(name?: string) {
  return (name || "FALE User").split(" ").map((x) => x[0]).slice(0, 2).join("").toUpperCase();
}

export function UserAvatar({
  avatarUrl,
  name,
  portal,
  size = "md",
  className,
}: {
  avatarUrl?: string;
  name?: string;
  portal: Portal;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const showImg = Boolean(avatarUrl && !imgError);

  const sizeClasses = {
    sm: "h-8 w-8 text-[11px]",
    md: "h-9 w-9 text-xs",
    lg: "h-11 w-11 text-xs",
  }[size];

  const roundedClasses = size === "lg" ? "rounded-2xl" : "rounded-full";

  if (showImg) {
    return (
      <img
        src={avatarUrl}
        alt={name || "User Avatar"}
        onError={() => setImgError(true)}
        className={cn(
          sizeClasses,
          roundedClasses,
          "object-cover border border-border/70 shadow-2xs shrink-0 ring-1 ring-border/40 bg-card",
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "grid place-items-center font-bold text-primary-foreground shadow-2xs shrink-0",
        sizeClasses,
        roundedClasses,
        portal === "admin"
          ? "bg-primary text-white font-black"
          : portal === "facility"
            ? "bg-primary text-white"
            : "bg-gradient-brand text-white",
        className
      )}
    >
      {portal === "admin" ? "AD" : initials(name)}
    </span>
  );
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
  const s = useApp();
  const avatarUrl = profile["avatar"] || profile["logoUrl"] || profile["photoUrl"];
  return (
    <div className="w-full space-y-2">
      {/* Profile Card Header */}
      <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/40 border border-border/60">
        <div className="relative shrink-0">
          <UserAvatar
            avatarUrl={avatarUrl}
            name={name}
            portal={portal}
            size="lg"
          />
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
                : profile["level"] === "student"
                  ? `Student - ${profile["course"] || profile["role"] || "Healthcare"}`
                  : profile["level"] === "fresher"
                    ? `Fresher - ${profile["role"] || "Healthcare"}`
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
          <>
            <button
              type="button"
              onClick={() => onNavigate("/profile")}
              className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-xs font-bold cursor-pointer hover:bg-muted/60 transition-colors text-left"
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                <HiOutlineUser className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-foreground">
                  {profile["level"] === "student" ? "Profile" : "Profile & Verified CV"}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {profile["level"] === "student"
                    ? "College affiliation & verification"
                    : "Council registrations & DigiLocker KYC"}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("/applications?tab=saved")}
              className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-xs font-bold cursor-pointer hover:bg-muted/60 transition-colors text-left"
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
                <HiOutlineBookmark className="h-4 w-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground">Saved Roles</p>
                  {s.saved.length > 0 && (
                    <span className="rounded-full bg-primary/15 text-primary text-[10px] font-black px-1.5 py-0.2">
                      {s.saved.length}
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-muted-foreground">Bookmarked healthcare opportunities</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => onNavigate("/support")}
              className="w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-xs font-bold cursor-pointer hover:bg-muted/60 transition-colors text-left"
            >
              <div className="relative shrink-0">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <HiOutlineQuestionMarkCircle className="h-4 w-4" />
                </span>
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-card animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-foreground">24/7 Concierge</p>
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400">
                    Online · Fast Help
                  </span>
                </div>
                <p className="text-[10px] text-muted-foreground">Priority WhatsApp & clinical assistance</p>
              </div>
            </button>
          </>
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

        {portal !== "candidate" && (
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
        )}
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
  const profileLoad = usePageLoad();
  const s = useApp();
  const { theme, setTheme } = useTheme();
  const path = useRouterState({ select: (r) => r.location.pathname });
  const navigate = useNavigate();

  const [adminMetrics, setAdminMetrics] = useState<AdminDashboardMetricsDto | null>(null);
  const [adminOpenTickets, setAdminOpenTickets] = useState<number>(0);
  const [adminTicketsLoaded, setAdminTicketsLoaded] = useState<boolean>(!isApiEnabled);
  const [adminSeenCounts, setAdminSeenCounts] = useState<AdminRouteCounts>(() => readAdminSeenCounts());

  const pendingCandidateKYC = adminMetrics
    ? (adminMetrics.pendingCandidateKycCount ?? 0)
    : s.candidateKYC.filter((c) => c.status === "pending").length;

  const pendingFacilityKYC = adminMetrics
    ? (adminMetrics.pendingFacilityKycCount ?? 0)
    : s.facilityKYC.filter((f) => f.status === "pending").length;

  const pendingJobApprovals = adminMetrics
    ? (adminMetrics.pendingPostingsCount ?? 0)
    : s.jobApprovals.filter((j) => j.status === "pending").length;

  const pendingShortlisting = adminMetrics
    ? (adminMetrics.pendingApplicationsCount ?? 0)
    : s.adminApplications.filter((a) => a.status === "pending_admin").length;

  const pendingHuddleModeration = adminMetrics
    ? (adminMetrics.flaggedHuddlePostsCount ?? 0)
    : s.huddlePosts.filter(
        (p) => p.status === "review" || p.status === "hidden" || (p.reports && p.reports.length > 0)
      ).length;

  const adminNav = [
    { to: "/admin", label: "Overview", shortLabel: "Overview", icon: HiOutlineSquares2X2, active: HiSquares2X2, badge: 0 },
    { to: "/admin/candidates", label: "Candidate KYC", shortLabel: "KYC", icon: HiOutlineIdentification, active: HiIdentification, badge: getUnseenCount(path, "/admin/candidates", pendingCandidateKYC, adminSeenCounts) },
    { to: "/admin/facilities", label: "Hospital Verification", shortLabel: "Hospitals", icon: HiOutlineBuildingOffice2, active: HiBuildingOffice2, badge: getUnseenCount(path, "/admin/facilities", pendingFacilityKYC, adminSeenCounts) },
    { to: "/admin/postings", label: "Job Approvals", shortLabel: "Jobs", icon: HiOutlineBriefcase, active: HiBriefcase, badge: getUnseenCount(path, "/admin/postings", pendingJobApprovals, adminSeenCounts) },
    { to: "/admin/applications", label: "Shortlisting", shortLabel: "Shortlist", icon: HiOutlineUserGroup, active: HiUserGroup, badge: getUnseenCount(path, "/admin/applications", pendingShortlisting, adminSeenCounts) },
    { to: "/admin/huddle", label: "Huddle Moderation", shortLabel: "Huddle", icon: HiOutlineChatBubbleLeftRight, active: HiChatBubbleLeftRight, badge: getUnseenCount(path, "/admin/huddle", pendingHuddleModeration, adminSeenCounts) },
    { to: "/admin/support", label: "Support Tickets", shortLabel: "Support", icon: HiOutlineTicket, active: HiTicket, badge: getUnseenCount(path, "/admin/support", adminOpenTickets, adminSeenCounts) },
  ] as const;

  const isAdminPath = path.startsWith("/admin");
  const isFacilityPath = path.startsWith("/employer");
  const activePortal = isAdminPath ? "admin" : isFacilityPath ? "facility" : s.portal;

  const adminMetricsReady = adminMetrics !== null;
  const adminTicketsReady = adminTicketsLoaded;

  useEffect(() => {
    if (activePortal !== "admin" && !isAdminPath) return;
    const updated = syncAdminSeenCounts(
      path,
      {
        "/admin/candidates": pendingCandidateKYC,
        "/admin/facilities": pendingFacilityKYC,
        "/admin/postings": pendingJobApprovals,
        "/admin/applications": pendingShortlisting,
        "/admin/huddle": pendingHuddleModeration,
        "/admin/support": adminOpenTickets,
      },
      {
        "/admin/candidates": adminMetricsReady,
        "/admin/facilities": adminMetricsReady,
        "/admin/postings": adminMetricsReady,
        "/admin/applications": adminMetricsReady,
        "/admin/huddle": adminMetricsReady,
        "/admin/support": adminTicketsReady,
      }
    );
    setAdminSeenCounts(updated);
  }, [
    activePortal,
    isAdminPath,
    path,
    adminMetricsReady,
    adminTicketsReady,
    pendingCandidateKYC,
    pendingFacilityKYC,
    pendingJobApprovals,
    pendingShortlisting,
    pendingHuddleModeration,
    adminOpenTickets,
  ]);

  // Auto-sync active portal to global store when on route-specific paths
  useEffect(() => {
    if (path.startsWith("/employer") && s.portal !== "facility") {
      setState({ portal: "facility" });
    } else if (path.startsWith("/admin") && s.portal !== "admin") {
      setState({ portal: "admin" });
    } else if (
      (path === "/home" || path === "/jobs" || path === "/shifts" || path === "/earnings" || path === "/applications" || path === "/learning" || path === "/profile") &&
      s.portal !== "candidate"
    ) {
      setState({ portal: "candidate" });
    }
  }, [path, s.portal]);

  // Helper to read seen candidate IDs from local storage
  const getSeenApplicantIds = (): Set<string> => {
    try {
      const stored = localStorage.getItem("fale_seen_applicant_ids");
      return stored ? new Set(JSON.parse(stored)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  };

  const [facilityShortlistedCount, setFacilityShortlistedCount] = useState<number>(() => {
    const seen = getSeenApplicantIds();
    return (s.adminApplications || [])
      .filter((a) => a.status === "shortlisted" && !seen.has(String(a.id)))
      .length;
  });

  useEffect(() => {
    if (activePortal !== "facility" && !isFacilityPath) return;
    let isMounted = true;
    const isApplicantsPage = path.startsWith("/employer/applicants");

    const refreshFacilityApplicants = () => {
      const seen = getSeenApplicantIds();

      {
        getFacilityApplicants()
          .then((data) => {
            if (isMounted && Array.isArray(data)) {
              const unread = data.filter((a) => !seen.has(String(a.id))).length;
              setFacilityShortlistedCount(unread);
            }
          })
          .catch(() => { });
      }
    };

    if (!isApplicantsPage) {
      refreshFacilityApplicants();
    }

    const handleUpdate = (e: Event) => {
      const detail = (e as CustomEvent<{ unreadCount?: number }>)?.detail;
      if (typeof detail?.unreadCount === "number") {
        setFacilityShortlistedCount(detail.unreadCount);
        return;
      }
      if (!isApplicantsPage) {
        refreshFacilityApplicants();
      }
    };

    window.addEventListener("fale:applications-updated", handleUpdate);
    const detachAutoRefresh = !isApplicantsPage
      ? attachFocusAndPollRefresh(refreshFacilityApplicants, 60000)
      : () => {};
    return () => {
      isMounted = false;
      window.removeEventListener("fale:applications-updated", handleUpdate);
      detachAutoRefresh();
    };
  }, [activePortal, isFacilityPath, path, isApiEnabled, s.adminApplications]);

  useEffect(() => {
    if ((activePortal !== "admin" && !isAdminPath)) return;
    getAdminDashboardMetrics()
      .then((data) => {
        if (data) setAdminMetrics(data);
      })
      .catch(() => {});

    getAdminSupportTickets("OPEN")
      .then((t) => {
        setAdminOpenTickets(t.length);
        setAdminTicketsLoaded(true);
      })
      .catch(() => {});
  }, [activePortal, isAdminPath, path]);

  // Real-time unread notification badge synchronization for navbar bell
  useEffect(() => {
    getNotifications()
      .then((data) => {
        if (Array.isArray(data)) {
          let list = data;
          try {
            const clearedAt = Number(localStorage.getItem("fale_admin_cleared_at") || 0);
            const dismissed = new Set(JSON.parse(localStorage.getItem("fale_dismissed_notifs") || "[]"));
            if (activePortal === "admin" && clearedAt > 0) {
              list = list.filter((n) => {
                if (dismissed.has(n.id)) return false;
                const created = (n as any).createdAt ? new Date((n as any).createdAt).getTime() : 0;
                return created > clearedAt;
              });
            }
          } catch {}
          const unread = list.filter((n) => n.unread).length;
          setUnreadNotificationCount(unread);
        }
      })
      .catch(() => {});
  }, [path, activePortal]);

  const facilityShortlistedBadge = path === "/employer/applicants"
    ? 0
    : facilityShortlistedCount;

  const dynamicFacilityNav = [
    { to: "/employer", label: "Dashboard", icon: HiOutlineSquares2X2, active: HiSquares2X2, badge: 0 },
    { to: "/employer/postings", label: "Active Roles", icon: HiOutlineClipboardDocumentList, active: HiClipboardDocumentList, badge: 0 },
    { to: "/employer/candidates", label: "Candidates", icon: HiOutlineMagnifyingGlass, active: HiMagnifyingGlass, badge: 0 },
    { to: "/employer/post", label: "Post Opening", icon: HiOutlinePlusCircle, active: HiPlusCircle, badge: 0 },
    { to: "/employer/applicants", label: "Shortlisted", icon: HiOutlineUserGroup, active: HiUserGroup, badge: facilityShortlistedBadge },
    { to: "/employer/wallet", label: "Wallet & Escrow", shortLabel: "Wallet", icon: HiOutlineBanknotes, active: HiBanknotes, badge: 0 },
    { to: "/huddle", label: "Huddle", icon: HiOutlineChatBubbleLeftRight, active: HiChatBubbleLeftRight, badge: 0 },
  ] as const;

  const nav = activePortal === "admin" ? adminNav : activePortal === "facility" ? dynamicFacilityNav : candidateNav;

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

  useEffect(() => {
    if (activePortal === "candidate") {
      getCandidateProfile()
        .then((profileData) => {
          if (!profileData) return;
          const photoDoc = profileData.documents?.find((d) => d.documentType === "PHOTO")?.fileUrl;
          const openVal = profileData.openToWork != null ? Boolean(profileData.openToWork) : true;
          setState((prev) => ({
            candidateLevel: profileData.isStudent ? "student" : (profileData.candidateLevel?.toLowerCase() as any),
            profile: {
              ...prev.profile,
              openToWork: openVal,
              name: profileData.name || prev.profile["name"],
              email: profileData.email || prev.profile["email"],
              mobile: profileData.phone || prev.profile["mobile"],
              city: profileData.city || prev.profile["city"],
              state: profileData.state || prev.profile["state"],
              role: profileData.profession || prev.profile["role"] || (profileData.isStudent ? profileData.course : ""),
              specialty: profileData.specialty || prev.profile["specialty"] || "",
              qual: profileData.qualification || prev.profile["qual"] || "",
              college: profileData.college || prev.profile["college"],
              institution: profileData.college || prev.profile["institution"],
              council: profileData.council || prev.profile["council"],
              regNo: profileData.regNumber || prev.profile["regNo"],
              regYear: profileData.regYear || prev.profile["regYear"],
              exp: profileData.experienceYears || prev.profile["exp"] || (profileData.isStudent ? "Student" : "Fresher"),
              level: profileData.isStudent ? "student" : profileData.candidateLevel?.toLowerCase(),
              cadreLevel: profileData.isStudent ? "student" : profileData.candidateLevel?.toLowerCase(),
              kycStatus: profileData.kycStatus || prev.profile["kycStatus"],
              notice: profileData.noticePeriod || prev.profile["notice"] || "",
              availability: profileData.availability || prev.profile["availability"] || "",
              avatar: photoDoc || prev.profile["avatar"],
            },
          }));
        })
        .catch(profileLoad.fail);
    } else if (activePortal === "facility") {
      getFacilityProfile()
        .then((facData) => {
          if (!facData) return;
          setState((prev) => ({
            profile: {
              ...prev.profile,
              hospitalName: facData.hospitalName || prev.profile["hospitalName"],
              recruiter: facData.contactPersonName || prev.profile["recruiter"],
              email: facData.contactEmail || prev.profile["email"],
              phone: facData.contactPhone || prev.profile["phone"],
              logoUrl: facData.logoUrl || prev.profile["logoUrl"],
              avatar: facData.logoUrl || prev.profile["avatar"],
            },
          }));
        })
        .catch(profileLoad.fail);
    }
  }, [activePortal, profileLoad.retryKey]);

  const closeMenus = () => {
    setDesktopMenuOpen(false);
    setMobileDrawerOpen(false);
  };

  const handleNavigate = (to: string) => {
    closeMenus();
    navigate({ to });
  };

  const [pendingPortalSwitch, setPendingPortalSwitch] = useState<Portal | null>(null);

  const confirmPortalSwitch = async () => {
    if (!pendingPortalSwitch) return;
    const target = pendingPortalSwitch;
    setPendingPortalSwitch(null);
    {
      await logout();
    }
    setState({ signedIn: false, portal: target });
    navigate({ to: "/", search: { portal: target } });
  };

  const handleSwitchPortal = (p: Portal) => {
    closeMenus();
    if (p === activePortal) return;
    {
      setPendingPortalSwitch(p);
    }
  };

  const handleSignOut = async () => {
    closeMenus();
    {
      await logout();
    }
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
      className="min-h-screen pb-20 md:pb-0 w-full max-w-full"
      style={{ "--header-offset": headerVisible ? "4rem" : "0rem" } as React.CSSProperties}
    >
      <header
        className={cn(
          "sticky top-0 z-50 w-full border-b border-border/80 bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/85 shadow-xs transition-transform duration-300 ease-in-out",
          headerVisible ? "translate-y-0" : "-translate-y-full pointer-events-none"
        )}
      >
        <div className="flex h-16 w-full items-center gap-2 sm:gap-4 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 shrink-0">
            <Link to={homeLink}><Logo /></Link>
          </div>
          <div className="relative hidden max-w-[200px] xl:max-w-xs 2xl:max-w-sm flex-1 xl:block shrink min-w-0">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              placeholder={
                activePortal === "admin"
                  ? "Search KYC docs, registrations, hospitals..."
                  : activePortal === "facility"
                    ? "Search candidates, roles..."
                    : "Search jobs, hospitals, skills..."
              }
              onKeyDown={(e) => e.key === "Enter" && activePortal === "candidate" && navigate({ to: "/jobs", search: { q: (e.target as HTMLInputElement).value } })}
              className="h-10 w-full rounded-full border-0 bg-muted pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <nav className="ml-auto hidden h-16 items-center md:flex shrink min-w-0">
            {nav.map((n) => {
              const isPostOpening = n.to === "/employer/post" && (path === "/employer/post" || path === "/employer/post-shift");
              const on = isPostOpening || path === n.to || (n.to !== "/employer" && n.to !== "/admin" && path.startsWith(n.to + "/"));
              const Icon = on ? n.active : n.icon;
              const shortLabel = "shortLabel" in n ? (n as any).shortLabel : n.label;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  preload="intent"
                  className={cn(
                    "relative flex h-16 min-w-[68px] xl:min-w-[80px] px-1.5 xl:px-2.5 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors whitespace-nowrap",
                    on ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <div className="relative">
                    <Icon className={cn("h-6 w-6 shrink-0", on ? "text-primary" : "text-muted-foreground")} />
                    {"badge" in n && Number(n.badge) > 0 && (
                      <span className="absolute -top-1 -right-2 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white shadow-xs">
                        {n.badge}
                      </span>
                    )}
                  </div>
                  <span className="leading-none hidden xl:inline">{n.label}</span>
                  <span className="leading-none inline xl:hidden">{shortLabel}</span>
                  {on && <span className="absolute bottom-0 inset-x-2 h-0.5 rounded-t-full bg-primary" />}
                </Link>
              );
            })}
          </nav>

          {/* Action Cluster: Notifications, Theme Toggle, Profile Avatar - Always Protected with shrink-0 */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto md:ml-0">
            <Link
              to="/notifications"
              preload="intent"
              className={cn(
                "relative rounded-full p-2 transition-colors",
                path === "/notifications" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"
              )}
              aria-label="Notifications"
            >
              <HiOutlineBell className="h-5 w-5" />
              {(s.unreadNotificationCount ?? 0) > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border-2 border-card bg-destructive animate-pulse" />
              )}
            </Link>
            <ThemeToggle />

            {/* Desktop User Menu Dropdown */}
            <div className="hidden md:block">
              <DropdownMenu open={desktopMenuOpen} onOpenChange={setDesktopMenuOpen}>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="Open profile menu"
                    className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <UserAvatar
                      avatarUrl={s.profile["avatar"] || s.profile["logoUrl"] || s.profile["photoUrl"]}
                      name={name}
                      portal={activePortal}
                      size="md"
                    />
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
                    className="flex items-center gap-2 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    <UserAvatar
                      avatarUrl={s.profile["avatar"] || s.profile["logoUrl"] || s.profile["photoUrl"]}
                      name={name}
                      portal={activePortal}
                      size="md"
                    />
                  </button>
                </SheetTrigger>
                <SheetContent
                  side="bottom"
                  className="rounded-t-[28px] border-t border-border/80 bg-card max-h-[85vh] overflow-y-auto px-4 pb-6 pt-2 shadow-2xl focus:outline-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>button]:top-3.5 [&>button]:right-4 [&>button]:h-7 [&>button]:w-7 [&>button]:grid [&>button]:place-items-center [&>button]:rounded-full [&>button]:bg-muted/80 [&>button]:text-muted-foreground [&>button]:hover:text-foreground [&>button]:hover:bg-muted"
                >
                  {/* Centered Drag Handle with balanced breathing room */}
                  <div className="relative flex items-center justify-center pt-2 pb-3.5 shrink-0">
                    <div className="h-1.5 w-12 rounded-full bg-muted-foreground/30" />
                  </div>
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
        </div>
      </header>
      <main className="px-4 sm:px-6 lg:px-8 py-5 sm:py-8 animate-in fade-in duration-300 w-full min-w-0"><RequestError message={profileLoad.error ? `Profile details: ${profileLoad.error}` : null} onRetry={profileLoad.retry} />{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t bg-card/98 backdrop-blur md:hidden">
        {nav.map((n) => {
          const isPostOpening = n.to === "/employer/post" && (path === "/employer/post" || path === "/employer/post-shift");
          const on = isPostOpening || path === n.to || (n.to !== "/employer" && n.to !== "/admin" && path.startsWith(n.to + "/"));
          const Icon = on ? n.active : n.icon;
          const shortLabel = "shortLabel" in n ? (n as any).shortLabel : n.label;
          return (
            <Link
              key={n.to}
              to={n.to}
              preload="intent"
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium transition-all active:scale-95 min-w-0 px-0.5 whitespace-nowrap",
                on ? "text-primary font-bold" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5 shrink-0" />
                {"badge" in n && Number(n.badge) > 0 && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] items-center justify-center rounded-full bg-primary px-0.5 text-[8px] font-bold text-white">
                    {n.badge}
                  </span>
                )}
              </div>
              <span className="truncate max-w-full text-center">{shortLabel}</span>
            </Link>
          );
        })}
      </nav>

      {/* Portal switch confirmation dialog for API mode */}
      <AlertDialog open={!!pendingPortalSwitch} onOpenChange={(open) => !open && setPendingPortalSwitch(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Switch Portal</AlertDialogTitle>
            <AlertDialogDescription>
              Switching to the {pendingPortalSwitch === "facility" ? "Hospital / Facility" : pendingPortalSwitch === "admin" ? "Admin Operations" : "Candidate"} portal requires authenticating with an authorized account.
              You will be signed out of your current session.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingPortalSwitch(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPortalSwitch} className="bg-primary text-primary-foreground font-bold">
              Sign Out & Switch
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Floating Flow AI Assistant */}
      <FlowAIFloatingButton />
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
    ["Withdrawn", "Rejected", "Not Selected", "Declined", "Disputed", "No-Show"].includes(status)
      ? "bg-rose-50 text-rose-700 border border-rose-200/60 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/50"
      : status === "Position Filled" || status === "Slot Filled"
        ? "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700"
        : ["Hired", "Verified", "Approved", "Paid", "Confirmed", "Completed"].includes(status)
          ? "bg-success-soft text-success"
          : ["Interview", "Shortlisted", "Open", "Offer"].includes(status)
            ? "bg-primary-soft text-primary"
            : ["Claimed", "Checked In", "Timesheet Submitted"].includes(status)
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20"
              : ["Under review", "New", "Applied", "Pending", "Draft"].includes(status)
                ? "bg-warning-soft text-warning"
                : "bg-muted text-muted-foreground";
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold", tone)}>{status}</span>;
}
