import crypto from 'crypto';
import { cacheGet, cacheSet, cacheDel } from '../config/redis.js';

const REFRESH_PREFIX = 'refresh:';
const REVOKED_PREFIX = 'revoked:';

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/** Namespace refresh keys so User and Employer ObjectIds never collide. */
function refreshKey(subjectId, kind = 'user') {
  if (kind === 'employer') return `${REFRESH_PREFIX}employer:${subjectId}`;
  return `${REFRESH_PREFIX}${subjectId}`;
}

export async function storeRefreshToken(subjectId, refreshToken, kind = 'user') {
  const key = refreshKey(subjectId, kind);
  const ttlSec = 7 * 24 * 60 * 60;
  await cacheSet(key, hashToken(refreshToken), ttlSec);
}

export async function validateRefreshToken(subjectId, refreshToken, kind = 'user') {
  const key = refreshKey(subjectId, kind);
  const stored = await cacheGet(key);
  if (!stored) return false;
  return stored === hashToken(refreshToken);
}

export async function revokeRefreshToken(subjectId, kind = 'user') {
  await cacheDel(refreshKey(subjectId, kind));
}

export async function revokeAccessToken(token) {
  if (!token) return;
  const ttlSec = 60 * 60;
  await cacheSet(`${REVOKED_PREFIX}${hashToken(token)}`, '1', ttlSec);
}

export async function isAccessTokenRevoked(token) {
  if (!token) return false;
  const val = await cacheGet(`${REVOKED_PREFIX}${hashToken(token)}`);
  return Boolean(val);
}

export function hashResetToken(token) {
  return hashToken(token);
}
