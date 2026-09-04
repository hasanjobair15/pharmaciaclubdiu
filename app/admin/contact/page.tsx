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

  // =========================================================
  // LOAD CONTACT MESSAGES
  // =========================================================

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

  // =========================================================
  // LOAD SOCIAL / CONTACT LINKS
  // =========================================================

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

  // =========================================================
  // RESET FORM
  // =========================================================

  function resetSocialForm() {
    setPlatform("");
    setUrl("");
    setEditingSocialId(null);
    setShowSocialForm(false);
    setSavingSocial(false);
  }

  // =========================================================
  // ADD / UPDATE LINK
  // =========================================================

  async function saveSocialLink() {
    const cleanPlatform = platform.trim();
    const cleanUrl = url.trim();

    if (!cleanPlatform) {
      alert("Please enter a name.");
      return;
    }

    if (!cleanUrl) {
      alert("Please enter a URL, email address, phone number, or value.");
      return;
    }

    setSavingSocial(true);

    try {
      if (editingSocialId !== null) {
        const { error } = await supabase
          .from("social_links")
          .update({
            platform: cleanPlatform,
            url: cleanUrl,
          })
          .eq("id", editingSocialId);

        if (error) {
          alert(error.message);
          return;
        }

        alert("Information updated successfully.");
      } else {
        const { error } = await supabase
          .from("social_links")
          .insert({
            platform: cleanPlatform,
            url: cleanUrl,
          });

        if (error) {
          alert(error.message);
          return;
        }

        alert("Information added successfully.");
      }

      resetSocialForm();
      await loadSocialLinks();
    } finally {
      setSavingSocial(false);
    }
  }

  // =========================================================
  // EDIT LINK
  // =========================================================

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

  // =========================================================
  // DELETE LINK
  // =========================================================

  async function deleteSocialLink(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this information?"
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

  // =========================================================
  // UPDATE MESSAGE STATUS
  // =========================================================

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

  // =========================================================
  // DELETE MESSAGE
  // =========================================================

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

  // =========================================================
  // RETURN
  // =========================================================

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 dark:bg-[#0a0f1a] dark:text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <div className="mb-8">
          <a
            href="/admin/dashboard"
            className="text-sm font-semibold text-[#087f8c] hover:underline"
          >
            ← Back to Admin Dashboard
          </a>

          <h1 className="mt-4 text-3xl font-bold text-[#0b1736] dark:text-white">
            Contact & Website Settings
          </h1>

          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Manage your website contact information, social media links,
            phone numbers, email addresses, and contact messages.
          </p>
        </div>

        {/* =====================================================
            CONTACT / SOCIAL INFORMATION
        ===================================================== */}

        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">

          {/* SECTION HEADER */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <h2 className="text-2xl font-bold text-[#0b1736] dark:text-white">
                Website Contact & Social Links
              </h2>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Add, edit, or remove Facebook, Instagram, email, phone,
                website, LinkedIn, YouTube, and other links.
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

          {/* ===================================================
              ADD / EDIT FORM
          =================================================== */}

          {showSocialForm && (
            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-slate-800">

              <h3 className="mb-5 text-lg font-bold text-[#0b1736] dark:text-white">
                {editingSocialId !== null
                  ? "Edit Information"
                  : "Add Information"}
              </h3>

              <div className="grid gap-5 md:grid-cols-2">

                {/* NAME */}

                <div>
                  <label
                    htmlFor="platform"
                    className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200"
                  >
                    Name / Type
                  </label>

                  <input
                    id="platform"
                    type="text"
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    placeholder="Facebook"
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 caret-[#087f8c] outline-none placeholder:text-slate-400 focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-600 dark:bg-[#111827] dark:text-white dark:placeholder:text-slate-500"
                  />

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Examples: Facebook, Instagram, Email, Phone, Website,
                    LinkedIn, YouTube
                  </p>
                </div>

                {/* VALUE */}

                <div>
                  <label
                    htmlFor="social-url"
                    className="mb-2 block text-sm font-semibold text-slate-800 dark:text-slate-200"
                  >
                    URL / Email / Phone
                  </label>

                  <input
                    id="social-url"
                    type="text"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://facebook.com/yourpage"
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-900 caret-[#087f8c] outline-none placeholder:text-slate-400 focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-600 dark:bg-[#111827] dark:text-white dark:placeholder:text-slate-500"
                  />

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Example: URL, email address, phone number, or other
                    contact information.
                  </p>
                </div>
              </div>

              {/* FORM BUTTONS */}

              <div className="mt-6 flex flex-wrap gap-3">

                <button
                  type="button"
                  onClick={saveSocialLink}
                  disabled={savingSocial}
                  className="rounded-lg bg-[#0b1736] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-60"
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
                  className="rounded-lg border border-slate-300 bg-white px-6 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>

              </div>
            </div>
          )}

          {/* ===================================================
              ERROR
          =================================================== */}

          {socialError && (
            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              <p className="font-bold">
                Unable to load website information
              </p>

              <p className="mt-1">
                {socialError}
              </p>

              <p className="mt-2 text-xs">
                Make sure the <strong>social_links</strong> table exists
                in Supabase and that your admin has permission to access it.
              </p>
            </div>
          )}

          {/* ===================================================
              EXISTING LINKS
          =================================================== */}

          {socialLoading ? (
            <div className="mt-6 rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-400">
              Loading website information...
            </div>
          ) : socialLinks.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-600">

              <div className="text-4xl">
                🔗
              </div>

              <h3 className="mt-3 font-bold text-[#0b1736] dark:text-white">
                No information added yet
              </h3>

              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                Click "Add Information" to add your first social link,
                email, phone number, or website.
              </p>

            </div>
          ) : (
            <div className="mt-6 space-y-3">

              {socialLinks.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800"
                >

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                    {/* INFORMATION */}

                    <div className="min-w-0 flex-1">

                      <p className="font-bold text-[#0b1736] dark:text-white">
                        {item.platform}
                      </p>

                      <a
                        href={
                          item.url.startsWith("http://") ||
                          item.url.startsWith("https://") ||
                          item.url.startsWith("mailto:") ||
                          item.url.startsWith("tel:")
                            ? item.url
                            : `https://${item.url}`
                        }
                        target={
                          item.url.startsWith("mailto:") ||
                          item.url.startsWith("tel:")
                            ? undefined
                            : "_blank"
                        }
                        rel={
                          item.url.startsWith("mailto:") ||
                          item.url.startsWith("tel:")
                            ? undefined
                            : "noopener noreferrer"
                        }
                        className="mt-1 block break-all text-sm font-medium text-[#087f8c] hover:underline"
                      >
                        {item.url}
                      </a>

                    </div>

                    {/* ACTIONS */}

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

                </div>
              ))}

            </div>
          )}
        </section>

        {/* =====================================================
            CONTACT MESSAGES
        ===================================================== */}

        <section>

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-[#0b1736] dark:text-white">
              Contact Messages
            </h2>

            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              View and manage messages submitted through the website
              contact form.
            </p>
          </div>

          {/* LOADING */}

          {loading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
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

              <p className="mt-2 text-slate-600 dark:text-slate-400">
                Messages submitted through the Contact page will appear
                here.
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

                        <div className="mt-3 space-y-1 text-sm text-slate-600 dark:text-slate-400">

                          <p>
                            <strong className="text-slate-800 dark:text-slate-200">
                              From:
                            </strong>{" "}
                            {item.name}
                          </p>

                          <p>
                            <strong className="text-slate-800 dark:text-slate-200">
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
                            <strong className="text-slate-800 dark:text-slate-200">
                              Date:
                            </strong>{" "}

                            {new Date(
                              item.created_at
                            ).toLocaleString()}
                          </p>

                        </div>

                      </div>

                      {/* MESSAGE ACTIONS */}

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

                    {/* MESSAGE BODY */}

                    <div className="mt-5 rounded-xl bg-slate-50 p-5 dark:bg-slate-800/70">

                      <p className="whitespace-pre-wrap text-sm leading-7 text-slate-800 dark:text-slate-200">
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
