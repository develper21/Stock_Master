import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/common/DataTable";
import { getSessionAndProfile } from "@/lib/auth";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Product Stock | StockMaster",
};

export default async function ProductStockPage({ params }) {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });
  const [{ data: product }, { data: stockLevels }] = await Promise.all([
    supabase.from("products").select("id, name, sku").eq("id", params.id).single(),
    supabase
      .from("stock_levels")
      .select("id, quantity, warehouses(name), locations(name)")
      .eq("product_id", params.id)
      .order("updated_at", { ascending: false }),
  ]);

  if (!product) {
    notFound();
  }

  const columns = [
    {
      label: "Warehouse",
      accessor: "warehouse",
      render: (row) => row.warehouses?.name || "—",
    },
    {
      label: "Location",
      accessor: "location",
      render: (row) => row.locations?.name || "—",
    },
    {
      label: "Quantity",
      accessor: "quantity",
      render: (row) => Number(row.quantity).toLocaleString(),
    },
  ];

  return (
    <div>
      <PageHeader
        title={`${product.name} · Stock by location`}
        description={`SKU ${product.sku} across all warehouses and racks.`}
      />
      <DataTable columns={columns} data={stockLevels || []} emptyState="No stock levels yet." />
    </div>
  );
}
