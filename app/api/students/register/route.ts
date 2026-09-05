import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isCurrentRunningBatch } from "@/app/lib/students/current-batches";

export const runtime = "nodejs";

const PHOTO_BUCKET = "committee-photos";

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

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase environment variables are missing."
    );
  }

  return createClient(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Student profile photo path.
 */
function studentPhotoPath(userId: string) {
  return `students/${userId}/profile.webp`;
}

/**
 * Validate normal HTTP/HTTPS image URL.
 */
function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);

    return (
      url.protocol === "http:" ||
      url.protocol === "https:"
    );
  } catch {
    return false;
  }
}

/**
 * Upload Base64 profile photo to Supabase Storage.
 *
 * This happens on the SERVER using the service-role key,
 * so browser Storage RLS policies do not block the upload.
 */
async function uploadProfilePhoto(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  dataUrl: string
) {
  const match =
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(
      dataUrl
    );

  if (!match) {
    throw new Error(
      "Invalid profile photo data."
    );
  }

  const mimeType = match[1];
  const base64Data = match[2];

  if (!mimeType.startsWith("image/")) {
    throw new Error(
      "Only image files are supported."
    );
  }

  if (!base64Data) {
    throw new Error(
      "Profile photo data is empty."
    );
  }

  let bytes: Buffer;

  try {
    bytes = Buffer.from(
      base64Data,
      "base64"
    );
  } catch {
    throw new Error(
      "Unable to process the profile photo."
    );
  }

  if (bytes.length === 0) {
    throw new Error(
      "The profile photo is empty."
    );
  }

  /*
   * Maximum 5 MB after client-side compression.
   */
  if (bytes.length > 5 * 1024 * 1024) {
    throw new Error(
      "Profile photo must be smaller than 5 MB."
    );
  }

  const path = studentPhotoPath(userId);

  const { error: uploadError } =
    await supabaseAdmin.storage
      .from(PHOTO_BUCKET)
      .upload(path, bytes, {
        contentType: mimeType,
        upsert: true,
        cacheControl: "3600",
      });

  if (uploadError) {
    console.error(
      "Student profile photo upload error:",
      uploadError
    );

    throw new Error(
      `Profile photo upload failed: ${uploadError.message}`
    );
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage
    .from(PHOTO_BUCKET)
    .getPublicUrl(path);

  if (!publicUrl) {
    throw new Error(
      "Profile photo URL could not be generated."
    );
  }

  return `${publicUrl}?v=${Date.now()}`;
}

/**
 * Remove uploaded student photo during rollback.
 */
async function removeProfilePhoto(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  userId: string
) {
  const path = studentPhotoPath(userId);

  const { error } =
    await supabaseAdmin.storage
      .from(PHOTO_BUCKET)
      .remove([path]);

  if (error) {
    console.error(
      "Profile photo rollback warning:",
      error
    );
  }
}

/**
 * Delete Auth user during rollback.
 */
async function rollbackUser(
  supabaseAdmin: ReturnType<typeof getSupabaseAdmin>,
  userId: string,
  photoUploaded: boolean
) {
  if (photoUploaded) {
    await removeProfilePhoto(
      supabaseAdmin,
      userId
    );
  }

  try {
    await supabaseAdmin.auth.admin.deleteUser(
      userId
    );
  } catch (error) {
    console.error(
      "Auth user rollback error:",
      error
    );
  }
}

export async function POST(
  request: NextRequest
) {
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
        error:
          "Server configuration error. Please check Supabase environment variables.",
      },
      {
        status: 500,
      }
    );
  }

  let createdUserId: string | null = null;
  let photoUploaded = false;

  try {
    const body = await request.json();

    const {
      full_name,
      email,
      password,
      batch,
      section,
      student_id,
      blood_group,
      profile_photo_url,
      linkedin_url,
      instagram_url,
      facebook_url,
      graduation_date,
    } = body;

    const cleanName =
      String(full_name ?? "").trim();

    const cleanEmail =
      String(email ?? "")
        .trim()
        .toLowerCase();

    const cleanPassword =
      String(password ?? "");

    const cleanSection =
      String(section ?? "")
        .trim()
        .toUpperCase();

    const numericBatch = Number(batch);

    const cleanStudentId =
      student_id === null ||
      student_id === undefined
        ? null
        : String(student_id).trim() || null;

    const cleanBloodGroup =
      blood_group === null ||
      blood_group === undefined
        ? null
        : String(blood_group).trim() || null;

    const cleanPhotoUrl =
      profile_photo_url === null ||
      profile_photo_url === undefined
        ? null
        : String(profile_photo_url).trim() || null;

    const cleanLinkedinUrl =
      linkedin_url === null ||
      linkedin_url === undefined
        ? null
        : String(linkedin_url).trim() || null;

    const cleanInstagramUrl =
      instagram_url === null ||
      instagram_url === undefined
        ? null
        : String(instagram_url).trim() || null;

    const cleanFacebookUrl =
      facebook_url === null ||
      facebook_url === undefined
        ? null
        : String(facebook_url).trim() || null;

    const cleanGraduation =
      cleanGraduationDate(
        graduation_date
      );

    // ------------------------------------------------------------
    // Basic validation
    // ------------------------------------------------------------

    if (!cleanName) {
      return NextResponse.json(
        {
          error:
            "Full name is required.",
        },
        { status: 400 }
      );
    }

    if (!cleanEmail) {
      return NextResponse.json(
        {
          error:
            "Email is required.",
        },
        { status: 400 }
      );
    }

    if (!cleanPassword) {
      return NextResponse.json(
        {
          error:
            "Password is required.",
        },
        { status: 400 }
      );
    }

    if (cleanPassword.length < 6) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(numericBatch)) {
      return NextResponse.json(
        {
          error:
            "Invalid batch.",
        },
        { status: 400 }
      );
    }

    if (
      !["A", "B"].includes(
        cleanSection
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Section must be A or B.",
        },
        { status: 400 }
      );
    }

    if (
      !isCurrentRunningBatch(
        numericBatch
      )
    ) {
      return NextResponse.json(
        {
          error: `Batch ${numericBatch} is not currently accepting student registrations.`,
        },
        { status: 400 }
      );
    }

    if (
      graduation_date &&
      !cleanGraduation
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid graduation month. Please select a valid graduation month and year.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // Validate profile photo input
    // ------------------------------------------------------------

    if (cleanPhotoUrl) {
      const isBase64Image =
        cleanPhotoUrl.startsWith(
          "data:image/"
        );

      const isHttpUrl =
        cleanPhotoUrl.startsWith(
          "http://"
        ) ||
        cleanPhotoUrl.startsWith(
          "https://"
        );

      if (
        !isBase64Image &&
        !isHttpUrl
      ) {
        return NextResponse.json(
          {
            error:
              "Invalid profile photo. Please upload an image or enter a valid image URL.",
          },
          { status: 400 }
        );
      }

      if (
        isHttpUrl &&
        !isValidHttpUrl(cleanPhotoUrl)
      ) {
        return NextResponse.json(
          {
            error:
              "Please enter a valid profile photo URL.",
          },
          { status: 400 }
        );
      }
    }

    // ------------------------------------------------------------
    // Create Supabase Auth account
    // ------------------------------------------------------------

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser(
        {
          email: cleanEmail,
          password: cleanPassword,
          email_confirm: true,
          user_metadata: {
            full_name: cleanName,
            batch: numericBatch,
            section: cleanSection,
            graduation_date:
              cleanGraduation,
          },
        }
      );

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
        { status: 400 }
      );
    }

    createdUserId =
      authData.user.id;

    // ------------------------------------------------------------
    // Process profile photo
    // ------------------------------------------------------------

    let finalProfilePhotoUrl:
      | string
      | null = null;

    if (cleanPhotoUrl) {
      /*
       * Uploaded image:
       * data:image/...;base64,...
       *
       * Upload it SERVER-SIDE.
       */
      if (
        cleanPhotoUrl.startsWith(
          "data:image/"
        )
      ) {
        finalProfilePhotoUrl =
          await uploadProfilePhoto(
            supabaseAdmin,
            createdUserId,
            cleanPhotoUrl
          );

        photoUploaded = true;
      }

      /*
       * Normal image URL:
       * Save it directly.
       */
      else {
        finalProfilePhotoUrl =
          cleanPhotoUrl;
      }
    }

    // ------------------------------------------------------------
    // Create student profile
    // ------------------------------------------------------------

    const {
      error: profileError,
    } = await supabaseAdmin
      .from("student_profiles")
      .insert({
        id: createdUserId,
        user_id: createdUserId,

        full_name: cleanName,
        email: cleanEmail,

        batch: numericBatch,
        section: cleanSection,

        student_id:
          cleanStudentId,

        blood_group:
          cleanBloodGroup,

        profile_photo_url:
          finalProfilePhotoUrl,

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

      await rollbackUser(
        supabaseAdmin,
        createdUserId,
        photoUploaded
      );

      createdUserId = null;

      return NextResponse.json(
        {
          error:
            profileError.message ||
            "Unable to create the student profile.",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------
    // Success
    // ------------------------------------------------------------

    return NextResponse.json(
      {
        success: true,

        message:
          "Student account created successfully.",

        user: {
          id: createdUserId,
          full_name: cleanName,
          email: cleanEmail,
          batch: numericBatch,
          section: cleanSection,
          graduation_date:
            cleanGraduation,
          profile_photo_url:
            finalProfilePhotoUrl,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Student registration error:",
      error
    );

    /*
     * If anything fails after Auth user creation,
     * remove the user and uploaded photo.
     */
    if (createdUserId) {
      await rollbackUser(
        supabaseAdmin,
        createdUserId,
        photoUploaded
      );
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while creating the student account.",
      },
      { status: 500 }
    );
  }
}
