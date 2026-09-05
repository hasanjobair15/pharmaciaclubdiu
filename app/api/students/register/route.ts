import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentRunningBatches } from "@/app/lib/students/current-batches";

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

function cleanGraduationDate(value: unknown): string | null {
  if (!value) {
    return null;
  }

  const valueString = String(value).trim();

  if (!/^\d{4}-\d{2}$/.test(valueString)) {
    return null;
  }

  const [year, month] = valueString.split("-").map(Number);

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

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const {
      full_name,
      email,
      password,
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

    if (
      !full_name ||
      !email ||
      !password ||
      !batch ||
      !section
    ) {
      return NextResponse.json(
        {
          error:
            "Name, email, password, batch and section are required.",
        },
        { status: 400 }
      );
    }

    const cleanName = String(full_name).trim();
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanSection = String(section)
      .trim()
      .toUpperCase();

    const numericBatch = Number(batch);

    if (cleanName.length < 2) {
      return NextResponse.json(
        {
          error: "Please enter a valid full name.",
        },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return NextResponse.json(
        {
          error: "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (String(password).length < 6) {
      return NextResponse.json(
        {
          error: "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    if (!["A", "B"].includes(cleanSection)) {
      return NextResponse.json(
        {
          error: "Section must be either A or B.",
        },
        { status: 400 }
      );
    }

    if (!Number.isInteger(numericBatch)) {
      return NextResponse.json(
        {
          error: "Please select a valid batch.",
        },
        { status: 400 }
      );
    }

    const currentBatches =
      getCurrentRunningBatches();

    if (!currentBatches.includes(numericBatch)) {
      return NextResponse.json(
        {
          error: `Registration is currently available only for running batches: ${currentBatches.join(
            ", "
          )}.`,
        },
        { status: 400 }
      );
    }

    let cleanGraduationDate: string | null = null;

    if (graduation_date) {
      cleanGraduationDate =
        cleanGraduationDateValue(graduation_date);

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
      data: authData,
      error: authError,
    } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: String(password),
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        batch: numericBatch,
        section: cleanSection,
      },
    });

    if (authError || !authData.user) {
      const message =
        authError?.message ||
        "Unable to create account.";

      if (
        message.toLowerCase().includes("already") ||
        message.toLowerCase().includes("registered") ||
        message.toLowerCase().includes("exists")
      ) {
        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Please login instead.",
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        {
          error: message,
        },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    const { error: profileError } =
      await supabaseAdmin
        .from("student_profiles")
        .insert({
          id: userId,
          full_name: cleanName,
          email: cleanEmail,
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

          profile_photo_url:
            profile_photo_url || null,

          linkedin_url: linkedin_url
            ? String(linkedin_url).trim()
            : null,

          instagram_url: instagram_url
            ? String(instagram_url).trim()
            : null,

          facebook_url: facebook_url
            ? String(facebook_url).trim()
            : null,
        });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(
        userId
      );

      if (
        profileError.message
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
            "Account could not be completed. Please try again.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          "Student account created successfully. You can login now.",
        user_id: userId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "Student registration error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Something went wrong while creating the account.",
      },
      { status: 500 }
    );
  }
}

function cleanGraduationDateValue(
  value: unknown
): string | null {
  const valueString = String(value ?? "").trim();

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
