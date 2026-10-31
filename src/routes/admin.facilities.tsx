import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  HiOutlineBuildingOffice2,
  HiOutlineShieldCheck,
  HiOutlineCheckBadge,
  HiOutlineXMark,
  HiOutlineMagnifyingGlass,
  HiOutlineDocumentText,
  HiOutlinePhone,
  HiCheck,
  HiOutlineEye,
  HiOutlineArrowPath,
  HiOutlineClock,
  HiOutlineMapPin,
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
import { useApp, setState, FacilityKYCItem } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/facilities")({
  head: () => ({
    meta: [
      { title: "Hospital Verification & Accreditation — FALE RMS" },
      { name: "description", content: "Audit hospital NABH, NABL accreditations and Clinical Establishment Act licenses." },
    ],
  }),
  component: FacilityKYCAdmin,
});

export function FacilityKYCAdmin() {
  const s = useApp();
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<FacilityKYCItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const facilities = s.facilityKYC;

  const filtered = facilities.filter((f) => {
    const matchesFilter = filter === "all" ? true : f.status === filter;
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.city.toLowerCase().includes(search.toLowerCase()) ||
      f.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
      f.nabhNumber.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleVerify = (id: string, name: string) => {
    setState((state) => ({
      facilityKYC: state.facilityKYC.map((f) =>
        f.id === id ? { ...f, status: "verified" as const } : f
      ),
    }));
    toast.success("Hospital Accredited & Verified!", {
      description: `${name} has been approved. They can now publish clinical openings on FALE.`,
    });
    setSheetOpen(false);
  };

  const handleRejectConfirm = () => {
    if (!selectedFacility) return;
    setState((state) => ({
      facilityKYC: state.facilityKYC.map((f) =>
        f.id === selectedFacility.id
          ? { ...f, status: "rejected" as const }
          : f
      ),
    }));
    toast.error("Hospital Verification Rejected", {
      description: `${selectedFacility.name} was rejected: ${rejectReason || "Insufficient documentation."}`,
    });
    setRejectModalOpen(false);
    setSheetOpen(false);
    setRejectReason("");
  };

  const pendingCount = facilities.filter((f) => f.status === "pending").length;
  const verifiedCount = facilities.filter((f) => f.status === "verified").length;
  const rejectedCount = facilities.filter((f) => f.status === "rejected").length;

  return (
    <AdminLayout
      title="Hospital & Facility Accreditation Verification"
      subtitle="Strict Admin gatekeeping: verify healthcare institutions against NABH / NABL standards and Clinical Establishment Act registrations."
      actions={
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground bg-muted/60 border border-border/60 px-3 py-1.5 rounded-xl">
            <strong className="text-foreground">{pendingCount}</strong> Pending · <strong className="text-foreground">{verifiedCount}</strong> Verified
          </span>
        </div>
      }
    >
      {/* Consolidated Facility Management Card */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden min-w-0 w-full">
        {/* Streamlined Filter & Search Toolbar */}
        <div className="p-3 sm:p-4 border-b border-border/80 bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          {/* Segment Filter Tabs */}
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-muted/60 border border-border/40 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-w-full">
            {[
              { id: "pending", label: "Pending Verification", count: pendingCount },
              { id: "verified", label: "Verified", count: verifiedCount },
              { id: "rejected", label: "Rejected", count: rejectedCount },
              { id: "all", label: "All Facilities", count: facilities.length },
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
              placeholder="Search hospital, city, NABH #…"
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
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5 pl-5">Hospital Network</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5">Location & Capacity</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5">Accreditation & License</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5">Authorized Contact</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5">Status</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3.5 pr-5 text-right w-48">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const initials = item.name.split(" ").map((x) => x[0]).slice(0, 2).join("");
                return (
                  <TableRow key={item.id} className="text-xs hover:bg-muted/30 transition-colors border-b border-border/40">
                    {/* Hospital */}
                    <TableCell className="py-3.5 pl-5">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs shrink-0 border border-primary/20">
                          {initials}
                        </div>
                        <div>
                          <div
                            onClick={() => { setSelectedFacility(item); setSheetOpen(true); }}
                            className="font-bold text-foreground text-sm hover:text-primary transition-colors cursor-pointer"
                          >
                            {item.name}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{item.type}</div>
                        </div>
                      </div>
                    </TableCell>

                    {/* Location & Beds */}
                    <TableCell className="py-3.5">
                      <div className="font-semibold text-foreground text-xs flex items-center gap-1">
                        <HiOutlineMapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>{item.city}, {item.state}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {item.beds} Inpatient Beds
                      </div>
                    </TableCell>

                    {/* Accreditation */}
                    <TableCell className="py-3.5">
                      <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                        <HiOutlineShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{item.accreditation}</span>
                      </div>
                      <div className="font-mono text-primary text-[11px] font-semibold mt-0.5">
                        NABH: {item.nabhNumber}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-mono">
                        CEA: {item.licenseNumber}
                      </div>
                    </TableCell>

                    {/* Authorized Contact */}
                    <TableCell className="py-3.5">
                      <div className="font-semibold text-foreground text-xs">{item.contactPerson}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <HiOutlinePhone className="h-3 w-3 text-muted-foreground/80 shrink-0" />
                        <span>{item.contactPhone}</span>
                      </div>
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
                          onClick={() => {
                            setSelectedFacility(item);
                            setSheetOpen(true);
                          }}
                          className="h-8 px-2.5 text-xs font-bold rounded-lg text-foreground hover:bg-muted"
                        >
                          <HiOutlineEye className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> View License
                        </Button>

                        {item.status === "pending" && (
                          <Button
                            size="sm"
                            onClick={() => handleVerify(item.id, item.name)}
                            className="h-8 px-3 text-xs font-bold rounded-lg bg-primary hover:bg-primary-hover text-white gap-1 transition-all active:scale-[0.98]"
                          >
                            <HiCheck className="h-3.5 w-3.5" /> Approve
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
                    <HiOutlineBuildingOffice2 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    No hospital facilities found in this view.
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
                key={`m-fac-${item.id}`}
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
                      Pending Verification
                    </span>
                  )}

                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1.5">
                    <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground/70" />
                    {item.submittedDate}
                  </span>
                </div>

                {/* Facility Header */}
                <div className="flex items-start gap-3.5 pt-0.5">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs shrink-0 border border-primary/20 mt-0.5">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      onClick={() => { setSelectedFacility(item); setSheetOpen(true); }}
                      className="font-bold text-foreground text-sm leading-snug cursor-pointer hover:text-primary transition-colors"
                    >
                      {item.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.type}</p>
                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-foreground/80">
                        <HiOutlineMapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {item.city}, {item.state}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span className="font-mono text-muted-foreground">{item.beds} Inpatient Beds</span>
                    </div>
                  </div>
                </div>

                {/* Accreditation & License Box */}
                <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Accreditation Level</span>
                    <span className="font-bold text-foreground text-xs">{item.accreditation}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40 font-mono text-[11px]">
                    <div>
                      <span className="text-muted-foreground text-[10px] block font-sans font-medium mb-0.5">NABH ID</span>
                      <span className="font-bold text-primary">{item.nabhNumber}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-muted-foreground text-[10px] block font-sans font-medium mb-0.5">CEA License</span>
                      <span className="font-semibold text-foreground">{item.licenseNumber}</span>
                    </div>
                  </div>
                </div>

                {/* Contact & Attached Certificate Card */}
                <div className="p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Authorized Contact</span>
                    <a href={`tel:${item.contactPhone}`} className="text-primary font-semibold hover:underline flex items-center gap-1 shrink-0">
                      <HiOutlinePhone className="h-3.5 w-3.5" /> {item.contactPhone}
                    </a>
                  </div>
                  <div className="font-semibold text-foreground text-xs leading-snug">
                    {item.contactPerson}
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/40">
                    <button
                      onClick={() => { setSelectedFacility(item); setSheetOpen(true); }}
                      className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline cursor-pointer truncate min-w-0"
                      title={item.docName}
                    >
                      <HiOutlineDocumentText className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.docName}</span>
                    </button>
                    <span className="text-[10px] text-muted-foreground shrink-0 font-medium">Certificate</span>
                  </div>
                </div>

                {/* Action Buttons Row */}
                <div className="flex items-center gap-2.5 pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSelectedFacility(item); setSheetOpen(true); }}
                    className={cn(
                      "h-10 text-xs font-bold rounded-xl border-border/80 hover:bg-muted shadow-none",
                      item.status === "pending" ? "flex-1" : "w-full"
                    )}
                  >
                    <HiOutlineEye className="h-4 w-4 mr-1.5 text-muted-foreground" /> View License
                  </Button>

                  {item.status === "pending" && (
                    <Button
                      size="sm"
                      onClick={() => handleVerify(item.id, item.name)}
                      className="flex-1 h-10 text-xs font-bold rounded-xl bg-primary hover:bg-primary-hover text-white gap-1.5 shadow-none transition-all active:scale-[0.98]"
                    >
                      <HiCheck className="h-4 w-4" /> Approve
                    </Button>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="p-10 text-center text-xs text-muted-foreground">
              <HiOutlineBuildingOffice2 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              No hospital facilities found in this view.
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
                <HiOutlineBuildingOffice2 className="h-5 w-5 text-primary shrink-0" />
                <span>Hospital Accreditation Audit</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                Audit healthcare establishment license and NABH / NABL compliance.
              </SheetDescription>
            </div>
          </SheetHeader>

          {selectedFacility && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 sm:p-4 space-y-3">
              <div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-foreground text-sm">{selectedFacility.name}</h4>
                    <p className="text-xs text-muted-foreground">{selectedFacility.type}</p>
                  </div>
                  {selectedFacility.status === "verified" && (
                    <span className="rounded-md bg-emerald-500/10 text-emerald-600 text-xs font-bold px-2 py-0.5 border border-emerald-500/20">
                      Verified Facility
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border/60">
                  <div><span className="text-muted-foreground">Location:</span> <strong className="text-foreground">{selectedFacility.city}, {selectedFacility.state}</strong></div>
                  <div><span className="text-muted-foreground">Beds:</span> <strong className="text-foreground">{selectedFacility.beds} Inpatient Beds</strong></div>
                  <div><span className="text-muted-foreground">Superintendent:</span> <strong className="text-foreground">{selectedFacility.contactPerson}</strong></div>
                  <div><span className="text-muted-foreground">Phone:</span> <strong className="text-foreground">{selectedFacility.contactPhone}</strong></div>
                </div>
              </div>

              <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-muted/20 p-4 sm:p-5 text-center space-y-2.5">
                <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
                  <HiOutlineShieldCheck className="h-4 w-4 shrink-0" />
                  <span className="truncate">Attached Certificate: {selectedFacility.docName}</span>
                </div>
                <p className="text-xs font-mono text-foreground font-bold break-all">
                  NABH #{selectedFacility.nabhNumber} · CEA #{selectedFacility.licenseNumber}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Accreditation level: {selectedFacility.accreditation}
                </p>
              </div>

              {/* Statutory Audit Checklist */}
              <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5">
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Statutory Audit Checklist
                </h5>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2.5">
                    <div className="grid h-4 w-4 place-items-center rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                      <HiCheck className="h-3 w-3" />
                    </div>
                    <span className="text-foreground/90">NABH Portal Accreditation active & validity confirmed</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="grid h-4 w-4 place-items-center rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                      <HiCheck className="h-3 w-3" />
                    </div>
                    <span className="text-foreground/90">Clinical Establishment Act license verified with State DHS</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="grid h-4 w-4 place-items-center rounded-full bg-primary/10 text-primary shrink-0 mt-0.5">
                      <HiCheck className="h-3 w-3" />
                    </div>
                    <span className="text-foreground/90">Hospital Superintendent / Authorized HR credential checked</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Actions */}
          {selectedFacility && (
            <div className="p-3.5 sm:p-4 border-t border-border bg-card flex flex-wrap items-center justify-end gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setSheetOpen(false)} className="rounded-xl">
                Close
              </Button>
              {selectedFacility.status === "pending" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectModalOpen(true)}
                    className="text-rose-600 border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold rounded-xl"
                  >
                    Reject Facility
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleVerify(selectedFacility.id, selectedFacility.name)}
                    className="bg-primary hover:bg-primary-hover text-white text-xs font-bold gap-1 rounded-xl shadow-none"
                  >
                    <HiCheck className="h-3.5 w-3.5" /> Approve & Issue Verified Badge
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
            <DialogTitle>Reject Hospital Verification</DialogTitle>
            <DialogDescription>
              State the reason why the hospital documents were insufficient.
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
              placeholder="e.g. Clinical Establishment Act license has lapsed. Please re-upload renewed certificate."
              className="w-full rounded-xl border border-border bg-muted/40 p-3 text-xs outline-none focus:ring-1 focus:ring-primary resize-none"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectConfirm} className="font-bold text-xs">
              Reject Facility
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
