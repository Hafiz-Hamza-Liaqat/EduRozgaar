/**
 * Dynamic block card layouts (C.7.0.3).
 */
import { Link } from 'react-router-dom';
import { OptimizedBlockImage } from '../OptimizedBlockImage';

function MetaList({ meta }) {
  if (!meta?.length) return null;
  return (
    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
      {meta.join(' · ')}
    </p>
  );
}

function ListingCard({ item, display }) {
  const showImage = display.showImage && item.imageUrl;
  const showLogo = display.showLogo !== false && item.imageUrl;
  const img = showImage || showLogo;

  return (
    <Link
      to={item.href || '#'}
      className="block rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-primary transition-colors h-full"
    >
      {img ? (
        <OptimizedBlockImage
          src={item.imageUrl}
          alt=""
          className="h-12 w-12 object-contain mb-3 rounded"
          width={48}
          height={48}
        />
      ) : null}
      <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">{item.title}</h3>
      {item.subtitle ? <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">{item.subtitle}</p> : null}
      {display.showDescription && item.description ? (
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{item.description}</p>
      ) : null}
      {display.showMetadata ? <MetaList meta={item.meta} /> : null}
      {display.showDeadline && item.deadline ? (
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
          Deadline: {new Date(item.deadline).toLocaleDateString()}
        </p>
      ) : null}
    </Link>
  );
}

function TestimonialCard({ item, display }) {
  return (
    <blockquote className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white/50 dark:bg-gray-900/30">
      {display.showImage && item.imageUrl ? (
        <OptimizedBlockImage src={item.imageUrl} alt="" className="h-10 w-10 rounded-full mb-2 object-cover" width={40} height={40} />
      ) : null}
      <p className="text-sm text-gray-700 dark:text-gray-300 italic">&ldquo;{item.description}&rdquo;</p>
      <footer className="mt-2 text-sm font-medium text-gray-900 dark:text-white">{item.title}</footer>
      {item.subtitle ? <cite className="text-xs text-gray-500 not-italic">{item.subtitle}</cite> : null}
    </blockquote>
  );
}

function PartnerLogo({ item }) {
  const inner = item.imageUrl ? (
    <OptimizedBlockImage src={item.imageUrl} alt={item.title || 'Partner'} className="max-h-12 max-w-full object-contain mx-auto" />
  ) : (
    <span className="text-sm font-medium text-gray-600">{item.title}</span>
  );
  const cls = 'flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 p-4 bg-white dark:bg-gray-900/40 aspect-[2/1]';
  if (item.href) {
    return (
      <a href={item.href} target="_blank" rel="noopener noreferrer" className={cls}>
        {inner}
      </a>
    );
  }
  return <div className={cls}>{inner}</div>;
}

/**
 * @param {{ items: object[]; display: object; source: string }} props
 */
export function DynamicItemsGrid({ items, display, source }) {
  const isTestimonial = source === 'testimonials';
  const isPartner = source === 'partners';
  const gridCols = isPartner
    ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
    : display.layout === 'list'
      ? 'grid-cols-1'
      : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';

  return (
    <ul className={`grid gap-3 ${gridCols}`}>
      {items.map((item) => (
        <li key={item.id}>
          {isTestimonial ? <TestimonialCard item={item} display={display} /> : null}
          {isPartner ? <PartnerLogo item={item} /> : null}
          {!isTestimonial && !isPartner ? <ListingCard item={item} display={display} /> : null}
        </li>
      ))}
    </ul>
  );
}

export function DynamicBlockSkeleton({ count = 6, layout = 'grid' }) {
  const n = Math.min(count, 8);
  return (
    <div className={layout === 'list' ? 'space-y-3' : 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3'} aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-24 rounded-lg bg-gray-200 dark:bg-gray-700 animate-pulse" />
      ))}
    </div>
  );
}
