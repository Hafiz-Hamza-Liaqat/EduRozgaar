import { Link } from 'react-router-dom';
import { SeoHead } from '../../components/seo';
import { aboutPageSchema, breadcrumbSchema, combineSchemas } from '../../seo/schemas';
import { ROUTES } from '../../constants';

const TITLE = 'About Us';
const DESCRIPTION = "EduRozgaar is Pakistan's student-first portal for jobs, scholarships, admissions, and internships.";

export default function About() {
  return (
    <>
      <SeoHead
        title={TITLE}
        description={DESCRIPTION}
        canonical={ROUTES.ABOUT}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: 'Home', url: ROUTES.HOME },
            { name: 'About', url: ROUTES.ABOUT },
          ]),
          aboutPageSchema({ name: 'About EduRozgaar', description: DESCRIPTION, url: ROUTES.ABOUT })
        )}
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">About EduRozgaar</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          EduRozgaar is Pakistan’s leading e-portal built for students and young professionals. Our mission is to connect you with jobs, scholarships, admissions, and internships—all in one place.
        </p>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Our Mission</h2>
          <p className="text-gray-600 dark:text-gray-300">
            We help Pakistani students find verified opportunities: government and private jobs, local and international scholarships, university admissions, and internships. We believe every student deserves access to clear, updated information to plan their career and education.
          </p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">What We Offer</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
            <li>Curated job listings from PPSC, FPSC, NTS, and private employers</li>
            <li>Scholarships in Pakistan and abroad (Turkey, China, Germany, UK, and more)</li>
            <li>University admissions and deadline alerts</li>
            <li>Internships and exam preparation resources</li>
            <li>Resume builder, career guidance, and student alerts</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Built for Students First</h2>
          <p className="text-gray-600 dark:text-gray-300">
            EduRozgaar is designed with students in mind—mobile-friendly, easy to search, and updated regularly. We partner with institutions and employers to bring you real opportunities and help reduce information gaps in the education-to-employment journey.
          </p>
        </section>
        <Link to={ROUTES.CONTACT} className="text-primary dark:text-mint font-medium hover:underline">Get in touch →</Link>
      </div>
    </>
  );
}
