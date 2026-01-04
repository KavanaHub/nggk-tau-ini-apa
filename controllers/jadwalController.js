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

      // ============================================
      // VALIDASI: Koordinator harus memiliki role koordinator
      // ============================================
      const [roleRows] = await pool.query(
        `SELECT EXISTS (
          SELECT 1 FROM dosen_role dr 
          JOIN role r ON dr.role_id = r.id 
          WHERE dr.dosen_id = ? AND r.nama_role = 'koordinator'
        ) as is_koordinator`,
        [req.user.id]
      );

      if (!roleRows[0].is_koordinator) {
        return res.status(403).json({ message: 'Anda bukan koordinator. Silakan hubungi Kaprodi.' });
      }

      // Check if this semester already has an active jadwal by someone else
      const [existingJadwal] = await pool.query(
        `SELECT jp.id, d.nama as koordinator_nama 
         FROM jadwal_proyek jp 
         JOIN dosen d ON jp.created_by = d.id
         WHERE jp.semester = ? AND jp.status = 'active'`,
        [semester]
      );
      if (existingJadwal.length > 0) {
        return res.status(400).json({
          message: `Semester ${semester} sudah ada jadwal aktif oleh ${existingJadwal[0].koordinator_nama}`
        });
      }

      // Check if this koordinator already has an active jadwal
      const [activeJadwal] = await pool.query(
        `SELECT id, nama, semester FROM jadwal_proyek WHERE created_by = ? AND status = 'active'`,
        [req.user.id]
      );
      if (activeJadwal.length > 0) {
        return res.status(400).json({
          message: `Anda sudah memiliki jadwal aktif: "${activeJadwal[0].nama}" (Semester ${activeJadwal[0].semester}). Akhiri jadwal tersebut terlebih dahulu.`
        });
      }

      const start = new Date(start_date);
      const end = new Date(end_date);
      if (isNaN(start) || isNaN(end)) {
        return res.status(400).json({ message: 'start_date atau end_date tidak valid' });
      }
      if (end < start) {
        return res.status(400).json({ message: 'end_date harus sesudah atau sama dengan start_date' });
      }

      // Check if there's already an active period for this semester (global check)
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
        [nama, tipe, semester, start_date, end_date, deskripsi || null, req.user.id]
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
        'SELECT status, semester, created_by FROM jadwal_proyek WHERE id = ? FOR UPDATE',
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

      // Update status jadwal
      await conn.query(
        'UPDATE jadwal_proyek SET status = "completed", updated_at = NOW() WHERE id = ?',
        [id]
      );

      // ==================================================
      // Hapus role koordinator dari dosen yang membuat jadwal ini
      // ==================================================
      const createdById = rows[0].created_by;
      if (createdById) {
        // Remove 'koordinator' role from dosen_role (includes assigned_semester)
        await conn.query(
          `DELETE dr FROM dosen_role dr
           JOIN role r ON dr.role_id = r.id
           WHERE dr.dosen_id = ? AND r.nama_role = 'koordinator'`,
          [createdById]
        );
      }

      await conn.commit();
      res.json({ message: 'Periode berhasil diakhiri. Role koordinator telah dihapus.' });
    } catch (err) {
      await conn.rollback();
      console.error('Complete jadwal error:', err);
      next(err);
    } finally {
      conn.release();
    }
  },
};

export default jadwalController;
