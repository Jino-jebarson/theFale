// src/lib/adapters/shiftAdapter.ts
// Locum shift and duty claim adapter with escrow hold

import { apiFetch, paiseToRupees, rupeesToPaise } from "@/lib/api";

export interface LocumShiftDto {
  id: string;
  facilityId?: string;
  facilityName?: string;
  facilityCity?: string;
  city?: string;
  facilityAddress?: string;
  facilityAccreditation?: string;
  title: string;
  department: string;
  startAt: string;
  endAt: string;
  hours: number;
  ratePerHourPaise: number;
  surgeRatePerHourPaise?: number;
  surgeLabel?: string;
  totalPayoutPaise?: number;
  totalPayPaise?: number;
  openings: number;
  slotsClaimed: number;
  urgent: boolean;
  status: string;
  description?: string;
  createdAt?: string;
  hasClaimed?: boolean;
}

export interface ShiftClaimDto {
  id: string;
  shiftId: string;
  candidateId: string;
  candidateName?: string;
  candidateRole?: string;
  candidateCity?: string;
  candidateProfession?: string;
  facilityName?: string;
  shiftTitle?: string;
  shiftDepartment?: string;
  shiftStartAt?: string;
  shiftEndAt?: string;
  startAt?: string;
  endAt?: string;
  hours?: number;
  actualHours?: number;
  status: string;
  claimedAt?: string;
  checkedInAt?: string;
  completedAt?: string;
  payoutPaise?: number;
  grossAmountPaise?: number;
  platformFeePaise?: number;
  tdsAmountPaise?: number;
  netAmountPaise?: number;
  payoutStatus?: string;
  utr?: string;
  payoutSlipRef?: string;
  matchScore?: number;
  checkInTime?: string;
  completionTime?: string;
  disputeReason?: string;
}

export interface UiShiftItem {
  id: string;
  title: string;
  org: string;
  dept: string;
  city: string;
  time: string;
  date: string;
  startAt?: string;
  createdAt?: string;
  pay: string;
  rate: number;
  rateNumber: number;
  totalPayNumber: number;
  urgent?: boolean;
  slots: number;
  slotsClaimed: number;
  status: string;
  perks: string[];
  hours: number;
  rawRatePerHourPaise: number;
  rawTotalPayoutPaise: number;
  hasClaimed?: boolean;
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
  };
}

export async function getOpenShifts(): Promise<UiShiftItem[]> {
  const dtos = await apiFetch<LocumShiftDto[]>("/shifts");
  return dtos.map(mapLocumShiftToUi);
}

export async function getFacilityShifts(): Promise<UiShiftItem[]> {
  const dtos = await apiFetch<LocumShiftDto[]>("/shifts/facility");
  return dtos.map(mapLocumShiftToUi);
}

export async function claimShift(shiftId: string): Promise<ShiftClaimDto> {
  return apiFetch<ShiftClaimDto>(`/shifts/${shiftId}/claim`, {
    method: "POST",
  });
}

export async function getMyClaims(): Promise<ShiftClaimDto[]> {
  return apiFetch<ShiftClaimDto[]>("/shifts/claims");
}

export async function checkInShift(claimId: string): Promise<ShiftClaimDto> {
  return apiFetch<ShiftClaimDto>(`/shifts/claims/${claimId}/check-in`, {
    method: "POST",
  });
}

export interface CompleteShiftPayload {
  panNumber?: string;
  tdsConsent?: boolean;
  actualHours?: number;
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
  });
}

export async function cancelShiftClaim(claimId: string): Promise<void> {
  await apiFetch(`/shifts/claims/${claimId}/cancel`, {
    method: "POST",
  });
}

export interface PostShiftPayload {
  title: string;
  department: string;
  startAt: string;
  endAt: string;
  hours?: number;
  ratePerHourPaise: number;
  surgeRatePerHourPaise?: number;
  surgeLabel?: string;
  openings: number;
  urgent?: boolean;
  isUrgent?: boolean;
  description?: string;
}

export async function postShift(payload: PostShiftPayload): Promise<LocumShiftDto> {
  const isUrgentVal = Boolean(payload.urgent ?? payload.isUrgent);
  const bodyData = {
    title: payload.title.trim(),
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
