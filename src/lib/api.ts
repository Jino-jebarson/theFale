// src/lib/api.ts
// Unified API client layer for The Fale Healthcare Platform

export const isApiEnabled = import.meta.env.VITE_USE_API === "true";

export const API_BASE_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/+$/, "") ||
  "http://localhost:8080/api/v1";

// ─────────────────────────────────────────────────────────────────────────────
// 1. IN-MEMORY TOKEN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
let inMemoryAccessToken: string | null = null;
let isRefreshing = false;
let refreshSubscribers: Array<(token: string | null) => void> = [];

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  inMemoryAccessToken = token;
}

/**
 * Developer helper: Intentionally set an expired/invalid token in memory to test 401 interceptor & automatic cookie refresh.
 */
export function expireAccessTokenForTesting(): void {
  inMemoryAccessToken = "eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJleHBpcmVkLXRlc3QiLCJleHAiOjE2MDAwMDAwMDB9.invalid";
  console.info("[API Dev] In-memory access token expired for testing refresh flow.");
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  (window as any).__expireAccessToken = expireAccessTokenForTesting;
}

function subscribeTokenRefresh(cb: (token: string | null) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string | null) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. MONEY ADAPTER: API PAISE <-> UI RUPEES (IN ONE PLACE)
// ─────────────────────────────────────────────────────────────────────────────
/**
 * Convert backend integer paise to UI rupees.
 * Example: 45000 paise -> 450
 */
export function paiseToRupees(paise?: number | null): number {
  if (paise === undefined || paise === null || isNaN(paise)) return 0;
  return Math.round(paise) / 100;
}

/**
 * Convert UI rupees to backend integer paise.
 * Example: 450 rupees -> 45000 paise
 */
export function rupeesToPaise(rupees?: number | null): number {
  if (rupees === undefined || rupees === null || isNaN(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Format paise or rupees for display in Indian numbering format.
 */
export function formatCurrency(
  amount: number,
  isPaise = false,
  options?: Intl.NumberFormatOptions
): string {
  const value = isPaise ? paiseToRupees(amount) : amount;
  return `₹${value.toLocaleString("en-IN", {
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
    ...options,
  })}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. STRUCTURED ERROR HANDLING
// ─────────────────────────────────────────────────────────────────────────────
export interface ApiErrorResponse {
  success: boolean;
  message?: string;
  timestamp?: string;
  validationErrors?: Record<string, string>;
  status?: number;
}

export class ApiError extends Error {
  status: number;
  validationErrors?: Record<string, string>;
  rawResponse?: unknown;

  constructor(
    message: string,
    status = 500,
    validationErrors?: Record<string, string>,
    rawResponse?: unknown
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.validationErrors = validationErrors;
    this.rawResponse = rawResponse;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. IDEMPOTENCY KEY GENERATION
// ─────────────────────────────────────────────────────────────────────────────
const IDEMPOTENT_ENDPOINTS = [
  "/shifts",
  "/employer/post-shift",
  "/employer/shifts",
  "/employer/wallet/topup",
  "/employer/wallet/credits/purchase",
  "/employer/candidates/unlock",
];

function shouldAttachIdempotencyKey(endpoint: string, method?: string): boolean {
  if (!method || method.toUpperCase() !== "POST") return false;
  return IDEMPOTENT_ENDPOINTS.some((prefix) => endpoint.includes(prefix));
}

export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "idemp-" + Date.now() + "-" + Math.random().toString(36).substring(2, 11);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CORE API REQUEST WRAPPER (WITH 401 RETRY & MUTEX REFRESH)
// ─────────────────────────────────────────────────────────────────────────────
export interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  let cleanEndpoint = endpoint;
  if (cleanEndpoint.startsWith("/api/v1/")) {
    cleanEndpoint = cleanEndpoint.replace(/^\/api\/v1/, "");
  }
  const url = cleanEndpoint.startsWith("http")
    ? cleanEndpoint
    : `${API_BASE_URL}${cleanEndpoint.startsWith("/") ? "" : "/"}${cleanEndpoint}`;

  const headers = new Headers(options.headers || {});

  if (!options.skipAuth && inMemoryAccessToken) {
    headers.set("Authorization", `Bearer ${inMemoryAccessToken}`);
  }

  // Idempotency key for critical mutations
  if (
    shouldAttachIdempotencyKey(endpoint, options.method) &&
    !headers.has("Idempotency-Key")
  ) {
    headers.set("Idempotency-Key", generateIdempotencyKey());
  }

  // JSON content type by default unless body is FormData or already defined
  if (
    options.body &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }

  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: "include", // Refresh token HttpOnly cookie is always attached
  };

  let response: Response;
  try {
    response = await fetch(url, fetchOptions);
  } catch (err: unknown) {
    const errorMsg =
      err instanceof Error ? err.message : "Network error or server unreachable";
    throw new ApiError(`Network request failed: ${errorMsg}`, 0);
  }

  // Handle 401 Unauthorized: Attempt token refresh once, then replay or logout
  if (response.status === 401 && !options.skipRefresh && endpoint !== "/auth/refresh" && endpoint !== "/auth/logout") {
    if (isRefreshing) {
      // Refresh in flight: wait for new token and replay request
      return new Promise<T>((resolve, reject) => {
        subscribeTokenRefresh(async (newToken) => {
          if (!newToken) {
            return reject(new ApiError("Session expired. Please sign in again.", 401));
          }
          headers.set("Authorization", `Bearer ${newToken}`);
          try {
            const replayed = await fetch(url, { ...fetchOptions, headers });
            const data = await parseResponse<T>(replayed);
            resolve(data);
          } catch (replayErr) {
            reject(replayErr);
          }
        });
      });
    }

    isRefreshing = true;
    try {
      const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });

      if (!refreshResponse.ok) {
        throw new Error("Refresh failed");
      }

      const refreshData = await refreshResponse.json();
      const newToken: string | undefined = refreshData?.data?.accessToken || refreshData?.accessToken;

      if (!newToken) {
        throw new Error("No access token returned from refresh");
      }

      setAccessToken(newToken);
      isRefreshing = false;
      onRefreshed(newToken);

      // Replay original request with new token
      headers.set("Authorization", `Bearer ${newToken}`);
      const retriedResponse = await fetch(url, { ...fetchOptions, headers });
      return parseResponse<T>(retriedResponse);
    } catch {
      isRefreshing = false;
      setAccessToken(null);
      onRefreshed(null);

      // Dispatch global auth expired event for UI store logout
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("fale:auth-expired"));
      }
      throw new ApiError("Session expired. Please sign in again.", 401);
    }
  }

  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<T> {
  let json: unknown;
  const text = await response.text();
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }

  if (!response.ok) {
    let msg = `HTTP error ${response.status}`;
    let validationErrors: Record<string, string> | undefined;

    if (json && typeof json === "object") {
      const apiResp = json as ApiErrorResponse;
      if (apiResp.message) msg = apiResp.message;
      if (apiResp.validationErrors) validationErrors = apiResp.validationErrors;
    }

    throw new ApiError(msg, response.status, validationErrors, json);
  }

  // If backend wraps payloads in { success: true, data: ... }
  if (json && typeof json === "object" && "data" in json && "success" in json) {
    return (json as { data: T }).data;
  }

  return json as T;
}
