import User from '../models/User.js';

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

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { academicYear, semester, firstName, lastName } = req.body;
    const updates = {};

    if (firstName) updates.firstName = firstName;
    if (lastName) updates.lastName = lastName;
    if (academicYear) updates.academicYear = academicYear;
    if (semester) updates.semester = semester;

    if (academicYear && semester) {
      updates.isProfileComplete = true;
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({ message: 'Profile updated', user: sanitizeUser(user) });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};