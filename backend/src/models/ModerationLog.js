import mongoose from 'mongoose';

const moderationLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: String,
      required: true,
    },
    adminName: {
      type: String,
      default: 'Admin',
    },
    action: {
      type: String,
      enum: [
        'delete_comment',
        'delete_note',
        'delete_question',
        'delete_answer',
        'approve_note',
        'reject_note',
        'warn_user',
        'suspend_user',
        'dismiss_report',
        'flag_content',
      ],
      required: true,
    },
    targetType: {
      type: String,
      default: null,
    },
    targetId: {
      type: String,
      default: null,
    },
    targetUserId: {
      type: String,
      default: null,
    },
    reason: {
      type: String,
      default: null,
    },
    details: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

const ModerationLog = mongoose.model('ModerationLog', moderationLogSchema);
export default ModerationLog;