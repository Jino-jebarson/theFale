import { useEffect, useRef } from "react";
import lottie, { type AnimationItem } from "lottie-web/build/player/lottie_light";

interface LottieAnimationProps {
  animationData?: unknown;
  path?: string;
  loop?: boolean;
  autoplay?: boolean;
  className?: string;
}

export function LottieAnimation({
  animationData,
  path,
  loop = true,
  autoplay = true,
  className,
}: LottieAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    if (animRef.current) {
      animRef.current.destroy();
    }

    try {
      animRef.current = lottie.loadAnimation({
        container: containerRef.current,
        renderer: "svg",
        loop,
        autoplay,
        ...(animationData ? { animationData } : { path }),
      });
    } catch (e) {
      console.error("Lottie load error:", e);
    }

    return () => {
      animRef.current?.destroy();
      animRef.current = null;
    };
  }, [animationData, path, loop, autoplay]);

  return <div ref={containerRef} className={className} />;
}
