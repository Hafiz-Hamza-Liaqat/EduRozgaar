import { validateFormDefinition, validateSubmission } from './formSchema.js';

/**
 * @param {unknown} definition
 */
export function getFormValidationSummary(definition) {
  const definitionErrors = validateFormDefinition(definition);
  const warnings = [];
  const fields = definition?.fields || [];
  if (!fields.length) warnings.push('Form has no fields');
  const hasSubmit = fields.some((f) => !['divider', 'heading', 'richtext'].includes(f.type));
  if (!hasSubmit) warnings.push('Form has no input fields');
  if (definition?.status === 'published' && definitionErrors.length) {
    warnings.push('Published form has validation errors');
  }
  return {
    ok: definitionErrors.length === 0,
    errors: definitionErrors,
    warnings,
  };
}

export { validateFormDefinition, validateSubmission };
