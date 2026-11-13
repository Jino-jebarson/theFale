export type ApplicationScope = { openingId?: string; type?: "jobs" | "shifts" };
export function parseApplicationScope(search: Record<string, unknown>): ApplicationScope {
  return {
    ...(typeof search["openingId"] === "string" && /^[a-zA-Z0-9-]{1,100}$/.test(search["openingId"]) ? { openingId: search["openingId"] } : {}),
    ...(search["type"] === "jobs" || search["type"] === "shifts" ? { type: search["type"] } : {}),
  };
}
export const ACTION_STATUSES = new Set(["New", "Claimed", "Shortlisted", "Timesheet Submitted", "Disputed"]);
export const HISTORY_STATUSES = new Set(["Completed", "Hired", "Rejected", "No-Show", "Slot Filled", "Position Filled", "Cancelled", "Withdrawn"]);
export function matchesApplicationStage(status: string, stage: string): boolean {
  if (stage === "All") return true;
  if (stage === "Needs Action") return ACTION_STATUSES.has(status);
  if (stage === "New Applications") return status === "New" || status === "Claimed";
  if (stage === "On Duty") return status === "Checked In" || status === "In Progress";
  if (stage === "Timesheet Review") return status === "Timesheet Submitted";
  if (stage === "In Progress") return ["Confirmed", "Checked In", "In Progress", "Interview", "Offer"].includes(status);
  if (stage === "History") return HISTORY_STATUSES.has(status);
  return status === stage;
}
export function applicationStageLabel(status: string): string {
  return ({ Claimed: "New Application", "Checked In": "On Duty", "Timesheet Submitted": "Timesheet Review" } as Record<string, string>)[status] || status;
}
export function shiftInHistory(status: string): boolean {
  return ["COMPLETED", "CANCELLED", "REJECTED", "EXPIRED"].includes(status.toUpperCase());
}
export function formatDutySchedule(start?: string, end?: string): string {
  if (!start || !end) return "Schedule not available";
  const from = new Date(start), to = new Date(end);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return "Schedule not available";
  const date = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
  const time = new Intl.DateTimeFormat("en-IN", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });
  return `${date.format(from)} · ${time.format(from)} – ${date.format(from) === date.format(to) ? "" : date.format(to) + " "}${time.format(to)} IST`;
}
