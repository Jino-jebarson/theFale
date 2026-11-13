import type { ShiftClaimDto } from "@/lib/adapters/shiftAdapter";

export type EarningState = "application" | "reserved" | "review" | "pending" | "paid" | "frozen" | "closed";
export function earningState(claim: Pick<ShiftClaimDto, "status" | "payoutStatus">): EarningState {
  const status = claim.status?.toUpperCase();
  if (claim.payoutStatus === "DISBURSED") return "paid";
  if (claim.payoutStatus === "REFUNDED" || ["CANCELLED", "REJECTED", "NO_SHOW", "SLOT_FILLED", "WITHDRAWN"].includes(status)) return "closed";
  if (status === "DISPUTED") return "frozen";
  if (status === "COMPLETED" && claim.payoutStatus === "PENDING_DISBURSEMENT") return "pending";
  if (status === "TIMESHEET_SUBMITTED") return "review";
  if (["CONFIRMED", "CHECKED_IN", "IN_PROGRESS"].includes(status)) return "reserved";
  return "application";
}
export const earningLabels: Record<EarningState, string> = {
  application: "Awaiting confirmation", reserved: "Confirmed duty reserve", review: "Timesheet awaiting approval",
  pending: "Awaiting bank payment", paid: "Disbursed", frozen: "Disputed — payment on hold", closed: "Closed — no payout due",
};
export function toEarning(claim: ShiftClaimDto) {
  const state = earningState(claim);
  const amountsRecorded = [claim.grossAmountPaise, claim.platformFeePaise, claim.tdsAmountPaise, claim.netAmountPaise].every(value => typeof value === "number" && Number.isFinite(value));
  const closed = state === "closed" || state === "application";
  return {
    claim, state, amountsRecorded,
    gross: closed ? 0 : (claim.grossAmountPaise ?? 0) / 100,
    fee: closed ? 0 : (claim.platformFeePaise ?? 0) / 100,
    tds: closed ? 0 : (claim.tdsAmountPaise ?? 0) / 100,
    net: closed ? 0 : (claim.netAmountPaise ?? 0) / 100,
    hours: claim.actualHours ?? claim.hours ?? 0,
    label: state === "paid" && claim.status === "DISPUTED" ? "Disbursed — under dispute" : earningLabels[state],
    adviceAvailable: claim.payoutStatus === "DISBURSED" || (claim.status === "COMPLETED" && claim.payoutStatus === "PENDING_DISBURSEMENT"),
  };
}
export function earningsTotals(records: ReturnType<typeof toEarning>[]) {
  const sum = (...states: EarningState[]) => records.filter(r => r.amountsRecorded && states.includes(r.state)).reduce((value, r) => value + Math.round(r.net * 100), 0) / 100;
  return { paid: sum("paid"), reserved: sum("reserved", "review"), pending: sum("pending"), frozen: sum("frozen") };
}
export function money(value: number): string { return value.toLocaleString("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
