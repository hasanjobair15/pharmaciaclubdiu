import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey
);

const PHOTO_BUCKET = "committee-photos";

type ProfilePhotoResult = {
  url: string | null;
  uploadedPath: string | null;
};

function studentPhotoPath(userId: string) {
  return `students/${userId}/profile.webp`;
}

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
 * Process profile photo.
 *
 * Supports:
 * 1. Uploaded image converted to Base64 data URL
 * 2. Normal HTTP/HTTPS image URL
 */
async function processProfilePhoto(
  userId: string,
  value: unknown
): Promise<ProfilePhotoResult> {
  if (typeof value !== "string") {
    return {
      url: null,
      uploadedPath: null,
    };
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return {
      url: null,
      uploadedPath: null,
    };
  }

  /*
   * =====================================================
   * BASE64 IMAGE UPLOAD
   * =====================================================
   */
  if (trimmed.startsWith("data:image/")) {
    const match =
      /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.*)$/.exec(
        trimmed
      );

    if (!match) {
      throw new Error(
        "Invalid profile photo data."
      );
    }

    const mimeType = match[1];
    const base64Data = match[2];

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
        "Unable to process profile photo."
      );
    }

    if (!bytes.length) {
      throw new Error(
        "Profile photo is empty."
      );
    }

    /*
     * Maximum 5 MB after compression.
     */
    if (bytes.length > 5 * 1024 * 1024) {
      throw new Error(
        "Profile photo is too large. Please use an image smaller than 5 MB."
      );
    }

    const path = studentPhotoPath(userId);

    /*
     * Server-side upload using SERVICE ROLE.
     * This bypasses browser Storage RLS.
     */
    const { error: uploadError } =
      await supabaseAdmin.storage
        .from(PHOTO_BUCKET)
        .upload(path, bytes, {
          contentType:
            mimeType === "image/webp"
              ? "image/webp"
              : mimeType,
          upsert: true,
          cacheControl: "3600",
        });

    if (uploadError) {
      console.error(
        "Profile photo storage upload error:",
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
        "Profile photo uploaded but public URL could not be generated."
      );
    }

    return {
      url: `${publicUrl}?v=${Date.now()}`,
      uploadedPath: path,
    };
  }

  /*
   * =====================================================
   * IMAGE URL
   * =====================================================
   */
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://")
  ) {
    if (!isValidHttpUrl(trimmed)) {
      throw new Error(
        "Please enter a valid image URL."
      );
    }

    return {
      url: trimmed,
      uploadedPath: null,
    };
  }

  throw new Error(
    "Invalid profile photo. Please upload an image or enter a valid image URL."
  );
}

/**
 * Delete student's stored profile photo.
 */
async function deleteStudentPhoto(
  userId: string
) {
  const path = studentPhotoPath(userId);

  const { error } =
    await supabaseAdmin.storage
      .from(PHOTO_BUCKET)
      .remove([path]);

  if (error) {
    console.error(
      "Unable to delete student profile photo:",
      error
    );
  }
}

/**
 * Authenticate request.
 */
async function getAuthenticatedUser(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization");

  if (!authorization) {
    return {
      user: null,
      error:
        "Authorization header is missing.",
    };
  }

  const token = authorization
    .replace(/^Bearer\s+/i, "")
    .trim();

  if (!token) {
    return {
      user: null,
      error: "Access token is missing.",
    };
  }

  const {
    data: { user },
    error,
  } =
    await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return {
      user: null,
      error:
        "Invalid or expired authentication token.",
    };
  }

  return {
    user,
    error: null,
  };
}

/**
 * Student profile fields.
 */
const studentProfileSelect = `
  id,
  user_id,
  student_id,
  full_name,
  email,
  phone,
  date_of_birth,
  gender,
  blood_group,
  address,
  city,
  country,
  department,
  program,
  batch,
  section,
  semester,
  graduation_date,
  profile_photo_url,
  linkedin_url,
  facebook_url,
  instagram_url,
  emergency_contact_name,
  emergency_contact_phone,
  emergency_contact_relation,
  created_at,
  updated_at
`;

/**
 * Get today's date in Bangladesh.
 */
function getDhakaToday() {
  const formatter =
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

  return formatter.format(new Date());
}

