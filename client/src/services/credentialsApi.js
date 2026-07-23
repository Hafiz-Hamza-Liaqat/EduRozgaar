import axiosInstance from './axiosBase';

/** Canonical Credential Platform API (C.8.0.5). */
export const credentialsApi = {
  list: () => axiosInstance.get('/credentials'),
  get: (id) => axiosInstance.get(`/credentials/${id}`),
  issue: (body) => axiosInstance.post('/credentials', body),
  update: (id, body) => axiosInstance.patch(`/credentials/${id}`, body),
  verify: (id) => axiosInstance.post(`/credentials/${id}/verify`),
  revoke: (id) => axiosInstance.post(`/credentials/${id}/revoke`),
};
