import { requireApiSession, assertInventoryManager } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";

export async function GET(_req, { params }) {
  try {
    await requireApiSession();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("internal_transfers")
      .select("*, transfer_items(*, products(name, sku, unit))")
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
      .from("internal_transfers")
      .update({
        from_warehouse_id: payload.from_warehouse_id,
        to_warehouse_id: payload.to_warehouse_id,
        from_location_id: payload.from_location_id,
        to_location_id: payload.to_location_id,
        status: payload.status,
        notes: payload.notes,
      })
      .eq("id", params.id);

    if (error) return jsonError(error.message, 400);

    if (payload.items) {
      await supabase.from("transfer_items").delete().eq("transfer_id", params.id);
      const { error: itemsError } = await supabase
        .from("transfer_items")
        .insert(payload.items.map((item) => ({ ...item, transfer_id: params.id })));
      if (itemsError) return jsonError(itemsError.message, 400);
    }

    return jsonSuccess({ message: "Transfer updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
