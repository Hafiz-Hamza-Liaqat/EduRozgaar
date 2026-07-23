export const TEMPLATE_IDS = ['modern-professional', 'minimal-ats', 'creative-portfolio', 'academic-cv'];

export const TEMPLATE_NAMES = {
  'modern-professional': 'Modern Professional',
  'minimal-ats': 'Minimal ATS Friendly',
  'creative-portfolio': 'Creative Portfolio',
  'academic-cv': 'Academic CV (Scholarships & Universities)',
};

export const WIZARD_STEPS = [
  { id: 'personal', label: 'Personal Info' },
  { id: 'objective', label: 'Career Objective' },
  { id: 'education', label: 'Education' },
  { id: 'skills', label: 'Skills' },
  { id: 'experience', label: 'Experience' },
  { id: 'projects', label: 'Projects' },
  { id: 'certifications', label: 'Certifications' },
  { id: 'languages', label: 'Languages' },
  { id: 'additional', label: 'Additional' },
];

export const defaultPersonalInfo = () => ({
  fullName: '',
  professionalTitle: '',
  email: '',
  phone: '',
  city: '',
  province: '',
  linkedInUrl: '',
  githubUrl: '',
  portfolioUrl: '',
  profilePhotoUrl: '',
});

export const defaultEducationEntry = () => ({
  degree: '',
  university: '',
  fieldOfStudy: '',
  graduationYear: '',
  gpa: '',
});

export const defaultExperienceEntry = () => ({
  company: '',
  role: '',
  duration: '',
  description: '',
});

export const defaultProjectEntry = () => ({
  title: '',
  description: '',
  technologies: '',
});

export const defaultReferenceEntry = () => ({
  name: '',
  title: '',
  company: '',
  email: '',
  phone: '',
});

export const defaultAwardEntry = () => ({
  title: '',
  issuer: '',
  year: '',
  description: '',
});

export const defaultVolunteerEntry = () => ({
  organization: '',
  role: '',
  duration: '',
  description: '',
});

export const defaultPublicationEntry = () => ({
  title: '',
  publisher: '',
  year: '',
  url: '',
  description: '',
});

export const defaultMembershipEntry = () => ({
  organization: '',
  role: '',
  since: '',
});

/** Split multiline or comma-separated skill text; trim, dedupe, preserve order. */
export function parseSkillLines(text) {
  const out = [];
  const seen = new Set();
  for (const part of String(text || '').split(/[\n,]/)) {
    const s = part.trim();
    if (!s) continue;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export function normalizeSkillList(value) {
  if (Array.isArray(value)) {
    const out = [];
    const seen = new Set();
    for (const item of value) {
      for (const part of parseSkillLines(item)) {
        const key = part.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          out.push(part);
        }
      }
    }
    return out;
  }
  if (typeof value === 'string') return parseSkillLines(value);
  return [];
}

export function normalizeResumeSkills(skills) {
  return {
    technical: normalizeSkillList(skills?.technical),
    soft: normalizeSkillList(skills?.soft),
  };
}

export const defaultResume = () => ({
  title: 'My Resume',
  template: 'modern-professional',
  personalInfo: defaultPersonalInfo(),
  careerObjective: '',
  education: [],
  skills: { technical: [], soft: [] },
  experience: [],
  projects: [],
  certifications: [],
  languages: [],
  references: [],
  awards: [],
  volunteerExperience: [],
  publications: [],
  interests: [],
  professionalMemberships: [],
});

export const CAREER_OBJECTIVE_SUGGESTION =
  'Motivated Software Engineering student seeking opportunities to apply programming skills and contribute to innovative projects.';

export const SKILL_SUGGESTIONS = {
  technical: ['JavaScript', 'Python', 'React', 'Node.js', 'Git', 'SQL', 'REST APIs', 'HTML/CSS'],
  soft: ['Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Time Management'],
};

export const RESUME_TIPS = [
  'Use bullet points for experience and projects.',
  'Highlight measurable achievements (e.g. "Increased X by 20%").',
  'Avoid spelling and grammar mistakes—proofread carefully.',
  'Long resumes are supported—PDF export will paginate automatically.',
];
