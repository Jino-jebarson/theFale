import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlineShieldCheck,
  HiOutlineCheckBadge,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineUserGroup,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineShare,
  HiOutlinePencilSquare,
  HiOutlineSparkles,
  HiCheck,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineGlobeAlt,
  HiOutlineDocumentCheck,
  HiOutlineBolt,
  HiOutlineHeart,
  HiOutlineInformationCircle,
  HiOutlinePhoto,
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
import { jobs, shifts } from "@/lib/data";
import { useApp, setState } from "@/lib/store";
import { cn } from "@/lib/utils";
import facilityMultispecialtyImg from "@/assets/facilities/facility-multispecialty.jpg";
import facilityClinicImg from "@/assets/facilities/facility-clinic.jpg";
import facilityDiagnosticImg from "@/assets/facilities/facility-diagnostic.jpg";

export const Route = createFileRoute("/employer/profile")({
  head: () => ({
    meta: [
      { title: "Hospital Profile & Clinical Overview — FALE" },
      {
        name: "description",
        content:
          "Verified hospital institution profile, clinical departments, accreditations, nurse-to-patient ratios, and active healthcare openings.",
      },
      { property: "og:title", content: "Hospital Profile — FALE Healthcare" },
      {
        property: "og:description",
        content: "Verified clinical institution profile, departments, and active healthcare jobs.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HospitalProfileScreen,
});

// Clinical Departments List
const hospitalSpecialties = [
  {
    name: "Critical Care & ECMO",
    beds: "54 ICU Beds",
    lead: "Dr. Arvind Ramesh, MD, EDIC",
    ratio: "1:1 Nursing Ratio",
    desc: "State-of-the-art closed ICU with dedicated bedside mechanical ventilation, bedside hemodialysis, and 24/7 intensivist cover.",
    icon: HiOutlineShieldCheck,
  },
  {
    name: "Emergency & Level 1 Trauma",
    beds: "32 Resuscitation Bays",
    lead: "Dr. Sunita Rao, MRCEM",
    ratio: "1:2 Triage Ratio",
    desc: "Door-to-balloon < 60 mins for STEMI, Door-to-needle < 30 mins for acute ischemic stroke. Helipad equipped.",
    icon: HiOutlineBolt,
  },
  {
    name: "Cardiology & Cath Labs",
    beds: "3 Hybrid Cath Suites",
    lead: "Dr. K. S. Murthy, DM (Cardiology)",
    ratio: "1:1 Procedural",
    desc: "Advanced interventional cardiology, TAVI/TAVR programs, electrophysiology lab, and dedicated CCU recovery.",
    icon: HiOutlineHeart,
  },
  {
    name: "Nephrology & Dialysis",
    beds: "36 Station Dialysis Suite",
    lead: "Dr. P. Venkat, DNB (Nephrology)",
    ratio: "1:2 Tech Ratio",
    desc: "High-flux hemodialysis, SLEDD, CRRT for ICU patients, and live-donor kidney transplant surgical suites.",
    icon: HiOutlineSparkles,
  },
  {
    name: "Operation Theatres & Robotic Surgery",
    beds: "18 Modular OT Suites",
    lead: "Dr. Rajeshwar Singh, MS, MCh",
    ratio: "1:1 Scrub Cover",
    desc: "Equipped with Da Vinci Xi robotic surgical systems, laminar airflow, HEPA filtration (Class 100), and integrated imaging.",
    icon: HiOutlineBuildingOffice2,
  },
  {
    name: "Neonatal & Pediatric ICU (NICU/PICU)",
    beds: "28 Level-3 NICU Beds",
    lead: "Dr. Ananya Sen, MD (Pediatrics)",
    ratio: "1:1 Critical Care",
    desc: "Dedicated pediatric surgical support, nitric oxide therapy, transport incubators, and kangaroo mother care suites.",
    icon: HiOutlineAcademicCap,
  },
];

// Hospital Accreditations
const accreditationList = [
  {
    title: "NABH Full Hospital Accreditation",
    org: "National Accreditation Board for Hospitals & Healthcare Providers",
    validity: "Valid through Dec 2028",
    standard: "5th Edition Standards · Patient Safety & Infection Control",
    code: "NABH-HSP-2024-0892",
  },
  {
    title: "JCI Gold Seal of Approval®",
    org: "Joint Commission International, USA",
    validity: "Valid through Nov 2027",
    standard: "International Patient Safety Goals (IPSG) Certified",
    code: "JCI-INT-IND-4412",
  },
  {
    title: "NABL Certified Laboratories",
    org: "National Accreditation Board for Testing and Calibration Laboratories",
    validity: "Valid through Aug 2028",
    standard: "ISO 15189:2022 Medical Testing Laboratory",
    code: "NABL-MED-9921",
  },
  {
    title: "AERB Radiation Safety Clearance",
    org: "Atomic Energy Regulatory Board of India",
    validity: "Valid through 2029",
    standard: "Medical Diagnostic X-Ray, CT, & Radiotherapy Facility",
    code: "AERB-DIAG-B-5510",
  },
];

// Staff Benefits List
const hospitalStaffBenefits = [
  {
    title: "Dedicated Nursing Hostels",
    desc: "Secure, subsidized on-campus and near-campus staff accommodation with 24/7 security, high-speed Wi-Fi, and mess dining.",
    icon: HiOutlineBuildingOffice2,
  },
  {
    title: "Safe 24/7 Cab Transportation",
    desc: "Free GPS-tracked pick and drop escort cabs for all night-duty nursing and laboratory personnel within city limits.",
    icon: HiOutlineMapPin,
  },
  {
    title: "Comprehensive Health Cover",
    desc: "Zero-cost OPD consultations, subsidized medications, and ₹5,00,000 cashless family health insurance coverage.",
    icon: HiOutlineHeart,
  },
  {
    title: "Sponsored CME & Certifications",
    desc: "100% hospital-sponsored BLS/ACLS, IV therapy, and infection control certifications with accredited credit points.",
    icon: HiOutlineAcademicCap,
  },
  {
    title: "1:1 ICU Nursing Commitment",
    desc: "Strict institutional compliance with clinical nurse-to-patient staffing ratios to ensure nurse wellbeing and patient safety.",
    icon: HiOutlineShieldCheck,
  },
  {
    title: "Guaranteed Escrow Payouts",
    desc: "Per-diem and locum shift earnings are released directly to bank accounts within 24 hours of verified duty completion.",
    icon: HiOutlineCurrencyRupee,
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

function HospitalProfileScreen() {
  const store = useApp();
  const profile = (store.profile || {}) as Record<string, string>;

  // Editable Profile State
  const [hospitalName, setHospitalName] = useState(
    profile["org"] || "Apollo Hospitals — Main Campus"
  );
  const [tagline, setTagline] = useState(
    "Quaternary Care Multi-Specialty & Organ Transplant Center of Excellence"
  );
  const [city, setCity] = useState("Bengaluru");
  const [address, setAddress] = useState(
    "154/11, Bannerghatta Main Road, Opposite IIM, 2nd Phase, J. P. Nagar, Bengaluru, Karnataka 560076"
  );
  const [bedCapacity, setBedCapacity] = useState("750");
  const [icuBeds, setIcuBeds] = useState("180");
  const [contactPhone, setContactPhone] = useState("+91 80 2630 4050");
  const [emergencyPhone, setEmergencyPhone] = useState("+91 80 1066 (24x7 Hotline)");
  const [hrEmail, setHrEmail] = useState("clinical.careers@apollohospitals.com");
  const [website, setWebsite] = useState("https://www.apollohospitals.com");

  // Navigation tab
  const [activeTab, setActiveTab] = useState<
    "overview" | "departments" | "jobs" | "benefits" | "accreditations"
  >("overview");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filter jobs for this hospital
  const hospitalJobs = useMemo(() => {
    return jobs.filter((j) =>
      j.org.toLowerCase().includes(hospitalName.toLowerCase().split(" ")[0])
    );
  }, [hospitalName]);

  // Filter shifts for this hospital
  const hospitalShifts = useMemo(() => {
    const userShifts = (store.postedShifts ?? []).map((s) => ({
      ...s,
      perks: s.perks ?? [],
      urgent: s.urgent ?? false,
    }));
    return [...userShifts, ...shifts].filter((s) =>
      s.org.toLowerCase().includes(hospitalName.toLowerCase().split(" ")[0])
    );
  }, [hospitalName, store.postedShifts]);

  // Uploaded facility photos from onboarding
  const userFacilityPhotos = useMemo(() => {
    try {
      if (profile["facilityPhotos"]) {
        return JSON.parse(profile["facilityPhotos"] as string) as string[];
      }
    } catch {
      // fallback
    }
    return [];
  }, [profile]);

  // Handle Edit Save
  const handleSaveProfile = () => {
    setState((s) => ({
      profile: {
        ...s.profile,
        org: hospitalName,
        city,
        tagline,
      },
    }));
    setIsEditModalOpen(false);
    toast.success("Hospital profile updated successfully", {
      description: "Changes are now live across all candidate job postings and shift cards.",
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Profile link copied to clipboard");
  };

  // Dynamic 3D Facility Banner
  const dynamicFacilityBanner = useMemo(() => {
    const cat = String(profile["facilityCategory"] || profile["orgType"] || "").toLowerCase();
    const org = hospitalName.toLowerCase();
    if (cat.includes("clinic") || org.includes("clinic") || org.includes("dental") || org.includes("polyclinic")) {
      return facilityClinicImg;
    }
    if (cat.includes("diagnostic") || cat.includes("lab") || org.includes("diagnostic") || org.includes("lab") || org.includes("scan") || org.includes("imaging")) {
      return facilityDiagnosticImg;
    }
    return facilityMultispecialtyImg;
  }, [profile, hospitalName]);

  return (
    <AppShell>
      <div className="w-full min-w-0 space-y-6 pb-16">
        {/* ================= HERO COVER & INSTITUTION HEADER ================= */}
        <div className="relative rounded-3xl border border-border bg-card overflow-hidden shadow-xs">
          {/* Cover Banner Image with High-Definition Campus Presentation */}
          <div className="relative h-48 sm:h-64 md:h-72 w-full overflow-hidden bg-muted">
            <img
              src={(profile["facilityBanner"] as string) || (profile["avatar"] as string) || dynamicFacilityBanner}
              alt="Hospital Facility Campus"
              className="h-full w-full object-cover object-[center_20%]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-foreground border border-border/60 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Verified Clinical Facility
              </span>
            </div>
          </div>

          {/* Hospital Identity Container */}
          <div className="px-5 sm:px-8 pb-6 sm:pb-7 pt-4 sm:pt-5 relative bg-card">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
              {/* Left: Avatar & Hospital Titles */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-5 min-w-0">
                <div className="-mt-14 sm:-mt-16 shrink-0">
                  <div className="grid h-24 w-24 sm:h-28 sm:w-28 place-items-center rounded-2xl bg-gradient-brand text-2xl sm:text-3xl font-black text-primary-foreground shadow-lg border-4 border-card ring-1 ring-border/80">
                    {hospitalName.slice(0, 2).toUpperCase()}
                  </div>
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight truncate">
                      {hospitalName}
                    </h1>
                    <HiOutlineCheckBadge
                      className="h-6 w-6 text-primary shrink-0"
                      title="NABH & JCI Accredited Hospital"
                    />
                  </div>

                  <p className="mt-1 text-xs sm:text-sm font-medium text-muted-foreground leading-snug">
                    {tagline}
                  </p>

                  <div className="mt-2.5 flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1 font-semibold text-foreground">
                      <HiOutlineMapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      {city}, India
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <HiOutlineBuildingOffice2 className="h-3.5 w-3.5 shrink-0" />
                      {bedCapacity} Inpatient Beds ({icuBeds} ICU)
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <HiOutlineShieldCheck className="h-3.5 w-3.5 shrink-0" />
                      NABH & JCI Certified
                    </span>
                  </div>
                </div>
              </div>

              {/* Right: Action Buttons */}
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="rounded-xl text-xs font-semibold gap-1.5 h-10 px-3.5 shadow-2xs cursor-pointer"
                >
                  <HiOutlineShare className="h-4 w-4" />
                  <span>Share</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  className="rounded-xl text-xs font-semibold gap-1.5 h-10 px-3.5 shadow-2xs cursor-pointer"
                >
                  <HiOutlinePencilSquare className="h-4 w-4 text-primary" />
                  <span>Edit Profile</span>
                </Button>

                <Button
                  asChild
                  size="default"
                  className="rounded-xl text-xs font-bold gap-1.5 h-10 px-4 shadow-sm bg-primary hover:bg-primary-hover cursor-pointer"
                >
                  <Link to="/employer/post-shift">
                    <HiOutlineBolt className="h-4 w-4" />
                    <span>Broadcast shift</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* ================= 4 KEY CLINICAL METRIC STATS ================= */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-t border-border bg-muted/20 divide-y md:divide-y-0 md:divide-x divide-border">
            <div className="p-4 sm:p-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Total Capacity
              </span>
              <span className="text-xl sm:text-2xl font-black text-foreground font-mono mt-0.5 block">
                {bedCapacity}+ Beds
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                {icuBeds} Critical Care Beds
              </span>
            </div>

            <div className="p-4 sm:p-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Medical Staff
              </span>
              <span className="text-xl sm:text-2xl font-black text-foreground font-mono mt-0.5 block">
                1,450+
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Doctors, Nurses & Technicians
              </span>
            </div>

            <div className="p-4 sm:p-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Operation Theatres
              </span>
              <span className="text-xl sm:text-2xl font-black text-foreground font-mono mt-0.5 block">
                18 Modular OTs
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                3 Hybrid Cath Labs
              </span>
            </div>

            <div className="p-4 sm:p-5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                Quality Index
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                98.6% NABH
              </span>
              <span className="text-[11px] text-muted-foreground mt-0.5 block">
                Zero Severe Sentinel Events
              </span>
            </div>
          </div>
        </div>

        {/* ================= NAVIGATION TABS (Apple-style Segmented) ================= */}
        <div className="sticky top-[var(--header-offset,4rem)] z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 bg-background/95 backdrop-blur-md border-b border-border/80 transition-all duration-300 ease-in-out">
          <div className="flex overflow-x-auto scrollbar-none gap-2">
            {[
              { id: "overview", label: "Overview & Infrastructure", icon: HiOutlineBuildingOffice2 },
              { id: "departments", label: "Clinical Departments", icon: HiOutlineShieldCheck },
              {
                id: "jobs",
                label: `Active Jobs & Shifts (${hospitalJobs.length + hospitalShifts.length})`,
                icon: HiOutlineBriefcase,
              },
              { id: "benefits", label: "Staff Benefits & Culture", icon: HiOutlineHeart },
              { id: "accreditations", label: "Accreditations & Quality", icon: HiOutlineDocumentCheck },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const TabIcon = tab.icon;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-xs font-bold transition-all border-b-2 -mb-px whitespace-nowrap cursor-pointer",
                    isActive
                      ? "border-primary text-primary font-black"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                  )}
                >
                  <TabIcon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= TAB CONTENT 1: OVERVIEW & INFRASTRUCTURE ================= */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">
            {/* Left 8 Cols */}
            <div className="space-y-6 lg:col-span-8">
              {/* About the Hospital */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-3.5">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <HiOutlineInformationCircle className="h-5 w-5 text-primary" />
                  About the Institution
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {hospitalName} is recognized as a leader in quaternary and tertiary healthcare across South Asia. With over 40 years of pioneering medical excellence, the institute combines cutting-edge clinical research, advanced robotic surgery, and comprehensive organ transplant capabilities with compassionate bedside patient care.
                </p>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Our clinical ecosystem supports over 45 clinical specialties under one roof, managing complex patient referrals from across India and over 120 countries globally. We are deeply committed to empowering clinical staff through continuous medical education (CME), modern infrastructure, and safe nurse-to-patient staffing ratios.
                </p>
              </div>

              {/* Campus & Infrastructure Gallery (If uploaded in onboarding) */}
              {userFacilityPhotos.length > 0 && (
                <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-border/60 pb-3">
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <HiOutlinePhoto className="h-5 w-5 text-primary" />
                      Campus & Clinical Infrastructure Gallery
                    </h2>
                    <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                      {userFacilityPhotos.length} {userFacilityPhotos.length === 1 ? "Photo" : "Photos"}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {userFacilityPhotos.map((imgUrl, i) => (
                      <div key={i} className="group relative aspect-video rounded-xl overflow-hidden border border-border bg-muted shadow-2xs">
                        <img
                          src={imgUrl}
                          alt={`Campus facility ${i + 1}`}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nurse-to-Patient Ratio Institutional Commitment (Apple/Naukri Trust Standard) */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border/60 pb-3">
                  <div>
                    <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                      <HiOutlineShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      Nurse-to-Patient Staffing Ratio Standards
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Our board-approved clinical staffing policy ensures zero nursing burnout and maximum clinical vigilance.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-1 rounded-full">
                    Audited Monthly
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      Critical Care (ICU / CCU)
                    </span>
                    <span className="text-2xl font-black text-primary font-mono mt-1 block">
                      1 : 1
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      Dedicated Bedside Nurse
                    </span>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      High Dependency (HDU)
                    </span>
                    <span className="text-2xl font-black text-foreground font-mono mt-1 block">
                      1 : 2
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      Step-Down Intensive Care
                    </span>
                  </div>

                  <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block">
                      General Inpatient Wards
                    </span>
                    <span className="text-2xl font-black text-foreground font-mono mt-1 block">
                      1 : 4
                    </span>
                    <span className="text-[11px] text-muted-foreground mt-0.5 block">
                      Day & Night Routine
                    </span>
                  </div>
                </div>
              </div>

              {/* Advanced Technology & Infrastructure */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
                <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                  <HiOutlineSparkles className="h-5 w-5 text-primary" />
                  Clinical Infrastructure & Medical Technology
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
                    <span className="text-xs font-bold text-foreground block">
                      Da Vinci Xi® Robotic Surgery
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      High-definition 3D vision and wristed instruments for minimally invasive oncology, urology, and gynecological procedures.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
                    <span className="text-xs font-bold text-foreground block">
                      Biplane Neuro & Cardiac Cath Lab
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      Zero-delay mechanical thrombectomy, structural heart interventions, and electrophysiology 3D mapping suites.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
                    <span className="text-xs font-bold text-foreground block">
                      ECMO & Advanced Life Support
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      Extracorporeal membrane oxygenation (VA and VV) for cardiogenic shock and refractory acute respiratory distress syndrome.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-colors">
                    <span className="text-xs font-bold text-foreground block">
                      Pneumatic Tube & Automated Pharmacy
                    </span>
                    <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
                      Under 3-minute emergency stat drug transit from central pharmacy directly to ICU and Emergency resuscitation bays.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right 4 Cols: Contact & Campus Info */}
            <div className="space-y-6 lg:col-span-4">
              {/* Hospital Address & Emergency Hotlines */}
              <div className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-4">
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <HiOutlineBuildingOffice2 className="h-4 w-4 text-primary" />
                  Campus Location & Emergency
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                      Main Campus Address
                    </span>
                    <p className="mt-1 font-medium text-foreground leading-relaxed">{address}</p>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                      24/7 Emergency & Trauma Hotline
                    </span>
                    <a
                      href={`tel:${emergencyPhone}`}
                      className="mt-1 font-bold text-destructive hover:underline flex items-center gap-1.5 font-mono text-sm"
                    >
                      <HiOutlinePhone className="h-4 w-4 shrink-0" />
                      {emergencyPhone}
                    </a>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                      Clinical HR & Nursing Directorate
                    </span>
                    <p className="mt-1 font-medium text-foreground font-mono">{contactPhone}</p>
                    <a
                      href={`mailto:${hrEmail}`}
                      className="text-primary hover:underline block mt-0.5"
                    >
                      {hrEmail}
                    </a>
                  </div>

                  <div className="pt-2 border-t border-border">
                    <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">
                      Institutional Website
                    </span>
                    <a
                      href={website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 font-medium text-primary hover:underline flex items-center gap-1"
                    >
                      <HiOutlineGlobeAlt className="h-3.5 w-3.5" />
                      Visit hospital portal
                    </a>
                  </div>
                </div>
              </div>

              {/* FALE Verified Hospital Badge */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <HiOutlineShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    FALE Verified Institution
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  All nursing registrations, doctor licenses, and clinical shifts hosted by {hospitalName} are backed by FALE's 24-hr escrow guarantee and clinical compliance standards.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB CONTENT 2: CLINICAL DEPARTMENTS ================= */}
        {activeTab === "departments" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Specialized Clinical Departments & Intensive Units
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Overview of specialized inpatient units, bed allocation, and clinical department leadership.
                </p>
              </div>
              <span className="self-start sm:self-center text-xs font-semibold text-muted-foreground shrink-0">
                {hospitalSpecialties.length} Core Departments
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {hospitalSpecialties.map((deptItem) => {
                const DeptIcon = deptItem.icon;
                return (
                  <div
                    key={deptItem.name}
                    className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs hover:border-primary/50 transition-all space-y-3"
                  >
                    <div className="flex items-start gap-3 sm:gap-3.5">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary shadow-2xs mt-0.5">
                        <DeptIcon className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                          <h3 className="text-sm font-bold text-foreground leading-snug">
                            {deptItem.name}
                          </h3>
                          <span className="self-start sm:self-center text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                            {deptItem.beds}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground font-medium mt-0.5">
                          {deptItem.lead}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {deptItem.desc}
                    </p>

                    <div className="pt-2.5 border-t border-border flex flex-wrap items-center justify-between gap-2 text-xs font-medium">
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                        <HiCheck className="h-3.5 w-3.5" />
                        {deptItem.ratio}
                      </span>

                      <Link
                        to="/employer/post-shift"
                        className="text-primary hover:underline font-semibold flex items-center gap-1"
                      >
                        Post shift for this unit →
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB CONTENT 3: ACTIVE JOBS & SHIFTS ================= */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            {/* Shifts Section */}
            <div className="space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <HiOutlineBolt className="h-5 w-5 text-amber-500 shrink-0" />
                    <span>Active On-Demand Clinical Shifts</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Urgent per-diem hospital shifts available for immediate claim with 24-hr escrow payout.
                  </p>
                </div>
                <Button asChild size="sm" className="rounded-xl text-xs font-semibold h-8 gap-1 self-start sm:self-center shrink-0">
                  <Link to="/employer/post-shift">
                    <span>+ Post new shift</span>
                  </Link>
                </Button>
              </div>

              {hospitalShifts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-xs text-muted-foreground">
                  No active shifts posted yet. Click "+ Post new shift" to broadcast urgent openings.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {hospitalShifts.map((sh) => (
                    <div
                      key={sh.id}
                      className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3 hover:border-primary/40 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div>
                          <h3 className="text-sm font-bold text-foreground">{sh.title}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {sh.dept} · {sh.city}
                          </p>
                        </div>
                        <span className="self-start sm:self-auto text-xs font-bold text-primary font-mono bg-primary/10 px-2 py-0.5 rounded-md shrink-0">
                          ₹{sh.rate * sh.hours} (₹{sh.rate}/hr)
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <HiOutlineClock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{sh.date}</span>
                      </div>

                      <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                          <HiOutlineShieldCheck className="h-3.5 w-3.5" /> 24-hr Payout
                        </span>
                        <Button asChild variant="outline" size="sm" className="rounded-lg text-xs h-7">
                          <Link to="/shifts">View shift details</Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Permanent Jobs Section */}
            <div className="space-y-3.5 pt-4 border-t border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                <div>
                  <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                    <HiOutlineBriefcase className="h-5 w-5 text-primary shrink-0" />
                    <span>Permanent & Long-Term Clinical Careers</span>
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Full-time nursing, medical officer, and allied healthcare vacancies at {hospitalName}.
                  </p>
                </div>
                <Button asChild variant="outline" size="sm" className="rounded-xl text-xs font-semibold h-8 gap-1 self-start sm:self-center shrink-0">
                  <Link to="/employer/post">
                    <span>+ Post a job</span>
                  </Link>
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {hospitalJobs.map((jb) => (
                  <div
                    key={jb.id}
                    className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3 hover:border-primary/40 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-foreground">{jb.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {jb.dept} · {jb.city} · {jb.exp} exp
                        </p>
                      </div>
                      <span className="self-start sm:self-auto text-xs font-bold text-foreground font-mono bg-muted px-2 py-0.5 rounded-md shrink-0">
                        {jb.salary}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {jb.tags?.map((t) => (
                        <span key={t} className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-primary font-semibold">{jb.type}</span>
                      <Button asChild size="sm" variant="ghost" className="rounded-lg text-xs h-7 text-primary hover:bg-primary-soft">
                        <Link to="/jobs/$id" params={{ id: jb.id }}>
                          View job requirement →
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB CONTENT 4: STAFF CULTURE & BENEFITS ================= */}
        {activeTab === "benefits" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Healthcare Staff Amenities, Safety & Institutional Culture
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Institutional benefits, housing, safety protocols, and career advancement programs.
                </p>
              </div>
              <span className="self-start sm:self-center text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-full shrink-0">
                NABH Staff Safety Standard
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {hospitalStaffBenefits.map((ben) => {
                const BenIcon = ben.icon;
                return (
                  <div
                    key={ben.title}
                    className="rounded-2xl border border-border bg-card p-5 shadow-xs space-y-2.5 hover:border-primary/40 transition-all"
                  >
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary shadow-2xs">
                      <BenIcon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-bold text-foreground">{ben.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed">{ben.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB CONTENT 5: ACCREDITATIONS & QUALITY ================= */}
        {activeTab === "accreditations" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Verified Institutional Accreditations & Quality Certifications
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Validated regulatory compliance with national and international healthcare accreditation boards.
                </p>
              </div>
              <span className="self-start sm:self-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                100% Certified
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {accreditationList.map((acc) => (
                <div
                  key={acc.title}
                  className="rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3 hover:border-primary/40 transition-all"
                >
                  <div className="flex items-start gap-3 sm:gap-3.5">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 shadow-2xs mt-0.5">
                      <HiOutlineDocumentCheck className="h-5 w-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2">
                        <h3 className="text-sm font-bold text-foreground leading-snug">
                          {acc.title}
                        </h3>
                        <span className="self-start sm:self-center text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full whitespace-nowrap shrink-0">
                          {acc.validity}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{acc.org}</p>
                    </div>
                  </div>

                  <p className="text-xs text-foreground font-medium leading-relaxed bg-muted/30 p-2.5 rounded-xl border border-border/60">
                    {acc.standard}
                  </p>

                  <div className="pt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground font-mono">
                    <span className="truncate mr-2">Cert ID: {acc.code}</span>
                    <span className="text-primary font-semibold flex items-center gap-1 font-sans shrink-0">
                      Verified <HiCheck className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ================= EDIT HOSPITAL PROFILE MODAL ================= */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-xl p-6">
          <DialogHeader className="text-left">
            <DialogTitle className="text-lg font-bold text-foreground">
              Edit Hospital Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update institutional information visible to nurses, doctors, and job seekers on FALE.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Hospital Name */}
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Hospital Name</label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            {/* Tagline */}
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Clinical Tagline</label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20"
              />
            </div>

            {/* City Custom Select & Total Beds */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Primary City</label>
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

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Total Inpatient Beds</label>
                <input
                  type="text"
                  value={bedCapacity}
                  onChange={(e) => setBedCapacity(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 font-mono"
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Main Campus Address</label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-input bg-card p-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 resize-none"
              />
            </div>

            {/* Contacts */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Emergency 24/7 Hotline</label>
                <input
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">HR / Nursing Desk</label>
                <input
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-card px-3 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-ring/20 font-mono"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-xl text-xs font-semibold h-10 px-4 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveProfile}
              className="rounded-xl text-xs font-bold h-10 px-5 shadow-xs bg-primary hover:bg-primary-hover cursor-pointer"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
