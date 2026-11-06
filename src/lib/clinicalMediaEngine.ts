// src/lib/clinicalMediaEngine.ts
// Clinical Media & Telemetry Engine
// Provides course-specific video feeds and specialized clinical monitor simulations for all 22 courses.

export interface QuizQuestion {
  id: string;
  question: string;
  options: {
    id: string;
    text: string;
    isCorrect: boolean;
    explanation: string;
  }[];
}

export interface CourseMediaConfig {
  videoUrl: string;
  theme: "cardiac" | "respiratory" | "infection" | "icu" | "dialysis" | "pharmacy" | "rehab" | "radiology" | "student";
  simulationTitle?: string;
  simulationType?: string;
  monitorVitals: {
    hr: string;
    bp: string;
    spo2: string;
    rhythm: string;
    ecgType: "sinus" | "stemi" | "vf" | "tachycardia" | "bradycardia" | "ventilator" | "normal";
    customGauge1?: { label: string; value: string; status: "normal" | "warning" | "critical" };
    customGauge2?: { label: string; value: string; status: "normal" | "warning" | "critical" };
  };
  simulationData?: {
    procedureStep: string;
    checklist: string[];
    actionPrompt: string;
    actionButtons: { label: string; feedback: string; isCorrect: boolean }[];
  };
  lessonLectures?: Record<
    string,
    {
      subTopic: string;
      clinicalPoints: string[];
      pearl: string;
      clinicalFormula?: string;
    }
  >;
  quizQuestions: QuizQuestion[];
}

