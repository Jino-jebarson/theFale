import { useState, useEffect, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlineAcademicCap,
  HiOutlineClock,
  HiCheckCircle,
  HiOutlineMagnifyingGlass,
  HiStar,
  HiOutlineShieldCheck,
  HiOutlineArrowRight,
  HiOutlineBookOpen,
  HiOutlineUserGroup,
  HiOutlineCheckBadge,
  HiOutlinePlay,
  HiOutlineXMark,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { toast } from "sonner";
import { BotMessageSquare } from "lucide-react";
import { AppShell } from "@/components/fale/AppShell";
import { Button, ButtonSpinner } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { courses } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled } from "@/lib/api";
import { getCourses, enrollCourse, mapCourseDtoToCourse } from "@/lib/adapters/learningAdapter";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getInterviewPracticeWithAi, evaluateInterviewAnswerWithAi } from "@/lib/adapters/aiAdapter";

export const Route = createFileRoute("/learning/")({
  head: () => ({
    meta: [
      { title: "FALE Clinical Academy — Healthcare Courses & CME Certifications" },
      { name: "description", content: "Certified clinical modules, emergency simulations, and accredited CME credentials for healthcare professionals." },
      { property: "og:title", content: "FALE Clinical Academy" },
      { property: "og:description", content: "Short healthcare courses to grow your clinical skills and confidence." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Learning,
});

const CATEGORIES = [
  "All Specialties",
  "Critical Care",
  "Emergency & Trauma",
  "Nursing Essentials",
  "Clinical Pharmacology",
  "Dialysis & Renal",
  "Physiotherapy & Rehab",
  "Radiology & Imaging",
  "Quality & NABH",
  "Student Essentials",
] as const;

function Learning() {
  const s = useApp();
  const candidateLevel =
    s.candidateLevel ||
    (s.profile["level"] as any) ||
    (s.profile["cadreLevel"] as any) ||
    (s.profile["exp"] === "Fresher" ? "fresher" : "professional");
  const isStudent = candidateLevel === "student";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All Specialties");
  const [viewMode, setViewMode] = useState<"catalog" | "my-learning">("catalog");

  const [apiCourses, setApiCourses] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(isApiEnabled);
  const [loadError, setLoadError] = useState<string | null>(null);

  // AI Interview Practice Simulator State (#6)
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewQuestions, setInterviewQuestions] = useState<string[]>([]);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);
  const [interviewAnswer, setInterviewAnswer] = useState("");
  const [interviewFeedback, setInterviewFeedback] = useState<string | null>(null);
  const [evaluatingInterview, setEvaluatingInterview] = useState(false);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  const handleStartInterviewPractice = async () => {
    setInterviewModalOpen(true);
    setInterviewFeedback(null);
    setInterviewAnswer("");
    setInterviewQuestions([]);
    setActiveQuestionIdx(0);
    setLoadingQuestions(true);
    try {
      const result = await getInterviewPracticeWithAi(s.profile?.role || "Healthcare Professional");
      const questions = (result.response || result.content || "").split(/\n+/).map((line) => line.replace(/^[\d+*#.\-\)]+\s*/, "").trim()).filter((line) => line.length > 25);
      if (!questions.length) throw new Error("No questions returned");
      setInterviewQuestions(questions.slice(0, 3));
    } catch {
      toast.error("Interview practice is unavailable. Please try again later.");
    } finally { setLoadingQuestions(false); }
  };

  const handleEvaluateAnswer = async () => {
    if (!interviewAnswer.trim()) {
      toast.error("Please type your response first.");
      return;
    }
    setEvaluatingInterview(true);
    try {
      const activeQ = interviewQuestions[activeQuestionIdx] || "Emergency Clinical Scenario";
      const res = await evaluateInterviewAnswerWithAi(
        activeQ,
        interviewAnswer.trim(),
        s.profile?.role || "Healthcare Professional"
      );
      const feedbackText = res.response || res.content || "";
      setInterviewFeedback(feedbackText);
    } catch (err) {
      console.error("Failed to evaluate clinical viva answer:", err);
      toast.error("Unable to evaluate with AI. Please try again.");
    } finally {
      setEvaluatingInterview(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    getCourses()
      .then((data) => {
        setApiCourses(data);
        setLoadError(null);
        if (data && data.length > 0) {
          const enrolledIds = data.filter((c) => c.enrolled).map((c) => c.id);
          if (enrolledIds.length > 0) {
            setState((x) => ({ courses: Array.from(new Set([...x.courses, ...enrolledIds])) }));
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load courses:", err);
        setLoadError("Unable to load clinical academy courses.");
        setApiCourses([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const courseSource = useMemo(() => {
    if (apiCourses && apiCourses.length > 0) {
      return apiCourses.map(mapCourseDtoToCourse);
    }
    return [];
  }, [isApiEnabled, apiCourses]);

  // Filtered courses based on search and category
  const filteredCourses = useMemo(() => {
    return courseSource.filter((c) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.skillsGained.some((sk) => sk.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "All Specialties" || c.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [courseSource, searchQuery, selectedCategory]);

  const enrolledCourses = useMemo(() => {
    return courseSource.filter((c) => s.courses.includes(c.id));
  }, [courseSource, s.courses]);

  const handleQuickEnroll = async (courseId: string, courseTitle: string) => {
    if (s.courses.includes(courseId)) return;
    try {
      const saved = await enrollCourse(courseId);
      setApiCourses((previous) => (previous || []).map((course) => course.id === saved.id ? saved : course));
      setState((previous) => ({ courses: Array.from(new Set([...previous.courses, saved.id])) }));
      toast.success("Enrolled successfully", { description: courseTitle });
    } catch (error) {
      toast.error("Could not enroll. Please try again.");
    }
  };

  return (
    <AppShell>
      <div className="w-full min-w-0 max-w-full overflow-x-hidden space-y-6">
        {/* ================= PAGE HEADER (MATCHING HUDDLE) ================= */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
              <h1 className="text-xl sm:text-2xl lg:text-[28px] font-extrabold tracking-tight text-foreground">
                Learning &amp; CME Academy
              </h1>
              <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shrink-0 bg-primary/10 text-primary border border-primary/20">
                <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                <span>Accredited CME</span>
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-3xl">
              {isStudent
                ? "Clinical foundation modules, emergency simulations, and accredited logbook certifications for healthcare students."
                : "Certified clinical courses, emergency simulations, and accredited CME credentials for healthcare professionals."}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewMode(viewMode === "catalog" ? "my-learning" : "catalog")}
              className="h-10 border-border/80 text-foreground hover:bg-muted text-xs font-bold px-4 rounded-2xl shadow-xs cursor-pointer flex items-center justify-center gap-1.5 w-full sm:w-auto"
            >
              <HiOutlineAcademicCap className="h-4 w-4 text-primary shrink-0" />
              <span>{viewMode === "catalog" ? `My Courses (${enrolledCourses.length})` : "Browse Catalog"}</span>
            </Button>
          </div>
        </div>

        {/* AI Clinical Interview Practice Spotlight */}
        <div className="rounded-3xl border border-primary/25 bg-gradient-to-r from-primary/10 via-primary/5 to-card p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-start gap-3.5">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-xs">
              <BotMessageSquare className="h-5 w-5" />
            </span>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  Clinical Viva &amp; Interview Practice
                </h3>
                <span className="rounded-full bg-primary/10 border border-primary/20 px-2 py-0.2 text-[9px] font-bold text-primary">
                  Interactive Simulator
                </span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Practice hospital triage scenarios, answer acute clinical questions, and receive instant feedback before your interviews.
              </p>
            </div>
          </div>
          <Button
            type="button"
            onClick={handleStartInterviewPractice}
            className="bg-primary text-white text-xs font-bold shrink-0 hover:bg-primary-hover rounded-xl px-4 h-9 shadow-xs cursor-pointer"
          >
            Start Practice
          </Button>
        </div>

        {/* Student Mentorship Notice Banner (Matching Huddle) */}
        {isStudent && (
          <div className="rounded-2xl sm:rounded-3xl border border-primary/25 bg-gradient-to-r from-primary-soft/40 via-card to-primary-soft/20 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0 max-w-full overflow-hidden">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <HiOutlineAcademicCap className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold text-foreground">Student Fast-Track · CME Points Count Towards Clinical Logbooks</span>
                  <span className="rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 text-[10px] font-bold shrink-0">
                    College Recognized
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                  Complete modules to earn verified certificate badges and clinical contact hours approved by affiliated university examination boards.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ================= NAVIGATION & FILTER BAR (STICKY LIKE HUDDLE) ================= */}
        <div
          className="sticky z-30 pt-1 pb-3 bg-background/95 backdrop-blur-md transition-[top] duration-300 ease-in-out w-full min-w-0 max-w-full"
          style={{ top: "var(--header-offset, 4rem)" }}
        >
          <div className="surface rounded-2xl sm:rounded-3xl border border-border/80 bg-card p-3 sm:p-3.5 shadow-xs space-y-3 w-full min-w-0 max-w-full">
            {/* Top Row: Segmented Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 min-w-0">
              {/* Segmented Control / Tabs */}
              <div className="w-full sm:w-auto overflow-x-auto no-scrollbar -mx-0.5 px-0.5">
                <div className="inline-flex items-center rounded-2xl bg-muted/60 p-1 border border-border/50 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setViewMode("catalog")}
                    className={cn(
                      "whitespace-nowrap shrink-0 flex-1 sm:flex-initial rounded-xl px-3 sm:px-4 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none",
                      viewMode === "catalog"
                        ? "bg-card text-primary shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <HiOutlineBookOpen className="h-4 w-4 shrink-0" />
                    <span>Explore Catalog</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-black shrink-0",
                        viewMode === "catalog" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {courseSource.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("my-learning")}
                    className={cn(
                      "whitespace-nowrap shrink-0 flex-1 sm:flex-initial rounded-xl px-3 sm:px-4 py-2 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none",
                      viewMode === "my-learning"
                        ? "bg-card text-primary shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <HiOutlineAcademicCap className="h-4 w-4 shrink-0" />
                    <span>My Learning</span>
                    {enrolledCourses.length > 0 && (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[10px] font-black shrink-0",
                          viewMode === "my-learning" ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                        )}
                      >
                        {enrolledCourses.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Right: Search Box matching Huddle */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex flex-1 items-center gap-2 rounded-2xl bg-muted/40 border border-border/70 px-3.5 py-1 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 transition-all sm:w-80">
                  <HiOutlineMagnifyingGlass className="h-4 w-4 text-muted-foreground shrink-0" />
                  <input
                    type="text"
                    placeholder="Search courses, skills, or topics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none font-medium"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery("")}
                      className="rounded-full p-0.5 text-muted-foreground hover:text-foreground cursor-pointer"
                      title="Clear search"
                    >
                      <HiOutlineXMark className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Category Filter Pills (Catalog view only) matching Huddle */}
            {viewMode === "catalog" && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2.5 border-t border-border/60 no-scrollbar">
                {CATEGORIES.map((cat) => {
                  const count =
                    cat === "All Specialties"
                      ? courseSource.length
                      : courseSource.filter((c) => c.category === cat).length;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap transition-all border cursor-pointer select-none flex items-center gap-1.5 shrink-0",
                        selectedCategory === cat
                          ? "bg-primary text-white border-primary shadow-xs font-bold"
                          : "bg-muted/40 text-muted-foreground border-border/70 hover:bg-muted/70 hover:text-foreground"
                      )}
                    >
                      <span>{cat}</span>
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                          selectedCategory === cat
                            ? "bg-white/25 text-white"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>


        {/* ================= CONTENT: MY LEARNING VIEW ================= */}
        {viewMode === "my-learning" && (
          <div className="space-y-6 w-full min-w-0 max-w-full">
            {enrolledCourses.length === 0 ? (
              <div className="surface p-12 text-center rounded-3xl border border-dashed border-border/80 space-y-4">
                <span className="grid h-16 w-16 place-items-center rounded-3xl bg-primary-soft text-primary mx-auto shadow-2xs">
                  <HiOutlineBookOpen className="h-8 w-8" />
                </span>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-foreground">No active courses yet</h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Browse our certified clinical courses and enroll for free to boost your job applications and earn CME hours.
                  </p>
                </div>
                <Button
                  onClick={() => setViewMode("catalog")}
                  className="rounded-2xl font-bold text-xs h-10 px-5 bg-primary hover:bg-primary-hover text-white shadow-xs cursor-pointer"
                >
                  Browse Catalog
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-8 sm:pb-0 w-full min-w-0">
                {enrolledCourses.map((c) => {
                  const totalLessons = c.modules.flatMap((m) => m.lessons).length;
                  const percent = apiCourses?.find((course) => course.id === c.id)?.progressPercent ?? 0;
                  const completedCount = Math.floor(totalLessons * percent / 100);

                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-xs transition-all hover:border-border/80 hover:shadow-md flex flex-col justify-between space-y-4 sm:space-y-5 w-full min-w-0 max-w-full overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-[9.5px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 uppercase tracking-wider">
                            {c.category}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <HiCheckCircle className="h-4 w-4" /> Enrolled
                          </span>
                        </div>

                        <Link to="/learning/$id" params={{ id: c.id }}>
                          <h3 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight leading-snug line-clamp-2 hover:text-primary transition-colors">
                            {c.title}
                          </h3>
                        </Link>

                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                          {c.summary}
                        </p>

                        {/* Progress Bar */}
                        <div className="space-y-1.5 pt-1 sm:pt-2">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-muted-foreground">Course Progress</span>
                            <span className="text-primary">{percent}%</span>
                          </div>
                          <Progress value={percent} className="h-2 rounded-full" />
                          <p className="text-[10px] text-muted-foreground font-medium">
                            {completedCount} of {totalLessons} lessons finished
                          </p>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-border/60">
                        <Button
                          asChild
                          className="w-full rounded-xl sm:rounded-2xl font-bold text-xs h-10 bg-primary hover:bg-primary-hover text-white shadow-xs gap-1.5 cursor-pointer"
                        >
                          <Link to="/learning/$id" params={{ id: c.id }}>
                            <HiOutlinePlay className="h-4 w-4" /> Continue Lesson
                          </Link>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= CONTENT: CATALOG VIEW ================= */}
        {viewMode === "catalog" && (
          <div className="space-y-6 w-full min-w-0 max-w-full">
            <div className="flex items-center justify-between">
              <h2 className="text-base sm:text-lg font-black text-foreground tracking-tight">
                {selectedCategory === "All Specialties" ? "All Clinical Modules" : selectedCategory}
                <span className="ml-2 text-xs font-bold text-muted-foreground">
                  ({filteredCourses.length} available)
                </span>
              </h2>
            </div>

            {loading ? (
              <div className="surface p-12 text-center rounded-3xl border border-border/80 text-muted-foreground">
                <ButtonSpinner className="mx-auto h-8 w-8 text-primary animate-spin" />
                <p className="mt-3 text-sm font-semibold">Loading CME courses...</p>
              </div>
            ) : loadError ? (
              <div className="surface p-12 text-center rounded-3xl border border-border/80 text-rose-500">
                <p className="text-sm font-semibold">{loadError}</p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="surface p-12 text-center rounded-3xl border border-dashed border-border/80 text-muted-foreground">
                <HiOutlineAcademicCap className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-semibold">No courses found matching your filter.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 pb-8 sm:pb-0 w-full min-w-0">
                {filteredCourses.map((c) => {
                  const isEnrolled = s.courses.includes(c.id);

                  return (
                    <div
                      key={c.id}
                      className="rounded-2xl sm:rounded-3xl border border-border bg-card p-4 sm:p-6 shadow-xs transition-all duration-200 hover:shadow-md hover:border-primary/40 flex flex-col justify-between space-y-4 sm:space-y-5 group w-full min-w-0 max-w-full overflow-hidden"
                    >
                      <div className="space-y-3.5 min-w-0">
                        {/* Top Row: Category & Accreditation Badge */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap min-w-0">
                          <span className="rounded-full bg-primary/10 text-primary border border-primary/20 px-2 sm:px-2.5 py-0.5 text-[9.5px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0">
                            {c.category}
                          </span>
                          <span className="rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2 sm:px-2.5 py-0.5 text-[9.5px] sm:text-[10px] font-bold max-w-[200px] truncate">
                            {c.accreditationBadge}
                          </span>
                        </div>

                        {/* Course Title */}
                        <div className="min-w-0">
                          <Link to="/learning/$id" params={{ id: c.id }}>
                            <h3 className="font-extrabold text-base sm:text-lg text-foreground tracking-tight leading-snug group-hover:text-primary transition-colors line-clamp-2 break-words">
                              {c.title}
                            </h3>
                          </Link>
                          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1.5 font-medium min-w-0">
                            <HiOutlineAcademicCap className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">{c.instructor.name} · {c.instructor.hospital.split(",")[0]}</span>
                          </p>
                        </div>

                        {/* Course Summary */}
                        <p className="text-xs sm:text-[13px] text-muted-foreground leading-relaxed line-clamp-3 break-words">
                          {c.summary}
                        </p>

                        {/* Skills Gained Tags */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5 min-w-0">
                          {c.skillsGained.slice(0, 3).map((sk, idx) => (
                            <span
                              key={idx}
                              className="rounded-lg bg-muted/60 px-2.5 py-1 text-[11px] font-semibold text-foreground border border-border/60 max-w-full truncate inline-block"
                              title={sk}
                            >
                              {sk}
                            </span>
                          ))}
                          {c.skillsGained.length > 3 && (
                            <span className="rounded-lg bg-muted/40 px-2 py-1 text-[11px] text-muted-foreground font-semibold shrink-0">
                              +{c.skillsGained.length - 3}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Meta & Actions */}
                      <div className="space-y-3.5 pt-3.5 border-t border-border/60 min-w-0">
                        <div className="flex items-center justify-between text-xs text-muted-foreground font-medium min-w-0">
                          <div className="flex items-center gap-1.5 shrink-0">
                            <HiOutlineClock className="h-4 w-4 text-primary shrink-0" />
                            <span>{c.duration}</span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <HiStar className="h-4 w-4 text-amber-500 shrink-0" />
                            <span className="font-bold text-foreground">{c.rating}</span>
                          </div>
                          <div className="font-bold text-foreground shrink-0 truncate">
                            {c.level}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleQuickEnroll(c.id, c.title)}
                            className={cn(
                              "rounded-xl sm:rounded-2xl font-bold text-xs h-10 px-2 sm:px-3 transition-all cursor-pointer flex items-center justify-center",
                              isEnrolled
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                                : "border-border/80 hover:bg-muted text-foreground"
                            )}
                          >
                            {isEnrolled ? (
                              <span className="flex items-center gap-1">
                                <HiCheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                                <span>Enrolled</span>
                              </span>
                            ) : (
                              "Quick Enroll"
                            )}
                          </Button>

                          <Button
                            size="sm"
                            asChild
                            className="rounded-xl sm:rounded-2xl font-bold text-xs h-10 px-2 sm:px-3 bg-primary hover:bg-primary-hover text-white shadow-xs cursor-pointer flex items-center justify-center"
                          >
                            <Link to="/learning/$id" params={{ id: c.id }}>
                              <span>Details</span>
                              <HiOutlineArrowRight className="ml-1 h-3.5 w-3.5 shrink-0" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* AI Clinical Interview Practice Simulator Dialog (#6) */}
      <Dialog open={interviewModalOpen} onOpenChange={setInterviewModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-1">
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-primary/10 text-primary">
                <BotMessageSquare className="h-4.5 w-4.5 text-primary" />
              </span>
              <div>
                <DialogTitle className="text-base font-bold text-foreground">
                  Clinical Viva &amp; Interview Practice
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Question {activeQuestionIdx + 1} of {interviewQuestions.length || 3} · Clinical Emergency Simulation
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {loadingQuestions ? (
              <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
                <ButtonSpinner className="h-6 w-6 text-primary" />
                <p className="text-xs text-muted-foreground font-medium">
                  Consulting AI Medical Examiner for realistic clinical scenarios...
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs font-semibold text-foreground leading-relaxed">
                  {interviewQuestions[activeQuestionIdx] || "A patient on mechanical ventilation triggers a sudden high-peak pressure alarm. What are your immediate assessment steps?"}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">
                    Your Spoken / Typed Clinical Response:
                  </label>
                  <textarea
                    rows={3}
                    value={interviewAnswer}
                    onChange={(e) => setInterviewAnswer(e.target.value)}
                    placeholder="Explain your clinical steps (e.g. check airway, inspect circuit, assess bilateral chest rise)..."
                    className="w-full rounded-2xl border border-border/80 bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>

                {interviewFeedback && (
                  <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed animate-in fade-in whitespace-pre-line">
                    {interviewFeedback}
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter className="flex items-center justify-between sm:justify-between gap-2 mt-2">
            <Button
              variant="outline"
              disabled={loadingQuestions}
              onClick={() => {
                if (activeQuestionIdx < interviewQuestions.length - 1) {
                  setActiveQuestionIdx((i) => i + 1);
                  setInterviewAnswer("");
                  setInterviewFeedback(null);
                } else {
                  setInterviewModalOpen(false);
                }
              }}
              className="rounded-xl text-xs font-bold"
            >
              {activeQuestionIdx < interviewQuestions.length - 1 ? "Next Scenario" : "Finish Practice"}
            </Button>
            <Button
              onClick={handleEvaluateAnswer}
              disabled={evaluatingInterview || loadingQuestions || !interviewAnswer.trim()}
              className="rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary-hover shadow-xs cursor-pointer"
            >
              {evaluatingInterview ? "Evaluating with AI..." : "Submit for Evaluation"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
