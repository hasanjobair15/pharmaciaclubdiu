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

export default function AdminContactPage() {
  const supabase = createClient();

  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  useEffect(() => {
    loadMessages();
  }, []);

  async function updateStatus(
    id: number,
    status: string
  ) {
    const { error } = await supabase
      .from("contact_messages")
      .update({ status })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    loadMessages();
  }

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

    loadMessages();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 dark:bg-[#0a0f1a] sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <a
            href="/admin/dashboard"
            className="text-sm font-medium text-[#087f8c]"
          >
            ← Back to Admin Dashboard
          </a>

          <h1 className="mt-4 text-3xl font-bold text-[#0b1736] dark:text-white">
            Contact Messages
          </h1>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            View and manage messages submitted through the website contact
            form.
          </p>
        </div>

        {loading && (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
            Loading messages...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <p className="font-semibold">Error loading messages</p>
            <p className="mt-1 text-sm">{error}</p>
          </div>
        )}

        {!loading && !error && messages.length === 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
            <div className="text-4xl">📭</div>

            <h2 className="mt-4 text-xl font-bold text-[#0b1736] dark:text-white">
              No messages yet
            </h2>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              Messages submitted through the Contact page will appear here.
            </p>
          </div>
        )}

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
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() =>
                          updateStatus(
                            item.id,
                            isUnread ? "Read" : "Unread"
                          )
                        }
                        className="rounded-lg bg-[#0b1736] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#087f8c]"
                      >
                        {isUnread ? "Mark as Read" : "Mark as Unread"}
                      </button>

                      <button
                        onClick={() => deleteMessage(item.id)}
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
      </div>
    </main>
  );
}