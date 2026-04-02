import jwt from 'jsonwebtoken';
import User from '../models/User.js';

function getJwtSignOptions() {
  const secret = String(process.env.JWT_SECRET ?? '').trim();
  const expiresIn = String(process.env.JWT_EXPIRE ?? '7d').trim();
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return { secret, expiresIn };
}

const signToken = (userId, role) => {
  const { secret, expiresIn } = getJwtSignOptions();
  return jwt.sign({ userId: String(userId), role }, secret, { expiresIn });
};

const sanitizeUser = (u) => {
  const x = typeof u?.toObject === 'function' ? u.toObject() : u;
  return {
    id: x._id != null ? String(x._id) : null,
    firstName: x.firstName ?? '',
    lastName: x.lastName ?? '',
    email: x.email ?? '',
    role: x.role ?? 'Student',
    academicYear: x.academicYear ?? '',
    semester: x.semester ?? '',
    isProfileComplete: Boolean(x.isProfileComplete),
    isActive: x.isActive !== false,
    createdAt: x.createdAt ? new Date(x.createdAt).toISOString() : null,
  };
};

export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    console.log('Register request:', { firstName, lastName, email });

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: 'Student',
    });

    console.log('User created:', user.email);

    const token = signToken(user._id, user.role);
    res.status(201).json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Login request:', { email });

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      console.log('User not found:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: 'Account deactivated. Contact administrator.' });
    }

    let isMatch = false;
    try {
      isMatch = await user.comparePassword(String(password));
    } catch (e) {
      console.error('Password compare error:', e.message);
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    console.log('Password match:', isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = signToken(user._id, user.role);
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};