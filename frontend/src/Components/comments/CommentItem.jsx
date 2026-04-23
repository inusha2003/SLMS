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
      <div className={`${depth > 0 ? 'ml-8 border-l border-white/10 pl-5' : ''}`}>
        <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.02] px-5 py-4">
          <p className="text-sm italic text-slate-500">[This comment has been deleted]</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${depth > 0 ? 'ml-8 border-l border-white/10 pl-5' : ''}`}>
      <article className="overflow-hidden rounded-[28px] border border-white/10 bg-[#070e19] shadow-[0_20px_55px_rgba(2,6,23,0.3)]">
        <div className="flex items-start justify-between gap-4 px-6 pt-6">
          <div className="flex items-center gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(99,102,241,0.35),rgba(59,130,246,0.25))] text-sm font-bold text-white">
              {comment.authorName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-lg font-bold text-white">{comment.authorName || 'Unknown User'}</p>
              <p className="mt-1 text-sm text-slate-500">{timeAgo(comment.createdAt)}</p>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowMenu((value) => !value)}
              className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-white"
            >
              <FiMoreVertical size={16} />
            </button>
            {showMenu && (
              <div className="absolute right-0 top-12 z-10 min-w-[160px] overflow-hidden rounded-2xl border border-white/10 bg-[#0b1422] shadow-xl">
                {(isOwner || isAdmin) && (
                  <>
                    <button
                      onClick={() => {
                        setShowEditForm(true);
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                    >
                      <FiEdit size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        onDelete(comment._id);
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
                    >
                      <FiTrash2 size={14} />
                      Delete
                    </button>
                  </>
                )}
                {!isOwner && (
                  <button
                    onClick={() => {
                      setShowReportInput(true);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-4 py-3 text-sm text-amber-300 transition-colors hover:bg-amber-500/10 hover:text-amber-200"
                  >
                    <FiFlag size={14} />
                    Report
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-5">
          {showEditForm ? (
            <CommentForm
              onSubmit={(data) => {
                onEdit(comment._id, data.content);
                setShowEditForm(false);
              }}
              onCancel={() => setShowEditForm(false)}
              placeholder="Edit your comment..."
              submitLabel="Update"
            />
          ) : (
            <p className="text-base leading-8 text-slate-200">{comment.content}</p>
          )}

          {showReportInput && (
            <div className="mt-5 rounded-[22px] border border-amber-500/20 bg-amber-500/[0.04] p-4">
              <input
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-[#09111f] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-amber-400/40"
                placeholder="Reason for reporting..."
              />
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  onClick={handleReport}
                  className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm font-semibold text-amber-200 transition-colors hover:bg-amber-500/20"
                >
                  Submit Report
                </button>
                <button
                  onClick={() => setShowReportInput(false)}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-5 border-t border-white/10 pt-4">
            <button
              onClick={() => onLike(comment._id)}
              className={`inline-flex items-center gap-2 text-sm transition-colors ${
                isLiked ? 'text-rose-400' : 'text-slate-500 hover:text-rose-300'
              }`}
            >
              <FiHeart size={15} className={isLiked ? 'fill-current' : ''} />
              <span>{comment.likes?.length || 0}</span>
            </button>

            {depth < 3 && (
              <button
                onClick={() => setShowReplyForm((value) => !value)}
                className="inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-cyan-300"
              >
                <FiMessageCircle size={15} />
                Reply
              </button>
            )}
          </div>

          {showReplyForm && (
            <div className="mt-5">
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
      </article>

      {replies.length > 0 && (
        <div className="mt-4 space-y-4">
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
      )}
    </div>
  );
};

export default CommentItem;
