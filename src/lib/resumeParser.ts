import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import {
  departmentsByProfession,
  indianCities,
  indianStates,
  professions,
  skillsByProfession,
} from "./data";

// Setup PDF.js worker
if (typeof window !== "undefined" && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
}

export interface ParsedResumeData {
  name?: string;
  email?: string;
  mobile?: string;
  dob?: string;
  gender?: "Female" | "Male" | "Other";
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  languages?: string[];
  role?: string;
  specialty?: string;
  skills?: string[];
  council?: string;
  regNo?: string;
  regValid?: string;
  qual?: string;
  year?: string;
  institution?: string;
  exp?: string;
  employer?: string;
  designation?: string;
  notice?: string;
  currentSalary?: string;
  preferredCity?: string;
  salary?: string;
  rawText?: string;
  confidenceScore?: number;
}

/**
 * Extracts plain text from PDF, DOCX, or text files in browser
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const fileExt = file.name.split(".").pop()?.toLowerCase();

  if (fileExt === "pdf") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
      const pdf = await loadingTask.promise;
      let text = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => ("str" in item ? item.str : ""))
          .join(" ");
        text += pageText + "\n";
      }
      return text;
    } catch (err) {
      console.warn("PDF.js worker extraction fallback:", err);
      // Fallback: read text via slice or blob text
      return await file.text();
    }
  }

  if (fileExt === "docx") {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value || "";
    } catch (err) {
      console.warn("Mammoth extraction error:", err);
      return "";
    }
  }

  // Fallback for txt, csv, rtf
  try {
    return await file.text();
  } catch (err) {
    console.error("Failed to read file as text:", err);
    return "";
  }
}

/**
 * Parses raw resume text and extracts healthcare profile attributes
 */
export function parseResumeText(rawText: string): ParsedResumeData {
  const text = rawText.replace(/\r\n/g, "\n");
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const parsed: ParsedResumeData = {
    rawText: text,
  };

  let extractedCount = 0;

  // 1. Email extraction
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/);
  if (emailMatch) {
    parsed.email = emailMatch[0].toLowerCase();
    extractedCount++;
  }

  // 2. Mobile / Phone extraction
  // Handles +91 9876543210, +91-9876543210, 09876543210, 9876543210
  const phoneMatch = text.match(/(?:(?:\+91|0)[ -]?)?([6-9]\d{4}[ -]?\d{5})\b/);
  if (phoneMatch && phoneMatch[1]) {
    parsed.mobile = phoneMatch[1].replace(/[- ]/g, "");
    extractedCount++;
  }

  // 3. Candidate Name extraction
  // Look at the top 6 lines before contact details or headers
  parsed.name = extractCandidateName(lines, parsed.email);
  if (parsed.name) extractedCount++;

  // 4. Date of Birth
  const dobMatch = text.match(/(?:DOB|Date of Birth|Birth Date|Born)\s*[:\-]?\s*([0-3]?\d[\/\-\.][0-1]?\d[\/\-\.](?:19|20)\d{2})/i) ||
                   text.match(/\b([0-3]?\d\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(?:19|20)\d{2})\b/i);
  if (dobMatch && dobMatch[1]) {
    parsed.dob = formatToISODate(dobMatch[1]);
    if (parsed.dob) extractedCount++;
  }

  // 5. Gender
  const genderMatch = text.match(/(?:Gender|Sex)\s*[:\-]?\s*(Male|Female|Other)/i);
  if (genderMatch && genderMatch[1]) {
    const g = genderMatch[1].toLowerCase();
    parsed.gender = g.startsWith("f") ? "Female" : g.startsWith("m") ? "Male" : "Other";
    extractedCount++;
  }

  // 6. Address, City, State, PIN code
  const location = extractLocationDetails(text);
  if (location.city) {
    parsed.city = location.city;
    parsed.preferredCity = location.city;
    extractedCount++;
  }
  if (location.state) {
    parsed.state = location.state;
    extractedCount++;
  }
  if (location.pincode) {
    parsed.pincode = location.pincode;
    extractedCount++;
  }
  if (location.address) {
    parsed.address = location.address;
  }

  // 7. Healthcare Role / Profession
  const roleInfo = extractProfession(text);
  if (roleInfo.role) {
    parsed.role = roleInfo.role;
    extractedCount++;
  }
  if (roleInfo.specialty) {
    parsed.specialty = roleInfo.specialty;
    extractedCount++;
  }

  // 8. Professional Council & Registration Number
  const regInfo = extractRegistrationInfo(text);
  if (regInfo.regNo) {
    parsed.regNo = regInfo.regNo;
    extractedCount++;
  }
  if (regInfo.council) {
    parsed.council = regInfo.council;
    extractedCount++;
  }
  if (regInfo.regValid) {
    parsed.regValid = regInfo.regValid;
  }

  // 9. Education / Highest Qualification & Institution
  const eduInfo = extractEducation(text);
  if (eduInfo.qual) {
    parsed.qual = eduInfo.qual;
    extractedCount++;
  }
  if (eduInfo.institution) {
    parsed.institution = eduInfo.institution;
    extractedCount++;
  }
  if (eduInfo.year) {
    parsed.year = eduInfo.year;
    extractedCount++;
  }

  // 10. Experience, Current Employer & Designation
  const expInfo = extractExperience(text);
  if (expInfo.exp) {
    parsed.exp = expInfo.exp;
    extractedCount++;
  }
  if (expInfo.employer) {
    parsed.employer = expInfo.employer;
    extractedCount++;
  }
  if (expInfo.designation) {
    parsed.designation = expInfo.designation;
    extractedCount++;
  }
  if (expInfo.notice) {
    parsed.notice = expInfo.notice;
  }

  // 11. Clinical Skills
  parsed.skills = extractClinicalSkills(text, parsed.role);
  if (parsed.skills.length > 0) extractedCount++;

  // 12. Languages
  parsed.languages = extractLanguages(text);
  if (parsed.languages.length > 0) extractedCount++;

  // Calculate confidence score (out of 100%)
  parsed.confidenceScore = Math.min(100, Math.round((extractedCount / 12) * 100));

  return parsed;
}

function extractCandidateName(lines: string[], email?: string): string {
  const ignorePatterns = [
    /curriculum\s*vitae/i,
    /resume/i,
    /biodata/i,
    /profile/i,
    /contact/i,
    /summary/i,
    /objective/i,
    /@/,
    /phone/i,
    /address/i,
    /linkedin/i,
    /page \d/i,
  ];

  // Check explicit "Name: XYZ" pattern
  for (const line of lines) {
    const match = line.match(/(?:Name|Full Name|Candidate Name)\s*[:\-]\s*([A-Za-z\s\.]{3,40})/i);
    if (match && match[1]) {
      return cleanName(match[1]);
    }
  }

  // Check top 6 lines
  for (let i = 0; i < Math.min(lines.length, 6); i++) {
    const line = lines[i].trim();
    if (line.length < 3 || line.length > 45) continue;
    if (ignorePatterns.some((pattern) => pattern.test(line))) continue;

    // Check if line looks like a person's name (letters, spaces, dots, Dr., Sr.)
    if (/^(?:Dr\.|Sister|Sr\.|Mr\.|Mrs\.|Ms\.)?\s*[A-Za-z][A-Za-z\s\.\']{2,40}$/.test(line)) {
      return cleanName(line);
    }
  }

  // Fallback: derive from email username (e.g. priya.sharma92 -> Priya Sharma)
  if (email) {
    const user = email.split("@")[0].replace(/[0-9_\.]+/g, " ").trim();
    if (user.length > 2) {
      return user.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
    }
  }

  return "";
}

function cleanName(raw: string): string {
  return raw
    .replace(/^(?:Name\s*[:\-]|\s*Curriculum\s*Vitae|\s*Resume)/i, "")
    .replace(/[^\w\s\.\'\-]/g, "")
    .trim();
}

function formatToISODate(raw: string): string {
  // DD/MM/YYYY or DD-MM-YYYY
  const parts = raw.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
  if (parts) {
    const day = parts[1].padStart(2, "0");
    const month = parts[2].padStart(2, "0");
    const year = parts[3];
    return `${year}-${month}-${day}`;
  }
  return "";
}

function extractLocationDetails(text: string): { city?: string; state?: string; pincode?: string; address?: string } {
  const result: { city?: string; state?: string; pincode?: string; address?: string } = {};

  // PIN Code (6 digits)
  const pinMatch = text.match(/\b([1-9][0-9]{5})\b/);
  if (pinMatch) {
    result.pincode = pinMatch[1];
  }

  // Match State from indianStates
  for (const st of indianStates) {
    if (st === "Other") continue;
    const regex = new RegExp(`\\b${st}\\b`, "i");
    if (regex.test(text)) {
      result.state = st;
      break;
    }
  }

  // Match City from indianCities
  for (const ct of indianCities) {
    if (ct.includes("(") || ct.includes("Pan India")) continue;
    const regex = new RegExp(`\\b${ct}\\b`, "i");
    if (regex.test(text)) {
      result.city = ct;
      break;
    }
  }

  // Extract street address snippet if "Address:" pattern exists
  const addrMatch = text.match(/Address\s*[:\-]\s*([^\n\r]{10,80})/i);
  if (addrMatch) {
    result.address = addrMatch[1].trim();
  }

  return result;
}

function extractProfession(text: string): { role?: string; specialty?: string } {
  const lower = text.toLowerCase();
  let matchedRole = "";
  let matchedSpecialty = "";

  // Check Doctor indicators
  if (
    lower.includes("mbbs") ||
    lower.includes("md medicine") ||
    lower.includes("general physician") ||
    lower.includes("medical officer") ||
    lower.includes("consultant physician") ||
    /\bdoctor\b/.test(lower) ||
    /\bdr\.\s+[a-z]/.test(lower)
  ) {
    matchedRole = "Doctor";
  } else if (
    lower.includes("b.sc nursing") ||
    lower.includes("staff nurse") ||
    lower.includes("gnm") ||
    lower.includes("nursing officer") ||
    lower.includes("registered nurse") ||
    /\bnurse\b/.test(lower)
  ) {
    matchedRole = "Nurse";
  } else if (
    lower.includes("bds") ||
    lower.includes("mds") ||
    lower.includes("dental") ||
    lower.includes("dentist")
  ) {
    matchedRole = "Dentist";
  } else if (
    lower.includes("b.pharm") ||
    lower.includes("m.pharm") ||
    lower.includes("pharm.d") ||
    lower.includes("pharmacist")
  ) {
    matchedRole = "Pharmacist";
  } else if (
    lower.includes("bpt") ||
    lower.includes("mpt") ||
    lower.includes("physiotherapy") ||
    lower.includes("physiotherapist")
  ) {
    matchedRole = "Physiotherapist";
  } else if (
    lower.includes("lab technician") ||
    lower.includes("dmlt") ||
    lower.includes("b.sc mlt")
  ) {
    matchedRole = "Lab Technician";
  } else if (
    lower.includes("radiology technician") ||
    lower.includes("radiographer") ||
    lower.includes("x-ray technician")
  ) {
    matchedRole = "Radiographer";
  } else if (
    lower.includes("ot technician") ||
    lower.includes("operation theatre technician")
  ) {
    matchedRole = "OT Technician";
  } else {
    // Check against professions list
    for (const p of professions) {
      if (lower.includes(p.toLowerCase())) {
        matchedRole = p;
        break;
      }
    }
  }

  const role = matchedRole || undefined;
  const deptsForRole = role ? (departmentsByProfession[role] ?? []) : [];

  // Detect Specialty / Department based on the selected profession
  for (const d of deptsForRole) {
    const key = d.toLowerCase().replace(/&|\//g, " ").split(" ")[0].trim();
    if (key.length > 2 && lower.includes(key)) {
      matchedSpecialty = d;
      break;
    }
  }

  return { role, specialty: matchedSpecialty || undefined };
}

function extractRegistrationInfo(text: string): { regNo?: string; council?: string; regValid?: string } {
  const result: { regNo?: string; council?: string; regValid?: string } = {};

  // Council name matching
  const councilPatterns = [
    /Tamil Nadu (?:Medical|Nursing|Pharmacy) Council/i,
    /Karnataka (?:Medical|Nursing|Pharmacy) Council/i,
    /Maharashtra (?:Medical|Nursing|Pharmacy) Council/i,
    /Delhi (?:Medical|Nursing|Pharmacy) Council/i,
    /Kerala (?:Medical|Nursing|Pharmacy) Council/i,
    /Andhra Pradesh (?:Medical|Nursing|Pharmacy) Council/i,
    /Telangana (?:Medical|Nursing|Pharmacy) Council/i,
    /(?:State|Medical|Nursing|Dental|Pharmacy)\s*Council/i,
  ];

  for (const cp of councilPatterns) {
    const match = text.match(cp);
    if (match) {
      result.council = match[0];
      break;
    }
  }

  // Registration Number matching
  const regNoMatch =
    text.match(/(?:Registration|Reg|Council Reg|RN\s*RM|License)\s*(?:No|Number|#)?\s*[:\-]?\s*([A-Za-z0-9\/\-]{4,20})/i) ||
    text.match(/\b([A-Z]{2,5}[-\/]\d{4,8})\b/);

  if (regNoMatch && regNoMatch[1]) {
    result.regNo = regNoMatch[1].trim();
  }

  return result;
}

function extractEducation(text: string): { qual?: string; year?: string; institution?: string } {
  const result: { qual?: string; year?: string; institution?: string } = {};

  // Degrees
  const degrees = [
    "MBBS", "MD", "MS", "B.Sc Nursing", "M.Sc Nursing", "GNM", "ANM",
    "Post Basic B.Sc Nursing", "B.Pharm", "M.Pharm", "Pharm.D", "BPT", "MPT",
    "BDS", "MDS", "B.Sc MLT", "DMLT", "B.Sc Radiography",
  ];

  for (const deg of degrees) {
    const reg = new RegExp(`\\b${deg.replace(".", "\\.")}\\b`, "i");
    if (reg.test(text)) {
      result.qual = deg;
      break;
    }
  }

  // Year of completion (4 digits between 1980 and current year)
  const yearMatch = text.match(/(?:Completed in|Year of Passing|Passing Year|Graduation|Batch)\s*[:\-]?\s*((?:19|20)\d{2})/i) ||
                    text.match(/\b(20[0-2][0-9]|199[0-9])\b/);
  if (yearMatch && yearMatch[1]) {
    result.year = yearMatch[1];
  }

  // Institution / University
  const instMatch =
    text.match(/(?:College|University|Institution|Institute)\s*[:\-]?\s*([A-Za-z\s\,\.]{6,60}(?:College|University|Institute|AIIMS|Academy|Hospital))/i) ||
    text.match(/([A-Za-z\s\,\.]{4,40}(?:Medical College|College of Nursing|Institute of Medical Sciences|Pharmacy College|University))/i);

  if (instMatch && instMatch[1]) {
    result.institution = instMatch[1].trim().replace(/^[\:\-\,\s]+/, "");
  }

  return result;
}

function extractExperience(text: string): { exp?: string; employer?: string; designation?: string; notice?: string } {
  const result: { exp?: string; employer?: string; designation?: string; notice?: string } = {};

  // Experience level
  const expMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)\s*(?:of)?\s*exp/i) ||
                   text.match(/total\s*experience\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i);

  if (expMatch && expMatch[1]) {
    const yrs = parseFloat(expMatch[1]);
    if (yrs < 1) result.exp = "Fresher";
    else if (yrs < 2) result.exp = "Under 2 yrs";
    else if (yrs <= 5) result.exp = "2–5 yrs";
    else if (yrs <= 10) result.exp = "5–10 yrs";
    else result.exp = "10+ yrs";
  } else if (/fresher|intern\b/i.test(text) && !/years\s*exp/i.test(text)) {
    result.exp = "Fresher";
  }

  // Employer matching (Hospitals / Healthcare centers)
  const hospMatch = text.match(/([A-Za-z\s\.\']{3,35}(?:Hospital|Hospitals|Healthcare|Medical Center|Clinic|Health City|Institute))/i);
  if (hospMatch && hospMatch[1]) {
    result.employer = hospMatch[1].trim();
  }

  // Designation
  const desigMatch = text.match(/(?:Designation|Role|Position)\s*[:\-]?\s*([A-Za-z\s]{3,35})/i) ||
                     text.match(/(?:Senior Staff Nurse|Staff Nurse|Consultant|Junior Resident|Medical Officer|Head Nurse|Clinical Pharmacist|Physiotherapist)/i);
  if (desigMatch && desigMatch[1]) {
    result.designation = desigMatch[1].trim();
  }

  // Notice Period
  if (/immediate|immediately/i.test(text)) result.notice = "Immediately";
  else if (/15 days/i.test(text)) result.notice = "15 days";
  else if (/30 days|1 month/i.test(text)) result.notice = "30 days";

  return result;
}

function extractClinicalSkills(text: string, role?: string): string[] {
  const lower = text.toLowerCase();
  const pool = (role && skillsByProfession[role]) ? skillsByProfession[role] : [
    ...skillsByProfession["Nurse"],
    ...skillsByProfession["Doctor"],
  ];

  const matched = pool.filter((skill) => {
    const sLower = skill.toLowerCase();
    // Check main keywords
    const keywords = sLower.split(/[\/\&]/).map((k) => k.trim());
    return keywords.some((k) => k.length > 2 && lower.includes(k));
  });

  // Always return unique array
  return Array.from(new Set(matched)).slice(0, 8);
}

function extractLanguages(text: string): string[] {
  const candidateLangs = ["English", "Hindi", "Tamil", "Telugu", "Kannada", "Malayalam", "Marathi", "Bengali"];
  const lower = text.toLowerCase();
  const found = candidateLangs.filter((l) => lower.includes(l.toLowerCase()));
  return found.length > 0 ? found : ["English", "Hindi"];
}
