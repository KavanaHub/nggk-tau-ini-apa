import pool from '../config/database.js';

const startGuidance = async (req, res) => {
  try {
    const { proposalId, topic, notes } = req.body;
    const advisorId = req.user.id;
    const conn = await pool.getConnection();

    await conn.query(
      `INSERT INTO guidance_sessions (proposal_id, advisor_id, topic, notes, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [proposalId, advisorId, topic, notes, 'in_progress']
    );
    conn.release();

    res.status(201).json({ message: 'Guidance session started' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getGuidanceSessions = async (req, res) => {
  try {
    const proposalId = req.query.proposalId;
    const conn = await pool.getConnection();
    const [sessions] = await conn.query(
      `SELECT g.*, u.name as advisor_name FROM guidance_sessions g 
       JOIN users u ON g.advisor_id = u.id 
       WHERE g.proposal_id = ? 
       ORDER BY g.created_at DESC`,
      [proposalId]
    );
    conn.release();

    res.json(sessions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const completeGuidance = async (req, res) => {
  try {
    const { guidanceId, feedback } = req.body;
    const conn = await pool.getConnection();

    await conn.query(
      `UPDATE guidance_sessions SET status = ?, feedback = ? WHERE id = ?`,
      ['completed', feedback, guidanceId]
    );
    conn.release();

    res.json({ message: 'Guidance completed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveGuidance = async (req, res) => {
  try {
    const { guidanceId, status } = req.body;
    const conn = await pool.getConnection();

    await conn.query(
      `UPDATE guidance_sessions SET approval_status = ? WHERE id = ?`,
      [status, guidanceId]
    );
    conn.release();

    res.json({ message: `Guidance ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export { startGuidance, getGuidanceSessions, completeGuidance, approveGuidance };
