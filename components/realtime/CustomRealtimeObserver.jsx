"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

export default function CustomRealtimeObserver() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let eventSource;
    let reconnectTimeout;

    const connect = () => {
      try {
        eventSource = new EventSource('/api/realtime');

        eventSource.onopen = () => {
          console.log('Real-time connection established');
          setIsConnected(true);
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'connected':
                console.log(data.message);
                break;

              case 'stock_update':
                router.refresh();
                pushToast({
                  title: "Stock Updated",
                  description: `Product ${data.data.new?.product_id || data.data.old?.product_id} has new balance.`,
                  variant: "success",
                });
                break;

              case 'ledger_update':
                router.refresh();
                pushToast({
                  title: "Ledger Event",
                  description: `${data.data.new?.operation_type || "stock change"} recorded`,
                  variant: "default",
                });
                break;

              case 'document_update':
                router.refresh();
                const documentType = data.table.replace('_', ' ');
                pushToast({
                  title: `${documentType.charAt(0).toUpperCase() + documentType.slice(1)} Updated`,
                  description: `Document ${data.data.new?.reference_no || data.data.old?.reference_no} has been updated.`,
                  variant: "info",
                });
                break;

              case 'custom_notification':
                pushToast({
                  title: data.data.title || "Notification",
                  description: data.data.message || "You have a new notification.",
                  variant: data.data.variant || "default",
                });
                break;

              default:
                console.log('Unknown message type:', data.type);
            }
          } catch (error) {
            console.error('Error parsing SSE message:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.error('SSE connection error:', error);
          setIsConnected(false);
          eventSource.close();

          // Attempt to reconnect after 5 seconds
          reconnectTimeout = setTimeout(connect, 5000);
        };

      } catch (error) {
        console.error('Failed to create SSE connection:', error);
        setIsConnected(false);
        
        // Retry after 5 seconds
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, [router, pushToast]);

  return null;
}
