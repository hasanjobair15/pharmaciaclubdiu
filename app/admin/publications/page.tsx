"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";

type PublicationItem = {
  id: number;
  title: string;
  authors: string | null;
  publication_type: string | null;
  journal: string | null;
  publication_date: string | null;
  doi: string | null;
  abstract: string | null;
  pdf_url: string | null;
  external_url: string | null;
  image_url: string | null;
  created_at: string | null;
};

export default function AdminPublicationsPage() {
  const supabase = createClient();

  const [publications, setPublications] = useState<PublicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [title, setTitle] = useState("");
  const [authors, setAuthors] = useState("");
  const [publicationType, setPublicationType] = useState("");
  const [journal, setJournal] = useState("");
  const [publicationDate, setPublicationDate] = useState("");
  const [doi, setDoi] = useState("");
  const [abstract, setAbstract] = useState("");
  const [pdfUrl, setPdfUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    loadPublications();
  }, []);

  async function loadPublications() {
    setLoading(true);

    const { data, error } = await supabase
      .from("publications")
      .select(
        "id, title, authors, publication_type, journal, publication_date, doi, abstract, pdf_url, external_url, image_url, created_at"
      )
      .order("publication_date", { ascending: false });

    if (error) {
      alert(error.message);
    } else {
      setPublications(data || []);
    }

    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setTitle("");
    setAuthors("");
    setPublicationType("");
    setJournal("");
    setPublicationDate("");
    setDoi("");
    setAbstract("");
    setPdfUrl("");
    setExternalUrl("");
    setImageUrl("");
  }

  function editPublication(item: PublicationItem) {
    setEditingId(item.id);
    setTitle(item.title);
    setAuthors(item.authors || "");
    setPublicationType(item.publication_type || "");
    setJournal(item.journal || "");
    setPublicationDate(item.publication_date || "");
    setDoi(item.doi || "");
    setAbstract(item.abstract || "");
    setPdfUrl(item.pdf_url || "");
    setExternalUrl(item.external_url || "");
    setImageUrl(item.image_url || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function deletePublication(id: number) {
    const confirmed = confirm(
      "Are you sure you want to delete this publication?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("publications")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Publication deleted successfully.");

    loadPublications();
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
        "publications/" +
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

      alert("Publication image uploaded successfully.");
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
      alert("Please enter a publication title.");
      return;
    }

    setSaving(true);

    const publicationData = {
      title: title.trim(),
      authors: authors.trim() || null,
      publication_type: publicationType.trim() || null,
      journal: journal.trim() || null,
      publication_date: publicationDate || null,
      doi: doi.trim() || null,
      abstract: abstract.trim() || null,
      pdf_url: pdfUrl.trim() || null,
      external_url: externalUrl.trim() || null,
      image_url: imageUrl.trim() || null,
    };

    let error;

    if (editingId !== null) {
      const result = await supabase
        .from("publications")
        .update(publicationData)
        .eq("id", editingId);

      error = result.error;
    } else {
      const result = await supabase
        .from("publications")
        .insert([publicationData]);

      error = result.error;
    }

    setSaving(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert(
      editingId !== null
        ? "Publication updated successfully."
        : "Publication added successfully."
    );

    resetForm();
    loadPublications();
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">
              Publications Manager
            </h1>

            <p className="mt-1 text-slate-600">
              Manage academic publications of Pharmacia Club DIU.
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
              href="/publications"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View Site
            </a>
          </div>
        </div>

        {/* Add / Edit Form */}
        <section className="mb-10 rounded-2xl bg-white p-6 shadow">

          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {editingId !== null
                  ? "Edit Publication"
                  : "Add Publication"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Add or update publication information.
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
                Publication Title *
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter publication title"
                required
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Authors */}
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

            {/* Type + Journal */}
            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Publication Type
                </label>

                <select
                  value={publicationType}
                  onChange={(e) =>
                    setPublicationType(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value="">Select type</option>
                  <option value="Original Research">
                    Original Research
                  </option>
                  <option value="Review Article">
                    Review Article
                  </option>
                  <option value="Systematic Review">
                    Systematic Review
                  </option>
                  <option value="Case Report">
                    Case Report
                  </option>
                  <option value="Short Communication">
                    Short Communication
                  </option>
                  <option value="Conference Paper">
                    Conference Paper
                  </option>
                  <option value="Book Chapter">
                    Book Chapter
                  </option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Journal
                </label>

                <input
                  type="text"
                  value={journal}
                  onChange={(e) => setJournal(e.target.value)}
                  placeholder="Journal name"
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

            </div>

            {/* Publication Date + DOI */}
            <div className="grid gap-5 md:grid-cols-2">

              <div>
                <label className="mb-2 block font-semibold text-slate-800">
                  Publication Date
                </label>

                <input
                  type="date"
                  value={publicationDate}
                  onChange={(e) =>
                    setPublicationDate(e.target.value)
                  }
                  className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
              </div>

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

            </div>

            {/* Abstract */}
            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                Abstract
              </label>

              <textarea
                value={abstract}
                onChange={(e) => setAbstract(e.target.value)}
                placeholder="Write the publication abstract..."
                rows={8}
                className="w-full resize-y rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* PDF URL */}
            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                PDF URL
              </label>

              <input
                type="url"
                value={pdfUrl}
                onChange={(e) => setPdfUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />

              <p className="mt-1 text-xs text-slate-500">
                Paste the public URL of the publication PDF.
              </p>
            </div>

            {/* External URL */}
            <div>
              <label className="mb-2 block font-semibold text-slate-800">
                External Publication URL
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
                Publication Image
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

              <p className="mt-2 text-xs text-slate-500">
                Recommended: JPG or PNG image.
              </p>

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
                    alt="Publication preview"
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
                  ? "Update Publication"
                  : "Add Publication"}
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

        {/* Publications List */}
        <section className="rounded-2xl bg-white p-6 shadow">

          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              Publications
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {publications.length} publication
              {publications.length !== 1 ? "s" : ""}
            </p>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-500">
              Loading publications...
            </p>
          ) : publications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center">
              <p className="text-slate-500">
                No publications have been added yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">

              {publications.map((item) => (
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

                      {item.publication_type && (
                        <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                          {item.publication_type}
                        </span>
                      )}

                      {item.publication_date && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
                          {item.publication_date}
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

                    {item.journal && (
                      <p className="mt-1 text-sm text-slate-500">
                        Journal: {item.journal}
                      </p>
                    )}

                    {item.doi && (
                      <p className="mt-1 break-all text-sm text-slate-500">
                        DOI: {item.doi}
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
                        onClick={() => editPublication(item)}
                        className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-600"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deletePublication(item.id)}
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