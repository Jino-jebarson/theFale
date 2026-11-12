import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { usePageLoad } from "@/hooks/use-page-load";
import { RequestError } from "@/components/fale/RequestError";
import { useState, useEffect, useRef, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlineBuildingOffice2,
  HiOutlineMapPin,
  HiOutlineShieldCheck,
  HiOutlineCheckBadge,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlinePencilSquare,
  HiOutlineGlobeAlt,
  HiOutlineBolt,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineDocumentCheck,
  HiOutlineDocumentText,
  HiOutlineIdentification,
  HiOutlinePlus,
  HiOutlineXMark,
  HiOutlineEye,
  HiOutlineArrowDownTray,
  HiOutlineArrowUpTray,
  HiOutlineCamera,
  HiOutlineCalendarDays,
  HiOutlineCheckCircle,
} from "react-icons/hi2";
import { RiVerifiedBadgeFill } from "react-icons/ri";
import { toast } from "sonner";
import { AppShell } from "@/components/fale/AppShell";
import { OrgMark } from "@/components/fale/JobCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useApp, setState } from "@/lib/store";
import { isApiEnabled } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  getFacilityProfile,
  updateFacilityProfile,
  getFacilityDocuments,
  uploadFacilityDocument,
  type FacilityProfileDto,
  type FacilityDocumentDto,
} from "@/lib/adapters/facilityAdapter";
import { generateFacilityDocumentBlob } from "@/lib/clinicalDocumentPdf";

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

type EditSection = "identity" | "about" | "credentials" | "address" | "specialties" | "contact" | null;

interface PreviewModalState {
  title: string;
  fileName: string;
  url: string;
  isImage: boolean;
}

