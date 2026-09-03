"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AssociationMember = {
  id: string;
  name: string;
  position: string;
  photo_url: string | null;
  bio: string | null;
  display_order: number;
};

export default function AlumniAssociationPage() {
  const supabase = createClient();

  const [members, setMembers] = useState<AssociationMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("alumni_association_members")
      .select(
        "id, name, position, photo_url, bio, display_order"
      )
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error("Error loading alumni association:", error);
      setMembers([]);
    } else {
      setMembers(data || []);
    }

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#070b14]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0a0f1a]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#087f8c]/10 via-transparent to-blue-500/5" />

        <div className="relative mx-auto max-w-6xl px-4 py-16 text-center sm:px-6 lg:px-8 lg:py-20">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
            Pharmacia Club DIU
          </p>

          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-[#0b1736] dark:text-white sm:text-5xl">
            Alumni Association
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
            Connecting our alumni community, strengthening professional
            relationships, and building a lasting network of Pharmacy
            graduates of Daffodil International University.
          </p>
        </div>
      </section>

      {/* Executive Committee */}
      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        <div className="mb-10 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#087f8c]">
            Leadership
          </p>

          <h2 className="mt-2 text-3xl font-bold tracking-tight text-[#0b1736] dark:text-white">
            Alumni Association Executive Committee
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400">
            Meet the alumni leaders who contribute to the growth and
            development of our alumni community.
          </p>
        </div>

        {loading ? (
          <div className="flex min-h-[250px] items-center justify-center">
            <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Loading association members...
            </div>
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#0b1120]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl dark:bg-slate-800">
              👥
            </div>

            <h3 className="mt-4 text-lg font-bold text-[#0b1736] dark:text-white">
              Association members coming soon
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              The Alumni Association Executive Committee will be displayed
              here once the members are added by the administrator.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <article
                key={member.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[#087f8c]/30 hover:shadow-xl dark:border-slate-800 dark:bg-[#0b1120]"
              >
                {/* Photo */}
                <div className="relative flex h-72 items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={member.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center">
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-4xl shadow-sm dark:bg-slate-700">
                        👤
                      </div>
                    </div>
                  )}

                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-5 pt-16">
                    <span className="inline-flex rounded-full bg-[#087f8c] px-3 py-1 text-xs font-bold text-white">
                      {member.position}
                    </span>
                  </div>
                </div>

                {/* Information */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-[#0b1736] dark:text-white">
                    {member.name}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-[#087f8c]">
                    {member.position}
                  </p>

                  {member.bio && (
                    <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
                      {member.bio}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* About Association */}
      <section className="border-t border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0a0f1a]">
        <div className="mx-auto max-w-5xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-[#0b1736] dark:text-white">
            A Stronger Alumni Community
          </h2>

          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
            The Alumni Association brings together graduates and former
            students of the Department of Pharmacy, Daffodil International
            University. Through professional networking, collaboration,
            mentorship, and community initiatives, we aim to maintain a
            strong connection between our alumni and the university.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="/alumni"
              className="rounded-lg border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-[#0b1736] transition hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            >
              Our Proud Alumni
            </a>

            <a
              href="/alumni/create-account"
              className="rounded-lg bg-[#087f8c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#066d78]"
            >
              Create Alumni Account
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}