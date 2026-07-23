/**
 * Legacy ↔ canonical mapping helpers for C.8.0.7 migration.
 */

/** Map legacy Application.status → OpportunityApplication.pipelineStage */
export const LEGACY_APPLICATION_STATUS_MAP = {
  submitted: 'applied',
  applied: 'applied',
  viewed: 'viewed',
  shortlisted: 'screening',
  rejected: 'rejected',
  interview: 'interview',
  hired: 'accepted',
};

/** Map legacy InternshipApplication.status → pipelineStage */
export const LEGACY_INTERNSHIP_STATUS_MAP = {
  applied: 'applied',
  withdrawn: 'withdrawn',
  accepted: 'accepted',
  rejected: 'rejected',
};

export function mapLegacyApplicationStatus(status) {
  return LEGACY_APPLICATION_STATUS_MAP[status] || 'applied';
}

export function mapLegacyInternshipStatus(status) {
  return LEGACY_INTERNSHIP_STATUS_MAP[status] || 'applied';
}

/**
 * Rollout modes for a domain slice.
 * @typedef {'legacy'|'dual_write'|'dual_read'|'canonical'} MigrationRolloutMode
 */

/**
 * Resolve rollout mode from enable / dual-write / read-canonical flags.
 * @param {{ enabled: boolean; dualWrite: boolean; readCanonical: boolean }} flags
 * @returns {MigrationRolloutMode}
 */
export function resolveRolloutMode({ enabled, dualWrite, readCanonical }) {
  if (!enabled) return 'legacy';
  if (readCanonical && !dualWrite) return 'canonical';
  if (readCanonical && dualWrite) return 'dual_read';
  if (dualWrite) return 'dual_write';
  return 'legacy';
}

export const MIGRATION_PHASES = ['M0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'];

export const MIGRATION_CHECKPOINTS = ['CP1', 'CP2', 'CP3', 'CP4', 'CP5'];
