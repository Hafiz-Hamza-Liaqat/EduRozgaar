import axiosInstance from './axiosBase';

export const assessmentsApi = {
  listCategories: () => axiosInstance.get('/assessments/categories'),
  list: (params) => axiosInstance.get('/assessments', { params }),
  getBySlug: (slug) => axiosInstance.get(`/assessments/${encodeURIComponent(slug)}`),
  startAttempt: (body) => axiosInstance.post('/assessments/attempts', body),
  submitAttempt: (attemptId, body) => axiosInstance.post(`/assessments/attempts/${attemptId}/submit`, body),
  listMyAttempts: (params) => axiosInstance.get('/assessments/attempts/mine', { params }),
  getAttempt: (attemptId) => axiosInstance.get(`/assessments/attempts/${attemptId}`),
  getEmployerSkills: () => axiosInstance.get('/assessments/employer-skills'),
};
