import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const ADMIN_EMAIL = "jobair2311091015@diu.edu.bd";

/* =========================
   ADMIN VERIFICATION
   Only the configured administrator may use this API.
========================= */

async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return null;
  }

  const accessToken = authHeader.replace("Bearer ", "").trim();

  if (!accessToken) {
    return null;
  }

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !user) {
    return null;
  }

  if (user.email?.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
    return null;
  }

  return user;
}

function generateTemporaryPassword() {
  const randomPart = Math.random().toString(36).slice(2, 10);

  return `PCDIU-${randomPart}-29Kp`;
}

/* =========================
   STORAGE HELPERS
   Profile photos live in the existing `committee-photos` bucket at
   alumni/<userId>/profile.webp — the same path the public profile page uses.
========================= */

function photoPath(userId: string) {
  return `alumni/${userId}/profile.webp`;
}

/** Decode a base64 data URL and upload it (server-side, replaces old file). */
async function uploadPhoto(userId: string, dataUrl: string) {
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
    throw new Error("Image is too large (max 3 MB).");
  }

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
  } = supabaseAdmin.storage.from("committee-photos").getPublicUrl(
    photoPath(userId)
  );

  return `${publicUrl}?v=${Date.now()}`;
}

async function removeStoredPhoto(userId: string) {
  const { error: removeError } = await supabaseAdmin.storage
    .from("committee-photos")
    .remove([photoPath(userId)]);

  if (removeError) {
    console.warn("Photo removal warning:", removeError);
  }
}

/* =========================
   GET — LIST ALUMNI + AUTH STATUS
   Returns alumni profiles enriched with email-verification status so the
   admin can see Confirmed / Pending correctly.
========================= */

