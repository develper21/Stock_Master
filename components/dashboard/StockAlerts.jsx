"use client";

import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, AlertOctagon, RefreshCw, CheckCircle2 } from "lucide-react";

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
        await fetchAlerts();
      }
    } catch (error) {
      console.error("Error checking stock:", error);
    } finally {
      setCheckingStock(false);
    }
  };

  const handleAcknowledge = async (alertId) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const getAlertColor = (alert) => {
    const { current_quantity, reorder_level } = alert;
    if (current_quantity === 0) {
      return "border-rose-500 bg-rose-500/10 text-rose-400";
    }
    if (current_quantity <= (reorder_level || 0) * 0.5) {
      return "border-amber-500 bg-amber-500/10 text-amber-400";
    }
    return "border-blue-500 bg-blue-500/10 text-blue-400";
  };

  const getSeverityText = (alert) => {
    const { current_quantity, reorder_level } = alert;
    if (current_quantity === 0) {
      return "Out of Stock";
    }
    if (current_quantity <= (reorder_level || 0) * 0.5) {
      return "Critical";
    }
    return "Low Stock";
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
            <span className="bg-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
              {alerts.length}
            </span>
          )}
        </div>
        
        <button
          onClick={handleCheckStock}
          disabled={checkingStock}
          className="flex items-center gap-2 px-3 py-1.5 text-xs bg-emerald-500 text-slate-950 font-medium rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checkingStock ? "animate-spin" : ""}`} />
          <span>{checkingStock ? "Checking..." : "Check Stock"}</span>
        </button>
      </header>

      {alerts.length === 0 ? (
        <div className="text-center py-8">
          <div className="flex justify-center mb-3 text-emerald-400">
            <CheckCircle2 size={36} />
          </div>
          <p className="text-sm text-slate-400">
            No active stock alerts. All inventory levels are healthy.
          </p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border ${getAlertColor(alert)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-0.5">
                    {alert.current_quantity === 0 ? (
                      <AlertOctagon className="h-5 w-5 text-rose-400" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-amber-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-white">
                        {alert.products?.name}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                        alert.current_quantity === 0 
                          ? "bg-rose-500 text-white" 
                          : "bg-amber-500 text-slate-950"
                      }`}>
                        {getSeverityText(alert)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-300">
                      <span>SKU: {alert.products?.sku}</span>
                      <span>·</span>
                      <span>Qty: {alert.current_quantity}</span>
                      <span>·</span>
                      <span>Reorder: {alert.reorder_level}</span>
                    </div>
                    
                    <p className="text-xs text-slate-400 mt-1">
                      {alert.warehouses?.name} · {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </div>
                
                {alert.status === "active" && (
                  <button
                    onClick={() => handleAcknowledge(alert.id)}
                    className="text-xs px-2.5 py-1 bg-white/10 text-slate-300 rounded-xl hover:bg-white/20 transition"
                  >
                    Dismiss
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
              className="text-emerald-400 hover:text-emerald-300 transition"
            >
              Refresh
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
