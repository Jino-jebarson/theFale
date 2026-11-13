// src/lib/adapters/facilityAdapter.ts
// Facility profile, job postings, applicants pipeline, wallet, and candidate sourcing credits

import { apiFetch, paiseToRupees, rupeesToPaise } from "@/lib/api";
import { type JobPostingDto } from "@/lib/adapters/jobAdapter";

export interface FacilityProfileDto {
  id: string;
  userId?: string;
  hospitalName: string;
  facilityType?: string;
  size?: string;
  about?: string;
  website?: string;
  city: string;
  state?: string;
  pincode?: string;
  addressLine?: string;
  beds?: number;
  icuBeds?: number;
  licenseNumber?: string;
  gst?: string;
  nabhNumber?: string;
  accreditationLevel?: string;
  contactPerson?: string;
  designation?: string;
  contactPhone?: string;
  contactEmail?: string;
  departments?: string[];
  hiringNeeds?: string[];
  logoUrl?: string;
  facilityPhotos?: string[];
  documents?: FacilityDocumentDto[];
  kycStatus: string;
  verifiedAt?: string;
}

export interface FacilityDocumentDto {
  id: string;
  documentType: string;
  originalFileName: string;
  fileUrl: string;
  fileSizeBytes?: number;
  mimeType?: string;
  verified?: boolean;
  createdAt?: string;
}

export interface FacilityWalletDto {
  id: string;
  facilityId: string;
  availableBalancePaise: number;
  lockedEscrowBalancePaise: number;
  totalDisbursedPaise: number;
  candidateCredits: number;
  updatedAt?: string;
}

export interface WalletTransactionDto {
  canonicalDocument?: boolean | undefined;
  claimId?: string | undefined;
  reviewedAt?: string | undefined;
  reviewNotes?: string | undefined;
  destinationSnapshot?: string | undefined;
  bankDisbursedAt?: string | undefined;
  platformFeePaise?: number | null;
  platformFeeGstPaise?: number | null;
  id: string;
  walletId?: string;
  type: string;
  amountPaise: number;
  balanceAfterPaise?: number;
  status: string;
  refNumber?: string;
  utr?: string;
  title: string;
  subtitle?: string;
  invoiceId?: string;
  createdAt: string;
}

export interface HospitalBankAccountDto {
  id: string;
  facilityId?: string;
  accountHolderName: string;
  bankName: string;
  accountNumberMasked?: string;
  accountNumberLast4?: string;
  ifsc?: string;
  ifscCode?: string;
  branch?: string;
  accountType?: string;
  status?: string;
  verificationStatus?: string;
  verifiedAt?: string;
}

export interface CandidateResdexDto {
  id: string;
  candidateId?: string;
  name: string;
  profession: string;
  specialty: string;
  qualification: string;
  council: string;
  regNumber?: string;
  regNumberMasked?: string;
  city: string;
  experienceYears: string;
  kycStatus?: string;
  verified: boolean;
  matchScore?: number;
  phone?: string;
  email?: string;
  phoneMasked?: string;
  emailMasked?: string;
  isUnlocked: boolean;
  isContactUnlocked?: boolean;
  unlockedPhone?: string;
  unlockedEmail?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  openToWork?: boolean;
}

export interface PostJobPayload {
  title: string;
  department: string;
  employmentType: string;
  isInternship: boolean;
  city: string;
  workLocation?: string;
  openings: number;
  salaryMinPaise: number;
  salaryMaxPaise: number;
  experienceRequired: string;
  qualificationRequired: string;
  description: string;
}

