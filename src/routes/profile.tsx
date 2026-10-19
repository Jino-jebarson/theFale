import { useState } from "react";
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

  // Profile data extraction with rich professional healthcare defaults
  const name = String(p["name"] || "Jino Jebarosn R");
  const role = String(p["role"] || "Doctor");
  const specialty = String(p["specialty"] || "Cardiology");
  const city = String(p["city"] || "Chennai");
  const stateName = String(p["state"] || "Tamil Nadu");
  const email = String(p["email"] || "jinovj250@gmail.com");
  const mobile = String(p["mobile"] || "+91 6380102651");
  const council = String(p["council"] || "Tamil Nadu Medical Council");
  const regNo = String(p["regNo"] || "TNMC-2023-8829");
  const regValid = String(p["regValid"] || "Dec 2028");
  const exp = String(p["exp"] || "Fresher");
  const employer = String(p["employer"] || "Madras Medical College & Government General Hospital");
  const qual = String(p["qual"] || "MBBS");
  const institution = String(p["institution"] || "Madras Medical College, Chennai");
  const openToWork = p["openToWork"] !== false;
  const salary = String(p["salary"] || "₹45,000–₹75,000");
  const availability = String(p["availability"] || "Immediate (Within 7 days)");
  const employmentType = String(p["employmentType"] || "Full-time");

  const preferredCities = Array.isArray(p["preferredCity"])
    ? (p["preferredCity"] as string[])
    : p["preferredCity"]
      ? String(p["preferredCity"]).split(", ")
      : ["Chennai", "Bengaluru", "Hyderabad"];

  const skills = Array.isArray(p["skills"]) && (p["skills"] as string[]).length > 0
    ? (p["skills"] as string[])
    : [
        "ECG Interpretation",
        "Bedside Echocardiography",
        "ACLS & BLS Protocols",
        "Central Venous Access",
        "Telemetry Monitoring",
        "Emergency Cardiac Resuscitation",
        "Arterial Blood Gas Analysis",
      ];

  const languages = Array.isArray(p["languages"]) && (p["languages"] as string[]).length > 0
    ? (p["languages"] as string[])
    : ["English", "Tamil", "Hindi"];

  // Default verified documents if none uploaded yet
  const userDocs = Object.keys(s.docs).length > 0
    ? s.docs
    : {
        "MBBS Degree Certificate": "mbbs_degree_verified.pdf",
        "State Medical Council Registration": "tnmc_license_2023.pdf",
        "Government Identity (Aadhaar/Passport)": "gov_identity_verified.pdf",
        "AHA ACLS & BLS Provider Credential": "acls_provider_card.pdf",
      };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const handleToggleOpenToWork = (checked: boolean) => {
    setState({ profile: { ...s.profile, openToWork: checked } });
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

  const handleSimulateUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      const docName = "Clinical Experience & Relieving Certificate";
      const fileName = "experience_certificate_signed.pdf";
      setState({
        docs: {
          ...s.docs,
          [docName]: fileName,
        },
      });
      setIsUploading(false);
      toast.success("Credential Uploaded & Authenticated!", {
        description: "DigiLocker verification seal applied to new document.",
      });
    }, 1000);
  };

  // Sample earned CME courses for the portfolio
  const earnedCmeCourses = courses.slice(0, 3);

  return (
    <AppShell>
      <div className="w-full max-w-5xl mx-auto space-y-4 sm:space-y-6 pb-8 min-w-0">
        {/* ========================================================= */}
        {/* HERO COVER & IDENTITY CARD                                 */}
        {/* ========================================================= */}
        <div className="surface overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 shadow-card w-full min-w-0">
          {/* Cover Banner with Medical Gradient & Tech Grid */}
          <div className="relative h-28 sm:h-44 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-800 p-3 sm:p-6 flex flex-col justify-between overflow-hidden">
            {/* Subtle background tech / grid overlay */}
            <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#ffffff_1.2px,transparent_1.2px)] [background-size:16px_16px]" />
            <div className="absolute -right-16 -top-16 h-48 w-48 sm:h-64 sm:w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="absolute -left-12 -bottom-12 h-36 w-36 sm:h-48 sm:w-48 rounded-full bg-cyan-400/20 blur-xl pointer-events-none" />

            {/* Top row inside cover: Badges & Quick Actions */}
            <div className="relative z-10 flex items-center justify-between gap-1.5 sm:gap-2 min-w-0">
              <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-white backdrop-blur-md border border-white/20 shadow-xs shrink min-w-0 truncate">
                <HiOutlineShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-300 shrink-0" />
                <span className="hidden sm:inline">Tier-1 Verified Practitioner</span>
                <span className="sm:hidden">Tier-1 Verified</span>
              </span>

              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => copyToClipboard(window.location.href, "Profile link")}
                  className="rounded-xl font-bold text-xs bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-xs h-7.5 sm:h-9 px-2 sm:px-3"
                >
                  <HiOutlineShare className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Share</span>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="rounded-xl font-bold text-xs bg-white text-primary hover:bg-white/90 shadow-md h-7.5 sm:h-9 px-2.5 sm:px-3.5"
                >
                  <Link to="/onboarding">
                    <HiOutlinePencilSquare className="h-3.5 w-3.5 sm:mr-1.5" />
                    <span className="hidden sm:inline">Edit Profile</span>
                    <span className="sm:hidden">Edit</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Bottom row inside cover: Hospital Affiliation tag */}
            <div className="relative z-10 hidden sm:flex items-center gap-2 text-xs text-blue-100 font-medium">
              <HiOutlineBuildingOffice2 className="h-4 w-4 text-blue-200" />
              <span className="truncate">{employer}</span>
            </div>
          </div>

          {/* Identity Body Section */}
          <div className="px-4 sm:px-8 pb-5 sm:pb-8">
            <div className="-mt-10 sm:-mt-16 flex items-end justify-between gap-3">
              {/* Avatar with Verified Shield */}
              <div className="relative">
                <div className="relative grid h-20 w-20 sm:h-28 sm:w-28 place-items-center rounded-2xl sm:rounded-3xl border-4 border-card bg-gradient-to-tr from-primary to-blue-500 text-2xl sm:text-4xl font-black text-white shadow-lg">
                  {initials(name)}
                  <span className="absolute -bottom-1 -right-1 grid h-6 w-6 sm:h-7 sm:w-7 place-items-center rounded-full bg-emerald-500 text-white border-2 border-card shadow-xs">
                    <HiCheckCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                  </span>
                </div>
              </div>

              {/* Primary CTA aligned right */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.success("Downloading Clinical Dossier PDF...", {
                    description: `Verified portfolio for ${name} generated.`,
                  });
                }}
                className="rounded-xl font-bold text-xs gap-1.5 border-border/80 h-8 sm:h-9 px-2.5 sm:px-3.5"
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
                <Badge className="bg-primary-soft text-primary font-bold border-primary/20 text-[11px] sm:text-xs px-2 py-0.5">
                  {qual}
                </Badge>
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border-0 text-[11px] sm:text-xs px-2 py-0.5 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  NMC Verified
                </Badge>
              </div>

              <p className="text-xs sm:text-base font-semibold text-muted-foreground flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span>{role} · {specialty}</span>
                <span className="text-border">•</span>
                <span className="text-xs text-primary font-bold">{exp}</span>
              </p>

              {/* Council Registration Summary */}
              <p className="text-[11px] sm:text-xs text-muted-foreground flex items-start sm:items-center gap-1.5 pt-0.5 break-words">
                <HiOutlineIdentification className="h-4 w-4 text-primary shrink-0 mt-0.5 sm:mt-0" />
                <span>{council} • Reg: <strong className="text-foreground font-mono">{regNo}</strong></span>
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
            ? "border-emerald-500/40 bg-gradient-to-br from-card via-card to-emerald-50/40 dark:to-emerald-950/20"
            : "border-border/80 bg-card"
        )}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-1 min-w-0">
              <div className="flex items-center justify-between sm:justify-start gap-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={cn(
                    "h-2.5 w-2.5 rounded-full shrink-0",
                    openToWork ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"
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
                    className="data-[state=checked]:bg-emerald-600 scale-90"
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
                className="data-[state=checked]:bg-emerald-600"
              />
            </div>
          </div>

          {openToWork && (
            <div className="mt-3.5 pt-3.5 border-t border-emerald-500/20 grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 text-xs">
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
                <p className="font-bold text-emerald-600 dark:text-emerald-400">{availability}</p>
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
              <HiOutlineTrophy className="h-4 w-4 text-amber-500 shrink-0" />
            </div>
            <div className="space-y-0.5">
              <div className="text-lg sm:text-2xl font-black text-foreground">18.5 <span className="text-xs font-semibold text-muted-foreground">Pts</span></div>
              <p className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold truncate">AHA & IRC Accredited</p>
            </div>
          </div>

          {/* Card 2: Credential Verification */}
          <div className="surface p-3.5 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-1.5 sm:space-y-2 min-w-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Credentials</span>
              <HiOutlineShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
            </div>
            <div className="space-y-0.5">
              <div className="text-lg sm:text-2xl font-black text-foreground">4 / 4 <span className="text-xs font-semibold text-muted-foreground">Verified</span></div>
              <p className="text-[10px] sm:text-[11px] text-muted-foreground font-semibold truncate">DigiLocker Authenticated</p>
            </div>
          </div>

          {/* Card 3: Profile Completeness */}
          <div className="surface p-3.5 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-1.5 sm:space-y-2 min-w-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Strength</span>
              <HiOutlineSparkles className="h-4 w-4 text-primary shrink-0" />
            </div>
            <div className="space-y-0.5">
              <div className="text-lg sm:text-2xl font-black text-foreground">94% <span className="text-xs font-semibold text-muted-foreground">Ready</span></div>
              <Progress value={94} className="h-1.5 rounded-full mt-1.5" />
            </div>
          </div>

          {/* Card 4: Recruiter Views */}
          <div className="surface p-3.5 sm:p-5 rounded-2xl border border-border/80 shadow-xs space-y-1.5 sm:space-y-2 min-w-0">
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider truncate">Hospital Views</span>
              <HiOutlineEye className="h-4 w-4 text-blue-500 shrink-0" />
            </div>
            <div className="space-y-0.5">
              <div className="text-lg sm:text-2xl font-black text-foreground">48 <span className="text-xs font-semibold text-muted-foreground">Views</span></div>
              <p className="text-[10px] sm:text-[11px] text-primary font-semibold truncate">Top 5% in {city}</p>
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
                <span className="hidden sm:inline">Council & Education</span>
                <span className="sm:hidden">Council</span>
              </TabsTrigger>
              <TabsTrigger
                value="documents"
                className="rounded-none border-b-2 border-transparent px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap"
              >
                <HiOutlineShieldCheck className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Document Vault ({Object.keys(userDocs).length})</span>
                <span className="sm:hidden">Vault ({Object.keys(userDocs).length})</span>
              </TabsTrigger>
              <TabsTrigger
                value="cme"
                className="rounded-none border-b-2 border-transparent px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap"
              >
                <HiOutlineTrophy className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">CME Certificates</span>
                <span className="sm:hidden">CME</span>
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="rounded-none border-b-2 border-transparent px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap"
              >
                <HiOutlineBriefcase className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Shift & Job Preferences</span>
                <span className="sm:hidden">Preferences</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: OVERVIEW & CLINICAL SKILLS */}
          <TabsContent value="overview" className="space-y-4 sm:space-y-6 mt-0 w-full min-w-0">
            {/* Clinical Bio Statement */}
            <div className="surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 space-y-2.5 sm:space-y-3 min-w-0">
              <h3 className="font-extrabold text-sm sm:text-base text-foreground flex items-center gap-2">
                <HiOutlineDocumentCheck className="h-4 w-4 text-primary shrink-0" />
                Clinical Profile & Practice Summary
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
                Dedicated {role} specializing in {specialty}. Trained in acute patient resuscitation, comprehensive bedside diagnostics, and interdisciplinary patient stabilization according to international AHA and Indian Resuscitation Council standards. Actively pursuing continuing medical education and clinical shift practice across NABH-accredited tertiary care centers.
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
                    Clinical Experience
                  </h3>
                  <Badge variant="outline" className="text-xs font-bold shrink-0">{exp}</Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-blue-500/10 text-primary font-bold text-xs">
                      <HiOutlineBuildingOffice2 className="h-5 w-5" />
                    </span>
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-foreground truncate">{specialty} Clinical Post</h4>
                      <p className="text-xs text-muted-foreground break-words">{employer}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                        <HiOutlineClock className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span>Present • Full-time clinical residency</span>
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
                    Academic Degrees
                  </h3>
                  <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0 text-xs font-bold shrink-0">
                    Verified
                  </Badge>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold text-xs">
                      <HiOutlineAcademicCap className="h-5 w-5" />
                    </span>
                    <div className="space-y-1 min-w-0 flex-1">
                      <h4 className="font-bold text-sm text-foreground break-words">{qual} (Bachelor of Medicine & Surgery)</h4>
                      <p className="text-xs text-muted-foreground break-words">{institution}</p>
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                        <HiOutlineCheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span>National Medical Commission Recognized</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 2: COUNCIL & EDUCATION */}
          <TabsContent value="qualifications" className="space-y-4 sm:space-y-6 mt-0 w-full min-w-0">
            <div className="surface p-4 sm:p-7 rounded-2xl sm:rounded-3xl border border-border/80 space-y-4 sm:space-y-6 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 border-b border-border/70 pb-4">
                <div>
                  <span className="rounded-full bg-primary/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-primary">
                    Government Clinical Licensure
                  </span>
                  <h3 className="text-base sm:text-xl font-extrabold text-foreground mt-1.5">
                    State Medical Council Registration
                  </h3>
                </div>
                <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border-0 px-2.5 sm:px-3 py-1 text-xs flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                  <HiCheckCircle className="h-4 w-4 text-emerald-600" />
                  Active & Good Standing
                </Badge>
              </div>

              {/* Council License Showcase Card */}
              <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-card via-card to-blue-50/40 dark:to-blue-950/20 p-4 sm:p-6 space-y-4 min-w-0">
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
                    <p className="text-xs sm:text-sm font-bold text-foreground">{regValid}</p>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <span className="text-muted-foreground font-semibold text-[11px]">Practicing Qualification</span>
                    <p className="text-xs sm:text-sm font-bold text-foreground">{qual} ({specialty})</p>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <span className="text-muted-foreground font-semibold text-[11px]">Verification Standard</span>
                    <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">NMC Schedule 1 Verified</p>
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
                <Button
                  size="sm"
                  onClick={handleSimulateUpload}
                  disabled={isUploading}
                  className="rounded-xl font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/95 text-xs h-9 w-full sm:w-auto"
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
                {Object.entries(userDocs).map(([docTitle, docFile]) => (
                  <div
                    key={docTitle}
                    className="rounded-2xl border border-border/80 bg-card p-3.5 sm:p-5 flex items-start gap-3 shadow-2xs hover:border-primary/40 transition-colors min-w-0"
                  >
                    <span className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                      <HiOutlineDocumentText className="h-5 w-5 sm:h-6 sm:w-6" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="text-xs sm:text-sm font-bold text-foreground truncate">{docTitle}</h4>
                        <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[9px] sm:text-[10px] font-bold shrink-0">
                          Verified
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground truncate mt-0.5 font-mono">{docFile}</p>
                      <div className="mt-2.5 flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            toast.success(`Opening preview for ${docTitle}`);
                          }}
                          className="h-7 text-xs font-semibold rounded-lg px-2 text-muted-foreground hover:text-foreground"
                        >
                          <HiOutlineEye className="mr-1 h-3.5 w-3.5" /> View
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            toast.success(`Downloading ${docFile}`);
                          }}
                          className="h-7 text-xs font-semibold rounded-lg px-2 text-primary hover:bg-primary-soft"
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
                    <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                      FALE Clinical Academy
                    </span>
                    <span className="text-xs text-muted-foreground font-semibold">
                      Total: 18.5 CME Hours
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
                {earnedCmeCourses.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-border/80 bg-gradient-to-br from-card via-card to-blue-50/30 dark:to-blue-950/20 p-4 sm:p-5 space-y-3 shadow-2xs min-w-0"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 font-bold text-primary text-[10px] truncate max-w-[150px]">
                        {c.accreditationBadge}
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[10px] sm:text-[11px] flex items-center gap-1 shrink-0">
                        <HiCheckCircle className="h-3.5 w-3.5" /> +{c.cmeCredits} CME Pts
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
                          toast.success(`Downloading Certificate PDF for ${c.title}...`);
                        }}
                        className="h-7 sm:h-8 text-xs font-bold rounded-xl gap-1 text-primary hover:text-primary hover:bg-primary-soft shrink-0"
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
                    Clinical Career & Shift Preferences
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Hospitals use these matching parameters to propose instant on-call shifts and permanent appointments.
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
                    Target Cities & Hospitals
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
                    Expected Compensation
                  </span>
                  <p className="text-sm sm:text-base font-extrabold text-foreground pt-0.5">{salary} <span className="text-xs font-normal text-muted-foreground">/ month</span></p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">Based on current benchmark for {specialty}</p>
                </div>

                <div className="rounded-2xl border border-border/70 p-3.5 sm:p-4 space-y-1 bg-muted/20 min-w-0">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    Shift Availability
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-foreground pt-0.5">{employmentType} & Rotational</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">Comfortable with Day, Night, and Emergency Trauma coverage</p>
                </div>

                <div className="rounded-2xl border border-border/70 p-3.5 sm:p-4 space-y-1 bg-muted/20 min-w-0">
                  <span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                    Notice Period / Start Date
                  </span>
                  <p className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400 pt-0.5">{availability}</p>
                  <p className="text-[10px] sm:text-[11px] text-muted-foreground">Ready for immediate hospital orientation</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  );
}
