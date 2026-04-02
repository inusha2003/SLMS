import { useNavigate } from 'react-router-dom';
import { FiEye, FiEdit, FiTrash2, FiFile, FiClock, FiTag } from 'react-icons/fi';
import Badge from '../common/Badge';
import { timeAgo } from '../../utils/formatDate';
import useAuth from '../../hooks/useAuth';

const NoteCard = ({ note, onEdit, onDelete, showActions = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const isOwner = note.uploadedBy === user?.userId || note.uploadedBy?._id === user?.userId;
  const isAdmin = user?.role === 'Admin';

  const getFileIcon = (fileType) => {
    if (!fileType) return '📄';
    if (fileType.includes('pdf')) return '📕';
    if (fileType.includes('word')) return '📘';
    if (fileType.includes('presentation')) return '📊';
    if (fileType.startsWith('image')) return '🖼️';
    return '📄';
  };

  return (
    <div className="card-hover group">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{getFileIcon(note.fileType)}</span>
          <div className="min-w-0">
            <h3 className="text-white font-semibold text-sm leading-tight truncate group-hover:text-lms-secondary transition-colors">
              {note.title}
            </h3>
            <p className="text-lms-muted text-xs mt-0.5">{note.moduleCode}</p>
          </div>
        </div>
        <Badge status={note.status} />
      </div>

      <p className="text-slate-400 text-xs mb-3 line-clamp-2">{note.description || 'No description'}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {note.tags?.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-0.5 bg-lms-primary/30 text-lms-secondary
                       border border-lms-primary/30 rounded-full text-xs"
          >
            <FiTag size={9} />
            {tag}
          </span>
        ))}
        {note.tags?.length > 3 && (
          <span className="text-xs text-slate-500">+{note.tags.length - 3}</span>
        )}
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-lms-primary/20">
        <div className="flex items-center gap-1 text-slate-500 text-xs">
          <FiClock size={11} />
          <span>{timeAgo(note.createdAt)}</span>
        </div>

        {showActions && (
          <div className="flex items-center gap-1">
            {note.status === 'approved' && (
              <button
                onClick={() => navigate(`/notes/${note._id}`)}
                className="p-1.5 text-slate-400 hover:text-lms-secondary hover:bg-lms-primary/20
                           rounded-md transition-all"
                title="View"
              >
                <FiEye size={14} />
              </button>
            )}
            {(isOwner || isAdmin) && onEdit && (
              <button
                onClick={() => onEdit(note)}
                className="p-1.5 text-slate-400 hover:text-blue-400 hover:bg-blue-900/20
                           rounded-md transition-all"
                title="Edit"
              >
                <FiEdit size={14} />
              </button>
            )}
            {(isOwner || isAdmin) && onDelete && (
              <button
                onClick={() => onDelete(note)}
                className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20
                           rounded-md transition-all"
                title="Delete"
              >
                <FiTrash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {note.status === 'rejected' && note.rejectionReason && (
        <div className="mt-3 p-2 bg-red-900/20 border border-red-700/30 rounded-lg">
          <p className="text-red-400 text-xs">
            <strong>Rejected:</strong> {note.rejectionReason}
          </p>
        </div>
      )}
    </div>
  );
};

export default NoteCard;