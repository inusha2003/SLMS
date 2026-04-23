import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { noteApi } from '../../api/noteApi';
import NoteFilter from '../../components/notes/NoteFilter';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import FilePreviewModal from '../../components/common/FilePreviewModal';
import Badge from '../../components/common/Badge';
import { FiSearch, FiEye, FiTag, FiClock } from 'react-icons/fi';
import { timeAgo } from '../../utils/formatDate';
import toast from 'react-hot-toast';

const BrowseNotes = () => {
  const navigate = useNavigate();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [preview, setPreview] = useState(null);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await noteApi.getAll({ ...filters, status: 'approved', page });
      setNotes(res.data.data.notes || []);
      setTotalPages(res.data.data.pages || 1);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-white">
          <FiSearch className="text-lms-secondary" />
          Browse Notes
        </h1>
        <p className="mt-2 text-base text-slate-400">Explore approved learning resources</p>
      </div>

      <NoteFilter
        onFilter={(nextFilters) => {
          setFilters(nextFilters);
          setPage(1);
        }}
      />

      {loading ? (
        <LoadingSpinner />
      ) : notes.length === 0 ? (
        <div className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(11,17,32,0.96),rgba(11,17,32,0.86))] px-6 py-20 text-center shadow-[0_24px_70px_rgba(2,8,23,0.28)]">
          <FiSearch className="mx-auto mb-4 text-slate-600" size={36} />
          <p className="text-lg font-semibold text-white">No notes found</p>
          <p className="mt-2 text-sm text-slate-400">Try different search terms or filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {notes.map((note) => (
              <div
                key={note._id}
                className="group overflow-hidden rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(11,17,32,0.96),rgba(11,17,32,0.86))] p-6 shadow-[0_24px_70px_rgba(2,8,23,0.28)] transition-all duration-300 hover:border-cyan-400/20 hover:shadow-[0_28px_78px_rgba(8,22,48,0.42)]"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold text-white transition-colors group-hover:text-lms-secondary">
                      {note.title}
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      {note.subject} • {note.moduleCode}
                    </p>
                  </div>
                  <Badge status={note.visibility} />
                </div>

                {note.description && (
                  <p className="mb-4 line-clamp-2 text-sm leading-7 text-slate-400">
                    {note.description}
                  </p>
                )}

                {note.tags?.length > 0 && (
                  <div className="mb-5 flex flex-wrap gap-2">
                    {note.tags.slice(0, 4).map((tag) => (
                      <span
                        key={tag}
                        className="flex items-center gap-1 rounded-full border border-white/6 bg-white/[0.03] px-2.5 py-1 text-xs text-slate-400"
                      >
                        <FiTag size={9} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-white/8 pt-4">
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <FiClock size={11} />
                    {timeAgo(note.createdAt)}
                  </div>
                  <div className="flex items-center gap-3">
                    {note.fileUrl && (
                      <button
                        onClick={() => setPreview(note)}
                        className="flex items-center gap-1 text-sm text-lms-secondary transition-colors hover:text-white"
                      >
                        <FiEye size={12} />
                        Preview
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/student/notes/${note._id}`)}
                      className="rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-cyan-100 transition-all hover:border-cyan-300/40 hover:bg-cyan-400/16"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={page} pages={totalPages} onPageChange={setPage} />
        </>
      )}

      <FilePreviewModal
        isOpen={!!preview}
        fileUrl={preview?.fileUrl}
        fileName={preview?.fileName}
        fileType={preview?.fileType}
        onClose={() => setPreview(null)}
      />
    </div>
  );
};

export default BrowseNotes;
