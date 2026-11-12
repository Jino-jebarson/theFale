import { errorMessage } from "@/lib/errorMessage";
import { ApiError } from "@/lib/api";
import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { RequestError } from "@/components/fale/RequestError";
import { useState, useEffect } from "react";
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
  HiOutlineSparkles,
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell } from "@/components/fale/AppShell";
import { JobCard, OrgMark } from "@/components/fale/JobCard";
import { WithdrawModal } from "@/components/fale/WithdrawModal";
import { Button } from "@/components/ui/button";
import { jobs } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import { isApiEnabled } from "@/lib/api";
import { applyForJob, getJobById, getJobs, saveJob, unsaveJob } from "@/lib/adapters/jobAdapter";
import { withdrawApplication } from "@/lib/adapters/applicationAdapter";
import { getCandidateProfile } from "@/lib/adapters/candidateAdapter";
import { calculateClinicalMatch } from "@/lib/clinicalMatchingEngine";
import { cn } from "@/lib/utils";

function formatApplicationStatus(status?: string) {
  if (!status) return "Application Submitted";
  const s = status.toLowerCase();
  if (s.includes("interview")) return "Interview Scheduled";
  if (s.includes("shortlist")) return "Shortlisted by Hospital";
  if (s.includes("offer")) return "Offer Extended";
  if (s.includes("hire") || s.includes("accept")) return "Selected & Hired";
  if (s.includes("review")) return "Under Clinical Review";
  if (s.includes("screen") || s.includes("applied") || s.includes("pending")) return "Application Submitted";
  return status;
}

