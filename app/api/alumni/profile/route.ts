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
    return { user: null, error: "Login is required." };
  }

  const supabaseAdmin = getAdminClient();

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return { user: null, error: "Your session has expired. Please log in again." };
  }

  return { user, error: null };
}

function toNullableString(value: unknown) {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed || null;
}

function toRequiredString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function toNullableNumber(value: unknown) {
  if (value === null || value === undefined || value === "") return null;

  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function buildProfileFields(body: Record<string, unknown>) {
  return {
    full_name: toRequiredString(body.full_name),
    batch: toRequiredString(body.batch),
    section: toRequiredString(body.section),
    graduation_year: toNullableNumber(body.graduation_year),
    current_position: toNullableString(body.current_position),
    organization: toNullableString(body.organization),
    bio: toNullableString(body.bio),
    linkedin_url: toNullableString(body.linkedin_url),
    facebook_url: toNullableString(body.facebook_url),
    instagram_url: toNullableString(body.instagram_url),
    is_public: typeof body.is_public === "boolean" ? body.is_public : true,
  };
}

function photoPath(userId: string) {
  return `alumni/${userId}/profile.webp`;
}

async function uploadProfilePhoto(userId: string, dataUrl: string) {
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);

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
    throw new Error("Image is too large. Please use an image under 3 MB after compression.");
  }

  const supabaseAdmin = getAdminClient();

  const { error: uploadError } = await supabaseAdmin.storage
    .from("committee-photos")
    .upload(photoPath(userId), bytes, {
      contentType: mime,
      upsert: true,
      cacheControl: "3600",
    });

  if (uploadError) {
    throw uploadError;
  }

  const {
    data: { publicUrl },
  } = supabaseAdmin.storage
    .from("committee-photos")
    .getPublicUrl(photoPath(userId));

  return `${publicUrl}?v=${Date.now()}`;
}

async function deleteProfilePhoto(userId: string) {
  const supabaseAdmin = getAdminClient();

  const { error } = await supabaseAdmin.storage
    .from("committee-photos")
    .remove([photoPath(userId)]);

  if (error) {
    console.warn("Alumni profile photo removal warning:", error);
  }
}

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const supabaseAdmin = getAdminClient();

    const { data: profile, error } = await supabaseAdmin
      .from("alumni_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      profile: profile || null,
      user: {
        id: user.id,
        email: user.email || null,
        metadata: user.user_metadata || {},
      },
    });
  } catch (error) {
    console.error("GET /api/alumni/profile error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load your alumni profile.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json({ error: authError }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    const profileFields = buildProfileFields(body);

    if (!profileFields.full_name) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (!profileFields.batch) {
      return NextResponse.json({ error: "Batch is required." }, { status: 400 });
    }

    if (!profileFields.section) {
      return NextResponse.json({ error: "Section is required." }, { status: 400 });
    }

    let profilePhotoUrl: string | null | undefined;

    if (typeof body.photoData === "string" && body.photoData) {
      profilePhotoUrl = await uploadProfilePhoto(user.id, body.photoData);
    } else if (body.removePhoto === true) {
      await deleteProfilePhoto(user.id);
      profilePhotoUrl = null;
    }

    const supabaseAdmin = getAdminClient();

    const payload: Record<string, unknown> = {
      id: user.id,
      email: user.email || null,
      ...profileFields,
    };

    if (profilePhotoUrl !== undefined) {
      payload.profile_photo_url = profilePhotoUrl;
    }

    const { data, error } = await supabaseAdmin
      .from("alumni_profiles")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    console.error("PUT /api/alumni/profile error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to save your alumni profile.",
      },
      { status: 500 }
    );
  }
}
