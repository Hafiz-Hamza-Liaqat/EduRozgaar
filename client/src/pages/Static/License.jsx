import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StaticPageShell } from '../../components/static/StaticPageShell';
import { ROUTES } from '../../constants';

const REPO_URL = 'https://github.com/SyedDaniyal31/EduRozgaar';

export default function License() {
  const { t } = useTranslation('static');

  return (
    <StaticPageShell
      titleKey="licenseTitle"
      descriptionKey="licenseDescription"
      headingKey="licenseHeading"
      breadcrumbKey="breadcrumbLicense"
      canonical={ROUTES.LICENSE}
      ns="static"
      seoNs="static"
    >
      <p className="text-sm text-gray-500 dark:text-gray-400 -mt-4 mb-6">
        {t('licenseCopyright')} ·{' '}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-mint hover:underline">
          {t('licenseViewGithub')}
        </a>
      </p>
      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 p-6 md:p-8">
        <pre className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
          {t('licenseBody')}
        </pre>
      </div>
      <p className="mt-8 text-gray-600 dark:text-gray-400 text-sm">
        {t('licenseFooterNote')}{' '}
        <Link to={ROUTES.TERMS} className="text-primary dark:text-mint hover:underline">{t('termsOfService')}</Link>
        {' '}{t('and')}{' '}
        <Link to={ROUTES.PRIVACY_POLICY} className="text-primary dark:text-mint hover:underline">{t('privacyPolicy')}</Link>.
      </p>
    </StaticPageShell>
  );
}
