"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { createClient } from "@/lib/supabase/client";

type AlumniProfile = {
  id: string;
  full_name: string;
  email: string | null;
  batch: string;
  section: string;
  graduation_year: number | null;
  profile_photo_url: string | null;
  current_position: string | null;
  organization: string | null;
  bio: string | null;
  linkedin_url: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
  is_public: boolean;
};

const batches = Array.from({ length: 30 }, (_, index) => {
  const number = index + 1;

  if (number === 1) return "1st Batch";
  if (number === 2) return "2nd Batch";
  if (number === 3) return "3rd Batch";

  return `${number}th Batch`;
});

const sections = ["A", "B", "C", "D", "E", "F"];

export default function AlumniProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [userId, setUserId] = useState("");

  const [profile, setProfile] = useState<AlumniProfile | null>(null);

  const [fullName, setFullName] = useState("");
  const [batch, setBatch] = useState("");
  const [section, setSection] = useState("");
  const [graduationYear, setGraduationYear] = useState("");
  const [currentPosition, setCurrentPosition] = useState("");
  const [organization, setOrganization] = useState("");
  const [bio, setBio] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [facebookUrl, setFacebookUrl] = useState("");
  const [instagramUrl, setInstagramUrl] = useState("");
  const [isPublic, setIsPublic] = useState(true);

  const [photoUrl, setPhotoUrl] = useState("");
  const [photoPreview, setPhotoPreview] = useState("");
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.replace("/alumni/login");
          return;
        }

        setUserId(user.id);

        const { data, error } = await supabase
          .from("alumni_profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          if (error.code === "PGRST116") {
            setErrorMessage(
              "Your alumni profile has not been created yet. Please create your alumni account first."
            );
          } else {
            throw error;
          }

          return;
        }

        const alumni = data as AlumniProfile;

        setProfile(alumni);

        setFullName(alumni.full_name || "");
        setBatch(alumni.batch || "");
        setSection(alumni.section || "");
        setGraduationYear(
          alumni.graduation_year
            ? String(alumni.graduation_year)
            : ""
        );
        setCurrentPosition(alumni.current_position || "");
        setOrganization(alumni.organization || "");
        setBio(alumni.bio || "");
        setLinkedinUrl(alumni.linkedin_url || "");
        setFacebookUrl(alumni.facebook_url || "");
        setInstagramUrl(alumni.instagram_url || "");
        setIsPublic(alumni.is_public ?? true);

        setPhotoUrl(alumni.profile_photo_url || "");
        setPhotoPreview(alumni.profile_photo_url || "");
      } catch (error) {
        console.error("Load alumni profile error:", error);

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load your alumni profile."
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router, supabase]);

  function handlePhotoSelect(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) return;

    setMessage("");
    setErrorMessage("");

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage("Please select an image smaller than 10 MB.");
      return;
    }

    setSelectedPhoto(file);

    const previewUrl = URL.createObjectURL(file);
    setPhotoPreview(previewUrl);
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!selectedPhoto || !userId) {
      return photoUrl || null;
    }

    setUploadingPhoto(true);

    try {
      const compressedFile = await imageCompression(selectedPhoto, {
        maxSizeMB: 0.7,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
        fileType: "image/webp",
      });

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
      console.error("Photo upload error:", error);

      throw new Error(
        error instanceof Error
          ? error.message
          : "Unable to upload profile photo."
      );
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function removePhoto() {
    if (!userId) return;

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const filePath = `alumni/${userId}/profile.webp`;

      const { error: removeError } = await supabase.storage
        .from("committee-photos")
        .remove([filePath]);

      if (removeError) {
        console.warn("Photo removal warning:", removeError);
      }

      const { error: updateError } = await supabase
        .from("alumni_profiles")
        .update({
          profile_photo_url: null,
        })
        .eq("id", userId);

      if (updateError) {
        throw updateError;
      }

      setPhotoUrl("");
      setPhotoPreview("");
      setSelectedPhoto(null);

      if (profile) {
        setProfile({
          ...profile,
          profile_photo_url: null,
        });
      }

      setMessage("Profile photo removed successfully.");
    } catch (error) {
      console.error("Remove photo error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to remove profile photo."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setErrorMessage("");

    if (!fullName.trim()) {
      setErrorMessage("Please enter your full name.");
      setSaving(false);
      return;
    }

    if (!batch) {
      setErrorMessage("Please select your batch.");
      setSaving(false);
      return;
    }

    if (!section) {
      setErrorMessage("Please select your section.");
      setSaving(false);
      return;
    }

    try {
      let finalPhotoUrl = photoUrl || null;

      if (selectedPhoto) {
        finalPhotoUrl = await uploadPhoto();
      }

      const { data, error } = await supabase
        .from("alumni_profiles")
        .update({
          full_name: fullName.trim(),
          batch,
          section,
          graduation_year: graduationYear
            ? Number(graduationYear)
            : null,
          profile_photo_url: finalPhotoUrl,
          current_position: currentPosition.trim() || null,
          organization: organization.trim() || null,
          bio: bio.trim() || null,
          linkedin_url: linkedinUrl.trim() || null,
          facebook_url: facebookUrl.trim() || null,
          instagram_url: instagramUrl.trim() || null,
          is_public: isPublic,
        })
        .eq("id", userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      setProfile(data as AlumniProfile);
      setPhotoUrl(finalPhotoUrl || "");
      setSelectedPhoto(null);

      setMessage("Your alumni profile has been updated successfully.");
    } catch (error) {
      console.error("Save alumni profile error:", error);

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save your alumni profile."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await supabase.auth.signOut();
      router.replace("/alumni/login");
      router.refresh();
    } catch (error) {
      console.error("Logout error:", error);
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-[#0a0f1a]">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-[#087f8c]" />
          <p className="mt-4 text-sm font-medium text-slate-600 dark:text-slate-300">
            Loading your alumni profile...
          </p>
        </div>
      </main>
    );
  }

  if (errorMessage && !profile) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-16 dark:bg-[#0a0f1a]">
        <div className="mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-3xl dark:bg-red-950/30">
            ⚠️
          </div>

          <h1 className="mt-6 text-2xl font-extrabold text-[#0b1736] dark:text-white">
            Profile Not Found
          </h1>

          <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {errorMessage}
          </p>

          <Link
            href="/alumni/create-account"
            className="mt-7 block rounded-full bg-[#0b1736] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c]"
          >
            Create Alumni Profile
          </Link>

          <Link
            href="/alumni"
            className="mt-4 block text-sm font-semibold text-slate-500 hover:text-[#087f8c]"
          >
            ← Back to Alumni Directory
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-[#0a0f1a]">
      {/* HEADER */}
      <section className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0a0f1a]">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-[#087f8c]">
                Pharmacia Club DIU
              </p>

              <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-[#0b1736] dark:text-white">
                My Alumni Profile
              </h1>

              <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300">
                Manage your alumni information and keep your profile updated.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/alumni"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                ← Alumni Directory
              </Link>

              <Link
                href="/alumni/change-password"
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                🔐 Change Password
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                className="rounded-xl bg-[#0b1736] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#087f8c] disabled:opacity-60"
              >
                {loggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* MAIN */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* PROFILE PHOTO CARD */}
          <aside className="h-fit rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <div className="text-center">
              <h2 className="text-lg font-bold text-[#0b1736] dark:text-white">
                Profile Photo
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Upload a professional photo for your alumni profile.
              </p>

              <div className="mx-auto mt-6 h-40 w-40 overflow-hidden rounded-full border-4 border-white bg-slate-100 shadow-lg ring-1 ring-slate-200 dark:border-slate-800 dark:bg-slate-800 dark:ring-slate-700">
                {photoPreview ? (
                  <img
                    src={photoPreview}
                    alt={fullName || "Alumni profile"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-6xl">
                    🎓
                  </div>
                )}
              </div>

              <label className="mt-6 block cursor-pointer rounded-full bg-[#0b1736] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#087f8c]">
                {uploadingPhoto ? "Uploading..." : "📷 Choose Photo"}

                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  disabled={saving || uploadingPhoto}
                  className="hidden"
                />
              </label>

              <p className="mt-3 text-xs leading-5 text-slate-500 dark:text-slate-400">
                JPG, PNG or WebP • Maximum 10 MB
                <br />
                Image will be automatically compressed.
              </p>

              {selectedPhoto && (
                <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-left text-xs leading-5 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                  New photo selected. Click{" "}
                  <strong>Save Profile</strong> to upload it.
                </div>
              )}

              {photoUrl && !selectedPhoto && (
                <button
                  type="button"
                  onClick={removePhoto}
                  disabled={saving}
                  className="mt-4 text-sm font-semibold text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
                >
                  Remove Photo
                </button>
              )}
            </div>

            {/* VISIBILITY */}
            <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
              <p className="text-sm font-bold text-[#0b1736] dark:text-white">
                Directory Visibility
              </p>

              <div className="mt-3 rounded-xl bg-slate-50 p-4 dark:bg-slate-800/70">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="mt-1 h-4 w-4 accent-[#087f8c]"
                  />

                  <span>
                    <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                      Show my profile publicly
                    </span>

                    <span className="mt-1 block text-xs leading-5 text-slate-500 dark:text-slate-400">
                      Your profile will appear in the Our Proud Alumni
                      directory.
                    </span>
                  </span>
                </label>
              </div>
            </div>
          </aside>

          {/* EDIT PROFILE */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-8">
            <div>
              <h2 className="text-2xl font-extrabold text-[#0b1736] dark:text-white">
                Edit Profile
              </h2>

              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                You can update your alumni information anytime.
              </p>
            </div>

            <form onSubmit={handleSave} className="mt-8 space-y-6">
              {/* NAME */}
              <div>
                <label
                  htmlFor="fullName"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Full Name *
                </label>

                <input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Email Address
                </label>

                <input
                  id="email"
                  value={profile?.email || ""}
                  disabled
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400"
                />

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  Email is connected to your login account.
                </p>
              </div>

              {/* BATCH + SECTION */}
              <div className="grid gap-5 sm:grid-cols-2">
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
                    onChange={(e) => setBatch(e.target.value)}
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
                    onChange={(e) => setSection(e.target.value)}
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
              </div>

              {/* GRADUATION YEAR */}
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
                  onChange={(e) => setGraduationYear(e.target.value)}
                  placeholder="e.g. 2026"
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              {/* POSITION + ORGANIZATION */}
              <div className="grid gap-5 sm:grid-cols-2">
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
                    onChange={(e) => setCurrentPosition(e.target.value)}
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
                    onChange={(e) => setOrganization(e.target.value)}
                    placeholder="e.g. Pharmaceutical Company"
                    className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* BIO */}
              <div>
                <label
                  htmlFor="bio"
                  className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-200"
                >
                  Short Bio
                </label>

                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={5}
                  maxLength={500}
                  placeholder="Write a short professional introduction..."
                  className="w-full resize-none rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm leading-6 text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />

                <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                  {bio.length}/500 characters
                </p>
              </div>

              {/* SOCIAL LINKS */}
              <div className="border-t border-slate-200 pt-6 dark:border-slate-800">
                <h3 className="text-lg font-bold text-[#0b1736] dark:text-white">
                  Social Profiles
                </h3>

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
                      onChange={(e) => setLinkedinUrl(e.target.value)}
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
                      onChange={(e) => setFacebookUrl(e.target.value)}
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
                      onChange={(e) => setInstagramUrl(e.target.value)}
                      placeholder="https://www.instagram.com/..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* MESSAGES */}
              {message && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium leading-6 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                  {message}
                </div>
              )}

              {errorMessage && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium leading-6 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                  {errorMessage}
                </div>
              )}

              {/* SAVE */}
              <button
                type="submit"
                disabled={saving || uploadingPhoto}
                className="w-full rounded-full bg-[#0b1736] px-6 py-3.5 text-sm font-bold text-white transition hover:bg-[#087f8c] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving
                  ? uploadingPhoto
                    ? "Uploading Photo..."
                    : "Saving Profile..."
                  : "Save Profile"}
              </button>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}