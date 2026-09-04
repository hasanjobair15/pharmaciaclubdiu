import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getCurrentRunningBatches } from "@/lib/students/current-batches";

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
      linkedin_url,
      instagram_url,
      facebook_url,
      profile_photo_url,
    } = body;

    // ----------------------------------------
    // Required field validation
    // ----------------------------------------

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

    // ----------------------------------------
    // Name validation
    // ----------------------------------------

    if (cleanName.length < 2) {
      return NextResponse.json(
        {
          error: "Please enter a valid full name.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // Email validation
    // ----------------------------------------

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

    // ----------------------------------------
    // Password validation
    // ----------------------------------------

    if (password.length < 6) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 6 characters.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // Section validation
    // ----------------------------------------

    if (!["A", "B"].includes(cleanSection)) {
      return NextResponse.json(
        {
          error: "Section must be either A or B.",
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // Batch validation
    //
    // Current batches are calculated automatically.
    // July–December 2026:
    // 29–36
    //
    // January–June 2027:
    // 30–37
    // ----------------------------------------

    const currentBatches = getCurrentRunningBatches();

    if (!currentBatches.includes(numericBatch)) {
      return NextResponse.json(
        {
          error: `Batch ${numericBatch} is not currently running.`,
          current_batches: currentBatches,
        },
        { status: 400 }
      );
    }

    // ----------------------------------------
    // Create Supabase Auth account
    //
    // email_confirm: true
    // means students do NOT need email verification.
    //
    // This only applies to this Student
    // registration API.
    // ----------------------------------------

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email: cleanEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: cleanName,
          batch: numericBatch,
          section: cleanSection,
        },
      });

    // ----------------------------------------
    // Auth account creation error
    // ----------------------------------------

    if (authError || !authData.user) {
      const message =
        authError?.message ||
        "Unable to create student account.";

      const lowerMessage = message.toLowerCase();

      if (
        lowerMessage.includes("already") ||
        lowerMessage.includes("exists") ||
        lowerMessage.includes("registered")
      ) {
        return NextResponse.json(
          {
            error:
              "An account with this email already exists. Please log in instead.",
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

    // ----------------------------------------
    // Create Student Profile
    // ----------------------------------------

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

    // ----------------------------------------
    // If profile creation fails,
    // delete the Auth account as rollback.
    // ----------------------------------------

    if (profileError) {
      console.error(
        "Student profile creation error:",
        profileError
      );

      await supabaseAdmin.auth.admin.deleteUser(
        userId
      );

      const profileMessage =
        profileError.message.toLowerCase();

      // Student ID duplicate
      if (
        profileMessage.includes("student_id") ||
        profileMessage.includes("duplicate")
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
        { status: 500 }
      );
    }

    // ----------------------------------------
    // Success
    // ----------------------------------------

    return NextResponse.json(
      {
        success: true,
        message:
          "Student account created successfully.",
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
          "Something went wrong while creating the account.",
      },
      { status: 500 }
    );
  }
}
