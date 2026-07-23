/** Extended chart primitives for Content Insights (C.7.0.5). No external chart library. */
export { SimpleBarChart, SimpleHorizontalChart } from '../admin/SimpleBarChart';

/**
 * Line/area chart via SVG polyline.
 */
export function SimpleLineChart({
  data = [],
  labelKey = 'label',
  valueKey = 'value',
  height = 160,
  area = false,
  emptyLabel = 'No data',
}) {
  const values = data.map((d) => Number(d[valueKey]) || 0);
  const max = Math.max(...values, 1);
  const hasData = data.length > 0 && values.some((v) => v > 0);

  if (!hasData) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">{emptyLabel}</p>;
  }

  const w = Math.max(320, data.length * 36);
  const h = height;
  const pad = 12;
  const points = data.map((item, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
    const y = h - pad - ((Number(item[valueKey]) || 0) / max) * (h - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  const areaPath = `M ${pad},${h - pad} L ${points} L ${w - pad},${h - pad} Z`;

  return (
    <div className="w-full overflow-x-auto">
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        role="img"
        aria-label="Trend chart"
        className="max-w-full text-primary dark:text-mint"
      >
        {area ? (
          <path d={areaPath} fill="currentColor" opacity="0.15" />
        ) : null}
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {data.map((item, i) => {
          const x = pad + (i / Math.max(data.length - 1, 1)) * (w - pad * 2);
          const y = h - pad - ((Number(item[valueKey]) || 0) / max) * (h - pad * 2);
          return (
            <circle key={i} cx={x} cy={y} r="3" fill="currentColor">
              <title>{`${item[labelKey]}: ${item[valueKey]}`}</title>
            </circle>
          );
        })}
      </svg>
      {/* Screen-reader table fallback */}
      <table className="sr-only">
        <caption>Trend data</caption>
        <thead>
          <tr>
            <th>Date</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i}>
              <td>{item[labelKey]}</td>
              <td>{item[valueKey]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Simple donut / pie via SVG arcs.
 */
export function SimplePieChart({ data = [], labelKey = 'label', valueKey = 'value', emptyLabel = 'No data' }) {
  const values = data.map((d) => Number(d[valueKey]) || 0);
  const total = values.reduce((a, b) => a + b, 0);
  if (!total) {
    return <p className="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">{emptyLabel}</p>;
  }

  const colors = ['#31708E', '#8FC1E3', '#687864', '#5085A5', '#B1D4E0', '#F7B267', '#E07A5F', '#81B29A'];
  let angle = -90;
  const slices = data.map((item, i) => {
    const value = Number(item[valueKey]) || 0;
    const sweep = (value / total) * 360;
    const start = angle;
    angle += sweep;
    return { ...item, start, sweep, color: colors[i % colors.length], value };
  });

  function polar(cx, cy, r, deg) {
    const rad = ((deg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  }

  function arcPath(startDeg, sweepDeg) {
    const r = 40;
    const cx = 50;
    const cy = 50;
    const start = polar(cx, cy, r, startDeg);
    const end = polar(cx, cy, r, startDeg + sweepDeg);
    const large = sweepDeg > 180 ? 1 : 0;
    return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${large} 1 ${end.x} ${end.y} Z`;
  }

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4">
      <svg viewBox="0 0 100 100" className="w-40 h-40 shrink-0" role="img" aria-label="Distribution chart">
        {slices.map((s, i) => (
          <path key={i} d={arcPath(s.start, Math.max(s.sweep, 0.1))} fill={s.color}>
            <title>{`${s[labelKey]}: ${s.value}`}</title>
          </path>
        ))}
        <circle cx="50" cy="50" r="22" className="fill-white dark:fill-gray-900" />
      </svg>
      <ul className="space-y-1 text-sm w-full">
        {slices.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: s.color }} aria-hidden />
            <span className="truncate text-gray-700 dark:text-gray-300 flex-1">{s[labelKey]}</span>
            <span className="text-gray-500">{s.value}</span>
          </li>
        ))}
      </ul>
      <table className="sr-only">
        <caption>Distribution</caption>
        <tbody>
          {slices.map((s, i) => (
            <tr key={i}>
              <td>{s[labelKey]}</td>
              <td>{s.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function TrendIndicator({ current = 0, previous = 0, label = '' }) {
  const delta = previous === 0 ? (current > 0 ? 100 : 0) : ((current - previous) / previous) * 100;
  const up = delta >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${up ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}
      aria-label={`${label} ${up ? 'up' : 'down'} ${Math.abs(delta).toFixed(1)} percent`}
    >
      <span aria-hidden>{up ? '▲' : '▼'}</span>
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

export function MetricCard({ title, value, hint, trend }) {
  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <div className="flex items-end justify-between gap-2 mt-1">
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value ?? 0}</p>
        {trend}
      </div>
      {hint ? <p className="text-xs text-gray-400 mt-1">{hint}</p> : null}
    </div>
  );
}

export function ChartPanel({ title, children, className = '' }) {
  return (
    <section className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6 ${className}`}>
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h2>
      {children}
    </section>
  );
}
