import { useState, useEffect, useCallback } from 'react';
import { noteApi } from '../../api/noteApi';
import { commentApi } from '../../api/commentApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiMessageSquare, FiTrash2, FiFlag } from 'react-icons/fi';
import { timeAgo } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const Discussions = () => {
  const [approvedNotes, setApprovedNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    noteApi.getAll({ status: 'approved' })
      .then((res) => setApprovedNotes(res.data.data.notes || []))
      .catch(() => toast.error('Failed to load notes'))
      .finally(() => setLoading(false));
  }, []);

  const loadComments = useCallback(async (note) => {
    setSelectedNote(note);
    setLoadingComments(true);
    try {
      const res = await commentApi.getAll(note._id);
      setComments(res.data.data || []);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setLoadingComments(false);
    }
  }, []);

  const handleDeleteComment = async (commentId) => {
    try {
      await commentApi.delete(selectedNote._id, commentId);
      toast.success('Comment deleted');
      loadComments(selectedNote);
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="flex gap-6 h-full">
      {/* Note List */}
      <div className="w-80 flex-shrink-0 space-y-2">
        <h1 className="text-xl font-bold text-white mb-4">Discussions</h1>
        {approvedNotes.map((note) => (
          <button
            key={note._id}
            onClick={() => loadComments(note)}
            className={`w-full text-left p-3 rounded-lg border transition-all ${
              selectedNote?._id === note._id
                ? 'bg-lms-secondary/20 border-lms-secondary text-white'
                : 'bg-lms-dark border-lms-primary/20 text-slate-300 hover:border-lms-primary/50'
            }`}
          >
            <p className="font-medium text-sm truncate">{note.title}</p>
            <p className="text-xs text-slate-500 mt-0.5">{note.subject}</p>
          </button>
        ))}
        {approvedNotes.length === 0 && (
          <p className="text-slate-500 text-sm">No approved notes found</p>
        )}
      </div>

      {/* Comments Panel */}
      <div className="flex-1 min-w-0">
        {!selectedNote ? (
          <div className="card h-64 flex items-center justify-center">
            <div className="text-center">
              <FiMessageSquare className="mx-auto text-slate-600 mb-2" size={32} />
              <p className="text-slate-500">Select a note to view its discussions</p>
            </div>
          </div>
        ) : (
          <div className="card">
            <h2 className="text-white font-bold mb-1">{selectedNote.title}</h2>
            <p className="text-slate-400 text-xs mb-4">{comments.length} comments</p>

            {loadingComments ? (
              <LoadingSpinner size="sm" />
            ) : comments.length === 0 ? (
              <p className="text-slate-500 text-sm">No comments yet</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {comments.map((comment) => (
                  <div key={comment._id} className="p-3 bg-lms-darkest rounded-lg border border-lms-primary/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-white text-sm font-medium">{comment.authorName}</p>
                        <p className="text-slate-500 text-xs">{timeAgo(comment.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        {comment.isReported && (
                          <span className="flex items-center gap-1 text-xs text-orange-400">
                            <FiFlag size={11} /> Reported
                          </span>
                        )}
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                        >
                          <FiTrash2 size={13} />
                        </button>
                      </div>
                    </div>
                    <p className="text-slate-300 text-sm mt-2">{comment.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Discussions;