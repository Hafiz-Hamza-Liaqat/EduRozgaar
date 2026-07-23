import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StaticPageShell, StaticSection } from '../../components/static/StaticPageShell';
import { ROUTES } from '../../constants';

export default function Careers() {
  const { t } = useTranslation('static');

  return (
    <StaticPageShell
      titleKey="careersTitle"
      descriptionKey="careersDescription"
      headingKey="careersHeading"
      breadcrumbKey="breadcrumbCareers"
      canonical={ROUTES.CAREERS}
      ns="static"
      seoNs="static"
    >
      <StaticSection titleKey="careersIntroTitle" bodyKey="careersIntroBody" />
      <StaticSection titleKey="careersCultureTitle" bodyKey="careersCultureBody" />
      <section>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">{t('careersOpenTitle')}</h2>
        <p className="mb-4">{t('careersOpenBody')}</p>
        <ul className="list-disc list-inside space-y-2">
          <li>{t('careersRole1')}</li>
          <li>{t('careersRole2')}</li>
          <li>{t('careersRole3')}</li>
        </ul>
      </section>
      <p>
        {t('careersApplyPrefix')}{' '}
        <a href="mailto:careers@edurozgaar.pk" className="text-primary dark:text-mint hover:underline">
          careers@edurozgaar.pk
        </a>
        {' '}{t('careersApplySuffix')}
      </p>
      <p>
        <Link to={ROUTES.ABOUT} className="text-primary dark:text-mint font-medium hover:underline">
          {t('learnAboutUs')}
        </Link>
      </p>
    </StaticPageShell>
  );
}
