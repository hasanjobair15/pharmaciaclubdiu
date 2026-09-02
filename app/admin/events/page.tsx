"use client";

import { useEffect, useState } from "react";
import imageCompression from "browser-image-compression";
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
  created_at: string;
};

const emptyForm = {
  title: "",
  description: "",
  event_date: "",
  start_time: "",
  end_time: "",
  venue: "",
  organizer: "",
  image_url: "",
  registration_url: "",
  status: "Upcoming",
};

export default function EventsManager() {
  const supabase = createClient();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  async function loadEvents() {
    setLoading(true);

    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });

    if (error) {
      setMessage(error.message);
    } else {
      setEvents(data ?? []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadEvents();
  }, []);

  function handleChange(
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) {
    const { name, value } = e.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setMessage("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage("Please select an image smaller than 10 MB.");
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setMessage("");
  }

  async function uploadImage(file: File) {
    setUploading(true);

    try {
      setMessage("Compressing event poster...");

      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.7,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/jpeg",
      });

      setMessage("Uploading event poster...");

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 10)}.jpg`;

      const filePath = `events/${fileName}`;

      const { error } = await supabase.storage
        .from("committee-photos")
        .upload(filePath, compressedFile, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data } = supabase.storage
        .from("committee-photos")
        .getPublicUrl(filePath);

      return data.publicUrl;
    } finally {
      setUploading(false);
    }
  }

  function getAutomaticStatus(event: EventItem | typeof form) {
    if (event.status === "Cancelled") {
      return "Cancelled";
    }

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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      setMessage("Event title is required.");
      return;
    }

    if (!form.event_date) {
      setMessage("Event date is required.");
      return;
    }

    if (
      form.start_time &&
      form.end_time &&
      form.end_time < form.start_time
    ) {
      setMessage("End time cannot be earlier than start time.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      let imageUrl = form.image_url;

      if (selectedFile) {
        imageUrl = await uploadImage(selectedFile);
      }

      const eventData = {
        title: form.title.trim(),
        description: form.description.trim() || null,
        event_date: form.event_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        venue: form.venue.trim() || null,
        organizer: form.organizer.trim() || null,
        image_url: imageUrl.trim() || null,
        registration_url: form.registration_url.trim() || null,

        // Keep Cancelled manually.
        // Otherwise status is calculated automatically on the website.
        status: form.status === "Cancelled" ? "Cancelled" : "Upcoming",
      };

      setMessage("Saving event...");

      if (editingId !== null) {
        const { error } = await supabase
          .from("events")
          .update(eventData)
          .eq("id", editingId);

        if (error) {
          throw new Error(error.message);
        }

        setMessage("Event updated successfully.");
      } else {
        const { error } = await supabase
          .from("events")
          .insert(eventData);

        if (error) {
          throw new Error(error.message);
        }

        setMessage("Event added successfully.");
      }

      resetForm();
      await loadEvents();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  function editEvent(event: EventItem) {
    setEditingId(event.id);

    setForm({
      title: event.title,
      description: event.description ?? "",
      event_date: event.event_date ?? "",
      start_time: event.start_time ?? "",
      end_time: event.end_time ?? "",
      venue: event.venue ?? "",
      organizer: event.organizer ?? "",
      image_url: event.image_url ?? "",
      registration_url: event.registration_url ?? "",
      status: event.status === "Cancelled" ? "Cancelled" : "Upcoming",
    });

    setSelectedFile(null);
    setPreviewUrl("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteEvent(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this event?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id);

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Event deleted successfully.");
      await loadEvents();
    }
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setPreviewUrl("");
  }

  const currentImage = previewUrl || form.image_url;

  return (
    <main className="min-h-screen bg-[#f7faff] text-[#0b1736]">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#087f8c]">
              Pharmacia Club DIU
            </p>

            <h1 className="mt-1 text-2xl font-black">
              Events Manager
            </h1>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() =>
                (window.location.href = "/admin/dashboard")
              }
              className="rounded-full border border-slate-200 px-5 py-2 text-sm font-semibold hover:border-[#087f8c] hover:text-[#087f8c]"
            >
              Dashboard
            </button>

            <button
              onClick={() => (window.location.href = "/events")}
              className="rounded-full bg-[#087f8c] px-5 py-2 text-sm font-semibold text-white hover:bg-[#066b76]"
            >
              View Site
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {/* FORM */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
          <div className="mb-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
              {editingId !== null ? "Edit Event" : "Add New Event"}
            </p>

            <h2 className="mt-2 text-3xl font-black">
              {editingId !== null
                ? "Update Event"
                : "Create New Event"}
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Event status will be automatically determined from the date
              and time.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid gap-5 md:grid-cols-2"
          >
            <Input
              label="Event Title *"
              name="title"
              value={form.title}
              onChange={handleChange}
              placeholder="AI in Research"
            />

            <Input
              label="Organizer"
              name="organizer"
              value={form.organizer}
              onChange={handleChange}
              placeholder="Pharmacia Club DIU"
            />

            <Input
              label="Event Date *"
              name="event_date"
              type="date"
              value={form.event_date}
              onChange={handleChange}
            />

            <Input
              label="Venue"
              name="venue"
              value={form.venue}
              onChange={handleChange}
              placeholder="Seminar Room 407"
            />

            <Input
              label="Start Time"
              name="start_time"
              type="time"
              value={form.start_time}
              onChange={handleChange}
            />

            <Input
              label="End Time"
              name="end_time"
              type="time"
              value={form.end_time}
              onChange={handleChange}
            />

            <Input
              label="Registration URL"
              name="registration_url"
              value={form.registration_url}
              onChange={handleChange}
              placeholder="https://..."
            />

            {/* STATUS */}
            <div>
              <label className="mb-2 block text-sm font-semibold">
                Event Status
              </label>

              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20"
              >
                <option value="Upcoming">Automatic</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <p className="mt-2 text-xs leading-5 text-slate-500">
                Upcoming, Ongoing and Completed are automatic.
                Choose Cancelled only when the event is cancelled.
              </p>
            </div>

            {/* EVENT POSTER */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Event Poster
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm"
              />

              <p className="mt-2 text-xs text-slate-500">
                JPG, PNG or WebP • Maximum 10 MB • Automatically compressed
              </p>

              {currentImage && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200">
                  <img
                    src={currentImage}
                    alt="Event poster preview"
                    className="max-h-96 w-full object-contain"
                  />
                </div>
              )}
            </div>

            {/* DESCRIPTION */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-semibold">
                Description
              </label>

              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Write a short description of the event..."
                className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20"
              />
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 md:col-span-2">
              <button
                type="submit"
                disabled={saving || uploading}
                className="rounded-xl bg-[#087f8c] px-6 py-3 font-bold text-white hover:bg-[#066b76] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {uploading
                  ? "Uploading Poster..."
                  : saving
                  ? "Saving..."
                  : editingId !== null
                  ? "Update Event"
                  : "Add New Event"}
              </button>

              {editingId !== null && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-xl border border-slate-200 px-6 py-3 font-bold hover:border-slate-400"
                >
                  Cancel
                </button>
              )}
            </div>

            {message && (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm md:col-span-2">
                {message}
              </div>
            )}
          </form>
        </div>

        {/* EVENTS LIST */}
        <div className="mt-10">
          <div className="mb-6">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
              Events
            </p>

            <h2 className="mt-2 text-3xl font-black">
              Manage Events
            </h2>
          </div>

          {loading ? (
            <div className="rounded-3xl bg-white p-8 text-center">
              Loading events...
            </div>
          ) : events.length === 0 ? (
            <div className="rounded-3xl bg-white p-8 text-center text-slate-500">
              No events found.
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => {
                const automaticStatus = getAutomaticStatus(event);

                return (
                  <article
                    key={event.id}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                  >
                    <div className="aspect-[16/9] bg-gradient-to-br from-[#dff7f8] to-[#e8eefb]">
                      {event.image_url ? (
                        <img
                          src={event.image_url}
                          alt={event.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-sm font-semibold text-slate-400">
                          No Poster
                        </div>
                      )}
                    </div>

                    <div className="p-5">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${
                          automaticStatus === "Upcoming"
                            ? "bg-blue-100 text-blue-700"
                            : automaticStatus === "Ongoing"
                            ? "bg-green-100 text-green-700"
                            : automaticStatus === "Completed"
                            ? "bg-slate-100 text-slate-600"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {automaticStatus}
                      </span>

                      <h3 className="mt-3 text-xl font-black">
                        {event.title}
                      </h3>

                      {event.event_date && (
                        <p className="mt-2 text-sm text-slate-500">
                          📅 {event.event_date}
                        </p>
                      )}

                      {event.start_time && (
                        <p className="mt-1 text-sm text-slate-500">
                          🕐 {event.start_time}
                          {event.end_time
                            ? ` – ${event.end_time}`
                            : ""}
                        </p>
                      )}

                      {event.venue && (
                        <p className="mt-1 text-sm text-slate-500">
                          📍 {event.venue}
                        </p>
                      )}

                      <div className="mt-5 flex gap-2">
                        <button
                          onClick={() => editEvent(event)}
                          className="rounded-full bg-[#087f8c] px-4 py-2 text-xs font-bold text-white hover:bg-[#066b76]"
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="rounded-full border border-red-200 px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  name: string;
  value: string;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">
        {label}
      </label>

      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20"
      />
    </div>
  );
}