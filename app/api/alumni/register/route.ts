import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL."
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      "Missing SUPABASE_SERVICE_ROLE_KEY. Add it to your Vercel environment variables."
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

function cleanString(value: unknown): string {
  return typeof value === "string"
    ? value.trim()
    : "";
}

function nullableString(value: unknown): string | null {
  const valueString = cleanString(value);
  return valueString || null;
}

function nullableNumber(value: unknown): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function photoPath(userId: string) {
  return `alumni/${userId}/profile.webp`;
}

async function uploadProfilePhoto(
  supabaseAdmin: ReturnType<typeof getAdminClient>,
  userId: string,
  dataUrl: string
) {
  const match =
    /^data:([^;]+);base64,(.+)$/.exec(dataUrl);

  if (!match) {
    throw new Error("Invalid profile photo data.");
  }

  const mimeType = match[1];
  const base64Data = match[2];

  if (!mimeType.startsWith("image/")) {
    throw new Error(
      "Only image files are allowed."
    );
  }

  let bytes: Buffer;

  try {
    bytes = Buffer.from(
      base64Data,
      "base64"
    );
  } catch {
    throw new Error(
      "Unable to process the profile photo."
    );
  }

  if (bytes.length === 0) {
    throw new Error(
      "The profile photo is empty."
    );
  }

  if (bytes.length > 3 * 1024 * 1024) {
    throw new Error(
      "Profile photo must be smaller than 3 MB."
    );
  }

  const path = photoPath(userId);

  const { error } =
    await supabaseAdmin.storage
      .from("committee-photos")
      .upload(path, bytes, {
        contentType: mimeType,
        upsert: true,
        cacheControl: "3600",
      });

  if (error) {
    throw new Error(
      `Profile photo upload failed: ${error.message}`
    );
  }

  const { data } =
    supabaseAdmin.storage
      .from("committee-photos")
      .getPublicUrl(path);

  if (!data?.publicUrl) {
    throw new Error(
      "Profile photo URL could not be generated."
    );
  }

  return `${data.publicUrl}?v=${Date.now()}`;
}

async function rollbackUser(
  supabaseAdmin: ReturnType<typeof getAdminClient>,
  userId: string,
  photoUploaded: boolean
) {
  if (photoUploaded) {
    await supabaseAdmin.storage
      .from("committee-photos")
      .remove([photoPath(userId)])
      .catch(() => undefined);
  }

  await supabaseAdmin.auth.admin
    .deleteUser(userId)
    .catch(() => undefined);
}

