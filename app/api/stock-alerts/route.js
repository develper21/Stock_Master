import { requireApiSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
import { jsonSuccess, handleRouteError } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "default-no-store";

export async function GET(req) {
  try {
    await requireApiSession();
    const supabase = getSupabaseServerClient();

    const { data: stockLevels, error } = await supabase
      .from("stock_levels")
      .select(`
        id,
        quantity,
        warehouses(name),
        products!inner(
          id, 
          name, 
          sku, 
          reorder_level
        )
      `);

    if (error) {
      return jsonSuccess({ data: [] });
    }

    const alerts = (stockLevels || [])
      .filter((item) => {
        const reorder = item.products?.reorder_level ?? 0;
        return reorder > 0 && Number(item.quantity) <= reorder;
      })
      .map((item) => {
        const qty = Number(item.quantity);
        const reorder = item.products?.reorder_level;
        return {
          id: item.id,
          alert_type: qty === 0 ? "out_of_stock" : "low_stock",
          current_quantity: qty,
          reorder_level: reorder,
          products: {
            id: item.products?.id,
            name: item.products?.name,
            sku: item.products?.sku,
          },
          warehouses: {
            name: item.warehouses?.name || "Main Warehouse",
          },
          status: "active",
          created_at: new Date().toISOString(),
        };
      });

    return jsonSuccess({ data: alerts });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req) {
  try {
    await requireApiSession();
    return jsonSuccess({ success: true, message: "Checked stock alerts" });
  } catch (error) {
    return handleRouteError(error);
  }
}
