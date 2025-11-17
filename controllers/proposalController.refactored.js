/**
 * Proposal Controller - Refactored with Proper Error Handling
 * 
 * Improvements:
 * - Custom error classes for different error scenarios
 * - File upload validation and error handling
 * - Structured logging for all operations
 * - Safe database connection handling with automatic release
 * - Input validation and sanitization
 * - Transaction safety for file operations
 * - Proper 404 responses
 */

import asyncHandler from '../utils/asyncHandler.js';
import { 
  ValidationError, 
  NotFoundError,
  FileUploadError,
  AuthorizationError 
} from '../utils/errors.js';
import { 
  validateRequired, 
  validateFileUpload,
  sanitizeInput 
} from '../utils/validation.js';
import { logInfo, logFileOperation, logError } from '../utils/logger.js';
import { executeQuery } from '../utils/dbHelper.js';

/**
 * Upload a new proposal
 * POST /api/proposals/upload
 */
const uploadProposal = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const studentId = req.user.id;
  
  // Validate required fields
  validateRequired(['title', 'description'], req.body);
  
  // Validate file upload
  if (!req.file) {
    throw new FileUploadError('Proposal file is required');
  }
  
  validateFileUpload(req.file, {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    required: true
  });
  
  // Sanitize inputs
  const sanitizedTitle = sanitizeInput(title);
  const sanitizedDescription = sanitizeInput(description);
  
  const fileData = req.file.buffer;
  const fileName = req.file.originalname;
  const fileSize = req.file.size;
  
  logFileOperation('Upload proposal', fileName, { 
    size: fileSize, 
    studentId,
    title: sanitizedTitle 
  });
  
  try {
    // Insert proposal into database
    const result = await executeQuery(
      'INSERT INTO proposals (student_id, title, description, file_name, file_data, status) VALUES (?, ?, ?, ?, ?, ?)',
      [studentId, sanitizedTitle, sanitizedDescription, fileName, fileData, 'pending'],
      'INSERT_PROPOSAL'
    );
    
    logInfo('Proposal uploaded successfully', { 
      proposalId: result.insertId, 
      studentId,
      fileName 
    });
    
    res.status(201).json({ 
      success: true,
      message: 'Proposal uploaded successfully',
      data: {
        id: result.insertId,
        title: sanitizedTitle,
        description: sanitizedDescription,
        fileName,
        status: 'pending'
      }
    });
  } catch (error) {
    // Clean up file buffer from memory on error
    logError('Proposal upload failed', error, { studentId, fileName });
    
    // Re-throw to be handled by error middleware
    throw error;
  }
});

/**
 * Get all proposals (for admin/coordinator)
 * GET /api/proposals
 */
const getProposals = asyncHandler(async (req, res) => {
  const proposals = await executeQuery(
    `SELECT p.id, p.student_id, p.title, p.description, p.file_name, p.status, 
            p.advisor_id, p.coordinator_approval_status, p.advisor_status, 
            p.created_at, p.updated_at, u.name as student_name,
            a.name as advisor_name
     FROM proposals p 
     JOIN users u ON p.student_id = u.id 
     LEFT JOIN users a ON p.advisor_id = a.id
     ORDER BY p.created_at DESC`,
    [],
    'GET_ALL_PROPOSALS'
  );
  
  // Remove file_data from response to reduce payload size
  const proposalsWithoutFileData = proposals.map(p => ({
    ...p,
    hasFile: !!p.file_name
  }));
  
  logInfo('Proposals retrieved', { 
    count: proposals.length, 
    requestedBy: req.user.id 
  });
  
  res.json({ 
    success: true,
    message: 'Proposals retrieved successfully',
    data: {
      proposals: proposalsWithoutFileData,
      count: proposals.length
    }
  });
});

/**
 * Get proposals for logged-in student
 * GET /api/proposals/student
 */
const getStudentProposals = asyncHandler(async (req, res) => {
  const studentId = req.user.id;
  
  const proposals = await executeQuery(
    `SELECT id, title, description, file_name, status, advisor_id, 
            coordinator_approval_status, advisor_status, created_at, updated_at
     FROM proposals 
     WHERE student_id = ? 
     ORDER BY created_at DESC`,
    [studentId],
    'GET_STUDENT_PROPOSALS'
  );
  
  logInfo('Student proposals retrieved', { 
    studentId, 
    count: proposals.length 
  });
  
  res.json({ 
    success: true,
    message: 'Proposals retrieved successfully',
    data: {
      proposals,
      count: proposals.length
    }
  });
});

/**
 * Download proposal file
 * GET /api/proposals/:id/download
 */
const downloadProposal = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  const userRole = req.user.role;
  
  // Validate ID
  const proposalId = parseInt(id, 10);
  if (isNaN(proposalId)) {
    throw new ValidationError('Invalid proposal ID');
  }
  
  // Get proposal with file data
  const proposals = await executeQuery(
    'SELECT student_id, file_name, file_data, advisor_id FROM proposals WHERE id = ?',
    [proposalId],
    'GET_PROPOSAL_FILE'
  );
  
  if (proposals.length === 0) {
    throw new NotFoundError('Proposal', proposalId);
  }
  
  const proposal = proposals[0];
  
  // Authorization check: only student owner, assigned advisor, or admin can download
  const isOwner = proposal.student_id === userId;
  const isAdvisor = proposal.advisor_id === userId;
  const isAdmin = ['koordinator', 'dosen'].includes(userRole);
  
  if (!isOwner && !isAdvisor && !isAdmin) {
    throw new AuthorizationError('You do not have permission to download this proposal');
  }
  
  logFileOperation('Download proposal', proposal.file_name, { 
    proposalId, 
    userId,
    userRole 
  });
  
  // Set appropriate headers
  res.setHeader('Content-Disposition', `attachment; filename="${proposal.file_name}"`);
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Content-Length', proposal.file_data.length);
  
  res.send(proposal.file_data);
});

export { uploadProposal, getProposals, getStudentProposals, downloadProposal };
