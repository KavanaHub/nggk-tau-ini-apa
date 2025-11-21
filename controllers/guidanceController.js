import {
  getConnection,
  releaseConnection,
  checkRequired,
  checkNumber,
  checkAdvisorAssignment
} from './helpers/commonHelpers.js';
import {
  sendSuccess,
  sendError,
  sendServerError
} from './helpers/response.js';

const startGuidance = async (req, res) => {
  let conn = null;

  try {
    const { proposal_id, topic, notes } = req.body;
    const advisorId = req.user.id;

    const proposalIdCheck = checkRequired(proposal_id, 'Proposal ID');
    if (!proposalIdCheck.valid) {
      return sendError(res, proposalIdCheck.error, 400);
    }

    const proposalIdNumber = checkNumber(proposal_id, 'Proposal ID');
    if (!proposalIdNumber.valid) {
      return sendError(res, proposalIdNumber.error, 400);
    }

    const topicCheck = checkRequired(topic, 'Topic');
    if (!topicCheck.valid) {
      return sendError(res, topicCheck.error, 400);
    }

    if (topic.trim().length < 5) {
      return sendError(res, 'Topic must be at least 5 characters', 400);
    }

    conn = await getConnection();

    const [proposals] = await conn.query(
      `SELECT
         max_guidance_sessions,
         project_type,
         program_studi,
         title
       FROM proposals
       WHERE id = ?`,
      [proposal_id]
    );

    if (proposals.length === 0) {
      releaseConnection(conn);
      return sendError(res, 'Proposal not found', 404);
    }

    const proposal = proposals[0];
    const maxSessions = proposal.max_guidance_sessions || 8;

    const [sessionCount] = await conn.query(
      `SELECT COUNT(*) as count FROM guidance_sessions WHERE proposal_id = ?`,
      [proposal_id]
    );

    const currentCount = sessionCount[0].count;

    if (currentCount >= maxSessions) {
      releaseConnection(conn);
      return sendError(
        res,
        `Maximum guidance sessions limit reached (${maxSessions} sessions)`,
        400
      );
    }

    const [assignments] = await conn.query(
      `SELECT id FROM proposal_advisors
       WHERE proposal_id = ? AND advisor_id = ? AND status = 'active'`,
      [proposal_id, advisorId]
    );

    if (assignments.length === 0) {
      releaseConnection(conn);
      return sendError(
        res,
        'You are not assigned as advisor for this proposal',
        403
      );
    }

    const nextSessionNumber = currentCount + 1;

    const [result] = await conn.query(
      `INSERT INTO guidance_sessions
       (proposal_id, advisor_id, session_number, topic, notes, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [proposal_id, advisorId, nextSessionNumber, topic.trim(), notes?.trim() || null, 'in_progress']
    );

    releaseConnection(conn);

    return sendSuccess(
      res,
      {
        guidance_id: result.insertId,
        proposal_id: proposal_id,
        proposal_title: proposal.title,
        session_number: nextSessionNumber,
        topic: topic.trim(),
        sessions_remaining: maxSessions - nextSessionNumber,
        max_sessions: maxSessions
      },
      'Guidance session started successfully',
      201
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const getGuidanceSessions = async (req, res) => {
  let conn = null;

  try {
    const { proposalId } = req.query;

    const proposalIdCheck = checkRequired(proposalId, 'Proposal ID');
    if (!proposalIdCheck.valid) {
      return sendError(res, proposalIdCheck.error, 400);
    }

    const proposalIdNumber = checkNumber(proposalId, 'Proposal ID');
    if (!proposalIdNumber.valid) {
      return sendError(res, proposalIdNumber.error, 400);
    }

    conn = await getConnection();

    const [sessions] = await conn.query(
      `SELECT
         g.id,
         g.proposal_id,
         g.advisor_id,
         g.session_number,
         g.topic,
         g.notes,
         g.feedback,
         g.status,
         g.approval_status,
         g.created_at,
         g.updated_at,
         u.name as advisor_name,
         u.sub_role as advisor_role
       FROM guidance_sessions g
       JOIN users u ON g.advisor_id = u.id
       WHERE g.proposal_id = ?
       ORDER BY g.session_number DESC`,
      [proposalId]
    );

    releaseConnection(conn);

    return sendSuccess(
      res,
      { sessions, total: sessions.length },
      'Guidance sessions retrieved successfully'
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const completeGuidance = async (req, res) => {
  let conn = null;

  try {
    const { guidanceId, feedback } = req.body;
    const advisorId = req.user.id;

    const guidanceIdCheck = checkRequired(guidanceId, 'Guidance ID');
    if (!guidanceIdCheck.valid) {
      return sendError(res, guidanceIdCheck.error, 400);
    }

    const guidanceIdNumber = checkNumber(guidanceId, 'Guidance ID');
    if (!guidanceIdNumber.valid) {
      return sendError(res, guidanceIdNumber.error, 400);
    }

    const feedbackCheck = checkRequired(feedback, 'Feedback');
    if (!feedbackCheck.valid) {
      return sendError(res, feedbackCheck.error, 400);
    }

    if (feedback.trim().length < 10) {
      return sendError(res, 'Feedback must be at least 10 characters', 400);
    }

    conn = await getConnection();

    const [sessions] = await conn.query(
      `SELECT id, proposal_id, session_number, topic, status
       FROM guidance_sessions
       WHERE id = ? AND advisor_id = ?`,
      [guidanceId, advisorId]
    );

    if (sessions.length === 0) {
      releaseConnection(conn);
      return sendError(
        res,
        'Guidance session not found or you are not the advisor',
        404
      );
    }

    const session = sessions[0];

    if (session.status !== 'in_progress') {
      releaseConnection(conn);
      return sendError(
        res,
        'Guidance session is already completed',
        400
      );
    }

    await conn.query(
      `UPDATE guidance_sessions
       SET status = 'completed',
           feedback = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [feedback.trim(), guidanceId]
    );

    releaseConnection(conn);

    return sendSuccess(
      res,
      {
        guidance_id: guidanceId,
        proposal_id: session.proposal_id,
        session_number: session.session_number,
        topic: session.topic,
        status: 'completed'
      },
      'Guidance session completed successfully'
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const approveGuidance = async (req, res) => {
  let conn = null;

  try {
    const { guidanceId, status } = req.body;

    const guidanceIdCheck = checkRequired(guidanceId, 'Guidance ID');
    if (!guidanceIdCheck.valid) {
      return sendError(res, guidanceIdCheck.error, 400);
    }

    const guidanceIdNumber = checkNumber(guidanceId, 'Guidance ID');
    if (!guidanceIdNumber.valid) {
      return sendError(res, guidanceIdNumber.error, 400);
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

    const [sessions] = await conn.query(
      'SELECT id, proposal_id, session_number FROM guidance_sessions WHERE id = ?',
      [guidanceId]
    );

    if (sessions.length === 0) {
      releaseConnection(conn);
      return sendError(res, 'Guidance session not found', 404);
    }

    await conn.query(
      `UPDATE guidance_sessions
       SET approval_status = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, guidanceId]
    );

    releaseConnection(conn);

    const message = status === 'approved'
      ? 'Guidance session approved'
      : 'Guidance session rejected';

    return sendSuccess(
      res,
      {
        guidance_id: guidanceId,
        proposal_id: sessions[0].proposal_id,
        session_number: sessions[0].session_number,
        approval_status: status
      },
      message
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const getSessionCount = async (req, res) => {
  let conn = null;

  try {
    const { proposal_id } = req.params;

    const proposalIdCheck = checkRequired(proposal_id, 'Proposal ID');
    if (!proposalIdCheck.valid) {
      return sendError(res, proposalIdCheck.error, 400);
    }

    const proposalIdNumber = checkNumber(proposal_id, 'Proposal ID');
    if (!proposalIdNumber.valid) {
      return sendError(res, proposalIdNumber.error, 400);
    }

    conn = await getConnection();

    const [proposals] = await conn.query(
      `SELECT max_guidance_sessions, title FROM proposals WHERE id = ?`,
      [proposal_id]
    );

    if (proposals.length === 0) {
      releaseConnection(conn);
      return sendError(res, 'Proposal not found', 404);
    }

    const maxSessions = proposals[0].max_guidance_sessions || 8;
    const proposalTitle = proposals[0].title;

    const [sessionStats] = await conn.query(
      `SELECT
         COUNT(*) as total_sessions,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
         MAX(session_number) as last_session_number
       FROM guidance_sessions
       WHERE proposal_id = ?`,
      [proposal_id]
    );

    releaseConnection(conn);

    const totalSessions = sessionStats[0].total_sessions || 0;
    const completedSessions = sessionStats[0].completed_sessions || 0;
    const lastSessionNumber = sessionStats[0].last_session_number || 0;
    const meetsMinimum = completedSessions >= maxSessions;

    return sendSuccess(
      res,
      {
        proposal_id: parseInt(proposal_id),
        proposal_title: proposalTitle,
        total_sessions: totalSessions,
        completed_sessions: completedSessions,
        min_required: maxSessions,
        meets_minimum: meetsMinimum,
        remaining_sessions: Math.max(0, maxSessions - completedSessions),
        last_session_number: lastSessionNumber
      },
      'Session count retrieved successfully'
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const canSubmitExam = async (req, res) => {
  let conn = null;

  try {
    const { proposal_id } = req.params;

    const proposalIdCheck = checkRequired(proposal_id, 'Proposal ID');
    if (!proposalIdCheck.valid) {
      return sendError(res, proposalIdCheck.error, 400);
    }

    const proposalIdNumber = checkNumber(proposal_id, 'Proposal ID');
    if (!proposalIdNumber.valid) {
      return sendError(res, proposalIdNumber.error, 400);
    }

    conn = await getConnection();

    const [proposals] = await conn.query(
      `SELECT max_guidance_sessions, title FROM proposals WHERE id = ?`,
      [proposal_id]
    );

    if (proposals.length === 0) {
      releaseConnection(conn);
      return sendError(res, 'Proposal not found', 404);
    }

    const requiredSessions = proposals[0].max_guidance_sessions || 8;
    const proposalTitle = proposals[0].title;

    const [sessionCount] = await conn.query(
      `SELECT COUNT(*) as count
       FROM guidance_sessions
       WHERE proposal_id = ? AND status = 'completed'`,
      [proposal_id]
    );

    releaseConnection(conn);

    const completedSessions = sessionCount[0].count;
    const canSubmit = completedSessions >= requiredSessions;

    if (!canSubmit) {
      return sendSuccess(
        res,
        {
          proposal_id: parseInt(proposal_id),
          proposal_title: proposalTitle,
          can_submit_exam: false,
          reason: `Minimum ${requiredSessions} completed guidance sessions not met (current: ${completedSessions})`,
          completed_sessions: completedSessions,
          required_sessions: requiredSessions,
          remaining_sessions: requiredSessions - completedSessions
        },
        'Cannot submit exam yet. More guidance sessions required.'
      );
    }

    return sendSuccess(
      res,
      {
        proposal_id: parseInt(proposal_id),
        proposal_title: proposalTitle,
        can_submit_exam: true,
        completed_sessions: completedSessions,
        required_sessions: requiredSessions,
        message: 'You can now submit for exam'
      },
      'Ready to submit exam'
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

export {
  startGuidance,
  getGuidanceSessions,
  completeGuidance,
  approveGuidance,
  getSessionCount,
  canSubmitExam
};
