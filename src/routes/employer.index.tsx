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
  HiOutlinePhone,
  HiOutlineMagnifyingGlass,
  HiOutlineBanknotes,
  HiOutlineArrowTrendingUp,
  HiOutlineChartPie,
  HiOutlineShieldCheck,
  HiOutlineQuestionMarkCircle,
} from "react-icons/hi2";
import { RiVerifiedBadgeFill, RiShieldCheckFill } from "react-icons/ri";
import { toast } from "sonner";
import { AppShell, StatusBadge, initials } from "@/components/fale/AppShell";
import { OrgMark } from "@/components/fale/JobCard";
import { Button } from "@/components/ui/button";
import { applicants, shifts, jobs } from "@/lib/data";
import { useApp } from "@/lib/store";
import facilityMultispecialtyImg from "@/assets/facilities/facility-multispecialty.jpg";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { isApiEnabled, paiseToRupees } from "@/lib/api";
import {
  getFacilityJobs,
  getFacilityApplicants,
  getFacilityWallet,
  getFacilityProfile,
  type FacilityProfileDto,
  type FacilityWalletDto,
} from "@/lib/adapters/facilityAdapter";
import { getFacilityShifts, type UiShiftItem } from "@/lib/adapters/shiftAdapter";
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
  green: "#1A8633",
  amber: "#F59E0B",
  slate: "#8A8A8A",
};

// Analytics Data: Locum Shifts
const shiftFulfillmentData7d = [
  { period: "Mon", broadcast: 14, filled: 13, hours: 156 },
  { period: "Tue", broadcast: 18, filled: 18, hours: 216 },
  { period: "Wed", broadcast: 22, filled: 21, hours: 252 },
  { period: "Thu", broadcast: 16, filled: 15, hours: 180 },
  { period: "Fri", broadcast: 25, filled: 24, hours: 288 },
  { period: "Sat", broadcast: 30, filled: 29, hours: 348 },
  { period: "Sun", broadcast: 28, filled: 27, hours: 324 },
];

const shiftFulfillmentData30d = [
  { period: "W1", broadcast: 110, filled: 106, hours: 1272 },
  { period: "W2", broadcast: 135, filled: 131, hours: 1572 },
  { period: "W3", broadcast: 148, filled: 144, hours: 1728 },
  { period: "W4", broadcast: 162, filled: 157, hours: 1884 },
];

// Candidate Pipeline Stages (FALE Recruitment Funnel)
const candidatePipelineData = [
  { name: "Shortlisted", value: 40, count: "12 Candidates", color: "#FF5A1F" },
  { name: "Interview Scheduled", value: 30, count: "9 Candidates", color: "#E04812" },
  { name: "Offers Extended", value: 18, count: "5 Candidates", color: "#FF7E45" },
  { name: "Under Screening", value: 12, count: "4 Candidates", color: "#FFA47A" },
];

