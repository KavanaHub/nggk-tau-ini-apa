const pool = require('../config/database');

const uploadExamSubmission = async (req, res) => {
  try {
    const { proposalId } = req.body;
    const studentId = req.user.id;
    const fileData = req.file.buffer;
    const fileName = req.file.originalname;

    const conn = await pool.getConnection();
    await conn.query(
      `INSERT INTO exam_submissions (proposal_id, student_id, file_name, file_data, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [proposalId, studentId, fileName, fileData, 'submitted']
    );
    conn.release();

    res.status(201).json({ message: 'Exam submission uploaded successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExamSubmissions = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [submissions] = await conn.query(
      `SELECT e.*, u.name as student_name, p.title as proposal_title 
       FROM exam_submissions e 
       JOIN users u ON e.student_id = u.id 
       JOIN proposals p ON e.proposal_id = p.id 
       ORDER BY e.created_at DESC`
    );
    conn.release();

    res.json(submissions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveExamSubmission = async (req, res) => {
  try {
    const { submissionId, status } = req.body;
    const conn = await pool.getConnection();

    await conn.query(
      'UPDATE exam_submissions SET exam_approval_status = ? WHERE id = ?',
      [status, submissionId]
    );
    conn.release();

    res.json({ message: `Exam submission ${status}` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assessExam = async (req, res) => {
  try {
    const { submissionId, score, feedback, assessorId } = req.body;
    const conn = await pool.getConnection();

    await conn.query(
      `INSERT INTO exam_assessments (submission_id, assessor_id, score, feedback, status) 
       VALUES (?, ?, ?, ?, ?)`,
      [submissionId, assessorId, score, feedback, 'completed']
    );

    await conn.query(
      'UPDATE exam_submissions SET assessment_status = ? WHERE id = ?',
      ['assessed', submissionId]
    );
    conn.release();

    res.status(201).json({ message: 'Exam assessed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExamAssessments = async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const [assessments] = await conn.query(
      `SELECT e.*, u.name as assessor_name, s.file_name as submission_file 
       FROM exam_assessments e 
       JOIN users u ON e.assessor_id = u.id 
       JOIN exam_submissions s ON e.submission_id = s.id 
       ORDER BY e.created_at DESC`
    );
    conn.release();

    res.json(assessments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  uploadExamSubmission,
  getExamSubmissions,
  approveExamSubmission,
  assessExam,
  getExamAssessments
};
