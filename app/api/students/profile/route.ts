import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

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

function cleanGraduationDate(
  value: unknown
): string | null {
  // Empty, null, or undefined means:
  // NO graduation date.
  //
  // This is intentionally allowed for
  // Running Students.

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

  // Store the month as the first day of that month.
  return `${year}-${String(month).padStart(
    2,
    "0"
  )}-01`;
}

async function getAuthenticatedUser(
  request: NextRequest
) {
  const authorization =
    request.headers.get(
      "authorization"
    );

  if (
    !authorization ||
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return {
      user: null,
      error: "Authentication required.",
    };
  }

  const token = authorization
    .replace("Bearer ", "")
    .trim();

  if (!token) {
    return {
      user: null,
      error: "Authentication required.",
    };
  }

  const supabaseAdmin =
    getSupabaseAdmin();

  const {
    data: { user },
    error,
  } =
    await supabaseAdmin.auth.getUser(
      token
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
      getSupabaseAdmin();

    const {
      data: profile,
      error,
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
          graduation_date,
          profile_photo_url,
          linkedin_url,
          instagram_url,
          facebook_url,
          created_at,
          updated_at
        `
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error(
        "Student profile GET error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!profile) {
      return NextResponse.json(
        {
          error:
            "Student profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      profile,
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
            : "Unable to load student profile.",
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

    const fullName =
      typeof body.full_name ===
      "string"
        ? body.full_name.trim()
        : "";

    const studentId =
      typeof body.student_id ===
      "string"
        ? body.student_id.trim() || null
        : null;

    const batchValue =
      body.batch;

    const section =
      typeof body.section ===
      "string"
        ? body.section
            .trim()
            .toUpperCase()
        : "";

    const bloodGroup =
      typeof body.blood_group ===
      "string"
        ? body.blood_group.trim() ||
          null
        : null;

    const linkedinUrl =
      typeof body.linkedin_url ===
      "string"
        ? body.linkedin_url.trim() ||
          null
        : null;

    const instagramUrl =
      typeof body.instagram_url ===
      "string"
        ? body.instagram_url.trim() ||
          null
        : null;

    const facebookUrl =
      typeof body.facebook_url ===
      "string"
        ? body.facebook_url.trim() ||
          null
        : null;

    // ---------------------------------------------------------
    // Graduation date
    //
    // IMPORTANT:
    // Empty is allowed here.
    //
    // Empty = NULL = Running Student status.
    // ---------------------------------------------------------

    let graduationDate: string | null;

    try {
      graduationDate =
        cleanGraduationDate(
          body.graduation_date
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

    const numericBatch =
      Number(batchValue);

    if (
      !Number.isInteger(
        numericBatch
      )
    ) {
      return NextResponse.json(
        {
          error: "Invalid batch.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !["A", "B"].includes(section)
    ) {
      return NextResponse.json(
        {
          error:
            "Section must be A or B.",
        },
        {
          status: 400,
        }
      );
    }

    const supabaseAdmin =
      getSupabaseAdmin();

    // ---------------------------------------------------------
    // Update student profile
    // ---------------------------------------------------------

    const {
      data: updatedProfile,
      error: updateError,
    } = await supabaseAdmin
      .from("student_profiles")
      .update({
        full_name: fullName,
        student_id: studentId,
        batch: numericBatch,
        section,
        blood_group: bloodGroup,

        // NULL when the student clears
        // the graduation field.
        graduation_date:
          graduationDate,

        linkedin_url: linkedinUrl,
        instagram_url:
          instagramUrl,
        facebook_url:
          facebookUrl,
      })
      .eq("id", user.id)
      .select(
        `
          id,
          full_name,
          student_id,
          email,
          batch,
          section,
          blood_group,
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
        "Student profile update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            updateError.message ||
            "Unable to update student profile.",
        },
        {
          status: 500,
        }
      );
    }

    // ---------------------------------------------------------
    // Keep Auth metadata synchronized
    // ---------------------------------------------------------

    const {
      error: metadataError,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            full_name: fullName,
            batch: numericBatch,
            section,

            // NULL when cleared.
            graduation_date:
              graduationDate,
          },
        }
      );

    if (metadataError) {
      console.warn(
        "Student Auth metadata update warning:",
        metadataError
      );
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile,
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
            : "Unable to update student profile.",
      },
      {
        status: 500,
      }
    );
  }
}
