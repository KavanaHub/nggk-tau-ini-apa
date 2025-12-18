import pool from "../config/db.js";
import sharedController from './sharedController.js';

const koordinatorController = {
  // GET PROFILE KOORDINATOR
  getProfile: async (req, res, next) => {
    try {
      const koordinatorId = req.user.id;
      const [rows] = await pool.query(
        `SELECT id, email, nidn, nama, no_wa, is_active, assigned_semester, created_at
         FROM koordinator WHERE id = ?`,
        [koordinatorId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Koordinator tidak ditemukan" });
      }

      // Add semester label
      const semesterLabels = {
        2: 'Proyek 1 (Semester 2)',
        3: 'Proyek 2 (Semester 3)',
        5: 'Proyek 3 (Semester 5)',
        7: 'Internship 1 (Semester 7)',
        8: 'Internship 2 (Semester 8)'
      };

      const result = {
        ...rows[0],
        semester_label: rows[0].assigned_semester ? semesterLabels[rows[0].assigned_semester] : null
      };

      res.json(result);
    } catch (err) {
      next(err);
    }
  },

  // GET ASSIGNED SEMESTER - untuk koordinator cek apa yang di-assign
  getAssignedSemester: async (req, res, next) => {
    try {
      const koordinatorId = req.user.id;
      const [rows] = await pool.query(
        'SELECT assigned_semester FROM koordinator WHERE id = ?',
        [koordinatorId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Koordinator tidak ditemukan" });
      }

      const semester = rows[0].assigned_semester;
      if (!semester) {
        return res.json({
          assigned: false,
          semester: null,
          message: 'Belum ada semester yang di-assign. Hubungi Kaprodi.'
        });
      }

      const semesterLabels = {
        2: 'Proyek 1 (Semester 2)',
        3: 'Proyek 2 (Semester 3)',
        5: 'Proyek 3 (Semester 5)',
        7: 'Internship 1 (Semester 7)',
        8: 'Internship 2 (Semester 8)'
      };

      res.json({
        assigned: true,
        semester: semester,
        semester_label: semesterLabels[semester]
      });
    } catch (err) {
      next(err);
    }
  },

  // GET SEMUA MAHASISWA - menggunakan shared function
  getAllMahasiswa: sharedController.getAllMahasiswa,

  // GET SEMUA DOSEN - menggunakan shared function
  getAllDosen: sharedController.getAllDosen,

  // GET MAHASISWA YANG PROPOSAL PENDING (dengan usulan dosen)
  getPendingProposals: async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT m.id, m.npm, m.nama, m.email, m.track, m.judul_proyek, 
                m.file_proposal, m.usulan_dosen_id, m.created_at,
                d.nama as usulan_dosen_nama, d.nidn as usulan_dosen_nidn
         FROM mahasiswa m
         LEFT JOIN dosen d ON m.usulan_dosen_id = d.id
         WHERE m.status_proposal = 'pending' AND m.judul_proyek IS NOT NULL
         ORDER BY m.created_at ASC`
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // VALIDASI PROPOSAL (APPROVE / REJECT) - menggunakan shared function
  validateProposal: sharedController.updateProposalStatus,

  // ASSIGN DOSEN KE MAHASISWA - menggunakan shared function
  assignDosen: sharedController.assignDosen,

  // GET STATISTIK KOORDINATOR
  getStats: async (req, res, next) => {
    try {
      const [[{ total_mahasiswa }]] = await pool.query('SELECT COUNT(*) as total_mahasiswa FROM mahasiswa');
      const [[{ proposal_pending }]] = await pool.query("SELECT COUNT(*) as proposal_pending FROM mahasiswa WHERE status_proposal = 'pending'");
      const [[{ menunggu_pembimbing }]] = await pool.query("SELECT COUNT(*) as menunggu_pembimbing FROM mahasiswa WHERE status_proposal = 'approved' AND dosen_id IS NULL");
      const [[{ siap_sidang }]] = await pool.query(`
        SELECT COUNT(*) as siap_sidang FROM mahasiswa m 
        WHERE (SELECT COUNT(*) FROM bimbingan WHERE mahasiswa_id = m.id AND status = 'approved') >= 8
      `);

      res.json({
        total_mahasiswa,
        proposal_pending,
        menunggu_pembimbing,
        siap_sidang
      });
    } catch (err) {
      next(err);
    }
  },
};

export default koordinatorController;
