"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function PublicationDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const supabase = createClient();

  const [publication, setPublication] = useState<PublicationItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchPublication();
    }
  }, [id]);

  async function fetchPublication() {
    setLoading(true);

    const { data, error } = await supabase
      .from("publications")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading publication:", error);
      setPublication(null);
    } else {
      setPublication(data);
    }

    setLoading(false);
  }

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

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500">Loading publication...</p>
      </main>
    );
  }

  if (!publication) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">
            Publication Not Found
          </h1>

          <p className="mt-2 text-slate-500">
            The publication may have been removed or does not exist.
          </p>

          <Link
            href="/publications"
            className="mt-6 inline-block rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
          >
            ← Back to Publications
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-900 px-6 py-14 text-white">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/publications"
            className="mb-6 inline-block text-sm font-medium text-blue-200 hover:text-white"
          >
            ← Back to Publications
          </Link>

          {publication.publication_type && (
            <span className="inline-block rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
              {publication.publication_type}
            </span>
          )}

          <h1 className="mt-5 text-3xl font-bold leading-tight md:text-5xl">
            {publication.title}
          </h1>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200">
          {/* Image */}
          {publication.image_url && (
            <img
              src={publication.image_url}
              alt={publication.title}
              className="max-h-[500px] w-full object-cover"
            />
          )}

          <div className="p-6 md:p-10">
            {/* Metadata */}
            <div className="grid gap-6 border-b border-slate-200 pb-8 md:grid-cols-2">
              {publication.authors && (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Authors
                  </p>
                  <p className="mt-1 text-slate-800">
                    {publication.authors}
                  </p>
                </div>
              )}

              {publication.journal && (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Journal
                  </p>
                  <p className="mt-1 text-slate-800">
                    {publication.journal}
                  </p>
                </div>
              )}

              {publication.publication_date && (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Publication Date
                  </p>
                  <p className="mt-1 text-slate-800">
                    {formatDate(publication.publication_date)}
                  </p>
                </div>
              )}

              {publication.publication_type && (
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                    Publication Type
                  </p>
                  <p className="mt-1 text-slate-800">
                    {publication.publication_type}
                  </p>
                </div>
              )}
            </div>

            {/* Abstract */}
            {publication.abstract && (
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-slate-900">
                  Abstract
                </h2>

                <p className="mt-4 whitespace-pre-line leading-8 text-slate-600">
                  {publication.abstract}
                </p>
              </div>
            )}

            {/* DOI */}
            {publication.doi && (
              <div className="mt-8 rounded-xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-slate-500">
                  DOI
                </p>

                <a
                  href={getDoiUrl(publication.doi)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block break-all text-blue-700 hover:underline"
                >
                  {publication.doi}
                </a>
              </div>
            )}

            {/* Links */}
            <div className="mt-8 flex flex-wrap gap-3">
              {publication.pdf_url && (
                <a
                  href={publication.pdf_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-blue-700 px-5 py-3 font-semibold text-white hover:bg-blue-800"
                >
                  📄 View PDF
                </a>
              )}

              {publication.external_url && (
                <a
                  href={publication.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  🔗 External Link
                </a>
              )}

              {publication.doi && (
                <a
                  href={getDoiUrl(publication.doi)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-700 hover:bg-slate-100"
                >
                  DOI
                </a>
              )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}