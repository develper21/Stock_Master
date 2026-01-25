import { requireAuth } from "@/lib/auth-server";
import { getSupabaseServiceClient } from "@/lib/supabase/service-client";
import { jsonSuccess, jsonError, handleRouteError } from "@/lib/api-helpers";
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead, 
  deleteNotification 
} from "@/lib/notification-service";
export { dynamic } from "@/lib/api-runtime";

export async function GET(req) {
  try {
    const user = await requireAuth();
    const supabase = getSupabaseServiceClient();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit")) || 20;
    const unreadOnly = searchParams.get("unread_only") === "true";

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;
    if (error) {
      return jsonError(error.message, 400);
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('read', false);

    return jsonSuccess({ 
      notifications: data || [],
      unreadCount: unreadCount || 0
    });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(req) {
  try {
    const user = await requireAuth();
    const { action, notificationId } = await req.json();

    switch (action) {
      case 'mark_read':
        const markReadResult = await markNotificationAsRead(notificationId);
        return jsonSuccess(markReadResult);
        
      case 'mark_all_read':
        const markAllReadResult = await markAllNotificationsAsRead(user.id);
        return jsonSuccess(markAllReadResult);
        
      case 'delete':
        const deleteResult = await deleteNotification(notificationId);
        return jsonSuccess(deleteResult);
        
      default:
        return jsonError('Invalid action', 400);
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
