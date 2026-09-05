import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase server configuration is missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function getDhakaToday() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  return token || null;
}

function getGraduationYear(graduationDate: string | null) {
  if (!graduationDate) {
    return null;
  }

  const year = Number(String(graduationDate).slice(0, 4));

  return Number.isFinite(year) ? year : null;
}

function getBatchText(batch: unknown) {
  if (batch === null || batch === undefined) {
    return "";
  }

  const value = String(batch).trim();

  if (!value) {
    return "";
  }

  if (/batch$/i.test(value)) {
    return value;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return value;
  }

  let suffix = "th";

  if (number % 100 < 11 || number % 100 > 13) {
    if (number % 10 === 1) {
      suffix = "st";
    } else if (number % 10 === 2) {
      suffix = "nd";
    } else if (number % 10 === 3) {
      suffix = "rd";
    }
  }

  return `${number}${suffix} Batch`;
}

export async function GET(request: NextRequest) {
  try {
    const accessToken = getBearerToken(request);

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "Login is required.",
        },
        {
          status: 401,
        }
      );
    }

    const supabaseAdmin = getAdminClient();

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !user) {
      return NextResponse.json(
        {
          error: "Your session has expired. Please log in again.",
        },
        {
          status: 401,
        }
      );
    }

    /*
     * ------------------------------------------------------------
     * 1. Check Alumni Profile First
     * ------------------------------------------------------------
     *
     * If the account already has an alumni profile, the account is
     * an alumni account regardless of which login page was used.
     */
    const {
      data: alumniProfile,
      error: alumniError,
    } = await supabaseAdmin
      .from("alumni_profiles")
      .select(
        "id, full_name, email, batch, section, graduation_date, graduation_year, profile_photo_url, linkedin_url, facebook_url, instagram_url"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (alumniError) {
      console.error(
        "Account resolver alumni query error:",
        alumniError
      );

      return NextResponse.json(
        {
          error: "Unable to determine your account type.",
        },
        {
          status: 500,
        }
      );
    }

    if (alumniProfile) {
      return NextResponse.json({
        account_type: "alumni",
        redirect_to: "/alumni/profile",
        profile: alumniProfile,
        user: {
          id: user.id,
          email: user.email || null,
        },
      });
    }

    /*
     * ------------------------------------------------------------
     * 2. Check Student Profile
     * ------------------------------------------------------------
     */
    const {
      data: studentProfile,
      error: studentError,
    } = await supabaseAdmin
      .from("student_profiles")
      .select(
        "id, full_name, email, batch, section, graduation_date, profile_photo_url, linkedin_url, facebook_url, instagram_url"
      )
      .eq("id", user.id)
      .maybeSingle();

    if (studentError) {
      console.error(
        "Account resolver student query error:",
        studentError
      );

      return NextResponse.json(
        {
          error: "Unable to determine your account type.",
        },
        {
          status: 500,
        }
      );
    }

    if (!studentProfile) {
      return NextResponse.json(
        {
          error:
            "Your login is valid, but no Student or Alumni profile was found for this account.",
        },
        {
          status: 404,
        }
      );
    }

    /*
     * ------------------------------------------------------------
     * 3. Determine Student vs Alumni
     * ------------------------------------------------------------
     *
     * Graduation date is the source of truth.
     *
     * Example:
     * graduation_date = 2026-09-01
     * Dhaka today      = 2026-09-05
     *
     * Therefore the student is now an alumni.
     */
    const today = getDhakaToday();

    const graduationDate = studentProfile.graduation_date
      ? String(studentProfile.graduation_date).slice(0, 10)
      : null;

    const isGraduated =
      Boolean(graduationDate) && graduationDate <= today;

    if (!isGraduated) {
      return NextResponse.json({
        account_type: "student",
        redirect_to: "/students/profile",
        profile: studentProfile,
        user: {
          id: user.id,
          email: user.email || null,
        },
      });
    }

    /*
     * ------------------------------------------------------------
     * 4. Student Has Graduated
     * ------------------------------------------------------------
     *
     * Create the alumni profile using THE SAME AUTH USER ID.
     *
     * This means:
     *
     * Student account
     *       ↓
     * same Supabase Auth account
     *       ↓
     * Alumni profile
     *
     * No second login/account is created.
     */
    const graduationYear = getGraduationYear(graduationDate);

    const alumniData = {
      id: user.id,
      full_name: studentProfile.full_name,
      email: studentProfile.email || user.email || "",
      batch: getBatchText(studentProfile.batch),
      section: studentProfile.section || "",
      graduation_date: graduationDate,
      graduation_year: graduationYear,
      profile_photo_url:
        studentProfile.profile_photo_url || null,
      linkedin_url: studentProfile.linkedin_url || null,
      facebook_url: studentProfile.facebook_url || null,
      instagram_url: studentProfile.instagram_url || null,
    };

    const {
      data: createdAlumniProfile,
      error: createAlumniError,
    } = await supabaseAdmin
      .from("alumni_profiles")
      .upsert(alumniData, {
        onConflict: "id",
      })
      .select(
        "id, full_name, email, batch, section, graduation_date, graduation_year, profile_photo_url, linkedin_url, facebook_url, instagram_url"
      )
      .single();

    if (createAlumniError) {
      console.error(
        "Account resolver alumni profile creation error:",
        createAlumniError
      );

      return NextResponse.json(
        {
          error:
            "Your graduation has started, but we could not prepare your Alumni profile. Please try logging in again.",
        },
        {
          status: 500,
        }
      );
    }

    /*
     * Update Auth metadata so the account identity also knows
     * that the user is currently an alumni.
     */
    const { error: metadataError } =
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...(user.user_metadata || {}),
          account_type: "alumni",
          graduation_date: graduationDate,
          graduation_year: graduationYear,
        },
      });

    if (metadataError) {
      console.error(
        "Account resolver metadata update error:",
        metadataError
      );
    }

    return NextResponse.json({
      account_type: "alumni",
      redirect_to: "/alumni/profile",
      profile: createdAlumniProfile,
      user: {
        id: user.id,
        email: user.email || null,
      },
    });
  } catch (error) {
    console.error(
      "GET /api/auth/account-type error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to determine your account type.",
      },
      {
        status: 500,
      }
    );
  }
}
