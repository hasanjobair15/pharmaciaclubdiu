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

type PageProps = {
  params: Promise<{
    category: string;
    semester: string;
  }>;
};

export default async function AcademicSemesterPage({
  params,
}: PageProps) {
  const { category, semester } = await params;

  const decodedCategory = decodeURIComponent(category);
  const decodedSemester = decodeURIComponent(semester);

  const supabase = createClient();

  const { data, error } = await supabase
    .from("academic_resources")
    .select(
      "id, title, description, category, semester, course, course_code, resource_type, file_url, external_url, is_active"
    )
    .eq("category", decodedCategory)
    .eq("semester", decodedSemester)
    .eq("is_active", true)
    .order("id", { ascending: true });

  const resources = (data || []) as AcademicResource[];

  const courses = Array.from(
    new Set(
      resources.map(
        (resource) =>
          resource.course?.trim() ||
          resource.course_code?.trim() ||
          "General Resources"
      )
    )
  );

  return (
    <main className="min-h-screen bg-white text-[#0b1736] dark:bg-[#0a0f1a] dark:text-slate-100">

      {/* HERO */}
      <section className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#0d1424]">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">

          <a
            href={`/academic/${encodeURIComponent(decodedCategory)}`}
            className="text-sm font-bold text-[#087f8c] hover:underline"
          >
            ← Back to {decodedCategory}
          </a>

          <div className="mt-8">

            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#087f8c]">
              {decodedCategory}
            </p>

            <h1 className="mt-2 text-4xl font-black sm:text-5xl">
              {decodedSemester}
            </h1>

            <p className="mt-4 max-w-2xl text-slate-500 dark:text-slate-400">
              Browse courses and access the available academic resources.
            </p>

          </div>
        </div>
      </section>

      {/* COURSES */}
      <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8">

        <div className="mb-8">

          <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#087f8c]">
            Courses
          </p>

          <h2 className="mt-2 text-3xl font-black">
            Select a Course
          </h2>

        </div>

        {error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-8 text-red-600">
            Unable to load academic resources.
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center dark:border-slate-700 dark:bg-[#111827]">

            <div className="text-4xl">📂</div>

            <h3 className="mt-4 text-xl font-black">
              No Courses Available Yet
            </h3>

            <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500 dark:text-slate-400">
              Resources for this semester have not been added yet.
              Please check back later.
            </p>

          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {courses.map((course) => (
              <a
                key={course}
                href={`/academic/${encodeURIComponent(
                  decodedCategory
                )}/${encodeURIComponent(
                  decodedSemester
                )}/${encodeURIComponent(course)}`}
                className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-[#087f8c] hover:shadow-lg dark:border-slate-800 dark:bg-[#111827]"
              >

                <div className="flex items-center justify-between">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#087f8c]/10 text-2xl">
                    📖
                  </div>

                  <span className="text-xl text-slate-300 transition group-hover:translate-x-1 group-hover:text-[#087f8c]">
                    →
                  </span>

                </div>

                <h3 className="mt-6 text-xl font-black">
                  {course}
                </h3>

                <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
                  View all available resources
                </p>

              </a>
            ))}

          </div>
        )}

      </section>

    </main>
  );
}