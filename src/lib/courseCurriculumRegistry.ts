// src/lib/courseCurriculumRegistry.ts
// Accredited Clinical Course Curriculum Registry
// Mapped to top universities (Stanford, Harvard, Johns Hopkins, AIIMS, CMC Vellore, King's College, etc.)
// Zero data mismatching: role-specific instructors, curricula, vital simulations, and quizzes.

import type { Course } from "@/lib/data";

export const COURSE_CURRICULUM_REGISTRY: Record<string, Partial<Course>> = {
  // 1. DOCTOR: Acute Coronary Syndromes & 12-Lead ECG Mastery
  "cme-ecg-101": {
    title: "Acute Coronary Syndromes & 12-Lead ECG Mastery",
    provider: "Stanford Medicine CME & National Heart Foundation",
    category: "Critical Care",
    duration: "6 Hours",
    level: "Advanced",
    cmeCredits: 5,
    rating: 4.9,
    reviewsCount: 1240,
    enrolledCount: 3890,
    accreditedBy: "Tamil Nadu Medical Council (TNMC) & Stanford CME",
    accreditationBadge: "5 CME Credits • Stanford Aligned",
    summary: "Systematic interpretation of STEMI, reciprocal ST depressions, subtle Wellens syndrome, and lethal ventricular arrhythmias.",
    overview: "Formulated in alignment with Stanford Medicine and the American College of Cardiology. Clinicians master rapid bedside identification of subtle ischemic vector changes, de Winter T-waves, Wellens biphasic T-waves, posterior infarctions, and acute bundle branch blocks.",
    targetAudience: "Physicians, Emergency Physicians, Cardiologists, and Critical Care Fellows.",
    skillsGained: ["12-Lead ECG Vector Analysis", "Door-to-Balloon PCI Triage", "Arrhythmia Pharmacotherapy", "Reciprocal Depression Mapping"],
    whatYouWillLearn: [
      "Distinguish anatomical coronary artery occlusion vectors (LAD, RCA, LCx) on standard 12-lead ECG",
      "Recognize pre-infarction patterns: Wellens Syndrome Type A & B and de Winter T-waves",
      "Protocolize rapid door-to-needle thrombolysis and door-to-balloon primary PCI workflows",
      "Manage malignant ventricular tachycardias (VT/VF) and polymorphic Torsades de Pointes"
    ],
    instructor: {
      name: "Dr. Rajesh V. Ramanathan",
      role: "Senior Consultant Interventional Cardiologist",
      hospital: "Apollo Heart Institute, Chennai",
      avatarInitials: "RR",
      bio: "22+ years experience in primary coronary interventions and cardiac electrophysiology. Visiting CME faculty at Stanford Medicine."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: Ischemic Vectors & Acute STEMI Recognition",
        duration: "2 Hours",
        lessons: [
          { id: "l1_1", title: "Coronary Arterial Territories on 12-Lead ECG", duration: "35 min", type: "video", contentPreview: "Anatomical correlation of leads II, III, aVF (RCA), V1-V4 (LAD), and I, aVL, V5-V6 (LCx)." },
          { id: "l1_2", title: "Reciprocal ST Depression vs Global Ischemia", duration: "40 min", type: "interactive_case", contentPreview: "Differentiating localized transmural ischemia from diffuse ST depression with aVR elevation in LMCA occlusion." },
          { id: "l1_3", title: "Knowledge Check: Anterior vs Inferior Infarct", duration: "25 min", type: "quiz", contentPreview: "Interactive case validation on localized reciprocal leads." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Subtle Pre-STEMI Equivalents & Wellens Syndrome",
        duration: "2 Hours",
        lessons: [
          { id: "l2_1", title: "Wellens Syndrome & Critical LAD Stenosis", duration: "35 min", type: "video", contentPreview: "Recognizing biphasic and deeply inverted T-waves in pain-free intervals." },
          { id: "l2_2", title: "De Winter T-Waves & Posterior MI Leads V7-V9", duration: "45 min", type: "interactive_case", contentPreview: "Placing posterior leads V7-V9 for isolated posterior wall infarctions." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Lethal Arrhythmias & Cath Lab Escalation",
        duration: "2 Hours",
        lessons: [
          { id: "l3_1", title: "VT Storm & Refractory Ventricular Fibrillation", duration: "35 min", type: "video", contentPreview: "Electrical storm management with Esmolol, Amiodarone, and overdrive pacing." },
          { id: "l3_2", title: "Final Board Case Evaluation", duration: "30 min", type: "quiz", contentPreview: "Board level ECG simulation test." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Acute Anterior STEMI Emergency Cath Lab Decision",
      caseDescription: "A 56-year-old male with long-standing diabetes presents to the ER with 45 minutes of crushing retrosternal chest pain radiating to his left jaw and diaphoresis.",
      patientVitals: {
        hr: "118 bpm",
        bp: "88/58 mmHg",
        spo2: "93% on room air",
        rhythm: "Acute Anterior STEMI (4mm ST elevation V1-V4 with reciprocal depression in III & aVF)"
      },
      prompt: "ECG confirms acute hyperacute ST elevations in V1-V4 with reciprocal ST depression in leads III and aVF. What is the mandatory immediate clinical management sequence?",
      options: [
        {
          id: "opt1",
          text: "Activate primary PCI catheterization lab immediately (<90 min door-to-balloon), administer chewable Aspirin 325 mg + Ticagrelor 180 mg, and initiate IV fluid challenge cautiously for hypotension.",
          isCorrect: true,
          explanation: "Acute STEMI requires immediate cath lab activation without waiting for cardiac troponin results. Dual antiplatelet therapy (Aspirin + P2Y12 inhibitor) is life-saving."
        },
        {
          id: "opt2",
          text: "Order high-sensitivity Troponin-I and await laboratory confirmation before contacting the interventional cardiology team.",
          isCorrect: false,
          explanation: "In diagnostic STEMI, waiting for biomarkers unnecessarily delays reperfusion and causes myocardial necrosis."
        },
        {
          id: "opt3",
          text: "Administer 100 mg IV Labetalol to lower the heart rate below 70 bpm before transport.",
          isCorrect: false,
          explanation: "Beta-blockers are contraindicated in patients with cardiogenic shock or hypotension (BP 88/58 mmHg)."
        },
        {
          id: "opt4",
          text: "Perform urgent upper GI endoscopy to rule out peptic ulcer disease before giving any anticoagulants.",
          isCorrect: false,
          explanation: "In the presence of ST-elevation infarction, cardiac catheterization takes absolute priority."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "TNMC-STANFORD-ECG-2026",
      validity: "5 Years",
      recognizedHospitals: ["Apollo Hospitals", "Fortis Healthcare", "Manipal Hospitals", "Max Healthcare"]
    }
  },

  // 2. DOCTOR: Mechanical Ventilation in ARDS & COVID-19
  "cme-ards-102": {
    title: "Mechanical Ventilation in ARDS & COVID-19",
    provider: "Harvard Medical School CME & SCCM",
    category: "Critical Care",
    duration: "8 Hours",
    level: "Advanced",
    cmeCredits: 8,
    rating: 4.95,
    reviewsCount: 1540,
    enrolledCount: 4120,
    accreditedBy: "Tamil Nadu Medical Council & Society of Critical Care Medicine (SCCM)",
    accreditationBadge: "8 CME Credits • Harvard Aligned",
    summary: "Lung-protective ventilation, driving pressure titration, prone positioning, and weaning criteria in severe ARDS.",
    overview: "Based on the landmark ARMA and PROSEVA trials. Intensive care physicians and intensivists learn ventilator waveform scalar interpretation, low tidal volume titration (4-6 mL/kg PBW), plateau pressure optimization (<30 cmH2O), and 16-hour prone ventilation protocols.",
    targetAudience: "Intensivists, Critical Care Specialists, Pulmonologists, and Anesthesiologists.",
    skillsGained: ["Lung-Protective Ventilation", "Driving Pressure Optimization", "16-Hour Prone Positioning", "Asynchrony Troubleshooting"],
    whatYouWillLearn: [
      "Calculate Predicted Body Weight (PBW) accurately to set safe 4-8 mL/kg tidal volumes",
      "Monitor plateau pressure (Pplat <= 30 cmH2O) and target driving pressure (Delta P <= 14 cmH2O)",
      "Execute the PROSEVA prone positioning protocol with zero airway extubation incidents",
      "Detect and treat patient-ventilator asynchronies including double-triggering and reverse triggering"
    ],
    instructor: {
      name: "Dr. Sunita Deshmukh",
      role: "Chief of Critical Care Medicine & Harvard Scholar",
      hospital: "Hinduja National Hospital, Mumbai",
      avatarInitials: "SD",
      bio: "18+ years leading medical and surgical ICUs. Fellow of the American College of Chest Physicians (FCCP) and Harvard CME guest lecturer."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: Pathophysiology & Low Tidal Volume Titration",
        duration: "2.5 Hours",
        lessons: [
          { id: "l1_1", title: "The Baby Lung Concept & Volutrauma Prevention", duration: "40 min", type: "video", contentPreview: "Why normal lung volumes in ARDS represent severely reduced functional alveolar capacity." },
          { id: "l1_2", title: "Predicted Body Weight vs Actual Weight Calculation", duration: "45 min", type: "interactive_case", contentPreview: "Calculating PBW in male and female patients to avoid ventilator-induced lung injury (VILI)." },
          { id: "l1_3", title: "Knowledge Evaluation: Driving Pressure Math", duration: "30 min", type: "quiz", contentPreview: "Interactive quiz calculating Delta P = Pplat - PEEP." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: PROSEVA Prone Protocol & Recruitment Maneuvers",
        duration: "3 Hours",
        lessons: [
          { id: "l2_1", title: "Physiological Basis of Dorsal Alveolar Recruitment", duration: "45 min", type: "video", contentPreview: "Improving V/Q matching and reducing cardiac compression of left lower lobes in prone position." },
          { id: "l2_2", title: "16-Hour Prone Maneuver Checklist", duration: "50 min", type: "interactive_case", contentPreview: "Step-by-step 5-person turn protocol and ocular pressure protection." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Weaning & Spontaneous Breathing Trials (SBT)",
        duration: "2.5 Hours",
        lessons: [
          { id: "l3_1", title: "Rapid Shallow Breathing Index (RSBI) Criteria", duration: "40 min", type: "video", contentPreview: "Utilizing f/Vt ratio < 105 to predict successful extubation." },
          { id: "l3_2", title: "Final ARDS Case Simulation Exam", duration: "35 min", type: "quiz", contentPreview: "Clinical certification case validation." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Severe ARDS Refractory Hypoxemia Ventilation Strategy",
      caseDescription: "A 48-year-old intubated male (height 175 cm, PBW 70 kg) with viral pneumonia ARDS has PaO2/FiO2 ratio of 88 mmHg on volume-control ventilation with tidal volume 500 mL, PEEP 14 cmH2O, FiO2 1.0. Plateau pressure is 33 cmH2O (Driving pressure 19 cmH2O).",
      patientVitals: {
        hr: "112 bpm",
        bp: "105/65 mmHg",
        spo2: "86% on 100% FiO2",
        rhythm: "Sinus Tachycardia with severe alveolar flooding"
      },
      prompt: "Plateau pressure exceeds 30 cmH2O and driving pressure is 19 cmH2O. Which evidence-based intervention bundle significantly reduces 28-day mortality?",
      options: [
        {
          id: "opt1",
          text: "Decrease tidal volume to 420 mL (6 mL/kg PBW) to lower driving pressure <=14 cmH2O and initiate prone position ventilation for 16 consecutive hours.",
          isCorrect: true,
          explanation: "In severe ARDS (P/F < 150), reducing tidal volume to 6 mL/kg PBW combined with 16-hour prone positioning (PROSEVA trial) demonstrates proven survival benefit."
        },
        {
          id: "opt2",
          text: "Increase tidal volume to 650 mL to wash out carbon dioxide and increase minute ventilation.",
          isCorrect: false,
          explanation: "Increasing tidal volumes causes massive volutrauma, barotrauma, and increases mortality."
        },
        {
          id: "opt3",
          text: "Instantly discontinue PEEP to zero cmH2O (ZEEP) to prevent hemodynamic collapse.",
          isCorrect: false,
          explanation: "Removing PEEP in severe ARDS causes immediate alveolar derecruitment and life-threatening hypoxemia."
        },
        {
          id: "opt4",
          text: "Administer 1000 mL bolus of normal saline to improve oxygen delivery.",
          isCorrect: false,
          explanation: "Excessive fluids worsen pulmonary edema in ARDS. Fluid-conservative strategy improves ventilator-free days."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "HARVARD-ARDS-CME-2026",
      validity: "5 Years",
      recognizedHospitals: ["Hinduja Hospital", "Apollo Hospitals", "Fortis Escorts", "Medanta The Medicity"]
    }
  },

  // 3. DOCTOR: Emergency Sepsis Resuscitation Protocols
  "cme-sepsis-103": {
    title: "Emergency Sepsis Resuscitation Protocols",
    provider: "Johns Hopkins Medicine & Surviving Sepsis Campaign",
    category: "Emergency & Trauma",
    duration: "5 Hours",
    level: "Intermediate",
    cmeCredits: 6,
    rating: 4.9,
    reviewsCount: 980,
    enrolledCount: 3100,
    accreditedBy: "National Medical Commission & Johns Hopkins Medicine",
    accreditationBadge: "6 CME Credits • Johns Hopkins Aligned",
    summary: "Surviving Sepsis Campaign 2024: 1-hour resuscitation bundle, dynamic lactate clearance, and norepinephrine titration.",
    overview: "Comprehensive emergency management of septic shock based on the international Surviving Sepsis Campaign guidelines. Covers early blood culture acquisition, 30 mL/kg balanced crystalloids within 1 hour, target MAP >= 65 mmHg, and second-line vasopressin.",
    targetAudience: "Emergency Room Medical Officers, Acute Care Internists, and Anesthesia Residents.",
    skillsGained: ["Sepsis 1-Hour Bundle", "Dynamic Fluid Responsiveness", "Norepinephrine Titration", "Lactate Clearance Monitoring"],
    whatYouWillLearn: [
      "Implement the Surviving Sepsis 1-Hour Bundle without delay",
      "Select balanced crystalloids (Plasmalyte / Ringer Lactate) over normal saline to prevent hyperchloremic acidosis",
      "Initiate Norepinephrine as the first-line vasopressor targeting MAP >= 65 mmHg",
      "Assess dynamic fluid responsiveness using passive leg raise (PLR) or respiratory pulse pressure variation"
    ],
    instructor: {
      name: "Dr. Arun Chandran",
      role: "Head of Emergency Medicine & Trauma",
      hospital: "Fortis Hospitals, Bengaluru",
      avatarInitials: "AC",
      bio: "17+ years in trauma and emergency resuscitation. Fellow of the Royal College of Emergency Medicine (FRCEM) and international faculty."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: The Surviving Sepsis 1-Hour Bundle",
        duration: "1.5 Hours",
        lessons: [
          { id: "l1_1", title: "Lactate Measurement & Blood Cultures", duration: "30 min", type: "video", contentPreview: "Obtaining two sets of sterile blood cultures prior to antimicrobial administration." },
          { id: "l1_2", title: "Empiric Broad-Spectrum Antibiotic Urgency", duration: "35 min", type: "interactive_case", contentPreview: "Administering IV antibiotics within 60 minutes of presentation." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Hemodynamic Resuscitation & Norepinephrine",
        duration: "2 Hours",
        lessons: [
          { id: "l2_1", title: "30 mL/kg Crystalloids & Balanced vs Saline", duration: "40 min", type: "video", contentPreview: "SMART trial insights and hyperchloremic metabolic acidosis prevention." },
          { id: "l2_2", title: "First-Line Vasopressor: Norepinephrine", duration: "40 min", type: "interactive_case", contentPreview: "Early peripheral/central line initiation to restore perfusion pressure." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Refractory Shock & Corticosteroid Protocols",
        duration: "1.5 Hours",
        lessons: [
          { id: "l3_1", title: "Adding Vasopressin & Hydrocortisone 200mg/day", duration: "30 min", type: "video", contentPreview: "Indication for stress-dose steroids when norepinephrine exceeds 0.25 mcg/kg/min." },
          { id: "l3_2", title: "Sepsis Simulation Mastery Quiz", duration: "30 min", type: "quiz", contentPreview: "Scenario decision exam." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Septic Shock Refractory Hypotension Management",
      caseDescription: "A 62-year-old female presents with suspected pyelonephritis, high fever, acute confusion, and cold clammy peripheries. Initial BP is 78/42 mmHg (MAP 54 mmHg) despite 500 mL normal saline in the ambulance. Serum lactate is 4.6 mmol/L.",
      patientVitals: {
        hr: "132 bpm",
        bp: "78/42 mmHg (MAP 54 mmHg)",
        spo2: "91% on room air",
        rhythm: "Sinus Tachycardia, Lactate 4.6 mmol/L"
      },
      prompt: "Initial bolus did not restore MAP. Blood cultures are drawn. What is the immediate evidence-based action mandated by the Sepsis 1-hour bundle?",
      options: [
        {
          id: "opt1",
          text: "Administer balanced crystalloids at 30 mL/kg within 1 hour, start Norepinephrine infusion immediately to target MAP >= 65 mmHg, and infuse broad-spectrum IV antibiotics within 60 minutes.",
          isCorrect: true,
          explanation: "Surviving Sepsis guidelines mandate early vasopressors if MAP < 65 mmHg while 30 mL/kg fluid is completing, plus broad-spectrum antibiotics within 1 hour of recognition."
        },
        {
          id: "opt2",
          text: "Withhold all vasopressors and infuse 6 liters of 0.9% normal saline over 12 hours before reassessing.",
          isCorrect: false,
          explanation: "Excessive unmonitored saline causes hyperchloremic renal injury and worsening pulmonary edema."
        },
        {
          id: "opt3",
          text: "Start Dopamine as the first-choice vasopressor because of its renal vasodilatory benefits.",
          isCorrect: false,
          explanation: "Dopamine is associated with significantly higher tachyarrhythmias and mortality compared to Norepinephrine."
        },
        {
          id: "opt4",
          text: "Immediately intubate and place the patient on 100% oxygen without addressing perfusion pressure.",
          isCorrect: false,
          explanation: "Sedation and positive pressure ventilation during profound shock cause catastrophic cardiovascular collapse unless hemodynamics are stabilized first."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "JHU-SEPSIS-2026",
      validity: "4 Years",
      recognizedHospitals: ["Fortis Healthcare", "Narayana Health", "Aster DM Healthcare"]
    }
  },

  // 4. DOCTOR: Antimicrobial Stewardship in Hospital Inpatients
  "cme-ams-104": {
    title: "Antimicrobial Stewardship in Hospital Inpatients",
    provider: "AIIMS New Delhi & ICMR Stewardship Division",
    category: "Clinical Pharmacology",
    duration: "6 Hours",
    level: "Advanced",
    cmeCredits: 5,
    rating: 4.88,
    reviewsCount: 760,
    enrolledCount: 2280,
    accreditedBy: "National Medical Commission & AIIMS New Delhi",
    accreditationBadge: "5 CME Credits • AIIMS Aligned",
    summary: "AIIMS New Delhi / ICMR: Rational empiric prescribing, de-escalation strategies, and combating carbapenem-resistant enterobacteriaceae (CRE).",
    overview: "Curriculum authored by infectious disease specialists at AIIMS New Delhi. Teaches clinical doctors and residents how to optimize surgical antibiotic prophylaxis, de-escalate broad-spectrum reserve agents (Meropenem, Colistin), and preserve hospital antibiograms.",
    targetAudience: "Physicians, Surgeons, Hospital Microbiologists, and Clinical Pharmacists.",
    skillsGained: ["Carbapenem De-Escalation", "Hospital Antibiogram Interpretation", "Surgical Prophylaxis Guidelines", "Therapeutic Vancomycin Protocols"],
    whatYouWillLearn: [
      "Interpret automated microbiology culture susceptibility panels and MIC values accurately",
      "Execute timely de-escalation from empiric carbapenems within 48-72 hours",
      "Restrict duration of surgical prophylaxis to 24 hours post-operatively in accordance with WHO guidelines",
      "Implement multi-disciplinary antibiotic stewardship time-outs in hospital clinical rounds"
    ],
    instructor: {
      name: "Dr. Meera Krishnaswamy",
      role: "Professor & Chair of Hospital Infection Control",
      hospital: "AIIMS New Delhi",
      avatarInitials: "MK",
      bio: "20+ years spearheading ICMR antimicrobial resistance surveillance networks and national clinical prescribing guidelines."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: Principles of Antimicrobial Stewardship",
        duration: "2 Hours",
        lessons: [
          { id: "l1_1", title: "Empiric vs Definitive Antimicrobial Therapy", duration: "35 min", type: "video", contentPreview: "Establishing infectious focus before empiric therapy." },
          { id: "l1_2", title: "The 48-Hour Antimicrobial Time-Out", duration: "40 min", type: "interactive_case", contentPreview: "Structured clinical reassessment when cultures return." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Combating Multi-Drug Resistant Pathogens",
        duration: "2 Hours",
        lessons: [
          { id: "l2_1", title: "CRE, MRSA, and VRE Treatment Strategies", duration: "45 min", type: "video", contentPreview: "Reserve agent utilization policies." },
          { id: "l2_2", title: "Dose Optimization: Extended Infusion Beta-Lactams", duration: "35 min", type: "interactive_case", contentPreview: "Time-dependent killing and 3-hour Meropenem infusions." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Surgical Site Prophylaxis & Antibiograms",
        duration: "2 Hours",
        lessons: [
          { id: "l3_1", title: "WHO Surgical Prophylaxis Timings", duration: "35 min", type: "video", contentPreview: "Pre-incision timing (within 60 minutes) and stopping within 24h." },
          { id: "l3_2", title: "Stewardship Case Exam", duration: "30 min", type: "quiz", contentPreview: "Prescribing decision scenarios." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Antimicrobial De-Escalation Decision",
      caseDescription: "A 58-year-old postoperative patient 4 days following uncomplicated emergency appendectomy is on empiric IV Meropenem 1g q8h. Peritoneal fluid cultures grow E. coli with susceptibility to Ceftriaxone, Piperacillin-Tazobactam, and Ciprofloxacin. Patient has been afebrile for 48 hours with normal WBC.",
      patientVitals: {
        hr: "76 bpm",
        bp: "122/78 mmHg",
        spo2: "98% on room air",
        rhythm: "Normal Sinus Rhythm, Afebrile (36.8 °C)"
      },
      prompt: "Microbiology culture demonstrates pan-sensitive E. coli. What is the correct antimicrobial stewardship action?",
      options: [
        {
          id: "opt1",
          text: "De-escalate immediately from Meropenem to targeted IV Ceftriaxone 1g daily, plan for oral switch, and preserve carbapenem class susceptibility.",
          isCorrect: true,
          explanation: "Continuing Meropenem when a narrower first-line agent is fully sensitive promotes carbapenem-resistant organisms (CRE) and increases C. difficile risk."
        },
        {
          id: "opt2",
          text: "Continue Meropenem for a mandatory 14-day course and add IV Colistin to prevent resistance.",
          isCorrect: false,
          explanation: "Adding Colistin unnecessarily causes extreme nephrotoxicity without clinical indication."
        },
        {
          id: "opt3",
          text: "Stop all antibiotics immediately and repeat blood cultures every 6 hours.",
          isCorrect: false,
          explanation: "The documented infection still warrants completing an appropriate targeted course of narrow-spectrum antibiotics."
        },
        {
          id: "opt4",
          text: "Switch to oral Vancomycin and IV Linezolid.",
          isCorrect: false,
          explanation: "Vancomycin and Linezolid have zero activity against gram-negative bacilli such as E. coli."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "AIIMS-AMS-CME-2026",
      validity: "5 Years",
      recognizedHospitals: ["AIIMS New Delhi", "CMC Vellore", "PGIMER Chandigarh", "Tata Memorial Hospital"]
    }
  },

  // 5. NURSE: AHA Advanced Cardiovascular Life Support (ACLS) Core
  "cme-acls-201": {
    title: "AHA Advanced Cardiovascular Life Support (ACLS) Core",
    provider: "AHA & Indian Resuscitation Council (IRC) Network",
    category: "Nursing Essentials",
    duration: "8 Hours",
    level: "Intermediate",
    cmeCredits: 8,
    rating: 4.98,
    reviewsCount: 2890,
    enrolledCount: 6420,
    accreditedBy: "American Heart Association Guidelines & Indian Nursing Council (INC)",
    accreditationBadge: "8 CME Credits • AHA Aligned",
    summary: "High-quality resuscitation, shockable rhythm defibrillation, post-cardiac arrest ROSC care, and Code Blue team dynamics.",
    overview: "Designed for bedside staff nurses and ICU nurses. Focuses on high-performance CPR (100-120/min at 5-6 cm depth with full chest recoil), rapid rhythm recognition (VF, pVT, Asystole, PEA), synchronized cardioversion vs defibrillation, and post-ROSC stabilization.",
    targetAudience: "Staff Nurses, ICU Nurses, Emergency Triage Nurses, and Operating Theater Nurses.",
    skillsGained: ["High-Quality Chest Compressions", "Biphasic Defibrillation 200J", "Epinephrine & Amiodarone Administration", "Code Blue Closed-Loop Teamwork"],
    whatYouWillLearn: [
      "Deliver uninterrupted chest compressions with compression fraction > 80%",
      "Operate manual biphasic defibrillators safely with clear verbal countdowns",
      "Administer ACLS arrest drugs: Epinephrine 1 mg IV q3-5m and Amiodarone 300 mg / 150 mg boluses",
      "Manage ROSC (Return of Spontaneous Circulation): targeted temperature management and 12-lead ECG"
    ],
    instructor: {
      name: "Sister Anitha Mary",
      role: "Lead Critical Care Nurse Educator & AHA Regional Faculty",
      hospital: "Christian Medical College (CMC), Vellore",
      avatarInitials: "AM",
      bio: "19+ years in adult cardiothoracic ICU nursing. Certified AHA regional ACLS/BLS instructor who has trained over 5,000 nursing professionals across India."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: High-Performance Resuscitation & BLS Refresh",
        duration: "2.5 Hours",
        lessons: [
          { id: "l1_1", title: "Chest Compression Metrics & Metronome Coaching", duration: "40 min", type: "video", contentPreview: "Ensuring 100-120 bpm, 5-6 cm depth, and complete chest recoil." },
          { id: "l1_2", title: "Shockable Rhythms: VF and Pulseless VT", duration: "45 min", type: "interactive_case", contentPreview: "Recognizing coarse VF and pulseless ventricular tachycardia." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Defibrillation & Pharmacology Algorithm",
        duration: "3 Hours",
        lessons: [
          { id: "l2_1", title: "Biphasic Energy Settings (200 Joules) & Safety Clear", duration: "45 min", type: "video", contentPreview: "Verifying physical oxygen source detachment and safety countdown." },
          { id: "l2_2", title: "Drug Administration Sequence: Epinephrine & Amiodarone", duration: "45 min", type: "interactive_case", contentPreview: "IV/IO push followed by 20 mL saline flush and limb elevation." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Non-Shockable Rhythms & Post-ROSC Protocol",
        duration: "2.5 Hours",
        lessons: [
          { id: "l3_1", title: "Asystole and PEA: The 5 Hs and 5 Ts", duration: "40 min", type: "video", contentPreview: "Treating reversible etiologies including hypovolemia, hypoxia, and tension pneumothorax." },
          { id: "l3_2", title: "ACLS Practical Simulation Exam", duration: "35 min", type: "quiz", contentPreview: "Final resuscitation scenario test." }
        ]
      }
    ],
    clinicalScenario: {
      title: "In-Hospital Cardiac Arrest Code Blue Shockable Algorithm",
      caseDescription: "During morning ward rounds, an adult telemetry patient suddenly becomes unresponsive, pulseless, and apneic. The crash cart is wheeled to the bedside. The monitor leads are attached, showing coarse Ventricular Fibrillation. High-quality CPR is in progress.",
      patientVitals: {
        hr: "0 bpm (No pulse)",
        bp: "Unrecordable",
        spo2: "Unrecordable",
        rhythm: "Coarse Ventricular Fibrillation (VF)"
      },
      prompt: "Monitor shows coarse Ventricular Fibrillation. What is the exact defibrillation and medication sequence according to AHA ACLS guidelines?",
      options: [
        {
          id: "opt1",
          text: "Deliver immediate unsynchronized biphasic shock at 200J, immediately resume 2 minutes of continuous CPR before pulse check, secure IV/IO access, and prepare Epinephrine 1 mg after the second shock.",
          isCorrect: true,
          explanation: "In shockable rhythms (VF/pVT), immediate defibrillation is paramount. CPR must resume immediately after the shock without pausing for pulse checks until 2 minutes are completed."
        },
        {
          id: "opt2",
          text: "Administer 1 mg Epinephrine IV push before delivering any electrical shocks.",
          isCorrect: false,
          explanation: "In VF/pVT, defibrillation is the primary treatment. First dose of Epinephrine is given only after the 2nd shock."
        },
        {
          id: "opt3",
          text: "Switch defibrillator to Synchronized mode and deliver 50 Joules.",
          isCorrect: false,
          explanation: "Ventricular Fibrillation has no R-waves; a synchronized shock will fail to discharge. Unsynchronized defibrillation is required."
        },
        {
          id: "opt4",
          text: "Pause chest compressions and await an emergency 12-lead ECG machine before shocking.",
          isCorrect: false,
          explanation: "Pausing CPR or waiting for a 12-lead ECG causes severe brain ischemia and death."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "CMC-AHA-ACLS-2026",
      validity: "2 Years",
      recognizedHospitals: ["CMC Vellore", "Apollo Hospitals", "Fortis Healthcare", "Manipal Hospitals"]
    }
  },

  // 6. NURSE: ICU Hemodynamic Monitoring & Arterial Line Care
  "cme-hemo-202": {
    title: "ICU Hemodynamic Monitoring & Arterial Line Care",
    provider: "King’s College London & British Association of Critical Care Nurses",
    category: "Critical Care",
    duration: "6 Hours",
    level: "Advanced",
    cmeCredits: 6,
    rating: 4.92,
    reviewsCount: 1120,
    enrolledCount: 3450,
    accreditedBy: "Indian Nursing Council & King's College Critical Care Network",
    accreditationBadge: "6 CME Credits • King's College Aligned",
    summary: "Arterial line cannulation maintenance, damping coefficient tests, CVP wave analysis, and vasoactive titration.",
    overview: "Empowers critical care nurses to master invasive pressure monitoring lines. Covers radial arterial catheter asepsis, transducer leveling at the phlebostatic axis (4th intercostal space, mid-axillary line), dynamic square wave flush testing, and vasopressor titration.",
    targetAudience: "ICU Staff Nurses, Cath Lab Nurses, and Post-Anesthesia Care Unit (PACU) Nurses.",
    skillsGained: ["Arterial Line Calibration", "Square-Wave Fast Flush Test", "Phlebostatic Axis Leveling", "Invasive CVP Waveform Analysis"],
    whatYouWillLearn: [
      "Zero and level pressure transducers to the phlebostatic axis with zero hydrostatic errors",
      "Perform fast-flush tests to identify over-damped and under-damped arterial waveforms",
      "Prevent catastrophic arterial line complications including air emboli and limb ischemia",
      "Titrate Norepinephrine and Vasopressin based on continuous real-time MAP parameters"
    ],
    instructor: {
      name: "Sister Deepa Philip",
      role: "Lead Nurse Specialist in Intensive Care",
      hospital: "King's College Hospital NHS Foundation Trust",
      avatarInitials: "DP",
      bio: "16+ years in adult cardiothoracic and liver ICUs. Lead trainer in invasive hemodynamic line monitoring and sepsis resuscitation."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: Transducer Physics & The Phlebostatic Axis",
        duration: "2 Hours",
        lessons: [
          { id: "l1_1", title: "Anatomy of Radial Arterial Catheter Lines", duration: "35 min", type: "video", contentPreview: "Continuous heparinized flush pressure bags (300 mmHg)." },
          { id: "l1_2", title: "Zeroing to Atmospheric Pressure & Leveling", duration: "40 min", type: "interactive_case", contentPreview: "Eliminating hydrostatic height artifacts." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Waveform Troubleshooting & Square Wave Tests",
        duration: "2 Hours",
        lessons: [
          { id: "l2_1", title: "Over-damping vs Under-damping Identification", duration: "45 min", type: "video", contentPreview: "Distinguishing catheter blood clots and air bubbles from vascular compliance artifacts." },
          { id: "l2_2", title: "Fast-Flush Dynamic Response Test", duration: "35 min", type: "interactive_case", contentPreview: "Analyzing oscillations after release of the flush valve." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Line Safety & Complication Prevention",
        duration: "2 Hours",
        lessons: [
          { id: "l3_1", title: "Preventing Accidental Arterial Drug Injections", duration: "35 min", type: "video", contentPreview: "Red labeling, luer-lock integrity, and limb perfusion checks." },
          { id: "l3_2", title: "Mastery Case Assessment", duration: "30 min", type: "quiz", contentPreview: "Scenario analysis on arterial waveforms." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Arterial Line Waveform Damping Troubleshooting",
      caseDescription: "An ICU nurse notices that the radial arterial line of a septic shock patient suddenly displays a slurred, rounded waveform with no visible dicrotic notch. The monitor alarm sounds showing BP 74/42 mmHg, while an automated non-invasive cuff on the other arm reads 108/68 mmHg.",
      patientVitals: {
        hr: "96 bpm",
        bp: "74/42 mmHg (Over-damped A-line)",
        spo2: "96% on 2L nasal prongs",
        rhythm: "Sinus Rhythm with loss of dicrotic notch"
      },
      prompt: "The invasive arterial waveform is severely over-damped compared to non-invasive measurements. What is the correct initial bedside troubleshooting sequence?",
      options: [
        {
          id: "opt1",
          text: "Check line for air bubbles or micro-thrombi, perform a fast-flush square wave test, verify pressure bag is inflated to 300 mmHg, inspect tubing kinks, and confirm transducer leveling at the phlebostatic axis.",
          isCorrect: true,
          explanation: "Over-damping causes falsely low systolic and falsely high diastolic pressures. Flushing air bubbles, clearing micro-clots, and ensuring 300 mmHg flush pressure restores waveform fidelity."
        },
        {
          id: "opt2",
          text: "Immediately double the Norepinephrine infusion rate based on the low A-line systolic reading.",
          isCorrect: false,
          explanation: "Titrating vasopressors to an over-damped artifactual pressure can cause severe hypertension and peripheral gangrene."
        },
        {
          id: "opt3",
          text: "Inject 50 mg of IV tissue plasminogen activator (tPA) directly through the radial line.",
          isCorrect: false,
          explanation: "Injecting thrombolytics through an arterial line is dangerous and contraindicated."
        },
        {
          id: "opt4",
          text: "Turn off the monitor alarms and silence the line without inspection.",
          isCorrect: false,
          explanation: "Silencing alarms without troubleshooting puts patient safety at critical risk."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "KINGS-ICU-HEMO-2026",
      validity: "3 Years",
      recognizedHospitals: ["Apollo Hospitals", "King's College Hospital", "Max Healthcare"]
    }
  },

  // 7. NURSE: NABH Central Line (CLABSI) Infection Prevention
  "cme-clabsi-203": {
    title: "NABH Central Line (CLABSI) Infection Prevention",
    provider: "NABH Quality Standards & CDC Infection Control",
    category: "Nursing Essentials",
    duration: "4 Hours",
    level: "Intermediate",
    cmeCredits: 4,
    rating: 4.94,
    reviewsCount: 840,
    enrolledCount: 2900,
    accreditedBy: "National Accreditation Board for Hospitals (NABH) & INC",
    accreditationBadge: "4 CME Credits • NABH Certified",
    summary: "NABH 5th Edition & CDC Guidelines: Maximum sterile barrier precautions, chlorhexidine dressing protocols, and daily central line necessity audits.",
    overview: "Evidence-based training on eliminating central line-associated bloodstream infections. Features chlorhexidine skin antisepsis, biopatch sponge application, needle-free connector scrubbing for 15 seconds, and daily multidisciplinary line necessity rounds.",
    targetAudience: "Staff Nurses, Infection Control Link Nurses, ICU Ward Sisters, and Nurse Supervisors.",
    skillsGained: ["Central Line Insertion Bundle", "Chlorhexidine Dressing Change", "Needleless Hub Scrubbing (15s)", "Daily Line Necessity Audits"],
    whatYouWillLearn: [
      "Enforce maximum sterile barrier precautions (full-body drape, sterile gown, cap, mask, gloves)",
      "Perform transparent semipermeable dressing changes every 7 days (or immediately if damp/soiled)",
      "Execute the 'Scrub the Hub' technique with 70% alcohol for 15 full seconds",
      "Conduct daily assessments to remove unnecessary catheters at the earliest possible hour"
    ],
    instructor: {
      name: "Dr. S. K. Narayanan",
      role: "Lead NABH Quality Assessor & Medical Director",
      hospital: "Apollo Hospitals Enterprise, Chennai",
      avatarInitials: "SN",
      bio: "24+ years experience in hospital quality, clinical governance, and national NABH hospital accreditations."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: The Central Line Insertion Bundle",
        duration: "1.5 Hours",
        lessons: [
          { id: "l1_1", title: "Maximum Sterile Barriers & Site Selection", duration: "35 min", type: "video", contentPreview: "Why subclavian lines have lower infection rates than femoral lines." },
          { id: "l1_2", title: "2% Chlorhexidine in 70% Alcohol Prep", duration: "35 min", type: "interactive_case", contentPreview: "Friction scrubbing technique and complete 2-minute air drying." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Maintenance Bundle & Hub Hygiene",
        duration: "1.5 Hours",
        lessons: [
          { id: "l2_1", title: "15-Second Hub Scrubbing Standard", duration: "35 min", type: "video", contentPreview: "Needleless connector mechanical friction scrubbing." },
          { id: "l2_2", title: "Chlorhexidine-Impregnated Biopatch Placement", duration: "35 min", type: "interactive_case", contentPreview: "Proper orientation with blue grid side facing up." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Daily Review & Timely Removal",
        duration: "1 Hour",
        lessons: [
          { id: "l3_1", title: "Daily Line Audit Protocols", duration: "30 min", type: "video", contentPreview: "Promoting early removal when vascular access is no longer needed." },
          { id: "l3_2", title: "NABH CLABSI Certification Quiz", duration: "25 min", type: "quiz", contentPreview: "Checklist audit exam." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Daily ICU Central Line Necessity Audit",
      caseDescription: "During morning multidisciplinary rounds, the ICU charge nurse evaluates a 65-year-old postoperative patient who had an internal jugular central venous catheter inserted 7 days ago. The patient is now tolerating full enteral nutrition, hemodynamically stable without vasopressors, and peripheral veins are healthy.",
      patientVitals: {
        hr: "78 bpm",
        bp: "118/76 mmHg",
        spo2: "99% on room air",
        rhythm: "Normal Sinus Rhythm, Day 7 Internal Jugular CVC"
      },
      prompt: "The patient is stable with no active vasoactive or parenteral nutrition needs. What is the single most effective intervention to prevent CLABSI?",
      options: [
        {
          id: "opt1",
          text: "Recommend immediate removal of the central venous line, as prompt discontinuation when no longer essential is the single most proven intervention to eliminate CLABSI.",
          isCorrect: true,
          explanation: "Guidelines emphasize that daily review and immediate removal of non-essential central catheters is the most effective CLABSI prevention strategy."
        },
        {
          id: "opt2",
          text: "Leave the central line in place for another 14 days just in case routine blood draws are requested.",
          isCorrect: false,
          explanation: "Keeping lines solely for blood draws drastically elevates catheter colonization and bloodstream infection rates."
        },
        {
          id: "opt3",
          text: "Start routine prophylactic IV Vancomycin through the central line catheter.",
          isCorrect: false,
          explanation: "Prophylactic antibiotics for central lines are strictly contraindicated as they induce multi-drug resistant superinfections."
        },
        {
          id: "opt4",
          text: "Flush all lumens with 50 mL of hypertonic saline every 2 hours.",
          isCorrect: false,
          explanation: "Hypertonic saline is inappropriate for routine catheter maintenance."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "NABH-CLABSI-2026",
      validity: "3 Years",
      recognizedHospitals: ["Apollo Hospitals", "Fortis", "Aster Medcity", "CMC Vellore"]
    }
  },

  // 8. NURSE: Pediatric Advanced Life Support (PALS) Triage
  "cme-pals-204": {
    title: "Pediatric Advanced Life Support (PALS) Triage",
    provider: "Stanford Children’s Health & Indian Academy of Pediatrics",
    category: "Emergency & Trauma",
    duration: "7 Hours",
    level: "Intermediate",
    cmeCredits: 7,
    rating: 4.96,
    reviewsCount: 1040,
    enrolledCount: 3340,
    accreditedBy: "Indian Academy of Pediatrics (IAP) & Stanford Medicine",
    accreditationBadge: "7 CME Credits • Stanford Aligned",
    summary: "Stanford Children’s Health: Pediatric Glasgow Coma Scale, rapid decompensation detection, weight-based fluid resuscitation (Broselow tape), and septic shock.",
    overview: "Specialized pediatric emergency curriculum developed with Stanford Children's Health faculty. Teaches systematic pediatric assessment triangle (appearance, work of breathing, circulation to skin), Broselow color-coded resuscitation, and fluid boluses in pediatric shock.",
    targetAudience: "Pediatric Nurses, Emergency Department Nurses, and PICU Staff.",
    skillsGained: ["Pediatric Assessment Triangle (PAT)", "Broselow Length-Based Dosing", "Pediatric Intraosseous (IO) Access", "Weight-Based Fluid Resuscitation"],
    whatYouWillLearn: [
      "Rapidly evaluate pediatric patients using the Pediatric Assessment Triangle within 30 seconds",
      "Calculate 20 mL/kg isotonic fluid boluses for compensated and decompensated shock",
      "Recognize respiratory failure vs respiratory distress to prevent pediatric cardiac arrest",
      "Deliver pediatric defibrillation (2 J/kg initial, 4 J/kg subsequent) and Epinephrine dosing (0.01 mg/kg)"
    ],
    instructor: {
      name: "Dr. Gautham Menon",
      role: "Director of Pediatric Emergency Medicine",
      hospital: "Manipal Hospital, Bengaluru",
      avatarInitials: "GM",
      bio: "18+ years in pediatric emergency and PICU care. Fellow of the Indian Academy of Pediatrics (FIAP) and international PALS course coordinator."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: The Pediatric Assessment Triangle (PAT)",
        duration: "2 Hours",
        lessons: [
          { id: "l1_1", title: "Appearance, Breathing, and Circulation (PAT)", duration: "35 min", type: "video", contentPreview: "Visual assessment from the doorway before physical contact." },
          { id: "l1_2", title: "Broselow Tape Length-Based Emergency Sizing", duration: "40 min", type: "interactive_case", contentPreview: "Determining equipment size (ETT, blade) and medication doses by height." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Pediatric Shock Resuscitation",
        duration: "2.5 Hours",
        lessons: [
          { id: "l2_1", title: "Compensated vs Hypotensive Decompensated Shock", duration: "45 min", type: "video", contentPreview: "Tachycardia and prolonged capillary refill as early warning markers." },
          { id: "l2_2", title: "20 mL/kg Push-Pull Fluid Bolus Delivery", duration: "40 min", type: "interactive_case", contentPreview: "Syringe push-pull technique for rapid infusion over 5-10 minutes." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Pediatric Resuscitation & IO Access",
        duration: "2.5 Hours",
        lessons: [
          { id: "l3_1", title: "Tibial Intraosseous (IO) Needle Placement", duration: "40 min", type: "video", contentPreview: "Anteromedial flat surface of proximal tibia landmarking." },
          { id: "l3_2", title: "PALS Case Simulation Exam", duration: "35 min", type: "quiz", contentPreview: "Pediatric shock emergency exam." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Pediatric Hypovolemic Shock Fluid Resuscitation",
      caseDescription: "A 2-year-old toddler (estimated weight 12 kg) presents with 3 days of severe gastroenteritis, lethargy, sunken eyes, dry mucous membranes, and cool extremities. Capillary refill time is 4 seconds. Heart rate is 175 bpm and blood pressure is 70/40 mmHg.",
      patientVitals: {
        hr: "175 bpm (Severe Tachycardia)",
        bp: "70/40 mmHg",
        spo2: "89% on room air",
        rhythm: "Sinus Tachycardia, CRT 4s, Weight 12 kg"
      },
      prompt: "The child is in decompensated hypovolemic shock. What is the mandatory immediate fluid resuscitation protocol according to PALS guidelines?",
      options: [
        {
          id: "opt1",
          text: "Administer 20 mL/kg (240 mL) of isotonic balanced crystalloid (Normal Saline or Ringer Lactate) as a rapid push over 5-10 minutes, reassess liver size and lungs for crackles, and repeat if indicated.",
          isCorrect: true,
          explanation: "In pediatric shock, 20 mL/kg isotonic crystalloid boluses given rapidly over 5-10 minutes restore intravascular volume and prevent cardiac arrest."
        },
        {
          id: "opt2",
          text: "Start a slow maintenance infusion of 5% Dextrose at 40 mL/hour over 24 hours.",
          isCorrect: false,
          explanation: "Dextrose maintenance infusions are dangerously inadequate for acute decompensated shock and risk cerebral edema."
        },
        {
          id: "opt3",
          text: "Administer 100 mg of IV Hydrocortisone and wait 2 hours before starting IV fluids.",
          isCorrect: false,
          explanation: "Delaying fluid resuscitation in pediatric hypovolemic shock leads to irreversible organ failure."
        },
        {
          id: "opt4",
          text: "Start high-dose Epinephrine infusion immediately without giving any fluid volume.",
          isCorrect: false,
          explanation: "Vasopressors in severe uncorrected hypovolemia cause severe vasoconstriction and tissue ischemia."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "STANFORD-PALS-2026",
      validity: "2 Years",
      recognizedHospitals: ["Stanford Children's Health", "Manipal Hospitals", "Rainbow Children's Hospital"]
    }
  },

  // 9. PHARMACIST: High-Alert Medication Safety & LASA Dispensing
  "cme-lasa-301": {
    title: "High-Alert Medication Safety & LASA Dispensing",
    provider: "ISMP International & Pharmacy Council of India",
    category: "Clinical Pharmacology",
    duration: "4 Hours",
    level: "Intermediate",
    cmeCredits: 4,
    rating: 4.91,
    reviewsCount: 680,
    enrolledCount: 2150,
    accreditedBy: "Pharmacy Council of India (PCI) & ISMP Standards",
    accreditationBadge: "4 CME Credits • ISMP Aligned",
    summary: "ISMP International Standards: Tall Man lettering, independent double checks, and mitigation of Look-Alike Sound-Alike drug dispensing errors.",
    overview: "Designed for hospital pharmacists and clinical dispensing technicians. Covers high-alert medications (PINCH: Potassium, Insulin, Narcotics, Chemotherapy, Heparin), Tall Man typographical differentiation, barcode medication scanning, and independent double-check systems.",
    targetAudience: "Hospital Pharmacists, Dispensing Chemists, Clinical Pharmacologists, and Pharmacy Trainees.",
    skillsGained: ["Tall Man Lettering Protocols", "Independent Double-Check Systems", "High-Alert Drug Storage Safeguards", "Barcode Medication Verification"],
    whatYouWillLearn: [
      "Implement FDA/ISMP Tall Man lettering for dangerous look-alike drug pairs",
      "Establish strict segregation and warning auxiliary labels for concentrated electrolytes (KCl, 3% NaCl)",
      "Execute independent double-checks for high-risk medications without confirmation bias",
      "Mitigate automated dispensing cabinet (ADC) stock errors and near-miss reporting"
    ],
    instructor: {
      name: "Prof. S. Parthasarathy",
      role: "Lead Hospital Pharmacist & Academic Dean",
      hospital: "Sri Ramachandra Institute of Higher Education, Chennai",
      avatarInitials: "SP",
      bio: "25+ years in hospital pharmacy operations, medication safety committees, and curriculum development for the Pharmacy Council of India."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: The Biology of Medication Errors & LASA Pairs",
        duration: "1.5 Hours",
        lessons: [
          { id: "l1_1", title: "Cognitive Traps & Look-Alike Sound-Alike Risks", duration: "35 min", type: "video", contentPreview: "Analysis of hydrALAZINE vs hydrOXYzine and celeXHA vs celeBREX." },
          { id: "l1_2", title: "FDA and ISMP Tall Man Standardized Lists", duration: "35 min", type: "interactive_case", contentPreview: "Applying capitalized lettering to highlight differences." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: High-Alert Medication Guardrails (PINCH)",
        duration: "1.5 Hours",
        lessons: [
          { id: "l2_1", title: "Concentrated Potassium Chloride Safety Bans", duration: "35 min", type: "video", contentPreview: "Eliminating undiluted potassium vials from patient care units." },
          { id: "l2_2", title: "Independent Double-Check Protocols", duration: "35 min", type: "interactive_case", contentPreview: "Separate calculations by two licensed practitioners." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Technology Safeguards & Reporting",
        duration: "1 Hour",
        lessons: [
          { id: "l3_1", title: "Barcode Medication Administration (BCMA)", duration: "30 min", type: "video", contentPreview: "Scanning patient wristband and medication package." },
          { id: "l3_2", title: "Dispensing Safety Mastery Exam", duration: "25 min", type: "quiz", contentPreview: "Error interception simulation." }
        ]
      }
    ],
    clinicalScenario: {
      title: "High-Alert LASA Dispensing Interception",
      caseDescription: "A clinical pharmacist reviews an electronic physician order for an elderly patient with severe essential hypertension. The order reads 'Hydralazine 25 mg PO TID'. In the outpatient pharmacy bin, the technician accidentally places a strip of 'Hydroxyzine 25 mg' into the dispensing tray.",
      patientVitals: {
        hr: "82 bpm",
        bp: "172/96 mmHg (Severe Hypertension)",
        spo2: "98% on room air",
        rhythm: "Regular, History of Stroke"
      },
      prompt: "The patient requires urgent blood pressure control. What pharmacy safety system is required to intercept this fatal LASA dispensing error before the medication leaves the pharmacy?",
      options: [
        {
          id: "opt1",
          text: "Implement ISMP Tall Man lettering (hydrALAZINE vs hydrOXYzine), enforce mandatory barcode scanning at the dispensing station, and store the two medications in physically separated bins with red warning labels.",
          isCorrect: true,
          explanation: "Tall Man lettering highlights differences in look-alike sound-alike drug names, while barcode scanning provides electronic verification to eliminate human confirmation bias."
        },
        {
          id: "opt2",
          text: "Dispense the Hydroxyzine because both medications lower blood pressure equally.",
          isCorrect: false,
          explanation: "Hydroxyzine is an antihistamine with sedating properties; it does not treat hypertension and will leave the patient at risk of hypertensive stroke."
        },
        {
          id: "opt3",
          text: "Rely solely on the patient or family member to notice the difference on the packaging.",
          isCorrect: false,
          explanation: "Patients cannot be expected to recognize complex pharmacological errors; clinical pharmacy is the primary defense line."
        },
        {
          id: "opt4",
          text: "Advise the physician to discontinue all oral antihypertensive medications permanently.",
          isCorrect: false,
          explanation: "Abrupt cessation of antihypertensives causes severe rebound hypertensive crises."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "PCI-ISMP-LASA-2026",
      validity: "3 Years",
      recognizedHospitals: ["Apollo Hospitals", "Sri Ramachandra Hospital", "Manipal Health"]
    }
  },

  // 10. PHARMACIST: Chemotherapy Admixture & Cytotoxic Safety
  "cme-chemo-302": {
    title: "Chemotherapy Admixture & Cytotoxic Safety",
    provider: "Tata Memorial Centre & World Health Organization",
    category: "Clinical Pharmacology",
    duration: "6 Hours",
    level: "Advanced",
    cmeCredits: 6,
    rating: 4.97,
    reviewsCount: 890,
    enrolledCount: 2680,
    accreditedBy: "Pharmacy Council of India & Tata Memorial Centre",
    accreditationBadge: "6 CME Credits • Tata Memorial Aligned",
    summary: "Tata Memorial Centre & WHO: Class II Type B2 Biological Safety Cabinets (BSC), hazardous drug spill kits, and extravasation management.",
    overview: "Comprehensive oncology pharmacy certification curriculum. Focuses on safe preparation of antineoplastic agents in negative-pressure cleanrooms, closed-system transfer devices (CSTD), hazardous chemical personal protective equipment, and cytotoxic spill containment.",
    targetAudience: "Oncology Pharmacists, Cleanroom Compounding Technicians, and Cancer Hospital Nurses.",
    skillsGained: ["Class II Type B2 BSC Operation", "Closed-System Drug-Transfer Devices", "Cytotoxic Spill Neutralization", "Chemotherapy Extravasation Antidotes"],
    whatYouWillLearn: [
      "Operate Class II Type B2 100% total-exhaust laminar biological safety cabinets safely",
      "Utilize Closed System Drug-Transfer Devices (CSTD) to prevent aerosolization of volatile drugs",
      "Deploy hospital cytotoxic spill kits with Chemo-Sorb absorbent pads and neutralizing reagents",
      "Prepare specific antidotes for vesicant extravasation (Dexrazoxane for anthracyclines, Hyaluronidase for vinca alkaloids)"
    ],
    instructor: {
      name: "Dr. Kavitha Ramesh",
      role: "Senior Clinical Oncology Pharmacist",
      hospital: "Tata Memorial Centre, Mumbai",
      avatarInitials: "KR",
      bio: "17+ years in clinical oncology, chemotherapy compounding cleanroom protocols, and national guideline formulation with the WHO."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: Cleanroom Engineering & Laminar Hood Physics",
        duration: "2 Hours",
        lessons: [
          { id: "l1_1", title: "ISO Class 5 Environments & Negative Pressure Hoods", duration: "40 min", type: "video", contentPreview: "Differences between positive pressure IV rooms and negative pressure cytotoxic rooms." },
          { id: "l1_2", title: "Personal Protective Equipment: Double Chemo-Gloves", duration: "35 min", type: "interactive_case", contentPreview: "ASTM D6978 tested gloves and lint-free impermeable gowns." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Aseptic Reconstitution & CSTD Technology",
        duration: "2 Hours",
        lessons: [
          { id: "l2_1", title: "Pressure Equalization and Closed-System Transfer", duration: "45 min", type: "video", contentPreview: "Eliminating vapor escape during needle withdrawal." },
          { id: "l2_2", title: "Light-Sensitive & Vesicant Drug Packaging", duration: "35 min", type: "interactive_case", contentPreview: "Amber bag protection and clear high-visibility hazardous labeling." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Spill Containment & Extravasation Protocols",
        duration: "2 Hours",
        lessons: [
          { id: "l3_1", title: "Cytotoxic Spill Kit Deployment Step-by-Step", duration: "40 min", type: "video", contentPreview: "Isolating area, absorbent sheets, and waste disposal in cytotoxic yellow bins." },
          { id: "l3_2", title: "Oncology Pharmacy Certification Exam", duration: "35 min", type: "quiz", contentPreview: "Safety and compounding calculation exam." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Cytotoxic Cleanroom Spill Containment Protocol",
      caseDescription: "During reconstitution of Doxorubicin (anthracycline vesicant) inside a Class II Type B2 Biological Safety Cabinet (BSC), a glass vial accidentally fractures, spilling approximately 15 mL of bright red cytotoxic solution onto the stainless steel work surface.",
      patientVitals: {
        hr: "N/A",
        bp: "N/A",
        spo2: "N/A",
        rhythm: "Cleanroom Negative Pressure Exhaust Active"
      },
      prompt: "A hazardous cytotoxic spill has occurred inside the BSC. What is the mandatory immediate action sequence according to OSHA and Tata Memorial safety protocols?",
      options: [
        {
          id: "opt1",
          text: "Keep the BSC exhaust blower running to preserve negative containment, isolate the room, don full PPE (respirator, double chemo gloves, gown), and use the specialized cytotoxic spill kit to absorb from outside inward.",
          isCorrect: true,
          explanation: "Never turn off the BSC blower during a spill because the negative pressure prevents toxic aerosols from escaping into the room. Cytotoxic absorbent pads absorb from the perimeter inward."
        },
        {
          id: "opt2",
          text: "Immediately turn off the biological cabinet exhaust fans and wipe the red solution with standard paper towels.",
          isCorrect: false,
          explanation: "Turning off the exhaust allows toxic antineoplastic vapors to disperse throughout the pharmacy."
        },
        {
          id: "opt3",
          text: "Flush the spill with 2 liters of tap water down the laboratory sink.",
          isCorrect: false,
          explanation: "Dumping cytotoxic agents into municipal drains is a hazardous environmental violation."
        },
        {
          id: "opt4",
          text: "Leave the hood uncleaned until the next morning cleaning shift arrives.",
          isCorrect: false,
          explanation: "Delaying cleanup increases contamination risks and damages laboratory ventilation equipment."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "TMC-CHEMO-PHARM-2026",
      validity: "3 Years",
      recognizedHospitals: ["Tata Memorial Hospital", "Adyar Cancer Institute", "Apollo Cancer Centres"]
    }
  },

  // 11. PHARMACIST: Clinical Pharmacokinetics & Therapeutic Drug Monitoring
  "cme-tdm-303": {
    title: "Clinical Pharmacokinetics & Therapeutic Drug Monitoring",
    provider: "Manipal Academy of Higher Education & Clinical Pharmacokinetics Society",
    category: "Clinical Pharmacology",
    duration: "5 Hours",
    level: "Advanced",
    cmeCredits: 5,
    rating: 4.89,
    reviewsCount: 620,
    enrolledCount: 1940,
    accreditedBy: "Pharmacy Council of India & Manipal Academy",
    accreditationBadge: "5 CME Credits • Manipal Aligned",
    summary: "Manipal Pharmacy / AIIMS: Therapeutic drug monitoring of Vancomycin, Aminoglycosides, and Digoxin, targeting AUC/MIC and peak-trough kinetics.",
    overview: "Advanced pharmacokinetics curriculum designed for hospital clinical pharmacists. Covers AUC24/MIC ratio targets (400-600) for Vancomycin, once-daily high-dose Aminoglycoside nomograms (Hartford nomogram), and Digoxin therapeutic ranges.",
    targetAudience: "Clinical Pharmacists, ICU Pharmacotherapists, and Nephrology Residents.",
    skillsGained: ["AUC/MIC Vancomycin Calculations", "Aminoglycoside Hartford Nomogram", "Renal Clearance Dose Adjustments", "Drug-Drug Interaction Mitigation"],
    whatYouWillLearn: [
      "Calculate 24-hour area under the curve (AUC24) to optimize bactericidal efficacy of Vancomycin",
      "Interpret true steady-state serum trough concentrations drawn 30 minutes prior to the 4th dose",
      "Apply the Cockcroft-Gault equation to adjust loading and maintenance doses in renal impairment",
      "Prevent nephrotoxicity when combining glycopeptides with aminoglycosides or loop diuretics"
    ],
    instructor: {
      name: "Dr. Anandhu Nair",
      role: "Clinical Pharmacology Specialist & Associate Professor",
      hospital: "Manipal College of Pharmaceutical Sciences",
      avatarInitials: "AN",
      bio: "14+ years in hospital pharmacokinetics, antimicrobial stewardship, and clinical pharmacotherapy teaching."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: Vancomycin AUC24/MIC Dosing Consensus",
        duration: "1.5 Hours",
        lessons: [
          { id: "l1_1", title: "Why Trough-Only Dosing Causes Nephrotoxicity", duration: "35 min", type: "video", contentPreview: "Targeting AUC/MIC 400-600 vs traditional high troughs of 15-20 mcg/mL." },
          { id: "l1_2", title: "Two-Point Pharmacokinetic Sampling Calculations", duration: "40 min", type: "interactive_case", contentPreview: "Calculating patient-specific elimination rate constant (ke) and volume of distribution (Vd)." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Aminoglycosides Extended-Interval Dosing",
        duration: "2 Hours",
        lessons: [
          { id: "l2_1", title: "Hartford Nomogram & Concentration-Dependent Killing", duration: "40 min", type: "video", contentPreview: "Maximizing peak/MIC ratios while ensuring drug-free wash-out periods." },
          { id: "l2_2", title: "Ototoxicity & Nephrotoxicity Warning Signs", duration: "35 min", type: "interactive_case", contentPreview: "Monitoring baseline audiometry and rising serum creatinine." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Narrow Therapeutic Index Cardiovascular Drugs",
        duration: "1.5 Hours",
        lessons: [
          { id: "l3_1", title: "Digoxin Kinetics and Potassium Interactions", duration: "35 min", type: "video", contentPreview: "How hypokalemia potentiates fatal digitalis cardiotoxicity." },
          { id: "l3_2", title: "TDM Clinical Competency Exam", duration: "30 min", type: "quiz", contentPreview: "Kinetics calculation scenarios." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Vancomycin Trough Elevation & Nephrotoxicity Management",
      caseDescription: "A 64-year-old patient with hospital-acquired MRSA bacteremia has been receiving IV Vancomycin 1g q12h. A trough level drawn 30 minutes before the 4th dose returns at 26.5 mcg/mL (target 15-20 mcg/mL). Serum creatinine has acutely risen from 0.8 mg/dL to 1.9 mg/dL over 48 hours.",
      patientVitals: {
        hr: "80 bpm",
        bp: "128/78 mmHg",
        spo2: "97% on room air",
        rhythm: "Sinus Rhythm, Serum Creatinine 1.9 mg/dL (Acute Kidney Injury)"
      },
      prompt: "The patient is experiencing acute vancomycin-induced nephrotoxicity with supratherapeutic trough. What is the evidence-based clinical pharmacy recommendation?",
      options: [
        {
          id: "opt1",
          text: "Hold the scheduled dose of Vancomycin immediately, repeat serum creatinine and trough levels, and recalculate dose based on AUC/MIC targeting 400-600 with extended dosing intervals once trough falls below 15 mcg/mL.",
          isCorrect: true,
          explanation: "Supratherapeutic troughs (>20 mcg/mL) with acute kidney injury require immediately withholding the drug until levels decline, followed by AUC-guided dose reductions."
        },
        {
          id: "opt2",
          text: "Double the Vancomycin dose to 2g q8h to eliminate the MRSA bacteria faster.",
          isCorrect: false,
          explanation: "Increasing the dose will cause catastrophic acute tubular necrosis and permanent renal failure."
        },
        {
          id: "opt3",
          text: "Continue the same dose without changes because bacteremia is more important than renal function.",
          isCorrect: false,
          explanation: "Unmonitored toxic levels lead to permanent dialysis dependency and increased mortality."
        },
        {
          id: "opt4",
          text: "Switch immediately to oral Vancomycin capsules 125 mg for the systemic bacteremia.",
          isCorrect: false,
          explanation: "Oral Vancomycin has negligible systemic bioavailability and is strictly for C. difficile colitis; it cannot treat systemic bloodstream infections."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "MANIPAL-TDM-2026",
      validity: "4 Years",
      recognizedHospitals: ["Manipal Hospital", "Apollo Hospitals", "Kasturba Medical College"]
    }
  },

  // 12. DIALYSIS TECH: Hemodialysis Vascular Access & Fistula Complications
  "cme-fistula-401": {
    title: "Hemodialysis Vascular Access & Fistula Complications",
    provider: "Johns Hopkins Nephrology & Vascular Access Society of India",
    category: "Dialysis & Renal",
    duration: "5 Hours",
    level: "Intermediate",
    cmeCredits: 5,
    rating: 4.93,
    reviewsCount: 710,
    enrolledCount: 2420,
    accreditedBy: "Vascular Access Society of India (VASI) & Johns Hopkins CME",
    accreditationBadge: "5 CME Credits • Johns Hopkins Aligned",
    summary: "Johns Hopkins Nephrology: Cannulation buttonhole technique, stenosis detection, thrombosis prevention, and management of AV fistula venous rupture.",
    overview: "Standardized for dialysis technicians and nephrology nurses. Covers physical examination of arteriovenous fistulas (look, listen, feel), rope-ladder vs buttonhole cannulation, venous needle pressure alarms, recirculation testing, and emergency rupture management.",
    targetAudience: "Dialysis Technicians, Renal Nurses, and Nephrology Trainees.",
    skillsGained: ["AV Fistula Physical Assessment", "Rope-Ladder Cannulation", "Venous Pressure Alarm Troubleshooting", "Access Infiltration Emergency Care"],
    whatYouWillLearn: [
      "Assess fistula thrill (continuous vibration) and bruit (low-pitch systolic-diastolic sound)",
      "Maintain appropriate needle bevel angle (20-30 degrees) and needle tip separation (> 5 cm)",
      "Detect early outflow venous stenosis when dynamic venous pressure exceeds 50% of blood flow rate",
      "Manage emergency vascular access hemorrhage and subcutaneous infiltration with zero exsanguination"
    ],
    instructor: {
      name: "Dr. V. Muralidharan",
      role: "Senior Consultant Nephrologist & Access Director",
      hospital: "Madras Medical Mission, Chennai",
      avatarInitials: "VM",
      bio: "21+ years in interventional nephrology and maintenance hemodialysis center leadership. Executive member of the Vascular Access Society of India."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: AV Fistula Anatomy & Pre-Dialysis Physical Exam",
        duration: "1.5 Hours",
        lessons: [
          { id: "l1_1", title: "Physical Exam: Look, Listen, Feel Routine", duration: "35 min", type: "video", contentPreview: "Detecting aneurysm, pseudoaneurysm, pulse augmentation, and arm elevation test." },
          { id: "l1_2", title: "Cannulation Protocols: Rope Ladder Technique", duration: "35 min", type: "interactive_case", contentPreview: "Rotating sites along the vein to prevent vessel wall weakening." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Hemodialysis Pressure Alarms & Stenosis",
        duration: "2 Hours",
        lessons: [
          { id: "l2_1", title: "High Venous Pressure Alarm (>220 mmHg)", duration: "40 min", type: "video", contentPreview: "Identifying needle malposition vs downstream cephalic vein arch stenosis." },
          { id: "l2_2", title: "Negative Arterial Pressure & Access Recirculation", duration: "35 min", type: "interactive_case", contentPreview: "Solving arterial line suck-down and needle flipping myths." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Rupture, Hematoma & Thrombosis Emergency Care",
        duration: "1.5 Hours",
        lessons: [
          { id: "l3_1", title: "Emergency Fistula Rupture Protocols", duration: "35 min", type: "video", contentPreview: "Point pressure technique and immediate vascular surgery alert." },
          { id: "l3_2", title: "Dialysis Access Competency Exam", duration: "30 min", type: "quiz", contentPreview: "Alarm resolution simulation." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Venous Needle Infiltration & High Pressure Alarm",
      caseDescription: "Ten minutes after initiating hemodialysis at a blood pump speed of 300 mL/min, the machine sounds a continuous high venous pressure alarm (> 250 mmHg). The dialysis technician observes rapid localized swelling and acute pain around the venous needle puncture site in the patient's left forearm.",
      patientVitals: {
        hr: "88 bpm",
        bp: "144/88 mmHg",
        spo2: "97% on room air",
        rhythm: "High Venous Pressure Alarm (>250 mmHg), Expanding Forearm Hematoma"
      },
      prompt: "The patient is experiencing acute venous needle infiltration with an expanding hematoma. What is the immediate priority action?",
      options: [
        {
          id: "opt1",
          text: "Stop the blood pump immediately, disconnect the venous line without flushing, remove the infiltrated needle, apply firm sterile manual pressure over the puncture site for 10-15 minutes, and apply cold ice packs.",
          isCorrect: true,
          explanation: "Stopping the blood pump prevents pumping extracorporeal blood into the subcutaneous tissues. Firm manual pressure controls the hematoma, and ice packs reduce swelling and tissue trauma."
        },
        {
          id: "opt2",
          text: "Forcefully flush the venous needle with 20 mL of normal saline using a syringe to clear any resistance.",
          isCorrect: false,
          explanation: "Flushing an infiltrated needle into interstitial tissue worsens the hematoma and can compress nerves causing compartment syndrome."
        },
        {
          id: "opt3",
          text: "Increase the blood flow rate to 400 mL/min to overcome the high venous pressure.",
          isCorrect: false,
          explanation: "Increasing pump speed drastically exacerbates bleeding into the patient's arm."
        },
        {
          id: "opt4",
          text: "Apply a tight circumferential rubber tourniquet around the upper arm for 2 hours.",
          isCorrect: false,
          explanation: "Circumferential tourniquets cause complete venous occlusion and thrombose the entire arteriovenous fistula."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "JHU-VASI-FISTULA-2026",
      validity: "3 Years",
      recognizedHospitals: ["Madras Medical Mission", "Apollo Hospitals", "Manipal Health"]
    }
  },

  // 13. DIALYSIS TECH: Water Treatment & Endotoxin Standards in Hemodialysis
  "cme-ro-402": {
    title: "Water Treatment & Endotoxin Standards in Hemodialysis",
    provider: "AAMI & ISO 23500 Water Standards & AIIMS Nephrology",
    category: "Dialysis & Renal",
    duration: "4 Hours",
    level: "Intermediate",
    cmeCredits: 4,
    rating: 4.87,
    reviewsCount: 540,
    enrolledCount: 1820,
    accreditedBy: "ISO 23500 Technical Committee & AIIMS Renal Sciences",
    accreditationBadge: "4 CME Credits • ISO Aligned",
    summary: "AAMI & ISO 23500 Standards: Reverse Osmosis (RO) maintenance, chlorine breakthrough testing, microbial colony counting, and endotoxin LAL testing.",
    overview: "Critical training for dialysis technologists and biomedical engineers on dialysis water treatment safety. Focuses on granular activated carbon filtration, total chlorine testing (<0.1 mg/L), water softener hardness monitoring, Reverse Osmosis membrane rejection, and pyrogen reactions.",
    targetAudience: "Hemodialysis Technicians, Biomedical Engineers, and Dialysis Unit Managers.",
    skillsGained: ["Total Chlorine / Chloramine Testing", "RO Membrane Rejection Monitoring", "Water Softener Salt Regeneration", "Endotoxin LAL Sampling"],
    whatYouWillLearn: [
      "Test total chlorine daily prior to the first patient shift to prevent chloramine hemolysis",
      "Ensure granular activated carbon beds maintain minimum 10 minutes Empty Bed Contact Time (EBCT)",
      "Verify RO membranes achieve > 95% total dissolved solids (TDS) salt rejection",
      "Collect sterile dialysate samples for heterotrophic bacteria (<100 CFU/mL) and endotoxin (<0.25 EU/mL)"
    ],
    instructor: {
      name: "Er. K. Soundararajan",
      role: "Chief Biomedical Engineer & Water Systems Specialist",
      hospital: "Apollo Renal Care Division, Chennai",
      avatarInitials: "KS",
      bio: "20+ years designing and auditing central Reverse Osmosis hemodialysis water plants across major tertiary care hospital chains."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: Pre-Treatment System Components",
        duration: "1.5 Hours",
        lessons: [
          { id: "l1_1", title: "Multimedia Filters and Water Softeners", duration: "35 min", type: "video", contentPreview: "Removing turbidity and calcium/magnesium ions to protect RO membranes." },
          { id: "l1_2", title: "Carbon Filtration & 10-Minute Empty Bed Contact Time", duration: "35 min", type: "interactive_case", contentPreview: "Primary and secondary carbon beds for chlorine adsorption." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Total Chlorine Testing Protocols",
        duration: "1.5 Hours",
        lessons: [
          { id: "l2_1", title: "DPD Titration Testing Before First Patient Shift", duration: "35 min", type: "video", contentPreview: "Strict compliance with AAMI limit of < 0.1 mg/L." },
          { id: "l2_2", title: "Chlorine Breakthrough Emergency Shut-Down", duration: "35 min", type: "interactive_case", contentPreview: "Switching to secondary polish carbon tanks." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Reverse Osmosis Physics & Microbiology",
        duration: "1 Hour",
        lessons: [
          { id: "l3_1", title: "Endotoxin Testing (Limulus Amebocyte Lysate)", duration: "30 min", type: "video", contentPreview: "Detecting pyrogenic gram-negative bacterial cell wall fragments." },
          { id: "l3_2", title: "Water Safety Technician Certification Exam", duration: "25 min", type: "quiz", contentPreview: "Water analysis verification exam." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Pre-Shift Chlorine Breakthrough Emergency Action",
      caseDescription: "During the routine 6:00 AM pre-dialysis checklist prior to connecting the morning shift of 12 maintenance hemodialysis patients, the dialysis technician samples the water from the primary carbon tank test port. The DPD test strip turns pink, measuring total chlorine of 0.22 mg/L (AAMI maximum allowable limit < 0.10 mg/L).",
      patientVitals: {
        hr: "N/A",
        bp: "N/A",
        spo2: "N/A",
        rhythm: "RO Plant Pre-Shift Test: Total Chlorine 0.22 mg/L (BREAKTHROUGH)"
      },
      prompt: "Total chlorine has breached the primary carbon bed safety limit. What is the mandatory protocol that the dialysis technician must execute immediately?",
      options: [
        {
          id: "opt1",
          text: "Do NOT initiate any patient treatments, test the secondary polish carbon port immediately; if clean (<0.10 mg/L), switch to secondary bed and notify biomedical engineering for immediate primary carbon replacement to prevent lethal patient hemolysis.",
          isCorrect: true,
          explanation: "Chloramine crossing into dialysate oxidizes hemoglobin, causing acute intravascular hemolysis, methemoglobinemia, and patient death. Dialysis must never proceed with uncontained chlorine breakthrough."
        },
        {
          id: "opt2",
          text: "Proceed with connecting all patients as scheduled because 0.22 mg/L is only slightly elevated.",
          isCorrect: false,
          explanation: "Any chlorine level >= 0.10 mg/L causes catastrophic red blood cell lysis in hemodialysis patients."
        },
        {
          id: "opt3",
          text: "Pour 5 liters of household bleach directly into the RO water holding tank.",
          isCorrect: false,
          explanation: "Bleach contains concentrated sodium hypochlorite, which will poison the entire water distribution loop."
        },
        {
          id: "opt4",
          text: "Turn off the water softener and increase dialysate temperature to 42 °C.",
          isCorrect: false,
          explanation: "Temperature increases do not eliminate chloramines and high dialysate temperature causes thermal hemolysis."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "AAMI-ISO-WATER-2026",
      validity: "3 Years",
      recognizedHospitals: ["AIIMS New Delhi", "Apollo Hospitals", "Narayana Health"]
    }
  },

  // 14. DIALYSIS TECH: CRRT Machine Priming, Anticoagulation & Troubleshooting
  "cme-crrt-403": {
    title: "CRRT Machine Priming, Anticoagulation & Troubleshooting",
    provider: "Cleveland Clinic Renal Medicine & ISN",
    category: "Dialysis & Renal",
    duration: "6 Hours",
    level: "Advanced",
    cmeCredits: 6,
    rating: 4.96,
    reviewsCount: 780,
    enrolledCount: 2310,
    accreditedBy: "International Society of Nephrology (ISN) & Cleveland Clinic",
    accreditationBadge: "6 CME Credits • Cleveland Clinic Aligned",
    summary: "Cleveland Clinic Renal: Continuous Veno-Venous Hemodiafiltration (CVVHDF), regional citrate anticoagulation (RCA), and trans-membrane pressure (TMP) alarms.",
    overview: "Advanced intensive care nephrology training for dialysis technologists and ICU nurses. Teaches automated CRRT machine priming (Prismaflex/Aquarius), pre-filter vs post-filter replacement fluid kinetics, Regional Citrate Anticoagulation protocols, and transmembrane pressure (TMP) troubleshooting.",
    targetAudience: "Dialysis Technologists, ICU Specialists, and Nephrology Fellows.",
    skillsGained: ["CRRT Circuit Priming", "CVVHDF Fluid Prescription", "Regional Citrate Anticoagulation (RCA)", "Filter Clotting & TMP Alarm Management"],
    whatYouWillLearn: [
      "Prime CRRT circuits with heparinized and normal saline eliminating all micro-air bubbles",
      "Calculate effluent dose (20-25 mL/kg/hour) in compliance with KDIGO AKI guidelines",
      "Titrate 4% trisodium citrate pre-filter and calcium chloride post-filter to prevent circuit clotting",
      "Troubleshoot access pressure, return pressure, and transmembrane pressure (TMP) rises"
    ],
    instructor: {
      name: "Sister Renuka Devi",
      role: "Senior Dialysis & CRRT Specialist",
      hospital: "Cleveland Clinic Renal Division",
      avatarInitials: "RD",
      bio: "18+ years managing critical care renal replacement therapies, continuous therapies in cardiogenic shock, and regional citrate protocols."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: CRRT Modalities (CVVH, CVVHD, CVVHDF)",
        duration: "2 Hours",
        lessons: [
          { id: "l1_1", title: "Diffusion vs Convection Principles", duration: "40 min", type: "video", contentPreview: "Small molecule clearance vs middle molecule convective drag." },
          { id: "l1_2", title: "KDIGO 20-25 mL/kg/h Effluent Dose Calculations", duration: "40 min", type: "interactive_case", contentPreview: "Calculating prescribed vs delivered dose taking downtime into account." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Regional Citrate Anticoagulation (RCA)",
        duration: "2 Hours",
        lessons: [
          { id: "l2_1", title: "Citrate Chelation & Systemic Calcium Balance", duration: "45 min", type: "video", contentPreview: "Targeting post-filter ionized calcium 0.25-0.35 mmol/L and systemic 1.1-1.3 mmol/L." },
          { id: "l2_2", title: "Detecting Citrate Accumulation ('Citrate Lock')", duration: "35 min", type: "interactive_case", contentPreview: "Total-to-ionized calcium ratio > 2.5 and worsening anion gap acidosis." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Circuit Pressures & Alarm Resolution",
        duration: "2 Hours",
        lessons: [
          { id: "l3_1", title: "Transmembrane Pressure (TMP) & Filter Life", duration: "35 min", type: "video", contentPreview: "Interpreting TMP > 250 mmHg as impending membrane protein fouling." },
          { id: "l3_2", title: "CRRT Specialist Board Exam", duration: "35 min", type: "quiz", contentPreview: "Circuit alarm and metabolic troubleshooting scenarios." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Regional Citrate Anticoagulation Citrate Toxicity Interception",
      caseDescription: "A 54-year-old patient with multi-organ failure and acute liver injury is on CVVHDF with regional citrate anticoagulation. Over the last 4 hours, the routine arterial blood gas reveals systemic pH falling from 7.35 to 7.18, anion gap climbing to 22 mEq/L, total serum calcium 10.2 mg/dL, and systemic ionized calcium 0.95 mmol/L (Total/Ionized Ca ratio = 2.68).",
      patientVitals: {
        hr: "104 bpm",
        bp: "92/58 mmHg on Norepinephrine",
        spo2: "94% on mechanical ventilator",
        rhythm: "Sinus Tachycardia, Total/Ionized Calcium Ratio 2.68"
      },
      prompt: "The total calcium to ionized calcium ratio is 2.68 with worsening high anion gap metabolic acidosis. What clinical complication is occurring, and what is the corrective action?",
      options: [
        {
          id: "opt1",
          text: "Citrate accumulation (citrate toxicity) due to impaired hepatic metabolism; immediately decrease or pause the citrate infusion rate, optimize calcium chloride infusion, and consider switching to non-anticoagulated or heparinized CRRT.",
          isCorrect: true,
          explanation: "A Total Calcium to Ionized Calcium ratio > 2.5 with metabolic acidosis confirms citrate accumulation. The liver cannot metabolize citrate, resulting in chelated calcium buildup and hypocalcemia."
        },
        {
          id: "opt2",
          text: "Double the citrate infusion rate to enhance anticoagulation in the filter.",
          isCorrect: false,
          explanation: "Increasing citrate will drastically worsen citrate toxicity and lead to fatal hypocalcemic arrhythmia."
        },
        {
          id: "opt3",
          text: "Turn off the CRRT machine completely and disconnect the patient permanently.",
          isCorrect: false,
          explanation: "Patients with acute kidney injury in multi-organ failure require ongoing renal support; therapy parameters should be adjusted rather than abandoned."
        },
        {
          id: "opt4",
          text: "Infuse 100 mEq of Potassium Chloride rapidly through the venous line.",
          isCorrect: false,
          explanation: "Rapid potassium boluses cause cardiac arrest."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "CLEVELAND-CRRT-2026",
      validity: "3 Years",
      recognizedHospitals: ["Cleveland Clinic", "Apollo Hospitals", "Fortis Escorts"]
    }
  },

  // 15. PHYSIOTHERAPIST: Early ICU Mobilization & Post-Extubation Pulmonary Rehab
  "cme-icu-rehab-501": {
    title: "Early ICU Mobilization & Post-Extubation Pulmonary Rehab",
    provider: "Johns Hopkins Physical Medicine & IAP",
    category: "Physiotherapy & Rehab",
    duration: "6 Hours",
    level: "Intermediate",
    cmeCredits: 6,
    rating: 4.95,
    reviewsCount: 890,
    enrolledCount: 2950,
    accreditedBy: "Indian Association of Physiotherapists (IAP) & Johns Hopkins Rehab",
    accreditationBadge: "6 CME Credits • Johns Hopkins Aligned",
    summary: "Johns Hopkins Physical Medicine: ABCDEF ICU liberation bundle, passive cycling, tilt-table mobilization, and lung expansion inspiratory muscle training.",
    overview: "Based on the evidence-based Johns Hopkins Early Mobility in the ICU program. Physiotherapists learn step-by-step physical rehabilitation across 5 progressive tiers: passive range of motion in sedated patients, bed sitting, active edge-of-bed balance, standing tilt-table, and ambulation with portable ventilator.",
    targetAudience: "Cardiorespiratory Physiotherapists, ICU Physical Therapists, and Rehabilitation Specialists.",
    skillsGained: ["ICU Safety Red-Flag Screening", "Edge-of-Bed Balance Retraining", "Positive Expiratory Pressure (PEP) Therapy", "Mechanical In-Exsufflator (CoughAssist) Operation"],
    whatYouWillLearn: [
      "Evaluate safety parameters (RASS score -1 to +1, MAP 65-110, FiO2 <= 0.6) prior to mobilizing ICU patients",
      "Implement the 5-Level ICU Mobility Ladder safely without dislodging endotracheal tubes or central lines",
      "Utilize Incentive Spirometry and Positive Expiratory Pressure (PEP) to reverse post-extubation atelectasis",
      "Prevent ICU-Acquired Weakness (ICUAW) and Post-Intensive Care Syndrome (PICS)"
    ],
    instructor: {
      name: "Dr. Karthik Subramaniam",
      role: "Lead ICU Cardiorespiratory Physiotherapist",
      hospital: "Christian Medical College (CMC), Vellore",
      avatarInitials: "KS",
      bio: "16+ years pioneering early mobilization in cardiothoracic and surgical ICUs. Fellow of the Indian Association of Physiotherapists."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: Safety Screening & Red-Flag Criteria",
        duration: "2 Hours",
        lessons: [
          { id: "l1_1", title: "Hemodynamic and Respiratory Stability Check", duration: "35 min", type: "video", contentPreview: "Vasopressor limits, lactic acid trends, and ventilator oxygenation thresholds." },
          { id: "l1_2", title: "Line Management: ETT, Arterial Lines & Chest Tubes", duration: "40 min", type: "interactive_case", contentPreview: "Securing lines with slack before initiating patient movement." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: The 5-Level Mobility Protocol",
        duration: "2 Hours",
        lessons: [
          { id: "l2_1", title: "Bed Sitting, Tilt-Table, and Standing Pivot", duration: "45 min", type: "video", contentPreview: "Progressing from passive cycling to active-assisted standing." },
          { id: "l2_2", title: "ICU Delirium & the ABCDEF Liberation Bundle", duration: "35 min", type: "interactive_case", contentPreview: "Coordinating mobilization with sedation vacation." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Post-Extubation Pulmonary Clearing",
        duration: "2 Hours",
        lessons: [
          { id: "l3_1", title: "Incentive Spirometry & Diaphragmatic Retraining", duration: "35 min", type: "video", contentPreview: "Targeting sustained maximal inspiration and lung expansion." },
          { id: "l3_2", title: "ICU Mobilization Board Exam", duration: "35 min", type: "quiz", contentPreview: "Mobilization safety judgment scenarios." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Post-Extubation Atelectasis Mobilization Strategy",
      caseDescription: "A 52-year-old male extubated 18 hours ago following coronary artery bypass graft (CABG) surgery is lethargic with weak voluntary cough effort. Chest X-ray reveals left lower lobe basal atelectasis. He is on 2 L/min nasal prongs with stable hemodynamics without inotropic support.",
      patientVitals: {
        hr: "84 bpm",
        bp: "124/80 mmHg",
        spo2: "94% on 2L oxygen",
        rhythm: "Normal Sinus Rhythm, RASS 0 (Alert & Calm)"
      },
      prompt: "The patient has post-extubation basal atelectasis with stable hemodynamics. What is the prioritized cardiopulmonary physiotherapy intervention?",
      options: [
        {
          id: "opt1",
          text: "Assist patient to upright high-Fowler's edge-of-bed sitting, perform incentive spirometry with diaphragmatic breathing exercises, and administer positive expiratory pressure (PEP) mask therapy to recruit collapsed alveoli.",
          isCorrect: true,
          explanation: "Upright sitting optimizes functional residual capacity (FRC) and diaphragmatic excursion. Combining with sustained maximal inspiration (incentive spirometry) and PEP therapy opens atelectatic lung units."
        },
        {
          id: "opt2",
          text: "Instruct the patient to remain completely flat supine in bed for 72 hours without moving.",
          isCorrect: false,
          explanation: "Prolonged supine bedrest worsens dependent alveolar atelectasis, promotes sputum retention, and causes venous thromboembolism."
        },
        {
          id: "opt3",
          text: "Administer high-dose muscle relaxants to suppress any coughing effort.",
          isCorrect: false,
          explanation: "Suppressing cough effort in postoperative patients leads to severe mucus plugging and secondary bacterial pneumonia."
        },
        {
          id: "opt4",
          text: "Re-intubate the patient immediately without attempting physical chest clearance.",
          isCorrect: false,
          explanation: "A stable extubated patient should not be re-intubated when non-invasive mobilization and pulmonary rehab are effective."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "JHU-IAP-REHAB-2026",
      validity: "4 Years",
      recognizedHospitals: ["CMC Vellore", "Apollo Hospitals", "Johns Hopkins Rehabilitation"]
    }
  },

  // 16. PHYSIOTHERAPIST: Post-Operative TKR & THR Accelerated Mobilization
  "cme-tkr-502": {
    title: "Post-Operative TKR & THR Accelerated Mobilization",
    provider: "Oxford University Hospitals NHS Trust & IOA",
    category: "Physiotherapy & Rehab",
    duration: "5 Hours",
    level: "Intermediate",
    cmeCredits: 5,
    rating: 4.91,
    reviewsCount: 820,
    enrolledCount: 2610,
    accreditedBy: "Indian Orthopaedic Association & Oxford NHS Trust",
    accreditationBadge: "5 CME Credits • Oxford NHS Aligned",
    summary: "Oxford NHS Trust: Day-0 knee flexion/extension milestones, gait retraining, quad lag correction, and DVT prophylaxis mechanical protocols.",
    overview: "Accelerated joint replacement recovery pathway modeled after the Oxford Joint Replacement Centre. Physiotherapists learn Day-0 mobilization milestones within 4 hours of surgery, active quadriceps reactivation, continuous passive motion (CPM) indications, and walker gait retraining.",
    targetAudience: "Orthopedic Physiotherapists, Post-Surgical Rehab Specialists, and Physical Therapy Students.",
    skillsGained: ["Day-0 Total Knee Mobilization", "Quadriceps Lag Elimination", "Walker Gait Retraining", "Mechanical DVT Prevention Exercises"],
    whatYouWillLearn: [
      "Safely assess motor return following spinal or femoral nerve block prior to standing",
      "Achieve 90 degrees active knee flexion and zero-degree full extension by post-op Day 3",
      "Correct extensor lag with straight leg raises and terminal knee extension exercises",
      "Train patients in ascending and descending stairs using the 'Good leg up, Bad leg down' rule"
    ],
    instructor: {
      name: "Dr. S. Balasubramanian",
      role: "Senior Consultant Orthopedic Physiotherapist",
      hospital: "Ganga Hospital, Coimbatore",
      avatarInitials: "SB",
      bio: "22+ years in orthopedic and trauma rehabilitation. Member of the British Association of Chartered Physiotherapists in Amputee Rehabilitation."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: Pre-Op Assessment & Day-0 Fast-Track Criteria",
        duration: "1.5 Hours",
        lessons: [
          { id: "l1_1", title: "Nerve Block Recovery & Motor Function Check", duration: "35 min", type: "video", contentPreview: "Assessing quadriceps isometric hold before weight-bearing." },
          { id: "l1_2", title: "Day-0 Bed-to-Chair Transfer within 4 Hours", duration: "40 min", type: "interactive_case", contentPreview: "Eliminating orthostatic hypotension and establishing early confidence." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Range of Motion & Quadriceps Reactivation",
        duration: "2 Hours",
        lessons: [
          { id: "l2_1", title: "Straight Leg Raise & Overcoming Quadriceps Lag", duration: "40 min", type: "video", contentPreview: "Biofeedback and neuromuscular electrical stimulation (NMES) adjuncts." },
          { id: "l2_2", title: "Continuous Passive Motion (CPM) Evidence Review", duration: "35 min", type: "interactive_case", contentPreview: "Active vs passive flexion milestones and patellar mobility." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Functional Gait & Stair Climbing Training",
        duration: "1.5 Hours",
        lessons: [
          { id: "l3_1", title: "Walker to Elbow-Crutch Progression", duration: "35 min", type: "video", contentPreview: "Three-point gait patterns and weight-bearing as tolerated." },
          { id: "l3_2", title: "Post-Arthroplasty Clinical Mastery Exam", duration: "30 min", type: "quiz", contentPreview: "Milestone management scenarios." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Post-Op Total Knee Arthroplasty Day-0 Mobilization",
      caseDescription: "A 66-year-old female is 4 hours post uncomplicated elective Left Total Knee Arthroplasty (TKA) under spinal anesthesia with adductor canal block. The surgical drain is intact with minimal serosanguinous output. The orthopedic surgeon has cleared the patient for Day-0 accelerated mobilization.",
      patientVitals: {
        hr: "76 bpm",
        bp: "122/76 mmHg",
        spo2: "99% on room air",
        rhythm: "Left TKA Post-Op Day 0 (4 Hours Post-Op)"
      },
      prompt: "What is the correct clinical sequence for initiating safe Day-0 accelerated mobilization?",
      options: [
        {
          id: "opt1",
          text: "Confirm motor strength with active ankle pumps and quadriceps set, assist patient to sit at edge of bed to rule out orthostatic dizziness, and guide standing with a walker for weight-bearing as tolerated.",
          isCorrect: true,
          explanation: "Day-0 mobilization within 4-6 hours reduces length of hospital stay and DVT incidence. Motor check and sitting tolerance must precede standing with an assistive walker."
        },
        {
          id: "opt2",
          text: "Immediately ask the patient to run on an inclined treadmill for 20 minutes.",
          isCorrect: false,
          explanation: "Running on a treadmill 4 hours after total knee replacement causes severe wound dehiscence and prosthesis dislocation."
        },
        {
          id: "opt3",
          text: "Keep the operative knee in 90 degrees flexion with tight sandbags for 5 days.",
          isCorrect: false,
          explanation: "Flexion contractures are difficult to correct if full extension is not achieved on Day 0-1."
        },
        {
          id: "opt4",
          text: "Discharge the patient to home immediately without gait assessment.",
          isCorrect: false,
          explanation: "Patients cannot be discharged without verified independent transfer ability and fall risk clearance."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "OXFORD-TKR-REHAB-2026",
      validity: "4 Years",
      recognizedHospitals: ["Oxford NHS Trust", "Ganga Hospital", "Apollo Hospitals"]
    }
  },

  // 17. PHYSIOTHERAPIST: Neuro-Developmental Therapy in Acute Stroke Rehab
  "cme-stroke-503": {
    title: "Neuro-Developmental Therapy in Acute Stroke Rehab",
    provider: "NIMHANS Bengaluru & World Stroke Academy",
    category: "Physiotherapy & Rehab",
    duration: "7 Hours",
    level: "Advanced",
    cmeCredits: 7,
    rating: 4.97,
    reviewsCount: 1140,
    enrolledCount: 3670,
    accreditedBy: "NIMHANS Bengaluru & Indian Association of Physiotherapists",
    accreditationBadge: "7 CME Credits • NIMHANS Aligned",
    summary: "NIMHANS Bengaluru: Bobath concept, trunk postural stability, constraint-induced movement therapy (CIMT), and spasticity inhibition techniques.",
    overview: "Elite neurological rehabilitation curriculum formulated by NIMHANS senior neuro-physiotherapists. Covers early bed positioning to prevent shoulder subluxation, Bobath normal movement retraining, trunk core stability, sensory re-education, and task-specific gait re-education in acute ischemic stroke.",
    targetAudience: "Neuro-Physiotherapists, Stroke Unit Therapists, and Rehabilitation Residents.",
    skillsGained: ["Bobath Normal Movement Facilitation", "Hemiplegic Shoulder Subluxation Prevention", "Postural Trunk Stability Training", "Constraint-Induced Movement Therapy"],
    whatYouWillLearn: [
      "Inhibit abnormal spastic synergies and promote isolated voluntary motor control",
      "Position the hemiplegic shoulder correctly to eliminate painful frozen shoulder complications",
      "Facilitate pelvic anterior tilt and weight-transfer over the paretic lower limb during sit-to-stand",
      "Implement Constraint-Induced Movement Therapy (CIMT) protocols for functional upper extremity recovery"
    ],
    instructor: {
      name: "Dr. Poornima Chandrasekhar",
      role: "Professor & Senior Neuro-Physiotherapist",
      hospital: "NIMHANS, Bengaluru",
      avatarInitials: "PC",
      bio: "24+ years specializing in post-stroke neuro-plasticity, motor recovery, and Bobath-certified clinical therapy at premier institutes."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: Acute Bed Positioning & Shoulder Protection",
        duration: "2 Hours",
        lessons: [
          { id: "l1_1", title: "Scapular Protraction & Bed Positioning", duration: "40 min", type: "video", contentPreview: "Preventing humeral head inferior subluxation with shoulder support cuffs." },
          { id: "l1_2", title: "Reflex-Inhibiting Patterns in Supine and Side-Lying", duration: "40 min", type: "interactive_case", contentPreview: "Counteracting flexor synergy in arm and extensor synergy in leg." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Trunk Control & Sit-to-Stand Biomechanics",
        duration: "2.5 Hours",
        lessons: [
          { id: "l2_1", title: "Dynamic Pelvic Tilting & Core Stability", duration: "45 min", type: "video", contentPreview: "Activating transversus abdominis and obliques for seated balance." },
          { id: "l2_2", title: "Symmetrical Weight-Bearing Sit-to-Stand Transfers", duration: "45 min", type: "interactive_case", contentPreview: "Preventing compensatory pushing on the non-paretic side." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Functional Ambulation & Upper Limb CIMT",
        duration: "2.5 Hours",
        lessons: [
          { id: "l3_1", title: "Stance Phase Knee Control and Stride Symmetry", duration: "45 min", type: "video", contentPreview: "Inhibiting genu recurvatum hyperextension during terminal stance." },
          { id: "l3_2", title: "Neuro-Rehab Certification Exam", duration: "35 min", type: "quiz", contentPreview: "Stroke motor recovery case exam." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Acute Hemiplegic Shoulder Subluxation Prevention",
      caseDescription: "A 58-year-old patient on post-stroke Day 3 following middle cerebral artery (MCA) ischemic stroke presents with flaccid paralysis of the left upper limb (Brunnstrom Stage 1). The family member is observed pulling the patient up in bed by grasping both forearms, causing severe left shoulder discomfort.",
      patientVitals: {
        hr: "76 bpm",
        bp: "134/82 mmHg",
        spo2: "98% on room air",
        rhythm: "Sinus Rhythm, Left Flaccid Hemiplegia"
      },
      prompt: "The flaccid shoulder is vulnerable to traumatic inferior subluxation and brachial plexus traction. What is the mandatory neuro-physiotherapy positioning and handling protocol?",
      options: [
        {
          id: "opt1",
          text: "Instruct family and staff never to pull on the paretic arm; support the humeral head in bed with pillows maintaining scapular protraction and external rotation, and utilize a supportive humeral cuff sling when upright.",
          isCorrect: true,
          explanation: "In flaccid hemiplegia, rotator cuff tone is absent. Pulling on the arm causes inferior glenohumeral subluxation, severe shoulder pain, and traction neuropathy. Scapular protraction and proper support are vital."
        },
        {
          id: "opt2",
          text: "Allow the arm to hang unsupported off the edge of the bed to let gravity stretch the muscles.",
          isCorrect: false,
          explanation: "Allowing an unsupported limb to dangle creates catastrophic gravitational distraction of the glenohumeral joint."
        },
        {
          id: "opt3",
          text: "Immobilize the arm in a rigid chest plaster cast for 6 weeks.",
          isCorrect: false,
          explanation: "Casting leads to severe joint contracture and adhesive capsulitis."
        },
        {
          id: "opt4",
          text: "Apply vigorous high-resistance 20 kg bicep curls to the flaccid arm.",
          isCorrect: false,
          explanation: "Flaccid muscles (Stage 1) have zero voluntary recruitment; heavy weights tear tendons and joints."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "NIMHANS-STROKE-REHAB-2026",
      validity: "5 Years",
      recognizedHospitals: ["NIMHANS Bengaluru", "Apollo Hospitals", "Manipal Health"]
    }
  },

  // 18. RADIOGRAPHER: Multi-Slice CT Trauma Protocols & Contrast Safety
  "cme-trauma-ct-601": {
    title: "Multi-Slice CT Trauma Protocols & Contrast Safety",
    provider: "RSNA Radiology & IRIA Standards",
    category: "Radiology & Imaging",
    duration: "5 Hours",
    level: "Intermediate",
    cmeCredits: 5,
    rating: 4.93,
    reviewsCount: 750,
    enrolledCount: 2210,
    accreditedBy: "Radiological Society of North America & IRIA",
    accreditationBadge: "5 CME Credits • RSNA Aligned",
    summary: "RSNA Radiology: Whole-body polytrauma CT protocols, IV contrast extravasation protocols, and anaphylactoid reaction emergency management.",
    overview: "Designed for CT technologists and medical imaging radiographers. Focuses on rapid polytrauma 'Pan-Scan' protocols, dual-head injector programming, contrast extravasation mitigation, pediatric weight-based tube current modulation, and immediate treatment of iodinated contrast anaphylaxis.",
    targetAudience: "CT Technologists, Medical Imaging Technologists, and Radiography Interns.",
    skillsGained: ["Polytrauma Pan-Scan CT Sequences", "Dual-Head Contrast Power Injector Timing", "IV Contrast Extravasation Management", "Contrast Anaphylaxis Emergency Response"],
    whatYouWillLearn: [
      "Execute high-speed multi-slice CT polytrauma protocols (Non-contrast Head + C-Spine, Split-bolus Chest/Abdomen/Pelvis)",
      "Set optimal flow rates (3-4 mL/sec via 18/20G cannula) while checking line patency with saline test boluses",
      "Recognize and manage contrast extravasation with limb elevation and plastic surgery referral criteria",
      "Treat acute anaphylactoid reactions immediately with intramuscular Epinephrine (0.3 mg 1:1000) and high-flow oxygen"
    ],
    instructor: {
      name: "Dr. Vikramaditya Reddy",
      role: "Chief Interventional Radiologist & Professor",
      hospital: "Apollo Hospitals, Chennai",
      avatarInitials: "VR",
      bio: "23+ years in diagnostic radiology, emergency trauma imaging, and advanced multi-slice computed tomography."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: The Polytrauma CT 'Pan-Scan' Protocol",
        duration: "1.5 Hours",
        lessons: [
          { id: "l1_1", title: "Non-Contrast Brain and Cervical Spine Scan", duration: "35 min", type: "video", contentPreview: "Detecting acute epidural/subdural hematoma and cervical fracture stability." },
          { id: "l1_2", title: "Single-Pass Split-Bolus Abdominal-Pelvic CT", duration: "40 min", type: "interactive_case", contentPreview: "Combining arterial vascular blush and parenchymal organ injury in one acquisition." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Contrast Media Safety & Extravasation",
        duration: "2 Hours",
        lessons: [
          { id: "l2_1", title: "Power Injector Cannula Sizing & Flow Rates", duration: "40 min", type: "video", contentPreview: "Why antecubital 18G/20G access is mandatory for 3-4 mL/sec injections." },
          { id: "l2_2", title: "Extravasation Compartment Syndrome Checks", duration: "35 min", type: "interactive_case", contentPreview: "Assessing distal pulses, capillary refill, and swelling." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Anaphylaxis & Radiation ALARA in Trauma",
        duration: "1.5 Hours",
        lessons: [
          { id: "l3_1", title: "Immediate Contrast Reaction Management", duration: "35 min", type: "video", contentPreview: "Epinephrine dosing for laryngeal edema vs bronchospasm." },
          { id: "l3_2", title: "CT Trauma Radiographer Board Exam", duration: "30 min", type: "quiz", contentPreview: "Protocol and emergency management scenarios." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Severe Iodinated Contrast Anaphylaxis in CT Gantry",
      caseDescription: "During the contrast injection phase of a trauma CT scan for a 32-year-old motor vehicle crash patient, the patient suddenly reports severe throat tightness, develops stridor, facial angioedema, and diffuse urticaria. Blood pressure drops from 120/75 mmHg to 72/40 mmHg on the gantry monitor.",
      patientVitals: {
        hr: "138 bpm",
        bp: "72/40 mmHg (Anaphylactic Shock)",
        spo2: "84% with audible stridor",
        rhythm: "Sinus Tachycardia, Severe Laryngeal Edema"
      },
      prompt: "The patient is experiencing severe life-threatening contrast-induced anaphylactic shock. What is the radiographer's immediate emergency intervention?",
      options: [
        {
          id: "opt1",
          text: "Stop contrast injection immediately, summon hospital emergency Code Blue team, administer Epinephrine 0.3-0.5 mg (1:1000) Intramuscularly into the anterolateral mid-thigh, deliver 100% high-flow oxygen, and start IV crystalloid bolus.",
          isCorrect: true,
          explanation: "Intramuscular Epinephrine into the mid-thigh is the first-line life-saving treatment for severe contrast anaphylaxis. It rapidly reverses bronchospasm, laryngeal edema, and peripheral vasodilation."
        },
        {
          id: "opt2",
          text: "Continue the CT scan to finish the images before calling for assistance.",
          isCorrect: false,
          explanation: "Completing imaging while a patient is in acute respiratory and cardiovascular arrest is fatal."
        },
        {
          id: "opt3",
          text: "Give the patient a glass of water to drink while lying inside the CT gantry.",
          isCorrect: false,
          explanation: "Patients in acute anaphylaxis with stridor will aspirate fluids into the trachea."
        },
        {
          id: "opt4",
          text: "Administer only oral antihistamines and wait 4 hours for effect.",
          isCorrect: false,
          explanation: "Antihistamines are slow-acting and do not treat life-threatening laryngeal edema or distributive shock."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "RSNA-TRAUMA-CT-2026",
      validity: "3 Years",
      recognizedHospitals: ["Apollo Hospitals", "RSNA Certified Centres", "Fortis Healthcare"]
    }
  },

  // 19. RADIOGRAPHER: Radiation Safety & AERB Compliance in Cath Labs
  "cme-aerb-602": {
    title: "Radiation Safety & AERB Compliance in Cath Labs",
    provider: "Atomic Energy Regulatory Board (AERB) & CMC Vellore",
    category: "Radiology & Imaging",
    duration: "4 Hours",
    level: "Intermediate",
    cmeCredits: 4,
    rating: 4.9,
    reviewsCount: 520,
    enrolledCount: 1690,
    accreditedBy: "Atomic Energy Regulatory Board (AERB) & AMPI",
    accreditationBadge: "4 CME Credits • AERB Certified",
    summary: "Atomic Energy Regulatory Board (AERB) & CMC Vellore: ALARA principles, lead apron shielding inspection, collimation control, and TLD badge dosimetry.",
    overview: "Mandatory statutory radiation safety certification aligned with AERB guidelines. Designed for radiographers, cath lab technicians, and C-arm operators. Covers radiation dose limits, TLD badge handling, ALARA (Time, Distance, Shielding), thyroid collars, and annual lead apron radiographic integrity testing.",
    targetAudience: "Cath Lab Radiographers, C-Arm Operating Technicians, and Radiology Trainees.",
    skillsGained: ["AERB Regulatory Compliance", "ALARA Practical Implementation", "TLD Dosimetry Badge Care", "Lead Apron Integrity Inspection"],
    whatYouWillLearn: [
      "Comply with AERB annual occupational dose limits (20 mSv/year averaged over 5 years)",
      "Utilize lead aprons (0.5 mm lead equivalent), thyroid shields, and lead ceiling suspended screens",
      "Apply the Inverse-Square Law to reduce scatter radiation exposure by doubling distance",
      "Perform annual fluoroscopic inspection of personal lead aprons to detect hidden shielding cracks"
    ],
    instructor: {
      name: "Sri R. Janardhanan",
      role: "Certified Radiological Safety Officer (RSO) & Medical Physicist",
      hospital: "CMC Vellore",
      avatarInitials: "RJ",
      bio: "26+ years leading radiation physics, quality assurance testing of X-ray/fluoroscopy systems, and national AERB liaison."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: AERB Regulatory Framework & Dose Limits",
        duration: "1.5 Hours",
        lessons: [
          { id: "l1_1", title: "Occupational vs Public Radiation Dose Limits", duration: "35 min", type: "video", contentPreview: "Understanding stochastic vs deterministic tissue damage." },
          { id: "l1_2", title: "Thermo-Luminescent Dosimeter (TLD) Badges", duration: "35 min", type: "interactive_case", contentPreview: "Wearing TLD under vs over lead aprons and quarterly processing." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Practical ALARA in Interventional Suites",
        duration: "1.5 Hours",
        lessons: [
          { id: "l2_1", title: "Time, Distance, and Shielding Optimization", duration: "35 min", type: "video", contentPreview: "Low-pulse rate fluoroscopy (7.5 fps) and tight collimation." },
          { id: "l2_2", title: "Ceiling-Suspended Screens & Table Drapes", duration: "35 min", type: "interactive_case", contentPreview: "Positioning shields between operator and patient scatter source." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Lead Apron Inspection & Documentation",
        duration: "1 Hour",
        lessons: [
          { id: "l3_1", title: "Fluoroscopic Lead Shielding Defect Testing", duration: "30 min", type: "video", contentPreview: "Detecting micro-cracks and tears on C-arm review." },
          { id: "l3_2", title: "AERB Compliance Certification Exam", duration: "25 min", type: "quiz", contentPreview: "Radiation safety scenarios." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Prolonged Cath Lab Fluoroscopy Radiation Safety Protocol",
      caseDescription: "During an emergency primary PCI stenting for a complex chronic total occlusion (CTO), cumulative fluoroscopy time exceeds 35 minutes with cumulative Air Kerma climbing to 3.5 Gy. The cardiology fellow is leaning over the patient without using the mobile ceiling lead shield.",
      patientVitals: {
        hr: "84 bpm",
        bp: "116/74 mmHg",
        spo2: "99%",
        rhythm: "Interventional Suite, High Cumulative Scatter Radiation"
      },
      prompt: "Under AERB radiation protection regulations, what action must the cath lab radiographer enforce to minimize radiation exposure to staff and patient?",
      options: [
        {
          id: "opt1",
          text: "Inform the operator of cumulative Air Kerma threshold, position the ceiling-suspended lead acrylic shield between the X-ray tube/patient and the operators, tightly collimate the field of view, and switch pulse fluoroscopy to 7.5 pulses/second.",
          isCorrect: true,
          explanation: "Ceiling lead shields and tight collimation block up to 90% of scatter radiation. Switching to 7.5 fps cuts radiation dose in half without compromising interventional catheter guidance."
        },
        {
          id: "opt2",
          text: "Remove all lead aprons and thyroid collars because they become heavy during long procedures.",
          isCorrect: false,
          explanation: "Removing personal protective shielding exposes staff to dangerous carcinogenic radiation."
        },
        {
          id: "opt3",
          text: "Increase the pulse rate to continuous 30 frames/second to obtain clearer images.",
          isCorrect: false,
          explanation: "Continuous 30 fps increases radiation exposure exponentially and can cause radiation skin burns."
        },
        {
          id: "opt4",
          text: "Discard all TLD badges into the bio-medical waste bin.",
          isCorrect: false,
          explanation: "TLD badges are legal dosimetric records required by law for occupational monitoring."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "AERB-CMC-RSO-2026",
      validity: "3 Years",
      recognizedHospitals: ["CMC Vellore", "Apollo Hospitals", "AERB Accredited Facilities"]
    }
  },

  // 20. STUDENT / INTERN: Foundational BLS & High-Quality Chest Compressions
  "cme-bls-701": {
    title: "Foundational BLS & High-Quality Chest Compressions",
    provider: "American Heart Association (AHA) Standardized Curriculum",
    category: "Student Essentials",
    duration: "3 Hours",
    level: "Beginner",
    cmeCredits: 3,
    rating: 4.99,
    reviewsCount: 3820,
    enrolledCount: 8900,
    accreditedBy: "American Heart Association & National Medical Commission",
    accreditationBadge: "3 CME Credits • AHA Aligned",
    summary: "AHA Standardized Basic Life Support: Adult and pediatric CPR, AED pad placement, relief of choking, and clinical logbook certified.",
    overview: "Mandatory foundation course for medical interns, nursing students, and healthcare trainees. Provides step-by-step mastery of adult, child, and infant basic life support, automated external defibrillator (AED) operation, pocket mask ventilation, and foreign-body airway obstruction relief.",
    targetAudience: "MBBS Interns, Nursing Students, Allied Health Trainees, and Junior House Surgeons.",
    skillsGained: ["Adult & Pediatric CPR", "Automated External Defibrillator (AED)", "Bag-Mask Device Ventilation", "Relief of Foreign-Body Choking"],
    whatYouWillLearn: [
      "Perform high-quality adult chest compressions (100-120/min at 5-6 cm depth with full chest recoil)",
      "Deliver 30:2 compression-to-ventilation ratio for single-rescuer adult resuscitation",
      "Attach and operate an Automated External Defibrillator (AED) without interrupting compressions",
      "Manage adult and infant foreign-body airway obstruction using back slaps and chest/abdominal thrusts"
    ],
    instructor: {
      name: "Dr. N. Vijayalakshmi",
      role: "Lead AHA BLS/ACLS Faculty & Anesthesiologist",
      hospital: "FALE Clinical Training Division, Chennai",
      avatarInitials: "NV",
      bio: "18+ years instructing medical students and healthcare trainees in standardized life-saving resuscitation protocols."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: High-Quality CPR & The Resuscitation Sequence",
        duration: "1 Hour",
        lessons: [
          { id: "l1_1", title: "Scene Safety & Checking Responsiveness", duration: "20 min", type: "video", contentPreview: "Assessing carotid pulse and breathing simultaneously for max 10 seconds." },
          { id: "l1_2", title: "Hand Placement & Body Mechanics for Compressions", duration: "25 min", type: "interactive_case", contentPreview: "Lower half of the breastbone hand interlocking technique." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: AED Operation & Multi-Rescuer Teamwork",
        duration: "1 Hour",
        lessons: [
          { id: "l2_1", title: "AED Pad Placement and Rhythm Analysis Safety", duration: "25 min", type: "video", contentPreview: "Anterolateral pad positioning and standing clear during shock." },
          { id: "l2_2", title: "Bag-Valve-Mask (BVM) E-C Clamp Technique", duration: "25 min", type: "interactive_case", contentPreview: "Ensuring adequate chest rise over 1 second per breath." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Choking & Student Clinical Logbook Certification",
        duration: "1 Hour",
        lessons: [
          { id: "l3_1", title: "Relief of Foreign-Body Airway Obstruction", duration: "25 min", type: "video", contentPreview: "Heimlich abdominal thrusts and unconscious choking protocols." },
          { id: "l3_2", title: "AHA Standard BLS Student Exam", duration: "25 min", type: "quiz", contentPreview: "Complete resuscitation exam for clinical logbook credit." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Out-of-Hospital Adult Sudden Cardiac Arrest",
      caseDescription: "While walking in the hospital lobby, a healthcare student witnesses an elderly visitor suddenly slump to the floor motionless and unresponsive. The scene is safe. The student taps the shoulders shouting 'Are you OK?', but there is no response.",
      patientVitals: {
        hr: "0 bpm (No carotid pulse)",
        bp: "0 mmHg",
        spo2: "0%",
        rhythm: "No Pulse, Agonal Gasping"
      },
      prompt: "The victim is unresponsive. What is the immediate correct step for the student to take next according to AHA BLS guidelines?",
      options: [
        {
          id: "opt1",
          text: "Shout for nearby help to activate emergency response and fetch an AED, check carotid pulse and breathing for no more than 10 seconds, and immediately start high-quality chest compressions (100-120/min).",
          isCorrect: true,
          explanation: "In cardiac arrest, calling for help, fetching an AED, and initiating immediate uninterrupted chest compressions (100-120 bpm, 5 cm depth) maintains cerebral perfusion."
        },
        {
          id: "opt2",
          text: "Wait 15 minutes to see if the patient wakes up on their own.",
          isCorrect: false,
          explanation: "Brain death occurs within 4-6 minutes of untreated cardiac arrest."
        },
        {
          id: "opt3",
          text: "Prop the patient upright on a chair and offer a glass of water.",
          isCorrect: false,
          explanation: "Propping an unresponsive pulseless patient upright prevents blood flow to the brain and causes airway aspiration."
        },
        {
          id: "opt4",
          text: "Perform chest compressions at a very slow rate of 30 compressions per minute.",
          isCorrect: false,
          explanation: "Compressions slower than 100/min generate inadequate coronary and cerebral perfusion pressure."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "AHA-BLS-STUDENT-2026",
      validity: "2 Years",
      recognizedHospitals: ["All NMC Medical Colleges", "Apollo Hospitals", "Manipal Health", "Fortis"]
    }
  },

  // 21. STUDENT / INTERN: Hospital Hand Hygiene & Biomedical Waste Management
  "cme-bmw-702": {
    title: "Hospital Hand Hygiene & Biomedical Waste Management",
    provider: "World Health Organization (WHO) & NABH Infection Control",
    category: "Quality & NABH",
    duration: "4 Hours",
    level: "Beginner",
    cmeCredits: 4,
    rating: 4.92,
    reviewsCount: 1680,
    enrolledCount: 5120,
    accreditedBy: "National Accreditation Board for Hospitals & WHO",
    accreditationBadge: "4 CME Credits • WHO & NABH Aligned",
    summary: "WHO 5 Moments of Hand Hygiene & NABH BMW Rules 2016: Color-coded bin segregation (Yellow, Red, White, Blue), sharp disposal, and audit logging.",
    overview: "Crucial infection prevention training for all healthcare students and hospital workers. Covers the WHO 5 Moments of Hand Hygiene, correct 6-step hand rub technique, Biomedical Waste Management Rules 2016 color-coded segregation (Yellow, Red, White, Blue), and post-exposure prophylaxis for needle-stick injuries.",
    targetAudience: "Medical Students, Nursing Students, Ward Interns, and Hospital Environmental Staff.",
    skillsGained: ["WHO 5 Moments of Hand Hygiene", "Color-Coded BMW Bin Segregation", "Puncture-Proof Sharp Disposal", "Needle-Stick Injury Post-Exposure Prophylaxis"],
    whatYouWillLearn: [
      "Master the WHO 5 Moments of Hand Hygiene to prevent cross-contamination",
      "Segregate hospital waste accurately: Yellow (Anatomical/Soiled), Red (Recyclable Contaminated Plastic), White (Sharps), Blue (Glassware)",
      "Never recap needles; dispose immediately into puncture-proof translucent containers",
      "Follow mandatory needle-stick injury protocols (wash with soap/water, report to occupational health, start HIV PEP within 2 hours)"
    ],
    instructor: {
      name: "Sister Shirley Thomas",
      role: "Infection Control Officer & Clinical Nurse Specialist",
      hospital: "Manipal Hospitals, Bengaluru",
      avatarInitials: "ST",
      bio: "20+ years leading hospital infection control committees, hand hygiene audits, and NABH biomedical waste accreditation compliance."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: The WHO 5 Moments of Hand Hygiene",
        duration: "1.5 Hours",
        lessons: [
          { id: "l1_1", title: "The 5 Moments and Transmission Dynamics", duration: "30 min", type: "video", contentPreview: "Before touching patient, before aseptic procedure, after body fluid exposure, after touching patient, after surroundings." },
          { id: "l1_2", title: "Alcohol-Based Hand Rub vs Soap and Water", duration: "35 min", type: "interactive_case", contentPreview: "When soap and water is mandatory (visibly soiled hands and C. difficile spores)." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Biomedical Waste Rules 2016 Segregation",
        duration: "1.5 Hours",
        lessons: [
          { id: "l2_1", title: "Color Coding: Yellow, Red, White, Blue Bins", duration: "35 min", type: "video", contentPreview: "Detailed breakdown of plastics, anatomical waste, and glass vials." },
          { id: "l2_2", title: "Sharps Disposal in White Puncture-Proof Containers", duration: "35 min", type: "interactive_case", contentPreview: "Discarding contaminated needles, scalpels, and lancets." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Needle-Stick Injury & Post-Exposure Prophylaxis",
        duration: "1 Hour",
        lessons: [
          { id: "l3_1", title: "Immediate Wound Care & 2-Hour HIV PEP Window", duration: "30 min", type: "video", contentPreview: "Washing under running water, avoiding squeezing or sucking wound." },
          { id: "l3_2", title: "BMW & Hygiene Certification Exam", duration: "25 min", type: "quiz", contentPreview: "Bin segregation and safety scenarios." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Biomedical Waste Segregation & Sharps Disposal Safety",
      caseDescription: "A clinical student nurse performs an intramuscular injection of an antibiotic using a disposable plastic syringe and needle, followed by changing a heavily blood-soaked abdominal dressing gauze. The student is standing before the ward waste disposal station with Yellow, Red, White, and Blue containers.",
      patientVitals: {
        hr: "N/A",
        bp: "N/A",
        spo2: "N/A",
        rhythm: "Ward Shift Waste Segregation Audit"
      },
      prompt: "According to India Biomedical Waste Management Rules 2016, how must these items be segregated?",
      options: [
        {
          id: "opt1",
          text: "Dispose needle directly into White translucent puncture-proof sharp container without recapping, place plastic syringe barrel in Red container, and discard blood-soaked gauze dressing in Yellow container.",
          isCorrect: true,
          explanation: "Biomedical Waste Rules 2016: White container = metallic sharps/needles; Red container = contaminated recyclable plastic (catheters, IV tubing, syringe barrels); Yellow container = infectious anatomical and blood-soaked items."
        },
        {
          id: "opt2",
          text: "Throw the needle, syringe, and blood dressing together into the black general municipal garbage bin.",
          isCorrect: false,
          explanation: "Mixing clinical waste with general garbage violates environmental law and exposes municipal workers to HIV/Hepatitis B."
        },
        {
          id: "opt3",
          text: "Recap the needle using two hands and place it into the Red plastic bin.",
          isCorrect: false,
          explanation: "Two-handed recapping is the leading cause of needle-stick injuries and is strictly prohibited."
        },
        {
          id: "opt4",
          text: "Place the blood-soaked gauze into the Blue glass container.",
          isCorrect: false,
          explanation: "Blue containers are exclusively reserved for glassware (ampoules, vials) and metallic implants."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "WHO-NABH-BMW-2026",
      validity: "3 Years",
      recognizedHospitals: ["Manipal Hospitals", "Apollo Hospitals", "NABH Accredited Hospitals"]
    }
  },

  // 22. STUDENT / INTERN: Clinical Empathy & SBAR Emergency Handover Protocols
  "cme-sbar-703": {
    title: "Clinical Empathy & SBAR Emergency Handover Protocols",
    provider: "Harvard Macy Institute & World Federation for Medical Education",
    category: "Student Essentials",
    duration: "3 Hours",
    level: "Beginner",
    cmeCredits: 3,
    rating: 4.94,
    reviewsCount: 1420,
    enrolledCount: 4680,
    accreditedBy: "Harvard Macy Institute & National Medical Commission",
    accreditationBadge: "3 CME Credits • Harvard Aligned",
    summary: "Harvard Macy Institute: Situation-Background-Assessment-Recommendation (SBAR) handover, bedside communication with anxious families, and escalation.",
    overview: "Created in collaboration with Harvard Macy Institute educators. Teaches medical students and nursing interns the structured Situation-Background-Assessment-Recommendation (SBAR) communication tool, active listening at the bedside, breaking bad news with empathy, and effective escalation of clinical emergencies.",
    targetAudience: "MBBS Students, Interns, Junior Residents, and Trainee Nurses.",
    skillsGained: ["SBAR Clinical Handover", "Bedside Empathic Communication", "Early Warning Escalation", "Closed-Loop Verbal Orders"],
    whatYouWillLearn: [
      "Structure phone handovers to on-call consultants using the concise SBAR format in under 60 seconds",
      "Deliver compassionate, jargon-free explanations to anxious patients and their family members",
      "Execute closed-loop read-back verification for emergency telephone medication orders",
      "Recognize clinical deterioration early and activate Rapid Response Teams (RRT)"
    ],
    instructor: {
      name: "Dr. Alistair Ross",
      role: "Visiting Professor of Clinical Communication & Ethics",
      hospital: "Harvard Macy Institute",
      avatarInitials: "AR",
      bio: "22+ years training medical students and residents in humanistic medical communication, team crisis resource management, and patient safety."
    },
    modules: [
      {
        id: "m1",
        title: "Module 1: The SBAR Communication Framework",
        duration: "1 Hour",
        lessons: [
          { id: "l1_1", title: "Situation, Background, Assessment, Recommendation", duration: "25 min", type: "video", contentPreview: "Overcoming hierarchical barriers during emergency calls." },
          { id: "l1_2", title: "Standardized Shift-to-Shift Bedside Handovers", duration: "25 min", type: "interactive_case", contentPreview: "Passing vital sign trends and pending diagnostic investigations." }
        ]
      },
      {
        id: "m2",
        title: "Module 2: Verbal Orders & Closed-Loop Read-Back",
        duration: "1 Hour",
        lessons: [
          { id: "l2_1", title: "Preventing Errors in Telephone Prescriptions", duration: "25 min", type: "video", contentPreview: "Writing down and reading back drug name, dose, and route verbatim." },
          { id: "l2_2", title: "Handling Critical Lab Alerts (Panic Values)", duration: "25 min", type: "interactive_case", contentPreview: "Reporting potassium < 2.5 or > 6.0 mEq/L within 15 minutes." }
        ]
      },
      {
        id: "m3",
        title: "Module 3: Bedside Empathy & Student Certification",
        duration: "1 Hour",
        lessons: [
          { id: "l3_1", title: "Communicating with Distressed Patients and Families", duration: "25 min", type: "video", contentPreview: "Active listening, non-verbal cues, and addressing emotional concerns." },
          { id: "l3_2", title: "Clinical Handover Competency Exam", duration: "25 min", type: "quiz", contentPreview: "Simulation handover scenario exam." }
        ]
      }
    ],
    clinicalScenario: {
      title: "Acute Ward Deterioration SBAR Escalation Call",
      caseDescription: "A house surgeon or student nurse notices that a 70-year-old postoperative patient in the surgical ward has developed rapid shallow breathing (RR 32/min), heart rate of 128 bpm, blood pressure of 82/46 mmHg, and cold extremities. The student calls the senior ICU registrar on duty.",
      patientVitals: {
        hr: "128 bpm",
        bp: "82/46 mmHg (Profound Hypotension)",
        spo2: "90% on room air, RR 32/min",
        rhythm: "Sinus Tachycardia, Septic Shock Warning"
      },
      prompt: "What is the structured SBAR handover that the student should communicate to the ICU registrar?",
      options: [
        {
          id: "opt1",
          text: "'Situation: I am calling about Mr. Kumar in Bed 12 who is acutely deteriorating. Background: Day 2 post laparotomy. Assessment: Vitals show BP 82/46, HR 128, RR 32, SpO2 90% on room air with signs of septic shock. Recommendation: I request you to come evaluate the patient immediately at the bedside and advise fluid resuscitation.'",
          isCorrect: true,
          explanation: "SBAR clearly states: Situation (patient and problem), Background (clinical context), Assessment (vital signs and objective data), and Recommendation (urgent bedside review requested)."
        },
        {
          id: "opt2",
          text: "'Doctor, the patient in bed 12 looks sick. I don't know what to do. Can you check him sometime tomorrow morning?'",
          isCorrect: false,
          explanation: "Vague communication without vitals or specific urgency leads to fatal delays in septic shock management."
        },
        {
          id: "opt3",
          text: "Do not call the registrar; simply document the vitals in the chart and leave at shift change.",
          isCorrect: false,
          explanation: "Failing to escalate profound hypotension and tachycardia leads to preventable patient arrest."
        },
        {
          id: "opt4",
          text: "Tell the family that nothing is wrong and give the patient a sleeping pill.",
          isCorrect: false,
          explanation: "Giving sedatives to a patient in respiratory distress and shock can cause immediate respiratory arrest."
        }
      ]
    },
    certificateDetails: {
      credentialCode: "HARVARD-MACY-SBAR-2026",
      validity: "3 Years",
      recognizedHospitals: ["Harvard Macy Institute", "Apollo Hospitals", "NMC Accredited Hospitals"]
    }
  }
};

export function getAllRegistryCourses(): Course[] {
  return Object.entries(COURSE_CURRICULUM_REGISTRY).map(([id, reg]) => ({
    id,
    title: reg.title || "Accredited Clinical Course",
    provider: reg.provider || "FALE Clinical Academy",
    category: (reg.category as any) || "Critical Care",
    duration: reg.duration || "6 Hours",
    level: reg.level || "Intermediate",
    cmeCredits: reg.cmeCredits || 5,
    rating: reg.rating || 4.9,
    reviewsCount: reg.reviewsCount || 520,
    enrolledCount: reg.enrolledCount || 2100,
    accreditedBy: reg.accreditedBy || "Tamil Nadu Medical Council / NABH",
    accreditationBadge: reg.accreditationBadge || "Accredited CME",
    summary: reg.summary || "",
    overview: reg.overview || "",
    targetAudience: reg.targetAudience || "Healthcare Professionals and Clinical Trainees",
    skillsGained: reg.skillsGained || ["Clinical Medicine", "Patient Care", "Protocols"],
    whatYouWillLearn: reg.whatYouWillLearn || ["Clinical guidelines", "Emergency management"],
    instructor: reg.instructor as any,
    modules: (reg.modules as any) || [],
    clinicalScenario: reg.clinicalScenario as any,
    certificateDetails: (reg.certificateDetails as any) || {
      credentialCode: `FALE-${id.toUpperCase()}-2026`,
      validity: "3 Years",
      recognizedHospitals: ["Apollo Hospitals", "Fortis Healthcare", "Manipal Hospitals"]
    },
  }));
}
