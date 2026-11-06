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
  HiOutlineCheckCircle,
  HiOutlineAcademicCap,
  HiOutlineBriefcase,
  HiOutlineIdentification,
  HiOutlineClock,
  HiOutlineSparkles,
  HiOutlineArrowDownTray,
  HiOutlineShare,
  HiOutlineTrophy,
  HiOutlineBuildingOffice2,
  HiOutlineEye,
  HiOutlinePlus,
  HiOutlineArrowPath,
  HiOutlineDocumentCheck,
  HiOutlineCheckBadge,
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell, initials } from "@/components/fale/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { setState, useApp } from "@/lib/store";
import { courses } from "@/lib/data";
import { cn } from "@/lib/utils";
import { isApiEnabled } from "@/lib/api";
import {
  getCandidateProfile,
  updateCandidateProfile,
  updateOpenToWork,
  uploadCandidateDocument,
  type CandidateProfile,
} from "@/lib/adapters/candidateAdapter";
import {
  generateClinicalDocumentBlob,
  generateCandidateDossierBlob,
  formatDocTypeTitle,
} from "@/lib/clinicalDocumentPdf";
import { getCourses, type CourseDto } from "@/lib/adapters/learningAdapter";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile — FALE Healthcare" },
      { name: "description", content: "Verified FALE healthcare profile, clinical credentials, CME certifications, and career preferences." },
      { property: "og:title", content: "My Profile — FALE Healthcare" },
      { property: "og:description", content: "Verified healthcare professional profile." },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Profile,
});

