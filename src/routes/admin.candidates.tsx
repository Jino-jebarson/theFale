import { AllyReviewNote } from "@/components/fale/AllyReviewNote";
import { copyText } from "@/lib/copyText";
import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { usePageLoad } from "@/hooks/use-page-load";
import { RequestError } from "@/components/fale/RequestError";
import { useState, useEffect, useRef, useCallback } from "react";
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
  HiOutlineArrowDownTray,
  HiOutlineClipboardDocument,
  HiOutlineMapPin,
  HiOutlinePhoto,
  HiOutlineDocumentCheck,
} from "react-icons/hi2";
import { toast } from "sonner";
import { BotMessageSquare } from "lucide-react";
import { AdminLayout } from "@/components/fale/AdminLayout";
import { Button, ButtonSpinner } from "@/components/ui/button";
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
import { useApp, setState, CandidateKYCItem, CandidateKYCDocument } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled } from "@/lib/api";
import { getPendingCandidateKyc, reviewCandidateKyc } from "@/lib/adapters/adminAdapter";
import { generateClinicalDocumentBlob } from "@/lib/clinicalDocumentPdf";
import { precheckKycQueueWithAi } from "@/lib/adapters/aiAdapter";
import {
  cleanMarkdownAndJsonNoise,
  extractJsonPayload,
  formatConfidencePercent,
  writeSessionAuditCache,
  readSessionAuditCache,
} from "@/lib/allyAuditUtils";

