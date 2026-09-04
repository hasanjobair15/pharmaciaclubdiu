
"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import imageCompression from "browser-image-compression";

const CURRENT_BATCHES = [29, 30, 31, 32, 33, 34, 35, 36];
const SECTIONS = ["A", "B"];

export default function StudentCreateAccountPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [batch, setBatch] = useState("");
  const [section, setSection] = useState("");

  const [studentId, setStudentId] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");

  const [linkedin, setLinkedin] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");

  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!photo) {
      setPhotoPreview("");
      return;
    }

    const url = URL.createObjectURL(photo);
    setPhotoPreview(url);

    return () => URL.revokeObjectURL(url);
  }, [photo]);

  const handlePhotoChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Photo must be smaller than 10 MB.");
      return;
    }

    setError("");
    setPhoto(file);
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = () => {
        if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Could not read image."));
        }
      };

      reader.onerror = () =>
        reject(new Error("Could not read image."));

      reader.readAsDataURL(file);
    });

  const handleSubmit = async (
    event: FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    setLoading(true);
    setError("");
    setMessage("");

    try {
      if (!fullName.trim()) {
        throw new Error("Please enter your full name.");
      }

      if (!email.trim()) {
        throw new Error("Please enter your email.");
      }

      if (password.length < 6) {
        throw new Error(
          "Password must be at least 6 characters."
        );
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords do not match.");
      }

      if (!batch) {
        throw new Error("Please select your batch.");
      }

      if (!section) {
        throw new Error("Please select your section.");
      }

      let photoData = "";

      // Compress profile photo before sending
      if (photo) {
        const compressedPhoto =
          await imageCompression(photo, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1200,
            useWebWorker: true,
            fileType: "image/webp",
          });

        photoData = await fileToBase64(compressedPhoto);
      }

      const response = await fetch(
        "/api/students/register",
        {
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

            linkedin_url: linkedin.trim(),
            instagram_url: instagram.trim(),
            facebook_url: facebook.trim(),

            profile_photo_url: photoData || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Unable to create student account."
        );
      }

      // Automatically log the student in
      const { error: loginError } =
        await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

      if (loginError) {
        throw new Error(
          "Account was created, but automatic login failed. Please log in manually."
        );
      }

      setMessage(
        "Student account created successfully!"
      );

      setTimeout(() => {
        router.push("/students/profile");
        router.refresh();
      }, 800);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Student Account
          </h1>

          <p className="mt-2 text-muted-foreground">
            Create your Pharmacia Club DIU student profile
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            Current running batches:{" "}
            {CURRENT_BATCHES[0]}–{CURRENT_BATCHES[7]}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
        >
          {error && (
            <div className="mb-6 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {error}
            </div>
          )}

          {message && (
            <div className="mb-6 rounded-lg border border-green-300 bg-green-50 p-4 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">
              {message}
            </div>
          )}

          {/* Basic Information */}
          <section>
            <h2 className="mb-4 text-xl font-semibold">
              Basic Information
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-2 block text-sm font-medium">
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
                  className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Email *
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Student ID
                </label>

                <input
                  type="text"
                  value={studentId}
                  onChange={(e) =>
                    setStudentId(e.target.value)
                  }
                  placeholder="Optional"
                  className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Password *
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Minimum 6 characters"
                  required
                  minLength={6}
                  className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Confirm Password *
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Repeat your password"
                  required
                  className="w-full rounded-lg border bg-background px-4 py-3 outline-none focus:ring-2"
                />
              </div>
            </div>
          </section>

          {/* Academic Information */}
          <section className="mt-8 border-t pt-8">
            <h2 className="mb-4 text-xl font-semibold">
              Academic Information
            </h2>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Batch *
                </label>

                <select
                  value={batch}
                  onChange={(e) =>
                    setBatch(e.target.value)
                  }
                  required
                  className="w-full rounded-lg border bg-background px-4 py-3"
                >
                  <option value="">
                    Select Batch
                  </option>

                  {CURRENT_BATCHES.map((item) => (
                    <option
                      key={item}
                      value={item}
                    >
                      Batch {item}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Section *
                </label>

                <select
                  value={section}
                  onChange={(e) =>
                    setSection(e.target.value)
                  }
                  required
                  className="w-full rounded-lg border bg-background px-4 py-3"
                >
                  <option value="">
                    Select Section
                  </option>

                  {SECTIONS.map((item) => (
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
                <label className="mb-2 block text-sm font-medium">
                  Blood Group
                </label>

                <select
                  value={bloodGroup}
                  onChange={(e) =>
                    setBloodGroup(e.target.value)
                  }
                  className="w-full rounded-lg border bg-background px-4 py-3"
                >
                  <option value="">
                    Select Blood Group
                  </option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
          </section>

          {/* Profile Photo */}
          <section className="mt-8 border-t pt-8">
            <h2 className="mb-4 text-xl font-semibold">
              Profile Photo
            </h2>

            <div className="flex flex-col items-center gap-5 sm:flex-row">
              {photoPreview ? (
                <img
                  src={photoPreview}
                  alt="Profile preview"
                  className="h-28 w-28 rounded-full object-cover ring-2 ring-border"
                />
              ) : (
                <div className="flex h-28 w-28 items-center justify-center rounded-full border bg-muted text-sm text-muted-foreground">
                  No Photo
                </div>
              )}

              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="block w-full text-sm"
                />

                <p className="mt-2 text-xs text-muted-foreground">
                  Optional. Maximum 10 MB.
                </p>
              </div>
            </div>
          </section>

          {/* Social Links */}
          <section className="mt-8 border-t pt-8">
            <h2 className="mb-4 text-xl font-semibold">
              Social Links
            </h2>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  LinkedIn
                </label>

                <input
                  type="url"
                  value={linkedin}
                  onChange={(e) =>
                    setLinkedin(e.target.value)
                  }
                  placeholder="https://linkedin.com/in/..."
                  className="w-full rounded-lg border bg-background px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Instagram
                </label>

                <input
                  type="url"
                  value={instagram}
                  onChange={(e) =>
                    setInstagram(e.target.value)
                  }
                  placeholder="https://instagram.com/..."
                  className="w-full rounded-lg border bg-background px-4 py-3"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Facebook
                </label>

                <input
                  type="url"
                  value={facebook}
                  onChange={(e) =>
                    setFacebook(e.target.value)
                  }
                  placeholder="https://facebook.com/..."
                  className="w-full rounded-lg border bg-background px-4 py-3"
                />
              </div>
            </div>
          </section>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-8 w-full rounded-lg bg-primary px-5 py-3 font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating Account..."
              : "Create Student Account"}
          </button>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a
              href="/students/login"
              className="font-medium underline"
            >
              Student Login
            </a>
          </p>
        </form>
      </div>
    </main>
  );
}
