import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { HiCheck } from "react-icons/hi2";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import candidateImg from "@/assets/auth-candidate.jpeg";
import facilityImg from "@/assets/auth-facility.jpeg";

export function AuthLayout({
  children,
  variant = "candidate",
  bannerTitle,
  bannerSubtitle,
  bannerEyebrow,
  bannerPoints,
}: {
  children: ReactNode;
  variant?: "candidate" | "facility";
  bannerTitle?: ReactNode;
  bannerSubtitle?: ReactNode;
  bannerEyebrow?: string | null;
  bannerPoints?: string[] | null;
}) {
  const f = variant === "facility";

  const defaultPoints = f
    ? [
      "Post verified healthcare requirements",
      "Review relevant, verified profiles",
      "Manage interviews, offers & shifts",
    ]
    : [
      "Verified hospitals and clinics only",
      "Jobs matched to your skills and city",
      "Track every application in one place",
    ];

  const points = bannerPoints !== undefined ? bannerPoints : defaultPoints;
  const showEyebrow = bannerEyebrow === undefined ? true : Boolean(bannerEyebrow);
  const eyebrowText =
    typeof bannerEyebrow === "string" ? bannerEyebrow : "Healthcare · Human connections";

  return (
    <div className="grid min-h-screen bg-card lg:grid-cols-[1.05fr_1fr]">
      {/* Left Healthcare Hero Banner - locked to viewport height */}
      <aside className="relative hidden overflow-hidden lg:block select-none lg:sticky lg:top-0 lg:h-screen">
        {/* Background Image - original position preserved without artificial shift */}
        <img
          src={f ? facilityImg : candidateImg}
          alt={f ? "Hospital team reviewing candidates" : "Healthcare professional in hospital"}
          className="absolute inset-0 h-full w-full object-cover"
          width={1024}
          height={1344}
        />

        {/* Subtle, soft blue gradient specifically behind the text area */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e2246]/70 via-[#122c59]/40 via-50% to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0e2246]/45 via-transparent to-transparent pointer-events-none" />

        {/* Content Container */}
        <div className="relative flex h-full flex-col justify-between p-8 sm:p-10 xl:p-12 text-white">
          {/* Top Logo */}
          <div className="shrink-0 pt-1">
            <Logo inverted />
          </div>

          {/* Bottom Content positioned slightly lower */}
          <div className="mt-auto max-w-xl pb-6 sm:pb-8 xl:pb-10">
            {/* Eyebrow */}
            {showEyebrow && (
              <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-white/90">
                {eyebrowText}
              </p>
            )}

            {/* Headline */}
            <h1 className="mt-2.5 font-extrabold tracking-tight text-white leading-[1.14]">
              {bannerTitle ? (
                bannerTitle
              ) : (
                <>
                  <span className="block text-[28px] sm:text-[32px] lg:text-[34px] xl:text-[38px] whitespace-nowrap">
                    {f ? "Better healthcare hiring" : "Your future in healthcare"}
                  </span>
                  <span className="block text-[28px] sm:text-[32px] lg:text-[34px] xl:text-[38px]">
                    starts here.
                  </span>
                </>
              )}
            </h1>

            {/* Subtitle */}
            {bannerSubtitle && (
              <p className="mt-2.5 text-sm sm:text-[15px] font-normal leading-relaxed text-white/90 max-w-lg">
                {bannerSubtitle}
              </p>
            )}

            {/* Check Items */}
            {points && points.length > 0 && (
              <ul className="mt-6 space-y-3.5">
                {points.map((p) => (
                  <li
                    key={p}
                    className="flex items-center gap-3.5 text-[15px] font-medium text-white/95"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-[2px]">
                      <HiCheck className="h-3 w-3 stroke-[2.5]" />
                    </span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </aside>

      {/* Right Form Main Area */}
      <main className="flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 sm:px-10">
          <Link to="/" className="lg:invisible">
            <Logo />
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <a
              href="mailto:support@fale.in"
              className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            >
              Need help?
            </a>
          </div>
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-10 sm:px-10">
          <div className="w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </div>
        <p className="pb-6 text-center text-xs text-muted-foreground">
          © 2026 FALE · Privacy · Terms
        </p>
      </main>
    </div>
  );
}
