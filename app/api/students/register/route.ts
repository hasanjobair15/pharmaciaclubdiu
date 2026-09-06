import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isCurrentRunningBatch } from "@/app/lib/students/current-batches";

export const runtime = "nodejs";

/* =========================================================
   TYPES
========================================================= */

type CRStatus = "cr" | "co_cr" | "no";

/* =========================================================
   SUPABASE ADMIN
========================================================= */

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/* =========================================================
   CR STATUS
========================================================= */

function cleanCRStatus(value: unknown): CRStatus {
  if (typeof value !== "string") {
    return "no";
  }

  const status = value.trim().toLowerCase();

  if (status === "cr") {
    return "cr";
  }

  if (status === "co_cr") {
    return "co_cr";
  }

  return "no";
}

/* =========================================================
   GRADUATION DATE
========================================================= */

function cleanGraduationDate(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const raw = String(value).trim();

  if (!raw) {
    return null;
  }

  let year: number;
  let month: number;

  const monthMatch = raw.match(/^(\d{4})-(\d{2})$/);
  const dateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (monthMatch) {
    year = Number(monthMatch[1]);
    month = Number(monthMatch[2]);
  } else if (dateMatch) {
    year = Number(dateMatch[1]);
    month = Number(dateMatch[2]);
  } else {
    return null;
  }

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    return null;
  }

  if (year < 1900 || year > 2200) {
    return null;
  }

  if (month < 1 || month > 12) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/* =========================================================
   PROFILE PHOTO BUCKET
========================================================= */

async function ensureProfilePhotoBucket(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>
) {
  const bucketName = "profile-photos";

  const { data: bucket, error: getError } =
    await supabaseAdmin.storage.getBucket(bucketName);

  if (
    getError &&
    !getError.message.toLowerCase().includes("not found")
  ) {
    throw new Error(
      `Unable to access profile photo storage: ${getError.message}`
    );
  }

  if (!bucket) {
    const { error: createError } =
      await supabaseAdmin.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: "5MB",
        allowedMimeTypes: ["image/*"],
      });

    if (
      createError &&
      !createError.message.toLowerCase().includes("already exists")
    ) {
      throw new Error(
        `Unable to create profile photo storage: ${createError.message}`
      );
    }
  } else if (!bucket.public) {
    const { error: updateError } =
      await supabaseAdmin.storage.updateBucket(bucketName, {
        public: true,
        fileSizeLimit: "5MB",
        allowedMimeTypes: ["image/*"],
      });

    if (updateError) {
      throw new Error(
        `Profile photo bucket is private and could not be made public: ${updateError.message}`
      );
    }
  }

  return bucketName;
}

/* =========================================================
   UPLOAD PROFILE PHOTO
========================================================= */

