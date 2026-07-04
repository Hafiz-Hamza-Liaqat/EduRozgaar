import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, combineSchemas, contactPageSchema } from '../../seo/schemas';
import { ROUTES } from '../../constants';

const TITLE = 'Contact Us';
const DESCRIPTION = 'Contact EduRozgaar for support, partnerships, or to submit opportunities.';

export default function Contact() {
  return (
    <>
      <SeoHead
        title={TITLE}
        description={DESCRIPTION}
        canonical={ROUTES.CONTACT}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Contact', url: ROUTES.CONTACT },
          ]),
          contactPageSchema({ name: TITLE, description: DESCRIPTION, url: ROUTES.CONTACT })
        )}
      />
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">Contact Us</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6 sm:mb-8 text-sm sm:text-base">
          Get in touch for support, advertising, or to submit a job or scholarship opportunity. We aim to respond within 1–2 business days.
        </p>
        <div className="p-4 sm:p-8 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 space-y-4">
          <p className="text-gray-700 dark:text-gray-300"><strong>Email support:</strong> contact@edurozgaar.pk</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">For general inquiries, report an issue, submit an opportunity, or advertise with us, email the address above with a clear subject line.</p>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            You can also reach us via <a href="https://t.me/edurozgaar" target="_blank" rel="noopener noreferrer" className="text-primary dark:text-mint hover:underline">Telegram</a> or follow us on <a href="https://twitter.com/edurozgaar" target="_blank" rel="noopener noreferrer" className="text-primary dark:text-mint hover:underline">X (Twitter)</a> and <a href="https://linkedin.com/company/edurozgaar" target="_blank" rel="noopener noreferrer" className="text-primary dark:text-mint hover:underline">LinkedIn</a>.
          </p>
        </div>
        <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <Link to={ROUTES.FAQ} className="text-primary dark:text-mint hover:underline">Check our FAQ</Link> for quick answers.
        </p>
      </div>
    </>
  );
}
