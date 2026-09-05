"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "jobair2311091015@diu.edu.bd";

export default function AdminDashboardPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // No logged-in user
      if (!user) {
        router.replace("/admin");
        return;
      }

      const userEmail = user.email?.trim().toLowerCase();

      // Logged in, but NOT the admin
      if (userEmail !== ADMIN_EMAIL.toLowerCase()) {
        await supabase.auth.signOut();
        router.replace("/admin");
        return;
      }

      // Correct admin
      setEmail(user.email || ADMIN_EMAIL);
      setLoading(false);
    } catch (error) {
      console.error("Admin authentication error:", error);

      await supabase.auth.signOut();
      router.replace("/admin");
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin");
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-black" />

          <p className="text-sm text-gray-600">
            Checking admin access...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Admin Dashboard
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Welcome, {email}
            </p>
          </div>

          <button
            onClick={handleLogout}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Dashboard */}
      <section className="mx-auto max-w-7xl px-6 py-8">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Admin Access Granted
          </h2>

          <p className="mt-2 text-gray-600">
            You are successfully authenticated as the administrator.
          </p>

          <div className="mt-6 rounded-lg bg-gray-50 p-4">
            <p className="text-sm text-gray-500">
              Admin email
            </p>

            <p className="mt-1 font-medium text-gray-900">
              {email}
            </p>
          </div>
        </div>

        {/* Put your existing dashboard sections/cards here */}
        <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">
              Alumni
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Manage alumni accounts and profiles.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">
              Students
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Manage student accounts and profiles.
            </p>
          </div>

          <div className="rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900">
              Resources
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              Manage academic resources.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
