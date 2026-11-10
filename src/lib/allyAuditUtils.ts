/**
 * Shared formatting, JSON extraction, and sessionStorage cache helpers for
 * Ally pre-check / accreditation audits across admin verification views.
 */

export type AllyAuditStatus = "PENDING" | "VERIFIED" | "FLAGGED" | "ERROR";

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
export function formatConfidencePercent(val: unknown, isFlagged: boolean): number {
  if (typeof val === "number" && !Number.isNaN(val)) {
    const normalized = val > 0 && val <= 1 ? val * 100 : val;
    return Math.max(0, Math.min(100, Number(normalized.toFixed(1))));
  }
  return isFlagged ? 42.0 : 98.5;
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

/**
 * Read a cached Ally audit map safely from sessionStorage.
 */
export function readSessionAuditCache<T>(storageKey: string): Record<string, T> {
  try {
    const raw = sessionStorage.getItem(storageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, T>) : {};
  } catch {
    return {};
  }
}

/**
 * Persist an Ally audit map to sessionStorage without throwing on quota/private mode.
 */
export function writeSessionAuditCache<T>(storageKey: string, next: Record<string, T>): void {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(next));
  } catch {
    // Ignore sessionStorage quota or restricted storage errors
  }
}

