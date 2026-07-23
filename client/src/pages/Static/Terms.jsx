import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, combineSchemas, webPageSchema } from '../../seo/schemas';
import { ROUTES } from '../../constants';

export default function Terms() {
  const { t } = useTranslation(['static', 'seo']);

  return (
    <>
      <SeoHead
        title={t('seo:termsTitle')}
        description={t('seo:termsDescription')}
        canonical={ROUTES.TERMS}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: t('seo:breadcrumbHome'), url: ROUTES.HOME },
            { name: t('static:breadcrumbTerms'), url: ROUTES.TERMS },
          ]),
          webPageSchema({ name: t('static:termsHeading'), description: t('seo:termsDescription'), url: ROUTES.TERMS })
        )}
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('static:termsHeading')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{t('static:lastUpdated')}</p>
        <div className="prose prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('static:termsAcceptTitle')}</h2>
            <p>{t('static:termsAcceptBody')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('static:termsUseTitle')}</h2>
            <p>{t('static:termsUseBody')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('static:termsAccountTitle')}</h2>
            <p>{t('static:termsAccountBody')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('static:termsListingsTitle')}</h2>
            <p>{t('static:termsListingsBody')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('static:termsLiabilityTitle')}</h2>
            <p>{t('static:termsLiabilityBody')}</p>
          </section>
        </div>
        <p className="mt-8 text-gray-500 dark:text-gray-400">
          <Link to={ROUTES.CONTACT} className="text-primary dark:text-mint hover:underline">{t('static:contactUs')}</Link>{' '}
          {t('static:termsContactSuffix')}
        </p>
      </div>
    </>
  );
}
