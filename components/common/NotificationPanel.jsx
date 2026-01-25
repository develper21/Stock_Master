"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

export default function NotificationPanel() {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchNotifications();

        // Poll for new notifications every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);

        return () => clearInterval(interval);
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const response = await fetch("/api/notifications");
            const data = await response.json();

            if (data.notifications) {
                setNotifications(data.notifications);
                setUnreadCount(data.unreadCount || 0);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (notificationId) => {
        try {
            const response = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "mark_read", notificationId }),
            });

            if (response.ok) {
                setNotifications(prev =>
                    prev.map(notif =>
                        notif.id === notificationId ? { ...notif, read: true } : notif
                    )
                );
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const response = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "mark_all_read" }),
            });

            if (response.ok) {
                setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
                setUnreadCount(0);
            }
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    };

    const deleteNotification = async (notificationId) => {
        try {
            const response = await fetch("/api/notifications", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "delete", notificationId }),
            });

            if (response.ok) {
                setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
                setUnreadCount(prev => {
                    const deletedNotif = notifications.find(n => n.id === notificationId);
                    return deletedNotif && !deletedNotif.read ? prev - 1 : prev;
                });
            }
        } catch (error) {
            console.error("Error deleting notification:", error);
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'stock_alert':
                return '⚠️';
            case 'low_stock':
                return '📉';
            case 'out_of_stock':
                return '🚨';
            case 'delivery_created':
                return '📦';
            case 'receipt_created':
                return '📥';
            case 'transfer_created':
                return '🔄';
            case 'adjustment_created':
                return '⚙️';
            case 'system_update':
                return '🔔';
            case 'welcome':
                return '👋';
            case 'password_changed':
                return '🔐';
            default:
                return '📢';
        }
    };

    const getNotificationColor = (type, read) => {
        if (read) return 'border-slate-700 bg-slate-800/50';

        switch (type) {
            case 'stock_alert':
            case 'out_of_stock':
                return 'border-rose-500 bg-rose-500/10';
            case 'low_stock':
                return 'border-amber-500 bg-amber-500/10';
            case 'delivery_created':
            case 'receipt_created':
                return 'border-emerald-500 bg-emerald-500/10';
            case 'transfer_created':
                return 'border-blue-500 bg-blue-500/10';
            default:
                return 'border-slate-600 bg-slate-700/50';
        }
    };

    return (
        <div className="relative">
            {/* Notification Bell */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-400 hover:text-white transition-colors"
            >
                <span className="text-xl">🔔</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Dropdown */}
            {isOpen && (
                <div className="absolute right-0 top-12 w-80 bg-slate-900 border border-white/10 rounded-lg shadow-xl z-50 max-h-96 overflow-hidden">
                    <div className="p-4 border-b border-white/10">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-white">Notifications</h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs text-emerald-400 hover:text-emerald-300"
                                >
                                    Mark all as read
                                </button>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-xs text-slate-400 hover:text-slate-300"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="overflow-y-auto max-h-80">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-400"></div>
                                <p className="ml-3 text-sm text-slate-400">Loading...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-4xl mb-4">📭</div>
                                <p className="text-sm text-slate-400">No notifications</p>
                            </div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`p-4 border-b border-white/5 hover:bg-slate-800/50 transition-colors ${getNotificationColor(notification.type, notification.read)}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className="text-lg mt-1">
                                            {getNotificationIcon(notification.type)}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="font-medium text-white text-sm">
                                                    {notification.title}
                                                </p>
                                                <span className={`text-xs px-2 py-1 rounded ${notification.read
                                                        ? 'bg-slate-700 text-slate-300'
                                                        : 'bg-emerald-500 text-white'
                                                    }`}>
                                                    {notification.read ? 'Read' : 'Unread'}
                                                </span>
                                            </div>

                                            {!notification.read && (
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => markAsRead(notification.id)}
                                                        className="text-xs text-emerald-400 hover:text-emerald-300"
                                                    >
                                                        Mark as read
                                                    </button>
                                                    <button
                                                        onClick={() => deleteNotification(notification.id)}
                                                        className="text-xs text-rose-400 hover:text-rose-300"
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        <p className="text-sm text-slate-300 mt-2">
                                            {notification.message}
                                        </p>

                                    </div>

                                    <p className="text-sm text-slate-300 mt-2">
                                        {notification.message}
                                    </p>

                                    <p className="text-xs text-slate-500 mt-2">
                                        {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                    </p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
