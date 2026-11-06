import { useState, useEffect } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlineShieldCheck,
  HiOutlineCheckBadge,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineShare,
  HiOutlinePencilSquare,
  HiOutlineGlobeAlt,
  HiOutlineBolt,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineDocumentCheck,
  HiOutlineIdentification,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineUser,
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
import { isApiEnabled } from "@/lib/api";
import {
  getFacilityProfile,
  updateFacilityProfile,
  type FacilityProfileDto,
} from "@/lib/adapters/facilityAdapter";
import hospitalBannerImg from "@/assets/hospital-banner.jpg";

export const Route = createFileRoute("/employer/profile")({
  head: () => ({
    meta: [
      { title: "Hospital Profile & Institution Overview — FALE" },
      {
        name: "description",
        content:
          "Verified hospital institution profile, clinical departments, accreditations, and infrastructure details.",
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

const defaultDepartments = [
  "Emergency & Trauma",
  "Critical Care Medicine (ICU)",
  "General Medicine",
  "General & Laparoscopic Surgery",
  "Cardiology",
  "Nephrology & Dialysis",
  "Pediatrics & Neonatology",
  "Orthopedics",
  "Obstetrics & Gynecology",
  "Anesthesiology",
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
  "Coimbatore",
  "Madurai",
];

const accreditationOptions = [
  "NABH Full Hospital Accreditation",
  "NABH Entry Level Certification",
  "JCI Gold Seal of Approval®",
  "NABL Certified Diagnostic Labs",
  "State Medical Council Approved",
  "KPME Registered Center",
];

function HospitalProfileScreen() {
  const store = useApp();
  const profile = (store.profile || {}) as Record<string, any>;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [facilityData, setFacilityData] = useState<FacilityProfileDto | null>(null);

  // Form / Display State
  const [hospitalName, setHospitalName] = useState(profile["org"] || "Healthcare Facility");
  const [facilityType, setFacilityType] = useState("Multispecialty Hospital");
  const [about, setAbout] = useState("");
  const [city, setCity] = useState(profile["city"] || "Chennai");
  const [stateName, setStateName] = useState("Tamil Nadu");
  const [pincode, setPincode] = useState("");
  const [addressLine, setAddressLine] = useState(profile["address"] || "");
  const [beds, setBeds] = useState("50");
  const [icuBeds, setIcuBeds] = useState("10");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [gst, setGst] = useState("");
  const [nabhNumber, setNabhNumber] = useState("");
  const [accreditationLevel, setAccreditationLevel] = useState("NABH Full Accreditation");
  const [contactPerson, setContactPerson] = useState("Facility Administrator");
  const [designation, setDesignation] = useState("Medical Superintendent");
  const [contactPhone, setContactPhone] = useState(profile["phone"] || "");
  const [contactEmail, setContactEmail] = useState(profile["email"] || "");
  const [website, setWebsite] = useState("");
  const [departments, setDepartments] = useState<string[]>(defaultDepartments);
  const [newDeptInput, setNewDeptInput] = useState("");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        if (!isApiEnabled) {
          setLoading(false);
          return;
        }
        const data = await getFacilityProfile();
        if (data && isMounted) {
          setFacilityData(data);
          if (data.hospitalName) setHospitalName(data.hospitalName);
          if (data.facilityType) setFacilityType(data.facilityType);
          if (data.about) setAbout(data.about);
          if (data.city) setCity(data.city);
          if (data.state) setStateName(data.state);
          if (data.pincode) setPincode(data.pincode);
          if (data.addressLine) setAddressLine(data.addressLine);
          if (data.beds !== undefined && data.beds !== null) setBeds(String(data.beds));
          if (data.icuBeds !== undefined && data.icuBeds !== null) setIcuBeds(String(data.icuBeds));
          if (data.licenseNumber) setLicenseNumber(data.licenseNumber);
          if (data.gst) setGst(data.gst);
          if (data.nabhNumber) setNabhNumber(data.nabhNumber);
          if (data.accreditationLevel) setAccreditationLevel(data.accreditationLevel);
          if (data.contactPerson) setContactPerson(data.contactPerson);
          if (data.designation) setDesignation(data.designation);
          if (data.contactPhone) setContactPhone(data.contactPhone);
          if (data.contactEmail) setContactEmail(data.contactEmail);
          if (data.website) setWebsite(data.website);
          if (data.departments && data.departments.length > 0) {
            setDepartments(data.departments);
          }
        }
      } catch (err) {
        console.error("Failed to load facility profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleAddDepartment = () => {
    const val = newDeptInput.trim();
    if (!val) return;
    if (departments.some((d) => d.toLowerCase() === val.toLowerCase())) {
      toast.info("Specialty already added");
      return;
    }
    setDepartments([...departments, val]);
    setNewDeptInput("");
  };

  const handleRemoveDepartment = (depToRemove: string) => {
    setDepartments(departments.filter((d) => d !== depToRemove));
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const parsedBeds = parseInt(beds, 10) || 0;
      const parsedIcuBeds = parseInt(icuBeds, 10) || 0;

      const payload: Partial<FacilityProfileDto> = {
        hospitalName: hospitalName.trim(),
        facilityType: facilityType.trim(),
        about: about.trim(),
        city: city.trim(),
        state: stateName.trim(),
        pincode: pincode.trim(),
        addressLine: addressLine.trim(),
        beds: parsedBeds,
        icuBeds: parsedIcuBeds,
        licenseNumber: licenseNumber.trim(),
        gst: gst.trim(),
        nabhNumber: nabhNumber.trim(),
        accreditationLevel: accreditationLevel.trim(),
        contactPerson: contactPerson.trim(),
        designation: designation.trim(),
        contactPhone: contactPhone.trim(),
        contactEmail: contactEmail.trim().toLowerCase(),
        website: website.trim(),
        departments,
      };

      if (isApiEnabled) {
        const updated = await updateFacilityProfile(payload);
        setFacilityData(updated);
      }

      setState((s) => ({
        profile: {
          ...s.profile,
          org: hospitalName,
          city,
          address: addressLine,
          bedCapacity: beds,
          icuBeds,
          contactPhone,
          contactEmail,
          website,
        },
      }));

      setIsEditModalOpen(false);
      toast.success("Hospital profile updated successfully");
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      toast.error(err?.message || "Failed to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Profile link copied");
  };

  const handleCopyAddress = () => {
    const fullAddr = [addressLine, city, stateName, pincode].filter(Boolean).join(", ");
    navigator.clipboard?.writeText(fullAddr || addressLine);
    toast.success("Address copied to clipboard");
  };

  const fullDisplayAddress = [addressLine, city, stateName, pincode].filter(Boolean).join(", ");
  const isVerified = facilityData?.kycStatus === "VERIFIED" || store.profile?.isVerified;

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
                <span
                  className={`h-2 w-2 rounded-full ${
                    isVerified ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span>{isVerified ? "Verified Hospital" : "KYC Active"}</span>
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
                    {facilityType || "Multispecialty Healthcare Facility"}
                  </p>

                  <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1 font-medium text-foreground">
                      <HiOutlineMapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                      {city}{stateName ? `, ${stateName}` : ""}, India
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span>
                      {beds}+ Beds{Number(icuBeds) > 0 ? ` (${icuBeds} ICU)` : ""}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    <span className="text-primary font-medium flex items-center gap-1">
                      <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                      {accreditationLevel || (isVerified ? "Verified Institution" : "KPME Registered")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
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

          {/* Quick Dynamic Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/70 border-t border-border/70 text-center overflow-hidden">
            <div className="p-3 bg-card">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Total Inpatient Beds
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-foreground mt-0.5 block">
                {beds}+ Beds
              </span>
              <span className="text-[10px] text-muted-foreground block">Sanctioned &amp; Operational</span>
            </div>

            <div className="p-3 bg-card">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                ICU &amp; Critical Care
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-foreground mt-0.5 block">
                {icuBeds} Beds
              </span>
              <span className="text-[10px] text-muted-foreground block">Ventilator &amp; Monitored</span>
            </div>

            <div className="p-3 bg-card">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Clinical Specialties
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-foreground mt-0.5 block">
                {departments.length} Specialties
              </span>
              <span className="text-[10px] text-muted-foreground block">Active Departments</span>
            </div>

            <div className="p-3 bg-card">
              <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                Accreditation Status
              </span>
              <span className="text-base sm:text-lg font-bold font-mono text-primary mt-0.5 block truncate px-1">
                {accreditationLevel.includes("NABH") ? "NABH Standard" : accreditationLevel.slice(0, 15)}
              </span>
              <span className="text-[10px] text-muted-foreground block">
                {isVerified ? "Audited & Verified" : "Council Registered"}
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
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                  About the Institution
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
              </div>

              <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal">
                {about ||
                  `${hospitalName} is an accredited healthcare facility located in ${city}${
                    stateName ? `, ${stateName}` : ""
                  }, dedicated to patient-centered clinical care, inpatient multi-specialty services, and round-the-clock emergency response.`}
              </p>

              {/* Specialization Tags */}
              <div className="pt-3 border-t border-border/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
                    Specialties &amp; Clinical Departments ({departments.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="text-[11px] text-primary hover:underline font-semibold cursor-pointer"
                  >
                    + Manage
                  </button>
                </div>

                {departments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No departments added yet. Click &quot;Manage&quot; to configure your specialties.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {departments.map((spec) => (
                      <span
                        key={spec}
                        className="rounded-lg bg-muted/70 border border-border/60 px-2.5 py-1 text-xs font-semibold text-foreground/90"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Regulatory & Institutional Credentials Card */}
            <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-2xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <HiOutlineDocumentCheck className="h-4 w-4" />
                  </div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Institutional Credentials &amp; Licensing
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  {isVerified ? "Verified Facility" : "Active Registration"}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Clinical Establishment Reg.
                    </span>
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                      KPME / CEA
                    </span>
                  </div>
                  <p className="text-xs font-mono font-bold text-foreground">
                    {licenseNumber || "CEA-REG-PENDING"}
                  </p>
                  <span className="text-[10px] text-muted-foreground block">
                    State Health Authority Verified
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      Accreditation Level
                    </span>
                    <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                      Standard
                    </span>
                  </div>
                  <p className="text-xs font-bold text-foreground truncate">
                    {accreditationLevel}
                  </p>
                  <span className="text-[10px] text-muted-foreground block">
                    NABH / Quality Council of India
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      NABH Reference No.
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      Reference
                    </span>
                  </div>
                  <p className="text-xs font-mono font-bold text-foreground">
                    {nabhNumber || "NABH-AUDIT-ACTIVE"}
                  </p>
                  <span className="text-[10px] text-muted-foreground block">
                    Hospital Quality Compliance
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-border/70 bg-muted/20 space-y-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">
                      GSTIN Identification
                    </span>
                    <span className="text-[9px] font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      Tax Reg
                    </span>
                  </div>
                  <p className="text-xs font-mono font-bold text-foreground">
                    {gst || "GSTIN-REGISTERED"}
                  </p>
                  <span className="text-[10px] text-muted-foreground block">
                    Valid for GST Input &amp; Tax Invoices
                  </span>
                </div>
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
                {/* Address */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Campus Address
                  </span>
                  <p className="mt-1 font-medium text-foreground leading-relaxed text-xs">
                    {fullDisplayAddress || "Campus address not configured"}
                  </p>
                </div>

                {/* Contact Person */}
                <div className="pt-2.5 border-t border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Administrative Desk
                  </span>
                  <div className="mt-1 flex items-center gap-1.5 font-semibold text-foreground">
                    <HiOutlineUser className="h-3.5 w-3.5 text-muted-foreground" />
                    <span>{contactPerson || "Facility Administrator"}</span>
                    {designation && (
                      <span className="text-[11px] text-muted-foreground font-normal">
                        ({designation})
                      </span>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div className="pt-2.5 border-t border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Official Phone / Staffing Desk
                  </span>
                  {contactPhone ? (
                    <a
                      href={`tel:${contactPhone}`}
                      className="mt-1 font-mono font-bold text-foreground hover:text-primary flex items-center gap-1.5"
                    >
                      <HiOutlinePhone className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{contactPhone}</span>
                    </a>
                  ) : (
                    <p className="mt-1 text-muted-foreground italic">Phone not configured</p>
                  )}
                </div>

                {/* Email */}
                <div className="pt-2.5 border-t border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Official Email
                  </span>
                  {contactEmail ? (
                    <a
                      href={`mailto:${contactEmail}`}
                      className="mt-1 font-medium text-primary hover:underline flex items-center gap-1.5 truncate"
                    >
                      <HiOutlineEnvelope className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{contactEmail}</span>
                    </a>
                  ) : (
                    <p className="mt-1 text-muted-foreground italic">Email not configured</p>
                  )}
                </div>

                {/* Website */}
                <div className="pt-2.5 border-t border-border/60">
                  <span className="text-[10px] uppercase font-bold text-muted-foreground block">
                    Website
                  </span>
                  {website ? (
                    <a
                      href={website.startsWith("http") ? website : `https://${website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 font-medium text-primary hover:underline flex items-center gap-1 text-xs"
                    >
                      <HiOutlineGlobeAlt className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">Visit Hospital Portal</span>
                      <HiOutlineArrowTopRightOnSquare className="h-3 w-3 shrink-0" />
                    </a>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="mt-1 text-xs text-primary hover:underline font-semibold cursor-pointer"
                    >
                      + Add Website
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Escrow & Council Compliance Card */}
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <HiOutlineShieldCheck className="h-4.5 w-4.5 text-primary shrink-0" />
                <span className="text-xs font-bold text-foreground">
                  FALE Escrow &amp; Council Verified
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                All clinician shifts and emergency deployments hosted by {hospitalName} are protected by automated 24-hr escrow signoffs, biometric attendance, and direct State Medical/Nursing Council verification.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= EDIT HOSPITAL PROFILE MODAL ================= */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-2xl p-5 sm:p-6 rounded-3xl max-h-[92vh] overflow-y-auto shadow-2xl">
          <DialogHeader className="text-left space-y-1">
            <DialogTitle className="text-lg font-bold text-foreground">
              Edit Hospital Profile
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Update your institutional identity, bed capacity, licensing, and contact details.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* General Info */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
                1. Basic Institutional Identity
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    Hospital / Facility Name *
                  </span>
                  <input
                    type="text"
                    value={hospitalName}
                    onChange={(e) => setHospitalName(e.target.value)}
                    placeholder="e.g. Apollo Hospital"
                    className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    Facility Type / Category *
                  </span>
                  <input
                    type="text"
                    value={facilityType}
                    onChange={(e) => setFacilityType(e.target.value)}
                    placeholder="e.g. Multispecialty Hospital"
                    className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>

              <div className="block">
                <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                  About the Institution
                </span>
                <textarea
                  rows={3}
                  value={about}
                  onChange={(e) => setAbout(e.target.value)}
                  placeholder="Describe your hospital, clinical focus, accreditations, and medical services..."
                  className="w-full rounded-xl border border-input bg-card p-3 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* Capacity & Location */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
                2. Bed Infrastructure &amp; Campus Location
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    Total Beds *
                  </span>
                  <input
                    type="number"
                    min="1"
                    value={beds}
                    onChange={(e) => setBeds(e.target.value)}
                    className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    ICU Beds
                  </span>
                  <input
                    type="number"
                    min="0"
                    value={icuBeds}
                    onChange={(e) => setIcuBeds(e.target.value)}
                    className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div className="block col-span-2">
                  <SelectField
                    label="City *"
                    options={availableCities}
                    value={city}
                    onChange={setCity}
                    placeholder="Select City"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    Campus Address Line
                  </span>
                  <input
                    type="text"
                    value={addressLine}
                    onChange={(e) => setAddressLine(e.target.value)}
                    placeholder="Door No, Street Name, Landmark"
                    className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    Pincode
                  </span>
                  <input
                    type="text"
                    value={pincode}
                    onChange={(e) => setPincode(e.target.value)}
                    placeholder="e.g. 600001"
                    className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Licensing & Regulatory */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
                3. Regulatory Licensing &amp; Accreditations
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    License / KPME Reg. No.
                  </span>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. CEA/2024/7821"
                    className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                  />
                </div>

                <div className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    Accreditation Standard
                  </span>
                  <input
                    type="text"
                    value={accreditationLevel}
                    onChange={(e) => setAccreditationLevel(e.target.value)}
                    placeholder="e.g. NABH Full Hospital Accreditation"
                    className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    NABH Registration No.
                  </span>
                  <input
                    type="text"
                    value={nabhNumber}
                    onChange={(e) => setNabhNumber(e.target.value)}
                    placeholder="e.g. NABH-2023-4512"
                    className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                  />
                </div>

                <div className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    GSTIN
                  </span>
                  <input
                    type="text"
                    value={gst}
                    onChange={(e) => setGst(e.target.value)}
                    placeholder="e.g. 33AAAAA0000A1Z5"
                    className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Administrative Contact */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
                4. Administrative &amp; Contact Desk
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    Contact Person Name
                  </span>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Dr. Ramesh Kumar"
                    className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    Designation
                  </span>
                  <input
                    type="text"
                    value={designation}
                    onChange={(e) => setDesignation(e.target.value)}
                    placeholder="e.g. Medical Superintendent / HR Head"
                    className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    Official Phone
                  </span>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="e.g. +919876543210"
                    className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all font-mono"
                  />
                </div>

                <div className="block">
                  <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    Official Email
                  </span>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="e.g. admin@hospital.com"
                    className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>

                <div className="block sm:col-span-2">
                  <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
                    Hospital Website
                  </span>
                  <input
                    type="url"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    placeholder="https://www.hospital.com"
                    className="h-[44px] w-full rounded-xl border border-input bg-card px-3.5 text-sm font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Specialties & Departments */}
            <div className="space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-primary border-b border-border/60 pb-1">
                5. Clinical Specialties &amp; Departments
              </h4>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDeptInput}
                  onChange={(e) => setNewDeptInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddDepartment();
                    }
                  }}
                  placeholder="Type department (e.g. Pulmonology) and press Add"
                  className="h-[42px] flex-1 rounded-xl border border-input bg-card px-3.5 text-xs font-medium text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
                />
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAddDepartment}
                  className="h-[42px] px-3.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold"
                >
                  <HiOutlinePlus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {departments.map((dept) => (
                  <span
                    key={dept}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-muted/80 border border-border/70 px-2.5 py-1 text-xs font-medium text-foreground"
                  >
                    <span>{dept}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveDepartment(dept)}
                      className="text-muted-foreground hover:text-destructive cursor-pointer"
                    >
                      <HiOutlineXMark className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-border/60">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(false)}
              disabled={saving}
              className="rounded-xl text-xs font-semibold h-10 px-5 cursor-pointer border-border/80"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSaveProfile}
              disabled={saving}
              className="rounded-xl text-xs font-bold h-10 px-6 shadow-sm bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer"
            >
              {saving ? "Saving Changes..." : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
