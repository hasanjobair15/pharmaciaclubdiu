"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCurrentRunningBatches } from "@/app/lib/students/current-batches";

type CRStatus = "cr" | "co_cr" | "no";

const SECTIONS = ["A", "B"];

export default function CreateStudentAccountPage() {
  const router = useRouter();

  const currentBatches = useMemo(
    () => getCurrentRunningBatches(),
    []
  );

  const [fullName, setFullName] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [batch, setBatch] = useState("");
  const [section, setSection] = useState("");
  const [crStatus, setCrStatus] =
    useState<CRStatus | "">("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const cleanName = fullName.trim();
    const cleanStudentId = studentId.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (!cleanStudentId) {
      setError("Please enter your student ID.");
      return;
    }

    if (!cleanEmail) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters long."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!batch) {
      setError("Please select your batch.");
      return;
    }

    if (!section) {
      setError("Please select your section.");
      return;
    }

    if (!crStatus) {
      setError(
        "Please select your class representative status."
      );
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();

      formData.append("full_name", cleanName);
      formData.append("student_id", cleanStudentId);
      formData.append("email", cleanEmail);
      formData.append("password", password);
      formData.append("batch", batch);
      formData.append("section", section);
      formData.append("cr_status", crStatus);

      const response = await fetch(
        "/api/students/register",
        {
          method: "POST",
          body: formData,
        }
      );

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Unable to create student account."
        );
      }

      setSuccess(
        result?.message ||
          "Student account created successfully."
      );

      setFullName("");
      setStudentId("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setBatch("");
      setSection("");
      setCrStatus("");

      /*
       * Give the user a moment to see the success
       * message before going to login.
       */
      setTimeout(() => {
        router.push("/students/login");
      }, 1800);
    } catch (err) {
      console.error(
        "Student registration error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while creating the account."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <Link
            href="/students"
            className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Back to Students
          </Link>

          <div className="mt-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Pharmacia Club DIU
            </p>

            <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Create Student Account
            </h1>

            <p className="mt-3 text-slate-600 dark:text-slate-300">
              Create your student profile for the
              Pharmacia Club DIU student directory.
            </p>
          </div>
        </div>
      </section>

      {/* Form */}
      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          {/* Error */}
          {error && (
            <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/50 dark:bg-red-950/30">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {error}
              </p>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
              <p className="text-sm font-medium text-green-700 dark:text-green-300">
                {success}
              </p>

              <p className="mt-1 text-xs text-green-600 dark:text-green-400">
                Redirecting you to student login...
              </p>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* Personal Information */}
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Personal Information
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Enter your basic student information.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {/* Full Name */}
                <div className="md:col-span-2">
                  <label
                    htmlFor="full-name"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Full Name
                  </label>

                  <input
                    id="full-name"
                    type="text"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    placeholder="Enter your full name"
                    autoComplete="name"
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Student ID */}
                <div>
                  <label
                    htmlFor="student-id"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Student ID
                  </label>

                  <input
                    id="student-id"
                    type="text"
                    value={studentId}
                    onChange={(e) =>
                      setStudentId(e.target.value)
                    }
                    placeholder="e.g. 221-35-1234"
                    autoComplete="username"
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
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
                    placeholder="Enter your email"
                    autoComplete="email"
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Academic Information */}
            <div className="border-t border-slate-200 pt-8 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Academic Information
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Select your current batch, section and
                class representative status.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-3">
                {/* Batch */}
                <div>
                  <label
                    htmlFor="batch"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Batch
                  </label>

                  <select
                    id="batch"
                    value={batch}
                    onChange={(e) =>
                      setBatch(e.target.value)
                    }
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">
                      Select batch
                    </option>

                    {currentBatches.map(
                      (currentBatch) => (
                        <option
                          key={currentBatch}
                          value={currentBatch}
                        >
                          Batch {currentBatch}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* Section */}
                <div>
                  <label
                    htmlFor="section"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Section
                  </label>

                  <select
                    id="section"
                    value={section}
                    onChange={(e) =>
                      setSection(e.target.value)
                    }
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">
                      Select section
                    </option>

                    {SECTIONS.map(
                      (currentSection) => (
                        <option
                          key={currentSection}
                          value={currentSection}
                        >
                          Section{" "}
                          {currentSection}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* CR Status */}
                <div>
                  <label
                    htmlFor="cr-status"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Class Representative
                  </label>

                  <select
                    id="cr-status"
                    value={crStatus}
                    onChange={(e) =>
                      setCrStatus(
                        e.target.value as
                          | CRStatus
                          | ""
                      )
                    }
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">
                      Select your position
                    </option>

                    <option value="cr">
                      CR
                    </option>

                    <option value="co_cr">
                      Co-CR
                    </option>

                    <option value="no">
                      NO
                    </option>
                  </select>
                </div>
              </div>

              {/* CR explanation */}
              <div className="mt-4 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <p className="text-xs leading-5 text-slate-600 dark:text-slate-400">
                  <strong className="text-slate-800 dark:text-slate-200">
                    CR:
                  </strong>{" "}
                  Class Representative.
                  {" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    Co-CR:
                  </strong>{" "}
                  Co-Class Representative.
                  {" "}
                  <strong className="text-slate-800 dark:text-slate-200">
                    NO:
                  </strong>{" "}
                  Not a Class Representative.
                </p>
              </div>
            </div>

            {/* Password */}
            <div className="border-t border-slate-200 pt-8 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Account Security
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Create a password for your student
                account.
              </p>

              <div className="mt-5 grid gap-5 md:grid-cols-2">
                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Password
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* Confirm Password */}
                <div>
                  <label
                    htmlFor="confirm-password"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Confirm Password
                  </label>

                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Re-enter your password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    disabled={loading}
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <div className="border-t border-slate-200 pt-8 dark:border-slate-800">
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-slate-900"
              >
                {loading
                  ? "Creating Account..."
                  : "Create Student Account"}
              </button>

              <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
                Already have an account?{" "}
                <Link
                  href="/students/login"
                  className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
                >
                  Student Login
                </Link>
              </p>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
