"use client";

import { useState } from "react";
import { format } from "date-fns";

export default function ReportsDashboard() {
  const [selectedReport, setSelectedReport] = useState("");
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    warehouse: "",
    category: "",
    format: "json"
  });
  const [loading, setLoading] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);

  const reportTypes = [
    { value: "inventory", label: "Inventory Report", description: "Current stock levels and values" },
    { value: "stock_movements", label: "Stock Movements", description: "All stock in/out movements" },
    { value: "sales", label: "Sales Report", description: "Delivery and sales data" },
    { value: "low_stock", label: "Low Stock Alert", description: "Items below reorder level" },
    { value: "receiving", label: "Receiving Report", description: "All receipts and incoming stock" },
    { value: "delivery", label: "Delivery Report", description: "All deliveries and outgoing stock" }
  ];

  useState(() => {
    // Load warehouses and categories
    fetchWarehouses();
    fetchCategories();
  });

  const fetchWarehouses = async () => {
    try {
      const response = await fetch("/api/warehouses");
      const data = await response.json();
      if (data.data) {
        setWarehouses(data.data);
      }
    } catch (error) {
      console.error("Error fetching warehouses:", error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch("/api/categories");
      const data = await response.json();
      if (data.data) {
        setCategories(data.data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleGenerateReport = async () => {
    if (!selectedReport) {
      alert("Please select a report type");
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        type: selectedReport,
        ...filters
      });

      const response = await fetch(`/api/reports?${params}`);
      
      if (filters.format === "csv") {
        // Download CSV file
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedReport}_report_${format(new Date(), 'yyyy-MM-dd')}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } else {
        // Show JSON data
        const data = await response.json();
        console.log("Report data:", data);
        alert("Report generated! Check console for data.");
      }
    } catch (error) {
      console.error("Error generating report:", error);
      alert("Failed to generate report. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      startDate: "",
      endDate: "",
      warehouse: "",
      category: "",
      format: "json"
    });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
        <header>
          <h1 className="text-2xl font-semibold text-white mb-2">Reports Dashboard</h1>
          <p className="text-slate-400">Generate and export various inventory reports</p>
        </header>
      </div>

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-3">
        {/* Report Selection */}
        <div className="xl:col-span-2 rounded-3xl border border-white/5 bg-slate-900/50 p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Select Report Type</h2>
          
          <div className="grid gap-3 sm:grid-cols-1 lg:grid-cols-2">
            {reportTypes.map(report => (
              <label
                key={report.value}
                className={`
                  relative p-4 border rounded-lg cursor-pointer transition-all
                  ${selectedReport === report.value 
                    ? 'border-emerald-500 bg-emerald-500/10' 
                    : 'border-white/10 bg-slate-800/50 hover:border-white/20'
                  }
                `}
              >
                <input
                  type="radio"
                  name="reportType"
                  value={report.value}
                  checked={selectedReport === report.value}
                  onChange={(e) => setSelectedReport(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-start gap-3">
                  <div className={`
                    w-4 h-4 rounded-full border-2 flex items-center justify-center mt-0.5
                    ${selectedReport === report.value 
                      ? 'border-emerald-400 bg-emerald-400' 
                      : 'border-slate-400'
                    }
                  `}>
                    {selectedReport === report.value && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white text-sm">{report.label}</p>
                    <p className="text-xs text-slate-400 mt-1">{report.description}</p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-4 lg:p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Date Range</label>
              <div className="grid gap-2 sm:grid-cols-1 lg:grid-cols-2">
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 focus:outline-none"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 focus:outline-none"
                  placeholder="End Date"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Warehouse</label>
              <select
                value={filters.warehouse}
                onChange={(e) => handleFilterChange('warehouse', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 focus:outline-none"
              >
                <option value="">All Warehouses</option>
                {warehouses.map(warehouse => (
                  <option key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Format</label>
              <select
                value={filters.format}
                onChange={(e) => handleFilterChange('format', e.target.value)}
                className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 focus:outline-none"
              >
                <option value="json">JSON</option>
                <option value="csv">CSV (Download)</option>
              </select>
            </div>

            <button
              onClick={clearFilters}
              className="w-full px-3 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Generate Button */}
      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Generate Report</h3>
            <p className="text-sm text-slate-400 mt-1">
              {selectedReport 
                ? `Ready to generate: ${reportTypes.find(r => r.value === selectedReport)?.label}`
                : "Select a report type to continue"
              }
            </p>
          </div>
          
          <button
            onClick={handleGenerateReport}
            disabled={!selectedReport || loading}
            className="px-6 py-3 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                📊 Generate Report
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
