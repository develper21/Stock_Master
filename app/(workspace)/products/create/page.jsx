import PageHeader from "@/components/layout/PageHeader";
import ProductForm from "@/components/products/ProductForm";
import { getSessionAndProfile } from "@/lib/auth";

export const metadata = {
  title: "Create Product | StockMaster",
};

export default async function CreateProductPage() {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: categories } = await supabase
    .from("product_categories")
    .select("id, name")
    .order("name", { ascending: true });

  return (
    <div>
      <PageHeader
        title="Add new product"
        description="Define SKU, units, and replenishment targets for a managed product."
      />
      <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-8">
        <ProductForm categories={categories || []} />
      </div>
    </div>
  );
}
