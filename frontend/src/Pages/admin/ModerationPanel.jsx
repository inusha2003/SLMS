import { useState, useEffect, useCallback } from 'react';
import { moderationApi } from '../../api/moderationApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import {
  FiShield,
  FiTrash2,
  FiCheck,
  FiX,
  FiAlertTriangle,
  FiBookOpen,
  FiFileText,
} from 'react-icons/fi';
import { timeAgo, formatDateTime } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const tabs = ['reports', 'flagged', 'logs'];

const tabMeta = [
  { key: 'reports', label: 'Reports', icon: FiAlertTriangle },
  { key: 'flagged', label: 'Flagged Notes', icon: FiBookOpen },
  { key: 'logs', label: 'Audit Logs', icon: FiFileText },
];

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

const actionButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition-all duration-200';

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

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDismiss = async (reportId) => {
    try {
      await moderationApi.reviewReport(reportId, {
        action: 'dismiss',
        reason: 'Dismissed by admin',
      });
      toast.success('Report dismissed');
      fetchData();
    } catch {
      toast.error('Failed to dismiss report');
    }
  };

  const handleDeleteContent = async (contentType, contentId) => {
    try {
      await moderationApi.deleteContent({
        contentType,
        contentId,
        reason: 'Removed by admin',
      });
      toast.success('Content removed');
      fetchData();
    } catch {
      toast.error('Failed to remove content');
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6d63ff,#5b7cff)] text-white shadow-[0_14px_30px_rgba(93,99,255,0.24)]">
          <FiShield size={22} />
        </div>
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Moderation Panel</h1>
          <p className="mt-2 text-base text-slate-400">Review reports, flags, and audit logs</p>
        </div>
      </div>

      <div className="mb-6 inline-flex flex-wrap gap-1 rounded-[22px] border border-white/6 bg-[#2b2340] p-1.5">
        {tabMeta.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={[
              'inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200',
              activeTab === key
                ? 'bg-[linear-gradient(135deg,#6d63ff,#5b7cff)] text-white shadow-[0_14px_26px_rgba(93,99,255,0.2)]'
                : 'text-slate-400 hover:bg-white/[0.04] hover:text-white',
            ].join(' ')}
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
          {activeTab === 'reports' && (
            <div className="space-y-5">
              {reports.length === 0 ? (
                <div className="rounded-[28px] border border-white/6 bg-[#2b2340] px-6 py-20 text-center shadow-[0_24px_70px_rgba(9,10,24,0.2)]">
                  <FiCheck className="mx-auto mb-4 text-green-400" size={42} />
                  <p className="text-lg font-semibold text-white">No Pending Reports</p>
                </div>
              ) : (
                reports.map((report) => (
                  <div
                    key={report._id}
                    className="rounded-[28px] border border-orange-500/12 bg-[#2b2340] px-6 py-5 shadow-[0_24px_70px_rgba(9,10,24,0.18)]"
                  >
                    <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="mb-3 flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-500/12 text-orange-400">
                            <FiAlertTriangle size={16} />
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-2xl font-bold text-white capitalize">
                              {report.contentType} Reported
                            </span>
                            <span className="rounded-full border border-orange-500/18 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-300">
                              {report.status}
                            </span>
                          </div>
                        </div>

                        <p className="mb-2 text-lg text-slate-300">
                          <strong className="font-semibold text-white">Reason:</strong> {report.reason}
                        </p>
                        <p className="text-sm text-slate-500">
                          Reported by {report.reporterName} • {timeAgo(report.createdAt)}
                        </p>
                      </div>

                      <div className="flex w-full flex-col gap-2 xl:w-auto xl:min-w-[160px]">
                        <button
                          onClick={() => handleDeleteContent(report.contentType, report.contentId)}
                          className={`${actionButtonClass} border border-red-500/18 bg-red-500/10 text-red-300 hover:bg-red-500/18`}
                        >
                          <FiTrash2 size={14} />
                          Remove
                        </button>
                        <button
                          onClick={() => handleDismiss(report._id)}
                          className={`${actionButtonClass} border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]`}
                        >
                          <FiX size={14} />
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'flagged' && (
            <div className="space-y-5">
              {flaggedNotes.length === 0 ? (
                <div className="rounded-[28px] border border-white/6 bg-[#2b2340] px-6 py-20 text-center shadow-[0_24px_70px_rgba(9,10,24,0.2)]">
                  <p className="text-lg font-semibold text-white">No flagged notes</p>
                </div>
              ) : (
                flaggedNotes.map((note) => (
                  <div
                    key={note._id}
                    className="rounded-[28px] border border-white/6 bg-[#2b2340] px-6 py-5 shadow-[0_24px_70px_rgba(9,10,24,0.18)]"
                  >
                    <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-2xl font-bold text-white">{note.title}</h3>
                        <p className="mt-2 text-base text-slate-400">
                          {note.subject} • {note.moduleCode}
                        </p>
                        {note.flagReason && (
                          <p className="mt-3 text-sm text-orange-300">Flag: {note.flagReason}</p>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteContent('note', note._id)}
                        className={`${actionButtonClass} border border-red-500/18 bg-red-500/10 text-red-300 hover:bg-red-500/18`}
                      >
                        <FiTrash2 size={14} />
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="overflow-hidden rounded-[28px] border border-white/6 bg-[#2b2340] shadow-[0_24px_70px_rgba(9,10,24,0.18)]">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/6">
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Action
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Admin
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Target
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Details
                      </th>
                      <th className="px-4 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log._id} className="border-b border-white/6 last:border-b-0 hover:bg-white/[0.02]">
                        <td className={`px-4 py-4 text-sm font-medium capitalize ${actionColors[log.action] || 'text-slate-300'}`}>
                          {log.action?.replace(/_/g, ' ')}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-300">{log.adminName || 'Admin'}</td>
                        <td className="px-4 py-4 text-sm capitalize text-slate-400">{log.targetType || '-'}</td>
                        <td className="max-w-xs truncate px-4 py-4 text-sm text-slate-400">
                          {log.details || log.reason || '-'}
                        </td>
                        <td className="px-4 py-4 text-sm text-slate-500">{formatDateTime(log.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {logs.length === 0 && (
                  <div className="px-6 py-16 text-center text-sm text-slate-400">No moderation logs</div>
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
