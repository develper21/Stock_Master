"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Download, FileSpreadsheet, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function ReportsDashboard() {
  const [selectedReport, setSelectedReport] = useState("inventory");
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
  const [reportResult, setReportResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  const reportTypes = [
    { value: "inventory", label: "Inventory Report", description: "Current stock levels and values" },
    { value: "stock_movements", label: "Stock Movements", description: "All stock in/out movements" },
    { value: "sales", label: "Sales Report", description: "Delivery and sales data" },
    { value: "low_stock", label: "Low Stock Alert", description: "Items below reorder level" },
    { value: "receiving", label: "Receiving Report", description: "All receipts and incoming stock" },
    { value: "delivery", label: "Delivery Report", description: "All deliveries and outgoing stock" }
  ];

  useEffect(() => {
    fetchWarehouses();
    fetchCategories();
  }, []);

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

  const handleGenerateReport = async (overrideFormat) => {
    const formatToUse = overrideFormat || filters.format;
    if (!selectedReport) {
      setErrorMessage("Please select a report type");
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const activeFilters = { ...filters, format: formatToUse };
      const cleanParams = new URLSearchParams();
      cleanParams.set("type", selectedReport);
      cleanParams.set("format", formatToUse);
      if (activeFilters.startDate) cleanParams.set("startDate", activeFilters.startDate);
      if (activeFilters.endDate) cleanParams.set("endDate", activeFilters.endDate);
      if (activeFilters.warehouse) cleanParams.set("warehouse", activeFilters.warehouse);
      if (activeFilters.category) cleanParams.set("category", activeFilters.category);

      const response = await fetch(`/api/reports?${cleanParams.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate report");
      }

      if (formatToUse === "csv") {
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
        const json = await response.json();
        setReportResult({
          type: selectedReport,
          data: json.data || [],
          generatedAt: new Date().toLocaleTimeString(),
        });
      }
    } catch (error) {
      console.error("Error generating report:", error);
      setErrorMessage(error.message || "Failed to generate report. Please try again.");
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
    setReportResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
        <div className="mb-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 transition hover:border-emerald-400 hover:text-white"
          >
            <ArrowLeft size={14} />
            <span className="tracking-normal normal-case">Dashboard</span>
          </Link>
        </div>
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">STOKIQ</p>
          <h1 className="text-2xl font-semibold text-white mb-2">Reports Dashboard</h1>
          <p className="text-slate-400 text-sm">Generate, preview, and export inventory, movement, and fulfillment reports.</p>
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

      {/* Error Message */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-rose-300 text-sm">
          <AlertCircle size={18} className="shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Generate Button */}
      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white">Generate Report</h3>
            <p className="text-sm text-slate-400 mt-1">
              {selectedReport 
                ? `Ready to generate: ${reportTypes.find(r => r.value === selectedReport)?.label}`
                : "Select a report type to continue"
              }
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleGenerateReport("csv")}
              disabled={!selectedReport || loading}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-xl border border-white/15 bg-slate-800 text-slate-200 hover:text-white hover:border-emerald-400 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              type="button"
              onClick={() => handleGenerateReport()}
              disabled={!selectedReport || loading}
              className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-slate-950 font-semibold rounded-xl hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-950 border-t-transparent"></div>
                  Generating...
                </>
              ) : (
                <>
                  <FileSpreadsheet size={16} />
                  Generate Report
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Report Results Preview */}
      {reportResult && (
        <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">
                {reportTypes.find(r => r.value === reportResult.type)?.label || "Report"} Results
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Generated at {reportResult.generatedAt} · {reportResult.data?.length || 0} records found
              </p>
            </div>
            <button
              onClick={() => handleGenerateReport("csv")}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-xs text-slate-300 hover:text-white hover:border-emerald-400 transition"
            >
              <Download size={14} />
              Download CSV
            </button>
          </div>

          {(!reportResult.data || reportResult.data.length === 0) ? (
            <div className="py-12 text-center text-sm text-slate-400">
              No records found for the selected filters.
            </div>
          ) : (
            <div className="overflow-x-auto scroller">
              <table className="w-full text-left text-sm text-slate-200">
                <thead className="border-b border-white/10 bg-slate-800/40 text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    {Object.keys(reportResult.data[0] || {}).map((header) => (
                      <th key={header} className="px-4 py-3 font-semibold whitespace-nowrap">
                        {header.replace(/_/g, " ")}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {reportResult.data.slice(0, 50).map((row, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      {Object.keys(reportResult.data[0] || {}).map((header) => {
                        const cell = row[header];
                        let displayValue = "";
                        if (typeof cell === "object" && cell !== null) {
                          displayValue = cell.name || JSON.stringify(cell);
                        } else if (cell !== null && cell !== undefined) {
                          displayValue = String(cell);
                        } else {
                          displayValue = "—";
                        }
                        return (
                          <td key={header} className="px-4 py-3 text-xs whitespace-nowrap text-slate-300">
                            {displayValue}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
              {reportResult.data.length > 50 && (
                <p className="text-xs text-slate-500 text-center py-3">
                  Showing first 50 rows. Download full CSV to view all {reportResult.data.length} records.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
