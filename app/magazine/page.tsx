"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
  const router = useRouter();

  const issueId = Number(params.id);

  const [issue, setIssue] = useState<MagazineIssue | null>(null);
  const [pages, setPages] = useState<MagazinePage[]>([]);

  const [currentPage, setCurrentPage] = useState(0);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!issueId || Number.isNaN(issueId)) {
      setErrorMessage("Invalid magazine issue.");
      setLoading(false);
      return;
    }

    async function loadMagazine() {
      setLoading(true);
      setErrorMessage("");

      const supabase = createClient();

      // Load magazine issue
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

      // Load magazine pages
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

    loadMagazine();
  }, [issueId]);

  function goToPreviousPage() {
    setCurrentPage((previous) => Math.max(previous - 1, 0));
  }

  function goToNextPage() {
    setCurrentPage((previous) =>
      Math.min(previous + 1, pages.length - 1)
    );
  }

  function goToPage(index: number) {
    if (index < 0 || index >= pages.length) return;

    setCurrentPage(index);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faff] dark:bg-[#0a0f1a]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#087f8c]" />

          <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-slate-400">
            Loading magazine...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage || !issue) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faff] px-6 dark:bg-[#0a0f1a]">
        <div className="max-w-lg rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-sm dark:border-slate-800 dark:bg-[#111827]">
          <div className="text-5xl">📖</div>

          <h1 className="mt-5 text-2xl font-black text-[#0b1736] dark:text-white">
            Magazine Not Found
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {errorMessage ||
              "This magazine issue is unavailable or has not been published yet."}
          </p>

          <Link
            href="/magazine"
            className="mt-7 inline-flex rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c] dark:bg-[#2dd4bf] dark:text-[#062a2d]"
          >
            ← Back to Magazine
          </Link>
        </div>
      </main>
    );
  }

  const page = pages[currentPage];

  return (
    <main className="min-h-screen bg-[#f7faff] text-[#0b1736] dark:bg-[#0a0f1a] dark:text-slate-100">

      {/* =========================================================
          HEADER
      ========================================================= */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-[#0b1120]/95">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">

          <div className="flex items-center justify-between gap-4">

            <div className="min-w-0">

              <Link
                href="/magazine"
                className="inline-flex items-center text-sm font-bold text-[#087f8c] transition hover:text-[#066d78] dark:text-[#2dd4bf]"
              >
                ← Back to Magazine
              </Link>

              <h1 className="mt-2 truncate text-lg font-black text-[#0b1736] dark:text-white sm:text-xl">
                {issue.title}
              </h1>

              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                {issue.season} {issue.year}
              </p>

            </div>

            <div className="hidden shrink-0 sm:block">

              <span className="rounded-full bg-[#087f8c]/10 px-4 py-2 text-sm font-bold text-[#087f8c] dark:bg-[#2dd4bf]/10 dark:text-[#2dd4bf]">
                {pages.length > 0
                  ? `Page ${currentPage + 1} of ${pages.length}`
                  : "No Pages"}
              </span>

            </div>

          </div>

        </div>
      </header>

      {/* =========================================================
          READER
      ========================================================= */}
      <section className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">

        {/* MAGAZINE INFORMATION */}
        <div className="mb-8 text-center">

          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#087f8c] dark:text-[#2dd4bf]">
            Pharmacia Club DIU
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0b1736] dark:text-white sm:text-4xl">
            {issue.title}
          </h2>

          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {issue.season} {issue.year}
          </p>

        </div>

        {pages.length === 0 ? (

          /* =====================================================
             NO PAGES
             ===================================================== */
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#111827]">

            {issue.cover_image_url ? (
              <img
                src={issue.cover_image_url}
                alt={issue.title}
                className="mx-auto mb-8 max-h-[500px] rounded-2xl object-contain shadow-xl"
              />
            ) : (
              <div className="mx-auto flex h-[400px] w-[280px] flex-col items-center justify-center rounded-2xl bg-[#0b1736] text-white shadow-xl dark:bg-[#12383c]">

                <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                  Pharmacia Club DIU
                </p>

                <h3 className="mt-6 text-4xl font-black">
                  {issue.season}
                </h3>

                <p className="mt-2 text-5xl font-black">
                  {issue.year}
                </p>

                <div className="mt-8 h-px w-16 bg-cyan-300" />

                <p className="mt-5 text-sm text-slate-300">
                  Department of Pharmacy
                </p>

              </div>
            )}

            <h3 className="mt-8 text-xl font-black text-[#0b1736] dark:text-white">
              Magazine pages are not available yet
            </h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              The magazine has been published, but its reading pages have not
              been added yet.
            </p>

          </div>

        ) : (

          <>
            {/* ===================================================
                CURRENT PAGE
                =================================================== */}
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-[#111827]">

              {/* PAGE HEADER */}
              <div className="border-b border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-8">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087f8c] dark:text-[#2dd4bf]">
                      {page.section || "Magazine"}
                    </p>

                    <h3 className="mt-1 text-xl font-black text-[#0b1736] dark:text-white sm:text-2xl">
                      {page.title || `Page ${page.page_number}`}
                    </h3>

                  </div>

                  <div className="w-fit rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    Page {currentPage + 1} / {pages.length}
                  </div>

                </div>

              </div>

              {/* PAGE CONTENT */}
              <div className="bg-slate-100 p-4 dark:bg-[#0d1422] sm:p-8 lg:p-12">

                <div className="mx-auto max-w-4xl">

                  {/* PAGE IMAGE */}
                  {page.image_url && (
                    <div className="overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-slate-900">

                      <img
                        src={page.image_url}
                        alt={
                          page.title ||
                          `Magazine page ${page.page_number}`
                        }
                        className="mx-auto h-auto max-h-[900px] w-full object-contain"
                      />

                    </div>
                  )}

                  {/* PAGE TEXT */}
                  {page.content && (
                    <div
                      className={`${
                        page.image_url ? "mt-8" : ""
                      } rounded-2xl bg-white p-6 shadow-sm dark:bg-[#111827] sm:p-10`}
                    >

                      <div className="whitespace-pre-wrap text-base leading-8 text-slate-700 dark:text-slate-300">
                        {page.content}
                      </div>

                    </div>
                  )}

                  {/* PDF */}
                  {page.pdf_url && (
                    <div
                      className={`${
                        page.image_url || page.content
                          ? "mt-8"
                          : ""
                      } overflow-hidden rounded-2xl bg-white shadow-lg dark:bg-[#111827]`}
                    >

                      <div className="border-b border-slate-200 p-5 dark:border-slate-800">

                        <p className="font-bold text-[#0b1736] dark:text-white">
                          PDF Version
                        </p>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          View this page as a PDF.
                        </p>

                      </div>

                      <div className="p-5">

                        <a
                          href={page.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c] dark:bg-[#2dd4bf] dark:text-[#062a2d]"
                        >
                          Open PDF →
                        </a>

                      </div>

                    </div>
                  )}

                  {/* EMPTY PAGE */}
                  {!page.image_url &&
                    !page.content &&
                    !page.pdf_url && (
                      <div className="rounded-2xl bg-white p-12 text-center dark:bg-[#111827]">

                        <div className="text-5xl">📄</div>

                        <p className="mt-4 font-semibold text-slate-500 dark:text-slate-400">
                          This page has no content yet.
                        </p>

                      </div>
                    )}

                </div>

              </div>

              {/* =================================================
                  NAVIGATION
                  ================================================= */}
              <div className="border-t border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827] sm:p-6">

                <div className="flex items-center justify-between gap-4">

                  <button
                    type="button"
                    onClick={goToPreviousPage}
                    disabled={currentPage === 0}
                    className="inline-flex items-center rounded-full border border-slate-200 px-5 py-3 text-sm font-bold text-[#0b1736] transition hover:border-[#087f8c] hover:text-[#087f8c] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:text-slate-200 dark:hover:border-[#2dd4bf] dark:hover:text-[#2dd4bf]"
                  >
                    ← Previous
                  </button>

                  <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                    {currentPage + 1} / {pages.length}
                  </span>

                  <button
                    type="button"
                    onClick={goToNextPage}
                    disabled={currentPage === pages.length - 1}
                    className="inline-flex items-center rounded-full bg-[#0b1736] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-40 dark:bg-[#2dd4bf] dark:text-[#062a2d] dark:hover:bg-[#5eead4]"
                  >
                    Next →
                  </button>

                </div>

              </div>

            </div>

            {/* ===================================================
                PAGE NAVIGATION
                =================================================== */}
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#111827] sm:p-6">

              <div className="mb-5 flex items-center justify-between">

                <div>
                  <h3 className="font-black text-[#0b1736] dark:text-white">
                    Pages
                  </h3>

                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Select a page to continue reading.
                  </p>
                </div>

                <span className="text-xs font-bold text-slate-400">
                  {pages.length} pages
                </span>

              </div>

              <div className="flex flex-wrap gap-2">

                {pages.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToPage(index)}
                    className={`flex h-10 min-w-10 items-center justify-center rounded-xl px-3 text-sm font-bold transition ${
                      currentPage === index
                        ? "bg-[#0b1736] text-white dark:bg-[#2dd4bf] dark:text-[#062a2d]"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:bg-[#0d1422] dark:text-slate-300 dark:hover:border-[#2dd4bf] dark:hover:text-[#2dd4bf]"
                    }`}
                    title={item.title || `Page ${item.page_number}`}
                  >
                    {item.page_number}
                  </button>
                ))}

              </div>

            </div>

            {/* ===================================================
                ISSUE DESCRIPTION
                =================================================== */}
            {issue.description && (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 dark:border-slate-800 dark:bg-[#111827]">

                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087f8c] dark:text-[#2dd4bf]">
                  About This Issue
                </p>

                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-300">
                  {issue.description}
                </p>

              </div>
            )}

          </>
        )}

      </section>

      {/* =========================================================
          FOOTER
      ========================================================= */}
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0b1120]">

        <div className="mx-auto max-w-7xl px-6 py-8 text-center">

          <p className="text-sm font-bold text-[#0b1736] dark:text-white">
            PHARMACIA CLUB DIU
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Department of Pharmacy · Daffodil International University
          </p>

          <Link
            href="/magazine"
            className="mt-4 inline-block text-sm font-bold text-[#087f8c] hover:underline dark:text-[#2dd4bf]"
          >
            ← Back to Magazine Issues
          </Link>

        </div>

      </footer>

    </main>
  );
}