import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/common/DataTable";
import AdvancedSearch from "@/components/common/AdvancedSearch";
import { getSessionAndProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: products } = await supabase
    .from("products")
    .select("id, name, sku, unit, reorder_level, product_categories(name)")
    .order("created_at", { ascending: false });

  const columns = [
    { label: "Name", accessor: "name" },
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
    },
    {
      label: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="flex gap-2">
          <a
            href={`/products/${row.id}/edit`}
            className="text-emerald-400 hover:text-emerald-300 text-xs"
          >
            Edit
          </a>
          <a
            href={`/products/${row.id}/stock`}
            className="text-blue-400 hover:text-blue-300 text-xs"
          >
            Stock
          </a>
        </div>
      ),
    },
  ];

  const searchFilters = [
    {
      key: 'category',
      label: 'Category',
      type: 'select',
      options: [], // Will be populated dynamically
      placeholder: 'All Categories'
    },
    {
      key: 'min_stock',
      label: 'Min Stock Level',
      type: 'number',
      placeholder: 'Minimum stock',
      min: 0
    },
    {
      key: 'max_stock',
      label: 'Max Stock Level',
      type: 'number',
      placeholder: 'Maximum stock',
      min: 0
    },
    {
      key: 'reorder_level',
      label: 'Reorder Level',
      type: 'number',
      placeholder: 'Reorder level',
      min: 0
    },
    {
      key: 'created_after',
      label: 'Created After',
      type: 'date',
      placeholder: 'From date'
    },
    {
      key: 'created_before',
      label: 'Created Before',
      type: 'date',
      placeholder: 'To date'
    }
  ];

  const handleSearch = async ({ searchTerm, filters }) => {
    let query = supabase
      .from("products")
      .select("id, name, sku, unit, reorder_level, product_categories(name)")
      .order("created_at", { ascending: false });

    // Apply search term
    if (searchTerm) {
      query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
    }

    // Apply filters
    if (filters.category) {
      query = query.eq('category_id', filters.category);
    }
    if (filters.min_stock) {
      query = query.gte('reorder_level', filters.min_stock);
    }
    if (filters.max_stock) {
      query = query.lte('reorder_level', filters.max_stock);
    }
    if (filters.reorder_level) {
      query = query.eq('reorder_level', filters.reorder_level);
    }
    if (filters.created_after) {
      query = query.gte('created_at', filters.created_after);
    }
    if (filters.created_before) {
      query = query.lte('created_at', filters.created_before);
    }

    const { data, error } = await query;
    if (error) {
      console.error('Search error:', error);
      return;
    }

    // Update the page with filtered results
    // In a real app, you'd update state or trigger a re-render
    console.log('Search results:', data);
  };

  return (
    <div>
      <PageHeader
        title="Products"
        description="Manage your product catalog and inventory levels."
        actions={
          <a
            href="/products/create"
            className="rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            + Add Product
          </a>
        }
      />
      
      <div className="space-y-6">
        <AdvancedSearch
          onSearch={handleSearch}
          placeholder="Search products by name or SKU..."
          filters={searchFilters}
        />
        
        <DataTable
          columns={columns}
          data={products}
          emptyState="No products found matching your criteria."
        />
      </div>
      <DataTable columns={columns} data={products || []} emptyState="No products yet." />
    </div>
  );
}
