import { AssessmentRepository } from '../../repositories/career/AssessmentRepository.js';
import { AssessmentAttemptRepository } from '../../repositories/career/AssessmentAttemptRepository.js';
import { QuestionBankRepository } from '../../repositories/career/QuestionBankRepository.js';
import { AssessmentCategoryRepository } from '../../repositories/career/AssessmentCategoryRepository.js';
import { TalentProfileRepository } from '../../repositories/career/TalentProfileRepository.js';
import { TalentProfileService } from './TalentProfileService.js';
import { CredentialPlatformService } from './CredentialPlatformService.js';
import { emitCareerEvent } from './CareerEventBus.js';
import {
  isAssessmentsEnabled,
  isAssessmentResultsEnabled,
  isVerifiedCredentialsEnabled,
} from '../../config/careerFeatureFlags.js';
import {
  parseAssessmentInput,
  validateAssessmentInput,
  parseQuestionInput,
  validateQuestionInput,
  parseAttemptSubmitInput,
  validateAttemptSubmitInput,
} from '../../../../shared/career/assessmentValidation.js';
import { Mcq } from '../../models/Mcq.js';
import { trackAssessmentAnalytics } from './careerAssessmentBridge.js';
import mongoose from 'mongoose';

function looksLikeObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value)
    && String(new mongoose.Types.ObjectId(value)) === String(value);
}

function actorFromUserId(userId) {
  return { type: 'talent', id: String(userId) };
}

function validationError(messages) {
  const err = new Error(messages.join('; '));
  err.status = 400;
  throw err;
}

function disabledError(msg = 'Assessments are disabled') {
  const err = new Error(msg);
  err.status = 503;
  throw err;
}

function emitAssessmentEvent(eventType, attemptOrAssessment, payload, actor) {
  const isAttempt = Boolean(attemptOrAssessment.assessmentId);
  const aggregateId = attemptOrAssessment._id;
  const event = emitCareerEvent(
    eventType,
    {
      assessmentId: String(isAttempt ? attemptOrAssessment.assessmentId : attemptOrAssessment._id),
      attemptId: isAttempt ? String(attemptOrAssessment._id) : undefined,
      talentProfileId: attemptOrAssessment.talentProfileId
        ? String(attemptOrAssessment.talentProfileId)
        : payload.talentProfileId,
      userId: attemptOrAssessment.userId ? String(attemptOrAssessment.userId) : payload.userId,
      slug: attemptOrAssessment.slug,
      title: attemptOrAssessment.title,
      ...payload,
    },
    {
      actor,
      aggregateType: isAttempt ? 'AssessmentAttempt' : 'Assessment',
      aggregateId,
      locale: attemptOrAssessment.locale,
    }
  );
  trackAssessmentAnalytics(event);
  return event;
}

async function loadQuestionSet(assessment) {
  // Prefer canonical QuestionBank
  if (assessment.questionBankId) {
    const questions = await QuestionBankRepository.listQuestions(assessment.questionBankId, {
      includeAnswers: true,
    });
    return questions.map((q) => ({
      questionId: q._id,
      legacyMcqId: q.legacyMcqId || null,
      prompt: q.prompt,
      options: q.options,
      correctIndex: q.correctIndex,
    }));
  }

  // Bridge: wrap existing Quiz/Mcq engine without replacing it
  if (assessment.legacyQuizId) {
    const mcqs = await Mcq.find({ quizId: assessment.legacyQuizId, status: 'active' }).lean();
    return mcqs.map((m) => ({
      questionId: null,
      legacyMcqId: m._id,
      prompt: m.question,
      options: m.options || [],
      correctIndex: m.correctIndex,
    }));
  }

  return [];
}

function publicQuestions(snapshot) {
  return snapshot.map((q, idx) => ({
    id: q.questionId || q.legacyMcqId || `q-${idx}`,
    questionId: q.questionId,
    legacyMcqId: q.legacyMcqId,
    prompt: q.prompt,
    options: q.options,
  }));
}

function scoreAnswers(snapshot, answers) {
  let correctCount = 0;
  const graded = [];
  for (let i = 0; i < snapshot.length; i += 1) {
    const q = snapshot[i];
    const byId = answers.find((a) =>
      (q.questionId && String(a.questionId) === String(q.questionId))
      || (q.legacyMcqId && String(a.questionId) === String(q.legacyMcqId))
    );
    const given = byId || answers[i];
    const selectedIndex = given?.selectedIndex;
    const correct = Number(selectedIndex) === Number(q.correctIndex);
    if (correct) correctCount += 1;
    graded.push({
      questionId: q.questionId || undefined,
      legacyMcqId: q.legacyMcqId || undefined,
      selectedIndex: selectedIndex ?? null,
      correct,
    });
  }
  const totalQuestions = snapshot.length;
  const score = totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);
  return { correctCount, totalQuestions, score, graded };
}

