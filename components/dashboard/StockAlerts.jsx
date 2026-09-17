"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";

export default function StockAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkingStock, setCheckingStock] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/stock-alerts?status=active");
      const data = await response.json();
      
      if (data.data) {
        setAlerts(data.data);
      }
    } catch (error) {
      console.error("Error fetching alerts:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStock = async () => {
    try {
      setCheckingStock(true);
      const response = await fetch("/api/stock-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "check" }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Refresh alerts after check
        await fetchAlerts();
      }
    } catch (error) {
      console.error("Error checking stock:", error);
    } finally {
      setCheckingStock(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    try {
      const response = await fetch("/api/stock-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "acknowledge", 
          alertId 
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        // Remove alert from list
        setAlerts(prev => prev.filter(alert => alert.id !== alertId));
      }
    } catch (error) {
      console.error("Error acknowledging alert:", error);
    }
  };

  const getAlertIcon = (alertType) => {
    switch (alertType) {
      case 'low_stock':
        return '⚠️';
      case 'out_of_stock':
        return '🚨';
      case 'overstock':
        return '📈';
      default:
        return '📊';
    }
  };

  const getAlertColor = (alert) => {
    const { current_quantity, reorder_level } = alert;
    
    if (current_quantity === 0) {
      return 'border-rose-500 bg-rose-500/10 text-rose-400';
    }
    if (current_quantity <= reorder_level * 0.5) {
      return 'border-amber-500 bg-amber-500/10 text-amber-400';
    }
    return 'border-blue-500 bg-blue-500/10 text-blue-400';
  };

  const getSeverityText = (alert) => {
    const { current_quantity, reorder_level } = alert;
    
    if (current_quantity === 0) {
      return 'Out of Stock';
    }
    if (current_quantity <= reorder_level * 0.5) {
      return 'Critical';
    }
    return 'Low Stock';
  };

  if (loading) {
    return (
      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-400"></div>
          <p className="ml-3 text-sm text-slate-400">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
      <header className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Stock Alerts</p>
          {alerts.length > 0 && (
            <span className="bg-rose-500 text-white text-xs px-2 py-1 rounded-full">
              {alerts.length}
            </span>
          )}
        </div>
        
        <button
          onClick={handleCheckStock}
          disabled={checkingStock}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {checkingStock ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b border-white"></div>
              Checking...
            </>
          ) : (
            <>
              🔄 Check Stock
            </>
          )}
        </button>
      </header>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">✅</div>
          <p className="text-sm text-slate-400">
            No active stock alerts. All items are at healthy levels.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-lg border ${getAlertColor(alert)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="text-lg">
                    {getAlertIcon(alert.alert_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white">
                        {alert.products?.name}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        alert.current_quantity === 0 
                          ? 'bg-rose-500 text-white' 
                          : 'bg-amber-500 text-white'
                      }`}>
                        {getSeverityText(alert)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-slate-300">
                      <span>SKU: {alert.products?.sku}</span>
                      <span>•</span>
                      <span>Current: {alert.current_quantity}</span>
                      <span>•</span>
                      <span>Reorder at: {alert.reorder_level}</span>
                    </div>
                    
                    <p className="text-xs text-slate-400 mt-1">
                      {alert.warehouses?.name} • {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                {alert.status === 'active' && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="text-xs px-2 py-1 bg-slate-700 text-slate-300 rounded hover:bg-slate-600 transition-colors"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {alerts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>{alerts.length} active alerts</span>
            <button
              onClick={fetchAlerts}
              className="text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
