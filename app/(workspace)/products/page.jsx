import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import ProductsBrowser from "@/components/products/ProductsBrowser";
import { getSessionAndProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Products | StockMaster",
};

export default async function ProductsPage() {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: products = [] } = await supabase
    .from("products")
    .select("id, name, sku, unit, reorder_level, product_categories(id, name)")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog and inventory levels."
        actions={
          <Link
            href="/products/create"
            className="rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:from-emerald-300 hover:to-emerald-400"
          >
            + Add Product
          </Link>
        }
      />
      <ProductsBrowser products={products || []} />
    </div>
  );
}
