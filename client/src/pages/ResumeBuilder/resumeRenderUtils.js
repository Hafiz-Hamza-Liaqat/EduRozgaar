import { normalizeResumeSkills } from './resumeDefaults';

function trim(v) {
  return v == null ? '' : String(v).trim();
}

function hasAny(obj, keys) {
  return keys.some((k) => trim(obj[k]));
}

function filterEntries(arr, keys) {
  return (arr || []).filter((item) => item && hasAny(item, keys));
}

/** Normalize resume editor state into a stable view-model for preview + PDF. */
export function buildResumeViewModel(resume) {
  const p = resume?.personalInfo || {};
  const skills = normalizeResumeSkills(resume?.skills);

  const location = [trim(p.city), trim(p.province)].filter(Boolean).join(', ');

  return {
    personal: {
      fullName: trim(p.fullName),
      professionalTitle: trim(p.professionalTitle),
      email: trim(p.email),
      phone: trim(p.phone),
      city: trim(p.city),
      province: trim(p.province),
      location,
      linkedInUrl: trim(p.linkedInUrl),
      githubUrl: trim(p.githubUrl),
      portfolioUrl: trim(p.portfolioUrl),
      profilePhotoUrl: trim(p.profilePhotoUrl),
    },
    careerObjective: trim(resume?.careerObjective),
    education: filterEntries(resume?.education, ['degree', 'university', 'fieldOfStudy', 'graduationYear', 'gpa']),
    technicalSkills: skills.technical,
    softSkills: skills.soft,
    experience: filterEntries(resume?.experience, ['company', 'role', 'duration', 'description']),
    projects: filterEntries(resume?.projects, ['title', 'description', 'technologies']),
    certifications: (resume?.certifications || []).map(trim).filter(Boolean),
    languages: (resume?.languages || []).map(trim).filter(Boolean),
    references: filterEntries(resume?.references, ['name', 'title', 'company', 'email', 'phone']),
    awards: filterEntries(resume?.awards, ['title', 'issuer', 'year', 'description']),
    volunteerExperience: filterEntries(resume?.volunteerExperience, ['organization', 'role', 'duration', 'description']),
    publications: filterEntries(resume?.publications, ['title', 'publisher', 'year', 'url', 'description']),
    interests: (resume?.interests || []).map(trim).filter(Boolean),
    professionalMemberships: filterEntries(resume?.professionalMemberships, ['organization', 'role', 'since']),
  };
}

export function displayName(personal) {
  return personal.fullName || 'Your Name';
}
