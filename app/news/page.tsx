"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { parseImageList } from "@/lib/images";

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

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("news")
      .select(
        "id, title, excerpt, content, image_url, author, published_date, is_published, category"
      )
      .eq("is_published", true)
      .order("published_date", { ascending: false });

    if (error) {
      console.error(error);
      setError(error.message);
    } else {
      setNews(data || []);
    }

    setLoading(false);
  }

  function formatDate(date: string | null) {
    if (!date) return "Date not announced";

    return new Date(date + "T00:00:00").toLocaleDateString("en-US", {
      weekday: "short",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  }

  const categories = useMemo(() => {
    const uniqueCategories = Array.from(
      new Set(
        news
          .map((item) => item.category)
          .filter((item): item is string => Boolean(item))
      )
    );

    return ["All", ...uniqueCategories];
  }, [news]);

  const filteredNews = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return news.filter((item) => {
      const matchesSearch =
        !searchText ||
        item.title.toLowerCase().includes(searchText) ||
        item.excerpt?.toLowerCase().includes(searchText) ||
        item.content?.toLowerCase().includes(searchText) ||
        item.author?.toLowerCase().includes(searchText) ||
        item.category?.toLowerCase().includes(searchText);

      const matchesCategory =
        category === "All" || item.category === category;

      return matchesSearch && matchesCategory;
    });
  }, [news, search, category]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900 transition-colors dark:bg-[#0a0f1a] dark:text-slate-100">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-slate-600 dark:text-slate-400">
            Loading news...
          </p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900 transition-colors dark:bg-[#0a0f1a] dark:text-slate-100">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
            Unable to load news
          </h1>

          <p className="mt-3 text-slate-600 dark:text-slate-400">
            {error}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#0a0f1a] dark:text-slate-100">

      {/* Hero */}
      <section className="pc-mesh relative overflow-hidden bg-gradient-to-br from-violet-700 via-fuchsia-700 to-indigo-800 px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-200 dark:text-cyan-300">
            Pharmacia Club DIU
          </p>

          <h1 className="text-4xl font-black md:text-5xl">
            <span className="pc-rainbow">News & Announcements</span>
          </h1>

          <p className="mt-4 max-w-2xl text-lg text-blue-100 dark:text-slate-300">
            Stay updated with the latest news, announcements, achievements,
            seminars, activities, and events of Pharmacia Club DIU.
          </p>
        </div>
      </section>

      {/* News Section */}
      <section className="mx-auto max-w-6xl px-6 py-12">

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-900/40"
          />
        </div>

        {/* Category Filter */}
        {categories.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-3">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  category === item
                    ? "bg-blue-600 text-white dark:bg-cyan-600 dark:text-[#062a2d]"
                    : "bg-white text-slate-700 shadow-sm hover:bg-slate-100 dark:bg-[#111827] dark:text-slate-300 dark:shadow-none dark:hover:bg-slate-800"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        )}

        {/* No News */}
        {news.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-[#111827] dark:shadow-none">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              No News Available
            </h2>

            <p className="mt-3 text-slate-600 dark:text-slate-400">
              New announcements and updates will be published here soon.
            </p>
          </div>
        ) : filteredNews.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-[#111827] dark:shadow-none">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              No Matching News
            </h2>

            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Try another search term or category.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCategory("All");
              }}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-cyan-600 dark:text-[#062a2d] dark:hover:bg-cyan-500"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <>
            {/* Result Count */}
            <div className="mb-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredNews.length} news item
                {filteredNews.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* News Grid */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredNews.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-[#111827] dark:shadow-none dark:hover:shadow-xl"
                >
                  {/* Image */}
                  {parseImageList(item.image_url).length > 0 ? (
                    <div className="relative">
                      <img
                        src={parseImageList(item.image_url)[0]}
                        alt={item.title}
                        className="h-56 w-full object-cover"
                      />

                      {parseImageList(item.image_url).length > 1 && (
                        <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">
                          📷 {parseImageList(item.image_url).length} photos
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-56 items-center justify-center bg-gradient-to-br from-blue-800 to-indigo-700 text-white dark:from-[#12383c] dark:to-[#172554]">
                      <span className="text-lg font-semibold">
                        Pharmacia Club DIU
                      </span>
                    </div>
                  )}

                  <div className="p-6">

                    {/* Category */}
                    {item.category && (
                      <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                        {item.category}
                      </span>
                    )}

                    {/* Title */}
                    <h2 className="mt-4 text-xl font-bold leading-7 text-slate-900 dark:text-white">
                      {item.title}
                    </h2>

                    {/* Date */}
                    {item.published_date && (
                      <p className="mt-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                        📅 {formatDate(item.published_date)}
                      </p>
                    )}

                    {/* Author */}
                    {item.author && (
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        By {item.author}
                      </p>
                    )}

                    {/* Excerpt */}
                    {item.excerpt && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {item.excerpt}
                      </p>
                    )}

                    {/* Button */}
                    <div className="mt-6">
                      <Link
                        href={`/news/${item.id}`}
                        className="inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-cyan-600 dark:text-[#062a2d] dark:hover:bg-cyan-500"
                      >
                        Read More
                      </Link>
                    </div>

                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}