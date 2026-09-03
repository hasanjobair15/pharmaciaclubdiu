"use client";

const academicCategories = [
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
    <main className="min-h-screen bg-[#f7faff] text-[#0b1736] transition-colors dark:bg-[#0a0f1a] dark:text-slate-100">

      {/* HERO */}
      <section className="relative overflow-hidden bg-[#071633] px-6 py-24 text-white dark:bg-[#111827]">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-cyan-400/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
            Academic Hub
          </p>

          <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight sm:text-6xl">
            Learn smarter.
            <span className="block text-cyan-300">
              Grow stronger.
            </span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Explore academic resources designed to support your learning,
            practical training, examination preparation and professional
            development as a pharmacy student.
          </p>
        </div>
      </section>

      {/* MAIN ACADEMIC CATEGORIES */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">

        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c] dark:text-[#2dd4bf]">
            Academic Resources
          </p>

          <h2 className="mt-3 text-4xl font-black tracking-tight text-[#0b1736] dark:text-white sm:text-5xl">
            Everything you need to learn.
          </h2>

          <p className="mt-5 text-base leading-7 text-slate-500 dark:text-slate-400">
            Choose a category below to explore organized academic resources,
            courses, study materials and other useful learning content.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

          {academicCategories.map((category) => (
            <a
              key={category.title}
              href={`/academic/${encodeURIComponent(category.title)}`}
              className="group rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-xl dark:border-slate-700 dark:bg-[#111827] dark:shadow-none dark:hover:border-cyan-700 dark:hover:shadow-lg"
            >
              {/* ICON */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#eef7f8] text-3xl transition duration-300 group-hover:scale-105 dark:bg-[#12383c]">
                {category.icon}
              </div>

              {/* TITLE */}
              <h3 className="mt-7 text-2xl font-black text-[#0b1736] dark:text-white">
                {category.title}
              </h3>

              {/* DESCRIPTION */}
              <p className="mt-3 text-sm leading-7 text-slate-500 dark:text-slate-400">
                {category.description}
              </p>

              {/* BUTTON */}
              <div className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#087f8c] dark:text-[#2dd4bf]">
                Explore
                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </div>
            </a>
          ))}

        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-20 transition-colors dark:bg-[#0f172a]">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">

          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c] dark:text-[#2dd4bf]">
              Simple & Organized
            </p>

            <h2 className="mt-3 text-4xl font-black text-[#0b1736] dark:text-white">
              Find your resources easily.
            </h2>

            <p className="mx-auto mt-4 max-w-2xl text-slate-500 dark:text-slate-400">
              Academic resources are organized step-by-step so you can quickly
              find exactly what you need.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-4">

            {/* STEP 1 */}
            <div className="rounded-3xl border border-slate-200 bg-[#f7faff] p-7 text-center dark:border-slate-700 dark:bg-[#111827]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#087f8c] text-xl font-black text-white dark:bg-[#2dd4bf] dark:text-[#062a2d]">
                1
              </div>

              <h3 className="mt-5 text-lg font-black text-[#0b1736] dark:text-white">
                Choose Category
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Select study materials, question bank, lab resources or
                another academic category.
              </p>
            </div>

            {/* STEP 2 */}
            <div className="rounded-3xl border border-slate-200 bg-[#f7faff] p-7 text-center dark:border-slate-700 dark:bg-[#111827]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#087f8c] text-xl font-black text-white dark:bg-[#2dd4bf] dark:text-[#062a2d]">
                2
              </div>

              <h3 className="mt-5 text-lg font-black text-[#0b1736] dark:text-white">
                Select Semester
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Choose your semester to see the available courses and
                resources.
              </p>
            </div>

            {/* STEP 3 */}
            <div className="rounded-3xl border border-slate-200 bg-[#f7faff] p-7 text-center dark:border-slate-700 dark:bg-[#111827]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#087f8c] text-xl font-black text-white dark:bg-[#2dd4bf] dark:text-[#062a2d]">
                3
              </div>

              <h3 className="mt-5 text-lg font-black text-[#0b1736] dark:text-white">
                Select Course
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Open a course to find its available chapters, notes,
                presentations and other materials.
              </p>
            </div>

            {/* STEP 4 */}
            <div className="rounded-3xl border border-slate-200 bg-[#f7faff] p-7 text-center dark:border-slate-700 dark:bg-[#111827]">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#087f8c] text-xl font-black text-white dark:bg-[#2dd4bf] dark:text-[#062a2d]">
                4
              </div>

              <h3 className="mt-5 text-lg font-black text-[#0b1736] dark:text-white">
                Access Resources
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                View or access the available PDF, PPTX, DOCX, video and other
                learning resources.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* STUDENT TOOLKIT */}
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">

          <div className="rounded-3xl bg-[#eef7f8] p-9 dark:bg-[#12383c]">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c] dark:text-[#5eead4]">
              For Students
            </p>

            <h2 className="mt-4 text-3xl font-black text-[#0b1736] dark:text-white">
              Your academic toolkit.
            </h2>

            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
              A centralized space for pharmacy students to discover useful
              academic materials and support their studies throughout the
              semester.
            </p>

            <div className="mt-7 space-y-3">

              {[
                "Lecture and course resources",
                "Chapter-wise study materials",
                "Practical experiment guides",
                "Question banks and exam resources",
                "Useful learning resources",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-xl bg-white p-4 text-sm font-semibold text-[#0b1736] dark:bg-[#111827] dark:text-slate-200"
                >
                  <span className="font-black text-[#087f8c] dark:text-[#2dd4bf]">
                    ✓
                  </span>

                  {item}
                </div>
              ))}

            </div>
          </div>

          <div className="rounded-3xl bg-[#0b1736] p-9 text-white dark:bg-[#111827]">

            <p className="text-sm font-bold uppercase tracking-[0.2em] text-cyan-300">
              Pharmacia Club DIU
            </p>

            <h2 className="mt-4 text-3xl font-black">
              Supporting better learning.
            </h2>

            <p className="mt-4 leading-7 text-slate-300">
              Our academic platform is designed to make useful learning
              resources easier to discover, access and share within the
              pharmacy student community.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <span className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-cyan-200">
                Learn
              </span>

              <span className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-cyan-200">
                Practice
              </span>

              <span className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-cyan-200">
                Prepare
              </span>

              <span className="rounded-full border border-white/20 px-4 py-2 text-xs font-semibold text-cyan-200">
                Grow
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl rounded-3xl bg-[#087f8c] px-8 py-14 text-center text-white">

          <h2 className="text-3xl font-black sm:text-4xl">
            Have a useful academic resource?
          </h2>

          <p className="mx-auto mt-4 max-w-2xl leading-7 text-cyan-50">
            Help strengthen the academic community by sharing useful notes,
            study materials and learning resources.
          </p>

          <a
            href="/contact"
            className="mt-7 inline-block rounded-full bg-white px-7 py-3.5 text-sm font-bold text-[#087f8c] transition hover:bg-slate-100"
          >
            Submit a Resource
          </a>

        </div>
      </section>

    </main>
  );
}