import { Link } from 'react-router-dom';
import { resolvePromoField } from '../../utils/cmsNav';

/**
 * CMS-driven footer promotional column (C.6.4.7.1).
 * Renders only when promo data is configured — caller should gate with hasFooterPromoContent.
 */
export function FooterPromoColumn({ promo, locale }) {
  const title = resolvePromoField(promo, 'title', locale);
  const description = resolvePromoField(promo, 'description', locale);
  const ctaLabel = resolvePromoField(promo, 'ctaLabel', locale);
  const ctaUrl = promo?.ctaUrl?.trim();
  const imageUrl = promo?.imageUrl?.trim();
  const icon = promo?.icon?.trim();

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:p-5">
      {(imageUrl || icon) && (
        <div className="mb-3">
          {imageUrl ? (
            <img src={imageUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
          ) : (
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20 text-primary text-xl font-semibold" aria-hidden>
              {icon.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
      )}
      {title ? (
        <h3 className="font-semibold text-[#CBD5F5] mb-2 text-sm uppercase tracking-wider">{title}</h3>
      ) : null}
      {description ? (
        <p className="text-sm text-[#94A3B8] leading-relaxed mb-4">{description}</p>
      ) : null}
      {ctaLabel && ctaUrl ? (
        promo.ctaExternal ? (
          <a
            href={ctaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {ctaLabel}
          </a>
        ) : (
          <Link
            to={ctaUrl}
            className="inline-flex items-center px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            {ctaLabel}
          </Link>
        )
      ) : null}
    </div>
  );
}
