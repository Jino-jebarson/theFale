// src/lib/adapters/aiAdapter.ts
// Unified AI Adapter powering all 20 FALE AI touchpoints

import { API_BASE_URL, ApiError, apiFetch, getAccessToken, isApiEnabled } from "@/lib/api";

export type AiTaskType =
  | "chat"
  | "resume_parse"
  | "doc_verify"
  | "profile_summary"
  | "why_this_job"
  | "interview_practice"
  | "learning_explain"
  | "translate_chat"
  | "whatsapp_post_shift"
  | "jd_writer"
  | "candidate_summary"
  | "interview_questions"
  | "shift_pay_suggest"
  | "no_show_risk"
  | "analytics_insight"
  | "kyc_precheck"
  | "huddle_moderate"
  | "ally_handoff"
  | "application_screen"
  | "posting_compliance"
  | "facility_audit"
  | "daily_brief"
  | "demand_forecast";

export interface AiChatTurn {
  role: "user" | "assistant";
  text: string;
}

export interface AiTaskRequest {
  task: AiTaskType;
  prompt: string;
  context?: string;
  language?: "en" | "kn" | "ml" | "hi" | "ta";
  role?: "clinician" | "hospital" | "admin" | "guest" | "student" | string;
  metadata?: Record<string, any> | undefined;
  history?: AiChatTurn[];
}

export interface AiTaskResponse {
  success: boolean;
  task: string;
  provider: string;
  response: string;
  content?: string;
  structuredData?: Record<string, any>;
  suggestions?: string[];
  action?: string;
  actionData?: Record<string, any>;
}

export async function executeAiTask(req: AiTaskRequest): Promise<AiTaskResponse> {
  {
    const res = await apiFetch<AiTaskResponse>("/ai/execute", {
      method: "POST",
      timeoutMs: 60000,
      body: JSON.stringify(req),
    });
    if (!res || !res.success || (typeof res.response !== "string" && typeof res.content !== "string") || !(res.response || res.content || "").trim()) {
      throw new Error("Live Ally AI service returned an unsuccessful response.");
    }
    const text = res.response || res.content || "";
    res.response = text;
    res.content = text;
    return res;
  }



}

// 1. Ally Chat (#1)
export async function chatWithAlly(
  prompt: string,
  role = "clinician",
  language = "en",
  metadata?: Record<string, any>,
  history?: AiChatTurn[]
) {
  return executeAiTask({
    task: "chat",
    prompt,
    role: role as any,
    language: language as any,
    metadata,
    history,
  });
}

