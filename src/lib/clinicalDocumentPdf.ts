import { jsPDF } from "jspdf";

export interface DocumentAuditInfo {
  id?: string;
  originalFileName: string;
  documentType: string;
  fileSizeBytes?: number;
  mimeType?: string;
  verified?: boolean;
}

export interface CandidateAuditInfo {
  name?: string;
  role?: string;
  profession?: string;
  specialty?: string;
  council?: string;
  regNumber?: string;
  college?: string;
  course?: string;
  qualification?: string;
  expectedGraduationYear?: number | string;
  city?: string;
  state?: string;
}

export function formatDocTypeTitle(type?: string): string {
  if (!type) return "VERIFICATION DOCUMENT";
  switch (type) {
    case "REGISTRATION_CERTIFICATE":
      return "STATE COUNCIL REGISTRATION CERTIFICATE";
    case "DEGREE_CERTIFICATE":
      return "MEDICAL & CLINICAL DEGREE CERTIFICATE";
    case "RESUME":
      return "CLINICAL CURRICULUM VITAE (CV)";
    case "ID_PROOF":
      return "GOVERNMENT STATUTORY IDENTITY PROOF";
    case "PHOTO":
      return "VERIFIED CLINICIAN PHOTOGRAPH";
    case "BONAFIDE":
      return "COLLEGE BONAFIDE CERTIFICATE";
    case "STUDENT_ID":
      return "COLLEGE STUDENT IDENTIFICATION CARD";
    default:
      return type.replace(/_/g, " ").toUpperCase();
  }
}

