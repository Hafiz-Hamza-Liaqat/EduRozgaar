/**
 * Ad slot limit helpers — shared by public listing and tracking endpoints.
 */

export function isWithinImpressionLimit(slot) {
  if (!slot) return false;
  if (slot.impressionLimit == null || slot.impressionLimit === '') return true;
  return (slot.impressionCount ?? 0) < Number(slot.impressionLimit);
}

export function isWithinClickLimit(slot) {
  if (!slot) return false;
  if (slot.clickLimit == null || slot.clickLimit === '') return true;
  return (slot.clickCount ?? 0) < Number(slot.clickLimit);
}

/** Slot may still be shown publicly when both limits (if set) are not exhausted. */
export function isSlotWithinLimits(slot) {
  return isWithinImpressionLimit(slot) && isWithinClickLimit(slot);
}

export function calculateCtr(clicks, impressions) {
  const c = Number(clicks) || 0;
  const i = Number(impressions) || 0;
  if (i <= 0) return null;
  return (c / i) * 100;
}

export function formatCtr(clicks, impressions) {
  const ctr = calculateCtr(clicks, impressions);
  if (ctr == null) return '—';
  return `${ctr.toFixed(2)}%`;
}
