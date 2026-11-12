// src/lib/adapters/applicationAdapter.ts
// Application tracking and withdrawal adapter

import { apiFetch } from "@/lib/api";

export interface JobApplicationDto {
  id: string;
  jobId: string;
  jobTitle?: string;
  candidateId?: string;
  candidateName?: string;
  candidateRole?: string;
  candidateSpecialty?: string;
  candidateCity?: string;
  candidateState?: string;
  candidateQualification?: string;
  candidateCouncil?: string;
  candidateBio?: string;
  candidateNoticePeriod?: string;
  expectedSalaryMinPaise?: number;
  expectedSalaryMaxPaise?: number;
  candidateExperience?: string;
  candidatePhone?: string;
  candidateEmail?: string;
  councilVerified?: boolean;
  regNumber?: string;
  facilityName?: string;
  department?: string;
  city?: string;
  status: string;
  matchScore?: number;
  appliedAt?: string;
  interviewScheduledAt?: string;
  interviewLocationOrLink?: string;
  withdrawalReason?: string;
  candidateDocuments?: Array<{
    id: string;
    documentType: string;
    originalFileName: string;
    fileUrl: string;
    fileSizeBytes: number;
    mimeType: string;
    verified: boolean;
    createdAt?: string;
  }>;
}

export interface UiApplicationItem {
  id: string;
  jobId: string;
  title: string;
  org: string;
  city: string;
  dept: string;
  status: string;
  date: string;
}

export function mapApplicationStatus(status: string): string {
  switch (status?.toUpperCase()) {
    case "PENDING_ADMIN":
    case "UNDER_ADMIN_SCREENING":
    case "PENDING":
    case "NEW":
    case "SUBMITTED":
    case "APPLIED":
      return "Applied";
    case "SHORTLISTED":
    case "UNDER_REVIEW":
    case "IN_REVIEW":
      return "Under review";
    case "INTERVIEW":
    case "INTERVIEW_SCHEDULED":
      return "Interview";
    case "CONFIRMED":
    case "OFFER":
    case "OFFER_EXTENDED":
      return "Offer";
    case "HIRED":
    case "ACCEPTED":
      return "Hired";
    case "WITHDRAWN":
      return "Withdrawn";
    case "REJECTED":
      return "Not selected";
    default: {
      if (!status) return "Applied";
      const s = status.toLowerCase();
      if (s.includes("withdrawn")) return "Withdrawn";
      if (s.includes("reject")) return "Not selected";
      if (s.includes("hire") || s.includes("accept")) return "Hired";
      if (s.includes("offer") || s.includes("confirm")) return "Offer";
      if (s.includes("interview")) return "Interview";
      if (s.includes("review") || s.includes("shortlist")) return "Under review";
      return "Applied";
    }
  }
}

/**
 * Fetch candidate's active and historical job applications.
 */
export async function getMyApplications(): Promise<UiApplicationItem[]> {
  const dtos = await apiFetch<JobApplicationDto[]>("/applications/me", { validate: Array.isArray });
  return dtos.map((dto) => {
    const dateFormatted = dto.appliedAt
      ? new Date(dto.appliedAt).toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "Recent";

    return {
      id: dto.id,
      jobId: dto.jobId,
      title: dto.jobTitle || "Healthcare Role",
      org: dto.facilityName || "Hospital Partner",
      city: dto.city || "Chennai",
      dept: dto.department || "Clinical",
      status: mapApplicationStatus(dto.status),
      date: dateFormatted,
    };
  });
}

/**
 * Withdraw an active candidate application.
 */
export async function withdrawApplication(id: string, reason?: string): Promise<void> {
  const payload = reason ? { reason: reason.slice(0, 255) } : {};
  await apiFetch(`/applications/${id}/withdraw`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
