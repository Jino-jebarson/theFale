import { useSyncExternalStore } from "react";
import { isApiEnabled } from "./api";
import {
  type HuddlePost,
  type HuddleQuestion,
  type HuddleSession,
  initialHuddlePosts,
  initialHuddleQuestions,
  initialHuddleSessions,
} from "./data";

export type Portal = "candidate" | "facility" | "admin";

export interface CandidateKYCDocument {
  id?: string;
  documentType: string;
  originalFileName: string;
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType?: string;
  verified?: boolean;
  createdAt?: string;
}

export interface CandidateKYCItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  profession: string;
  qualification: string;
  council: string;
  regNumber: string;
  state: string;
  docName: string;
  status: "pending" | "verified" | "rejected";
  submittedDate: string;
  notes?: string;
  experience: string;
  gender?: string;
  dob?: string;
  city?: string;
  pincode?: string;
  addressLine?: string;
  candidateLevel?: string;
  isStudent?: boolean;
  course?: string;
  college?: string;
  studyYear?: string;
  universityRegNo?: string;
  expectedGraduationYear?: number;
  specialty?: string;
  subSpecialties?: string[];
  councilState?: string;
  regYear?: string;
  bio?: string;
  skills?: string[];
  languages?: string[];
  preferredCities?: string[];
  openToWork?: boolean;
  relocate?: boolean;
  noticePeriod?: string;
  employmentType?: string;
  availability?: string;
  currentSalary?: string;
  expectedSalaryMinPaise?: number;
  expectedSalaryMaxPaise?: number;
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  userId?: string;
  documents?: CandidateKYCDocument[];
  avatar?: string;
}

