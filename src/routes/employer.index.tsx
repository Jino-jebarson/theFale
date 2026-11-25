import { usePageLoad } from "@/hooks/use-page-load";
import { RequestError } from "@/components/fale/RequestError";
import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  HiPlus,
  HiOutlineBolt,
  HiOutlineBriefcase,
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlineDocumentCheck,
  HiOutlineCheckBadge,
  HiArrowRight,
  HiOutlineMagnifyingGlass,
  HiOutlineBanknotes,
  HiOutlineArrowTrendingUp,
  HiOutlineChartPie,
  HiOutlineShieldCheck,
  HiOutlineQuestionMarkCircle,
  HiOutlineClock,
  HiOutlineUsers,
  HiOutlineCalendarDays,
  HiOutlineArrowPath,
  HiChevronRight,
} from "react-icons/hi2";
import { generateAnalyticsInsightWithAi } from "@/lib/adapters/aiAdapter";
import { RiVerifiedBadgeFill, RiShieldCheckFill } from "react-icons/ri";
import { toast } from "sonner";
import { BotMessageSquare } from "lucide-react";
import { AppShell, StatusBadge, initials } from "@/components/fale/AppShell";
import { FacilityImage } from "@/components/fale/FacilityImage";
import { OrgMark } from "@/components/fale/JobCard";
import { EmptyEarningsGraphic } from "@/components/fale/EmptyEarningsGraphic";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import facilityMultispecialtyImg from "@/assets/facilities/facility-multispecialty.jpg";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { isApiEnabled, paiseToRupees } from "@/lib/api";
import {
  attachFocusAndPollRefresh,
  formatApplicationStatus,
  getFacilityJobs,
  getFacilityApplicants,
  getFacilityWallet,
  getFacilityProfile,
  type FacilityProfileDto,
  type FacilityWalletDto,
} from "@/lib/adapters/facilityAdapter";
import { getFacilityShifts, getFacilityShiftPolicy, type FacilityShiftPolicyDto, type UiShiftItem } from "@/lib/adapters/shiftAdapter";
import { type JobPostingDto } from "@/lib/adapters/jobAdapter";

