import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
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
    const category = searchParams.get("category");
    const sku = searchParams.get("sku");

    let query = supabase.from("products").select("id, name, sku, unit, reorder_level, product_categories(name)").order("created_at", { ascending: false });

    if (category) {
      query = query.eq("category_id", category);
    }

    if (sku) {
      query = query.ilike("sku", `%${sku}%`);
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
    const supabase = getSupabaseServiceClient();
    const payload = await req.json();

    // Validation
    if (!payload.name || !payload.sku || !payload.unit) {
      return jsonError("Name, SKU, and unit are required", 400);
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        name: payload.name,
        sku: payload.sku,
        description: payload.description,
        category_id: payload.category_id || null,
        unit: payload.unit,
        reorder_level: payload.reorder_level || 0,
        max_stock: payload.max_stock || null,
        cost_price: payload.cost_price || 0,
        selling_price: payload.selling_price || 0
      })
      .select()
      .single();

    if (error) {
      return jsonError(error.message, 400);
    }

    return jsonSuccess({ data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
