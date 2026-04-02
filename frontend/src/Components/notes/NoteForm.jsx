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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="form-label">Title *</label>
          <input {...register('title')} className="input-field" placeholder="Note title" />
          {errors.title && <p className="error-text">{errors.title.message}</p>}
        </div>

        <div>
          <label className="form-label">Subject *</label>
          <input {...register('subject')} className="input-field" placeholder="e.g. Mathematics" />
          {errors.subject && <p className="error-text">{errors.subject.message}</p>}
        </div>

        <div>
          <label className="form-label">Module Code *</label>
          <input {...register('moduleCode')} className="input-field" placeholder="e.g. CS101" />
          {errors.moduleCode && <p className="error-text">{errors.moduleCode.message}</p>}
        </div>

        <div>
          <label className="form-label">Visibility</label>
          <select {...register('visibility')} className="input-field">
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>

      <div>
        <label className="form-label">Description</label>
        <textarea
          {...register('description')}
          className="input-field resize-none"
          rows={3}
          placeholder="Brief description of the note content..."
        />
        {errors.description && <p className="error-text">{errors.description.message}</p>}
      </div>

      <div>
        <label className="form-label">Tags (comma separated)</label>
        <input {...register('tags')} className="input-field" placeholder="e.g. algebra, calculus, exam" />
      </div>

      <div>
        <label className="form-label">File Upload (PDF, DOCX, PPT, Images)</label>
        <div className="border-2 border-dashed border-lms-primary/50 rounded-lg p-6 text-center hover:border-lms-secondary/70 transition-colors">
          <input
            type="file"
            id="file-upload"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.webp"
            onChange={handleFileChange}
            className="hidden"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            <FiUpload className="mx-auto mb-2 text-lms-secondary" size={28} />
            <p className="text-slate-300 text-sm">
              {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
            </p>
            <p className="text-slate-500 text-xs mt-1">PDF, DOCX, PPT, PNG, JPG (max 20MB)</p>
          </label>
        </div>

        {selectedFile && (
          <div className="flex items-center gap-2 mt-2">
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="flex items-center gap-1 text-xs text-lms-secondary hover:text-white transition-colors"
            >
              <FiEye size={14} /> Preview
            </button>
            <button
              type="button"
              onClick={() => setSelectedFile(null)}
              className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
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

      <div className="flex gap-3">
        <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-2">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : null}
          {isLoading ? 'Submitting...' : submitLabel}
        </button>
        <button
          type="button"
          onClick={() => { reset(); setSelectedFile(null); }}
          className="btn-secondary"
        >
          Reset
        </button>
      </div>
    </form>
  );
};

export default NoteForm;