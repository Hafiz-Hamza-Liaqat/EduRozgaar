/**
 * OpportunityApplication stage machine (C.8.0.3A).
 * Validates transitions per opportunity type template — not in controllers.
 */
import {
  PIPELINE_STAGES,
  TERMINAL_PIPELINE_STAGES,
  OPPORTUNITY_TYPES,
  STAGE_TEMPLATE_IDS,
} from './constants.js';

const JOB_TRANSITIONS = {
  interested: ['preparing', 'withdrawn'],
  preparing: ['applied', 'withdrawn'],
  applied: ['viewed', 'rejected', 'withdrawn'],
  viewed: ['screening', 'rejected', 'withdrawn'],
  screening: ['assessment', 'interview', 'rejected', 'withdrawn'],
  assessment: ['interview', 'rejected', 'withdrawn'],
  interview: ['offer', 'rejected', 'withdrawn'],
  offer: ['negotiation', 'accepted', 'rejected', 'withdrawn'],
  negotiation: ['accepted', 'rejected', 'withdrawn'],
  accepted: ['joined'],
  joined: [],
  rejected: [],
  withdrawn: [],
};

const INTERNSHIP_TRANSITIONS = {
  ...JOB_TRANSITIONS,
  interview: ['offer', 'accepted', 'rejected', 'withdrawn'],
  offer: ['accepted', 'rejected', 'withdrawn'],
};

const SCHOLARSHIP_TRANSITIONS = {
  interested: ['preparing', 'withdrawn'],
  preparing: ['applied', 'withdrawn'],
  applied: ['viewed', 'rejected', 'withdrawn'],
  viewed: ['screening', 'rejected', 'withdrawn'],
  screening: ['assessment', 'accepted', 'rejected', 'withdrawn'],
  assessment: ['accepted', 'rejected', 'withdrawn'],
  accepted: [],
  rejected: [],
  withdrawn: [],
};

const ADMISSION_TRANSITIONS = { ...SCHOLARSHIP_TRANSITIONS };

export const STAGE_TEMPLATES = {
  job_default: {
    id: 'job_default',
    opportunityTypes: ['job'],
    initialStage: 'interested',
    allowedStages: [...PIPELINE_STAGES],
    transitions: JOB_TRANSITIONS,
  },
  internship_default: {
    id: 'internship_default',
    opportunityTypes: ['internship'],
    initialStage: 'interested',
    allowedStages: [...PIPELINE_STAGES],
    transitions: INTERNSHIP_TRANSITIONS,
  },
  scholarship_default: {
    id: 'scholarship_default',
    opportunityTypes: ['scholarship', 'fellowship'],
    initialStage: 'interested',
    allowedStages: [
      'interested',
      'preparing',
      'applied',
      'viewed',
      'screening',
      'assessment',
      'accepted',
      'rejected',
      'withdrawn',
    ],
    transitions: SCHOLARSHIP_TRANSITIONS,
  },
  admission_default: {
    id: 'admission_default',
    opportunityTypes: ['admission', 'graduate_program'],
    initialStage: 'interested',
    allowedStages: [
      'interested',
      'preparing',
      'applied',
      'viewed',
      'screening',
      'assessment',
      'accepted',
      'rejected',
      'withdrawn',
    ],
    transitions: ADMISSION_TRANSITIONS,
  },
  graduate_default: {
    id: 'graduate_default',
    opportunityTypes: ['graduate_program'],
    initialStage: 'interested',
    allowedStages: [
      'interested',
      'preparing',
      'applied',
      'viewed',
      'screening',
      'assessment',
      'accepted',
      'rejected',
      'withdrawn',
    ],
    transitions: ADMISSION_TRANSITIONS,
  },
  fellowship_default: {
    id: 'fellowship_default',
    opportunityTypes: ['fellowship'],
    initialStage: 'interested',
    allowedStages: [
      'interested',
      'preparing',
      'applied',
      'viewed',
      'screening',
      'assessment',
      'accepted',
      'rejected',
      'withdrawn',
    ],
    transitions: SCHOLARSHIP_TRANSITIONS,
  },
};

const TYPE_TO_TEMPLATE = {};
for (const template of Object.values(STAGE_TEMPLATES)) {
  for (const type of template.opportunityTypes) {
    if (!TYPE_TO_TEMPLATE[type]) TYPE_TO_TEMPLATE[type] = template.id;
  }
}

export function resolveStageTemplateId(opportunityType) {
  const type = String(opportunityType || '').trim();
  if (!OPPORTUNITY_TYPES.includes(type)) return null;
  return TYPE_TO_TEMPLATE[type] || 'job_default';
}

export function getStageTemplate(templateIdOrType) {
  if (STAGE_TEMPLATES[templateIdOrType]) return STAGE_TEMPLATES[templateIdOrType];
  const resolved = resolveStageTemplateId(templateIdOrType);
  return resolved ? STAGE_TEMPLATES[resolved] : STAGE_TEMPLATES.job_default;
}

export function getInitialStage(opportunityType) {
  return getStageTemplate(opportunityType).initialStage;
}

export function isTerminalStage(stage) {
  return TERMINAL_PIPELINE_STAGES.includes(stage);
}

export function getAllowedTransitions(templateIdOrType, fromStage) {
  const template = getStageTemplate(templateIdOrType);
  if (!template.allowedStages.includes(fromStage)) return [];
  return template.transitions[fromStage] || [];
}

export function canTransition(templateIdOrType, fromStage, toStage) {
  const template = getStageTemplate(templateIdOrType);
  if (!template.allowedStages.includes(toStage)) return false;
  if (isTerminalStage(fromStage)) return false;
  return getAllowedTransitions(template.id, fromStage).includes(toStage);
}

export function assertValidTransition(templateIdOrType, fromStage, toStage) {
  if (!PIPELINE_STAGES.includes(toStage)) {
    const err = new Error(`Invalid pipeline stage: ${toStage}`);
    err.status = 400;
    throw err;
  }
  if (!canTransition(templateIdOrType, fromStage, toStage)) {
    const err = new Error(`Invalid stage transition: ${fromStage} → ${toStage}`);
    err.status = 400;
    err.code = 'INVALID_STAGE_TRANSITION';
    throw err;
  }
}

export function listStageTemplates() {
  return STAGE_TEMPLATE_IDS.map((id) => ({
    id,
    opportunityTypes: STAGE_TEMPLATES[id].opportunityTypes,
    initialStage: STAGE_TEMPLATES[id].initialStage,
    allowedStages: STAGE_TEMPLATES[id].allowedStages,
  }));
}
