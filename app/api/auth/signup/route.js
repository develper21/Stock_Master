import { NextResponse } from "next/server";
import { PASSWORD_REGEX } from "@/lib/constants";
import { createUser } from "@/lib/auth-custom";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import { sendEmailVerification } from "@/lib/email-verification";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

const ROLES = ["inventory_manager", "warehouse_staff"];

export async function POST(req) {
  try {
    const {
      loginId,
      fullName,
      email,
      phone,
      password,
      confirmPassword,
      role = "warehouse_staff",
      defaultWarehouseId,
    } = await req.json();

    if (!loginId || !fullName || !email || !password || !confirmPassword) {
      return NextResponse.json(
        { error: "All required fields must be provided." },
        { status: 400 }
      );
    }

    if (!ROLES.includes(role)) {
      return NextResponse.json({ error: "Invalid role selected." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json({
        error:
          "Password does not meet complexity requirements (min 8 chars, lower, upper, digit, special character).",
      }, { status: 400 });
    }

    const serviceClient = getSupabaseServiceClient();

    // Check if login_id already exists
    const existingProfile = await serviceClient
      .from("profiles")
      .select("id")
      .eq("login_id", loginId)
      .maybeSingle();

    if (existingProfile.data) {
      return NextResponse.json({ error: "Login ID already taken." }, { status: 409 });
    }

    // Check if email already exists
    const existingEmail = await serviceClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail.data) {
      return NextResponse.json({ error: "Email already registered." }, { status: 409 });
    }

    // Create user with custom auth (email_verified = false by default)
    const user = await createUser({
      login_id: loginId,
      full_name: fullName,
      email,
      phone,
      password,
      role,
      default_warehouse_id: defaultWarehouseId
    });

    // Send verification email
    try {
      await sendEmailVerification(email);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // User created but email failed - still return success but note the issue
      return NextResponse.json(
        {
          message: "Account created successfully, but verification email could not be sent. Please contact support.",
          user: {
            id: user.id,
            login_id: user.login_id,
            full_name: user.full_name,
            email: user.email,
            role: user.role,
            email_verified: false
          },
          warning: "Verification email failed to send"
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        message: "Account created successfully! Please check your email to verify your account before logging in.",
        user: {
          id: user.id,
          login_id: user.login_id,
          full_name: user.full_name,
          email: user.email,
          role: user.role,
          email_verified: false
        }
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup failed", error);
    return NextResponse.json({ error: error.message || "Unexpected server error." }, { status: 500 });
  }
}
