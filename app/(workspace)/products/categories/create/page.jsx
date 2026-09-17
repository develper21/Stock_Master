import PageHeader from "@/components/layout/PageHeader";
import CategoryForm from "@/components/products/CategoryForm";
import { getSessionAndProfile } from "@/lib/auth";

export const metadata = {
  title: "Create Category | StockMaster",
};

export default async function CreateCategoryPage() {
  await getSessionAndProfile({ redirectToLogin: true });

  return (
    <div>
      <PageHeader
        title="Add category"
        description="Group related SKUs for faster filtering and analytics."
      />
      <div className="rounded-3xl border border-white/5 bg-slate-900/50 p-8">
        <CategoryForm />
      </div>
    </div>
  );
}
