import { LottieAnimation } from "@/components/fale/LottieAnimation";
import lottieSearchEmpty from "@/assets/lottie-search-empty.json";
import { cn } from "@/lib/utils";

interface SearchEmptyGraphicProps {
  className?: string;
}

/**
 * Empty Search / No Data Animation by Aditi Shirsat from LottieFiles:
 * - Cute magnifying glass character with searching expression & sweat drop
 * - Smooth 90fps vector animation
 * - Enhanced with ambient FALE Saffron (#FF5A1F) atmospheric glow
 */
export function SearchEmptyGraphic({ className }: SearchEmptyGraphicProps) {
  return (
    <div className={cn("relative flex items-center justify-center select-none aspect-[550/400]", className)}>
      {/* Ambient atmospheric backlight */}
      <div className="absolute inset-2 sm:inset-4 rounded-full bg-[#FF5A1F]/10 dark:bg-[#FF5A1F]/15 blur-3xl animate-pulse pointer-events-none" />

      {/* Official Lottie Animation by Aditi Shirsat */}
      <LottieAnimation
        animationData={lottieSearchEmpty}
        loop={true}
        autoplay={true}
        className="w-full h-full relative z-10 flex items-center justify-center"
      />
    </div>
  );
}

