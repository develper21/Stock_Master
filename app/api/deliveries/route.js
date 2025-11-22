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
    const warehouse = searchParams.get("warehouse_id");

    let query = supabase
      .from("deliveries")
      .select("*, warehouses(name), delivery_items(*, products(name, sku, unit))")
      .order("created_at", { ascending: false });

    if (status) query = query.eq("status", status);
    if (warehouse) query = query.eq("warehouse_id", warehouse);

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

    const { data: delivery, error } = await supabase
      .from("deliveries")
      .insert({
        reference_no: payload.reference_no,
        customer: payload.customer,
        status: payload.status || "draft",
        warehouse_id: payload.warehouse_id,
        created_by: profile.id,
        notes: payload.notes,
      })
      .select()
      .single();

    if (error) return jsonError(error.message, 400);

    if (payload.items?.length) {
      const { error: itemsError } = await supabase
        .from("delivery_items")
        .insert(payload.items.map((item) => ({ ...item, delivery_id: delivery.id })));
      if (itemsError) return jsonError(itemsError.message, 400);
    }

    return jsonSuccess({ data: delivery }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