/**
 * =====================================================
 * GET STUDENT PROFILE
 * =====================================================
 */
export async function GET(
  request: NextRequest
) {
  try {
    const {
      user,
      error: authError,
    } =
      await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error:
            authError || "Unauthorized.",
        },
        { status: 401 }
      );
    }

    /*
     * Check alumni first.
     */
    const {
      data: alumniProfile,
      error: alumniError,
    } =
      await supabaseAdmin
        .from("alumni_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (alumniError) {
      console.error(
        "Alumni profile lookup error:",
        alumniError
      );
    }

    if (alumniProfile) {
      return NextResponse.json({
        profile: alumniProfile,
        profileType: "alumni",
      });
    }

    /*
     * Check student profile.
     */
    const {
      data: studentProfile,
      error: studentError,
    } =
      await supabaseAdmin
        .from("student_profiles")
        .select(studentProfileSelect)
        .eq("user_id", user.id)
        .maybeSingle();

    if (studentError) {
      console.error(
        "Student profile lookup error:",
        studentError
      );

      return NextResponse.json(
        {
          error:
            "Failed to load student profile.",
          details:
            studentError.message,
        },
        { status: 500 }
      );
    }

    if (!studentProfile) {
      return NextResponse.json(
        {
          error:
            "Student profile not found.",
        },
        { status: 404 }
      );
    }

    /*
     * Automatically convert student to alumni
     * after graduation date.
     */
    let finalProfile = studentProfile;
    let finalProfileType = "student";

    if (
      studentProfile.graduation_date &&
      studentProfile.graduation_date <=
        getDhakaToday()
    ) {
      try {
        const {
          data: existingAlumni,
        } =
          await supabaseAdmin
            .from("alumni_profiles")
            .select("id")
            .eq("user_id", user.id)
            .maybeSingle();

        if (!existingAlumni) {
          const {
            data: newAlumni,
            error:
              alumniInsertError,
          } =
            await supabaseAdmin
              .from("alumni_profiles")
              .insert({
                user_id: user.id,
                student_id:
                  studentProfile.student_id,
                full_name:
                  studentProfile.full_name,
                email:
                  studentProfile.email,
                phone:
                  studentProfile.phone,
                date_of_birth:
                  studentProfile.date_of_birth,
                gender:
                  studentProfile.gender,
                blood_group:
                  studentProfile.blood_group,
                address:
                  studentProfile.address,
                city:
                  studentProfile.city,
                country:
                  studentProfile.country,
                department:
                  studentProfile.department,
                program:
                  studentProfile.program,
                batch:
                  studentProfile.batch,
                section:
                  studentProfile.section,
                graduation_date:
                  studentProfile.graduation_date,
                profile_photo_url:
                  studentProfile.profile_photo_url,
                linkedin_url:
                  studentProfile.linkedin_url,
                facebook_url:
                  studentProfile.facebook_url,
                instagram_url:
                  studentProfile.instagram_url,
              })
              .select("*")
              .single();

          if (
            !alumniInsertError &&
            newAlumni
          ) {
            await supabaseAdmin
              .from("student_profiles")
              .delete()
              .eq("user_id", user.id);

            finalProfile =
              newAlumni;
            finalProfileType =
              "alumni";
          }
        }
      } catch (conversionError) {
        console.error(
          "Student to alumni conversion error:",
          conversionError
        );
      }
    }

    return NextResponse.json({
      profile: finalProfile,
      profileType: finalProfileType,
    });
  } catch (error) {
    console.error(
      "GET /api/students/profile error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      { status: 500 }
    );
  }
}

/**
 * =====================================================
 * UPDATE PROFILE
 * =====================================================
 */
