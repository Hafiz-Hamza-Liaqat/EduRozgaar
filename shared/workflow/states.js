/**
 * Canonical editorial workflow states (C.7.0.6).
 */

export const WORKFLOW_STATES = [
  'draft',
  'in_review',
  'changes_requested',
  'approved',
  'scheduled',
  'published',
  'archived',
];

export const WORKFLOW_STATE_SET = new Set(WORKFLOW_STATES);

/** Allowed transitions: from -> [to] */
export const WORKFLOW_TRANSITIONS = {
  draft: ['in_review', 'scheduled', 'published', 'archived'],
  in_review: ['changes_requested', 'approved', 'draft', 'archived'],
  changes_requested: ['draft', 'in_review', 'archived'],
  approved: ['scheduled', 'published', 'in_review', 'archived'],
  scheduled: ['published', 'draft', 'archived'],
  published: ['archived', 'draft'],
  archived: ['draft'],
};

/**
 * @param {string} from
 * @param {string} to
 */
export function canTransitionWorkflow(from, to) {
  if (!WORKFLOW_STATE_SET.has(from) || !WORKFLOW_STATE_SET.has(to)) return false;
  return (WORKFLOW_TRANSITIONS[from] || []).includes(to);
}

/**
 * @param {string} state
 */
export function workflowStateLabel(state) {
  const labels = {
    draft: 'Draft',
    in_review: 'In Review',
    changes_requested: 'Changes Requested',
    approved: 'Approved',
    scheduled: 'Scheduled',
    published: 'Published',
    archived: 'Archived',
  };
  return labels[state] || state;
}
