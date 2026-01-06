import pool from "../config/db.js";
import sharedController from './sharedController.js';

const koordinatorController = {
  // GET PROFILE KOORDINATOR (dosen with koordinator role)
  getProfile: async (req, res, next) => {
    try {
      const koordinatorId = req.user.id;
      const [rows] = await pool.query(
        `SELECT d.id, d.email, d.nidn, d.nama, d.no_wa, d.is_active, d.created_at,
                (SELECT GROUP_CONCAT(r.nama_role) FROM dosen_role dr JOIN role r ON dr.role_id = r.id WHERE dr.dosen_id = d.id) as roles,
                (SELECT dr.assigned_semester FROM dosen_role dr JOIN role r ON dr.role_id = r.id WHERE dr.dosen_id = d.id AND r.nama_role = 'koordinator') as assigned_semester
         FROM dosen d WHERE d.id = ?`,
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
        `SELECT dr.assigned_semester 
         FROM dosen_role dr 
         JOIN role r ON dr.role_id = r.id 
         WHERE dr.dosen_id = ? AND r.nama_role = 'koordinator'`,
        [koordinatorId]
      );

      if (rows.length === 0) {
        return res.json({
          assigned: false,
          semester: null,
          message: 'Anda bukan koordinator atau belum ada semester yang di-assign. Hubungi Kaprodi.'
        });
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

  // GET ALL PROPOSALS (untuk halaman validasi - menampilkan pending, approved, rejected)
  // Proyek ditampilkan per kelompok dengan semua anggota
  getPendingProposals: async (req, res, next) => {
    try {
      // Get proposals with kelompok info
      const [rows] = await pool.query(
        `SELECT m.id, m.npm, m.nama, m.email, m.track, m.judul_proyek, 
                m.file_proposal, m.usulan_dosen_id, m.status_proposal, m.created_at,
                m.kelompok_id, k.nama as kelompok_nama,
                d.nama as usulan_dosen_nama, d.nidn as usulan_dosen_nidn
         FROM mahasiswa m
         LEFT JOIN dosen d ON m.usulan_dosen_id = d.id
         LEFT JOIN kelompok k ON m.kelompok_id = k.id
         WHERE m.judul_proyek IS NOT NULL AND m.status_proposal IS NOT NULL
         ORDER BY 
           CASE m.status_proposal 
             WHEN 'pending' THEN 1 
             WHEN 'approved' THEN 2 
             WHEN 'rejected' THEN 3 
           END,
           m.created_at DESC`
      );

      // Group by kelompok for proyek, keep individual for internship
      const kelompokMap = new Map();
      const result = [];

      for (const row of rows) {
        const isProyek = row.track && row.track.includes('proyek');

        if (isProyek && row.kelompok_id) {
          // Group by kelompok
          if (!kelompokMap.has(row.kelompok_id)) {
            kelompokMap.set(row.kelompok_id, {
              ...row,
              anggota: []
            });
          }
          kelompokMap.get(row.kelompok_id).anggota.push({
            id: row.id,
            nama: row.nama,
            npm: row.npm,
            email: row.email
          });
        } else {
          // Individual (internship or no kelompok)
          result.push({
            ...row,
            anggota: [{ id: row.id, nama: row.nama, npm: row.npm, email: row.email }]
          });
        }
      }

      // Add kelompok entries to result
      for (const [, kelompok] of kelompokMap) {
        result.push(kelompok);
      }

      // Sort result by status and date
      result.sort((a, b) => {
        const statusOrder = { pending: 1, approved: 2, rejected: 3 };
        const aOrder = statusOrder[a.status_proposal] || 4;
        const bOrder = statusOrder[b.status_proposal] || 4;
        if (aOrder !== bOrder) return aOrder - bOrder;
        return new Date(b.created_at) - new Date(a.created_at);
      });

      res.json(result);
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

  // GET PENGUJI LIST - dosen yang bisa jadi penguji sidang
  getPengujiList: async (req, res, next) => {
    try {
      // Get all dosen as potential penguji
      const [rows] = await pool.query(
        `SELECT d.id, d.nama, d.nidn,
                (SELECT GROUP_CONCAT(r.nama_role) FROM dosen_role dr JOIN role r ON dr.role_id = r.id WHERE dr.dosen_id = d.id) as roles
         FROM dosen d
         WHERE d.is_active = true
         ORDER BY d.nama ASC`
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
};

export default koordinatorController;
