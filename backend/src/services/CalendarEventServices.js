import CalendarEvent from "../models/CalendarEventModel.js";
import { createNotification } from "./NotificationServices.js";

export const createCalendarEvent = async (data) => {
    const event = await CalendarEvent.create(data);

    // When a CalendarEvent of type DEADLINE or EXAM is created, create a REMINDER
    if (event.type === "DEADLINE" || event.type === "EXAM") {
        // Determine the target for the notification
        // If the event is global (studentId is null), we'll write it as GLOBAL
        // In a real application, a "GLOBAL" notification could be read by all students.
        const targetStudentId = event.studentId || "GLOBAL";

        await createNotification({
            studentId: targetStudentId,
            title: `Reminder: Upcoming ${event.type}`,
            message: `${event.title} is scheduled for ${new Date(event.date).toLocaleDateString()}`,
            type: "REMINDER",
        });
    }

    return event;
};

export const getStudentEvents = async (studentId, from, to) => {
    const query = {
        $or: [{ studentId: studentId }, { studentId: null }],
    };

    if (from || to) {
        query.date = {};
        if (from) query.date.$gte = new Date(from);
        if (to) query.date.$lte = new Date(to);
    }

    return await CalendarEvent.find(query).sort({ date: 1 });
};

export const updateCalendarEvent = async (id, data) => {
    return await CalendarEvent.findByIdAndUpdate(id, data, { new: true });
};

export const deleteCalendarEvent = async (id) => {
    return await CalendarEvent.findByIdAndDelete(id);
};
