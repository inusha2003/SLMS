import { useState } from 'react';
import { FiSearch, FiFilter, FiX } from 'react-icons/fi';
import useDebounce from '../../hooks/useDebounce';
import { useEffect } from 'react';

const NoteFilter = ({ onFilter, showStatus = false }) => {
  const [search, setSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [status, setStatus] = useState('');
  const [moduleCode, setModuleCode] = useState('');
  const debouncedSearch = useDebounce(search);

  useEffect(() => {
    onFilter({ search: debouncedSearch, subject, status, moduleCode });
  }, [debouncedSearch, subject, status, moduleCode]);

  const clearFilters = () => {
    setSearch('');
    setSubject('');
    setStatus('');
    setModuleCode('');
  };

  const hasFilters = search || subject || status || moduleCode;

  return (
    <div className="card mb-6">
      <div className="flex items-center gap-2 mb-4">
        <FiFilter className="text-lms-secondary" />
        <span className="text-white font-medium text-sm">Search & Filter</span>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <FiX size={12} /> Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-9"
            placeholder="Search notes..."
          />
        </div>

        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="input-field"
          placeholder="Filter by subject..."
        />

        <input
          value={moduleCode}
          onChange={(e) => setModuleCode(e.target.value)}
          className="input-field"
          placeholder="Filter by module code..."
        />

        {showStatus && (
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="input-field">
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        )}
      </div>
    </div>
  );
};

export default NoteFilter;