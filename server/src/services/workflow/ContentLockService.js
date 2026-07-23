/**
 * Content locking — prevent simultaneous editing (C.7.0.6).
 */
import { ContentLock, CONTENT_LOCK_TTL_MS } from '../../models/ContentLock.js';
import { logAudit } from '../auditService.js';

export async function releaseStaleLocks() {
  const result = await ContentLock.deleteMany({ expiresAt: { $lt: new Date() } });
  return result.deletedCount || 0;
}

/**
 * @param {string} entityType
 * @param {string} entityId
 */
export async function getContentLock(entityType, entityId) {
  await releaseStaleLocks();
  const lock = await ContentLock.findOne({ entityType, entityId }).lean();
  if (!lock) return null;
  if (lock.expiresAt < new Date()) {
    await ContentLock.deleteOne({ _id: lock._id });
    return null;
  }
  return lock;
}

/**
 * @param {object} actor
 */
export async function acquireContentLock(entityType, entityId, actor, { force = false } = {}) {
  await releaseStaleLocks();
  const existing = await ContentLock.findOne({ entityType, entityId });
  const now = new Date();
  const expiresAt = new Date(now.getTime() + CONTENT_LOCK_TTL_MS);

  if (existing && !force) {
    if (String(existing.lockedBy) === String(actor.userId || actor._id)) {
      existing.expiresAt = expiresAt;
      existing.lockedAt = now;
      await existing.save();
      return { lock: existing.toObject(), acquired: true, renewed: true };
    }
    if (existing.expiresAt > now) {
      return { lock: existing.toObject(), acquired: false, readOnly: true };
    }
  }

  const lock = await ContentLock.findOneAndUpdate(
    { entityType, entityId },
    {
      $set: {
        lockedBy: actor.userId || actor._id,
        lockedByName: actor.name || actor.email || '',
        lockedByEmail: actor.email || '',
        lockedAt: now,
        expiresAt,
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await logAudit({
    actor,
    action: force ? 'workflow_lock_takeover' : 'workflow_lock_acquire',
    targetType: entityType,
    targetId: entityId,
    metadata: { expiresAt },
  });

  return { lock: lock.toObject(), acquired: true, takenOver: force };
}

export async function releaseContentLock(entityType, entityId, actor) {
  const lock = await ContentLock.findOne({ entityType, entityId });
  if (!lock) return { released: false };
  const ownerId = String(lock.lockedBy);
  const actorId = String(actor?.userId || actor?._id || '');
  if (actorId && ownerId !== actorId && actor?.role !== 'SuperAdmin' && actor?.role !== 'Admin') {
    return { released: false, reason: 'not_owner' };
  }
  await ContentLock.deleteOne({ _id: lock._id });
  await logAudit({
    actor,
    action: 'workflow_lock_release',
    targetType: entityType,
    targetId: entityId,
  });
  return { released: true };
}
