import { describe, expect, it, vi } from "vitest";
import { calculateShiftCharges, recordedBillingAmounts, recordedBaseAmount } from "@/lib/shiftCharges";
import { buildHospitalInvoiceDoc } from "@/lib/hospitalInvoicePdf";

describe("hospital platform fee and GST", () => {
  it("separates the saved base amount from fees without losing paise or guessing missing fees", () => {
    expect(recordedBaseAmount(2268, 168)).toBe(2100);
    expect(recordedBaseAmount(1000.01, 0)).toBe(1000.01);
    expect(recordedBaseAmount(680, -320)).toBe(1000);
    expect(recordedBaseAmount(2268)).toBeNull();
  });
  it("shows base, fee, pre-GST subtotal, GST and total in the hospital receipt", () => {
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    try {
      const pdf = buildHospitalInvoiceDoc({invoiceId:"INV-2026-000001",date:"13 Nov 2026",period:"Nov 2026",hospitalName:"QA Hospital",
        refNumber:"REAL-REF",description:"Shift settlement",transactionType:"disbursement",subtotal:2268,platformFee:168,gst:30.24,total:2298.24,status:"Completed"}).output();
      for (const value of ["Base shift amount:","2,100.00","168.00","Subtotal before GST:","2,268.00","30.24","2,298.24"]) expect(pdf).toContain(value);
      expect(pdf).not.toContain("Taxable Subtotal");
    } finally { canvas.mockRestore(); }
  });
  it("charges GST on the fee only: 3600 + 288 + 51.84", () => {
    expect(calculateShiftCharges(360000, 1, 8, 18)).toEqual({ workerPaise: 360000, platformFeePaise: 28800, platformFeeGstPaise: 5184, totalPaise: 393984 });
  });
  it("rounds each booking before multiplying openings, matching backend settlement", () => {
    expect(calculateShiftCharges(105, 10, 8, 18)).toEqual({ workerPaise: 1050, platformFeePaise: 80, platformFeeGstPaise: 10, totalPaise: 1140 });
  });
  it("keeps zero fee waivers GST-free and legacy quotes unchanged", () => {
    expect(calculateShiftCharges(360000, 1, 0, 18).totalPaise).toBe(360000);
    expect(calculateShiftCharges(360000, 1, 8, 0).totalPaise).toBe(388800);
  });
  it("uses recorded tax rather than extracting 18% from wages", () => {
    expect(recordedBillingAmounts(3939.84, 28800, 5184)).toEqual({ subtotal: 3888, platformFee: 288, gst: 51.84 });
    expect(recordedBillingAmounts(4320)).toEqual({ subtotal: 4320, platformFee: 0, gst: 0 });
  });
  it("keeps the fee and GST components of refunds and signed reconciliation adjustments", () => {
    expect(recordedBillingAmounts(339.84, 28800, 5184)).toEqual({ subtotal: 288, platformFee: 288, gst: 51.84 });
    expect(recordedBillingAmounts(622.4, -32000, -5760)).toEqual({ subtotal: 680, platformFee: -320, gst: -57.6 });
  });
  it("exports stored GST and paise without fabricated tax identifiers or tax splits", () => {
    const canvas = vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    const doc = buildHospitalInvoiceDoc({ invoiceId: "INV-REAL-1", date: "13 Nov 2026", period: "Nov 2026", hospitalName: "QA Hospital",
      refNumber: "REAL-REF", description: "Shift settlement", subtotal: 3888, platformFee: 288, gst: 51.84, total: 3939.84, status: "Processing", docType: "TAX_INVOICE" });
    const pdf = doc.output();
    expect(pdf).toContain("SETTLEMENT STATEMENT"); expect(pdf).toContain("51.84"); expect(pdf).toContain("288.00");
    expect(pdf).toContain("Paise"); expect(pdf).not.toContain("29AABCT1332L1Z4"); expect(pdf).not.toContain("CGST @");
    canvas.mockRestore();
  });
});
