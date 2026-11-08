import { useState, useEffect, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  HiOutlineShieldCheck,
  HiOutlineMapPin,
  HiOutlineMagnifyingGlass,
  HiOutlineDocumentText,
  HiOutlineArrowDownTray,
  HiOutlineEye,
  HiOutlineAcademicCap,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiCheck,
  HiXMark,
  HiOutlineSparkles,
  HiOutlineBriefcase,
  HiOutlineBolt,
  HiOutlineClock,
} from "react-icons/hi2";
import { toast } from "sonner";
import { BotMessageSquare } from "lucide-react";
import { AppShell, StatusBadge, initials } from "@/components/fale/AppShell";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { applicants, jobs, type Applicant } from "@/lib/data";
import { calculateClinicalMatch } from "@/lib/clinicalMatchingEngine";
import { useApp } from "@/lib/store";
import { LottieAnimation } from "@/components/fale/LottieAnimation";
import lottieEmptyAnimation from "@/assets/lottie-error.json";
import { cn } from "@/lib/utils";
import { isApiEnabled } from "@/lib/api";
import { getFacilityApplicants, updateApplicantStatus } from "@/lib/adapters/facilityAdapter";
import {
  generateInterviewQuestionsWithAi,
  summarizeCandidateWithAi,
} from "@/lib/adapters/aiAdapter";

