import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StaticPageShell, StaticSection } from '../../components/static/StaticPageShell';
import { ROUTES } from '../../constants';

export default function Support() {
  const { t } = useTranslation('static');

  return (
    <StaticPageShell
      titleKey="supportTitle"
      descriptionKey="supportDescription"
      headingKey="supportHeading"
      breadcrumbKey="breadcrumbSupport"
      canonical={ROUTES.SUPPORT}
      ns="static"
      seoNs="static"
    >
      <StaticSection titleKey="supportIntroTitle" bodyKey="supportIntroBody" />
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{t('supportChannelsTitle')}</h2>
        <ul className="space-y-3">
          <li>
            <strong>{t('supportEmailLabel')}</strong>{' '}
            <a href="mailto:support@edurozgaar.pk" className="text-primary dark:text-mint hover:underline">
              support@edurozgaar.pk
            </a>
          </li>
          <li>
            <Link to={ROUTES.HELP_CENTER} className="text-primary dark:text-mint hover:underline">
              {t('supportHelpCenter')}
            </Link>
          </li>
          <li>
            <Link to={ROUTES.FAQ} className="text-primary dark:text-mint hover:underline">
              {t('supportFaq')}
            </Link>
          </li>
          <li>
            <Link to={ROUTES.CONTACT} className="text-primary dark:text-mint hover:underline">
              {t('supportContactForm')}
            </Link>
          </li>
        </ul>
      </section>
      <StaticSection titleKey="supportResponseTitle" bodyKey="supportResponseBody" />
    </StaticPageShell>
  );
}
