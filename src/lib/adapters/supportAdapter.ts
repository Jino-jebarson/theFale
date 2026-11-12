// src/lib/adapters/supportAdapter.ts
// Support ticket submission and tracking adapter

import { apiFetch } from "@/lib/api";

export interface SupportTicketDto {
  id: string;
  subject: string;
  description: string;
  category: string;
  status: string;
  adminNotes?: string;
  createdAt: string;
}

export interface CreateSupportTicketRequest {
  subject: string;
  category: string;
  description: string;
}

/**
 * Fetch all support tickets submitted by current user.
 */
export async function getMyTickets(): Promise<SupportTicketDto[]> {
  return apiFetch<SupportTicketDto[]>("/support/tickets", { validate: Array.isArray });
}

/**
 * Submit a priority support ticket to clinical operations.
 */
export async function createSupportTicket(
  subject: string,
  category: string,
  description: string
): Promise<SupportTicketDto> {
  return apiFetch<SupportTicketDto>("/support/tickets", {
    method: "POST",
    body: JSON.stringify({
      subject: subject.trim(),
      category: category.trim(),
      description: description.trim(),
    }),
  });
}
