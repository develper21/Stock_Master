import { requireApiSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, handleRouteError } from "@/lib/api-helpers";
export { dynamic } from "@/lib/api-runtime";

export async function GET(_req, { params }) {
  try {
    await requireApiSession();
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, product_categories(id, name)")
      .eq("id", params.id)
      .single();
    if (error) {
      return handleRouteError(error);
    }
    return jsonSuccess({ data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PUT(req, { params }) {
  try {
    await requireApiSession();
    const supabase = getSupabaseServerClient();
    const body = await req.json();

    const { error } = await supabase
      .from("products")
      .update({
        name: body.name,
        sku: body.sku,
        category_id: body.category_id,
        unit: body.unit,
        reorder_level: body.reorder_level ?? 0,
      })
      .eq("id", params.id);

    if (error) {
      return handleRouteError(error);
    }

    return jsonSuccess({ message: "Product updated" });
  } catch (error) {
    return handleRouteError(error);
  }
}
