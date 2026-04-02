import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useState } from 'react';
import { FiUpload, FiX } from 'react-icons/fi';

const schema = yup.object({
  title: yup.string().required('Question title is required').max(300, 'Max 300 characters'),
  body: yup.string().required('Question details are required'),
  subject: yup.string().required('Subject is required'),
  tags: yup.string(),
});

const QuestionForm = ({ onSubmit, isLoading, onCancel }) => {
  const [file, setFile] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: yupResolver(schema) });

  const handleFormSubmit = (data) => {
    const formData = new FormData();
    Object.keys(data).forEach((key) => {
      if (data[key]) formData.append(key, data[key]);
    });
    if (file) formData.append('file', file);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label className="form-label">Question Title *</label>
        <input
          {...register('title')}
          className="input-field"
          placeholder="Be specific and clear about your question..."
        />
        {errors.title && <p className="error-text">{errors.title.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="form-label">Subject *</label>
          <input {...register('subject')} className="input-field" placeholder="e.g. Data Structures" />
          {errors.subject && <p className="error-text">{errors.subject.message}</p>}
        </div>
        <div>
          <label className="form-label">Tags (comma separated)</label>
          <input {...register('tags')} className="input-field" placeholder="e.g. arrays, recursion" />
        </div>
      </div>

      <div>
        <label className="form-label">Question Details *</label>
        <textarea
          {...register('body')}
          className="input-field resize-none"
          rows={5}
          placeholder="Provide all the necessary details, context, and what you've tried..."
        />
        {errors.body && <p className="error-text">{errors.body.message}</p>}
      </div>

      <div>
        <label className="form-label">Attach Supporting File (Optional)</label>
        <div className="flex items-center gap-3">
          <input
            type="file"
            id="qa-file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            onChange={(e) => setFile(e.target.files[0])}
            className="hidden"
          />
          <label
            htmlFor="qa-file"
            className="flex items-center gap-2 px-4 py-2 bg-lms-darkest border border-lms-primary/50
                       rounded-lg text-slate-300 text-sm cursor-pointer hover:border-lms-secondary/70 transition-colors"
          >
            <FiUpload size={14} />
            {file ? file.name : 'Choose file'}
          </label>
          {file && (
            <button type="button" onClick={() => setFile(null)} className="text-red-400 hover:text-red-300">
              <FiX size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
          {isLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {isLoading ? 'Posting...' : 'Post Question'}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
};

export default QuestionForm;