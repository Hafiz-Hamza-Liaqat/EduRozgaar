import axiosInstance from './axiosBase';

export const formsApi = {
  getForm: (slug) => axiosInstance.get(`/forms/${encodeURIComponent(slug)}`),
  getFormById: (id) => axiosInstance.get(`/forms/id/${encodeURIComponent(id)}`),
  submit: (slug, body) => axiosInstance.post(`/forms/${encodeURIComponent(slug)}/submit`, body),
  submitMultipart: (slug, formData) => axiosInstance.post(`/forms/${encodeURIComponent(slug)}/submit`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 120000,
  }),
  uploadFile: (slug, fieldName, file) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('fieldName', fieldName);
    return axiosInstance.post(`/forms/${encodeURIComponent(slug)}/upload`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 120000,
    });
  },
};
