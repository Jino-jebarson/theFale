import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  HiOutlineChatBubbleLeftRight,
  HiChatBubbleLeftRight,
  HiOutlineShieldCheck,
  HiOutlineShieldExclamation,
  HiOutlineExclamationTriangle,
  HiOutlineCheckBadge,
  HiCheck,
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
} from "react-icons/ri";
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
  clinicalMentors as initialMentorsList,
  ClinicalMentor,
} from "@/lib/data";
import { cn } from "@/lib/utils";

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

export function AdminHuddleModeration() {
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

  // Dialog states
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<HuddlePost | null>(null);

  const [warnModalOpen, setWarnModalOpen] = useState(false);
  const [postToWarn, setPostToWarn] = useState<HuddlePost | null>(null);
  const [warningReason, setWarningReason] = useState(
    "Clinical peer guidelines: Content has been flagged for commercial solicitation or patient privacy risk."
  );

  // Mentor management state
  const [mentorsList, setMentorsList] = useState<ClinicalMentor[]>(initialMentorsList);
  const [addMentorModalOpen, setAddMentorModalOpen] = useState(false);
  const [newMentor, setNewMentor] = useState({
    name: "",
    role: "",
    org: "",
    yrs: 5,
    specialties: "",
  });

  // Checklist for clinical case review
  const [checklist, setChecklist] = useState({
    zeroPatientNames: true,
    zeroUhidMrd: true,
    bedWardRedacted: true,
    mediaDeIdentified: true,
    clinicalIntent: true,
  });

  // Calculate queue counts
  const allPosts = s.huddlePosts || [];
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

  const handleTogglePin = (post: HuddlePost) => {
    togglePostPinned(post.id);
    toast.info(post.pinned ? "Post Unpinned" : "Post Pinned to Community Top", {
      description: `Pin status updated for ${post.authorName}'s discussion.`,
    });
    if (selectedPost?.id === post.id) {
      setSelectedPost({ ...selectedPost, pinned: !selectedPost.pinned });
    }
  };

  const handleToggleMentor = (id: string, name: string) => {
    setMentorsList((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, verified: !m.verified } : m
      )
    );
    toast.success("Mentor Status Updated", {
      description: `Verified clinical seal updated for ${name}.`,
    });
  };

  const handleAddMentorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMentor.name || !newMentor.role || !newMentor.org) {
      toast.error("Please fill all required mentor details.");
      return;
    }
    const created: ClinicalMentor = {
      id: `m-${Date.now()}`,
      name: newMentor.name,
      role: newMentor.role,
      org: newMentor.org,
      yrs: Number(newMentor.yrs) || 3,
      answersCount: 0,
      specialties: newMentor.specialties
        ? newMentor.specialties.split(",").map((s) => s.trim())
        : ["General Clinical"],
      verified: true,
    };
    setMentorsList((prev) => [created, ...prev]);
    toast.success("Clinical Mentor Onboarded!", {
      description: `${created.name} is now certified with a Verified Clinical Mentor badge.`,
    });
    setAddMentorModalOpen(false);
    setNewMentor({ name: "", role: "", org: "", yrs: 5, specialties: "" });
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
      title={
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
            <HiOutlineShieldCheck className="h-5 w-5" />
          </div>
          <span>Huddle Moderation & Clinical Trust Desk</span>
        </div>
      }
      subtitle="Strict clinical governance: review flagged discussions, verify zero patient identifiers in clinical case studies, audit community reports, and certify verified mentors."
      actions={
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 w-full sm:w-auto">
          <Link
            to="/huddle"
            target="_blank"
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border border-border/80 bg-card hover:bg-muted text-foreground transition-all shadow-2xs flex-1 sm:flex-initial"
          >
            <HiOutlineArrowTopRightOnSquare className="h-4 w-4 text-primary shrink-0" />
            <span className="whitespace-nowrap">View Public Huddle</span>
          </Link>
          <Button
            size="sm"
            onClick={() => setActiveTab("rules")}
            variant="outline"
            className="text-xs font-bold gap-1.5 rounded-xl h-9 px-3.5 border-border/80 hover:bg-muted shadow-2xs flex-1 sm:flex-initial"
          >
            <HiOutlineInformationCircle className="h-4 w-4 text-primary shrink-0" />
            <span className="whitespace-nowrap">Safety Guidelines</span>
          </Button>
        </div>
      }
    >
      {/* Top 4 Enterprise KPI Metrics */}
      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 min-w-0 w-full">
        {/* Card 1: Flagged Reports */}
        <div
          onClick={() => setActiveTab("flagged")}
          className={cn(
            "rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all cursor-pointer",
            activeTab === "flagged"
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "border-border/80 bg-card hover:border-border"
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">
              Flagged Reports
            </span>
            <span
              className={cn(
                "flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border",
                flaggedPosts.length > 0
                  ? "text-primary bg-primary/10 border-primary/20"
                  : "text-muted-foreground bg-muted/60 border-border/60"
              )}
            >
              {flaggedPosts.length > 0 ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                  Action Required
                </>
              ) : (
                <>
                  <HiCheck className="h-3 w-3" /> All Clear
                </>
              )}
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
              {flaggedPosts.length}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              Avg SLA: &lt; 2 hrs
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            Reported by members for privacy, spam, or misconduct
          </p>
        </div>

        {/* Card 2: Clinical Privacy Queue */}
        <div
          onClick={() => setActiveTab("cases")}
          className={cn(
            "rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all cursor-pointer",
            activeTab === "cases"
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "border-border/80 bg-card hover:border-border"
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">
              Clinical Case Audits
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              <HiOutlineClock className="h-3 w-3 text-primary" /> De-ID Audit
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
              {pendingCases.length}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              Held for sign-off
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            Clinical case studies pending patient anonymity check
          </p>
        </div>

        {/* Card 3: Active Live Discussions */}
        <div
          onClick={() => setActiveTab("feed")}
          className={cn(
            "rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all cursor-pointer",
            activeTab === "feed"
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "border-border/80 bg-card hover:border-border"
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">
              Live Discussions
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-foreground bg-muted/60 border border-border/80 px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Active
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
              {livePosts.length}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {allPosts.reduce((acc, p) => acc + (p.replies?.length || 0), 0)} peer replies
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            Cases, questions, and verified CME workshops
          </p>
        </div>

        {/* Card 4: Clinical Mentors */}
        <div
          onClick={() => setActiveTab("mentors")}
          className={cn(
            "rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all cursor-pointer",
            activeTab === "mentors"
              ? "border-primary bg-primary/5 ring-1 ring-primary/20"
              : "border-border/80 bg-card hover:border-border"
          )}
        >
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">
              Verified Mentors
            </span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              <HiOutlineCheckBadge className="h-3 w-3 text-primary" /> FALE Certified
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline justify-between">
            <span className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground">
              {mentorsList.filter((m) => m.verified).length}
            </span>
            <span className="text-[11px] font-semibold text-muted-foreground">
              {mentorsList.reduce((acc, m) => acc + m.answersCount, 0)} answers logged
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground truncate">
            Senior charge nurses, MD doctors & lead therapists
          </p>
        </div>
      </div>

      {/* Main Tab Bar Navigation */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden">
        <div className="border-b border-border/80 bg-card/60 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/40 overflow-x-auto no-scrollbar max-w-full">
            <button
              onClick={() => setActiveTab("flagged")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "flagged"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <HiOutlineShieldExclamation
                className={cn(
                  "h-4 w-4",
                  flaggedPosts.length > 0 ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span>Flagged Reports</span>
              {flaggedPosts.length > 0 && (
                <span className="rounded-full bg-primary text-white px-1.5 py-0.2 text-[9px] font-black">
                  {flaggedPosts.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("cases")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "cases"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <HiOutlineDocumentMagnifyingGlass className="h-4 w-4 text-primary" />
              <span>Clinical Privacy Queue</span>
              {pendingCases.length > 0 && (
                <span className="rounded-full bg-primary/15 text-primary border border-primary/30 px-1.5 py-0.2 text-[9px] font-black">
                  {pendingCases.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab("feed")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "feed"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <HiOutlineChatBubbleLeftRight className="h-4 w-4 text-primary" />
              <span>Live Feed Audit</span>
              <span className="rounded-full bg-muted text-muted-foreground px-1.5 py-0.2 text-[9px] font-black border border-border/40">
                {livePosts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("mentors")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "mentors"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <HiOutlineCheckBadge className="h-4 w-4 text-primary" />
              <span>Clinical Mentors Desk</span>
              <span className="rounded-full bg-muted text-muted-foreground px-1.5 py-0.2 text-[9px] font-black border border-border/40">
                {mentorsList.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("rules")}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                activeTab === "rules"
                  ? "bg-card text-foreground shadow-xs border border-border/60"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              <RiFileShield2Line className="h-4 w-4 text-primary" />
              <span>Policies & Guardrails</span>
            </button>
          </div>

          {/* Quick Search across huddle content */}
          {(activeTab === "flagged" || activeTab === "feed" || activeTab === "cases") && (
            <div className="relative w-full sm:w-64">
              <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search post text, author, role…"
                className="h-9 w-full rounded-xl border border-border/80 bg-muted/40 pl-9 pr-8 text-xs outline-none focus:border-primary focus:bg-background transition-all"
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
          )}
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
                  const isSpam =
                    post.text.toLowerCase().includes("whatsapp") ||
                    post.text.toLowerCase().includes("+91");
                  const isPrivacy =
                    post.text.toLowerCase().includes("uhid") ||
                    post.text.toLowerCase().includes("mrd") ||
                    post.reports.some((r) => r.toLowerCase().includes("privacy"));

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
                          <span className="rounded-md bg-primary/10 border border-primary/20 text-primary px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 whitespace-nowrap">
                            <RiAlertLine className="h-3 w-3 shrink-0" />
                            {isSpam
                              ? "Recruiter Spam"
                              : isPrivacy
                                ? "Privacy Breach"
                                : "Community Flagged"}
                          </span>
                          <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full whitespace-nowrap">
                            {post.reports.length} report{post.reports.length > 1 ? "s" : ""}
                          </span>
                        </div>
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

                    {/* De-identification Verification Checklist */}
                    <div className="rounded-xl bg-card border border-border/80 p-3.5 space-y-2.5">
                      <div className="text-[11px] font-extrabold text-foreground flex items-center gap-1.5">
                        <HiOutlineShieldCheck className="h-4 w-4 text-primary" />
                        <span>Clinical Privacy Audit Checklist (Mandatory Sign-off):</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                        <label className="flex items-center gap-2 text-foreground/90 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklist.zeroPatientNames}
                            onChange={(e) =>
                              setChecklist({ ...checklist, zeroPatientNames: e.target.checked })
                            }
                            className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <span>Zero patient names or initials present</span>
                        </label>
                        <label className="flex items-center gap-2 text-foreground/90 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklist.zeroUhidMrd}
                            onChange={(e) =>
                              setChecklist({ ...checklist, zeroUhidMrd: e.target.checked })
                            }
                            className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <span>Zero UHID, MRD or IP registration numbers</span>
                        </label>
                        <label className="flex items-center gap-2 text-foreground/90 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklist.bedWardRedacted}
                            onChange={(e) =>
                              setChecklist({ ...checklist, bedWardRedacted: e.target.checked })
                            }
                            className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
                          />
                          <span>Bed numbers &amp; specific ICU ward redacted</span>
                        </label>
                        <label className="flex items-center gap-2 text-foreground/90 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={checklist.clinicalIntent}
                            onChange={(e) =>
                              setChecklist({ ...checklist, clinicalIntent: e.target.checked })
                            }
                            className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
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
            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div className="flex flex-wrap items-center gap-2">
                {/* Cadre Filter */}
                <Select value={fieldFilter} onValueChange={(val) => setFieldFilter(val)}>
                  <SelectTrigger
                    className="h-8 rounded-full border border-border/80 bg-card px-3 text-xs font-semibold text-foreground shadow-none hover:border-primary/50 focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer min-w-[140px] gap-2"
                  >
                    <SelectValue placeholder="All Specialties" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/80 bg-card p-1 shadow-xl">
                    <SelectItem value="All" className="rounded-lg text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary">
                      All Specialties
                    </SelectItem>
                    <SelectItem value="Nursing" className="rounded-lg text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary">
                      Nursing
                    </SelectItem>
                    <SelectItem value="Physio" className="rounded-lg text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary">
                      Physiotherapy
                    </SelectItem>
                    <SelectItem value="Medicine" className="rounded-lg text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary">
                      Medicine
                    </SelectItem>
                    <SelectItem value="Radiology" className="rounded-lg text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary">
                      Radiology
                    </SelectItem>
                    <SelectItem value="Lab" className="rounded-lg text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary">
                      Lab / Pathology
                    </SelectItem>
                    <SelectItem value="Pharmacy" className="rounded-lg text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary">
                      Pharmacy
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Post Type Filter */}
                <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val)}>
                  <SelectTrigger
                    className="h-8 rounded-full border border-border/80 bg-card px-3 text-xs font-semibold text-foreground shadow-none hover:border-primary/50 focus:ring-1 focus:ring-primary/40 focus:border-primary transition-all cursor-pointer min-w-[135px] gap-2"
                  >
                    <SelectValue placeholder="All Post Types" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border border-border/80 bg-card p-1 shadow-xl">
                    <SelectItem value="All" className="rounded-lg text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary">
                      All Post Types
                    </SelectItem>
                    <SelectItem value="Case" className="rounded-lg text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary">
                      Clinical Case
                    </SelectItem>
                    <SelectItem value="Question" className="rounded-lg text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary">
                      Peer Question
                    </SelectItem>
                    <SelectItem value="Thought" className="rounded-lg text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary">
                      Thought
                    </SelectItem>
                    <SelectItem value="Event" className="rounded-lg text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary">
                      CME / Workshop
                    </SelectItem>
                    <SelectItem value="Experience" className="rounded-lg text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary">
                      Shift Experience
                    </SelectItem>
                  </SelectContent>
                </Select>

                {(fieldFilter !== "All" || typeFilter !== "All" || searchQuery) && (
                  <button
                    onClick={() => {
                      setFieldFilter("All");
                      setTypeFilter("All");
                      setSearchQuery("");
                    }}
                    className="text-[11px] font-bold text-primary hover:underline px-1 cursor-pointer"
                  >
                    Reset Filters
                  </button>
                )}
              </div>

              <div className="text-xs text-muted-foreground font-semibold">
                Showing <strong className="text-foreground">{filteredLive.length}</strong> live discussions
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
                      Age
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
                          <p className="text-xs text-foreground/90 line-clamp-2 leading-relaxed">
                            {post.text}
                          </p>
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
                              <HiOutlineSparkles className="h-3.5 w-3.5" />
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
                          <HiOutlineSparkles className="h-3.5 w-3.5" />
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
          <div className="p-4 sm:p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
              <div>
                <h3 className="text-sm font-extrabold text-foreground flex flex-wrap items-center gap-2">
                  <span>Certified Clinical Mentors Directory</span>
                  <span className="rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black px-2 py-0.5 whitespace-nowrap shrink-0">
                    {mentorsList.filter((m) => m.verified).length} Active Mentors
                  </span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Senior clinicians authorized to answer peer queries and mentor junior nurses, students, and interns.
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => setAddMentorModalOpen(true)}
                className="h-9 text-xs font-bold gap-1.5 bg-primary text-white hover:bg-primary/90 rounded-xl shadow-2xs w-full sm:w-auto justify-center"
              >
                <HiOutlineUserPlus className="h-4 w-4" />
                <span>Onboard New Mentor</span>
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {mentorsList.map((mentor) => (
                <div
                  key={mentor.id}
                  className="rounded-xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3.5 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-black text-sm shrink-0">
                        {mentor.name[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-black text-foreground truncate">
                            {mentor.name}
                          </h4>
                          {mentor.verified && (
                            <HiOutlineCheckBadge className="h-4 w-4 text-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {mentor.role}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleMentor(mentor.id, mentor.name)}
                      className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all cursor-pointer shrink-0",
                        mentor.verified
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-muted text-muted-foreground border-border/60"
                      )}
                    >
                      {mentor.verified ? "Verified Seal" : "Suspended"}
                    </button>
                  </div>

                  <div className="rounded-lg bg-muted/40 p-2.5 space-y-1.5 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Affiliated Org:</span>
                      <strong className="text-foreground truncate max-w-[150px]">
                        {mentor.org}
                      </strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Clinical Exp:</span>
                      <strong className="text-foreground">{mentor.yrs} Years</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Q&amp;A Answers:</span>
                      <strong className="text-foreground font-mono">
                        {mentor.answersCount} logged
                      </strong>
                    </div>
                  </div>

                  {/* Specialty Tags */}
                  <div className="flex flex-wrap gap-1.5">
                    {mentor.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className="rounded-md bg-card border border-border/60 px-2 py-0.5 text-[10px] font-bold text-muted-foreground"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground font-medium">Status:</span>
                    <span className="font-bold text-foreground">
                      {mentor.verified ? "Active on Mentor Panel" : "Badge Revoked"}
                    </span>
                  </div>
                </div>
              ))}
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
                <div className="flex items-center justify-between">
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
                  Post ID: <span className="font-mono">{selectedPost.id}</span> · Submitted {selectedPost.at}
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

              {/* Full Discussion Content */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Post Content Text:
                </label>
                <div className="rounded-xl border border-border/80 bg-card p-4 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedPost.text}
                </div>
              </div>

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

      {/* =========================================================================
          ONBOARD NEW MENTOR MODAL
         ========================================================================= */}
      <Dialog open={addMentorModalOpen} onOpenChange={setAddMentorModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
              <HiOutlineUserPlus className="h-5 w-5 text-primary" />
              <span>Certify Clinical Mentor</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1.5 leading-relaxed">
              Grant a Verified Clinical Mentor seal to a senior doctor, charge nurse, or department lead to answer community peer questions.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMentorSubmit} className="space-y-3 py-2">
            <div>
              <label className="text-xs font-bold text-foreground">Clinician Full Name *</label>
              <input
                required
                value={newMentor.name}
                onChange={(e) => setNewMentor({ ...newMentor, name: e.target.value })}
                placeholder="e.g. Dr. Priya Ramachandran"
                className="mt-1 w-full rounded-xl border border-border/80 bg-muted/40 px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Clinical Designation *</label>
              <input
                required
                value={newMentor.role}
                onChange={(e) => setNewMentor({ ...newMentor, role: e.target.value })}
                placeholder="e.g. Lead ICU Intensivist / Senior Nurse Incharge"
                className="mt-1 w-full rounded-xl border border-border/80 bg-muted/40 px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-foreground">Hospital / Facility *</label>
                <input
                  required
                  value={newMentor.org}
                  onChange={(e) => setNewMentor({ ...newMentor, org: e.target.value })}
                  placeholder="e.g. Apollo Hospital"
                  className="mt-1 w-full rounded-xl border border-border/80 bg-muted/40 px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-foreground">Years Experience</label>
                <input
                  type="number"
                  min={1}
                  value={newMentor.yrs}
                  onChange={(e) => setNewMentor({ ...newMentor, yrs: Number(e.target.value) })}
                  className="mt-1 w-full rounded-xl border border-border/80 bg-muted/40 px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">Specialties (comma-separated)</label>
              <input
                value={newMentor.specialties}
                onChange={(e) => setNewMentor({ ...newMentor, specialties: e.target.value })}
                placeholder="e.g. Critical Care, Ventilator Titration, Neuro ICU"
                className="mt-1 w-full rounded-xl border border-border/80 bg-muted/40 px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setAddMentorModalOpen(false)}
                className="text-xs rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="text-xs font-bold rounded-xl bg-primary text-white hover:bg-primary/90"
              >
                Grant Mentor Seal
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
