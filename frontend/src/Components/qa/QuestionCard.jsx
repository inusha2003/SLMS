import { useNavigate } from 'react-router-dom';
import { FiArrowUp, FiMessageSquare, FiCheck, FiTag, FiClock, FiEye } from 'react-icons/fi';
import { timeAgo } from '../../utils/formatDate';

const QuestionCard = ({ question }) => {
  const navigate = useNavigate();

  return (
    <div
      className="card-hover"
      onClick={() => navigate(`/qa/${question._id}`)}
    >
      <div className="flex gap-4">
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <div className="flex flex-col items-center p-2 bg-lms-darkest rounded-lg border border-lms-primary/20 min-w-[52px]">
            <FiArrowUp className="text-lms-secondary" size={14} />
            <span className="text-white font-bold text-sm">{question.upvotes?.length || 0}</span>
            <span className="text-slate-500 text-xs">votes</span>
          </div>
          {question.acceptedAnswer && (
            <div className="flex flex-col items-center p-1.5 bg-green-900/30 rounded-lg border border-green-700/30 min-w-[52px]">
              <FiCheck className="text-green-400" size={14} />
              <span className="text-green-400 text-xs">solved</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-white font-semibold text-sm mb-2 leading-snug line-clamp-2 group-hover:text-lms-secondary transition-colors">
            {question.title}
          </h3>
          <p className="text-slate-400 text-xs mb-3 line-clamp-2">{question.body}</p>

          <div className="flex flex-wrap gap-1 mb-3">
            <span className="flex items-center gap-1 px-2 py-0.5 bg-lms-accent/30 text-lms-muted border border-lms-accent/30 rounded-full text-xs">
              {question.subject}
            </span>
            {question.tags?.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-0.5 bg-lms-primary/20 text-slate-400 rounded-full text-xs"
              >
                <FiTag size={9} />
                {tag}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <FiClock size={11} />
              {timeAgo(question.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <FiEye size={11} />
              {question.viewCount || 0} views
            </span>
            <span className="text-lms-muted">by {question.authorName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionCard;