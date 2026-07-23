/** Map validation.js English messages to validation namespace keys */
const VALIDATION_KEY_MAP = {
  'Email is required': 'emailRequired',
  'Enter a valid email address': 'emailInvalid',
  'Password is required': 'passwordRequired',
  'Password must be at least 8 characters': 'passwordMin',
  'Include at least one uppercase letter': 'passwordUpper',
  'Include at least one lowercase letter': 'passwordLower',
  'Include at least one number': 'passwordNumber',
  'Name is required': 'nameRequired',
  'Passwords do not match': 'passwordMismatch',
};

export function translateValidationError(error, t) {
  if (!error) return null;
  const key = VALIDATION_KEY_MAP[error];
  if (key) return t(key, { ns: 'validation' });
  if (error.startsWith('Password must be at least')) {
    return t('passwordMin', { ns: 'validation' });
  }
  return error;
}