export interface FacilityOnboardPayload {
  hospitalName: string;
  facilityType: string;
  size?: string;
  about?: string;
  website?: string;
  city: string;
  state: string;
  pincode?: string;
  addressLine?: string;
  beds: number;
  icuBeds?: number;
  licenseNumber: string;
  gst?: string;
  nabhNumber?: string;
  accreditationLevel?: string;
  contactPerson: string;
  designation?: string;
  contactPhone: string;
  contactEmail: string;
  departments?: string[];
  hiringNeeds?: string[];
  logoUrl?: string;
  facilityPhotos?: string[];
  facilityRegistrationUrl?: string;
  facilityRegistrationFileName?: string;
  gstCertificateUrl?: string;
  gstCertificateFileName?: string;
  representativeAuthorizationUrl?: string;
  representativeAuthorizationFileName?: string;
  nabhCertificateUrl?: string;
  nabhCertificateFileName?: string;
  fireSafetyClearanceUrl?: string;
  fireSafetyClearanceFileName?: string;
  pollutionControlClearanceUrl?: string;
  pollutionControlClearanceFileName?: string;
  biomedicalWasteClearanceUrl?: string;
  biomedicalWasteClearanceFileName?: string;
  documents?: { documentType: string; originalFileName: string; fileUrl: string }[];
}

