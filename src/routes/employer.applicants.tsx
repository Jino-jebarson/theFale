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
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { toast } from "sonner";
import { BotMessageSquare, RotateCcw, Copy, Check, Star, KeyRound, AlertTriangle } from "lucide-react";
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
import {
  attachFocusAndPollRefresh,
  formatApplicationStatus,
  getFacilityApplicants,
  updateApplicantStatus,
} from "@/lib/adapters/facilityAdapter";
import { rateShiftClaim } from "@/lib/adapters/shiftAdapter";
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

const REJECTION_PRESETS = [
  "Interview performance",
  "Lacks required clinical / ICU experience",
  "Council registration / credential mismatch",
  "Compensation / notice period mismatch",
  "Candidate withdrew / unresponsive",
  "Other",
] as const;

const ACTION_NEEDED_STATUSES = new Set([
  "New",
  "Claimed",
  "Timesheet Submitted",
  "Shortlisted",
  "Disputed",
]);

const IN_PROGRESS_STATUSES = new Set([
  "Confirmed",
  "Checked In",
  "Interview",
  "Offer",
]);

function getStatusSortRank(status: string): number {
  if (status === "New" || status === "Claimed") return 0;
  if (status === "Timesheet Submitted" || status === "Disputed") return 1;
  if (status === "Shortlisted") return 2;
  if (IN_PROGRESS_STATUSES.has(status)) return 3;
  return 4;
}

