/**
 * L.2.6 — Deterministic career guidance content (no AI).
 * Pakistan salary bands are indicative ranges for orientation only.
 */

export const DEGREE_ROADMAPS = [
  {
    id: 'computerScience',
    title: 'Computer Science / Software',
    relatedDegrees: ['BS Computer Science', 'Software Engineering', 'IT', 'Computer Engineering'],
    roles: ['Junior Software Engineer', 'Web Developer', 'QA Engineer', 'Data Analyst', 'DevOps Intern'],
    requiredSkills: ['Programming fundamentals', 'Data structures basics', 'Git', 'SQL', 'Communication'],
    certifications: ['freeCodeCamp certs', 'Google IT Support (optional)', 'AWS Cloud Practitioner (later)'],
    salaryPakistanPkr: { junior: '60,000–120,000', mid: '150,000–300,000', note: 'Varies by city, English, and stack' },
    progression: ['Intern / Junior', 'Mid Engineer', 'Senior / Lead', 'Architect or Engineering Manager'],
    learning: [
      { label: 'Programming Fundamentals assessment', href: '/assessments/programming-fundamentals' },
      { label: 'MDN Web Docs', href: 'https://developer.mozilla.org/', external: true },
      { label: 'freeCodeCamp', href: 'https://www.freecodecamp.org/learn', external: true },
    ],
    faq: [
      { q: 'Do I need a CS degree?', a: 'Helpful but not mandatory; strong projects, GitHub, and verified skills matter.' },
      { q: 'Where should I start?', a: 'Complete Programming Fundamentals, build 2 portfolio projects, then apply to junior roles.' },
    ],
    links: {
      jobs: '/jobs?q=software',
      internships: '/internships',
      assessments: '/assessments',
      scholarships: '/scholarships',
      admissions: '/admissions',
    },
  },
  {
    id: 'business',
    title: 'Business / Management',
    relatedDegrees: ['BBA', 'MBA', 'Commerce', 'Public Administration'],
    roles: ['Business Analyst', 'Operations Associate', 'Sales Executive', 'HR Coordinator', 'Marketing Associate'],
    requiredSkills: ['MS Office', 'Communication', 'Basic finance literacy', 'Presentation', 'Customer focus'],
    certifications: ['Google Digital Marketing (optional)', 'Excel specialization', 'SHRM intro (HR track)'],
    salaryPakistanPkr: { junior: '45,000–90,000', mid: '100,000–220,000', note: 'Higher in multinationals and sales with incentives' },
    progression: ['Associate', 'Executive / Analyst', 'Manager', 'Senior Manager / Director'],
    learning: [
      { label: 'MS Office assessment', href: '/assessments/ms-office-basics' },
      { label: 'Communication Skills', href: '/assessments/communication-skills-basics' },
      { label: 'Career Aptitude', href: '/assessments/career-aptitude-basics' },
    ],
    faq: [
      { q: 'MBA or experience first?', a: 'Often 1–2 years of work experience improves MBA outcomes; verify with your goals.' },
    ],
    links: {
      jobs: '/jobs?q=business',
      internships: '/internships',
      assessments: '/assessments',
      scholarships: '/scholarships',
      admissions: '/admissions',
    },
  },
  {
    id: 'engineering',
    title: 'Engineering (Non-CS)',
    relatedDegrees: ['Electrical', 'Mechanical', 'Civil', 'Chemical'],
    roles: ['Graduate Engineer Trainee', 'Site Engineer', 'Design Engineer', 'QC Inspector', 'Maintenance Engineer'],
    requiredSkills: ['Core engineering fundamentals', 'AutoCAD/tools as applicable', 'Safety awareness', 'Problem solving', 'Report writing'],
    certifications: ['PEC registration (as applicable)', 'Safety / HSE certificates', 'Vendor tool certifications'],
    salaryPakistanPkr: { junior: '50,000–110,000', mid: '120,000–250,000', note: 'Field allowances can change total package' },
    progression: ['Trainee', 'Engineer', 'Senior Engineer', 'Project / Discipline Lead'],
    learning: [
      { label: 'Problem Solving assessment', href: '/assessments/problem-solving-basics' },
      { label: 'Numerical Reasoning', href: '/assessments/numerical-reasoning-basics' },
      { label: 'English Proficiency', href: '/assessments/english-proficiency-basics' },
    ],
    faq: [
      { q: 'Private vs government?', a: 'Government prefers formal recruitment cycles; private often skills + interviews. Track both on EduRozgaar.' },
    ],
    links: {
      jobs: '/jobs?q=engineer',
      internships: '/internships',
      assessments: '/assessments',
      scholarships: '/scholarships',
      admissions: '/admissions',
    },
  },
  {
    id: 'medical',
    title: 'Medical / Health Sciences',
    relatedDegrees: ['MBBS', 'BDS', 'Pharmacy', 'Nursing', 'DPT'],
    roles: ['House Officer', 'Clinical Pharmacist', 'Nurse', 'Allied Health Professional', 'Medical Affairs Associate'],
    requiredSkills: ['Clinical fundamentals', 'Ethics', 'Communication with patients', 'Documentation', 'Continuous learning'],
    certifications: ['PMDC / relevant council registration', 'BLS/ACLS as required', 'Specialty exams later'],
    salaryPakistanPkr: { junior: '40,000–100,000', mid: '120,000–300,000+', note: 'Clinical settings and city vary widely' },
    progression: ['Trainee / House job', 'General practice / staff', 'Specialization', 'Consultant / leadership'],
    learning: [
      { label: 'Communication Skills', href: '/assessments/communication-skills-basics' },
      { label: 'Verbal Reasoning', href: '/assessments/verbal-reasoning-basics' },
      { label: 'Career Guidance articles', href: '/career-guidance' },
    ],
    faq: [
      { q: 'Non-clinical options?', a: 'Health tech, medical writing, pharma sales, and public health roles also exist.' },
    ],
    links: {
      jobs: '/jobs?q=medical',
      internships: '/internships',
      assessments: '/assessments',
      scholarships: '/scholarships',
      admissions: '/admissions',
    },
  },
  {
    id: 'artsHumanities',
    title: 'Arts / Humanities / Social Sciences',
    relatedDegrees: ['English', 'Media', 'Psychology', 'Sociology', 'Education'],
    roles: ['Content Writer', 'Teacher', 'Social Media Executive', 'Research Assistant', 'Customer Success'],
    requiredSkills: ['Writing', 'Communication', 'Research', 'Digital literacy', 'Presentation'],
    certifications: ['Teaching certificates (where applicable)', 'Google Digital Marketing', 'UX writing courses (optional)'],
    salaryPakistanPkr: { junior: '35,000–80,000', mid: '90,000–180,000', note: 'Portfolio and English fluency strongly affect outcomes' },
    progression: ['Junior creator / teacher', 'Specialist', 'Lead / editor', 'Manager or independent practice'],
    learning: [
      { label: 'English Proficiency', href: '/assessments/english-proficiency-basics' },
      { label: 'Communication Skills', href: '/assessments/communication-skills-basics' },
      { label: 'Verbal Reasoning', href: '/assessments/verbal-reasoning-basics' },
    ],
    faq: [
      { q: 'Can I move into tech?', a: 'Yes via digital marketing, content for SaaS, UX writing, or QA after targeted upskilling.' },
    ],
    links: {
      jobs: '/jobs?q=content',
      internships: '/internships',
      assessments: '/assessments',
      scholarships: '/scholarships',
      admissions: '/admissions',
    },
  },
];

export function getDegreeRoadmap(id) {
  return DEGREE_ROADMAPS.find((d) => d.id === id) || null;
}
