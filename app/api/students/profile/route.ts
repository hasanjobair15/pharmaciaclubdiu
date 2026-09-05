import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Supabase server configuration is missing.");
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

function getAccessToken(request: Request) {
  const authorization =
    request.headers.get("authorization");

  if (!authorization) {
    return null;
  }

  if (
    !authorization
      .toLowerCase()
      .startsWith("bearer ")
  ) {
    return null;
  }

  return authorization.substring(7).trim();
}

function cleanGraduationDate(
  value: unknown
): string | null {
  if (!value) {
    return null;
  }

  const valueString = String(value).trim();

  if (!/^\d{4}-\d{2}$/.test(valueString)) {
    return null;
  }

  const [year, month] =
    valueString.split("-").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-01`;
}

export async function GET(request: Request) {
  try {
    const accessToken =
      getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "You are not logged in.",
        },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } =
      await supabaseAdmin.auth.getUser(
        accessToken
      );

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "Your login session is invalid or expired.",
        },
        { status: 401 }
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await supabaseAdmin
      .from("student_profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error(
        "Profile fetch error:",
        profileError
      );

      return NextResponse.json(
        {
          error:
            "Student profile could not be found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        profile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "GET student profile error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const accessToken =
      getAccessToken(request);

    if (!accessToken) {
      return NextResponse.json(
        {
          error: "You are not logged in.",
        },
        { status: 401 }
      );
    }

    const {
      data: { user },
      error: userError,
    } =
      await supabaseAdmin.auth.getUser(
        accessToken
      );

    if (userError || !user) {
      return NextResponse.json(
        {
          error:
            "Your login session is invalid or expired.",
        },
        { status: 401 }
      );
    }

    const body = await request.json();

    const {
      full_name,
      batch,
      section,
      student_id,
      blood_group,
      graduation_date,
      linkedin_url,
      instagram_url,
      facebook_url,
      profile_photo_url,
    } = body;

    const cleanName =
      String(full_name ?? "").trim();

    if (cleanName.length < 2) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid full name.",
        },
        { status: 400 }
      );
    }

    const numericBatch = Number(batch);

    if (!Number.isInteger(numericBatch)) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid batch.",
        },
        { status: 400 }
      );
    }

    const cleanSection =
      String(section ?? "")
        .trim()
        .toUpperCase();

    if (!["A", "B"].includes(cleanSection)) {
      return NextResponse.json(
        {
          error:
            "Section must be either A or B.",
        },
        { status: 400 }
      );
    }

    let cleanGraduationDate: string | null =
      null;

    if (graduation_date) {
      cleanGraduationDate =
        cleanGraduationDateValue(
          graduation_date
        );

      if (!cleanGraduationDate) {
        return NextResponse.json(
          {
            error:
              "Please enter a valid graduation month and year.",
          },
          { status: 400 }
        );
      }
    }

    const {
      data: updatedProfile,
      error: updateError,
    } =
      await supabaseAdmin
        .from("student_profiles")
        .update({
          full_name: cleanName,

          batch: numericBatch,

          section: cleanSection,

          student_id: student_id
            ? String(student_id).trim()
            : null,

          blood_group: blood_group
            ? String(blood_group).trim()
            : null,

          graduation_date:
            cleanGraduationDate,

          linkedin_url: linkedin_url
            ? String(linkedin_url).trim()
            : null,

          instagram_url: instagram_url
            ? String(instagram_url).trim()
            : null,

          facebook_url: facebook_url
            ? String(facebook_url).trim()
            : null,

          profile_photo_url:
            profile_photo_url || null,
        })
        .eq("id", user.id)
        .select()
        .single();

    if (updateError) {
      console.error(
        "Profile update error:",
        updateError
      );

      if (
        updateError.message
          .toLowerCase()
          .includes("student_id")
      ) {
        return NextResponse.json(
          {
            error:
              "This Student ID is already registered.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error:
            "Profile could not be updated. Please try again.",
        },
        { status: 400 }
      );
    }

    const { error: metadataError } =
      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            full_name: cleanName,
            batch: numericBatch,
            section: cleanSection,
          },
        }
      );

    if (metadataError) {
      console.error(
        "Auth metadata update warning:",
        metadataError
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Profile updated successfully.",
        profile: updatedProfile,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      "PUT student profile error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while updating your profile.",
      },
      { status: 500 }
    );
  }
}

function cleanGraduationDateValue(
  value: unknown
): string | null {
  const valueString =
    String(value ?? "").trim();

  if (!/^\d{4}-\d{2}$/.test(valueString)) {
    return null;
  }

  const [year, month] =
    valueString.split("-").map(Number);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  ) {
    return null;
  }

  return `${year}-${String(month).padStart(2, "0")}-01`;
}
