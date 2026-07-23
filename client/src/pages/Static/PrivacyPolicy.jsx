import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, combineSchemas, webPageSchema } from '../../seo/schemas';
import { ROUTES } from '../../constants';

export default function PrivacyPolicy() {
  const { t } = useTranslation(['static', 'seo', 'common']);

  return (
    <>
      <SeoHead
        title={t('seo:privacyTitle')}
        description={t('seo:privacyDescription')}
        canonical={ROUTES.PRIVACY_POLICY}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: t('seo:breadcrumbHome'), url: ROUTES.HOME },
            { name: t('static:breadcrumbPrivacy'), url: ROUTES.PRIVACY_POLICY },
          ]),
          webPageSchema({ name: t('static:privacyHeading'), description: t('seo:privacyDescription'), url: ROUTES.PRIVACY_POLICY })
        )}
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('static:privacyHeading')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{t('static:lastUpdated')}</p>
        <div className="prose prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('static:privacyIntroTitle')}</h2>
            <p>{t('static:privacyIntroBody')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('static:privacyCollectTitle')}</h2>
            <p>{t('static:privacyCollectBody')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('static:privacyUseTitle')}</h2>
            <p>{t('static:privacyUseBody')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('static:privacySecurityTitle')}</h2>
            <p>{t('static:privacySecurityBody')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('static:privacyThirdPartyTitle')}</h2>
            <p>
              {t('static:privacyThirdPartyBody')}{' '}
              <a href="https://policies.google.com/technologies/ads" className="text-primary dark:text-mint hover:underline" target="_blank" rel="noopener noreferrer">
                {t('static:googleAdPolicies')}
              </a>.
            </p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('static:privacyRightsTitle')}</h2>
            <p>{t('static:privacyRightsBody')}</p>
          </section>
        </div>
        <p className="mt-8 text-gray-500 dark:text-gray-400">
          <Link to={ROUTES.CONTACT} className="text-primary dark:text-mint hover:underline">{t('static:contactUs')}</Link>{' '}
          {t('static:privacyContactSuffix')}
        </p>
      </div>
    </>
  );
}
