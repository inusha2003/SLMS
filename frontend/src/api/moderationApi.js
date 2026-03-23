import axiosInstance from './axiosInstance';

export const moderationApi = {
  getStats: () => axiosInstance.get('/moderation/stats'),
  getReports: (params) => axiosInstance.get('/moderation/reports', { params }),
  reviewReport: (id, data) => axiosInstance.patch(`/moderation/reports/${id}`, data),
  deleteContent: (data) => axiosInstance.delete('/moderation/content', { data }),
  getLogs: (params) => axiosInstance.get('/moderation/logs', { params }),
  getFlaggedNotes: () => axiosInstance.get('/moderation/flagged-notes'),
  warnUser: (data) => axiosInstance.post('/moderation/warn', data),
};