export async function onboardFacility(payload: FacilityOnboardPayload): Promise<FacilityProfileDto> {
  return apiFetch<FacilityProfileDto>("/facility/onboard", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getFacilityProfile(): Promise<FacilityProfileDto> {
  return apiFetch<FacilityProfileDto>("/facility/profile", { cacheMs: 60000 });
}

export async function updateFacilityProfile(data: Partial<FacilityProfileDto>): Promise<FacilityProfileDto> {
  return apiFetch<FacilityProfileDto>("/facility/profile", {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function getFacilityJobs(): Promise<JobPostingDto[]> {
  return apiFetch<JobPostingDto[]>("/facility/jobs", { validate: Array.isArray });
}

export async function postFacilityJob(payload: PostJobPayload): Promise<JobPostingDto> {
  return apiFetch<JobPostingDto>("/facility/jobs", {
    method: "POST",
    validate: (value) => Boolean(value && typeof value === "object" && "id" in value && typeof value.id === "string"),
    headers: {
      "Idempotency-Key": `job-post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
    body: JSON.stringify(payload),
  });
}

export async function getFacilityApplicants(jobId?: string, status?: string): Promise<any[]> {
  const params = new URLSearchParams();
  if (jobId) params.append("jobId", jobId);
  if (status) params.append("status", status);
  const q = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<any[]>(`/employer/applications${q}`, { validate: Array.isArray });
}

export async function updateApplicantStatus(
  applicationId: string,
  status: string,
  notes?: string,
  interviewScheduledAt?: string,
  interviewLocationOrLink?: string,
  actualHours?: number
): Promise<any> {
  return apiFetch(`/employer/applications/${applicationId}/status`, {
    method: "PUT",
    body: JSON.stringify({
      status,
      notes,
      interviewScheduledAt,
      interviewLocationOrLink,
      actualHours,
    }),
  });
}

export async function searchTalentCandidates(
  query?: string,
  specialty?: string,
  city?: string
): Promise<CandidateResdexDto[]> {
  const params = new URLSearchParams();
  if (query) params.append("query", query);
  if (specialty) params.append("specialty", specialty);
  if (city) params.append("city", city);
  const q = params.toString() ? `?${params.toString()}` : "";
  return apiFetch<CandidateResdexDto[]>(`/employer/candidates${q}`, { validate: Array.isArray });
}

export async function unlockCandidateContact(candidateId: string): Promise<CandidateResdexDto> {
  return apiFetch<CandidateResdexDto>(`/employer/candidates/${candidateId}/unlock`, {
    method: "POST",
    headers: {
      "Idempotency-Key": `unlock-${candidateId}-${Date.now()}`,
    },
  });
}

export async function getFacilityWallet(): Promise<FacilityWalletDto> {
  return apiFetch<FacilityWalletDto>("/employer/wallet");
}

export async function getWalletTransactions(): Promise<WalletTransactionDto[]> {
  return apiFetch<WalletTransactionDto[]>("/employer/wallet/transactions", { validate: Array.isArray });
}

export async function topUpWallet(amountPaise: number, utr: string, paymentMethod?: string): Promise<FacilityWalletDto> {
  return apiFetch<FacilityWalletDto>("/employer/wallet/topup", {
    method: "POST",
    headers: {
      "Idempotency-Key": `topup-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
    body: JSON.stringify({
      amountPaise,
      utr,
      paymentMethod: paymentMethod || "NEFT_RTGS",
    }),
  });
}

export async function buyCandidateCredits(packageId: string, credits: number, pricePaise: number): Promise<FacilityWalletDto> {
  return apiFetch<FacilityWalletDto>("/employer/wallet/buy-credits", {
    method: "POST",
    headers: {
      "Idempotency-Key": `credits-buy-${Date.now()}-${packageId}`,
    },
    body: JSON.stringify({
      packageId,
      credits,
      pricePaise,
    }),
  });
}

export async function getHospitalBankAccount(): Promise<HospitalBankAccountDto> {
  return apiFetch<HospitalBankAccountDto>("/facility/bank-account");
}

export async function updateHospitalBankAccount(data: {
  accountHolderName: string;
  bankName: string;
  accountNumber: string;
  ifscCode?: string;
  ifsc?: string;
  branch?: string;
  accountType?: string;
}): Promise<HospitalBankAccountDto> {
  return apiFetch<HospitalBankAccountDto>("/facility/bank-account", {
    method: "PUT",
    body: JSON.stringify({
      accountHolderName: data.accountHolderName,
      bankName: data.bankName,
      accountNumber: data.accountNumber,
      ifsc: (data.ifsc || data.ifscCode || "").trim().toUpperCase(),
      branch: data.branch || "Main Corporate Branch",
      accountType: data.accountType || "Current",
    }),
  });
}

export async function uploadFacilityDocument(data: {
  documentType: string;
  originalFileName: string;
  fileUrl: string;
}): Promise<FacilityDocumentDto> {
  return apiFetch<FacilityDocumentDto>("/facility/documents", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getFacilityDocuments(): Promise<FacilityDocumentDto[]> {
  return apiFetch<FacilityDocumentDto[]>("/facility/documents", { validate: Array.isArray });
}

export async function deleteFacilityDocument(id: string): Promise<void> {
  return apiFetch<void>(`/facility/documents/${id}`, {
    method: "DELETE",
  });
}

export function formatApplicationStatus(status?: string): string {
  switch (status?.toUpperCase()) {
    case "INTERVIEW":
    case "INTERVIEW_SCHEDULED":
      return "Interview";
    case "OFFER":
    case "OFFERED":
      return "Offer";
    case "CONFIRMED":
      return "Confirmed";
    case "IN_PROGRESS":
    case "CHECKED_IN":
      return "Checked In";
    case "COMPLETED":
      return "Completed";
    case "DISPUTED":
      return "Disputed";
    case "NO_SHOW":
      return "No-Show";
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
    case "CANCELLED":
      return "Cancelled";
    case "WITHDRAWN":
      return "Withdrawn";
    case "SHORTLISTED":
    default:
      return "Shortlisted";
  }
}

export function attachFocusAndPollRefresh(onRefresh: () => void, intervalMs = 15000): () => void {
  if (typeof window === "undefined") {
    return () => {};
  }

  let lastRefresh = Date.now();
  const refresh = () => {
    if (document.visibilityState !== "visible") return;
    const now = Date.now();
    // Focus and visibilitychange commonly fire together.
    if (now - lastRefresh < Math.min(intervalMs, 5000)) return;
    lastRefresh = now;
    onRefresh();
  };
  const handleFocus = refresh;

  const handleVisibilityChange = () => {
    if (document.visibilityState === "visible") {
      refresh();
    }
  };

  window.addEventListener("focus", handleFocus);
  document.addEventListener("visibilitychange", handleVisibilityChange);

  const timerId = window.setInterval(() => {
    if (document.visibilityState === "visible") {
      refresh();
    }
  }, intervalMs);

  return () => {
    window.removeEventListener("focus", handleFocus);
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.clearInterval(timerId);
  };
}
