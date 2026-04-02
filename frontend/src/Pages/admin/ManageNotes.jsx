import { useState, useEffect, useCallback } from 'react';
import { noteApi } from '../../api/noteApi';
import NoteCard from '../../components/notes/NoteCard';
import NoteForm from '../../components/notes/NoteForm';
import NoteFilter from '../../components/notes/NoteFilter';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ConfirmModal from '../../components/common/ConfirmModal';
import Pagination from '../../components/common/Pagination';
import { FiPlus, FiX } from 'react-icons/fi';
import toast from 'react-hot-toast';

const ManageNotes = () => {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editNote, setEditNote] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({});

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await noteApi.getAll({ ...filters, page });
      setNotes(res.data.data.notes || []);
      setTotalPages(res.data.data.pages || 1);
    } catch {
      toast.error('Failed to load notes');
    } finally {
      setLoading(false);
    }
  }, [filters, page]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleCreate = async (formData) => {
    try {
      setSubmitting(true);
      await noteApi.create(formData);
      toast.success('Note created successfully!');
      setShowForm(false);
      fetchNotes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create note');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (formData) => {
    try {
      setSubmitting(true);
      await noteApi.update(editNote._id, formData);
      toast.success('Note updated successfully!');
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
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Notes</h1>
          <p className="text-slate-400 text-sm">Create, update, and manage learning resources</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditNote(null); }}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? <FiX size={16} /> : <FiPlus size={16} />}
          {showForm ? 'Cancel' : 'New Note'}
        </button>
      </div>

      {(showForm || editNote) && (
        <div className="card mb-6">
          <h2 className="text-white font-semibold mb-4">{editNote ? 'Edit Note' : 'Create New Note'}</h2>
          <NoteForm
            onSubmit={editNote ? handleUpdate : handleCreate}
            defaultValues={editNote || {}}
            isLoading={submitting}
            submitLabel={editNote ? 'Update Note' : 'Create Note'}
          />
        </div>
      )}

      <NoteFilter onFilter={(f) => { setFilters(f); setPage(1); }} showStatus />

      {loading ? (
        <LoadingSpinner />
      ) : notes.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-slate-400">No notes found. Create the first one!</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {notes.map((note) => (
              <NoteCard
                key={note._id}
                note={note}
                onEdit={(n) => { setEditNote(n); setShowForm(false); window.scrollTo(0, 0); }}
                onDelete={(n) => setDeleteTarget(n)}
              />
            ))}
          </div>
          <Pagination page={page} pages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete Note"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        confirmText="Delete"
      />
    </div>
  );
};

export default ManageNotes;