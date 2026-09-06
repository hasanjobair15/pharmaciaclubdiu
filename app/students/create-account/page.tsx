"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { getCurrentRunningBatches } from "@/app/lib/students/current-batches";

type CRStatus = "cr" | "co_cr" | "no" | null;

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
  graduation_date: string | null;
  cr_status: CRStatus;
};

const supabase = createClient();

function getDhakaToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

/**
 * A student is considered graduated when
 * their graduation date has arrived.
 */
function hasGraduated(graduationDate: string | null) {
  if (!graduationDate) {
    return false;
  }

  const today = getDhakaToday();

  return graduationDate <= today;
}

/**
 * CR ordering:
 *
 * CR     = 1
 * Co-CR  = 2
 * NO     = 3
 * null   = 3
 */
function getCRPriority(status: CRStatus) {
  switch (status) {
    case "cr":
      return 1;

    case "co_cr":
      return 2;

    case "no":
    default:
      return 3;
  }
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [sectionFilter, setSectionFilter] = useState("all");

  const currentBatches = useMemo(
    () => getCurrentRunningBatches(),
    []
  );

  useEffect(() => {
    async function loadStudents() {
      setLoading(true);
      setError("");

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
            facebook_url,
            graduation_date,
            cr_status
          `
        )
        .in("batch", currentBatches)
        .order("batch", {
          ascending: true,
        })
        .order("section", {
          ascending: true,
        })
        .order("full_name", {
          ascending: true,
        });

      if (error) {
        console.error(
          "Student loading error:",
          error
        );

        setError(error.message);
        setStudents([]);
      } else {
        const runningStudents =
          ((data || []) as Student[]).filter(
            (student) =>
              !hasGraduated(
                student.graduation_date
              )
          );

        setStudents(runningStudents);
      }

      setLoading(false);
    }

    loadStudents();
  }, [currentBatches]);

  /**
   * Search and filters
   */
  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    return students.filter((student) => {
      const matchesSearch =
        !query ||
        student.full_name
          .toLowerCase()
          .includes(query) ||
        String(student.batch).includes(query) ||
        student.section
          .toLowerCase()
          .includes(query) ||
        (student.student_id || "")
          .toLowerCase()
          .includes(query);

      const matchesBatch =
        batchFilter === "all" ||
        String(student.batch) ===
          batchFilter;

      const matchesSection =
        sectionFilter === "all" ||
        student.section ===
          sectionFilter;

      return (
        matchesSearch &&
        matchesBatch &&
        matchesSection
      );
    });
  }, [
    students,
    search,
    batchFilter,
    sectionFilter,
  ]);

  /**
   * Group by Batch + Section.
   *
   * Inside each section:
   *
   * 1. CR
   * 2. Co-CR
   * 3. NO / others alphabetically
   */
  const groupedStudents = useMemo(() => {
    const groups: Record<
      string,
      Student[]
    > = {};

    for (const student of filteredStudents) {
      const key = `${student.batch}-${student.section}`;

      if (!groups[key]) {
        groups[key] = [];
      }

      groups[key].push(student);
    }

    return Object.entries(groups)
      .map(
        ([groupName, groupStudents]) => {
          const sortedStudents = [
            ...groupStudents,
          ].sort((a, b) => {
            const priorityA =
              getCRPriority(
                a.cr_status
              );

            const priorityB =
              getCRPriority(
                b.cr_status
              );

            // CR before Co-CR before others
            if (
              priorityA !== priorityB
            ) {
              return (
                priorityA -
                priorityB
              );
            }

            // Same CR status → alphabetical
            return a.full_name.localeCompare(
              b.full_name,
              undefined,
              {
                sensitivity: "base",
              }
            );
          });

          return [
            groupName,
            sortedStudents,
          ] as [string, Student[]];
        }
      )
      .sort(
        ([groupA], [groupB]) => {
          const [
            batchA,
            sectionA,
          ] = groupA.split("-");

          const [
            batchB,
            sectionB,
          ] = groupB.split("-");

          return (
            Number(batchA) -
              Number(batchB) ||
            sectionA.localeCompare(
              sectionB
            )
          );
        }
      );
  }, [filteredStudents]);

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Pharmacia Club DIU
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                Students
              </h1>

              <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
                Explore students from the
                currently running batches.
              </p>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Current batches:{" "}
                <span className="font-semibold text-slate-700 dark:text-slate-200">
                  {currentBatches.join(
                    ", "
                  )}
                </span>
              </p>

              <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                Students are automatically
                moved to Alumni when their
                graduation month arrives.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/students/login"
                className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                Student Login
              </a>

              <a
                href="/students/create-account"
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Create Student Account
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* CR / CO-CR LEGEND */}
      {/* ====================================================== */}

      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
            Class Representative:
          </span>

          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
            CR
          </span>

          <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-purple-800 dark:bg-purple-950/50 dark:text-purple-300">
            Co-CR
          </span>
        </div>
      </section>

      {/* ====================================================== */}
      {/* FILTERS */}
      {/* ====================================================== */}

      <section className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="grid gap-4 md:grid-cols-3">
            {/* Search */}
            <div>
              <label
                htmlFor="student-search"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Search
              </label>

              <input
                id="student-search"
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search by name, ID, batch..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            {/* Batch Filter */}
            <div>
              <label
                htmlFor="batch-filter"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Batch
              </label>

              <select
                id="batch-filter"
                value={batchFilter}
                onChange={(e) =>
                  setBatchFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">
                  All Batches
                </option>

                {currentBatches.map(
                  (batch) => (
                    <option
                      key={batch}
                      value={batch}
                    >
                      Batch {batch}
                    </option>
                  )
                )}
              </select>
            </div>

            {/* Section Filter */}
            <div>
              <label
                htmlFor="section-filter"
                className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
              >
                Section
              </label>

              <select
                id="section-filter"
                value={sectionFilter}
                onChange={(e) =>
                  setSectionFilter(
                    e.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="all">
                  All Sections
                </option>

                <option value="A">
                  Section A
                </option>

                <option value="B">
                  Section B
                </option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ====================================================== */}
      {/* CONTENT */}
      {/* ====================================================== */}

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        {/* Loading */}
        {loading && (
          <div className="py-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-blue-600" />

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Loading students...
            </p>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center dark:border-red-900/50 dark:bg-red-950/30">
            <h2 className="font-semibold text-red-700 dark:text-red-400">
              Could not load students
            </h2>

            <p className="mt-2 text-sm text-red-600 dark:text-red-300">
              {error}
            </p>
          </div>
        )}

        {/* Empty */}
        {!loading &&
          !error &&
          filteredStudents.length ===
            0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                No students found
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Try changing your search
                or filters.
              </p>
            </div>
          )}

        {/* ================================================== */}
        {/* GROUPED STUDENTS */}
        {/* ================================================== */}

        {!loading &&
          !error &&
          groupedStudents.length > 0 && (
            <div className="space-y-10">
              {groupedStudents.map(
                ([
                  groupName,
                  groupStudents,
                ]) => {
                  const [
                    batch,
                    section,
                  ] =
                    groupName.split(
                      "-"
                    );

                  return (
                    <div
                      key={groupName}
                    >
                      {/* Section Header */}
                      <div className="mb-5 flex items-center justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                            Batch {batch} —
                            Section{" "}
                            {section}
                          </h2>

                          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            {
                              groupStudents.length
                            }{" "}
                            student
                            {groupStudents.length !==
                            1
                              ? "s"
                              : ""}
                          </p>
                        </div>
                      </div>

                      {/* Students */}
                      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {groupStudents.map(
                          (
                            student
                          ) => (
                            <StudentCard
                              key={
                                student.id
                              }
                              student={
                                student
                              }
                            />
                          )
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
      </section>
    </main>
  );
}

/* ================================================================ */
/* STUDENT CARD */
/* ================================================================ */

function StudentCard({
  student,
}: {
  student: Student;
}) {
  const isCR =
    student.cr_status ===
    "cr";

  const isCoCR =
    student.cr_status ===
    "co_cr";

  return (
    <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
      {/* Profile Photo */}
      <div className="flex justify-center bg-slate-100 p-6 dark:bg-slate-800">
        {student.profile_photo_url ? (
          <img
            src={
              student.profile_photo_url
            }
            alt={
              student.full_name
            }
            className="h-28 w-28 rounded-full object-cover ring-4 ring-white dark:ring-slate-700"
          />
        ) : (
          <div className="flex h-28 w-28 items-center justify-center rounded-full bg-blue-600 text-3xl font-bold text-white ring-4 ring-white dark:ring-slate-700">
            {student.full_name
              .charAt(0)
              .toUpperCase()}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5">
        {/* Name + Position */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="min-w-0 truncate text-lg font-bold text-slate-900 dark:text-white">
            {student.full_name}
          </h3>

          {isCR && (
            <span className="shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-amber-800 dark:bg-amber-950/50 dark:text-amber-300">
              CR
            </span>
          )}

          {isCoCR && (
            <span className="shrink-0 rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-purple-800 dark:bg-purple-950/50 dark:text-purple-300">
              Co-CR
            </span>
          )}
        </div>

        {/* Student ID */}
        {student.student_id && (
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            ID:{" "}
            {student.student_id}
          </p>
        )}

        {/* Academic Badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
            Batch{" "}
            {student.batch}
          </span>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
            Section{" "}
            {student.section}
          </span>

          {student.blood_group && (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/40 dark:text-red-300">
              {
                student.blood_group
              }
            </span>
          )}
        </div>

        {/* Social Links */}
        <div className="mt-5 flex flex-wrap gap-2">
          {student.linkedin_url && (
            <a
              href={
                student.linkedin_url
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400"
            >
              LinkedIn
            </a>
          )}

          {student.instagram_url && (
            <a
              href={
                student.instagram_url
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-pink-600 hover:underline dark:text-pink-400"
            >
              Instagram
            </a>
          )}

          {student.facebook_url && (
            <a
              href={
                student.facebook_url
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-400"
            >
              Facebook
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
