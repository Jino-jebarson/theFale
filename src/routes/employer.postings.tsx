import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  HiOutlineBriefcase,
  HiOutlineBolt,
  HiOutlineMapPin,
  HiOutlineBuildingOffice2,
  HiOutlinePlus,
  HiOutlineMagnifyingGlass,
  HiOutlineCurrencyRupee,
  HiOutlineUserGroup,
  HiOutlineClock,
  HiOutlineShieldCheck,
  HiOutlineArrowPath,
  HiOutlineEye,
  HiOutlineCheckCircle,
  HiArrowRight,
  HiXMark,
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/fale/AppShell";
import { Button } from "@/components/ui/button";
import { EmptyEarningsGraphic } from "@/components/fale/EmptyEarningsGraphic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { jobs, shifts } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled, paiseToRupees, formatCurrency } from "@/lib/api";
import {
  getFacilityJobs,
  getFacilityApplicants,
  type JobPostingDto,
} from "@/lib/adapters/facilityAdapter";
import { getFacilityShifts, type UiShiftItem } from "@/lib/adapters/shiftAdapter";

export const Route = createFileRoute("/employer/postings")({
  head: () => ({
    meta: [
      { title: "Active Roles & Shifts — Hospital Command" },
      {
        name: "description",
        content: "Monitor live hospital vacancies, review applicant counts, and track broadcast shift coverage.",
      },
      { property: "og:title", content: "Active Roles & Shifts — FALE Healthcare" },
      { property: "og:description", content: "Hospital clinical workforce requisition dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmployerPostings,
});

function EmployerPostings() {
  const s = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"jobs" | "shifts">("jobs");
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState<"all" | "active" | "pending" | "closed">("all");
  const [shiftFilter, setShiftFilter] = useState<"all" | "open" | "booked" | "pending">("all");
  const [selectedJob, setSelectedJob] = useState<any | null>(null);

  // Dynamic API state
  const [apiJobs, setApiJobs] = useState<JobPostingDto[]>([]);
  const [apiShifts, setApiShifts] = useState<UiShiftItem[]>([]);
  const [apiApplicants, setApiApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(isApiEnabled);

  const fetchPostings = () => {
    if (!isApiEnabled) return;
    setLoading(true);
    Promise.all([
      getFacilityJobs().catch(() => []),
      getFacilityShifts().catch(() => []),
      getFacilityApplicants().catch(() => []),
    ])
      .then(([fJobs, fShifts, fApps]) => {
        setApiJobs(fJobs);
        setApiShifts(fShifts);
        setApiApplicants(fApps);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchPostings();
  }, []);

  // Map jobs
  const allJobs = useMemo(() => {
    if (isApiEnabled) {
      return apiJobs.map((j) => {
        const minRupees = j.salaryMinPaise ? paiseToRupees(j.salaryMinPaise) : Number(j.salaryMin || 0);
        const maxRupees = j.salaryMaxPaise ? paiseToRupees(j.salaryMaxPaise) : Number(j.salaryMax || 0);
        const applicantsForJob = apiApplicants.filter((a) => a.jobId === j.id);

        let uiStatus = "Active";
        if (j.status === "CLOSED" || j.status === "FILLED") uiStatus = "Closed";
        else if (j.status === "PENDING" || j.status === "UNDER_REVIEW") uiStatus = "Under review";

        return {
          id: j.id,
          title: j.title,
          dept: j.department || "Clinical Medicine",
          city: j.city || "Chennai",
          workLocation: j.workLocation || j.city || "Main Campus",
          openings: j.openings || 1,
          employmentType: j.employmentType || "Full-time",
          minSalary: minRupees,
          maxSalary: maxRupees,
          salaryDisplay:
            minRupees && maxRupees
              ? `₹${(minRupees / 1000).toFixed(0)}k–${(maxRupees / 1000).toFixed(0)}k/mo`
              : minRupees
              ? `₹${(minRupees / 1000).toFixed(0)}k+/mo`
              : "Competitive",
          status: uiStatus,
          rawStatus: j.status,
          applicantsCount: applicantsForJob.length,
          postedDate: j.postedAt || (j as any).createdAt ? new Date(j.postedAt || (j as any).createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Recent",
          experienceRequired: j.experienceRequired || "1-3 yrs clinical experience",
          qualificationRequired: j.qualificationRequired || "State Council Registration Required",
          description: j.description || "Healthcare opportunity at accredited partner hospital.",
        };
      });
    }

    // Mock data fallback
    return (s.postedJobs.length > 0 ? s.postedJobs : jobs.slice(0, 4)).map((j: any) => ({
      id: j.id,
      title: j.title,
      dept: j.dept || "General Medicine",
      city: j.city || "Chennai",
      workLocation: j.workLocation || j.city || "Main Hospital Campus",
      openings: j.openings || 2,
      employmentType: j.type || "Full-time",
      minSalary: 45000,
      maxSalary: 75000,
      salaryDisplay: j.salary || "₹45k–₹75k/mo",
      status: "Active",
      rawStatus: "ACTIVE",
      applicantsCount: (s.adminApplications || []).filter((a) => a.jobId === j.id).length || 1,
      postedDate: "Recent",
      experienceRequired: j.exp || "2-5 yrs",
      qualificationRequired: j.qualification || "State Council Registration",
      description: "Comprehensive medical and clinical care in a collaborative setting.",
    }));
  }, [isApiEnabled, apiJobs, apiApplicants, s.postedJobs, s.adminApplications]);

  // Map shifts
  const allShifts = useMemo(() => {
    if (isApiEnabled) {
      return apiShifts.map((sh) => {
        let uiStatus = "Live Broadcast";
        if (sh.status === "FILLED" || sh.status === "COMPLETED") uiStatus = "Clinician Assigned";
        else if (sh.status === "PENDING_APPROVAL") uiStatus = "Awaiting Verification";

        return {
          id: sh.id,
          title: sh.title,
          dept: sh.dept || "Emergency & Trauma",
          date: sh.date || "Today",
          timeSlot: sh.timeSlot || `${sh.startTime || "08:00"} - ${sh.endTime || "16:00"}`,
          hours: sh.hours || 8,
          rate: sh.rate || 650,
          totalPayout: (sh.rate || 650) * (sh.hours || 8),
          slots: sh.slots || 1,
          slotsClaimed: sh.slotsClaimed || (sh.status === "FILLED" ? 1 : 0),
          status: uiStatus,
          rawStatus: sh.status,
          urgency: sh.urgency || "Standard",
        };
      });
    }

    return shifts.slice(0, 4).map((sh) => ({
      id: sh.id,
      title: sh.role,
      dept: sh.dept,
      date: sh.date,
      timeSlot: sh.timing,
      hours: 8,
      rate: sh.rate,
      totalPayout: sh.total,
      slots: 2,
      slotsClaimed: 1,
      status: "Live Broadcast",
      rawStatus: "OPEN",
      urgency: "Urgent",
    }));
  }, [isApiEnabled, apiShifts]);

  // Filtered lists
  const filteredJobs = useMemo(() => {
    return allJobs.filter((j) => {
      if (jobFilter === "active" && j.status !== "Active") return false;
      if (jobFilter === "pending" && j.status !== "Under review") return false;
      if (jobFilter === "closed" && j.status !== "Closed") return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          j.title.toLowerCase().includes(q) ||
          j.dept.toLowerCase().includes(q) ||
          j.city.toLowerCase().includes(q) ||
          j.workLocation.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allJobs, jobFilter, search]);

  const filteredShifts = useMemo(() => {
    return allShifts.filter((sh) => {
      if (shiftFilter === "open" && sh.status !== "Live Broadcast") return false;
      if (shiftFilter === "booked" && sh.status !== "Clinician Assigned") return false;
      if (shiftFilter === "pending" && sh.status !== "Awaiting Verification") return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          sh.title.toLowerCase().includes(q) ||
          sh.dept.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allShifts, shiftFilter, search]);

  return (
    <AppShell>
      <div className="w-full min-w-0 space-y-6">
        {/* Executive Header & Quick Post Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Active Roles & Requisitions
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Monitor live hospital vacancies, review applicant flow, and track broadcast shift coverage.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto sm:items-center sm:gap-2.5">
            <Button
              asChild
              size="sm"
              variant="outline"
              className="rounded-xl font-bold text-[11px] min-[390px]:text-xs h-9 px-2 sm:px-3.5 gap-1.5 border-border hover:border-primary/50 text-foreground cursor-pointer shadow-2xs w-full justify-center"
            >
              <Link to="/employer/post-shift">
                <HiOutlineBolt className="h-4 w-4 text-primary shrink-0" />
                <span className="whitespace-nowrap">Broadcast Shift</span>
              </Link>
            </Button>
            <Button
              asChild
              size="sm"
              className="rounded-xl font-bold text-[11px] min-[390px]:text-xs h-9 px-2 sm:px-3.5 gap-1.5 bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-xs w-full justify-center"
            >
              <Link to="/employer/post">
                <HiOutlinePlus className="h-4 w-4 shrink-0" />
                <span className="whitespace-nowrap">Post Clinical Vacancy</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Dual Mode Switcher: Clinical Jobs vs Locum Shifts */}
        <div className="p-1 rounded-2xl bg-muted/60 border border-border/60 w-full sm:max-w-md shadow-2xs">
          <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("jobs")}
              className={cn(
                "flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-1.5 min-[380px]:px-2.5 sm:px-3 rounded-xl text-[11px] min-[380px]:text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-w-0",
                activeTab === "jobs"
                  ? "bg-card text-foreground shadow-xs border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HiOutlineBriefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span>Clinical Jobs</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0",
                  activeTab === "jobs" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {allJobs.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("shifts")}
              className={cn(
                "flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-1.5 min-[380px]:px-2.5 sm:px-3 rounded-xl text-[11px] min-[380px]:text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-w-0",
                activeTab === "shifts"
                  ? "bg-card text-foreground shadow-xs border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HiOutlineBolt className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span>Locum Duty Shifts</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-mono font-bold shrink-0",
                  activeTab === "shifts" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}
              >
                {allShifts.length}
              </span>
            </button>
          </div>
        </div>

        {/* Search & Sub-Filter Bar */}
        <div className="surface rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Sub Filter Tabs */}
          {activeTab === "jobs" ? (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {(
                [
                  { id: "all", label: "All Openings", count: allJobs.length },
                  { id: "active", label: "Active", count: allJobs.filter((j) => j.status === "Active").length },
                  { id: "pending", label: "Under Review", count: allJobs.filter((j) => j.status === "Under review").length },
                  { id: "closed", label: "Closed", count: allJobs.filter((j) => j.status === "Closed").length },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setJobFilter(f.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0",
                    jobFilter === f.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-input bg-card text-muted-foreground hover:border-ring hover:text-foreground"
                  )}
                >
                  <span>{f.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-bold font-mono",
                      jobFilter === f.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {(
                [
                  { id: "all", label: "All Shifts", count: allShifts.length },
                  { id: "open", label: "Live Broadcast", count: allShifts.filter((s) => s.status === "Live Broadcast").length },
                  { id: "booked", label: "Clinician Assigned", count: allShifts.filter((s) => s.status === "Clinician Assigned").length },
                  { id: "pending", label: "In Review", count: allShifts.filter((s) => s.status === "Awaiting Verification").length },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setShiftFilter(f.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-semibold transition-all cursor-pointer shrink-0",
                    shiftFilter === f.id
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "border border-input bg-card text-muted-foreground hover:border-ring hover:text-foreground"
                  )}
                >
                  <span>{f.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-bold font-mono",
                      shiftFilter === f.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {f.count}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Keyword Search */}
          <div className="relative sm:w-64">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder={activeTab === "jobs" ? "Search jobs by title, department..." : "Search shifts by role, dept..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8.5 w-full rounded-xl border border-input bg-card pl-9 pr-7 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
              >
                <HiXMark className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* TAB 1: Clinical Jobs List */}
        {activeTab === "jobs" && (
          <div className="space-y-3.5">
            {filteredJobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <EmptyEarningsGraphic className="w-32 h-32 mx-auto mb-2 text-muted-foreground/60" />
                <h3 className="text-base font-bold text-foreground">No clinical job postings match</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                  {search ? `No job postings matching "${search}".` : "You have not published any job openings in this category yet."}
                </p>
                <div className="mt-4">
                  <Button asChild size="sm" className="rounded-xl font-bold text-xs h-8.5 px-4 bg-primary text-white">
                    <Link to="/employer/post">Create Job Posting</Link>
                  </Button>
                </div>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary font-bold shadow-2xs">
                        <HiOutlineBuildingOffice2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-foreground truncate">{job.title}</h3>
                          <span className="rounded-lg bg-primary-soft/80 px-2 py-0.5 text-[10px] font-bold text-primary">
                            {job.dept}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-2 flex-wrap font-medium">
                          <span className="flex items-center gap-1">
                            <HiOutlineMapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span>{job.workLocation || job.city}</span>
                          </span>
                          <span>•</span>
                          <span>{job.employmentType}</span>
                          <span>•</span>
                          <span className="font-semibold text-foreground">{job.openings} Openings</span>
                          <span>•</span>
                          <span className="font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                            {job.salaryDisplay}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <StatusBadge status={job.status} />
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground font-medium">
                      <HiOutlineUserGroup className="h-4 w-4 text-primary shrink-0" />
                      <span>
                        <strong className="text-foreground font-bold">{job.applicantsCount}</strong> Shortlisted Candidates
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedJob(job)}
                        className="h-8.5 rounded-xl text-[11px] min-[390px]:text-xs font-semibold border-input hover:border-ring cursor-pointer w-full justify-center px-2 sm:px-3"
                      >
                        <HiOutlineEye className="h-3.5 w-3.5 text-muted-foreground mr-1 shrink-0" />
                        <span className="whitespace-nowrap">View Details</span>
                      </Button>
                      <Button
                        asChild
                        size="sm"
                        className="h-8.5 rounded-xl text-[11px] min-[390px]:text-xs font-bold bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-2xs w-full justify-center px-2 sm:px-3"
                      >
                        <Link to="/employer/applicants" className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span className="sm:hidden">Review ({job.applicantsCount})</span>
                          <span className="hidden sm:inline">Review Applicants ({job.applicantsCount})</span>
                          <HiArrowRight className="h-3.5 w-3.5 shrink-0" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* TAB 2: Locum Shifts List */}
        {activeTab === "shifts" && (
          <div className="space-y-3.5">
            {filteredShifts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <EmptyEarningsGraphic className="w-32 h-32 mx-auto mb-2 text-muted-foreground/60" />
                <h3 className="text-base font-bold text-foreground">No active locum duty shifts</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                  {search ? `No shifts matching "${search}".` : "You have no active shifts broadcasted right now."}
                </p>
                <div className="mt-4">
                  <Button asChild size="sm" className="rounded-xl font-bold text-xs h-8.5 px-4 bg-primary hover:bg-primary/90 text-white shadow-xs">
                    <Link to="/employer/post-shift">Broadcast Locum Shift</Link>
                  </Button>
                </div>
              </div>
            ) : (
              filteredShifts.map((sh) => (
                <div
                  key={sh.id}
                  className="rounded-2xl border border-border/80 bg-card p-5 shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between gap-3.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary font-bold shadow-2xs">
                        <HiOutlineBolt className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-foreground truncate">{sh.title}</h3>
                          <span className="rounded-lg bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                            {sh.dept}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground flex items-center gap-2 flex-wrap font-medium">
                          <span className="flex items-center gap-1">
                            <HiOutlineClock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            <span>{sh.date} • {sh.timeSlot} ({sh.hours} hrs)</span>
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-foreground">
                            {sh.slotsClaimed} / {sh.slots} Slots Assigned
                          </span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-base font-black font-mono text-primary">
                        ₹{sh.rate}/hr
                      </span>
                      <span className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold",
                        sh.status === "Live Broadcast"
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                          : sh.status === "Clinician Assigned"
                          ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                          : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                      )}>
                        <span className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          sh.status === "Live Broadcast" ? "bg-emerald-500 animate-pulse" : "bg-blue-500"
                        )} />
                        {sh.status}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1">
                      <HiOutlineShieldCheck className="h-4 w-4 shrink-0" /> 24h Escrow Locked (Est: ₹{sh.totalPayout?.toLocaleString("en-IN")})
                    </span>

                    <div className="w-full sm:w-auto">
                      <Button
                        asChild
                        size="sm"
                        className="h-8.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-2xs w-full sm:w-auto justify-center"
                      >
                        <Link to="/employer/applicants" className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span>View Claimed Clinicians</span>
                          <HiArrowRight className="h-3.5 w-3.5 shrink-0" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* View Job Details Dialog */}
        <Dialog open={!!selectedJob} onOpenChange={(open) => !open && setSelectedJob(null)}>
          <DialogContent className="max-w-xl p-0 overflow-hidden rounded-t-[28px] sm:rounded-3xl border border-border/80 bg-card shadow-2xl flex flex-col max-h-[90vh] sm:max-h-[85vh]">
            {selectedJob && (
              <div className="flex flex-col h-full min-h-0">
                {/* Modal Top Header */}
                <div className="flex items-center justify-between border-b border-border/80 px-4 sm:px-6 py-3.5 sm:py-4 bg-muted/40 pr-12">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <span className="grid h-9 w-9 sm:h-10 sm:w-10 shrink-0 place-items-center rounded-xl sm:rounded-2xl bg-primary/10 border border-primary/20 text-primary shadow-xs">
                      <HiOutlineBuildingOffice2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                        <DialogTitle className="text-sm sm:text-lg font-bold text-foreground truncate">
                          {selectedJob.title}
                        </DialogTitle>
                        <StatusBadge status={selectedJob.status} />
                      </div>
                      <DialogDescription className="text-[11px] sm:text-xs text-muted-foreground truncate mt-0.5 font-medium">
                        {selectedJob.dept} • {selectedJob.workLocation || selectedJob.city} • {selectedJob.employmentType}
                      </DialogDescription>
                    </div>
                  </div>
                </div>

                {/* Modal Body (Scrollable with preserved outer rounded borders) */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 space-y-3.5 sm:space-y-4 [scrollbar-width:thin]">
                  {/* Key Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2.5 sm:gap-3 text-xs p-3.5 sm:p-4 rounded-2xl bg-muted/30 border border-border/70">
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground block text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider">Seats / Openings</span>
                      <strong className="text-foreground text-xs sm:text-sm font-bold">{selectedJob.openings} Seats</strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground block text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider">Compensation</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-bold">{selectedJob.salaryDisplay}</strong>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground block text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider">Experience</span>
                      <span className="text-foreground text-xs font-semibold">{selectedJob.experienceRequired}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-muted-foreground block text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider">Registration Req</span>
                      <span className="text-foreground text-xs font-semibold">{selectedJob.qualificationRequired}</span>
                    </div>
                  </div>

                  {/* Scope & Responsibilities */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Clinical Scope & Responsibilities</h4>
                    <div className="text-xs text-foreground/90 leading-relaxed whitespace-pre-line p-3.5 sm:p-4 rounded-2xl border border-border/70 bg-card/60 shadow-2xs">
                      {selectedJob.description}
                    </div>
                  </div>
                </div>

                {/* Modal Footer (Sticky at bottom) */}
                <div className="border-t border-border/80 bg-muted/20 px-4 sm:px-6 py-3 sm:py-3.5 flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
                    <HiOutlineUserGroup className="h-4 w-4 text-primary shrink-0" />
                    <span className="whitespace-nowrap text-[11px] sm:text-xs">
                      Shortlisted: <strong className="text-foreground font-bold">{selectedJob.applicantsCount}</strong>
                    </span>
                  </div>

                  <Button
                    asChild
                    size="sm"
                    className="h-9 rounded-xl font-bold text-xs px-3.5 sm:px-4 bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-xs inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                  >
                    <Link to="/employer/applicants">
                      <span className="sm:hidden">Review ({selectedJob.applicantsCount})</span>
                      <span className="hidden sm:inline">Review Applicants</span>
                      <HiArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
