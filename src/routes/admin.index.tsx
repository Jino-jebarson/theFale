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
} from "react-icons/hi2";
import { MdWavingHand } from "react-icons/md";
import { toast } from "sonner";
import { BotMessageSquare } from "lucide-react";
import { AdminLayout } from "@/components/fale/AdminLayout";
import { Button } from "@/components/ui/button";
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

  // AI Operations Brief & Demand Surge Forecast State
  const [briefText, setBriefText] = useState<string | null>(null);
  const [isGeneratingBrief, setIsGeneratingBrief] = useState(false);

  const [forecastText, setForecastText] = useState<string | null>(null);
  const [isGeneratingForecast, setIsGeneratingForecast] = useState(false);

  const handleGenerateBrief = async (overrideMetrics?: any) => {
    setIsGeneratingBrief(true);
    try {
      const pKyc = overrideMetrics?.pendingKyc ?? pendingCandidateKYC.length;
      const pJobs = overrideMetrics?.pendingJobs ?? pendingJobApprovals.length;
      const pFac = overrideMetrics?.pendingFacilities ?? pendingFacilityKYC.length;
      const aShifts = overrideMetrics?.activeShifts ?? apiJobs.filter((j) => j.type === "shift").length;

      const res = await getDailyMorningBriefWithAi({
        pendingKyc: pKyc,
        pendingJobs: pJobs,
        pendingFacilities: pFac,
        activeShifts: aShifts,
        disputes: 0,
      });
      const text = res.response || res.content || "";
      if (text) {
        setBriefText(text);
        toast.success("Morning Operations Brief updated with live AI");
      }
    } catch (err: any) {
      console.warn("Brief generation error:", err);
      toast.error("Failed to generate AI morning brief");
    } finally {
      setIsGeneratingBrief(false);
    }
  };

  const handleGenerateForecast = async () => {
    setIsGeneratingForecast(true);
    try {
      const res = await getDemandForecastWithAi({
        metro: "Bengaluru & Chennai Healthcare Corridors",
        topSpecialties: ["ICU Critical Care Nurses", "Dialysis Technicians", "Emergency Medical Officers", "OT Specialists"],
        surgeWeekendMultiplier: 1.35,
      });
      const text = res.response || res.content || "";
      if (text) {
        setForecastText(text);
        toast.success("7-Day Demand Surge Forecast recalculated with live AI");
      }
    } catch (err: any) {
      console.warn("Forecast generation error:", err);
      toast.error("Failed to generate AI demand forecast");
    } finally {
      setIsGeneratingForecast(false);
    }
  };

  const loadDashboardData = async () => {
    if (!isApiEnabled) return;
    try {
      setLoading(true);
      const [metricsRes, jobsRes, facRes, candRes, appsRes, huddleRes, shiftsRes, shiftClaimsRes] = await Promise.all([
        getAdminDashboardMetrics().catch(() => null),
        getPendingJobPostings("all").catch(() => []),
        getPendingFacilityKyc("all").catch(() => []),
        getPendingCandidateKyc("all").catch(() => []),
        getAdminApplications("all").catch(() => []),
        getFlaggedHuddlePosts().catch(() => []),
        getPendingShifts().catch(() => []),
        getPendingShiftClaims().catch(() => []),
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
          city: j.city || j.facilityCity || "Chennai",
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
          city: s.city || "Chennai",
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
          city: f.city || "Chennai",
          state: f.state || "Tamil Nadu",
          licenseNumber: f.licenseNumber || f.ceaRegistrationNumber || "CEA-REG-ACTIVE",
          nabhNumber: f.nabhNumber || f.nabhAccreditationNumber || "NABH-AUDIT-ACTIVE",
          beds: f.bedCapacity || 100,
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
          state: c.state || c.city || "Tamil Nadu",
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
          candidateCity: a.candidateCity || a.city || "Chennai",
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
          candidateCity: sc.candidateCity || "Chennai",
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
      toast.error("Failed to load admin queue", { description: err?.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const pendingCandidateKYC = isApiEnabled
    ? apiCandidates.filter((c) => c.status === "pending")
    : s.candidateKYC.filter((c) => c.status === "pending");
  const pendingFacilityKYC = isApiEnabled
    ? apiFacilities.filter((f) => f.status === "pending")
    : s.facilityKYC.filter((f) => f.status === "pending");
  const pendingJobApprovals = isApiEnabled
    ? apiJobs.filter((j) => j.status === "pending")
    : s.jobApprovals.filter((j) => j.status === "pending");
  const pendingShortlisting = isApiEnabled
    ? apiApps.filter((a) => a.status === "pending_admin")
    : s.adminApplications.filter((a) => a.status === "pending_admin");
  const pendingHuddleReview = isApiEnabled
    ? apiHuddle.filter((p) => p.status === "review" || p.status === "hidden")
    : s.huddlePosts.filter((p) => p.status === "review" || p.status === "hidden");

  const totalPending =
    pendingCandidateKYC.length +
    pendingFacilityKYC.length +
    pendingJobApprovals.length +
    pendingShortlisting.length +
    pendingHuddleReview.length;

  const quickApproveHuddle = async (id: string, authorName: string) => {
    if (isApiEnabled) {
      try {
        await moderateHuddlePost(id, false);
        toast.success("Huddle Post Approved & Live!", {
          description: `Post by ${authorName} is now published to the public Huddle feed.`,
        });
        loadDashboardData();
      } catch (err: any) {
        toast.error("Moderation failed", { description: err?.message });
      }
      return;
    }
    approveHuddlePost(id);
    toast.success("Huddle Post Approved & Live!", {
      description: `Post by ${authorName} is now published to the public Huddle feed.`,
    });
  };

  const quickRejectHuddle = async (id: string) => {
    if (isApiEnabled) {
      try {
        await moderateHuddlePost(id, true);
        toast.info("Post Removed from Huddle", {
          description: "Post was permanently removed for privacy or guideline violations.",
        });
        loadDashboardData();
      } catch (err: any) {
        toast.error("Moderation failed", { description: err?.message });
      }
      return;
    }
    rejectHuddlePost(id);
    toast.info("Post Removed from Huddle", {
      description: "Post was permanently removed for privacy or guideline violations.",
    });
  };

  const quickApproveJob = async (id: string, title: string) => {
    if (isApiEnabled) {
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
        toast.error("Approval failed", { description: err?.message });
      }
      return;
    }
    setState((state) => ({
      jobApprovals: state.jobApprovals.map((j) =>
        j.id === id ? { ...j, status: "approved" as const } : j
      ),
    }));
    toast.success("Job Requirement Approved!", {
      description: `"${title}" is now published and live on the Candidate Portal.`,
    });
  };

  const quickVerifyCandidate = async (id: string, name: string) => {
    if (isApiEnabled) {
      try {
        await reviewCandidateKyc(id, "APPROVE", "Verified state council credentials");
        toast.success("Candidate Verified!", {
          description: `${name}'s state council credentials verified and granted verified seal.`,
        });
        loadDashboardData();
      } catch (err: any) {
        toast.error("Verification failed", { description: err?.message });
      }
      return;
    }
    setState((state) => ({
      candidateKYC: state.candidateKYC.map((c) =>
        c.id === id ? { ...c, status: "verified" as const } : c
      ),
    }));
    toast.success("Candidate Verified!", {
      description: `${name}'s state council credentials verified and granted verified seal.`,
    });
  };

  const quickVerifyFacility = async (id: string, name: string) => {
    if (isApiEnabled) {
      try {
        await reviewFacilityKyc(id, "APPROVE", "Verified hospital credentials");
        toast.success("Hospital Accredited!", {
          description: `${name} approved as an accredited facility on FALE.`,
        });
        loadDashboardData();
      } catch (err: any) {
        toast.error("Accreditation failed", { description: err?.message });
      }
      return;
    }
    setState((state) => ({
      facilityKYC: state.facilityKYC.map((f) =>
        f.id === id ? { ...f, status: "verified" as const } : f
      ),
    }));
    toast.success("Hospital Accredited!", {
      description: `${name} approved as an accredited facility on FALE.`,
    });
  };

  const quickShortlistApp = async (id: string, candidateName: string) => {
    if (isApiEnabled) {
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
        toast.error("Shortlisting failed", { description: err?.message });
      }
      return;
    }
    setState((state) => ({
      adminApplications: state.adminApplications.map((a) =>
        a.id === id ? { ...a, status: "shortlisted" as const } : a
      ),
    }));
    toast.success("Candidate Shortlisted!", {
      description: `${candidateName}'s application shortlisted for hospital hiring desk.`,
    });
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
        return a.candidateName.toLowerCase().includes(q) || a.jobTitle.toLowerCase().includes(q) || a.facilityName.toLowerCase().includes(q);
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
    <div className="flex items-center gap-2 text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-semibold">
      <HiCheck className="h-4 w-4 shrink-0" />
      <span>Welcome back. All clinical verification and shortlisting queues are fully cleared!</span>
    </div>
  );

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
      {/* Operations Command Brief & Demand Forecast */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        {/* Morning Operations Brief */}
        <div className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-card p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-white text-xs shrink-0">
                <BotMessageSquare className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-foreground">
                  Morning Operations Brief
                </h2>
                <p className="text-[10px] text-muted-foreground">COO Platform Synthesis</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-bold text-primary">
                Live AI Summary
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={isGeneratingBrief}
                onClick={() => handleGenerateBrief()}
                className="h-7 px-2.5 text-[11px] font-bold rounded-lg gap-1 border-primary/30 text-primary hover:bg-primary/10 cursor-pointer"
              >
                <BotMessageSquare className={cn("h-3 w-3", isGeneratingBrief && "animate-spin")} />
                <span>{isGeneratingBrief ? "Updating..." : "Re-analyze with AI"}</span>
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed space-y-1.5 pt-1 border-t border-primary/15">
            {briefText ? (
              briefText.split("\n").filter(Boolean).map((line, idx) => (
                <p key={idx} className="flex items-start gap-1.5">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span className="text-foreground/90">{line.replace(/^[•\-\*]\s*/, "")}</span>
                </p>
              ))
            ) : (
              <>
                <p className="flex items-start gap-1.5">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong className="text-foreground">{pendingCandidateKYC.length}</strong> candidate KYC submissions awaiting state council verification check.</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong className="text-foreground">{pendingJobApprovals.length}</strong> hospital job & shift approvals pending compliance audit.</span>
                </p>
                <p className="flex items-start gap-1.5">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  <span><strong className="text-foreground">0</strong> active escrow disputes reported; 100% automated settlement rate maintained.</span>
                </p>
              </>
            )}
          </div>
        </div>

        {/* 7-Day Demand Forecast */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs shrink-0">
                <BotMessageSquare className="h-4 w-4" />
              </span>
              <div>
                <h2 className="text-xs sm:text-sm font-bold text-foreground">
                  Demand Surge Forecast
                </h2>
                <p className="text-[10px] text-muted-foreground">Predictive Telemetry</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                7-Day Horizon
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={isGeneratingForecast}
                onClick={handleGenerateForecast}
                className="h-7 px-2.5 text-[11px] font-bold rounded-lg gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 cursor-pointer"
              >
                <BotMessageSquare className={cn("h-3 w-3", isGeneratingForecast && "animate-spin")} />
                <span>{isGeneratingForecast ? "Projecting..." : "Recalculate with AI"}</span>
              </Button>
            </div>
          </div>
          <div className="text-xs text-muted-foreground leading-relaxed pt-1 border-t border-border/50">
            {forecastText ? (
              <p className="text-foreground/90 leading-relaxed font-medium">{forecastText}</p>
            ) : (
              <p className="leading-relaxed">
                Anticipating a <strong className="text-foreground">35% weekend surge</strong> in Critical Care Nurses and Dialysis Technicians across South Bengaluru (Koramangala/HSR) and Central Chennai. 14 locum shift broadcasts projected.
              </p>
            )}
          </div>
        </div>
      </div>

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
            <span className={cn(
              "text-[11px] font-bold px-2.5 py-1 rounded-lg border",
              totalPending > 0 ? "text-primary bg-primary/10 border-primary/20" : "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
            )}>
              {totalPending > 0 ? "Needs Review" : "Queue Cleared"}
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground leading-normal">Across candidates, hospitals & jobs</p>
        </div>

        {/* 2. Verified Clinicians */}
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Verified Clinicians</span>
            <HiOutlineCheckBadge className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-foreground">
              {metrics?.verifiedCandidatesCount ?? (apiCandidates.filter((c) => c.status === "verified").length || 2)}
            </span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
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
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
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

      {/* Consolidated Interactive Workload Queue with Tabs */}
      <div className="rounded-2xl border border-border/80 bg-card shadow-2xs overflow-hidden min-w-0 w-full">
        {/* Table Header & Search Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-border/80 bg-card/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <HiOutlineShieldCheck className="h-5 w-5 text-primary shrink-0" />
              <h3 className="text-base font-black tracking-tight text-foreground">Priority Action Center</h3>
              <span className="rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-black px-2 py-0.5">
                {totalPending} Awaiting
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Unified 1-click administrative pipeline across active verification streams</p>
          </div>

          {/* Quick Search Filter */}
          <div className="relative w-full sm:w-64">
            <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={queueSearch}
              onChange={(e) => setQueueSearch(e.target.value)}
              placeholder="Search queue by name, org, role…"
              className="h-9 w-full rounded-xl border border-border/80 bg-muted/40 pl-9 pr-8 text-xs outline-none focus:border-primary focus:bg-background transition-all"
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
        <div className="px-3 sm:px-4 py-2.5 border-b border-border/60 bg-muted/25 flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
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
                        ? "bg-primary/10 text-primary"
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
            className="text-xs font-bold text-primary hover:underline flex items-center gap-1 group py-1 shrink-0 whitespace-nowrap self-start sm:self-auto"
          >
            <span>Open Dedicated Queue</span>
            <HiOutlineArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* 1. Desktop Data Table View (hidden on mobile, visible on md and up) */}
        <div className="hidden md:block overflow-x-auto w-full min-w-0">
          <Table className="min-w-[780px] w-full">
            <TableHeader className="bg-muted/10">
              <TableRow className="hover:bg-transparent border-b border-border/60">
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3 w-36">Category</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3">Entity / Record</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3">Credentials / Terms</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3 w-32">Submitted</TableHead>
                <TableHead className="text-[11px] font-bold uppercase tracking-wider py-3 text-right w-44">Instant Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Job Approvals */}
              {filteredJobs.map((j) => (
                <TableRow key={j.id} className="text-xs hover:bg-muted/30 transition-colors border-b border-border/40">
                  <TableCell className="py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/20">
                      <HiOutlineBriefcase className="h-3.5 w-3.5 shrink-0" />
                      <span>Job Posting</span>
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                        <HiOutlineBriefcase className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-xs hover:text-primary transition-colors">{j.title}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span>{j.org}</span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span>{j.city}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="font-bold font-mono text-foreground">{j.compensation}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1.5">
                      <span className="rounded bg-muted px-1.5 py-0.2 font-semibold text-[10px]">{j.openings} Openings</span>
                      <span>{j.expOrHours}</span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                      <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{j.submittedDate}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5 inline-block">Within SLA</span>
                  </TableCell>
                  <TableCell className="text-right py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => quickApproveJob(j.id, j.title)}
                        className="rounded-xl font-bold text-xs h-8 px-3.5 bg-primary hover:bg-primary-hover text-white shadow-none gap-1.5 transition-all active:scale-[0.98]"
                      >
                        <HiCheck className="h-3.5 w-3.5" /> Approve Live
                      </Button>
                      <Link
                        to="/admin/postings"
                        className="h-8 w-8 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
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
                  <TableRow key={c.id} className="text-xs hover:bg-muted/30 transition-colors border-b border-border/40">
                    <TableCell className="py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/20">
                        <HiOutlineIdentification className="h-3.5 w-3.5 shrink-0" />
                        <span>Candidate KYC</span>
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs flex items-center justify-center shrink-0">
                          {initials}
                        </div>
                        <div>
                          <div className="font-bold text-foreground text-xs hover:text-primary transition-colors">{c.name}</div>
                          <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                            <span>{c.profession}</span>
                            <span className="h-1 w-1 rounded-full bg-border" />
                            <span>{c.state}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="font-bold text-foreground">{c.council}</div>
                      <div className="mt-0.5">
                        <span className="font-mono text-primary text-[10px] font-bold bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                          REG: {c.regNumber}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                        <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{c.submittedDate}</span>
                      </div>
                      <span className="text-[10px] font-semibold text-primary mt-0.5 inline-block">NMC Validation</span>
                    </TableCell>
                    <TableCell className="text-right py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => quickVerifyCandidate(c.id, c.name)}
                          className="rounded-xl font-bold text-xs h-8 px-3.5 bg-primary hover:bg-primary-hover text-white shadow-none gap-1.5 transition-all active:scale-[0.98]"
                        >
                          <HiOutlineCheckBadge className="h-3.5 w-3.5" /> Verify Seal
                        </Button>
                        <Link
                          to="/admin/candidates"
                          className="h-8 w-8 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
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
                <TableRow key={f.id} className="text-xs hover:bg-muted/30 transition-colors border-b border-border/40">
                  <TableCell className="py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/20">
                      <HiOutlineBuildingOffice2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Hospital License</span>
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                        <HiOutlineBuildingOffice2 className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-xs hover:text-primary transition-colors">{f.name}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span>{f.city}, {f.state}</span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span>{f.beds} Beds</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="font-bold text-foreground flex items-center gap-1">
                      <HiCheck className="h-3.5 w-3.5 text-emerald-500" />
                      <span>{f.accreditation}</span>
                    </div>
                    <div className="mt-0.5">
                      <span className="font-mono text-primary text-[10px] font-bold bg-primary/10 px-1.5 py-0.2 rounded border border-primary/20">
                        NABH: {f.nabhNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                      <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{f.submittedDate}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-primary mt-0.5 inline-block">NABH Portal Sync</span>
                  </TableCell>
                  <TableCell className="text-right py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => quickVerifyFacility(f.id, f.name)}
                        className="rounded-xl font-bold text-xs h-8 px-3.5 bg-primary hover:bg-primary-hover text-white shadow-none gap-1.5 transition-all active:scale-[0.98]"
                      >
                        <HiCheck className="h-3.5 w-3.5" /> Approve Facility
                      </Button>
                      <Link
                        to="/admin/facilities"
                        className="h-8 w-8 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
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
                <TableRow key={a.id} className="text-xs hover:bg-muted/30 transition-colors border-b border-border/40">
                  <TableCell className="py-3.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-bold text-primary border border-primary/20">
                      <HiOutlineDocumentCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Application</span>
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center shrink-0">
                        <HiOutlineDocumentCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-foreground text-xs hover:text-primary transition-colors">{a.candidateName}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span>Applying for {a.jobTitle}</span>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span>{a.facilityName}</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="font-bold text-foreground flex items-center gap-1.5">
                      <span>{a.experience} Exp</span>
                      <span className="h-1 w-1 rounded-full bg-border" />
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{a.matchScore}% Match</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">Council: {a.councilReg}</div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                      <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{a.appliedDate}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-primary mt-0.5 inline-block">Screening SLA</span>
                  </TableCell>
                  <TableCell className="text-right py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => quickShortlistApp(a.id, a.candidateName)}
                        className="rounded-xl font-bold text-xs h-8 px-3.5 bg-primary hover:bg-primary-hover text-white shadow-none gap-1.5 transition-all active:scale-[0.98]"
                      >
                        <HiCheck className="h-3.5 w-3.5" /> Shortlist
                      </Button>
                      <Link
                        to="/admin/applications"
                        className="h-8 w-8 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
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
                <TableRow key={p.id} className="text-xs hover:bg-muted/30 transition-colors border-b border-border/40">
                  <TableCell className="py-3.5">
                    <span className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border",
                      p.status === "hidden"
                        ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                    )}>
                      <HiOutlineChatBubbleLeftRight className="h-3.5 w-3.5 shrink-0" />
                      <span>{p.status === "hidden" ? "Reported Post" : "Clinical Case"}</span>
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 flex items-center justify-center shrink-0 font-bold">
                        {p.anon ? "AN" : p.authorName[0]}
                      </div>
                      <div className="max-w-md">
                        <div className="font-bold text-foreground text-xs">{p.anon ? "Anonymous Author" : p.authorName} · {p.authorRole}</div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{p.text}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="font-semibold text-foreground text-xs">
                      {p.status === "hidden" ? "Flagged by community" : "De-identification review"}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {p.type} · {p.field} Ward
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                      <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{p.at}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5 inline-block">1-hr Review SLA</span>
                  </TableCell>
                  <TableCell className="text-right py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => quickApproveHuddle(p.id, p.authorName)}
                        className="rounded-xl font-bold text-xs h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-none gap-1.5"
                      >
                        <HiCheck className="h-3.5 w-3.5" /> Approve Live
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => quickRejectHuddle(p.id)}
                        className="rounded-xl font-bold text-xs h-8 px-2.5 text-rose-600 border-rose-200 hover:bg-rose-50"
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
                    <HiCheck className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
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
            <div key={`m-job-${j.id}`} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
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
                  <div className="font-bold font-mono text-foreground text-xs mt-0.5">{j.compensation}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Terms</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 justify-end">
                    <span className="rounded bg-muted px-1.5 py-0.2 font-bold text-[10px] text-foreground">{j.openings} Openings</span>
                    <span>{j.expOrHours}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  size="sm"
                  onClick={() => quickApproveJob(j.id, j.title)}
                  className="flex-1 rounded-xl font-bold text-xs h-9 bg-primary hover:bg-primary-hover text-white shadow-none gap-1.5 transition-all active:scale-[0.98]"
                >
                  <HiCheck className="h-4 w-4" /> Approve Live
                </Button>
                <Link
                  to="/admin/postings"
                  className="h-9 w-9 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
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
              <div key={`m-cand-${c.id}`} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
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
                      <span className="font-mono text-primary text-[10px] font-bold bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                        REG: {c.regNumber}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  <Button
                    size="sm"
                    onClick={() => quickVerifyCandidate(c.id, c.name)}
                    className="flex-1 rounded-xl font-bold text-xs h-9 bg-primary hover:bg-primary-hover text-white shadow-none gap-1.5 transition-all active:scale-[0.98]"
                  >
                    <HiOutlineCheckBadge className="h-4 w-4" /> Verify Seal
                  </Button>
                  <Link
                    to="/admin/candidates"
                    className="h-9 w-9 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
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
            <div key={`m-fac-${f.id}`} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
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
                  <div className="font-bold text-foreground text-xs mt-0.5 flex items-center gap-1">
                    <HiCheck className="h-3.5 w-3.5 text-emerald-500" />
                    <span>{f.accreditation}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">NABH Certificate</div>
                  <div className="mt-0.5">
                    <span className="font-mono text-primary text-[10px] font-bold bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                      NABH: {f.nabhNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  size="sm"
                  onClick={() => quickVerifyFacility(f.id, f.name)}
                  className="flex-1 rounded-xl font-bold text-xs h-9 bg-primary hover:bg-primary-hover text-white shadow-none gap-1.5 transition-all active:scale-[0.98]"
                >
                  <HiCheck className="h-4 w-4" /> Approve Facility
                </Button>
                <Link
                  to="/admin/facilities"
                  className="h-9 w-9 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
                  title="Inspect hospital license and NABH certification"
                >
                  <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}

          {/* Applications Mobile Cards */}
          {filteredApplications.map((a) => (
            <div key={`m-app-${a.id}`} className="p-4 space-y-3 hover:bg-muted/20 transition-colors">
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
                    <span>{a.facilityName}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50 text-xs">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Match Score</div>
                  <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5 flex items-center gap-1">
                    <span>{a.matchScore}% Match</span>
                    <span className="h-1 w-1 rounded-full bg-border" />
                    <span className="text-foreground">{a.experience} Exp</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Registration</div>
                  <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{a.councilReg}</div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  size="sm"
                  onClick={() => quickShortlistApp(a.id, a.candidateName)}
                  className="flex-1 rounded-xl font-bold text-xs h-9 bg-primary hover:bg-primary-hover text-white shadow-none gap-1.5 transition-all active:scale-[0.98]"
                >
                  <HiCheck className="h-4 w-4" /> Shortlist
                </Button>
                <Link
                  to="/admin/applications"
                  className="h-9 w-9 rounded-xl border border-border/80 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all shrink-0"
                  title="Inspect full application dossier"
                >
                  <HiOutlineArrowTopRightOnSquare className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}

          {totalFilteredCount === 0 && (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-2">
              <HiCheck className="h-8 w-8 mx-auto text-emerald-500 mb-1" />
              <p className="font-bold text-foreground">All operational queues cleared!</p>
              <p>Zero pending approvals matching your filter.</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
