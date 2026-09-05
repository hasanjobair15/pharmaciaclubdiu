"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/app/lib/supabase";

export default function StudentLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

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
    async function checkExistingSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        try {
          await resolveAccountAndRedirect(session.access_token);
        } catch (err) {
          console.error(err);
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    }

    checkExistingSession();
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoggingIn(true);

    try {
      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (loginError) {
        throw new Error(loginError.message);
      }

      if (!data.session?.access_token) {
        throw new Error(
          "Login succeeded, but no session was created."
        );
      }

      await resolveAccountAndRedirect(
        data.session.access_token
      );
    } catch (err) {
      console.error("Student login error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to log in. Please try again."
      );

      setLoggingIn(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    if (!email.trim()) {
      setError("Please enter your email address first.");
      return;
    }

    try {
      const { error: resetError } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/students/reset-password`,
          }
        );

      if (resetError) {
        throw resetError;
      }

      setMessage(
        "Password reset instructions have been sent to your email."
      );
    } catch (err) {
      console.error("Password reset error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to send password reset email."
      );
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Checking your account...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-2xl font-bold">
              Student Login
            </h1>

            <p className="mt-2 text-sm text-gray-600">
              Log in with your Pharmacia Club account.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium"
              >
                Email
              </label>

              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium"
              >
                Password
              </label>

              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border px-3 py-2 outline-none focus:ring-2"
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full rounded-lg bg-black px-4 py-2.5 text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loggingIn ? "Logging in..." : "Login"}
            </button>
          </form>

          <button
            type="button"
            onClick={handleForgotPassword}
            className="mt-4 w-full text-sm underline"
          >
            Forgot password?
          </button>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              You can use this same account from the Alumni
              login page after graduation.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
