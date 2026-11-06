import { LottieAnimation } from "@/components/fale/LottieAnimation";
import lottieHealthcare from "@/assets/lottie-healthcare.json";
import { cn } from "@/lib/utils";

interface HealthcareSearchGraphicProps {
  className?: string;
}

/**
 * Healthcare Animation by Bayu Febrianto from LottieFiles:
 * - Features Medical Shield, Stethoscope, Medicine Bottle, Patient Chart, and First Aid Kit
 * - Animated at 60fps via lottie-web
 * - Enhanced with FALE Saffron (#FF5A1F) ambient atmospheric backlight
 */
export function HealthcareSearchGraphic({ className }: HealthcareSearchGraphicProps) {
  return (
    <div className={cn("relative flex items-center justify-center select-none", className)}>
      {/* FALE Saffron ambient atmospheric backlight */}
      <div className="absolute inset-2 sm:inset-4 rounded-full bg-[#FF5A1F]/10 dark:bg-[#FF5A1F]/15 blur-3xl animate-pulse pointer-events-none" />

      {/* Official Lottie Animation by Bayu Febrianto */}
      <LottieAnimation
        animationData={lottieHealthcare}
        loop={true}
        autoplay={true}
        className="w-full h-full relative z-10"
      />
    </div>
  );
}
