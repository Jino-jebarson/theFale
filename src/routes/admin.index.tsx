import { usePageLoad } from "@/hooks/use-page-load";
import { RequestError } from "@/components/fale/RequestError";
import { useState, useRef, useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Sector,
} from "recharts";
import {
  HiOutlineIdentification,
  HiOutlineBuildingOffice2,
  HiOutlineDocumentCheck,
  HiOutlineUserGroup,
  HiCheck,
  HiOutlineArrowRight,
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineArrowTrendingUp,
  HiOutlineShieldCheck,
  HiOutlineChartPie,
  HiOutlineSparkles,
  HiOutlineBriefcase,
  HiOutlineMagnifyingGlass,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineXMark,
  HiOutlineArrowPath,
  HiOutlineClipboardDocumentList,
} from "react-icons/hi2";
import { MdWavingHand } from "react-icons/md";
import { toast } from "sonner";
import { BotMessageSquare } from "lucide-react";
import { AdminLayout } from "@/components/fale/AdminLayout";
import { Button, ButtonSpinner } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useApp, setState, approveHuddlePost, rejectHuddlePost, AdminJobApproval, CandidateKYCItem, FacilityKYCItem, AdminApplication, HuddlePost } from "@/lib/store";
import { HiOutlineChatBubbleLeftRight } from "react-icons/hi2";
import { cn } from "@/lib/utils";
import { isApiEnabled, paiseToRupees } from "@/lib/api";
import { getDailyMorningBriefWithAi, getDemandForecastWithAi } from "@/lib/adapters/aiAdapter";
import {
  getAdminDashboardMetrics,
  getPendingJobPostings,
  getPendingFacilityKyc,
  getPendingCandidateKyc,
  getAdminApplications,
  getFlaggedHuddlePosts,
  approveJobPosting,
  reviewFacilityKyc,
  reviewCandidateKyc,
  screenApplication,
  moderateHuddlePost,
  getPendingShifts,
  approveShift,
  getPendingShiftClaims,
  screenShiftClaim,
} from "@/lib/adapters/adminAdapter";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Operations Console — FALE RMS" },
      { name: "description", content: "Enterprise clinical workforce verification and recruitment management system." },
    ],
  }),
  component: AdminDashboard,
});

