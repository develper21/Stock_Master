import PageHeader from "@/components/layout/PageHeader";
import CategoryForm from "@/components/products/CategoryForm";
import { getSessionAndProfile } from "@/lib/auth";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Category | StockMaster",
};

export default async function EditCategoryPage({ params }) {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: category } = await supabase
    .from("product_categories")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!category) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title={`Edit ${category.name}`}
        description="Keep category naming consistent for analytics."
      />
      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
        <CategoryForm category={category} />
      </div>
    </div>
  );
}
