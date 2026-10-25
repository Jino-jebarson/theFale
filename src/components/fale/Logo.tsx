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
      {/* Icon: Tilted squircle badge in Saffron with white stylized 'f' */}
      <span
        className={cn(
          "relative grid h-10 w-10 shrink-0 place-items-center rounded-[12px] rotate-[-4deg] transition-transform",
          inverted
            ? "bg-primary text-white ring-1 ring-white/25"
            : "bg-primary text-white",
        )}
      >
        <span
          className="text-[26px] font-black italic leading-none select-none pl-0.5 text-white"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          f
        </span>
      </span>

      {/* Wordmark: Stacked 'the' on top and 'fale' below */}
      <span className="flex flex-col -space-y-1 leading-none">
        <span
          className={cn(
            "text-[12px] font-extrabold italic pl-0.5 tracking-wide text-primary",
          )}
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          the
        </span>
        <span
          className={cn(
            "text-[28px] font-black italic tracking-tight flex items-baseline",
            inverted ? "text-white" : "text-foreground",
          )}
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          fale
        </span>
      </span>
    </span>
  );
}
