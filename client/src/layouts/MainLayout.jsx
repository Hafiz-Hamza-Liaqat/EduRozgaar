import { Outlet } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { GlobalSeo } from '../components/seo';
import { CookieConsent } from '../components/consent/CookieConsent';
import { SiteContentProvider } from '../context/SiteContentContext';
import { AdSlotsProvider } from '../context/AdSlotsContext';

export function MainLayout({ children }) {
  return (
    <SiteContentProvider>
      <AdSlotsProvider>
        <div className="min-h-screen flex flex-col bg-bg-main dark:bg-secondary overflow-x-hidden">
          <GlobalSeo />
          <Navbar />
          <main className="flex-1 min-w-0 w-full">
            {children || <Outlet />}
          </main>
          <Footer />
          <CookieConsent />
        </div>
      </AdSlotsProvider>
    </SiteContentProvider>
  );
}

export function MainLayoutWrapper() {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
}
