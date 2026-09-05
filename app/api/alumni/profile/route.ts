import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Alumni profile API is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getBearerToken(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7).trim();

  return token || null;
}

async function getAuthenticatedUser(request: NextRequest) {
  const accessToken = getBearerToken(request);

  if (!accessToken) {
    return {
      user: null,
      error: "Login is required.",
    };
  }

  const supabaseAdmin = getAdminClient();

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return {
      user: null,
      error: "Your session has expired. Please log in again.",
    };
  }

  return {
    user,
    error: null,
  };
}

function toNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed || null;
}

function toRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

/*
 * Accept:
 *
 * 2026-09
 * 2026-09-01
 *
 * Store:
 *
 * 2026-09-01
 */
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
    throw new Error(
      "Invalid graduation month and year."
    );
  }

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    throw new Error(
      "Invalid graduation month and year."
    );
  }

  if (year < 1900 || year > 2200) {
    throw new Error(
      "Invalid graduation year."
    );
  }

  if (month < 1 || month > 12) {
    throw new Error(
      "Invalid graduation month."
    );
  }

  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/*
 * Current date in Asia/Dhaka.
 */
function getDhakaTodayString() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  return `${year}-${month}-${day}`;
}

function buildProfileFields(
  body: Record<string, unknown>
) {
  const graduationDate = cleanGraduationDate(
    body.graduation_date
  );

  return {
    full_name: toRequiredString(
      body.full_name
    ),

    batch: toRequiredString(
      body.batch
    ),

    section: toRequiredString(
      body.section
    ).toUpperCase(),

    graduation_date: graduationDate,

    /*
     * Keep graduation_year for compatibility
     * with the existing Alumni table/UI.
     */
    graduation_year: graduationDate
      ? Number(
          graduationDate.slice(0, 4)
        )
      : null,

    current_position: toNullableString(
      body.current_position
    ),

    organization: toNullableString(
      body.organization
    ),

    bio: toNullableString(
      body.bio
    ),

    linkedin_url: toNullableString(
      body.linkedin_url
    ),

    facebook_url: toNullableString(
      body.facebook_url
    ),

    instagram_url: toNullableString(
      body.instagram_url
    ),

    is_public:
      typeof body.is_public === "boolean"
        ? body.is_public
        : true,
  };
}

function photoPath(userId: string) {
  return `alumni/${userId}/profile.webp`;
}

async function uploadProfilePhoto(
  userId: string,
  dataUrl: string
) {
  const match =
    /^data:([^;]+);base64,(.+)$/.exec(
      dataUrl
    );

  if (!match) {
    throw new Error(
      "Invalid image data."
    );
  }

  const mime = match[1];
  const base64 = match[2];

  if (!mime.startsWith("image/")) {
    throw new Error(
      "Only image files are supported."
    );
  }

  const bytes = Buffer.from(
    base64,
    "base64"
  );

  if (bytes.byteLength > 3 * 1024 * 1024) {
    throw new Error(
      "Image is too large. Please use an image under 3 MB after compression."
    );
  }

  const supabaseAdmin =
    getAdminClient();

  const {
    error: uploadError,
  } =
    await supabaseAdmin.storage
      .from("committee-photos")
      .upload(
        photoPath(userId),
        bytes,
        {
          contentType: mime,
          upsert: true,
          cacheControl: "3600",
        }
      );

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } =
    supabaseAdmin.storage
      .from("committee-photos")
      .getPublicUrl(
        photoPath(userId)
      );

  return `${publicUrl}?v=${Date.now()}`;
}

async function deleteProfilePhoto(
  userId: string
) {
  const supabaseAdmin =
    getAdminClient();

  const { error } =
    await supabaseAdmin.storage
      .from("committee-photos")
      .remove([
        photoPath(userId),
      ]);

  if (error) {
    console.warn(
      "Alumni profile photo removal warning:",
      error
    );
  }
}

