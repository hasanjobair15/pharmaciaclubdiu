"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AlumniLoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      setLoading(false);
      return;
    }

    if (!password) {
      setErrorMessage("Please enter your password.");
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        throw error;
      }

      router.push("/alumni/profile");
      router.refresh();
    } catch (error) {
      console.error("Alumni login error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to log in. Please check your email and password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a]">

      {/* HEADER */}
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0a0f1a]">
        <div className="mx-auto max-w-3xl px-6 py-14 text-center">

          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
            Pharmacia Club DIU
          </p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#0b1736] dark:text-white sm:text-5xl">
            Alumni Login
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Sign in to manage your alumni profile and keep your information
            up to date.
          </p>

        </div>
      </section>

      {/* LOGIN SECTION */}
      <section className="mx-auto max-w-md px-6 py-12">

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">

          {/* ICON */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl dark:bg-slate-800">
            🎓
          </div>

          <h2 className="mt-6 text-center text-xl font-bold text-[#0b1736] dark:text-white">
            Welcome Back
          </h2>

          <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
            Log in to your alumni account.
          </p>

          {/* LOGIN FORM */}
          <form
            onSubmit={handleLogin}
            className="mt-8 space-y-5"
          >

            {/* EMAIL */}
            <div>

              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
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
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

            </div>

            {/* PASSWORD */}
            <div>

              <div className="mb-2 flex items-center justify-between">

                <label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Password
                </label>

                {/* FORGOT PASSWORD */}
                <Link
                  href="/alumni/forgot-password"
                  className="text-sm font-semibold text-[#087f8c] transition hover:underline"
                >
                  Forgot Password?
                </Link>

              </div>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

            </div>

            {/* ERROR MESSAGE */}
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            {/* LOGIN BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Alumni Login"}
            </button>

          </form>

          {/* CREATE ACCOUNT */}
          <div className="mt-7 border-t border-slate-200 pt-6 text-center dark:border-slate-800">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Don&apos;t have an alumni account?
            </p>

            <Link
              href="/alumni/create-account"
              className="mt-2 inline-block text-sm font-bold text-[#087f8c] hover:underline"
            >
              Create Alumni Account
            </Link>

          </div>

          {/* BACK TO DIRECTORY */}
          <div className="mt-5 text-center">

            <Link
              href="/alumni"
              className="text-sm font-semibold text-slate-500 transition hover:text-[#087f8c]"
            >
              ← Back to Alumni Directory
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}