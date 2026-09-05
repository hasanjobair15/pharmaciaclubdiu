import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase environment variables are missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/* =========================================================
   DHAKA DATE
   ========================================================= */

function getDhakaToday(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Unable to determine Dhaka date.");
  }

  return `${year}-${month}-${day}`;
}

/* =========================================================
   GRADUATION DATE
   ========================================================= */

function cleanGraduationDate(value: unknown): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  const raw = String(value).trim();

  if (!raw) {
    return null;
  }

  let year: number;
  let month: number;

  const monthMatch = raw.match(/^(\d{4})-(\d{2})$/);
  const dateMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (monthMatch) {
    year = Number(monthMatch[1]);
    month = Number(monthMatch[2]);
  } else if (dateMatch) {
    year = Number(dateMatch[1]);
    month = Number(dateMatch[2]);
  } else {
    throw new Error("Invalid graduation month and year.");
  }

  if (!Number.isInteger(year) || !Number.isInteger(month)) {
    throw new Error("Invalid graduation month and year.");
  }

  if (year < 1900 || year > 2200) {
    throw new Error("Invalid graduation year.");
  }

  if (month < 1 || month > 12) {
    throw new Error("Invalid graduation month.");
  }

  return `${year}-${String(month).padStart(2, "0")}-01`;
}

/* =========================================================
   AUTHENTICATED USER
   ========================================================= */

async function getAuthenticatedUser(request: NextRequest) {
  const authorization = request.headers.get("authorization");

  if (!authorization || !authorization.startsWith("Bearer ")) {
    return {
      user: null,
      error: "Authentication required.",
    };
  }

  const token = authorization.replace("Bearer ", "").trim();

  if (!token) {
    return {
      user: null,
      error: "Authentication required.",
    };
  }

  const supabaseAdmin = getSupabaseAdmin();

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    console.error("Student profile authentication error:", error);

    return {
      user: null,
      error: "Your session has expired. Please log in again.",
    };
  }

  return {
    user,
    error: null,
  };
}

/* =========================================================
   STUDENT PROFILE SELECT
   ========================================================= */

const studentProfileSelect = `
  id,
  full_name,
  student_id,
  email,
  batch,
  section,
  blood_group,
  graduation_date,
  profile_photo_url,
  linkedin_url,
  instagram_url,
  facebook_url,
  created_at,
  updated_at
`;

/* =========================================================
   ALUMNI PROFILE SELECT
   ========================================================= */

const alumniProfileSelect = `
  id,
  full_name,
  email,
  batch,
  section,
  graduation_year,
  graduation_date,
  profile_photo_url,
  current_position,
  organization,
  bio,
  phone,
  linkedin_url,
  facebook_url,
  instagram_url,
  is_public,
  created_at,
  updated_at
`;

/* =========================================================
   GET
   ========================================================= */

