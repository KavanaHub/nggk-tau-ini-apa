import {
  getConnection,
  releaseConnection,
  validatePDFFile,
  checkProposalOwnership,
  checkRequired,
  checkNumber,
  sendFileDownload,
  extractFileInfo
} from './helpers/commonHelpers.js';
import {
  sendSuccess,
  sendError,
  sendServerError
} from './helpers/response.js';

const uploadReport = async (req, res) => {
  let conn = null;

  try {
    const fileValidation = validatePDFFile(req.file);
    if (!fileValidation.valid) {
      return sendError(res, fileValidation.error, 400);
    }

    const { proposalId } = req.body;
    const proposalIdCheck = checkRequired(proposalId, 'Proposal ID');
    if (!proposalIdCheck.valid) {
      return sendError(res, proposalIdCheck.error, 400);
    }

    const proposalIdNumber = checkNumber(proposalId, 'Proposal ID');
    if (!proposalIdNumber.valid) {
      return sendError(res, proposalIdNumber.error, 400);
    }

    const studentId = req.user.id;

    const { fileName, fileData } = extractFileInfo(req.file);

    conn = await getConnection();

    const ownership = await checkProposalOwnership(conn, proposalId, studentId);
    if (!ownership.valid) {
      releaseConnection(conn);
      return sendError(res, ownership.error, 403);
    }

    const [result] = await conn.query(
      `INSERT INTO reports (proposal_id, student_id, file_name, file_data, status)
       VALUES (?, ?, ?, ?, ?)`,
      [proposalId, studentId, fileName, fileData, 'pending']
    );

    releaseConnection(conn);

    return sendSuccess(
      res,
      {
        report_id: result.insertId,
        proposal_id: proposalId,
        file_name: fileName,
        status: 'pending'
      },
      'Report uploaded successfully. Waiting for advisor approval.',
      201
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const getReports = async (req, res) => {
  let conn = null;

  try {
    conn = await getConnection();

    const [reports] = await conn.query(
      `SELECT
         r.id,
         r.proposal_id,
         r.student_id,
         r.file_name,
         r.status,
         r.created_at,
         r.updated_at,
         u.name as student_name,
         u.npm as student_npm,
         p.title as proposal_title,
         p.project_type,
         p.program_studi
       FROM reports r
       JOIN users u ON r.student_id = u.id
       JOIN proposals p ON r.proposal_id = p.id
       ORDER BY r.created_at DESC`
    );

    releaseConnection(conn);

    return sendSuccess(res, { reports, total: reports.length }, 'Reports retrieved successfully');

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const downloadReport = async (req, res) => {
  let conn = null;

  try {
    const { id } = req.params;

    const idCheck = checkNumber(id, 'Report ID');
    if (!idCheck.valid) {
      return sendError(res, idCheck.error, 400);
    }

    conn = await getConnection();

    const [reports] = await conn.query(
      'SELECT file_name, file_data FROM reports WHERE id = ?',
      [id]
    );

    releaseConnection(conn);

    if (reports.length === 0) {
      return sendError(res, 'Report not found', 404);
    }

    const { file_name, file_data } = reports[0];

    sendFileDownload(res, file_name, file_data);

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

const approveReport = async (req, res) => {
  let conn = null;

  try {
    const { reportId, status } = req.body;

    const reportIdCheck = checkRequired(reportId, 'Report ID');
    if (!reportIdCheck.valid) {
      return sendError(res, reportIdCheck.error, 400);
    }

    const reportIdNumber = checkNumber(reportId, 'Report ID');
    if (!reportIdNumber.valid) {
      return sendError(res, reportIdNumber.error, 400);
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

    const [reports] = await conn.query(
      'SELECT id, proposal_id FROM reports WHERE id = ?',
      [reportId]
    );

    if (reports.length === 0) {
      releaseConnection(conn);
      return sendError(res, 'Report not found', 404);
    }

    await conn.query(
      'UPDATE reports SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, reportId]
    );

    releaseConnection(conn);

    const message = status === 'approved'
      ? 'Report approved successfully'
      : 'Report rejected. Student needs to revise and re-upload.';

    return sendSuccess(
      res,
      {
        report_id: reportId,
        status: status,
        proposal_id: reports[0].proposal_id
      },
      message
    );

  } catch (error) {
    releaseConnection(conn);
    return sendServerError(res, error);
  }
};

export { uploadReport, getReports, downloadReport, approveReport };