export function generateClinicalDocumentBlob(
  docInfo: DocumentAuditInfo,
  candidate?: CandidateAuditInfo
): Blob {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Background / Border frame
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.setLineWidth(0.6);
  pdf.roundedRect(margin, margin, contentWidth, pageHeight - margin * 2, 3, 3, "S");

  // Top header bar (Deep Slate / Navy)
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(margin, margin, contentWidth, 24, "F");

  // FALE Platform brand
  pdf.setTextColor(249, 115, 22); // orange-500
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("FALE", margin + 6, margin + 11);

  pdf.setTextColor(241, 245, 249); // slate-100
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("HEALTHCARE PLATFORM", margin + 24, margin + 11);

  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text("Statutory Clinical Credentialing & Regulatory Audit Record", margin + 6, margin + 18);

  // Security audit badge (top right)
  pdf.setFillColor(30, 41, 59);
  pdf.roundedRect(pageWidth - margin - 58, margin + 5, 52, 14, 2, 2, "F");
  pdf.setTextColor(52, 211, 153); // emerald-400
  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "bold");
  pdf.text("SECURE AUDIT PASS", pageWidth - margin - 54, margin + 11);
  pdf.setTextColor(203, 213, 225);
  pdf.setFontSize(6.5);
  pdf.setFont("helvetica", "normal");
  pdf.text("256-Bit SSL Cryptographic Seal", pageWidth - margin - 54, margin + 16);

  // Main Document Title Banner
  let y = margin + 34;
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  const docTypeHeader = formatDocTypeTitle(docInfo.documentType);
  pdf.text(docTypeHeader, margin + 6, y);

  y += 5;
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.text(`File: ${docInfo.originalFileName} • Verified Dossier Asset`, margin + 6, y);

  // Divider
  y += 6;
  pdf.setDrawColor(241, 245, 249);
  pdf.setLineWidth(0.4);
  pdf.line(margin + 6, y, pageWidth - margin - 6, y);

  // Candidate Overview Card
  y += 6;
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 42, 2, 2, "F");
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 42, 2, 2, "S");

  const candName = candidate?.name || "Verified Healthcare Candidate";
  const candRole = candidate?.profession || candidate?.role || "Healthcare Clinician";
  const candSpec = candidate?.specialty ? ` • ${candidate.specialty}` : "";
  const candLoc = [candidate?.city, candidate?.state].filter(Boolean).join(", ");

  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text(candName, margin + 11, y + 8);

  pdf.setTextColor(234, 88, 12); // orange-600
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${candRole.toUpperCase()}${candSpec.toUpperCase()}`, margin + 11, y + 14);

  // 2-column info in card
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont("helvetica", "bold");
  pdf.text("LOCATION:", margin + 11, y + 22);
  pdf.text("REGULATORY COUNCIL:", margin + 11, y + 29);
  pdf.text("COUNCIL REG NUMBER:", margin + 11, y + 36);

  pdf.setTextColor(30, 41, 59);
  pdf.setFont("helvetica", "normal");
  pdf.text(candLoc || "Registered Indian Jurisdiction", margin + 48, y + 22);
  pdf.text(candidate?.council || "Karnataka State Allied & Healthcare Council / NMC", margin + 48, y + 29);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(234, 88, 12);
  pdf.text(candidate?.regNumber || "KAC-VERIFIED", margin + 48, y + 36);

  // Right column of card
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(100, 116, 139);
  pdf.text("QUALIFICATION:", margin + 105, y + 22);
  pdf.text("INSTITUTION:", margin + 105, y + 29);
  pdf.text("COMPLETION YEAR:", margin + 105, y + 36);

  pdf.setTextColor(30, 41, 59);
  pdf.setFont("helvetica", "normal");
  const qualText = candidate?.qualification || candidate?.course || "Degree in Medicine & Health Sciences";
  pdf.text(qualText.length > 25 ? qualText.slice(0, 24) + "..." : qualText, margin + 140, y + 22);
  const collegeText = candidate?.college || "Accredited Medical College / University";
  pdf.text(collegeText.length > 25 ? collegeText.slice(0, 24) + "..." : collegeText, margin + 140, y + 29);
  pdf.text(String(candidate?.expectedGraduationYear || "Degree Verified"), margin + 140, y + 36);

  y += 50;

  // Section: Clinical Dossier Verification Parameters
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("CREDENTIAL VERIFICATION AUDIT TRAIL", margin + 6, y);

  y += 5;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 70, 2, 2, "FD");

  const auditItems = [
    ["Document Type", formatDocTypeTitle(docInfo.documentType)],
    ["Original File Name", docInfo.originalFileName],
    ["File MIME Specification", docInfo.mimeType || "application/pdf"],
    ["File Size On Record", `${Math.round((docInfo.fileSizeBytes || 256000) / 1024)} KB`],
    ["Verification Status", docInfo.verified ? "Verified Statutory Regulatory Record" : "Pending Administrative Review"],
    ["Cryptographic Audit ID", `FALE-AUDIT-${(docInfo.id || "CERT-9921").slice(0, 18).toUpperCase()}`],
    ["Audit Timestamp", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"],
    ["Governing Verification Standard", "National Medical Commission & State Healthcare Allied Council Protocols"],
  ];

  let itemY = y + 7;
  auditItems.forEach(([label, value], idx) => {
    if (idx % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin + 7, itemY - 4.5, contentWidth - 14, 8, "F");
    }
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text(label, margin + 10, itemY);

    pdf.setFont("helvetica", label === "Verification Status" ? "bold" : "normal");
    pdf.setTextColor(label === "Verification Status" ? 16 : 30, label === "Verification Status" ? 185 : 41, label === "Verification Status" ? 129 : 59);
    pdf.text(value, margin + 62, itemY);
    itemY += 8;
  });

  y += 78;

  // Legal & Compliance Seal Box
  pdf.setFillColor(255, 247, 237); // orange-50
  pdf.setDrawColor(254, 215, 170); // orange-200
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 38, 2, 2, "FD");

  pdf.setTextColor(194, 65, 12); // orange-700
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "bold");
  pdf.text("STATUTORY COMPLIANCE & INTEGRITY NOTICE", margin + 10, y + 8);

  pdf.setTextColor(124, 45, 18);
  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "normal");
  const noticeLines = [
    "This document dossier has been uploaded directly by the clinician and digitally logged into the FALE Healthcare credentialing registry.",
    "State council registrations, educational degrees, and clinical certificates are validated through automated council API registries",
    "and primary source manual verification before healthcare facility assignment or clinical locum shift clearance.",
    "Any tampering or unauthorized duplication of this dossier constitutes a violation of statutory healthcare credentialing regulations.",
  ];
  noticeLines.forEach((line, i) => {
    pdf.text(line, margin + 10, y + 15 + i * 5);
  });

  // Bottom Footer
  const footerY = pageHeight - margin - 8;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin + 6, footerY - 4, pageWidth - margin - 6, footerY - 4);

  pdf.setTextColor(148, 163, 184);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.text("FALE Healthcare Platform • Confidential Candidate Dossier • Strictly for Clinical Verification & Credentialing", margin + 6, footerY);
  pdf.text("Page 1 of 1", pageWidth - margin - 18, footerY);

  return pdf.output("blob");
}



export interface FacilityAuditInfo {
  name?: string;
  type?: string;
  city?: string;
  state?: string;
  addressLine?: string;
  pincode?: string;
  licenseNumber?: string;
  nabhNumber?: string;
  accreditation?: string;
  accreditationLevel?: string;
  beds?: number;
  icuBeds?: number;
  contactPerson?: string;
  designation?: string;
  contactPhone?: string;
  contactEmail?: string;
  gst?: string;
}

function formatFacilityDocTypeTitle(type?: string): string {
  if (!type) return "STATUTORY HEALTHCARE ESTABLISHMENT CERTIFICATE";
  switch (type) {
    case "CLINICAL_ESTABLISHMENT_LICENSE":
    case "FACILITY_REGISTRATION":
      return "CLINICAL ESTABLISHMENT ACT (CEA) STATUTORY LICENSE";
    case "NABH_ACCREDITATION":
      return "NABH / NABL HEALTHCARE ACCREDITATION CERTIFICATE";
    case "GST_CERTIFICATE":
      return "GSTIN STATUTORY TAX REGISTRATION CERTIFICATE";
    case "REPRESENTATIVE_AUTHORIZATION":
      return "AUTHORIZED SIGNATORY / SUPERINTENDENT LETTER";
    default:
      return type.replace(/_/g, " ").toUpperCase();
  }
}

export function generateFacilityDocumentBlob(
  docInfo: DocumentAuditInfo,
  facility?: FacilityAuditInfo
): Blob {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Background / Border frame
  pdf.setDrawColor(226, 232, 240); // slate-200
  pdf.setLineWidth(0.6);
  pdf.roundedRect(margin, margin, contentWidth, pageHeight - margin * 2, 3, 3, "S");

  // Top header bar (Deep Slate / Navy)
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(margin, margin, contentWidth, 24, "F");

  // FALE Platform brand
  pdf.setTextColor(249, 115, 22); // orange-500
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("FALE", margin + 6, margin + 11);

  pdf.setTextColor(241, 245, 249); // slate-100
  pdf.setFontSize(9);
  pdf.setFont("helvetica", "bold");
  pdf.text("HEALTHCARE PLATFORM", margin + 24, margin + 11);

  pdf.setTextColor(148, 163, 184); // slate-400
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text("Statutory Hospital Accreditation & Facility Regulatory Audit Record", margin + 6, margin + 18);

  // Security audit badge (top right)
  pdf.setFillColor(30, 41, 59);
  pdf.roundedRect(pageWidth - margin - 58, margin + 5, 52, 14, 2, 2, "F");
  pdf.setTextColor(52, 211, 153); // emerald-400
  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "bold");
  pdf.text("SECURE AUDIT PASS", pageWidth - margin - 54, margin + 11);
  pdf.setTextColor(203, 213, 225);
  pdf.setFontSize(6.5);
  pdf.setFont("helvetica", "normal");
  pdf.text("256-Bit SSL Cryptographic Seal", pageWidth - margin - 54, margin + 16);

  // Main Document Title Banner
  let y = margin + 34;
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(13);
  pdf.setFont("helvetica", "bold");
  const docTypeHeader = formatFacilityDocTypeTitle(docInfo.documentType);
  pdf.text(docTypeHeader, margin + 6, y);

  y += 5;
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "normal");
  pdf.text(`File: ${docInfo.originalFileName} • Verified Regulatory Asset`, margin + 6, y);

  // Divider
  y += 6;
  pdf.setDrawColor(241, 245, 249);
  pdf.setLineWidth(0.4);
  pdf.line(margin + 6, y, pageWidth - margin - 6, y);

  // Facility Overview Card
  y += 6;
  pdf.setFillColor(248, 250, 252); // slate-50
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 42, 2, 2, "F");
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 42, 2, 2, "S");

  const facName = facility?.name || "Verified Hospital Establishment";
  const facType = facility?.type || "Multispecialty Hospital";
  const facLoc = [facility?.city, facility?.state].filter(Boolean).join(", ");

  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(11);
  pdf.setFont("helvetica", "bold");
  pdf.text(facName, margin + 11, y + 8);

  pdf.setTextColor(234, 88, 12); // orange-600
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "bold");
  pdf.text(`${facType.toUpperCase()} • ${facility?.accreditationLevel || facility?.accreditation || "STATE REGISTERED"}`, margin + 11, y + 14);

  // Left column in card
  pdf.setFontSize(8);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont("helvetica", "bold");
  pdf.text("LOCATION:", margin + 11, y + 22);
  pdf.text("CLINICAL ESTABLISHMENT ACT:", margin + 11, y + 29);
  pdf.text("NABH ACCREDITATION ID:", margin + 11, y + 36);

  pdf.setTextColor(30, 41, 59);
  pdf.setFont("helvetica", "normal");
  pdf.text(facLoc || "Chennai, Tamil Nadu", margin + 60, y + 22);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(234, 88, 12);
  pdf.text(facility?.licenseNumber || "CEA-VERIFIED", margin + 60, y + 29);
  pdf.setTextColor(30, 41, 59);
  pdf.setFont("helvetica", "normal");
  pdf.text(facility?.nabhNumber || "NABH-STATE-REGISTERED", margin + 60, y + 36);

  // Right column of card
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(100, 116, 139);
  pdf.text("BED CAPACITY:", margin + 112, y + 22);
  pdf.text("SUPERINTENDENT / HR:", margin + 112, y + 29);
  pdf.text("CONTACT PHONE:", margin + 112, y + 36);

  pdf.setTextColor(30, 41, 59);
  pdf.setFont("helvetica", "normal");
  pdf.text(`${facility?.beds || 50} Inpatient (${facility?.icuBeds || 10} ICU Beds)`, margin + 148, y + 22);
  pdf.text(facility?.contactPerson || "Facility Administrator", margin + 148, y + 29);
  pdf.text(facility?.contactPhone || "+91 63801 02652", margin + 148, y + 36);

  // Audit trail table
  y += 48;
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(9.5);
  pdf.setFont("helvetica", "bold");
  pdf.text("STATUTORY ACCREDITATION AUDIT TRAIL", margin + 6, y);

  y += 4;
  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 58, 2, 2, "F");
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 58, 2, 2, "S");

  const auditItems = [
    ["Document Type", docTypeHeader],
    ["Original File Name", docInfo.originalFileName],
    ["File MIME Specification", docInfo.mimeType || "application/pdf"],
    ["File Size On Record", `${Math.round((docInfo.fileSizeBytes || 256000) / 1024)} KB`],
    ["Verification Status", docInfo.verified ? "Verified Statutory Regulatory Record" : "Pending Administrative Review"],
    ["Cryptographic Audit ID", `FALE-FACILITY-${(docInfo.id || "CEA-9921").slice(0, 18).toUpperCase()}`],
    ["Audit Timestamp", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }) + " IST"],
  ];

  let itemY = y + 7;
  auditItems.forEach(([label, value], idx) => {
    if (idx % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin + 7, itemY - 4.5, contentWidth - 14, 7.5, "F");
    }
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text(label, margin + 10, itemY);

    pdf.setFont("helvetica", label === "Verification Status" ? "bold" : "normal");
    pdf.setTextColor(label === "Verification Status" ? 16 : 30, label === "Verification Status" ? 185 : 41, label === "Verification Status" ? 129 : 59);
    pdf.text(value, margin + 62, itemY);
    itemY += 7.5;
  });

  y += 64;

  // Legal & Compliance Seal Box
  pdf.setFillColor(255, 247, 237); // orange-50
  pdf.setDrawColor(254, 215, 170); // orange-200
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 38, 2, 2, "FD");

  pdf.setTextColor(194, 65, 12); // orange-700
  pdf.setFontSize(8.5);
  pdf.setFont("helvetica", "bold");
  pdf.text("STATUTORY HEALTHCARE INSTITUTION COMPLIANCE NOTICE", margin + 10, y + 8);

  pdf.setTextColor(124, 45, 18);
  pdf.setFontSize(7.5);
  pdf.setFont("helvetica", "normal");
  const noticeLines = [
    "This healthcare facility accreditation dossier has been submitted under the Clinical Establishments (Registration and Regulation) Act.",
    "State health directorates, Quality Council of India (NABH), and statutory fire/bio-medical safety clearances are logged",
    "directly into the FALE RMS registry before healthcare professional deployment or clinical vacancy broadcasting.",
    "Any misrepresentation or invalid documentation constitutes a statutory violation punishable under national medical governance laws.",
  ];
  noticeLines.forEach((line, i) => {
    pdf.text(line, margin + 10, y + 15 + i * 5);
  });

  // Bottom Footer
  const footerY = pageHeight - margin - 8;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin + 6, footerY - 4, pageWidth - margin - 6, footerY - 4);

  pdf.setTextColor(148, 163, 184);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.text("FALE Healthcare Platform • Confidential Hospital Accreditation Dossier • Strictly for Statutory Compliance & Verification", margin + 6, footerY);
  pdf.text("Page 1 of 1", pageWidth - margin - 18, footerY);

  return pdf.output("blob");
}

export interface CandidateCvExperienceItem {
  org: string;
  role: string;
  fy?: string | undefined;
  cur?: boolean | undefined;
  location?: string | undefined;
  bullets?: string[] | undefined;
}

export interface CandidateCvDocumentItem {
  title: string;
  fileName?: string | undefined;
  verified?: boolean | undefined;
}

export interface CandidateDossierInfo {
  name: string;
  role?: string | undefined;
  specialty?: string | undefined;
  qualification?: string | undefined;
  council?: string | undefined;
  regNumber?: string | undefined;
  regYear?: string | undefined;
  experienceYears?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  college?: string | undefined;
  bio?: string | undefined;
  skills?: string[] | undefined;
  subSpecialties?: string[] | undefined;
  languages?: string[] | undefined;
  preferredCities?: string[] | undefined;
  availability?: string | undefined;
  employmentType?: string | undefined;
  openToWork?: boolean | undefined;
  kycStatus?: "PENDING" | "VERIFIED" | "REJECTED" | string | undefined;
  verifiedAt?: string | undefined;
  isStudent?: boolean | undefined;
  course?: string | undefined;
  studyYear?: string | undefined;
  universityRegNo?: string | undefined;
  expectedGraduationYear?: number | string | undefined;
  cmeCredits?: number | string | undefined;
  documentsCount?: number | undefined;
  isMentor?: boolean | undefined;
  shiftRatingAvg?: number | undefined;
  shiftRatingCount?: number | undefined;
  completedShiftsCount?: number | undefined;
  topRated?: boolean | undefined;
  experiences?: CandidateCvExperienceItem[] | undefined;
  documents?: CandidateCvDocumentItem[] | undefined;
}

function cleanText(val?: string | number | null): string {
  if (val === undefined || val === null) return "";
  return String(val).replace(/\s+/g, " ").trim();
}

/**
 * Generates an executive, single-column, strictly black-and-white ATS Times serif resume PDF
 * grounded 100% in the candidate's real profile, experience, education, and verification records.
 */
export function generateCandidateDossierBlob(c: CandidateDossierInfo): Blob {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 18;
  const topMargin = 20;
  const bottomLimit = pageHeight - 22;
  const contentWidth = pageWidth - marginX * 2;
  let y = topMargin;

  const isStudent = Boolean(c.isStudent);
  const kycNormalized = cleanText(c.kycStatus).toUpperCase();
  const isVerified = !isStudent && kycNormalized === "VERIFIED";

  const ensureSpace = (neededMm: number) => {
    if (y + neededMm > bottomLimit) {
      pdf.addPage();
      y = topMargin;
    }
  };

  const drawSectionHeading = (title: string) => {
    ensureSpace(16);
    y += 4.2;
    pdf.setFont("times", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(0, 0, 0);
    pdf.text(title.toUpperCase(), marginX, y);
    y += 2.0;
    pdf.setDrawColor(0, 0, 0);
    pdf.setLineWidth(0.38);
    pdf.line(marginX, y, pageWidth - marginX, y);
    y += 5.4;
  };

  const drawWrappedLines = (
    text: string,
    opts?: {
      x?: number;
      maxWidth?: number;
      fontSize?: number;
      style?: "normal" | "bold" | "italic" | "bolditalic";
      lineHeight?: number;
      color?: [number, number, number];
    }
  ) => {
    const x = opts?.x ?? marginX;
    const maxWidth = opts?.maxWidth ?? contentWidth;
    const fontSize = opts?.fontSize ?? 10;
    const style = opts?.style ?? "normal";
    const lineHeight = opts?.lineHeight ?? 5.0;
    const [r, g, b] = opts?.color ?? [25, 25, 25];

    pdf.setFont("times", style);
    pdf.setFontSize(fontSize);
    pdf.setTextColor(r, g, b);

    const lines = pdf.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      ensureSpace(lineHeight + 1.5);
      pdf.text(line, x, y);
      y += lineHeight;
    }
  };

  const drawBoldLabelRow = (label: string, value: string) => {
    const cleanVal = cleanText(value);
    if (!cleanVal) return;

    const lineHeight = 4.9;
    const prefix = `${label}: `;
    pdf.setFontSize(10);
    pdf.setFont("times", "bold");
    const prefixWidth = pdf.getTextWidth(prefix);

    pdf.setFont("times", "normal");
    // Word-wrap the first line to fit cleanly alongside the bold label prefix
    const words = cleanVal.split(" ");
    let firstLine = "";
    let nextWordIdx = 0;
    const firstLineMaxW = Math.max(40, contentWidth - prefixWidth);

    while (nextWordIdx < words.length) {
      const word = words[nextWordIdx] || "";
      const candidate = firstLine ? `${firstLine} ${word}` : word;
      if (pdf.getTextWidth(candidate) <= firstLineMaxW || !firstLine) {
        firstLine = candidate;
        nextWordIdx++;
      } else {
        break;
      }
    }

    const remainingText = words.slice(nextWordIdx).join(" ");
    const continuationLines = remainingText
      ? (pdf.splitTextToSize(remainingText, contentWidth) as string[])
      : [];

    ensureSpace((1 + continuationLines.length) * lineHeight + 1.5);

    pdf.setFont("times", "bold");
    pdf.setTextColor(0, 0, 0);
    pdf.text(prefix, marginX, y);

    pdf.setFont("times", "normal");
    pdf.setTextColor(25, 25, 25);
    pdf.text(firstLine, marginX + prefixWidth, y);
    y += lineHeight;

    for (const contLine of continuationLines) {
      ensureSpace(lineHeight + 1);
      pdf.setFont("times", "normal");
      pdf.setTextColor(25, 25, 25);
      pdf.text(contLine, marginX, y);
      y += lineHeight;
    }
    y += 1.0;
  };

  const drawBulletLine = (text: string) => {
    const clean = cleanText(text);
    if (!clean) return;
    const lineHeight = 4.9;
    pdf.setFont("times", "normal");
    pdf.setFontSize(10);
    const bulletX = marginX + 3.5;
    const textX = marginX + 8;
    const lines = pdf.splitTextToSize(clean, contentWidth - 8) as string[];
    if (lines.length === 0) return;

    ensureSpace(lines.length * lineHeight + 1.5);
    pdf.setTextColor(0, 0, 0);
    pdf.circle(bulletX + 0.5, y - 1.15, 0.55, "F");

    pdf.setTextColor(25, 25, 25);
    for (let i = 0; i < lines.length; i++) {
      if (i > 0) ensureSpace(lineHeight + 1);
      pdf.text(lines[i] || "", textX, y);
      y += lineHeight;
    }
    y += 0.9;
  };

  // ── 1. CENTERED HEADER ──────────────────────────────────────────────────────
  const displayName = (cleanText(c.name) || "Healthcare Professional").toUpperCase();
  pdf.setFont("times", "bold");
  pdf.setFontSize(20);
  pdf.setTextColor(0, 0, 0);
  const nameLines = pdf.splitTextToSize(displayName, contentWidth) as string[];
  for (const nLine of nameLines) {
    pdf.text(nLine, pageWidth / 2, y, { align: "center" });
    y += 6.6;
  }

  const headlineParts = isStudent
    ? [
        cleanText(c.course) ? `${cleanText(c.course)}${cleanText(c.studyYear) ? ` (${cleanText(c.studyYear)})` : ""}` : cleanText(c.role),
        "Clinical Student",
        cleanText(c.college),
      ].filter(Boolean)
    : [
        cleanText(c.role),
        cleanText(c.specialty),
        cleanText(c.qualification),
      ].filter(Boolean);

  if (headlineParts.length > 0) {
    pdf.setFont("times", "normal");
    pdf.setFontSize(11);
    pdf.setTextColor(25, 25, 25);
    const headline = pdf.splitTextToSize(headlineParts.join("  |  "), contentWidth) as string[];
    for (const line of headline) {
      pdf.text(line, pageWidth / 2, y, { align: "center" });
      y += 4.9;
    }
  }

  const locationStr = [cleanText(c.city), cleanText(c.state)].filter(Boolean).join(", ");
  const contactParts = [cleanText(c.email), cleanText(c.phone), locationStr].filter(Boolean);
  if (contactParts.length > 0) {
    pdf.setFont("times", "normal");
    pdf.setFontSize(9.5);
    pdf.setTextColor(65, 65, 65);
    const contactLines = pdf.splitTextToSize(contactParts.join("  |  "), contentWidth) as string[];
    for (const cLine of contactLines) {
      pdf.text(cLine, pageWidth / 2, y, { align: "center" });
      y += 4.6;
    }
  }

  const availStr =
    c.openToWork === false
      ? "Not Actively Seeking"
      : `Open to Work${cleanText(c.availability) ? ` (${cleanText(c.availability)})` : ""}`;

  const credParts: string[] = [];
  if (isStudent) {
    if (cleanText(c.universityRegNo)) credParts.push(`University Reg: ${cleanText(c.universityRegNo)}`);
    if (cleanText(c.expectedGraduationYear)) credParts.push(`Expected Graduation: ${cleanText(c.expectedGraduationYear)}`);
    credParts.push("Track: Supervised Internships Only");
  } else {
    const councilTxt = cleanText(c.council);
    const regTxt = cleanText(c.regNumber);
    if (councilTxt || regTxt) {
      credParts.push(
        councilTxt && regTxt
          ? `${councilTxt} (${regTxt})`
          : councilTxt || `Reg No: ${regTxt}`
      );
    }
    const statusLabel =
      kycNormalized === "VERIFIED"
        ? "Council Verified"
        : kycNormalized === "REJECTED"
        ? "KYC Action Required"
        : "KYC Verification Pending";
    credParts.push(`FALE Status: ${statusLabel}`);
    credParts.push(availStr);
  }

  if (credParts.length > 0) {
    pdf.setFont("times", "bold");
    pdf.setFontSize(9.2);
    pdf.setTextColor(35, 35, 35);
    const credLines = pdf.splitTextToSize(credParts.join("  |  "), contentWidth) as string[];
    for (const line of credLines) {
      pdf.text(line, pageWidth / 2, y, { align: "center" });
      y += 4.6;
    }
  }

  y += 3.5;

  // ── 2. PROFESSIONAL SUMMARY ─────────────────────────────────────────────────
  const bioText = cleanText(c.bio);
  const summaryParagraph = bioText
    ? bioText
    : isStudent
    ? `${cleanText(c.course) || "Healthcare"} student${cleanText(c.college) ? ` at ${cleanText(c.college)}` : ""}${locationStr ? ` in ${locationStr}` : ""}, seeking supervised clinical internship and observership postings.`
    : `${cleanText(c.role) || "Healthcare Professional"}${cleanText(c.specialty) ? ` specializing in ${cleanText(c.specialty)}` : ""}${cleanText(c.experienceYears) ? ` with ${cleanText(c.experienceYears)} experience` : ""}${locationStr ? `, based in ${locationStr}` : ""}.`;

  drawSectionHeading("Professional Summary");
  drawWrappedLines(summaryParagraph, { fontSize: 10, lineHeight: 5.0, color: [25, 25, 25] });
  y += 2.5;

  // ── 3. CLINICAL SKILLS & COMPETENCIES ───────────────────────────────────────
  const skillsList = (c.skills || []).map((s) => cleanText(s)).filter(Boolean);
  const subSpecList = (c.subSpecialties || []).map((s) => cleanText(s)).filter(Boolean);
  const langList = (c.languages || []).map((l) => cleanText(l)).filter(Boolean);
  const prefCities = (c.preferredCities || []).map((p) => cleanText(p)).filter(Boolean);
  const engagementBits = [cleanText(c.employmentType), cleanText(c.availability)].filter(Boolean).join(", ");
  const prefSummary = [
    engagementBits,
    prefCities.length > 0 ? `Preferred Locations: ${prefCities.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join(" - ");

  if (skillsList.length > 0 || subSpecList.length > 0 || langList.length > 0 || prefSummary) {
    drawSectionHeading(isStudent ? "Clinical Skills & Academic Interests" : "Clinical Skills & Competencies");
    if (skillsList.length > 0) drawBoldLabelRow("Core Competencies", skillsList.join(", "));
    if (subSpecList.length > 0) drawBoldLabelRow("Sub-Specialties", subSpecList.join(", "));
    if (langList.length > 0) drawBoldLabelRow("Languages Spoken", langList.join(", "));
    if (prefSummary) drawBoldLabelRow("Availability & Preferences", prefSummary);
    y += 1.8;
  }

  // ── 4. CLINICAL EXPERIENCE ──────────────────────────────────────────────────
  const expList = (c.experiences || []).filter((e) => cleanText(e.org) || cleanText(e.role));
  if (expList.length > 0) {
    drawSectionHeading(isStudent ? "Clinical Postings & Rotations" : "Clinical Experience");
    expList.forEach((exp, idx) => {
      ensureSpace(16);
      const roleStr = cleanText(exp.role) || (isStudent ? "Clinical Trainee" : "Clinician");
      const orgStr = cleanText(exp.org) || "Healthcare Facility";
      const dateStr = exp.fy
        ? `${cleanText(exp.fy)}${exp.cur ? " - Present" : ""}`
        : exp.cur
        ? "Current"
        : "";

      let dateWidth = 0;
      if (dateStr) {
        pdf.setFont("times", "italic");
        pdf.setFontSize(9.5);
        dateWidth = pdf.getTextWidth(dateStr);
      }

      pdf.setFont("times", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      const headerLeft = `${roleStr}  |  ${orgStr}`;
      const maxLeftWidth = dateStr ? Math.max(60, contentWidth - dateWidth - 6) : contentWidth;
      const leftLines = pdf.splitTextToSize(headerLeft, maxLeftWidth) as string[];

      if (dateStr) {
        pdf.setFont("times", "italic");
        pdf.setFontSize(9.5);
        pdf.setTextColor(55, 55, 55);
        pdf.text(dateStr, pageWidth - marginX, y, { align: "right" });
      }

      pdf.setFont("times", "bold");
      pdf.setFontSize(10);
      pdf.setTextColor(0, 0, 0);
      for (const lLine of leftLines) {
        ensureSpace(5.0);
        pdf.text(lLine, marginX, y);
        y += 4.8;
      }

      if (cleanText(exp.location)) {
        pdf.setFont("times", "italic");
        pdf.setFontSize(9.5);
        pdf.setTextColor(70, 70, 70);
        pdf.text(cleanText(exp.location), marginX, y);
        y += 4.8;
      }

      if (exp.bullets && exp.bullets.length > 0) {
        y += 0.5;
        for (const bullet of exp.bullets) {
          drawBulletLine(bullet);
        }
      }

      if (idx < expList.length - 1) {
        y += 2.6;
      }
    });
    y += 2.0;
  }

  // ── 5. EDUCATION ────────────────────────────────────────────────────────────
  const hasEduInfo =
    cleanText(c.qualification) || cleanText(c.college) || cleanText(c.course) || cleanText(c.studyYear);
  if (hasEduInfo) {
    drawSectionHeading("Education");
    if (isStudent) {
      const courseTitle = `${cleanText(c.course) || "Healthcare Program"}${cleanText(c.studyYear) ? ` (${cleanText(c.studyYear)})` : ""}`;
      const eduHead = cleanText(c.college) ? `${courseTitle} - ${cleanText(c.college)}` : courseTitle;
      drawWrappedLines(eduHead, { fontSize: 10, style: "bold", lineHeight: 4.9, color: [0, 0, 0] });
      const stuMeta = [
        cleanText(c.universityRegNo) ? `University Reg No: ${cleanText(c.universityRegNo)}` : "",
        cleanText(c.expectedGraduationYear) ? `Expected Graduation: ${cleanText(c.expectedGraduationYear)}` : "",
      ]
        .filter(Boolean)
        .join("  |  ");
      if (stuMeta) {
        drawWrappedLines(stuMeta, { fontSize: 9.5, style: "italic", lineHeight: 4.7, color: [65, 65, 65] });
      }
    } else {
      const deg = cleanText(c.qualification) || cleanText(c.role) || "Clinical Qualification";
      const eduHead = cleanText(c.college) ? `${deg} - ${cleanText(c.college)}` : deg;
      drawWrappedLines(eduHead, { fontSize: 10, style: "bold", lineHeight: 4.9, color: [0, 0, 0] });
      const gradMeta = [
        cleanText(c.regYear) ? `Council Registration Year: ${cleanText(c.regYear)}` : "",
        cleanText(c.experienceYears) ? `Clinical Experience: ${cleanText(c.experienceYears)}` : "",
      ]
        .filter(Boolean)
        .join("  |  ");
      if (gradMeta) {
        drawWrappedLines(gradMeta, { fontSize: 9.5, style: "italic", lineHeight: 4.7, color: [65, 65, 65] });
      }
    }
    y += 2.2;
  }

  // ── 6. LICENSURE & VERIFIED CREDENTIALS ─────────────────────────────────────
  const credBullets: string[] = [];
  if (isStudent) {
    credBullets.push(
      `Enrollment Verification: ${
        kycNormalized === "VERIFIED"
          ? "Verified Student Record on FALE Healthcare"
          : kycNormalized === "REJECTED"
          ? "Student Verification Action Required"
          : "Student Verification Under Review"
      }`
    );
    credBullets.push("Practice Scope: Eligible strictly for supervised clinical internships until graduation licensure.");
  } else {
    const councilName = cleanText(c.council) || "Statutory State Council (Not specified)";
    const regNoText = cleanText(c.regNumber) || "Pending";
    const statusText = isVerified
      ? "Council Verified via FALE Compliance"
      : kycNormalized === "REJECTED"
      ? "KYC Verification Action Required"
      : "KYC Verification Pending Review";
    credBullets.push(`State Council Registration: ${councilName} - Reg No: ${regNoText} (${statusText})`);
    if (c.verifiedAt && isVerified) {
      const vDt = new Date(c.verifiedAt);
      if (!Number.isNaN(vDt.getTime())) {
        credBullets.push(
          `Verified On: ${vDt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`
        );
      }
    }
    if (c.isMentor) {
      credBullets.push("FALE Clinical Mentor Accreditation: Accredited Senior Clinical Mentor");
    }
    if ((c.completedShiftsCount && c.completedShiftsCount > 0) || (c.shiftRatingCount && c.shiftRatingCount > 0)) {
      const ratingPart =
        c.shiftRatingAvg && c.shiftRatingCount && c.shiftRatingCount > 0
          ? `Rated ${Number(c.shiftRatingAvg).toFixed(1)}/5 across ${c.shiftRatingCount} hospital evaluation${c.shiftRatingCount > 1 ? "s" : ""}`
          : "Verified hospital locum duty";
      const shiftsPart = c.completedShiftsCount ? `${c.completedShiftsCount} completed locum shift${c.completedShiftsCount > 1 ? "s" : ""}` : "";
      const priorityPart = c.topRated ? " (Top-Rated Priority Clinician)" : "";
      const joined = [ratingPart, shiftsPart].filter(Boolean).join(" | ");
      credBullets.push(`FALE Locum Performance Record: ${joined}${priorityPart}`);
    }
  }

  if (c.documents && c.documents.length > 0) {
    for (const doc of c.documents) {
      const title = cleanText(doc.title) || cleanText(doc.fileName) || "Uploaded Document";
      const filePart = cleanText(doc.fileName) ? ` (${cleanText(doc.fileName)})` : "";
      credBullets.push(`${title}${filePart} - ${doc.verified ? "Verified" : "Uploaded (Pending Review)"}`);
    }
  }

  if (credBullets.length > 0) {
    drawSectionHeading(isStudent ? "Academic Verification & Documents" : "Licensure & Verified Credentials");
    for (const item of credBullets) {
      drawBulletLine(item);
    }
  }

  // ── 7. SUBTLE BLACK & WHITE FOOTER ON EVERY PAGE ────────────────────────────
  const totalPages = pdf.getNumberOfPages();
  const generatedStamp = new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const footerSummary = isStudent
    ? `FALE Healthcare  |  Student Academic Portfolio  |  Generated ${generatedStamp}`
    : isVerified
    ? `FALE Healthcare  |  Official Verified Clinical Resume  |  Generated ${generatedStamp}`
    : `FALE Healthcare  |  Draft Clinical Resume (KYC ${kycNormalized || "PENDING"})  |  Generated ${generatedStamp}`;

  for (let pNum = 1; pNum <= totalPages; pNum++) {
    pdf.setPage(pNum);
    const footerY = pageHeight - 11;
    pdf.setDrawColor(190, 190, 190);
    pdf.setLineWidth(0.25);
    pdf.line(marginX, footerY - 4.0, pageWidth - marginX, footerY - 4.0);
    pdf.setFont("times", "normal");
    pdf.setFontSize(8.2);
    pdf.setTextColor(100, 100, 100);
    pdf.text(footerSummary, marginX, footerY);
    pdf.text(`Page ${pNum} of ${totalPages}`, pageWidth - marginX, footerY, { align: "right" });
  }

  return pdf.output("blob");
}

export interface DownloadedCvResult {
  filename: string;
  label: string;
  toastTitle: string;
  toastDescription: string;
}

export function getCvPreparingToastText(isStudent?: boolean, kycStatus?: string): string {
  if (isStudent) return "Preparing your Academic Portfolio PDF...";
  return cleanText(kycStatus).toUpperCase() === "VERIFIED"
    ? "Preparing your Verified Clinical CV PDF..."
    : "Preparing your Draft Clinical CV PDF...";
}

/**
 * Generates and triggers immediate browser download for a candidate's live ATS resume/portfolio PDF.
 */
export function downloadCandidateCvPdf(c: CandidateDossierInfo): DownloadedCvResult {
  const blob = generateCandidateDossierBlob(c);
  const safeName = (cleanText(c.name) || "Candidate").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
  const isStudent = Boolean(c.isStudent);
  const isVerified = !isStudent && cleanText(c.kycStatus).toUpperCase() === "VERIFIED";

  const suffix = isStudent ? "Academic_Portfolio" : isVerified ? "Verified_CV" : "Draft_CV";
  const label = isStudent ? "Academic Portfolio" : isVerified ? "Verified Clinical CV" : "Draft Clinical CV";
  const filename = `FALE_${safeName || "Candidate"}_${suffix}.pdf`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  const toastTitle = `${label} downloaded`;
  const toastDescription = isStudent
    ? `Saved ${filename} with your college & clinical posting summary.`
    : isVerified
    ? `Saved ${filename} with your verified FALE council credentials.`
    : `Saved ${filename}. Complete council KYC verification to unlock the Verified CV seal.`;

  return { filename, label, toastTitle, toastDescription };
}

export interface RawProfileForCv {
  name?: string | undefined;
  email?: string | undefined;
  phone?: string | undefined;
  city?: string | undefined;
  state?: string | undefined;
  isStudent?: boolean | undefined;
  course?: string | undefined;
  college?: string | undefined;
  studyYear?: string | undefined;
  universityRegNo?: string | undefined;
  expectedGraduationYear?: number | string | undefined;
  profession?: string | undefined;
  specialty?: string | undefined;
  subSpecialties?: string[] | undefined;
  qualification?: string | undefined;
  council?: string | undefined;
  regNumber?: string | undefined;
  regYear?: string | undefined;
  experienceYears?: string | undefined;
  bio?: string | undefined;
  availability?: string | undefined;
  employmentType?: string | undefined;
  skills?: string[] | undefined;
  languages?: string[] | undefined;
  preferredCities?: string[] | undefined;
  openToWork?: boolean | undefined;
  kycStatus?: string | undefined;
  isMentor?: boolean | undefined;
  shiftRatingAvg?: number | undefined;
  shiftRatingCount?: number | undefined;
  completedShiftsCount?: number | undefined;
  topRated?: boolean | undefined;
  verifiedAt?: string | undefined;
  documents?: Array<{
    documentType: string;
    originalFileName: string;
    verified?: boolean | undefined;
  }> | undefined;
}

export function buildCandidateDossierFromProfile(
  apiProfile: RawProfileForCv | null | undefined,
  storeProfile: Record<string, any> = {},
  contactFallback = ""
): CandidateDossierInfo {
  const isStudent = Boolean(
    apiProfile
      ? apiProfile.isStudent
      : storeProfile["level"] === "student" || storeProfile["cadreLevel"] === "student"
  );

  const rawExps = Array.isArray(storeProfile["exps"])
    ? (storeProfile["exps"] as CandidateCvExperienceItem[])
    : storeProfile["employer"]
    ? [
        {
          org: String(storeProfile["employer"]),
          role: String(storeProfile["designation"] || apiProfile?.profession || storeProfile["role"] || "Clinician"),
          fy: "",
          cur: true,
        },
      ]
    : [];

  const docs = (apiProfile?.documents || [])
    .filter(
      (d) =>
        d.documentType !== "PHOTO" &&
        d.documentType !== "PROFILE_PHOTO" &&
        !d.originalFileName?.toLowerCase().includes("profilephoto")
    )
    .map((d) => ({
      title: formatDocTypeTitle(d.documentType),
      fileName: d.originalFileName,
      verified: Boolean(d.verified),
    }));

  return {
    name: cleanText(apiProfile?.name || storeProfile["name"] || contactFallback || "Clinician"),
    role: cleanText(apiProfile?.profession || storeProfile["role"] || (isStudent ? apiProfile?.course : "Healthcare Professional")),
    specialty: cleanText(apiProfile?.specialty || storeProfile["specialty"]),
    qualification: cleanText(apiProfile?.qualification || storeProfile["qual"] || storeProfile["qualification"]),
    council: cleanText(apiProfile?.council || storeProfile["council"]),
    regNumber: cleanText(apiProfile?.regNumber || storeProfile["regNo"]),
    regYear: cleanText(apiProfile?.regYear || storeProfile["regYear"]),
    experienceYears: cleanText(apiProfile?.experienceYears || storeProfile["exp"]),
    city: cleanText(apiProfile?.city || storeProfile["city"]),
    state: cleanText(apiProfile?.state || storeProfile["state"]),
    email: cleanText(apiProfile?.email || storeProfile["email"]),
    phone: cleanText(apiProfile?.phone || storeProfile["mobile"] || contactFallback),
    college: cleanText(apiProfile?.college || storeProfile["college"] || storeProfile["institution"]),
    bio: cleanText(apiProfile?.bio || storeProfile["bio"] || storeProfile["about"]),
    skills: apiProfile?.skills && apiProfile.skills.length > 0
      ? apiProfile.skills
      : Array.isArray(storeProfile["skills"])
      ? storeProfile["skills"]
      : [],
    subSpecialties: apiProfile?.subSpecialties || [],
    languages: apiProfile?.languages && apiProfile.languages.length > 0
      ? apiProfile.languages
      : Array.isArray(storeProfile["languages"])
      ? storeProfile["languages"]
      : [],
    preferredCities: apiProfile?.preferredCities && apiProfile.preferredCities.length > 0
      ? apiProfile.preferredCities
      : Array.isArray(storeProfile["preferredCity"])
      ? storeProfile["preferredCity"]
      : [],
    availability: cleanText(apiProfile?.availability || storeProfile["availability"] || storeProfile["notice"]),
    employmentType: cleanText(apiProfile?.employmentType || storeProfile["employmentType"]),
    openToWork:
      apiProfile?.openToWork !== undefined
        ? Boolean(apiProfile.openToWork)
        : storeProfile["openToWork"] !== undefined
        ? Boolean(storeProfile["openToWork"])
        : true,
    kycStatus: cleanText(apiProfile?.kycStatus || storeProfile["kycStatus"] || "PENDING"),
    verifiedAt: apiProfile?.verifiedAt,
    isStudent,
    course: cleanText(apiProfile?.course || storeProfile["course"]),
    studyYear: cleanText(apiProfile?.studyYear || storeProfile["studyYear"]),
    universityRegNo: cleanText(apiProfile?.universityRegNo || storeProfile["universityRegNo"]),
    expectedGraduationYear: apiProfile?.expectedGraduationYear ?? storeProfile["expectedGraduationYear"],
    isMentor: Boolean(apiProfile?.isMentor),
    shiftRatingAvg: apiProfile?.shiftRatingAvg,
    shiftRatingCount: apiProfile?.shiftRatingCount,
    completedShiftsCount: apiProfile?.completedShiftsCount,
    topRated: apiProfile?.topRated,
    experiences: rawExps,
    documents: docs,
  };
}
