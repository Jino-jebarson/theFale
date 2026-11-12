import { ApiError } from "./api";

export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return "Cannot reach the server. Check your connection and try again.";
    if (error.status === 408) return "The request took too long. Please try again.";
    if (error.status === 403) return "You do not have permission to perform this action.";
    if (error.status === 429) return error.retryAfterSeconds
      ? `Too many requests. Try again in ${error.retryAfterSeconds} seconds.`
      : "Too many requests. Please wait before trying again.";
    if (error.status >= 500) return "The service is unavailable. Please try again later.";
    return error.message || fallback;
  }
  return fallback;
}
