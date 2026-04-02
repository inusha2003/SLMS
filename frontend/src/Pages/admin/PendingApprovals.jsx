import { useState, useEffect, useCallback } from 'react';
import { noteApi } from '../../api/noteApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import FilePreviewModal from '../../components/common/FilePreviewModal';
import { FiCheck, FiX, FiEye, FiFile, FiClock } from 'react-icons/fi';
import { timeAgo } from '../../utils/formatDate';
import toast from 'react-hot-toast';

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

  useEffect(() => { fetchPending(); }, [fetchPending]);

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
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Pending Approvals</h1>
        <p className="text-slate-400 text-sm">{notes.length} notes waiting for review</p>
      </div>

      {notes.length === 0 ? (
        <div className="card text-center py-16">
          <FiCheck className="mx-auto text-green-400 mb-3" size={40} />
          <p className="text-white font-medium">All caught up!</p>
          <p className="text-slate-400 text-sm">No pending notes to review</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div key={note._id} className="card">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <FiFile className="text-lms-secondary" size={16} />
                    <h3 className="text-white font-semibold">{note.title}</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-400 mb-3">
                    <span><strong className="text-slate-300">Subject:</strong> {note.subject}</span>
                    <span><strong className="text-slate-300">Module:</strong> {note.moduleCode}</span>
                    <span className="flex items-center gap-1">
                      <FiClock size={11} />
                      {timeAgo(note.createdAt)}
                    </span>
                  </div>
                  {note.description && (
                    <p className="text-slate-400 text-sm mb-3">{note.description}</p>
                  )}
                  {note.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-lms-primary/20 text-slate-400 rounded-full text-xs">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {rejecting === note._id && (
                    <div className="mt-3 space-y-2">
                      <input
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="input-field text-sm"
                        placeholder="Rejection reason (required)..."
                      />
                      <div className="flex gap-2">
                        <button onClick={() => handleReject(note._id)} className="btn-danger text-xs px-3 py-1.5">
                          Confirm Reject
                        </button>
                        <button onClick={() => { setRejecting(null); setRejectionReason(''); }} className="btn-secondary text-xs px-3 py-1.5">
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex sm:flex-col gap-2">
                  {note.fileUrl && (
                    <button
                      onClick={() => setPreview(note)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-lms-primary/30 text-lms-secondary border border-lms-primary/40 rounded-lg text-xs hover:bg-lms-primary/50 transition-colors"
                    >
                      <FiEye size={13} /> Preview
                    </button>
                  )}
                  <button
                    onClick={() => handleApprove(note._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-900/50 text-green-400 border border-green-700/50 rounded-lg text-xs hover:bg-green-900/70 transition-colors"
                  >
                    <FiCheck size={13} /> Approve
                  </button>
                  <button
                    onClick={() => setRejecting(note._id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/50 text-red-400 border border-red-700/50 rounded-lg text-xs hover:bg-red-900/70 transition-colors"
                  >
                    <FiX size={13} /> Reject
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