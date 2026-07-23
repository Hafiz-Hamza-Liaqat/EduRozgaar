import { TalentProfileRepository } from '../../repositories/career/TalentProfileRepository.js';
import { ResumeVersionRepository } from '../../repositories/career/ResumeVersionRepository.js';
import { ScoreSnapshotRepository } from '../../repositories/career/ScoreSnapshotRepository.js';
import { DocumentService } from './DocumentService.js';
import { CredentialPlatformService } from './CredentialPlatformService.js';
import { OpportunityApplicationService } from './OpportunityApplicationService.js';
import { emitCareerEvent } from './CareerEventBus.js';
import { DashboardCompositionService } from './DashboardCompositionService.js';
import { computeScore, assertProvidersRegistered } from '../../../../shared/scoring/ScoringEngine.js';
import { DEFAULT_WEIGHT_VERSION } from '../../../../shared/scoring/weights.js';
import { registerScoreProvider, clearScoreProviders, getScoreProviderCount } from '../../../../shared/scoring/providerRegistry.js';
import { ALL_FOUNDATION_PROVIDERS } from './scoring/providers.js';
import { isScoringEnabled } from '../../config/careerFeatureFlags.js';
import { Job } from '../../models/Job.js';
import { AssessmentService } from './AssessmentService.js';
import { computeJobMatch } from '../../../../shared/scoring/jobMatchLogic.js';
import { buildUnifiedScoreExplanation } from '../../../../shared/scoring/scoreExplanation.js';
import { evaluateProfileCompleteness } from '../../../../shared/scoring/profileCompletenessRules.js';
import { evaluateResumeQuality } from '../../../../shared/scoring/resumeQualityRules.js';
import { buildSkillGapAnalysis } from '../../../../shared/scoring/skillGapLogic.js';

let providersRegistered = false;

export function registerFoundationProviders() {
  if (providersRegistered && getScoreProviderCount() >= ALL_FOUNDATION_PROVIDERS.length) {
    return;
  }
  clearScoreProviders();
  for (const p of ALL_FOUNDATION_PROVIDERS) {
    registerScoreProvider(p);
  }
  providersRegistered = true;
}

export function buildScoreExplanation(snapshot, scoreType = null) {
  if (!snapshot) return null;
  const type = scoreType || snapshot.scoreType || 'career_readiness';
  const base = buildUnifiedScoreExplanation(
    {
      ...snapshot,
      overall: snapshot.overall,
      factors: snapshot.factors || [],
      version: snapshot.version,
      computedAt: snapshot.computedAt,
      summary: type === 'career_readiness'
        ? `Career readiness score is ${snapshot.overall}/100 (weights ${snapshot.version}).`
        : undefined,
    },
    type,
  );
  if (!base) return null;
  const factors = snapshot.factors || [];
  const weakest = [...factors].sort((a, b) => a.score - b.score).slice(0, 3);
  base.focusAreas = weakest.map((f) => ({
    providerId: f.providerId,
    score: f.score,
    explanation: f.explanation,
  }));
  return base;
}

async function buildScoreContext(userId, profile, extra = {}) {
  const talentProfileId = profile._id;
  const [resumeVersions, documents, credentials, applications, verifiedSkills] = await Promise.all([
    ResumeVersionRepository.findByProfileId(talentProfileId, { limit: 50 }),
    DocumentService.listForUser(userId, {}),
    CredentialPlatformService.listForUser(userId),
    OpportunityApplicationService.listForUser(userId, { limit: 200 }),
    AssessmentService.getEmployerVisibleSkills(userId).catch(() => []),
  ]);

  const profileCompletion = evaluateProfileCompleteness(profile);

  let job = extra.job || null;
  if (!job && extra.jobId) {
    job = await Job.findById(extra.jobId).lean().catch(() => null);
  }

  let readinessSnapshot = extra.readinessSnapshot || null;
  if (!readinessSnapshot && isScoringEnabled()) {
    readinessSnapshot = await ScoreSnapshotRepository.findLatestByUser(userId, 'career_readiness').catch(() => null);
  }

  return {
    userId: String(userId),
    talentProfileId: String(talentProfileId),
    profile,
    resumeVersions: resumeVersions || [],
    documents: documents || [],
    credentials: credentials || [],
    applications: applications || [],
    verifiedSkills: verifiedSkills || [],
    job,
    jobId: job?._id ? String(job._id) : extra.jobId || null,
    readinessSnapshot,
    readinessOverall: readinessSnapshot?.overall ?? null,
    profileCompletionScore: profileCompletion.score,
  };
}

/**
 * ScoringService — compute / getLatest / history (C.8.2).
 */
