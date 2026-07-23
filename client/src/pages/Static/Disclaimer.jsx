import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StaticPageShell, StaticSection } from '../../components/static/StaticPageShell';
import { ROUTES } from '../../constants';

export default function Disclaimer() {
  const { t } = useTranslation('static');

  return (
    <StaticPageShell
      titleKey="disclaimerTitle"
      descriptionKey="disclaimerDescription"
      headingKey="disclaimerHeading"
      breadcrumbKey="breadcrumbDisclaimer"
      canonical={ROUTES.DISCLAIMER}
      ns="static"
      seoNs="static"
    >
      <StaticSection titleKey="disclaimerIntroTitle" bodyKey="disclaimerIntroBody" />
      <StaticSection titleKey="disclaimerAccuracyTitle" bodyKey="disclaimerAccuracyBody" />
      <StaticSection titleKey="disclaimerThirdPartyTitle" bodyKey="disclaimerThirdPartyBody" />
      <StaticSection titleKey="disclaimerLiabilityTitle" bodyKey="disclaimerLiabilityBody" />
      <p>
        <Link to={ROUTES.CONTACT} className="text-primary dark:text-mint font-medium hover:underline">
          {t('contactUs')}
        </Link>
      </p>
    </StaticPageShell>
  );
}
