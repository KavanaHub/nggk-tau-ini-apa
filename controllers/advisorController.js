import {
  getConnection,
  releaseConnection,
  checkRequired,
  checkNumber,
  checkProposalOwnership
} from './helpers/commonHelpers.js';
import {
  sendSuccess,
  sendError,
  sendServerError
} from './helpers/response.js';

const getAdvisors = async (req, res) => {
  let conn = null;

  try {
    conn = await getConnection();

    const [advisors] = await conn.query(
      `SELECT
         id,
         name,
         email,
         sub_role
       FROM users
       WHERE role = 'dosen' OR sub_role IN ('pembimbing', 'koordinator')
       ORDER BY name ASC`
    );

    releaseConnection(conn);

    return sendSuccess(
      res,
      { advisors, total: advisors.length },
      'Advisors retrieved successfully'
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const selectAdvisor = async (req, res) => {
  let conn = null;

  try {
    const { proposal_id, primary_advisor_id, secondary_advisor_id } = req.body;
    const studentId = req.user.id;

    const proposalIdCheck = checkRequired(proposal_id, 'Proposal ID');
    if (!proposalIdCheck.valid) {
      return sendError(res, proposalIdCheck.error, 400);
    }

    const proposalIdNumber = checkNumber(proposal_id, 'Proposal ID');
    if (!proposalIdNumber.valid) {
      return sendError(res, proposalIdNumber.error, 400);
    }

    const primaryAdvisorCheck = checkRequired(primary_advisor_id, 'Primary Advisor ID');
    if (!primaryAdvisorCheck.valid) {
      return sendError(res, primaryAdvisorCheck.error, 400);
    }

    const primaryAdvisorNumber = checkNumber(primary_advisor_id, 'Primary Advisor ID');
    if (!primaryAdvisorNumber.valid) {
      return sendError(res, primaryAdvisorNumber.error, 400);
    }

    if (secondary_advisor_id) {
      const secondaryAdvisorNumber = checkNumber(secondary_advisor_id, 'Secondary Advisor ID');
      if (!secondaryAdvisorNumber.valid) {
        return sendError(res, secondaryAdvisorNumber.error, 400);
      }

      if (parseInt(primary_advisor_id) === parseInt(secondary_advisor_id)) {
        return sendError(res, 'Primary and secondary advisors must be different', 400);
      }
    }

    conn = await getConnection();

    const [proposals] = await conn.query(
      `SELECT
         id, student_id, student2_id, project_type, program_studi,
         coordinator_validated, coordinator_approval_status, status
       FROM proposals
       WHERE id = ? AND (student_id = ? OR student2_id = ?)`,
      [proposal_id, studentId, studentId]
    );

    if (proposals.length === 0) {
      releaseConnection(conn);
      return sendError(res, 'Proposal not found or you do not have access', 404);
    }

    const proposal = proposals[0];

    if (!proposal.coordinator_validated) {
      releaseConnection(conn);
      return sendError(
        res,
        'Proposal must be validated by coordinator before selecting advisors',
        400
      );
    }

    const isInternship = ['internship1', 'internship2'].includes(proposal.project_type);
    const isProject = ['project1', 'project2', 'project3'].includes(proposal.project_type);

    if (isInternship && !secondary_advisor_id) {
      releaseConnection(conn);
      return sendError(
        res,
        'Internship proposals require both primary and secondary advisors',
        400
      );
    }

    if (isProject && secondary_advisor_id) {
      releaseConnection(conn);
      return sendError(
        res,
        'Project proposals only need one advisor (primary)',
        400
      );
    }

    const [primaryAdvisor] = await conn.query(
      `SELECT id, name FROM users WHERE id = ? AND role = 'dosen'`,
      [primary_advisor_id]
    );

    if (primaryAdvisor.length === 0) {
      releaseConnection(conn);
      return sendError(res, 'Primary advisor not found or not a dosen', 404);
    }

    if (secondary_advisor_id) {
      const [secondaryAdvisor] = await conn.query(
        `SELECT id, name FROM users WHERE id = ? AND role = 'dosen'`,
        [secondary_advisor_id]
      );

      if (secondaryAdvisor.length === 0) {
        releaseConnection(conn);
        return sendError(res, 'Secondary advisor not found or not a dosen', 404);
      }
    }

    await conn.beginTransaction();

    try {
      await conn.query(
        `DELETE FROM proposal_advisors WHERE proposal_id = ?`,
        [proposal_id]
      );

      await conn.query(
        `INSERT INTO proposal_advisors (proposal_id, advisor_id, advisor_type, status)
         VALUES (?, ?, 'primary', 'active')`,
        [proposal_id, primary_advisor_id]
      );

      if (secondary_advisor_id) {
        await conn.query(
          `INSERT INTO proposal_advisors (proposal_id, advisor_id, advisor_type, status)
           VALUES (?, ?, 'secondary', 'active')`,
          [proposal_id, secondary_advisor_id]
        );
      }

      await conn.query(
        `UPDATE proposals
         SET advisor_id = ?,
             status = 'pending_advisor_approval',
             coordinator_approval_status = 'advisor_pending',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [primary_advisor_id, proposal_id]
      );

      await conn.commit();
      releaseConnection(conn);

      return sendSuccess(
        res,
        {
          proposal_id: proposal_id,
          primary_advisor_id: primary_advisor_id,
          primary_advisor_name: primaryAdvisor[0].name,
          secondary_advisor_id: secondary_advisor_id || null,
          advisors_count: secondary_advisor_id ? 2 : 1,
          next_step: 'Advisors must approve your proposal'
        },
        'Advisor(s) selected successfully. Waiting for advisor approval.',
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

const getAdvisorProposals = async (req, res) => {
  let conn = null;

  try {
    const advisorId = req.user.id;

    conn = await getConnection();

    const [proposals] = await conn.query(
      `SELECT DISTINCT
         p.id,
         p.title,
         p.description,
         p.project_type,
         p.program_studi,
         p.status,
         p.advisor_status,
         p.coordinator_validated,
         p.coordinator_approval_status,
         p.created_at,
         p.updated_at,
         u.id as student_id,
         u.name as student_name,
         u.npm as student_npm,
         u.email as student_email,
         u2.id as student2_id,
         u2.name as student2_name,
         u2.npm as student2_npm,
         pa.advisor_type,
         GROUP_CONCAT(
           CONCAT(u_adv.name, ' (', pa2.advisor_type, ')')
           SEPARATOR ', '
         ) as all_advisors
       FROM proposals p
       JOIN users u ON p.student_id = u.id
       LEFT JOIN users u2 ON p.student2_id = u2.id
       INNER JOIN proposal_advisors pa ON p.id = pa.proposal_id
       LEFT JOIN proposal_advisors pa2 ON p.id = pa2.proposal_id AND pa2.status = 'active'
       LEFT JOIN users u_adv ON pa2.advisor_id = u_adv.id
       WHERE pa.advisor_id = ? AND pa.status = 'active'
       GROUP BY p.id, p.title, p.description, p.project_type, p.program_studi,
                p.status, p.advisor_status, p.coordinator_validated,
                p.coordinator_approval_status, p.created_at, p.updated_at,
                u.id, u.name, u.npm, u.email,
                u2.id, u2.name, u2.npm,
                pa.advisor_type
       ORDER BY p.created_at DESC`,
      [advisorId]
    );

    const enhancedProposals = await Promise.all(
      proposals.map(async (proposal) => {
        if (proposal.advisor_status === 'approved') {
          const [advisorContacts] = await conn.query(
            `SELECT
               u.id,
               u.name,
               u.whatsapp_number,
               u.email,
               pa.advisor_type
             FROM proposal_advisors pa
             JOIN users u ON pa.advisor_id = u.id
             WHERE pa.proposal_id = ? AND pa.status = 'active'
             ORDER BY pa.advisor_type ASC`,
            [proposal.id]
          );

          return {
            ...proposal,
            advisor_contacts: advisorContacts
          };
        }
        return proposal;
      })
    );

    releaseConnection(conn);

    return sendSuccess(
      res,
      { proposals: enhancedProposals, total: enhancedProposals.length },
      'Advisor proposals retrieved successfully'
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const approveProposal = async (req, res) => {
  let conn = null;

  try {
    const { proposalId, status } = req.body;
    const advisorId = req.user.id;

    const proposalIdCheck = checkRequired(proposalId, 'Proposal ID');
    if (!proposalIdCheck.valid) {
      return sendError(res, proposalIdCheck.error, 400);
    }

    const proposalIdNumber = checkNumber(proposalId, 'Proposal ID');
    if (!proposalIdNumber.valid) {
      return sendError(res, proposalIdNumber.error, 400);
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

    const [assignments] = await conn.query(
      `SELECT pa.id, p.title
       FROM proposal_advisors pa
       JOIN proposals p ON pa.proposal_id = p.id
       WHERE pa.proposal_id = ? AND pa.advisor_id = ? AND pa.status = 'active'`,
      [proposalId, advisorId]
    );

    if (assignments.length === 0) {
      releaseConnection(conn);
      return sendError(
        res,
        'Proposal not found or you are not assigned as advisor',
        403
      );
    }

    await conn.query(
      `UPDATE proposals
       SET advisor_status = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [status, proposalId]
    );

    releaseConnection(conn);

    const message = status === 'approved'
      ? 'Proposal approved. Student can start guidance sessions.'
      : 'Proposal rejected. Student needs to revise.';

    return sendSuccess(
      res,
      {
        proposal_id: proposalId,
        proposal_title: assignments[0].title,
        advisor_status: status
      },
      message
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const approveAdvisorSelection = async (req, res) => {
  let conn = null;

  try {
    const { proposalId, status } = req.body;

    const proposalIdCheck = checkRequired(proposalId, 'Proposal ID');
    if (!proposalIdCheck.valid) {
      return sendError(res, proposalIdCheck.error, 400);
    }

    const proposalIdNumber = checkNumber(proposalId, 'Proposal ID');
    if (!proposalIdNumber.valid) {
      return sendError(res, proposalIdNumber.error, 400);
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

    const [proposals] = await conn.query(
      'SELECT id, title FROM proposals WHERE id = ?',
      [proposalId]
    );

    if (proposals.length === 0) {
      releaseConnection(conn);
      return sendError(res, 'Proposal not found', 404);
    }

    if (status === 'approved') {
      await conn.query(
        `UPDATE proposals
         SET coordinator_approval_status = ?,
             advisor_status = 'pending_approval',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, proposalId]
      );
    } else {
      await conn.query(
        `UPDATE proposals
         SET coordinator_approval_status = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [status, proposalId]
      );
    }

    releaseConnection(conn);

    const message = status === 'approved'
      ? 'Advisor selection approved by coordinator'
      : 'Advisor selection rejected. Student needs to select different advisor.';

    return sendSuccess(
      res,
      {
        proposal_id: proposalId,
        proposal_title: proposals[0].title,
        coordinator_approval_status: status
      },
      message
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const getPendingAdvisorSelections = async (req, res) => {
  let conn = null;

  try {
    conn = await getConnection();

    const [proposals] = await conn.query(
      `SELECT
         p.id,
         p.title,
         p.description,
         p.project_type,
         p.program_studi,
         p.coordinator_approval_status,
         p.created_at,
         p.updated_at,
         u.name as student_name,
         u.npm as student_npm,
         u.email as student_email,
         a.name as primary_advisor_name,
         a.email as primary_advisor_email
       FROM proposals p
       JOIN users u ON p.student_id = u.id
       LEFT JOIN users a ON p.advisor_id = a.id
       WHERE p.advisor_id IS NOT NULL
         AND p.coordinator_approval_status = 'pending_approval'
       ORDER BY p.created_at DESC`
    );

    releaseConnection(conn);

    return sendSuccess(
      res,
      { proposals, total: proposals.length },
      'Pending advisor selections retrieved successfully'
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const getAdvisorContact = async (req, res) => {
  let conn = null;

  try {
    const { id: advisorId } = req.params;
    const studentId = req.user.id;

    const advisorIdNumber = checkNumber(advisorId, 'Advisor ID');
    if (!advisorIdNumber.valid) {
      return sendError(res, advisorIdNumber.error, 400);
    }

    conn = await getConnection();

    const [proposals] = await conn.query(
      `SELECT p.id
       FROM proposals p
       INNER JOIN proposal_advisors pa ON p.id = pa.proposal_id
       WHERE (p.student_id = ? OR p.student2_id = ?)
         AND pa.advisor_id = ?
         AND pa.status = 'active'
         AND p.advisor_status = 'approved'
         AND p.coordinator_validated = TRUE
       LIMIT 1`,
      [studentId, studentId, advisorId]
    );

    if (proposals.length === 0) {
      releaseConnection(conn);
      return sendError(
        res,
        'Advisor contact info only available for approved proposals',
        403
      );
    }

    const [advisors] = await conn.query(
      `SELECT
         id,
         name,
         email,
         whatsapp_number,
         sub_role
       FROM users
       WHERE id = ? AND role = 'dosen'`,
      [advisorId]
    );

    releaseConnection(conn);

    if (advisors.length === 0) {
      return sendError(res, 'Advisor not found', 404);
    }

    return sendSuccess(
      res,
      { advisor: advisors[0] },
      'Advisor contact retrieved successfully'
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

export {
  getAdvisors,
  selectAdvisor,
  getAdvisorProposals,
  approveProposal,
  approveAdvisorSelection,
  getPendingAdvisorSelections,
  getAdvisorContact
};
