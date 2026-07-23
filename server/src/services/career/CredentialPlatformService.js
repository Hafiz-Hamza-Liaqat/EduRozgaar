import { CredentialRepository } from '../../repositories/career/CredentialRepository.js';
import { DocumentRepository } from '../../repositories/career/DocumentRepository.js';
import { TalentProfileRepository } from '../../repositories/career/TalentProfileRepository.js';
import { emitCareerEvent } from './CareerEventBus.js';
import { isDocumentsPlatformEnabled } from '../../config/careerFeatureFlags.js';
import {
  parseCredentialInput,
  validateCredentialInput,
} from '../../../../shared/career/validation.js';
import { trackDocumentPlatformFromEvent } from './careerDocumentBridge.js';
import { onCareerEntitySaved } from '../../utils/contentIntegration.js';

function actorFromUserId(userId) {
  return { type: 'talent', id: String(userId) };
}

function validationError(messages) {
  const err = new Error(messages.join('; '));
  err.status = 400;
  throw err;
}

function emitCredentialEvent(eventType, cred, payload, actor) {
  const event = emitCareerEvent(
    eventType,
    {
      credentialId: String(cred._id),
      talentProfileId: String(cred.talentProfileId),
      title: cred.title,
      issuer: cred.issuer,
      skillName: cred.skillName,
      score: cred.score,
      verificationStatus: cred.verificationStatus,
      ...payload,
    },
    {
      actor,
      aggregateType: 'Credential',
      aggregateId: cred._id,
      locale: cred.locale,
    }
  );
  trackDocumentPlatformFromEvent(event, { userId: cred.userId });
  return event;
}

export const CredentialPlatformService = {
  async listForUser(userId) {
    const profile = await TalentProfileRepository.findByUserId(userId);
    if (!profile) return [];
    return CredentialRepository.findByProfileId(profile._id);
  },

  async getById(userId, credentialId) {
    const cred = await CredentialRepository.findByIdForUser(credentialId, userId);
    if (!cred) {
      const err = new Error('Credential not found');
      err.status = 404;
      throw err;
    }
    return cred;
  },

  async issue(userId, body, actor) {
    if (!isDocumentsPlatformEnabled()) {
      const err = new Error('Credentials platform is disabled');
      err.status = 503;
      throw err;
    }

    const profile = await TalentProfileRepository.findByUserId(userId);
    if (!profile) {
      const err = new Error('Talent profile not found');
      err.status = 404;
      throw err;
    }

    const parsed = parseCredentialInput(body);
    const errors = validateCredentialInput(parsed);
    if (errors.length) validationError(errors);

    if (parsed.documentId) {
      const doc = await DocumentRepository.findByIdForUser(parsed.documentId, userId);
      if (!doc) {
        const err = new Error('Proof document not found');
        err.status = 404;
        throw err;
      }
    }

    const cred = await CredentialRepository.create({
      talentProfileId: profile._id,
      userId,
      title: parsed.title,
      issuer: parsed.issuer || '',
      description: parsed.description || '',
      verificationStatus: parsed.verificationStatus || 'pending_verification',
      source: parsed.source || 'manual',
      issuedAt: parsed.issuedAt ? new Date(parsed.issuedAt) : new Date(),
      expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : null,
      documentId: parsed.documentId || null,
      mediaAssetId: parsed.mediaAssetId || null,
      skillName: parsed.skillName || '',
      score: parsed.score ?? null,
      assessmentAttemptId: parsed.assessmentAttemptId || null,
      locale: profile.locale || 'en',
      metadata: parsed.metadata || {},
    });

    const plain = cred.toObject ? cred.toObject() : cred;
    emitCredentialEvent('CredentialIssued', plain, {}, actor || actorFromUserId(userId));
    return plain;
  },

  async verify(userId, credentialId, actor) {
    const existing = await CredentialRepository.findByIdForUser(credentialId, userId);
    if (!existing) {
      const err = new Error('Credential not found');
      err.status = 404;
      throw err;
    }

    const updated = await CredentialRepository.updateById(credentialId, {
      verificationStatus: 'active',
    });
    emitCredentialEvent('CredentialVerified', updated, {}, actor || actorFromUserId(userId));
    onCareerEntitySaved('credential', credentialId, { locale: updated.locale });
    return updated;
  },

  async revoke(userId, credentialId, actor) {
    const existing = await CredentialRepository.findByIdForUser(credentialId, userId);
    if (!existing) {
      const err = new Error('Credential not found');
      err.status = 404;
      throw err;
    }

    const updated = await CredentialRepository.updateById(credentialId, {
      verificationStatus: 'revoked',
    });
    emitCredentialEvent('CredentialRevoked', updated, {}, actor || actorFromUserId(userId));
    return updated;
  },

  async update(userId, credentialId, body, actor) {
    const existing = await CredentialRepository.findByIdForUser(credentialId, userId);
    if (!existing) {
      const err = new Error('Credential not found');
      err.status = 404;
      throw err;
    }

    const parsed = parseCredentialInput(body);
    const patch = {};
    if (parsed.title !== undefined) patch.title = parsed.title;
    if (parsed.issuer !== undefined) patch.issuer = parsed.issuer;
    if (parsed.description !== undefined) patch.description = parsed.description;
    if (parsed.expiresAt !== undefined) patch.expiresAt = parsed.expiresAt ? new Date(parsed.expiresAt) : null;
    if (parsed.metadata !== undefined) patch.metadata = parsed.metadata;

    const updated = await CredentialRepository.updateById(credentialId, patch);
    emitCredentialEvent('CredentialIssued', updated, { updated: true }, actor || actorFromUserId(userId));
    return updated;
  },
};
