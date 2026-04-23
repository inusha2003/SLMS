import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { FiSend, FiX } from 'react-icons/fi';

const schema = yup.object({
  content: yup.string().required('Comment cannot be empty').max(2000, 'Max 2000 characters'),
});

const CommentForm = ({
  onSubmit,
  isLoading,
  onCancel,
  placeholder = 'Write a comment...',
  submitLabel = 'Post Comment',
}) => {
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
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div className="overflow-hidden rounded-[26px] border border-white/10 bg-[#070d18] shadow-[0_20px_45px_rgba(2,6,23,0.28)]">
        <textarea
          {...register('content')}
          rows={4}
          placeholder={placeholder}
          className="min-h-[160px] w-full resize-none border-0 bg-transparent px-6 py-5 text-base leading-8 text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-4">
          <div className="text-sm text-slate-500">
            Share a thoughtful comment, question, or reply.
          </div>
          <div className="flex items-center gap-3">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-white/20 hover:text-white"
              >
                <FiX size={14} />
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-2xl border border-indigo-500/40 bg-indigo-500/10 px-5 py-2.5 text-sm font-semibold text-indigo-100 transition-colors hover:bg-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <div className="h-4 w-4 rounded-full border border-white/30 border-t-white animate-spin" />
              ) : (
                <FiSend size={14} />
              )}
              {submitLabel}
            </button>
          </div>
        </div>
      </div>
      {errors.content && <p className="px-1 text-sm text-rose-400">{errors.content.message}</p>}
    </form>
  );
};

export default CommentForm;
