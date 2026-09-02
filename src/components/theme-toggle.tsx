"use client";

import { useCallback } from "react";

import { MoonIcon, SunIcon } from "@/components/ui/icons";
import { THEME_COOKIE, THEME_COOKIE_MAX_AGE } from "@/lib/theme";

/**
 * Both icons are always in the DOM and CSS decides which one shows. The server
 * cannot know the operating system preference, so rendering the "current" icon
 * from React state would be a guaranteed hydration mismatch on a first visit.
 */
export function ThemeToggle({ label, toLight, toDark }: { label: string; toLight: string; toDark: string }) {
  const toggle = useCallback(() => {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    const secure = window.location.protocol === "https:" ? ";secure" : "";
    document.cookie = `${THEME_COOKIE}=${next};path=/;max-age=${THEME_COOKIE_MAX_AGE};samesite=lax${secure}`;
  }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      title={label}
      className="theme-toggle flex h-11 min-h-11 w-11 shrink-0 items-center justify-center rounded-full border border-bark-200 bg-paper/70 text-bark-600 transition-colors duration-200 ease-tint hover:bg-canvas-2 hover:text-bark-900"
    >
      <span className="theme-toggle__to-dark contents">
        <SunIcon />
        <span className="sr-only">{toDark}</span>
      </span>
      <span className="theme-toggle__to-light contents">
        <MoonIcon />
        <span className="sr-only">{toLight}</span>
      </span>
    </button>
  );
}
