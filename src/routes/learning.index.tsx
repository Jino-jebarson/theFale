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
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell, PageHead } from "@/components/fale/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { courses, type Course } from "@/lib/data";
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
      <PageHead
        title="Learning"
        sub="Certified clinical courses, emergency simulations, and accredited CME credentials."
      />

      {/* Mode Switcher & Search Bar */}
      <div className="space-y-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Catalog vs My Learning Toggle */}
          <div className="inline-flex rounded-2xl bg-muted p-1 border border-border/70">
            <button
              type="button"
              onClick={() => setViewMode("catalog")}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-bold transition-all",
                viewMode === "catalog"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Explore Catalog ({courses.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode("my-learning")}
              className={cn(
                "rounded-xl px-4 py-2 text-xs font-bold transition-all flex items-center gap-1.5",
                viewMode === "my-learning"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              My Learning
              {enrolledCourses.length > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.2 text-[10px] font-black text-white">
                  {enrolledCourses.length}
                </span>
              )}
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-80">
            <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search courses, skills, or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-2xl border-border/80 text-xs bg-card"
            />
          </div>
        </div>

        {/* Category Pills (Catalog view only) */}
        {viewMode === "catalog" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap transition-all border",
                  selectedCategory === cat
                    ? "bg-primary text-primary-foreground border-primary shadow-2xs font-bold"
                    : "bg-card text-muted-foreground border-border/70 hover:bg-muted/50 hover:text-foreground"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Content Rendering: MY LEARNING VIEW */}
      {viewMode === "my-learning" && (
        <div className="space-y-6">
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
                className="rounded-xl font-bold text-xs bg-primary text-primary-foreground"
              >
                Browse Catalog
              </Button>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {enrolledCourses.map((c) => {
                const totalLessons = c.modules.flatMap((m) => m.lessons).length;
                const completedCount = 1; // default initial demo progress
                const percent = Math.round((completedCount / totalLessons) * 100);

                return (
                  <div
                    key={c.id}
                    className="surface p-5 rounded-3xl border border-border/80 flex flex-col justify-between space-y-4 hover:border-primary/40 transition-all shadow-xs"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-primary/10 text-primary border-0 font-bold text-[11px] px-2.5 py-0.5">
                          {c.category}
                        </Badge>
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <HiCheckCircle className="h-3.5 w-3.5" /> Enrolled
                        </span>
                      </div>

                      <Link to="/learning/$id" params={{ id: c.id }}>
                        <h3 className="font-extrabold text-base text-foreground leading-snug line-clamp-2 hover:text-primary transition-colors">
                          {c.title}
                        </h3>
                      </Link>

                      <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                        {c.summary}
                      </p>

                      {/* Progress Bar */}
                      <div className="space-y-1.5 pt-2">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="text-primary">{percent}%</span>
                        </div>
                        <Progress value={percent} className="h-1.5 rounded-full" />
                        <p className="text-[10px] text-muted-foreground">
                          {completedCount} of {totalLessons} lessons finished
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/70 flex items-center gap-2">
                      <Button
                        asChild
                        className="w-full rounded-xl font-bold text-xs bg-primary text-primary-foreground shadow-xs gap-1.5"
                      >
                        <Link to="/learning/$id" params={{ id: c.id }}>
                          <HiOutlinePlay className="h-3.5 w-3.5" /> Continue Lesson
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

      {/* Content Rendering: CATALOG VIEW */}
      {viewMode === "catalog" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-foreground">
              {selectedCategory === "All Specialties" ? "All Clinical Modules" : selectedCategory}
              <span className="ml-2 text-xs font-semibold text-muted-foreground">
                ({filteredCourses.length} available)
              </span>
            </h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredCourses.map((c) => {
              const isEnrolled = s.courses.includes(c.id);

              return (
                <div
                  key={c.id}
                  className="surface rounded-3xl border border-border/80 flex flex-col justify-between overflow-hidden transition-all duration-200 hover:shadow-md hover:border-primary/50 group"
                >
                  {/* Card Header Bar */}
                  <div className="bg-gradient-to-r from-muted/50 to-muted/20 p-5 border-b border-border/70 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
                        {c.category}
                      </span>
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
                        {c.accreditationBadge}
                      </span>
                    </div>

                    <Link to="/learning/$id" params={{ id: c.id }}>
                      <h3 className="font-extrabold text-base text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                        {c.title}
                      </h3>
                    </Link>

                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <HiOutlineAcademicCap className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span>{c.instructor.name} • {c.instructor.hospital.split(",")[0]}</span>
                    </p>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      {c.summary}
                    </p>

                    {/* Skill Tags */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {c.skillsGained.slice(0, 3).map((sk, idx) => (
                        <span
                          key={idx}
                          className="rounded-lg bg-muted px-2 py-0.5 text-[10px] font-medium text-foreground border border-border/50"
                        >
                          {sk}
                        </span>
                      ))}
                      {c.skillsGained.length > 3 && (
                        <span className="rounded-lg bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          +{c.skillsGained.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Meta Info Strip */}
                    <div className="grid grid-cols-3 gap-2 border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <HiOutlineClock className="h-3.5 w-3.5 text-primary" />
                        <span>{c.duration}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <HiStar className="h-3.5 w-3.5 text-amber-500" />
                        <span className="font-bold text-foreground">{c.rating}</span>
                      </div>
                      <div className="text-right font-medium">
                        <span>{c.level}</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="p-5 pt-0 grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleQuickEnroll(c.id, c.title)}
                      className={cn(
                        "rounded-xl font-bold text-xs h-9",
                        isEnrolled
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
                          : "border-border/80"
                      )}
                    >
                      {isEnrolled ? (
                        <span className="flex items-center gap-1">
                          <HiCheckCircle className="h-3.5 w-3.5" /> Enrolled
                        </span>
                      ) : (
                        "Quick Enroll"
                      )}
                    </Button>

                    <Button
                      size="sm"
                      asChild
                      className="rounded-xl font-bold text-xs h-9 bg-primary text-primary-foreground shadow-xs hover:bg-primary/95"
                    >
                      <Link to="/learning/$id" params={{ id: c.id }}>
                        View Details <HiOutlineArrowRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </AppShell>
  );
}
