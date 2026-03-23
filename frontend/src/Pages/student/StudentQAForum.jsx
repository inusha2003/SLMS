import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams, Routes, Route, useLocation } from 'react-router-dom';
import { qaApi } from '../../api/qaApi';
import QuestionCard from '../../Components/qa/QuestionCard';
import QuestionForm from '../../Components/qa/QuestionForm';
import AnswerItem from '../../Components/qa/AnswerItem';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import CommentForm from '../../components/comments/CommentForm';
import { FiPlus, FiX, FiSearch, FiArrowLeft, FiArrowUp, FiTag } from 'react-icons/fi';
import { timeAgo } from '../../utils/formatDate';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// Question Detail View
const QuestionDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [reportId, setReportId] = useState(null);
  const [reportReason, setReportReason] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await qaApi.getQuestion(id);
      setData(res.data.data);
    } catch {
      toast.error('Question not found');
      navigate('/student/qa-forum');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleAnswer = async () => {
    if (!answerText.trim()) return;
    try {
      setAnswerLoading(true);
      await qaApi.createAnswer(id, { body: answerText });
      setAnswerText('');
      toast.success('Answer posted!');
      fetchData();
    } catch {
      toast.error('Failed to post answer');
    } finally {
      setAnswerLoading(false);
    }
  };

  const handleUpvoteQuestion = async () => {
    try {
      await qaApi.upvoteQuestion(id);
      fetchData();
    } catch {
      toast.error('Failed to upvote');
    }
  };

  const handleUpvoteAnswer = async (answerId) => {
    try {
      await qaApi.upvoteAnswer(answerId);
      fetchData();
    } catch {
      toast.error('Failed to upvote');
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      await qaApi.acceptAnswer(id, answerId);
      toast.success('Answer marked as accepted!');
      fetchData();
    } catch {
      toast.error('Failed to accept answer');
    }
  };

  const handleEditAnswer = async (answerId, body) => {
    try {
      await qaApi.updateAnswer(answerId, { body });
      toast.success('Answer updated');
      fetchData();
    } catch {
      toast.error('Failed to update answer');
    }
  };

  const handleDeleteAnswer = async (answerId) => {
    if (!confirm('Delete this answer?')) return;
    try {
      await qaApi.deleteAnswer(answerId);
      toast.success('Answer deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete answer');
    }
  };

  const handleReport = async (answerId) => {
    setReportId(answerId);
  };

  const submitReport = async () => {
    if (!reportReason.trim()) return;
    try {
      await qaApi.reportContent({ contentType: 'answer', contentId: reportId, reason: reportReason });
      toast.success('Reported for review');
      setReportId(null);
      setReportReason('');
    } catch {
      toast.error('Failed to report');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const { question, answers } = data;
  const isQAuthor = question.author === user?.userId;

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/student/qa-forum')}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 text-sm"
      >
        <FiArrowLeft size={16} />
        Back to Forum
      </button>

      {/* Question */}
      <div className="card mb-6">
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <button
              onClick={handleUpvoteQuestion}
              className="flex flex-col items-center p-3 bg-lms-darkest rounded-lg border border-lms-primary/20 hover:border-lms-secondary/50 transition-all"
            >
              <FiArrowUp className="text-lms-secondary" size={18} />
              <span className="text-white font-bold">{question.upvotes?.length || 0}</span>
            </button>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white mb-2">{question.title}</h1>
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="px-2 py-0.5 bg-lms-accent/30 text-lms-muted border border-lms-accent/30 rounded-full text-xs">
                {question.subject}
              </span>
              {question.tags?.map((tag) => (
                <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-lms-primary/20 text-slate-400 rounded-full text-xs">
                  <FiTag size={9} />
                  {tag}
                </span>
              ))}
            </div>
            <p className="text-slate-300 text-sm leading-relaxed mb-4">{question.body}</p>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <span>by {question.authorName}</span>
              <span>{timeAgo(question.createdAt)}</span>
              <span>{question.viewCount} views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Answers */}
      <div className="mb-6">
        <h2 className="text-white font-bold mb-4">
          {answers.length} Answer{answers.length !== 1 ? 's' : ''}
        </h2>
        <div className="space-y-4">
          {answers.map((answer) => (
            <AnswerItem
              key={answer._id}
              answer={answer}
              questionAuthorId={question.author}
              onUpvote={handleUpvoteAnswer}
              onAccept={handleAcceptAnswer}
              onEdit={handleEditAnswer}
              onDelete={handleDeleteAnswer}
              onReport={handleReport}
            />
          ))}
          {answers.length === 0 && (
            <div className="card text-center py-8">
              <p className="text-slate-400">No answers yet. Be the first to answer!</p>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {reportId && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-lms-dark border border-lms-primary/30 rounded-xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-white font-bold mb-3">Report Answer</h3>
            <input
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="input-field mb-3"
              placeholder="Reason for reporting..."
            />
            <div className="flex gap-2">
              <button onClick={submitReport} className="btn-danger flex-1">Submit</button>
              <button onClick={() => setReportId(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Post Answer */}
      <div className="card">
        <h3 className="text-white font-bold mb-4">Your Answer</h3>
        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          className="input-field resize-none mb-3"
          rows={5}
          placeholder="Write a detailed, helpful answer..."
        />
        <button
          onClick={handleAnswer}
          disabled={answerLoading || !answerText.trim()}
          className="btn-primary flex items-center gap-2"
        >
          {answerLoading && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          Post Answer
        </button>
      </div>
    </div>
  );
};

// Forum List View
const ForumList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
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

  const handleAskQuestion = async (formData) => {
    try {
      setFormLoading(true);
      const res = await qaApi.createQuestion(formData);
      toast.success('Question posted!');
      setShowForm(false);
      navigate(`/student/qa-forum/${res.data.data._id}`);
    } catch {
      toast.error('Failed to post question');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Q&A Forum</h1>
          <p className="text-slate-400 text-sm">Ask questions, share knowledge</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2"
        >
          {showForm ? <FiX size={16} /> : <FiPlus size={16} />}
          {showForm ? 'Cancel' : 'Ask Question'}
        </button>
      </div>

      {showForm && (
        <div className="card mb-6">
          <h2 className="text-white font-semibold mb-4">Post a Question</h2>
          <QuestionForm onSubmit={handleAskQuestion} isLoading={formLoading} onCancel={() => setShowForm(false)} />
        </div>
      )}

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
              <QuestionCard key={q._id} question={q} />
            ))}
          </div>
          {questions.length === 0 && (
            <div className="card text-center py-16">
              <p className="text-white font-medium">No questions yet</p>
              <p className="text-slate-400 text-sm">Be the first to ask!</p>
            </div>
          )}
          <Pagination page={page} pages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

const StudentQAForum = () => {
  return (
    <Routes>
      <Route index element={<ForumList />} />
      <Route path=":id" element={<QuestionDetailView />} />
    </Routes>
  );
};

export default StudentQAForum;