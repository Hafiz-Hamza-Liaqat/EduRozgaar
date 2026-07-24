/**
 * Strideto Mobile – API client for /api/v1
 * Set EXPO_PUBLIC_API_URL or use default (localhost for dev).
 */
import axios from 'axios';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

let token = null;
export const setAuthToken = (t) => { token = t; };
export const getAuthToken = () => token;

client.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const api = {
  jobs: (params) => client.get('/jobs', { params }),
  job: (id) => client.get(`/jobs/${id}`),
  scholarships: (params) => client.get('/scholarships', { params }),
  scholarship: (id) => client.get(`/scholarships/${id}`),
  admissions: (params) => client.get('/admissions', { params }),
  admission: (id) => client.get(`/admissions/${id}`),
  trending: (type) => client.get(`/trending/${type}`),
  recommendations: () => client.get('/recommendations/me'),
  bookmarks: () => client.get('/bookmarks'),
  notifications: () => client.get('/notifications'),
};

export default client;
