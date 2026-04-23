import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { qaApi } from '../../api/qaApi';
import QuestionForm from '../../components/qa/QuestionForm';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import Pagination from '../../components/common/Pagination';
import ConfirmModal from '../../components/common/ConfirmModal';
import {
  FiPlus,
  FiX,
  FiSearch,
  FiArrowLeft,
  FiArrowUp,
  FiTag,
  FiEye,
  FiClock,
  FiCheck,
  FiMessageSquare,
  FiSend,
  FiEdit2,
  FiTrash2,
  FiFlag,
  FiAlertTriangle,
  FiMoreVertical,
  FiChevronRight,
} from 'react-icons/fi';
import { timeAgo } from '../../utils/formatDate';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';

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
  const [saving, setSaving] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = answer.author === user?.userId;
  const isQuestionOwner = questionAuthorId === user?.userId;
  const isUpvoted = answer.upvotes?.includes(user?.userId);

  const handleSave = async () => {
    if (!editBody.trim()) return;
    setSaving(true);
    await onEdit(answer._id, editBody.trim());
    setSaving(false);
    setShowEdit(false);
  };

  return (
    <article
      className={`overflow-hidden rounded-[26px] border px-5 py-5 shadow-[0_20px_55px_rgba(8,10,24,0.16)] ${
        answer.isAccepted
          ? 'border-emerald-500/25 bg-emerald-500/[0.07]'
          : 'border-white/8 bg-[#2b2340]'
      }`}
    >
      {answer.isAccepted && (
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/12 px-3 py-1 text-xs font-semibold text-emerald-400">
          <FiCheck size={12} />
          Accepted Answer
        </div>
      )}

      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <button
            onClick={() => onUpvote(answer._id)}
            className={`flex min-w-[56px] flex-col items-center rounded-2xl border px-3 py-3 text-center transition-all ${
              isUpvoted
                ? 'border-indigo-400/30 bg-indigo-500/15 text-indigo-200'
                : 'border-white/8 bg-[#1e1830] text-slate-400 hover:border-indigo-400/25 hover:text-white'
            }`}
          >
            <FiArrowUp size={14} />
            <span className="mt-1 text-base font-black">{answer.upvotes?.length || 0}</span>
            <span className="text-[11px]">votes</span>
          </button>

          {isQuestionOwner && !answer.isAccepted && (
            <button
              onClick={() => onAccept(answer._id)}
              className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/18"
            >
              Accept
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#6366f1,#7c3aed)] text-sm font-bold text-white">
                {answer.authorName?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{answer.authorName}</p>
                <p className="text-xs text-slate-500">{timeAgo(answer.createdAt)}</p>
              </div>
            </div>

            <div className="relative">
              <button
                onClick={() => setShowMenu((value) => !value)}
                className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-white"
              >
                <FiMoreVertical size={15} />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-11 z-20 min-w-[150px] overflow-hidden rounded-2xl border border-white/10 bg-[#211a33] shadow-xl">
                  {isOwner && (
                    <>
                      <button
                        onClick={() => {
                          setShowEdit(true);
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-slate-300 transition-colors hover:bg-white/[0.04] hover:text-white"
                      >
                        <FiEdit2 size={13} />
                        Edit Answer
                      </button>
                      <button
                        onClick={() => {
                          onDelete(answer._id);
                          setShowMenu(false);
                        }}
                        className="flex w-full items-center gap-2 px-4 py-3 text-sm text-rose-300 transition-colors hover:bg-rose-500/10 hover:text-rose-200"
                      >
                        <FiTrash2 size={13} />
                        Delete Answer
                      </button>
                    </>
                  )}

                  {!isOwner && (
                    <button
                      onClick={() => {
                        onReport(answer._id);
                        setShowMenu(false);
                      }}
                      className="flex w-full items-center gap-2 px-4 py-3 text-sm text-amber-300 transition-colors hover:bg-amber-500/10 hover:text-amber-200"
                    >
                      <FiFlag size={13} />
                      Report Answer
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {showEdit ? (
            <div className="space-y-3">
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                rows={5}
                className="w-full rounded-[22px] border border-white/10 bg-[#1e1830] px-4 py-4 text-sm leading-7 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-indigo-400/30"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !editBody.trim()}
                  className="inline-flex items-center gap-2 rounded-2xl border border-indigo-400/25 bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(79,70,229,0.82))] px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {saving && <div className="h-3.5 w-3.5 rounded-full border border-white/30 border-t-white animate-spin" />}
                  Save
                </button>
                <button
                  onClick={() => {
                    setShowEdit(false);
                    setEditBody(answer.body);
                  }}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition-colors hover:text-white"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-200">{answer.body}</p>
          )}
        </div>
      </div>
    </article>
  );
};

const QuestionDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [question, setQuestion] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answerText, setAnswerText] = useState('');
  const [posting, setPosting] = useState(false);
  const [upvotingQuestion, setUpvotingQuestion] = useState(false);
  const [deleteModal, setDeleteModal] = useState({ open: false, type: '', id: '' });
  const [reportModal, setReportModal] = useState({ open: false, id: '' });
  const [reportReason, setReportReason] = useState('');
  const [reporting, setReporting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await qaApi.getQuestion(id);
      const { question: currentQuestion, answers: currentAnswers } = res.data.data;
      setQuestion(currentQuestion);
      setAnswers(currentAnswers || []);
    } catch (err) {
      console.error('Failed to load question:', err);
      toast.error('Question not found');
      navigate('/student/qa-forum', { replace: true });
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      await fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post answer');
    } finally {
      setPosting(false);
    }
  };

  const handleUpvoteQuestion = async () => {
    try {
      setUpvotingQuestion(true);
      await qaApi.upvoteQuestion(id);
      await fetchData();
    } catch {
      toast.error('Failed to upvote');
    } finally {
      setUpvotingQuestion(false);
    }
  };

  const handleUpvoteAnswer = async (answerId) => {
    try {
      await qaApi.upvoteAnswer(answerId);
      await fetchData();
    } catch {
      toast.error('Failed to upvote');
    }
  };

  const handleAcceptAnswer = async (answerId) => {
    try {
      await qaApi.acceptAnswer(id, answerId);
      toast.success('Answer marked as accepted!');
      await fetchData();
    } catch {
      toast.error('Failed to accept answer');
    }
  };

  const handleEditAnswer = async (answerId, body) => {
    try {
      await qaApi.updateAnswer(answerId, { body });
      toast.success('Answer updated!');
      await fetchData();
    } catch {
      toast.error('Failed to update answer');
    }
  };

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

  const handleDeleteQuestion = async () => {
    try {
      await qaApi.deleteQuestion(id);
      toast.success('Question deleted');
      navigate('/student/qa-forum', { replace: true });
    } catch {
      toast.error('Failed to delete question');
    }
  };

  const handleReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Please provide a reason');
      return;
    }

    try {
      setReporting(true);
      await qaApi.reportContent({
        contentType: 'answer',
        contentId: reportModal.id,
        reason: reportReason.trim(),
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

  const isQuestionOwner = question.author === user?.userId;
  const isQuestionUpvoted = question.upvotes?.includes(user?.userId);

  return (
    <div className="mx-auto max-w-5xl">
      <button
        onClick={() => navigate('/student/qa-forum')}
        className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition-colors hover:border-indigo-400/35 hover:text-white"
      >
        <FiArrowLeft size={15} />
        Back to Q&A Forum
      </button>

      <section className="mb-8 rounded-[30px] border border-white/8 bg-[#2b2340] px-6 py-6 shadow-[0_24px_55px_rgba(8,10,24,0.18)]">
        <div className="flex gap-5">
          <div className="flex flex-col items-center gap-3 flex-shrink-0">
            <button
              onClick={handleUpvoteQuestion}
              disabled={upvotingQuestion}
              className={`flex min-w-[66px] flex-col items-center rounded-2xl border px-4 py-4 text-center transition-all ${
                isQuestionUpvoted
                  ? 'border-indigo-400/30 bg-indigo-500/15 text-indigo-100'
                  : 'border-white/8 bg-[#1e1830] text-slate-400 hover:border-indigo-400/25 hover:text-white'
              }`}
            >
              <FiArrowUp size={18} />
              <span className="mt-1 text-xl font-black text-white">{question.upvotes?.length || 0}</span>
              <span className="text-xs opacity-70">votes</span>
            </button>

            {question.acceptedAnswer && (
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/12 px-3 py-2 text-center text-xs font-semibold text-emerald-400">
                Solved
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h1 className="text-3xl font-black leading-tight text-white">{question.title}</h1>
              {isQuestionOwner && (
                <button
                  onClick={() => setDeleteModal({ open: true, type: 'question', id: question._id })}
                  className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
                  title="Delete question"
                >
                  <FiTrash2 size={15} />
                </button>
              )}
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/6 bg-[#3a3155] px-3 py-1 text-xs font-medium text-slate-300">
                {question.subject}
              </span>
              {question.tags?.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full border border-white/6 bg-[#342b4e] px-3 py-1 text-xs text-slate-300"
                >
                  <FiTag size={9} /> {tag}
                </span>
              ))}
            </div>

            <p className="mb-5 whitespace-pre-wrap text-sm leading-8 text-slate-200">{question.body}</p>

            <div className="flex flex-wrap items-center gap-4 border-t border-white/6 pt-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FiClock size={10} /> {timeAgo(question.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FiEye size={10} /> {question.viewCount || 0} views
              </span>
              <span className="text-lms-muted">by {question.authorName}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h2 className="mb-5 flex items-center gap-2 text-xl font-bold text-white">
          <FiMessageSquare className="text-indigo-300" size={18} />
          {answers.length} Answer{answers.length !== 1 ? 's' : ''}
          {question.acceptedAnswer && (
            <span className="ml-2 rounded-full border border-emerald-500/20 bg-emerald-500/12 px-3 py-1 text-xs font-medium text-emerald-400">
              Solved
            </span>
          )}
        </h2>

        {answers.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-[#2b2340] px-6 py-14 text-center">
            <FiMessageSquare className="mx-auto mb-3 text-slate-600" size={34} />
            <p className="text-lg font-semibold text-white">No answers yet</p>
            <p className="mt-2 text-sm text-slate-400">Be the first to answer this question.</p>
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
                onDelete={(answerId) => setDeleteModal({ open: true, type: 'answer', id: answerId })}
                onReport={(answerId) => {
                  setReportModal({ open: true, id: answerId });
                  setReportReason('');
                }}
              />
            ))}
          </div>
        )}
      </section>

      <section className="rounded-[30px] border border-white/8 bg-[#2b2340] px-6 py-6 shadow-[0_24px_55px_rgba(8,10,24,0.18)]">
        <h3 className="mb-2 flex items-center gap-2 text-xl font-bold text-white">
          <FiSend className="text-indigo-300" size={17} />
          Your Answer
        </h3>
        <p className="mb-4 text-sm text-slate-400">Write a clear, detailed answer. Be respectful and helpful.</p>

        <textarea
          value={answerText}
          onChange={(e) => setAnswerText(e.target.value)}
          rows={6}
          className="w-full rounded-[24px] border border-white/10 bg-[#1e1830] px-5 py-4 text-sm leading-8 text-white outline-none transition-colors placeholder:text-slate-500 focus:border-indigo-400/30"
          placeholder="Share your knowledge. Explain step by step if needed..."
        />

        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">{answerText.length} / 5000</span>
          <div className="flex items-center gap-3">
            {answerText && (
              <button
                onClick={() => setAnswerText('')}
                className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-slate-300 transition-colors hover:text-white"
              >
                Clear
              </button>
            )}
            <button
              onClick={handlePostAnswer}
              disabled={posting || !answerText.trim()}
              className="inline-flex items-center gap-2 rounded-2xl border border-indigo-400/25 bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(79,70,229,0.82))] px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {posting ? (
                <div className="h-4 w-4 rounded-full border border-white/30 border-t-white animate-spin" />
              ) : (
                <FiSend size={14} />
              )}
              {posting ? 'Posting...' : 'Post Answer'}
            </button>
          </div>
        </div>
      </section>

      <ConfirmModal
        isOpen={deleteModal.open}
        title={`Delete ${deleteModal.type === 'question' ? 'Question' : 'Answer'}`}
        message={
          deleteModal.type === 'question'
            ? 'Delete this question? All answers will also be removed. This cannot be undone.'
            : 'Delete this answer? This cannot be undone.'
        }
        onConfirm={deleteModal.type === 'question' ? handleDeleteQuestion : handleDeleteAnswer}
        onCancel={() => setDeleteModal({ open: false, type: '', id: '' })}
        confirmText="Delete"
        danger
      />

      {reportModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#211a33] p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-2">
              <FiAlertTriangle className="text-amber-400" size={18} />
              <h3 className="text-lg font-bold text-white">Report Answer</h3>
            </div>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              rows={4}
              className="w-full rounded-[22px] border border-white/10 bg-[#1e1830] px-4 py-4 text-sm text-white outline-none transition-colors placeholder:text-slate-500 focus:border-amber-400/30"
              placeholder="Why is this answer inappropriate?"
              autoFocus
            />
            <div className="mt-4 flex gap-3">
              <button
                onClick={handleReport}
                disabled={reporting || !reportReason.trim()}
                className="flex-1 rounded-2xl border border-amber-500/25 bg-amber-500/12 px-4 py-3 text-sm font-semibold text-amber-200 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {reporting ? 'Submitting...' : 'Submit Report'}
              </button>
              <button
                onClick={() => {
                  setReportModal({ open: false, id: '' });
                  setReportReason('');
                }}
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-300 transition-colors hover:text-white"
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

const QuestionListCard = ({ question }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/student/qa-forum/${question._id}`)}
      className="group cursor-pointer overflow-hidden rounded-[28px] border border-white/8 bg-[#2b2340] px-5 py-5 shadow-[0_22px_50px_rgba(8,10,24,0.18)] transition-all duration-200 hover:border-indigo-400/25 hover:bg-[#302748]"
    >
      <div className="flex gap-5">
        <div className="flex flex-col items-center gap-3 flex-shrink-0">
          <div className="flex min-w-[58px] flex-col items-center rounded-2xl border border-white/6 bg-[#1e1830] px-3 py-3 text-center">
            <FiArrowUp className="mx-auto text-indigo-300" size={14} />
            <span className="mt-1 text-lg font-black text-white">{question.upvotes?.length || 0}</span>
            <span className="text-xs text-slate-500">votes</span>
          </div>
          {question.acceptedAnswer && (
            <div className="flex min-w-[58px] flex-col items-center rounded-2xl border border-emerald-500/20 bg-emerald-500/12 px-2 py-2">
              <FiCheck className="mx-auto text-emerald-400" size={14} />
              <span className="mt-1 text-xs font-semibold text-emerald-400">solved</span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="mb-2 line-clamp-2 text-2xl font-bold leading-snug text-white transition-colors group-hover:text-indigo-200">
            {question.title}
          </h3>
          <p className="mb-4 line-clamp-2 text-sm leading-7 text-slate-400">{question.body}</p>

          <div className="mb-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/6 bg-[#3a3155] px-3 py-1 text-xs font-medium text-slate-300">
              {question.subject}
            </span>
            {question.tags?.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full border border-white/6 bg-[#342b4e] px-3 py-1 text-xs text-slate-300"
              >
                <FiTag size={9} /> {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-white/6 pt-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <FiClock size={10} /> {timeAgo(question.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <FiEye size={10} /> {question.viewCount || 0}
              </span>
              <span className="text-lms-muted">by {question.authorName}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-300 transition-all group-hover:gap-1.5 group-hover:text-white">
              View <FiChevronRight size={15} />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ForumListPage = () => {
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

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

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const handlePostQuestion = async (formData) => {
    try {
      setFormLoading(true);
      const res = await qaApi.createQuestion(formData);
      toast.success('Question posted!');
      setShowForm(false);
      navigate(`/student/qa-forum/${res.data.data._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to post question');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-[1320px]">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white">Q&amp;A Forum</h1>
          <p className="mt-2 text-lg text-slate-400">
            {total} question{total !== 1 ? 's' : ''} - ask, answer, learn together
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="inline-flex items-center gap-2 self-start rounded-2xl border border-indigo-400/25 bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(79,70,229,0.82))] px-5 py-3 text-sm font-semibold text-white shadow-[0_16px_34px_rgba(79,70,229,0.2)] transition-transform hover:-translate-y-0.5"
        >
          {showForm ? <FiX size={15} /> : <FiPlus size={15} />}
          {showForm ? 'Cancel' : 'Ask Question'}
        </button>
      </div>

      {showForm && (
        <div className="mb-6 rounded-[28px] border border-white/8 bg-[#2b2340] px-6 py-6 shadow-[0_22px_50px_rgba(8,10,24,0.18)]">
          <h2 className="mb-4 flex items-center gap-2 text-xl font-bold text-white">
            <FiEdit2 className="text-indigo-300" size={16} />
            Post a Question
          </h2>
          <QuestionForm
            onSubmit={handlePostQuestion}
            isLoading={formLoading}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="relative mb-6">
        <FiSearch className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
        <input
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="w-full rounded-[20px] border border-white/10 bg-[#211a33] py-4 pl-14 pr-12 text-base text-white outline-none transition-colors placeholder:text-slate-500 focus:border-indigo-400/35"
          placeholder="Search questions..."
        />
        {search && (
          <button
            onClick={() => {
              setSearch('');
              setPage(1);
            }}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-500 transition-colors hover:text-white"
          >
            <FiX size={14} />
          </button>
        )}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : questions.length === 0 ? (
        <div className="rounded-[28px] border border-dashed border-white/10 bg-[#2b2340] px-6 py-16 text-center">
          <FiMessageSquare className="mx-auto mb-3 text-slate-600" size={36} />
          <p className="text-xl font-semibold text-white">No questions yet</p>
          <p className="mt-2 text-sm text-slate-400">
            {search ? 'Try different search terms' : 'Be the first to ask!'}
          </p>
          {!search && (
            <button
              onClick={() => setShowForm(true)}
              className="mt-5 inline-flex rounded-2xl border border-indigo-400/25 bg-[linear-gradient(135deg,rgba(99,102,241,0.95),rgba(79,70,229,0.82))] px-5 py-3 text-sm font-semibold text-white"
            >
              Ask the First Question
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {questions.map((question) => (
              <QuestionListCard key={question._id} question={question} />
            ))}
          </div>
          <Pagination page={page} pages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

const StudentQAForum = () => (
  <Routes>
    <Route index element={<ForumListPage />} />
    <Route path=":id" element={<QuestionDetailPage />} />
  </Routes>
);

export default StudentQAForum;