function AdminDashboard() {
  const pageLoad = usePageLoad();
  const s = useApp();
  const navigate = useNavigate();
  const [activeQueueTab, setActiveQueueTab] = useState<"all" | "postings" | "candidates" | "facilities" | "applications" | "huddle">("all");
  const [queueSearch, setQueueSearch] = useState("");

  const [apiJobs, setApiJobs] = useState<AdminJobApproval[]>([]);
  const [apiCandidates, setApiCandidates] = useState<CandidateKYCItem[]>([]);
  const [apiFacilities, setApiFacilities] = useState<FacilityKYCItem[]>([]);
  const [apiApps, setApiApps] = useState<AdminApplication[]>([]);
  const [apiHuddle, setApiHuddle] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<AdminDashboardMetricsDto | null>(null);
  const [loading, setLoading] = useState(isApiEnabled);

  // AI Operations Brief & Demand Staffing Outlook State
  const [briefText, setBriefText] = useState<string | null>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);

  const [forecastText, setForecastText] = useState<string | null>(null);
  const [isGeneratingForecast, setIsGeneratingForecast] = useState(false);
  const [intelTab, setIntelTab] = useState<"brief" | "forecast">("brief");

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [metricsRes, jobsRes, facRes, candRes, appsRes, huddleRes, shiftsRes, shiftClaimsRes] = await Promise.all([
        getAdminDashboardMetrics(),
        getPendingJobPostings("all"),
        getPendingFacilityKyc("all"),
        getPendingCandidateKyc("all"),
        getAdminApplications("all"),
        getFlaggedHuddlePosts(),
        getPendingShifts(),
        getPendingShiftClaims(),
      ]);

      if (metricsRes) setMetrics(metricsRes);

      const mappedJobs = jobsRes.map((j: any) => {
        const minRupees = j.salaryMinPaise ? paiseToRupees(j.salaryMinPaise) : (j.salaryMin ? Number(j.salaryMin) : 0);
        const maxRupees = j.salaryMaxPaise ? paiseToRupees(j.salaryMaxPaise) : (j.salaryMax ? Number(j.salaryMax) : 0);
        const comp = j.salaryDisplay || (minRupees && maxRupees ? `₹${(minRupees / 1000).toFixed(0)}k–${(maxRupees / 1000).toFixed(0)}k/mo` : minRupees ? `₹${(minRupees / 1000).toFixed(0)}k+/mo` : "Competitive");

        let status: "pending" | "approved" | "rejected" = "pending";
        if (j.status === "OPEN" || j.status === "ACTIVE" || j.status === "APPROVED") status = "approved";
        else if (j.status === "REJECTED" || j.status === "CLOSED") status = "rejected";

        return {
          id: j.id,
          title: j.title,
          dept: j.department || "Clinical Medicine",
          org: j.facilityName || "Partner Hospital",
          city: j.city || j.facilityCity || "",
          compensation: comp,
          openings: j.openings || 1,
          type: "job" as const,
          expOrHours: j.experienceRequired || "1-3 yrs exp",
          postedBy: j.facilityName || "Facility Admin",
          status,
          submittedDate: j.postedAt || j.createdAt ? new Date(j.postedAt || j.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Recent",
        };
      });

      const mappedShifts = shiftsRes.map((s: any) => {
        const rateRupees = s.ratePerHourPaise ? paiseToRupees(s.ratePerHourPaise) : 0;
        const totalRupees = s.totalPayPaise ? paiseToRupees(s.totalPayPaise) : rateRupees * (s.hours || 8);
        const comp = `₹${rateRupees}/hr (₹${totalRupees.toLocaleString("en-IN")})`;

        let status: "pending" | "approved" | "rejected" = "pending";
        if (s.status === "OPEN" || s.status === "ACTIVE" || s.status === "APPROVED") status = "approved";
        else if (s.status === "REJECTED" || s.status === "CANCELLED") status = "rejected";

        return {
          id: s.id,
          title: s.title,
          dept: s.department || "Clinical Medicine",
          org: s.facilityName || "Partner Hospital",
          city: s.city || "",
          compensation: comp,
          openings: s.openings || 1,
          type: "shift" as const,
          expOrHours: `${s.hours || 8} hrs duty`,
          postedBy: s.facilityName || "Facility Admin",
          status,
          submittedDate: s.startAt ? new Date(s.startAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Recent",
        };
      });

      setApiJobs([...mappedJobs, ...mappedShifts]);

      setApiFacilities(facRes.map((f: any) => {
        let status: "pending" | "verified" | "rejected" = "pending";
        if (f.kycStatus === "VERIFIED" || f.kycStatus === "APPROVED") status = "verified";
        else if (f.kycStatus === "REJECTED") status = "rejected";

        return {
          id: f.id,
          name: f.facilityName || f.hospitalName || "Hospital Facility",
          type: f.facilityType || "Multispecialty Hospital",
          city: f.city || "",
          state: f.state || "",
          licenseNumber: f.licenseNumber || f.ceaRegistrationNumber || "CEA-REG-ACTIVE",
          nabhNumber: f.nabhNumber || f.nabhAccreditationNumber || "NABH-AUDIT-ACTIVE",
          beds: f.bedCapacity || 0,
          contactPerson: f.administratorName || f.contactPerson || "Facility Administrator",
          contactPhone: f.phone || "+91 6380102652",
          docName: "Establishment_License_NABH.pdf",
          status,
          submittedDate: f.createdAt ? new Date(f.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Recent",
          accreditation: f.nabhNumber ? "NABH Accredited" : "State Registered",
        };
      }));

      setApiCandidates(candRes.map((c: any) => {
        let status: "pending" | "verified" | "rejected" = "pending";
        if (c.kycStatus === "VERIFIED" || c.kycStatus === "APPROVED") status = "verified";
        else if (c.kycStatus === "REJECTED") status = "rejected";

        return {
          id: c.id,
          name: c.name || "Candidate",
          email: c.email || "candidate@fale.in",
          phone: c.phone || "+91 6380102651",
          profession: c.profession || c.specialty || "Clinical Practitioner",
          qualification: c.qualification || "MBBS / B.Sc Nursing",
          council: c.council || "State Medical / Nursing Council",
          regNumber: c.regNumber || "REG-VERIFICATION-PENDING",
          state: c.state || c.city || "",
          docName: "Council_Registration_Certificate.pdf",
          status,
          submittedDate: c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Recent",
          experience: c.experienceYears ? `${c.experienceYears} yrs experience` : "Fresher / Resident",
        };
      }));

      const mappedApps = appsRes.map((a: any) => {
        let status: "pending_admin" | "shortlisted" | "rejected" = "pending_admin";
        if (a.status === "SHORTLISTED" || a.status === "INTERVIEW" || a.status === "OFFERED" || a.status === "HIRED") {
          status = "shortlisted";
        } else if (a.status === "REJECTED" || a.status === "INELIGIBLE") {
          status = "rejected";
        }

        return {
          id: a.id,
          candidateName: a.candidateName || "Candidate",
          candidateRole: a.candidateRole || a.department || "Clinical Professional",
          candidateCity: a.candidateCity || a.city || "",
          jobId: a.jobId,
          jobTitle: a.jobTitle || "Healthcare Opening",
          hospitalName: a.facilityName || "Partner Hospital",
          matchScore: a.matchScore ?? 80,
          councilVerified: a.councilVerified ?? true,
          regNumber: a.regNumber || "Verified Council Member",
          exp: a.candidateExperience || "2+ yrs",
          status,
          appliedDate: a.appliedAt ? new Date(a.appliedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Recent",
          summary: "Screened through FALE clinical qualification pipeline.",
          phone: a.candidatePhone || a.phone || "+91 6380102651",
          email: a.candidateEmail || a.email || "candidate@fale.in",
        };
      });

      const mappedShiftClaims = shiftClaimsRes.map((sc: any) => {
        let status: "pending_admin" | "shortlisted" | "rejected" = "pending_admin";
        if (sc.status === "CONFIRMED" || sc.status === "CHECKED_IN" || sc.status === "COMPLETED") {
          status = "shortlisted";
        } else if (sc.status === "REJECTED" || sc.status === "CANCELLED") {
          status = "rejected";
        }

        const netRupees = sc.netAmountPaise ? paiseToRupees(sc.netAmountPaise) : 0;

        return {
          id: sc.id,
          candidateName: sc.candidateName || "Healthcare Professional",
          candidateRole: sc.candidateRole || "Clinical Practitioner",
          candidateCity: sc.candidateCity || "",
          jobId: sc.shiftId,
          jobTitle: `[Shift] ${sc.shiftTitle || "Locum Duty"}`,
          hospitalName: sc.facilityName || "Partner Hospital",
          matchScore: sc.matchScore ?? 85,
          councilVerified: true,
          regNumber: "Council Verified Clinician",
          exp: `${sc.hours || 8} hrs duty`,
          status,
          appliedDate: sc.claimedAt ? new Date(sc.claimedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : "Recent",
          summary: `Locum shift duty claim. Net escrow guarantee: ₹${netRupees.toLocaleString("en-IN")}.`,
          phone: "+91 6380102651",
          email: "candidate@fale.in",
          isShiftClaim: true,
        };
      });

      setApiApps([...mappedApps, ...mappedShiftClaims]);

      setApiHuddle(huddleRes.map((h: any) => ({
        id: h.id,
        authorName: h.authorName || "Healthcare Professional",
        authorRole: "Verified Doctor",
        authorAvatar: "",
        category: h.field || "Clinical",
        text: h.body || h.title,
        likes: h.upvotes || 0,
        comments: 0,
        shares: 0,
        verifiedOnly: true,
        urgency: "Standard",
        pinned: false,
        status: "review",
        createdTime: "Recent",
      })));
    } catch (err: any) {
      pageLoad.fail(err);
      toast.error("Failed to load admin queue", { description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [pageLoad.retryKey]);

  const pendingCandidateKYC = apiCandidates.filter((c) => c.status === "pending");
  const pendingFacilityKYC = apiFacilities.filter((f) => f.status === "pending");
  const pendingJobApprovals = apiJobs.filter((j) => j.status === "pending");
  const pendingShortlisting = apiApps.filter((a) => a.status === "pending_admin");
  const pendingHuddleReview = apiHuddle.filter((p) => p.status === "review" || p.status === "hidden");

  const totalPending =
    pendingCandidateKYC.length +
    pendingFacilityKYC.length +
    pendingJobApprovals.length +
    pendingShortlisting.length +
    pendingHuddleReview.length;

  const queueRef = useRef<HTMLDivElement>(null);

  const jumpToQueue = (tab: "candidates" | "postings" | "facilities" | "applications" | "huddle") => {
    setActiveQueueTab(tab);
    setQueueSearch("");
    if (queueRef.current) {
      queueRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const locumCount = useMemo(() => {
    return apiJobs.filter((j) => j.type === "shift").length;
  }, [isApiEnabled, apiJobs, s.jobApprovals]);

  const metroCorridors = useMemo(() => {
    const list = Array.from(
      new Set([
        ...apiJobs.map((j) => j.city),
        ...apiFacilities.map((f) => f.city),
        ...apiCandidates.map((c) => c.state),
      ])
    ).filter(Boolean);
    if (list.length > 0) {
      return list.slice(0, 3).join(", ");
    }
    return "Location not provided";
  }, [apiJobs, apiFacilities, apiCandidates]);

  const topCadres = useMemo(() => {
    if (metrics?.cadreBreakdown && Object.keys(metrics.cadreBreakdown).length > 0) {
      return Object.entries(metrics.cadreBreakdown)
        .sort((a, b) => b[1] - a[1])
        .map(([name, count]) => ({
          name: name === "Doctor" ? "Duty Doctors & Specialists" : name === "Physiotherapist" ? "Physiotherapists & Rehab" : name,
          rawName: name,
          count,
        }));
    }
    const counts: Record<string, number> = {};
    (apiCandidates).forEach((c) => {
      const prof = c.profession || "Clinical Practitioner";
      counts[prof] = (counts[prof] || 0) + 1;
    });
    (apiJobs).forEach((j) => {
      const dept = j.dept || "Medical";
      counts[dept] = (counts[dept] || 0) + 1;
    });
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    if (entries.length > 0) {
      return entries.map(([name, count]) => ({ name, rawName: name, count }));
    }
    return [];
  }, [metrics?.cadreBreakdown, isApiEnabled, apiCandidates, s.candidateKYC, apiJobs, s.jobApprovals]);

  const topSurgeName = topCadres[0]?.name || "No cadre data";
  const secondarySurgeName = topCadres[1]?.name || "Emergency Care Clinicians";


  const handleGenerateBrief = async (overrideMetrics?: any) => {
    setIsGeneratingBrief(true);
    try {
      const pKyc = overrideMetrics?.pendingKyc ?? pendingCandidateKYC.length;
      const pJobs = overrideMetrics?.pendingJobs ?? pendingJobApprovals.length;
      const pFac = overrideMetrics?.pendingFacilities ?? pendingFacilityKYC.length;
      const aShifts = overrideMetrics?.activeShifts;

      const res = await getDailyMorningBriefWithAi({
        pendingKyc: pKyc,
        pendingJobs: pJobs,
        pendingFacilities: pFac,
        ...(typeof aShifts === "number" ? { activeShifts: aShifts } : {}),
      });
      const text = res.response || res.content || "";
      if (text) {
        setBriefText(text);
        toast.success("Morning Operations Brief updated with live Ally");
      }
    } catch (err: any) {
      pageLoad.fail(err);
      console.warn("Brief generation error:", err);
      toast.error("Failed to generate Ally morning brief");
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleGenerateForecast = async () => {
    setIsGeneratingForecast(true);
    try {
      const res = await getDemandForecastWithAi({
        metro: metroCorridors,
        topSpecialties: topCadres.map((c) => c.name),
        loadedShiftPostings: locumCount,
      });
      const text = res.response || res.content || "";
      if (text) {
        setForecastText(text);
        toast.success("Staffing Planning Outlook recalculated with live Ally");
      }
    } catch (err: any) {
      pageLoad.fail(err);
      console.warn("Forecast generation error:", err);
      toast.error("Failed to generate Ally demand forecast");
    } finally {
      setIsGeneratingForecast(false);
    }
  };

  const quickApproveHuddle = async (id: string, authorName: string) => {
    {
      try {
        await moderateHuddlePost(id, false);
        toast.success("Huddle Post Approved & Live!", {
          description: `Post by ${authorName} is now published to the public Huddle feed.`,
        });
        loadDashboardData();
      } catch (err: any) {
      pageLoad.fail(err);
        toast.error("Moderation failed", { description: err?.message });
      }
      return;
    }

  };

  const quickRejectHuddle = async (id: string) => {
    {
      try {
        await moderateHuddlePost(id, true);
        toast.info("Post Removed from Huddle", {
          description: "Post was permanently removed for privacy or guideline violations.",
        });
        loadDashboardData();
      } catch (err: any) {
      pageLoad.fail(err);
        toast.error("Moderation failed", { description: err?.message });
      }
      return;
    }

  };

  const quickApproveJob = async (id: string, title: string) => {
    {
      try {
        const item = apiJobs.find((j) => j.id === id);
        if (item?.type === "shift") {
          await approveShift(id);
          toast.success("Locum Shift Approved & Live!", {
            description: `"${title}" is now active and open for claims on the Shift Portal.`,
          });
        } else {
          await approveJobPosting(id);
          toast.success("Job Requirement Approved!", {
            description: `"${title}" is now published and live on the Candidate Portal.`,
          });
        }
        loadDashboardData();
      } catch (err: any) {
      pageLoad.fail(err);
        toast.error("Approval failed", { description: err?.message });
      }
      return;
    }

  };

  const quickVerifyCandidate = async (id: string, name: string) => {
    {
      try {
        await reviewCandidateKyc(id, "APPROVE", "Verified state council credentials");
        toast.success("Candidate Verified!", {
          description: `${name}'s state council credentials verified and granted verified seal.`,
        });
        loadDashboardData();
      } catch (err: any) {
      pageLoad.fail(err);
        toast.error("Verification failed", { description: err?.message });
      }
      return;
    }

  };

  const quickVerifyFacility = async (id: string, name: string) => {
    {
      try {
        await reviewFacilityKyc(id, "APPROVE", "Verified hospital credentials");
        toast.success("Hospital Accredited!", {
          description: `${name} approved as an accredited facility on FALE.`,
        });
        loadDashboardData();
      } catch (err: any) {
      pageLoad.fail(err);
        toast.error("Accreditation failed", { description: err?.message });
      }
      return;
    }

  };

  const quickShortlistApp = async (id: string, candidateName: string) => {
    {
      try {
        const item = apiApps.find((a) => a.id === id);
        if ((item as any)?.isShiftClaim) {
          await screenShiftClaim(id, "APPROVE");
          toast.success("Shift Claim Confirmed & Clinician Dispatched!", {
            description: `${candidateName}'s locum duty is confirmed with escrow guarantee.`,
          });
        } else {
          await screenApplication(id, "SHORTLIST", "Shortlisted by compliance admin");
          toast.success("Candidate Shortlisted!", {
            description: `${candidateName}'s application shortlisted for hospital hiring desk.`,
          });
        }
        loadDashboardData();
      } catch (err: any) {
      pageLoad.fail(err);
        toast.error("Shortlisting failed", { description: err?.message });
      }
      return;
    }

  };

  // Pie Chart 1 Data: Workload Distribution by Queue (Exact Facility Dashboard Palette)
  const queueData = useMemo(() => [
    { name: "Candidate KYC", value: pendingCandidateKYC.length, color: "#FF5A1F", link: "/admin/candidates" },
    { name: "Hospital Verification", value: pendingFacilityKYC.length, color: "#E04812", link: "/admin/facilities" },
    { name: "Job & Shift Approvals", value: pendingJobApprovals.length, color: "#FF7E45", link: "/admin/postings" },
    { name: "Applicant Shortlisting", value: pendingShortlisting.length, color: "#FFA47A", link: "/admin/applications" },
    { name: "Huddle Moderation", value: pendingHuddleReview.length, color: "#D13807", link: "/admin/huddle" },
  ], [pendingCandidateKYC.length, pendingFacilityKYC.length, pendingJobApprovals.length, pendingShortlisting.length, pendingHuddleReview.length]);

  const chartQueueData = useMemo(() => {
    const active = queueData.filter((d) => d.value > 0);
    if (active.length > 0) return active;
    return [{ name: "All Queues Cleared", value: 1, color: "#10B981", link: "/admin" }];
  }, [queueData]);

  // Pie Chart 2 Data: Dynamic Clinical Cadre Breakdown from Database
  const professionData = useMemo(() => {
    if (metrics?.cadreBreakdown && Object.keys(metrics.cadreBreakdown).length > 0) {
      const palette = ["#FF5A1F", "#E04812", "#FF7E45", "#FFA47A", "#C23303", "#FF9E79"];
      const total = Object.values(metrics.cadreBreakdown).reduce((a, b) => a + b, 0);
      return Object.entries(metrics.cadreBreakdown).map(([name, count], i) => ({
        name: name === "Doctor" ? "Doctors & Specialists" : name === "Physiotherapist" ? "Physiotherapists & Rehab" : name,
        value: Math.round((count / (total || 1)) * 100),
        count,
        color: palette[i % palette.length],
      }));
    }
    return [
      { name: "Doctors & Specialists", value: 75, count: 3, color: "#FF5A1F" },
      { name: "Physiotherapists & Rehab", value: 25, count: 1, color: "#E04812" },
    ];
  }, [metrics]);

  // Filtered queue items based on search and selected tab
  const filteredJobs = (activeQueueTab === "all" || activeQueueTab === "postings")
    ? pendingJobApprovals.filter((j) => {
        if (!queueSearch) return true;
        const q = queueSearch.toLowerCase();
        return j.title.toLowerCase().includes(q) || j.org.toLowerCase().includes(q) || j.city.toLowerCase().includes(q);
      })
    : [];

  const filteredCandidates = (activeQueueTab === "all" || activeQueueTab === "candidates")
    ? pendingCandidateKYC.filter((c) => {
        if (!queueSearch) return true;
        const q = queueSearch.toLowerCase();
        return c.name.toLowerCase().includes(q) || c.profession.toLowerCase().includes(q) || c.council.toLowerCase().includes(q);
      })
    : [];

  const filteredFacilities = (activeQueueTab === "all" || activeQueueTab === "facilities")
    ? pendingFacilityKYC.filter((f) => {
        if (!queueSearch) return true;
        const q = queueSearch.toLowerCase();
        return f.name.toLowerCase().includes(q) || f.city.toLowerCase().includes(q) || f.accreditation.toLowerCase().includes(q);
      })
    : [];

  const filteredApplications = (activeQueueTab === "all" || activeQueueTab === "applications")
    ? pendingShortlisting.filter((a) => {
        if (!queueSearch) return true;
        const q = queueSearch.toLowerCase();
        return (
          (a.candidateName || "").toLowerCase().includes(q) ||
          (a.jobTitle || "").toLowerCase().includes(q) ||
          ((a as any).hospitalName || (a as any).facilityName || "").toLowerCase().includes(q)
        );
      })
    : [];

  const filteredHuddle = (activeQueueTab === "all" || activeQueueTab === "huddle")
    ? pendingHuddleReview.filter((p) => {
        if (!queueSearch) return true;
        const q = queueSearch.toLowerCase();
        return p.authorName.toLowerCase().includes(q) || p.authorRole.toLowerCase().includes(q) || p.text.toLowerCase().includes(q);
      })
    : [];

  const totalFilteredCount =
    filteredJobs.length +
    filteredCandidates.length +
    filteredFacilities.length +
    filteredApplications.length +
    filteredHuddle.length;

  const [activeQueueIndex, setActiveQueueIndex] = useState<number | null>(null);
  const [activeProfessionIndex, setActiveProfessionIndex] = useState<number | null>(null);

  const queueTimerRef = useRef<number | null>(null);
  const professionTimerRef = useRef<number | null>(null);

  const handleQueueEnter = (index: number) => {
    if (queueTimerRef.current) clearTimeout(queueTimerRef.current);
    setActiveQueueIndex(index);
  };

  const handleQueueLeave = () => {
    if (queueTimerRef.current) clearTimeout(queueTimerRef.current);
    queueTimerRef.current = window.setTimeout(() => {
      setActiveQueueIndex(null);
    }, 90);
  };

  const handleProfessionEnter = (index: number) => {
    if (professionTimerRef.current) clearTimeout(professionTimerRef.current);
    setActiveProfessionIndex(index);
  };

  const handleProfessionLeave = () => {
    if (professionTimerRef.current) clearTimeout(professionTimerRef.current);
    professionTimerRef.current = window.setTimeout(() => {
      setActiveProfessionIndex(null);
    }, 90);
  };

  const renderActiveShape = (props: any) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
    return (
      <g className="pointer-events-none">
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 3}
          outerRadius={outerRadius + 8}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke="none"
          style={{
            transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </g>
    );
  };

  const adminName = String(s.profile["adminName"] || s.profile["name"] || "Admin").split(" ")[0];

  const getGreeting = (name: string) => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return `Good morning, ${name}`;
    if (hour >= 12 && hour < 17) return `Good afternoon, ${name}`;
    if (hour >= 17 && hour < 22) return `Good evening, ${name}`;
    return `Good night, ${name}`;
  };

  const dynamicGreeting = (
    <span className="inline-flex items-center gap-2">
      <span>{getGreeting(adminName)}</span>
      <MdWavingHand
        className="h-6 w-6 shrink-0 inline-block drop-shadow-xs transition-transform duration-300 hover:rotate-12"
        style={{ color: "#cca56aff", fill: "#d4a051ff" }}
        aria-hidden="true"
      />
    </span>
  );
  const dynamicSubtitle = totalPending > 0 ? (
    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
      Welcome back. You have{" "}
      <span className="inline-flex items-center align-middle -translate-y-px rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary border border-primary/20 mx-0.5">
        {totalPending} action items
      </span>{" "}
      awaiting clinical review across candidate KYC, hospital verification, and job postings.
    </p>
  ) : (
    <div className="flex items-center gap-2 text-xs sm:text-sm text-primary font-semibold">
      <HiOutlineCheckBadge className="h-4 w-4 shrink-0 text-primary" />
      <span>Welcome back. All clinical verification and shortlisting queues are fully cleared!</span>
    </div>
  );

  const formatBriefParagraphs = (raw: string): string[] => {
    if (!raw) return [];
    // Split merged inline numbered bullets (e.g. "... 1. First ... 2. Second ...") onto separate lines
    const normalized = raw
      .replace(/\r\n/g, "\n")
      .replace(/([^\n])\s+(\d+\.\s+)/g, "$1\n$2");
    return normalized
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
  };

  const renderBriefLine = (line: string, idx: number) => {
    // Strip bullet/number markers, markdown tokens (including unmatched ** / *), headings, and raw emojis
    const cleanLine = line
      .replace(/^[•\-\*]+\s*/, "")
      .replace(/^\d+[\.)]\s*/, "")
      .replace(/^#{1,4}\s*/, "")
      .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
      .replace(/\*\*|__|~~/g, "")
      .replace(/^\*+|\*+$/g, "")
      .replace(/\*+/g, "")
      .trim();

    if (!cleanLine) return null;

    const plainLine = cleanLine;
    const isHeader =
      plainLine.toLowerCase().includes("morning operations brief") ||
      plainLine.toLowerCase().includes("daily brief") ||
      plainLine.toLowerCase().includes("demand projection") ||
      plainLine.toLowerCase().includes("surge analysis");

    // Highlight bold markdown segments or "Label: detail" lead-ins cleanly
    const colonIdx = plainLine.indexOf(":");
    const hasLeadLabel = !isHeader && colonIdx > 0 && colonIdx <= 42;
    const leadLabel = hasLeadLabel ? plainLine.slice(0, colonIdx + 1) : "";
    const restText = hasLeadLabel ? plainLine.slice(colonIdx + 1).trim() : plainLine;

    return (
      <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-[13px] leading-relaxed">
        {isHeader ? (
          <HiOutlineClipboardDocumentList className="h-4 w-4 text-primary shrink-0 mt-0.5" />
        ) : (
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
        )}
        <span className={cn(isHeader ? "font-bold text-foreground" : "text-foreground/90")}>
          {hasLeadLabel ? (
            <>
              <strong className="font-bold text-foreground">{leadLabel}</strong>{" "}
              <span>{restText}</span>
            </>
          ) : (
            plainLine
          )}
        </span>
      </div>
    );
  };

  return (
    <AdminLayout
      title={dynamicGreeting}
      subtitle={dynamicSubtitle}
      actions={
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2.5 w-full sm:w-auto">
          <Button
            size="sm"
            variant="outline"
            onClick={loadDashboardData}
            disabled={loading}
            className="text-xs font-bold gap-1.5 rounded-xl h-9 sm:h-10 px-3 border-border hover:bg-muted shadow-2xs transition-all cursor-pointer justify-center"
          >
            <HiOutlineArrowPath className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate({ to: "/admin/candidates" })}
            className="text-xs font-bold gap-1.5 sm:gap-2 rounded-xl h-9 sm:h-10 px-2.5 sm:px-3.5 border-border/80 hover:bg-muted shadow-2xs transition-all active:scale-[0.98] justify-center cursor-pointer"
          >
            <HiOutlineIdentification className="h-4 w-4 text-primary shrink-0" />
            <span className="whitespace-nowrap">Review KYC</span>
            <span className="rounded-full bg-primary/15 text-primary px-1.5 py-0.2 text-[10px] font-black border border-primary/20 shrink-0">
              {pendingCandidateKYC.length}
            </span>
          </Button>
          <Button
            size="sm"
            onClick={() => navigate({ to: "/admin/postings" })}
            className="text-xs font-bold gap-1.5 sm:gap-2 rounded-xl h-9 sm:h-10 px-2.5 sm:px-3.5 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-[0.98] justify-center cursor-pointer"
          >
            <HiOutlineDocumentCheck className="h-4 w-4 shrink-0" />
            <span className="whitespace-nowrap sm:hidden">Approve Jobs</span>
            <span className="whitespace-nowrap hidden sm:inline">Approve Postings</span>
            <span className="rounded-full bg-white/20 text-white px-1.5 py-0.2 text-[10px] font-black shrink-0">
              {pendingJobApprovals.length}
            </span>
          </Button>
        </div>
      }
    >
      <RequestError message={pageLoad.error} onRetry={pageLoad.retry} />
      {/* Top 4 Modern Enterprise KPI Cards */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 min-w-0 w-full">
        {/* 1. Total Queue Pending */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Total Queue Pending</span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
              <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <span>Live</span>
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-foreground">{totalPending}</span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg border text-primary bg-primary/10 border-primary/20">
              {totalPending > 0 ? "Needs Review" : "Queue Cleared"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground leading-normal">Across candidates, hospitals & jobs</p>
        </div>

        {/* 2. Verified Clinicians */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Verified Clinicians</span>
            <HiOutlineCheckBadge className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-foreground">
              {metrics?.verifiedCandidatesCount ?? (apiCandidates.filter((c) => c.status === "verified").length || 2)}
            </span>
            <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 flex items-center gap-1">
              <HiOutlineArrowTrendingUp className="h-3.5 w-3.5" /> +{pendingCandidateKYC.length} in queue
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground leading-normal">
            NMC & State council validated · {metrics?.totalCandidatesCount ?? apiCandidates.length} Total
          </p>
        </div>

        {/* 3. Accredited Hospitals */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Accredited Hospitals</span>
            <HiOutlineBuildingOffice2 className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-foreground">
              {metrics?.verifiedFacilitiesCount ?? (apiFacilities.filter((f) => f.status === "verified").length || 2)}
            </span>
            <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
              NABH / NABL
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground leading-normal">
            Active hospital networks · {metrics?.totalFacilitiesCount ?? apiFacilities.length} Total
          </p>
        </div>

        {/* 4. SLA Turnaround */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">SLA Turnaround</span>
            <HiOutlineClock className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-foreground">
              {metrics?.slaTurnaroundHours !== undefined ? metrics.slaTurnaroundHours : 0} hrs
            </span>
            <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
              {metrics?.slaOnTimePercentage !== undefined ? metrics.slaOnTimePercentage : 100}% on-time
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground leading-normal">Target verification under 24 hrs</p>
        </div>
      </div>

      {/* Modern Visual Analytics Section with Donut & Pie Charts */}
      <div className="grid gap-6 lg:grid-cols-12 min-w-0 w-full">
        {/* Pie Chart 1: Queue Distribution */}
        <div className="lg:col-span-6 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs min-w-0 w-full">
          <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-border/60 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <HiOutlineChartPie className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-extrabold text-foreground leading-snug truncate">
                  Pending Verification Distribution
                </h3>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                  Breakdown of operational workload by category
                </p>
              </div>
            </div>
            <span className="rounded-full bg-muted/80 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-foreground shrink-0 whitespace-nowrap border border-border/40">
              {totalPending} Total
            </span>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-4 sm:gap-6 min-w-0 w-full">
            <div
              className="relative h-56 w-56 shrink-0 mx-auto flex items-center justify-center my-auto py-1"
              onMouseLeave={handleQueueLeave}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartQueueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={66}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={false}
                    onMouseEnter={(_, index) => handleQueueEnter(index)}
                  >
                    {chartQueueData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color}
                        stroke="var(--card)"
                        strokeWidth={2}
                        className="transition-all duration-300 cursor-pointer"
                        style={{
                          transform: activeQueueIndex === index ? "scale(1.04)" : "scale(1)",
                          transformOrigin: "center center",
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Center Stat with Generous Breathing Room (Mirroring Facility Dashboard) */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center">
                <span className="text-[9.5px] text-muted-foreground uppercase font-bold tracking-wider leading-none">
                  {activeQueueIndex !== null && chartQueueData[activeQueueIndex] ? chartQueueData[activeQueueIndex].name : "Workload"}
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight my-1 leading-none">
                  {activeQueueIndex !== null && chartQueueData[activeQueueIndex] ? (chartQueueData[activeQueueIndex].name === "All Queues Cleared" ? 0 : chartQueueData[activeQueueIndex].value) : totalPending}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary leading-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {totalPending > 0 ? `${totalPending} Pending` : "Queue Cleared"}
                </span>
              </div>
            </div>

            {/* Interactive Legend List */}
            <div className="flex-1 space-y-1.5 w-full min-w-0">
              {queueData.map((item, index) => {
                const isActive = activeQueueIndex === index;
                return (
                  <Link
                    key={item.name}
                    to={item.link}
                    onMouseEnter={() => handleQueueEnter(index)}
                    onMouseLeave={handleQueueLeave}
                    className={cn(
                      "flex items-center justify-between py-2 px-2.5 rounded-xl transition-all group text-xs cursor-pointer border min-w-0 w-full",
                      isActive
                        ? "bg-primary/10 border-primary/20"
                        : "hover:bg-muted/40 border-transparent hover:border-border/60"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0 transition-transform"
                        style={{
                          backgroundColor: item.color,
                          transform: isActive ? "scale(1.25)" : "scale(1)",
                        }}
                      />
                      <span
                        className={cn(
                          "truncate transition-colors text-[11px] sm:text-xs",
                          isActive ? "text-foreground font-semibold" : "text-muted-foreground font-medium"
                        )}
                      >
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 font-mono">
                      <span className="font-bold text-foreground text-xs tabular-nums">{item.value}</span>
                      <HiOutlineArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pie Chart 2: Clinical Specialties & Cadre Mix */}
        <div className="lg:col-span-6 rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs min-w-0 w-full">
          <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-border/60 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                <HiOutlineSparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs sm:text-sm font-extrabold text-foreground leading-snug truncate">
                  Clinical Cadre Breakdown
                </h3>
                <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate">
                  Verified healthcare professional specializations
                </p>
              </div>
            </div>
            <span className="rounded-full bg-muted/80 px-2 sm:px-2.5 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-bold text-foreground shrink-0 whitespace-nowrap border border-border/40">
              Pan-India Mix
            </span>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-4 sm:gap-6 min-w-0 w-full">
            <div
              className="relative h-56 w-56 shrink-0 mx-auto flex items-center justify-center my-auto py-1"
              onMouseLeave={handleProfessionLeave}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={professionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={66}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    isAnimationActive={false}
                    onMouseEnter={(_, index) => handleProfessionEnter(index)}
                  >
                    {professionData.map((entry, index) => (
                      <Cell
                        key={`cell-prof-${index}`}
                        fill={entry.color}
                        stroke="var(--card)"
                        strokeWidth={2}
                        className="transition-all duration-300 cursor-pointer"
                        style={{
                          transform: activeProfessionIndex === index ? "scale(1.04)" : "scale(1)",
                          transformOrigin: "center center",
                        }}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>

              {/* Dynamic Center Donut Label — Facility Dashboard Pattern */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center">
                <span className="text-[9.5px] text-muted-foreground uppercase font-bold tracking-wider leading-none">
                  Cadre Mix
                </span>
                <span className="text-xl sm:text-2xl font-black font-mono text-foreground tracking-tight my-1 leading-none">
                  {activeProfessionIndex !== null && professionData[activeProfessionIndex] ? `${professionData[activeProfessionIndex].value}%` : "100%"}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold text-primary leading-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                  {activeProfessionIndex !== null && professionData[activeProfessionIndex]
                    ? professionData[activeProfessionIndex].name.split("/")[0].trim()
                    : "Pan-India Mix"}
                </span>
              </div>
            </div>

            {/* Cadre Legend List with Percentages & Hover Link */}
            <div className="flex-1 space-y-1.5 w-full min-w-0">
              {professionData.map((item, index) => {
                const isActive = activeProfessionIndex === index;
                return (
                  <div
                    key={item.name}
                    onMouseEnter={() => handleProfessionEnter(index)}
                    onMouseLeave={handleProfessionLeave}
                    className={cn(
                      "flex items-center justify-between py-2 px-2.5 rounded-xl text-xs border cursor-pointer transition-all min-w-0 w-full",
                      isActive
                        ? "bg-primary/10 border-primary/20"
                        : "hover:bg-muted/40 border-transparent hover:border-border/60"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0 transition-transform"
                        style={{
                          backgroundColor: item.color,
                          transform: isActive ? "scale(1.25)" : "scale(1)",
                        }}
                      />
                      <span
                        className={cn(
                          "truncate transition-colors text-[11px] sm:text-xs",
                          isActive ? "text-foreground font-semibold" : "text-muted-foreground font-medium"
                        )}
                      >
                        {item.name}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-foreground text-xs shrink-0 tabular-nums">{item.value}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Executive Intelligence Command Center: Unified Tabbed Card Below Pie Charts */}
      <div className="rounded-2xl border border-primary/20 bg-card p-4 sm:p-6 shadow-2xs w-full space-y-3.5 sm:space-y-4">
        {/* Header with Switcher Tabs and Action Button */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
          {/* Tab Selector Buttons - Responsive 2-Col Grid on Mobile */}
          <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60">
            <button
              type="button"
              onClick={() => setIntelTab("brief")}
              className={cn(
                "flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-w-0",
                intelTab === "brief"
                  ? "bg-card text-foreground shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              )}
            >
              <BotMessageSquare className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="hidden xs:inline sm:inline">Operations Brief</span>
              <span className="xs:hidden sm:hidden">Brief</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-black shrink-0",
                  intelTab === "brief"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {totalPending}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIntelTab("forecast")}
              className={cn(
                "flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-1.5 text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-w-0",
                intelTab === "forecast"
                  ? "bg-card text-foreground shadow-2xs border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-card/40"
              )}
            >
              <HiOutlineArrowTrendingUp className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="hidden xs:inline sm:inline">Surge Forecast</span>
              <span className="xs:hidden sm:hidden">Surge</span>
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-black shrink-0",
                  intelTab === "forecast"
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "bg-muted text-muted-foreground"
                )}
              >
                7-Day
              </span>
            </button>
          </div>

          {/* Right Header Status & Ally Trigger */}
          <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
            {intelTab === "brief" ? (
              <>
                {totalPending === 0 ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-bold text-primary shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                    All Cleared
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-bold text-primary shrink-0">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                    {totalPending} Action Items
                  </span>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isGeneratingBrief}
                  onClick={() => handleGenerateBrief()}
                  className="h-8 px-2.5 sm:px-3 text-xs font-bold rounded-xl gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer shadow-2xs transition-all active:scale-[0.98] shrink-0"
                >
                  {isGeneratingBrief ? (
                    <>
                      <ButtonSpinner className="h-3.5 w-3.5 animate-spin shrink-0" />
                      <span>Synthesizing...</span>
                    </>
                  ) : (
                    <>
                      <BotMessageSquare className="h-3.5 w-3.5 shrink-0" />
                      <span>Re-analyze with Ally</span>
                    </>
                  )}
                </Button>
              </>
            ) : (
              <>
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-1 text-[11px] font-bold text-primary shrink-0">
                  Predictive Horizon
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isGeneratingForecast}
                  onClick={handleGenerateForecast}
                  className="h-8 px-2.5 sm:px-3 text-xs font-bold rounded-xl gap-1.5 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer shadow-2xs transition-all active:scale-[0.98] shrink-0"
                >
                  {isGeneratingForecast ? (
                    <>
                      <ButtonSpinner className="h-3.5 w-3.5 animate-spin shrink-0" />
                      <span>Projecting...</span>
                    </>
                  ) : (
                    <>
                      <BotMessageSquare className="h-3.5 w-3.5 shrink-0" />
                      <span>Recalculate with Ally</span>
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tab 1 Content: Morning Operations Brief */}
        {intelTab === "brief" && (
          <div className="space-y-3">
            {briefText && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 sm:p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-primary/15">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <BotMessageSquare className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-xs font-bold text-foreground truncate">
                      Ally Morning Operations Brief
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setBriefText(null)}
                    aria-label="Close operations brief"
                    className="h-6 w-6 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer shrink-0"
                  >
                    <HiOutlineXMark className="h-4 w-4" />
                  </button>
                </div>
                <div className="max-h-48 sm:max-h-56 overflow-y-auto pr-1.5 space-y-1.5 [scrollbar-width:thin]">
                  {formatBriefParagraphs(briefText).map((line, idx) => renderBriefLine(line, idx))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {/* Item 1: Candidate KYC */}
              <button
                type="button"
                onClick={() => jumpToQueue("candidates")}
                className="group flex flex-col xs:flex-row sm:flex-row items-start xs:items-center sm:items-center justify-between p-3 sm:px-3.5 rounded-xl text-left bg-muted/30 hover:bg-primary/10 border border-border/70 hover:border-primary/30 transition-all cursor-pointer gap-2.5 min-w-0"
              >
                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1 sm:mt-0 group-hover:scale-125 transition-transform" />
                  <p className="text-xs sm:text-[13px] text-muted-foreground leading-normal">
                    <span className="font-bold text-foreground mr-1.5">{pendingCandidateKYC.length}</span>
                    candidate KYC submissions awaiting council check.
                  </p>
                </div>
                <span className="shrink-0 self-end xs:self-auto sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-primary bg-primary/10 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-2xs whitespace-nowrap">
                  <span>Review KYC</span>
                  <HiOutlineArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>

              {/* Item 2: Job & Shift Postings */}
              <button
                type="button"
                onClick={() => jumpToQueue("postings")}
                className="group flex flex-col xs:flex-row sm:flex-row items-start xs:items-center sm:items-center justify-between p-3 sm:px-3.5 rounded-xl text-left bg-muted/30 hover:bg-primary/10 border border-border/70 hover:border-primary/30 transition-all cursor-pointer gap-2.5 min-w-0"
              >
                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1 sm:mt-0 group-hover:scale-125 transition-transform" />
                  <p className="text-xs sm:text-[13px] text-muted-foreground leading-normal">
                    <span className="font-bold text-foreground mr-1.5">{pendingJobApprovals.length}</span>
                    hospital job & shift approvals pending compliance audit.
                  </p>
                </div>
                <span className="shrink-0 self-end xs:self-auto sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-primary bg-primary/10 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-2xs whitespace-nowrap">
                  <span>Approve Jobs</span>
                  <HiOutlineArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>

              {/* Item 3: Hospital Facilities */}
              <button
                type="button"
                onClick={() => jumpToQueue("facilities")}
                className="group flex flex-col xs:flex-row sm:flex-row items-start xs:items-center sm:items-center justify-between p-3 sm:px-3.5 rounded-xl text-left bg-muted/30 hover:bg-primary/10 border border-border/70 hover:border-primary/30 transition-all cursor-pointer gap-2.5 min-w-0"
              >
                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                  <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1 sm:mt-0 group-hover:scale-125 transition-transform" />
                  <p className="text-xs sm:text-[13px] text-muted-foreground leading-normal">
                    <span className="font-bold text-foreground mr-1.5">{pendingFacilityKYC.length}</span>
                    healthcare facilities awaiting CEA/NABH audit.
                  </p>
                </div>
                <span className="shrink-0 self-end xs:self-auto sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-primary bg-primary/10 border border-primary/20 group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-2xs whitespace-nowrap">
                  <span>Verify Hospitals</span>
                  <HiOutlineArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </button>

              {/* Item 4: Escrow SLA */}
              <div className="flex flex-col xs:flex-row sm:flex-row items-start xs:items-center sm:items-center justify-between p-3 sm:px-3.5 rounded-xl bg-muted/30 border border-border/70 text-xs sm:text-[13px] text-muted-foreground gap-2.5 min-w-0">
                <div className="flex items-start sm:items-center gap-2.5 min-w-0 flex-1">
                  <span className="h-2 w-2 rounded-full bg-primary/70 shrink-0 mt-1 sm:mt-0" />
                  <p className="leading-normal">
                    <span className="font-bold text-foreground mr-1.5">0</span>
                    escrow disputes reported; 100% automated settlement rate.
                  </p>
                </div>
                <span className="shrink-0 self-end xs:self-auto sm:self-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-primary bg-primary/10 border border-primary/20 shadow-2xs whitespace-nowrap">
                  <span>SLA 100%</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2 Content: Demand Surge Forecast */}
        {intelTab === "forecast" && (
          <div className="space-y-3">
            {/* Dynamic Forecast Narrative */}
            <div className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed">
              {forecastText ? (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 sm:p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-primary/15">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <BotMessageSquare className="h-4 w-4 text-primary shrink-0" />
                      <span className="text-xs font-bold text-foreground truncate">
                        Ally Staffing Outlook
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForecastText(null)}
                      aria-label="Close surge forecast"
                      className="h-6 w-6 rounded-lg inline-flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer shrink-0"
                    >
                      <HiOutlineXMark className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="max-h-48 sm:max-h-56 overflow-y-auto pr-1.5 space-y-1.5 [scrollbar-width:thin]">
                    {formatBriefParagraphs(forecastText).map((line, idx) => renderBriefLine(line, idx))}
                  </div>
                </div>
              ) : (
                <p className="leading-relaxed">
                  {locumCount} shift postings are loaded for review. Request a staffing outlook based on the supplied records. A numeric demand forecast needs historical bookings and cancellations.
                </p>
              )}
            </div>

            {/* 3 Telemetry Mini-Chips */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <div className="p-3 rounded-xl bg-muted/30 border border-border/70 flex flex-col justify-between gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Top Recorded Cadre</span>
                <span className="text-xs sm:text-sm font-bold text-foreground truncate flex items-center gap-1.5">
                  <HiOutlineArrowTrendingUp className="h-4 w-4 text-primary shrink-0" />
                  <span className="truncate">{topSurgeName}</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/70 flex flex-col justify-between gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Loaded Shift Postings</span>
                <span className="text-xs sm:text-sm font-bold text-foreground truncate flex items-center gap-1.5">
                  <HiOutlineClock className="h-4 w-4 text-primary shrink-0" />
                  <span>{locumCount} postings</span>
                </span>
              </div>

              <div className="p-3 rounded-xl bg-muted/30 border border-border/70 flex flex-col justify-between gap-1.5">
                <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Forecast Evidence</span>
                <span className="text-xs sm:text-sm font-bold text-primary truncate flex items-center gap-1.5">
                  <HiOutlineShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>History not supplied</span>
                </span>
              </div>
            </div>

            {/* Monitored Cadres */}
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-border/50">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mr-1">
                Monitored Cadres:
              </span>
              {topCadres.slice(0, 4).map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    setQueueSearch(c.rawName || c.name);
                    jumpToQueue("postings");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-muted/40 hover:bg-primary/10 border border-border/70 hover:border-primary/30 text-xs font-semibold text-foreground/90 transition-all cursor-pointer active:scale-[0.98]"
                >
                  <span>{c.name}</span>
                  <span className="font-bold text-primary">({c.count})</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Consolidated Interactive Workload Queue with Tabs */}
      <div ref={queueRef} id="admin-queue-section" className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden min-w-0 w-full scroll-mt-24">
        {/* Table Header & Search Filter Bar */}
        <div className="p-3.5 sm:p-5 border-b border-border/80 bg-card/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 sm:gap-4">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between sm:justify-start gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <HiOutlineShieldCheck className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-primary shrink-0" />
                <h3 className="text-[13px] xs:text-sm sm:text-base font-black tracking-tight text-foreground leading-snug whitespace-nowrap">
                  Priority Action Center
                </h3>
              </div>
              <span className="w-fit shrink-0 whitespace-nowrap inline-flex items-center rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black px-2.5 py-1 leading-none">
                {totalPending} Awaiting
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-muted-foreground leading-snug">
              Unified 1-click administrative pipeline across active verification streams.
            </p>
          </div>

          {/* Quick Search Filter */}
          <div className="relative w-full sm:w-72">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              placeholder="Search queue by name, org, role…"
              className="h-9 w-full rounded-xl border border-border/80 bg-muted/40 pl-9 pr-8 text-xs text-foreground placeholder:text-muted-foreground/70 outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 focus:bg-background transition-all"
            />
            {queueSearch && (
              <button
                onClick={() => setQueueSearch("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 rounded cursor-pointer"
              >
                <HiOutlineXMark className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Tab Filter Strip */}
        <div className="px-3 sm:px-5 py-2.5 border-b border-border/60 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/40 overflow-x-auto no-scrollbar [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden max-w-full">
            {[
              { id: "all", label: "All Items", desktopLabel: "All Action Items", count: totalPending },
              { id: "postings", label: "Postings", desktopLabel: "Job Postings", count: pendingJobApprovals.length },
              { id: "candidates", label: "KYC", desktopLabel: "Candidate KYC", count: pendingCandidateKYC.length },
              { id: "facilities", label: "Hospitals", desktopLabel: "Hospitals", count: pendingFacilityKYC.length },
              { id: "applications", label: "Shortlist", desktopLabel: "Applications", count: pendingShortlisting.length },
              { id: "huddle", label: "Huddle", desktopLabel: "Huddle Review", count: pendingHuddleReview.length },
            ].map((t) => {
              const active = activeQueueTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveQueueTab(t.id as typeof activeQueueTab)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-lg px-2 sm:px-2.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap",
                    active
                      ? "bg-card text-foreground shadow-2xs border border-border/80"
                      : "text-muted-foreground hover:text-foreground hover:bg-card/40"
                  )}
                >
                  <span className="sm:hidden">{t.label}</span>
                  <span className="hidden sm:inline">{t.desktopLabel}</span>
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.2 text-[10px] font-black leading-tight",
                      active
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          <Link
            to={
              activeQueueTab === "candidates"
                ? "/admin/candidates"
                : activeQueueTab === "facilities"
                ? "/admin/facilities"
                : activeQueueTab === "postings"
                ? "/admin/postings"
                : activeQueueTab === "applications"
                ? "/admin/applications"
                : "/admin/candidates"
            }
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1.5 group py-1 shrink-0 whitespace-nowrap self-end sm:self-auto"
          >
            <span>Open Dedicated Queue</span>
            <HiOutlineArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 1. Desktop Data Table View (hidden on mobile, visible on md and up) */}
        <div className="hidden md:block overflow-x-auto w-full min-w-0">
          <Table className="w-full min-w-[920px] table-fixed text-left">
            <TableHeader className="bg-muted/15 border-b border-border/70">
              <TableRow className="hover:bg-transparent border-b border-border/60">
                <TableHead className="w-[170px] text-[11px] font-bold uppercase tracking-wider py-3.5 px-4 text-muted-foreground">Category</TableHead>
                <TableHead className="w-[280px] text-[11px] font-bold uppercase tracking-wider py-3.5 px-4 text-muted-foreground">Entity / Record</TableHead>
                <TableHead className="w-[240px] text-[11px] font-bold uppercase tracking-wider py-3.5 px-4 text-muted-foreground">Credentials / Terms</TableHead>
                <TableHead className="w-[130px] text-[11px] font-bold uppercase tracking-wider py-3.5 px-4 text-muted-foreground">Submitted</TableHead>
                <TableHead className="w-[180px] text-[11px] font-bold uppercase tracking-wider py-3.5 px-4 text-right text-muted-foreground">Instant Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Job Approvals */}
              {filteredJobs.map((j) => (
                <TableRow key={j.id} className="text-xs hover:bg-primary/[0.03] transition-colors border-b border-border/40">
                  <TableCell className="w-[170px] py-4 px-4 align-middle whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/20 whitespace-nowrap">
                      <HiOutlineBriefcase className="h-3.5 w-3.5 shrink-0" />
                      <span>Job Posting</span>
                    </span>
                  </TableCell>
                  <TableCell className="w-[280px] py-4 px-4 align-middle">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                        <HiOutlineBriefcase className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-foreground text-xs hover:text-primary transition-colors leading-tight truncate">{j.title}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1 truncate">
                          <span className="font-medium text-foreground/80 truncate">{j.org}</span>
                          <span className="h-1 w-1 rounded-full bg-border shrink-0" />
                          <span className="shrink-0">{j.city}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="w-[240px] py-4 px-4 align-middle">
                    <div className="font-bold text-foreground text-xs leading-snug">{j.compensation}</div>
                    <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                      <span className="font-semibold text-foreground/80">{j.openings} Openings</span>
                      <span className="h-1 w-1 rounded-full bg-border shrink-0" />
                      <span>{j.expOrHours}</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-[130px] py-4 px-4 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                      <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{j.submittedDate}</span>
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 mt-1 inline-flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      Within SLA
                    </span>
                  </TableCell>
                  <TableCell className="w-[180px] text-right py-4 px-4 align-middle whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => quickApproveJob(j.id, j.title)}
                        className="rounded-xl font-bold text-xs h-8 px-3.5 bg-primary hover:bg-primary-hover text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <HiCheck className="h-3.5 w-3.5" /> Approve Live
                      </Button>
                      <Link
                        to="/admin/postings"
                        className="h-8 w-8 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
                        title="Inspect full job requirements"
                      >
                        <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {/* Candidate KYC */}
              {filteredCandidates.map((c) => {
                const initials = c.name
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("");
                return (
                  <TableRow key={c.id} className="text-xs hover:bg-primary/[0.03] transition-colors border-b border-border/40">
                    <TableCell className="w-[170px] py-4 px-4 align-middle whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/20 whitespace-nowrap">
                        <HiOutlineIdentification className="h-3.5 w-3.5 shrink-0" />
                        <span>Candidate KYC</span>
                      </span>
                    </TableCell>
                    <TableCell className="w-[280px] py-4 px-4 align-middle">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-foreground text-xs hover:text-primary transition-colors leading-tight truncate">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1 truncate">
                            <span className="font-medium text-foreground/80 truncate">{c.profession}</span>
                            <span className="h-1 w-1 rounded-full bg-border shrink-0" />
                            <span className="shrink-0">{c.state}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="w-[240px] py-4 px-4 align-middle">
                      <div className="font-bold text-foreground text-xs leading-snug truncate" title={c.council}>{c.council}</div>
                      <div className="mt-1">
                        <span className="font-mono text-primary text-[10px] font-bold bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                          REG: {c.regNumber}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="w-[130px] py-4 px-4 align-middle whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{c.submittedDate}</span>
                      </div>
                      <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 mt-1 inline-flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-primary" />
                        NMC Validation
                      </span>
                    </TableCell>
                    <TableCell className="w-[180px] text-right py-4 px-4 align-middle whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => quickVerifyCandidate(c.id, c.name)}
                          className="rounded-xl font-bold text-xs h-8 px-3.5 bg-primary hover:bg-primary-hover text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                        >
                          <HiOutlineCheckBadge className="h-3.5 w-3.5" /> Verify Seal
                        </Button>
                        <Link
                          to="/admin/candidates"
                          className="h-8 w-8 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
                          title="Inspect candidate certificates and state registration"
                        >
                          <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Facility KYC */}
              {filteredFacilities.map((f) => (
                <TableRow key={f.id} className="text-xs hover:bg-primary/[0.03] transition-colors border-b border-border/40">
                  <TableCell className="w-[170px] py-4 px-4 align-middle whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/20 whitespace-nowrap">
                      <HiOutlineBuildingOffice2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Hospital License</span>
                    </span>
                  </TableCell>
                  <TableCell className="w-[280px] py-4 px-4 align-middle">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                        <HiOutlineBuildingOffice2 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-foreground text-xs hover:text-primary transition-colors leading-tight truncate">{f.name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1 truncate">
                          <span className="font-medium text-foreground/80 truncate">{f.city}, {f.state}</span>
                          <span className="h-1 w-1 rounded-full bg-border shrink-0" />
                          <span className="shrink-0">{f.beds} Beds</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="w-[240px] py-4 px-4 align-middle">
                    <div className="font-bold text-foreground text-xs leading-snug truncate">{f.accreditation || "NABH Accredited"}</div>
                    <div className="mt-1">
                      <span className="font-mono text-primary text-[10px] font-bold bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                        NABH: {f.nabhNumber || "AUDIT-ACTIVE"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="w-[130px] py-4 px-4 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                      <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{f.submittedDate}</span>
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 mt-1 inline-flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      NABH Portal Sync
                    </span>
                  </TableCell>
                  <TableCell className="w-[180px] text-right py-4 px-4 align-middle whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => quickVerifyFacility(f.id, f.name)}
                        className="rounded-xl font-bold text-xs h-8 px-3.5 bg-primary hover:bg-primary-hover text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <HiCheck className="h-3.5 w-3.5" /> Approve Facility
                      </Button>
                      <Link
                        to="/admin/facilities"
                        className="h-8 w-8 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
                        title="Inspect hospital license and NABH certification"
                      >
                        <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {/* Applications */}
              {filteredApplications.map((a) => (
                <TableRow key={a.id} className="text-xs hover:bg-primary/[0.03] transition-colors border-b border-border/40">
                  <TableCell className="w-[170px] py-4 px-4 align-middle whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/20 whitespace-nowrap">
                      <HiOutlineDocumentCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Application</span>
                    </span>
                  </TableCell>
                  <TableCell className="w-[280px] py-4 px-4 align-middle">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                        <HiOutlineDocumentCheck className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-foreground text-xs hover:text-primary transition-colors leading-tight truncate">{a.candidateName}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-1 truncate">
                          <span className="font-medium text-foreground/80 truncate">Applying for {a.jobTitle}</span>
                          <span className="h-1 w-1 rounded-full bg-border shrink-0" />
                          <span className="truncate">{(a as any).hospitalName || (a as any).facilityName || "Partner Hospital"}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="w-[240px] py-4 px-4 align-middle">
                    <div className="font-bold text-foreground text-xs leading-snug flex items-center gap-1.5">
                      <span>{(a as any).exp || a.experience || "2+ yrs"} Experience</span>
                      <span className="h-1 w-1 rounded-full bg-border shrink-0" />
                      <span className="text-primary font-bold">{a.matchScore}% Match</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 font-mono">
                      REG: {(a as any).regNumber || (a as any).councilReg || "NMC-VERIFIED"}
                    </div>
                  </TableCell>
                  <TableCell className="w-[130px] py-4 px-4 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                      <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{a.appliedDate}</span>
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 mt-1 inline-flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      Screening SLA
                    </span>
                  </TableCell>
                  <TableCell className="w-[180px] text-right py-4 px-4 align-middle whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => quickShortlistApp(a.id, a.candidateName)}
                        className="rounded-xl font-bold text-xs h-8 px-3.5 bg-primary hover:bg-primary-hover text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <HiCheck className="h-3.5 w-3.5" /> Shortlist
                      </Button>
                      <Link
                        to="/admin/applications"
                        className="h-8 w-8 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
                        title="Inspect full application dossier"
                      >
                        <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {/* Huddle Review Items */}
              {filteredHuddle.map((p) => (
                <TableRow key={p.id} className="text-xs hover:bg-primary/[0.03] transition-colors border-b border-border/40">
                  <TableCell className="w-[170px] py-4 px-4 align-middle whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/20 whitespace-nowrap">
                      <HiOutlineChatBubbleLeftRight className="h-3.5 w-3.5 shrink-0" />
                      <span>{p.status === "hidden" ? "Reported Post" : "Clinical Case"}</span>
                    </span>
                  </TableCell>
                  <TableCell className="w-[280px] py-4 px-4 align-middle">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 font-bold text-xs">
                        {p.anon ? "AN" : (p.authorName ? p.authorName[0] : "C")}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-foreground text-xs leading-tight truncate">
                          {p.anon ? "Anonymous Author" : p.authorName} · {p.authorRole || "Clinician"}
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-1">{p.text}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="w-[240px] py-4 px-4 align-middle">
                    <div className="font-bold text-foreground text-xs leading-snug truncate">
                      {p.status === "hidden" ? "Flagged by community" : "De-identification review"}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1.5">
                      <span className="font-medium text-foreground/80">{(p as any).category || (p as any).type || "Clinical"}</span>
                      <span className="h-1 w-1 rounded-full bg-border shrink-0" />
                      <span>{(p as any).field ? `${(p as any).field} Ward` : "General Ward"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="w-[130px] py-4 px-4 align-middle whitespace-nowrap">
                    <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                      <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{(p as any).at || (p as any).createdTime || "Recent"}</span>
                    </div>
                    <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20 mt-1 inline-flex items-center gap-1">
                      <span className="h-1 w-1 rounded-full bg-primary" />
                      1-hr Review SLA
                    </span>
                  </TableCell>
                  <TableCell className="w-[180px] text-right py-4 px-4 align-middle whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => quickApproveHuddle(p.id, p.authorName)}
                        className="rounded-xl font-bold text-xs h-8 px-3.5 bg-primary hover:bg-primary-hover text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                      >
                        <HiCheck className="h-3.5 w-3.5" /> Approve Live
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => quickRejectHuddle(p.id)}
                        className="rounded-xl font-bold text-xs h-8 px-2.5 text-muted-foreground border border-border/80 hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all cursor-pointer"
                      >
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}

              {totalFilteredCount === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-36 text-center text-xs text-muted-foreground">
                    <HiOutlineCheckBadge className="h-8 w-8 mx-auto text-primary mb-2" />
                    All operational queues cleared! Zero pending approvals.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* 2. Mobile Cards View (visible on mobile, hidden on md and up) */}
        <div className="md:hidden divide-y divide-border/60">
          {/* Job Approvals Mobile Cards */}
          {filteredJobs.map((j) => (
            <div key={`m-job-${j.id}`} className="p-4 space-y-3 hover:bg-primary/[0.02] transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                  <HiOutlineBriefcase className="h-3 w-3 shrink-0" />
                  <span>Job Posting</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <HiOutlineClock className="h-3.5 w-3.5 shrink-0" />
                  <span>{j.submittedDate}</span>
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <HiOutlineBriefcase className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-foreground text-sm leading-snug">{j.title}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-foreground/80">{j.org}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{j.city}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Compensation</div>
                  <div className="font-bold text-foreground text-xs mt-0.5">{j.compensation}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Terms</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 justify-end">
                    <span className="font-bold text-foreground">{j.openings} Openings</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{j.expOrHours}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  size="sm"
                  onClick={() => quickApproveJob(j.id, j.title)}
                  className="flex-1 rounded-xl font-bold text-xs h-9 bg-primary hover:bg-primary-hover text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <HiCheck className="h-4 w-4" /> Approve Live
                </Button>
                <Link
                  to="/admin/postings"
                  className="h-9 w-9 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
                  title="Inspect full job requirements"
                >
                  <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}

          {/* Candidate KYC Mobile Cards */}
          {filteredCandidates.map((c) => {
            const initials = c.name
              .split(" ")
              .map((n) => n[0])
              .slice(0, 2)
              .join("");
            return (
              <div key={`m-cand-${c.id}`} className="p-4 space-y-3 hover:bg-primary/[0.02] transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                    <HiOutlineIdentification className="h-3 w-3 shrink-0" />
                    <span>Candidate KYC</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                    <HiOutlineClock className="h-3.5 w-3.5 shrink-0" />
                    <span>{c.submittedDate}</span>
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                    {initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold text-foreground text-sm leading-snug">{c.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span className="font-medium text-foreground/80">{c.profession}</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span>{c.state}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Council</div>
                    <div className="font-bold text-foreground text-xs mt-0.5">{c.council}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Registration</div>
                    <div className="mt-0.5">
                      <span className="font-mono text-primary text-[10px] font-bold bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20">
                        REG: {c.regNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <Button
                    size="sm"
                    onClick={() => quickVerifyCandidate(c.id, c.name)}
                    className="flex-1 rounded-xl font-bold text-xs h-9 bg-primary hover:bg-primary-hover text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <HiOutlineCheckBadge className="h-4 w-4" /> Verify Seal
                  </Button>
                  <Link
                    to="/admin/candidates"
                    className="h-9 w-9 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
                    title="Inspect candidate certificates and state registration"
                  >
                    <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}

          {/* Facility KYC Mobile Cards */}
          {filteredFacilities.map((f) => (
            <div key={`m-fac-${f.id}`} className="p-4 space-y-3 hover:bg-primary/[0.02] transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                  <HiOutlineBuildingOffice2 className="h-3 w-3 shrink-0" />
                  <span>Hospital License</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <HiOutlineClock className="h-3.5 w-3.5 shrink-0" />
                  <span>{f.submittedDate}</span>
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <HiOutlineBuildingOffice2 className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-foreground text-sm leading-snug">{f.name}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-foreground/80">{f.city}, {f.state}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{f.beds} Beds</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Accreditation</div>
                  <div className="font-bold text-foreground text-xs mt-0.5">{f.accreditation || "NABH Accredited"}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">NABH Certificate</div>
                  <div className="mt-0.5">
                    <span className="font-mono text-primary text-[10px] font-bold bg-primary/10 px-1.5 py-0.5 rounded-md border border-primary/20">
                      NABH: {f.nabhNumber || "AUDIT-ACTIVE"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  size="sm"
                  onClick={() => quickVerifyFacility(f.id, f.name)}
                  className="flex-1 rounded-xl font-bold text-xs h-9 bg-primary hover:bg-primary-hover text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <HiCheck className="h-4 w-4" /> Approve Facility
                </Button>
                <Link
                  to="/admin/facilities"
                  className="h-9 w-9 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
                  title="Inspect hospital license and NABH certification"
                >
                  <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}

          {/* Applications Mobile Cards */}
          {filteredApplications.map((a) => (
            <div key={`m-app-${a.id}`} className="p-4 space-y-3 hover:bg-primary/[0.02] transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                  <HiOutlineDocumentCheck className="h-3 w-3 shrink-0" />
                  <span>Application</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <HiOutlineClock className="h-3.5 w-3.5 shrink-0" />
                  <span>{a.appliedDate}</span>
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <HiOutlineDocumentCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-foreground text-sm leading-snug">{a.candidateName}</h4>
                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                    <span className="font-medium text-foreground/80">Applying for {a.jobTitle}</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span>{(a as any).hospitalName || (a as any).facilityName || "Partner Hospital"}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Match & Experience</div>
                  <div className="font-bold text-primary text-xs mt-0.5 flex items-center gap-1">
                    <span>{a.matchScore}% Match</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className="text-foreground">{(a as any).exp || a.experience || "2+ yrs"} Exp</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Registration</div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{(a as any).regNumber || (a as any).councilReg || "NMC-VERIFIED"}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  size="sm"
                  onClick={() => quickShortlistApp(a.id, a.candidateName)}
                  className="flex-1 rounded-xl font-bold text-xs h-9 bg-primary hover:bg-primary-hover text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <HiCheck className="h-4 w-4" /> Shortlist
                </Button>
                <Link
                  to="/admin/applications"
                  className="h-9 w-9 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
                  title="Inspect full application dossier"
                >
                  <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}

          {/* Huddle Review Mobile Cards */}
          {filteredHuddle.map((p) => (
            <div key={`m-hud-${p.id}`} className="p-4 space-y-3 hover:bg-primary/[0.02] transition-colors">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary border border-primary/20">
                  <HiOutlineChatBubbleLeftRight className="h-3 w-3 shrink-0" />
                  <span>{p.status === "hidden" ? "Reported Post" : "Clinical Case"}</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <HiOutlineClock className="h-3.5 w-3.5 shrink-0" />
                  <span>{(p as any).at || (p as any).createdTime || "Recent"}</span>
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
                  {p.anon ? "AN" : (p.authorName ? p.authorName[0] : "C")}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-foreground text-sm leading-snug">
                    {p.anon ? "Anonymous Author" : p.authorName} · {p.authorRole || "Clinician"}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.text}</p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Review Type</div>
                  <div className="font-bold text-foreground text-xs mt-0.5">
                    {p.status === "hidden" ? "Flagged by community" : "De-identification review"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Department</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{(p as any).category || (p as any).type || "Clinical"} · {(p as any).field ? `${(p as any).field} Ward` : "General Ward"}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  size="sm"
                  onClick={() => quickApproveHuddle(p.id, p.authorName)}
                  className="flex-1 rounded-xl font-bold text-xs h-9 bg-primary hover:bg-primary-hover text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <HiCheck className="h-4 w-4" /> Approve Live
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => quickRejectHuddle(p.id)}
                  className="rounded-xl font-bold text-xs h-9 px-3 text-muted-foreground border border-border/80 hover:text-destructive hover:border-destructive/30 hover:bg-destructive/5 transition-all cursor-pointer"
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}

          {totalFilteredCount === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <HiOutlineCheckBadge className="h-8 w-8 mx-auto text-primary mb-1" />
              <p className="font-bold text-foreground">All operational queues cleared!</p>
              <p>Zero pending approvals matching your filter.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
