"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import MultiImageUploader from "@/app/components/multi-image-uploader";
import { parseImageList, serializeImageList } from "@/lib/images";

type GalleryItem = {
  id: number;
  title: string | null;
  description: string | null;
  image_url: string;
  event_name: string | null;
  event_date: string | null;
  category: string | null;
  created_at: string;
};

export default function AdminGalleryPage() {
  const supabase = createClient();

  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [category, setCategory] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  useEffect(() => {
    fetchGallery();
  }, []);

  async function fetchGallery() {
    setLoading(true);

    const { data, error } = await supabase
      .from("gallery")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error loading gallery:", error);
      alert(error.message);
    } else {
      setItems(data || []);
    }

    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setEventName("");
    setEventDate("");
    setCategory("");
    setImageUrls([]);
  }

  function editItem(item: GalleryItem) {
    setEditingId(item.id);
    setTitle(item.title || "");
    setDescription(item.description || "");
    setEventName(item.event_name || "");
    setEventDate(item.event_date || "");
    setCategory(item.category || "");
    setImageUrls(parseImageList(item.image_url));

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a title.");
      return;
    }

    if (imageUrls.length === 0) {
      alert("Please add at least one image (upload, paste or URL).");
      return;
    }

    setSaving(true);

    try {
      const galleryData = {
        title: title.trim(),
        description: description.trim() || null,
        image_url: serializeImageList(imageUrls),
        event_name: eventName.trim() || null,
        event_date: eventDate || null,
        category: category.trim() || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from("gallery")
          .update(galleryData)
          .eq("id", editingId);

        if (error) {
          throw error;
        }

        alert("Gallery item updated successfully.");
      } else {
        const { error } = await supabase
          .from("gallery")
          .insert([galleryData]);

        if (error) {
          throw error;
        }

        alert("Gallery item added successfully.");
      }

      resetForm();
      await fetchGallery();
    } catch (error: any) {
      console.error("Gallery error:", error);
      alert(error.message || "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteItem(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this gallery item?"
    );

    if (!confirmed) {
      return;
    }

    const { error } = await supabase
      .from("gallery")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Gallery item deleted successfully.");

    await fetchGallery();
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* PAGE HEADER */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900">
            Gallery Manager
          </h1>

          <p className="mt-2 text-base text-slate-600">
            Add, edit and manage Pharmacia Club DIU gallery photos. Each post
            can hold any number of images.
          </p>
        </div>

        {/* ADD / EDIT FORM */}
        <div className="mb-10 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-8">

          <div className="mb-6">
            <h2 className="text-2xl font-bold text-slate-900">
              {editingId ? "Edit Gallery Item" : "Add Gallery Item"}
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              {editingId
                ? "Images are kept as they are — remove or add only what you want to change."
                : "Fill in the details and add one or more photos."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* TITLE */}
            <div>
              <label
                htmlFor="gallery-title"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Title *
              </label>

              <input
                id="gallery-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: AI in Research Seminar"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* DESCRIPTION */}
            <div>
              <label
                htmlFor="gallery-description"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Description
              </label>

              <textarea
                id="gallery-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write a short description of the photo..."
                rows={5}
                className="w-full resize-y rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* EVENT NAME */}
            <div>
              <label
                htmlFor="gallery-event-name"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Event Name
              </label>

              <input
                id="gallery-event-name"
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="Example: AI in Research"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* EVENT DATE */}
            <div>
              <label
                htmlFor="gallery-event-date"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Event Date
              </label>

              <input
                id="gallery-event-date"
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* CATEGORY */}
            <div>
              <label
                htmlFor="gallery-category"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Category
              </label>

              <input
                id="gallery-category"
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Example: Seminar, Workshop, Competition"
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-base text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* IMAGES */}
            <div>
              <label
                htmlFor="gallery-image"
                className="mb-2 block text-sm font-bold text-slate-800"
              >
                Images {!editingId && "*"}
              </label>

              <MultiImageUploader
                value={imageUrls}
                onChange={setImageUrls}
                folder="gallery"
                inputId="gallery-image"
              />
            </div>

            {/* FORM BUTTONS */}
            <div className="flex flex-wrap gap-3 border-t border-slate-200 pt-6">

              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-blue-700 px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Gallery"
                  : "Add to Gallery"}
              </button>

              {editingId && (
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-base font-bold text-slate-800 transition hover:bg-slate-100 disabled:opacity-60"
                >
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>

        {/* GALLERY LIST */}
        <section>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-2xl font-bold text-slate-900">
              Gallery Items
            </h2>

            <span className="rounded-full bg-blue-100 px-4 py-2 text-sm font-bold text-blue-800">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>

          {loading ? (
            <div className="rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-slate-200">
              <p className="text-base font-medium text-slate-600">
                Loading gallery...
              </p>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl bg-white py-16 text-center shadow-sm ring-1 ring-slate-200">
              <div className="text-5xl">🖼️</div>

              <h3 className="mt-4 text-xl font-bold text-slate-900">
                No Gallery Items Yet
              </h3>

              <p className="mt-2 text-slate-600">
                Add your first photo using the form above.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => {
                const urls = parseImageList(item.image_url);

                return (
                  <article
                    key={item.id}
                    className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-slate-200"
                  >
                    {/* IMAGE(S) */}
                    <div className="relative">
                      <img
                        src={urls[0]}
                        alt={item.title || "Gallery image"}
                        className="h-56 w-full object-cover"
                      />

                      {urls.length > 1 && (
                        <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold text-white">
                          📷 {urls.length} photos
                        </span>
                      )}
                    </div>

                    <div className="p-5">

                      {/* CATEGORY */}
                      {item.category && (
                        <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                          {item.category}
                        </span>
                      )}

                      {/* TITLE */}
                      <h3 className="mt-3 text-lg font-bold text-slate-900">
                        {item.title || "Untitled"}
                      </h3>

                      {/* EVENT */}
                      {item.event_name && (
                        <p className="mt-2 text-sm text-slate-700">
                          <span className="font-bold">Event:</span>{" "}
                          {item.event_name}
                        </p>
                      )}

                      {/* DATE */}
                      {item.event_date && (
                        <p className="mt-1 text-sm text-slate-600">
                          <span className="font-bold">Date:</span>{" "}
                          {new Date(item.event_date).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )}
                        </p>
                      )}

                      {/* DESCRIPTION */}
                      {item.description && (
                        <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                          {item.description}
                        </p>
                      )}

                      {/* ACTIONS */}
                      <div className="mt-5 flex gap-2 border-t border-slate-200 pt-4">

                        <button
                          type="button"
                          onClick={() => editItem(item)}
                          className="rounded-lg bg-blue-100 px-4 py-2 text-sm font-bold text-blue-800 transition hover:bg-blue-200"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="rounded-lg bg-red-100 px-4 py-2 text-sm font-bold text-red-800 transition hover:bg-red-200"
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
        </section>
      </div>
    </main>
  );
}
