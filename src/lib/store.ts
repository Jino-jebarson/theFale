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
  invoiceId?: string;
  utr?: string;
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
  upiId?: string;
  accountNumber?: string;
  confirmAccountNumber?: string;
  ifsc?: string;
  bankName?: string;
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
  candidatePayoutMethod?: CandidatePayoutMethod;
  candidatePayouts?: CandidatePayoutTransaction[];
  unreadNotificationCount?: number;
}

const KEY = "fale-pro-v2";
const initialMockState: AppState = {
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
  applied: [
    { jobId: "j2", status: "Interview", date: "12 Oct 2026" },
    { jobId: "j4", status: "Under review", date: "09 Oct 2026" },
  ],
  shiftApps: [],
  courses: [],
  postedJobs: [
    { id: "p1", title: "Staff Nurse — ICU", dept: "Critical care", openings: 4, status: "Open" },
    { id: "p2", title: "Lab Technician", dept: "Pathology", openings: 2, status: "Open" },
    { id: "p3", title: "Front Office Executive", dept: "Operations", openings: 1, status: "Draft" },
  ],
  postedShifts: [
    {
      id: "ps1",
      title: "ICU Night Staff Nurse",
      org: "Manipal Hospital",
      city: "Bengaluru",
      date: "Tonight · 20:00 – 08:00",
      time: "20:00 – 08:00",
      hours: 12,
      rate: 450,
      dept: "Critical care",
      urgent: true,
      surge: "+₹50/hr Night Surge",
      perks: ["Dinner provided", "Cab drop"],
      verified: true,
      openings: 2,
      status: "Open",
    },
  ],
  candidateCredits: 0,
  unlockedCandidates: [],
  escrowBalance: 48500,
  lockedEscrow: 7200,
  walletTransactions: [
    {
      id: "tx-101",
      type: "disbursement",
      title: "24-hr Locum Duty Payout",
      subtitle: "Nurse Preethi Nair (ICU Night Cover) · Counter-signed",
      amount: -3600,
      date: "Today · 09:30 AM",
      status: "Completed",
      refNumber: "FALE-LOC-9942",
      invoiceId: "INV-2026-1049",
      utr: "UTRIB2026103009412",
    },
    {
      id: "tx-102",
      type: "escrow_hold",
      title: "Shift Escrow Allocation",
      subtitle: "2x ICU Night Staff Nurse (Tonight) · Locked in Nodal Escrow",
      amount: -7200,
      date: "Today · 08:15 AM",
      status: "In Escrow",
      refNumber: "FALE-ESC-4820",
    },
    {
      id: "tx-103",
      type: "topup",
      title: "Escrow Reserve Top-up",
      subtitle: "HDFC Corporate NetBanking · Auto-Escrow Replenish",
      amount: 50000,
      date: "28 Oct 2026 · 04:20 PM",
      status: "Completed",
      refNumber: "TXN-HDFC-99124",
      invoiceId: "INV-2026-1038",
      utr: "HDFCR52026102800192",
    },
    {
      id: "tx-104",
      type: "credit_purchase",
      title: "Candidate Sourcing Credits (Starter Pack)",
      subtitle: "10 Verified Candidate Contact Unlocks",
      amount: -1999,
      date: "25 Oct 2026 · 02:10 PM",
      status: "Completed",
      refNumber: "CRD-FALE-7721",
      invoiceId: "INV-2026-1012",
    },
    {
      id: "tx-105",
      type: "disbursement",
      title: "24-hr Locum Duty Payout",
      subtitle: "Dr. Rajesh K (Emergency Trauma Cover) · Verified",
      amount: -6800,
      date: "23 Oct 2026 · 11:00 AM",
      status: "Completed",
      refNumber: "FALE-LOC-9811",
      invoiceId: "INV-2026-0994",
      utr: "UTRIB2026102300844",
    },
    {
      id: "tx-106",
      type: "standby_credit",
      title: "Clinician Standby Cancellation Refund",
      subtitle: "Emergency Dept Shift Re-credit",
      amount: 1800,
      date: "20 Oct 2026 · 06:45 PM",
      status: "Completed",
      refNumber: "FALE-STB-0144",
    },
  ],
  hospitalBankAccount: undefined,
  candidatePayoutMethod: undefined,
  candidatePayouts: [
    {
      id: "pay-101",
      shiftId: "sh-882",
      shiftTitle: "Emergency Triage Duty Medical Officer",
      hospitalName: "Apollo Health City",
      dept: "Emergency & Trauma",
      shiftDate: "Tonight · 20:00 – 08:00",
      hours: 12,
      rate: 850,
      amount: 10200,
      payoutDate: "Releasing Tomorrow · 11:00 AM",
      status: "In Escrow (24h SLA)",
      payoutMethodUsed: "Cashfree Instant UPI · clinician@oksbi",
      slipRef: "FALE-ESC-9941",
    },
    {
      id: "pay-102",
      shiftId: "sh-840",
      shiftTitle: "ICU Night Specialist Cover",
      hospitalName: "Manipal Hospital",
      dept: "Critical Care",
      shiftDate: "28 Oct 2026",
      hours: 12,
      rate: 750,
      amount: 9000,
      payoutDate: "29 Oct 2026 · 09:15 AM",
      status: "Disbursed",
      payoutMethodUsed: "Cashfree Instant UPI · clinician@oksbi",
      utr: "CFUPI2026102900918",
      slipRef: "FALE-DIS-8401",
    },
    {
      id: "pay-103",
      shiftId: "sh-812",
      shiftTitle: "OT Surgical Assisting Resident",
      hospitalName: "Fortis Healthcare",
      dept: "Operation Theatre",
      shiftDate: "24 Oct 2026",
      hours: 8,
      rate: 650,
      amount: 5200,
      payoutDate: "25 Oct 2026 · 10:00 AM",
      status: "Disbursed",
      payoutMethodUsed: "Cashfree Instant UPI · clinician@oksbi",
      utr: "CFUPI2026102500412",
      slipRef: "FALE-DIS-8129",
    },
    {
      id: "pay-104",
      shiftId: "sh-790",
      shiftTitle: "Cardiac ICU Duty Doctor",
      hospitalName: "Narayana Health City",
      dept: "Cardiology",
      shiftDate: "19 Oct 2026",
      hours: 8,
      rate: 700,
      amount: 5600,
      payoutDate: "20 Oct 2026 · 08:30 AM",
      status: "Disbursed",
      payoutMethodUsed: "Cashfree Instant UPI · clinician@oksbi",
      utr: "CFUPI2026102000109",
      slipRef: "FALE-DIS-7902",
    },
  ],
  candidateKYC: [
    {
      id: "ck1",
      name: "Karthik S",
      email: "karthik.s@healthlab.in",
      phone: "+91 96001 11223",
      profession: "Lab Technician",
      qualification: "DMLT — Diploma in Medical Lab Tech",
      council: "Tamil Nadu Paramedical Board",
      regNumber: "TN-PB/2023/88921",
      state: "Tamil Nadu",
      docName: "DMLT_Council_Certificate_2023.pdf",
      status: "pending",
      submittedDate: "Today · 10:30 AM",
      experience: "1 yr clinical lab experience",
      notes: "Uploaded state council registration certificate and college marksheet.",
    },
    {
      id: "ck2",
      name: "Dr. Ananya Verma",
      email: "dr.ananya.verma@medcouncil.in",
      phone: "+91 98840 76543",
      profession: "Doctor",
      qualification: "MBBS, MD Anaesthesiology",
      council: "Karnataka Medical Council (NMC)",
      regNumber: "KMC Reg #98432",
      state: "Karnataka",
      docName: "KMC_Registration_NMC_Verified.pdf",
      status: "pending",
      submittedDate: "Today · 09:15 AM",
      experience: "4 yrs post-MD anaesthesia experience",
      notes: "DigiLocker verified badge attached. Awaiting Admin clearance.",
    },
    {
      id: "ck3",
      name: "Pooja Deshmukh",
      email: "pooja.d@nursingcare.in",
      phone: "+91 97654 32109",
      profession: "Staff Nurse",
      qualification: "B.Sc Nursing",
      council: "Maharashtra Nursing Council",
      regNumber: "MNC/RN/2021/45012",
      state: "Maharashtra",
      docName: "MNC_Nursing_License_Renewed.pdf",
      status: "pending",
      submittedDate: "Yesterday",
      experience: "3 yrs ICU & Critical Care",
      notes: "Renewal certificate attached with BLS/ACLS certification.",
    },
    {
      id: "ck4",
      name: "Priya Raman",
      email: "priya.raman@clinicalmail.in",
      phone: "+91 98401 23456",
      profession: "Staff Nurse",
      qualification: "B.Sc Nursing",
      council: "Tamil Nadu Nurses Council (TNC)",
      regNumber: "TNC Reg #RN-89421",
      state: "Tamil Nadu",
      docName: "TNC_RN_Certificate_89421.pdf",
      status: "verified",
      submittedDate: "3 days ago",
      experience: "4 yrs critical care",
      notes: "Verified against TNC Registry database. All documents valid.",
    },
  ],
  facilityKYC: [
    {
      id: "fk1",
      name: "Gleneagles Global Health City",
      type: "Multi-Speciality Tertiary Hospital",
      city: "Chennai",
      state: "Tamil Nadu",
      licenseNumber: "CEA-TN/CHN/2022/491",
      nabhNumber: "NABH-H-2023-1104",
      beds: 450,
      contactPerson: "Dr. K. Senthil Nathan (Medical Superintendent)",
      contactPhone: "+91 94441 22334",
      docName: "NABH_Accreditation_Certificate_2023_2026.pdf",
      status: "pending",
      submittedDate: "Today · 11:00 AM",
      accreditation: "NABH Accredited (Tertiary)",
    },
    {
      id: "fk2",
      name: "Aster Prime Hospital",
      type: "Super Speciality Hospital",
      city: "Hyderabad",
      state: "Telangana",
      licenseNumber: "TG-MED/HYD/8834",
      nabhNumber: "NABH-H-2024-0512",
      beds: 220,
      contactPerson: "Sudha Rao (Head of Clinical HR)",
      contactPhone: "+91 98490 11223",
      docName: "Clinical_Establishment_Act_License.pdf",
      status: "pending",
      submittedDate: "Yesterday",
      accreditation: "NABH & NABL Accredited",
    },
    {
      id: "fk3",
      name: "Apollo Hospitals",
      type: "Quaternary Care Hospital",
      city: "Chennai",
      state: "Tamil Nadu",
      licenseNumber: "CEA-TN/CHN/1092",
      nabhNumber: "NABH-H-2020-0019",
      beds: 650,
      contactPerson: "R. Muralidharan (Director HR)",
      contactPhone: "+91 98400 99887",
      docName: "Apollo_Greams_NABH_JCI.pdf",
      status: "verified",
      submittedDate: "1 week ago",
      accreditation: "NABH & JCI Gold Seal",
    },
  ],
  jobApprovals: [
    {
      id: "ja1",
      title: "Senior Resident — Critical Care",
      org: "Gleneagles Global Health City",
      type: "job",
      dept: "Critical Care / ICU",
      city: "Chennai",
      compensation: "₹1,10,000 – ₹1,35,000 / mo",
      expOrHours: "1–3 yrs post-MD/DNB",
      status: "pending",
      submittedDate: "Today · 11:20 AM",
      openings: 3,
      postedBy: "Dr. K. Senthil Nathan",
      urgent: true,
    },
    {
      id: "ja2",
      title: "Cardiac Cath Lab Technologist",
      org: "Aster Prime Hospital",
      type: "job",
      dept: "Interventional Cardiology",
      city: "Hyderabad",
      compensation: "₹45,000 – ₹60,000 / mo",
      expOrHours: "2–5 yrs Cath Lab",
      status: "pending",
      submittedDate: "Today · 09:45 AM",
      openings: 2,
      postedBy: "Sudha Rao",
    },
    {
      id: "ja3",
      title: "Emergency Night Shift RMO (Locum)",
      org: "Manipal Hospital",
      type: "shift",
      dept: "Emergency & Trauma",
      city: "Bengaluru",
      compensation: "₹600 / hr (12h · ₹7,200)",
      expOrHours: "12 Hours · Tonight",
      status: "pending",
      submittedDate: "Today · 12:10 PM",
      openings: 1,
      postedBy: "Duty Medical Officer",
      urgent: true,
    },
    {
      id: "ja4",
      title: "Staff Nurse — ICU",
      org: "Apollo Hospitals",
      type: "job",
      dept: "ICU & Critical Care",
      city: "Chennai",
      compensation: "₹35,000 – ₹48,000 / mo",
      expOrHours: "2–5 yrs",
      status: "approved",
      submittedDate: "2 days ago",
      openings: 4,
      postedBy: "R. Muralidharan",
    },
  ],
  adminApplications: [
    {
      id: "ap1",
      candidateName: "Priya Raman",
      candidateRole: "Staff Nurse (MICU Lead)",
      candidateCity: "Chennai",
      jobId: "j1",
      jobTitle: "Staff Nurse — ICU",
      hospitalName: "Apollo Hospitals",
      matchScore: 96,
      councilVerified: true,
      regNumber: "TNC Reg #RN-89421",
      exp: "4 yrs critical care",
      status: "pending_admin",
      appliedDate: "Today · 10:15 AM",
      summary: "Expert in mechanical ventilation, hemodynamics, central lines. Immediate joiner.",
      phone: "+91 98401 23456",
      email: "priya.raman@clinicalmail.in",
    },
    {
      id: "ap2",
      candidateName: "Dr. Sneha Pillai",
      candidateRole: "Emergency Physician",
      candidateCity: "Bengaluru",
      jobId: "j6",
      jobTitle: "Emergency Medical Officer",
      hospitalName: "Manipal Hospital",
      matchScore: 98,
      councilVerified: true,
      regNumber: "KMC Reg #128945",
      exp: "3 yrs Level-1 ER",
      status: "pending_admin",
      appliedDate: "Today · 11:30 AM",
      summary: "FCCS & ATLS certified emergency physician. Experienced in rapid sequence intubation & trauma resuscitation.",
      phone: "+91 99002 44556",
      email: "dr.sneha.pillai@medcare.in",
    },
    {
      id: "ap3",
      candidateName: "Arjun Mehta",
      candidateRole: "Staff Nurse",
      candidateCity: "Chennai",
      jobId: "j1",
      jobTitle: "Staff Nurse — ICU",
      hospitalName: "Apollo Hospitals",
      matchScore: 92,
      councilVerified: true,
      regNumber: "TNC Reg #RN-72301",
      exp: "2 yrs cardiac ICU",
      status: "shortlisted",
      appliedDate: "Yesterday",
      summary: "Critical care fellowship completed. Serving notice (10 days).",
      phone: "+91 97890 54321",
      email: "arjun.mehta@carepulse.in",
    },
    {
      id: "ap4",
      candidateName: "Karthik S",
      candidateRole: "Lab Technician",
      candidateCity: "Chennai",
      jobId: "j3",
      jobTitle: "Medical Lab Technician",
      hospitalName: "Metropolis Healthcare",
      matchScore: 84,
      councilVerified: false,
      regNumber: "Under Admin Verification",
      exp: "1 yr phlebotomy & smear",
      status: "pending_admin",
      appliedDate: "2 days ago",
      summary: "Diploma holder in lab tech. Handled routine hematology and venipunctures.",
      phone: "+91 96001 11223",
      email: "karthik.s@healthlab.in",
    },
  ],
};

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

