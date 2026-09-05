import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { isCurrentRunningBatch } from "@/app/lib/students/current-batches";

export const runtime = "nodejs";

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

  // Supports: YYYY-MM
  const monthMatch = raw.match(/^(\d{4})-(\d{2})$/);

  // Also supports: YYYY-MM-DD
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

  // Store the graduation month as the first day of that month.
  return `${year}-${String(month).padStart(2, "0")}-01`;
}

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

async function ensureProfilePhotoBucket(supabaseAdmin: ReturnType<typeof getSupabaseAdmin>) {
  const bucketName = "profile-photos";
  const { data: bucket, error: getError } =
    await supabaseAdmin.storage.getBucket(bucketName);

  if (getError && !getError.message.toLowerCase().includes("not found")) {
    throw new Error(`Unable to access profile photo storage: ${getError.message}`);
  }

  if (!bucket) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(
      bucketName,
      { public: true, fileSizeLimit: "5MB", allowedMimeTypes: ["image/*"] }
    );
    if (createError && !createError.message.toLowerCase().includes("already exists")) {
      throw new Error(`Unable to create profile photo storage: ${createError.message}`);
    }
  } else if (!bucket.public) {
    const { error: updateError } = await supabaseAdmin.storage.updateBucket(
      bucketName,
      { public: true, fileSizeLimit: "5MB", allowedMimeTypes: ["image/*"] }
    );
    if (updateError) {
      throw new Error(`Profile photo bucket is private and could not be made public: ${updateError.message}`);
    }
  }

  return bucketName;
}

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

  const bucketName = await ensureProfilePhotoBucket(supabaseAdmin);
  const extension =
    file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") ||
    "jpg";
  const filePath = `students/${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabaseAdmin.storage
    .from(bucketName)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(`Profile photo upload failed: ${error.message}`);
  }

  const { data } = supabaseAdmin.storage
    .from(bucketName)
    .getPublicUrl(filePath);

  return data.publicUrl;
}

export async function POST(request: NextRequest) {
  let supabaseAdmin;

  try {
    supabaseAdmin = getSupabaseAdmin();
  } catch (error) {
    console.error("Supabase configuration error:", error);

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
    const contentType = request.headers.get("content-type") || "";
    let body: Record<string, unknown>;

    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      body = Object.fromEntries(form.entries());
    } else {
      body = await request.json();
    }

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
      profile_photo,
    } = body;

    const cleanName = String(full_name ?? "").trim();
    const cleanEmail = String(email ?? "").trim().toLowerCase();
    const cleanPassword = String(password ?? "");
    const cleanSection = String(section ?? "").trim().toUpperCase();

    const numericBatch = Number(batch);

    const cleanStudentId =
      student_id === null || student_id === undefined
        ? null
        : String(student_id).trim() || null;

    const cleanBloodGroup =
      blood_group === null || blood_group === undefined
        ? null
        : String(blood_group).trim() || null;

    const cleanPhotoUrl =
      profile_photo_url === null || profile_photo_url === undefined
        ? null
        : String(profile_photo_url).trim() || null;

    const cleanLinkedinUrl =
      linkedin_url === null || linkedin_url === undefined
        ? null
        : String(linkedin_url).trim() || null;

    const cleanInstagramUrl =
      instagram_url === null || instagram_url === undefined
        ? null
        : String(instagram_url).trim() || null;

    const cleanFacebookUrl =
      facebook_url === null || facebook_url === undefined
        ? null
        : String(facebook_url).trim() || null;

    const cleanGraduation = cleanGraduationDate(graduation_date);

    // ------------------------------------------------------------
    // Basic validation
    // ------------------------------------------------------------

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
          error: "Password must be at least 6 characters.",
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

    // Only currently running batches can register as students.
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

    // If a graduation date was supplied, make sure it is valid.
    if (graduation_date && !cleanGraduation) {
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

    // ------------------------------------------------------------
    // Create Supabase Auth account
    // ------------------------------------------------------------

    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password: cleanPassword,
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          batch: numericBatch,
          section: cleanSection,
          graduation_date: cleanGraduation,
        },
      });

    if (authError || !authData.user) {
      console.error("Student auth creation error:", authError);

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

    const userId = authData.user.id;

    // Upload through the server with the Supabase service role.
    // This avoids exposing storage write permissions to anonymous users
    // and fixes the "row violates row-level security policy" error.
    let uploadedPhotoUrl: string | null = cleanPhotoUrl;

    if (profile_photo instanceof File && profile_photo.size > 0) {
      try {
        uploadedPhotoUrl = await uploadStudentProfilePhoto(
          supabaseAdmin,
          userId,
          profile_photo
        );
      } catch (uploadError) {
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return NextResponse.json(
          {
            error:
              uploadError instanceof Error
                ? uploadError.message
                : "Profile photo upload failed.",
          },
          { status: 400 }
        );
      }
    }

    // ------------------------------------------------------------
    // Create student profile
    // ------------------------------------------------------------

    const { error: profileError } = await supabaseAdmin
      .from("student_profiles")
      .insert({
        id: userId,
        full_name: cleanName,
        email: cleanEmail,
        batch: numericBatch,
        section: cleanSection,
        student_id: cleanStudentId,
        blood_group: cleanBloodGroup,
        profile_photo_url: uploadedPhotoUrl,
        linkedin_url: cleanLinkedinUrl,
        instagram_url: cleanInstagramUrl,
        facebook_url: cleanFacebookUrl,

        // New automatic student → alumni field.
        // NULL means no graduation date has been provided.
        graduation_date: cleanGraduation,
      });

    if (profileError) {
      console.error(
        "Student profile creation error:",
        profileError
      );

      // Remove the Auth account if the profile could not be created.
      await supabaseAdmin.auth.admin.deleteUser(userId);

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

    // ------------------------------------------------------------
    // Success
    // ------------------------------------------------------------

    return NextResponse.json(
      {
        success: true,
        message: "Student account created successfully.",
        user: {
          id: userId,
          full_name: cleanName,
          email: cleanEmail,
          batch: numericBatch,
          section: cleanSection,
          graduation_date: cleanGraduation,
        },
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error("Student registration error:", error);

    return NextResponse.json(
      {
        error: "Something went wrong while creating the student account.",
      },
      {
        status: 500,
      }
    );
  }
}
