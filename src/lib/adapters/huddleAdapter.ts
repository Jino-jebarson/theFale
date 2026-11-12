// src/lib/adapters/huddleAdapter.ts
// Clinical peer discussions and mentor Q&A adapter

import { apiFetch } from "@/lib/api";

export interface HuddlePostDto {
  id: string;
  authorId?: string;
  authorName: string;
  authorRole?: string;
  authorSpecialty?: string;
  authorBadge?: string;
  authorCollege?: string;
  authorVerified?: boolean;
  anon?: boolean;
  isAnonymous?: boolean;
  image?: string;
  audioUrl?: string;
  audioDuration?: number;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  title: string;
  body: string;
  type: string; // Case, Discussion, Ethics, Student, Career
  field: string;
  tags?: string[];
  status?: string;
  upvotes: number;
  hasUpvoted?: boolean;
  isMentor?: boolean;
  mentorYrs?: number;
  isHospital?: boolean;
  commentCount: number;
  timeAgo?: string;
  createdAt: string;
}

export interface HuddleCommentDto {
  id: string;
  postId: string;
  authorId?: string;
  authorName: string;
  authorRole?: string;
  authorVerified?: boolean;
  content?: string;
  body?: string;
  createdAt: string;
  timeAgo?: string;
}

export interface HuddleAnswerDto {
  id: string;
  questionId: string;
  authorId?: string;
  authorName?: string;
  authorRole?: string;
  authorVerified?: boolean;
  mentorId?: string;
  mentorName?: string;
  mentorRole?: string;
  mentorYrs?: number;
  mentorSpecialty?: string;
  answerText?: string;
  body?: string;
  text?: string;
  upvotes?: number;
  helpfulCount?: number;
  createdAt: string;
  timeAgo?: string;
}

export interface HuddleQuestionDto {
  id: string;
  authorId?: string;
  authorName?: string;
  authorRole?: string;
  authorCollege?: string;
  authorVerified?: boolean;
  title?: string;
  body?: string;
  category?: string;
  field?: string;
  topic?: string;
  askerId?: string;
  askerName?: string;
  askerLevel?: string;
  askerProfession?: string;
  question?: string;
  questionText?: string;
  answers: HuddleAnswerDto[];
  answerCount?: number;
  answersCount?: number;
  createdAt: string;
  timeAgo?: string;
}

export interface MentorApplicationDto {
  id?: string;
  candidateId?: string;
  userId?: string;
  name?: string;
  profession?: string;
  specialty?: string;
  yearsExperience?: number;
  organization?: string;
  status: string; // NONE | PENDING | APPROVED | REJECTED
  verified?: boolean;
  appliedAt?: string;
  reviewedAt?: string;
  adminNotes?: string;
}

export async function getMentorStatus(): Promise<MentorApplicationDto> {
  return apiFetch<MentorApplicationDto>("/huddle/mentor/status");
}

export async function applyForMentorSeal(): Promise<MentorApplicationDto> {
  return apiFetch<MentorApplicationDto>("/huddle/mentor/apply", {
    method: "POST",
  });
}

export async function getHuddlePosts(field = "All"): Promise<HuddlePostDto[]> {
  const q = field && field !== "All" ? `?field=${encodeURIComponent(field)}` : "";
  return apiFetch<HuddlePostDto[]>(`/huddle/posts${q}`, { validate: Array.isArray });
}

export async function createHuddlePost(payload: {
  title: string;
  body: string;
  type: string;
  field: string;
  anon?: boolean;
  image?: string;
  audioUrl?: string;
  audioDuration?: number;
}): Promise<HuddlePostDto> {
  const isReview = payload.type === "Case" || Boolean(payload.image);
  const res = await apiFetch<HuddlePostDto>("/huddle/posts", {
    method: "POST",
    body: JSON.stringify({
      title: payload.title,
      body: payload.body,
      type: payload.type,
      field: payload.field,
      imageUrl: payload.image,
      audioUrl: payload.audioUrl,
      audioDuration: payload.audioDuration,
      isAnonymous: Boolean(payload.anon),
    }),
  });
  return {
    ...res,
    anon: payload.anon,
    isAnonymous: payload.anon,
    image: payload.image,
    imageUrl: payload.image,
      audioUrl: payload.audioUrl,
      audioDuration: payload.audioDuration,
    status: isReview ? "review" : (res.status || "live"),
  };
}

