import pool from '../config/database.js';
import {
  validateProjectExists,
  validateProjectAllowsSubmissionMode,
  validateStudentInfo,
  validateFormData,
  validateGroupMode,
  validateProposalFile,
  validateDuplicateProposal
} from '../validators/proposalValidator.js';

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

const uploadGroupProposal = async (req, res) => {
  try {
    const {
      project_id,
      is_group_submission,
      student2_id,
      group_id,
      title,
      description,
      student1_name,
      student1_npm,
      student1_program,
      student2_name,
      student2_npm,
      student2_program
    } = req.body;

    const student1Id = req.user.id;
    const fileData = req.file?.buffer;
    const fileName = req.file?.originalname;

    if (!project_id) {
      return res.status(400).json({ message: 'project_id is required' });
    }

    if (is_group_submission === undefined) {
      return res.status(400).json({ message: 'is_group_submission mode must be specified' });
    }

    const fileValidation = validateProposalFile(req.file);
    if (!fileValidation.valid) {
      return res.status(400).json({ message: fileValidation.error });
    }

    const projectValidation = await validateProjectExists(project_id);
    if (!projectValidation.valid) {
      return res.status(404).json({ message: projectValidation.error });
    }

    const modeValidation = validateProjectAllowsSubmissionMode(
      projectValidation.project.project_number,
      is_group_submission
    );
    if (!modeValidation.valid) {
      return res.status(400).json({ message: modeValidation.error });
    }

    if (is_group_submission && !student2_id) {
      return res.status(400).json({ message: 'student2_id is required for group submission' });
    }

    const studentValidation = await validateStudentInfo(student1Id, student2_id || null, is_group_submission);
    if (!studentValidation.valid) {
      return res.status(400).json({ message: studentValidation.error });
    }

    const formValidation = validateFormData(title, description, student1_name, student1_npm, student1_program);
    if (!formValidation.valid) {
      return res.status(400).json({ message: 'Validation errors', errors: formValidation.errors });
    }

    if (is_group_submission && student2_name) {
      if (!student2_npm || !student2_program) {
        return res.status(400).json({ message: 'Student 2 NPM and program are required for group submission' });
      }

      const groupValidation = await validateGroupMode(student1Id, student2_id, group_id);
      if (!groupValidation.valid) {
        return res.status(400).json({ message: groupValidation.error });
      }
    }

    const dupValidation = await validateDuplicateProposal(project_id, student1Id, student2_id || null);
    if (!dupValidation.valid) {
      return res.status(409).json({ message: dupValidation.error });
    }

    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO proposals (
          project_id, student_id, student2_id, is_group_submission, title, description,
          file_name, file_data, status, coordinator_approval_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          project_id,
          student1Id,
          student2_id || null,
          is_group_submission,
          title,
          description,
          fileName,
          fileData,
          'pending',
          'pending_approval'
        ]
      );

      if (is_group_submission && group_id) {
        await conn.query(
          'UPDATE proposals SET group_id = ? WHERE id = ?',
          [group_id, result.insertId]
        );
      }

      await conn.commit();

      res.status(201).json({
        message: 'Proposal submitted successfully',
        proposal_id: result.insertId,
        mode: is_group_submission ? 'group' : 'solo',
        submission: {
          student1: {
            id: student1Id,
            name: student1_name,
            npm: student1_npm,
            program: student1_program
          },
          student2: is_group_submission ? {
            id: student2_id,
            name: student2_name,
            npm: student2_npm,
            program: student2_program
          } : null,
          title,
          project_id
        }
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
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

export { uploadProposal, uploadGroupProposal, getProposals, getStudentProposals, downloadProposal };
