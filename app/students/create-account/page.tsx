"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const CURRENT_BATCHES = [29, 30, 31, 32, 33, 34, 35, 36];
const SECTIONS = ["A", "B"];

const supabase = createClient();

export default function CreateStudentAccountPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [batch, setBatch] = useState("");
  const [section, setSection] = useState("");
  const [studentId, setStudentId] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");

  /*
   * Graduation month is stored as:
   *
   * YYYY-MM
   *
   * Example:
   * September 2026 = 2026-09
   *
   * The API converts this to:
   * 2026-09-01
   */
  const [graduationDate, setGraduationDate] = useState("");

  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  function handlePhotoChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");

    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Profile photo must be smaller than 5MB.");
      return;
    }

    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setPhoto(file);
    setPhotoPreview(URL.createObjectURL(file));
  }

  async function uploadPhoto() {
    if (!photo) {
      return photoUrl || "";
    }

    const extension =
      photo.name.split(".").pop()?.toLowerCase() || "jpg";

    const fileName = `${crypto.randomUUID()}.${extension}`;
    const filePath = `student-profiles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-photos")
      .upload(filePath, photo, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(
        `Profile photo upload failed: ${uploadError.message}`
      );
    }

    const { data } = supabase.storage
      .from("profile-photos")
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!password) {
      setError("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!batch) {
      setError("Please select your batch.");
      return;
    }

    if (!section) {
      setError("Please select your section.");
      return;
    }

    /*
     * Graduation date is optional.
     *
     * If empty:
     *   graduation_date = null
     *
     * Therefore the student stays in Running Students.
     */
    if (graduationDate) {
      const validFormat = /^\d{4}-(0[1-9]|1[0-2])$/;

      if (!validFormat.test(graduationDate)) {
        setError("Please select a valid graduation month.");
        return;
      }
    }

    setLoading(true);

    try {
      const finalPhoto = await uploadPhoto();

      const response = await fetch("/api/students/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          batch: Number(batch),
          section,
          student_id: studentId.trim(),
          blood_group: bloodGroup,
          graduation_date: graduationDate || null,
          linkedin_url: linkedin.trim(),
          instagram_url: instagram.trim(),
          facebook_url: facebook.trim(),
          profile_photo_url: finalPhoto,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || "Failed to create student account."
        );
      }

      setMessage(
        data.message ||
          "Student account created successfully."
      );

      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setBatch("");
      setSection("");
      setStudentId("");
      setBloodGroup("");
      setGraduationDate("");
      setLinkedin("");
      setInstagram("");
      setFacebook("");
      setPhoto(null);
      setPhotoUrl("");

      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
        setPhotoPreview("");
      }
    } catch (err) {
      console.error("Student registration error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6">
      <div className="mx-auto max-w-3xl">
        {/* Back */}
        <div className="mb-6">
          <Link
            href="/students"
            className="inline-flex items-center text-sm font-medium text-slate-600 transition hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
          >
            ← Back to Students
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Pharmacia Club DIU
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
            Create Student Account
          </h1>

          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
            Register your profile for the Pharmacia Club student
            directory.
          </p>
        </div>

        {/* Success */}
        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
            {message}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >
          {/* Basic Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Basic Information
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Enter your basic account information.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <FormField
                label="Full Name"
                required
                value={fullName}
                onChange={setFullName}
                placeholder="Enter your full name"
              />

              <FormField
                label="Email Address"
                required
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="example@email.com"
              />

              <FormField
                label="Password"
                required
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Minimum 6 characters"
              />

              <FormField
                label="Confirm Password"
                required
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Re-enter your password"
              />
            </div>
          </section>

          {/* Academic Information */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Academic Information
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Provide your current academic details.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <SelectField
                label="Batch"
                required
                value={batch}
                onChange={setBatch}
                placeholder="Select batch"
                options={CURRENT_BATCHES.map((item) => ({
                  value: String(item),
                  label: `Batch ${item}`,
                }))}
              />

              <SelectField
                label="Section"
                required
                value={section}
                onChange={setSection}
                placeholder="Select section"
                options={SECTIONS.map((item) => ({
                  value: item,
                  label: `Section ${item}`,
                }))}
              />

              <FormField
                label="Student ID"
                value={studentId}
                onChange={setStudentId}
                placeholder="Enter your student ID"
              />

              <FormField
                label="Blood Group"
                value={bloodGroup}
                onChange={setBloodGroup}
                placeholder="Example: B+"
              />

              {/* NEW GRADUATION FIELD */}
              <div className="sm:col-span-2">
                <label
                  htmlFor="graduation-date"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Graduation Month & Year
                  <span className="ml-1 text-xs font-normal text-slate-400">
                    (Optional)
                  </span>
                </label>

                <input
                  id="graduation-date"
                  type="month"
                  value={graduationDate}
                  onChange={(e) =>
                    setGraduationDate(e.target.value)
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Select the month and year you graduate. Once
                  that month arrives, your profile will
                  automatically appear in the Alumni section.
                  Leave this empty if you do not want to set a
                  graduation date.
                </p>
              </div>
            </div>
          </section>

          {/* Profile Photo */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Profile Photo
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add a professional profile photo.
              </p>
            </div>

            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <div className="flex h-32 w-32 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 ring-4 ring-slate-200 dark:bg-slate-800 dark:ring-slate-700">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-sm text-slate-400">
                    No Photo
                  </span>
                )}
              </div>

              <div className="w-full">
                <label
                  htmlFor="profile-photo"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Choose Photo
                </label>

                <input
                  id="profile-photo"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block w-full cursor-pointer rounded-xl border border-slate-300 bg-white text-sm text-slate-700 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-3 file:text-sm file:font-medium dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:file:bg-slate-700"
                />

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  JPG, PNG, WEBP or other image format. Maximum
                  size: 5MB.
                </p>
              </div>
            </div>
          </section>

          {/* Social Links */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Social Links
              </h2>

              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Add your social media profiles. These fields are
                optional.
              </p>
            </div>

            <div className="space-y-5">
              <FormField
                label="LinkedIn"
                value={linkedin}
                onChange={setLinkedin}
                placeholder="https://linkedin.com/in/your-profile"
              />

              <FormField
                label="Instagram"
                value={instagram}
                onChange={setInstagram}
                placeholder="https://instagram.com/your-profile"
              />

              <FormField
                label="Facebook"
                value={facebook}
                onChange={setFacebook}
                placeholder="https://facebook.com/your-profile"
              />
            </div>
          </section>

          {/* Submit */}
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Creating Account..."
                : "Create Student Account"}
            </button>

            <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
              Already have an account?{" "}
              <Link
                href="/students/login"
                className="font-semibold text-blue-600 hover:underline dark:text-blue-400"
              >
                Login here
              </Link>
            </p>
          </section>
        </form>
      </div>
    </main>
  );
}

function FormField({
  label,
  required = false,
  type = "text",
  value,
  onChange,
  placeholder,
}: {
  label: string;
  required?: boolean;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
      />
    </div>
  );
}

function SelectField({
  label,
  required = false,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  required?: boolean;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: {
    value: string;
    label: string;
  }[];
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}

        {required && (
          <span className="ml-1 text-red-500">*</span>
        )}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option
            key={option.value}
            value={option.value}
          >
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
