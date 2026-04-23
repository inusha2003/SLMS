import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/MAuthContext';
import {
  TrendingUp,
  GraduationCap,
  Award,
  Settings,
  FileText,
  Cpu,
  Bell,
  ArrowRight,
  CheckSquare,
  Clock,
  Plus,
  Trash,
  Edit
} from 'lucide-react';

/* ═══════ ANIMATED BACKGROUND ═══════ */
const DashboardBackground = () => (
  <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
    {/* Soft Gradient Blobs */}
    <div className="animate-pulse-glow" style={{ position: 'absolute', top: '10%', left: '-5%', width: '18rem', height: '18rem', borderRadius: '50%', backgroundColor: 'rgba(59,130,246,0.08)', filter: 'blur(80px)' }} />
    <div className="animate-float-slow" style={{ position: 'absolute', top: '40%', right: '-10%', width: '25rem', height: '25rem', borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.06)', filter: 'blur(100px)', animationDelay: '2s' }} />
    <div className="animate-pulse-glow" style={{ position: 'absolute', bottom: '5%', left: '10%', width: '20rem', height: '20rem', borderRadius: '50%', backgroundColor: 'rgba(20,184,166,0.05)', filter: 'blur(90px)', animationDelay: '3s' }} />

    {/* Floating Particles */}
    <div className="animate-particle-1 glow-blue" style={{ position: 'absolute', top: '15%', left: '12%', width: 6, height: 6, borderRadius: '50%', backgroundColor: '#3b82f6' }} />
    <div className="animate-particle-2 glow-indigo" style={{ position: 'absolute', top: '35%', right: '15%', width: 5, height: 5, borderRadius: '50%', backgroundColor: '#6366f1' }} />
    <div className="animate-particle-3 glow-teal" style={{ position: 'absolute', bottom: '25%', left: '25%', width: 4, height: 4, borderRadius: '50%', backgroundColor: '#14b8a6' }} />

    {/* Orbit Rings */}
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '60rem', height: '60rem', pointerEvents: 'none' }} className="hidden lg:block">
      <div className="animate-spin-slow" style={{ position: 'absolute', inset: 0, border: '1px solid rgba(59,130,246,0.04)', borderRadius: '50%' }} />
      <div className="animate-spin-reverse" style={{ position: 'absolute', inset: '6rem', border: '1px solid rgba(99,102,241,0.03)', borderRadius: '50%' }} />
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const initials = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '');

  const quickActions = [
    { title: 'Study Notes', desc: 'Browse & Upload Notes', icon: FileText, color: 'from-blue-500 to-blue-600', link: '/student/browse-notes' },
    { title: 'AI Assistant', desc: 'PDF Summaries & MCQs', icon: Cpu, color: 'from-violet-500 to-purple-600', link: '/ai-tools' },
    { title: 'My Performance', desc: 'Analytics & Charts', icon: TrendingUp, color: 'from-emerald-500 to-teal-600', link: '/performance' },
  ];

  // Demo tasks with createdAt
  const demoTasks = [
    { id: 1, title: 'Complete Maths Assignment', category: 'Assignments', priority: 'High', due: '2026-03-28', createdAt: '2026-03-20T09:00:00Z', done: false },
    { id: 2, title: 'Review Physics Notes', category: 'Revision', priority: 'Medium', due: '2026-03-29', createdAt: '2026-03-21T14:30:00Z', done: true },
    { id: 3, title: 'Submit Project Report', category: 'Project', priority: 'Low', due: '2026-04-02', createdAt: '2026-03-22T11:15:00Z', done: false },
  ];

  // State
  const [tasks, setTasks] = useState(demoTasks);
  const [showModal, setShowModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);

  const [titleInput, setTitleInput] = useState('');
  const [categoryInput, setCategoryInput] = useState('Study');
  const [priorityInput, setPriorityInput] = useState('Medium');
  const [dueInput, setDueInput] = useState('');

  // Notifications
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const categories = ['Study', 'Assignments', 'Revision', 'Project', 'Exam Prep'];
  const priorities = ['High', 'Medium', 'Low'];
  // Use site theme CSS variables so the planner matches the rest of the page
  const priorityColors = { High: 'var(--color-lms-rose)', Medium: 'var(--color-lms-amber)', Low: 'var(--color-lms-teal)' };
  const themeDark = 'var(--color-lms-accent)';    // primary accent from theme
  const themeAccent = 'var(--color-lms-warm)';   // warm/violet accent from theme

  // Helpers
  const resetModal = () => {
    setTitleInput('');
    setCategoryInput('Study');
    setPriorityInput('Medium');
    setDueInput('');
    setEditingTaskId(null);
  };

  const openAdd = () => {
    resetModal();
    setShowModal(true);
  };

  const startEdit = (task) => {
    setEditingTaskId(task.id);
    setTitleInput(task.title || '');
    setCategoryInput(task.category || 'Study');
    setPriorityInput(task.priority || 'Medium');
    setDueInput(task.due || '');
    setShowModal(true);
  };

  const addOrSaveTask = () => {
    if (!titleInput.trim()) return;
    const payload = {
      title: titleInput.trim(),
      category: categoryInput,
      priority: priorityInput,
      due: dueInput || '',
    };

    if (editingTaskId) {
      setTasks(prev => prev.map(t => t.id === editingTaskId ? { ...t, ...payload } : t));
    } else {
      const newTask = { id: Date.now(), ...payload, createdAt: new Date().toISOString(), done: false };
      setTasks(prev => [newTask, ...prev]);
    }

    resetModal();
    setShowModal(false);
  };

  const toggleDone = (id) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTask = (id) => setTasks(prev => prev.filter(t => t.id !== id));

  const formatDate = (iso) => {
    if (!iso) return 'No date';
    try { return new Date(iso).toLocaleDateString(); } catch { return iso; }
  };

  // Nice formatted date: Mar 27, 2026
  const formatNice = (iso) => {
    if (!iso) return 'No date';
    try { return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); } catch { return iso; }
  };

  // Notifications: tasks due within 2 days and not completed
  const nearDeadlineTasks = tasks.filter(task => {
    const dueStr = task.dueDate ?? task.due;
    const completed = task.completed ?? task.done;
    if (!dueStr) return false;
    const diff = (new Date(dueStr) - new Date()) / (1000 * 60 * 60 * 24);
    return diff <= 2 && diff > -1 && !completed;
  });

  console.log("Urgent Tasks:", nearDeadlineTasks);

  const toggleNotifications = () => setShowNotifications(v => !v);

  useEffect(() => {
    const onDoc = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div style={{ minHeight: 'calc(100vh - 4rem)', position: 'relative', overflow: 'hidden' }}>
      <DashboardBackground />

      <div style={{ maxWidth: '90rem', margin: '0 auto', padding: '2rem 1rem', position: 'relative', zIndex: 10 }} className="animate-in fade-in duration-500">

        {/* Welcome Banner */}
        <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.1) 100%)', backdropFilter: 'blur(12px)', borderRadius: '1.5rem', border: '1px solid rgba(59,130,246,0.2)', padding: '2.5rem', marginBottom: '2rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '-6rem', right: '-6rem', width: '16rem', height: '16rem', borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.1)', filter: 'blur(48px)' }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="md:flex-row md:items-center md:justify-between">
            <div>
              <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--text-primary)' }}>Welcome back, <span className="text-lms-primary">{user?.firstName}</span></h1>
              <p style={{ marginTop: '0.5rem', fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '36rem' }}>Ready to continue your <strong style={{ color: 'var(--text-primary)' }}>{user?.academicYear}</strong> journey? Check your latest notes and AI summaries below.</p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ position: 'relative' }} ref={notifRef}>
                <button onClick={toggleNotifications} style={{ padding: '0.75rem', borderRadius: '9999px', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-color)', position: 'relative', cursor: 'pointer' }} aria-haspopup="true" aria-expanded={showNotifications}>
                  <Bell style={{ width: 20, height: 20, color: 'var(--text-secondary)' }} />
                  <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: '#ef4444' }} className="animate-ping" />
                </button>

                {showNotifications && (
                  <div className="absolute z-50" style={{ right: 0, marginTop: 8, width: 320 }}>
                    <div className="notif-dropdown bg-[#20152B]/80 backdrop-blur" style={{ color: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <strong>Notifications</strong>
                        <button onClick={() => setShowNotifications(false)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {nearDeadlineTasks.length === 0 ? (
                          <div style={{ color: 'var(--text-muted)' }}>No urgent tasks</div>
                        ) : (
                          nearDeadlineTasks.map(t => (
                            <div key={t.id} className={`notif-item ${'urgent'}`} style={{ padding: '0.5rem', borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
                              <div style={{ fontSize: 13, fontWeight: 800, color: '#ffdede' }}>Urgent: {t.title} is due on {formatNice(t.due ?? t.dueDate)}!</div>
                              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{t.category} • Priority: {t.priority}</div>
                            </div>
                          ))
                        )}

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <button className="btn-secondary" onClick={() => { setShowNotifications(false); navigate('/planner'); }} style={{ background: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.08)' }}>Open Planner</button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <Link to="/profile-setup" className="btn-primary" style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', boxShadow: '0 8px 24px rgba(59,130,246,0.2)' }}>
                <Settings style={{ width: 20, height: 20 }} /> Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="lg:grid-cols-4">

          {/* Left Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Profile Card */}
            <div className="card" style={{ borderTop: '4px solid #3b82f6', overflow: 'hidden' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', width: '6rem', height: '6rem', margin: '0 auto 1rem', }}>
                  <div style={{ width: '100%', height: '100%', borderRadius: '1.5rem', background: 'linear-gradient(135deg, #3b82f6, #6366f1)', border: '2px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(59,130,246,0.25)' }}>
                    <span style={{ fontSize: '2.25rem', fontWeight: 900, color: 'white' }}>{initials}</span>
                  </div>
                  <div style={{ position: 'absolute', bottom: '-0.5rem', right: '-0.5rem', width: '1.5rem', height: '1.5rem', borderRadius: '50%', backgroundColor: '#22c55e', border: '3px solid var(--bg-card)' }} />
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{user?.firstName} {user?.lastName}</h2>
                <span style={{ padding: '0.375rem 0.75rem', borderRadius: '9999px', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', backgroundColor: 'rgba(59,130,246,0.1)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.2)' }}>{user?.role || 'Student'}</span>
              </div>

              <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Academic Year</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.academicYear || 'Not Set'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current Semester</span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)' }}>{user?.semester || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Personal Study Planner (Refactored) */}
            <div className="card" style={{ borderColor: 'rgba(99,102,241,0.12)', overflow: 'hidden', background: 'linear-gradient(180deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))', backdropFilter: 'blur(8px)', border: '1px solid rgba(99,102,241,0.06)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'white' }}><CheckSquare style={{ color: '#6ee7b7' }} /> Personal Study Planner</h4>
                <button onClick={() => navigate('/planner')} style={{ padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8rem', fontWeight: 700, background: 'linear-gradient(90deg, var(--color-lms-accent), var(--color-lms-primary))', color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', transition: 'all 0.2s', boxShadow: '0 8px 20px rgba(59,130,246,0.18)' }}><Plus style={{ width: 14, height: 14 }} /> Add Task</button>
              </div>

              {/* Tasks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {tasks.map(task => (
                  <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.6rem', borderRadius: '0.75rem', background: 'linear-gradient(180deg, rgba(255,255,255,0.01), rgba(255,255,255,0.02))', backdropFilter: 'blur(6px)', borderLeft: `4px solid ${priorityColors[task.priority] || '#6C546A'}` }}>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      <input type="checkbox" checked={task.done} onChange={() => toggleDone(task.id)} style={{ width: 18, height: 18, cursor: 'pointer' }} />
                      <div>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: task.done ? '#9CA3AF' : 'white', textDecoration: task.done ? 'line-through' : 'none' }}>{task.title}</div>
                          <span style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem', borderRadius: '999px', background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>{task.category}</span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                          <div>Added on: <span style={{ color: 'white', fontWeight: 700 }}>{formatNice(task.createdAt)}</span></div>
                          <div>Due on: <span style={{ color: 'white', fontWeight: 700 }}>{task.due ? formatNice(task.due) : 'No date'}</span></div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <div style={{ width: 12, height: 12, borderRadius: 999, background: priorityColors[task.priority] || themeAccent }} title={`Priority: ${task.priority}`} />
                      <button onClick={() => startEdit(task)} aria-label="Edit task" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Edit style={{ width: 16, height: 16 }} /></button>
                      <button onClick={() => deleteTask(task.id)} aria-label="Delete task" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><Trash style={{ width: 16, height: 16 }} /></button>
                    </div>
                  </div>
                ))}

                {tasks.length === 0 && (
                  <div style={{ padding: '0.75rem', borderRadius: '0.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>No tasks yet — click "Add Task" to create your first study plan.</div>
                )}
              </div>

              <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(255,255,255,0.03)', fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center' }}>Manage your daily study tasks here. Tasks are stored locally for now and will sync with your account once back-end integration is added.</div>

              {/* Modal: Add / Edit */}
              {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(2,2,6,0.6)' }}>
                  <div style={{ width: 'min(720px, 95%)', borderRadius: 12, padding: '1rem' }}>
                    <div style={{ background: 'linear-gradient(180deg, rgba(32,21,43,0.95), rgba(32,21,43,0.85))', borderRadius: 10, padding: '1.25rem', border: '1px solid rgba(255,255,255,0.04)', color: 'white', backdropFilter: 'blur(8px)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                        <h3 style={{ color: 'white', fontWeight: 800, fontSize: '1.05rem' }}>{editingTaskId ? 'Edit Task' : 'Add New Task'}</h3>
                        <button onClick={() => { setShowModal(false); resetModal(); }} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}>✕</button>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }} className="md:grid-cols-2">
                        <input className="input-field" placeholder="Task title" value={titleInput} onChange={(e) => setTitleInput(e.target.value)} style={{ background: 'rgba(255,255,255,0.02)', color: 'white', border: '1px solid rgba(255,255,255,0.04)' }} />

                        <select className="input-field" value={categoryInput} onChange={(e) => setCategoryInput(e.target.value)} style={{ background: 'rgba(255,255,255,0.02)', color: 'white', border: '1px solid rgba(255,255,255,0.04)' }}>
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>

                        {/* Priority Pills */}
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => setPriorityInput('High')} style={{ padding: '0.45rem 0.85rem', borderRadius: 999, border: 'none', background: priorityInput === 'High' ? `linear-gradient(90deg, ${priorityColors.High}, ${themeDark})` : 'rgba(255,255,255,0.03)', color: priorityInput === 'High' ? 'white' : 'var(--text-muted)', fontWeight: 800, cursor: 'pointer' }}>High</button>
                          <button type="button" onClick={() => setPriorityInput('Medium')} style={{ padding: '0.45rem 0.85rem', borderRadius: 999, border: 'none', background: priorityInput === 'Medium' ? `linear-gradient(90deg, ${priorityColors.Medium}, ${themeDark})` : 'rgba(255,255,255,0.03)', color: priorityInput === 'Medium' ? 'white' : 'var(--text-muted)', fontWeight: 800, cursor: 'pointer' }}>Medium</button>
                          <button type="button" onClick={() => setPriorityInput('Low')} style={{ padding: '0.45rem 0.85rem', borderRadius: 999, border: 'none', background: priorityInput === 'Low' ? `linear-gradient(90deg, ${priorityColors.Low}, ${themeDark})` : 'rgba(255,255,255,0.03)', color: priorityInput === 'Low' ? 'white' : 'var(--text-muted)', fontWeight: 800, cursor: 'pointer' }}>Low</button>
                        </div>

                        {/* Due date (native) */}
                        <input type="date" className="input-field" value={dueInput} onChange={(e) => setDueInput(e.target.value)} style={{ background: 'rgba(255,255,255,0.02)', color: 'white', border: '1px solid rgba(255,255,255,0.04)' }} />

                        <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.25rem' }}>
                          <button onClick={() => { setShowModal(false); resetModal(); }} className="btn-secondary" style={{ background: 'transparent', color: 'white', borderColor: 'rgba(255,255,255,0.08)' }}>Cancel</button>
                          <button onClick={() => { addOrSaveTask(); }} className="btn-primary" style={{ background: `linear-gradient(90deg, ${themeAccent}, ${themeDark})`, border: 'none' }}>{editingTaskId ? 'Save Changes' : 'Add Task'}</button>
                        </div>

                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* Main Content Area */}
          <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Quick Action Modules */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 6, height: '1.5rem', borderRadius: '9999px', backgroundColor: '#3b82f6' }} />
                Learning Modules
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }} className="md:grid-cols-2">
                {quickActions.map((action, i) => (
                  <div key={i} onClick={() => navigate(action.link)} style={{ cursor: 'pointer' }} className="card group">
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                      <div style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem', background: `linear-gradient(135deg, ${action.color})`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', transition: 'all 0.3s' }} className="group-hover:scale-110 group-hover:rotate-3">
                        <action.icon style={{ width: 28, height: 28, color: 'white' }} />
                      </div>

                      <div style={{ flex: 1, width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', transition: 'all 0.2s' }} className="group-hover:text-lms-primary">{action.title}</h3>
                          <ArrowRight style={{ width: 16, height: 16, color: 'var(--text-muted)', opacity: 0, transform: 'translateX(-8px)', transition: 'all 0.3s' }} className="group-hover:opacity-100 group-hover:translate-x-0" />
                        </div>
                        <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{action.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights Box */}
            <div className="card" style={{ borderColor: 'rgba(139,92,246,0.3)', background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, transparent 100%)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <Cpu style={{ width: 20, height: 20, color: '#8b5cf6' }} /> Smart AI Insights
                </h2>
                <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.5rem', fontSize: '0.65rem', fontWeight: 700, backgroundColor: '#8b5cf6', color: 'white', fontStyle: 'italic' }}>NEW</span>
              </div>

              <div style={{ padding: '1rem', borderRadius: '0.75rem', backgroundColor: 'rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', fontStyle: 'italic', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                "Based on your recent uploads, I recommend focusing on <span style={{ color: '#8b5cf6', textDecoration: 'underline', textUnderlineOffset: 4 }}>Distributed Systems</span> notes today."
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
