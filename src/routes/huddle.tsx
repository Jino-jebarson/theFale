import { useState, useMemo, useEffect, useRef, type ReactNode } from "react";
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
  HiOutlineTrash,
  HiOutlinePlus,
  HiOutlineArrowPath,
  HiOutlineMicrophone,
} from "react-icons/hi2";
import { RiVerifiedBadgeFill, RiStethoscopeLine, RiChatVoiceLine, RiHospitalLine } from "react-icons/ri";
import { toast } from "sonner";
import { VoiceNotePlayer } from "@/components/huddle/VoiceNotePlayer";
import { VoiceNoteRecorder } from "@/components/huddle/VoiceNoteRecorder";
import { AppShell, initials } from "@/components/fale/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
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
  updateHuddlePost as updateHuddlePostLocal,
  deleteHuddlePost as deleteHuddlePostLocal,
  deleteHuddleQuestion as deleteHuddleQuestionLocal,
} from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled } from "@/lib/api";
import {
  getHuddlePosts,
  createHuddlePost,
  upvoteHuddlePost,
  flagHuddlePost,
  addHuddleComment,
  getHuddleComments,
  getHuddleQuestions,
  createHuddleQuestion,
  answerHuddleQuestion,
  getMentorStatus,
  applyForMentorSeal,
  getHuddleSessions,
  createHuddleSession,
  bookHuddleSession,
  cancelHuddleSessionBooking,
  deleteHuddleSession,
  updateHuddlePost as updateHuddlePostApi,
  deleteHuddlePost as deleteHuddlePostApi,
  deleteHuddleQuestion as deleteHuddleQuestionApi,
  type HuddlePostDto,
  type HuddleCommentDto,
  type HuddleQuestionDto,
  type MentorApplicationDto,
  type HuddleSessionDto,
  type CreateHuddleSessionPayload,
} from "@/lib/adapters/huddleAdapter";
import { getCandidateProfile, type CandidateProfile } from "@/lib/adapters/candidateAdapter";
import { getFacilityProfile, type FacilityProfileDto } from "@/lib/adapters/facilityAdapter";

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

