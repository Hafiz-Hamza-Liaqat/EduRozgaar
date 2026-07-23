import mongoose from 'mongoose';
import { DocumentRepository } from '../../repositories/career/DocumentRepository.js';
import { TalentProfileRepository } from '../../repositories/career/TalentProfileRepository.js';
import { getMediaAssetById, createMediaAssetFromBuffer } from '../mediaService.js';
import { emitCareerEvent } from './CareerEventBus.js';
import { isDocumentsPlatformEnabled } from '../../config/careerFeatureFlags.js';
import {
  parseDocumentInput,
  validateDocumentInput,
} from '../../../../shared/career/validation.js';
import { trackDocumentPlatformFromEvent } from './careerDocumentBridge.js';

function actorFromUserId(userId) {
  return { type: 'talent', id: String(userId) };
}

function validationError(messages) {
  const err = new Error(messages.join('; '));
  err.status = 400;
  throw err;
}

async function enrichForClient(doc) {
  if (!doc) return doc;
  let fileUrl = doc.metadata?.fileUrl || '';
  if (doc.mediaAssetId) {
    const asset = await getMediaAssetById(String(doc.mediaAssetId));
    if (asset?.storageUrl) fileUrl = asset.storageUrl;
  }
  return {
    ...doc,
    metadata: { ...(doc.metadata || {}), fileUrl },
  };
}

function emitDocumentEvent(eventType, doc, payload, actor) {
  const event = emitCareerEvent(
    eventType,
    {
      documentId: String(doc._id),
      talentProfileId: String(doc.talentProfileId),
      parentType: doc.parentType,
      parentId: String(doc.parentId),
      documentType: doc.documentType,
      label: doc.label,
      versionGroupId: String(doc.versionGroupId),
      versionNumber: doc.versionNumber,
      ...payload,
    },
    {
      actor,
      aggregateType: 'Document',
      aggregateId: doc._id,
      locale: doc.locale,
    }
  );
  trackDocumentPlatformFromEvent(event, { userId: doc.userId });
  return event;
}

