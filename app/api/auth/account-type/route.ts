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

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  return `${year}-${month}-${day}`;
}

function getToken(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.substring(7).trim() || null;
}

function formatBatch(batch: unknown) {
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
    if (number % 10 === 1) suffix = "st";
    if (number % 10 === 2) suffix = "nd";
    if (number % 10 === 3) suffix = "rd";
  }

  return `${number}${suffix} Batch`;
}

export async function GET(request: NextRequest) {
  try {
    const token = getToken(request);

    if (!token) {
      return NextResponse.json(
        { error: "Login is required." },
        { status: 401 }
      );
    }

    const supabase = getAdminClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: "Your session has expired. Please log in again." },
        { status: 401 }
      );
    }

    // First check Alumni profile.
    const { data: alumni, error: alumniError } = await supabase
      .from("alumni_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (alumniError) {
      console.error("Alumni lookup error:", alumniError);

      return NextResponse.json(
        { error: "Unable to determine your account type." },
        { status: 500 }
      );
    }

    if (alumni) {
      return NextResponse.json({
        account_type: "alumni",
        redirect_to: "/alumni/profile",
        profile: alumni,
        user: {
          id: user.id,
          email: user.email ?? null,
        },
      });
    }

    // If there is no Alumni profile, check Student profile.
    const { data: student, error: studentError } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (studentError) {
      console.error("Student lookup error:", studentError);

      return NextResponse.json(
        { error: "Unable to determine your account type." },
        { status: 500 }
      );
    }

    if (!student) {
      return NextResponse.json(
        {
          error:
            "No Student or Alumni profile was found for this account.",
        },
        { status: 404 }
      );
    }

    const today = getDhakaToday();

    const graduationDate = student.graduation_date
      ? String(student.graduation_date).slice(0, 10)
      : null;

    // Not graduated yet = Student.
    if (!graduationDate || graduationDate > today) {
      return NextResponse.json({
        account_type: "student",
        redirect_to: "/students/profile",
        profile: student,
        user: {
          id: user.id,
          email: user.email ?? null,
        },
      });
    }

    /*
     * Graduation month has started.
     *
     * Keep the SAME Supabase Auth user ID and create the Alumni
     * profile automatically.
     */
    const graduationYear = Number(graduationDate.slice(0, 4));

    const alumniData = {
      id: user.id,
      full_name: student.full_name,
      email: student.email || user.email || "",
      batch: formatBatch(student.batch),
      section: student.section || "",
      graduation_date: graduationDate,
      graduation_year: Number.isFinite(graduationYear)
        ? graduationYear
        : null,
      profile_photo_url: student.profile_photo_url || null,
      linkedin_url: student.linkedin_url || null,
      facebook_url: student.facebook_url || null,
      instagram_url: student.instagram_url || null,
    };

    const { data: createdAlumni, error: createError } = await supabase
      .from("alumni_profiles")
      .upsert(alumniData, {
        onConflict: "id",
      })
      .select("*")
      .single();

    if (createError) {
      console.error("Alumni conversion error:", createError);

      return NextResponse.json(
        {
          error:
            "Your graduation has started, but your Alumni profile could not be created.",
        },
        { status: 500 }
      );
    }

    // Keep Auth metadata synchronized.
    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata || {}),
        account_type: "alumni",
        graduation_date: graduationDate,
        graduation_year: Number.isFinite(graduationYear)
          ? graduationYear
          : null,
      },
    });

    return NextResponse.json({
      account_type: "alumni",
      redirect_to: "/alumni/profile",
      profile: createdAlumni,
      user: {
        id: user.id,
        email: user.email ?? null,
      },
    });
  } catch (error) {
    console.error("Account resolver error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to determine your account type.",
      },
      { status: 500 }
    );
  }
}
