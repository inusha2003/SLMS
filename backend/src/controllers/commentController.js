import Comment from '../models/Comment.js';
import Note from '../models/Note.js';
import Report from '../models/Report.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// Post a comment
export const createComment = async (req, res) => {
  try {
    const { content, parentComment } = req.body;
    const note = await Note.findById(req.params.noteId);

    if (!note || note.status !== 'approved') {
      return errorResponse(res, 404, 'Note not found or not accessible');
    }

    const comment = new Comment({
      noteId: req.params.noteId,
      author: req.user.userId,
      authorName: req.user.name || req.user.email || 'User',
      content,
      parentComment: parentComment || null,
    });

    await comment.save();
    return successResponse(res, 201, 'Comment posted successfully', comment);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Get comments for a note
export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      noteId: req.params.noteId,
      isDeleted: false,
    }).sort({ createdAt: 1 });

    return successResponse(res, 200, 'Comments fetched', comments);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Edit comment
export const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return errorResponse(res, 404, 'Comment not found');

    if (comment.author.toString() !== req.user.userId && req.user.role !== 'Admin') {
      return errorResponse(res, 403, 'You can only edit your own comments');
    }

    comment.content = req.body.content;
    await comment.save();
    return successResponse(res, 200, 'Comment updated', comment);
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Delete comment
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return errorResponse(res, 404, 'Comment not found');

    if (comment.author.toString() !== req.user.userId && req.user.role !== 'Admin') {
      return errorResponse(res, 403, 'You can only delete your own comments');
    }

    comment.isDeleted = true;
    comment.content = '[This comment has been deleted]';
    await comment.save();

    return successResponse(res, 200, 'Comment deleted');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Like/Unlike comment
export const toggleLike = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) return errorResponse(res, 404, 'Comment not found');

    const userId = req.user.userId;
    const liked = comment.likes.some((id) => id.toString() === userId);

    if (liked) {
      comment.likes = comment.likes.filter((id) => id.toString() !== userId);
    } else {
      comment.likes.push(userId);
    }

    await comment.save();
    return successResponse(res, 200, liked ? 'Like removed' : 'Comment liked', {
      likes: comment.likes.length,
      liked: !liked,
    });
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};

// Report comment
export const reportComment = async (req, res) => {
  try {
    const { reason } = req.body;
    const comment = await Comment.findById(req.params.id);
    if (!comment) return errorResponse(res, 404, 'Comment not found');

    comment.isReported = true;
    comment.reportReason = reason;
    comment.reportedBy = req.user.userId;
    await comment.save();

    await Report.create({
      contentType: 'comment',
      contentId: comment._id,
      reportedBy: req.user.userId,
      reporterName: req.user.name || 'User',
      reason,
    });

    return successResponse(res, 200, 'Comment reported for review');
  } catch (error) {
    return errorResponse(res, 500, error.message);
  }
};