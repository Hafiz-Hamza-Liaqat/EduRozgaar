import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StaticPageShell, StaticSection } from '../../components/static/StaticPageShell';
import { ROUTES } from '../../constants';

export default function Advertise() {
  const { t } = useTranslation('static');

  return (
    <StaticPageShell
      titleKey="advertiseTitle"
      descriptionKey="advertiseDescription"
      headingKey="advertiseHeading"
      breadcrumbKey="breadcrumbAdvertise"
      canonical={ROUTES.ADVERTISE}
      ns="static"
      seoNs="static"
    >
      <p className="text-lg text-gray-600 dark:text-gray-300 -mt-2 mb-6">{t('advertiseIntro')}</p>
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{t('advertiseWhyTitle')}</h2>
        <ul className="list-disc list-inside space-y-2 text-gray-600 dark:text-gray-300">
          <li>{t('advertiseWhy1')}</li>
          <li>{t('advertiseWhy2')}</li>
          <li>{t('advertiseWhy3')}</li>
          <li>{t('advertiseWhy4')}</li>
        </ul>
      </section>
      <StaticSection titleKey="advertisePromoteTitle" bodyKey="advertisePromoteBody" />
      <section className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{t('advertiseContactTitle')}</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">{t('advertiseContactBody')}</p>
        <Link to={ROUTES.CONTACT} className="inline-block px-4 py-2 rounded-lg bg-primary text-white font-medium hover:bg-primary-hover btn-theme">
          {t('contactUs')}
        </Link>
      </section>
    </StaticPageShell>
  );
}
