import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ["REMINDER", "WARNING", "ACHIEVEMENT", "INFO"],
      required: true,
    },
    isRead: { type: Boolean, default: false },
    meta: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);