export const Route = createFileRoute("/employer/applicants")({
  head: () => ({
    meta: [
      { title: "Shortlisted Clinicians - FALE" },
      {
        name: "description",
        content:
          "Review council-verified healthcare professionals shortlisted for your open roles.",
      },
      { property: "og:title", content: "Shortlisted Clinicians - FALE" },
      {
        property: "og:description",
        content: "Review council-verified shortlisted candidates.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Applicants,
});

function mapBackendStatusToUi(s?: string): string {
  switch (s?.toUpperCase()) {
    case "INTERVIEW":
    case "INTERVIEW_SCHEDULED":
      return "Interview";
    case "OFFER":
    case "OFFERED":
      return "Offer";
    case "CONFIRMED":
      return "Confirmed";
    case "COMPLETED":
      return "Completed";
    case "HIRED":
    case "ACCEPTED":
    case "PLACED":
      return "Hired";
    case "REJECTED":
    case "DECLINED":
    case "NOT_SELECTED":
      return "Rejected";
    case "POSITION_FILLED":
      return "Position Filled";
    case "TIMESHEET_SUBMITTED":
      return "Timesheet Submitted";
    case "CLAIMED":
    case "CLAIM_PENDING_ADMIN":
      return "Claimed";
    case "SLOT_FILLED":
    case "CAPACITY_REACHED":
      return "Slot Filled";
    case "NEW":
    case "APPLIED":
    case "PENDING":
    case "PENDING_SCREENING":
    case "UNDER_REVIEW":
    case "UNDER_SCREENING":
      return "New";
    case "SHORTLISTED":
    default:
      return "Shortlisted";
  }
}

const REJECTION_PRESETS = [
  "Interview performance",
  "Lacks required clinical / ICU experience",
  "Council registration / credential mismatch",
  "Compensation / notice period mismatch",
  "Candidate withdrew / unresponsive",
  "Other",
] as const;

function Applicants() {
  const s = useApp();
  const [roleTypeTab, setRoleTypeTab] = useState<"all" | "jobs" | "shifts">("all");
  const [filter, setFilter] = useState("All");
  const [selectedRole, setSelectedRole] = useState("All");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Record<string, string>>({});
  const [selectedResume, setSelectedResume] = useState<Applicant | null>(null);

  // Decline with notes state
  const [rejectCandidate, setRejectCandidate] = useState<Applicant | null>(null);
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [rejectionReasonPreset, setRejectionReasonPreset] = useState<string>("Interview performance");
  const [submittingReject, setSubmittingReject] = useState(false);

  // Dynamic API state
  const [apiApplicants, setApiApplicants] = useState<any[]>([]);
  const [loading, setLoading] = useState(isApiEnabled);

  const fetchApplicants = () => {
    if (!isApiEnabled) return;
    getFacilityApplicants()
      .then((data) => {
        setApiApplicants(data);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("fale:applications-updated"));
        }
      })
      .catch(() => {
        setApiApplicants([]);
      });
  };

  useEffect(() => {
    if (!isApiEnabled) return;
    setLoading(true);
    getFacilityApplicants()
      .then((data) => {
        setApiApplicants(data);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("fale:applications-updated"));
        }
      })
      .catch(() => {
        setApiApplicants([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // Merge live status overrides with applicant records + admin shortlisted applications
  const allApplicants = useMemo(() => {
    if (isApiEnabled) {
      return apiApplicants.map((a: any) => {
        const candidateRole =
          a.candidateRole ||
          a.profession ||
          a.course ||
          (a.jobTitle ? a.jobTitle.replace(/ \(Locum Shift\)/i, "") : "Clinician");

        const candidateExp =
          a.candidateExperience ||
          a.exp ||
          (a.councilVerified ? "Council Registered" : "Fresher");

        const candidateCity = a.candidateCity || a.city || "Chennai";

        const candidateQual =
          a.candidateQualification ||
          (candidateRole.toLowerCase().includes("doctor")
            ? "MBBS"
            : candidateRole.toLowerCase().includes("nurse")
            ? "B.Sc Nursing"
            : "Certified Clinician");

        const councilName = a.candidateCouncil || "State Medical Council";
        const regNum =
          a.regNumber ||
          (a.councilVerified ? "Council Verified" : "Registration Pending");

        // Dynamic clinical skill chips based on role and job assignment
        const derivedSkills = (() => {
          if (a.skills && a.skills.length > 0) return a.skills;
          const r = (candidateRole + " " + (a.jobTitle || "")).toLowerCase();
          if (r.includes("dialysis") || r.includes("technician")) {
            return ["Dialysis Protocols", "Hemodialysis Machine Ops", "Patient Monitoring"];
          }
          if (r.includes("nurse") || r.includes("scrub") || r.includes("ot")) {
            return ["Surgical Scrubbing", "Sterilization Protocols", "Patient Safety"];
          }
          if (r.includes("pharmacist")) {
            return ["Clinical Dispensing", "Pharmacovigilance", "Inventory Management"];
          }
          return ["Clinical Protocols", "Inpatient Care", "Emergency Assessment"];
        })();

        const dynamicBio =
          a.candidateBio ||
          `${candidateExp} experienced ${candidateRole} registered with ${councilName}. Proven track record in patient safety, clinical protocol adherence, and emergency intervention.`;

        const uiStatus = status[a.id] ?? mapBackendStatusToUi(a.status);

        const targetJob = jobs.find(
          (j) => j.id === a.jobId || j.title.toLowerCase() === (a.jobTitle || "").toLowerCase()
        );

        const clinicalMatch = calculateClinicalMatch(
          {
            role: candidateRole,
            profession: candidateRole,
            specialty:
              a.candidateSpecialty ||
              (candidateRole.toLowerCase().includes("doctor") ? "General medicine" : candidateRole),
            qualification: candidateQual,
            city: candidateCity,
            state: a.candidateState || "Tamil Nadu",
            relocate: false,
            kycStatus: a.councilVerified ? "VERIFIED" : "PENDING",
            experienceYears: candidateExp,
          },
          {
            title: a.jobTitle || targetJob?.title || "Healthcare Opening",
            dept: a.department || targetJob?.dept || "Clinical Department",
            city: a.city || targetJob?.city || "Bengaluru",
            qualification: targetJob?.qualification || "State Council Registration Required",
            tags: targetJob?.tags || [targetJob?.dept || "Cardiology", "NABH Accredited", "State Council Registration Required"],
            exp: targetJob?.exp || "2-5 yrs",
          }
        );

        const derivedMatch =
          (s.adminApplications || []).find(
            (adm) => adm.id === a.id || (adm.candidateName && adm.candidateName === a.candidateName)
          )?.matchScore ||
          clinicalMatch?.score ||
          76;

        return {
          id: a.id,
          name: a.candidateName || "Candidate",
          role: candidateRole,
          exp: candidateExp,
          city: candidateCity,
          for: a.jobTitle || "Clinical Role",
          status: uiStatus,
          verified: a.councilVerified !== false,
          match: derivedMatch,
          appliedDate: a.appliedAt
            ? new Date(a.appliedAt).toLocaleDateString("en-IN", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              })
            : "Recent",
          currentOrg: a.currentOrg || "Clinical Healthcare Partner",
          qualification: candidateQual,
          regNumber: regNum,
          skills: derivedSkills,
          noticePeriod: a.candidateNoticePeriod || "Immediate / 15 Days",
          expectedSalary: a.expectedSalary || "Standard Escrow Scale",
          phone: a.candidatePhone || a.phone || "+91 ***** *****",
          email: a.candidateEmail || a.email || "*****@fale.care",
          bio: dynamicBio,
          education: `${candidateQual} | ${councilName}`,
          certifications: [
            a.councilVerified !== false ? "Council Verified" : "Verification in Progress",
            "BLS / ACLS Certified",
            "NABH Clinical Protocols",
          ],
          experienceList: [
            {
              hospital: "Accredited Healthcare Partner",
              role: candidateRole,
              duration: candidateExp,
              details:
                "Direct patient care, clinical assessment, bedside monitoring, and multidisciplinary care coordination.",
            },
          ],
          resumeUrl: a.resumeUrl || undefined,
          resumeFileName: a.resumeFileName || undefined,
          isShiftClaim: Boolean(a.isShiftClaim || a.shiftId || (a.jobTitle && a.jobTitle.toLowerCase().includes("shift"))),
          actualHours: a.actualHours || undefined,
          scheduledHours: a.scheduledHours || 8,
          hourlyRate: a.hourlyRatePaise ? Math.round(a.hourlyRatePaise / 100) : (a.hourlyRate || 500),
          candidateDocuments: a.candidateDocuments || [],
        };
      });
    }

    // Dynamically pull candidates shortlisted by Admin
    const adminShortlistedConverted: Applicant[] = (s.adminApplications || [])
      .filter((a) => a.status === "shortlisted")
      .map((a) => {
        const isShift = Boolean(a.isShiftClaim || a.jobTitle?.toLowerCase().includes("shift"));
        return {
          id: a.id,
          name: a.candidateName,
          role: a.candidateRole,
          exp: a.exp,
          city: a.candidateCity,
          for: a.jobTitle,
          status: "Shortlisted",
          verified: a.councilVerified,
          match: a.matchScore || 76,
          appliedDate: a.appliedDate,
          qualification: "MBBS / MD / Certified Clinician",
          regNumber: a.regNumber || "Council Verified",
          skills: ["Clinical Care", "ICU / Emergency Protocols", "Patient Safety"],
          phone: a.phone || "+91 98401 23456",
          email: a.email || "candidate@fale.care",
          bio: a.summary || "Pre-screened and council-verified clinical professional.",
          isShiftClaim: isShift,
        };
      });

    const existingIds = new Set(adminShortlistedConverted.map((a) => a.id));
    const combined = [
      ...adminShortlistedConverted,
      ...applicants.filter((a) => !existingIds.has(a.id)),
    ];

    return combined.map((a) => {
      const isShift = Boolean(a.isShiftClaim || a.for?.toLowerCase().includes("shift"));
      return {
        ...a,
        isShiftClaim: isShift,
        status: status[a.id] ?? a.status,
      };
    });
  }, [isApiEnabled, apiApplicants, s.adminApplications, status]);

  // Overall counts for Permanent Roles vs Locum Shifts
  const permanentCount = useMemo(
    () => allApplicants.filter((a) => !a.isShiftClaim && !a.for?.toLowerCase().includes("shift")).length,
    [allApplicants]
  );

  const shiftCount = useMemo(
    () => allApplicants.filter((a) => a.isShiftClaim || a.for?.toLowerCase().includes("shift")).length,
    [allApplicants]
  );

  // Applicants scoped to active Role Type ("all" | "jobs" | "shifts")
  const applicantsInRoleType = useMemo(() => {
    return allApplicants.filter((a) => {
      const isShift = Boolean(a.isShiftClaim || a.for?.toLowerCase().includes("shift"));
      if (roleTypeTab === "jobs" && isShift) return false;
      if (roleTypeTab === "shifts" && !isShift) return false;
      return true;
    });
  }, [allApplicants, roleTypeTab]);

  // Unique roles for custom Select scoped to active view
  const roles = useMemo(() => {
    const set = new Set(applicantsInRoleType.map((a) => a.role));
    return ["All", ...Array.from(set)];
  }, [applicantsInRoleType]);

  // Counts by stage scoped to active view
  const counts = useMemo(() => {
    return {
      All: applicantsInRoleType.length,
      New: applicantsInRoleType.filter((a) => a.status === "New").length,
      Shortlisted: applicantsInRoleType.filter((a) => a.status === "Shortlisted").length,
      Claimed: applicantsInRoleType.filter((a) => a.status === "Claimed").length,
      Confirmed: applicantsInRoleType.filter((a) => a.status === "Confirmed").length,
      Interview: applicantsInRoleType.filter((a) => a.status === "Interview").length,
      Offer: applicantsInRoleType.filter((a) => a.status === "Offer").length,
      Hired: applicantsInRoleType.filter((a) => a.status === "Hired").length,
      Rejected: applicantsInRoleType.filter((a) => a.status === "Rejected").length,
      TimesheetSubmitted: applicantsInRoleType.filter((a) => a.status === "Timesheet Submitted").length,
      SlotFilled: applicantsInRoleType.filter((a) => a.status === "Slot Filled").length,
      PositionFilled: applicantsInRoleType.filter((a) => a.status === "Position Filled").length,
    };
  }, [applicantsInRoleType]);

  // Dynamic filter tabs based on role type
  const filterTabs = useMemo(() => {
    if (roleTypeTab === "shifts") {
      const list = ["All"];
      if (counts.Claimed > 0) list.push("Claimed");
      if (counts.Shortlisted > 0) list.push("Shortlisted");
      if (counts.Confirmed > 0) list.push("Confirmed");
      if (counts.TimesheetSubmitted > 0) list.push("Timesheet Submitted");
      if (counts.Hired > 0) list.push("Hired");
      if (counts.Rejected > 0) list.push("Rejected");
      if (counts.SlotFilled > 0) list.push("Slot Filled");
      return list;
    }
    const list = ["All", "New", "Shortlisted"];
    if (counts.Claimed > 0) list.push("Claimed");
    if (counts.Confirmed > 0) list.push("Confirmed");
    if (counts.TimesheetSubmitted > 0) list.push("Timesheet Submitted");
    list.push("Interview");
    if (counts.Offer > 0) list.push("Offer");
    if (counts.Hired > 0) list.push("Hired");
    if (counts.Rejected > 0) list.push("Rejected");
    if (counts.SlotFilled > 0) list.push("Slot Filled");
    if (counts.PositionFilled > 0) list.push("Position Filled");
    return list;
  }, [counts, roleTypeTab]);

  // Filtered candidate list
  const filteredList = useMemo(() => {
    return applicantsInRoleType.filter((a) => {
      if (filter !== "All" && a.status !== filter) return false;
      if (selectedRole !== "All" && a.role !== selectedRole) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = a.name.toLowerCase().includes(q);
        const matchRole = a.role.toLowerCase().includes(q);
        const matchCity = a.city.toLowerCase().includes(q);
        const matchFor = a.for.toLowerCase().includes(q);
        const matchSkills = a.skills?.some((s) => s.toLowerCase().includes(q));
        if (!matchName && !matchRole && !matchCity && !matchFor && !matchSkills) {
          return false;
        }
      }
      return true;
    });
  }, [applicantsInRoleType, filter, selectedRole, search]);

  const handleShortlist = async (app: Applicant) => {
    if (isApiEnabled) {
      try {
        await updateApplicantStatus(app.id, "SHORTLISTED");
      } catch (e: any) {
        toast.error(e?.message || "Status update failed");
        return;
      }
    }
    setStatus((prev) => ({ ...prev, [app.id]: "Shortlisted" }));
    toast.success(`${app.name} shortlisted`, {
      description: "Candidate moved to shortlisted candidates.",
    });
  };

  const handleConfirmShift = async (app: Applicant) => {
    if (isApiEnabled) {
      try {
        await updateApplicantStatus(app.id, "CONFIRMED");
      } catch (e: any) {
        toast.error(e?.message || "Status update failed");
        return;
      }
    }
    setStatus((prev) => ({ ...prev, [app.id]: "Confirmed" }));
    toast.success(`Shift Confirmed for ${app.name}!`, {
      description: `Clinician is now confirmed for "${app.for}". Escrow payout is locked.`,
    });
    fetchApplicants();
  };

  const [verifyTimesheetModalApp, setVerifyTimesheetModalApp] = useState<Applicant | null>(null);
  const [verifyHoursInput, setVerifyHoursInput] = useState<number>(8);
  const [submittingVerifyTimesheet, setSubmittingVerifyTimesheet] = useState(false);

  const openVerifyTimesheetModal = (app: Applicant) => {
    const hours = app.actualHours || app.scheduledHours || 8;
    setVerifyHoursInput(hours);
    setVerifyTimesheetModalApp(app);
  };

  const handleApproveTimesheet = async () => {
    if (!verifyTimesheetModalApp) return;
    setSubmittingVerifyTimesheet(true);
    try {
      if (isApiEnabled) {
        await updateApplicantStatus(
          verifyTimesheetModalApp.id,
          "COMPLETED",
          `Timesheet verified and approved for ${verifyHoursInput} hours`,
          undefined,
          undefined,
          verifyHoursInput
        );
      }
      setStatus((prev) => ({ ...prev, [verifyTimesheetModalApp.id]: "Completed" }));
      toast.success(`Timesheet Verified & Approved!`, {
        description: `Verified ${verifyHoursInput} hrs for ${verifyTimesheetModalApp.name}. Clinician payout processed; unused escrow refunded to hospital balance.`,
      });
      setVerifyTimesheetModalApp(null);
      fetchApplicants();
    } catch (e: any) {
      toast.error(e?.message || "Verification failed");
    } finally {
      setSubmittingVerifyTimesheet(false);
    }
  };

  // AI Interview Questions Generator State (#12)
  const [interviewQuestionsModalApp, setInterviewQuestionsModalApp] = useState<Applicant | null>(null);
  const [candidateQuestions, setCandidateQuestions] = useState<string[]>([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // AI Candidate Summary State (#11)
  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({});
  const [loadingSummaryId, setLoadingSummaryId] = useState<string | null>(null);

  const handleGenerateSummary = async (app: Applicant) => {
    setLoadingSummaryId(app.id);
    try {
      const expNumber = parseInt(app.exp || "3") || 3;
      const res = await summarizeCandidateWithAi(
        app.name,
        app.role,
        expNumber,
        {
          appliedFor: app.for,
          skills: app.skills,
          city: app.city,
          verified: app.verified,
        }
      );
      const text = res.response || res.content || "";
      if (text) {
        setAiSummaries((prev) => ({ ...prev, [app.id]: text }));
        toast.success(`Generated clinical summary for ${app.name}`);
      } else if (res.structuredData?.highlights && Array.isArray(res.structuredData.highlights)) {
        setAiSummaries((prev) => ({ ...prev, [app.id]: res.structuredData.highlights.join("\n") }));
        toast.success(`Generated clinical summary for ${app.name}`);
      }
    } catch (err) {
      console.warn("Failed to generate clinical summary:", err);
      toast.error("Unable to generate AI summary.");
    } finally {
      setLoadingSummaryId(null);
    }
  };



  const handleOpenInterviewQuestions = async (app: Applicant) => {
    setInterviewQuestionsModalApp(app);
    setGeneratingQuestions(true);
    try {
      const res = await generateInterviewQuestionsWithAi(app.name, app.role, {
        appliedFor: app.for,
        skills: app.skills,
        exp: app.exp,
      });

      // 1. Check structured questions array
      if (res.structuredData?.questions && Array.isArray(res.structuredData.questions) && res.structuredData.questions.length > 0) {
        setCandidateQuestions(res.structuredData.questions.slice(0, 4));
        return;
      }

      // 2. Check newline-delimited text response
      const text = res.response || res.content || "";
      if (text) {
        const parsed = text
          .split("\n")
          .map((l) => l.replace(/^[\d+*#\.\-\)]+\s*/, "").trim())
          .filter((l) => l.length > 20);
        if (parsed.length >= 2) {
          setCandidateQuestions(parsed.slice(0, 4));
          return;
        }
      }

      // 3. Dynamic specialty-tailored questions if AI response is sparse
      const targetSpecialty = ((app.for || "") + " " + (app.role || "") + " " + (app.skills || []).join(" ")).toLowerCase();
      if (targetSpecialty.includes("dialysis") || targetSpecialty.includes("renal") || targetSpecialty.includes("hemodialysis")) {
        setCandidateQuestions([
          "How do you inspect and assess an AV fistula or graft before initiating hemodialysis cannulation?",
          "What immediate emergency protocol do you execute if a patient experiences acute intradialytic hypotension?",
          "Walk us through your dialyzer priming and heparinization protocol under NABH infection control standards.",
          "How do you handle severe muscle cramping and dialyzer membrane hypersensitivity reactions mid-session?",
        ]);
      } else if (targetSpecialty.includes("scrub") || targetSpecialty.includes("ot") || targetSpecialty.includes("theatre") || targetSpecialty.includes("surgical")) {
        setCandidateQuestions([
          "Can you walk us through the surgical hand scrub and sterile gowning workflow according to NABH guidelines?",
          "What is your exact protocol when a surgical needle or sponge count is unaccounted for during closure?",
          "How do you manage rapid sterile field re-establishment after an accidental contamination event during surgery?",
          "Explain the sterile instrument turnover and chemical indicator verification between high-acuity surgeries.",
        ]);
      } else if (targetSpecialty.includes("emergency") || targetSpecialty.includes("casualty") || targetSpecialty.includes("trauma") || targetSpecialty.includes("er")) {
        setCandidateQuestions([
          "How do you prioritize triage in the Emergency Department when two critical poly-trauma patients arrive simultaneously?",
          "Walk us through the 10-minute acute chest pain and STEMI protocol from arrival to cath lab alert.",
          "What is your standard protocol for managing acute anaphylactic shock in casualty before physician arrival?",
          "How do you maintain documentation and chain-of-custody for Medico-Legal Cases in emergency?",
        ]);
      } else {
        setCandidateQuestions([
          `Can you walk us through your clinical experience managing high-acuity cases in ${app.role}?`,
          "How do you ensure strict adherence to infection control bundles and statutory NABH protocols?",
          "Can you walk us through your procedure for high-alert medication titration under physician orders?",
          "How do you coordinate with the intensivist and consultant team during rapid escalation?",
        ]);
      }
    } catch {
      setCandidateQuestions([
        `Walk us through your clinical experience as ${app.role} for ${app.for}.`,
        "Explain your protocol during emergency resuscitations and acute deterioration.",
        "How do you coordinate with the multidisciplinary team during shift handovers?",
      ]);
    } finally {
      setGeneratingQuestions(false);
    }
  };

  const handleInvite = async (app: Applicant) => {
    if (isApiEnabled) {
      try {
        await updateApplicantStatus(app.id, "INTERVIEW");
      } catch (e: any) {
        toast.error(e?.message || "Status update failed");
        return;
      }
    }
    setStatus((prev) => ({ ...prev, [app.id]: "Interview" }));
    toast.success(`Interview invite sent to ${app.name}`, {
      description: "Candidate has been notified for interview scheduling.",
    });
  };

  const handleMakeOffer = async (app: Applicant) => {
    if (isApiEnabled) {
      try {
        await updateApplicantStatus(app.id, "OFFERED");
      } catch (e: any) {
        toast.error(e?.message || "Status update failed");
        return;
      }
    }
    setStatus((prev) => ({ ...prev, [app.id]: "Offer" }));
    toast.success(`Offer extended to ${app.name}`, {
      description: "Candidate has been sent formal offer details for review.",
    });
  };

  const handleHire = async (app: Applicant) => {
    if (isApiEnabled) {
      try {
        await updateApplicantStatus(app.id, "HIRED");
      } catch (e: any) {
        toast.error(e?.message || "Status update failed");
        return;
      }
    }
    setStatus((prev) => ({ ...prev, [app.id]: "Hired" }));
    toast.success(`${app.name} confirmed & hired!`, {
      description: "Candidate onboarding and escrow milestone initiated.",
    });
  };

  const openRejectModal = (app: Applicant) => {
    setRejectCandidate(app);
    setRejectionNotes("");
    const isShift = Boolean(app.isShiftClaim || app.for?.toLowerCase().includes("shift"));
    setRejectionReasonPreset(isShift ? "Council registration / credential mismatch" : "Interview performance");
  };

  const handleConfirmReject = async () => {
    if (!rejectCandidate) return;
    setSubmittingReject(true);
    const finalNotes = rejectionNotes.trim()
      ? `${rejectionReasonPreset} — ${rejectionNotes.trim()}`
      : rejectionReasonPreset;

    if (isApiEnabled) {
      try {
        await updateApplicantStatus(rejectCandidate.id, "REJECTED", finalNotes);
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("fale:applications-updated"));
        }
      } catch (e: any) {
        toast.error(e?.message || "Status update failed");
        setSubmittingReject(false);
        return;
      }
    }
    setStatus((prev) => ({ ...prev, [rejectCandidate.id]: "Rejected" }));
    toast.success(`${rejectCandidate.name} marked as Not Selected`, {
      description: `Reason recorded: "${finalNotes}"`,
    });
    setSubmittingReject(false);
    if (selectedResume?.id === rejectCandidate.id) {
      setSelectedResume((prev) => (prev ? { ...prev, status: "Rejected" } : null));
    }
    setRejectCandidate(null);
    fetchApplicants();
  };

  const handleDownloadPDF = (name: string) => {
    toast.success(`Downloading resume for ${name}...`, {
      description: "Verified clinical credentials & registration report included.",
    });
  };

  return (
    <AppShell>
      <div className="w-full min-w-0 space-y-6">
        {/* Clean Executive Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Shortlisted Candidates
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Council-cleared clinical talent delivered to your desk for interview.
          </p>
        </div>

        {/* Role Type Switcher: All Candidates vs Permanent Roles vs Locum Shifts */}
        <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/60 shadow-2xs overflow-x-auto max-w-full">
          <button
            type="button"
            onClick={() => {
              setRoleTypeTab("all");
              setFilter("All");
            }}
            className={cn(
              "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0",
              roleTypeTab === "all"
                ? "bg-card text-foreground shadow-xs border border-border/70"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <span className="whitespace-nowrap">All Candidates</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold leading-none shrink-0",
                roleTypeTab === "all" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {allApplicants.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleTypeTab("jobs");
              setFilter("All");
            }}
            className={cn(
              "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0",
              roleTypeTab === "jobs"
                ? "bg-card text-foreground shadow-xs border border-border/70"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <HiOutlineBriefcase className="h-4 w-4 text-primary shrink-0" />
            <span className="whitespace-nowrap">Permanent Roles</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold leading-none shrink-0",
                roleTypeTab === "jobs" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {permanentCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setRoleTypeTab("shifts");
              setFilter("All");
            }}
            className={cn(
              "inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0",
              roleTypeTab === "shifts"
                ? "bg-card text-foreground shadow-xs border border-border/70"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <HiOutlineBolt className="h-4 w-4 text-primary shrink-0" />
            <span className="whitespace-nowrap">Locum Shifts</span>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-bold leading-none shrink-0",
                roleTypeTab === "shifts" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              )}
            >
              {shiftCount}
            </span>
          </button>
        </div>

        {/* Clean Filter & Search Bar */}
        <div className="sticky top-[var(--header-offset,4rem)] z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2.5 pb-2.5 mb-4 sm:mb-6 bg-background/95 backdrop-blur-md transition-all duration-300 ease-in-out">
          <div className="surface rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Status Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {filterTabs.map((f) => {
                const active = filter === f;
                const count = counts[f as keyof typeof counts] || 0;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer shrink-0",
                      active
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "border border-input bg-card text-muted-foreground hover:border-ring hover:text-foreground"
                    )}
                  >
                    <span>{f}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                        active
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search + Custom Select */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-xl border border-input bg-card pl-9 pr-7 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  >
                    <HiXMark className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Custom Select Component */}
              <div className="w-44 sm:w-48 shrink-0">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-9 rounded-xl border-input bg-card text-xs font-medium">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {roles.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">
                        {r === "All" ? "All Roles" : r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Cards Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredList.map((a) => (
            <div
              key={a.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:border-border/80 transition-shadow"
            >
              <div>
                {/* Top Row: Avatar, Clinician Name & Details, and Status Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-primary-foreground shadow-2xs">
                      {initials(a.name)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="text-base font-bold text-foreground leading-snug">
                          {a.name}
                        </h2>
                        {a.verified && (
                          <HiOutlineShieldCheck
                            className="h-4 w-4 text-primary shrink-0"
                            title="Verified profile"
                          />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground font-medium flex items-center gap-1.5 flex-wrap">
                        <span>{a.role}</span>
                        {a.exp && (
                          <>
                            <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                            <span>{a.exp}</span>
                          </>
                        )}
                        <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                        <span className="flex items-center gap-1">
                          <HiOutlineMapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{a.city}</span>
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        Applied for <span className="font-medium text-foreground/85">{a.for}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge anchored top-right */}
                  <div className="shrink-0 pt-0.5">
                    <StatusBadge status={a.status} />
                  </div>
                </div>

                {/* Sub-header Badges Strip (Role type, Match Score) */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {a.isShiftClaim || a.for.toLowerCase().includes("shift") ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                      <HiOutlineBolt className="h-3 w-3 text-amber-600 dark:text-amber-400" />
                      Locum Shift
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:text-blue-300">
                      <HiOutlineBriefcase className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      Permanent Role
                    </span>
                  )}



                  {a.match !== undefined && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-bold shadow-2xs",
                        (a.match ?? 0) >= 70
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-300"
                          : (a.match ?? 0) >= 40
                          ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                          : "bg-muted border-border text-muted-foreground"
                      )}
                    >
                      <BotMessageSquare className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                      <span>{(a.match ?? 0) >= 90 ? `Exact Match (${a.match}%)` : `${a.match}% Match`}</span>
                    </span>
                  )}
                </div>

                {/* Key Skill Chips */}
                {a.skills && a.skills.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {a.skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="rounded-lg bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Clinical Candidate Summary (#11) */}
                <div className="mt-3 rounded-xl border border-primary/20 bg-primary/5 p-2.5 text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-bold text-primary text-[10px] uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                      <BotMessageSquare className="h-3 w-3 text-primary" /> Clinical Profile Summary
                    </span>
                    <button
                      type="button"
                      disabled={loadingSummaryId === a.id}
                      onClick={() => handleGenerateSummary(a)}
                      className="text-[9.5px] font-bold text-primary hover:underline cursor-pointer lowercase"
                    >
                      {loadingSummaryId === a.id ? "Analyzing..." : aiSummaries[a.id] ? "Regenerate AI" : "Summarize with AI"}
                    </button>
                  </div>
                  {aiSummaries[a.id] ? (
                    <div className="text-foreground/90 leading-relaxed text-[11px] whitespace-pre-line pt-0.5">
                      {aiSummaries[a.id]}
                    </div>
                  ) : (
                    <div className="text-muted-foreground leading-tight space-y-0.5">
                      <p>• {a.name} · {a.exp || "Verified Clinician"} · {a.verified ? "State Council Verified" : "MCI/KMC Registered"}</p>
                      <p>• Applied for: <span className="font-semibold text-foreground/80">{a.for}</span> · Skills: {a.skills && a.skills.length > 0 ? a.skills.join(", ") : "Core Clinical Protocols"}</p>
                      <p>• {(a.match ?? 0) >= 70 ? "High clinical suitability for immediate roster allocation." : "Discrepancy detected with shift requirements; supervisory review recommended."} (Match Score: {a.match ?? 78}%)</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: View Resume + Stage Actions */}
              <div className="mt-5 pt-3.5 border-t border-border/70 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Option to see the resume */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedResume(a)}
                    className="rounded-xl text-xs font-semibold gap-1.5 border-input hover:border-ring text-foreground shadow-2xs cursor-pointer"
                  >
                    <HiOutlineDocumentText className="h-4 w-4 text-primary" /> View resume
                  </Button>

                  {/* Clinical Interview Questions */}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenInterviewQuestions(a)}
                    className="rounded-xl text-xs font-semibold gap-1.5 border-primary/30 hover:border-primary text-primary hover:bg-primary/10 shadow-2xs cursor-pointer"
                  >
                    <BotMessageSquare className="h-3.5 w-3.5 text-primary" /> Interview Questions
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {(a.isShiftClaim || a.for?.toLowerCase().includes("shift")) ? (
                    <>
                      {a.status === "Timesheet Submitted" ? (
                        <>
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-xl">
                            <HiOutlineClock className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            Timesheet: {a.actualHours || a.scheduledHours || 8}h reported
                          </span>
                          <Button
                            size="sm"
                            onClick={() => openVerifyTimesheetModal(a)}
                            className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                          >
                            Verify Timesheet
                          </Button>
                        </>
                      ) : a.status === "Confirmed" ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-1.5">
                            <HiCheck className="h-3.5 w-3.5 stroke-[3]" /> Shift Confirmed · Awaiting Duty Sign-Off
                          </span>
                        </div>
                      ) : a.status === "Completed" || a.status === "Hired" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-1.5">
                          <HiCheck className="h-3.5 w-3.5 stroke-[3]" /> Duty Verified & Escrow Released
                        </span>
                      ) : a.status === "Rejected" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 px-1.5">
                          <HiXMark className="h-3.5 w-3.5 stroke-[3]" /> Claim Declined
                        </span>
                      ) : a.status === "Slot Filled" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground px-1.5">
                          ● Capacity Filled
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary px-1.5">
                            <HiCheck className="h-3.5 w-3.5 stroke-[3]" /> Claimed
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectModal(a)}
                            className="rounded-xl text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                          >
                            Decline Claim
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleConfirmShift(a)}
                            className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                          >
                            Confirm Shift
                          </Button>
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      {a.status === "New" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectModal(a)}
                            className="rounded-xl text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleInvite(a)}
                            className="rounded-xl text-xs font-semibold shadow-xs"
                          >
                            Invite to interview
                          </Button>
                        </>
                      )}

                      {a.status === "Shortlisted" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectModal(a)}
                            className="rounded-xl text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleInvite(a)}
                            className="rounded-xl text-xs font-semibold shadow-xs"
                          >
                            Invite to interview
                          </Button>
                        </>
                      )}

                      {a.status === "Interview" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectModal(a)}
                            className="rounded-xl text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMakeOffer(a)}
                            className="rounded-xl text-xs font-semibold shadow-xs"
                          >
                            Extend offer
                          </Button>
                        </>
                      )}

                      {a.status === "Offer" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectModal(a)}
                            className="rounded-xl text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleHire(a)}
                            className="rounded-xl text-xs font-semibold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Confirm Hired
                          </Button>
                        </>
                      )}

                      {a.status === "Hired" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 px-1.5">
                          <HiCheck className="h-3.5 w-3.5 stroke-[3]" /> Placed / Hired
                        </span>
                      )}

                      {a.status === "Rejected" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 px-1.5">
                          <HiXMark className="h-3.5 w-3.5 stroke-[2.5]" /> Not Selected
                        </span>
                      )}

                      {a.status === "Position Filled" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground px-1.5">
                          Position Filled
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State with Lottie Animation */}
        {filteredList.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 sm:p-12 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto mb-3 w-44 sm:w-52 overflow-hidden flex items-center justify-center">
              <LottieAnimation
                animationData={lottieEmptyAnimation}
                loop={true}
                className="w-full h-auto"
              />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {roleTypeTab === "jobs"
                ? "No permanent role applicants found"
                : roleTypeTab === "shifts"
                ? "No locum shift candidates found"
                : "No applicants found"}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              {roleTypeTab === "jobs"
                ? "Candidates applying for your permanent vacancies will appear here."
                : roleTypeTab === "shifts"
                ? "Healthcare professionals claiming broadcast shifts will appear here."
                : "Try changing your search keywords or filter selection."}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilter("All");
                setSelectedRole("All");
                setSearch("");
              }}
              className="mt-4 rounded-xl text-xs font-semibold shadow-2xs hover:bg-muted"
            >
              Reset filters
            </Button>
          </div>
        )}
      </div>

      {/* Professional Resume Modal Dialog */}
      <Dialog
        open={!!selectedResume}
        onOpenChange={(open) => !open && setSelectedResume(null)}
      >
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
          {selectedResume && (
            <div className="flex flex-col">
              {/* Resume Header / Top Toolbar */}
              <div className="border-b border-border bg-muted/30 p-6">
                <DialogHeader className="text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <DialogTitle className="text-xl font-bold text-foreground">
                          {selectedResume.name}
                        </DialogTitle>
                        {selectedResume.verified && (
                          <HiOutlineShieldCheck
                            className="h-5 w-5 text-primary"
                            title="Verified Clinical Candidate"
                          />
                        )}
                        <span className="rounded-full bg-primary-soft text-primary px-2.5 py-0.5 text-xs font-bold">
                          {selectedResume.role}
                        </span>
                        {selectedResume.isShiftClaim || selectedResume.for.toLowerCase().includes("shift") ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300">
                            <HiOutlineBolt className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                            Locum Shift
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                            <HiOutlineBriefcase className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                            Permanent Role
                          </span>
                        )}
                        {selectedResume.match !== undefined && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                            <HiOutlineSparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span>{(selectedResume.match ?? 0) >= 90 ? `Exact Match (${selectedResume.match}%)` : `${selectedResume.match}% Match`}</span>
                          </span>
                        )}
                      </div>
                      <DialogDescription className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                        <span className="flex items-center gap-1">
                          <HiOutlineMapPin className="h-3.5 w-3.5" />
                          {selectedResume.city}
                        </span>
                        <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                        <span>Applied for {selectedResume.for}</span>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {/* Council Verification Pill */}
                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-card border border-border p-3 text-xs">
                  <span className="text-muted-foreground font-medium">Council Registration:</span>
                  <span className="font-mono font-bold text-foreground">{selectedResume.regNumber}</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <HiCheck className="h-3.5 w-3.5 stroke-[3]" /> FALE Credential Verified
                  </span>
                </div>
              </div>

              {/* Candidate Onboarding Resume Preview */}
              <div className="w-full bg-muted/20 p-4 sm:p-5">
                {selectedResume.resumeUrl ? (
                  <iframe
                    src={`${selectedResume.resumeUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    className="w-full h-[65vh] rounded-xl border border-border bg-white shadow-xs"
                    title={`${selectedResume.name} Resume`}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
                    <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center mb-3 text-muted-foreground">
                      <HiOutlineDocumentText className="h-7 w-7" />
                    </div>
                    <h4 className="font-bold text-foreground text-sm">No Uploaded Resume Available</h4>
                    <p className="text-xs text-muted-foreground max-w-sm mt-1.5 leading-relaxed">
                      This candidate has not uploaded a resume document during their onboarding verification.
                    </p>
                  </div>
                )}
              </div>

              {/* Resume Footer with Direct Stage Actions */}
              <div className="border-t border-border bg-muted/20 p-4 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="text-muted-foreground text-[10px] block">Current Status</span>
                  <StatusBadge status={status[selectedResume.id] ?? selectedResume.status} />
                </div>

                <div className="flex items-center gap-2">
                  {(selectedResume.isShiftClaim || selectedResume.for?.toLowerCase().includes("shift")) ? (
                    (status[selectedResume.id] ?? selectedResume.status) === "Timesheet Submitted" ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          const target = selectedResume;
                          setSelectedResume(null);
                          openVerifyTimesheetModal(target);
                        }}
                        className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                      >
                        Verify Timesheet ({selectedResume.actualHours || selectedResume.scheduledHours || 8}h)
                      </Button>
                    ) : (status[selectedResume.id] ?? selectedResume.status) === "Confirmed" ? (
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <HiCheck className="h-3.5 w-3.5 stroke-[3]" /> Shift Confirmed · Awaiting Clinician Duty Timesheet
                        </span>
                      </div>
                    ) : (status[selectedResume.id] ?? selectedResume.status) === "Completed" || (status[selectedResume.id] ?? selectedResume.status) === "Hired" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <HiCheck className="h-3.5 w-3.5 stroke-[3]" /> Duty Verified & Escrow Released
                      </span>
                    ) : (status[selectedResume.id] ?? selectedResume.status) === "Rejected" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                        <HiXMark className="h-3.5 w-3.5 stroke-[3]" /> Claim Declined
                      </span>
                    ) : (status[selectedResume.id] ?? selectedResume.status) === "Slot Filled" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                        ● Capacity Filled
                      </span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const target = selectedResume;
                            setSelectedResume(null);
                            openRejectModal(target);
                          }}
                          className="rounded-xl text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                        >
                          Decline Claim
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            handleConfirmShift(selectedResume);
                            setSelectedResume(null);
                          }}
                          className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
                        >
                          Confirm Shift
                        </Button>
                      </div>
                    )
                  ) : (
                    <>
                      {/* Decline action available across non-terminal stages */}
                      {selectedResume.status !== "Hired" &&
                        selectedResume.status !== "Rejected" &&
                        selectedResume.status !== "Position Filled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openRejectModal(selectedResume)}
                            className="rounded-xl text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          >
                            Decline
                          </Button>
                        )}

                      {/* Progressive next stage actions */}
                      {(selectedResume.status === "New" || selectedResume.status === "Shortlisted") && (
                        <Button
                          size="sm"
                          onClick={() => {
                            handleInvite(selectedResume);
                            setSelectedResume(null);
                          }}
                          className="rounded-xl text-xs font-semibold shadow-xs"
                        >
                          Invite to interview
                        </Button>
                      )}

                      {selectedResume.status === "Interview" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            handleMakeOffer(selectedResume);
                            setSelectedResume(null);
                          }}
                          className="rounded-xl text-xs font-semibold shadow-xs"
                        >
                          Extend offer
                        </Button>
                      )}

                      {selectedResume.status === "Offer" && (
                        <Button
                          size="sm"
                          onClick={() => {
                            handleHire(selectedResume);
                            setSelectedResume(null);
                          }}
                          className="rounded-xl text-xs font-semibold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          Confirm Hired
                        </Button>
                      )}

                      {/* Terminal stage indicators */}
                      {selectedResume.status === "Rejected" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
                          <HiXMark className="h-4 w-4" /> Not Selected
                        </span>
                      )}

                      {selectedResume.status === "Position Filled" && (
                        <span className="text-xs font-semibold text-muted-foreground">
                          Position Filled
                        </span>
                      )}

                      {selectedResume.status === "Hired" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          <HiCheck className="h-4 w-4 stroke-[3]" /> Confirmed & Hired
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Decline Candidate Notes Dialog */}
      <Dialog open={!!rejectCandidate} onOpenChange={(open) => !open && setRejectCandidate(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          {rejectCandidate && (
            <div className="space-y-4">
              <DialogHeader className="text-left space-y-1">
                <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40">
                    <HiXMark className="h-5 w-5" />
                  </span>
                  {rejectCandidate.isShiftClaim || rejectCandidate.for.toLowerCase().includes("shift")
                    ? "Decline Locum Shift Claim"
                    : "Decline Candidate"}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Record reason and clinical feedback for {rejectCandidate.isShiftClaim || rejectCandidate.for.toLowerCase().includes("shift") ? "declining the shift claim of" : "not selecting"} <strong>{rejectCandidate.name}</strong> for <strong>{rejectCandidate.for}</strong>.
                </DialogDescription>
              </DialogHeader>

              {/* Quick Preset Badges */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Select Primary Reason:</label>
                <div className="flex flex-wrap gap-1.5">
                  {REJECTION_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRejectionReasonPreset(preset)}
                      className={cn(
                        "rounded-lg px-2.5 py-1 text-xs font-medium border transition-all cursor-pointer",
                        rejectionReasonPreset === preset
                          ? "bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300 font-semibold"
                          : "border-input bg-card text-muted-foreground hover:border-ring hover:text-foreground"
                      )}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes Field */}
              <div className="space-y-1.5">
                <label htmlFor="rejection-notes" className="text-xs font-semibold text-muted-foreground">
                  Clinical Notes / Interview Feedback (Optional):
                </label>
                <textarea
                  id="rejection-notes"
                  rows={3}
                  value={rejectionNotes}
                  onChange={(e) => setRejectionNotes(e.target.value)}
                  placeholder="e.g. Candidate lacked specific clinical skills during viva; recommended for alternative ward role..."
                  className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>

              {/* Dialog Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/80">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setRejectCandidate(null)}
                  className="rounded-xl text-xs font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={submittingReject}
                  onClick={handleConfirmReject}
                  className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                >
                  {submittingReject ? "Declining..." : rejectCandidate.isShiftClaim || rejectCandidate.for.toLowerCase().includes("shift") ? "Decline Claim & Reopen Slot" : "Confirm Decline"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= TIMESHEET VERIFICATION & ESCROW RELEASE MODAL ================= */}
      {verifyTimesheetModalApp && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setVerifyTimesheetModalApp(null); }}>
          <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <HiOutlineClock className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-foreground">
                    Verify Timesheet & Release Escrow
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {verifyTimesheetModalApp.name} • {verifyTimesheetModalApp.for}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2 text-sm">
              <div className="rounded-2xl border border-border bg-muted/40 p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Scheduled Duty</span>
                  <span className="font-bold text-foreground">
                    {verifyTimesheetModalApp.scheduledHours || 8} hrs @ ₹{(verifyTimesheetModalApp.hourlyRate || 500).toLocaleString("en-IN")}/hr
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground font-medium">Clinician Reported Duty</span>
                  <span className="font-bold text-amber-600 dark:text-amber-400">
                    {verifyTimesheetModalApp.actualHours ? `${verifyTimesheetModalApp.actualHours} hrs` : `${verifyTimesheetModalApp.scheduledHours || 8} hrs (Scheduled)`}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border">
                  <span className="text-muted-foreground font-medium">Total Locked Escrow</span>
                  <span className="font-bold text-primary">
                    ₹{((verifyTimesheetModalApp.hourlyRate || 500) * (verifyTimesheetModalApp.scheduledHours || 8)).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground flex items-center justify-between">
                  <span>Verified Hours to Pay</span>
                  <span className="text-[11px] font-medium text-muted-foreground">
                    Clinician reported: {verifyTimesheetModalApp.actualHours || verifyTimesheetModalApp.scheduledHours || 8} hrs
                  </span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    max={(verifyTimesheetModalApp.scheduledHours || 8) + 4}
                    step={1}
                    value={verifyHoursInput}
                    onChange={(e) => setVerifyHoursInput(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-11 rounded-2xl font-bold text-foreground pr-14"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                    hours
                  </span>
                </div>
              </div>

              {/* Escrow Reconciliation Breakdown */}
              {verifyHoursInput < (verifyTimesheetModalApp.scheduledHours || 8) ? (
                <div className="rounded-2xl border border-emerald-300/60 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 text-xs space-y-1.5">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <HiOutlineShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
                    Escrow Reconciliation & Hospital Refund
                  </p>
                  <div className="flex justify-between text-foreground font-medium">
                    <span>Clinician Gross Payout ({verifyHoursInput} hrs):</span>
                    <span className="font-bold text-foreground">
                      ₹{((verifyTimesheetModalApp.hourlyRate || 500) * verifyHoursInput).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-emerald-200 dark:border-emerald-900/40 flex justify-between font-bold text-emerald-700 dark:text-emerald-400">
                    <span>Auto-Refund to Hospital Wallet:</span>
                    <span>
                      ₹{((verifyTimesheetModalApp.hourlyRate || 500) * ((verifyTimesheetModalApp.scheduledHours || 8) - verifyHoursInput)).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-muted bg-muted/40 p-3 text-xs text-muted-foreground flex items-center gap-2">
                  <HiOutlineShieldCheck className="h-4 w-4 shrink-0 text-primary" />
                  <span>Full scheduled escrow of ₹{((verifyTimesheetModalApp.hourlyRate || 500) * (verifyTimesheetModalApp.scheduledHours || 8)).toLocaleString("en-IN")} will be verified and disbursed to the clinician.</span>
                </div>
              )}
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                variant="outline"
                disabled={submittingVerifyTimesheet}
                onClick={() => setVerifyTimesheetModalApp(null)}
                className="rounded-xl font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                disabled={submittingVerifyTimesheet}
                onClick={handleApproveTimesheet}
                className="rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
              >
                {submittingVerifyTimesheet ? "Verifying..." : "Approve & Release Escrow"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* AI Candidate Interview Questions Modal (#12) */}
      {interviewQuestionsModalApp && (
        <Dialog
          open={!!interviewQuestionsModalApp}
          onOpenChange={(open) => !open && setInterviewQuestionsModalApp(null)}
        >
          <DialogContent className="max-w-lg rounded-3xl p-6">
            <DialogHeader>
              <div className="flex items-center gap-2 mb-1">
                <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                  <BotMessageSquare className="h-4.5 w-4.5 text-primary" />
                </span>
                <div>
                  <DialogTitle className="text-base font-bold text-foreground">
                    Clinical Interview Questions
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Tailored for {interviewQuestionsModalApp.name} · {interviewQuestionsModalApp.for}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Recommended Clinical Screening Questions:
              </p>
              {generatingQuestions ? (
                <div className="py-6 text-center text-xs text-muted-foreground space-y-2">
                  <div className="h-2 w-2 rounded-full bg-primary mx-auto animate-ping" />
                  <p>Analyzing clinical CV and generating tailored questions...</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {candidateQuestions.map((q, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-border/80 bg-muted/40 p-3.5 text-xs text-foreground leading-relaxed flex items-start gap-2.5"
                    >
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary text-white text-[10px] font-bold mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{q}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="mt-2">
              <Button
                variant="outline"
                onClick={() => setInterviewQuestionsModalApp(null)}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}
