import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

const ADMIN_EMAIL = "diupc@diu.edu.bd";

/* =========================================================
   SUPABASE ADMIN
========================================================= */

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase environment variables are missing."
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

/* =========================================================
   AUTHENTICATE ADMIN
========================================================= */

async function authenticateAdmin(
  request: NextRequest
) {
  const authorization =
    request.headers.get("authorization");

  if (
    !authorization ||
    !authorization.startsWith("Bearer ")
  ) {
    return {
      admin: null,
      error: "Authentication required.",
    };
  }

  const token =
    authorization
      .replace("Bearer ", "")
      .trim();

  if (!token) {
    return {
      admin: null,
      error: "Authentication required.",
    };
  }

  const supabaseAdmin =
    getSupabaseAdmin();

  const {
    data: { user },
    error,
  } =
    await supabaseAdmin.auth.getUser(
      token
    );

  if (error || !user) {
    return {
      admin: null,
      error:
        "Your session has expired. Please log in again.",
    };
  }

  if (
    user.email?.toLowerCase() !==
    ADMIN_EMAIL.toLowerCase()
  ) {
    return {
      admin: null,
      error:
        "Admin access required.",
    };
  }

  return {
    admin: user,
    error: null,
  };
}

/* =========================================================
   SELECT
========================================================= */

const studentSelect = `
  id,
  full_name,
  student_id,
  email,
  batch,
  section,
  blood_group,
  cr_status,
  graduation_date,
  profile_photo_url,
  linkedin_url,
  instagram_url,
  facebook_url,
  created_at,
  updated_at
`;

/* =========================================================
   GET STUDENTS
========================================================= */

export async function GET(
  request: NextRequest
) {
  try {
    const {
      admin,
      error: authError,
    } =
      await authenticateAdmin(
        request
      );

    if (!admin) {
      return NextResponse.json(
        {
          error: authError,
        },
        {
          status: 401,
        }
      );
    }

    const supabaseAdmin =
      getSupabaseAdmin();

    const {
      data,
      error,
    } =
      await supabaseAdmin
        .from("student_profiles")
        .select(studentSelect)
        .order("batch", {
          ascending: false,
        })
        .order("section", {
          ascending: true,
        })
        .order("full_name", {
          ascending: true,
        });

    if (error) {
      console.error(
        "Admin student fetch error:",
        error
      );

      return NextResponse.json(
        {
          error: error.message,
        },
        {
          status: 500,
        }
      );
    }

    return NextResponse.json({
      success: true,
      students: data || [],
    });
  } catch (error) {
    console.error(
      "GET /api/admin/students error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load students.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   UPDATE STUDENT
========================================================= */

export async function PUT(
  request: NextRequest
) {
  try {
    const {
      admin,
      error: authError,
    } =
      await authenticateAdmin(
        request
      );

    if (!admin) {
      return NextResponse.json(
        {
          error: authError,
        },
        {
          status: 401,
        }
      );
    }

    const body =
      (await request.json().catch(
        () => ({})
      )) as Record<
        string,
        unknown
      >;

    const id =
      typeof body.id === "string"
        ? body.id.trim()
        : "";

    if (!id) {
      return NextResponse.json(
        {
          error:
            "Student ID is required.",
        },
        {
          status: 400,
        }
      );
    }

    const fullName =
      typeof body.full_name ===
      "string"
        ? body.full_name.trim()
        : "";

    const studentId =
      typeof body.student_id ===
      "string"
        ? body.student_id.trim() ||
          null
        : null;

    const email =
      typeof body.email ===
      "string"
        ? body.email.trim().toLowerCase()
        : "";

    const batch =
      Number(body.batch);

    const section =
      typeof body.section ===
      "string"
        ? body.section
            .trim()
            .toUpperCase()
        : "";

    const bloodGroup =
      typeof body.blood_group ===
      "string"
        ? body.blood_group.trim() ||
          null
        : null;

    const crStatus =
      body.cr_status === "cr" ||
      body.cr_status === "co_cr" ||
      body.cr_status === "no"
        ? body.cr_status
        : "no";

    const graduationDate =
      typeof body.graduation_date ===
      "string"
        ? body.graduation_date.trim() ||
          null
        : null;

    const linkedinUrl =
      typeof body.linkedin_url ===
      "string"
        ? body.linkedin_url.trim() ||
          null
        : null;

    const facebookUrl =
      typeof body.facebook_url ===
      "string"
        ? body.facebook_url.trim() ||
          null
        : null;

    const instagramUrl =
      typeof body.instagram_url ===
      "string"
        ? body.instagram_url.trim() ||
          null
        : null;

    /* =====================================================
       VALIDATION
    ===================================================== */

    if (!fullName) {
      return NextResponse.json(
        {
          error:
            "Full name is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!email) {
      return NextResponse.json(
        {
          error:
            "Email is required.",
        },
        {
          status: 400,
        }
      );
    }

    if (!Number.isInteger(batch)) {
      return NextResponse.json(
        {
          error:
            "Invalid batch.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      !["A", "B"].includes(
        section
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Section must be A or B.",
        },
        {
          status: 400,
        }
      );
    }

    /* =====================================================
       CHECK STUDENT EXISTS
    ===================================================== */

    const {
      data: existingStudent,
      error: existingError,
    } =
      await supabaseAdmin
        .from("student_profiles")
        .select(
          "id, email"
        )
        .eq("id", id)
        .maybeSingle();

    if (existingError) {
      return NextResponse.json(
        {
          error:
            existingError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!existingStudent) {
      return NextResponse.json(
        {
          error:
            "Student profile not found.",
        },
        {
          status: 404,
        }
      );
    }

    /* =====================================================
       UPDATE DATABASE PROFILE
    ===================================================== */

    const {
      data: updatedStudent,
      error: updateError,
    } =
      await supabaseAdmin
        .from("student_profiles")
        .update({
          full_name:
            fullName,
          student_id:
            studentId,
          email,
          batch,
          section,
          blood_group:
            bloodGroup,
          cr_status:
            crStatus,
          graduation_date:
            graduationDate,
          linkedin_url:
            linkedinUrl,
          facebook_url:
            facebookUrl,
          instagram_url:
            instagramUrl,
        })
        .eq("id", id)
        .select(studentSelect)
        .single();

    if (updateError) {
      console.error(
        "Admin student update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    /* =====================================================
       UPDATE AUTH USER
    ===================================================== */

    const {
      data: authUser,
    } =
      await supabaseAdmin.auth.admin.getUserById(
        id
      );

    if (authUser?.user) {
      const {
        error: metadataError,
      } =
        await supabaseAdmin.auth.admin.updateUserById(
          id,
          {
            user_metadata: {
              ...authUser.user
                .user_metadata,
              account_type:
                "student",
              full_name:
                fullName,
              batch,
              section,
              cr_status:
                crStatus,
              graduation_date:
                graduationDate,
            },
          }
        );

      if (metadataError) {
        console.warn(
          "Admin auth metadata update warning:",
          metadataError
        );
      }

      /*
       * If admin changes email, update
       * Supabase Auth email as well.
       */
      if (
        authUser.user.email !==
        email
      ) {
        const {
          error: emailError,
        } =
          await supabaseAdmin.auth.admin.updateUserById(
            id,
            {
              email,
              email_confirm: true,
            }
          );

        if (emailError) {
          console.warn(
            "Admin auth email update warning:",
            emailError
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      message:
        "Student profile updated successfully.",
      student:
        updatedStudent,
    });
  } catch (error) {
    console.error(
      "PUT /api/admin/students error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update student.",
      },
      {
        status: 500,
      }
    );
  }
}