export async function updateHuddlePost(postId: string, payload: {
  title?: string;
  body?: string;
  type?: string;
  field?: string;
  image?: string | null;
  anon?: boolean;
}): Promise<HuddlePostDto> {
  return apiFetch<HuddlePostDto>(`/huddle/posts/${postId}`, {
    method: "PUT",
    body: JSON.stringify({
      title: payload.title,
      body: payload.body,
      type: payload.type,
      field: payload.field,
      imageUrl: payload.image,
      audioUrl: payload.audioUrl,
      audioDuration: payload.audioDuration,
      isAnonymous: payload.anon,
    }),
  });
}

export async function deleteHuddlePost(postId: string): Promise<void> {
  await apiFetch(`/huddle/posts/${postId}`, {
    method: "DELETE",
  });
}

export async function deleteHuddleQuestion(questionId: string): Promise<void> {
  await apiFetch(`/huddle/questions/${questionId}`, {
    method: "DELETE",
  });
}

export async function upvoteHuddlePost(postId: string): Promise<HuddlePostDto> {
  return apiFetch<HuddlePostDto>(`/huddle/posts/${postId}/upvote`, {
    method: "POST",
  });
}

export async function flagHuddlePost(postId: string, reason: string): Promise<void> {
  await apiFetch(`/huddle/posts/${postId}/flag`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export async function getHuddleComments(postId: string): Promise<HuddleCommentDto[]> {
  return apiFetch<HuddleCommentDto[]>(`/huddle/posts/${postId}/comments`, { validate: Array.isArray });
}

export async function addHuddleComment(postId: string, body: string): Promise<HuddleCommentDto> {
  return apiFetch<HuddleCommentDto>(`/huddle/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ content: body, body }),
  });
}

export async function getHuddleQuestions(): Promise<HuddleQuestionDto[]> {
  return apiFetch<HuddleQuestionDto[]>("/huddle/questions", { validate: Array.isArray });
}

export async function createHuddleQuestion(payload: {
  title: string;
  body: string;
  category: string;
}): Promise<HuddleQuestionDto> {
  return apiFetch<HuddleQuestionDto>("/huddle/questions", {
    method: "POST",
    body: JSON.stringify({
      field: payload.category || "Medicine",
      questionText: payload.body || payload.title,
    }),
  });
}

export async function answerHuddleQuestion(questionId: string, body: string): Promise<HuddleAnswerDto> {
  return apiFetch<HuddleAnswerDto>(`/huddle/questions/${questionId}/answers`, {
    method: "POST",
    body: JSON.stringify({ answerText: body }),
  });
}

export interface HuddleSessionDto {
  id: string;
  title: string;
  category: string;
  hostType: string;
  hostId: string;
  hostName: string;
  hostSub?: string;
  when: string;
  where: string;
  seats: number;
  bookedCount: number;
  isBooked: boolean;
  isHost?: boolean;
  description?: string;
  forRoles?: string[];
  createdAt?: string;
}

export interface CreateHuddleSessionPayload {
  title: string;
  category: string;
  when: string;
  where: string;
  seats?: number;
  description: string;
  forRoles?: string[];
}

export async function getHuddleSessions(): Promise<HuddleSessionDto[]> {
  return apiFetch<HuddleSessionDto[]>("/huddle/sessions", { validate: Array.isArray });
}

export async function createHuddleSession(payload: CreateHuddleSessionPayload): Promise<HuddleSessionDto> {
  return apiFetch<HuddleSessionDto>("/huddle/sessions", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function bookHuddleSession(sessionId: string): Promise<HuddleSessionDto> {
  return apiFetch<HuddleSessionDto>(`/huddle/sessions/${sessionId}/book`, {
    method: "POST",
  });
}

export async function cancelHuddleSessionBooking(sessionId: string): Promise<HuddleSessionDto> {
  return apiFetch<HuddleSessionDto>(`/huddle/sessions/${sessionId}/cancel`, {
    method: "POST",
  });
}

export async function deleteHuddleSession(sessionId: string): Promise<void> {
  await apiFetch(`/huddle/sessions/${sessionId}`, {
    method: "DELETE",
  });
}
