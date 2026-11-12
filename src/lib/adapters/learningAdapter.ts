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
  return apiFetch<CourseDto[]>("/courses", { validate: Array.isArray });
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
    id: c.id, title: c.title || reg.title || "Untitled course",
    provider: reg.provider || "Not provided", category: c.category || reg.category || "Uncategorized",
    duration: c.duration || reg.duration || "Not provided", level: reg.level || "Beginner",
    cmeCredits: c.cmePoints ?? 0, rating: 0, reviewsCount: 0, enrolledCount: 0,
    accreditedBy: "", accreditationBadge: "", summary: c.summary || reg.summary || "",
    overview: reg.overview || c.summary || "", targetAudience: reg.targetAudience || "Not provided",
    skillsGained: reg.skillsGained || [], whatYouWillLearn: reg.whatYouWillLearn || [],
    instructor: { name: "Not provided", role: "", hospital: "", avatarInitials: "", bio: "" },
    modules: reg.modules || [],
    clinicalScenario: reg.clinicalScenario || { title: "No scenario provided", caseDescription: "", patientVitals: { hr: "", bp: "", spo2: "", rhythm: "" }, prompt: "", options: [] },
    certificateDetails: { credentialCode: c.certificateRef || "", validity: "", recognizedHospitals: [] },
  };
}

export async function getCourseById(id: string): Promise<Course | null> {
  const all = await getCourses();
  const found = all.find((course) => course.id === id);
  return found ? mapCourseDtoToCourse(found) : null;
}
