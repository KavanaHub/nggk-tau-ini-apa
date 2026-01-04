import pool from '../config/db.js';
import sharedController from './sharedController.js';

const dosenController = {
  // GET PROFILE DOSEN
  getProfile: async (req, res, next) => {
    try {
      const dosenId = req.user.id;
      const [rows] = await pool.query(
        `SELECT d.id, d.email, d.nidn, d.nama, d.no_wa, d.is_active, d.created_at,
         (SELECT GROUP_CONCAT(r.nama_role) FROM dosen_role dr JOIN role r ON dr.role_id = r.id WHERE dr.dosen_id = d.id) as roles
         FROM dosen d WHERE d.id = ?`,
        [dosenId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: "Dosen tidak ditemukan" });
      }

      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  },

  // LIST SEMUA DOSEN - menggunakan shared function
  listDosen: sharedController.getActiveDosen,

  // GET MAHASISWA BIMBINGAN (mahasiswa yang dibimbing, termasuk sebagai pembimbing 2)
  getMahasiswaBimbingan: async (req, res, next) => {
    try {
      const dosenId = req.user.id;
      const [rows] = await pool.query(
        `SELECT m.id, m.npm, m.nama, m.email, m.no_wa, m.judul_proyek as judul, 
                m.status_proposal, m.track,
                CASE WHEN m.dosen_id = ? THEN 'utama' ELSE 'kedua' END as peran_pembimbing,
                (SELECT COUNT(*) FROM bimbingan WHERE mahasiswa_id = m.id) as bimbingan_count,
                (SELECT COUNT(*) FROM bimbingan WHERE mahasiswa_id = m.id AND status = 'waiting') as bimbingan_pending,
                CASE 
                  WHEN (SELECT COUNT(*) FROM bimbingan WHERE mahasiswa_id = m.id AND status = 'approved') >= 8 THEN 'ready'
                  ELSE 'active'
                END as status
         FROM mahasiswa m
         WHERE m.dosen_id = ? OR m.dosen_id_2 = ?
         ORDER BY m.nama ASC`,
        [dosenId, dosenId, dosenId]
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // GET BIMBINGAN LIST (semua bimbingan dari mahasiswa)
  getBimbinganList: async (req, res, next) => {
    try {
      const dosenId = req.user.id;
      const [rows] = await pool.query(
        `SELECT b.*, m.nama as mahasiswa_nama, m.npm
         FROM bimbingan b
         JOIN mahasiswa m ON b.mahasiswa_id = m.id
         WHERE b.dosen_id = ?
         ORDER BY b.created_at DESC`,
        [dosenId]
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // GET LAPORAN SIDANG (untuk di-approve)
  getLaporanSidang: async (req, res, next) => {
    try {
      const dosenId = req.user.id;
      const [rows] = await pool.query(
        `SELECT ls.*, m.nama as mahasiswa_nama, m.npm, m.judul_proyek
         FROM laporan_sidang ls
         JOIN mahasiswa m ON ls.mahasiswa_id = m.id
         WHERE m.dosen_id = ?
         ORDER BY ls.created_at DESC`,
        [dosenId]
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // GET SIDANG SEBAGAI PENGUJI 1 (Dosen Pembimbing)
  getMySidang: async (req, res, next) => {
    try {
      const dosenId = req.user.id;
      const [rows] = await pool.query(
        `SELECT s.*, m.nama as mahasiswa_nama, m.npm, m.judul_proyek,
                p.nama as penguji_nama
         FROM sidang s
         JOIN mahasiswa m ON s.mahasiswa_id = m.id
         JOIN penguji p ON s.penguji_id = p.id
         WHERE s.dosen_id = ?
         ORDER BY s.tanggal DESC, s.waktu ASC`,
        [dosenId]
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // GET STATS (untuk dashboard)
  getStats: async (req, res, next) => {
    try {
      const dosenId = req.user.id;

      // Count mahasiswa bimbingan
      const [[{ total_mahasiswa }]] = await pool.query(
        `SELECT COUNT(*) as total_mahasiswa FROM mahasiswa WHERE dosen_id = ? OR dosen_id_2 = ?`,
        [dosenId, dosenId]
      );

      // Count bimbingan pending (status: pending or waiting)
      const [[{ bimbingan_pending }]] = await pool.query(
        `SELECT COUNT(*) as bimbingan_pending FROM bimbingan b
         JOIN mahasiswa m ON b.mahasiswa_id = m.id
         WHERE b.dosen_id = ? AND (b.status = 'pending' OR b.status = 'waiting')`,
        [dosenId]
      );

      // Count siap sidang (mahasiswa dengan >= 8 bimbingan approved)
      const [[{ siap_sidang }]] = await pool.query(
        `SELECT COUNT(DISTINCT m.id) as siap_sidang FROM mahasiswa m
         WHERE (m.dosen_id = ? OR m.dosen_id_2 = ?)
         AND (SELECT COUNT(*) FROM bimbingan WHERE mahasiswa_id = m.id AND status = 'approved') >= 8`,
        [dosenId, dosenId]
      );

      // Count laporan pending
      const [[{ laporan_pending }]] = await pool.query(
        `SELECT COUNT(*) as laporan_pending FROM laporan_sidang ls
         JOIN mahasiswa m ON ls.mahasiswa_id = m.id
         WHERE m.dosen_id = ? AND ls.status = 'pending'`,
        [dosenId]
      );

      res.json({
        total_mahasiswa,
        bimbingan_pending,
        siap_sidang,
        laporan_pending
      });
    } catch (err) {
      next(err);
    }
  },
};

export default dosenController;
