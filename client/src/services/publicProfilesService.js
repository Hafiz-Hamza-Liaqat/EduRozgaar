import axiosInstance from './axiosBase';

export const publicProfilesApi = {
  employer: (slug) => axiosInstance.get(`/employers/profile/${slug}`),
  company: (slug) => axiosInstance.get(`/companies/${slug}`),
  companies: (params) => axiosInstance.get('/companies', { params }),
  university: (slug) => axiosInstance.get(`/universities/${slug}`),
  universities: (params) => axiosInstance.get('/universities', { params }),
};

export const adminImportApi = {
  resources: () => axiosInstance.get('/admin/import'),
  upload: (resource, file) => {
    const form = new FormData();
    form.append('file', file);
    return axiosInstance.post(`/admin/import/${resource}`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};
