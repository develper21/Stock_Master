import { getSupabaseServiceClient } from '@/lib/supabase/service-client';
import { sendLowStockAlert } from './email-service';

export async function createNotification(userId, type, title, message, data = {}) {
  const supabase = getSupabaseServiceClient();
  
  try {
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      throw new Error(`Failed to create notification: ${error.message}`);
    }

    return data;
  } catch (error) {
    console.error('Notification creation failed:', error);
    throw error;
  }
}

export async function getUserNotifications(userId, limit = 20) {
  const supabase = getSupabaseServiceClient();
  
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return [];
  }
}

export async function markNotificationAsRead(notificationId) {
  const supabase = getSupabaseServiceClient();
  
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('id', notificationId);

    if (error) {
      throw new Error(`Failed to mark notification as read: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to mark notification as read:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId) {
  const supabase = getSupabaseServiceClient();
  
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ 
        read: true,
        read_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to mark all notifications as read:', error);
    throw error;
  }
}

export async function deleteNotification(notificationId) {
  const supabase = getSupabaseServiceClient();
  
  try {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId);

    if (error) {
      throw new Error(`Failed to delete notification: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to delete notification:', error);
    throw error;
  }
}

// Notification types
export const NOTIFICATION_TYPES = {
  STOCK_ALERT: 'stock_alert',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  DELIVERY_CREATED: 'delivery_created',
  RECEIPT_CREATED: 'receipt_created',
  TRANSFER_CREATED: 'transfer_created',
  ADJUSTMENT_CREATED: 'adjustment_created',
  SYSTEM_UPDATE: 'system_update',
  WELCOME: 'welcome',
  PASSWORD_CHANGED: 'password_changed'
};

// Create different types of notifications
export async function createStockAlertNotification(userId, lowStockItems) {
  const title = `Stock Alert: ${lowStockItems.length} items need attention`;
  const message = `${lowStockItems.length} products are below their reorder levels and need to be restocked.`;
  
  return createNotification(userId, NOTIFICATION_TYPES.STOCK_ALERT, title, message, {
    items: lowStockItems,
    severity: 'high'
  });
}

export async function createDeliveryNotification(userId, delivery) {
  const title = `New Delivery Created`;
  const message = `Delivery ${delivery.reference_no} has been created for ${delivery.customer_name}.`;
  
  return createNotification(userId, NOTIFICATION_TYPES.DELIVERY_CREATED, title, message, {
    deliveryId: delivery.id,
    referenceNo: delivery.reference_no,
    customerName: delivery.customer_name
  });
}

export async function createReceiptNotification(userId, receipt) {
  const title = `New Receipt Created`;
  const message = `Receipt ${receipt.reference_no} has been created from ${receipt.supplier_name}.`;
  
  return createNotification(userId, NOTIFICATION_TYPES.RECEIPT_CREATED, title, message, {
    receiptId: receipt.id,
    referenceNo: receipt.reference_no,
    supplierName: receipt.supplier_name
  });
}

export async function createTransferNotification(userId, transfer) {
  const title = `New Transfer Created`;
  const message = `Transfer ${transfer.reference_no} has been created from ${transfer.from_warehouse_id} to ${transfer.to_warehouse_id}.`;
  
  return createNotification(userId, NOTIFICATION_TYPES.TRANSFER_CREATED, title, message, {
    transferId: transfer.id,
    referenceNo: transfer.reference_no,
    fromWarehouse: transfer.from_warehouse_id,
    toWarehouse: transfer.to_warehouse_id
  });
}

export async function createAdjustmentNotification(userId, adjustment) {
  const title = `Stock Adjustment`;
  const message = `Stock adjustment has been recorded: ${adjustment.reason}`;
  
  return createNotification(userId, NOTIFICATION_TYPES.ADJUSTMENT_CREATED, title, message, {
    adjustmentId: adjustment.id,
    reason: adjustment.reason,
    difference: adjustment.difference
  });
}

export async function createWelcomeNotification(userId, userName) {
  const title = `Welcome to Stock Master!`;
  const message = `Hi ${userName}, welcome to the Stock Master inventory management system. We're excited to have you on board!`;
  
  return createNotification(userId, NOTIFICATION_TYPES.WELCOME, title, message, {
    userName
  });
}

export async function createPasswordChangedNotification(userId) {
  const title = `Password Changed`;
  const message = `Your password has been successfully changed. If you didn't make this change, please contact support immediately.`;
  
  return createNotification(userId, NOTIFICATION_TYPES.PASSWORD_CHANGED, title, message, {
    timestamp: new Date().toISOString()
  });
}

// Send email notifications for critical alerts
export async function sendEmailNotification(userId, notification) {
  try {
    // Get user details to send email
    const supabase = getSupabaseServiceClient();
    const { data: user } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', userId)
      .single();

    if (!user) {
      console.error('User not found for email notification');
      return;
    }

    // Send email based on notification type
    switch (notification.type) {
      case NOTIFICATION_TYPES.STOCK_ALERT:
        if (notification.data?.items?.length > 0) {
          await sendLowStockAlert(notification.data.items);
        }
        break;
      
      case NOTIFICATION_TYPES.DELIVERY_CREATED:
        // TODO: Implement delivery email notification
        console.log('Delivery notification email:', notification);
        break;
      
      case NOTIFICATION_TYPES.RECEIPT_CREATED:
        // TODO: Implement receipt email notification
        console.log('Receipt notification email:', notification);
        break;
      
      default:
        console.log('Notification type:', notification.type, 'Email not implemented');
    }
  } catch (error) {
    console.error('Failed to send email notification:', error);
  }
}
