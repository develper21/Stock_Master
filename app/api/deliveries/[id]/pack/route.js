import { requireApiSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

export async function POST(req, { params }) {
  try {
    const { id } = (await params) || params;
    const { supabase } = await requireApiSession();
    const { itemId, packed } = await req.json();

    if (!itemId) {
      return jsonError("itemId is required", 400);
    }

    const { error } = await supabase
      .from("delivery_items")
      .update({ packed })
      .eq("id", itemId)
      .eq("delivery_id", id);

    if (error) return jsonError(error.message, 400);

    return jsonSuccess({ message: "Item updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
