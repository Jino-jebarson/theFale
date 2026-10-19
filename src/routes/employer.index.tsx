import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiArrowRight,
  HiOutlineBriefcase,
  HiOutlineUserGroup,
  HiOutlineCalendarDays,
  HiOutlineCheckBadge,
  HiPlus,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineQuestionMarkCircle,
} from "react-icons/hi2";
import { AppShell, StatusBadge, initials } from "@/components/fale/AppShell";
import { Button } from "@/components/ui/button";
import { applicants } from "@/lib/data";
import { useApp } from "@/lib/store";
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

function Employer() {
  const s = useApp();
  const [tab, setTab] = useState<"All" | "Open" | "Draft">("All");

  const recruiterName = String(s.profile["recruiter"] || "Recruiter").split(" ")[0];
  const orgName = String(s.profile["org"] || "Your organization");

  const openRolesCount = s.postedJobs.filter((j) => j.status === "Open").length;
  const interviewCount = applicants.filter((a) => a.status === "Interview").length;

  const stats = [
    {
      label: "Open roles",
      value: openRolesCount,
      icon: HiOutlineBriefcase,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    },
    {
      label: "Total applicants",
      value: applicants.length,
      icon: HiOutlineUserGroup,
      color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
    },
    {
      label: "Interviews scheduled",
      value: interviewCount,
      icon: HiOutlineCalendarDays,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    },
    {
      label: "Hired",
      value: 0,
      icon: HiOutlineCheckBadge,
      color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    },
  ];

  const filteredJobs = s.postedJobs.filter((j) => tab === "All" || j.status === tab);

  return (
    <AppShell>
      <div className="w-full min-w-0 space-y-6">
        {/* Clean Executive Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Welcome, {recruiterName}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span>{orgName} · Hiring overview</span>
              <span>·</span>
              <Link
                to="/employer/profile"
                className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
              >
                <span>View Hospital Profile</span>
                <HiArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button asChild variant="outline" size="default" className="gap-2 rounded-xl font-semibold shadow-2xs">
              <Link to="/employer/post-shift">
                <HiOutlineClock className="h-4 w-4 text-primary" /> Post a shift
              </Link>
            </Button>
            <Button asChild size="default" className="gap-2 rounded-xl font-semibold shadow-sm">
              <Link to="/employer/post">
                <HiPlus className="h-4 w-4 stroke-[2.5]" /> Post a job
              </Link>
            </Button>
          </div>
        </div>

        {/* 4 Professional Metric Cards */}
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4 w-full min-w-0">
          {stats.map((st) => (
            <div
              key={st.label}
              className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {st.label}
                </span>
                <span className={cn("grid h-10 w-10 place-items-center rounded-xl", st.color)}>
                  <st.icon className="h-5 w-5" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">
                {st.value}
              </p>
            </div>
          ))}
        </div>

        {/* Main 2-Column Layout */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px] w-full min-w-0">
          {/* Left Column: Requirements Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs w-full min-w-0">
            <div className="flex flex-col gap-3 border-b border-border p-4 sm:p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-base font-bold text-foreground">Your requirements</h2>
                <p className="text-xs text-muted-foreground">Active job vacancies and hiring status</p>
              </div>

              {/* Status Tabs */}
              <div className="flex items-center rounded-xl bg-muted p-1 text-xs font-semibold">
                {(["All", "Open", "Draft"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTab(t)}
                    className={cn(
                      "rounded-lg px-3 py-1 transition-all cursor-pointer",
                      tab === t
                        ? "bg-card text-foreground shadow-xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile Card View (< sm screens) */}
            <div className="divide-y divide-border sm:hidden">
              {filteredJobs.map((j) => (
                <div key={j.id} className="p-4 space-y-2.5 transition-colors hover:bg-muted/20">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <h3 className="font-bold text-sm text-foreground leading-snug min-w-0">
                      {j.title}
                    </h3>
                    <div className="shrink-0">
                      <StatusBadge status={j.status} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {j.dept}
                    </span>
                    <span className="font-medium text-foreground">
                      {j.openings} {j.openings === 1 ? "opening" : "openings"}
                    </span>
                  </div>

                  <div className="pt-1 flex items-center justify-end">
                    <Link
                      to="/employer/applicants"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      View applicants <HiArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              ))}

              {filteredJobs.length === 0 && (
                <div className="py-8 text-center text-xs text-muted-foreground">
                  No requirements found under {tab}.
                </div>
              )}
            </div>

            {/* Desktop Table (>= sm screens) */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3">Department</th>
                    <th className="px-5 py-3">Openings</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredJobs.map((j) => (
                    <tr key={j.id} className="transition-colors hover:bg-muted/30">
                      <td className="px-5 py-4 font-semibold text-foreground">
                        {j.title}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {j.dept}
                      </td>
                      <td className="px-5 py-4 text-sm text-foreground">
                        {j.openings}
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={j.status} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          to="/employer/applicants"
                          className="text-xs font-semibold text-primary hover:underline"
                        >
                          View applicants
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {filteredJobs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-xs text-muted-foreground">
                        No requirements found under {tab}.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column: People to meet */}
          <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs w-full min-w-0 overflow-hidden">
            <div className="flex items-center justify-between border-b border-border pb-4 gap-2">
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground">People to meet</h2>
                <p className="text-xs text-muted-foreground truncate">Recent candidates for your roles</p>
              </div>
              <Link
                to="/employer/applicants"
                className="text-xs font-semibold text-primary hover:underline shrink-0"
              >
                View all
              </Link>
            </div>

            <ul className="divide-y divide-border">
              {applicants.slice(0, 4).map((a) => (
                <li key={a.id} className="flex items-center gap-3 py-3 sm:gap-3.5 sm:py-3.5 min-w-0">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary">
                    {initials(a.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-sm font-semibold text-foreground truncate">{a.name}</p>
                      {a.verified && (
                        <HiOutlineShieldCheck
                          className="h-3.5 w-3.5 text-primary shrink-0"
                          title="Verified profile"
                        />
                      )}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {a.role} · {a.exp}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <StatusBadge status={a.status} />
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-4 border-t border-border pt-4">
              <Link
                to="/employer/applicants"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
              >
                Review all applicants <HiArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Hospital Institutional Support & Escrow Assistance Banner */}
        <div className="rounded-3xl border border-primary/20 bg-gradient-to-r from-primary/5 via-card to-emerald-500/5 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shadow-2xs">
                <HiOutlineQuestionMarkCircle className="h-5 w-5" />
              </span>
              <h3 className="text-sm font-bold text-foreground">Hospital Concierge & Clinical Support</h3>
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                24/7 Available
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Direct assistance with custom hospital shift broadcasts, credential audits, and escrow settlements.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 h-9">
              <a href="mailto:contact@thefale.com">
                <HiOutlineEnvelope className="h-4 w-4 text-primary" />
                <span>contact@thefale.com</span>
              </a>
            </Button>

            <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold gap-1.5 h-9">
              <a href="tel:+917338367726">
                <HiOutlinePhone className="h-4 w-4 text-emerald-600" />
                <span>+91 73383 67726</span>
              </a>
            </Button>

            <Button asChild size="sm" className="rounded-xl text-xs font-bold gap-1.5 h-9 bg-primary hover:bg-primary-hover shadow-xs">
              <Link to="/support">
                <span>Open Support Center</span>
                <HiArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
