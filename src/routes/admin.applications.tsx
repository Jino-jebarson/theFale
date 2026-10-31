import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  HiOutlineUserGroup,
  HiOutlineCheckBadge,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiCheck,
  HiOutlineEye,
  HiOutlinePaperAirplane,
  HiOutlineSparkles,
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
import { useApp, setState, AdminApplication } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/applications")({
  head: () => ({
    meta: [
      { title: "Application Screening & Shortlisting — FALE RMS" },
      { name: "description", content: "Screen candidate applications, evaluate clinical credentials, and shortlist for hospitals." },
    ],
  }),
  component: ApplicationsAdmin,
});

export function ApplicationsAdmin() {
  const s = useApp();
  const [filter, setFilter] = useState<"all" | "pending_admin" | "shortlisted" | "rejected">("pending_admin");
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<AdminApplication | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const apps = s.adminApplications;

  const filtered = apps.filter((a) => {
    const matchesFilter = filter === "all" ? true : a.status === filter;
    const matchesSearch =
      a.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      a.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      a.hospitalName.toLowerCase().includes(search.toLowerCase()) ||
      a.candidateRole.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleShortlist = (id: string, candidateName: string, hospitalName: string) => {
    setState((state) => ({
      adminApplications: state.adminApplications.map((a) =>
        a.id === id ? { ...a, status: "shortlisted" as const } : a
      ),
    }));
    toast.success("Candidate Shortlisted & Dispatched!", {
      description: `${candidateName} has been vetted by Admin and forwarded to ${hospitalName}'s hiring board.`,
    });
    setSheetOpen(false);
  };

  const handleRejectConfirm = () => {
    if (!selectedApp) return;
    setState((state) => ({
      adminApplications: state.adminApplications.map((a) =>
        a.id === selectedApp.id ? { ...a, status: "rejected" as const } : a
      ),
    }));
    toast.error("Application Rejected", {
      description: `Candidate marked ineligible for ${selectedApp.jobTitle}: ${rejectReason || "Criteria mismatch."}`,
    });
    setRejectModalOpen(false);
    setSheetOpen(false);
    setRejectReason("");
  };

  const pendingCount = apps.filter((a) => a.status === "pending_admin").length;
  const shortlistedCount = apps.filter((a) => a.status === "shortlisted").length;

  return (
    <AdminLayout
      title="Candidate Application Screening & Shortlisting"
      subtitle="Strict Admin gatekeeping: when healthcare professionals apply, applications arrive at Admin first. Admin screens credentials, registration, and clinical fit before dispatching to hospitals."
      actions={
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground bg-muted/60 border border-border/60 px-3 py-1.5 rounded-xl">
            <strong className="text-foreground">{pendingCount}</strong> Pending · <strong className="text-foreground">{shortlistedCount}</strong> Shortlisted
          </span>
        </div>
      }
    >
      {/* Consolidated Applications Management Card */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden min-w-0 w-full">
        {/* Streamlined Filter & Search Toolbar */}
        <div className="p-3 sm:p-4 border-b border-border/80 bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          {/* Segment Filter Tabs */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/40 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-w-full">
            {[
              { id: "pending_admin", label: "Pending Screening", count: pendingCount },
              { id: "shortlisted", label: "Shortlisted", count: shortlistedCount },
              { id: "rejected", label: "Ineligible" },
              { id: "all", label: "All Applications" },
            ].map((tab) => {
              const active = filter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id as typeof filter)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer",
                    active
                      ? "bg-card text-foreground shadow-2xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/40"
                  )}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-black leading-tight",
                        active
                          ? "bg-primary/10 text-primary"
                          : "bg-muted-foreground/15 text-muted-foreground"
                      )}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-72 sm:shrink-0">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidate, role, hospital…"
              className="h-9 w-full rounded-xl border border-border/80 bg-background/80 pl-9 pr-8 text-xs outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:bg-background focus:ring-2 focus:ring-primary/20"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
              >
                <HiOutlineXMark className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Desktop Table View (>= md) */}
        <div className="hidden md:block overflow-x-auto">
          <Table className="min-w-[820px] w-full">
            <TableHeader className="bg-muted/40 border-b border-border/80">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 pl-5">
                  Candidate
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">
                  Target Position & Hospital
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">
                  Council Reg Status
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">
                  Clinical Match
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3">
                  Status
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3 pr-5 text-right">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="text-xs hover:bg-muted/30 transition-colors border-b border-border/50">
                  {/* Candidate */}
                  <TableCell className="py-3.5 pl-5 font-semibold text-foreground">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs shrink-0 border border-primary/20">
                        {item.candidateName.split(" ").map((x) => x[0]).slice(0, 2).join("")}
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-sm">{item.candidateName}</div>
                        <div className="text-[11px] text-muted-foreground">{item.candidateRole} · {item.candidateCity}</div>
                      </div>
                    </div>
                  </TableCell>

                  {/* Position & Hospital */}
                  <TableCell className="py-3.5">
                    <div className="font-bold text-foreground text-xs">{item.jobTitle}</div>
                    <div className="text-[11px] text-primary font-semibold mt-0.5">{item.hospitalName}</div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">{item.appliedDate}</div>
                  </TableCell>

                  {/* Council Reg */}
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5">
                      {item.councilVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                          <HiOutlineCheckBadge className="h-3.5 w-3.5" /> Verified
                        </span>
                      ) : (
                        <span className="text-amber-600 text-xs font-semibold">Unverified</span>
                      )}
                    </div>
                    <div className="font-mono text-muted-foreground text-[11px] mt-0.5">{item.regNumber}</div>
                  </TableCell>

                  {/* Match Score */}
                  <TableCell className="py-3.5">
                    <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <HiOutlineSparkles className="h-3.5 w-3.5" /> {item.matchScore}%
                    </span>
                  </TableCell>

                  {/* Status Badge */}
                  <TableCell className="py-3.5">
                    {item.status === "shortlisted" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary border border-primary/20">
                        <HiOutlinePaperAirplane className="h-3 w-3" /> Dispatched
                      </span>
                    ) : item.status === "rejected" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20">
                        <HiOutlineXMark className="h-3 w-3" /> Ineligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary border border-primary/20">
                        Screening Needed
                      </span>
                    )}
                  </TableCell>

                  {/* Actions */}
                  <TableCell className="py-3.5 pr-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedApp(item);
                          setSheetOpen(true);
                        }}
                        className="h-8 px-3 text-xs font-bold rounded-xl border-border/80 hover:bg-muted"
                      >
                        <HiOutlineEye className="h-3.5 w-3.5 mr-1" /> Dossier
                      </Button>

                      {item.status === "pending_admin" && (
                        <Button
                          size="sm"
                          onClick={() => handleShortlist(item.id, item.candidateName, item.hospitalName)}
                          className="h-8 px-3 text-xs font-bold rounded-xl bg-primary hover:bg-primary-hover text-white gap-1.5 shadow-none"
                        >
                          <HiOutlinePaperAirplane className="h-3.5 w-3.5" /> Shortlist
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-xs text-muted-foreground">
                    <HiOutlineUserGroup className="h-9 w-9 mx-auto text-muted-foreground/40 mb-2" />
                    No candidate applications match this filter or search.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View (< md): High-End Responsive Cards with Generous Spacing */}
        <div className="md:hidden p-3.5 sm:p-4 space-y-4 bg-muted/20">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3.5 overflow-hidden min-w-0"
            >
              {/* Header: Candidate Info + Match Score */}
              <div className="flex items-start justify-between gap-2.5 min-w-0">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-sm shrink-0 border border-primary/20">
                    {item.candidateName.split(" ").map((x) => x[0]).slice(0, 2).join("")}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-foreground text-sm leading-snug truncate">
                      {item.candidateName}
                    </h3>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.candidateRole} · {item.candidateCity}
                    </p>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-0.5 text-xs font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                  <HiOutlineSparkles className="h-3 w-3" /> {item.matchScore}%
                </span>
              </div>

              {/* Target Position & Hospital Card */}
              <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-1 min-w-0">
                <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                  Applied Position
                </div>
                <div className="font-bold text-foreground text-xs leading-snug truncate">
                  {item.jobTitle}
                </div>
                <div className="text-xs text-primary font-semibold truncate">
                  {item.hospitalName}
                </div>
                <div className="text-[10px] text-muted-foreground">
                  Applied on {item.appliedDate}
                </div>
              </div>

              {/* Structured Metadata: Council Registration & Status */}
              <div className="pt-2 border-t border-border/50 space-y-2 text-xs min-w-0">
                {/* Registration Row */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Council</span>
                  <div className="flex items-center gap-1.5 min-w-0 justify-end">
                    {item.councilVerified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">
                        <HiOutlineCheckBadge className="h-3.5 w-3.5" /> Verified
                      </span>
                    ) : (
                      <span className="text-amber-600 font-semibold text-xs shrink-0">Unverified</span>
                    )}
                    <span className="font-mono text-[11px] text-muted-foreground truncate">
                      ({item.regNumber})
                    </span>
                  </div>
                </div>

                {/* Status Row */}
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Status</span>
                  <div className="shrink-0">
                    {item.status === "shortlisted" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20 whitespace-nowrap">
                        <HiOutlinePaperAirplane className="h-3 w-3" /> Dispatched
                      </span>
                    ) : item.status === "rejected" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-600 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
                        <HiOutlineXMark className="h-3 w-3" /> Ineligible
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20 whitespace-nowrap">
                        Screening Needed
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons: 2-Column Symmetrical Touch Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 min-w-0">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedApp(item);
                    setSheetOpen(true);
                  }}
                  className={cn(
                    "h-9.5 px-2 text-xs font-bold rounded-xl border-border/80 hover:bg-muted text-foreground min-w-0 w-full shadow-none",
                    item.status !== "pending_admin" && "col-span-2"
                  )}
                >
                  <HiOutlineEye className="h-3.5 w-3.5 mr-1 text-muted-foreground shrink-0" />
                  <span className="truncate">Dossier</span>
                </Button>

                {item.status === "pending_admin" && (
                  <Button
                    size="sm"
                    onClick={() => handleShortlist(item.id, item.candidateName, item.hospitalName)}
                    className="h-9.5 px-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary-hover text-white gap-1 min-w-0 w-full shadow-none"
                  >
                    <HiOutlinePaperAirplane className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">Shortlist</span>
                  </Button>
                )}
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="p-8 text-center rounded-2xl border border-dashed border-border/80 bg-card">
              <HiOutlineUserGroup className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-xs text-muted-foreground">No candidate applications match this filter or search.</p>
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
                <HiOutlineUserGroup className="h-5 w-5 text-primary shrink-0" />
                <span>Candidate Clinical Dossier</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Screen practitioner credentials before dispatching to {selectedApp?.hospitalName}.
              </SheetDescription>
            </div>
          </SheetHeader>

          {selectedApp && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 space-y-3">
              <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-foreground text-sm">{selectedApp.candidateName}</h4>
                    <p className="text-xs text-muted-foreground">{selectedApp.candidateRole} · {selectedApp.candidateCity}</p>
                  </div>
                  <span className="font-black text-emerald-600 text-xs px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                    {selectedApp.matchScore}% Clinical Match
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
                  <div><span className="text-muted-foreground">Applied For:</span> <strong className="text-foreground">{selectedApp.jobTitle}</strong></div>
                  <div><span className="text-muted-foreground">Hospital:</span> <strong className="text-foreground">{selectedApp.hospitalName}</strong></div>
                  <div><span className="text-muted-foreground">Experience:</span> <strong className="text-foreground">{selectedApp.exp}</strong></div>
                  <div><span className="text-muted-foreground">Phone:</span> <strong className="text-foreground">{selectedApp.phone}</strong></div>
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4 space-y-2 shadow-none">
                <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">Clinical Verification Details</h5>
                <p className="text-xs text-foreground font-mono font-semibold">Council Reg: {selectedApp.regNumber}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{selectedApp.summary}</p>
              </div>
            </div>
          )}

          {/* Sticky Bottom Actions */}
          {selectedApp && (
            <div className="p-4 border-t border-border bg-card flex items-center justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setSheetOpen(false)}>
                Close
              </Button>
              {selectedApp.status === "pending_admin" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectModalOpen(true)}
                    className="text-rose-600 border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold"
                  >
                    Mark Ineligible
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleShortlist(selectedApp.id, selectedApp.candidateName, selectedApp.hospitalName)}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold gap-1"
                  >
                    <HiOutlinePaperAirplane className="h-3.5 w-3.5" /> Shortlist for Hospital
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
            <DialogTitle>Mark Application Ineligible</DialogTitle>
            <DialogDescription>
              State the reason why the candidate was not shortlisted for this role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-foreground block">
              Ineligibility Reason <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Specialty experience mismatch with ICU department requirement."
              className="w-full rounded-xl border border-border bg-muted/40 p-3 text-xs outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} className="font-bold text-xs">
              Confirm Ineligible
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
