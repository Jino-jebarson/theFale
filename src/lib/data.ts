export interface Job {
  description?: string;
  id: string;
  title: string;
  org: string;
  city: string;
  salary: string;
  exp: string;
  type: string;
  shift: string;
  posted: string;
  tags: string[];
  match: number;
  urgent?: boolean;
  dept?: string;
  qualification?: string;
  perks?: string[];
  accredited?: boolean;
  kind?: "job" | "internship";
  stipend?: string;
  forStudents?: boolean;
}

export const jobs: Job[] = [];

export interface Shift {
  id: string;
  title: string;
  org: string;
  city: string;
  date: string;
  time: string;
  hours: number;
  rate: number;
  dept: string;
  urgent?: boolean;
  surge?: string;
  perks?: string[];
  verified?: boolean;
}

export const shifts: Shift[] = [];

export interface CourseLesson {
  id: string;
  title: string;
  duration: string;
  type: "video" | "interactive_case" | "quiz" | "reading";
  contentPreview?: string;
}

export interface CourseModule {
  id: string;
  title: string;
  duration: string;
  lessons: CourseLesson[];
}

export interface ClinicalScenarioOption {
  id: string;
  text: string;
  isCorrect: boolean;
  explanation: string;
}

export interface ClinicalScenario {
  title: string;
  caseDescription: string;
  patientVitals: {
    hr: string;
    bp: string;
    spo2: string;
    rhythm: string;
  };
  prompt: string;
  options: ClinicalScenarioOption[];
}

export interface Course {
  id: string;
  title: string;
  provider: string;
  category:
  | "Critical Care"
  | "Emergency & Trauma"
  | "Infection Control"
  | "Nursing Essentials"
  | "Quality & NABH"
  | "Pharmacology"
  | "Clinical Pharmacology"
  | "Dialysis & Renal"
  | "Physiotherapy & Rehab"
  | "Radiology & Imaging"
  | "Student Essentials"
  | (string & {});
  duration: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  cmeCredits: number;
  rating: number;
  reviewsCount: number;
  enrolledCount: number;
  accreditedBy: string;
  accreditationBadge: string;
  summary: string;
  overview: string;
  targetAudience: string;
  skillsGained: string[];
  whatYouWillLearn: string[];
  instructor: {
    name: string;
    role: string;
    hospital: string;
    avatarInitials: string;
    bio: string;
  };
  modules: CourseModule[];
  clinicalScenario: ClinicalScenario;
  certificateDetails: {
    credentialCode: string;
    validity: string;
    recognizedHospitals: string[];
  };
  featured?: boolean;
}

export const courses: Course[] = [];

export interface Applicant {
  id: string;
  name: string;
  role: string;
  exp: string;
  city: string;
  for: string;
  status: string;
  verified: boolean;
  match: number;
  appliedDate: string;
  currentOrg: string;
  qualification: string;
  regNumber: string;
  skills: string[];
  noticePeriod: string;
  expectedSalary: string;
  phone: string;
  email: string;
  bio: string;
  education: string;
  certifications: string[];
  isShiftClaim?: boolean;
  actualHours?: number;
  scheduledHours?: number;
  hourlyRate?: number;
  checkInPin?: string;
  checkInQrToken?: string;
  attendanceRecorded?: boolean;
  disputeReason?: string;
  hospitalRating?: number;
  hospitalReview?: string;
  ratingTags?: string[];
  candidateRatingAvg?: number;
  candidateRatingCount?: number;
  completedShiftsCount?: number;
  shiftClaimStatus?: string;
  experienceList: { hospital: string; role: string; duration: string; details: string }[];
  resumeUrl?: string;
  resumeFileName?: string;
  candidateDocuments?: { id?: string; documentType: string; originalFileName: string; fileUrl: string; mimeType?: string; verified?: boolean }[];
}


export const applicants: Applicant[] = [];

export const professions = [
  "Doctor",
  "Nurse",
  "Physiotherapist",
  "Lab Technician",
  "Radiographer",
  "Pharmacist",
  "Dialysis Technician",
  "OT Technician",
  "Anaesthesia Technician",
  "Paramedic",
  "Cardiac Care Technician",
  "Respiratory Therapist",
  "Occupational Therapist",
  "Speech Therapist",
  "Optometrist",
  "Dietitian",
  "Phlebotomist",
  "Audiologist",
  "Dental Hygienist",
  "Medical Coder",
];

export const nonRegulatedProfessions = ["Phlebotomist", "Medical Coder"];
export const regulatedProfessions = professions.filter((p) => !nonRegulatedProfessions.includes(p));

