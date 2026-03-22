const mongoose = require("mongoose");

const { Schema } = mongoose;

const userSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
      // Basic email validation; the app can enforce stricter rules if needed.
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    password: { type: String, required: true, minlength: 6 },
    role: { type: String, enum: ["Student", "Admin"], required: true },
    semester: { type: Number, required: true, min: 1 },
    faculty: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);

