import mongoose from 'mongoose';
import { logAudit, auditFromRequest } from '../services/auditService.js';

export function validIds(ids) {
  return (ids || []).filter((id) => mongoose.Types.ObjectId.isValid(id));
}

export async function runBulkAction({ req, Model, ids, action, auditAction, auditType }) {
  const valid = validIds(ids);
  if (!valid.length) return { status: 400, body: { error: 'ids required' } };

  if (action === 'delete') {
    const result = await Model.deleteMany({ _id: { $in: valid } });
    await logAudit({
      ...auditFromRequest(req),
      action: auditAction || `${auditType}.bulk_delete`,
      targetType: auditType,
      metadata: { ids: valid, deleted: result.deletedCount },
    });
    return { status: 200, body: { action, affected: result.deletedCount } };
  }

  const updates = {};
  let act = auditAction;
  if (action === 'archive') {
    updates.status = 'closed';
    if (auditType === 'blog' || auditType === 'career_article') updates.status = 'archived';
    act = act || `${auditType}.bulk_archive`;
  } else if (action === 'publish') {
    updates.status = auditType === 'blog' || auditType === 'career_article' ? 'published' : 'active';
    if (auditType === 'blog' || auditType === 'career_article') updates.publishedAt = new Date();
    act = act || `${auditType}.bulk_publish`;
  } else if (action === 'feature') {
    updates.isFeatured = true;
    act = act || `${auditType}.bulk_feature`;
  } else if (action === 'draft') {
    updates.status = 'draft';
    act = act || `${auditType}.bulk_draft`;
  } else {
    return { status: 400, body: { error: 'Unknown bulk action' } };
  }

  const result = await Model.updateMany({ _id: { $in: valid } }, { $set: updates });
  await logAudit({
    ...auditFromRequest(req),
    action: act,
    targetType: auditType,
    metadata: { ids: valid, modified: result.modifiedCount },
  });
  return { status: 200, body: { action, affected: result.modifiedCount } };
}

export async function duplicateDoc(Model, id, mutate) {
  const source = await Model.findById(id).lean();
  if (!source) return null;
  delete source._id;
  delete source.createdAt;
  delete source.updatedAt;
  if (mutate) mutate(source);
  return Model.create(source);
}
