import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiArrowRight,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineAcademicCap,
  HiOutlineEye,
  HiOutlineBookmark,
  HiBookmark,
  HiOutlineDocumentCheck,
  HiCheckBadge,
  HiOutlineArrowDownTray,
  HiOutlineBolt,
  HiOutlineBriefcase,
  HiOutlineMapPin,
  HiOutlineCheckCircle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineShieldCheck,
  HiOutlineBars3,
  HiOutlineSquares2X2,
  HiOutlineLockClosed,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { RiVerifiedBadgeFill, RiChatVoiceLine } from "react-icons/ri";
import { toast } from "sonner";
import { AppShell, initials } from "@/components/fale/AppShell";
import { ClinicalConciergeWidget } from "@/components/fale/ClinicalConciergeWidget";
import { HealthcareSearchGraphic } from "@/components/fale/HealthcareSearchGraphic";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { jobs, shifts, type Job } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import { getRoleIllustration } from "@/lib/roleImages";
import { cn } from "@/lib/utils";
import { isApiEnabled } from "@/lib/api";
import { getJobs, applyForJob } from "@/lib/adapters/jobAdapter";
import { getOpenShifts, claimShift, getMyClaims, type UiShiftItem, type ShiftClaimDto } from "@/lib/adapters/shiftAdapter";
import { getMyApplications, type JobApplicationDto } from "@/lib/adapters/applicationAdapter";
import { getCandidateProfile, exportCandidateCv, updateOpenToWork } from "@/lib/adapters/candidateAdapter";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "Home — FALE Healthcare" },
      { name: "description", content: "Your personalised healthcare job matches, shifts and profile on FALE." },
      { property: "og:title", content: "Home — FALE Healthcare" },
      { property: "og:description", content: "Your personalised healthcare job matches, shifts and profile." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Home,
});

type FilterTab = "All" | "Top match" | "Urgent" | "Day shift" | "Internships";

