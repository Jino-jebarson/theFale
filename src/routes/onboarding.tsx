import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { RequestError } from "@/components/fale/RequestError";
import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { applyTheme, getEffectiveTheme } from "@/lib/theme";
import {
  HiArrowLeft,
  HiArrowRight,
  HiChevronRight,
  HiCheck,
  HiOutlineUser,
  HiOutlineEnvelope,
  HiOutlineCalendar,
  HiOutlineBuildingOffice2,
  HiOutlineGlobeAlt,
  HiOutlineIdentification,
  HiOutlinePencilSquare,
  HiOutlineInformationCircle,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineMapPin,
  HiOutlineShieldCheck,
  HiOutlineDocumentCheck,
  HiOutlineArrowRightOnRectangle,
  HiOutlineXMark,
  HiOutlineSparkles,
  HiOutlineCloudArrowUp,
  HiBolt,
  HiCheckCircle,
  HiOutlineClock,
  HiOutlineMagnifyingGlass,
  HiOutlineTrash,
  HiPlus,
  HiOutlineCamera,
  HiOutlinePhoto,
  HiOutlinePhone,
  HiOutlineBuildingLibrary,
  HiOutlineLockClosed,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import {
  RiVerifiedBadgeFill,
  RiStethoscopeLine,
  RiGraduationCapLine,
  RiShieldCheckLine,
  RiChatVoiceLine,
  RiFileUserLine,
} from "react-icons/ri";
import { LogOut, BotMessageSquare } from "lucide-react";
import { executeAiTask } from "@/lib/adapters/aiAdapter";
import { toast } from "sonner";
import { Logo } from "@/components/fale/Logo";
import { initials } from "@/components/fale/AppShell";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DigiLockerModal } from "@/components/fale/DigiLockerModal";
import { ResumeParserModal } from "@/components/fale/ResumeParserModal";
import type { ParsedResumeData } from "@/lib/resumeParser";
import {
  AddressField,
  ChipGroup,
  DateField,
  Field,
  Label,
  MultiSelectField,
  PhoneField,
  SegmentedControl,
  SelectField,
  Toggle,
  UploadBox,
  type AddressValue,
} from "@/components/fale/fields";
import { setState, useApp } from "@/lib/store";
import { isApiEnabled } from "@/lib/api";
import { onboardCandidate } from "@/lib/adapters/candidateAdapter";
import { onboardFacility, uploadFacilityDocument } from "@/lib/adapters/facilityAdapter";
import { sendOtp } from "@/lib/adapters/authAdapter";
import {
  councilByProfession,
  councilOptions,
  getCouncilsForRole,
  getOnlineRegisterName,
  departmentsByProfession,
  designationPlaceholders,
  indianCities,
  indianStates,
  neededDocs,
  onlineCouncilRegisters,
  professions,
  qualificationPlaceholders,
  qualificationsByProfession,
  regNoPlaceholders,
  regulatedProfessions,
  skillsByProfession,
} from "@/lib/data";
import { cn } from "@/lib/utils";

interface OnboardingSearch {
  role?: string;
  portal?: string;
  mode?: string;
  edit?: boolean | string;
  ref?: string;
}

