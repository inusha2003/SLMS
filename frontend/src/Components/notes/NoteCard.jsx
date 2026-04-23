import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit, FiTrash2, FiClock, FiTag } from 'react-icons/fi';
import Badge from '../common/Badge';
import { timeAgo } from '../../utils/formatDate';
import useAuth from '../../hooks/useAuth';

const NoteCard = ({ note, onEdit, onDelete, showActions = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isOwner = note.uploadedBy === user?.userId || note.uploadedBy?._id === user?.userId;
  const isAdmin = user?.role === 'Admin';

  const getFileIcon = (fileType) => {
    if (!fileType) return 'FILE';
    if (fileType.includes('pdf')) return 'PDF';
    if (fileType.includes('word')) return 'DOC';
    if (fileType.includes('presentation')) return 'PPT';
    if (fileType.startsWith('image')) return 'IMG';
    return 'FILE';
  };

  return (
    <div className="group overflow-hidden rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(11,17,32,0.96),rgba(11,17,32,0.86))] p-6 shadow-[0_24px_70px_rgba(2,8,23,0.28)] transition-all duration-300 hover:border-cyan-400/20 hover:shadow-[0_28px_78px_rgba(8,22,48,0.42)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="rounded-2xl border border-white/8 bg-white/[0.04] px-3 py-2 text-xs font-semibold tracking-[0.18em] text-slate-300">
            {getFileIcon(note.fileType)}
          </span>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold leading-tight text-white transition-colors group-hover:text-lms-secondary">
              {note.title}
            </h3>
            <p className="mt-1 text-sm text-slate-500">{note.subject} • {note.moduleCode}</p>
          </div>
        </div>
        <Badge status={note.status} />
      </div>

      <p className="mb-4 line-clamp-2 text-sm leading-7 text-slate-400">{note.description || 'No description'}</p>

      <div className="mb-5 flex flex-wrap gap-2">
        {note.tags?.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 rounded-full border border-white/6 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400"
          >
            <FiTag size={9} />
            {tag}
          </span>
        ))}
        {note.tags?.length > 3 && <span className="text-xs text-slate-500">+{note.tags.length - 3}</span>}
      </div>

      <div className="flex items-center justify-between border-t border-white/8 pt-4">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <FiClock size={11} />
          <span>{timeAgo(note.createdAt)}</span>
        </div>

        {showActions && (
          <div className="flex items-center gap-2">
            {note.status === 'approved' && (
              <button
                onClick={() => navigate(`/student/notes/${note._id}`)}
                className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-3 py-2 text-cyan-100 transition-all hover:border-cyan-300/40 hover:bg-cyan-400/16"
                title="View"
              >
                <FiEye size={14} />
              </button>
            )}
            {(isOwner || isAdmin) && onEdit && (
              <button
                onClick={() => onEdit(note)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300 transition-all hover:border-blue-400/30 hover:bg-blue-900/20 hover:text-blue-300"
                title="Edit"
              >
                <FiEdit size={14} />
              </button>
            )}
            {(isOwner || isAdmin) && onDelete && (
              <button
                onClick={() => onDelete(note)}
                className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300 transition-all hover:border-red-400/30 hover:bg-red-900/20 hover:text-red-300"
                title="Delete"
              >
                <FiTrash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {note.status === 'rejected' && note.rejectionReason && (
        <div className="mt-4 rounded-2xl border border-red-700/30 bg-red-900/20 p-3">
          <p className="text-xs text-red-400">
            <strong>Rejected:</strong> {note.rejectionReason}
          </p>
        </div>
      )}
    </div>
  );
};

export default NoteCard;
