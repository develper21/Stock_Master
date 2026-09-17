export default function DataTable({ columns = [], data = [], emptyState = "No records yet." }) {
  return (
    <div className="overflow-x-auto rounded-3xl border border-white/5 bg-slate-900/40">
      <table className="min-w-full divide-y divide-white/5 text-sm">
        <thead className="bg-slate-900/60 text-left text-xs uppercase tracking-[0.3em] text-slate-500 sticky top-0 z-10">
          <tr>
            {columns.map((column) => (
              <th key={column.accessor} className="px-2 sm:px-4 py-3 whitespace-nowrap">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-slate-200">
          {data.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="px-2 sm:px-4 py-6 text-center text-slate-500">
                {emptyState}
              </td>
            </tr>
          )}
          {data.map((row) => (
            <tr key={row.id} className="hover:bg-white/5">
              {columns.map((column) => (
                <td key={column.accessor} className="px-2 sm:px-4 py-3 whitespace-nowrap">
                  <div className="max-w-0 truncate md:max-w-none">
                    {column.render ? column.render(row) : row[column.accessor]}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