function cleanAiNote(text?: string): string {
  if (!text) return "";
  return text
    .replace(/^#+\s+/gm, "")
    .replace(/[*_~`]/g, "")
    .replace(/---/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export const Route = createFileRoute("/onboarding")({
  validateSearch: (search: Record<string, unknown>): OnboardingSearch => {
    const res: OnboardingSearch = {};
    if (typeof search["role"] === "string" && search["role"]) res.role = search["role"];
    if (typeof search["portal"] === "string" && search["portal"]) res.portal = search["portal"];
    if (typeof search["mode"] === "string" && search["mode"]) res.mode = search["mode"];
    if (search["edit"] != null) res.edit = String(search["edit"]);
    if (typeof search["ref"] === "string" && search["ref"]) res.ref = search["ref"].trim();
    return res;
  },
  head: () => ({
    meta: [
      { title: "Set up your profile — FALE" },
      { name: "description", content: "Complete your FALE profile step by step to get verified and matched." },
      { property: "og:title", content: "Set up your profile — FALE" },
      { property: "og:description", content: "Complete your FALE profile step by step to get verified and matched." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Onboarding,
});

interface WorkExperienceItem {
  org: string;
  role: string;
  fm: string;
  fy: string;
  tm?: string;
  ty?: string;
  cur?: boolean;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEARS = Array.from({ length: 40 }, (_, i) => String(new Date().getFullYear() - i));

const STUDENT_COURSES = [
  { label: "BPT (Physiotherapy)", role: "physiotherapist" },
  { label: "MPT (Physiotherapy)", role: "physiotherapist" },
  { label: "B.Sc Nursing", role: "nurse" },
  { label: "GNM Nursing", role: "nurse" },
  { label: "BMLT (Lab technology)", role: "lab_technician" },
  { label: "DMLT (Lab technology)", role: "lab_technician" },
  { label: "B.Sc Radiology / MIT", role: "radiographer" },
  { label: "B.Pharm / D.Pharm", role: "pharmacist" },
  { label: "B.Sc OT technology", role: "ot_technician" },
  { label: "B.Sc Dialysis technology", role: "dialysis_technician" },
];

const STUDENT_PROOFS = [
  { id: "college_id", label: "College ID card", desc: "Photo of the front, with your name and course" },
  { id: "bonafide", label: "Bonafide certificate", desc: "From your college office, this academic year" },
  { id: "univ_reg", label: "University registration number", desc: "We check it with your university" },
] as const;

const STUDENT_AREAS = [
  "Jayanagar",
  "Banashankari",
  "JP Nagar",
  "Koramangala",
  "HSR Layout",
  "Indiranagar",
  "Whitefield",
  "Hebbal",
  "Yelahanka",
  "Rajajinagar",
  "Malleshwaram",
  "Electronic City",
  "Marathahalli",
  "Basavanagudi",
];

const STUDENT_YEARS = ["1st year", "2nd year", "3rd year", "4th year", "Internship year"];

function mIdx(m: string | undefined, y: string | undefined) {
  if (m === "" || m == null || !y) return null;
  return (+y) * 12 + (+m);
}

function nowIdx() {
  const n = new Date();
  return n.getFullYear() * 12 + n.getMonth();
}

function expMonths(list: WorkExperienceItem[]) {
  const r = (list || [])
    .map((e) => {
      const a = mIdx(e.fm, e.fy);
      const b = e.cur ? nowIdx() : mIdx(e.tm, e.ty);
      return a == null || b == null || b < a ? null : ([a, b + 1] as [number, number]);
    })
    .filter((x): x is [number, number] => x !== null)
    .sort((x, y) => x[0] - y[0]);
  let t = 0;
  let c: [number, number] | null = null;
  r.forEach((x) => {
    if (!c) {
      c = [x[0], x[1]];
      return;
    }
    if (x[0] <= c[1]) c[1] = Math.max(c[1], x[1]);
    else {
      t += c[1] - c[0];
      c = [x[0], x[1]];
    }
  });
  if (c) t += c[1] - c[0];
  return t;
}

function fmtM(m: number) {
  if (!m) return "0 months";
  const y = Math.floor(m / 12);
  const mo = m % 12;
  return (y ? `${y} yr${y > 1 ? "s" : ""}` : "") + (y && mo ? " " : "") + (mo ? `${mo} mo${mo > 1 ? "s" : ""}` : "");
}

const candidateSteps = [
  { t: "Personal details", d: "About you & where you live" },
  { t: "Profession", d: "Your role & registration" },
  { t: "Education & experience", d: "Qualification & work history" },
  { t: "Job preferences", d: "What your next role looks like" },
  { t: "Documents", d: "Verify your credentials" },
  { t: "Review", d: "Confirm & submit" },
];
const facilitySteps = [
  { t: "Your details", d: "The person hiring" },
  { t: "Organization", d: "Facility & location" },
  { t: "Verification", d: "Registration & documents" },
  { t: "Hiring profile", d: "Departments & needs" },
  { t: "Review", d: "Confirm & submit" },
];

const studentSteps = [
  { t: "Personal details", d: "About you & where you live" },
  { t: "Course & college", d: "Academic enrollment" },
  { t: "Proof of study", d: "College verification" },
  { t: "Review & finish", d: "Confirm & access Huddle" },
];

type P = Record<string, string | boolean | string[]>;

interface PathwayChooserProps {
  onSelectStudent: () => void;
  onSelectGraduate: () => void;
}

function CandidatePathwayChooser({
  onSelectStudent,
  onSelectGraduate,
}: PathwayChooserProps) {
  const [activeChoice, setActiveChoice] = useState<"student" | "grad">("student");

  return (
    <div className="mx-auto max-w-[620px] px-3.5 py-6 sm:px-4 sm:py-12 animate-in fade-in duration-300">
      {/* Back to sign in navigation */}
      <div className="mb-3.5 sm:mb-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer group"
        >
          <HiArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-transform group-hover:-translate-x-1" />
          <span>Back to sign in</span>
        </Link>
      </div>

      {/* Main Container Card */}
      <div className="rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-4 sm:p-8 shadow-[0_4px_24px_-6px_rgba(0,0,0,0.06),0_1px_3px_rgba(0,0,0,0.03)] space-y-5 sm:space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
            Are you still studying?
          </h1>
        </div>

        {/* Stacked Selection Cards with brand colors and hover state */}
        <div className="space-y-3 sm:space-y-3.5">
          {/* OPTION 1: STUDENT */}
          <button
            type="button"
            onClick={onSelectStudent}
            onMouseEnter={() => setActiveChoice("student")}
            className={cn(
              "group w-full rounded-2xl p-3.5 sm:p-5 text-left transition-all duration-150 cursor-pointer border text-foreground",
              activeChoice === "student"
                ? "border-primary bg-primary-soft/25 ring-2 ring-primary/20 shadow-xs"
                : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <div className="flex items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                <div className="h-11 w-11 sm:h-13 sm:w-13 rounded-xl sm:rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0 border border-primary/25 shadow-2xs group-hover:scale-105 transition-transform">
                  <HiOutlineAcademicCap className="h-5.5 w-5.5 sm:h-7 sm:w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-foreground text-[15px] sm:text-[17px] leading-snug">
                    Yes, I’m a student
                  </div>
                  <p className="text-[11.5px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-normal truncate">
                    Final year, student or still in college
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg sm:rounded-xl shrink-0 transition-all",
                  activeChoice === "student"
                    ? "bg-primary text-white shadow-2xs"
                    : "bg-muted/60 text-muted-foreground group-hover:bg-primary group-hover:text-white"
                )}
              >
                <HiChevronRight className="h-4 w-4" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap sm:items-center gap-1.5 sm:gap-3 mt-3 pt-3 border-t border-border/50 text-[11px] sm:text-[11.5px] text-muted-foreground font-medium">
              <span className="inline-flex items-center gap-1.5">
                <HiOutlineAcademicCap className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Clinical Internships</span>
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="inline-flex items-center gap-1.5">
                <RiStethoscopeLine className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Case Huddle</span>
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="inline-flex items-center gap-1.5">
                <HiOutlineSparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Verified Mentors</span>
              </span>
            </div>
          </button>

          {/* OPTION 2: GRADUATE */}
          <button
            type="button"
            onClick={onSelectGraduate}
            onMouseEnter={() => setActiveChoice("grad")}
            className={cn(
              "group w-full rounded-2xl p-3.5 sm:p-5 text-left transition-all duration-150 cursor-pointer border text-foreground",
              activeChoice === "grad"
                ? "border-primary bg-primary-soft/25 ring-2 ring-primary/20 shadow-xs"
                : "border-border/80 bg-card hover:border-primary/50 hover:bg-muted/30"
            )}
          >
            <div className="flex items-center justify-between gap-2.5 sm:gap-3">
              <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 flex-1">
                <div className="h-11 w-11 sm:h-13 sm:w-13 rounded-xl sm:rounded-2xl bg-primary-soft text-primary flex items-center justify-center shrink-0 border border-primary/25 shadow-2xs group-hover:scale-105 transition-transform">
                  <HiOutlineBriefcase className="h-5.5 w-5.5 sm:h-7 sm:w-7" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-foreground text-[15px] sm:text-[17px] leading-snug">
                    No, I’ve graduated
                  </div>
                  <p className="text-[11.5px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1 leading-normal truncate">
                    Fresher or working professional
                  </p>
                </div>
              </div>
              <div
                className={cn(
                  "grid h-7 w-7 sm:h-8 sm:w-8 place-items-center rounded-lg sm:rounded-xl shrink-0 transition-all",
                  activeChoice === "grad"
                    ? "bg-primary text-white shadow-2xs"
                    : "bg-muted/60 text-muted-foreground group-hover:bg-primary group-hover:text-white"
                )}
              >
                <HiChevronRight className="h-4 w-4" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap sm:items-center gap-1.5 sm:gap-3 mt-3 pt-3 border-t border-border/50 text-[11px] sm:text-[11.5px] text-muted-foreground font-medium">
              <span className="inline-flex items-center gap-1.5">
                <HiOutlineBuildingOffice2 className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Hospital Job Openings</span>
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="inline-flex items-center gap-1.5">
                <HiBolt className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>24h Payout Shifts</span>
              </span>
              <span className="hidden sm:inline text-border">•</span>
              <span className="inline-flex items-center gap-1.5">
                <HiOutlineShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" />
                <span>Council KYC</span>
              </span>
            </div>
          </button>
        </div>

        {/* Informational Footnote */}
        <div className="flex items-start sm:items-center gap-2 text-xs text-muted-foreground pt-0.5 sm:pt-1">
          <HiOutlineInformationCircle className="h-4 w-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
          <span className="leading-relaxed">You can change this later when you graduate</span>
        </div>
      </div>
    </div>
  );
}

function OnboardingSetupFrame({
  title, steps, current, category, heading, description, children, error, onBack, onNext, nextLabel, pending, onResume,
}: {
  title: string;
  steps: { t: string; d: string }[];
  current: number;
  category: string;
  heading: string;
  description: string;
  children: ReactNode;
  error?: string;
  onBack: () => void;
  onNext: () => void;
  nextLabel: string;
  pending?: boolean;
  onResume?: () => void;
}) {
  const progress = Math.round(((current + 1) / steps.length) * 100);
  const sidebarTitle = title.includes("Student") ? "Student Profile" : title.includes("Facility") ? "Facility Setup" : "Your Profile";
  return (
    <div className="light min-h-screen bg-[#f8fafc] text-slate-900" data-theme="light">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo /><div className="hidden h-5 w-px bg-slate-200 sm:block" />
            <span className="hidden text-xs font-semibold uppercase tracking-wider text-slate-500 sm:inline-block">{title}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {onResume && <Button type="button" variant="outline" size="sm" onClick={onResume} className="hidden items-center gap-1.5 rounded-full border-primary/30 text-xs font-bold text-primary hover:bg-primary-soft sm:inline-flex"><HiOutlineSparkles className="h-3.5 w-3.5" />Auto-fill from Resume</Button>}
            <button type="button" aria-label="Exit setup" title="Exit profile setup" onClick={() => window.location.assign("/")} className="rounded-xl p-2 text-primary transition-all hover:bg-primary-soft/70 hover:text-primary-hover"><LogOut className="h-5 w-5 stroke-[2.2]" /></button>
          </div>
        </div>
        <div className="h-1 bg-slate-100 lg:hidden"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} /></div>
      </header>
      <main className="mx-auto grid max-w-6xl items-start gap-6 px-3.5 py-6 sm:px-6 sm:py-8 lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-8">
        <aside className="sticky top-[84px] hidden select-none self-start space-y-4 lg:block">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)]">
            <div className="flex items-center justify-between gap-2"><span className="min-w-0 flex-1 text-[11px] font-bold uppercase leading-tight tracking-[0.16em] text-primary">{sidebarTitle}</span><span className="inline-flex shrink-0 items-center whitespace-nowrap rounded-full border border-primary/20 bg-primary-soft px-2.5 py-0.5 text-xs font-bold text-primary">{progress}% complete</span></div>
            <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400 shadow-sm shadow-primary/25 transition-all duration-500" style={{ width: `${progress}%` }} /></div>
            <div className="relative mt-7 space-y-2"><div className="pointer-events-none absolute bottom-5 left-[26px] top-5 z-0 w-[2px] bg-slate-200/80" />{steps.map((item, index) => <div key={item.t} className="relative z-10"><button type="button" disabled={index > current} onClick={() => index < current && onBack()} className={cn("group flex w-full items-start gap-3 rounded-2xl p-2.5 text-left transition-all", index === current && "border border-primary/25 bg-primary-soft/60 shadow-sm", index < current && "cursor-pointer hover:bg-slate-50", index > current && "cursor-not-allowed")}><span className={cn("relative z-20 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold ring-4 ring-white", index < current && "bg-emerald-600 text-white", index === current && "bg-primary text-white shadow-md shadow-primary/30 ring-primary/15", index > current && "border border-slate-300 bg-white text-slate-400")}>{index < current ? <HiCheck className="h-4 w-4 stroke-[2.5]" /> : index + 1}</span><span className="min-w-0"><span className={cn("block text-sm font-bold", index === current ? "text-primary" : index < current ? "text-slate-900" : "text-slate-400")}>{item.t}</span><span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{item.d}</span></span></button></div>)}</div>
          </div>
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-xs text-slate-600 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-slate-900"><HiOutlineShieldCheck className="h-4 w-4 shrink-0 text-primary" />Verified Healthcare Network</div>
            <p className="mt-2 text-[11px] leading-relaxed text-slate-500">Credentials and registrations are verified directly with state councils and hospital boards.</p>
          </div>
        </aside>
        <section className="w-full min-w-0 rounded-3xl border border-slate-200/90 bg-white p-4 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] transition-all sm:p-8 lg:p-10">
          <div className="mb-7 border-b border-slate-100 pb-6"><div className="flex items-center justify-between"><span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">Step {current + 1} of {steps.length}</span><span className="text-xs font-semibold text-slate-400">{category}</span></div><h1 className="mt-3 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{heading}</h1><p className="mt-1.5 text-sm text-slate-500 sm:text-base">{description}</p></div>
          <div key={current} className="animate-in fade-in-50 slide-in-from-right-4 duration-300 ease-out">{children}</div>
          {error && <p role="alert" className="mt-5 text-sm text-destructive">{error}</p>}
          <div className="mt-10 flex flex-col-reverse items-center justify-between gap-4 border-t border-slate-100 pt-6 sm:flex-row"><Button type="button" variant="outline" size="lg" onClick={onBack} disabled={pending} className="w-full cursor-pointer gap-2 rounded-xl border-slate-300 font-semibold text-slate-700 transition-all hover:bg-slate-50 sm:w-auto"><HiArrowLeft className="h-4 w-4" />Back</Button><Button type="button" size="lg" disabled={pending} onClick={onNext} className="w-full cursor-pointer gap-2.5 rounded-xl bg-primary px-8 font-semibold text-white shadow-md shadow-primary/25 transition-all hover:bg-primary/95 hover:shadow-lg sm:w-auto">{pending ? "Please wait…" : nextLabel}<HiArrowRight className="h-4 w-4 stroke-[2.2]" /></Button></div>
          <div className="mt-5 flex items-center justify-center px-2"><p className="flex items-start justify-center gap-1.5 text-left text-[11px] leading-normal text-slate-400 sm:items-center sm:text-center"><HiOutlineShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400 sm:mt-0" /><span>Protected by 256-bit SSL encryption. Documents are strictly used for credentialing.</span></p></div>
        </section>
      </main>
    </div>
  );
}
const QUICK_STUDENT_COURSES = ["BPT (Physiotherapy)", "MPT (Physiotherapy)", "B.Sc Nursing", "GNM Nursing", "BMLT (Lab technology)", "DMLT (Lab technology)", "B.Sc Radiology / MIT", "B.Pharm / D.Pharm", "B.Sc OT technology", "B.Sc Dialysis technology"];
const QUICK_COURSE_PROFESSION: Record<string, string> = { "BPT (Physiotherapy)": "Physiotherapist", "MPT (Physiotherapy)": "Physiotherapist", "B.Sc Nursing": "Nurse", "GNM Nursing": "Nurse", "BMLT (Lab technology)": "Lab Technician", "DMLT (Lab technology)": "Lab Technician", "B.Sc Radiology / MIT": "Radiographer", "B.Pharm / D.Pharm": "Pharmacist", "B.Sc OT technology": "OT Technician", "B.Sc Dialysis technology": "Dialysis Technician" };
const QUICK_AREAS = ["Jayanagar", "Banashankari", "JP Nagar", "Koramangala", "HSR Layout", "Indiranagar", "Whitefield", "Hebbal", "Yelahanka", "Rajajinagar", "Malleshwaram", "Electronic City", "Marathahalli", "Basavanagudi"];

export function QuickCandidateOnboarding() {
  const navigate = useNavigate();
  const [pathway, setPathway] = useState<"choose" | "student" | "graduate">("choose");
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [track, setTrack] = useState<"student" | "fresher" | "professional" | "">("");
  const [profession, setProfession] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [course, setCourse] = useState("");
  const [city, setCity] = useState("");
  const [customCity, setCustomCity] = useState("");
  const [area, setArea] = useState("");
  const [locationAddress, setLocationAddress] = useState("");
  const [locationState, setLocationState] = useState("");
  const [locatingArea, setLocatingArea] = useState(false);
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("");
  const [college, setCollege] = useState("");
  const [studyYear, setStudyYear] = useState("");
  const [graduation, setGraduation] = useState("");
  const [proof, setProof] = useState("college_id");
  const [universityRegNo, setUniversityRegNo] = useState("");
  const [proofFile, setProofFile] = useState<{ name: string; data: string } | null>(null);
  const [adultConfirmed, setAdultConfirmed] = useState(false);
  const [years, setYears] = useState("");
  const [registration, setRegistration] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [resume, setResume] = useState<{ name: string; data: string } | null>(null);
  const [resumeModalOpen, setResumeModalOpen] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoPreview, setPhotoPreview] = useState("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const adultCutoff = new Date();
  adultCutoff.setFullYear(adultCutoff.getFullYear() - 18);
  const maxDob = adultCutoff.toISOString().slice(0, 10);
  const graduateSteps = [{ t: "Your name", d: "How you appear" }, { t: "Your profile", d: "Resume or 3 taps" }, { t: "Done", d: "Look around" }];
  const studentSteps = [{ t: "Your details", d: "About you & where you live" }, { t: "Course & college", d: "Your current studies" }, { t: "Proof of study", d: "We check your enrollment" }];
  const steps = pathway === "student" ? studentSteps : graduateSteps;

  const applyResume = (data: ParsedResumeData, fileName: string, fileDataUrl?: string) => {
    if (data.name) setName(data.name);
    if (data.role) setProfession(professions.find((role) => role.toLowerCase() === data.role?.toLowerCase()) || "");
    if (data.specialty) setSpecialty(data.specialty);
    if (data.city) {
      if (indianCities.includes(data.city)) setCity(data.city);
      else { setCity("Other"); setCustomCity(data.city); }
    }
    if (data.state) setLocationState(data.state);
    if (data.address) setLocationAddress(data.address);
    else if (data.city) setLocationAddress([data.city, data.state].filter(Boolean).join(", "));
    if (data.dob) setDob(data.dob);
    if (data.gender) setGender(data.gender);
    if (data.exp) {
      const isFresher = /^0\b|fresher/i.test(data.exp);
      const parsedYears = data.exp.match(/\d+(?:\.\d+)?/)?.[0] || "";
      setYears(isFresher ? "" : parsedYears);
      setTrack(isFresher ? "fresher" : "professional");
    }
    if (data.regNo) setRegistration(data.regNo);
    setSkills(data.skills || []);
    if (fileDataUrl) setResume({ name: fileName, data: fileDataUrl });
    setResumeModalOpen(false);
    setStep(2);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Location is not available in this browser.");
      return;
    }
    setLocatingArea(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}&accept-language=en`, {
          headers: { Accept: "application/json", "Accept-Language": "en" },
        });
        if (!response.ok) throw new Error("Could not look up this location.");
        const result = await response.json();
        const address = result.address ?? {};
        const detectedCity = address.city || address.town || address.municipality || address.village || address.county || "";
        if (detectedCity) {
          const matchedCity = indianCities.find((option) => option.toLowerCase() === String(detectedCity).toLowerCase());
          setCity(matchedCity || "Other");
          setCustomCity(matchedCity ? "" : String(detectedCity));
        }
        if (address.state) setLocationState(String(address.state));
        if (result.display_name) setLocationAddress(String(result.display_name));
        const detectedArea = address.neighbourhood || address.suburb || address.city_district || address.quarter || address.residential || "";
        if (detectedArea) {
          setArea(String(detectedArea));
          toast.success("Current address added", { description: String(result.display_name || `${detectedArea}, ${detectedCity}`) });
        } else {
          toast.success("Current address added", { description: "Review the address and edit it if needed." });
        }
      } catch {
        toast.error("Could not identify your address", { description: "Enter your full address manually." });
      } finally {
        setLocatingArea(false);
      }
    }, (failure) => {
      setLocatingArea(false);
      toast.error(failure.code === 1 ? "Location permission was denied" : "Could not get your current location", {
        description: failure.code === 1 ? "Allow location access in your browser and try again, or enter your address manually." : "Check your device location settings, or enter your address manually.",
      });
    }, { enableHighAccuracy: false, maximumAge: 300000, timeout: 15000 });
  };

  const currentLocationAction = (
    <button type="button" onClick={useCurrentLocation} disabled={locatingArea} className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary-hover disabled:cursor-wait disabled:opacity-60">
      {locatingArea ? <HiOutlineArrowPath className="h-3.5 w-3.5 animate-spin" /> : <HiOutlineMapPin className="h-3.5 w-3.5" />}
      {locatingArea ? "Finding your location…" : "Use current location"}
    </button>
  );

  const finish = async (profilePhotoUrl?: string) => {
    if (pending) return;
    const reportProfileIssue = (description: string) => toast.error("Please complete your profile", { description });
    if (name.trim().length < 3) { reportProfileIssue("Enter your full name as it appears on your certificates."); return; }
    if (!track) { reportProfileIssue("Choose whether you are a student, fresher, or working professional."); return; }
    if (track === "student" ? !course : !profession) { reportProfileIssue(track === "student" ? "Select your course to continue." : "Select your profession to continue."); return; }
    if (track !== "student" && (!specialty || (specialty === "Other" && customSpecialty.trim().length < 2))) { reportProfileIssue("Select a specialization, or enter one if you chose Other."); return; }
    if (!locationAddress.trim()) { reportProfileIssue("Enter your full address or use your current location."); return; }
    if (track === "professional" && (!years || !Number.isFinite(Number(years)) || Number(years) <= 0)) { reportProfileIssue("Enter a valid number of years of experience."); return; }
    if (dob && (dob < "1945-01-01" || dob > maxDob)) { reportProfileIssue("Check your date of birth. You must be at least 18 years old."); return; }
    if (track === "student") {
      if (college.trim().length < 3 || !studyYear || !graduation) { reportProfileIssue("Add your college, year of study, and expected graduation month."); return; }
      if (proof === "univ_reg" ? universityRegNo.trim().length < 5 : !proofFile) { reportProfileIssue(proof === "univ_reg" ? "Enter your university registration number." : "Upload your proof of study."); return; }
      if (!adultConfirmed) { reportProfileIssue("Confirm that you are at least 18 years old."); return; }
    }
    setPending(true);
    try {
      const isStudent = track === "student";
      const resolvedProfession = isStudent ? QUICK_COURSE_PROFESSION[course] : profession;
      const resolvedSpecialty = specialty === "Other" ? customSpecialty.trim() : specialty;
      let resolvedCity = city === "Other" ? customCity.trim() : city;
      let resolvedArea = area.trim();
      let resolvedState = locationState;
      if (!resolvedCity || !resolvedArea) {
        const lookup = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&q=${encodeURIComponent(locationAddress.trim())}`, {
          headers: { Accept: "application/json", "Accept-Language": "en" },
        });
        if (!lookup.ok) throw new Error("We could not identify the city from this address. Try using your current location or add the city to your address.");
        const matches = await lookup.json();
        const address = matches[0]?.address ?? {};
        if (!resolvedCity) resolvedCity = address.city || address.town || address.municipality || address.village || address.county || "";
        if (!resolvedArea) resolvedArea = address.neighbourhood || address.suburb || address.city_district || address.quarter || address.residential || "";
        if (!resolvedState) resolvedState = address.state || "";
      }
      if (!resolvedCity) throw new Error("We could not identify the city from this address. Add the city name to the address and try again.");
      const graduationYear = graduation ? Number(graduation.slice(0, 4)) : undefined;
      await onboardCandidate({
        referralCode: new URLSearchParams(window.location.search).get("ref")?.trim() || undefined,
        fullName: name.trim(), candidateLevel: isStudent ? "STUDENT" : track === "fresher" ? "FRESHER" : "PROFESSIONAL",
        city: resolvedCity, ...(resolvedArea ? { locality: resolvedArea } : {}), ...(resolvedState ? { state: resolvedState } : {}), addressLine: locationAddress.trim(), openToWork: !isStudent, ...(resolvedProfession ? { profession: resolvedProfession } : {}),
        ...(!isStudent && resolvedSpecialty ? { primarySpecialty: resolvedSpecialty } : {}),
        ...(isStudent ? { course, collegeName: college.trim(), studyYear, expectedGraduationYear: graduationYear, expectedGraduationMonth: graduation, universityRegNo: proof === "univ_reg" ? universityRegNo.trim() : undefined,
          ...(proof === "college_id" && proofFile ? { studentIdCardUrl: proofFile.data, studentIdCardFileName: proofFile.name } : {}),
          ...(proof === "bonafide" && proofFile ? { bonafideCertificateUrl: proofFile.data, bonafideCertificateFileName: proofFile.name } : {}) } : {}),
        ...(dob ? { dob } : {}), ...(gender ? { gender } : {}), ...(track === "professional" && years ? { experienceYears: years } : {}),
        ...(registration ? { councilRegistrationNumber: registration } : {}), skills,
        ...(profilePhotoUrl ? { profilePhotoUrl, profilePhotoFileName: "ProfilePhoto.jpg" } : {}),
        ...(resume ? { resumeUrl: resume.data, resumeFileName: resume.name } : {}),
      });
      setState({ onboarded: true, candidateLevel: track, portal: "candidate", profile: { name: name.trim(), level: track, cadreLevel: track, role: resolvedProfession || "", specialty: resolvedSpecialty, course, college, studyYear, expectedGraduationYear: graduationYear, expectedGraduationMonth: isStudent ? graduation : undefined, city: resolvedCity, area: resolvedArea, addressLine: locationAddress.trim(), state: resolvedState, dob, gender, openToWork: !isStudent, ...(profilePhotoUrl ? { avatar: profilePhotoUrl } : {}) } });
      toast.success(isStudent ? "Student profile submitted for verification" : "Profile submitted for verification", { description: isStudent ? "Your proof of study is ready for review." : "You can complete any remaining verification when you apply." });
      setShowPhotoModal(false);
      await navigate({ to: isStudent ? "/huddle" : "/home" });
    } catch (e) {
      toast.error("We couldn’t save your profile", { description: e instanceof Error ? e.message : "Please try again. If the issue continues, contact support." });
    }
    finally { setPending(false); }
  };

  const back = () => { setError(""); if (step > 0) setStep(step - 1); else { setPathway("choose"); setTrack(""); } };
  const continueFlow = () => {
    setError("");
    if (step === 0) {
      if (name.trim().length < 3) return setError("Enter your full name as it appears on your certificates.");
      setStep(1); return;
    }
    if (step === 1) { setStep(2); return; }
    if (track === "student") {
      if (!course) { toast.error("Course required", { description: "Select your course before continuing." }); return; }
      if (!locationAddress.trim()) { toast.error("Address required", { description: "Enter your full address or use your current location." }); return; }
      if (college.trim().length < 3 || !studyYear || !graduation) { toast.error("Study details required", { description: "Add your college, year of study, and expected graduation month." }); return; }
      if (proof === "univ_reg" ? universityRegNo.trim().length < 5 : !proofFile) { toast.error("Proof of study required", { description: proof === "univ_reg" ? "Enter a valid university registration number." : "Upload your college ID or bonafide certificate." }); return; }
      if (!adultConfirmed) { toast.error("Age confirmation required", { description: "Confirm that you are at least 18 years old to continue." }); return; }
    } else {
      if (!profession) { toast.error("Profession required", { description: "Select your profession before continuing." }); return; }
      if (!specialty || (specialty === "Other" && customSpecialty.trim().length < 2)) { toast.error("Specialization required", { description: "Select a specialization for your profession, or enter one if you chose Other." }); return; }
      if (!locationAddress.trim()) { toast.error("Address required", { description: "Enter your full address or use your current location." }); return; }
      if (track === "professional" && (!years || !Number.isFinite(Number(years)) || Number(years) <= 0)) { toast.error("Experience required", { description: "Enter a valid number of years of experience." }); return; }
    }
    if (dob && (dob < "1945-01-01" || dob > maxDob)) { toast.error("Check your date of birth", { description: "You must be at least 18 years old." }); return; }
    setShowPhotoModal(true);
  };
  const isStudent = pathway === "student";
  if (pathway === "choose") {
    return <CandidatePathwayChooser
      onSelectStudent={() => { setPathway("student"); setTrack("student"); setStep(0); setError(""); }}
      onSelectGraduate={() => { setPathway("graduate"); setTrack(""); setStep(0); setError(""); }}
    />;
  }
  return <>
  <OnboardingSetupFrame
    title={isStudent ? "Healthcare Student Onboarding" : "Healthcare Professional Onboarding"}
    steps={steps}
    current={step}
    category={isStudent ? "Student Verification" : "Profile Setup"}
    heading={isStudent ? (step === 0 ? "Personal details" : step === 1 ? "Course & college" : "Proof of study") : (step === 0 ? "Personal details" : step === 1 ? "Your profile" : "Your details")}
    description={isStudent ? (step === 0 ? "About you & where you live." : step === 1 ? "Tell us about your current studies." : "A person at The Fale checks your proof, usually within 24 hours.") : (step === 0 ? "How you appear" : step === 1 ? "Resume or fill in the essentials yourself." : "So we can show you the right jobs, rooms, and pay.")}
    error={error}
    onBack={back}
    onNext={continueFlow}
    nextLabel={step === 2 ? (isStudent ? "Create my account" : "Done") : "Save & continue"}
    pending={pending}
    onResume={!isStudent ? () => setResumeModalOpen(true) : undefined}
  >
    {step === 0 ? <FormSection icon={<HiOutlineUser className="h-4 w-4" />} title="Basic Information" subtitle="Official details as registered on your certificates and ID."><Field label="Full name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="As on your certificates" /></FormSection> : step === 1 ? isStudent ? <div className="space-y-8">
      <FormSection icon={<HiOutlineAcademicCap className="h-4 w-4" />} title="Course & college" subtitle="Share the course and college where you are currently enrolled.">
        <div className="grid gap-4 sm:grid-cols-2"><SelectField label="Course" required options={QUICK_STUDENT_COURSES} value={course} onChange={setCourse} placeholder="Select your course" /><Field label="College" required value={college} onChange={(e) => setCollege(e.target.value)} placeholder="Your college name" /><div className="sm:col-span-2"><label className="block"><Label required>Full address</Label><Textarea required rows={3} value={locationAddress} onChange={(e) => { setLocationAddress(e.target.value); setCity(""); setCustomCity(""); setArea(""); setLocationState(""); }} placeholder="Building, street, neighbourhood, city and state" className="min-h-24 resize-y rounded-xl bg-white text-sm focus-visible:ring-primary" /></label><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Include your neighbourhood and city so we can match you with nearby opportunities.</p>{currentLocationAction}</div></div><SelectField label="Year of study" required options={["1st year", "2nd year", "3rd year", "4th year", "Internship year"]} value={studyYear} onChange={setStudyYear} /><Field label="Expected graduation month" required type="month" value={graduation} onChange={(e) => setGraduation(e.target.value)} /></div>
      </FormSection>
    </div> : <FormSection icon={<HiOutlineSparkles className="h-4 w-4" />} title="Set up your profile" subtitle="Upload your resume for Ally to read, or fill in the essentials yourself."><div className="grid gap-3 sm:grid-cols-2"><button type="button" onClick={() => setResumeModalOpen(true)} className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary-soft/30 p-4 text-left transition-all hover:border-primary sm:p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white"><HiOutlineSparkles className="h-5 w-5" /></span><span><b className="block text-sm text-slate-900">Upload your resume</b><span className="mt-1 block text-xs leading-relaxed text-slate-500">Ally reads it. You check each detail before saving.</span></span></button><button type="button" onClick={() => setStep(2)} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left transition-all hover:border-primary sm:p-5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-slate-100 text-primary"><HiOutlinePencilSquare className="h-5 w-5" /></span><span><b className="block text-sm text-slate-900">Fill in myself</b><span className="mt-1 block text-xs leading-relaxed text-slate-500">Choose your profession and area.</span></span></button></div></FormSection> : isStudent ? <div className="space-y-8">
      <FormSection icon={<HiOutlineDocumentCheck className="h-4 w-4" />} title="Proof of study" subtitle="Choose one document or add your university registration number.">
        <SelectField label="Proof of study" required options={["College ID card", "Bonafide certificate", "University registration number"]} value={proof === "college_id" ? "College ID card" : proof === "bonafide" ? "Bonafide certificate" : "University registration number"} onChange={(value) => { setProof(value === "College ID card" ? "college_id" : value === "Bonafide certificate" ? "bonafide" : "univ_reg"); setProofFile(null); }} />
        {proof === "univ_reg" ? <><Field label="University registration number" required value={universityRegNo} onChange={(e) => setUniversityRegNo(e.target.value)} /><p className="text-xs text-slate-500">The FALE team reviews this number from your profile before approving your student verification.</p></> : <UploadBox label={proof === "bonafide" ? "Bonafide certificate" : "College ID card"} hint="Photo or PDF, up to 5 MB" file={proofFile?.name} onFile={(fileName, dataUrl) => setProofFile(fileName && dataUrl ? { name: fileName, data: dataUrl } : null)} />}
        <label className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-soft/30 p-3 text-sm text-slate-700"><input type="checkbox" checked={adultConfirmed} onChange={(e) => setAdultConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" />I confirm that I am 18 or older.</label>
      </FormSection>
      <FormSection icon={<HiOutlineInformationCircle className="h-4 w-4" />} title="What happens next" subtitle="A FALE credentialing officer reviews student proof, usually within 24 hours." />
    </div> : <div className="space-y-8">
      <FormSection icon={<HiOutlineBriefcase className="h-4 w-4" />} title="Your profile" subtitle="Choose the experience level that best describes you.">
        <SegmentedControl label="Experience" required options={["Fresher", "Experienced"]} value={track === "fresher" ? "Fresher" : track === "professional" ? "Experienced" : ""} onChange={(value) => setTrack(value === "Experienced" ? "professional" : "fresher")} />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Profession" required options={professions} value={profession} onChange={(value) => { setProfession(value); setSpecialty(""); setCustomSpecialty(""); }} placeholder="Select your profession" />
          <SelectField label="Specialization" required options={[...(departmentsByProfession[profession] ?? []), "Other"]} value={specialty} onChange={setSpecialty} placeholder={profession ? "Select your specialization" : "Select a profession first"} />
          {specialty === "Other" && <Field label="Your specialization" required value={customSpecialty} onChange={(e) => setCustomSpecialty(e.target.value)} placeholder="Enter your specialization" />}
          {track === "professional" && <Field label="Years of experience" required type="number" min="1" max="60" step="0.5" inputMode="decimal" value={years} onChange={(e) => setYears(e.target.value)} placeholder="e.g. 3" />}
        </div>
        <MultiSelectField label="Key clinical skills" itemLabel="skill" allowCustom optional options={skillsByProfession[profession] ?? []} value={skills} onChange={(value) => setSkills(value.split(",").map((skill) => skill.trim()).filter(Boolean))} placeholder={profession ? "Select or add your skills" : "Select a profession first"} hint="Choose a suggested skill or type your own and press Enter." />
        <div className="space-y-4 border-t border-slate-100 pt-5">
          <h3 className="text-sm font-bold text-slate-900">Location</h3>
          <div>
            <label className="block"><Label required>Full address</Label><Textarea required rows={3} value={locationAddress} onChange={(e) => { setLocationAddress(e.target.value); setCity(""); setCustomCity(""); setArea(""); setLocationState(""); }} placeholder="Building, street, neighbourhood, city and state" className="min-h-24 resize-y rounded-xl bg-white text-sm focus-visible:ring-primary" /></label>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2"><p className="text-xs text-muted-foreground">Include your neighbourhood and city so we can match you with nearby opportunities.</p>{currentLocationAction}</div>
          </div>
        </div>
      </FormSection>
      <FormSection icon={<HiOutlineUser className="h-4 w-4" />} title="A little more about you" subtitle="Optional details help us tailor your matches."><div className="grid gap-4 sm:grid-cols-2"><DateField label="Date of birth" value={dob} onChange={setDob} min="1945-01-01" max={maxDob} /><SegmentedControl label="Gender" options={["Female", "Male", "Other"]} value={gender} onChange={setGender} /></div></FormSection>
      <FormSection icon={<HiOutlineShieldCheck className="h-4 w-4" />} title="Verify when you apply" subtitle="Documents are checked when they’re needed. You can complete verification later." />
    </div>}
    {!isStudent && <ResumeParserModal open={resumeModalOpen} onClose={() => setResumeModalOpen(false)} onApplyData={applyResume} />}
  </OnboardingSetupFrame>
  {showPhotoModal && <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-2xl space-y-6" role="dialog" aria-modal="true" aria-labelledby="quick-profile-photo-title">
      <button type="button" onClick={() => setShowPhotoModal(false)} disabled={pending} className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-100" aria-label="Close profile photo prompt"><HiOutlineXMark className="h-5 w-5" /></button>
      <div className="text-center space-y-1.5 px-4 pt-1">
        <h2 id="quick-profile-photo-title" className="text-2xl font-black text-slate-900 tracking-tight">Add your profile photo</h2>
        <p className="text-sm text-slate-500">Add a clear photo to help employers recognize your profile. You can also do this later.</p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <button type="button" onClick={() => photoInputRef.current?.click()} className="relative grid h-28 w-28 cursor-pointer place-items-center overflow-hidden rounded-full border-4 border-primary/20 bg-primary-soft text-primary shadow-lg">
            {photoPreview ? <img src={photoPreview} alt="Profile preview" className="absolute inset-0 h-full w-full object-cover" /> : <span className="text-3xl font-black">{initials(name || "FALE")}</span>}
          </button>
          <button type="button" onClick={() => photoInputRef.current?.click()} className="absolute bottom-0 right-0 grid h-9 w-9 cursor-pointer place-items-center rounded-full border-2 border-white bg-primary text-white shadow-md" aria-label="Choose profile photo">
            <HiOutlineCamera className="h-4 w-4" />
          </button>
        </div>
        <input ref={photoInputRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          if (file.size > 5 * 1024 * 1024) { toast.error("Image too large. Please select a photo under 5 MB."); e.currentTarget.value = ""; return; }
          const reader = new FileReader();
          reader.onload = () => setPhotoPreview(String(reader.result || ""));
          reader.readAsDataURL(file);
        }} />
        <p className="text-xs font-medium text-slate-500">{photoPreview ? "Photo ready to save" : "Choose a JPG, PNG, or WebP image (max 5 MB)"}</p>
      </div>
      <div className="space-y-2">
        <Button type="button" disabled={pending} onClick={() => photoPreview ? void finish(photoPreview) : photoInputRef.current?.click()} className="w-full h-12 rounded-xl bg-primary text-white font-semibold">
          {pending ? "Creating your profile…" : photoPreview ? "Save photo & continue" : "Choose photo"}
        </Button>
        <button type="button" disabled={pending} onClick={() => void finish()} className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800">Skip for now</button>
      </div>
    </div>
  </div>}
  </>;
}
const FACILITY_AGREEMENT_TERMS = [
  ["What The Fale does", "Connects your facility with healthcare professionals for jobs, internships, and shifts. Your team makes hiring decisions."],
  ["Candidate credits", "Credits unlock professional contact details and resumes. They are paid in advance and are not refunded once used."],
  ["Placement fee", "A 5% fee on first-year annual CTC applies when a professional introduced through The Fale joins your facility, plus GST."],
  ["Introductions", "The placement fee applies to a hire within 12 months of an application, shortlist, or introduction through The Fale."],
  ["Shifts and payment", "Shift costs are charged through your wallet after hours are approved. Overdue invoices may pause new posts and introductions."],
  ["Replacement", "A replacement is provided at no further fee if a placed professional leaves within 30 days."],
] as const;

export function QuickFacilityOnboarding() {
  const navigate = useNavigate();
  const app = useApp();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [type, setType] = useState("");
  const [area, setArea] = useState("");
  const [beds, setBeds] = useState("");
  const [needs, setNeeds] = useState<string[]>(["Full-time hiring"]);
  const [hasBranches, setHasBranches] = useState(false);
  const [group, setGroup] = useState("");
  const [branch, setBranch] = useState("");
  const [contact, setContact] = useState("");
  const [designation, setDesignation] = useState("HR manager");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState(app.contact.replace(/\D/g, "").slice(-10));
  const [gst, setGst] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const loginPhone = app.contact.replace(/\D/g, "").slice(-10);
  const steps = [{ t: "Your facility", d: "Name, type, area" }, { t: "You & billing", d: "Contact, GSTIN" }, { t: "Agreement", d: "Plain terms" }];

  const next = async () => {
    if (pending) return;
    setError("");
    if (step === 0) {
      if (name.trim().length < 3 || !type || !area) return setError("Enter your facility name, type, and area.");
      if (beds && (!/^\d+$/.test(beds) || Number(beds) < 0)) return setError("Enter a valid number of beds.");
      setStep(1); return;
    }
    if (step === 1) {
      if (contact.trim().length < 2 || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || !/^[6-9]\d{9}$/.test(mobile)) return setError("Enter your name, valid work email, and 10-digit mobile number.");
      if (gst && !/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/.test(gst.toUpperCase())) return setError("Check the 15-character GSTIN.");
      setStep(2); return;
    }
    if (!accepted) return setError("Confirm that you are authorised to accept the agreement.");
    if (!codeSent || !/^\d{6}$/.test(code)) return setError("Request and enter the 6-digit signing code.");
    setPending(true);
    try {
      await onboardFacility({ hospitalName: name.trim(), facilityType: type, city: area, state: "Karnataka", beds: beds ? Number(beds) : 0, contactPerson: contact.trim(), designation, contactPhone: `+91${mobile}`, contactEmail: email.trim(), ...(gst ? { gst: gst.toUpperCase() } : {}), hiringNeeds: needs, ...(group.trim() ? { groupName: group.trim() } : {}), ...(branch.trim() ? { branchName: branch.trim() } : {}), agreementAccepted: true, agreementOtp: code });
      setState({ onboarded: true, portal: "facility", profile: { org: name.trim(), orgType: type, city: area, area, recruiter: contact.trim(), designation, email, mobile } });
      toast.success("Facility setup complete", { description: "Your facility profile is saved. Complete the required registration details and documents from your dashboard to request verification." });
      await navigate({ to: "/employer" });
    } catch (e) { setError(e instanceof Error ? e.message : "Could not save your facility. Please try again."); }
    finally { setPending(false); }
  };

  const sendSigningCode = async () => {
    if (pending) return;
    if (!/^[6-9]\d{9}$/.test(loginPhone)) return setError("Sign in with your mobile number to receive a signing code.");
    setPending(true); setError("");
    try { await sendOtp(loginPhone, "ROLE_FACILITY"); setCodeSent(true); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not send a signing code."); }
    finally { setPending(false); }
  };

  return <OnboardingSetupFrame
    title="Healthcare Facility Setup"
    steps={steps}
    current={step}
    category="Employer Verification"
    heading={step === 0 ? "Your facility" : step === 1 ? "You & billing" : "One simple agreement"}
    description={step === 0 ? "Name, type, area, and what you need." : step === 1 ? "Who we talk to, and where invoices go." : `Nothing to pay today. Accept once for ${name || "your facility"}.`}
    error={error}
    onBack={() => { setError(""); if (step > 0) setStep(step - 1); else navigate({ to: "/" }); }}
    onNext={() => void next()}
    nextLabel={step === 2 ? "Open my dashboard" : "Save & continue"}
    pending={pending}
  >
    {step === 0 ? <div className="space-y-8">
      <FormSection icon={<HiOutlineBuildingOffice2 className="h-4 w-4" />} title="Your facility" subtitle="Your profile builds as you enter the basics.">
        <Field label="Facility name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="As on your registration" />
        <SegmentedControl label="Do you have more than one branch?" options={["No, just this one", "Yes"]} value={hasBranches ? "Yes" : "No, just this one"} onChange={(v) => { const enabled = v === "Yes"; setHasBranches(enabled); if (!enabled) { setGroup(""); setBranch(""); } }} />
        {hasBranches && <div className="grid gap-4 sm:grid-cols-2"><Field label="Group or chain name" value={group} onChange={(e) => setGroup(e.target.value)} /><Field label="This branch" value={branch} onChange={(e) => setBranch(e.target.value)} /></div>}
        <div className="grid gap-4 sm:grid-cols-2"><SelectField label="Type" required options={["Multi-speciality hospital", "Nursing home", "Diagnostic lab", "Clinic", "Dialysis centre", "Home-care agency"]} value={type} onChange={setType} placeholder="Select type" /><SelectField label="Area" required options={QUICK_AREAS} value={area} onChange={setArea} placeholder="Select area" /><Field label="Beds (if any)" inputMode="numeric" value={beds} onChange={(e) => setBeds(e.target.value)} placeholder="e.g. 120" /></div>
      </FormSection>
      <FormSection icon={<HiOutlineBriefcase className="h-4 w-4" />} title="Hiring needs" subtitle="Choose all that apply."><div className="flex flex-wrap gap-2">{["Full-time hiring", "Internships", "Shifts"].map((item) => <button key={item} type="button" aria-pressed={needs.includes(item)} onClick={() => setNeeds(needs.includes(item) ? needs.filter((x) => x !== item) : [...needs, item])} className={cn("rounded-full border px-3 py-2 text-sm font-semibold transition-colors", needs.includes(item) ? "border-primary bg-primary-soft text-primary" : "border-slate-200 text-slate-600 hover:border-primary/40")}>{item}</button>)}</div></FormSection>
    </div> : step === 1 ? <FormSection icon={<HiOutlineUser className="h-4 w-4" />} title="Authorized contact" subtitle="Who we speak to about hiring and billing.">
      <div className="grid gap-4 sm:grid-cols-2"><Field label="Your name" required value={contact} onChange={(e) => setContact(e.target.value)} /><SelectField label="Your role" required options={["HR manager", "Nursing head", "Administrator", "Owner / director", "Group HR (all branches)"]} value={designation} onChange={setDesignation} /><Field label="Work email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} /><Field label="Mobile" required inputMode="numeric" maxLength={10} value={mobile} onChange={(e) => setMobile(e.target.value.replace(/\D/g, "").slice(0, 10))} /><Field label="GSTIN (optional)" value={gst} maxLength={15} onChange={(e) => setGst(e.target.value.toUpperCase())} /></div>
    </FormSection> : <div className="space-y-8">
      <FormSection icon={<HiOutlineDocumentCheck className="h-4 w-4" />} title="Service agreement" subtitle="Plain terms, accepted once for your facility.">
        <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 sm:p-5">{FACILITY_AGREEMENT_TERMS.map(([heading, content]) => <div key={heading} className="mb-3 last:mb-0"><b className="text-sm text-slate-800">{heading}</b><p className="mt-0.5 text-sm leading-relaxed text-slate-600">{content}</p></div>)}{showFullTerms && <p className="mt-3 border-t border-slate-200 pt-3 text-sm leading-relaxed text-slate-600">You agree to provide accurate role and pay details, treat professionals fairly and safely, and protect their personal data. Either party may end the agreement with 30 days’ notice. Fees already triggered remain payable. Karnataka law applies, with courts in Bengaluru having jurisdiction.</p>}</div>
        <button type="button" className="text-sm font-semibold text-primary hover:underline" onClick={() => setShowFullTerms(!showFullTerms)}>{showFullTerms ? "Show less" : "Read the full agreement"}</button>
        <label className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary-soft/30 p-3 text-sm text-slate-700"><input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5 h-4 w-4 accent-primary" /><span>I’m authorised to accept this for {name}.</span></label>
        <p className="text-xs text-slate-500">
          Signing as {contact}, {designation}. {loginPhone ? `The code is sent to your signed-in phone ending ${loginPhone.slice(-4)}.` : "A code will be sent to your signed-in phone."}
        </p>
        <div className="grid gap-3 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-end">
          <Button type="button" variant="outline" disabled={pending} onClick={() => void sendSigningCode()} className="h-[46px] w-full rounded-xl sm:w-auto">
            {codeSent ? "Resend signing code" : "Send signing code"}
          </Button>
          {codeSent && <Field className="w-full sm:w-44" label="6-digit signing code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} />}
        </div>
      </FormSection>
    </div>}
  </OnboardingSetupFrame>;
}
function Onboarding() {
  const search = Route.useSearch();
  const app = useApp();
  const role = (search.role || search.portal || app.portal || "candidate").toLowerCase();
  const isFacility = ["facility", "employer", "hire", "employ"].includes(role);
  const editing = search.mode === "edit" || search.edit === "true" || search.edit === true;
  if (editing || (app.signedIn && app.onboarded)) return <LegacyOnboarding />;
  return isFacility ? <QuickFacilityOnboarding /> : <QuickCandidateOnboarding />;
}

function LegacyOnboarding() {
  const onboardingAction = useConfirmedAction();
  const s = useApp();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const roleParam = (search?.role || search?.portal || "").toLowerCase();
  const isFacilityParam = roleParam === "facility" || roleParam === "employer" || roleParam === "hire" || roleParam === "employ";
  const isCandidateParam = roleParam === "candidate" || roleParam === "pro";

  useEffect(() => {
    const isEditMode = search?.mode === "edit" || search?.edit === "true" || search?.edit === true;
    if (isEditMode) {
      // User is editing existing profile from profile page - do not redirect to /home!
      return;
    }

    if (s.signedIn && s.onboarded) {
      if (s.portal === "facility") navigate({ to: "/employer" });
      else if (s.portal === "admin") navigate({ to: "/admin" });
      else navigate({ to: "/home" });
      return;
    }

    if (isFacilityParam && s.portal !== "facility") {
      setState({ portal: "facility" });
    } else if (isCandidateParam && s.portal !== "candidate") {
      setState({ portal: "candidate" });
    }
  }, [s.signedIn, s.onboarded, s.portal, isFacilityParam, isCandidateParam, navigate]);

  const f = isFacilityParam ? true : isCandidateParam ? false : s.portal === "facility";
  const [candidateStage, setCandidateStage] = useState<"choose" | "student" | "graduate">(() => {
    if (s.onboarded && s.candidateLevel === "student") return "student";
    if (s.onboarded && (s.candidateLevel === "fresher" || s.candidateLevel === "professional")) return "graduate";
    return "choose";
  });

  const steps = f
    ? facilitySteps
    : candidateStage === "student"
    ? studentSteps
    : candidateSteps;

  const [step, setStep] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showDigiLockerModal, setShowDigiLockerModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [showHospitalPhotoModal, setShowHospitalPhotoModal] = useState(false);
  const [facilityAgreementAccepted, setFacilityAgreementAccepted] = useState(false);
  const [facilityAgreementCodeSent, setFacilityAgreementCodeSent] = useState(false);
  const [facilityAgreementOtp, setFacilityAgreementOtp] = useState("");
  const [facilityAgreementError, setFacilityAgreementError] = useState("");
  const [facilityAgreementPending, setFacilityAgreementPending] = useState(false);
  const [hospitalPhotos, setHospitalPhotos] = useState<string[]>([]);
  const [hospitalLogoPreview, setHospitalLogoPreview] = useState<string>("");
  const hospitalLogoInputRef = useRef<HTMLInputElement>(null);
  const hospitalPhotosInputRef = useRef<HTMLInputElement>(null);

  const sendFacilityAgreementCode = async () => {
    if (facilityAgreementPending) return;
    const phone = s.contact.replace(/\D/g, "").slice(-10);
    if (!/^[6-9]\d{9}$/.test(phone)) {
      setFacilityAgreementError("Sign in with your mobile number to receive a signing code.");
      return;
    }
    setFacilityAgreementPending(true);
    setFacilityAgreementError("");
    try {
      await sendOtp(phone, "ROLE_FACILITY");
      setFacilityAgreementCodeSent(true);
    } catch (error) {
      setFacilityAgreementError(error instanceof Error ? error.message : "Could not send a signing code.");
    } finally {
      setFacilityAgreementPending(false);
    }
  };
  const [isButtonClicked, setIsButtonClicked] = useState(false);
  const [rippleCoords, setRippleCoords] = useState<{ x: number; y: number } | null>(null);

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setRippleCoords({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
    setIsButtonClicked(true);
    setTimeout(() => {
      setIsButtonClicked(false);
      setRippleCoords(null);
    }, 450);
  };

  // Isolate onboarding flow from dark mode
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";

    return () => {
      // Restore user theme when leaving onboarding
      applyTheme(getEffectiveTheme());
    };
  }, []);

  const [p, setP] = useState<P>(() => {
    const profile = (s.profile as P) || {};
    const isFresher = profile["fresher"] === true || profile["exp"] === "Fresher";
    return {
      mobile: s.contact.startsWith("+91") ? s.contact.replace(/^\+91\s*/, "") : "",
      email: s.contact.includes("@") && !s.contact.endsWith("@account") ? s.contact : "",
      course: "",
      studyYear: "",
      grad: "",
      proof: "college_id",
      univReg: "",
      adult: false,
      area: (profile["area"] as string) || (profile["city"] as string) || "",
      ...profile,
      fresher: isFresher,
    };
  });
  const [docs, setDocs] = useState<Record<string, string>>(s.docs);
  const [docDataUrls, setDocDataUrls] = useState<Record<string, string>>({});

  const setDocDataUrlEntry = (label: string, dataUrl?: string) => {
    setDocDataUrls((prev) => {
      const updated = { ...prev };
      if (dataUrl) {
        updated[label] = dataUrl;
      } else {
        delete updated[label];
      }
      return updated;
    });
  };
  const set = (k: string) => (v: unknown) => setP((x) => ({ ...x, [k]: v as string }));
  const str = (k: string) => (p[k] as string) ?? "";
  const arr = (k: string) => (p[k] as string[]) ?? [];
  const input = (k: string) => ({ value: str(k), onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k)(e.target.value) });


  const handleProfessionChange = (newRole: string) => {
    const allowedSkills = skillsByProfession[newRole] ?? [];
    const availableDepts = departmentsByProfession[newRole] ?? [];
    const allowedCouncils = getCouncilsForRole(newRole);
    setP((prev) => {
      const currentSkills = (prev["skills"] as string[]) ?? [];
      const allPredefinedSkills = Object.values(skillsByProfession).flat();
      const customSkills = currentSkills.filter((s) => !allPredefinedSkills.includes(s));
      const validSkills = Array.from(new Set([...currentSkills.filter((s) => allowedSkills.includes(s)), ...customSkills]));
      const currentDept = String(prev["specialty"] || "");
      const validDept = availableDepts.includes(currentDept) ? currentDept : (availableDepts[0] ?? "");
      const defaultCouncil = councilByProfession[newRole] || (allowedCouncils[0] ?? "");
      const currentCouncil = String(prev["council"] || "");
      const validCouncil = allowedCouncils.includes(currentCouncil) ? currentCouncil : defaultCouncil;
      const allowedQuals = qualificationsByProfession[newRole] ?? [];
      const currentQual = String(prev["qual"] || "");
      const validQual = allowedQuals.includes(currentQual) || currentQual === "Other" ? currentQual : "";
      return {
        ...prev,
        role: newRole,
        specialty: validDept,
        skills: validSkills,
        council: validCouncil,
        qual: validQual,
      };
    });
    setRegVerification(null);
  };

  const [verifyingReg, setVerifyingReg] = useState(false);
  const [regVerification, setRegVerification] = useState<{
    status: "ok" | "manual" | "not_found";
    num: string;
    aiNote?: string;
    confidence?: number;
  } | null>(null);

  const handleVerifyRegistration = async () => {
    const num = str("regNo").trim();
    if (!num) {
      toast.error("Please enter your registration number first.");
      return;
    }
    const currentRole = str("role") || "Doctor";
    const roleCouncils = getCouncilsForRole(currentRole);
    const defaultCouncil = councilByProfession[currentRole] || (roleCouncils[0] ?? "");
    const currentCouncil = roleCouncils.includes(str("council")) ? str("council") : defaultCouncil;
    const candidateName = str("name") || `${str("fn")} ${str("ln")}`.trim() || "Candidate";
    const role = currentRole;

    setVerifyingReg(true);

    try {
      const promptText = `Candidate Name: ${candidateName}. Role: ${role}. Council: ${currentCouncil}. Registration Number: ${num}. Verify registration number format, regulatory board compliance, and credentials standing.`;
      const aiRes = await executeAiTask({
        task: "kyc_precheck",
        prompt: promptText,
        role: "clinician",
        metadata: {
          council: currentCouncil,
          regNumber: num,
          candidateName,
          role,
        },
      });

      const structured = aiRes.structuredData as Record<string, any> | undefined;
      const aiText = (typeof structured?.assessment === "string" ? structured.assessment : aiRes.response) || "";
      const lower = (aiText + " " + JSON.stringify(structured || {})).toLowerCase();

      // Rule-based client-side format guard for obvious unformatted random digits
      const isPureDigits = /^\d{1,11}$/.test(num);
      const isNuid = /^\d{14}$/.test(num) || num.toUpperCase().startsWith("NUID");
      const clientFlaggedDummy = isPureDigits && !isNuid;

      const isFlagged = clientFlaggedDummy
        || structured?.status === "FLAGGED"
        || structured?.status === "FLAGGED_DISCREPANCY"
        || structured?.formatValid === false
        || lower.includes("discrepancy")
        || lower.includes("invalid")
        || lower.includes("does not conform")
        || lower.includes("lacks the required")
        || lower.includes("not found")
        || lower.includes("non-compliant");

      const reportedConfidence = typeof structured?.confidence === "number"
        ? Math.round(structured.confidence)
        : undefined;

      const noteText = isFlagged && clientFlaggedDummy && !aiText.includes("nomenclature")
        ? `Registration number '${num}' does not conform to ${currentCouncil} statutory nomenclature. It lacks the required council prefix (e.g. KSNC, KMC, TNC) or 14-digit NUID format.`
        : (aiText || structured?.recommendation || `Registration format audit completed for ${currentCouncil}.`);

      if (isFlagged) {
        setRegVerification({
          status: "not_found",
          num,
          aiNote: noteText,
          ...(reportedConfidence === undefined ? {} : { confidence: reportedConfidence }),
        });
        toast.error("Statutory Format Discrepancy Flagged", {
          description: "Lacks official council prefix. Please check certificate.",
        });
      } else {
        setRegVerification({
          status: "ok",
          num,
          aiNote: noteText,
          ...(reportedConfidence === undefined ? {} : { confidence: reportedConfidence }),
        });
        toast.success("Registration format pre-check completed", {
          description: "This is an AI format check. Council registration still requires verification.",
        });
      }
    } catch {
      setRegVerification({
        status: "manual",
        num,
        aiNote: "Registration format recorded. FALE compliance team will perform secondary audit.",
      });
      toast.info("Automatic pre-check is unavailable. You can submit your documents for manual review.");
    } finally {
      setVerifyingReg(false);
    }
  };

  // Multi-experience state matching thefale_website (19).html
  const [exps, setExps] = useState<WorkExperienceItem[]>(() => {
    if (Array.isArray(p["exps"]) && p["exps"].length > 0) {
      return (p["exps"] as unknown) as WorkExperienceItem[];
    }
    if (p["fresher"] || p["exp"] === "Fresher") {
      return [];
    }
    const emp = str("employer");
    const des = str("designation");
    if (emp || des) {
      return [
        {
          org: emp,
          role: des || designationPlaceholders[str("role")] || "Staff Nurse",
          fm: "4",
          fy: "2022",
          cur: true,
        },
      ];
    }
    return [
      {
        org: "",
        role: designationPlaceholders[str("role")] || "Staff Nurse",
        fm: "4",
        fy: "2022",
        cur: true,
      },
    ];
  });

  const totalExpMonths = useMemo(() => expMonths(exps), [exps]);

  const addExp = () => {
    setExps((prev) => [
      ...prev,
      {
        org: "",
        role: designationPlaceholders[str("role")] || "Staff Nurse",
        fm: "0",
        fy: String(new Date().getFullYear()),
        cur: prev.length === 0,
      },
    ]);
  };

  const removeExp = (idx: number) => {
    setExps((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateExp = (idx: number, key: keyof WorkExperienceItem, val: unknown) => {
    setExps((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [key]: val } : item))
    );
  };

  const save = () => {
    const isFresher = !!p["fresher"];
    const formattedExp = isFresher ? "Fresher" : fmtM(totalExpMonths);
    const profileToSave = {
      ...p,
      qual: p["qual"] === "Other" && p["qualOwn"] ? p["qualOwn"] : p["qual"],
      specialty: p["specialty"] === "Other" && p["deptOwn"] ? p["deptOwn"] : p["specialty"],
      fresher: isFresher,
      exps: isFresher ? [] : exps,
      exp: formattedExp,
      employer: isFresher ? "" : (exps[0]?.org || ""),
      designation: isFresher ? "" : (exps[0]?.role || ""),
      notice: isFresher ? "Immediately" : (str("notice") || "Immediately"),
      currentSalary: isFresher ? "" : str("currentSalary"),
    };
    setState({ profile: profileToSave as unknown as Record<string, string | boolean>, docs });
  };

  const handleFinishStudentOnboarding = async () => onboardingAction.run(async () => {
    const selectedCourseObj = STUDENT_COURSES.find((c) => c.label === str("course"));
    const inferredRole = selectedCourseObj ? selectedCourseObj.role : "Student";
    const proof = str("proof") || "college_id";
    const proofDoc = proof === "univ_reg" ? `University registration · ${str("univReg")}` : docs["Proof of study"] || "";
    const proofLabel = proof === "college_id"
      ? "College ID card"
      : proof === "bonafide"
      ? "Bonafide certificate"
      : `Univ Reg (${str("univReg")})`;

    const updatedProfile = {
      ...p,
      name: str("name").trim(),
      role: inferredRole,
      profession: inferredRole,
      course: str("course"),
      college: str("college").trim(),
      studyYear: str("studyYear"),
      grad: str("grad"),
      area: str("area"),
      city: str("area").split(",")[0]?.trim() || str("city") || "",
      proof,
      univReg: str("univReg"),
      mobile: str("mobile"),
      email: str("email"),
      fresher: true,
      level: "student",
      cadreLevel: "student",
      collegeStatus: "pending",
      regStatus: "none",
      degStatus: "none",
      otw: "off",
    };

    const finalDocs = {
      ...docs,
      "Proof of study": proofDoc,
    };

    {
      const studentResumeName = docs["Resume / CV"] || docs["CV / Resume"] || docs["Resume"] || undefined;
      const studentResumeUrl = docDataUrls["Resume / CV"] || docDataUrls["CV / Resume"] || docDataUrls["Resume"] || studentResumeName;
      const studentIdDocName = docs["Identity proof"] || undefined;
      const studentIdDocUrl = docDataUrls["Identity proof"] || studentIdDocName;
      const proofDocName = docs["Proof of study"];
      const proofDocUrl = docDataUrls["Proof of study"] || proofDocName;

      await onboardCandidate({
        referralCode: new URLSearchParams(window.location.search).get("ref")?.trim() || undefined,
        fullName: str("name").trim(),
        email: str("email") || undefined,
        gender: str("gender") || undefined,
        dob: str("dob") || undefined,
        city: str("area").split(",")[0]?.trim() || str("city") || "",
        state: str("state") || "",
        pincode: str("pincode") || undefined,
        addressLine: str("address") || undefined,
        candidateLevel: "STUDENT",
        course: str("course"),
        collegeName: str("college").trim(),
        studyYear: str("studyYear"),
        universityRegNo: str("univReg") || undefined,
        expectedGraduationYear: parseInt(str("grad")) || new Date().getFullYear() + 2,
        expectedGraduationMonth: /^\d{4}-(0[1-9]|1[0-2])$/.test(str("grad")) ? str("grad") : undefined,
        bonafideCertificateUrl: proof === "bonafide" ? (proofDocUrl) : undefined,
        bonafideCertificateFileName: proof === "bonafide" ? (proofDocName) : undefined,
        studentIdCardUrl: proof === "college_id" ? (proofDocUrl) : undefined,
        studentIdCardFileName: proof === "college_id" ? (proofDocName) : undefined,
        identityProofUrl: studentIdDocUrl,
        identityProofFileName: studentIdDocName,
        resumeUrl: studentResumeUrl,
        resumeFileName: studentResumeName,
        languages: arr("languages"),
        profilePhotoUrl: photoPreview || undefined,
        profilePhotoFileName: photoPreview ? "ProfilePhoto.jpg" : undefined,
      });
    }

    setState({
      onboarded: true,
      candidateLevel: "student",
      profile: updatedProfile as unknown as Record<string, string | boolean>,
      docs: finalDocs,
    });

    toast.success("Student profile submitted for verification!", {
      description: "Welcome to FALE Huddle & Clinical Mentorship. Proof under verification.",
    });

    navigate({ to: "/huddle" });
  });

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f && candidateStage === "student") {
      if (step === 0) {
        if (!str("name").trim() || str("name").trim().length < 3) {
          toast.error("Please enter your full name as on your college ID.");
          return;
        }
        if (!str("area").trim() && !str("city").trim()) {
          toast.error("Please enter or select where you live / current city.");
          return;
        }
        if (!str("mobile").trim()) {
          toast.error("Please provide your mobile number.");
          return;
        }
      } else if (step === 1) {
        if (!str("course")) {
          toast.error("Please select your enrolled medical or allied course.");
          return;
        }
        if (!str("college").trim() || str("college").trim().length < 3) {
          toast.error("Please enter your medical/allied college name.");
          return;
        }
        if (!str("studyYear")) {
          toast.error("Please select your current year of study.");
          return;
        }
        if (!str("grad")) {
          toast.error("Please pick your expected graduation month.");
          return;
        }
      } else if (step === 2) {
        const proof = str("proof") || "college_id";
        if (proof === "univ_reg") {
          const reg = str("univReg").trim();
          if (!reg || reg.length < 4) {
            toast.error("Please enter a valid university registration number.");
            return;
          }
        } else {
          if (!docs["Proof of study"]) {
            toast.error(`Please upload your ${proof === "bonafide" ? "bonafide certificate" : "college ID card"}.`);
            return;
          }
        }
      } else if (step === 3) {
        if (!p["adult"]) {
          toast.error("You must confirm you are 18 or older to join FALE.");
          return;
        }
        handleFinishStudentOnboarding();
        return;
      }

      save();
      if (step < steps.length - 1) {
        setStep(step + 1);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      return;
    }

    const isStudent = p["cadreLevel"] === "student";
    if (!f && step === 2 && !p["fresher"] && !isStudent) {
      if (!exps.length) {
        toast.error("Please add at least one work experience, or select 'I am a fresher'.");
        return;
      }
      const incomplete = exps.some((item) => !item.org.trim() || !item.role.trim());
      if (incomplete) {
        toast.error("Please fill in hospital name and designation for all experiences.");
        return;
      }
    }
    const requiredChoices = f
      ? (step === 3 ? ["departments"] : [])
      : step === 0 ? ["gender"] : step === 3 ? ["employmentType"] : [];
    if (requiredChoices.some((key) => !p[key] || (Array.isArray(p[key]) && p[key].length === 0))) {
      toast.error("Please complete all required selections."); return;
    }
    if (step === (f ? 2 : 4)) {
      const candidateLevel = (p["cadreLevel"] || "professional") as string;
      const missing = neededDocs(f ? "facility" : "candidate", str("role"), candidateLevel).filter((d) => !d.label.includes("optional") && !d.label.includes("if applicable") && !docs[d.label]);
      if (missing.length) { toast.error(`Please upload: ${missing.map((m) => m.label).join(", ")}`); return; }
    }
    save();
    if (step < steps.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      if (!f) {
        setShowPhotoModal(true);
      } else {
        if (!facilityAgreementAccepted) {
          setFacilityAgreementError("Accept the service agreement to continue.");
          return;
        }
        if (!facilityAgreementCodeSent || !/^\d{6}$/.test(facilityAgreementOtp)) {
          setFacilityAgreementError("Request and enter the 6-digit signing code.");
          return;
        }
        setShowHospitalPhotoModal(true);
      }
    }
  };

  const handleFinishOnboarding = async (uploadedPhoto?: string) => onboardingAction.run(async () => {
    const finalPhoto = uploadedPhoto || photoPreview;
    const isStudent = p["cadreLevel"] === "student" || p["level"] === "student";
    const isFresher = !isStudent && (!!p["fresher"] || p["cadreLevel"] === "fresher");
    const candidateLevel = isStudent ? "student" : isFresher ? "fresher" : "professional";
    const formattedExp = isStudent ? "Student" : isFresher ? "Fresher" : fmtM(totalExpMonths);
    const profileToSave = {
      ...p,
      qual: p["qual"] === "Other" && p["qualOwn"] ? p["qualOwn"] : p["qual"],
      specialty: p["specialty"] === "Other" && p["deptOwn"] ? p["deptOwn"] : p["specialty"],
      fresher: isFresher || isStudent,
      level: candidateLevel,
      cadreLevel: candidateLevel,
      exps: isFresher || isStudent ? [] : exps,
      exp: formattedExp,
      employer: isFresher || isStudent ? "" : (exps[0]?.org || ""),
      designation: isFresher || isStudent ? "" : (exps[0]?.role || ""),
      notice: isFresher || isStudent ? "Immediately" : (str("notice") || "Immediately"),
      currentSalary: isFresher || isStudent ? "" : str("currentSalary"),
      ...(finalPhoto ? { avatar: finalPhoto } : {}),
    };
    const finalDocs = { ...docs };
    if (finalPhoto) {
      finalDocs["Profile photo"] = finalPhoto;
    }

    if (!f) {
      let minSalary: number | undefined = undefined;
      let maxSalary: number | undefined = undefined;
      const salaryStr = str("salary");
      if (salaryStr) {
        const matches = salaryStr.replace(/,/g, "").match(/\d+/g);
        if (matches && matches.length >= 2) {
          minSalary = parseInt(matches[0]);
          maxSalary = parseInt(matches[1]);
        } else if (matches && matches.length === 1) {
          minSalary = parseInt(matches[0]);
        }
      }

      const prefCities = arr("preferredCity").length > 0
        ? arr("preferredCity")
        : (str("preferredCity") ? [str("preferredCity")] : undefined);

      const resolvedCollege = str("institution") || str("college") || undefined;
      const resolvedCourse = (p["qual"] === "Other" && p["qualOwn"] ? (p["qualOwn"] as string) : (p["qual"] as string)) || str("course") || undefined;
      const resolvedGradYear = parseInt(str("year")) || parseInt(str("grad")) || undefined;
      const resolvedUnivReg = str("univReg") || undefined;

      await onboardCandidate({
        referralCode: new URLSearchParams(window.location.search).get("ref")?.trim() || undefined,
        fullName: str("name").trim() || "Candidate",
        email: str("email") || undefined,
        gender: str("gender") || undefined,
        dob: str("dob") || undefined,
        city: str("city") || str("area")?.split(",")[0]?.trim() || "",
        state: str("state") || "",
        pincode: str("pincode") || undefined,
        addressLine: str("address") || undefined,
        candidateLevel: isStudent ? "STUDENT" : isFresher ? "FRESHER" : "PROFESSIONAL",
        collegeName: resolvedCollege,
        course: resolvedCourse,
        expectedGraduationYear: resolvedGradYear,
        expectedGraduationMonth: /^\d{4}-(0[1-9]|1[0-2])$/.test(str("grad")) ? str("grad") : undefined,
        universityRegNo: resolvedUnivReg,
        profession: str("role") || "Doctor",
        primarySpecialty: p["specialty"] === "Other" && p["deptOwn"] ? p["deptOwn"] : (p["specialty"] as string) || "General",
        qualification: p["qual"] === "Other" && p["qualOwn"] ? p["qualOwn"] : (p["qual"] as string) || "",
        council: str("council") || undefined,
        councilRegistrationNumber: str("regNo") || undefined,
        councilState: str("councilState") || str("state") || undefined,
        regYear: str("regYear") || undefined,
        experienceYears: formattedExp,
        bio: str("bio") || str("about") || undefined,
        expectedSalaryMinRupees: minSalary,
        expectedSalaryMaxRupees: maxSalary,
        currentSalary: str("currentSalary") || undefined,
        noticePeriod: str("notice") || "Immediately",
        employmentType: Array.isArray(p["employmentType"]) ? (p["employmentType"] as string[]).join(", ") : (p["employmentType"] as string) || "Full-time",
        availability: str("availability") || str("notice") || "Immediate",
        openToWork: !!p["shifts"] || !p["otw"] || p["otw"] === "on",
        relocate: !!p["relocate"],
        preferredCities: prefCities,
        skills: arr("skills"),
        languages: arr("languages"),
        profilePhotoUrl: finalPhoto || undefined,
        profilePhotoFileName: finalPhoto ? "ProfilePhoto.jpg" : undefined,
        resumeUrl: docDataUrls["Resume / CV"] || docDataUrls["CV / Resume"] || docDataUrls["Resume"] || docs["Resume / CV"] || docs["CV / Resume"] || docs["Resume"] || undefined,
        resumeFileName: docs["Resume / CV"] || docs["CV / Resume"] || docs["Resume"] || undefined,
        registrationCertificateUrl: docDataUrls["Professional registration"] || docDataUrls["State Council Registration"] || docDataUrls["Registration certificate"] || docDataUrls["NMC Certificate"] || docs["Professional registration"] || docs["State Council Registration"] || docs["Registration certificate"] || docs["NMC Certificate"] || undefined,
        registrationCertificateFileName: docs["Professional registration"] || docs["State Council Registration"] || docs["Registration certificate"] || docs["NMC Certificate"] || undefined,
        qualificationCertificateUrl: docDataUrls["Highest qualification certificate"] || docDataUrls["Degree certificate"] || docs["Highest qualification certificate"] || docs["Degree certificate"] || undefined,
        qualificationCertificateFileName: docs["Highest qualification certificate"] || docs["Degree certificate"] || undefined,
        identityProofUrl: docDataUrls["Identity proof"] || docs["Identity proof"] || undefined,
        identityProofFileName: docs["Identity proof"] || undefined,
      });
    }

    setState({
      onboarded: true,
      candidateLevel,
      profile: profileToSave as unknown as Record<string, string | boolean>,
      docs: finalDocs,
    });
    setShowPhotoModal(false);
    if (isStudent) {
      toast.success("Student profile submitted for verification!", {
        description: "Your proof of study has been sent to FALE. You can browse internships and ask mentors now.",
      });
      navigate({ to: "/huddle" });
    } else {
      toast.success("Profile submitted for verification", { description: "Review usually takes up to 48 hours." });
      navigate({ to: f ? "/employer" : "/profile" });
    }
  });

  const handleFinishHospitalOnboarding = async (primary?: string, gallery?: string[]) => onboardingAction.run(async () => {
    if (!facilityAgreementAccepted) {
      setFacilityAgreementError("Accept the service agreement to continue.");
      return;
    }
    if (!facilityAgreementCodeSent || !/^\d{6}$/.test(facilityAgreementOtp)) {
      setFacilityAgreementError("Request and enter the 6-digit signing code.");
      return;
    }
    setFacilityAgreementError("");
    const finalPrimary = primary || hospitalLogoPreview || (hospitalPhotos.length > 0 ? hospitalPhotos[0] : "");
    const finalPhotos = gallery || hospitalPhotos;
    const profileToSave = {
      ...p,
      ...(finalPrimary ? { avatar: finalPrimary, logo: finalPrimary } : {}),
      ...(finalPhotos.length > 0 ? { facilityPhotos: JSON.stringify(finalPhotos), facilityBanner: finalPhotos[0] } : {}),
    };
    const finalDocs = { ...docs };
    if (finalPrimary) {
      finalDocs["Hospital photo"] = finalPrimary;
    }
    if (finalPhotos.length > 0) {
      finalDocs["Facility photos"] = `${finalPhotos.length} photos uploaded`;
    }

    {
      try {
        const rawPhone = str("mobile") || s.contact.replace(/\D/g, "");
        const cleanDigits = rawPhone.replace(/\D/g, "").slice(-10);
        const contactPhone = cleanDigits.length === 10 ? `+91${cleanDigits}` : "";
        const contactEmail = str("email") || (s.contact.includes("@") ? s.contact : "");

        // Build document list directly in onboarding payload (exact candidate pattern)
        const facilityDocMapping: Record<string, string> = {
          "Facility registration / licence": "FACILITY_REGISTRATION",
          "GST certificate (if applicable)": "GST_CERTIFICATE",
          "GST certificate": "GST_CERTIFICATE",
          "Representative authorization": "REPRESENTATIVE_AUTHORIZATION",
          "NABH / NABL certificate": "NABH_CERTIFICATE",
          "NABH / NABL certificate (optional)": "NABH_CERTIFICATE",
          "Fire safety clearance": "FIRE_SAFETY",
          "Pollution control board clearance": "POLLUTION_CONTROL",
          "Bio-medical waste authorization": "BMW_AUTHORIZATION",
          "Hospital photo": "HOSPITAL_PHOTO",
        };

        const docsToUpload: { documentType: string; originalFileName: string; fileUrl: string }[] = [];
        for (const [docLabel, fileName] of Object.entries(finalDocs)) {
          if (!fileName) continue;
          const dataUrl = docDataUrls[docLabel];
          if (dataUrl && dataUrl.startsWith("data:")) {
            const docType = facilityDocMapping[docLabel] || docLabel.toUpperCase().replace(/[^A-Z0-9]/g, "_");
            docsToUpload.push({
              documentType: docType,
              originalFileName: fileName,
              fileUrl: dataUrl,
            });
          }
        }

        await onboardFacility({
          hospitalName: str("org").trim() || "Healthcare Facility",
          facilityType: str("orgType") || "Multispecialty Hospital",
          size: str("size") || undefined,
          about: str("about") || undefined,
          website: str("website") || undefined,
          city: str("city") || "",
          state: str("state") || "",
          pincode: str("pincode") || "600001",
          addressLine: str("address") || "Hospital Campus",
          beds: Math.max(1, parseInt(str("beds")) || 50),
          icuBeds: Math.max(0, parseInt(str("icuBeds")) || 0),
          licenseNumber: str("licence").trim() || "CEA-REG-PENDING",
          gst: str("gst") || undefined,
          nabhNumber: str("nabhNumber") || (docs["NABH / NABL certificate"] ? "NABH-ONBOARDING" : undefined),
          accreditationLevel: str("accreditationLevel") || (docs["NABH / NABL certificate"] ? "NABH Accredited" : "State Registered"),
          contactPerson: str("recruiter").trim(),
          designation: str("designation") || undefined,
          contactPhone,
          contactEmail: contactEmail.includes("@") ? contactEmail : "facility@thefale.com",
          agreementAccepted: true,
          agreementOtp: facilityAgreementOtp,
          departments: arr("departments"),
          hiringNeeds: arr("hiring"),
          logoUrl: finalPrimary || undefined,
          facilityPhotos: finalPhotos.length > 0 ? finalPhotos : undefined,
          facilityRegistrationUrl: docDataUrls["Facility registration / licence"],
          facilityRegistrationFileName: docs["Facility registration / licence"],
          gstCertificateUrl: docDataUrls["GST certificate (if applicable)"] || docDataUrls["GST certificate"],
          gstCertificateFileName: docs["GST certificate (if applicable)"] || docs["GST certificate"],
          representativeAuthorizationUrl: docDataUrls["Representative authorization"],
          representativeAuthorizationFileName: docs["Representative authorization"],
          nabhCertificateUrl: docDataUrls["NABH / NABL certificate"] || docDataUrls["NABH / NABL certificate (optional)"],
          nabhCertificateFileName: docs["NABH / NABL certificate"] || docs["NABH / NABL certificate (optional)"],
          documents: docsToUpload.length > 0 ? docsToUpload : undefined,
        });
      } catch (err: any) {
        throw err;
      }
    }

    setState({
      onboarded: true,
      portal: "facility",
      profile: profileToSave as Record<string, string | boolean>,
      docs: finalDocs,
    });
    setShowHospitalPhotoModal(false);
    toast.success("Facility profile submitted for verification", {
      description: "Hospital review usually takes under 24 hours.",
    });
    navigate({ to: "/employer" });
  });



  const handleApplyResumeData = (data: ParsedResumeData, fileName: string, fileDataUrl?: string) => {
    setP((prev) => {
      const updated: P = { ...prev };
      if (data.name) updated["name"] = data.name;
      if (data.email) updated["email"] = data.email;
      if (data.mobile) updated["mobile"] = data.mobile;
      if (data.dob) updated["dob"] = data.dob;
      if (data.gender) updated["gender"] = data.gender;
      if (data.city) updated["city"] = data.city;
      if (data.state) updated["state"] = data.state;
      if (data.pincode) updated["pincode"] = data.pincode;
      if (data.address) updated["address"] = data.address;
      if (data.languages && data.languages.length > 0) updated["languages"] = data.languages;
      if (data.role) updated["role"] = data.role;
      if (data.specialty) updated["specialty"] = data.specialty;
      if (data.council) updated["council"] = data.council;
      if (data.regNo) updated["regNo"] = data.regNo;
      if (data.regValid) updated["regValid"] = data.regValid;
      if (data.qual) updated["qual"] = data.qual;
      if (data.year) updated["year"] = data.year;
      if (data.institution) updated["institution"] = data.institution;
      if (data.exp) updated["exp"] = data.exp;
      if (data.employer) updated["employer"] = data.employer;
      if (data.designation) updated["designation"] = data.designation;
      if (data.notice) updated["notice"] = data.notice;
      if (data.preferredCity) updated["preferredCity"] = data.preferredCity;
      if (data.skills && data.skills.length > 0) updated["skills"] = data.skills;
      return updated;
    });

    setDocs((prev) => ({
      ...prev,
      "Resume / CV": fileName,
    }));
    if (fileDataUrl) {
      setDocDataUrls((prev) => ({
        ...prev,
        "Resume / CV": fileDataUrl,
      }));
    }

    if (data.employer || data.designation) {
      setExps([
        {
          org: data.employer || "",
          role: data.designation || data.role || "",
          fm: "1",
          fy: "2023",
          cur: true,
        },
      ]);
    }

    if (data.regNo) {
      setRegVerification({ status: "ok", num: data.regNo });
    }
  };



  const address = { address: str("address"), city: str("city"), state: str("state"), pincode: str("pincode") };
  const setAddress = (v: AddressValue) => setP((x) => ({ ...x, ...v } as P));
  const addressBlock = (
    <div className="space-y-4">
      <AddressField label={f ? "Registered address" : "Professional address"} value={address} onChange={setAddress} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" required {...input("city")} placeholder="Enter city" />
        <SelectField label="State" required options={indianStates} value={str("state")} onChange={set("state")} />
        <Field label="PIN code" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} {...input("pincode")} placeholder="Enter PIN code" />
      </div>
    </div>
  );

  const candidate: ReactNode[] = [
    <div className="space-y-8" key="c0">
      {/* Active Pathway Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-primary/20 bg-primary-soft/40 shadow-xs">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-xl bg-[#FFF4EC] text-[#FF5A1F] flex items-center justify-center shrink-0 border border-primary/20 mt-0.5">
            <RiStethoscopeLine className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-[13px] font-black text-foreground">
                Healthcare Graduate Pathway
              </span>
              <span className="rounded-full bg-primary text-white text-[10px] font-extrabold px-2.5 py-0.5 whitespace-nowrap shadow-2xs">
                Jobs &amp; Shifts
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Full-time hospital hiring, fast locum shifts, and council-verified credentials
            </p>
          </div>
        </div>
        <div className="pt-1 sm:pt-0 flex sm:block shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCandidateStage("choose");
              setStep(0);
            }}
            className="w-full sm:w-auto rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-white text-xs font-bold cursor-pointer transition-all h-8.5"
          >
            <HiArrowLeft className="h-3.5 w-3.5 mr-1" /> Change Pathway
          </Button>
        </div>
      </div>

      {/* Resume Auto-Fill Standout Hero Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/25 bg-gradient-to-r from-primary-soft/80 via-white to-amber-50/50 p-3.5 sm:p-6 shadow-sm w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 min-w-0">
          <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
            <span className="grid h-10 w-10 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-xl sm:rounded-2xl bg-primary text-white shadow-md shadow-primary/25">
              <BotMessageSquare className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="inline-flex items-center gap-1.5 text-sm sm:text-base font-bold text-slate-900 leading-snug">
                  <HiBolt className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0" />
                  <span>Auto-Fill Profile from Resume</span>
                </h3>
                <span className="inline-flex items-center rounded-full bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0">
                  Instant
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600 leading-normal sm:leading-relaxed break-words">
                Upload your CV (PDF or DOCX). Our intelligent healthcare parser will fetch your contact details, education, work experience, council registration, and clinical skills in seconds.
              </p>
              {docs["Resume / CV"] && (
                <div className="mt-2.5 inline-flex max-w-full items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800 border border-emerald-200 min-w-0">
                  <HiCheck className="h-3.5 w-3.5 text-emerald-600 stroke-[3] shrink-0" />
                  <span className="truncate">Active resume: {docs["Resume / CV"]}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center w-full sm:w-auto shrink-0 pt-0.5 sm:pt-0">
            <Button
              type="button"
              onClick={() => setShowResumeModal(true)}
              className="w-full sm:w-auto gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-primary/25 hover:bg-primary/95 transition-all cursor-pointer h-10"
            >
              <HiOutlineCloudArrowUp className="h-4 w-4 shrink-0" />
              <span className="truncate">{docs["Resume / CV"] ? "Re-parse Resume" : "Upload Resume & Auto-Fill"}</span>
            </Button>
          </div>
        </div>
      </div>

      <FormSection
        icon={<HiOutlineUser className="h-4 w-4" />}
        title="Basic Information"
        subtitle="Official details as registered on your certificates and ID"
      >
        <Field label="Full name" required icon={<HiOutlineUser />} {...input("name")} placeholder="Enter your full name" autoComplete="name" />
        <div className="grid gap-4 sm:grid-cols-2">
          <DateField label="Date of birth" required value={str("dob")} onChange={set("dob")} max="2008-12-31" />
          <SegmentedControl label="Gender" required options={["Female", "Male", "Other"]} value={str("gender")} onChange={set("gender")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <PhoneField label="Mobile number" required {...input("mobile")} />
          <Field label="Email address" required type="email" icon={<HiOutlineEnvelope />} {...input("email")} placeholder="Enter your email address" />
        </div>
      </FormSection>

      <div className="h-px bg-slate-100" />

      <FormSection
        icon={<HiOutlineMapPin className="h-4 w-4" />}
        title="Current Location"
        subtitle="Used to match you with nearby hospitals and clinic roles"
      >
        {addressBlock}
      </FormSection>

      <div className="h-px bg-slate-100" />

      <FormSection
        icon={<HiOutlineGlobeAlt className="h-4 w-4" />}
        title="Languages Known"
        subtitle="Languages you are comfortable conversing with patients and medical staff in"
      >
        <ChipGroup label="Languages you speak" multi options={["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Marathi", "Bengali"]} value={arr("languages")} onChange={set("languages")} />
      </FormSection>
    </div>,

    <div className="space-y-8" key="c1">
      <FormSection
        icon={<HiOutlineBriefcase className="h-4 w-4" />}
        title="Your Profession"
        subtitle="Select your clinical discipline and primary specialty"
      >
        <SelectField label="Profession" required options={professions} value={str("role") || "Doctor"} onChange={handleProfessionChange} />
        <SelectField
          label="Specialty / department"
          required
          options={(departmentsByProfession[str("role") || "Doctor"] ?? []).concat(["Other"])}
          value={str("specialty")}
          onChange={set("specialty")}
          placeholder="Select specialty or department"
        />
        {str("specialty") === "Other" && (
          <div className="animate-in fade-in duration-200">
            <Field
              label="Type your department"
              required
              {...input("deptOwn")}
              placeholder="e.g. Neonatal transport"
            />
          </div>
        )}
        <ChipGroup
          label="Key clinical skills"
          multi
          allowCustom
          customPlaceholder="Add a skill that's not listed"
          options={skillsByProfession[str("role") || "Doctor"] ?? []}
          value={arr("skills")}
          onChange={set("skills")}
        />
      </FormSection>

        {str("cadreLevel") === "student" ? (
        <>
          <div className="h-px bg-slate-100" />
          <FormSection
            icon={<HiOutlineAcademicCap className="h-4 w-4" />}
            title="Student & College Details"
            subtitle="Proof of active study replaces council registration for students"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="College / Institute name"
                required
                {...input("college")}
                placeholder="e.g. Manipal College of Nursing, Bengaluru"
              />
              <SelectField
                label="Current study year / status"
                required
                options={["1st Year", "2nd Year", "3rd Year", "Final Year", "Compulsory Rotatory Intern"]}
                value={str("studyYear") || "Final Year"}
                onChange={set("studyYear")}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Expected graduation year"
                required
                {...input("gradYear")}
                placeholder="e.g. 2027"
              />
              <Field
                label="College student roll / PRN number (optional)"
                {...input("rollNo")}
                placeholder="e.g. REG-2024-991"
              />
            </div>
            <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-3.5 text-xs text-sky-800 flex items-start gap-2.5">
              <HiOutlineShieldCheck className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Council registration is waived for students</p>
                <p className="mt-0.5 text-sky-700">
                  You do not need state council registration yet. Upload your College ID card or Bonafide letter in Documents. Once verified, you can immediately post in Huddle, book mentorship sessions, and apply for paid hospital internships.
                </p>
              </div>
            </div>
          </FormSection>
        </>
      ) : regulatedProfessions.includes(str("role") || "Doctor") ? (
        <>
          <div className="h-px bg-slate-100" />
          <FormSection
            icon={<HiOutlineIdentification className="h-4 w-4" />}
            title="Professional Registration"
            subtitle="Clinical registration council details for government verification"
          >
            {(() => {
              const currentRole = str("role") || "Doctor";
              const roleCouncils = getCouncilsForRole(currentRole);
              const defaultCouncil = councilByProfession[currentRole] || (roleCouncils[0] ?? "");
              const selectedCouncil = roleCouncils.includes(str("council")) ? str("council") : defaultCouncil;
              const onlineRegisterName = selectedCouncil ? (onlineCouncilRegisters[selectedCouncil] || getOnlineRegisterName(selectedCouncil)) : undefined;

              return (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 items-start">
                    <SelectField
                      label="Registration council"
                      required
                      options={roleCouncils}
                      value={selectedCouncil}
                      onChange={(val) => {
                        set("council")(val);
                        setRegVerification(null);
                      }}
                    />
                    <div className="space-y-1.5">
                      <span className="block text-[13px] font-semibold text-foreground">
                        Registration number <span className="text-destructive">*</span>
                      </span>
                      <div className="relative w-full">
                        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:h-[18px] [&_svg]:w-[18px]">
                          <HiOutlineIdentification />
                        </span>
                        <input
                          type="text"
                          value={str("regNo")}
                          onChange={(e) => {
                            set("regNo")(e.target.value);
                            if (regVerification?.num !== e.target.value) setRegVerification(null);
                          }}
                          placeholder={regNoPlaceholders[str("role")] || regNoPlaceholders["default"]}
                          className={cn(
                            "field-input h-[46px] rounded-xl pl-11 pr-20 text-sm font-medium font-mono uppercase tracking-wide transition-all w-full",
                            regVerification?.status === "ok" && "border-emerald-500 ring-2 ring-emerald-500/10",
                            regVerification?.status === "not_found" && "border-rose-400 ring-2 ring-rose-400/10",
                          )}
                        />
                        <button
                          type="button"
                          onClick={handleVerifyRegistration}
                          disabled={!str("regNo")?.trim() || verifyingReg}
                          className={cn(
                            "absolute right-3.5 top-1/2 -translate-y-1/2 text-[13px] font-bold no-underline transition-colors select-none",
                            regVerification?.status === "ok"
                              ? "text-emerald-600 hover:text-emerald-700 cursor-default"
                              : regVerification?.status === "not_found"
                              ? "text-rose-600 hover:text-rose-700 cursor-pointer"
                              : "text-primary hover:text-primary-hover cursor-pointer disabled:text-muted-foreground/50 disabled:cursor-not-allowed disabled:pointer-events-none",
                          )}
                        >
                          {verifyingReg ? (
                            <span className="inline-flex items-center gap-1.5">
                              <ButtonSpinner className="h-3.5 w-3.5 animate-spin" />
                              <span>Verifying...</span>
                            </span>
                          ) : regVerification?.status === "ok" ? (
                            "Verified"
                          ) : regVerification?.status === "not_found" ? (
                            "Flagged"
                          ) : (
                            "Verify"
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Real-time council check status banner (matching thefale_website (19).html) */}
                  {verifyingReg && (
                    <div className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary-soft/60 p-3 text-xs text-primary font-medium animate-in fade-in duration-200">
                      <ButtonSpinner className="h-4 w-4 animate-spin text-primary shrink-0" />
                      <span>Checking with the {onlineRegisterName || selectedCouncil}…</span>
                    </div>
                  )}

                  {!verifyingReg && regVerification?.status === "ok" && (
                    <div className="min-h-[105px] flex items-start gap-2.5 rounded-xl border border-primary/25 bg-primary-soft/50 p-3.5 text-xs text-foreground animate-in fade-in duration-200">
                      <BotMessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <b className="font-bold text-foreground">AI format pre-check • {regVerification.num}</b>
                          <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                            {regVerification.confidence !== undefined ? `${regVerification.confidence}% AI confidence` : "AI confidence not provided"}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-muted-foreground leading-relaxed max-h-[72px] overflow-y-auto pr-1.5 [scrollbar-width:thin] [scrollbar-color:rgba(255,90,0,0.3)_transparent]">
                          {cleanAiNote(regVerification.aiNote) || `Regulatory registration format validated against ${selectedCouncil} standards.`}
                        </p>
                        <span className="text-[10px] text-primary/90 font-semibold block">
                          Pre-checked by Ally • Final sign-off by FALE Compliance Desk
                        </span>
                      </div>
                    </div>
                  )}

                  {!verifyingReg && regVerification?.status === "manual" && (
                    <div className="min-h-[105px] flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary-soft/40 p-3.5 text-xs text-foreground animate-in fade-in duration-200">
                      <BotMessageSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div className="space-y-1 min-w-0 flex-1">
                        <b className="font-bold text-foreground">Format Verified • {regVerification.num}</b>
                        <p className="text-[11.5px] text-muted-foreground leading-relaxed max-h-[72px] overflow-y-auto pr-1.5 [scrollbar-width:thin] [scrollbar-color:rgba(255,90,0,0.3)_transparent]">
                          {cleanAiNote(regVerification.aiNote) || `${selectedCouncil} format recorded. Our compliance desk checks the original certificate within 24–48 hours.`}
                        </p>
                      </div>
                    </div>
                  )}

                  {!verifyingReg && regVerification?.status === "not_found" && (
                    <div className="min-h-[105px] flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-900 animate-in fade-in duration-200">
                      <HiOutlineXMark className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <b className="font-bold text-rose-950">Statutory Discrepancy Flagged • {regVerification.num}</b>
                          <span className="rounded-full bg-rose-600/10 border border-rose-300 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                            {regVerification.confidence !== undefined ? `${regVerification.confidence}% AI confidence` : "AI confidence not provided"}
                          </span>
                        </div>
                        <p className="text-[11.5px] text-rose-800 leading-relaxed max-h-[72px] overflow-y-auto pr-1.5 [scrollbar-width:thin] [scrollbar-color:rgba(225,29,72,0.3)_transparent]">
                          {cleanAiNote(regVerification.aiNote) || "Check your registration certificate. If correct, you may continue and our compliance team will audit by hand."}
                        </p>
                        <span className="text-[10px] text-rose-700/90 font-semibold block">
                          Pre-checked by Ally • Official council registration certificate re-upload required
                        </span>
                      </div>
                    </div>
                  )}

                  {!verifyingReg && !regVerification && (
                    <div className="flex items-center gap-2 rounded-xl border border-slate-200/80 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-500">
                      <HiOutlineMagnifyingGlass className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>
                        {onlineRegisterName
                          ? `Instant check available for this council (${onlineRegisterName}).`
                          : "We check the format now and the certificate by hand."}
                      </span>
                    </div>
                  )}
                </div>
              );
            })()}

            <DateField label="Valid until" optional value={str("regValid")} onChange={set("regValid")} />
          </FormSection>
        </>
      ) : (
        <Note>Your profession decides which credentials we request. Clinical registration is not required for non-regulated healthcare roles.</Note>
      )}
    </div>,

    <div className="space-y-8" key="c2">
      <FormSection
        icon={<HiOutlineAcademicCap className="h-4 w-4" />}
        title="Highest Education"
        subtitle="Your highest medical, healthcare or academic qualification"
      >
        <div className="grid gap-4 sm:grid-cols-2 items-start">
          <SelectField
            label="Highest qualification"
            required
            icon={<HiOutlineAcademicCap />}
            options={(qualificationsByProfession[str("role") || "Doctor"] ?? []).concat(["Other"])}
            value={str("qual")}
            onChange={set("qual")}
            placeholder={qualificationPlaceholders[str("role")] || "Select qualification"}
          />
          <Field label="Year of completion" required inputMode="numeric" pattern="(19|20)[0-9]{2}" maxLength={4} {...input("year")} placeholder="YYYY" />
        </div>
        {str("qual") === "Other" && (
          <div className="animate-in fade-in duration-200">
            <Field
              label="Type your qualification"
              required
              {...input("qualOwn")}
              placeholder="Type your qualification"
            />
          </div>
        )}
        <Field label="Institution / university" required {...input("institution")} placeholder="e.g. Govt College of Nursing, RGUHS" />
      </FormSection>

      <div className="h-px bg-slate-100" />

      <FormSection
        icon={<HiOutlineBriefcase className="h-4 w-4" />}
        title="Work Experience"
        subtitle="Every job counts, including internships"
      >
        {str("cadreLevel") === "student" ? (
          <div className="rounded-2xl border border-sky-200 bg-sky-50/70 p-4 text-xs text-sky-900 space-y-1">
            <p className="font-bold">Student clinical postings & ward training</p>
            <p className="text-sky-700">
              As a student, you do not need formal hospital employment history. Your college clinical rotatory postings are sufficient. You can apply directly for hospital internships and clinical mentorship.
            </p>
          </div>
        ) : (
          <Toggle
            label="I'm a fresher"
            desc="No work experience yet. You can still apply to fresher roles and shifts."
            checked={!!p["fresher"]}
            onChange={(val) => {
              setP((prev) => {
                const prevExp = typeof prev["exp"] === "string" ? prev["exp"] : "";
                return {
                  ...prev,
                  fresher: val,
                  exp: val ? "Fresher" : (prevExp === "Fresher" ? "" : prevExp),
                };
              });
              if (val) {
                setExps([]);
              } else if (exps.length === 0) {
                addExp();
              }
            }}
          />
        )}

        {!p["fresher"] && (
          <div className="space-y-4 pt-1 animate-in fade-in duration-200">
            {/* Total Experience Summary Pill */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary-soft/60 via-card to-primary-soft/30 p-3.5 shadow-2xs">
              <p className="text-xs text-foreground/80 max-w-[44ch] leading-relaxed font-medium">
                Add every hospital or clinic, including internships. We add up your total.
              </p>
              <div className="flex flex-col items-end rounded-xl bg-primary px-3.5 py-1.5 text-white shadow-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/85">Total experience</span>
                <b className="text-base sm:text-lg font-black text-white font-display leading-tight">{fmtM(totalExpMonths)}</b>
              </div>
            </div>

            {/* List of Experience Cards */}
            <div className="space-y-3.5">
              {exps.map((e, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4 space-y-3.5 shadow-xs transition-all animate-in fade-in"
                >
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-200/70">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white text-xs font-black shrink-0">
                      {idx + 1}
                    </span>
                    <b className="flex-1 font-bold text-sm text-foreground truncate">
                      {e.org || "New experience"}
                    </b>
                    {exps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeExp(idx)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                        title="Remove experience"
                      >
                        <HiOutlineTrash className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 items-start">
                    <Field
                      label="Hospital or clinic"
                      required
                      value={e.org}
                      onChange={(ev) => updateExp(idx, "org", ev.target.value)}
                      placeholder="e.g. Sunrise Hospital"
                    />
                    <Field
                      label="Designation"
                      required
                      value={e.role}
                      onChange={(ev) => updateExp(idx, "role", ev.target.value)}
                      placeholder={designationPlaceholders[str("role")] || "e.g. Staff Nurse"}
                    />

                    <div className="space-y-1.5">
                      <span className="block text-[13px] font-semibold text-foreground">
                        From <span className="text-destructive">*</span>
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        <SelectField
                          placeholder="Month"
                          options={MONTHS}
                          value={MONTHS[Number(e.fm ?? 0)]}
                          onChange={(mName) => updateExp(idx, "fm", String(MONTHS.indexOf(mName)))}
                        />
                        <SelectField
                          placeholder="Year"
                          options={YEARS}
                          value={e.fy}
                          onChange={(yVal) => updateExp(idx, "fy", yVal)}
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <span className="block text-[13px] font-semibold text-foreground">To</span>
                      {e.cur ? (
                        <div className="flex h-[46px] items-center gap-1.5 px-3.5 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200">
                          <HiOutlineClock className="h-4 w-4 text-emerald-600" />
                          Present
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-2">
                          <SelectField
                            placeholder="Month"
                            options={MONTHS}
                            value={e.tm !== undefined ? MONTHS[Number(e.tm)] : undefined}
                            onChange={(mName) => updateExp(idx, "tm", String(MONTHS.indexOf(mName)))}
                          />
                          <SelectField
                            placeholder="Year"
                            options={YEARS}
                            value={e.ty}
                            onChange={(yVal) => updateExp(idx, "ty", yVal)}
                          />
                        </div>
                      )}
                    </div>

                    <label className="flex items-center gap-2.5 text-sm font-semibold text-slate-700 sm:col-span-2 cursor-pointer select-none pt-1">
                      <input
                        type="checkbox"
                        checked={!!e.cur}
                        onChange={(ev) => updateExp(idx, "cur", ev.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary accent-primary cursor-pointer"
                      />
                      <span>I currently work here</span>
                    </label>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Experience Button */}
            <button
              type="button"
              onClick={addExp}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 bg-primary-soft/30 hover:bg-primary-soft/60 hover:border-primary text-primary font-bold text-sm transition-all cursor-pointer shadow-xs"
            >
              <HiPlus className="h-4 w-4" />
              {exps.length ? "Add another experience" : "Add your first experience"}
            </button>

            <div className="grid gap-4 pt-2 sm:grid-cols-2">
              <SelectField label="Notice period" required options={["Immediately", "15 days", "30 days", "60 days", "90 days"]} value={str("notice")} onChange={set("notice")} />
              <Field label="Current monthly salary" optional prefix="₹" inputMode="numeric" {...input("currentSalary")} placeholder="Enter monthly salary" />
            </div>
          </div>
        )}
      </FormSection>
    </div>,

    <div className="space-y-8" key="c3">
      <FormSection
        icon={<HiOutlineMapPin className="h-4 w-4" />}
        title="Role & Location Preferences"
        subtitle="Specify what kind of job matches you are looking for"
      >
        <MultiSelectField
          label="Preferred work locations"
          required
          options={indianCities}
          value={str("preferredCity")}
          onChange={set("preferredCity")}
          placeholder="Select preferred cities"
        />
        <ChipGroup label="Employment type" required multi options={["Full-time", "Part-time", "Contract", "Internship", "Per-shift"]} value={arr("employmentType")} onChange={set("employmentType")} />
        <ChipGroup label="Preferred shift" multi options={["Day", "Night", "Rotational", "Weekends"]} value={arr("shiftPref")} onChange={set("shiftPref")} />
      </FormSection>

      <div className="h-px bg-slate-100" />

      <FormSection
        icon={<HiOutlineDocumentCheck className="h-4 w-4" />}
        title="Compensation & Flexibility"
        subtitle="Set your expected earnings and schedule availability"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Expected monthly salary" required options={["₹15,000–₹30,000", "₹30,000–₹45,000", "₹45,000–₹75,000", "₹75,000+", "Open to discussion"]} value={str("salary")} onChange={set("salary")} />
          <SelectField label="Available to join" required options={["Immediately", "Within 15 days", "Within 30 days", "Within 60 days", "Within 90 days"]} value={str("availability")} onChange={set("availability")} />
        </div>
        <div className="divide-y divide-slate-100 pt-2">
          <Toggle label="Open to relocation" desc="Show me matching roles in other healthcare hubs" checked={!!p["relocate"]} onChange={set("relocate")} />
          <Toggle label="Open to FALE Shift" desc="Pick up verified, short paid shifts around your regular schedule" checked={!!p["shifts"]} onChange={set("shifts")} />
        </div>
      </FormSection>
    </div>,
  ];

  const facility: ReactNode[] = [
    <div className="space-y-8" key="f0">
      <FormSection
        icon={<HiOutlineUser className="h-4 w-4" />}
        title="Authorized Contact Details"
        subtitle="The primary administrator or HR manager managing hiring"
      >
        <Field label="Full name" required icon={<HiOutlineUser />} {...input("recruiter")} placeholder="Your full name" />
        <Field label="Designation" required {...input("designation")} placeholder="e.g. Head of HR, Medical Superintendent" />
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Work email" required type="email" icon={<HiOutlineEnvelope />} {...input("email")} placeholder="hr@hospital.com" />
          <PhoneField label="Mobile number" required {...input("mobile")} />
        </div>
      </FormSection>
    </div>,

    <div className="space-y-8" key="f1">
      <FormSection
        icon={<HiOutlineBuildingOffice2 className="h-4 w-4" />}
        title="Organization Details"
        subtitle="Registered hospital, clinic or diagnostic facility information"
      >
        <Field label="Registered organization name" required icon={<HiOutlineBuildingOffice2 />} {...input("org")} placeholder="e.g. Sunrise Multispeciality Hospital" />
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectField label="Organization type" required options={["Hospital", "Clinic", "Diagnostic centre", "Pharmacy", "Rehabilitation centre", "Other healthcare facility"]} value={str("orgType")} onChange={set("orgType")} />
          <SelectField label="Organization size" required options={["1–10 staff", "11–50 staff", "51–200 staff", "201–1000 staff", "1000+ staff"]} value={str("size")} onChange={set("size")} />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Number of beds" optional inputMode="numeric" {...input("beds")} placeholder="e.g. 150" />
          <Field label="ICU beds" optional inputMode="numeric" {...input("icuBeds")} placeholder="e.g. 20" />
          <Field label="Website" optional type="url" icon={<HiOutlineGlobeAlt />} {...input("website")} placeholder="https://" />
        </div>
      </FormSection>

      <div className="h-px bg-slate-100" />

      <FormSection
        icon={<HiOutlineMapPin className="h-4 w-4" />}
        title="Facility Location"
        subtitle="Physical location where candidates will be deployed"
      >
        {addressBlock}
      </FormSection>
    </div>,

    <div className="space-y-8" key="f2">
      <FormSection
        icon={<HiOutlineIdentification className="h-4 w-4" />}
        title="Registration & Tax Details"
        subtitle="Government registration proving legitimate healthcare operations"
      >
        <Field label="Facility registration / licence number" required icon={<HiOutlineIdentification />} {...input("licence")} placeholder="e.g. CEA/TN/2021/0049" />
        <Field label="GSTIN" optional pattern="[0-9A-Za-z]{15}" maxLength={15} {...input("gst")} placeholder="15-character GSTIN" hint="GST is supporting evidence for rapid verification." />
      </FormSection>
    </div>,

    <div className="space-y-8" key="f3">
      <FormSection
        icon={<HiOutlineBriefcase className="h-4 w-4" />}
        title="Hiring Profile & Needs"
        subtitle="Tell candidates about your hospital culture and hiring requirements"
      >
        <label className="block">
          <span className="mb-1.5 block text-[13px] font-semibold text-slate-700">
            About your organization <span className="text-destructive">*</span>
          </span>
          <textarea
            required
            rows={4}
            value={str("about")}
            onChange={(e) => set("about")(e.target.value)}
            placeholder="Describe your patient care philosophy, key specialties, and work environment…"
            className="field-input h-auto resize-none py-3 rounded-xl"
          />
        </label>
        <ChipGroup label="Primary departments" required multi options={["Emergency", "ICU", "OT", "Cardiology", "Pathology", "Radiology", "Pharmacy", "Pediatrics", "Front office"]} value={arr("departments")} onChange={set("departments")} />
        <ChipGroup label="What are you hiring for?" multi options={["Permanent roles", "Contract roles", "Per-shift cover", "Internships"]} value={arr("hiring")} onChange={set("hiring")} />
      </FormSection>
    </div>,
  ];

  const docsStep = (
    <div className="space-y-6">
      <FormSection
        icon={<HiOutlineDocumentCheck className="h-4 w-4" />}
        title="Upload Verification Documents"
        subtitle="Clear copies in PDF, JPG, or PNG under 10 MB"

      >
        <div className="grid gap-4">
          {neededDocs(f ? "facility" : "candidate", str("role")).map((d) => {
            if (!f && d.label === "Resume / CV") {
              return (
                <div key={d.label} className="space-y-2">
                  <UploadBox
                    label={d.label}
                    hint={d.hint}
                    required={true}
                    file={docs[d.label]}
                    onFile={(n, dataUrl) => {
                      setDocs((x) => {
                        const c = { ...x };
                        if (n) c[d.label] = n;
                        else delete c[d.label];
                        return c;
                      });
                      setDocDataUrls((x) => {
                        const c = { ...x };
                        if (dataUrl) c[d.label] = dataUrl;
                        else delete c[d.label];
                        return c;
                      });
                    }}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
                    <span className="text-slate-500">
                      {docs["Resume / CV"]
                        ? `Attached: ${docs["Resume / CV"]}`
                        : "Have a PDF or Word resume ready?"}
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowResumeModal(true)}
                      className="inline-flex items-center gap-1.5 font-bold text-primary hover:text-primary-hover hover:underline cursor-pointer"
                    >
                      <HiOutlineSparkles className="h-3.5 w-3.5" />
                      {docs["Resume / CV"]
                        ? "Re-parse & sync profile details"
                        : "Auto-fill profile details from resume"}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <UploadBox
                key={d.label}
                label={d.label}
                hint={d.hint}
                required={!d.label.includes("optional") && !d.label.includes("if applicable")}
                file={docs[d.label]}
                isDigiLocker={!f && d.label === "Identity proof"}
                onDigiLocker={() => setShowDigiLockerModal(true)}
                isVerified={d.label === "Identity proof" && !!docs[d.label]?.includes("DigiLocker")}
                onFile={(n, dataUrl) => {
                  setDocs((x) => {
                    const c = { ...x };
                    if (n) c[d.label] = n;
                    else delete c[d.label];
                    return c;
                  });
                  setDocDataUrlEntry(d.label, dataUrl);
                }}
              />
            );
          })}
        </div>
      </FormSection>
      <Note>
        Private documents are used exclusively for credential verification. Identity proofs and confidential registration papers are never shown publicly.
      </Note>
    </div>
  );

  const review = (
    <div className="space-y-6">
      {/* Structured Section Cards */}
      <div className="space-y-4">
        {f ? (
          /* ==================== FACILITY REVIEW CARDS ==================== */
          <>
            {/* Card 1: Authorized Contact */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs hover:border-slate-300 transition-all">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary mt-0.5">
                    <HiOutlineUser className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">Authorized Representative</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-normal mt-0.5">Primary recruiter & credentials contact</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(0)}
                  className="shrink-0 self-start gap-1 rounded-xl border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-primary-soft hover:text-primary hover:border-primary/30 transition-all cursor-pointer shadow-2xs h-8 whitespace-nowrap"
                >
                  <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>

              <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2 pt-1">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Full Name</span>
                  <p className="mt-0.5 text-xs sm:text-sm font-bold text-slate-900">{str("recruiter") || "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Designation</span>
                  <div className="mt-0.5">
                    <span className="inline-flex items-center rounded-md bg-white border border-slate-200 px-2 py-0.5 text-xs font-bold text-slate-800">
                      {str("designation") || "—"}
                    </span>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Work Email</span>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800 break-all">
                    <HiOutlineEnvelope className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {str("email") || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Mobile Phone</span>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800">
                    <HiOutlinePhone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    +91 {str("mobile") || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Organization & Campus */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs hover:border-slate-300 transition-all">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 mt-0.5">
                    <HiOutlineBuildingOffice2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">Organization & Campus</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-normal mt-0.5">Facility details & deployment location</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="shrink-0 self-start gap-1 rounded-xl border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-primary-soft hover:text-primary hover:border-primary/30 transition-all cursor-pointer shadow-2xs h-8 whitespace-nowrap"
                >
                  <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>

              {/* Organization Info Row */}
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
                  <div className="min-w-0">
                    <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Registered Name</span>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">{str("org") || "—"}</h4>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {str("orgType") && (
                      <span className="inline-flex items-center rounded-lg bg-sky-50 border border-sky-200 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-bold text-sky-800 shrink-0 whitespace-nowrap">
                        {str("orgType")}
                      </span>
                    )}
                    {str("size") && (
                      <span className="inline-flex items-center rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-slate-700 shrink-0 whitespace-nowrap">
                        {str("size")}
                      </span>
                    )}
                    {str("beds") && (
                      <span className="inline-flex items-center rounded-lg bg-emerald-50 border border-emerald-200 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-emerald-800 shrink-0 whitespace-nowrap">
                        {str("beds")} beds
                      </span>
                    )}
                  </div>
                </div>

                {str("website") && (
                  <div className="flex items-center gap-1.5 text-xs text-primary font-semibold">
                    <HiOutlineGlobeAlt className="h-3.5 w-3.5 shrink-0" />
                    <a href={str("website").startsWith("http") ? str("website") : `https://${str("website")}`} target="_blank" rel="noreferrer" className="hover:underline truncate">
                      {str("website")}
                    </a>
                  </div>
                )}

                {/* Campus Address Card */}
                <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 sm:p-3.5">
                  <div className="grid h-7 w-7 sm:h-8 sm:w-8 shrink-0 place-items-center rounded-lg bg-rose-50 text-rose-500 border border-rose-100 mt-0.5">
                    <HiOutlineMapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Campus Location</span>
                    <p className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-800 leading-snug break-words">
                      {str("address") || "Location not provided"}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {str("city") && (
                        <span className="inline-flex items-center rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 shrink-0 whitespace-nowrap">
                          {str("city")}
                        </span>
                      )}
                      {str("state") && (
                        <span className="inline-flex items-center rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700 shrink-0 whitespace-nowrap">
                          {str("state")}
                        </span>
                      )}
                      {str("pincode") && (
                        <span className="inline-flex items-center rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-700 shrink-0 whitespace-nowrap">
                          PIN: {str("pincode")}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3: Verification & Licences */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs hover:border-slate-300 transition-all">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 mt-0.5">
                    <HiOutlineShieldCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">Regulatory Verification & Licences</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-normal mt-0.5">Statutory registration & certificates</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(2)}
                  className="shrink-0 self-start gap-1 rounded-xl border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-primary-soft hover:text-primary hover:border-primary/30 transition-all cursor-pointer shadow-2xs h-8 whitespace-nowrap"
                >
                  <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>

              <div className="space-y-3">
                <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
                  <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/50 p-3 sm:p-3.5">
                    <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-emerald-800">Registration / Licence</span>
                    <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="font-mono text-xs sm:text-sm font-bold text-slate-900 tracking-wide break-all">{str("licence") || "Not entered"}</span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0 whitespace-nowrap">
                        <HiCheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Statutory
                      </span>
                    </div>
                  </div>

                  {str("gst") ? (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-3 sm:p-3.5">
                      <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-500">GSTIN</span>
                      <p className="mt-1 font-mono text-xs sm:text-sm font-bold text-slate-800 break-all">{str("gst")}</p>
                    </div>
                  ) : (
                    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-3 sm:p-3.5 flex items-center justify-between">
                      <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">GSTIN</span>
                      <span className="text-xs text-slate-400 italic">Not provided</span>
                    </div>
                  )}
                </div>

                {/* Attached Documents List */}
                <div className="pt-2">
                  <div className="mb-2 flex items-center justify-between gap-2 text-xs font-bold text-slate-700">
                    <span>Attached Documents</span>
                    <span className="inline-flex items-center rounded-full bg-primary-soft px-2.5 py-0.5 text-[10.5px] sm:text-[11px] font-bold text-primary shrink-0 whitespace-nowrap">
                      {Object.keys(docs).length} file(s)
                    </span>
                  </div>

                  {Object.keys(docs).length > 0 ? (
                    <div className="grid gap-2 sm:grid-cols-2">
                      {Object.entries(docs).map(([docType, fileName]) => {
                        const displayFile = fileName.startsWith("data:") ? "Photo file attached" : fileName;
                        return (
                          <div key={docType} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 overflow-hidden">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <div className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                                <HiOutlineDocumentCheck className="h-4 w-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-slate-800 truncate">{docType}</p>
                                <p className="text-[10px] text-slate-400 truncate">{displayFile}</p>
                              </div>
                            </div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0 whitespace-nowrap">
                              <HiCheck className="h-3 w-3 stroke-[3]" /> Attached
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-xs text-amber-800">
                      No documents attached yet. You can upload verification documents to speed up regulatory approval.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 4: Hiring Profile & Departments */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs hover:border-slate-300 transition-all">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 mt-0.5">
                    <HiOutlineBriefcase className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">Hiring Profile & Needs</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-normal mt-0.5">Departments & staffing models</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(3)}
                  className="shrink-0 self-start gap-1 rounded-xl border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-primary-soft hover:text-primary hover:border-primary/30 transition-all cursor-pointer shadow-2xs h-8 whitespace-nowrap"
                >
                  <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>

              <div className="space-y-3.5">
                <div>
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Clinical Departments Sourcing For
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {arr("departments").length > 0 ? (
                      arr("departments").map((d) => (
                        <span key={d} className="inline-flex items-center rounded-xl bg-primary-soft border border-primary/25 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-primary">
                          {d}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No departments specified</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Employment Models
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {arr("hiring").length > 0 ? (
                      arr("hiring").map((h) => (
                        <span key={h} className="inline-flex items-center rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-slate-700">
                          {h}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-slate-400 italic">No employment models specified</span>
                    )}
                  </div>
                </div>

                {str("about") && (
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 sm:p-3.5">
                    <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1">About Facility</span>
                    <p className="text-xs text-slate-700 leading-relaxed italic">
                      "{str("about")}"
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-primary-soft/30 p-4 sm:p-6 space-y-4">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">Facility service agreement</h3>
                <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-600">By continuing, you accept FALE’s terms for candidate introductions, hiring fees, candidate credits, shift bookings, and payment timelines. You confirm you are authorised to accept this agreement for {str("org") || "your facility"}.</p>
              </div>
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <input type="checkbox" checked={facilityAgreementAccepted} onChange={(event) => { setFacilityAgreementAccepted(event.target.checked); setFacilityAgreementError(""); }} className="mt-1 h-4 w-4 accent-primary" />
                <span>I’m authorised to accept the service agreement for this facility.</span>
              </label>
              <p className="text-xs text-slate-500">A signing code will be sent to your signed-in phone ending {s.contact.replace(/\D/g, "").slice(-4)}.</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <Button type="button" variant="outline" disabled={facilityAgreementPending} onClick={() => void sendFacilityAgreementCode()} className="rounded-xl">
                  {facilityAgreementPending ? "Sending…" : facilityAgreementCodeSent ? "Resend signing code" : "Send signing code"}
                </Button>
                {facilityAgreementCodeSent && <Field label="6-digit signing code" inputMode="numeric" maxLength={6} value={facilityAgreementOtp} onChange={(event) => setFacilityAgreementOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} />}
              </div>
              {facilityAgreementError && <p role="alert" className="text-sm text-destructive">{facilityAgreementError}</p>}
            </div>
          </>
        ) : (
          /* ==================== CANDIDATE REVIEW CARDS ==================== */
          <>
            {/* Card 0: Personal Details */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs hover:border-slate-300 transition-all">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary mt-0.5">
                    <HiOutlineUser className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">Personal Details</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-normal mt-0.5">Contact details & primary residence</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(0)}
                  className="shrink-0 self-start gap-1 rounded-xl border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-primary-soft hover:text-primary hover:border-primary/30 transition-all cursor-pointer shadow-2xs h-8 whitespace-nowrap"
                >
                  <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>

              <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Full Name</span>
                  <p className="mt-0.5 text-xs sm:text-sm font-bold text-slate-900">{str("name") || "—"}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Gender & Date of Birth</span>
                  <p className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-800">
                    {str("gender") || "—"} {str("dob") ? `· ${str("dob")}` : ""}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Mobile Phone</span>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800">
                    <HiOutlinePhone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    +91 {str("mobile") || "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Email Address</span>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800 break-all">
                    <HiOutlineEnvelope className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    {str("email") || "—"}
                  </p>
                </div>
              </div>

              {/* Location & Languages */}
              <div className="mt-3 space-y-2">
                <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
                  <HiOutlineMapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-slate-700 min-w-0 flex-1">
                    <span className="font-semibold text-slate-900 break-words">{str("address") || "Address on file"}</span>
                    {(str("city") || str("state") || str("pincode")) && (
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        {[str("city"), str("state"), str("pincode")].filter(Boolean).join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {arr("languages").length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
                    <span className="font-semibold text-slate-500 text-[11px]">Languages:</span>
                    <div className="flex flex-wrap gap-1">
                      {arr("languages").map((lang) => (
                        <span key={lang} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {lang}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 1: Profession & Registration */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs hover:border-slate-300 transition-all">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600 mt-0.5">
                    <HiOutlineBriefcase className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">Clinical Profession & Registration</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-normal mt-0.5">Discipline, specialty & council registration</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(1)}
                  className="shrink-0 self-start gap-1 rounded-xl border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-primary-soft hover:text-primary hover:border-primary/30 transition-all cursor-pointer shadow-2xs h-8 whitespace-nowrap"
                >
                  <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <span className="inline-flex items-center rounded-xl bg-primary-soft border border-primary/25 px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs font-bold text-primary shrink-0 whitespace-nowrap">
                    {str("role") || "Doctor"}
                  </span>
                  {str("specialty") && (
                    <span className="inline-flex items-center rounded-xl bg-slate-100 border border-slate-200 px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs font-bold text-slate-800 shrink-0 whitespace-nowrap">
                      {str("specialty")}
                    </span>
                  )}
                  {str("regNo") && (
                    <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 sm:px-3 sm:py-1 text-xs font-bold text-emerald-800 shrink-0 whitespace-nowrap">
                      <HiCheckCircle className="h-3.5 w-3.5 text-emerald-600" /> Reg: {str("regNo")}
                    </span>
                  )}
                </div>

                {str("council") && str("council") !== "Not applicable for my role" && (
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Council:</span> {str("council")}
                  </p>
                )}

                {arr("skills").length > 0 && (
                  <div>
                    <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                      Clinical Skills & Proficiencies
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {arr("skills").map((sk) => (
                        <span key={sk} className="rounded-lg bg-slate-100 border border-slate-200 px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-slate-700">
                          {sk}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Education & Experience */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs hover:border-slate-300 transition-all">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 mt-0.5">
                    <HiOutlineAcademicCap className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">Education & Work Experience</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-normal mt-0.5">Degree, institution & clinical history</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(2)}
                  className="shrink-0 self-start gap-1 rounded-xl border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-primary-soft hover:text-primary hover:border-primary/30 transition-all cursor-pointer shadow-2xs h-8 whitespace-nowrap"
                >
                  <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>

              <div className="space-y-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:p-3.5">
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Highest Qualification</span>
                  <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900">{str("qual") || "Medical Degree"}</span>
                    {str("year") && (
                      <span className="inline-flex items-center rounded-md bg-white border border-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-700 shrink-0 whitespace-nowrap">
                        Class of {str("year")}
                      </span>
                    )}
                  </div>
                  {str("institution") && (
                    <p className="mt-1 text-xs text-slate-600 font-medium">{str("institution")}</p>
                  )}
                </div>

                {/* Experience Summary */}
                <div>
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Clinical Career History
                  </span>
                  {p["fresher"] ? (
                    <div className="rounded-xl border border-sky-200 bg-sky-50/70 p-3 text-xs font-bold text-sky-800">
                      Fresher / Recent Graduate — Open to Entry Clinical Roles & Fellowships
                    </div>
                  ) : exps.length > 0 ? (
                    <div className="space-y-2">
                      {exps.map((e, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-white p-3 shadow-2xs">
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">{e.role}</p>
                            <p className="text-[11px] text-slate-500 truncate">{e.org}</p>
                          </div>
                          <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-semibold text-slate-700 shrink-0 whitespace-nowrap">
                            {MONTHS[Number(e.fm)]} {e.fy} — {e.cur ? "Present" : `${MONTHS[Number(e.tm || 0)]} ${e.ty || ""}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 italic">No previous experience logged</p>
                  )}
                </div>
              </div>
            </div>

            {/* Card 3: Job Preferences */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs hover:border-slate-300 transition-all">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-rose-50 text-rose-600 mt-0.5">
                    <HiOutlineClock className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">Preferences & Availability</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-normal mt-0.5">Preferred cities, shifts & salary</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(3)}
                  className="shrink-0 self-start gap-1 rounded-xl border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-primary-soft hover:text-primary hover:border-primary/30 transition-all cursor-pointer shadow-2xs h-8 whitespace-nowrap"
                >
                  <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>

              <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Preferred City</span>
                  <p className="mt-0.5 text-xs sm:text-sm font-bold text-slate-900">{str("preferredCity") || "Any City"}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Available to Join</span>
                  <p className="mt-0.5 text-xs sm:text-sm font-bold text-slate-900">{str("availability") || "Immediately"}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Expected Monthly Salary</span>
                  <p className="mt-0.5 text-xs sm:text-sm font-bold text-primary">{str("salary") || "Negotiable"}</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Employment Type</span>
                  <p className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-800">
                    {arr("employmentType").join(", ") || "Full-time"}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 4: Verified Documents */}
            <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs hover:border-slate-300 transition-all">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                  <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 mt-0.5">
                    <HiOutlineDocumentCheck className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">Documents & Credential Proof</h3>
                    <p className="text-[11px] sm:text-xs text-slate-500 leading-normal mt-0.5">DigiLocker verification & certificates</p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setStep(4)}
                  className="shrink-0 self-start gap-1 rounded-xl border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-primary-soft hover:text-primary hover:border-primary/30 transition-all cursor-pointer shadow-2xs h-8 whitespace-nowrap"
                >
                  <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
                </Button>
              </div>

              <div className="space-y-2">
                {docs["Identity proof"]?.includes("DigiLocker") && (
                  <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-2.5 sm:p-3 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <HiCheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span className="font-bold text-emerald-900 truncate">Identity proof verified via DigiLocker (UIDAI e-Aadhaar)</span>
                    </div>
                    <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800 shrink-0 whitespace-nowrap">
                      e-Verified
                    </span>
                  </div>
                )}

                {Object.entries(docs).map(([docType, fileName]) => {
                  const displayFile = fileName.startsWith("data:") ? "Photo file attached" : fileName;
                  return (
                    <div key={docType} className="flex items-center justify-between gap-2 rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 overflow-hidden">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <HiOutlineDocumentCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-800 truncate">{docType}</p>
                          <p className="text-[10px] text-slate-400 truncate">{displayFile}</p>
                        </div>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0 whitespace-nowrap">
                        Attached
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>

      {/* 3. Statutory Declaration & Consent Card */}
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary-soft/40 via-white to-emerald-50/30 p-4 sm:p-6 shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            required
            className="mt-1 h-5 w-5 accent-primary rounded cursor-pointer shrink-0"
          />
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-sm font-bold text-slate-900 block">
              {f ? "Authorized Institutional Declaration" : "Candidate Credential Declaration"}
            </span>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {f
                ? "I confirm I am an authorized representative of this registered healthcare institution. All submitted statutory licences and institutional operational details are genuine, authentic, and subject to regulatory verification."
                : "I confirm all submitted professional qualifications, clinical experiences, and registrations are accurate. I authorize FALE to verify my credentials directly against statutory state councils and official medical registries."}
            </p>
          </div>
        </label>
      </div>
    </div>
  );

  const studentBody: ReactNode[] = [
    // Step 0: Personal details & where you live
    <div className="space-y-6 sm:space-y-8" key="s0">
      {/* Student Pathway Status Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl border border-primary/20 bg-primary-soft/40 shadow-xs">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className="h-9 w-9 rounded-xl bg-[#FFF4EC] text-[#FF5A1F] flex items-center justify-center shrink-0 border border-primary/20 mt-0.5">
            <RiGraduationCapLine className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="text-xs sm:text-[13px] font-black text-foreground">
                Healthcare Student Pathway
              </span>
              <span className="rounded-full bg-primary text-white text-[10px] font-extrabold px-2.5 py-0.5 whitespace-nowrap shadow-2xs">
                Internships &amp; Mentorship
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
              Enrolled in medical or allied health college · Huddle ward discussions &amp; internships
            </p>
          </div>
        </div>
        <div className="pt-1 sm:pt-0 flex sm:block shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setCandidateStage("choose");
              setStep(0);
            }}
            className="w-full sm:w-auto rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-white text-xs font-bold cursor-pointer transition-all h-8.5"
          >
            <HiArrowLeft className="h-3.5 w-3.5 mr-1" /> Change Pathway
          </Button>
        </div>
      </div>

      <FormSection
        icon={<HiOutlineUser className="h-4 w-4" />}
        title="Student Information"
        subtitle="As printed on your college ID card and enrollment registry"
      >
        <Field
          label="Full name"
          required
          icon={<HiOutlineUser />}
          {...input("name")}
          placeholder="As on your college ID"
          autoComplete="name"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <PhoneField label="Mobile number" required {...input("mobile")} />
          <Field
            label="Email address"
            required
            type="email"
            icon={<HiOutlineEnvelope />}
            {...input("email")}
            placeholder="e.g. rahul@college.edu or rahul@gmail.com"
          />
        </div>
      </FormSection>

      <div className="h-px bg-slate-100" />

      <FormSection
        icon={<HiOutlineMapPin className="h-4 w-4" />}
        title="Where you live"
        subtitle="Helps recommend verified student internships and nearby hospital postings"
      >
        {addressBlock}
      </FormSection>
    </div>,

    // Step 1: Course & college details
    <div className="space-y-6 sm:space-y-8" key="s1">
      <FormSection
        icon={<RiGraduationCapLine className="h-4 w-4" />}
        title="Academic Enrollment"
        subtitle="Select your healthcare discipline and recognized institution"
      >
        <SelectField
          label="Course"
          required
          icon={<HiOutlineAcademicCap />}
          options={STUDENT_COURSES.map((c) => c.label)}
          value={str("course")}
          placeholder="Select your course"
          onChange={set("course")}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="College"
            required
            icon={<HiOutlineBuildingLibrary />}
            {...input("college")}
            placeholder="Enter your college name"
          />

          <SelectField
            label="Year of study"
            required
            icon={<HiOutlineCalendar />}
            options={STUDENT_YEARS}
            value={str("studyYear")}
            onChange={set("studyYear")}
            placeholder="Select year of study"
          />
        </div>

        <div className="space-y-1.5">
          <DateField
            label="Expected to graduate"
            required
            placeholder="Select expected graduation date"
            value={str("grad")}
            onChange={set("grad")}
            min={`${new Date().getFullYear() - 1}-01-01`}
            max={`${new Date().getFullYear() + 10}-12-31`}
          />
          <p className="text-[11px] text-slate-400">
            Hospitals use this to invite final years and interns to full-time interviews ahead of exam results.
          </p>
        </div>
      </FormSection>
    </div>,

    // Step 2: Proof of study
    <div className="space-y-6 sm:space-y-8" key="s2">
      <div className="rounded-2xl border border-primary/20 bg-primary-soft/60 p-4 text-xs text-slate-700 space-y-1">
        <div className="flex items-center gap-2 font-bold text-slate-900">
          <HiOutlineInformationCircle className="h-4 w-4 text-primary shrink-0" />
          <span>Manual Human Verification</span>
        </div>
        <p className="text-slate-600 leading-relaxed text-[11px]">
          A FALE credentialing officer verifies your student document within 24 hours. Once verified, you get the blue Verified Student badge on Huddle.
        </p>
      </div>

      <FormSection
        icon={<HiOutlineShieldCheck className="h-4 w-4" />}
        title="Proof of Study"
        subtitle="Choose one method to verify your college status"
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STUDENT_PROOFS.map((proof) => {
            const isSelected = (str("proof") || "college_id") === proof.id;
            return (
              <button
                key={proof.id}
                type="button"
                onClick={() => set("proof")(proof.id)}
                className={cn(
                  "p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between relative select-none",
                  isSelected
                    ? "border-[#FF5A1F] bg-[#FFF4EC] shadow-sm ring-2 ring-[#FF5A1F]/15 dark:bg-primary/10 dark:border-primary"
                    : "border-slate-200 bg-white hover:border-[#FF5A1F]/40 hover:bg-[#FFF4EC]/20 dark:border-border dark:bg-card dark:hover:border-primary/40"
                )}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={cn(
                        "text-xs font-bold leading-snug",
                        isSelected
                          ? "text-[#FF5A1F] dark:text-primary"
                          : "text-slate-900 dark:text-foreground"
                      )}
                    >
                      {proof.label}
                    </span>
                    {isSelected ? (
                      <div className="h-5 w-5 rounded-full bg-[#FF5A1F] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <HiCheck className="h-3.5 w-3.5 stroke-[2.5]" />
                      </div>
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-slate-300 dark:border-border shrink-0" />
                    )}
                  </div>
                  <p
                    className={cn(
                      "text-[11px] mt-1.5 leading-snug",
                      isSelected
                        ? "text-slate-700 dark:text-slate-300 font-medium"
                        : "text-slate-500 dark:text-muted-foreground"
                    )}
                  >
                    {proof.desc}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Proof Field */}
        {(str("proof") || "college_id") === "univ_reg" ? (
          <Field
            label="Registration number"
            required
            {...input("univReg")}
            placeholder="Enter your university registration number"
          />
        ) : (
          <UploadBox
            label="Upload a photo or PDF"
            hint="Up to 5 MB"
            file={docs["Proof of study"]}
            onFile={(fileName: string | undefined, dataUrl?: string) => {
              setDocs((previous) => {
                const updated = { ...previous };
                if (fileName) updated["Proof of study"] = fileName;
                else delete updated["Proof of study"];
                return updated;
              });
              setDocDataUrls((previous) => {
                const updated = { ...previous };
                if (dataUrl) updated["Proof of study"] = dataUrl;
                else delete updated["Proof of study"];
                return updated;
              });
            }}
          />
        )}
      </FormSection>
    </div>,

    // Step 3: Review & statutory declaration
    <div className="space-y-6 sm:space-y-8" key="s3">
      {/* Student Pathway Profile Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl border border-primary/20 bg-primary-soft/40 shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="h-12 w-12 rounded-2xl bg-primary-soft text-primary font-black text-lg flex items-center justify-center shrink-0 border border-primary/25">
            {initials(str("name") || "ST")}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">{str("name") || "Student Candidate"}</h3>
              <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold">
                Healthcare Student
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{str("course") || "Healthcare Course"} · {str("studyYear") || "Student"}</p>
          </div>
        </div>
      </div>

      {/* Structured Section Cards matching Candidate and Facility review */}
      <div className="space-y-4">
        {/* Card 0: Personal Details & Location */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs hover:border-slate-300 transition-all">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary mt-0.5">
                <HiOutlineUser className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">Personal Details &amp; Residence</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-normal mt-0.5">Contact details &amp; where you live</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(0)}
              className="shrink-0 self-start gap-1 rounded-xl border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-primary-soft hover:text-primary hover:border-primary/30 transition-all cursor-pointer shadow-2xs h-8 whitespace-nowrap"
            >
              <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>

          <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Full Name</span>
              <p className="mt-0.5 text-xs sm:text-sm font-bold text-slate-900">{str("name") || "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Mobile Phone</span>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800">
                <HiOutlinePhone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                +91 {str("mobile") || "—"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:col-span-2">
              <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Email Address</span>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-800 break-all">
                <HiOutlineEnvelope className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                {str("email") || "—"}
              </p>
            </div>
          </div>

          {/* Location box */}
          <div className="mt-3">
            <div className="flex items-start gap-2.5 sm:gap-3 rounded-xl border border-slate-200/80 bg-slate-50/80 p-3">
              <HiOutlineMapPin className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="text-xs text-slate-700 min-w-0 flex-1">
                <span className="font-semibold text-slate-900 break-words">{str("address") || str("area") || "Address on file"}</span>
                {(str("city") || str("state") || str("pincode")) && (
                  <p className="text-slate-500 text-[11px] mt-0.5">
                    {[str("city"), str("state"), str("pincode")].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Card 1: Academic Enrollment */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs hover:border-slate-300 transition-all">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600 mt-0.5">
                <RiGraduationCapLine className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">Academic Enrollment</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-normal mt-0.5">Healthcare course, college &amp; expected graduation</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              className="shrink-0 self-start gap-1 rounded-xl border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-primary-soft hover:text-primary hover:border-primary/30 transition-all cursor-pointer shadow-2xs h-8 whitespace-nowrap"
            >
              <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>

          <div className="grid gap-2.5 sm:gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:col-span-2">
              <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Course / Discipline</span>
              <p className="mt-0.5 text-xs sm:text-sm font-bold text-slate-900">{str("course") || "Healthcare Course"}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">College / Institution</span>
              <p className="mt-0.5 text-xs sm:text-sm font-bold text-slate-900">{str("college") || "—"}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
              <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Year of Study</span>
              <p className="mt-0.5 text-xs sm:text-sm font-semibold text-slate-800">{str("studyYear") || "1st year"}</p>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 sm:col-span-2">
              <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400">Expected Graduation</span>
              <p className="mt-0.5 text-xs sm:text-sm font-bold text-primary">{str("grad") || "—"}</p>
            </div>
          </div>
        </div>

        {/* Card 2: Proof of Study */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-xs hover:border-slate-300 transition-all">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
              <div className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 mt-0.5">
                <HiOutlineShieldCheck className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">Proof of Study</h3>
                <p className="text-[11px] sm:text-xs text-slate-500 leading-normal mt-0.5">Verification document &amp; registry credentials</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(2)}
              className="shrink-0 self-start gap-1 rounded-xl border-slate-200 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-primary-soft hover:text-primary hover:border-primary/30 transition-all cursor-pointer shadow-2xs h-8 whitespace-nowrap"
            >
              <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
            </Button>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 sm:p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white border border-slate-200 text-emerald-600 shadow-2xs">
                <HiOutlineDocumentCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] sm:text-[10.5px] font-bold uppercase tracking-wider text-slate-400 block">
                  {str("proof") === "univ_reg" ? "University Registration Number" : str("proof") === "bonafide" ? "Bonafide Certificate" : "College ID Card"}
                </span>
                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate mt-0.5">
                  {str("proof") === "univ_reg" ? str("univReg") || "—" : docs["Proof of study"] || "college-id-card.jpg"}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 text-[11px] font-bold text-emerald-700 shrink-0">
              <HiCheck className="h-3.5 w-3.5 stroke-[2.5]" /> Attached
            </span>
          </div>

          <div className="mt-3 rounded-xl border border-primary/20 bg-primary-soft/40 p-3 text-xs text-slate-600 space-y-0.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 text-[11px]">
              <HiOutlineInformationCircle className="h-3.5 w-3.5 text-primary shrink-0" />
              <span>Manual Human Verification</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-snug">
              A FALE credentialing officer will review and verify your student proof within 24 hours.
            </p>
          </div>
        </div>
      </div>

      {/* Statutory 18+ Adult Declaration */}
      <div className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary-soft/40 via-white to-emerald-50/30 p-4 sm:p-6 shadow-sm">
        <label className="flex items-start gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!p["adult"]}
            onChange={(e) => set("adult")(e.target.checked)}
            required
            className="mt-1 h-5 w-5 accent-primary rounded cursor-pointer shrink-0"
          />
          <div className="space-y-1 min-w-0 flex-1">
            <span className="text-sm font-bold text-slate-900 block">
              I am 18 or older &amp; Student Credential Declaration
            </span>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              The Fale is for adults only. I confirm that I am currently enrolled in the specified college and course. I authorize FALE credentialing officers to verify my enrollment credentials directly with my college registrar.
            </p>
          </div>
        </label>
      </div>
    </div>,
  ];

  const body = f
    ? [facility[0], facility[1], <div className="space-y-8" key="f2-wrap">{facility[2]}{docsStep}</div>, facility[3], review][step]
    : candidateStage === "student"
    ? studentBody[step]
    : [...candidate, docsStep, review][step];

  const pct = Math.round(((step + 1) / steps.length) * 100);

  return (
    <div
      className={cn(
        "light min-h-screen text-slate-900 transition-colors",
        candidateStage === "choose" ? "bg-white" : "bg-[#f8fafc]"
      )}
      data-theme="light"
    >
      <RequestError message={onboardingAction.error} />
      {/* Top Professional Sticky Header (Apple/LinkedIn inspired) */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="hidden sm:block h-5 w-px bg-slate-200" />
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-slate-500">
              {f
                ? "Healthcare Facility Setup"
                : candidateStage === "choose"
                ? "Career Gateway"
                : candidateStage === "student"
                ? "Healthcare Student Onboarding"
                : "Healthcare Professional Onboarding"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Candidate Resume Auto-fill trigger in header */}
            {!f && candidateStage === "graduate" && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowResumeModal(true)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-full border-primary/30 text-xs font-bold text-primary hover:bg-primary-soft hover:text-primary transition-all cursor-pointer shadow-2xs"
              >
                <HiOutlineSparkles className="h-3.5 w-3.5" />
                Auto-fill from Resume
              </Button>
            )}

            {/* Auto-saved badge */}
            {candidateStage !== "choose" && (
              <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </span>
                Auto-saved
              </div>
            )}

            {candidateStage === "choose" ? (
              <Link
                to="/"
                aria-label="Back to sign in"
                title="Back to sign in"
                className="group flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all cursor-pointer border border-slate-200"
              >
                <HiArrowLeft className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
                <span>Sign in</span>
              </Link>
            ) : (
              <button
                type="button"
                aria-label="Exit setup"
                title="Exit profile setup"
                onClick={() => setShowExitModal(true)}
                className="group p-2 text-primary hover:text-primary-hover hover:bg-primary-soft/70 rounded-xl transition-all cursor-pointer"
              >
                <LogOut className="h-5 w-5 stroke-[2.2] transition-transform group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
        </div>
        {/* Mobile progress line */}
        {candidateStage !== "choose" && (
          <div className="h-1 bg-slate-100 lg:hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </header>

      {!f && candidateStage === "choose" ? (
        <CandidatePathwayChooser
          onSelectStudent={() => {
            setCandidateStage("student");
            setStep(0);
            setP((prev) => ({
              ...prev,
              cadreLevel: "student",
              level: "student",
              fresher: true,
              exp: "Student",
            }));
          }}
          onSelectGraduate={() => {
            setCandidateStage("graduate");
            setStep(0);
            setP((prev) => ({
              ...prev,
              cadreLevel: "professional",
              level: "professional",
            }));
          }}
        />
      ) : (
        /* Main Grid: Stepper Sidebar + Master Form Card */
        <div className="mx-auto grid max-w-6xl gap-6 lg:gap-8 px-3.5 py-6 sm:px-6 sm:py-8 lg:grid-cols-[290px_minmax(0,1fr)] items-start">
        {/* Left Stepper Sidebar - Sticky on page scroll without separate scrollbar */}
        <aside className="hidden lg:block select-none self-start sticky top-[84px] space-y-4 z-20">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)]">
            {/* Header with progress */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                {f ? "Facility Setup" : candidateStage === "student" ? "Student Profile" : "Your Profile"}
              </span>
              <span className="inline-flex items-center rounded-full bg-primary-soft border border-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                {pct}% complete
              </span>
            </div>

            {/* Progress Bar */}
            <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-orange-400 transition-all duration-500 shadow-sm shadow-primary/25"
                style={{ width: `${pct}%` }}
              />
            </div>

            {/* Steps Timeline with connected vertical line */}
            <div className="relative mt-7 space-y-2">
              <div className="absolute left-[26px] -translate-x-1/2 top-5 bottom-5 w-[2px] bg-slate-200/80 z-0 pointer-events-none" />

              {steps.map((st, i) => {
                const isCurrent = i === step;
                const isCompleted = i < step;
                const isPending = i > step;

                return (
                  <div key={st.t} className="relative z-10">
                    <button
                      type="button"
                      disabled={isPending}
                      onClick={() => setStep(i)}
                      className={cn(
                        "group flex w-full items-start gap-3 rounded-2xl p-2.5 text-left transition-all",
                        isCurrent && "bg-primary-soft/60 border border-primary/25 shadow-sm",
                        isCompleted && "hover:bg-slate-50 cursor-pointer",
                        isPending && "cursor-not-allowed",
                      )}
                    >
                      {/* Step Badge - 100% solid opaque with ring to cover the line */}
                      <span
                        className={cn(
                          "relative z-20 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-transform group-hover:scale-105",
                          isCompleted && "bg-emerald-600 text-white shadow-sm ring-4 ring-white",
                          isCurrent && "bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-primary/15",
                          isPending && "border border-slate-300 bg-white text-slate-400 ring-4 ring-white",
                        )}
                      >
                        {isCompleted ? <HiCheck className="h-4 w-4 stroke-[2.5]" /> : i + 1}
                      </span>

                      {/* Step Text */}
                      <div className="pt-0.5 min-w-0">
                        <span
                          className={cn(
                            "block text-sm font-bold leading-tight truncate",
                            isCurrent && "text-primary",
                            isCompleted && "text-slate-900",
                            isPending && "text-slate-400",
                          )}
                        >
                          {st.t}
                        </span>
                        <span
                          className={cn(
                            "mt-0.5 block text-xs leading-normal line-clamp-1",
                            isPending ? "text-slate-400/80" : "text-slate-500",
                          )}
                        >
                          {st.d}
                        </span>
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Credential Verification Trust Badge (Apple/LinkedIn style) */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 text-xs text-slate-600 space-y-2 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <HiOutlineShieldCheck className="h-4 w-4 text-primary shrink-0" />
              Verified Healthcare Network
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Credentials and registrations are verified directly with state councils and hospital boards.
            </p>
          </div>
        </aside>

        {/* Right Form Main Area: Single Elevated Master Card */}
        <form onSubmit={next} className="w-full min-w-0">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-8 lg:p-10 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] transition-all">
            {/* Card Header */}
            <div className="border-b border-slate-100 pb-6 mb-7">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft border border-primary/20 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
                  Step {step + 1} of {steps.length}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  {f
                    ? "Employer Verification"
                    : candidateStage === "student"
                    ? "Student Verification"
                    : "Profile Setup"}
                </span>
              </div>
              <h1 className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                {steps[step]?.t}
              </h1>
              <p className="mt-1.5 text-sm sm:text-base text-slate-500">
                {steps[step]?.d}
              </p>
            </div>

            {/* Form Step Body with smooth slide-in */}
            <div key={step} className="animate-in fade-in-50 slide-in-from-right-4 duration-300 ease-out">
              {body}
            </div>

            {/* Card Action Footer */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 rounded-xl border-slate-300 font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] transition-all cursor-pointer"
                onClick={() => {
                  if (step > 0) {
                    setStep(step - 1);
                  } else if (!f && candidateStage !== "choose") {
                    setCandidateStage("choose");
                  } else {
                    navigate({ to: "/" });
                  }
                }}
              >
                <HiArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                type="submit"
                size="lg"
                disabled={onboardingAction.isPending}
                onClick={handleButtonClick}
                className={cn(
                  "relative overflow-hidden w-full sm:w-auto group gap-2.5 rounded-xl bg-primary px-8 font-semibold text-white shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 hover:bg-primary/95 transition-all cursor-pointer select-none",
                  isButtonClicked && "animate-click-pop"
                )}
              >
                {/* Click Flash & Ripple - Triggers ONLY when clicked */}
                {isButtonClicked && (
                  <>
                    <span className="animate-click-flash" aria-hidden="true" />
                    {rippleCoords && (
                      <span
                        className="animate-click-ripple"
                        style={{ left: rippleCoords.x, top: rippleCoords.y }}
                        aria-hidden="true"
                      />
                    )}
                  </>
                )}

                <span className="relative z-10 font-semibold tracking-wide">
                  {step === steps.length - 1
                    ? candidateStage === "student"
                      ? "Create my account"
                      : "Submit for verification"
                    : "Save & continue"}
                </span>

                <span
                  className={cn(
                    "relative z-10 flex items-center transition-transform duration-200",
                    isButtonClicked ? "translate-x-2 text-white" : "group-hover:translate-x-1"
                  )}
                >
                  <HiArrowRight className="h-4 w-4 stroke-[2.2]" />
                </span>
              </Button>
            </div>

            {/* Security Guarantee */}
            <div className="mt-5 flex items-center justify-center px-2">
              <p className="flex items-start sm:items-center justify-center gap-1.5 text-left sm:text-center text-[11px] leading-normal text-slate-400">
                <HiOutlineShieldCheck className="h-3.5 w-3.5 shrink-0 mt-0.5 sm:mt-0 text-slate-400" />
                <span>
                  Protected by 256-bit SSL encryption. Documents are strictly used for credentialing.
                </span>
              </p>
            </div>
          </div>
        </form>
      </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with smooth blur */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setShowExitModal(false)}
          />

          {/* Modal Container */}
          <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-7 shadow-2xl shadow-slate-900/15 animate-in zoom-in-95 fade-in duration-200">
            {/* Close X Button */}
            <button
              type="button"
              onClick={() => setShowExitModal(false)}
              className="absolute right-5 top-5 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors"
            >
              <HiOutlineXMark className="h-5 w-5" />
            </button>

            {/* Brand Icon Badge */}
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-soft text-primary">
              <LogOut className="h-6 w-6 stroke-[2.2] text-primary" />
            </div>

            {/* Modal Content */}
            <h3 className="text-xl font-bold text-slate-900">
              Exit Profile Setup?
            </h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              Your details are automatically saved at each step. You can log back in with your mobile number anytime to pick up right where you left off.
            </p>

            {/* Auto-saved Reassurance Badge */}
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3.5 py-2.5 text-xs font-semibold text-slate-700 border border-slate-100">
              <span className="relative flex h-2 w-2">
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              <span>Step {step + 1} of {steps.length} saved ({pct}% complete)</span>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row items-center justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full sm:w-auto rounded-xl border-slate-200 font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                onClick={() => setShowExitModal(false)}
              >
                Continue Setup
              </Button>
              <Button
                type="button"
                className="w-full sm:w-auto rounded-xl bg-primary px-5 font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary/95 cursor-pointer"
                onClick={() => {
                  save();
                  setShowExitModal(false);
                  navigate({ to: "/" });
                }}
              >
                Exit to Login
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Official DigiLocker Verification Modal */}
      <DigiLockerModal
        open={showDigiLockerModal}
        onClose={() => setShowDigiLockerModal(false)}
        candidateName={str("name")}
        candidateMobile={str("mobile")}
        onSuccess={(fileName) => {
          setDocs((prev) => ({ ...prev, "Identity proof": fileName }));
        }}
      />

      {/* Resume Auto-Fill Parser Modal */}
      <ResumeParserModal
        open={showResumeModal}
        onClose={() => setShowResumeModal(false)}
        onApplyData={handleApplyResumeData}
      />

      {/* Post-Review Candidate Profile Photo Modal */}
      {showPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl rounded-b-none border-t border-x-0 border-b-0 sm:rounded-3xl sm:border border-slate-200/90 bg-white p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:p-8 shadow-2xl space-y-6 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Mobile Sheet Grab Handle */}
            <div className="mx-auto -mt-2 mb-2 h-1.5 w-12 rounded-full bg-slate-300 sm:hidden" />

            {/* Close / Skip X Button */}
            <button
              type="button"
              onClick={() => handleFinishOnboarding()}
              className="absolute right-4 top-4 sm:right-5 sm:top-5 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors z-10"
              title="Skip for now"
            >
              <HiOutlineXMark className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1.5 px-6 sm:px-4 pt-1">
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Add your profile photo
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed max-w-sm mx-auto">
                Profiles with a clear photo receive up to <strong>3x more interview requests</strong> and shift bookings.
              </p>
            </div>

            {/* Circular Avatar Uploader with perfectly positioned, unclipped camera badge */}
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="relative inline-block">
                <div
                  onClick={() => photoInputRef.current?.click()}
                  className="relative h-28 w-28 sm:h-32 sm:w-32 rounded-full border-4 border-primary/20 bg-primary-soft text-primary shadow-lg cursor-pointer overflow-hidden transition-all hover:scale-[1.02] hover:border-primary flex items-center justify-center"
                >
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl sm:text-4xl font-black text-primary select-none">
                      {initials(str("name") || "FALE")}
                    </span>
                  )}

                  {/* Subtle hover overlay */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold">
                    <HiOutlineCamera className="h-6 w-6 mb-0.5" />
                    <span>{photoPreview ? "Change" : "Upload"}</span>
                  </div>
                </div>

                {/* External camera badge - never clipped by overflow-hidden */}
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full bg-primary text-white border-2 border-white shadow-md hover:bg-primary-hover hover:scale-105 transition-all cursor-pointer"
                  title={photoPreview ? "Change photo" : "Upload photo"}
                >
                  <HiOutlineCamera className="h-4 w-4 stroke-[2.2]" />
                </button>
              </div>

              {/* Hidden file input */}
              <input
                ref={photoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Image too large. Please select a photo under 5 MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    const res = reader.result as string;
                    setPhotoPreview(res);
                  };
                  reader.readAsDataURL(file);
                }}
              />

              <p className="text-xs font-medium text-slate-500 text-center">
                {photoPreview ? (
                  <span className="text-emerald-700 font-bold inline-flex items-center gap-1.5">
                    <HiCheckCircle className="h-4 w-4 text-emerald-600" />
                    Photo ready to save
                  </span>
                ) : (
                  "Tap avatar or button below to choose photo (Max 5 MB)"
                )}
              </p>
            </div>

            {/* Quick Tips with clean React Icon alignment */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 space-y-2.5 text-left">
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <HiCheck className="h-3 w-3 stroke-[3]" />
                </span>
                <span className="font-medium">Clear, front-facing headshot in good lighting</span>
              </div>
              <div className="flex items-center gap-2.5 text-xs text-slate-700">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <HiCheck className="h-3 w-3 stroke-[3]" />
                </span>
                <span className="font-medium">Clinical scrubs, uniform, or formal attire works best</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              {photoPreview ? (
                <Button
                  type="button"
                  onClick={() => handleFinishOnboarding(photoPreview)}
                  className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-sm shadow-md shadow-primary/25 hover:bg-primary/95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <HiCheckCircle className="h-4 w-4" />
                  Save photo & view profile
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-sm shadow-md shadow-primary/25 hover:bg-primary/95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <HiOutlineCamera className="h-4 w-4 stroke-[2.2]" />
                  Choose photo
                </Button>
              )}

              <button
                type="button"
                onClick={() => handleFinishOnboarding()}
                className="group w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <span>Skip for now & view profile</span>
                <HiArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Review Hospital & Facility Photos Modal - Bottom Drawer on Mobile, Centered Card on Desktop */}
      {showHospitalPhotoModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative w-full sm:max-w-md max-h-[92vh] overflow-y-auto rounded-t-3xl rounded-b-none border-t border-x-0 border-b-0 sm:rounded-3xl sm:border border-slate-200/90 bg-white p-5 sm:p-6 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] shadow-2xl space-y-4 animate-in slide-in-from-bottom sm:slide-in-from-bottom-0 sm:zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Mobile Sheet Grab Handle */}
            <div className="mx-auto -mt-1 mb-1 h-1.5 w-12 rounded-full bg-slate-300 sm:hidden" />

            {/* Close / Skip X Button */}
            <button
              type="button"
              onClick={() => handleFinishHospitalOnboarding()}
              className="absolute right-4 top-4 sm:right-5 sm:top-5 rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer transition-colors z-10"
              title="Skip for now"
            >
              <HiOutlineXMark className="h-5 w-5" />
            </button>

            {/* Modal Header */}
            <div className="text-center space-y-1 px-4 pt-1">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Add hospital & facility photos
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                Showcase your official logo and hospital facilities to attract verified doctors and nurses.
              </p>
            </div>

            {/* Unified Upload Section */}
            <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 space-y-3">
              {/* Part 1: Hospital Logo */}
              <div className="flex items-center gap-3.5">
                {/* Logo Squircle with external unclipped badge */}
                <div className="relative shrink-0">
                  <div
                    onClick={() => hospitalLogoInputRef.current?.click()}
                    className="relative h-14 w-14 rounded-2xl border-2 border-primary/25 bg-white text-primary shadow-2xs cursor-pointer overflow-hidden flex items-center justify-center hover:border-primary transition-all group"
                    title="Upload hospital logo"
                  >
                    {hospitalLogoPreview ? (
                      <img
                        src={hospitalLogoPreview}
                        alt="Hospital logo"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xl font-black text-primary select-none">
                        {initials(str("org") || "HOSP")}
                      </span>
                    )}
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <HiOutlineCamera className="h-4 w-4" />
                    </div>
                  </div>

                  {/* External camera badge - never clipped */}
                  <button
                    type="button"
                    onClick={() => hospitalLogoInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full bg-primary text-white border-2 border-white shadow-xs cursor-pointer hover:scale-105 transition-transform"
                    title={hospitalLogoPreview ? "Change logo" : "Upload logo"}
                  >
                    <HiOutlineCamera className="h-3 w-3 stroke-[2.2]" />
                  </button>
                </div>

                {/* Logo Title, Description & Action Button - Perfectly Aligned */}
                <div className="min-w-0 flex-1 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 leading-tight">
                      Hospital Logo
                    </h4>
                    <p className="text-[11px] text-slate-500 leading-tight mt-1 truncate">
                      Official emblem for job listings & shifts
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => hospitalLogoInputRef.current?.click()}
                    className="shrink-0 px-3 py-1.5 rounded-lg border border-primary/30 bg-white hover:bg-primary-soft text-primary text-xs font-bold transition-all shadow-2xs cursor-pointer"
                  >
                    {hospitalLogoPreview ? "Change" : "Upload"}
                  </button>
                </div>
              </div>

              <div className="h-px bg-slate-200/80" />

              {/* Part 2: Facility Images (Multiple) */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800">Facility Photos</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      Building, reception, ICU, OT, or wards
                    </p>
                  </div>
                  <span className="shrink-0 whitespace-nowrap text-[11px] font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-full shadow-2xs">
                    {hospitalPhotos.length} {hospitalPhotos.length === 1 ? "photo" : "photos"}
                  </span>
                </div>

                {hospitalPhotos.length > 0 ? (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                    {hospitalPhotos.map((photo, idx) => (
                      <div
                        key={idx}
                        className="group relative h-16 w-20 shrink-0 rounded-xl overflow-hidden border border-slate-200 bg-slate-100 shadow-2xs"
                      >
                        <img
                          src={photo}
                          alt={`Facility ${idx + 1}`}
                          className="h-full w-full object-cover transition-transform group-hover:scale-105"
                        />
                        <button
                          type="button"
                          onClick={() => setHospitalPhotos((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute top-1 right-1 grid h-5 w-5 place-items-center rounded-full bg-slate-900/80 text-white hover:bg-rose-600 transition-colors cursor-pointer shadow-xs"
                          title="Remove photo"
                        >
                          <HiOutlineXMark className="h-3 w-3 stroke-[2.5]" />
                        </button>
                      </div>
                    ))}

                    {/* Add More Tile */}
                    <button
                      type="button"
                      onClick={() => hospitalPhotosInputRef.current?.click()}
                      className="h-16 w-16 shrink-0 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary bg-primary-soft/40 hover:bg-primary-soft/80 flex flex-col items-center justify-center text-primary text-xs font-semibold gap-0.5 transition-all cursor-pointer"
                      title="Add more facility photos"
                    >
                      <HiPlus className="h-4 w-4 stroke-[3]" />
                      <span className="text-[9px] font-bold">Add</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => hospitalPhotosInputRef.current?.click()}
                    className="w-full py-2.5 px-3 rounded-xl border-2 border-dashed border-primary/30 hover:border-primary hover:bg-primary-soft/40 transition-all flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 text-primary cursor-pointer bg-white"
                  >
                    <div className="flex items-center gap-1.5 shrink-0">
                      <HiOutlineCloudArrowUp className="h-4 w-4 stroke-[2.2]" />
                      <span className="text-xs font-bold text-slate-800">
                        Upload facility photos
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium whitespace-nowrap">
                      (Select multiple · Max 5 MB)
                    </span>
                  </button>
                )}
              </div>

              {/* Hidden file input for logo */}
              <input
                ref={hospitalLogoInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Image too large. Please select a photo under 5 MB.");
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = () => {
                    setHospitalLogoPreview(reader.result as string);
                  };
                  reader.readAsDataURL(file);
                }}
              />

              {/* Hidden file input for multiple facility photos */}
              <input
                ref={hospitalPhotosInputRef}
                type="file"
                multiple
                accept="image/png,image/jpeg,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  if (!files.length) return;
                  const validFiles = files.filter((f) => {
                    if (f.size > 5 * 1024 * 1024) {
                      toast.error(`"${f.name}" is over 5 MB. Please select a photo under 5 MB.`);
                      return false;
                    }
                    return true;
                  });
                  validFiles.forEach((file) => {
                    const reader = new FileReader();
                    reader.onload = () => {
                      setHospitalPhotos((prev) => [...prev, reader.result as string]);
                    };
                    reader.readAsDataURL(file);
                  });
                }}
              />
            </div>

            {/* Quick Tips with clean React Icon alignment */}
            <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3 space-y-2 text-left">
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <HiCheck className="h-2.5 w-2.5 stroke-[3]" />
                </span>
                <span className="font-medium">Clear logo or front building exterior</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-700">
                <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                  <HiCheck className="h-2.5 w-2.5 stroke-[3]" />
                </span>
                <span className="font-medium">Modern ICU, OT, and wards help build clinical trust</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-1.5 pt-0.5">
              {hospitalLogoPreview || hospitalPhotos.length > 0 ? (
                <Button
                  type="button"
                  onClick={() => handleFinishHospitalOnboarding(hospitalLogoPreview, hospitalPhotos)}
                  className="w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm shadow-md shadow-primary/25 hover:bg-primary/95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <HiCheckCircle className="h-4 w-4" />
                  Save & view dashboard
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => hospitalPhotosInputRef.current?.click()}
                  className="w-full h-11 rounded-xl bg-primary text-white font-semibold text-sm shadow-md shadow-primary/25 hover:bg-primary/95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <HiOutlineCamera className="h-4 w-4 stroke-[2.2]" />
                  Choose photos
                </Button>
              )}

              <button
                type="button"
                onClick={() => handleFinishHospitalOnboarding()}
                className="group w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
              >
                <span>Skip for now & view dashboard</span>
                <HiArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormSection({
  icon,
  title,
  subtitle,
  children,
  action,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div className="flex items-start gap-2.5 min-w-0">
          {icon && (
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary border border-primary/20 shadow-2xs [&_svg]:h-[18px] [&_svg]:w-[18px] mt-0.5">
              {icon}
            </span>
          )}
          <div className="min-w-0">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="space-y-4 pt-1">{children}</div>
    </div>
  );
}

function Note({ children }: { children: ReactNode }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-primary/20 bg-primary-soft/60 p-4 text-sm text-slate-700">
      <HiOutlineInformationCircle className="h-5 w-5 shrink-0 text-primary mt-0.5" />
      <span className="text-xs leading-relaxed">{children}</span>
    </div>
  );
}
