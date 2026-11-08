import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  HiOutlineChatBubbleLeftRight,
  HiChatBubbleLeftRight,
  HiOutlineShieldCheck,
  HiOutlineShieldExclamation,
  HiOutlineExclamationTriangle,
  HiOutlineCheckBadge,
  HiCheck,
  HiCheckCircle,
  HiOutlineXMark,
  HiOutlineTrash,
  HiOutlineEye,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineUserPlus,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineDocumentMagnifyingGlass,
  HiOutlineHandThumbUp,
  HiOutlineArrowPath,
  HiOutlineLockClosed,
  HiOutlineInformationCircle,
  HiOutlineFlag,
  HiOutlinePaperAirplane,
  HiOutlineIdentification,
  HiOutlineBuildingOffice2,
} from "react-icons/hi2";
import {
  RiHospitalLine,
  RiMedicineBottleLine,
  RiStethoscopeLine,
  RiShieldUserLine,
  RiAlertLine,
  RiAwardLine,
  RiMentalHealthLine,
  RiUserSharedLine,
  RiFileShield2Line,
  RiPushpinLine,
  RiPushpinFill,
  RiVerifiedBadgeFill,
} from "react-icons/ri";
import { toast } from "sonner";
import { BotMessageSquare } from "lucide-react";
import { moderateHuddlePostWithAi } from "@/lib/adapters/aiAdapter";
import { AdminLayout } from "@/components/fale/AdminLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useApp,
  setState,
  approveHuddlePost,
  rejectHuddlePost,
  dismissHuddleReport,
  deleteHuddlePost,
  warnHuddleAuthor,
  togglePostPinned,
} from "@/lib/store";
import {
  HuddlePost,
  HuddleField,
  HuddlePostType,
} from "@/lib/data";
import { cn } from "@/lib/utils";
import { isApiEnabled } from "@/lib/api";
import {
  getFlaggedHuddlePosts,
  getReviewCases,
  approveReviewCase,
  rejectReviewCase,
  moderateHuddlePost,
  togglePinHuddlePost,
  getAdminMentorApplications,
  reviewAdminMentorApplication,
  toggleAdminMentorSeal,
  type MentorApplicationDto,
} from "@/lib/adapters/adminAdapter";
import { getHuddlePosts } from "@/lib/adapters/huddleAdapter";

export const Route = createFileRoute("/admin/huddle")({
  head: () => ({
    meta: [
      { title: "Huddle Moderation & Clinical Trust Desk — FALE Admin" },
      {
        name: "description",
        content:
          "Enterprise clinical forum moderation, patient de-identification audit, community report resolution, and verified clinical mentor management.",
      },
    ],
  }),
  component: AdminHuddleModeration,
});

