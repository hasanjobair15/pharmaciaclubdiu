import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Alumni profile API is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel."
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

function getBearerToken(
  request: NextRequest
) {
  const authHeader =
    request.headers.get(
      "authorization"
    );

  if (
    !authHeader?.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  const token = authHeader
    .replace("Bearer ", "")
    .trim();

  return token || null;
}

async function getAuthenticatedUser(
  request: NextRequest
) {
  const accessToken =
    getBearerToken(request);

  if (!accessToken) {
    return {
      user: null,
      error: "Login is required.",
    };
  }

  const supabaseAdmin =
    getAdminClient();

  const {
    data: { user },
    error,
  } =
    await supabaseAdmin.auth.getUser(
      accessToken
    );

  if (error || !user) {
    return {
      user: null,
      error:
        "Your session has expired. Please log in again.",
    };
  }

  return {
    user,
    error: null,
  };
}

function toNullableString(
  value: unknown
) {
  if (
    typeof value !== "string"
  ) {
    return null;
  }

  const trimmed =
    value.trim();

  return trimmed || null;
}

function toRequiredString(
  value: unknown
) {
  return typeof value ===
    "string"
    ? value.trim()
    : "";
}

/*
 * Converts:
 *
 * 2026-09
 * 2026-09-01
 *
 * into:
 *
 * 2026-09-01
 *
 * For Alumni profiles the value MUST exist.
 */
function cleanGraduationDate(
  value: unknown
): string | null {
  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const raw =
    String(value).trim();

  if (!raw) {
    return null;
  }

  let year: number;
  let month: number;

  const monthMatch =
    raw.match(
      /^(\d{4})-(\d{2})$/
    );

  const dateMatch =
    raw.match(
      /^(\d{4})-(\d{2})-(\d{2})$/
    );

  if (monthMatch) {
    year = Number(
      monthMatch[1]
    );

    month = Number(
      monthMatch[2]
    );
  } else if (dateMatch) {
    year = Number(
      dateMatch[1]
    );

    month = Number(
      dateMatch[2]
    );
  } else {
    throw new Error(
      "Invalid graduation month and year."
    );
  }

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month)
  ) {
    throw new Error(
      "Invalid graduation month and year."
    );
  }

  if (
    year < 1900 ||
    year > 2200
  ) {
    throw new Error(
      "Invalid graduation year."
    );
  }

  if (
    month < 1 ||
    month > 12
  ) {
    throw new Error(
      "Invalid graduation month."
    );
  }

  return `${year}-${String(
    month
  ).padStart(2, "0")}-01`;
}

/*
 * Dhaka date.
 *
 * We intentionally use Asia/Dhaka instead
 * of the server's timezone.
 */
function getDhakaTodayString() {
  const parts =
    new Intl.DateTimeFormat(
      "en-US",
      {
        timeZone: "Asia/Dhaka",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }
    ).formatToParts(
      new Date()
    );

  const year = Number(
    parts.find(
      (part) =>
        part.type === "year"
    )?.value
  );

  const month = Number(
    parts.find(
      (part) =>
        part.type === "month"
    )?.value
  );

  const day = Number(
    parts.find(
      (part) =>
        part.type === "day"
    )?.value
  );

  return `${year}-${String(
    month
  ).padStart(2, "0")}-${String(
    day
  ).padStart(2, "0")}`;
}

function buildProfileFields(
  body: Record<string, unknown>
) {
  let graduationDate: string | null =
    null;

  try {
    graduationDate =
      cleanGraduationDate(
        body.graduation_date
      );
  } catch (error) {
    throw error;
  }

  return {
    full_name:
      toRequiredString(
        body.full_name
      ),

    batch:
      toRequiredString(
        body.batch
      ),

    section:
      toRequiredString(
        body.section
      ),

    graduation_date:
      graduationDate,

    /*
     * Keep graduation_year for
     * compatibility with the existing
     * alumni table and old UI/data.
     */
    graduation_year:
      graduationDate
        ? Number(
            graduationDate.slice(
              0,
              4
            )
          )
        : null,

    current_position:
      toNullableString(
        body.current_position
      ),

    organization:
      toNullableString(
        body.organization
      ),

    bio:
      toNullableString(
        body.bio
      ),

    linkedin_url:
      toNullableString(
        body.linkedin_url
      ),

    facebook_url:
      toNullableString(
        body.facebook_url
      ),

    instagram_url:
      toNullableString(
        body.instagram_url
      ),

    is_public:
      typeof body.is_public ===
      "boolean"
        ? body.is_public
        : true,
  };
}

