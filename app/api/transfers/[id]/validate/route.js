import { requireApiSession, assertInventoryManager } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

export async function POST(_req, { params }) {
  try {
    const { id } = (await params) || params;
    const { supabase, profile } = await requireApiSession();
    assertInventoryManager(profile);

    const { error } = await supabase.rpc("validate_transfer", { transfer_id: id });
    if (error) {
      return jsonError(error.message, 400);
    }

    return jsonSuccess({ message: "Transfer validated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
