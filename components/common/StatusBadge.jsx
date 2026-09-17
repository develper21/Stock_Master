const STATUS_STYLES = {
  draft: "bg-slate-700/70 text-slate-200",
  waiting: "bg-amber-500/15 text-amber-300",
  ready: "bg-blue-500/15 text-blue-200",
  done: "bg-emerald-500/15 text-emerald-200",
  cancelled: "bg-rose-500/15 text-rose-200",
};

export default function StatusBadge({ status = "draft" }) {
  const normalized = status?.toLowerCase();
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide ${
        STATUS_STYLES[normalized] || STATUS_STYLES.draft
      }`}
    >
      {normalized}
    </span>
  );
}
