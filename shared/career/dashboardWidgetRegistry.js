/**
 * Career dashboard widget registry (C.8.0.6 / C.8.3 Dashboard v2).
 * Configuration-driven layout — add widgets here, not new pages.
 */

export const DASHBOARD_ZONES = ['hero', 'main', 'aside'];

/** All registered widget types (v1 + v2 modules). */
export const DASHBOARD_WIDGET_TYPES = [
  // Foundation (C.8.0.6 / C.8.2)
  'profile-summary',
  'readiness-score',
  'applications-summary',
  'timeline-recent',
  'documents-recent',
  'credentials-summary',
  'recommendations',
  'dynamic-content',
  'quick-links',
  // Dashboard v2 modules (C.8.3)
  'career-health',
  'weekly-progress',
  'profile-completion',
  'upcoming-deadlines',
  'interview-schedule',
  'recommended-jobs',
  'recommended-scholarships',
  'recommended-admissions',
  'recommended-learning',
  'goals-targets',
  'notification-center',
  'recent-achievements',
  'layout-customize',
  'recent-assessments',
  'verified-skills',
  'skill-gap',
];

/** Classic layout — preserved when CAREER_DASHBOARD_V2 is off. */
export const DEFAULT_DASHBOARD_LAYOUT_V1 = {
  hero: [],
  main: [
    'readiness-score',
    'applications-summary',
    'timeline-recent',
    'dynamic-content',
  ],
  aside: [
    'profile-summary',
    'documents-recent',
    'credentials-summary',
    'recommendations',
  ],
};

/** Career OS layout — goal- and action-oriented. */
export const DEFAULT_DASHBOARD_LAYOUT_V2 = {
  hero: ['quick-links', 'career-health'],
  main: [
    'readiness-score',
    'skill-gap',
    'weekly-progress',
    'applications-summary',
    'upcoming-deadlines',
    'interview-schedule',
    'timeline-recent',
    'recommended-jobs',
    'dynamic-content',
  ],
  aside: [
    'profile-completion',
    'goals-targets',
    'notification-center',
    'documents-recent',
    'credentials-summary',
    'recent-achievements',
    'recommended-scholarships',
    'recommended-admissions',
    'recommended-learning',
    'recent-assessments',
    'verified-skills',
    'layout-customize',
  ],
};

/** Alias for backward compatibility with verify scripts and client fallbacks. */
export const DEFAULT_DASHBOARD_LAYOUT = DEFAULT_DASHBOARD_LAYOUT_V1;

