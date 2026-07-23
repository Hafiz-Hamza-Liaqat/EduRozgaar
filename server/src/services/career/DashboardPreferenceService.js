import { DashboardPreference } from '../../models/career/DashboardPreference.js';
import {
  DASHBOARD_WIDGET_TYPES,
  validateLayoutShape,
} from '../../../../shared/career/dashboardWidgetRegistry.js';

const TYPE_SET = new Set(DASHBOARD_WIDGET_TYPES);

function sanitizeLayout(layout) {
  if (!validateLayoutShape(layout)) return null;
  const clean = { hero: [], main: [], aside: [] };
  for (const zone of ['hero', 'main', 'aside']) {
    clean[zone] = (layout[zone] || []).filter((w) => TYPE_SET.has(w));
  }
  return clean;
}

export const DashboardPreferenceService = {
  async getForUser(userId) {
    return DashboardPreference.findOne({ userId }).lean();
  },

  async upsertForUser(userId, body = {}) {
    const patch = {};
    if (body.layout) {
      const layout = sanitizeLayout(body.layout);
      if (!layout) {
        const err = new Error('Invalid layout shape');
        err.status = 400;
        throw err;
      }
      patch.layout = layout;
    }
    if (Array.isArray(body.hiddenWidgets)) {
      patch.hiddenWidgets = body.hiddenWidgets.filter((w) => TYPE_SET.has(w));
    }
    if (body.version) patch.version = String(body.version).slice(0, 20);

    return DashboardPreference.findOneAndUpdate(
      { userId },
      { $set: patch },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).lean();
  },

  async clearForUser(userId) {
    await DashboardPreference.deleteOne({ userId });
    return { cleared: true };
  },
};
