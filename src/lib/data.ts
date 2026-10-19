export interface Job {
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
}

export const jobs: Job[] = [
  {
    id: "j1",
    title: "Staff Nurse — ICU",
    org: "Apollo Hospitals",
    city: "Chennai",
    salary: "₹35,000 – ₹48,000",
    exp: "2–5 yrs",
    type: "Full-time",
    shift: "Rotational",
    posted: "2 days ago",
    tags: ["GNM / B.Sc Nursing", "ICU", "BLS"],
    match: 94,
    urgent: true,
    dept: "ICU & Critical Care",
    qualification: "GNM / B.Sc Nursing",
    perks: ["Hostel provided", "Health Insurance", "PF & Gratuity"],
    accredited: true,
  },
  {
    id: "j2",
    title: "Physiotherapist",
    org: "Manipal Hospitals",
    city: "Bengaluru",
    salary: "₹40,000 – ₹55,000",
    exp: "1–3 yrs",
    type: "Full-time",
    shift: "Day",
    posted: "1 day ago",
    tags: ["BPT / MPT", "Ortho rehab"],
    match: 89,
    dept: "Physiotherapy & Rehab",
    qualification: "BPT / MPT",
    perks: ["Health Insurance", "PF & Gratuity"],
    accredited: true,
  },
  {
    id: "j3",
    title: "Medical Lab Technician",
    org: "Metropolis Healthcare",
    city: "Mumbai",
    salary: "₹22,000 – ₹30,000",
    exp: "0–2 yrs",
    type: "Full-time",
    shift: "Morning",
    posted: "Today",
    tags: ["DMLT / BMLT", "Haematology"],
    match: 82,
    dept: "Diagnostics & Pathology",
    qualification: "DMLT / B.Sc MLT",
    perks: ["PF & Gratuity"],
    accredited: true,
  },
  {
    id: "j4",
    title: "Clinical Pharmacist",
    org: "Fortis Healthcare",
    city: "Delhi NCR",
    salary: "₹45,000 – ₹60,000",
    exp: "3–6 yrs",
    type: "Full-time",
    shift: "Day",
    posted: "4 days ago",
    tags: ["Pharm.D", "Inpatient"],
    match: 78,
    dept: "Pharmacy",
    qualification: "B.Pharm / Pharm.D",
    perks: ["Health Insurance", "PF & Gratuity"],
    accredited: true,
  },
  {
    id: "j5",
    title: "Radiology Technologist",
    org: "Aster CMI",
    city: "Bengaluru",
    salary: "₹30,000 – ₹42,000",
    exp: "2–4 yrs",
    type: "Contract",
    shift: "Rotational",
    posted: "3 days ago",
    tags: ["CT / MRI", "AERB"],
    match: 74,
    dept: "Radiology & Imaging",
    qualification: "Medical Diploma / Cert",
    perks: ["Transport / Cab"],
    accredited: true,
  },
  {
    id: "j6",
    title: "Dental Surgeon",
    org: "Clove Dental",
    city: "Hyderabad",
    salary: "₹50,000 – ₹75,000",
    exp: "1–4 yrs",
    type: "Full-time",
    shift: "Day",
    posted: "1 week ago",
    tags: ["BDS / MDS", "Endodontics"],
    match: 70,
    dept: "Dental Surgery",
    qualification: "BDS / MDS",
    perks: ["Health Insurance"],
    accredited: false,
  },
  {
    id: "j7",
    title: "OT Technician",
    org: "KIMS Hospitals",
    city: "Hyderabad",
    salary: "₹20,000 – ₹28,000",
    exp: "0–2 yrs",
    type: "Full-time",
    shift: "Rotational",
    posted: "Today",
    tags: ["OT Tech diploma"],
    match: 68,
    urgent: true,
    dept: "Operation Theatre (OT)",
    qualification: "Medical Diploma / Cert",
    perks: ["Hostel provided", "PF & Gratuity"],
    accredited: true,
  },
  {
    id: "j8",
    title: "Hospital Front Office Executive",
    org: "Narayana Health",
    city: "Kolkata",
    salary: "₹18,000 – ₹25,000",
    exp: "0–3 yrs",
    type: "Full-time",
    shift: "Day",
    posted: "5 days ago",
    tags: ["Graduate", "Patient care"],
    match: 64,
    dept: "Inpatient / Ward",
    qualification: "Graduate / Diploma",
    perks: ["PF & Gratuity"],
    accredited: true,
  },
  {
    id: "j9",
    title: "Senior Resident — Emergency Medicine",
    org: "Max Healthcare",
    city: "Delhi NCR",
    salary: "₹85,000 – ₹1,10,000",
    exp: "3–5 yrs",
    type: "Full-time",
    shift: "Rotational",
    posted: "1 day ago",
    tags: ["MBBS / MD", "ACLS / ATLS", "Trauma Care"],
    match: 96,
    urgent: true,
    dept: "Emergency / Trauma",
    qualification: "MBBS / MD / Specialist",
    perks: ["Hostel provided", "Health Insurance", "PF & Gratuity"],
    accredited: true,
  },
  {
    id: "j10",
    title: "Dialysis Technician",
    org: "Apollo Hospitals",
    city: "Hyderabad",
    salary: "₹25,000 – ₹34,000",
    exp: "1–3 yrs",
    type: "Full-time",
    shift: "Morning",
    posted: "2 days ago",
    tags: ["Dialysis Diploma", "Nephrology"],
    match: 86,
    dept: "Diagnostics & Pathology",
    qualification: "Medical Diploma / Cert",
    perks: ["PF & Gratuity", "Transport / Cab"],
    accredited: true,
  },
  {
    id: "j11",
    title: "Night Duty Inpatient Nurse",
    org: "Fortis Healthcare",
    city: "Mumbai",
    salary: "₹38,000 – ₹50,000",
    exp: "2–5 yrs",
    type: "Contract",
    shift: "Night",
    posted: "Today",
    tags: ["B.Sc Nursing", "Inpatient", "IV Cannulation"],
    match: 91,
    urgent: true,
    dept: "Inpatient / Ward",
    qualification: "GNM / B.Sc Nursing",
    perks: ["Hostel provided", "Health Insurance"],
    accredited: true,
  },
  {
    id: "j12",
    title: "Cath Lab Nurse Specialist",
    org: "Manipal Hospitals",
    city: "Chennai",
    salary: "₹42,000 – ₹58,000",
    exp: "3–6 yrs",
    type: "Full-time",
    shift: "Day",
    posted: "3 days ago",
    tags: ["Cardiac ICU", "Angioplasty", "BLS"],
    match: 93,
    dept: "ICU & Critical Care",
    qualification: "GNM / B.Sc Nursing",
    perks: ["Health Insurance", "PF & Gratuity"],
    accredited: true,
  },
  {
    id: "j13",
    title: "Senior Biochemist / Lab In-Charge",
    org: "Metropolis Healthcare",
    city: "Chennai",
    salary: "₹55,000 – ₹72,000",
    exp: "5+ yrs",
    type: "Full-time",
    shift: "Day",
    posted: "4 days ago",
    tags: ["M.Sc / Ph.D Biochemistry", "NABL Audit"],
    match: 85,
    dept: "Diagnostics & Pathology",
    qualification: "MBBS / MD / Specialist",
    perks: ["Health Insurance", "PF & Gratuity"],
    accredited: true,
  },
  {
    id: "j14",
    title: "Pediatric Ward Nurse",
    org: "Aster CMI",
    city: "Bengaluru",
    salary: "₹32,000 – ₹44,000",
    exp: "1–3 yrs",
    type: "Full-time",
    shift: "Rotational",
    posted: "5 days ago",
    tags: ["GNM / B.Sc Nursing", "PALS", "NICU"],
    match: 88,
    dept: "Inpatient / Ward",
    qualification: "GNM / B.Sc Nursing",
    perks: ["Hostel provided", "Health Insurance"],
    accredited: true,
  },
  {
    id: "j15",
    title: "MRI / CT Senior Radiographer",
    org: "Max Healthcare",
    city: "Delhi NCR",
    salary: "₹48,000 – ₹65,000",
    exp: "4–7 yrs",
    type: "Full-time",
    shift: "Rotational",
    posted: "6 days ago",
    tags: ["B.Sc Radiography", "3T MRI", "128 Slice CT"],
    match: 80,
    urgent: true,
    dept: "Radiology & Imaging",
    qualification: "Medical Diploma / Cert",
    perks: ["Transport / Cab", "PF & Gratuity"],
    accredited: true,
  },
];

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

export const shifts: Shift[] = [
  {
    id: "s1",
    title: "Night Staff Nurse",
    org: "Apollo Hospitals",
    city: "Chennai",
    date: "Mon, 19 Oct",
    time: "20:00 – 08:00",
    hours: 12,
    rate: 350,
    dept: "Emergency",
    urgent: true,
    surge: "+₹50/hr Night Surge",
    perks: ["Dinner provided", "Cab drop"],
    verified: true,
  },
  {
    id: "s2",
    title: "Phlebotomist",
    org: "Metropolis Healthcare",
    city: "Mumbai",
    date: "Tue, 20 Oct",
    time: "07:00 – 13:00",
    hours: 6,
    rate: 250,
    dept: "Sample collection",
    perks: ["Fuel allowance"],
    verified: true,
  },
  {
    id: "s3",
    title: "ICU Nurse (Cover)",
    org: "MIOT International",
    city: "Chennai",
    date: "Wed, 21 Oct",
    time: "08:00 – 16:00",
    hours: 8,
    rate: 400,
    dept: "Critical care",
    urgent: true,
    surge: "Critical shortage cover",
    perks: ["Lunch included"],
    verified: true,
  },
  {
    id: "s4",
    title: "Pharmacy Assistant",
    org: "MedPlus",
    city: "Hyderabad",
    date: "Sat, 24 Oct",
    time: "10:00 – 18:00",
    hours: 8,
    rate: 200,
    dept: "Retail pharmacy",
    verified: true,
  },
  {
    id: "s5",
    title: "Emergency Room Medical Officer",
    org: "Fortis Healthcare",
    city: "Bengaluru",
    date: "Thu, 22 Oct",
    time: "14:00 – 22:00",
    hours: 8,
    rate: 850,
    dept: "Emergency & Trauma",
    urgent: true,
    surge: "Surge pay rate",
    perks: ["Meals provided", "ACLS support"],
    verified: true,
  },
  {
    id: "s6",
    title: "Dialysis Technician",
    org: "Manipal Hospitals",
    city: "Bengaluru",
    date: "Fri, 23 Oct",
    time: "06:00 – 14:00",
    hours: 8,
    rate: 320,
    dept: "Nephrology",
    perks: ["Breakfast provided"],
    verified: true,
  },
  {
    id: "s7",
    title: "OT Scrub Nurse",
    org: "Aster CMI",
    city: "Bengaluru",
    date: "Sat, 24 Oct",
    time: "08:00 – 16:00",
    hours: 8,
    rate: 450,
    dept: "Operation Theatre",
    urgent: true,
    perks: ["Scrub kit provided", "Lunch included"],
    verified: true,
  },
  {
    id: "s8",
    title: "Radiology Tech (CT Cover)",
    org: "Max Healthcare",
    city: "Delhi NCR",
    date: "Sun, 25 Oct",
    time: "09:00 – 18:00",
    hours: 9,
    rate: 380,
    dept: "Radiology & Imaging",
    perks: ["Transport provided"],
    verified: true,
  },
];

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
  category: "Critical Care" | "Emergency & Trauma" | "Infection Control" | "Nursing Essentials" | "Quality & NABH" | "Pharmacology";
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

