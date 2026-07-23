import axiosInstance from './axiosBase';

/** Timeline Platform read API (C.8.0.4). */
export const timelineApi = {
  listMine: (params) => axiosInstance.get('/timeline', { params }),
  listForApplication: (applicationId, params) =>
    axiosInstance.get(`/timeline/applications/${applicationId}`, { params }),
};
