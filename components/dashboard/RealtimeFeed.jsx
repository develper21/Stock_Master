"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

export default function RealtimeFeed() {
  const [operations, setOperations] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let eventSource;
    let retryTimeout;

    const connectToFeed = () => {
      try {
        eventSource = new EventSource("/api/realtime");
        
        eventSource.onopen = () => {
          console.log("Real-time feed connected");
          setIsConnected(true);
          setOperations(prev => prev.slice(0, 20)); // Keep last 20 items
        };

        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            if (data.type === 'stock_update' || data.type === 'document_update') {
              setOperations(prev => {
                const newOperation = {
                  id: data.id || Date.now(),
                  type: data.operation_type || data.type,
                  description: getOperationDescription(data),
                  timestamp: data.created_at || new Date().toISOString(),
                  user: data.user_name || 'System',
                  icon: getOperationIcon(data),
                  color: getOperationColor(data)
                };

                // Add new operation and keep only last 20
                const updated = [newOperation, ...prev].slice(0, 20);
                return updated;
              });
            }
          } catch (error) {
            console.error("Error parsing real-time data:", error);
          }
        };

        eventSource.onerror = (error) => {
          console.error("Real-time feed error:", error);
          setIsConnected(false);
          
          // Retry connection after 5 seconds
          retryTimeout = setTimeout(connectToFeed, 5000);
        };

      } catch (error) {
        console.error("Failed to connect to real-time feed:", error);
        setIsConnected(false);
        retryTimeout = setTimeout(connectToFeed, 5000);
      }
    };

    connectToFeed();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (retryTimeout) {
        clearTimeout(retryTimeout);
      }
    };
  }, []);

  const getOperationDescription = (data) => {
    const { operation_type, product_name, quantity, warehouse_name, reference_type } = data;
    
    switch (operation_type) {
      case 'receipt':
        return `Received ${quantity} units of ${product_name} at ${warehouse_name}`;
      case 'delivery':
        return `Delivered ${quantity} units of ${product_name} from ${warehouse_name}`;
      case 'transfer':
        return `Transferred ${quantity} units of ${product_name} to ${warehouse_name}`;
      case 'adjustment':
        return `Adjusted ${product_name} stock by ${Math.abs(quantity)} units`;
      default:
        return `Updated ${product_name || 'inventory'} at ${warehouse_name || 'warehouse'}`;
    }
  };

  const getOperationIcon = (data) => {
    const { operation_type } = data;
    
    switch (operation_type) {
      case 'receipt':
        return '📦';
      case 'delivery':
        return '🚚';
      case 'transfer':
        return '🔄';
      case 'adjustment':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const getOperationColor = (data) => {
    const { operation_type } = data;
    
    switch (operation_type) {
      case 'receipt':
        return 'text-emerald-400';
      case 'delivery':
        return 'text-blue-400';
      case 'transfer':
        return 'text-amber-400';
      case 'adjustment':
        return 'text-purple-400';
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Live Feed</p>
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`} />
        </div>
        <p className="text-xs text-slate-500">
          {isConnected ? 'Connected' : 'Reconnecting...'}
        </p>
      </div>

      <div className="space-y-2 max-h-96 overflow-y-auto">
        {operations.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-slate-500">
              {isConnected ? 'Waiting for operations...' : 'Connecting to real-time feed...'}
            </p>
          </div>
        ) : (
          operations.map((operation) => (
            <div
              key={operation.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-white/5 bg-slate-900/30 hover:bg-slate-900/50 transition-colors"
            >
              <div className={`text-lg ${operation.color}`}>
                {operation.icon}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium">
                  {operation.description}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-xs text-slate-400">
                    by {operation.user}
                  </p>
                  <span className="text-slate-600">•</span>
                  <p className="text-xs text-slate-400">
                    {formatDistanceToNow(new Date(operation.timestamp), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {operations.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => setOperations([])}
            className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
          >
            Clear Feed
          </button>
        </div>
      )}
    </div>
  );
}
