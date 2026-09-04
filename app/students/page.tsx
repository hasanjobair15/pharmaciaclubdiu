"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentRunningBatches } from "@/lib/students/current-batches";

type Student = {
  id: string;
  full_name: string;
  student_id: string | null;
  email: string;
  batch: number;
  section: string;
  blood_group: string | null;
  profile_photo_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
};

const supabase = createClient();

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedBatch, setSelectedBatch] = useState("all");
  const [selectedSection, setSelectedSection] = useState("all");

  const currentBatches = useMemo(() => getCurrentRunningBatches(), []);

  useEffect(() => {
    loadStudents();
  }, []);

  async function loadStudents() {
    setLoading(true);

    const { data, error } = await supabase
      .from("student_profiles")
      .select(
        `
        id,
        full_name,
        student_id,
        email,
        batch,
        section,
        blood_group,
        profile_photo_url,
        linkedin_url,
        instagram_url,
        facebook_url
      `
      )
      .in("batch", currentBatches)
      .order("batch", { ascending: true })
      .order("section", { ascending: true })
      .order("full_name", { ascending: true });

    if (!error && data) {
      setStudents(data as Student[]);
    }

    if (error) {
      console.error("Error loading students:", error);
    }

    setLoading(false);
  }

  const filteredStudents = students.filter((student) => {
    const searchText = search.trim().toLowerCase();

    const matchesSearch =
      !searchText ||
      student.full_name.toLowerCase().includes(searchText) ||
      (student.student_id &&
        student.student_id.toLowerCase().includes(searchText)) ||
      student.email.toLowerCase().includes(searchText);

    const matchesBatch =
      selectedBatch === "all" ||
      student.batch.toString() === selectedBatch;

    const matchesSection =
      selectedSection === "all" ||
      student.section === selectedSection;

    return matchesSearch && matchesBatch && matchesSection;
  });

  const groupedStudents = currentBatches.map((batch) => ({
    batch,
    students: filteredStudents.filter((student) => student.batch === batch),
  }));

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Hero */}
      <section className="border-b border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-green-600 dark:text-green-400">
              Pharmacia Club DIU
            </p>

            <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
              Students
            </h1>

            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-gray-600 dark:text-gray-300">
              Explore the current students of the Department of Pharmacy,
              Daffodil International University.
            </p>

            <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/students/login"
                className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-green-700"
              >
                Student Login
              </Link>

              <Link
                href="/students/create-account"
                className="rounded-xl border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
              >
                Create Student Account
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Current batches */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-5 dark:border-green-900/50 dark:bg-green-950/30">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-bold text-gray-900 dark:text-white">
                Current Students
              </h2>

              <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                The directory automatically updates every six months as
                batches progress.
              </p>
            </div>

            <div className="text-sm font-semibold text-green-700 dark:text-green-400">
              {currentBatches.length} Running Batches
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {currentBatches.map((batch) => (
              <span
                key={batch}
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm dark:bg-gray-800 dark:text-gray-200"
              >
                Batch {batch}
              </span>
            ))}
          </div>
        </div>

        {/* Search & filters */}
        <div className="mb-8 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="md:col-span-1">
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Search Student
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, Student ID or email..."
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Batch
              </label>

              <select
                value={selectedBatch}
                onChange={(e) => setSelectedBatch(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Current Batches</option>

                {currentBatches.map((batch) => (
                  <option key={batch} value={batch}>
                    Batch {batch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Section
              </label>

              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none focus:border-green-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                <option value="all">All Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>
          </div>
        </div>

        {/* Directory */}
        {loading ? (
          <div className="py-20 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
              Loading students...
            </p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-900">
            <div className="text-4xl">🎓</div>

            <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">
              No students found
            </h2>

            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="space-y-10">
            {groupedStudents
              .filter((group) => group.students.length > 0)
              .map((group) => (
                <section key={group.batch}>
                  <div className="mb-5 flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Batch {group.batch}
                      </h2>

                      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {group.students.length} student
                        {group.students.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {group.students.map((student) => (
                      <article
                        key={student.id}
                        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-gray-800 dark:bg-gray-900"
                      >
                        <div className="flex items-center gap-4 p-5">
                          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                            {student.profile_photo_url ? (
                              <img
                                src={student.profile_photo_url}
                                alt={student.full_name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-2xl">
                                🎓
                              </div>
                            )}
                          </div>

                          <div className="min-w-0">
                            <h3 className="truncate font-bold text-gray-900 dark:text-white">
                              {student.full_name}
                            </h3>

                            <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                              Batch {student.batch} • Section{" "}
                              {student.section}
                            </p>

                            {student.student_id && (
                              <p className="mt-1 truncate text-xs text-gray-500 dark:text-gray-400">
                                ID: {student.student_id}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="border-t border-gray-100 px-5 py-4 dark:border-gray-800">
                          {student.blood_group && (
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Blood Group:{" "}
                              <span className="font-semibold text-gray-700 dark:text-gray-200">
                                {student.blood_group}
                              </span>
                            </p>
                          )}

                          <div className="mt-3 flex flex-wrap gap-2">
                            {student.linkedin_url && (
                              <a
                                href={student.linkedin_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                              >
                                LinkedIn
                              </a>
                            )}

                            {student.instagram_url && (
                              <a
                                href={student.instagram_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                              >
                                Instagram
                              </a>
                            )}

                            {student.facebook_url && (
                              <a
                                href={student.facebook_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                              >
                                Facebook
                              </a>
                            )}
                          </div>
                        </div>
                      </article>
                    ))}
                  </div>
                </section>
              ))}
          </div>
        )}
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="mx-auto max-w-4xl px-4 py-12 text-center sm:px-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Are you a Pharmacy student?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm text-gray-600 dark:text-gray-300">
            Create your Student Account to add yourself to the student
            directory and manage your profile.
          </p>

          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              href="/students/create-account"
              className="rounded-xl bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700"
            >
              Create Student Account
            </Link>

            <Link
              href="/students/login"
              className="rounded-xl border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
            >
              Student Login
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
