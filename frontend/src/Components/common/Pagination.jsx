import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

const Pagination = ({ page, pages, onPageChange }) => {
  if (pages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 mt-6">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg bg-lms-dark border border-lms-primary/30
                   text-slate-300 hover:bg-lms-primary hover:text-white
                   disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <FiChevronLeft />
      </button>

      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPageChange(p)}
          className={`w-9 h-9 rounded-lg text-sm font-medium transition-all
            ${p === page
              ? 'bg-lms-secondary text-white shadow-lg'
              : 'bg-lms-dark border border-lms-primary/30 text-slate-300 hover:bg-lms-primary hover:text-white'
            }`}
        >
          {p}
        </button>
      ))}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className="p-2 rounded-lg bg-lms-dark border border-lms-primary/30
                   text-slate-300 hover:bg-lms-primary hover:text-white
                   disabled:opacity-40 disabled:cursor-not-allowed transition-all"
      >
        <FiChevronRight />
      </button>
    </div>
  );
};

export default Pagination;