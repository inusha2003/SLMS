import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Question title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    body: {
      type: String,
      required: [true, 'Question body is required'],
      trim: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    fileUrl: {
      type: String,
      default: null,
    },
    fileName: {
      type: String,
      default: null,
    },
    author: {
      type: String,
      required: true,
    },
    authorName: {
      type: String,
      required: true,
    },
    upvotes: {
      type: [String],
      default: [],
    },
    acceptedAnswer: {
      type: String,
      default: null,
    },
    isFlagged: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    viewCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

questionSchema.index({ title: 'text', body: 'text', subject: 'text' });

const Question = mongoose.model('Question', questionSchema);
export default Question;