import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlineShieldCheck,
  HiOutlineCheckBadge,
  HiOutlinePhone,
  HiOutlineShare,
  HiOutlinePencilSquare,
  HiOutlineGlobeAlt,
  HiOutlineBolt,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineDocumentCheck,
  HiOutlineSparkles,
  HiOutlineAcademicCap,
  HiOutlineHeart,
  HiCheck,
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell } from "@/components/fale/AppShell";
import { OrgMark } from "@/components/fale/JobCard";
import { SelectField } from "@/components/fale/fields";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useApp, setState } from "@/lib/store";
import hospitalBannerImg from "@/assets/hospital-banner.jpg";

export const Route = createFileRoute("/employer/profile")({
  head: () => ({
    meta: [
      { title: "Hospital Profile & Institution Overview — FALE" },
      {
        name: "description",
        content:
          "Verified hospital institution profile, clinical departments, accreditations, nurse-to-patient ratios, and facility details.",
      },
      { property: "og:title", content: "Hospital Profile — FALE Healthcare" },
      {
        property: "og:description",
        content: "Verified clinical institution profile, departments, and accreditations.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HospitalProfileScreen,
});

const specialtyTags = [
  "Critical Care Medicine",
  "Cardiology & Cath Lab",
  "Emergency Trauma & Stroke",
  "Robotic Onco Surgery",
  "Nephrology & Dialysis",
  "Neurology & Neuro-ICU",
  "Neonatal & PICU (Level-3)",
  "Orthopedics & Joint Replacement",
  "Organ Transplant Services",
  "Gastroenterology & Endoscopy",
];

const accreditationList = [
  {
    title: "NABH Full Hospital Accreditation",
    org: "National Accreditation Board for Hospitals & Healthcare Providers",
    badge: "5th Edition Certified",
    validity: "Valid through Dec 2028",
  },
  {
    title: "JCI Gold Seal of Approval®",
    org: "Joint Commission International, USA",
    badge: "International Standard",
    validity: "Valid through Nov 2027",
  },
  {
    title: "NABL Certified Diagnostic Labs",
    org: "National Accreditation Board for Testing and Calibration Labs",
    badge: "ISO 15189 Compliant",
    validity: "Valid through Aug 2028",
  },
  {
    title: "AERB Radiation Safety Clearance",
    org: "Atomic Energy Regulatory Board of India",
    badge: "Safety Compliant",
    validity: "Valid through 2029",
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
  "Kochi",
];

function HospitalProfileScreen() {
  const store = useApp();
  const profile = (store.profile || {}) as Record<string, string>;

  // Editable Profile State
  const [hospitalName, setHospitalName] = useState(
    profile["org"] || "Apollo Hospitals — Main Campus"
  );
  const [tagline, setTagline] = useState(
    profile["tagline"] || "Quaternary Care Multi-Specialty & Organ Transplant Center"
  );
  const [city, setCity] = useState(profile["city"] || "Chennai");
  const [address, setAddress] = useState(
    profile["address"] || "Ramasamy Street, Ward 180, Zone 13 Adyar, Chennai, Chennai Metropolitan Area, Velachery, Chennai District, Tamil Nadu, 600113, India"
  );
  const [bedCapacity, setBedCapacity] = useState(profile["bedCapacity"] || "750");
  const [icuBeds, setIcuBeds] = useState(profile["icuBeds"] || "180");
  const [contactPhone, setContactPhone] = useState(profile["contactPhone"] || "+91 80 2630 4050");
  const [emergencyPhone, setEmergencyPhone] = useState(profile["emergencyPhone"] || "+91 80 1066");
  const [hrEmail, setHrEmail] = useState(profile["hrEmail"] || "clinical.careers@apollohospitals.com");
  const [website, setWebsite] = useState(profile["website"] || "https://www.apollohospitals.com");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Handle Edit Save
  const handleSaveProfile = () => {
    setState((s) => ({
      profile: {
        ...s.profile,
        org: hospitalName,
        city,
        tagline,
        address,
        bedCapacity,
        icuBeds,
        contactPhone,
        emergencyPhone,
        hrEmail,
        website,
      },
    }));
    setIsEditModalOpen(false);
    toast.success("Hospital profile updated successfully");
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Profile link copied");
  };

  const handleCopyAddress = () => {
    navigator.clipboard?.writeText(address);
    toast.success("Address copied to clipboard");
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl space-y-6 pb-20 min-w-0">
        {/* ================= HERO CARD ================= */}
        <div className="relative rounded-2xl border border-border/80 bg-card overflow-hidden shadow-2xs">
          {/* Cover Banner */}
          <div className="relative h-40 sm:h-48 w-full overflow-hidden bg-slate-900">
            <img
              src={hospitalBannerImg}
              alt={hospitalName}
              className="h-full w-full object-cover object-center opacity-85"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent pointer-events-none" />
            <div className="absolute top-4 right-4 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-background/90 backdrop-blur-md px-3 py-1 text-xs font-semibold text-foreground border border-border/60">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Verified Hospital</span>
              </span>
            </div>
          </div>

          {/* Hospital Header & Info */}
          <div className="px-4 sm:px-6 pb-5 pt-3 sm:pt-4 relative bg-card">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              {/* Left: Avatar & Hospital Info */}
              <div className="flex flex-col sm:flex-row sm:items-end gap-3.5 sm:gap-4 min-w-0">
                {/* Logo with isolated negative margin */}
                <div className="-mt-12 sm:-mt-14 shrink-0 relative z-10 self-start">
                  <OrgMark
                    name={hospitalName}
                    className="h-18 w-18 sm:h-22 sm:w-22 text-2xl sm:text-3xl rounded-2xl shadow-md border-4 border-card bg-card"
                  />
                </div>

                {/* Hospital Titles */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                      {hospitalName}
                    </h1>
                    <HiOutlineCheckBadge className="h-5 w-5 text-primary shrink-0" />
                  </div>

                  <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
                    {tagline}
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <HiOutlineMapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      {city}, India
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>{bedCapacity} Beds ({icuBeds} ICU)</span>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                      NABH &amp; JCI Accredited
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Clean balanced row on mobile, right-aligned on desktop */}
              <div className="flex items-center gap-2 shrink-0 pt-1 sm:pt-0 w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="flex-1 sm:flex-none rounded-xl text-xs font-semibold h-9 px-3 gap-1.5 cursor-pointer border-border/80"
                >
                  <HiOutlineShare className="h-3.5 w-3.5" />
                  <span>Share</span>
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditModalOpen(true)}
                  className="flex-1 sm:flex-none rounded-xl text-xs font-semibold h-9 px-3.5 gap-1.5 cursor-pointer border-border/80"
                >
                  <HiOutlinePencilSquare className="h-3.5 w-3.5 text-primary" />
                  <span>Edit</span>
                </Button>

                <Button
                  asChild
                  size="sm"
                  className="flex-1 sm:flex-none rounded-xl text-xs font-bold h-9 px-4 gap-1.5 bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer shadow-xs"
                >
                  <Link to="/employer/post-shift">
                    <HiOutlineBolt className="h-3.5 w-3.5" />
                    <span>+ Post Shift</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar (Hospital Specific) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/70 border-t border-border/70 text-center overflow-hidden">
            <div className="p-3 bg-card">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Total Inpatient Beds
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-foreground mt-0.5 block">
                {bedCapacity}+ Beds
              </span>
            </div>

            <div className="p-3 bg-card">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                ICU &amp; Critical Care
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-foreground mt-0.5 block">
                {icuBeds} Beds
              </span>
            </div>

            <div className="p-3 bg-card">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Modular OT Suites
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-foreground mt-0.5 block">
                18 OTs &amp; Cath Labs
              </span>
            </div>

            <div className="p-3 bg-card">
              <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                Accreditation Standard
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                NABH &amp; JCI
              </span>
            </div>
          </div>
        </div>

        {/* ================= MAIN HOSPITAL DETAILS GRID ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Hospital Clinical Overview & Infrastructure (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* About Institution */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-3.5">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                  About the Institution
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-foreground/90 leading-relaxed font-medium">
                  {hospitalName} is recognized for delivering high-acuity tertiary and quaternary healthcare, equipped with state-of-the-art surgical theaters, closed ICUs, comprehensive organ transplant capabilities, and 24/7 level-1 emergency response.
                </p>
              </div>

              {/* Specialization Tags */}
              <div className="pt-3 border-t border-border/60">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block mb-2">
                  Specialties &amp; Centers of Excellence
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {specialtyTags.map((spec) => (
                    <span
                      key={spec}
                      className="rounded-lg bg-muted/70 border border-border/60 px-2.5 py-1 text-xs font-semibold text-foreground/90"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Clinical Infrastructure & Bed Breakdown */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <HiOutlineBuildingOffice2 className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Clinical Infrastructure &amp; Capacity
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-muted-foreground shrink-0">
                  Tier-1 Quaternary Center
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-border/70 bg-muted/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">
                    Inpatient Capacity
                  </span>
                  <span className="text-base font-bold text-foreground font-mono mt-0.5 block">
                    {bedCapacity}+ Beds
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
                    Private &amp; Shared
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border/70 bg-muted/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">
                    Critical Care (ICU)
                  </span>
                  <span className="text-base font-bold text-primary font-mono mt-0.5 block">
                    {icuBeds} Beds
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
                    Ventilator Equipped
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border/70 bg-muted/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">
                    Operation Theatres
                  </span>
                  <span className="text-base font-bold text-foreground font-mono mt-0.5 block">
                    18 Modular OTs
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
                    Robotic &amp; Laminar
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border/70 bg-muted/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">
                    Cath Labs
                  </span>
                  <span className="text-base font-bold text-foreground font-mono mt-0.5 block">
                    3 Hybrid Labs
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
                    24/7 Primary PCI
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border/70 bg-muted/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">
                    Trauma Level
                  </span>
                  <span className="text-base font-bold text-foreground font-mono mt-0.5 block">
                    Level-1 Center
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
                    Dedicated CT/MRI
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border/70 bg-muted/20 text-center">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">
                    Dialysis Stations
                  </span>
                  <span className="text-base font-bold text-foreground font-mono mt-0.5 block">
                    36 Stations
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
                    CRRT &amp; SLEDD Cover
                  </span>
                </div>
              </div>
            </div>

            {/* Nurse-to-Patient Staffing Standards */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 shrink-0">
                    <HiOutlineShieldCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Nurse-to-Patient Staffing Commitment
                  </h3>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 rounded-full">
                  NABH Standard
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5 sm:p-3 text-center min-w-0">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">
                    Critical Care
                  </span>
                  <span className="text-base sm:text-xl font-black text-primary font-mono mt-0.5 block whitespace-nowrap">
                    1:1
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
                    ICU Bedside
                  </span>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5 sm:p-3 text-center min-w-0">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">
                    Step-Down
                  </span>
                  <span className="text-base sm:text-xl font-black text-foreground font-mono mt-0.5 block whitespace-nowrap">
                    1:2
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
                    High Dep.
                  </span>
                </div>

                <div className="rounded-xl border border-border/70 bg-muted/20 p-2.5 sm:p-3 text-center min-w-0">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block truncate">
                    General Ward
                  </span>
                  <span className="text-base sm:text-xl font-black text-foreground font-mono mt-0.5 block whitespace-nowrap">
                    1:4
                  </span>
                  <span className="text-[10px] text-muted-foreground mt-0.5 block truncate">
                    Routine Care
                  </span>
                </div>
              </div>
            </div>

            {/* Quality Accreditations */}
            <div className="rounded-2xl border border-border/80 bg-card p-4 sm:p-5 shadow-2xs space-y-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 shrink-0">
                    <HiOutlineDocumentCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Quality Accreditations &amp; Certifications
                  </h3>
                </div>
                <span className="shrink-0 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-full">
                  100% Verified
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accreditationList.map((acc) => (
                  <div
                    key={acc.title}
                    className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="text-xs font-bold text-foreground leading-snug">
                        {acc.title}
                      </span>
                      <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 shrink-0">
                        {acc.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1">
                      {acc.org}
                    </p>
                    <span className="text-[10px] font-mono text-muted-foreground block pt-0.5">
                      {acc.validity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Hospital Contact, Location & Trust (5 cols) */}
          <div className="lg:col-span-5 space-y-5 lg:sticky lg:top-20">
            {/* Hospital Contact Information Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
                <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <HiOutlineBuildingOffice2 className="h-4 w-4 text-primary" />
                  <span>Hospital Information</span>
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyAddress}
                  className="h-6 px-2 text-[10px] text-primary hover:bg-primary-soft cursor-pointer"
                >
                  Copy Address
                </Button>
              </div>

              <div className="space-y-3.5 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Campus Address
                  </span>
                  <p className="mt-1 font-medium text-foreground leading-relaxed text-xs">
                    {address}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    24/7 Emergency Hotline
                  </span>
                  <a
                    href={`tel:${emergencyPhone}`}
                    className="mt-1 font-bold text-destructive hover:underline flex items-center gap-1.5 font-mono text-sm"
                  >
                    <HiOutlinePhone className="h-4 w-4 shrink-0" />
                    <span>{emergencyPhone}</span>
                  </a>
                </div>

                <div className="pt-2.5 border-t border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    HR &amp; Staffing Desk
                  </span>
                  <p className="mt-1 font-medium text-foreground">{contactPhone}</p>
                  <a
                    href={`mailto:${hrEmail}`}
                    className="text-primary hover:underline block mt-0.5 text-[11px] truncate"
                  >
                    {hrEmail}
                  </a>
                </div>

                <div className="pt-2.5 border-t border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Website
                  </span>
                  <a
                    href={website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 font-medium text-primary hover:underline flex items-center gap-1 text-xs"
                  >
                    <HiOutlineGlobeAlt className="h-3.5 w-3.5" />
                    <span>Visit Hospital Portal</span>
                    <HiOutlineArrowTopRightOnSquare className="h-3 w-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Escrow & Council Compliance Card */}
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <HiOutlineShieldCheck className="h-4.5 w-4.5 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  FALE Nodal Escrow Partner
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/90 leading-relaxed">
                NABH 5th Edition &amp; JCI Certified. All clinician shifts posted by {hospitalName} are protected by automated 24-hr escrow signoffs and State Medical/Nursing Council verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= EDIT HOSPITAL PROFILE MODAL ================= */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-xl p-5 sm:p-6 rounded-3xl sm:overflow-y-visible max-h-[92vh] sm:max-h-none shadow-2xl">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground">
              Edit Hospital Details
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update institutional name, location, beds, and contact hotlines.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-1 text-xs">
            {/* Hospital Name */}
            <div className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                Hospital Name
              </span>
              <input
                id="modal-hospital-name"
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            {/* Tagline */}
            <div className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                Tagline / Specialty
              </span>
              <input
                id="modal-tagline"
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
              />
            </div>

            {/* City Custom Select & Beds */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SelectField
                label="City"
                options={availableCities}
                value={city}
                onChange={setCity}
                placeholder="Select City"
              />

              <div className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                  Total Beds
                </span>
                <input
                  id="modal-bed-capacity"
                  type="text"
                  value={bedCapacity}
                  onChange={(e) => setBedCapacity(e.target.value)}
                  className="h-[46px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>

              <div className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                  ICU Beds
                </span>
                <input
                  id="modal-icu-beds"
                  type="text"
                  value={icuBeds}
                  onChange={(e) => setIcuBeds(e.target.value)}
                  className="h-[46px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>

            {/* Address */}
            <div className="block">
              <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                Address
              </span>
              <textarea
                id="modal-address"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full rounded-xl border border-input bg-card p-3 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none leading-relaxed"
              />
            </div>

            {/* Contacts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                  Emergency Phone
                </span>
                <input
                  id="modal-emergency-phone"
                  type="text"
                  value={emergencyPhone}
                  onChange={(e) => setEmergencyPhone(e.target.value)}
                  className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
              <div className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                  HR Phone
                </span>
                <input
                  id="modal-hr-phone"
                  type="text"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3.5 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              className="rounded-xl text-xs font-semibold h-10 px-5 cursor-pointer border-border/80"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveProfile}
              className="rounded-xl text-xs font-bold h-10 px-6 shadow-sm bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer"
            >
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
