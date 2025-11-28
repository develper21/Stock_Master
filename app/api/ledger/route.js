import { requireApiSession } from "@/lib/auth";
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
    const type = searchParams.get("operation_type");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    let query = supabase
      .from("stock_ledger")
      .select("*, products(name, sku), warehouses(name), locations(name)")
      .order("occurred_at", { ascending: false })
      .limit(200);

    if (product) query = query.eq("product_id", product);
    if (warehouse) query = query.eq("warehouse_id", warehouse);
    if (type) query = query.eq("operation_type", type);
    if (from) query = query.gte("occurred_at", from);
    if (to) query = query.lte("occurred_at", to);

    const { data, error } = await query;
    if (error) return jsonError(error.message, 400);

    return jsonSuccess({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}
