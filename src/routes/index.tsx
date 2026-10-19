import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { HiOutlineBriefcase, HiOutlineBuildingOffice2, HiArrowRight, HiOutlineShieldCheck } from "react-icons/hi2";
import { AuthLayout } from "@/components/fale/AuthLayout";
import { setState } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FALE — Your next chapter in healthcare" },
      { name: "description", content: "Find verified healthcare jobs and shifts, or hire verified healthcare professionals — all on FALE." },
      { property: "og:title", content: "FALE — Your next chapter in healthcare" },
      { property: "og:description", content: "Find verified healthcare jobs and shifts, or hire verified healthcare professionals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Entry,
});

function Entry() {
  const navigate = useNavigate();
  const pick = (portal: "candidate" | "facility") => {
    setState({ portal });
    navigate({ to: "/login" });
  };
  const options = [
    { p: "candidate" as const, icon: HiOutlineBriefcase, title: "I'm looking for a job", desc: "Discover jobs & shifts made for your healthcare career." },
    { p: "facility" as const, icon: HiOutlineBuildingOffice2, title: "I'm hiring for my organization", desc: "Find verified people for your healthcare team." },
  ];
  return (
    <AuthLayout>
      <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
        Welcome to FALE
      </p>
      <h1 className="mt-2.5 text-[32px] sm:text-[36px] font-extrabold leading-[1.18] tracking-tight text-foreground">
        How would you like to use
        <br />
        FALE?
      </h1>
      <p className="mt-2.5 text-[15px] text-muted-foreground">
        Choose one to continue. You can switch later.
      </p>
      <div className="mt-8 space-y-3">
        {options.map((o) => (
          <button key={o.p} onClick={() => pick(o.p)} className="group flex w-full items-center gap-4 rounded-2xl border border-input bg-card p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-card">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <o.icon className="h-6 w-6" />
            </span>
            <span className="flex-1">
              <span className="block font-bold">{o.title}</span>
              <span className="block text-sm text-muted-foreground">{o.desc}</span>
            </span>
            <HiArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
          </button>
        ))}
      </div>
      <p className="mt-8 flex items-center gap-2 text-xs text-muted-foreground">
        <HiOutlineShieldCheck className="h-4 w-4 text-primary" /> For healthcare professionals and registered healthcare organizations.
      </p>
    </AuthLayout>
  );
}
