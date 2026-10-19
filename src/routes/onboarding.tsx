import { useState, useEffect, type ReactNode } from "react";
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
} from "react-icons/hi2";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { Logo } from "@/components/fale/Logo";
import { Button } from "@/components/ui/button";
import { DigiLockerModal } from "@/components/fale/DigiLockerModal";
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
  indianCities,
  indianStates,
  neededDocs,
  professions,
  skillsByProfession,
} from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
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

const regulated = ["Nurse", "Doctor", "Dentist", "Pharmacist", "Physiotherapist"];

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
  const f = s.portal === "facility";
  const steps = f ? facilitySteps : candidateSteps;
  const [step, setStep] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showDigiLockerModal, setShowDigiLockerModal] = useState(false);

  // Isolate onboarding flow from dark mode
  useEffect(() => {
    document.documentElement.classList.remove("dark");
    document.documentElement.style.colorScheme = "light";

    return () => {
      // Restore user theme when leaving onboarding
      applyTheme(getEffectiveTheme());
    };
  }, []);

  const [p, setP] = useState<P>(() => ({
    mobile: s.contact.startsWith("+91") ? s.contact.replace("+91 ", "") : "",
    email: s.contact.includes("@") && !s.contact.endsWith("@account") ? s.contact : "",
    ...(s.profile as P),
  }));
  const [docs, setDocs] = useState<Record<string, string>>(s.docs);
  const set = (k: string) => (v: unknown) => setP((x) => ({ ...x, [k]: v as string }));
  const str = (k: string) => (p[k] as string) ?? "";
  const arr = (k: string) => (p[k] as string[]) ?? [];
  const input = (k: string) => ({ value: str(k), onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(k)(e.target.value) });

  const handleProfessionChange = (newRole: string) => {
    const allowed = skillsByProfession[newRole] ?? [];
    setP((prev) => {
      const currentSkills = (prev.skills as string[]) ?? [];
      const validSkills = currentSkills.filter((s) => allowed.includes(s));
      return {
        ...prev,
        role: newRole,
        skills: validSkills,
      };
    });
  };

  const save = () => setState({ profile: p as Record<string, string | boolean>, docs });

  const next = (e: React.FormEvent) => {
    e.preventDefault();
    const requiredChoices = f
      ? (step === 3 ? ["departments"] : [])
      : step === 0 ? ["gender"] : step === 2 ? ["exp"] : step === 3 ? ["employmentType"] : [];
    if (requiredChoices.some((key) => !p[key] || (Array.isArray(p[key]) && p[key].length === 0))) {
      toast.error("Please complete all required selections."); return;
    }
    if (step === (f ? 2 : 4)) {
      const missing = neededDocs(s.portal, str("role")).filter((d) => !d.label.includes("optional") && !d.label.includes("if applicable") && !docs[d.label]);
      if (missing.length) { toast.error(`Please upload: ${missing.map((m) => m.label).join(", ")}`); return; }
    }
    save();
    if (step < steps.length - 1) {
      setStep(step + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      setState({ onboarded: true });
      toast.success("Profile submitted for verification", { description: "Review usually takes up to 48 hours." });
      navigate({ to: f ? "/employer" : "/home" });
    }
  };

  const fillDemo = () => {
    const allDocs = Object.fromEntries(neededDocs(s.portal, str("role") || "Nurse").map((d) => [d.label, `${(d.label.split(" ")[0] ?? "document").toLowerCase()}-sample.pdf`]));
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
        <SelectField label="Profession" required options={professions} value={str("role")} onChange={handleProfessionChange} />
        <Field
          label="Specialty / department"
          required
          {...input("specialty")}
          placeholder="Enter specialty or department"
        />
        <ChipGroup
          label="Key clinical skills"
          multi
          options={skillsByProfession[str("role")] ?? skillsByProfession["Doctor"] ?? []}
          value={arr("skills")}
          onChange={set("skills")}
        />
      </FormSection>

      {regulated.includes(str("role")) ? (
        <>
          <div className="h-px bg-slate-100" />
          <FormSection
            icon={<HiOutlineIdentification className="h-4 w-4" />}
            title="Professional Registration"
            subtitle="Clinical registration council details for government verification"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Registration council"
                required
                {...input("council")}
                placeholder="Enter registration council"
              />
              <Field
                label="Registration number"
                required
                icon={<HiOutlineIdentification />}
                {...input("regNo")}
                placeholder="Enter registration number"
              />
            </div>
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
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Highest qualification"
            required
            icon={<HiOutlineAcademicCap />}
            {...input("qual")}
            placeholder="Enter highest qualification"
          />
          <Field label="Year of completion" required inputMode="numeric" pattern="(19|20)[0-9]{2}" maxLength={4} {...input("year")} placeholder="YYYY" />
        </div>
        <Field label="Institution / university" required {...input("institution")} placeholder="Enter college or university name" />
      </FormSection>

      <div className="h-px bg-slate-100" />

      <FormSection
        icon={<HiOutlineBriefcase className="h-4 w-4" />}
        title="Work Experience"
        subtitle="Your overall clinical or healthcare experience"
      >
        <ChipGroup label="Total experience" required options={["Fresher", "Under 2 yrs", "2–5 yrs", "5–10 yrs", "10+ yrs"]} value={str("exp")} onChange={set("exp")} />
        {str("exp") && str("exp") !== "Fresher" && (
          <div className="grid gap-4 pt-2 animate-in fade-in sm:grid-cols-2">
            <Field label="Current / last employer" required icon={<HiOutlineBriefcase />} {...input("employer")} placeholder="Enter hospital or organization name" />
            <Field
              label="Designation"
              required
              {...input("designation")}
              placeholder="Enter designation"
            />
            <SelectField label="Notice period" required options={["Immediately", "15 days", "30 days", "60 days", "90 days"]} value={str("notice")} onChange={set("notice")} />
            <Field label="Current monthly salary" optional prefix="₹" inputMode="numeric" {...input("currentSalary")} placeholder="Enter monthly salary" />
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
          {neededDocs(s.portal, str("role")).map((d) => (
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
          ))}
          {!f && (
            <UploadBox
              label="Profile photo"
              hint="A clear, professional headshot in uniform or formal attire"
              required={false}
              file={docs["Profile photo"]}
              onFile={(n) =>
                setDocs((x) => {
                  const updated = { ...x };
                  if (n) updated["Profile photo"] = n;
                  else delete updated["Profile photo"];
                  return updated;
                })
              }
            />
          )}
        </div>
      </FormSection>
      <Note>
        Private documents are used exclusively for credential verification. Identity proofs and confidential registration papers are never shown publicly.
      </Note>
    </div>
  );

  const review = (
    <div className="space-y-6">
      <div className="space-y-4">
        {(f
          ? [
              ["Your details", 0, [str("recruiter"), str("designation"), str("email"), `+91 ${str("mobile")}`]],
              ["Organization", 1, [str("org"), `${str("orgType")} · ${str("size")}`, `${str("address")}`, `${str("city")}, ${str("state")} ${str("pincode")}`]],
              ["Verification", 2, [`Licence: ${str("licence")}`, `${Object.keys(docs).length} document(s) attached`]],
              ["Hiring profile", 3, [arr("departments").join(", "), arr("hiring").join(", ")]],
            ]
          : [
              ["Personal details", 0, [str("name"), `${str("gender")} · ${str("dob")}`, `+91 ${str("mobile")} · ${str("email")}`, `${str("city")}, ${str("state")} ${str("pincode")}`]],
              ["Profession", 1, [`${str("role")} · ${str("specialty")}`, str("regNo") && `Reg. ${str("regNo")}`, arr("skills").join(", ")]],
              ["Education & experience", 2, [`${str("qual")} (${str("year")})`, str("institution"), `${str("exp")}${str("employer") ? ` · ${str("employer")}` : ""}`]],
              ["Preferences", 3, [str("preferredCity"), arr("employmentType").join(", "), `${str("salary")} · ${str("availability")}`]],
              ["Documents", 4, [
                docs["Identity proof"]?.includes("DigiLocker") ? "✓ Identity proof: Verified via DigiLocker (UIDAI e-Aadhaar)" : undefined,
                `${Object.keys(docs).length} document(s) attached`,
              ].filter(Boolean)],
            ]
        ).map(([title, i, lines]) => (
          <div key={title as string} className="rounded-2xl border border-slate-200/90 bg-slate-50/60 p-5 transition-all hover:bg-slate-50">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">{title as string}</h3>
              <Button type="button" variant="ghost" size="sm" onClick={() => setStep(i as number)} className="gap-1 text-xs font-semibold text-primary hover:text-primary-hover hover:bg-primary-soft">
                <HiOutlinePencilSquare className="h-3.5 w-3.5" /> Edit
              </Button>
            </div>
            <div className="space-y-1">
              {(lines as string[]).filter((l) => l && l.trim() && !/^[\s·,()]*$/.test(l)).map((l) => (
                <p key={l} className="text-sm text-slate-600 font-medium">{l}</p>
              ))}
            </div>
          </div>
        ))}
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary-soft/80 p-5 text-sm cursor-pointer select-none">
        <input type="checkbox" required className="mt-0.5 h-4 w-4 accent-primary rounded cursor-pointer" />
        <span className="text-slate-800 font-medium leading-relaxed">
          {f
            ? "I confirm I am authorized to represent this registered healthcare organization and all submitted details are authentic."
            : "I confirm these details are accurate and consent to verification of my credentials against regulatory council databases."}
        </span>
      </label>
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
      <div className="mx-auto grid max-w-6xl gap-6 lg:gap-8 px-3.5 py-6 sm:px-6 sm:py-8 lg:grid-cols-[290px_minmax(0,1fr)]">
        {/* Left Stepper Sidebar */}
        <aside className="hidden lg:block select-none">
          <div className="sticky top-24 space-y-4">
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)]">
              {/* Header with progress */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
                  {f ? "Facility Setup" : "Your Profile"}
                </span>
                <span className="inline-flex items-center rounded-full bg-blue-50 border border-blue-200/60 px-2.5 py-0.5 text-xs font-bold text-primary">
                  {pct}% complete
                </span>
              </div>

              {/* Progress Bar */}
              <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-blue-500 transition-all duration-500 shadow-sm"
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
                          isCurrent && "bg-blue-50/80 border border-blue-200/80 shadow-sm",
                          isCompleted && "hover:bg-slate-50 cursor-pointer",
                          isPending && "cursor-not-allowed",
                        )}
                      >
                        {/* Step Badge - 100% solid opaque with ring to cover the line */}
                        <span
                          className={cn(
                            "relative z-20 grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold transition-transform group-hover:scale-105",
                            isCompleted && "bg-emerald-600 text-white shadow-sm ring-4 ring-white",
                            isCurrent && "bg-primary text-white shadow-md shadow-primary/30 ring-4 ring-blue-100",
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
          </div>
        </aside>

        {/* Right Form Main Area: Single Elevated Master Card */}
        <form onSubmit={next} className="w-full min-w-0">
          <div className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-8 lg:p-10 shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] transition-all">
            {/* Card Header */}
            <div className="border-b border-slate-100 pb-6 mb-7">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200/60 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-primary">
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
            <div key={step} className="animate-in fade-in slide-in-from-right-2 duration-300">
              {body}
            </div>

            {/* Card Action Footer */}
            <div className="mt-10 pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-between gap-4">
              <Button
                type="button"
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-2 rounded-xl border-slate-300 font-semibold text-slate-700 hover:bg-slate-50"
                onClick={() => (step ? setStep(step - 1) : navigate({ to: "/login" }))}
              >
                <HiArrowLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                size="lg"
                className="w-full sm:w-auto group gap-2 rounded-xl bg-primary px-8 font-semibold text-white shadow-md shadow-primary/25 hover:shadow-lg hover:shadow-primary/35 hover:bg-primary/95 transition-all cursor-pointer"
              >
                <span>{step === steps.length - 1 ? "Submit for verification" : "Save & continue"}</span>
                <HiArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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

            {/* Blue Icon Badge */}
            <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-primary">
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
                  navigate({ to: "/login" });
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
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-blue-50 text-primary border border-blue-200/60 shadow-2xs [&_svg]:h-[18px] [&_svg]:w-[18px] mt-0.5">
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
    <div className="flex gap-3 rounded-2xl border border-primary/20 bg-blue-50/70 p-4 text-sm text-slate-700">
      <HiOutlineInformationCircle className="h-5 w-5 shrink-0 text-primary mt-0.5" />
      <span className="text-xs leading-relaxed">{children}</span>
    </div>
  );
}
