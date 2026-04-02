import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// 1. JWT Token එකක් සාදන Helper Function එක
const signToken = (userId, role) =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });

// 2. Frontend එකට යවන්න කලින් User Data ටික පිරිසිදු කරන එක (Password අයින් කරනවා)
const sanitizeUser = (u) => ({
  id: u._id,
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  role: u.role,
  academicYear: u.academicYear,
  semester: u.semester,
  isProfileComplete: u.isProfileComplete,
  isActive: u.isActive,
  createdAt: u.createdAt,
});

// --- REGISTER CONTROLLER ---
export const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password } = req.body;

    // Fields ටික තියෙනවද බලනවා
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // කලින් මේ Email එකෙන් කෙනෙක් ඉන්නවද බලනවා
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // අලුත් User ව Create කරනවා (Default Role එක Student)
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password,
      role: 'Student', // Admin කෙනෙක් ඕනේ නම් පස්සේ DB එකෙන් මාරු කරන්න
      isActive: true    // අලුතින් හැදෙන අයට මේක True වෙන්න ඕනේ
    });

    const token = signToken(user._id, user.role);
    res.status(201).json({ token, user: sanitizeUser(user) });

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// --- LOGIN CONTROLLER ---
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const emailClean = String(email).trim().toLowerCase();
    // User ව හොයනවා + Password එකත් එක්කම ගන්නවා (Schema එකේ select: false නිසා)
    const user = await User.findOne({ email: emailClean }).select('+password');

    console.log('Login attempt for:', emailClean, 'userFound:', !!user);

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (user.isActive === false) {
      console.warn('Blocked login attempt - account deactivated:', emailClean);
      return res.status(403).json({ message: 'Account deactivated. Contact administrator.' });
    }

    if (!user.password) {
      console.error('User record does not include password hash for:', emailClean);
      return res.status(500).json({ message: 'Authentication misconfigured for this account. Contact support.' });
    }

    // Password එක සසඳනවා (Bcrypt Compare)
    const isMatch = await user.comparePassword(password);
    console.log('Password match for', emailClean, isMatch);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // සාර්ථක නම් Token එක හදලා යවනවා
    const token = signToken(user._id, user.role);
    res.json({ token, user: sanitizeUser(user) });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};