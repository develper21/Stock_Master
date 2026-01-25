import { requireAuth, requireRole } from "@/lib/auth-server";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";
import { runStockAlertCheck, getActiveAlerts, acknowledgeAlert, resolveAlert } from "@/lib/stock-alerts";
export { dynamic } from "@/lib/api-runtime";

export async function GET(req) {
  try {
    const user = await requireAuth();
    const supabase = getSupabaseServiceClient();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = supabase
      .from('stock_alerts')
      .select(`
        *,
        products(name, sku),
        warehouses(name)
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (status) {
      query = query.eq('status', status);
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
    const { action, alertId, resolution } = await req.json();

    switch (action) {
      case 'check':
        // Only inventory managers can run stock checks
        await requireRole(user, 'inventory_manager');
        const result = await runStockAlertCheck();
        return jsonSuccess(result);

      case 'acknowledge':
        const ackResult = await acknowledgeAlert(alertId);
        return jsonSuccess(ackResult);

      case 'resolve':
        const resolveResult = await resolveAlert(alertId, resolution);
        return jsonSuccess(resolveResult);

      default:
        return jsonError('Invalid action', 400);
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
