import { useSyncExternalStore } from "react";

export type Portal = "candidate" | "facility";

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
}

const KEY = "fale-pro-v1";
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
