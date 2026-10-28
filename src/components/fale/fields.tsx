import { useRef, useState, useEffect, useMemo, type InputHTMLAttributes, type ReactNode } from "react";
import { toast } from "sonner";
import {
  HiOutlineCloudArrowUp,
  HiOutlineDocumentText,
  HiCheckCircle,
  HiCheck,
  HiOutlineTrash,
  HiOutlineMapPin,
  HiChevronDown,
  HiChevronLeft,
  HiChevronRight,
  HiOutlinePhone,
  HiMagnifyingGlass,
  HiOutlineCalendar,
  HiOutlineXMark,
  HiOutlineShieldCheck,
  HiPlus,
} from "react-icons/hi2";
import { MdMyLocation } from "react-icons/md";
import { ImSpinner2 } from "react-icons/im";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { RiShieldKeyholeFill } from "react-icons/ri";

export function Label({ children, required, optional }: { children?: ReactNode | undefined; required?: boolean | undefined; optional?: boolean | undefined }) {
  if (!children) return null;
  return (
    <span className="mb-1.5 block text-[13px] font-semibold text-foreground">
      {children}
      {required && <span className="ml-0.5 text-destructive">*</span>}
      {optional && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>}
    </span>
  );
}

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  icon?: ReactNode;
  optional?: boolean;
  prefix?: string;
};

export function Field({ label, hint, icon, optional, prefix, className, ...rest }: FieldProps) {
  return (
    <label className={cn("block", className)}>
      <Label required={rest.required} optional={optional}>{label}</Label>
      <div className="relative flex items-center">
        {icon && <span className="pointer-events-none absolute left-3.5 text-muted-foreground [&_svg]:h-[18px] [&_svg]:w-[18px]">{icon}</span>}
        {prefix && <span className="pointer-events-none absolute left-3.5 text-sm font-semibold text-muted-foreground">{prefix}</span>}
        <input {...rest} className={cn("field-input h-[46px] rounded-xl", (icon || prefix) && "pl-11")} />
      </div>
      {hint && <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function PhoneField({
  label = "Mobile number",
  hint,
  required = true,
  className,
  value,
  onChange,
  ...rest
}: {
  label?: string;
  hint?: string;
  required?: boolean;
  className?: string;
} & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className={cn("block", className)}>
      <Label required={required}>{label}</Label>
      <div className="flex items-center gap-2.5">
        <div className="flex h-[46px] min-w-[54px] shrink-0 items-center justify-center rounded-xl border border-input bg-[#f4f7fb] dark:bg-muted/50 px-3.5 text-sm font-semibold text-foreground select-none">
          +91
        </div>
        <div className="relative flex-1">
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/80">
            <HiOutlinePhone className="h-[18px] w-[18px]" />
          </span>
          <input
            type="tel"
            inputMode="numeric"
            pattern="[0-9]{10}"
            maxLength={10}
            required={required}
            placeholder="10-digit mobile number"
            value={value}
            onChange={onChange}
            className="field-input h-[46px] rounded-xl pl-10 placeholder:text-muted-foreground/60"
            {...rest}
          />
        </div>
      </div>
      {hint && <span className="mt-1.5 block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}

export function SelectField({
  label,
  options,
  value,
  onChange,
  required,
  optional,
  placeholder = "Select an option",
  searchable,
  className,
  icon,
}: {
  label?: string | undefined;
  options: string[];
  value?: string | undefined;
  onChange: (v: string) => void;
  required?: boolean | undefined;
  optional?: boolean | undefined;
  placeholder?: string | undefined;
  searchable?: boolean | undefined;
  className?: string | undefined;
  icon?: ReactNode | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-enable search filter if list has more than 6 options (e.g. states, professions)
  const isSearchable = searchable ?? options.length > 6;

  const filtered = query.trim()
    ? options.filter((o) => o.toLowerCase().includes(query.toLowerCase()))
    : options;

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    if (open && isSearchable) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open, isSearchable]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const selectOption = (opt: string) => {
    onChange(opt);
    setOpen(false);
    setQuery("");
  };

  return (
    <div className={cn("block relative", className)} ref={containerRef}>
      {label && <Label required={required} optional={optional}>{label}</Label>}

      {/* Accessible hidden input to participate in HTML5 form validation */}
      <input
        type="text"
        required={required}
        value={value ?? ""}
        onChange={() => {}}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
        }}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Custom Select Trigger Button */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-[46px] w-full items-center justify-between rounded-xl border border-input bg-card px-3.5 text-sm transition-all text-left cursor-pointer select-none",
          open
            ? "border-primary ring-4 ring-primary/10 shadow-sm"
            : "hover:border-primary/50 hover:bg-slate-50/60 dark:hover:bg-muted/40",
          !value && "text-muted-foreground",
          value && "text-foreground font-medium",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icon && <span className="text-muted-foreground shrink-0 [&_svg]:h-[18px] [&_svg]:w-[18px]">{icon}</span>}
          <span className="truncate">{value || placeholder}</span>
        </div>
        <HiChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180 text-primary",
          )}
        />
      </button>

      {/* Animated Dropdown Menu Popover */}
      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-2xl border border-slate-200/90 bg-white p-1.5 shadow-xl shadow-slate-900/10 backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-150 dark:border-border dark:bg-card"
        >
          {/* Search input for long lists */}
          {isSearchable && (
            <div className="relative mb-1.5 px-1 pt-1">
              <HiMagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50/80 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none dark:border-border dark:bg-muted/50"
              />
            </div>
          )}

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 overscroll-contain">
            {filtered.length === 0 ? (
              <div className="py-4 text-center text-xs text-muted-foreground">
                No matching options
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = value === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => selectOption(opt)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm text-left transition-colors cursor-pointer select-none",
                      isSelected
                        ? "bg-primary-soft text-primary font-bold dark:bg-primary-soft/80"
                        : "text-foreground hover:bg-muted hover:text-primary dark:hover:bg-accent/50",
                    )}
                  >
                    <span className="truncate">{opt}</span>
                    {isSelected && (
                      <HiCheck className="h-4 w-4 shrink-0 text-primary stroke-[2.5]" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function MultiSelectField({
  label,
  options,
  value = "",
  onChange,
  required,
  optional,
  placeholder = "Select options",
  hint,
  className,
}: {
  label: string;
  options: string[];
  value?: string | string[];
  onChange: (v: string) => void;
  required?: boolean | undefined;
  optional?: boolean | undefined;
  placeholder?: string;
  hint?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selected: string[] = useMemo(() => {
    if (Array.isArray(value)) return value.filter(Boolean);
    if (typeof value === "string" && value.trim()) {
      return value.split(",").map((s) => s.trim()).filter(Boolean);
    }
    return [];
  }, [value]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    return options.filter((o) => o.toLowerCase().includes(query.toLowerCase()));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const toggleOption = (opt: string) => {
    const next = selected.includes(opt)
      ? selected.filter((x) => x !== opt)
      : [...selected, opt];
    onChange(next.join(", "));
  };

  const removeOption = (e: React.MouseEvent, opt: string) => {
    e.stopPropagation();
    const next = selected.filter((x) => x !== opt);
    onChange(next.join(", "));
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className={cn("block relative", className)} ref={containerRef}>
      <Label required={required} optional={optional}>{label}</Label>

      {/* Accessible hidden input for form validation */}
      <input
        type="text"
        required={required}
        value={selected.join(", ")}
        onChange={() => {}}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
        }}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Dropdown Trigger */}
      <div
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setOpen((prev) => !prev);
          }
        }}
        className={cn(
          "flex min-h-[46px] w-full items-center justify-between rounded-xl border border-input bg-card px-3 py-1.5 text-sm transition-all text-left cursor-pointer select-none",
          open
            ? "border-primary ring-4 ring-primary/10 shadow-sm"
            : "hover:border-primary/50 hover:bg-slate-50/60 dark:hover:bg-muted/40",
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 flex-1 pr-2">
          {selected.length === 0 ? (
            <span className="text-muted-foreground text-sm pl-0.5">{placeholder}</span>
          ) : (
            selected.map((city) => (
              <span
                key={city}
                className="inline-flex items-center gap-1 rounded-lg bg-primary-soft px-2.5 py-1 text-xs font-semibold text-primary border border-primary/20 dark:bg-primary-soft"
              >
                {city}
                <button
                  type="button"
                  onClick={(e) => removeOption(e, city)}
                  className="rounded hover:bg-primary/20 p-0.5 transition-colors cursor-pointer text-primary"
                  title={`Remove ${city}`}
                >
                  <HiOutlineXMark className="h-3 w-3 stroke-[2.5]" />
                </button>
              </span>
            ))
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={clearAll}
              title="Clear all"
              className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors cursor-pointer"
            >
              <HiOutlineXMark className="h-4 w-4" />
            </button>
          )}
          <HiChevronDown
            className={cn(
              "h-4 w-4 text-muted-foreground transition-transform duration-200",
              open && "rotate-180 text-primary",
            )}
          />
        </div>
      </div>

      {hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}

      {/* Popover */}
      {open && (
        <div
          role="listbox"
          className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xl shadow-slate-900/10 backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-150 dark:border-border dark:bg-card"
        >
          {/* Search box */}
          <div className="relative mb-2">
            <HiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search cities..."
              className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50/80 pl-8 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:bg-white focus:outline-none dark:border-border dark:bg-muted/50"
            />
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto space-y-0.5 overscroll-contain pr-1">
            {filtered.length === 0 ? (
              <div className="py-5 text-center text-xs text-muted-foreground">
                No matching cities found
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = selected.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => toggleOption(opt)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm text-left transition-colors cursor-pointer select-none",
                      isSelected
                        ? "bg-primary-soft text-primary font-bold dark:bg-primary-soft/80"
                        : "text-foreground hover:bg-muted hover:text-primary dark:hover:bg-accent/50",
                    )}
                  >
                    <span className="truncate">{opt}</span>
                    <div
                      className={cn(
                        "grid h-4 w-4 place-items-center rounded-md border transition-all shrink-0",
                        isSelected
                          ? "bg-primary border-primary text-white"
                          : "border-slate-300 dark:border-border",
                      )}
                    >
                      {isSelected && <HiCheck className="h-3 w-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 px-1 dark:border-border">
            <span className="text-xs font-medium text-slate-500">
              {selected.length === 0 ? "No city selected" : `${selected.length} city selected`}
            </span>
            <Button
              type="button"
              size="sm"
              onClick={() => setOpen(false)}
              className="h-7 rounded-lg bg-primary px-3 text-xs font-semibold text-white shadow-none hover:bg-primary-hover"
            >
              Done
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

const months = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function DateField({
  label,
  value,
  onChange,
  required,
  optional,
  min = "1940-01-01",
  max,
  placeholder = "Select date",
  className,
}: {
  label: string;
  value?: string;
  onChange: (v: string) => void;
  required?: boolean | undefined;
  optional?: boolean | undefined;
  min?: string;
  max?: string;
  placeholder?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const parsedDate = value ? new Date(value) : null;
  const initialYear = parsedDate && !isNaN(parsedDate.getTime())
    ? parsedDate.getFullYear()
    : max ? parseInt(max.split("-")[0], 10) : 2000;
  const initialMonth = parsedDate && !isNaN(parsedDate.getTime())
    ? parsedDate.getMonth()
    : 0;

  const [viewYear, setViewYear] = useState(initialYear);
  const [viewMonth, setViewMonth] = useState(initialMonth);

  useEffect(() => {
    if (value) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const startDay = new Date(viewYear, viewMonth, 1).getDay();

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const minYear = min ? parseInt(min.split("-")[0], 10) : 1940;
  const maxYear = max ? parseInt(max.split("-")[0], 10) : new Date().getFullYear() + 10;
  const yearOptions: number[] = [];
  for (let y = maxYear; y >= minYear; y--) {
    yearOptions.push(y);
  }

  const selectDay = (day: number) => {
    const mm = String(viewMonth + 1).padStart(2, "0");
    const dd = String(day).padStart(2, "0");
    const formatted = `${viewYear}-${mm}-${dd}`;
    onChange(formatted);
    setOpen(false);
  };

  const displayValue = parsedDate && !isNaN(parsedDate.getTime())
    ? `${String(parsedDate.getDate()).padStart(2, "0")} ${months[parsedDate.getMonth()].slice(0, 3)} ${parsedDate.getFullYear()}`
    : "";

  return (
    <div className={cn("block relative", className)} ref={containerRef}>
      <Label required={required} optional={optional}>{label}</Label>

      {/* Hidden input for HTML5 form validation */}
      <input
        type="text"
        required={required}
        value={value ?? ""}
        onChange={() => {}}
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          width: "1px",
          height: "1px",
          opacity: 0,
          pointerEvents: "none",
        }}
        tabIndex={-1}
        aria-hidden="true"
      />

      {/* Trigger Button */}
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex h-[46px] w-full items-center justify-between rounded-xl border border-input bg-card px-3.5 text-sm transition-all text-left cursor-pointer select-none",
          open
            ? "border-primary ring-4 ring-primary/10 shadow-sm"
            : "hover:border-primary/50 hover:bg-slate-50/60 dark:hover:bg-muted/40",
          !value && "text-muted-foreground",
          value && "text-foreground font-medium",
        )}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <HiOutlineCalendar className={cn("h-[18px] w-[18px] shrink-0 text-muted-foreground", open && "text-primary")} />
          <span className="truncate">{displayValue || placeholder}</span>
        </div>
        <HiChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180 text-primary",
          )}
        />
      </button>

      {/* Custom Calendar Dropdown Popover */}
      {open && (
        <div
          role="dialog"
          aria-label={label}
          className="absolute left-0 right-0 w-full top-[calc(100%+6px)] z-50 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-2xl shadow-slate-900/10 backdrop-blur-sm animate-in fade-in-0 zoom-in-95 duration-150 dark:border-border dark:bg-card"
        >
          {/* Header with Month + Year Selectors */}
          <div className="mb-3 flex items-center justify-between gap-1 border-b border-slate-100 pb-2.5 dark:border-border">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-muted transition-colors cursor-pointer"
            >
              <HiChevronLeft className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-1.5 flex-1 justify-center min-w-0">
              <select
                value={viewMonth}
                onChange={(e) => setViewMonth(parseInt(e.target.value, 10))}
                className="h-8 flex-1 max-w-[115px] rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-800 focus:border-primary focus:outline-none dark:border-border dark:bg-muted dark:text-foreground cursor-pointer"
              >
                {months.map((m, idx) => (
                  <option key={m} value={idx}>{m}</option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => setViewYear(parseInt(e.target.value, 10))}
                className="h-8 w-[74px] shrink-0 rounded-lg border border-slate-200 bg-slate-50 px-2 text-xs font-semibold text-slate-800 focus:border-primary focus:outline-none dark:border-border dark:bg-muted dark:text-foreground cursor-pointer"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-muted transition-colors cursor-pointer"
            >
              <HiChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Days of week header */}
          <div className="mb-1.5 grid grid-cols-7 text-center text-[11px] font-bold uppercase tracking-wider text-muted-foreground justify-items-center">
            {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
              <div key={d} className="py-1 w-8 text-center">{d}</div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-1 justify-items-center">
            {Array.from({ length: startDay }).map((_, idx) => (
              <div key={`empty-${idx}`} className="h-8 w-8" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const day = idx + 1;
              const iso = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const isSelected = value === iso;
              const isBeyondMax = max ? iso > max : false;
              const isBeforeMin = min ? iso < min : false;
              const isDisabled = isBeyondMax || isBeforeMin;

              return (
                <button
                  key={day}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => selectDay(day)}
                  className={cn(
                    "grid h-8 w-8 place-items-center rounded-lg text-xs font-semibold transition-all select-none cursor-pointer",
                    isSelected
                      ? "bg-primary text-white shadow-sm font-bold scale-105"
                      : "text-foreground hover:bg-primary-soft hover:text-primary dark:hover:bg-accent",
                    isDisabled && "opacity-25 cursor-not-allowed hover:bg-transparent hover:text-foreground",
                  )}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* Quick Clear Action if not required */}
          {value && (
            <div className="mt-3 border-t border-slate-100 pt-2 text-right dark:border-border">
              <button
                type="button"
                onClick={() => { onChange(""); setOpen(false); }}
                className="text-xs font-semibold text-slate-500 hover:text-destructive transition-colors cursor-pointer"
              >
                Clear date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ChipGroup({
  label,
  options,
  value,
  onChange,
  multi,
  required,
  allowCustom,
  customPlaceholder,
}: {
  label: string;
  options: string[];
  value: string | string[];
  onChange: (v: string | string[]) => void;
  multi?: boolean;
  required?: boolean;
  allowCustom?: boolean;
  customPlaceholder?: string;
}) {
  const [customInput, setCustomInput] = useState("");
  const arr = Array.isArray(value) ? value : value ? [value] : [];

  // Combine predefined options with any custom skills/options already in value
  const allOptions = Array.from(new Set([...options, ...arr]));

  const handleAddCustom = () => {
    const trimmed = customInput.trim();
    if (!trimmed) return;
    if (!arr.includes(trimmed)) {
      if (multi) {
        onChange([...arr, trimmed]);
      } else {
        onChange(trimmed);
      }
    }
    setCustomInput("");
  };

  return (
    <div className="space-y-2.5">
      <Label required={required}>{label}</Label>
      <div className="flex flex-wrap gap-2 pt-0.5">
        {allOptions.map((o) => {
          const on = arr.includes(o);
          const isCustom = !options.includes(o);
          return (
            <Button
              type="button"
              variant="outline"
              size="sm"
              aria-pressed={on}
              key={o}
              onClick={() => (multi ? onChange(on ? arr.filter((x) => x !== o) : [...arr, o]) : onChange(o))}
              className={cn(
                "rounded-xl border h-10 px-3.5 text-[13px] font-medium transition-all shadow-none group",
                on
                  ? "border-primary bg-primary text-primary-foreground font-semibold shadow-sm hover:bg-primary/95 hover:text-white"
                  : "border-input bg-card text-foreground hover:border-primary/50 hover:bg-accent/40",
              )}
            >
              {on && <HiCheck className="mr-1 h-3.5 w-3.5 stroke-[2.5]" />}
              {o}
              {isCustom && (
                <span
                  role="button"
                  tabIndex={0}
                  title="Remove custom skill"
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(arr.filter((x) => x !== o));
                  }}
                  className={cn(
                    "ml-1.5 -mr-1 rounded-full p-0.5 transition-colors cursor-pointer",
                    on
                      ? "hover:bg-black/20 text-white/80 hover:text-white"
                      : "hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                  )}
                >
                  <HiOutlineXMark className="h-3 w-3" />
                </span>
              )}
            </Button>
          );
        })}
      </div>

      {allowCustom && (
        <div className="flex items-center gap-2 pt-1 max-w-md">
          <div className="relative flex-1">
            <input
              type="text"
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddCustom();
                }
              }}
              placeholder={customPlaceholder || "Add a skill that's not listed"}
              className="h-10 w-full rounded-xl border border-input bg-card px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>
          <Button
            type="button"
            size="sm"
            onClick={handleAddCustom}
            disabled={!customInput.trim()}
            className="h-10 px-4 rounded-xl bg-primary text-white font-bold hover:bg-primary-hover transition-all cursor-pointer shadow-sm shadow-primary/25 shrink-0 disabled:opacity-50"
          >
            <HiPlus className="mr-1 h-3.5 w-3.5 stroke-[2.5]" />
            Add
          </Button>
        </div>
      )}
    </div>
  );
}

export function SegmentedControl({
  label,
  options,
  value,
  onChange,
  required,
  optional,
  className,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  optional?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("block", className)}>
      <Label required={required} optional={optional}>{label}</Label>
      <div className="flex h-[46px] w-full items-center rounded-xl border border-input bg-[#f4f7fb] dark:bg-muted/50 p-1 gap-1">
        {options.map((o) => {
          const active = value === o;
          return (
            <button
              type="button"
              key={o}
              onClick={() => onChange(o)}
              className={cn(
                "flex-1 h-full rounded-lg text-[13px] font-semibold transition-all select-none flex items-center justify-center cursor-pointer",
                active
                  ? "bg-white dark:bg-card text-primary shadow-sm font-bold border border-border/80"
                  : "text-muted-foreground hover:text-foreground hover:bg-white/40"
              )}
            >
              {active && <HiCheck className="mr-1 h-3.5 w-3.5 stroke-[2.5]" />}
              {o}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface AddressValue { address?: string; city?: string; state?: string; pincode?: string }

export function AddressField({
  value, onChange, label = "Address",
}: { value: AddressValue; onChange: (v: AddressValue) => void; label?: string }) {
  const [loading, setLoading] = useState(false);

  const locate = () => {
    if (!navigator.geolocation) { toast.error("Location isn't supported on this device."); return; }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`,
            { headers: { Accept: "application/json" } },
          );
          const d = await r.json();
          const a = d.address ?? {};
          onChange({
            address: d.display_name ?? `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`,
            city: a.city || a.town || a.village || a.county || value.city,
            state: a.state || value.state,
            pincode: a.postcode || value.pincode,
          });
          toast.success("Current location added");
        } catch {
          onChange({ ...value, address: `${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` });
        } finally {
          setLoading(false);
        }
      },
      () => {
        setLoading(false);
        toast.error("Please allow location access, or type your address.");
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <div>
      <Label required>{label}</Label>
      <div className="relative">
        <HiOutlineMapPin className="pointer-events-none absolute left-3.5 top-3.5 h-[18px] w-[18px] text-muted-foreground" />
        <textarea
          aria-label={label}
          required
          rows={3}
          value={value.address ?? ""}
          onChange={(e) => onChange({ ...value, address: e.target.value })}
          placeholder="House / flat no., street, area, landmark"
          className="field-input h-auto resize-none py-3 pl-11 rounded-xl"
        />
      </div>
      <Button
        type="button"
        variant="link"
        size="sm"
        onClick={locate}
        disabled={loading}
        className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-semibold text-primary hover:text-primary-hover disabled:opacity-60"
      >
        {loading ? <ImSpinner2 className="h-4 w-4 animate-spin" /> : <MdMyLocation className="h-4 w-4" />}
        {loading ? "Detecting your location…" : "Use my current location"}
      </Button>
    </div>
  );
}

export function UploadBox({
  label,
  hint,
  file,
  onFile,
  required = true,
  isDigiLocker,
  onDigiLocker,
  isVerified,
}: {
  label: string;
  hint?: string;
  file?: string | undefined;
  onFile: (name: string | undefined) => void;
  required?: boolean;
  isDigiLocker?: boolean;
  onDigiLocker?: () => void;
  isVerified?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);

  const take = (f?: File) => {
    if (!f) return;
    if (f.size > 10 * 1024 * 1024 || !/\.(pdf|jpe?g|png)$/i.test(f.name)) {
      toast.error("Choose a PDF, JPG or PNG under 10 MB.");
      return;
    }
    onFile(f.name);
    toast.success(`${label} attached`);
  };

  if (file) {
    const isDl = isVerified || file.includes("DigiLocker");
    return (
      <div
        className={cn(
          "flex items-center gap-2.5 sm:gap-3.5 rounded-2xl border p-3 sm:p-4 transition-all min-w-0",
          isDl
            ? "border-emerald-300 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20"
            : "border-success/40 bg-success-soft",
        )}
      >
        <span
          className={cn(
            "grid h-10 w-10 sm:h-12 sm:w-12 shrink-0 place-items-center rounded-xl",
            isDl ? "bg-emerald-600 text-white shadow-sm" : "bg-card text-success",
          )}
        >
          {isDl ? (
            <HiOutlineShieldCheck className="h-5 w-5 sm:h-6 sm:w-6" />
          ) : (
            <HiOutlineDocumentText className="h-5 w-5 sm:h-6 sm:w-6" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[13px] font-bold text-slate-900 dark:text-foreground">{label}</span>
            {isDl && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300">
                <HiCheck className="h-3 w-3 stroke-[3]" /> DigiLocker Verified
              </span>
            )}
          </div>
          <div className="truncate text-xs text-slate-600 dark:text-muted-foreground mt-0.5 font-medium">
            {isDl ? "e-Aadhaar XML Certificate · Issued by UIDAI (Govt. of India)" : file}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <HiCheckCircle className={cn("h-5 w-5", isDl ? "text-emerald-600" : "text-success")} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onFile(undefined)}
            aria-label={`Remove ${label}`}
            className="h-8 w-8 text-muted-foreground hover:bg-card hover:text-destructive"
          >
            <HiOutlineTrash className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  if (isDigiLocker) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-gradient-to-r from-primary-soft/60 via-card to-card p-4 transition-all hover:border-primary/50 dark:border-border dark:from-card dark:to-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
          <div className="flex items-start gap-3.5 min-w-0">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary dark:bg-primary-soft">
              <HiOutlineShieldCheck className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-slate-900 dark:text-foreground">
                {label} {required ? <span className="text-destructive">*</span> : <span className="text-xs font-normal text-muted-foreground">(optional)</span>}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {hint ?? "Aadhaar, PAN, Passport or Voter ID"}
              </p>
            </div>
          </div>

          <div className="flex items-center shrink-0">
            <Button
              type="button"
              onClick={onDigiLocker}
              className="h-10 rounded-xl bg-[#0047AB] px-4 text-xs font-bold text-white shadow-sm hover:bg-[#00388A] transition-all flex items-center gap-2 cursor-pointer"
            >
              <RiShieldKeyholeFill className="h-4 w-4 shrink-0 text-white" />
              Verify with DigiLocker
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => ref.current?.click()}
      onKeyDown={(e) => e.key === "Enter" && ref.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); take(e.dataTransfer.files[0]); }}
      className={cn(
        "flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-all",
        drag ? "border-primary bg-primary-soft" : "border-input bg-card hover:border-primary hover:bg-primary-soft/50",
      )}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
        <HiOutlineCloudArrowUp className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-semibold">
          {label} {required ? <span className="text-destructive">*</span> : <span className="text-xs font-normal text-muted-foreground">(optional)</span>}
        </div>
        <div className="text-xs text-muted-foreground">{hint ?? "Drag & drop or browse"} · PDF, JPG, PNG up to 10 MB</div>
      </div>
      <span className="hidden text-[13px] font-semibold text-primary sm:block">Browse</span>
      <input ref={ref} type="file" hidden accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => take(e.target.files?.[0])} />
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  desc,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  desc?: string;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onChange(!checked)}
      onKeyDown={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          onChange(!checked);
        }
      }}
      className="flex w-full cursor-pointer items-center justify-between gap-4 border-b border-input py-4 text-left select-none outline-none"
    >
      <div>
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        {desc && <span className="block text-xs text-muted-foreground mt-0.5">{desc}</span>}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onChange}
        onClick={(e) => e.stopPropagation()}
        aria-label={label}
      />
    </div>
  );
}
