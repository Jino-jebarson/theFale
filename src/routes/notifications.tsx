import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { RequestError } from "@/components/fale/RequestError";
import { errorMessage } from "@/lib/errorMessage";
import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlineBell,
  HiBell,
  HiOutlineCheckCircle,
  HiCheckCircle,
  HiOutlineClock,
  HiOutlineBriefcase,
  HiOutlineAcademicCap,
  HiOutlineShieldCheck,
  HiOutlineEye,
  HiOutlineBuildingOffice2,
  HiOutlineXMark,
  HiOutlineFunnel,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineChatBubbleBottomCenterText,
  HiOutlineDevicePhoneMobile,
  HiOutlineEnvelope,
  HiOutlineEllipsisHorizontal,
  HiOutlineBolt,
  HiOutlineTrash,
  HiOutlineBellSlash,
  HiOutlineCalendarDays,
  HiOutlineDocumentCheck,
  HiOutlineChatBubbleLeftRight,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell } from "@/components/fale/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useApp, setUnreadNotificationCount } from "@/lib/store";
import { isApiEnabled } from "@/lib/api";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications as clearAllNotificationsApi,
} from "@/lib/adapters/notificationAdapter";
import {
  getCandidateViewStats,
  type CandidateViewStats,
} from "@/lib/adapters/candidateAdapter";

