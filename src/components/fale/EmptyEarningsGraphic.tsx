import { LottieAnimation } from "@/components/fale/LottieAnimation";
import lottieEmptyEarnings from "@/assets/lottie-empty-earnings.json";
import { cn } from "@/lib/utils";

interface EmptyEarningsGraphicProps {
  className?: string;
}

/**
 * Empty Earnings Animation by Amine Elwadi from LottieFiles:
 * - Expressive sad/no-result face with smooth drop-in and head-shake keyframes
 * - Animated via lottie-web at 30/60fps
 * - Themed in project FALE Saffron (#FF5A1F) with ambient atmospheric backlight glow
 */
export function EmptyEarningsGraphic({ className }: EmptyEarningsGraphicProps) {
  return (
    <div className={cn("relative flex items-center justify-center select-none", className)}>
      {/* FALE Saffron ambient atmospheric backlight */}
      <div className="absolute inset-2 sm:inset-4 rounded-full bg-[#FF5A1F]/15 dark:bg-[#FF5A1F]/20 blur-2xl animate-pulse pointer-events-none" />

      {/* Official Lottie Animation by Amine Elwadi */}
      <LottieAnimation
        animationData={lottieEmptyEarnings}
        loop={true}
        autoplay={true}
        className="w-full h-full relative z-10"
      />
    </div>
  );
}

