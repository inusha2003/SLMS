import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Calendar,
  GraduationCap,
  Award,
  Settings,
  FileText,
  Cpu,
  Bell,
  ArrowRight,
  CheckSquare,
  Clock,
  Plus
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
    { title: 'Study Notes', desc: 'Browse & Upload Notes', icon: FileText, color: 'from-blue-500 to-blue-600', link: '/notes' },
    { title: 'AI Assistant', desc: 'PDF Summaries & MCQs', icon: Cpu, color: 'from-violet-500 to-purple-600', link: '/ai-tools' },
    { title: 'My Performance', desc: 'Analytics & Charts', icon: TrendingUp, color: 'from-emerald-500 to-teal-600', link: '/analytics' },
    { title: 'Academic Calendar', desc: 'Events & Deadlines', icon: Calendar, color: 'from-amber-500 to-orange-600', link: '/calendar' },
  ];

  // Demo Tasks Preview
  const demoTasks = [
    { id: 1, text: 'Complete Maths Assignment', due: 'Today', done: false },
    { id: 2, text: 'Review Physics Notes', due: 'Tomorrow', done: true },
    { id: 3, text: 'Submit Project Report', due: 'Friday', done: false },
  ];

  return (
    <div style={{ minHeight: 'calc(100vh - 4rem)', position: 'relative', overflow: 'hidden' }}>

      {/* Animated Background */}
      <DashboardBackground />

      {/* Main Content */}
      <div style={{ maxWidth: '90rem', marginLeft: 'auto', marginRight: 'auto', padding: '2rem 1rem', position: 'relative', zIndex: 10 }} className="animate-in fade-in duration-500">

        {/* ─── Welcome Banner ─── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(99,102,241,0.1) 100%)',
          backdropFilter: 'blur(12px)',
          borderRadius: '1.5rem',
          border: '1px solid rgba(59,130,246,0.2)',
          padding: '2.5rem',
          marginBottom: '2rem',
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{ position: 'absolute', top: '-6rem', right: '-6rem', width: '16rem', height: '16rem', borderRadius: '50%', backgroundColor: 'rgba(99,102,241,0.1)', filter: 'blur(48px)' }} />

          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }} className="md:flex-row md:items-center md:justify-between">
            <div>
              <h1 style={{ fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', fontWeight: 900, color: 'var(--text-primary)' }}>
                Welcome back, <span className="text-lms-primary">{user?.firstName}</span>
              </h1>
              <p style={{ marginTop: '0.5rem', fontSize: '1.125rem', color: 'var(--text-secondary)', maxWidth: '36rem' }}>
                Ready to continue your <strong style={{ color: 'var(--text-primary)' }}>{user?.academicYear}</strong> journey?
                Check your latest notes and AI summaries below.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexShrink: 0 }}>
              <button
                onClick={() => navigate('/notifications')}
                style={{
                  padding: '0.75rem',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--bg-card)',
                  border: '1px solid var(--border-color)',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                <Bell style={{ width: 20, height: 20, color: 'var(--text-secondary)' }} />
                <span style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '0.5rem', height: '0.5rem', borderRadius: '50%', backgroundColor: '#ef4444' }} className="animate-ping" />
              </button>

              <Link
                to="/profile-setup"
                className="btn-primary"
                style={{ padding: '0.75rem 1.5rem', borderRadius: '0.75rem', boxShadow: '0 8px 24px rgba(59,130,246,0.2)' }}
              >
                <Settings style={{ width: 20, height: 20 }} /> Edit Profile
              </Link>
            </div>
          </div>
        </div>

        {/* ─── Grid Layout ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2rem' }} className="lg:grid-cols-4">

          {/* ═══ Left Sidebar: Profile Card ═══ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Main Profile Card */}
            <div className="card" style={{ borderTop: '4px solid #3b82f6', overflow: 'hidden' }}>
              <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                <div style={{ position: 'relative', width: '6rem', height: '6rem', marginLeft: 'auto', marginRight: 'auto', marginBottom: '1rem' }}>
                  <div style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '1.5rem',
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    border: '2px solid rgba(59,130,246,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(59,130,246,0.25)',
                  }}>
                    <span style={{ fontSize: '2.25rem', fontWeight: 900, color: 'white' }}>{initials}</span>
                  </div>
                  <div style={{
                    position: 'absolute',
                    bottom: '-0.5rem',
                    right: '-0.5rem',
                    width: '1.5rem',
                    height: '1.5rem',
                    borderRadius: '50%',
                    backgroundColor: '#22c55e',
                    border: '3px solid var(--bg-card)',
                    title: 'Online',
                  }} />
                </div>

                <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
                  {user?.firstName} {user?.lastName}
                </h2>
                <span style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '9999px',
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  backgroundColor: 'rgba(59,130,246,0.1)',
                  color: '#3b82f6',
                  border: '1px solid rgba(59,130,246,0.2)',
                }}>
                  {user?.role || 'Student'}
                </span>
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

            {/* ✅ STUDY PLANNER & TASK MANAGER */}
            <div className="card" style={{ borderColor: 'rgba(34,197,94,0.3)', overflow: 'hidden' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1rem',
                paddingBottom: '0.75rem',
                borderBottom: '1px solid var(--border-color)',
              }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                  <CheckSquare className="text-emerald-500" />
                  Personal Study Planner
                </h4>
                <button
                  onClick={() => navigate('/planner')}
                  style={{
                    padding: '0.375rem 0.5rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    backgroundColor: 'rgba(34,197,94,0.1)',
                    color: '#16a34a',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.2s',
                  }}
                >
                  <Plus style={{ width: 12, height: 12 }} /> Add Task
                </button>
              </div>

              {/* Tasks Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {demoTasks.map((task) => (
                  <div
                    key={task.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem',
                      borderRadius: '0.5rem',
                      backgroundColor: task.done ? 'rgba(34,197,94,0.08)' : 'var(--bg-surface)',
                      opacity: task.done ? 0.7 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {task.done ? (
                        <CheckSquare style={{ width: 14, height: 14, color: '#16a34a' }} />
                      ) : (
                        <Clock style={{ width: 14, height: 14, color: '#f59e0b' }} />
                      )}
                      <span style={{
                        fontSize: '0.75rem',
                        color: 'var(--text-secondary)',
                        textDecoration: task.done ? 'line-through' : 'none',
                      }}>
                        {task.text}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      color: task.done ? '#16a34a' : '#f59e0b',
                    }}>
                      {task.due}
                    </span>
                  </div>
                ))}
              </div>

              {/* Bottom Info */}
              <div style={{
                marginTop: '1rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid var(--border-color)',
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}>
               
              </div>
            </div>

          </div>

          {/* ═══ Main Content Area ═══ */}
          <div style={{ gridColumn: 'span 3', display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Quick Action Modules */}
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 6, height: '1.5rem', borderRadius: '9999px', backgroundColor: '#3b82f6' }} />
                Learning Modules
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.25rem' }} className="md:grid-cols-2">
                {quickActions.map((action, i) => (
                  <div
                    key={i}
                    onClick={() => navigate(action.link)}
                    style={{ cursor: 'pointer' }}
                    className="card group"
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.25rem' }}>
                      <div style={{
                        width: '3.5rem',
                        height: '3.5rem',
                        borderRadius: '1rem',
                        background: `linear-gradient(135deg, ${action.color})`,
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        transition: 'all 0.3s',
                      }} className="group-hover:scale-110 group-hover:rotate-3">
                        <action.icon style={{ width: 28, height: 28, color: 'white' }} />
                      </div>

                      <div style={{ flex: 1, width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                          <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', transition: 'all 0.2s' }} className="group-hover:text-lms-primary">
                            {action.title}
                          </h3>
                          <ArrowRight style={{
                            width: 16,
                            height: 16,
                            color: 'var(--text-muted)',
                            opacity: 0,
                            transform: 'translateX(-8px)',
                            transition: 'all 0.3s',
                          }} className="group-hover:opacity-100 group-hover:translate-x-0" />
                        </div>
                        <p style={{ marginTop: '0.25rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                          {action.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights Box */}
            <div className="card" style={{
              borderColor: 'rgba(139,92,246,0.3)',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.1) 0%, transparent 100%)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  <Cpu style={{ width: 20, height: 20, color: '#8b5cf6' }} />
                  Smart AI Insights
                </h2>
                <span style={{
                  padding: '0.25rem 0.5rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  backgroundColor: '#8b5cf6',
                  color: 'white',
                  fontStyle: 'italic',
                }}>NEW</span>
              </div>

              <div style={{
                padding: '1rem',
                borderRadius: '0.75rem',
                backgroundColor: 'rgba(0,0,0,0.05)',
                border: '1px solid var(--border-color)',
                fontStyle: 'italic',
                fontSize: '0.875rem',
                color: 'var(--text-secondary)',
              }}>
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