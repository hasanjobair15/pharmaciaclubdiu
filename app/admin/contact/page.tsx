"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

type ContactMessage = {
  id: number;
  name: string;
  email: string;
  subject: string | null;
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

type ContactType = "social" | "email" | "phone";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export default function AdminContactPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(true);

  const [contactInfo, setContactInfo] = useState<SocialLink[]>([]);
  const [contactLoading, setContactLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const [contactType, setContactType] =
    useState<ContactType>("social");

  const [platform, setPlatform] = useState("");
  const [value, setValue] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // --------------------------------------------------
  // CHECK SUPABASE
  // --------------------------------------------------

  function checkSupabase() {
    if (!supabase) {
      setError(
        "Supabase configuration is missing. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel."
      );
      return false;
    }

    return true;
  }

  // --------------------------------------------------
  // LOAD CONTACT MESSAGES
  // --------------------------------------------------

  async function loadMessages() {
    if (!supabase) {
      setMessagesLoading(false);
      return;
    }

    setMessagesLoading(true);

    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading messages:", error);
      setError(error.message);
    } else {
      setMessages(data || []);
    }

    setMessagesLoading(false);
  }

  // --------------------------------------------------
  // LOAD CONTACT INFORMATION
  // --------------------------------------------------

  async function loadContactInfo() {
    if (!supabase) {
      setContactLoading(false);
      return;
    }

    setContactLoading(true);

    const { data, error } = await supabase
      .from("social_links")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error loading contact information:", error);
      setError(error.message);
    } else {
      setContactInfo(data || []);
    }

    setContactLoading(false);
  }

  // --------------------------------------------------
  // INITIAL LOAD
  // --------------------------------------------------

  useEffect(() => {
    loadMessages();
    loadContactInfo();
  }, []);

  // --------------------------------------------------
  // RESET FORM
  // --------------------------------------------------

  function resetForm() {
    setEditingId(null);
    setContactType("social");
    setPlatform("");
    setValue("");
    setShowForm(false);
    setError("");
  }

  // --------------------------------------------------
  // OPEN ADD FORM
  // --------------------------------------------------

  function openAddForm() {
    setEditingId(null);
    setContactType("social");
    setPlatform("");
    setValue("");
    setError("");
    setSuccess("");
    setShowForm(true);
  }

  // --------------------------------------------------
  // SAVE CONTACT INFORMATION
  // --------------------------------------------------

  async function saveContactInfo() {
    if (!checkSupabase()) return;

    setError("");
    setSuccess("");

    const cleanValue = value.trim();
    const cleanPlatform = platform.trim();

    if (!cleanValue) {
      setError("Please enter a value.");
      return;
    }

    if (contactType === "social" && !cleanPlatform) {
      setError("Please enter the social platform name.");
      return;
    }

    if (contactType === "email") {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(cleanValue)) {
        setError("Please enter a valid email address.");
        return;
      }
    }

    setSaving(true);

    let finalPlatform = cleanPlatform;

    if (contactType === "email") {
      finalPlatform = "Email";
    }

    if (contactType === "phone") {
      finalPlatform = "Phone";
    }

    const payload = {
      platform: finalPlatform,
      url: cleanValue,
    };

    // UPDATE
    if (editingId !== null) {
      const { error } = await supabase!
        .from("social_links")
        .update(payload)
        .eq("id", editingId);

      if (error) {
        console.error("Update error:", error);
        setError(error.message);
      } else {
        setSuccess("Information updated successfully.");
        resetForm();
        await loadContactInfo();
      }
    }

    // INSERT
    else {
      const { error } = await supabase!
        .from("social_links")
        .insert(payload);

      if (error) {
        console.error("Insert error:", error);
        setError(error.message);
      } else {
        setSuccess("Information added successfully.");
        resetForm();
        await loadContactInfo();
      }
    }

    setSaving(false);
  }

  // --------------------------------------------------
  // EDIT
  // --------------------------------------------------

  function editContactInfo(item: SocialLink) {
    setEditingId(item.id);

    const lowerPlatform = item.platform.toLowerCase();

    if (
      lowerPlatform === "email" ||
      lowerPlatform === "mail" ||
      lowerPlatform === "email address"
    ) {
      setContactType("email");
      setPlatform("");
    } else if (
      lowerPlatform === "phone" ||
      lowerPlatform === "phone number" ||
      lowerPlatform === "mobile"
    ) {
      setContactType("phone");
      setPlatform("");
    } else {
      setContactType("social");
      setPlatform(item.platform);
    }

    setValue(item.url);
    setError("");
    setSuccess("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  // --------------------------------------------------
  // DELETE CONTACT INFORMATION
  // --------------------------------------------------

  async function deleteContactInfo(id: number) {
    if (!checkSupabase()) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this information?"
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    const { error } = await supabase!
      .from("social_links")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      setError(error.message);
      return;
    }

    setSuccess("Information deleted successfully.");
    await loadContactInfo();
  }

  // --------------------------------------------------
  // MESSAGE STATUS
  // --------------------------------------------------

  async function updateMessageStatus(
    id: number,
    status: string
  ) {
    if (!checkSupabase()) return;

    const { error } = await supabase!
      .from("contact_messages")
      .update({ status })
      .eq("id", id);

    if (error) {
      console.error("Status update error:", error);
      setError(error.message);
      return;
    }

    await loadMessages();
  }

  // --------------------------------------------------
  // DELETE MESSAGE
  // --------------------------------------------------

  async function deleteMessage(id: number) {
    if (!checkSupabase()) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this message?"
    );

    if (!confirmed) return;

    const { error } = await supabase!
      .from("contact_messages")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Message delete error:", error);
      setError(error.message);
      return;
    }

    setSuccess("Message deleted successfully.");
    await loadMessages();
  }

  // --------------------------------------------------
  // GET TYPE
  // --------------------------------------------------

  function getItemType(item: SocialLink): ContactType {
    const platformName = item.platform.toLowerCase();

    if (
      platformName === "email" ||
      platformName === "mail" ||
      platformName === "email address"
    ) {
      return "email";
    }

    if (
      platformName === "phone" ||
      platformName === "phone number" ||
      platformName === "mobile"
    ) {
      return "phone";
    }

    return "social";
  }

  // --------------------------------------------------
  // GET ICON
  // --------------------------------------------------

  function getIcon(item: SocialLink) {
    const type = getItemType(item);

    if (type === "email") return "✉️";
    if (type === "phone") return "📞";

    const name = item.platform.toLowerCase();

    if (name.includes("facebook")) return "📘";
    if (name.includes("instagram")) return "📸";
    if (name.includes("linkedin")) return "💼";
    if (name.includes("youtube")) return "▶️";
    if (name.includes("twitter") || name === "x") return "𝕏";
    if (name.includes("tiktok")) return "🎵";
    if (name.includes("whatsapp")) return "💬";
    if (name.includes("telegram")) return "✈️";

    return "🔗";
  }

  // --------------------------------------------------
  // GET HREF
  // --------------------------------------------------

  function getHref(item: SocialLink) {
    const type = getItemType(item);
    const cleanValue = item.url.trim();

    if (type === "email") {
      return cleanValue.startsWith("mailto:")
        ? cleanValue
        : `mailto:${cleanValue}`;
    }

    if (type === "phone") {
      return cleanValue.startsWith("tel:")
        ? cleanValue
        : `tel:${cleanValue.replace(/\s+/g, "")}`;
    }

    if (
      cleanValue.startsWith("http://") ||
      cleanValue.startsWith("https://")
    ) {
      return cleanValue;
    }

    return `https://${cleanValue}`;
  }

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-[#070b14] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Website Contact & Social Links
          </h1>

          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Manage social media links, email addresses and phone
            numbers displayed on the website.
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
            {success}
          </div>
        )}

        {/* CONTACT INFORMATION */}
        <section className="mb-10 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0b1220] sm:p-6">

          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Contact Information
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add and manage your website contact details.
              </p>
            </div>

            <button
              type="button"
              onClick={openAddForm}
              className="rounded-lg bg-[#087f8c] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#066b76]"
            >
              + Add Contact Information
            </button>
          </div>

          {/* FORM */}
          {showForm && (
            <div className="mb-8 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-700 dark:bg-[#0f172a]">

              <h3 className="mb-5 text-lg font-bold text-slate-900 dark:text-white">
                {editingId !== null
                  ? "Edit Contact Information"
                  : "Add Contact Information"}
              </h3>

              {/* TYPE */}
              <div className="mb-5">
                <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Information Type
                </label>

                <select
                  value={contactType}
                  onChange={(e) =>
                    setContactType(
                      e.target.value as ContactType
                    )
                  }
                  className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium !text-slate-900 outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-600 dark:bg-[#111827] dark:!text-white sm:max-w-md"
                >
                  <option value="social">
                    🌐 Social Link
                  </option>

                  <option value="email">
                    ✉️ Email Address
                  </option>

                  <option value="phone">
                    📞 Phone Number
                  </option>
                </select>
              </div>

              {/* SOCIAL PLATFORM */}
              {contactType === "social" && (
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Social Platform
                  </label>

                  <input
                    type="text"
                    value={platform}
                    onChange={(e) =>
                      setPlatform(e.target.value)
                    }
                    placeholder="Example: Facebook, Instagram, LinkedIn, YouTube"
                    autoComplete="off"
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium !text-slate-900 caret-[#087f8c] outline-none placeholder:!text-slate-400 focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-600 dark:bg-[#111827] dark:!text-white dark:placeholder:!text-slate-500"
                  />
                </div>
              )}

              {/* EMAIL */}
              {contactType === "email" && (
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={value}
                    onChange={(e) =>
                      setValue(e.target.value)
                    }
                    placeholder="Example: diupc@diu.edu.bd"
                    autoComplete="email"
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium !text-slate-900 caret-[#087f8c] outline-none placeholder:!text-slate-400 focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-600 dark:bg-[#111827] dark:!text-white dark:placeholder:!text-slate-500"
                  />
                </div>
              )}

              {/* PHONE */}
              {contactType === "phone" && (
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Phone Number
                  </label>

                  <input
                    type="tel"
                    value={value}
                    onChange={(e) =>
                      setValue(e.target.value)
                    }
                    placeholder="Example: +8801XXXXXXXXX"
                    autoComplete="tel"
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium !text-slate-900 caret-[#087f8c] outline-none placeholder:!text-slate-400 focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-600 dark:bg-[#111827] dark:!text-white dark:placeholder:!text-slate-500"
                  />
                </div>
              )}

              {/* SOCIAL URL */}
              {contactType === "social" && (
                <div className="mb-5">
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Social Link
                  </label>

                  <input
                    type="text"
                    value={value}
                    onChange={(e) =>
                      setValue(e.target.value)
                    }
                    placeholder="Example: https://facebook.com/yourpage"
                    autoComplete="off"
                    className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium !text-slate-900 caret-[#087f8c] outline-none placeholder:!text-slate-400 focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-600 dark:bg-[#111827] dark:!text-white dark:placeholder:!text-slate-500"
                  />
                </div>
              )}

              {/* BUTTONS */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={saveContactInfo}
                  disabled={saving}
                  className="rounded-lg bg-[#087f8c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#066b76] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingId !== null
                    ? "Update Information"
                    : "Save Information"}
                </button>

                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* EXISTING INFORMATION */}
          <div>
            <h3 className="mb-4 text-base font-bold text-slate-900 dark:text-white">
              Existing Information
            </h3>

            {contactLoading ? (
              <div className="rounded-lg border border-slate-200 p-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                Loading...
              </div>
            ) : contactInfo.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                No contact information added yet.
              </div>
            ) : (
              <div className="space-y-3">
                {contactInfo.map((item) => {
                  const type = getItemType(item);

                  return (
                    <div
                      key={item.id}
                      className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-[#111827] sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-start gap-4">

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xl dark:bg-slate-800">
                          {getIcon(item)}
                        </div>

                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="font-bold text-slate-900 dark:text-white">
                              {item.platform}
                            </h4>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                              {type === "social"
                                ? "Social Link"
                                : type === "email"
                                ? "Email"
                                : "Phone"}
                            </span>
                          </div>

                          <a
                            href={getHref(item)}
                            target={
                              type === "social"
                                ? "_blank"
                                : undefined
                            }
                            rel={
                              type === "social"
                                ? "noopener noreferrer"
                                : undefined
                            }
                            className="mt-1 block truncate text-sm font-medium text-[#087f8c] hover:underline"
                          >
                            {item.url}
                          </a>
                        </div>
                      </div>

                      <div className="flex shrink-0 gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            editContactInfo(item)
                          }
                          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            deleteContactInfo(item.id)
                          }
                          className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CONTACT MESSAGES */}
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0b1220] sm:p-6">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Contact Messages
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Messages submitted through the website contact form.
            </p>
          </div>

          {messagesLoading ? (
            <div className="rounded-lg border border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              Loading messages...
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
              No contact messages found.
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className="rounded-xl border border-slate-200 p-5 dark:border-slate-700"
                >
                  <div className="flex flex-col justify-between gap-4 sm:flex-row">

                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white">
                        {message.subject || "No Subject"}
                      </h3>

                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                        From: {message.name} ({message.email})
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(
                          message.created_at
                        ).toLocaleString()}
                      </p>
                    </div>

                    <span
                      className={`inline-flex h-fit rounded-full px-3 py-1 text-xs font-semibold ${
                        message.status === "read"
                          ? "bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-400"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950/40 dark:text-yellow-400"
                      }`}
                    >
                      {message.status || "unread"}
                    </span>
                  </div>

                  <div className="mt-4 rounded-lg bg-slate-50 p-4 text-sm leading-6 text-slate-700 dark:bg-[#111827] dark:text-slate-300">
                    {message.message}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">

                    {message.status !== "read" ? (
                      <button
                        type="button"
                        onClick={() =>
                          updateMessageStatus(
                            message.id,
                            "read"
                          )
                        }
                        className="rounded-lg bg-[#087f8c] px-4 py-2 text-sm font-semibold text-white hover:bg-[#066b76]"
                      >
                        Mark as Read
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          updateMessageStatus(
                            message.id,
                            "unread"
                          )
                        }
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200"
                      >
                        Mark as Unread
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        deleteMessage(message.id)
                      }
                      className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