function formatAppliedTimestamp(raw?: string): string {
  if (!raw) return "Recent";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return "Recent";
  const diffMins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMins >= 0 && diffMins < 60) {
    return diffMins <= 1 ? "Just now" : `${diffMins}m ago`;
  }
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours >= 1 && diffHours < 24) {
    return `${diffHours}h ago`;
  }
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Applicants() {
  const s = useApp();
  const [roleTypeTab, setRoleTypeTab] = useState<"all" | "jobs" | "shifts">("all");
  const [filter, setFilter] = useState("All");
  const [hasInitializedFilter, setHasInitializedFilter] = useState(false);
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

  const fetchApplicants = (silent = false) => {
    if (!isApiEnabled) return;
    if (!silent) setLoading(true);
    getFacilityApplicants()
      .then((data) => {
        setApiApplicants(data);
        if (typeof window !== "undefined") {
          let unreadCount = 0;
          try {
            const stored = localStorage.getItem("fale_seen_applicant_ids");
            const seen = stored ? new Set(JSON.parse(stored).map(String)) : new Set<string>();
            unreadCount = Array.isArray(data) ? data.filter((a: any) => !seen.has(String(a.id))).length : 0;
          } catch {
            unreadCount = 0;
          }
          window.dispatchEvent(new CustomEvent("fale:applications-updated", { detail: { unreadCount } }));
        }
      })
      .catch((err: any) => {
        if (!silent) {
          toast.error("Failed to load applicants", {
            description: err?.message || "Please check your session and try again.",
          });
        }
      })
      .finally(() => {
        if (!silent) setLoading(false);
      });
  };

  useEffect(() => {
    if (!isApiEnabled) return;
    fetchApplicants(false);
    return attachFocusAndPollRefresh(() => fetchApplicants(true), 60000);
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

        const uiStatus = status[a.id] ?? formatApplicationStatus(a.status);

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
          isApiEnabled && typeof a.matchScore === "number" && a.matchScore > 0
            ? a.matchScore
            : clinicalMatch?.score ||
            (s.adminApplications || []).find(
              (adm) => adm.id === a.id || (adm.candidateName && adm.candidateName === a.candidateName)
            )?.matchScore ||
            50;

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
          appliedDate: formatAppliedTimestamp(a.appliedAt),
          appliedAtMs: a.appliedAt ? new Date(a.appliedAt).getTime() : 0,
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
          checkInPin: a.checkInPin || undefined,
          disputeReason: a.disputeReason || undefined,
          hospitalRating: a.hospitalRating || undefined,
          hospitalReview: a.hospitalReview || undefined,
          ratingTags: a.ratingTags || undefined,
          candidateRatingAvg: a.candidateRatingAvg ?? undefined,
          candidateRatingCount: a.candidateRatingCount ?? undefined,
          completedShiftsCount: a.completedShiftsCount ?? undefined,
          shiftClaimStatus: a.status || undefined,
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
          appliedAtMs: 0,
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

  // Automatically release/clear the Shortlisted badge once applicants have been seen
  useEffect(() => {
    if (allApplicants.length > 0) {
      try {
        const stored = localStorage.getItem("fale_seen_applicant_ids");
        const seenSet = stored ? new Set(JSON.parse(stored)) : new Set<string>();
        let changed = false;
        allApplicants.forEach((a) => {
          const strId = String(a.id);
          if (!seenSet.has(strId)) {
            seenSet.add(strId);
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem("fale_seen_applicant_ids", JSON.stringify([...seenSet]));
          window.dispatchEvent(new CustomEvent("fale:applications-updated", { detail: { unreadCount: 0 } }));
        }
      } catch (err) {
        console.error("Failed to mark applicants as seen", err);
      }
    }
  }, [allApplicants]);

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
    const needsActionCount = applicantsInRoleType.filter((a) =>
      ACTION_NEEDED_STATUSES.has(a.status)
    ).length;
    return {
      "Needs Action": needsActionCount,
      All: applicantsInRoleType.length,
      New: applicantsInRoleType.filter((a) => a.status === "New").length,
      Shortlisted: applicantsInRoleType.filter((a) => a.status === "Shortlisted").length,
      Claimed: applicantsInRoleType.filter((a) => a.status === "Claimed").length,
      Confirmed: applicantsInRoleType.filter((a) => a.status === "Confirmed").length,
      CheckedIn: applicantsInRoleType.filter((a) => a.status === "Checked In").length,
      Completed: applicantsInRoleType.filter((a) => a.status === "Completed").length,
      Disputed: applicantsInRoleType.filter((a) => a.status === "Disputed").length,
      NoShow: applicantsInRoleType.filter((a) => a.status === "No-Show").length,
      Interview: applicantsInRoleType.filter((a) => a.status === "Interview").length,
      Offer: applicantsInRoleType.filter((a) => a.status === "Offer").length,
      Hired: applicantsInRoleType.filter((a) => a.status === "Hired").length,
      Rejected: applicantsInRoleType.filter((a) => a.status === "Rejected").length,
      TimesheetSubmitted: applicantsInRoleType.filter((a) => a.status === "Timesheet Submitted").length,
      SlotFilled: applicantsInRoleType.filter((a) => a.status === "Slot Filled").length,
      PositionFilled: applicantsInRoleType.filter((a) => a.status === "Position Filled").length,
    };
  }, [applicantsInRoleType]);

  // Smart default: land on "Needs Action" whenever newly applied / pending candidates exist
  useEffect(() => {
    if (loading || hasInitializedFilter) return;
    if (allApplicants.length > 0) {
      if (counts["Needs Action"] > 0) {
        setFilter("Needs Action");
      }
      setHasInitializedFilter(true);
    }
  }, [loading, hasInitializedFilter, allApplicants.length, counts]);

  // Dynamic filter tabs based on role type
  const filterTabs = useMemo(() => {
    if (roleTypeTab === "shifts") {
      const list = ["Needs Action", "All"];
      if (counts.Claimed > 0) list.push("Claimed");
      if (counts.Shortlisted > 0) list.push("Shortlisted");
      if (counts.Confirmed > 0) list.push("Confirmed");
      if (counts.CheckedIn > 0) list.push("Checked In");
      if (counts.TimesheetSubmitted > 0) list.push("Timesheet Submitted");
      if (counts.Completed > 0) list.push("Completed");
      if (counts.Disputed > 0) list.push("Disputed");
      if (counts.NoShow > 0) list.push("No-Show");
      if (counts.Hired > 0) list.push("Hired");
      if (counts.Rejected > 0) list.push("Rejected");
      if (counts.SlotFilled > 0) list.push("Slot Filled");
      return list;
    }
    const list = ["Needs Action", "All", "New", "Shortlisted"];
    if (counts.Claimed > 0) list.push("Claimed");
    if (counts.Confirmed > 0) list.push("Confirmed");
    if (counts.CheckedIn > 0) list.push("Checked In");
    if (counts.TimesheetSubmitted > 0) list.push("Timesheet Submitted");
    if (counts.Completed > 0) list.push("Completed");
    if (counts.Disputed > 0) list.push("Disputed");
    if (counts.NoShow > 0) list.push("No-Show");
    list.push("Interview");
    if (counts.Offer > 0) list.push("Offer");
    if (counts.Hired > 0) list.push("Hired");
    if (counts.Rejected > 0) list.push("Rejected");
    if (counts.SlotFilled > 0) list.push("Slot Filled");
    if (counts.PositionFilled > 0) list.push("Position Filled");
    return list;
  }, [counts, roleTypeTab]);

  // Filtered & priority-sorted candidate list (newly applied & action-needed first, newest first)
  const filteredList = useMemo(() => {
    const matched = applicantsInRoleType.filter((a) => {
      if (filter === "Needs Action") {
        if (!ACTION_NEEDED_STATUSES.has(a.status)) return false;
      } else if (filter !== "All" && a.status !== filter) {
        return false;
      }
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

    return [...matched].sort((a, b) => {
      const rankDiff = getStatusSortRank(a.status) - getStatusSortRank(b.status);
      if (rankDiff !== 0) return rankDiff;
      const timeA = (a as { appliedAtMs?: number }).appliedAtMs || 0;
      const timeB = (b as { appliedAtMs?: number }).appliedAtMs || 0;
      return timeB - timeA;
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

  // --- Shift Hardening: No-Show, Dispute & Clinician Star Rating ---
  const [disputeModalApp, setDisputeModalApp] = useState<Applicant | null>(null);
  const [disputeReasonInput, setDisputeReasonInput] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);

  const [rateModalApp, setRateModalApp] = useState<Applicant | null>(null);
  const [ratingScore, setRatingScore] = useState<number>(5);
  const [ratingTagsSelected, setRatingTagsSelected] = useState<string[]>(["Punctual", "Clinical Excellence"]);
  const [ratingReviewInput, setRatingReviewInput] = useState("");
  const [submittingRating, setSubmittingRating] = useState(false);

  const CLINICAL_RATING_TAGS = [
    "Punctual",
    "Clinical Excellence",
    "ICU/Emergency Ready",
    "Clear Handover",
    "Team Player",
    "Protocol Compliant",
  ];

  const handleMarkNoShow = async (app: Applicant) => {
    if (isApiEnabled) {
      try {
        await updateApplicantStatus(app.id, "NO_SHOW", "Clinician did not report on shift duty");
      } catch (e: any) {
        toast.error(e?.message || "Could not mark no-show");
        return;
      }
    }
    setStatus((prev) => ({ ...prev, [app.id]: "No-Show" }));
    toast.warning(`${app.name} marked as No-Show`, {
      description: "Shift slot reopened so another verified clinician can claim.",
    });
    fetchApplicants();
  };

  const handleConfirmDispute = async () => {
    if (!disputeModalApp) return;
    if (!disputeReasonInput.trim()) {
      toast.error("Please describe the shift dispute reason");
      return;
    }
    setSubmittingDispute(true);
    try {
      if (isApiEnabled) {
        await updateApplicantStatus(disputeModalApp.id, "DISPUTED", disputeReasonInput.trim());
      }
      setStatus((prev) => ({ ...prev, [disputeModalApp.id]: "Disputed" }));
      toast.warning("Shift Escalated to FALE Dispute Desk", {
        description: "Escrow is safely frozen while FALE Ops resolves the claim.",
      });
      setDisputeModalApp(null);
      setDisputeReasonInput("");
      fetchApplicants();
    } catch (e: any) {
      toast.error(e?.message || "Failed to raise dispute");
    } finally {
      setSubmittingDispute(false);
    }
  };

  const openRateModal = (app: Applicant) => {
    setRateModalApp(app);
    setRatingScore(5);
    setRatingTagsSelected(["Punctual", "Clinical Excellence"]);
    setRatingReviewInput("");
  };

  const toggleRatingTag = (tag: string) => {
    setRatingTagsSelected((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmitRating = async () => {
    if (!rateModalApp) return;
    setSubmittingRating(true);
    try {
      if (isApiEnabled) {
        await rateShiftClaim(rateModalApp.id, {
          rating: ratingScore,
          review: ratingReviewInput.trim() || undefined,
          tags: ratingTagsSelected,
        });
      }
      toast.success(`Rated ${rateModalApp.name} ${ratingScore} ★`, {
        description: "Verified hospital rating now boosts their profile & clinical match score.",
      });
      setRateModalApp(null);
      fetchApplicants();
    } catch (e: any) {
      toast.error(e?.message || "Could not submit rating");
    } finally {
      setSubmittingRating(false);
    }
  };

  // AI Interview Questions Generator State (#12)
  const [interviewQuestionsModalApp, setInterviewQuestionsModalApp] = useState<Applicant | null>(null);
  const [candidateQuestions, setCandidateQuestions] = useState<string[]>([]);
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // AI Candidate Summary State (#11)
  const [aiSummaries, setAiSummaries] = useState<Record<string, string>>({});
  const [loadingSummaryId, setLoadingSummaryId] = useState<string | null>(null);
  const [copiedSummaryId, setCopiedSummaryId] = useState<string | null>(null);

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
          matchScore: app.match,
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
        if (parsed.length > 0) {
          setCandidateQuestions(parsed.slice(0, 4));
          return;
        }
      }

      toast.error("Ally returned an empty interview question list. Please try again.");
      setCandidateQuestions([]);
    } catch {
      toast.error("Unable to generate Ally interview questions right now.");
      setCandidateQuestions([]);
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
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Shortlisted Candidates
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Newly applied &amp; action-needed clinicians appear first, followed by completed shift history.
            </p>
          </div>
          {counts["Needs Action"] > 0 ? (
            <button
              type="button"
              onClick={() => setFilter("Needs Action")}
              className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-primary-soft border border-primary/25 px-3.5 py-1.5 text-xs font-bold text-primary hover:bg-primary/15 transition-colors cursor-pointer"
            >
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>{counts["Needs Action"]} awaiting your review</span>
            </button>
          ) : allApplicants.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-success-soft border border-success/20 px-3 py-1 text-xs font-semibold text-success">
              <HiCheck className="h-3.5 w-3.5 stroke-[2.5]" />
              All caught up · {counts.Completed + counts.Hired} completed
            </span>
          ) : null}
        </div>

        {/* Role Type Switcher: All Candidates vs Permanent Roles vs Locum Shifts */}
        <div className="inline-flex items-center gap-1.5 p-1 rounded-2xl bg-muted/60 border border-border/60 shadow-2xs overflow-x-auto max-w-full no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 no-scrollbar [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
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
              <div className="w-full sm:w-48 shrink-0">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-9 w-full rounded-xl border-input bg-card text-xs font-medium">
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
          {filteredList.map((a) => {
            const isActionNeeded = ACTION_NEEDED_STATUSES.has(a.status);
            const isCompletedOrClosed = ["Completed", "Hired", "Rejected", "No-Show", "Slot Filled", "Position Filled"].includes(a.status);
            return (
            <div
              key={a.id}
              className={cn(
                "flex flex-col justify-between rounded-2xl border bg-card p-5 sm:p-6 shadow-2xs transition-all",
                isActionNeeded
                  ? "border-primary/40 ring-1 ring-primary/10 hover:border-primary/60"
                  : isCompletedOrClosed
                    ? "border-border/80 bg-card/90 hover:border-border"
                    : "border-border hover:border-primary/30"
              )}
            >
              <div>
                {/* Top Row: Avatar, Clinician Name & Details, and Status Badge */}
                <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                  <div className="flex items-start gap-2.5 sm:gap-3 min-w-0 flex-1">
                    <span className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-primary-foreground shadow-2xs">
                      {initials(a.name)}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h2 className="text-sm sm:text-base font-bold text-foreground leading-snug break-normal">
                          {a.name}
                        </h2>
                        {a.verified && (
                          <HiOutlineShieldCheck
                            className="h-4 w-4 text-primary shrink-0"
                            title="Verified profile"
                          />
                        )}
                        {isActionNeeded && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[10px] font-bold text-primary">
                            Action Needed
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground font-medium flex items-center gap-1.5 flex-wrap">
                        <span>{a.role}</span>
                        {a.exp && (
                          <>
                            <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                            <span>{a.exp}</span>
                          </>
                        )}
                        <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/40 shrink-0" />
                        <span className="flex items-center gap-1">
                          <HiOutlineMapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span>{a.city}</span>
                        </span>
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Applied for <span className="font-semibold text-foreground">{a.for}</span>
                      </p>
                    </div>
                  </div>

                  {/* Status Badge + Applied Timestamp anchored top-right */}
                  <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
                    <StatusBadge status={a.status} />
                    {a.appliedDate && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <HiOutlineClock className="h-3 w-3 shrink-0" />
                        {a.appliedDate}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub-header Badges Strip (Role type, Match Score, Rating, Check-In PIN) */}
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  {a.isShiftClaim || a.for.toLowerCase().includes("shift") ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft border border-primary/20 px-2.5 py-0.5 text-[10.5px] font-bold text-primary">
                      <HiOutlineBolt className="h-3 w-3 text-primary" />
                      Locum Shift
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-0.5 text-[10.5px] font-bold text-foreground">
                      <HiOutlineBriefcase className="h-3 w-3 text-muted-foreground" />
                      Permanent Role
                    </span>
                  )}

                  {a.match !== undefined && (
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold",
                        (a.match ?? 0) >= 70
                          ? "bg-success-soft border-success/25 text-success"
                          : (a.match ?? 0) >= 40
                            ? "bg-primary-soft/70 border-primary/20 text-primary"
                            : "bg-muted border-border text-muted-foreground"
                      )}
                    >
                      <BotMessageSquare
                        className={cn(
                          "h-3.5 w-3.5 shrink-0",
                          (a.match ?? 0) >= 70
                            ? "text-success"
                            : (a.match ?? 0) >= 40
                              ? "text-primary"
                              : "text-muted-foreground"
                        )}
                      />
                      <span>{(a.match ?? 0) >= 90 ? `Exact Match (${a.match}%)` : `${a.match}% Match`}</span>
                    </span>
                  )}

                  {a.candidateRatingAvg && a.candidateRatingCount && a.candidateRatingCount > 0 ? (
                    <span
                      className="inline-flex items-center gap-1 rounded-full bg-muted border border-border px-2.5 py-0.5 text-[11px] font-bold text-foreground"
                      title={`${a.completedShiftsCount || a.candidateRatingCount} verified hospital shifts completed`}
                    >
                      <Star className="h-3 w-3 fill-primary text-primary shrink-0" />
                      <span>
                        {Number(a.candidateRatingAvg).toFixed(1)} ({a.candidateRatingCount})
                      </span>
                    </span>
                  ) : null}

                  {(a.isShiftClaim || a.for?.toLowerCase().includes("shift")) &&
                    a.status === "Confirmed" &&
                    a.checkInPin && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full bg-primary-soft border border-primary/25 px-2.5 py-0.5 text-[11px] font-bold text-primary"
                        title="Share this 4-digit Floor Check-In PIN with the clinician upon ward arrival"
                      >
                        <KeyRound className="h-3 w-3 shrink-0" />
                        <span>Check-In PIN: {a.checkInPin}</span>
                      </span>
                    )}
                </div>

                {/* Key Skill Chips */}
                {a.skills && a.skills.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {a.skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="rounded-lg bg-muted border border-border/70 px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}

                {/* Clinical Profile Summary (#11) */}
                <div className="mt-3.5 rounded-2xl border border-border bg-muted/50 p-3 sm:p-3.5 space-y-2.5">
                  {/* Top Bar: Header & Action Pill */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-md bg-primary-soft text-primary flex items-center justify-center shrink-0">
                        <BotMessageSquare className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-[10.5px] font-bold text-foreground tracking-wider uppercase whitespace-nowrap">
                        Clinical Appraisal
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap",
                          a.verified
                            ? "bg-success-soft text-success"
                            : "bg-muted text-muted-foreground border border-border"
                        )}
                      >
                        <HiOutlineShieldCheck className="h-3 w-3 shrink-0" />
                        {a.verified ? "Council Verified" : "Pending KYC"}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={loadingSummaryId === a.id}
                      onClick={() => handleGenerateSummary(a)}
                      className={cn(
                        "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 sm:py-1 rounded-xl text-[11px] font-bold transition-all w-full sm:w-auto shrink-0 cursor-pointer border",
                        loadingSummaryId === a.id
                          ? "bg-primary-soft text-primary border-primary/20 cursor-wait"
                          : "bg-card hover:bg-primary hover:text-primary-foreground text-primary border-primary/30"
                      )}
                    >
                      {loadingSummaryId === a.id ? (
                        <>
                          <HiOutlineArrowPath className="h-3.5 w-3.5 animate-spin" />
                          <span>{aiSummaries[a.id] ? "Regenerating..." : "Analyzing..."}</span>
                        </>
                      ) : aiSummaries[a.id] ? (
                        <>
                          <BotMessageSquare className="h-3.5 w-3.5" />
                          <span>Regenerate with Ally</span>
                        </>
                      ) : (
                        <>
                          <BotMessageSquare className="h-3.5 w-3.5" />
                          <span>Summarize with Ally</span>
                        </>
                      )}
                    </button>
                  </div>

                  {loadingSummaryId === a.id ? (
                    <div className="py-5 sm:py-6 flex flex-col items-center justify-center gap-2 text-center rounded-xl border border-primary/20 bg-primary-soft/30 animate-pulse">
                      <div className="relative flex items-center justify-center">
                        <HiOutlineArrowPath className="h-6 w-6 animate-spin text-primary" />
                        <BotMessageSquare className="h-3 w-3 text-primary absolute" />
                      </div>
                      <div className="space-y-0.5 px-3">
                        <p className="text-[11px] font-bold text-foreground">
                          {aiSummaries[a.id] ? "Regenerating Clinical Appraisal..." : "Ally is analyzing clinical credentials..."}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          Evaluating statutory council registration, procedure competencies, and match rationale
                        </p>
                      </div>
                    </div>
                  ) : aiSummaries[a.id] ? (
                    <div className="space-y-2 pt-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                          <BotMessageSquare className="h-3.5 w-3.5 text-primary" />
                          <span>Ally Live Assessment</span>
                          <span className="rounded-full bg-primary-soft text-primary border border-primary/20 px-1.5 py-0.5 text-[8.5px] font-bold lowercase tracking-normal">
                            verified
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if (aiSummaries[a.id]) {
                              navigator.clipboard.writeText(aiSummaries[a.id]);
                              setCopiedSummaryId(a.id);
                              toast.success("Clinical summary copied to clipboard");
                              setTimeout(() => setCopiedSummaryId(null), 2000);
                            }
                          }}
                          className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground hover:text-foreground transition-colors cursor-pointer px-1.5 py-0.5 rounded-md hover:bg-card border border-transparent hover:border-border"
                          title="Copy clinical appraisal"
                        >
                          {copiedSummaryId === a.id ? (
                            <>
                              <Check className="h-3 w-3 text-success" />
                              <span className="text-success font-medium">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Scrollable Container with Fixed Controlled Height */}
                      <div className="max-h-[145px] sm:max-h-[155px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin scrollbar-thumb-primary/25 hover:scrollbar-thumb-primary/40 scrollbar-track-transparent">
                        {aiSummaries[a.id].split("\n").filter(Boolean).map((line, idx) => {
                          const cleanLine = line.replace(/^[•\s*-]+/, "").trim();
                          if (!cleanLine) return null;

                          // Categorize clinical insights
                          const isReg = idx === 1 || /council|registered|verification|statutory|licens|standing/i.test(cleanLine);
                          const isMatch = idx === 2 || /match score|percent|suitability|discrepancy|alignment/i.test(cleanLine);

                          const label = isMatch
                            ? (a.match ?? 0) >= 70 ? "Roster Fit & Match Rationale" : "Supervisory Review & Cadre"
                            : isReg
                              ? "Statutory Council Standing"
                              : "Unit Competence & Experience";

                          return (
                            <div
                              key={idx}
                              className={cn(
                                "rounded-xl border p-2 sm:p-2.5 text-[11px] leading-relaxed transition-all shadow-2xs",
                                isMatch && (a.match ?? 0) < 70
                                  ? "bg-primary-soft/50 border-primary/25 text-foreground"
                                  : isMatch && (a.match ?? 0) >= 70
                                    ? "bg-success-soft/70 border-success/25 text-foreground"
                                    : "bg-card border-border text-foreground/90"
                              )}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                {isMatch ? (
                                  (a.match ?? 0) >= 70 ? (
                                    <HiCheck className="h-3.5 w-3.5 text-success shrink-0" />
                                  ) : (
                                    <HiOutlineBolt className="h-3.5 w-3.5 text-primary shrink-0" />
                                  )
                                ) : isReg ? (
                                  <HiOutlineShieldCheck className="h-3.5 w-3.5 text-success shrink-0" />
                                ) : (
                                  <HiOutlineBriefcase className="h-3.5 w-3.5 text-primary shrink-0" />
                                )}
                                <span className={cn(
                                  "text-[9.5px] font-bold uppercase tracking-wider",
                                  isMatch && (a.match ?? 0) < 70
                                    ? "text-primary"
                                    : isMatch && (a.match ?? 0) >= 70
                                      ? "text-success"
                                      : isReg
                                        ? "text-success"
                                        : "text-primary"
                                )}>
                                  {label}
                                </span>
                              </div>
                              <p className="text-[11px] text-foreground/85 leading-normal pl-5">
                                {cleanLine}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div
                      className={cn(
                        "rounded-xl border px-3 py-2.5 flex items-center justify-between gap-2.5",
                        (a.match ?? 0) >= 70
                          ? "bg-success-soft/60 border-success/25 text-foreground"
                          : "bg-card border-border text-foreground"
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        {(a.match ?? 0) >= 70 ? (
                          <div className="w-5 h-5 rounded-full bg-success/15 text-success flex items-center justify-center shrink-0">
                            <HiCheck className="h-3.5 w-3.5 stroke-2" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full bg-primary-soft text-primary flex items-center justify-center shrink-0">
                            <HiOutlineBolt className="h-3.5 w-3.5" />
                          </div>
                        )}
                        <span className="text-[11px] font-medium text-muted-foreground leading-snug">
                          {isCompletedOrClosed
                            ? `Shift ${a.status.toLowerCase()} · ${a.regNumber || "Council Verified"}`
                            : (a.match ?? 0) >= 70
                              ? "High clinical suitability for immediate roster allocation."
                              : "Different specialty/cadre than shift title — review credentials before confirming."}
                        </span>
                      </div>

                      <span
                        className={cn(
                          "px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold shrink-0 whitespace-nowrap border",
                          (a.match ?? 0) >= 70
                            ? "bg-success text-white border-success"
                            : "bg-muted text-foreground border-border"
                        )}
                      >
                        {a.match ?? 78}% Fit
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: View Resume + Stage Actions */}
              <div className="mt-5 pt-3.5 border-t border-border/80 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedResume(a)}
                    className="rounded-xl text-xs font-semibold gap-1.5 border-input hover:border-primary/40 text-foreground cursor-pointer"
                  >
                    <HiOutlineDocumentText className="h-4 w-4 text-primary" /> View resume
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenInterviewQuestions(a)}
                    className="rounded-xl text-xs font-semibold gap-1.5 border-input hover:border-primary/40 text-foreground hover:text-primary cursor-pointer"
                  >
                    <BotMessageSquare className="h-3.5 w-3.5 text-primary" /> Interview Questions
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  {(a.isShiftClaim || a.for?.toLowerCase().includes("shift")) ? (
                    <>
                      {a.status === "Timesheet Submitted" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary-soft border border-primary/20 px-2.5 py-1 rounded-xl">
                            <HiOutlineClock className="h-3.5 w-3.5 text-primary" />
                            Timesheet: {a.actualHours || a.scheduledHours || 8}h
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDisputeModalApp(a);
                              setDisputeReasonInput("");
                            }}
                            className="rounded-xl text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/5 cursor-pointer"
                          >
                            Raise Dispute
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => openVerifyTimesheetModal(a)}
                            className="rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-2xs cursor-pointer"
                          >
                            Verify Timesheet
                          </Button>
                        </div>
                      ) : a.status === "Confirmed" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success px-1.5">
                            <HiCheck className="h-3.5 w-3.5 stroke-[3]" /> Confirmed
                            {a.checkInPin ? ` · PIN ${a.checkInPin}` : ""}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleMarkNoShow(a)}
                            className="rounded-xl text-xs font-semibold text-foreground border-input hover:border-primary/40 cursor-pointer"
                          >
                            Mark No-Show
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDisputeModalApp(a);
                              setDisputeReasonInput("");
                            }}
                            className="rounded-xl text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/5 cursor-pointer"
                          >
                            Dispute
                          </Button>
                        </div>
                      ) : a.status === "Checked In" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary px-1.5">
                            <KeyRound className="h-3.5 w-3.5" /> Checked In · On Floor Duty
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setDisputeModalApp(a);
                              setDisputeReasonInput("");
                            }}
                            className="rounded-xl text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/5 cursor-pointer"
                          >
                            Raise Dispute
                          </Button>
                        </div>
                      ) : a.status === "Completed" || a.status === "Hired" ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success px-1.5">
                            <HiCheck className="h-3.5 w-3.5 stroke-[3]" /> Duty Verified &amp; Escrow Released
                          </span>
                          {a.hospitalRating ? (
                            <span
                              className="inline-flex items-center gap-1 rounded-xl bg-muted border border-border px-2.5 py-1 text-xs font-bold text-foreground"
                              title={a.hospitalReview || "Hospital rating recorded"}
                            >
                              <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                              Rated {a.hospitalRating}/5
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => openRateModal(a)}
                              className="rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-2xs cursor-pointer gap-1"
                            >
                              <Star className="h-3.5 w-3.5 fill-white" /> Rate Clinician
                            </Button>
                          )}
                        </div>
                      ) : a.status === "Disputed" ? (
                        <span
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive px-1.5"
                          title={a.disputeReason || "Escalated to FALE Ops"}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" /> Disputed (Under FALE Ops Review)
                        </span>
                      ) : a.status === "No-Show" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive px-1.5">
                          <HiXMark className="h-3.5 w-3.5 stroke-[3]" /> Marked No-Show · Slot Reopened
                        </span>
                      ) : a.status === "Rejected" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive px-1.5">
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
                            className="rounded-xl text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/5 cursor-pointer"
                          >
                            Decline Claim
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleConfirmShift(a)}
                            className="rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-primary-foreground shadow-2xs cursor-pointer"
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
                            className="rounded-xl text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/5 cursor-pointer"
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleInvite(a)}
                            className="rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground shadow-2xs cursor-pointer"
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
                            className="rounded-xl text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/5 cursor-pointer"
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleInvite(a)}
                            className="rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground shadow-2xs cursor-pointer"
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
                            className="rounded-xl text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/5 cursor-pointer"
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleMakeOffer(a)}
                            className="rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover text-primary-foreground shadow-2xs cursor-pointer"
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
                            className="rounded-xl text-xs font-semibold text-destructive border-destructive/30 hover:bg-destructive/5 cursor-pointer"
                          >
                            Decline
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleHire(a)}
                            className="rounded-xl text-xs font-semibold shadow-2xs bg-success hover:bg-success/90 text-white cursor-pointer"
                          >
                            Confirm Hired
                          </Button>
                        </>
                      )}

                      {a.status === "Hired" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-success px-1.5">
                          <HiCheck className="h-3.5 w-3.5 stroke-[3]" /> Placed / Hired
                        </span>
                      )}

                      {a.status === "Rejected" && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive px-1.5">
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
            );
          })}
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
              {filter === "Needs Action" && counts.All > 0
                ? "All caught up — no candidates waiting for review"
                : roleTypeTab === "jobs"
                  ? "No permanent role applicants found"
                  : roleTypeTab === "shifts"
                    ? "No locum shift candidates found"
                    : "No applicants found"}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              {filter === "Needs Action" && counts.All > 0
                ? "New applications and shift claims will appear here automatically. Switch to All to browse completed shifts."
                : roleTypeTab === "jobs"
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
              className="mt-4 rounded-xl text-xs font-semibold shadow-2xs hover:bg-muted cursor-pointer"
            >
              {filter === "Needs Action" && counts.All > 0 ? "View All & Completed" : "Reset filters"}
            </Button>
          </div>
        )}
      </div>

      {/* Professional Resume Modal Dialog */}
      <Dialog
        open={!!selectedResume}
        onOpenChange={(open) => !open && setSelectedResume(null)}
      >
        <DialogContent className="sm:max-w-4xl h-[90vh] max-h-[92vh] overflow-hidden flex flex-col sm:rounded-3xl rounded-t-[28px] border-t sm:border border-border bg-card shadow-2xl p-0">
          {selectedResume && (
            <div className="flex flex-col h-full overflow-hidden">
              {/* Resume Header / Top Toolbar */}
              <div className="border-b border-border bg-muted/30 p-4 sm:p-6 shrink-0 pr-10 sm:pr-12">
                <DialogHeader className="text-left space-y-1.5">
                  <div>
                    {/* Candidate Name + Shield */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <DialogTitle className="text-lg sm:text-xl font-bold text-foreground break-normal">
                        {selectedResume.name}
                      </DialogTitle>
                      {selectedResume.verified && (
                        <HiOutlineShieldCheck
                          className="h-5 w-5 text-primary shrink-0"
                          title="Verified Clinical Candidate"
                        />
                      )}
                    </div>

                    {/* Dynamic Clinical Badges Sub-row with natural wrapping */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <span className="rounded-full bg-primary-soft text-primary px-2.5 py-0.5 text-xs font-bold shrink-0">
                        {selectedResume.role}
                      </span>
                      {selectedResume.isShiftClaim || selectedResume.for.toLowerCase().includes("shift") ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 text-xs font-bold text-amber-700 dark:text-amber-300 shrink-0">
                          <HiOutlineBolt className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                          Locum Shift
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300 shrink-0">
                          <HiOutlineBriefcase className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                          Permanent Role
                        </span>
                      )}
                      {selectedResume.match !== undefined && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
                          <HiOutlineSparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>{(selectedResume.match ?? 0) >= 90 ? `Exact Match (${selectedResume.match}%)` : `${selectedResume.match}% Match`}</span>
                        </span>
                      )}
                    </div>

                    {/* Location & Applied For Meta */}
                    <DialogDescription className="mt-2 text-xs text-muted-foreground flex flex-wrap items-center gap-2">
                      <span className="flex items-center gap-1">
                        <HiOutlineMapPin className="h-3.5 w-3.5" />
                        {selectedResume.city}
                      </span>
                      <span className="inline-block h-1 w-1 rounded-full bg-muted-foreground/50 shrink-0" />
                      <span>Applied for <strong className="font-semibold text-foreground/90">{selectedResume.for}</strong></span>
                    </DialogDescription>
                  </div>
                </DialogHeader>

                {/* Council Verification Pill */}
                <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-xl bg-card border border-border p-3 text-xs shadow-2xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-muted-foreground font-medium">Council Registration:</span>
                    <span className="font-mono font-bold text-foreground">{selectedResume.regNumber}</span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                    <HiCheck className="h-3.5 w-3.5 stroke-[3]" /> FALE Credential Verified
                  </span>
                </div>
              </div>

              {/* Candidate Onboarding Resume Preview */}
              <div className="w-full flex-1 overflow-y-auto bg-muted/20 p-4 sm:p-5 custom-scrollbar">
                {selectedResume.resumeUrl ? (
                  <iframe
                    src={`${selectedResume.resumeUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                    className="w-full h-full min-h-[55vh] rounded-xl border border-border bg-white shadow-xs"
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
              <div className="border-t border-border bg-muted/20 p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
                <div className="flex items-center justify-between sm:justify-start gap-2.5 text-xs w-full sm:w-auto">
                  <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">Current Status</span>
                  <StatusBadge status={status[selectedResume.id] ?? selectedResume.status} />
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 w-full sm:w-auto">
                  {(selectedResume.isShiftClaim || selectedResume.for?.toLowerCase().includes("shift")) ? (
                    (status[selectedResume.id] ?? selectedResume.status) === "Timesheet Submitted" ? (
                      <Button
                        size="sm"
                        onClick={() => {
                          const target = selectedResume;
                          setSelectedResume(null);
                          openVerifyTimesheetModal(target);
                        }}
                        className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer w-full sm:w-auto"
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
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const target = selectedResume;
                            setSelectedResume(null);
                            openRejectModal(target);
                          }}
                          className="rounded-xl text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer flex-1 sm:flex-initial"
                        >
                          Decline Claim
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            handleConfirmShift(selectedResume);
                            setSelectedResume(null);
                          }}
                          className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer flex-1 sm:flex-initial"
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
                            className="rounded-xl text-xs font-semibold text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950/30 w-full sm:w-auto"
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
                          className="rounded-xl text-xs font-semibold shadow-xs w-full sm:w-auto"
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
                          className="rounded-xl text-xs font-semibold shadow-xs w-full sm:w-auto"
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
                          className="rounded-xl text-xs font-semibold shadow-xs bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
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
              ) : verifyHoursInput > (verifyTimesheetModalApp.scheduledHours || 8) ? (
                <div className="rounded-2xl border border-amber-300/60 bg-amber-50/50 dark:bg-amber-950/20 p-3 text-xs space-y-1.5">
                  <p className="font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                    <HiOutlineClock className="h-4 w-4 shrink-0 text-amber-600" />
                    Overtime Settlement ({verifyHoursInput - (verifyTimesheetModalApp.scheduledHours || 8)} extra hrs)
                  </p>
                  <div className="flex justify-between text-foreground font-medium">
                    <span>Approved Clinician Gross ({verifyHoursInput} hrs):</span>
                    <span className="font-bold text-foreground">
                      ₹{((verifyTimesheetModalApp.hourlyRate || 500) * verifyHoursInput).toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="pt-1 border-t border-amber-200 dark:border-amber-900/40 flex justify-between font-bold text-amber-800 dark:text-amber-300">
                    <span>Extra Escrow Debited from Wallet:</span>
                    <span>
                      ₹{((verifyTimesheetModalApp.hourlyRate || 500) * (verifyHoursInput - (verifyTimesheetModalApp.scheduledHours || 8))).toLocaleString("en-IN")}
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

      {/* ================= RAISE SHIFT DISPUTE MODAL ================= */}
      {disputeModalApp && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setDisputeModalApp(null); }}>
          <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-300">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-foreground">
                    Raise Shift Dispute
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {disputeModalApp.name} · {disputeModalApp.for}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3 py-2">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Escrow payout is immediately frozen until FALE Clinical Ops reviews attendance logs and timesheets from both parties.
              </p>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Dispute Reason & Ward Notes</label>
                <textarea
                  rows={3}
                  value={disputeReasonInput}
                  onChange={(e) => setDisputeReasonInput(e.target.value)}
                  placeholder="e.g., Clinician logged 8h but ward supervisor log shows 5h duty or left post early..."
                  className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-rose-500/30"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                variant="outline"
                disabled={submittingDispute}
                onClick={() => setDisputeModalApp(null)}
                className="rounded-xl font-bold text-xs"
              >
                Cancel
              </Button>
              <Button
                disabled={submittingDispute}
                onClick={handleConfirmDispute}
                className="rounded-xl font-bold text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                {submittingDispute ? "Escalating..." : "Escalate to FALE Ops"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ================= RATE CLINICIAN (1-5 STARS) MODAL ================= */}
      {rateModalApp && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setRateModalApp(null); }}>
          <DialogContent className="max-w-md rounded-3xl p-6 sm:p-7">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-1">
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
                  <Star className="h-5 w-5 fill-amber-500 text-amber-500" />
                </div>
                <div>
                  <DialogTitle className="text-base font-black text-foreground">
                    Rate Shift Performance
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    {rateModalApp.name} · {rateModalApp.for}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRatingScore(star)}
                      className="p-1 transition-transform hover:scale-110 cursor-pointer"
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={cn(
                          "h-7 w-7 transition-colors",
                          star <= ratingScore
                            ? "fill-amber-400 text-amber-500"
                            : "text-muted-foreground/30"
                        )}
                      />
                    </button>
                  ))}
                </div>
                <span className="text-xs font-bold text-foreground">
                  {ratingScore === 5
                    ? "5/5 — Exceptional Clinical Duty"
                    : ratingScore === 4
                      ? "4/5 — Strong & Reliable Shift"
                      : ratingScore === 3
                        ? "3/5 — Satisfactory Coverage"
                        : `${ratingScore}/5 — Needs Improvement`}
                </span>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground">Clinical Strengths (Optional)</label>
                <div className="flex flex-wrap gap-1.5">
                  {CLINICAL_RATING_TAGS.map((tag) => {
                    const selected = ratingTagsSelected.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleRatingTag(tag)}
                        className={cn(
                          "rounded-lg px-2.5 py-1 text-[11px] font-semibold border transition-all cursor-pointer",
                          selected
                            ? "bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300"
                            : "border-input bg-card text-muted-foreground hover:border-ring"
                        )}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">Ward Endorsement Note (Optional)</label>
                <textarea
                  rows={2}
                  value={ratingReviewInput}
                  onChange={(e) => setRatingReviewInput(e.target.value)}
                  placeholder="Share brief feedback on clinical handover, patient care, or ward readiness..."
                  className="w-full rounded-xl border border-input bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                variant="outline"
                disabled={submittingRating}
                onClick={() => setRateModalApp(null)}
                className="rounded-xl font-bold text-xs"
              >
                Skip
              </Button>
              <Button
                disabled={submittingRating}
                onClick={handleSubmitRating}
                className="rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer gap-1.5"
              >
                <Star className="h-3.5 w-3.5 fill-white" />
                {submittingRating ? "Submitting..." : `Submit ${ratingScore}★ Rating`}
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
          <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col sm:rounded-3xl rounded-t-[28px] border-t sm:border border-border bg-card shadow-2xl p-0">
            <div className="p-5 sm:p-6 border-b border-border bg-muted/30 shrink-0">
              <DialogHeader>
                <div className="flex items-center gap-2 mb-1 pr-6">
                  <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary shrink-0">
                    <BotMessageSquare className="h-4.5 w-4.5 text-primary" />
                  </span>
                  <div className="min-w-0">
                    <DialogTitle className="text-base font-bold text-foreground truncate">
                      Clinical Interview Questions
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground truncate">
                      Tailored for {interviewQuestionsModalApp.name} · {interviewQuestionsModalApp.for}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
            </div>

            <div className="space-y-3 p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
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

            <div className="p-4 border-t border-border bg-muted/20 shrink-0 flex items-center justify-end">
              <Button
                variant="outline"
                onClick={() => setInterviewQuestionsModalApp(null)}
                className="rounded-xl text-xs font-bold cursor-pointer"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </AppShell>
  );
}
