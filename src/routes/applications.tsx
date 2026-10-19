import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiCheck,
  HiOutlineArrowUturnLeft,
  HiOutlineArrowPath,
  HiCheckBadge,
  HiOutlineMapPin,
  HiOutlineBriefcase,
  HiOutlineCurrencyRupee,
  HiOutlineCalendarDays,
  HiOutlineMagnifyingGlass,
  HiXMark,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineClock,
  HiOutlineDocumentCheck,
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell } from "@/components/fale/AppShell";
import { OrgMark } from "@/components/fale/JobCard";
import { WithdrawModal } from "@/components/fale/WithdrawModal";
import { Button } from "@/components/ui/button";
import { jobs } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/applications")({
  head: () => ({
    meta: [
      { title: "My Applications — FALE" },
      { name: "description", content: "Track every healthcare job application from first hello to first day." },
      { property: "og:title", content: "My Applications — FALE" },
      { property: "og:description", content: "Track your healthcare job applications on FALE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Applications,
});

const stages = ["Applied", "Under review", "Interview", "Offer", "Hired"] as const;

function getStatusDetails(status: string, date: string, org: string) {
  switch (status) {
    case "Applied":
      return {
        badgeColor: "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border-blue-200 dark:border-blue-900/40",
        summary: `Application submitted to ${org} clinical talent desk on ${date}. Screening in progress.`,
      };
    case "Under review":
      return {
        badgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border-amber-200 dark:border-amber-900/40",
        summary: `${org} reviewed your clinical profile & registration. Departmental review underway.`,
      };
    case "Interview":
      return {
        badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40",
        summary: `Shortlisted for clinical interview by ${org}. Scheduling details sent via email/SMS.`,
      };
    case "Offer":
      return {
        badgeColor: "bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border-purple-200 dark:border-purple-900/40",
        summary: `Formal offer letter extended by ${org}. Review compensation details and joining terms.`,
      };
    case "Hired":
      return {
        badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40",
        summary: `Offer accepted! Clinical credentialing and onboarding confirmed.`,
      };
    case "Withdrawn":
      return {
        badgeColor: "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 dark:border-rose-900/40",
        summary: `Application withdrawn on ${date}. You may re-apply anytime if your availability changes.`,
      };
    default:
      return {
        badgeColor: "bg-muted text-muted-foreground border-border/60",
        summary: `Status updated on ${date}.`,
      };
  }
}

function Applications() {
  const s = useApp();
  const [tab, setTab] = useState<"Active" | "Closed">("Active");
  const [q, setQ] = useState("");
  const [withdrawingApp, setWithdrawingApp] = useState<{ jobId: string; title: string; org: string } | null>(null);

  const activeApps = useMemo(
    () => s.applied.filter((a) => !["Not selected", "Withdrawn"].includes(a.status)),
    [s.applied]
  );

  const closedApps = useMemo(
    () => s.applied.filter((a) => ["Not selected", "Withdrawn"].includes(a.status)),
    [s.applied]
  );

  const list = useMemo(() => {
    const baseList = tab === "Active" ? activeApps : closedApps;
    if (!q.trim()) return baseList;
    const query = q.toLowerCase();
    return baseList.filter((a) => {
      const j = jobs.find((x) => x.id === a.jobId);
      if (!j) return false;
      return (
        j.title.toLowerCase().includes(query) ||
        j.org.toLowerCase().includes(query) ||
        j.city.toLowerCase().includes(query) ||
        (j.dept && j.dept.toLowerCase().includes(query))
      );
    });
  }, [tab, activeApps, closedApps, q]);

  const handleWithdrawConfirm = (reason: string, notes: string) => {
    if (!withdrawingApp) return;
    const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    setState((x) => ({
      applied: x.applied.map((item) =>
        item.jobId === withdrawingApp.jobId ? { ...item, status: "Withdrawn", date: now } : item
      ),
    }));
    toast.info("Application withdrawn", {
      description: `Your application for ${withdrawingApp.title} at ${withdrawingApp.org} has been withdrawn (${reason}).`,
    });
  };

  const handleReapply = (jobId: string, title: string, org: string) => {
    const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    setState((x) => ({
      applied: x.applied.map((item) =>
        item.jobId === jobId ? { ...item, status: "Applied", date: now } : item
      ),
    }));
    toast.success("Application re-submitted!", {
      description: `Your application for ${title} at ${org} is active again.`,
    });
  };

  return (
    <AppShell>
      {/* ================= HERO HEADER ================= */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
            Every step, in one place.
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Follow your healthcare job applications from first hello to your first day.
          </p>
        </div>
      </div>

      {/* ================= CLEAN NAVIGATION BAR (APPLE STYLE) ================= */}
      <div className="surface mb-6 rounded-3xl border border-border/80 bg-card p-2 sm:p-2.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Segmented Tabs */}
        <div className="flex items-center rounded-2xl bg-muted/60 p-1 text-xs font-semibold border border-border/50 shrink-0">
          {(["Active", "Closed"] as const).map((t) => {
            const count = t === "Active" ? activeApps.length : closedApps.length;
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={cn(
                  "flex items-center gap-2 rounded-xl px-4 py-2 transition-all cursor-pointer font-bold",
                  tab === t
                    ? "bg-card text-primary shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{t === "Active" ? "Active" : "Closed"}</span>
                <span
                  className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-black",
                    tab === t ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="flex flex-1 items-center gap-2 rounded-2xl bg-muted/40 px-3.5 py-1 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 transition-all sm:max-w-xs w-full">
          <HiOutlineMagnifyingGlass className="h-4 w-4 text-primary shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by role or hospital..."
            className="h-9 w-full bg-transparent text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none font-medium"
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ("")}
              className="rounded-full p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <HiXMark className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* ================= APPLICATIONS LIST ================= */}
      <div className="space-y-4">
        {list.map((a) => {
          const j = jobs.find((x) => x.id === a.jobId);
          if (!j) return null;
          const idx = stages.indexOf(a.status as (typeof stages)[number]);
          const isWithdrawn = a.status === "Withdrawn";
          const details = getStatusDetails(a.status, a.date, j.org);

          return (
            <div
              key={a.jobId}
              className="surface group relative rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md"
            >
              {/* Card Top: OrgMark, Title, Chips & Status Action */}
              <div className="flex items-start gap-3 sm:gap-4">
                <OrgMark name={j.org} className="h-12 w-12 sm:h-13 sm:w-13 text-sm shrink-0" />

                <div className="flex-1 min-w-0">
                  {/* Top Bar: Status Badge & Withdraw Action */}
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-bold border",
                        details.badgeColor
                      )}
                    >
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                      {a.status}
                    </span>

                    {tab === "Active" && (
                      <button
                        type="button"
                        onClick={() => setWithdrawingApp({ jobId: a.jobId, title: j.title, org: j.org })}
                        title="Withdraw this application"
                        className="inline-flex items-center gap-1 rounded-xl border border-border/80 bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground transition-all hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:border-rose-900/60 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 active:scale-[0.98] cursor-pointer"
                      >
                        <HiOutlineArrowUturnLeft className="h-3.5 w-3.5" />
                        <span>Withdraw</span>
                      </button>
                    )}
                  </div>

                  {/* Title - Full Width */}
                  <div className="mt-1.5">
                    <Link
                      to="/jobs/$id"
                      params={{ id: j.id }}
                      className="font-extrabold text-base sm:text-lg text-foreground group-hover:text-primary transition-colors leading-snug break-words inline-flex items-center gap-1.5"
                    >
                      <span>{j.title}</span>
                      <HiOutlineArrowTopRightOnSquare className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 text-primary" />
                    </Link>
                  </div>

                  {/* Hospital & Department */}
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span className="inline-flex items-center gap-1 font-bold text-foreground">
                      <span>{j.org}</span>
                      <HiCheckBadge className="h-4 w-4 text-primary shrink-0" title="Verified Hospital" />
                    </span>
                    {j.dept && (
                      <span className="rounded-lg bg-primary-soft/80 px-2 py-0.5 text-[11px] font-bold text-primary shrink-0">
                        {j.dept}
                      </span>
                    )}
                  </div>

                  {/* Metadata Chips Bar */}
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-xl bg-muted/40 px-2.5 py-1 font-semibold text-muted-foreground">
                      <HiOutlineMapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{j.city}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-xl bg-muted/40 px-2.5 py-1 font-semibold text-muted-foreground">
                      <HiOutlineBriefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{j.type}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-xl bg-muted/40 px-2.5 py-1 font-semibold text-muted-foreground">
                      <HiOutlineCurrencyRupee className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{j.salary}</span>
                    </span>

                    <span className="inline-flex items-center gap-1 rounded-xl bg-muted/40 px-2.5 py-1 font-semibold text-muted-foreground">
                      <HiOutlineCalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{isWithdrawn ? `Withdrawn ${a.date}` : `Applied ${a.date}`}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* ================= STEPPER / JOURNEY ================= */}
              {tab === "Active" ? (
                <div className="mt-5 pt-4 sm:pt-5 border-t border-border/60">
                  {/* Mobile: Vertical Journey (comes down step-by-step with balanced spacing) */}
                  <div className="sm:hidden space-y-0">
                    {stages.map((st, i) => {
                      const isCompleted = i < idx;
                      const isCurrent = i === idx;
                      const isUpcoming = i > idx;
                      const isLast = i === stages.length - 1;

                      return (
                        <div key={st} className="flex items-stretch gap-3">
                          {/* Left Column: Centered Circle Node + Vertical Line */}
                          <div className="flex flex-col items-center shrink-0 w-7">
                            <div
                              className={cn(
                                "grid h-6 w-6 place-items-center rounded-full text-[11px] font-bold shrink-0 transition-all z-10",
                                isCompleted && "bg-primary text-white shadow-2xs",
                                isCurrent && "bg-primary text-white shadow-xs ring-4 ring-primary/20",
                                isUpcoming && "border border-border/80 bg-card text-muted-foreground"
                              )}
                            >
                              {isCompleted ? <HiCheck className="h-3 w-3 stroke-[3]" /> : <span>{i + 1}</span>}
                            </div>

                            {!isLast && (
                              <div
                                className={cn(
                                  "w-0.5 flex-1 min-h-[22px] my-1 rounded-full transition-colors",
                                  i < idx ? "bg-primary" : "bg-border/70"
                                )}
                              />
                            )}
                          </div>

                          {/* Right Column: Title + Status Card */}
                          <div className={cn("flex-1 min-w-0", isLast ? "pb-1" : "pb-4")}>
                            <p
                              className={cn(
                                "text-xs font-bold leading-6",
                                isCurrent
                                  ? "text-primary font-black"
                                  : isCompleted
                                  ? "text-foreground font-semibold"
                                  : "text-muted-foreground font-medium"
                              )}
                            >
                              {st}
                            </p>
                            {isCurrent && (
                              <div className="mt-1.5 rounded-2xl bg-muted/40 p-3 text-[11px] text-muted-foreground leading-relaxed border border-border/50">
                                {details.summary}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Desktop: Horizontal Journey with Continuous Line */}
                  <div className="hidden sm:block">
                    <div className="relative w-full">
                      {/* Continuous Line Track */}
                      <div className="absolute top-4 left-[10%] right-[10%] h-1 -translate-y-1/2 bg-border/70 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all duration-500 rounded-full"
                          style={{
                            width: `${(Math.max(0, idx) / (stages.length - 1)) * 100}%`,
                          }}
                        />
                      </div>

                      {/* Stage Nodes */}
                      <div className="relative z-10 grid grid-cols-5 text-center">
                        {stages.map((st, i) => {
                          const isCompleted = i < idx;
                          const isCurrent = i === idx;
                          const isUpcoming = i > idx;

                          return (
                            <div key={st} className="flex flex-col items-center">
                              {/* Circle Node */}
                              <div
                                className={cn(
                                  "grid h-8 w-8 place-items-center rounded-full text-xs font-bold transition-all shrink-0 bg-card",
                                  isCompleted && "bg-primary text-white shadow-2xs ring-4 ring-card",
                                  isCurrent && "bg-primary text-white shadow-sm ring-4 ring-primary/25",
                                  isUpcoming && "border-2 border-border/80 bg-card text-muted-foreground ring-4 ring-card"
                                )}
                              >
                                {isCompleted ? (
                                  <HiCheck className="h-4 w-4 stroke-[3]" />
                                ) : (
                                  <span>{i + 1}</span>
                                )}
                              </div>

                              {/* Label */}
                              <span
                                className={cn(
                                  "mt-2 text-xs font-semibold leading-tight whitespace-nowrap",
                                  isCurrent
                                    ? "text-primary font-bold"
                                    : isCompleted
                                    ? "text-foreground font-semibold"
                                    : "text-muted-foreground font-normal"
                                )}
                              >
                                {st}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Concise 1-line Status Callout */}
                    <div className="mt-5 flex items-center gap-2 rounded-2xl bg-muted/30 px-3.5 py-2.5 text-xs text-muted-foreground font-medium border border-border/40">
                      <HiOutlineClock className="h-4 w-4 text-primary shrink-0" />
                      <span className="leading-snug">{details.summary}</span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Closed Application Status Notice */
                <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-muted/30 p-3 sm:px-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                    <HiOutlineArrowUturnLeft className="h-4 w-4 shrink-0 text-rose-500" />
                    <span>{details.summary}</span>
                  </div>

                  {isWithdrawn && (
                    <Button
                      size="sm"
                      onClick={() => handleReapply(a.jobId, j.title, j.org)}
                      className="rounded-xl font-bold h-8 text-xs gap-1.5 shadow-2xs"
                    >
                      <HiOutlineArrowPath className="h-3.5 w-3.5" />
                      Re-apply
                    </Button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {/* Empty State */}
        {!list.length && (
          <div className="surface p-12 text-center rounded-3xl border border-border/80">
            <HiOutlineDocumentCheck className="mx-auto h-9 w-9 text-muted-foreground" />
            <h2 className="mt-3 text-sm sm:text-base font-bold text-foreground">
              {tab === "Active" ? "No active applications found" : "No closed applications"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              {q
                ? "No applications matched your search query."
                : "Explore verified healthcare opportunities and apply directly with 1 click."}
            </p>
            <div className="mt-4">
              <Link to="/jobs" search={{ q: undefined }}>
                <Button size="sm" className="rounded-xl font-bold h-9 px-4">
                  Browse Verified Jobs
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {withdrawingApp && (
        <WithdrawModal
          isOpen={true}
          onClose={() => setWithdrawingApp(null)}
          onConfirm={handleWithdrawConfirm}
          jobTitle={withdrawingApp.title}
          orgName={withdrawingApp.org}
        />
      )}
    </AppShell>
  );
}
