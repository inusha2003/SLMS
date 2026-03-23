import axiosInstance from './axiosInstance';

export const commentApi = {
  getAll: (noteId) => axiosInstance.get(`/notes/${noteId}/comments`),
  create: (noteId, data) => axiosInstance.post(`/notes/${noteId}/comments`, data),
  update: (noteId, commentId, data) =>
    axiosInstance.put(`/notes/${noteId}/comments/${commentId}`, data),
  delete: (noteId, commentId) =>
    axiosInstance.delete(`/notes/${noteId}/comments/${commentId}`),
  like: (noteId, commentId) =>
    axiosInstance.post(`/notes/${noteId}/comments/${commentId}/like`),
  report: (noteId, commentId, data) =>
    axiosInstance.post(`/notes/${noteId}/comments/${commentId}/report`, data),
};