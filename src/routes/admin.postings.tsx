import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  HiOutlineDocumentCheck,
  HiOutlineCheckBadge,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiCheck,
  HiOutlineEye,
  HiOutlineBuildingOffice2,
  HiOutlineClock,
  HiOutlineMapPin,
  HiOutlineBriefcase,
  HiOutlineCurrencyRupee,
  HiOutlineArrowPath,
  HiOutlineShieldCheck,
  HiOutlineAcademicCap,
  HiOutlineUserGroup,
  HiOutlineLockClosed,
  HiOutlineBolt,
  HiOutlineFire,
} from "react-icons/hi2";
import { toast } from "sonner";
import { AdminLayout } from "@/components/fale/AdminLayout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useApp, setState, AdminJobApproval } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled, paiseToRupees } from "@/lib/api";
import {
  getPendingJobPostings,
  approveJobPosting,
  rejectJobPosting,
  getPendingShifts,
  approveShift,
  rejectShift,
} from "@/lib/adapters/adminAdapter";

export const Route = createFileRoute("/admin/postings")({
  head: () => ({
    meta: [
      { title: "Job & Shift Requirement Approvals — FALE RMS" },
      { name: "description", content: "Review and approve hospital healthcare jobs and locum shifts before candidate publication." },
    ],
  }),
  component: JobApprovalsAdmin,
});