/*
 * ---------------------------------------------------------
 * GET
 * ---------------------------------------------------------
 *
 * One Auth account can be used from either login page.
 *
 * If an Alumni profile exists:
 *   → return Alumni
 *
 * If only Student profile exists and graduation has started:
 *   → create Alumni profile automatically
 *
 * If only Student profile exists and graduation has not
 * started:
 *   → return Student
 */
export async function GET(
  request: NextRequest
) {
  try {
    const {
      user,
      error: authError,
    } =
      await getAuthenticatedUser(
        request
      );

    if (!user) {
      return NextResponse.json(
        {
          error: authError,
        },
        {
          status: 401,
        }
      );
    }

    const supabaseAdmin =
      getAdminClient();

    /*
     * -------------------------------------------------------
     * 1. EXISTING ALUMNI PROFILE
     * -------------------------------------------------------
     *
     * Always return the Alumni profile first.
     *
     * This preserves professional information such as:
     *
     * Current Position
     * Organization
     * Bio
     * LinkedIn
     * Facebook
     * Instagram
     */
    const {
      data: alumniProfile,
      error: alumniError,
    } =
      await supabaseAdmin
        .from("alumni_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (alumniError) {
      console.error(
        "Alumni profile lookup error:",
        alumniError
      );

      return NextResponse.json(
        {
          error:
            alumniError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (alumniProfile) {
      return NextResponse.json({
        profile: alumniProfile,

        account_type: "alumni",

        user: {
          id: user.id,

          email:
            user.email || null,

          metadata:
            user.user_metadata || {},
        },
      });
    }

    /*
     * -------------------------------------------------------
     * 2. CHECK STUDENT PROFILE
     * -------------------------------------------------------
     */
    const {
      data: studentProfile,
      error: studentError,
    } =
      await supabaseAdmin
        .from("student_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (studentError) {
      console.error(
        "Student profile lookup error:",
        studentError
      );

      return NextResponse.json(
        {
          error:
            studentError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * No Student or Alumni profile exists.
     */
    if (!studentProfile) {
      return NextResponse.json({
        profile: null,

        account_type: "unknown",

        user: {
          id: user.id,

          email:
            user.email || null,

          metadata:
            user.user_metadata || {},
        },
      });
    }

    /*
     * -------------------------------------------------------
     * 3. RUNNING STUDENT
     * -------------------------------------------------------
     */
    const today =
      getDhakaTodayString();

    const graduationDate =
      studentProfile.graduation_date
        ? String(
            studentProfile.graduation_date
          ).slice(0, 10)
        : null;

    /*
     * No graduation date:
     * remain Student.
     *
     * Future graduation date:
     * remain Student.
     */
    if (
      !graduationDate ||
      graduationDate > today
    ) {
      return NextResponse.json({
        profile: studentProfile,

        account_type: "student",

        user: {
          id: user.id,

          email:
            user.email || null,

          metadata:
            user.user_metadata || {},
        },
      });
    }

    /*
     * -------------------------------------------------------
     * 4. STUDENT → ALUMNI
     * -------------------------------------------------------
     *
     * Graduation month has started.
     *
     * Use the SAME Supabase Auth user ID.
     *
     * NEVER create another Auth account.
     */
    const graduationYear =
      Number(
        graduationDate.slice(0, 4)
      );

    const alumniPayload = {
      id: user.id,

      full_name:
        studentProfile.full_name ||
        "",

      email:
        studentProfile.email ||
        user.email ||
        "",

      batch:
        studentProfile.batch ||
        "",

      section:
        studentProfile.section ||
        "",

      graduation_date:
        graduationDate,

      graduation_year:
        Number.isFinite(
          graduationYear
        )
          ? graduationYear
          : null,

      profile_photo_url:
        studentProfile.profile_photo_url ||
        null,

      linkedin_url:
        studentProfile.linkedin_url ||
        null,

      facebook_url:
        studentProfile.facebook_url ||
        null,

      instagram_url:
        studentProfile.instagram_url ||
        null,
    };

    const {
      data: createdAlumni,
      error: conversionError,
    } =
      await supabaseAdmin
        .from("alumni_profiles")
        .upsert(
          alumniPayload,
          {
            onConflict: "id",
          }
        )
        .select("*")
        .single();

    if (conversionError) {
      console.error(
        "Automatic Student → Alumni conversion error:",
        conversionError
      );

      return NextResponse.json(
        {
          error:
            "Your graduation month has started, but your Alumni profile could not be created yet.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Update Auth metadata.
     */
    const {
      error: metadataError,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...(user.user_metadata || {}),

            account_type:
              "alumni",

            graduation_date:
              graduationDate,

            graduation_year:
              Number.isFinite(
                graduationYear
              )
                ? graduationYear
                : null,
          },
        }
      );

    if (metadataError) {
      console.warn(
        "Alumni Auth metadata update warning:",
        metadataError
      );
    }

    return NextResponse.json({
      profile: createdAlumni,

      account_type: "alumni",

      user: {
        id: user.id,

        email:
          user.email || null,

        metadata:
          user.user_metadata || {},
      },
    });
  } catch (error) {
    console.error(
      "GET /api/alumni/profile error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load your alumni profile.",
      },
      {
        status: 500,
      }
    );
  }
}

/*
 * ---------------------------------------------------------
 * PUT
 * ---------------------------------------------------------
 */
export async function PUT(
  request: NextRequest
) {
  try {
    const {
      user,
      error: authError,
    } =
      await getAuthenticatedUser(
        request
      );

    if (!user) {
      return NextResponse.json(
        {
          error: authError,
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request
        .json()
        .catch(
          () => ({})
        )) as Record<
        string,
        unknown
      >;

    let profileFields:
      ReturnType<
        typeof buildProfileFields
      >;

    try {
      profileFields =
        buildProfileFields(
          body
        );
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid graduation date.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Alumni graduation date is REQUIRED.
     */
    if (
      !profileFields.graduation_date
    ) {
      return NextResponse.json(
        {
          error:
            "Graduation Month & Year is required for an alumni profile.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Alumni graduation month must have
     * already started.
     */
    const today =
      getDhakaTodayString();

    if (
      profileFields.graduation_date >
      today
    ) {
      return NextResponse.json(
        {
          error:
            "An Alumni graduation date cannot be in the future. Please select the month and year you actually graduated.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Required fields.
     */
    if (
      !profileFields.full_name
    ) {
      return NextResponse.json(
        {
          error:
            "Full name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !profileFields.batch
    ) {
      return NextResponse.json(
        {
          error:
            "Batch is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !profileFields.section
    ) {
      return NextResponse.json(
        {
          error:
            "Section is required.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Validate section.
     */
    if (
      ![
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
      ].includes(
        profileFields.section.toUpperCase()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please select a valid section.",
        },
        {
          status: 400,
        }
      );
    }

    const supabaseAdmin =
      getAdminClient();

    /*
     * -------------------------------------------------------
     * GET EXISTING ALUMNI PROFILE FIRST
     * -------------------------------------------------------
     *
     * This protects professional fields from being erased
     * if the client sends an incomplete payload.
     */
    const {
      data: existingAlumni,
      error: existingAlumniError,
    } =
      await supabaseAdmin
        .from("alumni_profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

    if (existingAlumniError) {
      console.error(
        "Existing Alumni profile lookup error:",
        existingAlumniError
      );

      return NextResponse.json(
        {
          error:
            existingAlumniError.message,
        },
        {
          status: 500,
        }
      );
    }

    let profilePhotoUrl:
      | string
      | null
      | undefined;

    /*
     * Upload new profile photo.
     */
    if (
      typeof body.photoData ===
        "string" &&
      body.photoData
    ) {
      profilePhotoUrl =
        await uploadProfilePhoto(
          user.id,
          body.photoData
        );
    }

    /*
     * Remove profile photo.
     */
    else if (
      body.removePhoto === true
    ) {
      await deleteProfilePhoto(
        user.id
      );

      profilePhotoUrl = null;
    }

    /*
     * -------------------------------------------------------
     * BUILD ALUMNI PAYLOAD
     * -------------------------------------------------------
     */
    const payload: Record<
      string,
      unknown
    > = {
      id: user.id,

      email:
        user.email || null,

      full_name:
        profileFields.full_name,

      batch:
        profileFields.batch,

      section:
        profileFields.section,

      graduation_date:
        profileFields.graduation_date,

      graduation_year:
        profileFields.graduation_year,

      current_position:
        profileFields.current_position,

      organization:
        profileFields.organization,

      bio:
        profileFields.bio,

      linkedin_url:
        profileFields.linkedin_url,

      facebook_url:
        profileFields.facebook_url,

      instagram_url:
        profileFields.instagram_url,

      is_public:
        profileFields.is_public,
    };

    /*
     * Preserve the existing photo if the request
     * does not upload/remove one.
     */
    if (
      profilePhotoUrl !==
      undefined
    ) {
      payload.profile_photo_url =
        profilePhotoUrl;
    } else if (
      existingAlumni
        ?.profile_photo_url
    ) {
      payload.profile_photo_url =
        existingAlumni.profile_photo_url;
    }

    /*
     * Save Alumni profile.
     */
    const {
      data: savedProfile,
      error: saveError,
    } =
      await supabaseAdmin
        .from("alumni_profiles")
        .upsert(
          payload,
          {
            onConflict: "id",
          }
        )
        .select("*")
        .single();

    if (saveError) {
      console.error(
        "Alumni profile database error:",
        saveError
      );

      return NextResponse.json(
        {
          error:
            saveError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * -------------------------------------------------------
     * KEEP AUTH METADATA IN SYNC
     * -------------------------------------------------------
     *
     * Same Auth account.
     */
    const {
      error: metadataError,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...(user.user_metadata || {}),

            account_type:
              "alumni",

            full_name:
              profileFields.full_name,

            batch:
              profileFields.batch,

            section:
              profileFields.section,

            graduation_date:
              profileFields.graduation_date,

            graduation_year:
              profileFields.graduation_year,
          },
        }
      );

    if (metadataError) {
      console.warn(
        "Alumni Auth metadata update warning:",
        metadataError
      );
    }

    /*
     * -------------------------------------------------------
     * SYNCHRONIZE LINKED STUDENT PROFILE
     * -------------------------------------------------------
     *
     * If the same person originally had a Student profile,
     * keep shared identity information synchronized.
     *
     * Professional Alumni information stays in Alumni.
     */
    const {
      data: linkedStudent,
      error:
        studentLookupError,
    } =
      await supabaseAdmin
        .from("student_profiles")
        .select(
          "id, profile_photo_url"
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    if (
      studentLookupError
    ) {
      console.warn(
        "Linked Student profile lookup warning:",
        studentLookupError
      );
    }

    if (linkedStudent) {
      const studentUpdate:
        Record<
          string,
          unknown
        > = {
        full_name:
          profileFields.full_name,

        batch:
          profileFields.batch,

        section:
          profileFields.section,

        graduation_date:
          profileFields.graduation_date,

        linkedin_url:
          profileFields.linkedin_url,

        facebook_url:
          profileFields.facebook_url,

        instagram_url:
          profileFields.instagram_url,
      };

      /*
       * Keep the same profile photo URL
       * when Alumni changes their photo.
       */
      if (
        profilePhotoUrl !==
        undefined
      ) {
        studentUpdate.profile_photo_url =
          profilePhotoUrl;
      }

      const {
        error:
          studentUpdateError,
      } =
        await supabaseAdmin
          .from(
            "student_profiles"
          )
          .update(
            studentUpdate
          )
          .eq(
            "id",
            user.id
          );

      if (
        studentUpdateError
      ) {
        console.warn(
          "Linked Student profile synchronization warning:",
          studentUpdateError
        );
      }
    }

    return NextResponse.json({
      success: true,

      profile:
        savedProfile,

      account_type:
        "alumni",
    });
  } catch (error) {
    console.error(
      "PUT /api/alumni/profile error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save your alumni profile.",
      },
      {
        status: 500,
      }
    );
  }
}
