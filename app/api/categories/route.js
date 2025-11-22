import { requireApiSession, assertInventoryManager } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";

export async function GET() {
  try {
    await requireApiSession();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("product_categories")
      .select("id, name, description, created_at")
      .order("name", { ascending: true });

    if (error) return jsonError(error.message, 400);

    return jsonSuccess({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req) {
  try {
    const { supabase, profile } = await requireApiSession();
    assertInventoryManager(profile);
    const payload = await req.json();

    const { data, error } = await supabase
      .from("product_categories")
      .insert({ name: payload.name, description: payload.description })
      .select()
      .single();

    if (error) return jsonError(error.message, 400);

    return jsonSuccess({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
