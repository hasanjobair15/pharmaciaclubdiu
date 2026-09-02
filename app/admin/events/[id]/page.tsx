"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type EventItem = {
  id: number;
  title: string;
  description: string | null;
  event_date: string | null;
  start_time: string | null;
  end_time: string | null;
  venue: string | null;
  organizer: string | null;
  image_url: string | null;
  registration_url: string | null;
  status: string | null;
};

export default function EventDetailsPage() {
  const params = useParams();
  const id = params.id as string;

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadEvent() {
      const supabase = createClient();

      const { data, error } = await supabase
        .from("events")
        .select(
          "id, title, description, event_date, start_time, end_time, venue, organizer, image_url, registration_url, status"
        )
        .eq("id", id)
        .single();

      if (error) {
        console.error(error);
        setError("Event not found.");
      } else {
        setEvent(data);
      }

      setLoading(false);
    }

    if (id) {
      loadEvent();
    }
  }, [id]);

  function formatDate(date: string | null) {
    if (!date) return "";

    const parts = date.split("-");

    if (parts.length !== 3) return date;

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    return new Date(year, month - 1, day).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatTime(time: string | null) {
    if (!time) return "";

    const parts = time.split(":");
    const hour = Number(parts[0]);
    const minute = Number(parts[1]);

    const date = new Date();
    date.setHours(hour, minute, 0, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-lg text-slate-600">Loading event...</p>
      </main>
    );
  }

  if (error || !event) {
    return (
      <main className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6">
        <h1 className="text-3xl font-black text-slate-900">
          Event Not Found
        </h1>

        <p className="mt-3 text-slate-600">
          The event you are looking for could not be found.
        </p>

        <Link
          href="/events"
          className="mt-6 rounded-xl bg-[#087f8c] px-6 py-3 font-bold text-white"
        >
          ← Back to Events
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7faff] text-[#0b1736]">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <Link
            href="/events"
            className="font-semibold text-[#087f8c] hover:underline"
          >
            ← Back to Events
          </Link>
        </div>
      </header>

      {/* EVENT HERO */}
      <section className="bg-slate-900 text-white">
        <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
          <span className="inline-block rounded-full bg-[#087f8c] px-4 py-2 text-sm font-bold">
            {event.status ?? "Upcoming"}
          </span>

          <h1 className="mt-5 max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            {event.title}
          </h1>

          {event.organizer && (
            <p className="mt-5 text-lg text-slate-300">
              Organized by {event.organizer}
            </p>
          )}
        </div>
      </section>

      {/* CONTENT */}
      <section className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-3">
          {/* POSTER */}
          <div className="lg:col-span-2">
            {event.image_url ? (
              <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
                <img
                  src={event.image_url}
                  alt={event.title}
                  className="w-full object-contain"
                />
              </div>
            ) : (
              <div className="flex min-h-[350px] items-center justify-center rounded-3xl bg-white text-slate-400">
                No Event Poster
              </div>
            )}
          </div>

          {/* EVENT INFORMATION */}
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black">
              Event Information
            </h2>

            {event.event_date && (
              <div className="mt-6">
                <p className="text-xs font-bold uppercase tracking-wider text-[#087f8c]">
                  Date
                </p>
                <p className="mt-1 font-semibold">
                  {formatDate(event.event_date)}
                </p>
              </div>
            )}

            {event.start_time && (
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#087f8c]">
                  Time
                </p>

                <p className="mt-1 font-semibold">
                  {formatTime(event.start_time)}

                  {event.end_time
                    ? " – " + formatTime(event.end_time)
                    : ""}
                </p>
              </div>
            )}

            {event.venue && (
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#087f8c]">
                  Venue
                </p>

                <p className="mt-1 font-semibold">
                  {event.venue}
                </p>
              </div>
            )}

            {event.organizer && (
              <div className="mt-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#087f8c]">
                  Organizer
                </p>

                <p className="mt-1 font-semibold">
                  {event.organizer}
                </p>
              </div>
            )}

            {event.registration_url && (
              <a
                href={event.registration_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-7 block rounded-xl bg-[#087f8c] px-5 py-3 text-center font-bold text-white hover:bg-[#066b76]"
              >
                Register for Event →
              </a>
            )}
          </aside>
        </div>

        {/* DESCRIPTION */}
        {event.description && (
          <div className="mt-12 max-w-4xl rounded-3xl bg-white p-7 shadow-sm md:p-10">
            <h2 className="text-3xl font-black">
              About This Event
            </h2>

            <div className="mt-6 whitespace-pre-line text-lg leading-8 text-slate-700">
              {event.description}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}