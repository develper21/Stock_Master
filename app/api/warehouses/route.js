import { requireAuth, requireRole } from "@/lib/auth-server";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

export async function GET() {
  try {
    const user = await requireAuth();
    const supabase = getSupabaseServiceClient();
    const { data, error } = await supabase
      .from("warehouses")
      .select("id, name, code, address, phone, email, is_active, created_at, updated_at")
      .order("name", { ascending: true });
    
    if (error) return jsonError(error.message, 400);
    return jsonSuccess({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req) {
  try {
    const user = await requireAuth();
    await requireRole(user, 'inventory_manager');
    const supabase = getSupabaseServiceClient();
    const payload = await req.json();

    if (!payload.name || !payload.code) {
      return jsonError("Name and code are required", 400);
    }

    if (payload.name.trim().length < 2 || payload.code.trim().length < 2) {
      return jsonError("Name and code must be at least 2 characters", 400);
    }

    const { data, error } = await supabase
      .from("warehouses")
      .insert({
        name: payload.name.trim(),
        code: payload.code.trim().toUpperCase(),
        address: payload.address?.trim() || null,
        phone: payload.phone?.trim() || null,
        email: payload.email?.trim() || null,
        is_active: payload.is_active !== undefined ? payload.is_active : true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return jsonError("Warehouse with this code already exists", 409);
      }
      return jsonError(error.message, 400);
    }

    return jsonSuccess({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
