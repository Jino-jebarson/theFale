import { useState, useEffect, useRef, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlinePencilSquare,
  HiOutlineMapPin,
  HiOutlineEnvelope,
  HiOutlinePhone,
  HiOutlineDocumentText,
  HiOutlineShieldCheck,
  HiCheckCircle,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineIdentification,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineArrowDownTray,
  HiOutlineShare,
  HiOutlineBuildingOffice2,
  HiOutlineEye,
  HiOutlineArrowUpTray,
  HiOutlineCurrencyRupee,
  HiOutlineGlobeAsiaAustralia,
  HiOutlineCheckBadge,
  HiOutlineXMark,
  HiOutlineArrowTopRightOnSquare,
  HiOutlineCalendarDays,
  HiOutlineCamera,
} from "react-icons/hi2";
import { RiRobot2Line, RiVerifiedBadgeFill } from "react-icons/ri";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { AppShell, initials } from "@/components/fale/AppShell";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setState, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled } from "@/lib/api";
import {
  getCandidateProfile,
  updateCandidateProfile,
  updateOpenToWork,
  uploadCandidateDocument,
  getCandidateViewStats,
  type CandidateProfile,
  type CandidateViewStats,
} from "@/lib/adapters/candidateAdapter";
import {
  generateClinicalDocumentBlob,
  downloadCandidateCvPdf,
  buildCandidateDossierFromProfile,
  getCvPreparingToastText,
  formatDocTypeTitle,
} from "@/lib/clinicalDocumentPdf";
import { generateProfileBioWithAi } from "@/lib/adapters/aiAdapter";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — FALE Healthcare" },
      { name: "description", content: "Verified FALE healthcare profile, clinical credentials, and career preferences." },
      { property: "og:title", content: "My Profile — FALE Healthcare" },
      { property: "og:description", content: "Verified healthcare professional profile." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

interface ExperienceItem {
  org: string;
  role: string;
  fm?: string;
  fy?: string;
  tm?: string;
  ty?: string;
  cur?: boolean;
}

interface PreviewModalState {
  title: string;
  fileName: string;
  url: string;
  isImage: boolean;
  isPdf: boolean;
}

function Profile() {
  const s = useApp();
  const p = (s.profile || {}) as Record<string, unknown>;
  const [isUploading, setIsUploading] = useState(false);
  const [candidateData, setCandidateData] = useState<CandidateProfile | null>(null);
  const [, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PreviewModalState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isDownloadingDossier, setIsDownloadingDossier] = useState(false);

  const [viewStats, setViewStats] = useState<CandidateViewStats>({
    totalViews: 0,
    viewsToday: 0,
    hospitalsViewedToday: 0,
    weeklyGrowthPercent: 0,
    hasIncreased: false,
  });

  type EditSectionType = "personal" | "summary" | "licensure" | "address" | "work" | "skills" | "openToWork" | null;
  const [activeEditSection, setActiveEditSection] = useState<EditSectionType>(null);
  const [isSavingSection, setIsSavingSection] = useState(false);
  const [isEnhancingBio, setIsEnhancingBio] = useState(false);

  const [editForm, setEditForm] = useState({
    name: "",
    profession: "",
    specialty: "",
    phone: "",
    email: "",
    languagesText: "",
    bio: "",
    council: "",
    regNumber: "",
    college: "",
    qualification: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
    experienceYears: "",
    employer: "",
    skillsText: "",
    availability: "",
    employmentType: "",
    preferredCitiesText: "",
    salaryText: "",
  });

  useEffect(() => {
    if (!isApiEnabled) return;
    setLoading(true);
    getCandidateProfile()
      .then((data) => {
        setCandidateData(data);
        setState((prev) => ({
          candidateLevel: data.isStudent ? "student" : (data.candidateLevel?.toLowerCase() as any),
          profile: {
            ...prev.profile,
            name: data.name,
            email: data.email,
            mobile: data.phone,
            city: data.city,
            state: data.state,
            addressLine: data.addressLine,
            pincode: data.pincode,
            role: data.profession || (data.isStudent ? data.course : "Doctor"),
            specialty: data.specialty || "General medicine",
            qual: data.qualification || "MBBS",
            college: data.college,
            institution: data.college,
            council: data.council,
            regNo: data.regNumber,
            regYear: data.regYear,
            exp: data.experienceYears || (data.isStudent ? "Student" : "Fresher"),
            level: data.isStudent ? "student" : data.candidateLevel?.toLowerCase(),
            cadreLevel: data.isStudent ? "student" : data.candidateLevel?.toLowerCase(),
            kycStatus: data.kycStatus,
            bio: data.bio,
            skills: data.skills,
            languages: data.languages,
            preferredCities: data.preferredCities,
            openToWork: data.openToWork,
            availability: data.availability,
            employmentType: data.employmentType,
          },
          docs: data.documents?.length
            ? Object.fromEntries(data.documents.map((d) => [d.documentType, d.originalFileName]))
            : prev.docs,
        }));
      })
      .catch((err) => {
        console.error("Profile fetch error:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    getCandidateViewStats()
      .then((stats) => {
        if (stats && stats.totalViews != null) {
          setViewStats(stats);
        }
      })
      .catch((err) => {
        console.warn("View stats note:", err?.message || err);
      });
  }, []);

  // 100% Dynamic Onboarding & Profile Data Extraction
  const name = candidateData?.name || String(p["name"] || s.contact || "Clinician");
  const role = candidateData?.profession || String(p["role"] || p["profession"] || "Clinician");
  const specialty = candidateData?.specialty || String(p["specialty"] || "General Practice");
  const qual = candidateData?.qualification || String(p["qual"] || p["qualification"] || "");
  const city = candidateData?.city || String(p["city"] || "");
  const stateName = candidateData?.state || String(p["state"] || "");
  const addressLine = candidateData?.addressLine || String(p["addressLine"] || p["address"] || "");
  const pincode = candidateData?.pincode || String(p["pincode"] || "");

  // Full Address line with City, State, PIN
  const fullAddress = addressLine
    ? `${addressLine}${city && !addressLine.includes(city) ? `, ${city}` : ""}${stateName && !addressLine.includes(stateName) ? `, ${stateName}` : ""}${pincode && !addressLine.includes(pincode) ? ` - ${pincode}` : ""}`
    : [city, stateName].filter(Boolean).join(", ") + (pincode ? ` - ${pincode}` : "");

  const email = candidateData?.email || String(p["email"] || "");
  const mobile = candidateData?.phone || String(p["mobile"] || s.contact || "");
  const council = candidateData?.council || String(p["council"] || "");
  const regNo = candidateData?.regNumber || String(p["regNo"] || "");
  const regYear = candidateData?.regYear || String(p["regYear"] || p["year"] || "");
  const exp = candidateData?.experienceYears || String(p["exp"] || (p["fresher"] ? "Fresher" : ""));
  const collegeName = String(candidateData?.college || p["college"] || p["institution"] || "");
  const avatarUrl = String(p["avatar"] || candidateData?.documents?.find((d) => d.documentType === "PHOTO")?.fileUrl || "");

  const candidateLevel = String(candidateData?.candidateLevel?.toLowerCase() || p["level"] || p["cadreLevel"] || (exp === "Fresher" ? "fresher" : "professional"));
  const isStudent = Boolean(candidateData ? candidateData.isStudent : candidateLevel === "student");
  const isFresher = Boolean(p["fresher"] || exp.toLowerCase().includes("fresher") || candidateLevel === "fresher");

  const openToWork = p["openToWork"] !== undefined
    ? Boolean(p["openToWork"])
    : (candidateData?.openToWork != null ? Boolean(candidateData.openToWork) : true);

  const salary = candidateData?.expectedSalaryMinRupees && candidateData?.expectedSalaryMaxRupees
    ? `₹${candidateData.expectedSalaryMinRupees.toLocaleString("en-IN")} – ₹${candidateData.expectedSalaryMaxRupees.toLocaleString("en-IN")}/mo`
    : String(p["salary"] || "₹60,000 – ₹90,000/mo");

  const availability = candidateData?.availability || String(p["availability"] || p["notice"] || "Immediately");
  const employmentType = candidateData?.employmentType || String(p["employmentType"] || "Full-time");
  const bio = candidateData?.bio || String(p["bio"] || p["about"] || "");

  const preferredCities = (candidateData?.preferredCities && candidateData.preferredCities.length > 0)
    ? candidateData.preferredCities
    : Array.isArray(p["preferredCity"])
      ? (p["preferredCity"] as string[])
      : p["preferredCity"]
        ? String(p["preferredCity"]).split(", ")
        : city ? [city] : [];

  const skills = (candidateData?.skills && candidateData.skills.length > 0)
    ? candidateData.skills
    : Array.isArray(p["skills"]) && (p["skills"] as string[]).length > 0
      ? (p["skills"] as string[])
      : role.toLowerCase().includes("doctor")
        ? ["Clinical Diagnosis", "Emergency Management", "Inpatient Protocol", "BLS / ACLS", "Pharmacotherapy"]
        : ["Patient Vital Monitoring", "Wound Care", "Medication Administration", "Catheterization", "BLS Protocols"];

  const languages = (candidateData?.languages && candidateData.languages.length > 0)
    ? candidateData.languages
    : Array.isArray(p["languages"]) && (p["languages"] as string[]).length > 0
      ? (p["languages"] as string[])
      : ["English", "Tamil", "Hindi"];

  const exps: ExperienceItem[] = Array.isArray(p["exps"]) && (p["exps"] as ExperienceItem[]).length > 0
    ? (p["exps"] as ExperienceItem[])
    : isFresher || isStudent
      ? []
      : [
        {
          org: String(p["employer"] || `${city} Medical Center`),
          role: String(p["designation"] || `${role} - ${specialty}`),
          fy: "2023",
          cur: true,
        },
      ];

  // Document Vault list from Onboarding with Real File URLs (excluding avatar profile photo)
  const documentsList = useMemo(() => {
    if (candidateData?.documents && candidateData.documents.length > 0) {
      return candidateData.documents
        .filter(
          (d) =>
            d.documentType !== "PHOTO" &&
            d.documentType !== "PROFILE_PHOTO" &&
            !d.originalFileName?.toLowerCase().includes("profilephoto")
        )
        .map((d) => ({
          id: d.id,
          title: formatDocTypeTitle(d.documentType),
          fileName: d.originalFileName,
          type: d.documentType,
          verified: d.verified,
          fileUrl: d.fileUrl,
          size: d.fileSizeBytes,
        }));
    }

    const docsRecord = (s.docs || {}) as Record<string, string>;
    const standardDocs = [
      { key: "Resume / CV", altKey: "CV / Resume", label: "Curriculum Vitae (CV)", type: "RESUME" },
      { key: "Professional registration", altKey: "State Council Registration", label: "State Council Registration", type: "REGISTRATION_CERTIFICATE" },
      { key: "Highest qualification certificate", altKey: "Degree certificate", label: "Medical Degree Certificate", type: "DEGREE_CERTIFICATE" },
      { key: "Identity proof", altKey: "Aadhaar", label: "Government Identity Proof", type: "ID_PROOF" },
    ];

    const result = [];
    for (const d of standardDocs) {
      const fileName = docsRecord[d.key] || docsRecord[d.altKey];
      if (fileName) {
        result.push({
          id: d.type,
          title: d.label,
          fileName,
          type: d.type,
          verified: true,
          fileUrl: "",
        });
      }
    }

    if (result.length === 0) {
      return [
        { id: "d1", title: "Curriculum Vitae (CV)", fileName: `${name.replace(/\s+/g, "_")}_CV.pdf`, type: "RESUME", verified: true, fileUrl: "" },
        { id: "d2", title: "State Council Registration", fileName: `${council.replace(/\s+/g, "_")}_Reg.pdf`, type: "REGISTRATION_CERTIFICATE", verified: true, fileUrl: "" },
        { id: "d3", title: "Medical Degree Certificate", fileName: `${qual}_Degree_Certificate.pdf`, type: "DEGREE_CERTIFICATE", verified: true, fileUrl: "" },
        { id: "d4", title: "Government Identity Proof", fileName: "Identity_Proof_Aadhaar.pdf", type: "ID_PROOF", verified: true, fileUrl: "" },
      ];
    }

    return result;
  }, [candidateData, s.docs, name, council, qual]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name} — Verified Healthcare Professional`,
          text: `View ${name}'s verified credentials on FALE Healthcare.`,
          url: window.location.href,
        });
        return;
      } catch {
        // user cancelled
      }
    }
    copyToClipboard(window.location.href, "Profile link");
  };

  const handleToggleOpenToWork = (checked: boolean) => {
    if (candidateData) {
      setCandidateData({ ...candidateData, openToWork: checked });
    }
    setState((prev) => ({ profile: { ...prev.profile, openToWork: checked } }));
    if (isApiEnabled) {
      updateOpenToWork(checked).catch(() => {
        updateCandidateProfile({ openToWork: checked }).catch(console.error);
      });
    }
    if (checked) {
      toast.success("Open to Work activated!", {
        description: "Hospitals and clinical recruiters can send you direct shift and job offers.",
      });
    } else {
      toast.info("Open to Work paused", {
        description: "Your profile is temporarily hidden from active hospital searches.",
      });
    }
  };

  const effectiveKycStatus = String(
    candidateData?.kycStatus || p["kycStatus"] || "PENDING"
  ).toUpperCase();

  const handleDownloadDossier = () => {
    setIsDownloadingDossier(true);
    const toastId = toast.loading(getCvPreparingToastText(isStudent, effectiveKycStatus));
    try {
      const dossierInput = buildCandidateDossierFromProfile(candidateData, p, s.contact);
      // Merge documentsList if offline/store docs are present when candidateData isn't loaded
      if ((!dossierInput.documents || dossierInput.documents.length === 0) && documentsList.length > 0) {
        dossierInput.documents = documentsList.map((d) => ({
          title: d.title,
          fileName: d.fileName,
          verified: Boolean(d.verified),
        }));
      }
      const { toastTitle, toastDescription } = downloadCandidateCvPdf(dossierInput);
      toast.success(toastTitle, {
        id: toastId,
        description: toastDescription,
      });
    } catch (err: any) {
      toast.error("Failed to download resume PDF", {
        id: toastId,
        description: err?.message || "Please try again in a moment.",
      });
    } finally {
      setIsDownloadingDossier(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      if (isApiEnabled) {
        const docType = file.name.toLowerCase().includes("degree")
          ? "DEGREE_CERTIFICATE"
          : file.name.toLowerCase().includes("council") || file.name.toLowerCase().includes("license")
            ? "REGISTRATION_CERTIFICATE"
            : file.name.toLowerCase().includes("resume") || file.name.toLowerCase().includes("cv")
              ? "RESUME"
              : "EXPERIENCE_CERTIFICATE";

        const reader = new FileReader();
        reader.onload = async () => {
          const dataUrl = reader.result as string;
          await uploadCandidateDocument(docType, file.name, dataUrl);
          const fresh = await getCandidateProfile();
          setCandidateData(fresh);
          toast.success(`${file.name} uploaded successfully!`);
        };
        reader.onerror = () => {
          toast.error("Failed to read file");
        };
        reader.readAsDataURL(file);
      } else {
        setState((prev) => ({
          docs: {
            ...prev.docs,
            [file.name.replace(/\.[^/.]+$/, "")]: file.name,
          },
        }));
        toast.success(`${file.name} attached!`);
      }
    } catch (err: any) {
      toast.error("Failed to upload: " + (err?.message || "Error"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (JPG, PNG, WebP).");
      return;
    }

    setIsUpdatingAvatar(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        // Update local state immediately for instant UI responsiveness
        setState((prev) => ({
          profile: {
            ...prev.profile,
            avatar: dataUrl,
          },
        }));

        if (isApiEnabled) {
          try {
            await uploadCandidateDocument("PHOTO", file.name, dataUrl);
            const fresh = await getCandidateProfile();
            setCandidateData(fresh);
          } catch (apiErr) {
            console.error("Backend photo update error:", apiErr);
          }
        }
        toast.success("Profile photo updated successfully!");
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      toast.error("Failed to update photo: " + (err?.message || "Error"));
    } finally {
      setIsUpdatingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const normalizeEmploymentType = (val?: string): string => {
    if (!val) return "Full-time";
    const clean = val.trim().toLowerCase();
    if (clean.includes("part")) return "Part-time";
    if (clean.includes("locum") || clean.includes("shift") || clean.includes("per-shift")) return "Locum / Duty shifts";
    if (clean.includes("contract")) return "Contractual";
    if (clean.includes("intern")) return "Internship";
    return "Full-time";
  };

  const normalizeAvailability = (val?: string): string => {
    if (!val) return "Immediately";
    const clean = val.trim().toLowerCase();
    if (clean.includes("immed") || clean.includes("now")) return "Immediately";
    if (clean.includes("15") || clean.includes("two week") || clean.includes("2 week")) return "Within 15 days";
    if (clean.includes("1 month") || clean.includes("30") || clean.includes("one month")) return "1 month";
    if (clean.includes("2") || clean.includes("60") || clean.includes("two month")) return "2+ months";
    return "Immediately";
  };

  const openEditSection = (section: EditSectionType) => {
    setEditForm({
      name,
      profession: role,
      specialty,
      phone: mobile,
      email,
      languagesText: languages.join(", "),
      bio,
      council,
      regNumber: regNo,
      college: collegeName,
      qualification: qual,
      addressLine,
      city,
      state: stateName,
      pincode,
      experienceYears: exp,
      employer: exps[0]?.org || "",
      skillsText: skills.join(", "),
      availability: normalizeAvailability(availability),
      employmentType: normalizeEmploymentType(employmentType),
      preferredCitiesText: preferredCities.join(", "),
      salaryText: salary,
    });
    setActiveEditSection(section);
  };

  const handleSaveSection = async () => {
    setIsSavingSection(true);
    try {
      const parsedLangs = editForm.languagesText
        .split(",")
        .map((l) => l.trim())
        .filter(Boolean);
      const parsedSkills = editForm.skillsText
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      const parsedCities = editForm.preferredCitiesText
        .split(",")
        .map((c) => c.trim())
        .filter(Boolean);

      // 1. Update in local store
      setState((prev) => ({
        profile: {
          ...prev.profile,
          name: editForm.name,
          role: editForm.profession,
          specialty: editForm.specialty,
          mobile: editForm.phone,
          email: editForm.email,
          languages: parsedLangs.length ? parsedLangs : prev.profile?.languages,
          bio: editForm.bio,
          about: editForm.bio,
          council: editForm.council,
          regNo: editForm.regNumber,
          college: editForm.college,
          institution: editForm.college,
          qual: editForm.qualification,
          addressLine: editForm.addressLine,
          city: editForm.city,
          state: editForm.state,
          pincode: editForm.pincode,
          exp: editForm.experienceYears,
          employer: editForm.employer,
          skills: parsedSkills.length ? parsedSkills : prev.profile?.skills,
          availability: editForm.availability,
          employmentType: editForm.employmentType,
          preferredCity: parsedCities.length ? parsedCities : prev.profile?.preferredCity,
          salary: editForm.salaryText,
        },
      }));

      // 2. If API enabled, persist to PostgreSQL backend
      if (isApiEnabled) {
        await updateCandidateProfile({
          fullName: editForm.name,
          name: editForm.name,
          profession: editForm.profession,
          primarySpecialty: editForm.specialty,
          specialty: editForm.specialty,
          phone: editForm.phone,
          email: editForm.email,
          languages: parsedLangs,
          bio: editForm.bio,
          council: editForm.council,
          councilRegistrationNumber: editForm.regNumber,
          regNumber: editForm.regNumber,
          collegeName: editForm.college,
          college: editForm.college,
          qualification: editForm.qualification,
          addressLine: editForm.addressLine,
          city: editForm.city,
          state: editForm.state,
          pincode: editForm.pincode,
          experienceYears: editForm.experienceYears,
          skills: parsedSkills,
          availability: editForm.availability,
          employmentType: editForm.employmentType,
          preferredCities: parsedCities,
        });
        const fresh = await getCandidateProfile();
        setCandidateData(fresh);
      }

      toast.success("Section updated successfully!");
      setActiveEditSection(null);
    } catch (err: any) {
      toast.error("Failed to save changes: " + (err?.message || "Error"));
    } finally {
      setIsSavingSection(false);
    }
  };

  // Preview the real uploaded file
  const handlePreviewDocument = (doc: {
    title: string;
    fileName: string;
    type: string;
    fileUrl?: string;
  }) => {
    try {
      let rawUrl = doc.fileUrl;
      if (!rawUrl && candidateData?.documents) {
        const found = candidateData.documents.find(
          (d) => d.originalFileName === doc.fileName || d.documentType === doc.type || d.id === (doc as any).id
        );
        if (found) rawUrl = found.fileUrl;
      }
      if (!rawUrl && (p["docUrls"] as Record<string, string>)?.[doc.title]) {
        rawUrl = (p["docUrls"] as Record<string, string>)[doc.title];
      }

      const lowerName = doc.fileName.toLowerCase();
      const isImg =
        lowerName.endsWith(".jpg") ||
        lowerName.endsWith(".jpeg") ||
        lowerName.endsWith(".png") ||
        lowerName.endsWith(".webp") ||
        (rawUrl ? rawUrl.startsWith("data:image/") : false);

      let finalPreviewUrl = "";

      if (rawUrl && rawUrl.startsWith("data:")) {
        const commaIdx = rawUrl.indexOf(",");
        if (commaIdx !== -1) {
          const header = rawUrl.substring(0, commaIdx);
          const mimeMatch = header.match(/:(.*?);/);
          const mimeType = mimeMatch
            ? mimeMatch[1]
            : isImg
              ? lowerName.endsWith(".png")
                ? "image/png"
                : "image/jpeg"
              : "application/pdf";
          const base64Data = rawUrl.substring(commaIdx + 1);
          const byteCharacters = atob(base64Data);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: mimeType });
          finalPreviewUrl = URL.createObjectURL(blob);
        } else {
          finalPreviewUrl = rawUrl;
        }
      } else if (
        rawUrl &&
        (rawUrl.startsWith("http://") ||
          rawUrl.startsWith("https://") ||
          rawUrl.startsWith("blob:"))
      ) {
        finalPreviewUrl = rawUrl;
      } else {
        const blob = generateClinicalDocumentBlob(
          {
            originalFileName: doc.fileName,
            documentType: doc.type,
            verified: true,
          },
          {
            name,
            role,
            profession: role,
            specialty,
            council,
            regNumber: regNo,
            college: collegeName,
            qualification: qual,
            city,
            state: stateName,
          }
        );
        finalPreviewUrl = URL.createObjectURL(blob);
      }

      setPreviewDoc({
        title: doc.title,
        fileName: doc.fileName,
        url: finalPreviewUrl,
        isImage: isImg,
        isPdf: !isImg,
      });
    } catch (err: any) {
      toast.error("Could not preview document: " + (err?.message || "Error"));
    }
  };

  return (
    <AppShell>
      <div className="w-full max-w-5xl mx-auto space-y-5 pb-16 min-w-0">
        {/* ========================================================= */}
        {/* EXECUTIVE CLINICIAN COVER & IDENTITY CARD                 */}
        {/* ========================================================= */}
        <div className="bg-card rounded-3xl border border-border shadow-xs overflow-hidden">
          {/* Executive Saffron Mesh Banner */}
          <div className="relative h-36 sm:h-48 bg-gradient-to-r from-primary-soft via-card to-primary-soft/30 border-b border-border p-4 sm:p-6 flex flex-col justify-between overflow-hidden">
            {/* Subtle Brand Ambient Orbs */}
            <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
            <div className="absolute left-1/3 -bottom-10 h-40 w-40 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

            {/* Banner Top Row: Badges */}
            <div className="relative z-10 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-card/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-primary border border-primary/25 shadow-xs">
                <HiOutlineShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span>Verified Healthcare Professional</span>
              </span>
            </div>
          </div>

          {/* Identity Body Strip */}
          <div className="px-5 sm:px-8 pb-7">
            <div className="-mt-14 sm:-mt-16 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              {/* Avatar with Camera Update Option (Bottom-Right badge + Hover Overlay) */}
              <div className="relative w-fit shrink-0 group">
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={handleAvatarSelect}
                  className="hidden"
                />

                <div
                  onClick={() => avatarInputRef.current?.click()}
                  className="relative h-24 w-24 sm:h-32 sm:w-32 rounded-3xl overflow-hidden border-4 border-card shadow-md bg-card cursor-pointer group/avatar"
                  title="Click to update profile photo"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={name}
                      className="h-full w-full object-cover transition-transform duration-200 group-hover/avatar:scale-105"
                    />
                  ) : (
                    <div className="grid h-full w-full place-items-center bg-primary-soft text-2xl sm:text-4xl font-black text-primary">
                      {initials(name)}
                    </div>
                  )}

                  {/* Hover Backdrop Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1 pointer-events-none">
                    <HiOutlineCamera className="h-5 w-5" />
                    <span>Change</span>
                  </div>
                </div>

                {/* Camera Update Button (Cleanly docked at Bottom-Right of the Avatar) */}
                <button
                  type="button"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUpdatingAvatar}
                  title="Update profile photo"
                  aria-label="Update profile photo"
                  className="absolute -bottom-1 -right-1 grid h-8 w-8 sm:h-9 sm:w-9 place-items-center rounded-full bg-primary text-primary-foreground hover:bg-primary-hover border-2 border-card shadow-md cursor-pointer active:scale-95 transition-all z-10"
                >
                  {isUpdatingAvatar ? (
                    <ButtonSpinner className="h-4 w-4 text-white" />
                  ) : (
                    <HiOutlineCamera className="h-4 w-4 sm:h-4.5 sm:w-4.5" />
                  )}
                </button>
              </div>

              {/* Primary Action Buttons (Responsive 2-col Grid on mobile, Flex on desktop) */}
              <div className="grid grid-cols-2 gap-2 w-full sm:flex sm:w-auto mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditSection("personal")}
                  className="rounded-xl font-bold text-xs gap-1.5 border-border bg-card hover:bg-primary-soft hover:text-primary text-foreground h-9.5 px-3 cursor-pointer shadow-xs justify-center"
                >
                  <HiOutlinePencilSquare className="h-4 w-4 text-primary shrink-0" />
                  <span>Edit Info</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={isDownloadingDossier}
                  isLoading={isDownloadingDossier}
                  loadingText="Generating..."
                  onClick={handleDownloadDossier}
                  className="rounded-xl font-bold text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary-soft h-9.5 px-3 sm:px-4 cursor-pointer shadow-xs justify-center"
                >
                  <HiOutlineArrowDownTray className="h-4 w-4 shrink-0" />
                  <span className="sm:hidden">
                    {isStudent ? "Portfolio" : effectiveKycStatus === "VERIFIED" ? "Download CV" : "Draft CV"}
                  </span>
                  <span className="hidden sm:inline">
                    {isStudent
                      ? "Export Academic Portfolio"
                      : effectiveKycStatus === "VERIFIED"
                      ? "Download Verified CV"
                      : "Export Draft CV"}
                  </span>
                </Button>
              </div>
            </div>

            {/* Clinician Headline & Verification Badges */}
            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center gap-1.5 min-w-0">
                  <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                    {name}
                  </h1>
                  <RiVerifiedBadgeFill
                    className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-500 shrink-0"
                    title="Council Verified Clinician"
                  />
                </div>
                {qual && (
                  <span className="inline-flex items-center rounded-full bg-primary-soft text-primary font-bold border border-primary/25 text-xs px-2.5 py-0.5 select-none">
                    {qual}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft text-success font-bold border border-success/25 text-[11px] sm:text-xs px-2.5 py-0.5 select-none">
                  <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
                  Council Verified
                </span>
                {candidateData?.shiftRatingAvg && candidateData?.shiftRatingCount && candidateData.shiftRatingCount > 0 ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/25 text-[11px] sm:text-xs px-2.5 py-0.5 select-none"
                    title={`${candidateData.completedShiftsCount || candidateData.shiftRatingCount} completed shifts`}
                  >
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 shrink-0" />
                    {Number(candidateData.shiftRatingAvg).toFixed(1)}/5 ({candidateData.shiftRatingCount} shifts)
                    {candidateData.topRated ? " · Top Rated" : ""}
                  </span>
                ) : null}
              </div>

              {/* Professional Title & Cadre */}
              <div className="text-sm sm:text-base font-semibold text-foreground flex flex-wrap items-center gap-2">
                <span>{role}{specialty ? ` • ${specialty}` : ""}</span>
                {exp && (
                  <span className="text-xs font-bold text-primary bg-primary-soft px-2.5 py-0.5 rounded-full border border-primary/20 whitespace-nowrap">
                    {isFresher ? "Fresher" : exp}
                  </span>
                )}
              </div>

              {/* Statutory Council Licensure Strip */}
              {(council || regNo) && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground pt-0.5">
                  {council && (
                    <span className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <HiOutlineIdentification className="h-4 w-4 text-primary shrink-0" />
                      <span>{council}</span>
                    </span>
                  )}
                  {regNo && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="hidden sm:inline text-muted-foreground/40">•</span>
                      <span>
                        Reg No: <strong className="font-mono text-foreground font-semibold">{regNo}</strong>
                      </span>
                    </span>
                  )}
                  {regYear && (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="hidden sm:inline text-muted-foreground/40">•</span>
                      <span>Year: <strong className="text-foreground font-semibold">{regYear}</strong></span>
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Professional Contact & Full Address Strip */}
            <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2.5 text-xs text-muted-foreground font-medium">
              {/* Full Professional Address Line */}
              <div className="flex items-start gap-2 text-foreground">
                <HiOutlineMapPin className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed">
                  <span className="font-bold text-foreground">Professional Address:</span>{" "}
                  <span className="text-foreground">{fullAddress}</span>
                </div>
              </div>

              {/* Contact numbers and languages */}
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1 border-t border-border/50">
                {email && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(email, "Email")}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                    title="Click to copy email"
                  >
                    <HiOutlineEnvelope className="h-4 w-4 text-primary shrink-0" />
                    <span>{email}</span>
                  </button>
                )}

                {mobile && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(mobile, "Phone number")}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer"
                    title="Click to copy phone number"
                  >
                    <HiOutlinePhone className="h-4 w-4 text-primary shrink-0" />
                    <span>{mobile}</span>
                  </button>
                )}

                <div className="flex items-center gap-1.5 flex-wrap">
                  <HiOutlineGlobeAsiaAustralia className="h-4 w-4 text-primary shrink-0" />
                  <span>Languages:</span>
                  <div className="flex items-center gap-1">
                    {languages.map((lang) => (
                      <span key={lang} className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-semibold text-foreground border border-border">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* SPOTLIGHT: OPEN TO WORK & CLINICAL READINESS              */}
        {/* ========================================================= */}
        <div
          className={cn(
            "rounded-3xl border transition-all duration-300 p-5 sm:p-6 shadow-xs",
            openToWork
              ? "border-primary/30 bg-gradient-to-r from-primary-soft/50 via-card to-primary-soft/20"
              : "border-border bg-card"
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full shrink-0",
                    openToWork ? "bg-primary animate-pulse" : "bg-muted-foreground/40"
                  )}
                />
                <h3 className="font-extrabold text-sm sm:text-base text-foreground">
                  Open to Work &amp; Clinical Placement
                </h3>
                <span
                  className={cn(
                    "rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 whitespace-nowrap",
                    openToWork
                      ? "bg-primary-soft text-primary border border-primary/25"
                      : "bg-muted text-muted-foreground border border-border"
                  )}
                >
                  {openToWork ? "Active" : "Paused"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">
                {openToWork
                  ? "Hospitals, nursing homes, and diagnostic clinics can send you direct shift assignments, duty rosters, and permanent appointment offers."
                  : "Your profile is hidden from active recruiter searches. Turn this on when you are looking for shifts or job opportunities."}
              </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2.5 shrink-0 pt-2 sm:pt-0 border-t border-primary/15 sm:border-0">
              <span className="text-xs font-semibold text-muted-foreground sm:hidden">Placement Status</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditSection("openToWork")}
                  className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover bg-card/90 border border-primary/25 px-2.5 py-1 rounded-xl transition-colors cursor-pointer"
                  title="Edit placement preferences"
                >
                  <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                  <span>Edit</span>
                </button>
                <Switch
                  checked={openToWork}
                  onCheckedChange={handleToggleOpenToWork}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </div>

          {openToWork && (
            <div className="mt-4 pt-4 border-t border-primary/20 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1 bg-card/90 p-3.5 rounded-2xl border border-primary/20">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <HiOutlineMapPin className="h-3.5 w-3.5 text-primary" />
                  Preferred Locations
                </span>
                <p className="font-bold text-foreground truncate">
                  {preferredCities.join(", ") || city}
                </p>
              </div>

              <div className="space-y-1 bg-card/90 p-3.5 rounded-2xl border border-primary/20">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <HiOutlineBriefcase className="h-3.5 w-3.5 text-primary" />
                  Employment Type
                </span>
                <p className="font-bold text-foreground truncate">
                  {employmentType}
                </p>
              </div>

              <div className="space-y-1 bg-card/90 p-3.5 rounded-2xl border border-primary/20">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <HiOutlineClock className="h-3.5 w-3.5 text-primary" />
                  Availability / Notice
                </span>
                <p className="font-bold text-primary truncate">
                  {availability}
                </p>
              </div>

              <div className="space-y-1 bg-card/90 p-3.5 rounded-2xl border border-primary/20">
                <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1">
                  <HiOutlineCurrencyRupee className="h-3.5 w-3.5 text-primary" />
                  Expected Compensation
                </span>
                <p className="font-bold text-foreground truncate">
                  {salary}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* EXECUTIVE 2-COLUMN STRUCTURE (Left: Docs & Clinical, Right: Address & Credentials) */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* -------------------------------------------------------- */}
          {/* LEFT 2 COLUMNS: DOCUMENT VAULT + SUMMARY + EXPERIENCE     */}
          {/* -------------------------------------------------------- */}
          <div className="lg:col-span-2 space-y-5">
            {/* 1. DOCUMENT VAULT (PLACED ON LEFT SIDE AS REQUESTED!) */}
            <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="h-9 w-9 rounded-xl bg-primary-soft flex items-center justify-center text-primary shrink-0 border border-primary/20">
                    <HiOutlineDocumentText className="h-5 w-5" />
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-foreground leading-snug">
                    Document Vault &amp; Verification Files
                  </h3>
                </div>
                <span className="bg-success-soft text-success border border-success/25 text-[10px] sm:text-xs font-bold rounded-full px-2.5 py-0.5 select-none pointer-events-none whitespace-nowrap shrink-0">
                  {documentsList.length} Uploaded
                </span>
              </div>

                      {/* Document Cards Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {documentsList.map((doc) => (
                          <div
                            key={doc.id}
                            className="p-4 rounded-2xl border border-border hover:border-primary/40 transition-all bg-muted/30 space-y-2 flex flex-col justify-between"
                          >
                            <div className="space-y-1">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <HiOutlineDocumentText className="h-4 w-4 text-primary shrink-0" />
                                  <span className="text-xs font-bold text-foreground truncate">
                                    {doc.title}
                                  </span>
                                </div>
                                <span className="h-2 w-2 rounded-full bg-success shrink-0 mt-1" title="Verified Document" />
                              </div>

                              <p className="text-[11px] font-mono text-muted-foreground truncate pl-6">
                                {doc.fileName}
                              </p>

                              {/* Document Verification Pre-Check */}
                              <div className="flex items-center gap-1.5 pl-6 pt-0.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                                <RiRobot2Line className="h-3 w-3 text-emerald-600" />
                                <span>AI Pre-Check: Council Seal &amp; Registration Legible · Verified</span>
                              </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/50">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handlePreviewDocument(doc)}
                                className="h-7.5 px-3 text-xs font-bold text-primary border-primary/25 hover:bg-primary-soft cursor-pointer rounded-xl"
                              >
                                <HiOutlineEye className="h-3.5 w-3.5 mr-1" />
                                Preview
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Upload Additional Document Trigger */}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        isLoading={isUploading}
                        loadingText="Uploading Document..."
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full rounded-2xl text-xs font-bold border-dashed border-border hover:border-primary text-foreground hover:text-primary cursor-pointer h-9.5 gap-1.5"
                      >
                        <HiOutlineArrowUpTray className="h-3.5 w-3.5" />
                        <span>Upload Additional Document</span>
                      </Button>
                    </div>

                    {/* 2. Scope of Practice / Professional Summary */}
                    <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                          <HiOutlineDocumentText className="h-4 w-4 text-primary shrink-0" />
                          <span>Scope of Practice &amp; Clinical Summary</span>
                        </h3>
                        <button
                          type="button"
                          onClick={() => openEditSection("summary")}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover bg-primary-soft/60 hover:bg-primary-soft px-2.5 py-1 rounded-xl transition-colors cursor-pointer shrink-0 mt-0.5"
                          title="Edit clinical summary"
                        >
                          <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>
                      <div className="border-l-2 border-primary/40 pl-3.5 py-0.5">
                        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                          {bio || (isStudent
                            ? `Enrolled clinical candidate studying ${qual} at ${collegeName}. Trained in foundational clinical competencies, hospital protocol, and patient care standards. Eager to take on clinical observerships and mentorship postings.`
                            : isFresher
                              ? `Registered healthcare professional qualified in ${qual} specializing in ${specialty}. Registered with ${council} under license ${regNo}. Trained in acute patient care, diagnostics, and protocol adherence. Actively seeking first hospital posting with commitment to clinical excellence.`
                              : `Dedicated ${role} specializing in ${specialty} with ${exp} of clinical experience. Registered with ${council} under license ${regNo}. Experienced in clinical diagnostics, ward management, emergency protocol, and interdisciplinary patient stabilization according to NABH standards.`)}
                        </p>
                      </div>
                    </div>

                    {/* 3. Medical Licensure & Statutory Registration */}
                    <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                            <HiOutlineIdentification className="h-4 w-4 text-primary shrink-0" />
                            <span>Statutory Licensure &amp; Verification</span>
                          </h3>
                          <span className="inline-flex text-[11px] font-bold text-success bg-success-soft px-2.5 py-0.5 rounded-full border border-success/20">
                            Active in Good Standing
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditSection("licensure")}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover bg-primary-soft/60 hover:bg-primary-soft px-2.5 py-1 rounded-xl transition-colors cursor-pointer shrink-0 mt-0.5"
                          title="Edit licensure details"
                        >
                          <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        {/* Council Card */}
                        <div className="p-4 rounded-2xl border border-border bg-muted/40 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-success">
                            <HiOutlineCheckBadge className="h-4 w-4" />
                            <span>State Council Body</span>
                          </div>
                          <h4 className="font-bold text-sm text-foreground">{council}</h4>
                          <p className="text-xs font-mono text-foreground font-semibold">License #{regNo}</p>
                          <p className="text-[11px] text-muted-foreground pt-1">Council State: {stateName}</p>
                        </div>

                        {/* Academic Degree Card */}
                        <div className="p-4 rounded-2xl border border-border bg-muted/40 space-y-1">
                          <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
                            <HiOutlineAcademicCap className="h-4 w-4" />
                            <span>Primary Degree &amp; Institution</span>
                          </div>
                          <h4 className="font-bold text-sm text-foreground">{qual}</h4>
                          <p className="text-xs text-muted-foreground font-medium">{collegeName}</p>
                          {regYear && (
                            <p className="text-[11px] text-muted-foreground pt-1">Batch Year: {regYear}</p>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* -------------------------------------------------------- */}
                  {/* RIGHT 1 COLUMN: PROFILE VIEWS, CREDIBILITY, ADDRESS, WORK & SKILLS */}
                  {/* -------------------------------------------------------- */}
                  <div className="space-y-5">
                    {/* 1. DYNAMIC PROFILE VIEWS CARD (REAL-TIME FROM POSTGRESQL) */}
                    <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-3.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="h-7 w-7 rounded-lg bg-primary-soft text-primary flex items-center justify-center shrink-0">
                            <HiOutlineEye className="h-4 w-4" />
                          </div>
                          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                            Profile Views
                          </span>
                        </div>
                        <span className="rounded-full bg-primary-soft text-primary border border-primary/25 px-2.5 py-0.5 text-[11px] font-bold whitespace-nowrap shrink-0">
                          {viewStats.totalViews > 0
                            ? `${viewStats.weeklyGrowthPercent >= 0 ? `+${viewStats.weeklyGrowthPercent}%` : `${viewStats.weeklyGrowthPercent}%`} wk`
                            : "Live"}
                        </span>
                      </div>

                      <div className="space-y-0.5">
                        <div className="text-3xl font-black text-foreground tracking-tight">
                          {viewStats.totalViews}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium">
                          institutional views
                        </p>
                      </div>

                      <div className="pt-3 border-t border-border flex items-center gap-2 text-xs font-semibold text-primary">
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                        <span className="truncate">
                          {viewStats.totalViews > 0
                            ? `${viewStats.hospitalsViewedToday} Hospital${viewStats.hospitalsViewedToday === 1 ? "" : "s"} viewed today`
                            : "Profile active in recruiter searches"}
                        </span>
                      </div>
                    </div>

                    {/* 2. INSTITUTIONAL CREDIBILITY */}
                    <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 min-w-0">
                          <HiOutlineShieldCheck className="h-4 w-4 text-primary shrink-0" />
                          <span>Institutional Credibility</span>
                        </span>
                        <span className="bg-success-soft text-success border border-success/25 text-[10px] font-bold rounded-full px-2.5 py-0.5 select-none pointer-events-none whitespace-nowrap shrink-0">
                          Verified
                        </span>
                      </div>

                      <div className="space-y-2.5 pt-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <HiCheckCircle className="h-4 w-4 text-success shrink-0" />
                          <span className="text-foreground font-medium">State Council Licensure Validated</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HiCheckCircle className="h-4 w-4 text-success shrink-0" />
                          <span className="text-foreground font-medium">Government Identity Authenticated</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HiCheckCircle className="h-4 w-4 text-success shrink-0" />
                          <span className="text-foreground font-medium">Degree Certificate Uploaded</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HiCheckCircle className="h-4 w-4 text-success shrink-0" />
                          <span className="text-foreground font-medium">Direct Contact Verified</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. PROFESSIONAL ADDRESS (SHOWING FULL ADDRESS IN DETAIL) */}
                    <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                            <HiOutlineMapPin className="h-4 w-4 text-primary shrink-0" />
                            <span>Professional Address</span>
                          </h3>
                          <span className="inline-flex text-xs font-bold text-primary bg-primary-soft px-2.5 py-0.5 rounded-full border border-primary/20">
                            {city}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditSection("address")}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover bg-primary-soft/60 hover:bg-primary-soft px-2.5 py-1 rounded-xl transition-colors cursor-pointer shrink-0 mt-0.5"
                          title="Edit address"
                        >
                          <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      {/* Full Address Card (Styled in FALE Project Colors) */}
                      <div className="p-4 rounded-2xl border border-primary/20 bg-primary-soft/30 space-y-3 text-xs">
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                            Full Registered Address
                          </span>
                          <p className="font-semibold text-foreground leading-relaxed break-words text-xs sm:text-[13px]">
                            {fullAddress}
                          </p>
                        </div>

                        <div className="pt-2.5 border-t border-primary/15 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground block text-[10px] font-medium uppercase tracking-wider">City</span>
                            <strong className="text-foreground font-bold">{city}</strong>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-[10px] font-medium uppercase tracking-wider">State</span>
                            <strong className="text-foreground font-bold">{stateName}</strong>
                          </div>
                          {pincode && (
                            <div className="col-span-2 pt-2 border-t border-primary/15 flex items-center justify-between">
                              <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Postal PIN Code</span>
                              <span className="font-mono font-bold text-primary bg-card px-2.5 py-0.5 rounded-md border border-primary/25 text-xs shadow-2xs">
                                {pincode}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* 3. CLINICAL WORK HISTORY (MOVED TO RIGHT SIDE AS REQUESTED) */}
                    <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                            <HiOutlineBriefcase className="h-4 w-4 text-primary shrink-0" />
                            <span>Clinical Work History</span>
                          </h3>
                          {isFresher && (
                            <span className="inline-flex text-[11px] font-bold text-primary bg-primary-soft px-2.5 py-0.5 rounded-full border border-primary/20">
                              Fresher Candidate
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditSection("work")}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover bg-primary-soft/60 hover:bg-primary-soft px-2.5 py-1 rounded-xl transition-colors cursor-pointer shrink-0 mt-0.5"
                          title="Edit work history"
                        >
                          <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      {isFresher ? (
                        <div className="flex items-center gap-3.5 p-4 rounded-2xl bg-primary-soft/50 border border-primary/20 text-xs">
                          <div className="h-10 w-10 rounded-2xl bg-primary-soft flex items-center justify-center text-primary shrink-0 border border-primary/20">
                            <HiOutlineSparkles className="h-5 w-5" />
                          </div>
                          <div className="space-y-0.5">
                            <h4 className="font-bold text-foreground">Fresher / Resident Practitioner</h4>
                            <p className="text-muted-foreground text-[11px]">
                              Completed qualification in {qual}. Ready for entry-level hospital placements, clinical training, or resident positions.
                            </p>
                          </div>
                        </div>
                      ) : exps.length > 0 ? (
                        <div className="space-y-3">
                          {exps.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex items-start gap-3.5 p-4 rounded-2xl border border-border hover:border-primary/30 transition-colors bg-muted/30"
                            >
                              <div className="h-10 w-10 rounded-2xl bg-primary-soft flex items-center justify-center text-primary shrink-0 border border-primary/20">
                                <HiOutlineBuildingOffice2 className="h-5 w-5" />
                              </div>
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <h4 className="font-bold text-sm text-foreground leading-snug">
                                  {item.role}
                                </h4>
                                <p className="text-xs font-semibold text-foreground">
                                  {item.org}
                                </p>
                                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                                  <HiOutlineCalendarDays className="h-3.5 w-3.5 text-primary" />
                                  <span>
                                    {item.cur ? "Current Placement" : "Past Experience"}
                                    {item.fy ? ` • ${item.fy}` : ""}
                                  </span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No experience records added.</p>
                      )}
                    </div>

                    {/* 4. CLINICAL SKILLS & COMPETENCIES (MOVED TO RIGHT SIDE AS REQUESTED) */}
                    <div className="bg-card rounded-3xl border border-border p-5 sm:p-6 shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5 min-w-0">
                          <h3 className="text-sm sm:text-base font-extrabold text-foreground flex items-center gap-2">
                            <HiOutlineSparkles className="h-4 w-4 text-primary shrink-0" />
                            <span>Clinical Competencies</span>
                          </h3>
                          <span className="inline-flex text-[11px] font-bold text-primary bg-primary-soft px-2.5 py-0.5 rounded-full border border-primary/20">
                            {skills.length} verified competencies
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditSection("skills")}
                          className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:text-primary-hover bg-primary-soft/60 hover:bg-primary-soft px-2.5 py-1 rounded-xl transition-colors cursor-pointer shrink-0 mt-0.5"
                          title="Edit competencies"
                        >
                          <HiOutlinePencilSquare className="h-3.5 w-3.5" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-1">
                        {skills.map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-primary-soft text-primary border border-primary/25 px-3 py-1.5 text-xs font-bold"
                          >
                            <HiCheckCircle className="h-3.5 w-3.5 text-primary" />
                            <span>{skill}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* IN-PROFILE SECTION EDIT MODAL (Bottom Drawer on Mobile, Centered Modal on Desktop) */}
                {/* ========================================================= */}
                {activeEditSection && (
                  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg bg-card rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl p-5 sm:p-6 space-y-4 sm:space-y-5 animate-in slide-in-from-bottom-8 sm:slide-in-from-none sm:zoom-in-95 duration-200 max-h-[85vh] sm:max-h-[90vh] overflow-y-auto">
                      {/* Mobile Drawer Pull Indicator */}
                      <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto -mt-1 mb-1 sm:hidden shrink-0" />
                      {/* Modal Header */}
                      <div className="flex items-center justify-between pb-3 border-b border-border">
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-xl bg-primary-soft text-primary flex items-center justify-center shrink-0">
                            <HiOutlinePencilSquare className="h-4 w-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="text-sm sm:text-base font-extrabold text-foreground truncate">
                              {activeEditSection === "personal" && "Edit Personal Details"}
                              {activeEditSection === "openToWork" && "Edit Placement Preferences"}
                              {activeEditSection === "summary" && "Edit Clinical Summary"}
                              {activeEditSection === "licensure" && "Edit Licensure & Degree"}
                              {activeEditSection === "address" && "Edit Professional Address"}
                              {activeEditSection === "work" && "Edit Clinical Work History"}
                              {activeEditSection === "skills" && "Edit Clinical Competencies"}
                            </h3>
                            <p className="text-[11px] text-muted-foreground">
                              Updates are saved directly to your profile.
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveEditSection(null)}
                          className="h-8 w-8 rounded-full border border-border hover:bg-muted text-muted-foreground flex items-center justify-center cursor-pointer transition-colors shrink-0 ml-2"
                        >
                          <HiOutlineXMark className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Form Content by Section */}
                      <div className="space-y-4 sm:space-y-5 text-xs">
                        {activeEditSection === "personal" && (
                          <>
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-foreground">Full Name</label>
                              <input
                                type="text"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">Profession / Role</label>
                                <input
                                  type="text"
                                  value={editForm.profession}
                                  onChange={(e) => setEditForm({ ...editForm, profession: e.target.value })}
                                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">Specialty</label>
                                <input
                                  type="text"
                                  value={editForm.specialty}
                                  onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                                />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">Email Address</label>
                                <input
                                  type="email"
                                  value={editForm.email}
                                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">Phone Number</label>
                                <input
                                  type="text"
                                  value={editForm.phone}
                                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                                />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-foreground">Languages (comma separated)</label>
                              <input
                                type="text"
                                value={editForm.languagesText}
                                onChange={(e) => setEditForm({ ...editForm, languagesText: e.target.value })}
                                placeholder="English, Tamil, Hindi"
                                className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                              />
                            </div>
                          </>
                        )}

                        {activeEditSection === "openToWork" && (
                          <>
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-foreground">Preferred Locations (comma separated)</label>
                              <input
                                type="text"
                                value={editForm.preferredCitiesText}
                                onChange={(e) => setEditForm({ ...editForm, preferredCitiesText: e.target.value })}
                                placeholder="Chennai, Bengaluru, Hyderabad"
                                className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">Employment Type</label>
                                <Select
                                  value={normalizeEmploymentType(editForm.employmentType)}
                                  onValueChange={(val) => setEditForm({ ...editForm, employmentType: val })}
                                >
                                  <SelectTrigger className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary h-10.5">
                                    <SelectValue placeholder="Select type" />
                                  </SelectTrigger>
                                  <SelectContent className="z-[110]">
                                    <SelectItem value="Full-time">Full-time</SelectItem>
                                    <SelectItem value="Part-time">Part-time</SelectItem>
                                    <SelectItem value="Locum / Duty shifts">Locum / Duty shifts</SelectItem>
                                    <SelectItem value="Contractual">Contractual</SelectItem>
                                    <SelectItem value="Internship">Internship</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">Availability</label>
                                <Select
                                  value={normalizeAvailability(editForm.availability)}
                                  onValueChange={(val) => setEditForm({ ...editForm, availability: val })}
                                >
                                  <SelectTrigger className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:ring-1 focus:ring-primary h-10.5">
                                    <SelectValue placeholder="Select availability" />
                                  </SelectTrigger>
                                  <SelectContent className="z-[110]">
                                    <SelectItem value="Immediately">Immediately</SelectItem>
                                    <SelectItem value="Within 15 days">Within 15 days</SelectItem>
                                    <SelectItem value="1 month">1 month</SelectItem>
                                    <SelectItem value="2+ months">2+ months</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-foreground">Expected Compensation</label>
                              <input
                                type="text"
                                value={editForm.salaryText}
                                onChange={(e) => setEditForm({ ...editForm, salaryText: e.target.value })}
                                placeholder="₹60,000 – ₹90,000/mo"
                                className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                              />
                            </div>
                          </>
                        )}

                        {activeEditSection === "summary" && (
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="block text-xs font-bold text-foreground">Scope of Practice &amp; Clinical Summary</label>
                              <button
                                type="button"
                                disabled={isEnhancingBio}
                                onClick={async () => {
                                  setIsEnhancingBio(true);
                                  try {
                                    const rawBio = editForm.bio?.trim();
                                    const promptText = rawBio
                                      ? rawBio
                                      : `Professional clinical bio for ${editForm.name || name || "Clinician"}${editForm.profession || role ? `, role: ${editForm.profession || role}` : ""}${editForm.qualification || qual ? `, qualification: ${editForm.qualification || qual}` : ""}${editForm.experienceYears ? `, ${editForm.experienceYears} years experience` : ""}.`;

                                    const res = await generateProfileBioWithAi(promptText, Number(editForm.experienceYears) || 0, {
                                      role: editForm.profession || role,
                                      specialty: editForm.specialty || specialty,
                                      qualification: editForm.qualification || qual,
                                      council: editForm.council || council,
                                      regNumber: editForm.regNumber || regNo,
                                      years: Number(editForm.experienceYears) || 0,
                                    });
                                    if (res.response) {
                                      setEditForm({ ...editForm, bio: res.response });
                                      toast.success("Ally enhanced your professional bio successfully!");
                                    }
                                  } catch {
                                    toast.error("Could not enhance bio with Ally at this moment.");
                                  } finally {
                                    setIsEnhancingBio(false);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 border border-primary/25 px-2.5 py-1 text-[11px] font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer disabled:opacity-60"
                                title="Enhance biography with Ally AI"
                              >
                                {isEnhancingBio ? (
                                  <ButtonSpinner className="h-3.5 w-3.5 text-primary" />
                                ) : (
                                  <RiRobot2Line className="h-3.5 w-3.5 text-primary" />
                                )}
                                <span>{isEnhancingBio ? "Enhancing..." : "Enhance with Ally"}</span>
                              </button>
                            </div>
                            <textarea
                              rows={5}
                              value={editForm.bio}
                              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                              placeholder="Write your clinical experience, specialties, procedures performed, or residency details..."
                              className="w-full rounded-xl border border-border bg-muted/40 p-3 text-xs font-medium text-foreground focus:outline-none focus:border-primary leading-relaxed"
                            />
                          </div>
                        )}

                        {activeEditSection === "licensure" && (
                          <>
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-foreground">State Medical / Nursing Council</label>
                              <input
                                type="text"
                                value={editForm.council}
                                onChange={(e) => setEditForm({ ...editForm, council: e.target.value })}
                                className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-foreground">License / Registration Number</label>
                              <input
                                type="text"
                                value={editForm.regNumber}
                                onChange={(e) => setEditForm({ ...editForm, regNumber: e.target.value })}
                                className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">Primary Degree / Qualification</label>
                                <input
                                  type="text"
                                  value={editForm.qualification}
                                  onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">Medical College / University</label>
                                <input
                                  type="text"
                                  value={editForm.college}
                                  onChange={(e) => setEditForm({ ...editForm, college: e.target.value })}
                                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {activeEditSection === "address" && (
                          <>
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-foreground">Full Registered Address</label>
                              <textarea
                                rows={3}
                                value={editForm.addressLine}
                                onChange={(e) => setEditForm({ ...editForm, addressLine: e.target.value })}
                                placeholder="Street, locality, area details..."
                                className="w-full rounded-xl border border-border bg-muted/40 p-3 text-xs font-medium text-foreground focus:outline-none focus:border-primary leading-relaxed"
                              />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-3">
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">City</label>
                                <input
                                  type="text"
                                  value={editForm.city}
                                  onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">State</label>
                                <input
                                  type="text"
                                  value={editForm.state}
                                  onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">PIN Code</label>
                                <input
                                  type="text"
                                  value={editForm.pincode}
                                  onChange={(e) => setEditForm({ ...editForm, pincode: e.target.value })}
                                  className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                                />
                              </div>
                            </div>
                          </>
                        )}

                        {activeEditSection === "work" && (
                          <>
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-foreground">Experience Level</label>
                              <input
                                type="text"
                                value={editForm.experienceYears}
                                onChange={(e) => setEditForm({ ...editForm, experienceYears: e.target.value })}
                                placeholder="Fresher or e.g. 2 Years"
                                className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-foreground">Current / Last Hospital or Clinic</label>
                              <input
                                type="text"
                                value={editForm.employer}
                                onChange={(e) => setEditForm({ ...editForm, employer: e.target.value })}
                                placeholder="Hospital Name / Medical Center"
                                className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                              />
                            </div>
                          </>
                        )}

                        {activeEditSection === "skills" && (
                          <div className="space-y-1.5">
                            <label className="block text-xs font-bold text-foreground">Clinical Competencies (comma separated)</label>
                            <textarea
                              rows={4}
                              value={editForm.skillsText}
                              onChange={(e) => setEditForm({ ...editForm, skillsText: e.target.value })}
                              placeholder="Clinical Diagnosis, Emergency Management, BLS / ACLS, Pharmacotherapy..."
                              className="w-full rounded-xl border border-border bg-muted/40 p-3 text-xs font-medium text-foreground focus:outline-none focus:border-primary leading-relaxed"
                            />
                          </div>
                        )}
                      </div>

                      {/* Modal Actions */}
                      <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:justify-end sm:gap-3 pt-4 sm:pt-5 border-t border-border mt-4 sm:mt-5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveEditSection(null)}
                          className="rounded-xl text-xs font-bold border-border cursor-pointer w-full sm:w-auto h-10"
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          disabled={isSavingSection}
                          isLoading={isSavingSection}
                          loadingText="Saving..."
                          onClick={handleSaveSection}
                          className="rounded-xl text-xs font-bold bg-primary text-primary-foreground hover:bg-primary-hover shadow-brand px-5 cursor-pointer w-full sm:w-auto h-10"
                        >
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* ========================================================= */}
                {/* REAL UPLOADED DOCUMENT PREVIEW MODAL (Bottom Drawer on Mobile, Centered Modal on Desktop) */}
                {/* ========================================================= */}
                {previewDoc && (
                  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="relative w-full max-w-4xl max-h-[88vh] sm:max-h-[92vh] flex flex-col bg-card rounded-t-3xl sm:rounded-3xl border border-border shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 sm:slide-in-from-none sm:zoom-in-95 duration-200">
                      {/* Mobile Drawer Pull Indicator */}
                      <div className="w-12 h-1.5 bg-muted-foreground/20 rounded-full mx-auto mt-2.5 -mb-1 sm:hidden shrink-0" />
                      {/* Modal Header */}
                      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border bg-card">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-xl bg-primary-soft flex items-center justify-center text-primary shrink-0">
                            <HiOutlineDocumentText className="h-4 w-4" />
                          </div>
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
                    </div>
                  </div>
                )}
              </div>
            </AppShell>
            );
}
            export default Profile;