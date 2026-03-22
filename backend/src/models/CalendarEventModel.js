import mongoose from "mongoose";

const calendarEventSchema = new mongoose.Schema(
    {
        studentId: { type: String, default: null }, // nullable for global/admin events
        title: { type: String, required: true },
        type: {
            type: String,
            enum: ["EXAM", "DEADLINE", "EVENT", "LECTURE", "HOLIDAY", "OTHER"],
            required: true,
        },
        date: { type: Date, required: true },
        startTime: { type: String, default: null },
        endTime: { type: String, default: null },
        isAllDay: { type: Boolean, default: false },
        description: { type: String, default: null },
        createdByRole: {
            type: String,
            enum: ["ADMIN", "STUDENT"],
            default: "STUDENT",
        },
    },
    { timestamps: true }
);

export default mongoose.model("CalendarEvent", calendarEventSchema);