export async function streamChatWithAlly(
  prompt: string, role = "clinician", language = "en",
  metadata: Record<string, any> | undefined, history: AiChatTurn[] | undefined,
  onChunk: (delta: string) => void
): Promise<AiTaskResponse> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000);
  let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
  try {
    const headers = new Headers({ "Content-Type": "application/json", Accept: "text/event-stream" });
    const token = getAccessToken(); if (token) headers.set("Authorization", "Bearer " + token);
    const response = await fetch(API_BASE_URL + "/ai/chat/stream", {
      method: "POST", headers, credentials: "include", signal: controller.signal,
      body: JSON.stringify({ task: "chat", prompt, role, language, metadata, history }),
    });
    // Only retry through the standard endpoint when streaming is unsupported or
    // authentication must be refreshed. Never replay a provider/rate-limit failure.
    if ([401, 404, 405, 406, 501].includes(response.status)) {
      clearTimeout(timer);
      await response.body?.cancel();
      const result = await chatWithAlly(prompt, role, language, metadata, history);
      onChunk(result.response); return result;
    }
    if (!response.ok) throw new ApiError("Ally could not respond. Please try again.", response.status);
    if (!response.body || !response.headers.get("Content-Type")?.includes("text/event-stream")) {
      throw new Error("Ally returned an unexpected stream response.");
    }
    reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "", event = "message";
    let result: AiTaskResponse | null = null;
    const processLine = (raw: string) => {
      const line = raw.replace(/\r$/, "");
      if (!line) { event = "message"; return; }
      if (line.startsWith("event:")) { event = line.slice(6).trim(); return; }
      if (!line.startsWith("data:")) return;
      let data: any;
      try { data = JSON.parse(line.slice(5).trim()); }
      catch { throw new Error("Ally returned malformed streaming data."); }
      if (event === "error") throw new Error("Ally could not complete this response. Please retry.");
      if (event === "chunk" && typeof data.text === "string") onChunk(data.text);
      if (event === "done") {
        if (data.success !== true || typeof data.response !== "string" || !data.response.trim()) {
          throw new Error("Ally returned an incomplete response.");
        }
        result = data as AiTaskResponse;
      }
    };
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      buffer += decoder.decode(part.value, { stream: true });
      let newline: number;
      while ((newline = buffer.indexOf("\n")) >= 0) {
        processLine(buffer.slice(0, newline)); buffer = buffer.slice(newline + 1);
      }
    }
    buffer += decoder.decode(); if (buffer.trim()) processLine(buffer);
    if (!result) throw new Error("Ally's response was interrupted. Please retry.");
    return result;
  } catch (error) {
    if (controller.signal.aborted) throw new ApiError("Ally took too long to respond. Please retry.", 408);
    throw error;
  } finally {
    clearTimeout(timer);
    if (reader) { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  }
}

export interface AllyChatHistoryItem {
  id: string;
  sender: "user" | "ally";
  text: string;
  action?: string | undefined;
  actionLabel?: string | undefined;
  suggestions?: string[] | undefined;
  ticketId?: string | undefined;
  createdAt: string;
}

export async function getAllyChatHistory(role?: string): Promise<AllyChatHistoryItem[]> {
  const query = role ? `?role=${encodeURIComponent(role)}` : "";
  const data = await apiFetch<AllyChatHistoryItem[]>(`/ai/chat/history${query}`, { validate: Array.isArray });
  return Array.isArray(data) ? data : [];
}

export async function clearAllyChatHistory(role?: string): Promise<void> {
  const query = role ? `?role=${encodeURIComponent(role)}` : "";
  await apiFetch<void>(`/ai/chat/history${query}`, { method: "DELETE" });
}

export async function attachTicketToAllyMessage(messageId: string, ticketId: string): Promise<void> {
  if (!messageId || !ticketId) return;
  await apiFetch<void>(`/ai/chat/messages/${encodeURIComponent(messageId)}/ticket`, {
    method: "PATCH",
    body: JSON.stringify({ ticketId }),
  });
}

// 2. Resume Upload (#2)
export async function parseResumeWithAi(cvText: string, metadata?: Record<string, any>) {
  return executeAiTask({ task: "resume_parse", prompt: cvText, metadata });
}

// 3. Document KYC Pre-Check (#3)
export async function precheckDocumentWithAi(docName: string, metadata?: Record<string, any>) {
  return executeAiTask({ task: "doc_verify", prompt: docName, metadata });
}

// 4. Profile Writer (#4)
export async function generateProfileBioWithAi(role: string, years: number, metadata?: Record<string, any>) {
  return executeAiTask({ task: "profile_summary", prompt: role, metadata: { role, years, ...metadata } });
}

// 5. Why this job (#5)
export async function explainJobMatchWithAi(
  jobTitle: string,
  hospital: string,
  distanceKm: number | null | undefined,
  matchScore: number | null | undefined,
  candidateInfo?: { role?: string; qualification?: string; city?: string; council?: string }
) {
  const cRole = candidateInfo?.role || candidateInfo?.qualification || "Not provided";
  const cCity = candidateInfo?.city || "Not provided";
  const prompt = `Candidate Profile: ${cRole} (${candidateInfo?.qualification || "Not provided"}) located in ${cCity}. Hospital Opening: ${jobTitle} at ${hospital} (Calculated distance: ${distanceKm == null ? "Not provided" : `approximately ${distanceKm} km (estimated, not measured)`}), Match Score: ${matchScore == null ? "Not provided" : `${matchScore}% (platform estimate, not a probability)`}. Explain match reasoning.`;

  return executeAiTask({
    task: "why_this_job",
    prompt,
    metadata: { jobTitle, hospital, distance: distanceKm, matchScore, ...candidateInfo },
  });
}

