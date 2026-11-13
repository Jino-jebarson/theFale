export interface ShiftDetails {
  profession?: string | undefined; city?: string | undefined; registrationRequired?: boolean | undefined; blsRequired?: boolean | undefined; aclsRequired?: boolean | undefined;
  icuExperienceRequired?: boolean | undefined; minimumExperienceYears?: number | undefined; reportTo?: string | undefined; reportLocation?: string | undefined;
  dressRequirement?: string | undefined; itemsToBring?: string | undefined; reportingNotes?: string | undefined;
}
export interface ShiftCheckInPayload {
  method: "PIN" | "QR"; pin?: string | undefined; qrToken?: string | undefined;
  latitude: number; longitude: number; accuracy: number; locationCapturedAt: string;
  selfieDataUrl: string; selfieCapturedAt: string;
}
// src/lib/adapters/shiftAdapter.ts
// Locum shift and duty claim adapter with escrow hold

import { apiFetch, paiseToRupees, rupeesToPaise } from "@/lib/api";

export interface LocumShiftDto {
  id: string;
  facilityId?: string | undefined;
  facilityName?: string | undefined;
  facilityCity?: string | undefined;
  city?: string | undefined;
  facilityAddress?: string | undefined;
  facilityAccreditation?: string | undefined;
  title: string;
  details?: ShiftDetails | undefined;
  department: string;
  startAt: string;
  endAt: string;
  hours: number;
  ratePerHourPaise: number;
  surgeRatePerHourPaise?: number | undefined;
  surgeLabel?: string | undefined;
  totalPayoutPaise?: number | undefined;
  totalPayPaise?: number | undefined;
  openings: number;
  slotsClaimed: number;
  urgent: boolean;
  status: string;
  description?: string | undefined;
  createdAt?: string | undefined;
  hasClaimed?: boolean | undefined;
  facilityFeePercent?: number | undefined;
  facilityFeePaise?: number | undefined;
  platformFeeGstPercent?: number | undefined;
  platformFeeGstPaise?: number | undefined;
  totalEscrowRequiredPaise?: number | undefined;
  autoApproved?: boolean | undefined;
  matchScore?: number | undefined;
}

export interface FacilityShiftPolicyDto {
  hasLinkedBank: boolean;
  kycVerified: boolean;
  firstShiftApprovalRequired: boolean;
  firstShiftFeeWaived: boolean;
  platformFeePercent: number;
  platformFeeGstPercent?: number | undefined;
  priorApprovedShiftsCount: number;
  priorValidShiftsCount: number;
  availableBalancePaise: number;
}

export interface ShiftClaimDto {
  department?: string | undefined;
  id: string;
  shiftId: string;
  candidateId: string;
  candidateName?: string | undefined;
  candidateRole?: string | undefined;
  candidateCity?: string | undefined;
  candidateProfession?: string | undefined;
  facilityName?: string | undefined;
  shiftTitle?: string | undefined;
  shiftDepartment?: string | undefined;
  shiftStartAt?: string | undefined;
  shiftEndAt?: string | undefined;
  startAt?: string | undefined;
  endAt?: string | undefined;
  hours?: number | undefined;
  actualHours?: number | undefined;
  status: string;
  claimedAt?: string | undefined;
  checkedInAt?: string | undefined;
  completedAt?: string | undefined;
  payoutPaise?: number | undefined;
  grossAmountPaise?: number | undefined;
  platformFeePaise?: number | undefined;
  tdsAmountPaise?: number | undefined;
  netAmountPaise?: number | undefined;
  payoutStatus?: string | undefined;
  utr?: string | undefined;
  payoutSlipRef?: string | undefined;
  disbursedAt?: string | undefined;
  payoutMethodSnapshot?: string | undefined;
  payoutRegistrationNumber?: string | undefined;
  matchScore?: number | undefined;
  checkInTime?: string | undefined;
  completionTime?: string | undefined;
  disputeReason?: string | undefined;
  disputedAt?: string | undefined;
  disputedBy?: string | undefined;
  platformFeePercent?: number | undefined;
  firstShiftFree?: boolean | undefined;
  checkInPin?: string | undefined;
  checkInQrToken?: string | undefined;
  arrivalInstructions?: ShiftDetails | undefined;
  attendanceRecorded?: boolean | undefined;
  checkInMethod?: string | undefined;
  hospitalRating?: number | undefined;
  hospitalReview?: string | undefined;
  ratingTags?: string | undefined;
  ratedAt?: string | undefined;
  candidateRatingAvg?: number | undefined;
  candidateRatingCount?: number | undefined;
  completedShiftsCount?: number | undefined;
}

