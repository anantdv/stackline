import { useEffect, useState } from "react";

/**
 * Stackline theme system ("Control Room" dark · "Daylight Ops" light).
 *
 * The theme is a `data-theme="dark|light"` attribute on <html>. All color
 * tokens are CSS custom properties that flip under that attribute, so most of
 * the UI needs no JS. This module is the only place that reads/writes the
 * attribute + localStorage.
 *
 * An inline boot script in index.html applies the stored/preferred theme
 * before first paint to avoid a flash of the wrong theme (FOUC).
 */

export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "stackline-theme";

export function getTheme(): Theme {
  if (typeof document === "undefined") return "dark";
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export function applyTheme(theme: Theme, persist = true) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* private mode — non-fatal */
    }
  }
}

/** Initial theme: stored choice → prefers-color-scheme → dark (brand default). */
export function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* ignore */
  }
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: light)").matches
  ) {
    return "light";
  }
  return "dark";
}

/** React binding: current theme, re-renders on toggle. */
export function useTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(() => getTheme());
  useEffect(() => {
    const obs = new MutationObserver(() => setTheme(getTheme()));
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => obs.disconnect();
  }, []);
  return theme;
}

/**
 * Read a resolved theme color (e.g. "--bg-void", "--accent") for canvas/R3F
 * scenes that can't consume Tailwind classes. Returns the computed value.
 */
export function themeColor(token: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(token).trim();
}
