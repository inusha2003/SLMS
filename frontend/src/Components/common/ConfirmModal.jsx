import { FiAlertTriangle, FiX } from 'react-icons/fi';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', danger = true }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-lms-dark border border-lms-primary/50 rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <FiX size={20} />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className={`p-2 rounded-lg ${danger ? 'bg-red-900/50' : 'bg-lms-primary/50'}`}>
            <FiAlertTriangle className={danger ? 'text-red-400' : 'text-lms-secondary'} size={24} />
          </div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>

        <p className="text-slate-300 text-sm mb-6 leading-relaxed">{message}</p>

        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-secondary">
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={danger ? 'btn-danger' : 'btn-primary'}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;