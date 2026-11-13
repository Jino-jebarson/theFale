import { walletDocumentTitle } from "./walletDocuments";
import { amountInWords } from "./amountInWords";
import { jsPDF } from "jspdf";
import { recordedBaseAmount } from "./shiftCharges";

export interface HospitalInvoicePdfData {
  transactionType?: string | undefined;
  disbursedAt?: string | undefined;
  canonicalDocument?: boolean | undefined;
  invoiceId: string;
  date: string;
  period: string;
  hospitalName: string;
  facilityAddress?: string;
  gstin?: string;
  refNumber: string;
  utr?: string;
  description: string;
  subtitle?: string;
  subtotal: number;
  platformFee?: number | undefined;
  gst: number;
  total: number;
  status: string;
  nodalAccount?: string;
  docType?: "TAX_INVOICE" | "CREDIT_NOTE" | "ESCROW_RECEIPT";
}

function resolveDocType(data: HospitalInvoicePdfData): "TAX_INVOICE" | "CREDIT_NOTE" | "ESCROW_RECEIPT" {
  if (data.docType) return data.docType;
  if (data.invoiceId?.startsWith("CRN-") || data.status?.toLowerCase().includes("refund")) {
    return "CREDIT_NOTE";
  }
  if (data.status?.toLowerCase().includes("escrow") && Number(data.gst || 0) === 0) {
    return "ESCROW_RECEIPT";
  }
  return "TAX_INVOICE";
}

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

    // Wordmark: "the"
    ctx.fillStyle = "#ea580c";
    ctx.font = "italic 800 24px 'Fraunces', Georgia, serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.fillText("the", 102, 48);

    // Wordmark: "fale"
    ctx.fillStyle = "#0f172a";
    ctx.font = "italic 900 56px 'Fraunces', Georgia, serif";
    ctx.fillText("fale", 100, 92);

    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}

