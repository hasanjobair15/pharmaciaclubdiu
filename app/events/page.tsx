"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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

type EventStatus =
  | "Upcoming"
  | "Ongoing"
  | "Completed"
  | "Cancelled";

type FilterType = "All" | EventStatus;

function getAutomaticStatus(event: EventItem): EventStatus {
  // Manual cancellation always has priority
  if (event.status === "Cancelled") {
    return "Cancelled";
  }

  // If there is no event date, treat it as Upcoming
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

export default function EventsPage() {
  const supabase = createClient();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("All");

  async function loadEvents() {
    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) {
      console.error("Error loading events:", error);
      setEvents([]);
    } else {
      setEvents(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  const eventsWithStatus = useMemo(() => {
    return events.map((event) => ({
      ...event,
      automaticStatus: getAutomaticStatus(event),
    }));
  }, [events]);

  const filteredEvents = useMemo(() => {
    return eventsWithStatus.filter((event) => {
      const searchText = search.toLowerCase().trim();

      const matchesSearch =
        !searchText ||
        event.title?.toLowerCase().includes(searchText) ||
        event.description?.toLowerCase().includes(searchText) ||
        event.venue?.toLowerCase().includes(searchText) ||
        event.organizer?.toLowerCase().includes(searchText);

      const matchesFilter =
        filter === "All" || event.automaticStatus === filter;

      return matchesSearch && matchesFilter;
    });
  }, [eventsWithStatus, search, filter]);

  const counts = useMemo(() => {
    return {
      All: eventsWithStatus.length,
      Upcoming: eventsWithStatus.filter(
        (event) => event.automaticStatus === "Upcoming"
      ).length,
      Ongoing: eventsWithStatus.filter(
        (event) => event.automaticStatus === "Ongoing"
      ).length,
      Completed: eventsWithStatus.filter(
        (event) => event.automaticStatus === "Completed"
      ).length,
      Cancelled: eventsWithStatus.filter(
        (event) => event.automaticStatus === "Cancelled"
      ).length,
    };
  }, [eventsWithStatus]);

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

  const filters: FilterType[] = [
    "All",
    "Upcoming",
    "Ongoing",
    "Completed",
    "Cancelled",
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <section className="bg-gradient-to-r from-blue-900 to-blue-700 text-white">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <h1 className="text-4xl font-bold md:text-5xl">
            Events
          </h1>

          <p className="mt-4 max-w-2xl text-blue-100">
            Explore upcoming, ongoing, and past events organized by
            Pharmacia Club DIU.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="mx-auto max-w-7xl px-6 py-10">
        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-gray-300 bg-white px-5 py-3 text-gray-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          />
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-3">
          {filters.map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`rounded-full px-5 py-2 text-sm font-medium transition ${
                filter === item
                  ? "bg-blue-700 text-white"
                  : "bg-white text-gray-700 shadow-sm hover:bg-gray-100"
              }`}
            >
              {item} ({counts[item]})
            </button>
          ))}
        </div>

        {/* Loading */}
        {loading && (
          <div className="py-20 text-center">
            <p className="text-gray-500">Loading events...</p>
          </div>
        )}

        {/* No Events */}
        {!loading && filteredEvents.length === 0 && (
          <div className="rounded-2xl bg-white px-6 py-20 text-center shadow-sm">
            <h2 className="text-2xl font-semibold text-gray-800">
              No events found
            </h2>

            <p className="mt-2 text-gray-500">
              Try another search or filter.
            </p>
          </div>
        )}

        {/* Event Grid */}
        {!loading && filteredEvents.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <article
                key={event.id}
                className="overflow-hidden rounded-2xl bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Event Image */}
                {event.image_url ? (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-blue-800 to-blue-500 text-white">
                    <span className="text-lg font-semibold">
                      Pharmacia Club DIU
                    </span>
                  </div>
                )}

                {/* Content */}
                <div className="p-6">
                  {/* Status */}
                  <div className="mb-4">
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                        event.automaticStatus
                      )}`}
                    >
                      {event.automaticStatus}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-xl font-bold text-gray-900">
                    {event.title}
                  </h2>

                  {/* Description */}
                  {event.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600">
                      {event.description}
                    </p>
                  )}

                  {/* Event Information */}
                  <div className="mt-5 space-y-2 text-sm text-gray-600">
                    {event.event_date && (
                      <p>
                        <span className="font-semibold text-gray-800">
                          Date:
                        </span>{" "}
                        {formatDate(event.event_date)}
                      </p>
                    )}

                    {(event.start_time || event.end_time) && (
                      <p>
                        <span className="font-semibold text-gray-800">
                          Time:
                        </span>{" "}
                        {formatTime(event.start_time)}
                        {event.end_time &&
                          ` - ${formatTime(event.end_time)}`}
                      </p>
                    )}

                    {event.venue && (
                      <p>
                        <span className="font-semibold text-gray-800">
                          Venue:
                        </span>{" "}
                        {event.venue}
                      </p>
                    )}

                    {event.organizer && (
                      <p>
                        <span className="font-semibold text-gray-800">
                          Organizer:
                        </span>{" "}
                        {event.organizer}
                      </p>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/events/${event.id}`}
                      className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
                    >
                      View Details
                    </Link>

                    {event.registration_url &&
                      event.automaticStatus !== "Completed" &&
                      event.automaticStatus !== "Cancelled" && (
                        <a
                          href={event.registration_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-blue-700 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
                        >
                          Register
                        </a>
                      )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}