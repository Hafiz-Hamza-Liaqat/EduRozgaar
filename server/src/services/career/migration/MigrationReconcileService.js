import { User } from '../../../models/User.js';
import { Application } from '../../../models/Application.js';
import { ProfileDocument } from '../../../models/career/ProfileDocument.js';
import { TalentProfileRepository } from '../../../repositories/career/TalentProfileRepository.js';
import { OpportunityApplicationRepository } from '../../../repositories/career/OpportunityApplicationRepository.js';
import { DocumentRepository } from '../../../repositories/career/DocumentRepository.js';
import { CredentialRepository } from '../../../repositories/career/CredentialRepository.js';
import { TalentProfile } from '../../../models/career/TalentProfile.js';
import { getFeatureFlagMatrix } from '../../../config/careerFeatureFlags.js';

/**
 * Migration reconcile / checkpoint report (C.8.0.7).
 * Additive only — never deletes legacy data.
 */
export const MigrationReconcileService = {
  async checkpointCp1() {
    const eligibleUsers = await User.countDocuments({ role: 'User' });
    const profileCount = await TalentProfileRepository.countAll();
    const coverage = eligibleUsers === 0 ? 1 : profileCount / eligibleUsers;
    return {
      checkpoint: 'CP1',
      name: 'TalentProfile coverage',
      eligibleUsers,
      talentProfiles: profileCount,
      coverage: Number(coverage.toFixed(4)),
      pass: profileCount >= eligibleUsers,
    };
  },

  async checkpointCp2() {
    const legacyApps = await Application.countDocuments({});
    const oaTotal = await OpportunityApplicationRepository.countAll();
    const oaLinked = await OpportunityApplicationRepository.countWithLegacyLink();
    return {
      checkpoint: 'CP2',
      name: 'Application ↔ OpportunityApplication parity',
      legacyApplications: legacyApps,
      opportunityApplications: oaTotal,
      linkedViaLegacyId: oaLinked,
      pass: legacyApps === 0 || oaLinked >= legacyApps,
    };
  },

  async checkpointCp3() {
    const users = await User.find({ role: 'User' })
      .select('savedJobs savedScholarships savedAdmissions savedInternships')
      .lean();
    let savedTotal = 0;
    for (const u of users) {
      savedTotal += (u.savedJobs?.length || 0)
        + (u.savedScholarships?.length || 0)
        + (u.savedAdmissions?.length || 0)
        + (u.savedInternships?.length || 0);
    }
    return {
      checkpoint: 'CP3',
      name: 'Bookmark / saved* baseline',
      savedArrayTotal: savedTotal,
      bookmarkCollection: 'not_migrated',
      pass: true,
      note: 'Bookmark model migration (M3) deferred — baseline recorded for future parity',
    };
  },

  async documentParity() {
    const legacy = await ProfileDocument.countDocuments({ status: { $ne: 'deleted' } });
    const canonical = await DocumentRepository.countAll();
    const linked = await DocumentRepository.countWithLegacyLink();
    return {
      name: 'Document mapping',
      legacyProfileDocuments: legacy,
      canonicalDocuments: canonical,
      linkedViaLegacyId: linked,
      pass: legacy === 0 || linked >= legacy,
    };
  },

  async credentialParity() {
    const profiles = await TalentProfile.find({}).select('certificationReferences').lean();
    let refCount = 0;
    for (const p of profiles) {
      refCount += (p.certificationReferences || []).filter((c) => c.name).length;
    }
    const credentialCount = await CredentialRepository.countAll();
    return {
      name: 'Credential mapping',
      certificationReferences: refCount,
      credentials: credentialCount,
      pass: true,
      note: 'References may exceed credentials when duplicates filtered',
    };
  },

  async fullReport() {
    const [cp1, cp2, cp3, documents, credentials] = await Promise.all([
      this.checkpointCp1(),
      this.checkpointCp2(),
      this.checkpointCp3(),
      this.documentParity(),
      this.credentialParity(),
    ]);
    const flags = getFeatureFlagMatrix();
    const allPass = [cp1, cp2, cp3, documents].every((c) => c.pass);
    return {
      generatedAt: new Date().toISOString(),
      flags,
      checkpoints: { cp1, cp2, cp3 },
      documents,
      credentials,
      overallPass: allPass,
      rollback: {
        strategy: 'Disable APPLICATION_DUAL_WRITE / APPLICATION_READ_CANONICAL / TALENT_PROFILE_READ_CANONICAL / CAREER_DASHBOARD_ENABLED as needed. Legacy collections remain untouched.',
        noDeletes: true,
      },
    };
  },
};
