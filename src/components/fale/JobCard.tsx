import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  HiOutlineMapPin,
  HiOutlineBriefcase,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiCheckBadge,
  HiOutlineCheckCircle,
  HiArrowRight,
  HiOutlineShieldCheck,
  HiOutlineAcademicCap,
  HiOutlineLockClosed,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { toast } from "sonner";
import { BotMessageSquare } from "lucide-react";
import type { Job } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled } from "@/lib/api";
import { applyForJob, saveJob, unsaveJob } from "@/lib/adapters/jobAdapter";
import { estimateDistanceKm } from "@/lib/distanceUtil";
import { explainJobMatchWithAi } from "@/lib/adapters/aiAdapter";

export function OrgMark({ name, className }: { name: string; className?: string }) {
  return (
    <div className="relative shrink-0">
      <span
        className={cn(
          "grid h-12 w-12 place-items-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-soft to-primary/10 text-sm font-black text-primary shadow-2xs",
          className
        )}
      >
        {name
          .split(" ")
          .map((w) => w[0])
          .slice(0, 2)
          .join("")}
      </span>
      <span
        title="Verified Hospital Partner"
        className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-white ring-2 ring-card shadow-2xs"
      >
        <RiVerifiedBadgeFill className="h-2.5 w-2.5" />
      </span>
    </div>
  );
}

