export default function KpiGrid({ stats = [] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => (
        <article
          key={stat.label}
          className="rounded-3xl border border-white/5 bg-gradient-to-br from-slate-900/80 to-slate-900/30 p-5 shadow-card"
        >
          <p className="text-xs uppercase tracking-[0.3em] text-slate-400">{stat.label}</p>
          <p className="mt-3 text-4xl font-semibold text-white">{stat.value}</p>
          {stat.trend && (
            <p className="mt-2 text-xs text-emerald-300">{stat.trend}</p>
          )}
          {stat.href && (
            <a
              href={stat.href}
              className="mt-4 inline-flex items-center text-xs font-medium text-emerald-300 hover:text-emerald-200"
            >
              View details →
            </a>
          )}
        </article>
      ))}
    </div>
  );
}
