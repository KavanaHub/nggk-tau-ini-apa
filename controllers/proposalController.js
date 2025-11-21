import {
  getConnection,
  releaseConnection,
  validatePDFFile,
  checkRequired,
  checkNumber,
  extractFileInfo,
  sendFileDownload
} from './helpers/commonHelpers.js';
import {
  sendSuccess,
  sendError,
  sendServerError
} from './helpers/response.js';
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
  let conn = null;

  try {
    const { title, description } = req.body;
    const studentId = req.user.id;

    const titleCheck = checkRequired(title, 'Title');
    if (!titleCheck.valid) {
      return sendError(res, titleCheck.error, 400);
    }

    const fileValidation = validatePDFFile(req.file);
    if (!fileValidation.valid) {
      return sendError(res, fileValidation.error, 400);
    }

    const { fileName, fileData } = extractFileInfo(req.file);

    conn = await getConnection();

    const [result] = await conn.query(
      'INSERT INTO proposals (student_id, title, description, file_name, file_data, status) VALUES (?, ?, ?, ?, ?, ?)',
      [studentId, title, description, fileName, fileData, 'pending']
    );

    releaseConnection(conn);

    return sendSuccess(
      res,
      {
        proposal_id: result.insertId,
        title,
        status: 'pending'
      },
      'Proposal uploaded successfully',
      201
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const uploadGroupProposal = async (req, res) => {
  let conn = null;

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
      student2_program,
      project_type,
      program_studi
    } = req.body;

    const student1Id = req.user.id;
    const fileData = req.file?.buffer;
    const fileName = req.file?.originalname;

    const projectTypeCheck = checkRequired(project_type, 'Project type');
    if (!projectTypeCheck.valid) {
      return sendError(res, projectTypeCheck.error, 400);
    }

    const programStudiCheck = checkRequired(program_studi, 'Program studi');
    if (!programStudiCheck.valid) {
      return sendError(res, programStudiCheck.error, 400);
    }

    const projectIdCheck = checkRequired(project_id, 'Project ID');
    if (!projectIdCheck.valid) {
      return sendError(res, projectIdCheck.error, 400);
    }

    if (is_group_submission === undefined) {
      return sendError(res, 'is_group_submission mode must be specified', 400);
    }

    const validProjectTypes = ['project1', 'project2', 'project3', 'internship1', 'internship2'];
    if (!validProjectTypes.includes(project_type)) {
      return sendError(
        res,
        `project_type must be one of: ${validProjectTypes.join(', ')}`,
        400
      );
    }

    if (!['D3', 'D4'].includes(program_studi)) {
      return sendError(res, 'program_studi must be either "D3" or "D4"', 400);
    }

    const isProjectType = ['project1', 'project2', 'project3'].includes(project_type);
    const isInternshipType = ['internship1', 'internship2'].includes(project_type);

    if (isProjectType && !is_group_submission) {
      return sendError(
        res,
        'Projects 1-3 MUST be group submissions with 2 members',
        400
      );
    }

    if (isInternshipType && is_group_submission) {
      return sendError(
        res,
        'Internships MUST be solo submissions (1 student only)',
        400
      );
    }

    const fileValidation = validateProposalFile(req.file);
    if (!fileValidation.valid) {
      return sendError(res, fileValidation.error, 400);
    }

    const projectValidation = await validateProjectExists(project_id);
    if (!projectValidation.valid) {
      return sendError(res, projectValidation.error, 404);
    }

    const modeValidation = validateProjectAllowsSubmissionMode(
      projectValidation.project.project_number,
      is_group_submission
    );
    if (!modeValidation.valid) {
      return sendError(res, modeValidation.error, 400);
    }

    if (is_group_submission && !student2_id) {
      return sendError(res, 'student2_id is required for group submission', 400);
    }

    const studentValidation = await validateStudentInfo(
      student1Id,
      student2_id || null,
      is_group_submission
    );
    if (!studentValidation.valid) {
      return sendError(res, studentValidation.error, 400);
    }

    const formValidation = validateFormData(
      title,
      description,
      student1_name,
      student1_npm,
      student1_program
    );
    if (!formValidation.valid) {
      return sendError(res, 'Validation errors', 400);
    }

    if (is_group_submission && student2_name) {
      if (!student2_npm || !student2_program) {
        return sendError(
          res,
          'Student 2 NPM and program are required for group submission',
          400
        );
      }

      const groupValidation = await validateGroupMode(student1Id, student2_id, group_id);
      if (!groupValidation.valid) {
        return sendError(res, groupValidation.error, 400);
      }
    }

    const dupValidation = await validateDuplicateProposal(
      project_id,
      student1Id,
      student2_id || null
    );
    if (!dupValidation.valid) {
      return sendError(res, dupValidation.error, 409);
    }

    conn = await getConnection();

    try {
      await conn.beginTransaction();

      const [result] = await conn.query(
        `INSERT INTO proposals (
          project_id, student_id, student2_id, is_group_submission, title, description,
          file_name, file_data, status, coordinator_approval_status,
          project_type, program_studi, max_guidance_sessions,
          coordinator_validated
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          project_id,
          student1Id,
          student2_id || null,
          is_group_submission,
          title,
          description,
          fileName,
          fileData,
          'submitted',
          'pending_approval',
          project_type,
          program_studi,
          8,
          false
        ]
      );

      const proposalId = result.insertId;

      if (is_group_submission && group_id) {
        await conn.query(
          'UPDATE proposals SET group_id = ? WHERE id = ?',
          [group_id, proposalId]
        );
      }

      await conn.commit();
      releaseConnection(conn);

      return sendSuccess(
        res,
        {
          proposal_id: proposalId,
          mode: is_group_submission ? 'group' : 'solo',
          project_type,
          program_studi,
          next_step: 'Coordinator must validate proposal before advisor selection',
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
            project_id,
            project_type,
            program_studi
          }
        },
        'Proposal submitted successfully. Awaiting coordinator validation.',
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

const getProposals = async (req, res) => {
  let conn = null;

  try {
    conn = await getConnection();

    const [proposals] = await conn.query(
      `SELECT
         p.*,
         u.name as student_name,
         u.npm as student_npm,
         u2.name as student2_name,
         u2.npm as student2_npm
       FROM proposals p
       JOIN users u ON p.student_id = u.id
       LEFT JOIN users u2 ON p.student2_id = u2.id
       ORDER BY p.created_at DESC`
    );

    releaseConnection(conn);

    return sendSuccess(
      res,
      { proposals, total: proposals.length },
      'Proposals retrieved successfully'
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const getStudentProposals = async (req, res) => {
  let conn = null;

  try {
    const studentId = req.user.id;

    conn = await getConnection();

    const [proposals] = await conn.query(
      `SELECT
         p.*,
         u.name as student_name,
         u.npm as student_npm,
         u2.name as student2_name,
         u2.npm as student2_npm
       FROM proposals p
       JOIN users u ON p.student_id = u.id
       LEFT JOIN users u2 ON p.student2_id = u2.id
       WHERE p.student_id = ? OR p.student2_id = ?
       ORDER BY p.created_at DESC`,
      [studentId, studentId]
    );

    releaseConnection(conn);

    return sendSuccess(
      res,
      { proposals, total: proposals.length },
      'Student proposals retrieved successfully'
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const downloadProposal = async (req, res) => {
  let conn = null;

  try {
    const { id } = req.params;

    const idCheck = checkNumber(id, 'Proposal ID');
    if (!idCheck.valid) {
      return sendError(res, idCheck.error, 400);
    }

    conn = await getConnection();

    const [proposals] = await conn.query(
      'SELECT file_name, file_data FROM proposals WHERE id = ?',
      [id]
    );

    releaseConnection(conn);

    if (proposals.length === 0) {
      return sendError(res, 'Proposal not found', 404);
    }

    const { file_name, file_data } = proposals[0];

    sendFileDownload(res, file_name, file_data);

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

export {
  uploadProposal,
  uploadGroupProposal,
  getProposals,
  getStudentProposals,
  downloadProposal
};
