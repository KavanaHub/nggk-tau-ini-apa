import express from 'express';
import auth from '../middleware/auth.js';
import requireRole from '../middleware/role.js';
import pool from '../config/db.js';

const router = express.Router();

// Get Profile Penguji
router.get('/profile', auth, requireRole('penguji'), async (req, res, next) => {
  try {
    const pengujiId = req.user.id;
    const [rows] = await pool.query(
      `SELECT id, email, nidn, nama, no_wa, is_active, created_at
       FROM penguji WHERE id = ?`,
      [pengujiId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'Penguji tidak ditemukan' });
    }

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// Get Sidang yang ditugaskan sebagai penguji utama
router.get('/sidang', auth, requireRole('penguji'), async (req, res, next) => {
  try {
    const pengujiId = req.user.id;
    const [rows] = await pool.query(
      `SELECT s.*, m.nama as mahasiswa_nama, m.npm, m.judul_proyek,
              dp.nama as dosen_pembimbing_nama
       FROM sidang s
       JOIN mahasiswa m ON s.mahasiswa_id = m.id
       JOIN dosen_pembimbing dp ON s.dosen_pembimbing_id = dp.id
       WHERE s.penguji_id = ?
       ORDER BY s.tanggal DESC, s.waktu ASC`,
      [pengujiId]
    );

    res.json(rows);
  } catch (err) {
    next(err);
  }
});

export default router;
