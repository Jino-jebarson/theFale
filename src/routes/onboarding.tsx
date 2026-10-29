import { useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { applyTheme, getEffectiveTheme } from "@/lib/theme";
import {
  HiArrowLeft,
  HiArrowRight,
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
} from "react-icons/hi2";
import { ImSpinner2 } from "react-icons/im";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/fale/Logo";
import { initials } from "@/components/fale/AppShell";
import { Button } from "@/components/ui/button";
import { DigiLockerModal } from "@/components/fale/DigiLockerModal";
import { ResumeParserModal } from "@/components/fale/ResumeParserModal";
import type { ParsedResumeData } from "@/lib/resumeParser";
import {
  AddressField,
  ChipGroup,
  DateField,
  Field,
  MultiSelectField,
  PhoneField,
  SegmentedControl,
  SelectField,
  Toggle,
  UploadBox,
  type AddressValue,
} from "@/components/fale/fields";
import { setState, useApp } from "@/lib/store";
import {
  councilByProfession,
  councilOptions,
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
}

export const Route = createFileRoute("/onboarding")({
  validateSearch: (search: Record<string, unknown>): OnboardingSearch => {
    return {
      role: typeof search.role === "string" ? search.role : undefined,
      portal: typeof search.portal === "string" ? search.portal : undefined,
    };
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

export interface WorkExperienceItem {
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

type P = Record<string, string | boolean | string[]>;

function Onboarding() {
  const s = useApp();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const roleParam = (search?.role || search?.portal || "").toLowerCase();
  const isFacilityParam = roleParam === "facility" || roleParam === "employer" || roleParam === "hire" || roleParam === "employ";
  const isCandidateParam = roleParam === "candidate" || roleParam === "pro";

  useEffect(() => {
    if (isFacilityParam && s.portal !== "facility") {
      setState({ portal: "facility" });
    } else if (isCandidateParam && s.portal !== "candidate") {
      setState({ portal: "candidate" });
    }
  }, [isFacilityParam, isCandidateParam, s.portal]);

  const f = isFacilityParam ? true : isCandidateParam ? false : s.portal === "facility";
  const steps = f ? facilitySteps : candidateSteps;
  const [step, setStep] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showDigiLockerModal, setShowDigiLockerModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [showHospitalPhotoModal, setShowHospitalPhotoModal] = useState(false);
  const [hospitalPhotos, setHospitalPhotos] = useState<string[]>([]);
  const [hospitalLogoPreview, setHospitalLogoPreview] = useState<string>("");
  const hospitalLogoInputRef = useRef<HTMLInputElement>(null);
  const hospitalPhotosInputRef = useRef<HTMLInputElement>(null);
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
      mobile: s.contact.startsWith("+91") ? s.contact.replace("+91 ", "") : "",
      email: s.contact.includes("@") && !s.contact.endsWith("@account") ? s.contact : "",
      ...profile,
      fresher: isFresher,
    };
  });
  const [docs, setDocs] = useState<Record<string, string>>(s.docs);
  const set = (k: string) => (v: unknown) => setP((x) => ({ ...x, [k]: v as string }));
  const str = (k: string) => (p[k] as string) ?? "";
  const arr = (k: string) => (p[k] as string[]) ?? [];
  const input = (k: string) => ({ value: str(k), onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k)(e.target.value) });

  const handleProfessionChange = (newRole: string) => {
    const allowedSkills = skillsByProfession[newRole] ?? [];
    const availableDepts = departmentsByProfession[newRole] ?? [];
    setP((prev) => {
      const currentSkills = (prev.skills as string[]) ?? [];
      const allPredefinedSkills = Object.values(skillsByProfession).flat();
      const customSkills = currentSkills.filter((s) => !allPredefinedSkills.includes(s));
      const validSkills = Array.from(new Set([...currentSkills.filter((s) => allowedSkills.includes(s)), ...customSkills]));
      const currentDept = String(prev.specialty || "");
      const validDept = availableDepts.includes(currentDept) ? currentDept : (availableDepts[0] ?? "");
      const defaultCouncil = councilByProfession[newRole] ?? "";
      const allowedQuals = qualificationsByProfession[newRole] ?? [];
      const currentQual = String(prev.qual || "");
      const validQual = allowedQuals.includes(currentQual) || currentQual === "Other" ? currentQual : "";
      return {
        ...prev,
        role: newRole,
        specialty: validDept,
        skills: validSkills,
        council: prev.council && prev.council !== "Not applicable for my role" ? prev.council : defaultCouncil,
        qual: validQual,
      };
    });
  };

  const [verifyingReg, setVerifyingReg] = useState(false);
  const [regVerification, setRegVerification] = useState<{
    status: "ok" | "manual" | "not_found";
    num: string;
  } | null>(null);

  const handleVerifyRegistration = () => {
    const num = str("regNo").trim();
    if (!num) {
      toast.error("Please enter your registration number first.");
      return;
    }
    const currentCouncil = str("council") || councilByProfession[str("role") || "Doctor"] || councilOptions[0] || "";
    const onlineRegName = currentCouncil ? onlineCouncilRegisters[currentCouncil] : undefined;

    setVerifyingReg(true);
    setTimeout(() => {
      setVerifyingReg(false);

      if (num.toLowerCase().includes("0000") || num.toLowerCase().includes("invalid")) {
        setRegVerification({ status: "not_found", num });
        toast.error("Registration number could not be found on the council registry.");
      } else if (!onlineRegName) {
        setRegVerification({ status: "manual", num });
        toast.info("Registration format validated. Manual verification scheduled.");
      } else {
        setRegVerification({ status: "ok", num });
        toast.success(`Registration verified successfully against ${onlineRegName}!`);
      }
    }, 850);
  };

  // Multi-experience state matching thefale_website (19).html
  const [exps, setExps] = useState<WorkExperienceItem[]>(() => {
    if (Array.isArray(p["exps"]) && p["exps"].length > 0) {
      return p["exps"] as WorkExperienceItem[];
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
    setState({ profile: profileToSave as Record<string, string | boolean>, docs });
  };

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    if (!f && step === 2 && !p["fresher"]) {
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
      const missing = neededDocs(f ? "facility" : "candidate", str("role")).filter((d) => !d.label.includes("optional") && !d.label.includes("if applicable") && !docs[d.label]);
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
        setShowHospitalPhotoModal(true);
      }
    }
  };

  const handleFinishOnboarding = (uploadedPhoto?: string) => {
    const finalPhoto = uploadedPhoto || photoPreview;
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
      ...(finalPhoto ? { avatar: finalPhoto } : {}),
    };
    const finalDocs = { ...docs };
    if (finalPhoto) {
      finalDocs["Profile photo"] = finalPhoto;
    }
    setState({
      onboarded: true,
      profile: profileToSave as Record<string, string | boolean>,
      docs: finalDocs,
    });
    setShowPhotoModal(false);
    toast.success("Profile submitted for verification", { description: "Review usually takes up to 48 hours." });
    navigate({ to: f ? "/employer" : "/profile" });
  };

  const handleFinishHospitalOnboarding = (primary?: string, gallery?: string[]) => {
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
    setState({
      onboarded: true,
      profile: profileToSave as Record<string, string | boolean>,
      docs: finalDocs,
    });
    setShowHospitalPhotoModal(false);
    toast.success("Facility profile submitted for verification", {
      description: "Hospital review usually takes under 24 hours.",
    });
    navigate({ to: "/employer" });
  };

  const handleApplyResumeData = (data: ParsedResumeData, fileName: string) => {
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

    if (data.employer || data.designation) {
      setExps([
        {
          org: data.employer || "Sunrise Hospital",
          role: data.designation || "Staff Nurse",
          fm: "4",
          fy: "2022",
          cur: true,
        },
      ]);
    }

    if (data.regNo) {
      setRegVerification({ status: "ok", num: data.regNo });
    }
  };

  const fillDemo = () => {
    const allDocs = Object.fromEntries(neededDocs(f ? "facility" : "candidate", str("role") || "Nurse").map((d) => [d.label, `${(d.label.split(" ")[0] ?? "document").toLowerCase()}-sample.pdf`]));
    setDocs(allDocs);
    toast.success("Sample documents attached");
  };

  const address = { address: str("address"), city: str("city"), state: str("state"), pincode: str("pincode") };
  const setAddress = (v: AddressValue) => setP((x) => ({ ...x, ...v } as P));
  const addressBlock = (
    <div className="space-y-4">
      <AddressField label={f ? "Registered address" : "Current address"} value={address} onChange={setAddress} />
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="City" required {...input("city")} placeholder="Enter city" />
        <SelectField label="State" required options={indianStates} value={str("state")} onChange={set("state")} />
        <Field label="PIN code" required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} {...input("pincode")} placeholder="Enter PIN code" />
      </div>
    </div>
  );

  const candidate: ReactNode[] = [
    <div className="space-y-8" key="c0">
      {/* Resume Auto-Fill Standout Hero Card */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-primary/25 bg-gradient-to-r from-primary-soft/80 via-white to-amber-50/50 p-3.5 sm:p-6 shadow-sm w-full min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4 min-w-0">
          <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
            <span className="grid h-10 w-10 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-xl sm:rounded-2xl bg-primary text-white shadow-md shadow-primary/25">
              <HiOutlineSparkles className="h-5 w-5 sm:h-6 sm:w-6" />
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

      {regulatedProfessions.includes(str("role") || "Doctor") ? (
        <>
          <div className="h-px bg-slate-100" />
          <FormSection
            icon={<HiOutlineIdentification className="h-4 w-4" />}
            title="Professional Registration"
            subtitle="Clinical registration council details for government verification"
          >
            {(() => {
              const selectedCouncil = str("council") || councilByProfession[str("role") || "Doctor"] || councilOptions[0] || "";
              const onlineRegisterName = selectedCouncil ? onlineCouncilRegisters[selectedCouncil] : undefined;

              return (
                <div className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2 items-start">
                    <SelectField
                      label="Registration council"
                      required
                      options={councilOptions}
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
                              : "text-primary hover:text-primary-hover cursor-pointer disabled:text-muted-foreground/50 disabled:cursor-not-allowed disabled:pointer-events-none",
                          )}
                        >
                          {verifyingReg ? "Verifying..." : regVerification?.status === "ok" ? "Verified" : "Verify"}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Real-time council check status banner (matching thefale_website (19).html) */}
                  {verifyingReg && (
                    <div className="flex items-center gap-2.5 rounded-xl border border-primary/20 bg-primary-soft/60 p-3 text-xs text-primary font-medium animate-in fade-in duration-200">
                      <ImSpinner2 className="h-4 w-4 animate-spin text-primary shrink-0" />
                      <span>Checking with the {onlineRegisterName || selectedCouncil}…</span>
                    </div>
                  )}

                  {!verifyingReg && regVerification?.status === "ok" && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/90 p-3.5 text-xs text-emerald-900 animate-in fade-in duration-200">
                      <HiCheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <b className="font-bold">Found on {onlineRegisterName || "council register"} • {regVerification.num}</b>
                        <p className="mt-0.5 text-[11.5px] text-emerald-700 leading-relaxed">
                          Name matches {str("name") || "your profile"}. We still double-check before hospitals see your profile.
                        </p>
                      </div>
                    </div>
                  )}

                  {!verifyingReg && regVerification?.status === "manual" && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-sky-200 bg-sky-50/90 p-3.5 text-xs text-sky-900 animate-in fade-in duration-200">
                      <HiOutlineClock className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <b className="font-bold">Format looks right • {regVerification.num}</b>
                        <p className="mt-0.5 text-[11.5px] text-sky-700 leading-relaxed">
                          {selectedCouncil} has no public online register yet, so our team checks your certificate by hand within 24–48 hours.
                        </p>
                      </div>
                    </div>
                  )}

                  {!verifyingReg && regVerification?.status === "not_found" && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50/90 p-3.5 text-xs text-rose-900 animate-in fade-in duration-200">
                      <HiOutlineXMark className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <b className="font-bold">We couldn't find this number</b>
                        <p className="mt-0.5 text-[11.5px] text-rose-700 leading-relaxed">
                          Check it against your certificate. If it's right, carry on and our team checks by hand.
                        </p>
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
        <Toggle
          label="I'm a fresher"
          desc="No work experience yet. You can still apply to fresher roles and shifts."
          checked={!!p["fresher"]}
          onChange={(val) => {
            setP((prev) => ({
              ...prev,
              fresher: val,
              exp: val ? "Fresher" : (prev.exp === "Fresher" ? "" : prev.exp),
            }));
            if (val) {
              setExps([]);
            } else if (exps.length === 0) {
              addExp();
            }
          }}
        />

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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Number of beds" optional inputMode="numeric" {...input("beds")} placeholder="e.g. 150" />
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
        action={
          <Button type="button" variant="outline" size="sm" onClick={fillDemo} className="rounded-lg text-xs font-semibold text-primary border-primary/30 hover:bg-primary-soft">
            Use sample files
          </Button>
        }
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
                    onFile={(n) =>
                      setDocs((x) => {
                        const c = { ...x };
                        if (n) c[d.label] = n;
                        else delete c[d.label];
                        return c;
                      })
                    }
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
                onFile={(n) =>
                  setDocs((x) => {
                    const c = { ...x };
                    if (n) c[d.label] = n;
                    else delete c[d.label];
                    return c;
                  })
                }
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

  const body = f
    ? [facility[0], facility[1], <div className="space-y-8" key="f2-wrap">{facility[2]}{docsStep}</div>, facility[3], review][step]
    : [...candidate, docsStep, review][step];

  const pct = Math.round(((step + 1) / steps.length) * 100);

  return (
    <div className="light min-h-screen bg-[#f8fafc] text-slate-900" data-theme="light">
      {/* Top Professional Sticky Header (Apple/LinkedIn inspired) */}
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Logo />
            <div className="hidden sm:block h-5 w-px bg-slate-200" />
            <span className="hidden sm:inline-block text-xs font-semibold uppercase tracking-wider text-slate-500">
              {f ? "Healthcare Facility Setup" : "Healthcare Professional Onboarding"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* Candidate Resume Auto-fill trigger in header */}
            {!f && (
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
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50/80 px-3 py-1 text-xs font-semibold text-emerald-800">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500"></span>
              </span>
              Auto-saved
            </div>

            <button
              type="button"
              aria-label="Exit setup"
              title="Exit profile setup"
              onClick={() => setShowExitModal(true)}
              className="group p-2 text-primary hover:text-primary-hover hover:bg-primary-soft/70 rounded-xl transition-all cursor-pointer"
            >
              <LogOut className="h-5 w-5 stroke-[2.2] transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>
        </div>
        {/* Mobile progress line */}
        <div className="h-1 bg-slate-100 lg:hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      {/* Main Grid: Stepper Sidebar + Master Form Card */}
      <div className="mx-auto grid max-w-6xl gap-6 lg:gap-8 px-3.5 py-6 sm:px-6 sm:py-8 lg:grid-cols-[290px_minmax(0,1fr)] items-start">
        {/* Left Stepper Sidebar - Sticky on page scroll without separate scrollbar */}
        <aside className="hidden lg:block select-none self-start sticky top-[84px] space-y-4 z-20">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)]">
            {/* Header with progress */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                {f ? "Facility Setup" : "Your Profile"}
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
                  {f ? "Employer Verification" : "Profile Setup"}
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
                onClick={() => (step ? setStep(step - 1) : navigate({ to: "/" }))}
              >
                <HiArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                type="submit"
                size="lg"
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
                  {step === steps.length - 1 ? "Submit for verification" : "Save & continue"}
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
