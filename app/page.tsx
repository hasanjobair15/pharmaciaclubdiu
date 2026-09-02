const events = [
  {
    date: "02–03",
    month: "OCT",
    title: "DIU Pharma Fest 2026",
    category: "Featured Event",
    description:
      "Connect, compete, create and celebrate with the pharmacy community.",
  },
  {
    date: "—",
    month: "2026",
    title: "Academic & Research Seminar",
    category: "Academic",
    description:
      "Explore emerging ideas, research practices and professional development.",
  },
  {
    date: "—",
    month: "2026",
    title: "Pharmacia Community Activity",
    category: "Community",
    description:
      "Building collaboration, leadership and meaningful student engagement.",
  },
];

const areas = [
  {
    number: "01",
    title: "Academic Development",
    text: "Learning resources, academic support and opportunities to grow beyond the classroom.",
  },
  {
    number: "02",
    title: "Research",
    text: "Encouraging students to explore scientific research and develop research skills.",
  },
  {
    number: "03",
    title: "Leadership",
    text: "Creating opportunities to develop leadership, communication and teamwork.",
  },
  {
    number: "04",
    title: "Professional Development",
    text: "Connecting pharmacy students with knowledge, professionals and career opportunities.",
  },
  {
    number: "05",
    title: "Creativity",
    text: "A platform for writing, photography, cultural activities and student creativity.",
  },
  {
    number: "06",
    title: "Community Service",
    text: "Promoting social responsibility through meaningful community-focused activities.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7faff] text-[#0b1736] dark:bg-[#0a0f1a] dark:text-slate-100">

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl dark:bg-cyan-900/20" />
        <div className="absolute -left-32 bottom-0 h-96 w-96 rounded-full bg-blue-200/30 blur-3xl dark:bg-blue-900/20" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-16 px-6 py-24 lg:grid-cols-2 lg:px-8 lg:py-32">
          <div>
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#087f8c] shadow-sm dark:border-cyan-800 dark:bg-[#111827] dark:text-cyan-300">
              Department of Pharmacy · DIU
            </div>

            <h1 className="max-w-3xl text-5xl font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
              Pharmacia
              <span className="block text-[#087f8c] dark:text-cyan-400">
                Club DIU
              </span>
            </h1>

            <p className="mt-7 text-2xl font-semibold text-slate-700 dark:text-slate-200">
              Connect. Learn. Research. Lead.
            </p>

            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-400">
              A vibrant academic and professional community empowering
              pharmacy students through learning, research, creativity,
              leadership and meaningful collaboration.
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <a
                href="#events"
                className="rounded-full bg-[#0b1736] px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-slate-300 transition hover:-translate-y-0.5 hover:bg-[#087f8c] dark:bg-cyan-600 dark:shadow-none dark:hover:bg-cyan-500"
              >
                Explore Events →
              </a>

              <a
                href="#about"
                className="rounded-full border border-slate-300 bg-white px-7 py-3.5 text-sm font-bold text-[#0b1736] transition hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-100 dark:hover:border-cyan-400 dark:hover:text-cyan-400"
              >
                Discover Our Club
              </a>
            </div>
          </div>

          {/* SCIENCE VISUAL */}
          <div className="relative mx-auto flex aspect-square w-full max-w-lg items-center justify-center">
            <div className="absolute inset-8 rotate-12 rounded-[35%] border border-cyan-300/60 dark:border-cyan-700/40" />
            <div className="absolute inset-16 -rotate-12 rounded-[30%] border border-blue-300/50 dark:border-blue-700/40" />

            <div className="relative flex h-64 w-64 items-center justify-center rounded-full bg-gradient-to-br from-[#0b1736] to-[#087f8c] shadow-2xl dark:from-[#102044] dark:to-[#087f8c]">
              <div className="absolute h-48 w-48 rounded-full border border-white/20" />
              <div className="absolute h-32 w-32 rounded-full border border-white/20" />

              <div className="text-center text-white">
                <div className="text-6xl font-black">Rx</div>
                <div className="mt-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">
                  Pharmacy
                </div>
              </div>
            </div>

            {[
              ["top-8 left-10", "DNA"],
              ["top-20 right-2", "AI"],
              ["bottom-20 left-0", "R"],
              ["bottom-8 right-12", "⚕"],
            ].map(([position, label]) => (
              <div
                key={label}
                className={`absolute ${position} flex h-14 w-14 items-center justify-center rounded-2xl border border-white bg-white text-xs font-bold text-[#087f8c] shadow-xl dark:border-slate-700 dark:bg-[#111827] dark:text-cyan-400`}
              >
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="border-y border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0d1422]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-slate-200 lg:grid-cols-4 dark:divide-slate-800">
          {[
            ["30+", "Student Community"],
            ["20+", "Academic Initiatives"],
            ["15+", "Events & Activities"],
            ["∞", "Ideas & Possibilities"],
          ].map(([number, label]) => (
            <div key={label} className="px-6 py-9 text-center">
              <div className="text-3xl font-black text-[#0b1736] dark:text-white">
                {number}
              </div>
              <div className="mt-1 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ABOUT */}
      <section
        id="about"
        className="mx-auto max-w-7xl px-6 py-24 lg:px-8"
      >
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c] dark:text-cyan-400">
              About us
            </p>

            <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
              More than a club.
              <span className="block text-slate-400 dark:text-slate-500">
                A pharmacy community.
              </span>
            </h2>
          </div>

          <div>
            <p className="text-lg leading-8 text-slate-600 dark:text-slate-400">
              Pharmacia Club DIU is a student-centered platform of the
              Department of Pharmacy at Daffodil International University.
              We bring students together through academic activities,
              research, professional development, creativity, leadership and
              community engagement.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {[
                ["Vision", "Building future-ready pharmacy professionals."],
                ["Mission", "Learn, collaborate, innovate and serve."],
                ["Values", "Integrity, excellence, teamwork and impact."],
              ].map(([title, text]) => (
                <div
                  key={title}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-[#111827]"
                >
                  <h3 className="font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* EVENTS */}
      <section
        id="events"
        className="bg-[#0b1736] py-24 text-white dark:bg-[#050a13]"
      >
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
                What's happening
              </p>

              <h2 className="mt-3 text-4xl font-black sm:text-5xl">
                Upcoming Events
              </h2>
            </div>

            <a
              href="#"
              className="text-sm font-bold text-cyan-300 hover:text-white"
            >
              View all events →
            </a>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {events.map((event) => (
              <article
                key={event.title}
                className="group rounded-3xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur transition hover:-translate-y-1 hover:bg-white/[0.1]"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-4xl font-black">{event.date}</p>

                    <p className="text-xs font-bold tracking-widest text-cyan-300">
                      {event.month}
                    </p>
                  </div>

                  <span className="rounded-full bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-200">
                    {event.category}
                  </span>
                </div>

                <h3 className="mt-12 text-xl font-bold">
                  {event.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {event.description}
                </p>

                <button className="mt-7 text-sm font-bold text-cyan-300 transition group-hover:text-white">
                  View details →
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* AREAS */}
      <section
        id="research"
        className="mx-auto max-w-7xl px-6 py-24 lg:px-8"
      >
        <div className="max-w-2xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c] dark:text-cyan-400">
            What we do
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Learn. Explore. Create. Lead.
          </h2>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-3xl border border-slate-200 bg-slate-200 md:grid-cols-2 lg:grid-cols-3 dark:border-slate-700 dark:bg-slate-700">
          {areas.map((area) => (
            <div
              key={area.number}
              className="bg-white p-8 transition hover:bg-[#f1fbfc] dark:bg-[#111827] dark:hover:bg-[#172334]"
            >
              <div className="text-sm font-bold text-[#087f8c] dark:text-cyan-400">
                {area.number}
              </div>

              <h3 className="mt-8 text-xl font-bold">
                {area.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {area.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* RESEARCH / PUBLICATION */}
      <section className="bg-[#eef7f8] py-24 dark:bg-[#0d1824]">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-3xl bg-[#087f8c] p-10 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-100">
              Research Hub
            </p>

            <h2 className="mt-5 text-4xl font-black">
              Turn curiosity into research.
            </h2>

            <p className="mt-5 leading-7 text-cyan-50">
              Discover research opportunities, explore scientific ideas,
              share student research and build the skills needed for the
              future of pharmacy.
            </p>

            <button className="mt-8 rounded-full bg-white px-6 py-3 text-sm font-bold text-[#087f8c]">
              Explore Research →
            </button>
          </div>

          <div className="rounded-3xl border border-transparent bg-white p-10 shadow-sm dark:border-slate-700 dark:bg-[#111827]">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c] dark:text-cyan-400">
              Publications
            </p>

            <h2 className="mt-5 text-4xl font-black">
              Your ideas deserve a platform.
            </h2>

            <p className="mt-5 leading-7 text-slate-600 dark:text-slate-400">
              Explore magazines, articles, creative writing, photography and
              research contributions from the Pharmacia community.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {["Magazine", "Research", "Articles", "Creative Writing"].map(
                (item) => (
                  <span
                    key={item}
                    className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                  >
                    {item}
                  </span>
                ),
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-[#0b1736] px-8 py-16 text-center text-white shadow-2xl dark:bg-[#050a13] sm:px-16">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            Join the community
          </p>

          <h2 className="mx-auto mt-5 max-w-3xl text-4xl font-black sm:text-5xl">
            Your pharmacy journey is bigger when we build it together.
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-slate-300">
            Learn, participate, research, create and make an impact with
            Pharmacia Club DIU.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <button className="rounded-full bg-cyan-300 px-7 py-3.5 text-sm font-bold text-[#0b1736]">
              Get Involved
            </button>

            <button className="rounded-full border border-white/20 px-7 py-3.5 text-sm font-bold">
              Contact Us
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}