import { requireAuth } from "@/lib/auth-server";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";
export { dynamic } from "@/lib/api-runtime";

export async function GET(req) {
  try {
    const user = await requireAuth();
    const supabase = getSupabaseServiceClient();
    const { searchParams } = new URL(req.url);
    
    const reportType = searchParams.get("type");
    const startDate = searchParams.get("start_date");
    const endDate = searchParams.get("end_date");
    const warehouse = searchParams.get("warehouse_id");
    const category = searchParams.get("category_id");
    const format = searchParams.get("format") || "json";

    if (!reportType) {
      return jsonError("Report type is required", 400);
    }

    let data;
    let filename;

    switch (reportType) {
      case "inventory":
        data = await generateInventoryReport(supabase, { warehouse, category });
        filename = `inventory_report_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case "stock_movements":
        data = await generateStockMovementsReport(supabase, { startDate, endDate, warehouse });
        filename = `stock_movements_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case "sales":
        data = await generateSalesReport(supabase, { startDate, endDate, warehouse });
        filename = `sales_report_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case "low_stock":
        data = await generateLowStockReport(supabase, { warehouse });
        filename = `low_stock_alerts_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case "receiving":
        data = await generateReceivingReport(supabase, { startDate, endDate, warehouse });
        filename = `receiving_report_${new Date().toISOString().split('T')[0]}`;
        break;
        
      case "delivery":
        data = await generateDeliveryReport(supabase, { startDate, endDate, warehouse });
        filename = `delivery_report_${new Date().toISOString().split('T')[0]}`;
        break;
        
      default:
        return jsonError("Invalid report type", 400);
    }

    if (format === "csv") {
      // Convert to CSV and return as downloadable file
      const csv = convertToCSV(data);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`
        }
      });
    }

    return jsonSuccess({ data, filename });
  } catch (error) {
    return handleRouteError(error);
  }
}

async function generateInventoryReport(supabase, filters = {}) {
  let query = supabase
    .from('stock_levels')
    .select(`
      quantity,
      reserved_quantity,
      available_quantity,
      products!inner(name, sku, unit, cost_price, selling_price, product_categories(name)),
      warehouses(name),
      locations(name),
      updated_at
    `);

  if (filters.warehouse) {
    query = query.eq('warehouse_id', filters.warehouse);
  }

  if (filters.category) {
    query = query.eq('products.category_id', filters.category);
  }

  const { data, error } = await query;
  if (error) throw error;

  // Calculate inventory value
  return data.map(item => ({
    ...item,
    total_value: Number(item.available_quantity) * (item.products?.cost_price || 0),
    potential_revenue: Number(item.available_quantity) * (item.products?.selling_price || 0)
  }));
}

async function generateStockMovementsReport(supabase, filters = {}) {
  let query = supabase
    .from('stock_ledger')
    .select(`
      quantity,
      operation_type,
      notes,
      occurred_at,
      products!inner(name, sku, unit),
      warehouses(name),
      locations(name),
      created_by
    `)
    .order('occurred_at', { ascending: false })
    .limit(1000);

  if (filters.startDate) {
    query = query.gte('occurred_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('occurred_at', filters.endDate);
  }
  if (filters.warehouse) {
    query = query.eq('warehouse_id', filters.warehouse);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data;
}

async function generateSalesReport(supabase, filters = {}) {
  let query = supabase
    .from('deliveries')
    .select(`
      reference_no,
      customer_name,
      customer_email,
      customer_phone,
      status,
      total_amount,
      created_at,
      delivered_at,
      warehouses(name),
      delivery_items!inner(
        quantity,
        unit_price,
        total,
        products!inner(name, sku, unit)
      )
    `)
    .order('created_at', { ascending: false });

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  if (filters.warehouse) {
    query = query.eq('warehouse_id', filters.warehouse);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data;
}

async function generateLowStockReport(supabase, filters = {}) {
  const { data: stockLevels, error: stockError } = await supabase
    .from('stock_levels')
    .select(`
      quantity,
      products!inner(name, sku, reorder_level, unit),
      warehouses(name)
    `);

  if (stockError) throw stockError;

  const lowStockItems = stockLevels.filter(item => {
    const reorderLevel = item.products?.reorder_level || 0;
    return reorderLevel > 0 && Number(item.quantity) <= reorderLevel;
  });

  if (filters.warehouse) {
    return lowStockItems.filter(item => item.warehouse_id === filters.warehouse);
  }

  return lowStockItems;
}

async function generateReceivingReport(supabase, filters = {}) {
  let query = supabase
    .from('receipts')
    .select(`
      reference_no,
      supplier_name,
      supplier_email,
      status,
      total_amount,
      created_at,
      validated_at,
      warehouses(name),
      receipt_items!inner(
        quantity,
        unit_price,
        total,
        batch_number,
        expiry_date,
        products!inner(name, sku, unit)
      )
    `)
    .order('created_at', { ascending: false });

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  if (filters.warehouse) {
    query = query.eq('warehouse_id', filters.warehouse);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data;
}

async function generateDeliveryReport(supabase, filters = {}) {
  let query = supabase
    .from('deliveries')
    .select(`
      reference_no,
      customer_name,
      customer_email,
      customer_phone,
      status,
      total_amount,
      created_at,
      delivered_at,
      scheduled_for,
      warehouses(name),
      delivery_items!inner(
        quantity,
        unit_price,
        total,
        picked,
        packed,
        products!inner(name, sku, unit)
      )
    `)
    .order('created_at', { ascending: false });

  if (filters.startDate) {
    query = query.gte('created_at', filters.startDate);
  }
  if (filters.endDate) {
    query = query.lte('created_at', filters.endDate);
  }
  if (filters.warehouse) {
    query = query.eq('warehouse_id', filters.warehouse);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data;
}

function convertToCSV(data) {
  if (!data || data.length === 0) return 'No data available';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(',');
  
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Handle nested objects and arrays
      if (typeof value === 'object' && value !== null) {
        return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      }
      // Handle strings with commas
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}
