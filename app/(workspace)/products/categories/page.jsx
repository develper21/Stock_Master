import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import DataTable from "@/components/common/DataTable";
import DeleteCategoryButton from "@/components/products/DeleteCategoryButton";
import { getSessionAndProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const { supabase, profile } = await getSessionAndProfile({ redirectToLogin: true });
  const isManager = profile.role === "inventory_manager";

  const { data: categories = [] } = await supabase
    .from("product_categories")
    .select("id, name, description, created_at")
    .order("name", { ascending: true });

  const columns = [
    { label: "Name", accessor: "name" },
    { label: "Description", accessor: "description", render: (row) => row.description || "—" },
    { label: "Created", accessor: "created_at", render: (row) => new Date(row.created_at).toLocaleDateString() },
  ];

  if (isManager) {
    columns.push({
      label: "Actions",
      accessor: "actions",
      render: (row) => (
        <div className="space-x-3 text-xs">
          <Link href={`/products/categories/${row.id}/edit`} className="text-emerald-300 hover:text-emerald-200">
            Edit
          </Link>
          <DeleteCategoryButton categoryId={row.id} />
        </div>
      ),
    });
  }

  return (
    <div>
      <PageHeader
        title="Product Categories"
        description="Organize SKUs under standardized category taxonomy."
        actions={
          isManager && (
            <Link
              href="/products/categories/create"
              className="rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              + Add Category
            </Link>
          )
        }
      />

      <DataTable columns={columns} data={categories} emptyState="No categories yet." />
    </div>
  );
}
