import { errorResponse } from '../utils/apiResponse.js';

export const adminOnly = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 401, 'Authentication required.');
  }
  if (req.user.role !== 'Admin') {
    return errorResponse(res, 403, 'Access denied. Admin privileges required.');
  }
  next();
};

export const studentOnly = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 401, 'Authentication required.');
  }
  if (req.user.role !== 'Student') {
    return errorResponse(res, 403, 'Access denied. Student access only.');
  }
  next();
};

export const adminOrStudent = (req, res, next) => {
  if (!req.user) {
    return errorResponse(res, 401, 'Authentication required.');
  }
  if (!['Admin', 'Student'].includes(req.user.role)) {
    return errorResponse(res, 403, 'Access denied. Invalid role.');
  }
  next();
};