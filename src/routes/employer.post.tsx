import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { RequestError } from "@/components/fale/RequestError";
import { errorMessage } from "@/lib/errorMessage";
import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  HiOutlineBriefcase,
  HiOutlineBolt,
  HiOutlineMapPin,
  HiOutlineFire,
  HiOutlineCheck,
} from "react-icons/hi2";
import { RiVerifiedBadgeFill, RiRobot2Line } from "react-icons/ri";
import { BotMessageSquare } from "lucide-react";
import { toast } from "sonner";
import { AppShell, PageHead } from "@/components/fale/AppShell";
import { OrgMark } from "@/components/fale/JobCard";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SelectField } from "@/components/fale/fields";
import { professions, indianCities } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled } from "@/lib/api";
import { postFacilityJob } from "@/lib/adapters/facilityAdapter";
import { generateJobDescriptionWithAi, formatClinicalJobDescription } from "@/lib/adapters/aiAdapter";

export const Route = createFileRoute("/employer/post")({
  head: () => ({
    meta: [
      { title: "Post a job — FALE" },
      {
        name: "description",
        content: "Create a clear healthcare job requirement and reach verified professionals.",
      },
      { property: "og:title", content: "Post a job — FALE" },
      {
        property: "og:description",
        content: "Reach verified healthcare professionals on FALE.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Post,
});

// Quick role templates
const presets = [
  {
    role: "ICU Staff Nurse",
    profession: "Nurse",
    dept: "Critical care",
    minSal: 35000,
    maxSal: 50000,
    exp: "2–5 yrs",
    type: "Full-time",
    shifts: ["Day", "Night", "Rotational"],
    desc: `Provide intensive bedside nursing care in a tertiary multi-specialty ICU.

Key Responsibilities:
• Continuous hemodynamic monitoring, arterial line & CVP tracing.
• Mechanical ventilation management (SIMV, PRVC) and sedation weaning.
• Administration of vasoactive inotropes and emergency resuscitation protocols.

Requirements:
• GNM or B.Sc Nursing with active State Nursing Council registration.
• 2+ years clinical ICU/CCU experience. BLS/ACLS certification preferred.`,
  },
  {
    role: "Emergency Medical Officer",
    profession: "Doctor",
    dept: "Emergency & Trauma",
    minSal: 75000,
    maxSal: 110000,
    exp: "2–5 yrs",
    type: "Full-time",
    shifts: ["Rotational", "Night"],
    desc: `Lead emergency clinical evaluations and acute trauma resuscitation at our 24x7 Emergency Centre.

Key Responsibilities:
• Immediate stabilization of cardiac arrest, poly-trauma, stroke, and acute respiratory distress.
• Bedside procedures: endotracheal intubation, central venous access, and chest tube insertion.

Requirements:
• MBBS recognized by NMC with valid State Medical Council registration.
• 2+ years casualty/emergency room experience. Valid ACLS/ATLS preferred.`,
  },
  {
    role: "OT Scrub Nurse",
    profession: "Nurse",
    dept: "Operation Theatre",
    minSal: 32000,
    maxSal: 48000,
    exp: "2–5 yrs",
    type: "Full-time",
    shifts: ["Day", "Rotational"],
    desc: `Assist surgical teams across general, laparoscopic, orthopedic, and cardiac procedures.

Key Responsibilities:
• Strict maintenance of sterile field, patient draping, and aseptic discipline.
• Instrument, needle, and sponge counts following WHO Safe Surgery checklists.

Requirements:
• GNM / B.Sc Nursing with active State Nursing Council registration.
• 2+ years experience in multi-specialty modular operating theatres.`,
  },
  {
    role: "Dialysis Technician",
    profession: "Dialysis Technician",
    dept: "Nephrology",
    minSal: 28000,
    maxSal: 42000,
    exp: "1–3 yrs",
    type: "Full-time",
    shifts: ["Day", "Rotational"],
    desc: `Operate advanced hemodialysis machines under the supervision of Consultant Nephrologists.

Key Responsibilities:
• Cannulation of AV fistulas, grafts, and central dialysis catheters.
• Monitoring vital parameters, ultrafiltration rates, and water treatment quality.

Requirements:
• Diploma or B.Sc in Dialysis Technology with 1+ years hospital dialysis experience.`,
  },
  {
    role: "Chief Pharmacist",
    profession: "Pharmacist",
    dept: "Hospital Pharmacy",
    minSal: 26000,
    maxSal: 38000,
    exp: "1–3 yrs",
    type: "Full-time",
    shifts: ["Day", "Rotational"],
    desc: `Supervise inpatient and outpatient pharmaceutical dispensing, narcotic reconciliation, and inventory audits.

Key Responsibilities:
• Scrutiny of medication charts for drug interactions and correct dosages.
• Storage of cold-chain biologicals and statutory drug documentation.

Requirements:
• B.Pharm or D.Pharm with active State Pharmacy Council registration.`,
  },
];

const hospitalDepts = [
  "Critical care",
  "Emergency & Trauma",
  "Operation Theatre",
  "Nephrology",
  "Cardiology",
  "Pediatrics & NICU",
  "General Inpatient",
  "Radiology & Imaging",
  "Hospital Pharmacy",
  "Physiotherapy & Rehab",
];

const empTypes = ["Full-time", "Part-time", "Contract", "Internship"];
const expOptions = ["Fresher", "0–2 yrs", "2–5 yrs", "5+ yrs"];
const shiftOptions = ["Day", "Night", "Rotational"];

function Post() {
  const posting = useConfirmedAction();
  const store = useApp();
  const navigate = useNavigate();
  const hospitalName = String(store.profile["org"] || ((store.profile["hospitalName"] || "Healthcare Facility")));
  const hospitalCity = String(store.profile["city"] || "");
  const draftKey = `fale-job-draft:${store.contact || hospitalName}`;
  const [draft] = useState(() => { try { return JSON.parse(sessionStorage.getItem(draftKey) || "null") as Record<string, any> | null; } catch { return null; } });

  // Form State
  const [title, setTitle] = useState(String(draft?.["title"] || ""));
  const [profession, setProfession] = useState(String(draft?.["profession"] || ""));
  const [dept, setDept] = useState(String(draft?.["dept"] || ""));
  const [workLocation, setWorkLocation] = useState(String(draft?.["workLocation"] || ""));
  const [empType, setEmpType] = useState(String(draft?.["empType"] || "Full-time"));
  const [minSalary, setMinSalary] = useState(String(draft?.["minSalary"] || ""));
  const [maxSalary, setMaxSalary] = useState(String(draft?.["maxSalary"] || ""));
  const [openings, setOpenings] = useState(String(draft?.["openings"] || "1"));
  const [experience, setExperience] = useState(String(draft?.["experience"] || ""));
  const [shifts, setShifts] = useState<string[]>(Array.isArray(draft?.["shifts"]) ? draft["shifts"] : []);
  const [description, setDescription] = useState(String(draft?.["description"] || ""));
  const [requireCouncilReg, setRequireCouncilReg] = useState(draft?.["requireCouncilReg"] !== false);
  const [isUrgent, setIsUrgent] = useState(Boolean(draft?.["isUrgent"]));
  const [generatingJd, setGeneratingJd] = useState(false);

  const cityOptions = useMemo(() => {
    const base = [hospitalCity, ...indianCities];
    return Array.from(new Set(base.filter(Boolean)));
  }, [hospitalCity]);

  // Toggle shift
  const toggleShift = (s: string) => {
    setShifts((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  // Submit Handler
  const submit = (status: "Open" | "Draft") => async (event?: React.FormEvent) => {
    event?.preventDefault();
    if (!title.trim()) { toast.error("Please add a job title"); return; }
    const draft = { title, profession, dept, workLocation, empType, minSalary, maxSalary, openings, experience, shifts, description, requireCouncilReg, isUrgent };
    if (status === "Draft") {
      try {
        sessionStorage.setItem(draftKey, JSON.stringify(draft));
        toast.success("Local draft saved", { description: "Saved in this browser tab only. It has not been submitted." });
      } catch { toast.error("Cannot save a draft in this browser. Keep this page open to retain your input."); }
      return;
    }
    const city = workLocation || hospitalCity;
    if (!city) { toast.error("Please select a work location"); return; }
    await posting.run(async () => {
      await postFacilityJob({ title: title.trim(), department: dept || "General", employmentType: empType,
        isInternship: empType === "Internship", city, workLocation: city, openings: Number(openings) || 1,
        salaryMinPaise: (Number(minSalary) || 0) * 100, salaryMaxPaise: (Number(maxSalary) || 0) * 100,
        experienceRequired: experience, qualificationRequired: requireCouncilReg ? "State Council Registration Required" : "",
        description: description || title });
      try { sessionStorage.removeItem(draftKey); } catch { /* A confirmed save still succeeded. */ }
      toast.success("Submitted for admin review");
      navigate({ to: "/employer" });
    });
  };

  // Live salary preview
  const salaryDisplay = useMemo(() => {
    const minN = Number(minSalary) || 0;
    const maxN = Number(maxSalary) || 0;
    if (minN && maxN) {
      return `₹${minN.toLocaleString("en-IN")} – ₹${maxN.toLocaleString("en-IN")}`;
    }
    if (minN) {
      return `₹${minN.toLocaleString("en-IN")}+`;
    }
    return "Pay Scale Pending";
  }, [minSalary, maxSalary]);

  return (
    <AppShell>
      <form onSubmit={submit("Open")} className="w-full min-w-0 space-y-6 pb-16">
        <fieldset disabled={posting.isPending} className="contents">
        <RequestError message={posting.error} />
        {/* Header & Mode Switcher */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <PageHead
            title="A clear requirement. A better match."
            sub="Be specific about the role, hours, responsibilities and pay."
          />
          <div className="inline-flex rounded-xl p-1 bg-muted border border-border/80 shadow-2xs shrink-0 self-start sm:self-auto">
            <span className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-card text-foreground shadow-xs border border-border/60 flex items-center gap-1.5 cursor-default">
              <HiOutlineBriefcase className="h-3.5 w-3.5 text-primary" />
              <span>Permanent Job</span>
            </span>
            <Link
              to="/employer/post-shift"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5"
            >
              <HiOutlineBolt className="h-3.5 w-3.5 text-primary" />
              <span>On-Demand Shift</span>
            </Link>
          </div>
        </div>

        {/* 2-Column Grid: Form (Left) + Candidate Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Form (8 Columns) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* 01 · The Role */}
            <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-2xs space-y-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                01 · The Role
              </p>

              {/* Job Title */}
              <div className="space-y-1.5">
                <label htmlFor="role-title" className="text-xs font-semibold text-foreground block">
                  Job title <span className="text-destructive">*</span>
                </label>
                <input
                  id="role-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter role title (e.g. ICU Staff Nurse, Duty Medical Officer, Consultant)"
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                />
              </div>

              {/* Profession, Department & Work Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SelectField
                  label="Profession"
                  required
                  options={professions}
                  value={profession}
                  onChange={setProfession}
                  placeholder="Select profession"
                  searchable
                />

                <SelectField
                  label="Department"
                  required
                  options={hospitalDepts}
                  value={dept}
                  onChange={setDept}
                  placeholder="Select department"
                  searchable
                />

                <SelectField
                  label="Work location"
                  required
                  options={cityOptions}
                  value={workLocation}
                  onChange={setWorkLocation}
                  placeholder="Select hospital location / city"
                  searchable
                />
              </div>

              {/* Employment Type */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Employment type <span className="text-destructive">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {empTypes.map((type) => {
                    const isSelected = empType === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setEmpType(type)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                            : "bg-muted/40 border-border/70 text-foreground hover:bg-muted"
                        )}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* 02 · The Details */}
            <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-2xs space-y-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                02 · The Details
              </p>

              {/* Salary & Openings */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="min-salary" className="text-xs font-semibold text-foreground block">
                    Min salary / month <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                      ₹
                    </span>
                    <input
                      id="min-salary"
                      type="number"
                      step={1000}
                      required
                      value={minSalary}
                      onChange={(e) => setMinSalary(e.target.value)}
                      className="w-full h-11 pl-8 pr-3.5 rounded-xl border border-input bg-background text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="max-salary" className="text-xs font-semibold text-foreground block">
                    Max salary / month <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                      ₹
                    </span>
                    <input
                      id="max-salary"
                      type="number"
                      step={1000}
                      required
                      value={maxSalary}
                      onChange={(e) => setMaxSalary(e.target.value)}
                      className="w-full h-11 pl-8 pr-3.5 rounded-xl border border-input bg-background text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="openings-input" className="text-xs font-semibold text-foreground block">
                    Openings <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="openings-input"
                    type="number"
                    min={1}
                    max={100}
                    required
                    value={openings}
                    onChange={(e) => setOpenings(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-center"
                  />
                </div>
              </div>

              {/* Experience */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Experience <span className="text-destructive">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {expOptions.map((opt) => {
                    const isSelected = experience === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setExperience(opt)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                            : "bg-muted/40 border-border/70 text-foreground hover:bg-muted"
                        )}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Shift */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Shift
                </label>
                <div className="flex flex-wrap gap-2">
                  {shiftOptions.map((opt) => {
                    const isSelected = shifts.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleShift(opt)}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-1.5",
                          isSelected
                            ? "bg-primary/10 border-primary text-primary font-bold shadow-2xs"
                            : "bg-muted/40 border-border/70 text-muted-foreground hover:text-foreground hover:bg-muted"
                        )}
                      >
                        {isSelected && <HiOutlineCheck className="h-3.5 w-3.5 stroke-[3]" />}
                        <span>{opt}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Responsibilities & Requirements */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <label htmlFor="responsibilities-text" className="text-xs font-semibold text-foreground">
                    Responsibilities &amp; requirements <span className="text-destructive">*</span>
                  </label>
                  <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
                    {description && (description.includes("**") || description.includes("###")) && (
                      <button
                        type="button"
                        onClick={() => {
                          setDescription(formatClinicalJobDescription(description));
                          toast.success("Formatted job description cleanly!");
                        }}
                        className="text-[11px] font-semibold text-primary hover:underline cursor-pointer"
                      >
                        Format Cleanly
                      </button>
                    )}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      isLoading={generatingJd}
                      loadingText="Generating with Ally..."
                      onClick={async () => {
                        setGeneratingJd(true);
                        try {
                          const res = await generateJobDescriptionWithAi({
                            title: title || profession || "",
                            department: dept || "",
                            minSalary,
                            maxSalary,
                            experience,
                            shifts,
                            empType,
                            location: workLocation || hospitalCity,
                            openings,
                          });
                          if (res.response) {
                            setDescription(formatClinicalJobDescription(res.response));
                            toast.success("Ally Generated NABH-Compliant Job Description!");
                          }
                        } finally {
                          setGeneratingJd(false);
                        }
                      }}
                      className="h-7 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/25 px-2.5 text-[11px] font-bold shadow-none cursor-pointer gap-1.5"
                    >
                      <BotMessageSquare className="h-3.5 w-3.5 text-primary" />
                      <span>Auto-Generate with Ally</span>
                    </Button>
                  </div>
                </div>
                <textarea
                  id="responsibilities-text"
                  required
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={() => {
                    if (description && (description.includes("**") || description.includes("###"))) {
                      setDescription(formatClinicalJobDescription(description));
                    }
                  }}
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text");
                    if (pasted && (pasted.includes("**") || pasted.includes("###"))) {
                      e.preventDefault();
                      const formatted = formatClinicalJobDescription(pasted);
                      const target = e.currentTarget;
                      const start = target.selectionStart;
                      const end = target.selectionEnd;
                      const nextVal = description.substring(0, start) + formatted + description.substring(end);
                      setDescription(nextVal);
                    }
                  }}
                  placeholder="Detail clinical scope, duties, registrations, certifications, and shift timings…"
                  className="w-full p-3.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y font-normal leading-relaxed"
                />
              </div>
            </section>

            {/* 03 · Screening */}
            <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-2xs space-y-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                03 · Screening
              </p>

              <div className="space-y-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setRequireCouncilReg(!requireCouncilReg)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setRequireCouncilReg(!requireCouncilReg)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Require professional registration
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Only show applicants with a verified State Council registration
                    </span>
                  </div>
                  <Switch
                    checked={requireCouncilReg}
                    onCheckedChange={setRequireCouncilReg}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setIsUrgent(!isUrgent)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setIsUrgent(!isUrgent)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Mark as urgent
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Highlight this role to available candidates with priority badge
                    </span>
                  </div>
                  <Switch
                    checked={isUrgent}
                    onCheckedChange={setIsUrgent}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>
            </section>

            {/* Mobile Actions */}
            <div className="flex lg:hidden justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={submit("Draft")}
                className="rounded-xl h-10 px-5 text-xs font-semibold cursor-pointer"
              >
                Save local draft
              </Button>
              <Button
                type="submit"
                size="lg"
                className="rounded-xl h-10 px-6 text-xs font-bold cursor-pointer"
              >
                Publish job
              </Button>
            </div>
          </div>

          {/* Right Column: Live Candidate Preview & Desktop Action Card (4 Columns) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-20">
            {/* Live Preview Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <span className="text-xs font-bold text-foreground">
                  Candidate Card Preview
                </span>
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                  Live View
                </span>
              </div>

              {/* Exact Card Preview */}
              <div className="rounded-2xl border border-border/90 bg-muted/20 p-4 shadow-sm space-y-3 relative overflow-hidden">
                {isUrgent && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-bl-lg shadow-2xs flex items-center gap-1">
                    <HiOutlineFire className="h-3 w-3" />
                    <span>Urgent</span>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <OrgMark name={hospitalName} className="h-10 w-10 text-xs" />
                  <div className="min-w-0 flex-1 pr-6">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs text-muted-foreground font-medium truncate">
                        {hospitalName}
                      </span>
                      <RiVerifiedBadgeFill className="h-3 w-3 text-emerald-600 shrink-0" />
                    </div>
                    <h3 className="font-bold text-sm text-foreground leading-snug line-clamp-1 mt-0.5">
                      {title || "Job Title"}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1 truncate">
                        <HiOutlineMapPin className="h-3 w-3 shrink-0 text-primary" />
                        <span>{workLocation || "Location Pending"}</span>
                      </span>
                      {dept && (
                        <>
                          <span>•</span>
                          <span className="truncate">{dept}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="font-mono font-bold text-primary bg-primary-soft/60 px-2 py-0.5 rounded-md border border-primary/20">
                    {salaryDisplay} {salaryDisplay !== "Pay Scale Pending" ? "/ mo" : ""}
                  </span>
                  {experience && (
                    <span className="bg-muted px-2 py-0.5 rounded-md text-foreground font-medium">
                      {experience}
                    </span>
                  )}
                  {empType && (
                    <span className="bg-muted px-2 py-0.5 rounded-md text-foreground font-medium">
                      {empType}
                    </span>
                  )}
                </div>

                {requireCouncilReg && (
                  <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-medium">
                    ✓ Verified Council Registration Required
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Sticky Action Bar */}
            <div className="hidden lg:block rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
              <Button
                type="submit"
                size="lg"
                className="w-full rounded-xl h-11 text-sm font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs cursor-pointer"
              >
                Publish job
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={submit("Draft")}
                className="w-full rounded-xl h-9 text-xs font-semibold border-border/80 hover:bg-muted cursor-pointer"
              >
                Save local draft
              </Button>
            </div>
          </div>
        </div>
      </fieldset>
      </form>
    </AppShell>
  );
}
