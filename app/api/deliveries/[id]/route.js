import { requireApiSession, assertInventoryManager } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";
export { dynamic } from "@/lib/api-runtime";

export async function GET(_req, { params }) {
  try {
    await requireApiSession();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("deliveries")
      .select("*, delivery_items(*, products(name, sku, unit))")
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
      .from("deliveries")
      .update({
        customer: payload.customer,
        status: payload.status,
        warehouse_id: payload.warehouse_id,
        notes: payload.notes,
      })
      .eq("id", params.id);

    if (error) return jsonError(error.message, 400);

    if (payload.items) {
      await supabase.from("delivery_items").delete().eq("delivery_id", params.id);
      const { error: itemsError } = await supabase
        .from("delivery_items")
        .insert(payload.items.map((item) => ({ ...item, delivery_id: params.id })));
      if (itemsError) return jsonError(itemsError.message, 400);
    }

    return jsonSuccess({ message: "Delivery updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
