import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { noteApi } from '../../api/noteApi';
import NoteFilter from '../../components/notes/NoteFilter';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import FilePreviewModal from '../../components/common/FilePreviewModal';
import Badge from '../../components/common/Badge';
import { FiSearch, FiEye, FiDownload, FiTag, FiClock } from 'react-icons/fi';
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
  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

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

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiSearch className="text-lms-secondary" />
          Browse Notes
        </h1>
        <p className="text-slate-400 text-sm">Explore approved learning resources</p>
      </div>

      <NoteFilter onFilter={(f) => { setFilters(f); setPage(1); }} />

      {loading ? (
        <LoadingSpinner />
      ) : notes.length === 0 ? (
        <div className="card text-center py-16">
          <FiSearch className="mx-auto text-slate-600 mb-3" size={36} />
          <p className="text-white font-medium">No notes found</p>
          <p className="text-slate-400 text-sm">Try different search terms</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {notes.map((note) => (
              <div key={note._id} className="card-hover group">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <h3 className="text-white font-semibold text-sm group-hover:text-lms-secondary transition-colors">
                      {note.title}
                    </h3>
                    <p className="text-slate-500 text-xs mt-0.5">{note.subject} • {note.moduleCode}</p>
                  </div>
                  <Badge status={note.visibility} />
                </div>

                {note.description && (
                  <p className="text-slate-400 text-xs mb-3 line-clamp-2">{note.description}</p>
                )}

                {note.tags?.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {note.tags.slice(0, 4).map((tag) => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-lms-primary/20 text-slate-400 rounded-full text-xs">
                        <FiTag size={9} />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-3 border-t border-lms-primary/20">
                  <div className="flex items-center gap-1 text-slate-500 text-xs">
                    <FiClock size={11} />
                    {timeAgo(note.createdAt)}
                  </div>
                  <div className="flex items-center gap-2">
                    {note.fileUrl && (
                      <button
                        onClick={() => setPreview(note)}
                        className="flex items-center gap-1 text-xs text-lms-secondary hover:text-white transition-colors"
                      >
                        <FiEye size={12} /> Preview
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/notes/${note._id}`)}
                      className="btn-primary text-xs py-1.5 px-3"
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