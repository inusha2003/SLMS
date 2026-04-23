import { useState, useEffect, useCallback } from 'react';
import { commentApi } from '../../api/commentApi';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import LoadingSpinner from '../common/LoadingSpinner';
import { FiMessageCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const CommentSection = ({ noteId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await commentApi.getAll(noteId);
      setComments(res.data.data || []);
    } catch {
      toast.error('Failed to load comments');
    } finally {
      setLoading(false);
    }
  }, [noteId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handlePost = async (data) => {
    try {
      setPosting(true);
      await commentApi.create(noteId, { content: data.content });
      toast.success('Comment posted!');
      fetchComments();
    } catch {
      toast.error('Failed to post comment');
    } finally {
      setPosting(false);
    }
  };

  const handleReply = async (parentId, content) => {
    try {
      await commentApi.create(noteId, { content, parentComment: parentId });
      toast.success('Reply posted!');
      fetchComments();
    } catch {
      toast.error('Failed to post reply');
    }
  };

  const handleEdit = async (commentId, content) => {
    try {
      await commentApi.update(noteId, commentId, { content });
      toast.success('Comment updated!');
      fetchComments();
    } catch {
      toast.error('Failed to update comment');
    }
  };

  const handleDelete = async (commentId) => {
    try {
      await commentApi.delete(noteId, commentId);
      toast.success('Comment deleted');
      fetchComments();
    } catch {
      toast.error('Failed to delete comment');
    }
  };

  const handleLike = async (commentId) => {
    try {
      await commentApi.like(noteId, commentId);
      fetchComments();
    } catch {
      toast.error('Failed to update like');
    }
  };

  const handleReport = async (commentId, reason) => {
    try {
      await commentApi.report(noteId, commentId, { reason });
      toast.success('Comment reported for review');
    } catch {
      toast.error('Failed to report comment');
    }
  };

  const rootComments = comments.filter((c) => !c.parentComment);
  const getReplies = (parentId) =>
    comments.filter((c) => c.parentComment?.toString() === parentId?.toString());

  return (
    <section className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#08101c] px-8 py-8 shadow-[0_28px_70px_rgba(2,6,23,0.35)]">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.12),transparent_60%)]" />

      <div className="relative">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-100">
            <FiMessageCircle size={22} />
          </div>
          <div>
            <h3 className="text-3xl font-black tracking-tight text-white">
              Discussion <span className="font-medium text-slate-500">({comments.length})</span>
            </h3>
            <p className="mt-1 text-sm text-slate-400">Ask questions, leave feedback, and help your classmates.</p>
          </div>
        </div>

        <div className="mb-8">
          <CommentForm onSubmit={handlePost} isLoading={posting} />
        </div>

        {loading ? (
          <LoadingSpinner text="Loading discussion..." />
        ) : rootComments.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-14 text-center">
            <FiMessageCircle className="mx-auto mb-4 text-slate-600" size={36} />
            <p className="text-lg font-medium text-slate-300">No comments yet.</p>
            <p className="mt-2 text-sm text-slate-500">Start the discussion with the first comment.</p>
          </div>
        ) : (
          <div className="space-y-5">
            {rootComments.map((comment) => (
              <CommentItem
                key={comment._id}
                comment={comment}
                onReply={handleReply}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onLike={handleLike}
                onReport={handleReport}
                depth={0}
                replies={getReplies(comment._id)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default CommentSection;
