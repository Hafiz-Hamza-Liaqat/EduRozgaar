import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, combineSchemas, webPageSchema } from '../../seo/schemas';
import { ROUTES } from '../../constants';

export default function Cookies() {
  const { t } = useTranslation(['static', 'seo', 'common']);

  return (
    <>
      <SeoHead
        title={t('seo:cookiesTitle')}
        description={t('seo:cookiesDescription')}
        canonical={ROUTES.COOKIES}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: t('seo:breadcrumbHome'), url: ROUTES.HOME },
            { name: t('static:breadcrumbCookies'), url: ROUTES.COOKIES },
          ]),
          webPageSchema({ name: t('static:cookiesHeading'), description: t('seo:cookiesDescription'), url: ROUTES.COOKIES })
        )}
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('static:cookiesHeading')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{t('static:lastUpdated')}</p>
        <div className="prose prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-300">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('static:cookiesWhatTitle')}</h2>
            <p>{t('static:cookiesWhatBody')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('static:cookiesHowTitle')}</h2>
            <p>{t('static:cookiesHowBody')}</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('static:cookiesChoicesTitle')}</h2>
            <p>
              {t('static:cookiesChoicesBody')}{' '}
              <Link to={ROUTES.PRIVACY_POLICY} className="text-primary dark:text-mint hover:underline">{t('common:privacyPolicy')}</Link>.
            </p>
          </section>
        </div>
        <p className="mt-8 text-gray-500 dark:text-gray-400">
          <Link to={ROUTES.CONTACT} className="text-primary dark:text-mint hover:underline">{t('static:contactUs')}</Link>{' '}
          {t('static:cookiesContactSuffix')}
        </p>
      </div>
    </>
  );
}
