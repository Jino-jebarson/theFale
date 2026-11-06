import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineMapPin,
  HiCheckCircle,
  HiCheck,
  HiOutlineBolt,
  HiOutlineCurrencyRupee,
  HiOutlineBanknotes,
  HiOutlineMagnifyingGlass,
  HiOutlineShieldCheck,
  HiOutlineSparkles,
  HiXMark,
  HiCheckBadge,
  HiOutlineBuildingOffice2,
  HiOutlineArrowPath,
  HiOutlineAcademicCap,
  HiOutlineLockClosed,
  HiArrowRight,
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell, PageHead } from "@/components/fale/AppShell";
import { StudentLockCard } from "@/components/fale/StudentLockCard";
import { OrgMark } from "@/components/fale/JobCard";
import { SearchEmptyGraphic } from "@/components/fale/SearchEmptyGraphic";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { shifts } from "@/lib/data";
import { setState, useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import { isApiEnabled } from "@/lib/api";
import {
  getOpenShifts,
  claimShift,
  cancelShiftClaim,
  getMyClaims,
  checkInShift,
  completeShift,
  type UiShiftItem,
  type ShiftClaimDto,
} from "@/lib/adapters/shiftAdapter";
import { getCandidateProfile } from "@/lib/adapters/candidateAdapter";

export const Route = createFileRoute("/shifts")({
  head: () => ({
    meta: [
      { title: "FALE Shift — Paid healthcare shifts" },
      { name: "description", content: "Clear hours, clear pay. Pick up verified healthcare shifts that fit your schedule." },
      { property: "og:title", content: "FALE Shift — Paid healthcare shifts" },
      { property: "og:description", content: "Pick up verified healthcare shifts that fit your schedule with guaranteed 24-hr payouts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Shifts,
});

const timingOpts = [
  { id: "all", label: "All Shifts" },
  { id: "day", label: "Day Shifts" },
  { id: "night", label: "Night Shifts" },
  { id: "urgent", label: "Urgent Surge", withIcon: true },
] as const;

function Shifts() {
  const s = useApp();
  const candidateLevel =
    s.candidateLevel ||
    (s.profile["level"] as any) ||
    (s.profile["cadreLevel"] as any) ||
    (s.profile["exp"] === "Fresher" ? "fresher" : "professional");
  const isStudent = candidateLevel === "student";

  const [q, setQ] = useState("");
  const [cityF, setCityF] = useState("All Cities");
  const [timingF, setTimingF] = useState<"all" | "day" | "night" | "urgent">("all");
  const [sort, setSort] = useState<"pay" | "rate" | "earliest">("pay");

  // Dynamic API state
  const [apiShifts, setApiShifts] = useState<UiShiftItem[]>([]);
  const [myClaims, setMyClaims] = useState<ShiftClaimDto[]>([]);
  const [loading, setLoading] = useState(isApiEnabled);
  const [applyingId, setApplyingId] = useState<string | null>(null);
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isApiEnabled) return;
    setLoading(true);
    Promise.all([
      getOpenShifts().catch(() => []),
      getMyClaims().catch(() => []),
      getCandidateProfile().catch(() => null),
    ])
      .then(([fetchedShifts, fetchedClaims, profile]) => {
        setApiShifts(fetchedShifts);
        setMyClaims(fetchedClaims);
        if (profile) {
          setState((prev) => ({
            candidateLevel: profile.isStudent ? "student" : (profile.candidateLevel?.toLowerCase() as any),
            profile: {
              ...prev.profile,
              name: profile.name || prev.profile["name"],
              role: profile.profession || prev.profile["role"],
              specialty: profile.specialty || prev.profile["specialty"],
              city: profile.city || prev.profile["city"],
            },
          }));
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const allShifts = useMemo(() => {
    if (isApiEnabled) {
      return apiShifts;
    }
    const userPosted = (s.postedShifts ?? []).map((ps) => ({
      ...ps,
      perks: ps.perks ?? [],
      urgent: ps.urgent ?? false,
    }));
    return [...userPosted, ...shifts];
  }, [s.postedShifts, apiShifts]);

  // Dynamic Unique City Options
  const cityOpts = useMemo(() => {
    const defaultCities = ["Bengaluru", "Chennai", "Mumbai", "Hyderabad", "Delhi NCR"];
    const dynamicCities = allShifts.map((sh) => sh.city).filter(Boolean);
    return ["All Cities", ...Array.from(new Set([...defaultCities, ...dynamicCities]))];
  }, [allShifts]);

  const claimedShiftIds = useMemo(() => {
    const fromClaims = myClaims
      .filter((c) => !["CANCELLED", "REJECTED", "WITHDRAWN"].includes((c.status || "").toUpperCase()))
      .map((c) => c.shiftId);
    const fromApiShifts = apiShifts.filter((sh) => sh.hasClaimed).map((sh) => sh.id);
    return Array.from(new Set([...fromClaims, ...fromApiShifts, ...(s.shiftApps || [])]));
  }, [myClaims, apiShifts, s.shiftApps]);

  // Dynamic Shift Counts for Timing Pills
  const timingCounts = useMemo(() => {
    const base = allShifts.filter((sh) => {
      if (q && !`${sh.title} ${sh.org} ${sh.dept} ${sh.city}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (cityF !== "All Cities" && sh.city.toLowerCase() !== cityF.toLowerCase()) return false;
      return true;
    });

    const isDay = (sh: UiShiftItem) => {
      const startHour = Number.parseInt(sh.time?.split(":")[0] ?? "0", 10);
      return startHour >= 6 && startHour < 18;
    };
    const isNight = (sh: UiShiftItem) => {
      const startHour = Number.parseInt(sh.time?.split(":")[0] ?? "0", 10);
      return startHour < 6 || startHour >= 18;
    };

    return {
      all: base.length,
      day: base.filter(isDay).length,
      night: base.filter(isNight).length,
      urgent: base.filter((sh) => Boolean(sh.urgent)).length,
    };
  }, [allShifts, q, cityF]);

  const filteredShifts = useMemo(() => {
    return allShifts
      .filter((sh) => {
        if (q && !`${sh.title} ${sh.org} ${sh.dept} ${sh.city}`.toLowerCase().includes(q.toLowerCase())) {
          return false;
        }
        if (cityF !== "All Cities" && sh.city.toLowerCase() !== cityF.toLowerCase()) {
          return false;
        }
        if (timingF === "urgent" && !sh.urgent) {
          return false;
        }
        if (timingF === "day") {
          const startHour = Number.parseInt(sh.time?.split(":")[0] ?? "0", 10);
          if (startHour >= 18 || startHour < 6) return false;
        }
        if (timingF === "night") {
          const startHour = Number.parseInt(sh.time?.split(":")[0] ?? "0", 10);
          if (startHour < 18 && startHour >= 6) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const aRate = typeof a.rate === "number" ? a.rate : (a as any).rateNumber || 0;
        const bRate = typeof b.rate === "number" ? b.rate : (b as any).rateNumber || 0;
        const aHours = a.hours || 8;
        const bHours = b.hours || 8;

        if (sort === "pay") return bRate * bHours - aRate * aHours;
        if (sort === "rate") return bRate - aRate;
        return a.date.localeCompare(b.date);
      });
  }, [allShifts, q, cityF, timingF, sort]);

  const appliedShiftObjects = useMemo(() => {
    return allShifts.filter((sh) => claimedShiftIds.includes(sh.id));
  }, [allShifts, claimedShiftIds]);

  const appliedCount = isApiEnabled ? claimedShiftIds.length : s.shiftApps.length;

  const confirmedCount = useMemo(() => {
    if (isApiEnabled) {
      return myClaims.filter((c) => c.status === "CONFIRMED" || c.status === "CHECKED_IN").length;
    }
    return 0;
  }, [isApiEnabled, myClaims]);

  const pendingReviewCount = useMemo(() => {
    if (isApiEnabled) {
      return myClaims.filter((c) => !["CONFIRMED", "CHECKED_IN", "COMPLETED", "REJECTED", "CANCELLED"].includes(c.status)).length;
    }
    return s.shiftApps.length;
  }, [isApiEnabled, myClaims, s.shiftApps]);

  const totalPotentialEarnings = useMemo(() => {
    return appliedShiftObjects.reduce((acc, sh) => {
      const r = typeof sh.rate === "number" ? sh.rate : (sh as any).rateNumber || 0;
      const h = sh.hours || 8;
      const pay = sh.totalPayNumber || (r * h);
      return acc + pay;
    }, 0);
  }, [appliedShiftObjects]);

  const handleApply = async (id: string, title: string, org: string) => {
    if (applyingId === id) return;

    setApplyingId(id);
    try {
      if (isApiEnabled) {
        const claim = await claimShift(id);
        setMyClaims((prev) => [...prev.filter((c) => c.shiftId !== id), claim]);
      }
      const newAdminApp = {
        id: "claim-" + Date.now(),
        candidateName: s.profile?.name || (isStudent ? "Clinical Student" : "Candidate"),
        candidateRole: s.profile?.course || s.profile?.role || "Healthcare Clinician",
        exp: s.profile?.exp || (isStudent ? "Final Year Intern" : "1 Year"),
        candidateCity: s.profile?.city || "Chennai",
        jobTitle: `${title} (Locum Shift)`,
        status: "shortlisted",
        councilVerified: true,
        matchScore: 96,
        appliedDate: "Today",
        regNumber: s.profile?.regNo || (isStudent ? "College Verified" : "Council Verified"),
        phone: s.profile?.phone || "+91 98401 23456",
        email: s.profile?.email || "candidate@fale.care",
        summary: `Applied for ${title} locum shift duty coverage.`,
      };
      setState((x) => ({
        shiftApps: Array.from(new Set([...(x.shiftApps || []), id])),
        adminApplications: [newAdminApp, ...(x.adminApplications || [])],
      }));
      setApiShifts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, hasClaimed: true } : item))
      );
      toast.success("Shift claimed successfully!", {
        description: `Your interest in ${title} at ${org} was submitted. Hospital notified!`,
      });
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("already claimed") || err?.status === 409) {
        // Automatically disable and mark shift as applied in UI
        setState((x) => ({
          shiftApps: Array.from(new Set([...(x.shiftApps || []), id])),
        }));
        setApiShifts((prev) =>
          prev.map((item) => (item.id === id ? { ...item, hasClaimed: true } : item))
        );
        getMyClaims().then((claims) => setMyClaims(claims)).catch(() => { });
        toast.info("Shift already claimed", {
          description: "You have already claimed a slot for this shift. Check status under review.",
        });
      } else {
        toast.error("Shift claim failed", {
          description: msg || "Slot unavailable or already filled.",
        });
      }
    } finally {
      setApplyingId(null);
    }
  };

  const handleWithdraw = async (id: string, title: string) => {
    setWithdrawingId(id);
    try {
      if (isApiEnabled) {
        const claim = myClaims.find((c) => c.shiftId === id && !["CANCELLED", "REJECTED"].includes((c.status || "").toUpperCase()));
        if (claim) {
          try {
            await cancelShiftClaim(claim.id);
          } catch (err: any) {
            if (!err?.message?.includes("CANCELLED")) {
              throw err;
            }
          }
          setMyClaims((prev) => prev.map((c) => (c.id === claim.id ? { ...c, status: "CANCELLED" } : c)));
        }
      }
      setApiShifts((prev) =>
        prev.map((item) => (item.id === id ? { ...item, hasClaimed: false } : item))
      );
      setState((x) => ({ shiftApps: (x.shiftApps || []).filter((a) => a !== id) }));
      toast.info("Shift request withdrawn", {
        description: `Your request for ${title} was removed.`,
      });
    } catch (err: any) {
      toast.error("Cancellation failed", {
        description: err?.message || "Could not cancel shift claim.",
      });
    } finally {
      setWithdrawingId(null);
    }
  };

  const handleCheckIn = async (claimId: string, shiftTitle: string) => {
    try {
      const updated = await checkInShift(claimId);
      setMyClaims((prev) => prev.map((c) => (c.id === claimId ? updated : c)));
      toast.success("Checked in on hospital floor!", {
        description: `Duty started for "${shiftTitle}". Payout escrow is locked.`,
      });
    } catch (err: any) {
      toast.error("Check-in failed", { description: err?.message });
    }
  };

  const handleCompleteShift = async (claimId: string, shiftTitle: string) => {
    try {
      const updated = await completeShift(claimId);
      setMyClaims((prev) => prev.map((c) => (c.id === claimId ? updated : c)));
      toast.success("Shift duty marked completed!", {
        description: `Duty sign-off submitted for "${shiftTitle}". Escrow release scheduled.`,
      });
    } catch (err: any) {
      toast.error("Completion failed", { description: err?.message });
    }
  };

  return (
    <AppShell>
      {/* ================= PAGE HEADER (MATCHING LEARNING STYLE) ================= */}
      <PageHead
        title="Clinical Shifts"
        sub={
          isStudent
            ? "Clinical shifts, on-call hospital duties, and verified emergency rotations."
            : "Transparent hourly rates. Immediate 24-hour direct payouts. Pick up flexible hospital shifts on your terms."
        }
        action={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span>{loading ? "Syncing shifts..." : `${allShifts.length} verified clinical shifts today`}</span>
            </div>
            {s.portal === "facility" && (
              <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold gap-1.5 h-8 px-3 shadow-2xs">
                <Link to="/employer/post-shift">
                  <HiOutlineBolt className="h-3.5 w-3.5 text-primary" />
                  <span>Hospital? Post a shift</span>
                </Link>
              </Button>
            )}
          </div>
        }
      />

      {/* ================= APPLE-STYLE METRIC STATS ================= */}
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
            {/* Metric 1 */}
            <div className="surface group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Applied shifts
                </span>
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <HiOutlineCalendarDays className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-black tracking-tight text-foreground">
                {appliedCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
                {pendingReviewCount > 0 ? (
                  <span className="text-primary font-bold">● {pendingReviewCount} under facility review</span>
                ) : (
                  <span>Ready to claim your next shift</span>
                )}
              </p>
            </div>

            {/* Metric 2 */}
            <div className="surface group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Confirmed shifts
                </span>
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <HiCheckBadge className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-black tracking-tight text-foreground">
                {confirmedCount}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {confirmedCount > 0 ? "Clock-in opens 15m prior to start time" : "Awaiting facility confirmation"}
              </p>
            </div>

            {/* Metric 3 */}
            <div className="surface group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Potential earnings
                </span>
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-300">
                  <HiOutlineBanknotes className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-2 text-3xl font-black tracking-tight text-foreground">
                ₹{totalPotentialEarnings.toLocaleString("en-IN")}
              </p>
              <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                <span>Guaranteed 24-hr direct bank transfer</span>
              </p>
            </div>
          </div>

          {/* ================= SEARCH & SMART FILTER DOCK ================= */}
          <div className="sticky top-[var(--header-offset,4rem)] z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pt-3 pb-3 mb-4 sm:mb-6 bg-background/95 backdrop-blur-md transition-all duration-300 ease-in-out">
            <div className="surface rounded-3xl border border-border/80 bg-card p-3 sm:p-4 shadow-sm space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* Main search bar */}
                <div className="flex flex-1 items-center gap-3 rounded-2xl bg-muted/40 px-3.5 py-1 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                  <HiOutlineMagnifyingGlass className="h-5 w-5 text-primary shrink-0" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="Search shifts by title, specialty, hospital or department"
                    className="h-11 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-medium"
                  />
                  {q && (
                    <button
                      type="button"
                      onClick={() => setQ("")}
                      className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      <HiXMark className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <span className="hidden h-8 w-px bg-border/80 sm:block" />

                {/* Custom City Select Filter */}
                <div className="w-full sm:w-[210px] shrink-0">
                  <Select value={cityF} onValueChange={(val) => setCityF(val)}>
                    <SelectTrigger
                      aria-label="Filter shifts by city"
                      className="h-11 w-full rounded-2xl border-none bg-muted/40 px-3.5 text-sm font-bold text-foreground shadow-none hover:bg-muted/60 focus:ring-2 focus:ring-primary/20 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <HiOutlineMapPin className="h-4 w-4 text-primary shrink-0" />
                        <SelectValue placeholder="All Cities" />
                      </div>
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-border/80 bg-card/95 backdrop-blur-md p-1 shadow-lg">
                      {cityOpts.map((c) => (
                        <SelectItem
                          key={c}
                          value={c}
                          className="rounded-xl font-semibold cursor-pointer py-2 focus:bg-primary/10 focus:text-primary"
                        >
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Filter Pills & Sort Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-3">
                {/* Timing Pills with Dynamic Counts */}
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
                  {timingOpts.map((t) => {
                    const count = timingCounts[t.id] ?? 0;
                    const isActive = timingF === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setTimingF(t.id)}
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shrink-0 whitespace-nowrap transition-all cursor-pointer",
                          isActive
                            ? "bg-primary text-white shadow-2xs"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                        )}
                      >
                        {"withIcon" in t && t.withIcon && (
                          <HiOutlineBolt
                            className={cn(
                              "h-3.5 w-3.5 shrink-0",
                              isActive ? "text-white" : "text-amber-500"
                            )}
                          />
                        )}
                        <span>{t.label}</span>
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.2 text-[10px] font-bold tabular-nums transition-colors",
                            isActive
                              ? "bg-white/20 text-white"
                              : "bg-muted text-muted-foreground"
                          )}
                        >
                          {count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Segmented Sort (Apple style) */}
                <div className="flex items-center rounded-2xl bg-muted/60 p-1 text-xs font-semibold border border-border/50">
                  {(
                    [
                      ["pay", "Highest pay"],
                      ["rate", "Hourly rate"],
                      ["earliest", "Earliest date"],
                    ] as const
                  ).map(([k, l]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setSort(k)}
                      className={cn(
                        "rounded-xl px-3 py-1.5 transition-all cursor-pointer font-bold",
                        sort === k
                          ? "bg-card text-primary shadow-xs"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ================= SHIFT CARDS FEED ================= */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <p className="text-xs font-bold text-muted-foreground">
                Showing <span className="text-foreground">{filteredShifts.length}</span> verified shifts
              </p>
              {(q || cityF !== "All Cities" || timingF !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setQ("");
                    setCityF("All Cities");
                    setTimingF("all");
                  }}
                  className="text-xs font-bold text-primary hover:underline cursor-pointer flex items-center gap-1"
                >
                  <HiOutlineArrowPath className="h-3.5 w-3.5" />
                  Reset filters
                </button>
              )}
            </div>

            {/* Cards Grid */}
            {loading ? (
              <div className="grid gap-5 md:grid-cols-2">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="surface rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs animate-pulse space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-2xl bg-muted/60 shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 w-3/4 bg-muted/60 rounded-md" />
                        <div className="h-3 w-1/2 bg-muted/50 rounded-md" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="h-8 bg-muted/40 rounded-xl" />
                      <div className="h-8 bg-muted/40 rounded-xl" />
                      <div className="h-8 bg-muted/40 rounded-xl" />
                      <div className="h-8 bg-muted/40 rounded-xl" />
                    </div>
                    <div className="h-12 bg-muted/30 rounded-2xl" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2">
                {filteredShifts.map((sh) => {
                  const activeClaim = myClaims.find(
                    (c) => c.shiftId === sh.id && !["CANCELLED", "REJECTED", "WITHDRAWN"].includes((c.status || "").toUpperCase())
                  );
                  const isClaimCancelled = myClaims.some(
                    (c) => c.shiftId === sh.id && ["CANCELLED", "REJECTED", "WITHDRAWN"].includes((c.status || "").toUpperCase())
                  );
                  const applied = Boolean(activeClaim) || ((Boolean(sh.hasClaimed) || claimedShiftIds.includes(sh.id)) && !isClaimCancelled);
                  const rateNumber = typeof sh.rate === "number"
                    ? sh.rate
                    : (sh.rateNumber || parseFloat(String(sh.rate).replace(/[^0-9.]/g, "")) || 0);
                  const hoursNumber = Number(sh.hours) || 8;
                  const totalPay = sh.totalPayNumber || (rateNumber * hoursNumber);

                  return (
                    <div
                      key={sh.id}
                      className={cn(
                        "surface group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-border/80 bg-card p-5 sm:p-6 shadow-xs transition-all duration-200 hover:border-primary/40 hover:shadow-md",
                        applied && "border-emerald-300/80 bg-emerald-50/20 dark:border-emerald-900/40 dark:bg-emerald-950/10"
                      )}
                    >
                      <div>
                        {/* Card Header: Hospital & Title */}
                        <div className="flex items-start gap-3 sm:gap-3.5">
                          <OrgMark name={sh.org} className="h-11 w-11 sm:h-12 sm:w-12 text-xs sm:text-sm shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-start justify-between gap-1.5 sm:gap-2">
                              <div className="min-w-0 flex-1">
                                <h2 className="font-black text-base sm:text-lg text-foreground group-hover:text-primary transition-colors leading-snug break-words">
                                  {sh.title}
                                </h2>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs">
                                  <span className="inline-flex items-center gap-1 font-bold text-foreground/90">
                                    <span>{sh.org}</span>
                                    <HiCheckBadge className="h-3.5 w-3.5 text-primary shrink-0" title="Verified Hospital" />
                                  </span>
                                  <span className="rounded-lg bg-primary-soft/80 px-2 py-0.5 text-[11px] font-bold text-primary shrink-0">
                                    {sh.dept}
                                  </span>
                                </div>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-black text-primary border border-primary/20">
                                  ₹{rateNumber.toLocaleString("en-IN")}/hr
                                </span>
                                {sh.urgent && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                                    <HiOutlineBolt className="h-3 w-3" />
                                    Urgent Cover
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Schedule & Location Grid */}
                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2 rounded-2xl bg-muted/40 px-3 py-2 text-foreground font-semibold">
                            <HiOutlineCalendarDays className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">{sh.date}</span>
                          </div>

                          <div className="flex items-center gap-2 rounded-2xl bg-muted/40 px-3 py-2 text-foreground font-semibold">
                            <HiOutlineClock className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">{sh.time} ({hoursNumber} hrs duty)</span>
                          </div>

                          <div className="flex items-center gap-2 rounded-2xl bg-muted/40 px-3 py-2 text-foreground font-semibold">
                            <HiOutlineMapPin className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">{sh.city}</span>
                          </div>

                          <div className="flex items-center gap-2 rounded-2xl bg-muted/40 px-3 py-2 text-foreground font-semibold">
                            <HiOutlineBuildingOffice2 className="h-4 w-4 text-primary shrink-0" />
                            <span className="truncate">{sh.dept}</span>
                          </div>
                        </div>

                        {/* Perks chips */}
                        {sh.perks && sh.perks.length > 0 && (
                          <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            {sh.perks.map((p) => (
                              <span
                                key={p}
                                className="rounded-lg bg-muted/50 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground"
                              >
                                {p}
                              </span>
                            ))}
                            {sh.surge && (
                              <span className="rounded-lg bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-700 dark:bg-rose-950/40 dark:text-rose-300">
                                {sh.surge}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Bottom Earnings & Action Dock */}
                      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-primary-soft/60 to-primary-soft/30 p-3.5 border border-primary/10">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                            Guaranteed Shift Pay • ₹{rateNumber.toLocaleString("en-IN")}/hr
                          </p>
                          <div className="flex items-baseline gap-1.5 mt-0.5">
                            <span className="text-xl font-black text-primary">
                              ₹{totalPay.toLocaleString("en-IN")}
                            </span>
                            <span className="text-xs font-semibold text-muted-foreground">
                              (₹{rateNumber.toLocaleString("en-IN")}/hr × {hoursNumber} hrs)
                            </span>
                          </div>
                        </div>

                        {applied ? (
                          <div className="flex flex-wrap items-center gap-2">
                            {(() => {
                              const claim = activeClaim;
                              if (claim?.status === "CONFIRMED") {
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 text-white px-3 py-1.5 text-xs font-bold shadow-2xs">
                                      <HiCheckBadge className="h-4 w-4" />
                                      Confirmed
                                    </span>
                                    <Button
                                      size="sm"
                                      onClick={() => handleCheckIn(claim.id, sh.title)}
                                      className="rounded-xl px-3 h-8 font-bold text-xs bg-primary hover:bg-primary-hover text-white shadow-2xs cursor-pointer"
                                    >
                                      Check In
                                    </Button>
                                  </div>
                                );
                              }
                              if (claim?.status === "CHECKED_IN") {
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 text-white px-3 py-1.5 text-xs font-bold shadow-2xs">
                                      <HiOutlineClock className="h-4 w-4" />
                                      On Floor
                                    </span>
                                    <Button
                                      size="sm"
                                      onClick={() => handleCompleteShift(claim.id, sh.title)}
                                      className="rounded-xl px-3 h-8 font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs cursor-pointer"
                                    >
                                      Sign Off Duty
                                    </Button>
                                  </div>
                                );
                              }
                              if (claim?.status === "COMPLETED") {
                                return (
                                  <div className="flex items-center gap-2">
                                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/90 text-white px-3 py-1.5 text-xs font-bold shadow-2xs">
                                      <HiCheckBadge className="h-4 w-4" />
                                      {claim.payoutStatus === "DISBURSED" ? "Paid" : "Completed"}
                                    </span>
                                    <Button asChild size="sm" variant="outline" className="rounded-xl px-2.5 h-8 font-bold text-xs">
                                      <Link to="/earnings">Earnings</Link>
                                    </Button>
                                  </div>
                                );
                              }
                              return (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold bg-emerald-600/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30">
                                    <HiCheck className="h-4 w-4 stroke-[3]" />
                                    <span>Applied</span>
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    disabled={withdrawingId === sh.id}
                                    onClick={() => handleWithdraw(sh.id, sh.title)}
                                    className="rounded-xl px-2.5 h-8 text-xs font-bold text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer transition-colors"
                                  >
                                    {withdrawingId === sh.id ? "Withdrawing..." : "Withdraw"}
                                  </Button>
                                </div>
                              );
                            })()}
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            disabled={applyingId === sh.id || applied}
                            onClick={() => handleApply(sh.id, sh.title, sh.org)}
                            className="rounded-xl px-5 font-bold shadow-md h-10 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
                          >
                            {applyingId === sh.id ? (
                              <span className="flex items-center gap-2">
                                <span className="h-3.5 w-3.5 border-2 border-white/80 border-t-transparent rounded-full animate-spin" />
                                <span>Applying...</span>
                              </span>
                            ) : (
                              "Pick up shift"
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Empty Search Result State */}
            {!filteredShifts.length && (
              <div className="surface p-12 text-center rounded-3xl border border-border/80">
                <SearchEmptyGraphic className="w-56 h-44 sm:w-64 sm:h-52 mx-auto mb-2" />
                <p className="mt-3 text-sm font-bold text-foreground">No clinical shifts match your criteria</p>
                <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                  Try adjusting your search terms, city filter, or timing to discover more available hospital shifts.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setQ("");
                    setCityF("All Cities");
                    setTimingF("all");
                  }}
                  className="mt-4 rounded-xl font-bold"
                >
                  <HiOutlineArrowPath className="h-3.5 w-3.5 mr-1.5" />
                  Reset all filters
                </Button>
              </div>
            )}
          </div>

          {/* ================= ESCROW ASSURANCE FOOTER ================= */}
          <div className="mt-8 rounded-3xl border border-primary/20 bg-gradient-to-r from-primary-soft/50 via-card to-primary-soft/40 p-5 sm:p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-primary text-white shadow-sm">
                  <HiOutlineShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-black text-sm text-foreground flex items-center gap-1.5">
                    <span>100% Protected Shift Escrow Guarantee</span>
                    <HiOutlineSparkles className="h-4 w-4 text-amber-500" />
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed max-w-xl">
                    Hospital payments are pre-funded into FALE Escrow before shift publish. Once you complete your shift hours and clinical sign-off, funds are disbursed directly to your bank account or UPI within 24 hours.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="rounded-2xl border border-border/70 bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-2xs">
                  NABH & JCI Hospitals
                </span>
                <span className="rounded-2xl border border-border/70 bg-card px-3.5 py-2 text-xs font-bold text-foreground shadow-2xs">
                  Direct UPI Payout
                </span>
              </div>
            </div>
          </div>
        </AppShell>
  );
}
