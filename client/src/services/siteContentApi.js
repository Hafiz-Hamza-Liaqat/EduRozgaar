import axiosInstance from './axiosBase';

function qs(params) {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v != null && v !== '') sp.set(k, v);
  });
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const siteContentApi = {
  getHomepage: (locale) => axiosInstance.get(`/cms/site/homepage${qs({ locale })}`),
  getNavigation: (locale, placement) => axiosInstance.get(`/cms/site/navigation${qs({ locale, placement })}`),
  getBanners: (locale, placement = 'homepage') => axiosInstance.get(`/cms/site/banners${qs({ locale, placement })}`),
  getPage: (slug, locale) => axiosInstance.get(`/cms/site/pages/${encodeURIComponent(slug)}${qs({ locale })}`),
  getPageLayout: (pageKey, locale) => axiosInstance.get(`/cms/site/page-layouts/${encodeURIComponent(pageKey)}${qs({ locale })}`),
  getGlobalBlocks: (ids) => axiosInstance.get(`/cms/site/global-blocks${qs({ ids: (ids || []).join(',') })}`),
};
