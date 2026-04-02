import axiosInstance from './axiosInstance';

export const noteApi = {
  getAll: (params) => axiosInstance.get('/notes', { params }),
  getById: (id) => axiosInstance.get(`/notes/${id}`),
  getMine: (params) => axiosInstance.get('/notes/my', { params }),
  getPending: () => axiosInstance.get('/notes/pending'),
  create: (formData) =>
    axiosInstance.post('/notes', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  update: (id, formData) =>
    axiosInstance.put(`/notes/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  delete: (id) => axiosInstance.delete(`/notes/${id}`),
  review: (id, data) => axiosInstance.patch(`/notes/${id}/review`, data),
};