import { useState, useEffect } from 'react';
import { noteApi } from '../../api/noteApi';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  FiBookOpen,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiArrowRight,
  FiGrid,
} from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';

const statCards = [
  {
    key: 'myNotes',
    label: 'My Notes',
    icon: FiBookOpen,
    iconClass: 'bg-[linear-gradient(135deg,#6366f1,#7c3aed)] text-white',
  },
  {
    key: 'pending',
    label: 'Pending',
    icon: FiClock,
    iconClass: 'bg-[#c98508] text-white',
  },
  {
    key: 'approved',
    label: 'Approved',
    icon: FiCheckCircle,
    iconClass: 'bg-[#16a34a] text-white',
  },
  {
    key: 'rejected',
    label: 'Rejected',
    icon: FiXCircle,
    iconClass: 'bg-[#dc2626] text-white',
  },
];

const statusPillClass = {
  approved: 'bg-emerald-500/15 text-emerald-400',
  rejected: 'bg-rose-500/15 text-rose-400',
  pending: 'bg-amber-500/15 text-amber-400',
};

const quickActions = [
  {
    label: 'Browse Learning Resources',
    description: 'Explore approved notes',
    path: '/student/browse-notes',
  },
  {
    label: 'Upload a Note',
    description: 'Share your knowledge',
    path: '/student/upload-note',
  },
  {
    label: 'Q&A Forum',
    description: 'Ask or answer questions',
    path: '/student/qa-forum',
  },
];

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myNotes, setMyNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    noteApi
      .getMine()
      .then((res) => setMyNotes(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = myNotes.filter((n) => n.status === 'pending').length;
  const approvedCount = myNotes.filter((n) => n.status === 'approved').length;
  const rejectedCount = myNotes.filter((n) => n.status === 'rejected').length;

  const stats = {
    myNotes: myNotes.length,
    pending: pendingCount,
    approved: approvedCount,
    rejected: rejectedCount,
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-[1320px]">
      <header className="mb-8">
        <h1 className="text-4xl font-black tracking-tight text-white">
          Welcome, {user?.name || 'Student'}! <span className="ml-2">👋</span>
        </h1>
        <p className="mt-2 text-lg text-slate-400">Here&apos;s your learning overview</p>
      </header>

      <section className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ key, label, icon: Icon, iconClass }) => (
          <div
            key={key}
            className="rounded-[26px] border border-white/8 bg-[#2b2340] px-6 py-5 shadow-[0_20px_50px_rgba(8,10,24,0.22)]"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconClass}`}>
                <Icon size={24} />
              </div>
              <div>
                <p className="text-sm text-slate-400">{label}</p>
                <p className="mt-1 text-4xl font-black tracking-tight text-white">{stats[key] ?? 0}</p>
              </div>
            </div>
          </div>
        ))}
      </section>

      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[28px] border border-white/8 bg-[#2b2340] px-6 py-6 shadow-[0_24px_55px_rgba(8,10,24,0.2)]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-3 text-2xl font-black tracking-tight text-white">
              <FiBookOpen className="text-indigo-400" size={20} />
              Recent Submissions
            </h2>
            <button
              onClick={() => navigate('/student/my-notes')}
              className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-300 transition-colors hover:text-white"
            >
              View all
              <FiArrowRight size={14} />
            </button>
          </div>

          {myNotes.length === 0 ? (
            <div className="rounded-[24px] border border-dashed border-white/10 bg-black/10 px-6 py-12 text-center">
              <FiGrid className="mx-auto mb-4 text-slate-600" size={28} />
              <p className="text-lg font-medium text-slate-300">No submissions yet</p>
              <p className="mt-2 text-sm text-slate-500">Upload your first note to see activity here.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {myNotes.slice(0, 5).map((note, index) => (
                <div
                  key={note._id}
                  className={`flex items-center justify-between gap-4 py-4 ${
                    index !== myNotes.slice(0, 5).length - 1 ? 'border-b border-white/6' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-xl font-semibold text-white">{note.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{note.subject}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.08em] ${
                      statusPillClass[note.status] || statusPillClass.pending
                    }`}
                  >
                    {note.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[28px] border border-white/8 bg-[#2b2340] px-6 py-6 shadow-[0_24px_55px_rgba(8,10,24,0.2)]">
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-black tracking-tight text-white">
            <FiGrid className="text-indigo-400" size={20} />
            Quick Actions
          </h2>

          <div className="space-y-4">
            {quickActions.map(({ label, description, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="group flex w-full items-center justify-between rounded-[22px] border border-white/6 bg-black/14 px-5 py-5 text-left transition-all duration-200 hover:border-indigo-400/25 hover:bg-black/20"
              >
                <div>
                  <p className="text-xl font-semibold text-white">{label}</p>
                  <p className="mt-1 text-sm text-slate-500">{description}</p>
                </div>
                <FiArrowRight
                  className="text-slate-500 transition-all duration-200 group-hover:translate-x-1 group-hover:text-indigo-300"
                  size={20}
                />
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default StudentDashboard;
