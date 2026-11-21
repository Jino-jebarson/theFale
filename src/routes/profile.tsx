import { useConfirmedAction } from "@/hooks/use-confirmed-action";
import { RequestError } from "@/components/fale/RequestError";
import { DigiLockerModal } from "@/components/fale/DigiLockerModal";
import { errorMessage } from "@/lib/errorMessage";
import { calculateCandidateProfileStrength } from "@/lib/profileStrength";
import { useState, useEffect, useRef, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlinePencilSquare,
  HiOutlinePlus,
  HiOutlineArrowRight,
  HiOutlineChevronDown,
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
  HiOutlineGift,
  HiOutlineChatBubbleLeftRight,
} from "react-icons/hi2";
import { RiRobot2Line, RiVerifiedBadgeFill } from "react-icons/ri";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { AppShell, initials } from "@/components/fale/AppShell";
import { DateField, Field, MultiSelectField, SelectField } from "@/components/fale/fields";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { setState, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled } from "@/lib/api";
import { departmentsByProfession, indianCities, professions } from "@/lib/data";
import {
  getCandidateProfile,
  updateCandidateProfile,
  updateCandidateEducation,
  updateOpenToWork,
  uploadCandidateDocument,
  getCandidateViewStats,
  getCandidateReferrals,
  type CandidateProfile,
  type CandidateExperience,
  type CandidateCertification,
  type CandidateViewStats,
  type CandidateReferralDashboard,
} from "@/lib/adapters/candidateAdapter";
import { extractTextFromFile, parseResumeText } from "@/lib/resumeParser";
import {
  downloadCandidateCvPdf,
  buildCandidateDossierFromProfile,
  getCvPreparingToastText,
  formatDocTypeTitle,
} from "@/lib/clinicalDocumentPdf";
import { generateProfileBioWithAi } from "@/lib/adapters/aiAdapter";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile - FALE Healthcare" },
      { name: "description", content: "Verified FALE healthcare profile, clinical credentials, and career preferences." },
      { property: "og:title", content: "My Profile - FALE Healthcare" },
      { property: "og:description", content: "Verified healthcare professional profile." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

interface PreviewModalState {
  title: string;
  fileName: string;
  url: string;
  isImage: boolean;
  isPdf: boolean;
}

interface QualificationSuggestion {
  qualification: string;
  institution: string;
  fileName: string;
}

function extractIndianPincode(address: string): string {
  return address.match(/(?:^|\D)([1-9]\d{5})(?=\D|$)/)?.[1] || "";
}

function ProfileFieldAction({
  label,
  hasValue,
  onClick,
  className,
}: {
  label: string;
  hasValue: boolean;
  onClick: () => void;
  className?: string;
}) {
  const actionLabel = `${hasValue ? "Edit" : "Add"} ${label}`;
  const Icon = hasValue ? HiOutlinePencilSquare : HiOutlinePlus;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={actionLabel}
      title={actionLabel}
      className={cn("grid h-9 w-9 shrink-0 cursor-pointer place-items-center rounded-xl border border-border bg-card text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft/20 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30", className)}
    >
      <Icon className={cn("h-4 w-4", !hasValue && "text-primary")} aria-hidden="true" />
    </button>
  );
}

