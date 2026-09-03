"use client";

import { useState } from "react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <main className="min-h-screen bg-white dark:bg-[#0a0f1a]">
      <section className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
            Get In Touch
          </p>

          <h1 className="mt-3 text-4xl font-bold text-[#0b1736] dark:text-white sm:text-5xl">
            Contact Pharmacia Club DIU
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-slate-600 dark:text-slate-300">
            Have a question, want to join the club, collaborate with us, or
            participate in our activities? Send us a message.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-700 dark:bg-slate-900">
            <h2 className="text-2xl font-bold text-[#0b1736] dark:text-white">
              Join Us
            </h2>

            <p className="mt-4 leading-7 text-slate-600 dark:text-slate-300">
              Pharmacia Club DIU welcomes students who are interested in
              pharmacy, research, leadership, creativity, and professional
              development.
            </p>

            <div className="mt-8 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <p>
                <strong className="text-[#0b1736] dark:text-white">
                  Department:
                </strong>{" "}
                Department of Pharmacy, Daffodil International University
              </p>

              <p>
                <strong className="text-[#0b1736] dark:text-white">
                  Club:
                </strong>{" "}
                Pharmacia Club DIU
              </p>

              <p>
                <strong className="text-[#0b1736] dark:text-white">
                  Batch:
                </strong>{" "}
                30th Batch
              </p>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-700 dark:bg-[#0f172a]">
            <h2 className="text-2xl font-bold text-[#0b1736] dark:text-white">
              Send a Message
            </h2>

            {submitted ? (
              <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-700 dark:border-green-800 dark:bg-green-950/30 dark:text-green-300">
                Thank you! Your message has been received.
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setSubmitted(true);
                }}
                className="mt-6 space-y-5"
              >
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#087f8c] dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />

                <input
                  type="email"
                  placeholder="Your Email"
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#087f8c] dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />

                <textarea
                  placeholder="Your Message"
                  rows={6}
                  required
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-[#087f8c] dark:border-slate-600 dark:bg-slate-900 dark:text-white"
                />

                <button
                  type="submit"
                  className="w-full rounded-xl bg-[#0b1736] px-6 py-3 font-bold text-white transition hover:bg-[#087f8c]"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}