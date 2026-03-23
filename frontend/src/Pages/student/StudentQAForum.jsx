import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { qaApi } from '../../api/qaApi';
import QuestionForm from '../../components/qa/QuestionForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  FiPlus, FiX, FiSearch, FiArrowLeft, FiArrowUp,
  FiTag, FiEye, FiClock, FiCheck, FiMessageSquare,
  FiSend, FiEdit2, FiTrash2, FiFlag, FiAlertTriangle,
  FiMoreVertical, FiChevronRight,
} from 'react-icons/fi';
import { timeAgo } from '../../utils/formatDate';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Answer Card
// ─────────────────────────────────────────────────────────────────────────────
const AnswerCard = ({
  answer,
  questionAuthorId,
  onUpvote,
  onAccept,
  onEdit,
  onDelete,
  onReport,
}) => {
  const { user } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [editBody, setEditBody] = useState(answer.body);
  const [saving, setSaving]     = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner    = answer.author === user?.userId;
  const isQAuthor  = questionAuthorId === user?.userId;
  const isUpvoted  = answer.upvotes?.includes(user?.userId);

  const handleSave = async () => {
    if (!editBody.trim()) return;
    setSaving(true);
    await onEdit(answer._id, editBody.trim());
    setSaving(false);
    setShowEdit(false);
  };

  return (
    <div
      className={`rounded-xl border p-5 transition-all ${
        answer.isAccepted
          ? 'bg-green-900/10 border-green-700/40'
          : 'bg-lms-darkest border-lms-primary/20 hover:border-lms-primary/40'
      }`}
    >
      {/* Accepted badge */}
      {answer.isAccepted && (
        <div className="flex items-center gap-1.5 mb-3">
          <span className="flex items-center gap-1.5 px-3 py-1 bg-green-900/30
                           border border-green-700/40 rounded-full text-xs
                           text-green-400 font-medium">
            <FiCheck size={12} /> Accepted Answer
          </span>
        </div>
      )}

      <div className="flex gap-4">
        {/* Upvote */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button
            onClick={() => onUpvote(answer._id)}
            className={`flex flex-col items-center p-2 rounded-lg border
                        transition-all min-w-[44px] text-center ${
                          isUpvoted
                            ? 'bg-lms-primary/40 border-lms-secondary text-lms-secondary'
                            : 'bg-lms-dark border-lms-primary/30 text-slate-400 hover:border-lms-secondary hover:text-lms-secondary'
                        }`}
          >
            <FiArrowUp size={15} />
            <span className="text-xs font-bold mt-0.5">
              {answer.upvotes?.length || 0}
            </span>
          </button>

          {/* Accept button — only question author can accept */}
          {isQAuthor && !answer.isAccepted && (
            <button
              onClick={() => onAccept(answer._id)}
              title="Mark as accepted answer"
              className="flex flex-col items-center p-2 rounded-lg border
                         border-green-700/30 text-green-600 hover:bg-green-900/20
                         hover:text-green-400 transition-all min-w-[44px]"
            >
              <FiCheck size={15} />
              <span className="text-xs mt-0.5">Accept</span>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 min-w-0">
          {/* Author row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-lms-accent rounded-full flex items-center
                             justify-center text-white text-xs font-bold flex-shrink-0">
                {answer.authorName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-white font-medium text-sm leading-tight">
                  {answer.authorName}
                </p>
                <p className="text-slate-500 text-xs">{timeAgo(answer.createdAt)}</p>
              </div>
            </div>

            {/* Action menu */}
            {(isOwner || !isOwner) && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1.5 text-slate-500 hover:text-white rounded-lg
                             hover:bg-lms-primary/30 transition-all"
                >
                  <FiMoreVertical size={15} />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-8 z-20 bg-lms-dark border
                                  border-lms-primary/30 rounded-xl shadow-xl
                                  min-w-[150px] py-1 overflow-hidden">
                    {isOwner && (
                      <>
                        <button
                          onClick={() => { setShowEdit(true); setShowMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs
                                     text-slate-300 hover:bg-lms-primary/30 hover:text-white
                                     transition-colors"
                        >
                          <FiEdit2 size={12} /> Edit Answer
                        </button>
                        <button
                          onClick={() => { onDelete(answer._id); setShowMenu(false); }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs
                                     text-red-400 hover:bg-red-900/20 transition-colors"
                        >
                          <FiTrash2 size={12} /> Delete Answer
                        </button>
                      </>
                    )}
                    {!isOwner && (
                      <button
                        onClick={() => { onReport(answer._id); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs
                                   text-orange-400 hover:bg-orange-900/20 transition-colors"
                      >
                        <FiFlag size={12} /> Report Answer
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
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
                  onClick={handleSave}
                  disabled={saving || !editBody.trim()}
                  className="btn-primary text-xs px-3 py-1.5 flex items-center gap-1.5"
                >
                  {saving && (
                    <div className="w-3 h-3 border border-white/30 border-t-white
                                    rounded-full animate-spin" />
                  )}
                  Save
                </button>
                <button
                  onClick={() => { setShowEdit(false); setEditBody(answer.body); }}
                  className="btn-secondary text-xs px-3 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
              {answer.body}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Question Detail Page
// ─────────────────────────────────────────────────────────────────────────────
const QuestionDetailPage = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { user }     = useAuth();

  const [question, setQuestion]   = useState(null);
  const [answers, setAnswers]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [answerText, setAnswerText] = useState('');
  const [posting, setPosting]     = useState(false);
  const [upvotingQ, setUpvotingQ] = useState(false);

  // Delete modal
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: '' });

  // Report modal
  const [reportModal, setReportModal]   = useState({ open: false, id: '' });
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting]       = useState(false);

  // ── fetch question + answers ────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await qaApi.getQuestion(id);
      const { question: q, answers: a } = res.data.data;
      setQuestion(q);
      setAnswers(a || []);
      console.log('Loaded question:', q._id, '| answers:', a?.length);
    } catch (err) {
      console.error('Failed to load question:', err);
      toast.error('Question not found');
      navigate('/student/qa-forum', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── post answer ─────────────────────────────────────────────────────────────
  const handlePostAnswer = async () => {
    if (!answerText.trim()) {
      toast.error('Please write an answer first');
      return;
    }
    try {
      setPosting(true);
      await qaApi.createAnswer(id, { body: answerText.trim() });
      setAnswerText('');
      toast.success('Answer posted!');
      await fetchData(); // re-fetch to show new answer
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post answer');
    } finally {
      setPosting(false);
    }
  };

  // ── upvote question ─────────────────────────────────────────────────────────
  const handleUpvoteQuestion = async () => {
    try {
      setUpvotingQ(true);
      await qaApi.upvoteQuestion(id);
      await fetchData();
    } catch {
      toast.error('Failed to upvote');
    } finally {
      setUpvotingQ(false);
    }
  };

  // ── upvote answer ───────────────────────────────────────────────────────────
  const handleUpvoteAnswer = async (answerId) => {
    try {
      await qaApi.upvoteAnswer(answerId);
      await fetchData();
    } catch {
      toast.error('Failed to upvote');
    }
  };

  // ── accept answer ───────────────────────────────────────────────────────────
  const handleAcceptAnswer = async (answerId) => {
    try {
      await qaApi.acceptAnswer(id, answerId);
      toast.success('Answer marked as accepted!');
      await fetchData();
    } catch {
      toast.error('Failed to accept answer');
    }
  };

  // ── edit answer ─────────────────────────────────────────────────────────────
  const handleEditAnswer = async (answerId, body) => {
    try {
      await qaApi.updateAnswer(answerId, { body });
      toast.success('Answer updated!');
      await fetchData();
    } catch {
      toast.error('Failed to update answer');
    }
  };

  // ── delete answer ───────────────────────────────────────────────────────────
  const handleDeleteAnswer = async () => {
    try {
      await qaApi.deleteAnswer(deleteModal.id);
      toast.success('Answer deleted');
      setDeleteModal({ open: false, type: '', id: '' });
      await fetchData();
    } catch {
      toast.error('Failed to delete answer');
    }
  };

  // ── delete question ─────────────────────────────────────────────────────────
  const handleDeleteQuestion = async () => {
    try {
      await qaApi.deleteQuestion(id);
      toast.success('Question deleted');
      navigate('/student/qa-forum', { replace: true });
    } catch {
      toast.error('Failed to delete question');
    }
  };

  // ── report answer ───────────────────────────────────────────────────────────
  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }
    try {
      setReporting(true);
      await qaApi.reportContent({
        contentType: 'answer',
        contentId:   reportModal.id,
        reason:      reportReason.trim(),
      });
      toast.success('Answer reported for review');
      setReportModal({ open: false, id: '' });
      setReportReason('');
    } catch {
      toast.error('Failed to report answer');
    } finally {
      setReporting(false);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (!question) return null;

  const isQOwner  = question.author === user?.userId;
  const isUpvoted = question.upvotes?.includes(user?.userId);

  return (
    <div className="max-w-4xl mx-auto">

      {/* Back */}
      <button
        onClick={() => navigate('/student/qa-forum')}
        className="flex items-center gap-2 text-slate-400 hover:text-white
                   transition-colors mb-6 text-sm group"
      >
        <FiArrowLeft
          size={16}
          className="group-hover:-translate-x-0.5 transition-transform"
        />
        Back to Q&amp;A Forum
      </button>

      {/* ── Question Card ── */}
      <div className="card mb-8">
        <div className="flex gap-4">
          {/* Upvote column */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0">
            <button
              onClick={handleUpvoteQuestion}
              disabled={upvotingQ}
              className={`flex flex-col items-center p-3 rounded-xl border
                          transition-all ${
                            isUpvoted
                              ? 'bg-lms-primary/40 border-lms-secondary text-lms-secondary'
                              : 'bg-lms-darkest border-lms-primary/30 text-slate-400 hover:border-lms-secondary hover:text-lms-secondary'
                          }`}
            >
              {upvotingQ
                ? <div className="w-4 h-4 border border-current border-t-transparent rounded-full animate-spin" />
                : <FiArrowUp size={18} />
              }
              <span className="text-sm font-bold mt-1">
                {question.upvotes?.length || 0}
              </span>
              <span className="text-xs opacity-70">votes</span>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h1 className="text-xl font-bold text-white leading-snug">
                {question.title}
              </h1>
              {/* Delete own question */}
              {isQOwner && (
                <button
                  onClick={() =>
                    setDeleteModal({ open: true, type: 'question', id: question._id })
                  }
                  className="p-1.5 text-slate-500 hover:text-red-400
                             hover:bg-red-900/20 rounded-lg transition-all flex-shrink-0"
                  title="Delete question"
                >
                  <FiTrash2 size={15} />
                </button>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2 py-0.5 bg-lms-accent/30 text-lms-muted
                               border border-lms-accent/30 rounded-full text-xs">
                {question.subject}
              </span>
              {question.tags?.map((tag) => (
                <span key={tag}
                      className="flex items-center gap-1 px-2 py-0.5
                                 bg-lms-primary/20 text-slate-400 rounded-full text-xs">
                  <FiTag size={9} /> {tag}
                </span>
              ))}
            </div>

            <p className="text-slate-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">
              {question.body}
            </p>

            <div className="flex items-center gap-4 text-xs text-slate-500
                            pt-3 border-t border-lms-primary/20">
              <span className="flex items-center gap-1">
                <FiClock size={11} /> {timeAgo(question.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <FiEye size={11} /> {question.viewCount || 0} views
              </span>
              <span className="text-lms-muted font-medium">
                by {question.authorName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Answers ── */}
      <div className="mb-8">
        <h2 className="text-white font-bold text-base mb-5 flex items-center gap-2">
          <FiMessageSquare className="text-lms-secondary" size={18} />
          {answers.length} Answer{answers.length !== 1 ? 's' : ''}
          {question.acceptedAnswer && (
            <span className="ml-2 px-2 py-0.5 bg-green-900/30 text-green-400
                             border border-green-700/30 rounded-full text-xs font-normal">
              Solved ✓
            </span>
          )}
        </h2>

        {answers.length === 0 ? (
          <div className="card text-center py-12">
            <FiMessageSquare className="mx-auto text-slate-600 mb-3" size={32} />
            <p className="text-white font-medium">No answers yet</p>
            <p className="text-slate-400 text-sm mt-1">
              Be the first to answer this question!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {answers.map((answer) => (
              <AnswerCard
                key={answer._id}
                answer={answer}
                questionAuthorId={question.author}
                onUpvote={handleUpvoteAnswer}
                onAccept={handleAcceptAnswer}
                onEdit={handleEditAnswer}
                onDelete={(aId) =>
                  setDeleteModal({ open: true, type: 'answer', id: aId })
                }
                onReport={(aId) => {
                  setReportModal({ open: true, id: aId });
                  setReportReason('');
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Post Answer Box ── */}
      <div className="card">
        <h3 className="text-white font-bold mb-1 flex items-center gap-2">
          <FiSend className="text-lms-secondary" size={16} />
          Your Answer
        </h3>
        <p className="text-slate-500 text-xs mb-4">
          Write a clear, detailed answer. Be respectful and helpful.
        </p>

        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          className="input-field resize-none mb-3"
          rows={6}
          placeholder="Share your knowledge. Explain step by step if needed..."
        />

        <div className="flex items-center justify-between">
          <span className="text-slate-600 text-xs">
            {answerText.length} / 5000
          </span>
          <div className="flex gap-2">
            {answerText && (
              <button
                onClick={() => setAnswerText('')}
                className="btn-secondary flex items-center gap-1.5 text-xs"
              >
                <FiX size={12} /> Clear
              </button>
            )}
            <button
              onClick={handlePostAnswer}
              disabled={posting || !answerText.trim()}
              className="btn-primary flex items-center gap-2"
            >
              {posting
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white
                                  rounded-full animate-spin" />
                : <FiSend size={14} />
              }
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
            ? 'Delete this question? All answers will also be removed. This cannot be undone.'
            : 'Delete this answer? This cannot be undone.'
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
                        justify-center backdrop-blur-sm p-4">
          <div className="bg-lms-dark border border-lms-primary/30 rounded-xl
                          p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-2 mb-4">
              <FiAlertTriangle className="text-orange-400" size={18} />
              <h3 className="text-white font-bold">Report Answer</h3>
            </div>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              className="input-field resize-none mb-4"
              rows={3}
              placeholder="Why is this answer inappropriate?"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleReport}
                disabled={reporting || !reportReason.trim()}
                className="btn-danger flex-1 flex items-center justify-center gap-2"
              >
                {reporting && (
                  <div className="w-3 h-3 border border-white/30 border-t-white
                                  rounded-full animate-spin" />
                )}
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

// ─────────────────────────────────────────────────────────────────────────────
// Question List Card
// ─────────────────────────────────────────────────────────────────────────────
const QuestionListCard = ({ question }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/student/qa-forum/${question._id}`)}
      className="card group hover:border-lms-secondary/50 transition-all
                 cursor-pointer"
    >
      <div className="flex gap-4">
        {/* Stats */}
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="flex flex-col items-center p-2 bg-lms-darkest rounded-lg
                          border border-lms-primary/20 min-w-[52px] text-center">
            <FiArrowUp className="text-lms-secondary mx-auto" size={13} />
            <span className="text-white font-bold text-sm">
              {question.upvotes?.length || 0}
            </span>
            <span className="text-slate-500 text-xs">votes</span>
          </div>
          {question.acceptedAnswer && (
            <div className="flex flex-col items-center p-1.5 bg-green-900/30
                            rounded-lg border border-green-700/30 min-w-[52px]">
              <FiCheck className="text-green-400 mx-auto" size={13} />
              <span className="text-green-400 text-xs">solved</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm mb-1 leading-snug
                         group-hover:text-lms-secondary transition-colors
                         line-clamp-2">
            {question.title}
          </h3>
          <p className="text-slate-400 text-xs mb-3 line-clamp-2">
            {question.body}
          </p>

          <div className="flex flex-wrap gap-1.5 mb-3">
            <span className="px-2 py-0.5 bg-lms-accent/30 text-lms-muted
                             border border-lms-accent/30 rounded-full text-xs">
              {question.subject}
            </span>
            {question.tags?.slice(0, 3).map((tag) => (
              <span key={tag}
                    className="flex items-center gap-1 px-2 py-0.5
                               bg-lms-primary/20 text-slate-400 rounded-full text-xs">
                <FiTag size={9} /> {tag}
              </span>
            ))}
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
            <span className="flex items-center gap-1 text-xs text-lms-secondary
                             group-hover:gap-1.5 transition-all">
              View <FiChevronRight size={13} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Forum List Page
// ─────────────────────────────────────────────────────────────────────────────
const ForumListPage = () => {
  const navigate = useNavigate();

  const [questions, setQuestions]     = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [totalPages, setTotalPages]   = useState(1);
  const [total, setTotal]             = useState(0);

  const fetchQuestions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await qaApi.getQuestions({ search, page, limit: 10 });
      setQuestions(res.data.data.questions || []);
      setTotal(res.data.data.total || 0);
      setTotalPages(res.data.data.pages || 1);
    } catch {
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const handlePostQuestion = async (formData) => {
    try {
      setFormLoading(true);
      const res = await qaApi.createQuestion(formData);
      toast.success('Question posted!');
      setShowForm(false);
      // Navigate to the new question's detail page
      navigate(`/student/qa-forum/${res.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post question');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Q&amp;A Forum</h1>
          <p className="text-slate-400 text-sm mt-0.5">
            {total} question{total !== 1 ? 's' : ''} — ask, answer, learn together
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto"
        >
          {showForm ? <FiX size={15} /> : <FiPlus size={15} />}
          {showForm ? 'Cancel' : 'Ask Question'}
        </button>
      </div>

      {/* Question form */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
            <FiEdit2 className="text-lms-secondary" size={16} />
            Post a Question
          </h2>
          <QuestionForm
            onSubmit={handlePostQuestion}
            isLoading={formLoading}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Search */}
      <div className="relative mb-6">
        <FiSearch
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          size={14}
        />
        <input
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-field pl-9"
          placeholder="Search questions..."
        />
        {search && (
          <button
            onClick={() => { setSearch(''); setPage(1); }}
            className="absolute right-3 top-1/2 -translate-y-1/2
                       text-slate-500 hover:text-white transition-colors"
          >
            <FiX size={14} />
          </button>
        )}
      </div>

      {/* Questions */}
      {loading ? (
        <LoadingSpinner />
      ) : questions.length === 0 ? (
        <div className="card text-center py-16">
          <FiMessageSquare className="mx-auto text-slate-600 mb-3" size={36} />
          <p className="text-white font-medium">No questions yet</p>
          <p className="text-slate-400 text-sm mt-1">
            {search ? 'Try different search terms' : 'Be the first to ask!'}
          </p>
          {!search && (
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary mt-4 mx-auto"
            >
              Ask the First Question
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {questions.map((q) => (
              <QuestionListCard key={q._id} question={q} />
            ))}
          </div>
          <Pagination page={page} pages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Root export — handles sub-routing
// ─────────────────────────────────────────────────────────────────────────────
const StudentQAForum = () => (
  <Routes>
    <Route index element={<ForumListPage />} />
    <Route path=":id" element={<QuestionDetailPage />} />
  </Routes>
);

export default StudentQAForum;