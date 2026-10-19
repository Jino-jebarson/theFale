import { HiOutlineSun, HiOutlineMoon } from "react-icons/hi2";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { isDark, toggleTheme, theme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode (currently ${theme})`}
      title={`Switch to ${isDark ? "light" : "dark"} mode (currently ${theme})`}
      className={cn(
        "relative grid h-9 w-9 place-items-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-95 cursor-pointer",
        className
      )}
    >
      <span className="relative flex h-5 w-5 items-center justify-center">
        {/* Sun Icon (shown in dark mode to switch to light) */}
        <HiOutlineSun
          className={cn(
            "h-5 w-5 transition-all duration-300 absolute",
            isDark
              ? "rotate-0 scale-100 opacity-100 text-amber-400"
              : "-rotate-90 scale-0 opacity-0"
          )}
        />
        {/* Moon Icon (shown in light mode to switch to dark) */}
        <HiOutlineMoon
          className={cn(
            "h-5 w-5 transition-all duration-300 absolute",
            isDark
              ? "rotate-90 scale-0 opacity-0"
              : "rotate-0 scale-100 opacity-100 text-slate-700 hover:text-slate-900"
          )}
        />
      </span>
    </button>
  );
}
