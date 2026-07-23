import axiosInstance from './axiosBase';

export const talentApi = {
  getMe: () => axiosInstance.get('/talent/me'),
  createMe: (body) => axiosInstance.post('/talent/me', body),
  updateMe: (body) => axiosInstance.patch('/talent/me', body),
  deleteMe: () => axiosInstance.delete('/talent/me'),

  listResumeVersions: () => axiosInstance.get('/talent/me/resume-versions'),
  getResumeVersion: (id) => axiosInstance.get(`/talent/me/resume-versions/${id}`),
  createResumeVersion: (body) => axiosInstance.post('/talent/me/resume-versions', body),
  updateResumeVersion: (id, body) => axiosInstance.patch(`/talent/me/resume-versions/${id}`, body),
  deleteResumeVersion: (id) => axiosInstance.delete(`/talent/me/resume-versions/${id}`),
  publishResumeVersion: (id) => axiosInstance.post(`/talent/me/resume-versions/${id}/publish`),

  listDocuments: () => axiosInstance.get('/talent/me/documents'),
  createDocument: (body) => axiosInstance.post('/talent/me/documents', body),
  updateDocument: (id, body) => axiosInstance.patch(`/talent/me/documents/${id}`, body),
  deleteDocument: (id) => axiosInstance.delete(`/talent/me/documents/${id}`),
  uploadDocument: (formData) => axiosInstance.post('/talent/me/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  listCredentials: () => axiosInstance.get('/talent/me/credentials'),

  getResumeBuilder: () => axiosInstance.get('/talent/me/resume-builder'),
  saveResumeBuilder: (body) => axiosInstance.put('/talent/me/resume-builder', body),
  getSummary: () => axiosInstance.get('/talent/me/summary'),
  getApplyKit: () => axiosInstance.get('/talent/me/apply-kit'),
  getPrefill: () => axiosInstance.get('/talent/me/prefill'),
  getCandidateCard: () => axiosInstance.get('/talent/me/candidate-card'),
};
