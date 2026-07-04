import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, combineSchemas, webPageSchema } from '../../seo/schemas';
import { ROUTES } from '../../constants';

const TITLE = 'Help Center';
const DESCRIPTION = 'Get help using EduRozgaar: how to search jobs, save listings, apply, and manage your account.';

export default function HelpCenter() {
  return (
    <>
      <SeoHead
        title={TITLE}
        description={DESCRIPTION}
        canonical={ROUTES.HELP_CENTER}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Help Center', url: ROUTES.HELP_CENTER },
          ]),
          webPageSchema({ name: TITLE, description: DESCRIPTION, url: ROUTES.HELP_CENTER })
        )}
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Help Center</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Find answers and guidance on using EduRozgaar to search for jobs, scholarships, admissions, and internships.
        </p>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Getting Started</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            You can browse jobs, scholarships, and admissions without an account. Create a free account to save listings, get personalized recommendations, apply to jobs within the portal, and receive alerts.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Searching & Filters</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Use the search bar on the homepage or listing pages. Filter by province, city, job type (government/private/internship), deadline, and category to narrow results.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Applying to Jobs</h2>
          <p className="text-gray-600 dark:text-gray-300">
            Some jobs allow you to apply directly on EduRozgaar (upload resume and submit). Others redirect you to the official website (e.g. PPSC, FPSC). Always check the job detail page for the correct apply link.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Still Need Help?</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Check our <Link to={ROUTES.FAQ} className="text-primary dark:text-mint hover:underline">FAQ</Link> or <Link to={ROUTES.CONTACT} className="text-primary dark:text-mint hover:underline">contact us</Link> for support.
          </p>
        </section>
      </div>
    </>
  );
}
