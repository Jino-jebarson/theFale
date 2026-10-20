import { useSyncExternalStore } from "react";

export type Portal = "candidate" | "facility" | "admin";

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
}

export interface FacilityKYCItem {
  id: string;
  name: string;
  type: string;
  city: string;
  state: string;
  licenseNumber: string;
  nabhNumber: string;
  beds: number;
  contactPerson: string;
  contactPhone: string;
  docName: string;
  status: "pending" | "verified" | "rejected";
  submittedDate: string;
  accreditation: string;
}

export interface AdminJobApproval {
  id: string;
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
}

export interface AdminApplication {
  id: string;
  candidateName: string;
  candidateRole: string;
  candidateCity: string;
  jobId: string;
  jobTitle: string;
  hospitalName: string;
  matchScore: number;
  councilVerified: boolean;
  regNumber: string;
  exp: string;
  status: "pending_admin" | "shortlisted" | "rejected";
  appliedDate: string;
  summary: string;
  phone: string;
  email: string;
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
}

const KEY = "fale-pro-v2";
const initial: AppState = {
  portal: "candidate",
  contact: "",
  signedIn: false,
  onboarded: false,
  profile: {},
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
  candidateCredits: 3,
  unlockedCandidates: [],
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

let state: AppState = initial;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...initial, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
}

export function setState(patch: Partial<AppState> | ((s: AppState) => Partial<AppState>)) {
  load();
  const p = typeof patch === "function" ? patch(state) : patch;
  state = { ...state, ...p };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function resetState() {
  state = initial;
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