export interface UiShiftItem {
  id: string;
  title: string;
  details?: ShiftDetails | undefined;
  org: string;
  dept: string;
  city: string;
  time: string;
  date: string;
  startAt?: string | undefined;
  createdAt?: string | undefined;
  pay: string;
  rate: number;
  rateNumber: number;
  totalPayNumber: number;
  urgent?: boolean | undefined;
  slots: number;
  slotsClaimed: number;
  status: string;
  perks: string[];
  hours: number;
  rawRatePerHourPaise: number;
  rawTotalPayoutPaise: number;
  hasClaimed?: boolean | undefined;
  surgeRatePerHourPaise?: number | undefined;
  surgeLabel?: string | undefined;
  endAt?: string | undefined;
  description?: string | undefined;
  facilityFeePercent?: number | undefined;
  facilityFeePaise?: number | undefined;
  platformFeeGstPercent?: number | undefined;
  platformFeeGstPaise?: number | undefined;
  totalEscrowRequiredPaise?: number | undefined;
  autoApproved?: boolean | undefined;
  matchScore?: number | undefined;
}

export function mapLocumShiftToUi(dto: LocumShiftDto): UiShiftItem {
  const baseRateRupees = paiseToRupees(dto.ratePerHourPaise || 0);
  const surgeRateRupees = paiseToRupees(dto.surgeRatePerHourPaise || 0);
  const rateRupees = baseRateRupees + surgeRateRupees;
  const hours = dto.hours || 8;
  const totalRupees = dto.totalPayPaise
    ? paiseToRupees(dto.totalPayPaise)
    : dto.totalPayoutPaise
      ? paiseToRupees(dto.totalPayoutPaise)
      : rateRupees * hours;

  const startDate = dto.startAt ? new Date(dto.startAt) : new Date();
  const endDate = dto.endAt ? new Date(dto.endAt) : new Date(startDate.getTime() + hours * 60 * 60 * 1000);
  const startStr = `${startDate.getHours().toString().padStart(2, "0")}:${startDate.getMinutes().toString().padStart(2, "0")}`;
  const endStr = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;
  const timeFormatted = `${startStr} – ${endStr}`;
  const dateFormatted = startDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });

  return {
    id: dto.id,
    title: dto.title,
    details: dto.details,
    org: dto.facilityName || "Hospital Partner",
    dept: dto.department || "Emergency",
    city: dto.city || dto.facilityCity || "Chennai",
    time: timeFormatted,
    date: dateFormatted,
    startAt: dto.startAt,
    createdAt: dto.createdAt,
    pay: `₹${totalRupees.toLocaleString("en-IN")}`,
    rate: rateRupees,
    rateNumber: rateRupees,
    totalPayNumber: totalRupees,
    urgent: Boolean(dto.urgent),
    slots: dto.openings || 1,
    slotsClaimed: dto.slotsClaimed || 0,
    status: dto.status || "OPEN",
    perks: ["Guaranteed 24-hr Payout", "Malpractice Covered"],
    hours: hours,
    rawRatePerHourPaise: dto.ratePerHourPaise,
    rawTotalPayoutPaise: dto.totalPayPaise || dto.totalPayoutPaise || ((dto.ratePerHourPaise + (dto.surgeRatePerHourPaise || 0)) * hours),
    hasClaimed: Boolean(dto.hasClaimed),
    surgeRatePerHourPaise: dto.surgeRatePerHourPaise || 0,
    surgeLabel: dto.surgeLabel,
    endAt: dto.endAt,
    description: dto.description,
    facilityFeePercent: dto.facilityFeePercent ?? 0,
    facilityFeePaise: dto.facilityFeePaise ?? 0,
    platformFeeGstPercent: dto.platformFeeGstPercent ?? 0,
    platformFeeGstPaise: dto.platformFeeGstPaise ?? 0,
    totalEscrowRequiredPaise: dto.totalEscrowRequiredPaise ?? ((dto.totalPayPaise || 0) * (dto.openings || 1)),
    autoApproved: Boolean(dto.autoApproved),
    matchScore: dto.matchScore,
  };
}

export async function getOpenShifts(): Promise<UiShiftItem[]> {
  const dtos = await apiFetch<LocumShiftDto[]>("/shifts", { validate: Array.isArray });
  return dtos.map(mapLocumShiftToUi);
}

export async function getFacilityShifts(): Promise<UiShiftItem[]> {
  const dtos = await apiFetch<LocumShiftDto[]>("/shifts/facility", { validate: Array.isArray });
  return dtos.map(mapLocumShiftToUi);
}

export async function claimShift(shiftId: string): Promise<ShiftClaimDto> {
  return apiFetch<ShiftClaimDto>(`/shifts/${shiftId}/claim`, {
    method: "POST",
  });
}

export async function getMyClaims(): Promise<ShiftClaimDto[]> {
  return apiFetch<ShiftClaimDto[]>("/shifts/claims", { validate: Array.isArray });
}

export async function checkInShift(claimId: string, evidence: ShiftCheckInPayload): Promise<ShiftClaimDto> {
  return apiFetch<ShiftClaimDto>(`/shifts/claims/${claimId}/check-in`, {
    method: "POST",
    body: JSON.stringify(evidence),
  });
}

