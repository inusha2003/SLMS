import Task from '../models/Task.js';

export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ tasks });
  } catch (error) {
    console.error('getTasks error:', error);
    res.status(500).json({ message: 'Failed to fetch tasks' });
  }
};

export const createTask = async (req, res) => {
  try {
    const { title, due, category, priority } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ message: 'Title is required' });

    const task = new Task({
      user: req.user._id,
      title: title.trim(),
      due: due ? new Date(due) : null,
      category: category || undefined,
      priority: priority || 'Medium',
    });

    await task.save();
    res.status(201).json({ task });
  } catch (error) {
    console.error('createTask error:', error);
    res.status(500).json({ message: 'Failed to create task' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    const { title, due, done, category, priority } = req.body;
    if (typeof title !== 'undefined') task.title = title;
    if (typeof due !== 'undefined') task.due = due ? new Date(due) : null;
    if (typeof done !== 'undefined') task.done = done;
    if (typeof category !== 'undefined') task.category = category;
    if (typeof priority !== 'undefined') task.priority = priority;

    await task.save();
    res.json({ task });
  } catch (error) {
    console.error('updateTask error:', error);
    res.status(500).json({ message: 'Failed to update task' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    if (task.user.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('deleteTask error:', error);
    res.status(500).json({ message: 'Failed to delete task' });
  }
};
