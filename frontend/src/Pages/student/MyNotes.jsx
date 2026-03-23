import { useState, useEffect, useCallback } from 'react';
import { noteApi } from '../../api/noteApi';
import NoteCard from '../../components/notes/NoteCard';
import NoteForm from '../../components/notes/NoteForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import { FiBookOpen } from 'react-icons/fi';
import toast from 'react-hot-toast';

const statusTabs = ['all', 'pending', 'approved', 'rejected'];

const MyNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editNote, setEditNote] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const params = statusFilter !== 'all' ? { status: statusFilter } : {};
      const res = await noteApi.getMine(params);
      setNotes(res.data.data || []);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleUpdate = async (formData) => {
    try {
      setSubmitting(true);
      await noteApi.update(editNote._id, formData);
      toast.success('Note updated and resubmitted for review!');
      setEditNote(null);
      fetchNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      await noteApi.delete(deleteTarget._id);
      toast.success('Note deleted');
      setDeleteTarget(null);
      fetchNotes();
    } catch {
      toast.error('Failed to delete note');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiBookOpen className="text-lms-secondary" />
          My Notes
        </h1>
        <p className="text-slate-400 text-sm">Manage your uploaded notes</p>
      </div>

      {editNote && (
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold">Edit & Resubmit Note</h2>
            <button onClick={() => setEditNote(null)} className="text-slate-400 hover:text-white text-sm">Cancel</button>
          </div>
          <NoteForm
            onSubmit={handleUpdate}
            defaultValues={editNote}
            isLoading={submitting}
            submitLabel="Resubmit for Review"
          />
        </div>
      )}

      {/* Status Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-all ${
              statusFilter === tab
                ? 'bg-lms-secondary text-white'
                : 'bg-lms-dark border border-lms-primary/30 text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : notes.length === 0 ? (
        <div className="card text-center py-16">
          <FiBookOpen className="mx-auto text-slate-600 mb-3" size={36} />
          <p className="text-white font-medium">No notes found</p>
          <p className="text-slate-400 text-sm mt-1">
            {statusFilter !== 'all' ? `No ${statusFilter} notes` : 'Upload your first note!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {notes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onEdit={note.status !== 'approved' ? (n) => { setEditNote(n); window.scrollTo(0, 0); } : undefined}
              onDelete={(n) => setDeleteTarget(n)}
            />
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Note"
        message={`Delete "${deleteTarget?.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
      />
    </div>
  );
};

export default MyNotes;