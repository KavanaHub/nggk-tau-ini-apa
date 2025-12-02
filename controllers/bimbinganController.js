import pool from '../config/db.js';

const bimbinganController = {
  // MAHASISWA: CREATE BIMBINGAN
  createBimbingan: async (req, res, next) => {
    const mahasiswaId = req.user.id;
    const { tanggal, minggu_ke, topik, catatan } = req.body;

    if (!tanggal || !minggu_ke || !topik) {
      return res.status(400).json({ message: 'tanggal, minggu_ke, dan topik wajib diisi' });
    }

    try {
      // Cek mahasiswa punya dosen pembimbing
      const [mhsRows] = await pool.query(
        'SELECT dosen_pembimbing_id FROM mahasiswa WHERE id = ?',
        [mahasiswaId]
      );

      if (mhsRows.length === 0) {
        return res.status(404).json({ message: 'Mahasiswa tidak ditemukan' });
      }

      if (!mhsRows[0].dosen_pembimbing_id) {
        return res.status(400).json({ message: 'Anda belum memiliki dosen pembimbing' });
      }

      // Cek jumlah bimbingan (max 8)
      const [[{ total }]] = await pool.query(
        'SELECT COUNT(*) AS total FROM bimbingan WHERE mahasiswa_id = ?',
        [mahasiswaId]
      );

      if (total >= 8) {
        return res.status(400).json({ message: 'Bimbingan sudah mencapai batas maksimal (8 kali)' });
      }

      const [result] = await pool.query(
        `INSERT INTO bimbingan (mahasiswa_id, dosen_pembimbing_id, tanggal, minggu_ke, topik, catatan, status)
         VALUES (?, ?, ?, ?, ?, ?, 'waiting')`,
        [mahasiswaId, mhsRows[0].dosen_pembimbing_id, tanggal, minggu_ke, topik, catatan || null]
      );

      res.status(201).json({ message: 'Bimbingan berhasil dibuat', id: result.insertId });
    } catch (err) {
      next(err);
    }
  },

  // MAHASISWA: GET LIST BIMBINGAN SENDIRI
  getMyBimbingan: async (req, res, next) => {
    const mahasiswaId = req.user.id;

    try {
      const [rows] = await pool.query(
        `SELECT b.id, b.tanggal, b.minggu_ke, b.topik, b.catatan, b.status, 
                b.approved_at, b.created_at, dp.nama as dosen_nama
         FROM bimbingan b
         JOIN dosen_pembimbing dp ON b.dosen_pembimbing_id = dp.id
         WHERE b.mahasiswa_id = ?
         ORDER BY b.minggu_ke ASC`,
        [mahasiswaId]
      );

      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // DOSEN: GET LIST BIMBINGAN DARI MAHASISWA BIMBINGAN
  getDosenBimbingan: async (req, res, next) => {
    const dosenId = req.user.id;

    try {
      const [rows] = await pool.query(
        `SELECT b.id, b.tanggal, b.minggu_ke, b.topik, b.catatan, b.status,
                b.approved_at, b.created_at, m.nama as mahasiswa_nama, m.npm
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

  // DOSEN: APPROVE / REJECT BIMBINGAN
  updateBimbinganStatus: async (req, res, next) => {
    const dosenId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'status wajib diisi' });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Status harus approved atau rejected' });
    }

    try {
      // Cek bimbingan milik dosen ini
      const [rows] = await pool.query(
        'SELECT id FROM bimbingan WHERE id = ? AND dosen_pembimbing_id = ?',
        [id, dosenId]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Bimbingan tidak ditemukan atau bukan milik Anda' });
      }

      const approvedAt = status === 'approved' ? 'NOW()' : 'NULL';

      await pool.query(
        `UPDATE bimbingan SET status = ?, approved_at = ${approvedAt} WHERE id = ?`,
        [status, id]
      );

      res.json({ message: `Bimbingan ${status}` });
    } catch (err) {
      next(err);
    }
  },

  // GET DETAIL BIMBINGAN
  getBimbinganById: async (req, res, next) => {
    const { id } = req.params;

    try {
      const [rows] = await pool.query(
        `SELECT b.*, m.nama as mahasiswa_nama, m.npm, dp.nama as dosen_nama
         FROM bimbingan b
         JOIN mahasiswa m ON b.mahasiswa_id = m.id
         JOIN dosen_pembimbing dp ON b.dosen_pembimbing_id = dp.id
         WHERE b.id = ?`,
        [id]
      );

      if (rows.length === 0) {
        return res.status(404).json({ message: 'Bimbingan tidak ditemukan' });
      }

      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  },
};

export default bimbinganController;