export const courses: Course[] = [
  {
    id: "c1",
    title: "Advanced Cardiac Life Support (ACLS) & Resuscitation",
    provider: "FALE Clinical Academy",
    category: "Critical Care",
    duration: "6 weeks",
    level: "Intermediate",
    cmeCredits: 4.5,
    rating: 4.9,
    reviewsCount: 1480,
    enrolledCount: 3420,
    accreditedBy: "AHA Guidelines Aligned & Indian Resuscitation Council",
    accreditationBadge: "AHA Aligned • 4.5 CME",
    summary: "Master emergency cardiac algorithms, high-quality chest compressions, shockable rhythm defibrillation, and pharmacological dosing.",
    overview: "This intensive simulation-driven course prepares bedside nurses and duty medical officers to lead and assist in adult cardiac arrest resuscitation. Developed with Apollo and Fortis senior cardiologists, it emphasizes rapid recognition of pulseless electrical activity (PEA), ventricular fibrillation, and structured post-resuscitation targeted temperature management.",
    targetAudience: "ICU Staff Nurses, Emergency Room Medical Officers, OT Technicians, and Critical Care Trainees.",
    skillsGained: ["ECG Rhythm Interpretation", "Biphasic Defibrillation & Synchronized Cardioversion", "IV/IO Drug Administration", "Bag-Valve-Mask Ventilation", "ROSC Care"],
    whatYouWillLearn: [
      "Systematic Primary & Secondary Resuscitation Surveys",
      "Immediate distinction between Shockable (VF/pVT) and Non-Shockable (Asystole/PEA) rhythms",
      "Exact dosing protocols for Epinephrine (1mg q3-5m) and Amiodarone (300mg / 150mg)",
      "High-performance team communication during active 'Code Blue' calls",
      "Management of post-cardiac arrest syndrome and hemodynamic stabilization"
    ],
    instructor: {
      name: "Dr. Arvind Radhakrishnan",
      role: "Director of Critical Care & Cardiology",
      hospital: "Apollo Hospitals, Chennai",
      avatarInitials: "AR",
      bio: "22+ years in clinical cardiology and emergency medicine. Former AHA regional instructor with over 4,000 clinicians trained in advanced resuscitation."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: High-Performance BLS & Team Dynamics",
        duration: "1h 45m",
        lessons: [
          { id: "l1_1", title: "1.1 High-Quality CPR: Depth, Recoil & Rate Metrics", duration: "18m", type: "video" },
          { id: "l1_2", title: "1.2 Closed-Loop Communication in Code Blue Teams", duration: "24m", type: "video" },
          { id: "l1_3", title: "1.3 Interactive Case: Adult Sudden Collapse in Ward", duration: "20m", type: "interactive_case" },
          { id: "l1_4", title: "1.4 Knowledge Check: CPR Metrics & AED Application", duration: "10m", type: "quiz" },
        ],
      },
      {
        id: "m2",
        title: "Module 2: Cardiac Dysrhythmias & Defibrillation",
        duration: "2h 30m",
        lessons: [
          { id: "l2_1", title: "2.1 Rapid ECG Analysis: VT, VF, Asystole & PEA", duration: "32m", type: "video" },
          { id: "l2_2", title: "2.2 Biphasic Manual Defibrillation Safety Protocols", duration: "26m", type: "video" },
          { id: "l2_3", title: "2.3 Transcutaneous Pacing & Synchronized Cardioversion", duration: "35m", type: "video" },
          { id: "l2_4", title: "2.4 Interactive Simulator: Rhythm Recognition Drill", duration: "25m", type: "interactive_case" },
        ],
      },
      {
        id: "m3",
        title: "Module 3: Pharmacological Interventions & Airway",
        duration: "2h 15m",
        lessons: [
          { id: "l3_1", title: "3.1 Epinephrine, Amiodarone & Lidocaine Timing", duration: "28m", type: "video" },
          { id: "l3_2", title: "3.2 Reversible Causes: The 5 H's and 5 T's Checklist", duration: "30m", type: "reading" },
          { id: "l3_3", title: "3.3 Advanced Supraglottic Airway vs Endotracheal Tube", duration: "25m", type: "video" },
          { id: "l3_4", title: "3.4 Medication Dosage Calculation Quiz", duration: "15m", type: "quiz" },
        ],
      },
      {
        id: "m4",
        title: "Module 4: Post-Resuscitation Care (ROSC)",
        duration: "1h 50m",
        lessons: [
          { id: "l4_1", title: "4.1 Hemodynamic Goals: Mean Arterial Pressure & Fluids", duration: "25m", type: "video" },
          { id: "l4_2", title: "4.2 Targeted Temperature Management (TTM) Protocols", duration: "22m", type: "video" },
          { id: "l4_3", title: "4.3 Comprehensive Final Clinical Exam", duration: "35m", type: "quiz" },
        ],
      },
    ],
    clinicalScenario: {
      title: "Sudden Monitored Collapse in 58M Post-CABG",
      caseDescription: "A 58-year-old male on Post-Operative Day 2 suddenly loses consciousness. Telemetry displays rapid polymorphic ventricular tachycardia. You confirm the patient is unresponsive, apnoeic, and carotid pulse is not palpable. Code Blue is sounded and the defibrillator arrives at bedside.",
      patientVitals: {
        hr: "215 bpm",
        bp: "Unrecordable",
        spo2: "62%",
        rhythm: "Pulseless VT / Ventricular Fibrillation",
      },
      prompt: "What is the single most critical immediate step in accordance with standard ACLS guidelines?",
      options: [
        {
          id: "opt_1",
          text: "Administer 1 mg Epinephrine IV push before attempting rhythm conversion",
          isCorrect: false,
          explanation: "Incorrect. In shockable rhythms (VF/pVT), immediate defibrillation takes absolute priority. Epinephrine is administered only after the 2nd shock."
        },
        {
          id: "opt_2",
          text: "Charge defibrillator to 200J (biphasic), clear all staff, and deliver unsynchronized shock immediately",
          isCorrect: true,
          explanation: "Correct! Pulseless VT is a shockable rhythm. Every minute of delay reduces survival by 7–10%. High-quality CPR is continued until the shock is charged, and resumed immediately after delivery."
        },
        {
          id: "opt_3",
          text: "Perform synchronized cardioversion at 50 Joules with sedation",
          isCorrect: false,
          explanation: "Incorrect. Synchronized cardioversion is for hemodynamically unstable patients WITH a pulse. This patient has NO pulse; unsynchronized defibrillation is required."
        },
        {
          id: "opt_4",
          text: "Intubate the patient with an endotracheal tube before defibrillating",
          isCorrect: false,
          explanation: "Incorrect. Airway management must never delay immediate defibrillation or interrupt chest compressions."
        },
      ],
    },
    certificateDetails: {
      credentialCode: "FALE-ACLS-2026-CERT",
      validity: "2 Years (Renewable)",
      recognizedHospitals: ["Apollo Hospitals", "Fortis Healthcare", "Manipal Hospitals", "Max Healthcare"],
    },
    featured: true,
  },
  {
    id: "c2",
    title: "Hospital Infection Prevention & Control (NABH 5th Edition)",
    provider: "FALE Clinical Academy",
    category: "Quality & NABH",
    duration: "3 weeks",
    level: "Beginner",
    cmeCredits: 2.5,
    rating: 4.8,
    reviewsCount: 890,
    enrolledCount: 2150,
    accreditedBy: "NABH Standard 5th Edition & WHO Patient Safety",
    accreditationBadge: "NABH 5th Ed • 2.5 CME",
    summary: "Practical hospital infection control: CLABSI, CAUTI, VAP prevention bundles, surgical site sterility, and biomedical waste sorting.",
    overview: "Infection prevention is the cornerstone of NABH hospital accreditation and patient survival. This course breaks down international evidence-based prevention bundles into simple bedside workflows for ward and ICU nurses.",
    targetAudience: "Staff Nurses, OT Scrub Nurses, Dialysis Technicians, and Infection Control Link Nurses.",
    skillsGained: ["Aseptic Non-Touch Technique (ANTT)", "CLABSI/CAUTI Care Bundles", "Biomedical Waste (BMW) Color Coding", "Needlestick PEP Protocols", "Sterilization Monitoring"],
    whatYouWillLearn: [
      "The 5 Moments of Hand Hygiene according to WHO guidelines",
      "Sterile insertion & daily maintenance bundles for central venous catheters",
      "Biomedical waste management rules and color segregation (Yellow, Red, Blue, White)",
      "Post-exposure prophylaxis (PEP) step-by-step for sharps and mucosal spills",
      "Disinfection standards for high-touch surfaces in ICUs and isolation wards"
    ],
    instructor: {
      name: "Sr. Grace Kurian",
      role: "Lead Infection Control Officer",
      hospital: "Manipal Hospitals, Bengaluru",
      avatarInitials: "GK",
      bio: "M.Sc Nursing with 18 years leading hospital-wide NABH accreditation audits and clinical nursing infection surveillance."
    },
    modules: [
      {
        id: "m2_1",
        title: "Module 1: Fundamentals of Hospital Epidemiology",
        duration: "1h 15m",
        lessons: [
          { id: "l2_1_1", title: "1.1 Chain of Infection & Hospital-Acquired Infections (HAI)", duration: "20m", type: "video" },
          { id: "l2_1_2", title: "1.2 WHO 5 Moments of Hand Hygiene Bedside Audit", duration: "18m", type: "video" },
          { id: "l2_1_3", title: "1.3 Personal Protective Equipment (PPE) Doffing/Donning", duration: "22m", type: "video" },
        ],
      },
      {
        id: "m2_2",
        title: "Module 2: Device-Associated HAI Prevention Bundles",
        duration: "2h 00m",
        lessons: [
          { id: "l2_2_1", title: "2.1 Central Line-Associated Bloodstream Infection (CLABSI)", duration: "28m", type: "video" },
          { id: "l2_2_2", title: "2.2 Catheter-Associated Urinary Tract Infection (CAUTI)", duration: "24m", type: "video" },
          { id: "l2_2_3", title: "2.3 Ventilator-Associated Pneumonia (VAP) Oral Care Bundle", duration: "25m", type: "video" },
          { id: "l2_2_4", title: "2.4 Bundle Compliance Checklist & Audit Tool", duration: "15m", type: "reading" },
        ],
      },
      {
        id: "m2_3",
        title: "Module 3: Waste Management & Sharps Safety",
        duration: "1h 20m",
        lessons: [
          { id: "l2_3_1", title: "3.1 Biomedical Waste (BMW 2016 Rules) Sorting Protocol", duration: "22m", type: "video" },
          { id: "l2_3_2", title: "3.2 Immediate Management of Needlestick Injury & PEP Registry", duration: "20m", type: "interactive_case" },
          { id: "l2_3_3", title: "3.3 NABH Audit Prep: Mock Infection Control Assessment", duration: "25m", type: "quiz" },
        ],
      },
    ],
    clinicalScenario: {
      title: "Suspected CLABSI in Long-Stay ICU Patient",
      caseDescription: "A 62-year-old female with a right internal jugular central venous line on Day 7 spikes a high fever of 39.1°C with rigors. Site inspection shows erythema and slight tenderness at the insertion site with no purulent discharge.",
      patientVitals: {
        hr: "112 bpm",
        bp: "96/60 mmHg",
        spo2: "95%",
        rhythm: "Sinus Tachycardia",
      },
      prompt: "What is the proper diagnostic protocol prior to initiating empirical antibiotics for suspected catheter-related bloodstream infection?",
      options: [
        {
          id: "opt_c2_1",
          text: "Draw two sets of blood cultures: one from the central catheter hub and one from a peripheral venipuncture site simultaneously",
          isCorrect: true,
          explanation: "Correct! Differential time to positivity (DTP) between catheter-drawn and peripheral blood cultures is the international gold standard to confirm CLABSI."
        },
        {
          id: "opt_c2_2",
          text: "Immediately pull out the catheter and discard the tip without culturing",
          isCorrect: false,
          explanation: "Incorrect. The catheter tip should be cultured using semi-quantitative roll-plate technique if removed, and blood cultures must be drawn first."
        },
        {
          id: "opt_c2_3",
          text: "Start IV Vancomycin immediately and wait 24 hours before drawing cultures",
          isCorrect: false,
          explanation: "Incorrect. Blood cultures must ALWAYS be obtained BEFORE antimicrobial administration to prevent false-negative culture results."
        },
      ],
    },
    certificateDetails: {
      credentialCode: "FALE-HICC-2026-CERT",
      validity: "3 Years",
      recognizedHospitals: ["All NABH Accredited Hospitals", "Narayana Health", "Aster CMI", "KIMS Hospitals"],
    },
    featured: true,
  },
  {
    id: "c3",
    title: "Critical Care Nursing Essentials & Hemodynamics",
    provider: "FALE Clinical Academy",
    category: "Critical Care",
    duration: "8 weeks",
    level: "Advanced",
    cmeCredits: 6.0,
    rating: 4.9,
    reviewsCount: 1840,
    enrolledCount: 4120,
    accreditedBy: "Indian Critical Care Nursing Forum & TNAI",
    accreditationBadge: "ICCNF Endorsed • 6.0 CME",
    summary: "Master arterial lines, central venous pressure wave reading, vasopressor titration, arterial blood gas (ABG) analysis, and multi-organ support.",
    overview: "Designed for nurses transitioning to medical and surgical ICUs. You will develop razor-sharp clinical assessment skills, learn to interpret complex monitor waveforms, titrate life-saving inotropes safely, and detect septic shock hours before cardiovascular collapse.",
    targetAudience: "Staff Nurses in MICU, SICU, Neuro-ICU, Cardiac Recovery, and HDU.",
    skillsGained: ["Arterial Line Zeroing & Waveform Dampening", "CVP Tracing", "ABG Acid-Base Interpretation", "Noradrenaline / Vasopressin Titration", "Glasgow Coma Scale & Sedation Scoring (RASS)"],
    whatYouWillLearn: [
      "Transducer leveling (Phlebostatic Axis) and zeroing calibration procedures",
      "Stepwise interpretation of Arterial Blood Gas (Metabolic vs Respiratory Acidosis/Alkalosis)",
      "Calculating inotrope infusions (mcg/kg/min) and understanding target Mean Arterial Pressure (MAP > 65)",
      "Managing continuous sedation with Propofol / Fentanyl and performing daily sedation holds",
      "Early recognition of Septic Shock using the qSOFA and lactate clearance metrics"
    ],
    instructor: {
      name: "Dr. Sunita Deshmukh",
      role: "Head of Critical Care Nursing Practice",
      hospital: "Max Super Speciality Hospital, Delhi",
      avatarInitials: "SD",
      bio: "20+ years training ICU nursing fellows. Advisory panel member on national critical care nurse certification guidelines."
    },
    modules: [
      {
        id: "m3_1",
        title: "Module 1: Hemodynamic Monitoring Hardware & Zeroing",
        duration: "2h 10m",
        lessons: [
          { id: "l3_1_1", title: "1.1 The Phlebostatic Axis: Anatomy & Leveling", duration: "25m", type: "video" },
          { id: "l3_1_2", title: "1.2 Square Wave Test: Underdamped vs Overdamped Tracings", duration: "28m", type: "video" },
          { id: "l3_1_3", title: "1.3 Arterial Line Cannulation Care & Catheter Flushes", duration: "20m", type: "video" },
        ],
      },
      {
        id: "m3_2",
        title: "Module 2: Arterial Blood Gas (ABG) Mastery",
        duration: "2h 45m",
        lessons: [
          { id: "l3_2_1", title: "2.1 The 5-Step Systematic ABG Interpretation Flowchart", duration: "35m", type: "video" },
          { id: "l3_2_2", title: "2.2 Anion Gap Calculation in High-Gap Metabolic Acidosis", duration: "25m", type: "video" },
          { id: "l3_2_3", title: "2.3 20 Interactive ABG Strip Analysis Exercises", duration: "40m", type: "quiz" },
        ],
      },
      {
        id: "m3_3",
        title: "Module 3: Vasoactive Infusions & Septic Shock",
        duration: "2h 30m",
        lessons: [
          { id: "l3_3_1", title: "3.1 Norepinephrine, Vasopressin, Epinephrine & Milrinone Pharmacokinetics", duration: "38m", type: "video" },
          { id: "l3_3_2", title: "3.2 Titration Protocols to Target MAP > 65 mmHg", duration: "24m", type: "video" },
          { id: "l3_3_3", title: "3.3 Central Line Extravasation Management", duration: "20m", type: "reading" },
        ],
      },
    ],
    clinicalScenario: {
      title: "Septic Shock with Overdamped Arterial Waveform",
      caseDescription: "A 45-year-old post-laparotomy patient in the ICU has a blood pressure reading on the automated cuff of 78/42 mmHg. However, the radial arterial line monitor shows 122/85 mmHg with a slurred, rounded peak waveform lacking a dicrotic notch.",
      patientVitals: {
        hr: "128 bpm",
        bp: "78/42 (Cuff) vs 122/85 (Arterial)",
        spo2: "91%",
        rhythm: "Sinus Tachycardia",
      },
      prompt: "What is the primary action required before initiating or adjusting vasopressor infusions based on this arterial line tracing?",
      options: [
        {
          id: "opt_c3_1",
          text: "Perform a rapid flush test (square wave test) to check for waveform overdamping caused by air bubbles, blood clots, or compliant tubing",
          isCorrect: true,
          explanation: "Correct! The rounded tracing with absent dicrotic notch indicates overdamping, which falsely elevates diastolic and falsely blunts systolic readings. You must flush the line and re-zero."
        },
        {
          id: "opt_c3_2",
          text: "Trust the arterial line reading and decrease the Norepinephrine infusion immediately",
          isCorrect: false,
          explanation: "Incorrect! Decreasing inotropes when the patient is actually in shock (as indicated by the cuff) could cause fatal hypoperfusion."
        },
        {
          id: "opt_c3_3",
          text: "Assume the cuff is faulty and disregard the non-invasive blood pressure reading",
          isCorrect: false,
          explanation: "Incorrect. When a significant discrepancy exists alongside an abnormal waveform, the hardware setup must be validated first."
        },
      ],
    },
    certificateDetails: {
      credentialCode: "FALE-CCNE-2026-CERT",
      validity: "2 Years",
      recognizedHospitals: ["Apollo", "Fortis", "Manipal", "Max", "Narayana Health"],
    },
    featured: true,
  },
  {
    id: "c4",
    title: "Effective Clinical Communication & Patient De-escalation",
    provider: "FALE Academy",
    category: "Nursing Essentials",
    duration: "2 weeks",
    level: "Beginner",
    cmeCredits: 1.5,
    rating: 4.7,
    reviewsCount: 720,
    enrolledCount: 1930,
    accreditedBy: "Healthcare Quality & Patient Safety Council",
    accreditationBadge: "Patient Safety • 1.5 CME",
    summary: "Structured clinical handoffs (SBAR technique), empathetic communication, resolving angry attendants, and ethical bedside care.",
    overview: "Medical errors in 70% of hospital incidents stem from communication breakdowns. This course teaches clinicians how to communicate concisely during handoffs, de-escalate emotionally agitated family members, and foster safety culture across nursing and medical teams.",
    targetAudience: "All healthcare workers: Nurses, DMOs, Reception Executives, and Ward Supervisors.",
    skillsGained: ["SBAR Handover Protocol", "Verbal De-escalation", "Communicating Critical Lab Values", "Breaking Difficult News Empathically"],
    whatYouWillLearn: [
      "The Situation-Background-Assessment-Recommendation (SBAR) structure",
      "Techniques to stay calm and de-escalate aggressive attendants in emergency triage",
      "Read-back protocol for verbal and telephonic medical orders",
      "Documenting critical incidents objectively in electronic medical records (EMR)"
    ],
    instructor: {
      name: "Prof. Rahul Nambiar",
      role: "Patient Experience & Clinical Behavior Consultant",
      hospital: "Healthcare Quality Institute, Mumbai",
      avatarInitials: "RN",
      bio: "20 years consulting top hospital networks on clinical incident reduction and patient-provider communication protocols."
    },
    modules: [
      {
        id: "m4_1",
        title: "Module 1: The SBAR Framework at Bedside",
        duration: "1h 00m",
        lessons: [
          { id: "l4_1_1", title: "1.1 The High-Risk Shift Handover Vulnerability", duration: "15m", type: "video" },
          { id: "l4_1_2", title: "1.2 SBAR Step-by-Step Implementation", duration: "25m", type: "video" },
          { id: "l4_1_3", title: "1.3 Interactive Ward Handover Practice", duration: "20m", type: "interactive_case" },
        ],
      },
      {
        id: "m4_2",
        title: "Module 2: Managing High-Stress Patient & Family Interactions",
        duration: "1h 30m",
        lessons: [
          { id: "l4_2_1", title: "2.1 10 Rules of Verbal De-escalation", duration: "25m", type: "video" },
          { id: "l4_2_2", title: "2.2 Telephonic Critical Lab Reporting Read-Back", duration: "20m", type: "video" },
          { id: "l4_2_3", title: "2.3 Final Knowledge Check: Conflict Resolution", duration: "20m", type: "quiz" },
        ],
      },
    ],
    clinicalScenario: {
      title: "Agitated Attendants Demanding Immediate Doctor in ER",
      caseDescription: "During a busy night shift in the Emergency Room with multiple incoming road accident cases, an anxious family member bangs on the triage counter shouting that his father has had fever for 2 hours and demands immediate admission ahead of other triaged patients.",
      patientVitals: {
        hr: "84 bpm",
        bp: "128/80 mmHg",
        spo2: "98%",
        rhythm: "Stable (ESI Level 4)",
      },
      prompt: "What is the best initial de-escalation response according to healthcare communication standards?",
      options: [
        {
          id: "opt_c4_1",
          text: "Maintain an open posture, acknowledge their distress with empathy, briefly explain the triage protocol, and reassure them that vital signs are stable while estimating doctor availability",
          isCorrect: true,
          explanation: "Correct! Empathic acknowledgment lowers emotional arousal, while clear information about vitals and wait expectations prevents escalation into physical conflict."
        },
        {
          id: "opt_c4_2",
          text: "Call hospital security immediately and refuse to speak to them until they are removed",
          isCorrect: false,
          explanation: "Incorrect. Calling security as a first step without verbal de-escalation often triggers violent confrontation."
        },
        {
          id: "opt_c4_3",
          text: "Admit the patient immediately ahead of severe trauma cases to avoid complaints",
          isCorrect: false,
          explanation: "Incorrect. Compromising clinical triage jeopardizes life-threatening cases and violates emergency protocols."
        },
      ],
    },
    certificateDetails: {
      credentialCode: "FALE-COMM-2026-CERT",
      validity: "Permanent",
      recognizedHospitals: ["Pan-India Healthcare Network"],
    },
  },
  {
    id: "c5",
    title: "Mechanical Ventilation in ARDS & Invasive Airway Management",
    provider: "FALE Clinical Academy",
    category: "Critical Care",
    duration: "5 weeks",
    level: "Advanced",
    cmeCredits: 5.0,
    rating: 4.9,
    reviewsCount: 960,
    enrolledCount: 2750,
    accreditedBy: "Indian Chest Society & ISCCM Guidelines",
    accreditationBadge: "ICS Certified • 5.0 CME",
    summary: "Volume vs Pressure modes, PEEP titration, driving pressure, prone positioning, ventilator dyssynchrony, and weaning protocols.",
    overview: "Mechanical ventilation is one of the most critical high-stakes proficiencies in modern healthcare. This course breaks down ventilator waveforms, lung-protective strategies in Acute Respiratory Distress Syndrome (ARDS), and patient-ventilator dyssynchrony.",
    targetAudience: "ICU Staff Nurses, Respiratory Therapists, and Critical Care Physicians.",
    skillsGained: ["Ventilator Waveform Analysis", "Lung Protective Ventilation (6 mL/kg PBW)", "Prone Positioning Checklist", "Ventilator Weaning & RSBI Index"],
    whatYouWillLearn: [
      "Difference between Volume-Controlled and Pressure-Controlled ventilation",
      "Calculating Predicted Body Weight (PBW) for tidal volume delivery",
      "Measuring Plateau Pressure and maintaining Driving Pressure < 15 cmH2O",
      "Managing high peak airway pressure alarms and differential diagnoses",
      "Spontaneous Breathing Trials (SBT) and Rapid Shallow Breathing Index (RSBI)"
    ],
    instructor: {
      name: "Dr. Rajeshwar Sen",
      role: "Senior Consultant Pulmonologist & Intensivist",
      hospital: "Fortis Healthcare, Mumbai",
      avatarInitials: "RS",
      bio: "24 years in clinical pulmonology. Lead author on national guidelines for mechanical ventilation during viral ARDS epidemics."
    },
    modules: [
      {
        id: "m5_1",
        title: "Module 1: Respiratory Mechanics & Basic Modes",
        duration: "2h 00m",
        lessons: [
          { id: "l5_1_1", title: "1.1 Compliance, Resistance & Time Constants", duration: "25m", type: "video" },
          { id: "l5_1_2", title: "1.2 VC-CMV vs PC-CMV: Waveforms and Triggers", duration: "32m", type: "video" },
          { id: "l5_1_3", title: "1.3 Interactive Case: Setting Up Initial Settings", duration: "25m", type: "interactive_case" },
        ],
      },
      {
        id: "m5_2",
        title: "Module 2: ARDS Lung-Protective Strategy",
        duration: "2h 30m",
        lessons: [
          { id: "l5_2_1", title: "2.1 ARDSNet Protocol: 6 mL/kg PBW & PEEP Titration", duration: "35m", type: "video" },
          { id: "l5_2_2", title: "2.2 Prone Positioning: Step-by-Step Safety Bundle", duration: "28m", type: "video" },
          { id: "l5_2_3", title: "2.3 Knowledge Check: Pressure Alarm Troubleshooting", duration: "20m", type: "quiz" },
        ],
      },
    ],
    clinicalScenario: {
      title: "Sudden High Peak Pressure Alarm on ARDS Patient",
      caseDescription: "A 52-year-old mechanically ventilated patient with severe ARDS triggers a high peak airway pressure alarm (48 cmH2O, baseline 28 cmH2O). Plateau pressure remains normal at 22 cmH2O. SpO2 has dropped from 95% to 88%.",
      patientVitals: {
        hr: "118 bpm",
        bp: "135/88 mmHg",
        spo2: "88%",
        rhythm: "Sinus Tachycardia",
      },
      prompt: "Given high peak pressure with NORMAL plateau pressure, what is the primary pathophysiological problem?",
      options: [
        {
          id: "opt_c5_1",
          text: "Increased airway resistance (e.g. endotracheal tube bite, kinking, mucus plugging, or bronchospasm) requiring suctioning and circuit inspection",
          isCorrect: true,
          explanation: "Correct! When peak pressure rises but plateau pressure remains normal, the problem is elevated resistive work (airway/tube problem), not decreased lung compliance (like pneumothorax or ARDS progression)."
        },
        {
          id: "opt_c5_2",
          text: "Tension pneumothorax requiring immediate needle decompression",
          isCorrect: false,
          explanation: "Incorrect. Pneumothorax reduces lung compliance and would cause BOTH peak and plateau pressures to skyrocket simultaneously."
        },
        {
          id: "opt_c5_3",
          text: "Worsening pulmonary edema requiring furosemide",
          isCorrect: false,
          explanation: "Incorrect. Pulmonary edema reduces lung compliance, which would elevate plateau pressure."
        },
      ],
    },
    certificateDetails: {
      credentialCode: "FALE-MECH-2026-CERT",
      validity: "2 Years",
      recognizedHospitals: ["Apollo Hospitals", "Fortis", "Aster", "Max"],
    },
  },
  {
    id: "c6",
    title: "Emergency Triage (ESI) & Trauma Resuscitation (ATLS)",
    provider: "FALE Clinical Academy",
    category: "Emergency & Trauma",
    duration: "4 weeks",
    level: "Intermediate",
    cmeCredits: 4.0,
    rating: 4.8,
    reviewsCount: 1120,
    enrolledCount: 3080,
    accreditedBy: "Emergency Medicine Association (EMA)",
    accreditationBadge: "EMA Approved • 4.0 CME",
    summary: "5-level Emergency Severity Index (ESI), primary survey (ABCDE), massive transfusion protocol, and trauma resuscitation.",
    overview: "In emergency triage, every second determines patient survival. Master the international 5-level ESI triage system to rapidly sort walk-in and ambulance arrivals, identify occult hypovolemic shock, and initiate early resuscitation.",
    targetAudience: "Emergency Room Staff Nurses, Casualty Medical Officers, and Trauma Care Coordinators.",
    skillsGained: ["Emergency Severity Index (ESI) Triage", "Trauma ABCDE Primary Survey", "Massive Transfusion Protocol Activation", "C-Spine Immobilization"],
    whatYouWillLearn: [
      "Algorithmic decision tree for ESI Levels 1 through 5",
      "Rapid recognition of high-risk conditions presenting with normal vitals",
      "Immediate trauma resuscitation according to ATLS 10th edition standards",
      "Pelvic binder application and hemorrhage control techniques"
    ],
    instructor: {
      name: "Dr. Farooq Ahmed",
      role: "HOD Emergency Medicine & Trauma Services",
      hospital: "Aster Medcity, Kochi",
      avatarInitials: "FA",
      bio: "19+ years heading busy tertiary trauma centers. Certified ATLS instructor and national speaker on disaster triage."
    },
    modules: [
      {
        id: "m6_1",
        title: "Module 1: The ESI 5-Level Triage Algorithm",
        duration: "1h 45m",
        lessons: [
          { id: "l6_1_1", title: "1.1 ESI Level 1: Immediate Life-Threatening Resuscitation", duration: "25m", type: "video" },
          { id: "l6_1_2", title: "1.2 ESI Level 2: High Risk, Confusion, or Severe Pain", duration: "28m", type: "video" },
          { id: "l6_1_3", title: "1.3 Resource Prediction for Levels 3, 4, and 5", duration: "22m", type: "video" },
        ],
      },
      {
        id: "m6_2",
        title: "Module 2: Trauma Primary Survey (ABCDE)",
        duration: "2h 15m",
        lessons: [
          { id: "l6_2_1", title: "2.1 Airway with C-Spine Control in Polytrauma", duration: "30m", type: "video" },
          { id: "l6_2_2", title: "2.2 Massive Transfusion Protocol: 1:1:1 Blood Ratio", duration: "25m", type: "video" },
          { id: "l6_2_3", title: "2.3 Interactive Trauma Case Simulator", duration: "35m", type: "interactive_case" },
        ],
      },
    ],
    clinicalScenario: {
      title: "Motorbike Collision with Pelvic Instability",
      caseDescription: "A 24-year-old male is brought to the trauma bay after a high-speed road traffic accident. He is pale, diaphoretic, and confused. Carotid and radial pulses are weak and thready. Gentle pelvic compression reveals mechanical instability.",
      patientVitals: {
        hr: "138 bpm",
        bp: "74/46 mmHg",
        spo2: "92% on room air",
        rhythm: "Sinus Tachycardia (Class III/IV Shock)",
      },
      prompt: "What is the immediate dual priority for bleeding control and fluid resuscitation?",
      options: [
        {
          id: "opt_c6_1",
          text: "Apply a commercial pelvic binder (or sheet wrap) over the greater trochanters immediately and activate Massive Transfusion Protocol (1:1:1 PRBC, FFP, Platelets)",
          isCorrect: true,
          explanation: "Correct! Pelvic stabilization reduces internal retroperitoneal bleeding volume. In severe hemorrhagic shock, aggressive balanced blood product resuscitation (1:1:1) prevents lethal triad of trauma (hypothermia, acidosis, coagulopathy)."
        },
        {
          id: "opt_c6_2",
          text: "Infuse 3 Liters of normal saline as fast as possible through two peripheral lines",
          isCorrect: false,
          explanation: "Incorrect! Massive crystalloid infusion causes dilutional coagulopathy and hypothermia, worsening trauma mortality."
        },
        {
          id: "opt_c6_3",
          text: "Transfer directly to CT scan before applying a pelvic binder",
          isCorrect: false,
          explanation: "Incorrect! Unstable trauma patients must never be sent to the CT scanner without stabilization and hemorrhage control."
        },
      ],
    },
    certificateDetails: {
      credentialCode: "FALE-TRMA-2026-CERT",
      validity: "2 Years",
      recognizedHospitals: ["Aster", "KIMS", "Apollo", "Fortis"],
    },
  },
];

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
  experienceList: { hospital: string; role: string; duration: string; details: string }[];
}

