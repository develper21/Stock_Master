import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import { sendLowStockAlert } from './email-service';

export async function checkLowStockLevels() {
  const supabase = getSupabaseServiceClient();
  
  try {
    // Get all products with their stock levels and reorder levels
    const { data: stockLevels, error: stockError } = await supabase
      .from('stock_levels')
      .select(`
        quantity,
        products!inner(
          id, 
          name, 
          sku, 
          reorder_level,
          warehouses(name)
        )
      `);

    if (stockError) {
      console.error('Error fetching stock levels:', stockError);
      return [];
    }

    // Filter for low stock items
    const lowStockItems = stockLevels.filter(item => {
      const reorderLevel = item.products?.reorder_level || 0;
      return reorderLevel > 0 && Number(item.quantity) <= reorderLevel;
    });

    // Group by warehouse for better reporting
    const alertsByWarehouse = lowStockItems.reduce((acc, item) => {
      const warehouseName = item.products?.warehouses?.name || 'Unknown';
      if (!acc[warehouseName]) {
        acc[warehouseName] = [];
      }
      acc[warehouseName].push({
        product_id: item.products?.id,
        product_name: item.products?.name,
        product_sku: item.products?.sku,
        current_quantity: Number(item.quantity),
        reorder_level: item.products?.reorder_level,
        warehouse_name: warehouseName
      });
      return acc;
    }, {});

    return Object.values(alertsByWarehouse).flat();
  } catch (error) {
    console.error('Error checking stock levels:', error);
    return [];
  }
}

export async function generateStockAlerts() {
  const lowStockItems = await checkLowStockLevels();
  
  if (lowStockItems.length === 0) {
    return { alerts: [], message: 'No low stock items found' };
  }

  // Create alert records
  const supabase = getSupabaseServiceClient();
  const alertRecords = lowStockItems.map(item => ({
    product_id: item.product_id,
    warehouse_id: item.warehouse_id,
    alert_type: 'low_stock',
    current_quantity: item.current_quantity,
    reorder_level: item.reorder_level,
    message: `Low stock alert: ${item.product_name} (${item.product_sku}) - Current: ${item.current_quantity}, Reorder at: ${item.reorder_level}`,
    status: 'active',
    created_at: new Date().toISOString()
  }));

  try {
    // Insert alert records
    const { error: insertError } = await supabase
      .from('stock_alerts')
      .insert(alertRecords)
      .select();

    if (insertError) {
      console.error('Error creating stock alerts:', insertError);
    }

    // Send email notifications for critical items
    const criticalItems = lowStockItems.filter(item => 
      item.current_quantity === 0 || item.current_quantity <= item.reorder_level * 0.5
    );

    if (criticalItems.length > 0) {
      await sendLowStockAlert(criticalItems);
    }

    return {
      alerts: lowStockItems,
      message: `Generated ${lowStockItems.length} stock alerts (${criticalItems.length} critical)`
    };
  } catch (error) {
    console.error('Error generating stock alerts:', error);
    return { alerts: [], message: 'Failed to generate alerts' };
  }
}

export async function getActiveAlerts() {
  const supabase = getSupabaseServiceClient();
  
  try {
    const { data, error } = await supabase
      .from('stock_alerts')
      .select(`
        *,
        products(name, sku),
        warehouses(name)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error fetching alerts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting active alerts:', error);
    return [];
  }
}

export async function acknowledgeAlert(alertId) {
  const supabase = getSupabaseServiceClient();
  
  try {
    const { error } = await supabase
      .from('stock_alerts')
      .update({ 
        status: 'acknowledged',
        acknowledged_at: new Date().toISOString()
      })
      .eq('id', alertId);

    if (error) {
      throw new Error(`Failed to acknowledge alert: ${error.message}`);
    }

    return { success: true, message: 'Alert acknowledged successfully' };
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    throw error;
  }
}

export async function resolveAlert(alertId, resolution) {
  const supabase = getSupabaseServiceClient();
  
  try {
    const { error } = await supabase
      .from('stock_alerts')
      .update({ 
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution_notes: resolution
      })
      .eq('id', alertId);

    if (error) {
      throw new Error(`Failed to resolve alert: ${error.message}`);
    }

    return { success: true, message: 'Alert resolved successfully' };
  } catch (error) {
    console.error('Error resolving alert:', error);
    throw error;
  }
}

// Function to be called by cron job or scheduled task
export async function runStockAlertCheck() {
  console.log('Running stock alert check...');
  
  try {
    const result = await generateStockAlerts();
    console.log(`Stock alert check completed: ${result.message}`);
    
    // Clean up old resolved alerts (older than 30 days)
    await cleanupOldAlerts();
    
    return result;
  } catch (error) {
    console.error('Stock alert check failed:', error);
    return { alerts: [], message: 'Alert check failed' };
  }
}

async function cleanupOldAlerts() {
  const supabase = getSupabaseServiceClient();
  
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { error } = await supabase
      .from('stock_alerts')
      .delete()
      .eq('status', 'resolved')
      .lt('resolved_at', thirtyDaysAgo);

    if (error) {
      console.error('Error cleaning up old alerts:', error);
    } else {
      console.log('Cleaned up old resolved alerts');
    }
  } catch (error) {
    console.error('Error in cleanup:', error);
  }
}
