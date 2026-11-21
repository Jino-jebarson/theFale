import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanCandidateEmail(email?: string | null) {
  const normalized = email?.trim() || "";
  return /^candidate@fale\.(in|care)$/i.test(normalized) ? "" : normalized;
}
