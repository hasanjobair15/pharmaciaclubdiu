"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type GalleryItem = {
  id: number;
  title: string;
  description: string | null;
  image_url: string | null;
  event_name: string | null;
  event_date: string | null;
  category: string | null;
  created_at: string;
};

export default function GalleryPage() {
  const supabase = createClient();

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchGallery();
  }, []);

  async function fetchGallery() {
    setLoading(true);

    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) {
      console.error("Gallery error:", error);
      setItems([]);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }

  const categories = [
    "All",
    ...Array.from(
      new Set(
        items
          .map((item) => item.category)
          .filter((category): category is string => Boolean(category))
      )
    ),
  ];

  const filteredItems = items.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;

    const searchText = search.toLowerCase();

    const matchesSearch =
      item.title?.toLowerCase().includes(searchText) ||
      item.event_name?.toLowerCase().includes(searchText) ||
      item.description?.toLowerCase().includes(searchText) ||
      item.category?.toLowerCase().includes(searchText);

    return matchesCategory && matchesSearch;
  });

  function formatDate(date: string | null) {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50">

      {/* HERO SECTION */}
      <section className="bg-gradient-to-r from-slate-950 via-blue-950 to-slate-900 px-6 py-20 text-center text-white">
        <div className="mx-auto max-w-5xl">

          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            Pharmacia Club DIU
          </p>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
            Gallery
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            Explore memorable moments, events, seminars, competitions, and
            activities of Pharmacia Club, Department of Pharmacy,
            Daffodil International University.
          </p>

        </div>
      </section>

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-7xl px-6 py-12">

        {/* SEARCH */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search gallery..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* CATEGORY FILTER */}
        {categories.length > 1 && (
          <div className="mb-10 flex flex-wrap gap-3">

            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  selectedCategory === category
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100"
                }`}
              >
                {category}
              </button>
            ))}

          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div className="py-20 text-center">

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600"></div>

            <p className="mt-4 text-slate-500">
              Loading gallery...
            </p>

          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredItems.length === 0 && (
          <div className="rounded-2xl bg-white px-6 py-20 text-center shadow-sm ring-1 ring-slate-200">

            <div className="mb-4 text-5xl">
              📷
            </div>

            <h2 className="text-2xl font-bold text-slate-900">
              No photos found
            </h2>

            <p className="mt-2 text-slate-500">
              Try another search or category.
            </p>

          </div>
        )}

        {/* GALLERY GRID */}
        {!loading && filteredItems.length > 0 && (
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">

            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
              >

                {/* IMAGE */}
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">

                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl text-slate-400">
                      📷
                    </div>
                  )}

                  {/* CATEGORY BADGE */}
                  {item.category && (
                    <div className="absolute left-4 top-4">
                      <span className="rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
                        {item.category}
                      </span>
                    </div>
                  )}

                  {/* IMAGE HOVER BUTTON */}
                  {item.image_url && (
                    <button
                      onClick={() => setSelectedImage(item)}
                      className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100"
                    >
                      <span className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg">
                        View Photo
                      </span>
                    </button>
                  )}

                </div>

                {/* CARD DETAILS */}
                <div className="p-5">

                  <h2 className="line-clamp-2 text-xl font-bold text-slate-900">
                    {item.title}
                  </h2>

                  {item.event_name && (
                    <p className="mt-2 font-medium text-blue-600">
                      {item.event_name}
                    </p>
                  )}

                  {item.event_date && (
                    <p className="mt-1 text-sm text-slate-500">
                      {formatDate(item.event_date)}
                    </p>
                  )}

                  {item.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                      {item.description}
                    </p>
                  )}

                  {item.image_url && (
                    <button
                      onClick={() => setSelectedImage(item)}
                      className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      View Photo
                    </button>
                  )}

                </div>

              </article>
            ))}

          </div>
        )}

      </section>

      {/* LIGHTBOX */}
      {selectedImage && selectedImage.image_url && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >

          {/* CLOSE BUTTON */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-bold text-slate-900 shadow-lg hover:bg-slate-200"
            aria-label="Close"
          >
            ×
          </button>

          {/* IMAGE */}
          <div
            className="relative max-h-[90vh] max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >

            <img
              src={selectedImage.image_url}
              alt={selectedImage.title}
              className="max-h-[85vh] max-w-full rounded-xl object-contain shadow-2xl"
            />

            <div className="mt-4 text-center">

              <h2 className="text-xl font-bold text-white">
                {selectedImage.title}
              </h2>

              {selectedImage.event_name && (
                <p className="mt-1 text-slate-300">
                  {selectedImage.event_name}
                </p>
              )}

            </div>

          </div>

        </div>
      )}

    </main>
  );
}