export const doctorCouncils = [
  "National Medical Commission (NMC)",
  "Andhra Pradesh Medical Council",
  "Arunachal Pradesh Medical Council",
  "Assam Medical Council",
  "Bihar Medical Council",
  "Chhattisgarh Medical Council",
  "Delhi Medical Council",
  "Goa Medical Council",
  "Gujarat Medical Council",
  "Haryana Medical Council",
  "Himachal Pradesh Medical Council",
  "Jammu & Kashmir Medical Council",
  "Jharkhand Medical Council",
  "Karnataka Medical Council",
  "Travancore-Cochin / Kerala Medical Council",
  "Madhya Pradesh Medical Council",
  "Maharashtra Medical Council",
  "Manipur Medical Council",
  "Meghalaya Medical Council",
  "Mizoram Medical Council",
  "Nagaland Medical Council",
  "Odisha Medical Council",
  "Punjab Medical Council",
  "Rajasthan Medical Council",
  "Sikkim Medical Council",
  "Tamil Nadu Medical Council",
  "Telangana State Medical Council",
  "Tripura State Medical Council",
  "Uttar Pradesh Medical Council",
  "Uttarakhand Medical Council",
  "West Bengal Medical Council",
  "Other State Medical Council",
];

export const nurseCouncils = [
  "Indian Nursing Council (INC / NUID)",
  "Andhra Pradesh Nurses & Midwives Council",
  "Assam Nurses, Midwives & Health Visitors Council",
  "Bihar Nursing Registration Council",
  "Chhattisgarh Nurses Registration Council",
  "Delhi Nursing Council",
  "Goa Nursing Council",
  "Gujarat Nursing Council",
  "Haryana Nurses & Nurse-Midwives Council",
  "Himachal Pradesh Nurses Registration Council",
  "Jharkhand State Nursing Council",
  "Karnataka State Nursing Council",
  "Kerala Nurses and Midwives Council",
  "Madhya Pradesh Nurses Registration Council",
  "Maharashtra Nursing Council",
  "Manipur Nursing Council",
  "Meghalaya Nursing Council",
  "Mizoram Nursing Council",
  "Odisha Nurses & Midwives Council",
  "Punjab Nurses Registration Council",
  "Rajasthan Nursing Council",
  "Tamil Nadu Nurses and Midwives Council",
  "Telangana State Nurses & Midwives Council",
  "Tripura Nursing Council",
  "Uttar Pradesh Nurses & Midwives Council",
  "Uttarakhand Nurses & Midwives Council",
  "West Bengal Nursing Council",
  "Other State Nursing Council",
];

export const pharmacistCouncils = [
  "Pharmacy Council of India (PCI)",
  "Andhra Pradesh Pharmacy Council",
  "Assam Pharmacy Council",
  "Bihar State Pharmacy Council",
  "Delhi Pharmacy Council",
  "Gujarat State Pharmacy Council",
  "Haryana State Pharmacy Council",
  "Karnataka State Pharmacy Council",
  "Kerala State Pharmacy Council",
  "Madhya Pradesh State Pharmacy Council",
  "Maharashtra State Pharmacy Council",
  "Odisha State Pharmacy Council",
  "Punjab State Pharmacy Council",
  "Rajasthan Pharmacy Council",
  "Tamil Nadu Pharmacy Council",
  "Telangana State Pharmacy Council",
  "Uttar Pradesh Pharmacy Council",
  "West Bengal State Pharmacy Council",
  "Other State Pharmacy Council",
];

export const alliedCouncils = [
  "National Commission for Allied and Healthcare Professions (NCAHP)",
  "Andhra Pradesh Allied and Healthcare Council",
  "Delhi Council for Physiotherapy & Occupational Therapy",
  "Karnataka State Allied & Healthcare Council",
  "Kerala State Allied and Healthcare Council",
  "Maharashtra State Allied & Healthcare Council",
  "Tamil Nadu State Allied and Healthcare Council",
  "Telangana State Allied and Healthcare Council",
  "Rehabilitation Council of India (RCI)",
  "Other State Allied Healthcare Council",
  "Not applicable for my role",
];

export const dentalCouncils = [
  "Dental Council of India (DCI)",
  "Andhra Pradesh State Dental Council",
  "Delhi Dental Council",
  "Gujarat Dental Council",
  "Karnataka State Dental Council",
  "Kerala Dental Council",
  "Maharashtra State Dental Council",
  "Punjab Dental Council",
  "Rajasthan State Dental Council",
  "Tamil Nadu Dental Council",
  "Telangana State Dental Council",
  "Uttar Pradesh Dental Council",
  "West Bengal Dental Council",
  "Other State Dental Council",
];

