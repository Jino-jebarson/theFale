// src/lib/api.ts
// Unified API client layer for The Fale Healthcare Platform

// API-only application. Kept as a compatibility export for existing consumers.
export const isApiEnabled: boolean = true;

export const API_BASE_URL: string =
  (import.meta.env["VITE_API_URL"] as string | undefined)?.replace(/\/+$/, "") ||
  "http://localhost:8080/api/v1";

// ─────────────────────────────────────────────────────────────────────────────
// 1. IN-MEMORY TOKEN MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────
let inMemoryAccessToken: string | null = null;
let refreshPromise: Promise<Record<string, unknown>> | null = null;

export function getAccessToken(): string | null {
  return inMemoryAccessToken;
}

export function setAccessToken(token: string | null): void {
  if (token === null || token !== inMemoryAccessToken) clearReadCache();
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
  validationErrors: Record<string, string> | undefined;
  rawResponse: unknown;
  retryAfterSeconds: number | undefined;

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
  timeoutMs?: number;
  retry?: boolean;
  /** Successful reads may be reused briefly; 0 disables reuse after completion. */
  cacheMs?: number;
  validate?: ((value: unknown) => boolean) | undefined;
}

interface PayloadResponse { response: Response; payload: unknown }

async function requestPayload(url: string, init: RequestInit, timeoutMs: number): Promise<PayloadResponse> {
  const controller = new AbortController();
  let timedOut = false;
  const abort = () => controller.abort();
  if (init.signal?.aborted) controller.abort();
  init.signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    const body = await response.text();
    let payload: unknown = null;
    if (body) {
      try { payload = JSON.parse(body); }
      catch {
        if (response.ok) throw new ApiError("The server returned an invalid response.", 502);
        payload = null;
      }
    }
    return { response, payload };
  } catch (cause) {
    if (cause instanceof ApiError) throw cause;
    if (timedOut) throw new ApiError("The request timed out. Please try again.", 408);
    if (init.signal?.aborted) throw new ApiError("Request cancelled.", 499);
    throw new ApiError("Cannot reach the server. Please try again.", 0);
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener("abort", abort);
  }
}

function parsePayload<T>({ response, payload }: PayloadResponse): T {
  const object = payload && typeof payload === "object" ? payload as Record<string, unknown> : null;
  if (!response.ok || object?.["success"] === false) {
    const status = response.ok ? 422 : response.status;
    const validation = object?.["validationErrors"];
    const error = new ApiError(
      typeof object?.["message"] === "string" ? object["message"] : "Request failed (" + status + ").",
      status,
      validation && typeof validation === "object" ? validation as Record<string, string> : undefined,
      payload,
    );
    const retryAfter = response.headers.get("Retry-After");
    if (retryAfter) {
      const seconds = Number(retryAfter);
      const delay = Number.isFinite(seconds) ? seconds : (Date.parse(retryAfter) - Date.now()) / 1000;
      if (Number.isFinite(delay)) error.retryAfterSeconds = Math.max(0, Math.ceil(delay));
    }
    throw error;
  }
  if (object && "success" in object && typeof object["success"] !== "boolean") {
    throw new ApiError("The server returned an invalid response.", 502);
  }
  if (response.status !== 204 && response.status !== 205 && (payload === null || typeof payload !== "object")) {
    throw new ApiError("The server returned an invalid response.", 502);
  }
  if (object?.["success"] === true && "data" in object) return object["data"] as T;
  return payload as T;
}

function expireSession() {
  setAccessToken(null);
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent("fale:auth-expired"));
}

async function refreshSessionData(timeoutMs: number): Promise<Record<string, unknown>> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const result = await requestPayload(API_BASE_URL + "/auth/refresh", { method: "POST", credentials: "include" }, timeoutMs);
      if (result.response.status === 401 || result.response.status === 403) expireSession();
      const auth = parsePayload<Record<string, unknown>>(result);
      const token = auth?.["accessToken"];
      if (typeof token !== "string" || !token.trim()) throw new ApiError("The server returned an invalid session response.", 502);
      setAccessToken(token);
      return auth;
    })().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

