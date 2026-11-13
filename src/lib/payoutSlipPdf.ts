import { amountInWords } from "./amountInWords";
import { jsPDF } from "jspdf";
export interface PayoutAdviceRecord {
  id: string; shiftTitle: string; hospitalName: string; dept: string; shiftDate: string;
  hours: number; rate: number; amount: number; payoutDate: string; status: string; payoutMethodUsed: string;
  utr?: string | undefined; slipRef?: string | undefined;
  grossAmount?: number | undefined; platformFee?: number | undefined; tdsAmount?: number | undefined;
}
export { amountInWords } from "./amountInWords";

function createLogoCanvas(): string | null {
  if (typeof document === "undefined") return null;
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 340;
    canvas.height = 110;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Draw tilted squircle badge (-4 degrees)
    ctx.save();
    ctx.translate(50, 55);
    ctx.rotate((-4 * Math.PI) / 180);
    ctx.fillStyle = "#ea580c";

    const x = -38, y = -38, w = 76, h = 76, r = 22;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.fill();

    // Stylized white 'f'
    ctx.fillStyle = "#ffffff";
    ctx.font = "italic 900 58px 'Fraunces', Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("f", 2, 4);
    ctx.restore();

    // Wordmark: "the" (small orange on top)
    ctx.fillStyle = "#ea580c";
    ctx.font = "italic 800 24px 'Fraunces', Georgia, serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("the", 102, 48);

    // Wordmark: "fale" (bold dark slate below)
    ctx.fillStyle = "#0f172a";
    ctx.font = "italic 900 56px 'Fraunces', Georgia, serif";
    ctx.fillText("fale", 100, 92);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export function buildPayoutAdviceDoc(
  tx: PayoutAdviceRecord,
  candidateName: string,
  regNumber: string = "Not recorded"
): jsPDF {
  if (![tx.grossAmount, tx.platformFee, tx.tdsAmount, tx.amount].every(n => typeof n === "number" && Number.isFinite(n)))
    throw new Error("Saved payout amounts are unavailable. Refresh the payout record before downloading.");
  if (Math.abs(Math.round((tx.grossAmount! - tx.platformFee! - tx.tdsAmount! - tx.amount) * 100)) > 0)
    throw new Error("The saved payout figures do not reconcile. Please contact support.");
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  // Page Dimensions
  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm

  // Outer Border Frame
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, 10, 190, 277, 3, 3, "S");

  // ==========================================
  // 1. BRAND HEADER WITH LOGO
  // ==========================================
  const logoDataUrl = createLogoCanvas();
  if (logoDataUrl) {
    // Render exact high-res authentic FALE logo
    doc.addImage(logoDataUrl, "PNG", margin, 14, 39, 12.6);
  } else {
    // Vector Fallback
    doc.setFillColor(234, 88, 12);
    doc.roundedRect(margin, 15, 12, 12, 2.8, 2.8, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("times", "bolditalic");
    doc.setFontSize(20);
    doc.text("f", margin + 3.8, 24.5);

    doc.setTextColor(234, 88, 12);
    doc.setFont("times", "bolditalic");
    doc.setFontSize(9);
    doc.text("the", margin + 14.5, 19.5);

    doc.setTextColor(15, 23, 42);
    doc.setFont("times", "bolditalic");
    doc.setFontSize(16.5);
    doc.text("fale", margin + 14.5, 26.5);
  }

  // Registered Corporate Subtitle
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.text("THE FALE", margin, 34);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text("Healthcare Staffing & Payout Records", margin, 38);
  doc.text("Recorded payment advice - not a tax certificate", margin, 41.8);
  doc.text("Issuer particulars available from billing · support@thefale.com", margin, 45.5);

  // Header Right Side: Document Reference Badge & Meta
  doc.setFillColor(255, 241, 230); // primary/10
  doc.setDrawColor(254, 215, 170); // primary/20
  doc.roundedRect(pageWidth - margin - 58, 15, 58, 8, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(234, 88, 12);
  doc.text("PAYOUT ADVICE SLIP", pageWidth - margin - 29, 19, { align: "center", baseline: "middle" });

  doc.setFont("courier", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(tx.slipRef || tx.id, pageWidth - margin, 29.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Disbursal Date: ${tx.payoutDate}`, pageWidth - margin, 34.5, { align: "right" });
  doc.text("Route: Recorded external bank payment", pageWidth - margin, 38.5, { align: "right" });
  doc.text("Status follows the saved claim ledger", pageWidth - margin, 42.5, { align: "right" });

  // Divider Line
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, 50, pageWidth - margin, 50);

  // ==========================================
  // 2. SETTLEMENT STATUS BANNER
  // ==========================================
  const isDisbursed = tx.status === "Disbursed";
  if (isDisbursed) {
    doc.setFillColor(236, 253, 245); // emerald-50
    doc.setDrawColor(167, 243, 208); // emerald-200
    doc.roundedRect(margin, 53.5, contentWidth, 13.5, 2, 2, "FD");

    // Emerald status dot
    doc.setFillColor(16, 185, 129); // emerald-500
    doc.circle(margin + 5, 58.7, 1.6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(6, 95, 70); // emerald-800
    doc.text("BANK DISBURSEMENT RECORDED", margin + 8.5, 59.8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(4, 120, 87); // emerald-700
    doc.text("External bank payment recorded by admin.", margin + 8.5, 64.6);

    if (tx.utr) {
      const utrW = 52;
      const utrX = pageWidth - margin - utrW - 2.5;
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(167, 243, 208);
      doc.roundedRect(utrX, 56.8, utrW, 7, 1.5, 1.5, "FD");

      doc.setFont("courier", "bold");
      doc.setFontSize(7.2);
      doc.setTextColor(6, 95, 70);
      doc.text(`UTR: ${tx.utr}`, utrX + utrW / 2, 60.3, { align: "center", baseline: "middle" });
    }
  } else {
    doc.setFillColor(254, 243, 199); // amber-50
    doc.setDrawColor(253, 230, 138); // amber-200
    doc.roundedRect(margin, 53.5, contentWidth, 13.5, 2, 2, "FD");

    // Amber status dot
    doc.setFillColor(217, 119, 6); // amber-600
    doc.circle(margin + 5, 58.7, 1.6, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.2);
    doc.setTextColor(146, 64, 14); // amber-800
    doc.text("PENDING BANK DISBURSEMENT", margin + 8.5, 59.8);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.8);
    doc.setTextColor(180, 83, 9); // amber-700
    doc.text("Awaiting bank payment - this advice is not proof of payment.", margin + 8.5, 64.6);

    const slaW = 46;
    const slaX = pageWidth - margin - slaW - 2.5;
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(253, 230, 138);
    doc.roundedRect(slaX, 56.8, slaW, 7, 1.5, 1.5, "FD");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(180, 83, 9);
    doc.text("Not proof of payment", slaX + slaW / 2, 60.3, { align: "center", baseline: "middle" });
  }

  // ==========================================
  // 3. BENEFICIARY & HOSPITAL 2-COLUMN GRID
  // ==========================================
  const gridY = 70;
  const gridHeight = 31;
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, gridY, contentWidth, gridHeight, 2, 2, "FD");

  // Left Column: Beneficiary
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text("BENEFICIARY HEALTHCARE PROFESSIONAL", margin + 4, gridY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(candidateName, margin + 4, gridY + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Council Reg. #: ${regNumber}`, margin + 4, gridY + 16);
  doc.text(`Role: ${tx.shiftTitle.split(" - ")[0] || "Registered Clinician"}`, margin + 4, gridY + 20.5);
  doc.text(`Saved destination: ${tx.payoutMethodUsed}`, margin + 4, gridY + 25);

  // Center Vertical Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(105, gridY + 3, 105, gridY + gridHeight - 3);

  // Right Column: Hospital & Assignment
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(100, 116, 139);
  doc.text("DUTY HOSPITAL & DEPARTMENT", 110, gridY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(tx.hospitalName, 110, gridY + 11);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text(`Department: ${tx.dept}`, 110, gridY + 16);
  doc.text(`Duty Slot: ${tx.shiftDate}`, 110, gridY + 20.5);
  doc.text(`Verified Hours: ${tx.hours} hrs @ Rs. ${tx.rate.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}/hr`, 110, gridY + 25);

  // ==========================================
  // 4. ITEMIZED REMUNERATION TABLE
  // ==========================================
  const tableTitleY = 107;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("ITEMIZED REMUNERATION STATEMENT", margin, tableTitleY);

  const tableY = 111;
  const tableHeight = 49;
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, tableY, contentWidth, tableHeight, 2, 2, "S");

  // Table Header
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(margin, tableY, contentWidth, 7, 2, 2, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text("Description", margin + 4, tableY + 4.8);
  doc.text("Hours / Units", 115, tableY + 4.8, { align: "center" });
  doc.text("Average Rate", 152, tableY + 4.8, { align: "right" });
  doc.text("Gross Total", pageWidth - margin - 4, tableY + 4.8, { align: "right" });

  // Row 1: Clinical Shift Base Remuneration
  const r1Y = tableY + 13.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Clinical Shift Base Remuneration", margin + 4, r1Y);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`${tx.shiftTitle} (${tx.dept})`, margin + 4, r1Y + 3.8);

  doc.setFont("courier", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`${tx.hours} hrs`, 115, r1Y + 1.5, { align: "center" });
  doc.text(`Rs. ${tx.rate.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}/hr`, 152, r1Y + 1.5, { align: "right" });

  doc.setFont("courier", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(`Rs. ${tx.grossAmount!.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}`, pageWidth - margin - 4, r1Y + 1.5, { align: "right" });

  // Divider
  doc.setDrawColor(241, 245, 249);
  doc.line(margin + 2, r1Y + 6.5, pageWidth - margin - 2, r1Y + 6.5);

  // Row 2: Night Duty Allowance
  const r2Y = r1Y + 11.5;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text("Allowance breakdown", margin + 4, r2Y);
  doc.text("-", 115, r2Y, { align: "center" });
  doc.text("-", 152, r2Y, { align: "right" });
  doc.setFont("courier", "normal");
  doc.text("Included in gross", pageWidth - margin - 4, r2Y, { align: "right" });

  doc.line(margin + 2, r2Y + 3.5, pageWidth - margin - 2, r2Y + 3.5);

  // Row 3: Platform Convenience Fee
  const r3Y = r2Y + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text("FALE Platform Convenience Fee (Candidate)", margin + 4, r3Y);
  doc.text("-", 115, r3Y, { align: "center" });
  doc.setTextColor(16, 185, 129); // emerald
  doc.setFont("helvetica", "bold");
  doc.text(tx.platformFee === 0 ? "No deduction" : "Recorded fee", 152, r3Y, { align: "right" });
  doc.setFont("courier", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Rs. ${tx.platformFee!.toLocaleString("en-IN", {minimumFractionDigits:2})}`, pageWidth - margin - 4, r3Y, { align: "right" });

  doc.line(margin + 2, r3Y + 3.5, pageWidth - margin - 2, r3Y + 3.5);

  // Row 4: TDS
  const r4Y = r3Y + 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(71, 85, 105);
  doc.text("Recorded TDS Withholding", margin + 4, r4Y);
  doc.text("-", 115, r4Y, { align: "center" });
  doc.text("Saved withholding", 152, r4Y, { align: "right" });
  doc.setFont("courier", "normal");
  doc.text(`Rs. ${tx.tdsAmount!.toLocaleString("en-IN", {minimumFractionDigits:2})}`, pageWidth - margin - 4, r4Y, { align: "right" });

  // Total Summary Footer Row
  const totalY = tableY + tableHeight;
  doc.setFillColor(255, 241, 230); // primary/10
  doc.setDrawColor(234, 88, 12);
  doc.roundedRect(margin, totalY + 2, contentWidth, 10, 1.5, 1.5, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(isDisbursed ? "Net Disbursed Professional Remuneration" : "Net Payable - Not Paid", margin + 4, totalY + 8.5);

  doc.setFont("courier", "bold");
  doc.setFontSize(11);
  doc.setTextColor(234, 88, 12);
  doc.text(`Rs. ${tx.amount.toLocaleString("en-IN", {minimumFractionDigits:2,maximumFractionDigits:2})}`, pageWidth - margin - 4, totalY + 8.8, { align: "right" });

  // Amount in Words Bar
  const wordsY = totalY + 15;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, wordsY, contentWidth, 7.5, 1.5, 1.5, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("Amount in words:", margin + 4, wordsY + 5);

  doc.setFont("helvetica", "bolditalic");
  doc.setTextColor(15, 23, 42);
  doc.text(amountInWords(tx.amount), margin + 30, wordsY + 5);

  // ==========================================
  // 5. ESCROW SETTLEMENT TELEMETRY
  // ==========================================
  const telemY = wordsY + 13;
  const colW = contentWidth / 4;

  const telemetry = [
    {label:"Payment record",val:isDisbursed ? "Bank payment recorded" : "Awaiting payment"},
    {label:"Destination",val:"Saved claim destination"},
    {label:"Bank reference",val:tx.utr || "Not recorded"},
    {label:"Timesheet sign-off",val:"Hospital approved"},
  ];

  telemetry.forEach((t, i) => {
    const colX = margin + i * colW;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(t.label, colX + 2, telemY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    doc.text(t.val, colX + 2, telemY + 4.5);
  });

  // ==========================================
  // 6. LEGAL COMPLIANCE & SECURITY SEAL
  // ==========================================
  const footerY = telemY + 14;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  const noteY = footerY + 4.5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.8);
  doc.setTextColor(71, 85, 105);
  doc.text("Compliance & Legal Validity Note:", margin, noteY);

  // Left column: legal text strictly constrained to maxWidth 120mm
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.0);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "Amounts reflect the saved claim ledger. This advice is not a tax certificate and does not confirm tax deposit or filing. Pending advice does not confirm payment.",
    margin,
    noteY + 4,
    { maxWidth: 120 }
  );

  // Right column: Seal Stamp safely positioned at x = 146mm with 11mm clear gap
  const sealWidth = 49;
  const sealX = pageWidth - margin - sealWidth;
  doc.setFillColor(255, 241, 230);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(sealX, footerY + 2.5, sealWidth, 12, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(234, 88, 12);
  doc.text("FALE PAYOUT RECORD", sealX + sealWidth / 2, footerY + 7.2, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text("System-generated record", sealX + sealWidth / 2, footerY + 11.2, { align: "center" });

  return doc;
}

export function generatePayoutAdvicePdf(
  tx: PayoutAdviceRecord,
  candidateName: string,
  regNumber: string = "Not recorded"
) {
  const doc = buildPayoutAdviceDoc(tx, candidateName, regNumber);
  const filename = `FALE-Payout-Advice-${tx.slipRef || tx.id}.pdf`;
  doc.save(filename);
}

export function printPayoutAdvicePdf(tx: PayoutAdviceRecord, candidateName: string, regNumber = "Not recorded") {
  const doc = buildPayoutAdviceDoc(tx, candidateName, regNumber); doc.autoPrint();
  const url = URL.createObjectURL(doc.output("blob"));
  const opened = window.open("about:blank", "_blank");
  if (!opened) { URL.revokeObjectURL(url); throw new Error("Allow popups to print the payout advice, or download the PDF."); }
  opened.opener = null; opened.location.href = url;
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
