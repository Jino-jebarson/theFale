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
  HiOutlineCheckCircle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineShieldCheck,
  HiOutlineBars3,
  HiOutlineSquares2X2,
} from "react-icons/hi2";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { toast } from "sonner";
import { AppShell, initials } from "@/components/fale/AppShell";
import { ClinicalConciergeWidget } from "@/components/fale/ClinicalConciergeWidget";
import { Button } from "@/components/ui/button";
import { jobs, shifts, type Job } from "@/lib/data";
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
      <div className="max-w-[1440px] mx-auto space-y-6 sm:space-y-8 pb-10">
        {/* ========================================================================= */}
        {/* 1. EXECUTIVE WELCOME & IDENTITY COCKPIT                                   */}
        {/* ========================================================================= */}
        <section className="rounded-3xl border border-border/80 bg-card p-4 sm:p-6 lg:p-7 shadow-xs relative overflow-hidden">
          {/* Subtle ambient brand glow */}
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            {/* Left: Avatar + Identity + Clinical Status */}
            <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
              <div className="relative shrink-0">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-border/80 bg-primary-soft flex items-center justify-center text-xl sm:text-2xl font-black text-primary overflow-hidden shadow-xs">
                  {roleIllustration ? (
                    <img
                      src={roleIllustration}
                      alt={fullName}
                      className="h-full w-full object-cover object-[center_12%]"
                    />
                  ) : (
                    <span>{initials(fullName)}</span>
                  )}
                </div>
                <span
                  title="DigiLocker & Council Verified"
                  className="absolute -bottom-1 -right-1 grid h-5 w-5 sm:h-5.5 sm:w-5.5 place-items-center rounded-full bg-emerald-600 text-white ring-2 ring-card shadow-xs"
                >
                  <RiVerifiedBadgeFill className="h-3.5 w-3.5" />
                </span>
              </div>

              <div className="flex flex-col justify-center space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground leading-none">
                    Welcome back, {firstName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary shrink-0">
                    <HiCheckBadge className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Verified {roleName}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1.5 text-xs sm:text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{specialty}</span>
                  <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-muted-foreground/35 shrink-0" />
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <HiOutlineMapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Chennai, Tamil Nadu</span>
                  </span>
                  <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-muted-foreground/35 shrink-0" />
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>Fast-Track Placement Active</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0 w-full md:w-auto pt-1 md:pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCV}
                className="w-full sm:w-auto h-10 px-4 rounded-xl border-border/80 hover:bg-muted font-bold text-xs shadow-none gap-2 justify-center"
              >
                <HiOutlineArrowDownTray className="h-4 w-4 text-primary shrink-0" />
                <span>Export Clinical CV</span>
              </Button>
              <Button
                size="sm"
                asChild
                className="w-full sm:w-auto h-10 px-5 rounded-xl font-bold text-xs bg-primary hover:bg-primary-hover text-white shadow-none gap-2 justify-center"
              >
                <Link to="/jobs" search={{ q: undefined }}>
                  <span>Explore Matches</span>
                  <HiArrowRight className="h-4 w-4 shrink-0" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. TOP TELEMETRY 4 KPI METRIC CARDS                                      */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Profile Views */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <HiOutlineEye className="h-4 w-4" />
                </span>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                  Profile Views
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold px-2 py-0.5">
                +18% wk
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
                42
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                institutional views
              </p>
            </div>
            <div className="pt-2.5 border-t border-border/50 text-[11px] text-primary font-semibold flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" />
              <span>3 Hospitals viewed today</span>
            </div>
          </div>

          {/* Card 2: Curated Roles */}
          <Link
            to="/jobs"
            search={{ q: undefined }}
            className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                  <HiOutlineBriefcase className="h-4 w-4" />
                </span>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                  Curated Roles
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold px-2 py-0.5">
                Top 94% Match
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
                {filteredJobs.length}
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                verified vacancies
              </p>
            </div>
            <div className="pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="text-primary font-semibold">Immediate Joining</span>
              <HiArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Instant Shifts */}
          <Link
            to="/shifts"
            className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <HiOutlineBolt className="h-4 w-4" />
                </span>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                  Instant Shifts
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-extrabold px-2 py-0.5">
                Tonight
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
                {shifts.length}
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                shifts ready to claim
              </p>
            </div>
            <div className="pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="text-primary font-semibold">From ₹350/hr</span>
              <HiArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Active Pipeline */}
          <Link
            to="/applications"
            className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between space-y-3"
          >
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <HiOutlineDocumentCheck className="h-4 w-4" />
                </span>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                  Applications
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-[10px] font-extrabold px-2 py-0.5">
                {activeApplied.length} Active
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
                {s.applied.length}
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                total submissions
              </p>
            </div>
            <div className="pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="text-primary font-semibold">Track Pipeline</span>
              <HiArrowRight className="h-3.5 w-3.5 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </section>

        {/* ========================================================================= */}
        {/* 3. BALANCED 2-COLUMN COCKPIT (EXPANSIVE FEED + SMART RIGHT RAIL)          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full min-w-0">

          {/* ======================================================================= */}
          {/* PRIMARY FEED (8 COLUMNS ON DESKTOP ~67% BREATHING ROOM)                 */}
          {/* ======================================================================= */}
          <section className="lg:col-span-8 w-full min-w-0 space-y-5">
            {/* Feed Filter Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-1">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                    Recommended Roles
                  </h2>
                  <span className="rounded-full bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 text-xs font-bold shrink-0">
                    {filteredJobs.length} roles available
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Curated clinical opportunities matched to your verified credentials
                </p>
              </div>

              <Link
                to="/jobs"
                search={{ q: undefined }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline self-start sm:self-auto shrink-0"
              >
                <span>View all jobs ({jobs.length})</span>
                <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
              </Link>
            </div>

            {/* Filter Tabs & View Mode Switcher */}
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border/70 overflow-x-auto max-w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 sm:shrink">
                {(["All", "Top match", "Urgent", "Day shift"] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setFilter(tab)}
                    className={cn(
                      "rounded-xl px-3 sm:px-4 py-2 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0",
                      filter === tab
                        ? "bg-card text-foreground font-bold border border-border/60 shadow-none"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {tab === "All" ? "All Roles" : tab}
                  </button>
                ))}
              </div>

              {/* View Layout Toggle: 1-Column vs 2-Column Grid */}
              <div className="hidden sm:flex items-center gap-1 bg-muted/40 p-1 rounded-2xl border border-border/70">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-xl transition-all cursor-pointer",
                    viewMode === "list"
                      ? "bg-card text-foreground border border-border/60 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="List View"
                  aria-label="List View"
                >
                  <HiOutlineBars3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-xl transition-all cursor-pointer",
                    viewMode === "grid"
                      ? "bg-card text-foreground border border-border/60 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <HiOutlineSquares2X2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Job Listings Feed */}
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

                return (
                  <div
                    key={job.id}
                    className="group relative rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs hover:border-primary/40 transition-all duration-200 flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header: Organization Logo + Details + Match Score & Bookmark */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-sm font-black text-primary">
                            {job.org
                              .split(" ")
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join("")}
                          </div>

                          <div className="min-w-0">
                            <h4 className="text-sm font-bold text-foreground truncate">
                              {job.org}
                            </h4>
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {job.city} · {job.type}
                              {job.dept && ` · ${job.dept}`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {job.match}% Match
                          </span>

                          <button
                            type="button"
                            onClick={() => toggleSave(job.id)}
                            aria-label={isSaved ? "Unsave job" : "Save job"}
                            className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                          >
                            {isSaved ? (
                              <HiBookmark className="h-4.5 w-4.5 text-primary" />
                            ) : (
                              <HiOutlineBookmark className="h-4.5 w-4.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Job Title & Badges */}
                      <div className="mt-3.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link
                            to="/jobs/$id"
                            params={{ id: job.id }}
                            className="text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors leading-snug"
                          >
                            {job.title}
                          </Link>
                          {job.urgent && (
                            <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 border border-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded-full shrink-0">
                              Urgent
                            </span>
                          )}
                        </div>

                        {/* Tags */}
                        <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                          {job.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="rounded-lg bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border/50"
                            >
                              {tag}
                            </span>
                          ))}
                          {job.accredited && (
                            <span className="text-xs text-primary font-bold flex items-center gap-1">
                              <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                              NABH Accredited
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Footer Row: Salary, Experience & Actions */}
                    <div className="mt-4 pt-3.5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
                        <span className="text-base font-extrabold text-foreground">{job.salary}</span>
                        <span className="text-xs">/ month</span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="font-medium text-foreground/80">{job.exp}</span>
                        {job.shift && (
                          <>
                            <span className="text-muted-foreground/40">•</span>
                            <span>{job.shift}</span>
                          </>
                        )}
                        <span className="text-muted-foreground/40">•</span>
                        <span>Posted {job.posted || "2d ago"}</span>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          asChild
                          className="font-semibold text-xs h-9 px-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
                        >
                          <Link to="/jobs/$id" params={{ id: job.id }}>
                            Details
                          </Link>
                        </Button>

                        {isApplied ? (
                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            <HiOutlineCheckCircle className="h-4 w-4" />
                            <span>Applied</span>
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => handleQuickApply(job)}
                            className="font-bold text-xs h-9 px-4 rounded-xl gap-1.5 bg-primary hover:bg-primary-hover text-white shadow-none cursor-pointer"
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
              <div className="pt-3 text-center">
                <Button
                  variant="outline"
                  asChild
                  className="rounded-xl border-border/80 bg-card hover:bg-muted font-bold text-xs h-10 px-6 shadow-none gap-2"
                >
                  <Link to="/jobs" search={{ q: undefined }}>
                    <span>Explore all {filteredJobs.length} verified roles</span>
                    <HiArrowRight className="h-4 w-4 text-primary" />
                  </Link>
                </Button>
              </div>
            )}
          </section>

          {/* ======================================================================= */}
          {/* RIGHT RAIL: READINESS, INSTANT SHIFTS & ASSISTANT (4 COLUMNS ~33%)     */}
          {/* ======================================================================= */}
          <aside className="lg:col-span-4 w-full min-w-0 space-y-5 lg:sticky lg:top-20">
            {/* 1. Placement Readiness & Open to Work Card */}
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <HiOutlineSparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Placement Profile</h3>
                    <p className="text-[11px] text-muted-foreground">Fast-Track Status</p>
                  </div>
                </div>
                <span className="font-extrabold text-xs text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                  {completeness}% Complete
                </span>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted/60">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Verified credentials active</span>
                  <Link to="/profile" className="font-bold text-primary hover:underline">
                    Manage Profile →
                  </Link>
                </div>
              </div>

              {/* Open to Work Toggle */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <span className={cn("h-2 w-2 rounded-full shrink-0", isOpenToWork ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
                    <span>Open to Instant Offers</span>
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    Allows hospitals to direct-message you
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenToWork(!isOpenToWork);
                    toast.info(isOpenToWork ? "Status: Not looking" : "Status: Actively open to offers");
                  }}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    isOpenToWork ? "bg-primary" : "bg-muted"
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

            {/* 2. Instant Locum Shifts Widget */}
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <HiOutlineClock className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Instant Locum Shifts</h3>
                    <p className="text-[11px] text-muted-foreground">Direct hospital coverage</p>
                  </div>
                </div>
                <Link to="/shifts" className="text-xs font-bold text-primary hover:underline">
                  View all
                </Link>
              </div>

              <div className="space-y-3">
                {shifts.slice(0, 3).map((sh) => {
                  const isClaimed = claimedShifts[sh.id];
                  return (
                    <div
                      key={sh.id}
                      className="rounded-2xl border border-border/70 p-3.5 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-foreground truncate">{sh.title}</p>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                            {sh.org} · {sh.date}
                          </p>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
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
                            "shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-none",
                            isClaimed
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 cursor-default"
                              : "bg-primary text-white hover:bg-primary-hover"
                          )}
                        >
                          {isClaimed ? "Claimed" : "Claim"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3. Recruiter Pulse Radar */}
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                </span>
                <span className="text-xs font-bold text-foreground">Active Hospital Hiring Pulse</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                <strong className="text-foreground">18 hospitals</strong> in Chennai & Bengaluru are actively interviewing {roleName} profiles this week.
              </p>
              <div className="pt-2 flex items-center gap-2.5">
                <div className="flex items-center -space-x-2">
                  {["Apollo", "Fortis", "Manipal", "MIOT", "KIMS"].map((h) => (
                    <span
                      key={h}
                      className="grid h-7 w-7 place-items-center rounded-full border-2 border-card bg-primary-soft text-[10px] font-black text-primary shadow-xs"
                      title={h}
                    >
                      {h[0]}
                    </span>
                  ))}
                </div>
                <span className="text-xs font-semibold text-muted-foreground">+13 facilities</span>
              </div>
            </div>

            {/* 4. Clinical Academy Certification */}
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <HiOutlineAcademicCap className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-xs text-foreground truncate">Clinical Academy</h3>
                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.2 text-[10px] font-bold">
                      Free
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    ACLS, ICU Safety & NABH Modules
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" asChild className="w-full rounded-xl font-bold h-9 text-xs border-border/80 shadow-none">
                <Link to="/learning">Explore Free Courses →</Link>
              </Button>
            </div>
          </aside>

        </div>
      </div>
      <ClinicalConciergeWidget />
    </AppShell>
  );
}