function EmployerDashboard() {
  const s = useApp();
  const [analyticsTimeframe, setAnalyticsTimeframe] = useState<"7d" | "30d">("7d");
  const [activeTab, setActiveTab] = useState<"postings" | "shifts" | "applicants">("postings");
  const [searchQuery, setSearchQuery] = useState("");
  const [activePieIndex, setActivePieIndex] = useState<number | null>(null);
  const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);

  // Dynamic API state
  const [apiJobs, setApiJobs] = useState<JobPostingDto[]>([]);
  const [apiShifts, setApiShifts] = useState<UiShiftItem[]>([]);
  const [apiApplicants, setApiApplicants] = useState<any[]>([]);
  const [apiWallet, setApiWallet] = useState<FacilityWalletDto | null>(null);
  const [apiProfile, setApiProfile] = useState<FacilityProfileDto | null>(null);
  const [loading, setLoading] = useState(isApiEnabled);

  useEffect(() => {
    if (!isApiEnabled) return;
    setLoading(true);
    Promise.all([
      getFacilityJobs().catch(() => []),
      getFacilityShifts().catch(() => []),
      getFacilityApplicants().catch(() => []),
      getFacilityWallet().catch(() => null),
      getFacilityProfile().catch(() => null),
    ])
      .then(([fJobs, fShifts, fApps, fWallet, fProfile]) => {
        setApiJobs(fJobs);
        setApiShifts(fShifts);
        setApiApplicants(fApps);
        setApiWallet(fWallet);
        setApiProfile(fProfile);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const orgName = isApiEnabled
    ? apiProfile?.hospitalName || "Healthcare Facility"
    : String(s.profile["org"] || "Apollo Hospitals — Main Campus");
  const rawCity = isApiEnabled
    ? apiProfile?.city || "Chennai"
    : String(s.profile["city"] || "Chennai");
  const city = /[\u0900-\u0D7F]/.test(rawCity) ? "Chennai" : rawCity;

  const campusLocation = useMemo(() => {
    if (apiProfile?.addressLine) {
      return `${apiProfile.addressLine}, ${city}`;
    }
    if (apiProfile?.address) {
      return `${apiProfile.address}, ${city}`;
    }
    if (apiProfile?.state) {
      return `${city}, ${apiProfile.state}`;
    }
    return city;
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
    if (!level) return "NABH Accredited";
    return level.toUpperCase().includes("NABH") ? level : `NABH ${level}`;
  }, [apiProfile?.accreditationLevel]);

  const facilityTypeText = useMemo(() => {
    if (apiProfile?.facilityType) return apiProfile.facilityType;
    if (apiProfile?.size) return `${apiProfile.size} Center`;
    return "Hospital";
  }, [apiProfile?.facilityType, apiProfile?.size]);

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
  const escrowBalance = isApiEnabled
    ? paiseToRupees(escrowReservedPaise)
    : s.escrowBalance || 185000;

  const formattedEscrow =
    escrowBalance >= 100000
      ? `₹${(escrowBalance / 1000).toFixed(0)}k`
      : escrowBalance > 0
        ? `₹${escrowBalance.toLocaleString("en-IN")}`
        : "₹0";

  // Effective applicants list
  const effectiveApplicants = isApiEnabled ? apiApplicants : applicants;

  // Filtered jobs
  const allJobs = useMemo(() => {
    return isApiEnabled
      ? apiJobs.map((j) => ({
          id: j.id,
          title: j.title,
          dept: j.department || "General Medicine",
          city: j.city || "Chennai",
          status: j.status || "OPEN",
          exp: j.experienceRequired || "1-3 Years",
          type: j.isInternship ? "Internship" : "Full-time",
          openings: j.openings || 1,
        }))
      : s.postedJobs;
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

  const activeShifts = isApiEnabled
    ? apiShifts
    : (s.postedShifts && s.postedShifts.length > 0 ? s.postedShifts : shifts.slice(0, 4));

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

  // Filter out rejected and cancelled shifts for active operational metrics
  const validShifts = useMemo(() => {
    return activeShifts.filter((sh) => {
      const st = (sh.status || "").toUpperCase();
      return st !== "CANCELLED" && st !== "REJECTED";
    });
  }, [activeShifts]);

  const totalShiftSlots = useMemo(() => {
    return validShifts.reduce((acc, sh) => acc + (sh.slots || 1), 0);
  }, [validShifts]);

  const claimedShiftSlots = useMemo(() => {
    return validShifts.reduce((acc, sh) => acc + (sh.slotsClaimed || 0), 0);
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
      return st === "SHORTLISTED" || st === "INTERVIEW_SCHEDULED";
    });
  }, [effectiveApplicants]);

  const councilVerifiedCount = useMemo(() => {
    return effectiveApplicants.filter((a: any) => a.councilVerified !== false).length;
  }, [effectiveApplicants]);

  // Dynamic Candidate Pipeline Funnel Data
  const dynamicCandidatePipelineData = useMemo(() => {
    const total = effectiveApplicants.length;
    if (total === 0) {
      return [
        { name: "Shortlisted", value: 0, count: "0 Candidates", color: "#FF5A1F" },
        { name: "Interview Scheduled", value: 0, count: "0 Candidates", color: "#E04812" },
        { name: "Offers Extended", value: 0, count: "0 Candidates", color: "#FF7E45" },
        { name: "Under Screening", value: 0, count: "0 Candidates", color: "#FFA47A" },
      ];
    }

    let shortlisted = 0;
    let interview = 0;
    let offers = 0;
    let screening = 0;

    effectiveApplicants.forEach((a: any) => {
      const st = (a.status || "").toUpperCase();
      if (st === "SHORTLISTED" || st === "CONFIRMED") shortlisted++;
      else if (st === "INTERVIEW_SCHEDULED" || st === "INTERVIEW") interview++;
      else if (st === "OFFERED" || st === "OFFER" || st === "ACCEPTED" || st === "HIRED" || st === "COMPLETED") offers++;
      else if (st === "NEW" || st === "APPLIED" || st === "PENDING" || st === "UNDER_REVIEW" || st === "UNDER_SCREENING") screening++;
      else shortlisted++;
    });

    return [
      {
        name: "Shortlisted",
        value: Math.round((shortlisted / total) * 100),
        count: `${shortlisted} Candidate${shortlisted !== 1 ? "s" : ""}`,
        color: "#FF5A1F",
      },
      {
        name: "Interview Scheduled",
        value: Math.round((interview / total) * 100),
        count: `${interview} Candidate${interview !== 1 ? "s" : ""}`,
        color: "#E04812",
      },
      {
        name: "Offers Extended",
        value: Math.round((offers / total) * 100),
        count: `${offers} Candidate${offers !== 1 ? "s" : ""}`,
        color: "#FF7E45",
      },
      {
        name: "Under Screening",
        value: Math.round((screening / total) * 100),
        count: `${screening} Candidate${screening !== 1 ? "s" : ""}`,
        color: "#FFA47A",
      },
    ];
  }, [effectiveApplicants]);

  const pieRenderData = useMemo(() => {
    const hasData = dynamicCandidatePipelineData.some((d) => d.value > 0);
    if (!hasData) {
      return [{ name: "No Candidates", value: 1, color: "hsl(var(--muted) / 0.5)" }];
    }
    return dynamicCandidatePipelineData.filter((d) => d.value > 0);
  }, [dynamicCandidatePipelineData]);

  // Active trend data (100% dynamic from real shift dates & statuses)
  const trendData = useMemo(() => {
    if (analyticsTimeframe === "7d") {
      const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      const dayBuckets: Record<string, { broadcast: number; filled: number; hours: number }> = {
        Mon: { broadcast: 0, filled: 0, hours: 0 },
        Tue: { broadcast: 0, filled: 0, hours: 0 },
        Wed: { broadcast: 0, filled: 0, hours: 0 },
        Thu: { broadcast: 0, filled: 0, hours: 0 },
        Fri: { broadcast: 0, filled: 0, hours: 0 },
        Sat: { broadcast: 0, filled: 0, hours: 0 },
        Sun: { broadcast: 0, filled: 0, hours: 0 },
      };

      validShifts.forEach((sh) => {
        const d = sh.startAt ? new Date(sh.startAt) : new Date(sh.date);
        const dayIdx = isNaN(d.getTime()) ? 2 : d.getDay();
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayKey = dayNames[dayIdx];

        if (dayBuckets[dayKey]) {
          dayBuckets[dayKey].broadcast += sh.slots || 1;
          dayBuckets[dayKey].filled += sh.slotsClaimed || 0;
          dayBuckets[dayKey].hours += (sh.hours || 8) * (sh.slotsClaimed || 0);
        }
      });

      return days.map((day) => ({
        period: day,
        broadcast: dayBuckets[day].broadcast,
        filled: dayBuckets[day].filled,
        hours: dayBuckets[day].hours,
      }));
    } else {
      const weekBuckets: Record<string, { broadcast: number; filled: number; hours: number }> = {
        W1: { broadcast: 0, filled: 0, hours: 0 },
        W2: { broadcast: 0, filled: 0, hours: 0 },
        W3: { broadcast: 0, filled: 0, hours: 0 },
        W4: { broadcast: 0, filled: 0, hours: 0 },
      };

      validShifts.forEach((sh) => {
        const d = sh.startAt ? new Date(sh.startAt) : new Date(sh.date);
        const dayOfMonth = isNaN(d.getTime()) ? 4 : d.getDate();
        const weekIndex = Math.min(3, Math.floor((dayOfMonth - 1) / 7));
        const weekKey = ["W1", "W2", "W3", "W4"][weekIndex];

        if (weekBuckets[weekKey]) {
          weekBuckets[weekKey].broadcast += sh.slots || 1;
          weekBuckets[weekKey].filled += sh.slotsClaimed || 0;
          weekBuckets[weekKey].hours += (sh.hours || 8) * (sh.slotsClaimed || 0);
        }
      });

      return ["W1", "W2", "W3", "W4"].map((w) => ({
        period: w,
        broadcast: weekBuckets[w].broadcast,
        filled: weekBuckets[w].filled,
        hours: weekBuckets[w].hours,
      }));
    }
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

  return (
    <AppShell>
      <div className="space-y-6 w-full min-w-0 max-w-full pb-16">
        {/* ========================================================================= */}
        {/* 1. EXECUTIVE HOSPITAL COMMAND COCKPIT HEADER                                */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs">
          <div className="p-3.5 sm:p-4 lg:px-5 lg:py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
            {/* Left on desktop / Top on mobile: Hospital Identity */}
            <div className="flex items-center gap-3 sm:gap-3.5 min-w-0 w-full md:w-auto">
              <div className="relative shrink-0">
                {apiProfile?.logoUrl ? (
                  <img
                    src={apiProfile.logoUrl}
                    alt={orgName}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-2xl object-cover shadow-sm border-2 border-border/60 bg-muted/40"
                  />
                ) : (
                  <OrgMark
                    name={orgName}
                    className="h-12 w-12 sm:h-14 sm:w-14 text-xl sm:text-2xl rounded-2xl shadow-sm border-2 border-border/60 bg-muted/40"
                  />
                )}
                <span
                  title="Verified Institutional Partner"
                  className="absolute -bottom-1 -right-1 grid h-4.5 w-4.5 place-items-center rounded-full bg-emerald-600 text-white ring-2 ring-card shadow-xs"
                >
                  <RiVerifiedBadgeFill className="h-3 w-3" />
                </span>
              </div>

              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-3 sm:gap-3.5 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-black tracking-tight text-foreground truncate">
                    {orgName}
                  </h1>

                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10.5px] sm:text-[11px] font-bold text-primary">
                    <RiShieldCheckFill className="h-3.5 w-3.5 text-primary" />
                    {accreditationText}
                  </span>
                </div>

                <div className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-2 sm:gap-2.5 flex-wrap pt-0.5">
                  <span className="font-semibold text-foreground flex items-center gap-1.5">
                    <HiOutlineMapPin className="h-3.5 w-3.5 text-primary" />
                    {campusLocation}
                  </span>
                  {bedInfo && (
                    <>
                      <span className="hidden sm:inline text-muted-foreground/40">•</span>
                      <span className="hidden sm:inline">{bedInfo}</span>
                    </>
                  )}
                  {facilityTypeText && (
                    <>
                      <span className="hidden sm:inline text-muted-foreground/40">•</span>
                      <span className="hidden sm:inline">{facilityTypeText}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Mobile-only Campus Image Banner (Full Width, Crisp 2.4:1 Aspect Ratio) */}
            <button
              type="button"
              onClick={() => setIsCampusModalOpen(true)}
              title="Click to view campus details"
              className="md:hidden relative aspect-[2.4/1] w-full overflow-hidden rounded-xl border border-border/70 bg-slate-900 shadow-2xs cursor-pointer my-1 block"
            >
              <img
                src={campusPhotoUrl}
                alt={orgName}
                className="h-full w-full object-cover"
              />
            </button>

            {/* Bottom on mobile (full width 2-button grid) / Right on desktop (buttons + desktop image) */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 w-full md:w-auto justify-end pt-1 md:pt-0">
              {/* Action Buttons: 2-col full width grid on mobile, inline on desktop */}
              <div className="grid grid-cols-2 md:flex items-center gap-2 w-full md:w-auto">
                <Button asChild className="rounded-xl font-bold h-9 px-3.5 text-xs shadow-xs gap-1.5 cursor-pointer bg-primary hover:bg-primary-hover text-primary-foreground justify-center">
                  <Link to="/employer/post">
                    <HiPlus className="h-3.5 w-3.5 stroke-[2.5]" />
                    <span>Post Role</span>
                  </Link>
                </Button>

                <Button asChild variant="outline" className="rounded-xl font-bold h-9 px-3.5 text-xs bg-card border-border/80 hover:bg-muted/50 gap-1.5 cursor-pointer justify-center">
                  <Link to="/employer/post-shift">
                    <HiOutlineBolt className="h-3.5 w-3.5 text-primary" />
                    <span>Broadcast Shift</span>
                  </Link>
                </Button>
              </div>

              {/* Desktop-only Campus Image */}
              <button
                type="button"
                onClick={() => setIsCampusModalOpen(true)}
                title="Click to view campus details"
                className="hidden md:block relative aspect-video w-40 lg:w-48 overflow-hidden rounded-xl border border-border/70 bg-slate-900 shadow-sm cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-md shrink-0"
              >
                <img
                  src={campusPhotoUrl}
                  alt={orgName}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
              </button>
            </div>
          </div>
        </section>

        {/* Campus Overview Modal Dialog */}
        <Dialog open={isCampusModalOpen} onOpenChange={setIsCampusModalOpen}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden border-border/80 bg-card rounded-3xl">
            <DialogHeader className="sr-only">
              <DialogTitle>{orgName} Campus Overview</DialogTitle>
            </DialogHeader>
            <div className="relative aspect-video w-full overflow-hidden bg-slate-950">
              <img
                src={campusPhotoUrl}
                alt={orgName}
                className="h-full w-full object-cover"
              />
              <div className="absolute top-3.5 right-3.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/70 backdrop-blur-md px-3 py-1 text-xs font-semibold text-white border border-white/20">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{apiProfile?.kycStatus === "VERIFIED" ? "Verified Institution" : "Clinical Partner"}</span>
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
                    Active Roles
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-extrabold px-2 py-0.5">
                  {activeJobsCount > 0 ? `+${activeJobsCount} Live` : `${allJobs.length} Live`}
                </span>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground leading-none">
                  {allJobs.length}
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                  clinical requisitions
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="text-primary font-semibold flex items-center gap-1">
                <HiOutlineArrowTrendingUp className="h-3.5 w-3.5" />
                {activeJobsCount > 0 ? `${activeJobsCount} Active Postings` : "94% Fill Velocity"}
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
                    Locum Fill Rate
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 text-[10px] font-extrabold px-2 py-0.5">
                  {liveBroadcastsCount > 0 ? `${liveBroadcastsCount} Live` : "0 Active"}
                </span>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground leading-none">
                  {locumFillRate}%
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                  {totalShiftSlots > 0 ? `${claimedShiftSlots} of ${totalShiftSlots} claimed` : "0 shifts broadcasted"}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="text-primary font-semibold truncate flex items-center gap-1.5">
                <span className={cn(
                  "h-1.5 w-1.5 rounded-full shrink-0",
                  liveBroadcastsCount > 0 ? "bg-primary animate-pulse" : "bg-muted-foreground/50"
                )} />
                <span>{`${activeShifts.length} Live Broadcasts`}</span>
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
                <span className="shrink-0 rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20 text-[10px] font-extrabold px-2 py-0.5">
                  {shortlistedApplicants.length > 0 ? `${shortlistedApplicants.length} Shortlisted` : `${effectiveApplicants.length} In Review`}
                </span>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground leading-none">
                  {effectiveApplicants.length}
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                  verified clinicians
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="text-primary font-semibold truncate flex items-center gap-1">
                <HiOutlineCheckBadge className="h-3.5 w-3.5" />
                {councilVerifiedCount > 0 ? `${councilVerifiedCount} Council Verified` : "0 Council Verified"}
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
                <span className="shrink-0 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-extrabold px-2 py-0.5">
                  {apiWallet?.lockedEscrowBalancePaise && apiWallet.lockedEscrowBalancePaise > 0
                    ? "Escrow Locked"
                    : "100% Nodal"}
                </span>
              </div>

              <div className="mt-2.5">
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-foreground leading-none">
                  {formattedEscrow}
                </div>
                <p className="text-xs font-semibold text-muted-foreground mt-1 truncate">
                  {apiWallet?.lockedEscrowBalancePaise && apiWallet.lockedEscrowBalancePaise > 0
                    ? "locked in shift escrow"
                    : "available wallet balance"}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground flex items-center justify-between">
              <span className="text-primary font-semibold truncate">
                {apiWallet?.lockedEscrowBalancePaise && apiWallet.lockedEscrowBalancePaise > 0
                  ? `₹${paiseToRupees(apiWallet.availableBalancePaise).toLocaleString("en-IN")} Available`
                  : "24h Nodal Protection"}
              </span>
              <HiArrowRight className="h-3 w-3 shrink-0 opacity-60 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
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
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 text-[11px] sm:text-xs">
                    <span className="h-2 w-2 rounded-full bg-emerald-600 shrink-0" />
                    <span>Fulfilled</span>
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
                              <span>Broadcasted: {payload[0]?.value} shifts</span>
                            </div>
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-semibold">
                              <span className="h-2 w-2 rounded-full bg-emerald-500" />
                              <span>Fulfilled: {payload[1]?.value} shifts</span>
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
            </div>

            {/* Bottom Summary Bar (No ellipses, zero text truncation) */}
            <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 pt-3.5 border-t border-border/60 text-center">
              <div className="py-2.5 px-2 sm:py-3 sm:px-3 rounded-2xl bg-muted/40 border border-border/40 flex flex-col justify-center min-w-0 shadow-2xs">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  <span className="sm:hidden">POSTED</span>
                  <span className="hidden sm:inline">BROADCASTED</span>
                </span>
                <div className="mt-1 flex items-baseline justify-center gap-1 font-mono leading-none">
                  <span className="text-sm sm:text-base font-black text-foreground">
                    {trendData.reduce((acc, curr) => acc + curr.broadcast, 0)}
                  </span>
                  <span className="text-[10px] sm:text-xs font-sans font-semibold text-muted-foreground">
                    Shifts
                  </span>
                </div>
              </div>

              <div className="py-2.5 px-2 sm:py-3 sm:px-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-center min-w-0 shadow-2xs">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 tracking-wider block">
                  FULFILLMENT
                </span>
                <div className="mt-1 flex items-baseline justify-center gap-1 font-mono leading-none">
                  <span className="text-sm sm:text-base font-black text-emerald-600 dark:text-emerald-400">
                    {dynamicFulfillmentRate}
                  </span>
                  <span className="text-[10px] sm:text-xs font-sans font-semibold text-emerald-700/80 dark:text-emerald-300/80">
                    Claimed
                  </span>
                </div>
              </div>

              <div className="py-2.5 px-2 sm:py-3 sm:px-3 rounded-2xl bg-muted/40 border border-border/40 flex flex-col justify-center min-w-0 shadow-2xs">
                <span className="text-[9px] sm:text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                  <span className="sm:hidden">HOURS</span>
                  <span className="hidden sm:inline">COVERED HOURS</span>
                </span>
                <div className="mt-1 flex items-baseline justify-center gap-1 font-mono leading-none">
                  <span className="text-sm sm:text-base font-black text-foreground">
                    {totalCoveredHours.toLocaleString()}
                  </span>
                  <span className="text-[10px] sm:text-xs font-sans font-semibold text-muted-foreground">
                    hrs
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chart 2: Candidate Pipeline Donut Chart (FALE Brand Colors) (5 cols) */}
          <div className="lg:col-span-5 rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-2xs flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <HiOutlineDocumentCheck className="h-4.5 w-4.5 text-primary" />
                  <span>Candidate Pipeline</span>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Shortlisted clinicians by recruitment stage
                </p>
              </div>
              <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                {effectiveApplicants.length} Active
              </span>
            </div>

            {/* Recharts Pie Chart / Donut */}
            <div className="relative h-56 w-full flex items-center justify-center my-auto py-1">
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
                  {effectiveApplicants.length}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary leading-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  Council Verified
                </span>
              </div>
            </div>

            {/* Legend Pills below Pie */}
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
          </div>
        </section>

        {/* ========================================================================= */}
        {/* 4. MAIN OPERATIONAL REQUISITIONS & SHIFT BOARD (NECESSARY ONLY)          */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
          {/* Main Feed Column (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
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

                <button
                  type="button"
                  onClick={() => setActiveTab("applicants")}
                  className={cn(
                    "flex-1 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap",
                    activeTab === "applicants"
                      ? "bg-card text-foreground shadow-2xs font-bold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <HiOutlineDocumentCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                  <span>Shortlisted ({effectiveApplicants.length})</span>
                </button>
              </div>
            </div>

            {/* TAB 1: Clinical Postings */}
            {activeTab === "postings" && (
              <div className="space-y-3.5">
                {filteredJobs.map((job) => (
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
                      <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary font-bold hover:bg-primary-soft">
                        <Link to="/employer/applicants">View Shortlist →</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: Locum Shifts */}
            {activeTab === "shifts" && (
              <div className="space-y-3">
                {activeShifts.map((sh) => (
                  <div
                    key={sh.id}
                    className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs hover:border-primary/40 transition-all space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className={cn(
                          "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
                          sh.status === "PENDING_APPROVAL"
                            ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                            : sh.status === "OPEN"
                            ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                            : sh.status === "FILLED"
                            ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20"
                            : "bg-muted text-muted-foreground"
                        )}>
                          <span className={cn(
                            "h-1.5 w-1.5 rounded-full",
                            sh.status === "PENDING_APPROVAL" ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
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
                      <span className="text-emerald-600 font-medium text-[11px] flex items-center gap-1">
                        <HiOutlineShieldCheck className="h-3.5 w-3.5" /> 24h Escrow Protected
                      </span>
                      <Button asChild variant="outline" size="sm" className="h-7 text-xs rounded-lg font-bold">
                        <Link to="/employer/post-shift">Manage Shift</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 3: Shortlisted */}
            {activeTab === "applicants" && (
              <div className="space-y-3">
                {effectiveApplicants.length === 0 ? (
                  <div className="p-8 rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
                    No shortlisted applicants yet. When compliance admin shortlists candidates for your postings, they will appear here.
                  </div>
                ) : (
                  effectiveApplicants.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-2xl border border-border/70 bg-card p-4 shadow-xs hover:border-primary/40 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-sm font-bold text-primary">
                          {initials(a.candidateName || a.name || "Candidate")}
                        </span>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-foreground truncate">{a.candidateName || a.name}</h4>
                          <p className="text-xs text-muted-foreground truncate">{a.jobTitle || a.role || "Healthcare Clinician"} • {a.status || "Shortlisted"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <StatusBadge status={a.status} />
                        <Button asChild size="sm" variant="outline" className="h-7 text-xs rounded-lg font-bold">
                          <Link to="/employer/applicants">Review</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Right Rail: Hospital Readiness & Hotline (4 cols) */}
          <div className="lg:col-span-4 space-y-4 lg:sticky lg:top-20">
            {/* Verified Clinical Hiring Desk */}
            <div className="rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <HiOutlineCheckBadge className="h-4.5 w-4.5" />
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">Verified Clinical Hiring</h4>
                    <p className="text-[10px] text-muted-foreground">Council-cleared professionals delivered to your desk</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold px-2 py-0.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              </div>

              <div className="rounded-2xl bg-muted/40 p-3.5 space-y-2.5 border border-border/50 text-xs">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-medium">Postings in Verification</span>
                  <span className="font-bold font-mono text-amber-600 dark:text-amber-400">
                    {inVerificationJobsCount > 0 ? `${inVerificationJobsCount} Under Review` : "0 Under Review"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-medium">Active Vacancies</span>
                  <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                    {activeJobsCount > 0 ? `${activeJobsCount} Published` : `${allJobs.length} Published`}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-muted-foreground font-medium">Shortlisted Clinicians</span>
                  <span className="font-bold font-mono text-primary font-bold">
                    {shortlistedApplicants.length > 0 ? `${shortlistedApplicants.length} Ready to Interview` : `${effectiveApplicants.length} In Review`}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px]">Qualified Candidates</span>
                <Link to="/employer/applicants" className="font-bold text-primary hover:underline text-xs">
                  View Shortlist &rarr;
                </Link>
              </div>
            </div>

            {/* 24/7 Clinical Concierge & Escrow Help */}
            <div className="rounded-3xl border border-primary/20 bg-primary/5 p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <HiOutlineQuestionMarkCircle className="h-4 w-4" />
                  <span>Clinical Concierge</span>
                </span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.5">
                  24/7 Live
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Need urgent shift cover or credential escrow resolution? Call your dedicated nodal coordinator.
              </p>
              <div className="pt-1 flex items-center justify-between text-xs font-mono font-bold">
                <a href="tel:+917338367726" className="text-foreground hover:text-primary transition-colors flex items-center gap-1">
                  <HiOutlinePhone className="h-3 w-3 text-primary" />
                  <span>+91 73383 67726</span>
                </a>
                <Link to="/support" className="text-primary hover:underline text-[11px]">
                  Help Desk →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
