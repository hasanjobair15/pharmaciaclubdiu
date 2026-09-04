"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type MagazineIssue = {
  id: number;
  title: string;
  season: string;
  year: number;
  description: string | null;
  cover_image_url: string | null;
  is_current: boolean;
  is_published: boolean;
};

export default function MagazinePage() {
  const [issues, setIssues] = useState<MagazineIssue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadIssues() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("magazine_issues")
        .select(
          "id, title, season, year, description, cover_image_url, is_current, is_published"
        )
        .eq("is_published", true)
        .order("year", { ascending: false });

      if (!error && data) {
        setIssues(data);
      }

      setLoading(false);
    }

    loadIssues();
  }, []);

  const currentIssue = issues.find((issue) => issue.is_current);
  const targetIssue = currentIssue || issues[0] || null;

  return (
    <main className="min-h-screen bg-white text-[#0b1736] transition-colors dark:bg-[#0a0f1a] dark:text-slate-100">

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(8,127,140,0.12),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.10),transparent_45%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="max-w-3xl">

            <p className="pc-flame mb-4 text-sm font-black uppercase tracking-[0.2em]">
              Pharmacia Club DIU
            </p>

            <h1 className="pc-rainbow text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl">
              Magazine
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              A semester-based digital publication celebrating academic
              excellence, research, pharmacy, people, creativity and memories
              of the Department of Pharmacy, Daffodil International University.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">

              {/* READ CURRENT ISSUE → opens the magazine reader */}
              {targetIssue ? (
                <Link
                  href={`/magazine/${targetIssue.id}`}
                  className="rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c] dark:bg-[#2dd4bf] dark:text-[#062a2d] dark:hover:bg-[#5eead4]"
                >
                  Read Current Issue
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className={`rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white transition dark:bg-[#2dd4bf] dark:text-[#062a2d] ${
                    loading ? "cursor-wait opacity-70" : "opacity-70"
                  }`}
                >
                  {loading ? "Loading..." : "Read Current Issue"}
                </button>
              )}

              {/* SUBMIT YOUR CONTENT */}
              <Link
                href="/magazine/submit"
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-[#0b1736] transition hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:text-slate-200 dark:hover:border-[#2dd4bf] dark:hover:text-[#2dd4bf]"
              >
                Submit Your Content
              </Link>

            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#087f8c] dark:text-[#2dd4bf]">
              About the Magazine
            </p>

            <h2 className="mt-3 text-3xl font-black tracking-tight text-[#0b1736] dark:text-white sm:text-4xl">
              Ideas, knowledge, creativity & community
            </h2>

            <p className="mt-5 max-w-3xl leading-8 text-slate-600 dark:text-slate-300">
              Pharmacia Club DIU Magazine is a semester-wise digital publication
              created to showcase the academic, professional, creative and
              community life of pharmacy students, faculty members, alumni and
              the wider Department of Pharmacy community.
            </p>

            <p className="mt-4 max-w-3xl leading-8 text-slate-600 dark:text-slate-300">
              Every semester brings a new issue, allowing each generation of
              students to contribute their stories, ideas, achievements,
              research, writing and memories.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-7 dark:border-slate-800 dark:bg-[#111827]">

            <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#087f8c] dark:text-[#2dd4bf]">
              Our Magazine
            </p>

            <div className="mt-6 space-y-5">

              <div>
                <p className="text-2xl font-black text-[#0b1736] dark:text-white">
                  Semester-wise
                </p>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  A new issue every semester
                </p>
              </div>

              <div>
                <p className="text-2xl font-black text-[#0b1736] dark:text-white">
                  Student-driven
                </p>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Contributions from our pharmacy community
                </p>
              </div>

              <div>
                <p className="text-2xl font-black text-[#0b1736] dark:text-white">
                  Published Issues
                </p>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Every edition is preserved online — use the
                  &ldquo;Read Current Issue&rdquo; button to open the reader
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* SUBMISSION CTA */}
      <section className="mx-auto max-w-7xl px-6 pb-20 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-[#0b1736] p-8 text-white dark:bg-[#111827] sm:p-12">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-300">
              Share Your Voice
            </p>

            <h2 className="mt-3 text-3xl font-black sm:text-4xl">
              Submit Your Content
            </h2>

            <p className="mt-5 leading-8 text-slate-300">
              Have a poem, story, article, research idea, reflection,
              photography or creative work? Submit your contribution for
              consideration in an upcoming semester magazine.
            </p>

            <Link
              href="/magazine/submit"
              className="mt-8 inline-flex rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#0b1736] transition hover:bg-cyan-300"
            >
              Submit Your Content →
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
