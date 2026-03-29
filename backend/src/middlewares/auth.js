import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized - no token' });
  }

  try {
    const secret = String(process.env.JWT_SECRET ?? '').trim();
    if (!secret) {
      return res.status(500).json({ message: 'Server misconfiguration' });
    }
    const decoded = jwt.verify(token, secret);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated. Contact administrator.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ message: 'Not authorized - token invalid' });
  }
};