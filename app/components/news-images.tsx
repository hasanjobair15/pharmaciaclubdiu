"use client";

import { useEffect, useState } from "react";
import { parseImageList } from "@/lib/images";

/**
 * Renders a news post's images:
 *  - no image     → branded gradient placeholder
 *  - one image    → single full-width image (normal behaviour)
 *  - many images  → responsive grid; click any photo to open the lightbox
 */
export default function NewsImages({
  imageUrl,
  title,
}: {
  imageUrl: string | null;
  title: string;
}) {
  const urls = parseImageList(imageUrl);
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  useEffect(() => {
    if (openIdx === null) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpenIdx(null);
      if (e.key === "ArrowRight")
        setOpenIdx((i) => (i === null ? i : (i + 1) % urls.length));
      if (e.key === "ArrowLeft")
        setOpenIdx((i) => (i === null ? i : (i - 1 + urls.length) % urls.length));
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIdx, urls.length]);

  /* ---- no image: branded placeholder ---- */
  if (urls.length === 0) {
    return (
      <div className="flex h-72 items-center justify-center bg-gradient-to-br from-blue-800 to-indigo-700 text-white dark:from-[#12383c] dark:to-[#172554]">
        <span className="text-2xl font-bold">Pharmacia Club DIU</span>
      </div>
    );
  }

  /* ---- one image: single hero image ---- */
  if (urls.length === 1) {
    return (
      <img
        src={urls[0]}
        alt={title}
        className="max-h-[600px] w-full object-cover"
      />
    );
  }

  /* ---- multiple images: responsive grid ---- */
  return (
    <>
      <div
        className={`grid gap-2 md:gap-3 ${
          urls.length === 2 ? "grid-cols-2" : "grid-cols-2 md:grid-cols-3"
        }`}
      >
        {urls.map((url, i) => (
          <button
            key={`${url}-${i}`}
            type="button"
            onClick={() => setOpenIdx(i)}
            aria-label={`Open photo ${i + 1} of ${urls.length}`}
            className="group relative block overflow-hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <img
              src={url}
              alt={`${title} — photo ${i + 1}`}
              className={`w-full object-cover transition duration-300 group-hover:scale-[1.04] ${
                urls.length === 2 ? "h-64 sm:h-80" : "h-44 sm:h-56"
              }`}
            />

            <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
              <span className="rounded-full bg-white/95 px-4 py-2 text-sm font-bold text-slate-900 shadow-lg">
                🔍 View
              </span>
            </span>
          </button>
        ))}
      </div>

      {/* LIGHTBOX */}
      {openIdx !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpenIdx(null)}
        >
          <button
            onClick={() => setOpenIdx(null)}
            aria-label="Close"
            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-bold text-slate-900 shadow-lg transition hover:bg-slate-200"
          >
            ×
          </button>

          {urls.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIdx((i) => (i === null ? i : (i - 1 + urls.length) % urls.length));
                }}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-slate-900 shadow-lg transition hover:bg-white sm:left-6"
              >
                ‹
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setOpenIdx((i) => (i === null ? i : (i + 1) % urls.length));
                }}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-slate-900 shadow-lg transition hover:bg-white sm:right-6"
              >
                ›
              </button>
            </>
          )}

          <div className="relative max-h-[90vh] max-w-6xl" onClick={(e) => e.stopPropagation()}>
            <img
              src={urls[openIdx]}
              alt={`${title} — photo ${openIdx + 1}`}
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />

            <p className="mt-4 text-center text-sm font-semibold text-slate-300">
              {title} · {openIdx + 1} / {urls.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
