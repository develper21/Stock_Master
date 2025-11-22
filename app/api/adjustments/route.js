import { requireApiSession, assertInventoryManager } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";
export { dynamic } from "@/lib/api-runtime";

export async function GET(req) {
  try {
    await requireApiSession();
    const supabase = getSupabaseServerClient();
    const { searchParams } = new URL(req.url);
    const product = searchParams.get("product_id");
    const warehouse = searchParams.get("warehouse_id");

    let query = supabase
      .from("adjustments")
      .select("*, products(name, sku), warehouses(name)")
      .order("created_at", { ascending: false });

    if (product) query = query.eq("product_id", product);
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

    const { data: adjustment, error } = await supabase
      .from("adjustments")
      .insert({
        product_id: payload.product_id,
        warehouse_id: payload.warehouse_id,
        location_id: payload.location_id,
        counted_quantity: payload.counted_quantity,
        system_quantity: payload.system_quantity,
        difference: payload.difference,
        reason: payload.reason,
        created_by: profile.id,
      })
      .select()
      .single();

    if (error) return jsonError(error.message, 400);

    await supabase.rpc("commit_adjustment", { adjustment_id: adjustment.id });

    return jsonSuccess({ data: adjustment }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
