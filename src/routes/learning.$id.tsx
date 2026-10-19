import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  HiArrowLeft,
  HiOutlineAcademicCap,
  HiOutlineClock,
  HiOutlineBookOpen,
  HiOutlineCheckCircle,
  HiCheckCircle,
  HiOutlinePlay,
  HiOutlinePause,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineDocumentCheck,
  HiOutlineArrowDownTray,
  HiOutlineShare,
  HiStar,
  HiOutlineUserGroup,
  HiOutlineQuestionMarkCircle,
  HiOutlineTrophy,
  HiOutlineArrowRight,
  HiOutlineArrowPath,
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell } from "@/components/fale/AppShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { courses, type Course, type CourseLesson } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/learning/$id")({
  loader: ({ params }) => {
    const course = courses.find((c) => c.id === params.id);
    if (!course) throw notFound();
    return { course };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.course.title} — FALE Clinical Academy` },
          { name: "description", content: loaderData.course.summary },
          { property: "og:title", content: `${loaderData.course.title} — FALE Academy` },
          { property: "og:description", content: loaderData.course.summary },
        ]
      : [{ title: "Course Not Found — FALE" }],
  }),
  component: CourseDetailScreen,
});

function CourseDetailScreen() {
  const { course } = Route.useLoaderData();
  const s = useApp();

  const isEnrolled = s.courses.includes(course.id);

  // Active lesson state
  const firstLesson = course.modules[0]?.lessons[0] || null;
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(firstLesson);
  const [completedLessons, setCompletedLessons] = useState<string[]>(["l1_1"]);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<string>("1x");
  const [activeTab, setActiveTab] = useState<string>("classroom");

  // Quiz interactive state
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Certificate state
  const [certClaimed, setCertClaimed] = useState<boolean>(false);

  // Calculate total lessons & progress
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const progressPercent = Math.min(
    100,
    Math.round((completedLessons.length / Math.max(allLessons.length, 1)) * 100)
  );

  const handleEnroll = () => {
    if (!isEnrolled) {
      setState((x) => ({ courses: [...x.courses, course.id] }));
      toast.success("Successfully enrolled!", {
        description: `You now have full accredited access to ${course.title}.`,
      });
    }
  };

  const toggleLessonComplete = (lessonId: string) => {
    if (completedLessons.includes(lessonId)) {
      setCompletedLessons((prev) => prev.filter((id) => id !== lessonId));
    } else {
      setCompletedLessons((prev) => [...prev, lessonId]);
      toast.success("Lesson marked as complete", {
        description: "+25 CME Progress XP awarded.",
      });
    }
  };

  const handleOptionSelect = (optId: string) => {
    if (!quizSubmitted) {
      setSelectedOption(optId);
    }
  };

  const handleQuizSubmit = () => {
    if (!selectedOption) {
      toast.error("Please select an answer first.");
      return;
    }
    setQuizSubmitted(true);
    const chosen = course.clinicalScenario.options.find((o) => o.id === selectedOption);
    if (chosen?.isCorrect) {
      toast.success("Clinical Decision Verified!", {
        description: "Excellent diagnostic reasoning aligned with protocols.",
      });
      if (!completedLessons.includes("case_sim")) {
        setCompletedLessons((prev) => [...prev, "case_sim"]);
      }
    } else {
      toast.error("Review Clinical Rationale", {
        description: "Check the clinical explanation below and retry.",
      });
    }
  };

  const resetQuiz = () => {
    setSelectedOption(null);
    setQuizSubmitted(false);
  };

  const candidateName =
    typeof s.profile?.["fullName"] === "string" && s.profile["fullName"].trim()
      ? s.profile["fullName"]
      : "Nurse Priya Raman, RN";

  return (
    <AppShell>
      <div className="w-full max-w-full min-w-0 overflow-x-hidden space-y-6">
        {/* Back Button & Top Meta */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 min-w-0">
          <Link
            to="/learning"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground transition-colors hover:text-primary shrink-0"
          >
            <HiArrowLeft className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Back to Clinical Catalog</span>
            <span className="sm:hidden">Back to Catalog</span>
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                navigator.clipboard?.writeText(window.location.href);
                toast.success("Course link copied to clipboard!");
              }}
              className="rounded-xl font-medium text-xs text-muted-foreground hover:text-foreground h-8 sm:h-9"
            >
              <HiOutlineShare className="mr-1.5 h-3.5 w-3.5" /> Share
            </Button>
            {!isEnrolled ? (
              <Button
                size="sm"
                onClick={handleEnroll}
                className="rounded-xl font-bold text-xs bg-primary text-primary-foreground shadow-xs hover:bg-primary/95 h-8 sm:h-9"
              >
                <HiOutlineAcademicCap className="mr-1.5 h-4 w-4" /> Enroll Free
              </Button>
            ) : (
              <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold border-0 px-2.5 sm:px-3 py-1 text-xs">
                <HiCheckCircle className="mr-1 h-3.5 w-3.5" /> Enrolled
              </Badge>
            )}
          </div>
        </div>

        {/* Course Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-gradient-to-br from-card via-card to-blue-50/60 dark:to-blue-950/20 p-4 sm:p-6 md:p-8 shadow-xs w-full max-w-full min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6 w-full min-w-0">
            <div className="space-y-3 max-w-3xl w-full min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="rounded-full bg-primary/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-primary">
                  {course.category}
                </span>
                <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 sm:px-3 sm:py-1 text-[11px] sm:text-xs font-bold text-amber-700 dark:text-amber-300">
                  {course.accreditationBadge}
                </span>
                <span className="rounded-full bg-muted px-2 py-0.5 sm:px-2.5 sm:py-1 text-[11px] sm:text-xs font-semibold text-muted-foreground">
                  {course.level}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-tight text-foreground break-words hyphens-auto">
                {course.title}
              </h1>

              <p className="text-xs sm:text-sm md:text-base text-muted-foreground leading-relaxed break-words">
                {course.summary}
              </p>

              {/* Quick Metrics Bar */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-xs font-semibold text-muted-foreground min-w-0 max-w-full">
                <span className="flex items-center gap-1.5 text-foreground shrink-0">
                  <HiStar className="h-4 w-4 text-amber-500 shrink-0" />
                  <span className="font-bold">{course.rating}</span>
                  <span className="text-muted-foreground">({course.reviewsCount.toLocaleString()})</span>
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <HiOutlineClock className="h-4 w-4 text-primary shrink-0" />
                  {course.duration}
                </span>
                <span className="flex items-center gap-1.5 shrink-0">
                  <HiOutlineUserGroup className="h-4 w-4 text-primary shrink-0" />
                  {course.enrolledCount.toLocaleString()} enrolled
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 min-w-0 max-w-full">
                  <HiOutlineShieldCheck className="h-4 w-4 shrink-0" />
                  <span className="truncate">{course.accreditedBy}</span>
                </span>
              </div>
            </div>

            {/* Progress / Enrollment Summary Widget */}
            <div className="w-full lg:w-72 shrink-0 rounded-2xl border border-border/80 bg-background/80 backdrop-blur-xs p-4 sm:p-5 shadow-2xs space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-muted-foreground">Course Completion</span>
                <span className="text-primary font-black">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2 rounded-full" />
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{completedLessons.length} of {allLessons.length} lessons done</span>
                <span className="font-semibold text-foreground">+{course.cmeCredits} CME Pts</span>
              </div>

              {!isEnrolled ? (
                <Button
                  onClick={handleEnroll}
                  className="w-full rounded-xl font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/95 text-xs h-9"
                >
                  Enroll & Start Lesson
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setActiveTab("classroom");
                    toast.info("Resumed active lesson!");
                  }}
                  className="w-full rounded-xl font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/95 text-xs h-9"
                >
                  Continue Learning
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 w-full max-w-full min-w-0">
          <div className="border-b border-border/70 overflow-x-auto scrollbar-none w-full max-w-full pb-1">
            <TabsList className="bg-transparent h-11 sm:h-12 p-0 gap-1 sm:gap-3 justify-start w-max">
              <TabsTrigger
                value="classroom"
                className="rounded-none border-b-2 border-transparent px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap"
              >
                <HiOutlinePlay className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Classroom
              </TabsTrigger>
              <TabsTrigger
                value="curriculum"
                className="rounded-none border-b-2 border-transparent px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap"
              >
                <HiOutlineBookOpen className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Curriculum ({course.modules.length})
              </TabsTrigger>
              <TabsTrigger
                value="case_simulation"
                className="rounded-none border-b-2 border-transparent px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap"
              >
                <HiOutlineQuestionMarkCircle className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Case Quiz
              </TabsTrigger>
              <TabsTrigger
                value="certificate"
                className="rounded-none border-b-2 border-transparent px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap"
              >
                <HiOutlineTrophy className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Certificate
              </TabsTrigger>
              <TabsTrigger
                value="overview"
                className="rounded-none border-b-2 border-transparent px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-bold data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-primary whitespace-nowrap"
              >
                <HiOutlineDocumentCheck className="mr-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4" /> Overview
              </TabsTrigger>
            </TabsList>
          </div>

          {/* TAB 1: INTERACTIVE CLASSROOM / PLAYER */}
          <TabsContent value="classroom" className="space-y-6 mt-0 w-full max-w-full min-w-0">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] w-full max-w-full min-w-0">
              {/* Player Viewport & Clinical Lesson */}
              <div className="space-y-4 w-full max-w-full min-w-0">
                <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-neutral-950 text-white shadow-lg w-full max-w-full min-w-0">
                  {/* Simulated Medical Classroom Display */}
                  <div className="relative w-full max-w-full bg-gradient-to-tr from-slate-950 via-slate-900 to-blue-950 flex flex-col justify-between p-3.5 sm:p-6 min-h-[260px] sm:min-h-[340px] sm:aspect-video min-w-0">
                    {/* Subtle Grid / ECG Line decoration */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px]" />

                    {/* Top Bar inside Player */}
                    <div className="relative z-10 flex items-center justify-between gap-2 text-[10px] sm:text-xs font-semibold text-slate-300 w-full min-w-0">
                      <span className="flex items-center gap-1.5 shrink-0">
                        <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                        <span className="font-bold tracking-wider uppercase text-[10px] sm:text-xs">SIMULATION FEED</span>
                      </span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] sm:text-[10px] tracking-wide uppercase truncate max-w-[120px] sm:max-w-none shrink min-w-0">
                        {course.accreditationBadge}
                      </span>
                    </div>

                    {/* Center Content / Waveform or Video Mock */}
                    <div className="relative z-10 text-center max-w-md mx-auto space-y-2 sm:space-y-3 py-2 sm:py-0 w-full max-w-full min-w-0 px-1">
                      <div className="inline-grid h-12 w-12 sm:h-16 sm:w-16 place-items-center rounded-2xl bg-white/10 backdrop-blur-md text-white shadow-inner cursor-pointer hover:scale-105 transition-transform mx-auto"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? (
                          <HiOutlinePause className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
                        ) : (
                          <HiOutlinePlay className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground ml-0.5" />
                        )}
                      </div>
                      <div className="w-full min-w-0">
                        <h3 className="text-xs sm:text-base md:text-xl font-extrabold text-white break-words line-clamp-2 leading-tight">
                          {activeLesson?.title || "Lesson 1.1: Cardiac Monitoring & Resuscitation"}
                        </h3>
                        <p className="text-[10px] sm:text-xs text-slate-400 mt-1 truncate">
                          Instructor: {course.instructor.name} • {course.instructor.hospital}
                        </p>
                      </div>
                    </div>

                    {/* Scrubber & Controls */}
                    <div className="relative z-10 space-y-2 pt-2 sm:pt-4 w-full min-w-0">
                      <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden cursor-pointer">
                        <div className={cn("h-full bg-primary rounded-full transition-all duration-300", isPlaying ? "w-3/5" : "w-1/4")} />
                      </div>
                      <div className="flex items-center justify-between text-[10px] sm:text-[11px] text-slate-300 w-full min-w-0 gap-2">
                        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                          <button
                            type="button"
                            onClick={() => setIsPlaying(!isPlaying)}
                            className="hover:text-white font-bold cursor-pointer"
                          >
                            {isPlaying ? "Pause" : "Play"}
                          </button>
                          <span>04:12 / {activeLesson?.duration || "18m"}</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const speeds = ["1x", "1.25x", "1.5x", "2x"];
                              const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length] || "1x";
                              setPlaybackSpeed(next);
                            }}
                            className="rounded-md bg-white/10 px-1.5 py-0.5 sm:px-2 hover:bg-white/20 font-bold text-[10px] sm:text-xs cursor-pointer"
                          >
                            {playbackSpeed}
                          </button>
                          <span className="text-[9px] sm:text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                            HD
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lesson Context & Key Takeaways */}
                <div className="surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 space-y-4 w-full max-w-full min-w-0 overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-bold uppercase tracking-wider text-primary">
                        Active Clinical Topic
                      </span>
                      <h2 className="text-sm sm:text-lg font-black text-foreground mt-0.5 break-words">
                        {activeLesson?.title}
                      </h2>
                    </div>
                    <Button
                      size="sm"
                      variant={activeLesson && completedLessons.includes(activeLesson.id) ? "default" : "outline"}
                      onClick={() => activeLesson && toggleLessonComplete(activeLesson.id)}
                      className={cn(
                        "rounded-xl font-bold text-xs gap-1.5 shrink-0 self-start sm:self-auto",
                        activeLesson && completedLessons.includes(activeLesson.id)
                          ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                          : "border-border/80"
                      )}
                    >
                      {activeLesson && completedLessons.includes(activeLesson.id) ? (
                        <>
                          <HiCheckCircle className="h-4 w-4" /> Completed
                        </>
                      ) : (
                        <>
                          <HiOutlineCheckCircle className="h-4 w-4" /> Mark Complete
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="text-xs sm:text-sm text-muted-foreground space-y-2 leading-relaxed">
                    <p>
                      In this session, you review clinical decision algorithms according to the latest international resuscitation and nursing standards.
                      Pay close attention to immediate rhythm recognition, closed-loop telemetry confirmation, and avoiding CPR interruptions exceeding 5 seconds.
                    </p>
                  </div>

                  <div className="rounded-2xl bg-primary-soft/50 p-3.5 sm:p-4 border border-primary/15 space-y-1.5 sm:space-y-2">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1.5">
                      <HiOutlineSparkles className="h-4 w-4 shrink-0" /> Key Clinical Rule for this Lesson
                    </h4>
                    <p className="text-xs font-medium text-foreground leading-relaxed break-words">
                      "Chest compression fraction must remain &gt; 80%. When switching compressors every 2 minutes, perform rhythm check within 5 seconds without pausing IV infusion lines."
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar: Quick Curriculum Navigator */}
              <div className="surface p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-border/80 space-y-4 h-fit w-full max-w-full min-w-0 overflow-hidden">
                <div className="flex items-center justify-between min-w-0 gap-2">
                  <h3 className="font-extrabold text-sm text-foreground truncate">Course Content</h3>
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">
                    {completedLessons.length}/{allLessons.length} done
                  </span>
                </div>

                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
                  {course.modules.map((mod, modIdx) => (
                    <div key={mod.id} className="space-y-2 min-w-0">
                      <div className="flex items-center justify-between text-xs font-bold text-muted-foreground px-1 gap-2 min-w-0">
                        <span className="truncate flex-1">Module {modIdx + 1}: {mod.title.split(":")[1] || mod.title}</span>
                        <span className="shrink-0">{mod.duration}</span>
                      </div>

                      <div className="space-y-1.5 min-w-0">
                        {mod.lessons.map((lesson) => {
                          const isCurrent = activeLesson?.id === lesson.id;
                          const isDone = completedLessons.includes(lesson.id);

                          return (
                            <button
                              key={lesson.id}
                              type="button"
                              onClick={() => {
                                setActiveLesson(lesson);
                                setIsPlaying(true);
                              }}
                              className={cn(
                                "w-full text-left rounded-xl p-2.5 sm:p-3 text-xs transition-all flex items-start gap-2.5 border min-w-0",
                                isCurrent
                                  ? "bg-primary/10 border-primary/40 font-bold text-primary shadow-2xs"
                                  : "bg-card border-border/60 hover:bg-muted/40 text-foreground"
                              )}
                            >
                              <span className="mt-0.5 shrink-0">
                                {isDone ? (
                                  <HiCheckCircle className="h-4 w-4 text-emerald-600" />
                                ) : (
                                  <span className={cn("grid h-4 w-4 place-items-center rounded-full text-[10px] font-bold border", isCurrent ? "border-primary text-primary" : "border-muted-foreground text-muted-foreground")}>
                                    {lesson.id.split("_")[1] || "•"}
                                  </span>
                                )}
                              </span>
                              <div className="min-w-0 flex-1 overflow-hidden">
                                <p className="truncate leading-snug">{lesson.title}</p>
                                <p className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-2">
                                  <span className="capitalize">{lesson.type.replace("_", " ")}</span>
                                  <span>•</span>
                                  <span>{lesson.duration}</span>
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-border/70">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("case_simulation")}
                    className="w-full rounded-xl font-bold text-xs gap-1.5 border-border/80"
                  >
                    <HiOutlineQuestionMarkCircle className="h-4 w-4 text-amber-500 shrink-0" />
                    <span className="truncate">Take Interactive Case Quiz</span>
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

        {/* TAB 2: DETAILED CURRICULUM ACCORDION */}
        <TabsContent value="curriculum" className="space-y-6 mt-0 min-w-0">
          <div className="surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 space-y-4 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 min-w-0">
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-foreground break-words">Syllabus & Clinical Objectives</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Complete all modules to earn your CME Accredited Digital Certificate.
                </p>
              </div>
              <Badge className="bg-primary/15 text-primary border-0 font-bold px-3 py-1 text-xs">
                {course.modules.length} Modules • {allLessons.length} Clinical Units
              </Badge>
            </div>

            <Accordion type="multiple" defaultValue={course.modules[0]?.id ? [course.modules[0].id] : undefined} className="w-full space-y-3 min-w-0">
              {course.modules.map((mod, idx) => (
                <AccordionItem
                  key={mod.id}
                  value={mod.id}
                  className="border border-border/70 rounded-2xl px-4 bg-card shadow-2xs"
                >
                  <AccordionTrigger className="hover:no-underline py-4">
                    <div className="flex items-center gap-3 text-left">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary font-black text-xs">
                        0{idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{mod.title}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {mod.lessons.length} lessons • Total duration: {mod.duration}
                        </p>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pt-1 pb-4 space-y-2">
                    {mod.lessons.map((lesson) => {
                      const isDone = completedLessons.includes(lesson.id);
                      return (
                        <div
                          key={lesson.id}
                          className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {isDone ? (
                              <HiCheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                            ) : (
                              <HiOutlineBookOpen className="h-5 w-5 text-muted-foreground shrink-0" />
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{lesson.title}</p>
                              <p className="text-[11px] text-muted-foreground capitalize">
                                {lesson.type.replace("_", " ")} • {lesson.duration}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setActiveLesson(lesson);
                                setActiveTab("classroom");
                                setIsPlaying(true);
                              }}
                              className="h-7 text-xs font-bold text-primary hover:text-primary hover:bg-primary-soft rounded-lg"
                            >
                              Launch
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleLessonComplete(lesson.id)}
                              className="h-7 text-xs rounded-lg text-muted-foreground hover:text-foreground"
                            >
                              {isDone ? "Done" : "Check"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </TabsContent>

        {/* TAB 3: CLINICAL CASE SIMULATION & QUIZ */}
        <TabsContent value="case_simulation" className="space-y-6 mt-0 min-w-0">
          <div className="surface p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-border/80 space-y-5 sm:space-y-6 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-b border-border/70 pb-4">
              <div>
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                  Interactive Bedside Simulation
                </span>
                <h3 className="text-lg sm:text-xl font-black text-foreground mt-2 break-words">
                  {course.clinicalScenario.title}
                </h3>
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                Passing standard: Immediate first-line adherence
              </span>
            </div>

            {/* Patient Scenario Card */}
            <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-amber-50/20 dark:to-amber-950/10 p-4 sm:p-5 space-y-4 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                {course.clinicalScenario.caseDescription}
              </p>

              {/* Vitals Monitor Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 pt-1">
                <div className="rounded-xl bg-background p-2.5 sm:p-3 border border-border/70">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Heart Rate</p>
                  <p className="text-sm sm:text-base font-black text-red-500 mt-0.5">{course.clinicalScenario.patientVitals.hr}</p>
                </div>
                <div className="rounded-xl bg-background p-2.5 sm:p-3 border border-border/70">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Blood Pressure</p>
                  <p className="text-sm sm:text-base font-black text-amber-500 mt-0.5">{course.clinicalScenario.patientVitals.bp}</p>
                </div>
                <div className="rounded-xl bg-background p-2.5 sm:p-3 border border-border/70">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Oxygen (SpO2)</p>
                  <p className="text-sm sm:text-base font-black text-blue-500 mt-0.5">{course.clinicalScenario.patientVitals.spo2}</p>
                </div>
                <div className="rounded-xl bg-background p-2.5 sm:p-3 border border-border/70">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ECG Rhythm</p>
                  <p className="text-[11px] sm:text-xs font-extrabold text-foreground mt-1 truncate">{course.clinicalScenario.patientVitals.rhythm}</p>
                </div>
              </div>
            </div>

            {/* Question Prompt */}
            <div className="space-y-3 min-w-0">
              <h4 className="text-xs sm:text-sm md:text-base font-extrabold text-foreground flex items-start sm:items-center gap-2">
                <HiOutlineQuestionMarkCircle className="h-5 w-5 text-primary shrink-0 mt-0.5 sm:mt-0" />
                <span className="break-words">{course.clinicalScenario.prompt}</span>
              </h4>

              <div className="space-y-2.5 min-w-0">
                {course.clinicalScenario.options.map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  let optStyle = "border-border/70 hover:bg-muted/40 bg-card";

                  if (quizSubmitted) {
                    if (opt.isCorrect) {
                      optStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-900 dark:text-emerald-200 font-bold";
                    } else if (isSelected && !opt.isCorrect) {
                      optStyle = "border-red-500 bg-red-500/10 text-red-900 dark:text-red-200";
                    }
                  } else if (isSelected) {
                    optStyle = "border-primary bg-primary/10 text-primary font-bold shadow-2xs";
                  }

                  return (
                    <div
                      key={opt.id}
                      onClick={() => handleOptionSelect(opt.id)}
                      className={cn(
                        "p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer space-y-1.5 min-w-0",
                        optStyle
                      )}
                    >
                      <div className="flex items-start gap-2.5 sm:gap-3 min-w-0">
                        <span className="mt-0.5 shrink-0">
                          {quizSubmitted && opt.isCorrect ? (
                            <HiCheckCircle className="h-5 w-5 text-emerald-600" />
                          ) : (
                            <span className={cn("grid h-5 w-5 place-items-center rounded-full border text-xs font-bold", isSelected ? "border-primary bg-primary text-white" : "border-muted-foreground text-muted-foreground")}>
                              {opt.id.split("_")[1] || "•"}
                            </span>
                          )}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-semibold leading-relaxed break-words">{opt.text}</p>
                          {quizSubmitted && (
                            <p className="text-xs mt-2 pt-2 border-t border-border/50 text-foreground/85 leading-relaxed font-normal break-words">
                              <strong>Clinical Rationale:</strong> {opt.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              {!quizSubmitted ? (
                <Button
                  onClick={handleQuizSubmit}
                  className="rounded-xl font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/95 px-5 sm:px-6 text-xs h-9 w-full sm:w-auto"
                >
                  Submit Clinical Decision
                </Button>
              ) : (
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={resetQuiz}
                    className="rounded-xl font-bold text-xs gap-1.5 h-9"
                  >
                    <HiOutlineArrowPath className="h-4 w-4" /> Try Again
                  </Button>
                  <Button
                    onClick={() => setActiveTab("certificate")}
                    className="rounded-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5 h-9"
                  >
                    View Credential Certificate <HiOutlineArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* TAB 4: DIGITAL CME CERTIFICATE */}
        <TabsContent value="certificate" className="space-y-6 mt-0 min-w-0">
          <div className="surface p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-border/80 space-y-6 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
              <div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  Accredited Qualification
                </span>
                <h3 className="text-lg sm:text-xl font-black text-foreground mt-2 break-words">
                  Verified Continuing Medical Education (CME) Credential
                </h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCertClaimed(true);
                  toast.success("Certificate Added to FALE Profile!", {
                    description: "Hospitals viewing your application will now see your verified badge.",
                  });
                }}
                className="rounded-xl font-bold text-xs border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10"
              >
                <HiOutlineDocumentCheck className="mr-1.5 h-4 w-4" />
                {certClaimed ? "Added to Profile" : "Add to FALE Profile"}
              </Button>
            </div>

            {/* Certificate Preview Card */}
            <div className="relative mx-auto max-w-2xl overflow-hidden rounded-2xl sm:rounded-3xl border-2 sm:border-4 border-double border-primary/40 bg-gradient-to-br from-card via-card to-blue-50/50 dark:to-blue-950/20 p-4 sm:p-8 shadow-md text-center space-y-5 sm:space-y-6 min-w-0">
              {/* Seal & Logo */}
              <div className="flex items-center justify-between px-1 sm:px-2 gap-2">
                <div className="text-left min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-primary block truncate">
                    FALE CLINICAL ACADEMY
                  </span>
                  <p className="text-[8px] sm:text-[9px] text-muted-foreground truncate">GOVERNMENT & ACCREDITED ALLIANCE</p>
                </div>
                <div className="grid h-10 w-10 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-xs">
                  <HiOutlineAcademicCap className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>

              {/* Title & Recipient */}
              <div className="space-y-2 py-2 sm:py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">
                  This certifies that
                </p>
                <h2 className="text-lg sm:text-2xl md:text-3xl font-black text-foreground tracking-tight underline decoration-primary/40 decoration-2 underline-offset-8 break-words">
                  {candidateName}
                </h2>
                <p className="text-xs text-muted-foreground max-w-md mx-auto pt-2 leading-relaxed">
                  has satisfactorily mastered the rigorous clinical simulation requirements, knowledge exams, and protocol competencies for:
                </p>
                <h3 className="text-sm sm:text-base md:text-lg font-extrabold text-primary pt-1 break-words">
                  {course.title}
                </h3>
              </div>

              {/* Metadata Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-2 border-t border-b border-border/70 py-3.5 sm:py-4 text-xs">
                <div className="text-left sm:text-center">
                  <p className="text-[10px] text-muted-foreground">Accrediting Authority</p>
                  <p className="font-bold text-foreground mt-0.5 break-words">{course.accreditedBy}</p>
                </div>
                <div className="text-left sm:text-center">
                  <p className="text-[10px] text-muted-foreground">CME Hours</p>
                  <p className="font-bold text-foreground mt-0.5">{course.cmeCredits} Hours</p>
                </div>
                <div className="text-left sm:text-center">
                  <p className="text-[10px] text-muted-foreground">Credential ID</p>
                  <p className="font-mono text-[11px] font-bold text-primary mt-0.5">{course.certificateDetails.credentialCode}</p>
                </div>
              </div>

              {/* Footer Signatures */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between text-left text-xs pt-2 gap-3">
                <div>
                  <p className="font-serif italic text-foreground font-bold">{course.instructor.name}</p>
                  <p className="text-[10px] text-muted-foreground">{course.instructor.role}</p>
                  <p className="text-[9px] text-muted-foreground">{course.instructor.hospital}</p>
                </div>
                <div className="sm:text-right">
                  <p className="text-[10px] text-muted-foreground">Issued on: 19 Oct 2026</p>
                  <p className="text-[10px] text-muted-foreground">Validity: {course.certificateDetails.validity}</p>
                  <span className="inline-block mt-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                    Cryptographically Verified
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => {
                  toast.success("Downloading Certificate PDF...", {
                    description: `Saved as ${course.certificateDetails.credentialCode}.pdf`,
                  });
                }}
                className="rounded-xl font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/95 text-xs gap-1.5 h-9"
              >
                <HiOutlineArrowDownTray className="h-4 w-4" /> Download Certificate (PDF)
              </Button>
              <Button
                variant="outline"
                asChild
                className="rounded-xl font-bold text-xs gap-1.5 border-border/80 h-9"
              >
                <Link to="/profile">
                  View in My Profile
                </Link>
              </Button>
            </div>
          </div>
        </TabsContent>

        {/* TAB 5: OVERVIEW & FACULTY */}
        <TabsContent value="overview" className="space-y-6 mt-0 min-w-0">
          <div className="grid gap-6 lg:grid-cols-[1fr_340px] min-w-0">
            <div className="surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 space-y-6 min-w-0">
              <div className="space-y-3 min-w-0">
                <h3 className="text-base sm:text-lg font-black text-foreground">Course Overview</h3>
                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  {course.overview}
                </p>
              </div>

              <div className="space-y-3 min-w-0">
                <h3 className="text-sm sm:text-base font-black text-foreground">What You Will Learn</h3>
                <div className="grid gap-2.5 sm:grid-cols-2">
                  {course.whatYouWillLearn.map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5 text-xs text-foreground font-medium min-w-0">
                      <HiCheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="break-words">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3 min-w-0">
                <h3 className="text-sm sm:text-base font-black text-foreground">Skills You Will Acquire</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {course.skillsGained.map((skill, i) => (
                    <span
                      key={i}
                      className="rounded-xl bg-muted px-2.5 py-1 sm:px-3 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-foreground border border-border/60"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-border/70 min-w-0">
                <h3 className="text-sm sm:text-base font-black text-foreground">Recognized by Leading Healthcare Networks</h3>
                <div className="flex flex-wrap gap-1.5 sm:gap-2 text-xs font-bold text-muted-foreground">
                  {course.certificateDetails.recognizedHospitals.map((h, i) => (
                    <span key={i} className="rounded-lg bg-primary-soft px-2.5 py-1 text-primary text-[11px] sm:text-xs">
                      {h}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Instructor Profile Card */}
            <div className="surface p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-border/80 space-y-4 sm:space-y-5 h-fit min-w-0">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Course Director & Faculty
              </span>

              <div className="flex items-start gap-3.5">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary text-white font-black text-lg shadow-xs">
                  {course.instructor.avatarInitials}
                </span>
                <div>
                  <h4 className="font-extrabold text-sm text-foreground">{course.instructor.name}</h4>
                  <p className="text-xs text-muted-foreground leading-snug">{course.instructor.role}</p>
                  <p className="text-[11px] font-semibold text-primary mt-1">{course.instructor.hospital}</p>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {course.instructor.bio}
              </p>

              <div className="pt-2 border-t border-border/70 space-y-2 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <span>Target Audience</span>
                  <span className="font-bold text-foreground">Clinical Staff</span>
                </div>
                <p className="text-[11px] text-muted-foreground italic">
                  {course.targetAudience}
                </p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      </div>
    </AppShell>
  );
}
