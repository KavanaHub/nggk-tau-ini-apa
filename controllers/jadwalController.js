import pool from '../config/db.js';

const jadwalController = {
  list: async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, nama, tipe, semester, start_date, end_date, status, deskripsi, created_by, created_at, updated_at
         FROM jadwal_proyek
         ORDER BY start_date DESC, id DESC`
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  // Get all active periods
  getActive: async (req, res, next) => {
    try {
      const [rows] = await pool.query(
        `SELECT id, nama, tipe, semester, start_date, end_date, status
         FROM jadwal_proyek
         WHERE status = 'active' AND CURDATE() BETWEEN start_date AND end_date
         ORDER BY semester ASC`
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  },

  create: async (req, res, next) => {
    try {
      const { nama, tipe, semester, start_date, end_date, deskripsi } = req.body;
      if (!nama || !tipe || !semester || !start_date || !end_date) {
        return res.status(400).json({ message: 'nama, tipe, semester, start_date, end_date wajib diisi' });
      }

      // Validate semester (2,3,5,7,8)
      const validSemesters = [2, 3, 5, 7, 8];
      if (!validSemesters.includes(parseInt(semester))) {
        return res.status(400).json({ message: 'Semester harus 2, 3, 5, 7, atau 8' });
      }

      const start = new Date(start_date);
      const end = new Date(end_date);
      if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({ message: 'start_date atau end_date tidak valid' });
      }
      if (end < start) {
        return res.status(400).json({ message: 'end_date harus sesudah atau sama dengan start_date' });
      }

      // Check if there's already an active period for this semester
      const [existing] = await pool.query(
        `SELECT id FROM jadwal_proyek WHERE semester = ? AND status = 'active'`,
        [semester]
      );
      if (existing.length > 0) {
        return res.status(400).json({ message: `Sudah ada periode aktif untuk semester ${semester}` });
      }

      const [result] = await pool.query(
        `INSERT INTO jadwal_proyek (nama, tipe, semester, start_date, end_date, status, deskripsi, created_by)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
        [nama, tipe, semester, start_date, end_date, deskripsi || null, req.user?.id || null]
      );

      res.status(201).json({ message: 'Jadwal disimpan', id: result.insertId });
    } catch (err) {
      next(err);
    }
  },

  update: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { nama, tipe, start_date, end_date, deskripsi } = req.body;
      if (!nama || !tipe || !start_date || !end_date) {
        return res.status(400).json({ message: 'nama, tipe, start_date, end_date wajib diisi' });
      }

      const start = new Date(start_date);
      const end = new Date(end_date);
      if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({ message: 'start_date atau end_date tidak valid' });
      }
      if (end < start) {
        return res.status(400).json({ message: 'end_date harus sesudah atau sama dengan start_date' });
      }

      const [result] = await pool.query(
        `UPDATE jadwal_proyek
         SET nama = ?, tipe = ?, start_date = ?, end_date = ?, deskripsi = ?, updated_at = NOW()
         WHERE id = ?`,
        [nama, tipe, start_date, end_date, deskripsi || null, id]
      );

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
      }

      res.json({ message: 'Jadwal diperbarui' });
    } catch (err) {
      next(err);
    }
  },

  complete: async (req, res, next) => {
    const conn = await pool.getConnection();
    try {
      const { id } = req.params;

      await conn.beginTransaction();

      const [rows] = await conn.query(
        'SELECT status FROM jadwal_proyek WHERE id = ? FOR UPDATE',
        [id]
      );
      if (rows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ message: 'Jadwal tidak ditemukan' });
      }
      if (rows[0].status === 'completed') {
        await conn.rollback();
        return res.status(400).json({ message: 'Jadwal sudah completed' });
      }

      await conn.query(
        'UPDATE jadwal_proyek SET status = "completed", updated_at = NOW() WHERE id = ?',
        [id]
      );

      // Bersihkan data terkait proyek/internship
      await conn.query(
        'DELETE ns FROM nilai_sidang ns JOIN sidang s ON ns.sidang_id = s.id'
      );
      await conn.query('DELETE FROM sidang');
      await conn.query('DELETE FROM laporan_sidang');
      await conn.query('DELETE FROM bimbingan');
      await conn.query(
        "UPDATE mahasiswa SET judul_proyek = NULL, file_proposal = NULL, status_proposal = 'pending', dosen_pembimbing_id = NULL"
      );

      // Koordinator yang menutup jadwal dinonaktifkan
      await conn.query('UPDATE koordinator SET is_active = 0 WHERE id = ?', [req.user.id]);

      await conn.commit();
      res.json({ message: 'Jadwal diselesaikan dan data dibersihkan' });
    } catch (err) {
      await conn.rollback();
      next(err);
    } finally {
      conn.release();
    }
  },
};

export default jadwalController;
