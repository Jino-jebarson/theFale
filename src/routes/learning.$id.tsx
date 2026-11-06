import { useState, useRef, useEffect } from "react";
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
  HiOutlineSpeakerWave,
  HiOutlineSpeakerXMark,
  HiOutlineArrowsPointingOut,
  HiOutlineTv,
  HiOutlineSignal,
  HiOutlineCpuChip,
  HiOutlineExclamationTriangle,
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
import { isApiEnabled } from "@/lib/api";
import { enrollCourse, updateCourseProgress, getCourseById, getCourses } from "@/lib/adapters/learningAdapter";
import { getCourseMediaConfig, type CourseMediaConfig, type QuizQuestion } from "@/lib/clinicalMediaEngine";

export const Route = createFileRoute("/learning/$id")({
  loader: async ({ params }) => {
    const course = (await getCourseById(params.id)) || courses.find((c) => c.id === params.id);
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

function getCourseClinicalRule(courseId: string, category?: string): string {
  switch (courseId) {
    case "cme-ecg-101":
      return "Chest pain onset < 12 hours with STEMI requires cath lab activation within 10 minutes of ECG acquisition and door-to-balloon time < 90 minutes.";
    case "cme-ards-102":
      return "Maintain lung-protective tidal volumes strictly at 4–6 mL/kg PBW. If PaO2/FiO2 < 150, initiate prone positioning for a minimum of 16 consecutive hours.";
    case "cme-sepsis-103":
      return "The 1-hour Sepsis Bundle requires blood cultures before IV antibiotics, 30 mL/kg balanced crystalloids for hypotension, and Norepinephrine targeting MAP >= 65 mmHg.";
    case "cme-ams-104":
      return "Reassess empiric carbapenems at 48–72 hours with microbiology culture results. De-escalate to targeted narrow-spectrum agents as soon as sensitivities return.";
    case "cme-acls-201":
      return "In shockable rhythms (VF/pVT), defibrillate immediately at 200J biphasic. Resume high-quality CPR instantly for 2 minutes without pausing for pulse checks.";
    case "cme-hemo-202":
      return "Zero and level arterial line transducers to the phlebostatic axis (4th ICS, mid-axillary line). Perform fast-flush square-wave test to verify dynamic response.";
    case "cme-clabsi-203":
      return "Perform maximum sterile barrier precautions during insertion. Scrub needleless access ports with 70% alcohol for 15 seconds, and audit daily for immediate line removal.";
    case "cme-pals-204":
      return "In pediatric shock, administer 20 mL/kg isotonic balanced crystalloids rapidly over 5–10 minutes using the push-pull syringe method; reassess liver size and lung sounds.";
    case "cme-lasa-301":
      return "Enforce ISMP Tall Man lettering, independent double checks, and barcode verification before dispensing look-alike sound-alike (LASA) high-alert medications.";
    case "cme-chemo-302":
      return "Reconstitute cytotoxic drugs inside Class II Type B2 Biological Safety Cabinets. In the event of a spill, keep exhaust ON and deploy the hazardous chemo spill kit.";
    case "cme-tdm-303":
      return "Target AUC24/MIC ratio of 400–600 for Vancomycin. Draw steady-state serum trough levels strictly 30 minutes prior to the 4th dose to prevent nephrotoxicity.";
    case "cme-fistula-401":
      return "Rotate cannulation sites using rope-ladder technique. Never flush an infiltrated venous needle; immediately stop blood pump, apply manual pressure, and ice.";
    case "cme-ro-402":
      return "Total chlorine must be tested daily before the first patient shift (AAMI safe limit < 0.10 mg/L). If breached, immediately halt treatments and switch to polish bed.";
    case "cme-crrt-403":
      return "During Regional Citrate Anticoagulation, monitor total-to-ionized calcium ratio. A ratio > 2.5 indicates citrate accumulation requiring immediate citrate rate reduction.";
    case "cme-icu-rehab-501":
      return "Mobilize ICU patients in a tiered progression (bed-sitting -> edge-of-bed -> tilt-table) once RASS is -1 to +1 and hemodynamics are stable without escalating vasopressors.";
    case "cme-tkr-502":
      return "Clear patient for Day-0 bedside sitting and walker ambulation within 4 hours of total knee arthroplasty after verifying motor quadriceps set and sensation return.";
    case "cme-stroke-503":
      return "Never pull on a flaccid hemiplegic arm during transfers. Support the humeral head with scapular protraction and humeral support cuffs to prevent painful subluxation.";
    case "cme-trauma-ct-601":
      return "For acute severe contrast anaphylaxis with stridor, administer Intramuscular Epinephrine 0.3–0.5 mg (1:1000) into the anterolateral mid-thigh immediately.";
    case "cme-aerb-602":
      return "Apply ALARA principles: maximize distance, utilize 7.5 fps low-pulse fluoroscopy, tightly collimate the beam, and position ceiling lead shields between tube and operator.";
    case "cme-bls-701":
      return "Push hard and fast: 100–120 compressions/minute at 5–6 cm depth with full chest recoil. Minimize compression interruptions to under 5 seconds.";
    case "cme-bmw-702":
      return "Segregate immediately at point of generation: White translucent box = sharps/needles, Red = recyclable plastics/syringes, Yellow = anatomical and blood-soaked waste.";
    case "cme-sbar-703":
      return "Structure critical clinical escalations with SBAR: Situation, Background, Assessment, and Recommendation. Always request a clear verbal read-back on emergency orders.";
    default:
      return "Adhere strictly to evidence-based hospital protocols, patient safety guidelines, and closed-loop multidisciplinary communication.";
  }
}

function CourseDetailScreen() {
  const { course } = Route.useLoaderData();
  const s = useApp();

  const isEnrolled = s.courses.includes(course.id);
  const mediaConfig: CourseMediaConfig = getCourseMediaConfig(course.id, course.category, course.summary);

  const simData = mediaConfig?.simulationData || {
    procedureStep: `${course.category || "Clinical"} Procedural Protocol`,
    checklist: [
      "Patient identity and procedure site confirmed",
      "Sterile barriers and WHO 5-Moments hand hygiene completed",
      "NABH, CDC, and institutional clinical SOP directives applied",
      "Closed-loop verbal verification and electronic documentation performed",
    ],
    actionPrompt: "Confirm evidence-based clinical directive according to hospital accreditation standards.",
    actionButtons: [
      { label: "Follow Verified Clinical Safety Checklist", feedback: "Verified: Standardized protocols significantly minimize adverse events.", isCorrect: true },
      { label: "Omit Safety Steps to Expedite Care", feedback: "Violation: Omission of verification steps is the primary cause of clinical error.", isCorrect: false },
    ],
  };

  // Active lesson state
  const firstLesson = course.modules[0]?.lessons[0] || null;
  const [activeLesson, setActiveLesson] = useState<CourseLesson | null>(firstLesson);
  const [completedLessons, setCompletedLessons] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(`fale_lessons_${course.id}`);
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return isEnrolled ? ["l1_1"] : [];
  });
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<string>("1x");
  const [activeTab, setActiveTab] = useState<string>("classroom");

  // Dual Viewport Mode: "simulation" (course-specific procedural telemetry) vs "video" (lecture video)
  const [feedMode, setFeedMode] = useState<"simulation" | "video">("simulation");

  // Interactive Clinical Simulation Action Feedback State
  const [simFeedback, setSimFeedback] = useState<{ text: string; isCorrect: boolean } | null>(null);
  const [scrubSeconds, setScrubSeconds] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState<boolean>(false);

  // Video player controls state & refs
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playerContainerRef = useRef<HTMLDivElement | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Dynamic Quiz State
  const quizQuestions: QuizQuestion[] =
    mediaConfig.quizQuestions && mediaConfig.quizQuestions.length > 0
      ? mediaConfig.quizQuestions
      : [
          {
            id: "q1",
            question: course.clinicalScenario.prompt,
            options: course.clinicalScenario.options,
          },
        ];

  const [currentQuizIdx, setCurrentQuizIdx] = useState<number>(0);
  const [userQuizAnswers, setUserQuizAnswers] = useState<Record<string, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);

  // Certificate state
  const [certClaimed, setCertClaimed] = useState<boolean>(false);

  // Calculate total lessons & progress
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const progressPercent = isEnrolled
    ? Math.min(100, Math.round((completedLessons.length / Math.max(allLessons.length, 1)) * 100))
    : 0;

  // Handle Scrub-the-hub / Timer simulation effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isScrubbing && scrubSeconds > 0) {
      interval = setInterval(() => {
        setScrubSeconds((prev) => {
          if (prev <= 1) {
            setIsScrubbing(false);
            toast.success("Sterile Scrub Complete! Hub Disinfected (15s friction achieved).");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isScrubbing, scrubSeconds]);

  const startScrubTimer = () => {
    setScrubSeconds(15);
    setIsScrubbing(true);
    toast.info("15-Second Active Friction Scrub Initiated", {
      description: "CDC/NABH Standard: Vigorously scrubbing needleless access hub with 70% alcohol.",
    });
  };

  // Sync enrollment and completed lessons from backend or localStorage
  useEffect(() => {
    if (isApiEnabled) {
      getCourses()
        .then((list) => {
          const found = list.find((c) => c.id === course.id);
          if (found) {
            if (found.enrolled) {
              setState((x) => ({ courses: Array.from(new Set([...x.courses, course.id])) }));
              const saved = localStorage.getItem(`fale_lessons_${course.id}`);
              if (saved) {
                try {
                  setCompletedLessons(JSON.parse(saved));
                } catch (_) {}
              } else if (found.progressPercent > 0) {
                const count = Math.max(1, Math.round((found.progressPercent / 100) * allLessons.length));
                setCompletedLessons(allLessons.slice(0, count).map((l) => l.id));
              }
            } else {
              setCompletedLessons([]);
            }
          }
        })
        .catch(console.error);
    } else {
      const saved = localStorage.getItem(`fale_lessons_${course.id}`);
      if (saved) {
        try {
          setCompletedLessons(JSON.parse(saved));
        } catch (_) {}
      } else if (!isEnrolled) {
        setCompletedLessons([]);
      }
    }
  }, [course.id, isEnrolled]);

  const handleEnroll = () => {
    if (!isEnrolled) {
      if (isApiEnabled) {
        enrollCourse(course.id).catch((err) => {
          console.error("Failed to enroll in course:", err);
        });
      }
      setState((x) => ({ courses: [...x.courses, course.id] }));
      toast.success("Successfully enrolled!", {
        description: `You now have full accredited access to ${course.title}. Starting Lesson 1.`,
      });
      if (firstLesson) {
        setActiveLesson(firstLesson);
      }
      setActiveTab("classroom");
    }
  };

  const toggleLessonComplete = (lessonId: string) => {
    if (!isEnrolled) {
      handleEnroll();
    }
    const updated = completedLessons.includes(lessonId)
      ? completedLessons.filter((id) => id !== lessonId)
      : [...completedLessons, lessonId];
    setCompletedLessons(updated);
    try {
      localStorage.setItem(`fale_lessons_${course.id}`, JSON.stringify(updated));
    } catch (_) {}

    const newProgress = Math.min(
      100,
      Math.round((updated.length / Math.max(allLessons.length, 1)) * 100)
    );
    if (isApiEnabled) {
      updateCourseProgress(course.id, newProgress).catch(console.error);
    }
    if (!completedLessons.includes(lessonId)) {
      toast.success("Lesson marked as complete", {
        description: "+25 CME Progress XP awarded.",
      });
    }
  };

  const handleNextLesson = () => {
    const currentIndex = allLessons.findIndex((l) => l.id === activeLesson?.id);
    if (currentIndex >= 0 && currentIndex < allLessons.length - 1) {
      const next = allLessons[currentIndex + 1];
      setActiveLesson(next);
      setSimFeedback(null);
      if (videoRef.current && feedMode === "video") {
        videoRef.current.currentTime = 0;
        videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
      }
      toast.info(`Next Lesson: ${next.title}`);
    } else {
      setActiveTab("case_simulation");
      toast.success("All lectures completed! Solve the Case Quiz to earn your CME Certificate.");
    }
  };

  // Video player control actions
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current
        .play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn("Video playback was interrupted:", err);
          setIsPlaying(false);
        });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration || 180);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    videoRef.current.currentTime = pos * duration;
    setCurrentTime(pos * duration);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !videoRef.current.muted;
    videoRef.current.muted = next;
    setIsMuted(next);
  };

  const handleSpeedChange = () => {
    const speeds = ["1x", "1.25x", "1.5x", "2x"];
    const next = speeds[(speeds.indexOf(playbackSpeed) + 1) % speeds.length] || "1x";
    setPlaybackSpeed(next);
    if (videoRef.current) {
      videoRef.current.playbackRate = parseFloat(next.replace("x", ""));
    }
  };

  const toggleFullscreen = () => {
    if (!playerContainerRef.current) return;
    if (!document.fullscreenElement) {
      playerContainerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(console.error);
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(console.error);
    }
  };

  const handleVideoEnded = () => {
    setIsPlaying(false);
    if (activeLesson && !completedLessons.includes(activeLesson.id)) {
      toggleLessonComplete(activeLesson.id);
      toast.success("Lesson video finished!", {
        description: `Marked "${activeLesson.title}" as completed.`,
      });
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Quiz submission & evaluation
  const handleSelectQuizOption = (questionId: string, optionId: string) => {
    if (!quizSubmitted) {
      setUserQuizAnswers((prev) => ({ ...prev, [questionId]: optionId }));
    }
  };

  const handleQuizSubmit = () => {
    const answeredCount = Object.keys(userQuizAnswers).length;
    if (answeredCount < quizQuestions.length) {
      toast.error(`Please answer all ${quizQuestions.length} questions before submitting.`);
      return;
    }
    setQuizSubmitted(true);

    // Calculate score
    let correctCount = 0;
    quizQuestions.forEach((q) => {
      const selectedId = userQuizAnswers[q.id];
      const correctOpt = q.options.find((o) => o.isCorrect);
      if (selectedId && correctOpt && selectedId === correctOpt.id) {
        correctCount += 1;
      }
    });

    const passScore = correctCount / quizQuestions.length >= 0.8;
    if (passScore) {
      toast.success("Clinical Competency Verified! Score: " + `${correctCount}/${quizQuestions.length}`, {
        description: "+50 CME XP Awarded. Your accredited credential certificate is unlocked!",
      });
      // Mark all lessons or quiz complete
      const allIds = allLessons.map((l) => l.id);
      setCompletedLessons(allIds);
      try {
        localStorage.setItem(`fale_lessons_${course.id}`, JSON.stringify(allIds));
      } catch (_) {}
      if (isApiEnabled) {
        updateCourseProgress(course.id, 100).catch(console.error);
      }
    } else {
      toast.error(`Score: ${correctCount}/${quizQuestions.length}. Passing standard is 80%.`, {
        description: "Review the evidence-based rationales below and retry.",
      });
    }
  };

  const resetQuiz = () => {
    setUserQuizAnswers({});
    setQuizSubmitted(false);
    setCurrentQuizIdx(0);
    toast.info("Quiz reset for clinical retry.");
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
                  className="w-full rounded-xl font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/95 text-xs h-9 cursor-pointer"
                >
                  Enroll & Start Lesson
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setActiveTab("classroom");
                    toast.info("Resumed active lesson!");
                  }}
                  className="w-full rounded-xl font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/95 text-xs h-9 cursor-pointer"
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
              {/* Left Column: Player Viewport & Clinical Context */}
              <div className="space-y-4 w-full max-w-full min-w-0">
                
                {/* Viewport Mode Switcher Header */}
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/10 text-red-600 dark:text-red-400 font-bold tracking-wider uppercase text-[10px] border border-red-500/20">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                      <span>{mediaConfig?.simulationType || "Procedure Sim"}</span>
                    </span>
                    <span className="text-xs font-bold text-foreground truncate hidden sm:inline">
                      {course.title}
                    </span>
                  </div>

                  {/* Mode Toggle Buttons */}
                  <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border/70">
                    <button
                      type="button"
                      onClick={() => setFeedMode("simulation")}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        feedMode === "simulation"
                          ? "bg-primary text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <HiOutlineCpuChip className="h-3.5 w-3.5" />
                      <span>Procedure Sim</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFeedMode("video")}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer",
                        feedMode === "video"
                          ? "bg-primary text-white shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <HiOutlineTv className="h-3.5 w-3.5" />
                      <span>Video Feed</span>
                    </button>
                  </div>
                </div>

                {/* VIEWPORT CONTAINER */}
                {activeLesson?.type === "quiz" ? (
                  /* IN-CLASSROOM DYNAMIC QUIZ VIEWPORT */
                  <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-neutral-950 text-white shadow-lg p-4 sm:p-6 space-y-5 min-h-[380px] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300 border-b border-white/10 pb-3">
                      <span className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                        <span className="font-bold tracking-wider uppercase text-[10px] sm:text-xs">
                          IN-CLASSROOM CLINICAL QUIZ: {activeLesson.title}
                        </span>
                      </span>
                      <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] text-amber-300 font-bold">
                        Knowledge Check
                      </span>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-base sm:text-lg font-extrabold text-white">
                        {quizQuestions[0]?.question || course.clinicalScenario.prompt}
                      </h3>

                      <div className="space-y-2">
                        {(quizQuestions[0]?.options || course.clinicalScenario.options).map((opt) => {
                          const isSel = userQuizAnswers[quizQuestions[0]?.id || "q1"] === opt.id;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => handleSelectQuizOption(quizQuestions[0]?.id || "q1", opt.id)}
                              className={cn(
                                "w-full text-left p-3 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-start gap-3",
                                isSel
                                  ? "bg-primary/20 border-primary text-white"
                                  : "bg-white/5 border-white/10 text-slate-200 hover:bg-white/10"
                              )}
                            >
                              <span className={cn("grid h-5 w-5 place-items-center rounded-full border text-xs shrink-0 mt-0.5", isSel ? "bg-primary border-primary text-white font-bold" : "border-slate-500 text-slate-400")}>
                                {opt.id.slice(-1).toUpperCase()}
                              </span>
                              <span>{opt.text}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/10 pt-3">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setActiveTab("case_simulation")}
                        className="text-xs text-slate-300 hover:text-white"
                      >
                        Open Full Board Case Quiz
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (userQuizAnswers[quizQuestions[0]?.id || "q1"]) {
                            toggleLessonComplete(activeLesson.id);
                            toast.success("Module Quiz Passed!", {
                              description: "+25 CME Progress XP awarded.",
                            });
                          } else {
                            toast.error("Please choose a clinical option first.");
                          }
                        }}
                        className="rounded-xl font-bold text-xs bg-primary text-white hover:bg-primary/90"
                      >
                        Submit & Validate Lesson
                      </Button>
                    </div>
                  </div>
                ) : feedMode === "simulation" ? (
                  /* COURSE-SPECIFIC PROCEDURAL SIMULATION & TELEMETRY VIEWPORT */
                  <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-neutral-950 text-white shadow-xl p-4 sm:p-6 space-y-5 min-h-[440px] flex flex-col justify-between">
                    {/* Top Console HUD */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-mono text-emerald-400 font-extrabold uppercase tracking-wider text-[11px]">
                          {mediaConfig?.simulationTitle || course.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] text-slate-300 font-bold uppercase tracking-wider">
                          {course.accreditationBadge}
                        </span>
                        <span className="rounded-full bg-emerald-500/30 text-emerald-300 font-extrabold px-1.5 py-0.5 text-[9px] border border-emerald-400/40">
                          LIVE FEED
                        </span>
                      </div>
                    </div>

                    {/* Vitals & Telemetry Gauges Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Heart Rate</span>
                        <p className="text-base sm:text-lg font-mono font-black text-red-400 mt-0.5">{mediaConfig.monitorVitals.hr}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Blood Pressure</span>
                        <p className="text-base sm:text-lg font-mono font-black text-amber-400 mt-0.5">{mediaConfig.monitorVitals.bp}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Oxygenation (SpO2)</span>
                        <p className="text-base sm:text-lg font-mono font-black text-blue-400 mt-0.5">{mediaConfig.monitorVitals.spo2}</p>
                      </div>
                      <div className="rounded-xl bg-white/5 border border-white/10 p-2.5 text-center">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Clinical Status</span>
                        <p className="text-xs sm:text-sm font-mono font-extrabold text-emerald-400 mt-1 truncate">{mediaConfig.monitorVitals.rhythm}</p>
                      </div>
                    </div>

                    {/* Specialized Custom Gauges */}
                    {(mediaConfig.monitorVitals.customGauge1 || mediaConfig.monitorVitals.customGauge2) && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {mediaConfig.monitorVitals.customGauge1 && (
                          <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs">
                            <span className="text-slate-300 font-semibold">{mediaConfig.monitorVitals.customGauge1.label}</span>
                            <span className={cn(
                              "font-mono font-bold px-2 py-0.5 rounded text-[11px]",
                              mediaConfig.monitorVitals.customGauge1.status === "critical"
                                ? "bg-red-500/20 text-red-300 border border-red-500/40"
                                : mediaConfig.monitorVitals.customGauge1.status === "warning"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            )}>
                              {mediaConfig.monitorVitals.customGauge1.value}
                            </span>
                          </div>
                        )}
                        {mediaConfig.monitorVitals.customGauge2 && (
                          <div className="flex items-center justify-between rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-xs">
                            <span className="text-slate-300 font-semibold">{mediaConfig.monitorVitals.customGauge2.label}</span>
                            <span className={cn(
                              "font-mono font-bold px-2 py-0.5 rounded text-[11px]",
                              mediaConfig.monitorVitals.customGauge2.status === "critical"
                                ? "bg-red-500/20 text-red-300 border border-red-500/40"
                                : mediaConfig.monitorVitals.customGauge2.status === "warning"
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                            )}>
                              {mediaConfig.monitorVitals.customGauge2.value}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Interactive Animated Waveform / Instrument Graphic */}
                    <div className="relative rounded-2xl bg-black/60 border border-white/10 p-3 sm:p-4 overflow-hidden space-y-3">
                      {/* Visual Graphic according to course theme */}
                      {mediaConfig.theme === "cardiac" ? (
                        /* Live ECG Animated Canvas Wave */
                        <div className="h-20 w-full relative overflow-hidden flex items-center">
                          <svg className="w-full h-full text-emerald-400 stroke-current fill-none" viewBox="0 0 800 100" preserveAspectRatio="none">
                            <path
                              d="M0 50 L100 50 L120 50 L130 20 L140 85 L150 10 L165 65 L180 50 L220 50 L240 35 L260 50 L350 50 L370 50 L380 20 L390 85 L400 10 L415 65 L430 50 L470 50 L490 35 L510 50 L600 50 L620 50 L630 20 L640 85 L650 10 L665 65 L680 50 L720 50 L740 35 L760 50 L800 50"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="animate-pulse"
                            />
                          </svg>
                          <div className="absolute right-3 top-2 text-[10px] font-mono text-emerald-400 flex items-center gap-1.5 bg-black/80 px-2 py-0.5 rounded border border-emerald-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                            Lead II • 25 mm/s • 10 mm/mV
                          </div>
                        </div>
                      ) : mediaConfig.theme === "respiratory" ? (
                        /* Ventilator Oscillating Pressure Wave */
                        <div className="h-20 w-full relative overflow-hidden flex items-center">
                          <svg className="w-full h-full text-cyan-400 stroke-current fill-none" viewBox="0 0 800 100" preserveAspectRatio="none">
                            <path
                              d="M0 80 Q50 15 150 20 T300 80 L350 80 Q400 15 500 20 T650 80 L700 80 Q750 15 800 20"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              className="animate-pulse"
                            />
                          </svg>
                          <div className="absolute right-3 top-2 text-[10px] font-mono text-cyan-400 flex items-center gap-1.5 bg-black/80 px-2 py-0.5 rounded border border-cyan-500/30">
                            Paw cmH2O • PEEP 14 • Vt 420 mL
                          </div>
                        </div>
                      ) : mediaConfig.theme === "dialysis" ? (
                        /* Dialysis Blood Flow Loop */
                        <div className="h-20 w-full relative overflow-hidden flex items-center justify-around px-4">
                          <div className="text-center font-mono">
                            <span className="text-[10px] text-slate-400 uppercase">Arterial Pressure</span>
                            <p className="text-sm font-bold text-red-400">-140 mmHg</p>
                          </div>
                          <div className="h-10 w-0.5 bg-white/20" />
                          <div className="text-center font-mono">
                            <span className="text-[10px] text-slate-400 uppercase">Blood Flow (Qb)</span>
                            <p className="text-sm font-bold text-emerald-400">350 mL/min</p>
                          </div>
                          <div className="h-10 w-0.5 bg-white/20" />
                          <div className="text-center font-mono">
                            <span className="text-[10px] text-slate-400 uppercase">Venous Pressure</span>
                            <p className="text-sm font-bold text-amber-400">+160 mmHg</p>
                          </div>
                        </div>
                      ) : (
                        /* Sterile / Clinical Checklist & Guide */
                        <div className="h-20 w-full relative overflow-hidden flex items-center justify-between px-3 text-xs">
                          <div className="space-y-1">
                            <p className="font-extrabold text-white flex items-center gap-1.5">
                              <HiOutlineShieldCheck className="h-4 w-4 text-emerald-400" />
                              {simData.procedureStep}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Adheres to NABH, CDC, and WHO Clinical Directives.
                            </p>
                          </div>
                          {course.id === "cme-clabsi-203" && (
                            <Button
                              size="sm"
                              onClick={startScrubTimer}
                              disabled={isScrubbing}
                              className="rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-slate-950 shrink-0"
                            >
                              {isScrubbing ? `Scrubbing... ${scrubSeconds}s` : "Start 15s Hub Scrub"}
                            </Button>
                          )}
                        </div>
                      )}

                      {/* Checklist bullets */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-white/10 text-[11px] text-slate-300">
                        {simData.checklist.slice(0, 4).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 truncate">
                            <HiCheckCircle className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Interactive Bedside Decision Trigger */}
                    <div className="space-y-2 border-t border-white/10 pt-3">
                      <p className="text-xs font-bold text-slate-200">
                        Bedside Clinical Decision: {simData.actionPrompt}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {simData.actionButtons.map((btn, bIdx) => (
                          <Button
                            key={bIdx}
                            size="sm"
                            variant="secondary"
                            onClick={() => {
                              setSimFeedback({ text: btn.feedback, isCorrect: btn.isCorrect });
                              if (btn.isCorrect) {
                                toast.success("Clinical Protocol Confirmed!", {
                                  description: btn.feedback,
                                });
                                if (activeLesson && !completedLessons.includes(activeLesson.id)) {
                                  toggleLessonComplete(activeLesson.id);
                                }
                              } else {
                                toast.error("Protocol Violation", {
                                  description: btn.feedback,
                                });
                              }
                            }}
                            className="rounded-xl font-semibold text-xs bg-white/10 hover:bg-white/20 text-white border border-white/15"
                          >
                            {btn.label}
                          </Button>
                        ))}
                      </div>

                      {/* Instant simulation feedback alert banner */}
                      {simFeedback && (
                        <div
                          className={cn(
                            "rounded-xl p-3 text-xs leading-relaxed border transition-all mt-2",
                            simFeedback.isCorrect
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                              : "bg-red-500/15 border-red-500/30 text-red-200"
                          )}
                        >
                          <strong>{simFeedback.isCorrect ? "✓ Guideline Adherence: " : "✕ Safety Warning: "}</strong>
                          {simFeedback.text}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* DYNAMIC HTML5 VIDEO PLAYER VIEWPORT */
                  <div
                    ref={playerContainerRef}
                    className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-border/80 bg-neutral-950 text-white shadow-lg w-full max-w-full min-w-0 aspect-video group"
                  >
                    <video
                      ref={videoRef}
                      src="/videos/hero-hands.mp4"
                      playsInline
                      preload="metadata"
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={handleVideoEnded}
                      onClick={togglePlay}
                      className="w-full h-full object-cover cursor-pointer"
                    />

                    {/* Top HUD overlay */}
                    <div className="absolute top-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/30 to-transparent flex items-center justify-between pointer-events-none z-10 text-[10px] sm:text-xs">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/90 text-white font-bold tracking-wider uppercase text-[10px] shadow-sm">
                          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                          <span>SIMULATION FEED</span>
                        </span>
                        <span className="font-semibold text-slate-200 truncate max-w-[200px] sm:max-w-none">
                          {activeLesson?.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          {course.accreditationBadge}
                        </span>
                        <span className="rounded-full bg-emerald-500/30 text-emerald-300 font-extrabold px-1.5 py-0.5 text-[9px] border border-emerald-400/40">
                          HD
                        </span>
                      </div>
                    </div>

                    {/* Center Big Play Button Overlay when Paused */}
                    {!isPlaying && (
                      <div
                        onClick={togglePlay}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] cursor-pointer transition-all z-10"
                      >
                        <div className="grid h-14 w-14 sm:h-18 sm:w-18 place-items-center rounded-3xl bg-primary text-white shadow-xl hover:scale-110 active:scale-95 transition-all">
                          <HiOutlinePlay className="h-8 w-8 sm:h-9 sm:w-9 ml-1" />
                        </div>
                        <p className="mt-3 text-xs sm:text-sm font-extrabold text-white tracking-wide drop-shadow">
                          Click to Play Clinical Lesson
                        </p>
                        <p className="text-[11px] text-slate-300 mt-0.5">
                          Faculty: {course.instructor.name} • {course.instructor.hospital}
                        </p>
                      </div>
                    )}

                    {/* Bottom Scrubber & Interactive Controls Bar */}
                    <div className="absolute bottom-0 inset-x-0 p-3 sm:p-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent z-20 space-y-2">
                      <div
                        onClick={handleSeek}
                        className="w-full h-2 bg-white/30 hover:h-2.5 rounded-full overflow-hidden cursor-pointer transition-all relative"
                      >
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-100"
                          style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-200">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={togglePlay}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-white"
                            title={isPlaying ? "Pause" : "Play"}
                          >
                            {isPlaying ? <HiOutlinePause className="h-5 w-5" /> : <HiOutlinePlay className="h-5 w-5" />}
                          </button>
                          <button
                            type="button"
                            onClick={toggleMute}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-white"
                            title={isMuted ? "Unmute" : "Mute"}
                          >
                            {isMuted ? (
                              <HiOutlineSpeakerXMark className="h-5 w-5 text-red-400" />
                            ) : (
                              <HiOutlineSpeakerWave className="h-5 w-5" />
                            )}
                          </button>
                          <span className="font-mono text-[11px] font-semibold text-slate-300">
                            {formatTime(currentTime)} / {formatTime(duration || 180)}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleSpeedChange}
                            className="rounded-lg bg-white/15 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-white/25 transition-all cursor-pointer"
                            title="Playback Speed"
                          >
                            {playbackSpeed}
                          </button>
                          <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="p-1.5 rounded-lg hover:bg-white/20 transition-colors cursor-pointer text-white"
                            title="Fullscreen"
                          >
                            <HiOutlineArrowsPointingOut className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lesson Context & Key Takeaways Card */}
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
                    <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                      <Button
                        size="sm"
                        variant={activeLesson && completedLessons.includes(activeLesson.id) ? "default" : "outline"}
                        onClick={() => activeLesson && toggleLessonComplete(activeLesson.id)}
                        className={cn(
                          "rounded-xl font-bold text-xs gap-1.5 shrink-0",
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleNextLesson}
                        className="rounded-xl font-bold text-xs gap-1.5 border-border/80 hover:bg-primary hover:text-white"
                      >
                        <span>Next Lesson</span>
                        <HiOutlineArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="text-xs sm:text-sm text-muted-foreground space-y-2 leading-relaxed">
                    <p>
                      {activeLesson?.contentPreview || course.summary}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-primary-soft/50 p-3.5 sm:p-4 border border-primary/15 space-y-1.5 sm:space-y-2">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wide flex items-center gap-1.5">
                      <HiOutlineSparkles className="h-4 w-4 shrink-0" /> Key Clinical Protocol ({course.category})
                    </h4>
                    <p className="text-xs font-medium text-foreground leading-relaxed break-words">
                      "{getCourseClinicalRule(course.id, course.category)}"
                    </p>
                  </div>
                </div>
              </div>

              {/* Sidebar: Course Content Navigator */}
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
                                setSimFeedback(null);
                                if (lesson.type === "quiz") {
                                  // stay in classroom to display dynamic in-classroom quiz
                                } else if (feedMode === "video" && videoRef.current) {
                                  videoRef.current.currentTime = 0;
                                  videoRef.current.play().then(() => setIsPlaying(true)).catch(console.error);
                                }
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
                            {mod.lessons.length} lessons • {mod.duration}
                          </p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pt-2 pb-4 space-y-2 border-t border-border/50">
                      {mod.lessons.map((lesson) => {
                        const isDone = completedLessons.includes(lesson.id);
                        return (
                          <div
                            key={lesson.id}
                            className="flex items-center justify-between p-3 rounded-xl bg-muted/40 text-xs gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {isDone ? (
                                <HiCheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                              ) : (
                                <HiOutlinePlay className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                              <span className="font-medium text-foreground truncate">{lesson.title}</span>
                              <span className="text-muted-foreground text-[10px] hidden sm:inline shrink-0">
                                ({lesson.duration})
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setActiveLesson(lesson);
                                  setActiveTab("classroom");
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

          {/* TAB 3: DYNAMIC CLINICAL CASE EVALUATION QUIZ */}
          <TabsContent value="case_simulation" className="space-y-6 mt-0 min-w-0">
            <div className="surface p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl border border-border/80 space-y-5 sm:space-y-6 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 border-b border-border/70 pb-4">
                <div>
                  <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-700 dark:text-amber-300">
                    Accredited CME Clinical Assessment
                  </span>
                  <h3 className="text-lg sm:text-xl font-black text-foreground mt-2 break-words">
                    {course.clinicalScenario.title}
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs font-bold">
                    Question {currentQuizIdx + 1} of {quizQuestions.length}
                  </Badge>
                  <span className="text-xs font-semibold text-muted-foreground">
                    Passing: 80% Adherence
                  </span>
                </div>
              </div>

              {/* Patient Scenario Card */}
              <div className="rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card to-amber-50/20 dark:to-amber-950/10 p-4 sm:p-5 space-y-4 min-w-0">
                <p className="text-xs sm:text-sm font-medium text-foreground leading-relaxed">
                  {course.clinicalScenario.caseDescription}
                </p>

                {/* Patient Vitals Strip */}
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
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Clinical Rhythm</p>
                    <p className="text-[11px] sm:text-xs font-extrabold text-foreground mt-1 truncate">{course.clinicalScenario.patientVitals.rhythm}</p>
                  </div>
                </div>
              </div>

              {/* Active Quiz Question */}
              {(() => {
                const activeQ = quizQuestions[currentQuizIdx] || quizQuestions[0];
                const selectedOptId = userQuizAnswers[activeQ.id];

                return (
                  <div className="space-y-4 min-w-0">
                    <h4 className="text-xs sm:text-sm md:text-base font-extrabold text-foreground flex items-start sm:items-center gap-2">
                      <HiOutlineQuestionMarkCircle className="h-5 w-5 text-primary shrink-0 mt-0.5 sm:mt-0" />
                      <span className="break-words">{activeQ.question}</span>
                    </h4>

                    {/* Options list */}
                    <div className="space-y-2.5 min-w-0">
                      {activeQ.options.map((opt) => {
                        const isSelected = selectedOptId === opt.id;
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
                            onClick={() => handleSelectQuizOption(activeQ.id, opt.id)}
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
                                    {opt.id.slice(-1).toUpperCase()}
                                  </span>
                                )}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs sm:text-sm font-semibold leading-relaxed break-words">{opt.text}</p>
                                {quizSubmitted && (
                                  <p className="text-xs mt-2 pt-2 border-t border-border/50 text-foreground/85 leading-relaxed font-normal break-words">
                                    <strong>Evidence-Based Rationale:</strong> {opt.explanation}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Question navigation controls */}
                    {quizQuestions.length > 1 && (
                      <div className="flex items-center justify-between pt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentQuizIdx === 0}
                          onClick={() => setCurrentQuizIdx((p) => Math.max(0, p - 1))}
                          className="rounded-xl text-xs"
                        >
                          Previous Question
                        </Button>
                        <div className="flex items-center gap-1.5">
                          {quizQuestions.map((_, qIdx) => (
                            <button
                              key={qIdx}
                              type="button"
                              onClick={() => setCurrentQuizIdx(qIdx)}
                              className={cn(
                                "h-2 w-6 rounded-full transition-all",
                                qIdx === currentQuizIdx
                                  ? "bg-primary w-8"
                                  : userQuizAnswers[quizQuestions[qIdx].id]
                                  ? "bg-emerald-500"
                                  : "bg-muted"
                              )}
                            />
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={currentQuizIdx === quizQuestions.length - 1}
                          onClick={() => setCurrentQuizIdx((p) => Math.min(quizQuestions.length - 1, p + 1))}
                          className="rounded-xl text-xs"
                        >
                          Next Question
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Action Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/70">
                {!quizSubmitted ? (
                  <Button
                    onClick={handleQuizSubmit}
                    className="rounded-xl font-bold bg-primary text-primary-foreground shadow-xs hover:bg-primary/95 px-5 sm:px-6 text-xs h-9 w-full sm:w-auto"
                  >
                    Submit Clinical Evaluation
                  </Button>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      onClick={resetQuiz}
                      className="rounded-xl font-bold text-xs gap-1.5 h-9"
                    >
                      <HiOutlineArrowPath className="h-4 w-4" /> Retry Assessment
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
