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
      .from("warehouses")
      .select("id, name, code, address, created_at")
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
      .from("warehouses")
      .update({ name: payload.name, code: payload.code, address: payload.address })
      .eq("id", id);

    if (error) return jsonError(error.message, 400);

    return jsonSuccess({ message: "Warehouse updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_req, { params }) {
  try {
    const { id } = (await params) || params;
    const { supabase, profile } = await requireApiSession();
    assertInventoryManager(profile);
    const { error } = await supabase.from("warehouses").delete().eq("id", id);
    if (error) return jsonError(error.message, 400);
    return jsonSuccess({ message: "Warehouse deleted" });
  } catch (error) {
    return handleRouteError(error);
  }
}
