import { useState, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  HiOutlineClock,
  HiOutlineBriefcase,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineMapPin,
  HiOutlineCalendarDays,
  HiOutlineBolt,
  HiOutlineCurrencyRupee,
  HiOutlineBuildingOffice2,
  HiOutlineUserGroup,
  HiCheck,
  HiOutlineCheckCircle,
  HiOutlinePhone,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineAcademicCap,
  HiOutlineFire,
  HiOutlineLockClosed,
} from "react-icons/hi2";
import { RiVerifiedBadgeFill, RiHospitalLine } from "react-icons/ri";
import { toast } from "sonner";
import { AppShell } from "@/components/fale/AppShell";
import { OrgMark } from "@/components/fale/JobCard";
import { SelectField } from "@/components/fale/fields";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useApp, setState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employer/post-shift")({
  head: () => ({
    meta: [
      { title: "Post a Healthcare Shift — FALE Instant Staffing" },
      {
        name: "description",
        content:
          "Broadcast on-demand healthcare shifts to verified nurses, doctors, and technicians with automated 24-hr escrow payout.",
      },
      { property: "og:title", content: "Post a Healthcare Shift — FALE" },
      {
        property: "og:description",
        content: "Fill urgent clinical shifts with verified healthcare professionals.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PostShiftScreen,
});

// Preset Clinical Roles for fast 1-click selection
const clinicalRolePresets = [
  { role: "ICU Staff Nurse", dept: "Critical care", defaultRate: 450 },
  { role: "Emergency Medical Officer", dept: "Emergency & Trauma", defaultRate: 850 },
  { role: "OT Scrub Nurse", dept: "Operation Theatre", defaultRate: 420 },
  { role: "Dialysis Technician", dept: "Nephrology", defaultRate: 350 },
  { role: "Cath Lab Specialist", dept: "Cardiology", defaultRate: 480 },
  { role: "Pediatric Ward Nurse", dept: "Pediatrics & NICU", defaultRate: 380 },
  { role: "Phlebotomist", dept: "General Inpatient", defaultRate: 260 },
  { role: "Duty Medical Officer", dept: "General Inpatient", defaultRate: 750 },
];

// Preset Hospital Departments
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

// Shift Slot Timing Options
const shiftSlots = [
  {
    id: "morning",
    name: "Morning Shift",
    time: "07:00 – 15:00",
    hours: 8,
    icon: HiOutlineSun,
    desc: "Day duty cover",
  },
  {
    id: "evening",
    name: "Evening Shift",
    time: "14:00 – 22:00",
    hours: 8,
    icon: HiOutlineClock,
    desc: "Peak handover shift",
  },
  {
    id: "night",
    name: "Night Duty Shift",
    time: "20:00 – 08:00",
    hours: 12,
    icon: HiOutlineMoon,
    desc: "Overnight cover",
  },
  {
    id: "custom",
    name: "Custom Hours",
    time: "09:00 – 17:00",
    hours: 8,
    icon: HiOutlineAdjustmentsHorizontal,
    desc: "Flexible duration",
  },
];

const availableCities = [
  "Bengaluru",
  "Chennai",
  "Mumbai",
  "Hyderabad",
  "Delhi NCR",
  "Kolkata",
  "Pune",
];

const experienceOptions = ["Fresher OK", "1–2 yrs", "2–5 yrs", "5+ yrs"];

const staffPerksList = [
  "Dinner provided",
  "Lunch included",
  "Breakfast provided",
  "Cab drop / Travel allowance",
  "Scrub kit provided",
  "Duty rest room access",
  "ACLS floor support",
];

function PostShiftScreen() {
  const store = useApp();
  const navigate = useNavigate();
  const hospitalName = String(store.profile["org"] || "Apollo Hospitals");

  // Form State
  const [roleTitle, setRoleTitle] = useState("ICU Staff Nurse");
  const [dept, setDept] = useState("Critical care");
  const [city, setCity] = useState("Bengaluru");
  const [unitFloor, setUnitFloor] = useState("3rd Floor, Main ICU Block B");
  const [dateOption, setDateOption] = useState("Today · Urgent");
  const [customDate, setCustomDate] = useState("2026-10-31");
  const [selectedSlot, setSelectedSlot] = useState("night");
  const [customStartTime, setCustomStartTime] = useState("20:00");
  const [customEndTime, setCustomEndTime] = useState("08:00");
  const [customHours, setCustomHours] = useState(12);
  const [hourlyRate, setHourlyRate] = useState(450);
  const [openings, setOpenings] = useState(2);
  const [isUrgent, setIsUrgent] = useState(true);
  const [surgeReason, setSurgeReason] = useState("+₹50/hr Night Surge");
  const [requireCouncilReg, setRequireCouncilReg] = useState(true);
  const [requireBLS, setRequireBLS] = useState(true);
  const [minExp, setMinExp] = useState("1–2 yrs");
  const [selectedPerks, setSelectedPerks] = useState<string[]>([
    "Dinner provided",
    "Cab drop / Travel allowance",
    "Scrub kit provided",
  ]);
  const [supervisorName, setSupervisorName] = useState("Sister Mary (DNS In-charge)");
  const [supervisorPhone, setSupervisorPhone] = useState("+91 98450 12345");
  const [dutyNotes, setDutyNotes] = useState(
    "Report to Nursing Station 4 at least 15 minutes before shift start. Carry original State Nursing Council registration card and government photo ID."
  );

  // Success Modal State
  const [publishedShiftModalOpen, setPublishedShiftModalOpen] = useState(false);

  // Computed timing & hours
  const activeTimeStr = useMemo(() => {
    if (selectedSlot === "custom") {
      return `${customStartTime} – ${customEndTime}`;
    }
    const slot = shiftSlots.find((s) => s.id === selectedSlot);
    return slot ? slot.time : "20:00 – 08:00";
  }, [selectedSlot, customStartTime, customEndTime]);

  const activeHours = useMemo(() => {
    if (selectedSlot === "custom") {
      return Math.max(1, customHours);
    }
    const slot = shiftSlots.find((s) => s.id === selectedSlot);
    return slot ? slot.hours : 12;
  }, [selectedSlot, customHours]);

  // Economics
  const payPerWorker = useMemo(() => hourlyRate * activeHours, [hourlyRate, activeHours]);
  const totalEscrowAmount = useMemo(() => payPerWorker * openings, [payPerWorker, openings]);

  // Rate Benchmark analysis
  const benchmarkAnalysis = useMemo(() => {
    let typicalMin = 350;
    let typicalMax = 450;
    if (
      dept.toLowerCase().includes("emergency") ||
      roleTitle.toLowerCase().includes("officer") ||
      roleTitle.toLowerCase().includes("doctor")
    ) {
      typicalMin = 700;
      typicalMax = 950;
    } else if (
      dept.toLowerCase().includes("sample") ||
      roleTitle.toLowerCase().includes("phlebotomist")
    ) {
      typicalMin = 220;
      typicalMax = 300;
    }

    if (hourlyRate >= typicalMax) {
      return {
        label: "Competitive Rate",
        color: "text-emerald-700 bg-emerald-500/10 border-emerald-500/30 dark:text-emerald-400",
        message: "High pay rate. Typically claimed within 15–30 minutes by verified talent.",
        multiplier: "2.8x faster acceptance",
      };
    }
    if (hourlyRate >= typicalMin) {
      return {
        label: "Market Standard",
        color: "text-blue-700 bg-blue-500/10 border-blue-500/30 dark:text-blue-400",
        message: "Aligns with prevailing city benchmarks for verified healthcare professionals.",
        multiplier: "1–2 hr response",
      };
    }
    return {
      label: "Below Benchmark",
      color: "text-amber-700 bg-amber-500/10 border-amber-500/30 dark:text-amber-400",
      message: `Consider adjusting to ₹${typicalMin}/hr for faster urgent fill.`,
      multiplier: "Slower match",
    };
  }, [hourlyRate, dept, roleTitle]);

  // Talent pool estimate
  const estimatedTalentCount = useMemo(() => {
    const base = city === "Bengaluru" ? 92 : city === "Chennai" ? 78 : city === "Mumbai" ? 114 : 64;
    return isUrgent ? base : Math.round(base * 0.7);
  }, [city, isUrgent]);

  // Handle Role preset selection
  const handleSelectPresetRole = (p: (typeof clinicalRolePresets)[0]) => {
    setRoleTitle(p.role);
    setDept(p.dept);
    setHourlyRate(p.defaultRate);
    toast.success(`Loaded "${p.role}" shift preset`);
  };

  // Toggle perk
  const handleTogglePerk = (perk: string) => {
    setSelectedPerks((prev) =>
      prev.includes(perk) ? prev.filter((p) => p !== perk) : [...prev, perk]
    );
  };

  // Submit Shift
  const handlePublishShift = (status: "Open" | "Draft" = "Open") => {
    if (!roleTitle.trim()) {
      toast.error("Please enter a clinical role title.");
      return;
    }

    const newShiftId = "shift_" + Date.now();
    const formattedDate =
      dateOption === "Today · Urgent"
        ? "Tonight"
        : dateOption === "Tomorrow"
          ? "Tomorrow"
          : customDate;

    const newShift = {
      id: newShiftId,
      title: roleTitle,
      org: hospitalName,
      city,
      date: `${formattedDate} · ${activeTimeStr}`,
      time: activeTimeStr,
      hours: activeHours,
      rate: hourlyRate,
      dept,
      urgent: isUrgent,
      surge: isUrgent ? surgeReason : undefined,
      perks: selectedPerks,
      verified: true,
      openings,
      status,
    };

    setState((s) => ({
      postedShifts: [newShift, ...(s.postedShifts ?? [])],
    }));

    if (status === "Draft") {
      toast.success("Shift draft saved successfully", {
        description: "You can review and publish this shift anytime from your dashboard.",
      });
      navigate({ to: "/employer" });
      return;
    }

    setPublishedShiftModalOpen(true);
  };

  return (
    <AppShell>
      <div className="max-w-6xl mx-auto space-y-6 pb-16 min-w-0">
        {/* ========================================================= */}
        {/* TOP HEADER & ROUTE TOGGLE SWITCHER */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-5">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">
              Post an On-Demand Shift
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Broadcast verified on-demand shifts to clinical staff with automated 24-hour escrow payout.
            </p>
          </div>

          {/* Segmented Switcher */}
          <div className="inline-flex rounded-xl p-1 bg-muted border border-border/80 shadow-2xs shrink-0 self-start sm:self-auto">
            <Link
              to="/employer/post"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5"
            >
              <HiOutlineBriefcase className="h-3.5 w-3.5" />
              <span>Permanent Job</span>
            </Link>
            <span className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-card text-foreground shadow-xs border border-border/60 flex items-center gap-1.5 cursor-default">
              <HiOutlineBolt className="h-3.5 w-3.5 text-emerald-500" />
              <span>On-Demand Shift</span>
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* QUICK 1-CLICK ROLE PRESETS BAR */}
        {/* ========================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-muted-foreground font-semibold shrink-0">Quick presets:</span>
          {clinicalRolePresets.map((preset) => {
            const isSelected = roleTitle === preset.role;
            return (
              <button
                type="button"
                key={preset.role}
                onClick={() => handleSelectPresetRole(preset)}
                className={cn(
                  "px-3 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer whitespace-nowrap shrink-0",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                    : "bg-card border-border/70 text-foreground hover:border-primary/50 hover:bg-muted/40"
                )}
              >
                <span>{preset.role}</span>
                <span className="ml-1 opacity-80 font-mono text-[10px]">₹{preset.defaultRate}/h</span>
              </button>
            );
          })}
        </div>

        {/* ========================================================= */}
        {/* 2-COLUMN MAIN LAYOUT: FORM + LIVE CANDIDATE PREVIEW */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: FORM SECTIONS (8 COLUMNS) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* ----------------------------------------------------- */}
            {/* 01 · ROLE & DEPARTMENT */}
            {/* ----------------------------------------------------- */}
            <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                01 · Role &amp; Location
              </p>

              {/* Shift Title */}
              <div className="space-y-1.5">
                <label htmlFor="shift-title" className="text-xs font-semibold text-foreground block">
                  Clinical Shift Title <span className="text-destructive">*</span>
                </label>
                <input
                  id="shift-title"
                  type="text"
                  required
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. ICU Staff Nurse (Ventilator Care)"
                  className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                />
              </div>

              {/* Department & City Custom Selects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <SelectField
                  label="Department"
                  required
                  options={hospitalDepts}
                  value={dept}
                  onChange={setDept}
                  placeholder="Select Department"
                  searchable
                />

                <SelectField
                  label="City / Hub"
                  required
                  options={availableCities}
                  value={city}
                  onChange={setCity}
                  placeholder="Select City"
                />
              </div>

              {/* Unit / Floor Specifics */}
              <div className="space-y-1.5">
                <label htmlFor="unit-floor" className="text-xs font-semibold text-foreground block">
                  Hospital Floor &amp; Unit
                </label>
                <div className="relative">
                  <HiOutlineBuildingOffice2 className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    id="unit-floor"
                    type="text"
                    value={unitFloor}
                    onChange={(e) => setUnitFloor(e.target.value)}
                    placeholder="e.g. 3rd Floor, Main ICU Block B"
                    className="w-full h-11 pl-10 pr-3.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary placeholder:text-muted-foreground/60 font-medium"
                  />
                </div>
              </div>
            </section>

            {/* ----------------------------------------------------- */}
            {/* 02 · SCHEDULE & TIMING */}
            {/* ----------------------------------------------------- */}
            <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  02 · Schedule &amp; Timing
                </p>
                <span className="text-xs font-semibold text-primary font-mono bg-primary/10 px-2.5 py-0.5 rounded-md">
                  {activeHours}h shift duration
                </span>
              </div>

              {/* Shift Date */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Duty Date <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {["Today · Urgent", "Tomorrow", "Weekend", "Custom Date"].map((dOpt) => {
                    const isSelected = dateOption === dOpt;
                    return (
                      <button
                        type="button"
                        key={dOpt}
                        onClick={() => setDateOption(dOpt)}
                        className={cn(
                          "py-2 px-3 rounded-xl text-xs font-semibold border text-center transition-all cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-xs font-bold"
                            : "bg-muted/40 border-border/70 text-foreground hover:bg-muted"
                        )}
                      >
                        {dOpt}
                      </button>
                    );
                  })}
                </div>

                {dateOption === "Custom Date" && (
                  <div className="pt-2">
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                )}
              </div>

              {/* Shift Timing Slots */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-foreground block">
                  Duty Time Slot <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {shiftSlots.map((slot) => {
                    const isSelected = selectedSlot === slot.id;
                    const SlotIcon = slot.icon;
                    return (
                      <div
                        key={slot.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedSlot(slot.id)}
                        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedSlot(slot.id)}
                        className={cn(
                          "p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none",
                          isSelected
                            ? "border-primary bg-primary/5 ring-1 ring-primary/30 shadow-2xs"
                            : "border-border/80 bg-muted/20 hover:border-primary/40 hover:bg-muted/40"
                        )}
                      >
                        <div
                          className={cn(
                            "grid h-8 w-8 shrink-0 place-items-center rounded-lg mt-0.5",
                            isSelected
                              ? "bg-primary text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <SlotIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{slot.name}</span>
                            <span className="text-xs font-bold text-primary font-mono">{slot.hours}h</span>
                          </div>
                          <span className="text-xs font-mono text-muted-foreground block mt-0.5">
                            {slot.time}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Time inputs */}
                {selectedSlot === "custom" && (
                  <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl border border-border/80 bg-muted/30 pt-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={customStartTime}
                        onChange={(e) => setCustomStartTime(e.target.value)}
                        className="h-10 w-full rounded-xl border border-input bg-background px-2.5 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={customEndTime}
                        onChange={(e) => setCustomEndTime(e.target.value)}
                        className="h-10 w-full rounded-xl border border-input bg-background px-2.5 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Total Hours
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={24}
                        value={customHours}
                        onChange={(e) => setCustomHours(Number(e.target.value) || 1)}
                        className="h-10 w-full rounded-xl border border-input bg-background px-2.5 text-xs font-medium font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Staff Openings */}
              <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-foreground block">
                    Professionals Required
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    Number of individual duty slots to broadcast
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOpenings((o) => Math.max(1, o - 1))}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-border/80 bg-muted/40 text-foreground font-bold hover:bg-muted cursor-pointer transition-colors"
                  >
                    −
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-foreground font-mono">
                    {openings}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenings((o) => Math.min(20, o + 1))}
                    className="grid h-9 w-9 place-items-center rounded-xl border border-border/80 bg-muted/40 text-foreground font-bold hover:bg-muted cursor-pointer transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </section>

            {/* ----------------------------------------------------- */}
            {/* 03 · REMUNERATION & ESCROW ECONOMICS */}
            {/* ----------------------------------------------------- */}
            <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  03 · Remuneration &amp; Escrow
                </p>
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <HiOutlineLockClosed className="h-3 w-3" />
                  24h Escrow Guarantee
                </span>
              </div>

              {/* Hourly Rate Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="hourly-rate" className="text-xs font-semibold text-foreground block">
                    Hourly Pay Rate (₹ / hour) <span className="text-destructive">*</span>
                  </label>
                  <span className="text-xs font-mono text-muted-foreground">
                    Net per clinician: <strong className="text-foreground font-bold">₹{payPerWorker.toLocaleString("en-IN")}</strong>
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    ₹
                  </span>
                  <input
                    id="hourly-rate"
                    type="number"
                    min={150}
                    max={5000}
                    step={10}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Math.max(0, Number(e.target.value)))}
                    className="h-11 w-full rounded-xl border border-input bg-background pl-9 pr-20 text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    / hour
                  </span>
                </div>

                {/* Preset Benchmarks */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-xs text-muted-foreground font-medium">Benchmarks:</span>
                  {[320, 380, 450, 600, 850].map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setHourlyRate(r)}
                      className={cn(
                        "px-2.5 py-0.5 rounded-lg text-xs font-mono transition-all cursor-pointer border",
                        hourlyRate === r
                          ? "border-primary bg-primary text-primary-foreground font-bold shadow-2xs"
                          : "border-border/70 bg-card text-foreground hover:border-primary/40"
                      )}
                    >
                      ₹{r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Benchmark Summary Chip */}
              <div className={cn("p-3 rounded-xl border text-xs flex items-center justify-between gap-3", benchmarkAnalysis.color)}>
                <div className="flex items-center gap-2">
                  <HiOutlineSparkles className="h-4 w-4 shrink-0" />
                  <span className="font-bold">{benchmarkAnalysis.label}:</span>
                  <span className="opacity-90">{benchmarkAnalysis.message}</span>
                </div>
                <span className="font-semibold text-[11px] shrink-0 font-mono">{benchmarkAnalysis.multiplier}</span>
              </div>

              {/* Escrow Commitment Breakdown */}
              <div className="p-3.5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 text-xs space-y-1.5">
                <div className="flex justify-between items-center text-emerald-900 dark:text-emerald-200">
                  <span className="font-semibold">Nodal Escrow Allocation ({openings} {openings === 1 ? "opening" : "openings"} × {activeHours}h @ ₹{hourlyRate}/h):</span>
                  <span className="font-mono font-bold text-sm">₹{totalEscrowAmount.toLocaleString("en-IN")}</span>
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                  Funds remain safely held in Reserve Bank of India regulated Cashfree Nodal Escrow and are only transferred upon your supervisor's timesheet approval.
                </p>
              </div>

              {/* Urgent Surge Toggle */}
              <div className="pt-2 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <HiOutlineFire className="h-4 w-4 text-amber-500" />
                      <span>Urgent Night / Surge Pay Incentive</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Broadcast instant push notification to nearby off-duty clinicians
                    </span>
                  </div>
                  <Switch
                    checked={isUrgent}
                    onCheckedChange={setIsUrgent}
                  />
                </div>

                {isUrgent && (
                  <div className="space-y-1.5 pt-1">
                    <label htmlFor="surge-reason" className="text-[11px] font-semibold text-muted-foreground block">
                      Surge Highlight Reason (shown on shift card)
                    </label>
                    <input
                      id="surge-reason"
                      type="text"
                      value={surgeReason}
                      onChange={(e) => setSurgeReason(e.target.value)}
                      placeholder="e.g. +₹50/hr Night Surge, Critical ICU shortage cover"
                      className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-xs font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}
              </div>
            </section>

            {/* ----------------------------------------------------- */}
            {/* 04 · COMPLIANCE & AMENITIES */}
            {/* ----------------------------------------------------- */}
            <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                04 · Screening &amp; Amenities
              </p>

              {/* Screening Toggles */}
              <div className="space-y-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setRequireCouncilReg(!requireCouncilReg)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setRequireCouncilReg(!requireCouncilReg)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <HiOutlineShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        Require State Council Registration
                      </span>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        Only candidates with verified NMC / Nursing Council credentials can claim this shift.
                      </span>
                    </div>
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
                  onClick={() => setRequireBLS(!requireBLS)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setRequireBLS(!requireBLS)}
                  className="flex items-center justify-between p-3.5 rounded-xl border border-border/70 bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-3">
                    <HiOutlineAcademicCap className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-xs font-bold text-foreground block">
                        Require Active BLS / ACLS Certification
                      </span>
                      <span className="text-[11px] text-muted-foreground block mt-0.5">
                        Mandatory life support credential for Critical Care and Emergency duties.
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={requireBLS}
                    onCheckedChange={setRequireBLS}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              </div>

              {/* Custom Select for Experience */}
              <SelectField
                label="Minimum Experience Required"
                options={experienceOptions}
                value={minExp}
                onChange={setMinExp}
                placeholder="Select Experience"
              />

              {/* Perks / Amenities */}
              <div className="space-y-2 pt-2 border-t border-border/60">
                <label className="text-xs font-semibold text-foreground block">
                  Duty Amenities &amp; Perks Provided
                </label>
                <div className="flex flex-wrap gap-2">
                  {staffPerksList.map((perk) => {
                    const isSelected = selectedPerks.includes(perk);
                    return (
                      <button
                        type="button"
                        key={perk}
                        onClick={() => handleTogglePerk(perk)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary font-bold shadow-2xs"
                            : "bg-muted/40 border-border/70 text-foreground hover:bg-muted"
                        )}
                      >
                        {isSelected && <HiCheck className="h-3.5 w-3.5 stroke-[3]" />}
                        <span>{perk}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ----------------------------------------------------- */}
            {/* 05 · REPORTING & SUPERVISOR IN-CHARGE */}
            {/* ----------------------------------------------------- */}
            <section className="rounded-2xl border border-border/80 bg-card p-6 shadow-2xs space-y-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                05 · Supervisor &amp; Duty Instructions
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="supervisor-name" className="text-xs font-semibold text-foreground block">
                    Nursing Superintendent / In-Charge Name
                  </label>
                  <input
                    id="supervisor-name"
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    placeholder="e.g. Sister Mary (DNS In-charge)"
                    className="h-11 w-full rounded-xl border border-input bg-background px-3.5 text-xs sm:text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="supervisor-phone" className="text-xs font-semibold text-foreground block">
                    Duty Desk Direct Phone / Ext.
                  </label>
                  <div className="relative">
                    <HiOutlinePhone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      id="supervisor-phone"
                      type="text"
                      value={supervisorPhone}
                      onChange={(e) => setSupervisorPhone(e.target.value)}
                      placeholder="+91 98450 12345"
                      className="h-11 w-full rounded-xl border border-input bg-background pl-10 pr-3.5 text-xs sm:text-sm font-mono font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="duty-instructions" className="text-xs font-semibold text-foreground block">
                  Reporting &amp; Security Pass Instructions
                </label>
                <textarea
                  id="duty-instructions"
                  rows={3}
                  value={dutyNotes}
                  onChange={(e) => setDutyNotes(e.target.value)}
                  placeholder="Where to report, dress code, security pass entry, department contact details..."
                  className="w-full rounded-xl border border-input bg-background p-3.5 text-xs sm:text-sm font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none leading-relaxed"
                />
              </div>
            </section>

            {/* Mobile Actions Bottom Bar */}
            <div className="flex lg:hidden items-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => handlePublishShift("Draft")}
                className="flex-1 rounded-xl font-semibold text-xs h-11 cursor-pointer"
              >
                Save as draft
              </Button>
              <Button
                type="button"
                onClick={() => handlePublishShift("Open")}
                className="flex-2 rounded-xl font-bold text-xs h-11 gap-1.5 shadow-sm bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer"
              >
                <HiOutlineBolt className="h-4 w-4" />
                <span>Publish shift</span>
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN: LIVE CANDIDATE PREVIEW & DESKTOP STICKY SIDEBAR (4 COLUMNS) */}
          <div className="lg:col-span-5 xl:col-span-4 space-y-5 lg:sticky lg:top-20">
            {/* Live Candidate Card Preview */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3.5">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <span className="text-xs font-bold text-foreground">
                  Candidate Shifts Feed Preview
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
                    <span>Urgent Shift</span>
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
                      {roleTitle || "Shift Title"}
                    </h3>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1 truncate">
                        <HiOutlineMapPin className="h-3 w-3 shrink-0 text-primary" />
                        <span>{city}</span>
                      </span>
                      <span>•</span>
                      <span className="truncate">{dept}</span>
                    </div>
                  </div>
                </div>

                {/* Timing Badge */}
                <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-foreground font-medium">
                    <HiOutlineCalendarDays className="h-3 w-3 text-primary" />
                    {dateOption}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-foreground font-mono font-medium">
                    <HiOutlineClock className="h-3 w-3 text-primary" />
                    {activeTimeStr} ({activeHours}h)
                  </span>
                </div>

                {/* Rate & Escrow Pill */}
                <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                  <div>
                    <span className="font-mono font-bold text-primary text-base">
                      ₹{hourlyRate}
                    </span>
                    <span className="text-[11px] text-muted-foreground"> / hr</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-foreground block">
                      ₹{payPerWorker.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold">
                      ✓ 24h Escrow
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Escrow Telemetry Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <HiOutlineLockClosed className="h-4 w-4 text-emerald-600" />
                  <span>Escrow Allocation</span>
                </span>
                <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                  ₹{totalEscrowAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full w-full" />
              </div>

              <div className="text-[11px] text-muted-foreground leading-relaxed flex items-center justify-between">
                <span>Nearby verified {dept} specialists:</span>
                <span className="font-bold text-foreground">~{estimatedTalentCount} available</span>
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:block rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
              <Button
                type="button"
                size="lg"
                onClick={() => handlePublishShift("Open")}
                className="w-full rounded-xl h-11 text-sm font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <HiOutlineBolt className="h-4.5 w-4.5" />
                <span>Publish &amp; Dispatch Shift</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => handlePublishShift("Draft")}
                className="w-full rounded-xl h-9 text-xs font-semibold border-border/80 hover:bg-muted cursor-pointer"
              >
                Save as draft
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Celebration & Confirmation Modal */}
      <Dialog open={publishedShiftModalOpen} onOpenChange={setPublishedShiftModalOpen}>
        <DialogContent className="sm:max-w-md p-6 text-center space-y-4 rounded-2xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm animate-in zoom-in-75 duration-300">
            <HiOutlineCheckCircle className="h-8 w-8 stroke-[2]" />
          </div>

          <DialogHeader className="text-center space-y-1">
            <DialogTitle className="text-xl font-black text-foreground">
              Shift Published &amp; Dispatched!
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Your shift has been broadcast to{" "}
              <strong className="text-foreground">{estimatedTalentCount} verified healthcare professionals</strong> in {city}.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-left text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Shift:</span>
              <span className="font-bold text-foreground">{roleTitle}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Timing:</span>
              <span className="font-semibold text-foreground font-mono">{activeTimeStr} ({activeHours}h)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Escrow Allocated:</span>
              <span className="font-bold text-primary font-mono">₹{totalEscrowAmount.toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              size="default"
              onClick={() => {
                setPublishedShiftModalOpen(false);
                navigate({ to: "/shifts" });
              }}
              className="rounded-xl font-bold text-xs h-10 gap-1.5 shadow-xs cursor-pointer bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              <span>View live on Shifts feed</span>
              <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => {
                setPublishedShiftModalOpen(false);
                navigate({ to: "/employer" });
              }}
              className="rounded-xl font-semibold text-xs h-10 cursor-pointer"
            >
              Return to Employer Dashboard
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
