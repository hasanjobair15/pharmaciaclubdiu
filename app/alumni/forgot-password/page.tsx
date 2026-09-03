"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = useMemo(() => createClient(), []);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      setLoading(false);
      return;
    }

    try {
      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/alumni/reset-password`,
          }
        );

      if (error) {
        throw error;
      }

      setMessage(
        "If an account exists with this email address, a password reset link has been sent. Please check your email."
      );
    } catch (error) {
      console.error(
        "Password reset error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to send the password reset email. Please try again."
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
            Reset Password
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Enter your alumni account email address and
            we will send you a password reset link.
          </p>

        </div>
      </section>

      {/* RESET CARD */}
      <section className="mx-auto max-w-md px-6 py-12">

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">

          {/* ICON */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl dark:bg-slate-800">
            🔐
          </div>

          <h2 className="mt-6 text-center text-xl font-bold text-[#0b1736] dark:text-white">
            Forgot Your Password?
          </h2>

          <p className="mt-2 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
            Enter the email address associated with
            your alumni account.
          </p>

          {/* FORM */}
          <form
            onSubmit={handleReset}
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
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="your@email.com"
                autoComplete="email"
                required
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />

            </div>

            {/* SUCCESS MESSAGE */}
            {message && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                {message}
              </div>
            )}

            {/* ERROR MESSAGE */}
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            {/* SEND BUTTON */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Sending..."
                : "Send Reset Link"}
            </button>

          </form>

          {/* BACK TO LOGIN */}
          <div className="mt-7 border-t border-slate-200 pt-6 text-center dark:border-slate-800">

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Remember your password?
            </p>

            <Link
              href="/alumni/login"
              className="mt-2 inline-block text-sm font-bold text-[#087f8c] hover:underline"
            >
              ← Back to Alumni Login
            </Link>

          </div>

          {/* DIRECTORY */}
          <div className="mt-5 text-center">

            <Link
              href="/alumni"
              className="text-sm font-semibold text-slate-500 transition hover:text-[#087f8c]"
            >
              Back to Alumni Directory
            </Link>

          </div>

        </div>

      </section>

    </main>
  );
}