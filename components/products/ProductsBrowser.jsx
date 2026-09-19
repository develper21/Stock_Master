"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import DataTable from "@/components/common/DataTable";
import { Search } from "lucide-react";

export default function ProductsBrowser({ products = [] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((p) => {
      if (p.product_categories?.name) {
        set.add(p.product_categories.name);
      }
    });
    return Array.from(set).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const nameMatch = !searchTerm || 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sku?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const categoryMatch = !selectedCategory || 
        item.product_categories?.name === selectedCategory;

      return nameMatch && categoryMatch;
    });
  }, [products, searchTerm, selectedCategory]);

  const columns = [
    { 
      label: "Name", 
      accessor: "name",
      render: (row) => (
        <div>
          <Link href={`/products/${row.id}/stock`} className="font-medium text-white hover:text-emerald-300">
            {row.name}
          </Link>
        </div>
      )
    },
    { label: "SKU", accessor: "sku" },
    { label: "Unit", accessor: "unit" },
    {
      label: "Category",
      accessor: "category",
      render: (row) => row.product_categories?.name || "—",
    },
    {
      label: "Reorder Level",
      accessor: "reorder_level",
      render: (row) => row.reorder_level ?? 0,
    },
    {
      label: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex gap-3 text-xs">
          <Link
            href={`/products/${row.id}/edit`}
            className="text-emerald-400 hover:text-emerald-300"
          >
            Edit
          </Link>
          <Link
            href={`/products/${row.id}/stock`}
            className="text-blue-400 hover:text-blue-300"
          >
            Stock
          </Link>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products by name or SKU..."
            className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 pl-10 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
          />
        </div>

        {categories.length > 0 && (
          <div className="w-full sm:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-400/60"
            >
              <option value="">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <DataTable
        columns={columns}
        data={filteredProducts}
        emptyState="No products found matching your criteria."
      />
    </div>
  );
}
