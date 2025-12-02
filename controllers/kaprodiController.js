import pool from '../config/db.js';

const kaprodiController = {
  // GET PROFILE KAPRODI
  getProfile: async (req, res, next) => {
    try {
      const kaprodiId = req.user.id;
      const [rows] = await pool.query(
        `SELECT id, email, nidn, nama, no_wa, prodi, is_active, created_at
         FROM kaprodi WHERE id = ?`,
        [kaprodiId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Kaprodi tidak ditemukan" });
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

  // GET SEMUA KOORDINATOR
  getAllKoordinator: async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, nidn, nama, email, no_wa, is_active FROM koordinator ORDER BY nama ASC`
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // GET SEMUA PENGUJI
  getAllPenguji: async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, nidn, nama, email, no_wa, is_active FROM penguji ORDER BY nama ASC`
      );

      res.json(rows);
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

  // APPROVE / REJECT PROPOSAL MAHASISWA
  updateProposalStatus: async (req, res, next) => {
    const { mahasiswa_id, status } = req.body;

    if (!mahasiswa_id || !status) {
      return res.status(400).json({ message: 'mahasiswa_id dan status wajib diisi' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status harus approved atau rejected' });
    }

    try {
      await pool.query(
        'UPDATE mahasiswa SET status_proposal = ? WHERE id = ?',
        [status, mahasiswa_id]
      );

      res.json({ message: `Proposal ${status}` });
    } catch (err) {
      next(err);
    }
  },

  // GET STATISTIK DASHBOARD
  getDashboardStats: async (req, res, next) => {
    try {
      const [[{ total_mahasiswa }]] = await pool.query('SELECT COUNT(*) as total_mahasiswa FROM mahasiswa');
      const [[{ total_dosen }]] = await pool.query('SELECT COUNT(*) as total_dosen FROM dosen_pembimbing WHERE is_active = 1');
      const [[{ total_koordinator }]] = await pool.query('SELECT COUNT(*) as total_koordinator FROM koordinator WHERE is_active = 1');
      const [[{ total_penguji }]] = await pool.query('SELECT COUNT(*) as total_penguji FROM penguji WHERE is_active = 1');
      const [[{ proposal_pending }]] = await pool.query("SELECT COUNT(*) as proposal_pending FROM mahasiswa WHERE status_proposal = 'pending'");
      const [[{ proposal_approved }]] = await pool.query("SELECT COUNT(*) as proposal_approved FROM mahasiswa WHERE status_proposal = 'approved'");

      res.json({
        total_mahasiswa,
        total_dosen,
        total_koordinator,
        total_penguji,
        proposal_pending,
        proposal_approved
      });
    } catch (err) {
      next(err);
    }
  },
};

export default kaprodiController;
