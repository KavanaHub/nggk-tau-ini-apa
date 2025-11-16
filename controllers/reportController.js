const pool = require('../config/database');

const uploadReport = async (req, res) => {
  try {
    const { proposalId } = req.body;
    const studentId = req.user.id;
    const fileData = req.file.buffer;
    const fileName = req.file.originalname;

    const conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO reports (proposal_id, student_id, file_name, file_data, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [proposalId, studentId, fileName, fileData, 'pending']
    );
    conn.release();

    res.status(201).json({ message: 'Report uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [reports] = await conn.query(
      `SELECT r.*, u.name as student_name, p.title as proposal_title 
       FROM reports r 
       JOIN users u ON r.student_id = u.id 
       JOIN proposals p ON r.proposal_id = p.id 
       ORDER BY r.created_at DESC`
    );
    conn.release();

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const downloadReport = async (req, res) => {
  try {
    const { id } = req.params;
    const conn = await pool.getConnection();
    const [reports] = await conn.query(
      'SELECT file_name, file_data FROM reports WHERE id = ?',
      [id]
    );
    conn.release();

    if (reports.length === 0) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const { file_name, file_data } = reports[0];
    res.setHeader('Content-Disposition', `attachment; filename="${file_name}"`);
    res.setHeader('Content-Type', 'application/pdf');
    res.send(file_data);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveReport = async (req, res) => {
  try {
    const { reportId, status } = req.body;
    const conn = await pool.getConnection();

    await conn.query(
      'UPDATE reports SET status = ? WHERE id = ?',
      [status, reportId]
    );
    conn.release();

    res.json({ message: `Report ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadReport,
  getReports,
  downloadReport,
  approveReport
};
