import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

const ADMIN_EMAIL = "jobair2311091015@diu.edu.bd";

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
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 10);

  return `PCDIU-${randomPart}-29Kp`;
}

/* =========================
   CREATE ALUMNI ACCOUNT
========================= */

export async function POST(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
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
      profile_photo_url,
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
            createUserError?.message ||
            "Failed to create alumni account.",
        },
        { status: 400 }
      );
    }

    const userId = createdUser.user.id;

    const { error: profileError } = await supabaseAdmin
      .from("alumni_profiles")
      .insert({
        id: userId,
        full_name: full_name.trim(),
        email: email.trim(),
        batch,
        section,
        graduation_year:
          graduation_year || null,
        profile_photo_url:
          profile_photo_url || null,
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

    return NextResponse.json(
      {
        error: "Internal server error.",
      },
      { status: 500 }
    );
  }
}

/* =========================
   UPDATE ALUMNI PROFILE
========================= */

export async function PATCH(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
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
      profile_photo_url,
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

    const { error: profileError } =
      await supabaseAdmin
        .from("alumni_profiles")
        .update({
          full_name: full_name?.trim(),
          email: email?.trim(),
          batch,
          section,
          graduation_year:
            graduation_year || null,
          profile_photo_url:
            profile_photo_url || null,
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
        })
        .eq("id", id);

    if (profileError) {
      return NextResponse.json(
        {
          error: profileError.message,
        },
        { status: 400 }
      );
    }

    if (email?.trim()) {
      const { error: authUpdateError } =
        await supabaseAdmin.auth.admin.updateUserById(
          id,
          {
            email: email.trim(),
          }
        );

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

    return NextResponse.json(
      {
        error: "Internal server error.",
      },
      { status: 500 }
    );
  }
}

/* =========================
   DELETE ALUMNI ACCOUNT
========================= */

export async function DELETE(request: NextRequest) {
  try {
    const admin = await verifyAdmin(request);

    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
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

    if (id === admin.id) {
      return NextResponse.json(
        {
          error:
            "You cannot delete the administrator account.",
        },
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

    const { error: deleteError } =
      await supabaseAdmin.auth.admin.deleteUser(id);

    if (deleteError) {
      return NextResponse.json(
        {
          error: deleteError.message,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Alumni account deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE /api/admin/alumni error:", error);

    return NextResponse.json(
      {
        error: "Internal server error.",
      },
      { status: 500 }
    );
  }
}