export interface FacilityKYCItem {
  id: string;
  userId?: string;
  name: string;
  type: string;
  size?: string;
  about?: string;
  website?: string;
  city: string;
  state: string;
  pincode?: string;
  addressLine?: string;
  beds: number;
  icuBeds?: number;
  licenseNumber: string;
  gst?: string;
  nabhNumber: string;
  accreditation: string;
  accreditationLevel?: string;
  contactPerson: string;
  designation?: string;
  contactPhone: string;
  contactEmail?: string;
  departments?: string[];
  hiringNeeds?: string[];
  logoUrl?: string;
  facilityPhotos?: string[];
  docName: string;
  status: "pending" | "verified" | "rejected";
  submittedDate: string;
  notes?: string;
  documents?: any[];
  verifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminJobApproval {
  id: string;
  facilityId?: string;
  title: string;
  org: string;
  type: "job" | "shift";
  dept: string;
  city: string;
  compensation: string;
  expOrHours: string;
  status: "pending" | "approved" | "rejected";
  submittedDate: string;
  openings: number;
  postedBy: string;
  urgent?: boolean;
  description?: string;
  experienceRequired?: string;
  qualificationRequired?: string;
  employmentType?: string;
  internship?: boolean;
  notes?: string;
  salaryMin?: number;
  salaryMax?: number;
  hours?: number;
  startAt?: string;
  endAt?: string;
  ratePerHourPaise?: number;
  surgeRatePerHourPaise?: number;
  surgeLabel?: string;
  totalPayPaise?: number;
  slotsClaimed?: number;
  dutyNotes?: string;
  rawShift?: any;
}

export interface AdminApplication {
  id: string;
  candidateId?: string;
  candidateName: string;
  candidateRole: string;
  candidateCity: string;
  candidateState?: string;
  candidateQualification?: string;
  candidateCouncil?: string;
  candidateBio?: string;
  jobId: string;
  jobTitle: string;
  hospitalName: string;
  department?: string;
  matchScore: number;
  councilVerified: boolean;
  regNumber: string;
  exp: string;
  status: "pending_admin" | "shortlisted" | "rejected";
  appliedDate: string;
  summary: string;
  phone: string;
  email: string;
  expectedSalary?: string;
  noticePeriod?: string;
  documents?: Array<{
    id: string;
    documentType: string;
    originalFileName: string;
    fileUrl: string;
    fileSizeBytes: number;
    mimeType: string;
    verified: boolean;
    createdAt?: string;
  }>;
  type?: "job" | "shift";
  shiftClaimId?: string;
  hours?: number;
  startAt?: string;
  endAt?: string;
  grossAmountPaise?: number;
  netAmountPaise?: number;
  payoutStatus?: string;
}

export interface WalletTransaction {
  id: string;
  type: "topup" | "escrow_hold" | "disbursement" | "credit_purchase" | "standby_credit" | "refund";
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  status: "Completed" | "In Escrow" | "Processing" | "Refunded";
  refNumber: string;
  invoiceId?: string | undefined;
  utr?: string | undefined;
}

export interface HospitalBankAccount {
  bankName: string;
  accountNumber: string;
  ifsc: string;
  accountType: "Current" | "Escrow Sub-Account";
  accountHolderName: string;
  branch: string;
  status: "Verified" | "Pending Penny Drop" | "Under Review";
  documentName?: string;
  documentDate?: string;
  verifiedAt?: string;
}

export interface CandidatePayoutMethod {
  type: "upi" | "bank";
  upiId?: string | undefined;
  accountNumber?: string | undefined;
  confirmAccountNumber?: string | undefined;
  ifsc?: string | undefined;
  bankName?: string | undefined;
  accountNumberLast4?: string | undefined;
  accountHolderName: string;
  status: "Verified" | "Pending";
  verifiedAt?: string;
}

export interface CandidatePayoutTransaction {
  id: string;
  shiftId: string;
  shiftTitle: string;
  hospitalName: string;
  dept: string;
  shiftDate: string;
  hours: number;
  rate: number;
  amount: number;
  payoutDate: string;
  status: "Disbursed" | "In Escrow (24h SLA)" | "Under Review";
  payoutMethodUsed: string;
  utr?: string;
  slipRef?: string;
}

export interface AppState {
  portal: Portal;
  contact: string;
  signedIn: boolean;
  onboarded: boolean;
  profile: Record<string, string | boolean>;
  docs: Record<string, string>;
  saved: string[];
  applied: { jobId: string; status: string; date: string }[];
  shiftApps: string[];
  courses: string[];
  postedJobs: { id: string; title: string; dept: string; openings: number; status: string }[];
  postedShifts?: {
    id: string;
    title: string;
    org: string;
    city: string;
    date: string;
    time: string;
    hours: number;
    rate: number;
    dept: string;
    urgent?: boolean;
    surge?: string;
    perks?: string[];
    verified?: boolean;
    openings?: number;
    status: string;
  }[];
  candidateCredits: number;
  unlockedCandidates: string[];
  candidateKYC: CandidateKYCItem[];
  facilityKYC: FacilityKYCItem[];
  jobApprovals: AdminJobApproval[];
  adminApplications: AdminApplication[];
  escrowBalance?: number;
  lockedEscrow?: number;
  walletTransactions?: WalletTransaction[];
  hospitalBankAccount?: HospitalBankAccount;
  candidateLevel?: "student" | "fresher" | "professional";
  huddlePosts: HuddlePost[];
  huddleQuestions: HuddleQuestion[];
  huddleSessions: HuddleSession[];
  candidatePayoutMethod?: CandidatePayoutMethod | undefined;
  candidatePayouts?: CandidatePayoutTransaction[];
  unreadNotificationCount?: number;
}

const KEY = "fale-pro-v2";


const initialEmptyState: AppState = {
  portal: "candidate",
  contact: "",
  signedIn: false,
  onboarded: false,
  unreadNotificationCount: 0,
  huddlePosts: [],
  huddleQuestions: [],
  huddleSessions: [],
  profile: {
    facilityType: "Multispecialty Hospital",
  },
  docs: {},
  saved: [],
  applied: [],
  shiftApps: [],
  courses: [],
  postedJobs: [],
  postedShifts: [],
  candidateCredits: 0,
  unlockedCandidates: [],
  candidateKYC: [],
  facilityKYC: [],
  jobApprovals: [],
  adminApplications: [],
  escrowBalance: 0,
  lockedEscrow: 0,
  walletTransactions: [],
  hospitalBankAccount: undefined,
  candidatePayoutMethod: undefined,
  candidatePayouts: [],
};

const initial: AppState = initialEmptyState;

if (typeof window !== "undefined") {
  try {
    localStorage.removeItem(KEY);
  } catch { }
}

let state: AppState = initial;
let loaded = false;
const listeners = new Set<() => void>();


function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  // Never restore the retired demo store. Keep preferences in their own keys.
  try { localStorage.removeItem(KEY); } catch { /* Storage may be disabled. */ }
}

