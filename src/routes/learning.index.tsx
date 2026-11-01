import { useState, useMemo } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlineAcademicCap,
  HiOutlineClock,
  HiCheckCircle,
  HiOutlineMagnifyingGlass,
  HiStar,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiOutlineArrowRight,
  HiOutlineBookOpen,
  HiOutlineUserGroup,
  HiOutlineCheckBadge,
  HiOutlinePlay,
  HiOutlineXMark,
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell } from "@/components/fale/AppShell";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { courses } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

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
  "Quality & NABH",
  "Nursing Essentials",
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

  // Filtered courses based on search and category
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.skillsGained.some((sk) => sk.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === "All Specialties" || c.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const enrolledCourses = useMemo(() => {
    return courses.filter((c) => s.courses.includes(c.id));
  }, [s.courses]);

  const handleQuickEnroll = (courseId: string, courseTitle: string) => {
    if (s.courses.includes(courseId)) {
      setState((x) => ({ courses: x.courses.filter((id) => id !== courseId) }));
      toast.info("Unenrolled from course", { description: courseTitle });
    } else {
      setState((x) => ({ courses: [...x.courses, courseId] }));
      toast.success("Enrolled successfully!", {
        description: `You are now enrolled in ${courseTitle}. Access lessons anytime.`,
      });
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
                <HiOutlineSparkles className="h-3.5 w-3.5" />
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
                      {courses.length}
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
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "rounded-full px-3.5 py-1.5 text-xs font-bold whitespace-nowrap transition-all border cursor-pointer select-none",
                      selectedCategory === cat
                        ? "bg-primary text-white border-primary shadow-xs font-bold"
                        : "bg-muted/40 text-muted-foreground border-border/70 hover:bg-muted/70 hover:text-foreground"
                    )}
                  >
                    {cat}
                  </button>
                ))}
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
                  const completedCount = 1; // default initial demo progress
                  const percent = Math.round((completedCount / totalLessons) * 100);

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
          </div>
        )}
      </div>
    </AppShell>
  );
}