const initial: AppState = isApiEnabled ? initialEmptyState : initialMockState;

if (typeof window !== "undefined" && isApiEnabled) {
  try {
    localStorage.removeItem(KEY);
  } catch { }
}

let state: AppState = initial;
let loaded = false;
const listeners = new Set<() => void>();

function sanitizeStateForStorage(s: AppState): Partial<AppState> {
  if (!isApiEnabled) return s;
  const { profile, docs, contact, hospitalBankAccount, candidatePayoutMethod, ...safe } = s;
  return safe;
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  if (isApiEnabled) {
    try {
      localStorage.removeItem(KEY);
    } catch { }
    state = { ...initialEmptyState };
    return;
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed) {
        if (parsed.candidateCredits === 3) {
          parsed.candidateCredits = 0;
        }
        if (parsed.candidatePayoutMethod?.upiId === "jinovj250@oksbi" || parsed.candidatePayoutMethod?.upiId === "clinician@oksbi") {
          delete parsed.candidatePayoutMethod;
        }
        if (isApiEnabled) {
          // Enforce rule: remove tokens & personal data from localStorage
          delete parsed.candidateCredits;
          delete parsed.profile;
          delete parsed.docs;
          delete parsed.contact;
          delete parsed.hospitalBankAccount;
          delete parsed.candidatePayoutMethod;
          localStorage.setItem(KEY, JSON.stringify(parsed));
        }
      }
      state = {
        ...initial,
        ...parsed,
        huddlePosts: Array.isArray(parsed.huddlePosts) ? parsed.huddlePosts.filter((p: any) => p && !String(p.id).startsWith("h")) : [],
        huddleQuestions: Array.isArray(parsed.huddleQuestions) ? parsed.huddleQuestions.filter((q: any) => q && !String(q.id).startsWith("q")) : [],
        huddleSessions: Array.isArray(parsed.huddleSessions) ? parsed.huddleSessions.filter((s: any) => s && !String(s.id).startsWith("sess")) : [],
      };
    }
  } catch {
    /* ignore */
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("fale:auth-expired", () => {
    setState({ signedIn: false });
  });
}

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  load();
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  try {
    if (isApiEnabled) { localStorage.removeItem(KEY); } else {
      localStorage.setItem(KEY, JSON.stringify(state));
    }
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function resetState() {
  state = isApiEnabled ? initialEmptyState : initialMockState;
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

