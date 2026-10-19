import { Link } from "@tanstack/react-router";
import {
  HiOutlineMapPin,
  HiOutlineBriefcase,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiCheckBadge,
  HiCheckCircle,
  HiArrowRight,
} from "react-icons/hi2";
import { toast } from "sonner";
import type { Job } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function OrgMark({ name, className }: { name: string; className?: string }) {
  return (
    <span
      className={cn(
        "grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-gradient-to-br from-primary-soft to-primary/10 text-sm font-black text-primary shadow-2xs",
        className
      )}
    >
      {name
        .split(" ")
        .map((w) => w[0])
        .slice(0, 2)
        .join("")}
    </span>
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
        "surface group relative rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40",
        compact ? "p-4.5" : "p-5 sm:p-6"
      )}
    >
      <div className="flex items-start gap-4">
        <OrgMark name={job.org} className={compact ? "h-11 w-11 rounded-xl text-xs" : "h-13 w-13 text-sm"} />

        <div className="min-w-0 flex-1">
          {/* Header: Title, Hospital & Bookmark */}
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-0.5 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <Link
                  to="/jobs/$id"
                  params={{ id: job.id }}
                  className="font-extrabold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors leading-snug break-words line-clamp-2 sm:line-clamp-none"
                >
                  {job.title}
                </Link>
                {job.urgent && (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 shrink-0">
                    Urgent
                  </span>
                )}
              </div>

              <p className="flex items-center gap-1 text-xs font-semibold text-muted-foreground">
                <span className="text-foreground/90">{job.org}</span>
                <HiCheckBadge className="h-3.5 w-3.5 text-primary" title="Verified Hospital Partner" />
                <span className="text-muted-foreground/60">·</span>
                <span>{job.type}</span>
              </p>
            </div>

            <button
              type="button"
              aria-label={saved ? "Unsave job" : "Save job"}
              onClick={toggleSave}
              className="relative z-10 rounded-full p-2 text-muted-foreground hover:bg-primary-soft hover:text-primary transition-colors cursor-pointer shrink-0"
            >
              {saved ? <HiBookmark className="h-5 w-5 text-primary" /> : <HiOutlineBookmark className="h-5 w-5" />}
            </button>
          </div>

          {/* Key Metrics: Experience, Salary, Location */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <HiOutlineBriefcase className="h-4 w-4 text-muted-foreground" />
              <span>{job.exp}</span>
            </span>
            <span className="flex items-center gap-1 font-bold text-foreground">
              <HiOutlineCurrencyRupee className="h-4 w-4 text-primary" />
              <span>{job.salary}</span>
            </span>
            <span className="flex items-center gap-1">
              <HiOutlineMapPin className="h-4 w-4 text-muted-foreground" />
              <span>{job.city}</span>
            </span>
            {job.shift && (
              <span className="hidden sm:inline-flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                {job.shift} Shift
              </span>
            )}
          </div>

          {/* Tags */}
          {!compact && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {job.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-lg bg-muted/70 px-2.5 py-1 text-xs font-medium text-muted-foreground border border-border/50"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          {/* Bottom Action Footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3 text-xs">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="flex items-center gap-1">
                <HiOutlineClock className="h-3.5 w-3.5" />
                <span>{job.posted}</span>
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{job.match}% match</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              {isApplied ? (
                <span className="inline-flex items-center gap-1 rounded-xl bg-primary-soft px-3 py-1.5 font-bold text-xs text-primary">
                  <HiCheckCircle className="h-4 w-4" />
                  <span>Applied</span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={quickApply}
                  className="rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white hover:bg-primary-hover transition-colors shadow-2xs active:scale-[0.98] cursor-pointer"
                >
                  Easy apply
                </button>
              )}

              <Link
                to="/jobs/$id"
                params={{ id: job.id }}
                className="inline-flex items-center gap-1 font-bold text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5"
              >
                <span>View</span>
                <HiArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
