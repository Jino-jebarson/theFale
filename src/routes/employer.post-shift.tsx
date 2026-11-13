import { calculateShiftCharges } from "@/lib/shiftCharges";
import { ShiftDetailsFields } from "@/components/fale/ShiftDetailsFields";
import type { ShiftDetails } from "@/lib/adapters/shiftAdapter";
import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { usePageLoad } from "@/hooks/use-page-load";
import { RequestError } from "@/components/fale/RequestError";
import { useState, useMemo, useEffect, useRef } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  HiOutlineClock,
  HiOutlineBriefcase,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineMapPin,
  HiOutlineCalendarDays,
  HiOutlineBolt,
  HiCheck,
  HiOutlineCheckCircle,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineSun,
  HiOutlineMoon,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineFire,
  HiOutlineLockClosed,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { RiVerifiedBadgeFill, RiHospitalLine } from "react-icons/ri";
import { BotMessageSquare } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/fale/AppShell";
import { OrgMark } from "@/components/fale/JobCard";
import { SelectField } from "@/components/fale/fields";
import { Button, ButtonSpinner } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useApp, setState } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled, paiseToRupees } from "@/lib/api";
import { getFacilityWallet, getHospitalBankAccount } from "@/lib/adapters/facilityAdapter";
import {
  postShift,
  updateShift,
  getFacilityShifts,
  getFacilityShiftPolicy,
  type FacilityShiftPolicyDto,
  type UiShiftItem,
} from "@/lib/adapters/shiftAdapter";
import { parseWhatsAppJobMessage, suggestShiftPayWithAi } from "@/lib/adapters/aiAdapter";

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