export async function POST(
  request: Request
) {
  let createdUserId: string | null = null;
  let photoUploaded = false;

  try {
    const body = await request.json();

    const fullName = cleanString(
      body.full_name
    );

    const email = cleanString(
      body.email
    ).toLowerCase();

    const password =
      typeof body.password === "string"
        ? body.password
        : "";

    const batch = cleanString(
      body.batch
    );

    const section = cleanString(
      body.section
    ).toUpperCase();

    const graduationYear =
      nullableNumber(
        body.graduation_year
      );

    const currentPosition =
      nullableString(
        body.current_position
      );

    const organization =
      nullableString(
        body.organization
      );

    const bio =
      nullableString(body.bio);

    const linkedinUrl =
      nullableString(
        body.linkedin_url
      );

    const facebookUrl =
      nullableString(
        body.facebook_url
      );

    const instagramUrl =
      nullableString(
        body.instagram_url
      );

    const isPublic =
      typeof body.is_public === "boolean"
        ? body.is_public
        : true;

    const photoData =
      typeof body.photoData === "string" &&
      body.photoData.length > 0
        ? body.photoData
        : null;

    /* ---------------- VALIDATION ---------------- */

    if (!fullName) {
      return NextResponse.json(
        {
          error:
            "Full name is required.",
        },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Email address is required.",
        },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Please enter a valid email address.",
        },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 6 characters long.",
        },
        { status: 400 }
      );
    }

    if (!batch) {
      return NextResponse.json(
        {
          error:
            "Please select your batch.",
        },
        { status: 400 }
      );
    }

    if (!section) {
      return NextResponse.json(
        {
          error:
            "Please select your section.",
        },
        { status: 400 }
      );
    }

    if (
      !["A", "B", "C", "D", "E", "F"].includes(
        section
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid section selected.",
        },
        { status: 400 }
      );
    }

    /* ---------------- ADMIN CLIENT ---------------- */

    const supabaseAdmin =
      getAdminClient();

    /* ---------------- DUPLICATE CHECK ---------------- */

    /*
     * Do not rely only on createUser's error message.
     * Search Auth users explicitly so duplicate-email
     * handling is consistent.
     */

    let existingUser = null;

    try {
      let page = 1;

      while (page <= 20) {
        const {
          data,
          error,
        } =
          await supabaseAdmin.auth.admin.listUsers(
            {
              page,
              perPage: 1000,
            }
          );

        if (error) {
          break;
        }

        existingUser =
          data.users.find(
            (user) =>
              user.email?.toLowerCase() ===
              email
          ) || null;

        if (
          existingUser ||
          data.users.length < 1000
        ) {
          break;
        }

        page++;
      }
    } catch {
      // createUser below will still handle duplicates.
    }

    if (existingUser) {
      return NextResponse.json(
        {
          error:
            "This email is already registered. Please log in instead.",
        },
        { status: 409 }
      );
    }

    /* ---------------- CREATE AUTH USER ---------------- */

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser(
        {
          email,
          password,
          email_confirm: true,
          user_metadata: {
            full_name: fullName,
            batch,
            section,
          },
        }
      );

    if (
      authError ||
      !authData?.user
    ) {
      const message =
        authError?.message ||
        "Unable to create alumni account.";

      const lower =
        message.toLowerCase();

      if (
        lower.includes("already") ||
        lower.includes("exists") ||
        lower.includes("duplicate")
      ) {
        return NextResponse.json(
          {
            error:
              "This email is already registered. Please log in instead.",
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

    createdUserId =
      authData.user.id;

    /* ---------------- PROFILE PHOTO ---------------- */

    let profilePhotoUrl:
      | string
      | null = null;

    if (photoData) {
      profilePhotoUrl =
        await uploadProfilePhoto(
          supabaseAdmin,
          createdUserId,
          photoData
        );

      photoUploaded = true;
    }

    /* ---------------- CREATE PROFILE ---------------- */

    const {
      data: profile,
      error: profileError,
    } =
      await supabaseAdmin
        .from("alumni_profiles")
        .insert({
          id: createdUserId,
          email,
          full_name: fullName,
          batch,
          section,
          graduation_year:
            graduationYear,
          current_position:
            currentPosition,
          organization,
          bio,
          linkedin_url:
            linkedinUrl,
          facebook_url:
            facebookUrl,
          instagram_url:
            instagramUrl,
          is_public: isPublic,
          profile_photo_url:
            profilePhotoUrl,
        })
        .select()
        .single();

    if (profileError) {
      await rollbackUser(
        supabaseAdmin,
        createdUserId,
        photoUploaded
      );

      createdUserId = null;

      console.error(
        "Alumni profile creation failed:",
        profileError
      );

      return NextResponse.json(
        {
          error:
            "The account could not be completed. Please try again.",
          details:
            process.env.NODE_ENV ===
            "development"
              ? profileError.message
              : undefined,
        },
        { status: 500 }
      );
    }

    /* ---------------- SUCCESS ---------------- */

    return NextResponse.json(
      {
        success: true,
        message:
          "Alumni account created successfully.",
        user: {
          id: createdUserId,
          email,
        },
        profile,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      "POST /api/alumni/register error:",
      error
    );

    if (createdUserId) {
      try {
        const supabaseAdmin =
          getAdminClient();

        await rollbackUser(
          supabaseAdmin,
          createdUserId,
          photoUploaded
        );
      } catch {
        // Ignore rollback failure.
      }
    }

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create alumni account.",
      },
      { status: 500 }
    );
  }
}
