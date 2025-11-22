import { requireApiSession, assertInventoryManager } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";

export async function GET() {
  try {
    await requireApiSession();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("locations")
      .select("id, name, code, type, warehouse_id")
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

    if (!payload.name || !payload.code || !payload.warehouse_id) {
      return jsonError("Name, code, and warehouse are required", 400);
    }

    const { data, error } = await supabase
      .from("locations")
      .insert({
        name: payload.name,
        code: payload.code,
        type: payload.type,
        warehouse_id: payload.warehouse_id,
      })
      .select()
      .single();

    if (error) return jsonError(error.message, 400);

    return jsonSuccess({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