function AdminHuddleModeration() {
  const s = useApp();
  const navigate = useNavigate();

  // Active view tab
  const [activeTab, setActiveTab] = useState<
    "flagged" | "cases" | "feed" | "mentors" | "rules"
  >("flagged");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [fieldFilter, setFieldFilter] = useState<string>("All");
  const [typeFilter, setTypeFilter] = useState<string>("All");
  const [flagFilter, setFlagFilter] = useState<"all" | "privacy" | "spam" | "unverified">("all");

  // Inspection Drawer
  const [selectedPost, setSelectedPost] = useState<HuddlePost | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  // AI Moderation Scan State (#17)
  const [aiModerationResults, setAiModerationResults] = useState<Record<string, {
    status: "SAFE" | "FLAGGED";
    category: string;
    rationale: string;
    isApproved: boolean;
  }>>({});
  const [scanningPostId, setScanningPostId] = useState<string | null>(null);

  const getPostAiModeration = (post: HuddlePost) => {
    if (aiModerationResults[post.id]) return aiModerationResults[post.id];

    const text = (post.text || "").toLowerCase();
    const hasPhoneOrRecruiter = /(?:\+91|whatsapp|phone|call me|contact me|telegram|dm me|hiring alert)/i.test(text);
    const hasPhi = /\b(?:uhid|mrd|ipd|opd|patient name|bed\s*#?\d+)\b/i.test(text) || post.reports.some((r) => r.toLowerCase().includes("privacy"));
    const hasHarassment = /(fake|scam|fraud|cheat|stupid|idiot)/i.test(text);

    const isFlagged = hasPhoneOrRecruiter || hasPhi || hasHarassment || post.reports.length > 0;
    let category = "Clinical Knowledge Discussion";
    let rationale = "Clean clinical knowledge exchange adhering to FALE clinical forum governance.";

    if (hasPhi) {
      category = "Patient Privacy Risk: PHI / Identifier pattern detected";
      rationale = "Potential patient identification numbers or un-redacted clinical identifiers detected.";
    } else if (hasPhoneOrRecruiter) {
      category = "Spam Risk: Off-platform contact / solicitation identified";
      rationale = "Direct phone number, WhatsApp contact solicitation, or off-platform recruitment detected.";
    } else if (hasHarassment) {
      category = "Community Policy Infraction: Hostile language detected";
      rationale = "Hostile language or non-professional phrasing detected in peer clinical forum.";
    } else if (post.reports.length > 0) {
      category = "Community Flagged: Peer reports under review";
      rationale = `Flagged by ${post.reports.length} peer clinical reports for administrative review.`;
    }

    return {
      status: isFlagged ? ("FLAGGED" as const) : ("SAFE" as const),
      category,
      rationale,
      isApproved: !isFlagged,
    };
  };

  const handleScanPostWithAi = async (post: HuddlePost) => {
    setScanningPostId(post.id);
    try {
      const res = await moderateHuddlePostWithAi(post.text);
      const text = res.response || res.content || "";
      const sData = res.structuredData || {};
      const lower = text.toLowerCase();
      const isFlagged =
        sData.status === "FLAGGED" ||
        sData.isApproved === false ||
        lower.startsWith("flagged") ||
        lower.includes("flagged") ||
        lower.includes("violation") ||
        lower.includes("phi") ||
        lower.includes("spam");

      const category = sData.category || (isFlagged
        ? lower.includes("phi") || lower.includes("patient") || lower.includes("identifier")
          ? "Patient Privacy Risk: PHI / Identifier pattern detected"
          : "Spam Risk: Off-platform contact / solicitation identified"
        : "Community Safe: Verified Clinical Exchange");

      const rationale = sData.rationale || text || (isFlagged
        ? "Flagged by AI safety filters for potential policy infraction."
        : "Clean clinical post adhering to community safety guidelines.");

      setAiModerationResults((prev) => ({
        ...prev,
        [post.id]: {
          status: isFlagged ? "FLAGGED" : "SAFE",
          category,
          rationale,
          isApproved: !isFlagged,
        },
      }));
      toast.success(`AI Moderation scan complete: ${isFlagged ? "Violation Detected" : "Clear"}`);
    } catch (err: any) {
      console.warn("AI Moderation failed:", err);
      toast.error("Failed to run AI Moderation scan");
    } finally {
      setScanningPostId(null);
    }
  };

  // Dialog states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<HuddlePost | null>(null);

  const [warnModalOpen, setWarnModalOpen] = useState(false);
  const [postToWarn, setPostToWarn] = useState<HuddlePost | null>(null);
  const [warningReason, setWarningReason] = useState(
    "Clinical peer guidelines: Content has been flagged for commercial solicitation or patient privacy risk."
  );

  // Mentor management state (100% dynamic from candidate applications & admin verification)
  const [mentorApplications, setMentorApplications] = useState<MentorApplicationDto[]>([]);
  const [loadingMentors, setLoadingMentors] = useState(false);

  const fetchMentorApplications = () => {
    if (!isApiEnabled) return;
    setLoadingMentors(true);
    getAdminMentorApplications()
      .then((apps) => {
        setMentorApplications(apps || []);
      })
      .catch((err) => {
        console.warn("Failed to load mentor applications:", err);
      })
      .finally(() => setLoadingMentors(false));
  };

  // Dynamic API state for flagged posts, pending clinical review cases, and live discussions
  const [apiFlaggedPosts, setApiFlaggedPosts] = useState<HuddlePost[]>([]);
  const [apiReviewCases, setApiReviewCases] = useState<HuddlePost[]>([]);
  const [apiLivePosts, setApiLivePosts] = useState<HuddlePost[]>([]);
  const [loadingFlagged, setLoadingFlagged] = useState(isApiEnabled);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchFlaggedAndCases = () => {
    if (!isApiEnabled) return;
    setLoadingFlagged(true);
    Promise.all([getFlaggedHuddlePosts(), getReviewCases(), getHuddlePosts("All")])
      .then(([flaggedDtos, reviewDtos, liveDtos]) => {
        const mapDto = (dto: any, defaultStatus: "hidden" | "review" | "live"): HuddlePost => {
          const isReview = defaultStatus === "review" || String(dto.status).toUpperCase() === "REVIEW";
          const isHidden = defaultStatus === "hidden" || String(dto.status).toUpperCase() === "FLAGGED";
          const isAnon = Boolean(dto.isAnonymous || dto.anon);
          const authorDisplay = isAnon ? "Anonymous Clinician" : (dto.authorName || "Healthcare Professional");
          return {
            id: dto.id,
            type: (dto.type as any) || "Thought",
            field: (dto.field as any) || "Medicine",
            authorId: dto.authorId || "author",
            authorName: authorDisplay,
            authorShort: authorDisplay.split(" ")[0],
            authorRole: isAnon ? "Verified Clinician" : (dto.authorRole || "Verified Professional"),
            authorLevel: "professional",
            anon: isAnon,
            text: dto.body || dto.text || dto.title || "",
            image: dto.imageUrl || dto.image,
            pinned: Boolean(dto.isPinned),
            helpfulCount: dto.upvotes || 0,
            userHelpful: false,
            replies: [],
            reports: isHidden ? Array(dto.flagCount || 1).fill("Flagged by community") : [],
            status: isReview ? "review" : isHidden ? "hidden" : "live",
            at: dto.createdAt ? new Date(dto.createdAt).toLocaleDateString("en-IN") : "Today",
          };
        };

        setApiFlaggedPosts((flaggedDtos || []).map((d) => mapDto(d, "hidden")));
        setApiReviewCases((reviewDtos || []).map((d) => mapDto(d, "review")));
        setApiLivePosts((liveDtos || []).map((d) => mapDto(d, "live")));
        setLoadError(null);
      })
      .catch((err) => {
        console.error("Failed to load huddle admin queues:", err);
        setLoadError("Unable to load community posts.");
      })
      .finally(() => setLoadingFlagged(false));
  };

  useEffect(() => {
    fetchFlaggedAndCases();
    fetchMentorApplications();
  }, []);

  // Auto-refresh mentor applications when switching to the Clinical Mentors tab
  useEffect(() => {
    if (activeTab === "mentors") {
      fetchMentorApplications();
    }
  }, [activeTab]);

  // Checklist for clinical case review
  const [checklist, setChecklist] = useState({
    zeroPatientNames: true,
    zeroUhidMrd: true,
    bedWardRedacted: true,
    mediaDeIdentified: true,
    clinicalIntent: true,
  });

  // Calculate queue counts - merge API queues with store review cases so admin can audit them
  const allPosts = useMemo(() => {
    const storePosts = s.huddlePosts || [];
    if (isApiEnabled) {
      const apiIds = new Set([...apiFlaggedPosts, ...apiReviewCases, ...apiLivePosts].map((p) => p.id));
      const storeCases = storePosts.filter((p) => !apiIds.has(p.id));
      return [...apiFlaggedPosts, ...apiReviewCases, ...apiLivePosts, ...storeCases];
    }
    return storePosts;
  }, [isApiEnabled, apiFlaggedPosts, apiReviewCases, apiLivePosts, s.huddlePosts]);
  const flaggedPosts = useMemo(
    () =>
      allPosts.filter(
        (p) => p.status === "hidden" || (p.reports && p.reports.length > 0)
      ),
    [allPosts]
  );
  const pendingCases = useMemo(
    () => allPosts.filter((p) => p.status === "review"),
    [allPosts]
  );
  const livePosts = useMemo(
    () => allPosts.filter((p) => p.status === "live"),
    [allPosts]
  );

  // Handlers
  const handleApprovePost = (post: HuddlePost) => {
    if (isApiEnabled) {
      if (post.status === "review") {
        approveReviewCase(post.id).then(() => fetchFlaggedAndCases()).catch(console.error);
      } else {
        moderateHuddlePost(post.id, false).then(() => fetchFlaggedAndCases()).catch(console.error);
      }
    }
    approveHuddlePost(post.id);
    toast.success("Post Approved & Live!", {
      description: `Post by ${post.authorName} is now visible to the public Huddle community.`,
    });
    if (selectedPost?.id === post.id) {
      setSelectedPost({ ...selectedPost, status: "live", reports: [] });
    }
    setSheetOpen(false);
  };

  const handleDismissReport = (post: HuddlePost) => {
    if (isApiEnabled) {
      moderateHuddlePost(post.id, false).then(() => fetchFlaggedAndCases()).catch(console.error);
    }
    dismissHuddleReport(post.id);
    toast.success("Report Dismissed", {
      description: `All user reports cleared for "${post.authorName}". Post restored as Live.`,
    });
    if (selectedPost?.id === post.id) {
      setSelectedPost({ ...selectedPost, status: "live", reports: [] });
    }
    setSheetOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (!postToDelete) return;
    if (isApiEnabled) {
      if (postToDelete.status === "review") {
        rejectReviewCase(postToDelete.id).then(() => fetchFlaggedAndCases()).catch(console.error);
      } else {
        moderateHuddlePost(postToDelete.id, true).then(() => fetchFlaggedAndCases()).catch(console.error);
      }
    }
    deleteHuddlePost(postToDelete.id);
    toast.error("Post Permanently Removed", {
      description: `Post by ${postToDelete.authorName} was deleted from Huddle.`,
    });
    if (selectedPost?.id === postToDelete.id) {
      setSheetOpen(false);
      setSelectedPost(null);
    }
    setDeleteModalOpen(false);
    setPostToDelete(null);
  };

  const handleWarnConfirm = () => {
    if (!postToWarn) return;
    warnHuddleAuthor(postToWarn.id, warningReason);
    toast.warning("Formal Warning Issued", {
      description: `Warning logged for ${postToWarn.authorName}. Recorded in audit log.`,
    });
    setWarnModalOpen(false);
    setPostToWarn(null);
  };

  const handleTogglePin = async (post: HuddlePost) => {
    const newPinned = !post.pinned;
    togglePostPinned(post.id);

    setApiLivePosts((prev) =>
      prev.map((p) => (p.id === post.id ? { ...p, pinned: newPinned } : p))
    );

    if (selectedPost?.id === post.id) {
      setSelectedPost({ ...selectedPost, pinned: newPinned });
    }

    toast.info(newPinned ? "Post Pinned to Community Top" : "Post Unpinned", {
      description: `Pin status updated for ${post.authorName}'s discussion.`,
    });

    if (isApiEnabled) {
      try {
        await togglePinHuddlePost(post.id);
      } catch (err) {
        console.warn("Backend pin toggle sync:", err);
      }
    }
  };

  const handleToggleMentor = async (id: string, name: string) => {
    if (isApiEnabled) {
      try {
        const updated = await toggleAdminMentorSeal(id);
        setMentorApplications((prev) =>
          prev.map((a) => (a.id === id ? updated : a))
        );
      } catch (err) {
        console.warn("Backend toggle mentor seal:", err);
      }
    } else {
      setMentorApplications((prev) =>
        prev.map((a) =>
          a.id === id
            ? { ...a, verified: !a.verified, status: !a.verified ? "APPROVED" : "REJECTED" }
            : a
        )
      );
    }
    toast.success("Mentor Status Updated", {
      description: `Verified clinical seal updated for ${name}.`,
    });
  };

  const pendingMentorApps = useMemo(
    () => mentorApplications.filter((a) => a.status === "PENDING" && !a.verified),
    [mentorApplications]
  );

  const approvedMentorApps = useMemo(
    () => mentorApplications.filter((a) => a.status === "APPROVED" || a.verified),
    [mentorApplications]
  );

  const handleReviewMentor = async (appId: string, approve: boolean, name?: string) => {
    try {
      if (isApiEnabled) {
        const updated = await reviewAdminMentorApplication(appId, approve);
        setMentorApplications((prev) =>
          prev.map((a) => (a.id === appId ? updated : a))
        );
      } else {
        setMentorApplications((prev) =>
          prev.map((a) =>
            a.id === appId
              ? { ...a, status: approve ? "APPROVED" : "REJECTED", verified: approve }
              : a
          )
        );
      }
      if (approve) {
        toast.success("Mentor Seal Verified & Granted!", {
          description: `${name || "Clinician"} has been verified with 3+ years clinical experience and granted the FALE Clinical Mentor seal.`,
        });
      } else {
        toast.error("Mentor Application Rejected", {
          description: `Application for ${name || "Clinician"} has been rejected.`,
        });
      }
    } catch (err: any) {
      console.error("Failed to review mentor:", err);
      toast.error(err?.message || "Failed to update mentor application");
    }
  };

  // Filtered views
  const filteredFlagged = useMemo(() => {
    return flaggedPosts.filter((p) => {
      const matchSearch =
        p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.authorRole.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchSearch) return false;

      if (flagFilter === "privacy") {
        return (
          p.reports.some((r) => r.toLowerCase().includes("privacy")) ||
          p.text.toLowerCase().includes("uhid") ||
          p.text.toLowerCase().includes("mrd")
        );
      }
      if (flagFilter === "spam") {
        return (
          p.reports.some(
            (r) =>
              r.toLowerCase().includes("recruiter") ||
              r.toLowerCase().includes("spam")
          ) ||
          p.text.toLowerCase().includes("whatsapp") ||
          p.text.toLowerCase().includes("+91")
        );
      }
      return true;
    });
  }, [flaggedPosts, searchQuery, flagFilter]);

  const filteredLive = useMemo(() => {
    return livePosts.filter((p) => {
      const matchSearch =
        p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.authorRole.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.hospitalName &&
          p.hospitalName.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchField = fieldFilter === "All" || p.field === fieldFilter;
      const matchType = typeFilter === "All" || p.type === typeFilter;

      return matchSearch && matchField && matchType;
    });
  }, [livePosts, searchQuery, fieldFilter, typeFilter]);

  return (
    <AdminLayout
      title="Huddle Moderation & Clinical Trust Desk"
      subtitle="Strict clinical governance: review flagged discussions, verify zero patient identifiers in clinical case studies, audit community reports, and certify verified mentors."
      badge={
        <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-bold text-primary">
          {pendingCases.length} Cases to Review · {flaggedPosts.length} Flagged
        </span>
      }
      actions={
        <Button
          size="sm"
          variant="outline"
          onClick={fetchFlaggedAndCases}
          disabled={loadingFlagged}
          className="text-xs font-bold gap-1.5 h-9 rounded-xl border-border hover:bg-muted cursor-pointer"
        >
          <HiOutlineArrowPath className={cn("h-3.5 w-3.5", loadingFlagged && "animate-spin")} />
          <span>Refresh</span>
        </Button>
      }
    >
      {/* Top 4 Enterprise KPI Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {/* Card 1: Clinical Privacy Queue */}
        <div
          onClick={() => setActiveTab("cases")}
          className={cn(
            "rounded-2xl border bg-card p-4 shadow-2xs space-y-1 transition-all cursor-pointer",
            activeTab === "cases"
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "border-border hover:border-border/80"
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Case Audits</span>
            {pendingCases.length > 0 ? (
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            ) : (
              <HiCheck className="h-4 w-4 text-emerald-500" />
            )}
          </div>
          <div className="text-2xl font-black text-foreground">{pendingCases.length}</div>
          <p className="text-[11px] text-muted-foreground">Held for privacy review</p>
        </div>

        {/* Card 2: Flagged Reports */}
        <div
          onClick={() => setActiveTab("flagged")}
          className={cn(
            "rounded-2xl border bg-card p-4 shadow-2xs space-y-1 transition-all cursor-pointer",
            activeTab === "flagged"
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "border-border hover:border-border/80"
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Flagged Reports</span>
            {flaggedPosts.length > 0 ? (
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
            ) : (
              <HiCheck className="h-4 w-4 text-emerald-500" />
            )}
          </div>
          <div className="text-2xl font-black text-foreground">{flaggedPosts.length}</div>
          <p className="text-[11px] text-muted-foreground">Community reports</p>
        </div>

        {/* Card 3: Active Live Discussions */}
        <div
          onClick={() => setActiveTab("feed")}
          className={cn(
            "rounded-2xl border bg-card p-4 shadow-2xs space-y-1 transition-all cursor-pointer",
            activeTab === "feed"
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "border-border hover:border-border/80"
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Live Discussions</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground">{livePosts.length}</div>
          <p className="text-[11px] text-muted-foreground">Public peer stream</p>
        </div>

        {/* Card 4: Clinical Mentors */}
        <div
          onClick={() => {
            setActiveTab("mentors");
            fetchMentorApplications();
          }}
          className={cn(
            "rounded-2xl border bg-card p-4 shadow-2xs space-y-1 transition-all cursor-pointer",
            activeTab === "mentors"
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "border-border hover:border-border/80"
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground text-xs font-semibold">
            <span>Verified Mentors</span>
            <HiOutlineCheckBadge className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {approvedMentorApps.length}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {pendingMentorApps.length > 0 ? `${pendingMentorApps.length} application${pendingMentorApps.length === 1 ? "" : "s"} awaiting review` : "Certified clinical guides"}
          </p>
        </div>
      </div>

      {/* Main Card Container */}
      <div className="rounded-2xl border border-border bg-card shadow-xs overflow-hidden min-w-0 w-full">
        {/* Controls Bar */}
        <div className="p-3.5 sm:p-4 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
          {/* Segmented Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/50 border border-border/40 overflow-x-auto no-scrollbar w-full md:w-auto shrink-0">
            {[
              { id: "cases" as const, label: "Case Audits", count: pendingCases.length, icon: HiOutlineDocumentMagnifyingGlass },
              { id: "flagged" as const, label: "Flagged Reports", count: flaggedPosts.length, icon: HiOutlineShieldExclamation },
              { id: "feed" as const, label: "Live Feed Audit", count: livePosts.length, icon: HiOutlineChatBubbleLeftRight },
              { id: "mentors" as const, label: "Clinical Mentors", count: pendingMentorApps.length > 0 ? pendingMentorApps.length : approvedMentorApps.length, icon: HiOutlineCheckBadge },
              { id: "rules" as const, label: "Policies & Rules", count: null, icon: RiFileShield2Line },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setActiveTab(tab.id);
                  if (tab.id === "mentors") {
                    fetchMentorApplications();
                  }
                }}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 whitespace-nowrap shrink-0",
                  activeTab === tab.id
                    ? "bg-card text-foreground shadow-xs border border-border/60"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <tab.icon className={cn("h-3.5 w-3.5 shrink-0", activeTab === tab.id ? "text-primary" : "text-muted-foreground")} />
                <span>{tab.label}</span>
                {tab.count !== null && (
                  <span
                    className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-extrabold",
                      activeTab === tab.id
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Search Input on Right */}
          <div className="relative w-full md:w-80 shrink-0">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search discussions, author, role..."
              className="w-full h-9 pl-9 pr-8 rounded-xl border border-border bg-muted/30 focus:bg-card text-xs font-medium outline-none focus:ring-1 focus:ring-primary transition-all placeholder:text-muted-foreground"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
              >
                <HiOutlineXMark className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* =========================================================================
            TAB 1: FLAGGED REPORTS DESK
           ========================================================================= */}
        {activeTab === "flagged" && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex flex-wrap items-center gap-2">
                  <span>Reported Member Discussions</span>
                  <span className="rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black px-2 py-0.5 whitespace-nowrap shrink-0">
                    {filteredFlagged.length} Pending Resolution
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Posts automatically hidden or flagged by peers for privacy breaches, WhatsApp recruiter spam, or clinical misinformation.
                </p>
              </div>

              {/* Sub-filter chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {[
                  { id: "all", label: "All Flagged" },
                  { id: "privacy", label: "Patient Privacy" },
                  { id: "spam", label: "Recruiter Spam" },
                ].map((f) => (
                  <button
                    key={f.id}
                    onClick={() => setFlagFilter(f.id as any)}
                    className={cn(
                      "text-[11px] font-bold px-2.5 py-1 rounded-lg border transition-all cursor-pointer",
                      flagFilter === f.id
                        ? "bg-primary text-white border-primary"
                        : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground"
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredFlagged.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                  <HiOutlineShieldCheck className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-extrabold text-foreground">
                  No Pending Flagged Reports
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  All community flags have been audited. The clinical peer forum is healthy, spam-free, and compliant with privacy standards.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFlagged.map((post) => {
                  const modScan = getPostAiModeration(post);
                  const isViolation = modScan.status === "FLAGGED";

                  return (
                    <div
                      key={post.id}
                      className="rounded-xl border border-border/80 bg-card p-4 hover:border-primary/40 transition-all space-y-3 shadow-2xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Author info with avatar */}
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                            {post.authorName ? post.authorName.charAt(0) : "U"}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-foreground">
                                {post.authorName}
                              </span>
                              <span className="text-[11px] text-muted-foreground">
                                ({post.authorRole})
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {post.at}
                            </div>
                          </div>
                        </div>

                        {/* Status badges */}
                        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                          <span
                            className={cn(
                              "rounded-md border px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 whitespace-nowrap",
                              isViolation
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                                : "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
                            )}
                          >
                            <RiAlertLine className="h-3 w-3 shrink-0" />
                            {isViolation ? "Flagged Review" : "Community Safe"}
                          </span>
                          <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {post.reports.length} report{post.reports.length > 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>

                      {/* Community Moderation Guardrail Analysis */}
                      <div
                        className={cn(
                          "rounded-lg border p-2.5 text-[11px] flex flex-wrap items-center justify-between gap-1.5",
                          isViolation
                            ? "bg-amber-500/5 border-amber-500/20"
                            : "bg-emerald-500/5 border-emerald-500/20"
                        )}
                      >
                        <span
                          className={cn(
                            "font-bold flex items-center gap-1.5",
                            isViolation ? "text-amber-800 dark:text-amber-300" : "text-emerald-800 dark:text-emerald-300"
                          )}
                        >
                          <BotMessageSquare className="h-3.5 w-3.5" /> Moderation Scan:
                        </span>
                        <span className="text-[10px] font-semibold text-foreground/85">
                          {modScan.category}
                        </span>
                      </div>

                      {/* Flag report reasons list */}
                      {post.reports.length > 0 && (
                        <div className="rounded-lg bg-muted/50 border border-border/60 p-2.5 text-[11px] space-y-1">
                          <div className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider">
                            Reporter Notes &amp; Violation Feedback:
                          </div>
                          <div className="space-y-0.5">
                            {post.reports.map((r, i) => (
                              <div key={i} className="text-foreground/90 flex items-start gap-1.5">
                                <span className="text-primary font-bold">•</span>
                                <span>
                                  {r === "current-user"
                                    ? "Reported by forum member for moderation review"
                                    : r}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

              {/* Attached Image Preview if present */}
                      {post.image && (
                        <div className="rounded-xl overflow-hidden border border-border/80 max-w-md bg-muted/20 p-2">
                          <span className="text-[10px] font-bold text-muted-foreground block mb-1">Attached Clinical Imagery:</span>
                          <img
                            src={post.image}
                            alt="Submitted clinical scan"
                            className="max-h-64 w-full rounded-lg object-contain bg-black/5"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                      )}

                      {/* Content Preview */}
                      <div className="rounded-lg bg-card border border-border/60 p-3 text-xs text-foreground leading-relaxed">
                        <p className="line-clamp-3 font-normal whitespace-pre-wrap">
                          {post.text}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/40">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedPost(post);
                            setSheetOpen(true);
                          }}
                          className="h-8 text-xs font-bold gap-1 text-muted-foreground hover:text-primary hover:bg-primary/5 justify-center sm:justify-start"
                        >
                          <HiOutlineEye className="h-3.5 w-3.5" />
                          <span>Inspect Full Details</span>
                        </Button>

                        <div className="grid grid-cols-3 sm:flex sm:items-center gap-1.5 sm:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDismissReport(post)}
                            className="h-8 text-xs font-bold gap-1 text-foreground border border-border/80 hover:bg-muted px-2 justify-center"
                          >
                            <HiCheck className="h-3.5 w-3.5 shrink-0 text-primary" />
                            <span className="truncate">Dismiss</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setPostToWarn(post);
                              setWarnModalOpen(true);
                            }}
                            className="h-8 text-xs font-bold gap-1 text-primary border border-primary/30 hover:bg-primary/10 px-2 justify-center"
                          >
                            <HiOutlineExclamationTriangle className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Warn</span>
                          </Button>

                          <Button
                            size="sm"
                            onClick={() => {
                              setPostToDelete(post);
                              setDeleteModalOpen(true);
                            }}
                            className="h-8 text-xs font-bold gap-1 bg-primary text-white hover:bg-primary-hover px-2 justify-center shadow-2xs"
                          >
                            <HiOutlineTrash className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate">Delete</span>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 2: CLINICAL CASE PRIVACY & DE-IDENTIFICATION QUEUE
           ========================================================================= */}
        {activeTab === "cases" && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="pb-3 border-b border-border/60">
              <h3 className="text-sm font-extrabold text-foreground flex flex-wrap items-center gap-2">
                <span>Clinical Case Study De-Identification Desk</span>
                <span className="rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black px-2 py-0.5 whitespace-nowrap shrink-0">
                  {pendingCases.length} Awaiting Sign-off
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Every peer clinical case or patient rehabilitation query must be audited by an admin clinician to ensure 100% de-identification before being published to the public feed.
              </p>
            </div>

            {pendingCases.length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mx-auto">
                  <HiOutlineDocumentMagnifyingGlass className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-extrabold text-foreground">
                  Case Review Queue Clear
                </h4>
                <p className="text-xs text-muted-foreground max-w-md mx-auto">
                  All submitted clinical cases have been audited and approved to the live Huddle stream.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingCases.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-4 hover:border-primary/40 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-border/60">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                          {post.authorName ? post.authorName.charAt(0) : "C"}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-foreground">
                              {post.authorName}
                            </span>
                            <span className="text-[11px] text-muted-foreground">
                              ({post.authorRole})
                            </span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            Submitted {post.at} · Pending clinical anonymity compliance
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 shrink-0">
                        <span className="rounded-md bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 text-[10px] font-extrabold whitespace-nowrap">
                          {post.type} · {post.field}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 whitespace-nowrap">
                          Held for Review
                        </span>
                      </div>
                    </div>

                    {/* Case Text Preview */}
                    <div className="rounded-lg bg-muted/30 border border-border/60 p-3.5 text-xs text-foreground leading-relaxed font-mono">
                      {post.text}
                    </div>

                    {/* Attached Image Preview if present */}
                    {post.image && (
                      <div className="rounded-xl overflow-hidden border border-border/80 max-w-md bg-muted/20 p-2">
                        <span className="text-[10px] font-bold text-muted-foreground block mb-1">Attached Clinical Imagery:</span>
                        <img
                          src={post.image}
                          alt="Submitted clinical scan"
                          className="max-h-64 w-full rounded-lg object-contain bg-black/5"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    )}

                    {/* De-identification Verification Checklist */}
                    <div className="rounded-xl bg-card border border-border/80 p-3.5 space-y-2.5">
                      <div className="text-[11px] font-extrabold text-foreground flex items-center gap-1.5">
                        <HiOutlineShieldCheck className="h-4 w-4 text-primary" />
                        <span>Clinical Privacy Audit Checklist (Mandatory Sign-off):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                        <label className="flex items-center gap-2 text-foreground/90 cursor-pointer select-none">
                          <Checkbox
                            checked={checklist.zeroPatientNames}
                            onCheckedChange={(checked) =>
                              setChecklist({ ...checklist, zeroPatientNames: Boolean(checked) })
                            }
                          />
                          <span>Zero patient names or initials present</span>
                        </label>
                        <label className="flex items-center gap-2 text-foreground/90 cursor-pointer select-none">
                          <Checkbox
                            checked={checklist.zeroUhidMrd}
                            onCheckedChange={(checked) =>
                              setChecklist({ ...checklist, zeroUhidMrd: Boolean(checked) })
                            }
                          />
                          <span>Zero UHID, MRD or IP registration numbers</span>
                        </label>
                        <label className="flex items-center gap-2 text-foreground/90 cursor-pointer select-none">
                          <Checkbox
                            checked={checklist.bedWardRedacted}
                            onCheckedChange={(checked) =>
                              setChecklist({ ...checklist, bedWardRedacted: Boolean(checked) })
                            }
                          />
                          <span>Bed numbers &amp; specific ICU ward redacted</span>
                        </label>
                        <label className="flex items-center gap-2 text-foreground/90 cursor-pointer select-none">
                          <Checkbox
                            checked={checklist.clinicalIntent}
                            onCheckedChange={(checked) =>
                              setChecklist({ ...checklist, clinicalIntent: Boolean(checked) })
                            }
                          />
                          <span>Legitimate peer clinical inquiry &amp; educational intent</span>
                        </label>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-border/40">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedPost(post);
                          setSheetOpen(true);
                        }}
                        className="h-8 text-xs font-bold gap-1 text-muted-foreground hover:text-primary hover:bg-primary/5 justify-center sm:justify-start"
                      >
                        <HiOutlineEye className="h-3.5 w-3.5" />
                        <span>Full Audit View</span>
                      </Button>

                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPostToWarn(post);
                            setWarningReason(
                              "Please redact patient specifics (UHID/Bed/Location) before resubmitting this clinical case."
                            );
                            setWarnModalOpen(true);
                          }}
                          className="h-8 text-xs font-bold gap-1 text-primary border border-primary/30 hover:bg-primary/10 px-2.5 justify-center"
                        >
                          <HiOutlineExclamationTriangle className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Request Redaction</span>
                        </Button>

                        <Button
                          size="sm"
                          onClick={() => handleApprovePost(post)}
                          className="h-8 text-xs font-bold gap-1.5 bg-primary text-white hover:bg-primary-hover shadow-2xs px-3 justify-center"
                        >
                          <HiCheck className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">Approve &amp; Publish</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: LIVE FEED & FULL DISCUSSIONS AUDIT
           ========================================================================= */}
        {activeTab === "feed" && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex items-center gap-2">
                  <span>Live Feed Audit &amp; Activity Stream</span>
                  <span className="rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black px-2 py-0.5">
                    {filteredLive.length} Discussions
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Published peer cases, clinical thoughts, CME events and peer discussions.
                </p>
              </div>

              {/* Filters toolbar right above table */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="w-36">
                  <Select value={fieldFilter} onValueChange={(val) => setFieldFilter(val)}>
                    <SelectTrigger className="h-8 w-full rounded-xl border border-border bg-card px-2.5 text-xs font-semibold text-foreground hover:bg-muted/40">
                      <SelectValue placeholder="All Specialties" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border bg-card p-1 shadow-lg z-50">
                      <SelectItem value="All" className="text-xs font-medium">All Specialties</SelectItem>
                      <SelectItem value="Nursing" className="text-xs font-medium">Nursing</SelectItem>
                      <SelectItem value="Physio" className="text-xs font-medium">Physiotherapy</SelectItem>
                      <SelectItem value="Medicine" className="text-xs font-medium">Medicine</SelectItem>
                      <SelectItem value="Radiology" className="text-xs font-medium">Radiology</SelectItem>
                      <SelectItem value="Lab" className="text-xs font-medium">Lab / Pathology</SelectItem>
                      <SelectItem value="Pharmacy" className="text-xs font-medium">Pharmacy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-36">
                  <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val)}>
                    <SelectTrigger className="h-8 w-full rounded-xl border border-border bg-card px-2.5 text-xs font-semibold text-foreground hover:bg-muted/40">
                      <SelectValue placeholder="All Post Types" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border border-border bg-card p-1 shadow-lg z-50">
                      <SelectItem value="All" className="text-xs font-medium">All Post Types</SelectItem>
                      <SelectItem value="Case" className="text-xs font-medium">Clinical Case</SelectItem>
                      <SelectItem value="Question" className="text-xs font-medium">Peer Question</SelectItem>
                      <SelectItem value="Thought" className="text-xs font-medium">Thought</SelectItem>
                      <SelectItem value="Event" className="text-xs font-medium">CME / Workshop</SelectItem>
                      <SelectItem value="Experience" className="text-xs font-medium">Shift Experience</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(fieldFilter !== "All" || typeFilter !== "All") && (
                  <button
                    onClick={() => {
                      setFieldFilter("All");
                      setTypeFilter("All");
                    }}
                    className="text-xs font-bold text-primary hover:underline px-2.5 py-1 rounded-lg border border-primary/20 bg-primary/5 cursor-pointer"
                  >
                    Reset
                  </button>
                )}
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block rounded-xl border border-border/80 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="text-xs font-bold text-muted-foreground w-12 text-center">
                      Type
                    </TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">
                      Author &amp; Cadre
                    </TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground">
                      Discussion Snippet
                    </TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground text-center">
                      Engagement
                    </TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground text-center">
                      Posted On
                    </TableHead>
                    <TableHead className="text-xs font-bold text-muted-foreground text-right pr-4">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLive.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-xs text-muted-foreground">
                        No live discussions match your active search or filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLive.map((post) => (
                      <TableRow key={post.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell className="text-center">
                          <span
                            className={cn(
                              "text-[10px] font-black uppercase px-2 py-0.5 rounded-md border",
                              post.type === "Case"
                                ? "bg-primary/10 text-primary border-primary/20"
                                : post.type === "Event"
                                  ? "bg-primary text-white border-primary"
                                  : post.type === "Question"
                                    ? "bg-secondary/10 text-secondary-foreground border-border/80"
                                    : "bg-muted text-muted-foreground border-border/60"
                            )}
                          >
                            {post.type}
                          </span>
                        </TableCell>

                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-xs shrink-0">
                              {post.isHospital ? (
                                <RiHospitalLine className="h-3.5 w-3.5" />
                              ) : (
                                post.authorName[0]
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-bold text-foreground truncate max-w-[140px]">
                                  {post.isHospital ? post.hospitalName : post.authorName}
                                </span>
                                {post.pinned && (
                                  <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-1 rounded">
                                    PINNED
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground truncate block">
                                {post.authorRole} · {post.field}
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="max-w-md">
                          <div className="flex items-center justify-between gap-3 min-h-[44px]">
                            <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed min-w-0 flex-1">
                              {post.text}
                            </p>
                            {(post.image || (post as any).imageUrl) && (
                              <img
                                src={post.image || (post as any).imageUrl}
                                alt=""
                                className="h-9 w-9 rounded-lg object-cover border border-border/80 shrink-0 bg-muted/20 cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedPost(post);
                                  setSheetOpen(true);
                                }}
                                onError={(e) => {
                                  (e.currentTarget as HTMLElement).style.display = "none";
                                }}
                              />
                            )}
                          </div>
                        </TableCell>

                        <TableCell className="text-center">
                          <div className="text-xs font-mono font-bold text-foreground">
                            {post.helpfulCount} <span className="text-[10px] text-muted-foreground font-sans">helps</span>
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {post.replies?.length || 0} replies
                          </div>
                        </TableCell>

                        <TableCell className="text-center text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {post.at}
                        </TableCell>

                        <TableCell className="text-right pr-4">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleTogglePin(post)}
                              title={post.pinned ? "Unpin from top" : "Pin to top of feed"}
                              className={cn(
                                "h-7 w-7 p-0 rounded-lg",
                                post.pinned ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                              )}
                            >
                              {post.pinned ? (
                                <RiPushpinFill className="h-3.5 w-3.5 text-primary" />
                              ) : (
                                <RiPushpinLine className="h-3.5 w-3.5" />
                              )}
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setSelectedPost(post);
                                setSheetOpen(true);
                              }}
                              title="Inspect Discussion"
                              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                            >
                              <HiOutlineEye className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                setPostToDelete(post);
                                setDeleteModalOpen(true);
                              }}
                              title="Remove Post"
                              className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                            >
                              <HiOutlineTrash className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Dedicated Mobile Cards View */}
            <div className="block md:hidden space-y-3">
              {filteredLive.length === 0 ? (
                <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border/80 rounded-xl">
                  No live discussions match your active search or filters.
                </div>
              ) : (
                filteredLive.map((post) => (
                  <div
                    key={post.id}
                    className="rounded-xl border border-border/80 bg-card p-3.5 space-y-3 hover:border-primary/40 transition-all shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-xs shrink-0">
                          {post.isHospital ? (
                            <RiHospitalLine className="h-4 w-4" />
                          ) : (
                            post.authorName[0]
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-bold text-foreground">
                              {post.isHospital ? post.hospitalName : post.authorName}
                            </span>
                            {post.pinned && (
                              <span className="text-[9px] font-bold text-primary bg-primary/10 border border-primary/20 px-1 rounded">
                                PINNED
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground block truncate">
                            {post.authorRole} · {post.field}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span
                          className={cn(
                            "text-[10px] font-black uppercase px-2 py-0.5 rounded-md border whitespace-nowrap",
                            post.type === "Case"
                              ? "bg-primary/10 text-primary border-primary/20"
                              : post.type === "Event"
                                ? "bg-primary text-white border-primary"
                                : post.type === "Question"
                                  ? "bg-secondary/10 text-secondary-foreground border-border/80"
                                  : "bg-muted text-muted-foreground border-border/60"
                          )}
                        >
                          {post.type}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {post.at}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-foreground/90 line-clamp-3 leading-relaxed">
                      {post.text}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px]">
                      <div className="flex items-center gap-3 text-muted-foreground">
                        <span className="font-mono font-bold text-foreground">
                          {post.helpfulCount} <span className="font-sans font-normal text-muted-foreground">helps</span>
                        </span>
                        <span>·</span>
                        <span>{post.replies?.length || 0} replies</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleTogglePin(post)}
                          title={post.pinned ? "Unpin" : "Pin"}
                          className={cn(
                            "h-7 w-7 p-0 rounded-lg",
                            post.pinned ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          {post.pinned ? (
                            <RiPushpinFill className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <RiPushpinLine className="h-3.5 w-3.5" />
                          )}
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedPost(post);
                            setSheetOpen(true);
                          }}
                          title="Inspect"
                          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-foreground"
                        >
                          <HiOutlineEye className="h-3.5 w-3.5" />
                        </Button>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setPostToDelete(post);
                            setDeleteModalOpen(true);
                          }}
                          title="Delete"
                          className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                        >
                          <HiOutlineTrash className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 4: CLINICAL MENTORS DESK
           ========================================================================= */}
        {activeTab === "mentors" && (
          <div className="p-4 sm:p-6 space-y-6">
            {/* Sub-section 1: Pending Clinical Mentor Applications Queue */}
            <div className="rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-primary">
                    Clinical Mentor Seal Applications ({pendingMentorApps.length} Pending Review)
                  </h4>
                </div>
                <span className="text-[11px] text-muted-foreground">
                  Minimum criterion: 3+ years verified clinical experience
                </span>
              </div>

              {pendingMentorApps.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs bg-card/60 rounded-xl border border-border/40 space-y-1">
                  <HiOutlineCheckBadge className="h-6 w-6 mx-auto text-primary/60" />
                  <p className="font-semibold text-foreground">All Mentor Applications Audited</p>
                  <p className="text-[11px]">No candidate applications currently pending verification.</p>
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {pendingMentorApps.map((app) => (
                    <div
                      key={app.id}
                      className="rounded-xl border border-border bg-card p-4 shadow-2xs space-y-3 hover:border-primary/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-sm shrink-0">
                            {(app.name || "C")[0]}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-black text-foreground truncate">
                              {app.name || "Healthcare Practitioner"}
                            </h5>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {app.profession || "Clinician"} • {app.specialty || "Medicine"}
                            </p>
                          </div>
                        </div>
                        <span className="rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black px-2 py-0.5 shrink-0 flex items-center gap-1">
                          <HiOutlineClock className="h-3 w-3" />
                          Pending Audit
                        </span>
                      </div>

                      <div className="rounded-lg bg-muted/40 p-2.5 space-y-1 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Clinical Experience:</span>
                          <span className="font-extrabold text-primary flex items-center gap-1">
                            <HiCheckCircle className="h-3.5 w-3.5" />
                            {app.yearsExperience ?? 3}+ Years (Eligible for Seal)
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Affiliated Org / Hospital:</span>
                          <span className="font-medium text-foreground truncate max-w-[180px]">
                            {app.organization || "Private Practice / Clinic"}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Applied Date:</span>
                          <span className="text-muted-foreground font-mono">
                            {app.appliedAt ? new Date(app.appliedAt).toLocaleDateString("en-IN") : "Today"}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          type="button"
                          onClick={() => handleReviewMentor(app.id!, true, app.name)}
                          className="flex-1 h-8 text-xs font-bold gap-1.5 bg-primary text-white hover:bg-primary/90 rounded-xl cursor-pointer"
                        >
                          <HiOutlineCheckBadge className="h-4 w-4" />
                          Verify & Grant Seal
                        </Button>
                        <Button
                          size="sm"
                          type="button"
                          variant="outline"
                          onClick={() => handleReviewMentor(app.id!, false, app.name)}
                          className="h-8 text-xs font-bold text-muted-foreground hover:text-destructive hover:border-destructive/40 rounded-xl cursor-pointer"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sub-section 2: Certified Clinical Mentors Directory */}
            <div className="space-y-4">
              <div className="pb-3 border-b border-border/60">
                <h3 className="text-sm font-extrabold text-foreground flex flex-wrap items-center gap-2">
                  <span>Certified Clinical Mentors Directory</span>
                  <span className="rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black px-2 py-0.5 whitespace-nowrap shrink-0">
                    {approvedMentorApps.length} Active Mentors
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Senior clinicians authorized to answer peer queries and mentor junior nurses, students, and interns.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {approvedMentorApps.length === 0 ? (
                  <div className="text-center py-10 text-muted-foreground text-xs bg-muted/20 rounded-2xl border border-dashed border-border/60 space-y-1.5 col-span-full">
                    <HiOutlineCheckBadge className="h-7 w-7 mx-auto text-muted-foreground/60" />
                    <p className="font-semibold text-foreground text-sm">No Certified Mentors Yet</p>
                    <p className="text-[11px] max-w-sm mx-auto">
                      When healthcare practitioners with 3+ years of clinical experience apply and are verified by Admin, their accredited mentor profile will appear here.
                    </p>
                  </div>
                ) : (
                  approvedMentorApps.map((app) => (
                    <div
                      key={`app-${app.id}`}
                      className="rounded-xl border border-primary/30 bg-card p-4 sm:p-5 shadow-2xs space-y-3.5 hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-sm shrink-0">
                            {(app.name || "M")[0]}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-xs font-black text-foreground truncate">
                                {app.name || "Certified Mentor"}
                              </h4>
                              <HiOutlineCheckBadge className="h-4 w-4 text-primary shrink-0" />
                            </div>
                            <p className="text-[11px] text-muted-foreground truncate">
                              {app.profession || "Senior Clinician"}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => handleToggleMentor(app.id!, app.name || "Clinician")}
                          className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer shrink-0",
                            app.verified
                              ? "bg-primary/10 text-primary border-primary/20"
                              : "bg-muted text-muted-foreground border-border/60"
                          )}
                        >
                          {app.verified ? "Verified Seal" : "Suspended"}
                        </button>
                      </div>

                      <div className="rounded-lg bg-muted/40 p-2.5 space-y-1.5 text-[11px]">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Affiliated Org:</span>
                          <strong className="text-foreground truncate max-w-[150px]">
                            {app.organization || "FALE Peer Network"}
                          </strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Clinical Exp:</span>
                          <strong className="text-foreground">{app.yearsExperience ?? 3}+ Years</strong>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Specialty:</span>
                          <strong className="text-foreground truncate max-w-[150px]">
                            {app.specialty || "General Medicine"}
                          </strong>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                        <span className="text-muted-foreground font-medium">Status:</span>
                        <span className="font-bold text-primary flex items-center gap-1">
                          <RiVerifiedBadgeFill className="h-3.5 w-3.5 text-primary" />
                          Accredited FALE Mentor
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 5: COMMUNITY GUARDRAILS & POLICIES
           ========================================================================= */}
        {activeTab === "rules" && (
          <div className="p-4 sm:p-6 space-y-6">
            <div className="pb-3 border-b border-border/60">
              <h3 className="text-sm font-extrabold text-foreground flex flex-wrap items-center gap-2">
                <span>FALE Huddle Moderation Engine &amp; Privacy Policies</span>
                <span className="rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black px-2 py-0.5 whitespace-nowrap shrink-0">
                  Automated Guardrails Active
                </span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Configured rules enforcing patient anonymity, commercial recruiter filtering, and role-based publishing controls.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="text-xs font-black text-foreground">
                  Patient De-Identification (NABH / HIPAA)
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  All clinical cases and imagery must obscure patient names, hospital UHID/MRD numbers, bed labels, and facial identifiers. Case posts default to the Review Queue until an admin signs off.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="text-xs font-black text-foreground">
                  Zero Commercial Recruiter Spam
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Direct job advertisements, broker contact solicitations, and WhatsApp links are automatically intercepted. Hospitals must post requirements via verified FALE Employer Portals.
                </p>
              </div>

              <div className="rounded-xl border border-border/80 bg-card p-4 space-y-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-bold">
                  3
                </div>
                <h4 className="text-xs font-black text-foreground">
                  Role-Gated Clinical Permissions
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Final-year students can ask questions and discuss exam prep, but cannot prescribe drug dosages or give mentor advice. Only verified doctors and senior charge nurses can hold the Mentor Seal.
                </p>
              </div>
            </div>

            {/* Configured Role Privilege Matrix */}
            <div className="rounded-xl border border-border/80 overflow-hidden space-y-2">
              <div className="bg-muted/40 p-3 font-extrabold text-xs text-foreground flex items-center justify-between">
                <span>Role Privilege Access Matrix</span>
                <span className="text-[10px] text-muted-foreground font-normal md:hidden">
                  (Swipe horizontally)
                </span>
              </div>
              <div className="overflow-x-auto no-scrollbar">
                <Table className="min-w-[520px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">User Role</TableHead>
                      <TableHead className="text-xs">Ask Questions</TableHead>
                      <TableHead className="text-xs">Share Cases</TableHead>
                      <TableHead className="text-xs">Post CME Events</TableHead>
                      <TableHead className="text-xs">Verified Mentor Seal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="text-xs">
                    <TableRow>
                      <TableCell className="font-bold">Student / Intern</TableCell>
                      <TableCell className="text-primary font-bold">✓ Allowed</TableCell>
                      <TableCell className="text-muted-foreground font-semibold">Under Review</TableCell>
                      <TableCell className="text-muted-foreground">✕ Restricted</TableCell>
                      <TableCell className="text-muted-foreground">✕ Not Eligible</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold">Fresher (Council Reg)</TableCell>
                      <TableCell className="text-primary font-bold">✓ Allowed</TableCell>
                      <TableCell className="text-muted-foreground font-semibold">Under Review</TableCell>
                      <TableCell className="text-muted-foreground">✕ Restricted</TableCell>
                      <TableCell className="text-muted-foreground">✕ Not Eligible</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold">Experienced Clinician</TableCell>
                      <TableCell className="text-primary font-bold">✓ Allowed</TableCell>
                      <TableCell className="text-primary font-bold">✓ Allowed</TableCell>
                      <TableCell className="text-muted-foreground">✕ Restricted</TableCell>
                      <TableCell className="text-primary font-bold">★ Eligible on Audit</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell className="font-bold">Verified Hospital</TableCell>
                      <TableCell className="text-muted-foreground">✕ Restricted</TableCell>
                      <TableCell className="text-muted-foreground">✕ Restricted</TableCell>
                      <TableCell className="text-primary font-bold">✓ Verified CMEs Only</TableCell>
                      <TableCell className="text-muted-foreground">✕ Institutional</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          SLIDE-OVER INSPECTION DRAWER (SHEET)
         ========================================================================= */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto p-0">
          {selectedPost && (
            <div className="p-6 space-y-6">
              <SheetHeader className="space-y-1 text-left pb-4 border-b border-border/80">
                <div className="flex items-center justify-between pr-8">
                  <span
                    className={cn(
                      "text-[10px] font-black uppercase px-2 py-0.5 rounded-md border",
                      selectedPost.type === "Case"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-primary text-white border-primary"
                    )}
                  >
                    {selectedPost.type} · {selectedPost.field}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] font-bold px-2 py-0.5 rounded-full border",
                      selectedPost.status === "live"
                        ? "bg-primary/10 text-primary border-primary/20"
                        : selectedPost.status === "review"
                          ? "bg-primary/15 text-primary border-primary/30"
                          : "bg-muted text-muted-foreground border-border/60"
                    )}
                  >
                    Status: {selectedPost.status.toUpperCase()}
                  </span>
                </div>
                <SheetTitle className="text-base font-black text-foreground pt-1">
                  Discussion Audit &amp; Moderation
                </SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Submitted {selectedPost.at}
                </SheetDescription>
              </SheetHeader>

              {/* Author Details Card */}
              <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-sm shrink-0">
                    {selectedPost.isHospital ? (
                      <RiHospitalLine className="h-4 w-4" />
                    ) : (
                      selectedPost.authorName[0]
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-foreground truncate">
                        {selectedPost.isHospital ? selectedPost.hospitalName : selectedPost.authorName}
                      </span>
                      {selectedPost.isMentor && (
                        <HiOutlineCheckBadge className="h-4 w-4 text-primary shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-muted-foreground block truncate">
                      {selectedPost.authorRole} · {selectedPost.authorLevel}
                    </span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                    Council KYC Active
                  </span>
                </div>
              </div>

              {/* Community Reports Alert */}
              {selectedPost.reports && selectedPost.reports.length > 0 && (
                <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 space-y-1.5">
                  <div className="text-xs font-extrabold text-primary flex items-center gap-1.5">
                    <HiOutlineExclamationTriangle className="h-4 w-4" />
                    <span>Member Reports ({selectedPost.reports.length}):</span>
                  </div>
                  <ul className="space-y-1 text-xs text-foreground/90 pl-5 list-disc">
                    {selectedPost.reports.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Community Moderation Scan Card (#17) */}
              {(() => {
                const modScan = getPostAiModeration(selectedPost);
                const isScanning = scanningPostId === selectedPost.id;
                const isViolation = modScan.status === "FLAGGED";

                return (
                  <div
                    className={cn(
                      "rounded-2xl border p-4 sm:p-5 space-y-3 shadow-xs transition-colors",
                      isViolation
                        ? "border-amber-500/30 bg-amber-500/5"
                        : "border-emerald-500/30 bg-emerald-500/5"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "grid h-7 w-7 place-items-center rounded-lg",
                            isViolation ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"
                          )}
                        >
                          <BotMessageSquare className="h-4 w-4" />
                        </span>
                        <span
                          className={cn(
                            "text-xs font-bold uppercase tracking-wider",
                            isViolation ? "text-amber-800 dark:text-amber-300" : "text-emerald-800 dark:text-emerald-300"
                          )}
                        >
                          AI Community Moderation Scan
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-[10px] font-extrabold px-2 py-0.5 rounded-full border",
                            isViolation
                              ? "text-amber-700 dark:text-amber-300 bg-amber-500/15 border-amber-500/30"
                              : "text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border-emerald-500/30"
                          )}
                        >
                          {isViolation ? "Policy Violation Flagged" : "Community Safe"}
                        </span>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isScanning}
                          onClick={() => handleScanPostWithAi(selectedPost)}
                          className={cn(
                            "h-6 px-2 text-[10px] font-bold rounded-md gap-1 cursor-pointer",
                            isViolation
                              ? "border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                              : "border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
                          )}
                        >
                          <BotMessageSquare className="h-3 w-3" />
                          <span>{isScanning ? "Scanning with AI..." : "Re-scan Content"}</span>
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-foreground/90 leading-relaxed space-y-1.5">
                      <p
                        className={cn(
                          "font-bold text-[11px]",
                          isViolation ? "text-amber-800 dark:text-amber-300" : "text-emerald-800 dark:text-emerald-300"
                        )}
                      >
                        Category: {modScan.category}
                      </p>
                      <p className="text-foreground/80 leading-relaxed text-[11px]">
                        {modScan.rationale}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Full Discussion Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Post Content Text:
                </label>
                <div className="rounded-xl border border-border/80 bg-card p-4 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedPost.text}
                </div>
              </div>

              {/* Attached Clinical Imagery if present */}
              {(selectedPost.image || (selectedPost as any).imageUrl) && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Attached Clinical Imagery:
                  </label>
                  <div className="rounded-xl overflow-hidden border border-border/80 bg-muted/20 p-2 max-w-full">
                    <img
                      src={selectedPost.image || (selectedPost as any).imageUrl}
                      alt="Attached clinical scan"
                      className="max-h-72 w-full object-contain rounded-lg bg-black/5"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = "none";
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Engagement Stats */}
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="rounded-xl border border-border/80 bg-muted/20 p-2.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Helpful Upvotes
                  </span>
                  <span className="text-base font-black font-mono text-foreground">
                    {selectedPost.helpfulCount}
                  </span>
                </div>
                <div className="rounded-xl border border-border/80 bg-muted/20 p-2.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">
                    Replies Logged
                  </span>
                  <span className="text-base font-black font-mono text-foreground">
                    {selectedPost.replies?.length || 0}
                  </span>
                </div>
              </div>

              {/* Reply Thread Preview */}
              {selectedPost.replies && selectedPost.replies.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Recent Replies ({selectedPost.replies.length}):
                  </label>
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {selectedPost.replies.map((rep) => (
                      <div
                        key={rep.id}
                        className="rounded-lg border border-border/60 bg-muted/20 p-2.5 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <strong className="text-foreground">{rep.authorName}</strong>
                          <span className="text-muted-foreground">{rep.at}</span>
                        </div>
                        <p className="text-muted-foreground">{rep.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons in Drawer */}
              <div className="pt-4 border-t border-border/80 space-y-2">
                {selectedPost.status !== "live" && (
                  <Button
                    size="sm"
                    onClick={() => handleApprovePost(selectedPost)}
                    className="w-full h-9 text-xs font-bold gap-1.5 bg-primary text-white hover:bg-primary-hover rounded-xl shadow-xs"
                  >
                    <HiCheck className="h-4 w-4" />
                    <span>Approve &amp; Set Live</span>
                  </Button>
                )}

                {selectedPost.reports && selectedPost.reports.length > 0 && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDismissReport(selectedPost)}
                    className="w-full h-9 text-xs font-bold gap-1.5 text-foreground border border-border/80 hover:bg-muted rounded-xl"
                  >
                    <HiCheck className="h-4 w-4 text-primary" />
                    <span>Dismiss Reports &amp; Restore Live</span>
                  </Button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setPostToWarn(selectedPost);
                      setWarnModalOpen(true);
                    }}
                    className="h-9 text-xs font-bold gap-1 text-primary border border-primary/30 hover:bg-primary/10 rounded-xl"
                  >
                    <HiOutlineExclamationTriangle className="h-4 w-4" />
                    <span>Warn Author</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => {
                      setPostToDelete(selectedPost);
                      setDeleteModalOpen(true);
                    }}
                    className="h-9 text-xs font-bold gap-1 rounded-xl bg-primary text-white hover:bg-primary-hover shadow-2xs"
                  >
                    <HiOutlineTrash className="h-4 w-4" />
                    <span>Delete Post</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* =========================================================================
          DELETE CONFIRMATION MODAL
         ========================================================================= */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <HiOutlineTrash className="h-5 w-5 text-primary" />
              <span>Permanently Delete Huddle Discussion?</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              This action cannot be undone. The post and all associated peer comments will be permanently erased from the community database.
            </DialogDescription>
          </DialogHeader>

          {postToDelete && (
            <div className="rounded-xl border border-border/80 bg-muted/40 p-3 text-xs space-y-1">
              <strong className="text-foreground block truncate">
                Author: {postToDelete.authorName} ({postToDelete.authorRole})
              </strong>
              <p className="text-muted-foreground line-clamp-2">
                "{postToDelete.text}"
              </p>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDeleteModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleDeleteConfirm}
              className="text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary-hover"
            >
              Confirm Permanent Deletion
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* =========================================================================
          WARN AUTHOR MODAL
         ========================================================================= */}
      <Dialog open={warnModalOpen} onOpenChange={setWarnModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <HiOutlineExclamationTriangle className="h-5 w-5 text-primary" />
              <span>Issue Formal Clinical Warning</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Send an administrative compliance notice to the author. Repeated violations will result in council badge suspension.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-bold text-foreground">
                Violation Notice &amp; Guidance:
              </label>
              <textarea
                value={warningReason}
                onChange={(e) => setWarningReason(e.target.value)}
                rows={3}
                className="mt-1 w-full rounded-xl border border-border/80 bg-muted/40 p-2.5 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1.5">
              {[
                "Patient privacy breach (MRD/UHID)",
                "Commercial recruiter solicitation",
                "Unsubstantiated clinical claim",
                "Unprofessional communication",
              ].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() =>
                    setWarningReason(
                      `Clinical peer guidelines reminder: ${preset}. Please review community policies.`
                    )
                  }
                  className="rounded-lg bg-muted border border-border/60 px-2 py-1 text-[10px] font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setWarnModalOpen(false)}
              className="text-xs rounded-xl"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleWarnConfirm}
              className="text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary-hover"
            >
              Issue Notice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
