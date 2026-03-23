import axiosInstance from './axiosInstance';

export const qaApi = {
  // Questions
  getQuestions: (params) =>
    axiosInstance.get('/qa/questions', { params }),

  getQuestion: (id) =>
    axiosInstance.get(`/qa/questions/${id}`),

  createQuestion: (formData) =>
    axiosInstance.post('/qa/questions', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  updateQuestion: (id, data) =>
    axiosInstance.put(`/qa/questions/${id}`, data),

  deleteQuestion: (id) =>
    axiosInstance.delete(`/qa/questions/${id}`),

  upvoteQuestion: (id) =>
    axiosInstance.post(`/qa/questions/${id}/upvote`),

  // Answers
  createAnswer: (questionId, data) =>
    axiosInstance.post(`/qa/questions/${questionId}/answers`, data),

  updateAnswer: (id, data) =>
    axiosInstance.put(`/qa/answers/${id}`, data),

  deleteAnswer: (id) =>
    axiosInstance.delete(`/qa/answers/${id}`),

  upvoteAnswer: (id) =>
    axiosInstance.post(`/qa/answers/${id}/upvote`),

  acceptAnswer: (questionId, answerId) =>
    axiosInstance.post(
      `/qa/questions/${questionId}/answers/${answerId}/accept`
    ),

  // Reports
  reportContent: (data) =>
    axiosInstance.post('/qa/report', data),
};