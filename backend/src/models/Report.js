import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      enum: ['comment', 'note', 'question', 'answer'],
      required: true,
    },
    contentId: {
      type: String,
      required: true,
    },
    reportedBy: {
      type: String,
      required: true,
    },
    reporterName: {
      type: String,
      default: 'Anonymous',
    },
    reason: {
      type: String,
      required: [true, 'Report reason is required'],
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'dismissed'],
      default: 'pending',
    },
    reviewedBy: {
      type: String,
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    actionTaken: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const Report = mongoose.model('Report', reportSchema);
export default Report;