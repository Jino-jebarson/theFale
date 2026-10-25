import { useState } from "react";
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

type NotificationCategory = "all" | "shifts" | "jobs" | "cme" | "credentials";

interface NotificationItem {
  id: string;
  category: "shifts" | "jobs" | "cme" | "credentials";
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

const initialNotifications: NotificationItem[] = [
  {
    id: "notif_1",
    category: "shifts",
    title: "Urgent ICU Night Shift Request",
    hospital: "Apollo Speciality Hospitals",
    hospitalCode: "AP",
    hospitalGradient: "from-blue-600 to-indigo-700",
    message: "Critical care unit requires an immediate on-call Cardiology physician for telemetry monitoring and emergency bed coverage.",
    time: "10m ago",
    unread: true,
    urgent: true,
    matchScore: 98,
    payout: "₹7,500 Instant Payout",
    shiftTiming: "Today, 08:00 PM – 08:00 AM (12h)",
    actionType: "accept_shift",
    actionLabel: "Accept Shift",
  },
  {
    id: "notif_2",
    category: "jobs",
    title: "Hospital Interview Scheduled — Medical Board Round",
    hospital: "Manipal Hospital, Whitefield",
    hospitalCode: "MH",
    hospitalGradient: "from-teal-600 to-emerald-700",
    message: "Medical Superintendent Dr. S. Rao scheduled your interview for the Senior Resident — Cardiology appointment.",
    time: "42m ago",
    unread: true,
    urgent: false,
    matchScore: 94,
    shiftTiming: "Tomorrow, 11:30 AM via FALE Tele-Room",
    actionType: "confirm_interview",
    actionLabel: "Confirm Attendance",
  },
  {
    id: "notif_3",
    category: "cme",
    title: "CME Digital Certificate Issued & Verified",
    hospital: "FALE Clinical Academy",
    hospitalCode: "FA",
    hospitalGradient: "from-amber-500 to-orange-600",
    message: "You completed '1.1 The High-Risk Shift Handover Vulnerability'. +1.5 CME Points accredited to your clinical profile.",
    time: "2h ago",
    unread: true,
    actionType: "view_cert",
    actionLabel: "View Certificate",
    actionLink: "/learning/c4",
  },
  {
    id: "notif_4",
    category: "credentials",
    title: "DigiLocker Medical Registration Authenticated",
    hospital: "Tamil Nadu Medical Council",
    hospitalCode: "TN",
    hospitalGradient: "from-purple-600 to-indigo-700",
    message: "License TNMC-2023-8829 has passed cryptographic cross-verification with National Medical Commission records. Tier-1 badge activated.",
    time: "5h ago",
    unread: false,
    actionType: "view_doc",
    actionLabel: "View in Vault",
    actionLink: "/profile",
  },
  {
    id: "notif_5",
    category: "jobs",
    title: "Fortis Recruiter Shortlisted Your Profile",
    hospital: "Fortis Healthcare Network",
    hospitalCode: "FH",
    hospitalGradient: "from-rose-600 to-red-700",
    message: "Head of Critical Care reviewed your clinical dossier and shortlisted your application for Interventional Cardiology Fellow openings.",
    time: "1d ago",
    unread: false,
    matchScore: 91,
    actionType: "view_hospital",
    actionLabel: "Track Application",
    actionLink: "/applications",
  },
  {
    id: "notif_6",
    category: "shifts",
    title: "Shift Payout Dispatched & Deposited",
    hospital: "Kauvery Hospital, Chennai",
    hospitalCode: "KH",
    hospitalGradient: "from-cyan-600 to-blue-700",
    message: "Compensation of ₹6,200 for your 8-hour ER coverage on 17 Oct has been processed directly to your registered bank account.",
    time: "2d ago",
    unread: false,
    statusText: "UTR: FALE-998240-IN • ₹6,200 Deposited",
  },
];

function NotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>(initialNotifications);
  const [selectedCategory, setSelectedCategory] = useState<NotificationCategory>("all");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);
  const [acceptedShifts, setAcceptedShifts] = useState<string[]>([]);
  const [confirmedInterviews, setConfirmedInterviews] = useState<string[]>([]);

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

  const markAllAsRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, unread: false })));
    toast.success("All notifications marked as read!");
  };

  const toggleItemRead = (id: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: !item.unread } : item))
    );
  };

  const deleteItem = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.info("Notification removed");
  };

  const handleAcceptShift = (id: string, hospital: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setAcceptedShifts((prev) => [...prev, id]);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
    toast.success("Clinical Shift Confirmed!", {
      description: `Your QR digital pass for ${hospital} has been dispatched to WhatsApp.`,
    });
  };

  const handleConfirmInterview = (id: string, hospital: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmedInterviews((prev) => [...prev, id]);
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, unread: false } : item))
    );
    toast.success("Interview Attendance Confirmed!", {
      description: `Calendar invite & FALE Tele-Room link generated for ${hospital}.`,
    });
  };

  const getSubBadgeIcon = (category: NotificationItem["category"]) => {
    switch (category) {
      case "shifts":
        return <HiOutlineClock className="h-3 w-3 text-white" />;
      case "jobs":
        return <HiOutlineBriefcase className="h-3 w-3 text-white" />;
      case "cme":
        return <HiOutlineAcademicCap className="h-3 w-3 text-white" />;
      case "credentials":
        return <HiOutlineShieldCheck className="h-3 w-3 text-white" />;
    }
  };

  const getSubBadgeBg = (category: NotificationItem["category"]) => {
    switch (category) {
      case "shifts":
        return "bg-emerald-500";
      case "jobs":
        return "bg-blue-600";
      case "cme":
        return "bg-amber-500";
      case "credentials":
        return "bg-purple-600";
    }
  };

  return (
    <AppShell>
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
              Real-time on-call shifts, hospital recruitment requests, and verified credentials.
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
            <Button
              variant="outline"
              size="sm"
              asChild
              className="flex-1 sm:flex-initial rounded-xl font-bold text-xs border-border/80 h-8 sm:h-9 justify-center"
            >
              <Link to="/profile">
                <span className="hidden sm:inline">View Profile Vault</span>
                <span className="sm:hidden">Profile Vault</span>
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
          <aside className="space-y-4 w-full min-w-0">
            {/* Quick Filter Navigation Card */}
            <div className="surface p-4 rounded-3xl border border-border/80 space-y-2 shadow-card min-w-0">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground px-2">
                Manage Notifications
              </h2>
              <nav className="space-y-1">
                {(
                  [
                    { id: "all", label: "All Alerts", count: items.length, icon: HiOutlineBell },
                    { id: "shifts", label: "On-Call Shifts", count: items.filter((x) => x.category === "shifts").length, icon: HiOutlineClock },
                    { id: "jobs", label: "Interviews & Jobs", count: items.filter((x) => x.category === "jobs").length, icon: HiOutlineBriefcase },
                    { id: "cme", label: "CME & Accreditations", count: items.filter((x) => x.category === "cme").length, icon: HiOutlineAcademicCap },
                    { id: "credentials", label: "Verified Credentials", count: items.filter((x) => x.category === "credentials").length, icon: HiOutlineShieldCheck },
                  ] as const
                ).map((cat) => {
                  const Icon = cat.icon;
                  const active = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
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

            {/* Naukri-Style Recruiter Pulse Widget */}
            <div className="surface p-4 rounded-3xl border border-border/80 space-y-3 shadow-card bg-gradient-to-br from-card via-card to-primary-soft/40 dark:to-primary-soft/20 min-w-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-foreground flex items-center gap-1.5">
                  <HiOutlineBolt className="h-4 w-4 text-amber-500" /> Recruiter Reach
                </span>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 font-bold text-[10px] px-2 py-0">
                  Top 5%
                </Badge>
              </div>
              <div className="space-y-1">
                <div className="text-xl font-black text-foreground">48 Profile Views</div>
                <p className="text-[11px] text-muted-foreground leading-snug">
                  Apollo, Fortis, and Kauvery hospital recruiters viewed your clinical dossier this week.
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                asChild
                className="w-full rounded-xl text-xs font-bold border-border/80 h-8"
              >
                <Link to="/profile">
                  <span>Boost Visibility</span>
                  <HiOutlineArrowRight className="ml-1 h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

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
                    <span>Urgent Shift SMS</span>
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
            {/* Urgent Red Healthcare Priority Broadcast */}
            {activeShiftAlerts > 0 && (
              <div className="relative overflow-hidden rounded-3xl border border-red-500/30 bg-gradient-to-r from-red-500/10 via-card to-red-500/5 p-4 sm:p-5 shadow-xs flex items-start gap-3.5 min-w-0">
                <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-red-500" />
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-red-500 text-white font-black text-xs shadow-xs animate-pulse">
                  ⚡
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
            )}

            {/* Mobile Category Scroll Pills (Visible on mobile/tablet) */}
            <div className="flex lg:hidden items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 w-full min-w-0">
              {(
                [
                  { id: "all", label: "All Alerts", count: items.length },
                  { id: "shifts", label: "Shifts", count: items.filter((x) => x.category === "shifts").length },
                  { id: "jobs", label: "Interviews", count: items.filter((x) => x.category === "jobs").length },
                  { id: "cme", label: "CME Points", count: items.filter((x) => x.category === "cme").length },
                  { id: "credentials", label: "Vault", count: items.filter((x) => x.category === "credentials").length },
                ] as const
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
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      {/* Hospital Emblem Avatar */}
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="relative shrink-0">
                          <div className={cn(
                            "grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-2xl font-black text-xs sm:text-sm text-white shadow-xs bg-gradient-to-br",
                            n.hospitalGradient
                          )}>
                            {n.hospitalCode}
                          </div>
                          {/* Category Badge Ring on Avatar */}
                          <span className={cn(
                            "absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full border-2 border-card shadow-xs",
                            getSubBadgeBg(n.category)
                          )}>
                            {getSubBadgeIcon(n.category)}
                          </span>
                        </div>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <span className="text-xs font-bold text-foreground truncate max-w-[200px] sm:max-w-none">
                              {n.hospital}
                            </span>
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
                            <span className="text-[11px] text-muted-foreground ml-auto shrink-0 font-medium">
                              {n.time}
                            </span>
                          </div>

                          <h3 className="text-sm sm:text-base font-extrabold text-foreground break-words leading-snug">
                            {n.title}
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
                          <DropdownMenuItem onClick={() => toast.info(`Muted alerts from ${n.hospital}`)}>
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
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border-0 px-3 py-1 text-xs flex items-center gap-1.5">
                              <HiCheckCircle className="h-4 w-4 text-emerald-600" />
                              Shift Accepted • Pass Active
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={(e) => handleAcceptShift(n.id, n.hospital, e)}
                              className="w-full sm:w-auto rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-8 px-4 shadow-xs"
                            >
                              Accept Shift
                            </Button>
                          )
                        )}

                        {/* Interview Confirmation Action */}
                        {n.actionType === "confirm_interview" && (
                          isInterviewConfirmed ? (
                            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border-0 px-3 py-1 text-xs flex items-center gap-1.5">
                              <HiCheckCircle className="h-4 w-4 text-emerald-600" />
                              Confirmed • Added to Calendar
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={(e) => handleConfirmInterview(n.id, n.hospital, e)}
                              className="w-full sm:w-auto rounded-xl font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/95 text-xs h-8 px-4"
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
                            className="w-full sm:w-auto rounded-xl font-bold text-xs border-border/80 h-8 gap-1.5 text-primary hover:text-primary hover:bg-primary-soft"
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
                            className="w-full sm:w-auto rounded-xl font-bold text-xs border-border/80 h-8 gap-1.5"
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
                            className="w-full sm:w-auto rounded-xl font-bold text-xs border-border/80 h-8 gap-1.5"
                          >
                            <Link to={n.actionLink}>
                              <HiOutlineEye className="h-4 w-4 text-primary" />
                              <span>Track Application</span>
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
            </div>
          </main>
        </div>
      </div>
    </AppShell>
  );
}
