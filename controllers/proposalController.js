const pool = require('../config/database');

const uploadProposal = async (req, res) => {
  try {
    const { title, description } = req.body;
    const studentId = req.user.id;
    const fileData = req.file.buffer;
    const fileName = req.file.originalname;

    const conn = await pool.getConnection();
    await conn.query(
      'INSERT INTO proposals (student_id, title, description, file_name, file_data, status) VALUES (?, ?, ?, ?, ?, ?)',
      [studentId, title, description, fileName, fileData, 'pending']
    );
    conn.release();

    res.status(201).json({ message: 'Proposal uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProposals = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [proposals] = await conn.query(
      `SELECT p.*, u.name as student_name FROM proposals p 
       JOIN users u ON p.student_id = u.id 
       ORDER BY p.created_at DESC`
    );
    conn.release();

    res.json(proposals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudentProposals = async (req, res) => {
  try {
    const studentId = req.user.id;
    const conn = await pool.getConnection();
    const [proposals] = await conn.query(
      'SELECT * FROM proposals WHERE student_id = ? ORDER BY created_at DESC',
      [studentId]
    );
    conn.release();

    res.json(proposals);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadProposal = async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    const [proposals] = await conn.query(
      'SELECT file_name, file_data FROM proposals WHERE id = ?',
      [id]
    );
    conn.release();

    if (proposals.length === 0) {
      return res.status(404).json({ message: 'Proposal not found' });
    }

    const { file_name, file_data } = proposals[0];
    res.setHeader('Content-Disposition', `attachment; filename="${file_name}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(file_data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadProposal,
  getProposals,
  getStudentProposals,
  downloadProposal
};
