"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MagazineIssue = {
  id: number;
  title: string;
  season: string;
  year: number;
  description: string | null;
  cover_image_url: string | null;
  is_current: boolean;
  is_published: boolean;
};

type MagazinePage = {
  id: number;
  issue_id: number;
  page_number: number;
  section: string | null;
  title: string | null;
  content: string | null;
  image_url: string | null;
  pdf_url: string | null;
  created_at: string;
};

export default function MagazineReaderPage() {
  const params = useParams();

  const issueId = Number(params.id);

  const [issue, setIssue] = useState<MagazineIssue | null>(null);
  const [pages, setPages] = useState<MagazinePage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  /* drag/swipe state (refs avoid re-render during mousemove) */
  const dragStart = useRef<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!issueId || Number.isNaN(issueId)) {
      void Promise.resolve().then(() => {
        setErrorMessage("Invalid magazine issue.");
        setLoading(false);
      });
      return;
    }

    async function loadMagazine() {
      /* eslint-disable-next-line react-hooks/set-state-in-effect -- loader invoked off the synchronous effect path */
      setLoading(true);
      setErrorMessage("");

      const supabase = createClient();

      const { data: issueData, error: issueError } = await supabase
        .from("magazine_issues")
        .select(
          "id, title, season, year, description, cover_image_url, is_current, is_published"
        )
        .eq("id", issueId)
        .eq("is_published", true)
        .single();

      if (issueError || !issueData) {
        setErrorMessage(
          issueError?.message || "Magazine issue could not be found."
        );
        setLoading(false);
        return;
      }

      const { data: pageData, error: pageError } = await supabase
        .from("magazine_pages")
        .select("*")
        .eq("issue_id", issueId)
        .order("page_number", { ascending: true });

      if (pageError) {
        setErrorMessage(pageError.message);
        setLoading(false);
        return;
      }

      setIssue(issueData);
      setPages(pageData || []);
      setCurrentPage(0);
      setLoading(false);
    }

    void Promise.resolve().then(loadMagazine);
  }, [issueId]);

  function previousPage() {
    setCurrentPage((current) => Math.max(current - 1, 0));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function nextPage() {
    setCurrentPage((current) =>
      Math.min(current + 1, pages.length - 1)
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function selectPage(index: number) {
    setCurrentPage(index);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  /* ============================================================
     Swipe / drag navigation
     - touch: hint-free horizontal swipe (threshold ~60px)
     - desktop: mouse drag OR arrow-key swipes on the stage
     - always stops at the first/last page
  ============================================================ */

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  function handleSwipe(deltaX: number) {
    if (Math.abs(deltaX) < 60) return;

    if (deltaX < 0) {
      nextPage();
    } else {
      previousPage();
    }
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        nextPage();
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        previousPage();
      }
    }

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages.length, currentPage]);

  /* Loading */
  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-20 dark:bg-[#070b14]">
        <div className="mx-auto max-w-4xl text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-[#087f8c]" />

          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
            Opening magazine...
          </p>

        </div>
      </main>
    );
  }

  /* Error */
  if (errorMessage || !issue) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-20 dark:bg-[#070b14]">

        <div className="mx-auto max-w-3xl rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-[#0d1422]">

          <div className="text-6xl">📖</div>

          <h1 className="mt-5 text-3xl font-black text-[#0b1736] dark:text-white">
            Magazine Issue Not Found
          </h1>

          <p className="mt-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {errorMessage ||
              "This magazine issue is not available or has not been published yet."}
          </p>

          <Link
            href="/magazine"
            className="mt-7 inline-flex rounded-xl bg-[#087f8c] px-6 py-3 text-sm font-bold text-white hover:opacity-90"
          >
            ← Back to Magazine
          </Link>

        </div>

      </main>
    );
  }

  const page = pages[currentPage];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#070b14]">

      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0a0f1a]">

        <div className="mx-auto max-w-7xl px-6 py-7 lg:px-8">

          <Link
            href="/magazine"
            className="text-sm font-bold text-[#087f8c] hover:underline"
          >
            ← Back to Magazine
          </Link>

          <div className="mt-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">

            <div>

              <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#087f8c]">
                {issue.season} · {issue.year}
              </p>

              <h1 className="mt-2 text-3xl font-black text-[#0b1736] dark:text-white md:text-4xl">
                {issue.title}
              </h1>

            </div>

            {issue.is_current && (
              <span className="w-fit rounded-full bg-[#087f8c]/10 px-4 py-2 text-xs font-bold text-[#087f8c]">
                CURRENT ISSUE
              </span>
            )}

          </div>

        </div>

      </header>

      {/* Reader */}
      <section className="px-6 py-10 lg:px-8">

        <div className="mx-auto max-w-5xl">

          {/* Cover if no pages */}
          {pages.length === 0 && (
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-[#0d1422]">

              {issue.cover_image_url ? (
                <div className="bg-slate-100 p-8 dark:bg-[#080d17]">
                  <img
                    src={issue.cover_image_url}
                    alt={issue.title}
                    className="mx-auto max-h-[750px] rounded-xl object-contain shadow-xl"
                  />
                </div>
              ) : (
                <div className="px-6 py-24 text-center">

                  <div className="text-7xl">📖</div>

                  <h2 className="mt-5 text-2xl font-black text-slate-900 dark:text-white">
                    {issue.title}
                  </h2>

                </div>
              )}

              <div className="p-8 text-center">

                <h2 className="text-2xl font-bold text-[#0b1736] dark:text-white">
                  Magazine Pages Coming Soon
                </h2>

                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                  The magazine issue exists, but individual magazine pages
                  have not been added yet.
                </p>

              </div>

            </div>
          )}

          {/* Magazine Page */}
          {pages.length > 0 && page && (
            <>
              <div
                onTouchStart={(e) => {
                  dragStart.current = {
                    x: e.touches[0].clientX,
                    y: e.touches[0].clientY,
                  };
                }}
                onTouchEnd={(e) => {
                  if (!dragStart.current) return;

                  const dx = e.changedTouches[0].clientX - dragStart.current.x;
                  const dy = e.changedTouches[0].clientY - dragStart.current.y;

                  dragStart.current = null;

                  /* only horizontal intent counts as a page turn */
                  if (Math.abs(dx) > Math.abs(dy)) {
                    handleSwipe(dx);
                  }
                }}
                onMouseDown={(e) => {
                  dragStart.current = { x: e.clientX, y: e.clientY };
                  setIsDragging(true);
                }}
                onMouseMove={(e) => {
                  if (!isDragging || !dragStart.current) return;

                  const dx = e.clientX - dragStart.current.x;

                  /* live visual feedback while dragging */
                  e.currentTarget.style.transform = `translateX(${dx}px)`;
                }}
                onMouseUp={(e) => {
                  if (!dragStart.current) return;

                  const dx = e.clientX - dragStart.current.x;
                  const dy = e.clientY - dragStart.current.y;

                  dragStart.current = null;
                  setIsDragging(false);

                  e.currentTarget.style.transform = "";

                  if (Math.abs(dx) > Math.abs(dy)) {
                    handleSwipe(dx);
                  }
                }}
                onMouseLeave={(e) => {
                  if (dragStart.current) {
                    dragStart.current = null;
                    setIsDragging(false);
                    e.currentTarget.style.transform = "";
                  }
                }}
                onDragStart={(e) => e.preventDefault()}
                className={`overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl transition-shadow duration-300 dark:border-slate-800 dark:bg-[#0d1422] ${
                  isDragging
                    ? "cursor-grabbing select-none"
                    : "cursor-grab"
                }`}
              >
                {/* swipe hint */}
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5 dark:border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    ← Swipe / drag
                  </span>

                  <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">
                    Drag → to go back
                  </span>
                </div>

                {/* Image */}
                {page.image_url && (
                  <div className="bg-slate-100 p-4 dark:bg-[#080d17] md:p-8">

                    <img
                      src={page.image_url}
                      alt={
                        page.title ||
                        `Magazine page ${page.page_number}`
                      }
                      draggable={false}
                      className="mx-auto max-h-[850px] w-full object-contain"
                    />

                  </div>
                )}

                {/* Text */}
                {(page.section || page.title || page.content) && (
                  <div className="px-6 py-10 md:px-12 md:py-14">

                    {page.section && (
                      <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#087f8c]">
                        {page.section}
                      </p>
                    )}

                    {page.title && (
                      <h2 className="mt-3 text-3xl font-black text-[#0b1736] dark:text-white">
                        {page.title}
                      </h2>
                    )}

                    {page.content && (
                      <div className="mt-6 whitespace-pre-wrap text-base leading-8 text-slate-700 dark:text-slate-300">
                        {page.content}
                      </div>
                    )}

                  </div>
                )}

                {/* PDF */}
                {page.pdf_url && (
                  <div className="border-t border-slate-200 px-6 py-6 dark:border-slate-800">

                    <a
                      href={page.pdf_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex rounded-xl bg-[#087f8c] px-5 py-3 text-sm font-bold text-white hover:opacity-90"
                    >
                      📄 Open PDF
                    </a>

                  </div>
                )}

              </div>

              {/* Navigation */}
              <div className="mt-8">

                <div className="flex items-center justify-between gap-4">

                  <button
                    onClick={previousPage}
                    disabled={currentPage === 0}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-[#0d1422] dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    ← Previous
                  </button>

                  <div className="text-center">

                    <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                      Page {currentPage + 1} of {pages.length}
                    </p>

                  </div>

                  <button
                    onClick={nextPage}
                    disabled={currentPage === pages.length - 1}
                    className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-[#0d1422] dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Next →
                  </button>

                </div>

                {/* Page Numbers */}
                <div className="mt-6 flex flex-wrap justify-center gap-2">

                  {pages.map((item, index) => (
                    <button
                      key={item.id}
                      onClick={() => selectPage(index)}
                      className={`h-10 min-w-10 rounded-lg px-3 text-sm font-bold transition ${
                        index === currentPage
                          ? "bg-[#087f8c] text-white"
                          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-[#0d1422] dark:text-slate-300 dark:hover:bg-slate-800"
                      }`}
                    >
                      {item.page_number}
                    </button>
                  ))}

                </div>

              </div>
            </>
          )}

          {/* Description */}
          {issue.description && (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-[#0d1422]">

              <h2 className="text-lg font-bold text-[#0b1736] dark:text-white">
                About This Issue
              </h2>

              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                {issue.description}
              </p>

            </div>
          )}

        </div>

      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0a0f1a]">

        <div className="mx-auto max-w-7xl px-6 py-10 text-center lg:px-8">

          <p className="font-bold text-[#0b1736] dark:text-white">
            PHARMACIA CLUB DIU
          </p>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Department of Pharmacy · Daffodil International University
          </p>

          <p className="mt-5 text-xs text-slate-500">
            © 2026 Pharmacia Club DIU. All Rights Reserved.
          </p>

        </div>

      </footer>

    </main>
  );
}