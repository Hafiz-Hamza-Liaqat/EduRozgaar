/**
 * Block template helpers (C.6.4.12) — copy-on-insert, never linked.
 */
import { createBlock } from './blockSchema.js';

export const TEMPLATE_CATEGORIES = [
  'hero',
  'cta',
  'faq',
  'pricing',
  'newsletter',
  'feature-cards',
  'team',
  'statistics',
  'gallery',
  'general',
];

/**
 * @param {{ blockType: string; config?: Record<string, unknown> }} template
 */
export function createBlockFromTemplate(template) {
  const config = template?.config && typeof template.config === 'object'
    ? JSON.parse(JSON.stringify(template.config))
    : {};
  return createBlock(template.blockType, config);
}

/**
 * @param {import('./blockSchema.js').PageBlock} block
 * @returns {{ name: string; category: string; description: string; blockType: string; config: Record<string, unknown> }}
 */
export function blockToTemplatePayload(block, { name = '', category = 'general', description = '' } = {}) {
  return {
    name: name || `${block.type} template`,
    category,
    description,
    blockType: block.type,
    config: JSON.parse(JSON.stringify(block.config || {})),
  };
}

/**
 * @param {object[]} templates
 * @param {{ q?: string; category?: string; sort?: string }} [filters]
 */
export function filterTemplates(templates, filters = {}) {
  const q = String(filters.q || '').trim().toLowerCase();
  const category = filters.category;
  let list = [...(templates || [])];

  if (q) {
    list = list.filter((t) =>
      String(t.name || '').toLowerCase().includes(q)
      || String(t.description || '').toLowerCase().includes(q)
      || String(t.blockType || '').toLowerCase().includes(q)
      || String(t.category || '').toLowerCase().includes(q),
    );
  }
  if (category && category !== 'all') {
    list = list.filter((t) => t.category === category);
  }

  const sort = filters.sort || 'name';
  if (sort === 'favorite') {
    list.sort((a, b) => Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) || String(a.name).localeCompare(String(b.name)));
  } else {
    list.sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  }

  return list;
}
