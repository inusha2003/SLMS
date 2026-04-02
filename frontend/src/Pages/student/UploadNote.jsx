import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { noteApi } from '../../api/noteApi';
import NoteForm from '../../components/notes/NoteForm';
import { FiUpload, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';

const UploadNote = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setLoading(true);
      await noteApi.create(formData);
      setSuccess(true);
      toast.success('Note submitted for review!');
      setTimeout(() => navigate('/student/my-notes'), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload note');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-700/40">
            <FiCheckCircle className="text-green-400" size={32} />
          </div>
          <h2 className="text-white font-bold text-xl mb-2">Note Submitted!</h2>
          <p className="text-slate-400 text-sm">Your note is pending admin approval. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <FiUpload className="text-lms-secondary" />
          Upload Note
        </h1>
        <p className="text-slate-400 text-sm">Share your study materials. All submissions require admin approval.</p>
      </div>

      <div className="card">
        <div className="flex items-center gap-2 p-3 bg-yellow-900/20 border border-yellow-700/30 rounded-lg mb-6">
          <span className="text-yellow-400 text-xs">⚠️ Your note will be reviewed by an admin before it becomes visible to others.</span>
        </div>
        <NoteForm onSubmit={handleSubmit} isLoading={loading} submitLabel="Submit for Review" />
      </div>
    </div>
  );
};

export default UploadNote;