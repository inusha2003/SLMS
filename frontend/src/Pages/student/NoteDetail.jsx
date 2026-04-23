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
    noteApi
      .getById(id)
      .then((res) => setNote(res.data.data))
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  if (loading) return <LoadingSpinner />;
  if (!note) return null;

  const fullFileUrl = note.fileUrl?.startsWith('http') ? note.fileUrl : `${baseUrl}${note.fileUrl}`;

  return (
    <div className="mx-auto max-w-6xl">
      <button
        onClick={() => navigate(-1)}
        className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition-colors hover:border-indigo-400/40 hover:text-white"
      >
        <FiArrowLeft size={16} />
        Back
      </button>

      <section className="relative mb-10 overflow-hidden rounded-[32px] border border-white/10 bg-[#09111f] px-8 py-8 shadow-[0_32px_80px_rgba(2,6,23,0.45)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.16),transparent_58%),radial-gradient(circle_at_top_right,rgba(59,130,246,0.12),transparent_52%)]" />

        <div className="relative flex flex-col gap-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-3xl font-black tracking-tight text-white sm:text-4xl">{note.title}</h1>
              <p className="mt-2 text-lg text-slate-400">{note.subject} • {note.moduleCode}</p>
              {note.description && (
                <p className="mt-7 max-w-2xl text-base leading-8 text-slate-300">{note.description}</p>
              )}
            </div>
            <div className="flex items-center gap-3 self-start">
              <Badge status={note.status} />
              <Badge status={note.visibility} />
            </div>
          </div>

          {note.tags?.length > 0 && (
            <div className="flex flex-wrap gap-3">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-200"
                >
                  <FiTag size={12} className="text-indigo-300" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <span className="inline-flex items-center gap-2">
              <FiClock size={14} className="text-indigo-300" />
              {formatDate(note.createdAt)}
            </span>
            <span className="inline-flex items-center gap-2">
              <FiEye size={14} className="text-cyan-300" />
              {note.viewCount} views
            </span>
          </div>

          {note.fileUrl && (
            <div className="rounded-[28px] border border-white/10 bg-[#070d18]/95 p-5 shadow-[0_24px_60px_rgba(2,6,23,0.3)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                <div className="flex min-w-0 flex-1 items-center gap-4">
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-100">
                    <FiFile size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xl font-bold text-white">{note.fileName || 'Attached File'}</p>
                    <p className="mt-1 text-sm text-slate-400">{note.fileType}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setPreviewOpen(true)}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white transition-colors hover:border-cyan-400/40 hover:bg-cyan-400/10"
                  >
                    <FiEye size={14} /> Preview
                  </button>
                  <a
                    href={fullFileUrl}
                    download={note.fileName}
                    className="inline-flex items-center gap-2 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 px-5 py-3 text-sm font-semibold text-indigo-100 transition-colors hover:bg-indigo-500/20"
                  >
                    <FiDownload size={14} /> Download
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

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
