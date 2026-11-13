/** Mirror the server's per-booking rounding; amounts are integer paise. */
export function calculateShiftCharges(grossPerWorkerPaise: number, openings: number, feePercent: number, gstPercent: number) {
  const feePerWorker = Math.round(grossPerWorkerPaise * feePercent / 100);
  const gstPerWorker = Math.round(feePerWorker * gstPercent / 100);
  const workerPaise = grossPerWorkerPaise * openings;
  const platformFeePaise = feePerWorker * openings;
  const platformFeeGstPaise = gstPerWorker * openings;
  return { workerPaise, platformFeePaise, platformFeeGstPaise, totalPaise: workerPaise + platformFeePaise + platformFeeGstPaise };
}

/** GST comes only from stored transaction snapshots, never inferred from wages or wallet deposits. */
export function recordedBillingAmounts(total: number, feePaise?: number | null, gstPaise?: number | null) {
  const gst = (gstPaise ?? 0) / 100;
  const platformFee = (feePaise ?? 0) / 100;
  return { subtotal: Math.round((total - gst) * 100) / 100, gst, platformFee };
}

/** Split the saved pre-GST subtotal without guessing a fee for historical records. */
export function recordedBaseAmount(subtotal: number, platformFee?: number | null): number | null {
  if (platformFee == null || !Number.isFinite(platformFee) || !Number.isFinite(subtotal)) return null;
  return (Math.round(subtotal * 100) - Math.round(platformFee * 100)) / 100;
}
