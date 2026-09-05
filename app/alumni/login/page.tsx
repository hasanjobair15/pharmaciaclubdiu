"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AlumniLoginPage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [resending, setResending] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  async function resolveAccountAndRedirect(accessToken: string) {
    const response = await fetch("/api/auth/account-type", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data?.error || "Unable to determine your account type."
      );
    }

    router.replace(data.redirect_to);
  }

  useEffect(() => {
    async function handleInitialSession() {
      const params = new URLSearchParams(window.location.search);
      const confirmed = params.get("confirmed") === "1";

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.access_token) {
          setSessionReady(true);

          try {
            await resolveAccountAndRedirect(session.access_token);
            return;
          } catch (error) {
            console.error("Account resolver error:", error);
          }

          setInfoMessage(
            "Your email has been confirmed and you are signed in."
          );
        } else if (confirmed) {
          setInfoMessage(
            "Your email has been confirmed! You can now log in with your email and password."
          );
        }
      } catch (error) {
        console.error("Session check error:", error);
      } finally {
        setCheckingSession(false);
      }

      if (
        confirmed ||
        window.location.hash.includes("access_token")
      ) {
        params.delete("confirmed");

        const query = params.toString();

        window.history.replaceState(
          {},
          document.title,
          `${window.location.pathname}${
            query ? `?${query}` : ""
          }`
        );
      }
    }

    handleInitialSession();
  }, []);

  async function handleResendConfirmation() {
    if (!email.trim() || resending) return;

    setResending(true);
    setErrorMessage("");
    setInfoMessage("");

    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/alumni/login?confirmed=1`,
        },
      });

      if (error) {
        if (
          /too many requests|rate limit|over_request/i.test(
            error.message || ""
          )
        ) {
          setErrorMessage(
            "Too many emails were sent. Please wait a minute and try again."
          );
        } else {
          throw error;
        }
      } else {
        setInfoMessage(
          `Confirmation email sent again to ${email.trim()}. Check your inbox and spam folder.`
        );
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Could not resend the confirmation email. Please try again."
      );
    } finally {
      setResending(false);
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setLoading(true);
    setErrorMessage("");
    setInfoMessage("");
    setShowResend(false);

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
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        throw error;
      }

      if (!data.session?.access_token) {
        throw new Error(
          "Login succeeded, but no session was created."
        );
      }

      /*
       * IMPORTANT:
       * Do not automatically send the user to /alumni/profile.
       *
       * The account resolver decides whether this account is:
       *
       * Student  -> /students/profile
       * Alumni   -> /alumni/profile
       *
       * This means an account can use either login page.
       */
      await resolveAccountAndRedirect(
        data.session.access_token
      );
    } catch (error) {
      console.error("Alumni login error:", error);

      const raw =
        error instanceof Error ? error.message : "";

      if (/email not confirmed/i.test(raw)) {
        setErrorMessage(
          "Your email is not confirmed yet. Check your inbox for the confirmation link — or resend it below."
        );

        setShowResend(true);
      } else {
        setErrorMessage(
          raw ||
            "Unable to log in. Please check your email and password."
        );
      }

      setLoading(false);
    }
  }

  if (checkingSession) {
    return (
      <main className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a]">
        <section className="flex min-h-screen items-center justify-center px-6">
          <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
            Checking your account...
          </p>
        </section>
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
            Alumni Login
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Sign in with your Pharmacia Club account.
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
            Log in to your Pharmacia Club account.
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

            {/* INFO MESSAGE */}
            {infoMessage && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                {infoMessage}
              </div>
            )}

            {/* ERROR MESSAGE */}
            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            {/* RESEND CONFIRMATION */}
            {showResend && errorMessage && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resending}
                className="w-full rounded-full border border-[#087f8c] px-6 py-3 text-sm font-bold text-[#087f8c] transition hover:bg-[#087f8c] hover:text-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-[#2dd4bf] dark:text-[#2dd4bf] dark:hover:bg-[#2dd4bf] dark:hover:text-[#062a2d]"
              >
                {resending
                  ? "Sending..."
                  : "Resend Confirmation Email"}
              </button>
            )}

            {/* EXISTING SESSION */}
            {sessionReady && (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const {
                      data: { session },
                    } = await supabase.auth.getSession();

                    if (session?.access_token) {
                      await resolveAccountAndRedirect(
                        session.access_token
                      );
                    }
                  } catch (error) {
                    console.error(error);

                    setErrorMessage(
                      error instanceof Error
                        ? error.message
                        : "Unable to determine your account."
                    );
                  }
                }}
                className="w-full rounded-full bg-[#087f8c] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#0b1736]"
              >
                Continue to My Profile →
              </button>
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
