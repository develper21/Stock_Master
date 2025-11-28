import { requireApiSession, assertInventoryManager } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";
export { dynamic } from "@/lib/api-runtime";

export async function GET() {
  try {
    await requireApiSession();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("warehouses")
      .select("id, name, code, address, created_at")
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

    if (!payload.name || !payload.code) {
      return jsonError("Name and code are required", 400);
    }

    const { data, error } = await supabase
      .from("warehouses")
      .insert({
        name: payload.name,
        code: payload.code,
        address: payload.address,
      })
      .select()
      .single();

    if (error) return jsonError(error.message, 400);

    return jsonSuccess({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
