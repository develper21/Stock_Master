import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PageHeader({ title, description, actions, backHref, backLabel = "Back" }) {
  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-white/5 pb-6 md:flex-row md:items-center md:justify-between">
      <div className="space-y-3">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-slate-300 transition hover:border-emerald-400 hover:text-white"
          >
            <ArrowLeft size={14} />
            <span className="tracking-normal normal-case">{backLabel}</span>
          </Link>
        )}
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">STOKIQ</p>
          <h1 className="text-3xl font-semibold text-white">{title}</h1>
          {description && <p className="text-sm text-slate-400">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}
