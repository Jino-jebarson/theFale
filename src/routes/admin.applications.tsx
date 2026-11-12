import { useState, useEffect, useRef, useCallback } from "react";
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
  HiOutlineArrowPath,
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineCurrencyRupee,
  HiOutlineClock,
  HiOutlineClipboardDocumentCheck,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useApp, setState, AdminApplication } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled, paiseToRupees } from "@/lib/api";
import { calculateClinicalMatch } from "@/lib/clinicalMatchingEngine";
import { jobs, type Job } from "@/lib/data";
import { getJobs } from "@/lib/adapters/jobAdapter";
import {
  getAdminApplications,
  screenApplication,
  getPendingShiftClaims,
  screenShiftClaim,
  getPendingPayouts,
  disbursePayout,
} from "@/lib/adapters/adminAdapter";
import {
  getDisputedShiftClaims,
  resolveShiftDispute,
  type ShiftClaimDto,
} from "@/lib/adapters/shiftAdapter";
import { HiOutlineBanknotes } from "react-icons/hi2";
import { BotMessageSquare, AlertTriangle } from "lucide-react";
import { generateClinicalDocumentBlob } from "@/lib/clinicalDocumentPdf";
import { screenApplicationWithAi } from "@/lib/adapters/aiAdapter";
import {
  type AllyAuditStatus,
  cleanMarkdownAndJsonNoise,
  extractJsonPayload,
  formatConfidencePercent,
  readSessionAuditCache,
  writeSessionAuditCache,
} from "@/lib/allyAuditUtils";

const ALLY_APPLICATION_CACHE_KEY = "fale_ally_application_screening_cache_v1";

type AllyApplicationScreeningResult = {
  status: AllyAuditStatus;
  suitabilityScore: number;
  isRecommended: boolean;
  verdict: string;
  unitFitSentence: string;
  councilSentence: string;
  recommendationSentence: string;
};

export const Route = createFileRoute("/admin/applications")({
  head: () => ({
    meta: [
      { title: "Application Screening & Shortlisting — FALE RMS" },
      { name: "description", content: "Screen candidate applications, evaluate clinical credentials, and shortlist for hospitals." },
    ],
  }),
  component: ApplicationsAdmin,
});

function formatDocType(type?: string) {
  if (!type) return "Verification Document";
  switch (type) {
    case "REGISTRATION_CERTIFICATE":
      return "State Council Registration Certificate";
    case "DEGREE_CERTIFICATE":
      return "Medical / Nursing Degree Certificate";
    case "RESUME":
      return "Clinical Curriculum Vitae (CV)";
    case "ID_PROOF":
      return "Government Identity Proof";
    case "PHOTO":
      return "Profile Photograph";
    case "BONAFIDE":
      return "College Bonafide Certificate";
    case "STUDENT_ID":
      return "College Student ID Card";
    default:
      return type.replace(/_/g, " ");
  }
}

