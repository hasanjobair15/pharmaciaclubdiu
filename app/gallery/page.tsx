"use client";

import { useEffect, useState } from "react";
import PageHero from "../components/page-hero";
import Reveal from "../components/reveal";
import { createClient } from "@/lib/supabase/client";
import { parseImageList } from "@/lib/images";

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
  const [lightboxIndex, setLightboxIndex] = useState(0);
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

  const lightboxUrls = selectedImage ? parseImageList(selectedImage.image_url) : [];

  function openLightbox(item: GalleryItem) {
    setSelectedImage(item);
    setLightboxIndex(0);
  }

  function lightboxStep(delta: number) {
    if (lightboxUrls.length < 2) return;
    setLightboxIndex((i) => (i + delta + lightboxUrls.length) % lightboxUrls.length);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!selectedImage) return;
      if (e.key === "Escape") setSelectedImage(null);
      if (e.key === "ArrowRight") lightboxStep(1);
      if (e.key === "ArrowLeft") lightboxStep(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImage, lightboxUrls.length]);

  function formatDate(date: string | null) {
    if (!date) return "";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 transition-colors dark:bg-[#0a0f1a] dark:text-slate-100">

      {/* HERO SECTION — colorful gradient banner */}
      <PageHero
        emoji="📸"
        title="Gallery"
        accent="& Moments"
        index={3}
        subtitle="Explore memorable moments, events, seminars, competitions and activities of Pharmacia Club, Department of Pharmacy, Daffodil International University."
      />

      {/* MAIN CONTENT */}
      <section className="mx-auto max-w-7xl px-6 py-12">

        {/* SEARCH */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search gallery..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-900/40"
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
                    ? "bg-blue-600 text-white shadow-md dark:bg-cyan-600 dark:text-[#062a2d]"
                    : "bg-white text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-100 dark:bg-[#111827] dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
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

            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600 dark:border-slate-700 dark:border-t-cyan-500"></div>

            <p className="mt-4 text-slate-500 dark:text-slate-400">
              Loading gallery...
            </p>

          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredItems.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm dark:border-slate-700 dark:bg-[#111827] dark:shadow-none">

            <div className="mb-4 text-5xl">
              📷
            </div>

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              No photos found
            </h2>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Try another search or category.
            </p>

          </div>
        )}

        {/* GALLERY GRID */}
        {!loading && filteredItems.length > 0 && (
          <div className="pc-stagger grid gap-7 sm:grid-cols-2 lg:grid-cols-3">

            {filteredItems.map((item) => (
              <article
                key={item.id}
                className="pc-card3d group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm ring-1 ring-slate-200 dark:border-slate-700 dark:bg-[#111827] dark:ring-slate-700 dark:shadow-none"
              >

                {/* IMAGE */}
                <div className="pc-img3d relative aspect-[4/3] overflow-hidden bg-slate-200 dark:bg-slate-800">

                  {parseImageList(item.image_url).length > 0 ? (
                    <img
                      src={parseImageList(item.image_url)[0]}
                      alt={item.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-5xl text-slate-400 dark:text-slate-600">
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
                  {parseImageList(item.image_url).length > 0 && (
                    <button
                      onClick={() => openLightbox(item)}
                      className="absolute inset-0 flex items-center justify-center bg-black/0 text-white opacity-0 transition group-hover:bg-black/30 group-hover:opacity-100"
                    >
                      <span className="rounded-full bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg">
                        {parseImageList(item.image_url).length > 1
                          ? `View ${parseImageList(item.image_url).length} Photos`
                          : "View Photo"}
                      </span>
                    </button>
                  )}

                  {parseImageList(item.image_url).length > 1 && (
                    <div className="absolute bottom-4 right-4">
                      <span className="rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                        {parseImageList(item.image_url).length} photos
                      </span>
                    </div>
                  )}

                </div>

                {/* CARD DETAILS */}
                <div className="p-5">

                  <h2 className="line-clamp-2 text-xl font-bold text-slate-900 dark:text-white">
                    {item.title}
                  </h2>

                  {item.event_name && (
                    <p className="mt-2 font-medium text-blue-600 dark:text-cyan-400">
                      {item.event_name}
                    </p>
                  )}

                  {item.event_date && (
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {formatDate(item.event_date)}
                    </p>
                  )}

                  {item.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                      {item.description}
                    </p>
                  )}

                  {parseImageList(item.image_url).length > 0 && (
                    <button
                      onClick={() => openLightbox(item)}
                      className="mt-5 w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-cyan-600 dark:text-[#062a2d] dark:hover:bg-cyan-500"
                    >
                      {parseImageList(item.image_url).length > 1
                        ? `View ${parseImageList(item.image_url).length} Photos`
                        : "View Photo"}
                    </button>
                  )}

                </div>

              </article>
            ))}

          </div>
        )}

      </section>

      {/* LIGHTBOX */}
      {selectedImage && lightboxUrls.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setSelectedImage(null)}
        >

          {/* CLOSE BUTTON */}
          <button
            onClick={() => setSelectedImage(null)}
            className="absolute right-5 top-5 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-white text-2xl font-bold text-slate-900 shadow-lg transition hover:bg-slate-200"
            aria-label="Close"
          >
            ×
          </button>

          {/* PREV / NEXT */}
          {lightboxUrls.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  lightboxStep(-1);
                }}
                aria-label="Previous photo"
                className="absolute left-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-slate-900 shadow-lg transition hover:bg-white sm:left-6"
              >
                ‹
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  lightboxStep(1);
                }}
                aria-label="Next photo"
                className="absolute right-3 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-2xl font-bold text-slate-900 shadow-lg transition hover:bg-white sm:right-6"
              >
                ›
              </button>
            </>
          )}

          {/* IMAGE */}
          <div
            className="relative max-h-[90vh] max-w-6xl"
            onClick={(e) => e.stopPropagation()}
          >

            <img
              src={lightboxUrls[lightboxIndex]}
              alt={selectedImage.title}
              className="max-h-[82vh] max-w-full rounded-xl object-contain shadow-2xl"
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

              {lightboxUrls.length > 1 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  <p className="mr-2 text-sm font-semibold text-slate-300">
                    {lightboxIndex + 1} / {lightboxUrls.length}
                  </p>

                  {lightboxUrls.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setLightboxIndex(i);
                      }}
                      aria-label={`Photo ${i + 1}`}
                      className={`h-2.5 rounded-full transition-all ${
                        i === lightboxIndex
                          ? "w-6 bg-cyan-400"
                          : "w-2.5 bg-white/40 hover:bg-white/70"
                      }`}
                    />
                  ))}
                </div>
              )}

            </div>

          </div>

        </div>
      )}

    </main>
  );
}