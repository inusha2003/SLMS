import { useState, useEffect } from 'react';
import { noteApi } from '../../api/noteApi';
import { qaApi } from '../../api/qaApi';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiBookOpen, FiClock, FiCheckCircle, FiXCircle, FiHelpCircle, FiArrowRight } from 'react-icons/fi';
import useAuth from '../../hooks/useAuth';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <div className="card flex items-center gap-4">
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="text-white" size={20} />
    </div>
    <div>
      <p className="text-slate-400 text-xs">{label}</p>
      <p className="text-white font-bold text-xl">{value ?? '-'}</p>
    </div>
  </div>
);

const StudentDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myNotes, setMyNotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    noteApi.getMine()
      .then((res) => setMyNotes(res.data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const pendingCount = myNotes.filter((n) => n.status === 'pending').length;
  const approvedCount = myNotes.filter((n) => n.status === 'approved').length;
  const rejectedCount = myNotes.filter((n) => n.status === 'rejected').length;

  if (loading) return <LoadingSpinner />;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">
          Welcome, {user?.name || 'Student'}! 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">Here's your learning overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={FiBookOpen} label="My Notes" value={myNotes.length} color="bg-lms-primary" />
        <StatCard icon={FiClock} label="Pending" value={pendingCount} color="bg-yellow-700" />
        <StatCard icon={FiCheckCircle} label="Approved" value={approvedCount} color="bg-green-700" />
        <StatCard icon={FiXCircle} label="Rejected" value={rejectedCount} color="bg-red-700" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold flex items-center gap-2">
              <FiBookOpen className="text-lms-secondary" size={16} />
              Recent Submissions
            </h2>
            <button onClick={() => navigate('/student/my-notes')} className="text-xs text-lms-secondary hover:text-white transition-colors flex items-center gap-1">
              View all <FiArrowRight size={12} />
            </button>
          </div>
          {myNotes.slice(0, 5).map((note) => (
            <div key={note._id} className="flex items-center justify-between py-2 border-b border-lms-primary/10 last:border-0">
              <div>
                <p className="text-white text-sm truncate max-w-[200px]">{note.title}</p>
                <p className="text-slate-500 text-xs">{note.subject}</p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                note.status === 'approved' ? 'text-green-400 bg-green-900/30' :
                note.status === 'rejected' ? 'text-red-400 bg-red-900/30' :
                'text-yellow-400 bg-yellow-900/30'
              }`}>
                {note.status}
              </span>
            </div>
          ))}
          {myNotes.length === 0 && (
            <p className="text-slate-500 text-sm text-center py-4">No notes uploaded yet</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <FiHelpCircle className="text-lms-secondary" size={16} />
            Quick Actions
          </h2>
          <div className="space-y-3">
            {[
              { label: 'Browse Learning Resources', path: '/student/browse-notes', desc: 'Explore approved notes' },
              { label: 'Upload a Note', path: '/student/upload-note', desc: 'Share your knowledge' },
              { label: 'Q&A Forum', path: '/student/qa-forum', desc: 'Ask or answer questions' },
            ].map(({ label, path, desc }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="w-full flex items-center justify-between p-3 bg-lms-darkest rounded-lg border border-lms-primary/20 hover:border-lms-secondary/50 hover:bg-lms-darkest/70 transition-all text-left group"
              >
                <div>
                  <p className="text-white text-sm font-medium group-hover:text-lms-secondary transition-colors">{label}</p>
                  <p className="text-slate-500 text-xs">{desc}</p>
                </div>
                <FiArrowRight className="text-slate-500 group-hover:text-lms-secondary transition-colors" size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;