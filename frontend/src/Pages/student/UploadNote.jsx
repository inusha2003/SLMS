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
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="rounded-[28px] border border-emerald-500/20 bg-[linear-gradient(180deg,rgba(16,44,36,0.92),rgba(11,24,25,0.92))] px-10 py-12 text-center shadow-[0_24px_70px_rgba(3,12,10,0.28)]">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-green-700/40 bg-green-900/30">
            <FiCheckCircle className="text-green-400" size={32} />
          </div>
          <h2 className="mb-2 text-xl font-bold text-white">Note Submitted!</h2>
          <p className="text-sm text-slate-400">Your note is pending admin approval. Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-white">
          <FiUpload className="text-violet-400" />
          Upload Note
        </h1>
        <p className="mt-2 text-base text-slate-400">
          Share your study materials. All submissions require admin approval.
        </p>
      </div>

      <div className="rounded-[30px] border border-white/6 bg-[#2a2238] px-6 py-7 shadow-[0_24px_70px_rgba(9,10,24,0.28)] md:px-8">
        <div className="mb-7 flex items-center gap-2 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-4">
          <span className="text-sm text-amber-300">
            Your note will be reviewed by an admin before it becomes visible to others.
          </span>
        </div>
        <NoteForm onSubmit={handleSubmit} isLoading={loading} submitLabel="Submit for Review" />
      </div>
    </div>
  );
};

export default UploadNote;
