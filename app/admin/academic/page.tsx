"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AcademicResource = {
  id: number;
  title: string;
  description: string | null;
  category: string;
  course_code: string | null;
  resource_type: string | null;
  file_url: string | null;
  external_url: string | null;
  uploaded_by: string | null;
  is_active: boolean | null;
  created_at: string | null;
  course: string | null;
  semester: string | null;
};

const categories = [
  "Study Materials",
  "Question Bank",
  "Practical Resources",
  "Academic Calendar",
  "Exam Preparation",
  "Learning Resources",
];

const semesters = [
  "1st Semester",
  "2nd Semester",
  "3rd Semester",
  "4th Semester",
  "5th Semester",
  "6th Semester",
  "7th Semester",
  "8th Semester",
];

const resourceTypes = [
  "PDF",
  "PPTX",
  "DOCX",
  "XLSX",
  "IMAGE",
  "VIDEO",
  "LINK",
  "OTHER",
];

const emptyForm = {
  title: "",
  description: "",
  category: "Study Materials",
  course_code: "",
  resource_type: "PDF",
  file_url: "",
  external_url: "",
  course: "",
  semester: "",
  is_active: true,
};

export default function AcademicAdminPage() {
  const supabase = createClient();

  const [resources, setResources] = useState<AcademicResource[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function loadResources() {
    setLoading(true);

    const { data, error } = await supabase
      .from("academic_resources")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      alert(error.message);
      setLoading(false);
      return;
    }

    setResources((data || []) as AcademicResource[]);
    setLoading(false);
  }

  useEffect(() => {
    loadResources();
  }, []);

  function editResource(resource: AcademicResource) {
    setEditingId(resource.id);

    setForm({
      title: resource.title || "",
      description: resource.description || "",
      category: resource.category || "Study Materials",
      course_code: resource.course_code || "",
      resource_type: resource.resource_type || "PDF",
      file_url: resource.file_url || "",
      external_url: resource.external_url || "",
      course: resource.course || "",
      semester: resource.semester || "",
      is_active: resource.is_active ?? true,
    });

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    const allowedExtensions = [
      ".pdf",
      ".ppt",
      ".pptx",
      ".doc",
      ".docx",
      ".xls",
      ".xlsx",
      ".jpg",
      ".jpeg",
      ".png",
      ".webp",
      ".mp4",
      ".mov",
      ".txt",
    ];

    const fileName = file.name.toLowerCase();

    const isAllowed = allowedExtensions.some((extension) =>
      fileName.endsWith(extension)
    );

    if (!isAllowed) {
      alert(
        "Unsupported file type. Please upload PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX, image, video or TXT files."
      );

      e.target.value = "";
      return;
    }

    const maxSize = 50 * 1024 * 1024;

    if (file.size > maxSize) {
      alert("File is too large. Maximum allowed size is 50 MB.");
      e.target.value = "";
      return;
    }

    setUploading(true);

    try {
      const extension =
        file.name.split(".").pop()?.toLowerCase() || "file";

      const safeName = file.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[^a-zA-Z0-9-_]+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .toLowerCase();

      const uniqueName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;

      const storagePath = `academic/${form.category
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")}/${uniqueName}-${safeName}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("academic-resources")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        alert(uploadError.message);
        setUploading(false);
        e.target.value = "";
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from("academic-resources")
        .getPublicUrl(storagePath);

      const publicUrl = publicUrlData.publicUrl;

      setForm((previous) => ({
        ...previous,
        file_url: publicUrl,
        resource_type:
          extension === "pdf"
            ? "PDF"
            : extension === "ppt" || extension === "pptx"
            ? "PPTX"
            : extension === "doc" || extension === "docx"
            ? "DOCX"
            : extension === "xls" || extension === "xlsx"
            ? "XLSX"
            : ["jpg", "jpeg", "png", "webp"].includes(extension)
            ? "IMAGE"
            : ["mp4", "mov"].includes(extension)
            ? "VIDEO"
            : "OTHER",
      }));

      alert("File uploaded successfully.");
    } catch (error) {
      console.error(error);
      alert("Something went wrong while uploading the file.");
    }

    setUploading(false);
    e.target.value = "";
  }

  async function saveResource(e: React.FormEvent) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert("Resource title is required.");
      return;
    }

    if (!form.category) {
      alert("Please select a category.");
      return;
    }

    if (!form.semester) {
      alert("Please select a semester.");
      return;
    }

    if (!form.course.trim()) {
      alert("Course name is required.");
      return;
    }

    if (!form.file_url.trim() && !form.external_url.trim()) {
      alert("Please upload a file or provide an external URL.");
      return;
    }

    setSaving(true);

    const dataToSave = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      category: form.category,
      course_code: form.course_code.trim() || null,
      resource_type: form.resource_type || null,
      file_url: form.file_url.trim() || null,
      external_url: form.external_url.trim() || null,
      course: form.course.trim() || null,
      semester: form.semester || null,
      is_active: form.is_active,
    };

    if (editingId !== null) {
      const { error } = await supabase
        .from("academic_resources")
        .update(dataToSave)
        .eq("id", editingId);

      if (error) {
        alert(error.message);
        setSaving(false);
        return;
      }
    } else {
      const { error } = await supabase
        .from("academic_resources")
        .insert([dataToSave]);

      if (error) {
        alert(error.message);
        setSaving(false);
        return;
      }
    }

    setSaving(false);

    const wasEditing = editingId !== null;

    resetForm();

    await loadResources();

    alert(
      wasEditing
        ? "Academic resource updated successfully."
        : "Academic resource added successfully."
    );
  }

  async function deleteResource(id: number) {
    if (!confirm("Delete this academic resource?")) {
      return;
    }

    const { error } = await supabase
      .from("academic_resources")
      .delete()
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadResources();

    alert("Academic resource deleted successfully.");
  }

  return (
    <main className="min-h-screen bg-[#f7faff] px-6 py-12 text-[#0b1736]">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}
        <div className="mb-8">
          <a
            href="/admin/dashboard"
            className="text-sm font-semibold text-[#087f8c] hover:underline"
          >
            ← Back to Dashboard
          </a>

          <h1 className="mt-5 text-4xl font-black">
            Academic Management
          </h1>

          <p className="mt-3 text-slate-500">
            Manage study materials, question banks, practical resources,
            academic calendars and other learning resources.
          </p>
        </div>

        {/* FORM */}
        <form
          onSubmit={saveResource}
          className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-black">
                {editingId !== null
                  ? "Edit Academic Resource"
                  : "Add Academic Resource"}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Category → Semester → Course → Resource
              </p>
            </div>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="text-sm font-bold text-slate-500 hover:text-red-500"
              >
                Cancel
              </button>
            )}
          </div>

          <div className="mt-7 grid gap-5 md:grid-cols-2">

            {/* CATEGORY */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Category
              </label>

              <select
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-[#087f8c]"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* SEMESTER */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Semester
              </label>

              <select
                value={form.semester}
                onChange={(e) =>
                  setForm({
                    ...form,
                    semester: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-[#087f8c]"
              >
                <option value="">Select Semester</option>

                {semesters.map((semester) => (
                  <option key={semester} value={semester}>
                    {semester}
                  </option>
                ))}
              </select>
            </div>

            {/* COURSE */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Course
              </label>

              <input
                type="text"
                value={form.course}
                onChange={(e) =>
                  setForm({
                    ...form,
                    course: e.target.value,
                  })
                }
                placeholder="e.g. Pharmaceutical Marketing"
                className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#087f8c]"
              />
            </div>

            {/* COURSE CODE */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Course Code
              </label>

              <input
                type="text"
                value={form.course_code}
                onChange={(e) =>
                  setForm({
                    ...form,
                    course_code: e.target.value,
                  })
                }
                placeholder="e.g. 0916-xxxx"
                className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#087f8c]"
              />
            </div>

            {/* RESOURCE TITLE */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold">
                Resource Title
              </label>

              <input
                type="text"
                value={form.title}
                onChange={(e) =>
                  setForm({
                    ...form,
                    title: e.target.value,
                  })
                }
                placeholder="e.g. Chapter 01 — Introduction"
                required
                className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#087f8c]"
              />
            </div>

            {/* RESOURCE TYPE */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Resource Type
              </label>

              <select
                value={form.resource_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    resource_type: e.target.value,
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-[#087f8c]"
              >
                {resourceTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* STATUS */}
            <div>
              <label className="mb-2 block text-sm font-bold">
                Status
              </label>

              <select
                value={form.is_active ? "active" : "inactive"}
                onChange={(e) =>
                  setForm({
                    ...form,
                    is_active: e.target.value === "active",
                  })
                }
                className="w-full rounded-xl border border-slate-200 bg-white p-3 outline-none focus:border-[#087f8c]"
              >
                <option value="active">
                  Active — Visible to Students
                </option>

                <option value="inactive">
                  Inactive — Hidden
                </option>
              </select>
            </div>

            {/* FILE UPLOAD */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold">
                Upload File
              </label>

              <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-6">

                <input
                  type="file"
                  onChange={handleFileUpload}
                  disabled={uploading}
                  accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.mp4,.mov,.txt"
                  className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-[#087f8c] file:px-5 file:py-3 file:font-bold file:text-white hover:file:bg-[#066b76]"
                />

                <p className="mt-3 text-xs text-slate-500">
                  Supported: PDF, PPT, PPTX, DOC, DOCX, XLS, XLSX,
                  images, videos and TXT. Maximum 50 MB.
                </p>

                {uploading && (
                  <p className="mt-3 text-sm font-bold text-[#087f8c]">
                    Uploading file...
                  </p>
                )}

                {form.file_url && (
                  <div className="mt-4 rounded-xl bg-green-50 p-4">
                    <p className="text-sm font-bold text-green-700">
                      ✓ File uploaded successfully
                    </p>

                    <a
                      href={form.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 block truncate text-xs text-green-600 hover:underline"
                    >
                      {form.file_url}
                    </a>
                  </div>
                )}

              </div>
            </div>

            {/* EXTERNAL URL */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold">
                External URL
                <span className="ml-2 font-normal text-slate-400">
                  Optional
                </span>
              </label>

              <input
                type="url"
                value={form.external_url}
                onChange={(e) =>
                  setForm({
                    ...form,
                    external_url: e.target.value,
                  })
                }
                placeholder="Google Drive / YouTube / external link"
                className="w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#087f8c]"
              />
            </div>

            {/* DESCRIPTION */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-bold">
                Description
              </label>

              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({
                    ...form,
                    description: e.target.value,
                  })
                }
                placeholder="Optional description of this resource..."
                className="min-h-28 w-full rounded-xl border border-slate-200 p-3 outline-none focus:border-[#087f8c]"
              />
            </div>
          </div>

          {/* SAVE BUTTON */}
          <div className="mt-7 flex flex-wrap gap-3">

            <button
              type="submit"
              disabled={saving || uploading}
              className="rounded-xl bg-[#087f8c] px-7 py-3 font-bold text-white transition hover:bg-[#066b76] disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editingId !== null
                ? "Update Resource"
                : "Add Resource"}
            </button>

            {editingId !== null && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-xl border border-slate-200 bg-white px-7 py-3 font-bold text-slate-700 transition hover:bg-slate-50"
              >
                Cancel
              </button>
            )}

          </div>
        </form>

        {/* EXISTING RESOURCES */}
        <section className="mt-10">

          <div className="mb-5 flex items-center justify-between">

            <h2 className="text-2xl font-black">
              Existing Academic Resources
            </h2>

            <span className="rounded-full bg-cyan-50 px-3 py-1 text-sm font-bold text-[#087f8c]">
              {resources.length} Resource
              {resources.length !== 1 ? "s" : ""}
            </span>

          </div>

          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-slate-500">
              Loading academic resources...
            </div>
          ) : resources.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-slate-500">
              No academic resources found.
            </div>
          ) : (
            <div className="space-y-4">

              {resources.map((resource) => (
                <div
                  key={resource.id}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >

                  <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">

                    <div className="min-w-0">

                      <div className="flex flex-wrap items-center gap-2">

                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-[#087f8c]">
                          {resource.category}
                        </span>

                        {resource.semester && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {resource.semester}
                          </span>
                        )}

                        {resource.resource_type && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                            {resource.resource_type}
                          </span>
                        )}

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${
                            resource.is_active
                              ? "bg-green-50 text-green-700"
                              : "bg-red-50 text-red-600"
                          }`}
                        >
                          {resource.is_active
                            ? "Active"
                            : "Inactive"}
                        </span>

                      </div>

                      <h3 className="mt-3 text-xl font-black">
                        {resource.title}
                      </h3>

                      {resource.course && (
                        <p className="mt-1 text-sm font-semibold text-[#087f8c]">
                          {resource.course}
                        </p>
                      )}

                      {resource.course_code && (
                        <p className="mt-1 text-xs font-medium text-slate-400">
                          Course Code: {resource.course_code}
                        </p>
                      )}

                      {resource.description && (
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                          {resource.description}
                        </p>
                      )}

                    </div>

                    {/* ACTIONS */}
                    <div className="flex shrink-0 gap-2">

                      <button
                        type="button"
                        onClick={() => editResource(resource)}
                        className="rounded-xl bg-[#0b1736] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#162650]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          deleteResource(resource.id)
                        }
                        className="rounded-xl bg-red-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-red-700"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                  {/* LINKS */}
                  {(resource.file_url ||
                    resource.external_url) && (
                    <div className="mt-5 flex flex-wrap gap-3 border-t border-slate-100 pt-4">

                      {resource.file_url && (
                        <a
                          href={resource.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg bg-[#087f8c] px-4 py-2 text-xs font-bold text-white"
                        >
                          Open File
                        </a>
                      )}

                      {resource.external_url && (
                        <a
                          href={resource.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700"
                        >
                          External Link
                        </a>
                      )}

                    </div>
                  )}

                </div>
              ))}

            </div>
          )}

        </section>

      </div>
    </main>
  );
}