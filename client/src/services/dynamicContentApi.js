import axiosInstance from './axiosBase';

export const dynamicContentApi = {
  fetch: (source, params = {}) => axiosInstance.get(`/dynamic-content/${encodeURIComponent(source)}`, { params }),
  batch: (blocks) => axiosInstance.post('/dynamic-content/batch', { blocks }),
};