/**
 * AssessmentService — catalog, attempt lifecycle, scoring, credential decision (C.8.4).
 * Does not own readiness scoring or duplicate credential storage.
 */
export const AssessmentService = {
  async listCategories() {
    if (!isAssessmentsEnabled()) disabledError();
    return AssessmentCategoryRepository.ensureDefaults();
  },

  async listCatalog(query = {}) {
    if (!isAssessmentsEnabled()) disabledError();
    return AssessmentRepository.findPublished(query);
  },

  async getBySlug(slug) {
    if (!isAssessmentsEnabled()) disabledError();
    const assessment = await AssessmentRepository.findBySlug(slug);
    if (!assessment || assessment.status !== 'published') {
      const err = new Error('Assessment not found');
      err.status = 404;
      throw err;
    }
    return assessment;
  },

  async createAssessment(body, _actor) {
    if (!isAssessmentsEnabled()) disabledError();
    const parsed = parseAssessmentInput(body);
    const errors = validateAssessmentInput(parsed);
    if (errors.length) validationError(errors);
    const doc = await AssessmentRepository.create({
      ...parsed,
      status: parsed.status || 'draft',
      credentialRule: parsed.credentialRule || {
        enabled: true,
        skillName: parsed.skillName || parsed.title,
        credentialTitle: parsed.title,
        minScore: parsed.passingScore ?? 70,
        expiryDays: 365,
        autoVerify: true,
      },
    });
    return doc.toObject ? doc.toObject() : doc;
  },

  async publishAssessment(assessmentId, actor) {
    if (!isAssessmentsEnabled()) disabledError();
    const existing = await AssessmentRepository.findById(assessmentId);
    if (!existing) {
      const err = new Error('Assessment not found');
      err.status = 404;
      throw err;
    }
    const updated = await AssessmentRepository.updateById(assessmentId, {
      status: 'published',
      publishedAt: new Date(),
    });
    const plain = updated.toObject ? updated.toObject() : updated;
    emitAssessmentEvent('AssessmentPublished', plain, {}, actor || { type: 'staff', id: null });
    return plain;
  },

  async createQuestionBank(body) {
    if (!isAssessmentsEnabled()) disabledError();
    const slug = String(body.slug || body.title || '').toLowerCase().replace(/\s+/g, '-').slice(0, 120);
    if (!slug || !body.title) validationError(['title and slug are required']);
    const bank = await QuestionBankRepository.create({
      title: body.title,
      slug,
      description: body.description || '',
      categorySlug: body.categorySlug || '',
      legacyQuizId: body.legacyQuizId || null,
      status: body.status || 'active',
    });
    return bank.toObject ? bank.toObject() : bank;
  },

  async addQuestion(questionBankId, body) {
    if (!isAssessmentsEnabled()) disabledError();
    const parsed = parseQuestionInput(body);
    const errors = validateQuestionInput(parsed);
    if (errors.length) validationError(errors);
    const bank = await QuestionBankRepository.findById(questionBankId);
    if (!bank) {
      const err = new Error('Question bank not found');
      err.status = 404;
      throw err;
    }
    const q = await QuestionBankRepository.createQuestion({
      questionBankId,
      ...parsed,
      questionType: parsed.questionType || 'mcq',
    });
    const count = await QuestionBankRepository.countQuestions(questionBankId);
    await QuestionBankRepository.updateById(questionBankId, { questionCount: count });
    return q.toObject ? q.toObject() : q;
  },

  async startAttempt(userId, assessmentIdOrSlug, actor) {
    if (!isAssessmentsEnabled()) disabledError();
    // L.2.6.5 — auto-provision TalentProfile so assessments work for newly registered users
    let profile = await TalentProfileRepository.findByUserId(userId);
    if (!profile) {
      profile = await TalentProfileService.getOrCreateForUser(userId, actor || actorFromUserId(userId));
    }
    if (!profile) {
      const err = new Error('Talent profile not found');
      err.status = 404;
      throw err;
    }

    let assessment = null;
    if (looksLikeObjectId(assessmentIdOrSlug)) {
      assessment = await AssessmentRepository.findById(assessmentIdOrSlug);
    }
    if (!assessment) {
      assessment = await AssessmentRepository.findBySlug(assessmentIdOrSlug);
    }
    if (!assessment || assessment.status !== 'published') {
      const err = new Error('Assessment not found');
      err.status = 404;
      throw err;
    }

    const open = await AssessmentAttemptRepository.findOpenAttempt(userId, assessment._id);
    if (open) {
      return {
        attempt: open,
        questions: publicQuestions(open.questionSnapshot || []),
        assessment: {
          _id: assessment._id,
          title: assessment.title,
          slug: assessment.slug,
          durationMinutes: assessment.durationMinutes,
          passingScore: assessment.passingScore,
        },
      };
    }

    const attemptCount = await AssessmentAttemptRepository.countByUserAndAssessment(userId, assessment._id);
    if (attemptCount >= (assessment.maxAttempts || 3)) {
      const err = new Error('Maximum attempts reached');
      err.status = 400;
      throw err;
    }

    const snapshot = await loadQuestionSet(assessment);
    if (!snapshot.length) {
      const err = new Error('Assessment has no questions');
      err.status = 400;
      throw err;
    }

    const attempt = await AssessmentAttemptRepository.create({
      assessmentId: assessment._id,
      talentProfileId: profile._id,
      userId,
      status: 'started',
      startedAt: new Date(),
      questionSnapshot: snapshot,
      locale: assessment.locale || profile.locale || 'en',
    });
    const plain = attempt.toObject ? attempt.toObject() : attempt;
    emitAssessmentEvent(
      'AssessmentStarted',
      { ...plain, title: assessment.title, slug: assessment.slug },
      { userId: String(userId), talentProfileId: String(profile._id) },
      actor || actorFromUserId(userId)
    );

    return {
      attempt: plain,
      questions: publicQuestions(snapshot),
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        slug: assessment.slug,
        durationMinutes: assessment.durationMinutes,
        passingScore: assessment.passingScore,
      },
    };
  },

  async submitAttempt(userId, attemptId, body, actor) {
    if (!isAssessmentsEnabled() || !isAssessmentResultsEnabled()) {
      disabledError('Assessment results are disabled');
    }

    const attempt = await AssessmentAttemptRepository.findByIdForUser(attemptId, userId);
    if (!attempt) {
      const err = new Error('Attempt not found');
      err.status = 404;
      throw err;
    }
    if (attempt.status === 'scored' || attempt.status === 'submitted') {
      const err = new Error('Attempt already submitted');
      err.status = 400;
      throw err;
    }

    const parsed = parseAttemptSubmitInput(body);
    const errors = validateAttemptSubmitInput(parsed);
    if (errors.length) validationError(errors);

    const assessment = await AssessmentRepository.findById(attempt.assessmentId);
    if (!assessment) {
      const err = new Error('Assessment not found');
      err.status = 404;
      throw err;
    }

    const { correctCount, totalQuestions, score, graded } = scoreAnswers(
      attempt.questionSnapshot || [],
      parsed.answers
    );
    const passingScore = assessment.passingScore ?? 70;
    const passed = score >= passingScore;
    const now = new Date();

    let credentialId = null;
    const rule = assessment.credentialRule || {};
    const minScore = rule.minScore != null ? rule.minScore : passingScore;
    const shouldIssue = isVerifiedCredentialsEnabled()
      && rule.enabled !== false
      && score >= minScore;

    if (shouldIssue) {
      const skillName = rule.skillName || assessment.skillName || assessment.title;
      const expiresAt = rule.expiryDays
        ? new Date(Date.now() + rule.expiryDays * 24 * 60 * 60 * 1000)
        : null;
      try {
        const cred = await CredentialPlatformService.issue(
          userId,
          {
            title: rule.credentialTitle || `${assessment.title} — Verified`,
            issuer: rule.issuer || 'Strideto Assessments',
            source: 'assessment',
            skillName,
            score,
            verificationStatus: rule.autoVerify === false ? 'pending_verification' : 'active',
            issuedAt: now,
            expiresAt,
            assessmentAttemptId: attempt._id,
            metadata: {
              assessmentId: String(assessment._id),
              assessmentSlug: assessment.slug,
              attemptId: String(attempt._id),
            },
          },
          actor || actorFromUserId(userId)
        );
        credentialId = cred._id;
        if (rule.autoVerify !== false && cred.verificationStatus !== 'active') {
          await CredentialPlatformService.verify(userId, cred._id, actor || actorFromUserId(userId));
        }
      } catch {
        /* credential optional — attempt still scores */
      }
    }

    const result = {
      score,
      correctCount,
      totalQuestions,
      passed,
      passingScore,
      durationSeconds: parsed.durationSeconds,
      scoredAt: now,
      credentialId,
      employerVisibleSummary: assessment.employerVisible
        ? {
          skillName: rule.skillName || assessment.skillName || assessment.title,
          score,
          passed,
          completedAt: now,
          credentialId,
        }
        : undefined,
    };

    const updated = await AssessmentAttemptRepository.updateById(attemptId, {
      status: 'scored',
      submittedAt: now,
      scoredAt: now,
      answers: graded,
      result,
    });
    const plain = updated.toObject ? updated.toObject() : updated;

    const basePayload = {
      userId: String(userId),
      talentProfileId: String(attempt.talentProfileId),
      score,
      passed,
      credentialId: credentialId ? String(credentialId) : null,
      assessmentSlug: assessment.slug,
      title: assessment.title,
    };

    emitAssessmentEvent('AssessmentCompleted', { ...plain, title: assessment.title, slug: assessment.slug }, basePayload, actor || actorFromUserId(userId));
    emitAssessmentEvent(
      passed ? 'AssessmentPassed' : 'AssessmentFailed',
      { ...plain, title: assessment.title, slug: assessment.slug },
      basePayload,
      actor || actorFromUserId(userId)
    );

    try {
      const { DashboardCompositionService } = await import('./DashboardCompositionService.js');
      await DashboardCompositionService.invalidateForUser(userId);
    } catch {
      /* non-blocking */
    }

    return {
      attempt: plain,
      result,
      assessment: {
        _id: assessment._id,
        title: assessment.title,
        slug: assessment.slug,
        passingScore,
      },
    };
  },

  async listMyAttempts(userId, query = {}) {
    if (!isAssessmentsEnabled()) disabledError();
    return AssessmentAttemptRepository.listForUser(userId, query);
  },

  async getAttempt(userId, attemptId) {
    if (!isAssessmentsEnabled()) disabledError();
    const attempt = await AssessmentAttemptRepository.findByIdForUser(attemptId, userId);
    if (!attempt) {
      const err = new Error('Attempt not found');
      err.status = 404;
      throw err;
    }
    return attempt;
  },

  /** Employer-ready summary — no UI; reusable for C.8.5. */
  async getEmployerVisibleSkills(userId) {
    if (!isAssessmentsEnabled()) return [];
    const attempts = await AssessmentAttemptRepository.listScoredForUser(userId, { limit: 50 });
    return attempts
      .filter((a) => a.result?.employerVisibleSummary)
      .map((a) => ({
        attemptId: a._id,
        assessmentId: a.assessmentId,
        ...a.result.employerVisibleSummary,
      }));
  },

  async getDashboardPayload(userId) {
    if (!isAssessmentsEnabled()) return null;
    try {
      const [recent, catalogCount] = await Promise.all([
        AssessmentAttemptRepository.listScoredForUser(userId, { limit: 5 }),
        AssessmentRepository.countPublished(),
      ]);
      const open = await AssessmentAttemptRepository.listForUser(userId, { limit: 20 });
      const inProgress = open.filter((a) => a.status === 'started' || a.status === 'in_progress');

      const assessmentIds = [...new Set(recent.map((a) => String(a.assessmentId)).filter(Boolean))];
      const assessmentDocs = assessmentIds.length
        ? await Promise.all(assessmentIds.map((id) => AssessmentRepository.findById(id)))
        : [];
      const byId = Object.fromEntries(
        assessmentDocs.filter(Boolean).map((doc) => [String(doc._id), doc]),
      );

      return {
        recentAttempts: recent.map((a) => {
          const assessment = byId[String(a.assessmentId)];
          return {
            _id: a._id,
            assessmentId: a.assessmentId,
            categorySlug: assessment?.categorySlug || '',
            title: assessment?.title || '',
            score: a.result?.score,
            passed: a.result?.passed,
            scoredAt: a.scoredAt,
            credentialId: a.result?.credentialId,
          };
        }),
        inProgressCount: inProgress.length,
        publishedCount: catalogCount,
        verifiedFromAssessments: recent.filter((a) => a.result?.credentialId).length,
      };
    } catch {
      return null;
    }
  },
};
