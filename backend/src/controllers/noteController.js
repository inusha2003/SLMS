import Note from '../models/Note.js';
import ModerationLog from '../models/ModerationLog.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Helper: delete file from disk ────────────────────────────────────────────
const deleteFileFromDisk = (fileUrl) => {
  if (!fileUrl) return;
  try {
    const filePath = path.join(__dirname, '..', fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log('🗑️  Deleted file:', filePath);
    }
  } catch (err) {
    console.error('⚠️  Failed to delete file:', err.message);
  }
};

// ── CREATE NOTE ───────────────────────────────────────────────────────────────
export const createNote = async (req, res) => {
  try {
    console.log('📝 Create note request');
    console.log('   Body:', req.body);
    console.log('   File:', req.file ? req.file.filename : 'none');
    console.log('   User:', req.user);

    const { title, subject, moduleCode, description, tags, visibility } = req.body;

    // Validate required fields manually for better error messages
    if (!title || title.trim() === '') {
      return errorResponse(res, 400, 'Title is required');
    }
    if (!subject || subject.trim() === '') {
      return errorResponse(res, 400, 'Subject is required');
    }
    if (!moduleCode || moduleCode.trim() === '') {
      return errorResponse(res, 400, 'Module code is required');
    }

    // Parse tags
    let parsedTags = [];
    if (tags) {
      if (Array.isArray(tags)) {
        parsedTags = tags.filter(Boolean);
      } else if (typeof tags === 'string' && tags.trim()) {
        parsedTags = tags
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean);
      }
    }

    const noteData = {
      title: title.trim(),
      subject: subject.trim(),
      moduleCode: moduleCode.trim().toUpperCase(),
      description: description ? description.trim() : '',
      tags: parsedTags,
      visibility: visibility || 'public',
      uploadedBy: req.user.userId,
      uploaderRole: req.user.role,
      // Admin-created notes are auto-approved; student notes go to pending
      status: req.user.role === 'Admin' ? 'approved' : 'pending',
    };

    // Attach file info if uploaded
    if (req.file) {
      noteData.fileUrl = `/uploads/${req.file.filename}`;
      noteData.fileName = req.file.originalname;
      noteData.fileType = req.file.mimetype;
    }

    // If admin, record approval
    if (req.user.role === 'Admin') {
      noteData.approvedBy = req.user.userId;
      noteData.approvedAt = new Date();
    }

    console.log('   Saving noteData:', noteData);

    const note = new Note(noteData);
    await note.save();

    console.log('✅ Note saved with ID:', note._id);

    // Log admin action
    if (req.user.role === 'Admin') {
      await ModerationLog.create({
        adminId: req.user.userId,
        adminName: req.user.name || 'Admin',
        action: 'approve_note',
        targetType: 'note',
        targetId: note._id.toString(),
        details: `Admin created and auto-approved note: "${title}"`,
      }).catch((e) => console.error('Log error:', e.message));
    }

    return successResponse(res, 201, 'Note created successfully', note);
  } catch (error) {
    console.error('❌ createNote error:', error);

    // If file was uploaded but note creation failed, clean up the file
    if (req.file) {
      deleteFileFromDisk(`/uploads/${req.file.filename}`);
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return errorResponse(res, 400, messages.join(', '));
    }

    return errorResponse(res, 500, `Failed to create note: ${error.message}`);
  }
};

