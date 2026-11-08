// src/lib/adapters/adminAdapter.ts
// Compliance Admin Operations Console adapter

import { apiFetch } from "@/lib/api";
import { type JobPostingDto } from "@/lib/adapters/jobAdapter";
import { type JobApplicationDto } from "@/lib/adapters/applicationAdapter";
import { type FacilityProfileDto } from "@/lib/adapters/facilityAdapter";
import { type CandidateProfileDto } from "@/lib/adapters/candidateAdapter";
import { type LocumShiftDto, type ShiftClaimDto } from "@/lib/adapters/shiftAdapter";
import { type MentorApplicationDto } from "@/lib/adapters/huddleAdapter";
export type { MentorApplicationDto };

export interface AdminDashboardMetricsDto {
  pendingCandidateKycCount: number;
  pendingFacilityKycCount: number;
  pendingPostingsCount: number;
  pendingApplicationsCount?: number;
  pendingShiftPayoutsCount: number;
  flaggedHuddlePostsCount: number;
  studentUpgradeRequestsCount: number;
  totalCandidatesCount?: number;
  verifiedCandidatesCount?: number;
  totalFacilitiesCount?: number;
  verifiedFacilitiesCount?: number;
  totalPostingsCount?: number;
  activePostingsCount?: number;
  totalApplicationsCount?: number;
  shortlistedApplicationsCount?: number;
  slaTurnaroundHours?: number;
  slaOnTimePercentage?: number;
  cadreBreakdown?: Record<string, number>;
}

export interface StudentUpgradeRequestDto {
  id: string;
  candidateId: string;
  candidateName?: string;
  qualification: string;
  council: string;
  regNumber: string;
  regYear?: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
}

export interface FlaggedHuddlePostDto {
  id: string;
  authorId?: string;
  authorName?: string;
  authorRole?: string;
  title: string;
  body: string;
  type: string;
  field: string;
  status: string;
  upvotes: number;
  flagCount: number;
  isPinned?: boolean;
  imageUrl?: string;
  image?: string;
  isAnonymous?: boolean;
  anon?: boolean;
  createdAt: string;
}

export interface AuditEventDto {
  id: string;
  actorId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  details?: Record<string, any>;
  createdAt: string;
}

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetricsDto> {
  return apiFetch<AdminDashboardMetricsDto>("/admin/dashboard");
}

export async function getPendingJobPostings(status?: string): Promise<JobPostingDto[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<JobPostingDto[]>(`/admin/postings${query}`);
}

export async function approveJobPosting(postingId: string): Promise<void> {
  await apiFetch(`/admin/postings/${postingId}/approve`, {
    method: "POST",
    body: JSON.stringify({ action: "APPROVE", notes: "Approved by Admin" }),
  });
}

export async function rejectJobPosting(postingId: string, reason: string): Promise<void> {
  await apiFetch(`/admin/postings/${postingId}/reject`, {
    method: "POST",
    body: JSON.stringify({ action: "REJECT", notes: reason }),
  });
}

export async function getAdminApplications(status?: string): Promise<JobApplicationDto[]> {
  const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<JobApplicationDto[]>(`/admin/applications${query}`);
}

export async function screenApplication(
  applicationId: string,
  action: "SHORTLIST" | "REJECT",
  notes?: string
): Promise<void> {
  await apiFetch(`/admin/applications/${applicationId}/screening`, {
    method: "PATCH",
    body: JSON.stringify({ action, notes: notes || "" }),
  });
}

export async function getPendingFacilityKyc(status?: string): Promise<FacilityProfileDto[]> {
  const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<FacilityProfileDto[]>(`/admin/kyc/facilities${query}`);
}

export async function reviewFacilityKyc(
  facilityId: string,
  action: "APPROVE" | "REJECT",
  notes?: string
): Promise<void> {
  const endpoint = action === "APPROVE" ? "approve" : "reject";
  await apiFetch(`/admin/kyc/facilities/${facilityId}/${endpoint}`, {
    method: "POST",
    body: JSON.stringify({ action, notes }),
  });
}

export async function getPendingCandidateKyc(status?: string): Promise<CandidateProfileDto[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<CandidateProfileDto[]>(`/admin/kyc/candidates${query}`);
}

export async function reviewCandidateKyc(
  candidateId: string,
  action: "APPROVE" | "REJECT",
  notes?: string
): Promise<void> {
  const endpoint = action === "APPROVE" ? "verify" : "reject";
  await apiFetch(`/admin/kyc/candidates/${candidateId}/${endpoint}`, {
    method: "POST",
    body: JSON.stringify({ action, notes }),
  });
}

export async function getPendingStudentUpgrades(): Promise<StudentUpgradeRequestDto[]> {
  return apiFetch<StudentUpgradeRequestDto[]>("/admin/candidates/upgrade-requests");
}

export async function reviewStudentUpgrade(
  upgradeId: string,
  action: "APPROVE" | "REJECT",
  notes?: string
): Promise<void> {
  const endpoint = action === "APPROVE" ? "approve" : "reject";
  await apiFetch(`/admin/candidates/upgrade-requests/${upgradeId}/${endpoint}`, {
    method: "POST",
    body: JSON.stringify({ action, notes }),
  });
}

export async function getFlaggedHuddlePosts(): Promise<FlaggedHuddlePostDto[]> {
  return apiFetch<FlaggedHuddlePostDto[]>("/admin/huddle/flagged");
}

