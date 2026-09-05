"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type StudentProfile = {
  id: string;
  full_name: string;
  student_id: string | null;
  email: string;
  batch: number;
  section: string;
  blood_group: string | null;
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
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProfile = async () => {
      const supabase = createClient();

      try {
        setLoading(true);
        setError("");

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          throw userError;
        }

        if (!user) {
          router.replace("/students/login");
          return;
        }

        const { data, error: profileError } = await supabase
          .from("student_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (profileError) {
          throw profileError;
        }

        setProfile(data);
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
    };

    loadProfile();
  }, [router]);

  const handleLogout = async () => {
    const supabase = createClient();

    await supabase.auth.signOut();

    router.replace("/students/login");
    router.refresh();
  };

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

  if (error) {
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
                onClick={() => window.location.reload()}
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
              Your student account information
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
                  Batch {profile.batch} • Section {profile.section}
                </p>

                {profile.student_id && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Student ID: {profile.student_id}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Information */}
          <div className="grid gap-8 p-6 sm:grid-cols-2 sm:p-8">
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
                  value={profile.student_id || "Not provided"}
                />

                <InfoRow
                  label="Blood Group"
                  value={profile.blood_group || "Not provided"}
                />
              </div>
            </section>

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
              onClick={handleLogout}
              className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </main>
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
