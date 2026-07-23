/**
 * Pakistan-focused launch content generators for idempotent seeding.
 */
export const PK_COMPANIES = [
  { name: 'Systems Limited', industry: 'IT Services', city: 'Lahore', province: 'Punjab', size: '1000-5000', website: 'https://www.systemsltd.com' },
  { name: 'NETSOL Technologies', industry: 'FinTech', city: 'Lahore', province: 'Punjab', size: '500-1000', website: 'https://www.netsoltech.com' },
  { name: 'Contour Software', industry: 'Software', city: 'Karachi', province: 'Sindh', size: '200-500', website: 'https://www.contour-software.com' },
  { name: '10Pearls', industry: 'IT Consulting', city: 'Karachi', province: 'Sindh', size: '1000-5000', website: 'https://www.10pearls.com' },
  { name: 'Arbisoft', industry: 'Software', city: 'Lahore', province: 'Punjab', size: '500-1000', website: 'https://www.arbisoft.com' },
  { name: 'Jazz', industry: 'Telecommunications', city: 'Islamabad', province: 'Islamabad', size: '5000+', website: 'https://www.jazz.com.pk' },
  { name: 'PTCL', industry: 'Telecommunications', city: 'Islamabad', province: 'Islamabad', size: '5000+', website: 'https://www.ptcl.com.pk' },
  { name: 'NADRA', industry: 'Government', city: 'Islamabad', province: 'Islamabad', size: '5000+', website: 'https://www.nadra.gov.pk' },
  { name: 'HEC', industry: 'Education', city: 'Islamabad', province: 'Islamabad', size: '500-1000', website: 'https://www.hec.gov.pk' },
  { name: 'Punjab Government', industry: 'Government', city: 'Lahore', province: 'Punjab', size: '5000+', website: 'https://punjab.gov.pk' },
  { name: 'Sindh Government', industry: 'Government', city: 'Karachi', province: 'Sindh', size: '5000+', website: 'https://www.sindh.gov.pk' },
  { name: 'Meezan Bank', industry: 'Banking', city: 'Karachi', province: 'Sindh', size: '1000-5000', website: 'https://www.meezanbank.com' },
  { name: 'UBL', industry: 'Banking', city: 'Karachi', province: 'Sindh', size: '5000+', website: 'https://www.ubldigital.com' },
  { name: 'HBL', industry: 'Banking', city: 'Karachi', province: 'Sindh', size: '5000+', website: 'https://www.hbl.com' },
  { name: 'Nestlé Pakistan', industry: 'FMCG', city: 'Lahore', province: 'Punjab', size: '1000-5000', website: 'https://www.nestle.pk' },
  { name: 'Engro', industry: 'Conglomerate', city: 'Karachi', province: 'Sindh', size: '5000+', website: 'https://www.engro.com' },
  { name: 'Packages Limited', industry: 'Manufacturing', city: 'Lahore', province: 'Punjab', size: '1000-5000', website: 'https://www.packages.com.pk' },
  { name: 'Google', industry: 'Technology', city: 'Mountain View', province: '', size: '5000+', website: 'https://www.google.com', country: 'USA' },
  { name: 'Microsoft', industry: 'Technology', city: 'Redmond', province: '', size: '5000+', website: 'https://www.microsoft.com', country: 'USA' },
  { name: 'Telenor Pakistan', industry: 'Telecommunications', city: 'Islamabad', province: 'Islamabad', size: '1000-5000', website: 'https://www.telenor.com.pk' },
  { name: 'Bank Alfalah', industry: 'Banking', city: 'Karachi', province: 'Sindh', size: '1000-5000', website: 'https://www.bankalfalah.com' },
  { name: 'Fauji Fertilizer', industry: 'Manufacturing', city: 'Rawalpindi', province: 'Punjab', size: '1000-5000', website: 'https://www.fauji.org.pk' },
];

export const PK_UNIVERSITIES = [
  { name: 'COMSATS University Islamabad', short: 'COMSATS', city: 'Islamabad', province: 'Islamabad', type: 'public', ranking: 1, website: 'https://www.comsats.edu.pk' },
  { name: 'NUST', short: 'NUST', city: 'Islamabad', province: 'Islamabad', type: 'public', ranking: 2, website: 'https://www.nust.edu.pk' },
  { name: 'FAST National University', short: 'FAST', city: 'Lahore', province: 'Punjab', type: 'private', ranking: 3, website: 'https://www.nu.edu.pk' },
  { name: 'LUMS', short: 'LUMS', city: 'Lahore', province: 'Punjab', type: 'private', ranking: 4, website: 'https://www.lums.edu.pk' },
  { name: 'UET Lahore', short: 'UET', city: 'Lahore', province: 'Punjab', type: 'public', ranking: 5, website: 'https://www.uet.edu.pk' },
  { name: 'University of the Punjab', short: 'PU', city: 'Lahore', province: 'Punjab', type: 'public', ranking: 6, website: 'https://www.pu.edu.pk' },
  { name: 'GC University Lahore', short: 'GCU', city: 'Lahore', province: 'Punjab', type: 'public', ranking: 7, website: 'https://www.gcu.edu.pk' },
  { name: 'IIUI', short: 'IIUI', city: 'Islamabad', province: 'Islamabad', type: 'public', ranking: 8, website: 'https://www.iiu.edu.pk' },
  { name: 'Bahria University', short: 'Bahria', city: 'Islamabad', province: 'Islamabad', type: 'semi-government', ranking: 9, website: 'https://www.bahria.edu.pk' },
  { name: 'Air University', short: 'Air University', city: 'Islamabad', province: 'Islamabad', type: 'public', ranking: 10, website: 'https://www.au.edu.pk' },
];

