import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ADMIN_EMAIL = "diupc@diu.edu.bd";

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

const supabaseAdmin = createClient(
  supabaseUrl || "",
  serviceRoleKey || "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/* =========================================================
   ADMIN VERIFICATION
========================================================= */

async function verifyAdmin(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const accessToken = authHeader.substring(7).trim();

    if (!accessToken) {
      return null;
    }

    const {
      data: { user },
      error,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (error || !user) {
      console.error("Admin verification failed:", error?.message);
      return null;
    }

    if (
      !user.email ||
      user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
    ) {
      console.warn("Unauthorized admin attempt:", user.email);
      return null;
    }

    return user;
  } catch (error) {
    console.error("verifyAdmin error:", error);
    return null;
  }
}

/* =========================================================
   TEMPORARY PASSWORD
========================================================= */

function generateTemporaryPassword() {
  const randomPart = Math.random().toString(36).slice(2, 10);

  return `PCDIU-${randomPart}-29Kp`;
}

/* =========================================================
   STORAGE
========================================================= */

function photoPath(userId: string) {
  return `alumni/${userId}/profile.webp`;
}

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
    throw new Error("Image is too large. Maximum size is 3 MB.");
  }

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

async function removeStoredPhoto(userId: string) {
  try {
    const { error } = await supabaseAdmin.storage
      .from("committee-photos")
      .remove([photoPath(userId)]);

    if (error) {
      console.warn("Photo removal warning:", error.message);
    }
  } catch (error) {
    console.warn("Photo removal exception:", error);
  }
}

/* =========================================================
   GET — LOAD ALL ALUMNI
   ========================================================= */

export async function GET(request: NextRequest) {
  try {
    /* -------------------------
       Check environment
    ------------------------- */

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json(
        {
          error:
            "Supabase server configuration is missing. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
        },
        { status: 500 }
      );
    }

    /* -------------------------
       Verify admin
    ------------------------- */

    const admin = await verifyAdmin(request);

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    /* -------------------------
       Get alumni profiles
    ------------------------- */

    const { data: profiles, error: profilesError } =
      await supabaseAdmin
        .from("alumni_profiles")
        .select("*")
        .order("batch", { ascending: true })
        .order("section", { ascending: true })
        .order("full_name", { ascending: true });

    if (profilesError) {
      console.error(
        "alumni_profiles query error:",
        profilesError
      );

      return NextResponse.json(
        {
          error:
            "Failed to load alumni profiles: " +
            profilesError.message,
        },
        { status: 500 }
      );
    }

    /* -------------------------
       Get Auth users

       IMPORTANT:
       Failure here must NOT hide
       alumni_profiles records.
    ------------------------- */

    const authMap = new Map<
      string,
      {
        emailConfirmedAt: string | null;
        lastSignInAt: string | null;
        email: string | null;
      }
    >();

    try {
      let page = 1;
      const perPage = 1000;

      while (true) {
        const {
          data: authPage,
          error: authError,
        } = await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage,
        });

        if (authError) {
          console.warn(
            "Could not load Auth users:",
            authError.message
          );
          break;
        }

        const users = authPage?.users || [];

        for (const user of users) {
          authMap.set(user.id, {
            emailConfirmedAt:
              user.email_confirmed_at ?? null,
            lastSignInAt:
              user.last_sign_in_at ?? null,
            email: user.email ?? null,
          });
        }

        if (users.length < perPage) {
          break;
        }

        page++;
      }
    } catch (authError) {
      console.warn(
        "Auth users lookup failed:",
        authError
      );
    }

    /* -------------------------
       Combine profile + auth data

       Even if Auth lookup fails,
       profile is still returned.
    ------------------------- */

    const alumni = (profiles || []).map((profile) => {
      const auth = authMap.get(profile.id);

      return {
        ...profile,

        auth: {
          emailConfirmedAt:
            auth?.emailConfirmedAt ?? null,

          lastSignInAt:
            auth?.lastSignInAt ?? null,

          email:
            auth?.email ?? profile.email ?? null,
        },
      };
    });

    return NextResponse.json({
      success: true,
      alumni,
      count: alumni.length,
    });
  } catch (error) {
    console.error(
      "GET /api/admin/alumni error:",
      error
    );

    return NextResponse.json(
      {
        error: "Internal server error.",
      },
      { status: 500 }
    );
  }
}

