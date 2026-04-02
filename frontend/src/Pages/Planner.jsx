import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare, Plus, Trash2, RotateCcw,
  Calendar, Clock, ArrowLeft, Sparkles,
  FileDown, FileText, Table, Printer, X,
  Download, FileSpreadsheet, BarChart3
} from 'lucide-react';
import api from '../services/api';

// Optional: Import for PDF generation
// import jsPDF from 'jspdf';
// import 'jspdf-autotable';

/* ═══════════════════════════════════════
   ANIMATED BACKGROUND  (matches Dashboard)
═══════════════════════════════════════ */
const PlannerBg = () => (
  <div style={{
    position: 'fixed', inset: 0, zIndex: 0,
    pointerEvents: 'none', overflow: 'hidden',
  }}>
    {/* soft blobs */}
    <div className="animate-pulse-glow" style={{
      position: 'absolute', top: '8%', left: '-6%',
      width: '22rem', height: '22rem', borderRadius: '50%',
      backgroundColor: 'rgba(99,102,241,0.08)', filter: 'blur(90px)',
    }} />
    <div className="animate-float-slow" style={{
      position: 'absolute', top: '50%', right: '-8%',
      width: '26rem', height: '26rem', borderRadius: '50%',
      backgroundColor: 'rgba(139,92,246,0.06)', filter: 'blur(110px)',
      animationDelay: '2s',
    }} />
    <div className="animate-pulse-glow" style={{
      position: 'absolute', bottom: '6%', left: '12%',
      width: '18rem', height: '18rem', borderRadius: '50%',
      backgroundColor: 'rgba(20,184,166,0.05)', filter: 'blur(80px)',
      animationDelay: '3.5s',
    }} />

    {/* floating particles */}
    {[
      { top: '14%', left: '9%',  size: 6, color: '#6366f1', cls: 'animate-particle-1' },
      { top: '36%', right:'13%', size: 5, color: '#8b5cf6', cls: 'animate-particle-2' },
      { bottom:'22%',left:'28%', size: 4, color: '#14b8a6', cls: 'animate-particle-3' },
    ].map((p, i) => (
      <div key={i} className={p.cls} style={{
        position: 'absolute', ...p,
        width: p.size, height: p.size,
        borderRadius: '50%', backgroundColor: p.color,
      }} />
    ))}

    {/* subtle grid lines */}
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025 }}>
      <defs>
        <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(139,92,246,1)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
);

/* ═══════════════════════════════════════
   CONSTANTS
═══════════════════════════════════════ */
const STORAGE_KEY = 'plannerTasks_v1';

const formatDate = (iso) => {
  if (!iso) return 'No date';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch { return iso; }
};

const formatDateFull = (iso) => {
  if (!iso) return 'Not set';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  } catch { return iso; }
};

const isOverdue = (due, done) =>
  due && !done && new Date(due) < new Date();

const isDueSoon = (due, done) => {
  if (!due || done) return false;
  const diff = (new Date(due) - new Date()) / 86400000;
  return diff <= 2 && diff > 0;
};