if (typeof window !== "undefined") {
  window.addEventListener("fale:auth-expired", () => {
    resetState();
  });
}

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  load();
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  try {
    { localStorage.removeItem(KEY); }
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function resetState() {
  state = initialEmptyState;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useApp(): AppState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => {
      load();
      return state;
    },
    () => initial,
  );
}

export function setUnreadNotificationCount(count: number) {
  setState({ unreadNotificationCount: Math.max(0, count) });
}

// ──────────────────────────────────────────────────────────────────────
// HUDDLE COMMUNITY ACTIONS
// ──────────────────────────────────────────────────────────────────────

export function toggleHelpfulPost(postId: string) {
  setState((prev) => ({
    huddlePosts: prev.huddlePosts.map((p) => {
      if (p.id !== postId) return p;
      const isHelpful = !p.userHelpful;
      return {
        ...p,
        userHelpful: isHelpful,
        helpfulCount: isHelpful ? p.helpfulCount + 1 : Math.max(0, p.helpfulCount - 1),
      };
    }),
  }));
}

export function addHuddlePost(postData: {
  type: HuddlePost["type"];
  field: HuddlePost["field"];
  authorName: string;
  authorRole: string;
  authorLevel?: "student" | "fresher" | "professional" | "hospital" | undefined;
  anon: boolean;
  text: string;
  image?: string | undefined;
  audioUrl?: string | undefined;
  audioDuration?: number | undefined;
  isHospital?: boolean | undefined;
}) {
  const isAnonymous = Boolean(postData.anon && !postData.isHospital);
  const newPost: HuddlePost = {
    id: `hp-${Date.now()}`,
    type: postData.type,
    field: postData.field,
    authorId: "current-user",
    authorName: isAnonymous ? "Anonymous Clinician" : postData.authorName,
    authorShort: isAnonymous ? "Anonymous" : postData.authorName
      .split(" ")
      .map((w, i) => (i === 0 ? w : w[0] + "."))
      .join(" "),
    authorRole: isAnonymous ? "Verified Clinician" : postData.authorRole,
    authorLevel: postData.authorLevel || "professional",
    anon: isAnonymous,
    text: postData.text,
    helpfulCount: 0,
    userHelpful: false,
    replies: [],
    reports: [],
    // Clinical Cases or attached images undergo FALE Admin Review first
    status: postData.type === "Case" || Boolean(postData.image) ? "review" : "live",
    at: "Just now",
    image: postData.image,
    audioUrl: postData.audioUrl,
    audioDuration: postData.audioDuration,
    isHospital: postData.isHospital,
  };

  setState((prev) => ({
    huddlePosts: [newPost, ...prev.huddlePosts],
  }));

  return newPost;
}

export function addHuddleReply(
  postId: string,
  replyData: {
    authorName: string;
    authorRole: string;
    text: string;
    authorLevel?: "student" | "fresher" | "professional";
  }
) {
  const newReply = {
    id: `hr-${Date.now()}`,
    authorId: "current-user",
    authorName: replyData.authorName,
    authorShort: replyData.authorName
      .split(" ")
      .map((w, i) => (i === 0 ? w : w[0] + "."))
      .join(" "),
    authorRole: replyData.authorRole,
    authorLevel: replyData.authorLevel || "professional",
    text: replyData.text,
    at: "Just now",
    helpfulCount: 0,
  };

  setState((prev) => ({
    huddlePosts: prev.huddlePosts.map((p) =>
      p.id === postId ? { ...p, replies: [...p.replies, newReply] } : p
    ),
  }));
}

export function reportHuddlePost(postId: string, reason?: string) {
  setState((prev) => ({
    huddlePosts: prev.huddlePosts.map((p) =>
      p.id === postId
        ? {
          ...p,
          reports: [...p.reports, reason ? `current-user: ${reason}` : "current-user"],
          status: "hidden" as const, // Automatically hidden from community view and flagged to admin
        }
        : p
    ),
  }));
}

export function updateHuddlePost(
  postId: string,
  updatedData: {
    type?: HuddlePost["type"];
    field?: HuddlePost["field"];
    text?: string;
    image?: string | null;
    anon?: boolean;
  }
) {
  setState((prev) => ({
    huddlePosts: (prev.huddlePosts || []).map((p) => {
      if (p.id !== postId) return p;
      return {
        ...p,
        ...(updatedData.type ? { type: updatedData.type } : {}),
        ...(updatedData.field ? { field: updatedData.field } : {}),
        ...(updatedData.text != null ? { text: updatedData.text } : {}),
        ...(updatedData.image !== undefined ? { image: updatedData.image || undefined } : {}),
        ...(updatedData.anon !== undefined ? { anon: updatedData.anon } : {}),
      };
    }),
  }));
}

export function deleteHuddleQuestion(questionId: string) {
  setState((prev) => ({
    huddleQuestions: (prev.huddleQuestions || []).filter((q) => q.id !== questionId),
  }));
}

export function askMentorQuestion(questionData: {
  topic: HuddleQuestion["topic"];
  askerName: string;
  askerLevel: HuddleQuestion["askerLevel"];
  askerProfession: string;
  text: string;
}) {
  const newQuestion: HuddleQuestion = {
    id: `hq-${Date.now()}`,
    topic: questionData.topic,
    askerId: "current-user",
    askerName: questionData.askerName,
    askerShort: questionData.askerName
      .split(" ")
      .map((w, i) => (i === 0 ? w : w[0] + "."))
      .join(" "),
    askerLevel: questionData.askerLevel,
    askerProfession: questionData.askerProfession,
    text: questionData.text,
    answers: [],
    at: "Just now",
  };

  setState((prev) => ({
    huddleQuestions: [newQuestion, ...prev.huddleQuestions],
  }));

  return newQuestion;
}

export function answerMentorQuestion(
  questionId: string,
  answerData: {
    mentorName: string;
    mentorRole: string;
    mentorYrs: number;
    mentorSpecialty: string;
    text: string;
  }
) {
  const newAnswer = {
    id: `ha-${Date.now()}`,
    mentorId: "current-user",
    mentorName: answerData.mentorName,
    mentorShort: answerData.mentorName
      .split(" ")
      .map((w, i) => (i === 0 ? w : w[0] + "."))
      .join(" "),
    mentorRole: answerData.mentorRole,
    mentorYrs: answerData.mentorYrs,
    mentorSpecialty: answerData.mentorSpecialty,
    text: answerData.text,
    at: "Just now",
  };

  setState((prev) => ({
    huddleQuestions: prev.huddleQuestions.map((q) =>
      q.id === questionId ? { ...q, answers: [...q.answers, newAnswer] } : q
    ),
  }));
}

export function toggleBookSession(sessionId: string) {
  setState((prev) => ({
    huddleSessions: prev.huddleSessions.map((s) => {
      if (s.id !== sessionId) return s;
      const isCurrentlyBooked = Boolean(s.isBooked);
      return {
        ...s,
        isBooked: !isCurrentlyBooked,
        bookedCount: isCurrentlyBooked
          ? Math.max(0, s.bookedCount - 1)
          : Math.min(s.seats, s.bookedCount + 1),
      };
    }),
  }));
}

export function approveHuddlePost(postId: string) {
  setState((prev) => ({
    huddlePosts: prev.huddlePosts.map((p) =>
      p.id === postId ? { ...p, status: "live" as const, reports: [] } : p
    ),
  }));
}

export function rejectHuddlePost(postId: string) {
  setState((prev) => ({
    huddlePosts: prev.huddlePosts.filter((p) => p.id !== postId),
  }));
}

export function dismissHuddleReport(postId: string) {
  setState((prev) => ({
    huddlePosts: prev.huddlePosts.map((p) =>
      p.id === postId ? { ...p, status: "live" as const, reports: [] } : p
    ),
  }));
}

export function deleteHuddlePost(postId: string) {
  setState((prev) => ({
    huddlePosts: prev.huddlePosts.filter((p) => p.id !== postId),
  }));
}

export function warnHuddleAuthor(postId: string, warningReason: string) {
  setState((prev) => ({
    huddlePosts: prev.huddlePosts.map((p) =>
      p.id === postId ? { ...p, warningIssued: warningReason } : p
    ),
  }));
}

export function togglePostPinned(postId: string) {
  setState((prev) => ({
    huddlePosts: prev.huddlePosts.map((p) =>
      p.id === postId ? { ...p, pinned: !p.pinned } : p
    ),
  }));
}