export function getCouncilsForRole(role?: string): string[] {
  const r = (role || "Doctor").toLowerCase();
  if (r.includes("doctor") || r.includes("physician") || r.includes("surgeon")) {
    return doctorCouncils;
  }
  if (r.includes("nurse")) {
    return nurseCouncils;
  }
  if (r.includes("pharmac")) {
    return pharmacistCouncils;
  }
  if (r.includes("dental") || r.includes("dentist")) {
    return dentalCouncils;
  }
  if (r.includes("diet") || r.includes("nutrition")) {
    return ["Indian Dietetic Association (RD)", "Other professional body / council", "Not applicable for my role"];
  }
  if (r.includes("speech") || r.includes("audio")) {
    return ["Rehabilitation Council of India (RCI)", "National Commission for Allied and Healthcare Professions (NCAHP)", "Other state council"];
  }
  return alliedCouncils;
}

export function getOnlineRegisterName(council: string): string {
  if (!council || council === "Not applicable for my role") return "";
  if (council.includes("NMC") || council.includes("Medical")) return "NMC / State Indian Medical Register";
  if (council.includes("INC") || council.includes("Nursing") || council.includes("Midwives")) return "Indian Nursing Council (INC / NUID Registry)";
  if (council.includes("Pharmacy") || council.includes("PCI")) return "State Pharmacy Council Registry (PCI)";
  if (council.includes("Dental") || council.includes("DCI")) return "Dental Council of India Register";
  if (council.includes("Allied") || council.includes("NCAHP")) return "National Allied & Healthcare Commission Register";
  if (council.includes("Rehabilitation") || council.includes("RCI")) return "Rehabilitation Council of India Register";
  return "State Statutory Council Registry";
}

export const councilOptions = [
  ...doctorCouncils,
  ...nurseCouncils,
  ...pharmacistCouncils,
  ...alliedCouncils,
];

export const onlineCouncilRegisters: Record<string, string> = {
  "National Medical Commission (NMC)": "NMC Indian Medical Register",
  "Karnataka Medical Council": "NMC Indian Medical Register",
  "Tamil Nadu Medical Council": "NMC Indian Medical Register",
  "Maharashtra Medical Council": "NMC Indian Medical Register",
  "Delhi Medical Council": "NMC Indian Medical Register",
  "Indian Nursing Council (INC / NUID)": "Nursing council register (NUID)",
  "Karnataka State Nursing Council": "Nursing council register (NUID)",
  "Tamil Nadu Nurses and Midwives Council": "Nursing council register (NUID)",
  "Kerala Nurses and Midwives Council": "Nursing council register (NUID)",
  "Maharashtra Nursing Council": "Nursing council register (NUID)",
  "Pharmacy Council of India (PCI)": "State Pharmacy Council register",
  "Dental Council of India (DCI)": "State Dental Council register",
  "National Commission for Allied and Healthcare Professions (NCAHP)": "National Allied & Healthcare Register",
};

export const councilByProfession: Record<string, string> = {
  Doctor: "National Medical Commission (NMC)",
  Nurse: "Indian Nursing Council (INC / NUID)",
  Physiotherapist: "National Commission for Allied and Healthcare Professions (NCAHP)",
  "Lab Technician": "National Commission for Allied and Healthcare Professions (NCAHP)",
  Radiographer: "National Commission for Allied and Healthcare Professions (NCAHP)",
  Pharmacist: "Pharmacy Council of India (PCI)",
  "Dialysis Technician": "National Commission for Allied and Healthcare Professions (NCAHP)",
  "OT Technician": "National Commission for Allied and Healthcare Professions (NCAHP)",
  "Anaesthesia Technician": "National Commission for Allied and Healthcare Professions (NCAHP)",
  Paramedic: "National Commission for Allied and Healthcare Professions (NCAHP)",
  "Cardiac Care Technician": "National Commission for Allied and Healthcare Professions (NCAHP)",
  "Respiratory Therapist": "National Commission for Allied and Healthcare Professions (NCAHP)",
  "Occupational Therapist": "National Commission for Allied and Healthcare Professions (NCAHP)",
  "Speech Therapist": "Rehabilitation Council of India (RCI)",
  Optometrist: "National Commission for Allied and Healthcare Professions (NCAHP)",
  Dietitian: "Indian Dietetic Association (RD)",
  Phlebotomist: "Not applicable for my role",
  Audiologist: "Rehabilitation Council of India (RCI)",
  "Dental Hygienist": "Dental Council of India (DCI)",
  "Medical Coder": "Not applicable for my role",
};
export const qualificationsByProfession: Record<string, string[]> = {
  Doctor: ["MBBS", "MD", "MS", "DNB", "DM / MCh", "Diploma (DCH, DGO, DA…)"],
  Nurse: ["ANM", "GNM", "B.Sc Nursing", "Post Basic B.Sc Nursing", "M.Sc Nursing", "Nurse Practitioner (NPCC)"],
  Physiotherapist: ["BPT", "MPT", "Diploma in Physiotherapy", "PhD in Physiotherapy"],
  "Lab Technician": ["DMLT", "B.Sc MLT", "M.Sc MLT", "Certificate in lab technology"],
  Radiographer: ["Diploma in Radiography (DRT / DMRIT)", "B.Sc Radiology & Imaging Technology", "M.Sc Medical Imaging Technology"],
  Pharmacist: ["D.Pharm", "B.Pharm", "Pharm.D", "M.Pharm"],
  "Dialysis Technician": ["Diploma in Dialysis Technology", "B.Sc Renal Dialysis Technology", "M.Sc Dialysis Technology"],
  "OT Technician": ["DOTT / Diploma in OT Technology", "B.Sc OT Technology", "M.Sc OT Technology"],
  "Anaesthesia Technician": ["Diploma in Anaesthesia Technology", "B.Sc Anaesthesia Technology", "M.Sc Anaesthesia Technology"],
  Paramedic: ["EMT certificate", "Diploma in Emergency Medical Technology", "B.Sc Emergency Medical Technology"],
  "Cardiac Care Technician": ["Diploma in Cardiac Care Technology", "B.Sc Cardiac Care Technology", "B.Sc Cardiovascular Technology"],
  "Respiratory Therapist": ["B.Sc Respiratory Therapy", "M.Sc Respiratory Therapy", "Diploma in Respiratory Therapy"],
  "Occupational Therapist": ["BOT", "MOT"],
  "Speech Therapist": ["BASLP", "MASLP", "M.Sc Speech-Language Pathology"],
  Optometrist: ["Diploma in Optometry", "B.Optom", "M.Optom"],
  Dietitian: ["B.Sc Nutrition & Dietetics", "M.Sc Nutrition & Dietetics", "PG Diploma in Dietetics"],
  Phlebotomist: ["Certificate in Phlebotomy", "DMLT"],
  Audiologist: ["BASLP", "M.Sc Audiology", "MASLP"],
  "Dental Hygienist": ["Diploma in Dental Hygiene", "Diploma in Dental Mechanics", "BDS"],
  "Medical Coder": ["B.Sc / M.Sc (life sciences)", "B.Pharm / Pharm.D", "Nursing degree", "Certificate in medical coding"],
};

export const indianStates = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu & Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Other",
];
export const indianCities = [
  "Agra",
  "Ahmedabad",
  "Ahmednagar",
  "Aizawl",
  "Ajmer",
  "Akola",
  "Alappuzha",
  "Aligarh",
  "Allahabad (Prayagraj)",
  "Alwar",
  "Ambala",
  "Amravati",
  "Amritsar",
  "Anand",
  "Anantapur",
  "Asansol",
  "Aurangabad (Chhatrapati Sambhajinagar)",
  "Bareilly",
  "Belagavi (Belgaum)",
  "Ballari (Bellary)",
  "Bengaluru",
  "Bhagalpur",
  "Bhavnagar",
  "Bhilai",
  "Bhopal",
  "Bhubaneswar",
  "Bikaner",
  "Bilaspur",
  "Bokaro",
  "Chandigarh",
  "Chennai",
  "Coimbatore",
  "Cuttack",
  "Darbhanga",
  "Davanagere",
  "Dehradun",
  "Delhi NCR",
  "Dhanbad",
  "Dibrugarh",
  "Dindigul",
  "Durgapur",
  "Erode",
  "Faridabad",
  "Gandhinagar",
  "Gaya",
  "Ghaziabad",
  "Gorakhpur",
  "Gulbarga (Kalaburagi)",
  "Guntur",
  "Gurugram (Gurgaon)",
  "Guwahati",
  "Gwalior",
  "Haldwani",
  "Haridwar",
  "Hubli-Dharwad",
  "Hyderabad",
  "Imphal",
  "Indore",
  "Jabalpur",
  "Jaipur",
  "Jalandhar",
  "Jalgaon",
  "Jammu",
  "Jamnagar",
  "Jamshedpur",
  "Jhansi",
  "Jodhpur",
  "Kakinada",
  "Kannur",
  "Kanpur",
  "Karnal",
  "Karur",
  "Kochi",
  "Kolhapur",
  "Kolkata",
  "Kollam",
  "Kota",
  "Kottayam",
  "Kozhikode",
  "Kurnool",
  "Latur",
  "Lucknow",
  "Ludhiana",
  "Madurai",
  "Malappuram",
  "Mangaluru",
  "Mathura",
  "Meerut",
  "Moradabad",
  "Mumbai",
  "Muzaffarpur",
  "Mysuru",
  "Nagercoil",
  "Nagpur",
  "Nanded",
  "Nashik",
  "Navi Mumbai",
  "Nellore",
  "Noida",
  "Palakkad",
  "Panaji",
  "Patiala",
  "Patna",
  "Puducherry",
  "Pune",
  "Raipur",
  "Rajahmundry",
  "Rajkot",
  "Ranchi",
  "Rohtak",
  "Rourkela",
  "Salem",
  "Shillong",
  "Shimla",
  "Siliguri",
  "Solapur",
  "Srinagar",
  "Surat",
  "Thane",
  "Thanjavur",
  "Thiruvananthapuram",
  "Thrissur",
  "Tiruchirappalli (Trichy)",
  "Tirunelveli",
  "Tirupati",
  "Tirupur",
  "Udaipur",
  "Udupi",
  "Ujjain",
  "Vadodara",
  "Varanasi",
  "Vellore",
  "Vijayawada",
  "Visakhapatnam",
  "Warangal",
];

export function neededDocs(portal: "candidate" | "facility", role?: string, level?: string): { label: string; hint: string }[] {
  if (portal === "facility")
    return [
      { label: "Facility registration / licence", hint: "Clinical establishment certificate or equivalent" },
      { label: "GST certificate (if applicable)", hint: "Supporting evidence" },
      { label: "Representative authorization", hint: "Letter on company letterhead" },
    ];
  if (level === "student") {
    return [
      { label: "College ID card / Bonafide proof", hint: "Proof of active healthcare study or internship (KMC/KNC/College ID)" },
      { label: "Identity proof", hint: "Aadhaar, PAN, Passport or Voter ID — kept private" },
      { label: "Resume / CV (optional)", hint: "For hospital internship applications" },
    ];
  }
  const base = [
    { label: "Resume / CV", hint: "Shown to employers when you apply" },
    { label: "Identity proof", hint: "Aadhaar, PAN, Passport or Voter ID — kept private" },
    { label: "Highest qualification certificate", hint: "Degree or diploma certificate" },
  ];
  if (role && !nonRegulatedProfessions.includes(role))
    base.push({ label: "Professional registration", hint: "State council registration certificate" });
  return base;
}

export const departmentsByProfession: Record<string, string[]> = {
  Doctor: [
    "General medicine",
    "Emergency medicine",
    "ICU / critical care",
    "General surgery",
    "Paediatrics",
    "Obstetrics & gynaecology",
    "Orthopaedics",
    "Anaesthesiology",
    "Radiology",
    "Cardiology",
    "Duty medical officer",
  ],
  Nurse: [
    "ICU & critical care",
    "Emergency",
    "Operation theatre",
    "Inpatient wards",
    "NICU / PICU",
    "Dialysis unit",
    "Cardiac care",
    "Oncology",
    "Paediatrics",
    "Labour room & maternity",
    "Home care",
  ],
  Physiotherapist: [
    "Orthopaedic rehab",
    "Neuro rehab",
    "Cardio-pulmonary",
    "Sports physio",
    "Paediatric physio",
    "ICU physio",
    "Home care",
    "Geriatric care",
  ],
  "Lab Technician": [
    "Pathology",
    "Biochemistry",
    "Microbiology",
    "Haematology",
    "Blood bank",
    "Histopathology",
    "Molecular / PCR",
  ],
  Radiographer: [
    "X-ray",
    "CT",
    "MRI",
    "Ultrasound support",
    "Cath lab",
    "Mammography",
    "Nuclear medicine",
  ],
  Pharmacist: [
    "Hospital pharmacy",
    "Retail pharmacy",
    "Clinical pharmacy",
    "IP pharmacy",
    "Stores & inventory",
  ],
  "Dialysis Technician": [
    "Haemodialysis",
    "Peritoneal dialysis",
    "ICU dialysis",
    "Home dialysis",
  ],
  "OT Technician": [
    "General OT",
    "Cardiac OT",
    "Neuro OT",
    "Ortho OT",
    "Laparoscopy",
    "CSSD",
  ],
  "Anaesthesia Technician": [
    "Main OT",
    "Cardiac OT",
    "ICU",
    "Day-care surgery",
  ],
  Paramedic: [
    "Ambulance / EMS",
    "Emergency",
    "Event medical cover",
    "Industrial health",
  ],
  "Cardiac Care Technician": [
    "Cath lab",
    "ECG & echo",
    "Cardiac ICU",
    "TMT & Holter",
  ],
  "Respiratory Therapist": [
    "ICU",
    "NICU / PICU",
    "Pulmonology",
    "Sleep lab",
  ],
  "Occupational Therapist": [
    "Child development",
    "Neuro rehab",
    "Mental health",
    "Hand therapy",
    "Geriatric care",
  ],
  "Speech Therapist": [
    "Paediatric speech",
    "Adult neuro",
    "ENT",
    "Swallowing / dysphagia",
  ],
  Optometrist: [
    "Eye hospital OPD",
    "Retail optical",
    "Contact lens clinic",
    "Low vision",
  ],
  Dietitian: [
    "Clinical nutrition",
    "ICU nutrition",
    "Diabetes & renal diets",
    "Paediatric nutrition",
    "Food service",
  ],
  Phlebotomist: [
    "Hospital lab",
    "Collection centre",
    "Home collection",
  ],
  Audiologist: [
    "ENT",
    "Hearing aid centre",
    "Paediatric audiology",
  ],
  "Dental Hygienist": [
    "Dental clinic",
    "Hospital dental unit",
    "Orthodontics",
  ],
  "Medical Coder": [
    "Inpatient coding",
    "Outpatient coding",
    "Billing & RCM",
    "Insurance / TPA",
  ],
};

export const skillsByProfession: Record<string, string[]> = {
  Doctor: [
    "Patient assessment",
    "Emergency care",
    "ICU management",
    "Ward rounds",
    "Minor procedures",
    "Prescribing",
    "Night duty",
    "Teleconsultation",
    "Discharge summaries",
  ],
  Nurse: [
    "Patient care",
    "IV cannulation",
    "Medication administration",
    "Wound care",
    "Ventilator care",
    "Catheterisation",
    "Vitals monitoring",
    "Charting & documentation",
    "Infection control",
    "Patient education",
  ],
  Physiotherapist: [
    "Manual therapy",
    "Exercise therapy",
    "Electrotherapy",
    "Gait training",
    "Chest physiotherapy",
    "Post-op rehab",
    "Dry needling",
    "Kinesio taping",
  ],
  "Lab Technician": [
    "Sample collection",
    "Phlebotomy",
    "Haematology analysers",
    "Biochemistry analysers",
    "Culture & sensitivity",
    "Blood grouping",
    "Quality control",
    "LIS reporting",
  ],
  Radiographer: [
    "X-ray positioning",
    "CT scanning",
    "MRI scanning",
    "Contrast studies",
    "PACS / RIS",
    "Radiation safety",
    "Portable X-ray",
  ],
  Pharmacist: [
    "Dispensing",
    "Prescription review",
    "Inventory management",
    "Drug information",
    "Narcotics register",
    "Pharmacy software",
    "Patient counselling",
  ],
  "Dialysis Technician": [
    "Machine setup",
    "AV fistula cannulation",
    "Patient monitoring",
    "Dialyser reprocessing",
    "Water treatment checks",
    "CRRT support",
  ],
  "OT Technician": [
    "OT setup",
    "Instrument sterilisation",
    "Scrubbing",
    "Laparoscopy equipment",
    "Patient positioning",
    "C-arm handling",
  ],
  "Anaesthesia Technician": [
    "Anaesthesia machine checks",
    "Airway equipment",
    "Patient monitoring",
    "Drug preparation",
    "Intubation assistance",
    "Recovery room care",
  ],
  Paramedic: [
    "Basic life support",
    "Trauma care",
    "Patient transport",
    "Oxygen therapy",
    "Splinting",
    "Triage",
  ],
  "Cardiac Care Technician": [
    "ECG",
    "Echo assistance",
    "TMT",
    "Holter monitoring",
    "Cath lab assistance",
    "Defibrillator use",
  ],
  "Respiratory Therapist": [
    "Ventilator management",
    "ABG analysis",
    "Oxygen therapy",
    "Airway management",
    "Nebulisation",
    "Pulmonary function tests",
  ],
  "Occupational Therapist": [
    "ADL training",
    "Sensory integration",
    "Splinting",
    "Cognitive rehab",
    "Assistive devices",
  ],
  "Speech Therapist": [
    "Speech assessment",
    "Language therapy",
    "Dysphagia management",
    "Voice therapy",
    "Fluency therapy",
  ],
  Optometrist: [
    "Refraction",
    "Slit lamp",
    "Contact lens fitting",
    "Visual field testing",
    "OCT & fundus imaging",
  ],
  Dietitian: [
    "Diet planning",
    "Nutrition assessment",
    "Enteral feeding plans",
    "Diabetes counselling",
    "Renal diets",
  ],
  Phlebotomist: [
    "Venipuncture",
    "Paediatric draws",
    "Sample labelling",
    "Cold chain",
    "Home collection",
  ],
  Audiologist: [
    "Pure tone audiometry",
    "BERA / OAE",
    "Hearing aid fitting",
    "Tympanometry",
  ],
  "Dental Hygienist": [
    "Scaling & polishing",
    "Chairside assistance",
    "Sterilisation",
    "Dental X-ray",
    "Patient education",
  ],
  "Medical Coder": [
    "ICD-10-CM",
    "CPT",
    "HCPCS",
    "Medical terminology",
    "Denial management",
    "EHR software",
  ],
};

export const specialtyPlaceholders: Record<string, string> = {
  Doctor: "e.g. General medicine, Emergency medicine, Cardiology",
  Nurse: "e.g. ICU & critical care, Emergency, Operation theatre",
  Physiotherapist: "e.g. Orthopaedic rehab, Neuro rehab, Sports physio",
  "Lab Technician": "e.g. Pathology, Biochemistry, Microbiology",
  Radiographer: "e.g. X-ray, CT, MRI, Cath lab",
  Pharmacist: "e.g. Hospital pharmacy, Clinical pharmacy, Stores & inventory",
  "Dialysis Technician": "e.g. Haemodialysis, Peritoneal dialysis, ICU dialysis",
  "OT Technician": "e.g. General OT, Cardiac OT, Neuro OT, CSSD",
  "Anaesthesia Technician": "e.g. Main OT, Cardiac OT, ICU",
  Paramedic: "e.g. Ambulance / EMS, Emergency",
  "Cardiac Care Technician": "e.g. Cath lab, ECG & echo, Cardiac ICU",
  "Respiratory Therapist": "e.g. ICU, NICU / PICU, Pulmonology",
  "Occupational Therapist": "e.g. Child development, Neuro rehab",
  "Speech Therapist": "e.g. Paediatric speech, Adult neuro, Swallowing / dysphagia",
  Optometrist: "e.g. Eye hospital OPD, Contact lens clinic",
  Dietitian: "e.g. Clinical nutrition, ICU nutrition, Diabetes diets",
  Phlebotomist: "e.g. Hospital lab, Collection centre",
  Audiologist: "e.g. ENT, Hearing aid centre",
  "Dental Hygienist": "e.g. Dental clinic, Hospital dental unit",
  "Medical Coder": "e.g. Inpatient coding, Billing & RCM",
};

export const councilPlaceholders: Record<string, string> = {
  Doctor: "e.g. Karnataka Medical Council / NMC",
  Nurse: "e.g. Karnataka State Nursing Council",
  Pharmacist: "e.g. Karnataka State Pharmacy Council",
  "Dental Hygienist": "e.g. Dental Council (State)",
  "Speech Therapist": "e.g. Rehabilitation Council of India",
  Audiologist: "e.g. Rehabilitation Council of India",
  Dietitian: "e.g. Indian Dietetic Association (RD)",
  default: "e.g. Karnataka State Allied & Healthcare Council",
};

export const regNoPlaceholders: Record<string, string> = {
  Doctor: "e.g. KMC 123456",
  Nurse: "e.g. KNC 45678 or your NUID",
  default: "As printed on your certificate / registration",
};

export const qualificationPlaceholders: Record<string, string> = {
  Doctor: "e.g. MBBS, MD, MS, DNB",
  Nurse: "e.g. B.Sc Nursing, GNM, Post Basic B.Sc, M.Sc",
  Physiotherapist: "e.g. BPT, MPT",
  "Lab Technician": "e.g. DMLT, B.Sc MLT",
  Radiographer: "e.g. B.Sc Radiology & Imaging Technology, DRT",
  Pharmacist: "e.g. B.Pharm, Pharm.D, D.Pharm",
  "Dialysis Technician": "e.g. B.Sc Renal Dialysis Technology",
  "OT Technician": "e.g. DOTT / B.Sc OT Technology",
  "Dental Hygienist": "e.g. Diploma in Dental Hygiene, BDS",
  "Medical Coder": "e.g. B.Sc (Life Sciences), Certificate in Medical Coding",
};

export const designationPlaceholders: Record<string, string> = {
  Doctor: "e.g. Duty Medical Officer",
  Nurse: "e.g. Staff Nurse",
  Physiotherapist: "e.g. Physiotherapist",
  "Lab Technician": "e.g. Lab Technician",
  Radiographer: "e.g. Radiographer",
  Pharmacist: "e.g. Pharmacist",
  "Dialysis Technician": "e.g. Dialysis Technician",
  "OT Technician": "e.g. OT Technician",
  "Anaesthesia Technician": "e.g. Anaesthesia Technician",
  Paramedic: "e.g. Paramedic",
  "Cardiac Care Technician": "e.g. Cardiac Care Technician",
  "Respiratory Therapist": "e.g. Respiratory Therapist",
  "Occupational Therapist": "e.g. Occupational Therapist",
  "Speech Therapist": "e.g. Speech Therapist",
  Optometrist: "e.g. Optometrist",
  Dietitian: "e.g. Dietitian",
  Phlebotomist: "e.g. Phlebotomist",
  Audiologist: "e.g. Audiologist",
  "Dental Hygienist": "e.g. Dental Hygienist",
  "Medical Coder": "e.g. Medical Coder",
};

// ══════════════════════════════════════════════════════════════════════
// HUDDLE COMMUNITY & CLINICAL MENTORSHIP
// ══════════════════════════════════════════════════════════════════════

export type HuddlePostType = "Thought" | "Experience" | "Case" | "Question" | "Update" | "Event";
export type HuddleField = "All" | "Physio" | "Nursing" | "Lab" | "Radiology" | "Pharmacy" | "Medicine";

export interface HuddleReply {
  id: string;
  authorId: string;
  authorName: string;
  authorShort: string;
  authorRole: string;
  authorLevel?: "student" | "fresher" | "professional";
  text: string;
  at: string;
  helpfulCount?: number;
}

export interface HuddlePost {
  id: string;
  type: HuddlePostType;
  field: HuddleField;
  authorId: string;
  authorName: string;
  authorShort: string;
  authorRole: string;
  authorLevel: "student" | "fresher" | "professional" | "hospital";
  isMentor?: boolean;
  mentorYrs?: number;
  time?: string;
  date?: string;
  anon: boolean;
  text: string;
  helpfulCount: number;
  userHelpful?: boolean;
  replies: HuddleReply[];
  reports: string[];
  status: "live" | "review" | "hidden";
  at: string;
  image?: string;
  audioUrl?: string;
  audioDuration?: number;
  isHospital?: boolean;
  hospitalName?: string;
  pinned?: boolean;
  warningIssued?: string;
  moderationNotes?: string;
}

export interface ClinicalMentor {
  id: string;
  name: string;
  role: string;
  org: string;
  yrs: number;
  answersCount: number;
  specialties: string[];
  verified: boolean;
  email?: string;
  phone?: string;
}

export interface HuddleMentorAnswer {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorShort: string;
  mentorRole: string;
  mentorYrs: number;
  mentorSpecialty: string;
  text: string;
  at: string;
  sample?: boolean;
}

export interface HuddleQuestion {
  id: string;
  topic: "Career" | "Clinical skill" | "Exams" | "Interview" | "Workplace";
  askerId: string;
  askerName: string;
  askerShort: string;
  askerLevel: "student" | "fresher" | "professional";
  askerProfession?: string;
  text: string;
  answers: HuddleMentorAnswer[];
  at: string;
}

export interface HuddleSession {
  id: string;
  title: string;
  category: "CME & Workshop" | "Clinical Talk" | "Interview Masterclass" | "Department Round";
  hostType: "mentor" | "hospital";
  hostName: string;
  hostSub: string;
  when: string; // ISO date string
  where: string;
  seats: number;
  bookedCount: number;
  isBooked?: boolean;
  description: string;
  forRoles: string[];
}

export interface SafetyCheckResult {
  st: "ok" | "empty" | "block" | "hire";
  why: string;
}

export const SAFE_RX = {
  patient: /\b(bed|file|ip|uhid|mrd)\s*(no\.?|number|#)\s*[:#-]?\s*\d+|\b(uhid|mrd)\s*[:#-]?\s*\d+|patient\s*name\s*[:-]|\b(mr|mrs)\.?\s+[A-Z][a-z]+/i,
  contact: /[\w.+-]+@[\w-]+\.[a-z]{2,}|(\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}\b|wa\.me|t\.me\/|whats\s?app\s*(me|on|no|number)|telegram/i,
  hireStrong: /\b(we('| a)re hiring|hiring now|vacanc(y|ies)|walk-?in( interview)?|send (your )?(cv|resume)|join our team|apply now|urgent requirement|dm (me|us) for (a )?(job|opening))/i,
  hireWeak: /\b(hiring|openings?|salary|ctc|stipend)\b/i,
};

export function safetyCheck(text: string, isHosp: boolean = false): SafetyCheckResult {
  if (!String(text || "").trim()) {
    return { st: "empty", why: "Type something to share with the community." };
  }
  if (SAFE_RX.patient.test(text)) {
    return {
      st: "block",
      why: "Looks like a patient detail (bed, file, UHID number or a patient's name). Remove it to keep Huddle strictly de-identified.",
    };
  }
  if (SAFE_RX.contact.test(text)) {
    return {
      st: "block",
      why: "Phone numbers, emails, WhatsApp links and off-platform solicitations are blocked to prevent spam & protect member safety.",
    };
  }
  if (SAFE_RX.hireStrong.test(text) || (isHosp && SAFE_RX.hireWeak.test(text))) {
    return {
      st: "hire",
      why: isHosp
        ? "Direct hiring posts aren't allowed in Huddle. Post requirements through FALE Post a Job so our matching algorithm sends you verified people."
        : "This looks like a job advertisement or broker solicitation. Huddle is a clinical peer forum, not a recruiter board.",
    };
  }
  return {
    st: "ok",
    why: "Looks clean! No patient identifiers, contact solicitations, or recruiter spam.",
  };
}

export const initialHuddlePosts: HuddlePost[] = [];

export const initialHuddleQuestions: HuddleQuestion[] = [];

export const initialHuddleSessions: HuddleSession[] = [];

export const clinicalMentors = [];
