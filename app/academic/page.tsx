const resources = [
  {
    icon: "📚",
    title: "Study Materials",
    description:
      "Lecture notes, presentations, practical resources and other academic materials.",
  },
  {
    icon: "📝",
    title: "Question Bank",
    description:
      "Organized questions to help students prepare for quizzes, exams and assessments.",
  },
  {
    icon: "🧪",
    title: "Practical Resources",
    description:
      "Laboratory guides, experiment resources and practical learning materials.",
  },
  {
    icon: "📅",
    title: "Academic Calendar",
    description:
      "Important academic dates, examinations, activities and announcements.",
  },
  {
    icon: "🎯",
    title: "Exam Preparation",
    description:
      "Study strategies, preparation resources and useful academic guidance.",
  },
  {
    icon: "💡",
    title: "Learning Resources",
    description:
      "Useful books, websites, databases and digital tools for pharmacy students.",
  },
];

export default function AcademicPage() {
  return (
    <main className="min-h-screen bg-[#f7faff] text-[#0b1736]">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#0b1736] px-6 py-24 text-white">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            Academic Hub
          </p>

          <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight sm:text-6xl">
            Learn smarter.
            <span className="block text-cyan-300">Grow stronger.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            A dedicated academic space for Pharmacia Club DIU students to
            discover resources, prepare for assessments and support their
            learning journey.
          </p>
        </div>
      </section>

      {/* QUICK ACCESS */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["📚", "Study Materials"],
            ["📝", "Question Bank"],
            ["🧪", "Practical Resources"],
            ["📅", "Academic Calendar"],
          ].map(([icon, title]) => (
            <button
              key={title}
              className="rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm transition hover:-translate-y-1 hover:border-cyan-200 hover:shadow-lg"
            >
              <div className="text-3xl">{icon}</div>

              <h3 className="mt-5 font-black">{title}</h3>

              <p className="mt-2 text-sm text-slate-500">
                Explore resources →
              </p>
            </button>
          ))}
        </div>
      </section>

      {/* RESOURCES */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
            Academic resources
          </p>

          <h2 className="mt-3 text-4xl font-black">
            Everything in one place.
          </h2>

          <p className="mt-4 max-w-2xl text-slate-500">
            We're building a centralized academic resource platform for
            pharmacy students.
          </p>

          <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {resources.map((resource) => (
              <article
                key={resource.title}
                className="group rounded-3xl border border-slate-200 bg-[#f7faff] p-7 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-2xl shadow-sm">
                  {resource.icon}
                </div>

                <h3 className="mt-7 text-xl font-black">
                  {resource.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-500">
                  {resource.description}
                </p>

                <button className="mt-6 text-sm font-bold text-[#087f8c]">
                  Explore →
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* STUDENT TOOLS */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-3xl bg-[#eef7f8] p-9">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
              For students
            </p>

            <h2 className="mt-4 text-3xl font-black">
              Your academic toolkit.
            </h2>

            <div className="mt-7 space-y-3">
              {[
                "Lecture & course resources",
                "Practical experiment guides",
                "Exam preparation materials",
                "Important academic announcements",
                "Useful pharmacy databases",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl bg-white p-4 text-sm font-semibold"
                >
                  <span className="text-[#087f8c]">✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-[#0b1736] p-9 text-white">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
              Coming next
            </p>

            <h2 className="mt-4 text-3xl font-black">
              Personalized Student Portal
            </h2>

            <p className="mt-4 leading-7 text-slate-300">
              In the future, students will be able to access personalized
              academic resources, saved materials, announcements and other
              useful tools from one place.
            </p>

            <div className="mt-7 inline-flex rounded-full border border-white/20 px-5 py-2 text-xs font-semibold text-cyan-200">
              Coming Soon
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-[#087f8c] px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-black sm:text-4xl">
            Have an academic resource to share?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-cyan-50">
            Help build a stronger academic community by contributing useful
            notes, resources and learning materials.
          </p>

          <button className="mt-7 rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#087f8c]">
            Submit a Resource
          </button>
        </div>
      </section>
    </main>
  );
}