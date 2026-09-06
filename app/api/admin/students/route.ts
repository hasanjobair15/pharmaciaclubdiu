import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const ADMIN_EMAIL = "diupc@diu.edu.bd";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}

if (!serviceRoleKey) {
  throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
}

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

type CRStatus = "cr" | "co_cr" | "no";

function cleanString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function cleanNullableString(
  value: unknown
): string | null {
  const cleaned = cleanString(value);
  return cleaned || null;
}

function isValidCRStatus(
  value: string
): value is CRStatus {
  return value === "cr" ||
    value === "co_cr" ||
    value === "no";
}

function cleanGraduationDate(
  value: unknown
): string | null {
  const cleaned = cleanString(value);

  if (!cleaned) {
    return null;
  }

  // YYYY-MM
  if (/^\d{4}-\d{2}$/.test(cleaned)) {
    return `${cleaned}-01`;
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
    return cleaned;
  }

  return null;
}

async function getAdminUser(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization");

  if (!authorization) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error:
            "Unauthorized. Please log in as admin.",
        },
        { status: 401 }
      ),
    };
  }

  const token = authorization.replace(
    /^Bearer\s+/i,
    ""
  ).trim();

  if (!token) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error:
            "Unauthorized. Missing access token.",
        },
        { status: 401 }
      ),
    };
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error:
            "Unauthorized. Invalid or expired session.",
        },
        { status: 401 }
      ),
    };
  }

  if (
    user.email?.trim().toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
  ) {
    return {
      user: null,
      response: NextResponse.json(
        {
          error:
            "Forbidden. Admin access required.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

/**
 * GET
 * Returns all student profiles.
 */
export async function GET(
  request: NextRequest
) {
  const { user, response } =
    await getAdminUser(request);

  if (response) {
    return response;
  }

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("student_profiles")
    .select(
      `
      id,
      full_name,
      student_id,
      email,
      batch,
      section,
      blood_group,
      cr_status,
      graduation_date,
      profile_photo_url,
      linkedin_url,
      instagram_url,
      facebook_url,
      created_at,
      updated_at
      `
    )
    .order("batch", {
      ascending: true,
    })
    .order("section", {
      ascending: true,
    })
    .order("full_name", {
      ascending: true,
    });

  if (error) {
    console.error(
      "Admin student list error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Unable to load student profiles.",
        details: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    students: data ?? [],
  });
}

/**
 * PUT
 * Admin can update any student's profile.
 *
 * Supports:
 * - JSON
 * - multipart/form-data
 *
 * Multipart also supports profile photo upload.
 */
export async function PUT(
  request: NextRequest
) {
  const { user, response } =
    await getAdminUser(request);

  if (response) {
    return response;
  }

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized." },
      { status: 401 }
    );
  }

  try {
    const contentType =
      request.headers.get("content-type") || "";

    let id = "";
    let fullName = "";
    let studentId = "";
    let email = "";
    let batch = "";
    let section = "";
    let bloodGroup = "";
    let crStatus = "no";
    let graduationDateRaw = "";
    let profilePhotoUrl = "";
    let linkedinUrl = "";
    let instagramUrl = "";
    let facebookUrl = "";
    let profilePhoto: File | null = null;

    if (
      contentType.includes(
        "multipart/form-data"
      )
    ) {
      const formData =
        await request.formData();

      id = cleanString(formData.get("id"));
      fullName = cleanString(
        formData.get("full_name")
      );
      studentId = cleanString(
        formData.get("student_id")
      );
      email = cleanString(
        formData.get("email")
      ).toLowerCase();
      batch = cleanString(
        formData.get("batch")
      );
      section = cleanString(
        formData.get("section")
      );
      bloodGroup = cleanString(
        formData.get("blood_group")
      );
      crStatus =
        cleanString(
          formData.get("cr_status")
        ) || "no";
      graduationDateRaw = cleanString(
        formData.get("graduation_date")
      );
      profilePhotoUrl = cleanString(
        formData.get("profile_photo_url")
      );
      linkedinUrl = cleanString(
        formData.get("linkedin_url")
      );
      instagramUrl = cleanString(
        formData.get("instagram_url")
      );
      facebookUrl = cleanString(
        formData.get("facebook_url")
      );

      const uploadedPhoto =
        formData.get("profile_photo");

      if (
        uploadedPhoto instanceof File &&
        uploadedPhoto.size > 0
      ) {
        profilePhoto = uploadedPhoto;
      }
    } else {
      const body = await request.json();

      id = cleanString(body.id);
      fullName = cleanString(
        body.full_name
      );
      studentId = cleanString(
        body.student_id
      );
      email = cleanString(
        body.email
      ).toLowerCase();
      batch = cleanString(body.batch);
      section = cleanString(body.section);
      bloodGroup = cleanString(
        body.blood_group
      );
      crStatus =
        cleanString(body.cr_status) || "no";
      graduationDateRaw = cleanString(
        body.graduation_date
      );
      profilePhotoUrl = cleanString(
        body.profile_photo_url
      );
      linkedinUrl = cleanString(
        body.linkedin_url
      );
      instagramUrl = cleanString(
        body.instagram_url
      );
      facebookUrl = cleanString(
        body.facebook_url
      );
    }

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Student profile ID is required.",
        },
        { status: 400 }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        {
          error:
            "Full name is required.",
        },
        { status: 400 }
      );
    }

    if (!studentId) {
      return NextResponse.json(
        {
          error:
            "Student ID is required.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Email address is required.",
        },
        { status: 400 }
      );
    }

    if (!batch) {
      return NextResponse.json(
        {
          error:
            "Batch is required.",
        },
        { status: 400 }
      );
    }

    const batchNumber = Number(batch);

    if (
      !Number.isInteger(batchNumber) ||
      batchNumber < 1
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid batch number.",
        },
        { status: 400 }
      );
    }

    if (
      section !== "A" &&
      section !== "B"
    ) {
      return NextResponse.json(
        {
          error:
            "Section must be A or B.",
        },
        { status: 400 }
      );
    }

    if (!isValidCRStatus(crStatus)) {
      return NextResponse.json(
        {
          error:
            "CR status must be CR, Co-CR, or No.",
        },
        { status: 400 }
      );
    }

    const graduationDate =
      cleanGraduationDate(
        graduationDateRaw
      );

    if (
      graduationDateRaw &&
      !graduationDate
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid graduation date. Use YYYY-MM or YYYY-MM-DD.",
        },
        { status: 400 }
      );
    }

    // Check that the student exists.
    const {
      data: existingStudent,
      error: existingStudentError,
    } = await supabaseAdmin
      .from("student_profiles")
      .select(
        `
        id,
        full_name,
        student_id,
        email,
        batch,
        section,
        blood_group,
        cr_status,
        graduation_date,
        profile_photo_url,
        linkedin_url,
        instagram_url,
        facebook_url
        `
      )
      .eq("id", id)
      .maybeSingle();

    if (existingStudentError) {
      console.error(
        "Existing student lookup error:",
        existingStudentError
      );

      return NextResponse.json(
        {
          error:
            "Unable to find student profile.",
          details:
            existingStudentError.message,
        },
        { status: 500 }
      );
    }

    if (!existingStudent) {
      return NextResponse.json(
        {
          error:
            "Student profile not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Check duplicate student ID.
     */
    const {
      data: duplicateStudentId,
      error: duplicateStudentIdError,
    } = await supabaseAdmin
      .from("student_profiles")
      .select("id")
      .eq("student_id", studentId)
      .neq("id", id)
      .maybeSingle();

    if (duplicateStudentIdError) {
      console.error(
        "Student ID duplicate check error:",
        duplicateStudentIdError
      );

      return NextResponse.json(
        {
          error:
            "Unable to validate student ID.",
        },
        { status: 500 }
      );
    }

    if (duplicateStudentId) {
      return NextResponse.json(
        {
          error:
            "Another student already uses this student ID.",
        },
        { status: 409 }
      );
    }

    /*
     * Check duplicate email.
     */
    const {
      data: duplicateEmail,
      error: duplicateEmailError,
    } =
      await supabaseAdmin
        .from("student_profiles")
        .select("id")
        .ilike("email", email)
        .neq("id", id)
        .maybeSingle();

    if (duplicateEmailError) {
      console.error(
        "Email duplicate check error:",
        duplicateEmailError
      );

      return NextResponse.json(
        {
          error:
            "Unable to validate email address.",
        },
        { status: 500 }
      );
    }

    if (duplicateEmail) {
      return NextResponse.json(
        {
          error:
            "Another student already uses this email address.",
        },
        { status: 409 }
      );
    }

    /*
     * Profile photo upload.
     */
    if (profilePhoto) {
      if (
        !profilePhoto.type.startsWith(
          "image/"
        )
      ) {
        return NextResponse.json(
          {
            error:
              "Profile photo must be an image.",
          },
          { status: 400 }
        );
      }

      const maxSize =
        5 * 1024 * 1024;

      if (profilePhoto.size > maxSize) {
        return NextResponse.json(
          {
            error:
              "Profile photo must be smaller than 5 MB.",
          },
          { status: 400 }
        );
      }

      const bucketName =
        "profile-photos";

      const { error: bucketError } =
        await supabaseAdmin.storage
          .getBucket(bucketName);

      if (bucketError) {
        const { error: createBucketError } =
          await supabaseAdmin.storage.createBucket(
            bucketName,
            {
              public: true,
            }
          );

        if (
          createBucketError &&
          !createBucketError.message
            .toLowerCase()
            .includes("already exists")
        ) {
          console.error(
            "Bucket creation error:",
            createBucketError
          );

          return NextResponse.json(
            {
              error:
                "Unable to prepare profile photo storage.",
            },
            { status: 500 }
          );
        }
      }

      const extension =
        profilePhoto.name
          .split(".")
          .pop()
          ?.toLowerCase() || "jpg";

      const safeExtension =
        /^[a-z0-9]+$/.test(extension)
          ? extension
          : "jpg";

      const filePath =
        `students/${id}/${crypto.randomUUID()}.${safeExtension}`;

      const arrayBuffer =
        await profilePhoto.arrayBuffer();

      const { error: uploadError } =
        await supabaseAdmin.storage
          .from(bucketName)
          .upload(
            filePath,
            arrayBuffer,
            {
              contentType:
                profilePhoto.type ||
                "image/jpeg",
              upsert: false,
            }
          );

      if (uploadError) {
        console.error(
          "Admin profile photo upload error:",
          uploadError
        );

        return NextResponse.json(
          {
            error:
              "Profile photo upload failed.",
            details:
              uploadError.message,
          },
          { status: 500 }
        );
      }

      const {
        data: publicUrlData,
      } =
        supabaseAdmin.storage
          .from(bucketName)
          .getPublicUrl(filePath);

      profilePhotoUrl =
        publicUrlData.publicUrl;
    }

    /*
     * Keep Supabase Auth account synchronized
     * with the profile email/name.
     */
    const {
      data: authUserData,
      error: authLookupError,
    } =
      await supabaseAdmin.auth.admin.getUserById(
        id
      );

    if (
      authLookupError &&
      authLookupError.message
    ) {
      console.warn(
        "Could not find auth user for student:",
        authLookupError.message
      );
    }

    if (authUserData?.user) {
      const oldEmail =
        authUserData.user.email
          ?.trim()
          .toLowerCase();

      const userMetadata = {
        ...(authUserData.user.user_metadata ||
          {}),
        full_name: fullName,
        batch: batchNumber,
        section,
        cr_status: crStatus,
        graduation_date:
          graduationDate,
        account_type: "student",
      };

      const authUpdatePayload: {
        email?: string;
        email_confirm?: boolean;
        user_metadata?: Record<
          string,
          unknown
        >;
      } = {
        user_metadata: userMetadata,
      };

      if (
        oldEmail !== email
      ) {
        authUpdatePayload.email =
          email;
        authUpdatePayload.email_confirm =
          true;
      }

      const {
        error: authUpdateError,
      } =
        await supabaseAdmin.auth.admin.updateUserById(
          id,
          authUpdatePayload
        );

      if (authUpdateError) {
        console.error(
          "Auth user update error:",
          authUpdateError
        );

        return NextResponse.json(
          {
            error:
              "Unable to update the student's login account.",
            details:
              authUpdateError.message,
          },
          { status: 400 }
        );
      }
    }

    const updateData = {
      full_name: fullName,
      student_id: studentId,
      email,
      batch: batchNumber,
      section,
      blood_group:
        bloodGroup || null,
      cr_status: crStatus,
      graduation_date:
        graduationDate,
      profile_photo_url:
        profilePhotoUrl ||
        existingStudent.profile_photo_url ||
        null,
      linkedin_url:
        linkedinUrl || null,
      instagram_url:
        instagramUrl || null,
      facebook_url:
        facebookUrl || null,
      updated_at:
        new Date().toISOString(),
    };

    const {
      data: updatedStudent,
      error: updateError,
    } =
      await supabaseAdmin
        .from("student_profiles")
        .update(updateData)
        .eq("id", id)
        .select(
          `
          id,
          full_name,
          student_id,
          email,
          batch,
          section,
          blood_group,
          cr_status,
          graduation_date,
          profile_photo_url,
          linkedin_url,
          instagram_url,
          facebook_url,
          created_at,
          updated_at
          `
        )
        .single();

    if (updateError) {
      console.error(
        "Admin student update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Unable to update student profile.",
          details:
            updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message:
        "Student profile updated successfully.",
      student: updatedStudent,
    });
  } catch (error) {
    console.error(
      "Admin student API error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected server error.",
      },
      { status: 500 }
    );
  }
}

/**
 * PATCH
 * Supports the same update logic as PUT.
 */
export async function PATCH(
  request: NextRequest
) {
  return PUT(request);
}
