"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type MagazinePage = {
  id: number;
  issue_id: number;
  page_number: number;
  section: string | null;
  title: string | null;
  content: string | null;
  image_url: string | null;
  pdf_url: string | null;
  created_at: string;
};

const sections = [
  "Opening & Department",
  "Meet Our Department",
  "Meet Our People",
  "Academic & Research",
  "Literary & Creative",
  "Closing",
];

export default function MagazinePageManager() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();

  const issueId = Number(params.id);

  const [issue, setIssue] = useState<any>(null);
  const [pages, setPages] = useState<MagazinePage[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [pageNumber, setPageNumber] = useState(1);
  const [section, setSection] = useState(sections[0]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [existingImageUrl, setExistingImageUrl] = useState("");
  const [existingPdfUrl, setExistingPdfUrl] = useState("");

  useEffect(() => {
    if (!issueId || Number.isNaN(issueId)) return;

    loadData();
  }, [issueId]);

  async function loadData() {
    setLoading(true);

    const { data: issueData, error: issueError } = await supabase
      .from("magazine_issues")
      .select("*")
      .eq("id", issueId)
      .single();

    if (issueError) {
      alert(issueError.message);
      router.push("/admin/magazine");
      return;
    }

    const { data: pageData, error: pageError } = await supabase
      .from("magazine_pages")
      .select("*")
      .eq("issue_id", issueId)
      .order("page_number", { ascending: true });

    if (pageError) {
      alert(pageError.message);
      setLoading(false);
      return;
    }

    setIssue(issueData);
    setPages(pageData || []);
    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setPageNumber(pages.length + 1);
    setSection(sections[0]);
    setTitle("");
    setContent("");
    setImageFile(null);
    setPdfFile(null);
    setExistingImageUrl("");
    setExistingPdfUrl("");
  }

  function editPage(page: MagazinePage) {
    setEditingId(page.id);
    setPageNumber(page.page_number);
    setSection(page.section || sections[0]);
    setTitle(page.title || "");
    setContent(page.content || "");
    setImageFile(null);
    setPdfFile(null);
    setExistingImageUrl(page.image_url || "");
    setExistingPdfUrl(page.pdf_url || "");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  async function uploadFile(
    file: File,
    folder: "images" | "pdfs"
  ) {
    const safeName = file.name
      .toLowerCase()
      .replace(/[^a-z0-9.]+/g, "-")
      .replace(/-+/g, "-");

    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}-${safeName}`;

    const filePath = `magazine/${folder}/${issueId}/${fileName}`;

    const { error } = await supabase.storage
      .from("committee-photos")
      .upload(filePath, file, {
        upsert: false,
      });

    if (error) {
      throw new Error(`File upload failed: ${error.message}`);
    }

    const { data } = supabase.storage
      .from("committee-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function savePage(e: React.FormEvent) {
    e.preventDefault();

    if (!title.trim()) {
      alert("Please enter a page title.");
      return;
    }

    if (!pageNumber || pageNumber < 1) {
      alert("Please enter a valid page number.");
      return;
    }

    setSaving(true);

    try {
      let imageUrl = existingImageUrl || null;
      let pdfUrl = existingPdfUrl || null;

      if (imageFile) {
        imageUrl = await uploadFile(imageFile, "images");
      }

      if (pdfFile) {
        pdfUrl = await uploadFile(pdfFile, "pdfs");
      }

      const pageData = {
        issue_id: issueId,
        page_number: pageNumber,
        section,
        title: title.trim(),
        content: content.trim() || null,
        image_url: imageUrl,
        pdf_url: pdfUrl,
      };

      if (editingId) {
        const { error } = await supabase
          .from("magazine_pages")
          .update(pageData)
          .eq("id", editingId);

        if (error) {
          throw new Error(error.message);
        }

        alert("Magazine page updated successfully.");
      } else {
        const { error } = await supabase
          .from("magazine_pages")
          .insert(pageData);

        if (error) {
          throw new Error(error.message);
        }

        alert("Magazine page added successfully.");
      }

      resetForm();
      await loadData();
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deletePage(id: number) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this magazine page?"
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("magazine_pages")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    if (editingId === id) {
      resetForm();
    }

    await loadData();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7faff]">
        <p className="font-semibold text-slate-500">
          Loading magazine...
        </p>
      </main>
    );
  }

  if (!issue) return null;

  return (
    <main className="min-h-screen bg-[#f7faff] text-[#0b1736]">
      {/* HEADER */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <div>
            <button
              onClick={() => router.push("/admin/magazine")}
              className="mb-2 text-sm font-semibold text-[#087f8c] hover:underline"
            >
              ← Back to Magazine
            </button>

            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#087f8c]">
              Magazine Page Manager
            </p>

            <h1 className="mt-1 text-2xl font-black">
              {issue.title}
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {issue.season} {issue.year} · {pages.length} page
              {pages.length !== 1 ? "s" : ""}
            </p>
          </div>

          <button
            onClick={() =>
              router.push(`/magazine/${issue.id}`)
            }
            className="rounded-full bg-[#0b1736] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#087f8c]"
          >
            View Magazine
          </button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
        {/* INTRO */}
        <div className="mb-10">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
            Digital Magazine
          </p>

          <h2 className="mt-3 text-4xl font-black">
            Manage Magazine Pages
          </h2>

          <p className="mt-4 max-w-3xl text-slate-500">
            Add the pages of your magazine in the correct order.
            Visitors will read them sequentially from the cover to
            the back cover.
          </p>
        </div>

        {/* PAGE FORM */}
        <div className="mb-12 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-black">
                {editingId
                  ? "Edit Magazine Page"
                  : "Add Magazine Page"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Page numbers determine the reading order.
              </p>
            </div>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold hover:border-red-400 hover:text-red-500"
              >
                Cancel Edit
              </button>
            )}
          </div>

          <form onSubmit={savePage} className="space-y-6">
            {/* PAGE NUMBER + SECTION */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-bold">
                  Page Number
                </label>

                <input
                  type="number"
                  min={1}
                  value={pageNumber}
                  onChange={(e) =>
                    setPageNumber(Number(e.target.value))
                  }
                  className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#087f8c]"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold">
                  Section
                </label>

                <select
                  value={section}
                  onChange={(e) =>
                    setSection(e.target.value)
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-[#087f8c]"
                >
                  {sections.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* TITLE */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Page Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Message from the Vice Chancellor"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-[#087f8c]"
              />
            </div>

            {/* CONTENT */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Page Content
              </label>

              <textarea
                value={content}
                onChange={(e) =>
                  setContent(e.target.value)
                }
                rows={10}
                placeholder="Write the content of this magazine page here..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 leading-7 outline-none focus:border-[#087f8c]"
              />

              <p className="mt-2 text-xs text-slate-500">
                You can leave this empty if the page mainly
                contains an image or PDF.
              </p>
            </div>

            {/* IMAGE */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Page Image
              </label>

              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setImageFile(
                    e.target.files?.[0] || null
                  )
                }
                className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />

              {existingImageUrl && !imageFile && (
                <div className="mt-3">
                  <p className="mb-2 text-xs text-slate-500">
                    Existing image:
                  </p>

                  <img
                    src={existingImageUrl}
                    alt="Existing page"
                    className="h-32 w-24 rounded-xl object-cover"
                  />
                </div>
              )}
            </div>

            {/* PDF */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                PDF File
              </label>

              <input
                type="file"
                accept=".pdf,application/pdf"
                onChange={(e) =>
                  setPdfFile(
                    e.target.files?.[0] || null
                  )
                }
                className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm"
              />

              {existingPdfUrl && !pdfFile && (
                <a
                  href={existingPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-block text-sm font-bold text-[#087f8c] hover:underline"
                >
                  View existing PDF →
                </a>
              )}
            </div>

            {/* SAVE */}
            <button
              type="submit"
              disabled={saving}
              className="rounded-full bg-[#0b1736] px-7 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving
                ? "Saving..."
                : editingId
                ? "Update Page"
                : "Add Page"}
            </button>
          </form>
        </div>

        {/* PAGE LIST */}
        <div>
          <div className="mb-6">
            <h3 className="text-2xl font-black">
              Magazine Pages
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Pages are automatically displayed according to
              page number.
            </p>
          </div>

          {pages.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-12 text-center">
              <div className="text-5xl">📖</div>

              <h4 className="mt-4 text-xl font-black">
                No pages added yet
              </h4>

              <p className="mt-2 text-sm text-slate-500">
                Start by adding the cover page above.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pages.map((page) => (
                <div
                  key={page.id}
                  className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:flex-row md:items-center"
                >
                  {/* PAGE NUMBER */}
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#e8f8f9] text-xl font-black text-[#087f8c]">
                    {page.page_number}
                  </div>

                  {/* IMAGE */}
                  {page.image_url ? (
                    <img
                      src={page.image_url}
                      alt={page.title || "Magazine page"}
                      className="h-24 w-20 shrink-0 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-20 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-2xl">
                      📄
                    </div>
                  )}

                  {/* INFO */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap gap-2">
                      {page.section && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">
                          {page.section}
                        </span>
                      )}

                      {page.pdf_url && (
                        <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-bold text-red-500">
                          PDF
                        </span>
                      )}
                    </div>

                    <h4 className="mt-2 text-lg font-black">
                      {page.title || "Untitled Page"}
                    </h4>

                    {page.content && (
                      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                        {page.content}
                      </p>
                    )}
                  </div>

                  {/* ACTIONS */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => editPage(page)}
                      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold hover:border-[#087f8c] hover:text-[#087f8c]"
                    >
                      Edit
                    </button>

                    {page.pdf_url && (
                      <a
                        href={page.pdf_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold hover:border-[#087f8c] hover:text-[#087f8c]"
                      >
                        PDF
                      </a>
                    )}

                    <button
                      onClick={() => deletePage(page.id)}
                      className="rounded-xl border border-red-200 px-4 py-2.5 text-sm font-bold text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}