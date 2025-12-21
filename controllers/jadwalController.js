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
      // VALIDASI: Koordinator harus di-assign oleh kaprodi
      // ============================================
      const [dosenRows] = await pool.query(
        'SELECT assigned_semester, jabatan FROM dosen WHERE id = ?',
        [req.user.id]
      );

      if (dosenRows.length === 0) {
        return res.status(403).json({ message: 'Data koordinator tidak ditemukan' });
      }

      const assignedSemester = dosenRows[0].assigned_semester;

      // Cek apakah sudah di-assign oleh kaprodi
      if (!assignedSemester) {
        return res.status(403).json({
          message: 'Anda belum di-assign sebagai koordinator oleh Kaprodi. Silakan hubungi Kaprodi untuk mendapat assignment.'
        });
      }

      // ============================================
      // VALIDASI: Hanya bisa buat jadwal sesuai semester yang di-assign
      // ============================================
      if (parseInt(semester) !== assignedSemester) {
        return res.status(403).json({
          message: `Anda hanya bisa membuat jadwal untuk semester ${assignedSemester} (yang di-assign oleh Kaprodi)`
        });
      }

      // ============================================
      // VALIDASI: Koordinator hanya bisa punya 1 jadwal aktif
      // ============================================
      const [activeJadwal] = await pool.query(
        `SELECT id, nama FROM jadwal_proyek WHERE created_by = ? AND status = 'active'`,
        [req.user.id]
      );
      if (activeJadwal.length > 0) {
        return res.status(400).json({
          message: `Anda sudah memiliki jadwal aktif: "${activeJadwal[0].nama}". Akhiri jadwal tersebut terlebih dahulu untuk membuat jadwal baru.`
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
        // 1. Hapus assigned_semester
        await conn.query(
          'UPDATE dosen SET assigned_semester = NULL WHERE id = ?',
          [createdById]
        );

        // 2. Hapus 'koordinator' dari jabatan
        // Ambil jabatan saat ini
        const [dosenRows] = await conn.query(
          'SELECT jabatan FROM dosen WHERE id = ?',
          [createdById]
        );

        if (dosenRows.length > 0 && dosenRows[0].jabatan) {
          const currentJabatan = dosenRows[0].jabatan;
          // Remove 'koordinator' from jabatan string
          let newJabatan = currentJabatan
            .split(',')
            .map(j => j.trim())
            .filter(j => j.toLowerCase() !== 'koordinator')
            .join(', ');

          // Jika tidak ada jabatan tersisa, set default 'dosen'
          if (!newJabatan) {
            newJabatan = 'dosen';
          }

          await conn.query(
            'UPDATE dosen SET jabatan = ? WHERE id = ?',
            [newJabatan, createdById]
          );
        }
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
