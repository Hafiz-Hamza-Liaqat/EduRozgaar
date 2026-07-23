import { Job } from '../../models/Job.js';
import { Scholarship } from '../../models/Scholarship.js';
import { Admission } from '../../models/Admission.js';
import { Internship } from '../../models/Internship.js';

const RESOLVERS = {
  job: (id) => Job.findById(id).select('_id title employerId organization').lean(),
  scholarship: (id) => Scholarship.findById(id).select('_id title provider').lean(),
  admission: (id) => Admission.findById(id).select('_id program institution').lean(),
  internship: (id) => Internship.findById(id).select('_id title organization').lean(),
  graduate_program: (id) => Admission.findById(id).select('_id program institution').lean(),
  fellowship: (id) => Scholarship.findById(id).select('_id title provider').lean(),
};

/**
 * Validates opportunity reference points to an existing listing — no duplication.
 */
export async function resolveOpportunityReference(opportunityRef) {
  if (!opportunityRef?.opportunityType) return null;
  if (!opportunityRef.opportunityId) return { valid: true, external: true };

  const resolver = RESOLVERS[opportunityRef.opportunityType];
  if (!resolver) {
    const err = new Error(`Unsupported opportunity type: ${opportunityRef.opportunityType}`);
    err.status = 400;
    throw err;
  }

  const doc = await resolver(opportunityRef.opportunityId);
  if (!doc) {
    const err = new Error('Opportunity not found');
    err.status = 404;
    throw err;
  }

  return {
    valid: true,
    doc,
    title: doc.title || doc.program || '',
    organizationId: doc.employerId || null,
  };
}
