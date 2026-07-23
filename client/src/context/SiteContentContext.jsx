import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useLanguage } from './LanguageContext';
import { siteContentApi } from '../services/siteContentApi';

const SiteContentContext = createContext(null);

export function SiteContentProvider({ children }) {
  const { lang } = useLanguage();
  const [homepage, setHomepage] = useState(null);
  const [headerNav, setHeaderNav] = useState(null);
  const [footerNav, setFooterNav] = useState(null);
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [hp, header, footer, bn] = await Promise.all([
        siteContentApi.getHomepage(lang).then((r) => r.data).catch(() => null),
        siteContentApi.getNavigation(lang, 'header').then((r) => r.data).catch(() => null),
        siteContentApi.getNavigation(lang, 'footer').then((r) => r.data).catch(() => null),
        siteContentApi.getBanners(lang, 'homepage').then((r) => r.data?.data || []).catch(() => []),
      ]);
      setHomepage(hp);
      setHeaderNav(header);
      setFooterNav(footer);
      setBanners(bn);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SiteContentContext.Provider value={{ homepage, headerNav, footerNav, banners, loading, reload: load }}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const ctx = useContext(SiteContentContext);
  if (!ctx) {
    return { homepage: null, headerNav: null, footerNav: null, banners: [], loading: false, reload: () => {} };
  }
  return ctx;
}
