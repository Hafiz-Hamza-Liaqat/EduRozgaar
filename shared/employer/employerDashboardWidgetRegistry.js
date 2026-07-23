/**
 * Employer dashboard widget registry (C.8.5) — mirrors career dashboard composition.
 */

export const EMPLOYER_DASHBOARD_ZONES = ['hero', 'main', 'aside'];

export const EMPLOYER_DASHBOARD_WIDGET_TYPES = [
  'hiring-overview',
  'open-positions',
  'pipeline-metrics',
  'candidate-rankings',
  'upcoming-interviews',
  'recent-activity',
  'hiring-tasks',
  'recommended-candidates',
  'verified-skills-summary',
];

export const DEFAULT_EMPLOYER_DASHBOARD_LAYOUT = {
  hero: ['hiring-overview'],
  main: [
    'pipeline-metrics',
    'candidate-rankings',
    'upcoming-interviews',
    'recent-activity',
  ],
  aside: [
    'open-positions',
    'hiring-tasks',
    'recommended-candidates',
    'verified-skills-summary',
  ],
};

export const EMPLOYER_DASHBOARD_WIDGET_DEFINITIONS = {
  'hiring-overview': {
    widgetType: 'hiring-overview',
    rendererKey: 'HiringOverviewWidget',
    zone: 'hero',
    flags: ['employerIntelligence'],
    provider: 'hiringOverviewProvider',
  },
  'open-positions': {
    widgetType: 'open-positions',
    rendererKey: 'OpenPositionsWidget',
    zone: 'aside',
    flags: ['employerIntelligence'],
    provider: 'openPositionsProvider',
  },
  'pipeline-metrics': {
    widgetType: 'pipeline-metrics',
    rendererKey: 'PipelineMetricsWidget',
    zone: 'main',
    flags: ['employerIntelligence'],
    provider: 'pipelineMetricsProvider',
  },
  'candidate-rankings': {
    widgetType: 'candidate-rankings',
    rendererKey: 'CandidateRankingsWidget',
    zone: 'main',
    flags: ['employerIntelligence'],
    provider: 'candidateRankingsProvider',
  },
  'upcoming-interviews': {
    widgetType: 'upcoming-interviews',
    rendererKey: 'UpcomingInterviewsWidget',
    zone: 'main',
    flags: ['employerIntelligence'],
    provider: 'upcomingInterviewsProvider',
  },
  'recent-activity': {
    widgetType: 'recent-activity',
    rendererKey: 'EmployerRecentActivityWidget',
    zone: 'main',
    flags: ['employerIntelligence'],
    provider: 'employerRecentActivityProvider',
  },
  'hiring-tasks': {
    widgetType: 'hiring-tasks',
    rendererKey: 'HiringTasksWidget',
    zone: 'aside',
    flags: ['employerIntelligence'],
    provider: 'hiringTasksProvider',
  },
  'recommended-candidates': {
    widgetType: 'recommended-candidates',
    rendererKey: 'RecommendedCandidatesWidget',
    zone: 'aside',
    flags: ['employerIntelligence'],
    provider: 'recommendedCandidatesProvider',
  },
  'verified-skills-summary': {
    widgetType: 'verified-skills-summary',
    rendererKey: 'VerifiedSkillsSummaryWidget',
    zone: 'aside',
    flags: ['employerIntelligence'],
    provider: 'verifiedSkillsSummaryProvider',
  },
};

export function getEmployerWidgetDefinition(widgetType) {
  return EMPLOYER_DASHBOARD_WIDGET_DEFINITIONS[widgetType] || null;
}

export function resolveEnabledEmployerWidgets(flags = {}) {
  const enabled = [];
  for (const type of EMPLOYER_DASHBOARD_WIDGET_TYPES) {
    const def = EMPLOYER_DASHBOARD_WIDGET_DEFINITIONS[type];
    if (!def.flags?.length || def.flags.every((f) => flags[f])) enabled.push(type);
  }
  return enabled;
}

export function filterEmployerLayoutByEnabled(layout, enabledSet) {
  const out = { hero: [], main: [], aside: [] };
  for (const zone of EMPLOYER_DASHBOARD_ZONES) {
    out[zone] = (layout[zone] || []).filter((w) => enabledSet.has(w));
  }
  return out;
}
