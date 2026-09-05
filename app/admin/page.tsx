"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "diupc@diu.edu.bd";

export default function AdminLoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setLoading(true);
    setError("");

    const cleanEmail = email.trim().toLowerCase();

    /*
     * IMPORTANT:
     * Only the configured administrator email
     * is allowed to use the admin login.
     */
    if (
      cleanEmail !== ADMIN_EMAIL.toLowerCase()
    ) {
      setError(
        "This account is not authorized to access the Admin Dashboard."
      );
      setLoading(false);
      return;
    }

    const {
      error: loginError,
    } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (loginError) {
      setError(loginError.message);
      setLoading(false);
      return;
    }

    router.replace("/admin/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7faff] px-6">
      <div className="w-full max-w-md">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#087f8c] text-2xl font-black text-white">
              P
            </div>

            <h1 className="text-3xl font-black text-[#0b1736]">
              Admin Login
            </h1>

            <p className="mt-2 text-sm text-slate-500">
              Pharmacia Club DIU
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >
            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0b1736]">
                Admin Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter admin email"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-[#0b1736]">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter admin password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20"
              />
            </div>

            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-[#087f8c] px-4 py-3 font-bold text-white transition hover:bg-[#066b76] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Checking..."
                : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-400">
            Authorized administrators only
          </p>
        </div>
      </div>
    </main>
  );
}
