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
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell } from "@/components/fale/AppShell";
import { JobCard, OrgMark } from "@/components/fale/JobCard";
import { WithdrawModal } from "@/components/fale/WithdrawModal";
import { Button } from "@/components/ui/button";
import { jobs } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import { isApiEnabled } from "@/lib/api";
import { applyForJob, getJobById, saveJob, unsaveJob } from "@/lib/adapters/jobAdapter";
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
    if (isApiEnabled) {
      try {
        const job = await getJobById(params.id);
        return { job };
      } catch (e) {
        throw notFound();
      }
    }
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

  useEffect(() => {
    if (!isApiEnabled || s.profile["role"]) return;
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
            qual: profileData.qualification || "MBBS",
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
      .catch(console.error);
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

  const apply = () => {
    const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    if (isApiEnabled) {
      applyForJob(job.id).catch((err) => {
        console.error("Apply error:", err);
      });
    }
    const candidateName = String(s.profile["name"] || "Candidate Professional");
    const candidateRole = String(s.profile["role"] || "Healthcare Professional");
    const candidateCity = String(s.profile["city"] || "Bengaluru");
    const regNumber = String(s.profile["regNo"] || "KMC/DOC/89421");

    setState((x) => ({
      applied: [{ jobId: job.id, status: "Applied", date: now }, ...x.applied.filter((a) => a.jobId !== job.id)],
      adminApplications: [
        {
          id: crypto.randomUUID(),
          candidateName,
          candidateRole,
          candidateCity,
          jobId: job.id,
          jobTitle: job.title,
          hospitalName: job.org,
          matchScore: job.match || 92,
          councilVerified: true,
          regNumber,
          exp: "2–4 yrs clinical experience",
          status: "pending_admin" as const,
          appliedDate: "Just now",
          summary: `Applicant submitted credential profile for ${job.title} at ${job.org}. Awaiting Admin shortlisting.`,
          phone: s.contact || "+91 98401 23456",
          email: "candidate@fale.in",
        },
        ...x.adminApplications,
      ],
    }));
    toast.success("Application Submitted Successfully!", {
      description: `Your profile and verified credentials have been submitted for ${job.title} at ${job.org}.`,
    });
  };

  const handleWithdrawConfirm = (reason: string, notes: string) => {
    const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    if (isApiEnabled) {
      withdrawApplication(job.id, reason).catch((err) => {
        console.error("Withdraw error:", err);
      });
    }
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
        <HiArrowLeft className="h-4 w-4" /> {isStudent ? "Back to internships" : "Back to jobs"}
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
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-bold border",
                  matchScore >= 70
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                    : matchScore >= 40
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                    : "bg-muted border-border text-muted-foreground"
                )}
              >
                {matchScore >= 90 ? `Exact Match (${matchScore}%)` : `${matchScore}% Match`}
              </span>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-4">
              {[[HiOutlineCurrencyRupee, isStudent ? "Stipend / month" : "Salary / month", job.salary], [HiOutlineBriefcase, "Experience", job.exp], [HiOutlineMapPin, "Location", job.city], [HiOutlineClock, "Shift", job.shift]].map(([I, l, v]) => {
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
                  <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-2.5 text-sm font-bold text-emerald-700 dark:text-emerald-300">
                    <HiCheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
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
                  <Button size="lg" onClick={apply} className="gap-2">
                    <HiOutlineArrowPath className="h-4 w-4" /> Re-apply
                  </Button>
                </>
              ) : (
                <Button size="lg" onClick={apply}>{isStudent ? "Apply for Internship" : "Easy apply"}</Button>
              )}
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  if (isApiEnabled) {
                    if (saved) {
                      unsaveJob(job.id).catch(console.error);
                    } else {
                      saveJob(job.id).catch(console.error);
                    }
                  }
                  setState((x) => ({
                    saved: saved ? x.saved.filter((i) => i !== job.id) : [...x.saved, job.id],
                  }));
                  if (!saved) {
                    toast.success("Role saved to your wishlist");
                  } else {
                    toast.info("Role removed from your wishlist");
                  }
                }}
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
              <p className="text-muted-foreground">{isStudent ? "Teaching hospital rotation credit · Logbook sign-off · Mentorship by Senior Consultants · Monthly Educational Stipend" : "PF & ESI · Health insurance · Accommodation support · Paid learning days"}</p>
            </section>
          </div>
        </div>
        <aside className="space-y-4">
          <div className="surface p-5">
            <h3 className="font-bold">About {job.org}</h3>
            <p className="mt-2 text-sm text-muted-foreground">A leading multi-speciality healthcare provider with a strong focus on patient safety and staff development.</p>
          </div>
          <div>
            <h3 className="mb-3 font-bold">{isStudent ? "Similar internships" : "Similar jobs"}</h3>
            <div className="space-y-3">
              {(isApiEnabled ? [] : jobs)
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
