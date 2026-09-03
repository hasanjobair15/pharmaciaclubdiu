"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type MagazineIssue = {
  id: number;
  title: string;
  season: string;
  year: number;
  description: string | null;
  cover_image_url: string | null;
};

type MagazinePage = {
  id: number;
  page_number: number;
  section: string | null;
  title: string | null;
  content: string | null;
  image_url: string | null;
  pdf_url: string | null;
};

export default function MagazineReaderPage() {
  const params = useParams();
  const router = useRouter();

  const id = Number(params.id);

  const [issue, setIssue] = useState<MagazineIssue | null>(null);
  const [pages, setPages] = useState<MagazinePage[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadMagazine() {
      const supabase = createClient();

      const { data: issueData } = await supabase
        .from("magazine_issues")
        .select(
          "id, title, season, year, description, cover_image_url"
        )
        .eq("id", id)
        .eq("is_published", true)
        .single();

      if (!issueData) {
        setLoading(false);
        return;
      }

      setIssue(issueData);

      const { data: pageData } = await supabase
        .from("magazine_pages")
        .select(
          "id, page_number, section, title, content, image_url, pdf_url"
        )
        .eq("issue_id", id)
        .order("page_number", { ascending: true });

      setPages(pageData || []);
      setLoading(false);
    }

    if (id) {
      loadMagazine();
    }
  }, [id]);

  const goNext = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const goPrevious = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white dark:bg-[#0a0f1a]">
        <p className="text-slate-500">Loading magazine...</p>
      </main>
    );
  }

  if (!issue) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center dark:bg-[#0a0f1a]">
        <h1 className="text-3xl font-black text-[#0b1736] dark:text-white">
          Magazine Not Found
        </h1>

        <p className="mt-3 text-slate-500">
          This magazine issue is unavailable or has not been published.
        </p>

        <Link
          href="/magazine"
          className="mt-6 rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white hover:bg-[#087f8c]"
        >
          ← Back to Magazine
        </Link>
      </main>
    );
  }

  const page = pages[currentPage];

  return (
    <main className="min-h-screen bg-slate-100 text-[#0b1736] dark:bg-[#080d16] dark:text-slate-100">

      {/* TOP BAR */}
      <section className="sticky top-[73px] z-40 border-b border-slate-200 bg-white/95 backdrop-blur-xl dark:border-slate-800 dark:bg-[#0a0f1a]/95">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">

          <Link
            href="/magazine"
            className="text-sm font-bold text-[#0b1736] hover:text-[#087f8c] dark:text-white"
          >
            ← Magazine
          </Link>

          <div className="text-center">
            <p className="text-sm font-black">
              {issue.season} {issue.year}
            </p>

            <p className="hidden text-xs text-slate-500 sm:block">
              {issue.title}
            </p>
          </div>

          <div className="text-sm font-bold text-slate-500">
            {pages.length > 0
              ? `Page ${currentPage + 1} of ${pages.length}`
              : "No pages"}
          </div>
        </div>
      </section>

      {/* READER */}
      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">

        {pages.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900">
            <div className="text-5xl">📖</div>

            <h2 className="mt-5 text-2xl font-black">
              Magazine pages are coming soon
            </h2>

            <p className="mt-3 text-slate-500 dark:text-slate-400">
              The editorial team has not added pages to this issue yet.
            </p>
          </div>
        ) : (
          <article className="min-h-[70vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-950">

            {/* PAGE HEADER */}
            <div className="border-b border-slate-200 px-6 py-8 text-center sm:px-12 dark:border-slate-800">
              {page.section && (
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#087f8c]">
                  {page.section}
                </p>
              )}

              {page.title && (
                <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                  {page.title}
                </h1>
              )}
            </div>

            {/* PAGE IMAGE */}
            {page.image_url && (
              <div className="flex justify-center border-b border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-900">
                <img
                  src={page.image_url}
                  alt={page.title || `Page ${page.page_number}`}
                  className="max-h-[750px] w-auto max-w-full rounded-lg object-contain shadow-lg"
                />
              </div>
            )}

            {/* PAGE CONTENT */}
            {page.content && (
              <div className="mx-auto max-w-3xl px-6 py-10 sm:px-12 sm:py-14">
                <div className="whitespace-pre-wrap text-base leading-8 text-slate-700 dark:text-slate-300">
                  {page.content}
                </div>
              </div>
            )}

            {/* PDF */}
            {page.pdf_url && (
              <div className="border-t border-slate-200 px-6 py-8 text-center dark:border-slate-800">
                <a
                  href={page.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white hover:bg-[#087f8c]"
                >
                  Open PDF →
                </a>
              </div>
            )}

            {/* PAGE NUMBER */}
            <div className="border-t border-slate-200 py-5 text-center text-xs font-semibold text-slate-400 dark:border-slate-800">
              {page.page_number}
            </div>
          </article>
        )}

        {/* NAVIGATION */}
        {pages.length > 0 && (
          <div className="mt-6 flex items-center justify-between gap-4">

            <button
              type="button"
              onClick={goPrevious}
              disabled={currentPage === 0}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-bold text-[#0b1736] transition hover:border-[#087f8c] hover:text-[#087f8c] disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              ← Previous
            </button>

            <button
              type="button"
              onClick={() => router.push("/magazine")}
              className="hidden rounded-full border border-slate-300 px-5 py-3 text-sm font-bold text-slate-600 hover:text-[#087f8c] sm:block dark:border-slate-700 dark:text-slate-300"
            >
              All Issues
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={currentPage === pages.length - 1}
              className="rounded-full bg-[#0b1736] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next →
            </button>

          </div>
        )}
      </section>
    </main>
  );
}