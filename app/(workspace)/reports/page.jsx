import PageHeader from "@/components/layout/PageHeader";
import AnalyticsDashboard from "@/components/reports/AnalyticsDashboard";
import { getSessionAndProfile } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const { supabase } = await getSessionAndProfile({ redirectToLogin: true });

  const [{ data: receipts = [] }, { data: deliveries = [] }, { data: adjustments = [] }] =
    await Promise.all([
      supabase.from("receipts").select("status, created_at, validated_at"),
      supabase.from("deliveries").select("status, created_at, validated_at"),
      supabase.from("adjustments").select("difference, created_at"),
    ]);

  const receiptMetrics = buildLifecycleMetrics(receipts);
  const deliveryMetrics = buildLifecycleMetrics(deliveries);
  const adjustmentMetrics = buildAdjustmentMetrics(adjustments);

  return (
    <div>
      <PageHeader
        title="Analytics & Reporting"
        description="Track validation throughput, cycle times, and adjustment trends."
      />
      <AnalyticsDashboard
        receiptMetrics={receiptMetrics}
        deliveryMetrics={deliveryMetrics}
        adjustmentMetrics={adjustmentMetrics}
      />
    </div>
  );
}

function buildLifecycleMetrics(items = []) {
  const total = items.length;
  const completed = items.filter((item) => item.status === "done");
  const pending = total - completed.length;
  const cycleTimes = completed
    .map((item) => {
      const created = item.created_at ? new Date(item.created_at) : null;
      const validated = item.validated_at ? new Date(item.validated_at) : null;
      if (!created || !validated) return null;
      return (validated.getTime() - created.getTime()) / (1000 * 60 * 60); // hours
    })
    .filter((value) => typeof value === "number" && !Number.isNaN(value));

  const avgCycleHours = cycleTimes.length
    ? cycleTimes.reduce((sum, value) => sum + value, 0) / cycleTimes.length
    : 0;

  return {
    total,
    pending,
    completed: completed.length,
    avgCycleHours: Number(avgCycleHours.toFixed(2)),
  };
}

function buildAdjustmentMetrics(items = []) {
  const total = items.length;
  const positives = items.filter((item) => Number(item.difference) > 0).length;
  const negatives = items.filter((item) => Number(item.difference) < 0).length;
  const latest = [...items]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return {
    total,
    positives,
    negatives,
    latest,
  };
}
