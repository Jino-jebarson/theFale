import { useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  HiOutlineShieldCheck,
  HiOutlineMapPin,
  HiOutlineMagnifyingGlass,
  HiOutlineLockClosed,
  HiOutlineLockOpen,
  HiOutlinePhone,
  HiOutlineEnvelope,
  HiOutlineSparkles,
  HiOutlineCheckBadge,
  HiOutlineDocumentText,
  HiOutlineArrowDownTray,
  HiOutlineBuildingOffice2,
  HiOutlineAcademicCap,
  HiOutlineUser,
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
import { LottieAnimation } from "@/components/fale/LottieAnimation";
import lottieEmptyAnimation from "@/assets/lottie-error.json";
import { applicants, type Applicant } from "@/lib/data";
import { useApp, setState } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/employer/candidates")({
  head: () => ({
    meta: [
      { title: "Find Candidates — FALE Talent Resdex" },
      {
        name: "description",
        content:
          "Search verified healthcare talent across India. Unlock candidate contact details with credits.",
      },
      { property: "og:title", content: "Find Candidates — FALE Talent Resdex" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FindCandidates,
});

// Credit pricing packages
const creditPackages = [
  {
    id: "pkg_10",
    name: "Starter",
    credits: 10,
    price: "₹4,999",
    perCredit: "₹499 / unlock",
    popular: false,
    desc: "Ideal for filling urgent single-department roles.",
    features: [
      "10 Verified Contact Unlocks",
      "Full Registration Dossier",
      "Valid for 60 Days",
      "Direct Phone & Email Access",
    ],
  },
  {
    id: "pkg_30",
    name: "Growth",
    credits: 30,
    price: "₹11,999",
    perCredit: "₹399 / unlock",
    popular: true,
    desc: "Best for hospitals with active departmental hiring.",
    features: [
      "30 Verified Contact Unlocks",
      "Save 20% per unlock",
      "Direct WhatsApp Outreach Access",
      "Valid for 90 Days",
      "100% Wrong Number Credit Refund",
    ],
  },
  {
    id: "pkg_100",
    name: "Enterprise",
    credits: 100,
    price: "₹29,999",
    perCredit: "₹299 / unlock",
    popular: false,
    desc: "For hospital chains & institutions with volume hiring.",
    features: [
      "100 Verified Contact Unlocks",
      "Save 40% per unlock",
      "Dedicated Account Manager",
      "Valid for 365 Days",
      "Custom GST Invoice & Priority Support",
    ],
  },
];

function maskPhone() {
  return "+91 ••••• •••••";
}

function maskEmail() {
  return "••••••••@••••••.com";
}

function maskReg() {
  return "Reg #••••••••";
}

function maskName() {
  return "••••••••••••";
}

function maskHospital() {
  return "•••••••••••• Hospital";
}

function CoinIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("inline-block shrink-0", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" fill="#F59E0B" stroke="#D97706" strokeWidth="1" />
      <circle cx="12" cy="12" r="7.5" fill="#FBBF24" stroke="#F59E0B" strokeWidth="0.8" />
      <circle cx="12" cy="12" r="6" fill="#FDE68A" />
      <text
        x="12"
        y="15.5"
        textAnchor="middle"
        fill="#78350F"
        fontSize="11"
        fontWeight="800"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      >
        ₹
      </text>
    </svg>
  );
}

function FindCandidates() {
  const store = useApp();
  const credits = store.candidateCredits ?? 3;
  const unlockedIds = store.unlockedCandidates ?? [];

  const [search, setSearch] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedCity, setSelectedCity] = useState("All");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  // Dialogs state
  const [candidateToUnlock, setCandidateToUnlock] = useState<Applicant | null>(null);
  const [buyCreditsOpen, setBuyCreditsOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(creditPackages[1]);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [viewResumeApplicant, setViewResumeApplicant] = useState<Applicant | null>(null);

  // Available unique roles and cities for custom select
  const roles = useMemo(() => {
    const set = new Set(applicants.map((a) => a.role));
    return ["All", ...Array.from(set)];
  }, []);

  const cities = useMemo(() => {
    const set = new Set(applicants.map((a) => a.city));
    return ["All", ...Array.from(set)];
  }, []);

  // Filtered candidate list
  const filteredCandidates = useMemo(() => {
    return applicants.filter((a) => {
      if (selectedRole !== "All" && a.role !== selectedRole) return false;
      if (selectedCity !== "All" && a.city !== selectedCity) return false;
      if (verifiedOnly && !a.verified) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchName = a.name.toLowerCase().includes(q);
        const matchRole = a.role.toLowerCase().includes(q);
        const matchCity = a.city.toLowerCase().includes(q);
        const matchOrg = a.currentOrg?.toLowerCase().includes(q);
        const matchSkills = a.skills?.some((s) => s.toLowerCase().includes(q));
        if (!matchName && !matchRole && !matchCity && !matchOrg && !matchSkills) {
          return false;
        }
      }
      return true;
    });
  }, [selectedRole, selectedCity, verifiedOnly, search]);

  const handleUnlockClick = (app: Applicant) => {
    if (credits < 1) {
      toast.error("No credits available", {
        description: "Choose a credit package to unlock candidate contact details.",
      });
      setBuyCreditsOpen(true);
      return;
    }
    setCandidateToUnlock(app);
  };

  const handleConfirmUnlock = () => {
    if (!candidateToUnlock) return;
    if (credits < 1) {
      setCandidateToUnlock(null);
      setBuyCreditsOpen(true);
      return;
    }

    // Deduct 1 credit and save unlocked candidate id
    setState((s) => ({
      candidateCredits: Math.max(0, (s.candidateCredits ?? 3) - 1),
      unlockedCandidates: Array.from(new Set([...(s.unlockedCandidates ?? []), candidateToUnlock.id])),
    }));

    toast.success(`Contact details unlocked for ${candidateToUnlock.name}`, {
      description: `Phone: ${candidateToUnlock.phone} · Email: ${candidateToUnlock.email}`,
    });

    setCandidateToUnlock(null);
  };

  const handleBuyCredits = () => {
    if (!selectedPackage) return;
    setIsProcessingPayment(true);

    setTimeout(() => {
      setIsProcessingPayment(false);
      setState((s) => ({
        candidateCredits: (s.candidateCredits ?? 0) + selectedPackage.credits,
      }));
      setBuyCreditsOpen(false);
      toast.success(`${selectedPackage.credits} Credits added successfully`, {
        description: `Your balance is now ${(credits ?? 0) + selectedPackage.credits} credits.`,
      });
    }, 600);
  };

  return (
    <AppShell>
      <div className="w-full min-w-0 space-y-6">
        {/* Clean Executive Header with Consistent Typography Hierarchy */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Find candidates
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Search verified healthcare talent and unlock direct contact information.
            </p>
          </div>

          {/* Credit Balance & Buy Action */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-card px-3.5 text-xs font-medium text-muted-foreground shadow-xs whitespace-nowrap">
              <span>Available balance:</span>
              <span className="font-bold text-foreground inline-flex items-center gap-1.5">
                <CoinIcon className="h-4 w-4" />
                <span>{credits} {credits === 1 ? "credit" : "credits"}</span>
              </span>
            </div>

            <Button
              onClick={() => setBuyCreditsOpen(true)}
              className="h-10 gap-1.5 rounded-xl px-4 text-xs font-semibold shadow-xs whitespace-nowrap cursor-pointer"
            >
              <HiOutlineSparkles className="h-4 w-4" />
              <span>Buy credits</span>
            </Button>
          </div>
        </div>

        {/* Clean Filter Toolbar with Perfect Alignment */}
        <div className="sticky top-[var(--header-offset,4rem)] z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-2.5 pb-2.5 mb-4 sm:mb-6 bg-background/95 backdrop-blur-md transition-all duration-300 ease-in-out">
          <div className="rounded-2xl border border-border bg-card p-3.5 sm:p-4 shadow-xs space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {/* Search Input */}
              <div className="relative flex-1">
                <HiOutlineMagnifyingGlass className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by candidate name, skill (ICU, OT, Dialysis), or hospital…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 w-full rounded-xl border border-input bg-card pl-10 pr-8 text-xs text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-ring/20 transition-all"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5 cursor-pointer"
                  >
                    <HiXMark className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Filter Controls: Custom Selects & Verified Toggle */}
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Role Select */}
                <div className="w-36 shrink-0">
                  <Select value={selectedRole} onValueChange={setSelectedRole}>
                    <SelectTrigger className="h-10 rounded-xl border-input bg-card text-xs font-medium">
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

                {/* City Select */}
                <div className="w-32 shrink-0">
                  <Select value={selectedCity} onValueChange={setSelectedCity}>
                    <SelectTrigger className="h-10 rounded-xl border-input bg-card text-xs font-medium">
                      <SelectValue placeholder="All Cities" />
                    </SelectTrigger>
                    <SelectContent align="end">
                      {cities.map((c) => (
                        <SelectItem key={c} value={c} className="text-xs">
                          {c === "All" ? "All Cities" : c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Verified Only Filter */}
                <button
                  type="button"
                  onClick={() => setVerifiedOnly((v) => !v)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-xl border px-3 h-10 text-xs font-semibold transition-all shrink-0 cursor-pointer",
                    verifiedOnly
                      ? "border-primary bg-primary text-primary-foreground shadow-xs"
                      : "border-input bg-card text-muted-foreground hover:border-ring hover:text-foreground"
                  )}
                >
                  <HiOutlineShieldCheck className="h-4 w-4" />
                  Verified
                  {verifiedOnly && <HiCheck className="h-3 w-3 stroke-[3]" />}
                </button>
              </div>
            </div>

            {/* Results Count Line */}
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/60">
              <span>
                Showing <strong className="text-foreground">{filteredCandidates.length}</strong> candidates
                {selectedRole !== "All" && ` · ${selectedRole}`}
                {selectedCity !== "All" && ` · ${selectedCity}`}
              </span>

              {(selectedRole !== "All" || selectedCity !== "All" || verifiedOnly || search) && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRole("All");
                    setSelectedCity("All");
                    setVerifiedOnly(false);
                    setSearch("");
                  }}
                  className="font-semibold text-primary hover:underline cursor-pointer"
                >
                  Reset filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Candidate Cards Grid with Proper Alignment & Hierarchy */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filteredCandidates.map((a) => {
            const isUnlocked = unlockedIds.includes(a.id);
            const displayName = isUnlocked ? a.name : maskName();
            const displayPhone = isUnlocked ? a.phone : maskPhone();
            const displayEmail = isUnlocked ? a.email : maskEmail();
            const displayReg = isUnlocked ? a.regNumber : maskReg();
            const displayHospital = isUnlocked ? a.currentOrg : maskHospital();

            return (
              <div
                key={a.id}
                className={cn(
                  "flex flex-col justify-between rounded-2xl border bg-card p-5 sm:p-6 shadow-xs transition-all",
                  isUnlocked ? "border-primary/40 ring-1 ring-primary/20 shadow-sm" : "border-border hover:border-border/80"
                )}
              >
                <div>
                  {/* Card Header: Avatar, Name/Title, Match Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3.5 min-w-0">
                      {isUnlocked ? (
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-primary-foreground shadow-2xs">
                          {initials(a.name)}
                        </span>
                      ) : (
                        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground shadow-2xs border border-border">
                          <HiOutlineUser className="h-6 w-6 text-muted-foreground/70" />
                        </span>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <h2 className="text-base font-bold text-foreground leading-snug truncate">
                            {isUnlocked ? a.name : a.role}
                          </h2>
                          {a.verified && (
                            <HiOutlineShieldCheck
                              className="h-4 w-4 text-primary shrink-0"
                              title="Verified healthcare professional"
                            />
                          )}
                        </div>

                        {isUnlocked ? (
                          <p className="mt-0.5 text-xs text-muted-foreground font-medium truncate">
                            {a.role} · {a.exp} experience
                          </p>
                        ) : (
                          <p className="mt-0.5 text-xs text-muted-foreground font-medium flex items-center gap-1.5 truncate">
                            <span className="text-muted-foreground/70">Candidate:</span>
                            <span className="font-mono tracking-wider select-none text-muted-foreground">{displayName}</span>
                            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">Masked</span>
                          </p>
                        )}

                        <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                          <HiOutlineBuildingOffice2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground/80" />
                          <span className={cn(isUnlocked ? "font-medium text-foreground" : "font-mono select-none text-muted-foreground/70")}>
                            {displayHospital}
                          </span>
                          <span>·</span>
                          <HiOutlineMapPin className="h-3.5 w-3.5 shrink-0" />
                          <span>{a.city}</span>
                          <span>·</span>
                          <span>{a.exp}</span>
                        </p>
                      </div>
                    </div>

                    {/* Right: Match score & lock state */}
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <HiOutlineSparkles className="h-3 w-3" />
                        {a.match}% Match
                      </span>
                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
                          <HiOutlineLockOpen className="h-3.5 w-3.5" /> Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
                          <HiOutlineLockClosed className="h-3.5 w-3.5" /> Masked
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Skills Tags */}
                  {a.skills && (
                    <div className="mt-3.5 flex flex-wrap gap-1.5">
                      {a.skills.slice(0, 4).map((s) => (
                        <span
                          key={s}
                          className="rounded-lg bg-muted/60 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Contact Information Box (Masked vs Unlocked) */}
                  <div
                    className={cn(
                      "mt-4 rounded-xl p-3.5 text-xs transition-colors border",
                      isUnlocked
                        ? "bg-primary-soft/30 border-primary/20 text-foreground"
                        : "bg-muted/40 border-border text-muted-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        {isUnlocked ? (
                          <>
                            <HiOutlineLockOpen className="h-3.5 w-3.5 text-primary" />
                            <span className="text-primary font-bold">✓ Verified Contact Details</span>
                          </>
                        ) : (
                          <>
                            <HiOutlineLockClosed className="h-3.5 w-3.5 text-muted-foreground" />
                            <span>Contact Details (Masked)</span>
                          </>
                        )}
                      </span>
                      <span className="font-mono text-[11px] font-medium text-muted-foreground/80">{displayReg}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="flex items-center gap-1.5">
                        <HiOutlinePhone className={cn("h-3.5 w-3.5 shrink-0", isUnlocked ? "text-primary" : "text-muted-foreground")} />
                        {isUnlocked ? (
                          <a href={`tel:${a.phone}`} className="font-semibold text-primary hover:underline">
                            {displayPhone}
                          </a>
                        ) : (
                          <span className="font-mono select-none text-muted-foreground">{displayPhone}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 truncate">
                        <HiOutlineEnvelope className={cn("h-3.5 w-3.5 shrink-0", isUnlocked ? "text-primary" : "text-muted-foreground")} />
                        {isUnlocked ? (
                          <a href={`mailto:${a.email}`} className="font-semibold text-primary hover:underline truncate">
                            {displayEmail}
                          </a>
                        ) : (
                          <span className="font-mono select-none truncate text-muted-foreground">{displayEmail}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="mt-5 pt-3.5 border-t border-border/70 flex flex-wrap items-center justify-between gap-2">
                  {isUnlocked ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setViewResumeApplicant(a)}
                      className="rounded-xl text-xs font-semibold gap-1.5 border-primary/30 bg-primary-soft text-primary hover:bg-primary-soft/80 shadow-2xs cursor-pointer"
                    >
                      <HiOutlineDocumentText className="h-4 w-4 text-primary" /> View resume
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnlockClick(a)}
                      className="rounded-xl text-xs font-medium gap-1.5 border-dashed border-border hover:border-primary/60 text-muted-foreground hover:text-primary transition-all shadow-2xs cursor-pointer"
                      title="Unlock candidate profile with 1 credit to view full resume"
                    >
                      <HiOutlineLockClosed className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>Resume (Locked)</span>
                    </Button>
                  )}

                  {isUnlocked ? (
                    <div className="flex items-center gap-2">
                      <a
                        href={`tel:${a.phone}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary text-primary-foreground px-3.5 py-1.5 text-xs font-semibold shadow-xs hover:bg-primary-hover transition-colors"
                      >
                        <HiOutlinePhone className="h-3.5 w-3.5" /> Call candidate
                      </a>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleUnlockClick(a)}
                      className="rounded-xl text-xs font-semibold gap-1.5 shadow-xs bg-primary hover:bg-primary-hover cursor-pointer"
                    >
                      <HiOutlineLockOpen className="h-3.5 w-3.5" /> Unlock profile & resume (1 Credit)
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State with Matching Lottie Animation */}
        {filteredCandidates.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 sm:p-12 text-center animate-in fade-in zoom-in-95 duration-300">
            <div className="mx-auto mb-3 w-44 sm:w-52 overflow-hidden flex items-center justify-center">
              <LottieAnimation
                animationData={lottieEmptyAnimation}
                loop={true}
                className="w-full h-auto"
              />
            </div>
            <h3 className="text-base font-bold text-foreground">No matching candidates found</h3>
            <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-sm mx-auto">
              Try adjusting your search query, role filter, or city selection.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedRole("All");
                setSelectedCity("All");
                setVerifiedOnly(false);
                setSearch("");
              }}
              className="mt-4 rounded-xl text-xs font-semibold shadow-2xs hover:bg-muted"
            >
              Reset filters
            </Button>
          </div>
        )}
      </div>

      {/* Confirmation Dialog to Unlock Candidate */}
      <Dialog
        open={!!candidateToUnlock}
        onOpenChange={(open) => !open && setCandidateToUnlock(null)}
      >
        <DialogContent className="sm:max-w-md">
          {candidateToUnlock && (
            <div className="space-y-4">
              <DialogHeader className="text-left">
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary mt-0.5 shadow-2xs">
                    <HiOutlineLockOpen className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1 pr-6">
                    <DialogTitle className="text-base sm:text-lg font-bold text-foreground leading-snug">
                      Unlock Candidate Profile & Resume
                    </DialogTitle>
                    <DialogDescription className="mt-1 text-xs text-muted-foreground">
                      Deducts 1 credit from your available balance.
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="rounded-2xl border border-border bg-muted/40 p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Role:</span>
                  <span className="font-bold text-foreground">{candidateToUnlock.role}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Experience & City:</span>
                  <span className="font-semibold text-foreground">{candidateToUnlock.exp} · {candidateToUnlock.city}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Match Score:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{candidateToUnlock.match}% Match</span>
                </div>
                <div className="border-t border-border/80 pt-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground font-medium">Available Balance:</span>
                    <span className="font-bold text-foreground inline-flex items-center gap-1.5">
                      <CoinIcon className="h-3.5 w-3.5" />
                      <span>{credits} {credits === 1 ? "Credit" : "Credits"}</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-foreground">Balance After Unlock:</span>
                    <span className="text-primary font-bold inline-flex items-center gap-1.5">
                      <CoinIcon className="h-3.5 w-3.5" />
                      <span>{credits - 1} {credits - 1 === 1 ? "Credit" : "Credits"}</span>
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                Unlocks candidate name, verified mobile number, email, current hospital, and gives full access to view & download their clinical resume.
              </p>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCandidateToUnlock(null)}
                  className="rounded-xl text-xs font-semibold cursor-pointer px-4"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmUnlock}
                  className="rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover shadow-xs cursor-pointer px-4"
                >
                  Confirm & unlock (1 Credit)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Buy Credits Modal Flow with Clean Hierarchy */}
      <Dialog open={buyCreditsOpen} onOpenChange={setBuyCreditsOpen}>
        <DialogContent className="sm:max-w-4xl p-0 overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[88vh]">
          <DialogHeader className="text-left px-5 sm:px-7 pt-5 sm:pt-6 pb-3 border-b border-border/60 shrink-0">
            <div className="flex items-start gap-3.5 pr-6">
              <div className="grid h-10 w-10 sm:h-11 sm:w-11 shrink-0 place-items-center rounded-xl bg-amber-500/10 border border-amber-500/20 shadow-2xs mt-0.5">
                <CoinIcon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <DialogTitle className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                  Purchase candidate credits
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  Unlock direct mobile numbers and verified credentials of active healthcare talent.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Scrollable Body: Cards + Guarantee Note */}
          <div className="overflow-y-auto px-5 sm:px-7 py-4 space-y-4 flex-1 min-h-0">
            {/* 3 Packages Cards */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 w-full items-stretch">
              {creditPackages.map((pkg) => {
                const selected = selectedPackage?.id === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackage(pkg)}
                    className={cn(
                      "relative flex flex-col rounded-2xl border p-4 sm:p-5 cursor-pointer transition-all min-w-0 w-full group",
                      pkg.popular ? "pt-7 sm:pt-7" : "pt-5 sm:pt-5",
                      selected
                        ? "border-primary bg-primary-soft/30 ring-2 ring-primary shadow-sm"
                        : "border-border bg-card hover:border-primary/50 hover:bg-muted/20"
                    )}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary text-primary-foreground px-3 py-0.5 text-[10px] font-bold tracking-wider shadow-sm whitespace-nowrap uppercase z-10">
                        MOST POPULAR
                      </span>
                    )}

                    {/* Card Header & Pricing */}
                    <div className="min-w-0 w-full">
                      <div className="flex items-center justify-between gap-2 min-w-0">
                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground truncate">
                          {pkg.name}
                        </span>
                        <span className="text-xs sm:text-sm font-bold text-foreground inline-flex items-center gap-1.5 shrink-0 whitespace-nowrap bg-muted/60 px-2 py-0.5 rounded-lg border border-border/50">
                          <CoinIcon className="h-3.5 w-3.5" />
                          <span>{pkg.credits} Credits</span>
                        </span>
                      </div>

                      <div className="mt-3">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">{pkg.price}</span>
                        </div>
                        <span className="text-[11px] text-muted-foreground block font-medium mt-0.5">{pkg.perCredit}</span>
                      </div>

                      <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-2 min-h-[34px]">
                        {pkg.desc}
                      </p>
                    </div>

                    {/* Features and Select Button - flex-1 pushes button to bottom equally across all cards */}
                    <div className="mt-3.5 pt-3.5 border-t border-border flex-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        {pkg.features.map((f) => (
                          <div key={f} className="flex items-start gap-2 text-[11px] text-foreground leading-tight">
                            <HiCheck className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5 stroke-[2.5]" />
                            <span className="font-medium">{f}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-5 pt-1">
                        <div
                          className={cn(
                            "w-full text-center py-2.5 rounded-xl text-xs font-bold transition-all shadow-2xs",
                            selected
                              ? "bg-primary text-primary-foreground shadow-xs"
                              : "border border-input bg-card text-muted-foreground group-hover:border-primary/40 group-hover:text-foreground"
                          )}
                        >
                          {selected ? "Selected" : "Select plan"}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Guarantee Note */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3.5 text-xs flex items-start gap-2.5">
              <HiOutlineShieldCheck className="h-4 w-4 text-primary shrink-0 mt-0.5" />
              <div className="space-y-0.5 min-w-0">
                <span className="font-semibold text-foreground block text-xs">100% Replacement Guarantee</span>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  If an unlocked contact number is invalid or unreachable within 48 hours, the credit is automatically credited back to your balance.
                </p>
              </div>
            </div>
          </div>

          {/* Action Footer (Sticky at bottom, always visible) */}
          <div className="px-5 sm:px-7 py-3.5 sm:py-4 border-t border-border bg-card/90 backdrop-blur-xs shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center justify-between sm:block">
              <span className="text-muted-foreground block text-[10px] uppercase font-bold tracking-wider">Total payable</span>
              <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight">{selectedPackage?.price}</span>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setBuyCreditsOpen(false)}
                className="flex-1 sm:flex-none rounded-xl text-xs font-semibold h-10 px-4 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                size="default"
                disabled={isProcessingPayment}
                onClick={handleBuyCredits}
                className="flex-2 sm:flex-none rounded-xl text-xs font-bold shadow-xs h-10 px-5 cursor-pointer whitespace-nowrap bg-primary hover:bg-primary-hover text-primary-foreground"
              >
                {isProcessingPayment ? "Processing payment…" : `Pay ${selectedPackage?.price} & add credits`}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Resume Preview Dialog with Clear Information Hierarchy */}
      <Dialog
        open={!!viewResumeApplicant}
        onOpenChange={(open) => !open && setViewResumeApplicant(null)}
      >
        <DialogContent className="sm:max-w-2xl p-0">
          {viewResumeApplicant && (
            <div className="flex flex-col">
              {/* Header */}
              <div className="border-b border-border bg-muted/30 p-6">
                <DialogHeader className="text-left space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-3 pr-6">
                    <div>
                      <div className="flex items-center gap-2">
                        <DialogTitle className="text-xl font-bold text-foreground">
                          {unlockedIds.includes(viewResumeApplicant.id)
                            ? viewResumeApplicant.name
                            : maskName()}
                        </DialogTitle>
                        {viewResumeApplicant.verified && (
                          <HiOutlineShieldCheck
                            className="h-5 w-5 text-primary"
                            title="Verified profile"
                          />
                        )}
                        <span className="rounded-full bg-primary-soft text-primary px-2.5 py-0.5 text-xs font-bold">
                          {viewResumeApplicant.role}
                        </span>
                      </div>
                      <DialogDescription className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-3">
                        <span>{viewResumeApplicant.city}</span>
                        <span>·</span>
                        <span>{viewResumeApplicant.exp} experience</span>
                        <span>·</span>
                        <span>
                          {unlockedIds.includes(viewResumeApplicant.id)
                            ? viewResumeApplicant.phone
                            : maskPhone()}
                        </span>
                      </DialogDescription>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        toast.success(`Resume downloaded for ${viewResumeApplicant.name}`);
                      }}
                      className="rounded-xl text-xs font-semibold gap-1.5 shrink-0"
                    >
                      <HiOutlineArrowDownTray className="h-4 w-4" /> Download PDF
                    </Button>
                  </div>
                </DialogHeader>

                {/* Council Verification Pill */}
                <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl bg-card border border-border p-3 text-xs">
                  <span className="text-muted-foreground font-medium">Council Registration:</span>
                  <span className="font-mono font-bold text-foreground">
                    {unlockedIds.includes(viewResumeApplicant.id)
                      ? viewResumeApplicant.regNumber
                      : maskReg()}
                  </span>
                  <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    <HiCheck className="h-3.5 w-3.5 stroke-[3]" /> FALE Credential Verified
                  </span>
                </div>
              </div>

              {/* Resume Body */}
              <div className="p-6 space-y-5 text-sm">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Professional Summary
                  </h3>
                  <p className="text-xs sm:text-sm text-foreground/90 leading-relaxed bg-muted/20 p-3.5 rounded-xl border border-border/60">
                    {viewResumeApplicant.bio}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    Clinical Work Experience
                  </h3>
                  <div className="space-y-3">
                    {viewResumeApplicant.experienceList?.map((exp, idx) => (
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

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Clinical Skills & Competencies
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {viewResumeApplicant.skills?.map((sk) => (
                      <span
                        key={sk}
                        className="rounded-lg bg-primary-soft text-primary border border-primary/20 px-2.5 py-1 text-xs font-semibold"
                      >
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Education & Credentials
                  </h3>
                  <div className="rounded-xl border border-border p-3.5 space-y-2 text-xs">
                    <div className="flex items-start gap-2">
                      <HiOutlineAcademicCap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-foreground">{viewResumeApplicant.education}</p>
                        <p className="text-muted-foreground">{viewResumeApplicant.qualification}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Footer */}
              <div className="border-t border-border bg-muted/20 p-4 flex items-center justify-between gap-3">
                <span className="text-xs text-muted-foreground">
                  {unlockedIds.includes(viewResumeApplicant.id)
                    ? "✓ Full candidate contact details unlocked"
                    : "🔒 Contact details masked — 1 credit required"}
                </span>

                {!unlockedIds.includes(viewResumeApplicant.id) && (
                  <Button
                    size="sm"
                    onClick={() => {
                      setViewResumeApplicant(null);
                      handleUnlockClick(viewResumeApplicant);
                    }}
                    className="rounded-xl text-xs font-semibold bg-primary hover:bg-primary-hover shadow-xs"
                  >
                    Unlock contact (1 Credit)
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
