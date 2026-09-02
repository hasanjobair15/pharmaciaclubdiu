"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
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

export default function ResearchDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const [research, setResearch] = useState<ResearchItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (id) {
      loadResearch();
    }
  }, [id]);

  async function loadResearch() {
    setLoading(true);
    setErrorMessage("");

    const supabase = createClient();

    const { data, error } = await supabase
      .from("research")
      .select(
        "id, title, abstract, authors, research_area, supervisor, publication_status, doi, external_url, image_url, created_at"
      )
      .eq("id", id)
      .single();

    if (error) {
      console.error(error);
      setErrorMessage("Research not found.");
      setResearch(null);
    } else {
      setResearch(data);
    }

    setLoading(false);
  }

  function getStatusClass(status: string | null) {
    switch (status) {
      case "Published":
        return "bg-green-100 text-green-700";

      case "Accepted":
        return "bg-blue-100 text-blue-700";

      case "Under Review":
        return "bg-amber-100 text-amber-700";

      case "Ongoing":
        return "bg-purple-100 text-purple-700";

      case "Completed":
        return "bg-slate-100 text-slate-700";

      default:
        return "bg-slate-100 text-slate-700";
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-600">Loading research...</p>
      </main>
    );
  }

  if (!research || errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Research Not Found
          </h1>

          <p className="mt-3 text-slate-600">
            The research project you are looking for does not exist.
          </p>

          <Link
            href="/research"
            className="mt-6 inline-block rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Research
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">

      {/* Header */}
      <section className="bg-gradient-to-r from-blue-900 via-blue-800 to-indigo-900 px-6 py-10 text-white">
        <div className="mx-auto max-w-5xl">
          <Link
            href="/research"
            className="inline-flex text-sm font-medium text-blue-100 transition hover:text-white"
          >
            ← Back to Research
          </Link>
        </div>
      </section>

      {/* Research Details */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <article className="overflow-hidden rounded-2xl bg-white shadow-md">

          {/* Image */}
          {research.image_url ? (
            <img
              src={research.image_url}
              alt={research.title}
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

            {/* Research Area + Status */}
            <div className="flex flex-wrap gap-3">

              {research.research_area && (
                <span className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-semibold text-blue-700">
                  {research.research_area}
                </span>
              )}

              {research.publication_status && (
                <span
                  className={`rounded-full px-4 py-1.5 text-sm font-semibold ${getStatusClass(
                    research.publication_status
                  )}`}
                >
                  {research.publication_status}
                </span>
              )}

            </div>

            {/* Title */}
            <h1 className="mt-6 text-3xl font-bold leading-tight text-slate-900 md:text-5xl">
              {research.title}
            </h1>

            {/* Researchers */}
            <div className="mt-6 space-y-2 text-slate-600">

              {research.authors && (
                <p>
                  <span className="font-semibold text-slate-900">
                    Authors:
                  </span>{" "}
                  {research.authors}
                </p>
              )}

              {research.supervisor && (
                <p>
                  <span className="font-semibold text-slate-900">
                    Supervisor:
                  </span>{" "}
                  {research.supervisor}
                </p>
              )}

            </div>

            {/* Abstract */}
            {research.abstract && (
              <section className="mt-10">
                <h2 className="text-2xl font-bold text-slate-900">
                  Abstract
                </h2>

                <p className="mt-4 whitespace-pre-line text-base leading-8 text-slate-700 md:text-lg">
                  {research.abstract}
                </p>
              </section>
            )}

            {/* DOI */}
            {research.doi && (
              <section className="mt-10 border-t border-slate-200 pt-8">
                <h2 className="text-xl font-bold text-slate-900">
                  DOI
                </h2>

                <p className="mt-3 break-all text-slate-600">
                  {research.doi}
                </p>
              </section>
            )}

            {/* External Link */}
            {research.external_url && (
              <section className="mt-8">
                <a
                  href={research.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700"
                >
                  View External Publication
                </a>
              </section>
            )}

            {/* Back */}
            <div className="mt-12 border-t border-slate-200 pt-8">
              <Link
                href="/research"
                className="inline-flex rounded-lg bg-slate-800 px-5 py-3 font-semibold text-white transition hover:bg-slate-700"
              >
                ← Back to All Research
              </Link>
            </div>

          </div>
        </article>
      </section>
    </main>
  );
}