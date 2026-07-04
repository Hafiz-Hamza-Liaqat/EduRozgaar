import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, combineSchemas, webPageSchema } from '../../seo/schemas';
import { DEFAULT_KEYWORDS } from '../../seo/config';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants';
import { ScrollReveal } from '../../components/ui/ScrollReveal';

const CAREER_PATHS_BY_DEGREE = [
  {
    degree: 'Computer Science',
    careers: ['Software Engineer', 'Data Scientist', 'AI / ML Engineer', 'DevOps Engineer', 'Product Manager', 'Cybersecurity Analyst'],
  },
  {
    degree: 'Business',
    careers: ['Accountant', 'Marketing Manager', 'HR Specialist', 'Business Analyst', 'Financial Analyst', 'Consultant'],
  },
  {
    degree: 'Engineering',
    careers: ['Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Project Manager', 'Quality Engineer', 'Design Engineer'],
  },
  {
    degree: 'Medical',
    careers: ['Doctor', 'Nurse', 'Pharmacist', 'Medical Researcher', 'Healthcare Administrator', 'Lab Technologist'],
  },
  {
    degree: 'Arts & Humanities',
    careers: ['Content Writer', 'Journalist', 'Teacher', 'Social Worker', 'Graphic Designer', 'Public Relations'],
  },
];

const SKILL_DEVELOPMENT = [
  { skill: 'Web Development', to: ROUTES.BLOG, tag: 'web', description: 'Frontend, backend, and full-stack skills for building modern web apps.' },
  { skill: 'Data Science', to: ROUTES.BLOG, tag: 'data', description: 'Python, statistics, and ML for data-driven roles.' },
  { skill: 'AI & Machine Learning', to: ROUTES.BLOG, tag: 'ai', description: 'Fundamentals and tools for AI/ML careers.' },
  { skill: 'Cybersecurity', to: ROUTES.BLOG, tag: 'security', description: 'Security fundamentals and certifications.' },
  { skill: 'Cloud Computing', to: ROUTES.BLOG, tag: 'cloud', description: 'AWS, Azure, and cloud architecture.' },
];

const RESUME_INTERVIEW_ARTICLES = [
  { title: 'Best CV format for fresh graduates', to: ROUTES.BLOG, description: 'Structure and sections that get shortlisted.' },
  { title: 'How to pass job interviews', to: ROUTES.BLOG, description: 'Common questions, STAR method, and body language.' },
  { title: 'Resume mistakes to avoid', to: ROUTES.BLOG, description: 'Spelling, length, and tailoring tips.' },
];

const CAREER_ARTICLES = [
  { title: 'Choosing the Right Career Path', description: 'Understand your interests, skills, and market demand to decide your field.', to: ROUTES.BLOG, tag: 'Career' },
  { title: 'Skills That Employers Look For', description: 'Technical and soft skills that increase your employability in Pakistan.', to: ROUTES.BLOG, tag: 'Skills' },
  { title: 'How to Prepare for Job Interviews', description: 'Common questions, body language, and follow-up tips.', to: ROUTES.BLOG, tag: 'Jobs' },
  { title: 'FPSC & PPSC Exam Preparation', description: 'Syllabus, past papers, and time management for government exams.', to: ROUTES.EXAM_PREP, tag: 'Exam Prep' },
  { title: 'Building a Professional Network', description: 'LinkedIn, alumni networks, and industry events.', to: ROUTES.BLOG, tag: 'Career' },
  { title: 'First Job: What to Expect', description: 'Transition from student to professional life.', to: ROUTES.BLOG, tag: 'Career' },
];

const JOB_PREP_TIPS = [
  'Tailor your CV to each job description.',
  'Research the company before the interview.',
  'Prepare STAR (Situation, Task, Action, Result) examples.',
  'Follow up with a thank-you email after the interview.',
  'Keep learning: short courses and certifications help.',
];

