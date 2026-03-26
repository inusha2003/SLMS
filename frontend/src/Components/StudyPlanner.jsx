import { useMemo, useState } from 'react';
import { useTasks } from '../context/TaskContext';
import { CheckCircle2, Circle, ClipboardList, Plus, Pencil, Trash2, X, Save } from 'lucide-react';

const priorities = ['Low', 'Medium', 'High'];

const StudyPlanner = () => {
  const { tasks, addTask, updateTask, deleteTask, toggleDone } = useTasks();

  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState('Medium');

  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState({ title: '', dueDate: '', priority: 'Medium' });

  const stats = useMemo(() => {
    const total = tasks.length;
    const done = tasks.filter((t) => t.done).length;
    return { total, done, pending: total - done };
  }, [tasks]);

  const sorted = useMemo(() => {
    const copy = [...tasks];
    copy.sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1;
      const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
      const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
      return ad - bd;
    });
    return copy;
  }, [tasks]);

  const onCreate = (e) => {
    e.preventDefault();
    const res = addTask({ title, dueDate, priority });
    if (!res.ok) return;

    setTitle('');
    setDueDate('');
    setPriority('Medium');
  };

  const startEdit = (t) => {
    setEditingId(t.id);
    setEdit({ title: t.title, dueDate: t.dueDate || '', priority: t.priority || 'Medium' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEdit({ title: '', dueDate: '', priority: 'Medium' });
  };

  const saveEdit = () => {
    const clean = edit.title.trim();
    if (!clean) return;
    updateTask(editingId, { title: clean, dueDate: edit.dueDate || '', priority: edit.priority || 'Medium' });
    cancelEdit();
  };

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))',
              border: '1px solid var(--border-color)',
            }}
          >
            <ClipboardList className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Task Manager
            </h3>
            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              Total {stats.total} · Pending {stats.pending} · Done {stats.done}
            </p>
          </div>
        </div>
      </div>

      {/* Create */}
      <form
        onSubmit={onCreate}
        className="mt-4 rounded-xl p-3"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)' }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-2">
            <input
              className="input-field"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add a task (e.g., Revise Chapter 03)"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input className="input-field" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            <select className="input-field" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <button type="submit" className="btn-primary mt-3" style={{ width: '100%', padding: '0.8rem' }}>
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </form>

      {/* List */}
      <div className="mt-4">
        {sorted.length === 0 ? (
          <div
            className="rounded-xl p-4 text-sm"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px dashed var(--border-color)',
              color: 'var(--text-secondary)',
            }}
          >
            No tasks yet. Add your first task above.
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((t) => {
              const isEditing = editingId === t.id;

              return (
                <div
                  key={t.id}
                  className="rounded-xl p-3"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    border: `1px solid var(--border-color)`,
                    boxShadow: 'var(--shadow-card)',
                    opacity: t.done ? 0.85 : 1,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleDone(t.id)}
                      className="mt-0.5"
                      style={{ color: t.done ? '#22c55e' : 'var(--text-muted)' }}
                      title={t.done ? 'Mark as pending' : 'Mark as done'}
                    >
                      {t.done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      {!isEditing ? (
                        <>
                          <div className="flex items-center justify-between gap-3">
                            <p
                              className="font-semibold truncate"
                              style={{
                                color: 'var(--text-primary)',
                                textDecoration: t.done ? 'line-through' : 'none',
                              }}
                            >
                              {t.title}
                            </p>
                            <span className="badge-primary">{t.priority || 'Medium'}</span>
                          </div>

                          <div className="mt-1 flex items-center justify-between gap-3">
                            <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {t.dueDate ? `Due: ${new Date(t.dueDate).toLocaleDateString()}` : 'No due date'}
                            </p>

                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                className="btn-secondary"
                                style={{ padding: '0.4rem 0.65rem', fontSize: '0.75rem' }}
                                onClick={() => startEdit(t)}
                              >
                                <Pencil className="w-4 h-4" />
                                Edit
                              </button>
                              <button type="button" className="btn-danger" onClick={() => deleteTask(t.id)}>
                                <Trash2 className="w-4 h-4" />
                                Delete
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <div className="sm:col-span-2">
                              <input
                                className="input-field"
                                value={edit.title}
                                onChange={(e) => setEdit((p) => ({ ...p, title: e.target.value }))}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <input
                                className="input-field"
                                type="date"
                                value={edit.dueDate}
                                onChange={(e) => setEdit((p) => ({ ...p, dueDate: e.target.value }))}
                              />
                              <select
                                className="input-field"
                                value={edit.priority}
                                onChange={(e) => setEdit((p) => ({ ...p, priority: e.target.value }))}
                              >
                                {priorities.map((p) => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="mt-2 flex items-center justify-end gap-2">
                            <button type="button" className="btn-secondary" onClick={cancelEdit}>
                              <X className="w-4 h-4" />
                              Cancel
                            </button>
                            <button type="button" className="btn-primary" onClick={saveEdit}>
                              <Save className="w-4 h-4" />
                              Save
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default StudyPlanner;