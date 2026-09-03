"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="h-10 w-[92px] shrink-0 rounded-full border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900" />
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="
        flex h-10 shrink-0 items-center justify-center gap-2
        rounded-full
        border border-slate-300
        bg-white
        px-4
        text-sm font-semibold
        text-slate-700
        shadow-sm
        transition-all duration-200
        hover:border-[#087f8c]
        hover:bg-slate-50
        hover:text-[#087f8c]
        focus:outline-none
        focus:ring-2
        focus:ring-[#087f8c]/30
        dark:border-slate-600
        dark:bg-slate-800
        dark:text-slate-100
        dark:hover:border-[#2dd4bf]
        dark:hover:bg-slate-700
        dark:hover:text-[#2dd4bf]
      "
    >
      <span className="text-base leading-none">
        {isDark ? "☀️" : "🌙"}
      </span>

      <span>{isDark ? "Light" : "Dark"}</span>
    </button>
  );
}