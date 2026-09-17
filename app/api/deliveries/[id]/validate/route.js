import { requireApiSession, assertInventoryManager } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";
export { dynamic } from "@/lib/api-runtime";

export async function POST(_req, { params }) {
  try {
    const { supabase, profile } = await requireApiSession();
    assertInventoryManager(profile);

    const { error } = await supabase.rpc("validate_delivery", { delivery_id: params.id });
    if (error) {
      return jsonError(error.message, 400);
    }

    return jsonSuccess({ message: "Delivery validated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
