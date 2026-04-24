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

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

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
    <div className="mx-auto max-w-7xl">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-white">
          <FiBookOpen className="text-lms-secondary" />
          My Notes
        </h1>
        <p className="mt-2 text-base text-slate-400">Manage your Uploaded Notes</p>
      </div>

      {editNote && (
        <div className="mb-6 rounded-[30px] border border-white/6 bg-[#2a2238] p-6 shadow-[0_24px_70px_rgba(9,10,24,0.28)]">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-white font-semibold">Edit & Resubmit Note</h2>
            <button onClick={() => setEditNote(null)} className="text-sm text-slate-400 hover:text-white">
              Cancel
            </button>
          </div>
          <NoteForm
            onSubmit={handleUpdate}
            defaultValues={editNote}
            isLoading={submitting}
            submitLabel="Resubmit for Review"
          />
        </div>
      )}

      <div className="mb-7 flex flex-wrap gap-2">
        {statusTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`rounded-2xl px-4 py-2 text-sm font-medium capitalize transition-all ${
              statusFilter === tab
                ? 'bg-[linear-gradient(135deg,#6d63ff,#5b7cff)] text-white shadow-[0_12px_24px_rgba(93,99,255,0.2)]'
                : 'border border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : notes.length === 0 ? (
        <div className="rounded-[28px] border border-white/6 bg-[linear-gradient(180deg,rgba(11,17,32,0.96),rgba(11,17,32,0.86))] px-6 py-20 text-center shadow-[0_24px_70px_rgba(2,8,23,0.28)]">
          <FiBookOpen className="mx-auto mb-3 text-slate-600" size={36} />
          <p className="text-lg font-semibold text-white">No notes found</p>
          <p className="mt-2 text-sm text-slate-400">
            {statusFilter !== 'all' ? `No ${statusFilter} notes` : 'Upload your first note!'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {notes.map((note) => (
            <NoteCard
              key={note._id}
              note={note}
              onEdit={
                note.status !== 'approved'
                  ? (n) => {
                      setEditNote(n);
                      window.scrollTo(0, 0);
                    }
                  : undefined
              }
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
