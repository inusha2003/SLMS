import { useState } from 'react';
import { FiArrowUp, FiCheck, FiEdit, FiTrash2, FiFlag } from 'react-icons/fi';
import { timeAgo } from '../../utils/formatDate';
import useAuth from '../../hooks/useAuth';

const AnswerItem = ({ answer, questionAuthorId, onUpvote, onAccept, onEdit, onDelete, onReport }) => {
  const { user } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [editBody, setEditBody] = useState(answer.body);

  const isOwner = answer.author === user?.userId || answer.author?._id === user?.userId;
  const isAdmin = user?.role === 'Admin';
  const isQAuthor = questionAuthorId === user?.userId;
  const isUpvoted = answer.upvotes?.some((id) => id === user?.userId || id?._id === user?.userId);

  return (
    <div className={`rounded-xl p-5 border ${
      answer.isAccepted
        ? 'bg-green-900/10 border-green-700/40'
        : 'bg-lms-darkest border-lms-primary/20'
    }`}>
      {answer.isAccepted && (
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-green-900/30 border border-green-700/40 rounded-full">
            <FiCheck className="text-green-400" size={13} />
            <span className="text-green-400 text-xs font-medium">Accepted Answer</span>
          </div>
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onUpvote(answer._id)}
            className={`flex flex-col items-center p-2 rounded-lg border transition-all ${
              isUpvoted
                ? 'bg-lms-primary/30 border-lms-secondary text-lms-secondary'
                : 'bg-lms-dark border-lms-primary/30 text-slate-400 hover:border-lms-secondary hover:text-lms-secondary'
            }`}
          >
            <FiArrowUp size={16} />
            <span className="text-sm font-bold">{answer.upvotes?.length || 0}</span>
          </button>

          {isQAuthor && !answer.isAccepted && (
            <button
              onClick={() => onAccept(answer._id)}
              className="p-2 rounded-lg border border-green-700/40 text-green-500
                         hover:bg-green-900/20 hover:text-green-400 transition-all"
              title="Mark as accepted"
            >
              <FiCheck size={16} />
            </button>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-lms-accent rounded-full flex items-center justify-center text-white text-xs font-bold">
                {answer.authorName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-white font-medium text-sm">{answer.authorName}</p>
                <p className="text-slate-500 text-xs">{timeAgo(answer.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {(isOwner || isAdmin) && (
                <>
                  <button
                    onClick={() => setShowEdit(!showEdit)}
                    className="p-1.5 text-slate-400 hover:text-blue-400 rounded-md transition-colors"
                  >
                    <FiEdit size={13} />
                  </button>
                  <button
                    onClick={() => onDelete(answer._id)}
                    className="p-1.5 text-slate-400 hover:text-red-400 rounded-md transition-colors"
                  >
                    <FiTrash2 size={13} />
                  </button>
                </>
              )}
              {!isOwner && (
                <button
                  onClick={() => onReport(answer._id)}
                  className="p-1.5 text-slate-400 hover:text-orange-400 rounded-md transition-colors"
                >
                  <FiFlag size={13} />
                </button>
              )}
            </div>
          </div>

          {showEdit ? (
            <div className="space-y-2">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="input-field resize-none"
                rows={4}
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onEdit(answer._id, editBody); setShowEdit(false); }}
                  className="btn-primary text-xs px-3 py-1.5"
                >
                  Update
                </button>
                <button onClick={() => setShowEdit(false)} className="btn-secondary text-xs px-3 py-1.5">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-300 text-sm leading-relaxed">{answer.body}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnswerItem;