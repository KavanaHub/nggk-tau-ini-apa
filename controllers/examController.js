import {
  getConnection,
  releaseConnection,
  validatePDFFile,
  checkProposalOwnership,
  checkRequired,
  checkNumber,
  extractFileInfo
} from './helpers/commonHelpers.js';
import {
  sendSuccess,
  sendError,
  sendServerError
} from './helpers/response.js';

const uploadExamSubmission = async (req, res) => {
  let conn = null;

  try {
    const fileValidation = validatePDFFile(req.file);
    if (!fileValidation.valid) {
      return sendError(res, fileValidation.error, 400);
    }

    const { proposalId } = req.body;
    const proposalIdCheck = checkRequired(proposalId, 'Proposal ID');
    if (!proposalIdCheck.valid) {
      return sendError(res, proposalIdCheck.error, 400);
    }

    const proposalIdNumber = checkNumber(proposalId, 'Proposal ID');
    if (!proposalIdNumber.valid) {
      return sendError(res, proposalIdNumber.error, 400);
    }

    const studentId = req.user.id;

    const { fileName, fileData } = extractFileInfo(req.file);

    conn = await getConnection();

    const ownership = await checkProposalOwnership(conn, proposalId, studentId);
    if (!ownership.valid) {
      releaseConnection(conn);
      return sendError(res, ownership.error, 403);
    }

    const proposal = ownership.proposal;
    const requiredSessions = proposal.max_guidance_sessions || 8;

    const [sessionCount] = await conn.query(
      `SELECT COUNT(*) as count
       FROM guidance_sessions
       WHERE proposal_id = ? AND status = 'completed'`,
      [proposalId]
    );

    const completedSessions = sessionCount[0].count;

    if (completedSessions < requiredSessions) {
      releaseConnection(conn);
      return sendError(
        res,
        `Cannot submit exam. Minimum ${requiredSessions} completed guidance sessions required (current: ${completedSessions})`,
        400
      );
    }

    const [result] = await conn.query(
      `INSERT INTO exam_submissions (proposal_id, student_id, file_name, file_data, status)
       VALUES (?, ?, ?, ?, ?)`,
      [proposalId, studentId, fileName, fileData, 'submitted']
    );

    releaseConnection(conn);

    return sendSuccess(
      res,
      {
        submission_id: result.insertId,
        proposal_id: proposalId,
        file_name: fileName,
        status: 'submitted',
        completed_sessions: completedSessions,
        required_sessions: requiredSessions
      },
      'Exam submission uploaded successfully. Waiting for advisor approval.',
      201
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const getExamSubmissions = async (req, res) => {
  let conn = null;

  try {
    conn = await getConnection();

    const [submissions] = await conn.query(
      `SELECT
         e.id,
         e.proposal_id,
         e.student_id,
         e.file_name,
         e.status,
         e.exam_approval_status,
         e.assessment_status,
         e.created_at,
         e.updated_at,
         u.name as student_name,
         u.npm as student_npm,
         p.title as proposal_title,
         p.project_type,
         p.program_studi
       FROM exam_submissions e
       JOIN users u ON e.student_id = u.id
       JOIN proposals p ON e.proposal_id = p.id
       ORDER BY e.created_at DESC`
    );

    releaseConnection(conn);

    return sendSuccess(
      res,
      { submissions, total: submissions.length },
      'Exam submissions retrieved successfully'
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const approveExamSubmission = async (req, res) => {
  let conn = null;

  try {
    const { submissionId, status } = req.body;

    const submissionIdCheck = checkRequired(submissionId, 'Submission ID');
    if (!submissionIdCheck.valid) {
      return sendError(res, submissionIdCheck.error, 400);
    }

    const submissionIdNumber = checkNumber(submissionId, 'Submission ID');
    if (!submissionIdNumber.valid) {
      return sendError(res, submissionIdNumber.error, 400);
    }

    const statusCheck = checkRequired(status, 'Status');
    if (!statusCheck.valid) {
      return sendError(res, statusCheck.error, 400);
    }

    const validStatuses = ['approved', 'rejected'];
    if (!validStatuses.includes(status)) {
      return sendError(
        res,
        `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
        400
      );
    }

    conn = await getConnection();

    const [submissions] = await conn.query(
      'SELECT id, proposal_id FROM exam_submissions WHERE id = ?',
      [submissionId]
    );

    if (submissions.length === 0) {
      releaseConnection(conn);
      return sendError(res, 'Exam submission not found', 404);
    }

    await conn.query(
      `UPDATE exam_submissions
       SET exam_approval_status = ?,
           status = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, status === 'approved' ? 'under_review' : 'submitted', submissionId]
    );

    releaseConnection(conn);

    const message = status === 'approved'
      ? 'Exam submission approved. Ready for assessment.'
      : 'Exam submission rejected. Student needs to revise.';

    return sendSuccess(
      res,
      {
        submission_id: submissionId,
        exam_approval_status: status,
        proposal_id: submissions[0].proposal_id
      },
      message
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const assessExam = async (req, res) => {
  let conn = null;

  try {
    const { submissionId, score, feedback } = req.body;
    const assessorId = req.user.id;

    const submissionIdCheck = checkRequired(submissionId, 'Submission ID');
    if (!submissionIdCheck.valid) {
      return sendError(res, submissionIdCheck.error, 400);
    }

    const submissionIdNumber = checkNumber(submissionId, 'Submission ID');
    if (!submissionIdNumber.valid) {
      return sendError(res, submissionIdNumber.error, 400);
    }

    const scoreCheck = checkRequired(score, 'Score');
    if (!scoreCheck.valid) {
      return sendError(res, scoreCheck.error, 400);
    }

    const scoreNumber = parseInt(score);
    if (isNaN(scoreNumber) || scoreNumber < 0 || scoreNumber > 100) {
      return sendError(res, 'Score must be a number between 0 and 100', 400);
    }

    const feedbackCheck = checkRequired(feedback, 'Feedback');
    if (!feedbackCheck.valid) {
      return sendError(res, feedbackCheck.error, 400);
    }

    if (feedback.trim().length < 10) {
      return sendError(res, 'Feedback must be at least 10 characters', 400);
    }

    conn = await getConnection();

    const [submissions] = await conn.query(
      `SELECT id, proposal_id, exam_approval_status
       FROM exam_submissions
       WHERE id = ?`,
      [submissionId]
    );

    if (submissions.length === 0) {
      releaseConnection(conn);
      return sendError(res, 'Exam submission not found', 404);
    }

    const submission = submissions[0];

    if (submission.exam_approval_status !== 'approved') {
      releaseConnection(conn);
      return sendError(
        res,
        'Exam submission must be approved before assessment',
        400
      );
    }

    await conn.beginTransaction();

    try {
      const [result] = await conn.query(
        `INSERT INTO exam_assessments (submission_id, assessor_id, score, feedback, status)
         VALUES (?, ?, ?, ?, ?)`,
        [submissionId, assessorId, scoreNumber, feedback.trim(), 'completed']
      );

      await conn.query(
        `UPDATE exam_submissions
         SET assessment_status = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        ['assessed', submissionId]
      );

      await conn.commit();
      releaseConnection(conn);

      return sendSuccess(
        res,
        {
          assessment_id: result.insertId,
          submission_id: submissionId,
          proposal_id: submission.proposal_id,
          score: scoreNumber,
          assessor_id: assessorId
        },
        'Exam assessed successfully',
        201
      );

    } catch (error) {
      await conn.rollback();
      throw error;
    }

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const getExamAssessments = async (req, res) => {
  let conn = null;

  try {
    conn = await getConnection();

    const [assessments] = await conn.query(
      `SELECT
         a.id,
         a.submission_id,
         a.assessor_id,
         a.score,
         a.feedback,
         a.status,
         a.created_at,
         u_assessor.name as assessor_name,
         u_assessor.sub_role as assessor_role,
         s.file_name as submission_file,
         s.proposal_id,
         u_student.name as student_name,
         u_student.npm as student_npm,
         p.title as proposal_title
       FROM exam_assessments a
       JOIN users u_assessor ON a.assessor_id = u_assessor.id
       JOIN exam_submissions s ON a.submission_id = s.id
       JOIN users u_student ON s.student_id = u_student.id
       JOIN proposals p ON s.proposal_id = p.id
       ORDER BY a.created_at DESC`
    );

    releaseConnection(conn);

    return sendSuccess(
      res,
      { assessments, total: assessments.length },
      'Exam assessments retrieved successfully'
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

export {
  uploadExamSubmission,
  getExamSubmissions,
  approveExamSubmission,
  assessExam,
  getExamAssessments
};