function photoPath(
  userId: string
) {
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

  const mime =
    match[1];

  const base64 =
    match[2];

  if (
    !mime.startsWith(
      "image/"
    )
  ) {
    throw new Error(
      "Only image files are supported."
    );
  }

  const bytes =
    Buffer.from(
      base64,
      "base64"
    );

  if (
    bytes.byteLength >
    3 * 1024 * 1024
  ) {
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
      .from(
        "committee-photos"
      )
      .upload(
        photoPath(userId),
        bytes,
        {
          contentType: mime,
          upsert: true,
          cacheControl:
            "3600",
        }
      );

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: {
      publicUrl,
    },
  } =
    supabaseAdmin.storage
      .from(
        "committee-photos"
      )
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
      .from(
        "committee-photos"
      )
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
 * GET
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

    const {
      data: profile,
      error,
    } =
      await supabaseAdmin
        .from(
          "alumni_profiles"
        )
        .select("*")
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      profile:
        profile || null,

      user: {
        id: user.id,

        email:
          user.email ||
          null,

        metadata:
          user.user_metadata ||
          {},
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
 * PUT
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

    let profileFields;

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
     * ---------------------------------------------------------
     * REQUIRED ALUMNI GRADUATION DATE
     * ---------------------------------------------------------
     *
     * Unlike a Running Student profile,
     * an Alumni profile CANNOT be saved
     * with an empty graduation date.
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
     * Alumni must already have graduated.
     *
     * Example:
     *
     * Today = 2026-09-05
     *
     * 2026-08 → valid Alumni
     * 2026-09 → valid Alumni
     * 2026-10 → NOT yet Alumni
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
      !["A", "B", "C", "D", "E", "F"].includes(
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

    let profilePhotoUrl:
      | string
      | null
      | undefined;

    /*
     * Upload new photo.
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
     * Remove existing photo.
     */
    else if (
      body.removePhoto ===
      true
    ) {
      await deleteProfilePhoto(
        user.id
      );

      profilePhotoUrl =
        null;
    }

    const supabaseAdmin =
      getAdminClient();

    /*
     * ---------------------------------------------------------
     * ALUMNI PROFILE PAYLOAD
     * ---------------------------------------------------------
     */
    const payload: Record<
      string,
      unknown
    > = {
      id: user.id,

      email:
        user.email || null,

      ...profileFields,
    };

    if (
      profilePhotoUrl !==
      undefined
    ) {
      payload.profile_photo_url =
        profilePhotoUrl;
    }

    /*
     * Save Alumni profile.
     */
    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from(
          "alumni_profiles"
        )
        .upsert(
          payload,
          {
            onConflict:
              "id",
          }
        )
        .select()
        .single();

    if (error) {
      console.error(
        "Alumni profile database error:",
        error
      );

      return NextResponse.json(
        {
          error:
            error.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * ---------------------------------------------------------
     * KEEP AUTH METADATA IN SYNC
     * ---------------------------------------------------------
     */
    const {
      error: metadataError,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,

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
     * ---------------------------------------------------------
     * SYNCHRONIZE LINKED STUDENT PROFILE
     * ---------------------------------------------------------
     *
     * If the same person has a student_profiles
     * row, keep its graduation date synchronized.
     *
     * This means graduation_date remains the
     * single source of truth.
     *
     * If the date has already passed, the
     * student will automatically appear in
     * Alumni and disappear from Running Students.
     */
    const {
      data: studentProfile,
      error:
        studentLookupError,
    } =
      await supabaseAdmin
        .from(
          "student_profiles"
        )
        .select(
          "id"
        )
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

    if (
      studentLookupError
    ) {
      /*
       * Do not fail Alumni profile saving
       * just because a linked student row
       * does not exist.
       */
      console.warn(
        "Linked student profile lookup warning:",
        studentLookupError
      );
    }

    if (
      studentProfile
    ) {
      const {
        error:
          studentUpdateError,
      } =
        await supabaseAdmin
          .from(
            "student_profiles"
          )
          .update({
            graduation_date:
              profileFields.graduation_date,
          })
          .eq(
            "id",
            user.id
          );

      if (
        studentUpdateError
      ) {
        console.warn(
          "Linked student graduation date sync warning:",
          studentUpdateError
        );
      }
    }

    return NextResponse.json(
      {
        success: true,
        profile: data,
      }
    );
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
