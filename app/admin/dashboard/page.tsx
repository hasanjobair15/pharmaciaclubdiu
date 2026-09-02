"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin");
  }

  return (
    <main className="min-h-screen bg-[#f7faff] text-[#0b1736]">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#087f8c]">
              Pharmacia Club DIU
            </p>

            <h1 className="mt-1 text-2xl font-black">
              Admin Dashboard
            </h1>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold transition hover:border-red-400 hover:text-red-500"
          >
            Logout
          </button>
        </div>
      </header>

      {/* DASHBOARD */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
            Website Management
          </p>

          <h2 className="mt-3 text-4xl font-black">
            Welcome to Admin Panel
          </h2>

          <p className="mt-4 max-w-2xl text-slate-500">
            Manage your Pharmacia Club DIU website content from one place.
          </p>
        </div>

        {/* MANAGEMENT CARDS */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <AdminCard
            title="Committee"
            description="Manage committee members, positions, batches, photos and bios."
            icon="👥"
            onClick={() => router.push("/admin/committee")}
          />

          <AdminCard
            title="Events"
            description="Add and manage upcoming and previous club events."
            icon="📅"
          />

          <AdminCard
            title="News"
            description="Publish and manage club news and announcements."
            icon="📰"
          />

          <AdminCard
            title="Research"
            description="Manage research projects and research-related content."
            icon="🔬"
          />

          <AdminCard
            title="Publications"
            description="Manage papers, magazines, reports and publications."
            icon="📚"
          />

          <AdminCard
            title="Gallery"
            description="Manage photos, albums and event galleries."
            icon="🖼️"
          />
        </div>
      </section>
    </main>
  );
}

function AdminCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className="group rounded-3xl border border-slate-200 bg-white p-7 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl disabled:cursor-default disabled:hover:translate-y-0 disabled:hover:shadow-sm"
    >
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#e8f8f9] text-2xl">
        {icon}
      </div>

      <h3 className="text-xl font-black">{title}</h3>

      <p className="mt-3 text-sm leading-6 text-slate-500">
        {description}
      </p>

      {onClick && (
        <p className="mt-5 text-sm font-bold text-[#087f8c]">
          Manage →
        </p>
      )}
    </button>
  );
}