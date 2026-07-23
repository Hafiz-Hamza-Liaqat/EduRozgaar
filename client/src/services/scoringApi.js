import axiosInstance from './axiosBase';

export const scoringApi = {
  getLatest: (params) => axiosInstance.get('/scoring/latest', { params }),
  getHistory: (params) => axiosInstance.get('/scoring/history', { params }),
  getExplanation: (params) => axiosInstance.get('/scoring/explanation', { params }),
  recompute: (body) => axiosInstance.post('/scoring/recompute', body || {}),
};
