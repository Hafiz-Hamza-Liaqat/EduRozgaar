import {
  parseOpportunityApplicationInput,
  validateOpportunityApplicationInput,
  validateStageTransitionInput,
  parseApplicationNoteInput,
  validateApplicationNoteInput,
  parseApplicationDocumentReferenceInput,
  validateApplicationDocumentReferenceInput,
  parseReminderReferenceInput,
  validateReminderReferenceInput,
  parseApplicationContactInput,
  validateApplicationContactInput,
  parseInterviewScheduleInput,
  validateInterviewScheduleInput,
} from '../../../../shared/career/validation.js';
import {
  assertValidTransition,
  getInitialStage,
  resolveStageTemplateId,
  getAllowedTransitions,
} from '../../../../shared/career/applicationStageMachine.js';

function validationError(errors) {
  const err = new Error(errors.join('; '));
  err.status = 400;
  err.details = errors;
  throw err;
}

export const ApplicationValidationService = {
  assertCreate(body) {
    const parsed = parseOpportunityApplicationInput(body, { partial: false });
    const errors = validateOpportunityApplicationInput(parsed, { partial: false });
    if (errors.length) validationError(errors);
    return parsed;
  },

  assertUpdate(body) {
    const parsed = parseOpportunityApplicationInput(body, { partial: true });
    const errors = validateOpportunityApplicationInput(parsed, { partial: true });
    if (errors.length) validationError(errors);
    return parsed;
  },

  assertStageTransition(body, fromStage, opportunityType) {
    const errors = validateStageTransitionInput(body, fromStage, opportunityType);
    if (errors.length) validationError(errors);
    return {
      toStage: String(body.toStage || body.stage).trim(),
      reason: body.reason ? String(body.reason).trim().slice(0, 500) : '',
      metadata: body.metadata && typeof body.metadata === 'object' ? body.metadata : {},
      byActorType: body.byActorType || 'talent',
      byActorId: body.byActorId || null,
    };
  },

  assertNote(body) {
    const parsed = parseApplicationNoteInput(body);
    const errors = validateApplicationNoteInput(parsed);
    if (errors.length) validationError(errors);
    return parsed;
  },

  assertDocumentReference(body) {
    const parsed = parseApplicationDocumentReferenceInput(body);
    const errors = validateApplicationDocumentReferenceInput(parsed);
    if (errors.length) validationError(errors);
    return parsed;
  },

  assertReminder(body) {
    const parsed = parseReminderReferenceInput(body);
    const errors = validateReminderReferenceInput(parsed);
    if (errors.length) validationError(errors);
    return parsed;
  },

  assertContact(body) {
    const parsed = parseApplicationContactInput(body);
    const errors = validateApplicationContactInput(parsed);
    if (errors.length) validationError(errors);
    return parsed;
  },

  assertInterview(body) {
    const parsed = parseInterviewScheduleInput(body);
    const errors = validateInterviewScheduleInput(parsed);
    if (errors.length) validationError(errors);
    return parsed;
  },
};

export const ApplicationStageMachineService = {
  resolveTemplateId: resolveStageTemplateId,
  getInitialStage,
  getAllowedTransitions(templateId, fromStage) {
    return getAllowedTransitions(templateId, fromStage);
  },
  assertTransition(templateId, fromStage, toStage) {
    assertValidTransition(templateId, fromStage, toStage);
  },
};
