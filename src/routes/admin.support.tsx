import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  HiOutlineTicket,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowPath,
  HiOutlineClock,
  HiOutlineCheckCircle,
  HiOutlineEnvelope,
  HiOutlineUser,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCheck,
  HiOutlineXMark,
  HiOutlineTag,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { toast } from "sonner";
import { BotMessageSquare } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { isApiEnabled } from "@/lib/api";
import {
  getAdminSupportTickets,
  updateAdminSupportTicketStatus,
  type AdminSupportTicketDto,
} from "@/lib/adapters/adminAdapter";
import { draftAllyHandoffWithAi } from "@/lib/adapters/aiAdapter";
import {
  type AllyAuditStatus,
  cleanMarkdownAndJsonNoise,
  extractJsonPayload,
  readSessionAuditCache,
  writeSessionAuditCache,
} from "@/lib/allyAuditUtils";

const ALLY_SUPPORT_CACHE_KEY = "fale_ally_support_precheck_cache_v1";

type AllyTicketPreCheckResult = {
  status: AllyAuditStatus;
  summary: string;
  draft: string;
};

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

  // Managing ticket drawer & Ally pre-check triage state
  const [selectedTicket, setSelectedTicket] = useState<AdminSupportTicketDto | null>(null);
  const [newStatus, setNewStatus] = useState<string>("OPEN");
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const getTicketCacheKey = useCallback((t: AdminSupportTicketDto) => {
    return `${t.id}:${t.status}:${t.subject || ""}:${(t.description || "").slice(0, 80)}`;
  }, []);

  const [allyPreChecks, setAllyPreChecks] = useState<Record<string, AllyTicketPreCheckResult>>(() =>
    readSessionAuditCache<AllyTicketPreCheckResult>(ALLY_SUPPORT_CACHE_KEY)
  );
  const [runningPreCheckIds, setRunningPreCheckIds] = useState<Record<string, boolean>>({});
  const inFlightKeysRef = useRef<Set<string>>(new Set());
  const autoCheckedKeysRef = useRef<Set<string>>(new Set());

  const getTicketAllyPreCheck = useCallback(
    (t: AdminSupportTicketDto): AllyTicketPreCheckResult => {
      const key = getTicketCacheKey(t);
      const cached = allyPreChecks[key] || allyPreChecks[t.id];
      if (cached) return cached;
      return {
        status: "PENDING",
        summary: "Ally support triage & reply draft queued for live evaluation.",
        draft: "",
      };
    },
    [allyPreChecks, getTicketCacheKey]
  );

  const handleRunAllyTicketPreCheck = useCallback(
    async (ticket: AdminSupportTicketDto, options?: { silent?: boolean }) => {
      const key = getTicketCacheKey(ticket);
      if (options?.silent && inFlightKeysRef.current.has(key)) return;

      inFlightKeysRef.current.add(key);
      setRunningPreCheckIds((prev) => ({ ...prev, [ticket.id]: true }));
      try {
        const promptInput = `[${ticket.category || "SUPPORT"}] ${ticket.subject || "Support Ticket"}${
          ticket.description ? ` — ${ticket.description}` : ""
        }`;
        const res = await draftAllyHandoffWithAi(promptInput);
        const rawText = res.response || res.content || "";
        const embeddedJson = extractJsonPayload(rawText);
        const sData: Record<string, any> = {
          ...(embeddedJson || {}),
          ...(res.structuredData || {}),
        };

        const rawDraft =
          typeof sData["whatsappDraft"] === "string"
            ? sData["whatsappDraft"]
            : typeof sData["draft"] === "string"
              ? sData["draft"]
              : typeof sData["reply"] === "string"
                ? sData["reply"]
                : embeddedJson
                  ? ""
                  : rawText;

        const cleanedDraft =
          (rawDraft || "")
            .replace(/```json\s*/gi, "")
            .replace(/```/g, "")
            .replace(/\*\*|__|~~/g, "")
            .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
            .trim() ||
          `Hello ${ticket.userName || "Doctor/Nurse"}, this is FALE Clinical Support regarding ticket #${ticket.id
            .slice(0, 8)
            .toUpperCase()} (${ticket.subject}). Our team has reviewed your request and is actively assisting you.`;

        const summary =
          cleanMarkdownAndJsonNoise(
            typeof sData["ticketSummary"] === "string"
              ? sData["ticketSummary"]
              : typeof sData["summary"] === "string"
                ? sData["summary"]
                : ""
          ) || `Triage & escalation draft ready for ${ticket.category || "Support"} (${ticket.userRole || "User"}).`;

        const entry: AllyTicketPreCheckResult = {
          status: "VERIFIED",
          summary,
          draft: cleanedDraft,
        };

        setAllyPreChecks((prev) => {
          const next = { ...prev, [key]: entry };
          writeSessionAuditCache(ALLY_SUPPORT_CACHE_KEY, next);
          return next;
        });

        if (!options?.silent) {
          toast.success("Ally triage & reply draft generated!");
        }
      } catch (err: any) {
        console.warn("Ally ticket pre-check failed:", err);
        const fallbackDraft = `Hi ${ticket.userName || "Doctor/Nurse"}, this is the FALE Clinical Support desk following up on ticket #${ticket.id
          .slice(0, 8)
          .toUpperCase()} regarding "${ticket.subject}". Our operations team is actively investigating and will update you shortly.`;

        setAllyPreChecks((prev) => ({
          ...prev,
          [key]: {
            status: "ERROR",
            summary: "Ally live triage service unreachable; fallback template prepared.",
            draft: fallbackDraft,
          },
        }));
        if (!options?.silent) {
          toast.error("Ally live service unavailable; fallback draft loaded");
        }
      } finally {
        inFlightKeysRef.current.delete(key);
        setRunningPreCheckIds((prev) => {
          const next = { ...prev };
          delete next[ticket.id];
          return next;
        });
      }
    },
    [getTicketCacheKey]
  );

  const renderAllyTicketBadge = (t: AdminSupportTicketDto) => {
    const check = getTicketAllyPreCheck(t);
    const isRunning = Boolean(runningPreCheckIds[t.id]);
    const isReady = check.status === "VERIFIED";
    const isError = check.status === "ERROR";

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none whitespace-nowrap shrink-0",
          isRunning || isReady
            ? "bg-primary/10 text-primary border-primary/25"
            : isError
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
              : "bg-muted/70 text-muted-foreground border-border/60"
        )}
      >
        {isRunning ? (
          <HiOutlineArrowPath className="h-2.5 w-2.5 animate-spin shrink-0" />
        ) : (
          <BotMessageSquare className="h-2.5 w-2.5 shrink-0" />
        )}
        {isRunning
          ? "Ally Triaging..."
          : isReady
            ? "Ally Reply Ready"
            : isError
              ? "Ally Retry"
              : "Ally Triage Queued"}
      </span>
    );
  };

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

  // Performance-safe background Ally triage pre-check for active tickets (MAX_CONCURRENT = 2)
  useEffect(() => {
    const queue = tickets.filter((t) => {
      const s = (t.status || "OPEN").toUpperCase();
      if (s !== "OPEN" && s !== "IN_PROGRESS") return false;
      const key = getTicketCacheKey(t);
      return !allyPreChecks[key] && !autoCheckedKeysRef.current.has(key) && !inFlightKeysRef.current.has(key);
    });
    if (queue.length === 0) return;

    let cancelled = false;
    let cursor = 0;
    const MAX_CONCURRENT = 2;

    const worker = async () => {
      while (!cancelled && cursor < queue.length) {
        const nextTicket = queue[cursor++];
        if (!nextTicket) break;
        const key = getTicketCacheKey(nextTicket);
        autoCheckedKeysRef.current.add(key);
        await handleRunAllyTicketPreCheck(nextTicket, { silent: true });
      }
    };

    const workers = Array.from({ length: Math.min(MAX_CONCURRENT, queue.length) }, () => worker());
    void Promise.all(workers);

    return () => {
      cancelled = true;
    };
  }, [tickets, allyPreChecks, getTicketCacheKey, handleRunAllyTicketPreCheck]);

  // Prioritize Ally triage immediately when Inspect drawer opens for a ticket
  useEffect(() => {
    if (!selectedTicket) return;
    const key = getTicketCacheKey(selectedTicket);
    if (!allyPreChecks[key] && !inFlightKeysRef.current.has(key)) {
      void handleRunAllyTicketPreCheck(selectedTicket, { silent: true });
    }
  }, [selectedTicket, allyPreChecks, getTicketCacheKey, handleRunAllyTicketPreCheck]);

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
      {/* Metric Strip (4 Cards matching Candidate KYC, Hospital Verification & Job Approvals) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Action Required</span>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-foreground">{counts.open}</div>
          <p className="text-[11px] text-muted-foreground">Awaiting first response</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>In Progress</span>
            <HiOutlineClock className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{counts.inProgress}</div>
          <p className="text-[11px] text-primary font-medium">Under clinical investigation</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Resolved &amp; Closed</span>
            <HiOutlineCheckCircle className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground">{counts.resolved + counts.closed}</div>
          <p className="text-[11px] text-emerald-600 font-medium">Closed &amp; SLA met</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Logged</span>
            <HiOutlineTicket className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{counts.all}</div>
          <p className="text-[11px] text-muted-foreground">All tickets in system</p>
        </div>
      </div>

      {/* Main Unified Table & Mobile Card Container */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden min-w-0 w-full">
        {/* Controls Bar */}
        <div className="p-3.5 sm:p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-muted/50 border border-border/40 w-full md:w-fit overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: "OPEN", label: "Open", count: counts.open },
              { id: "IN_PROGRESS", label: "In Progress", count: counts.inProgress },
              { id: "RESOLVED", label: "Resolved", count: counts.resolved },
              { id: "CLOSED", label: "Closed", count: counts.closed },
              { id: "ALL", label: "All Tickets", count: counts.all },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  "px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0",
                  statusFilter === tab.id
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                    statusFilter === tab.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                  )}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-80 shrink-0">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticket, name, subject..."
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-border bg-muted/30 focus:bg-card text-xs font-medium outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
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

        {/* Desktop Data Table (md+) */}
        <div className="hidden md:block overflow-x-auto w-full min-w-0">
          <Table className="min-w-[820px] w-full">
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 pl-5 h-11 align-middle">
                  Ticket ID
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 h-11 align-middle">
                  Requester
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 h-11 align-middle">
                  Category &amp; Subject
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 h-11 align-middle">
                  Status &amp; Ally Triage
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 h-11 align-middle">
                  Logged
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 pr-5 text-right h-11 align-middle">
                  Actions
                </TableHead>
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
                    <HiOutlineTicket className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    No support tickets found matching current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTickets.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/30 border-b border-border/70 transition-colors">
                    <TableCell className="py-3.5 pl-5 align-middle">
                      <div className="flex flex-col">
                        <span
                          onClick={() => handleOpenManageModal(t)}
                          className="font-mono text-xs font-black text-foreground hover:text-primary cursor-pointer transition-colors"
                        >
                          #{t.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[105px]">
                          {t.id}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 align-middle">
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-foreground">{t.userName || "Verified User"}</span>
                        <span className="text-[11px] text-muted-foreground">{t.userEmail || "No email"}</span>
                        <span className="text-[10px] font-semibold text-primary">{t.userRole || "User"}</span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 max-w-sm align-middle">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            {t.category || "General"}
                          </span>
                        </div>
                        <span
                          onClick={() => handleOpenManageModal(t)}
                          className="text-xs font-bold text-foreground hover:text-primary cursor-pointer mt-1 truncate"
                        >
                          {t.subject}
                        </span>
                        <span className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                          {t.description}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 align-middle">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(t.status)}
                        {renderAllyTicketBadge(t)}
                      </div>
                    </TableCell>

                    <TableCell className="py-3.5 text-xs text-muted-foreground whitespace-nowrap align-middle">
                      {formatRelativeTime(t.createdAt)}
                    </TableCell>

                    <TableCell className="py-3.5 pr-5 text-right align-middle">
                      <Button
                        size="sm"
                        onClick={() => handleOpenManageModal(t)}
                        className="rounded-lg text-xs font-bold h-8 px-3 bg-primary hover:bg-primary-hover text-white shadow-2xs cursor-pointer"
                      >
                        Inspect &amp; Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards View (< md) */}
        <div className="md:hidden p-3 sm:p-4 pb-24 sm:pb-4 space-y-3.5 bg-muted/20">
          {loading && tickets.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <HiOutlineArrowPath className="h-6 w-6 animate-spin mx-auto text-primary mb-2" />
              Loading support tickets from database…
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-10 text-center text-xs text-muted-foreground">
              <HiOutlineTicket className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              No support tickets found matching current filters.
            </div>
          ) : (
            filteredTickets.map((t) => (
              <div
                key={`m-ticket-${t.id}`}
                className="rounded-2xl border border-border/80 bg-card p-3.5 sm:p-5 space-y-3.5 shadow-2xs transition-all overflow-hidden min-w-0"
              >
                {/* Header Badges & Timestamp */}
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {getStatusBadge(t.status)}
                    {renderAllyTicketBadge(t)}
                  </div>
                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 whitespace-nowrap shrink-0 pt-0.5">
                    <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                    {formatRelativeTime(t.createdAt)}
                  </span>
                </div>

                {/* Ticket ID & Subject */}
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-[11px] font-black text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-md">
                      #{t.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {t.category || "General"}
                    </span>
                  </div>
                  <h4
                    onClick={() => handleOpenManageModal(t)}
                    className="font-bold text-foreground text-sm leading-snug cursor-pointer hover:text-primary transition-colors break-words"
                  >
                    {t.subject}
                  </h4>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed break-words">
                    {t.description}
                  </p>
                </div>

                {/* Requester Box */}
                <div className="p-3 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Requester</span>
                    <span className="text-[10px] font-bold text-primary">{t.userRole || "User"}</span>
                  </div>
                  <div className="font-bold text-foreground text-xs truncate">{t.userName || "Verified User"}</div>
                  <div className="text-[11px] text-muted-foreground truncate">{t.userEmail || "No email"}</div>
                </div>

                {/* Action Button */}
                <div className="pt-0.5">
                  <Button
                    size="sm"
                    onClick={() => handleOpenManageModal(t)}
                    className="w-full h-9 text-xs font-bold rounded-xl bg-primary hover:bg-primary-hover text-white gap-1.5 shadow-2xs cursor-pointer"
                  >
                    <HiOutlineTicket className="h-4 w-4 shrink-0" />
                    <span>Inspect &amp; Manage Ticket</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Slide-over Ticket Details & Resolution Drawer (Sheet) */}
      <Sheet open={Boolean(selectedTicket)} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col h-full max-h-[100dvh] overflow-hidden gap-0">
          <SheetHeader className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-border bg-card shrink-0 text-left">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-4 pr-8">
              <div className="flex items-start gap-3 min-w-0">
                <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
                  <HiOutlineTicket className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-mono font-black border border-primary/20">
                      #{selectedTicket?.id.slice(0, 8).toUpperCase()}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {selectedTicket?.category || "General"}
                    </span>
                  </div>
                  <SheetTitle className="text-sm sm:text-base font-extrabold text-foreground leading-snug mt-1 break-words">
                    {selectedTicket?.subject}
                  </SheetTitle>
                  <SheetDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    Logged {formatRelativeTime(selectedTicket?.createdAt)} by {selectedTicket?.userName} ({selectedTicket?.userRole})
                  </SheetDescription>
                </div>
              </div>
              {selectedTicket && (
                <div className="shrink-0 w-fit mt-0.5">
                  {getStatusBadge(selectedTicket.status)}
                </div>
              )}
            </div>
          </SheetHeader>

          {selectedTicket && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs">
              {/* 1. Requester Info Card */}
              <div className="rounded-2xl bg-muted/30 border border-border/70 p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                    <HiOutlineUser className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-foreground text-sm truncate">{selectedTicket.userName || "Verified User"}</p>
                    <p className="text-muted-foreground text-xs truncate">{selectedTicket.userEmail || "No email provided"}</p>
                    <p className="text-[11px] font-semibold text-primary mt-0.5">{selectedTicket.userRole || "User"}</p>
                  </div>
                </div>
                {selectedTicket.userEmail && (
                  <a
                    href={`mailto:${selectedTicket.userEmail}?subject=Re:%20[FALE%20Support%20#${selectedTicket.id.slice(0, 8).toUpperCase()}]%20${encodeURIComponent(selectedTicket.subject)}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-primary/25 bg-card text-primary hover:bg-primary/5 text-xs font-bold shadow-2xs transition-colors shrink-0"
                  >
                    <HiOutlineEnvelope className="h-3.5 w-3.5 shrink-0" />
                    <span>Email User</span>
                  </a>
                )}
              </div>

              {/* 2. Description */}
              <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 space-y-2 shadow-2xs">
                <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <HiOutlineChatBubbleLeftRight className="h-3.5 w-3.5 text-primary" />
                  <span>Description / Issue Details</span>
                </span>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-3 text-foreground whitespace-pre-wrap leading-relaxed break-words">
                  {selectedTicket.description}
                </div>
              </div>

              {/* 3. Ally Support Pre-Check & Reply Card */}
              {(() => {
                const check = getTicketAllyPreCheck(selectedTicket);
                const isRunning = Boolean(runningPreCheckIds[selectedTicket.id]);
                const isReady = check.status === "VERIFIED";
                const isError = check.status === "ERROR";

                return (
                  <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3.5 sm:p-5 space-y-3 transition-all shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary border border-primary/20 shrink-0">
                          {isRunning ? (
                            <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
                          ) : (
                            <BotMessageSquare className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-xs uppercase tracking-wider text-primary leading-snug">
                            Ally Ticket Pre-Check &amp; Reply
                          </h5>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {isRunning
                              ? "Triaging request & composing response..."
                              : check.summary}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded-full border inline-flex items-center gap-1 whitespace-nowrap",
                            isRunning || isReady
                              ? "bg-primary/10 text-primary border-primary/25"
                              : isError
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25"
                                : "bg-muted text-muted-foreground border-border/60"
                          )}
                        >
                          {isRunning
                            ? "Ally Triaging..."
                            : isReady
                              ? "Ally Draft Ready"
                              : isError
                                ? "Fallback Draft"
                                : "Ally Queued"}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={isRunning}
                          onClick={() => handleRunAllyTicketPreCheck(selectedTicket)}
                          className="h-7 px-2.5 text-[11px] font-bold rounded-lg gap-1.5 border-primary/30 text-primary hover:bg-primary/10 bg-background/80 cursor-pointer shrink-0"
                        >
                          {isRunning ? (
                            <HiOutlineArrowPath className="h-3 w-3 animate-spin shrink-0" />
                          ) : (
                            <BotMessageSquare className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span>{isRunning ? "Drafting with Ally..." : "Re-draft with Ally"}</span>
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-40 sm:max-h-48 overflow-y-auto pr-1.5 [scrollbar-width:thin] pt-2 border-t border-primary/15 space-y-2.5">
                      {check.draft ? (
                        <div className="rounded-xl border border-primary/15 bg-card/90 p-3 text-xs leading-relaxed text-foreground whitespace-pre-wrap break-words">
                          {check.draft}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Ally is queuing an automated support handoff response for this ticket. Click Re-draft with Ally at any time to refresh.
                        </p>
                      )}
                    </div>

                    {check.draft && (
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(check.draft);
                            toast.success("Ally response draft copied to clipboard!");
                          }}
                          className="text-xs font-bold h-8 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white cursor-pointer"
                        >
                          Copy Reply Draft
                        </Button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(check.draft)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-bold h-8 px-3 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 bg-background/80 transition-colors"
                        >
                          Open in WhatsApp ↗
                        </a>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* 4. Status Selector */}
              <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 space-y-2.5 shadow-2xs">
                <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <HiOutlineTag className="h-3.5 w-3.5 text-primary" />
                  <span>Update Ticket Status</span>
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: "OPEN", label: "Open" },
                    { id: "IN_PROGRESS", label: "In Progress" },
                    { id: "RESOLVED", label: "Resolved" },
                    { id: "CLOSED", label: "Closed" },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setNewStatus(item.id)}
                      className={cn(
                        "py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center",
                        newStatus === item.id
                          ? "bg-primary text-white border-primary shadow-xs"
                          : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Admin Resolution Notes */}
              <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 space-y-2 shadow-2xs">
                <span className="font-bold text-muted-foreground uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                  <HiOutlineSparkles className="h-3.5 w-3.5 text-primary" />
                  <span>Internal Admin Resolution Notes</span>
                </span>
                <textarea
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="E.g., Contacted candidate via phone. Resolved UTR query with Escrow bank partner."
                  className="w-full rounded-xl bg-muted/30 border border-border/80 p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
                />
              </div>
            </div>
          )}

          {/* Sticky Bottom Actions */}
          {selectedTicket && (
            <div className="p-3.5 sm:p-4 border-t border-border bg-card flex flex-wrap items-center justify-end gap-2 shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedTicket(null)}
                className="h-9 px-3 rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={saving}
                onClick={handleSaveStatus}
                className="flex-1 sm:flex-initial h-9 px-4 rounded-xl text-xs font-black bg-primary hover:bg-primary-hover text-white gap-1.5 shadow-xs cursor-pointer whitespace-nowrap"
              >
                {saving ? (
                  <HiOutlineArrowPath className="h-3.5 w-3.5 animate-spin shrink-0" />
                ) : (
                  <HiOutlineCheck className="h-3.5 w-3.5 shrink-0" />
                )}
                <span>{saving ? "Saving..." : "Save Changes"}</span>
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
}