function resolveDefaultFieldFromRole(profile: Record<string, any> = {}, portal?: string): HuddleField {
  if (portal === "facility") return "Medicine";
  const str = [
    profile["specialty"],
    profile["profession"],
    profile["role"],
    profile["qualification"],
    profile["course"],
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  if (str.includes("nurse") || str.includes("nursing") || str.includes("gnm") || str.includes("anm")) {
    return "Nursing";
  }
  if (str.includes("physio") || str.includes("bpt") || str.includes("mpt") || str.includes("rehab")) {
    return "Physio";
  }
  if (str.includes("pharm") || str.includes("d.pharm") || str.includes("b.pharm") || str.includes("m.pharm")) {
    return "Pharmacy";
  }
  if (str.includes("radio") || str.includes("x-ray") || str.includes("mri") || str.includes("imaging") || str.includes("radiolog")) {
    return "Radiology";
  }
  if (str.includes("lab") || str.includes("dmlt") || str.includes("bmlt") || str.includes("patholog") || str.includes("technician")) {
    return "Lab";
  }
  return "Medicine";
}

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

const validateClinicalContent = (text: string): { valid: boolean; error?: string } => {
  if (!text || !text.trim()) return { valid: true };

  // 1. Bed / Ward numbers
  const bedPattern = /\b(?:bed\s*(?:no\.?|number|#)?\s*\d+|ward\s*(?:no\.?|#)?\s*\d+|icu\s*bed\s*\d*)\b/i;
  if (bedPattern.test(text)) {
    return {
      valid: false,
      error: "Bed / Ward number detected. Please remove specific hospital bed and ward identifiers.",
    };
  }

  // 2. Patient names / personal identifiers
  const patientPattern = /\b(?:patient|pt\.?|mr\.?|mrs\.?|ms\.?)\s+[A-Za-z]{2,}(?:\s+[A-Za-z]{2,})?\b/i;
  if (patientPattern.test(text)) {
    return {
      valid: false,
      error: "Patient name or personal identifier detected. Clinical discussions and answers must strictly preserve patient anonymity.",
    };
  }

  // 3. Numbers (phone / UHID / MRD / 10-digit number)
  const phonePattern = /(?:(?:\+91|0)?[6-9]\d{9})|\b\d{10,12}\b/i;
  const hospitalIdPattern = /\b(?:MRN|UHID|IPD|OPD|REG(?:ISTRATION)?)[-:\s#]?\d{3,}\b/i;
  if (phonePattern.test(text) || hospitalIdPattern.test(text)) {
    return {
      valid: false,
      error: "Contact or registration number (phone, UHID, MRD) detected. Direct personal contacts and hospital IDs are strictly forbidden.",
    };
  }

  // 4. Links / URLs
  const linkPattern = /(?:https?:\/\/|www\.|t\.me\/|wa\.me\/|bit\.ly\/)[^\s]+|\b[a-zA-Z0-9-]+\.(?:com|org|net|in|io|co|ai)(?:\/[^\s]*)?\b/i;
  if (linkPattern.test(text)) {
    return {
      valid: false,
      error: "External links and URLs are not permitted in clinical answers or discussions.",
    };
  }

  // 5. Hiring / Recruitment
  const hiringPattern = /\b(?:we\s+are\s+hiring|hiring\s+now|job\s+vacancy|job\s+opening|urgent\s+requirement|walk[- ]?in\s+interview|send\s+(?:your\s+)?(?:cv|resume)|contact\s+for\s+job|apply\s+now|recruiting|open\s+position)\b/i;
  if (hiringPattern.test(text)) {
    return {
      valid: false,
      error: "Job postings and recruitment promotions are not allowed in Huddle. Please use the FALE Jobs portal.",
    };
  }

  return { valid: true };
};

export function formatRelativeTime(dateInput?: string | Date | null): string {
  if (!dateInput) return "Recently";
  const str = String(dateInput).trim();
  if (!str) return "Recently";

  // Check if string is already a formatted relative label
  if (
    str.toLowerCase() === "just now" ||
    str.toLowerCase() === "today" ||
    str.toLowerCase() === "yesterday" ||
    str.toLowerCase() === "recently" ||
    /^\d+\s*(s|m|h|d|w|mo|y)\s*ago$/i.test(str) ||
    /^\d+\s*(sec|secs|min|mins|minute|minutes|hour|hours|day|days|week|weeks)\s*ago$/i.test(str)
  ) {
    return str;
  }

  const date = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return str || "Recently";

  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 45) return "Just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;

  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

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

  // Composer State - dynamically defaulted from clinician role
  const defaultField = useMemo(() => resolveDefaultFieldFromRole(s.profile, s.portal), [s.profile, s.portal]);
  const [postType, setPostType] = useState<HuddlePostType>("Thought");
  const [postField, setPostField] = useState<HuddleField>(defaultField);

  // Auto-sync post department when clinician role or profile updates
  useEffect(() => {
    setPostField(defaultField);
  }, [defaultField]);
  const [postText, setPostText] = useState("");
  const [postAnon, setPostAnon] = useState(false);
  const [postImage, setPostImage] = useState<string | null>(null);
  const [postAudio, setPostAudio] = useState<{ audioUrl: string; duration: number } | null>(null);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  // Mentor Ask State
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [askTopic, setAskTopic] = useState<HuddleQuestion["topic"]>("Career");
  const [askText, setAskText] = useState("");
  const [mentorAnswerDrafts, setMentorAnswerDrafts] = useState<Record<string, string>>({});

  // Conduct Session State
  const [conductSessionModalOpen, setConductSessionModalOpen] = useState(false);
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionCategory, setSessionCategory] = useState("Mentorship Workshop");
  const [sessionDate, setSessionDate] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d;
  });
  const [sessionTime, setSessionTime] = useState<string>("06:00 PM");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [sessionWhere, setSessionWhere] = useState("Live Interactive (Google Meet)");
  const [sessionSeats, setSessionSeats] = useState(30);
  const [sessionDescription, setSessionDescription] = useState("");
  const [sessionRoles, setSessionRoles] = useState<string[]>(["Nursing", "Doctors", "Interns"]);
  const [isConductingSession, setIsConductingSession] = useState(false);

  // Candidate Profile for identity
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfile | null>(null);

  // Edit Post State
  const [editingPost, setEditingPost] = useState<HuddlePost | null>(null);
  const [editPostText, setEditPostText] = useState("");
  const [editPostType, setEditPostType] = useState<HuddlePostType>("Thought");
  const [editPostField, setEditPostField] = useState<HuddleField>("Medicine");
  const [editPostImage, setEditPostImage] = useState<string | null>(null);
  const [editPostAnon, setEditPostAnon] = useState(false);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  // Delete Post State
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [isDeletingPost, setIsDeletingPost] = useState(false);

  // Delete Question State
  const [deletingQuestionId, setDeletingQuestionId] = useState<string | null>(null);
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false);

  const sessionTimeSlots = useMemo(
    () => [
      "09:00 AM",
      "10:00 AM",
      "11:00 AM",
      "12:00 PM",
      "02:00 PM",
      "03:30 PM",
      "05:00 PM",
      "06:00 PM",
      "07:00 PM",
      "08:00 PM",
    ],
    []
  );

  // Dynamic API state
  const [apiPosts, setApiPosts] = useState<HuddlePostDto[]>([]);
  const [apiQuestions, setApiQuestions] = useState<HuddleQuestionDto[]>([]);
  const [apiSessions, setApiSessions] = useState<HuddleSessionDto[]>([]);
  const [postComments, setPostComments] = useState<Record<string, HuddleCommentDto[]>>({});
  const [loading, setLoading] = useState(isApiEnabled);

  const fetchHuddleData = () => {
    if (!isApiEnabled) return;
    setLoading(true);
    Promise.all([
      getHuddlePosts(selectedField).catch(() => []),
      getHuddleQuestions().catch(() => []),
      getHuddleSessions().catch(() => []),
    ])
      .then(([posts, questions, sessions]) => {
        setApiPosts(posts);
        setApiQuestions(questions);
        setApiSessions(sessions);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchHuddleData();
  }, [selectedField]);

  // Current user info & verification status (100% Dynamic from active session)
  const isHospital = s.portal === "facility";
  const [facilityProfile, setFacilityProfile] = useState<FacilityProfileDto | null>(null);

  useEffect(() => {
    if (isApiEnabled && isHospital) {
      getFacilityProfile()
        .then((profile) => {
          if (profile) setFacilityProfile(profile);
        })
        .catch((err) => {
          console.warn("Failed to load facility profile for Huddle:", err);
        });
    }
  }, [isHospital]);

  const userName = String(
    (isHospital ? (facilityProfile?.hospitalName || s.profile["org"] || s.profile["hospitalName"]) : "") ||
    s.profile["name"] ||
    s.profile["fullName"] ||
    (s.contact && !s.contact.startsWith("+91000") ? (s.contact.includes("@") ? s.contact.split("@")[0] : s.contact) : "") ||
    (isHospital ? "Healthcare Facility" : "Doctor / Clinician")
  );
  const userRole = String(
    (isHospital ? (facilityProfile?.facilityType || s.profile["facilityType"] || "Multi-Specialty Hospital") : "") ||
    s.profile["specialty"] ||
    s.profile["profession"] ||
    s.profile["role"] ||
    (isHospital ? "Facility Department" : "Healthcare Professional")
  );
  const userLevel = (isHospital
    ? "hospital"
    : (s.candidateLevel || (s.profile["exp"] === "Fresher" ? "fresher" : (s.profile["level"] as any) || "professional"))) as
    | "student"
    | "fresher"
    | "professional"
    | "hospital";

  // Verification status based on FALE credential check
  const isVerified = isHospital
    ? (facilityProfile ? facilityProfile.status === "VERIFIED" || s.profile["verified"] !== false : true)
    : (s.profile["verified"] !== false && s.profile["kycStatus"] !== "pending" && s.profile["kycStatus"] !== "rejected");

  // Clinical Mentor verification & application state
  const [mentorData, setMentorData] = useState<MentorApplicationDto | null>(null);
  const [applyingMentor, setApplyingMentor] = useState(false);

  useEffect(() => {
    if (isApiEnabled && !isHospital) {
      getCandidateProfile()
        .then((profile) => {
          if (profile) setCandidateProfile(profile);
        })
        .catch(() => { });
      if (userLevel !== "student") {
        getMentorStatus()
          .then((res) => {
            if (res) setMentorData(res);
          })
          .catch((err) => {
            console.warn("Failed to load mentor status:", err);
          });
      }
    }
  }, [isHospital, userLevel]);

  // Extract candidate clinical experience years (from API status, candidate profile, or local store)
  const candidateExpYears = useMemo(() => {
    if (mentorData?.yearsExperience != null && mentorData.yearsExperience > 0) {
      return mentorData.yearsExperience;
    }
    const raw = String(
      s.profile["experienceYears"] ||
      s.profile["exp"] ||
      s.profile["experience"] ||
      ""
    ).toLowerCase();
    if (raw.includes("fresher") || raw.includes("student") || raw.includes("intern")) {
      return 0;
    }
    const match = raw.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }, [mentorData, s.profile]);

  const isMentorCertified = Boolean(
    s.profile["isMentor"] ||
    mentorData?.status === "APPROVED" ||
    mentorData?.verified
  );
  const isMentorPending = mentorData?.status === "PENDING";
  const hasMinExperience = candidateExpYears >= 3;

  const handleApplyMentor = async () => {
    if (!hasMinExperience) {
      toast.error("3+ Years Experience Required", {
        description: `Healthcare mentors must have at least 3 years of clinical experience. Your current profile has ${candidateExpYears} year${candidateExpYears === 1 ? "" : "s"}.`,
      });
      return;
    }
    setApplyingMentor(true);
    try {
      if (isApiEnabled) {
        const res = await applyForMentorSeal();
        setMentorData(res);
      } else {
        setMentorData({
          status: "PENDING",
          name: userName,
          yearsExperience: candidateExpYears,
        });
      }
      toast.success("Mentor Application Submitted!", {
        description: "Your clinical profile has been forwarded to the Admin Moderation Desk for credential audit & mentor seal verification.",
      });
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit mentor application");
    } finally {
      setApplyingMentor(false);
    }
  };

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

  const visibleQuestions = useMemo(() => {
    if (isApiEnabled && apiQuestions.length > 0) {
      return apiQuestions.map((q) => ({
        id: q.id,
        topic: (q.topic || q.category || q.field || "Career") as HuddleQuestion["topic"],
        askerId: q.askerId || q.authorId || "user",
        askerName: q.askerName || q.authorName || "Healthcare Professional",
        askerShort: (q.askerName || q.authorName || "Clinician").split(" ")[0],
        askerLevel: (q.askerLevel || "professional") as any,
        askerProfession: q.askerProfession || q.authorRole || "Clinician",
        text: q.questionText || q.body || q.title || q.question || "Clinical question",
        answers: (q.answers || []).map((a) => ({
          id: a.id,
          mentorId: a.mentorId || "mentor",
          mentorName: a.mentorName || "Verified Specialist",
          mentorShort: (a.mentorName || "Dr.").split(" ")[0],
          mentorRole: a.mentorRole || "Consultant",
          mentorYrs: a.mentorYrs != null && a.mentorYrs > 0 ? a.mentorYrs : candidateExpYears >= 3 ? candidateExpYears : 3,
          mentorSpecialty: a.mentorSpecialty || "Clinical Specialist",
          text: a.answerText || a.body || a.text || "",
          at: formatRelativeTime(a.createdAt || (a as any).timeAgo || (a as any).at),
          helpfulCount: a.upvotes || a.helpfulCount || 0,
        })),
        at: formatRelativeTime(q.createdAt || (q as any).timeAgo || (q as any).at),
      }));
    }
    return (s.huddleQuestions || []).map((q) => ({
      ...q,
      at: formatRelativeTime(q.at),
      answers: (q.answers || []).map((a) => ({
        ...a,
        at: formatRelativeTime(a.at),
      })),
    }));
  }, [isApiEnabled, apiQuestions, s.huddleQuestions, candidateExpYears]);

  const visibleMentors = useMemo(() => {
    const map = new Map<string, { id: string; name: string; role: string; yrs: number; answersCount: number }>();
    if (isMentorCertified && userName) {
      map.set(userName, {
        id: mentorData?.userId || "current-user-mentor",
        name: userName,
        role: userRole || "Clinical Specialist",
        yrs: candidateExpYears >= 3 ? candidateExpYears : 4,
        answersCount: 0,
      });
    }
    for (const q of visibleQuestions) {
      for (const a of q.answers) {
        if (!a.mentorName) continue;
        const existing = map.get(a.mentorName);
        if (existing) {
          existing.answersCount += 1;
        } else {
          map.set(a.mentorName, {
            id: a.mentorId || a.mentorName,
            name: a.mentorName,
            role: a.mentorRole || a.mentorSpecialty || "Clinical Specialist",
            yrs: a.mentorYrs != null && a.mentorYrs > 0 ? a.mentorYrs : candidateExpYears >= 3 ? candidateExpYears : 3,
            answersCount: 1,
          });
        }
      }
    }
    return Array.from(map.values());
  }, [visibleQuestions, isMentorCertified, userName, userRole, mentorData, candidateExpYears]);

  // Filtered posts - 100% Dynamic from live backend API or real session
  const visiblePosts = useMemo(() => {
    let rawList: HuddlePost[] = [];
    if (isApiEnabled) {
      const apiIds = new Set(apiPosts.map((p) => p.id));
      const localOnly = (s.huddlePosts || [])
        .filter((p) => !apiIds.has(p.id))
        .map((p) => ({
          ...p,
          at: formatRelativeTime(p.at || p.time),
          time: formatRelativeTime(p.at || p.time),
          isMentor: Boolean(p.isMentor || (isMentorCertified && p.authorName === userName)),
        }));
      const mappedApi: HuddlePost[] = apiPosts.map((p) => {
        const isAnon = Boolean((p as any).anon || (p as any).isAnonymous);
        const isPostMentor = Boolean(
          (p as any).isMentor ||
          (p as any).authorIsMentor ||
          (isMentorCertified && (p.authorId === mentorData?.userId || p.authorName === userName || p.authorName === mentorData?.name)) ||
          visibleMentors.some((m) => m.name === p.authorName || m.id === p.authorId)
        );
        const isPostHospital = Boolean(
          (p as any).isHospital ||
          p.type === "Update" ||
          p.type === "Event" ||
          (p.authorRole && (
            p.authorRole.toLowerCase().includes("hospital") ||
            p.authorRole.toLowerCase().includes("facility") ||
            p.authorRole.toLowerCase().includes("center") ||
            p.authorRole.toLowerCase().includes("centre") ||
            p.authorRole.toLowerCase().includes("institute") ||
            p.authorRole.toLowerCase().includes("clinic")
          )) ||
          (isHospital && (p.authorId === (facilityProfile?.id || s.profile["facilityId"]) || p.authorName === userName))
        );
        const mentorYrs = (p as any).mentorYrs || (isPostMentor ? (candidateExpYears >= 3 ? candidateExpYears : 4) : undefined);
        const relTime = formatRelativeTime(p.createdAt || (p as any).timeAgo || (p as any).time);
        return {
          id: p.id,
          type: (p.type || (isPostHospital ? "Update" : "Thought")) as HuddlePostType,
          field: (p.field || "Medicine") as HuddleField,
          authorId: p.authorId || "",
          authorName: isAnon ? "Anonymous Clinician" : (p.authorName || (isPostHospital ? "Healthcare Facility" : "Verified Clinician")),
          authorShort: isAnon ? "Anonymous" : (p.authorName || (isPostHospital ? "Facility" : "Clinician")).split(" ")[0],
          authorRole: isAnon ? "Verified Clinician" : (p.authorRole || (isPostHospital ? "Accredited Hospital" : "Clinician")),
          authorLevel: (isPostHospital ? "hospital" : "professional") as any,
          isMentor: isPostMentor,
          isHospital: isPostHospital,
          mentorYrs: mentorYrs,
          anon: isAnon,
          pinned: Boolean((p as any).isPinned),
          text: p.body || p.title || "",
          status: ((p.status || "live").toLowerCase()) as any,
          time: relTime,
          at: relTime,
          date: "Today",
          helpfulCount: p.upvotes || 0,
          userHelpful: Boolean(p.hasUpvoted),
          image: (p as any).image || (p as any).imageUrl,
          audioUrl: (p as any).audioUrl || (p as any).audio,
          audioDuration: (p as any).audioDuration,
          replies: (postComments[p.id] || []).map((c) => ({
            id: c.id,
            authorName: c.authorName || "Verified Clinician",
            authorRole: c.authorRole || "Clinician",
            authorLevel: "professional" as const,
            text: c.body || c.content || "",
            at: formatRelativeTime(c.createdAt || (c as any).timeAgo || (c as any).at),
          })),
        };
      });
      rawList = [...localOnly, ...mappedApi];
    } else {
      rawList = (s.huddlePosts || []).map((p) => ({
        ...p,
        at: formatRelativeTime(p.at || p.time),
        time: formatRelativeTime(p.at || p.time),
        isMentor: Boolean(p.isMentor || (isMentorCertified && p.authorName === userName)),
      }));
    }

    return rawList
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
  }, [isApiEnabled, apiPosts, postComments, s.huddlePosts, selectedField, selectedType, searchQuery, isMentorCertified, userName, mentorData, visibleMentors, candidateExpYears]);

  const visibleSessions = useMemo(() => {
    if (isApiEnabled) {
      return apiSessions.map((sess) => ({
        id: sess.id,
        title: sess.title,
        category: sess.category,
        hostType: (sess.hostType || "mentor") as "mentor" | "hospital",
        hostName: sess.hostName,
        hostSub: sess.hostSub || "Accredited Clinical Mentor",
        when: sess.when,
        where: sess.where,
        seats: sess.seats,
        bookedCount: sess.bookedCount,
        isBooked: Boolean(sess.isBooked),
        isHost: Boolean(sess.isHost),
        description: sess.description || "",
        forRoles: Array.isArray(sess.forRoles)
          ? sess.forRoles
          : typeof sess.forRoles === "string"
            ? (sess.forRoles as string).split(",").map((r) => r.trim()).filter(Boolean)
            : ["Nursing", "Doctors", "Interns"],
      }));
    }
    return s.huddleSessions || [];
  }, [isApiEnabled, apiSessions, s.huddleSessions]);

  const handleCreatePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error("Posting is locked for unverified accounts", {
        description: "Complete your KYC or College ID verification to unlock posting in FALE Huddle.",
      });
      return;
    }
    if ((!postText.trim() && !postAudio) || safety.st === "block" || safety.st === "hire") {
      toast.error(safety.why || "Please enter text or record a voice note.");
      return;
    }

    const isAnon = Boolean(postAnon && !isHospital);
    const hasImage = Boolean(postImage);
    const isUnderReview = postType === "Case" || hasImage;
    const effectiveText = postText.trim() || (postAudio ? "Clinical voice discussion" : "");

    // Optimistically update store
    const created = addHuddlePost({
      type: postType,
      field: postField,
      authorName: isAnon ? "Anonymous Clinician" : userName,
      authorRole: isAnon ? "Verified Clinician" : userRole,
      authorLevel: isHospital ? "hospital" : userLevel,
      anon: isAnon,
      text: effectiveText,
      image: postImage || undefined,
      audioUrl: postAudio?.audioUrl,
      audioDuration: postAudio?.duration,
      isHospital,
    });

    if (isApiEnabled) {
      createHuddlePost({
        title: (postText.trim() || (postAudio ? "Voice Note" : "")).slice(0, 80),
        body: effectiveText,
        type: postType,
        field: postField,
        anon: isAnon,
        image: postImage || undefined,
        audioUrl: postAudio?.audioUrl,
        audioDuration: postAudio?.duration,
      })
        .then((newPost) => {
          if (newPost && newPost.id) {
            const augmented: HuddlePostDto = {
              ...newPost,
              authorName: isAnon ? "Anonymous Clinician" : newPost.authorName,
              authorRole: isAnon ? "Verified Clinician" : newPost.authorRole,
              anon: isAnon,
              isAnonymous: isAnon,
              image: postImage || undefined,
              imageUrl: postImage || undefined,
              audioUrl: postAudio?.audioUrl || (newPost as any).audioUrl,
              audioDuration: postAudio?.duration || (newPost as any).audioDuration,
              status: isUnderReview ? "review" : "live",
            };
            if (!isUnderReview) {
              setApiPosts((prev) => [augmented, ...prev]);
            }
          }
        })
        .catch((err) => {
          console.warn("Backend huddle post sync:", err);
        });
    }

    setPostText("");
    setPostImage(null);
    setPostAudio(null);
    setIsRecordingAudio(false);
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
    const targetPost = posts.find((p) => p.id === postId);
    if (targetPost && (targetPost.type === "Question" || targetPost.type === "question") && !isMentorCertified) {
      toast.error("Accredited Mentors Only", {
        description: "Only certified clinical mentors with 3+ years experience can answer questions.",
      });
      return;
    }
    const text = (replyDrafts[postId] || "").trim();
    if (!text) return;

    const validation = validateClinicalContent(text);
    if (!validation.valid) {
      toast.error("Content Policy Violation", {
        description: validation.error,
      });
      return;
    }

    const optimisticComment: HuddleCommentDto = {
      id: "temp-" + Date.now(),
      postId,
      authorName: userName,
      authorRole: userRole,
      content: text,
      body: text,
      createdAt: new Date().toISOString(),
      timeAgo: "Just now",
    };

    setPostComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), optimisticComment],
    }));

    setApiPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, commentCount: ((p as any).commentsCount || p.commentCount || 0) + 1 } : p
      )
    );

    // Optimistically update store
    addHuddleReply(postId, {
      authorName: userName,
      authorRole: userRole,
      text,
      authorLevel: userLevel === "hospital" ? "professional" : userLevel,
    });

    if (isApiEnabled) {
      addHuddleComment(postId, text)
        .then((savedComment) => {
          setPostComments((prev) => ({
            ...prev,
            [postId]: (prev[postId] || []).map((c) => (c.id === optimisticComment.id ? savedComment : c)),
          }));
        })
        .catch((err) => {
          console.warn("Backend comment sync:", err);
        });
    }

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

    if (isApiEnabled) {
      flagHuddlePost(reportingPostId, reasonText)
        .then(() => {
          fetchHuddleData();
        })
        .catch(console.error);
    }

    toast.success("Flagged for Clinical Review", {
      description: "Thank you. The post has been hidden from your feed and routed to the FALE Moderation Desk.",
    });
    setReportingPostId(null);
  };

  const isPostAuthor = useMemo(() => {
    return (post: HuddlePost) => {
      if (post.authorId === "current-user") return true;
      if (candidateProfile?.userId && post.authorId === candidateProfile.userId) return true;
      if (mentorData?.userId && post.authorId === mentorData.userId) return true;
      if (facilityProfile?.userId && post.authorId === facilityProfile.userId) return true;
      if (facilityProfile?.id && post.authorId === facilityProfile.id) return true;
      if (s.profile["userId"] && post.authorId === s.profile["userId"]) return true;
      if (!post.anon && post.authorName) {
        const curName = (facilityProfile?.hospitalName || candidateProfile?.name || userName || "").trim().toLowerCase();
        const postName = post.authorName.trim().toLowerCase();
        if (curName && (postName === curName || postName.includes(curName) || curName.includes(postName))) {
          return true;
        }
      }
      return false;
    };
  }, [candidateProfile, facilityProfile, mentorData, s.profile, userName]);

  const isQuestionAuthor = useMemo(() => {
    return (q: any) => {
      if (q.askerId === "current-user") return true;
      if (candidateProfile?.userId && q.authorId === candidateProfile.userId) return true;
      if (s.profile["userId"] && q.authorId === s.profile["userId"]) return true;
      if (!q.isAnonymous && (q.askerName || q.authorName)) {
        const curName = (candidateProfile?.name || userName || "").trim().toLowerCase();
        const askerName = (q.askerName || q.authorName || "").trim().toLowerCase();
        if (curName && (askerName === curName || askerName.includes(curName) || curName.includes(askerName))) {
          return true;
        }
      }
      return false;
    };
  }, [candidateProfile, s.profile, userName]);

  const handleOpenEditModal = (post: HuddlePost) => {
    setEditingPost(post);
    setEditPostText(post.text);
    setEditPostType(post.type);
    setEditPostField(post.field);
    setEditPostImage(post.image || null);
    setEditPostAnon(Boolean(post.anon));
  };

  const handleSavePostEdit = async () => {
    if (!editingPost) return;
    const trimmed = editPostText.trim();
    if (!trimmed) {
      toast.error("Post content cannot be empty");
      return;
    }
    const safetyContent = validateClinicalContent(trimmed);
    if (!safetyContent.valid) {
      toast.error(safetyContent.error || "Clinical safety violation detected");
      return;
    }
    const safety = safetyCheck(trimmed);
    if (safety.st === "block" || safety.st === "hire") {
      toast.error(safety.why);
      return;
    }

    setIsSubmittingEdit(true);
    try {
      if (isApiEnabled) {
        await updateHuddlePostApi(editingPost.id, {
          title: trimmed.slice(0, 100),
          body: trimmed,
          type: editPostType,
          field: editPostField,
          image: editPostImage,
          anon: editPostAnon,
        });
        setApiPosts((prev) =>
          prev.map((p) =>
            p.id === editingPost.id
              ? {
                ...p,
                title: trimmed.slice(0, 100),
                body: trimmed,
                type: editPostType,
                field: editPostField,
                imageUrl: editPostImage || undefined,
                image: editPostImage || undefined,
                isAnonymous: editPostAnon,
                anon: editPostAnon,
              }
              : p
          )
        );
      }
      updateHuddlePostLocal(editingPost.id, {
        type: editPostType,
        field: editPostField,
        text: trimmed,
        image: editPostImage,
        anon: editPostAnon,
      });

      toast.success("Discussion updated successfully!");
      setEditingPost(null);
    } catch (err: any) {
      toast.error("Failed to update post", {
        description: err?.message || "Please check your network and try again.",
      });
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleConfirmDeletePost = async () => {
    if (!deletingPostId) return;
    setIsDeletingPost(true);
    try {
      if (isApiEnabled) {
        await deleteHuddlePostApi(deletingPostId);
        setApiPosts((prev) => prev.filter((p) => p.id !== deletingPostId));
      }
      deleteHuddlePostLocal(deletingPostId);
      toast.success("Post deleted successfully", {
        description: "The discussion has been removed from Huddle.",
      });
      setDeletingPostId(null);
    } catch (err: any) {
      toast.error("Failed to delete post", {
        description: err?.message || "Could not delete post",
      });
    } finally {
      setIsDeletingPost(false);
    }
  };

  const handleConfirmDeleteQuestion = async () => {
    if (!deletingQuestionId) return;
    setIsDeletingQuestion(true);
    try {
      if (isApiEnabled) {
        await deleteHuddleQuestionApi(deletingQuestionId);
        setApiQuestions((prev) => prev.filter((q) => q.id !== deletingQuestionId));
      }
      deleteHuddleQuestionLocal(deletingQuestionId);
      toast.success("Question deleted successfully");
      setDeletingQuestionId(null);
    } catch (err: any) {
      toast.error("Failed to delete question: " + (err?.message || ""));
    } finally {
      setIsDeletingQuestion(false);
    }
  };

  const handleAskMentor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      toast.error("Verification required to ask questions to mentors");
      return;
    }
    if (!askText.trim()) return;

    const validation = validateClinicalContent(askText);
    if (!validation.valid) {
      toast.error("Content Policy Violation", {
        description: validation.error,
      });
      return;
    }

    askMentorQuestion({
      topic: askTopic,
      askerName: userName,
      askerLevel: userLevel === "hospital" ? "professional" : userLevel,
      askerProfession: userRole,
      text: askText.trim(),
    });

    if (isApiEnabled) {
      createHuddleQuestion({
        title: askText.slice(0, 80),
        body: askText.trim(),
        category: askTopic,
      })
        .then(() => fetchHuddleData())
        .catch(console.warn);
    }

    setAskText("");
    setAskModalOpen(false);
    toast.success("Question submitted to Clinical Mentors!", {
      description: "Senior practitioners receive notification and will provide an in-depth public answer.",
    });
  };

  const handleAnswerMentor = (questionId: string) => {
    if (!isMentorCertified) {
      toast.error("Mentor Accreditation Required", {
        description: "Only accredited clinical mentors with 3+ years experience can answer questions.",
      });
      return;
    }
    const text = (mentorAnswerDrafts[questionId] || "").trim();
    if (!text) return;

    const validation = validateClinicalContent(text);
    if (!validation.valid) {
      toast.error("Content Policy Violation", {
        description: validation.error,
      });
      return;
    }

    const resolvedMentorYrs = candidateExpYears >= 3 ? candidateExpYears : 3;
    const resolvedMentorSpecialty = String(s.profile["specialty"] || s.profile["profession"] || "Clinical Specialist");

    answerMentorQuestion(questionId, {
      mentorName: userName,
      mentorRole: userRole,
      mentorYrs: resolvedMentorYrs,
      mentorSpecialty: resolvedMentorSpecialty,
      text,
    });

    if (isApiEnabled) {
      answerHuddleQuestion(questionId, text)
        .then(() => fetchHuddleData())
        .catch(console.warn);
    }

    setMentorAnswerDrafts((prev) => ({ ...prev, [questionId]: "" }));
    toast.success("Mentor answer published!");
  };

  const handleToggleBookSession = async (session: any) => {
    if (!isVerified) {
      toast.error("Account Verification Required", {
        description: "Please complete your clinical ID or KYC verification to book CME seats.",
      });
      return;
    }

    try {
      if (isApiEnabled) {
        let updated: HuddleSessionDto;
        if (session.isBooked) {
          updated = await cancelHuddleSessionBooking(session.id);
          toast.info("Booking cancelled.");
        } else {
          updated = await bookHuddleSession(session.id);
          toast.success("Seat reserved!", {
            description: `You are booked for "${session.title}". Invitation confirmed.`,
          });
        }
        setApiSessions((prev) =>
          prev.map((s) => (s.id === session.id ? updated : s))
        );
      } else {
        toggleBookSession(session.id);
        if (!session.isBooked) {
          toast.success("Seat reserved!", {
            description: `You are booked for "${session.title}". Invitation confirmed.`,
          });
        } else {
          toast.info("Booking cancelled.");
        }
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to update session booking");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm("Are you sure you want to cancel and remove this session?")) return;
    try {
      if (isApiEnabled) {
        await deleteHuddleSession(sessionId);
        setApiSessions((prev) => prev.filter((s) => s.id !== sessionId));
        toast.success("Session cancelled and removed.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to cancel session");
    }
  };

  const handleConductSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isMentorCertified && !isHospital) {
      toast.error("Accredited Clinical Mentor or Hospital Required", {
        description: "Only verified clinical mentors or accredited healthcare institutions can conduct sessions and CMEs.",
      });
      return;
    }

    if (!sessionTitle.trim()) {
      toast.error("Session title is required");
      return;
    }
    if (!sessionDate) {
      toast.error("Please select a date for the mentorship session");
      return;
    }

    // Safety checks
    const safetyCheckRes = validateClinicalContent(sessionTitle + " " + sessionDescription);
    if (!safetyCheckRes.valid) {
      toast.error("Content Policy Violation", {
        description: safetyCheckRes.error,
      });
      return;
    }

    // Combine custom date + time into ISO timestamp
    const combinedDate = new Date(sessionDate);
    const [timeStr, modifier] = (sessionTime || "06:00 PM").split(" ");
    let [hours, minutes] = timeStr.split(":").map(Number);
    if (modifier === "PM" && hours < 12) hours += 12;
    if (modifier === "AM" && hours === 12) hours = 0;
    combinedDate.setHours(hours, minutes || 0, 0, 0);
    const whenIso = combinedDate.toISOString();

    setIsConductingSession(true);
    try {
      if (isApiEnabled) {
        const payload: CreateHuddleSessionPayload = {
          title: sessionTitle.trim(),
          category: sessionCategory,
          when: whenIso,
          where: sessionWhere.trim() || "Live Interactive (Google Meet)",
          seats: Number(sessionSeats) || 30,
          description: sessionDescription.trim(),
          forRoles: sessionRoles.length > 0 ? sessionRoles : ["Nursing", "Doctors", "Interns"],
        };

        const newSession = await createHuddleSession(payload);
        setApiSessions((prev) => [newSession, ...prev]);
        toast.success("Mentorship session scheduled!", {
          description: `"${newSession.title}" is now open for clinical registrations.`,
        });
      } else {
        const newMockSession = {
          id: "sess_" + Date.now(),
          title: sessionTitle.trim(),
          category: sessionCategory,
          hostType: "mentor" as const,
          hostName: userName,
          hostSub: `Accredited Clinical Mentor · ${userRole}`,
          when: whenIso,
          where: sessionWhere.trim() || "Live Interactive (Google Meet)",
          seats: Number(sessionSeats) || 30,
          bookedCount: 0,
          isBooked: false,
          description: sessionDescription.trim(),
          forRoles: sessionRoles,
        };
        setState((st) => ({
          huddleSessions: [newMockSession, ...(st.huddleSessions || [])],
        }));
        toast.success("Mentorship session scheduled!", {
          description: `"${newMockSession.title}" is now live.`,
        });
      }

      // Reset form & close modal
      setSessionTitle("");
      setSessionDescription("");
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 3);
      setSessionDate(defaultDate);
      setSessionTime("06:00 PM");
      setSessionSeats(30);
      setConductSessionModalOpen(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to schedule session");
    } finally {
      setIsConductingSession(false);
    }
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
                    {visibleSessions.length}
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
                      <div className="relative inline-block rounded-2xl overflow-hidden border border-border bg-muted/20">
                        <img src={postImage} alt="Attachment" className="max-h-56 w-auto max-w-full object-contain rounded-xl" />
                        <button
                          type="button"
                          onClick={() => setPostImage(null)}
                          className="absolute top-1.5 right-1.5 bg-black/70 text-white p-1 rounded-full hover:bg-black"
                        >
                          <HiOutlineXMark className="h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Voice Note Active Recording or Recorded Audio Preview (Full-Width Above Controls) */}
                    {(isRecordingAudio || postAudio) && (
                      <div className="w-full">
                        <VoiceNoteRecorder
                          autoStart={isRecordingAudio && !postAudio}
                          existingAudio={postAudio}
                          onRecorded={(data) => {
                            setPostAudio(data);
                            setIsRecordingAudio(false);
                          }}
                          onDiscard={() => {
                            setPostAudio(null);
                            setIsRecordingAudio(false);
                          }}
                        />
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
                              ? "AI Safety Shield Verified"
                              : safety.st === "block"
                                ? "AI Content Warning"
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
                                if (file.size > 5 * 1024 * 1024) {
                                  toast.error("Image file is too large. Max size is 5MB.");
                                  return;
                                }
                                const reader = new FileReader();
                                reader.onload = (ev) => {
                                  const base64 = ev.target?.result as string;
                                  setPostImage(base64);
                                  toast.info("Image attached. Posts with images undergo FALE privacy check.");
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                        </label>

                        {/* Voice Note Trigger Button */}
                        {!postAudio && !isRecordingAudio && (
                          <button
                            type="button"
                            onClick={() => setIsRecordingAudio(true)}
                            className="h-9 cursor-pointer px-3 rounded-xl text-xs font-semibold border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
                            title="Record up to 1-minute audio pearl"
                          >
                            <HiOutlineMicrophone className="h-4 w-4 text-primary shrink-0" />
                            <span>Voice Note (1m)</span>
                          </button>
                        )}

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
                          disabled={(!postText.trim() && !postAudio) || safety.st === "block" || safety.st === "hire"}
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
                {loading ? (
                  <div className="surface p-12 text-center text-xs text-muted-foreground rounded-3xl border border-border/80">
                    <HiOutlineArrowPath className="mx-auto h-8 w-8 text-primary animate-spin" />
                    <p className="mt-2 text-sm font-semibold">Loading discussions...</p>
                  </div>
                ) : visiblePosts.length === 0 ? (
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
                              {post.isMentor && !post.anon && (
                                <span className="rounded-full bg-[#FFF4EC] text-[#FF5A1F] border border-primary/20 px-2 py-0.5 text-[10px] font-black uppercase whitespace-nowrap shrink-0">
                                  Mentor {post.mentorYrs ? `(${post.mentorYrs}+ YRS)` : ""}
                                </span>
                              )}
                              {post.isHospital && !post.anon && (
                                <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold whitespace-nowrap shrink-0">
                                  Verified Institution
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
                                {formatRelativeTime(post.at || post.time)}
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
                        <div className="mt-3 rounded-2xl overflow-hidden border border-border bg-muted/20 dark:bg-black/30 flex items-center justify-center">
                          <img
                            src={post.image}
                            alt="Clinical demonstration"
                            className="max-h-[520px] w-auto max-w-full object-contain mx-auto rounded-xl"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = "none";
                            }}
                          />
                        </div>
                      )}

                      {/* Voice Note Audio Player if present */}
                      {post.audioUrl && (
                        <div className="mt-3">
                          <VoiceNotePlayer
                            audioUrl={post.audioUrl}
                            duration={post.audioDuration}
                            authorRole={post.authorRole}
                          />
                        </div>
                      )}

                      {/* Actions: Helpful, Reply, Report */}
                      <div className="mt-4 pt-3 border-t border-border/60 flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-3">
                          {/* Helpful Button */}
                          <button
                            type="button"
                            onClick={() => {
                              toggleHelpfulPost(post.id);
                              if (isApiEnabled) {
                                setApiPosts((prev) =>
                                  prev.map((p) =>
                                    p.id === post.id
                                      ? {
                                        ...p,
                                        upvotes: (p.upvotes || 0) + (p.hasUpvoted ? -1 : 1),
                                        hasUpvoted: !p.hasUpvoted,
                                      }
                                      : p
                                  )
                                );
                                upvoteHuddlePost(post.id).catch(console.warn);
                              }
                            }}
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
                            onClick={() => {
                              const willExpand = !expandedReplies[post.id];
                              setExpandedReplies((prev) => ({
                                ...prev,
                                [post.id]: willExpand,
                              }));
                              if (willExpand && isApiEnabled && !postComments[post.id]) {
                                getHuddleComments(post.id)
                                  .then((comments) => {
                                    setPostComments((prev) => ({ ...prev, [post.id]: comments }));
                                  })
                                  .catch(console.warn);
                              }
                            }}
                            className="px-3 py-1.5 rounded-xl border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all flex items-center gap-1.5 font-bold cursor-pointer"
                          >
                            <HiOutlineChatBubbleLeftRight className="h-4 w-4" />
                            <span>
                              {post.replies.length} {post.replies.length === 1 ? "Reply" : "Replies"}
                            </span>
                          </button>
                        </div>

                        {isPostAuthor(post) ? (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(post)}
                              className="text-muted-foreground hover:text-primary transition-colors px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-semibold hover:bg-primary-soft cursor-pointer"
                              title="Edit post"
                            >
                              <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            <span className="text-border">·</span>
                            <button
                              type="button"
                              onClick={() => setDeletingPostId(post.id)}
                              className="text-muted-foreground hover:text-rose-600 transition-colors px-2 py-1 rounded-lg flex items-center gap-1 text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                              title="Delete post"
                            >
                              <HiOutlineTrash className="h-3.5 w-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleOpenReportModal(post.id)}
                            className="text-muted-foreground hover:text-rose-500 transition-colors p-1.5 rounded-lg flex items-center gap-1 text-[11px] cursor-pointer"
                            title="Report inappropriate post or privacy violation"
                          >
                            <HiOutlineFlag className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Report</span>
                          </button>
                        )}
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
                                    {formatRelativeTime(reply.at)}
                                  </span>
                                </div>
                                <p className="text-xs text-foreground/90 leading-relaxed">{reply.text}</p>
                              </div>
                            </div>
                          ))}

                          {/* Inline Reply / Answer Composer */}
                          {!isVerified ? (
                            <div className="flex items-center gap-2 pt-1.5 p-2.5 rounded-xl bg-card border border-border/80 text-xs text-muted-foreground">
                              <HiOutlineLockClosed className="h-4 w-4 text-primary shrink-0" />
                              <span>Verification required to reply to peer discussions.</span>
                            </div>
                          ) : (post.type === "Question" || post.type === "question") && !isMentorCertified ? (
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1.5 p-2.5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <HiOutlineLockClosed className="h-4 w-4 text-primary shrink-0" />
                                <span>
                                  <strong className="text-foreground">Accredited Mentors Only: </strong>
                                  Only certified clinical mentors can answer questions.
                                </span>
                              </div>
                              {isMentorPending ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0">
                                  Application Under Review
                                </span>
                              ) : hasMinExperience ? (
                                <Button
                                  size="sm"
                                  type="button"
                                  onClick={handleApplyMentor}
                                  disabled={applyingMentor}
                                  className="h-6 px-2.5 text-[10px] font-bold bg-primary text-white hover:bg-primary-hover rounded-lg cursor-pointer shrink-0"
                                >
                                  Apply for Mentor Seal
                                </Button>
                              ) : null}
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
                                placeholder={post.type === "Question" ? "Answer this question as an accredited mentor..." : "Write a clinical or peer response..."}
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
                                {post.type === "Question" ? "Answer" : "Reply"}
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
                {loading ? (
                  <div className="surface p-8 text-center text-xs text-muted-foreground rounded-3xl border border-border/80">
                    <HiOutlineArrowPath className="mx-auto h-6 w-6 text-primary animate-spin" />
                    <p className="mt-2 font-semibold">Loading questions...</p>
                  </div>
                ) : visibleQuestions.length === 0 ? (
                  <div className="surface p-8 text-center text-xs text-muted-foreground rounded-3xl border border-dashed border-border/80">
                    <HiOutlineLightBulb className="mx-auto h-7 w-7 text-muted-foreground" />
                    <h4 className="font-bold text-foreground mt-2">No mentor questions yet</h4>
                    <p className="mt-1">Be the first to ask a clinical mentor about career transitions, exams, or department protocols.</p>
                  </div>
                ) : (
                  visibleQuestions.map((q) => (
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
                            {q.askerProfession || q.askerLevel}) · {formatRelativeTime(q.at)}
                          </p>
                        </div>
                        {isQuestionAuthor(q) && (
                          <button
                            type="button"
                            onClick={() => setDeletingQuestionId(q.id)}
                            className="h-8 w-8 rounded-xl border border-border/70 hover:border-rose-400 bg-card hover:bg-rose-50 dark:hover:bg-rose-950/30 text-muted-foreground hover:text-rose-600 transition-all grid place-items-center cursor-pointer shadow-2xs shrink-0"
                            title="Delete your asked question"
                          >
                            <HiOutlineTrash className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Answers from Mentors */}
                      <div className="space-y-3 pt-2">
                        {q.answers.length === 0 ? (
                          !isMentorCertified ? (
                            <div className="rounded-2xl bg-muted/40 p-3.5 text-xs text-muted-foreground flex items-center gap-2.5 border border-border/60">
                              <HiOutlineClock className="h-4 w-4 text-primary shrink-0" />
                              <span>Waiting for a verified mentor to answer. Answers are verified and public.</span>
                            </div>
                          ) : null
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
                                      <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 text-[10px] font-black uppercase">
                                        Mentor ({ans.mentorYrs ? `${ans.mentorYrs}+` : "3+"} yrs)
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                      {ans.mentorRole} · {ans.mentorSpecialty}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-[10px] text-muted-foreground shrink-0">
                                  {formatRelativeTime(ans.at)}
                                </span>
                              </div>
                              <p className="text-xs text-foreground/90 leading-relaxed sm:pl-10.5 pl-0">{ans.text}</p>
                            </div>
                          ))
                        )}

                        {/* Mentor Answer Box (Only accredited mentors can publish answers) */}
                        {userLevel === "student" ? (
                          <div className="pt-2">
                            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex items-center gap-2.5">
                              <HiOutlineAcademicCap className="h-5 w-5 text-primary shrink-0" />
                              <div>
                                <span className="font-bold text-foreground">Student &amp; Learner Priority Access: </span>
                                <span>You have priority access to ask clinical questions to verified specialists. Official answers are reserved for accredited clinical mentors (3+ years experience).</span>
                              </div>
                            </div>
                          </div>
                        ) : !isMentorCertified ? (
                          <div className="pt-2">
                            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="flex items-center gap-2.5">
                                <HiOutlineLockClosed className="h-5 w-5 text-primary shrink-0" />
                                <span>
                                  <strong className="text-foreground">Accredited Mentors Only: </strong>
                                  Only verified clinical mentors with 3+ years experience can publish answers to peer questions.
                                </span>
                              </div>
                              {isMentorPending ? (
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 shrink-0 flex items-center gap-1 self-start sm:self-auto">
                                  <HiOutlineClock className="h-3 w-3" />
                                  Mentor Application Pending Review
                                </span>
                              ) : hasMinExperience ? (
                                <Button
                                  size="sm"
                                  type="button"
                                  onClick={handleApplyMentor}
                                  disabled={applyingMentor}
                                  className="h-7 px-3 text-[11px] font-bold bg-primary text-white hover:bg-primary-hover rounded-xl cursor-pointer shrink-0 self-start sm:self-auto"
                                >
                                  Apply for Mentor Seal
                                </Button>
                              ) : null}
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
                              placeholder="Answer as an accredited clinical mentor..."
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
                  )))}
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

                  {(isMentorCertified || isHospital) && (
                    <Button
                      type="button"
                      onClick={() => setConductSessionModalOpen(true)}
                      className="rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm px-5 py-3 h-auto cursor-pointer shadow-md flex items-center gap-2 shrink-0 self-start sm:self-center"
                    >
                      <HiOutlineVideoCamera className="h-4 w-4" />
                      <span>{isHospital ? "Host CME Workshop" : "Conduct Session"}</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Sessions Grid */}
              {visibleSessions.length === 0 ? (
                <div className="surface p-12 text-center text-xs text-muted-foreground rounded-3xl border border-dashed border-border/80">
                  <HiOutlineCalendar className="mx-auto h-8 w-8 text-muted-foreground" />
                  <h4 className="font-bold text-foreground mt-2">No scheduled CME sessions right now</h4>
                  <p className="mt-1 max-w-md mx-auto">
                    {isHospital
                      ? "You are a verified healthcare facility! Host a live clinical masterclass, grand rounds, or accredited CME workshop for doctors, nurses, and students."
                      : isMentorCertified
                        ? "You are an accredited clinical mentor! Host a live clinical masterclass, case viva, or CME workshop for junior nurses, interns, and students."
                        : "Verified hospital partners and accredited mentors post live grand rounds and CME workshops regularly. Check back soon."}
                  </p>
                  {(isMentorCertified || isHospital) && (
                    <Button
                      type="button"
                      onClick={() => setConductSessionModalOpen(true)}
                      className="mt-4 rounded-2xl bg-primary hover:bg-primary-hover text-white font-bold text-xs px-5 py-2.5 h-auto cursor-pointer inline-flex items-center gap-2 shadow-xs"
                    >
                      <HiOutlineVideoCamera className="h-4 w-4" />
                      <span>{isHospital ? "Host First CME Workshop" : "Conduct First Session"}</span>
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {visibleSessions.map((session) => {
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

                            <div className="flex items-center gap-2 shrink-0">
                              {session.isHost && (
                                <span className="rounded-full bg-primary/15 text-primary border border-primary/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider">
                                  Hosted by you
                                </span>
                              )}

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

                              {session.isHost && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteSession(session.id)}
                                  title="Cancel and remove this session"
                                  className="p-1 rounded-lg text-muted-foreground hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                                >
                                  <HiOutlineTrash className="h-4 w-4" />
                                </button>
                              )}
                            </div>
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
                              {session.forRoles.map((role: string) => (
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
                            {session.isHost ? (
                              <div className="w-full h-11 sm:h-12 rounded-2xl bg-muted/60 text-muted-foreground text-xs font-bold flex items-center justify-center gap-2 border border-border/60">
                                <RiVerifiedBadgeFill className="h-4 w-4 text-primary" />
                                <span>You are hosting this session</span>
                              </div>
                            ) : (
                              <Button
                                type="button"
                                onClick={() => handleToggleBookSession(session)}
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
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
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
              {visibleMentors.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground bg-muted/10">
                  <HiOutlineSparkles className="h-5 w-5 text-primary mx-auto mb-1.5" />
                  <p className="font-semibold text-foreground">Verified Clinical Faculty</p>
                  <p className="text-[11px] mt-0.5">Senior specialists and department heads verify community answers.</p>
                </div>
              ) : (
                visibleMentors.map((mentor) => (
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
                ))
              )}
            </div>

            {/* Become a Mentor Callout (Dynamic clinical experience check & admin review workflow) */}
            {userLevel !== "student" && !isHospital && (
              <div className="rounded-3xl bg-card p-4 sm:p-5 border border-border/80 text-xs shadow-xs space-y-3.5 mb-10 lg:mb-0">
                {isMentorCertified ? (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                        <RiVerifiedBadgeFill className="h-4 w-4 text-primary shrink-0" />
                        Certified FALE Mentor
                      </span>
                      <span className="rounded-full bg-primary-soft text-primary border border-primary/20 text-[10px] font-black px-2.5 py-0.5 whitespace-nowrap">
                        Seal Active
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Your clinical credentials have been verified by FALE Admin. You are accredited to mentor junior clinicians, answer peer AMA queries, and host CME sessions.
                    </p>
                  </div>
                ) : isMentorPending ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-foreground block">Become a FALE Mentor</span>
                      <span className="rounded-full bg-primary-soft text-primary border border-primary/20 text-[10px] font-black px-2.5 py-0.5 flex items-center gap-1 whitespace-nowrap">
                        <HiOutlineClock className="h-3 w-3" />
                        Under Review
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Your mentor application and clinical credentials ({candidateExpYears}+ yrs) are undergoing audit at the FALE Moderation Desk. You will receive your verified seal upon admin review.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      disabled
                      className="w-full text-xs font-bold h-10 rounded-xl border-primary/30 text-primary bg-primary-soft/30 cursor-not-allowed"
                    >
                      Application Under Review
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="font-extrabold text-sm text-foreground block">Become a FALE Mentor</span>
                      <span
                        className={cn(
                          "rounded-full text-[10px] font-black px-2.5 py-0.5 border whitespace-nowrap shrink-0",
                          hasMinExperience
                            ? "bg-primary-soft text-primary border-primary/25"
                            : "bg-muted text-muted-foreground border-border/70"
                        )}
                      >
                        {candidateExpYears} {candidateExpYears === 1 ? "yr" : "yrs"} clinical exp
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs leading-relaxed">
                      Are you a healthcare practitioner with 3+ years of clinical experience? Help guide junior nurses,
                      interns, and students.
                    </p>
                    {!hasMinExperience && (
                      <div className="text-xs font-medium text-foreground bg-primary-soft/40 dark:bg-primary-soft/20 rounded-xl p-3 border border-primary/20 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                          <HiOutlineInformationCircle className="h-4 w-4 shrink-0 text-primary" />
                          <span>Experience Requirement</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground leading-relaxed">
                          Requires 3+ years of clinical experience to apply. (Your profile has {candidateExpYears} {candidateExpYears === 1 ? "year" : "years"}).
                        </p>
                      </div>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!hasMinExperience || applyingMentor}
                      onClick={handleApplyMentor}
                      className={cn(
                        "w-full text-xs font-bold h-10 rounded-xl transition-all",
                        hasMinExperience
                          ? "bg-primary hover:bg-primary-hover text-white shadow-xs cursor-pointer border-transparent"
                          : "border-border/80 text-muted-foreground bg-muted/40 cursor-not-allowed opacity-70"
                      )}
                    >
                      {applyingMentor ? "Submitting Application..." : hasMinExperience ? "Apply for Mentor Seal" : "Requires 3+ Yrs Clinical Experience"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Hospital Institutional Outreach & CME Card */}
            {isHospital && (
              <div className="rounded-2xl bg-primary/5 p-4 border border-primary/20 text-xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground flex items-center gap-1.5 text-xs">
                    <RiHospitalLine className="h-4 w-4 text-primary shrink-0" />
                    Hospital CME &amp; Outreach
                  </span>
                  <span className="rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px] font-bold px-2 py-0.5">
                    Institution
                  </span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  Connect with thousands of verified doctors, nurses, and clinicians across Karnataka. Announce new clinical facilities, grand rounds, and accredited CME workshops.
                </p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setConductSessionModalOpen(true)}
                  className="w-full text-xs font-bold h-8.5 rounded-xl bg-primary hover:bg-primary-hover text-white flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <HiOutlineVideoCamera className="h-3.5 w-3.5" />
                  <span>Host CME Workshop</span>
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

      {/* Conduct Clinical Session / CME Modal */}
      <Dialog open={conductSessionModalOpen} onOpenChange={setConductSessionModalOpen}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-7 bg-card border border-border shadow-2xl">
          <DialogHeader className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold uppercase w-fit">
              {isHospital ? <RiHospitalLine className="h-3.5 w-3.5" /> : <RiStethoscopeLine className="h-3.5 w-3.5" />}
              <span>{isHospital ? "Hospital CME & Workshop Portal" : "Clinical Mentor Portal"}</span>
            </div>
            <DialogTitle className="text-xl sm:text-[22px] font-extrabold text-foreground tracking-tight">
              {isHospital ? "Host Hospital CME or Clinical Workshop" : "Conduct a Clinical Mentorship Session / CME"}
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
              {isHospital
                ? "Schedule an official hospital CME, clinical grand rounds, or department masterclass for doctors, nurses, and healthcare clinicians."
                : "Host an interactive masterclass, grand rounds, or case viva for junior healthcare professionals, interns, and nursing students."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleConductSession} className="space-y-5 pt-3">
            {/* Session Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Session Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="e.g. ICU Ventilator & Weaning Protocols Masterclass"
                required
                className="w-full h-11 rounded-2xl bg-muted/40 border border-border/80 px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>

            {/* Category & Seat Capacity Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Category <span className="text-destructive">*</span>
                </label>
                <Select value={sessionCategory} onValueChange={setSessionCategory}>
                  <SelectTrigger className="w-full h-11 rounded-2xl bg-muted/40 border-border/80 px-3.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-popover text-foreground shadow-xl z-[150]">
                    <SelectItem value="Mentorship Workshop">Mentorship Workshop</SelectItem>
                    <SelectItem value="Clinical Masterclass">Clinical Masterclass</SelectItem>
                    <SelectItem value="CME & Workshop">CME &amp; Workshop</SelectItem>
                    <SelectItem value="Interview Masterclass">Interview Masterclass</SelectItem>
                    <SelectItem value="Case Viva Practice">Case Viva Practice</SelectItem>
                    <SelectItem value="Clinical Talk">Clinical Talk</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Seat Capacity <span className="text-destructive">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={5}
                    max={500}
                    value={sessionSeats}
                    onChange={(e) => setSessionSeats(Number(e.target.value))}
                    className="w-full h-11 rounded-2xl bg-muted/40 border border-border/80 px-3.5 pl-9 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
                  />
                  <HiOutlineUserGroup className="h-4 w-4 text-muted-foreground absolute left-3 top-3.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Date & Time (Custom Calendar + Custom Time Select) & Platform Mode Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Date &amp; Time <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Custom Date Popover */}
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className={cn(
                          "w-full h-11 justify-start text-left font-normal rounded-2xl bg-muted/40 border-border/80 hover:bg-muted/60 px-3 text-xs text-foreground shadow-none cursor-pointer",
                          !sessionDate && "text-muted-foreground"
                        )}
                      >
                        <HiOutlineCalendar className="mr-1.5 h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">
                          {sessionDate ? (
                            sessionDate.toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                            })
                          ) : (
                            "Select Date"
                          )}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 rounded-2xl border-border bg-card shadow-2xl z-[150]" align="start">
                      <Calendar
                        mode="single"
                        selected={sessionDate}
                        onSelect={(d) => {
                          if (d) setSessionDate(d);
                          setDatePickerOpen(false);
                        }}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>

                  {/* Custom Time Select */}
                  <Select value={sessionTime} onValueChange={setSessionTime}>
                    <SelectTrigger className="w-full h-11 rounded-2xl bg-muted/40 border-border/80 px-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer">
                      <div className="flex items-center gap-1.5 truncate">
                        <HiOutlineClock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <SelectValue placeholder="Time" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border bg-popover text-foreground shadow-xl z-[150] max-h-56">
                      {sessionTimeSlots.map((time) => (
                        <SelectItem key={time} value={time} className="text-xs">
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Platform / Mode <span className="text-destructive">*</span>
                </label>
                <Select value={sessionWhere} onValueChange={setSessionWhere}>
                  <SelectTrigger className="w-full h-11 rounded-2xl bg-muted/40 border-border/80 px-3.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer">
                    <div className="flex items-center gap-2 truncate">
                      {sessionWhere.toLowerCase().includes("meet") ||
                        sessionWhere.toLowerCase().includes("zoom") ||
                        sessionWhere.toLowerCase().includes("stream") ? (
                        <HiOutlineVideoCamera className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <HiOutlineMapPin className="h-4 w-4 text-primary shrink-0" />
                      )}
                      <SelectValue placeholder="Select Platform" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border bg-popover text-foreground shadow-xl z-[150]">
                    <SelectItem value="Live Interactive (Google Meet)">Live Interactive (Google Meet)</SelectItem>
                    <SelectItem value="Live Clinical Stream (Zoom)">Live Clinical Stream (Zoom)</SelectItem>
                    <SelectItem value="FALE Live Clinical Classroom">FALE Live Clinical Classroom</SelectItem>
                    <SelectItem value="Hospital Auditorium / Campus">Hospital Auditorium / Campus</SelectItem>
                    <SelectItem value="Clinical Skills Lab (On-site)">Clinical Skills Lab (On-site)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                Target Audience <span className="text-[11px] font-normal text-muted-foreground">(Select one or more)</span>
              </label>
              <div className="flex flex-wrap gap-2 pt-0.5">
                {["Nursing", "Doctors", "Physiotherapy", "Lab Technicians", "Interns & Students"].map((role) => {
                  const isSelected = sessionRoles.includes(role);
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => {
                        setSessionRoles((prev) =>
                          isSelected ? prev.filter((r) => r !== role) : [...prev, role]
                        );
                      }}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer select-none",
                        isSelected
                          ? "bg-primary text-white border-primary shadow-2xs font-bold"
                          : "bg-muted/40 text-muted-foreground border-border/80 hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      {role}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Learning Agenda & Overview */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Learning Agenda &amp; Overview
              </label>
              <textarea
                rows={3}
                value={sessionDescription}
                onChange={(e) => setSessionDescription(e.target.value)}
                placeholder="What will attendees learn? Real mock scenario breakdown, clinical viva tips, protocols..."
                className="w-full rounded-2xl bg-muted/40 border border-border/80 p-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none leading-relaxed transition-all"
              />
            </div>

            <DialogFooter className="pt-4 border-t border-border/60 flex flex-row items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setConductSessionModalOpen(false)}
                className="h-10 px-5 rounded-2xl border-border text-xs font-semibold hover:bg-muted/60 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isConductingSession}
                className="h-10 px-6 rounded-2xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-md shadow-primary/20 cursor-pointer transition-all"
              >
                {isConductingSession ? "Publishing..." : "Publish Session"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= EDIT POST MODAL ================= */}
      <Dialog open={Boolean(editingPost)} onOpenChange={(open) => !open && setEditingPost(null)}>
        <DialogContent className="sm:max-w-lg rounded-3xl p-0 flex flex-col max-h-[90vh] overflow-hidden bg-card border border-border/80 shadow-2xl">
          <DialogHeader className="p-5 sm:p-6 pb-3.5 border-b border-border/60 shrink-0 text-left space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-[#FFF4EC] dark:bg-card text-primary border border-primary/25 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                <HiOutlinePencilSquare className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-extrabold text-foreground tracking-tight">
                  Edit Discussion Post
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Update your clinical insight, case presentation, or question. Safety rules apply.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
            {/* Type & Field Select Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Post Category</label>
                <Select value={editPostType} onValueChange={(val) => setEditPostType(val as HuddlePostType)}>
                  <SelectTrigger className="w-full h-10 rounded-xl bg-muted/40 border-border/80 px-3 text-xs text-foreground focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover text-foreground shadow-xl z-[150]">
                    <SelectItem value="Thought">Thought</SelectItem>
                    <SelectItem value="Experience">Experience</SelectItem>
                    <SelectItem value="Case">Clinical Case</SelectItem>
                    <SelectItem value="Question">Question</SelectItem>
                    <SelectItem value="Event">Event</SelectItem>
                    <SelectItem value="Update">Update</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Clinical Department</label>
                <Select value={editPostField} onValueChange={(val) => setEditPostField(val as HuddleField)}>
                  <SelectTrigger className="w-full h-10 rounded-xl bg-muted/40 border-border/80 px-3 text-xs text-foreground focus:ring-1 focus:ring-primary focus:border-primary cursor-pointer">
                    <SelectValue placeholder="Field" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-border bg-popover text-foreground shadow-xl z-[150]">
                    <SelectItem value="Medicine">Medicine & Doctors</SelectItem>
                    <SelectItem value="Nursing">Nursing</SelectItem>
                    <SelectItem value="Physio">Physiotherapy</SelectItem>
                    <SelectItem value="Lab">Lab Technicians</SelectItem>
                    <SelectItem value="Radiology">Radiology</SelectItem>
                    <SelectItem value="Pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="All">All Specialties</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Post Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Content <span className="text-destructive">*</span>
              </label>
              <textarea
                rows={4}
                value={editPostText}
                onChange={(e) => setEditPostText(e.target.value)}
                placeholder="Share your clinical insight, case question, or ward experience..."
                className="w-full rounded-2xl bg-muted/40 border border-border/80 p-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary resize-none leading-relaxed transition-all"
              />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                <span className="flex items-center gap-1 text-[11px] text-primary">
                  <HiOutlineShieldCheck className="h-3.5 w-3.5 shrink-0" />
                  Protected by Automated PHI & HIPAA Filters
                </span>
                <span>{editPostText.length} chars</span>
              </div>
            </div>

            {/* Attached Image Section */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Attached Photo / Diagram</label>
              {editPostImage ? (
                <div className="relative inline-block rounded-2xl overflow-hidden border border-border bg-muted/20">
                  <img
                    src={editPostImage}
                    alt="Attachment preview"
                    className="max-h-48 w-auto max-w-full object-contain rounded-xl"
                  />
                  <button
                    type="button"
                    onClick={() => setEditPostImage(null)}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-full cursor-pointer transition-colors"
                    title="Remove image"
                  >
                    <HiOutlineXMark className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <input
                    type="file"
                    ref={editFileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          const base64 = ev.target?.result as string;
                          setEditPostImage(base64);
                          toast.info("Image attached. De-identification check applies.");
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => editFileInputRef.current?.click()}
                    className="rounded-xl border-dashed border-border/80 text-xs font-semibold text-muted-foreground hover:text-foreground h-9"
                  >
                    <HiOutlinePhoto className="mr-1.5 h-4 w-4 text-primary" />
                    Attach Clinical Diagram / Photo
                  </Button>
                </div>
              )}
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="edit-post-anon"
                checked={editPostAnon}
                onChange={(e) => setEditPostAnon(e.target.checked)}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary accent-primary cursor-pointer"
              />
              <label htmlFor="edit-post-anon" className="text-xs text-foreground cursor-pointer select-none">
                Post anonymously (displays as <strong>Verified Clinician</strong>)
              </label>
            </div>
          </div>

          <DialogFooter className="p-4 sm:p-5 pt-3 border-t border-border/60 shrink-0 flex-row items-center justify-end gap-2.5 bg-card/95">
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditingPost(null)}
              className="h-10 px-5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-foreground text-xs font-semibold cursor-pointer transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSavePostEdit}
              disabled={isSubmittingEdit || !editPostText.trim()}
              className="h-10 px-5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold shadow-xs hover:shadow-md cursor-pointer transition-all"
            >
              {isSubmittingEdit ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= DELETE POST CONFIRMATION MODAL ================= */}
      <Dialog open={Boolean(deletingPostId)} onOpenChange={(open) => !open && setDeletingPostId(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-5 sm:p-6 bg-card border border-border/80 shadow-2xl space-y-4">
          <DialogHeader className="text-left space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center font-bold shadow-2xs">
              <HiOutlineTrash className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight">
              Delete Discussion Post
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete this discussion post? It will be permanently removed from the Huddle community feed.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-border/60 flex-row items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingPostId(null)}
              className="h-10 px-5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-foreground text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDeletePost}
              disabled={isDeletingPost}
              className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              {isDeletingPost ? "Deleting..." : "Delete Post"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ================= DELETE QUESTION CONFIRMATION MODAL ================= */}
      <Dialog open={Boolean(deletingQuestionId)} onOpenChange={(open) => !open && setDeletingQuestionId(null)}>
        <DialogContent className="sm:max-w-md rounded-3xl p-5 sm:p-6 bg-card border border-border/80 shadow-2xl space-y-4">
          <DialogHeader className="text-left space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900/40 flex items-center justify-center font-bold shadow-2xs">
              <HiOutlineTrash className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-extrabold text-foreground tracking-tight">
              Delete Asked Question
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete your question? Any verified mentor answers associated with it will also be deleted.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="pt-3 border-t border-border/60 flex-row items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingQuestionId(null)}
              className="h-10 px-5 rounded-xl border border-border/80 bg-muted/40 hover:bg-muted text-foreground text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDeleteQuestion}
              disabled={isDeletingQuestion}
              className="h-10 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer transition-all"
            >
              {isDeletingQuestion ? "Deleting..." : "Delete Question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
