// src/lib/adapters/jobAdapter.ts
// Job and application adapter for permanent and clinical internship postings

import { ApiError, apiFetch, paiseToRupees } from "@/lib/api";
import type { Job } from "@/lib/data";
import { setState } from "@/lib/store";

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
  workLocation?: string;
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
  shift?: string;
  urgent?: boolean;
  matchScore?: number;
  perks?: string[];
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
      : "Not specified");

  return {
    id: dto.id,
    title: dto.title,
    description: dto.description || "",
    org: dto.facilityName || "Hospital Partner",
    city: dto.workLocation || dto.city || dto.facilityCity || "Not provided",
    salary: salaryStr,
    stipend: isIntern ? salaryStr : undefined,
    exp: dto.experienceRequired || "Not provided",
    type: dto.employmentType || (isIntern ? "Internship" : "Not provided"),
    shift: dto.shift || "Not provided",
    posted: formatPostedTime(dto.postedAt || dto.createdAt),
    tags: [dto.department, dto.qualificationRequired, dto.employmentType].filter(Boolean) as string[],
    match: dto.matchScore ?? 0,
    urgent: dto.urgent === true,
    dept: dto.department || "General",
    qualification: dto.qualificationRequired || "Not provided",
    perks: dto.perks || [],
    accredited: Boolean(dto.facilityAccreditation),
    kind: isIntern ? "internship" : "job",
    forStudents: isIntern,
    postedAt: dto.postedAt || dto.createdAt,
    salaryMinPaise: dto.salaryMinPaise,
    salaryMaxPaise: dto.salaryMaxPaise,
  } as Job;
}

/**
 * Fetch jobs feed from backend (automatically tailored to candidate student/graduate status).
 */
export async function getJobs(city?: string): Promise<Job[]> {
  const query = city ? `?city=${encodeURIComponent(city)}` : "";
  const dtos = await apiFetch<JobPostingDto[]>(`/jobs${query}`, { validate: Array.isArray });
  const savedIds = dtos.filter((d) => d.isSaved).map((d) => d.id);
  if (savedIds.length > 0) {
    setState((prev) => ({
      saved: Array.from(new Set([...prev.saved, ...savedIds])),
    }));
  }
  return dtos.map(mapJobPostingToUi);
}

/**
 * Fetch detailed job posting information.
 */
export async function getJobById(id: string): Promise<Job> {
  const dto = await apiFetch<JobPostingDto>(`/jobs/${id}`);
  if (dto.isSaved) {
    setState((prev) => {
      if (!prev.saved.includes(dto.id)) {
        return { saved: [...prev.saved, dto.id] };
      }
      return prev;
    });
  }
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
