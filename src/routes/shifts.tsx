import { ShiftCheckIn } from "@/components/fale/ShiftCheckIn";
import { ShiftRequirements, ShiftArrivalInstructions } from "@/components/fale/ShiftDetailsFields";
import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { usePageLoad } from "@/hooks/use-page-load";
import { RequestError } from "@/components/fale/RequestError";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineMapPin,
  HiCheckCircle,
  HiCheck,
  HiOutlineBolt,
  HiOutlineCurrencyRupee,
  HiOutlineBanknotes,
  HiOutlineMagnifyingGlass,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiXMark,
  HiCheckBadge,
  HiOutlineBuildingOffice2,
  HiOutlineArrowPath,
  HiOutlineAcademicCap,
  HiOutlineLockClosed,
  HiArrowRight,
  HiOutlineInformationCircle,
} from "react-icons/hi2";
import { toast } from "sonner";
import { Star, KeyRound, AlertTriangle } from "lucide-react";
import { AppShell, PageHead } from "@/components/fale/AppShell";
import { StudentLockCard } from "@/components/fale/StudentLockCard";
import { OrgMark } from "@/components/fale/JobCard";
import { EmptyEarningsGraphic } from "@/components/fale/EmptyEarningsGraphic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shifts } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled, paiseToRupees } from "@/lib/api";
import {
  getOpenShifts,
  claimShift,
  cancelShiftClaim,
  getMyClaims,
  checkInShift,
  completeShift,
  disputeShift,
  type UiShiftItem,
  type ShiftClaimDto,
} from "@/lib/adapters/shiftAdapter";
import { attachFocusAndPollRefresh } from "@/lib/adapters/facilityAdapter";
import { getCandidateProfile } from "@/lib/adapters/candidateAdapter";
import { calculateClinicalMatch, type MatchCandidateInput } from "@/lib/clinicalMatchingEngine";

export const Route = createFileRoute("/shifts")({
  head: () => ({
    meta: [
      { title: "FALE Shift — Paid healthcare shifts" },
      { name: "description", content: "Clear hours, clear pay. Pick up verified healthcare shifts that fit your schedule." },
      { property: "og:title", content: "FALE Shift — Paid healthcare shifts" },
      { property: "og:description", content: "Pick up verified healthcare shifts that fit your schedule with guaranteed 24-hr payouts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Shifts,
});

const timingOpts = [
  { id: "open", label: "Open Shifts" },
  { id: "applied", label: "My Applied" },
  { id: "completed", label: "Completed" },
  { id: "all", label: "All Shifts" },
  { id: "day", label: "Day Shifts" },
  { id: "night", label: "Night Shifts" },
  { id: "urgent", label: "Urgent Surge", withIcon: true },
] as const;

function buildFallbackShiftFromClaim(claim: ShiftClaimDto): UiShiftItem {
  const hours = claim.hours || 8;
  const grossPaise = claim.grossAmountPaise ?? claim.payoutPaise ?? 0;
  const totalRupees = paiseToRupees(grossPaise);
  const rateRupees = hours > 0 && totalRupees > 0 ? Math.round(totalRupees / hours) : 0;
  const startIso = claim.shiftStartAt || claim.startAt;
  const endIso = claim.shiftEndAt || claim.endAt;
  const startDate = startIso ? new Date(startIso) : new Date();
  const endDate = endIso ? new Date(endIso) : new Date(startDate.getTime() + hours * 60 * 60 * 1000);
  const startStr = `${startDate.getHours().toString().padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}`;
  const endStr = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;
  const dateFormatted = startDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
  const claimUpper = (claim.status || "").toUpperCase();
  return {
    id: claim.shiftId,
    title: claim.shiftTitle || "Locum Shift",
    org: claim.facilityName || "Hospital Partner",
    dept: claim.shiftDepartment || "Clinical Duty",
    city: claim.candidateCity || "",
    time: `${startStr} – ${endStr}`,
    date: dateFormatted,
    startAt: startIso,
    pay: `₹${totalRupees.toLocaleString("en-IN")}`,
    rate: rateRupees,
    rateNumber: rateRupees,
    totalPayNumber: totalRupees,
    urgent: false,
    slots: 1,
    slotsClaimed: 1,
    status: claimUpper === "COMPLETED" ? "COMPLETED" : "FILLED",
    perks: ["Guaranteed 24-hr Payout", "Malpractice Covered"],
    hours,
    rawRatePerHourPaise: rateRupees * 100,
    rawTotalPayoutPaise: grossPaise,
    hasClaimed: !["CANCELLED", "WITHDRAWN", "REJECTED", "SLOT_FILLED", "NO_SHOW"].includes(claimUpper),
    endAt: endIso,
  };
}

function Shifts() {
  const pageLoad = usePageLoad();
  const pageAction = useConfirmedAction();
  const s = useApp();
  const candidateLevel =
    s.candidateLevel ||
    (s.profile["level"] as any) ||
    (s.profile["cadreLevel"] as any) ||
    (s.profile["exp"] === "Fresher" ? "fresher" : "professional");
  const isStudent = candidateLevel === "student";

  const [q, setQ] = useState("");
  const [cityF, setCityF] = useState("All Cities");
  const [timingF, setTimingF] = useState<"open" | "applied" | "completed" | "all" | "day" | "night" | "urgent">("open");
  const [sort, setSort] = useState<"pay" | "rate" | "earliest">("pay");

  // Dynamic API state
  const [apiShifts, setApiShifts] = useState<UiShiftItem[]>([]);
  const [myClaims, setMyClaims] = useState<ShiftClaimDto[]>([]);
  const [loading, setLoading] = useState(isApiEnabled);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchShiftPortal = (silent = false) => {
      if (!silent) setLoading(true);
      Promise.all([
        getOpenShifts(),
        getMyClaims(),
        getCandidateProfile(),
      ])
        .then(([fetchedShifts, fetchedClaims, profile]) => {
          if (!mounted) return;
          setApiShifts(fetchedShifts);
          setMyClaims(fetchedClaims);
          if (profile) {
            setState((prev) => ({
              candidateLevel: profile.isStudent ? "student" : (profile.candidateLevel?.toLowerCase() as any),
              profile: {
                ...prev.profile,
                name: profile.name || prev.profile["name"],
                role: profile.profession || prev.profile["role"],
                specialty: profile.specialty || prev.profile["specialty"],
                city: profile.city || prev.profile["city"],
              },
            }));
          }
        }).catch(pageLoad.fail)
        .finally(() => {
          if (mounted && !silent) setLoading(false);
        });
    };

    fetchShiftPortal(false);
    const detachRefresh = attachFocusAndPollRefresh(() => fetchShiftPortal(true), 15000);
    return () => {
      mounted = false;
      detachRefresh();
    };
  }, [pageLoad.retryKey]);

  const allShifts = useMemo(() => {
    {
      const seenIds = new Set(apiShifts.map((sh) => sh.id));
      const missingClaimedShifts: UiShiftItem[] = [];
      for (const claim of myClaims) {
        const claimStatus = (claim.status || "").toUpperCase();
        if (claimStatus === "CANCELLED" || claimStatus === "WITHDRAWN") continue;
        if (!seenIds.has(claim.shiftId)) {
          seenIds.add(claim.shiftId);
          missingClaimedShifts.push(buildFallbackShiftFromClaim(claim));
        }
      }
      return [...apiShifts, ...missingClaimedShifts];
    }

  }, [s.postedShifts, apiShifts, myClaims]);

  // Dynamic Unique City Options
  const cityOpts = useMemo(() => {
    const defaultCities = ["Bengaluru", "Chennai", "Mumbai", "Hyderabad", "Delhi NCR"];
    const dynamicCities = allShifts.map((sh) => sh.city).filter(Boolean);
    return ["All Cities", ...Array.from(new Set([...defaultCities, ...dynamicCities]))];
  }, [allShifts]);

  const claimedShiftIds = useMemo(() => {
    const fromClaims = myClaims
      .filter((c) => !["CANCELLED", "REJECTED", "WITHDRAWN", "SLOT_FILLED", "NO_SHOW"].includes((c.status || "").toUpperCase()))
      .map((c) => c.shiftId);
    const fromApiShifts = apiShifts.filter((sh) => sh.hasClaimed).map((sh) => sh.id);
    {
      return Array.from(new Set([...fromClaims, ...fromApiShifts]));
    }

  }, [myClaims, apiShifts, s.shiftApps]);

  const completedShiftIds = useMemo(() => {
    return new Set(
      myClaims
        .filter((c) => (c.status || "").toUpperCase() === "COMPLETED")
        .map((c) => c.shiftId)
    );
  }, [myClaims]);

  const activeAppliedShiftIds = useMemo(() => {
    return claimedShiftIds.filter((id) => !completedShiftIds.has(id));
  }, [claimedShiftIds, completedShiftIds]);

  const isShiftOpenToApply = (sh: UiShiftItem) => {
    if (claimedShiftIds.includes(sh.id) || completedShiftIds.has(sh.id)) return false;
    const upper = (sh.status || "").toUpperCase();
    if (["BOOKED", "FILLED", "COMPLETED", "CANCELLED", "EXPIRED"].includes(upper)) return false;
    if (sh.slots !== undefined && sh.slotsClaimed !== undefined && sh.slotsClaimed >= sh.slots) return false;
    return true;
  };

  // Dynamic Shift Counts for Timing Pills
  const timingCounts = useMemo(() => {
    const base = allShifts.filter((sh) => {
      if (q && !`${sh.title} ${sh.org} ${sh.dept} ${sh.city}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (cityF !== "All Cities" && sh.city.toLowerCase() !== cityF.toLowerCase()) return false;
      return true;
    });

    const isDay = (sh: UiShiftItem) => {
      const startHour = Number.parseInt(sh.time?.split(":")[0] ?? "0", 10);
      return startHour >= 6 && startHour < 18;
    };
    const isNight = (sh: UiShiftItem) => {
      const startHour = Number.parseInt(sh.time?.split(":")[0] ?? "0", 10);
      return startHour < 6 || startHour >= 18;
    };

    return {
      open: base.filter(isShiftOpenToApply).length,
      applied: base.filter((sh) => activeAppliedShiftIds.includes(sh.id)).length,
      completed: base.filter((sh) => completedShiftIds.has(sh.id)).length,
      all: base.length,
      day: base.filter((sh) => isDay(sh) && isShiftOpenToApply(sh)).length,
      night: base.filter((sh) => isNight(sh) && isShiftOpenToApply(sh)).length,
      urgent: base.filter((sh) => Boolean(sh.urgent) && isShiftOpenToApply(sh)).length,
    };
  }, [allShifts, claimedShiftIds, activeAppliedShiftIds, completedShiftIds, q, cityF]);

  // Candidate profile input for Clinical-Grade Matching
  const candidateInput = useMemo<MatchCandidateInput>(() => {
    const roleCandidate = String(s.profile["role"] || s.profile["cadre"] || "Staff Nurse");
    const specCandidate = String(s.profile["specialty"] || "Critical care");
    const cityCandidate = String(s.profile["city"] || s.profile["area"] || "");
    const qualCandidate = String(s.profile["qualification"] || "");
    const skillsCandidate = Array.isArray(s.profile["skills"]) && s.profile["skills"].length > 0
      ? s.profile["skills"]
      : ["ICU", "Critical care", "BLS", "Ventilator", "Patient Care"];

    return {
      role: roleCandidate,
      profession: roleCandidate,
      specialty: specCandidate,
      subSpecialties: Array.isArray(s.profile["subSpecialties"]) ? s.profile["subSpecialties"] : [],
      qualification: qualCandidate,
      skills: skillsCandidate,
      city: cityCandidate,
      kycStatus: "VERIFIED",
      isStudent,
    };
  }, [s.profile, isStudent]);

  // Compute Clinical Match Score for each shift (0% - 100%)
  const shiftsWithMatch = useMemo(() => {
    return allShifts.map((sh) => {
      const matchResult = calculateClinicalMatch(candidateInput, {
        title: sh.title,
        dept: sh.dept,
        city: sh.city,
        qualification: (sh as any).qualification || "State Nursing / Medical Council Registration",
        tags: sh.perks || [],
        exp: (sh as any).minExp || "1-2 yrs",
        urgent: Boolean(sh.urgent),
      });

      const canonicalScore =
        typeof (sh as any).matchScore === "number" && (sh as any).matchScore > 0
          ? (sh as any).matchScore
          : matchResult.score;

      return {
        ...sh,
        matchScore: canonicalScore,
        matchResult: {
          ...matchResult,
          score: canonicalScore,
        },
      };
    });
  }, [allShifts, candidateInput]);

  const filteredShifts = useMemo(() => {
    const getBucketRank = (sh: UiShiftItem) => {
      if (activeAppliedShiftIds.includes(sh.id)) return timingF === "all" ? 1 : 0;
      if (completedShiftIds.has(sh.id)) return 2;
      return 0; // Open shifts first in "all"
    };

    return shiftsWithMatch
      .filter((sh) => {
        if (q && !`${sh.title} ${sh.org} ${sh.dept} ${sh.city}`.toLowerCase().includes(q.toLowerCase())) {
          return false;
        }
        if (cityF !== "All Cities" && sh.city.toLowerCase() !== cityF.toLowerCase()) {
          return false;
        }
        if (timingF === "open" && !isShiftOpenToApply(sh)) {
          return false;
        }
        if (timingF === "applied" && !activeAppliedShiftIds.includes(sh.id)) {
          return false;
        }
        if (timingF === "completed" && !completedShiftIds.has(sh.id)) {
          return false;
        }
        if (timingF === "urgent" && (!sh.urgent || !isShiftOpenToApply(sh))) {
          return false;
        }
        if (timingF === "day") {
          const startHour = Number.parseInt(sh.time?.split(":")[0] ?? "0", 10);
          if (startHour >= 18 || startHour < 6 || !isShiftOpenToApply(sh)) return false;
        }
        if (timingF === "night") {
          const startHour = Number.parseInt(sh.time?.split(":")[0] ?? "0", 10);
          if ((startHour < 18 && startHour >= 6) || !isShiftOpenToApply(sh)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const rankDiff = getBucketRank(a) - getBucketRank(b);
        if (rankDiff !== 0) return rankDiff;

        const aRate = typeof a.rate === "number" ? a.rate : (a as any).rateNumber || 0;
        const bRate = typeof b.rate === "number" ? b.rate : (b as any).rateNumber || 0;
        const aHours = a.hours || 8;
        const bHours = b.hours || 8;

        if (sort === "pay") return bRate * bHours - aRate * aHours;
        if (sort === "rate") return bRate - aRate;
        return a.date.localeCompare(b.date);
      });
  }, [shiftsWithMatch, claimedShiftIds, activeAppliedShiftIds, completedShiftIds, q, cityF, timingF, sort]);

  const appliedShiftObjects = useMemo(() => {
    return allShifts.filter((sh) => claimedShiftIds.includes(sh.id));
  }, [allShifts, claimedShiftIds]);

  const appliedCount = claimedShiftIds.length;

  const confirmedCount = useMemo(() => {
    {
      return myClaims.filter((c) => c.status === "CONFIRMED" || c.status === "CHECKED_IN").length;
    }

  }, [isApiEnabled, myClaims]);

  const pendingReviewCount = useMemo(() => {
    {
      return myClaims.filter((c) => !["CONFIRMED", "CHECKED_IN", "COMPLETED", "REJECTED", "CANCELLED"].includes(c.status)).length;
    }

  }, [isApiEnabled, myClaims, s.shiftApps]);

  const totalPotentialEarnings = useMemo(() => {
    if (myClaims.length > 0) {
      return myClaims
        .filter((c) => !["CANCELLED", "REJECTED", "WITHDRAWN", "SLOT_FILLED", "NO_SHOW"].includes((c.status || "").toUpperCase()))
        .reduce((acc, c) => {
          const paise = c.grossAmountPaise ?? c.payoutPaise ?? 0;
          if (paise > 0) return acc + paiseToRupees(paise);
          const matched = appliedShiftObjects.find((sh) => sh.id === c.shiftId);
          return acc + (matched?.totalPayNumber || 0);
        }, 0);
    }
    return appliedShiftObjects.reduce((acc, sh) => {
      const r = typeof sh.rate === "number" ? sh.rate : (sh as any).rateNumber || 0;
      const h = sh.hours || 8;
      const pay = sh.totalPayNumber || (r * h);
      return acc + pay;
    }, 0);
  }, [isApiEnabled, myClaims, appliedShiftObjects]);

  const handleApply = async (id: string, title: string, org: string) => { await pageAction.run(async () => {
    if (applyingId === id) return;

    setApplyingId(id);
    try {
      {
        const claim = await claimShift(id);
        setMyClaims((prev) => [...prev.filter((c) => c.shiftId !== id), claim]);
      }
      const newAdminApp = {
        id: "claim-" + Date.now(),
        candidateName: s.profile?.name || (isStudent ? "Clinical Student" : "Candidate"),
        candidateRole: s.profile?.course || s.profile?.role || "Healthcare Clinician",
        exp: s.profile?.exp || (isStudent ? "Final Year Intern" : "1 Year"),
        candidateCity: s.profile?.city || s.profile?.area || "",
        jobTitle: `${title} (Locum Shift)`,
        status: "shortlisted",
        councilVerified: true,
        matchScore: 96,
        appliedDate: "Today",
        regNumber: s.profile?.regNo || (isStudent ? "College Verified" : "Council Verified"),
        phone: s.profile?.phone || "",
        email: s.profile?.email || "candidate@fale.care",
        summary: `Applied for ${title} locum shift duty coverage.`,
      };
      setState((x) => ({
        shiftApps: Array.from(new Set([...(x.shiftApps || []), id])),
        adminApplications: [newAdminApp, ...(x.adminApplications || [])],
      }));
      setApiShifts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, hasClaimed: true } : item))
      );
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("fale:applications-updated"));
      }
      const hasLinkedPayout = Boolean(s.candidatePayoutMethod && (s.candidatePayoutMethod.upiId || s.candidatePayoutMethod.accountNumber));
      if (!hasLinkedPayout) {
        toast.success("Shift claimed successfully!", {
          description: `You're confirmed for ${title} at ${org}. Tip: Link your UPI or Bank in Earnings to receive automated 24-hr payout after duty signoff!`,
        });
      } else {
        toast.success("Shift claimed successfully!", {
          description: `Your interest in ${title} at ${org} was submitted. Hospital notified!`,
        });
      }
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("already claimed")) {
        setState((x) => ({
          shiftApps: Array.from(new Set([...(x.shiftApps || []), id])),
        }));
        setApiShifts((prev) =>
          prev.map((item) => (item.id === id ? { ...item, hasClaimed: true } : item))
        );
        getMyClaims().then(setMyClaims).catch(() => {});
        toast.info("Shift already claimed", {
          description: "You have already claimed a slot for this shift. Check status under review.",
        });
      } else {
        toast.error("Shift claim failed", {
          description: msg || "Slot unavailable or already filled.",
        });
      }
    } finally {
      setApplyingId(null);
    }
  }); };

  const handleWithdraw = async (id: string, title: string) => { await pageAction.run(async () => {
    setWithdrawingId(id);
    try {
      {
        const claim = myClaims.find((c) => c.shiftId === id && !["CANCELLED", "REJECTED"].includes((c.status || "").toUpperCase()));
        if (claim) {
          try {
            await cancelShiftClaim(claim.id);
          } catch (err: any) {
            if (!err?.message?.includes("CANCELLED")) {
              throw err;
            }
          }
          setMyClaims((prev) => prev.map((c) => (c.id === claim.id ? { ...c, status: "CANCELLED" } : c)));
        }
      }
      setApiShifts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, hasClaimed: false } : item))
      );
      setState((x) => ({ shiftApps: (x.shiftApps || []).filter((a) => a !== id) }));
      toast.info("Shift request withdrawn", {
        description: `Your request for ${title} was removed.`,
      });
    } catch (err: any) {
      toast.error("Cancellation failed", {
        description: err?.message || "Could not cancel shift claim.",
      });
    } finally {
      setWithdrawingId(null);
    }
  }); };

  const [pinModalData, setPinModalData] = useState<{
    claimId: string;
    shiftTitle: string;
    org: string;
  } | null>(null);
  const [checkInPinInput, setCheckInPinInput] = useState("");
  const [submittingPin, setSubmittingPin] = useState(false);

  const [disputeModalData, setDisputeModalData] = useState<{
    claimId: string;
    shiftTitle: string;
  } | null>(null);
  const [disputeReasonInput, setDisputeReasonInput] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const validFeeClaimCount = useMemo(() => {
    return myClaims.filter(
      (c) =>
        !["CANCELLED", "REJECTED", "WITHDRAWN", "SLOT_FILLED", "NO_SHOW"].includes(
          (c.status || "").toUpperCase()
        )
    ).length;
  }, [myClaims]);

  const handleOpenCheckInModal = (claimId: string, shiftTitle: string, org: string) => {
    setPinModalData({ claimId, shiftTitle, org });
    setCheckInPinInput("");
  };

  const handleSubmitDispute = async () => {
    if (!disputeModalData) return;
    if (!disputeReasonInput.trim()) {
      toast.error("Please enter a dispute reason");
      return;
    }
    setSubmittingDispute(true);
    try {
      const updated = await disputeShift(disputeModalData.claimId, disputeReasonInput.trim());
      setMyClaims((prev) => prev.map((c) => (c.id === disputeModalData.claimId ? updated : c)));
      toast.warning("Dispute escalated to FALE Clinical Ops", {
        description: "Escrow remains safely locked until dispute review concludes.",
      });
      setDisputeModalData(null);
      setDisputeReasonInput("");
    } catch (err: any) {
      toast.error("Could not escalate dispute", { description: err?.message });
    } finally {
      setSubmittingDispute(false);
    }
  };

  const [signOffModalData, setSignOffModalData] = useState<{
    claimId: string;
    shiftTitle: string;
    facilityName: string;
    scheduledHours: number;
    ratePerHour: number;
  } | null>(null);
  const [actualHoursWorked, setActualHoursWorked] = useState<number>(8);
  const [submittingSignOff, setSubmittingSignOff] = useState(false);

  const openSignOffModal = (claimId: string, sh: UiShiftItem) => {
    const hours = Number(sh.hours) || 8;
    const rate = typeof sh.rate === "number" ? sh.rate : (sh.rateNumber || 0);
    setSignOffModalData({
      claimId,
      shiftTitle: sh.title,
      facilityName: sh.org,
      scheduledHours: hours,
      ratePerHour: rate,
    });
    setActualHoursWorked(hours);
  };

  const handleConfirmDutySignOff = async () => { await pageAction.run(async () => {
    if (!signOffModalData) return;
    setSubmittingSignOff(true);
    try {
      const updated = await completeShift(signOffModalData.claimId, {
        actualHours: actualHoursWorked,
      });
      setMyClaims((prev) => prev.map((c) => (c.id === signOffModalData.claimId ? updated : c)));
      toast.success("Timesheet submitted for verification!", {
        description: `Reported ${actualHoursWorked} hrs for "${signOffModalData.shiftTitle}". Hospital supervisor will review and verify for payout.`,
      });
      setSignOffModalData(null);
    } catch (err: any) {
      toast.error("Completion failed", { description: err?.message });
    } finally {
      setSubmittingSignOff(false);
    }
  }); };

  const handleCompleteShift = async (claimId: string, shiftTitle: string) => { await pageAction.run(async () => {
    try {
      const updated = await completeShift(claimId);
      setMyClaims((prev) => prev.map((c) => (c.id === claimId ? updated : c)));
      toast.success("Shift duty marked completed!", {
        description: `Duty sign-off submitted for "${shiftTitle}". Escrow release scheduled.`,
      });
    } catch (err: any) {
      toast.error("Completion failed", { description: err?.message });
    }
  }); };

  return (
    <AppShell>
      <RequestError message={pageLoad.error} onRetry={pageLoad.retry} />
      {/* ================= PAGE HEADER (MATCHING LEARNING STYLE) ================= */}
      <PageHead
        title="Clinical Shifts"
        sub={
          isStudent
            ? "Clinical shifts, on-call hospital duties, and verified emergency rotations."
            : "Transparent hourly rates. Immediate 24-hour direct payouts. Pick up flexible hospital shifts on your terms."
        }
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>{loading ? "Syncing shifts..." : `${allShifts.length} verified clinical shifts today`}</span>
            </div>
            {s.portal === "facility" && (
              <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold gap-1.5 h-8 px-3 shadow-2xs">
                <Link to="/employer/post-shift">
                  <HiOutlineBolt className="h-3.5 w-3.5 text-primary" />
                  <span>Hospital? Post a shift</span>
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* ================= APPLE-STYLE METRIC STATS ================= */}
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        {/* Metric 1 */}
        <button
          type="button"
          onClick={() => setTimingF(activeAppliedShiftIds.length > 0 ? "applied" : completedShiftIds.size > 0 ? "completed" : "open")}
          className="surface group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md hover:border-primary/40 text-left cursor-pointer w-full"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Applied shifts
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary-soft text-primary">
              <HiOutlineCalendarDays className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-foreground">
            {appliedCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
            {pendingReviewCount > 0 ? (
              <span className="text-primary font-bold">● {pendingReviewCount} under facility review</span>
            ) : (
              <span>Ready to claim your next shift</span>
            )}
          </p>
        </button>

        {/* Metric 2 */}
        <div className="surface group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Confirmed shifts
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary-soft text-primary">
              <HiCheckBadge className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-foreground">
            {confirmedCount}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {confirmedCount > 0 ? "Clock-in opens 2 hours before the scheduled start" : "Awaiting facility confirmation"}
          </p>
        </div>

        {/* Metric 3 */}
        <div className="surface group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Est. gross pay
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary-soft text-primary">
              <HiOutlineBanknotes className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <p className="text-3xl font-black tracking-tight text-foreground">
              ₹{totalPotentialEarnings.toLocaleString("en-IN")}
            </p>
            <span className="rounded-md bg-primary-soft px-1.5 py-0.5 text-[10px] font-black text-primary uppercase">
              Gross
            </span>
          </div>
            <p className="mt-1.5 text-xs text-primary font-bold flex items-start gap-1.5 leading-snug">
              <HiOutlineShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <span>Payout is queued after hospital timesheet approval</span>
            </p>
        </div>
      </div>

      {/* ================= SEARCH & SMART FILTER DOCK ================= */}
        <div className="relative sm:sticky sm:top-[var(--header-offset,4rem)] z-10 sm:z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2 sm:pt-3 pb-2 sm:pb-3 mb-3 sm:mb-6 bg-background/95 sm:backdrop-blur-md transition-all duration-300 ease-in-out">
          <div className="surface rounded-3xl border border-border/80 bg-card p-3 sm:p-4 shadow-sm space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              {/* Main search bar */}
              <div className="flex flex-1 items-center gap-3 rounded-2xl bg-muted/40 px-3.5 py-1 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <HiOutlineMagnifyingGlass className="h-5 w-5 text-primary shrink-0" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search shifts by title, specialty, hospital or department"
                  className="h-11 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-medium"
                />
                {q && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <HiXMark className="h-4 w-4" />
                  </button>
                )}
              </div>

              <span className="hidden h-8 w-px bg-border/80 sm:block" />

              {/* Custom City Select Filter */}
              <div className="w-full sm:w-[210px] shrink-0">
                <Select value={cityF} onValueChange={(val) => setCityF(val)}>
                  <SelectTrigger
                    aria-label="Filter shifts by city"
                    className="h-11 w-full rounded-2xl border-none bg-muted/40 px-3.5 text-sm font-bold text-foreground shadow-none hover:bg-muted/60 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <HiOutlineMapPin className="h-4 w-4 text-primary shrink-0" />
                      <SelectValue placeholder="All Cities" />
                    </div>
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-border/80 bg-card/95 backdrop-blur-md p-1 shadow-lg">
                    {cityOpts.map((c) => (
                      <SelectItem
                        key={c}
                        value={c}
                        className="rounded-xl font-semibold cursor-pointer py-2 focus:bg-primary/10 focus:text-primary"
                      >
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Filter Pills & Sort Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-border/60 pt-3">
                {/* Timing Pills with Dynamic Counts */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
                    {timingOpts.map((t) => {
                      const count = timingCounts[t.id] ?? 0;
                      const isActive = timingF === t.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setTimingF(t.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shrink-0 whitespace-nowrap transition-all cursor-pointer",
                            isActive
                              ? "bg-primary text-white shadow-2xs"
                              : "bg-muted/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                          )}
                        >
                          {"withIcon" in t && t.withIcon && (
                            <HiOutlineBolt
                              className={cn(
                                "h-3.5 w-3.5 shrink-0",
                                isActive ? "text-white" : "text-primary"
                              )}
                            />
                          )}
                          <span>{t.label}</span>
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums transition-colors",
                              isActive
                                ? "bg-white/20 text-white"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

          {/* Segmented Sort (Apple style) */}
          <div className="grid grid-cols-3 w-full sm:w-auto sm:flex items-center rounded-2xl bg-muted/60 p-1 text-xs font-semibold border border-border/50 shrink-0">
            {(
              [
                ["pay", "Highest pay"],
                ["rate", "Hourly rate"],
                ["earliest", "Earliest date"],
              ] as const
            ).map(([k, l]) => (
              <button
                key={k}
                type="button"
                onClick={() => setSort(k)}
                className={cn(
                  "flex items-center justify-center rounded-xl px-2 sm:px-3.5 py-1.5 text-xs font-bold text-center whitespace-nowrap transition-all cursor-pointer",
                  sort === k
                    ? "bg-card text-primary shadow-xs ring-1 ring-primary/20"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <span>{l}</span>
              </button>
            ))}
          </div>
                  </div>
                </div>
              </div>

              {/* ================= SHIFT CARDS FEED ================= */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs font-bold text-muted-foreground">
                    Showing <span className="text-foreground">{filteredShifts.length}</span> verified shifts
                  </p>
                  {(q || cityF !== "All Cities" || timingF !== "open") && (
                    <button
                      type="button"
                      onClick={() => {
                        setQ("");
                        setCityF("All Cities");
                        setTimingF("open");
                      }}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <HiOutlineArrowPath className="h-3.5 w-3.5" />
                      Reset filters
                    </button>
                  )}
                </div>

                {/* Cards Grid */}
                {loading ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="surface rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs animate-pulse space-y-4"
                      >
                        <div className="flex items-start gap-3">
                          <div className="h-12 w-12 rounded-2xl bg-muted/60 shrink-0" />
                          <div className="space-y-2 flex-1">
                            <div className="h-4 w-3/4 bg-muted/60 rounded-md" />
                            <div className="h-3 w-1/2 bg-muted/50 rounded-md" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="h-8 bg-muted/40 rounded-xl" />
                          <div className="h-8 bg-muted/40 rounded-xl" />
                          <div className="h-8 bg-muted/40 rounded-xl" />
                          <div className="h-8 bg-muted/40 rounded-xl" />
                        </div>
                        <div className="h-12 bg-muted/30 rounded-2xl" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-5 md:grid-cols-2">
                    {filteredShifts.map((sh) => {
                      const activeClaim = myClaims.find(
                        (c) =>
                          c.shiftId === sh.id &&
                          !["CANCELLED", "REJECTED", "WITHDRAWN", "SLOT_FILLED", "NO_SHOW"].includes(
                            (c.status || "").toUpperCase()
                          )
                      );
                      const isClaimCancelled = myClaims.some(
                        (c) => c.shiftId === sh.id && ["CANCELLED", "WITHDRAWN"].includes((c.status || "").toUpperCase())
                      );
                      const isClaimRejected = myClaims.some(
                        (c) => c.shiftId === sh.id && (c.status || "").toUpperCase() === "REJECTED"
                      );
                      const isClaimNoShow = myClaims.some(
                        (c) => c.shiftId === sh.id && (c.status || "").toUpperCase() === "NO_SHOW"
                      );
                      const isSlotFilled = myClaims.some(
                        (c) => c.shiftId === sh.id && (c.status || "").toUpperCase() === "SLOT_FILLED"
                      );
                      const isShiftFull = Boolean(
                        sh.slots !== undefined &&
                        sh.slotsClaimed !== undefined &&
                        sh.slotsClaimed >= sh.slots &&
                        !activeClaim
                      ) || ["BOOKED", "FILLED"].includes((sh.status || "").toUpperCase());
                      const applied = Boolean(activeClaim) || ((Boolean(sh.hasClaimed) || claimedShiftIds.includes(sh.id)) && !isClaimCancelled && !isClaimRejected && !isSlotFilled && !isClaimNoShow);
                      const feePercent = activeClaim?.platformFeePercent ?? 0;
                      const rateNumber = typeof sh.rate === "number"
                        ? sh.rate
                        : (sh.rateNumber || parseFloat(String(sh.rate).replace(/[^0-9.]/g, "")) || 0);
                      const hoursNumber = Number(sh.hours) || 8;
                      const totalPay = sh.totalPayNumber || (rateNumber * hoursNumber);

                      return (
                        <div
                          key={sh.id}
                          className="surface group relative flex flex-col justify-between overflow-hidden rounded-2xl sm:rounded-3xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md"
                        >
                          <div>
                            {/* Card Header: Hospital & Title */}
                            <div className="flex items-start gap-3 sm:gap-3.5">
                              <OrgMark name={sh.org} className="h-11 w-11 sm:h-12 sm:w-12 text-xs sm:text-sm shrink-0" />
                              <div className="flex-1 min-w-0">
                                <h2 className="font-black text-base sm:text-lg text-foreground group-hover:text-primary transition-colors leading-snug break-words">
                                  {sh.title}
                                </h2>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                                  <span className="inline-flex items-center gap-1 font-bold text-foreground/90">
                                    <span>{sh.org}</span>
                                    <HiCheckBadge className="h-3.5 w-3.5 text-primary shrink-0" title="Verified Hospital" />
                                  </span>
                                  <span className="rounded-lg bg-primary-soft/80 px-2 py-0.5 text-[11px] font-bold text-primary shrink-0">
                                    {sh.dept}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Badges Row - Full width across card so nothing truncates */}
                            <div className="mt-3 flex flex-wrap items-center gap-1.5">
                              {sh.matchScore !== undefined && (
                                sh.matchScore >= 90 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black text-primary border border-primary/30 shadow-2xs">
                                    <HiOutlineSparkles className="h-3 w-3 text-primary" />
                                    Exact Match ({sh.matchScore}%)
                                  </span>
                                ) : sh.matchScore >= 70 ? (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft/80 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-primary border border-primary/20">
                                    <HiOutlineSparkles className="h-3 w-3 text-primary" />
                                    {sh.matchScore}% Match
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-muted-foreground border border-border">
                                    {sh.matchScore}% Match
                                  </span>
                                )
                              )}
                              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-black text-primary border border-primary/20">
                                ₹{rateNumber.toLocaleString("en-IN")}/hr
                              </span>
                              {sh.urgent && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 dark:bg-rose-950/50 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
                                  <HiOutlineBolt className="h-3 w-3 text-rose-600 dark:text-rose-400" />
                                  Urgent Cover
                                </span>
                              )}
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] font-bold border",
                                  feePercent === 0
                                    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                                    : "bg-muted/70 text-muted-foreground border-border"
                                )}
                              >
                                {feePercent === 0 ? "No clinician platform fee" : `${feePercent}% Platform Fee`}
                              </span>
                            </div>

                            {/* Schedule & Location Grid - responsive so time/dept never truncate */}
                            <div className="mt-3.5 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                              <div className="flex items-center gap-2 rounded-2xl bg-muted/40 px-3 py-2 text-foreground font-semibold">
                                <HiOutlineCalendarDays className="h-4 w-4 text-primary shrink-0" />
                                <span className="font-bold shrink-0">{sh.date}</span>
                                <span className="text-muted-foreground/50">•</span>
                                <HiOutlineClock className="h-4 w-4 text-primary shrink-0" />
                                <span className="truncate">{sh.time} ({hoursNumber} hrs duty)</span>
                              </div>

                              <div className="flex items-center gap-2 rounded-2xl bg-muted/40 px-3 py-2 text-foreground font-semibold">
                                <HiOutlineMapPin className="h-4 w-4 text-primary shrink-0" />
                                <span className="shrink-0">{sh.city}</span>
                                <span className="text-muted-foreground/50">•</span>
                                <HiOutlineBuildingOffice2 className="h-4 w-4 text-primary shrink-0" />
                                <span className="truncate">{sh.dept}</span>
                              </div>
                            </div>

                            {/* Perks chips */}
                            {sh.perks && sh.perks.length > 0 && (
                              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                                {sh.perks.map((p) => (
                                  <span
                                    key={p}
                                    className="inline-flex items-center gap-1 rounded-lg bg-muted/50 px-2.5 py-1 text-[11px] font-medium text-muted-foreground border border-border/40"
                                  >
                                    <HiCheck className="h-3 w-3 text-primary shrink-0" />
                                    <span>{p}</span>
                                  </span>
                                ))}
                                {sh.surgeLabel && (
                                  <span className="rounded-lg bg-primary-soft px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/20">
                                    {sh.surgeLabel}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          <ShiftRequirements details={sh.details} />
                          <ShiftArrivalInstructions details={activeClaim?.arrivalInstructions} />
                          {/* Bottom Earnings & Action Dock */}
                          <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-muted/30 p-3.5 sm:p-4 border border-border/60">
                            <div className="flex flex-wrap items-center justify-between gap-2.5">
                              <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground whitespace-nowrap">
                                  Guaranteed Shift Pay • ₹{rateNumber.toLocaleString("en-IN")}/hr
                                </p>
                                <div className="flex flex-wrap items-baseline gap-1.5 mt-0.5">
                                  <span className="text-xl font-black text-foreground whitespace-nowrap">
                                    ₹{totalPay.toLocaleString("en-IN")}
                                  </span>
                                  <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                                    (₹{rateNumber.toLocaleString("en-IN")}/hr × {hoursNumber} hrs)
                                  </span>
                                </div>
                              </div>

                              {applied ? (
                                <div className="flex flex-wrap items-center gap-2 shrink-0">
                                  {(() => {
                                    const claim = activeClaim;
                                    if (claim?.status === "CONFIRMED") {
                                      return (
                                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary-soft text-primary border border-primary/20 px-3 py-1.5 text-xs font-bold shadow-2xs whitespace-nowrap">
                                          <HiCheckBadge className="h-4 w-4 text-primary shrink-0" />
                                          Confirmed
                                        </span>
                                      );
                                    }
                                    if (claim?.status === "CHECKED_IN") {
                                      return (
                                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary-soft text-primary border border-primary/20 px-3 py-1.5 text-xs font-bold shadow-2xs whitespace-nowrap">
                                          <HiOutlineClock className="h-4 w-4 text-primary shrink-0" />
                                          On Floor
                                        </span>
                                      );
                                    }
                                    if (claim?.status === "TIMESHEET_SUBMITTED") {
                                      return (
                                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary-soft text-primary border border-primary/20 px-3 py-1.5 text-xs font-bold shadow-2xs whitespace-nowrap">
                                          <HiOutlineClock className="h-4 w-4 text-primary shrink-0" />
                                          Timesheet ({claim.actualHours || hoursNumber}h)
                                        </span>
                                      );
                                    }
                                    if (claim?.status === "DISPUTED") {
                                      return (
                                        <span className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/50 px-3 py-1.5 text-xs font-bold shadow-2xs whitespace-nowrap">
                                          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                                          Disputed · Ops Review
                                        </span>
                                      );
                                    }
                                    if (claim?.status === "COMPLETED") {
                                      return (
                                        <>
                                          <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary-soft text-primary border border-primary/20 px-3 py-1.5 text-xs font-bold shadow-2xs whitespace-nowrap">
                                            <HiCheckBadge className="h-4 w-4 text-primary shrink-0" />
                                            {claim.payoutStatus === "DISBURSED" ? "Paid" : "Completed"}
                                          </span>
                                          {claim.hospitalRating && (
                                            <span className="inline-flex items-center gap-1 rounded-xl bg-amber-500/10 border border-amber-500/25 px-2.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-300 whitespace-nowrap">
                                              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                                              {claim.hospitalRating}/5
                                            </span>
                                          )}
                                        </>
                                      );
                                    }
                                    return (
                                      <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-primary-soft text-primary border border-primary/25 whitespace-nowrap">
                                        <HiCheck className="h-4 w-4 stroke-[3] shrink-0" />
                                        <span>Applied</span>
                                      </span>
                                    );
                                  })()}
                                </div>
                              ) : isClaimRejected ? (
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 whitespace-nowrap">
                                    <HiXMark className="h-4 w-4 stroke-[3] shrink-0" />
                                    <span>Claim Declined</span>
                                  </span>
                                </div>
                              ) : isSlotFilled ? (
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-muted text-muted-foreground border border-border whitespace-nowrap">
                                    Capacity Filled
                                  </span>
                                </div>
                              ) : isShiftFull ? (
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-muted text-muted-foreground border border-border whitespace-nowrap">
                                    Shift Full
                                  </span>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  disabled={pageAction.isPending || (applyingId === sh.id)}
                                  onClick={() => handleApply(sh.id, sh.title, sh.org)}
                                  className="w-full sm:w-auto rounded-xl px-5 font-bold shadow-md h-10 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed shrink-0"
                                >
                                  {applyingId === sh.id ? (
                                    <span className="flex items-center gap-2">
                                      <span className="h-3.5 w-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                                      <span>Applying...</span>
                                    </span>
                                  ) : (
                                    "Pick up shift"
                                  )}
                                </Button>
                              )}
                            </div>

                            {applied && activeClaim?.status !== "DISPUTED" && (
                              <div className="pt-2.5 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                                {(() => {
                                  const claim = activeClaim;
                                  if (claim?.status === "CONFIRMED") {
                                    return (
                                      <>
                                        <div className="flex flex-wrap items-center gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() => handleOpenCheckInModal(claim.id, sh.title, sh.org)}
                                            className="rounded-xl px-3 h-8 font-bold text-xs bg-primary hover:bg-primary-hover text-white shadow-2xs cursor-pointer gap-1.5"
                                          >
                                            <KeyRound className="h-3.5 w-3.5" />
                                            Check In (PIN / QR)
                                          </Button>
                                        </div>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setDisputeModalData({ claimId: claim.id, shiftTitle: sh.title });
                                            setDisputeReasonInput("");
                                          }}
                                          className="rounded-xl px-2.5 h-8 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer ml-auto"
                                        >
                                          Dispute
                                        </Button>
                                      </>
                                    );
                                  }
                                  if (claim?.status === "CHECKED_IN") {
                                    return (
                                      <>
                                        <Button
                                          size="sm"
                                          onClick={() => openSignOffModal(claim.id, sh)}
                                          className="rounded-xl px-3 h-8 font-bold text-xs bg-primary hover:bg-primary-hover text-white shadow-2xs cursor-pointer"
                                        >
                                          Sign Off Duty
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setDisputeModalData({ claimId: claim.id, shiftTitle: sh.title });
                                            setDisputeReasonInput("");
                                          }}
                                          className="rounded-xl px-2.5 h-8 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer ml-auto"
                                        >
                                          Dispute
                                        </Button>
                                      </>
                                    );
                                  }
                                  if (claim?.status === "TIMESHEET_SUBMITTED") {
                                    return (
                                      <>
                                        <span className="text-xs font-semibold text-muted-foreground">
                                          Awaiting hospital supervisor sign-off
                                        </span>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          onClick={() => {
                                            setDisputeModalData({ claimId: claim.id, shiftTitle: sh.title });
                                            setDisputeReasonInput("");
                                          }}
                                          className="rounded-xl px-2.5 h-8 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer ml-auto"
                                        >
                                          Dispute
                                        </Button>
                                      </>
                                    );
                                  }
                                  if (claim?.status === "COMPLETED") {
                                    return (
                                      <>
                                        <Button asChild size="sm" variant="outline" className="rounded-xl px-3 h-8 font-semibold text-xs border-border/80 hover:bg-muted text-foreground">
                                          <Link to="/earnings">View Earnings</Link>
                                        </Button>
                                        {claim.payoutStatus !== "DISBURSED" && (
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => {
                                              setDisputeModalData({ claimId: claim.id, shiftTitle: sh.title });
                                              setDisputeReasonInput("");
                                            }}
                                            className="rounded-xl px-2.5 h-8 text-xs font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer ml-auto"
                                          >
                                            Dispute
                                          </Button>
                                        )}
                                      </>
                                    );
                                  }
                                  return (
                                    <>
                                      <span className="text-xs font-medium text-muted-foreground">
                                        Waiting for hospital confirmation
                                      </span>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        disabled={pageAction.isPending || (withdrawingId === sh.id)}
                                        onClick={() => handleWithdraw(sh.id, sh.title)}
                                        className="rounded-xl px-2.5 h-8 text-xs font-bold text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors ml-auto"
                                      >
                                        {withdrawingId === sh.id ? "Withdrawing..." : "Withdraw"}
                                      </Button>
                                    </>
                                  );
                                })()}
                              </div>
                            )}
                          </div>

                          {/* Status Guidance Notes */}
                          {isClaimNoShow && (
                            <p className="mt-2 text-[11px] font-semibold text-rose-600/90 dark:text-rose-400 flex items-center gap-1.5">
                              <HiXMark className="h-3.5 w-3.5 shrink-0" />
                              <span>Hospital marked this shift as No-Show. Repeated no-shows impact clinical match visibility.</span>
                            </p>
                          )}
                          {activeClaim?.status === "DISPUTED" && activeClaim.disputeReason && (
                            <p className="mt-2 text-[11px] font-semibold text-rose-600/90 dark:text-rose-400 flex items-center gap-1.5">
                              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                              <span>Dispute Note: {activeClaim.disputeReason}</span>
                            </p>
                          )}
                          {activeClaim?.hospitalRating && (
                            <div className="mt-2 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-[11px] text-foreground flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-300">
                                <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                Hospital Rated {activeClaim.hospitalRating}/5
                              </span>
                              {activeClaim.hospitalReview && (
                                <span className="text-muted-foreground italic">"{activeClaim.hospitalReview}"</span>
                              )}
                            </div>
                          )}
                          {isClaimRejected && (
                            <p className="mt-2 text-[11px] font-semibold text-rose-600/90 dark:text-rose-400 flex items-center gap-1.5">
                              <HiXMark className="h-3.5 w-3.5 shrink-0" />
                              <span>Hospital HR declined this claim. Your profile is open to pick up other available shifts.</span>
                            </p>
                          )}
                          {isSlotFilled && (
                            <p className="mt-2 text-[11px] font-semibold text-muted-foreground flex items-center gap-1.5">
                              <HiOutlineClock className="h-3.5 w-3.5 shrink-0 text-primary" />
                              <span>Openings for this shift have been filled. Your schedule has been released so you can claim other shifts.</span>
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Empty Search Result State */}
                {!filteredShifts.length && (
                  <div className="surface p-12 text-center rounded-3xl border border-border/80">
                    <EmptyEarningsGraphic className="w-36 h-36 sm:w-44 sm:h-44 mx-auto mb-2" />
                    <p className="mt-3 text-sm font-bold text-foreground">No clinical shifts match your criteria</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Try adjusting your search terms, city filter, or timing to discover more available hospital shifts.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setQ("");
                        setCityF("All Cities");
                        setTimingF("all");
                      }}
                      className="mt-4 rounded-xl font-bold"
                    >
                      <HiOutlineArrowPath className="h-3.5 w-3.5 mr-1.5" />
                      Reset all filters
                    </Button>
                  </div>
                )}
              </div>

              {/* ================= ESCROW ASSURANCE FOOTER ================= */}
              <div className="mt-8 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary-soft/50 via-card to-primary-soft/40 p-4 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 sm:gap-3.5 min-w-0 flex-1">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-sm">
                      <HiOutlineShieldCheck className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-black text-sm text-foreground flex items-center gap-1.5 flex-wrap">
                        <span>100% Protected Shift Escrow Guarantee</span>
                        <HiOutlineSparkles className="h-4 w-4 text-primary shrink-0" />
                      </h2>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-xl">
                        Hospital payments are pre-funded into FALE Escrow before shift publish. Once you complete your shift hours and clinical sign-off, payout is queued for disbursement and its transfer status appears in Earnings.
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <span className="flex items-center justify-center text-center rounded-2xl border border-border/70 bg-card px-3 py-2 text-xs font-bold text-foreground shadow-2xs">
                      NABH & JCI Hospitals
                    </span>
                    <span className="flex items-center justify-center text-center rounded-2xl border border-border/70 bg-card px-3 py-2 text-xs font-bold text-foreground shadow-2xs">
                      Direct UPI Payout
                    </span>
                  </div>
                </div>
              </div>

              {/* ================= TIMESHEET & DUTY SIGN-OFF MODAL ================= */}
              {signOffModalData && (
                <Dialog open={true} onOpenChange={(open) => { if (!open) setSignOffModalData(null); }}>
                  <DialogContent className="flex flex-col gap-4 sm:max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6">
                    <DialogHeader className="text-left pr-8">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                          <HiOutlineClock className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <DialogTitle className="text-base font-black text-foreground">
                            Submit Shift Timesheet
                          </DialogTitle>
                          <DialogDescription className="text-xs text-muted-foreground truncate">
                            {signOffModalData.shiftTitle} • {signOffModalData.facilityName}
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="w-full space-y-4 text-sm">
                      <div className="rounded-2xl border border-border bg-muted/40 p-3.5 space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">Scheduled Duration</span>
                          <span className="font-bold text-foreground">{signOffModalData.scheduledHours} hrs</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">Hourly Pay Rate</span>
                          <span className="font-bold text-foreground">₹{signOffModalData.ratePerHour.toLocaleString("en-IN")}/hr</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground font-medium">Scheduled Escrow Gross</span>
                          <span className="font-bold text-primary">₹{(signOffModalData.ratePerHour * signOffModalData.scheduledHours).toLocaleString("en-IN")}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold text-foreground flex items-center justify-between">
                          <span>Actual Hours Worked</span>
                          <span className="text-[11px] font-medium text-muted-foreground">
                            Scheduled: {signOffModalData.scheduledHours} hrs
                          </span>
                        </Label>
                        <div className="relative">
                          <Input
                            type="number"
                            min={1}
                            max={signOffModalData.scheduledHours + 4}
                            step={1}
                            value={actualHoursWorked}
                            onChange={(e) => setActualHoursWorked(Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full h-11 rounded-2xl font-bold text-foreground pr-14"
                          />
                          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                            hours
                          </span>
                        </div>
                      </div>

                      {/* Escrow Reconciliation Info */}
                      {actualHoursWorked < signOffModalData.scheduledHours ? (
                        <div className="rounded-2xl border border-primary/20 bg-primary-soft/30 p-3 text-xs space-y-1.5">
                          <p className="font-bold text-primary flex items-center gap-1.5">
                            <HiOutlineShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                            Escrow Reconciliation & Partial Refund
                          </p>
                          <p className="text-muted-foreground leading-relaxed text-[11px]">
                            You reported <strong>{actualHoursWorked} hrs</strong> worked out of <strong>{signOffModalData.scheduledHours} hrs</strong> scheduled.
                          </p>
                          <div className="pt-1.5 border-t border-primary/15 flex justify-between font-semibold text-foreground">
                            <span>Adjusted Gross Payout:</span>
                            <span className="text-primary font-bold">
                              ₹{(signOffModalData.ratePerHour * actualHoursWorked).toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>Unused Escrow Returned to Hospital:</span>
                            <span className="font-bold text-foreground">
                              ₹{(signOffModalData.ratePerHour * (signOffModalData.scheduledHours - actualHoursWorked)).toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>
                      ) : actualHoursWorked > signOffModalData.scheduledHours ? (
                        <div className="rounded-2xl border border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-xs space-y-1.5">
                          <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                            <HiOutlineClock className="h-4 w-4 shrink-0 text-amber-600" />
                            Overtime Claim ({actualHoursWorked - signOffModalData.scheduledHours} extra hrs)
                          </p>
                          <p className="text-muted-foreground leading-relaxed text-[11px]">
                            Reporting <strong>{actualHoursWorked} hrs</strong> instead of {signOffModalData.scheduledHours} hrs requires hospital supervisor sign-off and sufficient facility wallet balance to cover ₹{(signOffModalData.ratePerHour * (actualHoursWorked - signOffModalData.scheduledHours)).toLocaleString("en-IN")} overtime.
                          </p>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-primary/20 bg-primary-soft/30 p-3 text-xs text-foreground flex items-center gap-2">
                          <HiOutlineShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                          <span>Full scheduled escrow of ₹{(signOffModalData.ratePerHour * signOffModalData.scheduledHours).toLocaleString("en-IN")} will be released upon hospital sign-off.</span>
                        </div>
                      )}

                      <p className="text-[11px] text-muted-foreground">
                        Once submitted, the hospital department supervisor will review and verify your timesheet. Escrow remains protected in FALE custody until verification.
                      </p>
                    </div>

                    <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:space-x-0 pt-1">
                      <Button
                        variant="outline"
                        disabled={submittingSignOff}
                        onClick={() => setSignOffModalData(null)}
                        className="h-9 px-4 rounded-xl font-bold text-xs w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={pageAction.isPending || (submittingSignOff)}
                        onClick={handleConfirmDutySignOff}
                        className="h-9 px-4 rounded-xl font-bold text-xs bg-primary hover:bg-primary-hover text-primary-foreground shadow-xs cursor-pointer w-full sm:w-auto"
                      >
                        {submittingSignOff ? "Submitting..." : "Submit Timesheet for Verification"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {/* ================= GPS, SELFIE AND SIX-DIGIT PIN / QR CHECK-IN ================= */}
              {pinModalData && (
                <Dialog open={true} onOpenChange={(open) => { if (!open) setPinModalData(null); }}>
                  <DialogContent className="flex flex-col gap-4 sm:max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6">
                    <DialogHeader className="text-left pr-8">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                          <KeyRound className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <DialogTitle className="text-base font-black text-foreground">
                            Ward Floor Check-In
                          </DialogTitle>
                          <DialogDescription className="text-xs text-muted-foreground truncate">
                            {pinModalData.shiftTitle} · {pinModalData.org}
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>

                    <ShiftCheckIn claimId={pinModalData.claimId} onCancel={() => setPinModalData(null)} onSubmit={async evidence => {
                      const updated = await checkInShift(pinModalData.claimId, evidence);
                      setMyClaims(previous => previous.map(claim => claim.id === updated.id ? updated : claim));
                      setPinModalData(null); toast.success("Checked in - attendance evidence recorded");
                    }} />
                  </DialogContent>
                </Dialog>
              )}

              {/* ================= RAISE SHIFT DISPUTE MODAL ================= */}
              {disputeModalData && (
                <Dialog open={true} onOpenChange={(open) => { if (!open) setDisputeModalData(null); }}>
                  <DialogContent className="flex flex-col gap-4 sm:max-w-md rounded-2xl border border-border bg-card p-5 sm:p-6">
                    <DialogHeader className="text-left pr-8">
                      <div className="flex items-center gap-3">
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                          <AlertTriangle className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <DialogTitle className="text-base font-black text-foreground">
                            Raise Shift Dispute
                          </DialogTitle>
                          <DialogDescription className="text-xs text-muted-foreground truncate">
                            {disputeModalData.shiftTitle}
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>

                    <div className="w-full space-y-3">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Escrow remains protected while FALE Ops reviews your claim against hospital attendance and handover records.
                      </p>
                      <div className="space-y-1.5">
                        <Label htmlFor="shift-dispute-reason" className="text-xs font-bold text-foreground">
                          Dispute Reason
                        </Label>
                        <textarea
                          id="shift-dispute-reason"
                          rows={3}
                          value={disputeReasonInput}
                          onChange={(e) => setDisputeReasonInput(e.target.value)}
                          placeholder="Describe hours worked discrepancy, ward issue, or missing supervisor sign-off..."
                          className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                        />
                      </div>
                    </div>

                    <DialogFooter className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2.5 sm:space-x-0 pt-1">
                      <Button
                        variant="outline"
                        disabled={submittingDispute}
                        onClick={() => setDisputeModalData(null)}
                        className="h-9 px-4 rounded-xl font-bold text-xs w-full sm:w-auto"
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={submittingDispute}
                        onClick={handleSubmitDispute}
                        className="h-9 px-4 rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white cursor-pointer w-full sm:w-auto"
                      >
                        {submittingDispute ? "Submitting..." : "Escalate to FALE Ops"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </AppShell>
            );
}
