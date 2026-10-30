import { useState, useMemo, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiPlus,
  HiOutlineBolt,
  HiOutlineBriefcase,
  HiOutlineBuildingOffice2,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineQuestionMarkCircle,
  HiOutlineMapPin,
  HiOutlineCurrencyRupee,
  HiOutlineDocumentCheck,
  HiOutlineCheckBadge,
  HiArrowRight,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineCheckCircle,
  HiOutlineMagnifyingGlass,
  HiOutlineFunnel,
  HiOutlineAcademicCap,
} from "react-icons/hi2";
import { RiVerifiedBadgeFill, RiShieldCheckFill } from "react-icons/ri";
import { toast } from "sonner";
import { AppShell, StatusBadge, initials } from "@/components/fale/AppShell";
import { Button } from "@/components/ui/button";
import { applicants, shifts, jobs } from "@/lib/data";
import { useApp, setState } from "@/lib/store";
import facilityMultispecialtyImg from "@/assets/facilities/facility-multispecialty.jpg";
import facilityClinicImg from "@/assets/facilities/facility-clinic.jpg";
import facilityDiagnosticImg from "@/assets/facilities/facility-diagnostic.jpg";
import { cn } from "@/lib/utils";

export type FacilityCategory = "multispecialty" | "clinic" | "diagnostic";

const FACILITY_CONFIG: Record<
  FacilityCategory,
  {
    name: string;
    typeLabel: string;
    banner: string;
    badge: string;
    description: string;
  }
> = {
  multispecialty: {
    name: "Multispecialty Hospital",
    typeLabel: "Tertiary Multi-Speciality Campus",
    banner: facilityMultispecialtyImg,
    badge: "NABH Tier-1 Partner",
    description: "Full-service inpatient wings, emergency trauma, modular OTs & intensive care",
  },
  clinic: {
    name: "Outpatient Clinic",
    typeLabel: "Specialized Day Clinic & Polyclinic",
    banner: facilityClinicImg,
    badge: "NABH Quality Certified Clinic",
    description: "Consultation suites, day-care procedures, outpatient pharmacy & preventive care",
  },
  diagnostic: {
    name: "Diagnostic & Imaging Centre",
    typeLabel: "High-Tech Diagnostics & NABL Lab",
    banner: facilityDiagnosticImg,
    badge: "NABL Accredited Facility",
    description: "Advanced digital radiology, MRI/CT imaging wings & molecular pathology",
  },
};

