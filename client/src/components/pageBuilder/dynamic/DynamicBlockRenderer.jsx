import { useEffect, useMemo, useState } from 'react';
import {
  buildDisplayOptions,
  buildDynamicQuery,
  resolveDynamicSource,
} from '@shared/dynamicBlocks/registry.js';
import { dynamicContentApi } from '../../../services/dynamicContentApi';
import { trackDynamicBlock } from '../../../utils/platformAnalytics';
import { useLanguage } from '../../../context/LanguageContext';
import { DynamicBlockSkeleton, DynamicItemsGrid } from './dynamicBlockLayouts.jsx';
import { useBlockLayoutContext } from '../BlockLayoutContext';

function SectionShell({ title, children, className = '' }) {
  const { useLayoutContainer } = useBlockLayoutContext();
  const containerClass = useLayoutContainer ? 'w-full' : 'max-w-6xl mx-auto px-4 sm:px-6';
  return (
    <section className={`${useLayoutContainer ? '' : 'py-8'} ${className}`}>
      <div className={containerClass}>
        {title ? <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{title}</h2> : null}
        {children}
      </div>
    </section>
  );
}

/**
 * Query-driven block renderer (C.7.0.3).
 * @param {{ block: import('@shared/blockSchema.js').PageBlock; preview?: boolean }} props
 */
export function DynamicBlockRenderer({ block, preview = false }) {
  const { lang } = useLanguage();
  const source = resolveDynamicSource(block.type);
  const query = useMemo(
    () => ({ ...buildDynamicQuery(block.type, block.config || {}), locale: lang }),
    [block.type, block.config, lang],
  );
  const display = useMemo(() => buildDisplayOptions(block.type, block.config || {}), [block.type, block.config]);

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!source || preview || loading || error) return;
    trackDynamicBlock('render', block.type, block.id);
  }, [source, preview, loading, error, block.type, block.id]);

  useEffect(() => {
    if (!source) {
      setLoading(false);
      return undefined;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    dynamicContentApi.fetch(block.type, query)
      .then(({ data }) => {
        if (cancelled) return;
        setItems(data?.items || []);
      })
      .catch(() => {
        if (!cancelled) {
          setError('Unable to load content');
          setItems([]);
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [source, block.type, JSON.stringify(query)]);

  if (!source) return null;

  const title = display.title;
  const empty = !loading && !items.length;

  if (empty && !preview) return null;

  return (
    <SectionShell title={title}>
      {loading ? (
        <DynamicBlockSkeleton count={query.count} layout={display.layout} />
      ) : error ? (
        <p className="text-sm text-red-600" role="alert">{error}</p>
      ) : empty ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
          {display.emptyMessage}
        </p>
      ) : (
        <>
          <DynamicItemsGrid items={items} display={display} source={source} />
          {display.buttonText && display.buttonLink ? (
            <div className="mt-6">
              <a href={display.buttonLink} className="text-sm font-medium text-primary hover:underline">
                {display.buttonText} →
              </a>
            </div>
          ) : null}
        </>
      )}
    </SectionShell>
  );
}
