import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StaticPageShell, StaticSection } from '../../components/static/StaticPageShell';
import { ROUTES } from '../../constants';

export default function SubmitOpportunity() {
  const { t } = useTranslation('static');

  return (
    <StaticPageShell
      titleKey="submitOpportunityTitle"
      descriptionKey="submitOpportunityDescription"
      headingKey="submitOpportunityHeading"
      breadcrumbKey="breadcrumbSubmitOpportunity"
      canonical={ROUTES.SUBMIT_OPPORTUNITY}
      ns="static"
      seoNs="static"
    >
      <p className="text-lg text-gray-600 dark:text-gray-300 -mt-2 mb-6">{t('submitOpportunityIntro')}</p>
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{t('submitWhatTitle')}</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
          <li>{t('submitWhat1')}</li>
          <li>{t('submitWhat2')}</li>
          <li>{t('submitWhat3')}</li>
          <li>{t('submitWhat4')}</li>
          <li>{t('submitWhat5')}</li>
        </ul>
      </section>
      <StaticSection titleKey="submitNeedTitle" bodyKey="submitNeedBody" />
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{t('submitHowTitle')}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{t('submitHowBody')}</p>
        <Link to={ROUTES.CONTACT} className="inline-block px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover btn-theme">
          {t('goToContact')}
        </Link>
      </section>
    </StaticPageShell>
  );
}
