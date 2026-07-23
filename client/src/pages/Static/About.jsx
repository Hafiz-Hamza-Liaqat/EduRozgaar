import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { aboutPageSchema, breadcrumbSchema, combineSchemas } from '../../seo/schemas';
import { ROUTES } from '../../constants';

export default function About() {
  const { t } = useTranslation(['static', 'seo', 'common']);

  return (
    <>
      <SeoHead
        title={t('seo:aboutTitle')}
        description={t('seo:aboutDescription')}
        canonical={ROUTES.ABOUT}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: t('seo:breadcrumbHome'), url: ROUTES.HOME },
            { name: t('static:breadcrumbAbout'), url: ROUTES.ABOUT },
          ]),
          aboutPageSchema({ name: t('static:aboutHeading'), description: t('seo:aboutDescription'), url: ROUTES.ABOUT })
        )}
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('static:aboutHeading')}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">{t('static:aboutIntro')}</p>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{t('static:aboutMissionTitle')}</h2>
          <p className="text-gray-600 dark:text-gray-300">{t('static:aboutMissionBody')}</p>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{t('static:aboutOfferTitle')}</h2>
          <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
            <li>{t('static:aboutOffer1')}</li>
            <li>{t('static:aboutOffer2')}</li>
            <li>{t('static:aboutOffer3')}</li>
            <li>{t('static:aboutOffer4')}</li>
            <li>{t('static:aboutOffer5')}</li>
          </ul>
        </section>
        <section className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{t('static:aboutStudentsTitle')}</h2>
          <p className="text-gray-600 dark:text-gray-300">{t('static:aboutStudentsBody')}</p>
        </section>
        <Link to={ROUTES.CONTACT} className="text-primary dark:text-mint font-medium hover:underline">{t('static:getInTouch')}</Link>
      </div>
    </>
  );
}