export const applicants: Applicant[] = [
  {
    id: "a1",
    name: "Priya Raman",
    role: "Staff Nurse",
    exp: "4 yrs",
    city: "Chennai",
    for: "Staff Nurse — ICU",
    status: "New",
    verified: true,
    match: 96,
    appliedDate: "2 hours ago",
    currentOrg: "Kauvery Hospital",
    qualification: "B.Sc Nursing (Tamil Nadu Dr. M.G.R. Medical University)",
    regNumber: "TNC Reg #RN-89421",
    skills: ["ICU Care", "Ventilator Support", "BLS / ACLS", "Patient Triage", "Arterial Line Care"],
    noticePeriod: "15 Days (Immediate)",
    expectedSalary: "₹38,000 / mo",
    phone: "+91 98401 23456",
    email: "priya.raman@clinicalmail.in",
    bio: "Experienced critical care staff nurse with 4 years in tertiary hospital medical ICUs. Expert in mechanical ventilation, hemodynamics, and central line maintenance.",
    education: "B.Sc Nursing · Apollo College of Nursing, Chennai (2020)",
    certifications: ["AHA ACLS & BLS Certified (2024)", "NABH Nursing Quality Guidelines", "Infection Control Protocol (ICMR)"],
    experienceList: [
      { hospital: "Kauvery Hospital, Chennai", role: "Staff Nurse (MICU)", duration: "2022 — Present (2.5 yrs)", details: "Lead nurse for 12-bed MICU managing multi-organ failure and post-cardiac arrest patients." },
      { hospital: "Billroth Hospitals, Chennai", role: "Junior Staff Nurse", duration: "2020 — 2022 (1.5 yrs)", details: "Handled bedside telemetry monitoring, drug infusions, and tracheostomy care." },
    ],
  },
  {
    id: "a2",
    name: "Arjun Mehta",
    role: "Staff Nurse",
    exp: "2 yrs",
    city: "Chennai",
    for: "Staff Nurse — ICU",
    status: "Shortlisted",
    verified: true,
    match: 92,
    appliedDate: "Yesterday",
    currentOrg: "Fortis Malar Hospital",
    qualification: "GNM + Critical Care Fellowship",
    regNumber: "TNC Reg #RN-72301",
    skills: ["Telemetry", "IV Infusion", "Post-op Care", "BLS Certified", "Emergency Response"],
    noticePeriod: "Serving notice (10 days)",
    expectedSalary: "₹32,000 / mo",
    phone: "+91 97890 54321",
    email: "arjun.mehta@carepulse.in",
    bio: "Dedicated staff nurse with strong emergency response and surgical ICU foundation. Demonstrated track record in reducing central line-associated bloodstream infections.",
    education: "GNM Diploma · Christian Medical College Hospital, Vellore (2022)",
    certifications: ["BLS Certified (American Heart Association)", "Medication Safety & Dose Calculation"],
    experienceList: [
      { hospital: "Fortis Malar Hospital, Adyar", role: "ICU Staff Nurse", duration: "2022 — Present (2 yrs)", details: "Managed pre and post-cardiac surgery ICU patients with mechanical ventilation." },
    ],
  },
  {
    id: "a3",
    name: "Fathima Nasreen",
    role: "Lab Technician",
    exp: "3 yrs",
    city: "Vellore",
    for: "Lab Technician",
    status: "Interview",
    verified: true,
    match: 94,
    appliedDate: "3 days ago",
    currentOrg: "Metropolis Healthcare",
    qualification: "B.Sc Medical Laboratory Technology (B.Sc MLT)",
    regNumber: "TN Paramedical Board #MLT-55214",
    skills: ["Automated Analyzers", "Hematology", "Clinical Biochemistry", "ELISA", "NABH Lab QA"],
    noticePeriod: "Immediate Joiner",
    expectedSalary: "₹28,000 / mo",
    phone: "+91 94440 98765",
    email: "fathima.nasreen@medlab.in",
    bio: "Skilled diagnostic medical laboratory technologist with experience operating Sysmex, Roche Cobas, and Beckman Coulter analyzers with zero-error calibration.",
    education: "B.Sc MLT · Dr. M.G.R. Educational & Research Institute (2021)",
    certifications: ["Internal Auditor for ISO 15189:2022 (Medical Labs)", "Bio-Medical Waste Management"],
    experienceList: [
      { hospital: "Metropolis Diagnostic Center, Vellore", role: "Senior Lab Technician", duration: "2022 — Present (2 yrs)", details: "Conducted routine & special biochemistry and hematology tests with stringent internal QA." },
      { hospital: "Narayana Hrudayalaya Clinic", role: "Junior Laboratory Analyst", duration: "2021 — 2022 (1 yr)", details: "Specimen processing, blood group cross-matching, and coagulation profiles." },
    ],
  },
  {
    id: "a4",
    name: "Karthik S",
    role: "Lab Technician",
    exp: "1 yr",
    city: "Chennai",
    for: "Lab Technician",
    status: "New",
    verified: false,
    match: 84,
    appliedDate: "4 days ago",
    currentOrg: "Thyrocare Technologies",
    qualification: "Diploma in Medical Laboratory Technology (DMLT)",
    regNumber: "Verification in progress",
    skills: ["Phlebotomy", "Sample Collection", "Urine Chemistry", "Microscopy"],
    noticePeriod: "Immediate",
    expectedSalary: "₹20,000 / mo",
    phone: "+91 96001 11223",
    email: "karthik.s@healthlab.in",
    bio: "Enthusiastic pathology lab technician with sound practical grounding in venipuncture sample collection, smear preparation, and clinical microscopy.",
    education: "DMLT · Government Medical College, Chennai (2023)",
    certifications: ["Phlebotomy Technique Certification", "Good Clinical Practice (GCP)"],
    experienceList: [
      { hospital: "Thyrocare Collection Hub, Chennai", role: "Phlebotomist & Junior Technician", duration: "2023 — Present (1 yr)", details: "Handled 60+ daily patient blood sample collections and centrifuge preparation." },
    ],
  },
  {
    id: "a5",
    name: "Dr. Sneha Pillai",
    role: "Medical Officer",
    exp: "3 yrs",
    city: "Bengaluru",
    for: "Emergency Medical Officer",
    status: "New",
    verified: true,
    match: 98,
    appliedDate: "Just now",
    currentOrg: "Manipal Hospital",
    qualification: "MBBS, FCCS (Critical Care)",
    regNumber: "KMC Reg #128945",
    skills: ["Emergency Triage", "Intubation", "Trauma Care", "ACLS & ATLS", "POCUS"],
    noticePeriod: "1 month",
    expectedSalary: "₹85,000 / mo",
    phone: "+91 99002 44556",
    email: "dr.sneha.pillai@medcare.in",
    bio: "Emergency physician with strong hands-on capability in ER triage, rapid sequence intubation, point-of-care ultrasound, and resuscitation management.",
    education: "MBBS · Bangalore Medical College and Research Institute (2021)",
    certifications: ["ATLS (Advanced Trauma Life Support)", "AHA ACLS Instructor Certified"],
    experienceList: [
      { hospital: "Manipal Hospital, Old Airport Rd", role: "Emergency Resident Medical Officer", duration: "2021 — Present (3 yrs)", details: "Level-1 emergency department managing acute coronary syndromes, polytrauma, and stroke protocols." },
    ],
  },
  {
    id: "a6",
    name: "Ramesh Kannan",
    role: "Dialysis Technician",
    exp: "5 yrs",
    city: "Chennai",
    for: "Senior Dialysis Technician",
    status: "Shortlisted",
    verified: true,
    match: 95,
    appliedDate: "5 days ago",
    currentOrg: "MIOT International",
    qualification: "B.Sc Renal Dialysis Technology",
    regNumber: "TN Paramedical Council #RDT-44109",
    skills: ["Hemodialysis", "AV Fistula Cannulation", "CRRT", "Dialyzer Reprocessing", "Water Treatment Plant (RO)"],
    noticePeriod: "15 Days",
    expectedSalary: "₹36,000 / mo",
    phone: "+91 94451 88990",
    email: "ramesh.kannan@nephrocare.in",
    bio: "Senior nephrology technologist skilled in chronic and acute hemodialysis, CRRT machine setup in ICU, and troubleshooting dialysis machines.",
    education: "B.Sc Renal Dialysis · Sri Ramachandra Institute of Higher Education and Research (2019)",
    certifications: ["Certified Hemodialysis Technologist (BONENT)", "NABH Dialysis Quality Standards"],
    experienceList: [
      { hospital: "MIOT International, Chennai", role: "Senior Dialysis Technologist", duration: "2021 — Present (3 yrs)", details: "Operating 20-station dialysis unit and on-call emergency CRRT in surgical ICU." },
      { hospital: "Sundaram Medical Foundation", role: "Junior Dialysis Technician", duration: "2019 — 2021 (2 yrs)", details: "Routine hemodialysis sessions, vascular access cannulation, and patient vital monitoring." },
    ],
  },
];

