/**
 * React renderer map for career dashboard widgets (C.8.0.6 / C.8.3).
 * Keys must match DASHBOARD_WIDGET_DEFINITIONS[].rendererKey in shared registry.
 */
import { ProfileSummaryWidget } from './widgets/ProfileSummaryWidget';
import { ApplicationsSummaryWidget } from './widgets/ApplicationsSummaryWidget';
import { TimelineWidget } from './widgets/TimelineWidget';
import { DocumentsWidget } from './widgets/DocumentsWidget';
import { CredentialsWidget } from './widgets/CredentialsWidget';
import { RecommendationsWidget } from './widgets/RecommendationsWidget';
import { DynamicContentWidget } from './widgets/DynamicContentWidget';
import { QuickLinksWidget } from './widgets/QuickLinksWidget';
import { ReadinessScoreWidget } from './widgets/ReadinessScoreWidget';
import { CareerHealthWidget } from './widgets/CareerHealthWidget';
import { WeeklyProgressWidget } from './widgets/WeeklyProgressWidget';
import { ProfileCompletionWidget } from './widgets/ProfileCompletionWidget';
import { UpcomingDeadlinesWidget } from './widgets/UpcomingDeadlinesWidget';
import { InterviewScheduleWidget } from './widgets/InterviewScheduleWidget';
import { RecommendedJobsWidget } from './widgets/RecommendedJobsWidget';
import { RecommendedScholarshipsWidget } from './widgets/RecommendedScholarshipsWidget';
import { RecommendedAdmissionsWidget } from './widgets/RecommendedAdmissionsWidget';
import { RecommendedLearningWidget } from './widgets/RecommendedLearningWidget';
import { GoalsTargetsWidget } from './widgets/GoalsTargetsWidget';
import { NotificationCenterWidget } from './widgets/NotificationCenterWidget';
import { RecentAchievementsWidget } from './widgets/RecentAchievementsWidget';
import { LayoutCustomizeWidget } from './widgets/LayoutCustomizeWidget';
import { RecentAssessmentsWidget } from './widgets/RecentAssessmentsWidget';
import { VerifiedSkillsWidget } from './widgets/VerifiedSkillsWidget';
import { SkillGapWidget } from './widgets/SkillGapWidget';

/** @type {Record<string, import('react').ComponentType<{ data?: unknown }>>} */
export const WIDGET_COMPONENT_MAP = {
  ProfileSummaryWidget,
  ReadinessScoreWidget,
  ApplicationsSummaryWidget,
  TimelineWidget,
  DocumentsWidget,
  CredentialsWidget,
  RecommendationsWidget,
  DynamicContentWidget,
  QuickLinksWidget,
  CareerHealthWidget,
  WeeklyProgressWidget,
  ProfileCompletionWidget,
  UpcomingDeadlinesWidget,
  InterviewScheduleWidget,
  RecommendedJobsWidget,
  RecommendedScholarshipsWidget,
  RecommendedAdmissionsWidget,
  RecommendedLearningWidget,
  GoalsTargetsWidget,
  NotificationCenterWidget,
  RecentAchievementsWidget,
  LayoutCustomizeWidget,
  RecentAssessmentsWidget,
  VerifiedSkillsWidget,
  SkillGapWidget,
};

export function getWidgetComponent(rendererKey) {
  return WIDGET_COMPONENT_MAP[rendererKey] ?? null;
}

export const WIDGET_RENDERER_KEYS = Object.keys(WIDGET_COMPONENT_MAP);
