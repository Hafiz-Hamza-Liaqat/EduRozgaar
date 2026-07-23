import { ResumeVersionRepository } from '../../repositories/career/ResumeVersionRepository.js';
import { TalentProfileRepository } from '../../repositories/career/TalentProfileRepository.js';
import { emitCareerEvent } from './CareerEventBus.js';
import { ProfileValidationService } from './ProfileValidationService.js';
import { TalentProfileService } from './TalentProfileService.js';
import { trackCareerAnalyticsFromEvent } from './careerAnalyticsBridge.js';

function actorFromUserId(userId) {
  return { type: 'talent', id: String(userId) };
}

export const ResumeVersionService = {
  async listForUser(userId) {
    const profile = await TalentProfileRepository.findByUserId(userId);
    if (!profile) return [];
    return ResumeVersionRepository.findByProfileId(profile._id);
  },

  async getById(userId, versionId) {
    const version = await ResumeVersionRepository.findByIdForUser(versionId, userId);
    if (!version) {
      const err = new Error('Resume version not found');
      err.status = 404;
      throw err;
    }
    return version;
  },

  async create(userId, body, actor) {
    const profile = await TalentProfileRepository.findByUserId(userId);
    if (!profile) {
      const err = new Error('Talent profile not found');
      err.status = 404;
      throw err;
    }

    const parsed = ProfileValidationService.assertResumeVersion(body);
    const sourceVersion = await ResumeVersionRepository.nextSourceVersion(profile._id);
    const snapshot = parsed.snapshot || TalentProfileService.buildResumeSnapshotFromProfile(profile);

    if (parsed.isPrimary) {
      await ResumeVersionRepository.clearPrimaryForProfile(profile._id);
    }

    const version = await ResumeVersionRepository.create({
      talentProfileId: profile._id,
      userId,
      title: parsed.title || 'My Resume',
      template: parsed.template || 'modern-professional',
      status: parsed.status || 'draft',
      isPrimary: Boolean(parsed.isPrimary),
      sourceVersion,
      snapshot,
      locale: profile.locale || 'en',
      marketTag: profile.market || '',
    });

    const event = emitCareerEvent(
      'ResumeVersionCreated',
      {
        talentProfileId: String(profile._id),
        resumeVersionId: String(version._id),
        isPrimary: version.isPrimary,
      },
      {
        actor: actor || actorFromUserId(userId),
        aggregateType: 'ResumeVersion',
        aggregateId: version._id,
        locale: version.locale,
        market: version.marketTag,
      }
    );
    trackCareerAnalyticsFromEvent(event, { userId });

    if (version.status === 'published') {
      await this.publish(userId, version._id, actor);
    }

    return version.toObject ? version.toObject() : version;
  },

  async update(userId, versionId, body, actor) {
    const existing = await ResumeVersionRepository.findByIdForUser(versionId, userId);
    if (!existing) {
      const err = new Error('Resume version not found');
      err.status = 404;
      throw err;
    }

    const parsed = ProfileValidationService.assertResumeVersion(body, { partial: true });

    if (parsed.isPrimary) {
      await ResumeVersionRepository.clearPrimaryForProfile(existing.talentProfileId, versionId);
    }

    const updated = await ResumeVersionRepository.updateById(versionId, parsed);
    if (!updated) {
      const err = new Error('Resume version not found');
      err.status = 404;
      throw err;
    }

    if (parsed.status === 'published' && existing.status !== 'published') {
      await this.publish(userId, versionId, actor);
    }

    return updated.toObject ? updated.toObject() : updated;
  },

  async publish(userId, versionId, actor) {
    const version = await ResumeVersionRepository.findByIdForUser(versionId, userId);
    if (!version) {
      const err = new Error('Resume version not found');
      err.status = 404;
      throw err;
    }

    const updated = await ResumeVersionRepository.updateById(versionId, { status: 'published' });

    const event = emitCareerEvent(
      'ResumePublished',
      {
        talentProfileId: String(version.talentProfileId),
        resumeVersionId: String(versionId),
        sourceVersion: version.sourceVersion,
      },
      {
        actor: actor || actorFromUserId(userId),
        aggregateType: 'ResumeVersion',
        aggregateId: versionId,
        locale: version.locale,
        market: version.marketTag,
      }
    );
    trackCareerAnalyticsFromEvent(event, { userId });
    return updated;
  },

  async delete(userId, versionId) {
    const existing = await ResumeVersionRepository.findByIdForUser(versionId, userId);
    if (!existing) {
      const err = new Error('Resume version not found');
      err.status = 404;
      throw err;
    }
    await ResumeVersionRepository.deleteById(versionId);
    return { deleted: true };
  },

  async createFromProfile(profile, legacyResume = null, actor = { type: 'system', id: null }) {
    const snapshot = TalentProfileService.buildResumeSnapshotFromProfile(profile);
    const sourceVersion = await ResumeVersionRepository.nextSourceVersion(profile._id);

    const version = await ResumeVersionRepository.create({
      talentProfileId: profile._id,
      userId: profile.userId,
      title: legacyResume?.title || 'My Resume',
      template: legacyResume?.template || 'modern-professional',
      status: 'published',
      isPrimary: true,
      sourceVersion,
      snapshot,
      legacyResumeId: legacyResume?._id,
      locale: profile.locale || 'en',
      marketTag: profile.market || '',
    });

    emitCareerEvent(
      'ResumeVersionCreated',
      {
        talentProfileId: String(profile._id),
        resumeVersionId: String(version._id),
        hydrated: true,
      },
      {
        actor,
        aggregateType: 'ResumeVersion',
        aggregateId: version._id,
      }
    );

    emitCareerEvent(
      'ResumePublished',
      { resumeVersionId: String(version._id), hydrated: true },
      { actor, aggregateType: 'ResumeVersion', aggregateId: version._id }
    );

    return version;
  },
};
