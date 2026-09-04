"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  created_at: string;
};

type SocialLink = {
  id: number;
  platform: string;
  url: string;
  created_at: string;
};

const CONTACT_PLATFORMS = [
  "Official Email",
  "Facebook Page",
  "LinkedIn",
  "Instagram",
  "Department Facebook Page",
  "Department Facebook Group",
  "Department Website",
  "Department Email",
];

export default function AdminContactPage() {
  const supabase = createClient();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);

  const [loading, setLoading] = useState(true);
  const [socialLoading, setSocialLoading] = useState(true);

  const [error, setError] = useState("");
  const [socialError, setSocialError] = useState("");

  const [showSocialForm, setShowSocialForm] = useState(false);
  const [editingSocialId, setEditingSocialId] = useState<number | null>(null);

  const [platform, setPlatform] = useState("");
  const [url, setUrl] = useState("");

  const [savingSocial, setSavingSocial] = useState(false);

  // ============================================================
  // LOAD CONTACT MESSAGES
  // ============================================================

  async function loadMessages() {
    setLoading(true);
    setError("");

    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      setError(error.message);
      setMessages([]);
    } else {
      setMessages(data || []);
    }

    setLoading(false);
  }

  // ============================================================
  // LOAD SOCIAL LINKS
  // ============================================================

  async function loadSocialLinks() {
    setSocialLoading(true);
    setSocialError("");

    const { data, error } = await supabase
      .from("social_links")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      setSocialError(error.message);
      setSocialLinks([]);
    } else {
      setSocialLinks(data || []);
    }

    setSocialLoading(false);
  }

  useEffect(() => {
    loadMessages();
    loadSocialLinks();
  }, []);

  // ============================================================
  // RESET FORM
  // ============================================================

  function resetSocialForm() {
    setPlatform("");
    setUrl("");
    setEditingSocialId(null);
    setShowSocialForm(false);
  }

  // ============================================================
  // ADD / UPDATE SOCIAL LINK
  // ============================================================

  async function saveSocialLink() {
    if (!platform.trim()) {
      alert("Please select or enter a platform.");
      return;
    }

    if (!url.trim()) {
      alert("Please enter the value or URL.");
      return;
    }

    setSavingSocial(true);

    try {
      if (editingSocialId !== null) {
        const { error } = await supabase
          .from("social_links")
          .update({
            platform: platform.trim(),
            url: url.trim(),
          })
          .eq("id", editingSocialId);

        if (error) {
          alert(error.message);
          return;
        }

        alert("Contact information updated successfully.");
      } else {
        const { error } = await supabase
          .from("social_links")
          .insert({
            platform: platform.trim(),
            url: url.trim(),
          });

        if (error) {
          alert(error.message);
          return;
        }

        alert("Contact information added successfully.");
      }

      resetSocialForm();
      await loadSocialLinks();
    } finally {
      setSavingSocial(false);
    }
  }

  // ============================================================
  // EDIT
  // ============================================================

  function editSocialLink(item: SocialLink) {
    setEditingSocialId(item.id);
    setPlatform(item.platform);
    setUrl(item.url);
    setShowSocialForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // ============================================================
  // DELETE
  // ============================================================

  async function deleteSocialLink(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this contact/social information?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("social_links")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadSocialLinks();
  }

  // ============================================================
  // UPDATE MESSAGE STATUS
  // ============================================================

  async function updateStatus(id: number, status: string) {
    const { error } = await supabase
      .from("contact_messages")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadMessages();
  }

  // ============================================================
  // DELETE MESSAGE
  // ============================================================

  async function deleteMessage(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("contact_messages")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadMessages();
  }

  // ============================================================
  // ICON
  // ============================================================

  function getIcon(platform: string) {
    const value = platform.toLowerCase();

    if (value.includes("email")) return "📧";
    if (value.includes("facebook")) return "📘";
    if (value.includes("linkedin")) return "💼";
    if (value.includes("instagram")) return "📸";
    if (value.includes("website")) return "🌐";
    if (value.includes("group")) return "👥";

    return "🔗";
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-[#0a0f1a] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}

        <div className="mb-8">
          <a
            href="/admin/dashboard"
            className="text-sm font-medium text-[#087f8c] hover:underline"
          >
            ← Back to Admin Dashboard
          </a>

          <h1 className="mt-4 text-3xl font-bold text-[#0b1736] dark:text-white">
            Contact & Website Settings
          </h1>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Manage contact information, social media links, and contact
            messages from one place.
          </p>
        </div>

        {/* ============================================================
            WEBSITE CONTACT INFORMATION
        ============================================================ */}

        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-2xl font-bold text-[#0b1736] dark:text-white">
                Website Contact Information
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                These details appear on the public Contact page. Edit them
                here without changing the website code.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (showSocialForm) {
                  resetSocialForm();
                } else {
                  setEditingSocialId(null);
                  setPlatform("");
                  setUrl("");
                  setShowSocialForm(true);
                }
              }}
              className="rounded-lg bg-[#087f8c] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#066c76]"
            >
              {showSocialForm ? "Cancel" : "+ Add Information"}
            </button>
          </div>

          {/* FORM */}

          {showSocialForm && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">

              <h3 className="mb-4 text-lg font-bold text-[#0b1736] dark:text-white">
                {editingSocialId !== null
                  ? "Edit Contact Information"
                  : "Add Contact Information"}
              </h3>

              <div className="grid gap-4 md:grid-cols-2">

                {/* PLATFORM */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Type
                  </label>

                  <select
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  >
                    <option value="">
                      Select contact/social platform
                    </option>

                    {CONTACT_PLATFORMS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                {/* VALUE */}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Email / URL
                  </label>

                  <input
                    type={
                      platform.toLowerCase().includes("email")
                        ? "email"
                        : "url"
                    }
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder={
                      platform.toLowerCase().includes("email")
                        ? "example@diu.edu.bd"
                        : "https://example.com"
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                  />
                </div>

              </div>

              <div className="mt-5 flex flex-wrap gap-3">

                <button
                  type="button"
                  onClick={saveSocialLink}
                  disabled={savingSocial}
                  className="rounded-lg bg-[#0b1736] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingSocial
                    ? "Saving..."
                    : editingSocialId !== null
                    ? "Update Information"
                    : "Save Information"}
                </button>

                <button
                  type="button"
                  onClick={resetSocialForm}
                  disabled={savingSocial}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>

              </div>
            </div>
          )}

          {/* ERROR */}

          {socialError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <strong>Error:</strong> {socialError}
            </div>
          )}

          {/* LIST */}

          {socialLoading ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500 dark:bg-slate-800 dark:text-slate-400">
              Loading contact information...
            </div>
          ) : socialLinks.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">

              <div className="text-4xl">🔗</div>

              <h3 className="mt-3 font-bold text-[#0b1736] dark:text-white">
                No contact information added
              </h3>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add your official email, Facebook, Instagram, department
                links, and other information.
              </p>

            </div>
          ) : (
            <div className="mt-6 space-y-3">

              {socialLinks.map((item) => (

                <div
                  key={item.id}
                  className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800 sm:flex-row sm:items-center sm:justify-between"
                >

                  <div className="flex min-w-0 items-center gap-4">

                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#087f8c]/10 text-xl">
                      {getIcon(item.platform)}
                    </div>

                    <div className="min-w-0">

                      <p className="font-bold text-[#0b1736] dark:text-white">
                        {item.platform}
                      </p>

                      <p className="mt-1 break-all text-sm text-[#087f8c]">
                        {item.url}
                      </p>

                    </div>

                  </div>

                  <div className="flex shrink-0 gap-2">

                    <button
                      type="button"
                      onClick={() => editSocialLink(item)}
                      className="rounded-lg bg-[#0b1736] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#087f8c]"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteSocialLink(item.id)}
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                    >
                      Delete
                    </button>

                  </div>

                </div>

              ))}

            </div>
          )}

        </section>

        {/* ============================================================
            CONTACT MESSAGES
        ============================================================ */}

        <section>

          <div className="mb-6">

            <h2 className="text-2xl font-bold text-[#0b1736] dark:text-white">
              Contact Messages
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              View and manage messages submitted through the public Contact
              page.
            </p>

          </div>

          {/* LOADING */}

          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
              Loading messages...
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">

              <p className="font-semibold">
                Error loading messages
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>

            </div>
          )}

          {/* EMPTY */}

          {!loading && !error && messages.length === 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">

              <div className="text-4xl">
                📭
              </div>

              <h2 className="mt-4 text-xl font-bold text-[#0b1736] dark:text-white">
                No messages yet
              </h2>

              <p className="mt-2 text-slate-500 dark:text-slate-400">
                Messages submitted through the Contact page will appear here.
              </p>

            </div>
          )}

          {/* MESSAGES */}

          {!loading && !error && messages.length > 0 && (

            <div className="space-y-5">

              {messages.map((item) => {

                const isUnread =
                  item.status?.toLowerCase() === "unread";

                return (

                  <div
                    key={item.id}
                    className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                  >

                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h2 className="text-xl font-bold text-[#0b1736] dark:text-white">
                            {item.subject || "No subject"}
                          </h2>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${
                              isUnread
                                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                                : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                            }`}
                          >
                            {item.status || "Unread"}
                          </span>

                        </div>

                        <div className="mt-3 space-y-1 text-sm text-slate-500 dark:text-slate-400">

                          <p>
                            <strong className="text-slate-700 dark:text-slate-300">
                              From:
                            </strong>{" "}
                            {item.name}
                          </p>

                          <p>
                            <strong className="text-slate-700 dark:text-slate-300">
                              Email:
                            </strong>{" "}

                            <a
                              href={`mailto:${item.email}`}
                              className="text-[#087f8c] hover:underline"
                            >
                              {item.email}
                            </a>
                          </p>

                          <p>
                            <strong className="text-slate-700 dark:text-slate-300">
                              Date:
                            </strong>{" "}

                            {new Date(
                              item.created_at
                            ).toLocaleString()}
                          </p>

                        </div>

                      </div>

                      <div className="flex flex-wrap gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            updateStatus(
                              item.id,
                              isUnread ? "Read" : "Unread"
                            )
                          }
                          className="rounded-lg bg-[#0b1736] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#087f8c]"
                        >
                          {isUnread
                            ? "Mark as Read"
                            : "Mark as Unread"}
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteMessage(item.id)
                          }
                          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
                        >
                          Delete
                        </button>

                      </div>

                    </div>

                    <div className="mt-5 rounded-xl bg-slate-50 p-5 dark:bg-slate-800/70">

                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700 dark:text-slate-200">
                        {item.message}
                      </p>

                    </div>

                  </div>
                );
              })}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}
