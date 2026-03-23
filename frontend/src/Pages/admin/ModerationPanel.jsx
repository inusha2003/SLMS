import { useState, useEffect, useCallback } from 'react';
import { moderationApi } from '../../api/moderationApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiShield, FiTrash2, FiCheck, FiX, FiAlertTriangle, FiBookOpen, FiFileText } from 'react-icons/fi';
import { timeAgo, formatDateTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const tabs = ['reports', 'flagged', 'logs'];

const ModerationPanel = () => {
  const [activeTab, setActiveTab] = useState('reports');
  const [reports, setReports] = useState([]);
  const [flaggedNotes, setFlaggedNotes] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'reports') {
        const res = await moderationApi.getReports({ status: 'pending' });
        setReports(res.data.data || []);
      } else if (activeTab === 'flagged') {
        const res = await moderationApi.getFlaggedNotes();
        setFlaggedNotes(res.data.data || []);
      } else {
        const res = await moderationApi.getLogs();
        setLogs(res.data.data.logs || []);
      }
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleDismiss = async (reportId) => {
    try {
      await moderationApi.reviewReport(reportId, { action: 'dismiss', reason: 'Dismissed by admin' });
      toast.success('Report dismissed');
      fetchData();
    } catch {
      toast.error('Failed to dismiss report');
    }
  };

  const handleDeleteContent = async (contentType, contentId) => {
    try {
      await moderationApi.deleteContent({ contentType, contentId, reason: 'Removed by admin' });
      toast.success('Content removed');
      fetchData();
    } catch {
      toast.error('Failed to remove content');
    }
  };

  const actionColors = {
    approve_note: 'text-green-400',
    reject_note: 'text-red-400',
    delete_comment: 'text-red-400',
    delete_note: 'text-red-400',
    delete_question: 'text-red-400',
    delete_answer: 'text-red-400',
    warn_user: 'text-orange-400',
    suspend_user: 'text-red-500',
    dismiss_report: 'text-slate-400',
    flag_content: 'text-orange-400',
  };

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <FiShield className="text-lms-secondary" size={24} />
        <div>
          <h1 className="text-2xl font-bold text-white">Moderation Panel</h1>
          <p className="text-slate-400 text-sm">Review reports, flags, and audit logs</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-lms-dark rounded-lg border border-lms-primary/20 w-fit">
        {[
          { key: 'reports', label: 'Reports', icon: FiAlertTriangle },
          { key: 'flagged', label: 'Flagged Notes', icon: FiBookOpen },
          { key: 'logs', label: 'Audit Logs', icon: FiFileText },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-lms-secondary text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-4">
              {reports.length === 0 ? (
                <div className="card text-center py-12">
                  <FiCheck className="mx-auto text-green-400 mb-2" size={32} />
                  <p className="text-white">No pending reports</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div key={report._id} className="card border-orange-700/20">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <FiAlertTriangle className="text-orange-400" size={16} />
                          <span className="text-white font-medium text-sm capitalize">
                            {report.contentType} Reported
                          </span>
                          <span className="px-2 py-0.5 bg-orange-900/30 text-orange-400 border border-orange-700/30 rounded-full text-xs">
                            {report.status}
                          </span>
                        </div>
                        <p className="text-slate-400 text-sm mb-1">
                          <strong className="text-slate-300">Reason:</strong> {report.reason}
                        </p>
                        <p className="text-slate-500 text-xs">
                          Reported by {report.reporterName} • {timeAgo(report.createdAt)}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDeleteContent(report.contentType, report.contentId)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-900/40 text-red-400 border border-red-700/30 rounded-lg text-xs hover:bg-red-900/60 transition-colors"
                        >
                          <FiTrash2 size={12} /> Remove
                        </button>
                        <button
                          onClick={() => handleDismiss(report._id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-lms-primary/30 text-slate-300 border border-lms-primary/30 rounded-lg text-xs hover:bg-lms-primary/50 transition-colors"
                        >
                          <FiX size={12} /> Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Flagged Notes */}
          {activeTab === 'flagged' && (
            <div className="space-y-3">
              {flaggedNotes.length === 0 ? (
                <div className="card text-center py-12">
                  <p className="text-slate-400">No flagged notes</p>
                </div>
              ) : (
                flaggedNotes.map((note) => (
                  <div key={note._id} className="card">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white font-medium">{note.title}</p>
                        <p className="text-slate-400 text-xs mt-1">{note.subject} • {note.moduleCode}</p>
                        {note.flagReason && (
                          <p className="text-orange-400 text-xs mt-1">Flag: {note.flagReason}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteContent('note', note._id)}
                        className="btn-danger flex items-center gap-1 text-xs"
                      >
                        <FiTrash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Audit Logs */}
          {activeTab === 'logs' && (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-lms-primary/20">
                      <th className="text-left text-slate-400 text-xs font-medium py-3 px-3">Action</th>
                      <th className="text-left text-slate-400 text-xs font-medium py-3 px-3">Admin</th>
                      <th className="text-left text-slate-400 text-xs font-medium py-3 px-3">Target</th>
                      <th className="text-left text-slate-400 text-xs font-medium py-3 px-3">Details</th>
                      <th className="text-left text-slate-400 text-xs font-medium py-3 px-3">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id} className="border-b border-lms-primary/10 hover:bg-lms-darkest/50">
                        <td className={`py-3 px-3 font-medium text-xs ${actionColors[log.action] || 'text-slate-300'}`}>
                          {log.action?.replace(/_/g, ' ')}
                        </td>
                        <td className="py-3 px-3 text-slate-300 text-xs">{log.adminName || 'Admin'}</td>
                        <td className="py-3 px-3 text-slate-400 text-xs capitalize">{log.targetType || '-'}</td>
                        <td className="py-3 px-3 text-slate-400 text-xs max-w-xs truncate">{log.details || log.reason || '-'}</td>
                        <td className="py-3 px-3 text-slate-500 text-xs">{formatDateTime(log.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {logs.length === 0 && (
                  <div className="text-center py-10">
                    <p className="text-slate-400">No moderation logs</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ModerationPanel;