import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";

export async function POST() {
  try {
    const supabase = getSupabaseServerClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: "Logged out" }, { status: 200 });
  } catch (err) {
    console.error("Logout failed", err);
    return NextResponse.json({ error: "Unexpected server error." }, { status: 500 });
  }
}
