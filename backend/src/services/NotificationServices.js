import Notification from "../models/NotificationModel.js";

export const createNotification = async (data) => {
    return await Notification.create(data);
};

export const getStudentNotifications = async (studentId) => {
    return await Notification.find({ studentId }).sort({ createdAt: -1 });
};

export const markAsRead = async (id) => {
    return await Notification.findByIdAndUpdate(
        id,
        { isRead: true },
        { new: true }
    );
};

export const markAllAsRead = async (studentId) => {
    return await Notification.updateMany({ studentId }, { isRead: true });
};
