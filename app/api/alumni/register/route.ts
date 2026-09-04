
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function getAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase server configuration is missing. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel."
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function nullableString(value: unknown) {
  const valueString = cleanString(value);
  return valueString || null;
}

function nullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function photoPath(userId: string) {
  return `alumni/${userId}/profile.webp`;
}

async function uploadProfilePhoto(
  userId: string,
  dataUrl: string
) {
  const match =
    /^data:([^;]+);base64,(.+)$/.exec(dataUrl);

  if (!match) {
    throw new Error("Invalid image data.");
  }

  const mime = match[1];
  const base64 = match[2];

  if (!mime.startsWith("image/")) {
    throw new Error("Only image files are supported.");
  }

  const bytes = Buffer.from(base64, "base64");

  if (bytes.byteLength > 3 * 1024 * 1024) {
    throw new Error(
      "Profile photo is too large. Please use an image under 3 MB."
    );
  }

  const supabaseAdmin = getAdminClient();

  const { error } = await supabaseAdmin.storage
    .from("committee-photos")
    .upload(photoPath(userId), bytes, {
      contentType: mime,
      upsert: true,
      cacheControl: "3600",
    });

  if (error) {
    throw error;
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage
    .from("committee-photos")
    .getPublicUrl(photoPath(userId));

  return `${publicUrl}?v=${Date.now()}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const fullName = cleanString(body.full_name);
    const email = cleanString(body.email).toLowerCase();
    const password = typeof body.password === "string"
      ? body.password
      : "";

    const batch = cleanString(body.batch);
    const section = cleanString(body.section).toUpperCase();

    const graduationYear = nullableNumber(
      body.graduation_year
    );

    const currentPosition = nullableString(
      body.current_position
    );

    const organization = nullableString(
      body.organization
    );

    const bio = nullableString(body.bio);

    const linkedinUrl = nullableString(
      body.linkedin_url
    );

    const facebookUrl = nullableString(
      body.facebook_url
    );

    const instagramUrl = nullableString(
      body.instagram_url
    );

    const isPublic =
      typeof body.is_public === "boolean"
        ? body.is_public
        : true;

    const photoData =
      typeof body.photoData === "string"
        ? body.photoData
        : null;

    if (!fullName) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400 }
      );
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    ) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
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
        { error: "Please select your batch." },
        { status: 400 }
      );
    }

    if (!section) {
      return NextResponse.json(
        { error: "Please select your section." },
        { status: 400 }
      );
    }

    if (
      !["A", "B", "C", "D", "E", "F"].includes(section)
    ) {
      return NextResponse.json(
        { error: "Invalid section selected." },
        { status: 400 }
      );
    }

    const supabaseAdmin = getAdminClient();

    /*
     * IMPORTANT:
     * email_confirm: true means this Alumni account is
     * automatically confirmed.
     *
     * No confirmation email is required.
     */
    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          batch,
          section,
        },
      });

    if (authError || !authData.user) {
      const message =
        authError?.message ||
        "Unable to create alumni account.";

      const lowerMessage =
        message.toLowerCase();

      if (
        lowerMessage.includes("already") ||
        lowerMessage.includes("exists")
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
        { error: message },
        { status: 400 }
      );
    }

    const userId = authData.user.id;

    let profilePhotoUrl: string | null = null;

    try {
      if (photoData) {
        profilePhotoUrl =
          await uploadProfilePhoto(
            userId,
            photoData
          );
      }

      const { data: profile, error: profileError } =
        await supabaseAdmin
          .from("alumni_profiles")
          .insert({
            id: userId,
            email,
            full_name: fullName,
            batch,
            section,
            graduation_year: graduationYear,
            current_position: currentPosition,
            organization,
            bio,
            linkedin_url: linkedinUrl,
            facebook_url: facebookUrl,
            instagram_url: instagramUrl,
            is_public: isPublic,
            profile_photo_url:
              profilePhotoUrl,
          })
          .select()
          .single();

      if (profileError) {
        if (profilePhotoUrl) {
          await supabaseAdmin.storage
            .from("committee-photos")
            .remove([photoPath(userId)]);
        }

        await supabaseAdmin.auth.admin.deleteUser(
          userId
        );

        return NextResponse.json(
          {
            error:
              "Account could not be completed. Please try again.",
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        {
          success: true,
          user: {
            id: userId,
            email,
          },
          profile,
        },
        { status: 201 }
      );
    } catch (profileError) {
      if (profilePhotoUrl) {
        await supabaseAdmin.storage
          .from("committee-photos")
          .remove([photoPath(userId)]);
      }

      await supabaseAdmin.auth.admin.deleteUser(
        userId
      );

      throw profileError;
    }
  } catch (error) {
    console.error(
      "POST /api/alumni/register error:",
      error
    );

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
