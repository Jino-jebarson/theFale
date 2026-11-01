import type { ElementType } from "react";
import { Link } from "@tanstack/react-router";
import {
  HiOutlineAcademicCap,
  HiOutlineLockClosed,
  HiOutlineShieldCheck,
  HiOutlineBolt,
  HiOutlineSparkles,
} from "react-icons/hi2";
import { Button } from "@/components/ui/button";

export interface StudentLockCardProps {
  title: string;
  description: string;
  badgeText?: string;
  item3Title?: string;
  item3Desc?: string;
  item3Icon?: ElementType;
  primaryCtaText?: string;
  primaryCtaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

export function StudentLockCard({
  title,
  description,
  badgeText = "Post-Graduation Access",
  item3Title = "Instant Locum Shifts",
  item3Desc = "Access flexible 24/7 on-call duty passes & guaranteed payouts.",
  item3Icon: Item3Icon = HiOutlineBolt,
  primaryCtaText = "Explore Internships",
  primaryCtaLink = "/jobs",
  secondaryCtaText = "Earn Student CME Points",
  secondaryCtaLink = "/learning",
}: StudentLockCardProps) {
  return (
    <div className="rounded-3xl border border-primary/20 bg-gradient-to-b from-card via-card to-primary-soft/10 p-6 sm:p-8 shadow-xs text-center max-w-2xl mx-auto my-6 space-y-6">
      <div className="flex flex-col items-center gap-2.5">
        <div className="h-14 w-14 rounded-2xl bg-primary-soft text-primary flex items-center justify-center border border-primary/25 shadow-2xs">
          <HiOutlineAcademicCap className="h-7 w-7" />
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft text-primary border border-primary/20 px-3 py-0.5 text-[11px] font-bold">
          <HiOutlineLockClosed className="h-3.5 w-3.5" />
          <span>{badgeText}</span>
        </span>
      </div>

      <div className="space-y-1.5 max-w-lg mx-auto">
        <h2 className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {description}
        </p>
      </div>

      {/* Quick Highlights with styled icon tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-1">
        <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5 shadow-2xs hover:border-primary/30 transition-colors">
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/15 shadow-2xs">
            <HiOutlineAcademicCap className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Academic Training</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              Complete supervised hospital postings & college logbook.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5 shadow-2xs hover:border-primary/30 transition-colors">
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/15 shadow-2xs">
            <HiOutlineShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">Council License</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              Register with your Medical or Nursing Council upon graduation.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/80 bg-card p-4 space-y-2.5 shadow-2xs hover:border-primary/30 transition-colors">
          <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/15 shadow-2xs">
            <Item3Icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-bold text-foreground">{item3Title}</p>
            <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">
              {item3Desc}
            </p>
          </div>
        </div>
      </div>

      {/* Action CTAs */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
        <Button
          asChild
          size="sm"
          className="rounded-xl font-bold bg-primary hover:bg-primary-hover text-white shadow-xs px-5 h-9 cursor-pointer gap-2"
        >
          <Link to={primaryCtaLink} search={{ q: undefined }}>
            <HiOutlineSparkles className="h-4 w-4" />
            <span>{primaryCtaText}</span>
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          size="sm"
          className="rounded-xl font-bold border-border/80 px-5 h-9 cursor-pointer gap-2 hover:bg-muted/60"
        >
          <Link to={secondaryCtaLink}>
            <HiOutlineAcademicCap className="h-4 w-4 text-primary" />
            <span>{secondaryCtaText}</span>
          </Link>
        </Button>
      </div>
    </div>
  );
}