// 6. Interview Practice (#6)
export async function getInterviewPracticeWithAi(role: string) {
  return executeAiTask({
    task: "interview_practice",
    prompt: `Generate 3 realistic, high-acuity clinical emergency scenario questions for an interview with an Indian hospital ${role}. Return only the 3 questions, numbered 1, 2, and 3. Zero emojis.`,
    metadata: { role },
  });
}

export async function evaluateInterviewAnswerWithAi(question: string, answer: string, role?: string) {
  return executeAiTask({
    task: "interview_practice",
    prompt: `Candidate's clinical answer: "${answer}" for the scenario: "${question}". Role: ${role || "Healthcare Professional"}. Evaluate clinical accuracy, patient safety, and give specific strengths, missing points and one next practice step. Do not certify competence or invent a readiness percentage. Zero emojis.`,
    metadata: { question, answer, role },
  });
}

// 7. Learning Assistant (#7)
export async function explainLearningConceptWithAi(question: string, selectedOption: string) {
  return executeAiTask({
    task: "learning_explain",
    prompt: question,
    metadata: { question, selectedOption },
  });
}

// 8. Regional Languages (#8)
export async function translateChatWithAi(text: string, language: "en" | "kn" | "ml" | "hi" | "ta") {
  return executeAiTask({ task: "translate_chat", prompt: text, language });
}

// 9. Post a Job via WhatsApp Message (#9)
export interface ParsedWhatsAppShift {
  role?: string;
  vacancies?: number;
  shiftTiming?: string;
  payRate?: number;
  title?: string;
  department?: string;
  requiredCount?: number;
  shiftType?: "MORNING" | "EVENING" | "NIGHT" | "CUSTOM";
  hourlyRate?: number;
  ratePerShift?: number;
  city?: string;
  location?: string;
  date?: string;
  isUrgent?: boolean;
  supervisorName?: string;
  supervisorPhone?: string;
  perks?: string[];
  notes?: string;
}

/**
 * Intelligent local clinical NLP parser for Indian hospital WhatsApp duty requests.
 * Extracts cadres, departments, phone digits, shift slots, rates, supervisor names,
 * locations, and dates directly from raw unstructured messages without static mock fallbacks.
 */


export async function parseWhatsAppJobMessage(rawText: string) {
    const result = await executeAiTask({ task: "whatsapp_post_shift", prompt: rawText });
    if (!result.structuredData) throw new Error("The parser returned no structured data.");
    const data = result.structuredData;
    for (const key of ["requiredCount", "vacancies", "hourlyRate", "ratePerShift", "payRate"]) {
      if (data[key] != null && (typeof data[key] !== "number" || !Number.isFinite(data[key]) || data[key] < 0)) {
        throw new Error("The parser returned an invalid numeric field.");
      }
    }
    for (const key of ["title", "role", "department", "shiftTiming", "city", "location", "date", "notes", "supervisorName", "supervisorPhone"]) {
      if (data[key] != null && typeof data[key] !== "string") throw new Error("The parser returned an invalid text field.");
    }
    return { ...result, structuredData: data as ParsedWhatsAppShift };
  }

// 10. Job Description Writer (#10)
/**
 * Formats raw AI-generated job description markdown into clean, professional hospital text
 * without raw asterisks (**), hashes (###), or markdown markup inside plain textareas.
 */
