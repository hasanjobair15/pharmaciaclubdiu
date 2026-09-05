"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";

type AlumniAuth = {
  emailConfirmedAt: string | null;
  lastSignInAt: string | null;
};

type Alumni = {
  id: string;
  full_name: string;
  email: string | null;
  batch: string;
  section: string;
  graduation_year: number | null;
  graduation_date: string | null;
  profile_photo_url: string | null;
  current_position: string | null;
  organization: string | null;
  bio: string | null;
  phone: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string | null;
  auth?: AlumniAuth;
};

const batches = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;

  if (n === 1) return "1st Batch";
  if (n === 2) return "2nd Batch";
  if (n === 3) return "3rd Batch";

  return `${n}th Batch`;
});

const sections = ["A", "B", "C", "D", "E", "F"];

const emptyForm = {
  full_name: "",
  email: "",
  batch: "30th Batch",
  section: "A",
  graduation_date: "",
  current_position: "",
  organization: "",
  bio: "",
  phone: "",
  linkedin_url: "",
  facebook_url: "",
  instagram_url: "",
  is_public: true,
};

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
  const [showViewModal, setShowViewModal] = useState(false);

  const [selectedAlumni, setSelectedAlumni] = useState<Alumni | null>(null);
  const [viewAlumni, setViewAlumni] = useState<Alumni | null>(null);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const [form, setForm] = useState(emptyForm);

  /* Profile photo handling on the modals */
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoData, setPhotoData] = useState<string | null>(null);
  const [photoRemove, setPhotoRemove] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");

  useEffect(() => {
    loadAlumni();
  }, []);

  async function loadAlumni() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError("Your admin session has expired. Please log in again.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/admin/alumni", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to load alumni profiles.");
      }

      setAlumni(result.alumni || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load alumni profiles. Please try again."
      );
      setAlumni([]);
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
          .includes(query) ||
        (person.phone || "").toLowerCase().includes(query);

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
  }, [alumni, search, batchFilter, sectionFilter, visibilityFilter]);

  const stats = useMemo(() => {
    return {
      total: alumni.length,
      public: alumni.filter((a) => a.is_public).length,
      hidden: alumni.filter((a) => !a.is_public).length,
      pending: alumni.filter(
        (a) => a.auth && !a.auth.emailConfirmedAt
      ).length,
    };
  }, [alumni]);

  function resetForm() {
    setForm(emptyForm);
    setMessage("");
    setError("");
    setTemporaryPassword("");
    setPhotoPreview("");
    setPhotoData(null);
    setPhotoRemove(false);
    setPhotoError("");
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
      graduation_date: person.graduation_date
        ? String(person.graduation_date).slice(0, 7)
        : person.graduation_year
          ? `${person.graduation_year}-01`
          : "",
      current_position: person.current_position || "",
      organization: person.organization || "",
      bio: person.bio || "",
      phone: person.phone || "",
      linkedin_url: person.linkedin_url || "",
      facebook_url: person.facebook_url || "",
      instagram_url: person.instagram_url || "",
      is_public: person.is_public,
    });

    setMessage("");
    setError("");
    setTemporaryPassword("");
    setPhotoPreview(person.profile_photo_url || "");
    setPhotoData(null);
    setPhotoRemove(false);
    setPhotoError("");
    setShowEditModal(true);
  }

  function openViewModal(person: Alumni) {
    setViewAlumni(person);
    setShowViewModal(true);
  }

  async function getAccessToken() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error(
        "Your admin session has expired. Please log in again."
      );
    }

    return session.access_token;
  }

  async function handlePhotoSelect(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setPhotoError("");

    if (!file.type.startsWith("image/")) {
      setPhotoError("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setPhotoError("Please select an image smaller than 10 MB.");
      return;
    }

    setPhotoBusy(true);

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 0.7,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: "image/webp",
      });

      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(new Error("Failed to read the image."));
        reader.readAsDataURL(compressed);
      });

      setPhotoData(dataUrl);
      setPhotoRemove(false);
      setPhotoPreview(URL.createObjectURL(compressed));
    } catch (err) {
      setPhotoError(
        err instanceof Error ? err.message : "Could not process this image."
      );
    } finally {
      setPhotoBusy(false);
    }
  }

  function getDhakaTodayMonth() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
    }).formatToParts(new Date());

    const year = parts.find((part) => part.type === "year")?.value;
    const month = parts.find((part) => part.type === "month")?.value;

    return `${year}-${month}`;
  }

  function validateGraduationDate(value: string) {
    if (!value) {
      return "Graduation Month & Year is required.";
    }

    if (value > getDhakaTodayMonth()) {
      return "Graduation Month & Year cannot be in the future.";
    }

    return "";
  }

  async function createAlumni(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    const graduationDateError = validateGraduationDate(form.graduation_date);
    if (graduationDateError) {
      setError(graduationDateError);
      setSaving(false);
      return;
    }
    setTemporaryPassword("");

    if (photoData) {
      const invalid = await validatePhotoSize(photoData);

      if (invalid) {
        setError(invalid);
        setSaving(false);
        return;
      }
    }

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
          graduation_date: form.graduation_date,
          photoData: photoData || undefined,
          current_position: form.current_position,
          organization: form.organization,
          bio: form.bio,
          phone: form.phone,
          linkedin_url: form.linkedin_url,
          facebook_url: form.facebook_url,
          instagram_url: form.instagram_url,
          is_public: form.is_public,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to create the alumni account."
        );
      }

      setMessage("Alumni added successfully.");
      setTemporaryPassword(result.temporary_password);

      await loadAlumni();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to add this alumni. Please try again."
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

    const graduationDateError = validateGraduationDate(form.graduation_date);
    if (graduationDateError) {
      setError(graduationDateError);
      setSaving(false);
      return;
    }

    if (photoData) {
      const invalid = await validatePhotoSize(photoData);

      if (invalid) {
        setError(invalid);
        setSaving(false);
        return;
      }
    }

    try {
      const token = await getAccessToken();

      const response = await fetch("/api/admin/alumni", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: selectedAlumni.id,
          full_name: form.full_name,
          email: form.email,
          batch: form.batch,
          section: form.section,
          graduation_date: form.graduation_date,
          photoData: photoData || undefined,
          removePhoto: photoRemove || undefined,
          current_position: form.current_position,
          organization: form.organization,
          bio: form.bio,
          phone: form.phone,
          linkedin_url: form.linkedin_url,
          facebook_url: form.facebook_url,
          instagram_url: form.instagram_url,
          is_public: form.is_public,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to update this alumni profile."
        );
      }

      setMessage("Alumni profile updated successfully.");
      await loadAlumni();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update this alumni profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility(person: Alumni) {
    setError("");

    try {
      const token = await getAccessToken();

      const response = await fetch("/api/admin/alumni", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: person.id,
          full_name: person.full_name,
          batch: person.batch,
          section: person.section,
          graduation_date:
        person.graduation_date ||
        (person.graduation_year ? `${person.graduation_year}-01` : ""),
          current_position: person.current_position,
          organization: person.organization,
          bio: person.bio,
          phone: person.phone,
          linkedin_url: person.linkedin_url,
          facebook_url: person.facebook_url,
          instagram_url: person.instagram_url,
          is_public: !person.is_public,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "Unable to update this alumni profile."
        );
      }

      await loadAlumni();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to update visibility."
      );
    }
  }

  async function deleteAlumni(person: Alumni) {
    const confirmed = window.confirm(
      `Are you sure you want to remove the alumni profile of "${person.full_name}"?\n\n` +
        `Email: ${person.email || "—"}\n` +
        `Batch: ${person.batch} · Section ${person.section}\n\n` +
        `This permanently removes the alumni profile and its login account.`
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
          result.error || "Unable to remove this alumni profile."
        );
      }

      setMessage(
        `Alumni removed successfully.`
      );

      await loadAlumni();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to remove this alumni profile."
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

  function formatDate(value: string | null | undefined) {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function confirmedLabel(person: Alumni) {
    if (!person.auth) return { label: "Unknown", tone: "slate" };

    return person.auth.emailConfirmedAt
      ? { label: "Confirmed", tone: "emerald" }
      : { label: "Pending", tone: "amber" };
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
              View, search, add, edit and remove individual alumni accounts
              and profiles.
            </p>
          </div>

          <button
            type="button"
            onClick={openCreateModal}
            className="rounded-lg bg-[#087f8c] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#066d78]"
          >
            + Add Alumni
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

          <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#0b1120]">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Pending Email Confirmation
            </p>
            <p className="mt-2 text-3xl font-bold text-orange-500">
              {stats.pending}
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
                placeholder="Name, email, phone, organization..."
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

        {/* Messages */}
        {message && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            {message}
          </div>
        )}

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
              {filteredAlumni.map((person) => {
                const status = confirmedLabel(person);

                return (
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
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            person.is_public
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                          }`}
                        >
                          {person.is_public ? "Public" : "Hidden"}
                        </span>

                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            status.tone === "emerald"
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                              : status.tone === "amber"
                              ? "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          Email {status.label}
                        </span>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          Added {formatDate(person.created_at)}
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => openViewModal(person)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:text-slate-200 dark:hover:border-[#2dd4bf] dark:hover:text-[#2dd4bf]"
                        >
                          View
                        </button>

                        <button
                          type="button"
                          onClick={() => openEditModal(person)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:text-slate-200 dark:hover:border-[#2dd4bf] dark:hover:text-[#2dd4bf]"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleVisibility(person)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:text-slate-200 dark:hover:border-[#2dd4bf] dark:hover:text-[#2dd4bf]"
                        >
                          {person.is_public ? "Hide" : "Show Publicly"}
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteAlumni(person)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ================= CREATE MODAL ================= */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-[#0b1120]">
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-[#0b1736] dark:text-white">
                  Add Alumni
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Creates a login account and a public alumni profile.
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
                <PhotoField
                  preview={photoPreview}
                  busy={photoBusy}
                  onSelect={handlePhotoSelect}
                  onRemove={() => {
                    setPhotoData(null);
                    setPhotoRemove(true);
                    setPhotoPreview("");
                  }}
                  error={photoError}
                />

                <div className="grid content-start gap-4">
                  <FormInput
                    label="Full Name *"
                    value={form.full_name}
                    onChange={(value) =>
                      updateField("full_name", value)
                    }
                    required
                  />

                  <FormInput
                    label="Email *"
                    type="email"
                    value={form.email}
                    onChange={(value) =>
                      updateField("email", value)
                    }
                    required
                  />
                </div>

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
                  label="Graduation Month & Year *"
                  type="month"
                  value={form.graduation_date}
                  onChange={(value) =>
                    updateField("graduation_date", value)
                  }
                  required
                />

                <FormInput
                  label="Phone"
                  value={form.phone}
                  onChange={(value) =>
                    updateField("phone", value)
                  }
                  placeholder="+880 1XXX-XXXXXX"
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
                  disabled={saving || photoBusy}
                  className="rounded-lg bg-[#087f8c] px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Add Alumni"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= EDIT MODAL ================= */}
      {showEditModal && selectedAlumni && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl dark:bg-[#0b1120]">
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-[#0b1736] dark:text-white">
                  Edit Alumni Profile
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Update profile information. Images are only changed when
                  you explicitly replace or remove them.
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
                <PhotoField
                  preview={photoPreview}
                  busy={photoBusy}
                  onSelect={handlePhotoSelect}
                  onRemove={() => {
                    setPhotoData(null);
                    setPhotoRemove(true);
                    setPhotoPreview("");
                  }}
                  error={photoError}
                  currentPhoto={selectedAlumni.profile_photo_url}
                  markedForRemoval={photoRemove}
                />

                <div className="grid content-start gap-4">
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
                    type="email"
                    value={form.email}
                    onChange={(value) =>
                      updateField("email", value)
                    }
                  />
                </div>

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
                  label="Graduation Month & Year *"
                  type="month"
                  value={form.graduation_date}
                  onChange={(value) =>
                    updateField("graduation_date", value)
                  }
                  required
                />

                <FormInput
                  label="Phone"
                  value={form.phone}
                  onChange={(value) =>
                    updateField("phone", value)
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
                  disabled={saving || photoBusy}
                  className="rounded-lg bg-[#087f8c] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= VIEW MODAL ================= */}
      {showViewModal && viewAlumni && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4">
          <div className="my-8 w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-[#0b1120]">
            <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-800">
              <div>
                <h2 className="text-xl font-bold text-[#0b1736] dark:text-white">
                  Alumni Details
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Complete alumni profile information.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowViewModal(false)}
                className="text-2xl text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto p-6">
              <div className="flex items-center gap-5">
                {viewAlumni.profile_photo_url ? (
                  <img
                    src={viewAlumni.profile_photo_url}
                    alt={viewAlumni.full_name}
                    className="h-24 w-24 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-4xl dark:bg-slate-800">
                    👤
                  </div>
                )}

                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-[#0b1736] dark:text-white">
                    {viewAlumni.full_name}
                  </h3>

                  <p className="mt-1 text-sm font-semibold text-[#087f8c]">
                    {viewAlumni.batch} · Section {viewAlumni.section}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        viewAlumni.is_public
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                      }`}
                    >
                      {viewAlumni.is_public ? "Public" : "Hidden"}
                    </span>

                    {viewAlumni.auth && (
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          viewAlumni.auth.emailConfirmedAt
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                            : "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
                        }`}
                      >
                        Email{" "}
                        {viewAlumni.auth.emailConfirmedAt
                          ? "Confirmed"
                          : "Pending"}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <dl className="mt-7 grid gap-x-6 gap-y-5 sm:grid-cols-2">
                <DetailRow label="Full Name" value={viewAlumni.full_name} />
                <DetailRow label="Email" value={viewAlumni.email} />
                <DetailRow label="Phone" value={viewAlumni.phone} />
                <DetailRow label="Batch" value={viewAlumni.batch} />
                <DetailRow label="Section" value={viewAlumni.section} />

                <DetailRow
                  label="Graduation Month & Year"
                  value={
                    viewAlumni.graduation_date
                      ? String(viewAlumni.graduation_date).slice(0, 7)
                      : viewAlumni.graduation_year
                        ? String(viewAlumni.graduation_year)
                        : null
                  }
                />

                <DetailRow
                  label="Current Position"
                  value={viewAlumni.current_position}
                />

                <DetailRow
                  label="Organization"
                  value={viewAlumni.organization}
                />

                <DetailRow
                  label="LinkedIn"
                  value={viewAlumni.linkedin_url}
                  isLink
                />

                <DetailRow
                  label="Facebook"
                  value={viewAlumni.facebook_url}
                  isLink
                />

                <DetailRow
                  label="Instagram"
                  value={viewAlumni.instagram_url}
                  isLink
                />

                <DetailRow
                  label="Added"
                  value={formatDate(viewAlumni.created_at)}
                />

                <DetailRow
                  label="Last Updated"
                  value={formatDate(viewAlumni.updated_at)}
                />

                {viewAlumni.auth?.lastSignInAt && (
                  <DetailRow
                    label="Last Sign In"
                    value={formatDate(viewAlumni.auth.lastSignInAt)}
                  />
                )}

                <DetailRow
                  label="Email Verified"
                  value={
                    viewAlumni.auth
                      ? viewAlumni.auth.emailConfirmedAt
                        ? `Confirmed (${formatDate(
                            viewAlumni.auth.emailConfirmedAt
                          )})`
                        : "Not confirmed yet"
                      : "Unknown"
                  }
                />

                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    Bio
                  </dt>

                  <dd className="mt-1 text-sm leading-6 text-slate-700 dark:text-slate-200">
                    {viewAlumni.bio || "No bio provided."}
                  </dd>
                </div>
              </dl>

              <div className="mt-7 flex justify-end gap-3 border-t border-slate-200 pt-5 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowViewModal(false);
                    openEditModal(viewAlumni);
                  }}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Edit Profile
                </button>

                <button
                  type="button"
                  onClick={() => setShowViewModal(false)}
                  className="rounded-lg bg-[#087f8c] px-5 py-2.5 text-sm font-semibold text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

/* ============================================================
   Validation: keep base64 payloads under the API's 3 MB limit
============================================================ */

async function validatePhotoSize(dataUrl: string): Promise<string | null> {
  const bytes = Math.ceil((dataUrl.length - dataUrl.indexOf(",") - 1) * 0.75);

  if (bytes > 3 * 1024 * 1024) {
    return "The photo is too large after compression. Please choose a smaller image.";
  }

  return null;
}

/* ============================================================
   Reusable form components
============================================================ */

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

function PhotoField({
  preview,
  busy,
  onSelect,
  onRemove,
  error,
  currentPhoto,
  markedForRemoval,
}: {
  preview: string;
  busy: boolean;
  onSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
  error: string;
  currentPhoto?: string | null;
  markedForRemoval?: boolean;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-700">
      <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-200">
        Profile Photo
      </p>

      {(preview || currentPhoto) && !markedForRemoval ? (
        <img
          src={(preview || currentPhoto) as string}
          alt="Profile preview"
          className="h-28 w-28 rounded-xl object-cover"
        />
      ) : (
        <div className="flex h-28 w-28 items-center justify-center rounded-xl bg-slate-100 text-3xl dark:bg-slate-800">
          👤
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        <label className="cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:text-slate-200">
          {busy ? "Processing..." : "Replace Photo"}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={onSelect}
            disabled={busy}
            className="hidden"
          />
        </label>

        {(preview || currentPhoto) && (
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Remove Photo
          </button>
        )}
      </div>

      {markedForRemoval && (
        <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
          Photo will be removed when you save.
        </p>
      )}

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        JPG, PNG or WebP · automatically compressed.
      </p>

      {error && (
        <p className="mt-2 text-xs font-semibold text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}

function DetailRow({
  label,
  value,
  isLink,
}: {
  label: string;
  value: string | null | undefined;
  isLink?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </dt>

      <dd className="mt-1 break-words text-sm text-slate-700 dark:text-slate-200">
        {value ? (
          isLink ? (
            <a
              href={value}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#087f8c] hover:underline"
            >
              {value}
            </a>
          ) : (
            value
          )
        ) : (
          <span className="text-slate-400 dark:text-slate-500">—</span>
        )}
      </dd>
    </div>
  );
}
