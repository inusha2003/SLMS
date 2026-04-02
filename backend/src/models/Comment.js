import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    noteId: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [2000, 'Comment cannot exceed 2000 characters'],
    },
    parentComment: {
      type: String,
      default: null,
    },
    likes: {
      type: [String],
      default: [],
    },
    isReported: {
      type: Boolean,
      default: false,
    },
    reportReason: {
      type: String,
      default: null,
    },
    reportedBy: {
      type: String,
      default: null,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Comment = mongoose.model('Comment', commentSchema);
export default Comment;