export const Route = createFileRoute("/employer/")({
  head: () => ({
    meta: [
      { title: "Hospital Command Dashboard — FALE" },
      {
        name: "description",
        content:
          "Executive hospital clinical workforce command center, locum shift analytics, department distribution, and verified candidate requisitions.",
      },
      { property: "og:title", content: "Hospital Command Dashboard — FALE Healthcare" },
      {
        property: "og:description",
        content: "Executive hospital workforce dashboard with live clinical analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EmployerDashboard,
});

// FALE Brand Colors for Charts:
// Saffron: #FF5A1F, Charcoal: #1A1A1A, Success Green: #1A8633, Amber: #F59E0B, Neutral Slate: #8A8A8A
const BRAND_COLORS = {
  saffron: "#FF5A1F",
  charcoal: "#1A1A1A",
  green: "#FF7E45",
  slate: "#8A8A8A",
};

function EmployerDashboard() {
  const pageLoad = usePageLoad();
  const s = useApp();
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<"7d" | "30d">("7d");
  const [activeTab, setActiveTab] = useState<"postings" | "shifts">("postings");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);

  // Dynamic API state
  const [apiJobs, setApiJobs] = useState<JobPostingDto[]>([]);
  const [apiShifts, setApiShifts] = useState<UiShiftItem[]>([]);
  const [apiApplicants, setApiApplicants] = useState<any[]>([]);
  const [apiWallet, setApiWallet] = useState<FacilityWalletDto | null>(null);
  const [apiProfile, setApiProfile] = useState<FacilityProfileDto | null>(null);
  const [shiftPolicy, setShiftPolicy] = useState<FacilityShiftPolicyDto | null>(null);
  const [resourceErrors, setResourceErrors] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(isApiEnabled);
  const rawFacilityKycStatus = apiProfile?.kycStatus || s.profile["kycStatus"];
  const facilityKycStatus = rawFacilityKycStatus
    ? String(rawFacilityKycStatus).toUpperCase()
    : loading ? "LOADING" : resourceErrors.profile ? "UNAVAILABLE" : "PENDING";
  const isFacilityVerified = facilityKycStatus === "VERIFIED";
  const isFacilityRejected = facilityKycStatus === "REJECTED";

  useEffect(() => {
    let isMounted = true;
    let requestInFlight = false;

    const fetchDashboard = async (silent = false) => {
      if (requestInFlight) return;
      requestInFlight = true;
      if (!silent) setLoading(true);
      let settled: PromiseSettledResult<any>[];
      try {
        settled = await Promise.allSettled([
          getFacilityProfile(),
          getFacilityJobs(),
          getFacilityShifts(),
          getFacilityWallet(),
          getFacilityShiftPolicy(),
        ]);
      } catch (error) {
        if (isMounted) {
          pageLoad.fail(error);
          setLoading(false);
        }
        requestInFlight = false;
        return;
      }
      if (!isMounted) {
        requestInFlight = false;
        return;
      }

      const [profileResult, jobsResult, shiftsResult, walletResult, shiftPolicyResult] = settled;
      const errorText = (error: unknown) => error instanceof Error ? error.message : "Could not load this section.";
      const nextErrors: Record<string, string | null> = {
        profile: profileResult.status === "rejected" ? errorText(profileResult.reason) : null,
        jobs: jobsResult.status === "rejected" ? errorText(jobsResult.reason) : null,
        shifts: shiftsResult.status === "rejected" ? errorText(shiftsResult.reason) : null,
        wallet: walletResult.status === "rejected" ? errorText(walletResult.reason) : null,
        shiftPolicy: shiftPolicyResult.status === "rejected" ? errorText(shiftPolicyResult.reason) : null,
        applicants: null,
      };

      if (profileResult.status === "fulfilled") {
        setApiProfile(profileResult.value);
        if (String(profileResult.value.kycStatus || "").toUpperCase() === "VERIFIED") {
          try {
            const applicants = await getFacilityApplicants();
            if (!isMounted) return;
            setApiApplicants(applicants);
          } catch (error) {
            nextErrors.applicants = errorText(error);
          }
        } else {
          setApiApplicants([]);
        }
      } else {
        pageLoad.fail(profileResult.reason);
        setApiApplicants([]);
      }

      if (jobsResult.status === "fulfilled") setApiJobs(jobsResult.value);
      if (shiftsResult.status === "fulfilled") setApiShifts(shiftsResult.value);
      if (walletResult.status === "fulfilled") setApiWallet(walletResult.value);
      if (shiftPolicyResult.status === "fulfilled") setShiftPolicy(shiftPolicyResult.value);
      setResourceErrors(nextErrors);
      if (isMounted && !silent) setLoading(false);
      requestInFlight = false;
    };

    fetchDashboard(false);

    const handleAppsUpdated = () => fetchDashboard(true);
    window.addEventListener("fale:applications-updated", handleAppsUpdated);
    const detachAutoRefresh = attachFocusAndPollRefresh(() => fetchDashboard(true), 60000);

    return () => {
      isMounted = false;
      window.removeEventListener("fale:applications-updated", handleAppsUpdated);
      detachAutoRefresh();
    };
  }, [pageLoad.retryKey]);

  const orgName = apiProfile?.hospitalName || "Healthcare Facility";
  const city = apiProfile?.city || String(s.profile["city"] || "");

  const stateName = apiProfile?.state || String(s.profile["state"] || "");
  const displayCity = useMemo(() =>
    [apiProfile?.area, city, stateName].filter(Boolean).join(", ") || "Location not added",
  [apiProfile?.area, city, stateName]);

  const campusLocation = useMemo(() => {
    if (apiProfile?.addressLine) {
      return apiProfile.addressLine;
    }
    if (apiProfile?.address) {
      return apiProfile.address;
    }
    if (apiProfile?.state) {
      return `${city}, ${apiProfile.state}`;
    }
    return city || "Address not added";
  }, [apiProfile, city]);

  const bedCount = apiProfile?.beds || apiProfile?.bedCount;
  const icuCount = apiProfile?.icuBeds;
  const bedInfo = bedCount
    ? icuCount && icuCount > 0
      ? `${bedCount} Beds (${icuCount} ICU)`
      : `${bedCount} Beds`
    : "";

  const accreditationText = useMemo(() => {
    const level = apiProfile?.accreditationLevel;
    return level || "Accreditation not added";
  }, [apiProfile?.accreditationLevel]);

  const facilityTypeText = useMemo(() => {
    if (apiProfile?.facilityType) return apiProfile.facilityType;
    if (s.profile["facilityType"]) return String(s.profile["facilityType"]);
    if (apiProfile?.size) return `${apiProfile.size} Center`;
    return "Facility type not added";
  }, [apiProfile?.facilityType, apiProfile?.size, s.profile]);

  const campusPhotoUrl = useMemo(() => {
    if (apiProfile?.facilityPhotos && apiProfile.facilityPhotos.length > 0) {
      return apiProfile.facilityPhotos[0];
    }
    if (apiProfile?.logoUrl) {
      return apiProfile.logoUrl;
    }
    return facilityMultispecialtyImg;
  }, [apiProfile?.facilityPhotos, apiProfile?.logoUrl]);

  const escrowReservedPaise =
    apiWallet?.lockedEscrowBalancePaise && apiWallet.lockedEscrowBalancePaise > 0
      ? apiWallet.lockedEscrowBalancePaise
      : apiWallet?.availableBalancePaise || 0;
  const escrowBalance = paiseToRupees(escrowReservedPaise);

  const availableWalletRupees = useMemo(() => {
    if (apiWallet) {
      return paiseToRupees(apiWallet.availableBalancePaise || 0);
    }
    return s.escrowBalance || 0;
  }, [apiWallet, s.escrowBalance]);

  const lockedEscrowRupees = useMemo(() => {
    if (apiWallet) {
      return paiseToRupees(apiWallet.lockedEscrowBalancePaise || 0);
    }
    return s.lockedEscrow || 0;
  }, [apiWallet, s.lockedEscrow]);

  const formattedEscrow =
    escrowBalance >= 100000
      ? `₹${(escrowBalance / 1000).toFixed(0)}k`
      : escrowBalance > 0
        ? `₹${escrowBalance.toLocaleString("en-IN")}`
        : "₹0";

  // Effective applicants list
  const effectiveApplicants = useMemo(() => {
    return isApiEnabled ? apiApplicants : s.adminApplications;

  }, [isApiEnabled, apiApplicants, s.adminApplications]);

  // Filtered jobs
  const allJobs = useMemo(() => {
    if (!isApiEnabled) return s.postedJobs;
    return apiJobs.map((j) => ({
          id: j.id,
          title: j.title,
          dept: j.department || "General Medicine",
          city: j.city || "",
          status: j.status || "UNKNOWN",
          exp: j.experienceRequired || "1-3 Years",
          type: j.isInternship ? "Internship" : "Full-time",
          openings: j.openings || 1,
        }));
  }, [isApiEnabled, apiJobs, s.postedJobs]);

  const filteredJobs = useMemo(() => {
    return allJobs.filter((j) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          j.title.toLowerCase().includes(q) ||
          j.dept.toLowerCase().includes(q) ||
          city.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [allJobs, searchQuery, city]);

  const activeShifts = isApiEnabled ? apiShifts : (s.postedShifts || []).map((shift) => ({
    ...shift,
    startAt: shift.startAt || shift.date,
    slots: shift.openings || 1,
    slotsClaimed: 0,
  } as unknown as UiShiftItem));

  // Dynamic Telemetry Metrics
  const activeJobsCount = useMemo(() => {
    return allJobs.filter((j) => {
      const st = (j.status || "").toUpperCase();
      return st === "OPEN" || st === "ACTIVE";
    }).length;
  }, [allJobs]);

  const inVerificationJobsCount = useMemo(() => {
    return allJobs.filter((j) => {
      const st = (j.status || "").toUpperCase();
      return st === "PENDING_APPROVAL" || st === "UNDER_REVIEW";
    }).length;
  }, [allJobs]);

  // Only count shifts that were actually published or filled in operational metrics.
  const validShifts = useMemo(() => {
    return activeShifts.filter((sh) => {
      const st = (sh.status || "").toUpperCase();
      return ["OPEN", "BROADCASTED", "FILLED", "COMPLETED", "CLOSED"].includes(st);
    });
  }, [activeShifts]);

  const totalShiftSlots = useMemo(() => {
    return validShifts.reduce((acc, sh) => acc + (sh.slots || 1), 0);
  }, [validShifts]);

  const claimedShiftSlots = useMemo(() => {
    return validShifts.reduce((acc, sh) => acc + Math.min(Math.max(0, sh.slots || 0), Math.max(0, sh.slotsClaimed || 0)), 0);
  }, [validShifts]);

  const liveBroadcastsCount = useMemo(() => {
    return validShifts.filter((sh) => {
      const st = (sh.status || "").toUpperCase();
      return st === "OPEN" || st === "BROADCASTED";
    }).length;
  }, [validShifts]);

  const locumFillRate = useMemo(() => {
    if (totalShiftSlots === 0) return "0.0";
    return ((claimedShiftSlots / totalShiftSlots) * 100).toFixed(1);
  }, [totalShiftSlots, claimedShiftSlots]);

  const shortlistedApplicants = useMemo(() => {
    return effectiveApplicants.filter((a: any) => {
      const st = (a.status || "").toUpperCase();
      return st === "SHORTLISTED" && !a.isShiftClaim && !a.shiftId;
    });
  }, [effectiveApplicants]);

  const pipelineApplicants = useMemo(() => effectiveApplicants.filter((a: any) => {
    const status = String(a.status || "").toUpperCase();
    const isShift = Boolean(a.isShiftClaim || a.shiftId || String(a.jobTitle || "").toLowerCase().includes("locum shift"));
    return !isShift && !["REJECTED", "WITHDRAWN", "POSITION_FILLED", "CANCELLED"].includes(status);
  }), [effectiveApplicants]);

  const interviewApplicants = useMemo(() => pipelineApplicants.filter((a: any) => {
    const status = String(a.status || "").toUpperCase();
    return status === "INTERVIEW" || status === "INTERVIEW_SCHEDULED";
  }), [pipelineApplicants]);

  const upcomingInterviews = useMemo(() => interviewApplicants
    .filter((a: any) => a.interviewScheduledAt && new Date(a.interviewScheduledAt).getTime() >= Date.now())
    .sort((a: any, b: any) => new Date(a.interviewScheduledAt).getTime() - new Date(b.interviewScheduledAt).getTime())
  , [interviewApplicants]);

  const offerApplicants = useMemo(() => pipelineApplicants.filter((a: any) => {
    const status = String(a.status || "").toUpperCase();
    return ["OFFER", "OFFERED", "ACCEPTED", "HIRED"].includes(status);
  }), [pipelineApplicants]);

  const councilVerifiedCount = useMemo(() => {
    return effectiveApplicants.filter((a: any) => a.councilVerified === true && !a.isShiftClaim && !a.shiftId).length;
  }, [effectiveApplicants]);

  const jobsUnavailable = loading || Boolean(resourceErrors.jobs);
  const shiftsUnavailable = loading || Boolean(resourceErrors.shifts);
  const applicantsUnavailable = loading || Boolean(resourceErrors.applicants);
  const walletUnavailable = loading || Boolean(resourceErrors.wallet);
  const partialErrorLabels = Object.entries(resourceErrors)
    .filter(([name, message]) => name !== "profile" && Boolean(message))
    .map(([name]) => ({ jobs: "job postings", shifts: "shift data", applicants: "applicant data", wallet: "wallet data" }[name] || name));

  // Dynamic Candidate Pipeline Funnel Data
  const dynamicCandidatePipelineData = useMemo(() => {
    const total = pipelineApplicants.length;
    if (total === 0) {
      return [
        { name: "Under screening", value: 0, count: "0 candidates", color: "#FF5A1F" },
        { name: "Shortlisted", value: 0, count: "0 candidates", color: "#E04812" },
        { name: "Interview scheduled", value: 0, count: "0 candidates", color: "#FF7E45" },
        { name: "Offers & hires", value: 0, count: "0 candidates", color: "#FFA47A" },
        { name: "Needs review", value: 0, count: "0 candidates", color: "#FFD3C2" },
      ];
    }

    let shortlisted = 0;
    let interview = 0;
    let offers = 0;
    let screening = 0;
    let needsReview = 0;

    pipelineApplicants.forEach((a: any) => {
      const st = (a.status || "").toUpperCase();
      if (st === "SHORTLISTED") shortlisted++;
      else if (st === "INTERVIEW_SCHEDULED" || st === "INTERVIEW") interview++;
      else if (["OFFERED", "OFFER", "ACCEPTED", "HIRED"].includes(st)) offers++;
      else if (["NEW", "APPLIED", "PENDING", "PENDING_SCREENING", "UNDER_ADMIN_SCREENING", "UNDER_REVIEW", "UNDER_SCREENING"].includes(st)) screening++;
      else needsReview++;
    });

    return [
      {
        name: "Under screening",
        value: Math.round((screening / total) * 100),
        count: `${screening} candidate${screening !== 1 ? "s" : ""}`,
        color: "#FF5A1F",
      },
      {
        name: "Shortlisted",
        value: Math.round((shortlisted / total) * 100),
        count: `${shortlisted} Candidate${shortlisted !== 1 ? "s" : ""}`,
        color: "#E04812",
      },
      {
        name: "Interview scheduled",
        value: Math.round((interview / total) * 100),
        count: `${interview} Candidate${interview !== 1 ? "s" : ""}`,
        color: "#FF7E45",
      },
      {
        name: "Offers & hires",
        value: Math.round((offers / total) * 100),
        count: `${offers} Candidate${offers !== 1 ? "s" : ""}`,
        color: "#FFA47A",
      },
      {
        name: "Needs review",
        value: Math.round((needsReview / total) * 100),
        count: `${needsReview} candidate${needsReview !== 1 ? "s" : ""}`,
        color: "#FFD3C2",
      },
    ];
  }, [pipelineApplicants]);

  const pieRenderData = useMemo(() => {
    const hasData = dynamicCandidatePipelineData.some((d) => d.value > 0);
    if (!hasData) {
      return [{ name: "No Candidates", value: 1, color: "#FFE5DC" }];
    }
    return dynamicCandidatePipelineData.filter((d) => d.value > 0);
  }, [dynamicCandidatePipelineData]);

  // Analytics use actual shift start dates within the selected rolling window.
  const trendData = useMemo(() => {
    const rangeDays = analyticsTimeframe === "7d" ? 7 : 30;
    const today = new Date();
    const end = new Date(today);
    end.setHours(23, 59, 59, 999);
    const start = new Date(today);
    start.setDate(start.getDate() - rangeDays + 1);
    start.setHours(0, 0, 0, 0);
    const dayMs = 24 * 60 * 60 * 1000;
    const buckets = Array.from({ length: analyticsTimeframe === "7d" ? 7 : 5 }, (_, index) => ({
      period: analyticsTimeframe === "7d"
        ? new Date(start.getTime() + index * dayMs).toLocaleDateString("en-IN", { weekday: "short", day: "numeric" })
        : (() => {
            const bucketStart = new Date(start.getTime() + index * 7 * dayMs);
            const bucketEnd = new Date(Math.min(end.getTime(), bucketStart.getTime() + 6 * dayMs));
            const formatDay = (date: Date) => date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
            return `${formatDay(bucketStart)}–${formatDay(bucketEnd)}`;
          })(),
      broadcast: 0,
      filled: 0,
      hours: 0,
    }));

    validShifts.forEach((shift) => {
      if (!shift.startAt) return;
      const scheduledAt = new Date(shift.startAt);
      if (Number.isNaN(scheduledAt.getTime()) || scheduledAt < start || scheduledAt > end) return;
      const scheduledDay = new Date(scheduledAt);
      scheduledDay.setHours(0, 0, 0, 0);
      const daysFromStart = Math.floor((scheduledDay.getTime() - start.getTime()) / dayMs);
      const bucketIndex = analyticsTimeframe === "7d" ? daysFromStart : Math.min(4, Math.floor(daysFromStart / 7));
      const bucket = buckets[bucketIndex];
      if (!bucket) return;
      const slots = Math.max(0, Number(shift.slots) || 1);
      const claimed = Math.min(slots, Math.max(0, Number(shift.slotsClaimed) || 0));
      bucket.broadcast += slots;
      bucket.filled += claimed;
      bucket.hours += (Number(shift.hours) || 0) * claimed;
    });

    return buckets;
  }, [validShifts, analyticsTimeframe]);

  const totalBroadcastCount = useMemo(() => {
    return trendData.reduce((acc, curr) => acc + curr.broadcast, 0);
  }, [trendData]);

  const totalFilledCount = useMemo(() => {
    return trendData.reduce((acc, curr) => acc + curr.filled, 0);
  }, [trendData]);

  const totalCoveredHours = useMemo(() => {
    return trendData.reduce((acc, curr) => acc + curr.hours, 0);
  }, [trendData]);

  const dynamicFulfillmentRate = useMemo(() => {
    if (totalBroadcastCount === 0) return "0.0%";
    return `${((totalFilledCount / totalBroadcastCount) * 100).toFixed(1)}%`;
  }, [totalBroadcastCount, totalFilledCount]);

  // Feature #15: Executive Workforce AI Brief
  const [aiExecutiveBrief, setAiExecutiveBrief] = useState<string | null>(null);
  const [loadingAiBrief, setLoadingAiBrief] = useState(false);

  const handleGenerateAiBrief = async () => {
    setLoadingAiBrief(true);
    try {
      const summaryMetrics = {
        organization: orgName,
        city,
        totalScheduledSlots: totalBroadcastCount,
        claimedShiftSlots,
        totalShiftSlots,
        claimedSlotRate: `${locumFillRate}%`,
        activePostingsCount: activeJobsCount,
        escrowBalanceINR: paiseToRupees(apiWallet?.availableBalancePaise || 0),
      };

      const res = await generateAnalyticsInsightWithAi(summaryMetrics);
      const briefText = res.response || res.content || "";
      if (briefText) {
        setAiExecutiveBrief(briefText);
        toast.success("Executive workforce intelligence generated by Ally");
      }
    } catch (err) {
      console.warn("Failed to generate executive workforce brief:", err);
      toast.error("Unable to generate executive brief with Ally.");
    } finally {
      setLoadingAiBrief(false);
    }
  };

  const addInterviewToCalendar = (app: any) => {
    const start = new Date(app.interviewScheduledAt);
    if (Number.isNaN(start.getTime())) return;
    const durationMinutes = Number(app.interviewDurationMinutes) > 0 ? Number(app.interviewDurationMinutes) : 30;
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    const toIcsDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    const escapeIcs = (value: string) => value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
    const title = `Interview: ${app.jobTitle || app.role || "Healthcare role"}`;
    const lines = [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//The Fale//Hospital Interview//EN", "BEGIN:VEVENT",
      `UID:${app.id}@thefale.care`, `DTSTAMP:${toIcsDate(new Date())}`, `DTSTART:${toIcsDate(start)}`, `DTEND:${toIcsDate(end)}`,
      `SUMMARY:${escapeIcs(title)}`,
      `DESCRIPTION:${escapeIcs(`Candidate: ${app.candidateName || app.name || "Candidate"}\nFacility: ${orgName}`)}`,
      ...(app.interviewLocationOrLink ? [`LOCATION:${escapeIcs(app.interviewLocationOrLink)}`] : []),
      "END:VEVENT", "END:VCALENDAR",
    ];
    const file = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = `fale-interview-${String(app.candidateName || "candidate").trim().replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Calendar invite downloaded");
  };

  return (
    <AppShell>
      <RequestError message={pageLoad.error} onRetry={pageLoad.retry} />
      <div className="space-y-6 w-full min-w-0 max-w-full pb-16">
        {partialErrorLabels.length > 0 && (
          <section role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <p className="text-xs text-foreground">
              Some dashboard data is unavailable: {partialErrorLabels.join(", ")}. Other sections are still shown with the latest available data.
            </p>
            <Button variant="outline" size="sm" onClick={pageLoad.retry} className="h-8 rounded-lg text-xs">Retry</Button>
          </section>
        )}
        {/* ========================================================================= */}
        {/* 1. EXECUTIVE HOSPITAL COMMAND COCKPIT HEADER                                */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs">
          {/* Top Row: Hospital Identity & Primary Action Buttons */}
          <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Left: Hospital Identity & Clean Location */}
            <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
              <button
                type="button"
                onClick={() => setIsCampusModalOpen(true)}
                title="Click to view campus overview"
                className="relative shrink-0 cursor-pointer group/avatar"
              >
                {apiProfile?.logoUrl ? (
                  <FacilityImage
                    src={apiProfile.logoUrl}
                    alt={orgName}
                    className="h-13 w-13 sm:h-14 sm:w-14 rounded-2xl object-cover shadow-sm border border-border/60 bg-muted/40 transition-transform group-hover/avatar:scale-105"
                  />
                ) : (
                  <OrgMark
                    name={orgName}
                    className="h-13 w-13 sm:h-14 sm:w-14 text-xl sm:text-2xl rounded-2xl shadow-sm border border-border/60 bg-muted/40 transition-transform group-hover/avatar:scale-105"
                  />
                )}
                <span
                  title={isFacilityVerified ? "Verified institution" : isFacilityRejected ? "Verification needs attention" : facilityKycStatus === "LOADING" ? "Loading verification status" : facilityKycStatus === "UNAVAILABLE" ? "Verification status unavailable" : "Verification pending"}
                  className={cn(
                    "absolute -bottom-1 -right-1 grid h-5 w-5 place-items-center rounded-full text-white ring-2 ring-card shadow-xs",
                    isFacilityVerified ? "bg-primary" : isFacilityRejected ? "bg-destructive" : "bg-muted-foreground",
                  )}
                >
                  {isFacilityVerified ? <RiVerifiedBadgeFill className="h-3.5 w-3.5" /> : <HiOutlineClock className="h-3.5 w-3.5" />}
                </span>
              </button>

              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground truncate">
                    {orgName}
                  </h1>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    <RiShieldCheckFill className="h-3.5 w-3.5 text-primary" />
                    {accreditationText}
                  </span>
                </div>

                <div className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-foreground flex items-center gap-1">
                    <HiOutlineMapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    {displayCity}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Primary Action Buttons */}
            <div className="grid grid-cols-2 md:flex items-center gap-2.5 shrink-0 w-full md:w-auto">
              <Button asChild className="rounded-xl font-bold h-10 px-4 text-xs shadow-xs gap-1.5 cursor-pointer bg-primary hover:bg-primary/90 text-white justify-center">
                <Link to="/employer/post">
                  <HiPlus className="h-4 w-4 stroke-[2.5]" />
                  <span>Post Role</span>
                </Link>
              </Button>

              <Button asChild variant="outline" className="rounded-xl font-bold h-10 px-4 text-xs bg-card border-border/80 hover:bg-muted/50 gap-1.5 cursor-pointer justify-center">
                <Link to="/employer/post-shift">
                  <HiOutlineBolt className="h-4 w-4 text-primary" />
                  <span>Broadcast Shift</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Bottom Integrated Escrow Sub-bar */}
          <div className="border-t border-border/60 bg-muted/20 px-4 py-2.5 sm:px-5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 sm:gap-4 flex-wrap text-xs">
              <div className="flex items-center gap-2">
                <span className="grid h-6 w-6 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                  <HiOutlineBanknotes className="h-3.5 w-3.5" />
                </span>
                <span className="font-bold text-foreground">
                  Hospital Escrow:
                </span>
                <span className="font-black font-mono text-sm sm:text-base text-foreground tracking-tight">
                  ₹{availableWalletRupees.toLocaleString("en-IN")}
                </span>
                <span className="text-[11px] font-medium text-muted-foreground">Available</span>
              </div>

              {lockedEscrowRupees > 0 && (
                <>
                  <span className="hidden sm:inline text-muted-foreground/40">•</span>
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    <span>
                      <strong className="font-bold font-mono text-foreground">₹{lockedEscrowRupees.toLocaleString("en-IN")}</strong> locked in active shifts
                    </span>
                  </div>
                </>
              )}
            </div>

            <Link
              to="/employer/wallet"
              className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline group cursor-pointer self-start sm:self-center shrink-0"
            >
              <span>Manage Escrow & Payouts</span>
              <HiChevronRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        </section>

        {!isFacilityVerified && !loading && !resourceErrors.profile && (
          <section
            role="status"
            className={cn(
              "flex items-start gap-3 rounded-2xl border p-4 sm:p-5",
              isFacilityRejected ? "border-destructive/25 bg-destructive/5" : "border-primary/20 bg-primary/5",
            )}
          >
            <span className={cn("mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl", isFacilityRejected ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary")}>
              {isFacilityRejected ? <HiOutlineShieldCheck className="h-5 w-5" /> : <HiOutlineClock className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-foreground">
                {isFacilityRejected ? "Action needed: facility verification" : "Complete your facility profile and request verification"}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {isFacilityRejected
                  ? apiProfile?.kycNotes || "Review the note below, update the requested facility details or document, and submit it again for review."
                  : "Add your state clinical registration number and upload the matching registration or licence certificate. GST is optional. The FALE team will review your submission and update the status here."}
              </p>
              <Link to="/employer/profile" className="mt-2 inline-flex text-xs font-bold text-primary hover:underline">{isFacilityRejected ? "Review requested updates" : "Complete facility profile and upload documents"}</Link>
            </div>
          </section>
        )}

        {/* Campus Overview Modal Dialog */}
        <Dialog open={isCampusModalOpen} onOpenChange={setIsCampusModalOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden border-border/80 bg-card rounded-3xl">
            <DialogHeader className="sr-only">
              <DialogTitle>{orgName} Campus Overview</DialogTitle>
            </DialogHeader>
            <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
              <FacilityImage
                src={campusPhotoUrl}
                alt={orgName}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-3.5 right-3.5">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white border border-white/20">
                  <span className="h-2 w-2 rounded-full bg-primary" />
                  <span>{isFacilityVerified ? "Verified institution" : isFacilityRejected ? "Verification needs attention" : facilityKycStatus === "UNAVAILABLE" ? "Status unavailable" : "Verification pending"}</span>
                </span>
              </div>
            </div>
            <div className="p-4 sm:p-5 bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-t border-border/60">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base font-bold text-foreground">{orgName}</h3>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[11px] font-bold text-primary">
                    {facilityTypeText}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                    <RiShieldCheckFill className="h-3.5 w-3.5 text-primary" />
                    {accreditationText}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {campusLocation}{bedInfo ? ` · ${bedInfo}` : ""}{apiProfile?.licenseNumber ? ` · Reg: ${apiProfile.licenseNumber}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button asChild size="sm" className="rounded-xl text-xs font-bold h-8 px-3.5 bg-primary text-primary-foreground hover:bg-primary-hover">
                  <Link to="/employer/profile">
                    Edit Profile
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCampusModalOpen(false)}
                  className="rounded-xl text-xs font-bold shrink-0 cursor-pointer h-8 px-3"
                >
                  Close Preview
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* 2. TOP TELEMETRY 4 KPI METRIC CARDS (FALE PROJECT COLORS)                 */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Permanent Openings */}
          <Link
            to="/employer/post"
            className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <HiOutlineBriefcase className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                    Job postings
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold px-2 py-0.5">
                  {jobsUnavailable ? "Updating" : `${activeJobsCount} active`}
                </span>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground leading-none">
                  {jobsUnavailable ? "—" : allJobs.length}
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                  {jobsUnavailable ? "Postings unavailable" : `${allJobs.length} total requisitions`}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="text-primary font-semibold flex items-center gap-1">
                <HiOutlineArrowTrendingUp className="h-3.5 w-3.5" />
                {jobsUnavailable ? "Retry to refresh postings" : `${inVerificationJobsCount} awaiting review`}
              </span>
              <HiArrowRight className="h-3 w-3 shrink-0 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 2: On-Demand Shifts */}
          <Link
            to="/employer/post-shift"
            className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <HiOutlineBolt className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                    All-time slot fill rate
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold px-2 py-0.5">
                  {shiftsUnavailable ? "Updating" : `${liveBroadcastsCount} open`}
                </span>
              </div>

              <div className="mt-2.5">
                <div className={cn(
                  "font-black tracking-tight text-foreground leading-none",
                  shiftsUnavailable || totalShiftSlots === 0 ? "text-sm sm:text-base" : "text-2xl sm:text-3xl font-mono",
                )}>
                  {shiftsUnavailable ? "Unavailable" : totalShiftSlots === 0 ? "No shifts posted yet" : `${locumFillRate}%`}
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                  {shiftsUnavailable ? "Retry to refresh shift activity" : totalShiftSlots > 0 ? `${claimedShiftSlots} of ${totalShiftSlots} slots claimed` : "Post a shift to track bookings"}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="text-primary font-semibold truncate flex items-center gap-1.5">
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  liveBroadcastsCount > 0 ? "bg-primary animate-pulse" : "bg-muted-foreground/50"
                )} />
                <span>{shiftsUnavailable ? "Retry to refresh shifts" : `${liveBroadcastsCount} open broadcasts`}</span>
              </span>
              <HiArrowRight className="h-3 w-3 shrink-0 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 3: Applicant Pipeline */}
          <Link
            to="/employer/applicants"
            className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <HiOutlineDocumentCheck className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                    Pipeline
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold px-2 py-0.5">
                  {!isFacilityVerified ? "Verification required" : applicantsUnavailable ? "Updating" : `${shortlistedApplicants.length} shortlisted`}
                </span>
              </div>

              <div className="mt-2.5">
                <div className={cn(
                  "font-black tracking-tight text-foreground leading-none",
                  !isFacilityVerified || applicantsUnavailable ? "text-sm sm:text-base" : "text-2xl sm:text-3xl font-mono",
                )}>
                  {!isFacilityVerified ? "Verify your facility" : applicantsUnavailable ? "Unavailable" : pipelineApplicants.length}
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                  {!isFacilityVerified ? "Candidate profiles unlock after approval" : applicantsUnavailable ? "Applicant data unavailable" : "active job applicants"}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="text-primary font-semibold truncate flex items-center gap-1">
                <HiOutlineCheckBadge className="h-3.5 w-3.5" />
                {!isFacilityVerified || applicantsUnavailable ? "Applicant verification unavailable" : `${councilVerifiedCount} council verified`}
              </span>
              <HiArrowRight className="h-3 w-3 shrink-0 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Card 4: Escrow Protection */}
          <Link
            to="/employer/wallet"
            className="group rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs hover:border-primary/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <HiOutlineShieldCheck className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                    Escrow Protection
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold px-2 py-0.5">
                  {walletUnavailable ? "Updating" : apiWallet?.lockedEscrowBalancePaise && apiWallet.lockedEscrowBalancePaise > 0
                    ? "Escrow Locked"
                    : "No active escrow"}
                </span>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground leading-none">
                  {walletUnavailable ? "—" : formattedEscrow}
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                  {walletUnavailable ? "Wallet data unavailable" : apiWallet?.lockedEscrowBalancePaise && apiWallet.lockedEscrowBalancePaise > 0
                    ? "locked in shift escrow"
                    : "available wallet balance"}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="text-primary font-semibold truncate">
                {walletUnavailable ? "Retry to refresh wallet" : apiWallet?.lockedEscrowBalancePaise && apiWallet.lockedEscrowBalancePaise > 0
                  ? `₹${paiseToRupees(apiWallet.availableBalancePaise).toLocaleString("en-IN")} Available`
                  : "View wallet activity"}
              </span>
              <HiArrowRight className="h-3 w-3 shrink-0 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </section>

        {/* ========================================================================= */}
        {/* 2.5 EXECUTIVE WORKFORCE INTELLIGENCE BRIEF (AI FEATURE #15)               */}
        {/* ========================================================================= */}
        <section className="rounded-3xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-card p-4 sm:p-5 shadow-2xs space-y-3.5 transition-all">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-xs">
                <BotMessageSquare className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-sm font-bold text-foreground">
                    Executive Workforce Intelligence Brief
                  </h3>
                  <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9.5px] font-bold text-primary">
                    Ally Director
                  </span>
                  {aiExecutiveBrief && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      Brief ready
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Review recent shift slot activity, recruitment progress, and wallet status.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
              <Button
                type="button"
                disabled={loadingAiBrief}
                onClick={handleGenerateAiBrief}
                className="bg-primary text-white text-xs font-bold shrink-0 hover:bg-primary/90 rounded-xl px-4 h-9 shadow-xs cursor-pointer inline-flex items-center gap-2"
              >
                {loadingAiBrief ? (
                  <>
                    <ButtonSpinner className="h-3.5 w-3.5 text-white" />
                    <span>Analyzing Operations with Ally...</span>
                  </>
                ) : (
                  <span>{aiExecutiveBrief ? "Regenerate Brief with Ally" : "Generate Brief with Ally"}</span>
                )}
              </Button>

              {aiExecutiveBrief && (
                <button
                  type="button"
                  onClick={() => setAiExecutiveBrief(null)}
                  title="Close intelligence brief"
                  className="h-9 w-9 rounded-xl border border-border/70 bg-card hover:bg-muted text-muted-foreground hover:text-foreground grid place-items-center transition-colors cursor-pointer shrink-0 text-xs font-bold"
                >
                  <span className="sr-only">Close Brief</span>
                  ✕
                </button>
              )}
            </div>
          </div>

          {aiExecutiveBrief && (
            <div className="relative rounded-2xl border border-border/80 bg-background/95 p-4 sm:p-5 shadow-xs animate-in fade-in duration-200">
              {/* Scrollable Container with Fixed Controlled Height */}
              <div className="max-h-40 sm:max-h-44 overflow-y-auto pr-3 space-y-2.5 text-xs sm:text-[13px] text-foreground/90 leading-relaxed whitespace-pre-line">
                {aiExecutiveBrief}
              </div>
              <div className="mt-2.5 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                  Scroll to read full analysis
                </span>
                <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/75 hidden sm:inline">
                  Powered by Ally Clinical Intelligence
                </span>
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* 3. DYNAMIC CHARTS (FALE BRAND COLORS: SAFFRON, CHARCOAL, SUCCESS GREEN)  */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Chart 1: Area Chart - Shift Demand & Locum Fulfillments (7 cols) */}
          <div className="lg:col-span-7 rounded-3xl border border-border/80 bg-card p-4 sm:p-6 shadow-2xs flex flex-col justify-between space-y-3 sm:space-y-4">
            <div className="border-b border-border/60 pb-3 space-y-2.5">
              {/* Row 1: Title (Full width, zero truncation) */}
              <div className="flex items-center gap-1.5 min-w-0">
                <HiOutlineArrowTrendingUp className="h-4 w-4 sm:h-4.5 sm:w-4.5 text-primary shrink-0" />
                <h3 className="text-sm font-bold text-foreground">
                  Locum Shift Demand &amp; Claim Rate
                </h3>
              </div>

              {/* Row 2: Legend on Left + '7 Days / 30 Days' Toggle on Right */}
              <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground text-[11px] sm:text-xs">
                    <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    <span>Broadcasted</span>
                  </span>
                  <span className="inline-flex items-center gap-1 font-semibold text-primary text-[11px] sm:text-xs">
                    <span className="h-2 w-2 rounded-full bg-primary/70 shrink-0" />
                    <span>Claimed</span>
                  </span>
                </div>

                <div className="flex items-center gap-0.5 bg-muted/60 p-0.5 rounded-xl border border-border/60 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAnalyticsTimeframe("7d")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                      analyticsTimeframe === "7d"
                        ? "bg-card text-foreground font-bold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    7 Days
                  </button>
                  <button
                    type="button"
                    onClick={() => setAnalyticsTimeframe("30d")}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                      analyticsTimeframe === "30d"
                        ? "bg-card text-foreground font-bold shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    30 Days
                  </button>
                </div>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-56 sm:h-64 w-full pt-1 sm:pt-2">
              {shiftsUnavailable ? (
                <div className="grid h-full place-items-center rounded-2xl bg-muted/20 px-5 text-center text-sm text-muted-foreground">Shift analytics are unavailable right now. Retry to load the latest data.</div>
              ) : totalBroadcastCount === 0 ? (
                <div className="grid h-full place-items-center rounded-2xl bg-muted/20 px-5 text-center text-sm text-muted-foreground">No scheduled shift slots in this date range.</div>
              ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 8, right: 10, left: 4, bottom: 0 }}>
                  <defs>
                    {/* Pure Radiant FALE Saffron Glow (Clean, bright, zero muddy brown blending) */}
                    <linearGradient id="gradientSaffron" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={BRAND_COLORS.saffron} stopOpacity={0.28} />
                      <stop offset="60%" stopColor={BRAND_COLORS.saffron} stopOpacity={0.08} />
                      <stop offset="95%" stopColor={BRAND_COLORS.saffron} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border) / 0.6)" />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    interval={0}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                    width={32}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="rounded-xl border border-border bg-card/95 backdrop-blur-md p-3 shadow-lg text-xs space-y-1.5 font-sans">
                            <span className="font-bold text-foreground block border-b border-border/60 pb-1">
                              {label}
                            </span>
                            <div className="flex items-center gap-2 text-primary font-semibold">
                              <span className="h-2 w-2 rounded-full bg-primary" />
                              <span>Posted: {payload[0]?.value} slots</span>
                            </div>
                            <div className="flex items-center gap-2 text-primary/80 font-semibold">
                              <span className="h-2 w-2 rounded-full bg-primary/70" />
                              <span>Claimed: {payload[1]?.value} slots</span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="broadcast"
                    stroke={BRAND_COLORS.saffron}
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#gradientSaffron)"
                  />
                  <Area
                    type="monotone"
                    dataKey="filled"
                    stroke={BRAND_COLORS.green}
                    strokeWidth={2.5}
                    fillOpacity={0}
                    fill="none"
                  />
                </AreaChart>
              </ResponsiveContainer>
              )}
            </div>

            {/* Bottom Summary Bar (Identical height, zero truncation or overflow) */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-3.5 border-t border-border/60 text-center items-stretch">
              <div className="py-2 px-1.5 sm:py-2.5 sm:px-3 rounded-xl sm:rounded-2xl bg-muted/40 border border-border/40 flex flex-col justify-center items-center min-w-0 h-full shadow-2xs">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground tracking-wider block truncate w-full">
                  <span className="sm:hidden">Posted</span>
                  <span className="hidden sm:inline">Broadcasted</span>
                </span>
                <div className="mt-1 flex items-baseline justify-center gap-1 font-mono leading-none">
                  <span className="text-sm sm:text-base font-black text-foreground">
                    {shiftsUnavailable ? "—" : totalBroadcastCount}
                  </span>
                  <span className="text-[10px] sm:text-xs font-sans font-medium text-muted-foreground">
                    Slots
                  </span>
                </div>
              </div>

              <div className="py-2 px-1.5 sm:py-2.5 sm:px-3 rounded-xl sm:rounded-2xl bg-primary/5 border border-primary/15 flex flex-col justify-center items-center min-w-0 h-full shadow-2xs">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-primary tracking-wider block truncate w-full">
                  Claimed rate
                </span>
                <div className="mt-1 flex items-baseline justify-center font-mono leading-none">
                  <span className="text-sm sm:text-base font-black text-primary">
                    {shiftsUnavailable ? "—" : totalBroadcastCount ? dynamicFulfillmentRate : "—"}
                  </span>
                </div>
              </div>

              <div className="py-2 px-1.5 sm:py-2.5 sm:px-3 rounded-xl sm:rounded-2xl bg-muted/40 border border-border/40 flex flex-col justify-center items-center min-w-0 h-full shadow-2xs">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground tracking-wider block truncate w-full">
                  <span className="sm:hidden">Hours</span>
                  <span className="hidden sm:inline">Duty Hours</span>
                </span>
                <div className="mt-1 flex items-baseline justify-center gap-1 font-mono leading-none">
                  <span className="text-sm sm:text-base font-black text-foreground">
                    {shiftsUnavailable ? "—" : totalCoveredHours.toLocaleString()}
                  </span>
                  <span className="text-[10px] sm:text-xs font-sans font-medium text-muted-foreground">
                    hrs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2: Candidate Pipeline Donut Chart (FALE Brand Colors) (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="flex items-start sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <HiOutlineDocumentCheck className="h-4.5 w-4.5 text-primary shrink-0" />
                  <span className="truncate">Candidate Pipeline</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Active job applications by recruitment stage
                </p>
              </div>
              <span className="shrink-0 whitespace-nowrap text-[10.5px] sm:text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full self-start sm:self-center">
                {!isFacilityVerified || applicantsUnavailable ? "Unavailable" : `${pipelineApplicants.length} active`}
              </span>
            </div>

            {/* Recharts Pie Chart / Donut */}
            <div className="relative h-56 w-full flex items-center justify-center my-auto py-1">
              {!isFacilityVerified ? (
                <p className="px-4 text-center text-sm text-muted-foreground">Candidate pipeline appears after facility verification.</p>
              ) : applicantsUnavailable ? (
                <p className="px-4 text-center text-sm text-muted-foreground">Applicant data is unavailable. Use Retry above to refresh.</p>
              ) : pipelineApplicants.length === 0 ? (
                <p className="px-4 text-center text-sm text-muted-foreground">No job applications yet. Applications will appear here when candidates apply.</p>
              ) : (
              <>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieRenderData}
                    cx="50%"
                    cy="50%"
                    innerRadius={66}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                    onMouseLeave={() => setActivePieIndex(null)}
                  >
                    {pieRenderData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="hsl(var(--card))"
                        strokeWidth={2}
                        className="transition-all duration-300 cursor-pointer"
                        style={{
                          transform: activePieIndex === index ? "scale(1.04)" : "scale(1)",
                          transformOrigin: "center center",
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Stat with Generous Breathing Room */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center">
                <span className="text-[9.5px] text-muted-foreground uppercase font-bold tracking-wider leading-none">
                  Pipeline
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight my-1 leading-none">
                  {pipelineApplicants.length}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary leading-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {councilVerifiedCount} council verified
                </span>
              </div>
              </>
              )}
            </div>

            {/* Pipeline legend only appears when there is data to break down. */}
            {isFacilityVerified && !applicantsUnavailable && pipelineApplicants.length > 0 ? (
            <div className="space-y-1 pt-2 border-t border-border/50">
              {dynamicCandidatePipelineData.map((d, index) => (
                <div
                  key={d.name}
                  onMouseEnter={() => setActivePieIndex(index)}
                  onMouseLeave={() => setActivePieIndex(null)}
                  className={cn(
                    "flex items-center justify-between text-xs py-1.5 px-2 rounded-xl transition-all cursor-pointer",
                    activePieIndex === index ? "bg-primary/10" : "hover:bg-muted/40"
                  )}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0 transition-transform"
                      style={{
                        backgroundColor: d.color,
                        transform: activePieIndex === index ? "scale(1.25)" : "scale(1)",
                      }}
                    />
                    <span
                      className={cn(
                        "truncate transition-colors",
                        activePieIndex === index ? "text-foreground font-semibold" : "text-muted-foreground font-medium"
                      )}
                    >
                      {d.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0 font-mono">
                    <span className="w-9 text-right font-bold text-foreground tabular-nums">
                      {d.value}%
                    </span>
                    <span className="w-24 text-right text-[11px] text-muted-foreground tabular-nums">
                      ({d.count})
                    </span>
                  </div>
                </div>
              ))}
            </div>
            ) : (
              <p className="border-t border-border/50 pt-3 text-center text-xs text-muted-foreground">
                {isFacilityVerified ? applicantsUnavailable ? "Stage breakdown unavailable." : "Stage breakdown appears when applications arrive." : "Verify your facility to unlock applicant insights."}
              </p>
            )}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. MAIN OPERATIONAL REQUISITIONS & SHIFT BOARD (NECESSARY ONLY)          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12">
          {/* Main Feed Column (8 cols) */}
          <div className="flex min-w-0 flex-col gap-4 lg:col-span-8">
            {/* Search and Tabs Bar */}
            <div className="space-y-3">
              <div className="relative w-full">
                <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search requirements, departments (ICU, OT, Trauma) or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border/70 bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs transition-all"
                />
              </div>

              <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/60 overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setActiveTab("postings")}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap",
                    activeTab === "postings"
                      ? "bg-card text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <HiOutlineBriefcase className="h-3.5 w-3.5 shrink-0" />
                  <span>Clinical Postings ({filteredJobs.length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("shifts")}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap",
                    activeTab === "shifts"
                      ? "bg-card text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <HiOutlineBolt className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span>Locum Board ({activeShifts.length})</span>
                </button>

              </div>
            </div>

            {/* TAB 1: Clinical Postings */}
            {activeTab === "postings" && (
              <div className="flex flex-1 flex-col gap-3.5">
                {filteredJobs.length === 0 ? (
                  <div className="relative flex min-h-[360px] flex-1 flex-col items-center justify-center overflow-hidden rounded-3xl border border-dashed border-border/80 bg-card/80 p-6 text-center shadow-xs backdrop-blur-xs animate-in fade-in zoom-in-95 duration-300 sm:p-10">
                    {/* Saffron ambient brand glow */}
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#FF5A1F]/10 dark:bg-[#FF5A1F]/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
                      <EmptyEarningsGraphic className="w-36 h-36 sm:w-44 sm:h-44 mb-3" />

                      <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                        {jobsUnavailable ? loading ? "Loading job postings" : "Job postings unavailable" : searchQuery ? "No matching postings found" : isFacilityVerified ? "No clinical postings published yet" : "Verify your facility to publish jobs"}
                      </h3>

                      <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                        {jobsUnavailable
                          ? "We couldn't load your postings. Retry from the dashboard notice above."
                          : searchQuery
                          ? `We couldn't find any openings matching "${searchQuery}". Try adjusting your keywords or clearing the search.`
                          : isFacilityVerified
                            ? "Create and publish permanent roles, clinical fellowships, or consultant vacancies to attract healthcare practitioners."
                            : "Complete facility verification first. Once approved, you can publish roles and review applicants."}
                      </p>

                      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                        {searchQuery ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSearchQuery("")}
                            className="rounded-xl font-bold text-xs h-9 px-4 gap-2 cursor-pointer"
                          >
                            <HiOutlineArrowPath className="h-4 w-4" />
                            <span>Clear Search</span>
                          </Button>
                        ) : null}
                        {jobsUnavailable ? null : !isFacilityVerified ? (
                          <Button size="sm" asChild className="rounded-xl font-bold text-xs h-9 px-4 bg-primary hover:bg-primary/90 text-white gap-2 shadow-none cursor-pointer">
                            <Link to="/employer/profile">Complete verification</Link>
                          </Button>
                        ) : <Button
                          size="sm"
                          asChild
                          className="rounded-xl font-bold text-xs h-9 px-4 bg-primary hover:bg-primary/90 text-white gap-2 shadow-none cursor-pointer"
                        >
                          <Link to="/employer/post">
                            <HiPlus className="h-4 w-4" />
                            <span>Post Clinical Vacancy</span>
                          </Link>
                        </Button>}
                      </div>
                    </div>
                  </div>
                ) : (
                  filteredJobs.map((job) => (
                    <div
                      key={job.id}
                      className="rounded-2xl border border-border/70 bg-card p-4.5 sm:p-5 shadow-xs hover:border-primary/40 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                            <HiOutlineBuildingOffice2 className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-muted-foreground truncate">{job.dept}</p>
                            <h4 className="text-sm sm:text-base font-bold text-foreground truncate">{job.title}</h4>
                          </div>
                        </div>
                        <StatusBadge status={job.status} />
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{job.openings} Openings</span>
                          <span>•</span>
                          <span>{city}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground font-semibold hover:bg-muted/60">
                            <Link to="/employer/postings">Manage</Link>
                          </Button>
                          <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary font-bold hover:bg-primary-soft">
                            <Link to="/employer/applicants">View candidates →</Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: Locum Shifts */}
            {activeTab === "shifts" && (
              <div className="space-y-3">
                {shiftsUnavailable || activeShifts.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-border/80 bg-card/80 backdrop-blur-xs p-6 sm:p-10 text-center animate-in fade-in zoom-in-95 duration-300 relative overflow-hidden shadow-xs">
                    <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-80 h-80 bg-[#FF5A1F]/10 dark:bg-[#FF5A1F]/15 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute -bottom-16 right-10 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-lg mx-auto flex flex-col items-center">
                      <EmptyEarningsGraphic className="w-36 h-36 sm:w-44 sm:h-44 mb-3" />

                      <h3 className="text-lg sm:text-xl font-bold text-foreground tracking-tight">
                        {shiftsUnavailable ? loading ? "Loading shift activity" : "Shift data unavailable" : isFacilityVerified ? "No active locum duty shifts" : "Verify your facility to post shifts"}
                      </h3>

                      <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
                        {shiftsUnavailable ? "Shift activity couldn't be loaded. Retry from the dashboard notice above." : isFacilityVerified ? "Post urgent coverage needs and manage clinician responses from this dashboard." : "Complete facility verification before posting shifts. Approved facilities can then reach eligible clinicians."}
                      </p>

                      <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5 sm:gap-3">
                        {!shiftsUnavailable && <Button
                          size="sm"
                          asChild
                          className="rounded-xl font-bold text-xs h-9 px-4 bg-primary hover:bg-primary/90 text-white gap-2 shadow-none cursor-pointer"
                        >
                          <Link to={isFacilityVerified ? "/employer/post-shift" : "/employer/profile"}>
                            <HiOutlineBolt className="h-4 w-4" />
                            <span>{isFacilityVerified ? "Post a shift" : "Complete verification"}</span>
                          </Link>
                        </Button>}
                      </div>
                    </div>
                  </div>
                ) : (
                  activeShifts.map((sh) => (
                    <div
                      key={sh.id}
                      className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs hover:border-primary/40 transition-all space-y-2.5"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                            sh.status === "PENDING_APPROVAL"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : sh.status === "OPEN"
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : sh.status === "FILLED"
                              ? "bg-primary/5 text-primary border border-primary/15"
                              : "bg-muted text-muted-foreground"
                          )}>
                            <span className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              sh.status === "PENDING_APPROVAL" ? "bg-primary" : "bg-primary/70 animate-pulse"
                            )} />
                            {sh.status === "PENDING_APPROVAL"
                              ? "Awaiting Admin Verification"
                              : sh.status === "OPEN"
                              ? "Live Broadcast"
                              : sh.status === "FILLED"
                              ? "Clinician Assigned"
                              : sh.status}
                          </span>
                          <h4 className="mt-1 text-sm font-bold text-foreground">{sh.title}</h4>
                          <p className="text-xs text-muted-foreground">{sh.dept} • {sh.date} • {sh.slotsClaimed}/{sh.slots} Slots Booked</p>
                        </div>
                        <span className="text-sm font-black font-mono text-primary">₹{sh.rate}/hr</span>
                      </div>

                      <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                        <span className="text-muted-foreground font-medium text-[11px] flex items-center gap-1">
                          <HiOutlineShieldCheck className="h-3.5 w-3.5 text-primary" /> Escrow details in shift
                        </span>
                        <Button asChild variant="outline" size="sm" className="h-7 text-xs rounded-lg font-bold">
                          {Number((sh as any).slotsClaimed || 0) > 0 ? (
                            <Link to="/employer/applicants">Review Claimed ({(sh as any).slotsClaimed})</Link>
                          ) : (
                            <Link to="/employer/postings">Manage Shift</Link>
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

          </div>
          {/* Right Rail: Hospital Readiness & Hotline (4 cols) */}
          <div className="lg:col-span-4 space-y-4 min-w-0">
            <section className="rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-xs" aria-labelledby="facility-offers-title">
              <div className="flex items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><HiOutlineBolt className="h-4.5 w-4.5" /></span>
                <div className="min-w-0">
                  <h3 id="facility-offers-title" className="text-sm font-bold text-foreground">Your facility offers</h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Keep track of the complimentary launch benefits available to your facility.</p>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                <div className="flex items-start justify-between gap-3 border-t border-primary/10 pt-3">
                  <div><p className="text-xs font-semibold text-foreground">Candidate contact unlocks</p><p className="mt-0.5 text-[11px] text-muted-foreground">Complimentary welcome credits</p></div>
                  <span className="shrink-0 text-right text-xs font-bold text-primary">{apiWallet?.welcomeCreditsGranted ? `${apiWallet.candidateCredits} remaining` : resourceErrors.wallet ? "Unavailable" : apiWallet ? "No welcome credits" : "Loading"}</span>
                </div>
                <div className="flex items-start justify-between gap-3 border-t border-primary/10 pt-3">
                  <div><p className="text-xs font-semibold text-foreground">First qualifying hire</p><p className="mt-0.5 text-[11px] text-muted-foreground">Placement fee waiver</p></div>
                  <span className="shrink-0 text-right text-xs font-bold text-primary">{apiProfile?.firstHireFreeAvailable ? "Available" : resourceErrors.profile ? "Unavailable" : apiProfile ? "Used" : "Loading"}</span>
                </div>
                <div className="flex items-start justify-between gap-3 border-t border-primary/10 pt-3">
                  <div><p className="text-xs font-semibold text-foreground">First completed shift</p><p className="mt-0.5 text-[11px] text-muted-foreground">The Fale service fee waived</p></div>
                  <span className="shrink-0 text-right text-xs font-bold text-primary">{shiftPolicy?.firstShiftFeeWaived ? "Available" : resourceErrors.shiftPolicy ? "Unavailable" : shiftPolicy ? "Used" : "Loading"}</span>
                </div>
              </div>
              <p className="mt-4 border-t border-primary/10 pt-3 text-[11px] leading-relaxed text-muted-foreground">Candidate compensation, shift wages, applicable taxes, and any additional paid contact unlocks still apply.</p>
            </section>
            {/* Verified Clinical Hiring Desk */}
            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <HiOutlineCheckBadge className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Candidate hiring access</h4>
                    <p className="text-[10px] text-muted-foreground">{isFacilityVerified ? "Review applicant credentials and hiring progress." : "Candidate access opens after facility verification."}</p>
                  </div>
                </div>
                <span className="rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-extrabold px-2 py-0.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {isFacilityVerified ? "Verified" : isFacilityRejected ? "Action needed" : "Locked"}
                </span>
              </div>

              <div className="rounded-2xl bg-muted/40 p-3.5 space-y-2.5 border border-border/50 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-medium">Postings in Verification</span>
                  <span className="font-bold font-mono text-primary">
                    {jobsUnavailable ? "—" : `${inVerificationJobsCount} under review`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-medium">Active Vacancies</span>
                  <span className="font-bold font-mono text-primary">
                    {jobsUnavailable ? "—" : `${activeJobsCount} published`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-medium">Shortlisted Clinicians</span>
                  <span className="font-bold font-mono text-primary font-bold">
                    {!isFacilityVerified || applicantsUnavailable ? "—" : `${shortlistedApplicants.length} shortlisted`}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px]">Qualified Candidates</span>
                <Link to={isFacilityVerified ? "/employer/applicants" : "/employer/profile"} className="font-bold text-primary hover:underline text-xs">
                  {isFacilityVerified ? "View applicants" : "Complete verification"} &rarr;
                </Link>
              </div>
            </div>

            {/* Facility support */}
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <HiOutlineQuestionMarkCircle className="h-4 w-4" />
                  <span>Facility support</span>
                </span>
                <span className="rounded-full bg-primary/10 text-primary text-[10px] font-bold px-2 py-0.5">
                  Support
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Need help with verification, hiring, or payments? Contact the support team.
              </p>
              <div className="pt-1 flex items-center justify-end text-xs font-mono font-bold">
                <Link to="/support" className="text-primary hover:underline text-[11px]">
                  Help Desk →
                </Link>
              </div>
            </div>
            <div className="rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
              <div className="flex items-start justify-between gap-3">
                <div><h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><HiOutlineBuildingOffice2 className="h-4 w-4 text-primary" /> Hospital profile</h3><p className="mt-1 text-xs text-muted-foreground">Facility details and verification readiness.</p></div>
              <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{facilityKycStatus === "VERIFIED" ? "Verified" : facilityKycStatus === "REJECTED" ? "Needs attention" : facilityKycStatus === "LOADING" ? "Loading" : facilityKycStatus === "UNAVAILABLE" ? "Unavailable" : "Pending"}</span>
              </div>
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Facility type</span><span className="text-right font-semibold text-foreground">{resourceErrors.profile ? "Unavailable" : apiProfile?.facilityType || "Not added"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Location</span><span className="text-right font-semibold text-foreground">{resourceErrors.profile ? "Unavailable" : [apiProfile?.area, apiProfile?.city, apiProfile?.state].filter(Boolean).join(", ") || "Not added"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Capacity</span><span className="text-right font-semibold text-foreground">{bedCount ? `${bedCount} beds${icuCount ? ` · ${icuCount} ICU` : ""}` : "Not added"}</span></div>
                <div className="flex justify-between gap-3"><span className="text-muted-foreground">Departments</span><span className="text-right font-semibold text-foreground">{resourceErrors.profile ? "Unavailable" : apiProfile?.departments?.length ? apiProfile.departments.length : "Not added"}</span></div>
              </div>
              <Link to="/employer/profile" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Review facility profile<HiArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          </div>
        </div>
        <section className="mt-6 grid grid-cols-1 items-stretch gap-4 xl:grid-cols-2">
          <div className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><HiOutlineUsers className="h-4 w-4 text-primary" /> Candidate pipeline</h3>
                <p className="mt-1 text-xs text-muted-foreground">Applicants and clinicians matched to your facility.</p>
              </div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-foreground">{!isFacilityVerified ? "Verify first" : applicantsUnavailable ? "Unavailable" : pipelineApplicants.length}</span>
            </div>
            {!isFacilityVerified ? (
              <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">Candidate profiles are available after facility verification. <Link className="font-bold text-primary underline" to="/employer/profile">Complete verification</Link></p>
            ) : applicantsUnavailable ? (
              <p className="mt-4 rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">Applicant data could not be loaded. Retry to check for updates.</p>
            ) : pipelineApplicants.length ? (
              <div className="mt-4 space-y-2">
                {pipelineApplicants.slice(0, 3).map((a: any) => (
                  <div key={a.id} className="flex items-center justify-between gap-2 rounded-xl bg-muted/30 p-3">
                    <div className="min-w-0"><p className="truncate text-sm font-semibold text-foreground">{a.candidateName || a.name || "Candidate"}</p><p className="truncate text-xs text-muted-foreground">{a.jobTitle || a.role || "Healthcare role"}</p></div>
                    <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">{formatApplicationStatus(a.status)}</span>
                  </div>
                ))}
              </div>
            ) : <p className="mt-4 rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">No job applicants yet. Candidates will appear here when they apply.</p>}
            <Link to={isFacilityVerified ? "/employer/applicants" : "/employer/profile"} className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-bold text-primary hover:underline">{isFacilityVerified ? "Open candidate workbench" : "View verification steps"}<HiArrowRight className="h-3.5 w-3.5" /></Link>
          </div>

          <div className="flex h-full flex-col rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><HiOutlineCalendarDays className="h-4 w-4 text-primary" /> Interviews & offers</h3><p className="mt-1 text-xs text-muted-foreground">Track candidates progressing through hiring.</p></div>
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-foreground">{!isFacilityVerified ? "Verify first" : applicantsUnavailable ? "Unavailable" : interviewApplicants.length + offerApplicants.length}</span>
            </div>
            {!isFacilityVerified ? (
              <p className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground">Interview and offer actions unlock after facility verification.</p>
            ) : applicantsUnavailable ? (
              <p className="mt-4 rounded-xl bg-muted/30 p-3 text-xs text-muted-foreground">Hiring progress is unavailable. Retry to refresh applicants.</p>
            ) : (
              <div className="mt-4 space-y-3">
                {[{ title: "Interviews", items: interviewApplicants }, { title: "Offers and hires", items: offerApplicants }].map((group) => (
                  <div key={group.title} className="rounded-xl bg-muted/30 p-3"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-foreground">{group.title}</span><span className="text-xs font-bold text-primary">{group.items.length}</span></div><p className="mt-1 text-[11px] text-muted-foreground">{group.items.slice(0, 2).map((a: any) => a.candidateName || a.name || "Candidate").join(", ") || `No ${group.title.toLowerCase()} yet`}</p></div>
                ))}
              </div>
            )}
            <Link to={isFacilityVerified ? "/employer/applicants" : "/employer/profile"} className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-bold text-primary hover:underline">{isFacilityVerified ? "Manage hiring pipeline" : "View verification steps"}<HiArrowRight className="h-3.5 w-3.5" /></Link>
          </div>

        </section>
        <section className="mt-4 rounded-3xl border border-border/70 bg-card p-5 shadow-xs">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-foreground"><HiOutlineCalendarDays className="h-4 w-4 text-primary" /> Upcoming interviews</h3>
              <p className="mt-1 text-xs text-muted-foreground">Your interview schedule, candidate details, and calendar actions.</p>
            </div>
            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{!isFacilityVerified || applicantsUnavailable ? "Unavailable" : `${upcomingInterviews.length} scheduled`}</span>
          </div>
          {!isFacilityVerified ? (
            <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
              <p>Interview scheduling and candidate details will be available after facility verification.</p>
              <Link to="/employer/profile" className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline">Complete verification<HiArrowRight className="h-3.5 w-3.5" /></Link>
            </div>
          ) : applicantsUnavailable ? (
            <div className="mt-4 rounded-2xl bg-muted/30 p-4 text-sm text-muted-foreground">Interview data is unavailable. Retry to load your latest schedule.</div>
          ) : upcomingInterviews.length ? (
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {upcomingInterviews.map((app: any) => (
                <article key={app.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><HiOutlineCalendarDays className="h-5 w-5" /></div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-foreground">{app.candidateName || app.name || "Candidate"}</p>
                      <p className="truncate text-xs text-muted-foreground">{app.jobTitle || app.role || "Healthcare role"}</p>
                      <p className="mt-1 text-xs font-semibold text-primary">{new Date(app.interviewScheduledAt).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}</p>
                      <p className="mt-1 text-[11px] text-muted-foreground">Calendar invite duration: {Number(app.interviewDurationMinutes) > 0 ? Number(app.interviewDurationMinutes) : 30} minutes</p>
                      {app.interviewLocationOrLink && <p className="mt-1 break-all text-[11px] text-muted-foreground">{app.interviewLocationOrLink}</p>}
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs" onClick={() => addInterviewToCalendar(app)}>Download calendar invite</Button>
                </article>
              ))}
            </div>
          ) : (
            <div className="mt-4 flex flex-col items-start justify-between gap-3 rounded-2xl bg-muted/30 p-4 sm:flex-row sm:items-center">
              <div><p className="text-sm font-semibold text-foreground">No upcoming interviews scheduled</p><p className="mt-1 text-xs text-muted-foreground">Schedule an interview from the candidate workbench and it will appear here.</p></div>
              <Button asChild size="sm" variant="outline" className="rounded-xl text-xs"><Link to="/employer/applicants">Open candidates</Link></Button>
            </div>
          )}
        </section>
      </div>
    </AppShell>
  );
}
