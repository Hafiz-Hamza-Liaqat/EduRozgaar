/**
 * Client-side ad slot matching and schedule checks.
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

export function isSlotWithinLimits(slot) {
  return isWithinImpressionLimit(slot) && isWithinClickLimit(slot);
}

export function resolveEffectiveSlotId(placement, index = null) {
  if (!placement) return '';
  if (index != null && placement.slotIdPattern) {
    return placement.slotIdPattern.replace('{index}', String(index));
  }
  return placement.slotId;
}

export function getAdAnchorId(placementId) {
  return `ad-${placementId}`;
}

/**
 * @param {object} slot
 * @param {{ previewBypass?: boolean }} [options]
 */
export function isSlotRenderable(slot, options = {}) {
  if (!slot) return false;
  if (options.previewBypass) return true;
  if (!slot.active) return false;
  if (slot.status && slot.status !== 'active') return false;
  if (!isSlotWithinLimits(slot)) return false;
  const now = Date.now();
  if (slot.startDate && new Date(slot.startDate).getTime() > now) return false;
  if (slot.endDate && new Date(slot.endDate).getTime() < now) return false;
  return true;
}

/**
 * Find best matching slot from API list for a placement.
 */
export function findSlotForPlacement(slots, placement, index = null, options = {}) {
  if (!placement || !Array.isArray(slots)) return null;
  const targetId = resolveEffectiveSlotId(placement, index);
  const candidates = slots.filter((s) => s.slotId === targetId);
  if (!candidates.length) return null;

  const renderable = candidates.filter((s) => isSlotRenderable(s, options));
  const pool = renderable.length ? renderable : (options.previewBypass ? candidates : []);

  if (!pool.length) return null;

  return pool.sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))[0];
}

export function slotHasCreative(slot) {
  return Boolean(slot?.imageUrl?.trim());
}
