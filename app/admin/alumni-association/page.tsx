"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AssociationMember = {
  id: string;
  name: string;
  position: string;
  photo_url: string | null;
  bio: string | null;
  display_order: number;
  is_active: boolean;
};

export default function AdminAlumniAssociationPage() {
  const supabase = useMemo(() => createClient(), []);

  const [members, setMembers] = useState<AssociationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [bio, setBio] = useState("");
  const [displayOrder, setDisplayOrder] = useState("0");
  const [isActive, setIsActive] = useState(true);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadMembers();
  }, []);

  async function loadMembers() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("alumni_association_members")
      .select("*")
      .order("display_order", { ascending: true })
      .order("name", { ascending: true });

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
    } else {
      setMembers(data || []);
    }

    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setPosition("");
    setPhotoUrl("");
    setBio("");
    setDisplayOrder("0");
    setIsActive(true);
    setMessage("");
    setErrorMessage("");
  }

  function openAddForm() {
    resetForm();
    setShowForm(true);
  }

  function openEditForm(member: AssociationMember) {
    setEditingId(member.id);
    setName(member.name);
    setPosition(member.position);
    setPhotoUrl(member.photo_url || "");
    setBio(member.bio || "");
    setDisplayOrder(String(member.display_order));
    setIsActive(member.is_active);
    setMessage("");
    setErrorMessage("");
    setShowForm(true);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter the member's name.");
      setSaving(false);
      return;
    }

    if (!position.trim()) {
      setErrorMessage("Please enter the member's position.");
      setSaving(false);
      return;
    }

    const payload = {
      name: name.trim(),
      position: position.trim(),
      photo_url: photoUrl.trim() || null,
      bio: bio.trim() || null,
      display_order: Number(displayOrder) || 0,
      is_active: isActive,
    };

    if (editingId) {
      const { error } = await supabase
        .from("alumni_association_members")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        console.error(error);
        setErrorMessage(error.message);
      } else {
        setMessage("Association member updated successfully.");
        setShowForm(false);
        resetForm();
        await loadMembers();
      }
    } else {
      const { error } = await supabase
        .from("alumni_association_members")
        .insert(payload);

      if (error) {
        console.error(error);
        setErrorMessage(error.message);
      } else {
        setMessage("Association member added successfully.");
        setShowForm(false);
        resetForm();
        await loadMembers();
      }
    }

    setSaving(false);
  }

  async function deleteMember(id: string, memberName: string) {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${memberName}?`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("alumni_association_members")
      .delete()
      .eq("id", id);

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      return;
    }

    setMessage("Association member deleted successfully.");
    await loadMembers();
  }

  async function toggleActive(member: AssociationMember) {
    const { error } = await supabase
      .from("alumni_association_members")
      .update({
        is_active: !member.is_active,
      })
      .eq("id", member.id);

    if (error) {
      console.error(error);
      setErrorMessage(error.message);
      return;
    }

    await loadMembers();
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a]">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0a0f1a]">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
                Admin Panel
              </p>

              <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-[#0b1736] dark:text-white">
                Alumni Association
              </h1>

              <p className="mt-3 max-w-2xl text-slate-600 dark:text-slate-300">
                Manage the Alumni Association leadership and members displayed
                on the public website.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddForm}
              className="rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c]"
            >
              + Add Member
            </button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-8">
        {message && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {errorMessage}
          </div>
        )}

        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap gap-6">
            <div>
              <p className="text-2xl font-extrabold text-[#0b1736] dark:text-white">
                {members.length}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Total Members
              </p>
            </div>

            <div>
              <p className="text-2xl font-extrabold text-[#087f8c]">
                {members.filter((member) => member.is_active).length}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Active Members
              </p>
            </div>

            <div>
              <p className="text-2xl font-extrabold text-slate-400">
                {members.filter((member) => !member.is_active).length}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Hidden Members
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center dark:border-slate-800 dark:bg-slate-900">
            <p className="font-semibold text-slate-600 dark:text-slate-300">
              Loading association members...
            </p>
          </div>
        ) : members.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center dark:border-slate-800 dark:bg-slate-900">
            <div className="text-5xl">🎓</div>

            <h2 className="mt-5 text-2xl font-bold text-[#0b1736] dark:text-white">
              No association members yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 dark:text-slate-400">
              Add the President, Vice President, General Secretary, Treasurer,
              Executive Members and other association positions.
            </p>

            <button
              type="button"
              onClick={openAddForm}
              className="mt-6 rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white hover:bg-[#087f8c]"
            >
              + Add First Member
            </button>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {members.map((member) => (
              <article
                key={member.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    {member.photo_url ? (
                      <img
                        src={member.photo_url}
                        alt={member.name}
                        className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-3xl dark:bg-slate-800">
                        👤
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg font-bold text-[#0b1736] dark:text-white">
                        {member.name}
                      </h2>

                      <p className="mt-1 text-sm font-bold text-[#087f8c]">
                        {member.position}
                      </p>

                      <p className="mt-2 text-xs font-semibold text-slate-400">
                        Display Order: {member.display_order}
                      </p>
                    </div>
                  </div>

                  {member.bio && (
                    <p className="mt-5 line-clamp-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                      {member.bio}
                    </p>
                  )}

                  <div className="mt-5">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                        member.is_active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800"
                      }`}
                    >
                      {member.is_active ? "● Active" : "○ Hidden"}
                    </span>
                  </div>

                  <div className="mt-6 grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => openEditForm(member)}
                      className="rounded-full border border-slate-300 px-3 py-2 text-sm font-bold text-[#0b1736] hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:text-white"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleActive(member)}
                      className="rounded-full border border-slate-300 px-3 py-2 text-sm font-bold text-slate-600 hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:text-slate-200"
                    >
                      {member.is_active ? "Hide" : "Show"}
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteMember(member.id, member.name)}
                      className="rounded-full border border-red-200 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showForm && (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/50 px-4 py-8">
          <div className="mx-auto max-w-2xl rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.15em] text-[#087f8c]">
                  Alumni Association
                </p>

                <h2 className="mt-2 text-2xl font-extrabold text-[#0b1736] dark:text-white">
                  {editingId ? "Edit Member" : "Add Association Member"}
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Full Name *
                </label>

                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Md. Hasan Jobair"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#087f8c] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Position *
                </label>

                <input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="e.g. President"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#087f8c] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Photo URL
                </label>

                <input
                  type="url"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  placeholder="Paste image URL"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#087f8c] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  We will add direct photo upload from the existing
                  committee-photos storage later.
                </p>
              </div>

              {photoUrl && (
                <div>
                  <p className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Photo Preview
                  </p>

                  <img
                    src={photoUrl}
                    alt="Preview"
                    className="h-28 w-28 rounded-2xl object-cover"
                  />
                </div>
              )}

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Short Bio
                </label>

                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  placeholder="Short professional biography..."
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#087f8c] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Display Order
                </label>

                <input
                  type="number"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                  min="0"
                  placeholder="0"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none focus:border-[#087f8c] dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Lower numbers appear first. Example: President = 1,
                  Vice President = 2, General Secretary = 3.
                </p>
              </div>

              <label className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="h-5 w-5"
                />

                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                  Show this member on the public Alumni Association page
                </span>
              </label>

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errorMessage}
                </div>
              )}

              <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full border border-slate-300 px-6 py-3 text-sm font-bold text-slate-700 dark:border-slate-700 dark:text-slate-200"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-[#0b1736] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId
                    ? "Update Member"
                    : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}