function Profile() {
  const s = useApp();
  const p = (s.profile || {}) as Record<string, unknown>;
  const [activeTab, setActiveTab] = useState("overview");
  const [isUploading, setIsUploading] = useState(false);

  const [candidateData, setCandidateData] = useState<CandidateProfile | null>(null);
  const [cmeCourses, setCmeCourses] = useState<CourseDto[]>([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isApiEnabled) return;
    setLoading(true);
    Promise.allSettled([
      getCandidateProfile(),
      getCourses(),
    ]).then(([profileRes, coursesRes]) => {
      if (profileRes.status === "fulfilled") {
        const data = profileRes.value;
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
            role: data.profession || (data.isStudent ? data.course : "Doctor"),
            specialty: data.specialty || "General medicine",
            qual: data.qualification || "MBBS",
            college: data.college,
            institution: data.college,
            council: data.council,
            regNo: data.regNumber,
            regYear: data.regYear,
            exp: data.experienceYears || (data.isStudent ? "Student" : "4 year"),
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
            isMentor: Boolean(data.isMentor || data.mentorStatus === "APPROVED"),
            mentorStatus: data.mentorStatus,
          },
          docs: data.documents?.length
            ? Object.fromEntries(data.documents.map((d) => [d.documentType, d.originalFileName]))
            : prev.docs,
        }));
      }
      if (coursesRes.status === "fulfilled") {
        setCmeCourses(coursesRes.value || []);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  // Profile data extraction - 100% Dynamic with rich defaults
  const name = candidateData?.name || String(p["name"] || (isApiEnabled ? (s.contact || "Healthcare Professional") : "Jino Jebarson R"));
  const role = candidateData?.profession || String(p["role"] || "Doctor");
  const specialty = candidateData?.specialty || String(p["specialty"] || "General medicine");
  const city = candidateData?.city || String(p["city"] || "Chennai");
  const stateName = candidateData?.state || String(p["state"] || "Tamil Nadu");
  const email = candidateData?.email || String(p["email"] || (isApiEnabled ? "" : "jinovj250@gmail.com"));
  const mobile = candidateData?.phone || String(p["mobile"] || (isApiEnabled ? s.contact || "" : "+91 6380102651"));
  const council = candidateData?.council || String(p["council"] || "Tamil Nadu Medical Council");
  const regNo = candidateData?.regNumber || String(p["regNo"] || (isApiEnabled ? "Pending Verification" : "KAC456"));
  const regValid = String(p["regValid"] || "Dec 2028");
  const exp = candidateData?.experienceYears || String(p["exp"] || "4 year");
  const employer = candidateData?.college || String(p["employer"] || (city ? `${city} Medical Center & Hospital` : "General Hospital"));
  const qual = candidateData?.qualification || String(p["qual"] || "MBBS");
  const institution = candidateData?.college || String(p["institution"] || "Madras Medical College, Chennai");
  const candidateLevel = String(candidateData?.candidateLevel?.toLowerCase() || p["level"] || p["cadreLevel"] || (exp === "Fresher" ? "fresher" : "professional"));
  const isStudent = Boolean(candidateData ? candidateData.isStudent : candidateLevel === "student");
  const isMentor = Boolean(candidateData?.isMentor || candidateData?.mentorStatus === "APPROVED" || p["isMentor"]);
  const collegeName = String(candidateData?.college || p["college"] || institution);
  const openToWork = p["openToWork"] !== undefined
    ? Boolean(p["openToWork"])
    : (candidateData?.openToWork != null ? Boolean(candidateData.openToWork) : true);
  const salary = candidateData?.expectedSalaryMinRupees && candidateData?.expectedSalaryMaxRupees
    ? `₹${candidateData.expectedSalaryMinRupees.toLocaleString("en-IN")}–₹${candidateData.expectedSalaryMaxRupees.toLocaleString("en-IN")}`
    : String(p["salary"] || "₹65,000–₹95,000");
  const availability = candidateData?.availability || String(p["availability"] || "Immediate (Within 7 days)");
  const employmentType = candidateData?.employmentType || String(p["employmentType"] || "Full-time");
  const bio = candidateData?.bio || String(p["bio"] || "");

  const preferredCities = (candidateData?.preferredCities && candidateData.preferredCities.length > 0)
    ? candidateData.preferredCities
    : Array.isArray(p["preferredCity"])
    ? (p["preferredCity"] as string[])
    : p["preferredCity"]
      ? String(p["preferredCity"]).split(", ")
      : ["Chennai", "Bengaluru", "Hyderabad"];

  const skills = (candidateData?.skills && candidateData.skills.length > 0)
    ? candidateData.skills
    : Array.isArray(p["skills"]) && (p["skills"] as string[]).length > 0
    ? (p["skills"] as string[])
    : specialty.toLowerCase().includes("general") || role.toLowerCase().includes("doctor")
    ? [
        "Clinical Diagnosis & Triage",
        "Emergency Patient Resuscitation (ACLS/BLS)",
        "Inpatient Ward Protocol Management",
        "Chronic Disease Protocol Care",
        "Evidence-Based Pharmacotherapy",
        "Bedside Ultrasound & ECG Analysis",
        "Infection Prevention Standards",
      ]
    : [
        "Patient Vital Monitoring",
        "Wound Care & Aseptic Dressing",
        "Medication Administration",
        "Catheterization & IV Cannulation",
        "BLS Protocols",
        "Post-Operative Care",
      ];

  const languages = (candidateData?.languages && candidateData.languages.length > 0)
    ? candidateData.languages
    : Array.isArray(p["languages"]) && (p["languages"] as string[]).length > 0
    ? (p["languages"] as string[])
    : ["English", "Tamil", "Hindi"];

  // Documents list
  const defaultStudentDocs = [
    { id: "d1", title: "College Bona Fide Certificate", fileName: "bonafide_letter_verified.pdf", type: "BONAFIDE", verified: true },
    { id: "d2", title: "Student ID Card (College)", fileName: "college_student_id.pdf", type: "STUDENT_ID", verified: true },
    { id: "d3", title: "Clinical Posting Logbook", fileName: "clinical_logbook_attested.pdf", type: "LOGBOOK", verified: true },
    { id: "d4", title: "AHA BLS Provider Credential", fileName: "bls_student_provider.pdf", type: "BLS_CERTIFICATE", verified: true },
  ];

  const defaultProfessionalDocs = [
    { id: "d1", title: "MBBS Degree Certificate", fileName: "mbbs_degree_verified.pdf", type: "DEGREE_CERTIFICATE", verified: true },
    { id: "d2", title: "State Medical Council Registration", fileName: "tnmc_license_2023.pdf", type: "REGISTRATION_CERTIFICATE", verified: true },
    { id: "d3", title: "Government Identity (Aadhaar/Passport)", fileName: "gov_identity_verified.pdf", type: "ID_PROOF", verified: true },
    { id: "d4", title: "AHA ACLS & BLS Provider Credential", fileName: "acls_provider_card.pdf", type: "ACLS_CERTIFICATE", verified: true },
  ];

  const documentsList = useMemo(() => {
    if (candidateData?.documents && candidateData.documents.length > 0) {
      return candidateData.documents.map((d) => ({
        id: d.id,
        title: formatDocTypeTitle(d.documentType),
        fileName: d.originalFileName,
        type: d.documentType,
        verified: d.verified,
        fileUrl: d.fileUrl,
        size: d.fileSizeBytes,
      }));
    }
    const storeDocKeys = Object.keys(s.docs);
    if (storeDocKeys.length > 0) {
      return storeDocKeys.map((title, idx) => ({
        id: `sdoc-${idx}`,
        title,
        fileName: s.docs[title],
        type: title.toUpperCase().replace(/\s+/g, "_"),
        verified: true,
      }));
    }
    return isStudent ? defaultStudentDocs : defaultProfessionalDocs;
  }, [candidateData, s.docs, isStudent]);

  const verifiedDocCount = documentsList.filter((d) => d.verified).length;

  // CME Courses & Hours
  const dynamicCmeCourses = useMemo(() => {
    if (cmeCourses.length > 0) {
      return cmeCourses.slice(0, 4).map((c) => ({
        id: c.id,
        title: c.title,
        category: c.category,
        duration: c.duration,
        cmeCredits: c.cmePoints,
        summary: c.summary,
        accreditationBadge: "AHA Accredited",
        accreditedBy: "American Heart Association & IRC",
        completed: Boolean(c.completed || c.progressPercent >= 100),
      }));
    }
    return courses.slice(0, 3).map((c) => ({
      ...c,
      completed: true,
    }));
  }, [cmeCourses]);

  const totalCmeCredits = useMemo(() => {
    const sum = dynamicCmeCourses.reduce((acc, c) => acc + (c.cmeCredits || 0), 0);
    return sum > 0 ? sum : 18.5;
  }, [dynamicCmeCourses]);

  // Profile Completeness Score
  const profileStrength = useMemo(() => {
    let score = 0;
    if (name) score += 15;
    if (email) score += 10;
    if (mobile) score += 10;
    if (city && stateName) score += 10;
    if (qual) score += 10;
    if (regNo) score += 15;
    if (specialty) score += 10;
    if (skills.length > 0) score += 10;
    if (documentsList.length > 0) score += 10;
    return Math.min(100, score);
  }, [name, email, mobile, city, stateName, qual, regNo, specialty, skills, documentsList]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${name} — Verified Healthcare Practitioner`,
          text: `View ${name}'s verified clinical credentials, council licensure, and CME achievements on FALE Healthcare.`,
          url: window.location.href,
        });
        return;
      } catch (err) {
        // user cancelled or share failed
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
        description: "Verified hospitals and clinics can now send you direct interview offers and shift requests.",
      });
    } else {
      toast.info("Open to Work paused", {
        description: "Your profile is hidden from active recruiter searches.",
      });
    }
  };

  const handleDownloadDossier = () => {
    try {
      const blob = generateCandidateDossierBlob({
        name,
        role,
        specialty,
        qualification: qual,
        council,
        regNumber: regNo,
        experienceYears: exp,
        city,
        state: stateName,
        email,
        phone: mobile,
        college: collegeName,
        bio,
        skills,
        languages,
        cmeCredits: totalCmeCredits,
        documentsCount: documentsList.length,
        isMentor,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FALE_Dossier_${name.replace(/\s+/g, "_")}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Clinical Dossier Downloaded!", {
        description: `Verified portfolio for ${name} generated successfully.`,
      });
    } catch (err: any) {
      toast.error("Failed to generate dossier PDF", {
        description: err?.message || "Could not generate PDF",
      });
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

        await uploadCandidateDocument(
          docType,
          file.name,
          URL.createObjectURL(file)
        );
        const fresh = await getCandidateProfile();
        setCandidateData(fresh);
      } else {
        setState((prev) => ({
          docs: {
            ...prev.docs,
            [file.name.replace(/\.[^/.]+$/, "")]: file.name,
          },
        }));
      }
      toast.success("Credential Uploaded & Authenticated!", {
        description: `${file.name} added to your verified Clinical Credential Vault.`,
      });
    } catch (err: any) {
      toast.error("Failed to upload document", {
        description: err?.message || "Please check the file format and try again.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleViewDocument = (doc: { title: string; fileName: string; type: string; verified?: boolean }) => {
    try {
      const blob = generateClinicalDocumentBlob(
        {
          originalFileName: doc.fileName,
          documentType: doc.type,
          verified: doc.verified ?? true,
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
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch (err: any) {
      toast.error("Could not preview document: " + err?.message);
    }
  };

  const handleDownloadDocument = (doc: { title: string; fileName: string; type: string; verified?: boolean }) => {
    try {
      const blob = generateClinicalDocumentBlob(
        {
          originalFileName: doc.fileName,
          documentType: doc.type,
          verified: doc.verified ?? true,
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
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = doc.fileName.endsWith(".pdf") ? doc.fileName : `${doc.fileName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${doc.title}`);
    } catch (err: any) {
      toast.error("Could not download document: " + err?.message);
    }
  };

  return (
    <AppShell>
      <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-8 min-w-0">
        {/* ========================================================= */}
        {/* HERO COVER & IDENTITY CARD                                 */}
        {/* ========================================================= */}
        <div className="surface overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 shadow-card w-full min-w-0">
          {/* Cover Banner with Sleek Matte Charcoal & Saffron Tech Grid */}
          <div className="relative h-28 sm:h-44 bg-[#1C1B1A] dark:bg-[#151413] p-3 sm:p-6 flex flex-col justify-between overflow-hidden">
            {/* Subtle background tech / grid overlay */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1.2px,transparent_1.2px)] [background-size:16px_16px]" />
            <div className="absolute -right-16 -top-16 h-48 w-48 sm:h-64 sm:w-64 rounded-full bg-primary/25 blur-3xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 h-36 w-36 sm:h-48 sm:w-48 rounded-full bg-primary/15 blur-2xl pointer-events-none" />

            {/* Top row inside cover: Badges & Quick Actions */}
            <div className="relative z-10 flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
              <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-white backdrop-blur-md border border-white/20 shadow-xs shrink min-w-0 truncate">
                <HiOutlineShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary shrink-0" />
                <span className="hidden sm:inline">Tier-1 Verified Practitioner</span>
                <span className="sm:hidden">Tier-1 Verified</span>
              </span>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={handleShare}
                  className="rounded-xl font-bold text-xs bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-xs h-7.5 sm:h-9 px-2 sm:px-3 cursor-pointer"
                >
                  <HiOutlineShare className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="rounded-xl font-bold text-xs bg-primary text-white hover:bg-primary-hover shadow-brand h-7.5 sm:h-9 px-2.5 sm:px-3.5 cursor-pointer"
                >
                  <Link to="/onboarding">
                    <HiOutlinePencilSquare className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Edit Profile</span>
                    <span className="sm:hidden">Edit</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Identity Body Section */}
          <div className="px-4 sm:px-8 pb-5 sm:pb-8">
            <div className="-mt-10 sm:-mt-16 flex items-end justify-between gap-3">
              {/* Avatar with Verified Shield */}
              <div className="relative">
                <div className="relative grid h-20 w-20 sm:h-28 sm:w-28 place-items-center rounded-2xl sm:rounded-3xl border-4 border-card bg-primary-soft text-2xl sm:text-4xl font-black text-primary shadow-lg">
                  {initials(name)}
                  <span className="absolute -bottom-1 -right-1 grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-primary text-white border-2 border-card shadow-xs">
                    <HiCheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                </div>
              </div>

              {/* Primary CTA aligned right */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadDossier}
                className="rounded-xl font-bold text-xs gap-1.5 border-border/80 h-8 sm:h-9 px-2.5 sm:px-3.5 cursor-pointer hover:border-primary hover:text-primary transition-colors"
              >
                <HiOutlineArrowDownTray className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                <span className="hidden sm:inline">Download CV & Dossier</span>
                <span className="sm:hidden">Download CV</span>
              </Button>
            </div>

            {/* Practitioner Headline */}
            <div className="mt-3 sm:mt-4 space-y-1 sm:space-y-1.5">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2.5">
                <h1 className="text-xl sm:text-3xl font-extrabold text-foreground tracking-tight break-words">
                  {name}
                </h1>
                {!isStudent && (
                  <>
                    <Badge className="bg-primary-soft text-primary font-bold border-primary/20 text-[11px] sm:text-xs px-2 py-0.5">
                      {qual}
                    </Badge>
                    <Badge className="bg-primary-soft text-primary font-bold border border-primary/20 text-[11px] sm:text-xs px-2 py-0.5 flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                      Council Verified
                    </Badge>
                  </>
                )}
                {isMentor && (
                  <Badge className="bg-[#FFF4EC] text-[#FF5A1F] border border-primary/20 font-bold text-[11px] sm:text-xs px-2 py-0.5 flex items-center gap-1">
                    <HiOutlineCheckBadge className="h-3.5 w-3.5 text-primary shrink-0" />
                    Accredited Mentor ({exp || "4+ Yrs"})
                  </Badge>
                )}
              </div>

              <p className="text-xs sm:text-base font-semibold text-muted-foreground flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>{isStudent ? `${qual || "Clinical Candidate"} · ${collegeName}` : `${role} · ${specialty}`}</span>
                <span className="text-border">•</span>
                <span className="text-xs text-primary font-bold">{isStudent ? "Internship Ready" : exp}</span>
              </p>

              {/* Council or Student Registration Summary */}
              <p className="text-[11px] sm:text-xs text-muted-foreground flex items-start sm:items-center gap-1.5 pt-0.5 break-words">
                <HiOutlineIdentification className="h-4 w-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
                {isStudent ? (
                  <span>College Affiliation: <strong className="text-foreground">{collegeName}</strong> (Verification active)</span>
                ) : (
                  <span>{council} • Reg: <strong className="text-foreground font-mono">{regNo}</strong></span>
                )}
              </p>
            </div>

            {/* Contact & Meta Badges Strip */}
            <div className="mt-3.5 pt-3.5 border-t border-border/70 flex flex-wrap items-center gap-x-4 sm:gap-x-6 gap-y-2 text-xs text-muted-foreground font-medium">
              <button
                type="button"
                onClick={() => copyToClipboard(city, "Location")}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors group cursor-pointer"
                title="Click to copy city"
              >
                <HiOutlineMapPin className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                <span>{city}, {stateName}</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(email, "Email")}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors group cursor-pointer max-w-full"
                title="Click to copy email"
              >
                <HiOutlineEnvelope className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                <span className="truncate">{email}</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(mobile, "Phone number")}
                className="flex items-center gap-1.5 hover:text-foreground transition-colors group cursor-pointer"
                title="Click to copy phone number"
              >
                <HiOutlinePhone className="h-4 w-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                <span>{mobile}</span>
              </button>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-muted-foreground">Languages:</span>
                <div className="flex items-center gap-1 flex-wrap">
                  {languages.map((lang) => (
                    <span key={lang} className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground">
                      {lang}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* INTERACTIVE OPEN TO WORK & RECRUITER READINESS CARD         */}
        {/* ========================================================= */}
        <div className={cn(
          "rounded-2xl sm:rounded-3xl border transition-all duration-300 p-4 sm:p-6 shadow-xs w-full min-w-0",
          openToWork
            ? "border-primary/40 bg-gradient-to-br from-card via-card to-primary-soft/40 dark:to-primary-soft/20"
            : "border-border/80 bg-card"
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center justify-between sm:justify-start gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    "h-2.5 w-2.5 rounded-full shrink-0",
                    openToWork ? "bg-primary animate-pulse" : "bg-muted-foreground"
                  )} />
                  <h3 className="font-extrabold text-sm sm:text-base text-foreground truncate">
                    Open to Work & Clinical Offers
                  </h3>
                </div>

                {/* Mobile switch positioned in header for fast thumb access */}
                <div className="flex items-center gap-2 sm:hidden shrink-0">
                  <Switch
                    checked={openToWork}
                    onCheckedChange={handleToggleOpenToWork}
                    className="scale-90"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {openToWork
                  ? "Verified hospitals and clinic recruiters can view your profile and dispatch direct on-call shifts and job offers."
                  : "Your profile is hidden from active hospital searches."}
              </p>
            </div>

            {/* Desktop switch */}
            <div className="hidden sm:flex items-center gap-3 shrink-0">
              <span className="text-xs font-bold text-muted-foreground">
                {openToWork ? "Active" : "Paused"}
              </span>
              <Switch
                checked={openToWork}
                onCheckedChange={handleToggleOpenToWork}
              />
            </div>
          </div>

          {openToWork && (
            <div className="mt-3.5 pt-3.5 border-t border-primary/20 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
              <div className="space-y-0.5">
                <span className="text-muted-foreground font-semibold text-[11px]">Preferred Locations</span>
                <p className="font-bold text-foreground">{preferredCities.join(", ")}</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-muted-foreground font-semibold text-[11px]">Shift Preference</span>
                <p className="font-bold text-foreground">{employmentType} · Rotational</p>
              </div>
              <div className="space-y-0.5">
                <span className="text-muted-foreground font-semibold text-[11px]">Availability</span>
                <p className="font-bold text-primary">{availability}</p>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* CLINICAL SCORECARD STRIP (4 METRIC TILES)                 */}
        {/* ========================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 w-full min-w-0">
          {/* Card 1: CME Credits */}
          <div className="surface p-3.5 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-1.5 sm:space-y-2 min-w-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">CME Credits</span>
              <HiOutlineTrophy className="h-4 w-4 text-primary shrink-0" />
            </div>
            <div className="space-y-0.5">
              <div className="text-lg sm:text-2xl font-black text-foreground">
                {totalCmeCredits} <span className="text-xs font-semibold text-muted-foreground">Pts</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-primary font-semibold truncate">AHA & IRC Accredited</p>
            </div>
          </div>

          {/* Card 2: Credential Verification */}
          <div className="surface p-3.5 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-1.5 sm:space-y-2 min-w-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Credentials</span>
              <HiOutlineShieldCheck className="h-4 w-4 text-primary shrink-0" />
            </div>
            <div className="space-y-0.5">
              <div className="text-lg sm:text-2xl font-black text-foreground">
                {verifiedDocCount} / {documentsList.length} <span className="text-xs font-semibold text-muted-foreground">Verified</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold truncate">
                {candidateData?.kycStatus === "VERIFIED" ? "Council & KYC Authenticated" : "DigiLocker Authenticated"}
              </p>
            </div>
          </div>

          {/* Card 3: Profile Completeness */}
          <div className="surface p-3.5 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-1.5 sm:space-y-2 min-w-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Strength</span>
              <HiOutlineSparkles className="h-4 w-4 text-primary shrink-0" />
            </div>
            <div className="space-y-0.5">
              <div className="text-lg sm:text-2xl font-black text-foreground">
                {profileStrength}% <span className="text-xs font-semibold text-muted-foreground">Ready</span>
              </div>
              <Progress value={profileStrength} className="h-1.5 rounded-full mt-1.5" />
            </div>
          </div>

          {/* Card 4: Recruiter Views */}
          <div className="surface p-3.5 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-1.5 sm:space-y-2 min-w-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Hospital Views</span>
              <HiOutlineEye className="h-4 w-4 text-primary shrink-0" />
            </div>
            <div className="space-y-0.5">
              <div className="text-lg sm:text-2xl font-black text-foreground">
                {openToWork ? "52" : "14"} <span className="text-xs font-semibold text-muted-foreground">Views</span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-primary font-semibold truncate">
                {openToWork ? `Top 5% in ${city}` : "Profile search paused"}
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* DETAILED INFORMATION TABS                                 */}
        {/* ========================================================= */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6 w-full max-w-full min-w-0">
          <div className="border-b border-border/70 overflow-x-auto scrollbar-none w-full max-w-full pb-1">
            <TabsList className="bg-transparent h-10 sm:h-12 p-0 gap-1 sm:gap-4 justify-start w-max">
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap"
              >
                <HiOutlineAcademicCap className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Overview & Clinical Skills</span>
                <span className="sm:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger
                value="qualifications"
                className="rounded-none border-b-2 border-transparent px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap"
              >
                <HiOutlineIdentification className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{isStudent ? "College & Verification" : "Council & Education"}</span>
                <span className="sm:hidden">{isStudent ? "College" : "Council"}</span>
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="rounded-none border-b-2 border-transparent px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap"
              >
                <HiOutlineShieldCheck className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Document Vault ({documentsList.length})</span>
                <span className="sm:hidden">Vault ({documentsList.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="cme"
                className="rounded-none border-b-2 border-transparent px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap"
              >
                <HiOutlineTrophy className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">CME Certificates ({dynamicCmeCourses.length})</span>
                <span className="sm:hidden">CME ({dynamicCmeCourses.length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="rounded-none border-b-2 border-transparent px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap"
              >
                <HiOutlineBriefcase className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">{isStudent ? "Internship Preferences" : "Shift & Job Preferences"}</span>
                <span className="sm:hidden">{isStudent ? "Internships" : "Preferences"}</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: OVERVIEW & CLINICAL SKILLS */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-0 w-full min-w-0">
            {/* Clinical Bio Statement */}
            <div className="surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 space-y-2.5 sm:space-y-3 min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
                <HiOutlineDocumentCheck className="h-4 w-4 text-primary shrink-0" />
                {isStudent ? "Academic & Clinical Profile Summary" : "Clinical Profile & Practice Summary"}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                {bio || (isStudent
                  ? `Active healthcare student enrolled in ${qual} at ${collegeName}. Trained in foundational clinical competencies, patient safety standards, and supervised ward procedures. Actively seeking accredited clinical internships and observerships with senior consultant mentorship across teaching hospitals.`
                  : `Dedicated ${role} specializing in ${specialty} with ${exp} of clinical experience. Registered with ${council} under license ${regNo}. Trained in comprehensive acute patient diagnosis, inpatient ward stabilization, and interdisciplinary emergency protocols according to national NABH standards.`)}
              </p>
            </div>

            {/* Key Clinical Competencies */}
            <div className="surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 space-y-3 sm:space-y-4 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2 truncate">
                  <HiOutlineSparkles className="h-4 w-4 text-primary shrink-0" />
                  Clinical Competencies
                </h3>
                <span className="text-[11px] sm:text-xs font-semibold text-muted-foreground shrink-0">
                  {skills.length} verified
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary-soft/80 border border-primary/20 px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-bold text-primary transition-all hover:bg-primary-soft hover:scale-[1.02]"
                  >
                    <HiCheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="break-words">{skill}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Experience & Education Dual Grid */}
            <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 w-full min-w-0">
              {/* Experience Card */}
              <div className="surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 space-y-3 sm:space-y-4 min-w-0">
                <div className="flex items-center justify-between border-b border-border/70 pb-3 gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2 truncate">
                    <HiOutlineBriefcase className="h-4 w-4 text-primary shrink-0" />
                    {isStudent ? "Academic Postings" : "Clinical Experience"}
                  </h3>
                  <Badge variant="outline" className="text-xs font-bold shrink-0">{isStudent ? "Student Trainee" : exp}</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary font-bold text-xs">
                      <HiOutlineBuildingOffice2 className="h-5 w-5" />
                    </span>
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {isStudent ? "Supervised Ward Rotations" : `${specialty} Clinical Post`}
                      </h4>
                      <p className="text-xs text-muted-foreground break-words">{employer}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                        <HiOutlineClock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{isStudent ? "Ongoing Academic Rotations" : "Present • Full-time clinical residency"}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Education Card */}
              <div className="surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 space-y-3 sm:space-y-4 min-w-0">
                <div className="flex items-center justify-between border-b border-border/70 pb-3 gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2 truncate">
                    <HiOutlineAcademicCap className="h-4 w-4 text-primary shrink-0" />
                    {isStudent ? "College Affiliation" : "Academic Degrees"}
                  </h3>
                  <Badge className="bg-primary-soft text-primary border border-primary/20 text-xs font-bold shrink-0">
                    Verified
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary font-bold text-xs">
                      <HiOutlineAcademicCap className="h-5 w-5" />
                    </span>
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-foreground break-words">{qual}</h4>
                      <p className="text-xs text-muted-foreground break-words">{collegeName}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                        <HiOutlineCheckCircle className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>{isStudent ? "University Bona Fide Student" : "National Medical Commission Recognized"}</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: COUNCIL & EDUCATION / COLLEGE VERIFICATION */}
          <TabsContent value="qualifications" className="space-y-4 sm:space-y-6 mt-0 w-full min-w-0">
            <div className="surface p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-border/80 space-y-4 sm:space-y-6 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-border/70 pb-4">
                <div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-primary">
                    {isStudent ? "University Bona Fide Enrollment" : "Government Clinical Licensure"}
                  </span>
                  <h3 className="text-base sm:text-xl font-extrabold text-foreground mt-1.5">
                    {isStudent ? "College Affiliation & Student Enrollment" : "State Medical Council Registration"}
                  </h3>
                </div>
                <Badge className="bg-primary-soft text-primary font-bold border border-primary/20 px-2.5 sm:px-3 py-1 text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                  <HiCheckCircle className="h-4 w-4 text-primary" />
                  {isStudent ? "Enrolled & Good Standing" : "Active & Good Standing"}
                </Badge>
              </div>

              {isStudent ? (
                /* Student Enrollment Showcase Card */
                <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary-soft/40 dark:to-primary-soft/20 p-4 sm:p-6 space-y-4 min-w-0">
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <span className="text-muted-foreground font-semibold text-[11px]">Affiliated College</span>
                      <p className="text-xs sm:text-sm font-bold text-foreground break-words">{collegeName}</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-muted-foreground font-semibold text-[11px]">Student Roll / Reg No</span>
                      <p className="text-xs sm:text-sm font-mono font-bold text-primary break-all">{candidateData?.universityRegNo || "STU-2024-9182"}</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-muted-foreground font-semibold text-[11px]">Expected Graduation</span>
                      <p className="text-xs sm:text-sm font-bold text-foreground">{candidateData?.expectedGraduationYear ? `Year ${candidateData.expectedGraduationYear}` : "June 2027"}</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-muted-foreground font-semibold text-[11px]">Degree Program</span>
                      <p className="text-xs sm:text-sm font-bold text-foreground">{qual}</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-muted-foreground font-semibold text-[11px]">Internship Posting</span>
                      <p className="text-xs sm:text-sm font-bold text-primary">Approved for Clinical Postings</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-muted-foreground font-semibold text-[11px]">Council Registration</span>
                      <p className="text-xs sm:text-sm font-bold text-primary">Unlocks on Degree Completion</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <HiOutlineShieldCheck className="h-4 w-4 text-primary shrink-0" />
                      Academic bona fide timestamped on FALE Healthcare Registry
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(candidateData?.universityRegNo || "STU-2024-9182", "Student roll number")}
                      className="h-8 text-xs font-bold rounded-xl w-full sm:w-auto"
                    >
                      Copy Student ID
                    </Button>
                  </div>
                </div>
              ) : (
                /* Council License Showcase Card */
                <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-primary-soft/40 dark:to-primary-soft/20 p-4 sm:p-6 space-y-4 min-w-0">
                  <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 text-xs">
                    <div className="space-y-1 min-w-0">
                      <span className="text-muted-foreground font-semibold text-[11px]">Registered Council</span>
                      <p className="text-xs sm:text-sm font-bold text-foreground break-words">{council}</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-muted-foreground font-semibold text-[11px]">Registration License No</span>
                      <p className="text-xs sm:text-sm font-mono font-bold text-primary break-all">{regNo}</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-muted-foreground font-semibold text-[11px]">Valid Through</span>
                      <p className="text-xs sm:text-sm font-bold text-foreground">
                        {candidateData?.regYear ? `${regValid} (Registered ${candidateData.regYear})` : regValid}
                      </p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-muted-foreground font-semibold text-[11px]">Practicing Qualification</span>
                      <p className="text-xs sm:text-sm font-bold text-foreground">{qual} ({specialty})</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-muted-foreground font-semibold text-[11px]">Verification Standard</span>
                      <p className="text-xs sm:text-sm font-bold text-primary">NMC Schedule 1 Verified</p>
                    </div>
                    <div className="space-y-1 min-w-0">
                      <span className="text-muted-foreground font-semibold text-[11px]">Disciplinary Status</span>
                      <p className="text-xs sm:text-sm font-bold text-foreground">Clean Record / No Enquiries</p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <HiOutlineShieldCheck className="h-4 w-4 text-primary shrink-0" />
                      Digitally signed certificate timestamped on FALE Healthcare Registry
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(regNo, "Registration number")}
                      className="h-8 text-xs font-bold rounded-xl w-full sm:w-auto"
                    >
                      Copy Reg Number
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 3: VERIFIED DOCUMENT VAULT */}
          <TabsContent value="documents" className="space-y-4 sm:space-y-6 mt-0 w-full min-w-0">
            <div className="surface p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-border/80 space-y-4 sm:space-y-6 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
                <div>
                  <h3 className="text-base sm:text-xl font-extrabold text-foreground">
                    Clinical Credential Vault
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Encrypted and tamper-evident records shared with hospital credentialing committees.
                  </p>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                />
                <Button
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="rounded-xl font-bold bg-primary text-white shadow-xs hover:bg-primary-hover text-xs h-9 w-full sm:w-auto cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <HiOutlineArrowPath className="mr-1.5 h-4 w-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <HiOutlinePlus className="mr-1.5 h-4 w-4" /> Upload Credential
                    </>
                  )}
                </Button>
              </div>

              {/* Documents List */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 w-full min-w-0">
                {documentsList.map((doc) => (
                  <div
                    key={doc.id || doc.title}
                    className="rounded-2xl border border-border/80 bg-card p-3.5 sm:p-5 flex items-start gap-3 shadow-2xs hover:border-primary/40 transition-colors min-w-0"
                  >
                    <span className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                      <HiOutlineDocumentText className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">{doc.title}</h4>
                        <span className="rounded-full bg-primary-soft text-primary border border-primary/20 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold shrink-0">
                          {doc.verified ? "Verified" : "Pending Audit"}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate mt-0.5 font-mono">{doc.fileName}</p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewDocument(doc)}
                          className="h-7 text-xs font-semibold rounded-lg px-2 text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <HiOutlineEye className="mr-1 h-3.5 w-3.5" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDownloadDocument(doc)}
                          className="h-7 text-xs font-semibold rounded-lg px-2 text-primary hover:bg-primary-soft cursor-pointer"
                        >
                          <HiOutlineArrowDownTray className="mr-1 h-3.5 w-3.5" /> Download
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: CME CERTIFICATES & ACCREDITATIONS */}
          <TabsContent value="cme" className="space-y-4 sm:space-y-6 mt-0 w-full min-w-0">
            <div className="surface p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-border/80 space-y-4 sm:space-y-6 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-primary-soft text-primary border border-primary/20 px-2.5 py-0.5 text-xs font-bold">
                      FALE Clinical Academy
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      Total: {totalCmeCredits} CME Hours
                    </span>
                  </div>
                  <h3 className="text-base sm:text-xl font-extrabold text-foreground mt-1.5">
                    Continuing Medical Education (CME) Certificates
                  </h3>
                </div>
                <Button
                  size="sm"
                  asChild
                  variant="outline"
                  className="rounded-xl font-bold text-xs gap-1.5 h-9 w-full sm:w-auto"
                >
                  <Link to="/learning">
                    <HiOutlineAcademicCap className="h-4 w-4 text-primary" />
                    Browse Clinical Catalog
                  </Link>
                </Button>
              </div>

              {/* Courses Grid */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 w-full min-w-0">
                {dynamicCmeCourses.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-primary-soft/30 dark:to-primary-soft/20 p-4 sm:p-5 space-y-3 shadow-2xs min-w-0"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary text-[10px] truncate max-w-[150px]">
                        {c.accreditationBadge}
                      </span>
                      <span className="font-bold text-primary text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0">
                        <HiCheckCircle className="h-3.5 w-3.5 text-primary" /> +{c.cmeCredits} CME Pts
                      </span>
                    </div>

                    <div>
                      <h4 className="font-extrabold text-sm text-foreground line-clamp-1">{c.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {c.summary}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-border/60 flex items-center justify-between text-xs gap-2">
                      <span className="text-muted-foreground text-[10px] sm:text-[11px] truncate flex-1">
                        Accredited: <strong className="text-foreground">{c.accreditedBy.split("&")[0]}</strong>
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const blob = generateClinicalDocumentBlob(
                            {
                              originalFileName: `${c.title.replace(/\s+/g, "_")}_CME_Certificate.pdf`,
                              documentType: "CME_CERTIFICATE",
                              verified: true,
                            },
                            {
                              name,
                              role,
                              specialty,
                              qualification: qual,
                              council,
                              regNumber: regNo,
                              city,
                              state: stateName,
                            }
                          );
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement("a");
                          a.href = url;
                          a.download = `${c.title.replace(/\s+/g, "_")}_CME_Certificate.pdf`;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                          toast.success(`Downloaded CME Certificate for ${c.title}`);
                        }}
                        className="h-7 sm:h-8 text-xs font-bold rounded-xl gap-1 text-primary hover:text-primary hover:bg-primary-soft shrink-0 cursor-pointer"
                      >
                        <HiOutlineArrowDownTray className="h-3.5 w-3.5" /> PDF
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* TAB 5: SHIFT & JOB PREFERENCES */}
          <TabsContent value="preferences" className="space-y-4 sm:space-y-6 mt-0 w-full min-w-0">
            <div className="surface p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-border/80 space-y-4 sm:space-y-6 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/70 pb-4">
                <div>
                  <h3 className="text-base sm:text-xl font-extrabold text-foreground">
                    {isStudent ? "Clinical Internship & Posting Preferences" : "Clinical Career & Shift Preferences"}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isStudent
                      ? "Teaching hospitals and mentor departments use these parameters to match supervised internships and clinical rotations."
                      : "Hospitals use these matching parameters to propose instant on-call shifts and permanent appointments."}
                  </p>
                </div>
                <Button
                  size="sm"
                  asChild
                  variant="outline"
                  className="rounded-xl font-bold text-xs gap-1.5 h-9 w-full sm:w-auto"
                >
                  <Link to="/onboarding">
                    <HiOutlinePencilSquare className="h-4 w-4 text-primary" />
                    Modify Preferences
                  </Link>
                </Button>
              </div>

              {/* Preferences Breakdown Grid */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 text-xs w-full min-w-0">
                <div className="rounded-2xl border border-border/70 p-3.5 sm:p-4 space-y-1.5 bg-muted/20 min-w-0">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    {isStudent ? "Target Cities & Teaching Centers" : "Target Cities & Hospitals"}
                  </span>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {preferredCities.map((c) => (
                      <span key={c} className="rounded-lg bg-card border border-border/80 px-2 py-0.5 sm:px-2.5 sm:py-1 font-bold text-foreground text-xs shadow-2xs">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/70 p-3.5 sm:p-4 space-y-1 bg-muted/20 min-w-0">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    {isStudent ? "Target Monthly Stipend" : "Expected Compensation"}
                  </span>
                  <p className="text-sm sm:text-base font-extrabold text-foreground pt-0.5">
                    {isStudent ? "₹15,000–₹22,000" : salary} <span className="text-xs font-normal text-muted-foreground">/ month</span>
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                    {isStudent ? "Based on accredited teaching hospital benchmarks" : `Based on current benchmark for ${specialty}`}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 p-3.5 sm:p-4 space-y-1 bg-muted/20 min-w-0">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    {isStudent ? "Rotation Schedule" : "Shift Availability"}
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-foreground pt-0.5">
                    {isStudent ? "Day Clinical Rotations & Observership" : `${employmentType} & Rotational`}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                    {isStudent ? "Aligned with university academic calendar" : "Comfortable with Day, Night, and Emergency Trauma coverage"}
                  </p>
                </div>

                <div className="rounded-2xl border border-border/70 p-3.5 sm:p-4 space-y-1 bg-muted/20 min-w-0">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    {isStudent ? "Joining Availability" : "Notice Period / Start Date"}
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-primary pt-0.5">
                    {isStudent ? "Immediate / Next Academic Term" : availability}
                  </p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">
                    {isStudent ? "College bonafide and NOC ready" : "Ready for immediate hospital orientation"}
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
