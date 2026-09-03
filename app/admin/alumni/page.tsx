"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type Alumni = {
  id: string;
  full_name: string;
  email: string | null;
  batch: string;
  section: string;
  graduation_year: number | null;
  profile_photo_url: string | null;
  current_position: string | null;
  organization: string | null;
  bio: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  is_public: boolean;
  created_at: string;
};

const batches = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;

  if (n === 1) return "1st Batch";
  if (n === 2) return "2nd Batch";
  if (n === 3) return "3rd Batch";

  return `${n}th Batch`;
});

const sections = ["A", "B", "C", "D", "E", "F"];

export default function AdminAlumniPage() {
  const supabase = createClient();

  const [alumni, setAlumni] = useState<Alumni[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [visibilityFilter, setVisibilityFilter] = useState("All");

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(
    null
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    batch: "30th Batch",
    section: "A",
    graduation_year: "",
    current_position: "",
    organization: "",
    bio: "",
    linkedin_url: "",
    facebook_url: "",
    instagram_url: "",
    is_public: true,
  });

  useEffect(() => {
    loadAlumni();
  }, []);

  async function loadAlumni() {
    setLoading(true);
    setError("");

    const { data, error: fetchError } = await supabase
      .from("alumni_profiles")
      .select("*")
      .order("batch", { ascending: true })
      .order("section", { ascending: true })
      .order("full_name", { ascending: true });

    if (fetchError) {
      console.error(fetchError);
      setError(fetchError.message);
      setAlumni([]);
    } else {
      setAlumni(data || []);
    }

    setLoading(false);
  }

  const filteredAlumni = useMemo(() => {
    const query = search.trim().toLowerCase();

    return alumni.filter((person) => {
      const matchesSearch =
        !query ||
        person.full_name.toLowerCase().includes(query) ||
        (person.email || "").toLowerCase().includes(query) ||
        person.batch.toLowerCase().includes(query) ||
        person.section.toLowerCase().includes(query) ||
        (person.organization || "").toLowerCase().includes(query) ||
        (person.current_position || "")
          .toLowerCase()
          .includes(query);

      const matchesBatch =
        batchFilter === "All" || person.batch === batchFilter;

      const matchesSection =
        sectionFilter === "All" || person.section === sectionFilter;

      const matchesVisibility =
        visibilityFilter === "All" ||
        (visibilityFilter === "Public" && person.is_public) ||
        (visibilityFilter === "Hidden" && !person.is_public);

      return (
        matchesSearch &&
        matchesBatch &&
        matchesSection &&
        matchesVisibility
      );
    });
  }, [
    alumni,
    search,
    batchFilter,
    sectionFilter,
    visibilityFilter,
  ]);

  const stats = useMemo(() => {
    return {
      total: alumni.length,
      public: alumni.filter((a) => a.is_public).length,
      hidden: alumni.filter((a) => !a.is_public).length,
    };
  }, [alumni]);

  function resetForm() {
    setForm({
      full_name: "",
      email: "",
      batch: "30th Batch",
      section: "A",
      graduation_year: "",
      current_position: "",
      organization: "",
      bio: "",
      linkedin_url: "",
      facebook_url: "",
      instagram_url: "",
      is_public: true,
    });

    setMessage("");
    setError("");
    setTemporaryPassword("");
  }

  function openCreateModal() {
    resetForm();
    setShowCreateModal(true);
  }

  function openEditModal(person: Alumni) {
    setSelectedAlumni(person);

    setForm({
      full_name: person.full_name,
      email: person.email || "",
      batch: person.batch,
      section: person.section,
      graduation_year: person.graduation_year
        ? String(person.graduation_year)
        : "",
      current_position: person.current_position || "",
      organization: person.organization || "",
      bio: person.bio || "",
      linkedin_url: person.linkedin_url || "",
      facebook_url: person.facebook_url || "",
      instagram_url: person.instagram_url || "",
      is_public: person.is_public,
    });

    setMessage("");
    setError("");
    setTemporaryPassword("");
    setShowEditModal(true);
  }

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Your admin session has expired. Please log in again.");
    }

    return session.access_token;
  }

  async function createAlumni(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");
    setTemporaryPassword("");

    try {
      const token = await getAccessToken();

      const response = await fetch("/api/admin/alumni", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          batch: form.batch,
          section: form.section,
          graduation_year: form.graduation_year,
          current_position: form.current_position,
          organization: form.organization,
          bio: form.bio,
          linkedin_url: form.linkedin_url,
          facebook_url: form.facebook_url,
          instagram_url: form.instagram_url,
          is_public: form.is_public,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to create account.");
      }

      setMessage("Alumni account created successfully.");
      setTemporaryPassword(result.temporary_password);

      await loadAlumni();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateAlumni(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedAlumni) return;

    setSaving(true);
    setError("");
    setMessage("");

    const { error: updateError } = await supabase
      .from("alumni_profiles")
      .update({
        full_name: form.full_name,
        batch: form.batch,
        section: form.section,
        graduation_year:
          form.graduation_year === ""
            ? null
            : Number(form.graduation_year),
        current_position: form.current_position || null,
        organization: form.organization || null,
        bio: form.bio || null,
        linkedin_url: form.linkedin_url || null,
        facebook_url: form.facebook_url || null,
        instagram_url: form.instagram_url || null,
        is_public: form.is_public,
      })
      .eq("id", selectedAlumni.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setMessage("Alumni profile updated successfully.");
      await loadAlumni();
    }

    setSaving(false);
  }

  async function toggleVisibility(person: Alumni) {
    const { error: updateError } = await supabase
      .from("alumni_profiles")
      .update({
        is_public: !person.is_public,
      })
      .eq("id", person.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadAlumni();
  }

  async function deleteAlumni(person: Alumni) {
    const confirmed = window.confirm(
      `Delete the alumni account for "${person.full_name}"?\n\nThis will permanently remove the alumni profile.`
    );

    if (!confirmed) return;

    setError("");

    try {
      const token = await getAccessToken();

      const response = await fetch("/api/admin/alumni", {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: person.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to delete alumni account."
        );
      }

      await loadAlumni();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete account."
      );
    }
  }

  function updateField(
    field: keyof typeof form,
    value: string | boolean
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#070b14]">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0b1120]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <a
              href="/admin/dashboard"
              className="text-sm font-semibold text-[#087f8c] hover:underline"
            >
              ← Admin Dashboard
            </a>

            <h1 className="mt-2 text-2xl font-bold text-[#0b1736] dark:text-white">
              Alumni Management
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Create and manage alumni accounts and public profiles.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-[#087f8c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#066d78]"
          >
            + Create Alumni Account
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0b1120]">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Alumni
            </p>
            <p className="mt-2 text-3xl font-bold text-[#0b1736] dark:text-white">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0b1120]">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Public Profiles
            </p>
            <p className="mt-2 text-3xl font-bold text-emerald-600">
              {stats.public}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0b1120]">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Hidden Profiles
            </p>
            <p className="mt-2 text-3xl font-bold text-amber-600">
              {stats.hidden}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0b1120]">
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Search
              </label>

              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Name, email, organization..."
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#087f8c] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Batch
              </label>

              <select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#087f8c] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="All">All Batches</option>
                {batches.map((batch) => (
                  <option key={batch} value={batch}>
                    {batch}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Section
              </label>

              <select
                value={sectionFilter}
                onChange={(e) => setSectionFilter(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#087f8c] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="All">All Sections</option>
                {sections.map((section) => (
                  <option key={section} value={section}>
                    Section {section}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Visibility
              </label>

              <select
                value={visibilityFilter}
                onChange={(e) =>
                  setVisibilityFilter(e.target.value)
                }
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#087f8c] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="All">All Profiles</option>
                <option value="Public">Public</option>
                <option value="Hidden">Hidden</option>
              </select>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Results */}
        <div className="mt-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[#0b1736] dark:text-white">
              Alumni
            </h2>

            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {filteredAlumni.length} of {alumni.length}
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-[#0b1120]">
              <p className="text-sm text-slate-500">
                Loading alumni...
              </p>
            </div>
          ) : filteredAlumni.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-[#0b1120]">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No alumni found.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredAlumni.map((person) => (
                <article
                  key={person.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0b1120]"
                >
                  <div className="flex gap-4 p-5">
                    {person.profile_photo_url ? (
                      <img
                        src={person.profile_photo_url}
                        alt={person.full_name}
                        className="h-20 w-20 shrink-0 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl dark:bg-slate-800">
                        👤
                      </div>
                    )}

                    <div className="min-w-0">
                      <h3 className="truncate font-bold text-[#0b1736] dark:text-white">
                        {person.full_name}
                      </h3>

                      <p className="mt-1 text-sm font-semibold text-[#087f8c]">
                        {person.batch} · Section {person.section}
                      </p>

                      {person.current_position && (
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                          {person.current_position}
                        </p>
                      )}

                      {person.organization && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {person.organization}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          person.is_public
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        {person.is_public ? "Public" : "Hidden"}
                      </span>

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(person)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:text-slate-300"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            toggleVisibility(person)
                          }
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:text-slate-300"
                        >
                          {person.is_public ? "Hide" : "Show"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteAlumni(person)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-[#0b1120]">
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-[#0b1736] dark:text-white">
                  Create Alumni Account
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  An Auth account and alumni profile will be created.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={createAlumni}
              className="max-h-[75vh] overflow-y-auto p-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Full Name *"
                  value={form.full_name}
                  onChange={(value) =>
                    updateField("full_name", value)
                  }
                  placeholder="Alumni full name"
                  required
                />

                <FormInput
                  label="Email *"
                  type="email"
                  value={form.email}
                  onChange={(value) =>
                    updateField("email", value)
                  }
                  placeholder="alumni@example.com"
                  required
                />

                <FormSelect
                  label="Batch *"
                  value={form.batch}
                  onChange={(value) =>
                    updateField("batch", value)
                  }
                  options={batches}
                />

                <FormSelect
                  label="Section *"
                  value={form.section}
                  onChange={(value) =>
                    updateField("section", value)
                  }
                  options={sections}
                />

                <FormInput
                  label="Graduation Year"
                  type="number"
                  value={form.graduation_year}
                  onChange={(value) =>
                    updateField("graduation_year", value)
                  }
                  placeholder="2026"
                />

                <FormInput
                  label="Current Position"
                  value={form.current_position}
                  onChange={(value) =>
                    updateField("current_position", value)
                  }
                  placeholder="e.g. Pharmacist"
                />

                <FormInput
                  label="Organization"
                  value={form.organization}
                  onChange={(value) =>
                    updateField("organization", value)
                  }
                  placeholder="Company / Hospital / Organization"
                />

                <FormInput
                  label="LinkedIn URL"
                  value={form.linkedin_url}
                  onChange={(value) =>
                    updateField("linkedin_url", value)
                  }
                  placeholder="https://linkedin.com/..."
                />

                <FormInput
                  label="Facebook URL"
                  value={form.facebook_url}
                  onChange={(value) =>
                    updateField("facebook_url", value)
                  }
                  placeholder="https://facebook.com/..."
                />

                <FormInput
                  label="Instagram URL"
                  value={form.instagram_url}
                  onChange={(value) =>
                    updateField("instagram_url", value)
                  }
                  placeholder="https://instagram.com/..."
                />

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Bio
                  </label>

                  <textarea
                    value={form.bio}
                    onChange={(e) =>
                      updateField("bio", e.target.value)
                    }
                    rows={4}
                    placeholder="Short professional biography..."
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#087f8c] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <label className="sm:col-span-2 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_public}
                    onChange={(e) =>
                      updateField("is_public", e.target.checked)
                    }
                    className="h-4 w-4"
                  />

                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    Show this alumni profile publicly
                  </span>
                </label>
              </div>

              {message && (
                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                  <p className="font-semibold">{message}</p>

                  {temporaryPassword && (
                    <div className="mt-3">
                      <p className="text-xs font-semibold uppercase tracking-wide">
                        Temporary Password
                      </p>

                      <div className="mt-1 flex items-center gap-2">
                        <code className="rounded bg-white px-3 py-2 font-mono text-sm font-bold text-slate-900 dark:bg-slate-900 dark:text-white">
                          {temporaryPassword}
                        </code>

                        <button
                          type="button"
                          onClick={() =>
                            navigator.clipboard.writeText(
                              temporaryPassword
                            )
                          }
                          className="rounded-lg bg-[#087f8c] px-3 py-2 text-xs font-semibold text-white"
                        >
                          Copy
                        </button>
                      </div>

                      <p className="mt-2 text-xs">
                        Give this temporary password privately to the
                        alumni. Do not publish it.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Close
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#087f8c] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedAlumni && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-[#0b1120]">
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-[#0b1736] dark:text-white">
                  Edit Alumni Profile
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Update public profile information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={updateAlumni}
              className="max-h-[75vh] overflow-y-auto p-5"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <FormInput
                  label="Full Name *"
                  value={form.full_name}
                  onChange={(value) =>
                    updateField("full_name", value)
                  }
                  required
                />

                <FormInput
                  label="Email"
                  value={form.email}
                  onChange={() => {}}
                  disabled
                />

                <FormSelect
                  label="Batch *"
                  value={form.batch}
                  onChange={(value) =>
                    updateField("batch", value)
                  }
                  options={batches}
                />

                <FormSelect
                  label="Section *"
                  value={form.section}
                  onChange={(value) =>
                    updateField("section", value)
                  }
                  options={sections}
                />

                <FormInput
                  label="Graduation Year"
                  type="number"
                  value={form.graduation_year}
                  onChange={(value) =>
                    updateField("graduation_year", value)
                  }
                />

                <FormInput
                  label="Current Position"
                  value={form.current_position}
                  onChange={(value) =>
                    updateField("current_position", value)
                  }
                />

                <FormInput
                  label="Organization"
                  value={form.organization}
                  onChange={(value) =>
                    updateField("organization", value)
                  }
                />

                <FormInput
                  label="LinkedIn URL"
                  value={form.linkedin_url}
                  onChange={(value) =>
                    updateField("linkedin_url", value)
                  }
                />

                <FormInput
                  label="Facebook URL"
                  value={form.facebook_url}
                  onChange={(value) =>
                    updateField("facebook_url", value)
                  }
                />

                <FormInput
                  label="Instagram URL"
                  value={form.instagram_url}
                  onChange={(value) =>
                    updateField("instagram_url", value)
                  }
                />

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Bio
                  </label>

                  <textarea
                    value={form.bio}
                    onChange={(e) =>
                      updateField("bio", e.target.value)
                    }
                    rows={4}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#087f8c] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                </div>

                <label className="sm:col-span-2 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                  <input
                    type="checkbox"
                    checked={form.is_public}
                    onChange={(e) =>
                      updateField("is_public", e.target.checked)
                    }
                    className="h-4 w-4"
                  />

                  <span className="text-sm text-slate-700 dark:text-slate-200">
                    Show this alumni profile publicly
                  </span>
                </label>
              </div>

              {message && (
                <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {message}
                </div>
              )}

              {error && (
                <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
                  {error}
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-[#087f8c] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

/* ---------------------------------
   Reusable form components
---------------------------------- */

function FormInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#087f8c] disabled:cursor-not-allowed disabled:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:disabled:bg-slate-800"
      />
    </div>
  );
}

function FormSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#087f8c] dark:border-slate-700 dark:bg-slate-900 dark:text-white"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}