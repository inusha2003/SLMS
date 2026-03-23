import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FiSend, FiX } from 'react-icons/fi';

const schema = yup.object({
  content: yup.string().required('Comment cannot be empty').max(2000, 'Max 2000 characters'),
});

const CommentForm = ({ onSubmit, isLoading, onCancel, placeholder = 'Write a comment...', submitLabel = 'Post Comment' }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ resolver: yupResolver(schema) });

  const handleFormSubmit = (data) => {
    onSubmit(data);
    reset();
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-2">
      <textarea
        {...register('content')}
        className="input-field resize-none"
        rows={3}
        placeholder={placeholder}
      />
      {errors.content && <p className="error-text">{errors.content.message}</p>}

      <div className="flex gap-2 justify-end">
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary flex items-center gap-1 text-xs">
            <FiX size={13} /> Cancel
          </button>
        )}
        <button type="submit" disabled={isLoading} className="btn-primary flex items-center gap-1 text-xs">
          {isLoading ? (
            <div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <FiSend size={13} />
          )}
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;