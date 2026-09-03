"use client";

import {
  ChangeEvent,
  FormEvent,
  useMemo,
  useState,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

const batches = Array.from({ length: 30 }, (_, index) => {
  const number = index + 1;

  if (number === 1) return "1st Batch";
  if (number === 2) return "2nd Batch";
  if (number === 3) return "3rd Batch";

  return `${number}th Batch`;
});

const sections = ["A", "B", "C", "D", "E", "F"];

export default function CreateAlumniAccountPage() {
  const supabase = useMemo(() => createClient(), []);
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
  const [bio, setBio] = useState("");

  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");

  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

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

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  }

  async function uploadProfilePhoto(userId: string) {
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

      const filePath = `alumni/${userId}/profile.webp`;

      const { error: uploadError } = await supabase.storage
        .from("committee-photos")
        .upload(filePath, compressedFile, {
          contentType: "image/webp",
          upsert: true,
          cacheControl: "3600",
        });

      if (uploadError) {
        throw uploadError;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("committee-photos")
        .getPublicUrl(filePath);

      return `${publicUrl}?v=${Date.now()}`;
    } catch (error) {
      console.error("Profile photo upload error:", error);

      throw new Error(
        error instanceof Error
          ? error.message
          : "Unable to upload profile photo."
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
      setErrorMessage("Please enter your email address.");
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
      /* CREATE SUPABASE AUTH ACCOUNT */
      const {
        data: { user, session },
        error: signUpError,
      } = await supabase.auth.signUp({
        email: email.trim(),
        password,
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!user) {
        throw new Error(
          "Unable to create your alumni account."
        );
      }

      /*
       * Upload photo after account creation.
       * The authenticated session is required for Storage access.
       */
      let profilePhotoUrl: string | null = null;

      if (selectedPhoto) {
        if (!session) {
          throw new Error(
            "Your account was created, but the profile photo could not be uploaded because email confirmation is required. Please confirm your email first and add your photo from My Alumni Profile."
          );
        }

        profilePhotoUrl = await uploadProfilePhoto(user.id);
      }

      /* CREATE ALUMNI PROFILE */
      const { error: profileError } = await supabase
        .from("alumni_profiles")
        .insert({
          id: user.id,
          full_name: fullName.trim(),
          email: email.trim(),
          batch,
          section,
          graduation_year: graduationYear
            ? Number(graduationYear)
            : null,
          profile_photo_url: profilePhotoUrl,
          current_position:
            currentPosition.trim() || null,
          organization: organization.trim() || null,
          bio: bio.trim() || null,
          linkedin_url:
            linkedinUrl.trim() || null,
          facebook_url:
            facebookUrl.trim() || null,
          instagram_url:
            instagramUrl.trim() || null,
          is_public: isPublic,
        });

      if (profileError) {
        throw profileError;
      }

      if (session) {
        setMessage(
          "Alumni account created successfully! Redirecting to your profile..."
        );

        setTimeout(() => {
          router.push("/alumni/profile");
          router.refresh();
        }, 1200);
      } else {
        setMessage(
          "Your alumni account has been created successfully. Please check your email to confirm your account, then log in to complete or update your profile."
        );

        setTimeout(() => {
          router.push("/alumni/login");
        }, 2500);
      }
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
      {/* HEADER */}
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0a0f1a]">
        <div className="mx-auto max-w-4xl px-6 py-14 text-center">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
            Pharmacia Club DIU
          </p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#0b1736] dark:text-white sm:text-5xl">
            Create Alumni Account
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
            Join the Pharmacia Club DIU alumni community and
            create your professional alumni profile.
          </p>
        </div>
      </section>

      {/* FORM */}
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
                These details will be used to log in to your
                alumni account.
              </p>

              <div className="mt-5 grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label
                    htmlFor="fullName"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Full Name *
                  </label>

                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) =>
                      setFullName(e.target.value)
                    }
                    placeholder="Enter your full name"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Email Address *
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) =>
                      setEmail(e.target.value)
                    }
                    placeholder="your@email.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Password *
                  </label>

                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    placeholder="Minimum 6 characters"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Confirm Password *
                  </label>

                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
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
                  <label
                    htmlFor="batch"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Batch *
                  </label>

                  <select
                    id="batch"
                    value={batch}
                    onChange={(e) =>
                      setBatch(e.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Select Batch</option>

                    {batches.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="section"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Section *
                  </label>

                  <select
                    id="section"
                    value={section}
                    onChange={(e) =>
                      setSection(e.target.value)
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">Select Section</option>

                    {sections.map((item) => (
                      <option key={item} value={item}>
                        Section {item}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="graduationYear"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Graduation Year
                  </label>

                  <input
                    id="graduationYear"
                    type="number"
                    min="2000"
                    max="2100"
                    value={graduationYear}
                    onChange={(e) =>
                      setGraduationYear(e.target.value)
                    }
                    placeholder="e.g. 2026"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* PROFILE PHOTO */}
            <div className="border-t border-slate-200 pt-8 dark:border-slate-800">
              <h2 className="text-xl font-extrabold text-[#0b1736] dark:text-white">
                Profile Photo
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Upload a professional photo that will appear
                in the Our Proud Alumni directory.
              </p>

              <div className="mt-6 flex flex-col items-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 dark:border-slate-700 dark:bg-slate-800/50">
                <div className="h-36 w-36 overflow-hidden rounded-full border-4 border-white bg-slate-200 shadow-md ring-1 ring-slate-200 dark:border-slate-800 dark:bg-slate-700 dark:ring-slate-700">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile preview"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-5xl">
                      🎓
                    </div>
                  )}
                </div>

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

                <p className="mt-3 text-center text-xs leading-5 text-slate-500 dark:text-slate-400">
                  JPG, PNG or WebP
                  <br />
                  Maximum 10 MB • Automatically compressed
                </p>

                {selectedPhoto && (
                  <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm font-medium text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                    ✓ Photo selected successfully
                  </div>
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
                  <label
                    htmlFor="currentPosition"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Current Position
                  </label>

                  <input
                    id="currentPosition"
                    value={currentPosition}
                    onChange={(e) =>
                      setCurrentPosition(e.target.value)
                    }
                    placeholder="e.g. Production Officer"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="organization"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Organization
                  </label>

                  <input
                    id="organization"
                    value={organization}
                    onChange={(e) =>
                      setOrganization(e.target.value)
                    }
                    placeholder="e.g. Pharmaceutical Company"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label
                    htmlFor="bio"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Short Bio
                  </label>

                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) =>
                      setBio(e.target.value)
                    }
                    rows={5}
                    maxLength={500}
                    placeholder="Write a short professional introduction..."
                    className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />

                  <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
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
                <div>
                  <label
                    htmlFor="linkedin"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    LinkedIn URL
                  </label>

                  <input
                    id="linkedin"
                    type="url"
                    value={linkedinUrl}
                    onChange={(e) =>
                      setLinkedinUrl(e.target.value)
                    }
                    placeholder="https://www.linkedin.com/in/..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="facebook"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Facebook URL
                  </label>

                  <input
                    id="facebook"
                    type="url"
                    value={facebookUrl}
                    onChange={(e) =>
                      setFacebookUrl(e.target.value)
                    }
                    placeholder="https://www.facebook.com/..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>

                <div>
                  <label
                    htmlFor="instagram"
                    className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                  >
                    Instagram URL
                  </label>

                  <input
                    id="instagram"
                    type="url"
                    value={instagramUrl}
                    onChange={(e) =>
                      setInstagramUrl(e.target.value)
                    }
                    placeholder="https://www.instagram.com/..."
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>
            </div>

            {/* VISIBILITY */}
            <div className="border-t border-slate-200 pt-8 dark:border-slate-800">
              <div className="rounded-2xl bg-slate-50 p-5 dark:bg-slate-800/60">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) =>
                      setIsPublic(e.target.checked)
                    }
                    className="mt-1 h-4 w-4 accent-[#087f8c]"
                  />

                  <span>
                    <span className="block text-sm font-bold text-slate-800 dark:text-slate-100">
                      Show my profile publicly
                    </span>

                    <span className="mt-1 block text-sm leading-6 text-slate-500 dark:text-slate-400">
                      Your profile and profile photo will
                      appear in the Our Proud Alumni directory.
                    </span>
                  </span>
                </label>
              </div>
            </div>

            {/* MESSAGES */}
            {message && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-medium leading-6 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                {message}
              </div>
            )}

            {errorMessage && (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-4 text-sm font-medium leading-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                {errorMessage}
              </div>
            )}

            {/* SUBMIT */}
            <button
              type="submit"
              disabled={loading || uploadingPhoto}
              className="w-full rounded-full bg-[#0b1736] px-6 py-4 text-sm font-bold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? uploadingPhoto
                  ? "Uploading Profile Photo..."
                  : "Creating Account..."
                : "Create Alumni Account"}
            </button>

            {/* LOGIN */}
            <div className="border-t border-slate-200 pt-6 text-center dark:border-slate-800">
              <p className="text-sm text-slate-500 dark:text-slate-400">
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