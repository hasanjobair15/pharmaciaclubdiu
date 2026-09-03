"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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

    loadMagazine();
  }, [issueId]);

  function goToPreviousPage() {
    setCurrentPage((previous) => Math.max(previous - 1, 0));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToNextPage() {
    setCurrentPage((previous) =>
      Math.min(previous + 1, pages.length - 1)
    );
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      <main className="min-h-screen bg-slate-50 px-6 py-20 dark:bg-[#070b14]">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-[#087f8c]" />

          <p className="mt-5 text-sm text-slate-500 dark:text-slate-400">
            Loading magazine...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage || !issue) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-20 dark:bg-[#070b14]">
        <div className="mx-auto max-w-3xl rounded-3xl border border-red-200 bg-white p-10 text-center shadow-sm dark:border-red-900/40 dark:bg-[#0d1422]">
          <div className="text-5xl">📖</div>

          <h1 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">
            Magazine Not Found
          </h1>

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            {errorMessage || "This magazine issue is unavailable."}
          </p>

          <Link
            href="/magazine"
            className="mt-7 inline-flex rounded-xl bg-[#087f8c] px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
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
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0a0f1a]">
        <div className="mx-auto max-w-7xl px-6 py-6 lg:px-8">

          <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

            <div>
              <Link
                href="/magazine"
                className="text-sm font-semibold text-[#087f8c] hover:underline"
              >
                ← Back to Magazine
              </Link>

              <h1 className="mt-3 text-3xl font-black tracking-tight text-[#0b1736] dark:text-white md:text-4xl">
                {issue.title}
              </h1>

              <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                {issue.season} · {issue.year}
              </p>
            </div>

            {issue.is_current && (
              <span className="inline-flex w-fit rounded-full bg-[#087f8c]/10 px-4 py-2 text-sm font-bold text-[#087f8c] dark:bg-[#2dd4bf]/10 dark:text-[#2dd4bf]">
                Current Issue
              </span>
            )}

          </div>

        </div>
      </section>

      {/* Magazine Reader */}
      <section className="px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-5xl">

          {/* Page */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-[#0d1422]">

            {page ? (
              <>
                {/* Page Image */}
                {page.image_url && (
                  <div className="border-b border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-[#080d17]">
                    <img
                      src={page.image_url}
                      alt={page.title || `Magazine page ${page.page_number}`}
                      className="mx-auto block max-h-[850px] w-full object-contain"
                    />
                  </div>
                )}

                {/* Page Content */}
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

                  {/* PDF */}
                  {page.pdf_url && (
                    <div className="mt-8">
                      <a
                        href={page.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-xl bg-[#087f8c] px-5 py-3 text-sm font-bold text-white transition hover:opacity-90"
                      >
                        📄 Open PDF
                      </a>
                    </div>
                  )}

                  {!page.image_url &&
                    !page.content &&
                    !page.pdf_url && (
                      <div className="py-12 text-center text-slate-400">
                        This page does not contain any content yet.
                      </div>
                    )}

                </div>

              </>
            ) : (
              <div className="px-6 py-20 text-center">
                <div className="text-5xl">📖</div>

                <h2 className="mt-5 text-2xl font-bold text-slate-900 dark:text-white">
                  No Pages Available
                </h2>

                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  Pages for this magazine issue have not been added yet.
                </p>
              </div>
            )}

          </div>

          {/* Navigation */}
          {pages.length > 0 && (
            <div className="mt-8">

              <div className="flex items-center justify-between gap-4">

                <button
                  onClick={goToPreviousPage}
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
                  onClick={goToNextPage}
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
                    onClick={() => goToPage(index)}
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
          )}

          {/* Description */}
          {issue.description && (
            <div className="mt-10 rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#0d1422]">
              <h3 className="text-lg font-bold text-[#0b1736] dark:text-white">
                About This Issue
              </h3>

              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-400">
                {issue.description}
              </p>
            </div>
          )}

        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0a0f1a]">
        <div className="mx-auto max-w-7xl px-6 py-8 text-center">
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            PHARMACIA CLUB DIU
          </p>

          <p className="mt-1 text-xs text-slate-500 dark:text-slate-500">
            Department of Pharmacy · Daffodil International University
          </p>
        </div>
      </footer>

    </main>
  );
}