export async function GET(request: NextRequest) {
  try {
    const { user, error: authError } =
      await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error: authError,
        },
        {
          status: 401,
        }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    /* -------------------------------------------------------
       STEP 1
       Check Alumni profile first.

       This is important because an account can now have
       the same Auth ID while being an Alumni.
    ------------------------------------------------------- */

    const {
      data: alumniProfile,
      error: alumniError,
    } = await supabaseAdmin
      .from("alumni_profiles")
      .select(alumniProfileSelect)
      .eq("id", user.id)
      .maybeSingle();

    if (alumniError) {
      console.error(
        "Alumni profile lookup error:",
        alumniError
      );

      return NextResponse.json(
        {
          error: alumniError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (alumniProfile) {
      return NextResponse.json({
        account_type: "alumni",
        redirect_to: "/alumni/profile",
        profile: alumniProfile,
      });
    }

    /* -------------------------------------------------------
       STEP 2
       Check Student profile.
    ------------------------------------------------------- */

    const {
      data: studentProfile,
      error: studentError,
    } = await supabaseAdmin
      .from("student_profiles")
      .select(studentProfileSelect)
      .eq("id", user.id)
      .maybeSingle();

    if (studentError) {
      console.error(
        "Student profile lookup error:",
        studentError
      );

      return NextResponse.json(
        {
          error: studentError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!studentProfile) {
      return NextResponse.json(
        {
          error:
            "No student or alumni profile was found for this account.",
        },
        {
          status: 404,
        }
      );
    }

    /* -------------------------------------------------------
       STEP 3
       Determine whether graduation has started.

       Graduation date is the first day of the graduation
       month.

       Example:
       2026-09-01

       On September 1 in Dhaka, the student becomes Alumni.
    ------------------------------------------------------- */

    const today = getDhakaToday();

    const graduationDate = studentProfile.graduation_date
      ? cleanGraduationDate(studentProfile.graduation_date)
      : null;

    /* -------------------------------------------------------
       STILL A RUNNING STUDENT
    ------------------------------------------------------- */

    if (!graduationDate || graduationDate > today) {
      await supabaseAdmin.auth.admin.updateUserById(user.id, {
        user_metadata: {
          ...user.user_metadata,
          account_type: "student",
          graduation_date: graduationDate,
          full_name: studentProfile.full_name,
          batch: studentProfile.batch,
          section: studentProfile.section,
        },
      });

      return NextResponse.json({
        account_type: "student",
        redirect_to: "/students/profile",
        profile: {
          ...studentProfile,
          graduation_date: graduationDate,
        },
      });
    }

    /* -------------------------------------------------------
       GRADUATION HAS STARTED

       Automatically convert Student -> Alumni.

       IMPORTANT:
       Same Auth user ID is retained.

       We only copy shared identity/profile fields.
       Alumni professional fields start empty.
    ------------------------------------------------------- */

    const graduationYear = Number(
      graduationDate.slice(0, 4)
    );

    const alumniPayload = {
      id: user.id,
      full_name: studentProfile.full_name,
      email: studentProfile.email || user.email || "",
      batch: studentProfile.batch,
      section: studentProfile.section,
      graduation_year: graduationYear,
      graduation_date: graduationDate,
      profile_photo_url:
        studentProfile.profile_photo_url || null,
      linkedin_url:
        studentProfile.linkedin_url || null,
      facebook_url:
        studentProfile.facebook_url || null,
      instagram_url:
        studentProfile.instagram_url || null,
      current_position: null,
      organization: null,
      bio: null,
      phone: null,
      is_public: true,
    };

    const {
      data: createdAlumni,
      error: alumniCreateError,
    } = await supabaseAdmin
      .from("alumni_profiles")
      .upsert(alumniPayload, {
        onConflict: "id",
      })
      .select(alumniProfileSelect)
      .single();

    if (alumniCreateError) {
      console.error(
        "Automatic Student -> Alumni conversion error:",
        alumniCreateError
      );

      /* -----------------------------------------------------
         A concurrent request may already have converted the
         account. Check Alumni one more time before failing.
      ----------------------------------------------------- */

      const {
        data: existingAlumni,
        error: existingAlumniError,
      } = await supabaseAdmin
        .from("alumni_profiles")
        .select(alumniProfileSelect)
        .eq("id", user.id)
        .maybeSingle();

      if (!existingAlumniError && existingAlumni) {
        await supabaseAdmin.auth.admin.updateUserById(
          user.id,
          {
            user_metadata: {
              ...user.user_metadata,
              account_type: "alumni",
              graduation_date: graduationDate,
              graduation_year: graduationYear,
              full_name: existingAlumni.full_name,
              batch: existingAlumni.batch,
              section: existingAlumni.section,
            },
          }
        );

        return NextResponse.json({
          account_type: "alumni",
          redirect_to: "/alumni/profile",
          profile: existingAlumni,
        });
      }

      return NextResponse.json(
        {
          error:
            "Your graduation has started, but your Alumni profile could not be created. Please try again.",
        },
        {
          status: 500,
        }
      );
    }

    /* -------------------------------------------------------
       Update Auth metadata
    ------------------------------------------------------- */

    const {
      error: metadataError,
    } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          account_type: "alumni",
          graduation_date: graduationDate,
          graduation_year: graduationYear,
          full_name: studentProfile.full_name,
          batch: studentProfile.batch,
          section: studentProfile.section,
        },
      }
    );

    if (metadataError) {
      console.warn(
        "Alumni Auth metadata update warning:",
        metadataError
      );
    }

    return NextResponse.json({
      account_type: "alumni",
      redirect_to: "/alumni/profile",
      profile: createdAlumni,
    });
  } catch (error) {
    console.error(
      "GET /api/students/profile error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load profile.",
      },
      {
        status: 500,
      }
    );
  }
}

/* =========================================================
   PUT
   ========================================================= */

