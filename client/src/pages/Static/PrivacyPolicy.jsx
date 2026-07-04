import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, combineSchemas, webPageSchema } from '../../seo/schemas';
import { ROUTES } from '../../constants';

const TITLE = 'Privacy Policy';
const DESCRIPTION = 'EduRozgaar privacy policy: how we collect, use, and protect your data.';

export default function PrivacyPolicy() {
  return (
    <>
      <SeoHead
        title={TITLE}
        description={DESCRIPTION}
        canonical={ROUTES.PRIVACY_POLICY}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'Privacy Policy', url: ROUTES.PRIVACY_POLICY },
          ]),
          webPageSchema({ name: TITLE, description: DESCRIPTION, url: ROUTES.PRIVACY_POLICY })
        )}
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">Last updated: 2026</p>
        <div className="prose prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">1. Introduction</h2>
            <p>
              EduRozgaar (“we”, “our”) is committed to protecting your privacy. This policy explains how we collect, use, store, and disclose information when you use our platform for jobs, scholarships, admissions, and internships.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">2. Information We Collect</h2>
            <p>
              We collect information you provide when registering (name, email, password), when you save listings or apply to jobs (resume, application data), and when you subscribe to our newsletter. We also collect usage data such as pages visited and search queries to improve the service.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">3. How We Use Your Information</h2>
            <p>
              We use your information to operate the platform, personalize recommendations, send you alerts you have opted into, process job applications, and improve our services. We do not sell your personal data to third parties.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">4. Data Security</h2>
            <p>
              We use industry-standard measures to protect your data, including encryption and secure storage. Passwords are hashed; we do not store plain-text passwords.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">5. Your Rights</h2>
            <p>
              You may access, correct, or delete your account data through your profile settings. You can unsubscribe from emails at any time. For requests or questions, contact us.
            </p>
          </section>
        </div>
        <p className="mt-8 text-gray-500 dark:text-gray-400">
          <Link to={ROUTES.CONTACT} className="text-primary dark:text-mint hover:underline">Contact us</Link> for privacy-related inquiries.
        </p>
      </div>
    </>
  );
}
