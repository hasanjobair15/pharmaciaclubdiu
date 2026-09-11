"use client";

import {
  ChangeEvent,
  FormEvent,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";

const batches = Array.from(
  { length: 28 },
  (_, index) => {
    const number = index + 1;

    let label = `${number}th Batch`;

    if (number === 1) label = "1st Batch";
    if (number === 2) label = "2nd Batch";
    if (number === 3) label = "3rd Batch";

    return {
      value: String(number).padStart(2, "0"),
      label,
    };
  }
);

const sections = ["A", "B", "C", "D", "E", "F"];

const professionalCategories = [
  "Industry / Pharmaceutical Company",
  "Hospital Pharmacy",
  "Clinical Pharmacy",
  "Academia / Teaching",
  "Research",
  "PhD",
  "Government",
  "Abroad",
  "Entrepreneur",
  "Other",
];

export default function CreateAlumniAccountPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [batch, setBatch] = useState("");
  const [section, setSection] = useState("");
  const [graduationDate, setGraduationDate] = useState("");

  const [currentPosition, setCurrentPosition] = useState("");
  const [organization, setOrganization] = useState("");
  const [department, setDepartment] = useState("");
  const [country, setCountry] = useState("");
  const [professionalCategory, setProfessionalCategory] =
    useState("");
  const [bio, setBio] = useState("");

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  const [selectedPhoto, setSelectedPhoto] =
    useState<File | null>(null);

  const [photoPreview, setPhotoPreview] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  const [isPublic, setIsPublic] = useState(true);

  const [loading, setLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function handlePhotoSelect(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setMessage("");
    setErrorMessage("");

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage(
        "Please select an image smaller than 10 MB."
      );
      return;
    }

    setSelectedPhoto(file);

    const reader = new FileReader();

    reader.onload = () => {
      setPhotoPreview(String(reader.result || ""));
    };

    reader.readAsDataURL(file);
  }

  async function uploadPhoto(): Promise<string> {
    if (!selectedPhoto) {
      return photoUrl;
    }

    setUploadingPhoto(true);

    try {
      const compressedFile = await imageCompression(
        selectedPhoto,
        {
          maxSizeMB: 1,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: "image/webp",
        }
      );

      const formData = new FormData();

      formData.append("file", compressedFile);

      const response = await fetch(
        "/api/alumni/profile",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "Failed to upload profile photo."
        );
      }

      return result?.url || "";
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setMessage("");
    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!password) {
      setErrorMessage("Please enter a password.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (!batch) {
      setErrorMessage("Please select your batch.");
      return;
    }

    if (!section) {
      setErrorMessage("Please select your section.");
      return;
    }

    if (graduationDate) {
      const selectedDate = new Date(
        `${graduationDate}T00:00:00`
      );

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        setErrorMessage(
          "Graduation date cannot be in the future."
        );
        return;
      }
    }

    setLoading(true);

    try {
      let uploadedPhotoUrl = photoUrl;

      if (selectedPhoto) {
        uploadedPhotoUrl = await uploadPhoto();
      }

      const response = await fetch(
        "/api/alumni/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fullName: fullName.trim(),
            email: email.trim(),
            password,

            // Database receives 01, 02, 03 ... 28
            batch,

            section,

            graduationDate:
              graduationDate || null,

            profilePhotoUrl:
              uploadedPhotoUrl || null,

            currentPosition:
              currentPosition.trim() || null,

            organization:
              organization.trim() || null,

            department:
              department.trim() || null,

            country:
              country.trim() || null,

            professionalCategory:
              professionalCategory || null,

            bio:
              bio.trim() || null,

            linkedinUrl:
              linkedinUrl.trim() || null,

            facebookUrl:
              facebookUrl.trim() || null,

            instagramUrl:
              instagramUrl.trim() || null,

            isPublic,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.error ||
            "The account could not be completed. Please try again."
        );
      }

      setMessage(
        "Account created successfully. Redirecting..."
      );

      /*
       * The API creates the Supabase account.
       * We sign the user in here so the existing
       * profile page and authentication flow continue
       * to work.
       */

      const { createClient } = await import(
        "@/lib/supabase/client"
      );

      const supabase = createClient();

      const { error: signInError } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (signInError) {
        /*
         * Account was still created successfully.
         * Send the user to login if automatic login fails.
         */

        router.push("/alumni/login");
        return;
      }

      router.push("/alumni/profile");
    } catch (error) {
      console.error(
        "Alumni registration error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "The account could not be completed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">

        <div className="mb-8 text-center">
          <Link
            href="/alumni"
            className="inline-flex items-center text-sm font-medium text-muted-foreground transition hover:text-foreground"
          >
            ← Back to Alumni
          </Link>

          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-4xl">
            Create Alumni Account
          </h1>

          <p className="mt-2 text-sm text-muted-foreground sm:text-base">
            Create your professional alumni profile
            and connect with the Pharmacia Club-DIU
            community.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-8"
        >

          {/* ACCOUNT INFORMATION */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Account Information
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Use your email and password to access
                your alumni account.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              <div className="sm:col-span-2">
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-medium"
                >
                  Full Name *
                </label>

                <input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(event) =>
                    setFullName(event.target.value)
                  }
                  placeholder="Enter your full name"
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email Address *
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="your@email.com"
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium"
                >
                  Password *
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  placeholder="Minimum 6 characters"
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium"
                >
                  Confirm Password *
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  placeholder="Re-enter password"
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                  required
                  minLength={6}
                />
              </div>

            </div>
          </section>

          {/* ACADEMIC INFORMATION */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Academic Information
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Your batch determines your account
                classification as Alumni.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="batch"
                  className="mb-2 block text-sm font-medium"
                >
                  Batch *
                </label>

                <select
                  id="batch"
                  value={batch}
                  onChange={(event) =>
                    setBatch(event.target.value)
                  }
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">
                    Select Batch
                  </option>

                  {batches.map((item) => (
                    <option
                      key={item.value}
                      value={item.value}
                    >
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="section"
                  className="mb-2 block text-sm font-medium"
                >
                  Section *
                </label>

                <select
                  id="section"
                  value={section}
                  onChange={(event) =>
                    setSection(event.target.value)
                  }
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                  required
                >
                  <option value="">
                    Select Section
                  </option>

                  {sections.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="graduationDate"
                  className="mb-2 block text-sm font-medium"
                >
                  Graduation Date
                </label>

                <input
                  id="graduationDate"
                  type="date"
                  value={graduationDate}
                  onChange={(event) =>
                    setGraduationDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  Optional.
                </p>
              </div>

            </div>
          </section>

          {/* PROFILE PHOTO */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Profile Photo
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Upload a professional profile photo.
              </p>
            </div>

            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">

              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="h-28 w-28 rounded-full object-cover ring-4 ring-muted"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full bg-muted text-center text-xs text-muted-foreground">
                  No photo
                </div>
              )}

              <div className="flex-1">
                <label
                  htmlFor="profilePhoto"
                  className="mb-2 block text-sm font-medium"
                >
                  Choose Photo
                </label>

                <input
                  id="profilePhoto"
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoSelect}
                  className="block w-full text-sm"
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  JPG, PNG or other image formats.
                  Maximum 10 MB.
                </p>
              </div>

            </div>

            <div className="mt-6">
              <label
                htmlFor="photoUrl"
                className="mb-2 block text-sm font-medium"
              >
                Or Profile Photo URL
              </label>

              <input
                id="photoUrl"
                type="url"
                value={photoUrl}
                onChange={(event) => {
                  setPhotoUrl(event.target.value);

                  if (event.target.value) {
                    setPhotoPreview(
                      event.target.value
                    );
                  }
                }}
                placeholder="https://..."
                className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
              />
            </div>
          </section>

          {/* PROFESSIONAL INFORMATION */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Professional Information
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Add your current professional information.
                Only completed fields will be displayed
                publicly.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              <div>
                <label
                  htmlFor="currentPosition"
                  className="mb-2 block text-sm font-medium"
                >
                  Current Position / Designation
                </label>

                <input
                  id="currentPosition"
                  type="text"
                  value={currentPosition}
                  onChange={(event) =>
                    setCurrentPosition(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Executive, Pharmacist, Lecturer"
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="organization"
                  className="mb-2 block text-sm font-medium"
                >
                  Organization / Institution
                </label>

                <input
                  id="organization"
                  type="text"
                  value={organization}
                  onChange={(event) =>
                    setOrganization(
                      event.target.value
                    )
                  }
                  placeholder="Company / Hospital / University"
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="department"
                  className="mb-2 block text-sm font-medium"
                >
                  Department
                </label>

                <input
                  id="department"
                  type="text"
                  value={department}
                  onChange={(event) =>
                    setDepartment(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Production, QA, R&D"
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="country"
                  className="mb-2 block text-sm font-medium"
                >
                  Location / Country
                </label>

                <input
                  id="country"
                  type="text"
                  value={country}
                  onChange={(event) =>
                    setCountry(event.target.value)
                  }
                  placeholder="e.g. Bangladesh, USA"
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="professionalCategory"
                  className="mb-2 block text-sm font-medium"
                >
                  Professional Category
                </label>

                <select
                  id="professionalCategory"
                  value={professionalCategory}
                  onChange={(event) =>
                    setProfessionalCategory(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                >
                  <option value="">
                    Select Professional Category
                  </option>

                  {professionalCategories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label
                  htmlFor="bio"
                  className="mb-2 block text-sm font-medium"
                >
                  Short Bio / About
                </label>

                <textarea
                  id="bio"
                  value={bio}
                  onChange={(event) =>
                    setBio(event.target.value)
                  }
                  placeholder="Write a short professional introduction..."
                  rows={5}
                  maxLength={1000}
                  className="w-full resize-none rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  Maximum 1000 characters.
                </p>
              </div>

            </div>
          </section>

          {/* SOCIAL PROFILES */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">
                Social Profiles
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Optional professional or social links.
              </p>
            </div>

            <div className="grid gap-5">

              <div>
                <label
                  htmlFor="linkedinUrl"
                  className="mb-2 block text-sm font-medium"
                >
                  LinkedIn
                </label>

                <input
                  id="linkedinUrl"
                  type="url"
                  value={linkedinUrl}
                  onChange={(event) =>
                    setLinkedinUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://linkedin.com/in/..."
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="facebookUrl"
                  className="mb-2 block text-sm font-medium"
                >
                  Facebook
                </label>

                <input
                  id="facebookUrl"
                  type="url"
                  value={facebookUrl}
                  onChange={(event) =>
                    setFacebookUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://facebook.com/..."
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="instagramUrl"
                  className="mb-2 block text-sm font-medium"
                >
                  Instagram
                </label>

                <input
                  id="instagramUrl"
                  type="url"
                  value={instagramUrl}
                  onChange={(event) =>
                    setInstagramUrl(
                      event.target.value
                    )
                  }
                  placeholder="https://instagram.com/..."
                  className="w-full rounded-xl border bg-background px-4 py-3 outline-none transition focus:ring-2 focus:ring-primary"
                />
              </div>

            </div>
          </section>

          {/* VISIBILITY */}

          <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-7">
            <div className="mb-5">
              <h2 className="text-xl font-semibold">
                Visibility
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Control whether your alumni profile is
                visible in the public alumni directory.
              </p>
            </div>

            <label className="flex cursor-pointer items-start gap-3">

              <input
                type="checkbox"
                checked={isPublic}
                onChange={(event) =>
                  setIsPublic(event.target.checked)
                }
                className="mt-1 h-4 w-4"
              />

              <span>
                <span className="block text-sm font-medium">
                  Show my profile publicly
                </span>

                <span className="mt-1 block text-xs text-muted-foreground">
                  Your profile can appear in the public
                  alumni directory when enabled.
                </span>
              </span>

            </label>
          </section>

          {/* MESSAGES */}

          {errorMessage && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          {message && (
            <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {message}
            </div>
          )}

          {/* SUBMIT */}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

            <Link
              href="/alumni/login"
              className="text-center text-sm font-medium text-muted-foreground transition hover:text-foreground sm:text-left"
            >
              Already have an account? Login
            </Link>

            <button
              type="submit"
              disabled={loading || uploadingPhoto}
              className="rounded-xl bg-primary px-7 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {uploadingPhoto
                ? "Uploading Photo..."
                : loading
                ? "Creating Account..."
                : "Create Alumni Account"}
            </button>

          </div>

        </form>
      </div>
    </main>
  );
}
