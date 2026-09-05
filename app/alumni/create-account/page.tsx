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
  { length: 30 },
  (_, index) => {
    const number = index + 1;

    if (number === 1) return "1st Batch";
    if (number === 2) return "2nd Batch";
    if (number === 3) return "3rd Batch";

    return `${number}th Batch`;
  }
);

const sections = ["A", "B", "C", "D", "E", "F"];

export default function CreateAlumniAccountPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [batch, setBatch] = useState("");
  const [section, setSection] = useState("");
  const [graduationYear, setGraduationYear] = useState("");

  const [currentPosition, setCurrentPosition] = useState("");
  const [organization, setOrganization] = useState("");
  const [country, setCountry] = useState("");
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

    // Clear URL when using an uploaded photo.
    setPhotoUrl("");

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  }

  function handlePhotoUrlChange(
    event: ChangeEvent<HTMLInputElement>
  ) {
    const url = event.target.value.trim();

    setPhotoUrl(url);
    setMessage("");
    setErrorMessage("");

    // Clear uploaded file when using a URL.
    if (url) {
      setSelectedPhoto(null);
      setPhotoPreview(url);
    } else {
      setPhotoPreview("");
    }
  }

  function removePhoto() {
    setSelectedPhoto(null);
    setPhotoUrl("");
    setPhotoPreview("");
    setErrorMessage("");
    setMessage("");
  }

  async function prepareProfilePhotoData() {
    if (!selectedPhoto) {
      return null;
    }

    setUploadingPhoto(true);

    try {
      const compressedFile = await imageCompression(
        selectedPhoto,
        {
          maxSizeMB: 0.7,
          maxWidthOrHeight: 1200,
          useWebWorker: true,
          fileType: "image/webp",
        }
      );

      return await new Promise<string>(
        (resolve, reject) => {
          const reader = new FileReader();

          reader.onload = () => {
            resolve(String(reader.result));
          };

          reader.onerror = () => {
            reject(
              new Error(
                "Failed to read the selected photo."
              )
            );
          };

          reader.readAsDataURL(compressedFile);
        }
      );
    } catch (error) {
      console.error(
        "Profile photo processing error:",
        error
      );

      throw new Error(
        error instanceof Error
          ? error.message
          : "Unable to process profile photo."
      );
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleCreateAccount(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setLoading(true);
    setMessage("");
    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      setLoading(false);
      return;
    }

    if (!email.trim()) {
      setErrorMessage(
        "Please enter your email address."
      );
      setLoading(false);
      return;
    }

    if (!password) {
      setErrorMessage("Please enter a password.");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        "Password must be at least 6 characters long."
      );
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match.");
      setLoading(false);
      return;
    }

    if (!batch) {
      setErrorMessage("Please select your batch.");
      setLoading(false);
      return;
    }

    if (!section) {
      setErrorMessage("Please select your section.");
      setLoading(false);
      return;
    }

    try {
      const photoData =
        await prepareProfilePhotoData();

      /*
       * If an uploaded file exists, send the
       * compressed image data.
       *
       * Otherwise, send the image URL.
       */
      const finalPhoto =
        photoData ||
        photoUrl.trim() ||
        undefined;

      const response = await fetch(
        "/api/alumni/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            full_name: fullName.trim(),
            email: email.trim().toLowerCase(),
            password,

            batch,
            section,

            graduation_year: graduationYear,

            current_position:
              currentPosition.trim(),

            organization:
              organization.trim(),

            // Optional country.
            country: country.trim() || null,

            bio: bio.trim(),

            linkedin_url:
              linkedinUrl.trim(),

            facebook_url:
              facebookUrl.trim(),

            instagram_url:
              instagramUrl.trim(),

            is_public: isPublic,

            photoData: finalPhoto,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to create your alumni account."
        );
      }

      /*
       * The server created the Auth account with
       * email_confirm: true.
       *
       * Now sign in normally.
       */
      const { createClient } =
        await import("@/lib/supabase/client");

      const supabase = createClient();

      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (loginError) {
        setMessage(
          "Alumni account created successfully. Please log in to continue."
        );

        setTimeout(() => {
          router.push("/alumni/login");
          router.refresh();
        }, 1200);

        return;
      }

      setMessage(
        "Alumni account created successfully! Redirecting to your profile..."
      );

      setTimeout(() => {
        router.push("/alumni/profile");
        router.refresh();
      }, 1000);
    } catch (error) {
      console.error(
        "Create alumni account error:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to create your alumni account. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a]">
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0a0f1a]">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
            Pharmacia Club DIU
          </p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#0b1736] dark:text-white sm:text-5xl">
            Create Alumni Account
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Join the Pharmacia Club DIU alumni
            community and create your
            professional alumni profile.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-12">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
          <form
            onSubmit={handleCreateAccount}
            className="space-y-8"
          >
            {/* ACCOUNT INFORMATION */}
            <div>
              <h2 className="text-xl font-extrabold text-[#0b1736] dark:text-white">
                Account Information
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Your email and password will be
                used to log in.
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">
                    Full Name *
                  </label>

                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    placeholder="Enter your full name"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Email Address *
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="your@email.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Password *
                  </label>

                  <input
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Confirm Password *
                  </label>

                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* ACADEMIC INFORMATION */}
            <div className="border-t border-slate-200 pt-8 dark:border-slate-800">
              <h2 className="text-xl font-extrabold text-[#0b1736] dark:text-white">
                Academic Information
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Batch *
                  </label>

                  <select
                    value={batch}
                    onChange={(e) =>
                      setBatch(e.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">
                      Select Batch
                    </option>

                    {batches.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Section *
                  </label>

                  <select
                    value={section}
                    onChange={(e) =>
                      setSection(e.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">
                      Select Section
                    </option>

                    {sections.map((item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        Section {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Graduation Year
                  </label>

                  <input
                    type="number"
                    min="2000"
                    max="2100"
                    value={graduationYear}
                    onChange={(e) =>
                      setGraduationYear(
                        e.target.value
                      )
                    }
                    placeholder="e.g. 2026"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* PROFILE PHOTO */}
            <div className="border-t border-slate-200 pt-8 dark:border-slate-800">
              <h2 className="text-xl font-extrabold text-[#0b1736] dark:text-white">
                Profile Photo
              </h2>

              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                Upload a photo or paste a public image URL.
              </p>

              <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
                {/* PHOTO PREVIEW */}
                <div className="relative">
                  <div className="h-36 w-36 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-md dark:border-slate-800 dark:bg-slate-700">
                    {photoPreview ? (
                      <img
                        src={photoPreview}
                        alt="Profile preview"
                        className="h-full w-full object-cover"
                        onError={() => {
                          if (photoUrl) {
                            setErrorMessage(
                              "The image URL could not be loaded. Please check the URL."
                            );
                          }
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-5xl">
                        🎓
                      </div>
                    )}
                  </div>

                  {photoPreview && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute -right-2 -top-2 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-lg font-bold text-white shadow-md hover:bg-red-700"
                      aria-label="Remove profile photo"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* FILE UPLOAD */}
                <label className="mt-6 cursor-pointer rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c]">
                  📷 Choose Profile Photo

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handlePhotoSelect}
                    disabled={loading}
                    className="hidden"
                  />
                </label>

                <p className="mt-3 text-center text-xs text-slate-500 dark:text-slate-400">
                  JPG, PNG or WebP
                  <br />
                  Maximum 10 MB • Automatically compressed
                </p>

                {/* OR */}
                <div className="my-6 flex w-full max-w-md items-center gap-3">
                  <div className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />

                  <span className="text-xs font-bold text-slate-500">
                    OR
                  </span>

                  <div className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
                </div>

                {/* IMAGE URL */}
                <div className="w-full max-w-md">
                  <label className="mb-2 block text-sm font-semibold">
                    Profile Image URL
                  </label>

                  <input
                    type="url"
                    value={photoUrl}
                    onChange={handlePhotoUrlChange}
                    disabled={loading}
                    placeholder="https://example.com/profile-photo.jpg"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                    Paste a direct public URL to your profile image.
                  </p>
                </div>

                {/* SELECTED FILE MESSAGE */}
                {selectedPhoto && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                    ✓ Photo selected successfully
                  </div>
                )}

                {/* URL MESSAGE */}
                {photoUrl && !selectedPhoto && (
                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
                    ✓ Image URL added
                  </div>
                )}

                {/* REMOVE BUTTON */}
                {photoPreview && (
                  <button
                    type="button"
                    onClick={removePhoto}
                    className="mt-4 rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                  >
                    Remove Profile Photo
                  </button>
                )}
              </div>
            </div>

            {/* PROFESSIONAL INFORMATION */}
            <div className="border-t border-slate-200 pt-8 dark:border-slate-800">
              <h2 className="text-xl font-extrabold text-[#0b1736] dark:text-white">
                Professional Information
              </h2>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Current Position
                  </label>

                  <input
                    value={currentPosition}
                    onChange={(e) =>
                      setCurrentPosition(
                        e.target.value
                      )
                    }
                    placeholder="e.g. Production Officer"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Organization
                  </label>

                  <input
                    value={organization}
                    onChange={(e) =>
                      setOrganization(
                        e.target.value
                      )
                    }
                    placeholder="e.g. Pharmaceutical Company"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                {/* COUNTRY */}
                <div>
                  <label className="mb-2 block text-sm font-semibold">
                    Current Country
                    <span className="ml-2 text-xs font-normal text-slate-400">
                      Optional
                    </span>
                  </label>

                  <input
                    type="text"
                    value={country}
                    onChange={(e) =>
                      setCountry(e.target.value)
                    }
                    placeholder="e.g. Bangladesh, USA, UK, Canada"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-2 block text-sm font-semibold">
                    Short Bio
                  </label>

                  <textarea
                    value={bio}
                    onChange={(e) =>
                      setBio(e.target.value)
                    }
                    rows={5}
                    maxLength={500}
                    placeholder="Write a short professional introduction..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    {bio.length}/500 characters
                  </p>
                </div>
              </div>
            </div>

            {/* SOCIAL PROFILES */}
            <div className="border-t border-slate-200 pt-8 dark:border-slate-800">
              <h2 className="text-xl font-extrabold text-[#0b1736] dark:text-white">
                Social Profiles
              </h2>

              <div className="mt-5 space-y-5">
                <input
                  type="url"
                  value={linkedinUrl}
                  onChange={(e) =>
                    setLinkedinUrl(e.target.value)
                  }
                  placeholder="LinkedIn URL"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

                <input
                  type="url"
                  value={facebookUrl}
                  onChange={(e) =>
                    setFacebookUrl(e.target.value)
                  }
                  placeholder="Facebook URL"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) =>
                    setInstagramUrl(e.target.value)
                  }
                  placeholder="Instagram URL"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* VISIBILITY */}
            <div className="border-t border-slate-200 pt-8 dark:border-slate-800">
              <label className="flex cursor-pointer items-start gap-3">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) =>
                    setIsPublic(
                      e.target.checked
                    )
                  }
                  className="mt-1 h-4 w-4"
                />

                <span>
                  <span className="block text-sm font-bold">
                    Show my profile publicly
                  </span>

                  <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">
                    Your profile will appear in
                    the Our Proud Alumni directory.
                  </span>
                </span>
              </label>
            </div>

            {/* MESSAGES */}
            {message && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium text-emerald-700">
                {message}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium text-red-700">
                {errorMessage}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={
                loading ||
                uploadingPhoto
              }
              className="w-full rounded-full bg-[#0b1736] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? uploadingPhoto
                  ? "Processing Profile Photo..."
                  : "Creating Account..."
                : "Create Alumni Account"}
            </button>

            <div className="border-t border-slate-200 pt-6 text-center dark:border-slate-800">
              <p className="text-sm text-slate-500">
                Already have an alumni account?
              </p>

              <Link
                href="/alumni/login"
                className="mt-2 inline-block text-sm font-bold text-[#087f8c] hover:underline"
              >
                Alumni Login
              </Link>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
