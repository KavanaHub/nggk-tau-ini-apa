import pool from '../config/database.js';

const validateProposal = async (req, res) => {
  try {
    const { proposal_id, validated, notes } = req.body;
    const coordinatorId = req.user.id;

    if (!proposal_id || validated === undefined) {
      return res.status(400).json({
        message: 'proposal_id and validated (boolean) are required'
      });
    }

    const conn = await pool.getConnection();

    try {
      const [user] = await conn.query(
        `SELECT role, sub_role FROM users WHERE id = ? AND (role = 'koordinator' OR sub_role = 'koordinator')`,
        [coordinatorId]
      );

      if (user.length === 0) {
        conn.release();
        return res.status(403).json({
          message: 'Only coordinators can validate proposals'
        });
      }

      const [proposals] = await conn.query(
        `SELECT id, title, project_type, program_studi, status FROM proposals WHERE id = ?`,
        [proposal_id]
      );

      if (proposals.length === 0) {
        conn.release();
        return res.status(404).json({
          message: 'Proposal not found'
        });
      }

      const validationStatus = validated ? 'approved' : 'rejected';
      const newStatus = validated ? 'pending_advisor_selection' : 'rejected';

      await conn.query(
        `UPDATE proposals
         SET coordinator_validated = ?,
             coordinator_validated_at = CURRENT_TIMESTAMP,
             coordinator_id = ?,
             coordinator_approval_status = ?,
             status = ?
         WHERE id = ?`,
        [validated, coordinatorId, validationStatus, newStatus, proposal_id]
      );

      conn.release();

      res.json({
        message: validated
          ? 'Proposal validated successfully. Student can now select advisors.'
          : 'Proposal rejected. Student must revise and resubmit.',
        proposal_id,
        validated,
        status: validationStatus,
        notes: notes || null
      });
    } catch (error) {
      conn.release();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCoordinatorAssignments = async (req, res) => {
  try {
    const conn = await pool.getConnection();

    const [assignments] = await conn.query(
      `SELECT
         ca.id,
         ca.project_type,
         ca.program_studi,
         ca.status,
         ca.assigned_at,
         ca.notes,
         u.id as coordinator_id,
         u.name as coordinator_name,
         u.email as coordinator_email,
         kp.name as assigned_by_name
       FROM coordinator_assignments ca
       JOIN users u ON ca.coordinator_id = u.id
       LEFT JOIN users kp ON ca.assigned_by = kp.id
       WHERE ca.status = 'active'
       ORDER BY ca.project_type, ca.program_studi`
    );

    conn.release();

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const removeCoordinatorAssignment = async (req, res) => {
  try {
    const { id } = req.params;
    const kepalaProdiId = req.user.id;

    if (!id) {
      return res.status(400).json({
        message: 'Assignment ID is required'
      });
    }

    const conn = await pool.getConnection();

    try {
      const [user] = await conn.query(
        `SELECT role FROM users WHERE id = ? AND role = 'kepala_prodi'`,
        [kepalaProdiId]
      );

      if (user.length === 0) {
        conn.release();
        return res.status(403).json({
          message: 'Only kepala prodi can remove coordinator assignments'
        });
      }

      const [assignments] = await conn.query(
        `SELECT id FROM coordinator_assignments WHERE id = ?`,
        [id]
      );

      if (assignments.length === 0) {
        conn.release();
        return res.status(404).json({
          message: 'Assignment not found'
        });
      }

      await conn.query(
        `UPDATE coordinator_assignments
         SET status = 'inactive',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [id]
      );

      conn.release();

      res.json({
        message: 'Coordinator assignment removed successfully',
        assignment_id: id
      });
    } catch (error) {
      conn.release();
      throw error;
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPendingProposals = async (req, res) => {
  try {
    const coordinatorId = req.user.id;

    const conn = await pool.getConnection();

    const [proposals] = await conn.query(
      `SELECT
         p.id,
         p.title,
         p.description,
         p.project_type,
         p.program_studi,
         p.status,
         p.created_at,
         u.id as student_id,
         u.name as student_name,
         u.npm as student_npm,
         u.email as student_email,
         u2.name as student2_name,
         u2.npm as student2_npm,
         p.is_group_submission,
         proj.project_number,
         proj.title as project_title
       FROM proposals p
       JOIN users u ON p.student_id = u.id
       LEFT JOIN users u2 ON p.student2_id = u2.id
       LEFT JOIN groups g ON p.group_id = g.id
       LEFT JOIN projects proj ON g.project_id = proj.id
       WHERE p.coordinator_validated IS NULL OR p.coordinator_validated = FALSE
         AND p.status IN ('pending', 'submitted')
       ORDER BY p.created_at ASC`
    );

    conn.release();

    res.json(proposals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getValidatedProposals = async (req, res) => {
  try {
    const coordinatorId = req.user.id;

    const conn = await pool.getConnection();

    const [proposals] = await conn.query(
      `SELECT
         p.id,
         p.title,
         p.project_type,
         p.program_studi,
         p.status,
         p.coordinator_validated,
         p.coordinator_validated_at,
         p.coordinator_approval_status,
         u.name as student_name,
         u.npm as student_npm
       FROM proposals p
       JOIN users u ON p.student_id = u.id
       WHERE p.coordinator_id = ?
       ORDER BY p.coordinator_validated_at DESC`,
      [coordinatorId]
    );

    conn.release();

    res.json(proposals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCoordinatorStats = async (req, res) => {
  try {
    const coordinatorId = req.user.id;

    const conn = await pool.getConnection();

    const [pendingCount] = await conn.query(
      `SELECT COUNT(*) as count FROM proposals
       WHERE (coordinator_validated IS NULL OR coordinator_validated = FALSE)
         AND status IN ('pending', 'submitted')`
    );

    const [validatedCount] = await conn.query(
      `SELECT COUNT(*) as count FROM proposals
       WHERE coordinator_id = ?`,
      [coordinatorId]
    );

    const [approvedCount] = await conn.query(
      `SELECT COUNT(*) as count FROM proposals
       WHERE coordinator_id = ? AND coordinator_validated = TRUE`,
      [coordinatorId]
    );

    const [rejectedCount] = await conn.query(
      `SELECT COUNT(*) as count FROM proposals
       WHERE coordinator_id = ? AND coordinator_validated = FALSE`,
      [coordinatorId]
    );

    conn.release();

    res.json({
      pending_validation: pendingCount[0].count,
      total_validated: validatedCount[0].count,
      approved: approvedCount[0].count,
      rejected: rejectedCount[0].count
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export {
  validateProposal,
  getCoordinatorAssignments,
  removeCoordinatorAssignment,
  getPendingProposals,
  getValidatedProposals,
  getCoordinatorStats
};
