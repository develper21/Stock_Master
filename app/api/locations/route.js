import { NextResponse } from "next/server";
import { requireAuth, requireRole } from "@/lib/auth-server";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

export async function GET(req) {
  try {
    const user = await requireAuth();
    const supabase = getSupabaseServiceClient();
    const { searchParams } = new URL(req.url);
    const warehouse = searchParams.get("warehouse_id");
    const active = searchParams.get("active");

    let query = supabase
      .from("locations")
      .select("id, name, code, type, capacity, is_active, warehouses(name), created_at, updated_at")
      .order("warehouses(name), name", { ascending: true });

    if (warehouse) {
      query = query.eq("warehouse_id", warehouse);
    }

    if (active !== null) {
      query = query.eq("is_active", active === "true");
    }

    const { data, error } = await query;
    if (error) {
      return jsonError(error.message, 400);
    }

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

    // Validation
    if (!payload.name || !payload.warehouse_id) {
      return jsonError("Name and warehouse are required", 400);
    }

    if (payload.name.trim().length < 2) {
      return jsonError("Location name must be at least 2 characters", 400);
    }

    const { data, error } = await supabase
      .from("locations")
      .insert({
        name: payload.name.trim(),
        code: payload.code?.trim() || null,
        type: payload.type || 'storage',
        capacity: payload.capacity || null,
        warehouse_id: payload.warehouse_id,
        is_active: payload.is_active !== undefined ? payload.is_active : true
      })
      .select("*, warehouses(name)")
      .single();

    if (error) {
      if (error.code === '23505') {
        return jsonError("Location with this code already exists in this warehouse", 409);
      }
      return jsonError(error.message, 400);
    }

    return jsonSuccess({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
