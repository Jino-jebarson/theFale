import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HiOutlineCalendarDays,
  HiOutlineClock,
  HiOutlineMapPin,
  HiCheckCircle,
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
} from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell } from "@/components/fale/AppShell";
import { OrgMark } from "@/components/fale/JobCard";
import { Button } from "@/components/ui/button";
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

const cityOpts = ["All Cities", "Bengaluru", "Chennai", "Mumbai", "Hyderabad", "Delhi NCR"];

function Shifts() {
  const s = useApp();
  const [q, setQ] = useState("");
  const [cityF, setCityF] = useState("All Cities");
  const [timingF, setTimingF] = useState<"all" | "day" | "night" | "urgent">("all");
  const [sort, setSort] = useState<"pay" | "rate" | "earliest">("pay");

  const allShifts = useMemo(() => {
    const userPosted = (s.postedShifts ?? []).map((ps) => ({
      ...ps,
      perks: ps.perks ?? [],
      urgent: ps.urgent ?? false,
    }));
    return [...userPosted, ...shifts];
  }, [s.postedShifts]);

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
          const startHour = Number.parseInt(sh.time.split(":")[0], 10);
          if (startHour >= 18 || startHour < 6) return false;
        }
        if (timingF === "night") {
          const startHour = Number.parseInt(sh.time.split(":")[0], 10);
          if (startHour < 18 && startHour >= 6) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sort === "pay") return b.rate * b.hours - a.rate * a.hours;
        if (sort === "rate") return b.rate - a.rate;
        return a.date.localeCompare(b.date);
      });
  }, [allShifts, q, cityF, timingF, sort]);

  const appliedShiftObjects = useMemo(() => {
    return allShifts.filter((sh) => s.shiftApps.includes(sh.id));
  }, [allShifts, s.shiftApps]);

  const totalPotentialEarnings = useMemo(() => {
    return appliedShiftObjects.reduce((acc, sh) => acc + sh.rate * sh.hours, 0);
  }, [appliedShiftObjects]);

  const handleApply = (id: string, title: string, org: string) => {
    setState((x) => ({ shiftApps: [...x.shiftApps, id] }));
    toast.success("Shift requested successfully!", {
      description: `Your application was submitted to ${org} for ${title}. You'll be notified upon confirmation.`,
    });
  };

  const handleWithdraw = (id: string, title: string) => {
    setState((x) => ({ shiftApps: x.shiftApps.filter((a) => a !== id) }));
    toast.info("Shift request withdrawn", {
      description: `Your request for ${title} was removed.`,
    });
  };

  return (
    <AppShell>
      {/* ================= HERO HEADER ================= */}
      <div className="mb-7">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Find your next clinical shift.
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Transparent hourly rates. Immediate 24-hour direct payouts. Pick up flexible hospital shifts on your terms.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{allShifts.length} active clinical shifts today</span>
            </div>
            <Button asChild size="sm" variant="outline" className="rounded-xl text-xs font-semibold gap-1.5 h-8 px-3 shadow-2xs">
              <Link to="/employer/post-shift">
                <HiOutlineBolt className="h-3.5 w-3.5 text-primary" />
                <span>Hospital? Post a shift</span>
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* ================= APPLE-STYLE METRIC STATS ================= */}
      <div className="mb-7 grid gap-4 sm:grid-cols-3">
        {/* Metric 1 */}
        <div className="surface group relative overflow-hidden rounded-3xl border border-border/80 bg-card p-5 shadow-xs transition-all hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Applied shifts
            </span>
            <div className="grid h-9 w-9 place-items-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-300">
              <HiOutlineCalendarDays className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-3xl font-black tracking-tight text-foreground">
            {s.shiftApps.length}
          </p>
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5">
            {s.shiftApps.length > 0 ? (
              <span className="text-primary font-bold">● Facility review in progress</span>
            ) : (
              <span>Ready to book your first shift</span>
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
            0
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Clock-in opens 15m prior to start time
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
      <div className="surface mb-7 rounded-3xl border border-border/80 bg-card p-3 sm:p-4 shadow-sm space-y-3">
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
          {/* Timing Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0">
            {timingOpts.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTimingF(t.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold shrink-0 whitespace-nowrap transition-all cursor-pointer",
                  timingF === t.id
                    ? "bg-primary text-white shadow-2xs"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted/80 hover:text-foreground"
                )}
              >
                {"withIcon" in t && t.withIcon && (
                  <HiOutlineBolt
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      timingF === t.id ? "text-white" : "text-amber-500"
                    )}
                  />
                )}
                <span>{t.label}</span>
              </button>
            ))}
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
        <div className="grid gap-5 md:grid-cols-2">
          {filteredShifts.map((sh) => {
            const applied = s.shiftApps.includes(sh.id);
            const totalPay = sh.rate * sh.hours;

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

                        {sh.urgent && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] sm:text-[11px] font-black text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 shrink-0">
                            <HiOutlineBolt className="h-3 w-3" />
                            Urgent Cover
                          </span>
                        )}
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
                      <span className="truncate">{sh.time} ({sh.hours}h)</span>
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
                      Guaranteed Shift Pay
                    </p>
                    <div className="flex items-baseline gap-1.5 mt-0.5">
                      <span className="text-xl font-black text-primary">
                        ₹{totalPay.toLocaleString("en-IN")}
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        (₹{sh.rate}/hr × {sh.hours} hrs)
                      </span>
                    </div>
                  </div>

                  {applied ? (
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 text-white px-3.5 py-2 text-xs font-bold shadow-2xs">
                        <HiCheckCircle className="h-4 w-4" />
                        Requested
                      </span>
                      <button
                        type="button"
                        onClick={() => handleWithdraw(sh.id, sh.title)}
                        className="text-xs font-semibold text-muted-foreground hover:text-destructive underline cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleApply(sh.id, sh.title, sh.org)}
                      className="rounded-xl px-5 font-bold shadow-md h-10"
                    >
                      Pick up shift
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty Search Result State */}
        {!filteredShifts.length && (
          <div className="surface p-12 text-center rounded-3xl border border-border/80">
            <HiOutlineMagnifyingGlass className="mx-auto h-8 w-8 text-muted-foreground" />
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
