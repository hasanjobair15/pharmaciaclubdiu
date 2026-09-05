"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Alumni = {
  id: string;
  full_name: string;
  batch: string;
  section: string;
  graduation_year: number | null;
  graduation_date: string | null;
  profile_photo_url: string | null;
  current_position: string | null;
  organization: string | null;
  country: string | null;
  bio: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
};

function getDhakaTodayString() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  if (!year || !month || !day) {
    return new Date()
      .toISOString()
      .slice(0, 10);
  }

  return `${year}-${month}-${day}`;
}

function normalizeGraduationDate(
  value: string | null | undefined
) {
  if (!value) {
    return null;
  }

  const raw = String(value).trim();

  if (!raw) {
    return null;
  }

  const monthMatch =
    raw.match(/^(\d{4})-(\d{2})$/);

  if (monthMatch) {
    return `${monthMatch[1]}-${monthMatch[2]}-01`;
  }

  const dateMatch =
    raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (dateMatch) {
    return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
  }

  return null;
}

function getGraduationYear(
  graduationDate: string | null,
  graduationYear: number | null
) {
  if (graduationDate) {
    const year = Number(
      graduationDate.slice(0, 4)
    );

    if (Number.isInteger(year)) {
      return year;
    }
  }

  return graduationYear;
}

function formatGraduationDate(
  graduationDate: string | null,
  graduationYear: number | null
) {
  if (graduationDate) {
    const normalized =
      normalizeGraduationDate(
        graduationDate
      );

    if (normalized) {
      const [year, month] =
        normalized
          .slice(0, 7)
          .split("-")
          .map(Number);

      if (
        Number.isInteger(year) &&
        Number.isInteger(month)
      ) {
        const date = new Date(
          year,
          month - 1,
          1
        );

        return new Intl.DateTimeFormat(
          "en-US",
          {
            month: "long",
            year: "numeric",
          }
        ).format(date);
      }
    }
  }

  if (graduationYear) {
    return String(graduationYear);
  }

  return null;
}

