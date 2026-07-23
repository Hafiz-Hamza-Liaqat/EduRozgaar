/** Resolve CMS nav/footer label for current locale. */
export function resolveCmsLabel(item, locale) {
  if (!item) return '';
  if (locale === 'ur' && item.labelUr) return item.labelUr;
  if (locale === 'ar' && item.labelAr) return item.labelAr;
  return item.label || item.title || '';
}

/** Filter and sort visible CMS nav items. */
export function normalizeCmsNavItems(items = []) {
  return [...items]
    .filter((item) => item.visible !== false)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((item) => ({
      ...item,
      children: item.children
        ? [...item.children]
            .filter((c) => c.visible !== false)
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        : undefined,
    }));
}

/** Map CMS footer column title for locale. */
export function resolveColumnTitle(col, locale) {
  if (!col) return '';
  if (locale === 'ur' && col.titleUr) return col.titleUr;
  if (locale === 'ar' && col.titleAr) return col.titleAr;
  return col.title || '';
}

/** Map CMS footer link label for locale. */
export function resolveLinkLabel(link, locale) {
  if (!link) return '';
  if (locale === 'ur' && link.labelUr) return link.labelUr;
  if (locale === 'ar' && link.labelAr) return link.labelAr;
  return link.label || '';
}

/** Resolve localized footer promo field. */
export function resolvePromoField(promo, field, locale) {
  if (!promo) return '';
  const localizedKey = locale === 'ur' ? `${field}Ur` : locale === 'ar' ? `${field}Ar` : null;
  if (localizedKey && promo[localizedKey]) return promo[localizedKey];
  return promo[field] || '';
}

/** True when footer promo column has content worth rendering. */
export function hasFooterPromoContent(promo) {
  if (!promo || promo.enabled === false) return false;
  const title = String(promo.title || '').trim();
  const description = String(promo.description || '').trim();
  const ctaLabel = String(promo.ctaLabel || '').trim();
  const ctaUrl = String(promo.ctaUrl || '').trim();
  const imageUrl = String(promo.imageUrl || '').trim();
  const icon = String(promo.icon || '').trim();
  return Boolean(title || description || (ctaLabel && ctaUrl) || imageUrl || icon);
}
