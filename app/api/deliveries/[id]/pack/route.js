import { requireApiSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";
export { dynamic } from "@/lib/api-runtime";

export async function POST(req, { params }) {
  try {
    const { supabase } = await requireApiSession();
    const { itemId, packed } = await req.json();

    if (!itemId) {
      return jsonError("itemId is required", 400);
    }

    const { error } = await supabase
      .from("delivery_items")
      .update({ packed })
      .eq("id", itemId)
      .eq("delivery_id", params.id);

    if (error) return jsonError(error.message, 400);

    return jsonSuccess({ message: "Item updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
