import PageHeader from "@/components/layout/PageHeader";
import ProductForm from "@/components/products/ProductForm";
import { getSessionAndProfile } from "@/lib/auth";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Product | StockMaster",
};

export default async function EditProductPage({ params }) {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from("products").select("*").eq("id", params.id).single(),
    supabase.from("product_categories").select("id, name").order("name", { ascending: true }),
  ]);

  if (!product) {
    notFound();
  }

  return (
    <div>
      <PageHeader title={`Edit ${product.name}`} description="Update SKU details and thresholds." />
      <div className="rounded-3xl border border-white/5 bg-slate-900/40 p-8">
        <ProductForm categories={categories || []} product={product} />
      </div>
    </div>
  );
}
