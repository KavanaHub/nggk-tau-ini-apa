import pool from '../config/database.js';

const getAdvisors = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [advisors] = await conn.query(
      "SELECT id, name FROM users WHERE role IN ('dosen') OR sub_role IN ('pembimbing')"
    );
    conn.release();
    res.json(advisors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const selectAdvisor = async (req, res) => {
  try {
    const { proposalId, advisorId } = req.body;
    const conn = await pool.getConnection();

    await conn.query(
      'UPDATE proposals SET advisor_id = ?, coordinator_approval_status = ? WHERE id = ?',
      [advisorId, 'pending_approval', proposalId]
    );
    conn.release();

    res.json({ message: 'Advisor selected, waiting for coordinator approval' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAdvisorProposals = async (req, res) => {
  try {
    const advisorId = req.user.id;
    const conn = await pool.getConnection();
    const [proposals] = await conn.query(
      `SELECT p.*, u.name as student_name FROM proposals p 
       JOIN users u ON p.student_id = u.id 
       WHERE p.advisor_id = ? 
       ORDER BY p.created_at DESC`,
      [advisorId]
    );
    conn.release();

    res.json(proposals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveProposal = async (req, res) => {
  try {
    const { proposalId, status } = req.body;
    const conn = await pool.getConnection();

    await conn.query(
      'UPDATE proposals SET advisor_status = ? WHERE id = ?',
      [status, proposalId]
    );
    conn.release();

    res.json({ message: `Proposal ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveAdvisorSelection = async (req, res) => {
  try {
    const { proposalId, status } = req.body;
    const conn = await pool.getConnection();

    if (status === 'approved') {
      await conn.query(
        'UPDATE proposals SET coordinator_approval_status = ?, advisor_status = ? WHERE id = ?',
        [status, 'pending_approval', proposalId]
      );
    } else {
      await conn.query(
        'UPDATE proposals SET coordinator_approval_status = ? WHERE id = ?',
        [status, proposalId]
      );
    }
    conn.release();

    res.json({ message: `Advisor selection ${status} by coordinator` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPendingAdvisorSelections = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [proposals] = await conn.query(
      `SELECT p.*, u.name as student_name, a.name as advisor_name 
       FROM proposals p 
       JOIN users u ON p.student_id = u.id 
       LEFT JOIN users a ON p.advisor_id = a.id 
       WHERE p.advisor_id IS NOT NULL AND p.coordinator_approval_status = 'pending_approval'
       ORDER BY p.created_at DESC`
    );
    conn.release();

    res.json(proposals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { getAdvisors, selectAdvisor, getAdvisorProposals, approveProposal, approveAdvisorSelection, getPendingAdvisorSelections };
