import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default async function HomePage() {
  // Get events from the same Supabase database
  const { data: allEvents } = await supabase
    .from("events")
    .select("*")
    .order("date", { ascending: true });

  // Only show a few highlighted events on Home
  // The full list remains available on /events
  const highlightedEvents = (allEvents || [])
    .filter((event) => event.status === "Upcoming")
    .slice(0, 3);

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
          <div>
            <p className="text-3xl font-bold">30+</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Batches Connected
            </p>
          </div>

          <div>
            <p className="text-3xl font-bold">100+</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Activities
            </p>
          </div>

          <div>
            <p className="text-3xl font-bold">500+</p>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Students
            </p>
          </div>

          <div>
            <p className="text-3xl font-bold">1</p>
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

      {/* ================= HIGHLIGHT EVENTS ================= */}
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
                A selection of upcoming activities from Pharmacia Club DIU.
                Visit the Events page to see the complete schedule.
              </p>
            </div>

            <Link
              href="/events"
              className="font-semibold text-cyan-300 hover:text-cyan-200"
            >
              View all events →
            </Link>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

            {highlightedEvents.length > 0 ? (
              highlightedEvents.map((event) => (
                <article
                  key={event.id}
                  className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur transition hover:-translate-y-1 hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium text-cyan-300">
                        {event.status || "Upcoming"}
                      </p>

                      <h3 className="mt-3 text-2xl font-bold">
                        {event.title}
                      </h3>
                    </div>

                    <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                      Featured
                    </span>
                  </div>

                  <p className="mt-5 text-sm leading-6 text-slate-300">
                    {event.description ||
                      "Join us for this upcoming Pharmacia Club DIU event."}
                  </p>

                  {event.date && (
                    <p className="mt-5 text-sm font-semibold text-white">
                      📅 {event.date}
                    </p>
                  )}

                  {event.venue && (
                    <p className="mt-2 text-sm text-slate-400">
                      📍 {event.venue}
                    </p>
                  )}

                  <Link
                    href={`/events/${event.id}`}
                    className="mt-6 inline-block font-semibold text-cyan-300 transition group-hover:text-cyan-200"
                  >
                    View details →
                  </Link>
                </article>
              ))
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-8 md:col-span-2 lg:col-span-3">
                <h3 className="text-xl font-semibold">
                  More events coming soon
                </h3>

                <p className="mt-2 text-slate-400">
                  Please check the Events page for the latest updates.
                </p>

                <Link
                  href="/events"
                  className="mt-5 inline-block font-semibold text-cyan-300"
                >
                  Go to Events →
                </Link>
              </div>
            )}

          </div>
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
                <h3 className="text-xl font-bold">{area.title}</h3>

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