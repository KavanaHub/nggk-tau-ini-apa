import pool from "../config/db.js";

const koordinatorController = {
  // GET PROFILE KOORDINATOR
  getProfile: async (req, res, next) => {
    try {
      const koordinatorId = req.user.id;
      const [rows] = await pool.query(
        `SELECT id, email, nidn, nama, no_wa, is_active, created_at
         FROM koordinator WHERE id = ?`,
        [koordinatorId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Koordinator tidak ditemukan" });
      }

      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  },

  // GET SEMUA MAHASISWA
  getAllMahasiswa: async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT m.id, m.npm, m.nama, m.email, m.no_wa, m.angkatan, 
                m.judul_proyek, m.status_proposal, m.dosen_pembimbing_id,
                dp.nama as dosen_pembimbing_nama
         FROM mahasiswa m
         LEFT JOIN dosen_pembimbing dp ON m.dosen_pembimbing_id = dp.id
         ORDER BY m.angkatan DESC, m.nama ASC`
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // GET SEMUA DOSEN PEMBIMBING
  getAllDosenPembimbing: async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, nidn, nama, email, no_wa, is_active FROM dosen_pembimbing ORDER BY nama ASC`
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // GET MAHASISWA YANG PROPOSAL PENDING
  getPendingProposals: async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT m.id, m.npm, m.nama, m.email, m.judul_proyek, m.file_proposal, m.created_at
         FROM mahasiswa m
         WHERE m.status_proposal = 'pending' AND m.judul_proyek IS NOT NULL
         ORDER BY m.created_at ASC`
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // VALIDASI PROPOSAL (APPROVE / REJECT)
  validateProposal: async (req, res, next) => {
    const { mahasiswa_id, status } = req.body;

    if (!mahasiswa_id || !status) {
      return res.status(400).json({ message: 'mahasiswa_id dan status wajib diisi' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status harus approved atau rejected' });
    }

    try {
      // Cek mahasiswa ada
      const [mhsRows] = await pool.query('SELECT id FROM mahasiswa WHERE id = ?', [mahasiswa_id]);
      if (mhsRows.length === 0) {
        return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
      }

      await pool.query(
        'UPDATE mahasiswa SET status_proposal = ? WHERE id = ?',
        [status, mahasiswa_id]
      );

      res.json({ message: `Proposal ${status}` });
    } catch (err) {
      next(err);
    }
  },

  // ASSIGN DOSEN PEMBIMBING KE MAHASISWA
  assignDosenPembimbing: async (req, res, next) => {
    const { mahasiswa_id, dosen_pembimbing_id } = req.body;

    if (!mahasiswa_id || !dosen_pembimbing_id) {
      return res.status(400).json({ message: 'mahasiswa_id dan dosen_pembimbing_id wajib diisi' });
    }

    try {
      // Cek mahasiswa ada
      const [mhsRows] = await pool.query('SELECT id FROM mahasiswa WHERE id = ?', [mahasiswa_id]);
      if (mhsRows.length === 0) {
        return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
      }

      // Cek dosen ada
      const [dosenRows] = await pool.query('SELECT id FROM dosen_pembimbing WHERE id = ?', [dosen_pembimbing_id]);
      if (dosenRows.length === 0) {
        return res.status(404).json({ message: 'Dosen pembimbing tidak ditemukan' });
      }

      await pool.query(
        'UPDATE mahasiswa SET dosen_pembimbing_id = ? WHERE id = ?',
        [dosen_pembimbing_id, mahasiswa_id]
      );

      res.json({ message: 'Dosen pembimbing berhasil ditugaskan' });
    } catch (err) {
      next(err);
    }
  },

  // GET STATISTIK KOORDINATOR
  getStats: async (req, res, next) => {
    try {
      const [[{ total_mahasiswa }]] = await pool.query('SELECT COUNT(*) as total_mahasiswa FROM mahasiswa');
      const [[{ proposal_pending }]] = await pool.query("SELECT COUNT(*) as proposal_pending FROM mahasiswa WHERE status_proposal = 'pending'");
      const [[{ proposal_approved }]] = await pool.query("SELECT COUNT(*) as proposal_approved FROM mahasiswa WHERE status_proposal = 'approved'");
      const [[{ mahasiswa_tanpa_dosen }]] = await pool.query('SELECT COUNT(*) as mahasiswa_tanpa_dosen FROM mahasiswa WHERE dosen_pembimbing_id IS NULL');

      res.json({
        total_mahasiswa,
        proposal_pending,
        proposal_approved,
        mahasiswa_tanpa_dosen
      });
    } catch (err) {
      next(err);
    }
  },
};

export default koordinatorController;