export const professions = [
  "Nurse", "Doctor", "Dentist", "Pharmacist", "Physiotherapist", "Lab Technician",
  "Radiology Technician", "OT Technician", "Hospital Administration", "Front Office / Admin", "Other allied health",
];

export const indianStates = [
  "Andhra Pradesh", "Delhi", "Gujarat", "Karnataka", "Kerala", "Maharashtra", "Punjab", "Rajasthan",
  "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other",
];

export const indianCities = [
  "Chennai",
  "Bengaluru",
  "Hyderabad",
  "Mumbai",
  "Delhi NCR",
  "Kolkata",
  "Pune",
  "Ahmedabad",
  "Kochi",
  "Coimbatore",
  "Madurai",
  "Trichy",
  "Salem",
  "Vellore",
  "Tirunelveli",
  "Thiruvananthapuram",
  "Kozhikode",
  "Visakhapatnam",
  "Vijayawada",
  "Guntur",
  "Mysuru",
  "Mangaluru",
  "Hubli",
  "Chandigarh",
  "Jaipur",
  "Lucknow",
  "Kanpur",
  "Patna",
  "Bhubaneswar",
  "Cuttack",
  "Indore",
  "Bhopal",
  "Nagpur",
  "Nashik",
  "Surat",
  "Vadodara",
  "Rajkot",
  "Guwahati",
  "Dehradun",
  "Ranchi",
  "Raipur",
  "Pan India (Open to anywhere)",
];

