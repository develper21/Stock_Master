import { NextResponse } from "next/server";
import { PASSWORD_REGEX } from "@/lib/constants";
import { resetPassword } from "@/lib/password-reset";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

export async function POST(req) {
  try {
    const { token, password, confirmPassword } = await req.json();

    if (!token || !password || !confirmPassword) {
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

    await resetPassword(token, password);

    return NextResponse.json({ message: "Password reset successful. You can now login." });
  } catch (error) {
    console.error("Reset password failed", error);
    return NextResponse.json({ error: error.message || "Failed to reset password." }, { status: 400 });
  }
}
