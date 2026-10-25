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
  HiOutlineInformationCircle,
  HiOutlineCheckCircle,
  HiOutlinePhone,
  HiOutlineLockClosed,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineAdjustmentsHorizontal,
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell } from "@/components/fale/AppShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  { role: "Pediatric Ward Nurse", dept: "Pediatrics", defaultRate: 380 },
  { role: "Phlebotomist", dept: "Sample collection", defaultRate: 260 },
  { role: "Duty Medical Officer", dept: "General Inpatient", defaultRate: 750 },
];

// Preset Hospital Departments
const hospitalDepts = [
  "Critical care",
  "Emergency & Trauma",
  "Operation Theatre",
  "Nephrology",
  "Cardiology",
  "Pediatrics",
  "General Inpatient",
  "Sample collection",
  "Radiology & Imaging",
];

// Shift Slot Timing Options with React Icons
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
    desc: "Custom shift duration",
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
  const [customDate, setCustomDate] = useState("2026-10-20");
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
        color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800",
        message: "High pay rate. Typically claimed within 15–30 minutes by verified talent.",
        multiplier: "2.8x faster acceptance",
      };
    }
    if (hourlyRate >= typicalMin) {
      return {
        label: "Market Standard",
        color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800",
        message: "Aligns with prevailing city benchmarks for verified healthcare professionals.",
        multiplier: "1–2 hr response",
      };
    }
    return {
      label: "Below Benchmark",
      color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800",
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
      <div className="w-full min-w-0 space-y-6 pb-12">
        {/* Executive Header & Navigation Switcher */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-border/80 pb-5">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <span>Recruiter Portal</span>
              <span>/</span>
              <span className="text-primary">Clinical Staffing</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Post a healthcare shift
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed">
              Broadcast verified on-demand shifts to active healthcare staff with automated 24-hour escrow payout.
            </p>
          </div>

          {/* Segmented Switcher with React Icons */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
            <div className="inline-flex rounded-xl p-1 bg-muted border border-border shadow-2xs">
              <Link
                to="/employer/post"
                className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5"
              >
                <HiOutlineBriefcase className="h-3.5 w-3.5" />
                <span>Permanent Job</span>
              </Link>
              <span className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-card text-foreground shadow-xs border border-border/60 flex items-center gap-1.5">
                <HiOutlineBolt className="h-3.5 w-3.5 text-emerald-500" />
                <span>On-Demand Shift</span>
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePublishShift("Draft")}
              className="rounded-xl text-xs font-semibold h-9 px-3.5 cursor-pointer"
            >
              Save draft
            </Button>
          </div>
        </div>

        {/* 2-Column Responsive Layout: Form Builder (Left 60%) + Live Candidate Preview (Right 40%) */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 items-start">
          {/* LEFT COLUMN: Shift Form Builder (7 cols on lg) */}
          <div className="space-y-5 lg:col-span-7">
            {/* 1. Clinical Role & Department */}
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <HiOutlineBriefcase className="h-4 w-4 text-primary" />
                  Role & Department
                </h2>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Required</span>
              </div>

              {/* Role Presets */}
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-2">
                  Quick clinical role presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {clinicalRolePresets.map((preset) => {
                    const isSelected = roleTitle === preset.role;
                    return (
                      <button
                        type="button"
                        key={preset.role}
                        onClick={() => handleSelectPresetRole(preset)}
                        className={cn(
                          "px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary-soft text-primary font-bold shadow-2xs"
                            : "border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground"
                        )}
                      >
                        {preset.role}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role Title Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Job / Shift Title <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  placeholder="e.g. ICU Staff Nurse (Ventilator Care)"
                  className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                />
              </div>

              {/* Custom Selects for Department & City */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Department <span className="text-destructive">*</span>
                  </label>
                  <Select value={dept} onValueChange={setDept}>
                    <SelectTrigger className="h-10 rounded-xl border-input bg-card text-xs font-medium">
                      <SelectValue placeholder="Select Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {hospitalDepts.map((d) => (
                        <SelectItem key={d} value={d} className="text-xs">
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    City <span className="text-destructive">*</span>
                  </label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger className="h-10 rounded-xl border-input bg-card text-xs font-medium">
                      <SelectValue placeholder="Select City" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableCities.map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Unit / Floor Specifics */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Unit / Floor Location
                </label>
                <div className="relative">
                  <HiOutlineBuildingOffice2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={unitFloor}
                    onChange={(e) => setUnitFloor(e.target.value)}
                    placeholder="e.g. 3rd Floor, Main ICU Block B"
                    className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>
              </div>
            </div>

            {/* 2. Schedule, Timing & Staff Openings */}
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <HiOutlineCalendarDays className="h-4 w-4 text-primary" />
                  Schedule & Timing
                </h2>
                <span className="text-xs font-semibold text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md">
                  {activeHours}h duration
                </span>
              </div>

              {/* Date Selection */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">
                  Shift Date <span className="text-destructive">*</span>
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
                            ? "border-primary bg-primary text-primary-foreground shadow-xs"
                            : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                        )}
                      >
                        {dOpt}
                      </button>
                    );
                  })}
                </div>

                {dateOption === "Custom Date" && (
                  <div className="mt-2.5">
                    <input
                      type="date"
                      value={customDate}
                      onChange={(e) => setCustomDate(e.target.value)}
                      className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                )}
              </div>

              {/* Shift Timing Slots with React Icons */}
              <div>
                <label className="block text-xs font-bold text-foreground mb-2">
                  Shift Timing Slot <span className="text-destructive">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {shiftSlots.map((slot) => {
                    const isSelected = selectedSlot === slot.id;
                    const SlotIcon = slot.icon;
                    return (
                      <div
                        key={slot.id}
                        onClick={() => setSelectedSlot(slot.id)}
                        className={cn(
                          "p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3",
                          isSelected
                            ? "border-primary bg-primary-soft/40 ring-1 ring-primary shadow-xs"
                            : "border-border bg-card hover:border-primary/40 hover:bg-muted/30"
                        )}
                      >
                        <div
                          className={cn(
                            "grid h-8 w-8 shrink-0 place-items-center rounded-lg mt-0.5",
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-2xs"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          <SlotIcon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-foreground">{slot.name}</span>
                            <span className="text-[11px] font-bold text-primary">{slot.hours}h</span>
                          </div>
                          <span className="text-xs font-mono text-muted-foreground block mt-0.5">
                            {slot.time}
                          </span>
                          <span className="text-[10px] text-muted-foreground/80 block mt-0.5">
                            {slot.desc}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Time inputs */}
                {selectedSlot === "custom" && (
                  <div className="mt-3 grid grid-cols-3 gap-2.5 p-3 rounded-xl border border-border bg-muted/30">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-foreground mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={customStartTime}
                        onChange={(e) => setCustomStartTime(e.target.value)}
                        className="h-9 w-full rounded-lg border border-input bg-card px-2 text-xs font-medium"
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
                        className="h-9 w-full rounded-lg border border-input bg-card px-2 text-xs font-medium"
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
                        className="h-9 w-full rounded-lg border border-input bg-card px-2 text-xs font-medium"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Staff Openings Stepper */}
              <div className="pt-2 border-t border-border flex items-center justify-between">
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
                    className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-foreground font-bold hover:bg-muted cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-foreground font-mono">
                    {openings}
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpenings((o) => Math.min(20, o + 1))}
                    className="grid h-8 w-8 place-items-center rounded-lg border border-border bg-card text-foreground font-bold hover:bg-muted cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Compensation & Surge Pay */}
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <HiOutlineCurrencyRupee className="h-4 w-4 text-primary" />
                  Compensation & Escrow
                </h2>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                  24-hr Payout Escrow
                </span>
              </div>

              {/* Rate Input */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground">
                    Hourly Pay Rate (₹ / hour) <span className="text-destructive">*</span>
                  </label>
                  <span className="text-xs font-mono font-semibold text-muted-foreground">
                    Total per worker: <strong className="text-foreground">₹{payPerWorker.toLocaleString()}</strong>
                  </span>
                </div>

                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-muted-foreground">
                    ₹
                  </span>
                  <input
                    type="number"
                    min={150}
                    max={5000}
                    step={10}
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Math.max(0, Number(e.target.value)))}
                    className="h-11 w-full rounded-xl border border-input bg-card pl-8 pr-20 text-base font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 font-mono"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                    / hour
                  </span>
                </div>

                {/* Preset Rates */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[11px] text-muted-foreground">Presets:</span>
                  {[320, 380, 450, 600, 850].map((r) => (
                    <button
                      type="button"
                      key={r}
                      onClick={() => setHourlyRate(r)}
                      className={cn(
                        "px-2.5 py-0.5 rounded-md text-xs font-mono transition-all cursor-pointer border",
                        hourlyRate === r
                          ? "border-primary bg-primary-soft text-primary font-bold"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      )}
                    >
                      ₹{r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Rate Benchmark Insight */}
              <div className={cn("p-3 rounded-xl border text-xs flex items-start gap-2.5 transition-colors", benchmarkAnalysis.color)}>
                <HiOutlineSparkles className="h-4 w-4 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{benchmarkAnalysis.label}</span>
                    <span className="font-semibold text-[11px] opacity-90">{benchmarkAnalysis.multiplier}</span>
                  </div>
                  <p className="mt-0.5 text-[11px] leading-relaxed opacity-90">
                    {benchmarkAnalysis.message}
                  </p>
                </div>
              </div>

              {/* Urgent Surge Toggle */}
              <div className="pt-3 border-t border-border space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <HiOutlineBolt className="h-4 w-4 text-amber-500" /> Urgent Surge Incentive
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Prioritize shift and broadcast immediate alert notifications
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsUrgent((u) => !u)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      isUrgent ? "bg-primary" : "bg-muted"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                        isUrgent ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>

                {isUrgent && (
                  <div className="space-y-1.5 pt-1 animate-in fade-in duration-200">
                    <label className="block text-[11px] font-semibold text-muted-foreground">
                      Surge Highlight Reason (shown on shift card)
                    </label>
                    <input
                      type="text"
                      value={surgeReason}
                      onChange={(e) => setSurgeReason(e.target.value)}
                      placeholder="e.g. +₹50/hr Night Surge, Critical shortage cover"
                      className="h-9 w-full rounded-lg border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* 4. Verification & Perks */}
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <HiOutlineShieldCheck className="h-4 w-4 text-primary" />
                  Clinical Screening & Amenities
                </h2>
                <span className="text-xs font-medium text-muted-foreground">Quality Check</span>
              </div>

              {/* Toggles */}
              <div className="space-y-2.5">
                <label
                  onClick={() => setRequireCouncilReg((v) => !v)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/20 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={requireCouncilReg}
                    onChange={() => { }}
                    className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Require State Nursing / Medical Council Registration
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Only verified candidates with active registration numbers can claim this shift.
                    </span>
                  </div>
                </label>

                <label
                  onClick={() => setRequireBLS((v) => !v)}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-muted/20 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={requireBLS}
                    onChange={() => { }}
                    className="mt-0.5 h-4 w-4 rounded text-primary focus:ring-primary"
                  />
                  <div>
                    <span className="text-xs font-bold text-foreground block">
                      Require Active BLS / ACLS Certification
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      Mandatory for Critical Care, Emergency, and Cath Lab shifts.
                    </span>
                  </div>
                </label>
              </div>

              {/* Custom Select for Experience */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-xs font-bold text-foreground">
                  Minimum Experience Required
                </label>
                <Select value={minExp} onValueChange={setMinExp}>
                  <SelectTrigger className="h-10 rounded-xl border-input bg-card text-xs font-medium">
                    <SelectValue placeholder="Select Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    {experienceOptions.map((exp) => (
                      <SelectItem key={exp} value={exp} className="text-xs">
                        {exp}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Perks / Amenities */}
              <div className="space-y-2 pt-2 border-t border-border">
                <label className="block text-xs font-bold text-foreground">
                  Amenities & Perks Provided
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
                          "px-2.5 py-1 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer",
                          isSelected
                            ? "border-primary bg-primary-soft text-primary font-bold shadow-2xs"
                            : "border-border bg-card text-muted-foreground hover:border-border/80"
                        )}
                      >
                        {isSelected && <HiCheck className="h-3.5 w-3.5 stroke-[3]" />}
                        <span>{perk}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 5. Supervisor & Handover Protocol */}
            <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-3">
                <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                  <HiOutlinePhone className="h-4 w-4 text-primary" />
                  Supervisor & Handover Protocol
                </h2>
                <span className="text-xs font-medium text-muted-foreground">Reporting Info</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    Duty In-charge / Supervisor Name
                  </label>
                  <input
                    type="text"
                    value={supervisorName}
                    onChange={(e) => setSupervisorName(e.target.value)}
                    placeholder="e.g. Sister Mary (DNS)"
                    className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-foreground">
                    In-charge Contact Number
                  </label>
                  <div className="relative">
                    <HiOutlinePhone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      value={supervisorPhone}
                      onChange={(e) => setSupervisorPhone(e.target.value)}
                      placeholder="+91 98450 12345"
                      className="h-10 w-full rounded-xl border border-input bg-card pl-9 pr-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-foreground">
                  Reporting & Duty Entry Instructions
                </label>
                <textarea
                  rows={2}
                  value={dutyNotes}
                  onChange={(e) => setDutyNotes(e.target.value)}
                  placeholder="Where to report, dress code, security pass entry..."
                  className="w-full rounded-xl border border-input bg-card p-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
                />
              </div>
            </div>

            {/* Bottom Actions for Mobile */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 lg:hidden">
              <Button
                variant="outline"
                size="default"
                onClick={() => handlePublishShift("Draft")}
                className="w-full sm:w-auto rounded-xl font-semibold text-xs h-11"
              >
                Save as draft
              </Button>
              <Button
                size="default"
                onClick={() => handlePublishShift("Open")}
                className="w-full sm:w-auto rounded-xl font-bold text-xs h-11 gap-2 shadow-sm bg-primary hover:bg-primary-hover"
              >
                <HiOutlineBolt className="h-4 w-4" /> Publish & dispatch shift
              </Button>
            </div>
          </div>

          {/* RIGHT COLUMN: Live Candidate Preview & Escrow Economics (5 cols on lg) */}
          <div className="space-y-5 lg:col-span-5 lg:sticky lg:top-[calc(var(--header-offset,4rem)+1.5rem)] transition-all duration-300 ease-in-out">
            {/* Live Candidate View Card Container */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Candidate Card Preview
                </span>
                <span className="text-[11px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  What talent sees
                </span>
              </div>

              {/* Exact Replicated Shift Card as seen on /shifts */}
              <div className="rounded-2xl border border-primary/30 bg-card p-5 shadow-sm space-y-3.5 relative overflow-hidden transition-all">
                {isUrgent && (
                  <div className="absolute top-0 right-0">
                    <span className="inline-flex items-center gap-1 rounded-bl-xl bg-destructive text-destructive-foreground px-3 py-1 text-[10px] font-bold shadow-xs">
                      <HiOutlineBolt className="h-3 w-3" /> URGENT COVER
                    </span>
                  </div>
                )}

                {/* Card Header: Hospital & Title */}
                <div className="flex items-start gap-3 pr-16">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary font-black text-sm shadow-2xs">
                    {hospitalName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-foreground leading-snug truncate">
                      {roleTitle || "Untitled Shift"}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                      <span>{hospitalName}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5">
                        <HiOutlineMapPin className="h-3 w-3 shrink-0" />
                        {city}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Shift Schedule Timing Line */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-foreground font-medium pt-1">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold">
                    <HiOutlineCalendarDays className="h-3.5 w-3.5 text-primary" />
                    {dateOption}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1 text-xs font-semibold font-mono">
                    <HiOutlineClock className="h-3.5 w-3.5 text-primary" />
                    {activeTimeStr} ({activeHours}h)
                  </span>
                </div>

                {/* Department & Surge reason */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-secondary/60 text-secondary-foreground px-2 py-0.5 text-[11px] font-semibold">
                    {dept}
                  </span>
                  {isUrgent && surgeReason && (
                    <span className="rounded-md bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-[11px] font-bold">
                      {surgeReason}
                    </span>
                  )}
                  {requireCouncilReg && (
                    <span className="rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-[10px] font-semibold flex items-center gap-1">
                      <HiOutlineShieldCheck className="h-3 w-3" /> Council Reg
                    </span>
                  )}
                </div>

                {/* Selected Perks Pills */}
                {selectedPerks.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedPerks.slice(0, 3).map((p) => (
                      <span
                        key={p}
                        className="rounded-full bg-muted/60 text-muted-foreground px-2 py-0.5 text-[10px] font-medium"
                      >
                        ✓ {p}
                      </span>
                    ))}
                    {selectedPerks.length > 3 && (
                      <span className="rounded-full bg-muted/60 text-muted-foreground px-2 py-0.5 text-[10px] font-medium">
                        +{selectedPerks.length - 3} more
                      </span>
                    )}
                  </div>
                )}

                {/* Card Footer: Pay & Action Button */}
                <div className="pt-3 border-t border-border flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Shift Pay
                    </span>
                    <span className="text-lg font-black text-foreground font-mono">
                      ₹{payPerWorker.toLocaleString()}{" "}
                      <span className="text-xs font-medium text-muted-foreground font-sans">
                        (₹{hourlyRate}/hr)
                      </span>
                    </span>
                  </div>

                  <span className="rounded-xl bg-primary text-primary-foreground px-4 py-2 text-xs font-bold shadow-xs opacity-90 select-none">
                    Claim shift →
                  </span>
                </div>
              </div>
            </div>

            {/* Escrow Financial Commitment Card */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <HiOutlineLockClosed className="h-4 w-4 text-primary" />
                  Escrow Guarantee Breakdown
                </span>
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                  100% Protected
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Pay rate per professional:</span>
                  <span className="font-mono text-foreground font-semibold">
                    ₹{hourlyRate}/hr × {activeHours}h = ₹{payPerWorker.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Number of required openings:</span>
                  <span className="font-mono text-foreground font-semibold">
                    {openings} {openings === 1 ? "staff" : "staff slots"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Platform fee:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    ₹0 (Partner Hospital Tier)
                  </span>
                </div>
                <div className="pt-2.5 border-t border-border flex items-center justify-between font-bold text-sm">
                  <span className="text-foreground">Total Escrow Commitment:</span>
                  <span className="text-xl font-black text-foreground font-mono text-primary">
                    ₹{totalEscrowAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed pt-1">
                Funds are held in secure FALE Escrow and automatically disbursed to the professional within 24 hours of supervisor duty attendance verification.
              </p>
            </div>

            {/* Instant Talent Match Pool Gauge */}
            <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <HiOutlineUserGroup className="h-4 w-4 text-primary" />
                  Instant Talent Match
                </span>
                <span className="text-xs font-bold text-primary font-mono">
                  ~{estimatedTalentCount} verified staff
                </span>
              </div>

              <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-gradient-to-r from-primary to-orange-400 rounded-full w-[82%]" />
              </div>

              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Direct SMS & WhatsApp broadcast will be dispatched to ~{estimatedTalentCount} verified {dept} specialists within 15 km of {city}.
              </p>
            </div>

            {/* Desktop Actions */}
            <div className="hidden lg:flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() => handlePublishShift("Draft")}
                className="flex-1 rounded-xl font-semibold text-xs h-11 cursor-pointer"
              >
                Save as draft
              </Button>
              <Button
                size="lg"
                onClick={() => handlePublishShift("Open")}
                className="flex-2 rounded-xl font-bold text-xs h-11 gap-2 shadow-sm bg-primary hover:bg-primary-hover cursor-pointer"
              >
                <HiOutlineBolt className="h-4 w-4" /> Publish & dispatch shift
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Celebration & Confirmation Modal */}
      <Dialog open={publishedShiftModalOpen} onOpenChange={setPublishedShiftModalOpen}>
        <DialogContent className="sm:max-w-md p-6 text-center space-y-4">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm animate-in zoom-in-75 duration-300">
            <HiOutlineCheckCircle className="h-9 w-9 stroke-[2]" />
          </div>

          <DialogHeader className="text-center space-y-1">
            <DialogTitle className="text-xl font-black text-foreground">
              Shift Published & Dispatched!
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
              <span className="font-semibold text-foreground font-mono">{activeTimeStr}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Escrow Allocated:</span>
              <span className="font-bold text-primary font-mono">₹{totalEscrowAmount.toLocaleString()}</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              size="default"
              onClick={() => {
                setPublishedShiftModalOpen(false);
                navigate({ to: "/shifts" });
              }}
              className="rounded-xl font-bold text-xs h-10 gap-1.5 shadow-xs cursor-pointer"
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
