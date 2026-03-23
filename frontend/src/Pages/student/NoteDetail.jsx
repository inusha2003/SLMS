import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { noteApi } from '../../api/noteApi';
import CommentSection from '../../components/comments/CommentSection';
import FilePreviewModal from '../../components/common/FilePreviewModal';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Badge from '../../components/common/Badge';
import { FiArrowLeft, FiEye, FiDownload, FiTag, FiClock, FiFile } from 'react-icons/fi';
import { formatDate } from '../../utils/formatDate';

const NoteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewOpen, setPreviewOpen] = useState(false);
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  useEffect(() => {
    noteApi.getById(id)
      .then((res) => setNote(res.data.data))
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!note) return null;

  const fullFileUrl = note.fileUrl?.startsWith('http') ? note.fileUrl : `${baseUrl}${note.fileUrl}`;

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
      >
        <FiArrowLeft size={16} />
        Back
      </button>

      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-xl font-bold text-white mb-1">{note.title}</h1>
            <p className="text-slate-400 text-sm">{note.subject} • {note.moduleCode}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge status={note.status} />
            <Badge status={note.visibility} />
          </div>
        </div>

        {note.description && (
          <p className="text-slate-300 text-sm mb-4 leading-relaxed">{note.description}</p>
        )}

        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {note.tags.map((tag) => (
              <span key={tag} className="flex items-center gap-1 px-3 py-1 bg-lms-primary/20 text-lms-secondary border border-lms-primary/30 rounded-full text-xs">
                <FiTag size={10} />
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <FiClock size={11} />
            {formatDate(note.createdAt)}
          </span>
          <span className="flex items-center gap-1">
            <FiEye size={11} />
            {note.viewCount} views
          </span>
        </div>

        {note.fileUrl && (
          <div className="flex items-center gap-3 p-4 bg-lms-darkest rounded-lg border border-lms-primary/20">
            <FiFile className="text-lms-secondary" size={20} />
            <div className="flex-1">
              <p className="text-white text-sm font-medium">{note.fileName || 'Attached File'}</p>
              <p className="text-slate-500 text-xs">{note.fileType}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPreviewOpen(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-lms-secondary border border-lms-secondary/50 rounded-lg hover:bg-lms-secondary/20 transition-colors"
              >
                <FiEye size={12} /> Preview
              </button>
              <a
                href={fullFileUrl}
                download={note.fileName}
                className="flex items-center gap-1 px-3 py-1.5 text-xs text-white bg-lms-primary rounded-lg hover:bg-lms-secondary transition-colors"
              >
                <FiDownload size={12} /> Download
              </a>
            </div>
          </div>
        )}
      </div>

      <CommentSection noteId={note._id} />

      <FilePreviewModal
        isOpen={previewOpen}
        fileUrl={note.fileUrl}
        fileName={note.fileName}
        fileType={note.fileType}
        onClose={() => setPreviewOpen(false)}
      />
    </div>
  );
};

export default NoteDetail;