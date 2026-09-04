"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const categories = [
  "Article",
  "Research idea",
  "Poem",
  "Story",
  "Reflection",
  "Photography",
  "Artwork",
  "Achievement",
  "Other",
];

const officialEmail = "diupc@diu.edu.bd";

export default function MagazineSubmitPage() {
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studentId, setStudentId] = useState("");
  const [batch, setBatch] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [fileLink, setFileLink] = useState("");
  const [consent, setConsent] = useState(false);

  const [sending, setSending] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const inputClass =
    "w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-[#0b1736] placeholder:text-slate-400 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500";

  function buildEmailBody() {
    return [
      "Magazine Content Submission",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Student ID / Roll: ${studentId || "Not provided"}`,
      `Batch / Semester: ${batch || "Not provided"}`,
      `Category: ${category}`,
      `Title: ${title}`,
      `File link: ${fileLink || "Not provided"}`,
      "",
      "Content / Description:",
      content,
    ].join("\n");
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");

    if (!name.trim()) {
      setErrorMessage("Please enter your name.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!title.trim()) {
      setErrorMessage("Please enter a title for your submission.");
      return;
    }

    if (!content.trim() && !fileLink.trim()) {
      setErrorMessage("Please write your content or paste a file link.");
      return;
    }

    if (!consent) {
      setErrorMessage("Please confirm that this is your own work.");
      return;
    }

    setSending(true);

    try {
      const { error } = await supabase.from("contact_messages").insert({
        name: name.trim(),
        email: email.trim(),
        subject: `[Magazine Submission] ${title.trim()}`,
        message: buildEmailBody(),
        status: "Unread",
      });

      if (error) {
        throw error;
      }

      setSubmitted(true);
      setName("");
      setEmail("");
      setStudentId("");
      setBatch("");
      setCategory(categories[0]);
      setTitle("");
      setContent("");
      setFileLink("");
      setConsent(false);
    } catch (error) {
      console.error("Magazine submission error:", error);

      setErrorMessage(
        error instanceof Error
          ? `${error.message}. If the form still fails, please use the email button below.`
          : "Unable to submit your content. Please use the email button below."
      );
    } finally {
      setSending(false);
    }
  }

  const mailtoHref = `mailto:${officialEmail}?subject=${encodeURIComponent(
    `[Magazine Submission] ${title || "My content"}`
  )}&body=${encodeURIComponent(buildEmailBody())}`;

  return (
    <main className="min-h-screen bg-white text-[#0b1736] dark:bg-[#0a0f1a] dark:text-white">
      <section className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-[#0d1422]">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center lg:px-8">
          <p className="pc-flame text-sm font-black uppercase tracking-[0.2em]">
            Pharmacia Club DIU Magazine
          </p>

          <h1 className="pc-rainbow mt-3 text-4xl font-black tracking-tight sm:text-5xl">
            Submit Your Content
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Send your article, poem, story, photography, artwork, research idea
            or achievement for consideration in an upcoming magazine issue.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12 lg:px-8">
        <div className="mb-6">
          <Link
            href="/magazine"
            className="text-sm font-bold text-[#087f8c] hover:underline dark:text-[#2dd4bf]"
          >
            ← Back to Magazine
          </Link>
        </div>

        {submitted && (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm leading-6 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
            ✅ Thank you! Your magazine submission has been received. The club
            team will review it and contact you if needed.
          </div>
        )}

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Full Name *
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  required
                  className={inputClass}
                  placeholder="Your full name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                  className={inputClass}
                  placeholder="your@email.com"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Student ID / Roll
                </label>
                <input
                  value={studentId}
                  onChange={(event) => setStudentId(event.target.value)}
                  className={inputClass}
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Batch / Semester
                </label>
                <input
                  value={batch}
                  onChange={(event) => setBatch(event.target.value)}
                  className={inputClass}
                  placeholder="e.g. 30th Batch / 5th Semester"
                />
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Category *
                </label>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className={inputClass}
                >
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                  Title *
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  required
                  className={inputClass}
                  placeholder="Submission title"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                Content / Description
              </label>
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                rows={10}
                maxLength={5000}
                className={`${inputClass} resize-none leading-7`}
                placeholder="Paste your writing here, or describe the file you are submitting..."
              />
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                {content.length}/5000 characters
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-bold text-slate-700 dark:text-slate-200">
                File Link
              </label>
              <input
                type="url"
                value={fileLink}
                onChange={(event) => setFileLink(event.target.value)}
                className={inputClass}
                placeholder="Google Drive / OneDrive / Dropbox public link"
              />
              <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                For photos, artwork or formatted documents, upload the file to
                Drive and paste a public view link here.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-1 h-4 w-4 accent-[#087f8c]"
              />
              <span>
                I confirm this is my own work or I have permission to submit it
                for Pharmacia Club DIU Magazine. *
              </span>
            </label>

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="submit"
                disabled={sending}
                className="rounded-full bg-[#0b1736] px-7 py-3.5 text-sm font-bold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-[#2dd4bf] dark:text-[#062a2d] dark:hover:bg-[#5eead4]"
              >
                {sending ? "Submitting..." : "Submit Content"}
              </button>

              <a
                href={mailtoHref}
                className="rounded-full border border-slate-300 px-7 py-3.5 text-center text-sm font-bold text-[#0b1736] transition hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:text-slate-200 dark:hover:border-[#2dd4bf] dark:hover:text-[#2dd4bf]"
              >
                Email Instead
              </a>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
