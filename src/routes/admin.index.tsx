import { useState, useRef } from "react";
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
} from "react-icons/hi2";
import { MdWavingHand } from "react-icons/md";
import { toast } from "sonner";
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
import { useApp, setState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/")({
  head: () => ({
    meta: [
      { title: "Admin Operations Console — FALE RMS" },
      { name: "description", content: "Enterprise clinical workforce verification and recruitment management system." },
    ],
  }),
  component: AdminDashboard,
});

export function AdminDashboard() {
  const s = useApp();
  const navigate = useNavigate();
  const [activeQueueTab, setActiveQueueTab] = useState<"all" | "postings" | "candidates" | "facilities" | "applications">("all");
  const [queueSearch, setQueueSearch] = useState("");

  const pendingCandidateKYC = s.candidateKYC.filter((c) => c.status === "pending");
  const pendingFacilityKYC = s.facilityKYC.filter((f) => f.status === "pending");
  const pendingJobApprovals = s.jobApprovals.filter((j) => j.status === "pending");
  const pendingShortlisting = s.adminApplications.filter((a) => a.status === "pending_admin");

  const totalPending =
    pendingCandidateKYC.length +
    pendingFacilityKYC.length +
    pendingJobApprovals.length +
    pendingShortlisting.length;

  const quickApproveJob = (id: string, title: string) => {
    setState((state) => ({
      jobApprovals: state.jobApprovals.map((j) =>
        j.id === id ? { ...j, status: "approved" as const } : j
      ),
    }));
    toast.success("Job Requirement Approved!", {
      description: `"${title}" is now published and live on the Candidate Portal.`,
    });
  };

  const quickVerifyCandidate = (id: string, name: string) => {
    setState((state) => ({
      candidateKYC: state.candidateKYC.map((c) =>
        c.id === id ? { ...c, status: "verified" as const } : c
      ),
    }));
    toast.success("Candidate Verified!", {
      description: `${name}'s state council credentials verified and granted verified seal.`,
    });
  };

  const quickVerifyFacility = (id: string, name: string) => {
    setState((state) => ({
      facilityKYC: state.facilityKYC.map((f) =>
        f.id === id ? { ...f, status: "verified" as const } : f
      ),
    }));
    toast.success("Hospital Accredited!", {
      description: `${name} approved as an accredited facility on FALE.`,
    });
  };

  const quickShortlistApp = (id: string, candidateName: string) => {
    setState((state) => ({
      adminApplications: state.adminApplications.map((a) =>
        a.id === id ? { ...a, status: "shortlisted" as const } : a
      ),
    }));
    toast.success("Candidate Shortlisted!", {
      description: `${candidateName}'s application shortlisted for hospital hiring desk.`,
    });
  };

  // Pie Chart 1 Data: Workload Distribution by Queue
  const queueData = [
    { name: "Candidate KYC", value: pendingCandidateKYC.length || 1, color: "#f59e0b", link: "/admin/candidates" },
    { name: "Hospital Verification", value: pendingFacilityKYC.length || 1, color: "#3b82f6", link: "/admin/facilities" },
    { name: "Job & Shift Approvals", value: pendingJobApprovals.length || 1, color: "#10b981", link: "/admin/postings" },
    { name: "Applicant Shortlisting", value: pendingShortlisting.length || 1, color: "#a855f7", link: "/admin/applications" },
  ];

  // Pie Chart 2 Data: Clinical Profession Breakdown
  const professionData = [
    { name: "Critical Care / Staff Nurses", value: 45, color: "#0ea5e9" },
    { name: "Doctors & Medical Officers", value: 30, color: "#6366f1" },
    { name: "Lab & Pathology Techs", value: 15, color: "#ec4899" },
    { name: "Radiology & Dialysis", value: 10, color: "#14b8a6" },
  ];

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

  const totalFilteredCount =
    filteredJobs.length +
    filteredCandidates.length +
    filteredFacilities.length +
    filteredApplications.length;

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
      <span className="inline-flex items-center align-middle -translate-y-px rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20 mx-0.5">
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
            onClick={() => navigate({ to: "/admin/candidates" })}
            className="text-xs font-bold gap-1.5 sm:gap-2 rounded-xl h-9 sm:h-10 px-2.5 sm:px-3.5 border-border/80 hover:bg-muted shadow-2xs transition-all active:scale-[0.98] justify-center"
          >
            <HiOutlineIdentification className="h-4 w-4 text-primary shrink-0" />
            <span className="whitespace-nowrap">Review KYC</span>
            <span className="rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-400 px-1.5 py-0.2 text-[10px] font-black border border-amber-500/20 shrink-0">
              {pendingCandidateKYC.length}
            </span>
          </Button>
          <Button
            size="sm"
            onClick={() => navigate({ to: "/admin/postings" })}
            className="text-xs font-bold gap-1.5 sm:gap-2 rounded-xl h-9 sm:h-10 px-2.5 sm:px-3.5 bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 transition-all active:scale-[0.98] justify-center"
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
      {/* Top 4 Modern Enterprise KPI Cards */}
      <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-4 min-w-0 w-full">
        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Total Queue Pending</span>
            <span className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              <span>Live</span>
            </span>
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-foreground">{totalPending}</span>
            <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              Needs Review
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground leading-normal">Across candidates, hospitals & jobs</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Verified Clinicians</span>
            <HiOutlineCheckBadge className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-foreground">
              {s.candidateKYC.filter((c) => c.status === "verified").length + 1280}
            </span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 flex items-center gap-1">
              <HiOutlineArrowTrendingUp className="h-3.5 w-3.5" /> +14 this wk
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground leading-normal">NMC & State council validated</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">Accredited Hospitals</span>
            <HiOutlineBuildingOffice2 className="h-4 w-4 text-blue-500" />
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-foreground">
              {s.facilityKYC.filter((f) => f.status === "verified").length + 42}
            </span>
            <span className="text-[11px] font-bold text-blue-700 dark:text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/20">
              NABH / NABL
            </span>
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground leading-normal">Active hospital networks</p>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs min-w-0">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-bold uppercase tracking-wider">SLA Turnaround</span>
            <HiOutlineClock className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <span className="text-3xl font-black font-mono tracking-tight text-foreground">3.8 hrs</span>
            <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
              98.2% on-time
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
              className="h-44 w-44 sm:h-48 sm:w-48 relative shrink-0 mx-auto"
              onMouseLeave={handleQueueLeave}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={queueData}
                    activeIndex={activeQueueIndex ?? undefined}
                    activeShape={renderActiveShape}
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={false}
                    onMouseEnter={(_, index) => handleQueueEnter(index)}
                  >
                    {queueData.map((entry, index) => {
                      const isDimmed = activeQueueIndex !== null && activeQueueIndex !== index;
                      return (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.color}
                          stroke="none"
                          opacity={isDimmed ? 0.35 : 1}
                          style={{
                            transition: "opacity 0.25s ease, filter 0.25s ease",
                            cursor: "pointer",
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Dynamic Center Donut Label — Smooth persistent transitions */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2 select-none">
                <span
                  className="text-2xl sm:text-3xl font-black font-mono leading-none tracking-tight transition-all duration-300 ease-out"
                  style={{
                    color: activeQueueIndex !== null && queueData[activeQueueIndex] ? queueData[activeQueueIndex].color : "var(--foreground)",
                    transform: activeQueueIndex !== null ? "scale(1.08)" : "scale(1)",
                  }}
                >
                  {activeQueueIndex !== null && queueData[activeQueueIndex] ? queueData[activeQueueIndex].value : totalPending}
                </span>
                <span className="text-[10px] font-bold text-foreground mt-1 max-w-[85px] leading-tight line-clamp-1 transition-all duration-300 ease-out">
                  {activeQueueIndex !== null && queueData[activeQueueIndex] ? queueData[activeQueueIndex].name : "Pending"}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground mt-0.5 transition-all duration-300 ease-out">
                  {activeQueueIndex !== null && queueData[activeQueueIndex]
                    ? `${Math.round((queueData[activeQueueIndex].value / (totalPending || 1)) * 100)}% of queue`
                    : "Total Workload"}
                </span>
              </div>
            </div>

            {/* Interactive Legend List */}
            <div className="flex-1 space-y-2 w-full min-w-0">
              {queueData.map((item, index) => {
                const isActive = activeQueueIndex === index;
                return (
                  <Link
                    key={item.name}
                    to={item.link}
                    onMouseEnter={() => handleQueueEnter(index)}
                    onMouseLeave={handleQueueLeave}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl transition-all group text-xs cursor-pointer border min-w-0 w-full",
                      isActive
                        ? "bg-muted border-border/80 scale-[1.01]"
                        : "hover:bg-muted/50 border-transparent hover:border-border/60"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full shrink-0 transition-transform",
                          isActive && "scale-125"
                        )}
                        style={{ backgroundColor: item.color }}
                      />
                      <span
                        className={cn(
                          "font-semibold transition-colors truncate text-[11px] sm:text-xs",
                          isActive ? "text-primary font-bold" : "text-foreground group-hover:text-primary"
                        )}
                      >
                        {item.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="font-black text-foreground font-mono text-xs">{item.value}</span>
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
              <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-500 flex items-center justify-center shrink-0">
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
              className="h-44 w-44 sm:h-48 sm:w-48 relative shrink-0 mx-auto"
              onMouseLeave={handleProfessionLeave}
            >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={professionData}
                    activeIndex={activeProfessionIndex ?? undefined}
                    activeShape={renderActiveShape}
                    innerRadius={48}
                    outerRadius={70}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={false}
                    onMouseEnter={(_, index) => handleProfessionEnter(index)}
                  >
                    {professionData.map((entry, index) => {
                      const isDimmed = activeProfessionIndex !== null && activeProfessionIndex !== index;
                      return (
                        <Cell
                          key={`cell-prof-${index}`}
                          fill={entry.color}
                          stroke="none"
                          opacity={isDimmed ? 0.35 : 1}
                          style={{
                            transition: "opacity 0.25s ease, filter 0.25s ease",
                            cursor: "pointer",
                          }}
                        />
                      );
                    })}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Dynamic Center Donut Label — Smooth persistent transitions */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-2 select-none">
                <span
                  className="text-2xl sm:text-3xl font-black font-mono leading-none tracking-tight transition-all duration-300 ease-out"
                  style={{
                    color: activeProfessionIndex !== null && professionData[activeProfessionIndex] ? professionData[activeProfessionIndex].color : "var(--foreground)",
                    transform: activeProfessionIndex !== null ? "scale(1.08)" : "scale(1)",
                  }}
                >
                  {activeProfessionIndex !== null && professionData[activeProfessionIndex] ? `${professionData[activeProfessionIndex].value}%` : "100%"}
                </span>
                <span className="text-[10px] font-bold text-foreground mt-1 max-w-[85px] leading-tight line-clamp-1 transition-all duration-300 ease-out">
                  {activeProfessionIndex !== null && professionData[activeProfessionIndex] ? professionData[activeProfessionIndex].name : "Cadre Mix"}
                </span>
                <span className="text-[9px] font-bold text-muted-foreground mt-0.5 transition-all duration-300 ease-out">
                  {activeProfessionIndex !== null ? "Specialization Share" : "Pan-India Coverage"}
                </span>
              </div>
            </div>

            {/* Cadre Legend List with Percentages & Hover Link */}
            <div className="flex-1 space-y-2 w-full min-w-0">
              {professionData.map((item, index) => {
                const isActive = activeProfessionIndex === index;
                return (
                  <div
                    key={item.name}
                    onMouseEnter={() => handleProfessionEnter(index)}
                    onMouseLeave={handleProfessionLeave}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl text-xs border cursor-pointer transition-all min-w-0 w-full",
                      isActive
                        ? "bg-muted border-border/80 scale-[1.01]"
                        : "hover:bg-muted/50 border-transparent hover:border-border/60"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full shrink-0 transition-transform",
                          isActive && "scale-125"
                        )}
                        style={{ backgroundColor: item.color }}
                      />
                      <span
                        className={cn(
                          "font-semibold transition-colors truncate text-[11px] sm:text-xs",
                          isActive ? "text-primary font-bold" : "text-foreground"
                        )}
                      >
                        {item.name}
                      </span>
                    </div>
                    <span className="font-mono font-bold text-foreground text-xs shrink-0">{item.value}%</span>
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
              <span className="rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-black px-2 py-0.5">
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
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <HiOutlineBriefcase className="h-3.5 w-3.5 shrink-0" />
                      <span>Job Posting</span>
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
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
                        className="rounded-xl font-bold text-xs h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98]"
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
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                        <HiOutlineIdentification className="h-3.5 w-3.5 shrink-0" />
                        <span>Candidate KYC</span>
                      </span>
                    </TableCell>
                    <TableCell className="py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
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
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5 inline-block">NMC Validation</span>
                    </TableCell>
                    <TableCell className="text-right py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          onClick={() => quickVerifyCandidate(c.id, c.name)}
                          className="rounded-xl font-bold text-xs h-8 px-3.5 bg-blue-600 hover:bg-blue-700 text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98]"
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
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-400 border border-blue-500/20">
                      <HiOutlineBuildingOffice2 className="h-3.5 w-3.5 shrink-0" />
                      <span>Hospital License</span>
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
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
                      <span className="font-mono text-blue-600 dark:text-blue-400 text-[10px] font-bold bg-blue-500/10 px-1.5 py-0.2 rounded border border-blue-500/20">
                        NABH: {f.nabhNumber}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                      <HiOutlineClock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span>{f.submittedDate}</span>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 mt-0.5 inline-block">NABH Portal Sync</span>
                  </TableCell>
                  <TableCell className="text-right py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => quickVerifyFacility(f.id, f.name)}
                        className="rounded-xl font-bold text-xs h-8 px-3.5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98]"
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
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-400 border border-purple-500/20">
                      <HiOutlineDocumentCheck className="h-3.5 w-3.5 shrink-0" />
                      <span>Application</span>
                    </span>
                  </TableCell>
                  <TableCell className="py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
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
                    <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 mt-0.5 inline-block">Screening SLA</span>
                  </TableCell>
                  <TableCell className="text-right py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        onClick={() => quickShortlistApp(a.id, a.candidateName)}
                        className="rounded-xl font-bold text-xs h-8 px-3.5 bg-purple-600 hover:bg-purple-700 text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98]"
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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <HiOutlineBriefcase className="h-3 w-3 shrink-0" />
                  <span>Job Posting</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <HiOutlineClock className="h-3.5 w-3.5 shrink-0" />
                  <span>{j.submittedDate}</span>
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
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
                  className="flex-1 rounded-xl font-bold text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98]"
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
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-400 border border-amber-500/20">
                    <HiOutlineIdentification className="h-3 w-3 shrink-0" />
                    <span>Candidate KYC</span>
                  </span>
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                    <HiOutlineClock className="h-3.5 w-3.5 shrink-0" />
                    <span>{c.submittedDate}</span>
                  </span>
                </div>

                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-sm flex items-center justify-center shrink-0 mt-0.5">
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
                    className="flex-1 rounded-xl font-bold text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98]"
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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-400 border border-blue-500/20">
                  <HiOutlineBuildingOffice2 className="h-3 w-3 shrink-0" />
                  <span>Hospital License</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <HiOutlineClock className="h-3.5 w-3.5 shrink-0" />
                  <span>{f.submittedDate}</span>
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
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
                    <span className="font-mono text-blue-600 dark:text-blue-400 text-[10px] font-bold bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20">
                      NABH: {f.nabhNumber}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-0.5">
                <Button
                  size="sm"
                  onClick={() => quickVerifyFacility(f.id, f.name)}
                  className="flex-1 rounded-xl font-bold text-xs h-9 bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98]"
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
                <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-700 dark:text-purple-400 border border-purple-500/20">
                  <HiOutlineDocumentCheck className="h-3 w-3 shrink-0" />
                  <span>Application</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground font-medium">
                  <HiOutlineClock className="h-3.5 w-3.5 shrink-0" />
                  <span>{a.appliedDate}</span>
                </span>
              </div>

              <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
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
                  className="flex-1 rounded-xl font-bold text-xs h-9 bg-purple-600 hover:bg-purple-700 text-white shadow-2xs gap-1.5 transition-all active:scale-[0.98]"
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
