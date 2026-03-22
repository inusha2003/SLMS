import * as CalendarEventServices from "../services/CalendarEventServices.js";

export const createCalendarEvent = async (req, res) => {
    try {
        const event = await CalendarEventServices.createCalendarEvent(req.body);
        res.status(201).json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const getStudentEvents = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { from, to } = req.query;
        const events = await CalendarEventServices.getStudentEvents(studentId, from, to);
        res.status(200).json(events);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateCalendarEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await CalendarEventServices.updateCalendarEvent(id, req.body);
        if (!event) return res.status(404).json({ message: "Event not found" });
        res.status(200).json(event);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

export const deleteCalendarEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const event = await CalendarEventServices.deleteCalendarEvent(id);
        if (!event) return res.status(404).json({ message: "Event not found" });
        res.status(200).json({ message: "Event deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
