import * as NotificationServices from "../services/NotificationServices.js";

export const getStudentNotifications = async (req, res) => {
    try {
        const { studentId } = req.params;
        const notifications = await NotificationServices.getStudentNotifications(studentId);
        res.status(200).json(notifications);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const notification = await NotificationServices.markAsRead(id);
        if (!notification) return res.status(404).json({ message: "Notification not found" });
        res.status(200).json(notification);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const markAllAsRead = async (req, res) => {
    try {
        const { studentId } = req.params;
        const result = await NotificationServices.markAllAsRead(studentId);
        res.status(200).json({ message: "All notifications marked as read", result });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
