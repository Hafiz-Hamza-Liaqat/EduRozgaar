/** CSS/SVG bar chart — no external chart library */

export function SimpleBarChart({ data = [], labelKey = 'label', valueKey = 'value', height = 160, emptyLabel = 'No data' }) {
  const values = data.map((d) => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);
  const hasData = data.length > 0 && values.some((v) => v > 0);

  if (!hasData) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">{emptyLabel}</p>;
  }

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-end gap-1 sm:gap-2 min-w-0" style={{ height, minWidth: data.length > 8 ? `${data.length * 28}px` : undefined }}>
      {data.map((item, i) => {
        const value = Number(item[valueKey]) || 0;
        const pct = (value / max) * 100;
        const label = item[labelKey] || item.date || '';
        return (
          <div key={i} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full group">
            <span className="text-[10px] text-gray-500 dark:text-gray-400 mb-1 opacity-0 group-hover:opacity-100 transition-opacity truncate max-w-full">
              {value}
            </span>
            <div
              className="w-full rounded-t bg-primary/80 dark:bg-mint/70 transition-all"
              style={{ height: `${Math.max(pct, value > 0 ? 4 : 0)}%` }}
              title={`${label}: ${value}`}
            />
            <span className="text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500 mt-1 truncate max-w-full text-center">
              {String(label).slice(-5)}
            </span>
          </div>
        );
      })}
      </div>
    </div>
  );
}

export function SimpleHorizontalChart({ data = [], labelKey = 'label', valueKey = 'value', emptyLabel = 'No data' }) {
  const values = data.map((d) => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);
  const hasData = data.length > 0 && values.some((v) => v > 0);

  if (!hasData) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-4">{emptyLabel}</p>;
  }

  return (
    <ul className="space-y-2">
      {data.map((item, i) => {
        const value = Number(item[valueKey]) || 0;
        const pct = (value / max) * 100;
        return (
          <li key={i}>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-700 dark:text-gray-300 truncate">{item[labelKey]}</span>
              <span className="text-gray-500 ml-2 shrink-0">{value}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-primary dark:bg-mint rounded-full" style={{ width: `${pct}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
