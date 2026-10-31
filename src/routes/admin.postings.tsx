import { useState } from "react";
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

export const Route = createFileRoute("/admin/postings")({
  head: () => ({
    meta: [
      { title: "Job & Shift Requirement Approvals — FALE RMS" },
      { name: "description", content: "Review and approve hospital healthcare jobs and locum shifts before candidate publication." },
    ],
  }),
  component: JobApprovalsAdmin,
});

export function JobApprovalsAdmin() {
  const s = useApp();
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<AdminJobApproval | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const approvals = s.jobApprovals;

  const filtered = approvals.filter((j) => {
    const matchesFilter = filter === "all" ? true : j.status === filter;
    const matchesSearch =
      j.title.toLowerCase().includes(search.toLowerCase()) ||
      j.org.toLowerCase().includes(search.toLowerCase()) ||
      j.dept.toLowerCase().includes(search.toLowerCase()) ||
      j.city.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleApprove = (id: string, title: string) => {
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

  const handleRejectConfirm = () => {
    if (!selectedJob) return;
    setState((state) => ({
      jobApprovals: state.jobApprovals.map((j) =>
        j.id === selectedJob.id ? { ...j, status: "rejected" as const } : j
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
      actions={
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground bg-muted/60 border border-border/60 px-3 py-1.5 rounded-xl">
            <strong className="text-foreground">{pendingCount}</strong> Pending · <strong className="text-foreground">{approvedCount}</strong> Live
          </span>
        </div>
      }
    >
      {/* Consolidated Postings Management Card */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden min-w-0 w-full">
        {/* Streamlined Filter & Search Toolbar */}
        <div className="p-3 sm:p-4 border-b border-border/80 bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          {/* Segment Filter Tabs */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/40 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-w-full">
            {[
              { id: "pending", label: "Pending Approval", count: pendingCount },
              { id: "approved", label: "Live / Published", count: approvedCount },
              { id: "rejected", label: "Rejected", count: rejectedCount },
              { id: "all", label: "All Postings", count: approvals.length },
            ].map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as typeof filter)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                    active
                      ? "bg-card text-foreground shadow-2xs border border-border/80 font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                  )}
                >
                  <span>{tab.label}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-bold leading-tight",
                      active
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Search */}
          <div className="relative w-full sm:w-72">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search role, hospital, city…"
              className="h-9 w-full rounded-xl border border-border/80 bg-background pl-9 pr-8 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
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

        {/* Desktop Data Table (hidden on mobile, visible on md+) */}
        <div className="hidden md:block overflow-x-auto w-full min-w-0">
          <Table className="min-w-[820px] w-full">
            <TableHeader className="bg-muted/20">
              <TableRow className="hover:bg-transparent border-b border-border/60">
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5 pl-5">Requirement Title</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5">Hiring Institution</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5">Compensation & Openings</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5">Type</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5 pr-5 text-right w-48">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="text-xs hover:bg-muted/30 transition-colors border-b border-border/40">
                  {/* Title & Department */}
                  <TableCell className="py-3.5 pl-5 font-semibold text-foreground">
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
                  </TableCell>

                  {/* Hospital */}
                  <TableCell className="py-3.5">
                    <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                      <HiOutlineBuildingOffice2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{item.org}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <HiOutlineMapPin className="h-3 w-3 text-muted-foreground/70 shrink-0" />
                      <span>{item.city}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>Posted by {item.postedBy}</span>
                    </div>
                  </TableCell>

                  {/* Compensation */}
                  <TableCell className="py-3.5">
                    <div className="font-bold text-foreground font-mono">{item.compensation}</div>
                    <div className="text-[11px] text-primary font-semibold mt-0.5">{item.openings} Vacancies</div>
                  </TableCell>

                  {/* Type */}
                  <TableCell className="py-3.5">
                    <span className={cn(
                      "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
                      item.type === "shift"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-secondary/10 text-secondary-foreground/90 border-border"
                    )}>
                      {item.type === "shift" ? "Locum Shift" : "Full-Time"}
                    </span>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="py-3.5">
                    {item.status === "approved" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                        <HiOutlineCheckBadge className="h-3.5 w-3.5" /> Published
                      </span>
                    ) : item.status === "rejected" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:text-rose-400 border border-rose-500/20">
                        <HiOutlineXMark className="h-3.5 w-3.5" /> Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary border border-primary/20">
                        Pending Admin
                      </span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 pr-5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedJob(item);
                          setSheetOpen(true);
                        }}
                        className="h-8 px-2.5 text-xs font-bold rounded-lg text-foreground hover:bg-muted"
                      >
                        <HiOutlineEye className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> Inspect
                      </Button>

                      {item.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleApprove(item.id, item.title)}
                          className="h-8 px-3 text-xs font-bold rounded-lg bg-primary hover:bg-primary-hover text-white gap-1 transition-all active:scale-[0.98]"
                        >
                          <HiCheck className="h-3.5 w-3.5" /> Approve & Go Live
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-xs text-muted-foreground">
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
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20 whitespace-nowrap shrink-0">
                      Pending
                    </span>
                  )}

                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap shrink-0",
                    item.type === "shift"
                      ? "bg-primary/10 text-primary border-primary/20"
                      : "bg-secondary/10 text-secondary-foreground/90 border-border"
                  )}>
                    {item.type === "shift" ? "Shift" : "Full-Time"}
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
              <div className="grid grid-cols-2 gap-2 pt-1 min-w-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => { setSelectedJob(item); setSheetOpen(true); }}
                  className={cn(
                    "h-9.5 px-2 text-xs font-bold rounded-xl border-border/80 hover:bg-muted text-foreground min-w-0 w-full shadow-none",
                    item.status !== "pending" && "col-span-2"
                  )}
                >
                  <HiOutlineEye className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
                  <span className="truncate">Inspect</span>
                </Button>

                {item.status === "pending" && (
                  <Button
                    size="sm"
                    onClick={() => handleApprove(item.id, item.title)}
                    className="h-9.5 px-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary-hover text-white gap-1 min-w-0 w-full shadow-none transition-all active:scale-[0.98]"
                  >
                    <HiCheck className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Approve & Live</span>
                  </Button>
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

      {/* Slide-over Inspection Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full max-h-screen overflow-hidden gap-0">
          <SheetHeader className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-border bg-card shrink-0 text-left">
            <div className="pr-8">
              <SheetTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                <HiOutlineDocumentCheck className="h-5 w-5 text-primary shrink-0" />
                <span>Job Requirement Audit</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Screen clinical responsibilities and salary fair-market compliance.
              </SheetDescription>
            </div>
          </SheetHeader>

          {selectedJob && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 space-y-3">
              <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-foreground text-sm">{selectedJob.title}</h4>
                    <p className="text-xs text-muted-foreground">{selectedJob.org} · {selectedJob.city}</p>
                  </div>
                  <span className="font-bold text-sm text-foreground">{selectedJob.compensation}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
                  <div><span className="text-muted-foreground">Department:</span> <strong className="text-foreground">{selectedJob.dept}</strong></div>
                  <div><span className="text-muted-foreground">Openings:</span> <strong className="text-foreground">{selectedJob.openings} Positions</strong></div>
                  <div><span className="text-muted-foreground">Type:</span> <strong className="text-foreground uppercase">{selectedJob.type}</strong></div>
                  <div><span className="text-muted-foreground">Required Exp:</span> <strong className="text-foreground">{selectedJob.expOrHours}</strong></div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5 shadow-none">
                <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Compliance Checklist</h5>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-foreground/90 font-medium">
                    <HiCheck className="h-4 w-4 text-primary shrink-0" />
                    <span>Hospital verified with active accreditation</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/90 font-medium">
                    <HiCheck className="h-4 w-4 text-primary shrink-0" />
                    <span>Duty hours comply with clinical shift caps</span>
                  </div>
                  <div className="flex items-center gap-2 text-foreground/90 font-medium">
                    <HiCheck className="h-4 w-4 text-primary shrink-0" />
                    <span>Remuneration satisfies state clinical standards</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Actions */}
          {selectedJob && (
            <div className="p-4 border-t border-border bg-card flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSheetOpen(false)}>
                Close
              </Button>
              {selectedJob.status === "pending" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectModalOpen(true)}
                    className="text-rose-600 border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold"
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApprove(selectedJob.id, selectedJob.title)}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold gap-1"
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
