import { ROUTES } from '../../constants';
import { StaticCmsPage } from '../../components/static/StaticCmsPage';
import About from './About';
import FAQ from './FAQ';
import PrivacyPolicy from './PrivacyPolicy';
import Terms from './Terms';
import Cookies from './Cookies';
import Disclaimer from './Disclaimer';
import RefundPolicy from './RefundPolicy';
import Careers from './Careers';
import Advertise from './Advertise';
import HelpCenter from './HelpCenter';
import Support from './Support';
import Services from './Services';
import License from './License';

export function AboutPage() {
  return <StaticCmsPage slug="about" canonical={ROUTES.ABOUT} Fallback={About} />;
}
export function FAQPage() {
  return <StaticCmsPage slug="faq" canonical={ROUTES.FAQ} Fallback={FAQ} />;
}
export function PrivacyPolicyPage() {
  return <StaticCmsPage slug="privacy-policy" canonical={ROUTES.PRIVACY_POLICY} Fallback={PrivacyPolicy} />;
}
export function TermsPage() {
  return <StaticCmsPage slug="terms" canonical={ROUTES.TERMS} Fallback={Terms} />;
}
export function CookiesPage() {
  return <StaticCmsPage slug="cookies" canonical={ROUTES.COOKIES} Fallback={Cookies} />;
}
export function DisclaimerPage() {
  return <StaticCmsPage slug="disclaimer" canonical={ROUTES.DISCLAIMER} Fallback={Disclaimer} />;
}
export function RefundPolicyPage() {
  return <StaticCmsPage slug="refund-policy" canonical={ROUTES.REFUND_POLICY} Fallback={RefundPolicy} />;
}
export function CareersPage() {
  return <StaticCmsPage slug="careers" canonical={ROUTES.CAREERS} Fallback={Careers} />;
}
export function AdvertisePage() {
  return <StaticCmsPage slug="advertise" canonical={ROUTES.ADVERTISE} Fallback={Advertise} />;
}
export function HelpCenterPage() {
  return <StaticCmsPage slug="help-center" canonical={ROUTES.HELP_CENTER} Fallback={HelpCenter} />;
}
export function SupportPage() {
  return <StaticCmsPage slug="support" canonical={ROUTES.SUPPORT} Fallback={Support} />;
}
export function ServicesPage() {
  return <StaticCmsPage slug="services" canonical={ROUTES.SERVICES} Fallback={Services} />;
}
export function LicensePage() {
  return <StaticCmsPage slug="license" canonical={ROUTES.LICENSE} Fallback={License} />;
}
