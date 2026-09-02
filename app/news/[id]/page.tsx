"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

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

  useEffect(() => {
    if (id) {
      loadNews();
    }
  }, [id]);

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
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading news...</p>
      </main>
    );
  }

  if (!news || errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            News Not Found
          </h1>

          <p className="mt-3 text-slate-600">
            The news article you are looking for does not exist or is
            no longer published.
          </p>

          <Link
            href="/news"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Back to News
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* Hero */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/news"
            className="inline-flex text-sm font-medium text-blue-100 transition hover:text-white"
          >
            ← Back to News
          </Link>
        </div>
      </section>

      {/* Article */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <article className="overflow-hidden rounded-2xl bg-white shadow-md">

          {/* Featured Image */}
          {news.image_url ? (
            <img
              src={news.image_url}
              alt={news.title}
              className="max-h-[600px] w-full object-cover"
            />
          ) : (
            <div className="flex h-72 items-center justify-center bg-gradient-to-br from-blue-800 to-indigo-700 text-white">
              <span className="text-2xl font-bold">
                Pharmacia Club DIU
              </span>
            </div>
          )}

          <div className="p-6 md:p-10">

            {/* Category */}
            {news.category && (
              <span className="inline-block rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700">
                {news.category}
              </span>
            )}

            {/* Title */}
            <h1 className="mt-5 text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
              {news.title}
            </h1>

            {/* Meta Information */}
            <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
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
              <div className="mt-8 rounded-xl bg-slate-50 p-5">
                <p className="text-lg font-medium leading-8 text-slate-700">
                  {news.excerpt}
                </p>
              </div>
            )}

            {/* Full Content */}
            {news.content ? (
              <div className="mt-10">
                <div className="whitespace-pre-line text-base leading-8 text-slate-700 md:text-lg">
                  {news.content}
                </div>
              </div>
            ) : (
              <div className="mt-10">
                <p className="text-slate-500">
                  No additional content is available for this news article.
                </p>
              </div>
            )}

            {/* Back Button */}
            <div className="mt-12 border-t border-slate-200 pt-8">
              <Link
                href="/news"
                className="inline-flex rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
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