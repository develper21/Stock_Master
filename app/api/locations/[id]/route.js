import { requireApiSession, assertInventoryManager } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";
export { dynamic } from "@/lib/api-runtime";

export async function GET(_req, { params }) {
  try {
    await requireApiSession();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("locations")
      .select("id, name, code, type, warehouse_id")
      .eq("id", params.id)
      .single();
    if (error) return jsonError(error.message, 404);
    return jsonSuccess({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(req, { params }) {
  try {
    const { supabase, profile } = await requireApiSession();
    assertInventoryManager(profile);
    const payload = await req.json();

    const { error } = await supabase
      .from("locations")
      .update({
        name: payload.name,
        code: payload.code,
        type: payload.type,
        warehouse_id: payload.warehouse_id,
      })
      .eq("id", params.id);

    if (error) return jsonError(error.message, 400);

    return jsonSuccess({ message: "Location updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { supabase, profile } = await requireApiSession();
    assertInventoryManager(profile);
    const { error } = await supabase.from("locations").delete().eq("id", params.id);
    if (error) return jsonError(error.message, 400);
    return jsonSuccess({ message: "Location deleted" });
  } catch (error) {
    return handleRouteError(error);
  }
}
