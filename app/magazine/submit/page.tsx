"use client";

import Link from "next/link";

const GOOGLE_FORM_URL = "https://forms.gle/23hYiiktYTnkiJgn8";

export default function MagazineSubmitPage() {
  return (
    <main className="min-h-screen bg-white text-[#0b1736] dark:bg-[#0a0f1a] dark:text-white">
      <section className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#0d1422]">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center lg:px-8">
          <p className="pc-flame text-sm font-black uppercase tracking-[0.2em]">
            Pharmacia Club DIU Magazine
          </p>

          <h1 className="pc-rainbow mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Submit Your Content
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Send your article, poem, story, photography, artwork, research idea
            or achievement for consideration in an upcoming magazine issue.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 py-16 lg:px-8">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#087f8c]/10 text-3xl">
            📝
          </div>

          <h2 className="mt-6 text-2xl font-black text-[#0b1736] dark:text-white">
            Submit Your Work
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            Please use our official Google Form to submit your content to
            Pharmacia Club DIU Magazine.
          </p>

          <a
            href={GOOGLE_FORM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex rounded-full bg-[#0b1736] px-8 py-4 text-sm font-bold text-white transition hover:bg-[#087f8c] dark:bg-[#2dd4bf] dark:text-[#062a2d] dark:hover:bg-[#5eead4]"
          >
            Open Submission Form →
          </a>

          <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
            The Google Form will open in a new tab.
          </p>

          <div className="mt-8">
            <Link
              href="/magazine"
              className="text-sm font-bold text-[#087f8c] hover:underline dark:text-[#2dd4bf]"
            >
              ← Back to Magazine
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