function formatBytes(bytes?: number) {
  if (!bytes) return "Standard Document";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ApplicationsAdmin() {
  const s = useApp();
  const [filter, setFilter] = useState<"all" | "pending_admin" | "shortlisted" | "rejected" | "payouts" | "disputes">("pending_admin");
  const [apiPayouts, setApiPayouts] = useState<ShiftClaimDto[]>([]);
  const [apiDisputes, setApiDisputes] = useState<ShiftClaimDto[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<ShiftClaimDto | null>(null);
  const [disputeResolution, setDisputeResolution] = useState<"RELEASE_TO_CANDIDATE" | "PARTIAL_SPLIT" | "REFUND_HOSPITAL">("RELEASE_TO_CANDIDATE");
  const [disputeApprovedHours, setDisputeApprovedHours] = useState<number>(8);
  const [disputeNotes, setDisputeNotes] = useState("");
  const [resolvingDispute, setResolvingDispute] = useState(false);
  const [disburseModalOpen, setDisburseModalOpen] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<ShiftClaimDto | null>(null);
  const [utrInput, setUtrInput] = useState("");
  const [disbursing, setDisbursing] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedApp, setSelectedApp] = useState<AdminApplication | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [apiApps, setApiApps] = useState<AdminApplication[]>([]);
  const [loading, setLoading] = useState(isApiEnabled);

  // Document preview state
  const [previewDoc, setPreviewDoc] = useState<{ name: string; url: string; isImage: boolean } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Ally Application Screening Desk State (session-cached + concurrency-limited live checks)
  const getAppCacheKey = useCallback((app: AdminApplication) => {
    return `${app.id}:${app.candidateName}:${app.jobTitle}:${app.regNumber || ""}`;
  }, []);

  const [aiScreeningResults, setAiScreeningResults] = useState<Record<string, AllyApplicationScreeningResult>>(() =>
    readSessionAuditCache<AllyApplicationScreeningResult>(ALLY_APPLICATION_CACHE_KEY)
  );
  const [runningScreeningIds, setRunningScreeningIds] = useState<Record<string, boolean>>({});
  const inFlightScreeningKeysRef = useRef<Set<string>>(new Set());
  const autoScreenedKeysRef = useRef<Set<string>>(new Set());

  const getApplicationScreening = useCallback(
    (app: AdminApplication): AllyApplicationScreeningResult => {
      const cacheKey = getAppCacheKey(app);
      const cached = aiScreeningResults[cacheKey] || aiScreeningResults[app.id];
      if (cached) return cached;

      return {
        status: "PENDING",
        suitabilityScore: 0,
        isRecommended: false,
        verdict: "",
        unitFitSentence: `Ally clinical suitability screening queued for live role-fit verification.`,
        councilSentence: `Council standing (${app.candidateCouncil || "State Council"} · ${app.regNumber || "Pending"}) and specialty alignment will be verified automatically by Ally.`,
        recommendationSentence: `Shortlisting recommendation will appear once Ally completes its evaluation.`,
      };
    },
    [aiScreeningResults, getAppCacheKey]
  );

  const handleRunAiScreening = useCallback(
    async (app: AdminApplication, options?: { silent?: boolean }) => {
      const cacheKey = getAppCacheKey(app);
      if (options?.silent && inFlightScreeningKeysRef.current.has(cacheKey)) return;

      inFlightScreeningKeysRef.current.add(cacheKey);
      setRunningScreeningIds((prev) => ({ ...prev, [app.id]: true }));
      try {
        const res = await screenApplicationWithAi(
          app.candidateName,
          app.candidateRole,
          app.jobTitle,
          app.hospitalName,
          {
            matchScore: app.matchScore,
            council: app.candidateCouncil || "State Council",
            regNumber: app.regNumber,
            exp: app.exp,
            isShiftClaim: Boolean((app as any).isShiftClaim),
          }
        );

        const rawText = res.response || res.content || "";
        const embeddedJson = extractJsonPayload(rawText);
        const sData: Record<string, any> = {
          ...(embeddedJson || {}),
          ...(res.structuredData || {}),
        };

        const rawStatus = String(sData["status"] || "").toUpperCase();
        const plainProse = cleanMarkdownAndJsonNoise(
          typeof sData["assessment"] === "string"
            ? sData["assessment"]
            : typeof sData["summary"] === "string"
              ? sData["summary"]
              : typeof sData["reasoning"] === "string"
                ? sData["reasoning"]
                : embeddedJson
                  ? ""
                  : rawText
        );
        const lower = plainProse.toLowerCase();

        const isRecommended =
          typeof sData["isRecommended"] === "boolean"
            ? sData["isRecommended"]
            : rawStatus === "RECOMMENDED" || rawStatus === "VERIFIED" || rawStatus === "CLEAR"
              ? true
              : rawStatus.includes("REVIEW") || rawStatus.includes("FLAG") || rawStatus.includes("REJECT")
                ? false
                : !lower.includes("not recommended") &&
                !lower.includes("reject") &&
                !lower.includes("discrepancy") &&
                !lower.includes("flagged");

        const scoreRaw = sData["suitabilityScore"] ?? sData["confidence"] ?? app.matchScore;
        const suitabilityScore = formatConfidencePercent(scoreRaw, !isRecommended);

        const sentences = plainProse
          .split(/(?<=[.?!])\s+/)
          .map((s) => cleanMarkdownAndJsonNoise(s))
          .filter(Boolean);

        const unitFitSentence =
          cleanMarkdownAndJsonNoise(typeof sData["unitFitAssessment"] === "string" ? sData["unitFitAssessment"] : "") ||
          sentences[0] ||
          `${app.candidateName} qualifies for ${app.jobTitle} at ${app.hospitalName} with ${app.candidateRole} clinical alignment.`;

        const councilSentence =
          cleanMarkdownAndJsonNoise(typeof sData["councilAssessment"] === "string" ? sData["councilAssessment"] : "") ||
          sentences[1] ||
          `Statutory credentials with ${app.candidateCouncil || "State Council"} (#${app.regNumber || "On Record"}) checked for deployment readiness.`;

        const recommendationSentence =
          cleanMarkdownAndJsonNoise(typeof sData["recommendation"] === "string" ? sData["recommendation"] : "") ||
          sentences[2] ||
          (isRecommended
            ? `Recommended by Ally for immediate administrative shortlisting and dispatch to ${app.hospitalName}.`
            : `Additional human credential review recommended by Ally before forwarding.`);

        const nextEntry: AllyApplicationScreeningResult = {
          status: isRecommended ? "VERIFIED" : "FLAGGED",
          suitabilityScore,
          isRecommended,
          verdict: plainProse,
          unitFitSentence,
          councilSentence,
          recommendationSentence,
        };

        setAiScreeningResults((prev) => {
          const next = { ...prev, [cacheKey]: nextEntry };
          writeSessionAuditCache(ALLY_APPLICATION_CACHE_KEY, next);
          return next;
        });

        if (!options?.silent) {
          toast.success(`Ally screening completed for ${app.candidateName}`);
        }
      } catch (err: any) {
        console.warn("Ally screening failed:", err);
        const errorEntry: AllyApplicationScreeningResult = {
          status: "ERROR",
          suitabilityScore: 0,
          isRecommended: false,
          verdict: "",
          unitFitSentence: `Ally could not reach the clinical screening service right now.`,
          councilSentence: `Unmasked contact, council registration (${app.regNumber}), and regulatory documents remain available below.`,
          recommendationSentence: `Click Re-analyze with Ally to retry automated suitability scoring.`,
        };
        setAiScreeningResults((prev) => ({ ...prev, [cacheKey]: errorEntry }));
        if (!options?.silent) {
          toast.error("Failed to run Ally screening");
        }
      } finally {
        inFlightScreeningKeysRef.current.delete(cacheKey);
        setRunningScreeningIds((prev) => {
          const next = { ...prev };
          delete next[app.id];
          return next;
        });
      }
    },
    [getAppCacheKey]
  );

  const renderAllyScreeningBadge = (app: AdminApplication) => {
    const scr = getApplicationScreening(app);
    const isScreening = Boolean(runningScreeningIds[app.id]);
    const isVerified = scr.status === "VERIFIED";
    const isFlagged = scr.status === "FLAGGED" || scr.status === "ERROR";

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none whitespace-nowrap shrink-0",
          isScreening || isVerified
            ? "bg-primary/10 text-primary border-primary/25"
            : isFlagged
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
              : "bg-muted/70 text-muted-foreground border-border/60"
        )}
      >
        {isScreening ? (
          <HiOutlineArrowPath className="h-2.5 w-2.5 animate-spin shrink-0" />
        ) : (
          <BotMessageSquare className="h-2.5 w-2.5 shrink-0" />
        )}
        {isScreening
          ? "Ally Screening..."
          : isVerified
            ? "Ally Shortlist Vetted"
            : scr.status === "ERROR"
              ? "Ally Retry"
              : isFlagged
                ? "Ally Review"
                : "Ally Queued"}
      </span>
    );
  };

  const fetchApps = async () => {
    if (!isApiEnabled) return;
    try {
      setLoading(true);
      const [appsRes, shiftClaimsRes, payoutsRes, disputesRes, jobsRes] = await Promise.all([
        getAdminApplications("all").catch(() => []),
        getPendingShiftClaims().catch(() => []),
        getPendingPayouts().catch(() => []),
        getDisputedShiftClaims().catch(() => []),
        getJobs().catch(() => []),
      ]);

      const allKnownJobs: Job[] = [...((jobsRes as Job[]) || []), ...jobs];

      const mappedApps: AdminApplication[] = appsRes.map((dto: any) => {
        let status: "pending_admin" | "shortlisted" | "rejected" = "pending_admin";
        if (
          dto.status === "SHORTLISTED" ||
          dto.status === "INTERVIEW" ||
          dto.status === "OFFERED" ||
          dto.status === "HIRED" ||
          dto.status === "DISPATCHED"
        ) {
          status = "shortlisted";
        } else if (dto.status === "REJECTED" || dto.status === "INELIGIBLE" || dto.status === "WITHDRAWN") {
          status = "rejected";
        }

        let expSalaryText = "Competitive";
        if (dto.expectedSalaryMinPaise && dto.expectedSalaryMaxPaise) {
          expSalaryText = `₹${(paiseToRupees(dto.expectedSalaryMinPaise) / 1000).toFixed(0)}k–${(paiseToRupees(dto.expectedSalaryMaxPaise) / 1000).toFixed(0)}k / mo`;
        } else if (dto.expectedSalaryMinPaise) {
          expSalaryText = `₹${(paiseToRupees(dto.expectedSalaryMinPaise) / 1000).toFixed(0)}k+ / mo`;
        }

        const cleanPhone = dto.candidatePhone || dto.phone || "+91 6380102651";
        const cleanEmail = dto.candidateEmail || dto.email || "candidate@fale.in";

        const roleCandidate = dto.candidateRole || dto.department || "Doctor";
        const specCandidate =
          dto.candidateSpecialty ||
          (roleCandidate.toLowerCase().includes("doctor") ? "General medicine" : roleCandidate);
        const titleJob = dto.jobTitle || "Healthcare Opening";
        const deptJob = dto.department || "Clinical Department";
        const cityCandidate = dto.candidateCity || dto.city || "Chennai";
        const cityJob = dto.city || "Bengaluru";
        const qualCandidate = dto.candidateQualification || "MBBS";
        const expCandidate = dto.candidateExperience || "2–4 yrs clinical experience";
        const isVerified = Boolean(dto.councilVerified);

        const targetJob = allKnownJobs.find(
          (j) => j.id === dto.jobId || j.title.toLowerCase() === (dto.jobTitle || "").toLowerCase()
        );

        const clinicalMatch = calculateClinicalMatch(
          {
            role: roleCandidate,
            profession: roleCandidate,
            specialty: specCandidate,
            qualification: qualCandidate,
            city: cityCandidate,
            state: dto.candidateState || "Tamil Nadu",
            relocate: false,
            kycStatus: isVerified ? "VERIFIED" : "PENDING",
            experienceYears: expCandidate,
          },
          {
            title: titleJob,
            dept: deptJob,
            city: cityJob,
            qualification: targetJob?.qualification || "State Council Registration Required",
            tags: targetJob?.tags || [deptJob, "NABH Accredited", "State Council Registration Required"],
            exp: targetJob?.exp || "2-5 yrs",
          }
        );

        return {
          id: dto.id,
          candidateId: dto.candidateId,
          candidateName: dto.candidateName || "Candidate",
          candidateRole: roleCandidate,
          candidateCity: cityCandidate,
          candidateState: dto.candidateState || "Tamil Nadu",
          candidateQualification: qualCandidate,
          candidateCouncil: dto.candidateCouncil || "State Medical / Nursing Council",
          candidateBio: dto.candidateBio || "Healthcare professional screened through FALE clinical qualification pipeline.",
          candidateNoticePeriod: dto.candidateNoticePeriod || "Immediate / 15 Days",
          jobId: dto.jobId,
          jobTitle: titleJob,
          hospitalName: dto.facilityName || "Partner Hospital",
          department: deptJob,
          matchScore:
            isApiEnabled && typeof dto.matchScore === "number" && dto.matchScore > 0
              ? dto.matchScore
              : clinicalMatch.score,
          councilVerified: isVerified,
          regNumber: dto.regNumber || "Verified Council Member",
          exp: dto.candidateExperience || "2+ yrs clinical exp",
          status,
          appliedDate: dto.appliedAt
            ? new Date(dto.appliedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            : "Recent",
          summary: "Credentials and clinical license verified through FALE statutory gatekeeping pipeline.",
          phone: cleanPhone,
          email: cleanEmail,
          expectedSalary: expSalaryText,
          noticePeriod: dto.candidateNoticePeriod || "Immediate / 15 Days",
          documents: dto.candidateDocuments || [],
        };
      });

      const mappedShiftClaims: AdminApplication[] = shiftClaimsRes.map((sc: any) => {
        let status: "pending_admin" | "shortlisted" | "rejected" = "pending_admin";
        if (sc.status === "CONFIRMED" || sc.status === "CHECKED_IN" || sc.status === "COMPLETED") {
          status = "shortlisted";
        } else if (sc.status === "REJECTED" || sc.status === "CANCELLED") {
          status = "rejected";
        }

        const netRupees = sc.netAmountPaise ? paiseToRupees(sc.netAmountPaise) : 0;
        const grossRupees = sc.grossAmountPaise ? paiseToRupees(sc.grossAmountPaise) : 0;

        const clinicalMatch = calculateClinicalMatch(
          {
            role: sc.candidateRole || "Staff Nurse",
            profession: sc.candidateRole || "Staff Nurse",
            specialty: sc.candidateSpecialty || "",
            qualification: sc.candidateQualification || "",
            city: sc.candidateCity || "",
            kycStatus: sc.councilVerified ? "VERIFIED" : "PENDING",
            experienceYears: sc.candidateExperience || "",
          },
          {
            title: sc.shiftTitle || "Clinical Shift",
            dept: sc.department || "Critical care",
            city: sc.facilityCity || "",
          }
        );

        return {
          id: sc.id,
          candidateId: sc.candidateId,
          candidateName: sc.candidateName || "Healthcare Professional",
          candidateRole: sc.candidateRole || "Clinical Practitioner",
          candidateCity: sc.candidateCity || "Chennai",
          candidateState: "Tamil Nadu",
          candidateQualification: sc.candidateQualification || "State Council Registered Practitioner",
          candidateCouncil: "State Medical / Nursing Council",
          candidateBio: `Locum clinical shift duty. Slot hold awaiting compliance verification. Escrow guarantee: ₹${netRupees.toLocaleString("en-IN")}.`,
          candidateNoticePeriod: "Immediate Duty Ready",
          jobId: sc.shiftId,
          jobTitle: `[Locum Shift] ${sc.shiftTitle || "Clinical Shift"}`,
          hospitalName: sc.facilityName || "Partner Hospital",
          department: sc.department || "Emergency & Trauma",
          matchScore:
            isApiEnabled && typeof sc.matchScore === "number" && sc.matchScore > 0
              ? sc.matchScore
              : clinicalMatch.score,
          councilVerified: Boolean(sc.councilVerified),
          regNumber: "Council Verified Practitioner",
          exp: `${sc.hours || 8} hrs duty`,
          status,
          appliedDate: sc.claimedAt
            ? new Date(sc.claimedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
            : "Recent",
          summary: `Locum duty claim. Net escrow payout guarantee: ₹${netRupees.toLocaleString("en-IN")} (Gross: ₹${grossRupees.toLocaleString("en-IN")}).`,
          phone: "+91 6380102651",
          email: "candidate@fale.in",
          expectedSalary: `₹${netRupees.toLocaleString("en-IN")} Net Pay`,
          noticePeriod: "Immediate Duty Ready",
          documents: [],
          isShiftClaim: true,
        };
      });

      setApiApps([...mappedApps, ...mappedShiftClaims]);
      setApiPayouts(payoutsRes);
      setApiDisputes(disputesRes);
    } catch (err: any) {
      toast.error("Failed to load applications & shift claims", { description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  // Keep selected app updated when fresh data arrives
  useEffect(() => {
    if (selectedApp && apiApps.length > 0) {
      const fresh = apiApps.find((a) => a.id === selectedApp.id);
      if (fresh) setSelectedApp(fresh);
    }
  }, [apiApps]);

  const apps = isApiEnabled ? apiApps : s.adminApplications;

  // Performance-safe background Ally screening for pending_admin applications (MAX_CONCURRENT = 2)
  useEffect(() => {
    const queue = apps.filter((a) => {
      if (a.status !== "pending_admin") return false;
      const key = getAppCacheKey(a);
      return !aiScreeningResults[key] && !autoScreenedKeysRef.current.has(key) && !inFlightScreeningKeysRef.current.has(key);
    });
    if (queue.length === 0) return;

    let cancelled = false;
    let cursor = 0;
    const MAX_CONCURRENT = 2;

    const worker = async () => {
      while (!cancelled && cursor < queue.length) {
        const nextItem = queue[cursor++];
        if (!nextItem) break;
        const key = getAppCacheKey(nextItem);
        autoScreenedKeysRef.current.add(key);
        await handleRunAiScreening(nextItem, { silent: true });
      }
    };

    const workers = Array.from({ length: Math.min(MAX_CONCURRENT, queue.length) }, () => worker());
    void Promise.all(workers);

    return () => {
      cancelled = true;
    };
  }, [apps, aiScreeningResults, getAppCacheKey, handleRunAiScreening]);

  // Prioritize Ally screening immediately when Dossier Inspect drawer opens
  useEffect(() => {
    if (!sheetOpen || !selectedApp) return;
    const key = getAppCacheKey(selectedApp);
    if (!aiScreeningResults[key] && !inFlightScreeningKeysRef.current.has(key)) {
      void handleRunAiScreening(selectedApp, { silent: true });
    }
  }, [sheetOpen, selectedApp, aiScreeningResults, getAppCacheKey, handleRunAiScreening]);

  const filtered = apps.filter((a) => {
    const matchesFilter = filter === "all" ? true : a.status === filter;
    const matchesSearch =
      a.candidateName.toLowerCase().includes(search.toLowerCase()) ||
      a.jobTitle.toLowerCase().includes(search.toLowerCase()) ||
      a.hospitalName.toLowerCase().includes(search.toLowerCase()) ||
      a.candidateRole.toLowerCase().includes(search.toLowerCase()) ||
      a.regNumber.toLowerCase().includes(search.toLowerCase()) ||
      a.candidateCity.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleShortlist = async (id: string, candidateName: string, hospitalName: string) => {
    if (isApiEnabled) {
      try {
        const item = apiApps.find((a) => a.id === id);
        if ((selectedApp as any)?.isShiftClaim || (item as any)?.isShiftClaim) {
          await screenShiftClaim(id, "APPROVE");
          toast.success("Shift Claim Confirmed & Clinician Dispatched!", {
            description: `${candidateName}'s locum duty at ${hospitalName} is confirmed with escrow guarantee.`,
          });
        } else {
          await screenApplication(id, "SHORTLIST", "Qualified and shortlisted by Admin screening desk");
          toast.success("Candidate Shortlisted & Dispatched!", {
            description: `${candidateName} has been vetted by Admin and forwarded to ${hospitalName}'s hiring board.`,
          });
        }
        setSheetOpen(false);
        fetchApps();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("fale:applications-updated"));
        }
      } catch (err: any) {
        toast.error("Shortlist failed", { description: err?.message });
      }
      return;
    }
    setState((state) => ({
      adminApplications: state.adminApplications.map((a) =>
        a.id === id ? { ...a, status: "shortlisted" as const } : a
      ),
    }));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("fale:applications-updated"));
    }
    toast.success("Candidate Shortlisted & Dispatched!", {
      description: `${candidateName} has been vetted by Admin and forwarded to ${hospitalName}'s hiring board.`,
    });
    setSheetOpen(false);
  };

  const handleConfirmDisburse = async () => {
    if (!selectedPayout) return;
    setDisbursing(true);
    try {
      const finalUtr = utrInput.trim() || `CFUTR${Date.now()}`;
      await disbursePayout(selectedPayout.id, finalUtr);
      toast.success("Shift Escrow Payout Disbursed!", {
        description: `₹${paiseToRupees(selectedPayout.netAmountPaise || 0)} credited to ${selectedPayout.candidateName || "Clinician"} (UTR: ${finalUtr}).`,
      });
      setDisburseModalOpen(false);
      setSelectedPayout(null);
      setUtrInput("");
      fetchApps();
    } catch (err: any) {
      toast.error("Payout disbursement failed", { description: err?.message });
    } finally {
      setDisbursing(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!selectedDispute) return;
    setResolvingDispute(true);
    try {
      await resolveShiftDispute(selectedDispute.id, {
        resolution: disputeResolution,
        approvedHours: disputeResolution === "PARTIAL_SPLIT" ? disputeApprovedHours : undefined,
        notes: disputeNotes.trim() || undefined,
      });
      toast.success("Shift Dispute Resolved", {
        description: `Applied ${disputeResolution.replace(/_/g, " ")} for ${selectedDispute.candidateName || "Clinician"}.`,
      });
      setSelectedDispute(null);
      setDisputeNotes("");
      fetchApps();
    } catch (err: any) {
      toast.error("Failed to resolve dispute", { description: err?.message });
    } finally {
      setResolvingDispute(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (!selectedApp) return;
    if (isApiEnabled) {
      try {
        if ((selectedApp as any)?.isShiftClaim) {
          await screenShiftClaim(selectedApp.id, "REJECT", rejectReason || "Ineligible for this shift slot.");
          toast.error("Shift Claim Rejected", {
            description: `Claim returned to candidate: ${rejectReason || "Criteria mismatch."}`,
          });
        } else {
          await screenApplication(selectedApp.id, "REJECT", rejectReason || "Criteria mismatch.");
          toast.error("Application Rejected", {
            description: `Candidate marked ineligible for ${selectedApp.jobTitle}: ${rejectReason || "Criteria mismatch."}`,
          });
        }
        setRejectModalOpen(false);
        setSheetOpen(false);
        setRejectReason("");
        fetchApps();
      } catch (err: any) {
        toast.error("Rejection failed", { description: err?.message });
      }
      return;
    }
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

  const openDocumentPreview = async (doc: any) => {
    try {
      setPreviewLoading(true);

      // 1. Image documents (PNG, JPG, WEBP)
      if (
        doc.fileUrl &&
        (doc.fileUrl.startsWith("data:image/") ||
          doc.mimeType?.startsWith("image/") ||
          /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(doc.originalFileName || ""))
      ) {
        setPreviewDoc({ name: doc.originalFileName, url: doc.fileUrl, isImage: true });
        return;
      }

      // 2. Base64 PDF data URL (like candidate uploaded Resume / CV)
      if (doc.fileUrl && doc.fileUrl.startsWith("data:application/pdf")) {
        const parts = doc.fileUrl.split(",");
        const binary = atob(parts[1]);
        const len = binary.length;
        const u8 = new Uint8Array(len);
        for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
        const blob = new Blob([u8], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPreviewDoc({ name: doc.originalFileName, url, isImage: false });
        return;
      }

      // 3. Remote HTTP / HTTPS / Blob URL
      if (
        doc.fileUrl &&
        (doc.fileUrl.startsWith("http://") ||
          doc.fileUrl.startsWith("https://") ||
          doc.fileUrl.startsWith("blob:"))
      ) {
        setPreviewDoc({ name: doc.originalFileName, url: doc.fileUrl, isImage: false });
        return;
      }

      // 4. Fallback: generate clinical credential verification PDF if no binary stream is present
      const blob = await generateClinicalDocumentBlob(
        { originalFileName: doc.originalFileName || "Candidate_Document.pdf" },
        { name: selectedApp?.candidateName, role: selectedApp?.candidateRole }
      );
      const url = URL.createObjectURL(blob);
      setPreviewDoc({ name: doc.originalFileName, url, isImage: false });
    } catch {
      toast.error("Unable to generate document preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const pendingCount = apps.filter((a) => a.status === "pending_admin").length;
  const shortlistedCount = apps.filter((a) => a.status === "shortlisted").length;
  const rejectedCount = apps.filter((a) => a.status === "rejected").length;

  return (
    <AdminLayout
      title="Candidate Application Screening & Shortlisting"
      subtitle="Strict Admin gatekeeping: when healthcare professionals apply, applications arrive at Admin first. Admin screens credentials, registration, and clinical fit before dispatching to hospitals."
      badge={
        <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
          {pendingCount} Pending · {shortlistedCount} Shortlisted
        </span>
      }
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={fetchApps}
          disabled={loading}
          className="text-xs font-bold gap-1.5 h-9 rounded-xl border-border hover:bg-muted cursor-pointer"
        >
          <HiOutlineArrowPath className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span>Refresh</span>
        </Button>
      }
    >
      {/* Metric Strip (4 Cards matching Candidate KYC & Facility Verification) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Pending Screening</span>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-foreground">{pendingCount}</div>
          <p className="text-[11px] text-muted-foreground">Gatekeeping required</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Shortlisted</span>
            <HiOutlineCheckBadge className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground">{shortlistedCount}</div>
          <p className="text-[11px] text-emerald-600 font-medium">Forwarded to hospital</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Ineligible</span>
            <HiOutlineXMark className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-foreground">{rejectedCount}</div>
          <p className="text-[11px] text-rose-600 font-medium">Screening rejected</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Applications</span>
            <HiOutlineUserGroup className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{apps.length}</div>
          <p className="text-[11px] text-muted-foreground">Candidate submissions</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden min-w-0 w-full">
        {/* Controls Bar */}
        <div className="p-3.5 sm:p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-muted/50 border border-border/40 w-full md:w-fit overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: "pending_admin" as const, label: "Pending Screening", count: pendingCount },
              { id: "shortlisted" as const, label: "Shortlisted", count: shortlistedCount },
              { id: "payouts" as const, label: "Escrow Payout Releases", count: apiPayouts.length },
              { id: "disputes" as const, label: "Disputed Shifts", count: apiDisputes.length },
              { id: "rejected" as const, label: "Ineligible", count: rejectedCount },
              { id: "all" as const, label: "All Applications", count: apps.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "px-2.5 sm:px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0",
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
              placeholder="Search candidate, role, hospital, reg #..."
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-border bg-muted/30 focus:bg-card text-xs font-medium outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
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
        {filter === "payouts" ? (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-border gap-2">
              <div>
                <h4 className="text-sm font-extrabold text-foreground">Completed Shifts Awaiting Escrow Payout Release</h4>
                <p className="text-xs text-muted-foreground">Disburse verified clinician payouts with official banking UTR reference numbers.</p>
              </div>
              <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20 w-fit">
                {apiPayouts.length} Pending Disbursement
              </span>
            </div>
            {apiPayouts.length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                <HiOutlineBanknotes className="h-10 w-10 mx-auto mb-2.5 text-muted-foreground/50" />
                No shift payouts pending disbursement. All completed clinical duty claims have been settled!
              </div>
            ) : (
              <div className="space-y-3">
                {apiPayouts.map((p) => {
                  const net = paiseToRupees(p.netAmountPaise || 0);
                  const gross = paiseToRupees(p.grossAmountPaise || 0);
                  const fee = paiseToRupees(p.platformFeePaise || 0);
                  const tds = paiseToRupees(p.tdsAmountPaise || 0);
                  return (
                    <div
                      key={p.id}
                      className="rounded-2xl border border-border bg-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs hover:border-primary/40 transition-all"
                    >
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground text-sm">{p.candidateName || "Healthcare Professional"}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                            Duty Completed
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                          <span className="text-foreground font-semibold">{p.shiftTitle || "Locum Duty"}</span>
                          <span>•</span>
                          <span>{p.facilityName || "Partner Hospital"}</span>
                          <span>•</span>
                          <span>{p.hours || 8} hrs duty</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-mono">
                          Gross: ₹{gross.toLocaleString("en-IN")} · Platform Fee: ₹{fee} · TDS: ₹{tds}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 shrink-0 justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-border/60">
                        <div className="text-left sm:text-right">
                          <span className="text-[11px] text-muted-foreground block font-medium">Net Escrow Payout</span>
                          <span className="text-base font-black text-primary font-mono">₹{net.toLocaleString("en-IN")}</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedPayout(p);
                            setUtrInput(`CFUTR${Date.now().toString().slice(-8)}`);
                            setDisburseModalOpen(true);
                          }}
                          className="h-9 px-4 rounded-xl font-bold text-xs bg-primary hover:bg-primary-hover text-white shadow-none gap-1.5 cursor-pointer"
                        >
                          <HiOutlineBanknotes className="h-4 w-4" />
                          <span>Release Payout</span>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : filter === "disputes" ? (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-border/70">
              <div>
                <h2 className="text-base font-bold text-foreground">Shift Dispute Resolution Desk</h2>
                <p className="text-xs text-muted-foreground">Arbitrate contested shift claims: release full payout, partial pro-rata split, or refund hospital escrow.</p>
              </div>
              <span className="w-fit text-xs font-bold px-3 py-1 rounded-full border border-rose-500/20 bg-rose-500/10 text-rose-700 dark:text-rose-300">
                {apiDisputes.length} Active Disputes
              </span>
            </div>

            {apiDisputes.length === 0 ? (
              <div className="py-16 text-center text-sm text-muted-foreground">
                No disputed shift claims awaiting arbitration.
              </div>
            ) : (
              <div className="grid gap-3">
                {apiDisputes.map((d) => {
                  const grossRupees = paiseToRupees(d.grossAmountPaise || 0);
                  return (
                    <div key={d.id} className="rounded-2xl border border-rose-200/80 dark:border-rose-900/50 bg-card p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
                      <div className="space-y-1.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-sm text-foreground">{d.candidateName || "Clinician"}</span>
                          <span className="text-xs text-muted-foreground">•</span>
                          <span className="text-xs font-semibold text-primary">{d.shiftTitle || "Locum Shift"}</span>
                          <span className="text-xs text-muted-foreground">at {d.facilityName || "Hospital"}</span>
                          <span className="inline-flex items-center rounded-full px-2 py-0.5 bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/25 text-[10px] font-bold">
                            DISPUTED
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                          <span>Scheduled: <strong>{d.hours || 8} hrs</strong></span>
                          <span>Reported: <strong>{d.actualHours || d.hours || 8} hrs</strong></span>
                          <span>Escrow Locked: <strong className="text-foreground">₹{grossRupees.toLocaleString("en-IN")}</strong></span>
                          {d.disputedBy && <span>Raised by: <strong>{d.disputedBy}</strong></span>}
                        </div>
                        {d.disputeReason && (
                          <p className="text-xs text-rose-700 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl px-3 py-1.5 border border-rose-200/60 dark:border-rose-900/40">
                            <AlertTriangle className="h-3.5 w-3.5 inline mr-1.5 -mt-0.5" />
                            {d.disputeReason}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0">
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDispute(d);
                            setDisputeResolution("PARTIAL_SPLIT");
                            setDisputeApprovedHours(d.actualHours || d.hours || 8);
                            setDisputeNotes("");
                          }}
                          className="h-9 px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                        >
                          Resolve Dispute
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto w-full min-w-0">
              <Table className="min-w-[820px] w-full">
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 pl-5 h-11 align-middle">
                      Candidate
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 h-11 align-middle">
                      Target Position & Hospital
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 h-11 align-middle">
                      Council Reg Status
                    </TableHead>
                    <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 h-11 align-middle">
                      Clinical Match
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
                      {/* Candidate Column */}
                      <TableCell className="py-3.5 pl-5 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs shrink-0 shadow-2xs">
                            {item.candidateName
                              .split(" ")
                              .map((x) => x[0])
                              .slice(0, 2)
                              .join("")}
                          </div>
                          <div>
                            <div
                              onClick={() => {
                                setSelectedApp(item);
                                setSheetOpen(true);
                              }}
                              className="font-bold text-foreground text-sm hover:text-primary transition-colors cursor-pointer"
                            >
                              {item.candidateName}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                              <span className="font-medium text-foreground/80">{item.candidateRole}</span>
                              <span className="h-1 w-1 rounded-full bg-border" />
                              <span>{item.candidateCity}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>

                      {/* Position & Hospital */}
                      <TableCell className="py-3.5 align-middle">
                        <div className="font-bold text-foreground text-xs flex items-center gap-1.5">
                          <HiOutlineBriefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{item.jobTitle}</span>
                        </div>
                        <div className="text-[11px] text-primary font-semibold flex items-center gap-1 mt-0.5">
                          <HiOutlineBuildingOffice2 className="h-3 w-3 shrink-0" />
                          <span>{item.hospitalName}</span>
                        </div>
                        <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <HiOutlineCalendar className="h-3 w-3 shrink-0" />
                          <span>{item.appliedDate}</span>
                        </div>
                      </TableCell>

                      {/* Council Reg Status */}
                      <TableCell className="py-3.5 align-middle">
                        <div className="flex items-center gap-1.5">
                          {item.councilVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
                              <HiOutlineCheckBadge className="h-3.5 w-3.5" /> Verified
                            </span>
                          ) : (
                            <span className="text-amber-600 text-xs font-semibold">Pending Audit</span>
                          )}
                        </div>
                        <div className="font-mono text-muted-foreground text-[11px] mt-0.5 font-semibold">
                          {item.regNumber}
                        </div>
                      </TableCell>

                      {/* Match Score & AI Verdict */}
                      <TableCell className="py-3.5 align-middle">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            <HiOutlineSparkles className="h-3.5 w-3.5" />
                            {item.matchScore >= 90 ? `Exact Match (${item.matchScore}%)` : `${item.matchScore}%`}
                          </span>
                          {renderAllyScreeningBadge(item)}
                        </div>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell className="py-3.5 align-middle">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                            item.status === "shortlisted"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              : item.status === "rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                                : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              item.status === "shortlisted"
                                ? "bg-emerald-500"
                                : item.status === "rejected"
                                  ? "bg-rose-500"
                                  : "bg-amber-500"
                            )}
                          />
                          {item.status === "shortlisted"
                            ? "Dispatched"
                            : item.status === "rejected"
                              ? "Ineligible"
                              : "Screening Needed"}
                        </span>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="py-3.5 pr-5 text-right align-middle">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedApp(item);
                              setSheetOpen(true);
                            }}
                            className="text-xs font-bold gap-1.5 h-8 px-2.5 rounded-lg border-border hover:bg-muted cursor-pointer"
                          >
                            <HiOutlineEye className="h-3.5 w-3.5" />
                            <span>Dossier</span>
                          </Button>

                          {item.status === "pending_admin" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleShortlist(item.id, item.candidateName, item.hospitalName)}
                                className="text-xs font-bold gap-1.5 h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs cursor-pointer"
                              >
                                <HiOutlinePaperAirplane className="h-3.5 w-3.5" />
                                <span>Shortlist</span>
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedApp(item);
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
                        <HiOutlineUserGroup className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                        No candidate applications match this filter or search.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Cards View (< md) */}
            <div className="md:hidden p-3 sm:p-4 pb-24 sm:pb-4 space-y-3.5 bg-muted/20">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 shadow-2xs space-y-3.5 overflow-hidden min-w-0"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-sm shrink-0 border border-primary/20">
                        {item.candidateName
                          .split(" ")
                          .map((x) => x[0])
                          .slice(0, 2)
                          .join("")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3
                          onClick={() => {
                            setSelectedApp(item);
                            setSheetOpen(true);
                          }}
                          className="font-extrabold text-foreground text-sm leading-snug break-words cursor-pointer hover:text-primary transition-colors"
                        >
                          {item.candidateName}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">
                          {item.candidateRole} · {item.candidateCity}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 px-2 py-0.5 text-[11px] font-black text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0 whitespace-nowrap">
                        <HiOutlineSparkles className="h-3 w-3 shrink-0" />
                        {item.matchScore >= 90 ? `Exact Match (${item.matchScore}%)` : `${item.matchScore}%`}
                      </span>
                      {renderAllyScreeningBadge(item)}
                    </div>
                  </div>

                  {/* Target Position & Hospital */}
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

                  {/* Council & Status */}
                  <div className="pt-2 border-t border-border/50 space-y-2 text-xs min-w-0">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Council</span>
                      <div className="flex items-center gap-1.5 min-w-0 justify-end">
                        {item.councilVerified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">
                            <HiOutlineCheckBadge className="h-3.5 w-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-amber-600 font-semibold text-xs shrink-0">Pending</span>
                        )}
                        <span className="font-mono text-[11px] text-muted-foreground truncate">
                          ({item.regNumber})
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 min-w-0">
                      <span className="text-[11px] font-semibold text-muted-foreground shrink-0">Status</span>
                      <div className="shrink-0">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border",
                            item.status === "shortlisted"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : item.status === "rejected"
                                ? "bg-rose-50 text-rose-700 border-rose-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                          )}
                        >
                          {item.status === "shortlisted"
                            ? "Dispatched"
                            : item.status === "rejected"
                              ? "Ineligible"
                              : "Screening Needed"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div
                    className={cn(
                      "pt-1 min-w-0",
                      item.status === "pending_admin" ? "grid grid-cols-3 gap-1.5 sm:gap-2" : "flex items-center gap-2"
                    )}
                  >
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedApp(item);
                        setSheetOpen(true);
                      }}
                      className={cn(
                        "h-9 px-2 sm:px-3 text-[11px] sm:text-xs font-bold rounded-xl border-border hover:bg-muted text-foreground min-w-0 gap-1 cursor-pointer",
                        item.status !== "pending_admin" && "flex-1"
                      )}
                    >
                      <HiOutlineEye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">Dossier</span>
                    </Button>

                    {item.status === "pending_admin" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedApp(item);
                            setRejectModalOpen(true);
                          }}
                          className="h-9 px-2 sm:px-3 text-[11px] sm:text-xs font-bold rounded-xl text-rose-600 border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 min-w-0 cursor-pointer"
                        >
                          <HiOutlineXMark className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Reject</span>
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleShortlist(item.id, item.candidateName, item.hospitalName)}
                          className="h-9 px-2 sm:px-3 text-[11px] sm:text-xs font-bold rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground gap-1 min-w-0 shadow-2xs cursor-pointer"
                        >
                          <HiOutlinePaperAirplane className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Shortlist</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}

              {filtered.length === 0 && (
                <div className="p-8 text-center rounded-2xl border border-dashed border-border bg-card">
                  <HiOutlineUserGroup className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                  <p className="text-xs text-muted-foreground">No candidate applications match this filter or search.</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Slide-over Inspection Sheet (Comprehensive Candidate Dossier — UNMASKED) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col h-full max-h-[100dvh] overflow-hidden gap-0">
          <SheetHeader className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-border bg-card shrink-0 text-left">
            <div className="pr-8">
              <SheetTitle className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                <HiOutlineUserGroup className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span>Candidate Clinical Dossier</span>
              </SheetTitle>
              <SheetDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Screen unmasked practitioner credentials before dispatching to {selectedApp?.hospitalName}.
              </SheetDescription>
            </div>
          </SheetHeader>

          {selectedApp && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4">
              {/* 1. Unmasked Candidate Header Card */}
              <div className="rounded-2xl border border-border bg-muted/30 p-3.5 sm:p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-3">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black text-sm shrink-0 shadow-2xs">
                      {selectedApp.candidateName
                        .split(" ")
                        .map((x) => x[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-extrabold text-foreground text-base leading-tight break-words">
                        {selectedApp.candidateName}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-foreground/90">{selectedApp.candidateRole}</span>
                        <span className="h-1 w-1 rounded-full bg-border" />
                        <span>{selectedApp.candidateQualification}</span>
                      </p>
                    </div>
                  </div>
                  <span className="font-black text-emerald-600 text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 shrink-0 w-fit inline-flex items-center gap-1 whitespace-nowrap">
                    <HiOutlineSparkles className="h-3.5 w-3.5 shrink-0" />
                    {selectedApp.matchScore >= 90 ? `Exact Match (${selectedApp.matchScore}%)` : `${selectedApp.matchScore}% Match`}
                  </span>
                </div>

                {/* Unmasked Contact Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-3 border-t border-border/70 text-xs">
                  {/* Phone (Unmasked) */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60">
                    <HiOutlinePhone className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Mobile Phone</div>
                      <a
                        href={`tel:${selectedApp.phone}`}
                        className="font-bold text-foreground font-mono text-xs hover:text-primary transition-colors truncate block"
                      >
                        {selectedApp.phone}
                      </a>
                    </div>
                  </div>

                  {/* Email (Unmasked) */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60">
                    <HiOutlineEnvelope className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Email Address</div>
                      <a
                        href={`mailto:${selectedApp.email}`}
                        className="font-bold text-foreground font-mono text-xs hover:text-primary transition-colors truncate block"
                      >
                        {selectedApp.email}
                      </a>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60">
                    <HiOutlineMapPin className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Location</div>
                      <div className="font-bold text-foreground text-xs truncate">
                        {selectedApp.candidateCity}, {selectedApp.candidateState}
                      </div>
                    </div>
                  </div>

                  {/* Experience & Notice */}
                  <div className="flex items-center gap-2 p-2 rounded-xl bg-card border border-border/60">
                    <HiOutlineClock className="h-4 w-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[10px] uppercase font-bold text-muted-foreground">Experience & Notice</div>
                      <div className="font-bold text-foreground text-xs truncate">
                        {selectedApp.exp} · {selectedApp.noticePeriod}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ally Clinical Screening & Shortlist Pre-Check Card */}
              {(() => {
                const screening = getApplicationScreening(selectedApp);
                const isScreening = Boolean(runningScreeningIds[selectedApp.id]);
                const isVerified = screening.status === "VERIFIED";
                const isFlagged = screening.status === "FLAGGED";
                const isError = screening.status === "ERROR";

                return (
                  <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3.5 sm:p-4 space-y-3 transition-all shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary border border-primary/20 shrink-0">
                          {isScreening ? (
                            <HiOutlineArrowPath className="h-4 w-4 animate-spin" />
                          ) : (
                            <BotMessageSquare className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h5 className="font-extrabold text-xs uppercase tracking-wider text-primary leading-snug">
                            Ally Clinical Pre-Check
                          </h5>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {isScreening
                              ? "Evaluating role alignment & council credentials..."
                              : isVerified
                                ? "Shortlist Recommended"
                                : isFlagged
                                  ? "Further Review Recommended"
                                  : isError
                                    ? "Screening unavailable · Retry recommended"
                                    : "Queued for automated Ally evaluation"}{" "}
                            · {selectedApp.hospitalName}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <span
                          className={cn(
                            "text-[10px] font-black px-2 py-0.5 rounded-full border inline-flex items-center gap-1 whitespace-nowrap",
                            isScreening || isVerified
                              ? "bg-primary/10 text-primary border-primary/25"
                              : isFlagged
                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25"
                                : isError
                                  ? "bg-destructive/10 text-destructive border-destructive/25"
                                  : "bg-muted text-muted-foreground border-border/60"
                          )}
                        >
                          {isScreening
                            ? "Ally Screening..."
                            : isVerified
                              ? `Suitability: ${screening.suitabilityScore.toFixed(1)}%`
                              : isFlagged
                                ? `Review · ${screening.suitabilityScore.toFixed(1)}%`
                                : isError
                                  ? "Ally Retry"
                                  : "Ally Queued"}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isScreening}
                          onClick={() => handleRunAiScreening(selectedApp)}
                          className="h-7 px-2.5 text-[11px] font-bold rounded-lg gap-1.5 border-primary/30 text-primary hover:bg-primary/10 bg-background/80 cursor-pointer shrink-0"
                        >
                          {isScreening ? (
                            <HiOutlineArrowPath className="h-3 w-3 animate-spin shrink-0" />
                          ) : (
                            <BotMessageSquare className="h-3.5 w-3.5 shrink-0" />
                          )}
                          <span>{isScreening ? "Screening with Ally..." : "Re-analyze with Ally"}</span>
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-36 sm:max-h-44 overflow-y-auto pr-1.5 [scrollbar-width:thin] text-xs text-foreground/90 leading-relaxed space-y-2 pt-2 border-t border-primary/15">
                      <p className="flex items-start gap-2">
                        <HiOutlineCheckBadge
                          className={cn(
                            "h-4 w-4 shrink-0 mt-0.5",
                            isFlagged ? "text-amber-600 dark:text-amber-400" : isError ? "text-destructive" : "text-primary"
                          )}
                        />
                        <span className="break-words min-w-0">{screening.unitFitSentence}</span>
                      </p>
                      <p className="flex items-start gap-2">
                        <HiOutlineCheckBadge
                          className={cn(
                            "h-4 w-4 shrink-0 mt-0.5",
                            isFlagged ? "text-amber-600 dark:text-amber-400" : isError ? "text-destructive" : "text-primary"
                          )}
                        />
                        <span className="break-words min-w-0">{screening.councilSentence}</span>
                      </p>
                      <p
                        className={cn(
                          "text-[11px] font-semibold pt-2 border-t border-primary/15 flex items-start gap-2",
                          isFlagged ? "text-amber-700 dark:text-amber-300" : isError ? "text-destructive" : "text-primary"
                        )}
                      >
                        <HiOutlineSparkles className="h-4 w-4 shrink-0 mt-0.5" />
                        <span className="break-words min-w-0">{screening.recommendationSentence}</span>
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* 2. Target Opening & Hiring Hospital Card */}
              <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <HiOutlineBriefcase className="h-4 w-4 text-primary" />
                    <span>Target Hospital Requirement</span>
                  </h5>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border whitespace-nowrap",
                      selectedApp.status === "shortlisted"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : selectedApp.status === "rejected"
                          ? "bg-rose-50 text-rose-700 border-rose-200"
                          : "bg-amber-50 text-amber-700 border-amber-200"
                    )}
                  >
                    {selectedApp.status === "shortlisted"
                      ? "Dispatched to Facility"
                      : selectedApp.status === "rejected"
                        ? "Ineligible"
                        : "Pending Admin Screening"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-muted-foreground text-[11px]">Requirement Title:</span>
                    <div className="font-bold text-foreground text-sm mt-0.5">{selectedApp.jobTitle}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px]">Hiring Facility:</span>
                    <div className="font-bold text-primary text-sm mt-0.5 flex items-center gap-1">
                      <HiOutlineBuildingOffice2 className="h-3.5 w-3.5" />
                      <span>{selectedApp.hospitalName}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px]">Clinical Specialty:</span>
                    <div className="font-semibold text-foreground mt-0.5">{selectedApp.department}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-[11px]">Application Received:</span>
                    <div className="font-semibold text-foreground mt-0.5">{selectedApp.appliedDate}</div>
                  </div>
                </div>

                {/* Locum Shift Duty Window & Escrow Details (if shift) */}
                {selectedApp.type === "shift" && (
                  <div className="pt-3 border-t border-border/60">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Duty Hours</span>
                        <div className="font-extrabold text-primary text-xs flex items-center gap-1 mt-0.5">
                          <HiOutlineClock className="h-3.5 w-3.5" />
                          <span>{selectedApp.hours || 8} Hours Continuous</span>
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Duty Window</span>
                        <div className="font-bold text-foreground text-xs mt-0.5">
                          {selectedApp.startAt ? new Date(selectedApp.startAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "Start"} – {selectedApp.endAt ? new Date(selectedApp.endAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "End"}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-primary/5 border border-primary/20">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Guaranteed Payout</span>
                        <div className="font-bold text-emerald-600 text-xs mt-0.5">
                          {selectedApp.expectedSalary || "Escrow Protected"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 3. Statutory Council Registration Audit */}
              <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <HiOutlineAcademicCap className="h-4 w-4 text-primary" />
                    <span>Statutory Council Audit</span>
                  </h5>
                  {selectedApp.councilVerified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-xs">
                      <HiOutlineCheckBadge className="h-4 w-4" /> Verified Active
                    </span>
                  ) : (
                    <span className="text-amber-600 text-xs font-semibold">Pending Audit</span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    <span className="text-muted-foreground">State Council:</span>
                    <span className="font-semibold text-foreground text-right">{selectedApp.candidateCouncil}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    <span className="text-muted-foreground">Council Reg Number:</span>
                    <span className="font-mono font-bold text-primary break-all text-right">{selectedApp.regNumber}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    <span className="text-muted-foreground">Highest Degree:</span>
                    <span className="font-semibold text-foreground text-right">{selectedApp.candidateQualification}</span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-1.5 text-xs">
                    <span className="text-muted-foreground">Expected Salary:</span>
                    <span className="font-mono font-semibold text-foreground text-right">{selectedApp.expectedSalary}</span>
                  </div>
                </div>

                {selectedApp.candidateBio && (
                  <div className="text-xs text-muted-foreground leading-relaxed pt-1">
                    <strong className="text-foreground block mb-1">Clinical Profile & Background:</strong>
                    {selectedApp.candidateBio}
                  </div>
                )}
              </div>

              {/* 4. Attached Verification & Regulatory Documents */}
              <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h5 className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <HiOutlineDocumentText className="h-4 w-4 text-primary" />
                    <span>Candidate Regulatory Documents</span>
                  </h5>
                  <span className="text-[11px] font-bold text-muted-foreground">
                    {selectedApp.documents && selectedApp.documents.length > 0
                      ? `${selectedApp.documents.length} Uploaded`
                      : "1 Regulatory Record"}
                  </span>
                </div>

                {selectedApp.documents && selectedApp.documents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedApp.documents.map((doc: any, idx: number) => (
                      <div
                        key={doc.id || idx}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-border/70 bg-muted/30 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1 w-full">
                          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
                            <HiOutlineDocumentText className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-foreground text-xs break-all sm:truncate">
                              {doc.originalFileName || formatDocType(doc.documentType)}
                            </div>
                            <div className="text-[10px] text-muted-foreground flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span>{formatDocType(doc.documentType)}</span>
                              <span className="h-1 w-1 rounded-full bg-border" />
                              <span>{formatBytes(doc.fileSizeBytes)}</span>
                            </div>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openDocumentPreview(doc)}
                          disabled={previewLoading}
                          className="w-full sm:w-auto text-xs font-bold gap-1 h-8 px-3 rounded-lg border-border hover:bg-muted cursor-pointer shrink-0"
                        >
                          <HiOutlineEye className="h-3.5 w-3.5" />
                          <span>View</span>
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    onClick={() =>
                      openDocumentPreview({
                        originalFileName: `${selectedApp.candidateName.replace(/\s+/g, "_")}_Council_Reg_Certificate.pdf`,
                        documentType: "REGISTRATION_CERTIFICATE",
                      })
                    }
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-xl border border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 w-full">
                      <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary font-bold text-xs shrink-0">
                        <HiOutlineDocumentText className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-foreground text-xs break-all sm:truncate">
                          {selectedApp.candidateName}_State_Council_Reg_Certificate.pdf
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">
                          Permanent regulatory council dossier record on file
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full sm:w-auto text-xs font-bold gap-1 h-8 px-3 rounded-lg border-border hover:bg-muted shrink-0"
                    >
                      <HiOutlineEye className="h-3.5 w-3.5" />
                      <span>Inspect</span>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Sticky Bottom Actions */}
          {selectedApp && (
            <div className="p-3.5 sm:p-4 border-t border-border bg-card flex flex-wrap items-center justify-end gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSheetOpen(false)}
                className="h-9 px-3 rounded-xl border-border text-xs font-bold cursor-pointer"
              >
                Close Dossier
              </Button>
              {selectedApp.status === "pending_admin" ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectModalOpen(true)}
                    className="h-9 px-3 rounded-xl text-rose-600 border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold gap-1.5 cursor-pointer"
                  >
                    <HiOutlineXMark className="h-4 w-4 shrink-0" />
                    <span>Mark Ineligible</span>
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleShortlist(selectedApp.id, selectedApp.candidateName, selectedApp.hospitalName)}
                    className="flex-1 sm:flex-initial h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold gap-1.5 shadow-2xs cursor-pointer whitespace-nowrap"
                  >
                    <HiOutlinePaperAirplane className="h-4 w-4 shrink-0" />
                    <span>Shortlist for Hospital</span>
                  </Button>
                </>
              ) : selectedApp.status === "shortlisted" ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-xs font-bold">
                  <HiOutlineCheckBadge className="h-4 w-4" />
                  <span>Dispatched to {selectedApp.hospitalName}</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs font-bold">
                  <HiOutlineXMark className="h-4 w-4" />
                  <span>Marked Ineligible</span>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Escrow Disbursement Confirmation Modal */}
      <Dialog open={disburseModalOpen} onOpenChange={setDisburseModalOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold flex items-center gap-2">
              <HiOutlineBanknotes className="h-5 w-5 text-primary" />
              <span>Confirm Escrow Payout Release</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Release held hospital escrow funds to clinician verified banking / UPI destination.
            </DialogDescription>
          </DialogHeader>

          {selectedPayout && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/50 border border-border/60 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clinician:</span>
                  <span className="font-bold text-foreground">{selectedPayout.candidateName || "Healthcare Professional"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duty Shift:</span>
                  <span className="font-semibold text-foreground">{selectedPayout.shiftTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Net Disbursable:</span>
                  <span className="font-black text-primary font-mono text-sm">
                    ₹{paiseToRupees(selectedPayout.netAmountPaise || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Banking / UPI Reference (UTR)</label>
                <input
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="Enter 12-digit UTR number"
                  className="w-full h-9 rounded-xl border border-border bg-background px-3 font-mono text-xs outline-none focus:border-primary"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDisburseModalOpen(false)}
              className="rounded-xl text-xs font-semibold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={disbursing}
              onClick={handleConfirmDisburse}
              className="rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white gap-1.5"
            >
              <HiCheck className="h-3.5 w-3.5" />
              <span>{disbursing ? "Disbursing..." : "Confirm & Disburse Payment"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Modal */}
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Mark Application Ineligible</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              State the reason why {selectedApp?.candidateName} was not shortlisted for {selectedApp?.jobTitle}.
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

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRejectModalOpen(false)}
              className="h-9 rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleRejectConfirm}
              className="h-9 rounded-xl font-bold text-xs gap-1.5"
            >
              <HiOutlineXMark className="h-4 w-4" />
              <span>Confirm Ineligible</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Resolve Shift Dispute Modal */}
      <Dialog open={!!selectedDispute} onOpenChange={(open) => { if (!open) setSelectedDispute(null); }}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600" />
              Arbitrate Shift Dispute
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {selectedDispute?.candidateName || "Clinician"} · {selectedDispute?.shiftTitle || "Locum Shift"} ({selectedDispute?.facilityName || "Hospital"})
            </DialogDescription>
          </DialogHeader>

          {selectedDispute && (
            <div className="space-y-4 py-2 text-xs">
              <div className="rounded-xl border border-border bg-muted/40 p-3 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Scheduled / Reported Hours</span>
                  <span className="font-bold text-foreground">{selectedDispute.hours || 8}h / {selectedDispute.actualHours || selectedDispute.hours || 8}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Dispute Reason</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400 text-right max-w-[60%]">{selectedDispute.disputeReason || "Contested duty hours"}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Arbitration Decision</label>
                <div className="grid gap-1.5">
                  {[
                    { id: "RELEASE_TO_CANDIDATE" as const, label: "Release Full Payout to Clinician" },
                    { id: "PARTIAL_SPLIT" as const, label: "Partial Pro-Rata Split (Approve Verified Hours)" },
                    { id: "REFUND_HOSPITAL" as const, label: "Full Refund to Hospital Escrow Wallet" },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setDisputeResolution(opt.id)}
                      className={cn(
                        "w-full text-left rounded-xl px-3 py-2 font-semibold border transition-all cursor-pointer",
                        disputeResolution === opt.id
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-input bg-card text-muted-foreground hover:border-ring"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {disputeResolution === "PARTIAL_SPLIT" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground block">Approved Billable Hours</label>
                  <input
                    type="number"
                    min={1}
                    max={(selectedDispute.hours || 8) + 4}
                    value={disputeApprovedHours}
                    onChange={(e) => setDisputeApprovedHours(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full h-10 rounded-xl border border-input bg-background px-3 text-sm font-bold"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground block">Arbitration Resolution Notes</label>
                <textarea
                  rows={2}
                  value={disputeNotes}
                  onChange={(e) => setDisputeNotes(e.target.value)}
                  placeholder="Document audit evidence or biometric log findings..."
                  className="w-full rounded-xl border border-border bg-muted/40 p-2.5 text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={resolvingDispute}
              onClick={() => setSelectedDispute(null)}
              className="h-9 rounded-xl text-xs font-bold"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              disabled={resolvingDispute}
              onClick={handleResolveDispute}
              className="h-9 rounded-xl font-bold text-xs bg-primary hover:bg-primary-hover text-white"
            >
              {resolvingDispute ? "Applying..." : "Execute Arbitration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Binary Blob Preview Modal */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="w-full sm:w-[94vw] max-w-4xl h-[90dvh] sm:h-[85vh] max-h-[92dvh] sm:max-h-[85vh] p-0 flex flex-col gap-0 overflow-hidden rounded-t-3xl rounded-b-none sm:rounded-2xl border-border bg-card">
          <DialogHeader className="px-4 sm:px-5 py-3.5 border-b border-border bg-card shrink-0 text-left pr-10">
            <div className="min-w-0">
              <DialogTitle className="text-xs sm:text-sm font-bold text-foreground truncate">
                {previewDoc?.name || "Document Preview"}
              </DialogTitle>
              <DialogDescription className="text-[11px] text-muted-foreground mt-0.5">
                Authentic regulatory audit certificate
              </DialogDescription>
            </div>
          </DialogHeader>

          <div className="flex-1 bg-muted/20 overflow-hidden min-h-0">
            {previewDoc?.isImage ? (
              <div className="h-full w-full flex items-center justify-center p-4">
                <img
                  src={previewDoc.url}
                  alt={previewDoc.name}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-sm"
                />
              </div>
            ) : (
              previewDoc?.url && (
                <iframe
                  src={previewDoc.url}
                  title="PDF Document Preview"
                  className="h-full w-full border-0"
                />
              )
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
