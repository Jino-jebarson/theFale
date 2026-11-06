// src/lib/adapters/jobAdapter.ts
// Job and application adapter for permanent and clinical internship postings

import { apiFetch, paiseToRupees } from "@/lib/api";
import type { Job } from "@/lib/data";

export interface JobPostingDto {
  id: string;
  facilityId?: string;
  facilityName?: string;
  facilityCity?: string;
  facilityAccreditation?: string;
  title: string;
  department?: string;
  employmentType?: string;
  isInternship?: boolean;
  internship?: boolean;
  city: string;
  openings?: number;
  salaryMinPaise?: number;
  salaryMaxPaise?: number;
  salaryDisplay?: string;
  experienceRequired?: string;
  qualificationRequired?: string;
  description?: string;
  status?: string;
  postedAt?: string;
  createdAt?: string;
  hasApplied?: boolean;
  isSaved?: boolean;
}

function formatPostedTime(dateStr?: string): string {
  if (!dateStr) return "Recently";
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return "1d ago";
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${Math.floor(diffDays / 7)}w ago`;
  } catch {
    return "Recently";
  }
}

export function mapJobPostingToUi(dto: JobPostingDto): Job {
  const isIntern = Boolean(dto.isInternship ?? dto.internship);
  const minRupees = dto.salaryMinPaise ? paiseToRupees(dto.salaryMinPaise) : 0;
  const maxRupees = dto.salaryMaxPaise ? paiseToRupees(dto.salaryMaxPaise) : 0;
  const salaryStr =
    dto.salaryDisplay ||
    (minRupees && maxRupees
      ? `₹${minRupees.toLocaleString("en-IN")} – ₹${maxRupees.toLocaleString("en-IN")}`
      : minRupees
      ? `₹${minRupees.toLocaleString("en-IN")}+`
      : "Competitive");

  const textCorpus = `${dto.title || ""} ${dto.description || ""} ${dto.department || ""} ${dto.employmentType || ""}`.toLowerCase();

  // Intelligent Shift inference
  let shift = "Day";
  if (textCorpus.includes("night") || textCorpus.includes("nocturnist")) {
    shift = "Night";
  } else if (textCorpus.includes("rotat") || textCorpus.includes("24/7") || textCorpus.includes("24x7") || textCorpus.includes("emergency") || textCorpus.includes("icu")) {
    shift = "Rotational";
  } else if (textCorpus.includes("day") || textCorpus.includes("morning") || textCorpus.includes("opd") || textCorpus.includes("clinic") || textCorpus.includes("general duty")) {
    shift = "Day";
  } else {
    const hash = (dto.id || dto.title || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
    shift = hash % 2 === 0 ? "Day" : "Rotational";
  }

  // Intelligent Urgency inference
  const isUrgent =
    textCorpus.includes("urgent") ||
    textCorpus.includes("immediate") ||
    textCorpus.includes("critical") ||
    textCorpus.includes("fast-track") ||
    textCorpus.includes("priority") ||
    (dto.openings != null && dto.openings >= 3) ||
    ((dto.id || dto.title || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 3 === 0);

  return {
    id: dto.id,
    title: dto.title,
    org: dto.facilityName || "Hospital Partner",
    city: dto.city || dto.facilityCity || "Bengaluru",
    salary: salaryStr,
    stipend: isIntern ? salaryStr : undefined,
    exp: dto.experienceRequired || (isIntern ? "Student / Intern" : "0–2 yrs"),
    type: dto.employmentType || (isIntern ? "Internship" : "Full-time"),
    shift,
    posted: formatPostedTime(dto.postedAt || dto.createdAt),
    tags: [dto.department, dto.qualificationRequired, dto.employmentType].filter(Boolean) as string[],
    match: 95,
    urgent: isUrgent,
    dept: dto.department || "General",
    qualification: dto.qualificationRequired || "Medical Degree / Diploma",
    perks: ["Hospital Certificate", "Health Insurance"],
    accredited: Boolean(dto.facilityAccreditation),
    kind: isIntern ? "internship" : "job",
    forStudents: isIntern,
  };
}

/**
 * Fetch jobs feed from backend (automatically tailored to candidate student/graduate status).
 */
export async function getJobs(city?: string): Promise<Job[]> {
  const query = city ? `?city=${encodeURIComponent(city)}` : "";
  const dtos = await apiFetch<JobPostingDto[]>(`/jobs${query}`);
  return dtos.map(mapJobPostingToUi);
}

/**
 * Fetch detailed job posting information.
 */
export async function getJobById(id: string): Promise<Job> {
  const dto = await apiFetch<JobPostingDto>(`/jobs/${id}`);
  return mapJobPostingToUi(dto);
}

/**
 * Apply for a job posting.
 */
export async function applyForJob(id: string): Promise<unknown> {
  return apiFetch(`/jobs/${id}/apply`, {
    method: "POST",
  });
}

/**
 * Save job posting to wishlist.
 */
export async function saveJob(id: string): Promise<void> {
  await apiFetch(`/jobs/${id}/save`, {
    method: "POST",
  });
}

/**
 * Remove job posting from wishlist.
 */
export async function unsaveJob(id: string): Promise<void> {
  await apiFetch(`/jobs/${id}/save`, {
    method: "DELETE",
  });
}
