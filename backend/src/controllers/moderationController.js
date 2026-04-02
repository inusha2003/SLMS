import Report from '../models/Report.js';
import ModerationLog from '../models/ModerationLog.js';
import Comment from '../models/Comment.js';
import Note from '../models/Note.js';
import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

export const getReports = async (req, res) => {
  try {
    const { status, contentType } = req.query;
    const query = {};
    if (status) query.status = status;
    if (contentType) query.contentType = contentType;

    const reports = await Report.find(query).sort({ createdAt: -1 }).lean();
    return successResponse(res, 200, 'Reports fetched', reports);
  } catch (error) {
    console.error('❌ getReports error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export const reviewReport = async (req, res) => {
  try {
    const { action, reason } = req.body;
    const report = await Report.findById(req.params.id);
    if (!report) return errorResponse(res, 404, 'Report not found');

    report.status = action === 'dismiss' ? 'dismissed' : 'reviewed';
    report.reviewedBy = req.user.userId;
    report.reviewedAt = new Date();
    report.actionTaken = action;
    await report.save();

    await ModerationLog.create({
      adminId: req.user.userId,
      adminName: req.user.name || 'Admin',
      action: 'dismiss_report',
      targetType: report.contentType,
      targetId: report.contentId,
      reason: reason || null,
      details: `Report ${action === 'dismiss' ? 'dismissed' : 'reviewed'}`,
    }).catch((e) => console.error('Log error:', e.message));

    return successResponse(res, 200, 'Report reviewed', report);
  } catch (error) {
    console.error('❌ reviewReport error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export const deleteReportedContent = async (req, res) => {
  try {
    const { contentType, contentId, reason } = req.body;

    if (!contentType || !contentId) {
      return errorResponse(res, 400, 'contentType and contentId are required');
    }

    let actionName = '';

    switch (contentType) {
      case 'comment':
        await Comment.findByIdAndUpdate(contentId, {
          isDeleted: true,
          content: '[Removed by moderator]',
        });
        actionName = 'delete_comment';
        break;
      case 'note':
        await Note.findByIdAndUpdate(contentId, { isFlagged: true });
        actionName = 'delete_note';
        break;
      case 'question':
        await Question.findByIdAndUpdate(contentId, { isDeleted: true });
        actionName = 'delete_question';
        break;
      case 'answer':
        await Answer.findByIdAndUpdate(contentId, { isDeleted: true });
        actionName = 'delete_answer';
        break;
      default:
        return errorResponse(res, 400, `Invalid content type: ${contentType}`);
    }

    await ModerationLog.create({
      adminId: req.user.userId,
      adminName: req.user.name || 'Admin',
      action: actionName,
      targetType: contentType,
      targetId: contentId,
      reason: reason || 'Moderation action',
    }).catch((e) => console.error('Log error:', e.message));

    return successResponse(res, 200, 'Content removed by moderator');
  } catch (error) {
    console.error('❌ deleteReportedContent error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export const getModerationLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [total, logs] = await Promise.all([
      ModerationLog.countDocuments(),
      ModerationLog.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    ]);

    return successResponse(res, 200, 'Moderation logs fetched', {
      logs,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('❌ getModerationLogs error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export const getFlaggedNotes = async (req, res) => {
  try {
    const notes = await Note.find({ isFlagged: true }).sort({ updatedAt: -1 }).lean();
    return successResponse(res, 200, 'Flagged notes fetched', notes);
  } catch (error) {
    console.error('❌ getFlaggedNotes error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export const warnUser = async (req, res) => {
  try {
    const { targetUserId, reason } = req.body;
    if (!targetUserId || !reason) {
      return errorResponse(res, 400, 'targetUserId and reason are required');
    }

    await ModerationLog.create({
      adminId: req.user.userId,
      adminName: req.user.name || 'Admin',
      action: 'warn_user',
      targetUserId,
      reason,
      details: `Warning issued to user ${targetUserId}: ${reason}`,
    });

    return successResponse(res, 200, 'Warning issued and logged');
  } catch (error) {
    console.error('❌ warnUser error:', error);
    return errorResponse(res, 500, error.message);
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const [
      totalNotes,
      pendingNotes,
      approvedNotes,
      rejectedNotes,
      totalQuestions,
      pendingReports,
    ] = await Promise.all([
      Note.countDocuments({}),
      Note.countDocuments({ status: 'pending' }),
      Note.countDocuments({ status: 'approved' }),
      Note.countDocuments({ status: 'rejected' }),
      Question.countDocuments({ isDeleted: false }),
      Report.countDocuments({ status: 'pending' }),
    ]);

    return successResponse(res, 200, 'Stats fetched successfully', {
      totalNotes,
      pendingNotes,
      approvedNotes,
      rejectedNotes,
      totalQuestions,
      pendingReports,
    });
  } catch (error) {
    console.error('❌ getDashboardStats error:', error);
    return errorResponse(res, 500, `Failed to fetch stats: ${error.message}`);
  }
};