export function neededDocs(portal: "candidate" | "facility", role?: string): { label: string; hint: string }[] {
  if (portal === "facility")
    return [
      { label: "Facility registration / licence", hint: "Clinical establishment certificate or equivalent" },
      { label: "GST certificate (if applicable)", hint: "Supporting evidence" },
      { label: "Representative authorization", hint: "Letter on company letterhead" },
    ];
  const base = [
    { label: "Resume / CV", hint: "Shown to employers when you apply" },
    { label: "Identity proof", hint: "Aadhaar, PAN, Passport or Voter ID — kept private" },
    { label: "Highest qualification certificate", hint: "Degree or diploma certificate" },
  ];
  if (role && ["Nurse", "Doctor", "Dentist", "Pharmacist", "Physiotherapist"].includes(role))
    base.push({ label: "Professional registration", hint: "State council registration certificate" });
  return base;
}

export const skillsByProfession: Record<string, string[]> = {
  Doctor: [
    "OPD Consultation",
    "Emergency Care",
    "Inpatient Management",
    "ICU & Critical Care",
    "BLS / ACLS / ATLS",
    "Diagnostics Interpretation",
    "Minor Surgeries",
    "EMR / HIS Documentation",
    "Patient Counseling",
    "Clinical Research",
  ],
  Nurse: [
    "Patient Care & Hygiene",
    "BLS / ACLS",
    "IV Cannulation & Infusions",
    "Ventilator Care",
    "Wound Care & Dressing",
    "Medication Administration",
    "Pre & Post-Operative Care",
    "EMR / HIS",
    "Sample Collection",
    "Vitals Monitoring",
  ],
  Dentist: [
    "Endodontics (RCT)",
    "Tooth Extractions",
    "Crown & Bridge Prep",
    "Periodontal Scaling",
    "Dental Radiology (IOPA)",
    "Composite Restorations",
    "Orthodontic Adjustments",
    "Prosthodontics",
    "Patient Oral Hygiene",
    "Cosmetic Dentistry",
  ],
  Pharmacist: [
    "Prescription Verification",
    "Inpatient & OPD Dispensing",
    "Drug Interactions & ADR",
    "Inventory & ERP Management",
    "Clinical Pharmacology",
    "IV Admixture / Compounding",
    "Patient Counseling",
    "Regulatory & Schedule Compliance",
    "Cold Chain Storage",
    "Hospital Formulary",
  ],
  Physiotherapist: [
    "Musculoskeletal Rehab",
    "Neurological Rehabilitation",
    "Post-Operative Recovery",
    "Pain Management",
    "Manual Therapy",
    "Sports Injury Rehab",
    "Electrotherapy & Ultrasound",
    "Gait & Balance Training",
    "Ergonomic Assessment",
    "Cardiopulmonary Rehab",
  ],
  "Lab Technician": [
    "Phlebotomy & Sample Collection",
    "Hematology (CBC, ESR)",
    "Biochemistry Analysis",
    "Microbiology & Cultures",
    "ELISA & Immunoassays",
    "PCR / Molecular Diagnostics",
    "Quality Control (NABL/CAP)",
    "Histopathology Processing",
    "Equipment Calibration",
    "LIMS Reporting",
  ],
  "Radiology Technician": [
    "Digital X-Ray Operations",
    "CT Scan Protocols",
    "MRI Sequences & Safety",
    "Radiation Safety (AERB)",
    "Patient Positioning",
    "Contrast Media Administration",
    "PACS & DICOM Systems",
    "Fluoroscopy & C-Arm",
    "Mammography",
    "Emergency Trauma Imaging",
  ],
  "OT Technician": [
    "OT Sterilization & Autoclaving",
    "Surgical Instrument Prep",
    "Anesthesia Machine Monitoring",
    "Sterile Field Maintenance",
    "Laparoscopic Tower Setup",
    "Biomedical Waste Disposal",
    "C-Arm Operation",
    "Emergency Resuscitation Assistance",
    "Suture & Implant Handling",
    "Patient Transfer & Positioning",
  ],
  "Hospital Administration": [
    "Hospital Operations",
    "NABH & JCI Compliance",
    "TPA & Insurance Desk",
    "Bed & Floor Management",
    "Patient Experience & Grievance",
    "HIS / EMR Workflow",
    "Staff Scheduling",
    "Biomedical Waste Management",
    "Vendor & Supply Chain",
    "Revenue Cycle Management",
  ],
  "Front Office / Admin": [
    "Patient Registration & Billing",
    "Appointment Scheduling",
    "TPA & Ayushman Desk",
    "Customer Support",
    "Hospital Directory & Guidance",
    "Cash & Cashless Processing",
    "Queue Management",
    "Emergency Triage Reception",
    "Telephonic Etiquette",
    "Record Keeping",
  ],
  "Other allied health": [
    "Patient Care Assistance",
    "Basic Life Support (BLS)",
    "Infection Control & PPE",
    "Vital Signs Monitoring",
    "Clinical Documentation",
    "Equipment Maintenance",
    "Patient Counseling",
    "Team Coordination",
  ],
};

