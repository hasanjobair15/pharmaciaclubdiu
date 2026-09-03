"use client";

import { useEffect, useMemo, useState } from "react";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

type Panel =
  | "Faculty Advisory Panel"
  | "Student Advisory Panel"
  | "Executive Committee";

type Member = {
  id: number;
  name: string;
  position: string;
  panel: Panel;
  session: string | null;
  is_current: boolean;
  batch: string | null;
  photo_url: string | null;
  bio: string | null;
  facebook_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  display_order: number | null;
};

const panels: Panel[] = [
  "Faculty Advisory Panel",
  "Student Advisory Panel",
  "Executive Committee",
];

const emptyForm = {
  name: "",
  position: "",
  panel: "Executive Committee" as Panel,
  session: "Fall 2026",
  is_current: true,
  batch: "",
  photo_url: "",
  bio: "",
  facebook_url: "",
  linkedin_url: "",
  instagram_url: "",
  display_order: 0,
};

export default function CommitteeManager() {
  const supabase = createClient();

  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [selectedSession, setSelectedSession] = useState("");
  const [sessionInput, setSessionInput] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadMembers() {
    setLoading(true);

    const { data, error } = await supabase
      .from("committee")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      setMessage(error.message);
    } else {
      setMembers(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMembers();
  }, []);

  const currentSession =
    members.find((member) => member.is_current)?.session ?? "";

  const sessions = useMemo(() => {
    return Array.from(
      new Set(
        members
          .map((member) => member.session)
          .filter((session): session is string => Boolean(session))
      )
    );
  }, [members]);

  const previousSessions = sessions.filter(
    (session) => session !== currentSession
  );

  const visibleMembers = selectedSession
    ? members.filter((member) => member.session === selectedSession)
    : members.filter((member) => member.is_current);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: name === "display_order" ? Number(value) : value,
    }));
  }

  function handlePanelChange(
    e: React.ChangeEvent<HTMLSelectElement>
  ) {
    setForm((current) => ({
      ...current,
      panel: e.target.value as Panel,
    }));
  }

  function handleCurrentChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    setForm((current) => ({
      ...current,
      is_current: e.target.checked,
    }));
  }

  function handlePhotoChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Please select an image smaller than 10 MB.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMessage("");
  }

  async function uploadPhoto(file: File) {
    setUploading(true);

    try {
      setMessage("Compressing photo...");

      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: "image/jpeg",
      });

      setMessage("Uploading photo...");

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}.jpg`;

      const filePath = `committee/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("committee-photos")
        .upload(filePath, compressedFile, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage
        .from("committee-photos")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      throw new Error(
        error instanceof Error
          ? error.message
          : "Photo upload failed."
      );
    } finally {
      setUploading(false);
    }
  }

  async function makeSessionCurrent(sessionName: string) {
    if (!sessionName.trim()) {
      setMessage("Session name is required.");
      return;
    }

    const confirmed = window.confirm(
      `Make "${sessionName}" the current committee?`
    );

    if (!confirmed) return;

    setSaving(true);
    setMessage("");

    try {
      const { error } = await supabase
        .from("committee")
        .update({ is_current: false })
        .neq("session", sessionName);

      if (error) {
        throw new Error(error.message);
      }

      const { error: currentError } = await supabase
        .from("committee")
        .update({ is_current: true })
        .eq("session", sessionName);

      if (currentError) {
        throw new Error(currentError.message);
      }

      setMessage(
        `"${sessionName}" is now the current committee.`
      );

      setSelectedSession("");
      await loadMembers();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to change current committee."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.name.trim() || !form.position.trim()) {
      setMessage("Name and position are required.");
      return;
    }

    if (!form.panel) {
      setMessage("Please select a panel.");
      return;
    }

    if (!form.session.trim()) {
      setMessage("Session is required.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      let photoUrl = form.photo_url;

      if (selectedFile) {
        photoUrl = await uploadPhoto(selectedFile);
      }

      const sessionName = form.session.trim();

      /*
       * If this is a new current-session member,
       * make the whole session current and every other
       * session non-current.
       */
      if (form.is_current) {
        const { error: otherSessionsError } = await supabase
          .from("committee")
          .update({ is_current: false })
          .neq("session", sessionName);

        if (otherSessionsError) {
          throw new Error(otherSessionsError.message);
        }

        const { error: sameSessionError } = await supabase
          .from("committee")
          .update({ is_current: true })
          .eq("session", sessionName);

        if (sameSessionError) {
          throw new Error(sameSessionError.message);
        }
      }

      const memberData = {
        name: form.name.trim(),
        position: form.position.trim(),
        panel: form.panel,
        session: sessionName,
        is_current: form.is_current,
        batch: form.batch.trim() || null,
        photo_url: photoUrl.trim() || null,
        bio: form.bio.trim() || null,
        facebook_url: form.facebook_url.trim() || null,
        linkedin_url: form.linkedin_url.trim() || null,
        instagram_url: form.instagram_url.trim() || null,
        display_order: Number(form.display_order) || 0,
      };

      setMessage("Saving member...");

      if (editingId !== null) {
        const { error } = await supabase
          .from("committee")
          .update(memberData)
          .eq("id", editingId);

        if (error) {
          throw new Error(error.message);
        }

        setMessage("Member updated successfully.");
      } else {
        const { error } = await supabase
          .from("committee")
          .insert(memberData);

        if (error) {
          throw new Error(error.message);
        }

        setMessage("Member added successfully.");
      }

      resetForm();
      await loadMembers();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  function editMember(member: Member) {
    setEditingId(member.id);

    setForm({
      name: member.name,
      position: member.position,
      panel: member.panel,
      session: member.session ?? "Fall 2026",
      is_current: member.is_current,
      batch: member.batch ?? "",
      photo_url: member.photo_url ?? "",
      bio: member.bio ?? "",
      facebook_url: member.facebook_url ?? "",
      linkedin_url: member.linkedin_url ?? "",
      instagram_url: member.instagram_url ?? "",
      display_order: member.display_order ?? 0,
    });

    setSelectedFile(null);
    setPreviewUrl("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteMember(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this committee member?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("committee")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Member deleted successfully.");
      await loadMembers();
    }
  }

  function resetForm() {
    setEditingId(null);

    setForm({
      ...emptyForm,
      session: currentSession || "Fall 2026",
      is_current: true,
    });

    setSelectedFile(null);
    setPreviewUrl("");
  }

  function startAddingToSession(
    session: string,
    isCurrent: boolean
  ) {
    setEditingId(null);

    setForm({
      ...emptyForm,
      session,
      is_current: isCurrent,
    });

    setSelectedFile(null);
    setPreviewUrl("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function addNewSession() {
    const name = sessionInput.trim();

    if (!name) {
      setMessage("Enter a session name first.");
      return;
    }

    setSelectedSession(name);
    setSessionInput("");

    setForm({
      ...emptyForm,
      session: name,
      is_current: false,
    });

    setMessage(
      `Ready to add members to "${name}".`
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const currentPhoto = previewUrl || form.photo_url;

  return (
    <main className="min-h-screen bg-[#f7faff] text-[#0b1736]">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#087f8c]">
              Pharmacia Club DIU
            </p>

            <h1 className="mt-1 text-2xl font-black">
              Committee Manager
            </h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                (window.location.href = "/admin/dashboard")
              }
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold hover:border-[#087f8c] hover:text-[#087f8c]"
            >
              Dashboard
            </button>

            <button
              onClick={() =>
                (window.location.href = "/committee")
              }
              className="rounded-full bg-[#087f8c] px-5 py-2 text-sm font-semibold text-white hover:bg-[#066b76]"
            >
              View Site
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {/* ADD / EDIT MEMBER */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
              {editingId !== null
                ? "Edit Member"
                : "Add Member"}
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {editingId !== null
                ? "Update Committee Member"
                : "Add Committee Member"}
            </h2>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 md:grid-cols-2"
          >
            <Input
              label="Name *"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Member name"
            />

            <Input
              label="Position *"
              name="position"
              value={form.position}
              onChange={handleChange}
              placeholder="President"
            />

            {/* PANEL */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Panel *
              </label>

              <select
                value={form.panel}
                onChange={handlePanelChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20"
              >
                {panels.map((panel) => (
                  <option key={panel} value={panel}>
                    {panel}
                  </option>
                ))}
              </select>
            </div>

            {/* SESSION */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Session *
              </label>

              <input
                name="session"
                value={form.session}
                onChange={handleChange}
                placeholder="Fall 2026"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20"
              />

              <p className="mt-2 text-xs text-slate-500">
                Use any name you want: Spring 2025,
                Session 2024, Fall 2026, etc.
              </p>
            </div>

            {/* BATCH */}
            <Input
              label="Batch"
              name="batch"
              value={form.batch}
              onChange={handleChange}
              placeholder="30th Batch"
            />

            {/* CURRENT */}
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
              <input
                id="is_current"
                type="checkbox"
                checked={form.is_current}
                onChange={handleCurrentChange}
                className="h-4 w-4 accent-[#087f8c]"
              />

              <label
                htmlFor="is_current"
                className="ml-3 text-sm font-semibold"
              >
                Current Committee
              </label>
            </div>

            {/* PHOTO */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Committee Photo
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />

              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG or WebP • Maximum 10 MB
              </p>

              {currentPhoto && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <img
                    src={currentPhoto}
                    alt="Photo preview"
                    className="h-56 w-full object-cover"
                  />
                </div>
              )}
            </div>

            {/* SOCIAL */}
            <Input
              label="Facebook URL"
              name="facebook_url"
              value={form.facebook_url}
              onChange={handleChange}
              placeholder="https://facebook.com/..."
            />

            <Input
              label="LinkedIn URL"
              name="linkedin_url"
              value={form.linkedin_url}
              onChange={handleChange}
              placeholder="https://linkedin.com/in/..."
            />

            <Input
              label="Instagram URL"
              name="instagram_url"
              value={form.instagram_url}
              onChange={handleChange}
              placeholder="https://instagram.com/..."
            />

            <Input
              label="Display Order"
              name="display_order"
              type="number"
              value={form.display_order}
              onChange={handleChange}
              placeholder="1"
            />

            {/* BIO */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Bio
              </label>

              <textarea
                name="bio"
                value={form.bio}
                onChange={handleChange}
                rows={4}
                placeholder="Short profile..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20"
              />
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={saving || uploading}
                className="rounded-xl bg-[#087f8c] px-6 py-3 font-bold text-white hover:bg-[#066b76] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading
                  ? "Uploading Photo..."
                  : saving
                  ? "Saving..."
                  : editingId !== null
                  ? "Update Member"
                  : "Add Member"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-6 py-3 font-bold hover:border-slate-400"
                >
                  Cancel
                </button>
              )}
            </div>

            {message && (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm md:col-span-2">
                {message}
              </div>
            )}
          </form>
        </div>

        {/* SESSION MANAGEMENT */}
        <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
              Committee Sessions
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Manage Sessions
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Create any session name and manage its
              members separately.
            </p>
          </div>

          {/* NEW SESSION */}
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              value={sessionInput}
              onChange={(e) =>
                setSessionInput(e.target.value)
              }
              placeholder="Example: Spring 2027"
              className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20"
            />

            <button
              type="button"
              onClick={addNewSession}
              className="rounded-xl bg-[#087f8c] px-6 py-3 font-bold text-white hover:bg-[#066b76]"
            >
              Add / Manage Session
            </button>
          </div>

          {/* CURRENT SESSION */}
          {currentSession && (
            <div className="mt-8">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#087f8c]">
                Current
              </p>

              <div className="flex flex-col gap-3 rounded-2xl border border-[#087f8c]/20 bg-[#e9f8f9] p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-lg font-black">
                    {currentSession}
                  </h3>

                  <p className="mt-1 text-sm text-slate-600">
                    {members.filter(
                      (member) =>
                        member.session === currentSession
                    ).length}{" "}
                    members
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    startAddingToSession(
                      currentSession,
                      true
                    )
                  }
                  className="rounded-full bg-[#087f8c] px-5 py-2 text-sm font-bold text-white"
                >
                  Add Member
                </button>
              </div>
            </div>
          )}

          {/* PREVIOUS */}
          <div className="mt-8">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#087f8c]">
              Previous / Other Sessions
            </p>

            {previousSessions.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                No previous sessions yet.
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {previousSessions.map((session) => {
                  const count = members.filter(
                    (member) =>
                      member.session === session
                  ).length;

                  return (
                    <div
                      key={session}
                      className={`rounded-2xl border p-5 ${
                        selectedSession === session
                          ? "border-[#087f8c] bg-[#f0fbfc]"
                          : "border-slate-200 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <h3 className="font-black">
                            {session}
                          </h3>

                          <p className="mt-1 text-xs text-slate-500">
                            {count} members
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedSession(
                                selectedSession === session
                                  ? ""
                                  : session
                              )
                            }
                            className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold hover:border-[#087f8c] hover:text-[#087f8c]"
                          >
                            {selectedSession === session
                              ? "Close"
                              : "Manage"}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              startAddingToSession(
                                session,
                                false
                              )
                            }
                            className="rounded-full bg-[#087f8c] px-4 py-2 text-xs font-bold text-white"
                          >
                            Add Member
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              makeSessionCurrent(session)
                            }
                            disabled={saving}
                            className="rounded-full border border-amber-300 px-4 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50 disabled:opacity-50"
                          >
                            Make Current
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* MEMBER LIST */}
        <div className="mt-10">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
              {selectedSession
                ? selectedSession
                : "Current Committee"}
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {selectedSession
                ? "Session Members"
                : currentSession || "Committee Members"}
            </h2>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-white p-8 text-center">
              Loading committee...
            </div>
          ) : visibleMembers.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center text-slate-500">
              No members found for this session.
            </div>
          ) : (
            <>
              {panels.map((panel) => {
                const panelMembers =
                  visibleMembers.filter(
                    (member) => member.panel === panel
                  );

                if (panelMembers.length === 0) {
                  return null;
                }

                return (
                  <section key={panel} className="mb-10">
                    <div className="mb-4">
                      <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
                        {panel}
                      </p>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                      {panelMembers.map((member) => (
                        <MemberCard
                          key={member.id}
                          member={member}
                          onEdit={editMember}
                          onDelete={deleteMember}
                        />
                      ))}
                    </div>
                  </section>
                );
              })}
            </>
          )}
        </div>
      </section>
    </main>
  );
}

function MemberCard({
  member,
  onEdit,
  onDelete,
}: {
  member: Member;
  onEdit: (member: Member) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <div className="aspect-[4/3] bg-gradient-to-br from-[#dff7f8] to-[#e8eefb]">
        {member.photo_url ? (
          <img
            src={member.photo_url}
            alt={member.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white text-3xl font-black text-[#087f8c] shadow">
              {member.name.charAt(0).toUpperCase()}
            </div>
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-[#087f8c]">
          {member.position}
        </p>

        <h3 className="mt-2 text-xl font-black">
          {member.name}
        </h3>

        {member.batch && (
          <p className="mt-1 text-sm text-slate-500">
            {member.batch}
          </p>
        )}

        <p className="mt-1 text-xs text-slate-400">
          {member.session}
        </p>

        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={() => onEdit(member)}
            className="rounded-full bg-[#087f8c] px-4 py-2 text-xs font-bold text-white hover:bg-[#066b76]"
          >
            Edit
          </button>

          <button
            type="button"
            onClick={() => onDelete(member.id)}
            className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50"
          >
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  value: string | number;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20"
      />
    </div>
  );
}