export function JobCard({ job, compact }: { job: Job; compact?: boolean }) {
  const s = useApp();
  const jobAction = useConfirmedAction();
  const saved = s.saved.includes(job.id);
  const app = s.applied.find((a) => a.jobId === job.id);
  const isApplied = Boolean(app && app.status !== "Withdrawn");

  const isStudent =
    s.candidateLevel === "student" ||
    s.profile["cadreLevel"] === "student" ||
    s.profile["level"] === "student";
  const isInternship = job.kind === "internship" || job.type === "Internship";
  const isRestrictedForStudent = isStudent && !isInternship;

  const p = (s.profile || {}) as Record<string, unknown>;
  const candLoc = {
    city: String(p["city"] || p["area"] || ""),
    address: String(p["addressLine"] || p["address"] || ""),
    pincode: String(p["pincode"] || ""),
  };
  const { distanceKm, isSameCity, description: distanceDesc } = estimateDistanceKm(candLoc, {
    city: job.city,
    org: job.org,
  });

  const [aiRationale, setAiRationale] = useState<string | null>(null);
  const [loadingRationale, setLoadingRationale] = useState(false);

  const handleGetAiRationale = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (aiRationale || loadingRationale) return;

    setLoadingRationale(true);
    try {
      const candidateRole = String(p["role"] || p["profession"] || p["designation"] || "");
      const candidateQual = String(p["qualification"] || p["primaryDegree"] || "");
      const candidateCity = String(p["city"] || p["area"] || "");

      const res = await explainJobMatchWithAi(
        job.title,
        job.org,
        distanceKm,
        job.match,
        {
          role: candidateRole,
          qualification: candidateQual,
          city: candidateCity,
          council: String(p["council"] || ""),
        }
      );
      if (res.response) {
        setAiRationale(res.response);
      }
    } catch {
      setAiRationale(null);
      toast.error("Unable to generate Ally match explanation right now.");
    } finally {
      setLoadingRationale(false);
    }
  };

  const toggleSave = async (event: React.MouseEvent) => {
    event.preventDefault(); event.stopPropagation();
    await jobAction.run(async () => {
      if (saved) await unsaveJob(job.id); else await saveJob(job.id);
      setState((previous) => ({ saved: saved ? previous.saved.filter((id) => id !== job.id) : [...previous.saved, job.id] }));
      toast.success(saved ? "Role removed from saved jobs" : "Role saved");
    });
  };

  const quickApply = async (event: React.MouseEvent) => {
    event.preventDefault(); event.stopPropagation();
    if (isRestrictedForStudent) { toast.info("Students can apply for internships only."); return; }
    await jobAction.run(async () => {
      await applyForJob(job.id);
      setState((previous) => ({ applied: [{ jobId: job.id, status: "Applied", date: new Date().toLocaleDateString("en-IN") }, ...previous.applied.filter((item) => item.jobId !== job.id)] }));
      toast.success("Application submitted");
    });
  };

  return (
    <div
      className={cn(
        "surface group relative rounded-2xl border border-border/70 bg-card p-4.5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200",
        compact ? "p-4" : "p-4.5 sm:p-6"
      )}
    >
      {/* Top Row: Institution Logo + Name & Match Badge + Bookmark */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <OrgMark name={job.org} className={compact ? "h-10 w-10 text-xs" : "h-11 w-11 sm:h-12 sm:w-12 text-xs sm:text-sm"} />

          <div className="min-w-0">
            <h4 className="text-xs sm:text-sm font-semibold text-foreground truncate">
              {job.org}
            </h4>
            <p className="text-[11px] text-muted-foreground truncate">
              {job.city} · {isInternship ? "Internship Track" : job.type}
              {job.dept && ` · ${job.dept}`}
            </p>
          </div>
        </div>

        {/* Right: Match & Bookmark */}
        <div className="flex items-center gap-1.5 shrink-0">
          {isInternship && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-black text-primary">
              <HiOutlineAcademicCap className="h-3 w-3" />
              <span>Internship</span>
            </span>
          )}
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
              (job.match ?? 0) >= 70
                ? "bg-primary-soft border-primary/20 text-primary"
                : (job.match ?? 0) >= 40
                ? "bg-primary-soft/60 border-primary/15 text-primary/80"
                : "bg-muted border-border text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                (job.match ?? 0) >= 70
                  ? "bg-primary animate-pulse"
                  : (job.match ?? 0) >= 40
                  ? "bg-primary/70"
                  : "bg-muted-foreground"
              )}
            />
            {(job.match ?? 0) >= 90 ? `Exact Match (${job.match}%)` : `${job.match}% Match`}
          </span>

          <button
            type="button"
            aria-label={saved ? "Unsave job" : "Save job"}
            disabled={jobAction.isPending} onClick={toggleSave}
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
          >
            {saved ? <HiBookmark className="h-4.5 w-4.5 text-primary" /> : <HiOutlineBookmark className="h-4.5 w-4.5" />}
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
        {!compact && (
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
            {job.tags.slice(0, 3).map((tag) => (
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
        )}

        {/* Match Explainer: Ally Clinical Match Rationale */}
        <div className="mt-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary-soft/60 via-primary-soft/25 to-background p-3 sm:p-3.5 space-y-2.5 transition-all shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary text-primary-foreground shadow-2xs shrink-0">
                <BotMessageSquare className="h-3.5 w-3.5" />
              </span>
              <span className="text-xs font-bold text-foreground tracking-tight">
                Ally Match Rationale
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-background/90 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-muted-foreground shrink-0 shadow-2xs">
                <HiOutlineMapPin className="h-3 w-3 text-primary shrink-0" />
                <span>{isSameCity || distanceKm <= 50 ? `${distanceKm} km commute` : `${distanceKm} km · Relocation`}</span>
              </span>
            </div>

            {!aiRationale && (
              <button
                type="button"
                onClick={handleGetAiRationale}
                disabled={loadingRationale}
                className="self-start sm:self-auto inline-flex items-center gap-1.5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground px-3 py-1 text-[11px] font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer disabled:opacity-70 shrink-0"
              >
                <BotMessageSquare className={cn("h-3.5 w-3.5", loadingRationale && "animate-pulse")} />
                <span>{loadingRationale ? "Ally is analyzing..." : "Explain with Ally"}</span>
              </button>
            )}
          </div>

          {aiRationale ? (
            <div className="rounded-xl bg-background/90 border border-primary/20 p-2.5 text-xs text-foreground leading-relaxed animate-in fade-in duration-200">
              <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-primary mb-1">
                <BotMessageSquare className="h-3 w-3 shrink-0" />
                <span>Verified Clinical Fit</span>
              </div>
              <p className="text-foreground/90 font-medium leading-relaxed">{aiRationale}</p>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground leading-relaxed pt-0.5">
              {isSameCity || distanceKm <= 50 ? "Convenient local commute of" : "Inter-city relocation opening"}{" "}
              <strong className="text-foreground font-semibold">{distanceKm} km</strong> from your registered area. Aligns with verified{" "}
              <strong className="text-foreground font-semibold">{job.dept || "clinical"}</strong> unit requirements at{" "}
              <span className="font-semibold text-foreground">{job.org}</span>.
            </p>
          )}
        </div>
      </div>

      {/* Metrics & Action Bar */}
      <div className="mt-5 pt-4 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-baseline gap-2.5 text-xs text-muted-foreground">
          <span className="text-sm font-bold text-foreground">
            {job.stipend || job.salary}
          </span>
          {!job.stipend && <span className="text-[11px]">/ month</span>}
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

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Link
            to="/jobs/$id"
            params={{ id: job.id }}
            className="inline-flex items-center justify-center font-semibold text-xs h-8 px-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Details
          </Link>

          {isApplied ? (
            <span className="inline-flex items-center gap-1 rounded-xl bg-primary-soft border border-primary/20 px-3.5 py-1.5 text-xs font-bold text-primary">
              <HiOutlineCheckCircle className="h-4 w-4" />
              <span>Applied</span>
            </span>
          ) : isRestrictedForStudent ? (
            <span
              title="Students can apply to internships. Full-time hospital roles unlock upon graduation with council registration."
              className="inline-flex items-center gap-1 rounded-xl bg-muted border border-border/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground cursor-not-allowed select-none"
            >
              <HiOutlineLockClosed className="h-3.5 w-3.5" />
              <span>Internships only for students</span>
            </span>
          ) : (
            <button
              type="button"
              disabled={jobAction.isPending} onClick={quickApply}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-white hover:bg-primary-hover transition-colors shadow-2xs active:scale-[0.98] cursor-pointer"
            >
              <span>Easy Apply</span>
              <HiArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