export async function getReviewCases(): Promise<FlaggedHuddlePostDto[]> {
  return apiFetch<FlaggedHuddlePostDto[]>("/admin/huddle/cases");
}

export async function approveReviewCase(postId: string): Promise<FlaggedHuddlePostDto> {
  return apiFetch<FlaggedHuddlePostDto>(`/admin/huddle/cases/${postId}/approve`, {
    method: "POST",
  });
}

export async function rejectReviewCase(postId: string): Promise<void> {
  await apiFetch(`/admin/huddle/cases/${postId}/reject`, {
    method: "POST",
  });
}

export async function moderateHuddlePost(postId: string, remove: boolean): Promise<void> {
  await apiFetch(`/admin/huddle/posts/${postId}/moderate?remove=${remove}`, {
    method: "POST",
  });
}

export async function togglePinHuddlePost(postId: string): Promise<FlaggedHuddlePostDto> {
  return apiFetch<FlaggedHuddlePostDto>(`/admin/huddle/posts/${postId}/pin`, {
    method: "POST",
  });
}

export async function getAuditLogs(): Promise<AuditEventDto[]> {
  return apiFetch<AuditEventDto[]>("/admin/audit-logs");
}

export async function getPendingShifts(status?: string): Promise<LocumShiftDto[]> {
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<LocumShiftDto[]>(`/admin/shifts${query}`);
}

export async function approveShift(shiftId: string): Promise<void> {
  await apiFetch(`/admin/shifts/${shiftId}/approve`, {
    method: "POST",
    body: JSON.stringify({ action: "APPROVE", notes: "Shift approved by compliance admin" }),
  });
}

export async function rejectShift(shiftId: string, notes?: string): Promise<void> {
  await apiFetch(`/admin/shifts/${shiftId}/reject`, {
    method: "POST",
    body: JSON.stringify({ action: "REJECT", notes: notes || "Shift does not meet compliance requirements" }),
  });
}

export async function getPendingShiftClaims(): Promise<ShiftClaimDto[]> {
  return apiFetch<ShiftClaimDto[]>("/admin/shifts/claims/pending");
}

export async function screenShiftClaim(
  claimId: string,
  action: "APPROVE" | "REJECT",
  notes?: string
): Promise<void> {
  await apiFetch(`/admin/shifts/claims/${claimId}/screen`, {
    method: "POST",
    body: JSON.stringify({ action: action === "APPROVE" ? "SHORTLIST" : "REJECT", notes: notes || "" }),
  });
}

export async function getPendingPayouts(): Promise<ShiftClaimDto[]> {
  return apiFetch<ShiftClaimDto[]>("/admin/payouts/pending");
}

export async function disbursePayout(
  claimId: string,
  utr: string,
  notes?: string
): Promise<void> {
  await apiFetch(`/admin/payouts/${claimId}/disburse`, {
    method: "POST",
    body: JSON.stringify({ utr, notes: notes || "Escrow payout disbursed via automated NEFT/IMPS" }),
  });
}

export async function getAdminMentorApplications(): Promise<MentorApplicationDto[]> {
  return apiFetch<MentorApplicationDto[]>("/admin/huddle/mentors");
}

export async function reviewAdminMentorApplication(
  id: string,
  approve: boolean,
  notes?: string
): Promise<MentorApplicationDto> {
  const params = new URLSearchParams();
  params.append("approve", String(approve));
  if (notes) params.append("notes", notes);
  return apiFetch<MentorApplicationDto>(`/admin/huddle/mentors/${id}/review?${params.toString()}`, {
    method: "POST",
  });
}

export async function toggleAdminMentorSeal(id: string): Promise<MentorApplicationDto> {
  return apiFetch<MentorApplicationDto>(`/admin/huddle/mentors/${id}/toggle`, {
    method: "POST",
  });
}

export async function onboardAdminMentor(mentor: {
  name: string;
  role: string;
  org: string;
  yrs: number;
  specialties?: string[];
}): Promise<MentorApplicationDto> {
  return apiFetch<MentorApplicationDto>("/admin/huddle/mentors", {
    method: "POST",
    body: JSON.stringify({
      name: mentor.name,
      profession: mentor.role,
      organization: mentor.org,
      yearsExperience: mentor.yrs,
      specialty: mentor.specialties?.join(", ") || "Clinical Medicine",
      status: "APPROVED",
      verified: true,
    }),
  });
}

export interface AdminSupportTicketDto {
  id: string;
  userId?: string;
  userName?: string;
  userEmail?: string;
  userRole?: string;
  subject: string;
  description: string;
  category: string;
  status: "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED" | string;
  adminNotes?: string;
  createdAt: string;
}

export async function getAdminSupportTickets(status?: string): Promise<AdminSupportTicketDto[]> {
  const query = status && status !== "ALL" ? `?status=${encodeURIComponent(status)}` : "";
  return apiFetch<AdminSupportTicketDto[]>(`/admin/support/tickets${query}`);
}

export async function updateAdminSupportTicketStatus(
  ticketId: string,
  status: string,
  adminNotes?: string
): Promise<AdminSupportTicketDto> {
  return apiFetch<AdminSupportTicketDto>(`/admin/support/tickets/${ticketId}/status`, {
    method: "PUT",
    body: JSON.stringify({ status, adminNotes }),
  });
}
