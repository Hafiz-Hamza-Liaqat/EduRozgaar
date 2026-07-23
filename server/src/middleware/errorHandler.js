import { logger } from '../utils/logger.js';

const SAFE_MESSAGES = new Set([
  'Authentication required',
  'Invalid or expired token',
  'Validation failed',
  'Job not found',
  'User not found',
  'Insufficient permissions',
]);

export function errorHandler(err, _req, res, _next) {
  logger.error('unhandled_error', { message: err.message, stack: err.stack });
  const status = err.statusCode || err.status || 500;
  const isProd = process.env.NODE_ENV === 'production';
  let message = err.message || 'Internal Server Error';
  if (isProd && status >= 500) {
    message = 'Internal Server Error';
  } else if (isProd && !SAFE_MESSAGES.has(message) && status >= 400) {
    message = status === 404 ? 'Not found' : 'Request failed';
  }
  res.status(status).json({
    error: message,
    ...(err.applicationId ? { applicationId: err.applicationId } : {}),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}
