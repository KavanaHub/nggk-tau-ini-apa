import pool from '../config/db.js';

const dosenController = {
  // GET PROFILE DOSEN PEMBIMBING
  getProfile: async (req, res, next) => {
    try {
      const dosenId = req.user.id;
      const [rows] = await pool.query(
        `SELECT id, email, nidn, nama, no_wa, is_active, created_at
         FROM dosen_pembimbing WHERE id = ?`,
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

  // LIST SEMUA DOSEN PEMBIMBING
  listDosen: async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        'SELECT id, nama, nidn, no_wa FROM dosen_pembimbing WHERE is_active = 1'
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // GET MAHASISWA BIMBINGAN (mahasiswa yang dibimbing)
  getMahasiswaBimbingan: async (req, res, next) => {
    try {
      const dosenId = req.user.id;
      const [rows] = await pool.query(
        `SELECT m.id, m.npm, m.nama, m.email, m.no_wa, m.judul_proyek, m.status_proposal
         FROM mahasiswa m
         WHERE m.dosen_pembimbing_id = ?
         ORDER BY m.nama ASC`,
        [dosenId]
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
         WHERE b.dosen_pembimbing_id = ?
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
         WHERE m.dosen_pembimbing_id = ?
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
         WHERE s.dosen_pembimbing_id = ?
         ORDER BY s.tanggal DESC, s.waktu ASC`,
        [dosenId]
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },
};

export default dosenController;