export const DocumentService = {
  async listForUser(userId, query = {}) {
    const docs = await DocumentRepository.findByUser(userId, {
      documentType: query.documentType,
      parentType: query.parentType,
    });
    return Promise.all(docs.map(enrichForClient));
  },

  async getById(userId, documentId) {
    const doc = await DocumentRepository.findByIdForUser(documentId, userId);
    if (!doc) {
      const err = new Error('Document not found');
      err.status = 404;
      throw err;
    }
    return enrichForClient(doc);
  },

  async create(userId, body, actor) {
    if (!isDocumentsPlatformEnabled()) {
      const err = new Error('Documents platform is disabled');
      err.status = 503;
      throw err;
    }

    const profile = await TalentProfileRepository.findByUserId(userId);
    if (!profile) {
      const err = new Error('Talent profile not found');
      err.status = 404;
      throw err;
    }

    const parsed = parseDocumentInput(body);
    const errors = validateDocumentInput({ ...parsed, ...body }, { partial: false });
    if (errors.length) validationError(errors);

    if (parsed.mediaAssetId) {
      const asset = await getMediaAssetById(String(parsed.mediaAssetId));
      if (!asset) {
        const err = new Error('Media asset not found');
        err.status = 404;
        throw err;
      }
    }

    const versionGroupId = new mongoose.Types.ObjectId();
    const parentId = parsed.parentId || profile._id;
    const parentType = parsed.parentType || 'talent_profile';

    const doc = await DocumentRepository.create({
      parentType,
      parentId,
      talentProfileId: profile._id,
      userId,
      label: parsed.label,
      documentType: parsed.documentType || 'other',
      mediaAssetId: parsed.mediaAssetId || null,
      versionGroupId,
      versionNumber: 1,
      isCurrentVersion: true,
      tags: parsed.tags || [],
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
      visibility: parsed.visibility || 'private',
      downloadPermission: parsed.downloadPermission || 'owner_only',
      status: 'active',
      locale: profile.locale || 'en',
      metadata: parsed.metadata || {},
      legacyProfileDocumentId: body.legacyProfileDocumentId || null,
    });

    const plain = doc.toObject ? doc.toObject() : doc;
    emitDocumentEvent('DocumentCreated', plain, {}, actor || actorFromUserId(userId));
    return enrichForClient(plain);
  },

  async createFromUpload(userId, file, meta = {}, actor) {
    if (!file?.buffer) {
      const err = new Error('File is required');
      err.status = 400;
      throw err;
    }

    const asset = await createMediaAssetFromBuffer({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      folder: 'talent-documents',
      uploadedBy: userId,
    });

    return this.create(
      userId,
      {
        label: meta.label || file.originalname,
        documentType: meta.documentType || 'other',
        visibility: meta.visibility || 'private',
        downloadPermission: meta.downloadPermission || 'owner_only',
        tags: meta.tags,
        expiresAt: meta.expiresAt,
        mediaAssetId: asset._id,
        metadata: {
          mimeType: file.mimetype,
          originalName: file.originalname,
          fileUrl: asset.storageUrl,
        },
      },
      actor
    );
  },

  async createVersion(userId, documentId, body, actor) {
    const existing = await DocumentRepository.findByIdForUser(documentId, userId);
    if (!existing) {
      const err = new Error('Document not found');
      err.status = 404;
      throw err;
    }

    let mediaAssetId = body.mediaAssetId || existing.mediaAssetId;
    if (body.file?.buffer) {
      const asset = await createMediaAssetFromBuffer({
        buffer: body.file.buffer,
        originalname: body.file.originalname,
        mimetype: body.file.mimetype,
        folder: 'talent-documents',
        uploadedBy: userId,
      });
      mediaAssetId = asset._id;
    }

    const nextVersion = (existing.versionNumber || 1) + 1;
    await DocumentRepository.markVersionsNotCurrent(existing.versionGroupId, null);

    const doc = await DocumentRepository.create({
      parentType: existing.parentType,
      parentId: existing.parentId,
      talentProfileId: existing.talentProfileId,
      userId,
      label: body.label || existing.label,
      documentType: body.documentType || existing.documentType,
      mediaAssetId,
      versionGroupId: existing.versionGroupId,
      versionNumber: nextVersion,
      isCurrentVersion: true,
      tags: body.tags || existing.tags,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : existing.expiresAt,
      visibility: body.visibility || existing.visibility,
      downloadPermission: body.downloadPermission || existing.downloadPermission,
      status: 'active',
      locale: existing.locale,
      metadata: body.metadata || existing.metadata,
    });

    await DocumentRepository.markVersionsNotCurrent(existing.versionGroupId, doc._id);

    const plain = doc.toObject ? doc.toObject() : doc;
    emitDocumentEvent('DocumentVersionCreated', plain, { previousDocumentId: String(documentId) }, actor || actorFromUserId(userId));
    return enrichForClient(plain);
  },

  async update(userId, documentId, body, actor) {
    const existing = await DocumentRepository.findByIdForUser(documentId, userId);
    if (!existing) {
      const err = new Error('Document not found');
      err.status = 404;
      throw err;
    }

    const parsed = parseDocumentInput(body);
    const errors = validateDocumentInput({ ...existing, ...parsed }, { partial: true });
    if (errors.length) validationError(errors);

    const patch = {};
    if (parsed.label !== undefined) patch.label = parsed.label;
    if (parsed.documentType !== undefined) patch.documentType = parsed.documentType;
    if (parsed.visibility !== undefined) patch.visibility = parsed.visibility;
    if (parsed.downloadPermission !== undefined) patch.downloadPermission = parsed.downloadPermission;
    if (parsed.tags !== undefined) patch.tags = parsed.tags;
    if (parsed.expiresAt !== undefined) patch.expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt) : null;
    if (parsed.metadata !== undefined) patch.metadata = parsed.metadata;

    const updated = await DocumentRepository.updateById(documentId, patch);
    emitDocumentEvent('DocumentUpdated', updated, { changedFields: Object.keys(patch) }, actor || actorFromUserId(userId));
    return enrichForClient(updated);
  },

  async archive(userId, documentId, actor) {
    const existing = await DocumentRepository.findByIdForUser(documentId, userId);
    if (!existing) {
      const err = new Error('Document not found');
      err.status = 404;
      throw err;
    }
    const archived = await DocumentRepository.archiveById(documentId);
    emitDocumentEvent('DocumentArchived', archived, {}, actor || actorFromUserId(userId));
    return archived;
  },

  async delete(userId, documentId, actor) {
    const existing = await DocumentRepository.findByIdForUser(documentId, userId);
    if (!existing) {
      const err = new Error('Document not found');
      err.status = 404;
      throw err;
    }
    await DocumentRepository.softDeleteById(documentId);
    emitDocumentEvent('DocumentArchived', { ...existing, status: 'deleted' }, { deleted: true }, actor || actorFromUserId(userId));
    return { deleted: true };
  },

  async listVersions(userId, documentId) {
    const doc = await DocumentRepository.findByIdForUser(documentId, userId);
    if (!doc) {
      const err = new Error('Document not found');
      err.status = 404;
      throw err;
    }
    const versions = await DocumentRepository.findVersionsByGroup(doc.versionGroupId, userId);
    return Promise.all(versions.map(enrichForClient));
  },

  canDownload(doc, { userId, isEmployer = false } = {}) {
    if (!doc || doc.status === 'deleted') return false;
    if (String(doc.userId) === String(userId)) return true;
    if (doc.downloadPermission === 'public') return true;
    if (doc.downloadPermission === 'employer_scoped' && isEmployer) return true;
    return false;
  },
};