function Profile() {
  const availabilityAction = useConfirmedAction();
  const s = useApp();
  const p = (s.profile || {}) as Record<string, unknown>;
  const [isUploading, setIsUploading] = useState(false);
  const [showDigiLockerModal, setShowDigiLockerModal] = useState(false);
  const [replacementDocType, setReplacementDocType] = useState<string | null>(null);
  const [uploadDocumentType, setUploadDocumentType] = useState("ID_PROOF");
  const [candidateData, setCandidateData] = useState<CandidateProfile | null>(null);
  const [qualificationSuggestion, setQualificationSuggestion] = useState<QualificationSuggestion | null>(null);
  const [isSavingQualificationSuggestion, setIsSavingQualificationSuggestion] = useState(false);
  const [showCertificateForm, setShowCertificateForm] = useState(false);
  const [showCompletedStrength, setShowCompletedStrength] = useState(false);
  const [isSavingCertificate, setIsSavingCertificate] = useState(false);
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateUploadedDocumentId, setCertificateUploadedDocumentId] = useState<string | null>(null);
  const [certificateFileError, setCertificateFileError] = useState<string | null>(null);
  const [certificateDraft, setCertificateDraft] = useState({ name: "", issuer: "", credentialId: "", issueDate: "", expiryDate: "" });
  const [loading, setLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<PreviewModalState | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certificateFileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);
  const [isDownloadingDossier, setIsDownloadingDossier] = useState(false);
  const [isReferralOpen, setIsReferralOpen] = useState(false);
  const [referralDashboard, setReferralDashboard] = useState<CandidateReferralDashboard | null>(null);
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);

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
    skillsText: "",
    availability: "",
    employmentType: "",
    preferredCitiesText: "",
    salaryMinRupees: "",
    salaryMaxRupees: "",
    experienceHistory: [] as CandidateExperience[],
  });

  const loadProfile = () => {
    setLoading(true);
    setProfileError(null);
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
            role: data.profession || (data.isStudent ? data.course : ""),
            specialty: data.specialty || "",
            qual: data.qualification || "",
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
          docs: Object.fromEntries((data.documents || []).map((d) => [d.documentType, d.originalFileName])),
        }));
      })
      .catch((err) => {
        setProfileError(errorMessage(err, "Could not load your profile."));
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
  };
  useEffect(() => {
    loadProfile();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") loadProfile();
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, []);

  // 100% Dynamic Onboarding & Profile Data Extraction
  const name = candidateData ? candidateData.name || "Clinician" : String(p["name"] || s.contact || "Clinician");
  const role = candidateData ? candidateData.profession || (candidateData.isStudent ? candidateData.course : "") || "" : String(p["role"] || p["profession"] || "");
  const specialty = candidateData ? candidateData.specialty || "" : String(p["specialty"] || "");
  const hasSpecialty = Boolean(specialty.trim() && specialty !== "Not provided");
  const qual = candidateData ? candidateData.qualification || "" : String(p["qual"] || p["qualification"] || "");
  const city = candidateData ? candidateData.city || "" : String(p["city"] || "");
  const stateName = candidateData ? candidateData.state || "" : String(p["state"] || "");
  const addressLine = candidateData ? candidateData.addressLine || "" : String(p["addressLine"] || p["address"] || "");
  const pincode = candidateData
    ? candidateData.pincode || extractIndianPincode(addressLine)
    : String(p["pincode"] || extractIndianPincode(addressLine));

  // Full Address line with City, State, PIN
  const fullAddress = addressLine
    ? `${addressLine}${city && !addressLine.includes(city) ? `, ${city}` : ""}${stateName && !addressLine.includes(stateName) ? `, ${stateName}` : ""}${pincode && !addressLine.includes(pincode) ? ` - ${pincode}` : ""}`
    : [city, stateName].filter(Boolean).join(", ") + (pincode ? ` - ${pincode}` : "");

  const email = candidateData ? candidateData.email || "" : String(p["email"] || "");
  const mobile = candidateData ? candidateData.phone || "" : String(p["mobile"] || s.contact || "");
  const council = candidateData ? candidateData.council || "" : String(p["council"] || "");
  const regNo = candidateData ? candidateData.regNumber || "" : String(p["regNo"] || "");
  const regYear = candidateData ? candidateData.regYear || "" : String(p["regYear"] || p["year"] || "");
  const exp = candidateData ? candidateData.experienceYears || (candidateData.isStudent ? "Student" : "") : String(p["exp"] || (p["fresher"] ? "Fresher" : ""));
  const collegeName = candidateData ? candidateData.college || "" : String(p["college"] || p["institution"] || "");
  const avatarUrl = candidateData
    ? candidateData.documents?.find((d) => d.documentType === "PHOTO")?.fileUrl || ""
    : String(p["avatar"] || "");

  const candidateLevel = String(candidateData?.candidateLevel?.toLowerCase() || p["level"] || p["cadreLevel"] || (exp === "Fresher" ? "fresher" : "professional"));
  const isStudent = Boolean(candidateData ? candidateData.isStudent : candidateLevel === "student");
  const isFresher = Boolean(p["fresher"] || exp.toLowerCase().includes("fresher") || candidateLevel === "fresher");

  const openToWork = candidateData
    ? Boolean(candidateData.openToWork)
    : p["openToWork"] !== undefined ? Boolean(p["openToWork"]) : false;

  const salaryMin = candidateData?.expectedSalaryMinRupees;
  const salaryMax = candidateData?.expectedSalaryMaxRupees;
  const salary = candidateData
    ? salaryMin != null && salaryMin > 0 && salaryMax != null && salaryMax > 0
      ? `₹${salaryMin.toLocaleString("en-IN")} – ₹${salaryMax.toLocaleString("en-IN")}/mo`
      : salaryMin != null && salaryMin > 0
        ? `From ₹${salaryMin.toLocaleString("en-IN")}/mo`
        : salaryMax != null && salaryMax > 0
          ? `Up to ₹${salaryMax.toLocaleString("en-IN")}/mo`
          : ""
    : String(p["salary"] || "").match(/₹\s*0\s*[–-]\s*₹\s*0/i) ? "" : String(p["salary"] || "");
  const hasExpectedSalary = candidateData
    ? Boolean((salaryMin != null && salaryMin > 0) || (salaryMax != null && salaryMax > 0))
    : Boolean(salary);

  const availability = candidateData ? candidateData.availability || "" : String(p["availability"] || p["notice"] || "");
  const employmentType = candidateData ? candidateData.employmentType || "" : String(p["employmentType"] || "");
  const bio = candidateData ? candidateData.bio || "" : String(p["bio"] || p["about"] || "");

  const preferredCities = candidateData
    ? candidateData.preferredCities || []
    : Array.isArray(p["preferredCity"])
      ? (p["preferredCity"] as string[])
      : p["preferredCity"]
        ? String(p["preferredCity"]).split(", ")
        : [];

  const skills = candidateData
    ? candidateData.skills || []
    : Array.isArray(p["skills"]) && (p["skills"] as string[]).length > 0
      ? (p["skills"] as string[])
      : [];

  const languages = candidateData
    ? candidateData.languages || []
    : Array.isArray(p["languages"]) && (p["languages"] as string[]).length > 0
      ? (p["languages"] as string[])
      : [];

  const exps: CandidateExperience[] = candidateData
    ? candidateData.experienceHistory || []
    : Array.isArray(p["exps"])
      ? (p["exps"] as any[]).map((item, index) => ({
          id: String(item.id || index), organization: String(item.org || item.organization || ""),
          title: String(item.role || item.title || ""), startDate: "", endDate: "", current: Boolean(item.cur),
          description: "",
        }))
      : [];

  // Document Vault list from Onboarding with Real File URLs (excluding avatar profile photo)
  const documentsList = useMemo(() => {
    if (candidateData) {
      return (candidateData.documents || [])
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
          reviewStatus: ["RESUME", "PHOTO", "PROFILE_PHOTO"].includes(d.documentType)
            ? "NOT_REQUIRED"
            : d.reviewStatus || (d.verified ? "VERIFIED" : "PENDING"),
          reviewNotes: d.reviewNotes,
          fileUrl: d.fileUrl,
          size: d.fileSizeBytes,
          createdAt: d.createdAt,
        }));
    }

    return [];
  }, [candidateData]);
  const linkedCertificateDocumentIds = new Set((candidateData?.certifications || []).map((certificate) => certificate.documentId));
  const latestDocuments = Array.from(documentsList.reduce((latestByType, doc) => {
    const documentKey = doc.type === "CERTIFICATION" ? `${doc.type}:${doc.id}` : doc.type;
    const previous = latestByType.get(documentKey);
    const previousTime = previous?.createdAt ? Date.parse(previous.createdAt) : 0;
    const currentTime = doc.createdAt ? Date.parse(doc.createdAt) : 0;
    if (!previous || currentTime >= previousTime) latestByType.set(documentKey, doc);
    return latestByType;
  }, new Map<string, (typeof documentsList)[number]>()).values());
  const resumeDocument = latestDocuments.find((doc) => doc.type === "RESUME" || doc.type === "CV");

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name} on FALE Healthcare`,
          text: `View ${name}'s healthcare profile on FALE Healthcare.`,
          url: window.location.href,
        });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    copyToClipboard(window.location.href, "Profile link");
  };

  const handleToggleOpenToWork = async (checked: boolean) => {
    await availabilityAction.run(async () => {
      await updateOpenToWork(checked);
      setCandidateData((previous) => previous ? { ...previous, openToWork: checked } : previous);
      setState((previous) => ({ profile: { ...previous.profile, openToWork: checked } }));
      toast.success(checked ? "Open to Work activated" : "Open to Work paused");
    });
  };

  const effectiveKycStatus = String(
    candidateData?.kycStatus || p["kycStatus"] || "PENDING"
  ).toUpperCase();
  const profileStrengthItems: Array<{ label: string; complete: boolean; section: Exclude<EditSectionType, null> | "certifications"; countsTowardStrength: boolean; optional?: boolean }> = [
    { label: "Name and location", complete: Boolean(name && name !== "Clinician" && city), section: "address", countsTowardStrength: true },
    { label: "Contact email", complete: Boolean(email), section: "personal" as const, countsTowardStrength: true },
    { label: "Professional details", complete: Boolean(role && role !== "Clinician" && hasSpecialty), section: "personal" as const, countsTowardStrength: true },
    { label: isStudent ? "Education details" : "Qualification", complete: Boolean(qual && collegeName), section: "licensure" as const, countsTowardStrength: true },
    { label: "Skills", complete: skills.length > 0, section: "skills" as const, countsTowardStrength: true },
    { label: "Languages", complete: languages.length > 0, section: "personal" as const, countsTowardStrength: true },
    { label: isStudent || isFresher ? "Clinical exposure" : "Work experience", complete: exps.length > 0, section: "work" as const, countsTowardStrength: !isStudent && !isFresher, optional: isStudent || isFresher },
    { label: "Job preferences", complete: Boolean(preferredCities.length && employmentType && availability), section: "openToWork" as const, countsTowardStrength: true },
    { label: "Professional summary", complete: Boolean(bio.trim()), section: "summary" as const, countsTowardStrength: true },
    { label: "Expected salary", complete: hasExpectedSalary, section: "openToWork" as const, countsTowardStrength: false, optional: true },
    { label: "Certifications", complete: Boolean(candidateData?.certifications?.length), section: "certifications" as const, countsTowardStrength: false },
  ];
  const profileCompletion = calculateCandidateProfileStrength({
    name,
    city,
    email,
    profession: role,
    specialty,
    qualification: qual,
    college: collegeName,
    skills,
    languages,
    experienceHistory: exps,
    preferredCities,
    employmentType,
    availability,
    bio,
    isStudent,
    isFresher,
  });
  const strengthSignals = profileStrengthItems.filter((item) => item.countsTowardStrength);
  const completedStrengthCount = strengthSignals.filter((item) => item.complete).length;
  const incompleteStrengthItems = strengthSignals.filter((item) => !item.complete);
  const completedProfileItems = strengthSignals.filter((item) => item.complete);
  const optionalProfileItems = profileStrengthItems.filter((item) => !item.countsTowardStrength && item.section !== "certifications");
  const certificationStrengthItem = profileStrengthItems.find((item) => item.section === "certifications")!;
  const openCertificateEligibility = () => {
    if (!certificationStrengthItem.complete) setShowCertificateForm(true);
    window.setTimeout(() => document.getElementById("profile-certifications")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
  };
  const handleProfileStrengthAction = (item: (typeof profileStrengthItems)[number]) => {
    if (item.section === "certifications") {
      if (!item.complete) setShowCertificateForm(true);
      window.setTimeout(() => document.getElementById("profile-certifications")?.scrollIntoView({ behavior: "smooth", block: "center" }), 0);
    } else {
      openEditSection(item.section);
    }
  };

  const referralCode = referralDashboard?.referralCode || "";
  const referralUrl = referralCode ? `${window.location.origin}/onboarding?ref=${encodeURIComponent(referralCode)}` : "";
  const referralInviteText = referralDashboard
    ? `I use The Fale to find verified healthcare jobs and shifts. It is free for healthcare professionals. Join here: ${referralUrl}. You can use my code ${referralCode}. I can earn ₹${referralDashboard.firstShiftRewardRupees} after your first completed shift or ₹${referralDashboard.hireRewardRupees} if you are hired.`
    : "";
  const openReferralPanel = async () => {
    setIsReferralOpen(true);
    if (referralDashboard || referralLoading) return;
    setReferralLoading(true);
    setReferralError(null);
    try {
      setReferralDashboard(await getCandidateReferrals());
    } catch (error) {
      setReferralError(errorMessage(error, "Could not load referral details."));
    } finally {
      setReferralLoading(false);
    }
  };

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

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File is too large. Please choose a file under 5 MB.");
      e.target.value = "";
      return;
    }
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      toast.error("Upload a PDF, JPG, or PNG document.");
      e.target.value = "";
      return;
    }

    setIsUploading(true);
    try {
      const docType = replacementDocType || uploadDocumentType || (file.name.toLowerCase().includes("degree")
          ? "DEGREE_CERTIFICATE"
          : file.name.toLowerCase().includes("council") || file.name.toLowerCase().includes("license")
            ? "REGISTRATION_CERTIFICATE"
            : file.name.toLowerCase().includes("bonafide")
              ? "BONAFIDE"
              : file.name.toLowerCase().includes("student") || file.name.toLowerCase().includes("college id")
                ? "STUDENT_ID"
            : file.name.toLowerCase().includes("resume") || file.name.toLowerCase().includes("cv")
              ? "RESUME"
              : "EXPERIENCE_CERTIFICATE");
      let educationSuggestion: QualificationSuggestion | null = null;
      if (docType === "DEGREE_CERTIFICATE" && !candidateData?.isStudent) {
        try {
          const extractedText = await extractTextFromFile(file);
          const extractedEducation = parseResumeText(extractedText);
          if (extractedEducation.qual || extractedEducation.institution) {
            educationSuggestion = {
              qualification: extractedEducation.qual || "",
              institution: extractedEducation.institution || "",
              fileName: file.name,
            };
          }
        } catch (extractionError) {
          console.warn("Could not read education details from the qualification certificate:", extractionError);
        }
      }
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      });
      await uploadCandidateDocument(docType, file.name, dataUrl);
      const fresh = await getCandidateProfile();
      setCandidateData(fresh);
      if (educationSuggestion) {
        setQualificationSuggestion(educationSuggestion);
        toast.success("Qualification certificate uploaded", {
          description: "We found education details in the document. Review them below before saving them to your profile.",
        });
      } else if (docType === "DEGREE_CERTIFICATE") {
        toast.success("Qualification certificate uploaded", {
          description: "We couldn't confidently read the qualification. The document is saved for review; add your details under Education and registration.",
        });
      } else {
        toast.success(`${file.name} uploaded successfully!`);
      }
    } catch (err: any) {
      toast.error("Failed to upload: " + (err?.message || "Error"));
    } finally {
      setReplacementDocType(null);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const saveQualificationSuggestion = async () => {
    const suggestion = qualificationSuggestion;
    if (!suggestion?.qualification.trim()) {
      toast.error("Please confirm the qualification shown on your certificate.");
      return;
    }
    setIsSavingQualificationSuggestion(true);
    try {
      const updated = await updateCandidateEducation(
        suggestion.qualification.trim(),
        suggestion.institution.trim() || undefined,
      );
      setCandidateData(updated);
      setState((prev) => ({
        profile: {
          ...prev.profile,
          qual: updated.qualification || suggestion.qualification.trim(),
          qualification: updated.qualification || suggestion.qualification.trim(),
          college: updated.college || suggestion.institution.trim(),
          institution: updated.college || suggestion.institution.trim(),
        },
      }));
      setQualificationSuggestion(null);
      toast.success("Education details saved", {
        description: "Your uploaded certificate remains under review by the verification team.",
      });
    } catch (err: any) {
      toast.error("Could not save education details", { description: err?.message || "Please try again." });
    } finally {
      setIsSavingQualificationSuggestion(false);
    }
  };

  const handleSaveCertification = async () => {
    if (!candidateData) return;
    if (!certificateDraft.name.trim() || !certificateDraft.issuer.trim()) {
      toast.error("Add the certificate name and issuing organization.");
      return;
    }
    if (!certificateFile && !certificateUploadedDocumentId) {
      toast.error("Choose a certificate file to upload.");
      return;
    }
    if (certificateDraft.issueDate && certificateDraft.expiryDate && certificateDraft.expiryDate < certificateDraft.issueDate) {
      toast.error("Expiry date must be after the issue date.");
      return;
    }
    setIsSavingCertificate(true);
    let uploadedDocumentId = certificateUploadedDocumentId;
    try {
      if (!uploadedDocumentId && certificateFile) {
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error("Could not read the certificate file."));
          reader.readAsDataURL(certificateFile);
        });
        const uploaded = await uploadCandidateDocument("CERTIFICATION", certificateFile.name, dataUrl);
        uploadedDocumentId = uploaded.id;
        setCertificateUploadedDocumentId(uploaded.id);
      }
      const certification: CandidateCertification = {
        id: crypto.randomUUID(),
        name: certificateDraft.name.trim(),
        issuer: certificateDraft.issuer.trim(),
        credentialId: certificateDraft.credentialId.trim() || undefined,
        issueDate: certificateDraft.issueDate || undefined,
        expiryDate: certificateDraft.expiryDate || undefined,
        documentId: uploadedDocumentId!,
      };
      const updated = await updateCandidateProfile({ certifications: [...(candidateData.certifications || []), certification] });
      setCandidateData(updated);
      setCertificateDraft({ name: "", issuer: "", credentialId: "", issueDate: "", expiryDate: "" });
      setCertificateFile(null);
      setCertificateUploadedDocumentId(null);
      setCertificateFileError(null);
      if (certificateFileInputRef.current) certificateFileInputRef.current.value = "";
      setShowCertificateForm(false);
      toast.success("Certificate uploaded", { description: "It is saved to your profile and awaiting review." });
    } catch (error: any) {
      if (uploadedDocumentId) {
        try { setCandidateData(await getCandidateProfile()); } catch { /* Keep the form available for retry. */ }
        toast.error("Certificate file uploaded, but its details were not linked", { description: "Your information is still here. Try saving the certificate again." });
      } else {
        toast.error("Could not save this certificate", { description: error?.message || "Please try again." });
      }
    } finally {
      setIsSavingCertificate(false);
    }
  };

  const handleCertificateFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) return;
    if (!["application/pdf", "image/jpeg", "image/png"].includes(file.type)) {
      setCertificateFile(null);
      setCertificateFileError("Choose a PDF, JPG, or PNG file.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setCertificateFile(null);
      setCertificateFileError("Choose a file smaller than 5 MB.");
      event.target.value = "";
      return;
    }
    setCertificateFile(file);
    setCertificateUploadedDocumentId(null);
    setCertificateFileError(null);
  };

  const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Please upload an image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Photo is too large. Please choose an image under 5 MB.");
      return;
    }

    setIsUpdatingAvatar(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Could not read the selected image."));
        reader.readAsDataURL(file);
      });
      await uploadCandidateDocument("PHOTO", file.name, dataUrl);
      const fresh = await getCandidateProfile();
      setCandidateData(fresh);
      setState((prev) => ({ profile: { ...prev.profile, avatar: dataUrl } }));
      toast.success("Profile photo updated successfully.");
    } catch (err: any) {
      toast.error("Could not update your profile photo", { description: err?.message || "Please try again." });
    } finally {
      setIsUpdatingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const normalizeEmploymentType = (val?: string): string => {
    if (!val) return "";
    const clean = val.trim().toLowerCase();
    if (clean.includes("part")) return "Part-time";
    if (clean.includes("locum") || clean.includes("shift") || clean.includes("per-shift")) return "Per-shift";
    if (clean.includes("contract")) return "Contract";
    if (clean.includes("intern")) return "Internship";
    if (clean.includes("full")) return "Full-time";
    return val;
  };

  const normalizeAvailability = (val?: string): string => {
    if (!val) return "";
    const clean = val.trim().toLowerCase();
    if (clean.includes("immed") || clean.includes("now")) return "Immediately";
    if (clean.includes("15") || clean.includes("two week") || clean.includes("2 week")) return "Within 15 days";
    if (clean.includes("90") || clean.includes("three month")) return "Within 90 days";
    if (clean.includes("60") || clean.includes("2+") || clean.includes("2 month") || clean.includes("two month")) return "Within 60 days";
    if (clean.includes("1 month") || clean.includes("30") || clean.includes("one month")) return "Within 30 days";
    return val;
  };

  const openEditSection = (section: EditSectionType) => {
    setEditForm({
      name,
      profession: role === "Clinician" ? "" : role,
      specialty: specialty === "Not provided" ? "" : specialty,
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
      pincode: pincode || extractIndianPincode(addressLine),
      experienceYears: exp,
      skillsText: skills.join(", "),
      availability: normalizeAvailability(availability),
      employmentType: normalizeEmploymentType(employmentType),
      preferredCitiesText: preferredCities.join(", "),
      salaryMinRupees: candidateData?.expectedSalaryMinRupees?.toString() || "",
      salaryMaxRupees: candidateData?.expectedSalaryMaxRupees?.toString() || "",
      experienceHistory: (candidateData?.experienceHistory || []).map((experience) => ({ ...experience })),
    });
    setActiveEditSection(section);
  };

  const handleSaveSection = async () => {
    setIsSavingSection(true);
    try {
      const specialtyValue = editForm.specialty === "__OTHER__" ? "" : editForm.specialty;
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

      let changes: Record<string, any> = {};
      if (activeEditSection === "personal") {
        if (editForm.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email.trim())) {
          toast.error("Enter a valid email address.");
          setIsSavingSection(false);
          return;
        }
        changes = { fullName: editForm.name.trim(), profession: editForm.profession, primarySpecialty: specialtyValue, email: editForm.email.trim(), languages: parsedLangs };
      } else if (activeEditSection === "summary") {
        changes = { bio: editForm.bio };
      } else if (activeEditSection === "licensure") {
        changes = isStudent
          ? { course: editForm.qualification, collegeName: editForm.college }
          : { council: editForm.council, councilRegistrationNumber: editForm.regNumber, qualification: editForm.qualification, collegeName: editForm.college };
      } else if (activeEditSection === "address") {
        changes = {
          fullName: editForm.name.trim(),
          addressLine: editForm.addressLine,
          city: editForm.city.trim(),
          state: editForm.state,
          pincode: editForm.pincode.trim() || extractIndianPincode(editForm.addressLine),
        };
      } else if (activeEditSection === "work") {
        const incompleteExperience = editForm.experienceHistory.some((experience) =>
          !experience.organization.trim() || !experience.title.trim() || !experience.startDate || (!experience.current && !experience.endDate)
        );
        if (incompleteExperience) {
          toast.error("Complete the organization, role, and dates for each experience entry.");
          setIsSavingSection(false);
          return;
        }
        changes = { experienceYears: editForm.experienceYears, experienceHistory: editForm.experienceHistory };
      } else if (activeEditSection === "skills") {
        changes = { skills: parsedSkills };
      } else if (activeEditSection === "openToWork") {
        const minSalary = editForm.salaryMinRupees.trim() ? Number(editForm.salaryMinRupees) : undefined;
        const maxSalary = editForm.salaryMaxRupees.trim() ? Number(editForm.salaryMaxRupees) : undefined;
        if ((minSalary !== undefined && (!Number.isFinite(minSalary) || minSalary <= 0)) || (maxSalary !== undefined && (!Number.isFinite(maxSalary) || maxSalary <= 0))) {
          toast.error("Enter a valid expected salary amount, or leave it blank.");
          setIsSavingSection(false);
          return;
        }
        if (minSalary !== undefined && maxSalary !== undefined && maxSalary < minSalary) {
          toast.error("Maximum salary must be greater than or equal to minimum salary.");
          setIsSavingSection(false);
          return;
        }
        changes = {
          preferredCities: parsedCities,
          employmentType: editForm.employmentType,
          availability: editForm.availability,
          expectedSalaryMinRupees: minSalary,
          expectedSalaryMaxRupees: maxSalary,
          updateExpectedSalary: true,
        };
      }

      const updated = await updateCandidateProfile(changes);
      setCandidateData(updated);
      setState((prev) => ({
        candidateLevel: updated.isStudent ? "student" : updated.candidateLevel.toLowerCase() as any,
        profile: {
          ...prev.profile,
          name: updated.name,
          email: updated.email,
          mobile: updated.phone,
          role: updated.profession || (updated.isStudent ? updated.course : ""),
          specialty: updated.specialty || "",
          qual: updated.qualification || "",
          qualification: updated.qualification || "",
          college: updated.college || "",
          institution: updated.college || "",
          council: updated.council || "",
          regNo: updated.regNumber || "",
          city: updated.city || "",
          state: updated.state || "",
          addressLine: updated.addressLine || "",
          pincode: updated.pincode || "",
          exp: updated.experienceYears || "",
          skills: updated.skills || [],
          languages: updated.languages || [],
          preferredCity: updated.preferredCities || [],
          openToWork: Boolean(updated.openToWork),
          availability: updated.availability || "",
          employmentType: updated.employmentType || "",
          salary: updated.expectedSalaryMinRupees != null && updated.expectedSalaryMinRupees > 0 && updated.expectedSalaryMaxRupees != null && updated.expectedSalaryMaxRupees > 0
            ? `₹${updated.expectedSalaryMinRupees.toLocaleString("en-IN")} – ₹${updated.expectedSalaryMaxRupees.toLocaleString("en-IN")}/mo`
            : updated.expectedSalaryMinRupees != null && updated.expectedSalaryMinRupees > 0
              ? `From ₹${updated.expectedSalaryMinRupees.toLocaleString("en-IN")}/mo`
              : updated.expectedSalaryMaxRupees != null && updated.expectedSalaryMaxRupees > 0
                ? `Up to ₹${updated.expectedSalaryMaxRupees.toLocaleString("en-IN")}/mo`
                : "",
        },
      }));

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
      if (!rawUrl) {
        toast.error("This document file is unavailable. Please upload it again.");
        return;
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
        toast.error("This document uses an unsupported file link. Please upload it again.");
        return;
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

  const professionOptions = Array.from(new Set([
    ...professions,
    ...(editForm.profession && !professions.includes(editForm.profession) ? [editForm.profession] : []),
  ]));
  const hasUniversityRegistrationProof = isStudent && Boolean(candidateData?.universityRegNo?.trim() && candidateData.universityRegNo.trim().length >= 5);
  const verificationRequirements = isStudent
    ? [{ title: "Proof of study", description: "Upload a college ID or bonafide certificate, or provide a university registration number for manual review.", documents: [
        { type: "STUDENT_ID", label: "College ID" },
        { type: "BONAFIDE", label: "Bonafide certificate" },
      ] }]
    : [
        { title: "Government photo ID", description: "A valid government-issued identity document.", documents: [{ type: "ID_PROOF", label: "Government photo ID" }] },
        { title: "Council registration certificate", description: "Your active state council registration certificate.", documents: [{ type: "REGISTRATION_CERTIFICATE", label: "Council registration certificate" }] },
        { title: "Degree or provisional certificate", description: "Your medical or clinical qualification certificate.", documents: [{ type: "DEGREE_CERTIFICATE", label: "Degree / provisional certificate" }] },
      ];
  const verificationStages = isStudent
    ? [{ title: "Proof of study", requirements: verificationRequirements }]
    : [
        { title: "Confirm it's you", requirements: verificationRequirements.slice(0, 1) },
        { title: "Registration and degree", requirements: verificationRequirements.slice(1) },
      ];
  const identityDocument = latestDocuments.find((doc) => doc.type === "ID_PROOF");
  const identityStepComplete = Boolean(identityDocument && identityDocument.reviewStatus !== "REJECTED");
  const requiredVerificationTypes = new Set(verificationRequirements.flatMap((requirement) => requirement.documents.map((doc) => doc.type)));
  const additionalDocuments = latestDocuments.filter((doc) => !requiredVerificationTypes.has(doc.type) && !linkedCertificateDocumentIds.has(doc.id));
  const startDocumentUpload = (documentType: string) => {
    setReplacementDocType(null);
    setUploadDocumentType(documentType);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };
  const specialtyOptions = departmentsByProfession[editForm.profession] ?? [];
  const isCustomSpecialty = editForm.specialty === "__OTHER__" || Boolean(editForm.specialty && !specialtyOptions.includes(editForm.specialty));

  return (
    <AppShell>
      <RequestError message={profileError} onRetry={loadProfile} retrying={loading} />
      <RequestError message={availabilityAction.error} />
      <main className="mx-auto w-full max-w-6xl min-w-0 space-y-6 px-0 pb-16">
        <header className="space-y-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-primary">Your FALE account</p>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">Your profile</h1>
          <p className="text-sm text-muted-foreground">Keep your details current so hospitals can find the right match.</p>
        </header>

        <section className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 flex-col items-center gap-3 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left">
                <div className="relative shrink-0">
                  <input ref={avatarInputRef} type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleAvatarSelect} className="hidden" />
                  <button type="button" onClick={() => avatarInputRef.current?.click()} disabled={isUpdatingAvatar} aria-label="Change profile photo" className="grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border border-border bg-primary-soft text-2xl font-black text-primary sm:h-24 sm:w-24">
                    {avatarUrl ? <img src={avatarUrl} alt={name} className="h-full w-full object-cover" /> : initials(name)}
                  </button>
                  <span className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground"><HiOutlineCamera className="h-3.5 w-3.5" /></span>
                </div>
                <div className="w-full min-w-0 sm:w-auto">
                  <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                    <h2 className="max-w-full break-words text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">{name}</h2>
                    <Badge variant="outline" className={effectiveKycStatus === "VERIFIED" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700" : "border-amber-500/30 bg-amber-500/10 text-amber-700"}>
                      {effectiveKycStatus === "VERIFIED" ? "Verified" : effectiveKycStatus === "REJECTED" ? "Needs an update" : effectiveKycStatus === "DOCUMENTS_REQUIRED" ? "Documents required" : "Verification pending"}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-foreground">{isStudent ? qual || role : role}{specialty && specialty !== "Not provided" ? ` | ${specialty}` : ""}</p>
                  <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-muted-foreground sm:justify-start"><HiOutlineMapPin className="h-4 w-4 shrink-0 text-primary" /><span>{[city, stateName].filter(Boolean).join(", ") || "Add your location"}</span></p>
                </div>
              </div>
              <Button type="button" size="sm" onClick={() => openEditSection("personal")} className="w-full rounded-xl sm:w-auto"><HiOutlinePencilSquare className="mr-1.5 h-4 w-4" />Edit profile</Button>
            </div>

            <div className="grid grid-cols-2 items-center gap-2 border-t border-border pt-4 sm:flex sm:flex-wrap">
              <div className="col-span-2 flex items-center gap-3 rounded-xl bg-muted/40 px-3 py-2 sm:mr-auto"><div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${profileCompletion}%` }} /></div><span className="text-xs font-bold text-foreground">{profileCompletion}% complete</span></div>
              {candidateData?.shiftRatingCount ? <span className="rounded-xl bg-muted/40 px-3 py-2 text-center text-xs font-semibold text-foreground sm:text-left">{Number(candidateData.shiftRatingAvg).toFixed(1)} rating</span> : null}
              <span className="rounded-xl bg-muted/40 px-3 py-2 text-center text-xs font-semibold text-foreground sm:text-left">{candidateData?.completedShiftsCount ?? 0} shifts</span>
              <Button type="button" variant="outline" size="sm" disabled={resumeDocument?.fileUrl ? isDownloadingDossier : isUploading} onClick={() => resumeDocument?.fileUrl ? handlePreviewDocument(resumeDocument) : startDocumentUpload("RESUME")} className="w-full rounded-xl sm:w-auto">{resumeDocument?.fileUrl ? <HiOutlineArrowDownTray className="mr-1.5 h-4 w-4 text-primary" /> : <HiOutlineArrowUpTray className="mr-1.5 h-4 w-4 text-primary" />}{resumeDocument?.fileUrl ? "View resume" : "Upload resume"}</Button>
              <Link to="/huddle" className="inline-flex h-9 w-full items-center justify-center rounded-xl border border-border px-3 text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-primary-soft/30 sm:w-auto"><HiOutlineChatBubbleLeftRight className="mr-1.5 h-4 w-4 text-primary" />Huddle</Link>
              <Button type="button" variant="outline" size="sm" onClick={() => void openReferralPanel()} className="w-full rounded-xl sm:w-auto"><HiOutlineGift className="mr-1.5 h-4 w-4 text-primary" />Refer &amp; earn</Button>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-border bg-card p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><h2 className="text-base font-extrabold text-foreground">Build your profile strength</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Add the details that help hospitals understand your experience. Optional items won’t hold back your completion score.</p></div>
            <div className="flex w-full min-w-0 flex-col gap-2 lg:w-auto lg:flex-row lg:items-center lg:gap-3">
              <div className="w-full min-w-0 lg:min-w-32"><div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] font-semibold text-muted-foreground"><span>{completedStrengthCount} of {strengthSignals.length} essentials</span><span>{profileCompletion}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${profileCompletion}%` }} /></div></div>
              {incompleteStrengthItems[0] && <Button type="button" size="sm" onClick={() => handleProfileStrengthAction(incompleteStrengthItems[0])} className="h-9 w-full min-w-0 shrink-0 whitespace-nowrap text-xs font-bold lg:w-auto lg:px-3">Continue profile <HiOutlineArrowRight className="ml-1.5 h-4 w-4" /></Button>}
            </div>
          </div>
          <h3 className="mt-5 mb-2.5 text-xs font-bold text-foreground">{incompleteStrengthItems.length ? "Next details to add" : "Your essential details are complete"}</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {incompleteStrengthItems.map((item) => <button key={item.label} type="button" onClick={() => handleProfileStrengthAction(item)} aria-label={`Add ${item.label}`} className="group flex min-h-12 w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-border bg-background px-3.5 py-2.5 text-left transition-all hover:border-primary/40 hover:bg-primary-soft/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30">
              <span className="grid h-5 w-5 shrink-0 place-items-center">{item.complete ? <HiCheckCircle className="h-5 w-5 text-emerald-600" /> : <span className="h-4 w-4 rounded-full border border-muted-foreground/40" />}</span>
              <span className="min-w-0 flex-1 text-xs font-semibold leading-4 text-foreground">{item.label}</span>
              <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-xl transition-colors", item.complete ? "bg-muted/70 text-muted-foreground group-hover:bg-muted" : "bg-primary/10 text-primary group-hover:bg-primary/15")} title={item.section === "certifications" && item.complete ? "Add another certificate" : item.complete ? "Edit" : "Add"} aria-hidden="true">
                {item.complete ? <HiOutlinePencilSquare className="h-4 w-4" /> : <HiOutlinePlus className="h-4 w-4" />}
              </span>
            </button>)}
          </div>
          {completedProfileItems.length > 0 && <div className="mt-3">
            <button type="button" aria-expanded={showCompletedStrength} onClick={() => setShowCompletedStrength((visible) => !visible)} className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground">{showCompletedStrength ? "Hide completed" : `Show completed (${completedProfileItems.length})`}<HiOutlineChevronDown className={cn("h-4 w-4 transition-transform", showCompletedStrength && "rotate-180")} /></button>
            {showCompletedStrength && <div className="mt-2 grid gap-2 sm:grid-cols-2">{completedProfileItems.map((item) => <button key={item.label} type="button" onClick={() => handleProfileStrengthAction(item)} aria-label={`Edit ${item.label}`} className="group flex min-h-11 w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-border/70 bg-muted/20 px-3.5 py-2 text-left transition-colors hover:border-primary/35 hover:bg-primary-soft/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><HiCheckCircle className="h-4 w-4 shrink-0 text-emerald-600" /><span className="min-w-0 flex-1 text-xs font-medium text-muted-foreground">{item.label}</span><HiOutlinePencilSquare className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" /></button>)}</div>}
          </div>}
          <div className="mt-5 rounded-2xl border border-primary/20 bg-primary-soft/15 p-3.5 sm:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-start gap-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><HiOutlineCheckBadge className="h-5 w-5" /></span>
                <div className="min-w-0"><h3 className="text-xs font-extrabold text-foreground">Certificates for shift eligibility</h3><p className="mt-1 text-[11px] leading-4 text-muted-foreground">Some shifts require active BLS, ACLS, or other credentials. Add your certificates so hospitals can review your eligibility. Only platform-verified certificates meet shift requirements.</p></div>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={openCertificateEligibility} className="w-full shrink-0 rounded-xl border-primary/30 bg-card text-primary hover:bg-primary/5 sm:w-auto">{certificationStrengthItem.complete ? "View certificates" : "Add certificates"}<HiOutlineArrowRight className="ml-1.5 h-4 w-4" /></Button>
            </div>
          </div>
          {optionalProfileItems.length > 0 && <div className="mt-5 border-t border-border pt-4">
            <div className="mb-2.5 flex items-center gap-2"><HiOutlineSparkles className="h-4 w-4 text-primary" /><h3 className="text-xs font-bold text-foreground">Optional profile boosts</h3><span className="text-[10px] text-muted-foreground">Help hospitals learn more about you</span></div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{optionalProfileItems.map((item) => <button key={item.label} type="button" onClick={() => handleProfileStrengthAction(item)} aria-label={`${item.complete ? item.section === "certifications" ? "Add another certificate" : "Edit" : "Add"} ${item.label}`} className="group flex min-h-11 w-full min-w-0 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border bg-background px-3.5 py-2 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"><span className="min-w-0 flex-1 text-xs font-medium text-foreground">{item.label}</span>{item.complete ? <HiOutlinePencilSquare className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" /> : <HiOutlinePlus className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />}</button>)}</div>
          </div>}
        </section>
        <div className="space-y-5">
          <div className="flex flex-col gap-5">
            <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary">Professional profile</p>
                  <h2 className="mt-1 text-base font-extrabold text-foreground">Your clinical focus</h2>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">Help hospitals understand your role and the work you're interested in.</p>
                </div>
                <ProfileFieldAction label="professional details" hasValue={Boolean(role && role !== "Clinician" && hasSpecialty)} onClick={() => openEditSection("personal")} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-border bg-muted/20 p-4">
                  <span className="text-[11px] font-semibold text-muted-foreground">Profession</span>
                  <p className="mt-1 text-sm font-bold text-foreground">{role && role !== "Clinician" ? role : "Add your profession"}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Your broad healthcare role.</p>
                </div>
                <div className={cn("rounded-2xl border p-4", hasSpecialty ? "border-border bg-muted/20" : "border-primary/25 bg-primary-soft/20")}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground">{isStudent ? "Area of interest" : "Specialization"} <span className="font-normal">· Optional</span></span>
                      <p className="mt-1 text-sm font-bold text-foreground">{hasSpecialty ? specialty : "Not added yet"}</p>
                      <p className="mt-1 text-xs leading-5 text-muted-foreground">{hasSpecialty ? "You can update this whenever your focus changes." : "Add a clinical area to help improve job matches."}</p>
                    </div>
                    {!hasSpecialty && <HiOutlineSparkles className="mt-1 h-5 w-5 shrink-0 text-primary" />}
                  </div>
                </div>
              </div>
            </section>

            <div className="grid gap-5 sm:grid-cols-2">
              <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="text-base font-extrabold text-foreground">About you</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">A short introduction for hospitals.</p></div>
                  <ProfileFieldAction label="professional summary" hasValue={Boolean(bio.trim())} onClick={() => openEditSection("summary")} />
                </div>
                <p className="mt-4 whitespace-pre-line text-sm leading-6 text-muted-foreground">{bio || "Add a short summary about your field, experience, and clinical strengths."}</p>
                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-foreground">Skills</h3><ProfileFieldAction label="skills" hasValue={skills.length > 0} onClick={() => openEditSection("skills")} /></div>
                  {skills.length ? <div className="mt-3 flex flex-wrap gap-2">{skills.map((skill) => <Badge key={skill} variant="outline" className="rounded-lg border-primary/20 bg-primary-soft/30 px-2.5 py-1 text-primary">{skill}</Badge>)}</div> : <p className="mt-2 text-xs text-muted-foreground">No skills added yet.</p>}
                </div>
              </section>

              <section className="rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="flex items-start justify-between gap-3">
                  <div><h2 className="text-base font-extrabold text-foreground">{isStudent || isFresher ? "Clinical exposure" : "Work history"}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{isStudent || isFresher ? "Show internships, rotations, and supervised practice." : "Show hospitals and roles that shaped your clinical experience."}</p></div>
                  <ProfileFieldAction label={isStudent || isFresher ? "clinical exposure" : "work history"} hasValue={exps.length > 0} onClick={() => openEditSection("work")} />
                </div>
                {exps.length ? <div className="mt-4 space-y-3">{exps.map((item, idx) => <div key={item.id || idx} className="rounded-2xl border border-border p-3"><p className="text-sm font-bold text-foreground">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.organization}{item.startDate ? ` · ${item.startDate}` : ""}{item.current ? " · Current" : item.endDate ? ` – ${item.endDate}` : ""}</p>{item.description && <p className="mt-2 whitespace-pre-line text-xs leading-5 text-muted-foreground">{item.description}</p>}</div>)}</div> : <p className="mt-4 rounded-2xl bg-muted/40 p-3 text-xs leading-5 text-muted-foreground">No experience added yet.</p>}
                <div className="mt-5 border-t border-border pt-4">
                  <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold text-foreground">Education and registration</h3><ProfileFieldAction label="education and registration" hasValue={Boolean(qual || collegeName || council || regNo)} onClick={() => openEditSection("licensure")} /></div>
                  <dl className="mt-3 space-y-3 text-xs">
                    <div className="flex items-start justify-between gap-3"><dt className="text-muted-foreground">Qualification</dt><dd className="text-right font-semibold text-foreground">{qual || (isStudent ? role : "Not added")}</dd></div>
                    <div className="flex items-start justify-between gap-3"><dt className="text-muted-foreground">College / institution</dt><dd className="text-right font-semibold text-foreground">{collegeName || "Not added"}</dd></div>
                    {!isStudent && <div className="flex items-start justify-between gap-3"><dt className="text-muted-foreground">Council registration</dt><dd className="text-right font-semibold text-foreground">{regNo || "Not added"}</dd></div>}
                  </dl>
                </div>
              </section>
            </div>

            <section className="order-first min-w-0 rounded-3xl border border-border bg-card p-3.5 shadow-sm sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div><h2 className="text-base font-extrabold text-foreground">Documents and verification</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Your documents are private and reviewed by The Fale team.</p></div>
                <Badge variant="outline" className="shrink-0 rounded-full">{documentsList.length} uploaded</Badge>
              </div>
              <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleFileSelect} className="hidden" />
              {effectiveKycStatus === "REJECTED" && candidateData?.kycNotes && <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><p className="font-bold">Update requested by the verification team</p><p className="mt-1 text-xs leading-5">{candidateData.kycNotes}</p></div>}
              {qualificationSuggestion && <div className="mt-4 rounded-2xl border border-primary/25 bg-primary/5 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-primary/20 bg-card text-primary"><HiOutlineAcademicCap className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-extrabold text-foreground">Review education details found in your certificate</h3>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">We read these details from {qualificationSuggestion.fileName}. Please check them against your certificate before saving.</p>
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                      <label className="space-y-1.5">
                        <span className="block text-xs font-bold text-foreground">Qualification <span className="text-destructive">*</span></span>
                        <input value={qualificationSuggestion.qualification} onChange={(event) => setQualificationSuggestion((current) => current ? { ...current, qualification: event.target.value } : current)} placeholder="e.g. MBBS, B.Sc Nursing" className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                      </label>
                      <label className="space-y-1.5">
                        <span className="block text-xs font-bold text-foreground">College / institution <span className="font-normal text-muted-foreground">(optional)</span></span>
                        <input value={qualificationSuggestion.institution} onChange={(event) => setQualificationSuggestion((current) => current ? { ...current, institution: event.target.value } : current)} placeholder="Institution shown on your certificate" className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none" />
                      </label>
                    </div>
                    <p className="mt-2 text-[11px] leading-4 text-muted-foreground">Saving these details does not verify your profile. The uploaded certificate is still reviewed by our team.</p>
                    <div className="mt-3 flex flex-wrap justify-end gap-2">
                      <Button type="button" size="sm" variant="ghost" disabled={isSavingQualificationSuggestion} onClick={() => setQualificationSuggestion(null)} className="rounded-lg">Dismiss</Button>
                      <Button type="button" size="sm" disabled={isSavingQualificationSuggestion || !qualificationSuggestion.qualification.trim()} onClick={saveQualificationSuggestion} className="rounded-lg">
                        {isSavingQualificationSuggestion ? <><ButtonSpinner className="mr-2 h-3.5 w-3.5" />Saving...</> : "Confirm and save"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>}
              <div className="mt-4 min-w-0 rounded-2xl border border-border bg-muted/20 p-3 sm:p-5">
                <div className="flex items-start gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/10 text-primary"><HiOutlineDocumentText className="h-4 w-4" /></span>
                  <div className="min-w-0"><h3 className="text-sm font-extrabold text-foreground">{effectiveKycStatus === "VERIFIED" ? "Verification documents" : "Documents required for verification"}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{effectiveKycStatus === "VERIFIED" ? "Your required documents have been reviewed by The Fale team." : effectiveKycStatus === "PENDING" ? "Your required uploads are listed below. Each document is reviewed by The Fale team." : "Upload each missing item below. Your profile enters review after all required documents are uploaded."}</p></div>
                </div>
                <div className="mt-4 space-y-4">
                  {verificationStages.map((stage, stageIndex) => {
                    const stageLocked = !isStudent && stageIndex === 1 && !identityStepComplete;
                    return <div key={stage.title} className="space-y-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className={cn("grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-extrabold", stageIndex === 0 || identityStepComplete ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{stageIndex + 1}</span>
                        <h4 className="min-w-0 flex-1 text-xs font-extrabold leading-4 text-foreground">{stage.title}</h4>
                        {stageLocked && <span className="basis-full pl-8 text-[10px] font-semibold leading-4 text-muted-foreground sm:basis-auto sm:pl-0 sm:ml-auto">Complete step 1 first</span>}
                      </div>
                      {!isStudent && stageIndex === 0 && <div className="flex flex-col gap-3 rounded-xl border border-primary/20 bg-primary-soft/20 p-3.5 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="text-xs font-bold text-foreground">DigiLocker identity verification</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">DigiLocker is not connected yet. You can upload a photo ID below for manual review.</p></div><Button type="button" size="sm" variant="outline" onClick={() => setShowDigiLockerModal(true)} className="shrink-0 rounded-xl">DigiLocker details</Button></div>}
                      {stageLocked && <p className="rounded-xl bg-muted/40 px-3 py-2.5 text-[11px] leading-4 text-muted-foreground">Upload your photo ID below to continue to council registration and degree verification. DigiLocker sign-in is not connected yet.</p>}
                      {stage.requirements.map((requirement) => {
                    const uploadedTypes = requirement.documents.filter((requiredDoc) => latestDocuments.some((doc) => doc.type === requiredDoc.type && doc.reviewStatus !== "REJECTED"));
                    const requirementComplete = uploadedTypes.length > 0 || (isStudent && hasUniversityRegistrationProof);
                    return <div key={requirement.title} className="rounded-xl border border-border bg-card p-3 sm:p-4">
                      <div className="flex min-w-0 flex-col items-start gap-2 sm:flex-row sm:justify-between sm:gap-3">
                        <div className="w-full min-w-0 sm:flex-1">
                          <p className="break-words text-xs font-bold leading-4 text-foreground">{requirement.title}{isStudent && <span className="ml-1 font-medium text-muted-foreground">(choose one)</span>}</p>
                          <p className="mt-1 break-words text-[11px] leading-4 text-muted-foreground">{requirement.description}</p>
                        </div>
                        <span className={cn("max-w-full rounded-full px-2 py-1 text-[10px] font-bold leading-4", requirementComplete ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700")}>{requirementComplete ? (hasUniversityRegistrationProof && uploadedTypes.length === 0 ? "Submitted for review" : "Uploaded") : "Required"}</span>
                      </div>
                      {isStudent && hasUniversityRegistrationProof && uploadedTypes.length === 0 && <p className="mt-2 rounded-lg bg-primary/5 px-3 py-2 text-[11px] leading-4 text-muted-foreground">University registration number provided. Our team will review it with your profile.</p>}
                      <div className="mt-3 space-y-2">
                        {requirement.documents.map((requiredDoc) => {
                          const latestDoc = latestDocuments.find((doc) => doc.type === requiredDoc.type);
                          const uploadedDoc = latestDoc && latestDoc.reviewStatus !== "REJECTED" ? latestDoc : undefined;
                          const needsReupload = latestDoc?.reviewStatus === "REJECTED";
                          const rejectionNotes = latestDoc?.reviewNotes || candidateData?.kycNotes;
                          if (requirementComplete && !uploadedDoc) return null;
                          return <div key={requiredDoc.type} className="flex min-w-0 flex-col items-stretch gap-2 rounded-lg bg-muted/30 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex min-w-0 flex-1 items-start gap-2">
                              <span className={cn("mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full", uploadedDoc ? "bg-emerald-500/10 text-emerald-600" : needsReupload ? "bg-destructive/10 text-destructive" : "bg-muted text-muted-foreground")}>{uploadedDoc ? <HiCheckCircle className="h-4 w-4" /> : <HiOutlineDocumentText className="h-3.5 w-3.5" />}</span>
                              <div className="min-w-0 flex-1"><p className="break-words text-xs font-semibold leading-4 text-foreground">{requiredDoc.label}</p><p className="mt-0.5 break-words text-[10px] leading-4 text-muted-foreground">{uploadedDoc ? `${uploadedDoc.fileName} · ${uploadedDoc.reviewStatus === "VERIFIED" ? "Verified" : "Under review"}` : needsReupload ? `${rejectionNotes || "Admin requested an updated document."} · Re-upload required` : "Not uploaded"}</p></div>
                            </div>
                            {uploadedDoc?.fileUrl && <Button type="button" size="sm" variant="ghost" onClick={() => handlePreviewDocument(uploadedDoc)} className="h-8 shrink-0 self-start rounded-lg px-2 text-[10px] sm:self-center">View</Button>}
                            {!uploadedDoc && !stageLocked && <Button type="button" size="sm" variant="outline" disabled={isUploading} isLoading={isUploading && uploadDocumentType === requiredDoc.type} loadingText="Uploading..." onClick={() => startDocumentUpload(requiredDoc.type)} className="h-8 shrink-0 self-start rounded-lg px-2.5 text-[10px] sm:self-center"><HiOutlineArrowUpTray className="mr-1 h-3.5 w-3.5" />{needsReupload ? "Re-upload" : "Upload"}</Button>}
                          </div>;
                        })}
                      </div>
                      </div>;
                    })}
                    </div>;
                  })}
                </div>
                <section id="profile-certifications" className="mt-5 min-w-0 rounded-2xl border border-border bg-card p-3 sm:p-5">
                  <div className="flex min-w-0 flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1"><h3 className="text-sm font-extrabold text-foreground">Clinical certifications</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">Add credentials such as BLS, ACLS, BCLS, or PALS. Hospitals may require these for specific shifts; they must be verified by our team before they count toward eligibility.</p></div>
                    {!showCertificateForm && <Button type="button" size="sm" variant="outline" onClick={() => setShowCertificateForm(true)} className="shrink-0 rounded-xl">Add certificate</Button>}
                  </div>
                  {(candidateData?.certifications || []).length > 0 && <div className="mt-4 space-y-2">{candidateData?.certifications?.map((certificate) => {
                    const document = documentsList.find((item) => item.id === certificate.documentId);
                    const reviewLabel = document?.reviewStatus === "VERIFIED" ? "Verified" : document?.reviewStatus === "REJECTED" ? "Update requested" : "Awaiting review";
                    return <div key={certificate.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-muted/30 px-3.5 py-3">
                      <div className="min-w-0"><p className="text-xs font-bold text-foreground">{certificate.name}</p><p className="mt-1 text-[11px] text-muted-foreground">{certificate.issuer}{certificate.credentialId ? ` · ID ${certificate.credentialId}` : ""}{certificate.issueDate ? ` · Issued ${certificate.issueDate}` : ""}{certificate.expiryDate ? ` · Expires ${certificate.expiryDate}` : ""}</p><p className="mt-1 text-[10px] font-semibold text-primary">{reviewLabel}</p></div>
                      {document?.fileUrl && <Button type="button" size="sm" variant="ghost" onClick={() => handlePreviewDocument(document)} className="rounded-lg">View certificate</Button>}
                    </div>;
                  })}</div>}
                  {(candidateData?.certifications || []).length === 0 && !showCertificateForm && <p className="mt-3 rounded-xl bg-muted/30 px-3.5 py-3 text-xs leading-5 text-muted-foreground">No certificates added yet. Upload any current clinical credentials so they can be reviewed before you apply for shifts that require them.</p>}
                  {showCertificateForm && <div className="mt-4 min-w-0 space-y-3 rounded-xl border border-border p-3 sm:p-4">
                    <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                      <label className="min-w-0 space-y-1.5"><span className="block text-xs font-semibold text-foreground">Certificate name *</span><input value={certificateDraft.name} onChange={(event) => setCertificateDraft((value) => ({ ...value, name: event.target.value }))} placeholder="e.g. BLS, ACLS, BCLS" className="box-border block w-full min-w-0 max-w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none" /></label>
                      <label className="min-w-0 space-y-1.5"><span className="block text-xs font-semibold text-foreground">Issuing organization *</span><input value={certificateDraft.issuer} onChange={(event) => setCertificateDraft((value) => ({ ...value, issuer: event.target.value }))} placeholder="e.g. AHA or training provider" className="box-border block w-full min-w-0 max-w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none" /></label>
                      <label className="min-w-0 space-y-1.5"><span className="block text-xs font-semibold text-foreground">Credential ID <span className="font-normal text-muted-foreground">(optional)</span></span><input value={certificateDraft.credentialId} onChange={(event) => setCertificateDraft((value) => ({ ...value, credentialId: event.target.value }))} className="box-border block w-full min-w-0 max-w-full rounded-xl border border-border bg-muted/30 px-3 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none" /></label>
                      <label className="min-w-0 space-y-1.5"><span className="block text-xs font-semibold text-foreground">Certificate file *</span><input ref={certificateFileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleCertificateFileChange} className="block w-full min-w-0 max-w-full text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary" />{certificateFile && <span className="block truncate text-[10px] text-emerald-700">Selected: {certificateFile.name}</span>}{certificateFileError && <span className="block text-[10px] text-destructive">{certificateFileError}</span>}</label>
                      <DateField
                        label="Issue date"
                        className="w-full min-w-0"
                        optional
                        value={certificateDraft.issueDate}
                        max={new Date().toISOString().slice(0, 10)}
                        onChange={(issueDate) => setCertificateDraft((value) => ({
                          ...value,
                          issueDate,
                          expiryDate: issueDate && value.expiryDate && value.expiryDate < issueDate ? "" : value.expiryDate,
                        }))}
                        placeholder="Select issue date"
                      />
                      <DateField
                        label="Expiry date"
                        className="w-full min-w-0"
                        optional
                        value={certificateDraft.expiryDate}
                        min={certificateDraft.issueDate || "1940-01-01"}
                        onChange={(expiryDate) => setCertificateDraft((value) => ({ ...value, expiryDate }))}
                        placeholder="Select expiry date"
                      />
                    </div>
                    <div className="flex flex-wrap justify-end gap-2"><Button type="button" size="sm" variant="ghost" disabled={isSavingCertificate} onClick={() => { setShowCertificateForm(false); setCertificateDraft({ name: "", issuer: "", credentialId: "", issueDate: "", expiryDate: "" }); setCertificateFile(null); setCertificateUploadedDocumentId(null); setCertificateFileError(null); if (certificateFileInputRef.current) certificateFileInputRef.current.value = ""; }} className="rounded-lg">Cancel</Button><Button type="button" size="sm" disabled={isSavingCertificate} onClick={handleSaveCertification} className="rounded-lg">{isSavingCertificate ? <><ButtonSpinner className="mr-2 h-3.5 w-3.5" />Uploading...</> : "Save certificate"}</Button></div>
                  </div>}
                </section>
                {additionalDocuments.length > 0 && <div className="mt-3 rounded-xl border border-border bg-card p-3.5"><p className="text-xs font-bold text-foreground">Other uploaded documents</p><div className="mt-2 space-y-2">{additionalDocuments.map((doc) => <div key={doc.id} className="flex items-center justify-between gap-2 rounded-lg bg-muted/30 px-3 py-2"><div className="min-w-0"><p className="truncate text-xs font-semibold text-foreground">{doc.title}</p><p className="truncate text-[10px] text-muted-foreground">{doc.fileName} · {doc.reviewStatus === "REJECTED" ? "Needs replacement" : doc.reviewStatus === "VERIFIED" ? "Verified" : doc.reviewStatus === "NOT_REQUIRED" ? "Uploaded" : "Under review"}</p></div><div className="flex shrink-0 items-center gap-1">{doc.reviewStatus === "REJECTED" && <Button type="button" size="sm" variant="outline" disabled={isUploading} onClick={() => { setReplacementDocType(doc.type); fileInputRef.current?.click(); }} className="h-8 rounded-lg px-2 text-[10px]">Replace</Button>}{doc.fileUrl && <Button type="button" size="sm" variant="ghost" onClick={() => handlePreviewDocument(doc)} className="h-8 rounded-lg px-2 text-[10px]">View</Button>}</div></div>)}</div></div>}
                {!isStudent && !additionalDocuments.some((doc) => doc.type === "EXPERIENCE_CERTIFICATE" && doc.reviewStatus !== "REJECTED") && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-dashed border-border px-3.5 py-3"><div><p className="text-xs font-semibold text-foreground">Experience certificate <span className="font-normal text-muted-foreground">(optional)</span></p><p className="mt-1 text-[10px] text-muted-foreground">Add this if you have one.</p></div><Button type="button" size="sm" variant="outline" disabled={isUploading} onClick={() => startDocumentUpload("EXPERIENCE_CERTIFICATE")} className="h-8 rounded-lg px-2.5 text-[10px]"><HiOutlineArrowUpTray className="mr-1 h-3.5 w-3.5" />Upload optional document</Button></div>}
              </div>
            </section>
          </div>

          <aside className="grid grid-cols-1 items-stretch gap-5 md:grid-cols-2">

            <section className="flex h-full flex-col rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><h2 className="text-base font-extrabold text-foreground">Work preferences</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Choose where and how you’d like to hear about healthcare opportunities.</p></div>
                <ProfileFieldAction label="work preferences" hasValue={Boolean(preferredCities.length || employmentType || availability || hasExpectedSalary)} onClick={() => openEditSection("openToWork")} />
              </div>
              <div className="mt-3 flex items-center justify-between gap-3"><span className="text-xs font-semibold text-foreground">Open to work</span><Switch checked={openToWork} disabled={availabilityAction.isPending || loading || Boolean(profileError)} onCheckedChange={handleToggleOpenToWork} aria-label="Open to work" className="data-[state=checked]:bg-primary" /></div>
              <p className="mt-2 text-[11px] leading-4 text-muted-foreground">{openToWork ? "On · You’re letting hospitals know you’re open to relevant opportunities." : "Paused · Turn this on when you’re ready to be considered for new opportunities."}</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <div className="flex min-h-[88px] min-w-0 flex-col rounded-2xl bg-muted/40 p-3"><span className="min-h-8 text-[11px] font-semibold leading-4 text-muted-foreground">Preferred locations</span><p className="mt-auto break-words pt-1 text-sm font-bold text-foreground">{preferredCities.join(", ") || "Add locations"}</p></div>
                <div className="flex min-h-[88px] min-w-0 flex-col rounded-2xl bg-muted/40 p-3"><span className="min-h-8 text-[11px] font-semibold leading-4 text-muted-foreground">Employment type</span><p className="mt-auto break-words pt-1 text-sm font-bold text-foreground">{employmentType || "Choose a type"}</p></div>
                <div className="flex min-h-[88px] min-w-0 flex-col rounded-2xl bg-muted/40 p-3"><span className="min-h-8 text-[11px] font-semibold leading-4 text-muted-foreground">Available from</span><p className="mt-auto break-words pt-1 text-sm font-bold text-foreground">{availability || "Set availability"}</p></div>
                <div className="flex min-h-[88px] min-w-0 flex-col rounded-2xl bg-muted/40 p-3"><span className="min-h-8 text-[11px] font-semibold leading-4 text-muted-foreground">Expected monthly salary <span className="font-normal">(optional)</span></span><p className="mt-auto break-words pt-1 text-sm font-bold text-foreground">{salary || "Not provided"}</p></div>
              </div>
            </section>

            <section className="flex h-full flex-col rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h2 className="text-base font-extrabold text-foreground">Contact details</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">Shared with hospitals when you apply or accept contact.</p></div><ProfileFieldAction label="contact details" hasValue={Boolean(email || languages.length)} onClick={() => openEditSection("personal")} /></div>
              <dl className="mt-4 space-y-3 text-sm"><div className="flex min-w-0 items-center gap-2"><HiOutlinePhone className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{mobile || "Phone not added"}</span></div><div className="flex min-w-0 items-center gap-2"><HiOutlineEnvelope className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{email || "Email not added"}</span></div><div className="flex min-w-0 items-center gap-2"><HiOutlineGlobeAsiaAustralia className="h-4 w-4 shrink-0 text-primary" /><span className="truncate">{languages.length ? languages.join(", ") : "Languages not added"}</span></div></dl>
            </section>

          </aside>
        </div>
                {/* ========================================================= */}
                {/* IN-PROFILE SECTION EDIT MODAL (Bottom Drawer on Mobile, Centered Modal on Desktop) */}
                {/* ========================================================= */}
                {activeEditSection && (
                  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
                    <div className="relative w-full max-w-lg rounded-t-3xl border border-border bg-card shadow-2xl sm:rounded-3xl animate-in slide-in-from-bottom-8 sm:slide-in-from-none sm:zoom-in-95 duration-200 max-h-[85vh] sm:max-h-[90vh] overflow-hidden">
                      <div className="max-h-[85vh] min-w-0 overflow-y-auto overscroll-contain p-5 sm:max-h-[90vh] sm:p-6 [scrollbar-gutter:stable]">
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
                              {activeEditSection === "address" && "Edit Name & Location"}
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
                      <div className="min-w-0 space-y-4 text-xs sm:space-y-5">
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
                                <SelectField
                                  label="Profession / Role"
                                  options={professionOptions}
                                  value={editForm.profession}
                                  onChange={(profession) => setEditForm({ ...editForm, profession, specialty: "" })}
                                  placeholder="Select your profession"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <SelectField
                                  label={isStudent ? "Area of interest" : "Specialization"}
                                  optional
                                  options={editForm.profession ? [...specialtyOptions, "Other"] : []}
                                  value={isCustomSpecialty ? "Other" : editForm.specialty}
                                  onChange={(value) => setEditForm({
                                    ...editForm,
                                    specialty: value === "Other"
                                      ? (isCustomSpecialty ? editForm.specialty : "__OTHER__")
                                      : value,
                                  })}
                                  placeholder={editForm.profession ? "Select a specialization" : "Select a profession first"}
                                />
                                {isCustomSpecialty && <input
                                  type="text"
                                  autoFocus
                                  value={editForm.specialty === "__OTHER__" ? "" : editForm.specialty}
                                  onChange={(e) => setEditForm({ ...editForm, specialty: e.target.value })}
                                  placeholder="Enter your specialization"
                                  className="mt-2 w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                                />}
                                <p className="text-[10px] text-muted-foreground">Choose from options for your profession, or select Other to enter your own.</p>
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
                                <p className="text-[10px] leading-4 text-muted-foreground">This is your profile contact email. FALE does not currently verify email addresses.</p>
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">Phone Number</label>
                                <input
                                  type="text"
                                  value={editForm.phone}
                                  readOnly
                                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-muted-foreground"
                                />
                                <p className="text-[10px] text-muted-foreground">Phone changes require account verification.</p>
                              </div>
                            </div>
                            <MultiSelectField
                              label="Languages known"
                              options={["Assamese", "Bengali", "Bodo", "Dogri", "English", "Gujarati", "Hindi", "Kannada", "Kashmiri", "Konkani", "Maithili", "Malayalam", "Manipuri", "Marathi", "Nepali", "Odia", "Punjabi", "Sanskrit", "Santali", "Sindhi", "Tamil", "Telugu", "Urdu"]}
                              value={editForm.languagesText}
                              onChange={(languagesText) => setEditForm((form) => ({ ...form, languagesText }))}
                              itemLabel="language"
                              allowCustom
                              placeholder="Select or search languages"
                              hint="Choose all languages you can use with patients and colleagues. You can also add another language."
                            />
                          </>
                        )}

                        {activeEditSection === "openToWork" && (
                          <>
                            <MultiSelectField
                              label="Preferred work locations"
                              options={indianCities}
                              value={editForm.preferredCitiesText}
                              onChange={(preferredCitiesText) => setEditForm({ ...editForm, preferredCitiesText })}
                              placeholder="Choose one or more cities"
                              hint="Select the cities where you’re open to work."
                            />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                              <SelectField label="Employment type" options={["Full-time", "Part-time", "Contract", "Internship", "Per-shift"]} value={normalizeEmploymentType(editForm.employmentType)} onChange={(employmentType) => setEditForm({ ...editForm, employmentType })} placeholder="Select employment type" />
                              <SelectField label="Availability" options={["Immediately", "Within 15 days", "Within 30 days", "Within 60 days", "Within 90 days"]} value={normalizeAvailability(editForm.availability)} onChange={(availability) => setEditForm({ ...editForm, availability })} placeholder="Select availability" />
                            </div>
                            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 sm:gap-4">
                              <Field label="Minimum monthly salary" optional prefix="₹" type="number" min="1" value={editForm.salaryMinRupees} onChange={(event) => setEditForm({ ...editForm, salaryMinRupees: event.target.value })} placeholder="Leave blank" />
                              <Field label="Maximum monthly salary" optional prefix="₹" type="number" min="1" value={editForm.salaryMaxRupees} onChange={(event) => setEditForm({ ...editForm, salaryMaxRupees: event.target.value })} placeholder="Leave blank" />
                            </div>
                            <p className="text-[10px] leading-4 text-muted-foreground">Expected salary is optional. You can leave both amounts blank.</p>
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
                              className="box-border block w-full min-w-0 max-w-full resize-y rounded-xl border border-border bg-muted/40 p-3 text-xs font-medium text-foreground focus:outline-none focus:border-primary leading-relaxed"
                            />
                          </div>
                        )}

                        {activeEditSection === "licensure" && (
                          <>
                            {!isStudent && <>
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">State Medical / Nursing Council</label>
                                <input type="text" value={editForm.council} onChange={(e) => setEditForm({ ...editForm, council: e.target.value })} className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary" />
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">License / Registration Number</label>
                                <input type="text" value={editForm.regNumber} onChange={(e) => setEditForm({ ...editForm, regNumber: e.target.value })} className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary" />
                              </div>
                            </>}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">{isStudent ? "Course / qualification" : "Primary degree / qualification"}</label>
                                <input
                                  type="text"
                                  value={editForm.qualification}
                                  onChange={(e) => setEditForm({ ...editForm, qualification: e.target.value })}
                                  className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="block text-xs font-bold text-foreground">College / institution</label>
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
                              <label className="block text-xs font-bold text-foreground">Full name</label>
                              <input
                                type="text"
                                autoComplete="name"
                                value={editForm.name}
                                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-foreground">Full Registered Address</label>
                              <textarea
                                rows={3}
                                value={editForm.addressLine}
                                onChange={(e) => {
                                  const nextAddress = e.target.value;
                                  const detectedPincode = extractIndianPincode(nextAddress);
                                  setEditForm((form) => ({
                                    ...form,
                                    addressLine: nextAddress,
                                    pincode: detectedPincode || (extractIndianPincode(form.addressLine) === form.pincode ? "" : form.pincode),
                                  }));
                                }}
                                placeholder="Street, locality, area details..."
                                className="box-border block w-full min-w-0 max-w-full resize-y rounded-xl border border-border bg-muted/40 p-3 text-xs font-medium text-foreground focus:outline-none focus:border-primary leading-relaxed"
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
                              <label className="block text-xs font-bold text-foreground">Experience level</label>
                              <input
                                type="text"
                                value={editForm.experienceYears}
                                onChange={(e) => setEditForm({ ...editForm, experienceYears: e.target.value })}
                                placeholder={isStudent || isFresher ? "Student / fresher" : "e.g. 4 years"}
                                className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-xs font-semibold text-foreground focus:outline-none focus:border-primary"
                              />
                            </div>
                            <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
                              <div><p className="text-xs font-bold text-foreground">{isStudent || isFresher ? "Clinical exposure" : "Work experience"}</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">{isStudent || isFresher ? "Add internships, rotations, or supervised clinical placements." : "Add your recent roles so hospitals can understand your experience."}</p></div>
                              <Button type="button" size="sm" variant="outline" onClick={() => setEditForm((form) => ({ ...form, experienceHistory: [...form.experienceHistory, { id: crypto.randomUUID(), organization: "", title: "", startDate: "", endDate: "", current: false, description: "" }] }))} className="shrink-0 rounded-xl">Add entry</Button>
                            </div>
                            {editForm.experienceHistory.length === 0 && <p className="rounded-xl bg-muted/40 px-3.5 py-3 text-xs leading-5 text-muted-foreground">No experience entries yet. You can add one now or leave this section empty.</p>}
                            <div className="space-y-3">
                              {editForm.experienceHistory.map((experience, index) => <div key={experience.id || index} className="space-y-3 rounded-2xl border border-border p-3.5 sm:p-4">
                                <div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-foreground">Experience {index + 1}</p><button type="button" onClick={() => setEditForm((form) => ({ ...form, experienceHistory: form.experienceHistory.filter((_, itemIndex) => itemIndex !== index) }))} className="text-xs font-semibold text-destructive">Remove</button></div>
                                <div className="grid gap-3 sm:grid-cols-2">
                                  <input value={experience.title} onChange={(event) => setEditForm((form) => ({ ...form, experienceHistory: form.experienceHistory.map((item, itemIndex) => itemIndex === index ? { ...item, title: event.target.value } : item) }))} placeholder="Role or placement title" aria-label="Role or placement title" className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none" />
                                  <input value={experience.organization} onChange={(event) => setEditForm((form) => ({ ...form, experienceHistory: form.experienceHistory.map((item, itemIndex) => itemIndex === index ? { ...item, organization: event.target.value } : item) }))} placeholder="Hospital, clinic, or institution" aria-label="Hospital, clinic, or institution" className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-xs text-foreground focus:border-primary focus:outline-none" />
                                  <label className="space-y-1"><span className="text-[10px] font-semibold text-muted-foreground">From</span><input type="month" value={experience.startDate} onChange={(event) => setEditForm((form) => ({ ...form, experienceHistory: form.experienceHistory.map((item, itemIndex) => itemIndex === index ? { ...item, startDate: event.target.value } : item) }))} className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none" /></label>
                                  <label className="space-y-1"><span className="text-[10px] font-semibold text-muted-foreground">To</span><input type="month" disabled={experience.current} value={experience.endDate || ""} onChange={(event) => setEditForm((form) => ({ ...form, experienceHistory: form.experienceHistory.map((item, itemIndex) => itemIndex === index ? { ...item, endDate: event.target.value } : item) }))} className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-50" /></label>
                                </div>
                                <label className="flex items-center gap-2 text-xs text-foreground"><input type="checkbox" checked={experience.current} onChange={(event) => setEditForm((form) => ({ ...form, experienceHistory: form.experienceHistory.map((item, itemIndex) => itemIndex === index ? { ...item, current: event.target.checked, endDate: event.target.checked ? "" : item.endDate } : item) }))} className="rounded border-border accent-primary" />I currently work or train here</label>
                                <textarea rows={2} value={experience.description || ""} onChange={(event) => setEditForm((form) => ({ ...form, experienceHistory: form.experienceHistory.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) }))} placeholder="Key responsibilities or clinical exposure (optional)" className="box-border block w-full min-w-0 max-w-full resize-y rounded-xl border border-border bg-muted/40 p-3 text-xs text-foreground focus:border-primary focus:outline-none" />
                              </div>)}
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
                              className="box-border block w-full min-w-0 max-w-full resize-y rounded-xl border border-border bg-muted/40 p-3 text-xs font-medium text-foreground focus:outline-none focus:border-primary leading-relaxed"
                            />
                            <div className="flex flex-wrap gap-2">{["Patient assessment", "Patient monitoring", "Emergency care", "Medication administration", "BLS / ACLS", "Wound care", "Clinical documentation"].map((skill) => <button key={skill} type="button" onClick={() => setEditForm((form) => ({ ...form, skillsText: Array.from(new Set([...form.skillsText.split(",").map((item) => item.trim()).filter(Boolean), skill])).join(", ") }))} className="rounded-full border border-border px-2.5 py-1 text-[10px] font-semibold text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft/30 hover:text-primary">+ {skill}</button>)}</div>
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
                {isReferralOpen && (
                  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="referral-title">
                    <div className="w-full max-w-md rounded-3xl border border-border bg-card p-5 shadow-2xl sm:p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 id="referral-title" className="text-lg font-extrabold text-foreground">Refer and earn</h2>
                          <p className="mt-1 text-sm text-muted-foreground">Earn when a friend you invite is hired or completes their first shift.</p>
                        </div>
                        <button type="button" onClick={() => setIsReferralOpen(false)} aria-label="Close" className="rounded-full p-1 text-muted-foreground hover:bg-muted"><HiOutlineXMark className="h-5 w-5" /></button>
                      </div>
                      {referralLoading && <p className="mt-4 text-sm text-muted-foreground">Loading your referral details...</p>}
                      {referralError && <div className="mt-4 rounded-xl border border-destructive/25 bg-destructive/5 p-3 text-xs text-destructive">{referralError}<Button type="button" variant="ghost" size="sm" onClick={() => { setReferralDashboard(null); void openReferralPanel(); }} className="ml-1 h-7 px-2">Retry</Button></div>}
                      {referralDashboard && <>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                        <div className="rounded-xl bg-muted/50 p-2"><strong className="block text-sm font-extrabold text-foreground">{referralDashboard.invitedCount}</strong><span className="text-[10px] text-muted-foreground">Invited</span></div>
                        <div className="rounded-xl bg-muted/50 p-2"><strong className="block text-sm font-extrabold text-foreground">₹{referralDashboard.earnedAmount}</strong><span className="text-[10px] text-muted-foreground">Earned</span></div>
                        <div className="rounded-xl bg-muted/50 p-2"><strong className="block text-sm font-extrabold text-foreground">₹{referralDashboard.paidAmount}</strong><span className="text-[10px] text-muted-foreground">Paid</span></div>
                      </div>
                      <p className="mt-3 rounded-xl border border-primary/15 bg-primary-soft/20 p-3 text-xs leading-relaxed text-muted-foreground">₹{referralDashboard.firstShiftRewardRupees} after a friend completes their first shift, or ₹{referralDashboard.hireRewardRupees} if they are hired. Up to {referralDashboard.monthlyRewardLimit} rewards per month. Paid rewards are recorded after transfer.</p>
                      <div className="mt-3 rounded-2xl border border-border bg-muted/30 p-4">
                        <span className="text-[11px] font-semibold text-muted-foreground">Your referral code</span>
                        <div className="mt-1 flex items-center justify-between gap-3">
                          <strong className="font-mono text-xl tracking-wider text-foreground">{referralCode}</strong>
                          <Button type="button" size="sm" variant="outline" onClick={() => copyToClipboard(referralCode, "Referral code")}>Copy</Button>
                        </div>
                      </div>
                      <a href={`https://wa.me/?text=${encodeURIComponent(referralInviteText)}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex h-10 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary-hover">Invite on WhatsApp</a>
                      <div className="mt-4 max-h-52 space-y-2 overflow-y-auto">
                        <h3 className="text-xs font-bold text-foreground">My referrals</h3>
                        {referralDashboard.referrals.length ? referralDashboard.referrals.map((referral) => <div key={referral.id} className="flex items-center justify-between gap-3 rounded-xl border border-border p-3"><div className="min-w-0"><p className="truncate text-xs font-bold text-foreground">{referral.candidateName}</p><p className="mt-0.5 text-[10px] text-muted-foreground">{referral.status === "JOINED" ? "Joined" : referral.status === "VERIFIED" ? "Verified" : referral.status === "WORKED" ? "Completed first shift" : "Hired"}</p></div><Badge variant="outline" className="shrink-0">{referral.rewardStatus === "PAID" ? `₹${referral.rewardAmount} paid` : referral.rewardStatus === "DUE" ? `₹${referral.rewardAmount} due` : referral.rewardStatus === "HELD" ? "Under review" : referral.status}</Badge></div>) : <p className="rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">No referrals yet. Share your invite link to get started.</p>}
                      </div>
                      </>}
                    </div>
                  </div>
                )}
      </main>
      <DigiLockerModal
        open={showDigiLockerModal}
        onClose={() => setShowDigiLockerModal(false)}
        onSuccess={() => {}}
        candidateName={name}
        candidateMobile={mobile}
      />
    </AppShell>
            );
}
            export default Profile;
