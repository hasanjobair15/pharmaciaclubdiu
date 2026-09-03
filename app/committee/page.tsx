"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Panel =
  | "Faculty Advisory Panel"
  | "Student Advisory Panel"
  | "Executive Committee";

type CommitteeMember = {
  id: number;
  name: string;
  position: string;
  panel: Panel;
  session: string | null;
  is_current: boolean;
  batch: string | null;
  photo_url: string | null;
  bio: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  display_order: number | null;
};

const panels: Panel[] = [
  "Faculty Advisory Panel",
  "Student Advisory Panel",
  "Executive Committee",
];

export default function CommitteePage() {
  const supabase = createClient();

  const [members, setMembers] = useState<CommitteeMember[]>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(
    null
  );

  const [loading, setLoading] = useState(true);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Load all committee data initially
  useEffect(() => {
    async function loadCommittee() {
      setLoading(true);

      const { data, error } = await supabase
        .from("committee")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) {
        console.error(error);
        setErrorMessage(error.message);
      } else {
        setMembers(data ?? []);
      }

      setLoading(false);
    }

    loadCommittee();
  }, []);

  const currentMembers = members.filter(
    (member) => member.is_current === true
  );

  const currentSession =
    currentMembers.find((member) => member.session)?.session ?? "";

  const previousSessions = useMemo(() => {
    return Array.from(
      new Set(
        members
          .filter(
            (member) =>
              !member.is_current &&
              member.session &&
              member.session !== currentSession
          )
          .map((member) => member.session!.trim())
      )
    );
  }, [members, currentSession]);

  const activeSession = selectedSession || currentSession;

  const displayedMembers = members.filter(
    (member) =>
      member.session?.trim() === activeSession?.trim()
  );

  async function handleSessionClick(session: string) {
    // Clicking the currently selected session closes it
    if (selectedSession === session) {
      setSelectedSession(null);
      return;
    }

    setSelectedSession(session);
    setSessionLoading(true);

    // Fetch this session directly from Supabase
    const { data, error } = await supabase
      .from("committee")
      .select("*")
      .eq("session", session)
      .order("display_order", { ascending: true });

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else if (data) {
      // Replace only this session's records in local state
      setMembers((current) => {
        const otherMembers = current.filter(
          (member) => member.session !== session
        );

        return [...otherMembers, ...data];
      });
    }

    setSessionLoading(false);

    // Scroll to committee section
    setTimeout(() => {
      document
        .getElementById("selected-committee")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  }

  return (
    <main className="min-h-screen bg-[#f7faff] text-[#0b1736]">
      {/* HERO */}
      <section className="bg-[#0b1736] px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            Leadership
          </p>

          <h1 className="mt-5 text-5xl font-black tracking-tight sm:text-6xl">
            Committee
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Meet the leaders, advisors, and executive members of
            Pharmacia Club DIU.
          </p>
        </div>
      </section>

      {/* COMMITTEE */}
      <section
        id="selected-committee"
        className="mx-auto max-w-7xl px-6 py-16 lg:px-8"
      >
        {loading ? (
          <div className="py-20 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#087f8c]" />

            <p className="mt-4 text-sm text-slate-500">
              Loading committee...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="rounded-3xl bg-white p-10 text-center">
            <h2 className="text-2xl font-black">
              Unable to load committee
            </h2>

            <p className="mt-3 text-sm text-red-500">
              {errorMessage}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
                  {selectedSession
                    ? "Committee Archive"
                    : "Current Committee"}
                </p>

                <h2 className="mt-3 text-4xl font-black">
                  {activeSession || "Committee"}
                </h2>
              </div>

              {activeSession && (
                <div className="rounded-full bg-[#e4f7f8] px-5 py-2 text-sm font-bold text-[#087f8c]">
                  {selectedSession
                    ? "Previous Session"
                    : "Current Session"}
                </div>
              )}
            </div>

            {sessionLoading ? (
              <div className="py-16 text-center">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#087f8c]" />

                <p className="mt-4 text-sm text-slate-500">
                  Loading this committee...
                </p>
              </div>
            ) : displayedMembers.length === 0 ? (
              <div className="rounded-3xl bg-white px-6 py-16 text-center shadow-sm">
                <h3 className="text-2xl font-black">
                  No members found
                </h3>

                <p className="mt-3 text-slate-500">
                  No committee members have been added for{" "}
                  <strong>{activeSession}</strong>.
                </p>
              </div>
            ) : (
              panels.map((panel) => {
                const panelMembers = displayedMembers
                  .filter((member) => member.panel === panel)
                  .sort(
                    (a, b) =>
                      (a.display_order ?? 0) -
                      (b.display_order ?? 0)
                  );

                if (panelMembers.length === 0) {
                  return null;
                }

                return (
                  <section key={panel} className="mb-16 last:mb-0">
                    <div className="mb-8">
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
                        {panel}
                      </p>

                      <div className="mt-3 h-1 w-16 rounded-full bg-[#087f8c]" />
                    </div>

                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                      {panelMembers.map((member) => (
                        <MemberCard
                          key={member.id}
                          member={member}
                        />
                      ))}
                    </div>
                  </section>
                );
              })
            )}
          </>
        )}
      </section>

      {/* PREVIOUS COMMITTEES */}
      {previousSessions.length > 0 && (
        <section className="border-t border-slate-200 bg-white py-20">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
                History
              </p>

              <h2 className="mt-3 text-4xl font-black">
                Previous Committees
              </h2>

              <p className="mt-3 max-w-2xl text-slate-500">
                Explore the previous committees and leadership
                sessions of Pharmacia Club DIU.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {previousSessions.map((session) => (
                <button
                  key={session}
                  type="button"
                  onClick={() =>
                    handleSessionClick(session)
                  }
                  className={`rounded-full border px-5 py-3 text-sm font-bold transition ${
                    selectedSession === session
                      ? "border-[#087f8c] bg-[#087f8c] text-white"
                      : "border-slate-200 bg-white text-[#0b1736] hover:border-[#087f8c] hover:text-[#087f8c]"
                  }`}
                >
                  {session}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
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

        <div className="mt-5 flex flex-wrap gap-2">
          {member.facebook_url && (
            <a
              href={member.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold hover:border-[#087f8c] hover:text-[#087f8c]"
            >
              Facebook
            </a>
          )}

          {member.linkedin_url && (
            <a
              href={member.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold hover:border-[#087f8c] hover:text-[#087f8c]"
            >
              LinkedIn
            </a>
          )}

          {member.instagram_url && (
            <a
              href={member.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold hover:border-[#087f8c] hover:text-[#087f8c]"
            >
              Instagram
            </a>
          )}
        </div>
      </div>
    </article>
  );
}