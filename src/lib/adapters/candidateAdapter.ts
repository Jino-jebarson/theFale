// src/lib/adapters/candidateAdapter.ts
// Candidate adapter for Student and Graduate profiles, documents, and onboarding

import { apiFetch, paiseToRupees, rupeesToPaise } from "@/lib/api";

export interface CandidateDocument {
  id: string;
  documentType: string;
  originalFileName: string;
  fileUrl: string;
  fileSizeBytes: number;
  mimeType: string;
  verified: boolean;
  createdAt: string;
}

export interface CandidatePayoutMethod {
  id?: string;
  methodType: "upi" | "bank";
  upiId?: string;
  accountNumber?: string;
  confirmAccountNumber?: string;
  accountNumberLast4?: string;
  ifsc?: string;
  bankName?: string;
  accountHolderName: string;
  status?: string;
  verifiedAt?: string;
}

export interface StudentUpgradeRequest {
  id?: string;
  qualification: string;
  council: string;
  regNumber: string;
  status?: "PENDING" | "APPROVED" | "REJECTED";
  adminNotes?: string;
  createdAt?: string;
  reviewedAt?: string;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  name: string;
  email?: string;
  phone?: string;
  gender?: string;
  dob?: string;
  city: string;
  state?: string;
  pincode?: string;
  addressLine?: string;
  candidateLevel: "STUDENT" | "FRESHER" | "PROFESSIONAL";
  isStudent: boolean;
  course?: string;
  college?: string;
  studyYear?: string;
  universityRegNo?: string;
  expectedGraduationYear?: number;
  profession?: string;
  specialty?: string;
  subSpecialties?: string[];
  qualification?: string;
  council?: string;
  councilState?: string;
  regNumber?: string;
  regYear?: string;
  experienceYears?: string;
  bio?: string;
  expectedSalaryMinPaise?: number;
  expectedSalaryMaxPaise?: number;
  expectedSalaryMinRupees?: number;
  expectedSalaryMaxRupees?: number;
  currentSalary?: string;
  noticePeriod?: string;
  employmentType?: string;
  availability?: string;
  skills?: string[];
  languages?: string[];
  preferredCities?: string[];
  openToWork?: boolean;
  relocate?: boolean;
  kycStatus: "PENDING" | "VERIFIED" | "REJECTED";
  kycNotes?: string;
  isMentor?: boolean;
  mentorStatus?: string;
  verifiedAt?: string;
  createdAt?: string;
  documents: CandidateDocument[];
  payoutMethod?: CandidatePayoutMethod;
  activeUpgradeRequest?: StudentUpgradeRequest;
}

export interface CandidateOnboardingPayload {
  fullName: string;
  email?: string;
  gender?: string;
  dob?: string;
  city: string;
  state?: string;
  pincode?: string;
  addressLine?: string;
  candidateLevel?: "STUDENT" | "FRESHER" | "PROFESSIONAL";
  course?: string;
  collegeName?: string;
  studyYear?: string;
  universityRegNo?: string;
  expectedGraduationYear?: number;
  profession?: string;
  primarySpecialty?: string;
  subSpecialties?: string[];
  qualification?: string;
  council?: string;
  councilRegistrationNumber?: string;
  councilState?: string;
  regYear?: string;
  experienceYears?: string;
  bio?: string;
  expectedSalaryMinRupees?: number;
  expectedSalaryMaxRupees?: number;
  currentSalary?: string;
  noticePeriod?: string;
  employmentType?: string;
  availability?: string;
  openToWork?: boolean;
  relocate?: boolean;
  preferredCities?: string[];
  skills?: string[];
  languages?: string[];
  profilePhotoUrl?: string;
  profilePhotoFileName?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  registrationCertificateUrl?: string;
  registrationCertificateFileName?: string;
  qualificationCertificateUrl?: string;
  qualificationCertificateFileName?: string;
  identityProofUrl?: string;
  identityProofFileName?: string;
  bonafideCertificateUrl?: string;
  bonafideCertificateFileName?: string;
  studentIdCardUrl?: string;
  studentIdCardFileName?: string;
}

/**
 * Fetch candidate profile from Spring Boot backend.
 */
export async function getCandidateProfile(): Promise<CandidateProfile> {
  const profile = await apiFetch<CandidateProfile>("/candidates/me/profile");
  return {
    ...profile,
    expectedSalaryMinRupees: paiseToRupees(profile.expectedSalaryMinPaise),
    expectedSalaryMaxRupees: paiseToRupees(profile.expectedSalaryMaxPaise),
  };
}

/**
 * Toggle candidate open to clinical opportunities status.
 */
