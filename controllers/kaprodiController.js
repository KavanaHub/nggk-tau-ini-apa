import pool from '../config/db.js';
import sharedController from './sharedController.js';

const kaprodiController = {
  // GET PROFILE KAPRODI (dosen dengan jabatan kaprodi)
  getProfile: async (req, res, next) => {
    try {
      const dosenId = req.user.id;
      const [rows] = await pool.query(
        `SELECT id, email, nidn, nama, no_wa, jabatan, is_active, created_at
         FROM dosen WHERE id = ? AND jabatan LIKE '%kaprodi%'`,
        [dosenId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Kaprodi tidak ditemukan" });
      }

      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  },

  // GET SEMUA MAHASISWA - menggunakan shared function
  getAllMahasiswa: sharedController.getAllMahasiswa,

  // GET SEMUA DOSEN - menggunakan shared function
  getAllDosen: sharedController.getAllDosen,

  // GET SEMUA KOORDINATOR - menggunakan shared function
  getAllKoordinator: sharedController.getAllKoordinator,

  // GET SEMUA PENGUJI - menggunakan shared function
  getAllPenguji: sharedController.getAllPenguji,

  // ASSIGN DOSEN KE MAHASISWA - menggunakan shared function
  assignDosen: sharedController.assignDosen,

  // APPROVE / REJECT PROPOSAL MAHASISWA - menggunakan shared function
  updateProposalStatus: sharedController.updateProposalStatus,

  // GET STATISTIK DASHBOARD
  getDashboardStats: async (req, res, next) => {
    try {
      const [[{ total_mahasiswa }]] = await pool.query('SELECT COUNT(*) as total_mahasiswa FROM mahasiswa');
      const [[{ total_dosen }]] = await pool.query('SELECT COUNT(*) as total_dosen FROM dosen WHERE is_active = 1');
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
