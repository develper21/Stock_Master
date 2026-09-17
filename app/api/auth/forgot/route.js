import { NextResponse } from "next/server";
import { requestPasswordReset } from "@/lib/password-reset";
export { dynamic } from "@/lib/api-runtime";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const result = await requestPasswordReset(email);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Forgot password failed", error);
    return NextResponse.json({ error: error.message || "Failed to process password reset request." }, { status: 500 });
  }
}
