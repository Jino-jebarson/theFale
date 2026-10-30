import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  HiOutlineBriefcase,
  HiOutlineBolt,
  HiOutlineMapPin,
  HiOutlineFire,
  HiOutlineCheck,
} from "react-icons/hi2";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { toast } from "sonner";
import { AppShell, PageHead } from "@/components/fale/AppShell";
import { OrgMark } from "@/components/fale/JobCard";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SelectField } from "@/components/fale/fields";
import { professions } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

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
  const store = useApp();
  const navigate = useNavigate();
  const hospitalName = String(store.profile["org"] || "Apollo Hospitals");
  const hospitalCity = String(store.profile["city"] || "Bengaluru");

  // Form State
  const [title, setTitle] = useState("Staff Nurse — ICU");
  const [profession, setProfession] = useState("Nurse");
  const [dept, setDept] = useState("Critical care");
  const [empType, setEmpType] = useState("Full-time");
  const [minSalary, setMinSalary] = useState("35000");
  const [maxSalary, setMaxSalary] = useState("50000");
  const [openings, setOpenings] = useState("3");
  const [experience, setExperience] = useState("2–5 yrs");
  const [shifts, setShifts] = useState<string[]>(["Day", "Night", "Rotational"]);
  const [description, setDescription] = useState(presets[0].desc);
  const [requireCouncilReg, setRequireCouncilReg] = useState(true);
  const [isUrgent, setIsUrgent] = useState(false);

  // Apply preset
  const handleApplyPreset = (p: (typeof presets)[0]) => {
    setTitle(p.role);
    setProfession(p.profession);
    setDept(p.dept);
    setMinSalary(String(p.minSal));
    setMaxSalary(String(p.maxSal));
    setExperience(p.exp);
    setEmpType(p.type);
    setShifts(p.shifts);
    setDescription(p.desc);
    toast.success(`Loaded "${p.role}" template`);
  };

  // Toggle shift
  const toggleShift = (s: string) => {
    setShifts((prev) =>
      prev.includes(s) ? prev.filter((item) => item !== s) : [...prev, s]
    );
  };

  // Submit Handler
  const submit = (status: "Open" | "Draft") => (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) {
      toast.error("Please add a job title");
      return;
    }

    const newId = crypto.randomUUID();
    const isPublishing = status === "Open";
    const postingStatus = isPublishing ? "Pending Admin Approval" : "Draft";
    const minN = Number(minSalary) || 0;
    const maxN = Number(maxSalary) || 0;
    const compensation = minN && maxN
      ? `₹${minN.toLocaleString("en-IN")} – ₹${maxN.toLocaleString("en-IN")} / mo`
      : "₹40,000 – ₹55,000 / mo";

    setState((s) => ({
      postedJobs: [
        {
          id: newId,
          title,
          dept: dept || "General Inpatient",
          openings: Number(openings) || 1,
          status: postingStatus,
        },
        ...s.postedJobs,
      ],
      jobApprovals: isPublishing
        ? [
            {
              id: newId,
              title,
              org: hospitalName,
              type: "job" as const,
              dept: dept || "General",
              city: hospitalCity,
              compensation,
              expOrHours: experience,
              status: "pending" as const,
              submittedDate: "Just now",
              openings: Number(openings) || 1,
              postedBy: String(s.profile["recruiter"] || "Facility HR"),
              urgent: isUrgent,
            },
            ...s.jobApprovals,
          ]
        : s.jobApprovals,
    }));

    if (isPublishing) {
      toast.success("Submitted for Admin Verification!", {
        description: "Your requirement has been sent to FALE Admin. Once verified, it will reflect on the candidate portal.",
      });
    } else {
      toast.success("Draft saved");
    }
    navigate({ to: "/employer" });
  };

  // Live salary preview
  const salaryDisplay = useMemo(() => {
    const minN = Number(minSalary) || 0;
    const maxN = Number(maxSalary) || 0;
    if (minN && maxN) {
      return `₹${minN.toLocaleString("en-IN")} – ₹${maxN.toLocaleString("en-IN")}`;
    }
    return "₹35,000 – ₹50,000";
  }, [minSalary, maxSalary]);

  return (
    <AppShell>
      <form onSubmit={submit("Open")} className="mx-auto max-w-6xl space-y-6 pb-16">
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
              <HiOutlineBolt className="h-3.5 w-3.5 text-emerald-500" />
              <span>On-Demand Shift</span>
            </Link>
          </div>
        </div>

        {/* Quick Presets Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-muted-foreground font-semibold shrink-0">Quick templates:</span>
          {presets.map((p) => {
            const isSelected = title === p.role;
            return (
              <button
                key={p.role}
                type="button"
                onClick={() => handleApplyPreset(p)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap shrink-0",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                    : "bg-card border-border/70 text-foreground hover:border-primary/50 hover:bg-muted/40"
                )}
              >
                {p.role}
              </button>
            );
          })}
        </div>

        {/* 2-Column Grid: Form (Left) + Candidate Preview (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Main Form (8 Columns) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* 01 · The Role */}
            <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-5">
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
                  placeholder="e.g. Staff Nurse — ICU"
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                />
              </div>

              {/* Profession & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-5">
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
              <div className="space-y-1.5">
                <label htmlFor="responsibilities-text" className="text-xs font-semibold text-foreground block">
                  Responsibilities &amp; requirements <span className="text-destructive">*</span>
                </label>
                <textarea
                  id="responsibilities-text"
                  required
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Duties, qualifications, registrations and benefits…"
                  className="w-full p-3.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-y font-normal leading-relaxed"
                />
              </div>
            </section>

            {/* 03 · Screening */}
            <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-4">
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
                Save draft
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
                        <span>{hospitalCity}</span>
                      </span>
                      <span>•</span>
                      <span className="truncate">{dept}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
                  <span className="font-mono font-bold text-primary bg-primary-soft/60 px-2 py-0.5 rounded-md border border-primary/20">
                    {salaryDisplay} / mo
                  </span>
                  <span className="bg-muted px-2 py-0.5 rounded-md text-foreground font-medium">
                    {experience}
                  </span>
                  <span className="bg-muted px-2 py-0.5 rounded-md text-foreground font-medium">
                    {empType}
                  </span>
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
                Save draft
              </Button>
            </div>
          </div>
        </div>
      </form>
    </AppShell>
  );
}
