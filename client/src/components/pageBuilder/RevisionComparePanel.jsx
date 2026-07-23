import { useMemo } from 'react';
import { actionDisplayLabel } from '@shared/pageBuilderRevisionDiff.js';

function Badge({ children, tone = 'gray' }) {
  const tones = {
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    green: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
    amber: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${tones[tone] || tones.gray}`}>
      {children}
    </span>
  );
}

function ChangeList({ title, items, tone }) {
  if (!items?.length) return null;
  const border = {
    added: 'border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800',
    removed: 'border-red-300 bg-red-50 dark:bg-red-950/30 dark:border-red-800',
    moved: 'border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800',
    modified: 'border-blue-300 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800',
  }[tone] || 'border-gray-200';

  return (
    <div className={`rounded-lg border p-3 ${border}`}>
      <h4 className="text-sm font-semibold mb-2">{title}</h4>
      <ul className="space-y-1 text-sm">
        {items.map((item) => (
          <li key={item.id || item.field || JSON.stringify(item)}>
            {item.label ? (
              <span><strong>{item.type}</strong> — {item.label}</span>
            ) : item.field ? (
              <span><strong>{item.field}</strong>: {item.from || '(empty)'} → {item.to || '(empty)'}</span>
            ) : item.changes ? (
              <span><strong>{item.type}</strong> ({item.id}): {item.changes.join(', ')}</span>
            ) : (
              <span><strong>{item.type}</strong> — moved #{item.from} → #{item.to}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Visual diff panel for two page layout revisions (C.6.4.13).
 */
export function RevisionComparePanel({ compareResult, loading, showRaw = false }) {
  const diff = compareResult?.diff;

  const summary = useMemo(() => {
    if (!diff) return null;
    return {
      added: diff.added?.length || 0,
      removed: diff.removed?.length || 0,
      moved: diff.moved?.length || 0,
      modified: diff.modified?.length || 0,
      seo: diff.seoChanges?.length || 0,
      meta: diff.metadataChanges?.length || 0,
    };
  }, [diff]);

  if (loading) return <p className="text-sm text-gray-500">Computing comparison…</p>;
  if (!compareResult) return <p className="text-sm text-gray-500">Select two revisions to compare.</p>;

  const from = compareResult.from;
  const to = compareResult.to;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span>Comparing</span>
        <Badge tone="gray">v{from?.version}</Badge>
        <span>{actionDisplayLabel(from?.action)}</span>
        <span>→</span>
        <Badge tone="blue">v{to?.version}</Badge>
        <span>{actionDisplayLabel(to?.action)}</span>
        <Badge tone="gray">{diff?.timeline || 'draft'} timeline</Badge>
      </div>

      {!diff?.hasChanges ? (
        <p className="text-sm text-gray-600 dark:text-gray-400">No differences between these revisions.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          <ChangeList title={`Added blocks (${summary?.added})`} items={diff.added} tone="added" />
          <ChangeList title={`Removed blocks (${summary?.removed})`} items={diff.removed} tone="removed" />
          <ChangeList title={`Moved blocks (${summary?.moved})`} items={diff.moved} tone="moved" />
          <ChangeList title={`Modified blocks (${summary?.modified})`} items={diff.modified} tone="modified" />
          <ChangeList title={`SEO changes (${summary?.seo})`} items={diff.seoChanges?.map((c) => ({ ...c, id: c.field }))} tone="modified" />
          <ChangeList title={`Metadata changes (${summary?.meta})`} items={diff.metadataChanges?.map((c) => ({ ...c, id: c.field }))} tone="modified" />
        </div>
      )}

      {showRaw ? (
        <pre className="text-xs overflow-auto p-3 rounded border bg-gray-50 dark:bg-gray-900 max-h-64">
          {JSON.stringify(compareResult, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

export function RevisionBadges({ revision }) {
  if (!revision) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {revision.isCurrentDraft ? <Badge tone="blue">Current draft</Badge> : null}
      {revision.isCurrentPublished ? <Badge tone="green">Current published</Badge> : null}
      {revision.reachedProduction ? <Badge tone="green">Published</Badge> : null}
      {revision.timeline === 'published' ? <Badge tone="green">Production timeline</Badge> : null}
    </span>
  );
}
