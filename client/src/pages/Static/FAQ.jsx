import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SeoHead } from '../../components/seo';
import { breadcrumbSchema, combineSchemas, faqPageSchema, webPageSchema } from '../../seo/schemas';
import { ROUTES } from '../../constants';

export default function FAQ() {
  const { t } = useTranslation(['static', 'seo']);

  const faqItems = [
    { q: t('static:faqQ1'), a: t('static:faqA1') },
    { q: t('static:faqQ2'), a: t('static:faqA2') },
    { q: t('static:faqQ3'), a: t('static:faqA3') },
    { q: t('static:faqQ4'), a: t('static:faqA4') },
    { q: t('static:faqQ5'), a: t('static:faqA5') },
    { q: t('static:faqQ6'), a: t('static:faqA6') },
  ];

  return (
    <>
      <SeoHead
        title={t('seo:faqTitle')}
        description={t('seo:faqDescription')}
        canonical={ROUTES.FAQ}
        jsonLd={combineSchemas(
          breadcrumbSchema([
            { name: t('seo:breadcrumbHome'), url: ROUTES.HOME },
            { name: t('static:breadcrumbFaq'), url: ROUTES.FAQ },
          ]),
          webPageSchema({ name: t('static:faqPageName'), description: t('seo:faqDescription'), url: ROUTES.FAQ }),
          faqPageSchema(faqItems)
        )}
      />
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">{t('static:faqHeading')}</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">{t('static:faqIntro')}</p>
        <dl className="space-y-6">
          {faqItems.map((item, i) => (
            <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50">
              <dt className="font-semibold text-gray-900 dark:text-white mb-2">{item.q}</dt>
              <dd className="text-gray-600 dark:text-gray-300 text-sm">{item.a}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-gray-600 dark:text-gray-400">
          {t('static:faqStillQuestions')}{' '}
          <Link to={ROUTES.CONTACT} className="text-primary dark:text-mint hover:underline">{t('static:contactUs')}</Link>.
        </p>
      </div>
    </>
  );
}
