import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, combineSchemas, webPageSchema } from '../../seo/schemas';
import { ROUTES } from '../../constants';

const TITLE = 'Our Services';
const DESCRIPTION = 'Explore EduRozgaar services: jobs, scholarships, admissions, internships, resume builder, and career resources.';

export default function Services() {
  const services = [
    { title: 'Job Listings', description: 'Browse government and private sector jobs across Pakistan. Filter by province, category, and deadline.', to: ROUTES.JOBS },
    { title: 'Scholarships', description: 'Discover local and international scholarships—fully funded and partial—for undergraduate and graduate studies.', to: ROUTES.SCHOLARSHIPS },
    { title: 'Admissions', description: 'Stay updated on university admissions, entry tests, and application deadlines.', to: ROUTES.ADMISSIONS },
    { title: 'Internships', description: 'Find internships and training opportunities to build experience while studying.', to: ROUTES.INTERNSHIPS },
    { title: 'Resume Builder', description: 'Create and download your CV with our simple resume builder.', to: ROUTES.RESUME_BUILDER },
    { title: 'Career Guidance', description: 'Articles and tips on career paths, interviews, and job preparation.', to: ROUTES.CAREER_GUIDANCE },
    { title: 'Exam Preparation', description: 'Resources for FPSC, PPSC, NTS, CSS, and other competitive exams.', to: ROUTES.EXAM_PREP },
    { title: 'Student Alerts', description: 'Subscribe to email or Telegram alerts for new jobs and scholarship deadlines.', to: ROUTES.HOME },
  ];

  return (
    <>
      <SeoHead
        title={TITLE}
        description={DESCRIPTION}
        canonical={ROUTES.SERVICES}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Services', url: ROUTES.SERVICES },
          ]),
          webPageSchema({ name: TITLE, description: DESCRIPTION, url: ROUTES.SERVICES })
        )}
      />
      <div className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Our Services</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          EduRozgaar offers a range of free services to help Pakistani students find jobs, scholarships, admissions, and internships. All designed to support your education and career journey.
        </p>
        <div className="grid sm:grid-cols-2 gap-6">
          {services.map((s) => (
            <Link key={s.to} to={s.to} className="block p-5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary/50 dark:hover:border-mint/50 hover:shadow-md transition-all duration-200">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{s.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">{s.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
