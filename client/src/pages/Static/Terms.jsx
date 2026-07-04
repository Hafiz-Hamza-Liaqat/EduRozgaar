import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, combineSchemas, webPageSchema } from '../../seo/schemas';
import { ROUTES } from '../../constants';

const TITLE = 'Terms of Service';
const DESCRIPTION = 'EduRozgaar terms of service for using the jobs, scholarships, and admissions platform.';

export default function Terms() {
  return (
    <>
      <SeoHead
        title={TITLE}
        description={DESCRIPTION}
        canonical={ROUTES.TERMS}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Terms of Service', url: ROUTES.TERMS },
          ]),
          webPageSchema({ name: TITLE, description: DESCRIPTION, url: ROUTES.TERMS })
        )}
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Terms of Service</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: 2026</p>
        <div className="prose prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">1. Acceptance of Terms</h2>
            <p>
              By using EduRozgaar, you agree to these Terms of Service. If you do not agree, please do not use the platform. We may update these terms from time to time; continued use after changes constitutes acceptance.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">2. Use of the Platform</h2>
            <p>
              EduRozgaar provides a portal for discovering jobs, scholarships, admissions, and internships. You may use the platform for personal, non-commercial use. You must not scrape, copy, or misuse content without permission. You are responsible for the accuracy of information you submit (e.g. applications, resume).
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">3. Account Responsibility</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. You must notify us of any unauthorized use. We reserve the right to suspend or terminate accounts that violate these terms or are used for fraud or abuse.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">4. Listings and Third-Party Links</h2>
            <p>
              Listings are aggregated from various sources. We strive for accuracy but do not guarantee the completeness or timeliness of every listing. When you apply via external links (e.g. PPSC, university portals), your interaction is with that third party and their terms apply.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">5. Limitation of Liability</h2>
            <p>
              EduRozgaar is provided “as is”. We are not liable for any loss or damage arising from your use of the platform or reliance on listings. You use external apply links and third-party sites at your own risk.
            </p>
          </section>
        </div>
        <p className="mt-8 text-gray-500 dark:text-gray-400">
          <Link to={ROUTES.CONTACT} className="text-primary dark:text-mint hover:underline">Contact us</Link> with questions about these terms.
        </p>
      </div>
    </>
  );
}
