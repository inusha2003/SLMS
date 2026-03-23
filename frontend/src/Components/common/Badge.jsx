const Badge = ({ status }) => {
  const variants = {
    pending: 'badge-pending',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    public: 'px-2 py-1 text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-700/50 rounded-full',
    private: 'px-2 py-1 text-xs font-medium bg-gray-800/50 text-gray-300 border border-gray-600/50 rounded-full',
  };

  return (
    <span className={variants[status] || variants.pending}>
      {status?.charAt(0).toUpperCase() + status?.slice(1)}
    </span>
  );
};

export default Badge;