function JobApprovalsAdmin() {
  const s = useApp();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<AdminJobApproval | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [apiPostings, setApiPostings] = useState<AdminJobApproval[]>([]);
  const [loading, setLoading] = useState(isApiEnabled);

  const fetchPostings = async () => {
    if (!isApiEnabled) return;
    try {
      setLoading(true);
      const [jobsRes, shiftsRes] = await Promise.all([
        getPendingJobPostings("all").catch(() => []),
        getPendingShifts("all").catch(() => []),
      ]);

      const mappedJobs: AdminJobApproval[] = jobsRes.map((dto: any) => {
        const minRupees = dto.salaryMinPaise ? paiseToRupees(dto.salaryMinPaise) : (dto.salaryMin ? Number(dto.salaryMin) : 0);
        const maxRupees = dto.salaryMaxPaise ? paiseToRupees(dto.salaryMaxPaise) : (dto.salaryMax ? Number(dto.salaryMax) : 0);
        let comp = "Competitive";
        if (minRupees && maxRupees) {
          comp = `₹${(minRupees / 1000).toFixed(0)}k–${(maxRupees / 1000).toFixed(0)}k / mo`;
        } else if (minRupees) {
          comp = `₹${(minRupees / 1000).toFixed(0)}k+ / mo`;
        } else if (dto.salaryDisplay) {
          comp = dto.salaryDisplay;
        }

        let status: "pending" | "approved" | "rejected" = "pending";
        if (dto.status === "OPEN" || dto.status === "ACTIVE" || dto.status === "APPROVED") status = "approved";
        else if (dto.status === "REJECTED" || dto.status === "CLOSED") status = "rejected";

        return {
          id: dto.id,
          facilityId: dto.facilityId,
          title: dto.title,
          dept: dto.department || "Clinical Medicine",
          org: dto.facilityName || "Partner Hospital",
          city: dto.city || dto.facilityCity || "Chennai",
          compensation: comp,
          openings: dto.openings || 1,
          type: "job",
          expOrHours: dto.experienceRequired || "1-3 yrs exp",
          experienceRequired: dto.experienceRequired || "1-3 yrs exp",
          qualificationRequired: dto.qualificationRequired || "MBBS / B.Sc Nursing / Allied Health Degree",
          description: dto.description || "Healthcare professional requirement screening for hospital inpatient clinical duty.",
          employmentType: dto.employmentType || "Full-Time Clinical",
          internship: dto.internship || false,
          postedBy: dto.facilityName || "Facility Admin",
          status,
          submittedDate: dto.postedAt || dto.createdAt ? new Date(dto.postedAt || dto.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Recent",
          notes: dto.moderationNotes,
          salaryMin: minRupees,
          salaryMax: maxRupees,
        };
      });

      const mappedShifts: AdminJobApproval[] = shiftsRes.map((s: any) => {
        const rateRupees = s.ratePerHourPaise ? paiseToRupees(s.ratePerHourPaise) : 0;
        const totalRupees = s.totalPayPaise ? paiseToRupees(s.totalPayPaise) : rateRupees * (s.hours || 8);
        const comp = `₹${rateRupees}/hr (₹${totalRupees.toLocaleString("en-IN")})`;

        let status: "pending" | "approved" | "rejected" = "pending";
        if (s.status === "OPEN" || s.status === "ACTIVE" || s.status === "APPROVED") status = "approved";
        else if (s.status === "REJECTED" || s.status === "CANCELLED") status = "rejected";

        return {
          id: s.id,
          facilityId: s.facilityId,
          title: s.title,
          dept: s.department || "Clinical Medicine",
          org: s.facilityName || "Partner Hospital",
          city: s.city || "Chennai",
          compensation: comp,
          openings: s.openings || 1,
          type: "shift" as const,
          expOrHours: `${s.hours || 8} hrs duty`,
          experienceRequired: "Immediate Duty Ready",
          qualificationRequired: "State Council Registered Practitioner",
          description: s.description || `Locum clinical shift duty. Guaranteed 24-hr escrow payout: ₹${totalRupees.toLocaleString("en-IN")}.`,
          employmentType: "Locum Shift",
          internship: false,
          postedBy: s.facilityName || "Facility Admin",
          status,
          submittedDate: s.startAt ? new Date(s.startAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Recent",
          salaryMin: rateRupees,
          salaryMax: totalRupees,
          hours: s.hours || 8,
          startAt: s.startAt,
          endAt: s.endAt,
          ratePerHourPaise: s.ratePerHourPaise,
          surgeRatePerHourPaise: s.surgeRatePerHourPaise,
          surgeLabel: s.surgeLabel,
          totalPayPaise: s.totalPayPaise,
          slotsClaimed: s.slotsClaimed || 0,
          urgent: Boolean(s.urgent || s.isUrgent),
          dutyNotes: s.description,
          rawShift: s,
        };
      });

      setApiPostings([...mappedJobs, ...mappedShifts]);
    } catch (err: any) {
      toast.error("Failed to load postings & shifts", { description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostings();
  }, []);

  // Keep selected posting updated with fresh API data
  useEffect(() => {
    if (selectedJob && apiPostings.length > 0) {
      const fresh = apiPostings.find((j) => j.id === selectedJob.id);
      if (fresh) setSelectedJob(fresh);
    }
  }, [apiPostings]);

  const approvals = isApiEnabled ? apiPostings : s.jobApprovals;

  const filtered = approvals.filter((j) => {
    const matchesFilter = filter === "all" ? true : j.status === filter;
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.org.toLowerCase().includes(search.toLowerCase()) ||
      j.dept.toLowerCase().includes(search.toLowerCase()) ||
      j.city.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApprove = async (id: string, title: string) => {
    if (isApiEnabled) {
      try {
        const item = apiPostings.find((p) => p.id === id);
        if (item?.type === "shift" || selectedJob?.type === "shift") {
          await approveShift(id);
          toast.success("Locum Shift Approved & Live!", {
            description: `"${title}" is now active and live on the Candidate Shift Portal.`,
          });
        } else {
          await approveJobPosting(id);
          toast.success("Requirement Approved & Live!", {
            description: `"${title}" is now published and active on the Candidate Portal.`,
          });
        }
        setSheetOpen(false);
        fetchPostings();
      } catch (err: any) {
        toast.error("Approval failed", { description: err?.message });
      }
      return;
    }
    setState((state) => ({
      jobApprovals: state.jobApprovals.map((j) =>
        j.id === id ? { ...j, status: "approved" as const } : j
      ),
    }));
    toast.success("Requirement Approved & Live!", {
      description: `"${title}" is now published and active on the Candidate Portal.`,
    });
    setSheetOpen(false);
  };

  const handleRejectConfirm = async () => {
    if (!selectedJob) return;
    if (isApiEnabled) {
      try {
        if (selectedJob.type === "shift") {
          await rejectShift(selectedJob.id, rejectReason || "Shift rejected by compliance admin.");
          toast.error("Shift Rejected & Escrow Refunded", {
            description: `Shift returned to ${selectedJob.org}. Escrow refunded to available balance.`,
          });
        } else {
          await rejectJobPosting(selectedJob.id, rejectReason || "Requirement rejected by compliance admin.");
          toast.error("Requirement Rejected", {
            description: `Posting returned to ${selectedJob.org}: ${rejectReason || "Criteria mismatch."}`,
          });
        }
        setRejectModalOpen(false);
        setSheetOpen(false);
        setRejectReason("");
        fetchPostings();
      } catch (err: any) {
        toast.error("Rejection failed", { description: err?.message });
      }
      return;
    }
    setState((state) => ({
      jobApprovals: state.jobApprovals.map((j) =>
        j.id === selectedJob.id ? { ...j, status: "rejected" as const, notes: rejectReason } : j
      ),
    }));
    toast.error("Requirement Rejected", {
      description: `Posting returned to ${selectedJob.org}: ${rejectReason || "Criteria mismatch."}`,
    });
    setRejectModalOpen(false);
    setSheetOpen(false);
    setRejectReason("");
  };

  const pendingCount = approvals.filter((j) => j.status === "pending").length;
  const approvedCount = approvals.filter((j) => j.status === "approved").length;
  const rejectedCount = approvals.filter((j) => j.status === "rejected").length;

  return (
    <AdminLayout
      title="Hospital Requirement & Shift Approvals"
      subtitle="Screen hospital postings for minimum wage floor, duty hours safety, and mandatory registrations before they reflect on the Candidate Portal."
      badge={
        <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
          {pendingCount} Pending · {approvedCount} Live
        </span>
      }
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={fetchPostings}
          disabled={loading}
          className="text-xs font-bold gap-1.5 h-9 rounded-xl border-border hover:bg-muted cursor-pointer"
        >
          <HiOutlineArrowPath className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span>Refresh</span>
        </Button>
      }
    >
      {/* Metric Strip (4 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Pending Review</span>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-foreground">{pendingCount}</div>
          <p className="text-[11px] text-muted-foreground">Screening required</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Live Requirements</span>
            <HiOutlineCheckBadge className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground">{approvedCount}</div>
          <p className="text-[11px] text-emerald-600 font-medium">Active on candidate portal</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Rejected Postings</span>
            <HiOutlineXMark className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-foreground">{rejectedCount}</div>
          <p className="text-[11px] text-rose-600 font-medium">Returned to facility</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Requirements</span>
            <HiOutlineBriefcase className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{approvals.length}</div>
          <p className="text-[11px] text-muted-foreground">Hospital postings</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden min-w-0 w-full">
        {/* Controls Bar */}
        <div className="p-3.5 sm:p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
          {/* Segmented Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-border/40 w-fit">
            {[
              { id: "pending" as const, label: "Pending Approval", count: pendingCount },
              { id: "approved" as const, label: "Live / Published", count: approvedCount },
              { id: "rejected" as const, label: "Rejected", count: rejectedCount },
              { id: "all" as const, label: "All Postings", count: approvals.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5",
                  filter === tab.id
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                    filter === tab.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search role, hospital, city..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-muted/30 focus:bg-card text-xs font-medium outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
              >
                <HiOutlineXMark className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Data Table */}
        <div className="hidden md:block overflow-x-auto w-full min-w-0">
          <Table className="min-w-[820px] w-full">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 pl-5 h-11 align-middle">
                  Requirement Title
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 h-11 align-middle">
                  Hiring Institution
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 h-11 align-middle">
                  Compensation & Openings
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 h-11 align-middle">
                  Type & Experience
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 h-11 align-middle">
                  Status
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 pr-5 text-right h-11 align-middle">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-b border-border/70">
                  {/* Title & Department */}
                  <TableCell className="py-3.5 pl-5 align-middle">
                    <div className="flex items-center gap-3">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-xs shrink-0 shadow-2xs">
                        <HiOutlineBriefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <div
                          onClick={() => { setSelectedJob(item); setSheetOpen(true); }}
                          className="font-bold text-foreground text-sm hover:text-primary transition-colors cursor-pointer"
                        >
                          {item.title}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="font-medium text-foreground/80">{item.dept}</span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span>{item.expOrHours}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Hospital */}
                  <TableCell className="py-3.5 align-middle">
                    <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <HiOutlineBuildingOffice2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{item.org}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <HiOutlineMapPin className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                      <span>{item.city}</span>
                    </div>
                  </TableCell>

                  {/* Compensation */}
                  <TableCell className="py-3.5 align-middle">
                    <div className="font-bold text-foreground font-mono text-xs">{item.compensation}</div>
                    <div className="text-[11px] text-primary font-semibold mt-0.5">{item.openings} Open Positions</div>
                  </TableCell>

                  {/* Type */}
                  <TableCell className="py-3.5 align-middle">
                    <div className="flex flex-col gap-1 items-start">
                      <span className={cn(
                        "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                        item.type === "shift"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-muted text-foreground border-border"
                      )}>
                        {item.type === "shift" ? "Locum Shift" : "Permanent Role"}
                      </span>
                      {item.internship && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                          Internship
                        </span>
                      )}
                    </div>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="py-3.5 align-middle">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                        item.status === "approved"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                          : item.status === "rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                          : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                      )}
                    >
                      <span
                        className={cn(
                          "h-1.5 w-1.5 rounded-full",
                          item.status === "approved"
                            ? "bg-emerald-500"
                            : item.status === "rejected"
                            ? "bg-rose-500"
                            : "bg-amber-500"
                        )}
                      />
                      {item.status === "approved"
                        ? "Live / Published"
                        : item.status === "rejected"
                        ? "Rejected"
                        : "Pending Approval"}
                    </span>
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 pr-5 text-right align-middle">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedJob(item);
                          setSheetOpen(true);
                        }}
                        className="text-xs font-bold gap-1.5 h-8 px-2.5 rounded-lg border-border hover:bg-muted cursor-pointer"
                      >
                        <HiOutlineEye className="h-3.5 w-3.5" />
                        <span>Inspect</span>
                      </Button>

                      {item.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprove(item.id, item.title)}
                            className="text-xs font-bold gap-1.5 h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs cursor-pointer"
                          >
                            <HiCheck className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>Approve & Live</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedJob(item);
                              setRejectModalOpen(true);
                            }}
                            className="text-xs font-bold gap-1.5 h-8 px-2.5 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 hover:border-rose-300 cursor-pointer"
                          >
                            <HiOutlineXMark className="h-3.5 w-3.5 stroke-[2.5]" />
                            <span>Reject</span>
                          </Button>
                        </>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-xs text-muted-foreground align-middle">
                    <HiOutlineDocumentCheck className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    No posting requirements found in this view.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards View (visible on mobile, hidden on md+) */}
        <div className="md:hidden p-3.5 sm:p-4 space-y-4 bg-muted/20">
          {filtered.map((item) => (
            <div
              key={`m-post-${item.id}`}
              className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-3.5 shadow-2xs transition-all overflow-hidden min-w-0"
            >
              {/* Status, Type & Timestamp */}
              <div className="flex items-center justify-between gap-x-2 gap-y-1.5 flex-wrap min-w-0">
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  {item.status === "approved" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap shrink-0">
                      <HiOutlineCheckBadge className="h-3 w-3" /> Published
                    </span>
                  ) : item.status === "rejected" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-700 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap shrink-0">
                      <HiOutlineXMark className="h-3 w-3" /> Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20 whitespace-nowrap shrink-0">
                      Pending
                    </span>
                  )}

                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap shrink-0",
                    item.type === "shift"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-muted text-foreground border-border"
                  )}>
                    {item.type === "shift" ? "Shift" : "Permanent"}
                  </span>
                </div>

                <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 whitespace-nowrap shrink-0 ml-auto">
                  <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                  <span>{item.submittedDate}</span>
                </span>
              </div>

              {/* Requirement Header */}
              <div className="space-y-1 min-w-0">
                <h4
                  onClick={() => { setSelectedJob(item); setSheetOpen(true); }}
                  className="font-bold text-foreground text-sm leading-snug cursor-pointer hover:text-primary transition-colors"
                >
                  {item.title}
                </h4>
                <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-foreground/80">{item.dept}</span>
                  <span className="text-muted-foreground/40 font-bold select-none">·</span>
                  <span>{item.expOrHours}</span>
                </div>
              </div>

              {/* Institution Card Box */}
              <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-2 min-w-0">
                <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Hiring Facility</div>
                <div className="font-bold text-foreground text-xs flex items-center gap-1.5 min-w-0">
                  <HiOutlineBuildingOffice2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{item.org}</span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-1.5 border-t border-border/40 text-[11px] text-muted-foreground min-w-0">
                  <div className="flex items-center gap-1 shrink-0">
                    <HiOutlineMapPin className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                    <span>{item.city}</span>
                  </div>
                  <div className="text-[11px] text-muted-foreground/80 truncate">
                    Posted by <span className="font-medium text-foreground">{item.postedBy}</span>
                  </div>
                </div>
              </div>

              {/* Compensation & Openings Box */}
              <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 text-xs space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Remuneration</span>
                  <span className="text-[11px] font-bold text-primary font-mono shrink-0">{item.openings} Open Positions</span>
                </div>
                <div className="text-sm font-bold text-foreground font-mono truncate">
                  {item.compensation}
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 pt-1 min-w-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSelectedJob(item); setSheetOpen(true); }}
                  className="flex-1 h-9 text-xs font-bold rounded-xl border-border hover:bg-muted text-foreground cursor-pointer"
                >
                  <HiOutlineEye className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
                  <span>Inspect</span>
                </Button>

                {item.status === "pending" && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(item.id, item.title)}
                      className="flex-1 h-9 text-xs font-bold rounded-xl bg-primary hover:bg-primary-hover text-white gap-1 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <HiCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Approve</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedJob(item);
                        setRejectModalOpen(true);
                      }}
                      className="h-9 px-3 text-xs font-bold rounded-xl text-rose-600 border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                    >
                      <HiOutlineXMark className="h-3.5 w-3.5" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-10 text-center text-xs text-muted-foreground">
              <HiOutlineDocumentCheck className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              No posting requirements found in this view.
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Inspection Sheet (Comprehensive Requirement Dossier) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col h-full max-h-screen overflow-hidden gap-0">
          <SheetHeader className="px-6 py-4.5 border-b border-border bg-card shrink-0 text-left">
            <div className="flex items-start justify-between gap-4 pr-10">
              <div className="flex items-start gap-3 min-w-0">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
                  <HiOutlineBriefcase className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <SheetTitle className="text-base font-extrabold text-foreground leading-snug">
                    Requirement & Shift Clinical Audit
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                    Screen wage floor, duty hours safety, and mandatory registrations
                  </SheetDescription>
                </div>
              </div>
              {selectedJob && (
                <span
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-bold border shrink-0 inline-flex items-center gap-1.5 mt-0.5 shadow-2xs",
                    selectedJob.status === "approved"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : selectedJob.status === "rejected"
                      ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  {selectedJob.status === "pending" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                  {selectedJob.status === "approved"
                    ? "Live / Published"
                    : selectedJob.status === "rejected"
                    ? "Posting Rejected"
                    : "Pending Approval"}
                </span>
              )}
            </div>
          </SheetHeader>

          {selectedJob && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-5">
              {/* 1. Job Requirement Overview */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-4 shadow-xs">
                <div className="flex items-start gap-4">
                  <div className="grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black text-xl shrink-0">
                    {selectedJob.org.split(" ").map(n => n[0]).slice(0, 2).join("")}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-foreground text-lg truncate">{selectedJob.title}</h3>
                      <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border border-primary/20">
                        {selectedJob.dept}
                      </span>
                      <span className="rounded-md bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border border-border">
                        {selectedJob.employmentType || (selectedJob.type === "shift" ? "Locum Shift" : "Full-Time")}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                      <HiOutlineBuildingOffice2 className="h-3.5 w-3.5 text-primary shrink-0" />
                      <strong className="text-foreground">{selectedJob.org}</strong>
                      <span>•</span>
                      <HiOutlineMapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{selectedJob.city}</span>
                    </div>

                    {/* Job Description */}
                    <div className="mt-3 pt-3 border-t border-border/60">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Clinical Scope & Responsibilities</span>
                      <p className="text-xs text-foreground/90 font-medium leading-relaxed bg-muted/30 p-3 rounded-xl border border-border/40">
                        {selectedJob.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Role Parameters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-border/60 text-xs">
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      {selectedJob.type === "shift" ? "Hourly Rate" : "Compensation"}
                    </span>
                    <strong className="text-foreground text-xs font-bold text-primary font-mono">{selectedJob.compensation}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      {selectedJob.type === "shift" ? "Shift Duration" : "Experience"}
                    </span>
                    <strong className="text-foreground text-xs font-bold flex items-center gap-1">
                      <HiOutlineClock className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{selectedJob.hours ? `${selectedJob.hours} Hours Duty` : (selectedJob.expOrHours || "1–3 yrs exp")}</span>
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      {selectedJob.type === "shift" ? "Slots & Capacity" : "Openings"}
                    </span>
                    <strong className="text-foreground text-xs font-bold">
                      {selectedJob.openings} {selectedJob.type === "shift" ? "Slots" : "Positions"}
                      {selectedJob.type === "shift" && (
                        <span className="text-[10px] text-muted-foreground font-normal ml-1">
                          ({selectedJob.slotsClaimed || 0} booked)
                        </span>
                      )}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                      {selectedJob.type === "shift" ? "Total Escrow Pay" : "Qualification"}
                    </span>
                    <strong className="text-foreground text-xs font-bold truncate block text-emerald-600">
                      {selectedJob.type === "shift" && selectedJob.salaryMax ? `₹${selectedJob.salaryMax.toLocaleString("en-IN")}` : selectedJob.qualificationRequired}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Dedicated Locum Shift Schedule, Hours & Floor Audit (When type === 'shift') */}
              {selectedJob.type === "shift" && (
                <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h4 className="font-extrabold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <HiOutlineClock className="h-4 w-4 text-primary" />
                      <span>Locum Shift Hours & Duty Window Audit</span>
                    </h4>
                    <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-primary text-primary-foreground shadow-2xs flex items-center gap-1">
                      <HiOutlineClock className="h-3.5 w-3.5" />
                      {selectedJob.hours || 8} Hours Continuous Duty
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Shift Start Time</span>
                      <div className="font-bold text-foreground text-xs">
                        {selectedJob.startAt
                          ? new Date(selectedJob.startAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Scheduled Upon Confirmation"}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Shift Handover (End)</span>
                      <div className="font-bold text-foreground text-xs">
                        {selectedJob.endAt
                          ? new Date(selectedJob.endAt).toLocaleString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "Duty Handover at End of Shift"}
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1 shadow-2xs">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Duty Duration</span>
                      <div className="font-mono text-sm font-black text-primary">
                        {selectedJob.hours || 8} Hours
                      </div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <HiCheck className="h-3.5 w-3.5 stroke-[2.5] shrink-0" />
                        <span>Max 12h Continuous Shift Cap OK</span>
                      </span>
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                    {selectedJob.urgent && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/20 font-bold text-xs">
                        <HiOutlineBolt className="h-3.5 w-3.5" />
                        <span>Urgent Priority Broadcast</span>
                      </span>
                    )}
                    {selectedJob.surgeLabel && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-500/20 font-bold text-xs">
                        <HiOutlineFire className="h-3.5 w-3.5" />
                        <span>{selectedJob.surgeLabel}</span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 font-bold text-xs">
                      <HiOutlineLockClosed className="h-3.5 w-3.5 shrink-0" />
                      <span>Escrow Reserve Locked: ₹{selectedJob.salaryMax ? (selectedJob.salaryMax * (selectedJob.openings || 1)).toLocaleString("en-IN") : "Guaranteed"}</span>
                    </span>
                  </div>

                  {/* Floor Guidelines / Duty Notes */}
                  {selectedJob.dutyNotes && (
                    <div className="p-3 rounded-xl bg-card border border-border/70 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Hospital Floor Duty Instructions</span>
                      <p className="text-xs text-foreground/90 font-medium leading-relaxed bg-muted/20 p-2.5 rounded-lg border border-border/50">
                        {selectedJob.dutyNotes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* 2. Statutory Wage Floor & Safety Standards */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3.5 shadow-xs">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <HiOutlineCurrencyRupee className="h-4 w-4 text-primary" />
                  <span>Statutory Wage Floor & Duty Hours Audit</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Remuneration Package</span>
                    <div className="font-mono text-xs font-bold text-foreground">{selectedJob.compensation}</div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
                      Satisfies State Clinical Minimum Wage Guidelines
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Shift & Duty Safety</span>
                    <div className="font-mono text-xs font-bold text-primary">
                      {selectedJob.hours ? `${selectedJob.hours} Hours Continuous Duty` : "Standard Clinical Roster"}
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
                      Complies with Maximum 12-Hour Continuous Shift Cap
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Statutory Compliance Checklist */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3.5 shadow-xs">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <HiOutlineShieldCheck className="h-4 w-4 text-primary" />
                  <span>Statutory Gatekeeping Checklist</span>
                </h4>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                      <HiCheck className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span className="text-foreground/90 font-medium">Hiring hospital institution verified with active CEA accreditation on FALE RMS</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                      <HiCheck className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span className="text-foreground/90 font-medium">Mandatory Council registration criteria (NMC / State Nursing / Allied Council) enforced</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                      <HiCheck className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span className="text-foreground/90 font-medium">Duty hours adhere to statutory clinical rest cycles and occupational safety standards</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="grid h-4 w-4 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                      <HiCheck className="h-3 w-3 stroke-[3]" />
                    </div>
                    <span className="text-foreground/90 font-medium">Salary or hourly wage satisfies minimum clinical wage regulations</span>
                  </div>
                </div>
              </div>

              {/* 4. Audit Trail */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3 shadow-xs">
                <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <HiOutlineClock className="h-4 w-4 text-primary" />
                  <span>Requirement Audit Trail</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Submission Date</span>
                    <span className="font-medium text-foreground">{selectedJob.submittedDate}</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Publishing Jurisdiction</span>
                    <span className="font-bold text-foreground">{selectedJob.city}, Tamil Nadu</span>
                  </div>
                </div>

                {selectedJob.notes && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
                    <strong className="block font-bold mb-0.5">Moderation Reason:</strong>
                    {selectedJob.notes}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sticky Bottom Actions */}
          {selectedJob && (
            <div className="p-3.5 sm:p-4 border-t border-border bg-card flex flex-wrap items-center justify-end gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setSheetOpen(false)} className="rounded-xl">
                Close
              </Button>
              {selectedJob.status === "pending" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectModalOpen(true)}
                    className="text-rose-600 border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold rounded-xl"
                  >
                    Reject Posting
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(selectedJob.id, selectedJob.title)}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold gap-1 rounded-xl shadow-none"
                  >
                    <HiCheck className="h-3.5 w-3.5" /> Approve & Publish Live
                  </Button>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Requirement Posting</DialogTitle>
            <DialogDescription>
              State the reason why the hospital requirement cannot be published.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-foreground block">
              Rejection Reason <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Salary floor below clinical minimum wage for critical care nurses. Please update."
              className="w-full rounded-xl border border-border bg-muted/40 p-3 text-xs outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} className="font-bold text-xs">
              Reject Posting
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
