"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function checkSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        setErrorMessage(
          "This password reset link is invalid or has expired. Please request a new reset link."
        );
      }

      setCheckingSession(false);
    }

    checkSession();
  }, [supabase]);

  async function handleResetPassword(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setSuccess(false);

    if (newPassword.length < 6) {
      setErrorMessage(
        "Your new password must be at least 6 characters long."
      );
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        "The passwords do not match."
      );
      setLoading(false);
      return;
    }

    try {
      const { error } =
        await supabase.auth.updateUser({
          password: newPassword,
        });

      if (error) {
        throw error;
      }

      setSuccess(true);

      setNewPassword("");
      setConfirmPassword("");

    } catch (error) {
      console.error(
        "Password update error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to reset your password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0a0f1a]">
        <div className="text-center">

          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-[#087f8c]" />

          <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
            Checking password reset link...
          </p>

        </div>
      </main>
    );
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
            Set New Password
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Create a new password for your alumni account.
          </p>

        </div>

      </section>

      {/* CARD */}
      <section className="mx-auto max-w-md px-6 py-12">

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">

          {/* ICON */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl dark:bg-slate-800">
            🔐
          </div>

          {!errorMessage && !success && (
            <>
              <h2 className="mt-6 text-center text-xl font-bold text-[#0b1736] dark:text-white">
                Create New Password
              </h2>

              <p className="mt-2 text-center text-sm leading-6 text-slate-500 dark:text-slate-400">
                Enter your new password below.
              </p>

              <form
                onSubmit={handleResetPassword}
                className="mt-8 space-y-5"
              >

                {/* NEW PASSWORD */}
                <div>

                  <label
                    htmlFor="newPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    New Password
                  </label>

                  <input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) =>
                      setNewPassword(e.target.value)
                    }
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Minimum 6 characters.
                  </p>

                </div>

                {/* CONFIRM PASSWORD */}
                <div>

                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Confirm New Password
                  </label>

                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                </div>

                {/* ERROR */}
                {errorMessage && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                    {errorMessage}
                  </div>
                )}

                {/* BUTTON */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? "Updating Password..."
                    : "Update Password"}
                </button>

              </form>
            </>
          )}

          {/* INVALID / EXPIRED LINK */}
          {errorMessage && !success && (
            <div className="mt-6">

              <p className="text-center text-sm leading-6 text-slate-600 dark:text-slate-300">
                Your reset link may have expired. Please
                request a new password reset link.
              </p>

              <Link
                href="/alumni/forgot-password"
                className="mt-6 block w-full rounded-full bg-[#0b1736] px-6 py-3 text-center text-sm font-bold text-white transition hover:bg-[#087f8c]"
              >
                Request New Reset Link
              </Link>

            </div>
          )}

          {/* SUCCESS */}
          {success && (
            <div className="mt-6">

              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-center dark:border-emerald-900/50 dark:bg-emerald-950/30">

                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  Password Updated Successfully!
                </p>

                <p className="mt-2 text-sm leading-6 text-emerald-700 dark:text-emerald-300">
                  Your alumni account password has been
                  changed successfully.
                </p>

              </div>

              <button
                type="button"
                onClick={() => router.push("/alumni/login")}
                className="mt-6 w-full rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c]"
              >
                Go to Alumni Login
              </button>

            </div>
          )}

          {/* BACK */}
          {!success && (
            <div className="mt-7 border-t border-slate-200 pt-6 text-center dark:border-slate-800">

              <Link
                href="/alumni/login"
                className="text-sm font-semibold text-slate-500 transition hover:text-[#087f8c]"
              >
                ← Back to Alumni Login
              </Link>

            </div>
          )}

        </div>

      </section>

    </main>
  );
}