export default function CareerGuidance() {
  return (
    <>
      <SeoHead
        title="Career Guidance – EduRozgaar"
        description="Career paths by degree, skill development, and resume & interview tips for Pakistani students."
        canonical={ROUTES.CAREER_GUIDANCE}
        keywords={`career guidance, career paths, interview tips, ${DEFAULT_KEYWORDS}`}
        ogType="website"
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Career Guidance', url: ROUTES.CAREER_GUIDANCE },
          ]),
          webPageSchema({
            name: 'Career Guidance – EduRozgaar',
            description: 'Career paths by degree, skill development, and resume & interview tips for Pakistani students.',
            url: ROUTES.CAREER_GUIDANCE,
          })
        )}
      />
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-10">
        <Link to={ROUTES.DASHBOARD} className="text-edur-steel dark:text-edur-sky hover:underline text-sm mb-6 inline-block">← Dashboard</Link>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Career Guidance</h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
          Choose your path, build in-demand skills, and get ready for jobs and interviews.
        </p>

        {/* Career Paths by Degree */}
        <ScrollReveal as="section" className="mb-14">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Career Paths by Degree</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CAREER_PATHS_BY_DEGREE.map(({ degree, careers }) => (
              <div
                key={degree}
                className="p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-edur-blue/50 dark:hover:border-edur-sky/50 transition-all duration-200 card-hover"
              >
                <h3 className="font-semibold text-edur-steel dark:text-edur-sky text-lg mb-3">{degree}</h3>
                <ul className="space-y-1.5 text-sm text-gray-700 dark:text-gray-300">
                  {careers.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </ScrollReveal>

        {/* Skill Development */}
        <ScrollReveal as="section" className="mb-14">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Skill Development</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">Trending skills: what they are, why they matter, and how to learn.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {SKILL_DEVELOPMENT.map(({ skill, to, description }) => (
              <Link
                key={skill}
                to={to}
                className="block p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-edur-blue/50 dark:hover:border-edur-sky/50 transition-all duration-200 card-hover"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">{skill}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{description}</p>
                <span className="text-xs font-medium text-edur-steel dark:text-edur-sky mt-2 inline-block">Learn more →</span>
              </Link>
            ))}
          </div>
        </ScrollReveal>

        {/* Resume & Interview Tips */}
        <ScrollReveal as="section" className="mb-14">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Resume & Interview Tips</h2>
          <div className="grid md:grid-cols-3 gap-4 mb-8">
            {RESUME_INTERVIEW_ARTICLES.map(({ title, to, description }) => (
              <Link
                key={title}
                to={to}
                className="block p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-edur-blue/50 card-hover"
              >
                <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{description}</p>
              </Link>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to={ROUTES.RESUME_BUILDER} className="inline-flex items-center px-5 py-2.5 rounded-xl bg-edur-steel text-white font-medium hover:bg-edur-blue btn-theme">
              Resume Builder
            </Link>
            <Link to={ROUTES.RESUME_ANALYZER} className="inline-flex items-center px-5 py-2.5 rounded-xl border-2 border-edur-steel text-edur-steel dark:border-edur-sky dark:text-edur-sky font-medium hover:bg-edur-steel/10 btn-theme">
              Resume Analyzer
            </Link>
          </div>
        </ScrollReveal>

        {/* Career Path Articles (existing) */}
        <ScrollReveal as="section" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Career Path Articles</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {CAREER_ARTICLES.map((article) => (
              <Link
                key={article.title}
                to={article.to}
                className="block p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg hover:border-edur-blue/50 card-hover"
              >
                <span className="text-xs font-medium text-edur-steel dark:text-edur-sky">{article.tag}</span>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-1">{article.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{article.description}</p>
              </Link>
            ))}
          </div>
        </ScrollReveal>

        {/* Job Preparation Tips */}
        <ScrollReveal as="section" className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Job Preparation Tips</h2>
          <ul className="space-y-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 list-disc list-inside text-gray-700 dark:text-gray-300">
            {JOB_PREP_TIPS.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </ScrollReveal>

        {/* Quick Links */}
        <ScrollReveal as="section">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            <Link to={ROUTES.RESUME_BUILDER} className="px-4 py-2 rounded-xl bg-edur-steel text-white font-medium hover:bg-edur-blue btn-theme">Resume Builder</Link>
            <Link to={ROUTES.RESUME_ANALYZER} className="px-4 py-2 rounded-xl border-2 border-edur-steel text-edur-steel dark:border-edur-sky dark:text-edur-sky hover:bg-edur-sky/20 btn-theme">Resume Analyzer</Link>
            <Link to={ROUTES.EXAM_PREP} className="px-4 py-2 rounded-xl border-2 border-edur-steel text-edur-steel dark:border-edur-sky dark:text-edur-sky hover:bg-edur-sky/20 btn-theme">Exam Prep</Link>
            <Link to={ROUTES.JOBS} className="px-4 py-2 rounded-xl border-2 border-edur-steel text-edur-steel dark:border-edur-sky dark:text-edur-sky hover:bg-edur-sky/20 btn-theme">Browse Jobs</Link>
          </div>
        </ScrollReveal>
      </div>
    </>
  );
}