export const ScoringService = {
  ensureProviders() {
    registerFoundationProviders();
  },

  async buildContextForUser(userId, extra = {}) {
    const profile = await TalentProfileRepository.findByUserId(userId);
    if (!profile) {
      const err = new Error('Talent profile not found');
      err.status = 404;
      throw err;
    }
    return buildScoreContext(userId, profile, extra);
  },

  /**
   * L.2.8 — Job match (computed on demand; job-specific, not persisted as generic latest).
   */
  async computeJobMatch(userId, jobId, options = {}) {
    if (!isScoringEnabled()) {
      const err = new Error('Scoring is disabled');
      err.status = 503;
      throw err;
    }
    const job = await Job.findById(jobId).lean();
    if (!job) {
      const err = new Error('Job not found');
      err.status = 404;
      throw err;
    }
    const profile = await TalentProfileRepository.findByUserId(userId);
    if (!profile) {
      const err = new Error('Talent profile not found');
      err.status = 404;
      throw err;
    }
    const ctx = await buildScoreContext(userId, profile, { job, jobId: String(jobId) });
    const primary = (ctx.resumeVersions || []).find((v) => v.isPrimary) || (ctx.resumeVersions || [])[0];
    const match = computeJobMatch({
      profile: ctx.profile,
      job: ctx.job,
      verifiedSkills: ctx.verifiedSkills || [],
      credentials: ctx.credentials || [],
      readinessOverall: ctx.readinessOverall,
      readinessSnapshot: ctx.readinessSnapshot,
      profileCompletionScore: ctx.profileCompletionScore,
      primaryResumeSnapshot: primary?.snapshot || {},
    });
    const scoreType = options.scoreType === 'employer_match' ? 'employer_match' : 'job_match';
    const explanation = buildUnifiedScoreExplanation(
      {
        overall: match.overall,
        score: match.overall,
        factors: match.factors,
        strengths: match.strengths,
        missing: match.missing,
        improvements: match.improvements,
        explanation: match.explanation,
        version: match.version,
        deterministic: true,
      },
      scoreType,
    );
    return {
      overall: match.overall,
      scoreType,
      version: match.version,
      factors: match.factors,
      strengths: match.strengths,
      missing: match.missing,
      missingRequirements: match.missingRequirements,
      explanation,
      jobId: String(jobId),
      deterministic: true,
      aiUsed: false,
    };
  },

  async getResumeQualityPayload(userId) {
    const profile = await TalentProfileRepository.findByUserId(userId);
    if (!profile) return null;
    const versions = await ResumeVersionRepository.findByProfileId(profile._id, { limit: 20 });
    const result = evaluateResumeQuality({ profile, resumeVersions: versions || [] });
    let snapshot = null;
    try {
      snapshot = await this.getLatest(userId, 'resume_strength', { computeIfMissing: true });
    } catch {
      /* optional */
    }
    return {
      ...result,
      overall: snapshot?.overall ?? result.score,
      snapshot,
      explanation: buildUnifiedScoreExplanation(
        { overall: snapshot?.overall ?? result.score, ...result, factors: snapshot?.factors },
        'resume_strength',
      ),
      deterministic: true,
      aiUsed: false,
    };
  },

  async getSkillGapPayload(userId, { jobId = null, careerGoalTitle = null } = {}) {
    const profile = await TalentProfileRepository.findByUserId(userId);
    if (!profile) return null;
    const [verifiedSkills, credentials, explanation] = await Promise.all([
      AssessmentService.getEmployerVisibleSkills(userId).catch(() => []),
      CredentialPlatformService.listForUser(userId),
      this.getExplanation(userId, 'career_readiness').catch(() => null),
    ]);
    let targetJob = null;
    if (jobId) targetJob = await Job.findById(jobId).lean();
    const goal = careerGoalTitle || profile.careerGoals?.find((g) => g.status === 'active')?.title || null;
    return buildSkillGapAnalysis({
      profile,
      verifiedSkills,
      credentials,
      readinessImprovements: explanation?.improvements || [],
      targetJob,
      careerGoalTitle: goal,
    });
  },

  getCanonicalProfileCompletion(profile) {
    return evaluateProfileCompleteness(profile || {}).score;
  },

  /**
   * Compute and persist an append-only ScoreSnapshot.
   */
  async compute(userId, scoreType = 'career_readiness', options = {}, actor = { type: 'system', id: null }) {
    if (!isScoringEnabled()) {
      const err = new Error('Scoring is disabled');
      err.status = 503;
      throw err;
    }
    this.ensureProviders();
    const version = options.version || DEFAULT_WEIGHT_VERSION;
    assertProvidersRegistered(scoreType, version);

    const profile = await TalentProfileRepository.findByUserId(userId);
    if (!profile) {
      const err = new Error('Talent profile not found');
      err.status = 404;
      throw err;
    }

    const ctx = await buildScoreContext(userId, profile, {
      jobId: options.jobId,
      job: options.job,
    });
    const computed = await computeScore(ctx, scoreType, { version });

    const previous = await ScoreSnapshotRepository.findLatest(profile._id, scoreType);
    const previousOverall = previous?.overall ?? null;
    const delta = previousOverall == null ? null : computed.overall - previousOverall;
    const validUntil = new Date(Date.now() + (computed.ttlMinutes || 15) * 60_000);

    const doc = await ScoreSnapshotRepository.create({
      talentProfileId: profile._id,
      userId,
      scoreType,
      version: computed.version,
      overall: computed.overall,
      factors: computed.factors,
      computedAt: new Date(),
      validUntil,
      previousOverall,
      delta,
    });

    const plain = doc.toObject ? doc.toObject() : doc;

    emitCareerEvent(
      'ScoreSnapshotCreated',
      {
        talentProfileId: String(profile._id),
        userId: String(userId),
        scoreType,
        overall: computed.overall,
        version: computed.version,
        snapshotId: String(plain._id),
      },
      { actor, aggregateType: 'ScoreSnapshot', aggregateId: plain._id }
    );

    emitCareerEvent(
      'CareerScoreComputed',
      {
        talentProfileId: String(profile._id),
        userId: String(userId),
        scoreType,
        overall: computed.overall,
        version: computed.version,
        snapshotId: String(plain._id),
      },
      { actor, aggregateType: 'ScoreSnapshot', aggregateId: plain._id }
    );

    if (scoreType === 'career_readiness') {
      emitCareerEvent(
        'ReadinessUpdated',
        {
          talentProfileId: String(profile._id),
          userId: String(userId),
          overall: computed.overall,
          previousOverall,
          delta,
          version: computed.version,
          snapshotId: String(plain._id),
        },
        { actor, aggregateType: 'ScoreSnapshot', aggregateId: plain._id }
      );
    }

    if (delta != null && Math.abs(delta) >= 5) {
      emitCareerEvent(
        'CareerScoreUpdated',
        {
          talentProfileId: String(profile._id),
          userId: String(userId),
          scoreType,
          overall: computed.overall,
          previousOverall,
          delta,
          version: computed.version,
          snapshotId: String(plain._id),
        },
        { actor, aggregateType: 'ScoreSnapshot', aggregateId: plain._id }
      );
    }

    try {
      await DashboardCompositionService.invalidateForUser(userId);
    } catch {
      /* non-blocking */
    }

    return plain;
  },

  async getLatest(userId, scoreType = 'career_readiness', { computeIfMissing = true } = {}) {
    if (!isScoringEnabled()) {
      const err = new Error('Scoring is disabled');
      err.status = 503;
      throw err;
    }
    let latest = await ScoreSnapshotRepository.findLatestByUser(userId, scoreType);
    const stale = latest?.validUntil && new Date(latest.validUntil).getTime() < Date.now();
    if ((!latest || stale) && computeIfMissing) {
      latest = await this.compute(userId, scoreType);
    }
    return latest;
  },

  async getHistory(userId, scoreType = 'career_readiness', { limit = 20 } = {}) {
    if (!isScoringEnabled()) {
      const err = new Error('Scoring is disabled');
      err.status = 503;
      throw err;
    }
    return ScoreSnapshotRepository.findHistoryByUser(userId, scoreType, { limit });
  },

  async getExplanation(userId, scoreType = 'career_readiness') {
    const snapshot = await this.getLatest(userId, scoreType);
    return buildScoreExplanation(snapshot);
  },

  async getDashboardPayload(userId) {
    if (!isScoringEnabled()) return null;
    try {
      const [latest, history] = await Promise.all([
        this.getLatest(userId, 'career_readiness'),
        this.getHistory(userId, 'career_readiness', { limit: 8 }),
      ]);
      const explanation = buildScoreExplanation(latest);
      const trend = [...history].reverse().map((h) => ({
        overall: h.overall,
        computedAt: h.computedAt,
        version: h.version,
      }));
      return {
        overall: latest?.overall ?? 0,
        version: latest?.version,
        computedAt: latest?.computedAt,
        delta: latest?.delta ?? null,
        previousOverall: latest?.previousOverall ?? null,
        factors: explanation?.factors || [],
        improvements: explanation?.improvements || [],
        focusAreas: explanation?.focusAreas || [],
        trend,
        summary: explanation?.summary || '',
      };
    } catch (err) {
      if (err.status === 404) {
        return {
          overall: 0,
          factors: [],
          improvements: ['Create a Talent Profile to unlock readiness scoring'],
          focusAreas: [],
          trend: [],
          summary: 'No talent profile yet.',
          missingProfile: true,
        };
      }
      return null;
    }
  },
};

// Register at module load for verification and API
registerFoundationProviders();
