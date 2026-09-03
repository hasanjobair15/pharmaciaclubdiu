export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#f7faff] text-[#0b1736] transition-colors dark:bg-[#0a0f1a] dark:text-slate-100">
      {/* HERO */}
      <section className="bg-[#0b1736] px-6 py-24 text-white dark:bg-[#111827]">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            About Pharmacia Club DIU
          </p>

          <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight sm:text-6xl">
            Building the future of pharmacy, together.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Pharmacia Club DIU is a student-centered platform of the
            Department of Pharmacy at Daffodil International University.
          </p>
        </div>
      </section>

      {/* ABOUT */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c] dark:text-[#2dd4bf]">
              Who we are
            </p>

            <h2 className="mt-4 text-4xl font-black text-[#0b1736] dark:text-white">
              A community for future pharmacists.
            </h2>
          </div>

          <div className="text-lg leading-8 text-slate-600 dark:text-slate-300">
            <p>
              Pharmacia Club DIU brings together students with a shared
              interest in pharmacy, academic development, research,
              leadership, creativity and community engagement.
            </p>

            <p className="mt-5">
              Through academic activities, seminars, competitions,
              publications, research initiatives and community programs,
              the club aims to create meaningful opportunities for students
              to learn and grow.
            </p>
          </div>
        </div>
      </section>

      {/* VISION MISSION VALUES */}
      <section className="bg-white py-20 transition-colors dark:bg-[#0f172a]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-8 transition-colors dark:border-slate-700 dark:bg-[#111827]">
              <span className="text-sm font-bold text-[#087f8c] dark:text-[#2dd4bf]">
                01 · VISION
              </span>

              <h3 className="mt-5 text-2xl font-black text-[#0b1736] dark:text-white">
                Future-ready pharmacists
              </h3>

              <p className="mt-4 leading-7 text-slate-500 dark:text-slate-400">
                To foster a community where pharmacy students can develop
                knowledge, skills, leadership and professional confidence.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 transition-colors dark:border-slate-700 dark:bg-[#111827]">
              <span className="text-sm font-bold text-[#087f8c] dark:text-[#2dd4bf]">
                02 · MISSION
              </span>

              <h3 className="mt-5 text-2xl font-black text-[#0b1736] dark:text-white">
                Learn, collaborate & innovate
              </h3>

              <p className="mt-4 leading-7 text-slate-500 dark:text-slate-400">
                To provide opportunities for academic learning, research,
                professional development, creativity and collaboration.
              </p>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-8 transition-colors dark:border-slate-700 dark:bg-[#111827]">
              <span className="text-sm font-bold text-[#087f8c] dark:text-[#2dd4bf]">
                03 · VALUES
              </span>

              <h3 className="mt-5 text-2xl font-black text-[#0b1736] dark:text-white">
                Integrity & excellence
              </h3>

              <p className="mt-4 leading-7 text-slate-500 dark:text-slate-400">
                We value integrity, teamwork, curiosity, excellence,
                inclusivity and meaningful impact.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ACTIVITIES */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c] dark:text-[#2dd4bf]">
          Our activities
        </p>

        <h2 className="mt-4 text-4xl font-black text-[#0b1736] dark:text-white">
          Learn beyond the classroom.
        </h2>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[
            "Academic Development",
            "Research & Innovation",
            "Seminars & Workshops",
            "Professional Development",
            "Cultural & Creative Activities",
            "Community Service",
          ].map((activity) => (
            <div
              key={activity}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-cyan-200 dark:border-slate-700 dark:bg-[#111827] dark:shadow-none dark:hover:border-cyan-700"
            >
              <h3 className="font-bold text-[#0b1736] dark:text-white">
                {activity}
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Opportunities for students to participate, learn and
                contribute.
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-7xl rounded-3xl bg-[#087f8c] px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-black sm:text-4xl">
            Be part of the Pharmacia community.
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-cyan-50">
            Connect with fellow pharmacy students, explore opportunities and
            make your university journey more meaningful.
          </p>
        </div>
      </section>
    </main>
  );
}