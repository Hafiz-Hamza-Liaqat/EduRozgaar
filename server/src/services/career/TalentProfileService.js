import { User } from '../../models/User.js';
import { Resume } from '../../models/Resume.js';
import { TalentProfileRepository } from '../../repositories/career/TalentProfileRepository.js';
import { emitCareerEvent } from './CareerEventBus.js';
import { ProfileValidationService } from './ProfileValidationService.js';
import { isTalentProfileDualWrite, isTalentProfileEnabled } from '../../config/careerFeatureFlags.js';
import { onCareerEntitySaved } from '../../utils/contentIntegration.js';
import { trackCareerAnalyticsFromEvent } from './careerAnalyticsBridge.js';

function actorFromUserId(userId) {
  return { type: 'talent', id: String(userId) };
}

function mapResumeToProfileFields(resume, user) {
  const pi = resume?.personalInfo || {};
  return {
    displayName: pi.fullName || user?.name || '',
    headline: pi.professionalTitle || '',
    summary: resume?.careerObjective || '',
    avatarUrl: pi.profilePhotoUrl || '',
    socialProfile: {
      linkedInUrl: pi.linkedInUrl || '',
      githubUrl: pi.githubUrl || '',
      portfolioUrl: pi.portfolioUrl || '',
      websiteUrl: '',
      twitterUrl: '',
    },
    education: (resume?.education || []).map((e) => ({
      degree: e.degree || '',
      institution: e.university || '',
      fieldOfStudy: e.fieldOfStudy || '',
      endYear: e.graduationYear || '',
      gpa: e.gpa || '',
    })),
    experience: (resume?.experience || []).map((e) => ({
      company: e.company || '',
      role: e.role || '',
      description: e.description || '',
      startDate: '',
      endDate: e.duration || '',
    })),
    skills: [
      ...(resume?.skills?.technical || []).map((name) => ({ name, level: 'intermediate', source: 'imported' })),
      ...(resume?.skills?.soft || []).map((name) => ({ name, level: 'intermediate', source: 'imported' })),
    ],
    languages: (resume?.languages || []).map((language) => ({ language, proficiency: 'conversational' })),
    certificationReferences: (resume?.certifications || []).map((name) => ({ name, issuer: '' })),
    portfolioReferences: (resume?.projects || []).map((p) => ({
      title: p.title || '',
      description: p.description || '',
      technologies: p.technologies ? String(p.technologies).split(',').map((s) => s.trim()) : [],
    })),
    interests: [...(resume?.interests || []), ...(user?.interests || [])].filter(Boolean),
    preferences: {
      preferredMarkets: user?.province ? [user.province] : [],
    },
    market: user?.province || '',
    locale: user?.preferredLanguage || 'en',
    legacyResumeId: resume?._id,
    hydrationSource: resume ? 'resume' : 'user',
  };
}

function buildResumeSnapshotFromProfile(profile) {
  return {
    displayName: profile.displayName,
    headline: profile.headline,
    summary: profile.summary,
    education: profile.education,
    experience: profile.experience,
    skills: profile.skills,
    languages: profile.languages,
    certifications: profile.certificationReferences,
    projects: profile.portfolioReferences,
    socialProfile: profile.socialProfile,
  };
}

async function dualWriteLegacyResume(profile) {
  if (!isTalentProfileDualWrite()) return null;

  const resumePayload = {
    userId: profile.userId,
    title: 'My Resume',
    personalInfo: {
      fullName: profile.displayName,
      professionalTitle: profile.headline,
      linkedInUrl: profile.socialProfile?.linkedInUrl || '',
      githubUrl: profile.socialProfile?.githubUrl || '',
      portfolioUrl: profile.socialProfile?.portfolioUrl || '',
      profilePhotoUrl: profile.avatarUrl || '',
    },
    careerObjective: profile.summary || '',
    education: (profile.education || []).map((e) => ({
      degree: e.degree,
      university: e.institution,
      fieldOfStudy: e.fieldOfStudy,
      graduationYear: e.endYear,
      gpa: e.gpa,
    })),
    experience: (profile.experience || []).map((e) => ({
      company: e.company,
      role: e.role,
      duration: e.endDate || e.startDate || '',
      description: e.description,
    })),
    skills: {
      technical: (profile.skills || []).filter((s) => s.source !== 'self_reported').map((s) => s.name),
      soft: (profile.skills || []).filter((s) => s.source === 'self_reported').map((s) => s.name),
    },
    projects: (profile.portfolioReferences || []).map((p) => ({
      title: p.title,
      description: p.description,
      technologies: (p.technologies || []).join(', '),
    })),
    certifications: (profile.certificationReferences || []).map((c) => c.name).filter(Boolean),
    languages: (profile.languages || []).map((l) => l.language).filter(Boolean),
    interests: profile.interests || [],
  };

  const existing = profile.legacyResumeId
    ? await Resume.findById(profile.legacyResumeId)
    : await Resume.findOne({ userId: profile.userId }).sort({ updatedAt: -1 });

  if (existing) {
    Object.assign(existing, resumePayload);
    await existing.save();
    return existing;
  }

  return Resume.create(resumePayload);
}

