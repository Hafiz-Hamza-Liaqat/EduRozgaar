import axiosInstance from './axiosBase';

export const contentInsightsApi = {
  dashboard: (params) => axiosInstance.get('/admin/content-insights', { params }),
  overview: (params) => axiosInstance.get('/admin/content-insights/overview', { params }),
  search: (params) => axiosInstance.get('/admin/content-insights/search', { params }),
  ads: () => axiosInstance.get('/admin/content-insights/ads'),
  content: (params) => axiosInstance.get('/admin/content-insights/content', { params }),
  forms: (params) => axiosInstance.get('/admin/content-insights/forms', { params }),
  media: () => axiosInstance.get('/admin/content-insights/media'),
  dynamicBlocks: (params) => axiosInstance.get('/admin/content-insights/dynamic-blocks', { params }),
  export: (params) => axiosInstance.get('/admin/content-insights/export', {
    params,
    responseType: 'blob',
  }),
  clearCache: () => axiosInstance.post('/admin/content-insights/cache/clear'),
};

export const analyticsEventApi = {
  record: (body) => axiosInstance.post('/analytics/event', body),
};
