import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiArrowRight,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineEye,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineDocumentCheck,
  HiCheckBadge,
  HiOutlineArrowDownTray,
  HiOutlineBolt,
  HiOutlineBriefcase,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineCheckCircle,
  HiOutlineBuildingOffice2,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineQuestionMarkCircle,
  HiOutlineShieldCheck,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineBars3,
  HiOutlineSquares2X2,
} from "react-icons/hi2";
import { RiShieldKeyholeFill, RiVerifiedBadgeFill } from "react-icons/ri";
import { toast } from "sonner";
import { AppShell, StatusBadge, initials } from "@/components/fale/AppShell";
import { ClinicalConciergeWidget, triggerConcierge } from "@/components/fale/ClinicalConciergeWidget";
import { OrgMark } from "@/components/fale/JobCard";
import { Button } from "@/components/ui/button";
import { jobs, shifts, courses, type Job } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import { getRoleIllustration } from "@/lib/roleImages";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — FALE Healthcare" },
      { name: "description", content: "Your personalised healthcare job matches, shifts and profile on FALE." },
      { property: "og:title", content: "Home — FALE Healthcare" },
      { property: "og:description", content: "Your personalised healthcare job matches, shifts and profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

type FilterTab = "All" | "Top match" | "Urgent" | "Day shift";

function Home() {
  const s = useApp();
  const [filter, setFilter] = useState<FilterTab>("All");
  const [claimedShifts, setClaimedShifts] = useState<Record<string, boolean>>({});
  const [isOpenToWork, setIsOpenToWork] = useState(true);
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sidebarTab, setSidebarTab] = useState<"shifts" | "pipeline" | "pulse">("shifts");

  const fullName = String(s.profile["name"] || "Dr. Ananya Patel").trim();
  const firstName = fullName.split(" ")[0]?.replace(",", "") || "there";
  const roleName = String(s.profile["role"] || "Pharmacist");
  const specialty = String(s.profile["specialty"] || "Clinical Pharmacy");
  const roleIllustration = getRoleIllustration(roleName);
  const completeness = Math.min(100, 40 + Object.keys(s.profile).length * 3 + Object.keys(s.docs).length * 5);

  const activeApplied = s.applied.filter((a) => !["Not selected", "Withdrawn"].includes(a.status));

  const filteredJobs = jobs.filter((j) => {
    if (filter === "Top match") return j.match >= 85;
    if (filter === "Urgent") return Boolean(j.urgent);
    if (filter === "Day shift") return j.shift === "Day";
    return true;
  });

  const handleClaimShift = (shiftId: string, title: string, org: string) => {
    setClaimedShifts((prev) => ({ ...prev, [shiftId]: true }));
    toast.success("Shift claim submitted!", {
      description: `Your interest in ${title} at ${org} was sent. Facility HR will confirm shortly.`,
    });
  };

  const handleDownloadCV = () => {
    toast.success("Clinical CV exported!", {
      description: "Downloaded verified medical resume in standard NABH format.",
    });
  };

  const toggleSave = (jobId: string) => {
    const isSaved = s.saved.includes(jobId);
    setState((x) => ({
      saved: isSaved ? x.saved.filter((id) => id !== jobId) : [...x.saved, jobId],
    }));
    if (!isSaved) {
      toast.success("Role saved to your wishlist");
    }
  };

  const handleQuickApply = (job: Job) => {
    const isAlreadyApplied = s.applied.some((a) => a.jobId === job.id);
    if (isAlreadyApplied) {
      toast.info("Already applied to this position");
      return;
    }

    const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    setState((x) => ({
      applied: [{ jobId: job.id, status: "Applied", date: now }, ...x.applied],
    }));
    toast.success("Application submitted via Easy Apply!", {
      description: `Your verified profile was sent to ${job.org}.`,
    });
  };

  return (
    <AppShell>
      <div className="max-w-[1400px] mx-auto space-y-6 sm:space-y-8">
        {/* ========================================================================= */}
        {/* TOP WELCOME EXECUTIVE BRIEFING (COMPACT EXECUTIVE SPLIT COCKPIT)          */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs md:max-h-[175px]">
          {/* Subtle ambient lighting */}
          <div className="absolute -left-16 -top-16 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-stretch md:h-[170px]">
            {/* Left: Professional Portrait Frame with Dynamic 3D Role Illustration */}
            <div className="relative w-full md:w-[170px] lg:w-[185px] shrink-0 h-40 md:h-full bg-[#F7F4F0] dark:bg-[#181614] overflow-hidden">
              <img
                src={roleIllustration}
                alt={`${roleName} - Verified Clinician`}
                className="h-full w-full object-cover object-[center_12%] scale-110 transition-transform duration-300"
              />
              {/* Soft gradient edge into the right content */}
              <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-r from-transparent to-card hidden md:block pointer-events-none" />
              <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-card to-transparent md:hidden pointer-events-none" />

              {/* Verified Clinician Floating Badge */}
              <div className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-card/95 backdrop-blur-md px-2 py-0.5 text-[9px] font-bold text-foreground shadow-2xs border border-border/70">
                <RiVerifiedBadgeFill className="h-3 w-3 text-emerald-600" />
                <span>Verified {roleName}</span>
              </div>
            </div>

            {/* Right: Executive Briefing & Intelligence Strip */}
            <div className="flex-1 p-3.5 sm:p-4 md:py-3 md:px-5 flex flex-col justify-between h-full min-w-0">
              {/* Top Row: Identity, Status & Actions */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-0.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5 text-[9px] font-extrabold text-primary uppercase tracking-wider">
                    <span className="inline-flex items-center gap-1 whitespace-nowrap">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                      <span>NCAHP Tier-1</span>
                    </span>
                    <span className="text-muted-foreground/40 font-normal">·</span>
                    <span className="whitespace-nowrap">5-Day Fast-Track Placement</span>
                  </div>
                  <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-foreground leading-snug">
                    Welcome back, {firstName}
                  </h1>
                  <p className="text-[11px] text-muted-foreground leading-tight truncate">
                    You have <strong className="text-foreground font-semibold">3 high-priority matches</strong> and{" "}
                    <strong className="text-foreground font-semibold">{activeApplied.length} active applications</strong> in progress this week.
                  </p>
                </div>

                {/* Top Action Buttons */}
                <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 pt-0.5 sm:pt-0">
                  <Button
                    variant="outline"
                    onClick={handleDownloadCV}
                    className="flex-1 sm:flex-initial justify-center rounded-xl border-border/80 bg-card hover:bg-muted font-bold text-xs h-8 px-3 shadow-2xs gap-1.5"
                  >
                    <HiOutlineArrowDownTray className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Clinical CV</span>
                  </Button>
                  <Button
                    asChild
                    className="flex-1 sm:flex-initial justify-center rounded-xl font-bold text-xs h-8 px-3.5 shadow-sm shadow-primary/20 gap-1.5"
                  >
                    <Link to="/jobs" search={{ q: undefined }}>
                      <span>View Matches</span>
                      <HiArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Bottom Row: Apple-Style 4-Tile Intelligence Strip (Covers Full Width) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5 border-t border-border/60">
                <div className="rounded-xl bg-muted/30 p-1.5 px-2.5 border border-border/50">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    <HiOutlineEye className="h-3 w-3 text-primary shrink-0" />
                    <span>Profile Views</span>
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-xs sm:text-sm font-extrabold text-foreground">42</span>
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">+18% wk</span>
                  </div>
                </div>

                <div className="rounded-xl bg-muted/30 p-1.5 px-2.5 border border-border/50">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    <HiOutlineBriefcase className="h-3 w-3 text-primary shrink-0" />
                    <span>Curated Roles</span>
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-xs sm:text-sm font-extrabold text-foreground">{filteredJobs.length}</span>
                    <span className="text-[9px] font-semibold text-primary">Top 94%</span>
                  </div>
                </div>

                <div className="rounded-xl bg-muted/30 p-1.5 px-2.5 border border-border/50">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    <HiOutlineClock className="h-3 w-3 text-primary shrink-0" />
                    <span>Instant Shifts</span>
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-xs sm:text-sm font-extrabold text-foreground">{shifts.length}</span>
                    <span className="text-[9px] font-semibold text-muted-foreground">From ₹350/hr</span>
                  </div>
                </div>

                <div className="rounded-xl bg-muted/30 p-1.5 px-2.5 border border-border/50">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-muted-foreground">
                    <HiOutlineDocumentCheck className="h-3 w-3 text-emerald-600 shrink-0" />
                    <span>Active Pipeline</span>
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-xs sm:text-sm font-extrabold text-foreground">{activeApplied.length}</span>
                    <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">Interviews</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* MAIN EXECUTIVE 2-COLUMN DASHBOARD (EXPANSIVE FEED + SMART RIGHT RAIL)     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[340px_minmax(0,1fr)] gap-6 lg:gap-8 items-start w-full min-w-0">

          {/* ======================================================================= */}
          {/* LEFT SIDEBAR: EXECUTIVE PROFILE, INSTANT SHIFTS & PIPELINE (~30%)     */}
          {/* ======================================================================= */}
          <aside className="w-full min-w-0 space-y-4 lg:sticky lg:top-20 lg:self-start">
            {/* 1. Candidate Identity & Placement Readiness Card */}
            <div className="surface rounded-3xl border border-border/80 bg-card shadow-xs overflow-hidden transition-all duration-200 hover:shadow-sm">
              <div className="h-16 w-full bg-gradient-to-r from-primary-soft/80 via-primary/10 to-muted/40 relative">
                <div className="absolute top-2.5 right-3 flex items-center gap-1 rounded-full bg-card/90 backdrop-blur-xs px-2.5 py-0.5 text-[10px] font-bold text-primary shadow-2xs border border-border/60">
                  <HiOutlineShieldCheck className="h-3 w-3" />
                  <span>NCAHP Tier 1</span>
                </div>
              </div>

              <div className="-mt-8 px-5 pb-4">
                <div className="flex items-end gap-3.5">
                  <div className="relative shrink-0">
                    <span className="grid h-15 w-15 place-items-center rounded-2xl border-3 border-card bg-primary-soft text-xl font-black text-primary shadow-sm">
                      {initials(fullName)}
                    </span>
                    <span
                      title="DigiLocker Verified"
                      className="absolute -bottom-1 -right-1 grid h-5.5 w-5.5 place-items-center rounded-full bg-emerald-600 text-white ring-2 ring-card shadow-xs"
                    >
                      <RiVerifiedBadgeFill className="h-3 w-3" />
                    </span>
                  </div>

                  <div className="min-w-0 pb-0.5">
                    <h2 className="text-base font-bold text-foreground tracking-tight truncate">
                      {fullName}
                    </h2>
                    <p className="text-xs text-muted-foreground font-medium truncate">
                      {roleName} · {specialty}
                    </p>
                    <p className="text-[11px] text-muted-foreground/80 mt-0.5 flex items-center gap-1">
                      <HiOutlineMapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>Chennai, Tamil Nadu</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Apple-Style Profile Health Progress */}
              <div className="border-t border-border/70 bg-muted/20 px-5 py-3.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-bold text-foreground">
                    <HiOutlineSparkles className="h-4 w-4 text-primary" />
                    <span>Profile Strength</span>
                  </span>
                  <span className="font-extrabold text-primary whitespace-nowrap">{completeness}% · All-Star</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground truncate">Prioritized 5-day placement</span>
                  <Link to="/profile" className="font-bold text-primary hover:underline shrink-0">
                    Edit →
                  </Link>
                </div>
              </div>

              {/* Clean Stats Row */}
              <div className="grid grid-cols-3 border-t border-border/70 text-center divide-x divide-border/70 bg-card">
                <div className="py-2.5 px-2">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Views</div>
                  <div className="mt-0.5 text-sm font-bold text-foreground">42</div>
                  <div className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">+18%</div>
                </div>

                <Link to="/applications" className="py-2.5 px-2 hover:bg-muted/30 transition-colors group">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Applied</div>
                  <div className="mt-0.5 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {s.applied.length}
                  </div>
                  <div className="text-[9px] font-medium text-muted-foreground">{activeApplied.length} active</div>
                </Link>

                <Link to="/jobs" search={{ q: undefined }} className="py-2.5 px-2 hover:bg-muted/30 transition-colors group">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Saved</div>
                  <div className="mt-0.5 text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {s.saved.length}
                  </div>
                  <div className="text-[9px] font-medium text-muted-foreground">Wishlist</div>
                </Link>
              </div>

              {/* Open to Work Toggle */}
              <div className="border-t border-border/70 p-3.5 bg-muted/10">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className={cn("h-2 w-2 rounded-full shrink-0", isOpenToWork ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
                      <span>Open to Offers</span>
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Full-time & Locum cover</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpenToWork(!isOpenToWork);
                      toast.info(isOpenToWork ? "Status: Not looking" : "Status: Actively open to offers");
                    }}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      isOpenToWork ? "bg-emerald-600" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        isOpenToWork ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Instant Locum Shifts */}
            <div className="surface p-5 rounded-3xl border border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-4">
                <div>
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5">
                    <HiOutlineClock className="h-4 w-4 text-primary" />
                    <span>Instant Locum Shifts</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">High-rate verified hospital cover</p>
                </div>
                <Link to="/shifts" className="text-xs font-bold text-primary hover:underline">
                  See all
                </Link>
              </div>

              <div className="space-y-3">
                {shifts.slice(0, 3).map((sh) => {
                  const isClaimed = claimedShifts[sh.id];
                  return (
                    <div
                      key={sh.id}
                      className="rounded-2xl border border-border/70 p-3 bg-muted/10 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">{sh.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {sh.org} · {sh.date}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                              ₹{sh.rate}/hr
                            </span>
                            <span className="text-[11px] text-muted-foreground">{sh.hours}h shift</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleClaimShift(sh.id, sh.title, sh.org)}
                          disabled={isClaimed}
                          className={cn(
                            "shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-95",
                            isClaimed
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 cursor-default"
                              : "border border-primary/30 bg-primary-soft text-primary hover:bg-primary hover:text-white"
                          )}
                        >
                          {isClaimed ? "Requested" : "Claim"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Application Pipeline */}
            <div className="surface p-5 rounded-3xl border border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-sm">
              <div className="flex items-center justify-between gap-2 mb-3.5">
                <div>
                  <h3 className="text-sm font-bold text-foreground">Application Pipeline</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Live tracking with facilities</p>
                </div>
                <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] font-bold text-primary">
                  {s.applied.length} Total
                </span>
              </div>

              <div className="space-y-2.5">
                {s.applied.slice(0, 3).map((a) => {
                  const j = jobs.find((x) => x.id === a.jobId);
                  if (!j) return null;
                  return (
                    <div
                      key={a.jobId}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 min-w-0"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-foreground">{j.title}</p>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{j.org}</p>
                      </div>
                      <StatusBadge status={a.status} />
                    </div>
                  );
                })}
              </div>

              <Link
                to="/applications"
                className="mt-3.5 flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-card py-2 text-xs font-bold text-foreground hover:bg-muted/40 transition-colors shadow-2xs"
              >
                <span>View all applications</span>
                <HiArrowRight className="h-3 w-3 text-primary shrink-0" />
              </Link>
            </div>

            {/* 4. Active Recruiter Radar (Naukri Pulse) */}
            <div className="surface p-4.5 rounded-3xl border border-border/80 bg-muted/20 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-foreground">Verified Recruiter Pulse</span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                <strong>18 hospitals</strong> in Chennai & Bengaluru are actively interviewing {roleName} profiles this week.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex items-center -space-x-1.5">
                  {["Apollo", "Fortis", "Manipal", "MIOT", "KIMS"].map((h) => (
                    <span
                      key={h}
                      className="grid h-6 w-6 place-items-center rounded-full border-2 border-card bg-primary-soft text-[9px] font-black text-primary shadow-2xs"
                      title={h}
                    >
                      {h[0]}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] font-medium text-muted-foreground">+13 facilities</span>
              </div>
            </div>

            {/* 5. Clinical Academy Quick Card */}
            <div className="surface p-4.5 rounded-3xl border border-border/80 bg-card shadow-xs transition-all duration-200 hover:shadow-sm">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <HiOutlineAcademicCap className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs text-foreground truncate">Clinical Academy</h3>
                    <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.2 text-[9px] font-bold">
                      Free
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    ACLS, ICU Safety & NABH Modules
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild className="mt-3.5 w-full rounded-xl font-bold h-8 text-xs border-border/80">
                <Link to="/learning">Explore Free Courses →</Link>
              </Button>
            </div>
          </aside>
          {/* ======================================================================= */}
          {/* PRIMARY FEED: RECOMMENDED ROLES (EXPANSIVE ~70% BREATHING ROOM)                */}
          {/* ======================================================================= */}
          <section className="w-full min-w-0 space-y-5">
            {/* Section Header & Apple Segmented Filter Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                    Recommended For You
                  </h2>
                  <span className="rounded-full bg-primary-soft text-primary px-2.5 py-0.5 text-xs font-bold shrink-0">
                    {filteredJobs.length} roles
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Hand-picked based on your verified {roleName} profile & clinical skills
                </p>
              </div>

              <Link
                to="/jobs"
                search={{ q: undefined }}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline self-start sm:self-auto shrink-0"
              >
                <span>View all jobs ({jobs.length})</span>
                <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Apple-style Filter Pill Tabs & 1 Card vs 2 Cards Layout Switcher */}
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-2xl border border-border/60 overflow-x-auto max-w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 sm:shrink">
                {(["All", "Top match", "Urgent", "Day shift"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilter(tab)}
                    className={cn(
                      "rounded-xl px-3 sm:px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                      filter === tab
                        ? "bg-card text-foreground shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab === "All" ? "All Roles" : tab}
                  </button>
                ))}
              </div>

              {/* View Layout Toggle: Icon Only (1 Card vs 2 Cards) - Hidden on Mobile */}
              <div className="hidden sm:flex items-center gap-1 bg-muted/50 p-1 rounded-2xl border border-border/60">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-xl transition-all cursor-pointer",
                    viewMode === "list"
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="1 Card per row (List view)"
                  aria-label="1 Card per row"
                >
                  <HiOutlineBars3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-xl transition-all cursor-pointer",
                    viewMode === "grid"
                      ? "bg-card text-foreground shadow-2xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="2 Cards per row (Grid view)"
                  aria-label="2 Cards per row"
                >
                  <HiOutlineSquares2X2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Job Listings Feed (1 Card List or 2 Cards Grid) */}
            <div
              className={cn(
                viewMode === "grid"
                  ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                  : "space-y-4"
              )}
            >
              {filteredJobs.slice(0, viewMode === "grid" ? 10 : 8).map((job) => {
                const isSaved = s.saved.includes(job.id);
                const isApplied = s.applied.some((a) => a.jobId === job.id);

                return viewMode === "grid" ? (
                  /* ========================================================= */
                  /* CALM, SPACIOUS 2-CARD GRID (ZERO CONGESTION)              */
                  /* ========================================================= */
                  <div
                    key={job.id}
                    className="surface group relative rounded-2xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between h-full"
                  >
                    <div>
                      {/* Top Header: Logo + Hospital & Match */}
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft/60 border border-primary/15 text-xs font-bold text-primary">
                            {job.org
                              .split(" ")
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-semibold text-foreground truncate">
                              {job.org}
                            </h4>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {job.city} · {job.type}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                            {job.match}%
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleSave(job.id)}
                            aria-label={isSaved ? "Unsave job" : "Save job"}
                            className="grid h-7 w-7 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                          >
                            {isSaved ? (
                              <HiBookmark className="h-4 w-4 text-primary" />
                            ) : (
                              <HiOutlineBookmark className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Title & Urgent Badge */}
                      <div className="mt-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Link
                            to="/jobs/$id"
                            params={{ id: job.id }}
                            className="text-base font-bold text-foreground hover:text-primary transition-colors leading-snug line-clamp-1"
                          >
                            {job.title}
                          </Link>
                          {job.urgent && (
                            <span className="text-[9px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400 px-1.5 py-0.2 rounded-full">
                              Urgent
                            </span>
                          )}
                        </div>

                        {/* Clean Typography Highlight */}
                        <div className="mt-2.5 flex items-baseline gap-2 text-xs">
                          <span className="font-bold text-foreground">{job.salary}</span>
                          <span className="text-[11px] text-muted-foreground">· {job.exp}</span>
                        </div>

                        {/* Max 2 Clean Tags */}
                        <div className="mt-3 flex items-center gap-1.5 text-xs">
                          {job.tags.slice(0, 2).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-md bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Action Footer */}
                    <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-muted-foreground font-medium">
                        {job.posted || "2d ago"}
                      </span>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="font-medium text-xs h-7.5 px-2.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Link to="/jobs/$id" params={{ id: job.id }}>
                            Details
                          </Link>
                        </Button>

                        {isApplied ? (
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                            <span>Applied</span>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleQuickApply(job)}
                            className="font-bold text-xs h-7.5 px-3 rounded-lg gap-1 shadow-2xs cursor-pointer"
                          >
                            <span>Easy Apply</span>
                            <HiArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ========================================================= */
                  /* CALM, SPACIOUS 1-CARD LIST (ELEGANT & UNCONGESTED)        */
                  /* ========================================================= */
                  <div
                    key={job.id}
                    className="surface group relative rounded-2xl border border-border/70 bg-card p-4.5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200"
                  >
                    {/* Top Row: Institution Logo + Name & Match Badge + Bookmark */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft/60 border border-primary/15 text-xs font-bold text-primary">
                          {job.org
                            .split(" ")
                            .map((w) => w[0])
                            .slice(0, 2)
                            .join("")}
                        </div>

                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">
                            {job.org}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {job.city} · {job.type}
                            {job.dept && ` · ${job.dept}`}
                          </p>
                        </div>
                      </div>

                      {/* Right: Match & Bookmark */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          {job.match}% Match
                        </span>

                        <button
                          type="button"
                          onClick={() => toggleSave(job.id)}
                          aria-label={isSaved ? "Unsave job" : "Save job"}
                          className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                        >
                          {isSaved ? (
                            <HiBookmark className="h-4.5 w-4.5 text-primary" />
                          ) : (
                            <HiOutlineBookmark className="h-4.5 w-4.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Full-Width Title & Clinical Badges (Never Squished on Mobile) */}
                    <div className="mt-3 sm:mt-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          to="/jobs/$id"
                          params={{ id: job.id }}
                          className="text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors leading-snug"
                        >
                          {job.title}
                        </Link>
                        {job.urgent && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-400 px-2 py-0.5 rounded-full shrink-0">
                            Urgent
                          </span>
                        )}
                      </div>

                      {/* Clean, quiet skills */}
                      <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                        {job.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                        {job.accredited && (
                          <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1">
                            <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                            NABH
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Clean Bottom Divider & Action Row */}
                    <div className="mt-4 pt-3.5 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Typographic highlights (NO badge boxes!) */}
                      <div className="flex flex-wrap items-baseline gap-2.5 text-xs text-muted-foreground">
                        <span className="text-sm font-bold text-foreground">{job.salary}</span>
                        <span className="text-[11px]">/ month</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="font-medium text-foreground/80">{job.exp}</span>
                        {job.shift && (
                          <>
                            <span className="text-muted-foreground/40">•</span>
                            <span>{job.shift}</span>
                          </>
                        )}
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-[11px]">Posted {job.posted || "2d ago"}</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="font-semibold text-xs h-8 px-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Link to="/jobs/$id" params={{ id: job.id }}>
                            Details
                          </Link>
                        </Button>

                        {isApplied ? (
                          <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            <HiOutlineCheckCircle className="h-4 w-4" />
                            <span>Applied</span>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleQuickApply(job)}
                            className="font-bold text-xs h-8 px-4 rounded-xl gap-1.5 shadow-2xs cursor-pointer"
                          >
                            <span>Easy Apply</span>
                            <HiArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredJobs.length > (viewMode === "grid" ? 10 : 8) && (
              <div className="pt-2 text-center">
                <Button
                  variant="outline"
                  asChild
                  className="rounded-2xl border-border/80 bg-card hover:bg-muted font-bold text-xs h-10 px-6 shadow-2xs gap-2"
                >
                  <Link to="/jobs" search={{ q: undefined }}>
                    <span>Explore all {filteredJobs.length} verified roles</span>
                    <HiArrowRight className="h-4 w-4 text-primary" />
                  </Link>
                </Button>
              </div>
            )}
          </section>

        </div>
      </div>
      <ClinicalConciergeWidget />
    </AppShell>
  );
}
