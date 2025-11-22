import Link from "next/link";
import PageHeader from "@/components/layout/PageHeader";
import ReceiptsBrowser from "@/components/receipts/ReceiptsBrowser";
import { getSessionAndProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReceiptsPage() {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });
  const { data: receipts = [] } = await supabase
    .from("receipts")
    .select("id, reference_no, supplier_name, status, created_at, warehouses(name)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <PageHeader
        title="Receipts"
        description="Capture every supplier delivery from draft through validation."
        actions={
          <Link
            href="/receipts/create"
            className="rounded-2xl bg-gradient-to-r from-emerald-400 to-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950"
          >
            + New Receipt
          </Link>
        }
      />
      <ReceiptsBrowser receipts={receipts} />
    </div>
  );
}
