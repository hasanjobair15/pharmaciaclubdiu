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
  const previousIssues = issues.filter((issue) => !issue.is_current);

  return (
    <main className="min-h-screen bg-white text-[#0b1736] transition-colors dark:bg-[#0a0f1a] dark:text-slate-100">

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(8,127,140,0.12),transparent_45%)] dark:bg-[radial-gradient(circle_at_top_right,rgba(45,212,191,0.10),transparent_45%)]" />

        <div className="relative mx-auto max-w-7xl px-6 py-20 lg:px-8 lg:py-28">
          <div className="max-w-3xl">

            <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c] dark:text-[#2dd4bf]">
              Pharmacia Club DIU
            </p>

            <h1 className="text-4xl font-black tracking-tight text-[#0b1736] dark:text-white sm:text-5xl lg:text-6xl">
              Magazine
            </h1>

            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              A semester-based digital publication celebrating academic
              excellence, research, pharmacy, people, creativity and memories
              of the Department of Pharmacy, Daffodil International University.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">

              <a
                href="#current-issue"
                className="rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c] dark:bg-[#2dd4bf] dark:text-[#062a2d] dark:hover:bg-[#5eead4]"
              >
                Read Current Issue
              </a>

              <a
                href="#submit"
                className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-[#0b1736] transition hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:text-slate-200 dark:hover:border-[#2dd4bf] dark:hover:text-[#2dd4bf]"
              >
                Submit Your Content
              </a>

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
                  Digital Archive
                </p>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Previous issues preserved online
                </p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* CURRENT ISSUE */}
      <section
        id="current-issue"
        className="border-y border-slate-200 bg-slate-50 transition-colors dark:border-slate-800 dark:bg-[#0d1422]"
      >
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">

          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#087f8c] dark:text-[#2dd4bf]">
                Featured Issue
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0b1736] dark:text-white sm:text-4xl">
                Current Issue
              </h2>
            </div>

            {currentIssue && (
              <span className="w-fit rounded-full bg-[#087f8c]/10 px-4 py-2 text-sm font-bold text-[#087f8c] dark:bg-[#2dd4bf]/10 dark:text-[#2dd4bf]">
                Current · {currentIssue.season} {currentIssue.year}
              </span>
            )}

          </div>

          {loading ? (
            <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-[#111827]">
              <p className="text-slate-500 dark:text-slate-400">
                Loading magazine...
              </p>
            </div>
          ) : currentIssue ? (
            <div className="mt-10 grid gap-8 overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111827] lg:grid-cols-[0.75fr_1.25fr]">

              <div className="flex min-h-[380px] items-center justify-center bg-slate-100 p-8 dark:bg-slate-800">

                {currentIssue.cover_image_url ? (
                  <img
                    src={currentIssue.cover_image_url}
                    alt={currentIssue.title}
                    className="max-h-[420px] w-auto rounded-xl object-contain shadow-xl"
                  />
                ) : (
                  <div className="flex h-[380px] w-[270px] flex-col items-center justify-center rounded-xl bg-[#0b1736] p-8 text-center text-white shadow-xl dark:bg-[#12383c]">

                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                      Pharmacia Club DIU
                    </p>

                    <h3 className="mt-5 text-4xl font-black">
                      {currentIssue.season}
                    </h3>

                    <p className="mt-2 text-5xl font-black">
                      {currentIssue.year}
                    </p>

                    <div className="mt-8 h-px w-16 bg-cyan-300" />

                    <p className="mt-5 text-sm text-slate-300">
                      Department of Pharmacy
                    </p>

                  </div>
                )}

              </div>

              <div className="flex flex-col justify-center p-8 lg:p-12">

                <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#087f8c] dark:text-[#2dd4bf]">
                  {currentIssue.season} {currentIssue.year}
                </p>

                <h3 className="mt-3 text-3xl font-black text-[#0b1736] dark:text-white sm:text-4xl">
                  {currentIssue.title}
                </h3>

                <p className="mt-5 leading-8 text-slate-600 dark:text-slate-300">
                  {currentIssue.description ||
                    "Explore the latest issue of Pharmacia Club DIU Magazine."}
                </p>

                <div className="mt-8">
                  <Link
                    href={`/magazine/${currentIssue.id}`}
                    className="inline-flex rounded-full bg-[#0b1736] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#087f8c] dark:bg-[#2dd4bf] dark:text-[#062a2d] dark:hover:bg-[#5eead4]"
                  >
                    Read Magazine →
                  </Link>
                </div>

              </div>
            </div>
          ) : (
            <div className="mt-10 rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center dark:border-slate-700 dark:bg-[#111827]">

              <p className="font-bold text-[#0b1736] dark:text-white">
                No current issue is available yet.
              </p>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                The next magazine issue will appear here once published.
              </p>

            </div>
          )}

        </div>
      </section>

      {/* PREVIOUS ISSUES */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#087f8c] dark:text-[#2dd4bf]">
            Digital Archive
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-[#0b1736] dark:text-white sm:text-4xl">
            Previous Issues
          </h2>

          <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-300">
            Explore previous semester editions of Pharmacia Club DIU Magazine.
          </p>
        </div>

        {previousIssues.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">

            {previousIssues.map((issue) => (
              <Link
                key={issue.id}
                href={`/magazine/${issue.id}`}
                className="group overflow-hidden rounded-3xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-[#087f8c]/40 hover:shadow-xl dark:border-slate-800 dark:bg-[#111827] dark:hover:border-[#2dd4bf]/40"
              >

                <div className="flex h-64 items-center justify-center bg-slate-100 p-6 dark:bg-slate-800">

                  {issue.cover_image_url ? (
                    <img
                      src={issue.cover_image_url}
                      alt={issue.title}
                      className="h-full max-w-full rounded-lg object-contain shadow-lg"
                    />
                  ) : (
                    <div className="flex h-full w-40 flex-col items-center justify-center rounded-lg bg-[#0b1736] text-center text-white shadow-lg dark:bg-[#12383c]">

                      <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">
                        Pharmacia Club
                      </p>

                      <p className="mt-4 text-2xl font-black">
                        {issue.season}
                      </p>

                      <p className="text-3xl font-black">
                        {issue.year}
                      </p>

                    </div>
                  )}

                </div>

                <div className="p-6">

                  <p className="text-sm font-bold text-[#087f8c] dark:text-[#2dd4bf]">
                    {issue.season} {issue.year}
                  </p>

                  <h3 className="mt-2 text-xl font-black text-[#0b1736] transition group-hover:text-[#087f8c] dark:text-white dark:group-hover:text-[#2dd4bf]">
                    {issue.title}
                  </h3>

                  <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {issue.description || "Read this magazine issue."}
                  </p>

                  <p className="mt-5 text-sm font-bold text-[#0b1736] dark:text-white">
                    Read Issue →
                  </p>

                </div>

              </Link>
            ))}

          </div>
        ) : (
          <div className="mt-10 rounded-3xl border border-dashed border-slate-300 p-10 text-center dark:border-slate-700">

            <p className="font-semibold text-slate-500 dark:text-slate-400">
              Previous issues will appear here.
            </p>

          </div>
        )}

      </section>

      {/* SUBMISSION */}
      <section
        id="submit"
        className="mx-auto max-w-7xl px-6 pb-20 lg:px-8"
      >
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