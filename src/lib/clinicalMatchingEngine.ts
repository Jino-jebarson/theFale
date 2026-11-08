// src/lib/clinicalMatchingEngine.ts
// Clinical-grade multi-factor matching engine for FALE Healthcare
// Evaluates clinical cadre, subspecialties, certifications, procedure skills, and council requirements.

export type ClinicalCadre = "DOCTOR" | "NURSE" | "PHYSIOTHERAPIST" | "PHARMACIST" | "TECHNICIAN" | "STUDENT" | "UNKNOWN";

export interface MatchCandidateInput {
  role?: string;
  profession?: string;
  specialty?: string;
  subSpecialties?: string[];
  qualification?: string;
  skills?: string[];
  city?: string;
  state?: string;
  preferredCities?: string[];
  relocate?: boolean;
  kycStatus?: string;
  isStudent?: boolean;
  experienceYears?: string | number;
}

export interface MatchJobInput {
  title: string;
  dept?: string;
  city?: string;
  qualification?: string;
  tags?: string[];
  exp?: string;
  urgent?: boolean;
  kind?: string;
  type?: string;
}

export interface MatchResult {
  score: number;
  isRecommended: boolean; // >= 70%
  isTopMatch: boolean; // >= 85%
  breakdown: {
    professionScore: number;
    specialtyScore: number;
    skillsScore: number;
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
    "medical officer", "cmo", "gdmo", "rso", "duty doctor", "casuality medical officer"
  ],
  NURSE: [
    "nurse", "nursing", "staff nurse", "sister", "gnm", "b.sc nursing", "m.sc nursing",
    "anm", "charge nurse", "nursing officer", "matron", "scrub nurse", "bedside nurse",
    "icu nurse", "ot nurse", "critical care nurse", "neonatal nurse", "sister in charge"
  ],
  PHYSIOTHERAPIST: [
    "physio", "physiotherapy", "physiotherapist", "bpt", "mpt", "dpt", "rehabilitation",
    "physical therapist", "neuro physio", "ortho physio", "sports therapist"
  ],
  PHARMACIST: [
    "pharmacist", "pharmacy", "b.pharm", "m.pharm", "d.pharm", "pharm.d",
    "dispensing pharmacist", "clinical pharmacist", "hospital pharmacist"
  ],
  TECHNICIAN: [
    "technician", "technologist", "bmlt", "dmlt", "lab tech", "medical lab",
    "radiographer", "x-ray", "mri", "ct scan", "dialysis tech", "ot tech",
    "anesthesia tech", "ecg tech", "cath lab tech", "perfusionist", "phlebotomist", "mit"
  ],
  STUDENT: [
    "student", "intern", "internship", "trainee", "clinical rotation", "shadowing", "scholar"
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
      "acute care", "resuscitation", "emergency", "trauma", "casualty", "triage",
      "ventilator", "intubation", "central line", "bls", "acls", "code blue", "abg", "airway"
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
      "echo", "ecg", "angioplasty", "stemi", "arrhythmia", "heart"
    ],
    relatedDomains: ["CRITICAL_CARE"],
  },
  {
    domain: "SURGERY_OT",
    keywords: [
      "operation theatre", "operation theater", "ot", "general surgery", "surgical",
      "laparoscopic", "post-op", "pacu", "scrub", "circulating", "sterilization", "cssd", "anesthesia"
    ],
    relatedDomains: ["CRITICAL_CARE", "EMERGENCY"],
  },
  {
    domain: "PEDIATRICS_NEONATOLOGY",
    keywords: [
      "pediatrics", "paediatrics", "pediatric", "neonatology", "neonatal", "nicu", "picu",
      "child health", "pals", "immunization", "newborn"
    ],
    relatedDomains: ["CRITICAL_CARE"],
  },
  {
    domain: "OBSTETRICS_GYNECOLOGY",
    keywords: [
      "obstetrics", "gynecology", "ob-gyn", "obg", "maternity", "labor room", "labour room",
      "delivery", "antenatal", "postnatal", "l&d", "midwifery", "cesarean"
    ],
    relatedDomains: ["PEDIATRICS_NEONATOLOGY", "SURGERY_OT"],
  },
  {
    domain: "ORTHOPEDICS",
    keywords: [
      "orthopedics", "ortho", "orthopaedic", "bone", "joint", "spine", "fracture",
      "arthroplasty", "trauma surgery", "musculoskeletal", "replacement"
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
      "family medicine", "primary care", "infection", "fever", "hypertension", "diabetes"
    ],
    relatedDomains: ["CRITICAL_CARE"],
  },
  {
    domain: "DIAGNOSTICS_PATHOLOGY_RADIOLOGY",
    keywords: [
      "pathology", "hematology", "biochemistry", "microbiology", "blood bank", "histopathology",
      "radiology", "ultrasound", "usg", "ct scan", "mri", "x-ray", "sample", "analyzer"
    ],
  },
  {
    domain: "PHYSIOTHERAPY",
    keywords: ["physiotherapy", "rehabilitation", "mobility", "exercise therapy", "stroke rehab", "post-op rehab"],
    relatedDomains: ["ORTHOPEDICS", "NEUROLOGY_NEUROSURGERY"],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// 3. HELPER FUNCTIONS
// ─────────────────────────────────────────────────────────────────────────────

function detectCadre(text: string): ClinicalCadre {
  const lower = text.toLowerCase();
  for (const [cadre, keywords] of Object.entries(CADRE_KEYWORDS)) {
    if (cadre === "UNKNOWN") continue;
    if (keywords.some((kw) => lower.includes(kw))) {
      return cadre as ClinicalCadre;
    }
  }
  return "UNKNOWN";
}

function findSpecialtyDomains(text: string): string[] {
  const lower = text.toLowerCase();
  const matched: string[] = [];
  for (const s of SPECIALTY_DOMAINS) {
    if (s.keywords.some((kw) => lower.includes(kw))) {
      matched.push(s.domain);
    }
  }
  return matched;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. CORE CLINICAL MATCHING ENGINE
// ─────────────────────────────────────────────────────────────────────────────

export function calculateClinicalMatch(
  candidate: MatchCandidateInput,
  job: MatchJobInput
): MatchResult {
  const reasons: string[] = [];

  const candidateRoleStr = `${candidate.role || ""} ${candidate.profession || ""} ${candidate.qualification || ""}`;
  const candidateCadre = candidate.isStudent ? "STUDENT" : detectCadre(candidateRoleStr);

  const jobRoleStr = `${job.title} ${job.dept || ""} ${(job.tags || []).join(" ")} ${job.qualification || ""}`;
  const jobCadre = detectCadre(jobRoleStr);

  // ── FACTOR 1: CLINICAL PROFESSION / CADRE SAFETY (Max: 40 points) ─────────
  let professionScore = 0;

  if (candidate.isStudent) {
    const isInternshipJob = job.kind === "internship" || job.type === "Internship" || job.exp?.toLowerCase().includes("student");
    if (isInternshipJob) {
      professionScore = 40;
      reasons.push("Eligible clinical internship tailored for student enrolment");
    } else {
      professionScore = 10; // Student viewing graduate duty
      reasons.push("Independent role (patient duty requires completed registration)");
    }
  } else if (candidateCadre === "UNKNOWN" || jobCadre === "UNKNOWN") {
    // Cannot determine strict cadre mismatch; give neutral mid-score
    professionScore = 25;
  } else if (candidateCadre === jobCadre) {
    professionScore = 40;
    reasons.push(`Profession verified (${candidateCadre})`);
  } else {
    // HARD MISMATCH: Doctor viewing Nurse role, or Nurse viewing Doctor surgery, etc.
    professionScore = 0;
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
    // Check related / neighbouring emergency or ICU overlap
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
    } else if (!candidate.specialty) {
      specialtyScore = 8;
    } else {
      specialtyScore = 0;
    }
  }

  // ── FACTOR 3: PROCEDURE SKILLS & CLINICAL COMPETENCIES (Max: 15 points) ──
  let skillsScore = 0;
  const candidateSkills = (candidate.skills || []).map((s) => s.toLowerCase());
  const jobTextLower = jobRoleStr.toLowerCase();

  if (candidateSkills.length > 0) {
    let skillHits = 0;
    for (const skill of candidateSkills) {
      if (jobTextLower.includes(skill)) {
        skillHits++;
      }
    }
    if (skillHits >= 3) {
      skillsScore = 15;
      reasons.push("Strong alignment with required clinical procedures");
    } else if (skillHits > 0) {
      skillsScore = 10;
      reasons.push("Matching clinical procedure skills");
    } else {
      skillsScore = 4;
    }
  } else {
    // Fallback: check if standard essential badges (BLS/ACLS/NABH) align
    if (jobTextLower.includes("nabh") || jobTextLower.includes("registration")) {
      skillsScore = 8;
    } else {
      skillsScore = 5;
    }
  }

  // ── FACTOR 4: GEOGRAPHIC & RELOCATION FEASIBILITY (Max: 10 points) ────────
  let locationScore = 0;
  const cCity = (candidate.city || "").trim().toLowerCase();
  const jCity = (job.city || "").trim().toLowerCase();
  const preferred = (candidate.preferredCities || []).map((c) => c.toLowerCase());
  const isPermanentJob = job.kind !== "internship" && job.type !== "Internship";

  if (cCity && jCity && (cCity.includes(jCity) || jCity.includes(cCity))) {
    locationScore = 10;
    reasons.push(`Located in your registered city (${job.city})`);
  } else if (preferred.some((p) => jCity.includes(p) || p.includes(jCity))) {
    locationScore = 10;
    reasons.push(`Matches your preferred practice city (${job.city})`);
  } else if (candidate.relocate || isPermanentJob) {
    // For full-time hospital positions, candidates regularly relocate across Indian states
    locationScore = 8;
    reasons.push("Pan-India mobility & inter-city relocation viable");
  } else if (!cCity || !jCity) {
    locationScore = 6;
  } else {
    locationScore = 3;
  }

  // ── FACTOR 5: REGULATORY & COUNCIL VERIFICATION (Max: 10 points) ─────────
  let qualificationScore = 0;
  const qualText = (candidate.qualification || "").toLowerCase();
  const reqQual = (job.qualification || "").toLowerCase();

  if (qualText && reqQual && (qualText.includes(reqQual) || reqQual.includes(qualText))) {
    qualificationScore += 6;
  } else if (
    (qualText.includes("mbbs") && jobTextLower.includes("mbbs")) ||
    ((qualText.includes("gnm") || qualText.includes("b.sc")) && (jobTextLower.includes("nurs") || jobTextLower.includes("gnm"))) ||
    (qualText.includes("bpt") && jobTextLower.includes("physio"))
  ) {
    qualificationScore += 6;
  } else {
    qualificationScore += 2;
  }

  if (candidate.kycStatus === "VERIFIED") {
    qualificationScore += 4;
    reasons.push("Council Registration Verified");
  } else {
    qualificationScore += 1;
  }

  // ── COMPUTE TOTAL AND APPLY STRICT SAFETY BARRIER ─────────────────────────
  let totalScore = professionScore + specialtyScore + skillsScore + locationScore + qualificationScore;

  // SAFETY HARD BARRIER:
  // If the candidate's profession is completely mismatched with the job,
  // cap score below 30% so it can NEVER mistakenly reach the 70% threshold.
  if (candidateCadre !== "UNKNOWN" && jobCadre !== "UNKNOWN" && candidateCadre !== jobCadre) {
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
      locationScore,
      qualificationScore,
    },
    matchedCadre: candidateCadre,
    reasons,
  };
}

