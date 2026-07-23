import {
  parseTalentProfileInput,
  validateTalentProfileInput,
  parseResumeVersionInput,
  validateResumeVersionInput,
  parseProfileDocumentInput,
  validateProfileDocumentInput,
  validateCredentialInput,
} from '../../../../shared/career/validation.js';

export const ProfileValidationService = {
  parseTalentProfileInput,
  validateTalentProfileInput,
  parseResumeVersionInput,
  validateResumeVersionInput,
  parseProfileDocumentInput,
  validateProfileDocumentInput,
  validateCredentialInput,

  assertTalentProfile(body, options = {}) {
    const parsed = parseTalentProfileInput(body, options);
    const errors = validateTalentProfileInput(parsed, options);
    if (errors.length) {
      const err = new Error(errors.join('; '));
      err.status = 400;
      err.details = errors;
      throw err;
    }
    return parsed;
  },

  assertResumeVersion(body, options = {}) {
    const parsed = parseResumeVersionInput(body);
    const errors = validateResumeVersionInput(parsed, options);
    if (errors.length) {
      const err = new Error(errors.join('; '));
      err.status = 400;
      err.details = errors;
      throw err;
    }
    return parsed;
  },

  assertProfileDocument(body) {
    const parsed = parseProfileDocumentInput(body);
    const errors = validateProfileDocumentInput(parsed);
    if (errors.length) {
      const err = new Error(errors.join('; '));
      err.status = 400;
      err.details = errors;
      throw err;
    }
    return parsed;
  },
};