export function formatClinicalJobDescription(raw: string): string {
  if (!raw) return "";
  let text = raw.trim();

  // 1. Strip leading redundant JD / Job Description title line if present
  text = text.replace(/^(?:\*{1,3}|#{1,4})?\s*(?:Job Description|JD)[:\s][^\n]*\n+/i, "");

  // 2. Standardize markdown bullets before stripping other markers (*, -, +, • -> clean '• ')
  text = text.replace(/^[\t ]*[-*+•]\s+/gm, "• ");

  // 3. Un-bold section header lines (**Header** or ### Header)
  text = text.replace(/^\s*\*{1,3}\s*([^\*\n]+?)\s*\*{1,3}\s*$/gm, "$1");
  text = text.replace(/^\s*#{1,6}\s*([^\n]+?)\s*$/gm, "$1");

  // 4. Format known section titles cleanly with uppercase styling
  text = text.replace(/^(\d+[\.\)]\s*)?([A-Za-z][A-Za-z0-9\s&/,\-–—]+?):?\s*$/gm, (match, num, header) => {
    const trimmed = header.trim();
    if (trimmed.length > 60) return match;
    if (trimmed.startsWith("•")) return match;

    const isKnownSection = /overview|responsibilit|requirement|qualification|accreditation|licensure|telemetry|protocol|duty|scope|summary|about|competenc|compensation|remuneration|roster/i.test(trimmed);

    if (isKnownSection) {
      const clean = trimmed.toUpperCase();
      const prefix = num ? `${num}` : "";
      return `\n${prefix}${clean}:`;
    }
    return match;
  });

  // 5. Strip any residual inline asterisks or backticks
  text = text.replace(/\*{1,3}([^*\n]+)\*{1,3}/g, "$1");
  text = text.replace(/\*+/g, "");
  text = text.replace(/`+/g, "");

  // 6. Clean empty lines and bullet indentations
  const lines = text.split("\n").map((l) => l.trimEnd());
  const cleanedLines: string[] = [];
  let prevEmpty = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (!prevEmpty && cleanedLines.length > 0) {
        cleanedLines.push("");
        prevEmpty = true;
      }
    } else {
      if (trimmed.startsWith("•")) {
        cleanedLines.push(`• ${trimmed.replace(/^•\s*/, "")}`);
      } else {
        cleanedLines.push(trimmed);
      }
      prevEmpty = false;
    }
  }

  return cleanedLines.join("\n").trim();
}

export interface JobDescriptionAiParams {
  title: string;
  department?: string;
  minSalary?: string | number;
  maxSalary?: string | number;
  experience?: string;
  shifts?: string[];
  empType?: string;
  location?: string;
  openings?: string | number;
}

export async function generateJobDescriptionWithAi(
  paramsOrTitle: string | JobDescriptionAiParams,
  department?: string
) {
  let title = "";
  let metadata: Record<string, unknown> = {};

  if (typeof paramsOrTitle === "string") {
    title = paramsOrTitle.trim();
    metadata = {
      title,
      department: department ? department.trim() : "",
    };
  } else {
    title = (paramsOrTitle.title || "").trim();
    metadata = {
      title,
      department: (paramsOrTitle.department || "").trim(),
      minSalary: paramsOrTitle.minSalary ? String(paramsOrTitle.minSalary).trim() : "",
      maxSalary: paramsOrTitle.maxSalary ? String(paramsOrTitle.maxSalary).trim() : "",
      experience: (paramsOrTitle.experience || "").trim(),
      shifts: paramsOrTitle.shifts && paramsOrTitle.shifts.length > 0 ? paramsOrTitle.shifts.join(", ") : "",
      empType: (paramsOrTitle.empType || "").trim(),
      location: (paramsOrTitle.location || "").trim(),
      openings: paramsOrTitle.openings ? String(paramsOrTitle.openings).trim() : "",
    };
  }

  const res = await executeAiTask({ task: "jd_writer", prompt: title, metadata });
  if (res && res.response) {
    res.response = formatClinicalJobDescription(res.response);
  }
  return res;
}

// 11. Candidate 3-Line Summary (#11)
export async function summarizeCandidateWithAi(
  candidateName: string,
  role: string,
  expYears: number | undefined,
  context?: {
    appliedFor?: string;
    skills?: string[];
    city?: string;
    verified?: boolean;
    matchScore?: number;
  }
) {
    return executeAiTask({ task: "candidate_summary", prompt: "Summarize only the supplied candidate details. Do not infer credentials, verification, skills, or suitability. State missing details as not provided.", metadata: { candidateName, role, expYears, ...(context || {}) } });
  }

// 12. Candidate Interview Questions (#12)
export async function generateInterviewQuestionsWithAi(
  candidateName: string,
  role: string,
  context?: { appliedFor?: string; skills?: string[]; exp?: string; department?: string }
) {
  const prompt = `Candidate: ${candidateName}, Role: ${role}, Applied For: ${context?.appliedFor || role}, Experience: ${context?.exp || "Not provided"}, Key Skills: ${(context?.skills || []).join(", ") || "Not provided"}. Generate 4 tailored, clinical viva and scenario questions strictly focused on this position. Zero emojis.`;
  return executeAiTask({
    task: "interview_questions",
    prompt,
    metadata: {
      candidateName,
      role,
      appliedFor: context?.appliedFor,
      skills: context?.skills,
      exp: context?.exp,
      department: context?.department,
    },
  });
}

// 13. Shift Pay Suggestion (#13)
export interface ShiftPayBenchmarkResult {
  recommendedHourlyRate: number;
  minHourlyRate: number;
  maxHourlyRate: number;
  fillTimeEstimateMinutes?: number;
  explanation: string;
}

/**
 * Calculates a dynamic clinical benchmark on the client without static constants.
 */


export async function suggestShiftPayWithAi(
  specialty: string,
  locality: string,
  context?: { roleTitle?: string; dept?: string; slot?: string }
) {
      const shifts = await apiFetch<Array<{ title: string; city?: string; facilityCity?: string; ratePerHourPaise: number }>>("/shifts", { validate: Array.isArray });
      const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
      const requestedRole = normalize(context?.roleTitle || specialty);
      const observedRates = shifts.filter(shift =>
        requestedRole && normalize(shift.title || "").includes(requestedRole) &&
        normalize(shift.city || shift.facilityCity || "") === normalize(locality) &&
        Number.isFinite(shift.ratePerHourPaise) && shift.ratePerHourPaise > 0
      ).slice(0, 30).map(shift => shift.ratePerHourPaise / 100);
      if (!observedRates.length) throw new Error("No comparable published shift rates are available for this role and city. Enter a rate manually.");
      const result = await executeAiTask({ task: "shift_pay_suggest", prompt: specialty, metadata: { specialty, locality, ...(context || {}), observedRates, source: "Comparable published FALE shifts; not accepted pay or a market-wide benchmark" } });
      const data = result.structuredData || {};
      const recommendedHourlyRate = Number(data.recommendedHourlyRate || data.recommendedRate);
      const minHourlyRate = Number(data.minHourlyRate || data.marketRangeMin);
      const maxHourlyRate = Number(data.maxHourlyRate || data.marketRangeMax);
      if (![recommendedHourlyRate, minHourlyRate, maxHourlyRate].every((rate) => Number.isFinite(rate) && rate > 0) || minHourlyRate > recommendedHourlyRate || recommendedHourlyRate > maxHourlyRate || minHourlyRate < Math.min(...observedRates) || maxHourlyRate > Math.max(...observedRates)) throw new Error("No valid pay recommendation returned.");
      return { ...result, benchmark: { recommendedHourlyRate, minHourlyRate, maxHourlyRate, fillTimeEstimateMinutes: typeof data.fillTimeEstimateMinutes === "number" && Number.isFinite(data.fillTimeEstimateMinutes) && data.fillTimeEstimateMinutes > 0 ? data.fillTimeEstimateMinutes : undefined, explanation: String(data.explanation || data.rationale || result.response || "") } };
    }

// 14. No-Show Risk Predictor (#14)
export async function predictNoShowRiskWithAi(
  distanceKm: number,
  shiftTime: string,
  context?: { candidateName?: string; role?: string; candidateCity?: string; hospitalCity?: string }
) {
  const cCity = context?.candidateCity || "Not provided";
  const hCity = context?.hospitalCity || "Not provided";
  const prompt = `Candidate: ${context?.candidateName || "Clinician"}, Role: ${context?.role || "Staff"}, Shift: ${shiftTime}, Candidate Profile City: ${cCity}, Hospital Shift City: ${hCity}. Do not assume where the candidate is currently stationed. This is a qualitative planning suggestion, not a validated attendance prediction. Evaluate attendance no-show risk (Low Risk, Moderate Risk, or High Risk) with actionable staffing recommendation. Never penalize for permanent hometown address. Strictly zero emojis.`;
  return executeAiTask({
    task: "no_show_risk",
    prompt,
    metadata: { distance: distanceKm, shiftTime, candidateCity: cCity, hospitalCity: hCity, ...context },
  });
}

// 15. Analytics Insights (#15)
export async function generateAnalyticsInsightWithAi(metrics?: Record<string, any>) {
  return executeAiTask({ task: "analytics_insight", prompt: "Summarize dashboard metrics", metadata: metrics });
}

// 16. Verification Queue Pre-Check (#16)
export async function precheckKycQueueWithAi(
  candidateName: string,
  regNumber: string,
  metadata?: Record<string, any>
) {
  const prompt = `Candidate: ${candidateName}, Council: ${metadata?.council || "State Medical/Nursing Council"}, RegNo: ${regNumber}, Role: ${metadata?.role || "Clinician"}, Qualification: ${metadata?.qualification || "Registered Clinician"}. Perform statutory credential audit for Indian healthcare council registry. Zero emojis.`;
  return executeAiTask({
    task: "kyc_precheck",
    prompt,
    metadata: { candidateName, regNumber, ...metadata },
  });
}

// 17. Huddle Moderation (#17)
export async function moderateHuddlePostWithAi(content: string) {
  return executeAiTask({ task: "huddle_moderate", prompt: content });
}

// 18. Ally Handoffs (#18)
export async function draftAllyHandoffWithAi(ticketSubject: string) {
  return executeAiTask({ task: "ally_handoff", prompt: ticketSubject });
}

// Application Screening & Shortlisting Verdict
export async function screenApplicationWithAi(
  candidateName: string,
  candidateRole: string,
  jobTitle: string,
  hospitalName: string,
  context?: { matchScore?: number; council?: string; regNumber?: string; exp?: string; isShiftClaim?: boolean }
) {
  const prompt = `Candidate: ${candidateName}, Role: ${candidateRole}, Applied For: ${jobTitle}, Hospital: ${hospitalName}, Match Score: ${context?.matchScore ?? "Not provided"}%, Council: ${context?.council || "State Medical/Nursing Council"}, RegNo: ${context?.regNumber || "Not provided"}, Exp: ${context?.exp || "Not provided"}. Generate a crisp 3-sentence compliance screening verdict for the admin reviewer. Strictly zero emojis.`;
  return executeAiTask({
    task: "application_screen",
    prompt,
    metadata: { candidateName, candidateRole, jobTitle, hospitalName, ...context },
  });
}

// Job & Shift Requirement Posting Compliance Audit
export async function auditPostingComplianceWithAi(
  jobTitle: string,
  org: string,
  dept: string,
  compensation: string,
  context?: {
    type?: "job" | "shift";
    hours?: number;
    city?: string;
    description?: string;
    qualificationRequired?: string;
    salaryMin?: number;
    salaryMax?: number;
  }
) {
  const prompt = `Hospital: ${org}, Position: ${jobTitle}, Specialty: ${dept}, Type: ${context?.type || "job"}, Compensation: ${compensation}, Duty Hours: ${context?.hours ?? "Not provided"}h, Location: ${context?.city || "India"}, Qualification Required: ${context?.qualificationRequired || "Not provided"}, Description: ${context?.description || "Not provided"}. Audit posting compliance under State Healthcare Minimum Wage Acts and continuous duty rest caps. Output 3-sentence compliance verdict. Strictly zero emojis.`;
  return executeAiTask({
    task: "posting_compliance",
    prompt,
    metadata: { jobTitle, org, dept, compensation, ...context },
  });
}

// Hospital Partner Statutory Accreditation & License Audit
export async function auditFacilityWithAi(
  name: string,
  licenseNumber: string,
  accreditation: string,
  gstin?: string,
  context?: { beds?: number; icuBeds?: number; city?: string; state?: string }
) {
  const prompt = `Hospital: ${name}, License: ${licenseNumber}, Accreditation: ${accreditation}, GSTIN: ${gstin || "Pending"}, Beds: ${context?.beds ?? "Not provided"}, ICU Beds: ${context?.icuBeds ?? "Not provided"}, City: ${context?.city || "India"}, State: ${context?.state || "State"}. Audit Clinical Establishment Act statutory registry adherence, accreditation standing, and capacity balance. Output 3-sentence compliance verdict. Strictly zero emojis.`;
  return executeAiTask({
    task: "facility_audit",
    prompt,
    metadata: { name, licenseNumber, accreditation, gstin, ...context },
  });
}

// 19. Daily Morning Brief (#19)
export async function getDailyMorningBriefWithAi(metrics?: {
  pendingKyc?: number;
  pendingJobs?: number;
  pendingFacilities?: number;
  activeShifts?: number;
  disputes?: number;
}) {
  const pKyc = metrics?.pendingKyc ?? "Not provided";
  const pJobs = metrics?.pendingJobs ?? "Not provided";
  const pFac = metrics?.pendingFacilities ?? "Not provided";
  const aShifts = metrics?.activeShifts ?? "Not provided";
  const pDisputes = metrics?.disputes ?? "Not provided";

  const prompt = `Current FALE Platform Metrics: Pending Candidate KYC = ${pKyc}, Pending Hospital Requirements = ${pJobs}, Pending Facility Accreditations = ${pFac}, Active Shifts = ${aShifts}, Escrow Disputes = ${pDisputes}. Write a concise, 3-bullet morning operations brief covering: 1. Statutory council verifications needing review, 2. Open hospital shift fulfillment and broadcast priority, 3. Escrow payout settlement status. Strictly zero emojis.`;
  return executeAiTask({ task: "daily_brief", prompt, metadata: metrics });
}

// 20. Demand Forecast (#20)
export async function getDemandForecastWithAi(context?: {
  metro?: string;
  topSpecialties?: string[];
  surgeWeekendMultiplier?: number;
  activeShifts?: number;
  loadedShiftPostings?: number;
}) {
  const metro = context?.metro || "Not provided";
  const specialties = context?.topSpecialties?.join(", ") || "Not provided";
  const activeShifts = context?.activeShifts ?? "Not provided";
  const prompt = `Region: ${metro}, Monitored Specialties: ${specialties}, Active Locum Shifts: ${activeShifts}. Loaded shift postings: ${context?.loadedShiftPostings ?? "Not provided"} (not an active-shift count). Give a qualitative staffing outlook. If historical bookings and cancellations are not supplied, state that a numeric 7-day forecast and surge percentage cannot be calculated. Offer actionable deployment advice for hospital staffing coordinators. Strictly zero emojis.`;
  return executeAiTask({ task: "demand_forecast", prompt, metadata: context });
}