// ── GET ALL NOTES ─────────────────────────────────────────────────────────────
export const getNotes = async (req, res) => {
  try {
    const { search, subject, status, moduleCode, page = 1, limit = 10 } = req.query;
    const query = {};

    if (req.user.role === 'Student') {
      // Students see: approved public notes OR their own notes
      query.$or = [
        { status: 'approved', visibility: 'public' },
        { uploadedBy: req.user.userId },
      ];
    }

    // Search (only if text index is available)
    if (search && search.trim()) {
      query.$or = query.$or
        ? [
            ...query.$or.map((cond) => ({ ...cond, title: { $regex: search, $options: 'i' } })),
            ...query.$or.map((cond) => ({ ...cond, subject: { $regex: search, $options: 'i' } })),
          ]
        : {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { subject: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
            ],
          };
    }

    if (subject && subject.trim()) {
      query.subject = { $regex: subject.trim(), $options: 'i' };
    }
    if (moduleCode && moduleCode.trim()) {
      query.moduleCode = { $regex: moduleCode.trim(), $options: 'i' };
    }
    if (status && req.user.role === 'Admin') {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const [total, notes] = await Promise.all([
      Note.countDocuments(query),
      Note.find(query).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
    ]);

    return successResponse(res, 200, 'Notes fetched successfully', {
      notes,
      total,
      page: pageNum,
      pages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    console.error('❌ getNotes error:', error);
    return errorResponse(res, 500, `Failed to fetch notes: ${error.message}`);
  }
};

// ── GET NOTE BY ID ────────────────────────────────────────────────────────────
export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return errorResponse(res, 404, 'Note not found');

    // Access control for students
    if (req.user.role === 'Student') {
      const isOwner = note.uploadedBy === req.user.userId;
      const isPublicApproved = note.status === 'approved' && note.visibility === 'public';

      if (!isOwner && !isPublicApproved) {
        return errorResponse(res, 403, 'Access denied to this note');
      }
    }

    // Increment view count
    await Note.findByIdAndUpdate(req.params.id, { $inc: { viewCount: 1 } });
    note.viewCount = (note.viewCount || 0) + 1;

    return successResponse(res, 200, 'Note fetched successfully', note);
  } catch (error) {
    console.error('❌ getNoteById error:', error);
    return errorResponse(res, 500, `Failed to fetch note: ${error.message}`);
  }
};

// ── UPDATE NOTE ───────────────────────────────────────────────────────────────
export const updateNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return errorResponse(res, 404, 'Note not found');

    // Authorization
    if (req.user.role === 'Student') {
      if (note.uploadedBy !== req.user.userId) {
        return errorResponse(res, 403, 'You can only edit your own notes');
      }
      if (note.status === 'approved') {
        return errorResponse(res, 403, 'Cannot edit an already approved note');
      }
    }

    const { title, subject, moduleCode, description, tags, visibility } = req.body;

    if (title && title.trim()) note.title = title.trim();
    if (subject && subject.trim()) note.subject = subject.trim();
    if (moduleCode && moduleCode.trim()) note.moduleCode = moduleCode.trim().toUpperCase();
    if (description !== undefined) note.description = description.trim();
    if (visibility) note.visibility = visibility;

    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        note.tags = tags.filter(Boolean);
      } else if (typeof tags === 'string') {
        note.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
      }
    }

    // Handle new file upload
    if (req.file) {
      // Delete old file
      deleteFileFromDisk(note.fileUrl);
      note.fileUrl = `/uploads/${req.file.filename}`;
      note.fileName = req.file.originalname;
      note.fileType = req.file.mimetype;
    }

    // Student resubmitting a rejected note
    if (req.user.role === 'Student' && note.status === 'rejected') {
      note.status = 'pending';
      note.rejectionReason = null;
    }

    await note.save();
    return successResponse(res, 200, 'Note updated successfully', note);
  } catch (error) {
    console.error('❌ updateNote error:', error);
    return errorResponse(res, 500, `Failed to update note: ${error.message}`);
  }
};

// ── DELETE NOTE ───────────────────────────────────────────────────────────────
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return errorResponse(res, 404, 'Note not found');

    // Authorization
    if (req.user.role === 'Student' && note.uploadedBy !== req.user.userId) {
      return errorResponse(res, 403, 'You can only delete your own notes');
    }

    // Delete physical file
    deleteFileFromDisk(note.fileUrl);

    await Note.findByIdAndDelete(req.params.id);

    // Log admin action
    if (req.user.role === 'Admin') {
      await ModerationLog.create({
        adminId: req.user.userId,
        adminName: req.user.name || 'Admin',
        action: 'delete_note',
        targetType: 'note',
        targetId: req.params.id,
        details: `Deleted note: "${note.title}"`,
      }).catch((e) => console.error('Log error:', e.message));
    }

    return successResponse(res, 200, 'Note deleted successfully');
  } catch (error) {
    console.error('❌ deleteNote error:', error);
    return errorResponse(res, 500, `Failed to delete note: ${error.message}`);
  }
};

// ── REVIEW NOTE (Admin only) ──────────────────────────────────────────────────
export const reviewNote = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return errorResponse(res, 400, 'Invalid status. Must be "approved" or "rejected"');
    }

    const note = await Note.findById(req.params.id);
    if (!note) return errorResponse(res, 404, 'Note not found');

    note.status = status;

    if (status === 'approved') {
      note.approvedBy = req.user.userId;
      note.approvedAt = new Date();
      note.rejectionReason = null;
    } else {
      note.rejectionReason = rejectionReason || 'Does not meet content standards';
      note.approvedBy = null;
      note.approvedAt = null;
    }

    await note.save();

    await ModerationLog.create({
      adminId: req.user.userId,
      adminName: req.user.name || 'Admin',
      action: status === 'approved' ? 'approve_note' : 'reject_note',
      targetType: 'note',
      targetId: note._id.toString(),
      targetUserId: note.uploadedBy,
      reason: rejectionReason || null,
      details: `Note "${note.title}" was ${status}`,
    }).catch((e) => console.error('Log error:', e.message));

    return successResponse(res, 200, `Note ${status} successfully`, note);
  } catch (error) {
    console.error('❌ reviewNote error:', error);
    return errorResponse(res, 500, `Failed to review note: ${error.message}`);
  }
};

// ── GET PENDING NOTES (Admin only) ────────────────────────────────────────────
export const getPendingNotes = async (req, res) => {
  try {
    const notes = await Note.find({ status: 'pending' })
      .sort({ createdAt: -1 })
      .lean();
    return successResponse(res, 200, 'Pending notes fetched', notes);
  } catch (error) {
    console.error('❌ getPendingNotes error:', error);
    return errorResponse(res, 500, `Failed to fetch pending notes: ${error.message}`);
  }
};

// ── GET MY NOTES (Student only) ───────────────────────────────────────────────
export const getMyNotes = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { uploadedBy: req.user.userId };

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query.status = status;
    }

    const notes = await Note.find(query).sort({ createdAt: -1 }).lean();
    return successResponse(res, 200, 'Your notes fetched', notes);
  } catch (error) {
    console.error('❌ getMyNotes error:', error);
    return errorResponse(res, 500, `Failed to fetch notes: ${error.message}`);
  }
};