export const TalentProfileService = {
  async getByUserId(userId) {
    return TalentProfileRepository.findByUserId(userId);
  },

  async getOrCreateForUser(userId, actor = null) {
    const existing = await TalentProfileRepository.findByUserId(userId);
    if (existing) return existing;

    const user = await User.findById(userId).lean();
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }

    const resume = await Resume.findOne({ userId }).sort({ updatedAt: -1 }).lean();
    const seed = mapResumeToProfileFields(resume, user);
    const parsed = ProfileValidationService.assertTalentProfile({
      ...seed,
      displayName: seed.displayName || user.name || 'User',
      status: 'draft',
    });

    const profile = await TalentProfileRepository.create({
      userId,
      ...parsed,
    });

    const event = emitCareerEvent(
      'TalentProfileCreated',
      { userId: String(userId), visibility: profile.visibility, hydrationSource: profile.hydrationSource },
      {
        actor: actor || actorFromUserId(userId),
        aggregateType: 'TalentProfile',
        aggregateId: profile._id,
        locale: profile.locale,
        market: profile.market,
      }
    );
    trackCareerAnalyticsFromEvent(event, { userId });
    if (profile.visibility === 'public') {
      onCareerEntitySaved('talent-profile', profile._id, { locale: profile.locale });
    }

    return profile.toObject ? profile.toObject() : profile;
  },

  async create(userId, body, actor) {
    const existing = await TalentProfileRepository.findByUserId(userId);
    if (existing) {
      const err = new Error('Talent profile already exists');
      err.status = 409;
      throw err;
    }

    const parsed = ProfileValidationService.assertTalentProfile(body);
    const profile = await TalentProfileRepository.create({ userId, ...parsed, hydrationSource: 'manual' });

    const event = emitCareerEvent(
      'TalentProfileCreated',
      { userId: String(userId), visibility: profile.visibility },
      {
        actor: actor || actorFromUserId(userId),
        aggregateType: 'TalentProfile',
        aggregateId: profile._id,
        locale: profile.locale,
        market: profile.market,
      }
    );
    trackCareerAnalyticsFromEvent(event, { userId });
    if (profile.visibility === 'public') {
      onCareerEntitySaved('talent-profile', profile._id, { locale: profile.locale });
    }

    await dualWriteLegacyResume(profile);
    return profile.toObject ? profile.toObject() : profile;
  },

  async update(userId, body, actor, options = {}) {
    const profile = await TalentProfileRepository.findByUserId(userId);
    if (!profile) {
      const err = new Error('Talent profile not found');
      err.status = 404;
      throw err;
    }

    const parsed = ProfileValidationService.assertTalentProfile(body, { partial: true });
    // Preserve linkage fields that validation may strip
    const patch = { ...parsed };
    if (body.legacyResumeId) patch.legacyResumeId = body.legacyResumeId;
    if (body.hydrationSource) patch.hydrationSource = body.hydrationSource;

    const updated = await TalentProfileRepository.updateById(profile._id, patch);
    if (!updated) {
      const err = new Error('Talent profile not found');
      err.status = 404;
      throw err;
    }

    const event = emitCareerEvent(
      'TalentProfileUpdated',
      {
        userId: String(userId),
        visibility: updated.visibility,
        changedSections: Object.keys(parsed),
      },
      {
        actor: actor || actorFromUserId(userId),
        aggregateType: 'TalentProfile',
        aggregateId: updated._id,
        locale: updated.locale,
        market: updated.market,
      }
    );
    trackCareerAnalyticsFromEvent(event, { userId });
    onCareerEntitySaved('talent-profile', updated._id, { locale: updated.locale });

    if (!options.skipDualWrite) {
      await dualWriteLegacyResume(updated);
    }
    return updated.toObject ? updated.toObject() : updated;
  },

  async archive(userId, actor) {
    const profile = await TalentProfileRepository.findByUserId(userId);
    if (!profile) {
      const err = new Error('Talent profile not found');
      err.status = 404;
      throw err;
    }

    const updated = await TalentProfileRepository.archiveByUserId(userId);
    const event = emitCareerEvent(
      'TalentProfileUpdated',
      { userId: String(userId), status: 'archived' },
      {
        actor: actor || actorFromUserId(userId),
        aggregateType: 'TalentProfile',
        aggregateId: profile._id,
      }
    );
    trackCareerAnalyticsFromEvent(event, { userId });
    return updated;
  },

  mapResumeToProfileFields,
  buildResumeSnapshotFromProfile,

  /**
   * Reverse dual-write: legacy Resume save → TalentProfile (when TALENT_PROFILE_DUAL_WRITE=1).
   * Idempotent upsert by userId; links legacyResumeId.
   */
  async syncFromLegacyResume(userId, resume, actor = null) {
    if (!isTalentProfileDualWrite() || !isTalentProfileEnabled()) return null;
    const user = await User.findById(userId).lean();
    const seed = mapResumeToProfileFields(resume, user);
    let profile = await TalentProfileRepository.findByUserId(userId);
    if (!profile) {
      profile = await this.getOrCreateForUser(userId, actor);
    }
    return this.update(
      userId,
      {
        ...seed,
        legacyResumeId: resume?._id || profile.legacyResumeId,
        hydrationSource: profile.hydrationSource === 'manual' ? 'resume' : profile.hydrationSource,
      },
      actor,
      { skipDualWrite: true }
    );
  },
};