export const SCHOLARSHIP_PROVIDERS = [
  'HEC', 'Erasmus+', 'Chevening', 'Fulbright', 'CSC', 'DAAD', 'MEXT', 'Commonwealth',
  'Turkey Burslari', 'Hungary Stipendium', 'Australia Awards', 'Orange Knowledge',
];

export const JOB_TYPES = ['Government', 'Private', 'Internship'];
export const JOB_CATEGORIES = ['IT', 'Engineering', 'Banking', 'Healthcare', 'Education', 'Sales', 'Marketing', 'HR', 'Finance', 'Government', 'Freelance', 'Remote'];
export const WORK_MODES = ['On-site', 'Remote', 'Hybrid'];
export const EXPERIENCE_LEVELS = ['Fresh Graduate', '1-2 years', '3-5 years', '5+ years', 'Experienced', 'Freelance'];

export const JOB_TITLE_TEMPLATES = [
  'Software Engineer', 'Junior Developer', 'Senior .NET Developer', 'React Developer',
  'Data Analyst', 'Business Analyst', 'HR Officer', 'Marketing Executive',
  'Civil Engineer', 'Electrical Engineer', 'Mechanical Engineer', 'Lecturer',
  'Assistant Director', 'Data Entry Operator', 'Customer Support Representative',
  'Sales Manager', 'Accountant', 'UI/UX Designer', 'DevOps Engineer', 'Project Manager',
  'Content Writer', 'SEO Specialist', 'Network Administrator', 'Security Guard',
  'Medical Officer', 'Staff Nurse', 'Pharmacist', 'Lab Technician',
];

export const PK_CITIES = [
  { city: 'Lahore', province: 'Punjab' },
  { city: 'Karachi', province: 'Sindh' },
  { city: 'Islamabad', province: 'Islamabad' },
  { city: 'Rawalpindi', province: 'Punjab' },
  { city: 'Faisalabad', province: 'Punjab' },
  { city: 'Multan', province: 'Punjab' },
  { city: 'Peshawar', province: 'Khyber Pakhtunkhwa' },
  { city: 'Quetta', province: 'Balochistan' },
];

export const DEGREE_PROGRAMS = [
  'BS Computer Science', 'BS Software Engineering', 'BS Electrical Engineering',
  'BS Business Administration', 'BBA', 'MBA', 'MS Computer Science',
  'BS Data Science', 'BS Artificial Intelligence', 'BS Civil Engineering',
  'BS Mechanical Engineering', 'BS Biotechnology', 'BS Mathematics',
  'BSc Nursing', 'MBBS', 'BDS', 'LLB', 'B.Com', 'M.Com',
];

export const FOREIGN_COUNTRIES = ['Turkey', 'Germany', 'China', 'UK', 'USA', 'Australia', 'Canada', 'Hungary', 'Italy', 'Malaysia', 'South Korea'];

export const EXAM_NAMES = ['PPSC', 'FPSC', 'NTS', 'CSS', 'GAT', 'NAT', 'ECAT', 'MDCAT', 'Punjab Police', 'WAPDA'];

export const MCQ_SUBJECTS = ['General Knowledge', 'English', 'Mathematics', 'Pakistan Studies', 'Islamiyat', 'Computer Science', 'Current Affairs'];

export const CAREER_CATEGORIES = ['Career Path', 'Interview Tips', 'Resume', 'Skills', 'Networking', 'First Job', 'Freelancing', 'Government Jobs'];

export const BLOG_CATEGORIES = ['Jobs', 'Scholarships', 'Admissions', 'Career', 'Exam Prep', 'Study Abroad', 'Technology', 'Student Life'];

export const RESUME_TEMPLATES = [
  { name: 'Modern Professional', templateId: 'modern-professional', category: 'Corporate' },
  { name: 'Minimal ATS', templateId: 'minimal-ats', category: 'ATS-Friendly' },
  { name: 'Creative Portfolio', templateId: 'creative-portfolio', category: 'Creative' },
  { name: 'Academic CV', templateId: 'academic-cv', category: 'Academic' },
];

export function pick(arr, i) {
  return arr[i % arr.length];
}

export function futureDate(daysFromNow, index = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow + (index % 30));
  return d;
}

export function pastDate(daysAgo, index = 0) {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo - (index % 60));
  return d;
}
