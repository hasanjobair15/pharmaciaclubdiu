"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PublicationItem = {
  id: number;
  title: string;
  authors: string | null;
  publication_type: string | null;
  journal: string | null;
  publication_date: string | null;
  doi: string | null;
  abstract: string | null;
  pdf_url: string | null;
  external_url: string | null;
  image_url: string | null;
  created_at: string;
};

export default function PublicationsPage() {
  const supabase = createClient();

  const [publications, setPublications] = useState<PublicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");

  useEffect(() => {
    fetchPublications();
  }, []);

  async function fetchPublications() {
    setLoading(true);

    const { data, error } = await supabase
      .from("publications")
      .select("*")
      .order("publication_date", { ascending: false });

    if (error) {
      console.error("Error loading publications:", error);
      setPublications([]);
    } else {
      setPublications(data || []);
    }

    setLoading(false);
  }

  const publicationTypes = useMemo(() => {
    const types = publications
      .map((item) => item.publication_type)
      .filter((type): type is string => Boolean(type));

    return ["All", ...Array.from(new Set(types))];
  }, [publications]);

  const filteredPublications = useMemo(() => {
    const query = search.toLowerCase().trim();

    return publications.filter((item) => {
      const matchesSearch =
        !query ||
        item.title?.toLowerCase().includes(query) ||
        item.authors?.toLowerCase().includes(query) ||
        item.journal?.toLowerCase().includes(query) ||
        item.abstract?.toLowerCase().includes(query) ||
        item.publication_type?.toLowerCase().includes(query);

      const matchesType =
        typeFilter === "All" || item.publication_type === typeFilter;

      return matchesSearch && matchesType;
    });
  }, [publications, search, typeFilter]);

  function formatDate(date: string | null) {
    if (!date) return "Date not available";

    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function getDoiUrl(doi: string) {
    if (doi.startsWith("http://") || doi.startsWith("https://")) {
      return doi;
    }

    return `https://doi.org/${doi}`;
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Hero */}
      <section className="pc-mesh relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-600 to-rose-600 px-6 py-16 text-white">
        <div className="mx-auto max-w-6xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-200">
            Pharmacia Club DIU
          </p>

          <h1 className="text-4xl font-bold md:text-5xl">
            Publications
          </h1>

          <p className="mt-4 max-w-2xl text-blue-100">
            Explore research publications, review articles, conference papers,
            and other scholarly works from the Pharmacia Club community.
          </p>
        </div>
      </section>

      {/* Search & Filter */}
      <section className="mx-auto max-w-6xl px-6 py-8">
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-4 md:grid-cols-[1fr_250px]">
            <input
              type="text"
              placeholder="Search publications, authors, journals..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            >
              {publicationTypes.map((type) => (
                <option key={type} value={type}>
                  {type === "All" ? "All Publication Types" : type}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Publications */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        {loading ? (
          <div className="py-20 text-center">
            <p className="text-slate-500">Loading publications...</p>
          </div>
        ) : filteredPublications.length === 0 ? (
          <div className="rounded-2xl bg-white py-20 text-center shadow-sm ring-1 ring-slate-200">
            <h2 className="text-xl font-semibold text-slate-800">
              No publications found
            </h2>

            <p className="mt-2 text-slate-500">
              Try changing your search or publication type filter.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredPublications.map((item) => (
              <article
                key={item.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200 transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Image */}
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="h-52 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-52 items-center justify-center bg-gradient-to-br from-blue-100 to-indigo-100">
                    <span className="text-5xl">📚</span>
                  </div>
                )}

                <div className="p-6">
                  {/* Type & Date */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-800">
                      {item.publication_type || "Publication"}
                    </span>

                    <span className="text-xs text-slate-500">
                      {formatDate(item.publication_date)}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="mt-4 text-xl font-bold leading-snug text-slate-900">
                    {item.title}
                  </h2>

                  {/* Authors */}
                  {item.authors && (
                    <p className="mt-3 text-sm text-slate-600">
                      <span className="font-semibold">Authors:</span>{" "}
                      {item.authors}
                    </p>
                  )}

                  {/* Journal */}
                  {item.journal && (
                    <p className="mt-2 text-sm text-slate-600">
                      <span className="font-semibold">Journal:</span>{" "}
                      {item.journal}
                    </p>
                  )}

                  {/* Abstract */}
                  {item.abstract && (
                    <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
                      {item.abstract}
                    </p>
                  )}

                  {/* DOI */}
                  {item.doi && (
                    <p className="mt-4 break-all text-xs text-slate-500">
                      DOI: {item.doi}
                    </p>
                  )}

                  {/* Buttons */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/publications/${item.id}`}
                      className="rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
                    >
                      View Details
                    </Link>

                    {item.pdf_url && (
                      <a
                        href={item.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        📄 PDF
                      </a>
                    )}

                    {item.external_url && (
                      <a
                        href={item.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        🔗 External
                      </a>
                    )}

                    {item.doi && (
                      <a
                        href={getDoiUrl(item.doi)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        DOI
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}