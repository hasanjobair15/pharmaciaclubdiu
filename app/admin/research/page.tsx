"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";

type ResearchItem = {
  id: number;
  title: string;
  abstract: string | null;
  authors: string | null;
  research_area: string | null;
  supervisor: string | null;
  publication_status: string | null;
  doi: string | null;
  external_url: string | null;
  image_url: string | null;
  created_at: string | null;
};

export default function AdminResearchPage() {
  const supabase = createClient();

  const [research, setResearch] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [abstract, setAbstract] = useState("");
  const [authors, setAuthors] = useState("");
  const [researchArea, setResearchArea] = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [publicationStatus, setPublicationStatus] = useState("");
  const [doi, setDoi] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    loadResearch();
  }, []);

  async function loadResearch() {
    setLoading(true);

    const { data, error } = await supabase
      .from("research")
      .select(
        "id, title, abstract, authors, research_area, supervisor, publication_status, doi, external_url, image_url, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      alert(error.message);
    } else {
      setResearch(data || []);
    }

    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setAbstract("");
    setAuthors("");
    setResearchArea("");
    setSupervisor("");
    setPublicationStatus("");
    setDoi("");
    setExternalUrl("");
    setImageUrl("");
  }

  function editResearch(item: ResearchItem) {
    setEditingId(item.id);
    setTitle(item.title);
    setAbstract(item.abstract || "");
    setAuthors(item.authors || "");
    setResearchArea(item.research_area || "");
    setSupervisor(item.supervisor || "");
    setPublicationStatus(item.publication_status || "");
    setDoi(item.doi || "");
    setExternalUrl(item.external_url || "");
    setImageUrl(item.image_url || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deleteResearch(id: number) {
    const confirmed = confirm(
      "Are you sure you want to delete this research?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("research")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Research deleted successfully.");

    loadResearch();
  }

  async function uploadImage(file: File) {
    try {
      setUploading(true);

      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.7,
        maxWidthOrHeight: 1600,
        useWebWorker: true,
        fileType: "image/jpeg",
      });

      const fileName =
        "research/" +
        Date.now() +
        "-" +
        Math.random().toString(36).substring(2, 8) +
        ".jpg";

      const { error: uploadError } = await supabase.storage
        .from("committee-photos")
        .upload(fileName, compressedFile, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        alert(uploadError.message);
        return;
      }

      const { data } = supabase.storage
        .from("committee-photos")
        .getPublicUrl(fileName);

      setImageUrl(data.publicUrl);

      alert("Research image uploaded successfully.");
    } catch (error) {
      console.error(error);
      alert("Image upload failed.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a research title.");
      return;
    }

    setSaving(true);

    const researchData = {
      title: title.trim(),
      abstract: abstract.trim() || null,
      authors: authors.trim() || null,
      research_area: researchArea.trim() || null,
      supervisor: supervisor.trim() || null,
      publication_status: publicationStatus.trim() || null,
      doi: doi.trim() || null,
      external_url: externalUrl.trim() || null,
      image_url: imageUrl.trim() || null,
    };

    let error;

    if (editingId !== null) {
      const result = await supabase
        .from("research")
        .update(researchData)
        .eq("id", editingId);

      error = result.error;
    } else {
      const result = await supabase
        .from("research")
        .insert([researchData]);

      error = result.error;
    }

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      editingId !== null
        ? "Research updated successfully."
        : "Research added successfully."
    );

    resetForm();
    loadResearch();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Research Manager
            </h1>

            <p className="mt-1 text-slate-600">
              Manage research projects and publications of Pharmacia Club DIU.
            </p>
          </div>

          <div className="flex gap-3">
            <a
              href="/admin/dashboard"
              className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Dashboard
            </a>

            <a
              href="/research"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View Site
            </a>
          </div>
        </div>

        {/* Form */}
        <section className="mb-10 rounded-2xl bg-white p-6 shadow">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {editingId !== null
                  ? "Edit Research"
                  : "Add Research"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add or update research information.
              </p>
            </div>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-300"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Title */}
            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                Research Title *
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter research title"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Authors + Research Area */}
            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Authors
                </label>

                <input
                  type="text"
                  value={authors}
                  onChange={(e) => setAuthors(e.target.value)}
                  placeholder="Author names"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Research Area
                </label>

                <input
                  type="text"
                  value={researchArea}
                  onChange={(e) => setResearchArea(e.target.value)}
                  placeholder="Pharmacology, CADD, Clinical Pharmacy..."
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>

            {/* Supervisor + Publication Status */}
            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Supervisor
                </label>

                <input
                  type="text"
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  placeholder="Supervisor name"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Publication Status
                </label>

                <select
                  value={publicationStatus}
                  onChange={(e) =>
                    setPublicationStatus(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select status</option>
                  <option value="Ongoing">Ongoing</option>
                  <option value="Under Review">Under Review</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Published">Published</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>

            </div>

            {/* Abstract */}
            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                Abstract
              </label>

              <textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Write the research abstract..."
                rows={8}
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* DOI */}
            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                DOI
              </label>

              <input
                type="text"
                value={doi}
                onChange={(e) => setDoi(e.target.value)}
                placeholder="10.xxxx/xxxxx"
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* External URL */}
            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                External URL
              </label>

              <input
                type="url"
                value={externalUrl}
                onChange={(e) => setExternalUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Image */}
            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                Research Image
              </label>

              <input
                type="file"
                accept="image/*"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];

                  if (file) {
                    uploadImage(file);
                  }
                }}
                className="block w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 file:mr-4 file:rounded-lg file:border-0 file:bg-slate-800 file:px-4 file:py-2 file:font-semibold file:text-white hover:file:bg-slate-700"
              />

              {uploading && (
                <p className="mt-2 text-sm font-medium text-blue-600">
                  Uploading image...
                </p>
              )}

              {imageUrl && (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-slate-700">
                    Image Preview
                  </p>

                  <img
                    src={imageUrl}
                    alt="Research preview"
                    className="h-48 w-full rounded-xl border border-slate-200 object-cover md:w-80"
                  />
                </div>
              )}
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-3 pt-2">

              <button
                type="submit"
                disabled={saving || uploading}
                className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? "Saving..."
                  : editingId !== null
                  ? "Update Research"
                  : "Add Research"}
              </button>

              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg bg-slate-200 px-6 py-3 font-semibold text-slate-800 hover:bg-slate-300"
              >
                Clear
              </button>

            </div>

          </form>
        </section>

        {/* Research List */}
        <section className="rounded-2xl bg-white p-6 shadow">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Research
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {research.length} research item
              {research.length !== 1 ? "s" : ""}
            </p>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-500">
              Loading research...
            </p>
          ) : research.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-slate-500">
                No research has been added yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">

              {research.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col gap-5 rounded-xl border border-slate-200 p-4 md:flex-row"
                >

                  {/* Image */}
                  <div className="shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="h-40 w-full rounded-lg object-cover md:w-56"
                      />
                    ) : (
                      <div className="flex h-40 w-full items-center justify-center rounded-lg bg-slate-100 text-slate-400 md:w-56">
                        No Image
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1">

                    <div className="mb-2 flex flex-wrap gap-2">

                      {item.research_area && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {item.research_area}
                        </span>
                      )}

                      {item.publication_status && (
                        <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                          {item.publication_status}
                        </span>
                      )}

                    </div>

                    <h3 className="text-lg font-bold text-slate-900">
                      {item.title}
                    </h3>

                    {item.authors && (
                      <p className="mt-2 text-sm font-medium text-slate-600">
                        Authors: {item.authors}
                      </p>
                    )}

                    {item.supervisor && (
                      <p className="mt-1 text-sm text-slate-500">
                        Supervisor: {item.supervisor}
                      </p>
                    )}

                    {item.abstract && (
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-600">
                        {item.abstract}
                      </p>
                    )}

                    <div className="mt-4 flex flex-wrap gap-2">

                      <button
                        type="button"
                        onClick={() => editResearch(item)}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteResearch(item.id)}
                        className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                      >
                        Delete
                      </button>

                    </div>

                  </div>
                </div>
              ))}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}