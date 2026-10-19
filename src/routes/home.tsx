import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiArrowRight,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineEye,
  HiOutlineBookmark,
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
} from "react-icons/hi2";
import { RiShieldKeyholeFill, RiVerifiedBadgeFill } from "react-icons/ri";
import { toast } from "sonner";
import { AppShell, StatusBadge, initials } from "@/components/fale/AppShell";
import { OrgMark } from "@/components/fale/JobCard";
import { Button } from "@/components/ui/button";
import { jobs, shifts, courses, type Job } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import banner from "@/assets/home-banner.jpg";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — FALE" },
      { name: "description", content: "Your personalised healthcare job matches, shifts and profile on FALE." },
      { property: "og:title", content: "Home — FALE" },
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

  const fullName = String(s.profile["name"] || "Dr. Jino Jebarosn R").trim();
  const firstName = fullName.split(" ")[0]?.replace(",", "") || "there";
  const roleName = String(s.profile["role"] || "Doctor");
  const specialty = String(s.profile["specialty"] || "Cardiology");
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
    toast.success("Shift request submitted!", {
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

  return (
    <AppShell>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[290px_minmax(0,1fr)_330px] w-full min-w-0 max-w-full">
        {/* ================= LEFT RAIL: LINKEDIN/APPLE PROFILE CARD ================= */}
        <aside className="w-full min-w-0 max-w-full space-y-4">
          <div className="surface w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md">
            {/* Cover photo banner */}
            <div className="relative h-20 w-full bg-gradient-to-r from-[#004182] via-[#0A66C2] to-[#0073B1]" />

            {/* Avatar & Profile Identity */}
            <div className="-mt-10 px-4 sm:px-5 pb-5 text-center min-w-0">
              <div className="relative mx-auto inline-block">
                <span className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-card bg-primary-soft text-2xl font-black text-primary shadow-md">
                  {initials(fullName)}
                </span>
                <span
                  title="Verified Profile"
                  className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white ring-2 ring-card shadow-sm"
                >
                  <RiVerifiedBadgeFill className="h-4 w-4" />
                </span>
              </div>

              <h2 className="mt-2.5 text-base font-extrabold text-foreground tracking-tight leading-snug truncate">
                {fullName}
              </h2>
              <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">
                {roleName} · {specialty}
              </p>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">
                Chennai, Tamil Nadu
              </p>
            </div>

            {/* Profile Strength - Apple Style Meter */}
            <div className="border-t border-border/70 bg-muted/20 px-4 sm:px-5 py-4 min-w-0">
              <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-foreground min-w-0 truncate">
                  <HiOutlineSparkles className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">Profile Strength</span>
                </span>
                <span className="shrink-0 font-extrabold text-emerald-600 dark:text-emerald-400">{completeness}% · All-Star</span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-primary to-sky-400 transition-all duration-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                Your profile is 100% verified and prioritized for 5-day direct hospital interviews.
              </p>
              <Link
                to="/profile"
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>Edit clinical profile</span>
                <HiArrowRight className="h-3 w-3 shrink-0" />
              </Link>
            </div>

            {/* LinkedIn-style Analytics Grid */}
            <div className="grid grid-cols-3 border-t border-border/70 text-center divide-x divide-border/70 bg-card">
              <div className="p-2 sm:p-3 transition-colors hover:bg-muted/30 min-w-0">
                <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                  <HiOutlineEye className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">Views</span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-foreground">42</div>
                <div className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">+18% wk</div>
              </div>

              <Link to="/applications" className="p-2 sm:p-3 transition-colors hover:bg-muted/30 group min-w-0">
                <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                  <HiOutlineDocumentCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="truncate">Applied</span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-foreground group-hover:text-primary transition-colors">
                  {s.applied.length}
                </div>
                <div className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground truncate">{activeApplied.length} active</div>
              </Link>

              <Link to="/jobs" search={{ q: undefined }} className="p-2 sm:p-3 transition-colors hover:bg-muted/30 group min-w-0">
                <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                  <HiOutlineBookmark className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span className="truncate">Saved</span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-foreground group-hover:text-primary transition-colors">
                  {s.saved.length}
                </div>
                <div className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground truncate">Wishlist</div>
              </Link>
            </div>

            {/* Availability Toggle */}
            <div className="border-t border-border/70 p-3 sm:p-4 bg-muted/10">
              <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-border/70 bg-card p-3 shadow-2xs">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span className={cn("h-2 w-2 shrink-0 rounded-full", isOpenToWork ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
                    <span className="truncate">Open to Opportunities</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">Full-time & Locum shifts</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsOpenToWork(!isOpenToWork);
                    toast.info(isOpenToWork ? "Status set to not open" : "Status set to actively open to offers");
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

          {/* FALE Clinical Academy Card */}
          <div className="surface p-4 rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-blue-50/40 dark:to-blue-950/20 shadow-xs w-full min-w-0 overflow-hidden">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary shadow-2xs">
                <HiOutlineAcademicCap className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs text-foreground leading-snug">
                    FALE Clinical Academy
                  </h3>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 text-[9px] font-bold shrink-0">
                    Free
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  Certified healthcare modules in ACLS, ICU Patient Safety & Infection Control.
                </p>
                <Button variant="outline" size="sm" asChild className="mt-3 w-full rounded-xl font-bold h-8 text-xs border-border/80">
                  <Link to="/learning">Explore courses</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Institutional Trust Badge */}
          <div className="surface p-4 rounded-3xl border border-border/80 bg-gradient-to-br from-blue-50/70 via-card to-card dark:from-blue-950/20 shadow-xs w-full min-w-0 overflow-hidden">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-xs">
                <HiOutlineBolt className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-xs font-bold text-foreground">5-Day Fast-Track Placement</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  Your DigiLocker credentials bypass preliminary screening at 35+ partnered hospital networks.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ================= CENTER FEED: EXECUTIVE MATCH BRIEFING ================= */}
        <section className="w-full min-w-0 max-w-full space-y-6">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card w-full min-w-0">
            <img
              src={banner}
              alt="Doctor in a modern clinic"
              width={1600}
              height={690}
              className="h-56 w-full object-cover object-left sm:h-60"
            />
            <div className="absolute inset-y-0 right-0 flex w-full flex-col justify-center bg-gradient-to-l from-card via-card/90 to-transparent p-4 sm:p-6 sm:w-3/5">
              <p className="eyebrow">The 5-day match</p>
              <h1 className="mt-1 text-xl sm:text-2xl font-extrabold leading-tight text-foreground">
                Hi {firstName}, 3 great matches are waiting.
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Hand-picked from verified healthcare employers.
              </p>
              <Button asChild className="mt-3 sm:mt-4 w-fit rounded-xl font-bold">
                <Link to="/jobs" search={{ q: undefined }}>
                  View matches <HiArrowRight className="h-4 w-4 ml-1" />
                </Link>
              </Button>
            </div>
          </div>

          {/* Naukri-style Filter & Recommendation Header */}
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-tight text-foreground flex flex-wrap items-center gap-2">
                  <span>Recommended for you</span>
                  <span className="whitespace-nowrap shrink-0 rounded-full bg-primary-soft text-primary px-2.5 py-0.5 text-xs font-bold">
                    {filteredJobs.length} roles
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Curated based on your verified {roleName} profile and clinical skills
                </p>
              </div>
              <Link
                to="/jobs"
                search={{ q: undefined }}
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>View all jobs</span>
                <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Apple-style Filter Pill Tabs */}
            <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
              {(["All", "Top match", "Urgent", "Day shift"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={cn(
                    "rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer",
                    filter === tab
                      ? "bg-foreground text-background shadow-sm"
                      : "border border-border/70 bg-card text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Enhanced Job Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredJobs.slice(0, 4).map((job) => {
                const isSaved = s.saved.includes(job.id);
                const isApplied = s.applied.some((a) => a.jobId === job.id);

                return (
                  <div
                    key={job.id}
                    className="surface group relative flex flex-col justify-between rounded-3xl border border-border/80 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 bg-card"
                  >
                    <div>
                      {/* Hospital Header & Bookmark */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <OrgMark name={job.org} className="h-11 w-11 rounded-2xl text-xs font-extrabold" />
                          <div>
                            <p className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                              <span>{job.org}</span>
                              <HiCheckBadge className="h-3.5 w-3.5 text-primary" title="Verified Hospital" />
                            </p>
                            <Link
                              to="/jobs/$id"
                              params={{ id: job.id }}
                              className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1"
                            >
                              {job.title}
                            </Link>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => toggleSave(job.id)}
                          aria-label={isSaved ? "Unsave job" : "Save job"}
                          className="rounded-full p-2 text-muted-foreground hover:bg-primary-soft hover:text-primary transition-colors cursor-pointer"
                        >
                          <HiOutlineBookmark className={cn("h-5 w-5", isSaved && "fill-primary text-primary")} />
                        </button>
                      </div>

                      {/* Job Metadata Chips */}
                      <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <HiOutlineBriefcase className="h-3.5 w-3.5" />
                          <span>{job.exp}</span>
                        </span>
                        <span className="flex items-center gap-1 font-bold text-foreground">
                          <HiOutlineCurrencyRupee className="h-3.5 w-3.5 text-primary" />
                          <span>{job.salary}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <HiOutlineMapPin className="h-3.5 w-3.5" />
                          <span>{job.city}</span>
                        </span>
                      </div>

                      {/* Skills Tags */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {job.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-lg bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Bottom Status & Direct Action */}
                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {job.match}% Match
                        </span>
                        {job.urgent && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            Urgent
                          </span>
                        )}
                      </div>

                      <Link
                        to="/jobs/$id"
                        params={{ id: job.id }}
                        className="inline-flex items-center gap-1 font-bold text-xs text-primary group-hover:translate-x-0.5 transition-transform"
                      >
                        {isApplied ? "View status" : "Easy apply"}
                        <HiArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ================= RIGHT RAIL: SHIFTS & RECRUITER PIPELINE ================= */}
        <aside className="w-full min-w-0 max-w-full space-y-5">
          {/* Open Locum & Urgent Shifts */}
          <div className="surface p-4 sm:p-5 rounded-3xl border border-border/80 shadow-sm bg-card w-full min-w-0 overflow-hidden">
            <div className="mb-3.5 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground truncate">
                  <HiOutlineClock className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">Instant Locum Shifts</span>
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">High-rate hospital cover shifts</p>
              </div>
              <Link to="/shifts" className="text-xs font-bold text-primary hover:underline shrink-0">
                See all
              </Link>
            </div>

            <ul className="divide-y divide-border/60">
              {shifts.slice(0, 3).map((sh) => {
                const isClaimed = claimedShifts[sh.id];
                return (
                  <li key={sh.id} className="py-3 first:pt-1 last:pb-1">
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-foreground truncate">{sh.title}</p>
                          {sh.urgent && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500 animate-pulse" title="Immediate cover required" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                          {sh.org} · {sh.date}
                        </p>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-black text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                            ₹{sh.rate}/hr
                          </span>
                          <span className="text-[11px] text-muted-foreground">{sh.hours} hrs shift</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleClaimShift(sh.id, sh.title, sh.org)}
                        disabled={isClaimed}
                        className={cn(
                          "shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-2xs active:scale-[0.98]",
                          isClaimed
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 cursor-default"
                            : "border border-primary/30 bg-primary-soft text-primary hover:bg-primary hover:text-white"
                        )}
                      >
                        {isClaimed ? "Requested" : "Claim"}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* LinkedIn-style Application Pipeline */}
          <div className="surface p-4 sm:p-5 rounded-3xl border border-border/80 shadow-sm bg-card w-full min-w-0 overflow-hidden">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-extrabold text-foreground truncate">Application Pipeline</h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Live tracking with facilities</p>
              </div>
              <span className="whitespace-nowrap shrink-0 rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] font-bold text-primary">
                {s.applied.length} Total
              </span>
            </div>

            <ul className="mt-3.5 space-y-2.5">
              {s.applied.slice(0, 4).map((a) => {
                const j = jobs.find((x) => x.id === a.jobId);
                if (!j) return null;
                return (
                  <li
                    key={a.jobId}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/20 p-3 transition-colors hover:bg-muted/40 min-w-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-foreground">{j.title}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{j.org}</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </li>
                );
              })}
            </ul>

            <Link
              to="/applications"
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-border/80 bg-card py-2.5 text-xs font-bold text-foreground hover:bg-muted/40 transition-colors shadow-2xs"
            >
              <span>Manage all applications</span>
              <HiArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
            </Link>
          </div>

          {/* Recruiter Activity Radar (Naukri FastForward Pulse) */}
          <div className="surface p-4 rounded-3xl border border-border/80 bg-muted/20 shadow-2xs w-full min-w-0 overflow-hidden">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-foreground">Active Recruiter Radar</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
              <strong>18 verified hospitals</strong> in Chennai & Bengaluru are searching for Cardiology specialists this week.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
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
              <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">+13 more hospitals</span>
            </div>
          </div>

          {/* FALE Healthcare Support & Concierge Widget */}
          <div className="surface p-4 rounded-3xl border border-primary/20 bg-primary/5 shadow-2xs w-full min-w-0 overflow-hidden space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                <HiOutlineQuestionMarkCircle className="h-4 w-4" />
                <span>Need Support?</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                24/7 Active
              </span>
            </div>

            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Assistance with DigiLocker verification, 24-hr shift payouts, or timesheets:
            </p>

            <div className="space-y-1.5 text-xs">
              <a
                href="mailto:contact@thefale.com"
                className="flex items-center gap-2 font-medium text-foreground hover:text-primary transition-colors"
              >
                <span className="font-mono text-[11px] font-bold text-primary">contact@thefale.com</span>
              </a>
              <a
                href="tel:+917338367726"
                className="flex items-center gap-2 font-mono text-[11px] font-bold text-foreground hover:text-primary transition-colors"
              >
                <span>+91 73383 67726</span>
              </a>
            </div>

            <Link
              to="/support"
              className="mt-1 flex items-center justify-center gap-1.5 rounded-xl bg-card border border-border/80 py-2 text-xs font-bold text-foreground hover:bg-muted/40 transition-colors shadow-2xs"
            >
              <span>Visit Help Center & FAQs</span>
              <HiArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
            </Link>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
