"use client";

import { useCallback, useSyncExternalStore } from "react";
import { THEME_STORAGE_KEY } from "./theme-script";

/**
 * Minimal light/dark theme handling. The initial class is applied before
 * paint by THEME_INIT_SCRIPT (rendered in the root layout's <head>), so there
 * is no flash of the wrong theme.
 */
export type ResolvedTheme = "light" | "dark";

function subscribe(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

const read = (): ResolvedTheme => (document.documentElement.classList.contains("dark") ? "dark" : "light");

export function useTheme(): { theme: ResolvedTheme; setTheme: (t: ResolvedTheme) => void } {
  const theme = useSyncExternalStore(subscribe, read, () => "light" as const);
  const setTheme = useCallback((t: ResolvedTheme) => {
    document.documentElement.classList.toggle("dark", t === "dark");
    document.documentElement.style.colorScheme = t;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, t);
    } catch {
      /* ignore */
    }
  }, []);
  return { theme, setTheme };
}
