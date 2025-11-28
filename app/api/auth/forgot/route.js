import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import { serverEnv } from "@/lib/env.server";
import { dynamic, revalidate, fetchCache } from "@/lib/api-runtime";

export async function POST(req) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const serviceClient = getSupabaseServiceClient();
    const { error } = await serviceClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${serverEnv.siteUrl}/auth/reset-password?email=${encodeURIComponent(email)}`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "OTP sent to your email." });
  } catch (error) {
    console.error("Forgot password failed", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