function HospitalProfileScreen() {
  const pageLoad = usePageLoad();
  const pageAction = useConfirmedAction();
  const store = useApp();
  const profile = (store.profile || {}) as Record<string, any>;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [facilityData, setFacilityData] = useState<FacilityProfileDto | null>(null);
  const [facilityDocs, setFacilityDocs] = useState<FacilityDocumentDto[]>([]);

  // Form / Display State
  const [hospitalName, setHospitalName] = useState(profile["org"] || "Healthcare Facility");
  const [facilityType, setFacilityType] = useState("Multispecialty Hospital");
  const [about, setAbout] = useState("");
  const [city, setCity] = useState(profile["city"] || "");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [addressLine, setAddressLine] = useState(profile["address"] || "");
  const [beds, setBeds] = useState("");
  const [icuBeds, setIcuBeds] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [gst, setGst] = useState("");
  const [nabhNumber, setNabhNumber] = useState("");
  const [accreditationLevel, setAccreditationLevel] = useState("");
  const [contactPerson, setContactPerson] = useState("Facility Administrator");
  const [designation, setDesignation] = useState("");
  const [contactPhone, setContactPhone] = useState(profile["phone"] || "");
  const [contactEmail, setContactEmail] = useState(profile["email"] || "");
  const [website, setWebsite] = useState("");
  const [departments, setDepartments] = useState<string[]>([]);
  const [newDeptInput, setNewDeptInput] = useState("");

  // Section Edit Modal
  const [editSection, setEditSection] = useState<EditSection>(null);

  // Document Preview Modal State
  const [previewDoc, setPreviewDoc] = useState<PreviewModalState | null>(null);

  // Logo upload
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(profile["logoUrl"] || null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [data, docs] = await Promise.all([
          getFacilityProfile(),
          getFacilityDocuments(),
        ]);

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
          if (data.logoUrl) setLogoUrl(data.logoUrl);
          if (data.departments && data.departments.length > 0) {
            setDepartments(data.departments);
          }
          if (data.documents && data.documents.length > 0) {
            setFacilityDocs(data.documents);
          } else if (docs && docs.length > 0) {
            setFacilityDocs(docs);
          }
        }
      } catch (err) {
      pageLoad.fail(err);
        console.error("Failed to load facility profile:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [pageLoad.retryKey]);

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

  const handleSaveSection = async () => { await pageAction.run(async () => {
    try {
      setSaving(true);
      const parsedBeds = parseInt(beds, 10) || 50;
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
        logoUrl: logoUrl || undefined,
      };

      {
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
          logoUrl,
        },
      }));

      setEditSection(null);
      toast.success("Hospital details updated successfully");
    } catch (err: any) {
      console.error("Failed to update profile:", err);
      toast.error(err?.message || "Failed to update hospital profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }); };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file (PNG, JPG, JPEG, WEBP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image file must be under 5 MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;
      setLogoUrl(dataUrl);

      {
        try {
          await updateFacilityProfile({ logoUrl: dataUrl });
          toast.success("Hospital logo updated");
        } catch {
          toast.info("Logo updated locally");
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDocumentReplace = (docType: string, docTitle: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pdf,.png,.jpg,.jpeg,.webp";
    input.onchange = async (e: any) => {
      const file = e.target?.files?.[0];
      if (!file) return;
      if (file.size > 15 * 1024 * 1024) {
        toast.error("File size must be under 15 MB");
        return;
      }
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const base64Url = ev.target?.result as string;
        if (!base64Url) return;
        try {
          toast.loading(`Uploading ${docTitle}...`, { id: "vault-upload" });
          await uploadFacilityDocument({
            documentType: docType,
            originalFileName: file.name,
            fileUrl: base64Url,
          });
          toast.success(`${docTitle} uploaded successfully!`, { id: "vault-upload" });
          const docs = await getFacilityDocuments();
          setFacilityDocs(docs);
        } catch (err: any) {
      pageLoad.fail(err);
          toast.error("Upload failed: " + (err?.message || "Server error"), { id: "vault-upload" });
        }
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const handlePreviewDocument = (doc: {
    title: string;
    fileName: string;
    type: string;
    fileUrl?: string;
  }) => {
    const url = doc.fileUrl;
    if (!url || !/^(https?:|blob:|data:application\/pdf|data:image\/|\/)/i.test(url)) {
      toast.error("No uploaded document is available. Please upload a document first.");
      return;
    }
    const isImage = url.startsWith("data:image/") || /\.(png|jpe?g|webp|gif)$/i.test(doc.fileName);
    setPreviewDoc({ title: doc.title, fileName: doc.fileName, url, isImage });
  };

    const handleCopyAddress = () => {
      const fullAddr = [addressLine, city, stateName, pincode].filter(Boolean).join(", ");
      navigator.clipboard?.writeText(fullAddr || addressLine);
      toast.success("Hospital campus address copied to clipboard");
    };

    const fullDisplayAddress = [addressLine, city, stateName, pincode].filter(Boolean).join(", ");
    const isVerified = facilityData?.kycStatus === "VERIFIED" || store.profile?.isVerified;

    // Format document titles into institutional nomenclature
    const formatDocumentTitle = (typeOrKey: string): string => {
      const k = typeOrKey.toUpperCase();
      if (k.includes("REGISTRATION") || k.includes("LICENCE") || k.includes("LICENSE")) {
        return "Clinical Establishment Act (CEA) License";
      }
      if (k.includes("GST")) {
        return "Goods & Services Tax (GSTIN) Registration";
      }
      if (k.includes("REPRESENTATIVE") || k.includes("AUTHORIZATION")) {
        return "Representative Authorization Letter";
      }
      if (k.includes("NABH") || k.includes("ACCREDITATION") || k.includes("NABL")) {
        return "Hospital Accreditation & Standards Certificate";
      }
      if (k.includes("FIRE")) {
        return "Fire & Life Safety Clearance NOC";
      }
      if (k.includes("POLLUTION")) {
        return "State Pollution Control Board Clearance";
      }
      if (k.includes("BMW") || k.includes("WASTE")) {
        return "Bio-Medical Waste Authorization";
      }
      return typeOrKey.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    };

    // Format file extension and size cleanly
    const formatDocumentMeta = (fileName: string, sizeBytes?: number): string => {
      const ext = fileName.split(".").pop()?.toUpperCase() || "";
      const isImg = ["PNG", "JPG", "JPEG", "WEBP"].includes(ext);
      const typeLabel = isImg ? `${ext} Image` : ext === "PDF" ? "PDF Document" : "Official Document";
      if (sizeBytes && sizeBytes > 1024) {
        const sizeMb = (sizeBytes / (1024 * 1024)).toFixed(1);
        return `${sizeMb} MB • ${typeLabel}`;
      }
      return typeLabel;
    };

    // Build the statutory document vault list purely from actual documents received during onboarding
    const docVaultList = useMemo(() => {
      // 1. If backend facility documents exist, use them directly (excluding generic photo albums)
      const validBackendDocs = (facilityDocs || []).filter(
        (d) =>
          d.documentType !== "FACILITY_PHOTOS" &&
          d.documentType !== "HOSPITAL_PHOTO" &&
          Boolean(d.originalFileName) &&
          !d.originalFileName.toLowerCase().includes("photos uploaded")
      );

      if (validBackendDocs.length > 0) {
        return validBackendDocs.map((doc) => ({
          id: doc.id,
          type: doc.documentType,
          title: formatDocumentTitle(doc.documentType),
          fileName: doc.originalFileName,
          fileUrl: doc.fileUrl,
          verified: isVerified || Boolean(doc.verified),
          sizeText: formatDocumentMeta(doc.originalFileName, doc.fileSizeBytes),
        }));
      }

      // 2. Fallback to store.docs (saved during onboarding session)
      const storeDocs = (store.docs || {}) as Record<string, string>;
      const listFromStore = Object.entries(storeDocs)
        .filter(([label, fileName]) => Boolean(fileName) && !label.toLowerCase().includes("photo"))
        .map(([label, fileName], idx) => ({
          id: `store-doc-${idx}`,
          type: label.toUpperCase().replace(/[^A-Z0-9]/g, "_"),
          title: formatDocumentTitle(label),
          fileName,
          fileUrl: (store as any).docDataUrls?.[label] || "",
          verified: isVerified,
          sizeText: formatDocumentMeta(fileName),
        }));

      return listFromStore;
    }, [facilityDocs, store.docs, isVerified]);

    return (
      <AppShell>
      <RequestError message={pageLoad.error} onRetry={pageLoad.retry} />
        <div className="mx-auto max-w-6xl space-y-6 pb-20 min-w-0">
          {/* ========================================================================= */}
          {/* 1. EXECUTIVE SAFFRON MESH HEADER BANNER (Exact Candidate Match)           */}
          {/* ========================================================================= */}
          <div className="bg-card rounded-3xl border border-border shadow-xs overflow-hidden">
            {/* Executive Saffron Mesh Banner */}
            <div className="relative h-36 sm:h-48 bg-gradient-to-r from-primary-soft via-card to-primary-soft/30 border-b border-border p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
              {/* Subtle Brand Ambient Orbs */}
              <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
              <div className="absolute left-1/3 -bottom-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

              {/* Banner Top Row: Badges */}
              <div className="relative z-10 flex items-center justify-between gap-2 w-full">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-primary border border-primary/25 shadow-xs">
                  <HiOutlineShieldCheck className="h-4 w-4 text-primary shrink-0" />
                  <span>Verified Healthcare Institution</span>
                </span>

                <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 px-2.5 py-1 text-xs font-bold backdrop-blur-md">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                  <span>{isVerified ? "Regulatory Approved" : "State Health Authority Registered"}</span>
                </span>
              </div>
            </div>

            {/* Identity Body Strip */}
            <div className="px-4 sm:px-8 pb-6 sm:pb-7">
              <div className="-mt-14 sm:-mt-16 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                {/* Logo with Circular Shield & Update Camera Option */}
                <div className="relative shrink-0 group w-fit self-start">
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleLogoSelect}
                    className="hidden"
                  />

                  {logoUrl ? (
                    <img
                      src={logoUrl}
                      alt={hospitalName}
                      onClick={() => logoInputRef.current?.click()}
                      title="Click to update hospital logo"
                      className="h-24 w-24 sm:h-32 sm:w-32 rounded-3xl object-cover border-4 border-card shadow-md bg-card cursor-pointer hover:opacity-95 transition-opacity"
                    />
                  ) : (
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      title="Click to upload hospital logo"
                      className="h-24 w-24 sm:h-32 sm:w-32 rounded-3xl flex items-center justify-center font-black text-3xl sm:text-4xl text-primary bg-primary-soft border-4 border-card shadow-md cursor-pointer hover:opacity-95 transition-opacity"
                    >
                      {hospitalName.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  {/* Camera upload badge */}
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 p-2 rounded-full bg-primary text-white shadow-md hover:bg-primary-hover transition-transform active:scale-95 cursor-pointer z-10"
                    title="Upload hospital brand logo"
                  >
                    <HiOutlineCamera className="h-4 w-4" />
                  </button>
                </div>

                {/* Action Buttons: Equal 50/50 balance on mobile */}
                <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditSection("identity")}
                    className="flex-1 sm:flex-initial rounded-xl text-xs font-bold gap-1.5 border-border hover:border-primary text-foreground hover:text-primary h-10 sm:h-9 px-4 cursor-pointer shadow-xs justify-center"
                  >
                    <HiOutlinePencilSquare className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span>Edit Profile</span>
                  </Button>

                  <Button
                    asChild
                    size="sm"
                    className="flex-1 sm:flex-initial rounded-xl text-xs font-bold h-10 sm:h-9 px-4 gap-1.5 bg-primary hover:bg-primary-hover text-white shadow-xs cursor-pointer justify-center"
                  >
                    <Link to="/employer/post-shift">
                      <HiOutlineBolt className="h-3.5 w-3.5 shrink-0" />
                      <span>+ Post Shift</span>
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Hospital Name & Verified Pills Beside It (Exact Candidate Match) */}
              <div className="mt-4 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl sm:text-3xl font-black text-foreground tracking-tight break-words">
                    {hospitalName}
                  </h1>
                  <RiVerifiedBadgeFill
                    className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500 shrink-0"
                    title="State Health Authority & FALE Council Verified"
                  />

                  {/* Clean non-interactive badge pills beside name */}
                  <span className="rounded-full bg-primary-soft text-primary border border-primary/25 px-2.5 py-0.5 text-xs font-bold pointer-events-none transition-none select-none">
                    {facilityType || "Multispecialty Hospital"}
                  </span>

                  <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 text-xs font-bold pointer-events-none transition-none select-none flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    <span>State Registered</span>
                  </span>
                </div>

                {/* Sub-strip with Location, Beds, and Accreditation */}
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs text-muted-foreground pt-0.5">
                  <span className="inline-flex items-center gap-1 font-semibold text-foreground">
                    <HiOutlineMapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    {city}{stateName ? `, ${stateName}` : ""}, India
                  </span>
                  <span className="hidden sm:inline text-muted-foreground/40">•</span>
                  <span className="font-medium text-foreground">
                    {beds}+ Inpatient Beds{Number(icuBeds) > 0 ? ` (${icuBeds} ICU & Critical)` : ""}
                  </span>
                  <span className="hidden sm:inline text-muted-foreground/40">•</span>
                  <span className="text-primary font-bold flex items-center gap-1">
                    <HiOutlineShieldCheck className="h-3.5 w-3.5 shrink-0" />
                    License: {licenseNumber || "CEA-VERIFIED"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Dynamic Metrics Bar (Clean 4-Card Token Layout) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-border/70 border-t border-border text-center overflow-hidden">
              <div className="p-3 sm:p-4 bg-card">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                  Total Inpatient Beds
                </span>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground mt-0.5 block">
                  {beds}+ Beds
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5 truncate">Sanctioned &amp; Operational</span>
              </div>

              <div className="p-3 sm:p-4 bg-card">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                  ICU &amp; Critical Care
                </span>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground mt-0.5 block">
                  {icuBeds} Beds
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5 truncate">Ventilator &amp; Monitored</span>
              </div>

              <div className="p-3 sm:p-4 bg-card">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                  Clinical Specialties
                </span>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-foreground mt-0.5 block">
                  {departments.length} Units
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5 truncate">Active Departments</span>
              </div>

              <div className="p-3 sm:p-4 bg-card">
                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground block">
                  Accreditation Status
                </span>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-primary mt-0.5 block truncate px-1">
                  {accreditationLevel.includes("NABH") ? "NABH Standard" : accreditationLevel.slice(0, 16)}
                </span>
                <span className="text-[10px] text-muted-foreground block mt-0.5 truncate">
                  {isVerified ? "Audited & Verified" : "Council Registered"}
                </span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. MAIN 2-COLUMN PROFILE WORKSPACE (Exact Candidate Match)                */}
          {/*    Left: Document Vault & Institutional Credibility                       */}
          {/*    Right: About Institution, Campus Address, Specialties, Licensing, Team */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* ======================================================================= */}
            {/* LEFT COLUMN (5 COLS): Document Vault & Institutional Credibility        */}
            {/* ======================================================================= */}
            <div className="lg:col-span-5 space-y-6">
              {/* DOCUMENT VAULT */}
              <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-border pb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                      <HiOutlineDocumentCheck className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Document Vault
                      </h2>
                      <p className="text-[11px] text-muted-foreground truncate">
                        Statutory Clinical Licensures &amp; Accreditations
                      </p>
                    </div>
                  </div>

                  <Badge
                    variant="outline"
                    className="shrink-0 whitespace-nowrap text-[10px] font-bold border-primary/20 bg-primary/5 text-primary px-2.5 py-1 rounded-full leading-none"
                  >
                    {docVaultList.length} Attached
                  </Badge>
                </div>

                <div className="space-y-3">
                  {docVaultList.length === 0 ? (
                    <div className="p-6 text-center rounded-2xl border border-dashed border-border bg-muted/10 space-y-2">
                      <p className="text-xs font-bold text-foreground">No statutory verification documents attached</p>
                      <p className="text-[11px] text-muted-foreground">
                        Upload state clinical registration and statutory licenses during onboarding or profile audit.
                      </p>
                    </div>
                  ) : (
                    docVaultList.map((doc) => (
                      <div
                        key={doc.id || doc.type}
                        className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 hover:border-primary/40 transition-colors space-y-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-card text-primary shrink-0 border border-border/80">
                              <HiOutlineDocumentText className="h-4 w-4" />
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">
                                {doc.title}
                              </p>
                              <p className="text-[10px] font-mono text-muted-foreground truncate">
                                {doc.fileName}
                              </p>
                            </div>
                          </div>

                          <span
                            className={cn(
                              "shrink-0 rounded-full px-2 py-0.5 text-[9px] font-extrabold border leading-none flex items-center gap-1",
                              doc.verified
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25"
                            )}
                          >
                            <span className={cn("h-1.5 w-1.5 rounded-full", doc.verified ? "bg-emerald-500" : "bg-amber-500")} />
                            <span>{doc.verified ? "Verified" : "Under Audit"}</span>
                          </span>
                        </div>

                        <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                          <span className="text-muted-foreground font-medium text-[10px]">
                            {doc.sizeText}
                          </span>

                          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDocumentReplace(doc.type, doc.title)}
                              className="h-7 px-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer rounded-xl flex-1 sm:flex-initial"
                            >
                              <HiOutlineArrowUpTray className="h-3.5 w-3.5 mr-1" />
                              <span>Replace</span>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePreviewDocument(doc)}
                              className="h-7 px-2.5 text-xs font-bold text-primary border-primary/25 hover:bg-primary-soft cursor-pointer rounded-xl flex-1 sm:flex-initial"
                            >
                              <HiOutlineEye className="h-3.5 w-3.5 mr-1" />
                              <span>Preview</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* INSTITUTIONAL TRUST & ESCROW CARD */}
              <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-3.5">
                <div className="flex items-center gap-2.5 border-b border-border pb-3">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <HiOutlineShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Institutional Trust &amp; Escrow
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      State Health Authority &amp; Regulatory Guarantee
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
                  <p>
                    All clinical shifts, locum duties, and full-time hiring deployments hosted by{" "}
                    <strong className="text-foreground">{hospitalName}</strong> operate under automated 24-hr escrow signoffs, digital attendance stamping, and verified State Council clinician rosters.
                  </p>
                </div>

                <div className="pt-2.5 border-t border-border/60 flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  <span className="flex items-center gap-1.5">
                    <HiOutlineCheckCircle className="h-4 w-4 text-emerald-500" />
                    <span>Statutory Compliance Active</span>
                  </span>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    FALE-MED-VERIFIED
                  </span>
                </div>
              </div>
            </div>

            {/* ======================================================================= */}
            {/* RIGHT COLUMN (7 COLS): About, Address, Specialties, Credentials, Team   */}
            {/* ======================================================================= */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. ABOUT THE INSTITUTION */}
              <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                      <HiOutlineBuildingOffice2 className="h-4 w-4" />
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-primary">
                      About the Institution
                    </h3>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditSection("about")}
                    className="rounded-xl text-xs font-bold gap-1 border-border hover:border-primary text-foreground hover:text-primary h-7.5 px-2.5 cursor-pointer"
                  >
                    <HiOutlinePencilSquare className="h-3.5 w-3.5 text-primary" />
                    <span>Edit</span>
                  </Button>
                </div>

                <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed font-normal">
                  {about ||
                    `${hospitalName} is an accredited healthcare facility located in ${city}${stateName ? `, ${stateName}` : ""
                    }, dedicated to patient-centered clinical care, inpatient multi-specialty services, and round-the-clock emergency response.`}
                </p>
              </div>

              {/* 2. SPECIALTIES & CLINICAL DEPARTMENTS */}
              <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                      <HiOutlineBolt className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Specialties &amp; Clinical Departments
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        {departments.length} Sanctioned Clinical Units
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditSection("specialties")}
                    className="rounded-xl text-xs font-bold gap-1 border-border hover:border-primary text-foreground hover:text-primary h-7.5 px-2.5 cursor-pointer"
                  >
                    <HiOutlinePencilSquare className="h-3.5 w-3.5 text-primary" />
                    <span>Manage</span>
                  </Button>
                </div>

                {departments.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    No departments configured yet. Click &quot;Manage&quot; to add hospital clinical units.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {departments.map((dept) => (
                      <span
                        key={dept}
                        className="rounded-xl bg-muted/60 border border-border/80 px-3 py-1.5 text-xs font-semibold text-foreground/90 hover:border-primary/40 transition-colors"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 3. CAMPUS ADDRESS & LOCATION */}
              <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                      <HiOutlineMapPin className="h-4 w-4" />
                    </span>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Hospital Campus Address
                    </h3>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditSection("address")}
                    className="rounded-xl text-xs font-bold gap-1 border-border hover:border-primary text-foreground hover:text-primary h-7.5 px-2.5 cursor-pointer"
                  >
                    <HiOutlinePencilSquare className="h-3.5 w-3.5 text-primary" />
                    <span>Edit</span>
                  </Button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <p className="font-semibold text-foreground leading-relaxed text-xs sm:text-sm">
                    {addressLine || "Hospital Campus / Main Medical Center"}
                  </p>
                  <p className="text-muted-foreground font-medium">
                    {city}{stateName ? `, ${stateName}` : ""}{pincode ? ` - ${pincode}` : ""}, India
                  </p>
                </div>
              </div>

              {/* 4. INSTITUTIONAL CREDENTIALS & LICENSING */}
              <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                      <HiOutlineIdentification className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Institutional Credentials &amp; Licensing
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Statutory Registrations &amp; Tax IDs
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditSection("credentials")}
                    className="rounded-xl text-xs font-bold gap-1 border-border hover:border-primary text-foreground hover:text-primary h-7.5 px-2.5 cursor-pointer"
                  >
                    <HiOutlinePencilSquare className="h-3.5 w-3.5 text-primary" />
                    <span>Edit</span>
                  </Button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* CEA License */}
                  <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 space-y-1">
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

                  {/* Accreditation Level */}
                  <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 space-y-1">
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

                  {/* NABH Reference */}
                  <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 space-y-1">
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

                  {/* GSTIN */}
                  <div className="p-3.5 rounded-2xl border border-border/80 bg-muted/20 space-y-1">
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

              {/* 5. ADMINISTRATIVE & STAFFING DESK */}
              <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between border-b border-border pb-3">
                  <div className="flex items-center gap-2">
                    <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                      <HiOutlinePhone className="h-4 w-4" />
                    </span>
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                        Administrative &amp; Staffing Desk
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Direct Operational Contacts
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditSection("contact")}
                    className="rounded-xl text-xs font-bold gap-1 border-border hover:border-primary text-foreground hover:text-primary h-7.5 px-2.5 cursor-pointer"
                  >
                    <HiOutlinePencilSquare className="h-3.5 w-3.5 text-primary" />
                    <span>Edit</span>
                  </Button>
                </div>

                <div className="space-y-3 text-xs">
                  {/* Contact Person */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 gap-1">
                    <span className="text-muted-foreground font-medium">Administrator / Lead:</span>
                    <span className="font-bold text-foreground">
                      {contactPerson} {designation ? `(${designation})` : ""}
                    </span>
                  </div>

                  {/* Phone */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-t border-border/60 gap-1">
                    <span className="text-muted-foreground font-medium">Official Phone:</span>
                    {contactPhone ? (
                      <a
                        href={`tel:${contactPhone}`}
                        className="font-mono font-bold text-foreground hover:text-primary flex items-center gap-1.5"
                      >
                        <HiOutlinePhone className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{contactPhone}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">Not configured</span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-t border-border/60 gap-1">
                    <span className="text-muted-foreground font-medium">Official Email:</span>
                    {contactEmail ? (
                      <a
                        href={`mailto:${contactEmail}`}
                        className="font-medium text-primary hover:underline flex items-center gap-1.5 truncate max-w-full sm:max-w-[240px]"
                      >
                        <HiOutlineEnvelope className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{contactEmail}</span>
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">Not configured</span>
                    )}
                  </div>

                  {/* Website */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1.5 border-t border-border/60 gap-1">
                    <span className="text-muted-foreground font-medium">Hospital Portal:</span>
                    {website ? (
                      <a
                        href={website.startsWith("http") ? website : `https://${website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-primary hover:underline flex items-center gap-1 text-xs"
                      >
                        <HiOutlineGlobeAlt className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Visit Portal</span>
                        <HiOutlineArrowTopRightOnSquare className="h-3 w-3 shrink-0" />
                      </a>
                    ) : (
                      <span className="text-muted-foreground italic">Not configured</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. IN-PROFILE SECTION EDIT MODAL (Exact Candidate Match)                  */}
        {/* ========================================================================= */}
        <Dialog open={Boolean(editSection)} onOpenChange={(open) => !open && setEditSection(null)}>
          <DialogContent className="sm:max-w-xl p-5 sm:p-6 rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <DialogHeader className="text-left space-y-1">
              <DialogTitle className="text-lg font-bold text-foreground">
                {editSection === "identity" && "Edit Hospital Name & Capacity"}
                {editSection === "about" && "Edit About the Institution"}
                {editSection === "specialties" && "Manage Specialties & Departments"}
                {editSection === "address" && "Edit Campus Address"}
                {editSection === "credentials" && "Edit Institutional Credentials"}
                {editSection === "contact" && "Edit Administrative Contacts"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Update institutional records directly inside your verified profile.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4 space-y-4">
              {/* Identity & Bed Capacity Form */}
              {editSection === "identity" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Hospital / Institution Name *</label>
                    <input
                      type="text"
                      value={hospitalName}
                      onChange={(e) => setHospitalName(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. Apollo Multispecialty Hospital"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Facility Type</label>
                    <select
                      value={facilityType}
                      onChange={(e) => setFacilityType(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="Multispecialty Hospital">Multispecialty Hospital</option>
                      <option value="Super Specialty Hospital">Super Specialty Hospital</option>
                      <option value="Tertiary Care Medical Center">Tertiary Care Medical Center</option>
                      <option value="Teaching & Research Hospital">Teaching & Research Hospital</option>
                      <option value="District General Hospital">District General Hospital</option>
                      <option value="Day Care & Surgical Center">Day Care & Surgical Center</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Inpatient Beds</label>
                      <input
                        type="number"
                        value={beds}
                        onChange={(e) => setBeds(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">ICU &amp; Critical Beds</label>
                      <input
                        type="number"
                        value={icuBeds}
                        onChange={(e) => setIcuBeds(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* About Institution Form */}
              {editSection === "about" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Clinical Mission &amp; Overview</label>
                    <textarea
                      rows={6}
                      value={about}
                      onChange={(e) => setAbout(e.target.value)}
                      className="w-full rounded-2xl border border-border bg-card p-3 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Describe your healthcare facility, clinical specialties, and emergency care readiness..."
                    />
                  </div>
                </div>
              )}

              {/* Specialties & Departments Form */}
              {editSection === "specialties" && (
                <div className="space-y-4">
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
                      placeholder="Add specialty (e.g. Neurology, Oncology)"
                      className="flex-1 h-9 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddDepartment}
                      className="rounded-xl text-xs font-bold h-9 px-3.5 bg-primary text-white hover:bg-primary-hover"
                    >
                      + Add
                    </Button>
                  </div>

                  <div className="space-y-1.5">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase">Current Departments ({departments.length})</p>
                    <div className="flex flex-wrap gap-1.5 max-h-56 overflow-y-auto p-1">
                      {departments.map((dept) => (
                        <span
                          key={dept}
                          className="inline-flex items-center gap-1 rounded-xl bg-muted border border-border px-2.5 py-1 text-xs font-semibold text-foreground"
                        >
                          <span>{dept}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveDepartment(dept)}
                            className="text-muted-foreground hover:text-rose-500 cursor-pointer ml-0.5"
                          >
                            <HiOutlineXMark className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Campus Address Form */}
              {editSection === "address" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Campus / Street Address *</label>
                    <input
                      type="text"
                      value={addressLine}
                      onChange={(e) => setAddressLine(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. 21 Greams Lane, Thousand Lights"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">City *</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">State *</label>
                      <input
                        type="text"
                        value={stateName}
                        onChange={(e) => setStateName(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Postal Code (PIN)</label>
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. 600006"
                    />
                  </div>
                </div>
              )}

              {/* Credentials & Licensing Form */}
              {editSection === "credentials" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Clinical Establishment Act (CEA) License *</label>
                    <input
                      type="text"
                      value={licenseNumber}
                      onChange={(e) => setLicenseNumber(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="e.g. CEA/TN/2021/0049"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Accreditation Level</label>
                    <select
                      value={accreditationLevel}
                      onChange={(e) => setAccreditationLevel(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {accreditationOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">NABH Reference No.</label>
                      <input
                        type="text"
                        value={nabhNumber}
                        onChange={(e) => setNabhNumber(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. NABH-2022-0492"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">GSTIN Identification</label>
                      <input
                        type="text"
                        value={gst}
                        onChange={(e) => setGst(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="15-character GSTIN"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Contact Form */}
              {editSection === "contact" && (
                <div className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Contact Person *</label>
                      <input
                        type="text"
                        value={contactPerson}
                        onChange={(e) => setContactPerson(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. Dr. R. Sundaram"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-foreground block mb-1">Designation</label>
                      <input
                        type="text"
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder="e.g. Medical Superintendent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Official Phone *</label>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="+91 99999 33333"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Official Email *</label>
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="hospital.admin@apollo.com"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-foreground block mb-1">Website</label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full h-10 rounded-xl border border-border bg-card px-3 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="https://apollohospitals.com"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Action Buttons */}
            <div className="mt-6 pt-3 border-t border-border flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditSection(null)}
                className="rounded-xl text-xs font-bold h-9 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={pageAction.isPending || (saving)}
                onClick={handleSaveSection}
                className="rounded-xl text-xs font-bold h-9 px-5 bg-primary text-white hover:bg-primary-hover shadow-xs cursor-pointer"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ========================================================================= */}
        {/* 4. REAL UPLOADED DOCUMENT PREVIEW MODAL (Exact Candidate Match)           */}
        {/* ========================================================================= */}
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-card rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary-soft text-primary shrink-0">
                    <HiOutlineDocumentCheck className="h-4.5 w-4.5" />
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-sm sm:text-base text-foreground truncate">
                      {previewDoc.title}
                    </h3>
                    <p className="text-[11px] font-mono text-muted-foreground truncate">
                      {previewDoc.fileName}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(previewDoc.url, "_blank")}
                    className="rounded-xl text-xs font-bold gap-1.5 border-border hover:border-primary text-foreground hover:text-primary h-8 px-3 cursor-pointer"
                  >
                    <HiOutlineArrowTopRightOnSquare className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Open in New Tab</span>
                  </Button>

                  <button
                    type="button"
                    onClick={() => setPreviewDoc(null)}
                    className="rounded-xl p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                    title="Close Preview"
                  >
                    <HiOutlineXMark className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Modal Viewer Body */}
              <div className="flex-1 overflow-auto p-4 sm:p-6 bg-muted/40 flex items-center justify-center min-h-[380px] max-h-[75vh]">
                {previewDoc.isImage ? (
                  <img
                    src={previewDoc.url}
                    alt={previewDoc.fileName}
                    className="max-h-[70vh] max-w-full rounded-2xl object-contain shadow-md border border-border bg-white"
                  />
                ) : (
                  <iframe
                    src={previewDoc.url}
                    title={previewDoc.fileName}
                    className="w-full h-[70vh] rounded-2xl border border-border bg-white shadow-sm"
                  />
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-border bg-card text-xs">
                <span className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                  <HiOutlineShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Statutory Compliance Copy</span>
                </span>

                <a
                  href={previewDoc.url}
                  download={previewDoc.fileName}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary-hover shadow-xs transition-colors"
                >
                  <HiOutlineArrowDownTray className="h-3.5 w-3.5" />
                  <span>Download Document</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </AppShell>
    );
  }
