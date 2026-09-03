"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Issue = {
  id: number;
  title: string;
  season: string;
  year: number;
  description: string | null;
  cover_image_url: string | null;
  is_current: boolean;
  is_published: boolean;
  created_at: string;
};

const seasons = ["Spring", "Fall"];

export default function AdminMagazinePage() {
  const router = useRouter();
  const supabase = createClient();

  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [season, setSeason] = useState("Spring");
  const [year, setYear] = useState(new Date().getFullYear());
  const [description, setDescription] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [isCurrent, setIsCurrent] = useState(false);
  const [isPublished, setIsPublished] = useState(false);

  useEffect(() => {
    loadIssues();
  }, []);

  async function loadIssues() {
    setLoading(true);

    const { data, error } = await supabase
      .from("magazine_issues")
      .select("*")
      .order("year", { ascending: false })
      .order("season", { ascending: false });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setIssues(data || []);
    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setSeason("Spring");
    setYear(new Date().getFullYear());
    setDescription("");
    setCoverImage(null);
    setIsCurrent(false);
    setIsPublished(false);
  }

  function editIssue(issue: Issue) {
    setEditingId(issue.id);
    setTitle(issue.title);
    setSeason(issue.season);
    setYear(issue.year);
    setDescription(issue.description || "");
    setCoverImage(null);
    setIsCurrent(issue.is_current);
    setIsPublished(issue.is_published);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function uploadCover(file: File) {
    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/-+/g, "-");

    const fileName = `${Date.now()}-${safeName}`;
    const filePath = `magazine/covers/${fileName}`;

    const { error } = await supabase.storage
      .from("committee-photos")
      .upload(filePath, file, {
        upsert: false,
      });

    if (error) {
      throw new Error(`Cover upload failed: ${error.message}`);
    }

    const { data } = supabase.storage
      .from("committee-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function saveIssue(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter the magazine title.");
      return;
    }

    if (!year || year < 2000) {
      alert("Please enter a valid year.");
      return;
    }

    setSaving(true);

    try {
      let coverImageUrl: string | null = null;

      if (coverImage) {
        coverImageUrl = await uploadCover(coverImage);
      }

      const issueData = {
        title: title.trim(),
        season,
        year,
        description: description.trim() || null,
        ...(coverImageUrl
          ? { cover_image_url: coverImageUrl }
          : {}),
        is_current: isCurrent,
        is_published: isPublished,
      };

      /*
       * Only one issue can be the current issue.
       */
      if (isCurrent) {
        const { error: resetError } = await supabase
          .from("magazine_issues")
          .update({ is_current: false })
          .neq("id", editingId ?? -1);

        if (resetError) {
          throw new Error(resetError.message);
        }
      }

      if (editingId) {
        const { error } = await supabase
          .from("magazine_issues")
          .update(issueData)
          .eq("id", editingId);

        if (error) {
          throw new Error(error.message);
        }

        alert("Magazine issue updated successfully.");
      } else {
        const { error } = await supabase
          .from("magazine_issues")
          .insert(issueData);

        if (error) {
          throw new Error(error.message);
        }

        alert("Magazine issue added successfully.");
      }

      resetForm();
      await loadIssues();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteIssue(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this magazine issue? All pages belonging to this issue will also be deleted."
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("magazine_issues")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    await loadIssues();
  }

  async function makeCurrent(id: number) {
    const { error: resetError } = await supabase
      .from("magazine_issues")
      .update({ is_current: false })
      .neq("id", id);

    if (resetError) {
      alert(resetError.message);
      return;
    }

    const { error } = await supabase
      .from("magazine_issues")
      .update({ is_current: true })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadIssues();
  }

  async function togglePublished(
    id: number,
    published: boolean
  ) {
    const { error } = await supabase
      .from("magazine_issues")
      .update({
        is_published: published,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadIssues();
  }

  return (
    <main className="min-h-screen bg-[#f7faff] text-[#0b1736]">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <button
              onClick={() => router.push("/admin/dashboard")}
              className="mb-2 text-sm font-semibold text-[#087f8c] hover:underline"
            >
              ← Back to Dashboard
            </button>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#087f8c]">
              Pharmacia Club DIU
            </p>

            <h1 className="mt-1 text-2xl font-black">
              Magazine Management
            </h1>
          </div>

          <button
            onClick={() => router.push("/admin/dashboard")}
            className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold transition hover:border-[#087f8c] hover:text-[#087f8c]"
          >
            Dashboard
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {/* INTRO */}
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
            Digital Magazine
          </p>

          <h2 className="mt-3 text-4xl font-black">
            Manage Magazine Issues
          </h2>

          <p className="mt-4 max-w-3xl text-slate-500">
            Create semester-wise magazine issues, upload covers,
            publish issues and manage the current edition.
          </p>
        </div>

        {/* FORM */}
        <div className="mb-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black">
                {editingId
                  ? "Edit Magazine Issue"
                  : "Add New Magazine Issue"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Example: Spring 2027 or Fall 2027
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:border-red-400 hover:text-red-500"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={saveIssue} className="space-y-6">
            {/* TITLE */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Magazine Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pharmacia Magazine — Fall 2026"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#087f8c]"
              />
            </div>

            {/* SEASON + YEAR */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Semester / Season
                </label>

                <select
                  value={season}
                  onChange={(e) => setSeason(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#087f8c]"
                >
                  {seasons.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Year
                </label>

                <input
                  type="number"
                  value={year}
                  onChange={(e) =>
                    setYear(Number(e.target.value))
                  }
                  min={2000}
                  max={2100}
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#087f8c]"
                />
              </div>
            </div>

            {/* DESCRIPTION */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Description
              </label>

              <textarea
                value={description}
                onChange={(e) =>
                  setDescription(e.target.value)
                }
                rows={4}
                placeholder="Short description about this magazine issue..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#087f8c]"
              />
            </div>

            {/* COVER */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Cover Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setCoverImage(e.target.files?.[0] || null)
                }
                className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />

              {editingId && (
                <p className="mt-2 text-xs text-slate-500">
                  Leave empty if you want to keep the existing cover.
                </p>
              )}
            </div>

            {/* OPTIONS */}
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={isCurrent}
                  onChange={(e) =>
                    setIsCurrent(e.target.checked)
                  }
                  className="h-5 w-5"
                />

                <div>
                  <p className="font-bold">
                    Current Issue
                  </p>

                  <p className="text-xs text-slate-500">
                    Mark this as the current magazine.
                  </p>
                </div>
              </label>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 p-4">
                <input
                  type="checkbox"
                  checked={isPublished}
                  onChange={(e) =>
                    setIsPublished(e.target.checked)
                  }
                  className="h-5 w-5"
                />

                <div>
                  <p className="font-bold">
                    Published
                  </p>

                  <p className="text-xs text-slate-500">
                    Make this issue visible publicly.
                  </p>
                </div>
              </label>
            </div>

            {/* SAVE */}
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#0b1736] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Magazine Issue"
                : "Add Magazine Issue"}
            </button>
          </form>
        </div>

        {/* ISSUES */}
        <div>
          <div className="mb-6">
            <h3 className="text-2xl font-black">
              Magazine Issues
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Manage all semester-wise magazine editions.
            </p>
          </div>

          {loading ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-slate-500">
                Loading magazine issues...
              </p>
            </div>
          ) : issues.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
              <p className="font-semibold">
                No magazine issues found.
              </p>

              <p className="mt-2 text-sm text-slate-500">
                Add your first magazine issue above.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* COVER */}
                  <div className="aspect-[3/4] bg-slate-100">
                    {issue.cover_image_url ? (
                      <img
                        src={issue.cover_image_url}
                        alt={issue.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-8 text-center">
                        <div>
                          <div className="text-5xl">
                            📖
                          </div>

                          <p className="mt-4 font-black">
                            {issue.title}
                          </p>

                          <p className="mt-2 text-sm text-slate-500">
                            No cover uploaded
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* CONTENT */}
                  <div className="p-6">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                        {issue.season} {issue.year}
                      </span>

                      {issue.is_current && (
                        <span className="rounded-full bg-[#e8f8f9] px-3 py-1 text-xs font-bold text-[#087f8c]">
                          Current
                        </span>
                      )}

                      {issue.is_published ? (
                        <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-600">
                          Published
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600">
                          Draft
                        </span>
                      )}
                    </div>

                    <h4 className="mt-4 text-xl font-black">
                      {issue.title}
                    </h4>

                    {issue.description && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-500">
                        {issue.description}
                      </p>
                    )}

                    {/* ACTIONS */}
                    <div className="mt-6 grid gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/admin/magazine/${issue.id}`
                          )
                        }
                        className="rounded-xl bg-[#0b1736] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c]"
                      >
                        📄 Manage Pages
                      </button>

                      <button
                        onClick={() => editIssue(issue)}
                        className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold transition hover:border-[#087f8c] hover:text-[#087f8c]"
                      >
                        ✏️ Edit Issue
                      </button>

                      {!issue.is_current && (
                        <button
                          onClick={() => makeCurrent(issue.id)}
                          className="rounded-xl border border-[#087f8c] px-4 py-3 text-sm font-bold text-[#087f8c] transition hover:bg-[#e8f8f9]"
                        >
                          ⭐ Make Current
                        </button>
                      )}

                      <button
                        onClick={() =>
                          togglePublished(
                            issue.id,
                            !issue.is_published
                          )
                        }
                        className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold transition hover:border-amber-400 hover:text-amber-600"
                      >
                        {issue.is_published
                          ? "🙈 Unpublish"
                          : "🌐 Publish"}
                      </button>

                      <button
                        onClick={() =>
                          deleteIssue(issue.id)
                        }
                        className="rounded-xl border border-red-200 px-4 py-3 text-sm font-bold text-red-500 transition hover:bg-red-50"
                      >
                        🗑️ Delete Issue
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}