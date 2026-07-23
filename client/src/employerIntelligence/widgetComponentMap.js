import HiringOverviewWidget from './widgets/HiringOverviewWidget';
import OpenPositionsWidget from './widgets/OpenPositionsWidget';
import PipelineMetricsWidget from './widgets/PipelineMetricsWidget';
import CandidateRankingsWidget from './widgets/CandidateRankingsWidget';
import UpcomingInterviewsWidget from './widgets/UpcomingInterviewsWidget';
import EmployerRecentActivityWidget from './widgets/EmployerRecentActivityWidget';
import HiringTasksWidget from './widgets/HiringTasksWidget';
import RecommendedCandidatesWidget from './widgets/RecommendedCandidatesWidget';
import VerifiedSkillsSummaryWidget from './widgets/VerifiedSkillsSummaryWidget';

const WIDGET_COMPONENT_MAP = {
  HiringOverviewWidget,
  OpenPositionsWidget,
  PipelineMetricsWidget,
  CandidateRankingsWidget,
  UpcomingInterviewsWidget,
  EmployerRecentActivityWidget,
  HiringTasksWidget,
  RecommendedCandidatesWidget,
  VerifiedSkillsSummaryWidget,
};

export function getEmployerWidgetComponent(rendererKey) {
  return WIDGET_COMPONENT_MAP[rendererKey] ?? null;
}
