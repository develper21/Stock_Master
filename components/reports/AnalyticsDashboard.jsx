"use client";

import { Card } from "@/components/ui/Card";

export default function AnalyticsDashboard({ receiptMetrics, deliveryMetrics, adjustmentMetrics }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <SummaryCard
        title="Receipts"
        total={receiptMetrics.total}
        pending={receiptMetrics.pending}
        completed={receiptMetrics.completed}
        cycleHours={receiptMetrics.avgCycleHours}
      />
      <SummaryCard
        title="Deliveries"
        total={deliveryMetrics.total}
        pending={deliveryMetrics.pending}
        completed={deliveryMetrics.completed}
        cycleHours={deliveryMetrics.avgCycleHours}
      />
      <AdjustmentCard metrics={adjustmentMetrics} />
    </div>
  );
}

function SummaryCard({ title, total, pending, completed, cycleHours }) {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold text-white">{title} throughput</h3>
      <div className="grid grid-cols-2 gap-4 text-sm text-slate-300">
        <Metric label="Total" value={total} highlight />
        <Metric label="Pending" value={pending} />
        <Metric label="Completed" value={completed} />
        <Metric label="Avg cycle (hrs)" value={cycleHours} />
      </div>
    </Card>
  );
}

function AdjustmentCard({ metrics }) {
  return (
    <Card className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Adjustments snapshot</h3>
      <div className="grid grid-cols-3 gap-4 text-sm text-slate-300">
        <Metric label="Total" value={metrics.total} highlight />
        <Metric label="Positive" value={metrics.positives} />
        <Metric label="Negative" value={metrics.negatives} />
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Recent adjustments</p>
        <ul className="mt-3 space-y-2 text-xs text-slate-300">
          {metrics.latest.length === 0 && <li>No recent adjustments</li>}
          {metrics.latest.map((item) => (
            <li key={item.id} className="flex justify-between">
              <span>{new Date(item.created_at).toLocaleString()}</span>
              <span className={Number(item.difference) >= 0 ? "text-emerald-300" : "text-rose-300"}>
                {Number(item.difference) >= 0 ? "+" : ""}
                {item.difference}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}

function Metric({ label, value, highlight }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className={`text-xl font-semibold ${highlight ? "text-emerald-300" : "text-white"}`}>{value}</p>
    </div>
  );
}
