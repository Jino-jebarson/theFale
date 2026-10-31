import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  HiOutlineIdentification,
  HiOutlineCheckBadge,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineDocumentText,
  HiOutlineArrowTopRightOnSquare,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineBuildingLibrary,
  HiCheck,
  HiOutlineShieldCheck,
  HiOutlineEye,
  HiOutlineArrowPath,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineArrowTrendingUp,
  HiOutlineAcademicCap,
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
  SheetFooter,
} from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useApp, setState, CandidateKYCItem } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/candidates")({
  head: () => ({
    meta: [
      { title: "Candidate KYC & Council Verification — FALE RMS" },
      { name: "description", content: "Audit and verify medical, nursing and paramedical registrations." },
    ],
  }),
  component: CandidateKYCAdmin,
});

export function CandidateKYCAdmin() {
  const s = useApp();
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateKYCItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const candidates = s.candidateKYC;

  const filtered = candidates.filter((c) => {
    const matchesFilter = filter === "all" ? true : c.status === filter;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.regNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.council.toLowerCase().includes(search.toLowerCase()) ||
      c.profession.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleVerify = (id: string, name: string) => {
    setState((state) => ({
      candidateKYC: state.candidateKYC.map((c) =>
        c.id === id ? { ...c, status: "verified" as const } : c
      ),
    }));
    toast.success("Candidate Verified!", {
      description: `${name}'s council registration approved with Verified Clinical Seal.`,
    });
    setSheetOpen(false);
  };

  const handleRejectConfirm = () => {
    if (!selectedCandidate) return;
    setState((state) => ({
      candidateKYC: state.candidateKYC.map((c) =>
        c.id === selectedCandidate.id
          ? { ...c, status: "rejected" as const, notes: rejectReason || "Document verification rejected by admin." }
          : c
      ),
    }));
    toast.error("Candidate Document Rejected", {
      description: `Notification sent to ${selectedCandidate.name} to upload valid council certificate.`,
    });
    setRejectModalOpen(false);
    setSheetOpen(false);
    setRejectReason("");
  };

  const pendingCount = candidates.filter((c) => c.status === "pending").length;
  const verifiedCount = candidates.filter((c) => c.status === "verified").length;
  const rejectedCount = candidates.filter((c) => c.status === "rejected").length;

  return (
    <AdminLayout
      title="Candidate Council KYC Verification"
      subtitle="Strict Admin gatekeeping: verify NMC, State Nursing, and Paramedical registrations before granting Verified Clinical Badges."
      actions={
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground bg-muted/60 border border-border/60 px-3 py-1.5 rounded-xl">
            <strong className="text-foreground">{pendingCount}</strong> Pending · <strong className="text-foreground">{verifiedCount}</strong> Verified
          </span>
        </div>
      }
    >
      {/* Consolidated Candidate Management Card */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden min-w-0 w-full">
        {/* Streamlined Filter & Search Toolbar */}
        <div className="p-3 sm:p-4 border-b border-border/80 bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          {/* Segment Filter Tabs */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/40 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-w-full">
            {[
              { id: "pending", label: "Pending Review", count: pendingCount },
              { id: "verified", label: "Verified", count: verifiedCount },
              { id: "rejected", label: "Rejected", count: rejectedCount },
              { id: "all", label: "All Candidates", count: candidates.length },
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
              placeholder="Filter by name, council, reg #…"
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
          <Table className="min-w-[780px] w-full">
            <TableHeader className="bg-muted/20">
              <TableRow className="hover:bg-transparent border-b border-border/60">
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5 pl-5">Candidate</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5">Profession & Degree</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5">Council & Reg Number</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5">Document</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5 pr-5 text-right w-44">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const initials = item.name.split(" ").map((x) => x[0]).slice(0, 2).join("");
                return (
                  <TableRow key={item.id} className="text-xs hover:bg-muted/30 transition-colors border-b border-border/40">
                    {/* Candidate */}
                    <TableCell className="py-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-xs shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div
                            onClick={() => { setSelectedCandidate(item); setSheetOpen(true); }}
                            className="font-bold text-foreground text-sm hover:text-primary transition-colors cursor-pointer"
                          >
                            {item.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span>{item.phone}</span>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span>{item.state}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Profession & Qualification */}
                    <TableCell className="py-3.5">
                      <div className="font-bold text-foreground text-xs">{item.profession}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{item.qualification}</div>
                    </TableCell>

                    {/* Council & Reg Number */}
                    <TableCell className="py-3.5">
                      <div className="font-semibold text-foreground text-xs">{item.council}</div>
                      <div className="font-mono text-primary font-bold text-[11px] mt-0.5">{item.regNumber}</div>
                    </TableCell>

                    {/* Document */}
                    <TableCell className="py-3.5">
                      <button
                        onClick={() => { setSelectedCandidate(item); setSheetOpen(true); }}
                        className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline cursor-pointer group"
                      >
                        <HiOutlineDocumentText className="h-4 w-4 shrink-0" />
                        <span className="truncate max-w-[140px]">{item.docName}</span>
                      </button>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{item.submittedDate}</div>
                    </TableCell>

                    {/* Status Badge */}
                    <TableCell className="py-3.5">
                      {item.status === "verified" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                          <HiOutlineCheckBadge className="h-3.5 w-3.5" /> Verified
                        </span>
                      ) : item.status === "rejected" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 dark:text-rose-400 border border-rose-500/20">
                          <HiOutlineXMark className="h-3.5 w-3.5" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary border border-primary/20">
                          Pending
                        </span>
                      )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => { setSelectedCandidate(item); setSheetOpen(true); }}
                          className="h-8 px-2.5 text-xs font-bold rounded-lg text-foreground hover:bg-muted"
                        >
                          <HiOutlineEye className="h-3.5 w-3.5 mr-1" /> Inspect
                        </Button>

                        {item.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleVerify(item.id, item.name)}
                            className="h-8 px-3 text-xs font-bold rounded-lg bg-primary hover:bg-primary-hover text-white gap-1 transition-all active:scale-[0.98]"
                          >
                            <HiCheck className="h-3.5 w-3.5" /> Verify
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-xs text-muted-foreground">
                    <HiOutlineIdentification className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    No candidates found in this view.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards View (visible on mobile, hidden on md+) */}
        <div className="md:hidden p-3.5 sm:p-4 space-y-4 bg-muted/20">
          {filtered.map((item) => {
            const initials = item.name.split(" ").map((x) => x[0]).slice(0, 2).join("");
            return (
              <div
                key={`m-cand-${item.id}`}
                className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 space-y-4 shadow-2xs transition-all"
              >
                {/* Status & Timestamp */}
                <div className="flex items-center justify-between gap-2">
                  {item.status === "verified" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <HiOutlineCheckBadge className="h-3.5 w-3.5" /> Verified
                    </span>
                  ) : item.status === "rejected" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 border border-rose-500/20">
                      <HiOutlineXMark className="h-3.5 w-3.5" /> Rejected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary border border-primary/20">
                      Pending
                    </span>
                  )}

                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                    <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground/70" />
                    {item.submittedDate}
                  </span>
                </div>

                {/* Candidate Info */}
                <div className="flex items-start gap-3.5 pt-0.5">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs shrink-0 mt-0.5">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      onClick={() => { setSelectedCandidate(item); setSheetOpen(true); }}
                      className="font-bold text-foreground text-sm leading-snug cursor-pointer hover:text-primary transition-colors"
                    >
                      {item.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-foreground/80">{item.profession}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>{item.state}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>{item.phone}</span>
                    </p>
                  </div>
                </div>

                {/* Council & Degree Card */}
                <div className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Council & Degree</div>
                    <div className="font-bold text-foreground text-xs mt-0.5 truncate">{item.council}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 truncate">{item.qualification}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Registration</div>
                    <div className="mt-0.5 font-mono text-primary font-bold text-xs">
                      {item.regNumber}
                    </div>
                  </div>
                </div>

                {/* Attached Document */}
                <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-muted/20 border border-border/40">
                  <button
                    onClick={() => { setSelectedCandidate(item); setSheetOpen(true); }}
                    className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline cursor-pointer truncate min-w-0"
                    title={item.docName}
                  >
                    <HiOutlineDocumentText className="h-4 w-4 shrink-0" />
                    <span className="truncate">{item.docName}</span>
                  </button>
                  <span className="text-[10px] text-muted-foreground shrink-0 font-medium">Attached PDF</span>
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center gap-2.5 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSelectedCandidate(item); setSheetOpen(true); }}
                    className={cn(
                      "h-10 text-xs font-bold rounded-xl border-border/80 hover:bg-muted shadow-none",
                      item.status === "pending" ? "flex-1" : "w-full"
                    )}
                  >
                    <HiOutlineEye className="h-4 w-4 mr-1.5 text-muted-foreground" /> Inspect
                  </Button>

                  {item.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => handleVerify(item.id, item.name)}
                      className="flex-1 h-10 text-xs font-bold rounded-xl bg-primary hover:bg-primary-hover text-white gap-1.5 shadow-none transition-all active:scale-[0.98]"
                    >
                      <HiCheck className="h-4 w-4" /> Verify
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <HiOutlineIdentification className="h-8 w-8 mx-auto text-muted-foreground/40 mb-1" />
              <p className="font-bold text-foreground">No candidates found</p>
              <p>Try adjusting your search criteria or filter status.</p>
            </div>
          )}
        </div>
      </div>


      {/* Slide-over Inspection Sheet (LinkedIn / Apple Style) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl p-0 flex flex-col h-full max-h-screen overflow-hidden gap-0">
          <SheetHeader className="px-4 py-3.5 sm:px-5 sm:py-4 border-b border-border bg-card shrink-0 text-left">
            <div className="flex items-center justify-between pr-8">
              <SheetTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
                <HiOutlineIdentification className="h-5 w-5 text-primary shrink-0" />
                <span>Clinical Credential Dossier</span>
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-muted-foreground mt-0.5">
              Government registry cross-check and certificate inspection.
            </SheetDescription>
          </SheetHeader>

          {selectedCandidate && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 space-y-3">
              {/* Candidate Overview */}
              <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-3 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-extrabold text-foreground text-sm truncate">{selectedCandidate.name}</h4>
                    <p className="text-xs text-muted-foreground truncate">{selectedCandidate.profession} · {selectedCandidate.experience}</p>
                  </div>
                  {selectedCandidate.status === "verified" ? (
                    <span className="rounded-md bg-emerald-500/10 text-emerald-600 text-xs font-bold px-2 py-0.5 border border-emerald-500/20 shrink-0">
                      Verified Seal Issued
                    </span>
                  ) : selectedCandidate.status === "rejected" ? (
                    <span className="rounded-md bg-rose-500/10 text-rose-600 text-xs font-bold px-2 py-0.5 border border-rose-500/20 shrink-0">
                      Rejected
                    </span>
                  ) : (
                    <span className="rounded-md bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 border border-primary/20 shrink-0">
                      Pending
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-2.5 border-t border-border/60">
                  <div className="min-w-0">
                    <span className="text-muted-foreground">Phone: </span>
                    <strong className="text-foreground">{selectedCandidate.phone}</strong>
                  </div>
                  <div className="min-w-0" title={selectedCandidate.email}>
                    <span className="text-muted-foreground">Email: </span>
                    <strong className="text-foreground break-all">{selectedCandidate.email}</strong>
                  </div>
                  <div className="min-w-0">
                    <span className="text-muted-foreground">Degree: </span>
                    <strong className="text-foreground">{selectedCandidate.qualification}</strong>
                  </div>
                  <div className="min-w-0">
                    <span className="text-muted-foreground">State: </span>
                    <strong className="text-foreground">{selectedCandidate.state}</strong>
                  </div>
                </div>
              </div>

              {/* State Council Card */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-2.5 shadow-none min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  State Council Registration
                </p>
                <p className="font-bold text-foreground text-sm leading-snug">{selectedCandidate.council}</p>
                <div className="rounded-xl bg-muted p-2.5 text-xs font-bold text-primary flex flex-wrap items-center justify-between gap-1.5">
                  <span className="font-mono break-all">REG #: {selectedCandidate.regNumber}</span>
                  <span className="text-[10px] text-muted-foreground font-sans">Active Registry</span>
                </div>
              </div>

              {/* Simulated Certificate Inspection Box */}
              <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-muted/20 p-4 sm:p-5 text-center space-y-2.5 min-w-0">
                <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
                  <HiOutlineShieldCheck className="h-4 w-4 shrink-0" />
                  <span className="truncate">Attached Document: {selectedCandidate.docName}</span>
                </div>
                <p className="text-xs text-muted-foreground break-words">
                  Digital Certificate Signature: <span className="font-mono text-foreground font-bold">SHA-256-NMC-88492</span>
                </p>
                <p className="text-[11px] text-muted-foreground italic break-words">
                  {selectedCandidate.notes}
                </p>
              </div>
            </div>
          )}

          {/* Sticky Bottom Actions */}
          {selectedCandidate && (
            <div className="p-4 border-t border-border bg-card flex items-center justify-end gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setSheetOpen(false)}>
                Close
              </Button>
              {selectedCandidate.status === "pending" && (
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
                    onClick={() => handleVerify(selectedCandidate.id, selectedCandidate.name)}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold gap-1"
                  >
                    <HiCheck className="h-3.5 w-3.5" /> Approve & Issue Seal
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
            <DialogTitle>Reject Candidate Document</DialogTitle>
            <DialogDescription>
              State the reason for rejection. The candidate will receive an immediate notification to re-upload.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <label className="text-xs font-semibold text-foreground block">
              Reason for Rejection <span className="text-destructive">*</span>
            </label>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Council registration certificate scan is blurry or renewal expired. Please upload renewed certificate."
              className="w-full rounded-xl border border-border bg-muted/40 p-3 text-xs outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} className="font-bold text-xs">
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
