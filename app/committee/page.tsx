"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import PageHero from "../components/page-hero";
import Reveal from "../components/reveal";

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

/*
 * CURRENT COMMITTEE
 */
const CURRENT_SESSION = "Fall 2026";

/*
 * PREVIOUS COMMITTEES
 */
const PREVIOUS_SESSIONS = [
  "Spring 2022",
  "2024",
  "Spring 2025",
  "2025-2026",
];

/*
 * UPCOMING COMMITTEES
 */
const UPCOMING_SESSIONS = [
  "Spring 2027",
  "Fall 2027",
  "Spring 2028",
  "Fall 2028",
  "Spring 2029",
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

  /*
   * LOAD COMMITTEE MEMBERS
   */
  useEffect(() => {
    async function loadCommittee() {
      setLoading(true);
      setErrorMessage("");

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

  /*
   * CURRENT COMMITTEE
   *
   * Fall 2026 is always treated as the current session.
   */
  const currentSession = CURRENT_SESSION;

  /*
   * PREVIOUS SESSIONS
   *
   * Only show sessions that actually exist in the database.
   * The order is fixed so the history never appears randomly.
   */
  const previousSessions = useMemo(() => {
    const existingSessions = new Set(
      members
        .filter(
          (member) =>
            member.session &&
            member.session.trim() !== CURRENT_SESSION
        )
        .map((member) => member.session!.trim())
    );

    return PREVIOUS_SESSIONS.filter((session) =>
      existingSessions.has(session)
    );
  }, [members]);

  /*
   * UPCOMING SESSIONS
   *
   * Only show upcoming sessions that have already been added
   * to the database.
   */
  const upcomingSessions = useMemo(() => {
    const existingSessions = new Set(
      members
        .filter((member) => member.session)
        .map((member) => member.session!.trim())
    );

    return UPCOMING_SESSIONS.filter((session) =>
      existingSessions.has(session)
    );
  }, [members]);

  /*
   * ACTIVE SESSION
   *
   * No selected archive = current committee.
   */
  const activeSession = selectedSession || currentSession;

  /*
   * MEMBERS FOR CURRENT/SELECTED SESSION
   */
  const displayedMembers = members.filter(
    (member) =>
      member.session?.trim() === activeSession?.trim()
  );

  /*
   * OPEN A PREVIOUS OR UPCOMING SESSION
   */
  async function handleSessionClick(session: string) {
    if (selectedSession === session) {
      setSelectedSession(null);
      return;
    }

    setSelectedSession(session);
    setSessionLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("committee")
      .select("*")
      .eq("session", session)
      .order("display_order", { ascending: true });

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else if (data) {
      setMembers((current) => {
        const otherMembers = current.filter(
          (member) => member.session !== session
        );

        return [...otherMembers, ...data];
      });
    }

    setSessionLoading(false);

    setTimeout(() => {
      document
        .getElementById("selected-committee")
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 100);
  }

  /*
   * RETURN TO CURRENT COMMITTEE
   */
  function handleCurrentCommittee() {
    setSelectedSession(null);

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
    <main className="min-h-screen bg-[#f7faff] text-[#0b1736] transition-colors dark:bg-[#0a0f1a] dark:text-slate-100">
      {/* HERO */}
      <PageHero
        emoji="👑"
        title="Committee"
        accent="2026"
        index={1}
        subtitle="Meet the leaders, advisors, and executive members of Pharmacia Club DIU."
      />

      {/* COMMITTEE */}
      <section
        id="selected-committee"
        className="mx-auto max-w-7xl px-6 py-16 lg:px-8"
      >
        {loading ? (
          <div className="py-20 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#087f8c] dark:border-slate-700 dark:border-t-[#2dd4bf]" />

            <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
              Loading committee...
            </p>
          </div>
        ) : errorMessage ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#111827]">
            <h2 className="text-2xl font-black text-[#0b1736] dark:text-white">
              Unable to load committee
            </h2>

            <p className="mt-3 text-sm text-red-500 dark:text-red-400">
              {errorMessage}
            </p>
          </div>
        ) : (
          <>
            {/* HEADER */}
            <div className="mb-10 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c] dark:text-[#2dd4bf]">
                  {selectedSession
                    ? "Committee Archive"
                    : "Current Committee"}
                </p>

                <h2 className="mt-3 text-4xl font-black text-[#0b1736] dark:text-white">
                  {activeSession || "Committee"}
                </h2>
              </div>

              <div className="flex flex-wrap gap-3">
                {selectedSession && (
                  <button
                    type="button"
                    onClick={handleCurrentCommittee}
                    className="rounded-full border border-slate-300 bg-white px-5 py-2 text-sm font-bold text-[#0b1736] transition hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200 dark:hover:border-[#2dd4bf] dark:hover:text-[#5eead4]"
                  >
                    ← Current Committee
                  </button>
                )}

                {activeSession && (
                  <div className="rounded-full bg-[#e4f7f8] px-5 py-2 text-sm font-bold text-[#087f8c] dark:bg-[#12383c] dark:text-[#5eead4]">
                    {selectedSession
                      ? "Archived Session"
                      : "Current Session"}
                  </div>
                )}
              </div>
            </div>

            {/* SESSION LOADING */}
            {sessionLoading ? (
              <div className="py-16 text-center">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-200 border-t-[#087f8c] dark:border-slate-700 dark:border-t-[#2dd4bf]" />

                <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                  Loading this committee...
                </p>
              </div>
            ) : displayedMembers.length === 0 ? (
              <div className="rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-700 dark:bg-[#111827] dark:shadow-none">
                <h3 className="text-2xl font-black text-[#0b1736] dark:text-white">
                  No members found
                </h3>

                <p className="mt-3 text-slate-500 dark:text-slate-400">
                  No committee members have been added for{" "}
                  <strong className="text-[#0b1736] dark:text-slate-200">
                    {activeSession}
                  </strong>
                  .
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
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c] dark:text-[#2dd4bf]">
                        {panel}
                      </p>

                      <div className="mt-3 h-1 w-16 rounded-full bg-[#087f8c] dark:bg-[#2dd4bf]" />
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
        <section className="border-t border-slate-200 bg-white py-20 transition-colors dark:border-slate-800 dark:bg-[#0f172a]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c] dark:text-[#2dd4bf]">
                History
              </p>

              <h2 className="mt-3 text-4xl font-black text-[#0b1736] dark:text-white">
                Previous Committees
              </h2>

              <p className="mt-3 max-w-2xl text-slate-500 dark:text-slate-400">
                Explore the previous committees and leadership
                sessions of Pharmacia Club DIU.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {previousSessions.map((session) => (
                <button
                  key={session}
                  type="button"
                  onClick={() => handleSessionClick(session)}
                  className={`rounded-full border px-5 py-3 text-sm font-bold transition ${
                    selectedSession === session
                      ? "border-[#087f8c] bg-[#087f8c] text-white dark:border-[#2dd4bf] dark:bg-[#2dd4bf] dark:text-[#062a2d]"
                      : "border-slate-200 bg-white text-[#0b1736] hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200 dark:hover:border-[#2dd4bf] dark:hover:text-[#5eead4]"
                  }`}
                >
                  {session}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* UPCOMING COMMITTEES */}
      {upcomingSessions.length > 0 && (
        <section className="border-t border-slate-200 bg-[#f7faff] py-20 transition-colors dark:border-slate-800 dark:bg-[#0a0f1a]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mb-8">
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c] dark:text-[#2dd4bf]">
                Future
              </p>

              <h2 className="mt-3 text-4xl font-black text-[#0b1736] dark:text-white">
                Upcoming Committees
              </h2>

              <p className="mt-3 max-w-2xl text-slate-500 dark:text-slate-400">
                Explore upcoming committee sessions of Pharmacia Club DIU.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {upcomingSessions.map((session) => (
                <button
                  key={session}
                  type="button"
                  onClick={() => handleSessionClick(session)}
                  className={`rounded-full border px-5 py-3 text-sm font-bold transition ${
                    selectedSession === session
                      ? "border-[#087f8c] bg-[#087f8c] text-white dark:border-[#2dd4bf] dark:bg-[#2dd4bf] dark:text-[#062a2d]"
                      : "border-slate-200 bg-white text-[#0b1736] hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200 dark:hover:border-[#2dd4bf] dark:hover:text-[#5eead4]"
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
    <article className="group overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl dark:border-slate-700 dark:bg-[#111827] dark:shadow-none dark:hover:shadow-lg">
      <div className="aspect-[4/3] bg-gradient-to-br from-[#dff7f8] to-[#e8eefb] dark:from-[#12383c] dark:to-[#172554]">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={member.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-3xl font-black text-[#087f8c] shadow-lg dark:bg-[#1e293b] dark:text-[#5eead4]">
              {member.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      <div className="p-6">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#087f8c] dark:text-[#2dd4bf]">
          {member.position}
        </p>

        <h3 className="mt-2 text-xl font-black text-[#0b1736] dark:text-white">
          {member.name}
        </h3>

        {member.batch && (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            {member.batch}
          </p>
        )}

        {member.bio && (
          <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
            {member.bio}
          </p>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          {member.facebook_url && (
            <a
              href={member.facebook_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-[#0b1736] hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:text-slate-200 dark:hover:border-[#2dd4bf] dark:hover:text-[#5eead4]"
            >
              Facebook
            </a>
          )}

          {member.linkedin_url && (
            <a
              href={member.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-[#0b1736] hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:text-slate-200 dark:hover:border-[#2dd4bf] dark:hover:text-[#5eead4]"
            >
              LinkedIn
            </a>
          )}

          {member.instagram_url && (
            <a
              href={member.instagram_url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-[#0b1736] hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:text-slate-200 dark:hover:border-[#2dd4bf] dark:hover:text-[#5eead4]"
            >
              Instagram
            </a>
          )}
        </div>
      </div>
    </article>
  );
}