export const specialtyPlaceholders: Record<string, string> = {
  Doctor: "e.g. General Medicine, Cardiology, Pediatrics, Anesthesia",
  Nurse: "e.g. ICU, Emergency, OT, Dialysis, General Ward",
  Dentist: "e.g. Conservative Dentistry, Orthodontics, Oral Surgery",
  Pharmacist: "e.g. Inpatient Pharmacy, Retail, Oncology, Compounding",
  Physiotherapist: "e.g. Ortho Rehab, Neuro, Sports Medicine, Cardio-pulmonary",
  "Lab Technician": "e.g. Hematology, Biochemistry, Molecular Biology, Histopathology",
  "Radiology Technician": "e.g. CT, MRI, Conventional X-Ray, Interventional",
  "OT Technician": "e.g. General Surgery, Cardiac OT, Neuro OT, Ortho OT",
  "Hospital Administration": "e.g. Operations, Quality (NABH), TPA & Billing, Front Desk",
  "Front Office / Admin": "e.g. OPD Reception, Emergency Admission, Billing Counter",
  "Other allied health": "e.g. Nutrition & Dietetics, Optometry, Dialysis Tech",
};

export const councilPlaceholders: Record<string, string> = {
  Doctor: "e.g. Tamil Nadu Medical Council / NMC",
  Nurse: "e.g. Tamil Nadu Nurses and Midwives Council (TNC)",
  Dentist: "e.g. Dental Council of India / State Dental Council",
  Pharmacist: "e.g. Pharmacy Council of India / State Pharmacy Council",
  Physiotherapist: "e.g. Indian Association of Physiotherapists (IAP)",
};

export const regNoPlaceholders: Record<string, string> = {
  Doctor: "e.g. TNMC/12345 or NMC/2021/045",
  Nurse: "e.g. TNNC/12345 or INC-9876",
  Dentist: "e.g. DCI/12345",
  Pharmacist: "e.g. PCI/12345 or TS-PH/8765",
  Physiotherapist: "e.g. IAP/L-12345",
};

export const qualificationPlaceholders: Record<string, string> = {
  Doctor: "e.g. MBBS, MD, MS, DNB",
  Nurse: "e.g. B.Sc Nursing, GNM, Post Basic B.Sc, M.Sc",
  Dentist: "e.g. BDS, MDS",
  Pharmacist: "e.g. B.Pharm, M.Pharm, Pharm.D",
  Physiotherapist: "e.g. BPT, MPT",
  "Lab Technician": "e.g. DMLT, BMLT, B.Sc MLT",
  "Radiology Technician": "e.g. B.Sc Medical Imaging Technology, DMRIT",
  "OT Technician": "e.g. Diploma in Operation Theatre Technology (DOTT)",
  "Hospital Administration": "e.g. MHA, MBA (Hospital & Health Systems)",
  "Front Office / Admin": "e.g. Any Graduate, BBA, B.Com, BA",
  "Other allied health": "e.g. B.Sc Allied Health Sciences, Diploma",
};

export const designationPlaceholders: Record<string, string> = {
  Doctor: "e.g. Consultant Physician, Duty Medical Officer, Registrar",
  Nurse: "e.g. Senior Staff Nurse, ICU Nurse, Nursing Supervisor",
  Dentist: "e.g. Associate Dentist, Dental Surgeon",
  Pharmacist: "e.g. Inpatient Pharmacist, Dispensing Chemist",
  Physiotherapist: "e.g. Senior Physiotherapist, Rehab Specialist",
  "Lab Technician": "e.g. Senior Medical Lab Technician, Phlebotomist",
  "Radiology Technician": "e.g. Senior CT/MRI Radiographer",
  "OT Technician": "e.g. Lead OT Technician, Surgical Assistant",
  "Hospital Administration": "e.g. Operations Manager, Floor Manager",
  "Front Office / Admin": "e.g. Front Office Executive, Patient Care Coordinator",
  "Other allied health": "e.g. Healthcare Specialist",
};

