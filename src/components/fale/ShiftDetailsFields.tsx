import type { ShiftDetails } from "@/lib/adapters/shiftAdapter";
import { SelectField } from "@/components/fale/fields";
import { cn } from "@/lib/utils";

export const SHIFT_PROFESSIONS = [
  "Doctor",
  "Nurse",
  "Physiotherapist",
  "Lab Technician",
  "Radiographer",
  "Pharmacist",
  "Dialysis Technician",
  "OT Technician",
  "Anaesthesia Technician",
  "Paramedic",
  "Respiratory Therapist",
  "Cardiac Care Technician",
  "Occupational Therapist",
  "Speech Therapist",
  "Optometrist",
  "Dietitian",
  "Phlebotomist",
  "Audiologist",
  "Dental Hygienist",
  "Medical Coder",
];

export function ShiftDetailsFields({
  value,
  onChange,
}: {
  value: ShiftDetails;
  onChange: (value: ShiftDetails) => void;
}) {
  const update = (key: keyof ShiftDetails, next: string | number | boolean) =>
    onChange({ ...value, [key]: next });

  const input = (
    label: string,
    key: keyof ShiftDetails,
    required = false,
    placeholder?: string
  ) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-foreground">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      <input
        required={required}
        maxLength={key === "reportingNotes" ? 2000 : 255}
        value={String(value[key] ?? "")}
        onChange={(event) => update(key, event.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-3.5 rounded-xl border border-input bg-background text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
      />
    </div>
  );

  return (
    <div className="space-y-5 rounded-2xl border border-border/80 bg-card p-4 sm:p-6 shadow-2xs">
      {/* 01: Candidate requirements */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Candidate Requirements
          </p>
        </div>

        <SelectField
          label="Profession"
          required
          options={SHIFT_PROFESSIONS}
          value={value.profession || ""}
          onChange={(val) => update("profession", val)}
          placeholder="Select profession"
          searchable
        />

        <div className="grid gap-3 sm:grid-cols-2 pt-1">
          {(
            [
              ["registrationRequired", "Verified registration required"],
              ["blsRequired", "Verified BLS certificate required"],
              ["aclsRequired", "Verified ACLS certificate required"],
              ["icuExperienceRequired", "ICU experience required"],
            ] as const
          ).map(([key, label]) => (
            <label
              key={key}
              className="flex items-center gap-2.5 text-xs font-medium text-foreground cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={Boolean(value[key])}
                onChange={(event) => update(key, event.target.checked)}
                className="h-4 w-4 rounded-md border-input text-primary focus:ring-primary/20 accent-primary cursor-pointer"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>

        <SelectField
          label="Minimum experience"
          options={["No minimum", "2+ years", "5+ years"]}
          value={
            value.minimumExperienceYears === 2
              ? "2+ years"
              : value.minimumExperienceYears === 5
              ? "5+ years"
              : "No minimum"
          }
          onChange={(val) =>
            update(
              "minimumExperienceYears",
              val === "2+ years" ? 2 : val === "5+ years" ? 5 : 0
            )
          }
          placeholder="Select minimum experience"
        />
      </div>

      <div className="border-t border-border/60" />

      {/* 02: Arrival instructions */}
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
            Arrival Instructions
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            These details are shown to candidates only after hospital confirmation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {input("Report to", "reportTo", true, "e.g. Nursing Superintendent, Dr. Sharma")}
          {input(
            "Block / floor / ward",
            "reportLocation",
            true,
            "e.g. Tower B, 3rd Floor, ICU-A"
          )}
        </div>

        <SelectField
          label="Dress requirement"
          options={[
            "Not specified",
            "Own scrubs",
            "Hospital gives a uniform",
            "Formals with an apron",
          ]}
          value={value.dressRequirement || "Not specified"}
          onChange={(val) =>
            update("dressRequirement", val === "Not specified" ? "" : val)
          }
          placeholder="Select dress requirement"
        />

        <div className="space-y-1.5">
          <span className="block text-xs font-semibold text-foreground">
            Items to bring on duty
          </span>
          <div className="flex flex-wrap gap-2.5 pt-0.5">
            {[
              "Council ID card",
              "Government photo ID",
              "BLS card",
              "Stethoscope",
            ].map((item) => {
              const selected = (value.itemsToBring || "")
                .split(",")
                .filter(Boolean);
              const isChecked = selected.includes(item);
              return (
                <label
                  key={item}
                  className={cn(
                    "inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer select-none",
                    isChecked
                      ? "bg-primary/10 text-primary border-primary/30 font-bold"
                      : "bg-muted/30 border-border/70 text-foreground hover:bg-muted/60"
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(event) =>
                      update(
                        "itemsToBring",
                        (event.target.checked
                          ? [...selected, item]
                          : selected.filter((v) => v !== item)
                        ).join(",")
                      )
                    }
                    className="h-3.5 w-3.5 rounded border-input text-primary focus:ring-primary/20 accent-primary cursor-pointer"
                  />
                  <span>{item}</span>
                </label>
              );
            })}
          </div>
        </div>

        {input(
          "Reporting note (optional)",
          "reportingNotes",
          false,
          "e.g. Enter via staff gate 2, show council registration at security"
        )}
      </div>
    </div>
  );
}

export function ShiftRequirements({ details }: { details?: ShiftDetails | undefined }) {
  if (!details) return null;
  const labels = [details.profession, details.registrationRequired && "Verified registration", details.blsRequired && "Verified BLS", details.aclsRequired && "Verified ACLS", details.icuExperienceRequired && "ICU experience", Boolean(details.minimumExperienceYears) && `${details.minimumExperienceYears}+ years experience`].filter(Boolean);
  return <div className="flex flex-wrap gap-1.5">{labels.map(label => <span key={String(label)} className="rounded-lg border bg-muted/30 px-2 py-1 text-[11px]">{label}</span>)}</div>;
}

export function ShiftArrivalInstructions({ details }: { details?: ShiftDetails | undefined }) {
  if (!details?.reportTo && !details?.reportLocation) return null;
  return <div className="rounded-xl border bg-muted/30 p-3 text-xs space-y-1">
    <strong>Confirmed arrival instructions</strong>
    <p>Report to: {details.reportTo}</p><p>Where: {details.reportLocation}</p>
    {details.dressRequirement && <p>Dress: {details.dressRequirement}</p>}
    {details.itemsToBring && <p>Bring: {details.itemsToBring.split(",").join(", ")}</p>}
    {details.reportingNotes && <p>{details.reportingNotes}</p>}
  </div>;
}
