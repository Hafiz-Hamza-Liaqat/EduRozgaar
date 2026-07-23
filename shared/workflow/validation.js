import { canTransitionWorkflow, WORKFLOW_STATES } from './states.js';
import { isWorkflowResource } from './resources.js';

/**
 * @param {object} input
 */
export function validateWorkflowTransition(input = {}) {
  const errors = [];
  const { from, to, resource } = input;
  if (resource && !isWorkflowResource(resource)) {
    errors.push(`Unknown workflow resource: ${resource}`);
  }
  if (!from || !WORKFLOW_STATES.includes(from)) errors.push('Invalid from state');
  if (!to || !WORKFLOW_STATES.includes(to)) errors.push('Invalid to state');
  if (from && to && !canTransitionWorkflow(from, to)) {
    errors.push(`Transition not allowed: ${from} → ${to}`);
  }
  return errors;
}
