import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark" | "system";

const STORAGE_KEY = "fale-theme";
const listeners = new Set<() => void>();

let currentTheme: Theme = "system";
let isInitialized = false;

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function initTheme() {
  if (isInitialized || typeof window === "undefined") return;
  isInitialized = true;
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === "light" || saved === "dark" || saved === "system") {
      currentTheme = saved;
    }
  } catch {
    /* ignore */
  }

  // Initial apply
  applyTheme(getEffectiveTheme());

  // Listen to system theme changes
  try {
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (currentTheme === "system") {
        applyTheme(getSystemTheme());
        listeners.forEach((l) => l());
      }
    };
    if (mql.addEventListener) {
      mql.addEventListener("change", handler);
    } else {
      mql.addListener(handler);
    }
  } catch {
    /* ignore */
  }
}

export function getEffectiveTheme(): "light" | "dark" {
  initTheme();
  return currentTheme === "system" ? getSystemTheme() : currentTheme;
}

export function applyTheme(resolved: "light" | "dark", suspend = false) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const isOnboarding = typeof window !== "undefined" && window.location.pathname.startsWith("/onboarding");
  if (suspend || isOnboarding || resolved === "light") {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
  } else {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
  }
}

export function setTheme(theme: Theme) {
  initTheme();
  currentTheme = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
  applyTheme(getEffectiveTheme());
  listeners.forEach((l) => l());
}

export function toggleTheme() {
  const effective = getEffectiveTheme();
  setTheme(effective === "dark" ? "light" : "dark");
}

export function useTheme() {
  initTheme();
  const theme = useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => currentTheme,
    () => "system" as Theme
  );

  const resolvedTheme = theme === "system" ? getSystemTheme() : theme;

  return {
    theme,
    resolvedTheme,
    setTheme,
    toggleTheme,
    isDark: resolvedTheme === "dark",
  };
}
