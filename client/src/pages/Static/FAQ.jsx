import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, combineSchemas, faqPageSchema, webPageSchema } from '../../seo/schemas';
import { FAQ_ITEMS } from '../../constants/faq';
import { ROUTES } from '../../constants';

const TITLE = 'FAQ';
const DESCRIPTION = 'Frequently asked questions about using EduRozgaar for jobs, scholarships, and admissions.';

export default function FAQ() {
  return (
    <>
      <SeoHead
        title={TITLE}
        description={DESCRIPTION}
        canonical={ROUTES.FAQ}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'FAQ', url: ROUTES.FAQ },
          ]),
          webPageSchema({ name: 'Frequently Asked Questions', description: DESCRIPTION, url: ROUTES.FAQ }),
          faqPageSchema(FAQ_ITEMS)
        )}
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          Quick answers to common questions about EduRozgaar and how to make the most of the platform.
        </p>
        <dl className="space-y-6">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
              <dt className="font-semibold text-gray-900 dark:text-white mb-2">{item.q}</dt>
              <dd className="text-gray-600 dark:text-gray-300 text-sm">{item.a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-gray-600 dark:text-gray-400">
          Still have questions? <Link to={ROUTES.CONTACT} className="text-primary dark:text-mint hover:underline">Contact us</Link>.
        </p>
      </div>
    </>
  );
}
