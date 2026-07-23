import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { StaticPageShell, StaticSection } from '../../components/static/StaticPageShell';
import { ROUTES } from '../../constants';

export default function RefundPolicy() {
  const { t } = useTranslation('static');

  return (
    <StaticPageShell
      titleKey="refundTitle"
      descriptionKey="refundDescription"
      headingKey="refundHeading"
      breadcrumbKey="breadcrumbRefund"
      canonical={ROUTES.REFUND_POLICY}
      ns="static"
      seoNs="static"
    >
      <StaticSection titleKey="refundIntroTitle" bodyKey="refundIntroBody" />
      <StaticSection titleKey="refundEmployerTitle" bodyKey="refundEmployerBody" />
      <StaticSection titleKey="refundStudentTitle" bodyKey="refundStudentBody" />
      <StaticSection titleKey="refundProcessTitle" bodyKey="refundProcessBody" />
      <p>
        <Link to={ROUTES.CONTACT} className="text-primary dark:text-mint font-medium hover:underline">
          {t('contactUs')}
        </Link>
      </p>
    </StaticPageShell>
  );
}