/* =========================================================
   POST — CREATE ALUMNI
========================================================= */

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
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

    /* -------------------------
       Validation
    ------------------------- */

    if (!full_name?.trim()) {
      return NextResponse.json(
        { error: "Full name is required." },
        { status: 400 }
      );
    }

    if (!email?.trim()) {
      return NextResponse.json(
        { error: "Email is required." },
        { status: 400 }
      );
    }

    if (!batch) {
      return NextResponse.json(
        { error: "Batch is required." },
        { status: 400 }
      );
    }

    if (!section) {
      return NextResponse.json(
        { error: "Section is required." },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    /* -------------------------
       Prevent duplicate profile
    ------------------------- */

    const { data: existingProfile } =
      await supabaseAdmin
        .from("alumni_profiles")
        .select("id,email")
        .ilike("email", normalizedEmail)
        .maybeSingle();

    if (existingProfile) {
      return NextResponse.json(
        {
          error:
            "An alumni profile with this email already exists.",
        },
        { status: 409 }
      );
    }

    /* -------------------------
       Create Auth user
    ------------------------- */

    const temporaryPassword =
      generateTemporaryPassword();

    const {
      data: createdUser,
      error: createUserError,
    } = await supabaseAdmin.auth.admin.createUser({
      email: normalizedEmail,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        full_name: full_name.trim(),
        batch,
        section,
      },
    });

    if (
      createUserError ||
      !createdUser?.user
    ) {
      return NextResponse.json(
        {
          error:
            createUserError?.message ||
            "Failed to create alumni account.",
        },
        { status: 400 }
      );
    }

    const userId = createdUser.user.id;

    /* -------------------------
       Upload photo
    ------------------------- */

    let profilePhotoUrl: string | null = null;

    if (photoData) {
      try {
        profilePhotoUrl = await uploadPhoto(
          userId,
          photoData
        );
      } catch (photoError) {
        await supabaseAdmin.auth.admin.deleteUser(
          userId
        );

        return NextResponse.json(
          {
            error:
              photoError instanceof Error
                ? photoError.message
                : "Failed to upload profile photo.",
          },
          { status: 400 }
        );
      }
    }

    /* -------------------------
       Create profile
    ------------------------- */

    const { error: profileError } =
      await supabaseAdmin
        .from("alumni_profiles")
        .insert({
          id: userId,
          full_name: full_name.trim(),
          email: normalizedEmail,
          batch,
          section,
          graduation_year:
            graduation_year || null,
          profile_photo_url:
            profilePhotoUrl,
          current_position:
            current_position?.trim() || null,
          organization:
            organization?.trim() || null,
          bio: bio?.trim() || null,
          phone: phone?.trim() || null,
          linkedin_url:
            linkedin_url?.trim() || null,
          facebook_url:
            facebook_url?.trim() || null,
          instagram_url:
            instagram_url?.trim() || null,
          is_public:
            typeof is_public === "boolean"
              ? is_public
              : true,
        });

    if (profileError) {
      await removeStoredPhoto(userId);

      await supabaseAdmin.auth.admin.deleteUser(
        userId
      );

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
      message:
        "Alumni account created successfully.",
      user_id: userId,
      temporary_password: temporaryPassword,
    });
  } catch (error) {
    console.error(
      "POST /api/admin/alumni error:",
      error
    );

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

/* =========================================================
   PATCH — UPDATE ALUMNI
========================================================= */

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
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
      return NextResponse.json(
        { error: "Alumni ID is required." },
        { status: 400 }
      );
    }

    if (id === admin.id) {
      return NextResponse.json(
        {
          error:
            "The administrator account cannot be modified as an alumni account.",
        },
        { status: 403 }
      );
    }

    /* -------------------------
       Verify profile exists
    ------------------------- */

    const {
      data: existingProfile,
      error: existingProfileError,
    } = await supabaseAdmin
      .from("alumni_profiles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (
      existingProfileError ||
      !existingProfile
    ) {
      return NextResponse.json(
        { error: "Alumni profile not found." },
        { status: 404 }
      );
    }

    /* -------------------------
       Photo
    ------------------------- */

    let profilePhotoUrl:
      | string
      | null
      | undefined = undefined;

    if (photoData) {
      try {
        profilePhotoUrl =
          await uploadPhoto(id, photoData);
      } catch (photoError) {
        return NextResponse.json(
          {
            error:
              photoError instanceof Error
                ? photoError.message
                : "Failed to upload profile photo.",
          },
          { status: 400 }
        );
      }
    } else if (removePhoto) {
      await removeStoredPhoto(id);
      profilePhotoUrl = null;
    }

    /* -------------------------
       Prepare profile update
    ------------------------- */

    const updatePayload: Record<
      string,
      unknown
    > = {};

    if (full_name !== undefined) {
      updatePayload.full_name =
        full_name?.trim() || null;
    }

    if (batch !== undefined) {
      updatePayload.batch = batch;
    }

    if (section !== undefined) {
      updatePayload.section = section;
    }

    if (graduation_year !== undefined) {
      updatePayload.graduation_year =
        graduation_year || null;
    }

    if (current_position !== undefined) {
      updatePayload.current_position =
        current_position?.trim() || null;
    }

    if (organization !== undefined) {
      updatePayload.organization =
        organization?.trim() || null;
    }

    if (bio !== undefined) {
      updatePayload.bio =
        bio?.trim() || null;
    }

    if (phone !== undefined) {
      updatePayload.phone =
        phone?.trim() || null;
    }

    if (linkedin_url !== undefined) {
      updatePayload.linkedin_url =
        linkedin_url?.trim() || null;
    }

    if (facebook_url !== undefined) {
      updatePayload.facebook_url =
        facebook_url?.trim() || null;
    }

    if (instagram_url !== undefined) {
      updatePayload.instagram_url =
        instagram_url?.trim() || null;
    }

    if (typeof is_public === "boolean") {
      updatePayload.is_public = is_public;
    }

    if (email !== undefined) {
      updatePayload.email =
        email?.trim().toLowerCase() || null;
    }

    if (profilePhotoUrl !== undefined) {
      updatePayload.profile_photo_url =
        profilePhotoUrl;
    }

    /* -------------------------
       Update Auth email FIRST
       so profile and Auth stay
       synchronized.
    ------------------------- */

    if (
      email !== undefined &&
      email?.trim()
    ) {
      const newEmail =
        email.trim().toLowerCase();

      if (
        newEmail !==
        existingProfile.email?.toLowerCase()
      ) {
        const {
          data: duplicateProfile,
        } = await supabaseAdmin
          .from("alumni_profiles")
          .select("id")
          .ilike("email", newEmail)
          .neq("id", id)
          .maybeSingle();

        if (duplicateProfile) {
          return NextResponse.json(
            {
              error:
                "Another alumni profile already uses this email.",
            },
            { status: 409 }
          );
        }

        const {
          error: authUpdateError,
        } =
          await supabaseAdmin.auth.admin.updateUserById(
            id,
            {
              email: newEmail,
              email_confirm: true,
            }
          );

        if (authUpdateError) {
          return NextResponse.json(
            {
              error:
                "Authentication email could not be updated: " +
                authUpdateError.message,
            },
            { status: 400 }
          );
        }
      }
    }

    /* -------------------------
       Update profile
    ------------------------- */

    if (
      Object.keys(updatePayload).length > 0
    ) {
      const {
        error: profileError,
      } = await supabaseAdmin
        .from("alumni_profiles")
        .update(updatePayload)
        .eq("id", id);

      if (profileError) {
        return NextResponse.json(
          {
            error:
              profileError.message,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Alumni profile updated successfully.",
    });
  } catch (error) {
    console.error(
      "PATCH /api/admin/alumni error:",
      error
    );

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}

/* =========================================================
   DELETE — DELETE ALUMNI
========================================================= */

export async function DELETE(
  request: NextRequest
) {
  try {
    const admin = await verifyAdmin(request);

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { id } = body;

    if (!id) {
      return NextResponse.json(
        { error: "Alumni ID is required." },
        { status: 400 }
      );
    }

    /* -------------------------
       Never delete admin
    ------------------------- */

    if (id === admin.id) {
      return NextResponse.json(
        {
          error:
            "You cannot delete the administrator account.",
        },
        { status: 403 }
      );
    }

    /* -------------------------
       Get Auth user
    ------------------------- */

    const {
      data: targetUser,
      error: targetUserError,
    } =
      await supabaseAdmin.auth.admin.getUserById(
        id
      );

    if (
      targetUserError ||
      !targetUser?.user
    ) {
      return NextResponse.json(
        {
          error:
            "Alumni authentication account not found.",
        },
        { status: 404 }
      );
    }

    if (
      targetUser.user.email?.toLowerCase() ===
      ADMIN_EMAIL.toLowerCase()
    ) {
      return NextResponse.json(
        {
          error:
            "The administrator account cannot be deleted.",
        },
        { status: 403 }
      );
    }

    /* -------------------------
       Delete photo
    ------------------------- */

    await removeStoredPhoto(id);

    /* -------------------------
       Delete profile
    ------------------------- */

    const {
      error: profileDeleteError,
    } = await supabaseAdmin
      .from("alumni_profiles")
      .delete()
      .eq("id", id);

    if (profileDeleteError) {
      return NextResponse.json(
        {
          error:
            "Failed to delete alumni profile: " +
            profileDeleteError.message,
        },
        { status: 500 }
      );
    }

    /* -------------------------
       Delete Auth user
    ------------------------- */

    const {
      error: deleteError,
    } =
      await supabaseAdmin.auth.admin.deleteUser(
        id
      );

    if (deleteError) {
      return NextResponse.json(
        {
          error:
            "Profile was deleted, but authentication account could not be deleted: " +
            deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        "Alumni account deleted successfully.",
    });
  } catch (error) {
    console.error(
      "DELETE /api/admin/alumni error:",
      error
    );

    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 }
    );
  }
}