export default function AlumniPage() {
  const supabase = useMemo(
    () => createClient(),
    []
  );

  const [alumni, setAlumni] =
    useState<Alumni[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [search, setSearch] =
    useState("");

  useEffect(() => {
    async function loadAlumni() {
      setLoading(true);

      const today =
        getDhakaTodayString();

      /*
       * ---------------------------------------------------------
       * 1. EXISTING ALUMNI PROFILES
       * ---------------------------------------------------------
       *
       * Graduation date is the source of truth.
       *
       * An Alumni profile must:
       *
       *   - have a graduation_date
       *   - have reached that graduation month
       *
       * Therefore:
       *
       * graduation_date <= today
       *
       * Future-dated or empty Alumni records
       * are not displayed.
       */
      const {
        data: alumniProfiles,
        error: alumniError,
      } = await supabase
        .from("alumni_profiles")
        .select(
          `
            id,
            full_name,
            batch,
            section,
            graduation_year,
            graduation_date,
            profile_photo_url,
            current_position,
            organization,
            country,
            bio,
            linkedin_url,
            facebook_url,
            instagram_url
          `
        )
        .eq("is_public", true)
        .not(
          "graduation_date",
          "is",
          null
        )
        .lte(
          "graduation_date",
          today
        )
        .order(
          "full_name",
          {
            ascending: true,
          }
        );

      if (alumniError) {
        console.error(
          "Error loading alumni profiles:",
          alumniError
        );
      }

      /*
       * ---------------------------------------------------------
       * 2. AUTOMATICALLY GRADUATED STUDENTS
       * ---------------------------------------------------------
       *
       * Running students automatically become
       * Alumni when their graduation month begins.
       *
       * Example:
       *
       * graduation_date = 2026-09-01
       * today            = 2026-09-05
       *
       * Result: Alumni
       */
      const {
        data: graduatedStudents,
        error: studentError,
      } = await supabase
        .from("student_profiles")
        .select(
          `
            id,
            full_name,
            batch,
            section,
            graduation_date,
            profile_photo_url,
            linkedin_url,
            facebook_url,
            instagram_url
          `
        )
        .not(
          "graduation_date",
          "is",
          null
        )
        .lte(
          "graduation_date",
          today
        )
        .order(
          "full_name",
          {
            ascending: true,
          }
        );

      if (studentError) {
        console.error(
          "Error loading graduated students:",
          studentError
        );
      }

      const existingAlumni =
        (alumniProfiles ||
          []) as Alumni[];

      /*
       * Convert graduated Student profiles
       * into Alumni directory entries.
       */
      const automaticallyGraduated:
        Alumni[] =
        (graduatedStudents || []).map(
          (student) => {
            const graduationDate =
              normalizeGraduationDate(
                student.graduation_date
              );

            return {
              id: student.id,
              full_name:
                student.full_name,
              batch: String(
                student.batch
              ),
              section:
                student.section,
              graduation_year:
                getGraduationYear(
                  graduationDate,
                  null
                ),
              graduation_date:
                graduationDate,
              profile_photo_url:
                student.profile_photo_url,
              current_position: null,
              organization: null,
              country: null,
              bio: null,
              linkedin_url:
                student.linkedin_url,
              facebook_url:
                student.facebook_url,
              instagram_url:
                student.instagram_url,
            };
          }
        );

      /*
       * ---------------------------------------------------------
       * 3. MERGE + DEDUPLICATE
       * ---------------------------------------------------------
       *
       * A person can potentially exist in both:
       *
       * alumni_profiles
       * and
       * student_profiles
       *
       * We keep the Alumni profile when the same
       * person is found in both places because it
       * normally contains more complete information.
       */
      const merged: Alumni[] = [
        ...existingAlumni,
      ];

      const existingIds =
        new Set(
          existingAlumni.map(
            (person) =>
              person.id
          )
        );

      const existingPeople =
        new Set(
          existingAlumni.map(
            (person) =>
              [
                person.full_name
                  .trim()
                  .toLowerCase(),
                String(
                  person.batch
                )
                  .trim()
                  .toLowerCase(),
                String(
                  person.section
                )
                  .trim()
                  .toLowerCase(),
              ].join("|")
          )
        );

      for (const student of automaticallyGraduated) {
        const personKey =
          [
            student.full_name
              .trim()
              .toLowerCase(),
            String(
              student.batch
            )
              .trim()
              .toLowerCase(),
            String(
              student.section
            )
              .trim()
              .toLowerCase(),
          ].join("|");

        /*
         * Don't add a graduated Student row if
         * that person already has an Alumni profile.
         */
        if (
          existingIds.has(
            student.id
          ) ||
          existingPeople.has(
            personKey
          )
        ) {
          continue;
        }

        merged.push(student);
        existingIds.add(student.id);
        existingPeople.add(personKey);
      }

      /*
       * Final safety filter:
       *
       * Nobody without a graduation date can
       * appear in the Alumni directory.
       */
      const validAlumni =
        merged.filter(
          (person) => {
            const date =
              normalizeGraduationDate(
                person.graduation_date
              );

            return (
              date !== null &&
              date <= today
            );
          }
        );

      validAlumni.sort(
        (a, b) =>
          a.full_name.localeCompare(
            b.full_name
          )
      );

      setAlumni(validAlumni);
      setLoading(false);
    }

    loadAlumni();
  }, [supabase]);

  const filteredAlumni =
    alumni.filter((person) => {
      const searchText = [
        person.full_name,
        person.batch,
        person.section,
        person.current_position,
        person.organization,
        person.country,
        formatGraduationDate(
          person.graduation_date,
          person.graduation_year
        ),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return searchText.includes(
        search.toLowerCase()
      );
    });

  const grouped =
    filteredAlumni.reduce(
      (
        acc,
        person
      ) => {
        if (!acc[person.batch]) {
          acc[person.batch] = {};
        }

        if (
          !acc[person.batch][
            person.section
          ]
        ) {
          acc[person.batch][
            person.section
          ] = [];
        }

        acc[person.batch][
          person.section
        ].push(person);

        return acc;
      },
      {} as Record<
        string,
        Record<string, Alumni[]>
      >
    );

  function sortBatches(
    a: string,
    b: string
  ) {
    const numberA = parseInt(
      a.replace(/\D/g, ""),
      10
    );

    const numberB = parseInt(
      b.replace(/\D/g, ""),
      10
    );

    if (
      !isNaN(numberA) &&
      !isNaN(numberB)
    ) {
      return (
        numberA - numberB
      );
    }

    return a.localeCompare(b);
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a]">
      {/* =====================================================
          HERO
      ===================================================== */}
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0a0f1a]">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
            Pharmacia Club DIU
          </p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#0b1736] dark:text-white sm:text-5xl">
            Our Proud Alumni
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            A growing community of
            Pharmacy graduates and
            former students of Daffodil
            International University,
            organized batch-wise and
            section-wise.
          </p>

          <div className="mt-8 flex justify-center">
            <a
              href="/alumni/association"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-[#0b1736] transition hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              Alumni Association
            </a>
          </div>
        </div>
      </section>

      {/* =====================================================
          ALUMNI DIRECTORY
      ===================================================== */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-[#0b1736] dark:text-white">
              Alumni Directory
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Browse our alumni by
              batch and section.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search alumni..."
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] md:w-80 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
          />
        </div>

        {/* LOADING */}
        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-[#087f8c]" />

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Loading alumni...
            </p>
          </div>
        )}

        {/* EMPTY */}
        {!loading &&
          filteredAlumni.length ===
            0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
              <div className="text-5xl">
                🎓
              </div>

              <h3 className="mt-4 text-lg font-bold text-[#0b1736] dark:text-white">
                No alumni found
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
                Alumni profiles will
                appear here after
                alumni create their
                accounts and make
                their profiles public.
              </p>
            </div>
          )}

        {/* DIRECTORY */}
        {!loading &&
          filteredAlumni.length >
            0 && (
            <div className="space-y-14">
              {Object.keys(grouped)
                .sort(sortBatches)
                .map((batch) => (
                  <section
                    key={batch}
                  >
                    {/* BATCH */}
                    <div className="mb-7 flex items-center gap-4">
                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />

                      <h2 className="rounded-full bg-[#0b1736] px-6 py-2 text-lg font-bold text-white dark:bg-[#087f8c]">
                        {batch} Batch
                      </h2>

                      <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                    </div>

                    {/* SECTIONS */}
                    <div className="space-y-9">
                      {Object.keys(
                        grouped[
                          batch
                        ]
                      )
                        .sort()
                        .map(
                          (
                            section
                          ) => (
                            <div
                              key={`${batch}-${section}`}
                            >
                              <div className="mb-4 flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-[#087f8c]" />

                                <h3 className="text-lg font-bold text-[#087f8c]">
                                  Section{" "}
                                  {
                                    section
                                  }
                                </h3>
                              </div>

                              {/* ALUMNI CARDS */}
                              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                {grouped[
                                  batch
                                ][
                                  section
                                ].map(
                                  (
                                    person
                                  ) => {
                                    const graduationLabel =
                                      formatGraduationDate(
                                        person.graduation_date,
                                        person.graduation_year
                                      );

                                    return (
                                      <article
                                        key={
                                          person.id
                                        }
                                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                                      >
                                        <div className="p-5">
                                          <div className="flex items-center gap-4">
                                            {person.profile_photo_url ? (
                                              <img
                                                src={
                                                  person.profile_photo_url
                                                }
                                                alt={
                                                  person.full_name
                                                }
                                                className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700"
                                              />
                                            ) : (
                                              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
                                                🎓
                                              </div>
                                            )}

                                            <div className="min-w-0">
                                              <h4 className="truncate font-bold text-[#0b1736] dark:text-white">
                                                {
                                                  person.full_name
                                                }
                                              </h4>

                                              <p className="mt-1 text-xs font-semibold text-[#087f8c]">
                                                {
                                                  person.batch
                                                }{" "}
                                                ·
                                                Section{" "}
                                                {
                                                  person.section
                                                }
                                              </p>
                                            </div>
                                          </div>

                                          {person.current_position && (
                                            <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                              {
                                                person.current_position
                                              }
                                            </p>
                                          )}

                                          {person.organization && (
                                            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                              {
                                                person.organization
                                              }
                                            </p>
                                          )}

                                          {person.country && (
                                            <p className="mt-2 flex items-center gap-2 text-sm font-medium text-[#087f8c]">
                                              <span aria-hidden="true">
                                                🌍
                                              </span>

                                              <span>
                                                {
                                                  person.country
                                                }
                                              </span>
                                            </p>
                                          )}

                                          {graduationLabel && (
                                            <p className="mt-3 text-xs font-medium text-slate-400">
                                              Graduation:{" "}
                                              {
                                                graduationLabel
                                              }
                                            </p>
                                          )}

                                          {person.bio && (
                                            <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                              {
                                                person.bio
                                              }
                                            </p>
                                          )}

                                          {(person.linkedin_url ||
                                            person.facebook_url ||
                                            person.instagram_url) && (
                                            <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                                              {person.linkedin_url && (
                                                <a
                                                  href={
                                                    person.linkedin_url
                                                  }
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs font-semibold text-[#087f8c] hover:underline"
                                                >
                                                  LinkedIn
                                                </a>
                                              )}

                                              {person.facebook_url && (
                                                <a
                                                  href={
                                                    person.facebook_url
                                                  }
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs font-semibold text-[#087f8c] hover:underline"
                                                >
                                                  Facebook
                                                </a>
                                              )}

                                              {person.instagram_url && (
                                                <a
                                                  href={
                                                    person.instagram_url
                                                  }
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="text-xs font-semibold text-[#087f8c] hover:underline"
                                                >
                                                  Instagram
                                                </a>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </article>
                                    );
                                  }
                                )}
                              </div>
                            </div>
                          )
                        )}
                    </div>
                  </section>
                ))}
            </div>
          )}
      </section>

      {/* =====================================================
          BOTTOM CTA
      ===================================================== */}
      <section className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0a0f1a]">
        <div className="mx-auto max-w-4xl px-6 py-16 text-center">
          <div className="text-4xl">
            🎓
          </div>

          <h2 className="mt-4 text-2xl font-bold leading-tight text-[#0b1736] dark:text-white">
            Are you a graduate of the
            Department of Pharmacy at
            Daffodil International
            University?
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Create your alumni account
            and become part of our
            growing alumni community.
            Your profile can be
            displayed in our public
            alumni directory.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="/alumni/create-account"
              className="rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c]"
            >
              Create Alumni Account
            </a>

            <a
              href="/alumni/login"
              className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-[#0b1736] transition hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:text-white"
            >
              Alumni Login
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
