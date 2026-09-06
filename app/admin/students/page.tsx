"use client";

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ADMIN_EMAIL = "diupc@diu.edu.bd";

type CRStatus = "cr" | "co_cr" | "no";

type Student = {
  id: string;
  full_name: string;
  student_id: string;
  email: string;
  batch: number | string;
  section: string;
  blood_group: string | null;
  cr_status: CRStatus | null;
  graduation_date: string | null;
  profile_photo_url: string | null;
  linkedin_url: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type StudentForm = {
  full_name: string;
  student_id: string;
  email: string;
  batch: string;
  section: string;
  blood_group: string;
  cr_status: CRStatus;
  graduation_date: string;
  profile_photo_url: string;
  linkedin_url: string;
  instagram_url: string;
  facebook_url: string;
};

const BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

function formatGraduationDate(
  value: string | null
) {
  if (!value) return "Not provided";

  const date = new Date(
    `${value.slice(0, 10)}T00:00:00`
  );

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getCRLabel(
  status: CRStatus | null
) {
  if (status === "cr") return "CR";
  if (status === "co_cr") return "Co-CR";
  return "No";
}

function getCRBadgeClass(
  status: CRStatus | null
) {
  if (status === "cr") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300";
  }

  if (status === "co_cr") {
    return "bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300";
  }

  return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
}

export default function AdminStudentsPage() {
  const router = useRouter();
  const supabase = createClient();

  const [students, setStudents] = useState<
    Student[]
  >([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [selectedBatch, setSelectedBatch] =
    useState("all");

  const [selectedStudent, setSelectedStudent] =
    useState<Student | null>(null);

  const [form, setForm] =
    useState<StudentForm>({
      full_name: "",
      student_id: "",
      email: "",
      batch: "",
      section: "",
      blood_group: "",
      cr_status: "no",
      graduation_date: "",
      profile_photo_url: "",
      linkedin_url: "",
      instagram_url: "",
      facebook_url: "",
    });

  const [profilePhoto, setProfilePhoto] =
    useState<File | null>(null);

  /*
   * ============================
   * CHECK ADMIN
   * ============================
   */
  useEffect(() => {
    let mounted = true;

    async function checkAdmin() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/admin");
          return;
        }

        const userEmail =
          user.email
            ?.trim()
            .toLowerCase();

        if (
          userEmail !==
          ADMIN_EMAIL.toLowerCase()
        ) {
          await supabase.auth.signOut();

          router.replace("/admin");
          return;
        }

        if (mounted) {
          await loadStudents();
        }
      } catch (err) {
        console.error(
          "Admin authentication error:",
          err
        );

        await supabase.auth.signOut();

        router.replace("/admin");
      }
    }

    checkAdmin();

    return () => {
      mounted = false;
    };
  }, [router]);

  /*
   * ============================
   * LOAD STUDENTS
   * ============================
   */
  async function loadStudents() {
    try {
      setLoading(true);
      setError("");

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace("/admin");
        return;
      }

      const response = await fetch(
        "/api/admin/students",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Unable to load students."
        );
      }

      setStudents(
        Array.isArray(result?.students)
          ? result.students
          : []
      );
    } catch (err) {
      console.error(
        "Load students error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load students."
      );
    } finally {
      setLoading(false);
    }
  }

  /*
   * ============================
   * FILTER STUDENTS
   * ============================
   */
  const batches = useMemo(() => {
    const unique = Array.from(
      new Set(
        students.map((student) =>
          String(student.batch)
        )
      )
    );

    return unique.sort(
      (a, b) =>
        Number(a) - Number(b)
    );
  }, [students]);

  const filteredStudents =
    useMemo(() => {
      const searchTerm =
        search.trim().toLowerCase();

      return students.filter(
        (student) => {
          const matchesSearch =
            !searchTerm ||
            student.full_name
              .toLowerCase()
              .includes(searchTerm) ||
            student.student_id
              .toLowerCase()
              .includes(searchTerm) ||
            student.email
              .toLowerCase()
              .includes(searchTerm) ||
            String(student.batch)
              .toLowerCase()
              .includes(searchTerm) ||
            student.section
              .toLowerCase()
              .includes(searchTerm);

          const matchesBatch =
            selectedBatch === "all" ||
            String(student.batch) ===
              selectedBatch;

          return (
            matchesSearch &&
            matchesBatch
          );
        }
      );
    }, [
      students,
      search,
      selectedBatch,
    ]);

  /*
   * ============================
   * OPEN EDIT MODAL
   * ============================
   */
  function openEdit(
    student: Student
  ) {
    setSelectedStudent(student);

    setForm({
      full_name:
        student.full_name || "",
      student_id:
        student.student_id || "",
      email: student.email || "",
      batch: String(
        student.batch || ""
      ),
      section:
        student.section || "",
      blood_group:
        student.blood_group || "",
      cr_status:
        student.cr_status || "no",
      graduation_date:
        student.graduation_date
          ? student.graduation_date.slice(
              0,
              7
            )
          : "",
      profile_photo_url:
        student.profile_photo_url ||
        "",
      linkedin_url:
        student.linkedin_url || "",
      instagram_url:
        student.instagram_url || "",
      facebook_url:
        student.facebook_url || "",
    });

    setProfilePhoto(null);
    setError("");
    setSuccess("");
  }

  /*
   * ============================
   * CLOSE EDIT MODAL
   * ============================
   */
  function closeEdit() {
    if (saving) return;

    setSelectedStudent(null);
    setProfilePhoto(null);
  }

  /*
   * ============================
   * FORM CHANGE
   * ============================
   */
  function updateField(
    field: keyof StudentForm,
    value: string
  ) {
    setForm((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file =
      event.target.files?.[0] ||
      null;

    if (!file) {
      setProfilePhoto(null);
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError(
        "Please select a valid image file."
      );

      event.target.value = "";
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setError(
        "Profile photo must be smaller than 5 MB."
      );

      event.target.value = "";
      return;
    }

    setError("");
    setProfilePhoto(file);
  }

  /*
   * ============================
   * SAVE STUDENT
   * ============================
   */
  async function handleSave(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (!selectedStudent) {
      return;
    }

    setError("");
    setSuccess("");

    if (!form.full_name.trim()) {
      setError(
        "Full name is required."
      );
      return;
    }

    if (!form.student_id.trim()) {
      setError(
        "Student ID is required."
      );
      return;
    }

    if (!form.email.trim()) {
      setError(
        "Email address is required."
      );
      return;
    }

    if (!form.batch.trim()) {
      setError(
        "Batch is required."
      );
      return;
    }

    if (
      form.section !== "A" &&
      form.section !== "B"
    ) {
      setError(
        "Section must be A or B."
      );
      return;
    }

    try {
      setSaving(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        router.replace("/admin");
        return;
      }

      const formData =
        new FormData();

      formData.append(
        "id",
        selectedStudent.id
      );

      formData.append(
        "full_name",
        form.full_name.trim()
      );

      formData.append(
        "student_id",
        form.student_id.trim()
      );

      formData.append(
        "email",
        form.email.trim().toLowerCase()
      );

      formData.append(
        "batch",
        form.batch.trim()
      );

      formData.append(
        "section",
        form.section
      );

      formData.append(
        "blood_group",
        form.blood_group
      );

      formData.append(
        "cr_status",
        form.cr_status
      );

      formData.append(
        "graduation_date",
        form.graduation_date
      );

      formData.append(
        "profile_photo_url",
        form.profile_photo_url.trim()
      );

      formData.append(
        "linkedin_url",
        form.linkedin_url.trim()
      );

      formData.append(
        "instagram_url",
        form.instagram_url.trim()
      );

      formData.append(
        "facebook_url",
        form.facebook_url.trim()
      );

      if (profilePhoto) {
        formData.append(
          "profile_photo",
          profilePhoto
        );
      }

      const response = await fetch(
        "/api/admin/students",
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: formData,
        }
      );

      let result: any = null;

      try {
        result = await response.json();
      } catch {
        result = null;
      }

      if (!response.ok) {
        throw new Error(
          result?.error ||
            result?.message ||
            "Unable to update student."
        );
      }

      setSuccess(
        "Student profile updated successfully."
      );

      if (result?.student) {
        setStudents((previous) =>
          previous.map((student) =>
            student.id ===
            result.student.id
              ? result.student
              : student
          )
        );
      } else {
        await loadStudents();
      }

      setSelectedStudent(null);
      setProfilePhoto(null);
    } catch (err) {
      console.error(
        "Save student error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update student profile."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ============================
   * LOGOUT
   * ============================
   */
  async function handleLogout() {
    await supabase.auth.signOut();

    router.replace("/admin");
    router.refresh();
  }

  /*
   * ============================
   * LOADING
   * ============================
   */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#070b14]">
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-5 text-sm font-medium text-slate-600 shadow-sm dark:border-slate-800 dark:bg-[#0b1120] dark:text-slate-300">
          Loading student accounts...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#070b14]">
      {/* ================= HEADER ================= */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0b1120]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <Link
              href="/admin/dashboard"
              className="text-xs font-semibold uppercase tracking-[0.18em] text-[#087f8c] hover:underline"
            >
              ← Admin Dashboard
            </Link>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#0b1736] dark:text-white sm:text-3xl">
              Student Management
            </h1>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              View and edit student accounts and
              profiles.
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-red-900 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ================= CONTENT ================= */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* SUMMARY */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0b1120]">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Students
            </p>

            <p className="mt-2 text-3xl font-bold text-[#0b1736] dark:text-white">
              {students.length}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0b1120]">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              CR
            </p>

            <p className="mt-2 text-3xl font-bold text-amber-600 dark:text-amber-400">
              {
                students.filter(
                  (student) =>
                    student.cr_status ===
                    "cr"
                ).length
              }
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0b1120]">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Co-CR
            </p>

            <p className="mt-2 text-3xl font-bold text-blue-600 dark:text-blue-400">
              {
                students.filter(
                  (student) =>
                    student.cr_status ===
                    "co_cr"
                ).length
              }
            </p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0b1120]">
          <div className="grid gap-4 md:grid-cols-[1fr_200px_auto]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Search students
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search by name, student ID, email..."
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200">
                Batch
              </label>

              <select
                value={selectedBatch}
                onChange={(event) =>
                  setSelectedBatch(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="all">
                  All batches
                </option>

                {batches.map(
                  (batch) => (
                    <option
                      key={batch}
                      value={batch}
                    >
                      Batch {batch}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="button"
                onClick={loadStudents}
                className="w-full rounded-xl bg-[#087f8c] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#066d78] md:w-auto"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && !selectedStudent && (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* SUCCESS */}
        {success && !selectedStudent && (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
            {success}
          </div>
        )}

        {/* RESULT COUNT */}
        <div className="mt-7 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#0b1736] dark:text-white">
              Students
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Showing{" "}
              {filteredStudents.length}{" "}
              of {students.length} students
            </p>
          </div>
        </div>

        {/* ================= STUDENT LIST ================= */}
        {filteredStudents.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center dark:border-slate-700 dark:bg-[#0b1120]">
            <div className="text-4xl">
              👨‍🎓
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-800 dark:text-white">
              No students found
            </h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Try changing your search or
              batch filter.
            </p>
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-[#0b1120]">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[950px]">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/70">
                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Student
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Student ID
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Batch
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Section
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      CR
                    </th>

                    <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Graduation
                    </th>

                    <th className="px-5 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Action
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredStudents.map(
                    (student) => (
                      <tr
                        key={student.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50 dark:border-slate-800/70 dark:hover:bg-slate-900/40"
                      >
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            {student.profile_photo_url ? (
                              <img
                                src={
                                  student.profile_photo_url
                                }
                                alt={
                                  student.full_name
                                }
                                className="h-11 w-11 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                              />
                            ) : (
                              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#087f8c]/10 text-lg font-bold text-[#087f8c]">
                                {student.full_name
                                  ?.charAt(0)
                                  .toUpperCase() ||
                                  "S"}
                              </div>
                            )}

                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-800 dark:text-white">
                                {
                                  student.full_name
                                }
                              </p>

                              <p className="max-w-[250px] truncate text-xs text-slate-500 dark:text-slate-400">
                                {
                                  student.email
                                }
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-sm font-medium text-slate-700 dark:text-slate-200">
                          {
                            student.student_id
                          }
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {student.batch}
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {student.section}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${getCRBadgeClass(
                              student.cr_status
                            )}`}
                          >
                            {getCRLabel(
                              student.cr_status
                            )}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-sm text-slate-600 dark:text-slate-300">
                          {formatGraduationDate(
                            student.graduation_date
                          )}
                        </td>

                        <td className="px-5 py-4 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              openEdit(
                                student
                              )
                            }
                            className="inline-flex items-center rounded-lg bg-[#087f8c] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#066d78]"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ================= EDIT MODAL ================= */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center">
            <div className="my-8 w-full max-w-4xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-[#0b1120]">
              {/* MODAL HEADER */}
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#087f8c]">
                    Admin Access
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-[#0b1736] dark:text-white">
                    Edit Student Profile
                  </h2>

                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    You can edit any information for
                    this student.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeEdit}
                  disabled={saving}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-500 transition hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  ×
                </button>
              </div>

              {/* FORM */}
              <form
                onSubmit={handleSave}
                className="max-h-[75vh] overflow-y-auto px-6 py-6"
              >
                {error && (
                  <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                    {error}
                  </div>
                )}

                {success && (
                  <div className="mb-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                    {success}
                  </div>
                )}

                {/* PROFILE PHOTO */}
                <div className="mb-7 rounded-2xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-900/50">
                  <h3 className="font-bold text-slate-800 dark:text-white">
                    Profile Photo
                  </h3>

                  <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-center">
                    {form.profile_photo_url ? (
                      <img
                        src={
                          form.profile_photo_url
                        }
                        alt={
                          form.full_name
                        }
                        className="h-24 w-24 rounded-2xl object-cover ring-4 ring-white shadow-md dark:ring-slate-800"
                      />
                    ) : (
                      <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-[#087f8c]/10 text-3xl font-bold text-[#087f8c]">
                        {form.full_name
                          ?.charAt(0)
                          .toUpperCase() ||
                          "S"}
                      </div>
                    )}

                    <div className="flex-1">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Upload new photo
                      </label>

                      <input
                        type="file"
                        accept="image/*"
                        onChange={
                          handlePhotoChange
                        }
                        className="mt-2 block w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-[#087f8c] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      />

                      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                        JPG, PNG, WEBP. Maximum
                        5 MB.
                      </p>
                    </div>
                  </div>

                  <div className="mt-5">
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                      Or profile photo URL
                    </label>

                    <input
                      type="url"
                      value={
                        form.profile_photo_url
                      }
                      onChange={(event) =>
                        updateField(
                          "profile_photo_url",
                          event.target.value
                        )
                      }
                      placeholder="https://..."
                      className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* BASIC INFORMATION */}
                <div className="mb-7">
                  <h3 className="mb-4 text-base font-bold text-[#0b1736] dark:text-white">
                    Basic Information
                  </h3>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Full Name *
                      </label>

                      <input
                        type="text"
                        value={
                          form.full_name
                        }
                        onChange={(event) =>
                          updateField(
                            "full_name",
                            event.target.value
                          )
                        }
                        required
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Student ID *
                      </label>

                      <input
                        type="text"
                        value={
                          form.student_id
                        }
                        onChange={(event) =>
                          updateField(
                            "student_id",
                            event.target.value
                          )
                        }
                        required
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Email *
                      </label>

                      <input
                        type="email"
                        value={
                          form.email
                        }
                        onChange={(event) =>
                          updateField(
                            "email",
                            event.target.value
                          )
                        }
                        required
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />

                      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                        Changing this also updates the
                        student's login email.
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Batch *
                      </label>

                      <input
                        type="number"
                        value={
                          form.batch
                        }
                        onChange={(event) =>
                          updateField(
                            "batch",
                            event.target.value
                          )
                        }
                        required
                        min="1"
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Section *
                      </label>

                      <select
                        value={
                          form.section
                        }
                        onChange={(event) =>
                          updateField(
                            "section",
                            event.target.value
                          )
                        }
                        required
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="">
                          Select section
                        </option>
                        <option value="A">
                          A
                        </option>
                        <option value="B">
                          B
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Blood Group
                      </label>

                      <select
                        value={
                          form.blood_group
                        }
                        onChange={(event) =>
                          updateField(
                            "blood_group",
                            event.target.value
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="">
                          Not specified
                        </option>

                        {BLOOD_GROUPS.map(
                          (group) => (
                            <option
                              key={group}
                              value={group}
                            >
                              {group}
                            </option>
                          )
                        )}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        CR Status
                      </label>

                      <select
                        value={
                          form.cr_status
                        }
                        onChange={(event) =>
                          updateField(
                            "cr_status",
                            event.target.value
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      >
                        <option value="no">
                          No
                        </option>

                        <option value="cr">
                          CR
                        </option>

                        <option value="co_cr">
                          Co-CR
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Graduation Date
                      </label>

                      <input
                        type="month"
                        value={
                          form.graduation_date
                        }
                        onChange={(event) =>
                          updateField(
                            "graduation_date",
                            event.target.value
                          )
                        }
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* SOCIAL LINKS */}
                <div className="mb-7">
                  <h3 className="mb-4 text-base font-bold text-[#0b1736] dark:text-white">
                    Social & Professional Links
                  </h3>

                  <div className="space-y-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        LinkedIn
                      </label>

                      <input
                        type="url"
                        value={
                          form.linkedin_url
                        }
                        onChange={(event) =>
                          updateField(
                            "linkedin_url",
                            event.target.value
                          )
                        }
                        placeholder="https://www.linkedin.com/in/..."
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Instagram
                      </label>

                      <input
                        type="url"
                        value={
                          form.instagram_url
                        }
                        onChange={(event) =>
                          updateField(
                            "instagram_url",
                            event.target.value
                          )
                        }
                        placeholder="https://www.instagram.com/..."
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200">
                        Facebook
                      </label>

                      <input
                        type="url"
                        value={
                          form.facebook_url
                        }
                        onChange={(event) =>
                          updateField(
                            "facebook_url",
                            event.target.value
                          )
                        }
                        placeholder="https://www.facebook.com/..."
                        className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:justify-end dark:border-slate-800">
                  <button
                    type="button"
                    onClick={closeEdit}
                    disabled={saving}
                    className="rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-[#087f8c] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#066d78] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving
                      ? "Saving..."
                      : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
