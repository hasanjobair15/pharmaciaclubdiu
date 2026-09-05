"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/app/lib/supabase";

type StudentProfile = {
  id: string;
  full_name: string;
  student_id: string | null;
  email: string;
  batch: number;
  section: string;
  blood_group: string | null;
  graduation_date: string | null;
  profile_photo_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  created_at: string;
  updated_at: string;
};

export default function StudentProfilePage() {
  const router = useRouter();

  const [profile, setProfile] = useState<StudentProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    student_id: "",
    batch: "",
    section: "A",
    blood_group: "",
    graduation_date: "",
    linkedin_url: "",
    instagram_url: "",
    facebook_url: "",
    profile_photo_url: "",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  async function getFreshAccessToken() {
    /*
     * Always use the same Supabase client as Student Login.
     *
     * refreshSession() makes sure we don't send an old access
     * token to /api/students/profile.
     */
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.refreshSession();

    if (sessionError) {
      console.error("Session refresh error:", sessionError);
    }

    if (session?.access_token && session.user) {
      return session.access_token;
    }

    /*
     * If refresh did not return a session, check the existing
     * session one more time.
     */
    const {
      data: { session: existingSession },
    } = await supabase.auth.getSession();

    if (existingSession?.access_token && existingSession.user) {
      return existingSession.access_token;
    }

    return null;
  }

  async function loadProfile() {
    try {
      setLoading(true);
      setError("");

      const accessToken = await getFreshAccessToken();

      if (!accessToken) {
        router.replace("/students/login");
        return;
      }

      const response = await fetch("/api/students/profile", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const data = await response.json();

      /*
       * If the API says the account is now Alumni, do not try
       * to render it as a Student profile.
       */
      if (
        response.ok &&
        data?.account_type === "alumni" &&
        data?.redirect_to
      ) {
        router.replace(data.redirect_to);
        return;
      }

      if (!response.ok) {
        /*
         * If the server rejected the token, try one final fresh
         * session and retry the request once.
         */
        if (response.status === 401) {
          const retryToken = await getFreshAccessToken();

          if (retryToken && retryToken !== accessToken) {
            const retryResponse = await fetch(
              "/api/students/profile",
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${retryToken}`,
                  Accept: "application/json",
                },
                cache: "no-store",
              }
            );

            const retryData = await retryResponse.json();

            if (
              retryResponse.ok &&
              retryData?.account_type === "alumni" &&
              retryData?.redirect_to
            ) {
              router.replace(retryData.redirect_to);
              return;
            }

            if (retryResponse.ok && retryData?.profile) {
              const student = retryData.profile as StudentProfile;

              setProfile(student);

              setForm({
                full_name: student.full_name || "",
                student_id: student.student_id || "",
                batch: String(student.batch || ""),
                section: student.section || "A",
                blood_group: student.blood_group || "",
                graduation_date: student.graduation_date
                  ? String(student.graduation_date).slice(0, 7)
                  : "",
                linkedin_url: student.linkedin_url || "",
                instagram_url: student.instagram_url || "",
                facebook_url: student.facebook_url || "",
                profile_photo_url:
                  student.profile_photo_url || "",
              });

              return;
            }

            throw new Error(
              retryData?.error ||
                "Your session could not be verified. Please log in again."
            );
          }
        }

        throw new Error(
          data?.error || "Unable to load your profile."
        );
      }

      if (!data?.profile) {
        throw new Error(
          "Your profile could not be found."
        );
      }

      const student = data.profile as StudentProfile;

      setProfile(student);

      setForm({
        full_name: student.full_name || "",
        student_id: student.student_id || "",
        batch: String(student.batch || ""),
        section: student.section || "A",
        blood_group: student.blood_group || "",
        graduation_date: student.graduation_date
          ? String(student.graduation_date).slice(0, 7)
          : "",
        linkedin_url: student.linkedin_url || "",
        instagram_url: student.instagram_url || "",
        facebook_url: student.facebook_url || "",
        profile_photo_url:
          student.profile_photo_url || "",
      });
    } catch (err) {
      console.error("Student profile error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your student profile."
      );
    } finally {
      setLoading(false);
    }
  }

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function startEditing() {
    setSuccess("");
    setError("");
    setEditing(true);
  }

  function cancelEditing() {
    if (!profile) return;

    setForm({
      full_name: profile.full_name || "",
      student_id: profile.student_id || "",
      batch: String(profile.batch || ""),
      section: profile.section || "A",
      blood_group: profile.blood_group || "",
      graduation_date: profile.graduation_date
        ? String(profile.graduation_date).slice(0, 7)
        : "",
      linkedin_url: profile.linkedin_url || "",
      instagram_url: profile.instagram_url || "",
      facebook_url: profile.facebook_url || "",
      profile_photo_url:
        profile.profile_photo_url || "",
    });

    setError("");
    setSuccess("");
    setEditing(false);
  }

  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const accessToken = await getFreshAccessToken();

      if (!accessToken) {
        router.replace("/students/login");
        return;
      }

      const response = await fetch("/api/students/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          full_name: form.full_name,
          student_id: form.student_id,
          batch: form.batch,
          section: form.section,
          blood_group: form.blood_group,

          /*
           * Empty value becomes NULL in the API.
           */
          graduation_date:
            form.graduation_date || null,

          linkedin_url: form.linkedin_url,
          instagram_url: form.instagram_url,
          facebook_url: form.facebook_url,
          profile_photo_url:
            form.profile_photo_url,
        }),
      });

      const data = await response.json();

      /*
       * A student who has reached their graduation month
       * may be converted to Alumni by the API.
       */
      if (
        response.ok &&
        data?.account_type === "alumni" &&
        data?.redirect_to
      ) {
        router.replace(data.redirect_to);
        return;
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Profile could not be updated."
        );
      }

      if (!data?.profile) {
        throw new Error(
          "Profile was updated but no profile data was returned."
        );
      }

      const updatedProfile =
        data.profile as StudentProfile;

      setProfile(updatedProfile);

      setForm({
        full_name: updatedProfile.full_name || "",
        student_id:
          updatedProfile.student_id || "",
        batch: String(updatedProfile.batch || ""),
        section: updatedProfile.section || "A",
        blood_group:
          updatedProfile.blood_group || "",
        graduation_date:
          updatedProfile.graduation_date
            ? String(
                updatedProfile.graduation_date
              ).slice(0, 7)
            : "",
        linkedin_url:
          updatedProfile.linkedin_url || "",
        instagram_url:
          updatedProfile.instagram_url || "",
        facebook_url:
          updatedProfile.facebook_url || "",
        profile_photo_url:
          updatedProfile.profile_photo_url || "",
      });

      setEditing(false);
      setSuccess(
        "Profile updated successfully."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (err) {
      console.error("Profile update error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while updating your profile."
      );
    } finally {
      setSaving(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();

    router.replace("/students/login");
    router.refresh();
  };

  function formatGraduationDate(
    graduationDate: string | null
  ) {
    if (!graduationDate) {
      return "Not provided";
    }

    const value = String(graduationDate).slice(0, 7);

    const match = value.match(
      /^(\d{4})-(\d{2})$/
    );

    if (!match) {
      return graduationDate;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      month < 1 ||
      month > 12
    ) {
      return graduationDate;
    }

    const date = new Date(
      Date.UTC(year, month - 1, 1)
    );

    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }).format(date);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-background px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border bg-card p-10 text-center shadow-sm">
            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-muted border-t-primary" />

            <h1 className="text-xl font-semibold">
              Loading your profile...
            </h1>

            <p className="mt-2 text-sm text-muted-foreground">
              Please wait a moment.
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="min-h-screen bg-background px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold">
              Unable to load profile
            </h1>

            <p className="mt-3 text-sm text-red-500">
              {error}
            </p>

            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
              <button
                type="button"
                onClick={loadProfile}
                className="rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:opacity-90"
              >
                Try Again
              </button>

              <Link
                href="/students"
                className="rounded-lg border px-5 py-3 font-semibold transition hover:bg-muted"
              >
                Back to Students
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-background px-4 py-16">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border bg-card p-8 text-center shadow-sm">
            <h1 className="text-2xl font-bold">
              Profile not found
            </h1>

            <p className="mt-3 text-muted-foreground">
              We could not find your student profile.
            </p>

            <Link
              href="/students"
              className="mt-6 inline-block rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground"
            >
              Back to Students
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-primary">
              Pharmacia Club DIU
            </p>

            <h1 className="mt-1 text-3xl font-bold tracking-tight">
              My Student Profile
            </h1>

            <p className="mt-2 text-muted-foreground">
              Manage your student account information
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border px-5 py-3 text-sm font-semibold transition hover:bg-muted"
          >
            Logout
          </button>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
            ✓ {success}
          </div>
        )}

        {error && profile && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          {/* Profile Header */}
          <div className="border-b bg-muted/30 px-6 py-8 sm:px-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              {profile.profile_photo_url ? (
                <img
                  src={profile.profile_photo_url}
                  alt={profile.full_name}
                  className="h-32 w-32 rounded-full object-cover ring-4 ring-background shadow-md"
                />
              ) : (
                <div className="flex h-32 w-32 items-center justify-center rounded-full bg-primary text-4xl font-bold text-primary-foreground ring-4 ring-background">
                  {profile.full_name
                    .trim()
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

              <div className="text-center sm:text-left">
                <h2 className="text-2xl font-bold">
                  {profile.full_name}
                </h2>

                <p className="mt-1 text-muted-foreground">
                  Batch {profile.batch} • Section{" "}
                  {profile.section}
                </p>

                {profile.student_id && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Student ID: {profile.student_id}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* VIEW MODE */}
          {!editing && (
            <>
              <div className="grid gap-8 p-6 sm:grid-cols-2 sm:p-8">
                {/* Personal Information */}
                <section>
                  <h3 className="mb-4 text-lg font-semibold">
                    Personal Information
                  </h3>

                  <div className="space-y-4">
                    <InfoRow
                      label="Full Name"
                      value={profile.full_name}
                    />

                    <InfoRow
                      label="Email"
                      value={profile.email}
                    />

                    <InfoRow
                      label="Student ID"
                      value={
                        profile.student_id ||
                        "Not provided"
                      }
                    />

                    <InfoRow
                      label="Blood Group"
                      value={
                        profile.blood_group ||
                        "Not provided"
                      }
                    />
                  </div>
                </section>

                {/* Academic Information */}
                <section>
                  <h3 className="mb-4 text-lg font-semibold">
                    Academic Information
                  </h3>

                  <div className="space-y-4">
                    <InfoRow
                      label="Batch"
                      value={`Batch ${profile.batch}`}
                    />

                    <InfoRow
                      label="Section"
                      value={`Section ${profile.section}`}
                    />

                    <InfoRow
                      label="Graduation"
                      value={formatGraduationDate(
                        profile.graduation_date
                      )}
                    />

                    <InfoRow
                      label="Department"
                      value="Department of Pharmacy"
                    />

                    <InfoRow
                      label="University"
                      value="Daffodil International University"
                    />
                  </div>
                </section>
              </div>

              {/* Graduation Status */}
              {profile.graduation_date && (
                <div className="border-t px-6 py-6 sm:px-8">
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="text-sm font-semibold">
                      Graduation Date
                    </p>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {formatGraduationDate(
                        profile.graduation_date
                      )}
                    </p>

                    <p className="mt-2 text-xs text-muted-foreground">
                      Your profile will automatically appear
                      in the Alumni directory when your
                      graduation month begins.
                    </p>
                  </div>
                </div>
              )}

              {/* Social Links */}
              {(profile.linkedin_url ||
                profile.instagram_url ||
                profile.facebook_url) && (
                <div className="border-t px-6 py-6 sm:px-8">
                  <h3 className="mb-4 text-lg font-semibold">
                    Social Links
                  </h3>

                  <div className="flex flex-wrap gap-3">
                    {profile.linkedin_url && (
                      <a
                        href={profile.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                      >
                        LinkedIn ↗
                      </a>
                    )}

                    {profile.instagram_url && (
                      <a
                        href={profile.instagram_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                      >
                        Instagram ↗
                      </a>
                    )}

                    {profile.facebook_url && (
                      <a
                        href={profile.facebook_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg border px-4 py-2 text-sm font-medium transition hover:bg-muted"
                      >
                        Facebook ↗
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Actions */}
              <div className="flex flex-col gap-3 border-t bg-muted/20 p-6 sm:flex-row sm:justify-between sm:p-8">
                <Link
                  href="/students"
                  className="rounded-lg border px-5 py-3 text-center text-sm font-semibold transition hover:bg-muted"
                >
                  ← Back to Students
                </Link>

                <button
                  type="button"
                  onClick={startEditing}
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                >
                  ✏️ Edit Profile
                </button>
              </div>
            </>
          )}

          {/* EDIT MODE */}
          {editing && (
            <form onSubmit={handleSave}>
              <div className="space-y-8 p-6 sm:p-8">
                {/* Personal Information */}
                <section>
                  <h3 className="mb-5 text-lg font-semibold">
                    Personal Information
                  </h3>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      label="Full Name"
                      value={form.full_name}
                      onChange={(value) =>
                        updateField(
                          "full_name",
                          value
                        )
                      }
                      required
                    />

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Email
                      </label>

                      <input
                        type="email"
                        value={profile.email}
                        disabled
                        className="w-full rounded-xl border bg-muted px-4 py-3 text-sm text-muted-foreground"
                      />

                      <p className="mt-1 text-xs text-muted-foreground">
                        Email cannot be changed here.
                      </p>
                    </div>

                    <FormField
                      label="Student ID"
                      value={form.student_id}
                      onChange={(value) =>
                        updateField(
                          "student_id",
                          value
                        )
                      }
                    />

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Blood Group
                      </label>

                      <select
                        value={form.blood_group}
                        onChange={(e) =>
                          updateField(
                            "blood_group",
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="">
                          Select blood group
                        </option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Academic Information */}
                <section className="border-t pt-8">
                  <h3 className="mb-5 text-lg font-semibold">
                    Academic Information
                  </h3>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <FormField
                      label="Batch"
                      type="number"
                      value={form.batch}
                      onChange={(value) =>
                        updateField(
                          "batch",
                          value
                        )
                      }
                      required
                    />

                    <div>
                      <label className="mb-2 block text-sm font-semibold">
                        Section
                      </label>

                      <select
                        value={form.section}
                        onChange={(e) =>
                          updateField(
                            "section",
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                      >
                        <option value="A">
                          Section A
                        </option>

                        <option value="B">
                          Section B
                        </option>
                      </select>
                    </div>

                    {/* Graduation Month + Year */}
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-semibold">
                        Graduation Month & Year
                      </label>

                      <input
                        type="month"
                        value={form.graduation_date}
                        onChange={(e) =>
                          updateField(
                            "graduation_date",
                            e.target.value
                          )
                        }
                        className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />

                      <p className="mt-2 text-xs text-muted-foreground">
                        Optional. When this graduation
                        month begins, your profile will
                        automatically appear in the Alumni
                        directory.
                      </p>

                      {form.graduation_date && (
                        <button
                          type="button"
                          onClick={() =>
                            updateField(
                              "graduation_date",
                              ""
                            )
                          }
                          className="mt-3 rounded-lg border px-3 py-2 text-xs font-semibold transition hover:bg-muted"
                        >
                          Clear Graduation Date
                        </button>
                      )}
                    </div>
                  </div>
                </section>

                {/* Profile Photo */}
                <section className="border-t pt-8">
                  <h3 className="mb-5 text-lg font-semibold">
                    Profile Photo
                  </h3>

                  <FormField
                    label="Profile Photo URL"
                    value={form.profile_photo_url}
                    onChange={(value) =>
                      updateField(
                        "profile_photo_url",
                        value
                      )
                    }
                    placeholder="https://example.com/photo.jpg"
                  />

                  <p className="mt-2 text-xs text-muted-foreground">
                    Enter a publicly accessible image URL.
                  </p>
                </section>

                {/* Social Links */}
                <section className="border-t pt-8">
                  <h3 className="mb-5 text-lg font-semibold">
                    Social Links
                  </h3>

                  <div className="space-y-5">
                    <FormField
                      label="LinkedIn URL"
                      value={form.linkedin_url}
                      onChange={(value) =>
                        updateField(
                          "linkedin_url",
                          value
                        )
                      }
                      placeholder="https://linkedin.com/in/..."
                    />

                    <FormField
                      label="Instagram URL"
                      value={form.instagram_url}
                      onChange={(value) =>
                        updateField(
                          "instagram_url",
                          value
                        )
                      }
                      placeholder="https://instagram.com/..."
                    />

                    <FormField
                      label="Facebook URL"
                      value={form.facebook_url}
                      onChange={(value) =>
                        updateField(
                          "facebook_url",
                          value
                        )
                      }
                      placeholder="https://facebook.com/..."
                    />
                  </div>
                </section>
              </div>

              {/* Save / Cancel */}
              <div className="flex flex-col gap-3 border-t bg-muted/20 p-6 sm:flex-row sm:justify-end sm:p-8">
                <button
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                  className="rounded-lg border px-6 py-3 text-sm font-semibold transition hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? "Saving..."
                    : "Save Changes"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}

function FormField({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-1 break-words text-sm font-medium">
        {value}
      </p>
    </div>
  );
}
