// src/lib/adapters/notificationAdapter.ts
// Notification adapter for alerts, shift broadcasts, and credential updates

import { apiFetch } from "@/lib/api";

export interface NotificationDto {
  id: string;
  title: string;
  message: string;
  type: string;
  actionUrl?: string;
  isRead?: boolean;
  read?: boolean;
  createdAt: string;
}

export interface UiNotificationItem {
  id: string;
  category: "shifts" | "jobs" | "cme" | "credentials";
  title: string;
  hospital: string;
  hospitalCode: string;
  hospitalGradient: string;
  message: string;
  time: string;
  unread: boolean;
  urgent?: boolean;
  actionType?: "accept_shift" | "confirm_interview" | "view_cert" | "view_doc" | "view_hospital";
  actionLabel?: string;
  actionLink?: string;
  statusText?: string;
}

function stripEmojis(text: string): string {
  if (!text) return "";
  return text.replace(/[\p{Extended_Pictographic}\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]/gu, "").replace(/\s+/g, " ").trim();
}

export function mapNotificationToUi(dto: NotificationDto): UiNotificationItem {
  const isUnread = !(dto.isRead ?? dto.read);
  const typeLower = (dto.type || "system").toLowerCase();
  const category: "shifts" | "jobs" | "cme" | "credentials" =
    typeLower.includes("shift") ? "shifts"
    : typeLower.includes("cme") || typeLower.includes("course") ? "cme"
    : typeLower.includes("credential") || typeLower.includes("kyc") || typeLower.includes("doc") ? "credentials"
    : "jobs";

  const dateObj = dto.createdAt ? new Date(dto.createdAt) : new Date();
  const diffMins = Math.floor((Date.now() - dateObj.getTime()) / (1000 * 60));
  const timeStr =
    diffMins < 60 ? `${Math.max(1, diffMins)}m ago`
    : diffMins < 1440 ? `${Math.floor(diffMins / 60)}h ago`
    : `${Math.floor(diffMins / 1440)}d ago`;

  return {
    id: dto.id,
    category,
    title: stripEmojis(dto.title),
    hospital: "FALE Healthcare Network",
    hospitalCode: "FL",
    hospitalGradient: "from-primary to-primary-hover",
    message: stripEmojis(dto.message),
    time: timeStr,
    unread: isUnread,
    urgent: typeLower.includes("urgent") || typeLower.includes("alert"),
    actionLink: dto.actionUrl || (category === "shifts" ? "/shifts" : category === "jobs" ? "/jobs" : "/profile"),
  };
}

/**
 * Fetch all notifications for current user.
 */
export async function getNotifications(): Promise<UiNotificationItem[]> {
  const dtos = await apiFetch<NotificationDto[]>("/notifications", { validate: Array.isArray, cacheMs: 15000 });
  return dtos.map(mapNotificationToUi);
}

/**
 * Mark a single notification as read.
 */
export async function markNotificationRead(id: string): Promise<void> {
  await apiFetch(`/notifications/${id}/read`, {
    method: "PATCH",
  });
}

/**
 * Mark all notifications as read.
 */
export async function markAllNotificationsRead(): Promise<void> {
  await apiFetch("/notifications/mark-all-read", {
    method: "PATCH",
  });
}

/**
 * Delete a single notification.
 */
export async function deleteNotification(id: string): Promise<void> {
  await apiFetch(`/notifications/${id}`, {
    method: "DELETE",
  });
}

/**
 * Clear all notifications for current user.
 */
export async function clearAllNotifications(): Promise<void> {
  await apiFetch("/notifications/clear-all", {
    method: "DELETE",
  });
}
