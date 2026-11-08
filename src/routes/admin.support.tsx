import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  HiOutlineLifebuoy,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineExclamationCircle,
  HiOutlineEnvelope,
  HiOutlineUser,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineTag,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { isApiEnabled } from "@/lib/api";
import {
  getAdminSupportTickets,
  updateAdminSupportTicketStatus,
  type AdminSupportTicketDto,
} from "@/lib/adapters/adminAdapter";

export const Route = createFileRoute("/admin/support")({
  head: () => ({
    meta: [
      { title: "Help Desk & Support Tickets — FALE RMS Admin" },
      { name: "description", content: "Manage, track and resolve candidate and facility priority support tickets." },
    ],
  }),
  component: AdminSupportPage,
});

function formatRelativeTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "Recently";
  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return "Recently";
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffSec < 60) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function getStatusBadge(status?: string) {
  const s = (status || "OPEN").toUpperCase();
  switch (s) {
    case "OPEN":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
          Open
        </span>
      );
    case "IN_PROGRESS":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/30">
          <HiOutlineClock className="h-3 w-3" />
          In Progress
        </span>
      );
    case "RESOLVED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
          <HiOutlineCheckCircle className="h-3 w-3" />
          Resolved
        </span>
      );
    case "CLOSED":
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted text-muted-foreground border border-border">
          Closed
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-muted text-foreground border border-border">
          {status}
        </span>
      );
  }
}

