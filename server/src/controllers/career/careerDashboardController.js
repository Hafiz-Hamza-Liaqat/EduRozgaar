import { asyncHandler } from '../../utils/asyncHandler.js';
import {
  isCareerDashboardEnabled,
  isDashboardPersonalizationEnabled,
} from '../../config/careerFeatureFlags.js';
import { DashboardCompositionService } from '../../services/career/DashboardCompositionService.js';
import { DashboardPreferenceService } from '../../services/career/DashboardPreferenceService.js';

export function requireCareerDashboardEnabled(_req, res, next) {
  if (!isCareerDashboardEnabled()) {
    return res.status(503).json({ error: 'Career dashboard is disabled' });
  }
  next();
}

export function requireDashboardPersonalization(_req, res, next) {
  if (!isDashboardPersonalizationEnabled()) {
    return res.status(503).json({ error: 'Dashboard personalization is disabled' });
  }
  next();
}

export const getCareerDashboard = asyncHandler(async (req, res) => {
  const payload = await DashboardCompositionService.composeForUser(req.user.userId);
  res.json(payload);
});

export const getDashboardLayoutPreference = asyncHandler(async (req, res) => {
  const preference = await DashboardPreferenceService.getForUser(req.user.userId);
  res.json(preference || { layout: null, hiddenWidgets: [], version: '2.0' });
});

export const putDashboardLayoutPreference = asyncHandler(async (req, res) => {
  const preference = await DashboardPreferenceService.upsertForUser(req.user.userId, req.body || {});
  await DashboardCompositionService.invalidateForUser(req.user.userId);
  res.json(preference);
});

export const clearDashboardLayoutPreference = asyncHandler(async (req, res) => {
  const result = await DashboardPreferenceService.clearForUser(req.user.userId);
  await DashboardCompositionService.invalidateForUser(req.user.userId);
  res.json(result);
});
