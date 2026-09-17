import { requireApiSession } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase/server-client";
export { dynamic } from "@/lib/api-runtime";

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const stringValue = String(value);
  if (/[",\n]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

function buildCsv(receipt) {
  const metaRows = [
    ["Field", "Value"],
    ["Reference No", receipt.reference_no || "—"],
    ["Supplier", receipt.supplier_name || "—"],
    ["Warehouse", receipt.warehouses?.name || "—"],
    ["Status", receipt.status || "—"],
    ["Created At", receipt.created_at ? new Date(receipt.created_at).toISOString() : "—"],
    ["Created By", receipt.profiles?.full_name || "—"],
    ["Created By Email", receipt.profiles?.email || "—"],
    ["Notes", receipt.notes || ""],
  ];

  const itemRows = [
    ["Product", "SKU", "Quantity", "Unit", "Unit Price", "Subtotal"],
    ...(receipt.receipt_items || []).map((item) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      return [
        item.products?.name || "—",
        item.products?.sku || "—",
        quantity,
        item.products?.unit || "—",
        unitPrice.toFixed(2),
        (quantity * unitPrice).toFixed(2),
      ];
    }),
  ];

  const sections = [metaRows, [[""], ["Items"], ...itemRows]];

  return sections
    .map((section) => section.map((row) => row.map(csvEscape).join(",")).join("\r\n"))
    .join("\r\n\r\n");
}

export async function GET(_req, { params }) {
  try {
    await requireApiSession();
    const supabase = getSupabaseServerClient();

    const { data: receipt, error } = await supabase
      .from("receipts")
      .select(
        "*, warehouses(name), receipt_items(*, products(name, sku, unit)), profiles:created_by(full_name, email)"
      )
      .eq("id", params.id)
      .single();

    if (error || !receipt) {
      return new Response(JSON.stringify({ error: error?.message || "Receipt not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const csv = `\uFEFF${buildCsv(receipt)}`;
    const filename = `receipt-${receipt.reference_no || receipt.id}.csv`;

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Receipt export failed", error);
    return new Response(JSON.stringify({ error: "Unexpected server error." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
