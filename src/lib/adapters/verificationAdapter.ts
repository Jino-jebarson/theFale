// src/lib/adapters/verificationAdapter.ts
// Public QR credential verification badge adapter

import { apiFetch } from "@/lib/api";

export interface VerificationBadgeResponse {
  verificationId: string;
  entityType: "CANDIDATE" | "FACILITY";
  maskedName: string;
  verified: boolean;
  accreditationText: string;
}

export async function getPublicVerificationBadge(id: string): Promise<VerificationBadgeResponse> {
  return apiFetch<VerificationBadgeResponse>(`/verifications/${id}`);
}