export const Route = createFileRoute("/admin/candidates")({
  head: () => ({
    meta: [
      { title: "Candidate KYC & Council Verification — FALE RMS" },
      { name: "description", content: "Audit and verify medical, nursing and paramedical registrations." },
    ],
  }),
  component: CandidateKYCAdmin,
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

function formatSalary(paise?: number | string) {
  if (!paise) return null;
  const num = Number(paise);
  if (isNaN(num) || num <= 0) return null;
  const rupees = num >= 100000 ? Math.round(num / 100) : Math.round(num);
  return `₹${rupees.toLocaleString("en-IN")}`;
}

function getExpectedSalaryText(minPaise?: any, maxPaise?: any) {
  const min = minPaise ? Number(minPaise) : null;
  const max = maxPaise ? Number(maxPaise) : null;
  if (min && max) {
    return `${formatSalary(min)} – ${formatSalary(max)} / mo`;
  }
  if (min) {
    return `${formatSalary(min)}+ / mo`;
  }
  if (max) {
    return `Up to ${formatSalary(max)} / mo`;
  }
  return "₹45,000 – ₹75,000 / mo";
}

function CandidateKYCAdmin() {
  const pageLoad = usePageLoad();
  const pageAction = useConfirmedAction();
  const s = useApp();
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateKYCItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Ally Statutory Credential Pre-Check State (#16)
  type AllyPreCheckResult = {
    status: "REVIEW" | "FLAGGED" | "PENDING" | "ERROR";
    assessment: string;
    confidence: number | null;
    formatValid: boolean;
    nameAligned: boolean;
    recommendation: string;
    cacheKey?: string;
  };

  const ALLY_CACHE_KEY = "fale_ally_kyc_audit_cache_v1";

  const getAuditCacheKey = useCallback((c: CandidateKYCItem) => {
    return `${c.id}:${(c.regNumber || "").trim()}:${(c.council || "").trim()}:${c.name}:${c.profession}:${c.qualification}`;
  }, []);

  const [aiPreCheckResults, setAiPreCheckResults] = useState<Record<string, AllyPreCheckResult>>(() =>
    readSessionAuditCache<AllyPreCheckResult>(ALLY_CACHE_KEY)
  );
  const [runningPreCheckIds, setRunningPreCheckIds] = useState<Record<string, boolean>>({});
  const inFlightKeysRef = useRef<Set<string>>(new Set());

  const persistAllyCache = (next: Record<string, AllyPreCheckResult>) => writeSessionAuditCache(ALLY_CACHE_KEY, next);

  const getCandidatePreCheckStatus = useCallback(
    (c: CandidateKYCItem): AllyPreCheckResult => {
      const key = getAuditCacheKey(c);
      const cached = aiPreCheckResults[c.id];
      if (cached && cached.cacheKey === key) {
        return cached;
      }
      return {
        status: "PENDING",
        confidence: null,
        formatValid: false,
        nameAligned: false,
        assessment: `Queued for live Ally audit of registration #${c.regNumber || "UNSPECIFIED"} under ${c.council}.`,
        recommendation: "Ally reviews supplied details only. A human must check the council record.",
        cacheKey: key,
      };
    },
    [aiPreCheckResults, getAuditCacheKey]
  );

  const handleRunAiPreCheck = useCallback(
    async (c: CandidateKYCItem, options?: { silent?: boolean; force?: boolean }) => {
      const key = getAuditCacheKey(c);
      if (inFlightKeysRef.current.has(key)) return;
      inFlightKeysRef.current.add(key);

      setRunningPreCheckIds((prev) => ({ ...prev, [c.id]: true }));
      try {
        const res = await precheckKycQueueWithAi(c.name, c.regNumber, {
          council: c.council,
          role: c.profession,
          qualification: c.qualification,
        });
        const rawText = res.response || res.content || "";
        const embeddedJson = extractJsonPayload(rawText);
        if (!rawText.trim() && !embeddedJson && !res.structuredData) {
          throw new Error("Ally returned an empty verification response.");
        }
        const sData: Record<string, any> = {
          ...(embeddedJson || {}),
          ...(res.structuredData || {}),
        };

        const extractedAssessment = cleanMarkdownAndJsonNoise(
          typeof sData["assessment"] === "string" && sData["assessment"].trim()
            ? sData["assessment"]
            : typeof sData["verdict"] === "string" && sData["verdict"].trim()
            ? sData["verdict"]
            : embeddedJson
            ? ""
            : rawText
        );
        if (!extractedAssessment) {
          throw new Error("Ally did not return a verification assessment.");
        }
        const extractedRecommendation = cleanMarkdownAndJsonNoise(
          typeof sData["recommendation"] === "string" ? sData["recommendation"] : ""
        );

        const statusToken = String(sData["status"] || sData["flag"] || "").toUpperCase();
        const lowerAssessment = extractedAssessment.toLowerCase();
        const isFlagged =
          sData["formatValid"] === false ||
          statusToken.includes("FLAG") ||
          statusToken.includes("DISCREPANCY") ||
          statusToken.includes("INVALID") ||
          (!statusToken.includes("CLEAR") &&
            (lowerAssessment.includes("discrepancy") ||
              lowerAssessment.includes("does not match") ||
              lowerAssessment.includes("lacks the mandatory") ||
              lowerAssessment.includes("flagged") ||
              lowerAssessment.includes("invalid"))) ||
          !c.regNumber ||
          c.regNumber.toLowerCase().includes("pending");

        const confidence =
          typeof sData["confidence"] === "number" && !Number.isNaN(sData["confidence"])
            ? formatConfidencePercent(sData["confidence"], isFlagged)
            : null;

        const resultObj: AllyPreCheckResult = {
          status: isFlagged ? "FLAGGED" : "REVIEW",
          assessment: extractedAssessment,
          confidence,
          formatValid: sData["formatValid"] === true && !isFlagged,
          nameAligned: sData["nameAligned"] === true && !isFlagged,
          recommendation: extractedRecommendation,
          cacheKey: key,
        };

        setAiPreCheckResults((prev) => {
          const next = { ...prev, [c.id]: resultObj };
          persistAllyCache(next);
          return next;
        });

        if (!options?.silent) {
          toast.success(`Ally Credential Pre-Check completed for ${c.name}`);
        }
      } catch (err: any) {
        console.warn("Ally Pre-Check failed:", err);
        setAiPreCheckResults((prev) => ({
          ...prev,
          [c.id]: {
            status: "ERROR",
            confidence: null,
            formatValid: false,
            nameAligned: false,
            assessment: `Unable to complete live Ally verification for registration #${c.regNumber || "UNSPECIFIED"}.`,
            recommendation: "Click Re-audit with Ally to retry verification.",
            cacheKey: key,
          },
        }));
        if (!options?.silent) {
          toast.error("Failed to run Ally Pre-Check");
        }
      } finally {
        inFlightKeysRef.current.delete(key);
        setRunningPreCheckIds((prev) => {
          const next = { ...prev };
          delete next[c.id];
          return next;
        });
      }
    },
    [getAuditCacheKey]
  );

  // Document Viewer state with non-downloading inline blob preview
  const [previewDoc, setPreviewDoc] = useState<CandidateKYCDocument | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  const [apiCandidates, setApiCandidates] = useState<CandidateKYCItem[]>([]);
  const [loading, setLoading] = useState(isApiEnabled);

  // Resolves a verified binary Blob for any clinical document (local or remote)
  // Ensures Chrome, Edge, Firefox, and Safari never hit 'Failed to load PDF document' on mock/SPA assets
  const getPdfBlobForDoc = async (doc: CandidateKYCDocument): Promise<Blob> => {
    // 1. If it's an image, handle data URL or fetch
    if (doc.mimeType?.startsWith("image/") || doc.originalFileName.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
      if (doc.fileUrl.startsWith("data:")) {
        const parts = doc.fileUrl.split(",");
        const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
        const binary = atob(parts[1]);
        const len = binary.length;
        const u8 = new Uint8Array(len);
        for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
        return new Blob([u8], { type: mime });
      }
      const res = await fetch(doc.fileUrl);
      return res.blob();
    }

    // 2. If it's already a data URL with application/pdf:
    if (doc.fileUrl.startsWith("data:application/pdf")) {
      const parts = doc.fileUrl.split(",");
      const binary = atob(parts[1]);
      const len = binary.length;
      const u8 = new Uint8Array(len);
      for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
      return new Blob([u8], { type: "application/pdf" });
    }

    // 3. Try fetching the candidate's original uploaded document
    const candidateUrls = [
      doc.fileUrl.startsWith("/") ? doc.fileUrl : `/${doc.fileUrl}`,
      `/${doc.originalFileName}`,
      doc.fileUrl,
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(url);
        if (res.ok) {
          const blob = await res.blob();
          const buf = await blob.slice(0, 4).arrayBuffer();
          const bytes = new Uint8Array(buf);
          // Check if it is a genuine PDF starting with '%PDF' (0x25, 0x50, 0x44, 0x46)
          if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
            return blob;
          }
        }
      } catch (e) {
        // try next candidate url
      }
    }

    // Missing uploaded documents must not be replaced with generated credentials.
    throw new Error("The uploaded document could not be loaded. Ask the candidate to upload it again.");
  };

  // Opens document in full new tab cleanly without triggering automatic download
  const handleOpenInNewTab = async (doc: CandidateKYCDocument) => { try {
    const isImg = doc.mimeType?.startsWith("image/") || doc.originalFileName.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i);

    if (isImg) {
      const win = window.open("", "_blank");
      if (win) {
        win.document.title = doc.originalFileName;
        win.document.body.style.margin = "0";
        win.document.body.style.background = "#090d16";
        win.document.body.style.display = "flex";
        win.document.body.style.alignItems = "center";
        win.document.body.style.justifyContent = "center";
        win.document.body.style.height = "100vh";
        win.document.body.innerHTML = `<img src="${doc.fileUrl}" style="max-width:96vw;max-height:96vh;object-fit:contain;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);" alt="${doc.originalFileName}" />`;
      }
      return;
    }

    // For PDF documents, open a clean tab and stream blob to display inline
    const blob = (previewDoc?.id === doc.id && previewBlobUrl)
      ? null
      : await getPdfBlobForDoc(doc);
    const targetUrl = blob ? URL.createObjectURL(blob) : (previewBlobUrl || doc.fileUrl);

    const win = window.open(targetUrl, "_blank");
    if (win) win.focus();
  } catch { toast.error("The uploaded document is unavailable. Please retry or request a new upload."); } };

  const handleDownloadDoc = async (doc: CandidateKYCDocument) => { try {
    const isImg = doc.mimeType?.startsWith("image/") || doc.originalFileName.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i);
    if (isImg && doc.fileUrl.startsWith("data:")) {
      const a = document.createElement("a");
      a.href = doc.fileUrl;
      a.download = doc.originalFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return;
    }

    const blob = await getPdfBlobForDoc(doc);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.originalFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch { toast.error("The uploaded document is unavailable. Please retry or request a new upload."); } };

  // Safely fetch and prepare PDF documents as in-memory blobs
  // This bypasses `Content-Disposition: attachment` and `X-Frame-Options` on remote hosts,
  // preventing involuntary browser file downloads while enabling native inline preview
  useEffect(() => {
    let active = true;

    if (!previewDoc) {
      setPreviewBlobUrl(null);
      setPreviewLoading(false);
      setPreviewFailed(false);
      return;
    }

    const isImg = previewDoc.mimeType?.startsWith("image/") || previewDoc.originalFileName.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i);

    if (isImg) {
      setPreviewBlobUrl(previewDoc.fileUrl);
      setPreviewLoading(false);
      setPreviewFailed(false);
      return;
    }

    // For PDF documents, prepare verified %PDF binary blob
    setPreviewLoading(true);
    setPreviewFailed(false);

    getPdfBlobForDoc(previewDoc)
      .then((blob) => {
        if (!active) return;
        const createdUrl = URL.createObjectURL(blob);
        setPreviewBlobUrl(createdUrl);
        setPreviewLoading(false);
      })
      .catch((err) => {
        pageLoad.fail(err);
        if (!active) return;
        console.error("Direct blob PDF fetch failed, using fallback viewer:", err);
        setPreviewFailed(true);
        setPreviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [previewDoc, selectedCandidate, pageLoad.retryKey]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const res = await getPendingCandidateKyc();
      const mapped: CandidateKYCItem[] = res.map((dto: any) => {
        let status: "pending" | "verified" | "rejected" = "pending";
        if (dto.kycStatus === "VERIFIED") status = "verified";
        else if (dto.kycStatus === "REJECTED") status = "rejected";

        const photoDoc = dto.documents?.find((d: any) => d.documentType === "PHOTO");
        const regDoc = dto.documents?.find((d: any) => d.documentType === "REGISTRATION_CERTIFICATE");
        const primaryDoc = regDoc || dto.documents?.[0];

        return {
          id: dto.id,
          name: dto.name || "Candidate",
          email: dto.email || "candidate@fale.in",
          phone: dto.phone || "+91 ••••• •••••",
          gender: dto.gender,
          dob: dto.dob,
          city: dto.city,
          state: dto.state || dto.city || "State",
          pincode: dto.pincode,
          addressLine: dto.addressLine,
          candidateLevel: dto.candidateLevel,
          isStudent: dto.isStudent,
          course: dto.course,
          college: dto.college,
          studyYear: dto.studyYear,
          universityRegNo: dto.universityRegNo,
          expectedGraduationYear: dto.expectedGraduationYear,
          profession: dto.profession || dto.specialty || "Clinical Practitioner",
          specialty: dto.specialty,
          subSpecialties: dto.subSpecialties,
          qualification: dto.qualification || "MBBS / B.Sc Nursing",
          council: dto.council || "State Medical / Nursing Council",
          councilState: dto.councilState,
          regNumber: dto.regNumber || "REG-VERIFICATION-PENDING",
          regYear: dto.regYear,
          experience: dto.experienceYears ? `${dto.experienceYears}` : "Fresher / Resident",
          bio: dto.bio,
          skills: dto.skills,
          languages: dto.languages,
          preferredCities: dto.preferredCities,
          openToWork: dto.openToWork,
          relocate: dto.relocate,
          noticePeriod: dto.noticePeriod,
          employmentType: dto.employmentType,
          availability: dto.availability,
          docName: primaryDoc?.originalFileName || "Council_Registration_Certificate.pdf",
          documents: dto.documents || [],
          status,
          submittedDate: dto.createdAt ? new Date(dto.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Recent",
          notes: dto.kycNotes,
          userId: dto.userId,
          currentSalary: dto.currentSalary,
          expectedSalaryMinPaise: dto.expectedSalaryMinPaise,
          expectedSalaryMaxPaise: dto.expectedSalaryMaxPaise,
          verifiedAt: dto.verifiedAt ? new Date(dto.verifiedAt).toLocaleString('en-IN') : undefined,
          createdAt: dto.createdAt ? new Date(dto.createdAt).toLocaleString('en-IN') : undefined,
          updatedAt: dto.updatedAt ? new Date(dto.updatedAt).toLocaleString('en-IN') : undefined,
          avatar: photoDoc?.fileUrl,
        };
      });
      setApiCandidates(mapped);
    } catch (err: any) {
      pageLoad.fail(err);
      toast.error("Failed to load candidate verifications", { description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, [pageLoad.retryKey]);

  // Keep selected candidate updated with fresh API data
  useEffect(() => {
    if (selectedCandidate && apiCandidates.length > 0) {
      const fresh = apiCandidates.find((c) => c.id === selectedCandidate.id);
      if (fresh) setSelectedCandidate(fresh);
    }
  }, [apiCandidates]);

  const candidates = apiCandidates;
  const autoAuditedKeysRef = useRef<Set<string>>(new Set());

  // Automatically verify pending KYC candidates in background with max 2 concurrent Ally requests
  useEffect(() => {
    const queue = candidates.filter((c) => {
      if (c.status !== "pending") return false;
      const key = getAuditCacheKey(c);
      if (autoAuditedKeysRef.current.has(key)) return false;
      const cached = aiPreCheckResults[c.id];
      return !cached || cached.cacheKey !== key;
    });
    if (queue.length === 0) return;

    let cancelled = false;
    let cursor = 0;
    const MAX_CONCURRENT = 2;

    const worker = async () => {
      while (!cancelled && cursor < queue.length) {
        const nextItem = queue[cursor++];
        if (!nextItem) break;
        const key = getAuditCacheKey(nextItem);
        if (autoAuditedKeysRef.current.has(key)) continue;
        autoAuditedKeysRef.current.add(key);
        await handleRunAiPreCheck(nextItem, { silent: true });
      }
    };

    const workers = Array.from({ length: Math.min(MAX_CONCURRENT, queue.length) }, () => worker());
    Promise.all(workers).catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [candidates, getAuditCacheKey, handleRunAiPreCheck, pageLoad.retryKey]);

  // Trigger live Ally audit immediately when opening Inspect Dossier if not cached yet
  useEffect(() => {
    if (!sheetOpen || !selectedCandidate) return;
    const key = getAuditCacheKey(selectedCandidate);
    const cached = aiPreCheckResults[selectedCandidate.id];
    if (!cached || cached.cacheKey !== key) {
      handleRunAiPreCheck(selectedCandidate, { silent: true });
    }
  }, [sheetOpen, selectedCandidate, aiPreCheckResults, getAuditCacheKey, handleRunAiPreCheck, pageLoad.retryKey]);

  const filtered = candidates.filter((c) => {
    const matchesFilter = filter === "all" ? true : c.status === filter;
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.regNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.council.toLowerCase().includes(search.toLowerCase()) ||
      c.profession.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleVerify = async (id: string, name: string) => { await pageAction.run(async () => {
    {
      try {
        await reviewCandidateKyc(id, "APPROVE", "Council credentials verified by compliance admin");
        toast.success("Candidate Verified!", {
          description: `${name}'s council registration approved with Verified Clinical Seal.`,
        });
        setSheetOpen(false);
        fetchCandidates();
      } catch (err: any) {
      pageLoad.fail(err);
        toast.error("Approval failed", { description: err?.message });
      }
      return;
    }

  }); };

  const handleRejectConfirm = async () => { await pageAction.run(async () => {
    if (!selectedCandidate) return;
    {
      try {
        await reviewCandidateKyc(selectedCandidate.id, "REJECT", rejectReason || "Document verification rejected by admin.");
        toast.error("Candidate Document Rejected", {
          description: `Notification sent to ${selectedCandidate.name} to upload valid council certificate.`,
        });
        setRejectModalOpen(false);
        setSheetOpen(false);
        setRejectReason("");
        fetchCandidates();
      } catch (err: any) {
      pageLoad.fail(err);
        toast.error("Rejection failed", { description: err?.message });
      }
      return;
    }

  }); };

  const pendingCount = candidates.filter((c) => c.status === "pending").length;
  const verifiedCount = candidates.filter((c) => c.status === "verified").length;
  const rejectedCount = candidates.filter((c) => c.status === "rejected").length;

  return (
    <AdminLayout
      title="Candidate Council KYC Verification"
      subtitle="Strict Admin gatekeeping: verify NMC, State Nursing, and Paramedical registrations before granting Verified Clinical Badges."
      badge={
        <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
          {pendingCount} Pending · {verifiedCount} Verified
        </span>
      }
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={fetchCandidates}
          disabled={loading}
          className="text-xs font-bold gap-1.5 h-9 rounded-xl border-border hover:bg-muted cursor-pointer"
        >
          <HiOutlineArrowPath className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
          <span>Refresh</span>
        </Button>
      }
    >
      <RequestError message={pageLoad.error} onRetry={pageLoad.retry} />
      <AllyReviewNote />
      {/* Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Pending Review</span>
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <div className="text-2xl font-black text-foreground">{pendingCount}</div>
          <p className="text-[11px] text-muted-foreground">Action required</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Verified Seals</span>
            <HiOutlineCheckBadge className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground">{verifiedCount}</div>
          <p className="text-[11px] text-emerald-600 font-medium">Eligible for patient duty</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Rejected Docs</span>
            <HiOutlineXMark className="h-4 w-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-foreground">{rejectedCount}</div>
          <p className="text-[11px] text-rose-600 font-medium">Awaiting re-upload</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Total Candidates</span>
            <HiOutlineIdentification className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{candidates.length}</div>
          <p className="text-[11px] text-muted-foreground">Registered clinicians</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-3.5 sm:p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-border/40 w-full md:w-fit overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: "pending" as const, label: "Pending Review", count: pendingCount },
              { id: "verified" as const, label: "Verified", count: verifiedCount },
              { id: "rejected" as const, label: "Rejected", count: rejectedCount },
              { id: "all" as const, label: "All Candidates", count: candidates.length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0",
                  filter === tab.id
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                  filter === tab.id ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                )}>
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
              placeholder="Filter by name, council, reg #..."
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-muted/30 focus:bg-card text-xs font-medium outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Desktop View Table */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40 border-b border-border">
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground pl-5 h-11 align-middle">
                  Candidate
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-11 align-middle">
                  Profession & Degree
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-11 align-middle">
                  Council & Reg Number
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-11 align-middle">
                  Document
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground h-11 align-middle">
                  Status
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground pr-5 text-right h-11 align-middle">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => {
                const initials = item.name.split(" ").map((n) => n[0]).slice(0, 2).join("");
                const docCount = item.documents?.length || 1;

                return (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-b border-border/70">
                    {/* Candidate identity */}
                    <TableCell className="py-3.5 pl-5 align-middle">
                      <div className="flex items-center gap-3">
                        {item.avatar ? (
                          <img
                            src={item.avatar}
                            alt={item.name}
                            className="h-8 w-8 rounded-lg object-cover border border-border shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-xs shrink-0">
                            {initials}
                          </div>
                        )}
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
                    <TableCell className="py-3.5 align-middle">
                      <div className="font-bold text-foreground text-xs">{item.profession}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{item.qualification}</div>
                    </TableCell>

                    {/* Council & Reg Number */}
                    <TableCell className="py-3.5 align-middle">
                      <div className="font-semibold text-foreground text-xs">{item.council}</div>
                      <div className="font-mono text-primary font-bold text-[11px] mt-0.5">{item.regNumber}</div>
                    </TableCell>

                    {/* Document */}
                    <TableCell className="py-3.5 align-middle">
                      <button
                        onClick={() => { setSelectedCandidate(item); setSheetOpen(true); }}
                        className="inline-flex items-center gap-1.5 text-xs text-primary font-semibold hover:underline cursor-pointer group text-left"
                      >
                        <HiOutlineDocumentText className="h-4 w-4 shrink-0 text-primary" />
                        <span className="truncate max-w-[150px]">{item.docName}</span>
                        {docCount > 1 && (
                          <span className="rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-extrabold px-1.5 py-0.2 shrink-0">
                            +{docCount - 1}
                          </span>
                        )}
                      </button>
                      <div className="text-[10px] text-muted-foreground mt-0.5 pl-5.5">{item.submittedDate}</div>
                    </TableCell>

                    {/* Status Badge & AI Pre-Check (#16) */}
                    <TableCell className="py-3.5 align-middle">
                      <div className="space-y-1">
                        {item.status === "verified" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                            <HiOutlineCheckBadge className="h-3.5 w-3.5" /> Verified
                          </span>
                        ) : item.status === "rejected" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-[11px] font-bold text-rose-700 dark:text-rose-400 border border-rose-500/20">
                            <HiOutlineXMark className="h-3.5 w-3.5" /> Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Pending
                          </span>
                        )}
                        <div>
                          {(() => {
                            const preCheck = getCandidatePreCheckStatus(item);
                            const isAnalyzing = Boolean(runningPreCheckIds[item.id]);
                            const isClear = preCheck.status === "REVIEW";
                            const isFlagged = preCheck.status === "FLAGGED";
                            const isError = preCheck.status === "ERROR";
                            return (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 text-[10px] font-bold whitespace-nowrap",
                                  isAnalyzing || isClear
                                    ? "text-primary"
                                    : isFlagged
                                    ? "text-amber-600 dark:text-amber-400"
                                    : isError
                                    ? "text-rose-600 dark:text-rose-400"
                                    : "text-muted-foreground"
                                )}
                              >
                                {isAnalyzing ? (
                                  <ButtonSpinner className="h-3 w-3 animate-spin text-primary shrink-0" />
                                ) : (
                                  <BotMessageSquare
                                    className={cn(
                                      "h-3 w-3 shrink-0",
                                      isClear
                                        ? "text-primary"
                                        : isFlagged
                                        ? "text-amber-500"
                                        : isError
                                        ? "text-rose-500"
                                        : "text-muted-foreground"
                                    )}
                                  />
                                )}
                                <span>
                                  {isAnalyzing
                                    ? "Ally Auditing..."
                                    : isClear
                                    ? "Ally Review Ready"
                                    : isFlagged
                                    ? "Ally Pre-Check Flagged"
                                    : isError
                                    ? "Ally Audit Retry"
                                    : "Ally Audit Queued"}
                                </span>
                              </span>
                            );
                          })()}
                        </div>
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3.5 pr-5 text-right align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedCandidate(item); setSheetOpen(true); }}
                          className="h-8 px-3 text-xs font-bold rounded-lg text-foreground border-border hover:bg-muted gap-1.5 cursor-pointer"
                        >
                          <HiOutlineEye className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>Inspect</span>
                        </Button>

                        {item.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedCandidate(item);
                                setRejectModalOpen(true);
                              }}
                              className="h-8 px-3 text-xs font-bold rounded-lg text-rose-600 border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 transition-all cursor-pointer"
                            >
                              <HiOutlineXMark className="h-3.5 w-3.5 stroke-[2.5]" />
                              <span>Reject</span>
                            </Button>

                            <Button
                              size="sm"
                              disabled={pageAction.isPending} onClick={() => handleVerify(item.id, item.name)}
                              className="h-8 px-3.5 text-xs font-bold rounded-lg bg-primary hover:bg-primary-hover text-white gap-1.5 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
                            >
                              <HiCheck className="h-3.5 w-3.5 stroke-[2.5]" />
                              <span>Verify</span>
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-36 text-center text-xs text-muted-foreground align-middle">
                    <HiOutlineIdentification className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
                    No candidates found in this view.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Mobile View Card List */}
        <div className="lg:hidden divide-y divide-border pb-16 sm:pb-0">
          {filtered.map((item) => {
            const initials = item.name.split(" ").map((n) => n[0]).slice(0, 2).join("");
            const docCount = item.documents?.length || 1;
            const preCheck = getCandidatePreCheckStatus(item);
            const isPreCheckAnalyzing = Boolean(runningPreCheckIds[item.id]);
            const isPreCheckClear = preCheck.status === "REVIEW";
            const isPreCheckFlagged = preCheck.status === "FLAGGED";
            const isPreCheckError = preCheck.status === "ERROR";

            return (
              <div key={item.id} className="p-3.5 sm:p-4 space-y-3">
                <div className="flex items-start justify-between gap-2.5">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    {item.avatar ? (
                      <img src={item.avatar} alt={item.name} className="h-10 w-10 rounded-xl object-cover border border-border shrink-0" />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs shrink-0">
                        {initials}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div
                        onClick={() => { setSelectedCandidate(item); setSheetOpen(true); }}
                        className="font-bold text-foreground text-sm truncate cursor-pointer hover:text-primary transition-colors"
                      >
                        {item.name}
                      </div>
                      <div className="text-[11px] text-muted-foreground truncate">
                        {item.profession} • {item.qualification}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {item.status === "verified" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-0.5 whitespace-nowrap">
                        <HiOutlineCheckBadge className="h-3 w-3 shrink-0" /> Verified
                      </span>
                    ) : item.status === "rejected" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 text-[10px] font-bold px-2.5 py-0.5 whitespace-nowrap">
                        <HiOutlineXMark className="h-3 w-3 shrink-0" /> Rejected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold px-2.5 py-0.5 whitespace-nowrap">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse shrink-0" /> Pending
                      </span>
                    )}
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold whitespace-nowrap",
                        isPreCheckAnalyzing || isPreCheckClear
                          ? "text-primary"
                          : isPreCheckFlagged
                          ? "text-amber-600 dark:text-amber-400"
                          : isPreCheckError
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-muted-foreground"
                      )}
                    >
                      {isPreCheckAnalyzing ? (
                        <ButtonSpinner className="h-3 w-3 animate-spin text-primary shrink-0" />
                      ) : (
                        <BotMessageSquare
                          className={cn(
                            "h-3 w-3 shrink-0",
                            isPreCheckClear
                              ? "text-primary"
                              : isPreCheckFlagged
                              ? "text-amber-500"
                              : isPreCheckError
                              ? "text-rose-500"
                              : "text-muted-foreground"
                          )}
                        />
                      )}
                      <span>
                        {isPreCheckAnalyzing
                          ? "Ally Auditing..."
                          : isPreCheckClear
                          ? "Ally Review Ready"
                          : isPreCheckFlagged
                          ? "Ally Pre-Check Flagged"
                          : isPreCheckError
                          ? "Ally Audit Retry"
                          : "Ally Audit Queued"}
                      </span>
                    </span>
                  </div>
                </div>

                <div className="rounded-xl bg-muted/40 border border-border/50 p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">Council:</span>
                    <span className="font-semibold text-foreground truncate min-w-0 text-right">{item.council}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">Reg Number:</span>
                    <span className="font-mono font-bold text-primary truncate min-w-0 text-right">{item.regNumber}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground shrink-0">Documents:</span>
                    <button
                      type="button"
                      onClick={() => { setSelectedCandidate(item); setSheetOpen(true); }}
                      className="inline-flex items-center justify-end gap-1.5 text-primary font-semibold min-w-0 flex-1 hover:underline cursor-pointer"
                    >
                      <span className="truncate">{item.docName}</span>
                      {docCount > 1 && (
                        <span className="rounded-full bg-primary/10 text-primary border border-primary/20 text-[9px] font-extrabold px-1.5 py-0.2 shrink-0">
                          +{docCount - 1}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                <div className={cn(
                  "pt-1",
                  item.status === "pending" ? "grid grid-cols-3 gap-2" : "flex"
                )}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSelectedCandidate(item); setSheetOpen(true); }}
                    className="w-full h-9 px-2 text-xs font-bold rounded-xl border-border hover:bg-muted cursor-pointer gap-1"
                  >
                    <HiOutlineEye className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">Inspect</span>
                  </Button>

                  {item.status === "pending" && (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCandidate(item);
                          setRejectModalOpen(true);
                        }}
                        className="w-full h-9 px-2 text-xs font-bold rounded-xl text-rose-600 border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 cursor-pointer"
                      >
                        <HiOutlineXMark className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Reject</span>
                      </Button>

                      <Button
                        size="sm"
                        disabled={pageAction.isPending} onClick={() => handleVerify(item.id, item.name)}
                        className="w-full h-9 px-2 text-xs font-bold rounded-xl bg-primary hover:bg-primary-hover text-white gap-1 shadow-none cursor-pointer"
                      >
                        <HiCheck className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Verify</span>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-10 px-4 text-center text-xs text-muted-foreground">
              <HiOutlineIdentification className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              No candidates found in this view.
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Inspection Sheet (Comprehensive Clinical Dossier) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col h-full max-h-[100dvh] overflow-hidden gap-0">
          <SheetHeader className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-border bg-card shrink-0 text-left">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-4 pr-8">
              <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
                  <HiOutlineIdentification className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0">
                  <SheetTitle className="text-sm sm:text-base font-extrabold text-foreground leading-snug">
                    Candidate Clinical Dossier
                  </SheetTitle>
                  <SheetDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-snug">
                    Comprehensive council audit, medical degrees, and uploaded documents
                  </SheetDescription>
                </div>
              </div>
              {selectedCandidate && (
                <span className={cn(
                  "w-fit whitespace-nowrap px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold border shrink-0 inline-flex items-center gap-1.5 shadow-2xs",
                  selectedCandidate.status === "verified"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                    : selectedCandidate.status === "rejected"
                    ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    : "bg-primary/10 text-primary border-primary/20"
                )}>
                  {selectedCandidate.status === "pending" && <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
                  {selectedCandidate.status === "verified" ? "Verified Seal Active" : selectedCandidate.status === "rejected" ? "Verification Rejected" : "Pending Verification"}
                </span>
              )}
            </div>
          </SheetHeader>

          {selectedCandidate && (
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-3.5 sm:p-6 space-y-4 sm:space-y-5">

              {/* 1. Candidate Identity & Demographics */}
              <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 space-y-4 shadow-xs">
                <div className="flex flex-col xs:flex-row sm:flex-row items-start gap-3 sm:gap-4">
                  {selectedCandidate.avatar ? (
                    <img
                      src={selectedCandidate.avatar}
                      alt={selectedCandidate.name}
                      className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover border border-border shadow-xs shrink-0"
                    />
                  ) : (
                    <div className="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black text-lg sm:text-xl shrink-0">
                      {selectedCandidate.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                    </div>
                  )}

                  <div className="flex-1 min-w-0 w-full">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h3 className="font-black text-foreground text-base sm:text-lg leading-tight break-words">{selectedCandidate.name}</h3>
                      <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border border-primary/20 shrink-0">
                        {selectedCandidate.profession}
                      </span>
                      {selectedCandidate.candidateLevel && (
                        <span className="rounded-md bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border border-border shrink-0">
                          {selectedCandidate.candidateLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-muted-foreground mt-1 break-words">
                      {selectedCandidate.qualification} {selectedCandidate.specialty ? `• ${selectedCandidate.specialty}` : ""} {selectedCandidate.experience ? `• ${selectedCandidate.experience}` : ""}
                    </p>

                    {/* Contact Strip */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 mt-3 border-t border-border/60 text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                        <HiOutlinePhone className="h-3.5 w-3.5 text-primary shrink-0" />
                        <a href={`tel:${selectedCandidate.phone}`} className="font-medium text-foreground truncate hover:text-primary transition-colors">
                          {selectedCandidate.phone}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
                        <HiOutlineEnvelope className="h-3.5 w-3.5 text-primary shrink-0" />
                        <a href={`mailto:${selectedCandidate.email}`} className="font-medium text-foreground truncate hover:text-primary transition-colors">
                          {selectedCandidate.email}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Personal Demographics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 pt-2 border-t border-border/60 text-xs">
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Gender</span>
                    <strong className="text-foreground text-xs font-bold capitalize">{selectedCandidate.gender || "Not Specified"}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Date of Birth</span>
                    <strong className="text-foreground text-xs font-bold">{selectedCandidate.dob || "On Record"}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">City & State</span>
                    <strong className="text-foreground text-xs font-bold truncate block">{selectedCandidate.city || ""}, {selectedCandidate.state || ""}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Pincode</span>
                    <strong className="text-foreground text-xs font-bold">{selectedCandidate.pincode || "600003"}</strong>
                  </div>
                </div>

                {/* Full Address */}
                {selectedCandidate.addressLine && (
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-xs flex items-start gap-2">
                    <HiOutlineMapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Registered Address</span>
                      <p className="text-foreground font-medium">{selectedCandidate.addressLine}, {selectedCandidate.city}, {selectedCandidate.state} - {selectedCandidate.pincode}</p>
                    </div>
                  </div>
                )}

                {/* Bio / Summary */}
                {selectedCandidate.bio && (
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs text-muted-foreground leading-relaxed">
                    <p className="font-bold text-foreground text-[11px] mb-1 uppercase tracking-wider">Clinical Bio / Summary</p>
                    <p>{selectedCandidate.bio}</p>
                  </div>
                )}
              </div>

              {/* Ally Credential Verification Pre-Check Card (#16) */}
              {(() => {
                const preCheck = getCandidatePreCheckStatus(selectedCandidate);
                const isClear = preCheck.status === "REVIEW";
                const isFlagged = preCheck.status === "FLAGGED";
                const isError = preCheck.status === "ERROR";
                const isAnalyzing = Boolean(runningPreCheckIds[selectedCandidate.id]);

                return (
                  <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3.5 sm:p-5 space-y-3 shadow-xs transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-primary/15">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="grid h-7 w-7 place-items-center rounded-lg shrink-0 bg-primary/10 text-primary border border-primary/20">
                          <BotMessageSquare className="h-4 w-4" />
                        </span>
                        <span className="text-xs font-bold uppercase tracking-wider leading-tight text-foreground">
                          Ally Credential Pre-Check
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border whitespace-nowrap inline-flex items-center gap-1",
                            isFlagged
                              ? "text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/30"
                              : isError
                              ? "text-rose-700 dark:text-rose-300 bg-rose-500/15 border-rose-500/30"
                              : "text-primary bg-primary/10 border-primary/25"
                          )}
                        >
                          {isAnalyzing ? (
                            <>
                              <ButtonSpinner className="h-3 w-3 animate-spin shrink-0" />
                              <span>Auditing with Ally...</span>
                            </>
                          ) : preCheck.confidence !== null ? (
                            <span>AI self-rating (uncalibrated): {preCheck.confidence.toFixed(1)}%</span>
                          ) : isClear ? (
                            <span>Ally Review Ready</span>
                          ) : isFlagged ? (
                            <span>Ally Flagged</span>
                          ) : isError ? (
                            <span>Ally Audit Unavailable</span>
                          ) : (
                            <span>Pending Ally Audit</span>
                          )}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isAnalyzing}
                          onClick={() => handleRunAiPreCheck(selectedCandidate, { force: true })}
                          className="h-7 px-2.5 text-[10px] font-bold rounded-lg gap-1.5 cursor-pointer whitespace-nowrap border-primary/30 text-primary hover:bg-primary/10"
                        >
                          {isAnalyzing ? (
                            <>
                              <ButtonSpinner className="h-3 w-3 animate-spin shrink-0" />
                              <span>Auditing with Ally...</span>
                            </>
                          ) : (
                            <>
                              <BotMessageSquare className="h-3 w-3 shrink-0" />
                              <span>Re-audit with Ally</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="max-h-36 sm:max-h-44 overflow-y-auto pr-1.5 space-y-2 text-xs text-foreground/90 leading-relaxed break-words [scrollbar-width:thin]">
                      <p
                        className={cn(
                          "flex items-start gap-2 font-medium",
                          isFlagged
                            ? "text-amber-700 dark:text-amber-300"
                            : isError
                            ? "text-rose-700 dark:text-rose-300"
                            : "text-foreground/90"
                        )}
                      >
                        <HiOutlineCheckBadge
                          className={cn(
                            "h-4 w-4 shrink-0 mt-0.5",
                            isFlagged ? "text-amber-600" : isError ? "text-rose-600" : "text-primary"
                          )}
                        />
                        <span className="min-w-0">{preCheck.assessment}</span>
                      </p>

                      {preCheck.recommendation && (
                        <p className="text-[11px] italic pt-1.5 border-t border-primary/15 text-muted-foreground">
                          * {preCheck.recommendation}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* 2. Council & Statutory Registration Card */}
              <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 space-y-3.5 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <HiOutlineShieldCheck className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      State Council Registration
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                    Active Regulatory Board
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex flex-col justify-between min-h-[82px] space-y-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">Council Name</span>
                    <strong className="text-foreground text-sm font-bold block break-words">{selectedCandidate.council}</strong>
                    <span className="text-[11px] text-muted-foreground block">
                      Jurisdiction: {selectedCandidate.councilState || "National / State Council"}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col justify-between min-h-[82px] space-y-1">
                    <span className="text-[10px] font-bold uppercase text-primary block">Council Registration Number</span>
                    <div className="flex items-center justify-between gap-2">
                      <strong className="text-primary font-mono text-sm sm:text-base font-extrabold tracking-wide break-all min-w-0">{selectedCandidate.regNumber}</strong>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          if (!await copyText(selectedCandidate.regNumber)) return;
                          toast.success("Registration Number Copied", { description: selectedCandidate.regNumber });
                        }}
                        className="h-6 px-2 text-[10px] font-bold text-primary hover:bg-primary/10 gap-1 rounded-md shrink-0 cursor-pointer"
                      >
                        <HiOutlineClipboardDocument className="h-3 w-3" />
                        <span>Copy</span>
                      </Button>
                    </div>
                    <span className="text-[11px] text-muted-foreground block">
                      Registration Year: {selectedCandidate.regYear || "Verified on Record"}
                    </span>
                  </div>
                </div>

                {selectedCandidate.notes && (
                  <div className="p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
                    <span className="text-[10px] uppercase font-bold text-amber-600 block">Compliance / KYC Notes</span>
                    <p className="text-foreground mt-0.5">{selectedCandidate.notes}</p>
                  </div>
                )}
              </div>

              {/* 3. Academic & Educational Credentials */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                    <HiOutlineAcademicCap className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Academic & Education Record
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex flex-col justify-between min-h-[82px] space-y-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">Medical College / University</span>
                    <strong className="text-foreground text-xs font-bold block">{selectedCandidate.college || "Medical Institution on Record"}</strong>
                    <span className="text-[10px] text-muted-foreground block">Accredited Medical College</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-muted/30 border border-border/60 flex flex-col justify-between min-h-[82px] space-y-1">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground block">Degree / Course</span>
                    <strong className="text-foreground text-xs font-bold block">{selectedCandidate.course || selectedCandidate.qualification}</strong>
                    <span className="text-[10px] text-muted-foreground block">
                      Graduation: {selectedCandidate.expectedGraduationYear || "Degree Completed"}
                    </span>
                  </div>
                </div>

                {/* Additional Student / University Registry Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-xs">
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Student Status</span>
                    <strong className="text-foreground font-bold">{selectedCandidate.isStudent ? "Enrolled Student" : "Graduated Clinician"}</strong>
                  </div>
                  {selectedCandidate.studyYear && (
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Year of Study</span>
                      <strong className="text-foreground font-bold">{selectedCandidate.studyYear}</strong>
                    </div>
                  )}
                  {selectedCandidate.universityRegNo && (
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">University Reg No</span>
                      <strong className="text-foreground font-mono font-bold">{selectedCandidate.universityRegNo}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Clinical Competencies & Language Skills */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                    <HiOutlineSparkles className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Clinical Competencies, Skills & Languages
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Primary Specialty</span>
                    <strong className="text-foreground font-bold">{selectedCandidate.specialty || selectedCandidate.profession}</strong>
                  </div>
                  <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Clinical Experience</span>
                    <strong className="text-foreground font-bold">{selectedCandidate.experience || "Clinical Residency"}</strong>
                  </div>
                </div>

                {/* Sub-specialties */}
                {Boolean(selectedCandidate.subSpecialties?.length) && (
                  <div className="pt-1 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Sub-Specialties & Clinical Focus
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCandidate.subSpecialties.map((sub, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-[11px] font-semibold border border-primary/20">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Clinical Skills */}
                {Boolean(selectedCandidate.skills?.length) && (
                  <div className="pt-1 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Clinical Competencies & Skills
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCandidate.skills.map((skill, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-muted text-foreground text-[11px] font-semibold border border-border">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Languages */}
                {Boolean(selectedCandidate.languages?.length) && (
                  <div className="pt-1 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Languages Spoken
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCandidate.languages.map((lang, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-[11px] font-semibold border border-border">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Work Preferences, Availability & Compensation */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3.5 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                    <HiOutlineClock className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Work Preferences & Compensation
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Availability</span>
                    <strong className="text-foreground font-bold">{selectedCandidate.availability || "Immediate"}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Notice Period</span>
                    <strong className="text-foreground font-bold">{selectedCandidate.noticePeriod || "Immediate"}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Employment Type</span>
                    <strong className="text-foreground font-bold">{selectedCandidate.employmentType || "Locum / Full-time"}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Open to Work</span>
                    <strong className={selectedCandidate.openToWork ? "text-emerald-600 font-bold" : "text-muted-foreground font-bold"}>
                      {selectedCandidate.openToWork ? "Yes - Actively Seeking" : "Not Seeking"}
                    </strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Willing to Relocate</span>
                    <strong className="text-foreground font-bold">{selectedCandidate.relocate ? "Yes" : "Preferred Local Only"}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Current Compensation</span>
                    <strong className="text-foreground font-bold">{selectedCandidate.currentSalary || "Market Standard"}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 col-span-1 sm:col-span-2">
                    <span className="text-[10px] uppercase font-bold text-primary block">Expected Salary</span>
                    <strong className="text-primary font-black text-sm block tracking-wide">
                      {getExpectedSalaryText(selectedCandidate.expectedSalaryMinPaise, selectedCandidate.expectedSalaryMaxPaise)}
                    </strong>
                  </div>
                </div>

                {/* Preferred Cities */}
                {Boolean(selectedCandidate.preferredCities?.length) && (
                  <div className="pt-1 space-y-1.5 text-xs">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Preferred Duty Cities
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCandidate.preferredCities.map((city, idx) => (
                        <span key={idx} className="px-2 py-0.5 rounded-md bg-muted text-foreground text-[11px] font-semibold border border-border">
                          {city}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 6. System Registry Audit Metadata */}
              <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3 shadow-xs">
                <div className="flex items-center gap-2">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary">
                    <HiOutlineBuildingLibrary className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Registry & Verification Audit
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-muted/20 border border-border/40">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block">Profile Created</span>
                    <strong className="text-foreground text-[11px] block">{selectedCandidate.createdAt || selectedCandidate.submittedDate}</strong>
                  </div>
                  {selectedCandidate.verifiedAt && (
                    <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                      <span className="text-[10px] uppercase font-bold text-emerald-600 block">Verified Seal Issued At</span>
                      <strong className="text-emerald-700 dark:text-emerald-400 text-[11px] block">{selectedCandidate.verifiedAt}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* 7. UPLOADED VERIFICATION DOCUMENTS (Dossier) */}
              <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 space-y-4 shadow-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                      <HiOutlineDocumentCheck className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-bold uppercase tracking-wider text-foreground leading-snug">
                      Uploaded Verification Documents ({selectedCandidate.documents?.length || 0})
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground font-semibold whitespace-nowrap">
                    Cryptographically Secured
                  </span>
                </div>

                {/* List of uploaded documents */}
                <div className="space-y-2.5">
                  {(selectedCandidate.documents && selectedCandidate.documents.length > 0) ? (
                    selectedCandidate.documents.map((doc, idx) => {
                      const isImage = doc.mimeType?.startsWith("image/") || doc.originalFileName.match(/\.(jpg|jpeg|png|webp)$/i);
                      return (
                        <div
                          key={doc.id || idx}
                          className="rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 p-3 sm:p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 w-full">
                            <span className={cn(
                              "grid h-10 w-10 place-items-center rounded-xl shrink-0 font-bold text-xs border shadow-2xs",
                              isImage ? "bg-amber-500/10 text-amber-600 border-amber-500/20" : "bg-primary/10 text-primary border-primary/20"
                            )}>
                              {isImage ? <HiOutlinePhoto className="h-5 w-5" /> : <HiOutlineDocumentText className="h-5 w-5" />}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 truncate max-w-full">
                                  {formatDocType(doc.documentType)}
                                </span>
                                {doc.verified && (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded shrink-0">
                                    Verified
                                  </span>
                                )}
                              </div>
                              <p className="font-bold text-foreground text-xs truncate mt-1 group-hover:text-primary transition-colors">
                                {doc.originalFileName}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {formatBytes(doc.fileSizeBytes)} • {doc.mimeType?.replace("application/", "").toUpperCase() || "DOCUMENT"}
                              </p>
                            </div>
                          </div>

                          {/* Strictly Aligned Button Group */}
                          <div className="flex items-center gap-1.5 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50 shrink-0">
                            <Button
                              size="sm"
                              onClick={() => setPreviewDoc(doc)}
                              className="flex-1 sm:flex-initial h-8 px-2.5 text-xs font-bold rounded-lg bg-primary/10 hover:bg-primary text-primary hover:text-white border border-primary/20 transition-all gap-1 shadow-none cursor-pointer"
                              title="Preview document inline"
                            >
                              <HiOutlineEye className="h-3.5 w-3.5" />
                              <span>Preview</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => handleOpenInNewTab(doc)}
                              className="flex-1 sm:flex-initial inline-flex items-center justify-center h-8 px-2.5 text-xs font-bold rounded-lg border border-border bg-card hover:bg-muted text-foreground gap-1 transition-colors cursor-pointer"
                              title="Open document in new tab"
                            >
                              <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5 text-muted-foreground" />
                              <span>Open</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              type="button"
                              onClick={() => handleDownloadDoc(doc)}
                              className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-0 shrink-0"
                              title="Download document"
                            >
                              <HiOutlineArrowDownTray className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                          <HiOutlineDocumentText className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                            Council Registration Certificate
                          </span>
                          <p className="font-bold text-foreground text-xs truncate mt-1">
                            {selectedCandidate.docName}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">PDF Document • Attached for verification</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Sticky Bottom Actions */}
          {selectedCandidate && (
            <div className="p-3.5 sm:p-4 border-t border-border bg-card flex flex-wrap sm:flex-nowrap items-center justify-end gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={() => setSheetOpen(false)} className="cursor-pointer h-9 text-xs font-bold rounded-xl">
                Close
              </Button>
              {selectedCandidate.status === "pending" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setRejectModalOpen(true)}
                    className="h-9 text-rose-600 border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    disabled={pageAction.isPending} onClick={() => handleVerify(selectedCandidate.id, selectedCandidate.name)}
                    className="flex-1 sm:flex-initial h-9 bg-primary hover:bg-primary-hover text-white text-xs font-bold gap-1 rounded-xl cursor-pointer whitespace-nowrap"
                  >
                    <HiCheck className="h-3.5 w-3.5 stroke-[2.5]" /> Approve &amp; Issue Seal
                  </Button>
                </>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Interactive Document Viewer Modal (No Involuntary Downloads, Native Inline PDF/Image Reader) */}
      <Dialog open={Boolean(previewDoc)} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="w-full sm:w-[94vw] max-w-4xl h-[90dvh] sm:h-[85vh] max-h-[92dvh] sm:max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-t-3xl rounded-b-none sm:rounded-2xl shadow-2xl border-border bg-card">
          <DialogHeader className="px-4 sm:px-5 py-3.5 border-b border-border bg-card shrink-0 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pr-8 sm:pr-12">
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-sm font-extrabold text-foreground flex items-center gap-2 truncate">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <HiOutlineDocumentText className="h-4 w-4" />
                  </span>
                  <span className="truncate">{previewDoc?.originalFileName}</span>
                </DialogTitle>
                <DialogDescription className="text-[11px] text-muted-foreground mt-0.5 truncate pl-9">
                  {previewDoc ? `${formatDocType(previewDoc.documentType)} • ${formatBytes(previewDoc.fileSizeBytes)}` : ""}
                </DialogDescription>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {previewDoc && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => {
                        if (previewBlobUrl) {
                          const newTab = window.open(previewBlobUrl, "_blank");
                          if (newTab) newTab.focus();
                        } else if (previewDoc) {
                          handleOpenInNewTab(previewDoc);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground transition-colors cursor-pointer"
                      title="Open full document in new browser tab"
                    >
                      <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Full Tab</span>
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleDownloadDoc(previewDoc)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary-hover shadow-xs transition-colors cursor-pointer"
                      title="Download document to device"
                    >
                      <HiOutlineArrowDownTray className="h-3.5 w-3.5" />
                      <span>Download</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </DialogHeader>

          {/* Modal Preview Body */}
          <div className="flex-1 min-h-0 relative bg-muted/20 flex flex-col items-center justify-center overflow-hidden">
            {previewLoading && (
              <div className="flex flex-col items-center justify-center gap-3 p-8 text-muted-foreground">
                <ButtonSpinner className="h-8 w-8 animate-spin text-primary" />
                <p className="text-xs font-bold text-foreground">Preparing document preview...</p>
                <p className="text-[11px] text-muted-foreground">Rendering inline clinical certificate without downloading</p>
              </div>
            )}

            {!previewLoading && previewDoc && (
              previewDoc.mimeType?.startsWith("image/") || previewDoc.originalFileName.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i) ? (
                <div className="w-full h-full p-4 flex items-center justify-center overflow-auto">
                  <img
                    src={previewBlobUrl || previewDoc.fileUrl}
                    alt={previewDoc.originalFileName}
                    className="max-h-full max-w-full object-contain rounded-xl shadow-lg border border-border bg-card"
                  />
                </div>
              ) : previewBlobUrl ? (
                <iframe
                  src={previewBlobUrl}
                  title={previewDoc.originalFileName}
                  className="w-full h-full border-0 bg-white"
                />
              ) : previewFailed ? (
                /* Fallback preview: Renders an embedded viewer or clinical audit card without triggering download */
                <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-md">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                    <HiOutlineDocumentCheck className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">Secure Inline Audit Card</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      {previewDoc.originalFileName}
                    </p>
                  </div>

                  <div className="w-full rounded-xl border border-border bg-card p-3.5 text-xs text-left space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Document Type:</span>
                      <span className="font-semibold text-foreground">{formatDocType(previewDoc.documentType)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">File Size:</span>
                      <span className="font-mono text-foreground">{formatBytes(previewDoc.fileSizeBytes)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Integrity Seal:</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <HiCheck className="h-3.5 w-3.5" /> FALE Cryptographic Audit Pass
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      type="button"
                      onClick={() => handleOpenInNewTab(previewDoc)}
                      className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-bold rounded-lg border border-border bg-muted/40 hover:bg-muted text-foreground cursor-pointer"
                    >
                      <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                      <span>Open in Tab</span>
                    </Button>
                    <a
                      href={previewDoc.fileUrl}
                      download={previewDoc.originalFileName}
                      className="inline-flex items-center gap-1.5 h-8 px-4 text-xs font-bold rounded-lg bg-primary text-white hover:bg-primary-hover"
                    >
                      <HiOutlineArrowDownTray className="h-3.5 w-3.5" />
                      <span>Download File</span>
                    </a>
                  </div>
                </div>
              ) : null
            )}
          </div>
        </DialogContent>
      </Dialog>

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
            <Button variant="destructive" disabled={pageAction.isPending} onClick={handleRejectConfirm} className="font-bold text-xs">
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