export async function PUT(request: NextRequest) {
  try {
    const { user, error: authError } =
      await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          error: authError,
        },
        {
          status: 401,
        }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    /* -------------------------------------------------------
       IMPORTANT

       If this Auth account is already Alumni, do not allow
       the Student API to overwrite the Alumni record.

       The Alumni profile page/API handles Alumni editing.
    ------------------------------------------------------- */

    const {
      data: existingAlumni,
      error: alumniLookupError,
    } = await supabaseAdmin
      .from("alumni_profiles")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (alumniLookupError) {
      console.error(
        "Alumni lookup during student PUT:",
        alumniLookupError
      );

      return NextResponse.json(
        {
          error: alumniLookupError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (existingAlumni) {
      return NextResponse.json(
        {
          error:
            "This account is currently an Alumni account. Please use the Alumni profile.",
          account_type: "alumni",
          redirect_to: "/alumni/profile",
        },
        {
          status: 409,
        }
      );
    }

    const body =
      (await request.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;

    const fullName =
      typeof body.full_name === "string"
        ? body.full_name.trim()
        : "";

    const studentId =
      typeof body.student_id === "string"
        ? body.student_id.trim() || null
        : null;

    const batchValue = body.batch;

    const section =
      typeof body.section === "string"
        ? body.section.trim().toUpperCase()
        : "";

    const bloodGroup =
      typeof body.blood_group === "string"
        ? body.blood_group.trim() || null
        : null;

    const linkedinUrl =
      typeof body.linkedin_url === "string"
        ? body.linkedin_url.trim() || null
        : null;

    const instagramUrl =
      typeof body.instagram_url === "string"
        ? body.instagram_url.trim() || null
        : null;

    const facebookUrl =
      typeof body.facebook_url === "string"
        ? body.facebook_url.trim() || null
        : null;

    /* -------------------------------------------------------
       Graduation date

       Empty = NULL = Running Student.
    ------------------------------------------------------- */

    let graduationDate: string | null;

    try {
      graduationDate = cleanGraduationDate(
        body.graduation_date
      );
    } catch (error) {
      return NextResponse.json(
        {
          error:
            error instanceof Error
              ? error.message
              : "Invalid graduation date.",
        },
        {
          status: 400,
        }
      );
    }

    if (!fullName) {
      return NextResponse.json(
        {
          error: "Full name is required.",
        },
        {
          status: 400,
        }
      );
    }

    const numericBatch = Number(batchValue);

    if (!Number.isInteger(numericBatch)) {
      return NextResponse.json(
        {
          error: "Invalid batch.",
        },
        {
          status: 400,
        }
      );
    }

    if (!["A", "B"].includes(section)) {
      return NextResponse.json(
        {
          error: "Section must be A or B.",
        },
        {
          status: 400,
        }
      );
    }

    /* -------------------------------------------------------
       If graduation date is already active, immediately
       convert Student -> Alumni instead of saving it as a
       Running Student.
    ------------------------------------------------------- */

    const today = getDhakaToday();

    if (graduationDate && graduationDate <= today) {
      const graduationYear = Number(
        graduationDate.slice(0, 4)
      );

      const {
        data: currentStudent,
      } = await supabaseAdmin
        .from("student_profiles")
        .select(studentProfileSelect)
        .eq("id", user.id)
        .maybeSingle();

      const alumniPayload = {
        id: user.id,
        full_name: fullName,
        email:
          currentStudent?.email ||
          user.email ||
          "",
        batch: numericBatch,
        section,
        graduation_year: graduationYear,
        graduation_date: graduationDate,
        profile_photo_url:
          currentStudent?.profile_photo_url || null,
        linkedin_url: linkedinUrl,
        facebook_url: facebookUrl,
        instagram_url: instagramUrl,
        current_position: null,
        organization: null,
        bio: null,
        phone: null,
        is_public: true,
      };

      const {
        data: convertedAlumni,
        error: conversionError,
      } = await supabaseAdmin
        .from("alumni_profiles")
        .upsert(alumniPayload, {
          onConflict: "id",
        })
        .select(alumniProfileSelect)
        .single();

      if (conversionError) {
        console.error(
          "Student -> Alumni PUT conversion error:",
          conversionError
        );

        return NextResponse.json(
          {
            error:
              "Your graduation date has started, but your Alumni profile could not be created.",
          },
          {
            status: 500,
          }
        );
      }

      await supabaseAdmin.auth.admin.updateUserById(
        user.id,
        {
          user_metadata: {
            ...user.user_metadata,
            account_type: "alumni",
            graduation_date: graduationDate,
            graduation_year: graduationYear,
            full_name: fullName,
            batch: numericBatch,
            section,
          },
        }
      );

      return NextResponse.json({
        success: true,
        account_type: "alumni",
        redirect_to: "/alumni/profile",
        profile: convertedAlumni,
      });
    }

    /* -------------------------------------------------------
       Normal Running Student update
    ------------------------------------------------------- */

    const {
      data: updatedProfile,
      error: updateError,
    } = await supabaseAdmin
      .from("student_profiles")
      .update({
        full_name: fullName,
        student_id: studentId,
        batch: numericBatch,
        section,
        blood_group: bloodGroup,
        graduation_date: graduationDate,
        linkedin_url: linkedinUrl,
        instagram_url: instagramUrl,
        facebook_url: facebookUrl,
      })
      .eq("id", user.id)
      .select(studentProfileSelect)
      .single();

    if (updateError) {
      console.error(
        "Student profile update error:",
        updateError
      );

      return NextResponse.json(
        {
          error:
            updateError.message ||
            "Unable to update student profile.",
        },
        {
          status: 500,
        }
      );
    }

    /* -------------------------------------------------------
       Keep Auth metadata synchronized
    ------------------------------------------------------- */

    const {
      error: metadataError,
    } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      {
        user_metadata: {
          ...user.user_metadata,
          account_type: "student",
          full_name: fullName,
          batch: numericBatch,
          section,
          graduation_date: graduationDate,
        },
      }
    );

    if (metadataError) {
      console.warn(
        "Student Auth metadata update warning:",
        metadataError
      );
    }

    return NextResponse.json({
      success: true,
      account_type: "student",
      redirect_to: "/students/profile",
      profile: updatedProfile,
    });
  } catch (error) {
    console.error(
      "PUT /api/students/profile error:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to update student profile.",
      },
      {
        status: 500,
      }
    );
  }
}
