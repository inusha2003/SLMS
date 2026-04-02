import { FiX, FiDownload, FiFile } from 'react-icons/fi';

const FilePreviewModal = ({ isOpen, fileUrl, fileName, fileType, onClose }) => {
  if (!isOpen) return null;

  const baseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const fullUrl = fileUrl?.startsWith('http') ? fileUrl : `${baseUrl}${fileUrl}`;

  const isImage = fileType?.startsWith('image/');
  const isPDF = fileType === 'application/pdf';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-lms-dark border border-lms-primary/50 rounded-xl w-full max-w-4xl mx-4 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-lms-primary/30">
          <div className="flex items-center gap-2">
            <FiFile className="text-lms-secondary" />
            <span className="text-white font-medium text-sm truncate max-w-xs">{fileName}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={fullUrl}
              download={fileName}
              target="_blank"
              rel="noreferrer"
              className="btn-primary flex items-center gap-1 text-xs"
            >
              <FiDownload size={14} /> Download
            </a>
            <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
              <FiX size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[400px]">
          {isImage && (
            <img src={fullUrl} alt={fileName} className="max-w-full max-h-full object-contain rounded" />
          )}
          {isPDF && (
            <iframe src={fullUrl} className="w-full h-[600px] rounded border border-lms-primary/30" title={fileName} />
          )}
          {!isImage && !isPDF && (
            <div className="text-center">
              <FiFile className="mx-auto text-lms-secondary mb-3" size={48} />
              <p className="text-slate-300 mb-2">{fileName}</p>
              <p className="text-slate-500 text-sm mb-4">Preview not available for this file type</p>
              <a href={fullUrl} download={fileName} className="btn-primary">
                <FiDownload className="inline mr-1" /> Download to View
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilePreviewModal;