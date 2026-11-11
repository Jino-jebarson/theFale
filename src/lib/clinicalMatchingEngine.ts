// src/lib/clinicalMatchingEngine.ts
// Canonical 6-factor Clinical Matching Engine (1:1 parity with backend ClinicalMatchingEngine.java)
// Evaluates clinical cadre, specialty domains, skills, experience years, geography, and KYC standing.

export type ClinicalCadre = "DOCTOR" | "NURSE" | "PHYSIOTHERAPIST" | "PHARMACIST" | "TECHNICIAN" | "STUDENT" | "UNKNOWN";

export interface MatchCandidateInput {
  role?: string | undefined;
  profession?: string | undefined;
  specialty?: string | undefined;
  subSpecialties?: string[] | undefined;
  qualification?: string | undefined;
  skills?: string[] | undefined;
  city?: string | undefined;
  state?: string | undefined;
  preferredCities?: string[] | undefined;
  relocate?: boolean | undefined;
  kycStatus?: string | undefined;
  isStudent?: boolean | undefined;
  experienceYears?: string | number | undefined;
}

export interface MatchJobInput {
  title: string;
  dept?: string | undefined;
  city?: string | undefined;
  qualification?: string | undefined;
  tags?: string[] | undefined;
  exp?: string | undefined;
  urgent?: boolean | undefined;
  kind?: string | undefined;
  type?: string | undefined;
}

