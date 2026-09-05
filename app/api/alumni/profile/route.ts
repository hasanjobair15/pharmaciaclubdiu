import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  const token = authHeader.replace("Bearer ", "").trim();

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
  return typeof value === "string"
    ? value.trim()
    : "";
}

/**
 * Accept:
 * YYYY-MM
 * YYYY-MM-DD
 *
 * Always store as:
 * YYYY-MM-01
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

  const raw = String(value).trim();

  if (!raw) {
    return null;
  }

  let year: number;
  let month: number;

  const monthMatch =
    raw.match(/^(\d{4})-(\d{2})$/);

  const dateMatch =
    raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (monthMatch) {
    year = Number(monthMatch[1]);
    month = Number(monthMatch[2]);
  } else if (dateMatch) {
    year = Number(dateMatch[1]);
    month = Number(dateMatch[2]);
  } else {
    return null;
  }

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month)
  ) {
    return null;
  }

  if (year < 1900 || year > 2200) {
    return null;
  }

  if (month < 1 || month > 12) {
    return null;
  }

  return `${year}-${String(month).padStart(
    2,
    "0"
  )}-01`;
}

function getGraduationYear(
  graduationDate: string
): number {
  return Number(
    String(graduationDate).slice(0, 4)
  );
}

function getDhakaTodayString() {
  const parts = new Intl.DateTimeFormat(
    "en-CA",
    {
      timeZone: "Asia/Dhaka",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }
  ).formatToParts(new Date());

  const year = parts.find(
    (part) => part.type === "year"
  )?.value;

  const month = parts.find(
    (part) => part.type === "month"
  )?.value;

  const day = parts.find(
    (part) => part.type === "day"
  )?.value;

  if (!year || !month || !day) {
    return new Date()
      .toISOString()
      .slice(0, 10);
  }

  return `${year}-${month}-${day}`;
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
  } = await supabaseAdmin.storage
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
    } = await supabaseAdmin
      .from("alumni_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      profile: profile || null,
      user: {
        id: user.id,
        email: user.email || null,
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
        .catch(() => ({}))) as Record<
        string,
        unknown
      >;

    // ---------------------------------------------------------
    // Basic fields
    // ---------------------------------------------------------

    const fullName =
      toRequiredString(
        body.full_name
      );

    const batch =
      toRequiredString(body.batch);

    const section =
      toRequiredString(body.section);

    if (!fullName) {
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

    if (!batch) {
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

    if (!section) {
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

    // ---------------------------------------------------------
    // Graduation date
    // ---------------------------------------------------------

    const graduationDate =
      cleanGraduationDate(
        body.graduation_date
      );

    /*
     * Graduation date is mandatory.
     *
     * This is intentional:
     * An Alumni profile cannot exist without
     * a graduation date.
     */
    if (!graduationDate) {
      return NextResponse.json(
        {
          error:
            "Graduation month and year are required. An Alumni profile must have a graduation date.",
        },
        {
          status: 400,
        }
      );
    }

    const graduationYear =
      getGraduationYear(
        graduationDate
      );

    // ---------------------------------------------------------
    // Graduation status
    // ---------------------------------------------------------

    const today =
      getDhakaTodayString();

    const isGraduated =
      graduationDate <= today;

    /*
     * An Alumni profile cannot use a future
     * graduation date.
     */
    if (!isGraduated) {
      return NextResponse.json(
        {
          error:
            "The graduation date must be today or earlier for an Alumni profile.",
        },
        {
          status: 400,
        }
      );
    }

    // ---------------------------------------------------------
    // Photo
    // ---------------------------------------------------------

    let profilePhotoUrl:
      | string
      | null
      | undefined;

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
    } else if (
      body.removePhoto === true
    ) {
      await deleteProfilePhoto(
        user.id
      );

      profilePhotoUrl = null;
    }

    // ---------------------------------------------------------
    // Supabase
    // ---------------------------------------------------------

    const supabaseAdmin =
      getAdminClient();

    // ---------------------------------------------------------
    // Alumni profile payload
    // ---------------------------------------------------------

    const payload: Record<
      string,
      unknown
    > = {
      id: user.id,
      email: user.email || null,

      full_name: fullName,
      batch,
      section,

      // New source-of-truth date
      graduation_date:
        graduationDate,

      // Keep old column synchronized
      // for compatibility.
      graduation_year:
        graduationYear,

      current_position:
        toNullableString(
          body.current_position
        ),

      organization:
        toNullableString(
          body.organization
        ),

      bio: toNullableString(
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

    if (
      profilePhotoUrl !== undefined
    ) {
      payload.profile_photo_url =
        profilePhotoUrl;
    }

    // ---------------------------------------------------------
    // Save Alumni profile
    // ---------------------------------------------------------

    const {
      data,
      error,
    } = await supabaseAdmin
      .from("alumni_profiles")
      .upsert(payload, {
        onConflict: "id",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    // ---------------------------------------------------------
    // Synchronize linked student profile
    // ---------------------------------------------------------

    /*
     * If this Auth user already has a student_profiles row,
     * keep its graduation_date synchronized.
     *
     * This is what makes the graduation date the actual
     * source of truth for the Running Students / Alumni
     * transition.
     */

    const {
      data: studentProfile,
      error:
        studentLookupError,
    } = await supabaseAdmin
      .from("student_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (studentLookupError) {
      console.warn(
        "Unable to check linked student profile:",
        studentLookupError
      );
    }

    if (studentProfile) {
      const {
        error:
          studentUpdateError,
      } = await supabaseAdmin
        .from("student_profiles")
        .update({
          graduation_date:
            graduationDate,
        })
        .eq("id", user.id);

      if (studentUpdateError) {
        console.error(
          "Unable to synchronize student graduation date:",
          studentUpdateError
        );

        return NextResponse.json(
          {
            error:
              "Alumni profile was saved, but the linked student graduation date could not be synchronized.",
          },
          {
            status: 500,
          }
        );
      }
    }

    // ---------------------------------------------------------
    // Synchronize Auth metadata
    // ---------------------------------------------------------

    const {
      error:
        metadataError,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            full_name: fullName,
            batch,
            section,
            graduation_date:
              graduationDate,
            graduation_year:
              graduationYear,
          },
        }
      );

    if (metadataError) {
      console.warn(
        "Unable to update alumni Auth metadata:",
        metadataError
      );
    }

    return NextResponse.json({
      success: true,
      profile: data,
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
