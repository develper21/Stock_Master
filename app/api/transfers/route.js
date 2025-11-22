import { requireApiSession, assertInventoryManager } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";
export { dynamic } from "@/lib/api-runtime";

export async function GET(req) {
  try {
    await requireApiSession();
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabase
      .from("internal_transfers")
      .select("*, transfer_items(*, products(name, sku, unit))")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);

    const { data, error } = await query;
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

    const { data: transfer, error } = await supabase
      .from("internal_transfers")
      .insert({
        reference_no: payload.reference_no,
        from_warehouse_id: payload.from_warehouse_id,
        to_warehouse_id: payload.to_warehouse_id,
        from_location_id: payload.from_location_id,
        to_location_id: payload.to_location_id,
        status: payload.status || "draft",
        created_by: profile.id,
        notes: payload.notes,
      })
      .select()
      .single();

    if (error) return jsonError(error.message, 400);

    if (payload.items?.length) {
      const { error: itemsError } = await supabase
        .from("transfer_items")
        .insert(payload.items.map((item) => ({ ...item, transfer_id: transfer.id })));
      if (itemsError) return jsonError(itemsError.message, 400);
    }

    return jsonSuccess({ data: transfer }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
