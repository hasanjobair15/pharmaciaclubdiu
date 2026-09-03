"use client";

import Link from "next/link";
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

  /* ================= HOME EVENT HIGHLIGHTS ================= */

  const highlightedEvents = useMemo(() => {
    return events
      .map((event) => ({
        ...event,
        automaticStatus: getAutomaticStatus(event),
      }))
      .filter(
        (event) =>
          event.automaticStatus === "Upcoming" ||
          event.automaticStatus === "Ongoing"
      )
      .slice(0, 3);
  }, [events]);

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

      <section className="relative overflow-hidden bg-[#071633] text-white">
        <div className="mx-auto max-w-7xl px-6 py-28 lg:px-8 lg:py-36">

          <div className="max-w-4xl">

            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">
              Pharmacia Club DIU
            </p>

            <h1 className="text-4xl font-bold leading-tight sm:text-5xl lg:text-7xl">
              Connect.
              <br />
              Compete.
              <br />
              Create.
              <br />
              Celebrate.
            </h1>

            <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-300">
              The official platform of Pharmacia Club, Department of Pharmacy,
              Daffodil International University — connecting students,
              knowledge, research, leadership and professional opportunities.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">

              <Link
                href="/events"
                className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300"
              >
                Explore Events
              </Link>

              <Link
                href="/magazine"
                className="rounded-full border border-white/30 px-6 py-3 font-semibold transition hover:bg-white/10"
              >
                Explore Magazine
              </Link>

            </div>

          </div>

        </div>
      </section>

      {/* ================= STATS ================= */}

      <section className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-[#07101f]">

        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-12 sm:grid-cols-4 lg:px-8">

          {/* 37+ Batches Connected */}

          <div>
            <p className="text-3xl font-bold">
              37+
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Batches Connected
            </p>
          </div>

          {/* 10+ Activities */}

          <div>
            <p className="text-3xl font-bold">
              10+
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Activities
            </p>
          </div>

          {/* 15,000+ Students */}

          <div>
            <p className="text-3xl font-bold">
              15,000+
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Students
            </p>
          </div>

          {/* 2 Pharmacy Community */}

          <div>
            <p className="text-3xl font-bold">
              2
            </p>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Pharmacy Community
            </p>
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
                Highlights
              </p>

              <h2 className="mt-3 text-4xl font-bold">
                Featured Events
              </h2>

              <p className="mt-4 max-w-2xl text-slate-300">
                Discover selected upcoming activities from Pharmacia Club DIU.
              </p>

            </div>

            <Link
              href="/events"
              className="font-semibold text-cyan-300 hover:text-cyan-200"
            >
              View all events →
            </Link>

          </div>

          {loadingEvents && (
            <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">

              <p className="text-slate-300">
                Loading featured events...
              </p>

            </div>
          )}

          {!loadingEvents && highlightedEvents.length === 0 && (
            <div className="mt-12 rounded-2xl border border-white/10 bg-white/5 p-10 text-center">

              <h3 className="text-xl font-semibold">
                No upcoming events
              </h3>

              <p className="mt-2 text-slate-400">
                Please visit the Events page to explore previous activities.
              </p>

              <Link
                href="/events"
                className="mt-5 inline-block font-semibold text-cyan-300"
              >
                View Events →
              </Link>

            </div>
          )}

          {!loadingEvents && highlightedEvents.length > 0 && (

            <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {highlightedEvents.map((event) => (

                <article
                  key={event.id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur transition hover:-translate-y-1 hover:bg-white/10"
                >

                  {event.image_url ? (

                    <img
                      src={event.image_url}
                      alt={event.title}
                      className="h-52 w-full object-cover"
                    />

                  ) : (

                    <div className="flex h-52 w-full items-center justify-center bg-gradient-to-br from-blue-800 to-blue-500 text-white dark:from-[#12383c] dark:to-[#164e63]">

                      <span className="text-lg font-semibold">
                        Pharmacia Club DIU
                      </span>

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

                    <h3 className="mt-4 text-2xl font-bold">
                      {event.title}
                    </h3>

                    {event.description && (

                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-300">
                        {event.description}
                      </p>

                    )}

                    {event.event_date && (

                      <p className="mt-5 text-sm font-semibold text-white">
                        Date: {formatDate(event.event_date)}
                      </p>

                    )}

                    {(event.start_time || event.end_time) && (

                      <p className="mt-2 text-sm text-slate-400">
                        Time: {formatTime(event.start_time)}

                        {event.end_time &&
                          ` - ${formatTime(event.end_time)}`}
                      </p>

                    )}

                    {event.venue && (

                      <p className="mt-2 text-sm text-slate-400">
                        Venue: {event.venue}
                      </p>

                    )}

                    <Link
                      href={`/events/${event.id}`}
                      className="mt-6 inline-block font-semibold text-cyan-300 transition hover:text-cyan-200"
                    >
                      View details →
                    </Link>

                  </div>

                </article>

              ))}

            </div>

          )}

        </div>

      </section>

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

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

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