export async function updateOpenToWork(openToWork: boolean): Promise<CandidateProfile> {
  const profile = await apiFetch<CandidateProfile>("/candidates/me/open-to-work", {
    method: "PATCH",
    body: JSON.stringify({ openToWork }),
  });

  return {
    ...profile,
    expectedSalaryMinRupees: paiseToRupees(profile.expectedSalaryMinPaise),
    expectedSalaryMaxRupees: paiseToRupees(profile.expectedSalaryMaxPaise),
  };
}

/**
 * Submit candidate onboarding (Student, Fresher, or Professional).
 */
export async function onboardCandidate(data: CandidateOnboardingPayload): Promise<CandidateProfile> {
  const body = {
    ...data,
    expectedSalaryMinPaise: data.expectedSalaryMinRupees
      ? rupeesToPaise(data.expectedSalaryMinRupees)
      : undefined,
    expectedSalaryMaxPaise: data.expectedSalaryMaxRupees
      ? rupeesToPaise(data.expectedSalaryMaxRupees)
      : undefined,
  };

  const profile = await apiFetch<CandidateProfile>("/candidates/onboarding", {
    method: "POST",
    body: JSON.stringify(body),
  });

  return {
    ...profile,
    expectedSalaryMinRupees: paiseToRupees(profile.expectedSalaryMinPaise),
    expectedSalaryMaxRupees: paiseToRupees(profile.expectedSalaryMaxPaise),
  };
}

/**
 * Update candidate profile.
 */
export async function updateCandidateProfile(data: Partial<CandidateOnboardingPayload>): Promise<CandidateProfile> {
  const body = {
    ...data,
    expectedSalaryMinPaise: data.expectedSalaryMinRupees
      ? rupeesToPaise(data.expectedSalaryMinRupees)
      : undefined,
    expectedSalaryMaxPaise: data.expectedSalaryMaxRupees
      ? rupeesToPaise(data.expectedSalaryMaxRupees)
      : undefined,
  };

  const profile = await apiFetch<CandidateProfile>("/candidates/me/profile", {
    method: "PUT",
    body: JSON.stringify(body),
  });

  return {
    ...profile,
    expectedSalaryMinRupees: paiseToRupees(profile.expectedSalaryMinPaise),
    expectedSalaryMaxRupees: paiseToRupees(profile.expectedSalaryMaxPaise),
  };
}

/**
 * Record document metadata in candidate profile.
 */
export async function uploadCandidateDocument(
  documentType: string,
  originalFileName: string,
  fileUrl: string
): Promise<CandidateDocument> {
  const params = new URLSearchParams({
    documentType,
    originalFileName,
    fileUrl,
  });
  return apiFetch<CandidateDocument>(`/candidates/me/documents?${params.toString()}`, {
    method: "POST",
  });
}

/**
 * Delete a candidate document.
 */
export async function deleteCandidateDocument(documentId: string): Promise<void> {
  await apiFetch(`/candidates/me/documents/${documentId}`, {
    method: "DELETE",
  });
}

/**
 * Request an upgrade from Student to Graduate candidate upon degree completion.
 */
export async function requestStudentUpgrade(data: {
  qualification: string;
  council: string;
  regNumber: string;
}): Promise<StudentUpgradeRequest> {
  return apiFetch<StudentUpgradeRequest>("/candidates/upgrade-request", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Save or update candidate payout bank account or UPI ID.
 */
export async function savePayoutMethod(data: CandidatePayoutMethod): Promise<CandidatePayoutMethod> {
  return apiFetch<CandidatePayoutMethod>("/candidates/me/payout-methods", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * Get configured candidate payout destination.
 */
export async function getPayoutMethod(): Promise<CandidatePayoutMethod | null> {
  return apiFetch<CandidatePayoutMethod | null>("/candidates/me/payout-methods");
}

/**
 * Export standardized verified CV.
 */
export async function exportCandidateCv(): Promise<string> {
  return apiFetch<string>("/candidates/me/export-cv");
}

export interface CandidateViewStats {
  totalViews: number;
  viewsToday: number;
  hospitalsViewedToday: number;
  weeklyGrowthPercent: number;
  hasIncreased: boolean;
}

/**
 * Get dynamic institutional view analytics for candidate profile.
 */
export async function getCandidateViewStats(): Promise<CandidateViewStats> {
  return apiFetch<CandidateViewStats>("/candidates/me/view-stats");
}

/**
 * Record an institutional view when a facility or recruiter views a candidate profile.
 */
export async function recordCandidateProfileView(candidateId: string, facilityName?: string): Promise<void> {
  const query = facilityName ? `?facilityName=${encodeURIComponent(facilityName)}` : "";
  await apiFetch(`/candidates/${candidateId}/view${query}`, { method: "POST" });
}