/* ═══════════════════════════════════════
   STAT PILL
═══════════════════════════════════════ */
const StatPill = ({ label, value, bg, color, border }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: '0.5rem',
    padding: '0.45rem 1rem', borderRadius: 999,
    background: bg, border: `1px solid ${border}`,
    fontSize: '0.75rem', fontWeight: 800,
  }}>
    <span style={{ fontSize: '1rem', fontWeight: 900, color }}>{value}</span>
    <span style={{ color: 'var(--text-muted)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>{label}</span>
  </div>
);

/* ═══════════════════════════════════════
   TASK CARD
═══════════════════════════════════════ */
const TaskCard = ({ task, onToggle, onDelete }) => {
  const overdue  = isOverdue(task.due, task.done);
  const dueSoon  = isDueSoon(task.due, task.done);

  const accentColor = overdue
    ? '#f87171'
    : task.done
      ? 'rgba(255,255,255,0.12)'
      : '#8b5cf6';

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: '0.875rem',
      padding: '1rem 1.1rem',
      borderRadius: '1rem',
      background: 'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.015) 100%)',
      border: '1px solid rgba(255,255,255,0.06)',
      borderLeft: `4px solid ${accentColor}`,
      backdropFilter: 'blur(8px)',
      opacity: task.done ? 0.55 : 1,
      transition: 'all 0.22s ease',
      boxShadow: task.done ? 'none' : '0 2px 20px rgba(0,0,0,0.15)',
    }}>

      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id)}
        aria-label={task.done ? 'Mark undone' : 'Mark done'}
        style={{
          width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
          border: `2px solid ${task.done ? '#8b5cf6' : 'rgba(255,255,255,0.18)'}`,
          background: task.done
            ? 'linear-gradient(135deg,#8b5cf6,#6366f1)'
            : 'rgba(255,255,255,0.04)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s', flexShrink: 0,
          boxShadow: task.done ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
        }}
      >
        {task.done && (
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
            <polyline points="2,6 5,9 10,3" stroke="white" strokeWidth="2.2"
              strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '0.975rem', fontWeight: 800, marginBottom: '0.4rem',
          color: task.done ? 'var(--text-muted)' : 'var(--text-primary)',
          textDecoration: task.done ? 'line-through' : 'none',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {task.title}
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Clock style={{ width: 11, height: 11 }} />
            Added: <strong style={{ color: 'var(--text-secondary)', fontWeight: 600, marginLeft: 3 }}>
              {formatDate(task.createdAt)}
            </strong>
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Calendar style={{ width: 11, height: 11 }} />
            Due: <strong style={{
              fontWeight: 700, marginLeft: 3,
              color: overdue ? '#fca5a5' : dueSoon ? '#fcd34d' : 'var(--text-secondary)',
            }}>
              {formatDate(task.due)}
            </strong>
          </span>
        </div>

        {/* Alert badges */}
        {(overdue || dueSoon) && (
          <div style={{ marginTop: '0.45rem', display: 'flex', gap: '0.4rem' }}>
            {overdue && (
              <span style={{
                fontSize: '0.62rem', fontWeight: 800, padding: '0.15rem 0.55rem',
                borderRadius: 999, background: 'rgba(248,113,113,0.15)',
                color: '#fca5a5', border: '1px solid rgba(248,113,113,0.3)',
                letterSpacing: '0.05em',
              }}>
                OVERDUE
              </span>
            )}
            {dueSoon && !overdue && (
              <span style={{
                fontSize: '0.62rem', fontWeight: 800, padding: '0.15rem 0.55rem',
                borderRadius: 999, background: 'rgba(251,191,36,0.12)',
                color: '#fcd34d', border: '1px solid rgba(251,191,36,0.25)',
                letterSpacing: '0.05em',
              }}>
                DUE SOON
              </span>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', flexShrink: 0, marginTop: 1 }}>
        <button
          onClick={() => onToggle(task.id)}
          title={task.done ? 'Undo' : 'Mark done'}
          style={{
            padding: '0.35rem', background: 'transparent', border: 'none',
            cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '0.4rem',
            display: 'flex', transition: 'color 0.18s',
          }}
          onMouseOver={e => e.currentTarget.style.color = '#6ee7b7'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <RotateCcw style={{ width: 14, height: 14 }} />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          title="Delete"
          style={{
            padding: '0.35rem', background: 'transparent', border: 'none',
            cursor: 'pointer', color: 'var(--text-muted)', borderRadius: '0.4rem',
            display: 'flex', transition: 'color 0.18s',
          }}
          onMouseOver={e => e.currentTarget.style.color = '#f87171'}
          onMouseOut={e => e.currentTarget.style.color = 'var(--text-muted)'}
        >
          <Trash2 style={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   ADD TASK MODAL
═══════════════════════════════════════ */
const AddModal = ({ open, onClose, onAdd }) => {
  const [title, setTitle] = useState('');
  const [due, setDue]     = useState('');
  const [err, setErr]     = useState('');

  const reset = () => { setTitle(''); setDue(''); setErr(''); };

  const handleAdd = () => {
    if (!title.trim()) { setErr('Please enter a task title.'); return; }
    onAdd(title.trim(), due || null);
    reset();
    onClose();
  };

  const handleClose = () => { reset(); onClose(); };

  if (!open) return null;

  const inputStyle = {
    width: '100%',
    padding: '0.7rem 0.95rem',
    borderRadius: '0.7rem',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-primary)',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    outline: 'none',
    transition: 'border-color 0.18s',
    boxSizing: 'border-box',
  };

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && handleClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(2,2,6,0.72)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        width: 'min(480px, 100%)',
        background: 'linear-gradient(180deg, rgba(28,16,52,0.98) 0%, rgba(16,10,32,0.98) 100%)',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: '1.25rem',
        padding: '1.75rem',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
        animation: 'slideUp 0.22s ease',
      }}>
        <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{
            fontWeight: 900, fontSize: '1.05rem',
            color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <Sparkles style={{ width: 18, height: 18, color: '#a78bfa' }} />
            New Task
          </h3>
          <button onClick={handleClose} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-muted)', cursor: 'pointer',
            width: 28, height: 28, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', transition: 'all 0.18s',
          }}>✕</button>
        </div>

        {/* Error */}
        {err && (
          <div style={{
            padding: '0.6rem 0.9rem', marginBottom: '1rem', borderRadius: '0.6rem',
            background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.25)',
            color: '#fca5a5', fontSize: '0.8rem',
          }}>{err}</div>
        )}

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{
              display: 'block', fontSize: '0.68rem', fontWeight: 800,
              color: 'var(--text-muted)', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: '0.4rem',
            }}>Task Title *</label>
            <input
              style={inputStyle}
              placeholder="e.g. Review Physics Notes"
              value={title}
              onChange={e => { setTitle(e.target.value); setErr(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              autoFocus
              onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          <div>
            <label style={{
              display: 'block', fontSize: '0.68rem', fontWeight: 800,
              color: 'var(--text-muted)', textTransform: 'uppercase',
              letterSpacing: '0.08em', marginBottom: '0.4rem',
            }}>Due Date</label>
            <input
              type="date"
              style={inputStyle}
              value={due}
              onChange={e => setDue(e.target.value)}
              onFocus={e => e.target.style.borderColor = 'rgba(139,92,246,0.5)'}
              onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>
        </div>

        {/* Actions */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '0.65rem',
          marginTop: '1.5rem', paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <button
            onClick={handleClose}
            style={{
              padding: '0.65rem 1.35rem', borderRadius: '0.65rem',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'var(--text-muted)',
              fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
              transition: 'all 0.18s',
            }}
            onMouseOver={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; }}
            onMouseOut={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'; }}
          >Cancel</button>

          <button
            onClick={handleAdd}
            style={{
              padding: '0.65rem 1.6rem', borderRadius: '0.65rem',
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
              color: 'white', fontWeight: 800, cursor: 'pointer',
              fontSize: '0.875rem',
              boxShadow: '0 6px 20px rgba(99,102,241,0.4)',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
              transition: 'all 0.2s',
            }}
            onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <Plus style={{ width: 16, height: 16 }} /> Add Task
          </button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   REPORT MODAL - NEW COMPONENT
═══════════════════════════════════════ */
const ReportModal = ({ open, onClose, tasks }) => {
  const [reportFormat, setReportFormat] = useState('pdf'); // pdf, csv, html
  const [includeCompleted, setIncludeCompleted] = useState(true);
  const [includePending, setIncludePending] = useState(true);
  const [includeOverdue, setIncludeOverdue] = useState(true);
  const [generating, setGenerating] = useState(false);
  const reportRef = useRef(null);

  if (!open) return null;

  // Filter tasks based on options
  const getFilteredTasks = () => {
    return tasks.filter(task => {
      if (task.done && !includeCompleted) return false;
      if (!task.done && !includePending) return false;
      return true;
    });
  };

  // Calculate statistics
  const getStats = (filteredTasks) => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.done).length;
    const pending = filteredTasks.filter(t => !t.done).length;
    const overdue = filteredTasks.filter(t => isOverdue(t.due, t.done)).length;
    const dueSoon = filteredTasks.filter(t => isDueSoon(t.due, t.done)).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    return { total, completed, pending, overdue, dueSoon, completionRate };
  };

  // Generate CSV
  const generateCSV = (filteredTasks) => {
    const stats = getStats(filteredTasks);
    
    let csv = 'Study Planner Report\n';
    csv += `Generated: ${new Date().toLocaleString()}\n\n`;
    csv += 'SUMMARY\n';
    csv += `Total Tasks,${stats.total}\n`;
    csv += `Completed,${stats.completed}\n`;
    csv += `Pending,${stats.pending}\n`;
    csv += `Overdue,${stats.overdue}\n`;
    csv += `Completion Rate,${stats.completionRate}%\n\n`;
    csv += 'TASK DETAILS\n';
    csv += 'Title,Status,Due Date,Created Date,Priority\n';
    
    filteredTasks.forEach(task => {
      const status = task.done ? 'Completed' : isOverdue(task.due, task.done) ? 'Overdue' : 'Pending';
      const priority = isOverdue(task.due, task.done) ? 'High' : isDueSoon(task.due, task.done) ? 'Medium' : 'Normal';
      csv += `"${task.title}",${status},${task.due || 'Not set'},${formatDate(task.createdAt)},${priority}\n`;
    });
    
    return csv;
  };

  // Generate HTML Report
  const generateHTML = (filteredTasks) => {
    const stats = getStats(filteredTasks);
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Study Planner Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: #e2e8f0;
      min-height: 100vh;
      padding: 2rem;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header {
      background: linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(139,92,246,0.15) 100%);
      border: 1px solid rgba(99,102,241,0.3);
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
      text-align: center;
    }
    .header h1 { 
      font-size: 2rem; 
      background: linear-gradient(135deg, #8b5cf6, #6366f1);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .header p { color: #94a3b8; font-size: 0.9rem; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }
    .stat-card {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 0.75rem;
      padding: 1.25rem;
      text-align: center;
    }
    .stat-value { font-size: 2rem; font-weight: 800; color: #a78bfa; }
    .stat-label { font-size: 0.75rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-card.completed .stat-value { color: #6ee7b7; }
    .stat-card.pending .stat-value { color: #fcd34d; }
    .stat-card.overdue .stat-value { color: #f87171; }
    .section { margin-bottom: 2rem; }
    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: #e2e8f0;
      margin-bottom: 1rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    table { width: 100%; border-collapse: collapse; }
    th, td { 
      padding: 0.875rem 1rem; 
      text-align: left; 
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    th { 
      background: rgba(99,102,241,0.1);
      color: #c4b5fd;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      font-weight: 700;
    }
    tr:hover { background: rgba(255,255,255,0.02); }
    .status { 
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 999px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
    }
    .status.completed { background: rgba(52,211,153,0.15); color: #6ee7b7; }
    .status.pending { background: rgba(251,191,36,0.15); color: #fcd34d; }
    .status.overdue { background: rgba(248,113,113,0.15); color: #fca5a5; }
    .priority { font-size: 0.75rem; color: #94a3b8; }
    .priority.high { color: #f87171; }
    .priority.medium { color: #fcd34d; }
    .footer {
      text-align: center;
      padding: 1.5rem;
      color: #64748b;
      font-size: 0.75rem;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .progress-bar {
      height: 8px;
      background: rgba(255,255,255,0.1);
      border-radius: 999px;
      overflow: hidden;
      margin-top: 0.5rem;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #8b5cf6, #14b8a6);
      border-radius: 999px;
    }
    @media print {
      body { background: white; color: #1a1a2e; padding: 1rem; }
      .header { background: #f8fafc; border-color: #e2e8f0; }
      .header h1 { -webkit-text-fill-color: #6366f1; }
      .stat-card { background: #f8fafc; border-color: #e2e8f0; }
      th { background: #f1f5f9; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📚 Study Planner Report</h1>
      <p>Generated on ${new Date().toLocaleString()}</p>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${stats.total}</div>
        <div class="stat-label">Total Tasks</div>
      </div>
      <div class="stat-card completed">
        <div class="stat-value">${stats.completed}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card pending">
        <div class="stat-value">${stats.pending}</div>
        <div class="stat-label">Pending</div>
      </div>
      <div class="stat-card overdue">
        <div class="stat-value">${stats.overdue}</div>
        <div class="stat-label">Overdue</div>
      </div>
    </div>

    <div class="section">
      <div class="stat-card" style="text-align: left;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
          <span style="font-weight: 700;">Completion Progress</span>
          <span style="color: #a78bfa; font-weight: 800;">${stats.completionRate}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${stats.completionRate}%;"></div>
        </div>
      </div>
    </div>

    <div class="section">
      <h2 class="section-title">📋 Task Details</h2>
      <table>
        <thead>
          <tr>
            <th style="width: 40%;">Task Title</th>
            <th>Status</th>
            <th>Due Date</th>
            <th>Created</th>
            <th>Priority</th>
          </tr>
        </thead>
        <tbody>
          ${filteredTasks.map(task => {
            const status = task.done ? 'completed' : isOverdue(task.due, task.done) ? 'overdue' : 'pending';
            const statusLabel = task.done ? 'Completed' : isOverdue(task.due, task.done) ? 'Overdue' : 'Pending';
            const priority = isOverdue(task.due, task.done) ? 'high' : isDueSoon(task.due, task.done) ? 'medium' : 'normal';
            const priorityLabel = priority.charAt(0).toUpperCase() + priority.slice(1);
            return `
              <tr>
                <td style="font-weight: 600; ${task.done ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${task.title}</td>
                <td><span class="status ${status}">${statusLabel}</span></td>
                <td style="color: ${status === 'overdue' ? '#f87171' : '#94a3b8'};">${formatDate(task.due)}</td>
                <td style="color: #64748b; font-size: 0.85rem;">${formatDate(task.createdAt)}</td>
                <td><span class="priority ${priority}">${priorityLabel}</span></td>
              </tr>
            `;
          }).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <p>Study Planner Report • Generated automatically • Keep up the great work! 🚀</p>
    </div>
  </div>
</body>
</html>`;
  };

  // Download file
  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Generate and download report
  const handleGenerateReport = async () => {
    setGenerating(true);
    const filteredTasks = getFilteredTasks();
    const timestamp = new Date().toISOString().split('T')[0];
    
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate processing

      if (reportFormat === 'csv') {
        const csv = generateCSV(filteredTasks);
        downloadFile(csv, `study-planner-report-${timestamp}.csv`, 'text/csv');
      } else if (reportFormat === 'html') {
        const html = generateHTML(filteredTasks);
        downloadFile(html, `study-planner-report-${timestamp}.html`, 'text/html');
      } else {
        // For PDF, open HTML in new window for printing
        const html = generateHTML(filteredTasks);
        const printWindow = window.open('', '_blank');
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
      
      onClose();
    } catch (error) {
      console.error('Report generation failed:', error);
    } finally {
      setGenerating(false);
    }
  };

  const filteredCount = getFilteredTasks().length;
  const stats = getStats(getFilteredTasks());

  const checkboxStyle = {
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    padding: '0.75rem 1rem', borderRadius: '0.75rem',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer', transition: 'all 0.18s',
  };

  const formatButtonStyle = (active) => ({
    flex: 1, padding: '1rem', borderRadius: '0.75rem',
    border: active ? '2px solid rgba(139,92,246,0.5)' : '1px solid rgba(255,255,255,0.08)',
    background: active ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
    cursor: 'pointer', transition: 'all 0.18s',
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
  });

  return (
    <div
      onClick={(e) => e.target === e.currentTarget && onClose()}
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        background: 'rgba(2,2,6,0.8)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{
        width: 'min(560px, 100%)',
        maxHeight: '90vh',
        overflowY: 'auto',
        background: 'linear-gradient(180deg, rgba(28,16,52,0.98) 0%, rgba(16,10,32,0.98) 100%)',
        border: '1px solid rgba(139,92,246,0.2)',
        borderRadius: '1.25rem',
        padding: '1.75rem',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.03)',
        animation: 'slideUp 0.22s ease',
      }}>
        <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h3 style={{
            fontWeight: 900, fontSize: '1.1rem',
            color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', gap: '0.5rem',
          }}>
            <BarChart3 style={{ width: 20, height: 20, color: '#6ee7b7' }} />
            Generate Report
          </h3>
          <button onClick={onClose} style={{
            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
            color: 'var(--text-muted)', cursor: 'pointer',
            width: 28, height: 28, borderRadius: 8,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '0.85rem', transition: 'all 0.18s',
          }}>✕</button>
        </div>

        {/* Preview Stats */}
        <div style={{
          background: 'rgba(99,102,241,0.08)',
          border: '1px solid rgba(99,102,241,0.15)',
          borderRadius: '0.875rem',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
        }}>
          <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
            Report Preview
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#a5b4fc' }}>{stats.total}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Total</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#6ee7b7' }}>{stats.completed}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Done</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fcd34d' }}>{stats.pending}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Pending</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#f87171' }}>{stats.overdue}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Overdue</div>
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block', fontSize: '0.68rem', fontWeight: 800,
            color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: '0.75rem',
          }}>Select Format</label>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button
              onClick={() => setReportFormat('pdf')}
              style={formatButtonStyle(reportFormat === 'pdf')}
            >
              <Printer style={{ width: 24, height: 24, color: reportFormat === 'pdf' ? '#a78bfa' : 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: reportFormat === 'pdf' ? '#c4b5fd' : 'var(--text-secondary)' }}>PDF / Print</span>
            </button>
            <button
              onClick={() => setReportFormat('csv')}
              style={formatButtonStyle(reportFormat === 'csv')}
            >
              <FileSpreadsheet style={{ width: 24, height: 24, color: reportFormat === 'csv' ? '#6ee7b7' : 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: reportFormat === 'csv' ? '#6ee7b7' : 'var(--text-secondary)' }}>CSV / Excel</span>
            </button>
            <button
              onClick={() => setReportFormat('html')}
              style={formatButtonStyle(reportFormat === 'html')}
            >
              <FileText style={{ width: 24, height: 24, color: reportFormat === 'html' ? '#60a5fa' : 'var(--text-muted)' }} />
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: reportFormat === 'html' ? '#60a5fa' : 'var(--text-secondary)' }}>HTML</span>
            </button>
          </div>
        </div>

        {/* Include Options */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block', fontSize: '0.68rem', fontWeight: 800,
            color: 'var(--text-muted)', textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: '0.75rem',
          }}>Include in Report</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={checkboxStyle}>
              <input
                type="checkbox"
                checked={includeCompleted}
                onChange={(e) => setIncludeCompleted(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#8b5cf6' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                ✅ Completed Tasks ({tasks.filter(t => t.done).length})
              </span>
            </label>
            <label style={checkboxStyle}>
              <input
                type="checkbox"
                checked={includePending}
                onChange={(e) => setIncludePending(e.target.checked)}
                style={{ width: 18, height: 18, accentColor: '#8b5cf6' }}
              />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                ⏳ Pending Tasks ({tasks.filter(t => !t.done).length})
              </span>
            </label>
          </div>
        </div>

        {/* Warning if no tasks */}
        {filteredCount === 0 && (
          <div style={{
            padding: '0.75rem 1rem', marginBottom: '1rem', borderRadius: '0.6rem',
            background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.25)',
            color: '#fcd34d', fontSize: '0.8rem',
          }}>
            ⚠️ No tasks selected. Please select at least one task category.
          </div>
        )}

        {/* Actions */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: '0.65rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.05)',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '0.7rem 1.35rem', borderRadius: '0.65rem',
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'transparent', color: 'var(--text-muted)',
              fontWeight: 700, cursor: 'pointer', fontSize: '0.875rem',
              transition: 'all 0.18s',
            }}
          >Cancel</button>

          <button
            onClick={handleGenerateReport}
            disabled={filteredCount === 0 || generating}
            style={{
              padding: '0.7rem 1.6rem', borderRadius: '0.65rem',
              border: 'none',
              background: filteredCount === 0 
                ? 'rgba(255,255,255,0.1)' 
                : 'linear-gradient(135deg, #14b8a6 0%, #10b981 100%)',
              color: filteredCount === 0 ? 'var(--text-muted)' : 'white',
              fontWeight: 800, 
              cursor: filteredCount === 0 ? 'not-allowed' : 'pointer',
              fontSize: '0.875rem',
              boxShadow: filteredCount === 0 ? 'none' : '0 6px 20px rgba(20,184,166,0.4)',
              display: 'flex', alignItems: 'center', gap: '0.5rem',
              transition: 'all 0.2s',
              opacity: generating ? 0.7 : 1,
            }}
          >
            {generating ? (
              <>
                <div style={{
                  width: 16, height: 16, border: '2px solid white',
                  borderTopColor: 'transparent', borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                Generating...
              </>
            ) : (
              <>
                <Download style={{ width: 16, height: 16 }} />
                Generate Report
              </>
            )}
          </button>
        </div>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════ */
const Planner = () => {
  const navigate = useNavigate();

  const [tasks, setTasks]         = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false); // NEW
  const [filter, setFilter]       = useState('All');

  /* ── localStorage & server sync ── */
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const { data } = await api.get('/tasks');
        const serverTasks = data.tasks.map(t => ({
          id: t._id,
          title: t.title,
          due: t.due ? new Date(t.due).toISOString().split('T')[0] : '',
          createdAt: t.createdAt,
          done: t.done,
        }));
        if (mounted) {
          setTasks(serverTasks);
          try { localStorage.setItem(STORAGE_KEY, JSON.stringify(serverTasks)); } catch {}
        }
      } catch (err) {
        console.warn('Failed to load tasks from server, falling back to localStorage', err);
        try {
          const raw = localStorage.getItem(STORAGE_KEY);
          if (raw && mounted) setTasks(JSON.parse(raw));
        } catch (e) {}
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); } catch {}
  }, [tasks]);

  /* ── CRUD ── */
  const addTask = async (title, due) => {
    try {
      const payload = { title, due: due || null };
      const { data } = await api.post('/tasks', payload);
      const t = {
        id: data.task._id,
        title: data.task.title,
        due: data.task.due ? new Date(data.task.due).toISOString().split('T')[0] : '',
        createdAt: data.task.createdAt,
        done: data.task.done,
      };
      setTasks(prev => [t, ...prev]);
    } catch (err) {
      console.error('Create task failed, saving locally', err);
      const t = {
        id: Date.now(),
        title, due,
        createdAt: new Date().toISOString(),
        done: false,
      };
      setTasks(prev => [t, ...prev]);
    }
  };

  const toggleDone = async (id) => {
    const existing = tasks.find(t => t.id === id);
    if (!existing) return;
    const newDone = !existing.done;
    try {
      const { data } = await api.put(`/tasks/${id}`, { done: newDone });
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: data.task.done } : t));
    } catch (err) {
      console.error('Toggle done failed, applying locally', err);
      setTasks(prev => prev.map(t => t.id === id ? { ...t, done: newDone } : t));
    }
  };

  const remove = async (id) => {
    try {
      await api.delete(`/tasks/${id}`);
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      console.error('Delete failed, removing locally', err);
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  /* ── Derived ── */
  const total   = tasks.length;
  const done    = tasks.filter(t => t.done).length;
  const pending = total - done;
  const pct     = total > 0 ? Math.round((done / total) * 100) : 0;

  const filtered = tasks.filter(t => {
    if (filter === 'Pending') return !t.done;
    if (filter === 'Done')    return t.done;
    return true;
  });

  const filterBtn = (active) => ({
    padding: '0.35rem 0.9rem', borderRadius: 999, fontSize: '0.72rem',
    fontWeight: 700, cursor: 'pointer', border: '1px solid',
    background: active ? 'rgba(139,92,246,0.18)' : 'rgba(255,255,255,0.03)',
    color: active ? '#c4b5fd' : 'var(--text-muted)',
    borderColor: active ? 'rgba(139,92,246,0.35)' : 'rgba(255,255,255,0.07)',
    transition: 'all 0.18s',
  });

  return (
    <div style={{ minHeight: 'calc(100vh - 4rem)', position: 'relative', overflow: 'hidden' }}>
      <PlannerBg />

      <div style={{
        position: 'relative', zIndex: 10,
        maxWidth: '52rem', margin: '0 auto',
        padding: '2.5rem 1.25rem',
      }} className="animate-in fade-in duration-500">

        {/* ── Page header ── */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.14) 0%, rgba(139,92,246,0.08) 100%)',
          backdropFilter: 'blur(14px)',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: '1.5rem',
          padding: '2rem 2.25rem',
          marginBottom: '2rem',
          position: 'relative', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', top: '-5rem', right: '-5rem',
            width: '14rem', height: '14rem', borderRadius: '50%',
            backgroundColor: 'rgba(139,92,246,0.12)', filter: 'blur(48px)',
            pointerEvents: 'none',
          }} />

          <div style={{
            position: 'relative', zIndex: 1,
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem',
          }}>
            <div>
              <h1 style={{
                fontSize: 'clamp(1.5rem,4vw,2.1rem)', fontWeight: 900,
                color: 'var(--text-primary)',
                display: 'flex', alignItems: 'center', gap: '0.65rem',
              }}>
                <CheckSquare style={{ width: 28, height: 28, color: '#6ee7b7' }} />
                Study Planner
              </h1>
              <p style={{ marginTop: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                Track tasks, deadlines & progress — all in one place.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  padding: '0.65rem 1.2rem', borderRadius: '0.75rem',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'var(--text-secondary)', fontWeight: 700,
                  cursor: 'pointer', fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  transition: 'all 0.18s',
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                onMouseOut={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                <ArrowLeft style={{ width: 16, height: 16 }} /> Back
              </button>

              {/* ═══ NEW: GENERATE REPORT BUTTON ═══ */}
              <button
                onClick={() => setShowReportModal(true)}
                disabled={tasks.length === 0}
                style={{
                  padding: '0.65rem 1.2rem', borderRadius: '0.75rem',
                  border: '1px solid rgba(20,184,166,0.3)',
                  background: 'rgba(20,184,166,0.1)',
                  color: tasks.length === 0 ? 'var(--text-muted)' : '#6ee7b7',
                  fontWeight: 700,
                  cursor: tasks.length === 0 ? 'not-allowed' : 'pointer',
                  fontSize: '0.85rem',
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  transition: 'all 0.18s',
                  opacity: tasks.length === 0 ? 0.5 : 1,
                }}
                onMouseOver={e => {
                  if (tasks.length > 0) {
                    e.currentTarget.style.background = 'rgba(20,184,166,0.2)';
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }
                }}
                onMouseOut={e => {
                  e.currentTarget.style.background = 'rgba(20,184,166,0.1)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <FileDown style={{ width: 16, height: 16 }} /> Generate Report
              </button>

              <button
                onClick={() => setShowModal(true)}
                style={{
                  padding: '0.65rem 1.4rem', borderRadius: '0.75rem',
                  border: 'none',
                  background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
                  color: 'white', fontWeight: 800, cursor: 'pointer',
                  fontSize: '0.875rem',
                  display: 'flex', alignItems: 'center', gap: '0.45rem',
                  boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                  transition: 'all 0.2s',
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <Plus style={{ width: 17, height: 17 }} /> Add Task
              </button>
            </div>
          </div>
        </div>

        {/* ── Stats ── */}
        <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <StatPill label="Total"   value={total}   bg="rgba(99,102,241,0.1)"  color="#a5b4fc" border="rgba(99,102,241,0.22)" />
          <StatPill label="Done"    value={done}    bg="rgba(52,211,153,0.08)" color="#6ee7b7" border="rgba(52,211,153,0.2)"  />
          <StatPill label="Pending" value={pending} bg="rgba(251,191,36,0.08)" color="#fcd34d" border="rgba(251,191,36,0.2)"  />
        </div>

        {/* ── Progress ── */}
        {total > 0 && (
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.45rem' }}>
              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Progress
              </span>
              <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#c4b5fd' }}>{pct}%</span>
            </div>
            <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 999, overflow: 'hidden' }}>
              <div style={{
                height: '100%', width: `${pct}%`,
                background: 'linear-gradient(90deg, #8b5cf6, #14b8a6)',
                borderRadius: 999, transition: 'width 0.5s ease',
              }} />
            </div>
          </div>
        )}

        {/* ── Filter row ── */}
        <div style={{
          display: 'flex', gap: '0.5rem', marginBottom: '1.25rem',
          padding: '0.75rem 1rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.05)',
          borderRadius: '0.875rem',
          alignItems: 'center', flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: '0.25rem' }}>
            Filter
          </span>
          {['All', 'Pending', 'Done'].map(f => (
            <button key={f} style={filterBtn(filter === f)} onClick={() => setFilter(f)}>{f}</button>
          ))}
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* ── Task list ── */}
        {filtered.length === 0 ? (
          <div style={{
            padding: '3.5rem 1.5rem', textAlign: 'center',
            border: '1px dashed rgba(255,255,255,0.08)',
            borderRadius: '1.25rem',
            color: 'var(--text-muted)', fontSize: '0.9rem',
          }}>
            {tasks.length === 0
              ? 'No tasks yet — click "Add Task" to create your first study plan.'
              : 'No tasks match the current filter.'}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {filtered.map(t => (
              <TaskCard key={t.id} task={t} onToggle={toggleDone} onDelete={remove} />
            ))}
          </div>
        )}

        {/* ── Footer ── */}
        <p style={{ marginTop: '2.5rem', textAlign: 'center', fontSize: '0.68rem', color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          Tasks saved to your account. Local cache used when offline.
        </p>
      </div>

      {/* ── Modals ── */}
      <AddModal open={showModal} onClose={() => setShowModal(false)} onAdd={addTask} />
      <ReportModal open={showReportModal} onClose={() => setShowReportModal(false)} tasks={tasks} />
    </div>
  );
};

export default Planner;