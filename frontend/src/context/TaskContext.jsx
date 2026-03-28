import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';

const TaskContext = createContext(null);

const safeParse = (raw, fallback) => {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const makeId = () =>
  (typeof crypto !== 'undefined' && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now()}_${Math.random().toString(16).slice(2)}`;

export const useTasks = () => {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
};

export const TaskProvider = ({ children }) => {
  const { user } = useAuth();

  // ✅ user key stable කරගන්න (ඔයාගේ user object එකේ field එක වෙනස් වෙන්න පුළුවන්)
  const userKey = useMemo(
    () => user?.id || user?._id || user?.userId || user?.email || 'guest',
    [user]
  );

  const storageKey = useMemo(() => `lms_tasks_${userKey}`, [userKey]);

  const [tasks, setTasks] = useState([]);

  // Load tasks when user changes
  useEffect(() => {
    const raw = localStorage.getItem(storageKey);
    setTasks(safeParse(raw, []));
  }, [storageKey]);

  // Persist tasks
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(tasks));
  }, [storageKey, tasks]);

  const addTask = ({ title, dueDate = '', priority = 'Medium' }) => {
    const clean = (title || '').trim();
    if (!clean) return { ok: false, message: 'Title required' };

    const newTask = {
      id: makeId(),
      title: clean,
      dueDate,
      priority,
      done: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    return { ok: true };
  };

  const updateTask = (id, patch) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, ...patch, updatedAt: new Date().toISOString() }
          : t
      )
    );
  };

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const toggleDone = (id) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t))
    );
  };

  return (
    <TaskContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        toggleDone,
        userKey,
      }}
    >
      {children}
    </TaskContext.Provider>
  );
};