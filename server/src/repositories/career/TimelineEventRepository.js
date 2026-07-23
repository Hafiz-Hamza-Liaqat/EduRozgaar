import { TimelineEvent } from '../../models/career/TimelineEvent.js';

function decodeCursor(cursor) {
  if (!cursor) return null;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'));
    if (parsed.occurredAt && parsed.id) return parsed;
  } catch {
    /* ignore */
  }
  return null;
}

export function encodeCursor(doc) {
  return Buffer.from(
    JSON.stringify({ occurredAt: doc.occurredAt.toISOString(), id: String(doc._id) })
  ).toString('base64url');
}

export const TimelineEventRepository = {
  async findByCareerEventId(careerEventId) {
    return TimelineEvent.findOne({ careerEventId }).lean();
  },

  async create(data) {
    return TimelineEvent.create(data);
  },

  async listBySubject(subjectTalentProfileId, {
    limit = 25,
    cursor,
    verb,
    objectType,
    objectId,
    since,
    until,
  } = {}) {
    const filter = { subjectTalentProfileId };
    if (verb) filter.verb = verb;
    if (objectType) filter.objectType = objectType;
    if (objectId) filter.objectId = objectId;
    if (since) filter.occurredAt = { ...(filter.occurredAt || {}), $gte: since };
    if (until) filter.occurredAt = { ...(filter.occurredAt || {}), $lte: until };

    const decoded = decodeCursor(cursor);
    if (decoded) {
      filter.$or = [
        { occurredAt: { $lt: new Date(decoded.occurredAt) } },
        { occurredAt: new Date(decoded.occurredAt), _id: { $lt: decoded.id } },
      ];
    }

    const rows = await TimelineEvent.find(filter)
      .sort({ occurredAt: -1, _id: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = rows.length > limit;
    const data = hasMore ? rows.slice(0, limit) : rows;
    const nextCursor = hasMore && data.length ? encodeCursor(data[data.length - 1]) : null;

    return { data, nextCursor, hasMore };
  },

  async listForApplication(subjectTalentProfileId, applicationId, options = {}) {
    return this.listBySubject(subjectTalentProfileId, {
      ...options,
      objectType: 'application',
      objectId: String(applicationId),
    });
  },

  async countBySubject(subjectTalentProfileId) {
    return TimelineEvent.countDocuments({ subjectTalentProfileId });
  },
};
