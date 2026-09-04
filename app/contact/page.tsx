"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type ContactItem = {
  id: number;
  section: string;
  label: string;
  value: string | null;
  icon: string | null;
  sort_order: number;
};

export default function ContactPage() {
  const supabase = createClient();

  const [contactItems, setContactItems] = useState<ContactItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [contactError, setContactError] = useState("");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  /*
   * =========================================================
   * LOAD CONTACT INFORMATION FROM SUPABASE
   * =========================================================
   */

  useEffect(() => {
    async function loadContactItems() {
      setLoadingItems(true);
      setContactError("");

      const { data, error } = await supabase
        .from("contact_items")
        .select("*")
        .order("section", { ascending: true })
        .order("sort_order", { ascending: true })
        .order("id", { ascending: true });

      if (error) {
        console.error("Contact items loading error:", error);
        setContactError(error.message);
        setLoadingItems(false);
        return;
      }

      setContactItems((data || []) as ContactItem[]);
      setLoadingItems(false);
    }

    loadContactItems();
  }, [supabase]);

  /*
   * =========================================================
   * CONTACT FORM
   * =========================================================
   */

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSending(true);
    setError("");

    const { error } = await supabase.from("contact_messages").insert({
      name,
      email,
      subject,
      message,
      status: "Unread",
    });

    if (error) {
      setError(error.message);
      setSending(false);
      return;
    }

    setSubmitted(true);
    setSending(false);

    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  }

  /*
   * =========================================================
   * HELPERS
   * =========================================================
   */

  function getSection(section: string) {
    return contactItems
      .filter(
        (item) =>
          item.section.trim().toLowerCase() === section.trim().toLowerCase()
      )
      .sort((a, b) => {
        if (a.sort_order !== b.sort_order) {
          return a.sort_order - b.sort_order;
        }

        return a.id - b.id;
      });
  }

  function getValue(item: ContactItem) {
    const value = item.value?.trim();

    if (!value) {
      return "Coming Soon";
    }

    return value;
  }

  function isEmail(value: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function isUrl(value: string) {
    return /^https?:\/\//i.test(value);
  }

  function getHref(item: ContactItem) {
    const value = item.value?.trim();

    if (!value) return null;

    if (isEmail(value)) {
      return `mailto:${value}`;
    }

    if (isUrl(value)) {
      return value;
    }

    return null;
  }

  function getFriendlyDisplay(item: ContactItem) {
    const value = item.value?.trim();

    if (!value) {
      return "Coming Soon";
    }

    /*
     * Keep the Facebook display clean instead of showing
     * the complete URL.
     */
    if (
      item.label.toLowerCase().includes("facebook") &&
      isUrl(value)
    ) {
      return "Pharmacia Club DIU";
    }

    return value;
  }

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#0b1736] placeholder:text-slate-400 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400";

  const linkCardClass =
    "flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#087f8c] hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/70";

  const aboutItems = getSection("About Us");
  const officialItems = getSection("Official");
  const departmentItems = getSection("Department");

  /*
   * =========================================================
   * LOADING
   * =========================================================
   */

  if (loadingItems) {
    return (
      <main className="min-h-screen bg-white dark:bg-[#0a0f1a]">
        <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">
          <div className="flex min-h-[500px] items-center justify-center">
            <div className="text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#087f8c]" />

              <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
                Loading contact information...
              </p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  /*
   * =========================================================
   * PAGE
   * =========================================================
   */

  return (
    <main className="min-h-screen bg-white dark:bg-[#0a0f1a]">
      <section className="mx-auto max-w-6xl px-6 py-16 lg:px-8">

        {/* HEADER */}
        <div className="text-center">
          <p className="pc-flame text-sm font-black uppercase tracking-[0.2em]">
            Get In Touch
          </p>

          <h1 className="mt-3 text-4xl font-black text-[#0b1736] dark:text-white sm:text-5xl">
            Contact <span className="pc-rainbow">Pharmacia Club DIU</span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-slate-600 dark:text-slate-300">
            Have a question, want to join the club, collaborate with us, or
            participate in our activities? Send us a message.
          </p>
        </div>

        {/* DATABASE ERROR */}
        {contactError && (
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
            <p className="font-bold">
              Unable to load Contact page information.
            </p>

            <p className="mt-1 break-words">
              {contactError}
            </p>
          </div>
        )}

        <div className="mt-12 grid gap-8 lg:grid-cols-2">

          {/* =====================================================
              LEFT SIDE
              ===================================================== */}

          <div className="space-y-8">

            {/* =================================================
                ABOUT US
                ================================================= */}

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-700 dark:bg-slate-900">

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087f8c]">
                About Us
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#0b1736] dark:text-white">
                Join Us
              </h2>

              <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
                Pharmacia Club DIU welcomes students who are interested in
                pharmacy, research, leadership, creativity, and professional
                development.
              </p>

              {aboutItems.length > 0 && (
                <div className="mt-8 space-y-4 text-sm">
                  {aboutItems.map((item) => (
                    <p
                      key={item.id}
                      className="text-slate-600 dark:text-slate-300"
                    >
                      <strong className="text-[#0b1736] dark:text-white">
                        {item.label}:
                      </strong>{" "}
                      {getValue(item)}
                    </p>
                  ))}
                </div>
              )}

            </div>

            {/* =================================================
                OFFICIAL CLUB CONTACT
                ================================================= */}

            <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-[#0f172a]">

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087f8c]">
                Official
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#0b1736] dark:text-white">
                Pharmacia Club DIU
              </h2>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Connect with the official Pharmacia Club DIU platforms.
              </p>

              {officialItems.length > 0 && (
                <div className="mt-6 space-y-3">

                  {officialItems.map((item) => {
                    const href = getHref(item);
                    const value = getValue(item);
                    const displayValue = getFriendlyDisplay(item);
                    const comingSoon = !item.value?.trim();

                    const content = (
                      <>
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#087f8c]/10 text-xl">
                          {item.icon || "🔗"}
                        </span>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {item.label}
                          </p>

                          <p
                            className={`mt-1 break-words text-sm font-semibold ${
                              comingSoon
                                ? "text-slate-500 dark:text-slate-400"
                                : "text-[#0b1736] dark:text-white"
                            }`}
                          >
                            {displayValue}
                          </p>
                        </div>

                        {href && (
                          <span className="ml-auto shrink-0 text-slate-400">
                            ↗
                          </span>
                        )}
                      </>
                    );

                    if (href) {
                      return (
                        <a
                          key={item.id}
                          href={href}
                          target={
                            isUrl(item.value?.trim() || "")
                              ? "_blank"
                              : undefined
                          }
                          rel={
                            isUrl(item.value?.trim() || "")
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className={linkCardClass}
                        >
                          {content}
                        </a>
                      );
                    }

                    return (
                      <div key={item.id} className={linkCardClass}>
                        {content}
                      </div>
                    );
                  })}

                </div>
              )}

              {officialItems.length === 0 && (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No official contact information available.
                </div>
              )}

            </div>

            {/* =================================================
                DEPARTMENT LINKS
                ================================================= */}

            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-700 dark:bg-slate-900">

              <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087f8c]">
                Department
              </p>

              <h2 className="mt-2 text-2xl font-bold text-[#0b1736] dark:text-white">
                Department of Pharmacy
              </h2>

              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Official department contact platforms and resources.
              </p>

              {departmentItems.length > 0 && (
                <div className="mt-6 space-y-3">

                  {departmentItems.map((item) => {
                    const href = getHref(item);
                    const comingSoon = !item.value?.trim();
                    const displayValue = getFriendlyDisplay(item);

                    const content = (
                      <>
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#087f8c]/10 text-xl">
                          {item.icon || "🔗"}
                        </span>

                        <div className="min-w-0">
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                            {item.label}
                          </p>

                          <p
                            className={`mt-1 break-words text-sm font-semibold ${
                              comingSoon
                                ? "text-slate-500 dark:text-slate-400"
                                : "text-[#0b1736] dark:text-white"
                            }`}
                          >
                            {displayValue}
                          </p>
                        </div>

                        {href && (
                          <span className="ml-auto shrink-0 text-slate-400">
                            ↗
                          </span>
                        )}
                      </>
                    );

                    if (href) {
                      return (
                        <a
                          key={item.id}
                          href={href}
                          target={
                            isUrl(item.value?.trim() || "")
                              ? "_blank"
                              : undefined
                          }
                          rel={
                            isUrl(item.value?.trim() || "")
                              ? "noopener noreferrer"
                              : undefined
                          }
                          className={linkCardClass}
                        >
                          {content}
                        </a>
                      );
                    }

                    return (
                      <div key={item.id} className={linkCardClass}>
                        {content}
                      </div>
                    );
                  })}

                </div>
              )}

              {departmentItems.length === 0 && (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-5 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
                  No department contact information available.
                </div>
              )}

            </div>

          </div>

          {/* =====================================================
              RIGHT SIDE — FORM
              ===================================================== */}

          <div className="h-fit rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-[#0f172a] lg:sticky lg:top-24">

            <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#087f8c]">
              Message Us
            </p>

            <h2 className="mt-2 text-2xl font-bold text-[#0b1736] dark:text-white">
              Send a Message
            </h2>

            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              Fill out the form below and our team will get back to you.
            </p>

            {submitted ? (
              <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950/30">

                <div className="text-3xl">
                  ✅
                </div>

                <h3 className="mt-3 font-bold text-green-800 dark:text-green-300">
                  Message Sent Successfully
                </h3>

                <p className="mt-2 text-sm text-green-700 dark:text-green-400">
                  Thank you! Your message has been received by Pharmacia Club
                  DIU.
                </p>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-4 rounded-lg bg-[#0b1736] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#087f8c]"
                >
                  Send Another Message
                </button>

              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-6 space-y-5"
              >

                {/* NAME */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-[#0b1736] dark:text-slate-200"
                  >
                    Your Name
                  </label>

                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    required
                    disabled={sending}
                    className={inputClass}
                  />
                </div>

                {/* EMAIL */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-[#0b1736] dark:text-slate-200"
                  >
                    Your Email
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    disabled={sending}
                    className={inputClass}
                  />
                </div>

                {/* SUBJECT */}
                <div>
                  <label
                    htmlFor="subject"
                    className="mb-2 block text-sm font-semibold text-[#0b1736] dark:text-slate-200"
                  >
                    Subject
                  </label>

                  <input
                    id="subject"
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="What is your message about?"
                    required
                    disabled={sending}
                    className={inputClass}
                  />
                </div>

                {/* MESSAGE */}
                <div>
                  <label
                    htmlFor="message"
                    className="mb-2 block text-sm font-semibold text-[#0b1736] dark:text-slate-200"
                  >
                    Your Message
                  </label>

                  <textarea
                    id="message"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here..."
                    rows={7}
                    required
                    disabled={sending}
                    className={inputClass + " resize-none"}
                  />
                </div>

                {/* ERROR */}
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">

                    <p className="font-bold">
                      Unable to send message.
                    </p>

                    <p className="mt-1 break-words">
                      {error}
                    </p>

                  </div>
                )}

                {/* SUBMIT */}
                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-xl bg-[#0b1736] px-6 py-3.5 font-bold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sending ? "Sending..." : "Send Message"}
                </button>

                <p className="text-center text-xs text-slate-400 dark:text-slate-500">
                  Your message will be securely submitted to Pharmacia Club
                  DIU.
                </p>

              </form>
            )}

          </div>

        </div>
      </section>
    </main>
  );
}
