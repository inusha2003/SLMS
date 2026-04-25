import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FiUpload, FiX } from 'react-icons/fi';

const schema = yup.object({
  title: yup.string().required('Question title is required').max(300, 'Max 300 characters'),
  body: yup.string().required('Question details are required'),
  subject: yup.string().required('Subject is required'),
  tags: yup.string(),
});

const inputClassName =
  'w-full rounded-2xl border border-violet-400/20 bg-[#1d1828] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-violet-400/45 focus:ring-2 focus:ring-violet-500/10';

const QuestionForm = ({ onSubmit, isLoading, onCancel, resetKey = 0 }) => {
  const [file, setFile] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  useEffect(() => {
    reset({
      title: '',
      subject: '',
      tags: '',
      body: '',
    });
    setFile(null);
  }, [reset, resetKey]);

  const handleFormSubmit = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key]) formData.append(key, data[key]);
    });
    if (file) formData.append('file', file);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">Question Title *</label>
        <input
          {...register('title')}
          className={inputClassName}
          placeholder="Be specific and clear about your question..."
        />
        {errors.title && <p className="error-text">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">Subject *</label>
          <input
            {...register('subject')}
            className={inputClassName}
            placeholder="e.g. Data Structures"
          />
          {errors.subject && <p className="error-text">{errors.subject.message}</p>}
        </div>
        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-200">Tags (comma separated)</label>
          <input
            {...register('tags')}
            className={inputClassName}
            placeholder="e.g. arrays, recursion"
          />
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">Question Details *</label>
        <textarea
          {...register('body')}
          className={`${inputClassName} resize-none`}
          rows={6}
          placeholder="Provide all the necessary details, context, and what you've tried..."
        />
        {errors.body && <p className="error-text">{errors.body.message}</p>}
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-slate-200">Attach Supporting File (Optional)</label>
        <div className="rounded-[24px] border-2 border-dashed border-violet-400/18 bg-[#1a1524] p-8 text-center transition-colors hover:border-violet-400/35">
          <input
            type="file"
            id="qa-file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
          />
          <label htmlFor="qa-file" className="cursor-pointer">
            <FiUpload className="mx-auto mb-3 text-violet-400" size={30} />
            <p className="text-sm text-slate-300">{file ? file.name : 'Click to upload supporting file'}</p>
            <p className="mt-1 text-xs text-slate-500">PDF, DOCX, PNG, JPG (optional)</p>
          </label>
        </div>

        {file && (
          <div className="mt-3 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFile(null)}
              className="flex items-center gap-1 text-sm text-red-400 transition-colors hover:text-red-300"
            >
              <FiX size={14} /> Remove
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#6d63ff,#5b7cff)] px-5 py-3 text-sm font-semibold text-white shadow-[0_14px_28px_rgba(93,99,255,0.22)] transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isLoading ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          ) : null}
          {isLoading ? 'Posting...' : 'Post Question'}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={() => {
              reset({
                title: '',
                subject: '',
                tags: '',
                body: '',
              });
              setFile(null);
              onCancel();
            }}
            className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.05] hover:text-white"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default QuestionForm;
