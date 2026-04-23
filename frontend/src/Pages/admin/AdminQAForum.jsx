import { useState, useEffect, useCallback } from 'react';
import { qaApi } from '../../api/qaApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  FiSearch,
  FiTrash2,
  FiMessageSquare,
  FiArrowLeft,
  FiArrowUp,
  FiTag,
  FiEye,
  FiClock,
  FiCheck,
  FiChevronRight,
  FiAlertTriangle,
  FiSend,
  FiX,
} from 'react-icons/fi';
import { timeAgo } from '../../utils/formatDate';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const AdminQuestionDetail = ({ questionId, onBack }) => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState('');
  const [posting, setPosting] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: '' });
  const [reportModal, setReportModal] = useState({ open: false, id: '' });
  const [reportReason, setReportReason] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await qaApi.getQuestion(questionId);
      setData(res.data.data);
    } catch {
      toast.error('Failed to load question');
      onBack();
    } finally {
      setLoading(false);
    }
  }, [questionId, onBack]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePostAnswer = async () => {
    if (!answerText.trim()) {
      toast.error('Answer cannot be empty');
      return;
    }
    try {
      setPosting(true);
      await qaApi.createAnswer(questionId, { body: answerText.trim() });
      setAnswerText('');
      toast.success('Answer posted!');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post answer');
    } finally {
      setPosting(false);
    }
  };

  const handleDeleteQuestion = async () => {
    try {
      await qaApi.deleteQuestion(questionId);
      toast.success('Question deleted');
      setDeleteModal({ open: false, type: '', id: '' });
      onBack();
    } catch {
      toast.error('Failed to delete question');
    }
  };

  const handleDeleteAnswer = async () => {
    try {
      await qaApi.deleteAnswer(deleteModal.id);
      toast.success('Answer deleted');
      setDeleteModal({ open: false, type: '', id: '' });
      fetchData();
    } catch {
      toast.error('Failed to delete answer');
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

  const handleUpvoteAnswer = async (answerId) => {
    try {
      await qaApi.upvoteAnswer(answerId);
      fetchData();
    } catch {
      toast.error('Failed to upvote');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    try {
      await qaApi.reportContent({
        contentType: 'answer',
        contentId: reportModal.id,
        reason: reportReason.trim(),
      });
      toast.success('Answer reported for review');
      setReportModal({ open: false, id: '' });
      setReportReason('');
    } catch {
      toast.error('Failed to report');
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  const { question, answers } = data;

  return (
    <div className="mx-auto max-w-5xl">
      <button
        onClick={onBack}
        className="group mb-6 flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-white"
      >
        <FiArrowLeft size={16} className="transition-transform group-hover:-translate-x-0.5" />
        Back to Q&A Forum
      </button>

      <div className="mb-4 inline-flex rounded-full border border-lms-secondary/40 bg-lms-secondary/20 px-3 py-1 text-xs font-semibold text-lms-secondary">
        Admin View - Full Moderation Rights
      </div>

      <div className="mb-6 rounded-[28px] border border-white/6 bg-[#2b2340] p-6 shadow-[0_24px_70px_rgba(9,10,24,0.18)]">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex-1">
            <h1 className="mb-2 text-2xl font-bold text-white">{question.title}</h1>
            <div className="mb-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/6 bg-white/[0.04] px-3 py-1 text-xs text-slate-400">
                {question.subject}
              </span>
              {question.tags?.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 rounded-full border border-white/6 bg-white/[0.04] px-3 py-1 text-xs text-slate-400"
                >
                  <FiTag size={9} />
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => setDeleteModal({ open: true, type: 'question', id: question._id })}
            className="inline-flex items-center gap-2 rounded-2xl border border-red-500/18 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition-all hover:bg-red-500/18"
          >
            <FiTrash2 size={14} />
            Delete Question
          </button>
        </div>

        <p className="mb-4 text-sm leading-7 text-slate-300">{question.body}</p>

        <div className="flex flex-wrap items-center gap-4 border-t border-white/6 pt-4 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <FiArrowUp size={11} /> {question.upvotes?.length || 0} upvotes
          </span>
          <span className="flex items-center gap-1">
            <FiEye size={11} /> {question.viewCount || 0} views
          </span>
          <span className="flex items-center gap-1">
            <FiClock size={11} /> {timeAgo(question.createdAt)}
          </span>
          <span>by {question.authorName}</span>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-white">
          <FiMessageSquare className="text-lms-secondary" size={18} />
          {answers.length} Answer{answers.length !== 1 ? 's' : ''}
        </h2>

        {answers.length === 0 ? (
          <div className="rounded-[24px] border border-white/6 bg-[#2b2340] px-6 py-10 text-center">
            <FiMessageSquare className="mx-auto mb-2 text-slate-600" size={28} />
            <p className="text-sm text-slate-400">No answers yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {answers.map((answer) => (
              <AdminAnswerCard
                key={answer._id}
                answer={answer}
                currentUserId={user?.userId}
                onEdit={handleEditAnswer}
                onDelete={(id) => setDeleteModal({ open: true, type: 'answer', id })}
                onUpvote={handleUpvoteAnswer}
                onReport={(id) => {
                  setReportModal({ open: true, id });
                  setReportReason('');
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-[28px] border border-white/6 bg-[#2b2340] p-6 shadow-[0_24px_70px_rgba(9,10,24,0.18)]">
        <h3 className="mb-1 flex items-center gap-2 font-bold text-white">
          <FiSend className="text-lms-secondary" size={16} />
          Post an Answer
        </h3>
        <p className="mb-4 text-xs text-slate-500">As an admin, your answer will appear immediately.</p>

        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          className="mb-3 w-full resize-none rounded-2xl border border-white/10 bg-[#1f1830] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-lms-secondary/30"
          rows={5}
          placeholder="Write a clear, helpful answer for students..."
        />

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-600">{answerText.length} characters</span>
          <div className="flex gap-2">
            {answerText && (
              <button
                onClick={() => setAnswerText('')}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-300 transition-all hover:bg-white/[0.05] hover:text-white"
              >
                Clear
              </button>
            )}
            <button
              onClick={handlePostAnswer}
              disabled={posting || !answerText.trim()}
              className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,#6d63ff,#5b7cff)] px-5 py-2.5 text-sm font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {posting ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                <FiSend size={14} />
              )}
              {posting ? 'Posting...' : 'Post Answer'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={deleteModal.open}
        title={`Delete ${deleteModal.type === 'question' ? 'Question' : 'Answer'}`}
        message={
          deleteModal.type === 'question'
            ? 'Are you sure you want to delete this question and all its answers? This action cannot be undone.'
            : 'Are you sure you want to delete this answer? This action cannot be undone.'
        }
        onConfirm={deleteModal.type === 'question' ? handleDeleteQuestion : handleDeleteAnswer}
        onCancel={() => setDeleteModal({ open: false, type: '', id: '' })}
        confirmText="Delete"
        danger
      />

      {reportModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="mx-4 w-full max-w-sm rounded-2xl border border-white/10 bg-[#241d35] p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <FiAlertTriangle className="text-orange-400" size={18} />
              <h3 className="font-bold text-white">Report Answer</h3>
            </div>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="mb-4 w-full resize-none rounded-2xl border border-white/10 bg-[#1f1830] px-4 py-3 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-orange-400/30"
              rows={3}
              placeholder="Describe why this answer is inappropriate..."
            />
            <div className="flex gap-2">
              <button onClick={handleReport} className="flex-1 rounded-2xl border border-red-500/18 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-300 transition-all hover:bg-red-500/18">
                Submit Report
              </button>
              <button
                onClick={() => {
                  setReportModal({ open: false, id: '' });
                  setReportReason('');
                }}
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition-all hover:bg-white/[0.05] hover:text-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminAnswerCard = ({ answer, currentUserId, onEdit, onDelete, onUpvote, onReport }) => {
  const [showEdit, setShowEdit] = useState(false);
  const [editBody, setEditBody] = useState(answer.body);
  const [saving, setSaving] = useState(false);

  const isUpvoted = Array.isArray(answer.upvotes) && answer.upvotes.includes(currentUserId);

  const handleSaveEdit = async () => {
    if (!editBody.trim()) return;
    setSaving(true);
    await onEdit(answer._id, editBody.trim());
    setSaving(false);
    setShowEdit(false);
  };

  return (
    <div
      className={`rounded-[24px] border p-5 ${
        answer.isAccepted
          ? 'border-green-700/40 bg-green-900/10'
          : answer.isReported
            ? 'border-orange-700/30 bg-orange-900/10'
            : 'border-white/6 bg-[#2b2340]'
      }`}
    >
      {answer.isAccepted && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-green-700/40 bg-green-900/30 px-3 py-1 text-xs font-medium text-green-400">
          <FiCheck size={12} />
          Accepted Answer
        </div>
      )}

      {answer.isReported && (
        <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-orange-700/40 bg-orange-900/30 px-3 py-1 text-xs font-medium text-orange-400">
          <FiAlertTriangle size={12} />
          Reported — {answer.reportReason}
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={() => onUpvote(answer._id)}
            className={`flex min-w-[44px] flex-col items-center rounded-2xl border p-2 transition-all ${
              isUpvoted
                ? 'border-lms-secondary bg-lms-primary/30 text-lms-secondary'
                : 'border-white/10 bg-[#1f1830] text-slate-400 hover:border-lms-secondary hover:text-lms-secondary'
            }`}
          >
            <FiArrowUp size={15} />
            <span className="mt-0.5 text-xs font-bold">{answer.upvotes?.length || 0}</span>
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-lms-accent text-xs font-bold text-white">
                {answer.authorName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-medium text-white">{answer.authorName}</p>
                <p className="text-xs text-slate-500">{timeAgo(answer.createdAt)}</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setEditBody(answer.body);
                  setShowEdit(!showEdit);
                }}
                className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-blue-900/20 hover:text-blue-400"
                title="Edit answer"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(answer._id)}
                className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-red-900/20 hover:text-red-400"
                title="Delete answer"
              >
                <FiTrash2 size={13} />
              </button>
              <button
                onClick={() => onReport(answer._id)}
                className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-orange-900/20 hover:text-orange-400"
                title="Flag answer"
              >
                <FiAlertTriangle size={13} />
              </button>
            </div>
          </div>

          {showEdit ? (
            <div className="space-y-2">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="w-full resize-none rounded-2xl border border-white/10 bg-[#1f1830] px-4 py-3 text-sm text-white outline-none transition-all focus:border-lms-secondary/30"
                rows={4}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || !editBody.trim()}
                  className="inline-flex items-center gap-1.5 rounded-2xl bg-[linear-gradient(135deg,#6d63ff,#5b7cff)] px-4 py-2 text-xs font-medium text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving && <div className="h-3 w-3 animate-spin rounded-full border border-white/30 border-t-white" />}
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEdit(false)}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-xs text-slate-300 transition-all hover:bg-white/[0.05] hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-7 text-slate-300">{answer.body}</p>
          )}
        </div>
      </div>
    </div>
  );
};

const QuestionListCard = ({ question, onSelect, onDelete }) => (
  <div
    className="group cursor-pointer rounded-[28px] border border-white/6 bg-[#2b2340] px-5 py-5 shadow-[0_24px_70px_rgba(9,10,24,0.18)] transition-all duration-200 hover:border-white/14 hover:bg-[#31274b]"
    onClick={() => onSelect(question._id)}
  >
    <div className="flex gap-4">
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <div className="flex min-w-[52px] flex-col items-center rounded-2xl border border-white/8 bg-[#1f1830] p-2 text-center">
          <FiArrowUp className="mx-auto text-lms-secondary" size={13} />
          <span className="text-sm font-bold text-white">{question.upvotes?.length || 0}</span>
          <span className="text-xs text-slate-500">votes</span>
        </div>

        {question.acceptedAnswer && (
          <div className="flex min-w-[52px] flex-col items-center rounded-2xl border border-green-700/30 bg-green-900/30 p-1.5">
            <FiCheck className="text-green-400" size={13} />
            <span className="text-xs text-green-400">solved</span>
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="mb-2 line-clamp-2 text-2xl font-bold leading-snug text-white transition-colors group-hover:text-lms-secondary">
          {question.title}
        </h3>
        <p className="mb-3 line-clamp-1 text-sm text-slate-400">{question.body}</p>

        <div className="mb-3 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/6 bg-white/[0.04] px-3 py-1 text-xs text-slate-400">
            {question.subject}
          </span>
          {question.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 rounded-full border border-white/6 bg-white/[0.04] px-3 py-1 text-xs text-slate-400"
            >
              <FiTag size={9} />
              {tag}
            </span>
          ))}
          {question.isFlagged && (
            <span className="flex items-center gap-1 rounded-full border border-orange-700/30 bg-orange-900/30 px-3 py-1 text-xs text-orange-400">
              <FiAlertTriangle size={9} />
              Flagged
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <FiClock size={10} /> {timeAgo(question.createdAt)}
            </span>
            <span>{question.answersCount || question.answers?.length || 0}</span>
            <span className="flex items-center gap-1">
              <FiEye size={10} /> {question.viewCount || 0}
            </span>
            <span>by {question.authorName}</span>
          </div>

          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onDelete(question._id)}
              className="rounded-xl p-2 text-slate-500 transition-all hover:bg-red-900/20 hover:text-red-300"
              title="Delete question"
            >
              <FiTrash2 size={13} />
            </button>
            <button
              onClick={() => onSelect(question._id)}
              className="inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-lms-secondary transition-colors hover:bg-lms-secondary/20 hover:text-white"
            >
              View &amp; Reply <FiChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const AdminQAForum = () => {
  const [view, setView] = useState('list');
  const [selectedId, setSelectedId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterFlagged, setFilterFlagged] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteModal, setDeleteModal] = useState({ open: false, id: '' });

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await qaApi.getQuestions({ search, page, limit: 10 });
      let qs = res.data.data.questions || [];
      if (filterFlagged) qs = qs.filter((q) => q.isFlagged);
      setQuestions(qs);
      setTotal(res.data.data.total || 0);
      setTotalPages(res.data.data.pages || 1);
    } catch {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [search, page, filterFlagged]);

  useEffect(() => {
    if (view === 'list') fetchQuestions();
  }, [fetchQuestions, view]);

  const handleDelete = async () => {
    try {
      await qaApi.deleteQuestion(deleteModal.id);
      toast.success('Question deleted');
      setDeleteModal({ open: false, id: '' });
      fetchQuestions();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleSelectQuestion = (id) => {
    setSelectedId(id);
    setView('detail');
  };

  const handleBack = () => {
    setView('list');
    setSelectedId(null);
    fetchQuestions();
  };

  if (view === 'detail' && selectedId) {
    return <AdminQuestionDetail questionId={selectedId} onBack={handleBack} />;
  }

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Q&amp;A Forum Moderation</h1>
          <p className="mt-2 text-base text-slate-400">
            {total} questions total — click any question to view details and reply
          </p>
        </div>

        <button
          onClick={() => {
            setFilterFlagged(!filterFlagged);
            setPage(1);
          }}
          className={`inline-flex items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition-all ${
            filterFlagged
              ? 'border-orange-700/40 bg-orange-900/30 text-orange-300'
              : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-white'
          }`}
        >
          <FiAlertTriangle size={14} />
          {filterFlagged ? 'Showing Flagged' : 'Show Flagged Only'}
        </button>
      </div>

      <div className="relative mb-6">
        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-2xl border border-white/10 bg-transparent py-3 pl-10 pr-10 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-lms-secondary/30"
          placeholder="Search questions by title, body or tags..."
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
          >
            <FiX size={14} />
          </button>
        )}
      </div>

      <div className="mb-5 flex items-center gap-2 rounded-2xl border border-white/8 bg-[#2b2340] p-4">
        <FiMessageSquare className="flex-shrink-0 text-lms-secondary" size={15} />
        <p className="text-sm text-slate-300">
          Click <strong className="text-lms-secondary">View &amp; Reply</strong> on any question to open a detailed view where you can post answers, edit or delete student answers, and moderate content.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : questions.length === 0 ? (
        <div className="rounded-[28px] border border-white/6 bg-[#2b2340] px-6 py-16 text-center shadow-[0_24px_70px_rgba(9,10,24,0.18)]">
          <FiMessageSquare className="mx-auto mb-3 text-slate-600" size={36} />
          <p className="text-lg font-semibold text-white">No questions found</p>
          <p className="mt-2 text-sm text-slate-400">
            {search
              ? 'Try different search terms'
              : filterFlagged
                ? 'No flagged questions'
                : 'No questions have been posted yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-5">
            {questions.map((q) => (
              <QuestionListCard
                key={q._id}
                question={q}
                onSelect={handleSelectQuestion}
                onDelete={(id) => setDeleteModal({ open: true, id })}
              />
            ))}
          </div>
          <Pagination page={page} pages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ConfirmModal
        isOpen={deleteModal.open}
        title="Delete Question"
        message="Are you sure you want to delete this question? All associated answers will also be removed. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteModal({ open: false, id: '' })}
        confirmText="Delete Question"
        danger
      />
    </div>
  );
};

export default AdminQAForum;