export interface CompleteShiftPayload {
  panNumber?: string | undefined;
  tdsConsent?: boolean | undefined;
  actualHours?: number | undefined;
}

export async function completeShift(
  claimId: string,
  payload?: CompleteShiftPayload
): Promise<ShiftClaimDto> {
  return apiFetch<ShiftClaimDto>(`/shifts/claims/${claimId}/complete`, {
    method: "POST",
    body: payload ? JSON.stringify(payload) : undefined,
  });
}

export async function disputeShift(claimId: string, reason?: string): Promise<ShiftClaimDto> {
  const query = reason ? `?reason=${encodeURIComponent(reason)}` : "";
  return apiFetch<ShiftClaimDto>(`/shifts/claims/${claimId}/dispute${query}`, {
    method: "POST",
    body: reason ? JSON.stringify({ reason }) : undefined,
  });
}

export interface RateShiftClaimPayload {
  rating: number;
  review?: string | undefined;
  tags?: string[];
}

export async function rateShiftClaim(
  claimId: string,
  payload: RateShiftClaimPayload
): Promise<ShiftClaimDto> {
  return apiFetch<ShiftClaimDto>(`/shifts/claims/${claimId}/rate`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getFacilityShiftPolicy(): Promise<FacilityShiftPolicyDto> {
  return apiFetch<FacilityShiftPolicyDto>("/shifts/facility/policy");
}

export async function updateShift(
  shiftId: string,
  payload: PostShiftPayload
): Promise<LocumShiftDto> {
  const isUrgentVal = Boolean(payload.urgent ?? payload.isUrgent);
  const bodyData = {
    title: payload.title.trim(),
    details: payload.details,
    department: payload.department.trim(),
    startAt: payload.startAt,
    endAt: payload.endAt,
    hours: payload.hours,
    ratePerHourPaise: Number(payload.ratePerHourPaise),
    surgeRatePerHourPaise: Number(payload.surgeRatePerHourPaise || 0),
    surgeLabel: payload.surgeLabel || null,
    openings: Number(payload.openings),
    urgent: isUrgentVal,
    isUrgent: isUrgentVal,
    description: payload.description || undefined,
  };
  return apiFetch<LocumShiftDto>(`/shifts/${shiftId}`, {
    method: "PUT",
    body: JSON.stringify(bodyData),
  });
}

export async function cancelShift(shiftId: string): Promise<void> {
  await apiFetch(`/shifts/${shiftId}`, {
    method: "DELETE",
  });
}

export async function getDisputedShiftClaims(): Promise<ShiftClaimDto[]> {
  return apiFetch<ShiftClaimDto[]>("/admin/shifts/claims/disputed", { validate: Array.isArray });
}

export interface ResolveDisputePayload {
  resolution: "RELEASE_TO_CANDIDATE" | "PARTIAL_SPLIT" | "REFUND_HOSPITAL";
  approvedHours?: number | undefined;
  notes?: string | undefined;
}

export async function resolveShiftDispute(
  claimId: string,
  payload: ResolveDisputePayload
): Promise<void> {
  await apiFetch(`/admin/shifts/claims/${claimId}/resolve-dispute`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function cancelShiftClaim(claimId: string): Promise<void> {
  await apiFetch(`/shifts/claims/${claimId}/cancel`, {
    method: "POST",
  });
}

export interface PostShiftPayload {
  title: string;
  details?: ShiftDetails | undefined;
  department: string;
  startAt: string;
  endAt: string;
  hours?: number | undefined;
  ratePerHourPaise: number;
  surgeRatePerHourPaise?: number | undefined;
  surgeLabel?: string | undefined;
  openings: number;
  urgent?: boolean | undefined;
  isUrgent?: boolean | undefined;
  description?: string | undefined;
}

export async function postShift(payload: PostShiftPayload): Promise<LocumShiftDto> {
  const isUrgentVal = Boolean(payload.urgent ?? payload.isUrgent);
  const bodyData = {
    title: payload.title.trim(),
    details: payload.details,
    department: payload.department.trim(),
    startAt: payload.startAt,
    endAt: payload.endAt,
    hours: payload.hours,
    ratePerHourPaise: Number(payload.ratePerHourPaise),
    surgeRatePerHourPaise: Number(payload.surgeRatePerHourPaise || 0),
    surgeLabel: payload.surgeLabel || null,
    openings: Number(payload.openings),
    urgent: isUrgentVal,
    isUrgent: isUrgentVal,
    description: payload.description || undefined,
  };

  return apiFetch<LocumShiftDto>("/shifts", {
    method: "POST",
    headers: {
      "Idempotency-Key": `shift-post-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    },
    body: JSON.stringify(bodyData),
  });
}

export async function getPayoutAdvice(claimId: string): Promise<ShiftClaimDto> {
  return apiFetch<ShiftClaimDto>(`/payouts/${claimId}/slip`, { cache: "no-store" });
}
