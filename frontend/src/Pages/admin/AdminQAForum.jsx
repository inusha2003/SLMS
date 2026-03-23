import { useState, useEffect, useCallback } from 'react';
import { qaApi } from '../../api/qaApi';
import QuestionCard from '../../Components/qa/QuestionCard';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import { FiSearch, FiTrash2 } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AdminQAForum = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await qaApi.getQuestions({ search, page });
      setQuestions(res.data.data.questions || []);
      setTotalPages(res.data.data.pages || 1);
    } catch {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Delete this question?')) return;
    try {
      await qaApi.deleteQuestion(id);
      toast.success('Question deleted');
      fetchQuestions();
    } catch {
      toast.error('Failed to delete');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Q&A Forum Moderation</h1>
        <p className="text-slate-400 text-sm">Manage all questions and answers</p>
      </div>

      <div className="relative mb-6">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field pl-9"
          placeholder="Search questions..."
        />
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          <div className="space-y-4">
            {questions.map((q) => (
              <div key={q._id} className="relative group">
                <QuestionCard question={q} />
                <button
                  onClick={(e) => handleDelete(q._id, e)}
                  className="absolute top-3 right-3 p-1.5 bg-red-900/50 text-red-400 rounded-lg
                             opacity-0 group-hover:opacity-100 transition-opacity border border-red-700/30"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
            ))}
          </div>
          {questions.length === 0 && (
            <div className="card text-center py-12">
              <p className="text-slate-400">No questions found</p>
            </div>
          )}
          <Pagination page={page} pages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default AdminQAForum;