async function uploadStudentProfilePhoto(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  file: File
) {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("Please select a valid image file.");
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Profile photo must be smaller than 5MB.");
  }

  const bucketName = await ensureProfilePhotoBucket(
    supabaseAdmin
  );

  const extension =
    file.name
      .split(".")
      .pop()
      ?.toLowerCase()
      .replace(/[^a-z0-9]/g, "") || "jpg";

  const filePath = `students/${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(
      `Profile photo upload failed: ${error.message}`
    );
  }

  const { data } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

/* =========================================================
   POST
========================================================= */

export async function POST(request: NextRequest) {
  let supabaseAdmin;

  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (error) {
    console.error(
      "Supabase configuration error:",
      error
    );

    return NextResponse.json(
      {
        error: "Server configuration error.",
      },
      {
        status: 500,
      }
    );
  }

  try {
    const contentType =
      request.headers.get("content-type") || "";

    let body: Record<string, unknown>;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    } else {
      body = await request.json();
    }

    /* =====================================================
       READ FIELDS
    ===================================================== */

    const cleanName =
      String(body.full_name ?? "").trim();

    const cleanEmail =
      String(body.email ?? "")
        .trim()
        .toLowerCase();

    const cleanPassword =
      String(body.password ?? "");

    const cleanSection =
      String(body.section ?? "")
        .trim()
        .toUpperCase();

    const numericBatch =
      Number(body.batch);

    const cleanStudentId =
      body.student_id === null ||
      body.student_id === undefined
        ? null
        : String(body.student_id).trim() || null;

    const cleanBloodGroup =
      body.blood_group === null ||
      body.blood_group === undefined
        ? null
        : String(body.blood_group).trim() || null;

    const cleanPhotoUrl =
      body.profile_photo_url === null ||
      body.profile_photo_url === undefined
        ? null
        : String(body.profile_photo_url).trim() || null;

    /*
     * Accept both names so the API is backwards compatible.
     */
    const cleanLinkedinUrl =
      body.linkedin_url !== undefined
        ? String(body.linkedin_url).trim() || null
        : body.linkedin !== undefined
        ? String(body.linkedin).trim() || null
        : null;

    const cleanInstagramUrl =
      body.instagram_url !== undefined
        ? String(body.instagram_url).trim() || null
        : body.instagram !== undefined
        ? String(body.instagram).trim() || null
        : null;

    const cleanFacebookUrl =
      body.facebook_url !== undefined
        ? String(body.facebook_url).trim() || null
        : body.facebook !== undefined
        ? String(body.facebook).trim() || null
        : null;

    const cleanGraduation =
      cleanGraduationDate(
        body.graduation_date
      );

    const crStatus =
      cleanCRStatus(body.cr_status);

    const profilePhoto =
      body.profile_photo;

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!cleanName) {
      return NextResponse.json(
        {
          error: "Full name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!cleanEmail) {
      return NextResponse.json(
        {
          error: "Email is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!cleanPassword) {
      return NextResponse.json(
        {
          error: "Password is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 6 characters.",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isInteger(numericBatch)) {
      return NextResponse.json(
        {
          error: "Invalid batch.",
        },
        {
          status: 400,
        }
      );
    }

    if (!["A", "B"].includes(cleanSection)) {
      return NextResponse.json(
        {
          error: "Section must be A or B.",
        },
        {
          status: 400,
        }
      );
    }

    if (!isCurrentRunningBatch(numericBatch)) {
      return NextResponse.json(
        {
          error: `Batch ${numericBatch} is not currently accepting student registrations.`,
        },
        {
          status: 400,
        }
      );
    }

    if (
      body.graduation_date &&
      !cleanGraduation
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid graduation month. Please select a valid graduation month and year.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       CREATE AUTH USER
    ===================================================== */

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPassword,
        email_confirm: true,
        user_metadata: {
          account_type: "student",
          full_name: cleanName,
          batch: numericBatch,
          section: cleanSection,
          cr_status: crStatus,
          graduation_date: cleanGraduation,
        },
      });

    if (
      authError ||
      !authData.user
    ) {
      console.error(
        "Student auth creation error:",
        authError
      );

      return NextResponse.json(
        {
          error:
            authError?.message ||
            "Unable to create the student account.",
        },
        {
          status: 400,
        }
      );
    }

    const userId =
      authData.user.id;

    /* =====================================================
       PROFILE PHOTO
    ===================================================== */

    let uploadedPhotoUrl =
      cleanPhotoUrl;

    if (
      profilePhoto instanceof File &&
      profilePhoto.size > 0
    ) {
      try {
        uploadedPhotoUrl =
          await uploadStudentProfilePhoto(
            supabaseAdmin,
            userId,
            profilePhoto
          );
      } catch (uploadError) {
        await supabaseAdmin.auth.admin.deleteUser(
          userId
        );

        return NextResponse.json(
          {
            error:
              uploadError instanceof Error
                ? uploadError.message
                : "Profile photo upload failed.",
          },
          {
            status: 400,
          }
        );
      }
    }

    /* =====================================================
       CREATE STUDENT PROFILE
    ===================================================== */

    const {
      error: profileError,
    } = await supabaseAdmin
      .from("student_profiles")
      .insert({
        id: userId,
        full_name: cleanName,
        email: cleanEmail,
        batch: numericBatch,
        section: cleanSection,
        student_id: cleanStudentId,
        blood_group: cleanBloodGroup,
        cr_status: crStatus,
        profile_photo_url:
          uploadedPhotoUrl,
        linkedin_url:
          cleanLinkedinUrl,
        instagram_url:
          cleanInstagramUrl,
        facebook_url:
          cleanFacebookUrl,
        graduation_date:
          cleanGraduation,
      });

    if (profileError) {
      console.error(
        "Student profile creation error:",
        profileError
      );

      await supabaseAdmin.auth.admin.deleteUser(
        userId
      );

      return NextResponse.json(
        {
          error:
            profileError.message ||
            "Unable to create the student profile.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       SUCCESS
    ===================================================== */

    return NextResponse.json(
      {
        success: true,
        message:
          "Student account created successfully.",
        user: {
          id: userId,
          full_name: cleanName,
          email: cleanEmail,
          student_id:
            cleanStudentId,
          batch: numericBatch,
          section: cleanSection,
          cr_status: crStatus,
          graduation_date:
            cleanGraduation,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Student registration error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while creating the student account.",
      },
      {
        status: 500,
      }
    );
  }
}
