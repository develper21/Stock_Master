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
    const active = searchParams.get("active");

    let query = supabase
      .from("product_categories")
      .select("id, name, description, is_active, created_at, updated_at")
      .order("name", { ascending: true });

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
    if (!payload.name || payload.name.trim().length < 2) {
      return jsonError("Category name is required (min 2 characters)", 400);
    }

    const { data, error } = await supabase
      .from("product_categories")
      .insert({
        name: payload.name.trim(),
        description: payload.description?.trim() || null,
        is_active: payload.is_active !== undefined ? payload.is_active : true
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return jsonError("Category with this name already exists", 409);
      }
      return jsonError(error.message, 400);
    }

    return jsonSuccess({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
