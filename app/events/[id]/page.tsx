"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
  created_at: string | null;
};

type EventStatus =
  | "Upcoming"
  | "Ongoing"
  | "Completed"
  | "Cancelled";

function getAutomaticStatus(event: EventItem): EventStatus {
  // Manual cancellation has priority
  if (event.status === "Cancelled") {
    return "Cancelled";
  }

  // No date = Upcoming
  if (!event.event_date) {
    return "Upcoming";
  }

  const now = new Date();

  const startDate = new Date(
    `${event.event_date}T${event.start_time || "00:00"}`
  );

  const endDate = new Date(
    `${event.event_date}T${event.end_time || "23:59"}`
  );

  if (now < startDate) {
    return "Upcoming";
  }

  if (now >= startDate && now <= endDate) {
    return "Ongoing";
  }

  return "Completed";
}

export default function EventDetailsPage() {
  const params = useParams();
  const id = params?.id as string;

  const supabase = createClient();

  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadEvent() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("Error loading event:", error);
      setErrorMessage("Event not found.");
      setEvent(null);
    } else {
      setEvent(data);
    }

    setLoading(false);
  }

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  function formatDate(date: string | null) {
    if (!date) return "Date TBA";

    const formattedDate = new Date(`${date}T00:00:00`);

    return formattedDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  function formatTime(time: string | null) {
    if (!time) return "";

    const [hours, minutes] = time.split(":");

    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);

    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function getStatusClass(status: EventStatus) {
    switch (status) {
      case "Upcoming":
        return "bg-blue-100 text-blue-700";

      case "Ongoing":
        return "bg-green-100 text-green-700";

      case "Completed":
        return "bg-gray-100 text-gray-700";

      case "Cancelled":
        return "bg-red-100 text-red-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  }

  // Loading
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-500">Loading event...</p>
      </main>
    );
  }

  // Error / Not Found
  if (!event || errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-50 px-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Event Not Found
          </h1>

          <p className="mt-3 text-gray-500">
            The event you are looking for does not exist.
          </p>

          <Link
            href="/events"
            className="mt-6 inline-block rounded-lg bg-blue-700 px-5 py-3 font-semibold text-white transition hover:bg-blue-800"
          >
            Back to Events
          </Link>
        </div>
      </main>
    );
  }

  const automaticStatus = getAutomaticStatus(event);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero / Poster */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700">
        <div className="mx-auto max-w-6xl px-6 py-10">
          <Link
            href="/events"
            className="inline-flex items-center text-sm font-medium text-blue-100 transition hover:text-white"
          >
            ← Back to Events
          </Link>

          <div className="mt-8 overflow-hidden rounded-2xl bg-white shadow-xl">
            {event.image_url ? (
              <img
                src={event.image_url}
                alt={event.title}
                className="max-h-[600px] w-full object-contain"
              />
            ) : (
              <div className="flex h-80 items-center justify-center bg-gradient-to-br from-blue-800 to-blue-500 text-white">
                <span className="text-2xl font-bold">
                  Pharmacia Club DIU
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Event Details */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="rounded-2xl bg-white p-6 shadow-sm md:p-10">
          {/* Status */}
          <div className="mb-5">
            <span
              className={`inline-flex rounded-full px-4 py-2 text-sm font-semibold ${getStatusClass(
                automaticStatus
              )}`}
            >
              {automaticStatus}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold leading-tight text-gray-900 md:text-5xl">
            {event.title}
          </h1>

          {/* Event Information */}
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {/* Date */}
            <div className="rounded-xl bg-gray-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                Date
              </p>

              <p className="mt-2 text-lg font-semibold text-gray-900">
                {formatDate(event.event_date)}
              </p>
            </div>

            {/* Time */}
            {(event.start_time || event.end_time) && (
              <div className="rounded-xl bg-gray-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Time
                </p>

                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {formatTime(event.start_time)}

                  {event.end_time &&
                    ` - ${formatTime(event.end_time)}`}
                </p>
              </div>
            )}

            {/* Venue */}
            {event.venue && (
              <div className="rounded-xl bg-gray-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Venue
                </p>

                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {event.venue}
                </p>
              </div>
            )}

            {/* Organizer */}
            {event.organizer && (
              <div className="rounded-xl bg-gray-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-gray-500">
                  Organizer
                </p>

                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {event.organizer}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div className="mt-10">
              <h2 className="text-2xl font-bold text-gray-900">
                About This Event
              </h2>

              <div className="mt-4 whitespace-pre-line text-base leading-8 text-gray-600">
                {event.description}
              </div>
            </div>
          )}

          {/* Registration */}
          {event.registration_url &&
            automaticStatus !== "Completed" &&
            automaticStatus !== "Cancelled" && (
              <div className="mt-10 border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900">
                  Registration
                </h2>

                <p className="mt-2 text-gray-600">
                  Interested in joining this event? Register using the
                  button below.
                </p>

                <a
                  href={event.registration_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 inline-flex rounded-lg bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800"
                >
                  Register Now
                </a>
              </div>
            )}

          {/* Completed / Cancelled Message */}
          {automaticStatus === "Completed" && (
            <div className="mt-10 rounded-xl bg-gray-50 p-5 text-gray-600">
              This event has already been completed.
            </div>
          )}

          {automaticStatus === "Cancelled" && (
            <div className="mt-10 rounded-xl bg-red-50 p-5 text-red-700">
              This event has been cancelled.
            </div>
          )}
        </div>
      </section>
    </main>
  );
}