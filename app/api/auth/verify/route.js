import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";

export async function POST(req) {
  try {
    const { email, token } = await req.json();

    if (!email || !token) {
      return NextResponse.json({ error: "Email and OTP are required." }, { status: 400 });
    }

    const serviceClient = getSupabaseServiceClient();
    const { data, error } = await serviceClient.auth.verifyOtp({
      email,
      token,
      type: "signup",
    });

    if (error || !data?.user) {
      return NextResponse.json({ error: error?.message || "Invalid OTP." }, { status: 400 });
    }

    return NextResponse.json({ message: "Verification successful. You can login now." });
  } catch (error) {
    console.error("Verify OTP failed", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
