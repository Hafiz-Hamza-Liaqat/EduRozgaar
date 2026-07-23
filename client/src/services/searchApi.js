import axiosInstance from './axiosBase';

export const searchApi = {
  search: (params) => axiosInstance.get('/search', { params }),
  suggestions: (q, params = {}) => axiosInstance.get('/search/suggestions', { params: { q, ...params } }),
  click: (body) => axiosInstance.post('/search/click', body),
  related: (entityType, entityId, params) => axiosInstance.get(`/search/related/${entityType}/${entityId}`, { params }),
  adminSearch: (params) => axiosInstance.get('/admin/search', { params }),
  adminStats: () => axiosInstance.get('/admin/search/stats'),
  adminReindex: (body) => axiosInstance.post('/admin/search/reindex', body),
};
