"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function ContactPage() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

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

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-[#0b1736] placeholder:text-slate-400 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 disabled:opacity-60 dark:border-slate-600 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-400";

  const linkCardClass =
    "flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#087f8c] hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/70";

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

        <div className="mt-12 grid gap-8 lg:grid-cols-2">

          {/* LEFT SIDE */}
          <div className="space-y-8">

            {/* JOIN US */}
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

              <div className="mt-8 space-y-4 text-sm">
                <p className="text-slate-600 dark:text-slate-300">
                  <strong className="text-[#0b1736] dark:text-white">
                    Department:
                  </strong>{" "}
                  Department of Pharmacy, Daffodil International University
                </p>

                <p className="text-slate-600 dark:text-slate-300">
                  <strong className="text-[#0b1736] dark:text-white">
                    Club:
                  </strong>{" "}
                  Pharmacia Club DIU
                </p>

                <p className="text-slate-600 dark:text-slate-300">
                  <strong className="text-[#0b1736] dark:text-white">
                    Batch:
                  </strong>{" "}
                  30th Batch
                </p>
              </div>
            </div>

            {/* OFFICIAL CLUB CONTACT */}
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

              <div className="mt-6 space-y-3">

                {/* EMAIL */}
                <a
                  href="mailto:diupc@diu.edu.bd"
                  className={linkCardClass}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#087f8c]/10 text-xl">
                    📧
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Official Email
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-[#0b1736] dark:text-white">
                      diupc@diu.edu.bd
                    </p>
                  </div>
                </a>

                {/* FACEBOOK */}
                <a
                  href="https://www.facebook.com/PharmaciaClubDIU"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkCardClass}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#087f8c]/10 text-xl">
                    📘
                  </span>

                  <div className="min-w-0">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Facebook Page
                    </p>

                    <p className="mt-1 text-sm font-semibold text-[#0b1736] dark:text-white">
                      Pharmacia Club DIU
                    </p>
                  </div>

                  <span className="ml-auto text-slate-400">
                    ↗
                  </span>
                </a>

                {/* LINKEDIN */}
                <div className={linkCardClass}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#087f8c]/10 text-xl">
                    💼
                  </span>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      LinkedIn
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Coming Soon
                    </p>
                  </div>
                </div>

                {/* INSTAGRAM */}
                <div className={linkCardClass}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#087f8c]/10 text-xl">
                    📸
                  </span>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Instagram
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Coming Soon
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* DEPARTMENT LINKS */}
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

              <div className="mt-6 space-y-3">

                {/* DEPARTMENT FACEBOOK PAGE */}
                <div className={linkCardClass}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#087f8c]/10 text-xl">
                    📘
                  </span>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Facebook Page
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Coming Soon
                    </p>
                  </div>
                </div>

                {/* DEPARTMENT FACEBOOK GROUP */}
                <div className={linkCardClass}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#087f8c]/10 text-xl">
                    👥
                  </span>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Facebook Group
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Coming Soon
                    </p>
                  </div>
                </div>

                {/* DEPARTMENT WEBSITE */}
                <div className={linkCardClass}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#087f8c]/10 text-xl">
                    🌐
                  </span>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Department Website
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Coming Soon
                    </p>
                  </div>
                </div>

                {/* DEPARTMENT EMAIL */}
                <div className={linkCardClass}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#087f8c]/10 text-xl">
                    📧
                  </span>

                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Department Email
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-500 dark:text-slate-400">
                      Coming Soon
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT SIDE — FORM */}
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