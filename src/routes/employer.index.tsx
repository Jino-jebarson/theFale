import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiArrowRight,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineCheckBadge,
  HiOutlineShieldCheck,
  HiPlus,
  HiOutlineBolt,
  HiOutlineBriefcase,
  HiOutlineBuildingOffice2,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineQuestionMarkCircle,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineBookmark,
  HiOutlineDocumentCheck,
  HiOutlineEye,
} from "react-icons/ri";
import { HiOutlineAcademicCap } from "react-icons/hi2";
import {
  HiArrowRight as Hi2ArrowRight,
  HiOutlineSparkles as Hi2OutlineSparkles,
  HiOutlineClock as Hi2OutlineClock,
  HiOutlineUserGroup as Hi2OutlineUserGroup,
  HiOutlineCheckBadge as Hi2OutlineCheckBadge,
  HiOutlineShieldCheck as Hi2OutlineShieldCheck,
  HiPlus as Hi2Plus,
  HiOutlineBolt as Hi2OutlineBolt,
  HiOutlineBriefcase as Hi2OutlineBriefcase,
  HiOutlineBuildingOffice2 as Hi2OutlineBuildingOffice2,
  HiOutlineArrowTopRightOnSquare as Hi2OutlineArrowTopRightOnSquare,
  HiOutlineQuestionMarkCircle as Hi2OutlineQuestionMarkCircle,
  HiOutlineMapPin as Hi2OutlineMapPin,
  HiOutlineCurrencyRupee as Hi2OutlineCurrencyRupee,
  HiOutlineBookmark as Hi2OutlineBookmark,
  HiOutlineDocumentCheck as Hi2OutlineDocumentCheck,
  HiOutlineEye as Hi2OutlineEye,
} from "react-icons/hi2";
import { RiShieldKeyholeFill, RiVerifiedBadgeFill } from "react-icons/ri";
import { toast } from "sonner";
import { AppShell, StatusBadge, initials } from "@/components/fale/AppShell";
import { OrgMark } from "@/components/fale/JobCard";
import { Button } from "@/components/ui/button";
import { applicants, shifts } from "@/lib/data";
import { useApp } from "@/lib/store";
import banner from "@/assets/employer-banner.jpg";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employer/")({
  head: () => ({
    meta: [
      { title: "Employer Dashboard — FALE" },
      { name: "description", content: "Manage healthcare requirements, applicants and clinical interviews in one place." },
      { property: "og:title", content: "Employer Dashboard — FALE" },
      { property: "og:description", content: "Manage healthcare hiring in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Employer,
});

type FilterTab = "All" | "Open" | "Urgent" | "Draft";

function Employer() {
  const s = useApp();
  const [filter, setFilter] = useState<FilterTab>("All");
  const [isAcceptingApplications, setIsAcceptingApplications] = useState(true);

  const recruiterFullName = String(s.profile["recruiter"] || "Dr. Rajesh K").trim();
  let recruiterDisplayName = "Dr. Rajesh";
  if (recruiterFullName.toLowerCase().startsWith("dr.") || recruiterFullName.toLowerCase().startsWith("dr ")) {
    const parts = recruiterFullName.split(/\s+/);
    recruiterDisplayName = `${parts[0]} ${parts[1] || "Rajesh"}`.replace(",", "");
  } else {
    recruiterDisplayName = recruiterFullName.split(" ")[0]?.replace(",", "") || "there";
  }
  const orgName = String(s.profile["org"] || "Apollo Health City");
  const city = String(s.profile["city"] || "Chennai");
  const candidateCredits = s.candidateCredits ?? 3;

  const openRolesCount = s.postedJobs.filter((j) => j.status === "Open").length;
  const interviewCount = applicants.filter((a) => a.status === "Interview").length;

  const filteredJobs = s.postedJobs.filter((j) => {
    if (filter === "Open") return j.status === "Open";
    if (filter === "Draft") return j.status === "Draft";
    if (filter === "Urgent") {
      const isUrgent =
        j.dept?.toLowerCase().includes("critical") ||
        j.dept?.toLowerCase().includes("emergency") ||
        j.title?.toLowerCase().includes("icu");
      return j.status === "Open" && isUrgent;
    }
    return true;
  });

  const activeShifts = s.postedShifts && s.postedShifts.length > 0 ? s.postedShifts : shifts.slice(0, 3);

  return (
    <AppShell>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[290px_minmax(0,1fr)_330px] w-full min-w-0 max-w-full">
        {/* ================= LEFT RAIL: HOSPITAL PROFILE CARD ================= */}
        <aside className="w-full min-w-0 max-w-full space-y-4">
          <div className="surface w-full min-w-0 max-w-full overflow-hidden rounded-3xl border border-border/80 bg-card shadow-sm transition-shadow hover:shadow-md">
            {/* Cover photo banner — Nothing × DailyObjects matte charcoal with saffron glyph glow */}
            <div className="relative h-20 w-full bg-[#1C1B1A] dark:bg-[#151413] overflow-hidden">
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:12px_12px]" />
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/30 blur-2xl pointer-events-none" />
              <div className="absolute left-3.5 top-2.5 flex items-center gap-1.5 font-mono text-[9px] font-semibold uppercase tracking-widest text-white/60">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                <span>NABH · Tier 1</span>
              </div>
            </div>

            {/* Avatar & Hospital Identity */}
            <div className="-mt-10 px-4 sm:px-5 pb-5 text-center min-w-0">
              <div className="relative mx-auto inline-block">
                <span className="grid h-20 w-20 place-items-center rounded-2xl border-4 border-card bg-primary-soft text-2xl font-black text-primary shadow-md">
                  {initials(orgName)}
                </span>
                <span
                  title="NABH Verified Hospital"
                  className="absolute -bottom-1 -right-1 grid h-6 w-6 place-items-center rounded-full bg-emerald-600 text-white ring-2 ring-card shadow-sm"
                >
                  <RiVerifiedBadgeFill className="h-4 w-4" />
                </span>
              </div>

              <h2 className="mt-2.5 text-base font-extrabold text-foreground tracking-tight leading-snug truncate">
                {orgName}
              </h2>
              <p className="text-xs font-medium text-muted-foreground mt-0.5 truncate">
                Recruiter: {recruiterFullName}
              </p>
              <p className="text-[11px] text-muted-foreground/80 mt-0.5 truncate">
                {city}, Tamil Nadu
              </p>
            </div>

            {/* Hiring Readiness - Apple Style Meter */}
            <div className="border-t border-border/70 bg-muted/20 px-4 sm:px-5 py-4 min-w-0">
              <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-foreground min-w-0 truncate">
                  <Hi2OutlineSparkles className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">Hiring Readiness</span>
                </span>
                <span className="shrink-0 font-extrabold text-primary">94% · Verified</span>
              </div>
              <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400 shadow-sm shadow-primary/25 transition-all duration-500"
                  style={{ width: "94%" }}
                />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed">
                Your hospital profile is 100% verified for direct 48-hour interview matching and shift broadcasts.
              </p>
              <Link
                to="/employer/profile"
                className="mt-2.5 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>Edit hospital profile</span>
                <Hi2ArrowRight className="h-3 w-3 shrink-0" />
              </Link>
            </div>

            {/* Analytics Grid */}
            <div className="grid grid-cols-3 border-t border-border/70 text-center divide-x divide-border/70 bg-card">
              <Link to="/employer/post" className="p-2 sm:p-3 transition-colors hover:bg-muted/30 group min-w-0">
                <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                  <Hi2OutlineBriefcase className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="truncate">Roles</span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-foreground group-hover:text-primary transition-colors">
                  {openRolesCount}
                </div>
                <div className="text-[9px] sm:text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                  Active
                </div>
              </Link>

              <Link to="/employer/applicants" className="p-2 sm:p-3 transition-colors hover:bg-muted/30 group min-w-0">
                <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                  <Hi2OutlineDocumentCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="truncate">Applied</span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-foreground group-hover:text-primary transition-colors">
                  {applicants.length}
                </div>
                <div className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground truncate">
                  {interviewCount} interviews
                </div>
              </Link>

              <Link to="/employer/candidates" className="p-2 sm:p-3 transition-colors hover:bg-muted/30 group min-w-0">
                <div className="flex items-center justify-center gap-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-muted-foreground truncate">
                  <Hi2OutlineBolt className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span className="truncate">Credits</span>
                </div>
                <div className="mt-1 text-base sm:text-lg font-black text-foreground group-hover:text-primary transition-colors">
                  {candidateCredits}
                </div>
                <div className="text-[9px] sm:text-[10px] font-semibold text-muted-foreground truncate">
                  Available
                </div>
              </Link>
            </div>

            {/* Direct Application Accepting Toggle */}
            <div className="border-t border-border/70 p-3 sm:p-4 bg-muted/10">
              <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-border/70 bg-card p-3 shadow-2xs">
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        isAcceptingApplications ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
                      )}
                    />
                    <span className="truncate">Direct Applications</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground truncate">Full-time & Locum shifts</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsAcceptingApplications(!isAcceptingApplications);
                    toast.info(
                      isAcceptingApplications
                        ? "Facility direct applications paused"
                        : "Facility actively receiving direct candidate applications"
                    );
                  }}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    isAcceptingApplications ? "bg-emerald-600" : "bg-muted"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                      isAcceptingApplications ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* FALE Clinical Talent Pool Card */}
          <div className="surface p-4 rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary-soft/40 dark:to-primary-soft/20 shadow-xs w-full min-w-0 overflow-hidden">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary shadow-2xs">
                <HiOutlineAcademicCap className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-extrabold text-xs text-foreground leading-snug">
                    FALE Clinician Pool
                  </h3>
                  <span className="rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 px-1.5 py-0.5 text-[9px] font-bold shrink-0">
                    Live
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                  12,400+ council-verified doctors, ICU nurses & allied specialists ready for direct hire.
                </p>
                <Button variant="outline" size="sm" asChild className="mt-3 w-full rounded-xl font-bold h-8 text-xs border-border/80">
                  <Link to="/employer/candidates">Browse candidates</Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Institutional Trust Badge */}
          <div className="surface p-4 rounded-3xl border border-border/80 bg-gradient-to-br from-primary-soft/60 via-card to-card dark:from-primary-soft/20 shadow-xs w-full min-w-0 overflow-hidden">
            <div className="flex items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-xs">
                <Hi2OutlineBolt className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 space-y-0.5">
                <p className="text-xs font-bold text-foreground">48-Hour Clinical Placement</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  All applicants undergo DigiLocker credential pre-verification and state medical council audits.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* ================= CENTER FEED: HERO BANNER & REQUIREMENTS ================= */}
        <section className="w-full min-w-0 max-w-full space-y-6">
          {/* Hero Banner */}
          <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-card w-full min-w-0">
            <img
              src={banner}
              alt="Healthcare leadership and clinical team in a modern hospital"
              width={1600}
              height={690}
              className="h-60 sm:h-64 w-full object-cover"
              style={{ objectPosition: "left 15%" }}
            />
            <div
              className="absolute inset-y-0 right-0 flex w-full flex-col justify-center p-5 sm:p-7 sm:w-[58%] lg:w-[54%] z-10 bg-gradient-to-t from-card via-card/95 via-60% to-transparent sm:bg-gradient-to-r sm:from-transparent sm:via-card/95 sm:via-25% sm:to-card"
            >
              <div className="max-w-md w-full">
                <p className="eyebrow">The 48-hour match</p>
                <h1 className="mt-1 text-xl sm:text-2xl font-extrabold leading-tight text-foreground tracking-tight">
                  Hi {recruiterDisplayName}, 8 great matches are waiting.
                </h1>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-normal">
                  Hand-picked verified healthcare candidates for your roles.
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
                  <Button asChild className="rounded-xl font-bold shadow-xs">
                    <Link to="/employer/post">
                      <Hi2Plus className="h-4 w-4 mr-1 stroke-[2.5]" /> Post a job
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl font-bold bg-card border-border hover:bg-muted/50">
                    <Link to="/employer/post-shift">
                      <Hi2OutlineClock className="h-4 w-4 mr-1 text-primary" /> Post a shift
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Filter & Recommendation Header */}
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-black tracking-tight text-foreground flex flex-wrap items-center gap-2">
                  <span>Your active requirements</span>
                  <span className="whitespace-nowrap shrink-0 rounded-full bg-primary-soft text-primary px-2.5 py-0.5 text-xs font-bold">
                    {filteredJobs.length} roles
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Live openings, candidate applications and active hiring stages for {orgName}
                </p>
              </div>
              <Link
                to="/employer/post"
                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
              >
                <span>+ Post new job</span>
                <Hi2OutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* Apple-style Filter Pill Tabs */}
            <div className="mb-4 flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
              {(["All", "Open", "Urgent", "Draft"] as const).map((tab) => (
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

            {/* Enhanced Requirement Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredJobs.map((job) => {
                const isUrgent =
                  job.dept?.toLowerCase().includes("critical") ||
                  job.dept?.toLowerCase().includes("emergency") ||
                  job.title?.toLowerCase().includes("icu");

                return (
                  <div
                    key={job.id}
                    className="surface group relative flex flex-col justify-between rounded-3xl border border-border/80 p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 bg-card"
                  >
                    <div>
                      {/* Department Header & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary font-black text-sm shadow-2xs">
                            <Hi2OutlineBuildingOffice2 className="h-5 w-5" />
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-muted-foreground flex items-center gap-1 truncate">
                              <span>{job.dept}</span>
                              <Hi2OutlineCheckBadge className="h-3.5 w-3.5 text-primary shrink-0" title="Active Dept" />
                            </p>
                            <Link
                              to="/employer/applicants"
                              className="font-extrabold text-sm text-foreground group-hover:text-primary transition-colors line-clamp-1"
                            >
                              {job.title}
                            </Link>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <StatusBadge status={job.status} />
                        </div>
                      </div>

                      {/* Metadata Chips */}
                      <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-bold text-foreground">
                          <Hi2OutlineUserGroup className="h-3.5 w-3.5 text-primary" />
                          <span>{job.openings} {job.openings === 1 ? "opening" : "openings"}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Hi2OutlineMapPin className="h-3.5 w-3.5" />
                          <span>{city}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Hi2OutlineBriefcase className="h-3.5 w-3.5" />
                          <span>Full-time</span>
                        </span>
                      </div>

                      {/* Pre-screened candidates pill */}
                      <div className="mt-3 flex items-center justify-between rounded-xl bg-muted/40 px-3 py-1.5 text-xs">
                        <span className="text-[11px] font-medium text-muted-foreground">Pre-screened Pool</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          4 verified candidates
                        </span>
                      </div>
                    </div>

                    {/* Bottom Status & Direct Action */}
                    <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                          48h Match
                        </span>
                        {isUrgent && (
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                            Urgent
                          </span>
                        )}
                      </div>

                      <Link
                        to="/employer/applicants"
                        className="inline-flex items-center gap-1 font-bold text-xs text-primary group-hover:translate-x-0.5 transition-transform"
                      >
                        <span>View applicants</span>
                        <Hi2ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}

              {filteredJobs.length === 0 && (
                <div className="col-span-full rounded-3xl border border-dashed border-border/80 p-8 text-center bg-card">
                  <p className="text-sm font-bold text-foreground">No requirements found under {filter}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Create a new job posting or change your filter selection.
                  </p>
                  <Button asChild size="sm" className="mt-4 rounded-xl font-bold">
                    <Link to="/employer/post">
                      <Hi2Plus className="h-4 w-4 mr-1" /> Post a new requirement
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================= RIGHT RAIL: SHIFTS, APPLICANTS & RADAR ================= */}
        <aside className="w-full min-w-0 max-w-full space-y-5">
          {/* Instant Locum Shifts */}
          <div className="surface p-4 sm:p-5 rounded-3xl border border-border/80 shadow-sm bg-card w-full min-w-0 overflow-hidden">
            <div className="mb-3.5 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground truncate">
                  <Hi2OutlineClock className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">Instant Locum Shifts</span>
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Active hospital emergency cover</p>
              </div>
              <Link to="/employer/post-shift" className="text-xs font-bold text-primary hover:underline shrink-0">
                + Post shift
              </Link>
            </div>

            <div className="space-y-2.5">
              {activeShifts.map((shift) => (
                <div
                  key={shift.id}
                  className="rounded-2xl border border-border/70 bg-muted/20 p-3 transition-colors hover:bg-muted/40"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-extrabold text-foreground truncate">{shift.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {shift.date} · {shift.time}
                      </p>
                    </div>
                    <span className="font-extrabold text-xs text-primary shrink-0">
                      ₹{shift.rate}/hr
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Broadcasting
                    </span>
                    <Link
                      to="/employer/post-shift"
                      className="font-bold text-primary hover:underline"
                    >
                      Manage shift
                    </Link>
                  </div>
                </div>
              ))}
            </div>

            <Button asChild variant="outline" size="sm" className="mt-3.5 w-full rounded-xl font-bold h-8 text-xs border-border/80">
              <Link to="/employer/post-shift">Broadcast urgent shift</Link>
            </Button>
          </div>

          {/* Recent Candidate Applications Stream */}
          <div className="surface p-4 sm:p-5 rounded-3xl border border-border/80 shadow-sm bg-card w-full min-w-0 overflow-hidden">
            <div className="mb-3.5 flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h3 className="flex items-center gap-2 text-sm font-extrabold text-foreground truncate">
                  <Hi2OutlineUserGroup className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">Recent Applicants</span>
                </h3>
                <p className="text-[11px] text-muted-foreground mt-0.5 truncate">Pre-screened & council verified</p>
              </div>
              <Link to="/employer/applicants" className="text-xs font-bold text-primary hover:underline shrink-0">
                See all
              </Link>
            </div>

            <div className="space-y-3">
              {applicants.slice(0, 4).map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/10 p-2.5 transition-colors hover:bg-muted/30"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-xs font-black text-primary">
                    {initials(a.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-bold text-foreground truncate">{a.name}</p>
                      {a.verified && (
                        <Hi2OutlineShieldCheck
                          className="h-3.5 w-3.5 text-primary shrink-0"
                          title="Council Verified"
                        />
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {a.role} · {a.exp}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-1.5 py-0.2 text-[9px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                        {a.match}% Match
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">{a.appliedDate}</span>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={a.status} />
                  </div>
                </div>
              ))}
            </div>

            <Link
              to="/employer/applicants"
              className="mt-3.5 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
            >
              <span>Review all {applicants.length} applicants</span>
              <Hi2ArrowRight className="h-3 w-3" />
            </Link>
          </div>

          {/* Active Clinician Radar */}
          <div className="surface p-4 sm:p-5 rounded-3xl border border-border/80 shadow-sm bg-gradient-to-br from-card via-card to-primary-soft/30 dark:to-primary-soft/10 w-full min-w-0 overflow-hidden">
            <div className="mb-2.5 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-white">
                <Hi2OutlineBolt className="h-4 w-4" />
              </span>
              <div>
                <h4 className="text-xs font-black text-foreground">Talent Radar · {city}</h4>
                <p className="text-[10px] text-muted-foreground">Available verified clinicians nearby</p>
              </div>
            </div>

            <div className="space-y-2 mt-3 text-xs">
              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-1.5">
                <span className="text-[11px] font-medium text-foreground">Staff Nurses (ICU/OT)</span>
                <span className="font-extrabold text-primary text-[11px]">48 ready</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-1.5">
                <span className="text-[11px] font-medium text-foreground">Duty Medical Officers</span>
                <span className="font-extrabold text-primary text-[11px]">19 ready</span>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-1.5">
                <span className="text-[11px] font-medium text-foreground">Lab & Imaging Techs</span>
                <span className="font-extrabold text-primary text-[11px]">32 ready</span>
              </div>
            </div>

            <Button asChild size="sm" className="mt-3.5 w-full rounded-xl font-bold h-8 text-xs">
              <Link to="/employer/candidates">Search candidate directory</Link>
            </Button>
          </div>
        </aside>
      </div>

      {/* Hospital Institutional Support & Escrow Assistance Banner — Straight Full-Width at Bottom */}
      <div className="mt-6 surface p-4 sm:p-5 rounded-3xl border border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-xs w-full min-w-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Left: Support Info */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
                <Hi2OutlineQuestionMarkCircle className="h-4 w-4" />
                <span>Hospital Concierge & Clinical Support</span>
              </span>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                24/7 Available
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Direct assistance with custom hospital shift broadcasts, credential audits, and escrow settlements.
            </p>
          </div>

          {/* Right: Contact Links & CTA Button */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-5">
            <div className="flex items-center gap-3 text-xs">
              <a
                href="mailto:contact@thefale.com"
                className="font-mono text-[11px] font-bold text-primary hover:underline"
              >
                contact@thefale.com
              </a>
              <span className="h-3.5 w-px bg-border/80" />
              <a
                href="tel:+917338367726"
                className="font-mono text-[11px] font-bold text-foreground hover:text-primary transition-colors"
              >
                +91 73383 67726
              </a>
            </div>

            <Link
              to="/support"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-card border border-border/80 px-4 py-2 text-xs font-bold text-foreground hover:bg-muted/40 transition-colors shadow-2xs whitespace-nowrap"
            >
              <span>Visit Help Center & FAQs</span>
              <Hi2ArrowRight className="h-3.5 w-3.5 text-primary shrink-0" />
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

export default Employer;
