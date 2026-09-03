"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ResearchItem = {
  id: number;
  title: string;
  abstract: string | null;
  authors: string | null;
  research_area: string | null;
  supervisor: string | null;
  publication_status: string | null;
  doi: string | null;
  external_url: string | null;
  image_url: string | null;
  created_at: string | null;
};

export default function ResearchPage() {
  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [area, setArea] = useState("All");
  const [error, setError] = useState("");

  useEffect(() => {
    loadResearch();
  }, []);

  async function loadResearch() {
    setLoading(true);
    setError("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("research")
      .select(
        "id, title, abstract, authors, research_area, supervisor, publication_status, doi, external_url, image_url, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setError(error.message);
    } else {
      setResearch(data || []);
    }

    setLoading(false);
  }

  const researchAreas = useMemo(() => {
    const uniqueAreas = Array.from(
      new Set(
        research
          .map((item) => item.research_area)
          .filter((item): item is string => Boolean(item))
      )
    );

    return ["All", ...uniqueAreas];
  }, [research]);

  const filteredResearch = useMemo(() => {
    const searchText = search.toLowerCase().trim();

    return research.filter((item) => {
      const matchesSearch =
        !searchText ||
        item.title.toLowerCase().includes(searchText) ||
        item.abstract?.toLowerCase().includes(searchText) ||
        item.authors?.toLowerCase().includes(searchText) ||
        item.supervisor?.toLowerCase().includes(searchText) ||
        item.research_area?.toLowerCase().includes(searchText) ||
        item.publication_status?.toLowerCase().includes(searchText);

      const matchesArea =
        area === "All" || item.research_area === area;

      return matchesSearch && matchesArea;
    });
  }, [research, search, area]);

  function getStatusClass(status: string | null) {
    switch (status) {
      case "Published":
        return "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300";

      case "Accepted":
        return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300";

      case "Under Review":
        return "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300";

      case "Ongoing":
        return "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300";

      case "Completed":
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-900 transition-colors dark:bg-[#0a0f1a] dark:text-slate-100">
        <p className="text-slate-600 dark:text-slate-400">
          Loading research...
        </p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 text-slate-900 transition-colors dark:bg-[#0a0f1a] dark:text-slate-100">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="text-2xl font-bold text-red-600 dark:text-red-400">
            Unable to load research
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
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-16 text-white dark:from-[#111827] dark:via-[#12383c] dark:to-[#172554]">
        <div className="mx-auto max-w-6xl">

          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-200 dark:text-cyan-300">
            Pharmacia Club DIU
          </p>

          <h1 className="text-4xl font-bold md:text-5xl">
            Research
          </h1>

          <p className="mt-4 max-w-2xl text-lg leading-8 text-blue-100 dark:text-slate-300">
            Explore research projects, academic studies, and scientific
            contributions from Pharmacia Club DIU.
          </p>

        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-6 py-12">

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search research..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-300 bg-white px-5 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-cyan-500 dark:focus:ring-cyan-900/40"
          />
        </div>

        {/* Research Areas */}
        {researchAreas.length > 1 && (
          <div className="mb-8 flex flex-wrap gap-3">

            {researchAreas.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setArea(item)}
                className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
                  area === item
                    ? "bg-blue-600 text-white dark:bg-cyan-600 dark:text-[#062a2d]"
                    : "bg-white text-slate-700 shadow-sm hover:bg-slate-100 dark:bg-[#111827] dark:text-slate-300 dark:shadow-none dark:hover:bg-slate-800"
                }`}
              >
                {item}
              </button>
            ))}

          </div>
        )}

        {/* No Research */}
        {research.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-[#111827] dark:shadow-none">

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              No Research Available
            </h2>

            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Research projects and publications will be added here soon.
            </p>

          </div>
        ) : filteredResearch.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-700 dark:bg-[#111827] dark:shadow-none">

            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              No Matching Research
            </h2>

            <p className="mt-3 text-slate-600 dark:text-slate-400">
              Try another search term or research area.
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch("");
                setArea("All");
              }}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 dark:bg-cyan-600 dark:text-[#062a2d] dark:hover:bg-cyan-500"
            >
              Clear Filters
            </button>

          </div>
        ) : (
          <>
            <div className="mb-6">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Showing {filteredResearch.length} research project
                {filteredResearch.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Cards */}
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">

              {filteredResearch.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-[#111827] dark:shadow-none dark:hover:shadow-xl"
                >

                  {/* Image */}
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="h-56 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-56 items-center justify-center bg-gradient-to-br from-blue-800 to-indigo-700 text-white dark:from-[#12383c] dark:to-[#172554]">
                      <span className="text-lg font-semibold">
                        Pharmacia Club DIU
                      </span>
                    </div>
                  )}

                  <div className="p-6">

                    {/* Area + Status */}
                    <div className="flex flex-wrap gap-2">

                      {item.research_area && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          {item.research_area}
                        </span>
                      )}

                      {item.publication_status && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            item.publication_status
                          )}`}
                        >
                          {item.publication_status}
                        </span>
                      )}

                    </div>

                    {/* Title */}
                    <h2 className="mt-4 text-xl font-bold leading-7 text-slate-900 dark:text-white">
                      {item.title}
                    </h2>

                    {/* Authors */}
                    {item.authors && (
                      <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">
                        Authors: {item.authors}
                      </p>
                    )}

                    {/* Supervisor */}
                    {item.supervisor && (
                      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Supervisor: {item.supervisor}
                      </p>
                    )}

                    {/* Abstract */}
                    {item.abstract && (
                      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600 dark:text-slate-400">
                        {item.abstract}
                      </p>
                    )}

                    {/* Buttons */}
                    <div className="mt-6 flex flex-wrap gap-2">

                      <Link
                        href={`/research/${item.id}`}
                        className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 dark:bg-cyan-600 dark:text-[#062a2d] dark:hover:bg-cyan-500"
                      >
                        View Details
                      </Link>

                      {item.external_url && (
                        <a
                          href={item.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-blue-600 px-5 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-50 dark:border-cyan-500 dark:text-cyan-400 dark:hover:bg-cyan-950/40"
                        >
                          External Link
                        </a>
                      )}

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