import { getAccessToken } from "@/lib/api";
/**
 * Shared formatting, JSON extraction, and sessionStorage cache helpers for
 * Ally pre-check / accreditation audits across admin verification views.
 */

export type AllyAuditStatus = "PENDING" | "REVIEW" | "FLAGGED" | "ERROR";

/**
 * Strip markdown fences, emphasis tokens, emoji noise, and collapse whitespace
 * so Ally responses render cleanly in compact UI cards.
 */
export function cleanMarkdownAndJsonNoise(raw: string): string {
  return (raw || "")
    .replace(/```json\s*/gi, "")
    .replace(/```/g, "")
    .replace(/\*\*|__|~~/g, "")
    .replace(/^\*+|\*+$/g, "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Normalize confidence values (either 0-1 floats or 0-100 percentages) into a
 * rounded percentage with a deterministic fallback when omitted.
 */
export function formatConfidencePercent(val: unknown, _isFlagged = false): number | null {
  if (typeof val === "number" && Number.isFinite(val)) {
    const normalized = val > 0 && val <= 1 ? val * 100 : val;
    return Math.max(0, Math.min(100, Number(normalized.toFixed(1))));
  }
  return null;
}

/**
 * Extract the outermost JSON object embedded inside raw LLM markdown/text output.
 */
export function extractJsonPayload(rawText: string): Record<string, any> | null {
  if (!rawText) return null;
  const stripped = rawText.replace(/```json\s*/gi, "").replace(/```/g, "").trim();
  const firstBrace = stripped.indexOf("{");
  const lastBrace = stripped.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace <= firstBrace) return null;
  try {
    const parsed = JSON.parse(stripped.slice(firstBrace, lastBrace + 1));
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

// Old sessionStorage audits are intentionally ignored: they can contain stale
// verification claims. Keep revised assessments in memory for ten minutes.
let auditSession: string | null = null;
const auditCache = new Map<string, { expires: number; data: Record<string, unknown> }>();
function scopeAuditCache() {
  const token = getAccessToken();
  if (token !== auditSession || token === null) { auditCache.clear(); auditSession = token; }
  return token;
}
export function readSessionAuditCache<T>(storageKey: string): Record<string, T> {
  if (!scopeAuditCache()) return {};
  const cached = auditCache.get(storageKey);
  if (!cached || cached.expires <= Date.now()) { auditCache.delete(storageKey); return {}; }
  return structuredClone(cached.data) as Record<string, T>;
}
export function writeSessionAuditCache<T>(storageKey: string, next: Record<string, T>): void {
  if (!scopeAuditCache()) return;
  auditCache.set(storageKey, { expires: Date.now() + 600000, data: structuredClone(next) });
}
