"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AcademicResource = {
  id: number;
  category: string;
  semester: string | null;
};

const semesterOrder = [
  "1st Semester",
  "2nd Semester",
  "3rd Semester",
  "4th Semester",
  "5th Semester",
  "6th Semester",
  "7th Semester",
  "8th Semester",
];

const categoryInfo: Record<
  string,
  {
    icon: string;
    description: string;
  }
> = {
  "Study Materials": {
    icon: "📚",
    description:
      "Lecture notes, presentations, study materials and other academic resources.",
  },

  "Question Bank": {
    icon: "📝",
    description:
      "Previous questions, practice questions and exam preparation resources.",
  },

  "Practical Resources": {
    icon: "🧪",
    description:
      "Laboratory guides, experiment resources and practical learning materials.",
  },

  Lab: {
    icon: "🧪",
    description:
      "Laboratory guides, experiment resources and practical learning materials.",
  },

  "Academic Calendar": {
    icon: "📅",
    description:
      "Important academic dates, examinations, activities and announcements.",
  },

  "Exam Preparation": {
    icon: "🎯",
    description:
      "Study strategies, preparation resources and useful examination guidance.",
  },

  "Learning Resources": {
    icon: "💡",
    description:
      "Useful books, websites, databases and digital tools for pharmacy students.",
  },
};

export default function AcademicCategoryPage() {
  const params = useParams();

  const categoryParam = params?.category;

  const category = Array.isArray(categoryParam)
    ? categoryParam[0]
    : categoryParam;

  const decodedCategory = category
    ? decodeURIComponent(category)
    : "";

  const supabase = createClient();

  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!decodedCategory) return;

    async function loadResources() {
      setLoading(true);

      const { data, error } = await supabase
        .from("academic_resources")
        .select("id, category, semester")
        .eq("is_active", true)
        .in("category", [decodedCategory]);

      if (error) {
        console.error("Academic resource error:", error);
        setResources([]);
        setLoading(false);
        return;
      }

      setResources((data || []) as AcademicResource[]);
      setLoading(false);
    }

    loadResources();
  }, [decodedCategory]);

  const semesters = useMemo(() => {
    const available = new Set(
      resources
        .map((resource) => resource.semester)
        .filter(Boolean)
    );

    return semesterOrder.filter((semester) =>
      available.has(semester)
    );
  }, [resources]);

  const info = categoryInfo[decodedCategory] || {
    icon: "📚",
    description:
      "Browse academic resources organized for pharmacy students.",
  };

  return (
    <main className="min-h-screen bg-white text-[#0b1736] dark:bg-[#0a0f1a] dark:text-slate-100">

      {/* HERO */}
      <section className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#0d1424]">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">

          <a
            href="/academic"
            className="inline-flex items-center text-sm font-bold text-[#087f8c] hover:underline"
          >
            ← Back to Academic Hub
          </a>

          <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center">

            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl bg-white text-4xl shadow-sm dark:bg-[#111a2b]">
              {info.icon}
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#087f8c]">
                Academic Resources
              </p>

              <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-5xl">
                {decodedCategory}
              </h1>

              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-400">
                {info.description}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* SEMESTERS */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">

        <div className="mb-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#087f8c]">
            Browse by semester
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Select Your Semester
          </h2>

          <p className="mt-3 max-w-2xl text-slate-500 dark:text-slate-400">
            Choose a semester to view the available courses and academic
            resources.
          </p>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500 dark:border-slate-800 dark:bg-[#111827]">
            Loading academic resources...
          </div>
        ) : semesters.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-[#111827]">

            <div className="text-4xl">📂</div>

            <h3 className="mt-4 text-xl font-black">
              No Resources Available Yet
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
              Resources for this category have not been added yet.
              Please check back later.
            </p>

          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            {semesters.map((semester) => (
              <a
                key={semester}
                href={`/academic/${encodeURIComponent(
                  decodedCategory
                )}/${encodeURIComponent(semester)}`}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#087f8c] hover:shadow-lg dark:border-slate-800 dark:bg-[#111827]"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#087f8c]/10 text-xl">
                    🎓
                  </div>

                  <span className="text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#087f8c]">
                    →
                  </span>

                </div>

                <h3 className="mt-6 text-xl font-black">
                  {semester}
                </h3>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  Explore courses and resources
                </p>

              </a>
            ))}

          </div>
        )}

      </section>

      {/* HOW IT WORKS */}
      <section className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#0d1424]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">

          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#087f8c]">
              Simple navigation
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Find What You Need
            </h2>
          </div>

          <div className="mx-auto mt-10 grid max-w-4xl gap-5 md:grid-cols-3">

            <div className="rounded-3xl bg-white p-6 text-center shadow-sm dark:bg-[#111827]">
              <div className="text-3xl">🎓</div>
              <h3 className="mt-4 font-black">1. Select Semester</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Choose your current or required semester.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 text-center shadow-sm dark:bg-[#111827]">
              <div className="text-3xl">📖</div>
              <h3 className="mt-4 font-black">2. Select Course</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Browse resources according to your course.
              </p>
            </div>

            <div className="rounded-3xl bg-white p-6 text-center shadow-sm dark:bg-[#111827]">
              <div className="text-3xl">📄</div>
              <h3 className="mt-4 font-black">3. Access Resources</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">
                Open PDFs, presentations, documents and useful links.
              </p>
            </div>

          </div>

        </div>
      </section>

    </main>
  );
}