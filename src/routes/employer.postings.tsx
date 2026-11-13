import { shiftInHistory } from "@/lib/employerWorkflow";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { usePageLoad } from "@/hooks/use-page-load";
import { RequestError } from "@/components/fale/RequestError";
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
  HiOutlinePencilSquare,
  HiOutlineTrash,
  HiArrowRight,
  HiXMark,
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell, StatusBadge } from "@/components/fale/AppShell";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { EmptyEarningsGraphic } from "@/components/fale/EmptyEarningsGraphic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { jobs, shifts } from "@/lib/data";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled, paiseToRupees, formatCurrency } from "@/lib/api";
import {
  attachFocusAndPollRefresh,
  getFacilityJobs,
  getFacilityApplicants,
  type JobPostingDto,
} from "@/lib/adapters/facilityAdapter";
import { getFacilityShifts, cancelShift, type UiShiftItem } from "@/lib/adapters/shiftAdapter";

export const Route = createFileRoute("/employer/postings")({
  head: () => ({
    meta: [
      { title: "Jobs & Shifts — Hospital Command" },
      {
        name: "description",
        content: "Monitor live hospital vacancies, review applicant counts, and track broadcast shift coverage.",
      },
      { property: "og:title", content: "Jobs & Shifts — FALE Healthcare" },
      { property: "og:description", content: "Hospital clinical workforce requisition dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmployerPostings,
});

function EmployerPostings() {
  const pageLoad = usePageLoad();
  const pageAction = useConfirmedAction();
  const s = useApp();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"jobs" | "shifts">("jobs");
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState<"all" | "active" | "pending" | "closed">("active");
  const [shiftFilter, setShiftFilter] = useState<"all" | "open" | "booked" | "pending" | "history">("all");
  const [selectedJob, setSelectedJob] = useState<any | null>(null);
  const [shiftToCancel, setShiftToCancel] = useState<any | null>(null);
  const [cancellingShift, setCancellingShift] = useState(false);

  // Dynamic API state
  const [apiJobs, setApiJobs] = useState<JobPostingDto[]>([]);
  const [apiShifts, setApiShifts] = useState<UiShiftItem[]>([]);
  const [apiApplicants, setApiApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(isApiEnabled);

  const fetchPostings = (silent = false) => {
    if (!silent) setLoading(true);
    Promise.all([
      getFacilityJobs(),
      getFacilityShifts(),
      getFacilityApplicants(),
    ])
      .then(([fJobs, fShifts, fApps]) => {
        if (fJobs) setApiJobs(fJobs);
        if (fShifts) setApiShifts(fShifts);
        if (fApps) setApiApplicants(fApps);
      }).catch(pageLoad.fail)
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    fetchPostings(false);
    const handleAppsUpdated = () => fetchPostings(true);
    window.addEventListener("fale:applications-updated", handleAppsUpdated);
    const detachAutoRefresh = attachFocusAndPollRefresh(() => fetchPostings(true), 15000);
    return () => {
      window.removeEventListener("fale:applications-updated", handleAppsUpdated);
      detachAutoRefresh();
    };
  }, [pageLoad.retryKey]);

  const handleConfirmCancelShift = async () => { await pageAction.run(async () => {
    if (!shiftToCancel) return;
    setCancellingShift(true);
    try {
      {
        await cancelShift(shiftToCancel.id);
      }
      setApiShifts((prev) => prev.map((x) => (x.id === shiftToCancel.id ? { ...x, status: "CANCELLED" } : x)));
      toast.success("Shift cancelled & escrow refunded", {
        description: `₹${(shiftToCancel.totalEscrow || shiftToCancel.totalPayout || 0).toLocaleString("en-IN")} returned to your available wallet balance.`,
      });
      setShiftToCancel(null);
    } catch (err: any) {
      toast.error("Could not cancel shift", {
        description: err?.message || "Shift has confirmed or active clinician duties.",
      });
    } finally {
      setCancellingShift(false);
    }
  }); };

  // Map jobs
  const allJobs = useMemo(() => {
    {
      return apiJobs.map((j) => {
        const minRupees = j.salaryMinPaise ? paiseToRupees(j.salaryMinPaise) : Number(j.salaryMin || 0);
        const maxRupees = j.salaryMaxPaise ? paiseToRupees(j.salaryMaxPaise) : Number(j.salaryMax || 0);
        const applicantsForJob = apiApplicants.filter((a) => a.jobId === j.id);

        let uiStatus = "Active";
        if (["CLOSED", "FILLED", "REJECTED", "CANCELLED"].includes(j.status)) uiStatus = "Closed";
        else if (["PENDING", "UNDER_REVIEW", "PENDING_APPROVAL"].includes(j.status)) uiStatus = "Under review";

        return {
          id: j.id,
          title: j.title,
          dept: j.department || "Department not specified",
          city: j.city || "",
          workLocation: j.workLocation || j.city || "Location not specified",
          openings: j.openings || 1,
          employmentType: j.employmentType || "Not specified",
          minSalary: minRupees,
          maxSalary: maxRupees,
          salaryDisplay:
            minRupees && maxRupees
              ? `₹${(minRupees / 1000).toFixed(0)}k–${(maxRupees / 1000).toFixed(0)}k/mo`
              : minRupees
              ? `₹${(minRupees / 1000).toFixed(0)}k+/mo`
              : "Salary not specified",
          status: uiStatus,
          rawStatus: j.status,
          applicantsCount: applicantsForJob.length,
          postedDate: j.postedAt || (j as any).createdAt ? new Date(j.postedAt || (j as any).createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Recent",
          experienceRequired: j.experienceRequired || "Not specified",
          qualificationRequired: j.qualificationRequired || "Not specified",
          description: j.description || "No description provided.",
        };
      });
    }



  }, [isApiEnabled, apiJobs, apiApplicants, s.postedJobs, s.adminApplications]);

  // Map shifts
  const allShifts = useMemo(() => {
    {
      return apiShifts.map((sh: any) => {
        let uiStatus = "Live Broadcast";
        if (sh.status === "FILLED" || sh.status === "BOOKED") uiStatus = "Clinician Assigned";
        else if (sh.status === "COMPLETED") uiStatus = "Completed";
        else if (sh.status === "PENDING_APPROVAL") uiStatus = "Awaiting Verification";
        else if (sh.status === "CANCELLED") uiStatus = "Cancelled";
        else if (sh.status === "REJECTED") uiStatus = "Rejected";
        else if (sh.status === "EXPIRED") uiStatus = "Expired";

        const perWorkerTotal = sh.totalPayNumber || ((sh.rate || 0) * (sh.hours || 8));
        const totalEscrow = sh.totalEscrowRequiredPaise ? paiseToRupees(sh.totalEscrowRequiredPaise) : perWorkerTotal * (sh.slots || 1);

        return {
          id: sh.id,
          title: sh.title,
          dept: sh.dept || "Emergency & Trauma",
          date: sh.date || "Date not specified",
          timeSlot: sh.time || sh.timeSlot || `${sh.startTime || "08:00"} - ${sh.endTime || "16:00"}`,
          hours: sh.hours || 8,
          rate: sh.rate || 0,
          totalPayout: perWorkerTotal,
          totalEscrow,
          facilityFeePercent: sh.facilityFeePercent ?? 0,
          gstPercent: sh.platformFeeGstPercent ?? 0,
          autoApproved: Boolean(sh.autoApproved),
          slots: sh.slots || 1,
          slotsClaimed: sh.slotsClaimed ?? 0,
          status: uiStatus,
          rawStatus: (sh.status || "OPEN").toUpperCase(),
          applicantsCount: apiApplicants.filter(a => (a.shiftId || a.jobId) === sh.id).length,
          city: sh.city || "",
          urgency: sh.urgent ? "Urgent" : (sh.urgency || "Standard"),
        };
      });
    }


  }, [isApiEnabled, apiShifts, apiApplicants]);

  // Filtered lists
  const filteredJobs = useMemo(() => {
    return allJobs.filter((j) => {
      if (jobFilter === "all" && j.status === "Closed") return false;
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

  const isShiftBooked = (sh: { status: string; slotsClaimed: number }) =>
    sh.status === "Clinician Assigned" || sh.slotsClaimed > 0;

  const filteredShifts = useMemo(() => {
    return allShifts.filter((sh) => {
      if (shiftFilter === "history" ? !shiftInHistory(sh.rawStatus) : shiftInHistory(sh.rawStatus)) return false;
      if (shiftFilter === "open" && sh.status !== "Live Broadcast") return false;
      if (shiftFilter === "booked" && !isShiftBooked(sh)) return false;
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
      {loading && <p role="status" className="flex items-center gap-2 p-4 text-sm"><ButtonSpinner />Loading jobs and shifts...</p>}
      <RequestError message={pageLoad.error} onRetry={pageLoad.retry} />
      <div className="w-full min-w-0 space-y-6">
        {/* Executive Header & Quick Post Actions */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Jobs & Shifts
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
              Manage openings and staffing. Open an application list to review candidates, attendance or timesheets.
            </p>
          </div>

          <Button asChild size="sm" className="rounded-xl self-start sm:self-center gap-2">
            <Link to={activeTab === "jobs" ? "/employer/post" : "/employer/post-shift"}>
              <HiOutlinePlus className="h-4 w-4" />{activeTab === "jobs" ? "Post Job" : "Post Shift"}
            </Link>
          </Button>
        </div>

        {/* Dual Mode Switcher: Permanent Jobs vs Locum Shifts */}
        <div className="p-1 rounded-2xl bg-muted/60 border border-border/60 w-full sm:max-w-md shadow-2xs">
          <div className="grid grid-cols-2 gap-1 sm:gap-1.5">
            <button
              type="button"
              aria-pressed={activeTab === "jobs"} onClick={() => setActiveTab("jobs")}
              className={cn(
                "flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-1.5 min-[380px]:px-2.5 sm:px-3 rounded-xl text-[11px] min-[380px]:text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-w-0",
                activeTab === "jobs"
                  ? "bg-card text-foreground shadow-xs border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HiOutlineBriefcase className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span>Permanent Jobs</span>
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
              aria-pressed={activeTab === "shifts"} onClick={() => setActiveTab("shifts")}
              className={cn(
                "flex items-center justify-center gap-1.5 sm:gap-2 py-2 px-1.5 min-[380px]:px-2.5 sm:px-3 rounded-xl text-[11px] min-[380px]:text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-w-0",
                activeTab === "shifts"
                  ? "bg-card text-foreground shadow-xs border border-border/40"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <HiOutlineBolt className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
              <span>Locum Shifts</span>
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
                  { id: "all", label: "Current Openings", count: allJobs.filter(j => j.status !== "Closed").length },
                  { id: "active", label: "Active", count: allJobs.filter((j) => j.status === "Active").length },
                  { id: "pending", label: "Under Review", count: allJobs.filter((j) => j.status === "Under review").length },
                  { id: "closed", label: "History", count: allJobs.filter((j) => j.status === "Closed").length },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={jobFilter === f.id} onClick={() => setJobFilter(f.id)}
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
                  { id: "all", label: "Current Shifts", count: allShifts.filter(s => !shiftInHistory(s.rawStatus)).length },
                  { id: "open", label: "Open", count: allShifts.filter((s) => s.status === "Live Broadcast").length },
                  { id: "booked", label: "Confirmed", count: allShifts.filter(s => !shiftInHistory(s.rawStatus) && isShiftBooked(s)).length },
                  { id: "pending", label: "Under Review", count: allShifts.filter((s) => s.status === "Awaiting Verification").length },
                  { id: "history", label: "History", count: allShifts.filter(s => shiftInHistory(s.rawStatus)).length },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={shiftFilter === f.id} onClick={() => setShiftFilter(f.id)}
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
              type="text" aria-label="Search openings"
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

        {/* TAB 1: Permanent Jobs List */}
        {activeTab === "jobs" && (
          <div className="space-y-3.5">
            {filteredJobs.length === 0 && !loading && !pageLoad.error ? (
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
                        <strong className="text-foreground font-bold">{job.applicantsCount}</strong> Applications
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                      <DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="rounded-xl">More actions</Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end"><DropdownMenuItem onSelect={() => setSelectedJob(job)}>View Details</DropdownMenuItem></DropdownMenuContent>
                      </DropdownMenu>
                      <Button
                        asChild
                        size="sm"
                        className="h-8.5 rounded-xl text-[11px] min-[390px]:text-xs font-bold bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-2xs w-full justify-center px-2 sm:px-3"
                      >
                        <Link to="/employer/applicants" search={{ openingId: job.id, type: "jobs" }} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span className="sm:hidden">Applications ({job.applicantsCount})</span>
                          <span className="hidden sm:inline">View Applications ({job.applicantsCount})</span>
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
            {filteredShifts.length === 0 && !loading && !pageLoad.error ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <EmptyEarningsGraphic className="w-32 h-32 mx-auto mb-2 text-muted-foreground/60" />
                <h3 className="text-base font-bold text-foreground">No active locum duty shifts</h3>
                <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                  {search ? `No shifts matching "${search}".` : "You have no active shifts broadcasted right now."}
                </p>
                <div className="mt-4">
                  <Button asChild size="sm" className="rounded-xl font-bold text-xs h-8.5 px-4 bg-primary hover:bg-primary/90 text-white shadow-xs">
                    <Link to="/employer/post-shift">Post Shift</Link>
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
                            <span>{sh.city ? `${sh.city} - ` : ""}{sh.date} • {sh.timeSlot} ({sh.hours} hrs)</span>
                          </span>
                          <span>•</span>
                          <span className="font-semibold text-foreground">
                            {sh.slotsClaimed} of {sh.slots} clinicians confirmed - {sh.applicantsCount} applications
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
                        {sh.status === "Live Broadcast" ? "Open" : sh.status === "Clinician Assigned" ? "Confirmed" : sh.status === "Awaiting Verification" ? "Under Review" : sh.status}
                      </span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <span className="text-emerald-600 font-semibold text-[11px] flex items-center gap-1 flex-wrap">
                      <HiOutlineShieldCheck className="h-4 w-4 shrink-0" />
                      <span>
                        {shiftInHistory(sh.rawStatus) ? "Shift total:" : "Escrow reserved:"} ₹{(sh.totalEscrow || sh.totalPayout)?.toLocaleString("en-IN")}
                        {!shiftInHistory(sh.rawStatus) && sh.facilityFeePercent > 0 ? ` (includes ${sh.facilityFeePercent}% platform fee reserve${sh.gstPercent ? ` + ${sh.gstPercent}% GST on that fee` : ""})` : ""}
                      </span>
                    </span>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                      {["PENDING_APPROVAL", "OPEN", "FILLED"].includes(sh.rawStatus) && <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="rounded-xl">More actions</Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => { window.location.href = "/employer/post-shift?editId=" + sh.id; }}>Edit Shift</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onSelect={() => setShiftToCancel(sh)}>Cancel Shift</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>}
                      <Button
                        asChild
                        size="sm"
                        className="h-8.5 rounded-xl text-xs font-bold bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-2xs justify-center"
                      >
                        <Link to="/employer/applicants" search={{ openingId: sh.id, type: "shifts" }} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span>
                            View Applications ({sh.applicantsCount})
                          </span>
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
                      Applications: <strong className="text-foreground font-bold">{selectedJob.applicantsCount}</strong>
                    </span>
                  </div>

                  <Button
                    asChild
                    size="sm"
                    className="h-9 rounded-xl font-bold text-xs px-3.5 sm:px-4 bg-primary hover:bg-primary/90 text-white cursor-pointer shadow-xs inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap"
                  >
                    <Link to="/employer/applicants" search={{ openingId: selectedJob.id, type: "jobs" }}>
                      <span className="sm:hidden">Review ({selectedJob.applicantsCount})</span>
                      <span className="hidden sm:inline">View Applications</span>
                      <HiArrowRight className="h-3.5 w-3.5 shrink-0" />
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        {/* Cancel / Delete Shift & Refund Escrow Confirmation Dialog */}
        <Dialog open={!!shiftToCancel} onOpenChange={(open) => !open && setShiftToCancel(null)}>
          <DialogContent className="flex flex-col gap-4 sm:max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6">
            <DialogHeader className="text-left pr-8 space-y-1.5">
              <DialogTitle className="text-base font-extrabold text-foreground">
                Cancel this shift?
              </DialogTitle>
              <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
                Cancelling <strong className="text-foreground">{shiftToCancel?.title}</strong> will remove it from clinician feeds and automatically refund locked escrow back to your hospital wallet.
              </DialogDescription>
            </DialogHeader>
            {shiftToCancel && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs">
                <div className="flex items-center justify-between gap-3 font-semibold">
                  <span className="text-muted-foreground">Full Escrow Refund to Wallet</span>
                  <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                    ₹{(shiftToCancel.totalEscrow || shiftToCancel.totalPayout || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>
            )}
            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:space-x-0 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={cancellingShift}
                onClick={() => setShiftToCancel(null)}
                className="h-9 px-4 rounded-xl text-xs font-bold w-full sm:w-auto"
              >
                Keep Shift
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                disabled={pageAction.isPending || (cancellingShift)}
                onClick={handleConfirmCancelShift}
                className="h-9 px-4 rounded-xl text-xs font-bold w-full sm:w-auto cursor-pointer"
              >
                {cancellingShift ? "Refunding Escrow..." : "Confirm Cancellation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppShell>
  );
}