function stripEmojis(text: string): string {
  if (!text) return "";
  return text
    .replace(/[\p{Extended_Pictographic}\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]/gu, "")
    .replace(/⚡|👁️|🛡️|🎓|💼/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications & Clinical Alerts — FALE" },
      { name: "description", content: "LinkedIn, Naukri, and Apple standard clinical alerts, hospital interview invitations, CME qualifications, and on-call shift requests." },
      { property: "og:title", content: "Notifications — FALE Healthcare" },
      { property: "og:description", content: "Real-time clinical alerts, shift requests, and recruiter updates." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: NotificationsPage,
});

type NotificationCategory = "all" | "shifts" | "jobs" | "cme" | "credentials" | "huddle";

interface NotificationItem {
  id: string;
  category: "shifts" | "jobs" | "cme" | "credentials" | "huddle";
  title: string;
  hospital: string;
  hospitalCode: string;
  hospitalGradient: string;
  message: string;
  time: string;
  unread: boolean;
  urgent?: boolean;
  matchScore?: number;
  payout?: string;
  shiftTiming?: string;
  actionType?: "accept_shift" | "confirm_interview" | "view_cert" | "view_doc" | "view_hospital";
  actionLabel?: string;
  actionLink?: string;
  statusText?: string;
}


function NotificationsPage() {
  const notificationAction = useConfirmedAction();
  const s = useApp();
  const candidateLevel = s.candidateLevel || (s.profile["level"] as any) || (s.profile["cadreLevel"] as any) || (s.profile["exp"] === "Fresher" ? "fresher" : "professional");
  const isStudent = candidateLevel === "student";

  const [items, setItems] = useState<NotificationItem[]>(() =>
    []
  );
  const [loading, setLoading] = useState(isApiEnabled);
  const [reloadVersion, setReloadVersion] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [acceptedShifts, setAcceptedShifts] = useState<string[]>([]);
  const [confirmedInterviews, setConfirmedInterviews] = useState<string[]>([]);
  const [viewStats, setViewStats] = useState<CandidateViewStats>({
    totalViews: 0,
    viewsToday: 0,
    hospitalsViewedToday: 0,
    weeklyGrowthPercent: 0,
    hasIncreased: false,
  });

  useEffect(() => {
    if (s.portal !== "candidate") return;
    getCandidateViewStats()
      .then((data) => {
        if (data && data.totalViews != null) {
          setViewStats(data);
        }
      })
      .catch((err) => console.warn("Failed to load candidate view stats:", err));
  }, [s.portal]);

  useEffect(() => {
    setLoading(true);
    getNotifications()
      .then((apiNotifs) => {
        let list = apiNotifs || [];
        try {
          const clearedAt = Number(localStorage.getItem("fale_admin_cleared_at") || 0);
          const dismissed = new Set(JSON.parse(localStorage.getItem("fale_dismissed_notifs") || "[]"));
          if (s.portal === "admin" && clearedAt > 0) {
            list = list.filter((n) => {
              if (dismissed.has(n.id)) return false;
              const created = (n as any).createdAt ? new Date((n as any).createdAt).getTime() : 0;
              return created > clearedAt;
            });
          }
        } catch {}
        const mapped: NotificationItem[] = list.map((n) => {
          const rawType = ((n.type || "") as string).toUpperCase();
          let category: NotificationCategory = "jobs";
          let hospital = "FALE Healthcare Network";
          let hospitalCode = "FL";
          let hospitalGradient = "from-blue-600 to-indigo-700";
          let urgent = false;
          let actionLink = n.actionLink || (n as any).actionUrl || undefined;

          if (rawType === "ADMIN_KYC") {
            category = "credentials";
            hospital = "FALE Doctor Credential Board";
            hospitalCode = "KYC";
            hospitalGradient = "from-amber-600 to-orange-700";
            urgent = true;
          } else if (rawType === "ADMIN_FACILITY") {
            category = "credentials";
            hospital = "FALE Facility Verification";
            hospitalCode = "HSP";
            hospitalGradient = "from-blue-600 to-indigo-700";
            urgent = true;
          } else if (rawType === "ADMIN_POSTING") {
            category = "jobs";
            hospital = "FALE Job Compliance";
            hospitalCode = "JOB";
            hospitalGradient = "from-purple-600 to-indigo-700";
          } else if (rawType === "ADMIN_SUPPORT") {
            category = "jobs";
            hospital = "FALE Escalation Desk";
            hospitalCode = "SP";
            hospitalGradient = "from-rose-600 to-red-700";
            urgent = true;
          } else if (rawType === "ADMIN_HUDDLE") {
            category = "huddle";
            hospital = "FALE Community Safety";
            hospitalCode = "MOD";
            hospitalGradient = "from-red-600 to-amber-700";
            urgent = true;
          } else if (rawType === "ADMIN_PAYOUT") {
            category = "shifts";
            hospital = "FALE Escrow Clearance";
            hospitalCode = "₹";
            hospitalGradient = "from-emerald-600 to-teal-700";
          } else if (rawType.includes("SHIFT") || rawType === "PAYOUT") {
            category = "shifts";
            if (rawType === "PAYOUT") {
              hospital = "FALE Escrow Settlement";
              hospitalCode = "₹";
              hospitalGradient = "from-emerald-600 to-teal-700";
            } else if (rawType === "SHIFT_URGENT" || n.title.includes("Urgent")) {
              hospital = "Emergency Surge Shift";
              hospitalCode = "ER";
              hospitalGradient = "from-amber-600 to-rose-700";
              urgent = true;
            } else {
              hospital = "Locum Shift Operations";
              hospitalCode = "LS";
              hospitalGradient = "from-blue-600 to-cyan-700";
            }
          } else if (rawType.includes("HUDDLE")) {
            category = "huddle";
            hospital = "FALE Clinical Huddle";
            hospitalCode = "HD";
            hospitalGradient = "from-purple-600 to-indigo-700";
          } else if (rawType.includes("KYC") || rawType.includes("UPGRADE") || rawType.includes("PROFILE_VIEW")) {
            category = "credentials";
            hospital = rawType === "PROFILE_VIEW" ? "Institutional Reach" : "FALE Compliance Board";
            hospitalCode = rawType === "PROFILE_VIEW" ? "PR" : "KYC";
            hospitalGradient = "from-emerald-600 to-teal-800";
          } else if (rawType === "SUPPORT") {
            hospital = "FALE Help & Support";
            hospitalCode = "SP";
            hospitalGradient = "from-amber-600 to-orange-700";
          } else if (rawType === "WALLET") {
            category = "shifts";
            hospital = "Hospital Escrow Vault";
            hospitalCode = "ESC";
            hospitalGradient = "from-rose-600 to-amber-700";
            urgent = true;
          }

          return {
            id: n.id,
            category,
            title: stripEmojis(n.title),
            hospital,
            hospitalCode,
            hospitalGradient,
            message: stripEmojis(n.message),
            time: (n as any).createdAt
              ? new Date((n as any).createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recently",
            unread: Boolean((n as any).unread ?? !(n as any).read ?? !(n as any).isRead),
            urgent,
            actionLink,
          };
        });
        setItems(mapped);
        setUnreadNotificationCount(mapped.filter((x) => x.unread).length);
        setLoadError(null);
      })
      .catch((err) => {
        console.error("Failed to load notifications:", err);
        setLoadError("Unable to load notifications.");
        setItems([]);
        setUnreadNotificationCount(0);
      })
      .finally(() => setLoading(false));
  }, [reloadVersion]);

  // Dispatch preferences
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [urgentSms, setUrgentSms] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);

  const unreadCount = items.filter((n) => n.unread).length;
  const activeShiftAlerts = items.filter((n) => n.category === "shifts" && n.urgent).length;

  const filteredItems = items.filter((item) => {
    if (selectedCategory !== "all" && item.category !== selectedCategory) return false;
    if (showUnreadOnly && !item.unread) return false;
    return true;
  });

  const markAllAsRead = async () => {
    await notificationAction.run(async () => {
      await markAllNotificationsRead();
      setItems((previous) => previous.map((item) => ({ ...item, unread: false })));
      setUnreadNotificationCount(0);
      toast.success("Notifications marked as read");
    });
  };

  const clearAllNotifications = async () => {
    await notificationAction.run(async () => {
      await clearAllNotificationsApi();
      setItems([]); setUnreadNotificationCount(0);
      toast.success("Notifications cleared");
    });
  };

  const toggleItemRead = async (id: string) => {
    const target = items.find((item) => item.id === id);
    if (!target) return;
    if (!target.unread) { toast.info("Marking notifications unread is not available."); return; }
    await notificationAction.run(async () => {
      await markNotificationRead(id);
      const updated = items.map((item) => item.id === id ? { ...item, unread: false } : item);
      setItems(updated); setUnreadNotificationCount(updated.filter((item) => item.unread).length);
    });
  };

  const deleteItem = async (id: string, event?: React.MouseEvent) => {
    event?.stopPropagation();
    await notificationAction.run(async () => {
      await deleteNotification(id);
      const updated = items.filter((item) => item.id !== id);
      setItems(updated); setUnreadNotificationCount(updated.filter((item) => item.unread).length);
      toast.success("Notification removed");
    });
  };

  const handleAcceptShift = (_id: string, _hospital: string, event: React.MouseEvent) => { event.stopPropagation(); window.location.assign("/shifts"); };

  const handleConfirmInterview = (_id: string, _hospital: string, event: React.MouseEvent) => { event.stopPropagation(); window.location.assign("/applications"); };

  const getSubBadgeIcon = (category: NotificationItem["category"]) => {
    switch (category) {
      case "shifts":
        return <HiOutlineClock className="h-3 w-3 text-white" />;
      case "jobs":
        return <HiOutlineBriefcase className="h-3 w-3 text-white" />;
      case "huddle":
        return <HiOutlineChatBubbleLeftRight className="h-3 w-3 text-white" />;
      case "cme":
        return <HiOutlineAcademicCap className="h-3 w-3 text-white" />;
      case "credentials":
        return <HiOutlineShieldCheck className="h-3 w-3 text-white" />;
      default:
        return <HiOutlineBell className="h-3 w-3 text-white" />;
    }
  };

  const getSubBadgeBg = (category: NotificationItem["category"]) => {
    switch (category) {
      case "shifts":
        return "bg-emerald-500";
      case "jobs":
        return "bg-blue-600";
      case "huddle":
        return "bg-purple-600";
      case "cme":
        return "bg-amber-500";
      case "credentials":
        return "bg-teal-600";
      default:
        return "bg-primary";
    }
  };

  const renderHospitalEmblem = (n: NotificationItem) => {
    if (n.hospitalCode === "ER") {
      return <HiOutlineBolt className="h-5 w-5 text-white" />;
    }
    if (n.hospitalCode === "PR") {
      return <HiOutlineEye className="h-5 w-5 text-white" />;
    }
    if (n.hospitalCode === "ESC") {
      return <HiOutlineBriefcase className="h-5 w-5 text-white" />;
    }
    return <span>{n.hospitalCode}</span>;
  };

  return (
    <AppShell>
      <fieldset disabled={notificationAction.isPending} className="contents">
      <RequestError message={loadError} onRetry={() => setReloadVersion((version) => version + 1)} retrying={loading} />
      <RequestError message={notificationAction.error} />
      <div className="w-full max-w-6xl mx-auto space-y-5 pb-8 min-w-0">
        {/* ========================================================= */}
        {/* TOP BAR: LINKEDIN / APPLE HEADER                          */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4 min-w-0">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <span className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl sm:rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white shadow-brand">
                <HiBell className="h-4 w-4 sm:h-5 sm:w-5" />
              </span>
              <h1 className="text-lg sm:text-2xl font-black text-foreground tracking-tight truncate min-w-0 flex-1">
                <span className="hidden sm:inline">Notifications & Clinical Hub</span>
                <span className="sm:hidden">Notifications</span>
              </h1>
              {unreadCount > 0 && (
                <Badge className="bg-primary text-primary-foreground font-bold text-xs px-2.5 py-0.5 rounded-full shrink-0 whitespace-nowrap">
                  {unreadCount} unread
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {isStudent
                ? "Real-time clinical internship invitations, educational stipend credits, and academic credential alerts."
                : "Real-time on-call shifts, hospital recruitment requests, and verified credentials."}
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="flex-1 sm:flex-initial rounded-xl font-bold text-xs border-border/80 h-8 sm:h-9 hover:text-primary justify-center"
              >
                <HiOutlineCheckCircle className="mr-1.5 h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">Mark all as read</span>
                <span className="sm:hidden">Mark read</span>
              </Button>
            )}
            {items.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllNotifications}
                className="flex-1 sm:flex-initial rounded-xl font-bold text-xs border-border/80 text-muted-foreground hover:text-destructive h-8 sm:h-9 justify-center"
              >
                <HiOutlineTrash className="mr-1.5 h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear all</span>
                <span className="sm:hidden">Clear</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-1 sm:flex-initial rounded-xl font-bold text-xs border-border/80 h-8 sm:h-9 justify-center"
            >
              <Link to={s.portal === "facility" ? "/employer/profile" : s.portal === "admin" ? "/admin" : "/profile"}>
                <span className="hidden sm:inline">
                  {s.portal === "facility" ? "Hospital Profile" : s.portal === "admin" ? "Admin Console" : "View Profile Vault"}
                </span>
                <span className="sm:hidden">
                  {s.portal === "facility" ? "Profile" : s.portal === "admin" ? "Admin" : "Profile Vault"}
                </span>
              </Link>
            </Button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2-COLUMN LAYOUT: LINKEDIN/NAUKRI SIDEBAR + APPLE FEED     */}
        {/* ========================================================= */}
        <div className="grid gap-6 lg:grid-cols-[280px_1fr] items-start min-w-0 w-full">
          {/* ======================================================= */}
          {/* LEFT SIDEBAR: MANAGE & RECRUITER METRICS (LINKEDIN/NAUKRI) */}
          {/* ======================================================= */}
          <aside className="hidden lg:block space-y-4 w-full min-w-0">
            {/* Quick Filter Navigation Card */}
            <div className="surface p-4 rounded-3xl border border-border/80 space-y-2 shadow-card min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
                Manage Notifications
              </h2>
              <nav className="space-y-1">
                {(
                  s.portal === "admin"
                    ? [
                      { id: "all", label: "All Moderation Alerts", count: items.length, icon: HiOutlineBell },
                      { id: "credentials", label: "KYC & Hospital Approvals", count: items.filter((x) => x.category === "credentials").length, icon: HiOutlineShieldCheck },
                      { id: "jobs", label: "Jobs & Support Desks", count: items.filter((x) => x.category === "jobs").length, icon: HiOutlineBriefcase },
                      { id: "shifts", label: "Escrow Settlements", count: items.filter((x) => x.category === "shifts").length, icon: HiOutlineClock },
                      { id: "huddle", label: "Huddle Moderation", count: items.filter((x) => x.category === "huddle").length, icon: HiOutlineChatBubbleLeftRight },
                    ]
                    : isStudent
                      ? [
                        { id: "all", label: "All Alerts", count: items.length, icon: HiOutlineBell },
                        { id: "shifts", label: "Stipends & Rotations", count: items.filter((x) => x.category === "shifts").length, icon: HiOutlineClock },
                        { id: "jobs", label: "Internships & Viva", count: items.filter((x) => x.category === "jobs").length, icon: HiOutlineBriefcase },
                        { id: "huddle", label: "Huddle Community", count: items.filter((x) => x.category === "huddle").length, icon: HiOutlineChatBubbleLeftRight },
                        { id: "cme", label: "Student CME", count: items.filter((x) => x.category === "cme").length, icon: HiOutlineAcademicCap },
                        { id: "credentials", label: "Bona Fide Vault", count: items.filter((x) => x.category === "credentials").length, icon: HiOutlineShieldCheck },
                      ]
                      : [
                        { id: "all", label: "All Alerts", count: items.length, icon: HiOutlineBell },
                        { id: "shifts", label: "On-Call Shifts", count: items.filter((x) => x.category === "shifts").length, icon: HiOutlineClock },
                        { id: "jobs", label: "Interviews & Jobs", count: items.filter((x) => x.category === "jobs").length, icon: HiOutlineBriefcase },
                        { id: "huddle", label: "Huddle Community", count: items.filter((x) => x.category === "huddle").length, icon: HiOutlineChatBubbleLeftRight },
                        { id: "cme", label: "CME & Accreditations", count: items.filter((x) => x.category === "cme").length, icon: HiOutlineAcademicCap },
                        { id: "credentials", label: "Verified Credentials", count: items.filter((x) => x.category === "credentials").length, icon: HiOutlineShieldCheck },
                      ]
                ).map((cat) => {
                  const Icon = cat.icon;
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id as NotificationCategory)}
                      className={cn(
                        "w-full flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all cursor-pointer",
                        active
                          ? "bg-primary text-primary-foreground shadow-xs"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <span className="flex items-center gap-2.5 truncate">
                        <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary-foreground" : "text-primary")} />
                        <span className="truncate">{cat.label}</span>
                      </span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-black shrink-0",
                        active ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                      )}>
                        {cat.count}
                      </span>
                    </button>
                  );
                })}
              </nav>

              <div className="pt-2 border-t border-border/70 flex items-center justify-between px-2 text-xs font-semibold text-muted-foreground">
                <span>Filter Unread</span>
                <Switch
                  checked={showUnreadOnly}
                  onCheckedChange={setShowUnreadOnly}
                  className="scale-90"
                />
              </div>
            </div>

            {/* Naukri-Style Recruiter Pulse Widget - Shown Only to Candidates with Dynamic View Stats */}
            {s.portal === "candidate" && (
              <div className="surface p-4 rounded-3xl border border-border/80 space-y-3 shadow-card bg-gradient-to-br from-card via-card to-primary-soft/40 dark:to-primary-soft/20 min-w-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-extrabold text-foreground flex items-center gap-1.5">
                    <HiOutlineBolt className="h-4 w-4 text-amber-500" /> {isStudent ? "Academic Reach" : "Recruiter Reach"}
                  </span>
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 font-bold text-[10px] px-2 py-0">
                    {viewStats.weeklyGrowthPercent > 0
                      ? `+${viewStats.weeklyGrowthPercent}% wk`
                      : isStudent
                        ? "Top Intern"
                        : "Top 5%"}
                  </Badge>
                </div>
                <div className="space-y-1">
                  <div className="text-xl font-black text-foreground">
                    {viewStats.totalViews > 0
                      ? `${viewStats.totalViews} ${isStudent ? "Faculty Views" : "Profile Views"}`
                      : isStudent
                        ? "Student Profile Active"
                        : "Profile Active"}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-snug">
                    {viewStats.hospitalsViewedToday > 0
                      ? `${viewStats.hospitalsViewedToday} hospital recruiter${viewStats.hospitalsViewedToday === 1 ? "" : "s"} viewed your clinical dossier today.`
                      : viewStats.totalViews > 0
                        ? `Hospital recruiters viewed your profile ${viewStats.totalViews} times.`
                        : isStudent
                          ? "Profile views will appear here when a facility visits your profile."
                          : "Profile views will appear here when a facility visits your profile."}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  asChild
                  className="w-full rounded-xl text-xs font-bold border-border/80 h-8 hover:text-primary hover:border-primary/50 transition-colors"
                >
                  <Link to="/profile">
                    <span>{isStudent ? "Update Logbook" : "Boost Visibility"}</span>
                    <HiOutlineArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Link>
                </Button>
              </div>
            )}

            {/* Instant Delivery Channels (Apple Style Glassmorphic Toggles) */}
            <div className="surface p-4 rounded-3xl border border-border/80 space-y-3 shadow-card text-xs min-w-0">
              <h3 className="font-extrabold text-foreground flex items-center gap-1.5">
                <HiOutlineSparkles className="h-4 w-4 text-primary" /> Delivery Channels
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-2 text-muted-foreground font-medium">
                    <HiOutlineChatBubbleBottomCenterText className="h-4 w-4 text-emerald-600" />
                    <span>WhatsApp Passes</span>
                  </span>
                  <Switch checked={whatsappAlerts} onCheckedChange={setWhatsappAlerts} className="scale-75" />
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-2 text-muted-foreground font-medium">
                    <HiOutlineDevicePhoneMobile className="h-4 w-4 text-primary" />
                    <span>{isStudent ? "Stipend SMS Alerts" : "Urgent Shift SMS"}</span>
                  </span>
                  <Switch checked={urgentSms} onCheckedChange={setUrgentSms} className="scale-75" />
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="flex items-center gap-2 text-muted-foreground font-medium">
                    <HiOutlineEnvelope className="h-4 w-4 text-amber-500" />
                    <span>Daily Summary</span>
                  </span>
                  <Switch checked={emailDigest} onCheckedChange={setEmailDigest} className="scale-75" />
                </div>
              </div>
            </div>
          </aside>

          {/* ======================================================= */}
          {/* MAIN COLUMN: NOTIFICATION FEED (APPLE + LINKEDIN STYLE)  */}
          {/* ======================================================= */}
          <main className="space-y-4 w-full min-w-0">
            {/* Urgent Priority Broadcast */}
            {s.portal === "admin" ? (
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-card to-amber-500/5 p-3.5 sm:p-5 shadow-xs flex items-start gap-3 sm:gap-3.5 min-w-0">
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-amber-500" />
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-amber-500 text-white shadow-xs">
                  <HiOutlineShieldCheck className="h-5 w-5 text-white" />
                </span>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                      FALE Admin Operations & Compliance Hub
                    </span>
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 font-bold border-0 text-[10px] px-2 py-0">
                      Super Admin
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug break-words">
                    Real-time compliance triggers for clinician medical council KYC, hospital establishment approvals, rate moderation, and clinical dispute tickets.
                  </p>
                </div>
              </div>
            ) : isStudent ? (
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-primary/5 p-3.5 sm:p-5 shadow-xs flex items-start gap-3 sm:gap-3.5 min-w-0">
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-primary" />
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-xs">
                  <HiOutlineAcademicCap className="h-5 w-5 text-white" />
                </span>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-primary uppercase tracking-wider">
                      Clinical Internship & Rotational Posting Alert
                    </span>
                    <Badge className="bg-primary-soft text-primary font-bold border-0 text-[10px] px-2 py-0">
                      Accredited
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug break-words">
                    Explore internships and check each posting for its current availability and stipend.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400">View internship details</span>
                    <span className="text-muted-foreground"></span>
                  </div>
                </div>
              </div>
            ) : activeShiftAlerts > 0 ? (
              <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-red-500/30 bg-gradient-to-r from-red-500/10 via-card to-red-500/5 p-3.5 sm:p-5 shadow-xs flex items-start gap-3 sm:gap-3.5 min-w-0">
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-500" />
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-500 text-white shadow-xs animate-pulse">
                  <HiOutlineBolt className="h-5 w-5 text-white" />
                </span>
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                      Hospital Emergency Code Alert
                    </span>
                    <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 font-bold border-0 text-[10px] px-2 py-0">
                      High Demand
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-foreground leading-snug break-words">
                    Apollo Speciality Greams Road ER requested immediate on-call Cardiac Physician coverage for evening resuscitation trauma rotation.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-3 text-xs">
                    <span className="font-extrabold text-red-600 dark:text-red-400">₹7,500 Instant Payout</span>
                    <span className="text-muted-foreground">• 12h Overnight ICU coverage</span>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Mobile Category Scroll Pills & Unread Toggle (Visible on mobile/tablet) */}
            <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -mx-4 px-4 sm:mx-0 sm:px-0 w-full min-w-0">
              <button
                type="button"
                onClick={() => setShowUnreadOnly((prev) => !prev)}
                className={cn(
                  "rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border shrink-0",
                  showUnreadOnly
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-card text-muted-foreground border-border/70 hover:bg-muted hover:text-foreground"
                )}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                    showUnreadOnly ? "bg-white/20 text-white" : "bg-primary/10 text-primary"
                  )}>
                    {unreadCount}
                  </span>
                )}
              </button>
              {(
                s.portal === "admin"
                  ? [
                    { id: "all", label: "All Alerts", count: items.length },
                    { id: "credentials", label: "KYC & Approvals", count: items.filter((x) => x.category === "credentials").length },
                    { id: "jobs", label: "Jobs & Support", count: items.filter((x) => x.category === "jobs").length },
                    { id: "shifts", label: "Escrow Settlements", count: items.filter((x) => x.category === "shifts").length },
                    { id: "huddle", label: "Huddle Moderation", count: items.filter((x) => x.category === "huddle").length },
                  ]
                  : isStudent
                    ? [
                      { id: "all", label: "All Alerts", count: items.length },
                      { id: "shifts", label: "Stipends", count: items.filter((x) => x.category === "shifts").length },
                      { id: "jobs", label: "Internships", count: items.filter((x) => x.category === "jobs").length },
                      { id: "cme", label: "Student CME", count: items.filter((x) => x.category === "cme").length },
                      { id: "credentials", label: "Vault", count: items.filter((x) => x.category === "credentials").length },
                    ]
                    : [
                      { id: "all", label: "All Alerts", count: items.length },
                      { id: "shifts", label: "Shifts", count: items.filter((x) => x.category === "shifts").length },
                      { id: "jobs", label: "Interviews", count: items.filter((x) => x.category === "jobs").length },
                      { id: "cme", label: "CME Points", count: items.filter((x) => x.category === "cme").length },
                      { id: "credentials", label: "Vault", count: items.filter((x) => x.category === "credentials").length },
                    ]
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 border shrink-0",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-card text-muted-foreground border-border/70 hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span>{cat.label}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full font-bold",
                    selectedCategory === cat.id ? "bg-white/20 text-white" : "bg-muted text-muted-foreground"
                  )}>
                    {cat.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Notifications Feed Stream */}
            <div className="space-y-3 w-full min-w-0">
              {loading ? (
                <div className="surface p-8 sm:p-14 text-center rounded-3xl border border-border/70 space-y-3">
                  <HiOutlineArrowPath className="mx-auto h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm font-semibold text-muted-foreground">Loading clinical notifications...</p>
                </div>
              ) : loadError ? (
                <div className="surface p-8 text-center rounded-3xl border border-border/70 text-rose-500">
                  <p className="text-sm font-semibold">{loadError}</p>
                </div>
              ) : (
                <>
                  {filteredItems.map((n) => {
                    const isShiftAccepted = acceptedShifts.includes(n.id);
                    const isInterviewConfirmed = confirmedInterviews.includes(n.id);

                    return (
                      <article
                        key={n.id}
                        onClick={() => toggleItemRead(n.id)}
                        className={cn(
                          "group relative surface rounded-2xl sm:rounded-3xl border transition-all duration-200 p-4 sm:p-5.5 cursor-pointer shadow-card space-y-3 min-w-0",
                          n.unread
                            ? "border-primary/40 bg-gradient-to-r from-primary/[0.04] via-card to-card"
                            : "border-border/70 hover:border-border/90 bg-card/90"
                        )}
                      >
                        {/* Unread Left Border Highlight (Apple standard) */}
                        {n.unread && (
                          <span className="absolute left-0 top-3 bottom-3 w-1 bg-primary rounded-r-full" />
                        )}

                        {/* Header Row: Hospital Emblem Avatar + Meta + Action Menu */}
                        <div className="flex items-start justify-between gap-2.5 sm:gap-3 min-w-0">
                          {/* Hospital Emblem Avatar */}
                          <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                            <div className="relative shrink-0">
                              <div className={cn(
                                "grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm text-white shadow-xs bg-gradient-to-br",
                                n.hospitalGradient
                              )}>
                                {renderHospitalEmblem(n)}
                              </div>
                              {/* Category Badge Ring on Avatar */}
                              <span className={cn(
                                "absolute -bottom-1 -right-1 grid h-4.5 w-4.5 sm:h-5 sm:w-5 place-items-center rounded-full border-2 border-card shadow-xs",
                                getSubBadgeBg(n.category)
                              )}>
                                {getSubBadgeIcon(n.category)}
                              </span>
                            </div>

                            <div className="space-y-1 min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-2 min-w-0">
                                <span className="text-xs font-bold text-foreground truncate max-w-[180px] sm:max-w-none">
                                  {n.hospital}
                                </span>
                                <span className="text-[11px] text-muted-foreground shrink-0 font-medium">
                                  {n.time}
                                </span>
                              </div>

                              {(n.matchScore || n.urgent) && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                                  {n.matchScore && (
                                    <Badge className="bg-primary-soft text-primary font-bold border-0 text-[10px] px-1.5 py-0 flex items-center gap-1 shrink-0 whitespace-nowrap">
                                      <HiOutlineSparkles className="h-3 w-3" />
                                      {n.matchScore}% Match
                                    </Badge>
                                  )}
                                  {n.urgent && (
                                    <Badge className="bg-red-500/15 text-red-700 dark:text-red-300 font-bold border-0 text-[10px] px-1.5 py-0 shrink-0 whitespace-nowrap">
                                      Urgent
                                    </Badge>
                                  )}
                                </div>
                              )}

                              <h3 className="text-sm sm:text-base font-extrabold text-foreground break-words leading-snug pt-0.5 flex items-center gap-1.5">
                                {n.urgent && (
                                  <HiOutlineBolt className="h-4 w-4 text-amber-500 shrink-0 inline-block" />
                                )}
                                <span>{stripEmojis(n.title)}</span>
                              </h3>
                            </div>
                          </div>

                          {/* Dropdown Options (LinkedIn 3-dots style) */}
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              onClick={(e) => e.stopPropagation()}
                              className="rounded-xl p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground shrink-0 outline-none focus-visible:ring-1"
                            >
                              <HiOutlineEllipsisHorizontal className="h-5 w-5" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem onClick={() => toggleItemRead(n.id)}>
                                {n.unread ? (
                                  <>
                                    <HiOutlineCheckCircle className="mr-2 h-4 w-4" /> Mark as read
                                  </>
                                ) : (
                                  <>
                                    <HiOutlineBell className="mr-2 h-4 w-4" /> Mark as unread
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => toast.info("This action is unavailable until the service is connected. No changes were made.")}>
                                <HiOutlineBellSlash className="mr-2 h-4 w-4" /> Mute this hospital
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={(e) => deleteItem(n.id, e as unknown as React.MouseEvent)}
                                className="text-destructive focus:text-destructive"
                              >
                                <HiOutlineTrash className="mr-2 h-4 w-4" /> Delete notification
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Message Body */}
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-0 sm:pl-14 pr-1 break-words">
                          {n.message}
                        </p>

                        {/* Rich Meta Box (Shift Timing / Payout / Calendar) */}
                        {(n.payout || n.shiftTiming) && (
                          <div className="ml-0 sm:ml-14 rounded-2xl bg-muted/40 p-2.5 sm:p-3 border border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                            {n.shiftTiming && (
                              <span className="flex items-center gap-1.5 text-foreground font-semibold">
                                <HiOutlineCalendarDays className="h-4 w-4 text-primary shrink-0" />
                                <span>{n.shiftTiming}</span>
                              </span>
                            )}
                            {n.payout && (
                              <span className="font-black text-emerald-600 dark:text-emerald-400">
                                {n.payout}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Interactive Action Row */}
                        <div className="ml-0 sm:ml-14 pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                            {/* Shift Accept Action */}
                            {n.actionType === "accept_shift" && (
                              isShiftAccepted ? (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border-0 px-3 py-1.5 text-xs flex items-center gap-1.5">
                                  <HiCheckCircle className="h-4 w-4 text-emerald-600" />
                                  Shift Accepted • Pass Active
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={(e) => handleAcceptShift(n.id, n.hospital, e)}
                                  className="w-full sm:w-auto rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-9 sm:h-8.5 px-4 shadow-xs justify-center"
                                >
                                  Accept Shift
                                </Button>
                              )
                            )}

                            {/* Interview Confirmation Action */}
                            {n.actionType === "confirm_interview" && (
                              isInterviewConfirmed ? (
                                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border-0 px-3 py-1.5 text-xs flex items-center gap-1.5">
                                  <HiCheckCircle className="h-4 w-4 text-emerald-600" />
                                  Confirmed • Added to Calendar
                                </Badge>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={(e) => handleConfirmInterview(n.id, n.hospital, e)}
                                  className="w-full sm:w-auto rounded-xl font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/95 text-xs h-9 sm:h-8.5 px-4 justify-center"
                                >
                                  Confirm Interview
                                </Button>
                              )
                            )}

                            {/* CME Certificate Link */}
                            {n.actionType === "view_cert" && n.actionLink && (
                              <Button
                                size="sm"
                                asChild
                                variant="outline"
                                className="w-full sm:w-auto rounded-xl font-bold text-xs border-border/80 h-9 sm:h-8.5 gap-1.5 text-primary hover:text-primary hover:bg-primary-soft justify-center"
                              >
                                <Link to={n.actionLink}>
                                  <HiOutlineDocumentCheck className="h-4 w-4" />
                                  <span>View Certificate</span>
                                </Link>
                              </Button>
                            )}

                            {/* Vault Credential Link */}
                            {n.actionType === "view_doc" && n.actionLink && (
                              <Button
                                size="sm"
                                asChild
                                variant="outline"
                                className="w-full sm:w-auto rounded-xl font-bold text-xs border-border/80 h-9 sm:h-8.5 gap-1.5 justify-center"
                              >
                                <Link to={n.actionLink}>
                                  <HiOutlineShieldCheck className="h-4 w-4 text-purple-600" />
                                  <span>View in Vault</span>
                                </Link>
                              </Button>
                            )}

                            {/* Recruiter / Application Link */}
                            {n.actionType === "view_hospital" && n.actionLink && (
                              <Button
                                size="sm"
                                asChild
                                variant="outline"
                                className="w-full sm:w-auto rounded-xl font-bold text-xs border-border/80 h-9 sm:h-8.5 gap-1.5 justify-center"
                              >
                                <Link to={n.actionLink}>
                                  <HiOutlineEye className="h-4 w-4 text-primary" />
                                  <span>Track Application</span>
                                </Link>
                              </Button>
                            )}

                            {/* Direct Action Link for API Notifications */}
                            {n.actionLink && !n.actionType && (
                              <Button
                                size="sm"
                                asChild
                                variant="outline"
                                className="w-full sm:w-auto rounded-xl font-bold text-xs border-border/80 h-9 sm:h-8.5 gap-1.5 text-primary hover:text-primary hover:bg-primary/10 justify-center"
                              >
                                <Link to={n.actionLink}>
                                  <HiOutlineEye className="h-3.5 w-3.5" />
                                  <span>
                                    {n.actionLink === "/admin/candidates"
                                      ? "Review Doctor KYC"
                                      : n.actionLink === "/admin/facilities"
                                        ? "Verify Hospital"
                                        : n.actionLink === "/admin/postings"
                                          ? "Moderate Posting"
                                          : n.actionLink === "/admin/support"
                                            ? "Answer Support Ticket"
                                            : n.actionLink === "/admin/huddle"
                                              ? "Moderate Huddle"
                                              : n.actionLink === "/admin"
                                                ? "Open Admin Console"
                                                : n.actionLink === "/earnings"
                                                  ? "View Escrow Payout"
                                                  : n.actionLink === "/huddle"
                                                    ? "View in Huddle"
                                                    : n.actionLink === "/support"
                                                      ? "Track Support Ticket"
                                                      : n.actionLink === "/shifts"
                                                        ? "View Shifts"
                                                        : n.actionLink === "/profile"
                                                          ? "View Profile"
                                                          : "View Details"}
                                  </span>
                                </Link>
                              </Button>
                            )}

                            {n.statusText && (
                              <span className="text-[11px] font-mono text-muted-foreground font-semibold">
                                {n.statusText}
                              </span>
                            )}
                          </div>

                          {/* Quick Dismiss Button */}
                          <button
                            type="button"
                            onClick={(e) => deleteItem(n.id, e)}
                            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 cursor-pointer self-end sm:self-auto ml-auto sm:ml-0"
                            title="Dismiss alert"
                          >
                            <HiOutlineXMark className="h-4 w-4" />
                            <span>Dismiss</span>
                          </button>
                        </div>
                      </article>
                    );
                  })}

                  {/* Clean Empty State */}
                  {filteredItems.length === 0 && (
                    <div className="surface p-8 sm:p-14 text-center rounded-3xl border border-border/70 space-y-3">
                      <span className="grid h-12 w-12 place-items-center rounded-2xl bg-muted mx-auto text-muted-foreground">
                        <HiOutlineCheckCircle className="h-6 w-6 text-emerald-500" />
                      </span>
                      <h3 className="font-extrabold text-base text-foreground">
                        You're all caught up!
                      </h3>
                      <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                        No active notifications in this category. As hospitals review your qualifications or dispatch emergency shifts, updates will appear here instantly.
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mobile Recruiter Pulse & Delivery Preferences (At bottom of stream on mobile) */}
            <div className="lg:hidden space-y-4 pt-6 border-t border-border/70">
              {s.portal === "candidate" && (
                <div className="surface p-4 rounded-2xl border border-border/80 space-y-3 shadow-card bg-gradient-to-br from-card via-card to-primary-soft/40 min-w-0">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-extrabold text-foreground flex items-center gap-1.5">
                      <HiOutlineBolt className="h-4 w-4 text-amber-500" /> {isStudent ? "Academic Reach" : "Recruiter Reach"}
                    </span>
                    <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 font-bold text-[10px] px-2 py-0">
                      {viewStats.weeklyGrowthPercent > 0
                        ? `+${viewStats.weeklyGrowthPercent}% wk`
                        : isStudent
                          ? "Top Intern"
                          : "Top 5%"}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg font-black text-foreground">
                      {viewStats.totalViews > 0
                        ? `${viewStats.totalViews} ${isStudent ? "Faculty Views" : "Profile Views"}`
                        : isStudent
                          ? "Student Profile Active"
                          : "Profile Active"}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug">
                      {viewStats.hospitalsViewedToday > 0
                        ? `${viewStats.hospitalsViewedToday} hospital recruiter${viewStats.hospitalsViewedToday === 1 ? "" : "s"} viewed your clinical dossier today.`
                        : isStudent
                          ? "Profile views will appear here when a facility visits your profile."
                          : "Profile views will appear here when a facility visits your profile."}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    asChild
                    className="w-full rounded-xl text-xs font-bold border-border/80 h-8.5 hover:text-primary transition-colors justify-center"
                  >
                    <Link to="/profile">
                      <span>{isStudent ? "Update Logbook" : "Boost Visibility"}</span>
                      <HiOutlineArrowRight className="ml-1 h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>
              )}

              {/* Instant Delivery Channels */}
              <div className="surface p-4 rounded-2xl border border-border/80 space-y-3 shadow-card text-xs min-w-0">
                <h3 className="font-extrabold text-foreground flex items-center gap-1.5">
                  <HiOutlineSparkles className="h-4 w-4 text-primary" /> Delivery Channels
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-2 text-muted-foreground font-medium">
                      <HiOutlineChatBubbleBottomCenterText className="h-4 w-4 text-emerald-600" />
                      <span>WhatsApp Passes</span>
                    </span>
                    <Switch checked={whatsappAlerts} onCheckedChange={setWhatsappAlerts} className="scale-75" />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-2 text-muted-foreground font-medium">
                      <HiOutlineDevicePhoneMobile className="h-4 w-4 text-primary" />
                      <span>{isStudent ? "Stipend SMS Alerts" : "Urgent Shift SMS"}</span>
                    </span>
                    <Switch checked={urgentSms} onCheckedChange={setUrgentSms} className="scale-75" />
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <span className="flex items-center gap-2 text-muted-foreground font-medium">
                      <HiOutlineEnvelope className="h-4 w-4 text-amber-500" />
                      <span>Daily Summary</span>
                    </span>
                    <Switch checked={emailDigest} onCheckedChange={setEmailDigest} className="scale-75" />
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </fieldset>
    </AppShell>
  );
}
