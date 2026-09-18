import { requireApiSession, assertInventoryManager } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

export async function GET(_req, { params }) {
  try {
    const { id } = (await params) || params;
    await requireApiSession();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("receipts")
      .select("*, receipt_items(*, products(name, sku, unit))")
      .eq("id", id)
      .single();
    if (error) return jsonError(error.message, 404);
    return jsonSuccess({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = (await params) || params;
    const { supabase, profile } = await requireApiSession();
    assertInventoryManager(profile);
    const payload = await req.json();

    const { error } = await supabase
      .from("receipts")
      .update({
        supplier_name: payload.supplier_name,
        status: payload.status,
        warehouse_id: payload.warehouse_id,
        notes: payload.notes,
        responsible_id: payload.responsible_id || null,
        scheduled_for: payload.scheduled_for || null,
      })
      .eq("id", id);

    if (error) return jsonError(error.message, 400);

    if (payload.items) {
      await supabase.from("receipt_items").delete().eq("receipt_id", id);
      const { error: itemsError } = await supabase
        .from("receipt_items")
        .insert(payload.items.map((item) => ({ ...item, receipt_id: id })));
      if (itemsError) return jsonError(itemsError.message, 400);
    }

    return jsonSuccess({ message: "Receipt updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
