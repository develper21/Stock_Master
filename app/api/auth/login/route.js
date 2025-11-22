import { NextResponse } from "next/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

export async function POST(req) {
  try {
    const { loginId, password } = await req.json();

    if (!loginId || !password) {
      return NextResponse.json({ error: "Login ID and password are required." }, { status: 400 });
    }

    const serviceClient = getSupabaseServiceClient();
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("email")
      .eq("login_id", loginId)
      .maybeSingle();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (!profile) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (signInError) {
      return NextResponse.json({ error: "Invalid credentials." }, { status: 401 });
    }

    return NextResponse.json({
      message: "Login successful.",
      user: data.user,
    });
  } catch (error) {
    console.error("Login failed", error);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