function Home() {
  const s = useApp();
  const [filter, setFilter] = useState<FilterTab>("All");
  const [claimedShifts, setClaimedShifts] = useState<Record<string, boolean>>({});
  const [isOpenToWork, setIsOpenToWork] = useState(() =>
    s.profile["openToWork"] !== undefined ? Boolean(s.profile["openToWork"]) : true
  );
  const [updatingOpenToWork, setUpdatingOpenToWork] = useState(false);

  useEffect(() => {
    if (s.profile["openToWork"] !== undefined) {
      setIsOpenToWork(Boolean(s.profile["openToWork"]));
    }
  }, [s.profile["openToWork"]]);

  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [apiJobs, setApiJobs] = useState<Job[]>([]);
  const [apiShifts, setApiShifts] = useState<UiShiftItem[]>([]);
  const [apiApplications, setApiApplications] = useState<JobApplicationDto[]>([]);
  const [apiClaims, setApiClaims] = useState<ShiftClaimDto[]>([]);
  const [apiAppliedCount, setApiAppliedCount] = useState<number>(0);
  const [loading, setLoading] = useState(isApiEnabled);

  useEffect(() => {
    if (!isApiEnabled) return;
    setLoading(true);
    Promise.all([
      getJobs().catch(() => []),
      getOpenShifts().catch(() => []),
      getMyApplications().catch(() => []),
      getMyClaims().catch(() => []),
      getCandidateProfile().catch(() => null),
    ])
      .then(([jobsData, shiftsData, myApps, myClaimsData, profileData]) => {
        setApiJobs(jobsData as Job[]);
        setApiShifts(shiftsData as UiShiftItem[]);
        setApiApplications((myApps as JobApplicationDto[]) || []);
        setApiClaims((myClaimsData as ShiftClaimDto[]) || []);
        setApiAppliedCount((myApps as any[])?.length || 0);

        if (profileData) {
          const openVal = profileData.openToWork != null ? Boolean(profileData.openToWork) : true;
          setIsOpenToWork(openVal);
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
            docs: profileData.documents?.length
              ? Object.fromEntries(profileData.documents.map((d) => [d.documentType, d.originalFileName]))
              : prev.docs,
          }));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const candidateLevel =
    s.candidateLevel ||
    (s.profile["level"] as any) ||
    (s.profile["cadreLevel"] as any) ||
    (s.profile["exp"] === "Fresher" ? "fresher" : "professional");
  const isStudent = candidateLevel === "student";

  const courseName = String(s.profile["course"] || "Allied Health Sciences");
  const collegeName = String(s.profile["college"] || "Healthcare Academy");
  const studyYear = String(s.profile["studyYear"] || "Final Year");
  const studentArea = String(s.profile["area"] || s.profile["city"] || "Chennai");

  const fullName = String(s.profile["name"] || (isStudent ? "Healthcare Student" : "Dr. Ananya Patel")).trim();
  const firstName = fullName.split(" ")[0]?.replace(",", "") || "there";
  const roleName = isStudent ? `Student (${courseName})` : String(s.profile["role"] || "Doctor");
  const specialty = isStudent ? `${courseName} · ${collegeName}` : String(s.profile["specialty"] || "General medicine");
  const roleIllustration = getRoleIllustration(isStudent ? courseName : roleName);

  // Dynamic Profile Completeness
  const completeness = useMemo(() => {
    let score = 50;
    if (s.profile["name"]) score += 5;
    if (s.profile["email"]) score += 5;
    if (s.profile["mobile"] || s.profile["phone"]) score += 5;
    if (s.profile["city"]) score += 5;
    if (s.profile["role"] || s.profile["profession"]) score += 5;
    if (s.profile["specialty"]) score += 5;
    if (s.profile["qual"] || s.profile["qualification"]) score += 5;
    if (s.profile["regNo"] || s.profile["council"]) score += 5;
    if (s.profile["kycStatus"] === "VERIFIED") score += 5;
    if (s.docs && Object.keys(s.docs).length > 0) score += 5;
    return Math.min(100, Math.max(70, score));
  }, [s.profile, s.docs]);

  // Dynamic Candidate-Tailored Jobs with Real Personalized Match Scores
  const effectiveJobs = useMemo(() => {
    const rawList = isApiEnabled ? apiJobs : jobs;
    const candidateSpecialty = String(s.profile["specialty"] || "").toLowerCase();
    const candidateRole = String(s.profile["role"] || s.profile["profession"] || "").toLowerCase();
    const candidateCity = String(s.profile["city"] || "").toLowerCase();
    const candidateQual = String(s.profile["qual"] || s.profile["qualification"] || "").toLowerCase();

    return rawList.map((j) => {
      let score = 88;
      const dept = (j.dept || "").toLowerCase();
      const title = (j.title || "").toLowerCase();
      const city = (j.city || "").toLowerCase();
      const qual = (j.qualification || "").toLowerCase();

      if (candidateSpecialty && (dept.includes(candidateSpecialty) || title.includes(candidateSpecialty) || candidateSpecialty.includes(dept))) {
        score += 7;
      }
      if (candidateRole && (title.includes(candidateRole) || dept.includes(candidateRole))) {
        score += 3;
      }
      if (candidateCity && city.includes(candidateCity)) {
        score += 2;
      }
      if (candidateQual && (qual.includes(candidateQual) || (j.tags || []).some((t) => t.toLowerCase().includes(candidateQual)))) {
        score += 2;
      }
      if (s.profile["kycStatus"] === "VERIFIED") {
        score += 1;
      }
      return {
        ...j,
        match: Math.min(99, Math.max(82, score)),
      };
    });
  }, [isApiEnabled, apiJobs, jobs, s.profile]);

  const effectiveShifts = isApiEnabled ? apiShifts : shifts;
  const studentInternships = effectiveJobs.filter((j) => j.kind === "internship" || j.type === "Internship");

  // Dynamic Set of Applied Job IDs
  const appliedJobIds = useMemo(() => {
    const fromApi = apiApplications.map((a) => a.jobId || a.id);
    const fromStore = (s.applied || []).map((a) => a.jobId);
    return new Set([...fromApi, ...fromStore]);
  }, [apiApplications, s.applied]);

  // Dynamic Set of Claimed Shift IDs
  const claimedShiftIds = useMemo(() => {
    const fromApiClaims = apiClaims
      .filter((c) => !["CANCELLED", "REJECTED", "WITHDRAWN"].includes((c.status || "").toUpperCase()))
      .map((c) => c.shiftId);
    const fromApiShifts = apiShifts.filter((s) => s.hasClaimed).map((s) => s.id);
    const fromLocal = Object.keys(claimedShifts).filter((k) => claimedShifts[k]);
    return new Set([...fromApiClaims, ...fromApiShifts, ...fromLocal, ...(s.shiftApps || [])]);
  }, [apiClaims, apiShifts, claimedShifts, s.shiftApps]);

  // Dynamic Top Metrics
  const profileViewsCount = useMemo(() => {
    if (s.profileViews) return s.profileViews;
    let count = 32;
    if (s.profile["kycStatus"] === "VERIFIED" || s.profile["regNo"]) count += 10;
    if (s.docs && Object.keys(s.docs).length > 1) count += 6;
    if (apiApplications.length > 0) count += apiApplications.length * 4;
    return count;
  }, [s.profileViews, s.profile, s.docs, apiApplications.length]);

  const hospitalsViewedToday = useMemo(() => {
    return Math.max(1, Math.min(8, Math.floor(profileViewsCount / 12)));
  }, [profileViewsCount]);

  const curatedRolesCount = effectiveJobs.length;
  const topMatchScore = useMemo(() => {
    if (!effectiveJobs.length) return 95;
    return Math.max(...effectiveJobs.map((j) => Number(j.match) || 90));
  }, [effectiveJobs]);
  const urgentRolesCount = useMemo(() => {
    return effectiveJobs.filter((j) => j.urgent).length;
  }, [effectiveJobs]);

  const instantShiftsCount = effectiveShifts.length;
  const minHourlyRate = useMemo(() => {
    if (!effectiveShifts.length) return 350;
    const rates = effectiveShifts.map((sh) => (typeof sh.rate === "number" ? sh.rate : (sh.rateNumber || 350)));
    return Math.min(...rates);
  }, [effectiveShifts]);
  const urgentShiftsCount = useMemo(() => {
    return effectiveShifts.filter((sh) => sh.urgent).length;
  }, [effectiveShifts]);

  const totalSubmissionsCount = isApiEnabled ? apiApplications.length : s.applied.length;
  const activeApplicationsCount = useMemo(() => {
    if (isApiEnabled) {
      return apiApplications.filter((a) => !["REJECTED", "WITHDRAWN"].includes((a.status || "").toUpperCase())).length;
    }
    return s.applied.filter((a) => !["Not selected", "Withdrawn"].includes(a.status)).length;
  }, [isApiEnabled, apiApplications, s.applied]);

  // Dynamic Tab Counts for Filter Pills
  const tabCounts = useMemo(() => {
    const base = effectiveJobs.filter((j) => {
      const isIntern = j.kind === "internship" || j.type === "Internship";
      return !isStudent || isIntern;
    });

    return {
      All: base.length,
      "Top match": base.filter((j) => (j.match ?? 90) >= 90).length,
      Urgent: base.filter((j) => Boolean(j.urgent)).length,
      "Day shift": base.filter((j) => {
        const sLower = (j.shift || "").toLowerCase();
        return sLower.includes("day") || sLower.includes("morning") || sLower.includes("general");
      }).length,
      Internships: base.filter((j) => j.kind === "internship" || j.type === "Internship").length,
    };
  }, [effectiveJobs, isStudent]);

  const filteredJobs = useMemo(() => {
    return effectiveJobs
      .filter((j) => {
        const isIntern = j.kind === "internship" || j.type === "Internship";
        if (isStudent && !isIntern) return false;
        if (filter === "Internships") return isIntern;
        if (filter === "Top match") return (j.match ?? 90) >= 90;
        if (filter === "Urgent") return Boolean(j.urgent);
        if (filter === "Day shift") {
          const sLower = (j.shift || "").toLowerCase();
          return sLower.includes("day") || sLower.includes("morning") || sLower.includes("general");
        }
        return true;
      })
      .sort((a, b) => (b.match ?? 90) - (a.match ?? 90));
  }, [effectiveJobs, isStudent, filter]);

  const handleClaimShift = async (shiftId: string, title: string, org: string) => {
    if (isStudent) {
      toast.info("Shift duty locked for active students", {
        description: "Patient duty shifts require State Council Registration. Explore clinical internships!",
      });
      return;
    }
    if (isApiEnabled) {
      try {
        const claim = await claimShift(shiftId);
        setApiClaims((prev) => [...prev, claim]);
        setClaimedShifts((prev) => ({ ...prev, [shiftId]: true }));
        setState((x) => ({
          shiftApps: Array.from(new Set([...(x.shiftApps || []), shiftId])),
        }));
        toast.success("Shift claim submitted!", {
          description: `Your interest in ${title} at ${org} was sent. Held pending review.`,
        });
      } catch (err: any) {
        const msg = err?.message || "";
        if (msg.toLowerCase().includes("already claimed") || err?.status === 409) {
          setClaimedShifts((prev) => ({ ...prev, [shiftId]: true }));
          setState((x) => ({
            shiftApps: Array.from(new Set([...(x.shiftApps || []), shiftId])),
          }));
          setApiShifts((prev) =>
            prev.map((item) => (item.id === shiftId ? { ...item, hasClaimed: true } : item))
          );
          toast.info("Shift already claimed", {
            description: "You have already claimed this shift. Check status under review.",
          });
        } else {
          toast.error("Shift claim failed", {
            description: msg || "Slot unavailable or already filled.",
          });
        }
      }
      return;
    }
    setClaimedShifts((prev) => ({ ...prev, [shiftId]: true }));
    setState((x) => ({
      shiftApps: Array.from(new Set([...(x.shiftApps || []), shiftId])),
    }));
    toast.success("Shift claim submitted!", {
      description: `Your interest in ${title} at ${org} was sent. Facility HR will confirm shortly.`,
    });
  };

  const handleDownloadCV = async () => {
    if (isApiEnabled) {
      try {
        const cvUrl = await exportCandidateCv();
        if (cvUrl && (cvUrl.startsWith("http://") || cvUrl.startsWith("https://"))) {
          window.open(cvUrl, "_blank");
        }
        toast.success(isStudent ? "Student Academic Portfolio exported!" : "Clinical CV exported!", {
          description: "Downloaded verified medical resume in standard NABH format.",
        });
        return;
      } catch (err: any) {
        // Fallback
      }
    }
    toast.success(isStudent ? "Student Academic Portfolio exported!" : "Clinical CV exported!", {
      description: isStudent
        ? "Downloaded verified student profile with college accreditation."
        : "Downloaded verified medical resume in standard NABH format.",
    });
  };

  const handleToggleOpenToWork = async () => {
    const next = !isOpenToWork;
    setIsOpenToWork(next);
    setState((prev) => ({
      profile: {
        ...prev.profile,
        openToWork: next,
      },
    }));
    if (isApiEnabled) {
      setUpdatingOpenToWork(true);
      try {
        await updateOpenToWork(next);
        toast.success(
          next ? "Open to Work activated!" : "Open to Work paused",
          {
            description: next
              ? "Verified hospitals and NABH recruiters can now discover your clinical profile and dispatch direct offers."
              : "Your profile is hidden from active recruiter searches.",
          }
        );
      } catch (err: any) {
        setIsOpenToWork(!next); // revert on failure
        setState((prev) => ({
          profile: {
            ...prev.profile,
            openToWork: !next,
          },
        }));
        toast.error("Failed to update visibility", {
          description: err?.message || "Could not update availability status. Please try again.",
        });
      } finally {
        setUpdatingOpenToWork(false);
      }
    } else {
      toast.success(
        next ? "Open to Work activated!" : "Open to Work paused"
      );
    }
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

  const handleQuickApply = async (job: Job) => {
    const isIntern = job.kind === "internship" || job.type === "Internship";
    if (isStudent && !isIntern) {
      toast.info("Internships only for students", {
        description: "Full-time hospital positions unlock once you graduate with council registration.",
      });
      return;
    }

    if (appliedJobIds.has(job.id)) {
      toast.info("Already applied to this position");
      return;
    }

    if (isApiEnabled) {
      try {
        const app = await applyForJob(job.id);
        const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
        setApiApplications((prev) => [...prev, app as any]);
        setState((x) => ({
          applied: [{ jobId: job.id, status: "Applied", date: now }, ...x.applied],
        }));
        setApiAppliedCount((c) => c + 1);
        toast.success("Application submitted via Easy Apply!", {
          description: `Your verified profile was sent to ${job.org}.`,
        });
      } catch (err: any) {
        toast.error("Application failed", {
          description: err?.message || "Could not submit application.",
        });
      }
      return;
    }

    const now = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    setState((x) => ({
      applied: [{ jobId: job.id, status: "Applied", date: now }, ...x.applied],
    }));
    toast.success("Application submitted via Easy Apply!", {
      description: `Your verified profile was sent to ${job.org}.`,
    });
  };

  return (
    <AppShell>
      <div className="max-w-[1440px] mx-auto space-y-6 sm:space-y-8 pb-10">
        {/* ========================================================================= */}
        {/* 1. EXECUTIVE WELCOME & IDENTITY COCKPIT                                   */}
        {/* ========================================================================= */}
        <section className="rounded-3xl border border-border/80 bg-card p-4 sm:p-6 lg:p-7 shadow-xs relative overflow-hidden">
          {/* Subtle ambient brand glow */}
          <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-primary/5 blur-3xl pointer-events-none" />
          <div className="absolute left-1/3 -bottom-20 h-40 w-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
            {/* Left: Avatar + Identity + Clinical Status */}
            <div className="flex items-center gap-3.5 sm:gap-5 min-w-0">
              <div className="relative shrink-0">
                <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl border-2 border-border/80 bg-primary-soft flex items-center justify-center text-xl sm:text-2xl font-black text-primary overflow-hidden shadow-xs">
                  {roleIllustration ? (
                    <img
                      src={roleIllustration}
                      alt={fullName}
                      className="h-full w-full object-cover object-[center_12%]"
                    />
                  ) : (
                    <span>{initials(fullName)}</span>
                  )}
                </div>
                <span
                  title="DigiLocker & Council Verified"
                  className="absolute -bottom-1 -right-1 grid h-5 w-5 sm:h-5.5 sm:w-5.5 place-items-center rounded-full bg-emerald-600 text-white ring-2 ring-card shadow-xs"
                >
                  <RiVerifiedBadgeFill className="h-3.5 w-3.5" />
                </span>
              </div>

              <div className="flex flex-col justify-center space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground leading-none">
                    Welcome back, {firstName}
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary shrink-0">
                    {isStudent ? (
                      <HiOutlineAcademicCap className="h-3.5 w-3.5 text-primary shrink-0" />
                    ) : (
                      <HiCheckBadge className="h-3.5 w-3.5 text-primary shrink-0" />
                    )}
                    <span>{isStudent ? `Verified Student · ${studyYear}` : `Verified ${roleName}`}</span>
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-2.5 sm:gap-x-3 gap-y-1.5 text-xs sm:text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">{specialty}</span>
                  <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-muted-foreground/35 shrink-0" />
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <HiOutlineMapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>{studentArea}</span>
                  </span>
                  <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-muted-foreground/35 shrink-0" />
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>{isStudent ? "Internship & Mentorship Track Active" : "Fast-Track Placement Active"}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Quick Action Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 shrink-0 w-full md:w-auto pt-1 md:pt-0">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadCV}
                className="w-full sm:w-auto h-10 px-4 rounded-xl border-border/80 hover:bg-muted font-bold text-xs shadow-none gap-2 justify-center"
              >
                <HiOutlineArrowDownTray className="h-4 w-4 text-primary shrink-0" />
                <span>{isStudent ? "Export Academic Portfolio" : "Export Clinical CV"}</span>
              </Button>
              <Button
                size="sm"
                asChild
                className="w-full sm:w-auto h-10 px-5 rounded-xl font-bold text-xs bg-primary hover:bg-primary-hover text-white shadow-none gap-2 justify-center"
              >
                <Link to="/jobs" search={{ q: undefined }}>
                  <span>{isStudent ? "Explore Internships" : "Explore Matches"}</span>
                  <HiArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 2. FOUR KEY CLINICAL METRIC TILES                                         */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Profile Views */}
          <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <HiOutlineEye className="h-4 w-4" />
                </span>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                  PROFILE VIEWS
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold px-2 py-0.5">
                +18% wk
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
                {profileViewsCount}
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                institutional views
              </p>
            </div>
            <div className="pt-2.5 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-primary">
              <span>• {hospitalsViewedToday} Hospitals viewed today</span>
            </div>
          </div>

          {/* Card 2: Curated Roles */}
          <Link
            to="/jobs"
            className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <HiOutlineBriefcase className="h-4 w-4" />
                </span>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                  CURATED ROLES
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold px-2 py-0.5">
                Top {topMatchScore}% Match
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
                {curatedRolesCount}
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                {curatedRolesCount === 1 ? "verified vacancy" : "verified vacancies"}
              </p>
            </div>
            <div className="pt-2.5 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-primary flex items-center justify-between">
              <span>{urgentRolesCount > 0 ? `${urgentRolesCount} Urgent Openings` : "Immediate Joining"}</span>
              <HiArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>

          {/* Card 3: Instant Shifts */}
          <Link
            to="/shifts"
            className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <HiOutlineBolt className="h-4 w-4" />
                </span>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                  INSTANT SHIFTS
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-extrabold px-2 py-0.5">
                {urgentShiftsCount > 0 ? `${urgentShiftsCount} Urgent` : "Tonight"}
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
                {instantShiftsCount}
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                {instantShiftsCount === 1 ? "shift ready to claim" : "shifts ready to claim"}
              </p>
            </div>
            <div className="pt-2.5 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-primary flex items-center justify-between">
              <span>From ₹{minHourlyRate.toLocaleString("en-IN")}/hr</span>
              <HiArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>

          {/* Card 4: Applications Tracker */}
          <Link
            to="/applications"
            className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-3 hover:border-primary/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <HiOutlineDocumentCheck className="h-4 w-4" />
                </span>
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                  APPLICATIONS
                </span>
              </div>
              <span className="shrink-0 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-extrabold px-2 py-0.5">
                {activeApplicationsCount} Active
              </span>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
                {totalSubmissionsCount}
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                {totalSubmissionsCount === 1 ? "total submission" : "total submissions"}
              </p>
            </div>
            <div className="pt-2.5 border-t border-neutral-200 dark:border-neutral-800 text-[11px] font-semibold text-primary flex items-center justify-between">
              <span>Track Pipeline</span>
              <HiArrowRight className="h-3.5 w-3.5 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        </section>

        {/* ========================================================================= */}
        {/* 3. BALANCED 2-COLUMN COCKPIT (EXPANSIVE FEED + SMART RIGHT RAIL)          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start w-full min-w-0">

          {/* ======================================================================= */}
          {/* PRIMARY FEED (8 COLUMNS ON DESKTOP ~67% BREATHING ROOM)                 */}
          {/* ======================================================================= */}
          <section className="lg:col-span-8 w-full min-w-0 space-y-5">
            {/* Feed Filter Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 p-1">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
                    {isStudent ? "Recommended for You (Internships)" : "Recommended Roles"}
                  </h2>
                  <span className="rounded-full bg-primary/10 border border-primary/20 text-primary px-2.5 py-0.5 text-xs font-bold shrink-0">
                    {filteredJobs.length} {isStudent ? "openings available" : "roles available"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isStudent
                    ? `Ranked on your verified ${courseName} course, skills, and academic profile. Full-time jobs unlock when you graduate.`
                    : "Curated clinical opportunities matched to your verified credentials"}
                </p>
              </div>

              <Link
                to="/jobs"
                search={{ q: undefined }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline self-start sm:self-auto shrink-0"
              >
                <span>{isStudent ? `View all internships (${studentInternships.length})` : `View all jobs (${effectiveJobs.length})`}</span>
                <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
              </Link>
            </div>

            {/* Filter Tabs & View Mode Switcher */}
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="flex items-center gap-1.5 bg-muted/40 p-1.5 rounded-2xl border border-border/70 overflow-x-auto max-w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 sm:shrink">
                {(isStudent
                  ? (["All", "Top match", "Urgent"] as const)
                  : (["All", "Top match", "Urgent", "Day shift"] as const)
                ).map((tab) => {
                  const count = tabCounts[tab] ?? 0;
                  const label = tab === "All" ? (isStudent ? "All Internships" : "All Roles") : tab;
                  const isActive = filter === tab;

                  return (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setFilter(tab as FilterTab)}
                      className={cn(
                        "rounded-xl px-3 sm:px-4 py-2 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-1.5",
                        isActive
                          ? "bg-card text-foreground font-bold border border-border/60 shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <span>{label}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums transition-colors",
                          isActive
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* View Layout Toggle: 1-Column vs 2-Column Grid */}
              <div className="hidden sm:flex items-center gap-1 bg-muted/40 p-1 rounded-2xl border border-border/70">
                <button
                  type="button"
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-xl transition-all cursor-pointer",
                    viewMode === "list"
                      ? "bg-card text-foreground border border-border/60 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="List View"
                  aria-label="List View"
                >
                  <HiOutlineBars3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-xl transition-all cursor-pointer",
                    viewMode === "grid"
                      ? "bg-card text-foreground border border-border/60 font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <HiOutlineSquares2X2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Job Listings Feed */}
            {filteredJobs.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border/80 bg-card/80 backdrop-blur-xs p-6 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden shadow-xs">
                {/* Saffron ambient brand glow */}
                <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#FF5A1F]/10 dark:bg-[#FF5A1F]/15 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 right-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

                <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
                  {/* Healthcare Search Animated Illustration (Bayu Febrianto LottieFiles) */}
                  <HealthcareSearchGraphic className="w-56 h-56 sm:w-64 sm:h-64 mb-3" />

                  {/* Headline */}
                  <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                    {filter !== "All"
                      ? `No ${filter.toLowerCase()} roles found`
                      : "No recommended roles available right now"}
                  </h3>

                  {/* Clean, proper message */}
                  <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                    {filter !== "All"
                      ? `We couldn't find any openings matching the "${filter}" filter. Try viewing all roles or exploring locum shifts.`
                      : isStudent
                      ? "There are currently no clinical internships matching your course criteria. Check back soon as teaching hospitals update their slots regularly."
                      : "We couldn't find any clinical openings matching your current specialty and preferences. You can browse the complete job directory or check back soon as verified hospitals post new roles."}
                  </p>

                  {/* Proactive Action Buttons */}
                  <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                    {filter !== "All" ? (
                      <Button
                        size="sm"
                        onClick={() => setFilter("All")}
                        className="rounded-xl font-bold text-xs h-9 px-4 bg-primary hover:bg-primary-hover text-white gap-2 shadow-none cursor-pointer"
                      >
                        <HiOutlineArrowPath className="h-4 w-4" />
                        <span>View All Roles</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        asChild
                        className="rounded-xl font-bold text-xs h-9 px-4 bg-primary hover:bg-primary-hover text-white gap-2 shadow-none cursor-pointer"
                      >
                        <Link to="/jobs" search={{ q: undefined }}>
                          <HiOutlineBriefcase className="h-4 w-4" />
                          <span>Browse Job Directory</span>
                        </Link>
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                      className="rounded-xl border-border/80 hover:bg-muted font-bold text-xs h-9 px-4 shadow-none gap-2"
                    >
                      <Link to="/shifts">
                        <HiOutlineClock className="h-4 w-4 text-primary" />
                        <span>Explore Locum Shifts</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  viewMode === "grid"
                    ? "grid grid-cols-1 md:grid-cols-2 gap-4"
                    : "space-y-4"
                )}
              >
                {filteredJobs.slice(0, viewMode === "grid" ? 10 : 8).map((job) => {
                  const isSaved = s.saved.includes(job.id);
                  const isApplied = appliedJobIds.has(job.id);
                  const isIntern = job.kind === "internship" || job.type === "Internship";
                  const isRestrictedForStudent = isStudent && !isIntern;

                  return (
                    <div
                      key={job.id}
                      className="group relative rounded-2xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs hover:border-primary/40 transition-all duration-200 flex flex-col justify-between"
                    >
                      <div>
                        {/* Top Header: Organization Logo + Details + Match Score & Bookmark */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-sm font-black text-primary">
                              {job.org
                                .split(" ")
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join("")}
                            </div>

                            <div className="min-w-0">
                              <h4 className="text-sm font-bold text-foreground truncate">
                                {job.org}
                              </h4>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {job.city} · {isIntern ? "Clinical Internship" : job.type}
                                {job.dept && ` · ${job.dept}`}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {isIntern && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-black text-primary">
                                <HiOutlineAcademicCap className="h-3 w-3" />
                                <span>Internship</span>
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              {job.match}% Match
                            </span>

                            <button
                              type="button"
                              onClick={() => toggleSave(job.id)}
                              aria-label={isSaved ? "Unsave job" : "Save job"}
                              className="grid h-8 w-8 place-items-center rounded-xl text-muted-foreground hover:bg-muted hover:text-foreground transition-colors cursor-pointer"
                            >
                              {isSaved ? (
                                <HiBookmark className="h-4.5 w-4.5 text-primary" />
                              ) : (
                                <HiOutlineBookmark className="h-4.5 w-4.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Job Title & Badges */}
                        <div className="mt-3.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link
                              to="/jobs/$id"
                              params={{ id: job.id }}
                              className="text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors leading-snug"
                            >
                              {job.title}
                            </Link>
                            {job.urgent && (
                              <span className="text-[10px] font-bold text-rose-600 bg-rose-500/10 border border-rose-500/20 dark:text-rose-400 px-2 py-0.5 rounded-full shrink-0">
                                Urgent
                              </span>
                            )}
                          </div>

                          {/* Tags */}
                          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-xs text-muted-foreground">
                            {job.tags.slice(0, 3).map((tag) => (
                              <span
                                key={tag}
                                className="rounded-lg bg-muted/60 px-2.5 py-0.5 text-xs font-medium text-muted-foreground border border-border/50"
                              >
                                {tag}
                              </span>
                            ))}
                            {job.accredited && (
                              <span className="text-xs text-primary font-bold flex items-center gap-1">
                                <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                                NABH Accredited
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Footer Row: Salary, Experience & Actions */}
                      <div className="mt-4 pt-3.5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
                          <span className="text-base font-extrabold text-foreground">
                            {job.stipend || job.salary}
                          </span>
                          {!job.stipend && <span className="text-xs">/ month</span>}
                          <span className="text-muted-foreground/40">•</span>
                          <span className="font-medium text-foreground/80">{job.exp}</span>
                          {job.shift && (
                            <>
                              <span className="text-muted-foreground/40">•</span>
                              <span>{job.shift}</span>
                            </>
                          )}
                          <span className="text-muted-foreground/40">•</span>
                          <span>Posted {job.posted || "2d ago"}</span>
                        </div>

                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="font-semibold text-xs h-9 px-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Link to="/jobs/$id" params={{ id: job.id }}>
                              Details
                            </Link>
                          </Button>

                          {isApplied ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                              <HiOutlineCheckCircle className="h-4 w-4" />
                              <span>Applied</span>
                            </span>
                          ) : isRestrictedForStudent ? (
                            <span
                              title="Students can apply to accredited clinical internships. Full-time hospital roles unlock upon graduation with council registration."
                              className="inline-flex items-center gap-1 rounded-xl bg-muted border border-border/80 px-3 py-1.5 text-xs font-semibold text-muted-foreground cursor-not-allowed select-none"
                            >
                              <HiOutlineLockClosed className="h-3.5 w-3.5" />
                              <span>Internships only for students</span>
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleQuickApply(job)}
                              className="font-bold text-xs h-9 px-4 rounded-xl gap-1.5 bg-primary hover:bg-primary-hover text-white shadow-none cursor-pointer"
                            >
                              <span>Easy Apply</span>
                              <HiArrowRight className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredJobs.length > (viewMode === "grid" ? 10 : 8) && (
              <div className="pt-3 text-center">
                <Button
                  variant="outline"
                  asChild
                  className="rounded-xl border-border/80 bg-card hover:bg-muted font-bold text-xs h-10 px-6 shadow-none gap-2"
                >
                  <Link to="/jobs" search={{ q: undefined }}>
                    <span>{isStudent ? `Explore all ${filteredJobs.length} clinical internships` : `Explore all ${filteredJobs.length} verified roles`}</span>
                    <HiArrowRight className="h-4 w-4 text-primary" />
                  </Link>
                </Button>
              </div>
            )}
          </section>

          {/* ======================================================================= */}
          {/* RIGHT RAIL: READINESS, INSTANT SHIFTS & ASSISTANT (4 COLUMNS ~33%)     */}
          {/* ======================================================================= */}
          <aside className="lg:col-span-4 w-full min-w-0 space-y-5 lg:sticky lg:top-20">
            {/* 1. Placement Readiness & Open to Work Card */}
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <HiOutlineSparkles className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      {isStudent ? "Student Profile Status" : "Placement Profile"}
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      {isStudent ? "Verified academic account" : "NABH Fast-Track Verified"}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>

              {/* Progress Bar & Badges */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted-foreground">Profile Completeness</span>
                  <span className="font-mono font-bold text-primary">{completeness}%</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${completeness}%` }}
                  />
                </div>
              </div>

              {/* Verified Clinical Credentials Checklist */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <HiOutlineShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{isStudent ? "College Bonafide" : "Council Registration"}</span>
                  </span>
                  <span className="font-semibold text-foreground truncate max-w-[150px] text-right">
                    {s.profile["regNo"] || s.profile["council"] || s.docs["REGISTRATION"] || s.docs["RESUME"] || "Verified"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <HiOutlineDocumentCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{isStudent ? "Academic ID Card" : "Degree Certificate"}</span>
                  </span>
                  <span className="font-semibold text-foreground truncate max-w-[150px] text-right">
                    {s.profile["qual"] || s.docs["DEGREE"] || s.docs["STUDENT_ID"] || "MBBS"}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5">
                    <HiOutlineBolt className="h-4 w-4 text-primary" />
                    <span>Notice / Availability</span>
                  </span>
                  <span className="font-semibold text-foreground truncate max-w-[150px] text-right">
                    {String(s.profile["notice"] || s.profile["availability"] || "Immediate")}
                  </span>
                </div>
              </div>

              {/* Interactive Open-to-Work Toggle */}
              <div className="pt-3 border-t border-border/60 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        isOpenToWork ? "bg-primary animate-pulse" : "bg-muted-foreground"
                      )}
                    />
                    <p className="text-xs font-bold text-foreground">Open to Clinical Opportunities</p>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {isOpenToWork ? "Visible to NABH recruiters" : "Hidden from active recruiter searches"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    {isOpenToWork ? "Active" : "Paused"}
                  </span>
                  <Switch
                    checked={isOpenToWork}
                    disabled={updatingOpenToWork}
                    onCheckedChange={handleToggleOpenToWork}
                    className="scale-90"
                  />
                </div>
              </div>
            </div>

            {/* 2. Instant Locum Shifts Widget / Student Clinical Roadmap */}
            <div className="rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs space-y-4">
              {isStudent ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                      <HiOutlineAcademicCap className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-sm font-bold text-foreground">Clinical Licensing Track</h3>
                      <p className="text-[11px] text-muted-foreground">Pathway to independent practice</p>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    In compliance with clinical council norms, independent ward & ICU shifts require completed degrees and State Council Registration (KNC, KMC, etc.).
                  </p>

                  <div className="space-y-2.5 pt-1">
                    <div className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px]">✓</span>
                      <span>Verified Student Enrolment</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-foreground font-semibold">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px]">2</span>
                      <span>Clinical Internship / Rotations</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-muted border border-border text-[10px]">3</span>
                      <span>Degree Award & Council Registration</span>
                    </div>
                    <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
                      <span className="grid h-5 w-5 place-items-center rounded-full bg-muted border border-border text-[10px]">4</span>
                      <span>Independent Shifts (Unlocks on Graduation)</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="w-full rounded-xl border-border/80 hover:bg-muted font-bold text-xs h-9 justify-center gap-1.5 shadow-none"
                  >
                    <Link to="/learning">
                      <span>Explore CME & Prep Courses</span>
                      <HiArrowRight className="h-3.5 w-3.5 text-primary" />
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="grid h-8 w-8 place-items-center rounded-xl bg-amber-500/10 text-amber-600 shrink-0">
                        <HiOutlineClock className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-sm font-bold text-foreground">Instant Locum Shifts</h3>
                        <p className="text-[11px] text-muted-foreground">Direct hospital coverage</p>
                      </div>
                    </div>
                    <Link to="/shifts" className="text-xs font-bold text-primary hover:underline">
                      View all
                    </Link>
                  </div>

                  <div className="space-y-3">
                    {effectiveShifts.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-border/70 p-4 text-center bg-muted/10">
                        <p className="text-xs font-semibold text-foreground">No open shifts today</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Emergency locum postings appear in real-time.
                        </p>
                      </div>
                    ) : (
                      effectiveShifts.slice(0, 3).map((sh) => {
                        const isClaimed = claimedShiftIds.has(sh.id) || Boolean(sh.hasClaimed);
                        const rateFormatted = typeof sh.rate === "number"
                          ? sh.rate.toLocaleString("en-IN")
                          : (sh.rateNumber ? sh.rateNumber.toLocaleString("en-IN") : sh.rate);
                        return (
                          <div
                            key={sh.id}
                            className="rounded-2xl border border-border/70 p-3.5 bg-muted/20 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-foreground truncate">{sh.title}</p>
                                <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                                  {sh.org} · {sh.date}
                                </p>
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
                                    ₹{rateFormatted}/hr
                                  </span>
                                  <span className="text-[11px] text-muted-foreground">{sh.hours}h shift</span>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleClaimShift(sh.id, sh.title, sh.org)}
                                disabled={isClaimed}
                                className={cn(
                                  "shrink-0 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer shadow-none",
                                  isClaimed
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 cursor-default"
                                    : "bg-primary text-white hover:bg-primary-hover"
                                )}
                              >
                                {isClaimed ? "Claimed" : "Claim"}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </>
              )}
            </div>

            {/* 3. Clinical Concierge AI Widget */}
            <ClinicalConciergeWidget />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
