import { useState, useEffect, useCallback } from 'react';
import { qaApi } from '../../api/qaApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AnswerItem from '../../components/qa/AnswerItem';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  FiSearch, FiTrash2, FiMessageSquare, FiArrowLeft,
  FiArrowUp, FiTag, FiEye, FiClock, FiCheck,
  FiChevronRight, FiAlertTriangle, FiSend, FiX
} from 'react-icons/fi';
import { timeAgo } from '../../utils/formatDate';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// ── Question Detail View (Admin) ──────────────────────────────────────────────
const AdminQuestionDetail = ({ questionId, onBack }) => {
  const { user } = useAuth();
  const [data, setData]               = useState(null);
  const [loading, setLoading]         = useState(true);
  const [answerText, setAnswerText]   = useState('');
  const [posting, setPosting]         = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: '' });
  const [reportModal, setReportModal] = useState({ open: false, id: '' });
  const [reportReason, setReportReason] = useState('');
  const [editAnswer, setEditAnswer]   = useState({ id: '', body: '' });

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
  }, [questionId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Admin post answer ────────────────────────────────────────────────────────
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

  // ── Delete question ──────────────────────────────────────────────────────────
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

  // ── Delete answer ────────────────────────────────────────────────────────────
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

  // ── Edit answer ──────────────────────────────────────────────────────────────
  const handleEditAnswer = async (answerId, body) => {
    try {
      await qaApi.updateAnswer(answerId, { body });
      toast.success('Answer updated');
      fetchData();
    } catch {
      toast.error('Failed to update answer');
    }
  };

  // ── Upvote ───────────────────────────────────────────────────────────────────
  const handleUpvoteAnswer = async (answerId) => {
    try {
      await qaApi.upvoteAnswer(answerId);
      fetchData();
    } catch {
      toast.error('Failed to upvote');
    }
  };

  // ── Report ───────────────────────────────────────────────────────────────────
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
  if (!data)   return null;

  const { question, answers } = data;

  return (
    <div className="max-w-4xl mx-auto">

      {/* ── Back button ── */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white
                   transition-colors mb-6 text-sm group"
      >
        <FiArrowLeft
          size={16}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        Back to Q&amp;A Forum
      </button>

      {/* ── Admin badge ── */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className="px-3 py-1 text-xs font-semibold bg-lms-secondary/30
                     text-lms-secondary border border-lms-secondary/40
                     rounded-full"
        >
          👮 Admin View — Full Moderation Rights
        </span>
      </div>

      {/* ── Question card ── */}
      <div className="card mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white mb-2 leading-snug">
              {question.title}
            </h1>
            <div className="flex flex-wrap gap-2 mb-3">
              <span
                className="px-2 py-0.5 bg-lms-accent/30 text-lms-muted
                           border border-lms-accent/30 rounded-full text-xs"
              >
                {question.subject}
              </span>
              {question.tags?.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-0.5
                             bg-lms-primary/20 text-slate-400 rounded-full text-xs"
                >
                  <FiTag size={9} /> {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Delete question button (admin) */}
          <button
            onClick={() =>
              setDeleteModal({ open: true, type: 'question', id: question._id })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-900/40
                       text-red-400 border border-red-700/40 rounded-lg text-xs
                       hover:bg-red-900/60 transition-colors flex-shrink-0"
          >
            <FiTrash2 size={13} /> Delete Question
          </button>
        </div>

        <p className="text-slate-300 text-sm leading-relaxed mb-4">
          {question.body}
        </p>

        <div className="flex items-center gap-4 text-xs text-slate-500 pt-3
                        border-t border-lms-primary/20">
          <span className="flex items-center gap-1">
            <FiArrowUp size={11} /> {question.upvotes?.length || 0} upvotes
          </span>
          <span className="flex items-center gap-1">
            <FiEye size={11} /> {question.viewCount || 0} views
          </span>
          <span className="flex items-center gap-1">
            <FiClock size={11} /> {timeAgo(question.createdAt)}
          </span>
          <span className="text-lms-muted">by {question.authorName}</span>
        </div>
      </div>

      {/* ── Answers section ── */}
      <div className="mb-6">
        <h2 className="text-white font-bold text-base mb-4 flex items-center gap-2">
          <FiMessageSquare className="text-lms-secondary" size={18} />
          {answers.length} Answer{answers.length !== 1 ? 's' : ''}
        </h2>

        {answers.length === 0 ? (
          <div className="card text-center py-10">
            <FiMessageSquare
              className="mx-auto text-slate-600 mb-2"
              size={28}
            />
            <p className="text-slate-400 text-sm">
              No answers yet. Be the first to answer!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {answers.map((answer) => (
              <AdminAnswerCard
                key={answer._id}
                answer={answer}
                questionAuthorId={question.author}
                onEdit={handleEditAnswer}
                onDelete={(id) =>
                  setDeleteModal({ open: true, type: 'answer', id })
                }
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

      {/* ── Admin Reply Box ── */}
      <div className="card">
        <h3 className="text-white font-bold mb-1 flex items-center gap-2">
          <FiSend className="text-lms-secondary" size={16} />
          Post an Answer
        </h3>
        <p className="text-slate-500 text-xs mb-4">
          As an admin, your answer will appear immediately.
        </p>

        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          className="input-field resize-none mb-3"
          rows={5}
          placeholder="Write a clear, helpful answer for students..."
        />

        <div className="flex items-center justify-between">
          <span className="text-slate-600 text-xs">
            {answerText.length} characters
          </span>
          <div className="flex gap-2">
            {answerText && (
              <button
                onClick={() => setAnswerText('')}
                className="btn-secondary flex items-center gap-1.5 text-xs"
              >
                <FiX size={13} /> Clear
              </button>
            )}
            <button
              onClick={handlePostAnswer}
              disabled={posting || !answerText.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {posting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white
                                rounded-full animate-spin" />
              ) : (
                <FiSend size={14} />
              )}
              {posting ? 'Posting...' : 'Post Answer'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Delete Confirm Modal ── */}
      <ConfirmModal
        isOpen={deleteModal.open}
        title={`Delete ${deleteModal.type === 'question' ? 'Question' : 'Answer'}`}
        message={
          deleteModal.type === 'question'
            ? 'Are you sure you want to delete this question and all its answers? This action cannot be undone.'
            : 'Are you sure you want to delete this answer? This action cannot be undone.'
        }
        onConfirm={
          deleteModal.type === 'question'
            ? handleDeleteQuestion
            : handleDeleteAnswer
        }
        onCancel={() => setDeleteModal({ open: false, type: '', id: '' })}
        confirmText="Delete"
        danger
      />

      {/* ── Report Modal ── */}
      {reportModal.open && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center
                        justify-center backdrop-blur-sm">
          <div className="bg-lms-dark border border-lms-primary/30 rounded-xl
                          p-6 w-full max-w-sm mx-4 shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertTriangle className="text-orange-400" size={18} />
              <h3 className="text-white font-bold">Report Answer</h3>
            </div>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="input-field resize-none mb-4"
              rows={3}
              placeholder="Describe why this answer is inappropriate..."
            />
            <div className="flex gap-2">
              <button
                onClick={handleReport}
                className="btn-danger flex-1"
              >
                Submit Report
              </button>
              <button
                onClick={() => {
                  setReportModal({ open: false, id: '' });
                  setReportReason('');
                }}
                className="btn-secondary flex-1"
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

// ── Admin Answer Card ─────────────────────────────────────────────────────────
const AdminAnswerCard = ({
  answer,
  questionAuthorId,
  onEdit,
  onDelete,
  onUpvote,
  onReport,
}) => {
  const { user } = useAuth();
  const [showEdit, setShowEdit]   = useState(false);
  const [editBody, setEditBody]   = useState(answer.body);
  const [saving, setSaving]       = useState(false);

  const isUpvoted = answer.upvotes?.includes(user?.userId);

  const handleSaveEdit = async () => {
    if (!editBody.trim()) return;
    setSaving(true);
    await onEdit(answer._id, editBody.trim());
    setSaving(false);
    setShowEdit(false);
  };

  return (
    <div
      className={`rounded-xl p-5 border transition-colors ${
        answer.isAccepted
          ? 'bg-green-900/10 border-green-700/40'
          : answer.isReported
          ? 'bg-orange-900/10 border-orange-700/30'
          : 'bg-lms-darkest border-lms-primary/20'
      }`}
    >
      {/* Accepted badge */}
      {answer.isAccepted && (
        <div className="flex items-center gap-1.5 mb-3">
          <span
            className="flex items-center gap-1.5 px-3 py-1 bg-green-900/30
                       border border-green-700/40 rounded-full text-xs
                       text-green-400 font-medium"
          >
            <FiCheck size={12} /> Accepted Answer
          </span>
        </div>
      )}

      {/* Reported badge */}
      {answer.isReported && (
        <div className="flex items-center gap-1.5 mb-3">
          <span
            className="flex items-center gap-1.5 px-3 py-1 bg-orange-900/30
                       border border-orange-700/40 rounded-full text-xs
                       text-orange-400 font-medium"
          >
            <FiAlertTriangle size={12} /> Reported — {answer.reportReason}
          </span>
        </div>
      )}

      <div className="flex gap-4">
        {/* Upvote column */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onUpvote(answer._id)}
            className={`flex flex-col items-center p-2 rounded-lg border
                        transition-all min-w-[44px] ${
                          isUpvoted
                            ? 'bg-lms-primary/30 border-lms-secondary text-lms-secondary'
                            : 'bg-lms-dark border-lms-primary/30 text-slate-400 hover:border-lms-secondary hover:text-lms-secondary'
                        }`}
          >
            <FiArrowUp size={15} />
            <span className="text-xs font-bold mt-0.5">
              {answer.upvotes?.length || 0}
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Author row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 bg-lms-accent rounded-full flex items-center
                           justify-center text-white text-xs font-bold flex-shrink-0"
              >
                {answer.authorName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-white font-medium text-sm leading-tight">
                  {answer.authorName}
                </p>
                <p className="text-slate-500 text-xs">
                  {timeAgo(answer.createdAt)}
                </p>
              </div>
            </div>

            {/* Admin action buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  setEditBody(answer.body);
                  setShowEdit(!showEdit);
                }}
                className="p-1.5 text-slate-400 hover:text-blue-400
                           hover:bg-blue-900/20 rounded-lg transition-all"
                title="Edit answer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
              <button
                onClick={() => onDelete(answer._id)}
                className="p-1.5 text-slate-400 hover:text-red-400
                           hover:bg-red-900/20 rounded-lg transition-all"
                title="Delete answer"
              >
                <FiTrash2 size={13} />
              </button>
              <button
                onClick={() => onReport(answer._id)}
                className="p-1.5 text-slate-400 hover:text-orange-400
                           hover:bg-orange-900/20 rounded-lg transition-all"
                title="Flag answer"
              >
                <FiAlertTriangle size={13} />
              </button>
            </div>
          </div>

          {/* Edit form */}
          {showEdit ? (
            <div className="space-y-2">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                className="input-field resize-none"
                rows={4}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || !editBody.trim()}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  {saving && (
                    <div className="w-3 h-3 border border-white/30 border-t-white
                                    rounded-full animate-spin" />
                  )}
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEdit(false)}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-300 text-sm leading-relaxed">
              {answer.body}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Question List Card ────────────────────────────────────────────────────────
const QuestionListCard = ({ question, onSelect, onDelete }) => (
  <div className="card group hover:border-lms-secondary/50 transition-all cursor-pointer"
       onClick={() => onSelect(question._id)}>
    <div className="flex gap-4">
      {/* Stats column */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <div
          className="flex flex-col items-center p-2 bg-lms-darkest rounded-lg
                     border border-lms-primary/20 min-w-[52px] text-center"
        >
          <FiArrowUp className="text-lms-secondary mx-auto" size={13} />
          <span className="text-white font-bold text-sm">
            {question.upvotes?.length || 0}
          </span>
          <span className="text-slate-500 text-xs">votes</span>
        </div>

        {question.acceptedAnswer && (
          <div
            className="flex flex-col items-center p-1.5 bg-green-900/30
                       rounded-lg border border-green-700/30 min-w-[52px]"
          >
            <FiCheck className="text-green-400" size={13} />
            <span className="text-green-400 text-xs">solved</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3
          className="text-white font-semibold text-sm mb-1 leading-snug
                     group-hover:text-lms-secondary transition-colors line-clamp-2"
        >
          {question.title}
        </h3>
        <p className="text-slate-400 text-xs mb-2 line-clamp-1">
          {question.body}
        </p>

        <div className="flex flex-wrap gap-1.5 mb-2">
          <span
            className="px-2 py-0.5 bg-lms-accent/30 text-lms-muted
                       border border-lms-accent/30 rounded-full text-xs"
          >
            {question.subject}
          </span>
          {question.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="flex items-center gap-1 px-2 py-0.5
                         bg-lms-primary/20 text-slate-400 rounded-full text-xs"
            >
              <FiTag size={9} /> {tag}
            </span>
          ))}
          {question.isFlagged && (
            <span
              className="flex items-center gap-1 px-2 py-0.5 bg-orange-900/30
                         text-orange-400 border border-orange-700/30 rounded-full text-xs"
            >
              <FiAlertTriangle size={9} /> Flagged
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <FiClock size={10} /> {timeAgo(question.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <FiEye size={10} /> {question.viewCount || 0}
            </span>
            <span className="text-lms-muted">by {question.authorName}</span>
          </div>

          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => onDelete(question._id)}
              className="p-1.5 text-slate-500 hover:text-red-400
                         hover:bg-red-900/20 rounded-lg transition-all"
              title="Delete question"
            >
              <FiTrash2 size={13} />
            </button>
            <button
              onClick={() => onSelect(question._id)}
              className="flex items-center gap-1 px-2 py-1 text-xs
                         text-lms-secondary hover:text-white
                         hover:bg-lms-secondary/20 rounded-lg transition-colors"
            >
              View &amp; Reply <FiChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// ── Main AdminQAForum Component ───────────────────────────────────────────────
const AdminQAForum = () => {
  const [view, setView]               = useState('list');   // 'list' | 'detail'
  const [selectedId, setSelectedId]   = useState(null);
  const [questions, setQuestions]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [filterFlagged, setFilterFlagged] = useState(false);
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);
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

  // ── Detail view ──────────────────────────────────────────────────────────────
  if (view === 'detail' && selectedId) {
    return (
      <AdminQuestionDetail
        questionId={selectedId}
        onBack={handleBack}
      />
    );
  }

  // ── List view ────────────────────────────────────────────────────────────────
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Q&amp;A Forum Moderation</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {total} question{total !== 1 ? 's' : ''} total
            — click any question to view details and reply
          </p>
        </div>

        {/* Flagged filter toggle */}
        <button
          onClick={() => { setFilterFlagged(!filterFlagged); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm
                      font-medium transition-all ${
                        filterFlagged
                          ? 'bg-orange-900/40 border-orange-700/60 text-orange-400'
                          : 'bg-lms-dark border-lms-primary/30 text-slate-400 hover:text-white'
                      }`}
        >
          <FiAlertTriangle size={14} />
          {filterFlagged ? 'Showing Flagged' : 'Show Flagged Only'}
        </button>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <FiSearch
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          size={14}
        />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-field pl-9"
          placeholder="Search questions by title, body or tags..."
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-slate-500 hover:text-white transition-colors"
          >
            <FiX size={14} />
          </button>
        )}
      </div>

      {/* Info bar */}
      <div
        className="flex items-center gap-2 p-3 mb-5 bg-lms-secondary/10
                   border border-lms-secondary/20 rounded-lg"
      >
        <FiMessageSquare className="text-lms-secondary flex-shrink-0" size={15} />
        <p className="text-slate-300 text-xs">
          Click <strong className="text-lms-secondary">View &amp; Reply</strong> on any
          question to open a detailed view where you can post answers, edit or delete
          student answers, and moderate content.
        </p>
      </div>

      {/* Questions list */}
      {loading ? (
        <LoadingSpinner />
      ) : questions.length === 0 ? (
        <div className="card text-center py-16">
          <FiMessageSquare
            className="mx-auto text-slate-600 mb-3"
            size={36}
          />
          <p className="text-white font-medium">No questions found</p>
          <p className="text-slate-400 text-sm mt-1">
            {search
              ? 'Try different search terms'
              : filterFlagged
              ? 'No flagged questions'
              : 'No questions have been posted yet'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {questions.map((q) => (
              <QuestionListCard
                key={q._id}
                question={q}
                onSelect={handleSelectQuestion}
                onDelete={(id) => setDeleteModal({ open: true, id })}
              />
            ))}
          </div>
          <Pagination
            page={page}
            pages={totalPages}
            onPageChange={setPage}
          />
        </>
      )}

      {/* Delete confirm modal */}
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