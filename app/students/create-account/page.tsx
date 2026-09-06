"use client";

import { ChangeEvent, FormEvent, useEffect, useState } from "react";
import Link from "next/link";

const CURRENT_BATCHES = [29, 30, 31, 32, 33, 34, 35, 36];
const SECTIONS = ["A", "B"];

export default function CreateStudentAccountPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [batch, setBatch] = useState("");
  const [section, setSection] = useState("");
  const [studentId, setStudentId] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");

  // CR / Co-CR / NO
  const [crStatus, setCrStatus] = useState("");

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

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setError("");

    // Basic validation
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

    // Academic validation
    if (!batch) {
      setError("Please select your batch.");
      return;
    }

    if (!section) {
      setError("Please select your section.");
      return;
    }

    // CR status validation
    if (!crStatus) {
      setError("Please select whether you are a CR/Co-CR.");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      // Basic information
      formData.append(
        "full_name",
        fullName.trim()
      );

      formData.append(
        "email",
        email.trim().toLowerCase()
      );

      formData.append(
        "password",
        password
      );

      // Academic information
      formData.append(
        "batch",
        String(Number(batch))
      );

      formData.append(
        "section",
        section
      );

      formData.append(
        "student_id",
        studentId.trim()
      );

      formData.append(
        "blood_group",
        bloodGroup.trim()
      );

      // CR / Co-CR / NO
      formData.append(
        "cr_status",
        crStatus
      );

      // Social links
      formData.append(
        "linkedin_url",
        linkedin.trim()
      );

      formData.append(
        "instagram_url",
        instagram.trim()
      );

      formData.append(
        "facebook_url",
        facebook.trim()
      );

      // Profile photo URL
      formData.append(
        "profile_photo_url",
        photoUrl.trim()
      );

      // Uploaded profile photo
      if (photo) {
        formData.append(
          "profile_photo",
          photo
        );
      }

      const response = await fetch(
        "/api/students/register",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Failed to create student account."
        );
      }

      setMessage(
        data.message ||
          "Student account created successfully."
      );

      // Reset form
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      setBatch("");
      setSection("");
      setStudentId("");
      setBloodGroup("");
      setCrStatus("");

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
      console.error(
        "Student registration error:",
        err
      );

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

        {/* Success Message */}
        {message && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900/50 dark:bg-green-950/30 dark:text-green-300">
            {message}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* ====================================================== */}
          {/* BASIC INFORMATION */}
          {/* ====================================================== */}

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

              {/* Full Name */}
              <FormField
                label="Full Name"
                required
                value={fullName}
                onChange={setFullName}
                placeholder="Enter your full name"
              />

              {/* Email */}
              <FormField
                label="Email Address"
                required
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="example@email.com"
              />

              {/* Password */}
              <FormField
                label="Password"
                required
                type="password"
                value={password}
                onChange={setPassword}
                placeholder="Minimum 6 characters"
              />

              {/* Confirm Password */}
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

          {/* ====================================================== */}
          {/* ACADEMIC INFORMATION */}
          {/* ====================================================== */}

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

              {/* Batch */}
              <SelectField
                label="Batch"
                required
                value={batch}
                onChange={setBatch}
                placeholder="Select batch"
                options={CURRENT_BATCHES.map(
                  (item) => ({
                    value: String(item),
                    label: `Batch ${item}`,
                  })
                )}
              />

              {/* Section */}
              <SelectField
                label="Section"
                required
                value={section}
                onChange={setSection}
                placeholder="Select section"
                options={SECTIONS.map(
                  (item) => ({
                    value: item,
                    label: `Section ${item}`,
                  })
                )}
              />

              {/* Student ID */}
              <FormField
                label="Student ID"
                value={studentId}
                onChange={setStudentId}
                placeholder="Enter your student ID"
              />

              {/* Blood Group */}
              <FormField
                label="Blood Group"
                value={bloodGroup}
                onChange={setBloodGroup}
                placeholder="Example: B+"
              />

              {/* ================================================= */}
              {/* CR / CO-CR */}
              {/* ================================================= */}

              <div className="sm:col-span-2">

                <label
                  htmlFor="cr-status"
                  className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                >
                  Are you a CR/Co-CR?

                  <span className="ml-1 text-red-500">
                    *
                  </span>
                </label>

                <select
                  id="cr-status"
                  value={crStatus}
                  onChange={(e) =>
                    setCrStatus(e.target.value)
                  }
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                >

                  <option value="">
                    Select your position
                  </option>

                  <option value="cr">
                    CR
                  </option>

                  <option value="co_cr">
                    Co-CR
                  </option>

                  <option value="no">
                    NO
                  </option>

                </select>

                <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-400">
                  Select your current class representative
                  position.
                </p>

              </div>

            </div>

          </section>

          {/* ====================================================== */}
          {/* PROFILE PHOTO */}
          {/* ====================================================== */}

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

              {/* Photo Preview */}
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

                {/* Upload Photo */}
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
                  JPG, PNG, WEBP or other image format.
                  Maximum size: 5MB.
                </p>

                {/* Image URL */}
                <div className="mt-5">

                  <label
                    htmlFor="profile-photo-url"
                    className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-300"
                  >
                    Or use Image URL
                  </label>

                  <input
                    id="profile-photo-url"
                    type="url"
                    value={photoUrl}
                    onChange={(e) =>
                      setPhotoUrl(e.target.value)
                    }
                    placeholder="https://example.com/profile-photo.jpg"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    If both are provided, the uploaded photo is used.
                  </p>

                </div>

              </div>

            </div>

          </section>

          {/* ====================================================== */}
          {/* SOCIAL LINKS */}
          {/* ====================================================== */}

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

              {/* LinkedIn */}
              <FormField
                label="LinkedIn"
                value={linkedin}
                onChange={setLinkedin}
                placeholder="https://linkedin.com/in/your-profile"
              />

              {/* Instagram */}
              <FormField
                label="Instagram"
                value={instagram}
                onChange={setInstagram}
                placeholder="https://instagram.com/your-profile"
              />

              {/* Facebook */}
              <FormField
                label="Facebook"
                value={facebook}
                onChange={setFacebook}
                placeholder="https://facebook.com/your-profile"
              />

            </div>

          </section>

          {/* ====================================================== */}
          {/* SUBMIT */}
          {/* ====================================================== */}

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

/* ================================================================ */
/* FORM FIELD */
/* ================================================================ */

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
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </label>

      <input
        type={type}
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-500"
      />

    </div>
  );
}

/* ================================================================ */
/* SELECT FIELD */
/* ================================================================ */

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
          <span className="ml-1 text-red-500">
            *
          </span>
        )}

      </label>

      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value)
        }
        required={required}
        className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
      >

        <option value="">
          {placeholder}
        </option>

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
