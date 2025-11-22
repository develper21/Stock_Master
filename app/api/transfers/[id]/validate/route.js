import { requireApiSession, assertInventoryManager } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";

export async function POST(_req, { params }) {
  try {
    const { supabase, profile } = await requireApiSession();
    assertInventoryManager(profile);

    const { error } = await supabase.rpc("validate_transfer", { transfer_id: params.id });
    if (error) {
      return jsonError(error.message, 400);
    }

    return jsonSuccess({ message: "Transfer validated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
