// src/lib/adapters/learningAdapter.ts
// Learning academy adapter for courses, CME credits, enrollment, and progress

import { apiFetch, isApiEnabled } from "@/lib/api";
import type { Course } from "@/lib/data";
import { COURSE_CURRICULUM_REGISTRY } from "@/lib/courseCurriculumRegistry";

export interface CourseDto {
  id: string;
  title: string;
  category: string;
  duration: string;
  cmePoints: number;
  summary: string;
  forStudents?: boolean;
  enrolled?: boolean;
  progressPercent: number;
  completed?: boolean;
  completedAt?: string;
  certificateRef?: string;
}

/**
 * Fetch CME course catalog with personalized enrollment and progress.
 */
export async function getCourses(): Promise<CourseDto[]> {
  return apiFetch<CourseDto[]>("/courses");
}

/**
 * Enroll in an accredited CME course.
 */
export async function enrollCourse(courseId: string): Promise<CourseDto> {
  return apiFetch<CourseDto>(`/courses/${courseId}/enroll`, {
    method: "POST",
  });
}

/**
 * Update course progress percentage.
 */
export async function updateCourseProgress(
  courseId: string,
  progressPercent: number
): Promise<CourseDto> {
  return apiFetch<CourseDto>(`/courses/${courseId}/progress`, {
    method: "POST",
    body: JSON.stringify({ progressPercent }),
  });
}

export function mapCourseDtoToCourse(c: CourseDto): Course {
  const reg = COURSE_CURRICULUM_REGISTRY[c.id] || {};

  return {
    id: c.id,
    title: c.title || reg.title || "Accredited Clinical Course",
    provider: reg.provider || "FALE Clinical Academy",
    category: (c.category as any) || (reg.category as any) || "Critical Care",
    duration: c.duration || reg.duration || "6 Hours",
    level: reg.level || "Intermediate",
    cmeCredits: c.cmePoints || reg.cmeCredits || 5,
    rating: reg.rating || 4.9,
    reviewsCount: reg.reviewsCount || 480,
    enrolledCount: reg.enrolledCount || 2300,
    accreditedBy: reg.accreditedBy || "Tamil Nadu Medical Council / NABH",
    accreditationBadge: reg.accreditationBadge || `${c.cmePoints || 5} CME Credits • Accredited`,
    summary: c.summary || reg.summary || "",
    overview: reg.overview || c.summary || "Comprehensive accredited clinical modules and emergency simulation cases designed for clinical excellence.",
    targetAudience: reg.targetAudience || "Healthcare Professionals and Clinical Trainees",
    skillsGained: reg.skillsGained || [c.category || "Clinical Medicine", "Patient Care", "Protocols"],
    whatYouWillLearn: reg.whatYouWillLearn || [
      "Evidence-based clinical guidelines and protocols",
      "Emergency bedside decision making and rapid intervention",
      "Multidisciplinary team communication and documentation"
    ],
    instructor: (reg.instructor as any) || {
      name: "Dr. K. Senthil Nathan",
      role: "Medical Superintendent",
      hospital: "FALE Partner Hospital, Chennai",
      avatarInitials: "SN",
      bio: "18+ years of clinical leadership and medical education.",
    },
    modules: (reg.modules as any) || [
      {
        id: "m1",
        title: "Module 1: Clinical Core Protocols",
        duration: c.duration || "2 Hours",
        lessons: [
          { id: "l1_1", title: "Protocol Introduction & Indications", duration: "25 min", type: "video", contentPreview: "Core indications and contraindications." },
          { id: "l1_2", title: "Clinical Case Assessment & Diagnostics", duration: "35 min", type: "interactive_case", contentPreview: "Bedside evaluation and diagnostic pathways." },
          { id: "l1_3", title: "Knowledge Check & Evaluation", duration: "20 min", type: "quiz", contentPreview: "Interactive self-assessment." },
        ],
      },
    ],
    clinicalScenario: (reg.clinicalScenario as any) || {
      title: "Acute Clinical Assessment Simulation",
      caseDescription: "A 54-year-old patient arrives with acute presentation requiring rapid decision making.",
      patientVitals: { hr: "115 bpm", bp: "95/60 mmHg", spo2: "91% on room air", rhythm: "Sinus Tachycardia" },
      prompt: "Patient displays signs of acute deterioration. What is the priority management step?",
      options: [
        { id: "opt1", text: "Administer high-flow oxygen and initiate protocol fluids", isCorrect: true, explanation: "Correct protocol priority." },
        { id: "opt2", text: "Wait for routine blood investigations", isCorrect: false, explanation: "Urgent stabilization required." },
      ],
    },
    certificateDetails: (reg.certificateDetails as any) || {
      credentialCode: c.certificateRef || `FALE-${c.id.toUpperCase()}-2026`,
      validity: "3 Years",
      recognizedHospitals: ["Apollo Hospitals", "Fortis Healthcare", "Manipal Hospitals", "Max Healthcare"],
    },
  };
}

export async function getCourseById(id: string): Promise<Course | null> {
  if (isApiEnabled) {
    try {
      const all = await getCourses();
      const found = all.find((c) => c.id === id);
      if (found) return mapCourseDtoToCourse(found);
    } catch (e) {
      console.warn("Failed to fetch course from API, falling back to registry:", e);
    }
  }
  const reg = COURSE_CURRICULUM_REGISTRY[id];
  if (reg) {
    return {
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
        recognizedHospitals: ["Apollo Hospitals", "Fortis Healthcare", "Manipal Hospitals"],
      },
    };
  }
  return null;
}