export function AdminSupportPage() {
  const [tickets, setTickets] = useState<AdminSupportTicketDto[]>([]);
  const [loading, setLoading] = useState(isApiEnabled);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [search, setSearch] = useState<string>("");

  // Managing ticket modal
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicketDto | null>(null);
  const [newStatus, setNewStatus] = useState<string>("OPEN");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const loadTickets = async () => {
    if (!isApiEnabled) return;
    try {
      setLoading(true);
      const data = await getAdminSupportTickets();
      setTickets(data || []);
    } catch (err: any) {
      toast.error(err?.message || "Failed to fetch support tickets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const counts = useMemo(() => {
    return {
      all: tickets.length,
      open: tickets.filter((t) => t.status === "OPEN").length,
      inProgress: tickets.filter((t) => t.status === "IN_PROGRESS").length,
      resolved: tickets.filter((t) => t.status === "RESOLVED").length,
      closed: tickets.filter((t) => t.status === "CLOSED").length,
    };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchId = t.id.toLowerCase().includes(q);
        const matchSub = t.subject.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q);
        const matchCat = t.category?.toLowerCase().includes(q);
        const matchName = t.userName?.toLowerCase().includes(q);
        const matchEmail = t.userEmail?.toLowerCase().includes(q);
        if (!matchId && !matchSub && !matchDesc && !matchCat && !matchName && !matchEmail) {
          return false;
        }
      }
      return true;
    });
  }, [tickets, statusFilter, search]);

  const handleOpenManageModal = (ticket: AdminSupportTicketDto) => {
    setSelectedTicket(ticket);
    setNewStatus(ticket.status || "OPEN");
    setAdminNotes(ticket.adminNotes || "");
  };

  const handleSaveStatus = async () => {
    if (!selectedTicket) return;
    try {
      setSaving(true);
      const updated = await updateAdminSupportTicketStatus(selectedTicket.id, newStatus, adminNotes);
      toast.success(`Ticket #${selectedTicket.id.slice(0, 8).toUpperCase()} updated to ${newStatus}`);
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, ...updated, status: newStatus, adminNotes } : t))
      );
      setSelectedTicket(null);
    } catch (err: any) {
      toast.error(err?.message || "Failed to update ticket status");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Help Desk & Support Tickets"
      subtitle="Track, assign, and resolve healthcare clinician and hospital priority tickets."
      badge={
        <span className="rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold px-2.5 py-0.5">
          {counts.open} Open {counts.open === 1 ? "Ticket" : "Tickets"}
        </span>
      }
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={loadTickets}
          className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs hover:bg-muted"
        >
          <HiOutlineArrowPath className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          Refresh
        </Button>
      }
    >
      <div className="space-y-6">
        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">Total Logged</span>
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-primary/10 text-primary">
                <HiOutlineLifebuoy className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black font-mono text-foreground">{counts.all}</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">All tickets in system</p>
          </div>

          <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Action Required</span>
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300">
                <HiOutlineExclamationCircle className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black font-mono text-amber-900 dark:text-amber-300">
              {counts.open}
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80 mt-0.5">Awaiting first response</p>
          </div>

          <div className="rounded-2xl border border-blue-500/20 bg-blue-500/5 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-700 dark:text-blue-400">In Progress</span>
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-blue-500/20 text-blue-700 dark:text-blue-300">
                <HiOutlineClock className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black font-mono text-blue-900 dark:text-blue-300">
              {counts.inProgress}
            </div>
            <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80 mt-0.5">Under clinical investigation</p>
          </div>

          <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Resolved</span>
              <span className="grid h-7 w-7 place-items-center rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                <HiOutlineCheckCircle className="h-4 w-4" />
              </span>
            </div>
            <div className="mt-2 text-2xl font-black font-mono text-emerald-900 dark:text-emerald-300">
              {counts.resolved + counts.closed}
            </div>
            <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80 mt-0.5">Closed & SLA met</p>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
              {[
                { id: "ALL", label: `All (${counts.all})` },
                { id: "OPEN", label: `Open (${counts.open})` },
                { id: "IN_PROGRESS", label: `In Progress (${counts.inProgress})` },
                { id: "RESOLVED", label: `Resolved (${counts.resolved})` },
                { id: "CLOSED", label: `Closed (${counts.closed})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 cursor-pointer",
                    statusFilter === tab.id
                      ? "bg-primary text-white shadow-xs"
                      : "bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground border border-border/60"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72 shrink-0">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search ticket, name, subject…"
                className="w-full h-9 rounded-xl bg-muted/30 border border-border/80 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>
        </div>

        {/* Tickets Table */}
        <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b border-border/70">
                <TableHead className="text-xs font-bold text-foreground py-3">Ticket ID</TableHead>
                <TableHead className="text-xs font-bold text-foreground py-3">Requester</TableHead>
                <TableHead className="text-xs font-bold text-foreground py-3">Category & Subject</TableHead>
                <TableHead className="text-xs font-bold text-foreground py-3">Status</TableHead>
                <TableHead className="text-xs font-bold text-foreground py-3">Logged</TableHead>
                <TableHead className="text-xs font-bold text-foreground py-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && tickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                    <HiOutlineArrowPath className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
                    Loading support tickets from database…
                  </TableCell>
                </TableRow>
              ) : filteredTickets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                    <HiOutlineLifebuoy className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    No support tickets found matching current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/30 border-b border-border/50">
                    <TableCell className="py-3.5">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-black text-foreground">
                          #{t.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[100px]">
                          {t.id}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-foreground">{t.userName || "Verified User"}</span>
                        <span className="text-[11px] text-muted-foreground">{t.userEmail || "No email"}</span>
                        <span className="text-[10px] font-semibold text-primary">{t.userRole || "User"}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 max-w-sm">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {t.category || "General"}
                          </span>
                        </div>
                        <span className="text-xs font-bold text-foreground mt-1 truncate">{t.subject}</span>
                        <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {t.description}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5">{getStatusBadge(t.status)}</TableCell>

                    <TableCell className="py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(t.createdAt)}
                    </TableCell>

                    <TableCell className="py-3.5 text-right">
                      <Button
                        size="sm"
                        onClick={() => handleOpenManageModal(t)}
                        className="rounded-xl text-xs font-semibold h-8 bg-primary hover:bg-primary-hover text-white shadow-xs cursor-pointer"
                      >
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Ticket Details & Resolution Modal */}
      <Dialog open={Boolean(selectedTicket)} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-xl rounded-3xl p-6 border-border/80">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-xs font-mono font-black">
                #{selectedTicket?.id.slice(0, 8).toUpperCase()}
              </span>
              {getStatusBadge(selectedTicket?.status)}
            </div>
            <DialogTitle className="text-lg font-black text-foreground mt-2">
              {selectedTicket?.subject}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Logged {formatRelativeTime(selectedTicket?.createdAt)} by {selectedTicket?.userName} ({selectedTicket?.userRole})
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4 py-2 text-xs">
              {/* Requester Info Card */}
              <div className="rounded-2xl bg-muted/30 border border-border/70 p-3.5 flex items-center justify-between">
                <div>
                  <p className="font-bold text-foreground">{selectedTicket.userName || "Verified User"}</p>
                  <p className="text-muted-foreground">{selectedTicket.userEmail}</p>
                  <p className="text-[11px] font-semibold text-primary">{selectedTicket.userRole}</p>
                </div>
                {selectedTicket.userEmail && (
                  <a
                    href={`mailto:${selectedTicket.userEmail}?subject=Re:%20[FALE%20Support%20#${selectedTicket.id.slice(0, 8).toUpperCase()}]%20${encodeURIComponent(selectedTicket.subject)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-foreground hover:border-primary/50 text-xs font-semibold shadow-2xs transition-colors"
                  >
                    <HiOutlineEnvelope className="h-3.5 w-3.5 text-primary" />
                    Email User
                  </a>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                  Description / Issue Details
                </span>
                <div className="rounded-2xl border border-border/80 bg-card p-3 text-foreground whitespace-pre-wrap leading-relaxed">
                  {selectedTicket.description}
                </div>
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                  Update Ticket Status
                </span>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: "OPEN", label: "Open" },
                    { id: "IN_PROGRESS", label: "In Progress" },
                    { id: "RESOLVED", label: "Resolved" },
                    { id: "CLOSED", label: "Closed" },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setNewStatus(s.id)}
                      className={cn(
                        "py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                        newStatus === s.id
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Admin Resolution Notes */}
              <div className="space-y-1.5">
                <span className="font-bold text-foreground uppercase tracking-wider text-[10px]">
                  Internal Admin Resolution Notes
                </span>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="E.g., Contacted candidate via phone. Resolved UTR query with Escrow bank partner."
                  className="w-full rounded-2xl bg-muted/30 border border-border/80 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedTicket(null)}
              className="rounded-xl text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              disabled={saving}
              onClick={handleSaveStatus}
              className="rounded-xl text-xs font-black bg-primary hover:bg-primary-hover text-white shadow-xs cursor-pointer"
            >
              {saving ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

