import { NextResponse } from "next/server";
import { PASSWORD_REGEX } from "@/lib/constants";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
export { dynamic } from "@/lib/api-runtime";

export async function POST(req) {
  try {
    const { email, token, password, confirmPassword } = await req.json();

    if (!email || !token || !password || !confirmPassword) {
      return NextResponse.json({ error: "All fields are required." }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return NextResponse.json({
        error: "Password does not meet complexity requirements (min 8 chars, lower, upper, digit, special character).",
      }, { status: 400 });
    }

    const serviceClient = getSupabaseServiceClient();

    const { data, error: verifyError } = await serviceClient.auth.verifyOtp({
      email,
      token,
      type: "recovery",
    });

    if (verifyError || !data?.user?.id) {
      return NextResponse.json({ error: verifyError?.message || "Invalid OTP." }, { status: 400 });
    }

    const userId = data.user.id;
    const { error: updateError } = await serviceClient.auth.admin.updateUserById(userId, {
      password,
      email_confirm: true,
    });

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Password reset successful. You can now login." });
  } catch (error) {
    console.error("Reset password failed", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
