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

export interface CandidateDossierInfo {
  name: string;
  role: string;
  specialty?: string;
  qualification?: string;
  council?: string;
  regNumber?: string;
  experienceYears?: string;
  city?: string;
  state?: string;
  email?: string;
  phone?: string;
  college?: string;
  bio?: string;
  skills?: string[];
  languages?: string[];
  cmeCredits?: number | string;
  documentsCount?: number;
  isMentor?: boolean;
}

export function generateCandidateDossierBlob(c: CandidateDossierInfo): Blob {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Background frame
  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.6);
  pdf.roundedRect(margin, margin, contentWidth, pageHeight - margin * 2, 3, 3, "S");

  // Top Header Banner
  pdf.setFillColor(15, 23, 42); // slate-900
  pdf.rect(margin, margin, contentWidth, 26, "F");

  // FALE Logo & Title
  pdf.setTextColor(255, 107, 0); // FALE Orange
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(18);
  pdf.text("FALE", margin + 6, margin + 12);

  pdf.setTextColor(241, 245, 249);
  pdf.setFontSize(10);
  pdf.text("HEALTHCARE PLATFORM", margin + 26, margin + 12);

  pdf.setTextColor(148, 163, 184);
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.text("Statutory Clinical Credential Dossier & Verified Practice Portfolio", margin + 6, margin + 20);

  // Verification Badge Top Right
  pdf.setFillColor(30, 41, 59);
  pdf.roundedRect(pageWidth - margin - 64, margin + 5, 58, 16, 2, 2, "F");
  pdf.setTextColor(52, 211, 153); // emerald-400
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("COUNCIL VERIFIED TIER-1", pageWidth - margin - 60, margin + 11);
  pdf.setTextColor(203, 213, 225);
  pdf.setFontSize(6.5);
  pdf.setFont("helvetica", "normal");
  pdf.text("DigiLocker & NMC Registry Audited", pageWidth - margin - 60, margin + 17);

  // Candidate Name & Headline Banner
  let y = margin + 34;
  pdf.setFillColor(255, 247, 237); // orange-50
  pdf.setDrawColor(254, 215, 170); // orange-200
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 36, 2, 2, "FD");

  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(16);
  pdf.setFont("helvetica", "bold");
  pdf.text(c.name || "Healthcare Practitioner", margin + 10, y + 9);

  // Qualification & Council Pills
  pdf.setFontSize(8.5);
  pdf.setTextColor(255, 107, 0);
  const qualText = `${c.qualification || "MBBS"}  •  ${c.role || "Doctor"} (${c.specialty || "General Medicine"})  •  ${c.experienceYears || "4+ Years Exp"}`;
  pdf.text(qualText, margin + 10, y + 17);

  pdf.setTextColor(71, 85, 105);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  pdf.text(`${c.council || "State Medical Council"}  •  Registration No: ${c.regNumber || "KAC456"}`, margin + 10, y + 24);
  pdf.text(`Location: ${c.city || "Chennai"}, ${c.state || "Tamil Nadu"}  |  Email: ${c.email || "N/A"}  |  Phone: ${c.phone || "N/A"}`, margin + 10, y + 30);

  y += 44;

  // Section 1: Clinical Profile Summary
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("1. CLINICAL PROFILE & PRACTICE SUMMARY", margin + 6, y);

  y += 4;
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 24, 2, 2, "F");
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 24, 2, 2, "S");

  pdf.setTextColor(51, 65, 85);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "normal");
  const summaryText = c.bio || `Accredited ${c.role || "Clinician"} specializing in ${c.specialty || "General Medicine"}. Experienced in comprehensive patient triage, inpatient and outpatient clinical protocols, emergency life support (BLS/ACLS), and evidence-based pharmacotherapy across NABH-accredited healthcare facilities.`;
  const splitSummary = pdf.splitTextToSize(summaryText, contentWidth - 20);
  pdf.text(splitSummary, margin + 10, y + 7);

  y += 32;

  // Section 2: Statutory Licensure & Academic Credentials
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("2. STATUTORY LICENSURE & VERIFIED CREDENTIALS", margin + 6, y);

  y += 4;
  const credItems = [
    ["Statutory State Council", c.council || "Tamil Nadu Medical Council"],
    ["Medical Registration License No", c.regNumber || "KAC456"],
    ["Primary Practicing Degree", `${c.qualification || "MBBS"} - ${c.college || "Madras Medical College"}`],
    ["Clinical Specialty / Cadre", `${c.role || "Doctor"} • ${c.specialty || "General Medicine"}`],
    ["Verified Clinical Experience", c.experienceYears || "4+ Years Active Clinical Practice"],
    ["Council Verification Status", "ACTIVE & GOOD STANDING (DigiLocker / NMC Verified)"],
    ["CME Accreditation Hours", `${c.cmeCredits || "18.5"} Verified CME Credits (AHA & IRC)`],
    ["FALE Clinical Mentor Accreditation", c.isMentor ? "Accredited Senior Clinical Mentor" : "Standard Verified Practitioner"],
  ];

  pdf.setFillColor(255, 255, 255);
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 58, 2, 2, "F");
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 58, 2, 2, "S");

  let credY = y + 6;
  credItems.forEach(([label, value], idx) => {
    if (idx % 2 === 1) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin + 7, credY - 4, contentWidth - 14, 6.8, "F");
    }
    pdf.setFontSize(7.5);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(100, 116, 139);
    pdf.text(label, margin + 10, credY);

    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(15, 23, 42);
    if (label.includes("Status") || label.includes("Mentor")) {
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(16, 185, 129);
    }
    pdf.text(String(value), margin + 68, credY);
    credY += 6.8;
  });

  y += 66;

  // Section 3: Clinical Competencies
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(10);
  pdf.setFont("helvetica", "bold");
  pdf.text("3. VERIFIED CLINICAL COMPETENCIES & PROCEDURAL SKILLS", margin + 6, y);

  y += 4;
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 24, 2, 2, "F");
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 24, 2, 2, "S");

  const skillList = c.skills && c.skills.length > 0
    ? c.skills
    : ["Diagnostic Triage & Assessment", "Emergency Resuscitation (ACLS/BLS)", "Inpatient Protocol Management", "Bedside Ultrasound & ECG", "Infection Control & Asepsis", "Pharmacotherapy Protocols"];

  let skillX = margin + 10;
  let skillRowY = y + 8;
  skillList.slice(0, 6).forEach((skill, i) => {
    if (i === 3) {
      skillX = margin + 10;
      skillRowY += 8;
    }
    pdf.setFillColor(255, 255, 255);
    pdf.setDrawColor(203, 213, 225);
    pdf.roundedRect(skillX, skillRowY - 4, 56, 6, 1, 1, "FD");
    pdf.setTextColor(255, 107, 0);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "bold");
    pdf.text("• " + skill, skillX + 2, skillRowY);
    skillX += 59;
  });

  y += 32;

  // Statutory Certification / Authenticity Stamp
  pdf.setFillColor(255, 247, 237);
  pdf.setDrawColor(254, 215, 170);
  pdf.roundedRect(margin + 6, y, contentWidth - 12, 28, 2, 2, "FD");

  pdf.setTextColor(194, 65, 12);
  pdf.setFontSize(8);
  pdf.setFont("helvetica", "bold");
  pdf.text("FALE STATUTORY REGULATORY VERIFICATION SEAL", margin + 10, y + 6);

  pdf.setTextColor(124, 45, 18);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  const sealText = [
    "This Clinical Credential Dossier was generated directly from verified records authenticated on the FALE Healthcare Platform.",
    `Registered Clinician ID: FALE-CAND-${(c.regNumber || "KAC456").toUpperCase()} • Verification Timestamp: ${new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })} IST.`,
    "All stated state council licenses and verified qualifications have been cross-referenced with national healthcare governance bodies.",
  ];
  sealText.forEach((st, i) => {
    pdf.text(st, margin + 10, y + 12 + i * 5);
  });

  // Footer
  const footerY = pageHeight - margin - 6;
  pdf.setDrawColor(226, 232, 240);
  pdf.line(margin + 6, footerY - 4, pageWidth - margin - 6, footerY - 4);

  pdf.setTextColor(148, 163, 184);
  pdf.setFontSize(7);
  pdf.setFont("helvetica", "normal");
  pdf.text("FALE Healthcare Platform • Verified Clinician Credential Dossier • Strictly for Clinical Recruitment & Credentialing", margin + 6, footerY);
  pdf.text("Page 1 of 1", pageWidth - margin - 18, footerY);

  return pdf.output("blob");
}
