"use client";

import Link from "next/link";
import PageHero from "../components/page-hero";
import Reveal from "../components/reveal";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type EventItem = {
  id: number;
  title: string;
  description: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  organizer: string | null;
  image_url: string | null;
  registration_url: string | null;
  status: string | null;
};

type EventStatus =
  | "Upcoming"
  | "Ongoing"
  | "Completed"
  | "Cancelled";

function getAutomaticStatus(event: EventItem): EventStatus {
  if (event.status === "Cancelled") {
    return "Cancelled";
  }

  if (!event.event_date) {
    return "Upcoming";
  }

  const now = new Date();

  const startDate = new Date(
    `${event.event_date}T${event.start_time || "00:00"}`
  );

  const endDate = new Date(
    `${event.event_date}T${event.end_time || "23:59"}`
  );

  if (now < startDate) {
    return "Upcoming";
  }

  if (now >= startDate && now <= endDate) {
    return "Ongoing";
  }

  return "Completed";
}

function formatDate(date: string | null) {
  if (!date) return "Date TBA";

  const formattedDate = new Date(`${date}T00:00:00`);

  return formattedDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(time: string | null) {
  if (!time) return "";

  const [hours, minutes] = time.split(":");
  const date = new Date();

  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getStatusClass(status: EventStatus) {
  switch (status) {
    case "Upcoming":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300";

    case "Ongoing":
      return "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300";

    case "Completed":
      return "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";

    case "Cancelled":
      return "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-300";

    default:
      return "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-300";
  }
}

export default function HomePage() {
  const supabase = createClient();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  /* ================= LOAD EVENTS ================= */

  useEffect(() => {
    async function loadEvents() {
      setLoadingEvents(true);

      const { data, error } = await supabase
        .from("events")
        .select("*")
        .order("event_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (error) {
        console.error("Error loading events:", error);
        setEvents([]);
      } else {
        setEvents(data || []);
      }

      setLoadingEvents(false);
    }

    loadEvents();
  }, [supabase]);

  /* ================= EVENT LISTS ================= */

  const withStatus = useMemo(
    () =>
      events.map((event) => ({
        ...event,
        automaticStatus: getAutomaticStatus(event),
      })),
    [events]
  );

  /* ALL upcoming / ongoing events — no limit */
  const upcomingEvents = useMemo(
    () =>
      withStatus.filter(
        (event) =>
          event.automaticStatus === "Upcoming" ||
          event.automaticStatus === "Ongoing"
      ),
    [withStatus]
  );

  /* Past events (completed or cancelled) below the main list */
  const pastEvents = useMemo(
    () =>
      withStatus.filter(
        (event) =>
          event.automaticStatus === "Completed" ||
          event.automaticStatus === "Cancelled"
      ),
    [withStatus]
  );

  /* ================= AREAS ================= */

  const areas = [
    {
      title: "Academic Excellence",
      description:
        "Supporting pharmacy students through academic activities, learning opportunities and professional development.",
    },
    {
      title: "Research & Innovation",
      description:
        "Encouraging scientific thinking, research skills and innovation among future pharmacists.",
    },
    {
      title: "Professional Development",
      description:
        "Connecting students with industry, alumni and professional opportunities.",
    },
    {
      title: "Leadership",
      description:
        "Developing leadership, communication and teamwork skills through meaningful activities.",
    },
    {
      title: "Community Engagement",
      description:
        "Creating positive social impact through awareness programs and community initiatives.",
    },
    {
      title: "Creative Expression",
      description:
        "Providing students with opportunities to showcase creativity, ideas and talent.",
    },
  ];

  return (
    <main className="bg-white text-slate-900 dark:bg-[#050a13] dark:text-white">

      {/* ================= HERO ================= */}
      <PageHero
        emoji="🎟️"
        title="Events"
        accent="& Activities"
        index={2}
        subtitle="Seminars, competitions, workshops, fests and community programs — everything happening in Pharmacia Club DIU."
      />

      {/* ================= STATS (colorful) ================= */}
      <section className="relative bg-white dark:bg-[#07101f]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-6 py-10 sm:grid-cols-4 lg:px-8">
          <div className="pc-card3d rounded-3xl bg-gradient-to-br from-cyan-500 to-blue-600 p-6 text-center text-white shadow-[0_18px_40px_-14px_rgba(34,211,238,.4)]">
            <p className="text-3xl font-black">37+</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-white/85">Batches Connected</p>
          </div>
          <div className="pc-card3d rounded-3xl bg-gradient-to-br from-violet-500 to-fuchsia-600 p-6 text-center text-white shadow-[0_18px_40px_-14px_rgba(167,139,250,.4)]">
            <p className="text-3xl font-black">10+</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-white/85">Activities</p>
          </div>
          <div className="pc-card3d rounded-3xl bg-gradient-to-br from-amber-400 to-orange-600 p-6 text-center text-white shadow-[0_18px_40px_-14px_rgba(251,191,36,.4)]">
            <p className="text-3xl font-black">15,000+</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-white/85">Students</p>
          </div>
          <div className="pc-card3d rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 p-6 text-center text-white shadow-[0_18px_40px_-14px_rgba(52,211,153,.4)]">
            <p className="text-3xl font-black">2</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-wider text-white/85">Pharmacy Communities</p>
          </div>
        </div>
      </section>

      {/* ================= ABOUT ================= */}

      <section className="bg-slate-50 py-24 dark:bg-[#050a13]">

        <div className="mx-auto grid max-w-7xl gap-14 px-6 lg:grid-cols-2 lg:px-8">

          <div>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
              About Us
            </p>

            <h2 className="mt-4 text-4xl font-bold">
              Empowering the next generation of pharmacists.
            </h2>

          </div>

          <div>

            <p className="text-lg leading-8 text-slate-600 dark:text-slate-300">
              Pharmacia Club DIU is a student-focused platform dedicated to
              academic excellence, research, professional development,
              leadership, creativity and community engagement.
            </p>

            <Link
              href="/about"
              className="mt-6 inline-block font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400"
            >
              Learn more →
            </Link>

          </div>

        </div>

      </section>

      {/* ================= FEATURED EVENTS ================= */}

      <section
        id="events"
        className="bg-[#0b1736] py-24 text-white dark:bg-[#050a13]"
      >

        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">

            <div>

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Events
              </p>

              <h2 className="mt-3 text-4xl font-bold">
                Upcoming Events
              </h2>

              <p className="mt-4 max-w-2xl text-slate-300">
                Every upcoming activity from Pharmacia Club DIU — bookmarked,
                seminars, competitions and more.
              </p>

            </div>

            {!loadingEvents && (
              <span className="w-fit rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-sm font-bold text-cyan-200">
                {upcomingEvents.length} upcoming
              </span>
            )}

          </div>

          {loadingEvents && (
            <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">

              <p className="text-slate-300">
                Loading featured events...
              </p>

            </div>
          )}

          {!loadingEvents && upcomingEvents.length === 0 && (
            <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">

              <h3 className="text-xl font-semibold">
                No upcoming events right now
              </h3>

              <p className="mt-2 text-slate-400">
                New activities will appear here as soon as they are announced
                by the club.
              </p>

            </div>
          )}

          {!loadingEvents && upcomingEvents.length > 0 && (

            <div className="pc-stagger mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {upcomingEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}

            </div>

          )}

        </div>

      </section>

      {/* ================= PAST EVENTS ================= */}

      {pastEvents.length > 0 && (
        <section className="bg-slate-50 py-20 dark:bg-[#050a13]">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
                  Archive
                </p>

                <h2 className="mt-3 text-3xl font-bold text-[#0b1736] dark:text-white">
                  Past Events
                </h2>

                <p className="mt-3 text-slate-500 dark:text-slate-400">
                  Completed and cancelled activities from the club.
                </p>
              </div>

              <span className="w-fit rounded-full border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 dark:border-slate-700 dark:text-slate-300">
                {pastEvents.length} past
              </span>
            </div>

            <div className="pc-stagger mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pastEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================= AREAS ================= */}

      <section className="bg-white py-24 dark:bg-[#07101f]">

        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="max-w-3xl">

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
              What We Do
            </p>

            <h2 className="mt-3 text-4xl font-bold">
              Building a stronger pharmacy community.
            </h2>

          </div>

          <div className="pc-stagger mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {areas.map((area) => (

              <article
                key={area.title}
                className="rounded-2xl border border-slate-200 p-7 transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/5"
              >

                <h3 className="text-xl font-bold">
                  {area.title}
                </h3>

                <p className="mt-3 leading-7 text-slate-600 dark:text-slate-400">
                  {area.description}
                </p>

              </article>

            ))}

          </div>

        </div>

      </section>

      {/* ================= RESEARCH ================= */}

      <section className="bg-slate-50 py-24 dark:bg-[#050a13]">

        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:px-8">

          <div>

            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
              Research
            </p>

            <h2 className="mt-3 text-4xl font-bold">
              Explore. Research. Innovate.
            </h2>

            <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              Encouraging students to develop research skills and explore
              emerging areas of pharmaceutical science.
            </p>

          </div>

          <div className="flex items-center lg:justify-end">

            <Link
              href="/research"
              className="rounded-full bg-[#0b1736] px-7 py-3 font-semibold text-white transition hover:bg-[#122653] dark:bg-cyan-400 dark:text-slate-950 dark:hover:bg-cyan-300"
            >
              Explore Research →
            </Link>

          </div>

        </div>

      </section>

      {/* ================= MAGAZINE ================= */}

      <section className="bg-white py-24 dark:bg-[#07101f]">

        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="rounded-3xl bg-[#0b1736] p-8 text-white sm:p-12">

            <div className="max-w-3xl">

              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">
                Magazine
              </p>

              <h2 className="mt-3 text-4xl font-bold">
                Read. Create. Share.
              </h2>

              <p className="mt-5 leading-8 text-slate-300">
                Explore student writing, artwork, photography, pharmaceutical
                knowledge and creative contributions through Pharmacia Club's
                magazine.
              </p>

              <Link
                href="/magazine"
                className="mt-7 inline-block rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
              >
                Visit Magazine →
              </Link>

            </div>

          </div>

        </div>

      </section>

      {/* ================= CTA ================= */}

      <section className="bg-[#071633] py-20 text-white">

        <div className="mx-auto max-w-5xl px-6 text-center">

          <h2 className="text-4xl font-bold">
            Be part of the Pharmacia community.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl leading-7 text-slate-300">
            Stay connected with upcoming events, research activities,
            publications and opportunities.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">

            <Link
              href="/events"
              className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 hover:bg-cyan-300"
            >
              Explore Events
            </Link>

            <Link
              href="/contact"
              className="rounded-full border border-white/30 px-6 py-3 font-semibold hover:bg-white/10"
            >
              Contact Us
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}
/* ============================================================
   Reusable event card (upcoming + past sections)
============================================================ */

type EventWithStatus = EventItem & { automaticStatus: EventStatus };

function EventCard({ event }: { event: EventWithStatus }) {
  const COMPLETED_TONE = event.automaticStatus === "Completed";

  const cardClass = COMPLETED_TONE
    ? "group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-[#0d1422]"
    : "group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/10";

  return (
    <article className={cardClass}>
      {event.image_url ? (
        <img
          src={event.image_url}
          alt={event.title}
          className="h-52 w-full object-cover"
        />
      ) : (
        <div className="flex h-52 w-full items-center justify-center bg-gradient-to-br from-blue-800 to-blue-500 text-white dark:from-[#0e2a2e] dark:to-[#164e63]">
          <span className="text-lg font-semibold">Pharmacia Club DIU</span>
        </div>
      )}

      <div className="p-6">
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
            event.automaticStatus
          )}`}
        >
          {event.automaticStatus}
        </span>

        <h3
          className={`mt-4 text-2xl font-bold ${
            COMPLETED_TONE
              ? "text-[#0b1736] dark:text-white"
              : "text-white"
          }`}
        >
          {event.title}
        </h3>

        {event.description && (
          <p
            className={`mt-3 line-clamp-3 text-sm leading-6 ${
              COMPLETED_TONE
                ? "text-slate-600 dark:text-slate-400"
                : "text-slate-300"
            }`}
          >
            {event.description}
          </p>
        )}

        {event.event_date && (
          <p
            className={`mt-5 text-sm font-semibold ${
              COMPLETED_TONE ? "text-[#0b1736] dark:text-white" : "text-white"
            }`}
          >
            Date: {formatDate(event.event_date)}
          </p>
        )}

        {(event.start_time || event.end_time) && (
          <p
            className={`mt-2 text-sm ${
              COMPLETED_TONE
                ? "text-slate-500 dark:text-slate-400"
                : "text-slate-400"
            }`}
          >
            Time: {formatTime(event.start_time)}
            {event.end_time && ` - ${formatTime(event.end_time)}`}
          </p>
        )}

        {event.venue && (
          <p
            className={`mt-2 text-sm ${
              COMPLETED_TONE
                ? "text-slate-500 dark:text-slate-400"
                : "text-slate-400"
            }`}
          >
            Venue: {event.venue}
          </p>
        )}

        <Link
          href={`/events/${event.id}`}
          className={`mt-6 inline-block font-semibold transition hover:text-cyan-200 ${
            COMPLETED_TONE
              ? "text-[#087f8c] dark:text-[#2dd4bf] hover:text-cyan-600 dark:hover:text-cyan-300"
              : "text-cyan-300"
          }`}
        >
          View details →
        </Link>
      </div>
    </article>
  );
}
