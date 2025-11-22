import { requireApiSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { session } = await requireApiSession();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, login_id, full_name, email, phone, role, default_warehouse_id")
      .eq("id", session.user.id)
      .single();

    if (error) return jsonError(error.message, 400);

    return jsonSuccess({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(req) {
  try {
    const { session } = await requireApiSession();
    const supabase = getSupabaseServerClient();
    const payload = await req.json();

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: payload.full_name,
        phone: payload.phone,
        default_warehouse_id: payload.default_warehouse_id || null,
      })
      .eq("id", session.user.id);

    if (error) return jsonError(error.message, 400);

    return jsonSuccess({ message: "Profile updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
