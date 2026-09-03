"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Alumni = {
  id: string;
  full_name: string;
  batch: string;
  section: string;
  graduation_year: number | null;
  profile_photo_url: string | null;
  current_position: string | null;
  organization: string | null;
  bio: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
};

export default function AlumniPage() {
  const supabase = useMemo(() => createClient(), []);

  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadAlumni() {
      const { data, error } = await supabase
        .from("alumni_profiles")
        .select(
          "id, full_name, batch, section, graduation_year, profile_photo_url, current_position, organization, bio, linkedin_url, facebook_url, instagram_url"
        )
        .eq("is_public", true)
        .order("full_name", { ascending: true });

      if (error) {
        console.error("Error loading alumni:", error);
      } else {
        setAlumni(data || []);
      }

      setLoading(false);
    }

    loadAlumni();
  }, [supabase]);

  const filteredAlumni = alumni.filter((person) => {
    const searchText = [
      person.full_name,
      person.batch,
      person.section,
      person.current_position,
      person.organization,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchText.includes(search.toLowerCase());
  });

  const grouped = filteredAlumni.reduce(
    (acc, person) => {
      if (!acc[person.batch]) {
        acc[person.batch] = {};
      }

      if (!acc[person.batch][person.section]) {
        acc[person.batch][person.section] = [];
      }

      acc[person.batch][person.section].push(person);

      return acc;
    },
    {} as Record<string, Record<string, Alumni[]>>
  );

  function sortBatches(a: string, b: string) {
    const numberA = parseInt(a.replace(/\D/g, ""), 10);
    const numberB = parseInt(b.replace(/\D/g, ""), 10);

    if (!isNaN(numberA) && !isNaN(numberB)) {
      return numberA - numberB;
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
            A growing community of Pharmacy graduates and former students of
            Daffodil International University, organized batch-wise and
            section-wise.
          </p>

          {/* ONLY TOP BUTTON */}
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
              Browse our alumni by batch and section.
            </p>
          </div>

          <input
            type="text"
            placeholder="Search alumni..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
        {!loading && filteredAlumni.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">

            <div className="text-5xl">
              🎓
            </div>

            <h3 className="mt-4 text-lg font-bold text-[#0b1736] dark:text-white">
              No alumni found
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Alumni profiles will appear here after alumni create their
              accounts and make their profiles public.
            </p>

          </div>
        )}

        {/* DIRECTORY */}
        {!loading && filteredAlumni.length > 0 && (
          <div className="space-y-14">

            {Object.keys(grouped)
              .sort(sortBatches)
              .map((batch) => (

                <section key={batch}>

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

                    {Object.keys(grouped[batch])
                      .sort()
                      .map((section) => (

                        <div key={`${batch}-${section}`}>

                          <div className="mb-4 flex items-center gap-3">

                            <span className="h-2 w-2 rounded-full bg-[#087f8c]" />

                            <h3 className="text-lg font-bold text-[#087f8c]">
                              Section {section}
                            </h3>

                          </div>

                          {/* ALUMNI CARDS */}
                          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">

                            {grouped[batch][section].map((person) => (

                              <article
                                key={person.id}
                                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900"
                              >

                                <div className="p-5">

                                  <div className="flex items-center gap-4">

                                    {person.profile_photo_url ? (
                                      <img
                                        src={person.profile_photo_url}
                                        alt={person.full_name}
                                        className="h-16 w-16 shrink-0 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-700"
                                      />
                                    ) : (
                                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
                                        🎓
                                      </div>
                                    )}

                                    <div className="min-w-0">

                                      <h4 className="truncate font-bold text-[#0b1736] dark:text-white">
                                        {person.full_name}
                                      </h4>

                                      <p className="mt-1 text-xs font-semibold text-[#087f8c]">
                                        {person.batch} · Section {person.section}
                                      </p>

                                    </div>

                                  </div>

                                  {person.current_position && (
                                    <p className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-200">
                                      {person.current_position}
                                    </p>
                                  )}

                                  {person.organization && (
                                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                      {person.organization}
                                    </p>
                                  )}

                                  {person.graduation_year && (
                                    <p className="mt-3 text-xs text-slate-400">
                                      Graduation: {person.graduation_year}
                                    </p>
                                  )}

                                  {person.bio && (
                                    <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                                      {person.bio}
                                    </p>
                                  )}

                                  {(person.linkedin_url ||
                                    person.facebook_url ||
                                    person.instagram_url) && (

                                    <div className="mt-4 flex flex-wrap gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">

                                      {person.linkedin_url && (
                                        <a
                                          href={person.linkedin_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs font-semibold text-[#087f8c] hover:underline"
                                        >
                                          LinkedIn
                                        </a>
                                      )}

                                      {person.facebook_url && (
                                        <a
                                          href={person.facebook_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs font-semibold text-[#087f8c] hover:underline"
                                        >
                                          Facebook
                                        </a>
                                      )}

                                      {person.instagram_url && (
                                        <a
                                          href={person.instagram_url}
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

                            ))}

                          </div>

                        </div>

                      ))}

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
            Are you a graduate of the Department of Pharmacy at Daffodil
            International University?
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Create your alumni account and become part of our growing alumni
            community. Your profile can be displayed in our public alumni
            directory.
          </p>

          {/* ONLY HERE: ACCOUNT BUTTONS */}
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