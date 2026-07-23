import { useMemo } from 'react';
import { computePageBuilderDiagnostics } from '@shared/pageBuilderDiagnostics.js';

/**
 * Page Builder diagnostics panel (C.6.4.15).
 */
export function PageBuilderDiagnosticsPanel({ blocks, globalMap, title, pageKey, canonical }) {
  const diagnostics = useMemo(
    () => computePageBuilderDiagnostics(blocks, { globalMap, title, pageKey, canonical }),
    [blocks, globalMap, title, pageKey, canonical],
  );

  const { totals, validation, accessibility, seo, ids, missingImages, missingAlt, brokenLinks } = diagnostics;

  return (
    <details className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl">
        Diagnostics
        <span className={`ml-2 text-xs font-normal ${diagnostics.canPublish ? 'text-green-600' : 'text-amber-600'}`}>
          {diagnostics.canPublish ? 'Ready' : 'Issues found'}
        </span>
      </summary>
      <div className="px-4 pb-4 space-y-4 text-sm border-t border-gray-200 dark:border-gray-700 pt-3">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total blocks" value={totals.blocks} />
          <Stat label="Enabled" value={totals.enabled} />
          <Stat label="Disabled" value={totals.disabled} />
          <Stat label="Global refs" value={totals.globalReferences} />
          <Stat label="Render weight" value={diagnostics.renderWeight} />
          <Stat label="Est. size" value={`${diagnostics.estimatedPageSizeKb} KB`} />
          <Stat label="Validation errors" value={validation.invalidCount} />
          <Stat label="A11y errors" value={accessibility.errors.length} />
        </div>

        {!ids.ok ? (
          <IssueList title="Duplicate IDs" items={ids.errors} tone="error" />
        ) : null}
        <IssueList title="Validation errors" items={validation.errors} tone="error" />
        <IssueList title="Validation warnings" items={validation.warnings} tone="warning" />
        <IssueList title="Accessibility errors" items={accessibility.errors} tone="error" />
        <IssueList title="Accessibility warnings" items={accessibility.warnings} tone="warning" />
        <IssueList title="SEO issues" items={[...seo.errors, ...seo.warnings]} tone="warning" />
        <IssueList title="Missing images" items={missingImages} tone="warning" />
        <IssueList title="Missing alt text" items={missingAlt} tone="warning" />
        <IssueList title="Broken / suspicious links" items={brokenLinks} tone="warning" />

        {diagnostics.unusedBlocks > 0 ? (
          <p className="text-xs text-gray-500">{diagnostics.unusedBlocks} disabled block(s) on page.</p>
        ) : null}
      </div>
    </details>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-lg border border-gray-100 dark:border-gray-800 px-3 py-2">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function IssueList({ title, items, tone }) {
  if (!items?.length) return null;
  const color = tone === 'error' ? 'text-red-600 dark:text-red-400' : 'text-amber-700 dark:text-amber-300';
  return (
    <div>
      <p className={`font-medium ${color}`}>{title} ({items.length})</p>
      <ul className={`mt-1 text-xs list-disc list-inside ${color}`}>
        {items.slice(0, 8).map((item) => <li key={item}>{item}</li>)}
        {items.length > 8 ? <li>…and {items.length - 8} more</li> : null}
      </ul>
    </div>
  );
}