/** Widget metadata for registry validation and feature gating. */
export const DASHBOARD_WIDGET_DEFINITIONS = {
  'profile-summary': {
    widgetType: 'profile-summary',
    rendererKey: 'ProfileSummaryWidget',
    zone: 'aside',
    flags: ['talentProfile'],
    provider: 'profileSummaryProvider',
    module: 'foundation',
  },
  'readiness-score': {
    widgetType: 'readiness-score',
    rendererKey: 'ReadinessScoreWidget',
    zone: 'main',
    flags: ['scoring', 'talentProfile'],
    provider: 'readinessScoreProvider',
    module: 'foundation',
  },
  'applications-summary': {
    widgetType: 'applications-summary',
    rendererKey: 'ApplicationsSummaryWidget',
    zone: 'main',
    flags: ['opportunityApplication'],
    provider: 'applicationsSummaryProvider',
    module: 'foundation',
  },
  'timeline-recent': {
    widgetType: 'timeline-recent',
    rendererKey: 'TimelineWidget',
    zone: 'main',
    flags: ['timeline'],
    provider: 'timelineRecentProvider',
    module: 'foundation',
  },
  'documents-recent': {
    widgetType: 'documents-recent',
    rendererKey: 'DocumentsWidget',
    zone: 'aside',
    flags: ['documentsPlatform'],
    provider: 'documentsRecentProvider',
    module: 'foundation',
  },
  'credentials-summary': {
    widgetType: 'credentials-summary',
    rendererKey: 'CredentialsWidget',
    zone: 'aside',
    flags: ['documentsPlatform'],
    provider: 'credentialsSummaryProvider',
    module: 'foundation',
  },
  recommendations: {
    widgetType: 'recommendations',
    rendererKey: 'RecommendationsWidget',
    zone: 'aside',
    flags: [],
    provider: 'recommendationsProvider',
    module: 'foundation',
  },
  'dynamic-content': {
    widgetType: 'dynamic-content',
    rendererKey: 'DynamicContentWidget',
    zone: 'main',
    flags: [],
    provider: null,
    module: 'foundation',
  },
  'quick-links': {
    widgetType: 'quick-links',
    rendererKey: 'QuickLinksWidget',
    zone: 'hero',
    flags: [],
    provider: null,
    module: 'foundation',
  },
  'career-health': {
    widgetType: 'career-health',
    rendererKey: 'CareerHealthWidget',
    zone: 'hero',
    flags: ['careerDashboardV2'],
    provider: 'careerHealthProvider',
    module: 'v2',
  },
  'weekly-progress': {
    widgetType: 'weekly-progress',
    rendererKey: 'WeeklyProgressWidget',
    zone: 'main',
    flags: ['careerDashboardV2'],
    provider: 'weeklyProgressProvider',
    module: 'v2',
  },
  'profile-completion': {
    widgetType: 'profile-completion',
    rendererKey: 'ProfileCompletionWidget',
    zone: 'aside',
    flags: ['careerDashboardV2', 'talentProfile'],
    provider: 'profileCompletionProvider',
    module: 'v2',
  },
  'upcoming-deadlines': {
    widgetType: 'upcoming-deadlines',
    rendererKey: 'UpcomingDeadlinesWidget',
    zone: 'main',
    flags: ['careerDashboardV2', 'opportunityApplication'],
    provider: 'upcomingDeadlinesProvider',
    module: 'v2',
  },
  'interview-schedule': {
    widgetType: 'interview-schedule',
    rendererKey: 'InterviewScheduleWidget',
    zone: 'main',
    flags: ['careerDashboardV2', 'opportunityApplication'],
    provider: 'interviewScheduleProvider',
    module: 'v2',
  },
  'recommended-jobs': {
    widgetType: 'recommended-jobs',
    rendererKey: 'RecommendedJobsWidget',
    zone: 'main',
    flags: ['careerDashboardV2'],
    provider: 'recommendedJobsProvider',
    module: 'v2',
  },
  'recommended-scholarships': {
    widgetType: 'recommended-scholarships',
    rendererKey: 'RecommendedScholarshipsWidget',
    zone: 'aside',
    flags: ['careerDashboardV2'],
    provider: 'recommendedScholarshipsProvider',
    module: 'v2',
  },
  'recommended-admissions': {
    widgetType: 'recommended-admissions',
    rendererKey: 'RecommendedAdmissionsWidget',
    zone: 'aside',
    flags: ['careerDashboardV2'],
    provider: 'recommendedAdmissionsProvider',
    module: 'v2',
  },
  'recommended-learning': {
    widgetType: 'recommended-learning',
    rendererKey: 'RecommendedLearningWidget',
    zone: 'aside',
    flags: ['careerDashboardV2'],
    provider: 'recommendedLearningProvider',
    module: 'v2',
  },
  'goals-targets': {
    widgetType: 'goals-targets',
    rendererKey: 'GoalsTargetsWidget',
    zone: 'aside',
    flags: ['careerDashboardV2', 'talentProfile'],
    provider: 'goalsTargetsProvider',
    module: 'v2',
  },
  'notification-center': {
    widgetType: 'notification-center',
    rendererKey: 'NotificationCenterWidget',
    zone: 'aside',
    flags: ['careerDashboardV2'],
    provider: 'notificationCenterProvider',
    module: 'v2',
  },
  'recent-achievements': {
    widgetType: 'recent-achievements',
    rendererKey: 'RecentAchievementsWidget',
    zone: 'aside',
    flags: ['careerDashboardV2'],
    provider: 'recentAchievementsProvider',
    module: 'v2',
  },
  'layout-customize': {
    widgetType: 'layout-customize',
    rendererKey: 'LayoutCustomizeWidget',
    zone: 'aside',
    flags: ['careerDashboardV2'],
    provider: 'layoutCustomizeProvider',
    module: 'v2',
  },
  'recent-assessments': {
    widgetType: 'recent-assessments',
    rendererKey: 'RecentAssessmentsWidget',
    zone: 'aside',
    flags: ['careerDashboardV2', 'assessments'],
    provider: 'recentAssessmentsProvider',
    module: 'assessments',
  },
  'verified-skills': {
    widgetType: 'verified-skills',
    rendererKey: 'VerifiedSkillsWidget',
    zone: 'aside',
    flags: ['careerDashboardV2', 'assessments', 'documentsPlatform'],
    provider: 'verifiedSkillsWidgetProvider',
    module: 'assessments',
  },
  'skill-gap': {
    widgetType: 'skill-gap',
    rendererKey: 'SkillGapWidget',
    zone: 'main',
    flags: ['careerDashboardV2', 'scoring'],
    provider: 'skillGapProvider',
    module: 'v2',
  },
};

export function getDashboardWidgetDefinition(widgetType) {
  return DASHBOARD_WIDGET_DEFINITIONS[widgetType] || null;
}

export function listDashboardWidgetTypes() {
  return DASHBOARD_WIDGET_TYPES;
}

export function resolveEnabledWidgets(flags = {}) {
  const enabled = [];
  for (const type of DASHBOARD_WIDGET_TYPES) {
    const def = DASHBOARD_WIDGET_DEFINITIONS[type];
    if (!def) continue;
    if (!def.flags?.length || def.flags.every((f) => flags[f])) {
      enabled.push(type);
    }
  }
  return enabled;
}

export function filterLayoutByEnabled(layout, enabledSet) {
  const out = { hero: [], main: [], aside: [] };
  for (const zone of DASHBOARD_ZONES) {
    out[zone] = (layout[zone] || []).filter((w) => enabledSet.has(w));
  }
  return out;
}

/**
 * Pick default layout: V2 when careerDashboardV2 flag is on, else classic V1.
 */
export function resolveDefaultLayout(flags = {}) {
  return flags.careerDashboardV2 ? DEFAULT_DASHBOARD_LAYOUT_V2 : DEFAULT_DASHBOARD_LAYOUT_V1;
}

/**
 * Apply user preference overlay (hidden widgets + optional zone order).
 */
export function applyLayoutPreference(baseLayout, preference) {
  if (!preference) return baseLayout;
  const hidden = new Set(preference.hiddenWidgets || []);
  const preferred = preference.layout;
  const source = preferred?.main || preferred?.aside || preferred?.hero
    ? {
      hero: preferred.hero || baseLayout.hero || [],
      main: preferred.main || baseLayout.main || [],
      aside: preferred.aside || baseLayout.aside || [],
    }
    : baseLayout;

  return {
    hero: (source.hero || []).filter((w) => !hidden.has(w)),
    main: (source.main || []).filter((w) => !hidden.has(w)),
    aside: (source.aside || []).filter((w) => !hidden.has(w)),
  };
}

export function validateLayoutShape(layout) {
  if (!layout || typeof layout !== 'object') return false;
  return DASHBOARD_ZONES.every((z) => Array.isArray(layout[z] || []));
}