export const Route = createFileRoute("/employer/")({
  head: () => ({
    meta: [
      { title: "Hospital Command Center — FALE Healthcare" },
      { name: "description", content: "Executive clinical recruitment suite, locum shift broadcasts and council-verified talent pipelines." },
      { property: "og:title", content: "Hospital Command Center — FALE Healthcare" },
      { property: "og:description", content: "Executive clinical recruitment suite and council-verified talent pipelines." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Employer,
});

type FilterTab = "All" | "Open" | "Urgent" | "Draft";
type ViewTab = "postings" | "shifts" | "applicants";

function Employer() {
  const s = useApp();
  const [filter, setFilter] = useState<FilterTab>("All");
  const [activeTab, setActiveTab] = useState<ViewTab>("postings");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAcceptingApplications, setIsAcceptingApplications] = useState(true);

  const recruiterFullName = String(s.profile["recruiter"] || "Dr. Rajesh K").trim();
  let recruiterDisplayName = "Dr. Rajesh";
  if (recruiterFullName.toLowerCase().startsWith("dr.") || recruiterFullName.toLowerCase().startsWith("dr ")) {
    const parts = recruiterFullName.split(/\s+/);
    recruiterDisplayName = `${parts[0]} ${parts[1] || "Rajesh"}`.replace(",", "");
  } else {
    recruiterDisplayName = recruiterFullName.split(" ")[0]?.replace(",", "") || "there";
  }
  const orgName = String(s.profile["org"] || "Apollo Health City");
  const city = String(s.profile["city"] || "Chennai");
  const candidateCredits = s.candidateCredits ?? 3;

  // Determine facility category dynamically:
  // 1. From explicit user selection / profile: s.profile["facilityCategory"] or s.profile["orgType"]
  // 2. Or inferred from organisation name (e.g. clinic, diagnostic, hospital)
  // 3. Defaults cleanly to multispecialty
  const initialFacilityCategory: FacilityCategory = useMemo(() => {
    const explicit = String(s.profile["facilityCategory"] || "").toLowerCase();
    if (explicit === "clinic") return "clinic";
    if (explicit === "diagnostic") return "diagnostic";
    if (explicit === "multispecialty") return "multispecialty";

    const orgType = String(s.profile["orgType"] || "").toLowerCase();
    const orgLower = orgName.toLowerCase();

    if (
      orgType.includes("clinic") ||
      orgLower.includes("clinic") ||
      orgLower.includes("dental") ||
      orgLower.includes("polyclinic")
    ) {
      return "clinic";
    }
    if (
      orgType.includes("diagnostic") ||
      orgType.includes("lab") ||
      orgLower.includes("diagnostic") ||
      orgLower.includes("lab") ||
      orgLower.includes("imaging") ||
      orgLower.includes("scan") ||
      orgLower.includes("pathology")
    ) {
      return "diagnostic";
    }
    return "multispecialty";
  }, [s.profile, orgName]);

  const [activeFacilityType, setActiveFacilityType] = useState<FacilityCategory>(initialFacilityCategory);

  useEffect(() => {
    setActiveFacilityType(initialFacilityCategory);
  }, [initialFacilityCategory]);

  const currentFacility = FACILITY_CONFIG[activeFacilityType];

  const openRolesCount = s.postedJobs.filter((j) => j.status === "Open").length;
  const totalOpenings = s.postedJobs.reduce((acc, j) => acc + (j.openings || 1), 0);
  const interviewCount = applicants.filter((a) => a.status === "Interview").length;

  const filteredJobs = useMemo(() => {
    return s.postedJobs.filter((j) => {
      // Status filter
      if (filter === "Open" && j.status !== "Open") return false;
      if (filter === "Draft" && j.status !== "Draft") return false;
      if (filter === "Urgent") {
        const isUrgent =
          j.dept?.toLowerCase().includes("critical") ||
          j.dept?.toLowerCase().includes("emergency") ||
          j.title?.toLowerCase().includes("icu");
        if (!(j.status === "Open" && isUrgent)) return false;
      }
      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          j.title.toLowerCase().includes(q) ||
          j.dept.toLowerCase().includes(q) ||
          city.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [s.postedJobs, filter, searchQuery, city]);

  const activeShifts = s.postedShifts && s.postedShifts.length > 0 ? s.postedShifts : shifts.slice(0, 3);

  // Top Matched Clinicians Spotlight (LinkedIn Recruiter Style)
  const spotlightCandidates = [
    {
      id: "c1",
      name: "Sister Priya Raman",
      role: "Staff Nurse — ICU / Critical Care",
      council: "TNC Verified #78921",
      exp: "4.5 yrs exp",
      skills: ["ACLS", "Mechanical Ventilation", "NABH ICU Safety"],
      match: 98,
      status: "Immediate Joiner",
      readyFor: "Staff Nurse — ICU",
    },
    {
      id: "c2",
      name: "Dr. Arvind Swaminathan",
      role: "Emergency Duty Medical Officer",
      council: "TNMC Registered #44102",
      exp: "3 yrs exp",
      skills: ["BLS/ACLS", "Trauma Triage", "Emergency Resuscitation"],
      match: 95,
      status: "Notice: 7 Days",
      readyFor: "Duty Medical Officer",
    },
    {
      id: "c3",
      name: "Kavitha Sundaram",
      role: "Senior Lab Technician — Hematology",
      council: "NCAHP Registered #19402",
      exp: "5 yrs exp",
      skills: ["NABL Quality", "Cell Counters", "Blood Banking"],
      match: 92,
      status: "Immediate Joiner",
      readyFor: "Lab Technician",
    },
  ];

  return (
    <AppShell>
      <div className="space-y-6 w-full min-w-0 max-w-full pb-10">

        {/* ========================================================================= */}
        {/* EXECUTIVE HOSPITAL COMMAND COCKPIT HEADER                                */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-card shadow-xs">
          {/* Dynamic 3D Facility Architectural Illustration Banner */}
          <div className="relative h-36 sm:h-44 md:h-52 w-full overflow-hidden bg-muted">
            <img
              key={activeFacilityType}
              src={currentFacility.banner}
              alt={currentFacility.typeLabel}
              className="h-full w-full object-cover object-[center_12%] sm:object-[center_18%] transition-all duration-700 ease-out"
            />
            {/* Seamless bottom fade so avatar and identity bar blend naturally */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-card via-card/50 to-transparent pointer-events-none" />
          </div>

          {/* Hospital Header Identity & Primary Actions Bar */}
          <div className="relative px-5 sm:px-7 pb-5 pt-0">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 -mt-8 sm:-mt-9">
              {/* Left: Avatar & Hospital Info (Vertically Centered & Well-Aligned) */}
              <div className="flex items-center gap-3.5 sm:gap-4 min-w-0">
                <div className="relative shrink-0">
                  {s.profile["avatar"] ? (
                    <img
                      src={s.profile["avatar"] as string}
                      alt={orgName}
                      className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl border-4 border-card object-cover shadow-md bg-card"
                    />
                  ) : (
                    <span className="grid h-16 w-16 sm:h-18 sm:w-18 place-items-center rounded-2xl border-4 border-card bg-primary-soft text-xl sm:text-2xl font-black text-primary shadow-md">
                      {initials(orgName)}
                    </span>
                  )}
                  <span
                    title="Verified Institutional Partner"
                    className="absolute -bottom-1 -right-1 grid h-5.5 w-5.5 place-items-center rounded-full bg-emerald-600 text-white ring-2 ring-card shadow-xs"
                  >
                    <RiVerifiedBadgeFill className="h-3 w-3" />
                  </span>
                </div>

                <div className="min-w-0">
                  {/* Line 1: Organization Name + Category + Accreditation */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground truncate">
                      {orgName}
                    </h1>

                    {/* Dynamic Facility Category Badge */}
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-bold text-primary whitespace-nowrap">
                      <HiOutlineBuildingOffice2 className="h-3.5 w-3.5" />
                      {currentFacility.name}
                    </span>

                    {/* Dynamic Accreditation Badge */}
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
                      <RiShieldCheckFill className="h-3.5 w-3.5" />
                      {currentFacility.badge}
                    </span>
                  </div>

                  {/* Line 2: Campus Location, Recruiter, and Readiness */}
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground whitespace-nowrap">{city} Central Campus</span>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="whitespace-nowrap">Recruiter: <strong className="text-foreground font-semibold">{recruiterDisplayName}</strong></span>
                    <span className="text-muted-foreground/30">•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1.5 whitespace-nowrap">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Staffing Ready
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Modern Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0 pt-1 xl:pt-0">
                <Button asChild className="rounded-xl font-bold h-9 px-4 text-xs shadow-xs gap-1.5 cursor-pointer">
                  <Link to="/employer/post">
                    <HiPlus className="h-4 w-4 stroke-[2.5]" />
                    <span>Post Role</span>
                  </Link>
                </Button>

                <Button asChild variant="outline" className="rounded-xl font-bold h-9 px-3.5 text-xs bg-card border-border/80 hover:bg-muted/50 gap-1.5 cursor-pointer">
                  <Link to="/employer/post-shift">
                    <HiOutlineBolt className="h-4 w-4 text-primary" />
                    <span>Broadcast Shift</span>
                  </Link>
                </Button>

                <Button asChild variant="ghost" className="rounded-xl font-semibold text-xs h-9 px-3 hover:bg-muted text-muted-foreground hover:text-foreground cursor-pointer">
                  <Link to="/employer/candidates">
                    <span>Candidates</span>
                    <HiArrowRight className="h-3 w-3 ml-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* APPLE-STYLE 4-TILE CLINICAL INTELLIGENCE TELEMETRY                        */}
        {/* ========================================================================= */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
          {/* Tile 1: Active Postings */}
          <Link
            to="/employer/post"
            className="surface group rounded-2xl border border-border/80 bg-card p-3 sm:p-4.5 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <HiOutlineBriefcase className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                    Active Roles
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5">
                  Live
                </span>
              </div>

              <div className="mt-2 sm:mt-2.5">
                <div className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground leading-none">
                  {openRolesCount}
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground mt-1 truncate">
                  roles · {totalOpenings} openings
                </p>
              </div>
            </div>

            <p className="mt-2 pt-2 border-t border-border/40 text-[10px] sm:text-[11px] text-muted-foreground truncate group-hover:text-primary transition-colors flex items-center justify-between">
              <span className="truncate">Critical Care, OT</span>
              <HiArrowRight className="h-3 w-3 shrink-0 opacity-60 ml-1" />
            </p>
          </Link>

          {/* Tile 2: Candidate Pipeline */}
          <Link
            to="/employer/applicants"
            className="surface group rounded-2xl border border-border/80 bg-card p-3 sm:p-4.5 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <HiOutlineDocumentCheck className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                    Pipeline
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-primary-soft text-primary text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 whitespace-nowrap">
                  {interviewCount} Interview
                </span>
              </div>

              <div className="mt-2 sm:mt-2.5">
                <div className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground leading-none">
                  {applicants.length}
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground mt-1 truncate">
                  total applicants
                </p>
              </div>
            </div>

            <p className="mt-2 pt-2 border-t border-border/40 text-[10px] sm:text-[11px] text-muted-foreground truncate group-hover:text-primary transition-colors flex items-center justify-between">
              <span className="truncate">Council Verified</span>
              <HiArrowRight className="h-3 w-3 shrink-0 opacity-60 ml-1" />
            </p>
          </Link>

          {/* Tile 3: Locum Fill Rate */}
          <Link
            to="/employer/post-shift"
            className="surface group rounded-2xl border border-border/80 bg-card p-3 sm:p-4.5 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <HiOutlineClock className="h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                    Locum Fill
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-muted text-muted-foreground text-[9px] sm:text-[10px] font-bold px-1.5 sm:px-2 py-0.5">
                  Tonight
                </span>
              </div>

              <div className="mt-2 sm:mt-2.5">
                <div className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground leading-none">
                  96%
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground mt-1 truncate">
                  filled in &lt; 2.4h
                </p>
              </div>
            </div>

            <p className="mt-2 pt-2 border-t border-border/40 text-[10px] sm:text-[11px] text-muted-foreground truncate group-hover:text-primary transition-colors flex items-center justify-between">
              <span className="truncate">{activeShifts.length} urgent shifts</span>
              <HiArrowRight className="h-3 w-3 shrink-0 opacity-60 ml-1" />
            </p>
          </Link>

          {/* Tile 4: Verified Talent Pool */}
          <Link
            to="/employer/candidates"
            className="surface group rounded-2xl border border-border/80 bg-card p-3 sm:p-4.5 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <HiOutlineSparkles className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                    Talent Pool
                  </span>
                </div>
                <span className="shrink-0 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[9px] sm:text-[10px] font-extrabold px-1.5 sm:px-2 py-0.5 whitespace-nowrap">
                  {candidateCredits} Credits
                </span>
              </div>

              <div className="mt-2 sm:mt-2.5">
                <div className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-foreground leading-none">
                  12.4k+
                </div>
                <p className="text-[11px] sm:text-xs font-semibold text-muted-foreground mt-1 truncate">
                  active clinicians
                </p>
              </div>
            </div>

            <p className="mt-2 pt-2 border-t border-border/40 text-[10px] sm:text-[11px] text-muted-foreground truncate group-hover:text-primary transition-colors flex items-center justify-between">
              <span className="truncate">48 nearby · {city}</span>
              <HiArrowRight className="h-3 w-3 shrink-0 opacity-60 ml-1" />
            </p>
          </Link>
        </section>

        {/* ========================================================================= */}
        {/* LINKEDIN RECRUITER SPOTLIGHT: TOP MATCHED CLINICIANS READY TO INTERVIEW   */}
        {/* ========================================================================= */}
        <section className="surface rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-primary-soft/15 p-6 sm:p-7 shadow-xs">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-white text-xs shadow-2xs">
                  <HiOutlineSparkles className="h-4.5 w-4.5" />
                </span>
                <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight">
                  Pre-Screened Candidates Matched to Your Open Roles
                </h2>
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 text-[10px] font-extrabold">
                  Verified Ready
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground pl-0 sm:pl-10.5">
                Pre-audited with state medical councils and ready for immediate 48-hour interview scheduling.
              </p>
            </div>

            <Link
              to="/employer/candidates"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline self-start sm:self-auto shrink-0 bg-primary/5 hover:bg-primary/10 border border-primary/20 px-3.5 py-2 rounded-xl transition-colors"
            >
              <span>Explore candidate pool ({candidateCredits} credits)</span>
              <HiArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* 3 Candidate Spotlight Cards - Spacious & Elegant */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {spotlightCandidates.map((cand) => (
              <div
                key={cand.id}
                className="rounded-2xl border border-border/80 bg-card p-5.5 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all flex flex-col justify-between"
              >
                <div className="space-y-3.5">
                  {/* Top: Avatar, Name, Council & Match Pill */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-sm font-black text-primary shadow-2xs">
                        {initials(cand.name)}
                      </span>
                      <div className="min-w-0">
                        <h3 className="text-sm font-bold text-foreground truncate">{cand.name}</h3>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate flex items-center gap-1 mt-0.5">
                          <HiOutlineShieldCheck className="h-3.5 w-3.5 shrink-0" />
                          <span>{cand.council}</span>
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300 shrink-0">
                      {cand.match}% Match
                    </span>
                  </div>

                  {/* Middle: Clinical Role & Availability */}
                  <div className="pt-1">
                    <p className="text-sm font-bold text-foreground line-clamp-1">
                      {cand.role}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      <span>{cand.exp}</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="font-semibold text-foreground/80">{cand.status}</span>
                    </p>
                  </div>

                  {/* Clinical Skills Tags - Clean Pills */}
                  <div className="flex flex-wrap gap-1.5 pt-0.5">
                    {cand.skills.map((sk) => (
                      <span
                        key={sk}
                        className="rounded-lg bg-muted/60 border border-border/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Footer: Target Role & Action Button */}
                <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="block text-[10px] uppercase font-semibold text-muted-foreground tracking-wider">
                      Target Role
                    </span>
                    <span className="block text-xs font-bold text-foreground truncate max-w-[130px] sm:max-w-[150px]">
                      {cand.readyFor}
                    </span>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toast.success(`Interview invitation sent to ${cand.name}!`)}
                    className="h-8.5 px-3.5 text-xs font-bold rounded-xl border-primary/30 text-primary hover:bg-primary hover:text-white transition-all shadow-2xs shrink-0 cursor-pointer"
                  >
                    Schedule Interview
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ========================================================================= */}
        {/* MAIN COMMAND CENTER: SEARCH, TABS & OPERATIONAL FEED                     */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 gap-6 lg:gap-8 lg:grid-cols-[minmax(0,1fr)_340px] items-start w-full min-w-0">

          {/* ======================================================================= */}
          {/* MAIN COLUMN: COMMAND CENTER TABS & CARDS FEED                           */}
          {/* ======================================================================= */}
          <main className="w-full min-w-0 space-y-5">
            {/* Unified Search & Tab Switcher Bar (Naukri / LinkedIn Style) */}
            <div className="space-y-3">
              {/* Instant Role & Skill Search Input */}
              <div className="relative w-full">
                <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search open requirements, departments (ICU, Emergency, OT) or clinical skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-border/70 bg-card text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 shadow-2xs transition-all"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* View Switcher Tabs & Filter Pills (Responsive Mobile Segmented Layout) */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-2xl border border-border/60 w-full sm:w-fit overflow-x-auto no-scrollbar">
                  <button
                    type="button"
                    onClick={() => setActiveTab("postings")}
                    className={cn(
                      "flex-1 sm:flex-initial rounded-xl px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap",
                      activeTab === "postings"
                        ? "bg-card text-foreground shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <HiOutlineBriefcase className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      <span className="hidden sm:inline">Clinical </span>Postings
                    </span>
                    <span className="rounded-full bg-muted/80 px-1.5 py-0.2 text-[10px] font-bold shrink-0">
                      {filteredJobs.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("shifts")}
                    className={cn(
                      "flex-1 sm:flex-initial rounded-xl px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap",
                      activeTab === "shifts"
                        ? "bg-card text-foreground shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <HiOutlineBolt className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>
                      Locum<span className="hidden sm:inline"> Board</span>
                    </span>
                    <span className="rounded-full bg-muted/80 px-1.5 py-0.2 text-[10px] font-bold shrink-0">
                      {activeShifts.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("applicants")}
                    className={cn(
                      "flex-1 sm:flex-initial rounded-xl px-2.5 sm:px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap",
                      activeTab === "applicants"
                        ? "bg-card text-foreground shadow-2xs font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <HiOutlineDocumentCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span>Applicants</span>
                    <span className="rounded-full bg-muted/80 px-1.5 py-0.2 text-[10px] font-bold shrink-0">
                      {applicants.length}
                    </span>
                  </button>
                </div>

                {/* Status Filter Pills (Shown on Postings Tab) */}
                {activeTab === "postings" && (
                  <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
                    {(["All", "Open", "Urgent", "Draft"] as const).map((tab) => (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => setFilter(tab)}
                        className={cn(
                          "rounded-xl px-2.5 py-1 text-xs font-semibold transition-all cursor-pointer whitespace-nowrap",
                          filter === tab
                            ? "bg-foreground text-background font-bold shadow-2xs"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                        )}
                      >
                        {tab === "All" ? "All Roles" : tab}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* TAB 1: CLINICAL REQUIREMENTS FEED */}
            {activeTab === "postings" && (
              <div className="space-y-4">
                {filteredJobs.map((job) => {
                  const isUrgent =
                    job.dept?.toLowerCase().includes("critical") ||
                    job.dept?.toLowerCase().includes("emergency") ||
                    job.title?.toLowerCase().includes("icu");

                  return (
                    <div
                      key={job.id}
                      className="surface group relative rounded-2xl border border-border/70 bg-card p-5 sm:p-6 shadow-xs hover:shadow-md transition-all duration-200"
                    >
                      {/* Top Header: Dept, Title & Status */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft/60 border border-primary/15 text-primary">
                            <HiOutlineBuildingOffice2 className="h-5 w-5" />
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-muted-foreground truncate flex items-center gap-1">
                              <span>{job.dept}</span>
                              <HiOutlineCheckBadge className="h-3.5 w-3.5 text-primary shrink-0" />
                            </p>
                            <Link
                              to="/employer/applicants"
                              className="text-base sm:text-lg font-bold text-foreground hover:text-primary transition-colors leading-snug truncate block"
                            >
                              {job.title}
                            </Link>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isUrgent && (
                            <span className="rounded-full bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-900/40 px-2 py-0.5 text-[10px] font-extrabold text-rose-700 dark:text-rose-300">
                              Urgent
                            </span>
                          )}
                          <StatusBadge status={job.status} />
                        </div>
                      </div>

                      {/* LinkedIn-Style Visual Pipeline Micro-Funnel */}
                      <div className="mt-3.5 flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                          <span className="font-extrabold text-primary">12</span> Applied
                        </div>
                        <span className="text-muted-foreground/40 text-xs">→</span>
                        <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                          <span className="font-extrabold text-emerald-600">4</span> Shortlisted
                        </div>
                        <span className="text-muted-foreground/40 text-xs">→</span>
                        <div className="flex items-center gap-1.5 rounded-lg bg-muted/40 px-2.5 py-1 text-[11px] font-semibold text-foreground">
                          <span className="font-extrabold text-amber-600">2</span> Interviewing
                        </div>
                      </div>

                      {/* Core Telemetry & Actions */}
                      <div className="mt-4 pt-3.5 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex flex-wrap items-baseline gap-2 text-xs text-muted-foreground">
                          <span className="font-bold text-foreground">
                            {job.openings} {job.openings === 1 ? "Opening" : "Openings"}
                          </span>
                          <span className="text-muted-foreground/40">•</span>
                          <span>Full-time</span>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="flex items-center gap-1">
                            <HiOutlineMapPin className="h-3 w-3 text-muted-foreground/70" />
                            <span>{city}</span>
                          </span>
                          <span className="text-muted-foreground/40">•</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            4 Verified in Pool
                          </span>
                        </div>

                        {/* Direct Action Buttons */}
                        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                          <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className="font-semibold text-xs h-8 px-3 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground"
                          >
                            <Link to="/employer/post">
                              Edit Role
                            </Link>
                          </Button>

                          <Button
                            size="sm"
                            asChild
                            className="font-bold text-xs h-8 px-3.5 rounded-xl gap-1 shadow-2xs cursor-pointer"
                          >
                            <Link to="/employer/applicants">
                              <span>View Applicants (12)</span>
                              <HiArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {filteredJobs.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-border/80 p-8 text-center bg-card">
                    <p className="text-sm font-bold text-foreground">No requirements found matching your criteria</p>
                    <p className="mt-1 text-xs text-muted-foreground">Try clearing your search query or change the status filter.</p>
                    <Button asChild size="sm" className="mt-4 rounded-xl font-bold">
                      <Link to="/employer/post">
                        <HiPlus className="h-4 w-4 mr-1" /> Post New Role
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: LOCUM SHIFT BOARD */}
            {activeTab === "shifts" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium">
                    Broadcasting urgent clinical cover shifts directly to council-verified clinicians in {city}.
                  </p>
                  <Button asChild size="sm" className="rounded-xl font-bold text-xs h-8 shadow-xs">
                    <Link to="/employer/post-shift">
                      <HiPlus className="h-3.5 w-3.5 mr-1" /> Create Shift
                    </Link>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {activeShifts.map((shift) => (
                    <div
                      key={shift.id}
                      className="surface rounded-2xl border border-border/70 bg-card p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Live Broadcast
                            </span>
                            <h4 className="mt-2 text-base font-bold text-foreground">{shift.title}</h4>
                            <p className="text-xs text-muted-foreground mt-0.5">{shift.date} · {shift.time}</p>
                          </div>
                          <span className="text-base font-black text-primary shrink-0">
                            ₹{shift.rate}/hr
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-1.5">
                          <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            {shift.dept || "Critical Care"}
                          </span>
                          <span className="rounded-md bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                            12h Cover
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-muted-foreground">Verified Hospital Escrow</span>
                        <Link to="/employer/post-shift" className="font-bold text-primary hover:underline">
                          Manage Shift →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 3: APPLICANTS PIPELINE STREAM */}
            {activeTab === "applicants" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground font-medium">
                    Latest verified clinicians who applied to {orgName}.
                  </p>
                  <Link to="/employer/applicants" className="text-xs font-bold text-primary hover:underline">
                    View Complete Pipeline ({applicants.length}) →
                  </Link>
                </div>

                {applicants.map((a) => (
                  <div
                    key={a.id}
                    className="surface rounded-2xl border border-border/70 bg-card p-4 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-sm font-bold text-primary">
                        {initials(a.name)}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-sm font-bold text-foreground truncate">{a.name}</h4>
                          {a.verified && (
                            <HiOutlineShieldCheck className="h-3.5 w-3.5 text-primary shrink-0" title="Council Verified" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{a.role} · {a.exp}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/60 dark:border-emerald-800/60 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                        {a.match}% Match
                      </span>
                      <StatusBadge status={a.status} />
                      <Button asChild size="sm" variant="outline" className="h-8 text-xs rounded-xl font-bold">
                        <Link to="/employer/applicants">Review</Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>

          {/* ======================================================================= */}
          {/* RIGHT RAIL: STICKY OPERATIONAL TELEMETRY                                 */}
          {/* ======================================================================= */}
          <aside className="w-full min-w-0 space-y-5 lg:sticky lg:top-[80px] lg:self-start">

            {/* Hospital Readiness & Direct Application Switch */}
            <div className="surface rounded-3xl border border-border/80 bg-card shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 space-y-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <HiOutlineShieldCheck className="h-4 w-4 text-primary" />
                    <span>Hiring Readiness</span>
                  </span>
                  <span className="text-xs font-black text-primary">94% · Verified</span>
                </div>

                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: "94%" }} />
                </div>

                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  DigiLocker credential audits and state medical council verification pre-cleared for direct 48h placement.
                </p>

                {/* Direct Applications Toggle */}
                <div className="pt-2 border-t border-border/60">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <span className={cn("h-2 w-2 rounded-full shrink-0", isAcceptingApplications ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground")} />
                        <span>Direct Applications</span>
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Full-time & Locum cover</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setIsAcceptingApplications(!isAcceptingApplications);
                        toast.info(
                          isAcceptingApplications
                            ? "Facility direct applications paused"
                            : "Facility actively receiving direct candidate applications"
                        );
                      }}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        isAcceptingApplications ? "bg-emerald-600" : "bg-muted"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                          isAcceptingApplications ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>

              <div className="border-t border-border/70 bg-muted/20 px-4 sm:px-5 py-3 flex items-center justify-between text-xs">
                <span className="text-muted-foreground text-[11px]">Facility Profile</span>
                <Link to="/employer/profile" className="font-bold text-primary hover:underline">
                  Manage Facility →
                </Link>
              </div>
            </div>

            {/* Live Locum Shift Mini Stream */}
            <div className="surface rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <HiOutlineClock className="h-4 w-4 text-primary" />
                    <span>Emergency Shifts</span>
                  </h3>
                  <p className="text-[11px] text-muted-foreground">Broadcasted to verified pool</p>
                </div>
                <Link to="/employer/post-shift" className="text-xs font-bold text-primary hover:underline">
                  + Post
                </Link>
              </div>

              <div className="space-y-2">
                {activeShifts.slice(0, 2).map((shift) => (
                  <div key={shift.id} className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                    <div className="flex items-start justify-between gap-1">
                      <p className="text-xs font-bold text-foreground truncate">{shift.title}</p>
                      <span className="text-xs font-black text-primary shrink-0">₹{shift.rate}/hr</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{shift.date}</p>
                  </div>
                ))}
              </div>

              <Button asChild variant="outline" size="sm" className="w-full rounded-xl font-bold h-8 text-xs border-border/80">
                <Link to="/employer/post-shift">Manage Locum Board</Link>
              </Button>
            </div>

            {/* Active Talent Radar */}
            <div className="surface rounded-3xl border border-border/80 bg-card p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary text-white">
                  <HiOutlineBolt className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-xs font-bold text-foreground">Talent Radar · {city}</h4>
                  <p className="text-[10px] text-muted-foreground">Available verified clinicians</p>
                </div>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-1.5">
                  <span className="text-[11px] font-medium text-foreground">Staff Nurses (ICU/OT)</span>
                  <span className="font-extrabold text-primary text-[11px]">48 ready</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-1.5">
                  <span className="text-[11px] font-medium text-foreground">Duty Medical Officers</span>
                  <span className="font-extrabold text-primary text-[11px]">19 ready</span>
                </div>
                <div className="flex items-center justify-between rounded-xl bg-muted/40 px-3 py-1.5">
                  <span className="text-[11px] font-medium text-foreground">Lab & Imaging Techs</span>
                  <span className="font-extrabold text-primary text-[11px]">32 ready</span>
                </div>
              </div>

              <Button asChild size="sm" className="w-full rounded-xl font-bold h-8 text-xs">
                <Link to="/employer/candidates">Source Clinicians ({candidateCredits} Credits)</Link>
              </Button>
            </div>

            {/* 24/7 Clinical Concierge & Escrow Help */}
            <div className="surface rounded-3xl border border-primary/20 bg-primary/5 p-4 sm:p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <HiOutlineQuestionMarkCircle className="h-4 w-4" />
                  <span>Clinical Concierge</span>
                </span>
                <span className="rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold px-2 py-0.2">
                  24/7 Live
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Need urgent shift cover or credential escrow resolution? Call your dedicated facility coordinator.
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

          </aside>
        </div>

      </div>
    </AppShell>
  );
}

export default Employer;
