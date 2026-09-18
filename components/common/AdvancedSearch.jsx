"use client";

import { useState, useEffect } from "react";

export default function AdvancedSearch({ onSearch, placeholder = "Search...", filters = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilters, setActiveFilters] = useState({});
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      onSearch({ searchTerm, filters: activeFilters });
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, activeFilters, onSearch]);

  const handleFilterChange = (filterKey, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterKey]: value
    }));
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setActiveFilters({});
    setShowAdvanced(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearch({ searchTerm, filters: activeFilters });
    }
  };

  return (
    <div className="bg-slate-900/50 rounded-2xl border border-white/5 p-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Search Input */}
        <div className="flex-1">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={placeholder}
              className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
            />
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400">
              🔍
            </div>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-300"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Advanced Search Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="px-4 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm whitespace-nowrap"
        >
          {showAdvanced ? 'Hide Filters' : 'Advanced Filters'}
          <span className="ml-2">{showAdvanced ? '▲' : '▼'}</span>
        </button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filters.map(filter => (
              <div key={filter.key} className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  {filter.label}
                </label>
                
                {filter.type === 'text' && (
                  <input
                    type="text"
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    placeholder={filter.placeholder}
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 focus:outline-none"
                  />
                )}
                
                {filter.type === 'select' && (
                  <select
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 focus:outline-none"
                  >
                    <option value="">{filter.placeholder}</option>
                    {filter.options?.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                )}
                
                {filter.type === 'date' && (
                  <input
                    type="date"
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 focus:outline-none"
                  />
                )}
                
                {filter.type === 'daterange' && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={activeFilters[`${filter.key}_start`] || ''}
                      onChange={(e) => handleFilterChange(`${filter.key}_start`, e.target.value)}
                      placeholder="Start Date"
                      className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 focus:outline-none"
                    />
                    <input
                      type="date"
                      value={activeFilters[`${filter.key}_end`] || ''}
                      onChange={(e) => handleFilterChange(`${filter.key}_end`, e.target.value)}
                      placeholder="End Date"
                      className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 focus:outline-none"
                    />
                  </div>
                )}
                
                {filter.type === 'number' && (
                  <input
                    type="number"
                    value={activeFilters[filter.key] || ''}
                    onChange={(e) => handleFilterChange(filter.key, e.target.value)}
                    placeholder={filter.placeholder}
                    min={filter.min}
                    max={filter.max}
                    className="w-full px-3 py-2 bg-slate-800 border border-white/10 rounded-lg text-white text-sm focus:border-emerald-400 focus:outline-none"
                  />
                )}
              </div>
            ))}
          </div>

          {/* Filter Actions */}
          <div className="flex gap-2 mt-4 pt-4 border-t border-white/10">
            <button
              onClick={() => {
                const defaultFilters = {};
                filters.forEach(filter => {
                  if (filter.defaultValue !== undefined) {
                    defaultFilters[filter.key] = filter.defaultValue;
                  }
                });
                setActiveFilters(defaultFilters);
              }}
              className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors text-sm"
            >
              Reset to Default
            </button>
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors text-sm"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {Object.keys(activeFilters).length > 0 && (
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex flex-wrap gap-2">
            <span className="text-xs text-slate-400">Active Filters:</span>
            {Object.entries(activeFilters).map(([key, value]) => {
              if (!value) return null;
              const filter = filters.find(f => f.key === key);
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-500/20 text-emerald-300 text-xs rounded-full"
                >
                  {filter.label}: {value}
                  <button
                    onClick={() => handleFilterChange(key, '')}
                    className="ml-1 text-emerald-400 hover:text-emerald-200"
                  >
                    ×
                  </button>
                </span>
              );
            }).filter(Boolean)}
          </div>
        </div>
      )}
    </div>
  );
}
