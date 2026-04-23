import { useState, useEffect, useCallback } from 'react';
import { noteApi } from '../../api/noteApi';
import { commentApi } from '../../api/commentApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { FiMessageSquare, FiTrash2 } from 'react-icons/fi';
import { timeAgo } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const Discussions = () => {
  const [approvedNotes, setApprovedNotes] = useState([]);
  const [selectedNote, setSelectedNote] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingComments, setLoadingComments] = useState(false);

  useEffect(() => {
    noteApi
      .getAll({ status: 'approved' })
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
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-black tracking-tight text-white">Discussions</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <aside className="space-y-3">
          {approvedNotes.map((note) => {
            const isActive = selectedNote?._id === note._id;
            return (
              <button
                key={note._id}
                onClick={() => loadComments(note)}
                className={[
                  'w-full rounded-[22px] border px-4 py-4 text-left transition-all duration-200',
                  isActive
                    ? 'border-white/30 bg-[#30284a] shadow-[0_18px_40px_rgba(9,10,24,0.2)]'
                    : 'border-white/6 bg-[#2b2340] hover:border-white/14 hover:bg-[#31274b]',
                ].join(' ')}
              >
                <p className="truncate text-xl font-bold text-white">{note.title}</p>
                <p className="mt-1 text-sm text-slate-500">{note.subject}</p>
              </button>
            );
          })}

          {approvedNotes.length === 0 && (
            <div className="rounded-[22px] border border-white/6 bg-[#2b2340] px-5 py-10 text-center text-sm text-slate-400">
              No approved notes found.
            </div>
          )}
        </aside>

        <section className="rounded-[28px] border border-white/6 bg-[#2b2340] px-6 py-6 shadow-[0_24px_70px_rgba(9,10,24,0.18)]">
          {!selectedNote ? (
            <div className="flex min-h-[240px] items-center justify-center">
              <div className="text-center">
                <FiMessageSquare className="mx-auto mb-3 text-slate-600" size={34} />
                <p className="text-base text-slate-400">Select a note to view its discussions.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-white">{selectedNote.title}</h2>
                <p className="mt-2 text-base text-slate-400">{comments.length} comments</p>
              </div>

              {loadingComments ? (
                <LoadingSpinner size="sm" />
              ) : comments.length === 0 ? (
                <div className="rounded-[22px] border border-white/6 bg-[#241d35] px-5 py-12 text-center text-sm text-slate-400">
                  No comments yet.
                </div>
              ) : (
                <div className="space-y-4">
                  {comments.map((comment) => (
                    <article
                      key={comment._id}
                      className="rounded-[22px] border border-white/6 bg-[#241d35] px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-white">{comment.authorName}</p>
                          <p className="mt-1 text-sm text-slate-500">{timeAgo(comment.createdAt)}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteComment(comment._id)}
                          className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-red-900/20 hover:text-red-300"
                          title="Delete comment"
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>

                      <p className="mt-4 text-base leading-7 text-slate-200">{comment.content}</p>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default Discussions;
