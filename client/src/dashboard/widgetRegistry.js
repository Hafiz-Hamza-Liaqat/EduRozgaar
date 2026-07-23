/**
 * Client re-export of shared dashboard widget registry (C.8.0.6 / C.8.3).
 */
export {
  DASHBOARD_ZONES,
  DASHBOARD_WIDGET_TYPES,
  DEFAULT_DASHBOARD_LAYOUT,
  DEFAULT_DASHBOARD_LAYOUT_V1,
  DEFAULT_DASHBOARD_LAYOUT_V2,
  DASHBOARD_WIDGET_DEFINITIONS,
  getDashboardWidgetDefinition,
  listDashboardWidgetTypes,
  resolveEnabledWidgets,
  filterLayoutByEnabled,
  resolveDefaultLayout,
  applyLayoutPreference,
  validateLayoutShape,
} from '@shared/career/dashboardWidgetRegistry.js';