export const Route = createFileRoute("/jobs/$id")({
  loader: async ({ params }) => {
    const job = await getJobById(params.id).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 404) throw notFound();
      throw error;
    });
    if (!job) throw notFound();
    const relatedJobs = await getJobs().catch(() => []);
    return { job, relatedJobs };
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
  const jobAction = useConfirmedAction();
  const { job, relatedJobs } = Route.useLoaderData();
  const s = useApp();
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (s.profile["role"]) return;
    getCandidateProfile()
      .then((profileData) => {
        if (!profileData) return;
        const openVal = profileData.openToWork != null ? Boolean(profileData.openToWork) : true;
        setState((prev) => ({
          candidateLevel: profileData.isStudent ? "student" : (profileData.candidateLevel?.toLowerCase() as any),
          profile: {
            ...prev.profile,
            openToWork: openVal,
            name: profileData.name || prev.profile["name"],
            email: profileData.email || prev.profile["email"],
            mobile: profileData.phone || prev.profile["mobile"],
            city: profileData.city || prev.profile["city"],
            state: profileData.state || prev.profile["state"],
            role: profileData.profession || (profileData.isStudent ? profileData.course : "Doctor"),
            specialty: profileData.specialty || "General medicine",
            qual: profileData.qualification || "",
            college: profileData.college || prev.profile["college"],
            institution: profileData.college || prev.profile["institution"],
            council: profileData.council || prev.profile["council"],
            regNo: profileData.regNumber || prev.profile["regNo"],
            regYear: profileData.regYear || prev.profile["regYear"],
            exp: profileData.experienceYears || (profileData.isStudent ? "Student" : "Fresher"),
            level: profileData.isStudent ? "student" : profileData.candidateLevel?.toLowerCase(),
            cadreLevel: profileData.isStudent ? "student" : profileData.candidateLevel?.toLowerCase(),
            kycStatus: profileData.kycStatus || prev.profile["kycStatus"],
            notice: profileData.noticePeriod || "Immediate",
            availability: profileData.availability || "Immediate",
            avatar: profileData.documents?.find((d) => d.documentType === "PHOTO")?.fileUrl || prev.profile["avatar"],
          },
        }));
      })
      .catch((error) => toast.error(errorMessage(error)));
  }, [s.profile]);

  const candidateLevel = s.candidateLevel || (s.profile["level"] as any) || (s.profile["cadreLevel"] as any) || (s.profile["exp"] === "Fresher" ? "fresher" : "professional");
  const isStudent = candidateLevel === "student";

  const matchResult = calculateClinicalMatch(
    {
      role: String(s.profile["role"] || ""),
      profession: String(s.profile["profession"] || s.profile["role"] || ""),
      specialty: String(s.profile["specialty"] || ""),
      subSpecialties: Array.isArray(s.profile["subSpecialties"]) ? s.profile["subSpecialties"] : [],
      qualification: String(s.profile["qual"] || s.profile["qualification"] || ""),
      skills: Array.isArray(s.profile["skills"]) ? s.profile["skills"] : [],
      city: String(s.profile["city"] || ""),
      state: String(s.profile["state"] || ""),
      preferredCities: Array.isArray(s.profile["preferredCities"]) ? s.profile["preferredCities"] : [],
      relocate: Boolean(s.profile["relocate"] || s.profile["openToRelocate"]),
      kycStatus: String(s.profile["kycStatus"] || ""),
      isStudent: Boolean(isStudent),
      experienceYears: s.profile["exp"] || s.profile["experienceYears"],
    },
    {
      title: job.title,
      dept: job.dept,
      city: job.city,
      qualification: job.qualification,
      tags: job.tags,
      exp: job.exp,
      urgent: job.urgent,
      kind: job.kind,
      type: job.type,
    }
  );
  const matchScore = matchResult.score;

  const app = s.applied.find((a) => a.jobId === job.id);
  const isApplied = Boolean(app && app.status !== "Withdrawn");
  const isWithdrawn = Boolean(app && app.status === "Withdrawn");
  const saved = s.saved.includes(job.id);

  const toggleSaveRole = async () => jobAction.run(async () => {
    if (saved) await unsaveJob(job.id); else await saveJob(job.id);
    setState((previous) => ({ saved: saved ? previous.saved.filter((id) => id !== job.id) : [...previous.saved, job.id] }));
    toast.success(saved ? "Role removed from saved jobs" : "Role saved");
  });
  const apply = async () => {
    if (isApplied) return;
    return jobAction.run(async () => {
      await applyForJob(job.id);
      const date = new Date().toLocaleDateString("en-IN");
      setState((previous) => ({ applied: [{ jobId: job.id, status: "Applied", date }, ...previous.applied.filter((item) => item.jobId !== job.id)] }));
      toast.success("Application submitted");
    });
  };

  const handleWithdrawConfirm = async (reason: string, _notes: string) => jobAction.run(async () => {
    await withdrawApplication(job.id, reason);
    setState((previous) => ({ applied: previous.applied.map((item) => item.jobId === job.id ? { ...item, status: "Withdrawn" } : item) }));
    setWithdrawing(false);
    toast.success("Application withdrawn");
  });

  return (
    <AppShell>
      <RequestError message={jobAction.error} />
      <Link to="/jobs" search={{ q: undefined }} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-primary">
        <HiArrowLeft className="h-4 w-4" /> {isStudent ? "Back to internships" : "Back to jobs"}
      </Link>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-5">
          <div className="surface p-4 sm:p-6 rounded-3xl border border-border/80">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
              <div className="flex items-start gap-3 sm:gap-4 min-w-0 flex-1">
                <OrgMark name={job.org} className="h-12 w-12 sm:h-16 sm:w-16 text-sm sm:text-lg shrink-0 rounded-2xl" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-tight break-words">
                    {job.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1.5 text-xs sm:text-sm text-muted-foreground">
                    <span className="font-bold text-foreground">{job.org}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-primary">
                      <HiOutlineShieldCheck className="h-4 w-4 shrink-0" />
                      <span>Verified employer</span>
                    </span>
                  </div>
                </div>
              </div>

              <span
                className={cn(
                  "inline-flex items-center gap-1 self-start sm:self-auto rounded-full px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-black shrink-0 border shadow-2xs",
                  matchScore >= 70
                    ? "bg-primary-soft border-primary/25 text-primary"
                    : matchScore >= 40
                    ? "bg-primary-soft/60 border-primary/15 text-primary/80"
                    : "bg-muted border-border text-muted-foreground"
                )}
              >
                <HiOutlineSparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                {matchScore >= 90 ? `Exact Match (${matchScore}%)` : `${matchScore}% Match`}
              </span>
            </div>

            {/* Key Job Info Metrics */}
            <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              {[
                [HiOutlineCurrencyRupee, isStudent ? "Stipend / month" : "Salary / month", job.salary, "col-span-2 sm:col-span-1"],
                [HiOutlineBriefcase, "Experience", job.exp, "col-span-1"],
                [HiOutlineMapPin, "Location", job.city, "col-span-1"],
                [HiOutlineClock, "Shift", job.shift, "col-span-2 sm:col-span-1"],
              ].map(([I, l, v, spanClass]) => {
                const Icon = I as typeof HiOutlineClock;
                return (
                  <div key={l as string} className={cn("rounded-2xl bg-muted/50 p-3 sm:p-3.5 border border-border/40", spanClass as string)}>
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-4 w-4 text-primary shrink-0" />
                      <p className="text-[11px] font-semibold text-muted-foreground">{l as string}</p>
                    </div>
                    <p className="mt-1 text-sm font-bold text-foreground truncate">{v as string}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2.5 sm:gap-3">
              {isApplied && app ? (
                <>
                  <div className="inline-flex items-center gap-2 rounded-xl bg-primary-soft border border-primary/25 px-4 py-2.5 text-sm font-bold text-primary">
                    <HiCheckCircle className="h-5 w-5 text-primary shrink-0" />
                    <span>{formatApplicationStatus(app.status)}</span>
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
                  <Button size="lg" disabled={jobAction.isPending} onClick={apply} className="gap-2">
                    <HiOutlineArrowPath className="h-4 w-4" /> Re-apply
                  </Button>
                </>
              ) : (
                <Button size="lg" onClick={apply} className="flex-1 sm:flex-initial">{isStudent ? "Apply for Internship" : "Easy apply"}</Button>
              )}
              <Button
                variant="outline"
                size="lg"
                className="flex-1 sm:flex-initial"
                disabled={jobAction.isPending} onClick={toggleSaveRole}
              >
                {saved ? <HiBookmark className="text-primary" /> : <HiOutlineBookmark />} {saved ? "Saved" : "Save"}
              </Button>
            </div>
          </div>
          <div className="surface space-y-5 p-4 sm:p-6 rounded-3xl border border-border/80 text-sm leading-relaxed">
            <section>
              <h2 className="mb-2 text-base font-bold">About the role</h2>
              <p className="text-muted-foreground">{job.description || "No description provided."}</p>
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
              <p className="text-muted-foreground">{job.perks?.length ? job.perks.join(" · ") : "No benefits provided."}</p>
            </section>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="surface p-5">
            <h3 className="font-bold">About {job.org}</h3>
            <p className="mt-2 text-sm text-muted-foreground">Facility details have not been provided for this posting.</p>
          </div>
          <div>
            <h3 className="mb-3 font-bold">{isStudent ? "Similar internships" : "Similar jobs"}</h3>
            <div className="space-y-3">
              {relatedJobs
                .filter((j) => j.id !== job.id && (!isStudent || j.title.toLowerCase().includes("intern") || j.title.toLowerCase().includes("observership") || j.tags.some((t) => t.toLowerCase().includes("intern"))))
                .slice(0, 2)
                .map((j) => <JobCard key={j.id} job={j} compact />)}
            </div>
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
