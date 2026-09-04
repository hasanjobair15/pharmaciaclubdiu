"use client";

import { useEffect, useState } from "react";

type Stats = {
  liveNow: number;
  today: number;
  total: number;
};

function sessionId(): string {
  try {
    let sid = sessionStorage.getItem("pcdiu_sid");

    if (!sid) {
      sid =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      sessionStorage.setItem("pcdiu_sid", sid);
    }

    return sid;
  } catch {
    return "anonymous";
  }
}

export default function VisitorStats() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const sid = sessionId();

    async function fetchStats() {
      try {
        const res = await fetch("/api/stats/visit", { cache: "no-store" });

        if (!res.ok) throw new Error("failed");

        const data: Stats = await res.json();

        if (!cancelled) {
          setStats(data);
          setError(false);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    /* Count this session once (first POST), then just refresh the heartbeat */
    let counted = false;

    try {
      counted = sessionStorage.getItem("pcdiu_counted") === "1";
    } catch {
      counted = false;
    }

    fetch(`/api/stats/visit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sid, count: !counted }),
    })
      .then(() => {
        if (!cancelled) {
          try {
            sessionStorage.setItem("pcdiu_counted", "1");
          } catch {
            /* ignore */
          }
        }
      })
      .catch(() => {
        /* heartbeat failure is non-fatal */
      });

    fetchStats();

    const interval = window.setInterval(() => {
      /* Heartbeat keeps this session "live" */
      fetch("/api/stats/visit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sid, count: false }),
      }).catch(() => {});

      fetchStats();
    }, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error && !stats) return null;

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500 dark:text-slate-400"
      aria-label="Visitor statistics"
    >
      <span className="inline-flex items-center gap-1.5">
        <span
          className={`h-2 w-2 rounded-full ${
            error
              ? "bg-slate-300 dark:bg-slate-600"
              : "animate-pulse bg-emerald-500"
          }`}
          aria-hidden
        />
        Live now:{" "}
        <strong className="font-bold text-[#0b1736] dark:text-white">
          {stats ? stats.liveNow : "—"}
        </strong>
      </span>

      <span className="inline-flex items-center gap-1.5">
        Today:{" "}
        <strong className="font-bold text-[#0b1736] dark:text-white">
          {stats ? stats.today : "—"}
        </strong>
      </span>

      <span className="inline-flex items-center gap-1.5">
        Total visitors:{" "}
        <strong className="font-bold text-[#0b1736] dark:text-white">
          {stats ? stats.total.toLocaleString() : "—"}
        </strong>
      </span>
    </div>
  );
}
