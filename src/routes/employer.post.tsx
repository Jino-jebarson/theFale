import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { HiOutlineBriefcase, HiOutlineBolt } from "react-icons/hi2";
import { toast } from "sonner";
import { AppShell, PageHead } from "@/components/fale/AppShell";
import { ChipGroup, Field, SelectField, Toggle } from "@/components/fale/fields";
import { Button } from "@/components/ui/button";
import { professions } from "@/lib/data";
import { setState } from "@/lib/store";

export const Route = createFileRoute("/employer/post")({
  head: () => ({
    meta: [
      { title: "Post a job — FALE" },
      { name: "description", content: "Create a clear healthcare job requirement and reach verified professionals." },
      { property: "og:title", content: "Post a job — FALE" },
      { property: "og:description", content: "Reach verified healthcare professionals on FALE." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Post,
});

function Post() {
  const navigate = useNavigate();
  const [d, setD] = useState<Record<string, string | string[] | boolean>>({ openings: "1" });
  const set = (k: string) => (v: unknown) => setD((x) => ({ ...x, [k]: v as string }));
  const val = (k: string) => (d[k] as string) ?? "";

  const submit = (status: string) => (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!val("title")) { toast.error("Add a job title first"); return; }
    const newId = crypto.randomUUID();
    const isPublishing = status === "Open";
    const postingStatus = isPublishing ? "Pending Admin Approval" : "Draft";

    setState((s) => ({
      postedJobs: [{ id: newId, title: val("title"), dept: val("dept") || "General", openings: Number(val("openings")) || 1, status: postingStatus }, ...s.postedJobs],
      jobApprovals: isPublishing
        ? [
            {
              id: newId,
              title: val("title"),
              org: String(s.profile["org"] || "Hospital Network"),
              type: "job" as const,
              dept: val("dept") || "General",
              city: String(s.profile["city"] || "Bengaluru"),
              compensation: val("min") && val("max") ? `₹${val("min")} – ₹${val("max")} / mo` : "₹40,000 – ₹55,000 / mo",
              expOrHours: String(d["exp"] || "2–5 yrs"),
              status: "pending" as const,
              submittedDate: "Just now",
              openings: Number(val("openings")) || 1,
              postedBy: String(s.profile["recruiter"] || "Facility HR"),
              urgent: Boolean(d["urgent"]),
            },
            ...s.jobApprovals,
          ]
        : s.jobApprovals,
    }));

    if (isPublishing) {
      toast.success("Submitted for Admin Verification!", {
        description: "Your requirement has been sent to FALE Admin. Once verified, it will reflect in the Candidate Portal.",
      });
    } else {
      toast.success("Draft saved");
    }
    navigate({ to: "/employer" });
  };

  return (
    <AppShell>
      <form onSubmit={submit("Open")} className="mx-auto max-w-3xl space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <PageHead title="A clear requirement. A better match." sub="Be specific about the role, hours, responsibilities and pay." />
          <div className="inline-flex rounded-xl p-1 bg-muted border border-border shadow-2xs shrink-0 self-start sm:self-auto">
            <span className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-card text-foreground shadow-xs border border-border/60 flex items-center gap-1.5">
              <HiOutlineBriefcase className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Permanent Job</span>
            </span>
            <Link
              to="/employer/post-shift"
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5"
            >
              <HiOutlineBolt className="h-3.5 w-3.5 text-emerald-500" />
              <span>On-Demand Shift</span>
            </Link>
          </div>
        </div>
        <section className="surface space-y-4 p-6">
          <p className="eyebrow">01 · The role</p>
          <Field label="Job title" required value={val("title")} onChange={(e) => set("title")(e.target.value)} placeholder="e.g. Staff Nurse — ICU" />
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField label="Profession" required options={professions} value={val("role")} onChange={set("role")} />
            <Field label="Department" required value={val("dept")} onChange={(e) => set("dept")(e.target.value)} placeholder="e.g. Critical care" />
          </div>
          <ChipGroup label="Employment type" required options={["Full-time", "Part-time", "Contract", "Internship"]} value={val("type")} onChange={set("type")} />
        </section>
        <section className="surface space-y-4 p-6">
          <p className="eyebrow">02 · The details</p>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Min salary / month" required prefix="₹" inputMode="numeric" value={val("min")} onChange={(e) => set("min")(e.target.value)} />
            <Field label="Max salary / month" required prefix="₹" inputMode="numeric" value={val("max")} onChange={(e) => set("max")(e.target.value)} />
            <Field label="Openings" required type="number" min={1} max={100} value={val("openings")} onChange={(e) => set("openings")(e.target.value)} />
          </div>
          <ChipGroup label="Experience" required options={["Fresher", "0–2 yrs", "2–5 yrs", "5+ yrs"]} value={val("exp")} onChange={set("exp")} />
          <ChipGroup label="Shift" multi options={["Day", "Night", "Rotational"]} value={(d["shift"] as string[]) ?? []} onChange={set("shift")} />
          <label className="block">
            <span className="mb-1.5 block text-[13px] font-semibold">Responsibilities & requirements <span className="text-destructive">*</span></span>
            <textarea required rows={5} value={val("desc")} onChange={(e) => set("desc")(e.target.value)} placeholder="Duties, qualifications, registrations and benefits…" className="field-input h-auto resize-none py-3" />
          </label>
        </section>
        <section className="surface space-y-4 p-6">
          <p className="eyebrow">03 · Screening</p>
          <Toggle label="Require professional registration" desc="Only show applicants with a verified council registration" checked={!!d["reg"]} onChange={set("reg")} />
          <Toggle label="Mark as urgent" desc="Highlight this role to available candidates" checked={!!d["urgent"]} onChange={set("urgent")} />
        </section>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => submit("Draft")()}>Save draft</Button>
          <Button size="lg">Publish job</Button>
        </div>
      </form>
    </AppShell>
  );
}
