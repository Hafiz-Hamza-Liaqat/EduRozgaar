import { ANALYTICS_RANGE_PRESETS } from '@shared/analytics/dateRanges.js';

const LABELS = {
  today: 'Today',
  yesterday: 'Yesterday',
  '7d': '7 Days',
  '30d': '30 Days',
  '90d': '90 Days',
  custom: 'Custom',
};

/**
 * Date range filter for analytics reports (C.7.0.5).
 */
export function AnalyticsDateRangeFilter({
  range = '7d',
  from = '',
  to = '',
  onChange,
}) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="flex flex-wrap gap-1" role="group" aria-label="Date range">
        {ANALYTICS_RANGE_PRESETS.filter((p) => p !== 'custom').map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onChange?.({ range: p, from: '', to: '' })}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
              range === p
                ? 'bg-primary text-white border-primary'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            aria-pressed={range === p}
          >
            {LABELS[p]}
          </button>
        ))}
        <button
          type="button"
          onClick={() => onChange?.({ range: 'custom', from, to })}
          className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
            range === 'custom'
              ? 'bg-primary text-white border-primary'
              : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
          }`}
          aria-pressed={range === 'custom'}
        >
          Custom
        </button>
      </div>
      {range === 'custom' ? (
        <div className="flex gap-2 items-center">
          <label className="text-xs text-gray-500">
            From
            <input
              type="date"
              value={from}
              onChange={(e) => onChange?.({ range: 'custom', from: e.target.value, to })}
              className="ml-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
            />
          </label>
          <label className="text-xs text-gray-500">
            To
            <input
              type="date"
              value={to}
              onChange={(e) => onChange?.({ range: 'custom', from, to: e.target.value })}
              className="ml-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1 text-sm"
            />
          </label>
        </div>
      ) : null}
    </div>
  );
}