export const CLINICAL_COURSE_MEDIA: Record<string, CourseMediaConfig> = {
  // 1. DOCTOR: Acute Coronary Syndromes & 12-Lead ECG Mastery
  "cme-ecg-101": {
    videoUrl: "/videos/hero-hands.mp4",
    theme: "cardiac",
    monitorVitals: {
      hr: "118 bpm",
      bp: "88/58 mmHg",
      spo2: "93%",
      rhythm: "Acute Anterior STEMI (4mm ST elevation V1-V4)",
      ecgType: "stemi",
    },
    lessonLectures: {
      l1_1: {
        subTopic: "Anatomical Coronary Arteries & Reciprocal ST Changes",
        clinicalPoints: [
          "Leads V1-V4 reflect the Left Anterior Descending (LAD) anteroseptal territory.",
          "Leads II, III, and aVF reflect the Right Coronary Artery (RCA) inferior myocardium.",
          "True reciprocal ST depression in III and aVF confirms acute transmural LAD occlusion.",
          "Door-to-balloon primary PCI must occur in less than 90 minutes."
        ],
        pearl: "In acute anterior STEMI, reciprocal ST depression in leads III and aVF distinguishes localized coronary occlusion from benign pericarditis.",
        clinicalFormula: "Door-to-ECG < 10 mins • Door-to-Balloon < 90 mins • Door-to-Needle < 30 mins"
      },
      l1_2: {
        subTopic: "Reciprocal ST Depression vs Global Subendocardial Ischemia",
        clinicalPoints: [
          "Diffuse ST depressions with ST elevation in lead aVR indicates critical Left Main Coronary Artery (LMCA) occlusion.",
          "Check posterior leads V7-V9 whenever tall R-waves and ST depression appear in V1-V2.",
          "Wellens Syndrome Type A (biphasic T) and Type B (deeply inverted T) represent imminent anterior MI."
        ],
        pearl: "Never stress test a patient with Wellens warning patterns on resting ECG; proceed directly to coronary angiography."
      },
      l2_1: {
        subTopic: "Wellens Syndrome, de Winter T-Waves & STEMI Equivalents",
        clinicalPoints: [
          "De Winter pattern: 1-3 mm upsloping ST depression at J-point in precordial leads with tall symmetrical T-waves.",
          "Represents acute proximal LAD occlusion without classic ST elevation.",
          "Immediate cath lab activation is required as a primary STEMI equivalent."
        ],
        pearl: "De Winter T-waves are present in 2% of acute anterior LAD occlusions and must not be mistaken for benign tall T-waves."
      }
    },
    quizQuestions: [
      {
        id: "q1",
        question: "A 56-year-old male presents with 45 minutes of substernal chest pain. ECG shows 4 mm ST elevation in V1-V4 with reciprocal depression in III and aVF. Blood pressure is 88/58 mmHg. What is the immediate priority?",
        options: [
          { id: "o1", text: "Activate primary PCI catheterization lab immediately, administer Aspirin 325 mg + Ticagrelor 180 mg, and give gentle IV saline bolus.", isCorrect: true, explanation: "Immediate reperfusion (<90 min door-to-balloon) and dual antiplatelet therapy save ischemic myocardium." },
          { id: "o2", text: "Wait for 2nd high-sensitivity Troponin-I test result before contacting cardiology.", isCorrect: false, explanation: "In diagnostic STEMI, biomarker delays cause permanent myocardial necrosis." },
          { id: "o3", text: "Administer 100 mg IV Metoprolol to reduce myocardial oxygen demand.", isCorrect: false, explanation: "Beta blockers are contraindicated in cardiogenic shock and hypotension (BP 88/58)." },
          { id: "o4", text: "Schedule an outpatient treadmill stress test for next week.", isCorrect: false, explanation: "Stress testing in acute STEMI triggers fatal arrhythmias and rupture." }
        ]
      },
      {
        id: "q2",
        question: "Which lead pattern on a 12-lead ECG is most pathognomonic for critical left main coronary artery (LMCA) or proximal triple-vessel stenosis?",
        options: [
          { id: "o1", text: "ST elevation in aVR (>= 1 mm) greater than in V1, with widespread diffuse ST depression across leads I, II, and V4-V6.", isCorrect: true, explanation: "Lead aVR looks into the cavity of the left ventricle; ST elevation in aVR with diffuse ST depression signifies circumferential subendocardial ischemia." },
          { id: "o2", text: "Isolated T-wave flattening in lead III only.", isCorrect: false, explanation: "Isolated lead III changes are frequently normal variants." },
          { id: "o3", text: "Peaked P-waves in leads I and aVL.", isCorrect: false, explanation: "P-pulmonale signifies right atrial enlargement, not acute ischemia." },
          { id: "o4", text: "Short PR interval with delta wave in V1.", isCorrect: false, explanation: "This represents Wolff-Parkinson-White pre-excitation syndrome." }
        ]
      }
    ]
  },

  // 2. DOCTOR: Mechanical Ventilation in ARDS & COVID-19
  "cme-ards-102": {
    videoUrl: "/videos/hero-hands.mp4",
    theme: "respiratory",
    monitorVitals: {
      hr: "112 bpm",
      bp: "105/65 mmHg",
      spo2: "86%",
      rhythm: "Severe ARDS (P/F ratio 88, PEEP 14)",
      ecgType: "ventilator",
    },
    lessonLectures: {
      l1_1: {
        subTopic: "Lung-Protective Ventilation & Baby Lung Concept",
        clinicalPoints: [
          "Set tidal volume strictly between 4 to 6 mL/kg of Predicted Body Weight (PBW).",
          "Target plateau pressure (Pplat) strictly below 30 cmH2O.",
          "Keep driving pressure (Delta P = Pplat - PEEP) below 14 cmH2O to minimize strain.",
          "Permissive hypercapnia (pH >= 7.20) is acceptable to avoid barotrauma."
        ],
        pearl: "Ventilating ARDS lungs with volumes based on actual body weight causes fatal volutrauma; always calculate Predicted Body Weight from standing height.",
        clinicalFormula: "Male PBW = 50 + 0.91 * (height cm - 152.4) • Target Vt = 6 mL/kg PBW"
      },
      l2_1: {
        subTopic: "PROSEVA 16-Hour Prone Positioning Protocol",
        clinicalPoints: [
          "Indicated for severe ARDS with PaO2/FiO2 ratio < 150 mmHg.",
          "Prone positioning recruits dependent dorsal lung regions and improves V/Q match.",
          "Maintain prone position for at least 16 continuous hours per day.",
          "Ensure protective eye pads, head rotation every 2 hours, and secure tube taping."
        ],
        pearl: "The landmark PROSEVA trial proved that prone positioning for >= 16 hours/day reduces 28-day mortality from 32.8% to 16.0% in severe ARDS."
      }
    },
    quizQuestions: [
      {
        id: "q1",
        question: "A 48-year-old intubated male (height 175 cm, PBW 70 kg) with viral ARDS has PaO2/FiO2 88 on Vt 500 mL, PEEP 14, FiO2 1.0. Plateau pressure is 33 cmH2O (Driving pressure 19 cmH2O). What evidence-based bundle reduces mortality?",
        options: [
          { id: "o1", text: "Reduce tidal volume to 420 mL (6 mL/kg PBW) to lower driving pressure < 14 cmH2O and initiate prone positioning for 16 continuous hours.", isCorrect: true, explanation: "Low tidal volume (6 mL/kg PBW) and 16-hour prone positioning provide proven survival benefits in severe ARDS." },
          { id: "o2", text: "Increase tidal volume to 650 mL to blow off CO2.", isCorrect: false, explanation: "High tidal volumes cause fatal volutrauma and shearing stress." },
          { id: "o3", text: "Discontinue PEEP to zero cmH2O immediately.", isCorrect: false, explanation: "Removing PEEP causes severe derecruitment and catastrophic hypoxia." },
          { id: "o4", text: "Give a 2-liter normal saline bolus.", isCorrect: false, explanation: "Excess fluids worsen alveolar extravasation; conservative fluids are recommended." }
        ]
      }
    ]
  },

  // 3. DOCTOR: Emergency Sepsis Resuscitation Protocols
  "cme-sepsis-103": {
    videoUrl: "/videos/hero-hands.mp4",
    theme: "icu",
    monitorVitals: {
      hr: "132 bpm",
      bp: "78/42 mmHg",
      spo2: "91%",
      rhythm: "Septic Shock (MAP 54, Lactate 4.6)",
      ecgType: "tachycardia",
    },
    lessonLectures: {
      l1_1: {
        subTopic: "The 1-Hour Surviving Sepsis Bundle",
        clinicalPoints: [
          "Measure blood lactate immediately; remeasure within 2-4 hours if initial is > 2 mmol/L.",
          "Obtain 2 sets of blood cultures prior to starting broad-spectrum antimicrobials.",
          "Administer broad-spectrum IV antibiotics within 1 hour of recognition.",
          "Rapidly infuse 30 mL/kg balanced crystalloids for hypotension or lactate >= 4 mmol/L."
        ],
        pearl: "Every 1-hour delay in antibiotic administration for septic shock increases in-hospital mortality by 7.6%.",
        clinicalFormula: "MAP = (2 * DBP + SBP) / 3 • Target MAP >= 65 mmHg"
      }
    },
    quizQuestions: [
      {
        id: "q1",
        question: "A 62-year-old female presents with septic shock, MAP 54 mmHg, and lactate 4.6 mmol/L unresponsive to initial 500 mL fluid. What is the immediate required protocol?",
        options: [
          { id: "o1", text: "Administer 30 mL/kg balanced crystalloids within 1 hour, initiate Norepinephrine targeting MAP >= 65 mmHg, and infuse broad-spectrum IV antibiotics within 60 minutes.", isCorrect: true, explanation: "Surviving Sepsis Campaign guidelines mandate early vasopressors and antibiotics within 1 hour." },
          { id: "o2", text: "Withhold vasopressors and give 8 liters of normal saline over 24 hours.", isCorrect: false, explanation: "Excessive saline without pressors causes hyperchloremic acidosis and acute pulmonary edema." },
          { id: "o3", text: "Start Dopamine as the first-line vasopressor.", isCorrect: false, explanation: "Dopamine is associated with significantly higher tachyarrhythmias than Norepinephrine." }
        ]
      }
    ]
  },

  // 7. NURSE: NABH Central Line (CLABSI) Infection Prevention
  "cme-clabsi-203": {
    videoUrl: "/videos/hero-hands.mp4",
    theme: "infection",
    simulationTitle: "NABH 5th Edition Central Line Insertion & Scrub-the-Hub Maintenance",
    simulationType: "Sterile Barrier & Ultrasound Guide",
    monitorVitals: {
      hr: "78 bpm",
      bp: "118/76 mmHg",
      spo2: "99%",
      rhythm: "Internal Jugular CVC Day 7 (Maintenance Audit)",
      ecgType: "normal",
      customGauge1: { label: "Chlorhexidine Scrub", value: "15-Sec Hub Scrub", status: "normal" },
      customGauge2: { label: "Line Necessity Audit", value: "No Vasopressors (Due Removal)", status: "warning" },
    },
    simulationData: {
      procedureStep: "NABH 5th Edition CLABSI Prevention Bundle",
      checklist: [
        "Maximum sterile barrier precautions: cap, mask, sterile gown, gloves, full-body drape",
        "2% Chlorhexidine in 70% alcohol skin prep allowed to air dry completely for 2 minutes",
        "Needleless connector access port scrubbed vigorously for 15 seconds before each access",
        "Transparent semipermeable dressing intact; daily line necessity audit conducted",
      ],
      actionPrompt: "ICU patient Day 7 post-op: stable vitals, tolerating oral diet, no IV pressors. CVC remains in place.",
      actionButtons: [
        { label: "Recommend immediate CVC removal to eliminate CLABSI risk", feedback: "Verified: Daily necessity auditing and prompt removal of unneeded lines is the #1 defense against CLABSI.", isCorrect: true },
        { label: "Keep line for routine blood sampling convenience", feedback: "Violation: Keeping central lines solely for blood draws drastically increases bloodstream infections.", isCorrect: false },
        { label: "Infuse prophylactic IV Vancomycin through line", feedback: "Contraindicated: Antibiotic lock/prophylaxis promotes multidrug-resistant superbugs.", isCorrect: false },
      ],
    },
    lessonLectures: {
      l1_1: {
        subTopic: "NABH 5th Edition Central Line Insertion Bundle",
        clinicalPoints: [
          "Strict hand hygiene with alcohol rub before any central catheter procedure.",
          "Maximum sterile barrier precautions: sterile gown, sterile gloves, cap, mask, full-body patient drape.",
          "Skin antisepsis: 2% Chlorhexidine gluconate in 70% isopropyl alcohol with friction scrub.",
          "Allow chlorhexidine to air dry completely for at least 2 full minutes before puncturing."
        ],
        pearl: "Never fan or blow on prep solution to dry it; chlorhexidine requires 2 minutes of continuous wet contact time to achieve residual bactericidal activity.",
        clinicalFormula: "Chlorhexidine 2% in 70% Alcohol • 15-second Hub Scrub • 7-day Dressing Cycle"
      },
      l2_1: {
        subTopic: "Maintenance Bundle & Daily Line Necessity Audit",
        clinicalPoints: [
          "Scrub the needleless connector hub with 70% alcohol for 15 seconds before every single access.",
          "Change transparent semipermeable dressing every 7 days, or immediately if loose, soiled, or damp.",
          "Audit line necessity daily during morning rounds; prompt immediate removal when indications cease."
        ],
        pearl: "The single most effective intervention to prevent catheter-associated bloodstream infection is prompt removal of unnecessary central lines."
      }
    },
    quizQuestions: [
      {
        id: "q1",
        question: "During daily ICU rounds, a postoperative patient with an internal jugular CVC placed 7 days ago is hemodynamically stable, tolerating full oral diet, and off all vasopressors. What is the priority infection control action?",
        options: [
          { id: "o1", text: "Recommend immediate removal of the central venous line because line necessity has ceased.", isCorrect: true, explanation: "Prompt discontinuation of non-essential catheters is the single most effective way to eliminate CLABSI." },
          { id: "o2", text: "Keep the line in place for routine laboratory blood sampling convenience.", isCorrect: false, explanation: "Maintaining central lines solely for blood draws drastically increases bacteremia risks." },
          { id: "o3", text: "Start prophylactic IV Vancomycin through the central line catheter.", isCorrect: false, explanation: "Prophylactic antibiotics for catheters induce multidrug-resistant superinfections." }
        ]
      },
      {
        id: "q2",
        question: "Under CDC and NABH standards, what is the mandatory friction scrubbing duration for needleless IV access ports before infusing medications?",
        options: [
          { id: "o1", text: "Scrub the access hub vigorously with 70% alcohol for a minimum of 15 seconds.", isCorrect: true, explanation: "Evidence shows 15 seconds of mechanical friction scrubbing effectively sterilizes needle-free connectors." },
          { id: "o2", text: "Quick 1-second swipe with dry cotton.", isCorrect: false, explanation: "Quick wipes fail to eradicate bacterial biofilms on luer connectors." },
          { id: "o3", text: "No scrubbing needed if the port was covered with tape.", isCorrect: false, explanation: "Ports are easily colonized; mandatory friction scrubbing is required before every entry." }
        ]
      }
    ]
  },

  // 5. NURSE: AHA Advanced Cardiovascular Life Support (ACLS) Core
  "cme-acls-201": {
    videoUrl: "/videos/hero-hands.mp4",
    theme: "cardiac",
    monitorVitals: {
      hr: "0 bpm",
      bp: "Unrecordable",
      spo2: "Unrecordable",
      rhythm: "Coarse Ventricular Fibrillation (VF)",
      ecgType: "vf",
    },
    lessonLectures: {
      l1_1: {
        subTopic: "High-Quality CPR & Compression Fractions",
        clinicalPoints: [
          "Rate: 100 to 120 compressions per minute.",
          "Depth: at least 5 cm (2 inches), but not more than 6 cm in adults.",
          "Allow complete chest wall recoil between each compression.",
          "Target chest compression fraction (CCF) > 80%; minimize pauses to < 5 seconds."
        ],
        pearl: "Pausing CPR for more than 10 seconds causes coronary perfusion pressure to drop to near zero; it takes 15 compressions to rebuild it.",
        clinicalFormula: "100-120 bpm • 5-6 cm Depth • 200J Biphasic Shock • Epi 1mg q3-5m"
      }
    },
    quizQuestions: [
      {
        id: "q1",
        question: "A telemetry inpatient collapses with coarse Ventricular Fibrillation on the monitor. CPR is initiated. What is the correct defibrillation and medication sequence?",
        options: [
          { id: "o1", text: "Deliver immediate unsynchronized biphasic shock at 200J, resume 2 minutes of continuous CPR before pulse check, and prepare Epinephrine 1 mg after the second shock.", isCorrect: true, explanation: "VF requires immediate defibrillation. CPR must resume immediately after the shock without pausing for pulse checks until 2 minutes are completed." },
          { id: "o2", text: "Administer Epinephrine 1 mg IV push before delivering any shock.", isCorrect: false, explanation: "Shock takes precedence in VF; Epinephrine is given only after the 2nd shock." },
          { id: "o3", text: "Deliver a synchronized 50J shock.", isCorrect: false, explanation: "Synchronized mode will not fire in VF because there are no R-waves." }
        ]
      }
    ]
  },

  // 12. DIALYSIS TECH: Hemodialysis Vascular Access & Fistula Complications
  "cme-fistula-401": {
    videoUrl: "/videos/hero-hands.mp4",
    theme: "dialysis",
    monitorVitals: {
      hr: "88 bpm",
      bp: "144/88 mmHg",
      spo2: "97%",
      rhythm: "Left Forearm AV Fistula (Venous Alarm > 250)",
      ecgType: "normal",
    },
    lessonLectures: {
      l1_1: {
        subTopic: "Physical Exam & Rope-Ladder Cannulation",
        clinicalPoints: [
          "Inspect for aneurysms, pseudoaneurysms, and skin breakdown.",
          "Palpate continuous thrill (soft purr) throughout systole and diastole.",
          "Auscultate low-pitched, continuous bruit; a high-pitched whistling bruit indicates stenosis.",
          "Rotate needle insertion sites along the vessel using rope-ladder technique."
        ],
        pearl: "Repeated punctures in the same area cause 'one-site' pseudoaneurysms that risk catastrophic rupture.",
        clinicalFormula: "Bevel Up 20-30° • Needle Tips >= 5 cm Apart • Dynamic Venous Pressure < 50% QB"
      }
    },
    quizQuestions: [
      {
        id: "q1",
        question: "Ten minutes after starting hemodialysis at blood flow 300 mL/min, the machine sounds a high venous pressure alarm (> 250 mmHg) with localized swelling and pain around the venous needle. What is the immediate action?",
        options: [
          { id: "o1", text: "Stop the blood pump immediately, disconnect venous line without flushing, remove the infiltrated needle, apply firm sterile manual pressure for 10-15 minutes, and apply ice packs.", isCorrect: true, explanation: "Stopping the blood pump halts subcutaneous bleeding. Manual pressure controls the hematoma, and cold packs reduce edema." },
          { id: "o2", text: "Forcefully flush the needle with 20 mL of normal saline to clear obstruction.", isCorrect: false, explanation: "Flushing an infiltrated needle into subcutaneous tissue causes compartment syndrome." },
          { id: "o3", text: "Increase blood pump flow to 400 mL/min.", isCorrect: false, explanation: "Increasing pump speed drastically exacerbates bleeding into the arm." }
        ]
      }
    ]
  },

  // 17. PHYSIOTHERAPIST: Neuro-Developmental Therapy in Acute Stroke Rehab
  "cme-stroke-503": {
    videoUrl: "/videos/hero-hands.mp4",
    theme: "rehab",
    monitorVitals: {
      hr: "76 bpm",
      bp: "134/82 mmHg",
      spo2: "98%",
      rhythm: "Day 3 Post-MCA Stroke (Flaccid Left Hemiplegia)",
      ecgType: "normal",
    },
    lessonLectures: {
      l1_1: {
        subTopic: "Hemiplegic Shoulder Subluxation Prevention",
        clinicalPoints: [
          "In flaccid hemiplegia, the supraspinatus and deltoid fail to hold the humeral head in the glenoid cavity.",
          "Never pull on the paretic arm during transfers or repositioning.",
          "Position the scapula in protraction with forearm supinated and supported on a pillow.",
          "Apply an approved humeral support cuff or lap-tray when seated in a wheelchair."
        ],
        pearl: "Traction on a flaccid shoulder causes brachial plexus stretch injuries and severe complex regional pain syndrome (CRPS).",
        clinicalFormula: "Scapular Protraction • Humeral Cuff Support • No Arm Pulling Transfers"
      }
    },
    quizQuestions: [
      {
        id: "q1",
        question: "A patient on post-stroke day 3 presents with flaccid paralysis of the left upper limb. A caregiver is seen pulling the patient up in bed by both forearms. What is the mandatory clinical directive?",
        options: [
          { id: "o1", text: "Instruct family and staff never to pull on the paretic arm; support humeral head in bed with pillows maintaining scapular protraction, and use a humeral cuff sling when upright.", isCorrect: true, explanation: "Pulling on a flaccid arm causes inferior glenohumeral subluxation and traction neuropathy." },
          { id: "o2", text: "Allow the arm to dangle off the edge of the bed.", isCorrect: false, explanation: "Gravitational distraction worsens joint capsule tear." },
          { id: "o3", text: "Apply high-resistance 20 kg bicep curls to the flaccid arm.", isCorrect: false, explanation: "Flaccid muscles cannot contract; heavy weights tear soft tissue." }
        ]
      }
    ]
  },

  // 18. RADIOGRAPHER: Multi-Slice CT Trauma Protocols & Contrast Safety
  "cme-trauma-ct-601": {
    videoUrl: "/videos/hero-hands.mp4",
    theme: "radiology",
    monitorVitals: {
      hr: "138 bpm",
      bp: "72/40 mmHg",
      spo2: "84%",
      rhythm: "CT Gantry Anaphylaxis (Laryngeal Edema, Stridor)",
      ecgType: "tachycardia",
    },
    lessonLectures: {
      l1_1: {
        subTopic: "Acute Contrast Media Reactions & Anaphylaxis",
        clinicalPoints: [
          "Severe anaphylactoid reactions manifest with stridor, severe hypotension, and airway edema.",
          "Intramuscular Epinephrine 0.3 to 0.5 mg (1:1000) into the anterolateral mid-thigh is the immediate first-line drug.",
          "Never give IV Epinephrine 1:1000 boluses due to fatal cardiac arrhythmia risks.",
          "Administer high-flow 100% oxygen via non-rebreather mask and summon Code Blue."
        ],
        pearl: "Epinephrine is the only medication that prevents and reverses fatal upper airway edema and cardiovascular collapse in anaphylaxis.",
        clinicalFormula: "IM Epinephrine 0.3-0.5 mg (1:1000) Anterolateral Thigh • 100% O2 • Code Blue"
      }
    },
    quizQuestions: [
      {
        id: "q1",
        question: "During contrast CT scanning, a trauma patient suddenly develops throat tightness, audible stridor, facial angioedema, and BP drops to 72/40 mmHg. What is the radiographer's immediate emergency intervention?",
        options: [
          { id: "o1", text: "Stop contrast injection, summon hospital Code Blue team, administer Epinephrine 0.3-0.5 mg (1:1000) Intramuscularly into anterolateral mid-thigh, and give high-flow oxygen.", isCorrect: true, explanation: "IM Epinephrine in the mid-thigh rapidly reverses laryngeal edema and distributive shock." },
          { id: "o2", text: "Continue the CT scan to finish the images first.", isCorrect: false, explanation: "Continuing imaging during acute anaphylactic shock results in death." },
          { id: "o3", text: "Give oral antihistamines with a glass of water.", isCorrect: false, explanation: "Patients with stridor will aspirate, and oral antihistamines are too slow-acting." }
        ]
      }
    ]
  },

  // 20. STUDENT / INTERN: Foundational BLS & High-Quality Chest Compressions
  "cme-bls-701": {
    videoUrl: "/videos/hero-hands.mp4",
    theme: "student",
    monitorVitals: {
      hr: "0 bpm",
      bp: "0 mmHg",
      spo2: "0%",
      rhythm: "Pulseless Cardiac Arrest (No Carotid Pulse)",
      ecgType: "vf",
    },
    lessonLectures: {
      l1_1: {
        subTopic: "The Adult BLS Algorithm & Scene Safety",
        clinicalPoints: [
          "Verify scene safety, tap shoulders shouting 'Are you OK?'.",
          "Shout for nearby help, activate emergency response, and call for an AED.",
          "Check carotid pulse and breathing simultaneously for no more than 10 seconds.",
          "Start compressions immediately: 30 compressions to 2 breaths in adult single-rescuer CPR."
        ],
        pearl: "If you are not certain that you feel a definite pulse within 10 seconds, begin chest compressions immediately.",
        clinicalFormula: "30:2 Ratio • 100-120/min • 5-6 cm Depth • AED Analysis q2m"
      }
    },
    quizQuestions: [
      {
        id: "q1",
        question: "You find an adult victim collapsed and motionless in the hospital corridor. After verifying scene safety and shouting for help, you check for breathing and carotid pulse. You feel no pulse after 8 seconds. What is the next immediate step?",
        options: [
          { id: "o1", text: "Immediately begin high-quality chest compressions at 100-120 per minute at a depth of 5-6 cm, allowing complete chest recoil.", isCorrect: true, explanation: "AHA guidelines mandate immediate uninterrupted compressions when pulse is absent within 10 seconds." },
          { id: "o2", text: "Wait another 60 seconds to see if the patient wakes up.", isCorrect: false, explanation: "Delaying CPR causes irreversible hypoxic brain injury within 4-6 minutes." },
          { id: "o3", text: "Prop the patient upright and offer a glass of water.", isCorrect: false, explanation: "Propping an unresponsive patient causes cerebral hypoperfusion and airway obstruction." }
        ]
      }
    ]
  },

  // 21. STUDENT / INTERN: Hospital Hand Hygiene & Biomedical Waste Management
  "cme-bmw-702": {
    videoUrl: "/videos/hero-hands.mp4",
    theme: "infection",
    monitorVitals: {
      hr: "N/A",
      bp: "N/A",
      spo2: "N/A",
      rhythm: "Biomedical Waste Audit (Rules 2016)",
      ecgType: "normal",
    },
    lessonLectures: {
      l1_1: {
        subTopic: "Biomedical Waste Rules 2016 Color Coding",
        clinicalPoints: [
          "Yellow Bin: Human anatomical waste, soiled dressings, blood bags, expired cytotoxic drugs.",
          "Red Bin: Contaminated recyclable plastics: IV tubing, catheter bags, disposable syringe barrels (without needles).",
          "White Puncture-Proof Container: Metallic sharps, needles, scalpels, surgical blades.",
          "Blue Cardboard Box: Broken glassware, glass vials, medicine ampoules, metallic orthopedic implants."
        ],
        pearl: "Never recap needles using two hands; discard needles directly into the translucent puncture-proof White sharps container at the bedside.",
        clinicalFormula: "Yellow: Soiled/Anatomical • Red: Recyclable Plastics • White: Metal Sharps • Blue: Glass"
      }
    },
    quizQuestions: [
      {
        id: "q1",
        question: "After administering an intramuscular injection and changing a blood-soaked surgical wound dressing, how should the disposable syringe with needle and blood dressing be segregated under BMW Rules 2016?",
        options: [
          { id: "o1", text: "Cut/dispose needle into the White puncture-proof container without recapping, plastic syringe barrel in Red bin, and blood-soaked dressing in Yellow bin.", isCorrect: true, explanation: "White = sharps, Red = recyclable plastics/syringes, Yellow = anatomical and infectious soiled dressings." },
          { id: "o2", text: "Throw everything into the black municipal waste bin.", isCorrect: false, explanation: "Mixing hospital infectious waste with municipal garbage violates environmental laws." },
          { id: "o3", text: "Recap the needle using two hands and place it in the Red bin.", isCorrect: false, explanation: "Two-handed recapping is the leading cause of needle-stick injuries and is prohibited." }
        ]
      }
    ]
  },

  // 22. STUDENT / INTERN: Clinical Empathy & SBAR Emergency Handover Protocols
  "cme-sbar-703": {
    videoUrl: "/videos/hero-hands.mp4",
    theme: "student",
    monitorVitals: {
      hr: "128 bpm",
      bp: "82/46 mmHg",
      spo2: "90%",
      rhythm: "Ward Deterioration (RR 32/min, Temp 39.1°C)",
      ecgType: "tachycardia",
    },
    lessonLectures: {
      l1_1: {
        subTopic: "The SBAR Framework for Urgent Escalation",
        clinicalPoints: [
          "Situation: State your name, ward, patient name, bed number, and immediate concern.",
          "Background: State admission diagnosis, pertinent medical history, and recent procedures.",
          "Assessment: Provide current objective vitals, GCS score, and clinical impressions.",
          "Recommendation: Clearly request a specific action, consultation, or bedside review."
        ],
        pearl: "Always request a closed-loop read-back when receiving telephone verbal medication orders to prevent decimal point and dosing errors.",
        clinicalFormula: "S: Situation • B: Background • A: Assessment • R: Recommendation"
      }
    },
    quizQuestions: [
      {
        id: "q1",
        question: "A ward patient develops acute hypotension (BP 82/46), tachycardia (HR 128), and tachypnea (RR 32). When calling the on-call ICU registrar, what structured handover must be used?",
        options: [
          { id: "o1", text: "SBAR format: Situation (Bed 12 acute shock), Background (Day 2 post laparotomy), Assessment (BP 82/46, HR 128, fever), Recommendation (Request immediate bedside ICU evaluation).", isCorrect: true, explanation: "SBAR provides a structured, concise, and unambiguous escalation format." },
          { id: "o2", text: "Call and say 'The patient looks sick, please see him whenever you are free'.", isCorrect: false, explanation: "Vague communication delays critical interventions in septic shock." },
          { id: "o3", text: "Leave a handwritten note at the nursing station without calling.", isCorrect: false, explanation: "Failing to verbally escalate acute deterioration leads to preventable cardiac arrest." }
        ]
      }
    ]
  }
};

