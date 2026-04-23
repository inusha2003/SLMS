import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import { FiUpload, FiX, FiEye } from 'react-icons/fi';
import FilePreviewModal from '../common/FilePreviewModal';

const schema = yup.object({
  title: yup.string().required('Title is required').max(200, 'Max 200 characters'),
  subject: yup.string().required('Subject is required'),
  moduleCode: yup.string().required('Module code is required').uppercase(),
  description: yup.string().max(1000, 'Max 1000 characters'),
  tags: yup.string(),
  visibility: yup.string().oneOf(['public', 'private']).required(),
});

const inputClassName =
  'w-full rounded-2xl border border-violet-400/20 bg-[#1d1828] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-violet-400/45 focus:ring-2 focus:ring-violet-500/10';

const NoteForm = ({ onSubmit, defaultValues = {}, isLoading, submitLabel = 'Submit' }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      visibility: 'public',
      ...defaultValues,
    },
  });

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleFormSubmit = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== '') {
        formData.append(key, data[key]);
      }
    });
    if (selectedFile) formData.append('file', selectedFile);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">Title *</label>
          <input {...register('title')} className={inputClassName} placeholder="Note title" />
          {errors.title && <p className="error-text">{errors.title.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">Subject *</label>
          <input {...register('subject')} className={inputClassName} placeholder="e.g. Mathematics" />
          {errors.subject && <p className="error-text">{errors.subject.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">Module Code *</label>
          <input {...register('moduleCode')} className={inputClassName} placeholder="e.g. CS101" />
          {errors.moduleCode && <p className="error-text">{errors.moduleCode.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">Visibility</label>
          <select {...register('visibility')} className={inputClassName}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">Description</label>
        <textarea
          {...register('description')}
          className={`${inputClassName} resize-none`}
          rows={4}
          placeholder="Brief description of the note content..."
        />
        {errors.description && <p className="error-text">{errors.description.message}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">Tags (comma separated)</label>
        <input {...register('tags')} className={inputClassName} placeholder="e.g. algebra, calculus, exam" />
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">File Upload (PDF, DOCX, PPT, Images)</label>
        <div className="rounded-[24px] border-2 border-dashed border-violet-400/18 bg-[#1a1524] p-8 text-center transition-colors hover:border-violet-400/35">
          <input
            type="file"
            id="file-upload"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <FiUpload className="mx-auto mb-3 text-violet-400" size={30} />
            <p className="text-sm text-slate-300">
              {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
            </p>
            <p className="mt-1 text-xs text-slate-500">PDF, DOCX, PPT, PNG, JPG (max 20MB)</p>
          </label>
        </div>

        {selectedFile && (
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-1 text-sm text-violet-300 transition-colors hover:text-white"
            >
              <FiEye size={14} /> Preview
            </button>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="flex items-center gap-1 text-sm text-red-400 transition-colors hover:text-red-300"
            >
              <FiX size={14} /> Remove
            </button>
          </div>
        )}
      </div>

      {selectedFile && (
        <FilePreviewModal
          isOpen={previewOpen}
          fileUrl={URL.createObjectURL(selectedFile)}
          fileName={selectedFile.name}
          fileType={selectedFile.type}
          onClose={() => setPreviewOpen(false)}
        />
      )}

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#6d63ff,#5b7cff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(93,99,255,0.22)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : null}
          {isLoading ? 'Submitting...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            reset();
            setSelectedFile(null);
          }}
          className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.05] hover:text-white"
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default NoteForm;