async function apiFetchNetwork<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuth = false, skipRefresh = false, timeoutMs = 15000, retry = true, validate, ...init } = options;
  const cleanEndpoint = endpoint.replace(/^\/api\/v1(?=\/)/, "");
  const url = /^https?:\/\//.test(cleanEndpoint) ? cleanEndpoint : API_BASE_URL + (cleanEndpoint.startsWith("/") ? "" : "/") + cleanEndpoint;
  const headers = new Headers(init.headers);
  if (!skipAuth && getAccessToken()) headers.set("Authorization", "Bearer " + getAccessToken());
  if (shouldAttachIdempotencyKey(cleanEndpoint, init.method) && !headers.has("Idempotency-Key")) headers.set("Idempotency-Key", generateIdempotencyKey());
  if (init.body && !(init.body instanceof FormData) && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const request: RequestInit = { ...init, headers, credentials: "include" };
  const limit = Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15000;
  if (cleanEndpoint === "/auth/refresh" && (init.method || "GET").toUpperCase() === "POST") {
    return await refreshSessionData(limit) as T;
  }
  const isRead = ["GET", "HEAD"].includes((init.method || "GET").toUpperCase());
  const attempts = isRead && retry ? 2 : 1;
  let refreshed = false;
  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      let result = await requestPayload(url, request, limit);
      if (result.response.status === 401 && !skipAuth && !skipRefresh && !cleanEndpoint.startsWith("/auth/") && !refreshed) {
        const session = await refreshSessionData(limit);
        const token = session["accessToken"] as string;
        refreshed = true;
        headers.set("Authorization", "Bearer " + token);
        result = await requestPayload(url, request, limit);
        if (result.response.status === 401) expireSession();
      }
      const data = parsePayload<T>(result);
      if (validate && !validate(data)) throw new ApiError("The server returned an unexpected response.", 502);
      return data;
    } catch (error) {
      const transient = error instanceof ApiError && [0, 502, 503, 504].includes(error.status);
      if (!(transient && attempt + 1 < attempts)) throw error;
    }
  }
  throw new ApiError("The request failed.", 503);
}

// Memory only, scoped to the current session. Writes invalidate all reads because
// a single action can affect profiles, badges, lists and wallet totals together.
let readGeneration = 0;
const readResults = new Map<string, { expires: number; data: unknown }>();
const readRequests = new Map<string, Promise<unknown>>();

export function clearReadCache(): void {
  readGeneration++;
  readResults.clear();
  readRequests.clear();
}

export async function apiFetch<T = unknown>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { cacheMs = 10000, validate, ...networkOptions } = options;
  const method = (options.method || "GET").toUpperCase();
  const cleanEndpoint = endpoint.replace(/^\/api\/v1(?=\/)/, "");
  const authRequest = /(?:^|\/)auth\//.test(cleanEndpoint);
  const read = method === "GET" && !authRequest;
  if (!read || options.signal || options.cache === "no-store" || options.cache === "reload") {
    const write = !["GET", "HEAD", "OPTIONS"].includes(method) && !authRequest;
    if (write) clearReadCache();
    try { return await apiFetchNetwork<T>(endpoint, { ...networkOptions, validate }); }
    finally { if (write) clearReadCache(); }
  }
  const generation = readGeneration;
  const key = JSON.stringify([generation, cleanEndpoint, options.skipAuth || false,
    options.skipRefresh || false, options.timeoutMs || 15000, options.retry !== false,
    [...new Headers(options.headers).entries()].sort()]);
  // Credentials and public credential verification must always be freshly read.
  const ttl = /(?:^|\/)verifications(?:\/|$)/.test(cleanEndpoint) ? 0 : Math.max(0, cacheMs);
  const cached = readResults.get(key);
  let data: unknown;
  if (ttl > 0 && cached && cached.expires > Date.now()) {
    data = cached.data;
  } else {
    if (cached) readResults.delete(key);
    let request = readRequests.get(key);
    if (!request) {
      request = apiFetchNetwork(endpoint, networkOptions);
      readRequests.set(key, request);
    }
    try {
      data = await request;
      if (validate && !validate(data)) throw new ApiError("The server returned an unexpected response.", 502);
      if (ttl > 0 && generation === readGeneration) {
        if (readResults.size >= 200) readResults.delete(readResults.keys().next().value!);
        readResults.set(key, { data: structuredClone(data), expires: Date.now() + ttl });
      }
    } finally {
      if (readRequests.get(key) === request) readRequests.delete(key);
    }
  }
  if (validate && !validate(data)) {
    readResults.delete(key);
    throw new ApiError("The server returned an unexpected response.", 502);
  }
  // Callers can sort or edit local state without changing another screen's data.
  return structuredClone(data) as T;
}
