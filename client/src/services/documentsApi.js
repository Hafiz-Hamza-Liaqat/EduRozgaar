import axiosInstance from './axiosBase';

/** Canonical Document Platform API (C.8.0.5). */
export const documentsApi = {
  list: (params) => axiosInstance.get('/documents', { params }),
  get: (id) => axiosInstance.get(`/documents/${id}`),
  create: (body) => axiosInstance.post('/documents', body),
  update: (id, body) => axiosInstance.patch(`/documents/${id}`, body),
  archive: (id) => axiosInstance.post(`/documents/${id}/archive`),
  remove: (id) => axiosInstance.delete(`/documents/${id}`),
  listVersions: (id) => axiosInstance.get(`/documents/${id}/versions`),
  createVersion: (id, body) => axiosInstance.post(`/documents/${id}/versions`, body),
};