export function buildHospitalInvoiceDoc(data: HospitalInvoicePdfData): jsPDF {
  const docType = resolveDocType(data);
  const isCreditNote = docType === "CREDIT_NOTE";
  const isEscrowReceipt = docType === "ESCROW_RECEIPT";

  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2; // 180mm

  // Outer Border Frame
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, 10, 190, 277, 3, 3, "S");

  // Top Header Brand Stripe
  doc.setFillColor(249, 115, 22);
  doc.rect(10, 10, 190, 3, "F");

  // Logo
  const logoData = createLogoCanvas();
  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", margin, 16, 42, 13.5);
    } catch {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(234, 88, 12);
      doc.text("the fale", margin, 26);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(234, 88, 12);
    doc.text("the fale", margin, 26);
  }

  // Right Side Header: Document Title & Tax Status
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  const headerTitle = "SETTLEMENT STATEMENT";
  const headerSubtitle = walletDocumentTitle(data.transactionType, data.status);
  const headerStatus = "STATUS: " + data.status.toUpperCase();

  doc.text(headerTitle, pageWidth - margin, 21, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text(headerSubtitle, pageWidth - margin, 26, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  if (isCreditNote) {
    doc.setTextColor(217, 119, 6);
  } else {
    doc.setTextColor(16, 185, 129);
  }
  doc.text(headerStatus, pageWidth - margin, 31, { align: "right" });

  // Divider rule
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.3);
  doc.line(margin, 35, pageWidth - margin, 35);

  // Meta Section: 2 Columns
  const metaY = 41;
  const colW = (contentWidth - 6) / 2;

  // Box 1: Billed To (Healthcare Facility)
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, metaY, colW, 36, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("BILLED TO (HEALTHCARE FACILITY)", margin + 4, metaY + 5.5);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text(data.hospitalName || "Partner Healthcare Facility", margin + 4, metaY + 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`GSTIN: ${data.gstin || "Not recorded"}`, margin + 4, metaY + 17.5);
  doc.text(data.facilityAddress || "Address not recorded", margin + 4, metaY + 22.5, { maxWidth: colW - 8 });
  doc.text(`Settlement Entity: Institutional Primary Current Account`, margin + 4, metaY + 31.5);

  // Box 2: Invoice & Escrow Particulars
  const col2X = margin + colW + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col2X, metaY, colW, 36, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(isCreditNote ? "CREDIT NOTE & ESCROW PARTICULARS" : "INVOICE & ESCROW PARTICULARS", col2X + 4, metaY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  doc.text(isCreditNote ? "Credit Note #:" : "Invoice Number:", col2X + 4, metaY + 11.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(data.invoiceId, col2X + colW - 4, metaY + 11.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(isCreditNote ? "Issue Date:" : "Invoice Date:", col2X + 4, metaY + 17);
  doc.text(data.date, col2X + colW - 4, metaY + 17, { align: "right" });

  doc.text("Reference / UTR:", col2X + 4, metaY + 22.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(data.utr || data.refNumber || "Not recorded", col2X + colW - 4, metaY + 22.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Saved destination:", col2X + 4, metaY + 28);
  doc.setFont("helvetica", "bold");
  doc.text(data.nodalAccount || "Not recorded", col2X + colW - 4, metaY + 28, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(data.disbursedAt ? "Bank disbursed:" : "Billing Period:", col2X + 4, metaY + 33.5);
  doc.text(data.disbursedAt ? new Date(data.disbursedAt).toLocaleString("en-IN",{timeZone:"Asia/Kolkata"}) : data.period, col2X + colW - 4, metaY + 33.5, { align: "right" });

  // Table Header
  const tableTop = 84;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, tableTop, contentWidth, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("SERVICE / ITEM DESCRIPTION", margin + 4, tableTop + 5.5);
  doc.text("FEE (EX GST)", margin + 95, tableTop + 5.5);
  doc.text("SUBTOTAL", margin + 128, tableTop + 5.5, { align: "right" });
  doc.text("GST ON FEE", margin + 154, tableTop + 5.5, { align: "right" });
  doc.text("TOTAL (INR)", pageWidth - margin - 4, tableTop + 5.5, { align: "right" });

  // Table Row 1
  const rowY = tableTop + 14;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(data.description, margin + 4, rowY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(data.subtitle || "Institutional clinical staffing, sourcing credits & escrow custody services", margin + 4, rowY + 4.5, { maxWidth: 85 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(data.platformFee == null ? "Not recorded" : data.platformFee.toLocaleString("en-IN", {minimumFractionDigits:2}), margin + 95, rowY);

  const subtotalNum = Number(data.subtotal) || 0;
  const gstNum = Number(data.gst) || 0;
  const totalNum = Number(data.total) || 0;

  const subtotalFormatted = "INR " + subtotalNum.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const gstFormatted = "INR " + gstNum.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const totalFormatted = "INR " + totalNum.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  doc.text(subtotalFormatted, margin + 128, rowY, { align: "right" });
  doc.text(gstFormatted, margin + 154, rowY, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(totalFormatted, pageWidth - margin - 4, rowY, { align: "right" });

  // Bottom table line
  const dividerY = rowY + 16;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, dividerY, pageWidth - margin, dividerY);

  // Financial Breakdown Box (Bottom Right)
  const totalsW = 85;
  const totalsX = pageWidth - margin - totalsW;
  const totalsY = dividerY + 6;

  doc.setFillColor(248, 250, 252);
  doc.roundedRect(totalsX, totalsY, totalsW, 50, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);

  const baseAmount = recordedBaseAmount(subtotalNum, data.platformFee);
  const baseLabel = data.transactionType === "disbursement" || data.transactionType === "escrow_hold" ? "Base shift amount:" : "Base amount:";
  doc.text(baseLabel, totalsX + 4, totalsY + 6);
  doc.setTextColor(15, 23, 42);
  doc.text(baseAmount == null ? "Not recorded" : "INR " + baseAmount.toLocaleString("en-IN", {minimumFractionDigits: 2, maximumFractionDigits: 2}), totalsX + totalsW - 4, totalsY + 6, { align: "right" });

  doc.setTextColor(100,116,139);
  doc.text("Platform fee:", totalsX+4,totalsY+12);
  doc.setTextColor(15,23,42);
  doc.text(data.platformFee == null ? "Not recorded" : "INR " + data.platformFee.toLocaleString("en-IN",{minimumFractionDigits:2}),totalsX+totalsW-4,totalsY+12,{align:"right"});
  doc.setTextColor(100,116,139);doc.text("Subtotal before GST:",totalsX+4,totalsY+18);
  doc.setTextColor(15,23,42);doc.text(subtotalFormatted,totalsX+totalsW-4,totalsY+18,{align:"right"});
  doc.setTextColor(100,116,139);doc.text("GST on platform fee:",totalsX+4,totalsY+24);
  doc.setTextColor(15,23,42);doc.text(gstFormatted,totalsX+totalsW-4,totalsY+24,{align:"right"});
  // Total Line Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(totalsX + 3, totalsY + 28, totalsX + totalsW - 3, totalsY + 28);

  // Total Net
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Total recorded:", totalsX + 4, totalsY + 35);
  doc.setTextColor(234, 88, 12);
  doc.text(totalFormatted, totalsX + totalsW - 4, totalsY + 35, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(16, 185, 129);
  doc.text(
    data.status !== "Completed" && data.status !== "Refunded" ? "Not proof of payment or receipt of funds" : "Recorded wallet transaction",
    totalsX + totalsW - 4,
    totalsY + 42,
    { align: "right" }
  );

  // Left Note: In Words & Tax Statement
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text("Amount in Words:", margin, totalsY + 6);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(amountInWords(data.total), margin, totalsY + 12, { maxWidth: totalsX - margin - 8 });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("GST is recorded on the platform fee only.",margin,totalsY+24);
  doc.text(data.canonicalDocument ? "Saved transaction record" : "Historical record: reconciliation may not be recorded.",margin,totalsY+29,{maxWidth:totalsX-margin-8});
  // Statutory Footer & Cryptographic Seal
  const footerY = 250;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "System-generated settlement statement showing recorded wallet amounts. This is not a statutory tax invoice. Formal invoicing requires verified issuer and supply details.",
    margin,
    footerY + 5,
    { maxWidth: 125 }
  );

  // Official Seal Badge
  const sealWidth = 46;
  const sealX = pageWidth - margin - sealWidth;
  doc.setFillColor(255, 241, 230);
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(sealX, footerY + 3.5, sealWidth, 13, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(234, 88, 12);
  doc.text("FALE WALLET RECORD", sealX + sealWidth / 2, footerY + 8.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text("System-generated record", sealX + sealWidth / 2, footerY + 13, { align: "center" });

  return doc;
}

export function generateHospitalInvoicePdf(data: HospitalInvoicePdfData) {
  const doc = buildHospitalInvoiceDoc(data);
  const filename = `FALE-Wallet-Statement-${data.invoiceId}.pdf`;
  doc.save(filename);
}

export function printHospitalInvoicePdf(data: HospitalInvoicePdfData) {
  const doc = buildHospitalInvoiceDoc(data); doc.autoPrint();
  const url = URL.createObjectURL(doc.output("blob")); const tab = window.open("about:blank", "_blank");
  if (!tab) { URL.revokeObjectURL(url); throw new Error("Allow pop-ups to print this statement."); }
  tab.opener = null; tab.location.href = url; setTimeout(() => URL.revokeObjectURL(url), 60000);
}
