export function walletDocumentTitle(type: string | undefined, status: string | undefined): string {
  if (type === "topup") return status === "Completed" ? "Reconciled deposit record" : status === "Rejected" ? "Rejected deposit request" : "Deposit request — awaiting reconciliation";
  if (type === "escrow_hold") return "Escrow reservation record";
  if (type === "refund") return "Wallet refund record";
  if (type === "disbursement") return status === "Completed" ? "Recorded bank settlement" : status === "Refunded" ? "Cancelled settlement" : "Pending settlement advice";
  return "Wallet transaction statement";
}
export function includeStatement(row: { canonicalDocument?: boolean | undefined; status?: string | undefined }): boolean {
  // Historical queued entries remain in Activity, so they cannot duplicate the final billing record.
  return !!row.canonicalDocument || row.status === "Completed" || row.status === "Refunded";
}
