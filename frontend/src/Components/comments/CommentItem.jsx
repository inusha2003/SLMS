import { useState } from 'react';
import { FiHeart, FiMessageCircle, FiEdit, FiTrash2, FiFlag, FiMoreVertical } from 'react-icons/fi';
import { timeAgo } from '../../utils/formatDate';
import CommentForm from './CommentForm';
import useAuth from '../../hooks/useAuth';

const CommentItem = ({ comment, onReply, onEdit, onDelete, onLike, onReport, depth = 0, replies = [] }) => {
  const { user } = useAuth();
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showReportInput, setShowReportInput] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const isOwner = comment.author === user?.userId || comment.author?._id === user?.userId;
  const isAdmin = user?.role === 'Admin';
  const isLiked = comment.likes?.some((id) => id === user?.userId || id?._id === user?.userId);

  const handleReport = () => {
    if (reportReason.trim()) {
      onReport(comment._id, reportReason);
      setShowReportInput(false);
      setReportReason('');
    }
  };

  if (comment.isDeleted) {
    return (
      <div className={`pl-${Math.min(depth * 4, 12)} mt-3`}>
        <div className="px-4 py-2 bg-lms-darkest/50 rounded-lg border border-lms-primary/10">
          <p className="text-slate-600 text-xs italic">[This comment has been deleted]</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l-2 border-lms-primary/20 pl-4' : ''} mt-4`}>
      <div className="bg-lms-darkest rounded-lg p-4 border border-lms-primary/20 hover:border-lms-primary/40 transition-colors">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-lms-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {comment.authorName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{comment.authorName || 'Unknown User'}</p>
              <p className="text-slate-500 text-xs">{timeAgo(comment.createdAt)}</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 text-slate-500 hover:text-white transition-colors rounded"
            >
              <FiMoreVertical size={15} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-7 bg-lms-dark border border-lms-primary/30 rounded-lg shadow-xl z-10 min-w-[140px] py-1">
                {(isOwner || isAdmin) && (
                  <>
                    <button
                      onClick={() => { setShowEditForm(true); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-lms-primary/30 hover:text-white transition-colors"
                    >
                      <FiEdit size={12} /> Edit
                    </button>
                    <button
                      onClick={() => { onDelete(comment._id); setShowMenu(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-900/20 transition-colors"
                    >
                      <FiTrash2 size={12} /> Delete
                    </button>
                  </>
                )}
                {!isOwner && (
                  <button
                    onClick={() => { setShowReportInput(true); setShowMenu(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-orange-400 hover:bg-orange-900/20 transition-colors"
                  >
                    <FiFlag size={12} /> Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {showEditForm ? (
          <div className="mt-3">
            <CommentForm
              onSubmit={(data) => { onEdit(comment._id, data.content); setShowEditForm(false); }}
              onCancel={() => setShowEditForm(false)}
              placeholder="Edit your comment..."
              submitLabel="Update"
            />
          </div>
        ) : (
          <p className="text-slate-300 text-sm mt-3 leading-relaxed">{comment.content}</p>
        )}

        {showReportInput && (
          <div className="mt-3 space-y-2">
            <input
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="input-field text-xs"
              placeholder="Reason for reporting..."
            />
            <div className="flex gap-2">
              <button onClick={handleReport} className="btn-danger text-xs px-3 py-1">
                Submit Report
              </button>
              <button onClick={() => setShowReportInput(false)} className="btn-secondary text-xs px-3 py-1">
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-lms-primary/10">
          <button
            onClick={() => onLike(comment._id)}
            className={`flex items-center gap-1 text-xs transition-colors ${
              isLiked ? 'text-red-400' : 'text-slate-500 hover:text-red-400'
            }`}
          >
            <FiHeart size={13} className={isLiked ? 'fill-current' : ''} />
            <span>{comment.likes?.length || 0}</span>
          </button>

          {depth < 3 && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-lms-secondary transition-colors"
            >
              <FiMessageCircle size={13} />
              <span>Reply</span>
            </button>
          )}
        </div>

        {showReplyForm && (
          <div className="mt-3">
            <CommentForm
              onSubmit={(data) => {
                onReply(comment._id, data.content);
                setShowReplyForm(false);
              }}
              onCancel={() => setShowReplyForm(false)}
              placeholder={`Reply to ${comment.authorName}...`}
              submitLabel="Reply"
            />
          </div>
        )}
      </div>

      {/* Replies */}
      {replies.map((reply) => (
        <CommentItem
          key={reply._id}
          comment={reply}
          onReply={onReply}
          onEdit={onEdit}
          onDelete={onDelete}
          onLike={onLike}
          onReport={onReport}
          depth={depth + 1}
          replies={[]}
        />
      ))}
    </div>
  );
};

export default CommentItem;