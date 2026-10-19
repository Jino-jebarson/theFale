import { cn } from "@/lib/utils";

export function Logo({
  className,
  inverted = false,
}: {
  className?: string;
  inverted?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Icon: Tilted squircle badge in project blue with white stylized 'f' */}
      <span
        className={cn(
          "relative grid h-10 w-10 shrink-0 place-items-center rounded-[12px] rotate-[-4deg] transition-transform shadow-sm",
          inverted
            ? "bg-[#1d63d2] text-white ring-1 ring-white/25"
            : "bg-[#1d63d2] text-white shadow-brand",
        )}
      >
        <span
          className="text-[26px] font-black italic leading-none select-none pl-0.5"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          f
        </span>
      </span>

      {/* Wordmark: Stacked 'the' on top and 'fale' below in project colors */}
      <span className="flex flex-col -space-y-1 leading-none">
        <span
          className={cn(
            "text-[12px] font-extrabold italic pl-0.5 tracking-wide",
            inverted ? "text-[#60a5fa]" : "text-[#1d63d2] dark:text-[#60a5fa]",
          )}
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          the
        </span>
        <span
          className={cn(
            "text-[28px] font-black italic tracking-tight",
            inverted ? "text-white" : "text-[#0d1e3a] dark:text-white",
          )}
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          fale
        </span>
      </span>
    </span>
  );
}
