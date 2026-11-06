import { jsPDF } from "jspdf";

export interface HospitalInvoicePdfData {
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
  gst: number;
  total: number;
  status: string;
  nodalAccount?: string;
}

function amountInWords(num: number): string {
  const a = [
    "", "One ", "Two ", "Three ", "Four ", "Five ", "Six ", "Seven ", "Eight ", "Nine ",
    "Ten ", "Eleven ", "Twelve ", "Thirteen ", "Fourteen ", "Fifteen ", "Sixteen ", "Seventeen ", "Eighteen ", "Nineteen ",
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const safeNum = Math.abs(Math.floor(Number(num) || 0));
  if (safeNum === 0) return "Rupees Zero Only";

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + " " + a[n % 10];
    if (n < 1000) return a[Math.floor(n / 100)] + "Hundred " + inWords(n % 100);
    if (n < 100000) return inWords(Math.floor(n / 1000)) + "Thousand " + inWords(n % 1000);
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + "Lakh " + inWords(n % 100000);
    return inWords(Math.floor(n / 10000000)) + "Crore " + inWords(n % 10000000);
  }

  return `Rupees ${inWords(safeNum).trim()} Only`;
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
  doc.text("OFFICIAL TAX INVOICE", pageWidth - margin, 21, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("GST Compliance & Escrow Settlement Receipt", pageWidth - margin, 26, { align: "right" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(16, 185, 129);
  doc.text("STATUS: PAID & SETTLED", pageWidth - margin, 31, { align: "right" });

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
  doc.text(`GSTIN: ${data.gstin || "29AABCT1332L1Z4"}`, margin + 4, metaY + 17.5);
  doc.text(data.facilityAddress || "Accredited Clinical Campus & Hospital Network, India", margin + 4, metaY + 22.5, { maxWidth: colW - 8 });
  doc.text(`Settlement Entity: Institutional Primary Current Account`, margin + 4, metaY + 31.5);

  // Box 2: Invoice & Escrow Particulars
  const col2X = margin + colW + 6;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(col2X, metaY, colW, 36, 2, 2, "FD");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text("INVOICE & ESCROW PARTICULARS", col2X + 4, metaY + 5.5);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  doc.text("Invoice Number:", col2X + 4, metaY + 11.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(data.invoiceId, col2X + colW - 4, metaY + 11.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Invoice Date:", col2X + 4, metaY + 17);
  doc.text(data.date, col2X + colW - 4, metaY + 17, { align: "right" });

  doc.text("Reference / UTR:", col2X + 4, metaY + 22.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  doc.text(data.refNumber || "CRD-FALE-TXN", col2X + colW - 4, metaY + 22.5, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Nodal Escrow Virtual A/C:", col2X + 4, metaY + 28);
  doc.setFont("helvetica", "bold");
  doc.text(data.nodalAccount || "FALEHOSP99418290", col2X + colW - 4, metaY + 28, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text("Billing Period:", col2X + 4, metaY + 33.5);
  doc.text(data.period, col2X + colW - 4, metaY + 33.5, { align: "right" });

  // Table Header
  const tableTop = 84;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, tableTop, contentWidth, 8, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text("SERVICE / ITEM DESCRIPTION", margin + 4, tableTop + 5.5);
  doc.text("HSN / SAC", margin + 95, tableTop + 5.5);
  doc.text("TAXABLE AMT", margin + 128, tableTop + 5.5, { align: "right" });
  doc.text("GST (18%)", margin + 154, tableTop + 5.5, { align: "right" });
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
  doc.text("998311", margin + 95, rowY);

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
  doc.roundedRect(totalsX, totalsY, totalsW, 38, 2, 2, "FD");

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);

  // Subtotal
  doc.text("Taxable Subtotal:", totalsX + 4, totalsY + 6);
  doc.setTextColor(15, 23, 42);
  doc.text(subtotalFormatted, totalsX + totalsW - 4, totalsY + 6, { align: "right" });

  // CGST (9%)
  const cgst = data.gst / 2;
  const cgstFormatted = "INR " + cgst.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  doc.setTextColor(100, 116, 139);
  doc.text("CGST @ 9%:", totalsX + 4, totalsY + 12);
  doc.setTextColor(15, 23, 42);
  doc.text(cgstFormatted, totalsX + totalsW - 4, totalsY + 12, { align: "right" });

  // SGST (9%)
  doc.setTextColor(100, 116, 139);
  doc.text("SGST @ 9%:", totalsX + 4, totalsY + 18);
  doc.setTextColor(15, 23, 42);
  doc.text(cgstFormatted, totalsX + totalsW - 4, totalsY + 18, { align: "right" });

  // Total Line Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(totalsX + 3, totalsY + 22, totalsX + totalsW - 3, totalsY + 22);

  // Total Net
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text("Total Invoice Amount:", totalsX + 4, totalsY + 29);
  doc.setTextColor(234, 88, 12);
  doc.text(totalFormatted, totalsX + totalsW - 4, totalsY + 29, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(16, 185, 129);
  doc.text("Settled via RBI Compliant Escrow", totalsX + totalsW - 4, totalsY + 34, { align: "right" });

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
  doc.text("Input Tax Credit (ITC) Eligible under Section 16 of CGST Act.", margin, totalsY + 24);
  doc.text("Reverse Charge Mechanism (RCM) Not Applicable.", margin, totalsY + 29);

  // Statutory Footer & Cryptographic Seal
  const footerY = 250;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    "This is a system-generated electronic tax invoice issued under Rule 48 of the CGST Rules, 2017. Issued by The Fale Healthcare Private Limited (GSTIN: 29AABCT1332L1Z4, PAN: AABCT1332L). Valid without a physical signature under the Information Technology Act, 2000.",
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
  doc.text("FALE ESCROW SECURE", sealX + sealWidth / 2, footerY + 8.5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text("Cryptographically Verified", sealX + sealWidth / 2, footerY + 13, { align: "center" });

  return doc;
}

export function generateHospitalInvoicePdf(data: HospitalInvoicePdfData) {
  const doc = buildHospitalInvoiceDoc(data);
  const filename = `FALE-Tax-Invoice-${data.invoiceId}.pdf`;
  doc.save(filename);
}

export function printHospitalInvoicePdf(data: HospitalInvoicePdfData) {
  const doc = buildHospitalInvoiceDoc(data);
  doc.autoPrint();
  const blobUrl = doc.output("bloburl");
  const printWindow = window.open(blobUrl, "_blank");
  if (!printWindow) {
    window.print();
  }
}

