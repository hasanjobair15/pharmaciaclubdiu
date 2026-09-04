"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import NewsImages from "@/app/components/news-images";
import NewsShare from "@/app/components/news-share";

type NewsItem = {
  id: number;
  title: string;
  excerpt: string | null;
  content: string | null;
  image_url: string | null;
  author: string | null;
  published_date: string | null;
  is_published: boolean;
  category: string | null;
};

export default function NewsDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [news, setNews] = useState<NewsItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadNews() {
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("news")
      .select(
        "id, title, excerpt, content, image_url, author, published_date, is_published, category"
      )
      .eq("id", id)
      .eq("is_published", true)
      .single();

    if (error) {
      console.error(error);
      setErrorMessage("News article not found.");
      setNews(null);
    } else {
      setNews(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (id) {
      loadNews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function formatDate(date: string | null) {
    if (!date) return "Date not announced";

    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 transition-colors dark:bg-[#0a0f1a] dark:text-slate-100">
        <p className="text-slate-600 dark:text-slate-400">
          Loading news...
        </p>
      </main>
    );
  }

  if (!news || errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 text-slate-900 transition-colors dark:bg-[#0a0f1a] dark:text-slate-100">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            News Not Found
          </h1>

          <p className="mt-3 text-slate-600 dark:text-slate-400">
            The news article you are looking for does not exist or is
            no longer published.
          </p>

          <Link
            href="/news"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 dark:bg-cyan-600 dark:text-[#062a2d] dark:hover:bg-cyan-500"
          >
            Back to News
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#0a0f1a] dark:text-slate-100">

      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-10 text-white dark:from-[#111827] dark:via-[#12383c] dark:to-[#172554]">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/news"
            className="inline-flex text-sm font-medium text-blue-100 transition hover:text-white dark:text-cyan-200 dark:hover:text-white"
          >
            ← Back to News
          </Link>
        </div>
      </section>

      {/* Article */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-700 dark:bg-[#111827] dark:shadow-none">

          {/* Featured Image / Image Grid */}
          <NewsImages imageUrl={news.image_url} title={news.title} />

          <div className="p-6 md:p-10">

            {/* Category */}
            {news.category && (
              <span className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                {news.category}
              </span>
            )}

            {/* Title */}
            <h1 className="mt-5 text-3xl font-bold leading-tight text-slate-900 dark:text-white md:text-5xl">
              {news.title}
            </h1>

            {/* Share */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
              <NewsShare
                title={news.title}
                imageUrl={
                  news.image_url
                    ? (() => {
                        try {
                          const parsed = JSON.parse(news.image_url);
                          return Array.isArray(parsed) && parsed.length > 0
                            ? parsed[0]
                            : news.image_url;
                        } catch {
                          return news.image_url;
                        }
                      })()
                    : null
                }
              />

              <span className="text-xs font-medium text-slate-400 dark:text-slate-500">
                Share this article with your friends
              </span>
            </div>

            {/* Meta Information */}
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500 dark:text-slate-400">
              {news.published_date && (
                <span>
                  📅 {formatDate(news.published_date)}
                </span>
              )}

              {news.author && (
                <span>
                  ✍️ By {news.author}
                </span>
              )}
            </div>

            {/* Excerpt */}
            {news.excerpt && (
              <div className="mt-8 rounded-xl bg-slate-50 p-5 dark:bg-[#0f172a]">
                <p className="text-lg font-medium leading-8 text-slate-700 dark:text-slate-300">
                  {news.excerpt}
                </p>
              </div>
            )}

            {/* Full Content */}
            {news.content ? (
              <div className="mt-10">
                <div className="whitespace-pre-line text-base leading-8 text-slate-700 dark:text-slate-300 md:text-lg">
                  {news.content}
                </div>
              </div>
            ) : (
              <div className="mt-10">
                <p className="text-slate-500 dark:text-slate-400">
                  No additional content is available for this news article.
                </p>
              </div>
            )}

            {/* Back Button */}
            <div className="mt-12 border-t border-slate-200 pt-8 dark:border-slate-700">
              <Link
                href="/news"
                className="inline-flex rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 dark:bg-cyan-600 dark:text-[#062a2d] dark:hover:bg-cyan-500"
              >
                ← Back to All News
              </Link>
            </div>

          </div>
        </article>
      </section>
    </main>
  );
}