export async function GET(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("alumni_profiles")
      .select("*")
      .order("batch", { ascending: true })
      .order("section", { ascending: true })
      .order("full_name", { ascending: true });

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    /* Fetch auth metadata for every profile id in ONE call */
    const { data: page, error: listError } =
      await supabaseAdmin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

    if (listError) {
      return NextResponse.json(
        { error: listError.message },
        { status: 500 }
      );
    }

    const authMap = new Map<string, { emailConfirmedAt: string | null; lastSignInAt: string | null }>();

    for (const user of page?.users || []) {
      authMap.set(user.id, {
        emailConfirmedAt: user.email_confirmed_at ?? null,
        lastSignInAt: user.last_sign_in_at ?? null,
      });
    }

    const alumni = (profiles || []).map((profile) => ({
      ...profile,
      auth: authMap.get(profile.id) || {
        emailConfirmedAt: null,
        lastSignInAt: null,
      },
    }));

    return NextResponse.json({ alumni });
  } catch (error) {
    console.error("GET /api/admin/alumni error:", error);

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

/* =========================
   POST — CREATE ALUMNI ACCOUNT
   Creates the Supabase Auth user (server-side, email pre-confirmed) and the
   alumni_profiles row. Optionally accepts a base64 profile photo.
========================= */

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      full_name,
      email,
      batch,
      section,
      graduation_year,
      photoData,
      current_position,
      organization,
      bio,
      phone,
      linkedin_url,
      facebook_url,
      instagram_url,
      is_public,
    } = body;

    if (!full_name?.trim()) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (!email?.trim()) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    if (!batch) {
      return NextResponse.json({ error: "Batch is required." }, { status: 400 });
    }

    if (!section) {
      return NextResponse.json({ error: "Section is required." }, { status: 400 });
    }

    const temporaryPassword = generateTemporaryPassword();

    const {
      data: createdUser,
      error: createUserError,
    } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: temporaryPassword,
      email_confirm: true,
    });

    if (createUserError || !createdUser.user) {
      return NextResponse.json(
        {
          error:
            createUserError?.message || "Failed to create alumni account.",
        },
        { status: 400 }
      );
    }

    const userId = createdUser.user.id;

    /* Photo first (needs the user id for the storage path) */
    let profilePhotoUrl: string | null = null;

    if (photoData) {
      try {
        profilePhotoUrl = await uploadPhoto(userId, photoData);
      } catch (photoError) {
        await supabaseAdmin.auth.admin.deleteUser(userId);

        return NextResponse.json(
          {
            error:
              photoError instanceof Error
                ? photoError.message
                : "Failed to upload the profile photo.",
          },
          { status: 400 }
        );
      }
    }

    const { error: profileError } = await supabaseAdmin
      .from("alumni_profiles")
      .insert({
        id: userId,
        full_name: full_name.trim(),
        email: email.trim(),
        batch,
        section,
        graduation_year: graduation_year || null,
        profile_photo_url: profilePhotoUrl,
        current_position: current_position?.trim() || null,
        organization: organization?.trim() || null,
        bio: bio?.trim() || null,
        phone: phone?.trim() || null,
        linkedin_url: linkedin_url?.trim() || null,
        facebook_url: facebook_url?.trim() || null,
        instagram_url: instagram_url?.trim() || null,
        is_public: typeof is_public === "boolean" ? is_public : true,
      });

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);

      return NextResponse.json(
        {
          error:
            "Account was created but profile creation failed: " +
            profileError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Alumni account created successfully.",
      user_id: userId,
      temporary_password: temporaryPassword,
    });
  } catch (error) {
    console.error("POST /api/admin/alumni error:", error);

    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

/* =========================
   PATCH — UPDATE ALUMNI PROFILE
   Updates the alumni_profiles row and, when provided, the auth email.
   Also supports photoData (replace) and removePhoto (bool).
========================= */

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const {
      id,
      full_name,
      email,
      batch,
      section,
      graduation_year,
      photoData,
      removePhoto,
      current_position,
      organization,
      bio,
      phone,
      linkedin_url,
      facebook_url,
      instagram_url,
      is_public,
    } = body;

    if (!id) {
      return NextResponse.json({ error: "Alumni ID is required." }, { status: 400 });
    }

    /* Photo handling (only if the admin explicitly requests it) */
    let profilePhotoUrl: string | null | undefined = undefined;

    if (photoData) {
      try {
        profilePhotoUrl = await uploadPhoto(id, photoData);
      } catch (photoError) {
        return NextResponse.json(
          {
            error:
              photoError instanceof Error
                ? photoError.message
                : "Failed to upload the profile photo.",
          },
          { status: 400 }
        );
      }
    } else if (removePhoto) {
      await removeStoredPhoto(id);
      profilePhotoUrl = null;
    }

    const updatePayload: Record<string, unknown> = {
      full_name: full_name?.trim(),
      batch,
      section,
      graduation_year: graduation_year || null,
      current_position: current_position?.trim() || null,
      organization: organization?.trim() || null,
      bio: bio?.trim() || null,
      phone: phone?.trim() || null,
      linkedin_url: linkedin_url?.trim() || null,
      facebook_url: facebook_url?.trim() || null,
      instagram_url: instagram_url?.trim() || null,
      is_public: typeof is_public === "boolean" ? is_public : true,
    };

    if (email !== undefined) {
      updatePayload.email = email?.trim() || null;
    }

    if (profilePhotoUrl !== undefined) {
      updatePayload.profile_photo_url = profilePhotoUrl;
    }

    const { error: profileError } = await supabaseAdmin
      .from("alumni_profiles")
      .update(updatePayload)
      .eq("id", id);

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    if (email?.trim()) {
      const { error: authUpdateError } =
        await supabaseAdmin.auth.admin.updateUserById(id, {
          email: email.trim(),
        });

      if (authUpdateError) {
        return NextResponse.json(
          {
            error:
              "Profile updated, but authentication email could not be updated: " +
              authUpdateError.message,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: "Alumni profile updated successfully.",
    });
  } catch (error) {
    console.error("PATCH /api/admin/alumni error:", error);

    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}

/* =========================
   DELETE — REMOVE ALUMNI
   Removes the profile photo, the alumni_profiles row and the Auth user.
   The administrator account itself can never be deleted.
========================= */

export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();

    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Alumni ID is required." }, { status: 400 });
    }

    if (id === admin.id) {
      return NextResponse.json(
        { error: "You cannot delete the administrator account." },
        { status: 403 }
      );
    }

    const {
      data: targetUser,
      error: targetUserError,
    } = await supabaseAdmin.auth.admin.getUserById(id);

    if (targetUserError || !targetUser.user) {
      return NextResponse.json(
        { error: "Alumni account not found." },
        { status: 404 }
      );
    }

    if (targetUser.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      return NextResponse.json(
        { error: "The administrator account cannot be deleted." },
        { status: 403 }
      );
    }

    /* 1. Remove the profile photo (best effort — no data loss on failure) */
    await removeStoredPhoto(id);

    /* 2. Remove the alumni_profiles row explicitly (no orphaned records) */
    const { error: profileDeleteError } = await supabaseAdmin
      .from("alumni_profiles")
      .delete()
      .eq("id", id);

    if (profileDeleteError) {
      console.warn("Profile delete warning:", profileDeleteError);
    }

    /* 3. Delete the Auth user */
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: "Alumni account deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/alumni error:", error);

    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