function PostShiftScreen() {
  const pageLoad = usePageLoad();
  const pageAction = useConfirmedAction();
  const store = useApp();
  const navigate = useNavigate();
  const hospitalName = String(store.profile["org"] || ((store.profile["hospitalName"] || "Healthcare Facility")));

  const [availableEscrow, setAvailableEscrow] = useState<number>(0);
  const [hasLinkedBank, setHasLinkedBank] = useState<boolean>(false);
  const [shiftPolicy, setShiftPolicy] = useState<FacilityShiftPolicyDto | null>(null);
  const [editingShift, setEditingShift] = useState<UiShiftItem | null>(null);
  const [publishedStatus, setPublishedStatus] = useState<string>("PENDING_APPROVAL");

  const editShiftId = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("editId");
  }, []);

  useEffect(() => {
    {
      Promise.all([
        getFacilityWallet(),
        getHospitalBankAccount(),
        getFacilityShiftPolicy(),
        editShiftId ? getFacilityShifts() : Promise.resolve([] as UiShiftItem[]),
      ]).then(([wallet, bank, policy, facShifts]) => {
        if (wallet) {
          setAvailableEscrow(paiseToRupees(wallet.availableBalancePaise));
        }
        if (bank && bank.status?.toLowerCase() === "verified" && (bank.accountNumber || (bank as any).accountNumberMasked || (bank as any).accountNumberLast4)) {
          setHasLinkedBank(true);
        }
        if (policy) {
          setShiftPolicy(policy);
          if (policy.availableBalancePaise) {
            setAvailableEscrow(paiseToRupees(policy.availableBalancePaise));
          }
        }
        if (editShiftId && Array.isArray(facShifts)) {
          const match = facShifts.find((x) => x.id === editShiftId);
          if (match) {
            setEditingShift(match);
            setRoleTitle(match.title || "");
            setDept(match.dept || "");
            setCity(match.city || "");
            setOpenings(match.slots || 1);
            setIsUrgent(Boolean(match.urgent));
            setSurgeReason(match.surgeLabel || "");
            setDutyNotes(match.description || "");
            setDetails(match.details || {});
            const baseHourly = paiseToRupees(match.rawRatePerHourPaise || 0);
            setHourlyRate(baseHourly || match.rate || 600);
            setSelectedSlot("custom");
            setCustomHours(match.hours || 8);
            if (match.startAt) {
              const sDt = new Date(match.startAt);
              setCustomDate(sDt.toISOString().slice(0, 10));
              setDateOption("Custom Date");
              setCustomStartTime(`${String(sDt.getHours()).padStart(2, "0")}:${String(sDt.getMinutes()).padStart(2, "0")}`);
            }
            if (match.endAt) {
              const eDt = new Date(match.endAt);
              setCustomEndTime(`${String(eDt.getHours()).padStart(2, "0")}:${String(eDt.getMinutes()).padStart(2, "0")}`);
            }
          }
        }
      }).catch(pageLoad.fail);
    }
  }, [store.escrowBalance, store.hospitalBankAccount, editShiftId, pageLoad.retryKey]);

  // Form State
  const [roleTitle, setRoleTitle] = useState("");
  const [details, setDetails] = useState<ShiftDetails>({});
  const [dept, setDept] = useState("");
  const [city, setCity] = useState(() => String(store.profile["city"] || ""));
  const [dateOption, setDateOption] = useState("Today · Urgent");
  const [customDate, setCustomDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedSlot, setSelectedSlot] = useState("night");
  const [customStartTime, setCustomStartTime] = useState("20:00");
  const [customEndTime, setCustomEndTime] = useState("08:00");
  const [customHours, setCustomHours] = useState(12);

  useEffect(() => {
    if (!customStartTime || !customEndTime) return;
    const [sh, sm] = customStartTime.split(":").map(Number);
    const [eh, em] = customEndTime.split(":").map(Number);
    if ([sh, sm, eh, em].some((n) => Number.isNaN(n))) return;
    const startMinutes = sh * 60 + sm;
    let endMinutes = eh * 60 + em;
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    setCustomHours(Math.max(1, Math.round((endMinutes - startMinutes) / 60)));
  }, [customStartTime, customEndTime]);
  const [hourlyRate, setHourlyRate] = useState(0);
  const [openings, setOpenings] = useState(1);
  const [isUrgent, setIsUrgent] = useState(false);
  const [surgeReason, setSurgeReason] = useState("");
  const [dutyNotes, setDutyNotes] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Success Modal State
  const [publishedShiftModalOpen, setPublishedShiftModalOpen] = useState(false);
  const [bankRequiredModalOpen, setBankRequiredModalOpen] = useState(false);
  const [insufficientEscrowModalOpen, setInsufficientEscrowModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // AI Magic WhatsApp Shift Fill State (#9)
  const [whatsAppPrompt, setWhatsAppPrompt] = useState("");
  const [aiParsing, setAiParsing] = useState(false);

  // AI Shift Pay Benchmark State (#13)
  const [aiRateSuggestion, setAiRateSuggestion] = useState<{
    recommendedHourlyRate: number;
    minHourlyRate: number;
    maxHourlyRate: number;
    fillTimeEstimateMinutes?: number | undefined;
    explanation: string;
  } | null>(null);
  const [loadingAiRate, setLoadingAiRate] = useState(false);
  const [aiRateError, setAiRateError] = useState<string | null>(null);
  const rateRequest = useRef(false);

  const handleFetchAiRateSuggestion = async (
    targetRole?: string,
    targetDept?: string,
    targetSlot?: string,
    targetCity?: string
  ) => {
    const role = targetRole || roleTitle;
    if (!role.trim() || rateRequest.current) return;
    rateRequest.current = true;
    setAiRateError(null);
    setLoadingAiRate(true);
    try {
      const activeSlot = targetSlot || selectedSlot;
      const activeCity = targetCity || city || "";
      const activeDept = targetDept || dept || "General";

      const res = await suggestShiftPayWithAi(
        `${role} in ${activeDept} (${activeSlot} shift)`,
        activeCity,
        { roleTitle: role, dept: activeDept, slot: activeSlot }
      );

      const b = res.benchmark || (res.structuredData as any);
      if (b && b.recommendedHourlyRate) {
        setAiRateSuggestion({
          recommendedHourlyRate: Number(b.recommendedHourlyRate),
          minHourlyRate: Number(b.minHourlyRate),
          maxHourlyRate: Number(b.maxHourlyRate),
          fillTimeEstimateMinutes: b.fillTimeEstimateMinutes,
          explanation: b.explanation || "Planning suggestion from published FALE shifts; review before applying.",
        });
      }
    } catch (err) {
      setAiRateSuggestion(null);
      setAiRateError(err instanceof Error ? err.message : "Could not suggest pay. Enter a rate manually or retry.");
    } finally {
      rateRequest.current = false;
      setLoadingAiRate(false);
    }
  };

  const handleAiMagicFill = async () => {
    if (!whatsAppPrompt.trim()) {
      toast.error("Please paste or type a WhatsApp shift message first.");
      return;
    }
    setAiParsing(true);
    try {
      const res = await parseWhatsAppJobMessage(whatsAppPrompt);
      if (res.structuredData) {
        const d = res.structuredData;
        const role = d.title || d.role;
        const deptName = d.department;
        const count = d.requiredCount || d.vacancies;
        const shiftType = (d.shiftType || d.shiftTiming || "").toUpperCase();
        const shiftRate = d.ratePerShift || d.payRate;
        const ratePerHour = d.hourlyRate || (shiftRate ? Math.round(Number(shiftRate) / 8) : null);

        if (role) setRoleTitle(role);
        if (deptName) {
          const matchedDept = hospitalDepts.find(
            (hd) =>
              hd.toLowerCase() === deptName.toLowerCase() ||
              deptName.toLowerCase().includes(hd.toLowerCase()) ||
              hd.toLowerCase().includes(deptName.toLowerCase())
          );
          setDept(matchedDept || deptName);
        }
        if (count) setOpenings(Number(count));
        if (shiftType.includes("NIGHT")) setSelectedSlot("night");
        else if (shiftType.includes("EVENING")) setSelectedSlot("evening");
        else if (shiftType.includes("DAY") || shiftType.includes("MORNING")) setSelectedSlot("morning");
        if (ratePerHour) setHourlyRate(Number(ratePerHour));
        const extraNotes = [d.notes, d.location ? `Unit: ${d.location}` : null]
          .filter(Boolean)
          .join(" · ");
        if (extraNotes) setDutyNotes(extraNotes);

        // Extended dynamically extracted fields
        if (d.city) {
          const matchedCity = availableCities.find((c) => c.toLowerCase() === String(d.city).toLowerCase());
          if (matchedCity) setCity(matchedCity);
        }

        if (d.date) {
          const dStr = String(d.date).toLowerCase();
          if (dStr === "today") setDateOption("Today · Urgent");
          else if (dStr === "tomorrow") setDateOption("Tomorrow");
          else if (dStr === "weekend") setDateOption("Weekend");
          else if (/^\d{4}-\d{2}-\d{2}$/.test(dStr)) {
            setDateOption("Custom Date");
            setCustomDate(dStr);
          }
        }

        if (d.isUrgent !== undefined) {
          setIsUrgent(Boolean(d.isUrgent));
        }

        setFieldErrors({});

        const summaryParts: string[] = [];
        if (role) summaryParts.push(role);
        if (count) summaryParts.push(`${count} staff`);
        if (shiftType) summaryParts.push(shiftType);
        if (ratePerHour) summaryParts.push(`₹${ratePerHour}/hr`);
        if (d.location) summaryParts.push(String(d.location));
        if (d.supervisorName) summaryParts.push(String(d.supervisorName));

        toast.success("Ally extracted shift parameters!", {
          description: summaryParts.join(" · ") || "Shift parameters auto-filled successfully.",
        });

        if (role) {
          handleFetchAiRateSuggestion(role, deptName);
        }
      } else {
        toast.info("Shift parsed", { description: res.response || "Parameters auto-filled" });
      }
    } catch {
      toast.error("Could not parse message. Please check text.");
    } finally {
      setAiParsing(false);
    }
  };

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

  // Economics (includes urgent +₹50/hr surge + facility service fee: 8% hospital reserve; first completed shift fee refunded)
  const effectiveHourlyRate = useMemo(() => hourlyRate + (isUrgent ? 50 : 0), [hourlyRate, isUrgent]);
  const payPerWorker = useMemo(() => effectiveHourlyRate * activeHours, [effectiveHourlyRate, activeHours]);
  const workerEscrowTotal = useMemo(() => payPerWorker * openings, [payPerWorker, openings]);
  const facilityFeePercent = useMemo(() => {
    if (editingShift) return editingShift.facilityFeePercent ?? 0;
    return shiftPolicy?.platformFeePercent ?? 8;
  }, [editingShift, shiftPolicy]);
  const gstPercent = editingShift ? (editingShift.platformFeeGstPercent ?? 0) : (shiftPolicy?.platformFeeGstPercent ?? 0);
  const gstRateReady = Boolean(editingShift || shiftPolicy?.platformFeeGstPercent !== undefined);
  const charges = useMemo(() => calculateShiftCharges(Math.round(payPerWorker * 100), openings, facilityFeePercent, gstPercent),
    [payPerWorker, openings, facilityFeePercent, gstPercent]);
  const facilityFeeAmount = charges.platformFeePaise / 100;
  const gstAmount = charges.platformFeeGstPaise / 100;
  const totalEscrowAmount = charges.totalPaise / 100;
  const existingLockedEscrow = useMemo(
    () => (editingShift ? paiseToRupees(editingShift.totalEscrowRequiredPaise || 0) : 0),
    [editingShift]
  );
  const additionalEscrowNeeded = useMemo(
    () => (editingShift ? Math.max(0, totalEscrowAmount - existingLockedEscrow) : totalEscrowAmount),
    [editingShift, totalEscrowAmount, existingLockedEscrow]
  );

  // Compute resolved start & end timestamps from form selection
  const resolveShiftTimestamps = () => {
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth();
    let targetDay = now.getDate();

    if (dateOption === "Tomorrow") {
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      targetYear = tomorrow.getFullYear();
      targetMonth = tomorrow.getMonth();
      targetDay = tomorrow.getDate();
    } else if (dateOption === "Weekend") {
      const dayOfWeek = now.getDay();
      const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
      const saturday = new Date(now.getTime() + daysUntilSaturday * 24 * 60 * 60 * 1000);
      targetYear = saturday.getFullYear();
      targetMonth = saturday.getMonth();
      targetDay = saturday.getDate();
    } else if (dateOption === "Custom Date" && customDate) {
      const [y, m, d] = customDate.split("-").map(Number);
      if (y && m && d) {
        targetYear = y;
        targetMonth = m - 1;
        targetDay = d;
      }
    }

    let startHour = 20;
    let startMinute = 0;
    let endHour = 8;
    let endMinute = 0;

    if (selectedSlot === "morning") {
      startHour = 7;
      startMinute = 0;
      endHour = 15;
      endMinute = 0;
    } else if (selectedSlot === "evening") {
      startHour = 14;
      startMinute = 0;
      endHour = 22;
      endMinute = 0;
    } else if (selectedSlot === "night") {
      startHour = 20;
      startMinute = 0;
      endHour = 8;
      endMinute = 0;
    } else if (selectedSlot === "custom") {
      if (customStartTime) {
        const [ch, cm] = customStartTime.split(":").map(Number);
        startHour = isNaN(ch) ? 9 : ch;
        startMinute = isNaN(cm) ? 0 : cm;
      }
      if (customEndTime) {
        const [eh, em] = customEndTime.split(":").map(Number);
        endHour = isNaN(eh) ? 17 : eh;
        endMinute = isNaN(em) ? 0 : em;
      }
    }

    const startDate = new Date(targetYear, targetMonth, targetDay, startHour, startMinute, 0);
    let endDate = new Date(targetYear, targetMonth, targetDay, endHour, endMinute, 0);
    if (endDate <= startDate) {
      endDate = new Date(endDate.getTime() + 24 * 60 * 60 * 1000);
    }

    const diffHours = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60));
    const effectiveHours = selectedSlot === "custom" ? customHours : activeHours || diffHours;
    return { startDate, endDate, effectiveHours };
  };

  // Validate form fields & business rules, surfacing first error via toast
  const validateShiftForm = (): { valid: boolean; startDate?: Date; endDate?: Date; effectiveHours?: number } => {
    const errors: Record<string, string> = {};

    if (!roleTitle.trim() || roleTitle.trim().length < 3) {
      errors.roleTitle = "Enter a valid clinical shift title (minimum 3 characters).";
    }
    if (!dept.trim()) {
      errors.dept = "Please select a hospital department.";
    }
    if (dateOption === "Custom Date" && !customDate) {
      errors.customDate = "Please select a duty date.";
    }
    if (selectedSlot === "custom" && (!customStartTime || !customEndTime)) {
      errors.customTime = "Please enter both start and end times.";
    }

    const { startDate, endDate, effectiveHours } = resolveShiftTimestamps();

    if (effectiveHours < 4 || effectiveHours > 24) {
      errors.hours = `Shift duration must be between 4 and 24 hours (currently ${effectiveHours}h).`;
    }
    if (startDate.getTime() < Date.now() - 5 * 60 * 1000) {
      errors.startTime = "Shift start time must be in the future. Choose a later slot or tomorrow.";
    }
    if (!hourlyRate || hourlyRate < 150) {
      errors.hourlyRate = "Enter a valid hourly pay rate (minimum ₹150/hr).";
    } else if (hourlyRate > 10000) {
      errors.hourlyRate = "Hourly pay rate cannot exceed ₹10,000/hr.";
    }
    if (!openings || openings < 1 || openings > 20) {
      errors.openings = "Professionals required must be between 1 and 20.";
    }

    setFieldErrors(errors);
    const firstError = Object.values(errors)[0];
    if (firstError) {
      toast.error("Please fix the highlighted shift details", {
        description: firstError,
      });
      return { valid: false };
    }
    return { valid: true, startDate, endDate, effectiveHours };
  };

  // Submit Shift
  const handlePublishShift = async () => { await pageAction.run(async () => {
    const check = validateShiftForm();
    if (!check.valid || !check.startDate || !check.endDate || !check.effectiveHours) {
      return;
    }

    if (!hasLinkedBank) {
      toast.error("Hospital settlement bank account required", {
        description: "Link your settlement bank account in Wallet & Escrow before posting shifts.",
      });
      setBankRequiredModalOpen(true);
      return;
    }

    if (!gstRateReady) { toast.error("Fee details are unavailable. Refresh this page before posting."); return; }
    if (availableEscrow < additionalEscrowNeeded) {
      toast.error("Insufficient escrow balance", {
        description: `Required ₹${additionalEscrowNeeded.toLocaleString("en-IN")}, available ₹${availableEscrow.toLocaleString("en-IN")}. Please top up your wallet.`,
      });
      setInsufficientEscrowModalOpen(true);
      return;
    }

    const newShiftId = "shift_" + Date.now();
    const formattedDate =
      dateOption === "Today · Urgent"
        ? "Tonight"
        : dateOption === "Tomorrow"
          ? "Tomorrow"
          : dateOption === "Weekend"
            ? "This Weekend"
            : customDate;

    const effectiveHours = check.effectiveHours;
    const startIso = check.startDate.toISOString();
    const endIso = check.endDate.toISOString();

    const newShift = {
      id: newShiftId,
      title: roleTitle,
      org: hospitalName,
      city,
      date: `${formattedDate} · ${activeTimeStr}`,
      time: activeTimeStr,
      hours: effectiveHours,
      rate: hourlyRate,
      dept,
      urgent: isUrgent,
      surge: isUrgent ? surgeReason : undefined,
      perks: [],
      verified: true,
      openings,
      status: "Pending Approval",
    };

    setState((s) => ({
      postedShifts: [newShift, ...(s.postedShifts ?? [])],
    }));

    if (!details.profession || !details.reportTo?.trim() || !details.reportLocation?.trim()) {
      toast.error("Select a profession and enter the reporting person and location."); return;
    }
    setSubmitting(true);
    try {
      let returnedStatus = "PENDING_APPROVAL";
      {
        const shiftPayload = {
          title: roleTitle.trim(),
          details: { ...details, city },
          department: dept.trim(),
          startAt: startIso,
          endAt: endIso,
          hours: effectiveHours,
          ratePerHourPaise: Math.round(hourlyRate * 100),
          surgeRatePerHourPaise: isUrgent ? 5000 : 0,
          surgeLabel: isUrgent ? (surgeReason || "+₹50/hr Night Surge") : undefined,
          openings: openings || 1,
          urgent: isUrgent,
          isUrgent: isUrgent,
          description: dutyNotes.trim() || `${roleTitle.trim()} locum duty coverage for ${dept.trim()} on ${formattedDate} (${activeTimeStr}).`,
        };
        const savedShift = editingShift
          ? await updateShift(editingShift.id, shiftPayload)
          : await postShift(shiftPayload);
        returnedStatus = savedShift.status || "PENDING_APPROVAL";
      }

      setPublishedStatus(returnedStatus);
      const isLive = returnedStatus === "OPEN";
      const needsKyc = shiftPolicy && !shiftPolicy.kycVerified && (shiftPolicy.priorApprovedShiftsCount ?? 0) > 0;
      toast.success(
        editingShift
          ? "Shift Updated & Escrow Reconciled!"
          : isLive
          ? "Shift Broadcasted & Live Immediately!"
          : needsKyc
            ? "Shift Submitted for Admin Review"
            : "First Shift Submitted for Admin Review!",
        {
          description: editingShift
            ? "Your shift details and wallet escrow lock were updated."
            : isLive
            ? "Verified hospital fast-track active: clinicians are being notified now."
            : needsKyc
              ? "Hospital KYC verification is still pending — Admin will approve this shift shortly."
              : "Your 1st shift is under Compliance Admin review. Subsequent shifts go live once KYC is verified.",
        }
      );
      setPublishedShiftModalOpen(true);
    } catch (err: any) {
      toast.error(err?.message || "Failed to broadcast shift", {
        description: err?.message ? "Please check the details above and try again." : "Please check your escrow wallet balance.",
      });
    } finally {
      setSubmitting(false);
    }
  }); };

  return (
    <AppShell>
      <RequestError message={pageLoad.error} onRetry={pageLoad.retry} />
      <div className="w-full min-w-0 space-y-6 pb-16">
        {/* ========================================================= */}
        {/* TOP HEADER & ROUTE TOGGLE SWITCHER */}
        {/* ========================================================= */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/70 pb-5">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight text-foreground">
              {editingShift ? "Update On-Demand Shift" : "Post an On-Demand Shift"}
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
              <HiOutlineBolt className="h-3.5 w-3.5 text-primary" />
              <span>On-Demand Shift</span>
            </span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2-COLUMN MAIN LAYOUT: FORM + LIVE CANDIDATE PREVIEW */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: FORM SECTIONS (8 COLUMNS) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            {/* AI WhatsApp Quick Shift Generator (#9) */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:p-5 space-y-3">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-white text-xs shrink-0">
                      <BotMessageSquare className="h-4 w-4" />
                    </span>
                    <h3 className="text-xs sm:text-sm font-bold text-foreground truncate">
                      Quick Shift Parser
                    </h3>
                  </div>
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary shrink-0">
                    Ally Assistant
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed pl-9 sm:pl-9">
                  Paste shift notes or a WhatsApp request from your nursing department to auto-fill fields.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={whatsAppPrompt}
                  onChange={(e) => setWhatsAppPrompt(e.target.value)}
                  placeholder="Paste raw duty message (e.g. Urgent requirement for 2 ICU Nurses, Night shift, ₹450/hr)"
                  className="flex-1 rounded-xl border border-border/80 bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <Button
                  type="button"
                  onClick={handleAiMagicFill}
                  isLoading={aiParsing}
                  loadingText="Parsing with Ally..."
                  disabled={aiParsing}
                  className="bg-primary text-white text-xs font-bold shrink-0 hover:bg-primary-hover rounded-xl px-4 h-9 cursor-pointer"
                >
                  Auto-Fill with Ally
                </Button>
              </div>
            </div>

            {/* ----------------------------------------------------- */}
            {/* 01 · ROLE & DEPARTMENT */}
            {/* ----------------------------------------------------- */}
            <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-2xs space-y-5">
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
                  onChange={(e) => {
                    setRoleTitle(e.target.value);
                    if (fieldErrors.roleTitle) {
                      setFieldErrors((prev) => ({ ...prev, roleTitle: "" }));
                    }
                  }}
                  placeholder="e.g. ICU Staff Nurse, Duty Medical Officer, Emergency Physician"
                  className={cn(
                    "w-full h-11 px-3.5 rounded-xl border bg-background text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 transition-all font-medium",
                    fieldErrors.roleTitle
                      ? "border-destructive focus:ring-destructive/20 focus:border-destructive"
                      : "border-input focus:ring-primary/20 focus:border-primary"
                  )}
                />
              </div>

              {/* Department & City Custom Selects */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={cn(fieldErrors.dept && "rounded-xl ring-1 ring-destructive/70 p-0.5")}>
                  <SelectField
                    label="Department"
                    required
                    options={hospitalDepts}
                    value={dept}
                    onChange={(val) => {
                      setDept(val);
                      if (fieldErrors.dept) {
                        setFieldErrors((prev) => ({ ...prev, dept: "" }));
                      }
                    }}
                    placeholder="Select Department"
                    searchable
                  />
                </div>

                <SelectField
                  label="City / Hub"
                  options={availableCities}
                  value={city}
                  onChange={setCity}
                  placeholder="Select hospital city / hub"
                />
              </div>
            </section>

            {/* ----------------------------------------------------- */}
            {/* 02 · SCHEDULE & TIMING */}
            {/* ----------------------------------------------------- */}
            <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary whitespace-nowrap">
                  02 · Schedule &amp; Timing
                </p>
                <span className="text-[11px] sm:text-xs font-semibold text-primary font-mono bg-primary/10 px-2 sm:px-2.5 py-0.5 rounded-md whitespace-nowrap shrink-0">
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
                        Total Hours <span className="text-[10px] font-normal text-primary">(Auto)</span>
                      </label>
                      <input
                        type="number"
                        readOnly
                        value={customHours}
                        className="h-10 w-full rounded-xl border border-input bg-muted/60 px-2.5 text-xs font-bold font-mono text-foreground cursor-default focus:outline-none"
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
            <section className="rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-2xs space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-1.5 sm:gap-2">
                <p className="text-[11px] font-bold uppercase tracking-wider text-primary whitespace-nowrap">
                  03 · Remuneration &amp; Escrow
                </p>
                <span className="text-[11px] sm:text-xs font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 sm:px-2.5 py-0.5 rounded-full flex items-center gap-1 whitespace-nowrap shrink-0">
                  <HiOutlineLockClosed className="h-3 w-3 shrink-0" />
                  24h Escrow Guarantee
                </span>
              </div>

              {/* Hourly Rate Input */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                  <label htmlFor="hourly-rate" className="text-xs font-semibold text-foreground">
                    Hourly Pay Rate (₹ / hour) <span className="text-destructive">*</span>
                  </label>
                  <span className="text-xs font-mono text-muted-foreground self-start sm:self-auto">
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
                    max={10000}
                    step={10}
                    placeholder="450"
                    value={hourlyRate || ""}
                    onChange={(e) => {
                      setHourlyRate(Math.max(0, Number(e.target.value)));
                      if (fieldErrors.hourlyRate) {
                        setFieldErrors((prev) => ({ ...prev, hourlyRate: "" }));
                      }
                    }}
                    className={cn(
                      "h-11 w-full rounded-xl border bg-background pl-9 pr-20 text-base font-bold text-foreground focus:outline-none focus:ring-2 font-mono",
                      fieldErrors.hourlyRate
                        ? "border-destructive focus:ring-destructive/20 focus:border-destructive"
                        : "border-input focus:ring-primary/20 focus:border-primary"
                    )}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground">
                    / hour
                  </span>
                </div>

                {/* AI Shift Pay Market Rate Suggestion (#13) */}
                <div className="rounded-xl bg-primary/5 border border-primary/25 p-3.5 space-y-3">
                  {/* Top Header: Ally Badge + Recalculate button */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary text-white text-[11px] shrink-0">
                        <BotMessageSquare className="h-3.5 w-3.5" />
                      </span>
                      <span className="text-xs font-bold text-foreground truncate">
                        Ally Pay Planning
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={loadingAiRate}
                      onClick={() => handleFetchAiRateSuggestion()}
                      className="text-[10px] font-semibold text-muted-foreground hover:text-foreground cursor-pointer px-2 py-0.5 rounded-lg border border-border/80 bg-background hover:bg-muted inline-flex items-center gap-1 shrink-0"
                    >
                      {loadingAiRate ? (
                        <>
                          <ButtonSpinner className="h-3 w-3 animate-spin text-primary" />
                          <span>Calculating...</span>
                        </>
                      ) : (
                        "Suggest pay with Ally"
                      )}
                    </button>
                  </div>

                  {/* AI Explanation / Status */}
                  <div className="text-[11px] text-muted-foreground leading-relaxed pl-8">
                    {loadingAiRate ? (
                      <span className="font-semibold text-primary animate-pulse">
                        Reviewing comparable published shift rates with Ally...
                      </span>
                    ) : aiRateSuggestion ? (
                      <span>
                        <strong className="text-foreground">Recommended:</strong> <strong className="text-primary font-bold">₹{aiRateSuggestion.recommendedHourlyRate}/hr</strong>. {aiRateSuggestion.explanation}
                      </span>
                    ) : (
                      <span>
                        {aiRateError || "Request a suggestion using comparable published FALE shifts. This is not a market-wide benchmark."}
                      </span>
                    )}
                  </div>

                  {/* 3-Tier Rate Spectrum Selector & Fill Estimates */}
                  {aiRateSuggestion && (
                    <div className="pt-2 border-t border-primary/15 space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-semibold text-muted-foreground px-0.5">
                        <span>Select Rate Strategy:</span>
                        <span className="text-primary font-medium flex items-center gap-1">
                          <HiOutlineSparkles className="h-3 w-3" />
                          Fill time not predicted
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                        {/* 1. Standard Economy Tier */}
                        <button
                          type="button"
                          onClick={() => {
                            setHourlyRate(aiRateSuggestion.minHourlyRate);
                            toast.success(`Applied Economy benchmark rate: ₹${aiRateSuggestion.minHourlyRate}/hr`);
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all cursor-pointer min-w-0",
                            hourlyRate === aiRateSuggestion.minHourlyRate
                              ? "bg-card border-primary text-primary font-bold shadow-2xs ring-1 ring-primary/40"
                              : "bg-background/80 border-border/70 hover:border-primary/40 text-foreground"
                          )}
                        >
                          <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium truncate max-w-full">
                            Standard
                          </span>
                          <span className="text-xs sm:text-[13px] font-bold font-mono text-foreground mt-0.5 whitespace-nowrap">
                            ₹{aiRateSuggestion.minHourlyRate}/hr
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground/80 mt-0.5 whitespace-nowrap">
                            Lower observed range
                          </span>
                        </button>

                        {/* 2. Target Recommended Tier */}
                        <button
                          type="button"
                          onClick={() => {
                            setHourlyRate(aiRateSuggestion.recommendedHourlyRate);
                            toast.success(`Applied Ally recommended rate: ₹${aiRateSuggestion.recommendedHourlyRate}/hr`);
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all cursor-pointer relative min-w-0",
                            hourlyRate === aiRateSuggestion.recommendedHourlyRate
                              ? "bg-primary text-white border-primary font-bold shadow-xs"
                              : "bg-primary/10 border-primary/40 hover:bg-primary/20 text-primary font-semibold"
                          )}
                        >
                          <span className="text-[9.5px] sm:text-[11px] font-bold whitespace-nowrap truncate max-w-full">
                            ★ Ally Target
                          </span>
                          <span className="text-xs sm:text-[13px] font-bold font-mono mt-0.5 whitespace-nowrap">
                            ₹{aiRateSuggestion.recommendedHourlyRate}/hr
                          </span>
                          <span className="text-[9px] sm:text-[10px] opacity-90 mt-0.5 whitespace-nowrap">
                            Review before applying
                          </span>
                        </button>

                        {/* 3. Fast Urgent Fill Tier */}
                        <button
                          type="button"
                          onClick={() => {
                            setHourlyRate(aiRateSuggestion.maxHourlyRate);
                            toast.success(`Applied Fast-Fill urgent rate: ₹${aiRateSuggestion.maxHourlyRate}/hr`);
                          }}
                          className={cn(
                            "flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all cursor-pointer min-w-0",
                            hourlyRate === aiRateSuggestion.maxHourlyRate
                              ? "bg-card border-emerald-600 text-emerald-600 font-bold shadow-2xs ring-1 ring-emerald-500/40"
                              : "bg-background/80 border-border/70 hover:border-emerald-500/40 text-foreground"
                          )}
                        >
                          <span className="text-[10px] sm:text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold truncate max-w-full">
                            Fast Fill
                          </span>
                          <span className="text-xs sm:text-[13px] font-bold font-mono text-foreground mt-0.5 whitespace-nowrap">
                            ₹{aiRateSuggestion.maxHourlyRate}/hr
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-muted-foreground/80 mt-0.5 whitespace-nowrap">
                            Upper observed range
                          </span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Urgent Surge Toggle */}
              <div className="pt-2 border-t border-border/60 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <HiOutlineFire className="h-4 w-4 text-primary" />
                      <span>Urgent Night / Surge Pay Incentive (+₹50/hr)</span>
                    </span>
                    <span className="text-[11px] text-muted-foreground block mt-0.5">
                      Adds +₹50/hr surge incentive and sends priority push alerts to verified clinicians
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
                      className="h-10 w-full rounded-xl border border-input bg-background px-3.5 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                )}
              </div>

              {/* Reporting & Duty Notes */}
              <div className="pt-2 border-t border-border/60 space-y-1.5">
                <p className="text-xs text-muted-foreground">The hospital pays the platform fee plus GST on that fee. Both are reserved with shift pay and refunded for your first completed shift. Clinicians pay no platform fee.</p>
                <ShiftDetailsFields value={{ ...details, city }} onChange={setDetails} />
                <label htmlFor="duty-instructions" className="text-xs font-semibold text-foreground block">
                  Reporting &amp; Duty Instructions (Optional)
                </label>
                <textarea
                  id="duty-instructions"
                  rows={3}
                  value={dutyNotes}
                  onChange={(e) => setDutyNotes(e.target.value)}
                  placeholder="Describe the clinical duties visible to applicants. Use Arrival instructions above for private reporting details."
                  className="w-full rounded-xl border border-input bg-background p-3.5 text-xs sm:text-sm font-normal text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none leading-relaxed"
                />
              </div>
            </section>

            {/* Mobile Actions Bottom Bar */}
            <div className="flex lg:hidden items-center gap-3 pt-2">
              <Button
                type="button"
                disabled={pageAction.isPending} onClick={handlePublishShift}
                isLoading={submitting}
                loadingText="Publishing shift..."
                className="w-full rounded-xl font-bold text-xs h-11 gap-1.5 shadow-sm bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer"
              >
                <HiOutlineBolt className="h-4 w-4" />
                <span>{editingShift ? "Update & Reconcile Shift" : "Publish & Dispatch Shift"}</span>
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
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                      <HiCheck className="h-3 w-3 stroke-[2.5]" />
                      <span>24h Escrow</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Escrow Telemetry Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <HiOutlineLockClosed className="h-4 w-4 text-primary" />
                  <span>Escrow Allocation</span>
                </span>
                <span className="font-mono font-bold text-primary text-sm">
                  ₹{totalEscrowAmount.toLocaleString("en-IN")}
                </span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full w-full" />
              </div>

              {/* Escrow Balance & Bank Account Status */}
              <div className="pt-2.5 border-t border-border/60 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Clinician Escrow ({openings} × {activeHours}h):</span>
                  <span className="font-mono font-semibold text-foreground">₹{workerEscrowTotal.toLocaleString("en-IN")}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">
                    Platform fee reserve ({facilityFeePercent}%):
                  </span>
                  <span className={cn("font-mono font-bold", facilityFeePercent === 0 ? "text-success" : "text-foreground")}>
                    {facilityFeePercent === 0 ? "₹0 (Waived)" : `₹${facilityFeeAmount.toLocaleString("en-IN")}`}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">GST on platform fee ({gstRateReady ? gstPercent + "%" : "rate pending"}):</span>
                  <span className="font-mono font-semibold">{gstRateReady ? gstAmount.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 }) : "Loading..."}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">GST applies to the platform fee only. The first completed shift's platform fee and GST are refunded.</p>

                {shiftPolicy && !editingShift && (
                  <div className={cn(
                    "rounded-lg p-2 border text-[10.5px] font-semibold flex items-center gap-1.5",
                    shiftPolicy.firstShiftApprovalRequired
                      ? "bg-primary-soft border-primary/25 text-primary"
                      : "bg-success-soft border-success/25 text-success"
                  )}>
                    <HiOutlineShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {!shiftPolicy.kycVerified
                        ? "Hospital KYC pending: Admin will verify this shift before it goes live"
                        : shiftPolicy.firstShiftApprovalRequired
                          ? "1st shift requires Admin approval · 2nd+ go live instantly"
                          : "Verified Partner: Goes LIVE immediately upon publish"}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-muted-foreground">Available Escrow:</span>
                  <span className={cn("font-mono font-bold", availableEscrow >= additionalEscrowNeeded ? "text-success" : "text-destructive")}>
                    ₹{availableEscrow.toLocaleString("en-IN")}
                  </span>
                </div>
                {!hasLinkedBank ? (
                  <div className="rounded-lg p-2 bg-primary-soft border border-primary/25 text-primary flex items-center justify-between gap-1.5">
                    <span>Bank account not linked</span>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/employer/wallet" })}
                      className="font-bold underline cursor-pointer text-[10px]"
                    >
                      Link Bank &rarr;
                    </button>
                  </div>
                ) : availableEscrow < additionalEscrowNeeded ? (
                  <div className="rounded-lg p-2 bg-destructive/10 border border-destructive/25 text-destructive flex items-center justify-between gap-1.5">
                    <span>Insufficient escrow balance</span>
                    <button
                      type="button"
                      onClick={() => navigate({ to: "/employer/wallet" })}
                      className="font-bold underline cursor-pointer text-[10px]"
                    >
                      Top Up &rarr;
                    </button>
                  </div>
                ) : (
                  <div className="text-[10px] text-success font-medium flex items-center gap-1">
                    <span>✓ Settlement bank verified · Escrow funds ready</span>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:block rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3">
              <Button
                type="button"
                size="lg"
                disabled={pageAction.isPending} onClick={handlePublishShift}
                isLoading={submitting}
                loadingText="Publishing & Dispatching..."
                className="w-full rounded-xl h-11 text-sm font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs cursor-pointer flex items-center justify-center gap-2"
              >
                <HiOutlineBolt className="h-4.5 w-4.5" />
                <span>{editingShift ? "Update & Reconcile Shift" : "Publish & Dispatch Shift"}</span>
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
              {editingShift
                ? "Shift Updated & Escrow Reconciled!"
                : publishedStatus === "OPEN"
                ? "Shift Live & Clinicians Notified!"
                : "Shift Submitted for Admin Review!"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              {editingShift
                ? "Your shift details and wallet escrow lock have been updated cleanly."
                : publishedStatus === "OPEN"
                ? <>Your shift is live immediately and broadcast to verified clinicians in {city || "your city"}.</>
                : shiftPolicy && !shiftPolicy.kycVerified && (shiftPolicy.priorApprovedShiftsCount ?? 0) > 0
                  ? "Compliance Admin will approve this shift shortly. Once your hospital KYC is verified, future shifts will publish immediately."
                  : "As your facility's first shift, Compliance Admin will verify it shortly. After this first shift is approved, subsequent eligible shifts publish instantly."}
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

      {/* Hospital Settlement Bank Required Modal */}
      <Dialog open={bankRequiredModalOpen} onOpenChange={setBankRequiredModalOpen}>
        <DialogContent className="sm:max-w-md p-6 text-center space-y-4 rounded-2xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm animate-in zoom-in-75 duration-300">
            <RiHospitalLine className="h-8 w-8 stroke-[1.5]" />
          </div>

          <DialogHeader className="text-center space-y-1">
            <DialogTitle className="text-xl font-black text-foreground">
              Hospital Settlement Bank Required
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              Please link your hospital settlement bank account in Wallet &amp; Escrow before broadcasting shifts (required for escrow custody and refunds).
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-left text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Bank Status:</span>
              <span className="font-bold text-amber-600 dark:text-amber-400">Not Linked</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Purpose:</span>
              <span className="font-semibold text-foreground">Escrow Custody &amp; Dispute Refunds</span>
            </div>
            <p className="text-[11px] text-muted-foreground pt-1 border-t border-border/60">
              RBI nodal compliance requires verified bank details to safeguard clinician shift earnings.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              size="default"
              onClick={() => {
                setBankRequiredModalOpen(false);
                navigate({ to: "/employer/wallet" });
              }}
              className="rounded-xl font-bold text-xs h-10 gap-1.5 shadow-xs cursor-pointer bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              <span>Go to Wallet &amp; Link Bank</span>
              <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => setBankRequiredModalOpen(false)}
              className="rounded-xl font-semibold text-xs h-10 cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Insufficient Escrow Balance Modal */}
      <Dialog open={insufficientEscrowModalOpen} onOpenChange={setInsufficientEscrowModalOpen}>
        <DialogContent className="sm:max-w-md p-6 text-center space-y-4 rounded-2xl">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 shadow-sm animate-in zoom-in-75 duration-300">
            <HiOutlineLockClosed className="h-8 w-8 stroke-[2]" />
          </div>

          <DialogHeader className="text-center space-y-1">
            <DialogTitle className="text-xl font-black text-foreground">
              Insufficient Escrow Balance
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed max-w-sm mx-auto">
              This shift requires escrow custody to guarantee 24-hour post-shift clinician remuneration. Please top up your wallet.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-border bg-muted/40 p-3.5 text-left text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Required Escrow:</span>
              <span className="font-bold text-foreground font-mono">₹{totalEscrowAmount.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Available Balance:</span>
              <span className="font-semibold text-muted-foreground font-mono">₹{availableEscrow.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/60">
              <span className="text-muted-foreground font-medium">Shortfall:</span>
              <span className="font-black text-amber-600 dark:text-amber-400 font-mono">
                ₹{Math.max(0, totalEscrowAmount - availableEscrow).toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <Button
              size="default"
              onClick={() => {
                setInsufficientEscrowModalOpen(false);
                navigate({ to: "/employer/wallet" });
              }}
              className="rounded-xl font-bold text-xs h-10 gap-1.5 shadow-xs cursor-pointer bg-primary hover:bg-primary-hover text-primary-foreground"
            >
              <span>Top Up Escrow in Wallet</span>
              <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="default"
              onClick={() => setInsufficientEscrowModalOpen(false)}
              className="rounded-xl font-semibold text-xs h-10 cursor-pointer"
            >
              Adjust Shift Parameters
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
