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

  useEffect(() => { fetchComments(); }, [fetchComments]);

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

  // Build threaded structure
  const rootComments = comments.filter((c) => !c.parentComment);
  const getReplies = (parentId) =>
    comments.filter((c) => c.parentComment?.toString() === parentId?.toString());

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-6">
        <FiMessageCircle className="text-lms-secondary" size={20} />
        <h3 className="text-white font-bold text-lg">
          Discussion <span className="text-slate-500 font-normal text-base">({comments.length})</span>
        </h3>
      </div>

      <div className="card mb-6">
        <CommentForm onSubmit={handlePost} isLoading={posting} />
      </div>

      {loading ? (
        <LoadingSpinner text="Loading discussion..." />
      ) : rootComments.length === 0 ? (
        <div className="text-center py-10">
          <FiMessageCircle className="mx-auto text-slate-600 mb-3" size={32} />
          <p className="text-slate-500">No comments yet. Start the discussion!</p>
        </div>
      ) : (
        <div className="space-y-2">
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
  );
};

export default CommentSection;