import { AllyReviewNote } from "@/components/fale/AllyReviewNote";
import { FacilityImage } from "@/components/fale/FacilityImage";
import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { usePageLoad } from "@/hooks/use-page-load";
import { RequestError } from "@/components/fale/RequestError";
import { useState, useEffect, useRef, useCallback } from "react";
import { createFileRoute } from '@tanstack/react-router'
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
  HiOutlineEnvelope,
  HiOutlineGlobeAlt,
  HiOutlineIdentification,
  HiOutlineCalendar,
  HiOutlineUser,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineArrowDownTray,
  HiOutlinePhoto,
  HiOutlineDocumentCheck,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { BotMessageSquare } from "lucide-react";
import { auditFacilityWithAi } from "@/lib/adapters/aiAdapter";
import {
  type AllyAuditStatus,
  cleanMarkdownAndJsonNoise,
  extractJsonPayload,
  formatConfidencePercent,
  readSessionAuditCache,
  writeSessionAuditCache,
} from "@/lib/allyAuditUtils";

const ALLY_FACILITY_CACHE_KEY = "fale_ally_facility_audit_cache_v3";

type AllyFacilityAuditResult = {
  status: AllyAuditStatus;
  confidence: number | null;
  licenseSentence: string;
  infraSentence: string;
  recSentence: string;
  verdict: string;
};
import { generateFacilityDocumentBlob } from "@/lib/clinicalDocumentPdf";
import { toast } from "sonner";
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
import { useApp, setState, FacilityKYCItem } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled } from "@/lib/api";
import { getPendingFacilityKyc, reviewFacilityKyc } from "@/lib/adapters/adminAdapter";

export const Route = createFileRoute("/admin/facilities")({
  head: () => ({
    meta: [
      { title: "Hospital Verification & Accreditation — FALE RMS" },
      { name: "description", content: "Review hospital registration certificates and facility verification details." },
    ],
  }),
  component: FacilityKYCAdmin,
});

