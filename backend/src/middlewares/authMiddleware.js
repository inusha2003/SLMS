import jwt from 'jsonwebtoken';
import { errorResponse } from '../utils/apiResponse.js';

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 401, 'Access denied. No token provided.');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return errorResponse(res, 401, 'Access denied. Invalid token format.');
    }

    let decoded = null;

    // First try standard JWT verification
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Fallback: try base64 demo token (for development/demo mode)
      try {
        const payload = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
        const now = Math.floor(Date.now() / 1000);
        if (!payload.userId || !payload.role) {
          return errorResponse(res, 401, 'Invalid token payload.');
        }
        if (payload.exp && payload.exp < now) {
          return errorResponse(res, 401, 'Token expired. Please login again.');
        }
        decoded = payload;
      } catch (base64Error) {
        return errorResponse(res, 401, 'Invalid token. Access denied.');
      }
    }

    if (!decoded) {
      return errorResponse(res, 401, 'Invalid token. Access denied.');
    }

    req.user = decoded;
    next();
  } catch (error) {
    return errorResponse(res, 500, 'Internal server error during authentication.');
  }
};

export default authMiddleware;