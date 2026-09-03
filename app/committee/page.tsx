"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type CommitteeMember = {
  id: number;
  name: string;
  position: string;
  batch: string | null;
  department?: string | null;
  photo_url: string | null;
  bio: string | null;
  display_order?: number | null;
};

export default function CommitteePage() {
  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadCommittee() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("committee")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) {
        console.error("Committee fetch error:", error);
        setErrorMessage("Unable to load committee information.");
        setMembers([]);
      } else {
        setMembers(data ?? []);
      }

      setLoading(false);
    }

    loadCommittee();
  }, []);

  const facultyMembers = members.filter((member) =>
    ["Faculty Advisor", "Student Advisor"].includes(member.position)
  );

  const studentMembers = members.filter(
    (member) =>
      member.position !== "Faculty Advisor" &&
      member.position !== "Student Advisor"
  );

  return (
    <main className="min-h-screen bg-[#f7faff] text-[#0b1736]">
      {/* HERO */}
      <section className="bg-[#0b1736] px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            Leadership
          </p>

          <h1 className="mt-5 text-5xl font-black tracking-tight sm:text-6xl">
            Meet the Committee
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            The people who help shape the activities, initiatives and
            community of Pharmacia Club DIU.
          </p>
        </div>
      </section>

      {/* LOADING */}
      {loading && (
        <section className="px-6 py-24 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#087f8c]" />
          <p className="mt-4 text-sm text-slate-500">
            Loading committee members...
          </p>
        </section>
      )}

      {/* ERROR */}
      {!loading && errorMessage && (
        <section className="px-6 py-24 text-center">
          <h2 className="text-2xl font-black">
            Unable to load committee
          </h2>

          <p className="mt-3 text-slate-500">
            Please refresh the page and try again.
          </p>
        </section>
      )}

      {/* FACULTY */}
      {!loading && !errorMessage && facultyMembers.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="mb-10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
              Faculty leadership
            </p>

            <h2 className="mt-3 text-3xl font-black">
              Advisors
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {facultyMembers.map((member) => (
              <MemberCard key={member.id} member={member} />
            ))}
          </div>
        </section>
      )}

      {/* STUDENT COMMITTEE */}
      {!loading && !errorMessage && studentMembers.length > 0 && (
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-10">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
                Student leadership
              </p>

              <h2 className="mt-3 text-3xl font-black">
                Executive Committee
              </h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {studentMembers.map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* EMPTY STATE */}
      {!loading &&
        !errorMessage &&
        members.length === 0 && (
          <section className="px-6 py-24 text-center">
            <h2 className="text-2xl font-black">
              Committee information coming soon
            </h2>

            <p className="mt-3 text-slate-500">
              Committee members will be displayed here.
            </p>
          </section>
        )}

      {/* CTA */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-[#087f8c] px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-black">
            Leadership starts with participation.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-cyan-50">
            Explore our activities and become part of the Pharmacia Club
            community.
          </p>
        </div>
      </section>
    </main>
  );
}

function MemberCard({
  member,
}: {
  member: CommitteeMember;
}) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* PHOTO */}
      <div className="aspect-[4/3] bg-gradient-to-br from-[#dff7f8] to-[#e8eefb]">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={member.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-3xl font-black text-[#087f8c] shadow-lg">
              {member.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      {/* INFORMATION */}
      <div className="p-6">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#087f8c]">
          {member.position}
        </p>

        <h3 className="mt-2 text-xl font-black">
          {member.name}
        </h3>

        {member.batch && (
          <p className="mt-2 text-sm text-slate-500">
            {member.batch}
          </p>
        )}

        {member.bio && (
          <p className="mt-3 text-sm leading-6 text-slate-500">
            {member.bio}
          </p>
        )}

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold transition hover:border-[#087f8c] hover:text-[#087f8c]"
          >
            Profile
          </button>

          <button
            type="button"
            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold transition hover:border-[#087f8c] hover:text-[#087f8c]"
          >
            Social
          </button>
        </div>
      </div>
    </article>
  );
}