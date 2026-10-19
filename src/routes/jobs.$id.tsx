import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  HiArrowLeft,
  HiOutlineMapPin,
  HiOutlineBriefcase,
  HiOutlineCurrencyRupee,
  HiOutlineClock,
  HiCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineArrowUturnLeft,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell } from "@/components/fale/AppShell";
import { JobCard, OrgMark } from "@/components/fale/JobCard";
import { WithdrawModal } from "@/components/fale/WithdrawModal";
import { Button } from "@/components/ui/button";
import { jobs } from "@/lib/data";
import { setState, useApp } from "@/lib/store";

export const Route = createFileRoute("/jobs/$id")({
  loader: ({ params }) => {
    const job = jobs.find((j) => j.id === params.id);
    if (!job) throw notFound();
    return { job };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.job.title} at ${loaderData.job.org} — FALE` },
          { name: "description", content: `${loaderData.job.title} in ${loaderData.job.city}. ${loaderData.job.salary} per month.` },
          { property: "og:title", content: `${loaderData.job.title} at ${loaderData.job.org}` },
          { property: "og:description", content: `${loaderData.job.title} in ${loaderData.job.city} on FALE.` },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary" },
        ]
      : [{ title: "Job not found — FALE" }, { name: "robots", content: "noindex" }],
  }),
  component: JobDetail,
});

function JobDetail() {
  const { job } = Route.useLoaderData();
  const s = useApp();
  const [withdrawing, setWithdrawing] = useState(false);

  const app = s.applied.find((a) => a.jobId === job.id);
  const isApplied = Boolean(app && app.status !== "Withdrawn");
  const isWithdrawn = Boolean(app && app.status === "Withdrawn");
  const saved = s.saved.includes(job.id);

  const apply = () => {
    const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    setState((x) => ({
      applied: [{ jobId: job.id, status: "Applied", date: now }, ...x.applied.filter((a) => a.jobId !== job.id)],
    }));
    toast.success("Application sent!", { description: `Your FALE profile was shared with ${job.org}.` });
  };

  const handleWithdrawConfirm = (reason: string, notes: string) => {
    const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    setState((x) => ({
      applied: x.applied.map((item) =>
        item.jobId === job.id ? { ...item, status: "Withdrawn", date: now } : item
      ),
    }));
    toast.info("Application withdrawn", {
      description: `Your application for ${job.title} at ${job.org} has been withdrawn (${reason}).`,
    });
  };

  return (
    <AppShell>
      <Link to="/jobs" search={{ q: undefined }} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
        <HiArrowLeft className="h-4 w-4" /> Back to jobs
      </Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="surface p-6">
            <div className="flex flex-wrap items-start gap-4">
              <OrgMark name={job.org} className="h-16 w-16 text-lg" />
              <div className="flex-1">
                <h1 className="text-2xl font-extrabold">{job.title}</h1>
                <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                  {job.org} <HiOutlineShieldCheck className="h-4 w-4 text-primary" /> Verified employer
                </p>
              </div>
              <span className="rounded-full bg-success-soft px-3 py-1 text-xs font-bold text-success">{job.match}% match</span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {[[HiOutlineCurrencyRupee, "Salary / month", job.salary], [HiOutlineBriefcase, "Experience", job.exp], [HiOutlineMapPin, "Location", job.city], [HiOutlineClock, "Shift", job.shift]].map(([I, l, v]) => {
                const Icon = I as typeof HiOutlineClock;
                return (
                  <div key={l as string} className="rounded-xl bg-muted p-3">
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="mt-1 text-[11px] text-muted-foreground">{l as string}</p>
                    <p className="text-sm font-semibold">{v as string}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              {isApplied && app ? (
                <>
                  <div className="inline-flex items-center gap-2 rounded-xl bg-primary-soft px-4 py-2.5 text-sm font-bold text-primary">
                    <HiCheckCircle className="h-5 w-5" />
                    <span>Applied ({app.status})</span>
                  </div>
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setWithdrawing(true)}
                    className="gap-2 border-border/80 text-muted-foreground hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:hover:border-rose-900/60 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                  >
                    <HiOutlineArrowUturnLeft className="h-4 w-4" /> Withdraw
                  </Button>
                </>
              ) : isWithdrawn && app ? (
                <>
                  <div className="inline-flex items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50/70 px-4 py-2.5 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/40 dark:text-rose-300">
                    <HiOutlineArrowUturnLeft className="h-4 w-4" />
                    <span>Withdrawn on {app.date}</span>
                  </div>
                  <Button size="lg" onClick={apply} className="gap-2">
                    <HiOutlineArrowPath className="h-4 w-4" /> Re-apply
                  </Button>
                </>
              ) : (
                <Button size="lg" onClick={apply}>Easy apply</Button>
              )}
              <Button
                variant="outline"
                size="lg"
                onClick={() => setState((x) => ({ saved: saved ? x.saved.filter((i) => i !== job.id) : [...x.saved, job.id] }))}
              >
                {saved ? <HiBookmark className="text-primary" /> : <HiOutlineBookmark />} {saved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>
          <div className="surface space-y-5 p-6 text-sm leading-relaxed">
            <section>
              <h2 className="mb-2 text-base font-bold">About the role</h2>
              <p className="text-muted-foreground">Join a collaborative healthcare team committed to thoughtful, high-quality care. Bring your expertise to a setting that supports professional growth.</p>
            </section>
            <section>
              <h2 className="mb-2 text-base font-bold">What you'll do</h2>
              <ul className="space-y-2">
                {["Deliver care within your professional scope and department.", "Collaborate with clinical and operational teams.", "Maintain accurate records and follow facility protocols.", "Take part in ongoing learning and quality improvement."].map((t) => (
                  <li key={t} className="flex gap-2"><HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />{t}</li>
                ))}
              </ul>
            </section>
            <section>
              <h2 className="mb-2 text-base font-bold">Skills & qualifications</h2>
              <div className="flex flex-wrap gap-2">{job.tags.map((t) => <span key={t} className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{t}</span>)}</div>
            </section>
            <section>
              <h2 className="mb-2 text-base font-bold">Benefits</h2>
              <p className="text-muted-foreground">PF & ESI · Health insurance · Accommodation support · Paid learning days</p>
            </section>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="surface p-5">
            <h3 className="font-bold">About {job.org}</h3>
            <p className="mt-2 text-sm text-muted-foreground">A leading multi-speciality healthcare provider with a strong focus on patient safety and staff development.</p>
          </div>
          <div>
            <h3 className="mb-3 font-bold">Similar jobs</h3>
            <div className="space-y-3">{jobs.filter((j) => j.id !== job.id).slice(0, 2).map((j) => <JobCard key={j.id} job={j} compact />)}</div>
          </div>
        </aside>
      </div>

      {/* Withdraw Modal */}
      {withdrawing && (
        <WithdrawModal
          isOpen={true}
          onClose={() => setWithdrawing(false)}
          onConfirm={handleWithdrawConfirm}
          jobTitle={job.title}
          orgName={job.org}
        />
      )}
    </AppShell>
  );
}
