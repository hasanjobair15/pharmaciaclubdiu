"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AcademicResource = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  semester: string | null;
  course: string | null;
  course_code: string | null;
  resource_type: string | null;
  file_url: string | null;
  external_url: string | null;
  is_active: boolean | null;
};

export default function AcademicCoursePage() {
  const params = useParams();

  const categoryParam = params?.category;
  const semesterParam = params?.semester;
  const courseParam = params?.course;

  const category = Array.isArray(categoryParam)
    ? categoryParam[0]
    : categoryParam;

  const semester = Array.isArray(semesterParam)
    ? semesterParam[0]
    : semesterParam;

  const course = Array.isArray(courseParam)
    ? courseParam[0]
    : courseParam;

  const decodedCategory = category
    ? decodeURIComponent(category)
    : "";

  const decodedSemester = semester
    ? decodeURIComponent(semester)
    : "";

  const decodedCourse = course
    ? decodeURIComponent(course)
    : "";

  const supabase = createClient();

  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!decodedCategory || !decodedSemester || !decodedCourse) {
      return;
    }

    async function loadResources() {
      setLoading(true);

      const { data, error } = await supabase
        .from("academic_resources")
        .select(
          "id, title, description, category, semester, course, course_code, resource_type, file_url, external_url, is_active"
        )
        .eq("category", decodedCategory)
        .eq("semester", decodedSemester)
        .eq("course", decodedCourse)
        .eq("is_active", true)
        .order("id", { ascending: true });

      if (error) {
        console.error("Academic resource error:", error);
        setResources([]);
      } else {
        setResources((data || []) as AcademicResource[]);
      }

      setLoading(false);
    }

    loadResources();
  }, [decodedCategory, decodedSemester, decodedCourse]);

  const courseCode = resources.find(
    (resource) => resource.course_code
  )?.course_code;

  return (
    <main className="min-h-screen bg-white text-[#0b1736] dark:bg-[#0a0f1a] dark:text-slate-100">

      {/* HERO */}
      <section className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#0d1424]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">

          <a
            href={`/academic/${encodeURIComponent(
              decodedCategory
            )}/${encodeURIComponent(decodedSemester)}`}
            className="text-sm font-bold text-[#087f8c] hover:underline"
          >
            ← Back to {decodedSemester}
          </a>

          <div className="mt-8">

            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#087f8c]">
              {decodedCategory}
            </p>

            <h1 className="mt-2 text-4xl font-black sm:text-5xl">
              {decodedCourse}
            </h1>

            {courseCode && (
              <p className="mt-3 text-sm font-bold text-[#087f8c]">
                Course Code: {courseCode}
              </p>
            )}

            <p className="mt-4 max-w-2xl text-slate-500 dark:text-slate-400">
              {decodedSemester} · Access all available resources for this
              course.
            </p>

          </div>
        </div>
      </section>

      {/* RESOURCES */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">

        <div className="mb-8">

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#087f8c]">
            Course Resources
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Available Materials
          </h2>

        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-10 text-center text-slate-500">
            Loading resources...
          </div>
        ) : resources.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-[#111827]">

            <div className="text-4xl">
              📂
            </div>

            <h3 className="mt-4 text-xl font-black">
              No Resources Available Yet
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
              Resources for this course have not been added yet.
              Please check back later.
            </p>

          </div>
        ) : (
          <div className="space-y-4">

            {resources.map((resource, index) => (
              <div
                key={resource.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-[#111827]"
              >

                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">

                  <div className="flex gap-4">

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#087f8c]/10 text-xl">
                      📄
                    </div>

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="text-xs font-bold text-slate-400">
                          {String(index + 1).padStart(2, "0")}
                        </span>

                        {resource.resource_type && (
                          <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-[#087f8c]">
                            {resource.resource_type}
                          </span>
                        )}

                      </div>

                      <h3 className="mt-2 text-xl font-black">
                        {resource.title}
                      </h3>

                      {resource.description && (
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
                          {resource.description}
                        </p>
                      )}

                    </div>

                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">

                    {resource.file_url && (
                      <a
                        href={resource.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-[#087f8c] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#066b76]"
                      >
                        Open File
                      </a>
                    )}

                    {resource.external_url && (
                      <a
                        href={resource.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200"
                      >
                        External Link
                      </a>
                    )}

                  </div>

                </div>

              </div>
            ))}

          </div>
        )}

      </section>

    </main>
  );
}