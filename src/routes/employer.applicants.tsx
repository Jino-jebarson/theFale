import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  HiOutlineShieldCheck,
  HiOutlineMapPin,
  HiOutlineMagnifyingGlass,
  HiOutlineDocumentText,
  HiOutlineArrowDownTray,
  HiOutlineAcademicCap,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineBuildingOffice2,
  HiOutlineCalendarDays,
  HiCheck,
  HiXMark,
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell, StatusBadge, initials } from "@/components/fale/AppShell";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { applicants, type Applicant } from "@/lib/data";
import { LottieAnimation } from "@/components/fale/LottieAnimation";
import lottieEmptyAnimation from "@/assets/lottie-error.json";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employer/applicants")({
  head: () => ({
    meta: [
      { title: "Applicants — FALE" },
      {
        name: "description",
        content:
          "Review verified healthcare professionals who applied to your roles.",
      },
      { property: "og:title", content: "Applicants — FALE" },
      {
        property: "og:description",
        content: "Review verified healthcare applicants.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Applicants,
});

function Applicants() {
  const [filter, setFilter] = useState("All");
  const [selectedRole, setSelectedRole] = useState("All");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<Record<string, string>>({});
  const [selectedResume, setSelectedResume] = useState<Applicant | null>(null);

  // Merge live status overrides with applicant records
  const allApplicants = useMemo(() => {
    return applicants.map((a) => ({
      ...a,
      status: status[a.id] ?? a.status,
    }));
  }, [status]);

  // Unique roles for custom Select
  const roles = useMemo(() => {
    const set = new Set(allApplicants.map((a) => a.role));
    return ["All", ...Array.from(set)];
  }, [allApplicants]);

  // Counts by stage
  const counts = useMemo(() => {
    return {
      All: allApplicants.length,
      New: allApplicants.filter((a) => a.status === "New").length,
      Shortlisted: allApplicants.filter((a) => a.status === "Shortlisted").length,
      Interview: allApplicants.filter((a) => a.status === "Interview").length,
    };
  }, [allApplicants]);

  // Filtered candidate list
  const filteredList = useMemo(() => {
    return allApplicants.filter((a) => {
      if (filter !== "All" && a.status !== filter) return false;
      if (selectedRole !== "All" && a.role !== selectedRole) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = a.name.toLowerCase().includes(q);
        const matchRole = a.role.toLowerCase().includes(q);
        const matchCity = a.city.toLowerCase().includes(q);
        const matchFor = a.for.toLowerCase().includes(q);
        const matchSkills = a.skills?.some((s) => s.toLowerCase().includes(q));
        if (!matchName && !matchRole && !matchCity && !matchFor && !matchSkills) {
          return false;
        }
      }
      return true;
    });
  }, [allApplicants, filter, selectedRole, search]);

  const handleShortlist = (app: Applicant) => {
    setStatus((prev) => ({ ...prev, [app.id]: "Shortlisted" }));
    toast.success(`${app.name} shortlisted`, {
      description: "Candidate moved to shortlisted candidates.",
    });
  };

  const handleInvite = (app: Applicant) => {
    setStatus((prev) => ({ ...prev, [app.id]: "Interview" }));
    toast.success(`Interview invite sent to ${app.name}`, {
      description: "Candidate has been notified for interview scheduling.",
    });
  };

  const handleDownloadPDF = (name: string) => {
    toast.success(`Downloading resume for ${name}…`, {
      description: "Verified clinical credentials & registration report included.",
    });
  };

  return (
    <AppShell>
      <div className="w-full min-w-0 space-y-6">
        {/* Clean Executive Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            Meet your next team member.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review verified profiles and move hiring forward.
          </p>
        </div>

        {/* Clean Filter & Search Bar */}
        <div className="sticky top-[var(--header-offset,4rem)] z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2.5 pb-2.5 mb-4 sm:mb-6 bg-background/95 backdrop-blur-md transition-all duration-300 ease-in-out">
          <div className="surface rounded-2xl border border-border bg-card p-3 sm:p-3.5 shadow-xs flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {/* Status Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {(["All", "New", "Shortlisted", "Interview"] as const).map((f) => {
                const active = filter === f;
                const count = counts[f];
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-all cursor-pointer shrink-0",
                      active
                        ? "bg-primary text-primary-foreground shadow-xs"
                        : "border border-input bg-card text-muted-foreground hover:border-ring hover:text-foreground"
                    )}
                  >
                    <span>{f}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                        active
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search + Custom Select */}
            <div className="flex items-center gap-2.5">
              <div className="relative flex-1 sm:w-64">
                <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search candidates…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-9 w-full rounded-xl border border-input bg-card pl-9 pr-7 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  >
                    <HiXMark className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Custom Select Component */}
              <div className="w-44 sm:w-48 shrink-0">
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="h-9 rounded-xl border-input bg-card text-xs font-medium">
                    <SelectValue placeholder="All Roles" />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {roles.map((r) => (
                      <SelectItem key={r} value={r} className="text-xs">
                        {r === "All" ? "All Roles" : r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Candidate Cards Grid */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredList.map((a) => (
            <div
              key={a.id}
              className="flex flex-col justify-between rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs hover:border-border/80 transition-shadow"
            >
              <div>
                {/* Top Row: Avatar, Info, Status Badge */}
                <div className="flex items-start gap-3.5">
                  <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-primary-foreground shadow-2xs">
                    {initials(a.name)}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <h2 className="text-base font-bold text-foreground leading-snug truncate">
                        {a.name}
                      </h2>
                      {a.verified && (
                        <HiOutlineShieldCheck
                          className="h-4 w-4 text-primary shrink-0"
                          title="Verified profile"
                        />
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground font-medium truncate">
                      {a.role} · {a.exp}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground truncate">
                      <HiOutlineMapPin className="h-3.5 w-3.5 shrink-0" />
                      <span>
                        {a.city} · Applied for {a.for}
                      </span>
                    </p>
                  </div>

                  <div className="shrink-0">
                    <StatusBadge status={a.status} />
                  </div>
                </div>

                {/* Key Skill Chips */}
                {a.skills && a.skills.length > 0 && (
                  <div className="mt-3.5 flex flex-wrap gap-1.5">
                    {a.skills.slice(0, 3).map((s) => (
                      <span
                        key={s}
                        className="rounded-lg bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons: View Resume + Stage Actions */}
              <div className="mt-5 pt-3.5 border-t border-border/70 flex flex-wrap items-center justify-between gap-2">
                {/* Option to see the resume */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedResume(a)}
                  className="rounded-xl text-xs font-semibold gap-1.5 border-input hover:border-ring text-foreground shadow-2xs cursor-pointer"
                >
                  <HiOutlineDocumentText className="h-4 w-4 text-primary" /> View resume
                </Button>

                <div className="flex items-center gap-2">
                  {a.status === "New" && (
                    <>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleShortlist(a)}
                        className="rounded-xl text-xs font-semibold"
                      >
                        Shortlist
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleInvite(a)}
                        className="rounded-xl text-xs font-semibold shadow-xs"
                      >
                        Invite to interview
                      </Button>
                    </>
                  )}

                  {a.status === "Shortlisted" && (
                    <>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary px-1.5">
                        <HiCheck className="h-3.5 w-3.5 stroke-[3]" /> Shortlisted
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleInvite(a)}
                        className="rounded-xl text-xs font-semibold shadow-xs"
                      >
                        Invite to interview
                      </Button>
                    </>
                  )}

                  {a.status === "Interview" && (
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary px-1.5">
                      <HiCheck className="h-3.5 w-3.5 stroke-[3]" /> Interview Scheduled
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State with Lottie Animation */}
        {filteredList.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 sm:p-12 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto mb-3 w-44 sm:w-52 overflow-hidden flex items-center justify-center">
              <LottieAnimation
                animationData={lottieEmptyAnimation}
                loop={true}
                className="w-full h-auto"
              />
            </div>
            <h3 className="text-base font-bold text-foreground">No applicants found</h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              Try changing your search keywords or filter selection.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setFilter("All");
                setSelectedRole("All");
                setSearch("");
              }}
              className="mt-4 rounded-xl text-xs font-semibold shadow-2xs hover:bg-muted"
            >
              Reset filters
            </Button>
          </div>
        )}
      </div>

      {/* Professional Resume Modal Dialog */}
      <Dialog
        open={!!selectedResume}
        onOpenChange={(open) => !open && setSelectedResume(null)}
      >
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-0">
          {selectedResume && (
            <div className="flex flex-col">
              {/* Resume Header / Top Toolbar */}
              <div className="border-b border-border bg-muted/30 p-6">
                <DialogHeader className="text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <DialogTitle className="text-xl font-bold text-foreground">
                          {selectedResume.name}
                        </DialogTitle>
                        {selectedResume.verified && (
                          <HiOutlineShieldCheck
                            className="h-5 w-5 text-primary"
                            title="Verified Clinical Candidate"
                          />
                        )}
                        <span className="rounded-full bg-primary-soft text-primary px-2.5 py-0.5 text-xs font-bold">
                          {selectedResume.role}
                        </span>
                      </div>
                      <DialogDescription className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                        <span className="flex items-center gap-1">
                          <HiOutlineMapPin className="h-3.5 w-3.5" />
                          {selectedResume.city}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <HiOutlinePhone className="h-3.5 w-3.5" />
                          {selectedResume.phone}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <HiOutlineEnvelope className="h-3.5 w-3.5" />
                          {selectedResume.email}
                        </span>
                      </DialogDescription>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDownloadPDF(selectedResume.name)}
                      className="rounded-xl text-xs font-semibold gap-1.5 shrink-0"
                    >
                      <HiOutlineArrowDownTray className="h-4 w-4" /> Download PDF
                    </Button>
                  </div>
                </DialogHeader>

                {/* Council Verification Pill */}
                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-card border border-border p-3 text-xs">
                  <span className="text-muted-foreground font-medium">Council Registration:</span>
                  <span className="font-mono font-bold text-foreground">{selectedResume.regNumber}</span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <HiCheck className="h-3.5 w-3.5 stroke-[3]" /> FALE Credential Verified
                  </span>
                </div>
              </div>

              {/* Resume Body */}
              <div className="p-6 space-y-5 text-sm">
                {/* Summary */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Professional Summary
                  </h3>
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed bg-muted/20 p-3.5 rounded-xl border border-border/60">
                    {selectedResume.bio}
                  </p>
                </div>

                {/* Clinical Work Experience */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Clinical Work Experience
                  </h3>
                  <div className="space-y-3">
                    {selectedResume.experienceList?.map((exp, idx) => (
                      <div
                        key={idx}
                        className="relative pl-4 border-l-2 border-primary/50 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between font-bold text-foreground">
                          <span className="text-sm">{exp.role}</span>
                          <span className="text-[11px] font-normal text-muted-foreground">
                            {exp.duration}
                          </span>
                        </div>
                        <p className="font-semibold text-primary text-xs flex items-center gap-1">
                          <HiOutlineBuildingOffice2 className="h-3.5 w-3.5" />
                          {exp.hospital}
                        </p>
                        <p className="text-muted-foreground text-xs leading-relaxed pt-0.5">
                          {exp.details}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Skills & Competencies */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Clinical Skills & Competencies
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedResume.skills?.map((sk) => (
                      <span
                        key={sk}
                        className="rounded-lg bg-primary-soft text-primary border border-primary/20 px-2.5 py-1 text-xs font-semibold"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Education & Certifications */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Education & Credentials
                  </h3>
                  <div className="rounded-xl border border-border p-3.5 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <HiOutlineAcademicCap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">{selectedResume.education}</p>
                        <p className="text-muted-foreground">{selectedResume.qualification}</p>
                      </div>
                    </div>
                    {selectedResume.certifications && (
                      <div className="pt-2 border-t border-border flex flex-wrap gap-1.5">
                        {selectedResume.certifications.map((c) => (
                          <span
                            key={c}
                            className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground"
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Resume Footer with Direct Stage Actions */}
              <div className="border-t border-border bg-muted/20 p-4 flex items-center justify-between gap-3">
                <div className="text-xs">
                  <span className="text-muted-foreground text-[10px] block">Current Status</span>
                  <StatusBadge status={status[selectedResume.id] ?? selectedResume.status} />
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      handleShortlist(selectedResume);
                      setSelectedResume(null);
                    }}
                    className="rounded-xl text-xs font-semibold"
                  >
                    Shortlist
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      handleInvite(selectedResume);
                      setSelectedResume(null);
                    }}
                    className="rounded-xl text-xs font-semibold shadow-xs"
                  >
                    Invite to interview
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