export async function PUT(
  request: NextRequest
) {
  try {
    const {
      user,
      error: authError,
    } =
      await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error:
            authError || "Unauthorized.",
        },
        { status: 401 }
      );
    }

    let body: Record<string, any>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error:
            "Invalid JSON request body.",
        },
        { status: 400 }
      );
    }

    /*
     * =====================================================
     * CHECK ALUMNI
     * =====================================================
     */
    const {
      data: existingAlumni,
      error: alumniLookupError,
    } =
      await supabaseAdmin
        .from("alumni_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (alumniLookupError) {
      console.error(
        "Alumni lookup error:",
        alumniLookupError
      );
    }

    /*
     * =====================================================
     * ALUMNI UPDATE
     * =====================================================
     */
    if (existingAlumni) {
      let profilePhotoUrl =
        existingAlumni.profile_photo_url;

      let uploadedPath: string | null =
        null;

      /*
       * Process new photo only when supplied.
       */
      if (
        Object.prototype.hasOwnProperty.call(
          body,
          "profile_photo_url"
        ) &&
        body.profile_photo_url
      ) {
        const photoResult =
          await processProfilePhoto(
            user.id,
            body.profile_photo_url
          );

        profilePhotoUrl =
          photoResult.url;

        uploadedPath =
          photoResult.uploadedPath;
      }

      const allowedFields = [
        "full_name",
        "phone",
        "date_of_birth",
        "gender",
        "blood_group",
        "address",
        "city",
        "country",
        "department",
        "program",
        "batch",
        "section",
        "graduation_date",
        "linkedin_url",
        "facebook_url",
        "instagram_url",
        "emergency_contact_name",
        "emergency_contact_phone",
        "emergency_contact_relation",
      ];

      const updateData: Record<
        string,
        any
      > = {};

      for (const field of allowedFields) {
        if (
          Object.prototype.hasOwnProperty.call(
            body,
            field
          )
        ) {
          updateData[field] =
            body[field];
        }
      }

      if (
        Object.prototype.hasOwnProperty.call(
          body,
          "profile_photo_url"
        )
      ) {
        updateData.profile_photo_url =
          profilePhotoUrl;
      }

      updateData.updated_at =
        new Date().toISOString();

      const {
        data: updatedAlumni,
        error: updateError,
      } =
        await supabaseAdmin
          .from("alumni_profiles")
          .update(updateData)
          .eq("user_id", user.id)
          .select("*")
          .single();

      if (updateError) {
        if (uploadedPath) {
          await supabaseAdmin.storage
            .from(PHOTO_BUCKET)
            .remove([uploadedPath]);
        }

        console.error(
          "Alumni profile update error:",
          updateError
        );

        return NextResponse.json(
          {
            error:
              "Failed to update profile.",
            details:
              updateError.message,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        profile: updatedAlumni,
        profileType: "alumni",
      });
    }

    /*
     * =====================================================
     * FIND STUDENT
     * =====================================================
     */
    const {
      data: studentProfile,
      error: studentLookupError,
    } =
      await supabaseAdmin
        .from("student_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

    if (studentLookupError) {
      console.error(
        "Student lookup error:",
        studentLookupError
      );

      return NextResponse.json(
        {
          error:
            "Failed to find student profile.",
          details:
            studentLookupError.message,
        },
        { status: 500 }
      );
    }

    if (!studentProfile) {
      return NextResponse.json(
        {
          error:
            "Student profile not found.",
        },
        { status: 404 }
      );
    }

    /*
     * =====================================================
     * PROCESS STUDENT PROFILE PHOTO
     * =====================================================
     */
    let profilePhotoUrl =
      studentProfile.profile_photo_url;

    let uploadedPath: string | null =
      null;

    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "profile_photo_url"
      ) &&
      body.profile_photo_url
    ) {
      const photoResult =
        await processProfilePhoto(
          user.id,
          body.profile_photo_url
        );

      profilePhotoUrl =
        photoResult.url;

      uploadedPath =
        photoResult.uploadedPath;
    }

    /*
     * =====================================================
     * STUDENT → ALUMNI CONVERSION
     * =====================================================
     */
    const graduationDate =
      body.graduation_date ??
      studentProfile.graduation_date;

    if (
      graduationDate &&
      graduationDate <= getDhakaToday()
    ) {
      try {
        const alumniData = {
          user_id: user.id,

          student_id:
            body.student_id ??
            studentProfile.student_id,

          full_name:
            body.full_name ??
            studentProfile.full_name,

          email:
            studentProfile.email,

          phone:
            body.phone ??
            studentProfile.phone,

          date_of_birth:
            body.date_of_birth ??
            studentProfile.date_of_birth,

          gender:
            body.gender ??
            studentProfile.gender,

          blood_group:
            body.blood_group ??
            studentProfile.blood_group,

          address:
            body.address ??
            studentProfile.address,

          city:
            body.city ??
            studentProfile.city,

          country:
            body.country ??
            studentProfile.country,

          department:
            body.department ??
            studentProfile.department,

          program:
            body.program ??
            studentProfile.program,

          batch:
            body.batch ??
            studentProfile.batch,

          section:
            body.section ??
            studentProfile.section,

          graduation_date:
            graduationDate,

          profile_photo_url:
            profilePhotoUrl,

          linkedin_url:
            body.linkedin_url ??
            studentProfile.linkedin_url,

          facebook_url:
            body.facebook_url ??
            studentProfile.facebook_url,

          instagram_url:
            body.instagram_url ??
            studentProfile.instagram_url,

          emergency_contact_name:
            body.emergency_contact_name ??
            studentProfile.emergency_contact_name,

          emergency_contact_phone:
            body.emergency_contact_phone ??
            studentProfile.emergency_contact_phone,

          emergency_contact_relation:
            body.emergency_contact_relation ??
            studentProfile.emergency_contact_relation,
        };

        const {
          data: newAlumni,
          error:
            alumniInsertError,
        } =
          await supabaseAdmin
            .from("alumni_profiles")
            .insert(alumniData)
            .select("*")
            .single();

        if (alumniInsertError) {
          if (uploadedPath) {
            await deleteStudentPhoto(
              user.id
            );
          }

          console.error(
            "Student to alumni conversion failed:",
            alumniInsertError
          );

          return NextResponse.json(
            {
              error:
                "Failed to convert student profile to alumni.",
              details:
                alumniInsertError.message,
            },
            { status: 500 }
          );
        }

        const {
          error: studentDeleteError,
        } =
          await supabaseAdmin
            .from("student_profiles")
            .delete()
            .eq("user_id", user.id);

        if (studentDeleteError) {
          console.error(
            "Could not delete old student profile:",
            studentDeleteError
          );
        }

        return NextResponse.json({
          success: true,
          profile: newAlumni,
          profileType: "alumni",
          converted: true,
        });
      } catch (conversionError) {
        if (uploadedPath) {
          await deleteStudentPhoto(
            user.id
          );
        }

        console.error(
          "Student to alumni conversion error:",
          conversionError
        );

        return NextResponse.json(
          {
            error:
              conversionError instanceof Error
                ? conversionError.message
                : "Student to alumni conversion failed.",
          },
          { status: 500 }
        );
      }
    }

    /*
     * =====================================================
     * NORMAL STUDENT UPDATE
     * =====================================================
     */
    const allowedFields = [
      "full_name",
      "phone",
      "date_of_birth",
      "gender",
      "blood_group",
      "address",
      "city",
      "country",
      "department",
      "program",
      "batch",
      "section",
      "semester",
      "graduation_date",
      "linkedin_url",
      "facebook_url",
      "instagram_url",
      "emergency_contact_name",
      "emergency_contact_phone",
      "emergency_contact_relation",
    ];

    const updateData: Record<
      string,
      any
    > = {};

    for (const field of allowedFields) {
      if (
        Object.prototype.hasOwnProperty.call(
          body,
          field
        )
      ) {
        updateData[field] =
          body[field];
      }
    }

    /*
     * Save profile photo URL.
     */
    if (
      Object.prototype.hasOwnProperty.call(
        body,
        "profile_photo_url"
      )
    ) {
      updateData.profile_photo_url =
        profilePhotoUrl;
    }

    updateData.updated_at =
      new Date().toISOString();

    const {
      data: updatedStudent,
      error: updateError,
    } =
      await supabaseAdmin
        .from("student_profiles")
        .update(updateData)
        .eq("user_id", user.id)
        .select(studentProfileSelect)
        .single();

    if (updateError) {
      /*
       * If Storage upload succeeded but
       * database update failed, clean up.
       */
      if (uploadedPath) {
        await deleteStudentPhoto(
          user.id
        );
      }

      console.error(
        "Student profile update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            "Failed to update student profile.",
          details:
            updateError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: updatedStudent,
      profileType: "student",
    });
  } catch (error) {
    console.error(
      "PUT /api/students/profile error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Internal server error.",
      },
      { status: 500 }
    );
  }
}
