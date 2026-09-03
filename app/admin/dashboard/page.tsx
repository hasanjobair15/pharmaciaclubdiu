"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const dashboardItems = [
  {
    title: "Home",
    description: "Manage the public homepage content.",
    href: "/admin/home",
    icon: "⌂",
  },
  {
    title: "About",
    description: "Manage club and department information.",
    href: "/admin/about",
    icon: "ℹ",
  },
  {
    title: "Committee",
    description: "Manage executive committee members.",
    href: "/admin/committee",
    icon: "👥",
  },
  {
    title: "Events",
    description: "Create and manage club events.",
    href: "/admin/events",
    icon: "📅",
  },
  {
    title: "Academic",
    description: "Manage academic resources and information.",
    href: "/admin/academic",
    icon: "🎓",
  },
  {
    title: "Routine",
    description: "Open the pharmacy routine system.",
    href: "https://pharmroutine-diu.vercel.app/",
    icon: "🗓️",
    external: true,
  },
  {
    title: "Research",
    description: "Manage research activities and publications.",
    href: "/admin/research",
    icon: "🔬",
  },
  {
    title: "Magazine",
    description: "Manage magazine issues, pages and submissions.",
    href: "/admin/magazine",
    icon: "📖",
  },
  {
    title: "Gallery",
    description: "Manage club photos and gallery content.",
    href: "/admin/gallery",
    icon: "🖼️",
  },
  {
    title: "News",
    description: "Create and manage club news.",
    href: "/admin/news",
    icon: "📰",
  },
  {
    title: "Alumni Association",
    description: "Manage Alumni Association executive committee members.",
    href: "/admin/alumni-association",
    icon: "🏛️",
  },
  {
    title: "Contact",
    description: "View and manage messages submitted through Contact.",
    href: "/admin/contact",
    icon: "✉️",
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/admin");
        return;
      }

      setEmail(user.email || "");
      setLoading(false);
    }

    checkUser();
  }, [router, supabase]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin");
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#070b14]">
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
          Loading dashboard...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#070b14]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0b1120]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#087f8c]">
              Pharmacia Club DIU
            </p>

            <h1 className="mt-1 text-2xl font-bold tracking-tight text-[#0b1736] dark:text-white sm:text-3xl">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Manage your club website and content.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-xs text-slate-400 dark:text-slate-500">
                Signed in as
              </p>

              <p className="max-w-[220px] truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                {email}
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-400"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Dashboard */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <h2 className="text-lg font-bold text-[#0b1736] dark:text-white">
            Website Management
          </h2>

          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Select a section to manage its content.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dashboardItems.map((item) => {
            const cardClassName =
              "group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-[#087f8c]/40 hover:shadow-lg dark:border-slate-800 dark:bg-[#0b1120] dark:hover:border-[#087f8c]/50";

            const content = (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-2xl transition-colors group-hover:bg-[#087f8c]/10 dark:bg-slate-800 dark:group-hover:bg-[#087f8c]/15">
                    {item.icon}
                  </div>

                  <span className="text-lg text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-[#087f8c] dark:text-slate-600">
                    →
                  </span>
                </div>

                <h3 className="mt-5 text-base font-bold text-[#0b1736] transition-colors group-hover:text-[#087f8c] dark:text-white dark:group-hover:text-[#087f8c]">
                  {item.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                  {item.description}
                </p>
              </>
            );

            if (item.external) {
              return (
                <a
                  key={item.href}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cardClassName}
                >
                  {content}
                </a>
              );
            }

            return (
              <a key={item.href} href={item.href} className={cardClassName}>
                {content}
              </a>
            );
          })}
        </div>

        {/* Quick information */}
        <div className="mt-8 rounded-2xl border border-[#087f8c]/20 bg-[#087f8c]/5 p-5 dark:border-[#087f8c]/20 dark:bg-[#087f8c]/10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-[#0b1736] dark:text-white">
                Alumni Association
              </h3>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Manage the official Alumni Association leadership and
                executive committee members from the dedicated admin panel.
              </p>
            </div>

            <a
              href="/admin/alumni-association"
              className="inline-flex shrink-0 items-center justify-center rounded-lg bg-[#087f8c] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#066d78]"
            >
              Manage Alumni Association
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}