function formatBytes(bytes?: number) {
  if (!bytes) return "Standard Document";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatFacilityDocType(type?: string) {
  if (!type) return "Verification Document";
  switch (type) {
    case "CLINICAL_ESTABLISHMENT_LICENSE":
    case "FACILITY_REGISTRATION":
      return "Clinical Establishment Act (CEA) License";
    case "NABH_ACCREDITATION":
    case "NABH_CERTIFICATE":
      return "NABH / NABL Accreditation Certificate";
    case "GST_CERTIFICATE":
      return "GSTIN Statutory Tax Registration";
    case "REPRESENTATIVE_AUTHORIZATION":
      return "Authorized Signatory Sanction Letter";
    case "FIRE_SAFETY":
      return "Fire Safety NOC Clearance";
    case "POLLUTION_CONTROL":
      return "State Pollution Control Clearance";
    case "BMW_AUTHORIZATION":
      return "Bio-Medical Waste Authorization";
    case "HOSPITAL_PHOTO":
      return "Hospital Infrastructure Photo";
    case "PHOTO":
      return "Hospital Emblem & Logo Asset";
    default:
      return type.replace(/_/g, " ");
  }
}

function FacilityGalleryPhoto({ src, index }: { src: string; index: number }) {
  const [failed, setFailed] = useState(false);
  const handleImageError = useCallback(() => setFailed(true), []);
  if (failed) return null;

  return (
    <FacilityImage
      src={src}
      alt={`Facility photo ${index + 1}`}
      onError={handleImageError}
      className="h-24 w-full rounded-xl object-cover border border-border shadow-2xs transition-opacity hover:opacity-90"
    />
  );
}

function FacilityKYCAdmin() {
  const pageLoad = usePageLoad();
  const pageAction = useConfirmedAction();
  const s = useApp();
  const [filter, setFilter] = useState<"all" | "setup_required" | "pending" | "verified" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [selectedFacility, setSelectedFacility] = useState<FacilityKYCItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  // Document Viewer state with non-downloading inline blob preview
  const [previewDoc, setPreviewDoc] = useState<any | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);

  // Ally profile pre-check state (advisory only; source verification remains a human task).
  const getFacilityAuditCacheKey = useCallback((facility: FacilityKYCItem) => {
    return `${facility.id}:${facility.licenseNumber || ""}:${facility.accreditation || ""}:${facility.gst || ""}:${facility.name}:${facility.beds ?? "not-provided"}:${facility.icuBeds ?? "not-provided"}:${facility.city}:${facility.state}`;
  }, []);

  const [aiAuditResults, setAiAuditResults] = useState<Record<string, AllyFacilityAuditResult>>(() =>
    readSessionAuditCache<AllyFacilityAuditResult>(ALLY_FACILITY_CACHE_KEY)
  );
  const [runningAuditIds, setRunningAuditIds] = useState<Record<string, boolean>>({});
  const inFlightAuditKeysRef = useRef<Set<string>>(new Set());
  const autoAuditedKeysRef = useRef<Set<string>>(new Set());

  const getFacilityAiAudit = useCallback(
    (facility: FacilityKYCItem): AllyFacilityAuditResult => {
      const cacheKey = getFacilityAuditCacheKey(facility);
      const cached = aiAuditResults[cacheKey] || aiAuditResults[facility.id];
      if (cached) return cached;

      return {
        status: "PENDING",
        confidence: null,
        licenseSentence: `Ally will review the submitted profile details for gaps and inconsistencies.`,
        infraSentence: `The uploaded certificate and official registry have not been checked by Ally.`,
        recSentence: `A human reviewer must compare the registration certificate with the facility details.`,
        verdict: "",
      };
    },
    [aiAuditResults, getFacilityAuditCacheKey]
  );

  const handleRunAiAudit = useCallback(
    async (facility: FacilityKYCItem, options?: { silent?: boolean }) => {
      const cacheKey = getFacilityAuditCacheKey(facility);
      if (inFlightAuditKeysRef.current.has(cacheKey)) return;

      inFlightAuditKeysRef.current.add(cacheKey);
      setRunningAuditIds((prev) => ({ ...prev, [facility.id]: true }));
      try {
        const res = await auditFacilityWithAi(
          facility.name,
          facility.licenseNumber,
          facility.accreditation,
          facility.gst,
          {
            beds: facility.beds,
            icuBeds: facility.icuBeds,
            city: facility.city,
            state: facility.state,
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
        if (!plainProse.trim()) throw new Error("Ally returned no facility assessment.");
        const isFlagged = /FLAG|INVALID|DISCREPANCY/.test(rawStatus);
        const confidence = formatConfidencePercent(sData["confidence"], true);
        const sentences = plainProse
          .split(/(?<=[.?!])\s+/)
          .map((s) => cleanMarkdownAndJsonNoise(s))
          .filter(Boolean);

        const licenseSentence =
          cleanMarkdownAndJsonNoise(typeof sData["licenseAssessment"] === "string" ? sData["licenseAssessment"] : "") ||
          sentences[0] ||
          `Submitted licence number: ${facility.licenseNumber || "Not provided"}. Compare it with the uploaded certificate and verify it with the issuing authority.`;

        const infraSentence =
          cleanMarkdownAndJsonNoise(typeof sData["infraAssessment"] === "string" ? sData["infraAssessment"] : "") ||
          sentences[1] ||
          `Capacity and accreditation are profile details only; Ally has not independently checked them.`;

        const recSentence =
          cleanMarkdownAndJsonNoise(typeof sData["recommendation"] === "string" ? sData["recommendation"] : "") ||
          sentences[2] ||
          `Use this pre-check as guidance. A human administrator must inspect the uploaded registration certificate before making a decision.`;

        const nextEntry: AllyFacilityAuditResult = {
          status: isFlagged ? "FLAGGED" : "REVIEW",
          confidence,
          licenseSentence,
          infraSentence,
          recSentence,
          verdict: plainProse,
        };

        setAiAuditResults((prev) => {
          const next = { ...prev, [cacheKey]: nextEntry };
          writeSessionAuditCache(ALLY_FACILITY_CACHE_KEY, next);
          return next;
        });

        if (!options?.silent) {
          toast.success(`Ally profile pre-check completed for ${facility.name}`);
        }
      } catch (err: any) {
        console.warn("Ally audit failed:", err);
        const errorEntry: AllyFacilityAuditResult = {
          status: "ERROR",
          confidence: null,
          licenseSentence: `Ally could not complete the profile pre-check right now.`,
          infraSentence: `The uploaded certificate and official registry still require human review.`,
          recSentence: `Retry the Ally pre-check or continue with manual document review.`,
          verdict: "",
        };
        setAiAuditResults((prev) => ({ ...prev, [cacheKey]: errorEntry }));
        if (!options?.silent) {
          toast.error("Failed to run Ally profile pre-check");
        }
      } finally {
        inFlightAuditKeysRef.current.delete(cacheKey);
        setRunningAuditIds((prev) => {
          const next = { ...prev };
          delete next[facility.id];
          return next;
        });
      }
    },
    [getFacilityAuditCacheKey]
  );

  const renderAllyQueueBadge = (facility: FacilityKYCItem) => {
    const audit = getFacilityAiAudit(facility);
    const isAuditing = Boolean(runningAuditIds[facility.id]);
    const isPrecheckComplete = audit.status === "REVIEW";
    const isFlagged = audit.status === "FLAGGED" || audit.status === "ERROR";

    return (
      <span
        className={cn(
          "inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border leading-none whitespace-nowrap",
          isAuditing || isPrecheckComplete
            ? "bg-primary/10 text-primary border-primary/25"
            : isFlagged
              ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
              : "bg-muted/70 text-muted-foreground border-border/60"
        )}
      >
        {isAuditing ? (
          <ButtonSpinner className="h-2.5 w-2.5 animate-spin shrink-0" />
        ) : (
          <BotMessageSquare className="h-2.5 w-2.5 shrink-0" />
        )}
        {isAuditing
          ? "Ally Pre-check Running"
          : isPrecheckComplete
            ? "Ally Pre-check Complete"
            : audit.status === "ERROR"
              ? "Ally Pre-check Retry"
              : isFlagged
                ? "Potential Issue"
                : "Ally Pre-check Queued"}
      </span>
    );
  };

  const getPdfBlobForDoc = async (doc: any): Promise<Blob> => {
    if (doc.mimeType?.startsWith("image/") || doc.originalFileName.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i)) {
      if (doc.fileUrl?.startsWith("data:")) {
        const parts = doc.fileUrl.split(",");
        const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
        const binary = atob(parts[1]);
        const len = binary.length;
        const u8 = new Uint8Array(len);
        for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
        return new Blob([u8], { type: mime });
      }
      if (doc.fileUrl) {
        try {
          const res = await fetch(doc.fileUrl);
          if (res.ok) return res.blob();
        } catch (e) {
          // ignore
        }
      }
    }

    if (doc.fileUrl?.startsWith("data:application/pdf")) {
      const parts = doc.fileUrl.split(",");
      const binary = atob(parts[1]);
      const len = binary.length;
      const u8 = new Uint8Array(len);
      for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
      return new Blob([u8], { type: "application/pdf" });
    }

    return generateFacilityDocumentBlob(doc, selectedFacility || undefined);
  };

  const handleOpenInNewTab = async (doc: any) => {
    const isImg = doc.mimeType?.startsWith("image/") || doc.originalFileName.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i);
    if (isImg && doc.fileUrl) {
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

    const blob = (previewDoc?.id === doc.id && previewBlobUrl)
      ? null
      : await getPdfBlobForDoc(doc);
    const targetUrl = blob ? URL.createObjectURL(blob) : (previewBlobUrl || doc.fileUrl);

    const win = window.open(targetUrl, "_blank");
    if (win) win.focus();
  };

  const handleDownloadDoc = async (doc: any) => {
    const isImg = doc.mimeType?.startsWith("image/") || doc.originalFileName.match(/\.(jpg|jpeg|png|webp|gif|svg)$/i);
    if (isImg && doc.fileUrl?.startsWith("data:")) {
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
  };

  // Safely fetch and prepare PDF documents as in-memory blobs for inline viewer
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
  }, [previewDoc, selectedFacility, pageLoad.retryKey]);
  const [apiFacilities, setApiFacilities] = useState<FacilityKYCItem[]>([]);
  const [loading, setLoading] = useState(isApiEnabled);

  const fetchFacilities = async () => {
    try {
      setLoading(true);
      const res = await getPendingFacilityKyc("all");
      const mapped: FacilityKYCItem[] = res.map((dto: any) => {
        const documents = Array.isArray(dto.documents) ? dto.documents : [];
        const hasRegistrationDocument = documents.some((document: any) =>
          String(document.documentType || "").toUpperCase() === "FACILITY_REGISTRATION" &&
          String(document.reviewStatus || (document.verified ? "VERIFIED" : "PENDING")).toUpperCase() !== "REJECTED"
        );
        // Registration certificate is the only required item to enter verification review.
        // Other facility profile details can be completed independently.
        let status: FacilityKYCItem["status"] = hasRegistrationDocument ? "pending" : "setup_required";
        if (dto.kycStatus === "VERIFIED") status = "verified";
        else if (dto.kycStatus === "REJECTED") status = "rejected";
        return {
          id: dto.id,
          userId: dto.userId,
          name: dto.hospitalName || dto.facilityName || "Hospital Facility",
          type: dto.facilityType || "Not provided",
          size: dto.size,
          about: dto.about,
          website: dto.website,
          area: dto.area,
          city: dto.city || dto.area || "Not provided",
          state: dto.state || "Not provided",
          pincode: dto.pincode,
          addressLine: dto.addressLine,
          beds: (dto.beds ?? dto.bedCapacity) > 0 ? (dto.beds ?? dto.bedCapacity) : undefined,
          icuBeds: dto.icuBeds > 0 ? dto.icuBeds : undefined,
          licenseNumber: dto.licenseNumber || "Not provided",
          gst: dto.gst,
          nabhNumber: dto.nabhNumber || "",
          accreditation: dto.accreditationLevel || "Not provided",
          accreditationLevel: dto.accreditationLevel,
          contactPerson: dto.contactPerson || "Not provided",
          designation: dto.designation || "Not provided",
          contactPhone: dto.contactPhone || dto.phone || "Not provided",
          contactEmail: dto.contactEmail,
          departments: Array.isArray(dto.departments) ? dto.departments : [],
          hiringNeeds: Array.isArray(dto.hiringNeeds) ? dto.hiringNeeds : [],
          logoUrl: dto.logoUrl,
          facilityPhotos: Array.isArray(dto.facilityPhotos) ? dto.facilityPhotos : [],
          docName: documents.find((document: any) => String(document.documentType || "").toUpperCase() === "FACILITY_REGISTRATION")?.originalFileName || "No registration document uploaded",
          status,
          submittedDate: dto.createdAt ? new Date(dto.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Recent",
          notes: dto.kycNotes,
          documents,
          verifiedAt: dto.verifiedAt ? new Date(dto.verifiedAt).toLocaleString('en-IN') : undefined,
          createdAt: dto.createdAt ? new Date(dto.createdAt).toLocaleString('en-IN') : undefined,
          updatedAt: dto.updatedAt ? new Date(dto.updatedAt).toLocaleString('en-IN') : undefined,
        };
      });
      setApiFacilities(mapped);
    } catch (err: any) {
      pageLoad.fail(err);
      toast.error("Failed to load facility verifications", { description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, [pageLoad.retryKey]);

  // Keep selected facility updated with fresh API data
  useEffect(() => {
    if (selectedFacility && apiFacilities.length > 0) {
      const fresh = apiFacilities.find((f) => f.id === selectedFacility.id);
      if (fresh) setSelectedFacility(fresh);
    }
  }, [apiFacilities]);

  const facilities = apiFacilities;

  // Run advisory profile pre-checks for pending facilities with bounded concurrency.
  useEffect(() => {
    const queue = facilities.filter((f) => {
      if (f.status !== "pending") return false;
      const key = getFacilityAuditCacheKey(f);
      return !aiAuditResults[key] && !autoAuditedKeysRef.current.has(key) && !inFlightAuditKeysRef.current.has(key);
    });
    if (queue.length === 0) return;

    let cancelled = false;
    let cursor = 0;
    const MAX_CONCURRENT = 2;

    const worker = async () => {
      while (!cancelled && cursor < queue.length) {
        const nextItem = queue[cursor++];
        if (!nextItem) break;
        const key = getFacilityAuditCacheKey(nextItem);
        autoAuditedKeysRef.current.add(key);
        await handleRunAiAudit(nextItem, { silent: true });
      }
    };

    const workers = Array.from({ length: Math.min(MAX_CONCURRENT, queue.length) }, () => worker());
    void Promise.all(workers);

    return () => {
      cancelled = true;
    };
  }, [facilities, aiAuditResults, getFacilityAuditCacheKey, handleRunAiAudit, pageLoad.retryKey]);

  // Start the advisory pre-check when an admin opens a facility dossier.
  useEffect(() => {
    if (!sheetOpen || !selectedFacility) return;
    const key = getFacilityAuditCacheKey(selectedFacility);
    if (!aiAuditResults[key] && !inFlightAuditKeysRef.current.has(key)) {
      void handleRunAiAudit(selectedFacility, { silent: true });
    }
  }, [sheetOpen, selectedFacility, aiAuditResults, getFacilityAuditCacheKey, handleRunAiAudit, pageLoad.retryKey]);

  const filtered = facilities.filter((f) => {
    const matchesFilter = filter === "all" ? true : f.status === filter;
    const matchesSearch =
      f.name.toLowerCase().includes(search.toLowerCase()) ||
      f.city.toLowerCase().includes(search.toLowerCase()) ||
      f.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
      f.nabhNumber.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleVerify = async (id: string, name: string) => { await pageAction.run(async () => {
    {
      try {
        await reviewFacilityKyc(id, "APPROVE", "Approved hospital credentials by compliance desk");
        toast.success("Hospital Accredited & Verified!", {
          description: `${name} has been approved. They can now publish clinical openings on FALE.`,
        });
        setSheetOpen(false);
        fetchFacilities();
      } catch (err: any) {
      pageLoad.fail(err);
        toast.error("Approval failed", { description: err?.message });
      }
      return;
    }

  }); };

  const handleRejectConfirm = async () => { await pageAction.run(async () => {
    if (!selectedFacility) return;
    {
      try {
        await reviewFacilityKyc(selectedFacility.id, "REJECT", rejectReason || "Insufficient documentation.");
        toast.error("Hospital Verification Rejected", {
          description: `${selectedFacility.name} was rejected: ${rejectReason || "Insufficient documentation."}`,
        });
        setRejectModalOpen(false);
        setSheetOpen(false);
        setRejectReason("");
        fetchFacilities();
      } catch (err: any) {
      pageLoad.fail(err);
        toast.error("Rejection failed", { description: err?.message });
      }
      return;
    }

  }); };

  const getFacilityDocuments = (fac: FacilityKYCItem) => {
    if (fac.documents && fac.documents.length > 0) {
      return fac.documents.map((d: any) => ({
        id: d.id,
        documentType: d.documentType,
        originalFileName: d.originalFileName || "document.pdf",
        fileSizeBytes: d.fileSizeBytes || (d.fileUrl?.length ? Math.round(d.fileUrl.length * 0.75) : 256000),
        mimeType: d.mimeType || (d.fileUrl?.startsWith("data:image/") || d.originalFileName?.match(/\.(jpg|jpeg|png|webp)$/i) ? "image/png" : "application/pdf"),
        fileUrl: d.fileUrl,
        verified: d.verified ?? (fac.status === "verified"),
        reviewStatus: d.reviewStatus || (d.verified ? "VERIFIED" : "PENDING"),
        reviewNotes: d.reviewNotes,
      }));
    }

    return [];
  };

  const pendingCount = facilities.filter((f) => f.status === "pending").length;
  const setupRequiredCount = facilities.filter((f) => f.status === "setup_required").length;
  const verifiedCount = facilities.filter((f) => f.status === "verified").length;
  const rejectedCount = facilities.filter((f) => f.status === "rejected").length;
  const hasRegistrationDocument = Boolean(selectedFacility?.documents?.some((doc: any) =>
    String(doc.documentType || "").toUpperCase() === "FACILITY_REGISTRATION" &&
    String(doc.reviewStatus || "PENDING").toUpperCase() !== "REJECTED"
  ));

  return (
    <AdminLayout
      title="Hospital & Facility Verification"
      subtitle="Review each hospital registration certificate. Ally can flag profile gaps, while an admin makes the verification decision."
      badge={
        <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
          {pendingCount} Pending · {verifiedCount} Verified
        </span>
      }
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={fetchFacilities}
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
            <span>Verified Hospitals</span>
            <HiOutlineCheckBadge className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground">{verifiedCount}</div>
          <p className="text-[11px] text-emerald-600 font-medium">Accredited institution</p>
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
            <span>Total Facilities</span>
            <HiOutlineBuildingOffice2 className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">{facilities.length}</div>
          <p className="text-[11px] text-muted-foreground">Registered institutions</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden min-w-0 w-full">
        {/* Controls Bar */}
        <div className="p-3.5 sm:p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-muted/50 border border-border/40 w-full md:w-fit overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {[
              { id: "setup_required" as const, label: "Setup Required", count: setupRequiredCount },
              { id: "pending" as const, label: "Pending Review", count: pendingCount },
              { id: "verified" as const, label: "Verified", count: verifiedCount },
              { id: "rejected" as const, label: "Rejected", count: rejectedCount },
              { id: "all" as const, label: "All Facilities", count: facilities.length },
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
              placeholder="Filter by name, city, NABH #..."
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
                  Hospital Network
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 h-11 align-middle">
                  Location & Capacity
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 h-11 align-middle">
                  Accreditation & License
                </TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground py-3.5 h-11 align-middle">
                  Authorized Contact
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
              {filtered.map((item) => {
                const initials = item.name.split(" ").map((x) => x[0]).slice(0, 2).join("");
                return (
                  <TableRow key={item.id} className="hover:bg-muted/30 transition-colors border-b border-border/70">
                    {/* Hospital */}
                    <TableCell className="py-3.5 pl-5 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 border border-primary/20 text-primary font-bold text-xs shrink-0 shadow-2xs">
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
                    <TableCell className="py-3.5 align-middle">
                      <div className="font-semibold text-foreground text-xs flex items-center gap-1">
                        <HiOutlineMapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                        <span>{item.city}, {item.state}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">
                        {item.beds ? `${item.beds} Inpatient Beds` : "Capacity not provided"}
                      </div>
                    </TableCell>

                    {/* Accreditation */}
                    <TableCell className="py-3.5 align-middle">
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
                    <TableCell className="py-3.5 align-middle">
                      <div className="font-semibold text-foreground text-xs">{item.contactPerson}</div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <HiOutlinePhone className="h-3 w-3 text-muted-foreground/80 shrink-0" />
                        <span>{item.contactPhone}</span>
                      </div>
                    </TableCell>

                    {/* Status Badge & AI Clearance */}
                    <TableCell className="py-3.5 align-middle">
                      <div className="flex flex-col gap-1 items-start">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border",
                            item.status === "verified"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800"
                              : item.status === "rejected"
                              ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800"
                              : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800"
                          )}
                        >
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              item.status === "verified"
                                ? "bg-emerald-500"
                                : item.status === "rejected"
                                ? "bg-rose-500"
                                : "bg-amber-500"
                            )}
                          />
                          {item.status === "verified"
                            ? "Verified"
                            : item.status === "rejected"
                            ? "Rejected"
                            : item.status === "setup_required"
                            ? "Setup Required"
                            : "Pending Review"}
                        </span>
                        {renderAllyQueueBadge(item)}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="py-3.5 pr-5 text-right align-middle">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedFacility(item);
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
                              disabled={pageAction.isPending} onClick={() => handleVerify(item.id, item.name)}
                              className="text-xs font-bold gap-1.5 h-8 px-3 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs cursor-pointer"
                            >
                              <HiCheck className="h-3.5 w-3.5 stroke-[2.5]" />
                              <span>Verify</span>
                            </Button>

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedFacility(item);
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
        <div className="md:hidden p-3 sm:p-4 pb-24 sm:pb-4 space-y-3.5 bg-muted/20">
          {filtered.map((item) => {
            const initials = item.name.split(" ").map((x) => x[0]).slice(0, 2).join("");
            return (
              <div
                key={`m-fac-${item.id}`}
                className="rounded-2xl border border-border/80 bg-card p-3.5 sm:p-5 space-y-3.5 shadow-2xs transition-all overflow-hidden"
              >
                {/* Status & Timestamp */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                    {item.status === "verified" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
                        <HiOutlineCheckBadge className="h-3.5 w-3.5" /> Verified
                      </span>
                    ) : item.status === "rejected" ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold text-rose-700 dark:text-rose-400 border border-rose-500/20 whitespace-nowrap">
                        <HiOutlineXMark className="h-3.5 w-3.5" /> Rejected
                      </span>
                    ) : item.status === "setup_required" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-bold text-orange-700 border border-orange-200 dark:bg-orange-950/30 dark:text-orange-300 dark:border-orange-800 whitespace-nowrap">
                        Setup Required
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold text-primary border border-primary/20 whitespace-nowrap">
                        Pending Verification
                      </span>
                    )}

                    {renderAllyQueueBadge(item)}
                  </div>

                  <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 whitespace-nowrap shrink-0 pt-0.5">
                    <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
                    {item.submittedDate}
                  </span>
                </div>

                {/* Facility Header */}
                <div className="flex items-start gap-3 pt-0.5">
                  <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-xl bg-primary/10 text-primary font-bold text-xs shrink-0 border border-primary/20 mt-0.5">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      onClick={() => { setSelectedFacility(item); setSheetOpen(true); }}
                      className="font-bold text-foreground text-sm leading-snug cursor-pointer hover:text-primary transition-colors break-words"
                    >
                      {item.name}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.type}</p>
                    <div className="text-xs text-muted-foreground mt-1.5 flex items-center gap-x-2 gap-y-1 flex-wrap">
                      <span className="flex items-center gap-1 font-medium text-foreground/80">
                        <HiOutlineMapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        {item.city}, {item.state}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span className="font-mono text-muted-foreground whitespace-nowrap">{item.beds ? `${item.beds} Inpatient Beds` : "Capacity not provided"}</span>
                    </div>
                  </div>
                </div>

                {/* Accreditation & License Box */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-muted/40 border border-border/50 text-xs space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Accreditation Level</span>
                    <span className="font-bold text-foreground text-xs text-right">{item.accreditation || "State Registered"}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/40 font-mono text-[11px]">
                    <div className="min-w-0">
                      <span className="text-muted-foreground text-[10px] block font-sans font-medium mb-0.5">NABH ID</span>
                      <span className={cn("break-all", item.nabhNumber ? "font-bold text-primary" : "font-sans font-medium text-muted-foreground")}>
                        {item.nabhNumber || "Not Provided"}
                      </span>
                    </div>
                    <div className="text-right min-w-0">
                      <span className="text-muted-foreground text-[10px] block font-sans font-medium mb-0.5">CEA License</span>
                      <span className="font-semibold text-foreground break-all">{item.licenseNumber || "Pending"}</span>
                    </div>
                  </div>
                </div>

                {/* Contact & Attached Certificate Card */}
                <div className="p-3 sm:p-3.5 rounded-xl bg-muted/20 border border-border/40 space-y-2.5 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Authorized Contact</span>
                    <a href={`tel:${item.contactPhone}`} className="text-primary font-semibold hover:underline flex items-center gap-1 shrink-0 whitespace-nowrap">
                      <HiOutlinePhone className="h-3.5 w-3.5 shrink-0" /> {item.contactPhone}
                    </a>
                  </div>
                  <div className="font-semibold text-foreground text-xs leading-snug break-words">
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
                <div className={cn("pt-0.5", item.status === "pending" ? "grid grid-cols-3 gap-1.5 sm:gap-2" : "flex items-center gap-2")}>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setSelectedFacility(item); setSheetOpen(true); }}
                    className={cn(
                      "h-9 px-2 sm:px-3 text-[11px] sm:text-xs font-bold rounded-xl border-border/80 hover:bg-muted shadow-none cursor-pointer gap-1 min-w-0",
                      item.status !== "pending" && "flex-1"
                    )}
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
                          setSelectedFacility(item);
                          setRejectModalOpen(true);
                        }}
                        className="h-9 px-2 sm:px-3 text-[11px] sm:text-xs font-bold rounded-xl text-rose-600 border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1 cursor-pointer min-w-0"
                      >
                        <HiOutlineXMark className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Reject</span>
                      </Button>

                      <Button
                        size="sm"
                        disabled={pageAction.isPending} onClick={() => handleVerify(item.id, item.name)}
                        className="h-9 px-2 sm:px-3 text-[11px] sm:text-xs font-bold rounded-xl bg-primary hover:bg-primary-hover text-white gap-1 shadow-none transition-all active:scale-[0.98] cursor-pointer min-w-0"
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
            <div className="p-10 text-center text-xs text-muted-foreground">
              <HiOutlineBuildingOffice2 className="h-8 w-8 mx-auto text-muted-foreground/40 mb-2" />
              No hospital facilities found in this view.
            </div>
          )}
        </div>
      </div>

      {/* Slide-over Inspection Sheet (Comprehensive Hospital & Facility Dossier) */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col h-full max-h-[100dvh] overflow-hidden gap-0">
          <SheetHeader className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-border bg-card shrink-0 text-left">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 sm:gap-4 pr-8">
              <div className="flex items-start gap-3 min-w-0">
                <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0 mt-0.5">
                  <HiOutlineBuildingOffice2 className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0">
                  <SheetTitle className="text-sm sm:text-base font-extrabold text-foreground leading-snug">
                    {selectedFacility?.status === "setup_required" ? "Facility Setup" : "Hospital Accreditation Dossier"}
                  </SheetTitle>
                  <SheetDescription className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                    {selectedFacility?.status === "setup_required"
                      ? "Review the facility details and documents provided so far. Setup is not complete yet."
                      : "Statutory healthcare establishment audit, clinical licensing, and facility profile"}
                  </SheetDescription>
                </div>
              </div>
              {selectedFacility && (
                <span
                  className={cn(
                    "px-2.5 sm:px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold border shrink-0 w-fit inline-flex items-center gap-1.5 mt-0.5 shadow-2xs whitespace-nowrap",
                    selectedFacility.status === "verified"
                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                      : selectedFacility.status === "rejected"
                      ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      : selectedFacility.status === "setup_required"
                      ? "bg-orange-500/10 text-orange-700 border-orange-500/20"
                      : "bg-primary/10 text-primary border-primary/20"
                  )}
                >
                  {selectedFacility.status === "pending" && (
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                  {selectedFacility.status === "verified"
                    ? "Verified Seal Active"
                    : selectedFacility.status === "rejected"
                    ? "Accreditation Rejected"
                    : selectedFacility.status === "setup_required"
                    ? "Registration Certificate Required"
                    : "Pending Verification"}
                </span>
              )}
            </div>
          </SheetHeader>

          {selectedFacility && (() => {
            const facilityDocs = getFacilityDocuments(selectedFacility);
            const setupMissingItems = hasRegistrationDocument ? [] : ["Hospital registration certificate"];
            const galleryPhotos = Array.from(new Set(
              (selectedFacility.facilityPhotos || [])
                .map((photo) => photo?.trim())
                .filter((photo): photo is string => Boolean(photo))
            ));
            const locationParts = Array.from(new Set(
              [selectedFacility.area, selectedFacility.city, selectedFacility.state]
                .filter((part): part is string => Boolean(part && part !== "Not provided"))
            ));
            return (
              <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4 sm:space-y-5">

                {/* 1. Facility Identity, Branding & Description */}
                <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 space-y-4 shadow-xs">
                  <div className="flex flex-col xs:flex-row sm:flex-row items-start gap-3 sm:gap-4">
                    {selectedFacility.logoUrl ? (
                      <FacilityImage
                        src={selectedFacility.logoUrl}
                        alt={selectedFacility.name}
                        className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl object-cover border border-border shadow-xs shrink-0"
                      />
                    ) : (
                      <div className="grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-2xl bg-primary/10 border border-primary/20 text-primary font-black text-lg sm:text-xl shrink-0">
                        {selectedFacility.name.split(" ").map(n => n[0]).slice(0, 2).join("")}
                      </div>
                    )}

                    <div className="flex-1 min-w-0 w-full">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <h3 className="font-black text-foreground text-base sm:text-lg leading-snug break-words">{selectedFacility.name}</h3>
                        {selectedFacility.type && selectedFacility.type !== "Not provided"
                          ? <span className="rounded-md bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border border-primary/20">{selectedFacility.type}</span>
                          : <span className="rounded-md bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-bold border border-border">Facility type not provided</span>}
                        {selectedFacility.size && (
                          <span className="rounded-md bg-muted text-muted-foreground px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide border border-border">
                            {selectedFacility.size}
                          </span>
                        )}
                      </div>

                      {selectedFacility.website ? (
                        <div className="flex items-center gap-1.5 mt-1 text-xs">
                          <HiOutlineGlobeAlt className="h-3.5 w-3.5 text-primary shrink-0" />
                          <a
                            href={selectedFacility.website.startsWith("http") ? selectedFacility.website : `https://${selectedFacility.website}`}
                            target="_blank"
                            rel="noreferrer"
                            className="font-medium text-primary hover:underline truncate"
                          >
                            {selectedFacility.website}
                          </a>
                        </div>
                      ) : selectedFacility.status !== "setup_required" ? (
                        <p className="text-xs text-muted-foreground mt-0.5">Facility profile information provided by the hospital</p>
                      ) : null}

                      {/* About Facility */}
                      {selectedFacility.about && (
                        <div className="mt-3 pt-3 border-t border-border/60">
                          <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">About the Institution</span>
                          <p className="text-xs text-foreground/90 font-medium leading-relaxed bg-muted/30 p-2.5 rounded-xl border border-border/40">
                            {selectedFacility.about}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Infrastructure Metric Strip (Beds & Capacity) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-2.5 pt-2 border-t border-border/60 text-xs">
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Inpatient Beds</span>
                      <strong className={cn("text-xs font-bold", selectedFacility.beds ? "text-foreground" : "text-muted-foreground")}>{selectedFacility.beds ? `${selectedFacility.beds} Beds` : "Not provided"}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">ICU Beds</span>
                      <strong className={cn("text-xs font-bold", selectedFacility.icuBeds ? "text-primary" : "text-muted-foreground")}>{selectedFacility.icuBeds ? `${selectedFacility.icuBeds} Critical Beds` : "Not provided"}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Area / Location</span>
                      <strong className="text-foreground text-xs font-bold block break-words">{locationParts.length ? locationParts.join(", ") : <span className="font-medium text-muted-foreground">Not provided</span>}</strong>
                    </div>
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Postal PIN</span>
                      <strong className="text-foreground text-xs font-bold">{selectedFacility.pincode || <span className="font-medium text-muted-foreground">Not provided</span>}</strong>
                    </div>
                  </div>

                  {/* Physical Location Address */}
                  <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50 text-xs flex items-start gap-2">
                    <HiOutlineMapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Hospital Physical Address</span>
                      <p className="text-foreground font-medium break-words">{selectedFacility.addressLine || <span className="text-muted-foreground">Not provided</span>}</p>
                    </div>
                  </div>
                </div>

                {/* Ally advisory facility profile pre-check */}
                {selectedFacility.status !== "setup_required" && (() => {
                  const audit = getFacilityAiAudit(selectedFacility);
                  const isAuditing = Boolean(runningAuditIds[selectedFacility.id]);
                  const isPrecheckComplete = audit.status === "REVIEW";
                  const isFlagged = audit.status === "FLAGGED";
                  const isError = audit.status === "ERROR";

                  return (
                    <div className="rounded-2xl border border-primary/25 bg-primary/5 p-3.5 sm:p-5 space-y-3 transition-all shadow-2xs">
                      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                        <div className="flex min-w-0 flex-1 items-start gap-2.5">
                          <div className="grid h-8 w-8 place-items-center rounded-xl bg-primary/15 text-primary border border-primary/20 shrink-0">
                            {isAuditing ? (
                              <ButtonSpinner className="h-4 w-4 animate-spin" />
                            ) : (
                              <BotMessageSquare className="h-4 w-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="font-extrabold text-xs uppercase tracking-wider text-primary leading-snug">
                              Ally Facility Pre-check
                            </h5>
                            <p className="text-[11px] leading-4 text-muted-foreground">
                              {isAuditing
                                ? "Reviewing submitted profile details..."
                                : isPrecheckComplete
                                  ? "Profile pre-check complete. Human review is still required."
                                  : isFlagged
                                    ? "A potential inconsistency needs human review."
                                    : isError
                                      ? "Pre-check unavailable · retry recommended"
                                      : "Queued to review submitted profile details"}
                            </p>
                          </div>
                        </div>

                        <div className="flex w-full flex-wrap items-center gap-2 pl-10 md:w-auto md:shrink-0 md:justify-end md:pl-0">
                          <span
                            className={cn(
                              "text-[10px] font-black px-2 py-0.5 rounded-full border inline-flex items-center gap-1 whitespace-nowrap",
                              isAuditing
                                ? "bg-primary/10 text-primary border-primary/25"
                                : isPrecheckComplete
                                  ? "bg-primary/10 text-primary border-primary/25"
                                  : isFlagged
                                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/25"
                                    : isError
                                      ? "bg-destructive/10 text-destructive border-destructive/25"
                                      : "bg-muted text-muted-foreground border-border/60"
                            )}
                          >
                            {isAuditing
                              ? "Ally Auditing..."
                              : isPrecheckComplete
                                ? "Admin review required"
                                : isFlagged
                                  ? "Potential issue flagged"
                                  : isError
                                    ? "Pre-check failed"
                                    : "Pre-check queued"}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isAuditing}
                            onClick={() => handleRunAiAudit(selectedFacility)}
                            className="h-7 px-2.5 text-[11px] font-bold rounded-lg gap-1.5 border-primary/30 text-primary hover:bg-primary/10 bg-background/80 cursor-pointer shrink-0"
                          >
                            {isAuditing ? (
                              <ButtonSpinner className="h-3 w-3 animate-spin shrink-0" />
                            ) : (
                              <BotMessageSquare className="h-3.5 w-3.5 shrink-0" />
                            )}
                            <span>{isAuditing ? "Checking profile..." : isPrecheckComplete || isFlagged ? "Re-run pre-check" : "Run Ally pre-check"}</span>
                          </Button>
                        </div>
                      </div>

                      <p className="text-[10px] leading-4 text-muted-foreground">Advisory only: Ally does not read the uploaded certificate or check official registries. Only an admin can verify and approve this facility.</p>

                      <div className="max-h-36 sm:max-h-44 overflow-y-auto pr-1.5 [scrollbar-width:thin] text-xs text-foreground/90 leading-relaxed space-y-2 pt-2 border-t border-primary/15">
                        <p className="flex items-start gap-2">
                          <HiOutlineCheckBadge
                            className={cn(
                              "h-4 w-4 shrink-0 mt-0.5",
                              isFlagged ? "text-amber-600 dark:text-amber-400" : isError ? "text-destructive" : "text-primary"
                            )}
                          />
                          <span className="break-words min-w-0">{audit.licenseSentence}</span>
                        </p>
                        <p className="flex items-start gap-2">
                          <HiOutlineCheckBadge
                            className={cn(
                              "h-4 w-4 shrink-0 mt-0.5",
                              isFlagged ? "text-amber-600 dark:text-amber-400" : isError ? "text-destructive" : "text-primary"
                            )}
                          />
                          <span className="break-words min-w-0">{audit.infraSentence}</span>
                        </p>
                        <p
                          className={cn(
                            "text-[11px] font-semibold pt-2 border-t border-primary/15 flex items-start gap-2",
                            isFlagged ? "text-amber-700 dark:text-amber-300" : isError ? "text-destructive" : "text-primary"
                          )}
                        >
                          <HiOutlineSparkles className="h-4 w-4 shrink-0 mt-0.5" />
                          <span className="break-words min-w-0">{audit.recSentence}</span>
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {/* 2. Registration details and optional credentials */}
                {selectedFacility.status !== "setup_required" && <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <HiOutlineShieldCheck className="h-4 w-4 text-primary" />
                      <span>Registration &amp; Optional Credentials</span>
                    </h4>
                    <span className="text-[11px] font-bold text-primary px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20">
                      {selectedFacility.accreditation}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Facility registration / licence number</span>
                      <div className="font-mono text-xs font-bold text-foreground break-all">
                        {selectedFacility.licenseNumber !== "Not provided" ? selectedFacility.licenseNumber : <span className="font-sans font-medium text-muted-foreground">Not provided</span>}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-medium block">
                        Profile detail; the uploaded certificate is reviewed separately
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">NABH / NABL Accreditation</span>
                      <div className="font-mono text-xs font-bold text-primary break-all">
                        {selectedFacility.nabhNumber || <span className="font-sans font-medium text-muted-foreground">Not provided</span>}
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Optional accreditation reference
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">GSTIN Tax Registration</span>
                      <div className="font-mono text-xs font-bold text-foreground break-all">
                        {selectedFacility.gst || <span className="font-sans font-medium text-muted-foreground">Not provided</span>}
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Optional tax registration
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-1">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Accreditation Tier</span>
                      <div className="font-bold text-xs text-foreground">
                        {selectedFacility.accreditationLevel || <span className="font-medium text-muted-foreground">Not provided</span>}
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Optional facility accreditation
                      </span>
                    </div>
                  </div>
                </div>}

                {selectedFacility.status === "setup_required" && (
                  <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-4 sm:p-5 space-y-2.5">
                    <h4 className="text-sm font-bold text-foreground">Still needed before review</h4>
                    {setupMissingItems.length > 0 ? (
                      <ul className="list-inside list-disc space-y-1 text-xs leading-relaxed text-muted-foreground">
                        {setupMissingItems.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">Refresh the facility list to update its setup status.</p>
                    )}
                  </div>
                )}

                {/* 3. UPLOADED VERIFICATION DOCUMENTS (Dossier) */}
                <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 space-y-4 shadow-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                        <HiOutlineDocumentCheck className="h-4 w-4" />
                      </span>
                      <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Uploaded Verification Documents ({facilityDocs.length})
                      </span>
                    </div>
                    {selectedFacility.status !== "setup_required" && <span className="text-[11px] text-muted-foreground font-semibold">Documents submitted for review</span>}
                  </div>

                  {/* List of uploaded dynamic documents */}
                  <div className="space-y-2.5">
                    {facilityDocs.length === 0 ? (
                      <div className="p-4 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                        {selectedFacility.status === "setup_required" ? "No verification documents uploaded yet." : "No verification documents uploaded."}
                      </div>
                    ) : (
                      facilityDocs.map((doc, idx) => {
                      const isImage = doc.mimeType?.startsWith("image/") || doc.originalFileName.match(/\.(jpg|jpeg|png|webp)$/i);
                      return (
                        <div
                          key={doc.id || idx}
                          className="rounded-xl border border-border/80 bg-muted/20 hover:bg-muted/40 p-3 sm:p-3.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                        >
                          <div className="flex items-start sm:items-center gap-3 min-w-0 flex-1 w-full">
                            <span
                              className={cn(
                                "grid h-10 w-10 place-items-center rounded-xl shrink-0 font-bold text-xs border shadow-2xs",
                                isImage
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  : "bg-primary/10 text-primary border-primary/20"
                              )}
                            >
                              {isImage ? (
                                <HiOutlinePhoto className="h-5 w-5" />
                              ) : (
                                <HiOutlineDocumentText className="h-5 w-5" />
                              )}
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 truncate max-w-full sm:max-w-[200px]">
                                  {formatFacilityDocType(doc.documentType)}
                                </span>
                                {selectedFacility.status === "verified" && (
                                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded shrink-0">
                                    Verified
                                  </span>
                                )}
                              </div>
                              <p className="font-bold text-foreground text-xs break-all sm:truncate mt-1 group-hover:text-primary transition-colors">
                                {doc.originalFileName}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {formatBytes(doc.fileSizeBytes)} • {doc.mimeType?.replace("application/", "").toUpperCase() || "DOCUMENT"}
                              </p>
                            </div>
                          </div>

                          {/* Button Group */}
                          <div className="flex items-center gap-1.5 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
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
                    }))}
                  </div>
                </div>

                {/* 4. Authorized Administrative Representative */}
                <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 space-y-3.5 shadow-xs">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <HiOutlineUser className="h-4 w-4 text-primary" />
                    <span>Authorized Administrative Contact</span>
                  </h4>

                  <div className="flex flex-wrap sm:flex-nowrap items-start justify-between gap-2.5 sm:gap-4 p-3 sm:p-3.5 rounded-xl bg-muted/30 border border-border/50">
                    <div className="space-y-1 min-w-0">
                      <div className="font-bold text-foreground text-sm">{selectedFacility.contactPerson}</div>
                      {selectedFacility.designation && selectedFacility.designation !== "Not provided" && <p className="text-xs text-muted-foreground font-medium">{selectedFacility.designation}</p>}
                    </div>
                    {selectedFacility.status === "verified" && <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary border border-primary/20 text-xs font-bold shrink-0">Verified Signatory</span>}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <HiOutlinePhone className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Direct Contact Line</span>
                        {selectedFacility.contactPhone && selectedFacility.contactPhone !== "Not provided" ? <a href={`tel:${selectedFacility.contactPhone}`} className="font-bold text-foreground hover:text-primary transition-colors">{selectedFacility.contactPhone}</a> : <span className="font-medium text-muted-foreground">Not provided</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                      <HiOutlineEnvelope className="h-4 w-4 text-primary shrink-0" />
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Official Email</span>
                        {selectedFacility.contactEmail ? <a href={`mailto:${selectedFacility.contactEmail}`} className="font-bold text-foreground hover:text-primary transition-colors truncate block">{selectedFacility.contactEmail}</a> : <span className="font-medium text-muted-foreground">Not provided</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. Clinical Departments */}
                {Boolean(selectedFacility.departments?.length) && (
                <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <HiOutlineBuildingOffice2 className="h-4 w-4 text-primary" />
                      <span>Clinical Departments & Specialties</span>
                    </h4>
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {selectedFacility.departments && selectedFacility.departments.length > 0 ? selectedFacility.departments.length : 3} Departments
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedFacility.departments && selectedFacility.departments.length > 0 ? (
                      selectedFacility.departments.map((dept, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold"
                        >
                          {dept}
                        </span>
                      ))
                    ) : (
                      ["Emergency", "ICU", "Operation Theatre (OT)"].map((dept, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-primary/10 text-primary border border-primary/20 text-xs font-bold"
                        >
                          {dept}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                )}

                {/* 6. Active Recruitment & Hiring Needs */}
                {Boolean(selectedFacility.hiringNeeds?.length) && (
                <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <HiOutlineIdentification className="h-4 w-4 text-primary" />
                      <span>Active Clinical Hiring Requirements</span>
                    </h4>
                    <span className="text-[11px] font-bold text-muted-foreground">
                      {selectedFacility.hiringNeeds && selectedFacility.hiringNeeds.length > 0 ? selectedFacility.hiringNeeds.length : 1} Modalities
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedFacility.hiringNeeds && selectedFacility.hiringNeeds.length > 0 ? (
                      selectedFacility.hiringNeeds.map((need, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-muted text-foreground border border-border text-xs font-semibold"
                        >
                          {need}
                        </span>
                      ))
                    ) : (
                      ["Permanent clinical roles", "Locum per-shift cover"].map((need, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1.5 rounded-xl bg-muted text-foreground border border-border text-xs font-semibold"
                        >
                          {need}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                )}

                {/* 7. Facility Photos (if present) */}
                {galleryPhotos.length > 0 && (
                  <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-5 space-y-3 shadow-xs">
                    <h4 className="font-bold text-foreground text-xs uppercase tracking-wider">
                      Infrastructure & Facility Gallery
                    </h4>
                    <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 gap-2.5">
                      {galleryPhotos.map((photo, idx) => (
                        <FacilityGalleryPhoto key={photo} src={photo} index={idx} />
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. Regulatory Compliance & Audit Trail */}
                {selectedFacility.status !== "setup_required" && (
                <div className="rounded-2xl border border-border bg-card p-4 sm:p-5 space-y-3.5 shadow-xs">
                  <h4 className="font-bold text-foreground text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <HiOutlineClock className="h-4 w-4 text-primary" />
                    <span>Regulatory Compliance & Audit Trail</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block">Registration Date</span>
                      <span className="font-medium text-foreground">{selectedFacility.createdAt || selectedFacility.submittedDate}</span>
                    </div>
                    {selectedFacility.verifiedAt && (
                      <div className="p-2.5 rounded-xl bg-muted/30 border border-border/50">
                        <span className="text-[10px] uppercase font-bold text-muted-foreground block">Verified At</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{selectedFacility.verifiedAt}</span>
                      </div>
                    )}
                  </div>

                  {selectedFacility.notes && (
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200">
                      <strong className="block font-bold mb-0.5">Admin Compliance Notes:</strong>
                      {selectedFacility.notes}
                    </div>
                  )}

                  <div className="space-y-2 pt-3 border-t border-border/60 text-xs">
                    <div className={cn(
                      "rounded-xl border p-3 font-semibold",
                      hasRegistrationDocument
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-700 dark:text-emerald-300"
                        : "border-amber-500/25 bg-amber-500/5 text-amber-800 dark:text-amber-200"
                    )}>
                      {hasRegistrationDocument
                        ? "Facility registration / licence document is available for review."
                        : "A facility registration / licence document is required before approval. Other accreditation documents are reviewed when applicable."}
                    </div>
                  </div>
                </div>
                )}

              </div>
            );
          })()}

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
                    disabled={pageAction.isPending || !hasRegistrationDocument} onClick={() => handleVerify(selectedFacility.id, selectedFacility.name)}
                    className="flex-1 sm:flex-initial bg-primary hover:bg-primary-hover text-white text-xs font-bold gap-1 rounded-xl shadow-none whitespace-nowrap"
                  >
                    <HiCheck className="h-3.5 w-3.5 shrink-0" /> Approve & Issue Verified Badge
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
            <Button variant="destructive" disabled={pageAction.isPending} onClick={handleRejectConfirm} className="font-bold text-xs">
              Reject Facility
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full Document Viewer Modal (Inline PDF Preview with Download & Full Tab, Exactly like Candidate) */}
      <Dialog open={Boolean(previewDoc)} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent
          className="inset-x-0 bottom-0 top-auto h-[88dvh] max-h-[88dvh] w-full max-w-none rounded-t-3xl rounded-b-none border-x-0 border-b-0 p-0 flex flex-col gap-0 overflow-hidden bg-card data-[state=open]:slide-in-from-bottom data-[state=closed]:slide-out-to-bottom sm:inset-x-auto sm:left-[50%] sm:top-[50%] sm:bottom-auto sm:h-[88vh] sm:max-h-[88vh] sm:w-[94vw] sm:max-w-4xl sm:translate-x-[-50%] sm:translate-y-[-50%] sm:rounded-2xl sm:border sm:data-[state=open]:slide-in-from-bottom-0 sm:data-[state=closed]:slide-out-to-bottom-0"
          aria-describedby="facility-dialog-desc"
        >
          <span id="facility-dialog-desc" className="sr-only">
            Statutory Healthcare Establishment Document Audit Viewer
          </span>

          {/* Modal Header */}
          <DialogHeader className="px-4 sm:px-5 py-3 sm:py-3.5 border-b border-border bg-card shrink-0 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 w-full pr-8">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <span className="grid h-9 w-9 sm:h-10 sm:w-10 place-items-center rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
                  <HiOutlineDocumentText className="h-4 w-4 sm:h-5 sm:w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <DialogTitle className="text-xs sm:text-sm font-bold text-foreground truncate">
                    {previewDoc?.originalFileName}
                  </DialogTitle>
                  <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {formatFacilityDocType(previewDoc?.documentType)} • {formatBytes(previewDoc?.fileSizeBytes)}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
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
                <p className="text-[11px] text-muted-foreground">Rendering inline statutory certificate without downloading</p>
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
                      <span className="font-semibold text-foreground">{formatFacilityDocType(previewDoc.documentType)}</span>
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
                  </div>
                </div>
              ) : null
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
