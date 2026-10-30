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
} from "react-icons/hi2";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { toast } from "sonner";
import type { Job } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

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
        className="absolute -bottom-1 -right-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-600 text-white ring-2 ring-card shadow-2xs"
      >
        <RiVerifiedBadgeFill className="h-2.5 w-2.5" />
      </span>
    </div>
  );
}

export function JobCard({ job, compact }: { job: Job; compact?: boolean }) {
  const s = useApp();
  const saved = s.saved.includes(job.id);
  const app = s.applied.find((a) => a.jobId === job.id);
  const isApplied = Boolean(app && app.status !== "Withdrawn");

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setState((x) => ({
      saved: saved ? x.saved.filter((i) => i !== job.id) : [...x.saved, job.id],
    }));
    if (!saved) {
      toast.success("Role saved to your wishlist");
    }
  };

  const quickApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    setState((x) => ({
      applied: [{ jobId: job.id, status: "Applied", date: now }, ...x.applied.filter((a) => a.jobId !== job.id)],
    }));
    toast.success("Application sent via Easy Apply!", {
      description: `Your verified profile was shared directly with ${job.org}.`,
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
            aria-label={saved ? "Unsave job" : "Save job"}
            onClick={toggleSave}
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
        )}
      </div>

      {/* Metrics & Action Bar */}
      <div className="mt-5 pt-4 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Link
            to="/jobs/$id"
            params={{ id: job.id }}
            className="inline-flex items-center justify-center font-semibold text-xs h-8 px-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            Details
          </Link>

          {isApplied ? (
            <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 px-3.5 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <HiOutlineCheckCircle className="h-4 w-4" />
              <span>Applied</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={quickApply}
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
