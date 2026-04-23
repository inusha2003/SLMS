import { useState, useEffect } from 'react';
import { moderationApi } from '../../api/moderationApi';
import {
  FiBookOpen,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
  FiHelpCircle,
} from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const StatCard = ({ icon: Icon, label, value, colorClass }) => (
  <div className="rounded-[26px] border border-white/6 bg-[#2b2340] px-5 py-6 shadow-[0_20px_60px_rgba(9,10,24,0.18)]">
    <div className="flex items-center gap-4">
      <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${colorClass}`}>
        <Icon className="text-white" size={24} />
      </div>
      <div>
        <p className="text-sm text-slate-400">{label}</p>
        <p className="mt-1 text-4xl font-black tracking-tight text-white">{value ?? '-'}</p>
      </div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    moderationApi
      .getStats()
      .then((res) => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight text-white">Admin Dashboard</h1>
        <p className="mt-2 text-base text-slate-400">Overview of the learning management system</p>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={FiBookOpen} label="Total Notes" value={stats?.totalNotes} colorClass="bg-[#5756a7]" />
        <StatCard icon={FiClock} label="Pending Approval" value={stats?.pendingNotes} colorClass="bg-[#bf7a07]" />
        <StatCard icon={FiCheckCircle} label="Approved Notes" value={stats?.approvedNotes} colorClass="bg-[#10a34a]" />
        <StatCard icon={FiXCircle} label="Rejected Notes" value={stats?.rejectedNotes} colorClass="bg-[#dc0d19]" />
        <StatCard icon={FiHelpCircle} label="Q&A Questions" value={stats?.totalQuestions} colorClass="bg-[#44536d]" />
        <StatCard icon={FiAlertTriangle} label="Pending Reports" value={stats?.pendingReports} colorClass="bg-[#e15811]" />
      </div>

      <div className="rounded-[26px] border border-white/6 bg-[#2b2340] px-6 py-7 shadow-[0_20px_60px_rgba(9,10,24,0.18)]">
        <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
        <p className="mt-4 text-base leading-7 text-slate-400">
          Use the sidebar to navigate to Manage Notes, review Pending Approvals, moderate Q&A,
          and manage the Moderation Panel.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;
