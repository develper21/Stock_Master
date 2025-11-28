import { NextResponse } from "next/server";
import { PASSWORD_REGEX } from "@/lib/constants";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import { serverEnv } from "@/lib/env.server";
export { dynamic } from "@/lib/api-runtime";

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

    const existingProfile = await serviceClient
      .from("profiles")
      .select("id")
      .eq("login_id", loginId)
      .maybeSingle();

    if (existingProfile.data) {
      return NextResponse.json({ error: "Login ID already taken." }, { status: 409 });
    }

    const { data: signUpData, error: signUpError } = await serviceClient.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          login_id: loginId,
          role,
          phone,
        },
        emailRedirectTo: `${serverEnv.siteUrl}/auth/verify-otp?email=${encodeURIComponent(email)}`,
      },
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    const userId = signUpData.user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Signup failed to create user." }, { status: 400 });
    }

    const { error: profileError } = await serviceClient.from("profiles").insert({
      id: userId,
      login_id: loginId,
      full_name: fullName,
      email,
      phone,
      role,
    });

    if (profileError) {
      await serviceClient.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json(
      {
        message: "Signup successful. Please verify the OTP sent to your email before logging in.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Signup failed", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
