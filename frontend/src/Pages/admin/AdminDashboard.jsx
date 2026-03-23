import { useState, useEffect } from 'react';
import { moderationApi } from '../../api/moderationApi';
import { FiBookOpen, FiClock, FiCheckCircle, FiXCircle, FiAlertTriangle, FiHelpCircle } from 'react-icons/fi';
import LoadingSpinner from '../../components/common/LoadingSpinner';

//gygyh
const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="text-white" size={22} />
    </div>
    <div>
      <p className="text-slate-400 text-xs font-medium">{label}</p>
      <p className="text-white font-bold text-2xl">{value ?? '-'}</p>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    moderationApi.getStats()
      .then((res) => setStats(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-slate-400 text-sm mt-1">Overview of the learning management system</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
        <StatCard icon={FiBookOpen} label="Total Notes" value={stats?.totalNotes} color="bg-lms-primary" />
        <StatCard icon={FiClock} label="Pending Approval" value={stats?.pendingNotes} color="bg-yellow-700" />
        <StatCard icon={FiCheckCircle} label="Approved Notes" value={stats?.approvedNotes} color="bg-green-700" />
        <StatCard icon={FiXCircle} label="Rejected Notes" value={stats?.rejectedNotes} color="bg-red-700" />
        <StatCard icon={FiHelpCircle} label="Q&A Questions" value={stats?.totalQuestions} color="bg-lms-accent" />
        <StatCard icon={FiAlertTriangle} label="Pending Reports" value={stats?.pendingReports} color="bg-orange-700" />
      </div>

      <div className="card">
        <h2 className="text-white font-semibold mb-3">Quick Actions</h2>
        <p className="text-slate-400 text-sm">
          Use the sidebar to navigate to Manage Notes, review Pending Approvals, moderate Q&A, and manage
          the Moderation Panel.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboard;