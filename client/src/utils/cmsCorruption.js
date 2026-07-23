/** Detect C.6.1 verify-script markers accidentally left in published CMS. */
export function isC61TestMarker(value) {
  return typeof value === 'string' && /^c61-test-/i.test(value);
}

/** True when CMS header nav looks like test pollution rather than real nav. */
export function isCorruptCmsNav(items) {
  if (!items?.length) return false;
  if (items.length < 3) return true;
  return items.some((item) => isC61TestMarker(item.label) || isC61TestMarker(item.labelKey));
}
