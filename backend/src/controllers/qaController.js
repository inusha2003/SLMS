import Question from '../models/Question.js';
import Answer from '../models/Answer.js';
import Report from '../models/Report.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';

// ── Create Question ───────────────────────────────────────────────────────────
export const createQuestion = async (req, res) => {
  try {
    const { title, body, subject, tags } = req.body;

    if (!title?.trim())   return errorResponse(res, 400, 'Title is required');
    if (!body?.trim())    return errorResponse(res, 400, 'Question body is required');
    if (!subject?.trim()) return errorResponse(res, 400, 'Subject is required');

    let parsedTags = [];
    if (tags) {
      parsedTags = Array.isArray(tags)
        ? tags.filter(Boolean)
        : tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    const question = new Question({
      title:      title.trim(),
      body:       body.trim(),
      subject:    subject.trim(),
      tags:       parsedTags,
      author:     req.user.userId,
      authorName: req.user.name || req.user.email || 'Student',
      fileUrl:    req.file ? `/uploads/${req.file.filename}` : null,
      fileName:   req.file ? req.file.originalname : null,
    });

    await question.save();
    console.log('✅ Question created:', question._id.toString());
    return successResponse(res, 201, 'Question posted successfully', question);
  } catch (error) {
    console.error('❌ createQuestion error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// ── Get All Questions ─────────────────────────────────────────────────────────
export const getQuestions = async (req, res) => {
  try {
    const { search, subject, page = 1, limit = 10 } = req.query;
    const query = { isDeleted: false };

    if (search?.trim()) {
      query.$or = [
        { title:   { $regex: search.trim(), $options: 'i' } },
        { body:    { $regex: search.trim(), $options: 'i' } },
        { subject: { $regex: search.trim(), $options: 'i' } },
      ];
    }
    if (subject?.trim()) {
      query.subject = { $regex: subject.trim(), $options: 'i' };
    }

    const pageNum  = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip     = (pageNum - 1) * limitNum;

    const [total, questions] = await Promise.all([
      Question.countDocuments(query),
      Question.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
    ]);

    return successResponse(res, 200, 'Questions fetched', {
      questions,
      total,
      page:  pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('❌ getQuestions error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// ── Get Question By ID ────────────────────────────────────────────────────────
export const getQuestionById = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id).lean();
    if (!question || question.isDeleted) {
      return errorResponse(res, 404, 'Question not found');
    }

    // Increment view count separately
    await Question.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });

    // Get question ID as string for reliable matching
    const questionIdStr = question._id.toString();
    console.log('🔍 Fetching answers for questionId:', questionIdStr);

    // Fetch answers - use regex-style OR both string and ObjectId matching
    const answers = await Answer.find({
      questionId: questionIdStr,
      isDeleted:  false,
    })
      .sort({ isAccepted: -1, createdAt: 1 })
      .lean();

    console.log(`✅ Found ${answers.length} answers for question ${questionIdStr}`);

    return successResponse(res, 200, 'Question fetched', {
      question: { ...question, viewCount: (question.viewCount || 0) + 1 },
      answers,
    });
  } catch (error) {
    console.error('❌ getQuestionById error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// ── Update Question ───────────────────────────────────────────────────────────
export const updateQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return errorResponse(res, 404, 'Question not found');

    if (question.author !== req.user.userId && req.user.role !== 'Admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { title, body, subject, tags } = req.body;
    if (title?.trim())   question.title   = title.trim();
    if (body?.trim())    question.body    = body.trim();
    if (subject?.trim()) question.subject = subject.trim();
    if (tags !== undefined) {
      question.tags = Array.isArray(tags)
        ? tags.filter(Boolean)
        : tags.split(',').map((t) => t.trim()).filter(Boolean);
    }

    await question.save();
    return successResponse(res, 200, 'Question updated', question);
  } catch (error) {
    console.error('❌ updateQuestion error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// ── Delete Question ───────────────────────────────────────────────────────────
export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return errorResponse(res, 404, 'Question not found');

    if (question.author !== req.user.userId && req.user.role !== 'Admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    question.isDeleted = true;
    await question.save();

    // Also soft-delete all answers for this question
    await Answer.updateMany(
      { questionId: question._id.toString() },
      { isDeleted: true }
    );

    return successResponse(res, 200, 'Question deleted');
  } catch (error) {
    console.error('❌ deleteQuestion error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// ── Upvote Question ───────────────────────────────────────────────────────────
export const upvoteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question) return errorResponse(res, 404, 'Question not found');

    const userId   = req.user.userId;
    const hasVoted = question.upvotes.includes(userId);

    if (hasVoted) {
      question.upvotes = question.upvotes.filter((id) => id !== userId);
    } else {
      question.upvotes.push(userId);
    }

    await question.save();
    return successResponse(res, 200, 'Vote updated', {
      upvotes: question.upvotes.length,
    });
  } catch (error) {
    console.error('❌ upvoteQuestion error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// ── Create Answer ─────────────────────────────────────────────────────────────
export const createAnswer = async (req, res) => {
  try {
    const { body } = req.body;
    if (!body?.trim()) return errorResponse(res, 400, 'Answer body is required');

    const question = await Question.findById(req.params.questionId);
    if (!question || question.isDeleted) {
      return errorResponse(res, 404, 'Question not found');
    }

    // Always store questionId as string
    const questionIdStr = question._id.toString();

    const answer = new Answer({
      questionId: questionIdStr,
      body:       body.trim(),
      author:     req.user.userId,
      authorName: req.user.role === 'Admin'
        ? `${req.user.name || 'Admin'} 👮`
        : req.user.name || req.user.email || 'Student',
    });

    await answer.save();
    console.log('✅ Answer saved with questionId:', questionIdStr);
    return successResponse(res, 201, 'Answer posted', answer);
  } catch (error) {
    console.error('❌ createAnswer error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// ── Update Answer ─────────────────────────────────────────────────────────────
export const updateAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return errorResponse(res, 404, 'Answer not found');

    if (answer.author !== req.user.userId && req.user.role !== 'Admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    const { body } = req.body;
    if (!body?.trim()) return errorResponse(res, 400, 'Answer body is required');

    answer.body = body.trim();
    await answer.save();
    return successResponse(res, 200, 'Answer updated', answer);
  } catch (error) {
    console.error('❌ updateAnswer error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// ── Delete Answer ─────────────────────────────────────────────────────────────
export const deleteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return errorResponse(res, 404, 'Answer not found');

    if (answer.author !== req.user.userId && req.user.role !== 'Admin') {
      return errorResponse(res, 403, 'Access denied');
    }

    answer.isDeleted = true;
    await answer.save();
    return successResponse(res, 200, 'Answer deleted');
  } catch (error) {
    console.error('❌ deleteAnswer error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// ── Upvote Answer ─────────────────────────────────────────────────────────────
export const upvoteAnswer = async (req, res) => {
  try {
    const answer = await Answer.findById(req.params.id);
    if (!answer) return errorResponse(res, 404, 'Answer not found');

    const userId   = req.user.userId;
    const hasVoted = answer.upvotes.includes(userId);

    if (hasVoted) {
      answer.upvotes = answer.upvotes.filter((id) => id !== userId);
    } else {
      answer.upvotes.push(userId);
    }

    await answer.save();
    return successResponse(res, 200, 'Vote updated', {
      upvotes: answer.upvotes.length,
    });
  } catch (error) {
    console.error('❌ upvoteAnswer error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// ── Accept Answer ─────────────────────────────────────────────────────────────
export const acceptAnswer = async (req, res) => {
  try {
    const question = await Question.findById(req.params.questionId);
    if (!question) return errorResponse(res, 404, 'Question not found');

    if (question.author !== req.user.userId && req.user.role !== 'Admin') {
      return errorResponse(res, 403, 'Only the question author or admin can accept an answer');
    }

    // Unaccept all first
    await Answer.updateMany(
      { questionId: question._id.toString() },
      { isAccepted: false }
    );

    const answer = await Answer.findById(req.params.answerId);
    if (!answer) return errorResponse(res, 404, 'Answer not found');

    answer.isAccepted = true;
    await answer.save();

    question.acceptedAnswer = answer._id.toString();
    await question.save();

    return successResponse(res, 200, 'Answer accepted', answer);
  } catch (error) {
    console.error('❌ acceptAnswer error:', error);
    return errorResponse(res, 500, error.message);
  }
};

// ── Report Content ────────────────────────────────────────────────────────────
export const reportContent = async (req, res) => {
  try {
    const { reason, contentType, contentId } = req.body;

    if (!reason?.trim())  return errorResponse(res, 400, 'Reason is required');
    if (!contentType)     return errorResponse(res, 400, 'contentType is required');
    if (!contentId)       return errorResponse(res, 400, 'contentId is required');

    await Report.create({
      contentType,
      contentId,
      reportedBy:   req.user.userId,
      reporterName: req.user.name || 'User',
      reason:       reason.trim(),
    });

    if (contentType === 'question') {
      await Question.findByIdAndUpdate(contentId, { isFlagged: true });
    } else if (contentType === 'answer') {
      await Answer.findByIdAndUpdate(contentId, {
        isReported:   true,
        reportReason: reason.trim(),
      });
    }

    return successResponse(res, 200, 'Content reported for review');
  } catch (error) {
    console.error('❌ reportContent error:', error);
    return errorResponse(res, 500, error.message);
  }
};