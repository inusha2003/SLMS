import { useState, useEffect, useCallback } from 'react';
import { noteApi } from '../../api/noteApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import FilePreviewModal from '../../components/common/FilePreviewModal';
import { FiCheck, FiX, FiEye, FiFile, FiClock } from 'react-icons/fi';
import { timeAgo } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const actionButtonClass =
  'inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition-all duration-200';

const PendingApprovals = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [rejecting, setRejecting] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const fetchPending = useCallback(async () => {
    try {
      setLoading(true);
      const res = await noteApi.getPending();
      setNotes(res.data.data || []);
    } catch {
      toast.error('Failed to load pending notes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPending();
  }, [fetchPending]);

  const handleApprove = async (id) => {
    try {
      await noteApi.review(id, { status: 'approved' });
      toast.success('Note approved!');
      fetchPending();
    } catch {
      toast.error('Failed to approve note');
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      await noteApi.review(id, { status: 'rejected', rejectionReason });
      toast.success('Note rejected');
      setRejecting(null);
      setRejectionReason('');
      fetchPending();
    } catch {
      toast.error('Failed to reject note');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight text-white">Pending Approvals</h1>
        <p className="mt-2 text-base text-slate-400">{notes.length} notes waiting for review</p>
      </div>

      {notes.length === 0 ? (
        <div className="rounded-[28px] border border-white/6 bg-[#2b2340] px-6 py-20 text-center shadow-[0_24px_70px_rgba(9,10,24,0.2)]">
          <FiCheck className="mx-auto mb-4 text-green-400" size={42} />
          <p className="text-lg font-semibold text-white">All caught up!</p>
          <p className="mt-2 text-sm text-slate-400">No pending notes to review.</p>
        </div>
      ) : (
        <div className="space-y-5">
          {notes.map((note) => (
            <div
              key={note._id}
              className="rounded-[28px] border border-white/6 bg-[#2b2340] px-6 py-5 shadow-[0_24px_70px_rgba(9,10,24,0.18)]"
            >
              <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#5756a7,#6d63ff)] text-white shadow-[0_10px_24px_rgba(93,99,255,0.18)]">
                      <FiFile size={16} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-2xl font-bold text-white">{note.title}</h3>
                      <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-300">
                        <span>
                          <strong className="font-semibold text-white">Subject:</strong> {note.subject}
                        </span>
                        <span>
                          <strong className="font-semibold text-white">Module:</strong> {note.moduleCode}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
                    <FiClock size={14} />
                    <span>{timeAgo(note.createdAt)}</span>
                  </div>

                  {note.description && (
                    <p className="mb-4 max-w-3xl text-base leading-7 text-slate-400">{note.description}</p>
                  )}

                  {note.tags?.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-2">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full border border-white/6 bg-white/[0.04] px-3 py-1 text-xs text-slate-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {rejecting === note._id && (
                    <div className="mt-5 max-w-2xl rounded-2xl border border-red-500/18 bg-red-500/8 p-4">
                      <input
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full rounded-2xl border border-white/10 bg-[#1f1830] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-red-400/35"
                        placeholder="Rejection reason (required)..."
                      />
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleReject(note._id)}
                          className={`${actionButtonClass} border border-red-500/20 bg-red-600/20 text-red-200 hover:bg-red-600/30`}
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => {
                            setRejecting(null);
                            setRejectionReason('');
                          }}
                          className={`${actionButtonClass} border border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.07]`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex w-full flex-col gap-2 xl:w-auto xl:min-w-[160px]">
                  {note.fileUrl && (
                    <button
                      onClick={() => setPreview(note)}
                      className={`${actionButtonClass} border border-indigo-400/18 bg-indigo-500/10 text-indigo-200 hover:bg-indigo-500/18`}
                    >
                      <FiEye size={14} />
                      Preview
                    </button>
                  )}
                  <button
                    onClick={() => handleApprove(note._id)}
                    className={`${actionButtonClass} border border-green-500/18 bg-green-500/12 text-green-300 hover:bg-green-500/20`}
                  >
                    <FiCheck size={14} />
                    Approve
                  </button>
                  <button
                    onClick={() => setRejecting(note._id)}
                    className={`${actionButtonClass} border border-red-500/18 bg-red-500/10 text-red-300 hover:bg-red-500/18`}
                  >
                    <FiX size={14} />
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <FilePreviewModal
        isOpen={!!preview}
        fileUrl={preview?.fileUrl}
        fileName={preview?.fileName}
        fileType={preview?.fileType}
        onClose={() => setPreview(null)}
      />
    </div>
  );
};

export default PendingApprovals;
