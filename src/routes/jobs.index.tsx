import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  HiOutlineMagnifyingGlass,
  HiOutlineMapPin,
  HiOutlineAdjustmentsHorizontal,
  HiOutlineShieldCheck,
  HiXMark,
  HiOutlineArrowPath,
  HiOutlineBuildingOffice2,
  HiOutlineAcademicCap,
  HiOutlineSparkles,
  HiOutlineClock,
  HiOutlineCurrencyRupee,
  HiOutlineBriefcase,
  HiOutlineHeart,
} from "react-icons/hi2";
import { AppShell } from "@/components/fale/AppShell";
import { JobCard } from "@/components/fale/JobCard";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { jobs } from "@/lib/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/jobs/")({
  validateSearch: (s: Record<string, unknown>) => ({
    q: typeof s["q"] === "string" ? s["q"] || undefined : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Healthcare jobs — FALE" },
      { name: "description", content: "Browse verified nursing, allied health, pharmacy and hospital jobs across India." },
      { property: "og:title", content: "Healthcare jobs — FALE" },
      { property: "og:description", content: "Browse verified healthcare jobs across India." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Jobs,
});

const deptOpts = [
  "ICU & Critical Care",
  "Emergency / Trauma",
  "Inpatient / Ward",
  "Diagnostics & Pathology",
  "Radiology & Imaging",
  "Operation Theatre (OT)",
  "Pharmacy",
  "Physiotherapy & Rehab",
  "Dental Surgery",
];

const cityOpts = [
  "Bengaluru",
  "Chennai",
  "Delhi NCR",
  "Hyderabad",
  "Mumbai",
  "Kolkata",
];

const qualOpts = [
  "GNM / B.Sc Nursing",
  "MBBS / MD / Specialist",
  "B.Pharm / Pharm.D",
  "DMLT / B.Sc MLT",
  "BPT / MPT",
  "BDS / MDS",
  "Medical Diploma / Cert",
];

const salaryOpts = [
  "< ₹30,000",
  "₹30,000 – ₹50,000",
  "₹50,000 – ₹80,000",
  "₹80,000+",
];

const expOpts = ["0–2 yrs", "2–5 yrs", "5+ yrs"];

const typeOpts = ["Full-time", "Contract"];

const shiftOpts = ["Day", "Morning", "Rotational", "Night"];

const orgOpts = [
  "Apollo Hospitals",
  "Manipal Hospitals",
  "Fortis Healthcare",
  "Metropolis Healthcare",
  "Aster CMI",
  "KIMS Hospitals",
  "Max Healthcare",
  "Narayana Health",
];

const perkOpts = [
  "Hostel provided",
  "Health Insurance",
  "PF & Gratuity",
  "Transport / Cab",
];

const popularSearches = [
  "ICU Nurse",
  "Emergency",
  "Apollo Hospitals",
  "Chennai",
  "Bengaluru",
  "Hostel provided",
  "Day shift",
];

function Jobs() {
  const { q: initialQ } = Route.useSearch();
  const navigate = Route.useNavigate();
  const [q, setQ] = useState(initialQ ?? "");
  useEffect(() => {
    setQ(initialQ ?? "");
  }, [initialQ]);

  const [city, setCity] = useState("");
  const [deptF, setDeptF] = useState<string[]>([]);
  const [cityF, setCityF] = useState<string[]>([]);
  const [qualF, setQualF] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [shiftF, setShiftF] = useState<string[]>([]);
  const [salaryF, setSalaryF] = useState<string[]>([]);
  const [expF, setExpF] = useState<string[]>([]);
  const [orgF, setOrgF] = useState<string[]>([]);
  const [perkF, setPerkF] = useState<string[]>([]);
  const [sort, setSort] = useState<"match" | "recent" | "salary">("match");
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const list = useMemo(() => {
    const r = jobs.filter((j) => {
      if (q && !`${j.title} ${j.org} ${j.dept || ""} ${j.tags.join(" ")}`.toLowerCase().includes(q.toLowerCase())) return false;
      if (city && !j.city.toLowerCase().includes(city.toLowerCase())) return false;
      if (cityF.length && !cityF.includes(j.city)) return false;
      if (deptF.length && (!j.dept || !deptF.includes(j.dept))) return false;
      if (types.length && !types.includes(j.type)) return false;
      if (shiftF.length && !shiftF.includes(j.shift)) return false;
      if (orgF.length && !orgF.includes(j.org)) return false;

      if (qualF.length) {
        const matchesQual = qualF.some((ql) =>
          j.qualification === ql || j.tags.some((t) => t.toLowerCase().includes(ql.toLowerCase()))
        );
        if (!matchesQual) return false;
      }

      if (perkF.length) {
        const matchesPerk = perkF.every((pk) => j.perks?.includes(pk));
        if (!matchesPerk) return false;
      }

      if (expF.length) {
        const matchesExp = expF.some((e) => {
          if (e === "0–2 yrs")
            return j.exp.includes("0") || j.exp.includes("1") || j.exp.includes("0–2") || j.exp.includes("1–3") || j.exp.includes("0–3");
          if (e === "2–5 yrs")
            return j.exp.includes("2–5") || j.exp.includes("2–4") || j.exp.includes("3–6") || j.exp.includes("1–4");
          if (e === "5+ yrs")
            return j.exp.includes("5") || j.exp.includes("6") || j.exp.includes("3–6") || j.exp.includes("4–7");
          return false;
        });
        if (!matchesExp) return false;
      }

      if (salaryF.length) {
        const jobNumbers = j.salary.replace(/,/g, "").match(/\d+/g)?.map(Number) || [];
        const jobMax = jobNumbers[jobNumbers.length - 1] || 0;
        const jobMin = jobNumbers[0] || 0;

        const matchesSal = salaryF.some((s) => {
          if (s === "< ₹30,000") return jobMin < 30000;
          if (s === "₹30,000 – ₹50,000") return jobMax >= 30000 && jobMin <= 50000;
          if (s === "₹50,000 – ₹80,000") return jobMax >= 50000 && jobMin <= 80000;
          if (s === "₹80,000+") return jobMax >= 80000;
          return false;
        });
        if (!matchesSal) return false;
      }

      return true;
    });

    const parseSalary = (sal: string) => {
      const match = sal.replace(/,/g, "").match(/\d+/g);
      return match ? Number(match[match.length - 1] ?? 0) : 0;
    };

    const age = (posted: string) =>
      posted === "Today" ? 0 : Number.parseInt(posted, 10) * (posted.includes("week") ? 7 : 1);

    return [...r].sort((a, b) => {
      if (sort === "salary") return parseSalary(b.salary) - parseSalary(a.salary);
      if (sort === "recent") return age(a.posted) - age(b.posted);
      return b.match - a.match;
    });
  }, [q, city, cityF, deptF, types, shiftF, salaryF, expF, orgF, qualF, perkF, sort]);

  const toggle = (arr: string[], set: (v: string[]) => void, v: string) =>
    set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  const clearAll = () => {
    setTypes([]);
    setShiftF([]);
    setSalaryF([]);
    setExpF([]);
    setOrgF([]);
    setDeptF([]);
    setCityF([]);
    setQualF([]);
    setPerkF([]);
    setQ("");
    setCity("");
    navigate({ search: { q: undefined } });
  };

  const countFor = (category: string, opt: string) => {
    if (category === "type") return jobs.filter((j) => j.type === opt).length;
    if (category === "shift") return jobs.filter((j) => j.shift === opt).length;
    if (category === "org") return jobs.filter((j) => j.org === opt).length;
    if (category === "dept") return jobs.filter((j) => j.dept === opt).length;
    if (category === "city") return jobs.filter((j) => j.city.toLowerCase() === opt.toLowerCase()).length;
    if (category === "qual") {
      return jobs.filter((j) => j.qualification === opt || j.tags.some((t) => t.toLowerCase().includes(opt.toLowerCase()))).length;
    }
    if (category === "perk") return jobs.filter((j) => j.perks?.includes(opt)).length;
    if (category === "exp") {
      return jobs.filter((j) => {
        if (opt === "0–2 yrs")
          return j.exp.includes("0") || j.exp.includes("1") || j.exp.includes("0–2") || j.exp.includes("1–3") || j.exp.includes("0–3");
        if (opt === "2–5 yrs")
          return j.exp.includes("2–5") || j.exp.includes("2–4") || j.exp.includes("3–6") || j.exp.includes("1–4");
        if (opt === "5+ yrs")
          return j.exp.includes("5") || j.exp.includes("6") || j.exp.includes("3–6") || j.exp.includes("4–7");
        return false;
      }).length;
    }
    if (category === "salary") {
      return jobs.filter((j) => {
        const jobNumbers = j.salary.replace(/,/g, "").match(/\d+/g)?.map(Number) || [];
        const jobMax = jobNumbers[jobNumbers.length - 1] || 0;
        const jobMin = jobNumbers[0] || 0;
        if (opt === "< ₹30,000") return jobMin < 30000;
        if (opt === "₹30,000 – ₹50,000") return jobMax >= 30000 && jobMin <= 50000;
        if (opt === "₹50,000 – ₹80,000") return jobMax >= 50000 && jobMin <= 80000;
        if (opt === "₹80,000+") return jobMax >= 80000;
        return false;
      }).length;
    }
    return 0;
  };

  const activeFilterCount =
    types.length +
    shiftF.length +
    salaryF.length +
    expF.length +
    orgF.length +
    deptF.length +
    cityF.length +
    qualF.length +
    perkF.length +
    (q ? 1 : 0) +
    (city ? 1 : 0);

  // Common Filter Sections rendered in both Desktop Sidebar and Mobile Bottom Sheet
  const renderFilterSections = () => (
    <div className="space-y-5">
      {/* Department / Specialty */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            <HiOutlineHeart className="h-3.5 w-3.5 text-primary" />
            Department / Specialty
          </p>
          {deptF.length > 0 && (
            <button
              type="button"
              onClick={() => setDeptF([])}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {deptOpts.map((o) => {
            const isChecked = deptF.includes(o);
            const count = countFor("dept", o);
            return (
              <label
                key={o}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  isChecked ? "bg-primary-soft text-primary font-bold" : "text-foreground hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-md accent-primary cursor-pointer shrink-0"
                    checked={isChecked}
                    onChange={() => toggle(deptF, setDeptF, o)}
                  />
                  <span className="truncate">{o}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-bold shrink-0">{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Qualification / Degree */}
      <div className="space-y-2 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            <HiOutlineAcademicCap className="h-3.5 w-3.5 text-primary" />
            Qualification
          </p>
          {qualF.length > 0 && (
            <button
              type="button"
              onClick={() => setQualF([])}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {qualOpts.map((o) => {
            const isChecked = qualF.includes(o);
            const count = countFor("qual", o);
            return (
              <label
                key={o}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  isChecked ? "bg-primary-soft text-primary font-bold" : "text-foreground hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-md accent-primary cursor-pointer shrink-0"
                    checked={isChecked}
                    onChange={() => toggle(qualF, setQualF, o)}
                  />
                  <span className="truncate">{o}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-bold shrink-0">{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Monthly Salary */}
      <div className="space-y-2 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            <HiOutlineCurrencyRupee className="h-3.5 w-3.5 text-primary" />
            Monthly salary
          </p>
          {salaryF.length > 0 && (
            <button
              type="button"
              onClick={() => setSalaryF([])}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {salaryOpts.map((o) => {
            const isChecked = salaryF.includes(o);
            const count = countFor("salary", o);
            return (
              <label
                key={o}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  isChecked ? "bg-primary-soft text-primary font-bold" : "text-foreground hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-md accent-primary cursor-pointer"
                    checked={isChecked}
                    onChange={() => toggle(salaryF, setSalaryF, o)}
                  />
                  <span>{o}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-bold">{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Experience Level */}
      <div className="space-y-2 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            <HiOutlineSparkles className="h-3.5 w-3.5 text-primary" />
            Experience level
          </p>
          {expF.length > 0 && (
            <button
              type="button"
              onClick={() => setExpF([])}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {expOpts.map((o) => {
            const isChecked = expF.includes(o);
            const count = countFor("exp", o);
            return (
              <label
                key={o}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  isChecked ? "bg-primary-soft text-primary font-bold" : "text-foreground hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-md accent-primary cursor-pointer"
                    checked={isChecked}
                    onChange={() => toggle(expF, setExpF, o)}
                  />
                  <span>{o}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-bold">{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* City / Location */}
      <div className="space-y-2 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            <HiOutlineMapPin className="h-3.5 w-3.5 text-primary" />
            Location / City
          </p>
          {cityF.length > 0 && (
            <button
              type="button"
              onClick={() => setCityF([])}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {cityOpts.map((o) => {
            const isChecked = cityF.includes(o);
            const count = countFor("city", o);
            return (
              <label
                key={o}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  isChecked ? "bg-primary-soft text-primary font-bold" : "text-foreground hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-md accent-primary cursor-pointer"
                    checked={isChecked}
                    onChange={() => toggle(cityF, setCityF, o)}
                  />
                  <span>{o}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-bold">{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Employment Type */}
      <div className="space-y-2 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            <HiOutlineBriefcase className="h-3.5 w-3.5 text-primary" />
            Employment type
          </p>
          {types.length > 0 && (
            <button
              type="button"
              onClick={() => setTypes([])}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {typeOpts.map((o) => {
            const isChecked = types.includes(o);
            const count = countFor("type", o);
            return (
              <label
                key={o}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  isChecked ? "bg-primary-soft text-primary font-bold" : "text-foreground hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-md accent-primary cursor-pointer"
                    checked={isChecked}
                    onChange={() => toggle(types, setTypes, o)}
                  />
                  <span>{o}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-bold">{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Shift Timing */}
      <div className="space-y-2 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            <HiOutlineClock className="h-3.5 w-3.5 text-primary" />
            Shift timing
          </p>
          {shiftF.length > 0 && (
            <button
              type="button"
              onClick={() => setShiftF([])}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {shiftOpts.map((o) => {
            const isChecked = shiftF.includes(o);
            const count = countFor("shift", o);
            return (
              <label
                key={o}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  isChecked ? "bg-primary-soft text-primary font-bold" : "text-foreground hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-md accent-primary cursor-pointer"
                    checked={isChecked}
                    onChange={() => toggle(shiftF, setShiftF, o)}
                  />
                  <span>{o}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-bold">{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Hospital Network */}
      <div className="space-y-2 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            <HiOutlineBuildingOffice2 className="h-3.5 w-3.5 text-primary" />
            Hospital network
          </p>
          {orgF.length > 0 && (
            <button
              type="button"
              onClick={() => setOrgF([])}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {orgOpts.map((o) => {
            const isChecked = orgF.includes(o);
            const count = countFor("org", o);
            return (
              <label
                key={o}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  isChecked ? "bg-primary-soft text-primary font-bold" : "text-foreground hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-md accent-primary cursor-pointer shrink-0"
                    checked={isChecked}
                    onChange={() => toggle(orgF, setOrgF, o)}
                  />
                  <span className="truncate">{o}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-bold shrink-0">{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Perks & Benefits */}
      <div className="space-y-2 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-muted-foreground">
            <HiOutlineSparkles className="h-3.5 w-3.5 text-primary" />
            Perks & Benefits
          </p>
          {perkF.length > 0 && (
            <button
              type="button"
              onClick={() => setPerkF([])}
              className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
        <div className="space-y-1">
          {perkOpts.map((o) => {
            const isChecked = perkF.includes(o);
            const count = countFor("perk", o);
            return (
              <label
                key={o}
                className={cn(
                  "flex cursor-pointer items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-colors",
                  isChecked ? "bg-primary-soft text-primary font-bold" : "text-foreground hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded-md accent-primary cursor-pointer"
                    checked={isChecked}
                    onChange={() => toggle(perkF, setPerkF, o)}
                  />
                  <span>{o}</span>
                </div>
                <span className="text-[10px] text-muted-foreground font-bold">{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Trust Assurance Card */}
      <div className="rounded-2xl border border-primary/20 bg-primary-soft/40 p-3.5 text-xs text-primary space-y-1">
        <p className="flex items-center gap-1.5 font-bold">
          <HiOutlineShieldCheck className="h-4 w-4" /> 100% Verified Employers
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Every hospital is accredited by NABH, JCI or state medical councils.
        </p>
      </div>
    </div>
  );

  return (
    <AppShell>
      {/* ================= SEARCH HERO DOCK ================= */}
      <div className="surface mb-5 sm:mb-7 rounded-3xl border border-border/80 bg-card p-3 sm:p-4 shadow-sm">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate({ search: { q: q.trim() || undefined } });
          }}
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
        >
          {/* Main search query */}
          <div className="flex flex-1 items-center gap-3 rounded-2xl bg-muted/40 px-3.5 py-1 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <HiOutlineMagnifyingGlass className="h-5 w-5 text-primary shrink-0" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Role, medical specialty, hospital or qualification"
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

          {/* City input */}
          <div className="flex flex-1 sm:max-w-xs items-center gap-3 rounded-2xl bg-muted/40 px-3.5 py-1 focus-within:bg-card focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <HiOutlineMapPin className="h-5 w-5 text-primary shrink-0" />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City or state"
              className="h-11 w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none font-medium"
            />
            {city && (
              <button
                type="button"
                onClick={() => setCity("")}
                className="rounded-full p-1 text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <HiXMark className="h-4 w-4" />
              </button>
            )}
          </div>

          <Button size="lg" className="h-12 rounded-2xl font-bold px-7 shadow-md">
            Search jobs
          </Button>
        </form>

        {/* Quick Keyword Chips */}
        <div className="mt-3 flex flex-wrap items-center gap-1.5 px-1 pt-1 text-xs">
          <span className="font-bold text-muted-foreground">Popular:</span>
          {popularSearches.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => {
                setQ(term);
                navigate({ search: { q: term } });
              }}
              className="rounded-lg bg-muted/50 px-2 py-1 font-semibold text-muted-foreground hover:bg-primary-soft hover:text-primary transition-colors cursor-pointer"
            >
              {term}
            </button>
          ))}
        </div>
      </div>

      {/* ================= MAIN CONTENT LAYOUT ================= */}
      <div className="grid gap-6 lg:grid-cols-[290px_1fr]">
        {/* Left Filters Sidebar (Only visible on desktop screens >= lg) */}
        <aside className="hidden lg:block surface h-fit rounded-3xl border border-border/80 bg-card p-5 shadow-xs space-y-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <h3 className="flex items-center gap-2 font-black text-sm text-foreground">
              <HiOutlineAdjustmentsHorizontal className="h-4.5 w-4.5 text-primary" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span className="rounded-full bg-primary text-white text-[10px] font-bold px-2 py-0.5">
                  {activeFilterCount}
                </span>
              )}
            </h3>

            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                Reset all
              </button>
            )}
          </div>

          {renderFilterSections()}
        </aside>

        {/* Right Jobs Feed */}
        <section className="space-y-4 min-w-0">
          {/* Mobile Filter Action Bar (Hidden on desktop, prominent on mobile) */}
          <div className="flex lg:hidden items-center gap-2 w-full min-w-0 overflow-hidden pb-1">
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className={cn(
                    "flex items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-bold shrink-0 border transition-all cursor-pointer shadow-2xs whitespace-nowrap",
                    activeFilterCount > 0
                      ? "border-primary bg-primary text-white"
                      : "border-border/80 bg-card text-foreground hover:bg-muted/50"
                  )}
                >
                  <HiOutlineAdjustmentsHorizontal className="h-4 w-4 shrink-0" />
                  <span className="shrink-0">Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="grid h-4.5 min-w-4.5 place-items-center rounded-full bg-white text-primary text-[10px] font-black px-1 shrink-0">
                      {activeFilterCount}
                    </span>
                  )}
                </button>
              </SheetTrigger>

              <SheetContent side="bottom" className="h-[88vh] max-h-[88vh] rounded-t-3xl p-0 flex flex-col bg-card border-border">
                {/* Pull handle indicator */}
                <div className="mx-auto mt-2.5 h-1.5 w-12 rounded-full bg-muted-foreground/30 shrink-0" />

                {/* Sheet Sticky Header */}
                <div className="flex items-center justify-between border-b border-border/70 px-5 py-3">
                  <SheetTitle className="flex items-center gap-2 text-base font-black text-foreground">
                    <HiOutlineAdjustmentsHorizontal className="h-5 w-5 text-primary" />
                    <span>Filters</span>
                    {activeFilterCount > 0 && (
                      <span className="rounded-full bg-primary text-white text-[10px] font-bold px-2 py-0.5">
                        {activeFilterCount}
                      </span>
                    )}
                  </SheetTitle>

                  {activeFilterCount > 0 && (
                    <button
                      type="button"
                      onClick={clearAll}
                      className="text-xs font-bold text-primary hover:underline cursor-pointer mr-6"
                    >
                      Reset all
                    </button>
                  )}
                </div>

                {/* Sheet Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                  {renderFilterSections()}
                </div>

                {/* Sheet Sticky Bottom CTA */}
                <div className="border-t border-border/70 p-4 bg-card/95 backdrop-blur-sm">
                  <Button
                    onClick={() => setMobileFilterOpen(false)}
                    className="w-full h-12 rounded-2xl font-bold text-sm shadow-md"
                  >
                    Show {list.length} {list.length === 1 ? "job" : "jobs"}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Quick Horizontal Scroll Pills on Mobile */}
            <div className="flex flex-1 items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 min-w-0 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => toggle(types, setTypes, "Full-time")}
                className={cn(
                  "rounded-xl px-2.5 py-1.5 text-xs font-bold shrink-0 whitespace-nowrap transition-colors cursor-pointer border",
                  types.includes("Full-time")
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                Full-time
              </button>
              <button
                type="button"
                onClick={() => toggle(shiftF, setShiftF, "Day")}
                className={cn(
                  "rounded-xl px-2.5 py-1.5 text-xs font-bold shrink-0 whitespace-nowrap transition-colors cursor-pointer border",
                  shiftF.includes("Day")
                    ? "border-primary bg-primary-soft text-primary"
                    : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                Day shift
              </button>
              <button
                type="button"
                onClick={() => toggle(deptF, setDeptF, "ICU & Critical Care")}
                className={cn(
                  "rounded-xl px-2.5 py-1.5 text-xs font-bold shrink-0 whitespace-nowrap transition-colors cursor-pointer border",
                  deptF.includes("ICU & Critical Care")
                    ? "border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300"
                    : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                ICU
              </button>
              <button
                type="button"
                onClick={() => toggle(cityF, setCityF, "Chennai")}
                className={cn(
                  "rounded-xl px-2.5 py-1.5 text-xs font-bold shrink-0 whitespace-nowrap transition-colors cursor-pointer border",
                  cityF.includes("Chennai")
                    ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                    : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                Chennai
              </button>
              <button
                type="button"
                onClick={() => toggle(cityF, setCityF, "Bengaluru")}
                className={cn(
                  "rounded-xl px-2.5 py-1.5 text-xs font-bold shrink-0 whitespace-nowrap transition-colors cursor-pointer border",
                  cityF.includes("Bengaluru")
                    ? "border-teal-500 bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                    : "border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                )}
              >
                Bengaluru
              </button>
            </div>
          </div>

          {/* Header & Segmented Sort Controller */}
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-border/60 pb-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                <span>{list.length} jobs for you</span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300">
                  Active
                </span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Verified listings from accredited healthcare institutions across India
              </p>
            </div>

            {/* Apple-style Segmented Sort */}
            <div className="flex items-center rounded-2xl bg-muted/60 p-1 text-xs font-semibold border border-border/50">
              {(
                [
                  ["match", "Best match"],
                  ["recent", "Most recent"],
                  ["salary", "Highest pay"],
                ] as const
              ).map(([k, l]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setSort(k)}
                  className={cn(
                    "rounded-xl px-3 py-1.5 transition-all cursor-pointer font-bold",
                    sort === k ? "bg-card text-primary shadow-xs" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Active Filter Dismissible Badges (Naukri/LinkedIn style) */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap items-center gap-2 py-1">
              <span className="text-xs font-bold text-muted-foreground">Active:</span>

              {deptF.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggle(deptF, setDeptF, d)}
                  className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300 px-2.5 py-1 text-xs font-bold hover:bg-indigo-100 transition-colors cursor-pointer"
                >
                  <span>{d}</span>
                  <HiXMark className="h-3.5 w-3.5" />
                </button>
              ))}

              {cityF.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => toggle(cityF, setCityF, c)}
                  className="inline-flex items-center gap-1 rounded-lg bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300 px-2.5 py-1 text-xs font-bold hover:bg-teal-100 transition-colors cursor-pointer"
                >
                  <span>{c}</span>
                  <HiXMark className="h-3.5 w-3.5" />
                </button>
              ))}

              {qualF.map((ql) => (
                <button
                  key={ql}
                  type="button"
                  onClick={() => toggle(qualF, setQualF, ql)}
                  className="inline-flex items-center gap-1 rounded-lg bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300 px-2.5 py-1 text-xs font-bold hover:bg-sky-100 transition-colors cursor-pointer"
                >
                  <span>{ql}</span>
                  <HiXMark className="h-3.5 w-3.5" />
                </button>
              ))}

              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggle(types, setTypes, t)}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary-soft text-primary px-2.5 py-1 text-xs font-bold hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  <span>{t}</span>
                  <HiXMark className="h-3.5 w-3.5" />
                </button>
              ))}

              {shiftF.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(shiftF, setShiftF, s)}
                  className="inline-flex items-center gap-1 rounded-lg bg-primary-soft text-primary px-2.5 py-1 text-xs font-bold hover:bg-primary/20 transition-colors cursor-pointer"
                >
                  <span>{s}</span>
                  <HiXMark className="h-3.5 w-3.5" />
                </button>
              ))}

              {salaryF.map((sal) => (
                <button
                  key={sal}
                  type="button"
                  onClick={() => toggle(salaryF, setSalaryF, sal)}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 px-2.5 py-1 text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  <span>{sal}</span>
                  <HiXMark className="h-3.5 w-3.5" />
                </button>
              ))}

              {expF.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => toggle(expF, setExpF, e)}
                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 px-2.5 py-1 text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
                >
                  <span>{e}</span>
                  <HiXMark className="h-3.5 w-3.5" />
                </button>
              ))}

              {orgF.map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => toggle(orgF, setOrgF, o)}
                  className="inline-flex items-center gap-1 rounded-lg bg-purple-50 text-purple-800 dark:bg-purple-950/50 dark:text-purple-300 px-2.5 py-1 text-xs font-bold hover:bg-purple-100 transition-colors cursor-pointer"
                >
                  <span>{o}</span>
                  <HiXMark className="h-3.5 w-3.5" />
                </button>
              ))}

              {perkF.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => toggle(perkF, setPerkF, p)}
                  className="inline-flex items-center gap-1 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 px-2.5 py-1 text-xs font-bold hover:bg-amber-100 transition-colors cursor-pointer"
                >
                  <span>{p}</span>
                  <HiXMark className="h-3.5 w-3.5" />
                </button>
              ))}

              <button
                type="button"
                onClick={clearAll}
                className="text-xs font-bold text-muted-foreground hover:text-foreground underline ml-1 cursor-pointer"
              >
                Clear all
              </button>
            </div>
          )}

          {/* Job Cards */}
          <div className="space-y-4">
            {list.map((j) => (
              <JobCard key={j.id} job={j} />
            ))}

            {!list.length && (
              <div className="surface p-12 text-center rounded-3xl border border-border/80">
                <HiOutlineMagnifyingGlass className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm font-bold text-foreground">No matching healthcare jobs found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Try adjusting your search query, city or removing some filters.
                </p>
                <Button variant="outline" size="sm" onClick={clearAll} className="mt-4 rounded-xl font-bold">
                  <HiOutlineArrowPath className="h-3.5 w-3.5 mr-1.5" />
                  Reset all filters
                </Button>
              </div>
            )}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