export interface MatchResult {
  score: number;
  isRecommended: boolean; // >= 70%
  isTopMatch: boolean; // >= 85%
  breakdown: {
    professionScore: number;
    specialtyScore: number;
    skillsScore: number;
    experienceScore: number;
    locationScore: number;
    qualificationScore: number;
  };
  matchedCadre: ClinicalCadre;
  reasons: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CLINICAL CADRE TAXONOMY & KEYWORD DICTIONARIES
// ─────────────────────────────────────────────────────────────────────────────

const CADRE_KEYWORDS: Record<ClinicalCadre, string[]> = {
  DOCTOR: [
    "doctor", "physician", "surgeon", "mbbs", "md", "ms", "dnb", "dm", "mch",
    "consultant", "resident", "registrar", "fellow", "intensivist", "anesthesiologist",
    "anaesthesiologist", "cardiologist", "pediatrician", "paediatrician", "gynaecologist",
    "gynecologist", "orthopedist", "orthopaedic surgeon", "general practitioner", "gp",
    "medical officer", "cmo", "gdmo", "rso", "duty doctor", "casualty medical officer", "casuality medical officer",
  ],
  NURSE: [
    "nurse", "nursing", "staff nurse", "sister", "gnm", "b.sc nursing", "bsc nursing",
    "m.sc nursing", "msc nursing", "anm", "charge nurse", "nursing officer", "matron",
    "scrub nurse", "bedside nurse", "icu nurse", "ot nurse", "critical care nurse",
    "neonatal nurse", "sister in charge",
  ],
  PHYSIOTHERAPIST: [
    "physio", "physiotherapy", "physiotherapist", "bpt", "mpt", "dpt", "rehabilitation",
    "physical therapist", "neuro physio", "ortho physio", "sports therapist",
  ],
  PHARMACIST: [
    "pharmacist", "pharmacy", "b.pharm", "bpharm", "m.pharm", "mpharm",
    "d.pharm", "dpharm", "pharm.d", "pharmd", "dispensing pharmacist",
    "clinical pharmacist", "hospital pharmacist",
  ],
  TECHNICIAN: [
    "technician", "technologist", "bmlt", "dmlt", "lab tech", "medical lab",
    "radiographer", "x-ray", "xray", "mri", "ct scan", "dialysis tech", "ot tech",
    "anesthesia tech", "ecg tech", "cath lab tech", "perfusionist", "phlebotomist", "mit",
  ],
  STUDENT: [
    "student", "intern", "internship", "trainee", "clinical rotation", "shadowing", "scholar",
  ],
  UNKNOWN: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. CLINICAL SPECIALTY & SUBSPECIALTY DOMAINS
// ─────────────────────────────────────────────────────────────────────────────

interface SpecialtyDomain {
  domain: string;
  keywords: string[];
  relatedDomains?: string[];
}

const SPECIALTY_DOMAINS: SpecialtyDomain[] = [
  {
    domain: "CRITICAL_CARE",
    keywords: [
      "icu", "ccu", "micu", "sicu", "picu", "nicu", "critical care", "intensive care",
      "acute care", "resuscitation", "ventilator", "intubation", "central line",
      "bls", "acls", "code blue", "abg", "airway",
    ],
    relatedDomains: ["EMERGENCY", "CARDIOLOGY", "SURGERY_OT"],
  },
  {
    domain: "EMERGENCY",
    keywords: ["emergency", "casualty", "trauma", "er", "ed", "triage", "ambulance", "acute"],
    relatedDomains: ["CRITICAL_CARE", "SURGERY_OT"],
  },
  {
    domain: "CARDIOLOGY",
    keywords: [
      "cardiology", "cardiac", "cath lab", "coronary", "cardiothoracic", "ctvs",
      "echo", "ecg", "angioplasty", "stemi", "arrhythmia", "heart",
    ],
    relatedDomains: ["CRITICAL_CARE"],
  },
  {
    domain: "SURGERY_OT",
    keywords: [
      "operation theatre", "operation theater", "ot", "general surgery", "surgical",
      "laparoscopic", "post-op", "pacu", "scrub", "circulating", "sterilization", "cssd", "anesthesia",
    ],
    relatedDomains: ["CRITICAL_CARE", "EMERGENCY"],
  },
  {
    domain: "PEDIATRICS_NEONATOLOGY",
    keywords: [
      "pediatrics", "paediatrics", "pediatric", "neonatology", "neonatal", "nicu", "picu",
      "child health", "pals", "immunization", "newborn",
    ],
    relatedDomains: ["CRITICAL_CARE"],
  },
  {
    domain: "OBSTETRICS_GYNECOLOGY",
    keywords: [
      "obstetrics", "gynecology", "ob-gyn", "obg", "maternity", "labor room", "labour room",
      "delivery", "antenatal", "postnatal", "l&d", "midwifery", "cesarean",
    ],
    relatedDomains: ["PEDIATRICS_NEONATOLOGY", "SURGERY_OT"],
  },
  {
    domain: "ORTHOPEDICS",
    keywords: [
      "orthopedics", "ortho", "orthopaedic", "bone", "joint", "spine", "fracture",
      "arthroplasty", "trauma surgery", "musculoskeletal", "replacement",
    ],
    relatedDomains: ["SURGERY_OT", "PHYSIOTHERAPY"],
  },
  {
    domain: "NEPHROLOGY_DIALYSIS",
    keywords: ["nephrology", "dialysis", "hemodialysis", "renal", "kidney", "peritoneal dialysis", "fistula"],
    relatedDomains: ["CRITICAL_CARE", "GENERAL_MEDICINE"],
  },
  {
    domain: "NEUROLOGY_NEUROSURGERY",
    keywords: ["neurology", "neuro", "neurosurgery", "stroke", "epilepsy", "neuro-icu", "eeg", "craniotomy"],
    relatedDomains: ["CRITICAL_CARE", "SURGERY_OT"],
  },
  {
    domain: "ONCOLOGY",
    keywords: ["oncology", "cancer", "chemotherapy", "radiation oncology", "surgical oncology", "palliative", "tumor"],
    relatedDomains: ["GENERAL_MEDICINE", "SURGERY_OT"],
  },
  {
    domain: "GENERAL_MEDICINE",
    keywords: [
      "general medicine", "internal medicine", "physician", "opd", "inpatient", "ward",
      "family medicine", "primary care", "fever", "hypertension", "diabetes",
    ],
    relatedDomains: ["CRITICAL_CARE"],
  },
  {
    domain: "DIAGNOSTICS_PATHOLOGY_RADIOLOGY",
    keywords: [
      "pathology", "hematology", "biochemistry", "microbiology", "blood bank", "histopathology",
      "radiology", "ultrasound", "usg", "ct scan", "mri", "x-ray", "analyzer",
    ],
  },
  {
    domain: "PHYSIOTHERAPY",
    keywords: ["physiotherapy", "rehabilitation", "mobility", "exercise therapy", "stroke rehab", "post-op rehab"],
    relatedDomains: ["ORTHOPEDICS", "NEUROLOGY_NEUROSURGERY"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. HELPER FUNCTIONS (Word-boundary & Numeric Parsers)
// ─────────────────────────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function containsWordBoundary(haystack: string, needle: string): boolean {
  if (!haystack || !needle) return false;
  const cleanNeedle = needle.trim().toLowerCase();
  if (!cleanNeedle) return false;
  const pattern = new RegExp(`(?:^|[^a-z0-9])${escapeRegex(cleanNeedle)}(?:$|[^a-z0-9])`, "i");
  return pattern.test(haystack);
}

function detectCadre(text: string): ClinicalCadre {
  if (!text) return "UNKNOWN";
  for (const [cadre, keywords] of Object.entries(CADRE_KEYWORDS)) {
    if (cadre === "UNKNOWN") continue;
    if (keywords.some((kw) => containsWordBoundary(text, kw))) {
      return cadre as ClinicalCadre;
    }
  }
  return "UNKNOWN";
}

function findSpecialtyDomains(text: string): string[] {
  if (!text) return [];
  const matched: string[] = [];
  for (const s of SPECIALTY_DOMAINS) {
    if (s.keywords.some((kw) => containsWordBoundary(text, kw))) {
      matched.push(s.domain);
    }
  }
  return matched;
}

function parseMinYears(raw?: string | number): number | null {
  if (raw === undefined || raw === null) return null;
  if (typeof raw === "number") return Number.isFinite(raw) ? raw : null;
  const lower = raw.trim().toLowerCase();
  if (!lower) return null;
  if (lower.includes("fresher") || lower.includes("student") || lower.includes("intern") || lower.includes("entry")) {
    return 0;
  }
  const match = lower.match(/(\d+(?:\.\d+)?)/);
  if (match && match[1]) {
    const val = parseFloat(match[1]);
    if (lower.includes("month") && !lower.includes("year") && !lower.includes("yr")) {
      return val / 12;
    }
    return val;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CORE 6-FACTOR CLINICAL MATCHING ENGINE (Max 100 pts)
// ─────────────────────────────────────────────────────────────────────────────

export function calculateClinicalMatch(
  candidate: MatchCandidateInput,
  job: MatchJobInput
): MatchResult {
  const reasons: string[] = [];

  const candidateRoleStr = `${candidate.role || ""} ${candidate.profession || ""} ${candidate.qualification || ""}`;
  const candidateCadre = candidate.isStudent ? "STUDENT" : detectCadre(candidateRoleStr);

  const jobHeaderText = `${job.title} ${job.dept || ""} ${job.qualification || ""}`;
  const jobRoleStr = `${job.title} ${job.dept || ""} ${(job.tags || []).join(" ")} ${job.qualification || ""}`;
  const jobCadre = detectCadre(jobHeaderText);

  // ── FACTOR 1: CLINICAL PROFESSION / CADRE SAFETY (Max: 35 points) ─────────
  let professionScore = 0;
  let cadreMismatch = false;

  if (candidate.isStudent) {
    const isInternshipJob =
      job.kind === "internship" ||
      job.type === "Internship" ||
      Boolean(job.exp?.toLowerCase().includes("student"));
    if (isInternshipJob) {
      professionScore = 35;
      reasons.push("Eligible clinical internship tailored for student enrolment");
    } else {
      professionScore = 0;
      cadreMismatch = true;
      reasons.push("Independent role (patient duty requires completed registration)");
    }
  } else if (candidateCadre === "UNKNOWN" || jobCadre === "UNKNOWN") {
    professionScore = 20;
  } else if (candidateCadre === jobCadre) {
    professionScore = 35;
    reasons.push(`Profession verified (${candidateCadre})`);
  } else {
    professionScore = 0;
    cadreMismatch = true;
    reasons.push(`Different clinical cadre (${candidateCadre} vs. required ${jobCadre})`);
  }

  // ── FACTOR 2: SPECIALTY & CLINICAL DEPARTMENT (Max: 25 points) ────────────
  let specialtyScore = 0;
  const candidateSpecText = `${candidate.specialty || ""} ${(candidate.subSpecialties || []).join(" ")}`;
  const candidateDomains = findSpecialtyDomains(candidateSpecText);
  const jobDomains = findSpecialtyDomains(jobRoleStr);

  const hasDirectDomainOverlap = candidateDomains.some((d) => jobDomains.includes(d));

  if (hasDirectDomainOverlap) {
    specialtyScore = 25;
    reasons.push("Direct clinical specialty & department alignment");
  } else {
    const hasRelatedDomain = candidateDomains.some((cd) => {
      const def = SPECIALTY_DOMAINS.find((d) => d.domain === cd);
      return def?.relatedDomains?.some((rd) => jobDomains.includes(rd));
    });

    if (hasRelatedDomain) {
      specialtyScore = 18;
      reasons.push("Cross-compatible clinical emergency / acute care specialty");
    } else if (jobDomains.includes("GENERAL_MEDICINE") || candidateDomains.includes("GENERAL_MEDICINE")) {
      specialtyScore = 12;
      reasons.push("General clinical medicine coverage");
    } else if (!candidateSpecText.trim()) {
      specialtyScore = 8;
    } else {
      specialtyScore = 2;
    }
  }

  // ── FACTOR 3: PROCEDURE SKILLS & CLINICAL COMPETENCIES (Max: 15 points) ──
  let skillsScore = 0;
  const candidateSkills = (candidate.skills || []).map((s) => s.trim().toLowerCase()).filter(Boolean);

  if (candidateSkills.length > 0) {
    let skillHits = 0;
    for (const skill of candidateSkills) {
      if (containsWordBoundary(jobRoleStr, skill)) {
        skillHits++;
      }
    }
    if (skillHits >= 3) {
      skillsScore = 15;
      reasons.push("Strong alignment with required clinical procedures");
    } else if (skillHits === 2) {
      skillsScore = 12;
      reasons.push("Matching clinical procedure skills");
    } else if (skillHits === 1) {
      skillsScore = 9;
      reasons.push("Matching clinical procedure skill");
    } else {
      skillsScore = 3;
    }
  } else {
    skillsScore = candidateCadre === jobCadre && candidateCadre !== "UNKNOWN" ? 7 : 4;
  }

  // ── FACTOR 4: EXPERIENCE YEARS ALIGNMENT (Max: 10 points) ─────────────────
  let experienceScore = 0;
  const reqMin = parseMinYears(job.exp);
  const candYrs = parseMinYears(candidate.experienceYears);

  if (reqMin === null) {
    experienceScore = candYrs !== null && candYrs > 0 ? 9 : 7;
  } else if (reqMin <= 0) {
    experienceScore = 10;
  } else if (candYrs === null) {
    experienceScore = 5;
  } else if (candYrs >= reqMin) {
    experienceScore = 10;
    reasons.push("Meets required clinical experience");
  } else if (candYrs >= reqMin - 1) {
    experienceScore = 6;
  } else {
    experienceScore = 2;
  }

  // ── FACTOR 5: GEOGRAPHIC & RELOCATION FEASIBILITY (Max: 8 points) ─────────
  let locationScore = 0;
  const cCity = (candidate.city || "").trim().toLowerCase();
  const jCity = (job.city || "").trim().toLowerCase();
  const preferred = (candidate.preferredCities || []).map((c) => c.trim().toLowerCase()).filter(Boolean);

  if (cCity && jCity && (cCity.includes(jCity) || jCity.includes(cCity))) {
    locationScore = 8;
    reasons.push(`Located in your registered city (${job.city})`);
  } else if (jCity && preferred.some((p) => jCity.includes(p) || p.includes(jCity))) {
    locationScore = 8;
    reasons.push(`Matches your preferred practice city (${job.city})`);
  } else if (candidate.relocate) {
    locationScore = 5;
    reasons.push("Open to inter-city relocation");
  } else if (!cCity || !jCity) {
    locationScore = 5;
  } else {
    locationScore = 2;
  }

  // ── FACTOR 6: REGULATORY & COUNCIL VERIFICATION (Max: 7 points) ──────────
  let qualificationScore = 0;
  const qualText = (candidate.qualification || "").trim().toLowerCase();
  const reqQual = (job.qualification || "").trim().toLowerCase();

  if (reqQual) {
    if (
      qualText &&
      (containsWordBoundary(qualText, reqQual) ||
        containsWordBoundary(reqQual, qualText) ||
        containsWordBoundary(jobRoleStr, qualText))
    ) {
      qualificationScore += 4;
    } else {
      qualificationScore += 1;
    }
  } else {
    qualificationScore += qualText ? 3 : 2;
  }

  if (candidate.kycStatus?.toUpperCase() === "VERIFIED") {
    qualificationScore += 3;
    reasons.push("Council Registration Verified");
  } else if (candidate.kycStatus?.toUpperCase() !== "REJECTED") {
    qualificationScore += 1;
  }

  // ── COMPUTE TOTAL AND APPLY STRICT SAFETY BARRIER ─────────────────────────
  let totalScore =
    professionScore + specialtyScore + skillsScore + experienceScore + locationScore + qualificationScore;

  if (cadreMismatch) {
    totalScore = Math.min(28, totalScore);
  }

  const finalScore = Math.max(10, Math.min(99, Math.round(totalScore)));

  return {
    score: finalScore,
    isRecommended: finalScore >= 70,
    isTopMatch: finalScore >= 85,
    breakdown: {
      professionScore,
      specialtyScore,
      skillsScore,
      experienceScore,
      locationScore,
      qualificationScore,
    },
    matchedCadre: candidateCadre,
    reasons,
  };
}
