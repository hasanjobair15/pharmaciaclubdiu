"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function StudentLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    checkExistingSession();
  }, []);

  async function checkExistingSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.user) {
      router.replace("/students/profile");
      return;
    }

    setCheckingSession(false);
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

    if (loginError) {
      console.error("Student login error:", loginError);

      if (
        loginError.message.toLowerCase().includes("invalid login")
      ) {
        setError("Incorrect email or password.");
      } else {
        setError(loginError.message);
      }

      setLoading(false);
      return;
    }

    router.replace("/students/profile");
    router.refresh();
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-green-600" />
          <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
            Checking login...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 text-3xl shadow-lg">
            🎓
          </div>

          <h1 className="mt-5 text-3xl font-bold text-gray-900 dark:text-white">
            Student Login
          </h1>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Sign in to manage your Pharmacia Club DIU student profile.
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900 sm:p-8">
          {error && (
            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Email Address
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-green-500 focus:ring-2 focus:ring-green-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-green-600 px-5 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="h-px flex-1 bg-gray-200 dark:bg-gray-800" />
          </div>

          <Link
            href="/students/create-account"
            className="block w-full rounded-xl border border-gray-300 px-5 py-3.5 text-center text-sm font-semibold text-gray-800 transition hover:bg-gray-100 dark:border-gray-700 dark:text-white dark:hover:bg-gray-800"
          >
            Create Student Account
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/students"
            className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400"
          >
            ← Back to Students
          </Link>
        </div>
      </div>
    </main>
  );
}
