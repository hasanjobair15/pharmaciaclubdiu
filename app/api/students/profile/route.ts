import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing Supabase environment variables.");
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

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  const [type, token] = authorization.split(" ");

  if (type?.toLowerCase() !== "bearer" || !token) {
    return null;
  }

  return token;
}

function cleanText(value: unknown) {
  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

/**
 * Accepts:
 *   "2026-09"
 *   "2026-09-01"
 *   ""
 *   null
 *
 * Stores the first day of the selected graduation month.
 *
 * Empty value means no graduation date, so the student
 * remains in Running Students.
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

    // We only care about the graduation month.
    // Always store the first day of that month.
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

export async function GET(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Invalid or expired session.",
        },
        {
          status: 401,
        }
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
          profile_photo_url,
          linkedin_url,
          instagram_url,
          facebook_url,
          graduation_date,
          created_at,
          updated_at
        `
      )
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Student profile GET error:", error);

      return NextResponse.json(
        {
          error: "Failed to load student profile.",
        },
        {
          status: 500,
        }
      );
    }

    if (!data) {
      return NextResponse.json(
        {
          error: "Student profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      profile: data,
    });
  } catch (error) {
    console.error("Student profile GET exception:", error);

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getBearerToken(request);

    if (!token) {
      return NextResponse.json(
        {
          error: "Unauthorized.",
        },
        {
          status: 401,
        }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Invalid or expired session.",
        },
        {
          status: 401,
        }
      );
    }

    let body: Record<string, unknown>;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Invalid request body.",
        },
        {
          status: 400,
        }
      );
    }

    const fullName = cleanText(body.full_name);
    const studentId = cleanText(body.student_id);
    const section = cleanText(body.section).toUpperCase();
    const bloodGroup = cleanText(body.blood_group);
    const linkedinUrl = cleanText(body.linkedin_url);
    const instagramUrl = cleanText(body.instagram_url);
    const facebookUrl = cleanText(body.facebook_url);
    const profilePhotoUrl = cleanText(body.profile_photo_url);

    const graduationDate = cleanGraduationDate(
      body.graduation_date
    );

    if (!fullName) {
      return NextResponse.json(
        {
          error: "Full name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (fullName.length > 150) {
      return NextResponse.json(
        {
          error: "Full name is too long.",
        },
        {
          status: 400,
        }
      );
    }

    const numericBatch = Number(body.batch);

    if (
      !Number.isInteger(numericBatch) ||
      numericBatch < 1 ||
      numericBatch > 100
    ) {
      return NextResponse.json(
        {
          error: "Please provide a valid batch.",
        },
        {
          status: 400,
        }
      );
    }

    if (!["A", "B"].includes(section)) {
      return NextResponse.json(
        {
          error: "Section must be A or B.",
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Graduation date is optional.
     *
     * If it is NULL:
     *   Student remains in Running Students.
     *
     * If it is something like:
     *   2026-09-01
     *
     * then the Alumni page can automatically treat the student
     * as an alumnus once that month has arrived.
     */

    const { data: updatedProfile, error: updateError } =
      await supabaseAdmin
        .from("student_profiles")
        .update({
          full_name: fullName,
          student_id: studentId || null,
          batch: numericBatch,
          section,
          blood_group: bloodGroup || null,
          profile_photo_url: profilePhotoUrl || null,
          linkedin_url: linkedinUrl || null,
          instagram_url: instagramUrl || null,
          facebook_url: facebookUrl || null,
          graduation_date: graduationDate,
          updated_at: new Date().toISOString(),
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
            profile_photo_url,
            linkedin_url,
            instagram_url,
            facebook_url,
            graduation_date,
            created_at,
            updated_at
          `
        )
        .single();

    if (updateError) {
      console.error("Student profile update error:", updateError);

      return NextResponse.json(
        {
          error: "Failed to update student profile.",
          details: updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Keep Supabase Auth metadata synchronized with the profile.
     */
    const { error: metadataError } =
      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...(user.user_metadata || {}),
            full_name: fullName,
            batch: numericBatch,
            section,
          },
        }
      );

    if (metadataError) {
      console.error(
        "Student auth metadata update error:",
        metadataError
      );

      /*
       * We do not fail the whole profile update here because
       * the database profile has already been updated successfully.
       */
    }

    return NextResponse.json({
      message: "Profile updated successfully.",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error("Student profile PUT exception:", error);

    return NextResponse.json(
      {
        error: "Something went wrong.",
      },
      {
        status: 500,
      }
    );
  }
}
