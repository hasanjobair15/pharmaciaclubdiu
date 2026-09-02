"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:border-[#087f8c] hover:text-[#087f8c]"
      aria-label="Toggle theme"
    >
      {isDark ? "☀️ Light" : "🌙 Dark"}
    </button>
  );
}