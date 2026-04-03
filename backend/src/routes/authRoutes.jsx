const express = require("express");

const User = require("../models/UserModel.jsx");
const { issueAuthToken } = require("../utils/authToken.cjs");

const router = express.Router();

router.post("/register", async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      semester,
      faculty,
      academicYear,
      semesterOfYear,
    } = req.body || {};
    const normalizedRole = String(role || "Student").trim();
    const normalizedYear = Number(academicYear);
    const normalizedSemesterOfYear = Number(semesterOfYear);
    const computedSemester =
      Number(semester) ||
      (Number.isFinite(normalizedYear) &&
      normalizedYear >= 1 &&
      normalizedYear <= 4 &&
      [1, 2].includes(normalizedSemesterOfYear)
        ? (normalizedYear - 1) * 2 + normalizedSemesterOfYear
        : NaN);

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required.",
      });
    }

    if (!["Admin", "Student"].includes(normalizedRole)) {
      return res.status(400).json({
        message: "Role must be Admin or Student.",
      });
    }

    if (normalizedRole === "Student") {
      if (
        !Number.isFinite(computedSemester) ||
        computedSemester < 1 ||
        computedSemester > 8 ||
        !String(faculty || "").trim()
      ) {
        return res.status(400).json({
          message: "Student registration requires a valid year, semester, and faculty.",
        });
      }
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail }).lean();
    if (existingUser) {
      return res.status(409).json({
        message: "An account with this email already exists.",
      });
    }

    const createdUser = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: String(password),
      role: normalizedRole,
      ...(normalizedRole === "Student"
        ? {
            semester: computedSemester,
            faculty: String(faculty).trim(),
          }
        : {}),
    });

    const token = issueAuthToken(createdUser);

    return res.status(201).json({
      token,
      user: {
        id: String(createdUser._id),
        name: createdUser.name,
        email: createdUser.email,
        role: createdUser.role,
        semester: createdUser.semester,
        faculty: createdUser.faculty,
      },
    });
  } catch (err) {
    console.error("Register error:", err);
    return res.status(500).json({
      message: "Could not complete registration.",
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required.",
      });
    }

    const user = await User.findOne({
      email: String(email).trim().toLowerCase(),
    }).lean();

    if (!user || String(user.password) !== String(password)) {
      return res.status(401).json({
        message: "Invalid email or password.",
      });
    }

    const token = issueAuthToken(user);

    return res.status(200).json({
      token,
      user: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        role: user.role,
        semester: user.semester,
        faculty: user.faculty,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      message: "Could not complete login.",
    });
  }
});

module.exports = router;
