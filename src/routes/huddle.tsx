import { useState, useMemo, useEffect, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineUser,
  HiOutlineHeart,
  HiHeart,
  HiOutlineArrowRight,
  HiOutlineClock,
  HiOutlineCheckBadge,
  HiOutlineCalendar,
  HiOutlineAcademicCap,
  HiOutlinePhoto,
  HiOutlineXMark,
  HiOutlineLockClosed,
  HiOutlinePaperAirplane,
  HiOutlineFlag,
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineInformationCircle,
  HiOutlineExclamationTriangle,
  HiCheck,
  HiOutlineBuildingOffice2,
  HiOutlineUserGroup,
  HiOutlineBriefcase,
  HiOutlineMapPin,
  HiOutlineHandThumbUp,
  HiOutlinePhone,
  HiOutlineLightBulb,
  HiOutlineClipboardDocumentList,
  HiOutlineMagnifyingGlass,
  HiOutlinePencilSquare,
  HiOutlineFunnel,
  HiCheckCircle,
  HiOutlineVideoCamera,
} from "react-icons/hi2";
import { RiVerifiedBadgeFill, RiStethoscopeLine, RiChatVoiceLine, RiHospitalLine } from "react-icons/ri";
import { toast } from "sonner";
import { AppShell, initials } from "@/components/fale/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  safetyCheck,
  clinicalMentors,
  type HuddlePost,
  type HuddlePostType,
  type HuddleField,
  type HuddleQuestion,
} from "@/lib/data";
import {
  useApp,
  setState,
  toggleHelpfulPost,
  addHuddlePost,
  addHuddleReply,
  reportHuddlePost,
  askMentorQuestion,
  answerMentorQuestion,
  toggleBookSession,
} from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/huddle")({
  head: () => ({
    meta: [
      { title: "Huddle — Verified Clinical Healthcare Community | FALE" },
      {
        name: "description",
        content:
          "Peer-to-peer clinical community, ward case discussions, mentor Q&A, and accredited CME sessions for doctors, nurses and allied health practitioners.",
      },
      { property: "og:title", content: "Huddle — Verified Clinical Community | FALE" },
      {
        property: "og:description",
        content:
          "Real ward experiences, verified clinical mentor guidance, and CME sessions without spam or recruitment brokers.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HuddlePage,
});

const FIELDS: HuddleField[] = ["All", "Nursing", "Physio", "Lab", "Radiology", "Pharmacy", "Medicine"];

const REPORT_REASONS = [
  {
    id: "privacy",
    label: "Patient Privacy Violation",
    desc: "Exposes patient names, bed/file numbers, UHID, or un-redacted diagnostic scans.",
    icon: HiOutlineLockClosed,
  },
  {
    id: "misinformation",
    label: "Clinical Misinformation / Dangerous Protocol",
    desc: "Inaccurate drug calculations, unsafe emergency care instructions, or dangerous advice.",
    icon: HiOutlineExclamationTriangle,
  },
  {
    id: "spam",
    label: "Recruiter Spam / External Solicitations",
    desc: "Unauthorized WhatsApp agent contacts, direct job ads, or consulting agency promotions.",
    icon: HiOutlineBriefcase,
  },
  {
    id: "harassment",
    label: "Unprofessional Conduct or Harassment",
    desc: "Abusive language, demeaning comments directed at junior clinicians or students.",
    icon: HiOutlineShieldCheck,
  },
  {
    id: "other",
    label: "Other Community Guideline Breach",
    desc: "Plagiarism, irrelevant advertising, or violation of peer discussion standards.",
    icon: HiOutlineFlag,
  },
];

function HuddlePage() {
  const s = useApp();
  const [activeTab, setActiveTab] = useState<"feed" | "mentors" | "sessions">("feed");
  const [selectedField, setSelectedField] = useState<HuddleField>("All");
  const [selectedType, setSelectedType] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Report Modal State
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState<string>("privacy");
  const [reportDetails, setReportDetails] = useState<string>("");

  // Posting Permissions & Community Rules Modal State
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [isSimulatedUnverified, setIsSimulatedUnverified] = useState(false);

  // Composer State
  const [postType, setPostType] = useState<HuddlePostType>("Thought");
  const [postField, setPostField] = useState<HuddleField>("Nursing");
  const [postText, setPostText] = useState("");
  const [postAnon, setPostAnon] = useState(false);
  const [postImage, setPostImage] = useState<string | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Mentor Ask State
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [askTopic, setAskTopic] = useState<HuddleQuestion["topic"]>("Career");
  const [askText, setAskText] = useState("");
  const [mentorAnswerDrafts, setMentorAnswerDrafts] = useState<Record<string, string>>({});

  // Current user info & verification status
  const isHospital = s.portal === "facility";
  const userName = String(s.profile["name"] || (isHospital ? "Apollo Hospitals — Central" : "Dr. Ananya Patel"));
  const userRole = String(s.profile["role"] || (isHospital ? "Hospital Administrator" : "Pharmacist"));
  const userLevel = (s.candidateLevel || (s.profile["exp"] === "Fresher" ? "fresher" : (s.profile["level"] as any) || "professional")) as
    | "student"
    | "fresher"
    | "professional"
    | "hospital";

  // Verification status based on FALE credential check
  const isVerified =
    (s.profile["verified"] !== false && s.profile["kycStatus"] !== "pending" && s.profile["kycStatus"] !== "rejected") &&
    !isSimulatedUnverified;

  // Real-time safety analysis
  const safety = useMemo(() => safetyCheck(postText, isHospital), [postText, isHospital]);

  // Auto-sync post type when portal switches
  useEffect(() => {
    if (isHospital && (postType === "Thought" || postType === "Experience" || postType === "Case" || postType === "Question")) {
      setPostType("Update");
    } else if (!isHospital && (postType === "Update" || postType === "Event")) {
      setPostType("Thought");
    }
  }, [isHospital, postType]);

  // Allowed post types with React icons
  const candidatePostTypes: { type: HuddlePostType; label: string; desc: string; icon: ReactNode }[] = [
    { type: "Thought", label: "Thought", desc: "Quick professional insight or ward learning", icon: <HiOutlineLightBulb className="h-4 w-4 shrink-0" /> },
    { type: "Experience", label: "Experience", desc: "Real ward reality, night duty, or shift story", icon: <RiHospitalLine className="h-4 w-4 shrink-0" /> },
    { type: "Case", label: "Case Study", desc: "De-identified clinical scenario & protocol question", icon: <HiOutlineClipboardDocumentList className="h-4 w-4 shrink-0" /> },
    { type: "Question", label: "Question", desc: "Ask clinical peers for advice", icon: <HiOutlineChatBubbleLeftRight className="h-4 w-4 shrink-0" /> },
  ];

  const hospitalPostTypes: { type: HuddlePostType; label: string; desc: string; icon: ReactNode }[] = [
    { type: "Update", label: "Hospital Update", desc: "Department news, academic milestones, or facilities", icon: <HiOutlineBuildingOffice2 className="h-4 w-4 shrink-0" /> },
    { type: "Event", label: "CME & Workshop", desc: "Accredited workshops, clinical open days & conferences", icon: <HiOutlineCalendar className="h-4 w-4 shrink-0" /> },
  ];

  const availableTypes = isHospital ? hospitalPostTypes : candidatePostTypes;

  // Filtered posts
  const visiblePosts = useMemo(() => {
    return s.huddlePosts
      .filter((p) => p.status === "live")
      .filter((p) => selectedField === "All" || p.field === selectedField || p.field === "All")
      .filter((p) => selectedType === "All" || p.type === selectedType)
      .filter(
        (p) =>
          !searchQuery.trim() ||
          p.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.field.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [s.huddlePosts, selectedField, selectedType, searchQuery]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error("Posting is locked for unverified accounts", {
        description: "Complete your KYC or College ID verification to unlock posting in FALE Huddle.",
      });
      return;
    }
    if (!postText.trim() || safety.st === "block" || safety.st === "hire") {
      toast.error(safety.why);
      return;
    }

    const created = addHuddlePost({
      type: postType,
      field: postField,
      authorName: userName,
      authorRole: userRole,
      authorLevel: isHospital ? "hospital" : userLevel,
      anon: postAnon && !isHospital,
      text: postText.trim(),
      image: postImage || undefined,
      isHospital,
    });

    setPostText("");
    setPostImage(null);
    setPostAnon(false);

    if (created.status === "review") {
      toast.success("Post submitted for FALE clinical safety review!", {
        description:
          "Because this includes a Clinical Case study or image attachment, a FALE clinician will verify patient de-identification within 1 hour before going live.",
      });
    } else {
      toast.success("Published live in Huddle!", {
        description: "Your post is now visible to verified healthcare colleagues across the network.",
      });
    }
  };

  const handleSendReply = (postId: string) => {
    if (!isVerified) {
      toast.error("Verification required to reply", {
        description: "Only verified members can participate in discussions to keep the network spam-free.",
      });
      return;
    }
    const text = (replyDrafts[postId] || "").trim();
    if (!text) return;

    addHuddleReply(postId, {
      authorName: userName,
      authorRole: userRole,
      text,
      authorLevel: userLevel === "hospital" ? "professional" : userLevel,
    });

    setReplyDrafts((prev) => ({ ...prev, [postId]: "" }));
    setExpandedReplies((prev) => ({ ...prev, [postId]: true }));
    toast.success("Reply added to discussion!");
  };

  const handleOpenReportModal = (postId: string) => {
    setReportingPostId(postId);
    setReportReason("privacy");
    setReportDetails("");
  };

  const handleConfirmReport = () => {
    if (!reportingPostId) return;
    const selectedObj = REPORT_REASONS.find((r) => r.id === reportReason);
    const reasonText = selectedObj
      ? `${selectedObj.label}${reportDetails.trim() ? ` — ${reportDetails.trim()}` : ""}`
      : "Community Rule Violation";

    reportHuddlePost(reportingPostId, reasonText);
    toast.success("Flagged for Clinical Review", {
      description: "Thank you. The post has been hidden from your feed and routed to the FALE Moderation Desk.",
    });
    setReportingPostId(null);
  };

  const handleAskMentor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error("Verification required to ask questions to mentors");
      return;
    }
    if (!askText.trim()) return;

    askMentorQuestion({
      topic: askTopic,
      askerName: userName,
      askerLevel: userLevel === "hospital" ? "professional" : userLevel,
      askerProfession: userRole,
      text: askText.trim(),
    });

    setAskText("");
    setAskModalOpen(false);
    toast.success("Question submitted to Clinical Mentors!", {
      description: "Senior practitioners receive notification and will provide an in-depth public answer.",
    });
  };

  const handleAnswerMentor = (questionId: string) => {
    if (!isVerified) {
      toast.error("Verification required to answer mentor questions");
      return;
    }
    if (userLevel === "student") {
      toast.error("Learners & Students cannot publish official mentor answers", {
        description: "Only accredited mentors with 3+ years clinical experience can answer clinical questions.",
      });
      return;
    }
    const text = (mentorAnswerDrafts[questionId] || "").trim();
    if (!text) return;

    answerMentorQuestion(questionId, {
      mentorName: userName,
      mentorRole: userRole,
      mentorYrs: 5,
      mentorSpecialty: "Clinical Specialist",
      text,
    });

    setMentorAnswerDrafts((prev) => ({ ...prev, [questionId]: "" }));
    toast.success("Mentor answer published!");
  };

  return (
    <AppShell>
      {/* ================= PAGE HEADER (MATCHING LEARNING & APPLICATIONS) ================= */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-[28px] text-foreground whitespace-nowrap">
              FALE Huddle
            </h1>
            <button
              type="button"
              onClick={() => setRulesModalOpen(true)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap shrink-0 transition-all cursor-pointer",
                isVerified
                  ? "bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20"
                  : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30"
              )}
              title="Click to view community guidelines and role posting permissions"
            >
              <HiOutlineShieldCheck className="h-3.5 w-3.5 shrink-0" />
              <span>{isVerified ? "Verified Members Only" : "Read-Only Mode"}</span>
              <HiOutlineInformationCircle className="h-3 w-3 shrink-0 opacity-70" />
            </button>
            {isSimulatedUnverified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold">
                Simulating Unverified
              </span>
            )}
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            Peer-to-peer clinical discussions, real ward experiences, mentor Q&A, and accredited CME events.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => setRulesModalOpen(true)}
            className="h-10 border-border/80 text-foreground hover:bg-muted text-xs font-bold px-3.5 rounded-2xl shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <HiOutlineShieldCheck className="h-4 w-4 text-primary shrink-0" />
            <span>Posting Rules</span>
          </Button>

          <Button
            type="button"
            onClick={() => {
              setActiveTab("feed");
              setTimeout(() => {
                const el = document.getElementById("community-composer");
                if (el) {
                  el.scrollIntoView({ behavior: "smooth", block: "center" });
                  const textarea = el.querySelector("textarea");
                  if (textarea) textarea.focus();
                }
              }, 50);
            }}
            className="h-10 bg-primary hover:bg-primary-hover text-white text-xs font-bold px-4 rounded-2xl shadow-xs cursor-pointer flex items-center gap-2"
          >
            <HiOutlinePencilSquare className="h-4 w-4" />
            <span>Start Discussion</span>
          </Button>
        </div>
      </div>

      {/* Student Mentorship Notice Banner */}
      {userLevel === "student" && (
        <div className="mb-6 rounded-3xl border border-primary/25 bg-gradient-to-r from-primary-soft/40 via-card to-primary-soft/20 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
              <HiOutlineAcademicCap className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold text-foreground">Student Clinical Circle · Academic Mentorship Active</span>
                <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                  Mentorship Track
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                Connect with accredited hospital consultants, ask career &amp; viva questions on the Mentors tab, and discuss de-identified clinical cases.
              </p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            onClick={() => setActiveTab("mentors")}
            className="rounded-xl text-xs font-bold shrink-0 self-start sm:self-auto bg-primary text-white"
          >
            Ask a Mentor
          </Button>
        </div>
      )}

      {/* ================= NAVIGATION & FILTER BAR (STICKY AT ALL POSITIONS) ================= */}
      <div
        className="sticky z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2.5 pb-2.5 mb-6 bg-background transition-[top] duration-300 ease-in-out"
        style={{ top: "var(--header-offset, 4rem)" }}
      >
        <div className="surface rounded-3xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-xs space-y-3">
          {/* Top Row: Segmented Tabs & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Segmented Control / Tabs with horizontal scroll on mobile */}
            <div className="w-full sm:w-auto overflow-x-auto no-scrollbar -mx-1 px-1">
              <div className="inline-flex items-center rounded-2xl bg-muted/60 p-1 border border-border/50 min-w-full sm:min-w-0">
                <button
                  type="button"
                  onClick={() => setActiveTab("feed")}
                  className={cn(
                    "whitespace-nowrap shrink-0 flex-1 sm:flex-initial rounded-xl px-3.5 sm:px-4 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none",
                    activeTab === "feed"
                      ? "bg-card text-primary shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <HiOutlineChatBubbleLeftRight className="h-4 w-4 shrink-0" />
                  <span>Community Feed</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("mentors")}
                  className={cn(
                    "whitespace-nowrap shrink-0 flex-1 sm:flex-initial rounded-xl px-3.5 sm:px-4 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none",
                    activeTab === "mentors"
                      ? "bg-card text-primary shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <RiStethoscopeLine className="h-4 w-4 shrink-0" />
                  <span>Ask a Mentor</span>
                  <span className={cn("h-2 w-2 rounded-full shrink-0", activeTab === "mentors" ? "bg-primary" : "bg-primary/50")} />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("sessions")}
                  className={cn(
                    "whitespace-nowrap shrink-0 flex-1 sm:flex-initial rounded-xl px-3.5 sm:px-4 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none",
                    activeTab === "sessions"
                      ? "bg-card text-primary shadow-xs"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <HiOutlineCalendar className="h-4 w-4 shrink-0" />
                  <span>Sessions &amp; CME</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-black shrink-0",
                      activeTab === "sessions" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                    )}
                  >
                    {s.huddleSessions.length}
                  </span>
                </button>
              </div>
            </div>

            {/* Right: Search Box & Mobile Filter Toggle */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="flex flex-1 items-center gap-2 rounded-2xl bg-muted/40 border border-border/70 px-3.5 py-1 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 transition-all sm:w-80">
                <HiOutlineMagnifyingGlass className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  type="text"
                  placeholder="Search discussions & topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="rounded-full p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    title="Clear search"
                  >
                    <HiOutlineXMark className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Mobile Filter Toggle Button */}
              {activeTab === "feed" && (
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className={cn(
                    "sm:hidden flex items-center justify-center h-11 w-11 rounded-2xl border transition-all cursor-pointer shrink-0 relative",
                    selectedField !== "All" || selectedType !== "All" || showMobileFilters
                      ? "bg-primary text-white border-primary shadow-xs"
                      : "bg-muted/40 text-muted-foreground border-border/70 hover:text-foreground"
                  )}
                  title="Toggle Filters"
                >
                  <HiOutlineFunnel className="h-4 w-4" />
                  {(selectedField !== "All" || selectedType !== "All") && (
                    <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-white ring-2 ring-primary" />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Speciality & Type Dropdown Filters (For Feed View) */}
          {activeTab === "feed" && (
            <div
              className={cn(
                "pt-2.5 border-t border-border/60 space-y-2.5 animate-in fade-in duration-200",
                !showMobileFilters && selectedField === "All" && selectedType === "All"
                  ? "hidden sm:block"
                  : "block"
              )}
            >
              {/* Header row: Label + Count & Reset */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <HiOutlineFunnel className="h-3.5 w-3.5 text-primary" />
                  Filter Discussions
                </span>

                <div className="flex items-center gap-2">
                  {(selectedField !== "All" || selectedType !== "All") && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedField("All");
                        setSelectedType("All");
                      }}
                      className="text-[11px] font-bold text-primary hover:text-primary-hover flex items-center gap-1 px-2 py-0.5 rounded-lg bg-primary/10 transition-colors cursor-pointer"
                    >
                      <HiOutlineXMark className="h-3 w-3" />
                      <span>Reset Filters</span>
                    </button>
                  )}
                  <span className="text-[11px] text-muted-foreground font-medium">
                    <span className="font-bold text-foreground">{visiblePosts.length}</span> discussions
                  </span>
                </div>
              </div>

              {/* Responsive 2-column grid on mobile, flex on desktop */}
              <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-2.5">
                {/* Department Dropdown */}
                <div className="w-full sm:w-52">
                  <Select value={selectedField} onValueChange={(val) => setSelectedField(val as HuddleField)}>
                    <SelectTrigger
                      aria-label="Filter by department"
                      className="h-9 w-full rounded-xl border border-border/80 bg-muted/30 px-2.5 sm:px-3 text-xs font-medium text-foreground hover:bg-muted/60 focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-muted-foreground font-normal shrink-0">Dept:</span>
                        <SelectValue placeholder="All" />
                      </div>
                    </SelectTrigger>
                    <SelectContent position="item-aligned" className="rounded-2xl border-border/80 bg-card/95 p-1 shadow-xl z-[100]">
                      {FIELDS.map((field) => (
                        <SelectItem
                          key={field}
                          value={field}
                          className="rounded-xl text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary"
                        >
                          {field === "All" ? "All Departments" : field}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Post Type Dropdown */}
                <div className="w-full sm:w-48">
                  <Select value={selectedType} onValueChange={(val) => setSelectedType(val)}>
                    <SelectTrigger
                      aria-label="Filter by post type"
                      className="h-9 w-full rounded-xl border border-border/80 bg-muted/30 px-2.5 sm:px-3 text-xs font-medium text-foreground hover:bg-muted/60 focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-muted-foreground font-normal shrink-0">Type:</span>
                        <SelectValue placeholder="All" />
                      </div>
                    </SelectTrigger>
                    <SelectContent position="item-aligned" className="rounded-2xl border-border/80 bg-card/95 p-1 shadow-xl z-[100]">
                      {["All", "Case", "Experience", "Question", "Thought", "Event", "Update"].map((t) => (
                        <SelectItem
                          key={t}
                          value={t}
                          className="rounded-xl text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary"
                        >
                          {t === "All" ? "All Post Types" : t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 8 Cols: Main Feed / Mentors / Sessions */}
        <div className="lg:col-span-8 space-y-6">
              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB 1: FEED TAB */}
              {/* ──────────────────────────────────────────────────────── */}
              {activeTab === "feed" && (
                <>
                  {/* Community Composer (Locked if unverified, Interactive if verified) */}
                  {!isVerified ? (
                    <div
                      id="community-composer"
                      className="rounded-3xl border border-amber-500/30 bg-amber-500/[0.03] dark:bg-card p-5 sm:p-6 shadow-xs space-y-4 animate-in fade-in duration-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                        <div className="flex items-center gap-3">
                          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-500/15 text-amber-600 border border-amber-500/30 shrink-0 shadow-2xs">
                            <HiOutlineLockClosed className="h-5 w-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-foreground">Posting Locked · Verification Required</span>
                              <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                Read-Only Access
                              </span>
                            </div>
                            <p className="text-[11px] font-medium text-muted-foreground mt-0.5">
                              {userName} · {userRole}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setRulesModalOpen(true)}
                            className="h-8 px-3 rounded-xl text-xs font-bold border-border/80 text-foreground hover:bg-muted cursor-pointer"
                          >
                            View Posting Rules
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-card border border-border/70 p-4 space-y-2">
                        <div className="flex items-start gap-2.5">
                          <HiOutlineShieldCheck className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                          <div className="text-xs space-y-1">
                            <p className="font-bold text-foreground">
                              Why is posting locked?
                            </p>
                            <p className="text-muted-foreground leading-relaxed">
                              FALE Huddle is an exclusive, safe clinical knowledge network for verified doctors, nurses, allied health clinicians, and accredited healthcare students. Anyone can read and learn freely, but posting is unlocked only after The FALE team checks your credentials ({userLevel === "student" ? "College ID" : isHospital ? "KPME License" : "Council Registration"}) to prevent spam and protect patient privacy.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Link to="/profile">
                            <Button className="h-9 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs shadow-xs cursor-pointer">
                              Check KYC &amp; Verification Status
                            </Button>
                          </Link>
                          {isSimulatedUnverified && (
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => setIsSimulatedUnverified(false)}
                              className="h-9 px-3 rounded-xl text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                            >
                              Exit Simulation
                            </Button>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground">NABH &amp; HIPAA Compliant Peer Network</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      id="community-composer"
                      className="rounded-3xl border border-border bg-card p-5 shadow-xs transition-all hover:border-border/80 space-y-4 animate-in fade-in duration-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
                        <div className="flex items-center gap-3">
                          <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-xs font-black text-white shadow-xs shrink-0">
                            {initials(userName)}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-sm text-foreground">{userName}</span>
                              <RiVerifiedBadgeFill className="h-4 w-4 text-primary" />
                              {userLevel === "student" && (
                                <span className="rounded-full bg-[#FFF4EC] text-[#FF5A1F] border border-primary/20 px-2 py-0.5 text-[10px] font-bold">
                                  Student
                                </span>
                              )}
                              {isHospital && (
                                <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold">
                                  Verified Institution
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-medium text-muted-foreground">{userRole}</p>
                          </div>
                        </div>

                        {/* Post Type Selector Pills */}
                        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                          {availableTypes.map((t) => (
                            <button
                              key={t.type}
                              type="button"
                              onClick={() => setPostType(t.type)}
                              className={cn(
                                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap",
                                postType === t.type
                                  ? "bg-primary text-white border-primary shadow-xs font-bold"
                                  : "bg-card text-foreground border-border/80 hover:border-primary/50 hover:bg-muted/40"
                              )}
                            >
                              <span className={postType === t.type ? "text-white" : "text-primary"}>{t.icon}</span>
                              <span>{t.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <form onSubmit={handleCreatePost} className="space-y-3.5">
                        <div className="relative">
                          <textarea
                            rows={3}
                            value={postText}
                            onChange={(e) => setPostText(e.target.value)}
                            placeholder={
                              postType === "Case"
                                ? "Describe a clinical scenario (strictly no patient names, bed numbers, UHIDs or ward numbers)..."
                                : postType === "Experience"
                                ? "Share a real learning or shift moment from your ward, night duty, or hospital..."
                                : postType === "Question"
                                ? "Ask verified doctors, nurses or allied health peers a question..."
                                : postType === "Event"
                                ? "CME or clinical workshop details: topic, speaker, date, venue, and seats..."
                                : postType === "Update"
                                ? "Share an achievement, new equipment, or clinical protocol update from your hospital..."
                                : "Share a concise clinical thought or guideline pearl..."
                            }
                            className="w-full rounded-2xl bg-muted/30 border border-border/80 px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                          />
                        </div>

                        {/* Attached Image Preview */}
                        {postImage && (
                          <div className="relative inline-block rounded-2xl overflow-hidden border border-border">
                            <img src={postImage} alt="Attachment" className="max-h-40 object-cover rounded-xl" />
                            <button
                              type="button"
                              onClick={() => setPostImage(null)}
                              className="absolute top-1.5 right-1.5 bg-black/70 text-white p-1 rounded-full hover:bg-black"
                            >
                              <HiOutlineXMark className="h-4 w-4" />
                            </button>
                          </div>
                        )}

                        {/* Safety Guardrail Indicator (Real-Time Regex) */}
                        {postText.trim() && (
                          <div
                            className={cn(
                              "rounded-2xl p-3 text-xs flex items-start gap-2.5 border transition-all",
                              safety.st === "ok"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                                : safety.st === "block"
                                ? "bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300"
                                : "bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300"
                            )}
                          >
                            {safety.st === "ok" ? (
                              <HiOutlineShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
                            ) : (
                              <HiOutlineExclamationTriangle className="h-5 w-5 shrink-0 text-rose-600 mt-0.5" />
                            )}
                            <div className="leading-snug">
                              <span className="font-bold">
                                {safety.st === "ok"
                                  ? "Safety Shield Verified"
                                  : safety.st === "block"
                                  ? "Content Warning"
                                  : "Hiring Policy"}
                                :{" "}
                              </span>
                              <span>{safety.why}</span>
                            </div>
                          </div>
                        )}

                        {/* Bottom Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border/50">
                          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                            {/* Custom Department Selector */}
                            <div className="w-32 sm:w-36 shrink-0">
                              <Select
                                value={postField}
                                onValueChange={(val) => setPostField(val as HuddleField)}
                              >
                                <SelectTrigger
                                  aria-label="Select department"
                                  className="h-9 w-full rounded-xl border border-border bg-background px-2.5 text-xs font-medium text-foreground hover:bg-muted/40 focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                                >
                                  <SelectValue placeholder="Department" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border/80 bg-card/95 backdrop-blur-md p-1 shadow-lg z-50">
                                  {FIELDS.filter((f) => f !== "All").map((f) => (
                                    <SelectItem
                                      key={f}
                                      value={f}
                                      className="rounded-xl text-xs font-medium cursor-pointer py-1.5 focus:bg-primary/10 focus:text-primary"
                                    >
                                      {f}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Anonymous Toggle (for non-hospital members) */}
                            {!isHospital ? (
                              <button
                                type="button"
                                onClick={() => setPostAnon(!postAnon)}
                                className={cn(
                                  "h-9 px-3 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0",
                                  postAnon
                                    ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                                    : "bg-muted/40 text-muted-foreground border-border hover:text-foreground"
                                )}
                                title="Hides your name and hospital from peers; you still show as verified."
                              >
                                {postAnon ? (
                                  <HiOutlineEyeSlash className="h-4 w-4 text-primary shrink-0" />
                                ) : (
                                  <HiOutlineEye className="h-4 w-4 shrink-0" />
                                )}
                                <span>Anonymous</span>
                              </button>
                            ) : (
                              <span
                                className="h-9 px-3 rounded-xl text-xs font-semibold border border-border/60 bg-muted/30 text-muted-foreground flex items-center gap-1.5 whitespace-nowrap shrink-0"
                                title="Hospitals post with verified institutional identity"
                              >
                                <HiOutlineBuildingOffice2 className="h-4 w-4 text-primary shrink-0" />
                                <span>Official Post</span>
                              </span>
                            )}

                            {/* Image Attachment Button */}
                            <label className="h-9 cursor-pointer px-3 rounded-xl text-xs font-semibold border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0">
                              <HiOutlinePhoto className="h-4 w-4 text-primary shrink-0" />
                              <span>Photo</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const url = URL.createObjectURL(file);
                                    setPostImage(url);
                                    toast.info("Image attached. Posts with images undergo FALE privacy check.");
                                  }
                                }}
                              />
                            </label>

                            <button
                              type="button"
                              onClick={() => setIsSimulatedUnverified(true)}
                              className="text-[10px] text-muted-foreground hover:text-primary transition-colors underline cursor-pointer ml-1 whitespace-nowrap shrink-0"
                              title="Test how unverified read-only users experience Huddle"
                            >
                              Simulate unverified
                            </button>
                          </div>

                          {/* Submit Button */}
                          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 w-full sm:w-auto">
                            {postType === "Case" && (
                              <span className="text-[11px] font-bold text-primary">
                                Held for review
                              </span>
                            )}
                            <Button
                              type="submit"
                              disabled={!postText.trim() || safety.st === "block" || safety.st === "hire"}
                              className="h-9 bg-primary hover:bg-primary-hover text-white font-black text-xs px-5 rounded-xl shadow-xs cursor-pointer w-full sm:w-auto justify-center"
                            >
                              <HiOutlinePaperAirplane className="h-4 w-4 mr-1.5 shrink-0" />
                              <span>{postType === "Case" ? "Submit Case" : "Post to Huddle"}</span>
                            </Button>
                          </div>
                        </div>
                      </form>
                    </div>
                  )}

                  {/* Feed Items */}
                  <div className="space-y-4">
                    {visiblePosts.length === 0 ? (
                      <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
                        <div className="h-12 w-12 rounded-2xl bg-muted text-muted-foreground mx-auto flex items-center justify-center mb-3">
                          <HiOutlineChatBubbleLeftRight className="h-6 w-6" />
                        </div>
                        <h3 className="font-bold text-foreground text-sm">No discussions found in this section</h3>
                        <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                          Be the first verified clinician to share an experience, clinical case or ask a question.
                        </p>
                      </div>
                    ) : (
                      visiblePosts.map((post) => (
                        <div
                          key={post.id}
                          className="rounded-3xl border border-border bg-card p-5 shadow-xs transition-all hover:border-border/80"
                        >
                          {/* Post Card Header */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <span
                                className={cn(
                                  "grid h-10 w-10 place-items-center rounded-2xl text-xs font-black shadow-xs shrink-0 mt-0.5",
                                  post.anon
                                    ? "bg-muted text-muted-foreground border border-border/80"
                                    : post.isHospital
                                    ? "bg-slate-900 text-white dark:bg-card border border-border"
                                    : "bg-primary text-white"
                                )}
                              >
                                {post.anon ? "AN" : initials(post.authorName)}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-sm text-foreground">
                                    {post.anon ? "Anonymous Clinician" : post.authorName}
                                  </span>
                                  <RiVerifiedBadgeFill className="h-4 w-4 text-primary shrink-0" />
                                  {post.isMentor && (
                                    <span className="rounded-full bg-[#FFF4EC] text-[#FF5A1F] border border-primary/20 px-2 py-0.5 text-[10px] font-black uppercase whitespace-nowrap shrink-0">
                                      Mentor
                                    </span>
                                  )}
                                  {post.authorLevel === "student" && !post.anon && (
                                    <span className="rounded-full bg-[#FFF4EC] text-[#FF5A1F] border border-primary/20 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap shrink-0">
                                      Student
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] font-medium text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                                  <span className="truncate max-w-[200px] sm:max-w-none">
                                    {post.anon ? "Verified Practitioner · Bengaluru" : post.authorRole}
                                  </span>
                                  <span className="shrink-0 text-muted-foreground/60">·</span>
                                  <span className="shrink-0 text-muted-foreground whitespace-nowrap">
                                    {post.at && post.at.trim() ? post.at : "2 days ago"}
                                  </span>
                                </p>
                              </div>
                            </div>

                            {/* Post Type Badge */}
                            <div className="flex items-center gap-2 shrink-0">
                              <span
                                className={cn(
                                  "rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider whitespace-nowrap shrink-0",
                                  post.type === "Case"
                                    ? "bg-[#FFF4EC] text-[#FF5A1F] border border-primary/20"
                                    : post.type === "Experience"
                                    ? "bg-muted text-foreground border border-border"
                                    : post.type === "Question"
                                    ? "bg-[#FFF4EC] text-[#FF5A1F] border border-primary/20"
                                    : post.type === "Event"
                                    ? "bg-primary text-white border border-primary shadow-xs"
                                    : post.type === "Update"
                                    ? "bg-slate-900 text-white dark:bg-card border border-border"
                                    : "bg-muted text-muted-foreground"
                                )}
                              >
                                {post.type}
                              </span>
                            </div>
                          </div>

                          {/* Post Content */}
                          <div className="mt-3.5 text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                            {post.type === "Case" && (
                              <div className="mb-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FFF4EC] text-[#FF5A1F] border border-primary/20 text-xs font-bold">
                                <HiOutlineShieldCheck className="h-4 w-4 shrink-0" />
                                <span>De-identified clinical case scenario</span>
                              </div>
                            )}
                            <p>{post.text}</p>
                          </div>

                          {/* Attached Image if present */}
                          {post.image && (
                            <div className="mt-3 rounded-2xl overflow-hidden border border-border">
                              <img src={post.image} alt="Clinical demonstration" className="max-h-72 w-full object-cover" />
                            </div>
                          )}

                          {/* Actions: Helpful, Reply, Report */}
                          <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold">
                            <div className="flex items-center gap-3">
                              {/* Helpful Button */}
                              <button
                                type="button"
                                onClick={() => toggleHelpfulPost(post.id)}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl border transition-all flex items-center gap-1.5 font-bold cursor-pointer",
                                  post.userHelpful
                                    ? "bg-[#FFF4EC] border-primary/30 text-primary"
                                    : "bg-muted/40 border-border text-muted-foreground hover:text-foreground hover:border-primary/30"
                                )}
                              >
                                {post.userHelpful ? (
                                  <HiHeart className="h-4 w-4 text-primary" />
                                ) : (
                                  <HiOutlineHeart className="h-4 w-4" />
                                )}
                                <span>{post.helpfulCount} Helpful</span>
                              </button>

                              {/* Replies Toggle */}
                              <button
                                type="button"
                                onClick={() =>
                                  setExpandedReplies((prev) => ({
                                    ...prev,
                                    [post.id]: !prev[post.id],
                                  }))
                                }
                                className="px-3 py-1.5 rounded-xl border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-1.5 font-bold cursor-pointer"
                              >
                                <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
                                <span>
                                  {post.replies.length} {post.replies.length === 1 ? "Reply" : "Replies"}
                                </span>
                              </button>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleOpenReportModal(post.id)}
                              className="text-muted-foreground hover:text-rose-500 transition-colors p-1.5 rounded-lg flex items-center gap-1 text-[11px] cursor-pointer"
                              title="Report inappropriate post or privacy violation"
                            >
                              <HiOutlineFlag className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Report</span>
                            </button>
                          </div>

                          {/* Expandable Replies Section */}
                          {expandedReplies[post.id] && (
                            <div className="mt-4 pt-4 border-t border-border/60 space-y-3 bg-muted/20 rounded-2xl p-3 sm:p-4">
                              {post.replies.map((reply) => (
                                <div key={reply.id} className="flex items-start gap-2.5 text-xs">
                                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-[10px] font-black text-white shrink-0 shadow-2xs mt-0.5">
                                    {initials(reply.authorName)}
                                  </span>
                                  <div className="flex-1 bg-card rounded-2xl p-3 sm:p-3.5 border border-border/80 shadow-2xs space-y-1">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-xs text-foreground whitespace-nowrap">
                                          {reply.authorName}
                                        </span>
                                        <RiVerifiedBadgeFill className="h-3.5 w-3.5 text-primary shrink-0" />
                                        <span className="text-[11px] text-muted-foreground font-medium">
                                          · {reply.authorRole}
                                        </span>
                                      </div>
                                      <span className="text-[10px] text-muted-foreground shrink-0">
                                        {reply.at && reply.at.trim() ? reply.at : "1 day ago"}
                                      </span>
                                    </div>
                                    <p className="text-xs text-foreground/90 leading-relaxed">{reply.text}</p>
                                  </div>
                                </div>
                              ))}

                              {/* Inline Reply Composer */}
                              {!isVerified ? (
                                <div className="flex items-center gap-2 pt-1.5 p-2.5 rounded-xl bg-card border border-border/80 text-xs text-muted-foreground">
                                  <HiOutlineLockClosed className="h-4 w-4 text-amber-500 shrink-0" />
                                  <span>Verification required to reply to peer discussions.</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 pt-1.5">
                                  <input
                                    type="text"
                                    value={replyDrafts[post.id] || ""}
                                    onChange={(e) =>
                                      setReplyDrafts((prev) => ({
                                        ...prev,
                                        [post.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Write a clinical or peer response..."
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleSendReply(post.id);
                                    }}
                                    className="h-9 flex-1 rounded-xl bg-card border border-border/80 px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                                  />
                                  <Button
                                    type="button"
                                    onClick={() => handleSendReply(post.id)}
                                    disabled={!(replyDrafts[post.id] || "").trim()}
                                    className="h-9 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs cursor-pointer shadow-xs shrink-0"
                                  >
                                    Reply
                                  </Button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB 2: ASK A MENTOR */}
              {/* ──────────────────────────────────────────────────────── */}
              {activeTab === "mentors" && (
                <div className="space-y-6">
                  {/* Ask Hero Card */}
                  <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary-soft/30 p-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF4EC] text-[#FF5A1F] border border-primary/20 text-xs font-bold mb-2">
                          <RiStethoscopeLine className="h-3.5 w-3.5" />
                          <span>Senior Clinical Guidance</span>
                        </div>
                        <h2 className="text-lg font-black text-foreground tracking-tight">
                          Ask Verified FALE Mentors
                        </h2>
                        <p className="text-xs text-muted-foreground mt-1 max-w-lg">
                          Approved clinicians with 3+ years verified experience answer clinical career dilemmas, ward
                          viva, and specialty exams. Answers are public so the whole community learns.
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={() => setAskModalOpen(true)}
                        className="bg-primary hover:bg-primary-hover text-white font-black text-xs px-5 py-2.5 rounded-2xl shadow-xs shrink-0 cursor-pointer"
                      >
                        Ask a Question
                      </Button>
                    </div>

                    {/* Ask Form Dialog or Inline box */}
                    {askModalOpen && (
                      <div className="mt-5 pt-5 border-t border-border/80">
                        <form onSubmit={handleAskMentor} className="space-y-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-muted-foreground">Select Topic:</span>
                            {(["Career", "Clinical skill", "Exams", "Interview", "Workplace"] as const).map((top) => (
                              <button
                                key={top}
                                type="button"
                                onClick={() => setAskTopic(top)}
                                className={cn(
                                  "px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 select-none",
                                  askTopic === top
                                    ? "bg-primary text-white border-primary shadow-xs font-bold"
                                    : "bg-card text-foreground border-border/80 hover:border-primary/50 hover:bg-muted/40"
                                )}
                              >
                                {askTopic === top && <HiCheck className="h-3.5 w-3.5 stroke-[2.5]" />}
                                <span>{top}</span>
                              </button>
                            ))}
                          </div>

                          <textarea
                            rows={3}
                            value={askText}
                            onChange={(e) => setAskText(e.target.value)}
                            placeholder="e.g. B.Sc Nursing final year: Should I start in a General Ward or directly attempt ICU entry in a multi-speciality?"
                            className="w-full rounded-2xl bg-muted/30 border border-border px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                          />

                          <div className="flex items-center justify-between gap-3">
                            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <HiOutlineExclamationTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                              <span>Mentors provide professional advice only — no patient specific treatments.</span>
                            </span>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setAskModalOpen(false)}
                                className="h-8 px-3 rounded-xl text-xs cursor-pointer"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="submit"
                                disabled={!askText.trim()}
                                className="h-8 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs cursor-pointer"
                              >
                                Submit Question
                              </Button>
                            </div>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    {s.huddleQuestions.map((q) => (
                      <div
                        key={q.id}
                        className="rounded-3xl border border-border bg-card p-5 shadow-xs transition-all hover:border-border/80 space-y-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <span className="rounded-full bg-[#FFF4EC] text-[#FF5A1F] border border-primary/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                              {q.topic}
                            </span>
                            <h3 className="font-extrabold text-base text-foreground mt-2">{q.text}</h3>
                            <p className="text-[11px] text-muted-foreground mt-1">
                              Asked by <span className="font-semibold text-foreground">{q.askerShort}</span> (
                              {q.askerProfession || q.askerLevel}) · {q.at && q.at.trim() ? q.at : "2 days ago"}
                            </p>
                          </div>
                        </div>

                        {/* Answers from Mentors */}
                        <div className="space-y-3 pt-2">
                          {q.answers.length === 0 ? (
                            <div className="rounded-2xl bg-muted/40 p-3.5 text-xs text-muted-foreground flex items-center gap-2.5 border border-border/60">
                              <HiOutlineClock className="h-4 w-4 text-primary shrink-0" />
                              <span>Waiting for a verified mentor to answer. Answers are verified and public.</span>
                            </div>
                          ) : (
                            q.answers.map((ans) => (
                              <div
                                key={ans.id}
                                className="rounded-2xl border border-primary/20 bg-primary-soft/30 p-4 space-y-2.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2.5">
                                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-white font-black text-xs shadow-xs shrink-0">
                                      {initials(ans.mentorName)}
                                    </span>
                                    <div>
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="font-bold text-xs text-foreground">{ans.mentorName}</span>
                                        <RiVerifiedBadgeFill className="h-3.5 w-3.5 text-primary" />
                                        <span className="rounded-full bg-[#FFF4EC] text-[#FF5A1F] border border-primary/20 px-2 py-0.5 text-[10px] font-black uppercase">
                                          Mentor ({ans.mentorYrs}+ yrs)
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-muted-foreground font-medium">
                                        {ans.mentorRole} · {ans.mentorSpecialty}
                                      </p>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground shrink-0">
                                    {ans.at && ans.at.trim() ? ans.at : "1 day ago"}
                                  </span>
                                </div>
                                <p className="text-xs text-foreground/90 leading-relaxed sm:pl-10.5 pl-0">{ans.text}</p>
                              </div>
                            ))
                          )}

                          {/* Mentor Answer Box (Only accredited mentors can publish answers) */}
                          {userLevel === "student" ? (
                            <div className="pt-2">
                              <div className="rounded-2xl border border-primary/20 bg-[#FFF4EC] dark:bg-card p-3 text-xs text-muted-foreground flex items-center gap-2.5">
                                <HiOutlineAcademicCap className="h-5 w-5 text-primary shrink-0" />
                                <div>
                                  <span className="font-bold text-foreground">Student &amp; Learner Access: </span>
                                  <span>You have priority access to ask clinical questions to verified specialists above. Official answers are reserved for accredited mentors with 3+ years clinical experience.</span>
                                </div>
                              </div>
                            </div>
                          ) : !isVerified ? (
                            <div className="pt-2">
                              <div className="rounded-2xl border border-border/70 bg-muted/40 p-3 text-xs text-muted-foreground flex items-center gap-2.5">
                                <HiOutlineLockClosed className="h-5 w-5 text-amber-500 shrink-0" />
                                <span>Verification required to answer mentor questions. Only accredited clinicians can publish answers.</span>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2 flex items-center gap-2">
                              <input
                                type="text"
                                value={mentorAnswerDrafts[q.id] || ""}
                                onChange={(e) =>
                                  setMentorAnswerDrafts((prev) => ({
                                    ...prev,
                                    [q.id]: e.target.value,
                                  }))
                                }
                                placeholder="Answer as an experienced mentor..."
                                className="h-9 flex-1 rounded-xl bg-muted/30 border border-border px-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                              />
                              <Button
                                type="button"
                                onClick={() => handleAnswerMentor(q.id)}
                                disabled={!(mentorAnswerDrafts[q.id] || "").trim()}
                                className="h-9 px-4 rounded-xl bg-primary hover:bg-primary-hover text-white font-bold text-xs cursor-pointer shadow-xs shrink-0"
                              >
                                Answer
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ──────────────────────────────────────────────────────── */}
              {/* TAB 3: SESSIONS & CME */}
              {/* ──────────────────────────────────────────────────────── */}
              {activeTab === "sessions" && (
                <div className="space-y-6">
                  {/* Sessions Hero Banner */}
                  <div className="rounded-3xl border border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 p-5 sm:p-6 shadow-xs relative overflow-hidden">
                    <div className="max-w-2xl space-y-2">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FFF4EC] dark:bg-card text-primary border border-primary/20 text-[11px] font-medium shadow-2xs">
                        <HiOutlineAcademicCap className="h-3.5 w-3.5" />
                        <span>Continuing Medical Education</span>
                      </div>
                      <h2 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                        Clinical Talks, CMEs &amp; Mentorship Workshops
                      </h2>
                      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                        Join live interactive masterclasses and accredited hospital CMEs led by verified clinicians. Learn real ward protocols, prepare for clinical viva, and earn verifiable CME badges.
                      </p>
                    </div>
                  </div>

                  {/* Sessions Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {s.huddleSessions.map((session) => {
                      const d = new Date(session.when);
                      const seatsLeft = session.seats - session.bookedCount;
                      const isFull = seatsLeft <= 0;
                      const isVirtual =
                        session.where.toLowerCase().includes("meet") || session.where.toLowerCase().includes("stream");

                      return (
                        <div
                          key={session.id}
                          className="rounded-3xl border border-border/80 bg-card p-6 sm:p-7 shadow-xs flex flex-col justify-between hover:border-primary/40 hover:shadow-sm transition-all gap-6"
                        >
                          <div className="space-y-5">
                            {/* Date Badge & Category Row */}
                            <div className="flex items-start justify-between gap-3 pb-1">
                              <div className="flex items-center gap-3.5 min-w-0">
                                <div className="h-14 w-14 rounded-2xl bg-[#FFF4EC] dark:bg-card border border-primary/25 flex flex-col items-center justify-center shrink-0 shadow-2xs">
                                  <span className="text-[10px] font-black uppercase text-[#FF5A1F] tracking-wider leading-none">
                                    {d.toLocaleDateString("en-IN", { month: "short" })}
                                  </span>
                                  <span className="text-xl font-extrabold text-foreground leading-tight mt-0.5">
                                    {d.getDate()}
                                  </span>
                                </div>
                                <div className="min-w-0 space-y-1.5">
                                  <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider inline-block">
                                    {session.category}
                                  </span>
                                  <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 truncate">
                                    {isVirtual ? (
                                      <HiOutlineVideoCamera className="h-4 w-4 text-primary shrink-0" />
                                    ) : (
                                      <HiOutlineMapPin className="h-4 w-4 text-primary shrink-0" />
                                    )}
                                    <span className="truncate">{session.where}</span>
                                  </p>
                                </div>
                              </div>

                              {session.isBooked ? (
                                <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-3 py-1 text-[11px] font-bold flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                                  <HiCheckCircle className="h-3.5 w-3.5" />
                                  Booked
                                </span>
                              ) : isFull ? (
                                <span className="rounded-full bg-rose-500/10 text-rose-600 border border-rose-500/20 px-3 py-1 text-[11px] font-bold uppercase shrink-0 whitespace-nowrap">
                                  Full
                                </span>
                              ) : null}
                            </div>

                            {/* Title & Description */}
                            <div className="space-y-2">
                              <h3 className="font-bold text-[15px] sm:text-base text-foreground leading-snug line-clamp-2">
                                {session.title}
                              </h3>
                              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                                {session.description}
                              </p>
                            </div>

                            {/* Target Roles */}
                            {session.forRoles && session.forRoles.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-1.5">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                  For:
                                </span>
                                {session.forRoles.map((role) => (
                                  <span
                                    key={role}
                                    className="rounded-full bg-muted/60 border border-border/70 px-2.5 py-0.5 text-[11px] font-medium text-foreground"
                                  >
                                    {role}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Footer with Host, Attendance, and Booking button */}
                          <div className="pt-4.5 border-t border-border/70 space-y-4.5">
                            {/* Host details */}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                                {session.hostType === "hospital" ? (
                                  <HiOutlineBuildingOffice2 className="h-4.5 w-4.5" />
                                ) : (
                                  <RiStethoscopeLine className="h-4.5 w-4.5" />
                                )}
                              </div>
                              <div className="min-w-0 space-y-0.5">
                                <p className="font-bold text-xs text-foreground truncate">{session.hostName}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{session.hostSub}</p>
                              </div>
                            </div>

                            {/* Seats meter */}
                            <div className="space-y-2 pt-1">
                              <div className="flex justify-between items-center text-xs font-medium text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                  <HiOutlineUserGroup className="h-4 w-4 text-primary" />
                                  <span>Attendance:</span>
                                </span>
                                <span className={isFull ? "text-rose-600 font-bold" : "text-foreground font-semibold"}>
                                  {isFull ? "Housefull" : `${seatsLeft} of ${session.seats} seats available`}
                                </span>
                              </div>
                              <div className="h-2.5 w-full bg-muted/60 rounded-full overflow-hidden p-0.5 border border-border/50">
                                <div
                                  className={cn(
                                    "h-full rounded-full transition-all duration-300",
                                    isFull ? "bg-rose-500" : "bg-primary"
                                  )}
                                  style={{
                                    width: `${Math.min(100, Math.round((session.bookedCount / session.seats) * 100))}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="pt-2">
                              <Button
                                type="button"
                                onClick={() => {
                                  toggleBookSession(session.id);
                                  if (!session.isBooked) {
                                    toast.success("Seat reserved!", {
                                      description: `You are booked for "${session.title}". Invitation sent to your calendar.`,
                                    });
                                  } else {
                                    toast.info("Booking cancelled.");
                                  }
                                }}
                                className={cn(
                                  "w-full h-11 sm:h-12 rounded-2xl text-sm font-bold transition-all cursor-pointer shadow-xs flex items-center justify-center gap-2",
                                  session.isBooked
                                    ? "bg-muted text-muted-foreground hover:bg-rose-500 hover:text-white"
                                    : isFull
                                    ? "bg-muted text-muted-foreground opacity-50 cursor-not-allowed"
                                    : "bg-primary hover:bg-primary-hover text-white shadow-primary/20 hover:shadow-md"
                                )}
                                disabled={isFull && !session.isBooked}
                              >
                                {session.isBooked ? (
                                  <>
                                    <HiOutlineXMark className="h-4 w-4" />
                                    <span>Cancel Booking</span>
                                  </>
                                ) : isFull ? (
                                  <span>Seats Full</span>
                                ) : (
                                  <>
                                    <HiOutlineCalendar className="h-4 w-4" />
                                    <span>Book Free Seat</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right 4 Cols: Community Safety, Active Mentors, Guidelines */}
            <div className="lg:col-span-4 space-y-5">
              {/* Huddle Safe Community Rules Card */}
              <div className="rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex items-center gap-3 pb-3.5 border-b border-border/60">
                  <div className="h-10 w-10 rounded-2xl bg-[#FFF4EC] text-[#FF5A1F] border border-primary/20 flex items-center justify-center font-bold shadow-xs shrink-0">
                    <HiOutlineShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">Huddle Safety Rules</h3>
                    <p className="text-[11px] text-muted-foreground">NABH &amp; HIPAA Compliant Peer Shield</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3.5">
                    <div className="h-8 w-8 rounded-xl bg-[#FFF4EC] text-[#FF5A1F] flex items-center justify-center shrink-0 border border-primary/20 mt-0.5 shadow-2xs">
                      <HiOutlineLockClosed className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="font-bold text-xs text-foreground">Strict Patient Anonymity</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Bed numbers, UHID, patient names, or un-redacted lab slips are permanently banned.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="h-8 w-8 rounded-xl bg-[#FFF4EC] text-[#FF5A1F] flex items-center justify-center shrink-0 border border-primary/20 mt-0.5 shadow-2xs">
                      <HiOutlineBriefcase className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="font-bold text-xs text-foreground">No Recruiter Spam</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Direct job ads, consultancies and WhatsApp links are blocked. Job matches are powered by FALE algorithms.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="h-8 w-8 rounded-xl bg-[#FFF4EC] text-[#FF5A1F] flex items-center justify-center shrink-0 border border-primary/20 mt-0.5 shadow-2xs">
                      <HiOutlineClipboardDocumentList className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="font-bold text-xs text-foreground">Clinical Cases Reviewed</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        Complex clinical scenarios and medical photos are verified before appearing live.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3.5">
                    <div className="h-8 w-8 rounded-xl bg-[#FFF4EC] text-[#FF5A1F] flex items-center justify-center shrink-0 border border-primary/20 mt-0.5 shadow-2xs">
                      <HiOutlinePhone className="h-4 w-4" />
                    </div>
                    <div className="space-y-0.5 min-w-0">
                      <h4 className="font-bold text-xs text-foreground">Protected Connections</h4>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        No cold DMs. Interaction is focused on peer questions, mentor sessions, and mutual job intros.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-3.5 border-t border-border/60 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground font-medium">Community Health:</span>
                  <span className="font-bold text-primary flex items-center gap-1.5">
                    <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    100% Pre-Verified
                  </span>
                </div>
              </div>

              {/* Verified Mentors Spotlight */}
              <div className="rounded-3xl border border-border bg-card p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="h-9 w-9 rounded-xl bg-[#FFF4EC] text-[#FF5A1F] border border-primary/20 flex items-center justify-center font-bold">
                      <RiStethoscopeLine className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm text-foreground">Featured Mentors</h3>
                      <p className="text-[11px] text-muted-foreground">Active in Bengaluru Network</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  {clinicalMentors.map((mentor) => (
                    <div
                      key={mentor.id}
                      className="rounded-2xl border border-border/70 p-3 flex items-center justify-between gap-3 bg-muted/20 hover:border-primary/30 transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white font-black text-xs shrink-0 shadow-xs">
                          {initials(mentor.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-xs text-foreground truncate">{mentor.name}</span>
                            <RiVerifiedBadgeFill className="h-3.5 w-3.5 text-primary shrink-0" />
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">
                            {mentor.role} · {mentor.yrs} yrs
                          </p>
                        </div>
                      </div>

                      <span className="rounded-full bg-[#FFF4EC] text-[#FF5A1F] border border-primary/20 text-[10px] font-bold px-2.5 py-1 whitespace-nowrap shrink-0">
                        {mentor.answersCount} ans
                      </span>
                    </div>
                  ))}
                </div>

                {/* Become a Mentor Callout (hidden for students & hospitals as students are not eligible for 3+ years experience seal) */}
                {userLevel !== "student" && !isHospital && (
                  <div className="rounded-2xl bg-muted/40 p-3.5 border border-border/80 text-xs space-y-2">
                    <span className="font-bold text-foreground block">Become a FALE Mentor</span>
                    <p className="text-muted-foreground text-[11px]">
                      Are you a healthcare practitioner with 3+ years of clinical experience? Help guide junior nurses,
                      interns, and students.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        toast.success("Mentor application received!", {
                          description: "The FALE Clinical Credentials Board will review your profile and enable mentor privileges.",
                        });
                      }}
                      className="w-full text-xs font-bold h-8 rounded-xl border-primary text-primary hover:bg-primary hover:text-white cursor-pointer"
                    >
                      Apply for Mentor Seal
                    </Button>
                  </div>
                )}
              </div>

              {/* Student Opportunity Spotlight */}
              {userLevel === "student" && (
                <div className="rounded-3xl border border-primary/25 bg-[#FFF4EC] dark:bg-card p-5 shadow-xs space-y-3">
                  <div className="flex items-center gap-2">
                    <HiOutlineAcademicCap className="h-5 w-5 text-primary" />
                    <h3 className="font-extrabold text-sm text-foreground">Student Fast-Track</h3>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    As a verified healthcare student, you have direct access to paid hospital internships, clinical case
                    reviews, and free mentor CME seats.
                  </p>
                  <Link
                    to="/jobs"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                  >
                    Browse Clinical Internships
                    <HiOutlineArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* ================= CLINICAL REPORT MODAL ================= */}
          <Dialog open={Boolean(reportingPostId)} onOpenChange={(open) => !open && setReportingPostId(null)}>
            <DialogContent className="sm:max-w-lg rounded-3xl p-0 flex flex-col max-h-[88vh] overflow-hidden bg-card border border-border/80 shadow-2xl">
              {/* Modal Header */}
              <DialogHeader className="p-5 sm:p-6 pb-3.5 border-b border-border/60 shrink-0 text-left space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#FFF4EC] dark:bg-card text-primary border border-primary/25 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                    <HiOutlineFlag className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                      Report Discussion
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      Reviewed by the FALE Clinical Moderation Desk within 1 hour.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Scrollable Body (Single, Clean Scroll Container) */}
              <div className="p-5 sm:p-6 py-4 flex-1 overflow-y-auto space-y-4 [scrollbar-width:thin]">
                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-foreground block">
                    Select Reason for Report:
                  </span>
                  <div className="space-y-2">
                    {REPORT_REASONS.map((r) => {
                      const isSelected = reportReason === r.id;
                      const Icon = r.icon;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setReportReason(r.id)}
                          className={cn(
                            "w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none",
                            isSelected
                              ? "border-primary bg-[#FFF4EC]/70 dark:bg-primary/10 ring-1 ring-primary shadow-2xs"
                              : "border-border/70 hover:border-primary/40 hover:bg-muted/30 bg-card"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-4 w-4 shrink-0 mt-0.5 transition-colors",
                              isSelected ? "text-primary" : "text-muted-foreground"
                            )}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-foreground">{r.label}</span>
                              <div
                                className={cn(
                                  "h-4 w-4 rounded-full border flex items-center justify-center shrink-0 transition-all",
                                  isSelected ? "border-primary bg-primary text-white" : "border-border/80 bg-background"
                                )}
                              >
                                {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                              </div>
                            </div>
                            <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{r.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-muted-foreground block">
                    Additional context or details (optional):
                  </label>
                  <textarea
                    rows={2}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="e.g. Bed number / UHID visible in image, wrong drug calculation..."
                    className="w-full rounded-2xl bg-muted/30 border border-border/80 px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary shadow-2xs"
                  />
                </div>
              </div>

              {/* Fixed Footer (Always completely visible, perfectly spaced, project colors) */}
              <DialogFooter className="p-4 sm:p-5 pt-3 border-t border-border/60 shrink-0 flex-row items-center justify-end gap-2.5 bg-card/95">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setReportingPostId(null)}
                  className="h-10 px-5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-foreground text-xs font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmReport}
                  className="h-10 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs hover:shadow-md cursor-pointer transition-all"
                >
                  Submit Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* ================= COMMUNITY RULES & ROLE PERMISSIONS MODAL ================= */}
          <Dialog open={rulesModalOpen} onOpenChange={setRulesModalOpen}>
            <DialogContent className="sm:max-w-xl rounded-3xl p-0 flex flex-col max-h-[90vh] overflow-hidden bg-card border border-border/80 shadow-2xl">
              <DialogHeader className="p-5 sm:p-6 pb-3.5 border-b border-border/60 shrink-0 text-left space-y-1.5">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-[#FFF4EC] dark:bg-card text-primary border border-primary/25 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                    <HiOutlineShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                      Huddle Community Rules &amp; Role Permissions
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                      NABH &amp; HIPAA Compliant · Verified Healthcare Knowledge Network
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="p-5 sm:p-6 py-4 flex-1 overflow-y-auto space-y-5 [scrollbar-width:thin]">
                {/* Simulation Switcher */}
                <div className="rounded-2xl p-3.5 bg-muted/40 border border-border/80 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-foreground block">
                      Account Status: {isVerified ? "Verified Member" : "Pending Verification (Read-Only)"}
                    </span>
                    <p className="text-[11px] text-muted-foreground">
                      Toggle to simulate how unverified vs verified clinicians experience Huddle
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsSimulatedUnverified(!isSimulatedUnverified)}
                    className={cn(
                      "h-8 px-3 rounded-xl text-xs font-bold cursor-pointer transition-all",
                      isSimulatedUnverified
                        ? "bg-primary text-white border-primary"
                        : "border-border text-foreground hover:bg-muted"
                    )}
                  >
                    {isSimulatedUnverified ? "Exit Simulation" : "Simulate Unverified"}
                  </Button>
                </div>

                {/* 1. Who is allowed to post */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                    1. Who is Allowed to Post?
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <RiVerifiedBadgeFill className="h-4 w-4 shrink-0" />
                        <span>Verified Clinicians</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Degree or Council Registration (KMC/KNC) verified. Full clinical posting &amp; discussions.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        <HiOutlineAcademicCap className="h-4 w-4 shrink-0" />
                        <span>Verified Students</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        College ID verified. Can post Questions, Cases, Thoughts, Experiences &amp; ask mentors.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-blue-500/30 bg-blue-500/5 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-400">
                        <HiOutlineBuildingOffice2 className="h-4 w-4 shrink-0" />
                        <span>Verified Hospitals</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        KPME/NABH verified. Restricted to CME events and department updates. Direct job ads banned.
                      </p>
                    </div>

                    <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 space-y-1">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                        <HiOutlineLockClosed className="h-4 w-4 shrink-0" />
                        <span>Unverified Users</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Read-only access. Posting &amp; replying unlocked after FALE team checks credentials (24h).
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Allowed Post Types by Role */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                    2. Role-Based Post Types
                  </h4>
                  <div className="rounded-2xl border border-border/80 overflow-hidden divide-y divide-border/60 text-xs">
                    <div className="p-3 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-foreground">Clinicians, Students &amp; Mentors</span>
                        <p className="text-[11px] text-muted-foreground">
                          Question, Case Study, Ward Experience, Clinical Thought
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 text-[10px] font-bold">
                          Anonymous Allowed
                        </span>
                        <span className="rounded-lg bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold">
                          Peer Moderated
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-foreground">Hospitals &amp; Facilities</span>
                        <p className="text-[11px] text-muted-foreground">
                          CME &amp; Workshop Events, Hospital Updates ONLY
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 px-2 py-0.5 text-[10px] font-bold">
                          No Anonymous
                        </span>
                        <span className="rounded-lg bg-rose-500/10 text-rose-700 dark:text-rose-400 px-2 py-0.5 text-[10px] font-bold">
                          No Job Ads
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <span className="font-bold text-foreground">Clinical Mentorship Q&amp;A</span>
                        <p className="text-[11px] text-muted-foreground">
                          Students &amp; juniors ask questions; only accredited mentors (3+ yrs) answer.
                        </p>
                      </div>
                      <span className="rounded-lg bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold shrink-0">
                        Accredited Mentors Only
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Safety Guardrails */}
                <div className="space-y-2.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-primary">
                    3. Automatic Safety Guardrails
                  </h4>
                  <ul className="space-y-2 text-xs text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Strict Patient Anonymity:</strong> Real-time regex blocks bed numbers, UHID, MRD, patient names, and unredacted scans.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>No Contact Solicitations:</strong> Phone numbers, personal emails, Telegram, and WhatsApp invite links are blocked.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <HiCheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span><strong>Zero Recruiter Spam:</strong> Direct hiring posts are barred in Huddle — job matching is managed exclusively via FALE Jobs.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <DialogFooter className="p-4 sm:p-5 pt-3 border-t border-border/60 shrink-0 flex-row items-center justify-end gap-2.5 bg-card/95">
                <Button
                  type="button"
                  onClick={() => setRulesModalOpen(false)}
                  className="h-10 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Understood
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </AppShell>
  );
}
