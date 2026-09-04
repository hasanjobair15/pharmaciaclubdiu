"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MultiImageUploader from "@/app/components/multi-image-uploader";
import { parseImageList, serializeImageList } from "@/lib/images";

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

export default function AdminNewsPage() {
  const supabase = createClient();

  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [publishedDate, setPublishedDate] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(true);

  useEffect(() => {
    loadNews();
  }, []);

  async function loadNews() {
    setLoading(true);

    const { data, error } = await supabase
      .from("news")
      .select(
        "id, title, excerpt, content, image_url, author, published_date, is_published, category"
      )
      .order("published_date", { ascending: false });

    if (error) {
      alert(error.message);
    } else {
      setNews(data || []);
    }

    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setExcerpt("");
    setContent("");
    setAuthor("");
    setPublishedDate("");
    setCategory("");
    setImageUrls([]);
    setIsPublished(true);
  }

  function editNews(item: NewsItem) {
    setEditingId(item.id);
    setTitle(item.title);
    setExcerpt(item.excerpt || "");
    setContent(item.content || "");
    setAuthor(item.author || "");
    setPublishedDate(item.published_date || "");
    setCategory(item.category || "");
    setImageUrls(parseImageList(item.image_url));
    setIsPublished(item.is_published);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteNews(id: number) {
    const confirmed = confirm(
      "Are you sure you want to delete this news?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("news")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("News deleted successfully.");

    loadNews();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a news title.");
      return;
    }

    setSaving(true);

    const newsData = {
      title: title.trim(),
      excerpt: excerpt.trim() || null,
      content: content.trim() || null,
      image_url: serializeImageList(imageUrls),
      author: author.trim() || null,
      published_date: publishedDate || null,
      is_published: isPublished,
      category: category.trim() || null,
    };

    let error;

    if (editingId !== null) {
      const result = await supabase
        .from("news")
        .update(newsData)
        .eq("id", editingId);

      error = result.error;
    } else {
      const result = await supabase
        .from("news")
        .insert([newsData]);

      error = result.error;
    }

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      editingId !== null
        ? "News updated successfully."
        : "News added successfully."
    );

    resetForm();
    loadNews();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              News Manager
            </h1>

            <p className="mt-1 text-slate-600">
              Manage Pharmacia Club DIU news and announcements.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/admin/dashboard"
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Dashboard
            </a>

            <a
              href="/news"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View Site
            </a>
          </div>
        </div>

        {/* Add / Edit Form */}
        <section className="mb-10 rounded-2xl bg-white p-6 shadow">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {editingId !== null ? "Edit News" : "Add News"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add or update news for the Pharmacia Club DIU website.
              </p>
            </div>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                News Title *
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter news title"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Category + Date */}
            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Category
                </label>

                <input
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="Seminar, Achievement, Announcement..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Published Date
                </label>

                <input
                  type="date"
                  value={publishedDate}
                  onChange={(e) => setPublishedDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>

            {/* Author */}
            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                Author
              </label>

              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Pharmacia Club DIU"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                Short Excerpt
              </label>

              <textarea
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Write a short summary of the news..."
                rows={4}
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Full Content */}
            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                Full Content
              </label>

              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write the full news content here..."
                rows={10}
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Images */}
            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                News Images
              </label>

              <MultiImageUploader
                value={imageUrls}
                onChange={setImageUrls}
                folder="news"
                inputId="news-image"
                enableCover
              />

              <p className="mt-2 text-xs text-slate-500">
                The ★ Cover photo is the first one shown on the news list and
                in shared links.
              </p>
            </div>

            {/* Published Status */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="h-5 w-5"
                />

                <div>
                  <p className="font-semibold text-slate-800">
                    Publish this news
                  </p>

                  <p className="text-sm text-slate-500">
                    If checked, this news can appear on the public website.
                  </p>
                </div>
              </label>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                  ? "Update News"
                  : "Add News"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-slate-200 px-6 py-3 font-semibold text-slate-800 hover:bg-slate-300"
              >
                Clear
              </button>

            </div>
          </form>
        </section>

        {/* News List */}
        <section className="rounded-2xl bg-white p-6 shadow">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              News
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {news.length} news item{news.length !== 1 ? "s" : ""}
            </p>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-500">
              Loading news...
            </p>
          ) : news.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-slate-500">
                No news has been added yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">

              {news.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-5 rounded-xl border border-slate-200 p-4 md:flex-row"
                >

                  {/* Image */}
                  <div className="shrink-0">
                    {parseImageList(item.image_url).length > 0 ? (
                      <img
                        src={parseImageList(item.image_url)[0]}
                        alt={item.title}
                        className="h-40 w-full rounded-lg object-cover md:w-56"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center rounded-lg bg-slate-100 text-slate-400 md:w-56">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">

                    <div className="mb-2 flex flex-wrap gap-2">

                      {item.category && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {item.category}
                        </span>
                      )}

                      {item.published_date && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                          {item.published_date}
                        </span>
                      )}

                      <span
                        className={
                          item.is_published
                            ? "rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700"
                            : "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                        }
                      >
                        {item.is_published
                          ? "Published"
                          : "Unpublished"}
                      </span>

                    </div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>

                    {item.author && (
                      <p className="mt-1 text-xs font-medium text-slate-500">
                        By {item.author}
                      </p>
                    )}

                    {item.excerpt && (
                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {item.excerpt}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">

                      <button
                        type="button"
                        onClick={() => editNews(item)}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteNews(item.id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        Delete
                      </button>

                    </div>
                  </div>

                </div>
              ))}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}