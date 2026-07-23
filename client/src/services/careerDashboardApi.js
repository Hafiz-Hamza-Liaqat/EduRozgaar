import axiosInstance from './axiosBase';

/** Career dashboard composition API (C.8.0.6). */
export const careerDashboardApi = {
  get: () => axiosInstance.get('/career/dashboard'),
  getLayout: () => axiosInstance.get('/career/dashboard/layout'),
  saveLayout: (body) => axiosInstance.put('/career/dashboard/layout', body),
  clearLayout: () => axiosInstance.delete('/career/dashboard/layout'),
};

