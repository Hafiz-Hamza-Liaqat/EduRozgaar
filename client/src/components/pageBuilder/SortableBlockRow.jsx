import { memo, useCallback, Suspense, lazy } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { getBlockDefinition } from '@shared/blockRegistry.js';
import { getBlockValidation } from '@shared/blockValidation.js';

const BlockInspector = lazy(() => import('./BlockInspector').then((m) => ({ default: m.BlockInspector })));

const ICONS = {
  hero: 'H',
  text: 'T',
  cta: '→',
  faq: '?',
  gallery: '▦',
  cards: '▣',
  ad: '$',
  jobs: 'J',
  scholarships: 'S',
  admissions: 'A',
  newsletter: '@',
  form: 'F',
  resources: 'R',
  globe: 'G',
  spacer: '↕',
  divider: '—',
  grid: '▦',
};

function BlockIcon({ name }) {
  return (
    <span className="inline-flex w-8 h-8 items-center justify-center rounded bg-gray-100 dark:bg-gray-700 text-xs font-bold shrink-0">
      {ICONS[name] || '•'}
    </span>
  );
}

function ValidationBadge({ status }) {
  if (status === 'error') {
    return <span className="text-xs px-2 py-0.5 rounded bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Invalid</span>;
  }
  if (status === 'warning') {
    return <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Warning</span>;
  }
  return <span className="text-xs px-2 py-0.5 rounded bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">Valid</span>;
}

const toolbarBtn =
  'text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40';

function SortableBlockRowInner({
  block,
  index,
  total,
  expanded,
  isDraggingOverlay,
  globalMap,
  globalLabel,
  onUpdate,
  onDelete,
  onDuplicate,
  onToggleExpand,
  onToggleEnabled,
  onMoveTop,
  onMoveBottom,
  onSaveAsTemplate,
  onConvertToGlobal,
  onDetachGlobal,
}) {
  const definition = getBlockDefinition(block.type);
  const validation = getBlockValidation(block, definition, globalMap);
  const isGlobal = Boolean(block.globalBlockId);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const updateBlock = useCallback((next) => {
    onUpdate(next);
  }, [onUpdate]);

  const borderClass =
    validation.status === 'error'
      ? 'border-red-300 dark:border-red-700'
      : validation.status === 'warning'
        ? 'border-amber-300 dark:border-amber-700'
        : 'border-gray-200 dark:border-gray-700';

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isDraggingOverlay ? 0.35 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border p-3 sm:p-4 ${block.enabled ? borderClass : 'border-dashed opacity-60'} ${
        isDraggingOverlay ? 'shadow-xl ring-2 ring-primary/40 bg-white dark:bg-gray-900' : ''
      }`}
      data-block-id={block.id}
    >
      <div className="flex flex-wrap items-start gap-2 sm:gap-3">
        <button
          type="button"
          ref={setActivatorNodeRef}
          className="mt-1 p-1.5 rounded border border-gray-300 dark:border-gray-600 cursor-grab active:cursor-grabbing text-gray-500 hover:text-gray-800 dark:hover:text-gray-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary touch-manipulation"
          aria-label={`Drag to reorder ${definition?.displayName || block.type}`}
          {...attributes}
          {...listeners}
        >
          <span aria-hidden className="block text-sm leading-none">⋮⋮</span>
        </button>

        <BlockIcon name={definition?.icon} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-gray-900 dark:text-white">{globalLabel || definition?.displayName || block.type}</span>
            <span className="text-xs text-gray-500">#{index + 1}</span>
            {isGlobal ? <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">Global</span> : null}
            {!block.enabled ? <span className="text-xs px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-600">Disabled</span> : null}
            {block.enabled ? <ValidationBadge status={validation.status} /> : null}
          </div>
          {validation.errors.length ? (
            <ul className="text-xs text-red-600 dark:text-red-400 mt-1 list-disc list-inside">
              {validation.errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          ) : null}
          {validation.warnings.length ? (
            <ul className="text-xs text-amber-600 dark:text-amber-400 mt-1 list-disc list-inside">
              {validation.warnings.map((w) => <li key={w}>{w}</li>)}
            </ul>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-1 w-full sm:w-auto" role="toolbar" aria-label={`Actions for ${definition?.displayName || block.type}`}>
          <button type="button" onClick={onSaveAsTemplate} className={toolbarBtn} title="Save as template">Template</button>
          {!isGlobal ? (
            <button type="button" onClick={onConvertToGlobal} className={toolbarBtn} title="Convert to global block">Global</button>
          ) : (
            <button type="button" onClick={onDetachGlobal} className={toolbarBtn} title="Detach from global">Detach</button>
          )}
          <button type="button" onClick={onDuplicate} className={toolbarBtn} title="Duplicate">Dup</button>
          <button type="button" onClick={onToggleEnabled} className={toolbarBtn}>
            {block.enabled ? 'Disable' : 'Enable'}
          </button>
          <button type="button" onClick={onToggleExpand} className={toolbarBtn} aria-expanded={expanded}>
            {expanded ? 'Collapse' : 'Expand'}
          </button>
          <button type="button" disabled={index === 0} onClick={onMoveTop} className={toolbarBtn} title="Move to top">Top</button>
          <button type="button" disabled={index >= total - 1} onClick={onMoveBottom} className={toolbarBtn} title="Move to bottom">Bottom</button>
          <button type="button" onClick={onDelete} className={`${toolbarBtn} border-red-300 text-red-600`}>Delete</button>
        </div>
      </div>

      {expanded && definition ? (
        isGlobal ? (
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300">
            Linked to global block. Content is managed in{' '}
            <a href="/admin/page-builder/global-blocks" className="text-primary underline">Global Blocks</a>.
            {' '}Use Detach to make a local editable copy on this page only.
          </div>
        ) : (
          <Suspense fallback={<p className="text-xs text-gray-500 pt-3">Loading inspector…</p>}>
            <BlockInspector
              block={block}
              definition={definition}
              onUpdateBlock={updateBlock}
            />
          </Suspense>
        )
      ) : null}
    </div>
  );
}

function propsAreEqual(prev, next) {
  return (
    prev.block === next.block
    && prev.index === next.index
    && prev.total === next.total
    && prev.expanded === next.expanded
    && prev.isDraggingOverlay === next.isDraggingOverlay
    && prev.globalMap === next.globalMap
    && prev.globalLabel === next.globalLabel
  );
}

export const SortableBlockRow = memo(SortableBlockRowInner, propsAreEqual);

export function DragOverlayBlockRow({ block, index, total }) {
  if (!block) return null;
  return (
    <SortableBlockRowInner
      block={block}
      index={index}
      total={total}
      expanded={false}
      isDraggingOverlay
      onUpdate={() => {}}
      onDelete={() => {}}
      onDuplicate={() => {}}
      onToggleExpand={() => {}}
      onToggleEnabled={() => {}}
      onMoveTop={() => {}}
      onMoveBottom={() => {}}
    />
  );
}