/**
 * Get media configuration for a course. Falls back to a tailored config based on category if courseId not specifically registered.
 */
export function getCourseMediaConfig(courseId: string, category: string, summary?: string): CourseMediaConfig {
  const base = CLINICAL_COURSE_MEDIA[courseId];
  const lowerCat = (category || "").toLowerCase();

  let theme: CourseMediaConfig["theme"] = base?.theme || "cardiac";
  let ecgType: CourseMediaConfig["monitorVitals"]["ecgType"] = base?.monitorVitals?.ecgType || "normal";
  let rhythm = base?.monitorVitals?.rhythm || "Continuous Telemetry Active";
  let hr = base?.monitorVitals?.hr || "78 bpm";
  let bp = base?.monitorVitals?.bp || "120/80 mmHg";
  let spo2 = base?.monitorVitals?.spo2 || "98%";

  if (!base) {
    if (lowerCat.includes("dialysis") || lowerCat.includes("renal")) {
      theme = "dialysis";
      rhythm = "Dialysis Circuit Active (Venous Pressure Normal)";
      hr = "82 bpm";
      bp = "136/84 mmHg";
    } else if (lowerCat.includes("pharmacol") || lowerCat.includes("pharmacy")) {
      theme = "pharmacy";
      rhythm = "High-Alert Verification & Infusion Check";
      hr = "76 bpm";
      bp = "122/78 mmHg";
    } else if (lowerCat.includes("physio") || lowerCat.includes("rehab")) {
      theme = "rehab";
      rhythm = "Active Rehabilitation & Mobilization";
      hr = "84 bpm";
      bp = "126/80 mmHg";
    } else if (lowerCat.includes("radio") || lowerCat.includes("imaging")) {
      theme = "radiology";
      rhythm = "Contrast Infusion & Radiation Shielded";
      hr = "80 bpm";
      bp = "124/82 mmHg";
    } else if (lowerCat.includes("nursing") || lowerCat.includes("infection")) {
      theme = "infection";
      rhythm = "Sterile Barrier & Sepsis Surveillance";
      hr = "78 bpm";
      bp = "118/76 mmHg";
    } else if (lowerCat.includes("student")) {
      theme = "student";
      rhythm = "Clinical Foundation & Skill Mastery";
      hr = "72 bpm";
      bp = "120/75 mmHg";
    }
  }

  // Course-specific simulation data defaults if not defined on base
  let defaultSimData: CourseMediaConfig["simulationData"] = {
    procedureStep: `${category || "Clinical"} Standard Operating Procedure`,
    checklist: [
      "Patient identity and procedure verified against clinical records",
      "Sterile barriers donned and WHO 5 Moments hand hygiene completed",
      "NABH, CDC, and specialty accreditation guidelines adhered to",
      "Closed-loop documentation and multidisciplinary handover finalized",
    ],
    actionPrompt: "Confirm evidence-based clinical directive according to hospital accreditation standards.",
    actionButtons: [
      { label: "Follow Verified Clinical Safety Checklist", feedback: "Verified: Standardized protocols significantly minimize adverse events.", isCorrect: true },
      { label: "Omit Safety Steps to Expedite Care", feedback: "Violation: Omission of verification steps is the primary cause of clinical error.", isCorrect: false },
    ],
  };

  if (courseId === "cme-clabsi-203" || lowerCat.includes("clabsi") || lowerCat.includes("central line")) {
    defaultSimData = {
      procedureStep: "NABH 5th Edition Central Line Insertion & Scrub-the-Hub Bundle",
      checklist: [
        "Maximum sterile barrier precautions: Cap, mask, sterile gown, gloves, full-body drape",
        "2% Chlorhexidine in 70% alcohol skin prep with 2 minutes complete air drying",
        "Needleless access hub scrubbed vigorously for 15 seconds before every entry",
        "Transparent dressing intact; daily line necessity audit conducted on rounds",
      ],
      actionPrompt: "ICU patient Day 7 post-op: stable vitals, tolerating oral diet, no IV pressors. CVC remains in place.",
      actionButtons: [
        { label: "Recommend immediate CVC removal to eliminate CLABSI risk", feedback: "Verified: Daily necessity auditing and prompt removal of unneeded lines is the #1 defense against CLABSI.", isCorrect: true },
        { label: "Keep line for routine blood sampling convenience", feedback: "Violation: Keeping central lines solely for blood draws drastically increases bloodstream infections.", isCorrect: false },
        { label: "Infuse prophylactic IV Vancomycin through line", feedback: "Contraindicated: Antibiotic lock/prophylaxis promotes multidrug-resistant superbugs.", isCorrect: false },
      ],
    };
  }

  return {
    videoUrl: base?.videoUrl || "/videos/hero-hands.mp4",
    theme,
    simulationTitle: base?.simulationTitle || `${category || "Clinical"} Procedural Simulation`,
    simulationType: base?.simulationType || "Standard Telemetry Monitor",
    monitorVitals: {
      hr,
      bp,
      spo2,
      rhythm,
      ecgType,
      customGauge1: base?.monitorVitals?.customGauge1,
      customGauge2: base?.monitorVitals?.customGauge2,
    },
    simulationData: base?.simulationData || defaultSimData,
    lessonLectures: base?.lessonLectures || {},
    quizQuestions: base?.quizQuestions && base.quizQuestions.length > 0 ? base.quizQuestions : [
      {
        id: "q_auto_1",
        question: `According to standard clinical protocols in ${category || "Clinical Medicine"}, what is the primary verified best practice?`,
        options: [
          { id: "o1", text: "Strictly adhere to verified clinical guidelines, closed-loop documentation, and standardized safety checklists.", isCorrect: true, explanation: "Standardized clinical protocols and checklists reduce adverse events and ensure high compliance with accreditation standards." },
          { id: "o2", text: "Rely solely on personal habit without following institutional SOPs.", isCorrect: false, explanation: "Bypassing SOPs is the leading cause of preventable clinical errors." },
          { id: "o3", text: "Delay clinical escalation until the next calendar shift.", isCorrect: false, explanation: "Timely intervention is essential for patient safety." }
        ]
      }
    ]
  };
}

